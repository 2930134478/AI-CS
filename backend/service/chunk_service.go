package service

import (
	"context"
	"errors"
	"fmt"
	"log"
	"strings"
	"unicode/utf8"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/service/rag"
)

// ChunkService 文档分段服务
type ChunkService struct {
	docRepo      *repository.DocumentRepository
	kbRepo       *repository.KnowledgeBaseRepository
	chunkRepo    *repository.DocumentChunkRepository
	embeddingSvc *rag.DocumentEmbeddingService
	vectorStore  *rag.VectorStoreService
}

// NewChunkService 创建分段服务实例
func NewChunkService(
	docRepo *repository.DocumentRepository,
	kbRepo *repository.KnowledgeBaseRepository,
	chunkRepo *repository.DocumentChunkRepository,
	embeddingSvc *rag.DocumentEmbeddingService,
	vectorStore *rag.VectorStoreService,
) *ChunkService {
	return &ChunkService{
		docRepo:      docRepo,
		kbRepo:       kbRepo,
		chunkRepo:    chunkRepo,
		embeddingSvc: embeddingSvc,
		vectorStore:  vectorStore,
	}
}

// ChunkRequest 分段请求参数
type ChunkRequest struct {
	Method    string `json:"method"`               // "char_count" | "separator"
	ChunkSize int    `json:"chunk_size,omitempty"` // 按字数时的每段字数
	Separator string `json:"separator,omitempty"`  // 按分隔符时的分隔符
}

// ChunkByCharCount 按字数分段（不重叠）
func ChunkByCharCount(text string, chunkSize int) []string {
	if chunkSize <= 0 {
		chunkSize = 500
	}

	runes := []rune(text)
	if len(runes) <= chunkSize {
		return []string{text}
	}

	var chunks []string
	for i := 0; i < len(runes); i += chunkSize {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunks = append(chunks, string(runes[i:end]))
	}
	return chunks
}

// ChunkBySeparator 按分隔符分段
func ChunkBySeparator(text string, sep string) []string {
	if sep == "" {
		return []string{text}
	}

	parts := strings.Split(text, sep)
	var chunks []string
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			chunks = append(chunks, trimmed)
		}
	}
	if len(chunks) == 0 {
		return []string{text}
	}
	return chunks
}

// ExecuteChunking 执行分段：切分文本 → 写入 MySQL → 删除旧 Milvus 向量 → 逐段向量化写入 Milvus
func (s *ChunkService) ExecuteChunking(ctx context.Context, documentID uint, req ChunkRequest) ([]models.DocumentChunk, error) {
	doc, err := s.docRepo.GetByID(documentID)
	if err != nil {
		return nil, fmt.Errorf("文档不存在: %w", err)
	}

	if strings.TrimSpace(doc.Content) == "" {
		return nil, errors.New("文档内容为空，无法分段")
	}

	var chunkTexts []string
	switch req.Method {
	case "char_count":
		size := req.ChunkSize
		if size <= 0 {
			size = 500
		}
		chunkTexts = ChunkByCharCount(doc.Content, size)
	case "separator":
		if req.Separator == "" {
			return nil, errors.New("分隔符不能为空")
		}
		chunkTexts = ChunkBySeparator(doc.Content, req.Separator)
	default:
		return nil, fmt.Errorf("不支持的分段方式: %s（支持 char_count 或 separator）", req.Method)
	}

	if len(chunkTexts) == 0 {
		return nil, errors.New("分段结果为空")
	}

	if err := s.deleteExistingChunks(ctx, documentID); err != nil {
		return nil, fmt.Errorf("删除旧分段失败: %w", err)
	}

	chunks := make([]*models.DocumentChunk, len(chunkTexts))
	for i, text := range chunkTexts {
		chunks[i] = &models.DocumentChunk{
			DocumentID:      documentID,
			KnowledgeBaseID: doc.KnowledgeBaseID,
			ChunkIndex:      i,
			Content:         text,
			EmbeddingStatus: "pending",
		}
	}
	if err := s.chunkRepo.BatchCreate(chunks); err != nil {
		return nil, fmt.Errorf("保存分段失败: %w", err)
	}

	go s.embedChunks(documentID, doc.KnowledgeBaseID, chunks)

	result := make([]models.DocumentChunk, len(chunks))
	for i, c := range chunks {
		result[i] = *c
	}
	return result, nil
}

// GetChunks 获取文档的分段列表
func (s *ChunkService) GetChunks(documentID uint, page, pageSize int) ([]models.DocumentChunk, int64, error) {
	if _, err := s.docRepo.GetByID(documentID); err != nil {
		return nil, 0, fmt.Errorf("文档不存在: %w", err)
	}
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.chunkRepo.GetByDocumentIDPaginated(documentID, offset, pageSize)
}

// UpdateChunk 更新单个分段内容，仅重新向量化该段
func (s *ChunkService) UpdateChunk(ctx context.Context, chunkID uint, content string) (*models.DocumentChunk, error) {
	chunk, err := s.chunkRepo.GetByID(chunkID)
	if err != nil {
		return nil, fmt.Errorf("分段不存在: %w", err)
	}

	if strings.TrimSpace(content) == "" {
		return nil, errors.New("分段内容不能为空")
	}

	chunk.Content = content
	chunk.EmbeddingStatus = "pending"
	if err := s.chunkRepo.Update(chunk); err != nil {
		return nil, fmt.Errorf("更新分段失败: %w", err)
	}

	go s.reEmbedSingleChunk(chunk)

	return chunk, nil
}

// reEmbedSingleChunk 仅重新向量化单个分段
func (s *ChunkService) reEmbedSingleChunk(chunk *models.DocumentChunk) {
	ctx := context.Background()

	svc, err := s.embeddingSvc.GetEmbeddingService(ctx)
	if err != nil {
		log.Printf("[分段] 获取嵌入服务失败 (chunk=%d): %v", chunk.ID, err)
		_ = s.chunkRepo.UpdateEmbeddingStatus(chunk.ID, "failed")
		return
	}

	vectors, err := svc.EmbedTexts(ctx, []string{chunk.Content})
	if err != nil || len(vectors) == 0 {
		log.Printf("[分段] 单段向量化失败 (chunk=%d): %v", chunk.ID, err)
		_ = s.chunkRepo.UpdateEmbeddingStatus(chunk.ID, "failed")
		return
	}

	chunkIDStr := rag.ConvertDocumentID(chunk.ID)
	_ = s.vectorStore.DeleteVectorByChunkID(ctx, chunkIDStr)

	docIDStr := rag.ConvertDocumentID(chunk.DocumentID)
	kbIDStr := rag.ConvertKnowledgeBaseID(chunk.KnowledgeBaseID)
	if err := s.vectorStore.UpsertVector(ctx, docIDStr, kbIDStr, chunk.Content, chunkIDStr, vectors[0]); err != nil {
		log.Printf("[分段] 单段向量写入失败 (chunk=%d): %v", chunk.ID, err)
		_ = s.chunkRepo.UpdateEmbeddingStatus(chunk.ID, "failed")
		return
	}

	_ = s.chunkRepo.UpdateEmbeddingStatus(chunk.ID, "completed")
	log.Printf("[分段] 单段向量化完成 (chunk=%d, 长度=%d)", chunk.ID, len([]rune(chunk.Content)))
}

// DeleteChunks 删除文档的所有分段（MySQL + Milvus）
func (s *ChunkService) DeleteChunks(ctx context.Context, documentID uint) error {
	return s.deleteExistingChunks(ctx, documentID)
}

// deleteExistingChunks 删除文档的旧分段（MySQL + Milvus）
func (s *ChunkService) deleteExistingChunks(ctx context.Context, documentID uint) error {
	if err := s.chunkRepo.DeleteByDocumentID(documentID); err != nil {
		return err
	}

	docIDStr := rag.ConvertDocumentID(documentID)
	if err := s.vectorStore.DeleteVector(ctx, docIDStr); err != nil {
		log.Printf("[分段] 删除旧向量失败（可能本就没有向量）: %v", err)
	}
	return nil
}

// embedChunks 批量向量化所有分段并写入 Milvus（异步执行）
func (s *ChunkService) embedChunks(documentID uint, knowledgeBaseID uint, chunks []*models.DocumentChunk) {
	ctx := context.Background()
	s.embedChunkList(ctx, documentID, knowledgeBaseID, chunks)
}

// embedChunkList 批量向量化分段列表
func (s *ChunkService) embedChunkList(ctx context.Context, documentID uint, knowledgeBaseID uint, chunks []*models.DocumentChunk) {
	for _, c := range chunks {
		_ = s.chunkRepo.UpdateEmbeddingStatus(c.ID, "processing")
	}

	contents := make([]string, len(chunks))
	for i, c := range chunks {
		contents[i] = c.Content
	}

	docIDs := make([]uint, len(chunks))
	kbIDs := make([]uint, len(chunks))
	chunkIDs := make([]string, len(chunks))
	for i, c := range chunks {
		docIDs[i] = documentID
		kbIDs[i] = knowledgeBaseID
		chunkIDs[i] = rag.ConvertDocumentID(c.ID)
	}

	if err := s.embeddingSvc.EmbedDocuments(ctx, docIDs, kbIDs, contents, chunkIDs); err != nil {
		log.Printf("[分段] 批量向量化失败 (doc=%d): %v", documentID, err)
		for _, c := range chunks {
			_ = s.chunkRepo.UpdateEmbeddingStatus(c.ID, "failed")
		}
		return
	}

	for _, c := range chunks {
		_ = s.chunkRepo.UpdateEmbeddingStatus(c.ID, "completed")
	}
	log.Printf("[分段] 批量向量化完成 (doc=%d, chunks=%d)", documentID, len(chunks))
}

// ensure utf8 package is used
var _ = utf8.RuneCountInString
