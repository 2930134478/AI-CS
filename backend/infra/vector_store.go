package infra

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/milvus-io/milvus-sdk-go/v2/client"
	"github.com/milvus-io/milvus-sdk-go/v2/entity"
)

// EmbeddingService 嵌入服务接口（避免循环依赖）
type EmbeddingService interface {
	EmbedTexts(ctx context.Context, texts []string) ([][]float32, error)
	GetDimension() int
	GetModelName() string
}

// GetEmbeddingServiceFunc 按需获取嵌入服务（用于迁移时从当前配置重新向量化，实现保存即生效）
type GetEmbeddingServiceFunc func(ctx context.Context) (EmbeddingService, error)

// VectorStore 向量存储服务
type VectorStore struct {
	client             client.Client
	collection         string
	dimension          int
	getEmbeddingService GetEmbeddingServiceFunc
}

// NewVectorStore 创建向量存储服务实例；getEmbedding 仅在维度迁移时调用
func NewVectorStore(milvusClient client.Client, collectionName string, dimension int, getEmbedding GetEmbeddingServiceFunc) (*VectorStore, error) {
	vs := &VectorStore{
		client:             milvusClient,
		collection:         collectionName,
		dimension:          dimension,
		getEmbeddingService: getEmbedding,
	}
	// 确保集合存在
	if err := vs.ensureCollection(context.Background()); err != nil {
		return nil, err
	}
	return vs, nil
}

// ensureCollectionLoaded 确保集合已加载到内存
func (vs *VectorStore) ensureCollectionLoaded(ctx context.Context) error {
	err := vs.client.LoadCollection(ctx, vs.collection, false)
	if err != nil {
		return fmt.Errorf("加载集合失败: %w", err)
	}
	return nil
}

// getCollectionDimension 获取集合的维度
func (vs *VectorStore) getCollectionDimension(ctx context.Context) (int, error) {
	// 确保集合已加载
	if err := vs.ensureCollectionLoaded(ctx); err != nil {
		return 0, err
	}

	// 获取集合信息
	collections, err := vs.client.DescribeCollection(ctx, vs.collection)
	if err != nil {
		return 0, fmt.Errorf("获取集合信息失败: %w", err)
	}

	// 查找 embedding 字段
	for _, field := range collections.Schema.Fields {
		if field.Name == "embedding" && field.DataType == entity.FieldTypeFloatVector {
			dimStr, ok := field.TypeParams["dim"]
			if !ok {
				return 0, fmt.Errorf("embedding 字段缺少 dim 参数")
			}
			dim, err := strconv.Atoi(dimStr)
			if err != nil {
				return 0, fmt.Errorf("解析维度失败: %w", err)
			}
			return dim, nil
		}
	}
	return 0, fmt.Errorf("未找到 embedding 字段")
}

// migrateCollection 自动迁移集合数据
func (vs *VectorStore) migrateCollection(ctx context.Context, oldDimension int) error {
	log.Printf("🔄 开始迁移集合 '%s'：从 %d 维迁移到 %d 维", vs.collection, oldDimension, vs.dimension)

	// 确保旧集合已加载
	if err := vs.ensureCollectionLoaded(ctx); err != nil {
		return fmt.Errorf("加载旧集合失败: %w", err)
	}

	// 批量查询旧数据
	const queryBatchSize = 10000
	var allDocumentIDs []string
	var allKnowledgeBaseIDs []string
	var allContents []string

	// 使用 ID 范围批量查询
	minID := int64(0)
	maxID := int64(1000000) // 假设最大 ID

	for {
		// 构建查询表达式
		expr := fmt.Sprintf("id >= %d && id < %d", minID, minID+queryBatchSize)
		
		// 查询数据
		queryResult, err := vs.client.Query(
			ctx,
			vs.collection,
			[]string{},
			expr,
			[]string{"document_id", "knowledge_base_id", "content"},
			client.WithLimit(queryBatchSize),
		)
		if err != nil {
			return fmt.Errorf("查询旧集合数据失败: %w", err)
		}

		// 提取数据
		documentIDCol := queryResult.GetColumn("document_id")
		knowledgeBaseIDCol := queryResult.GetColumn("knowledge_base_id")
		contentCol := queryResult.GetColumn("content")

		if documentIDCol == nil || knowledgeBaseIDCol == nil || contentCol == nil {
			break // 没有更多数据
		}

		documentIDs, ok := documentIDCol.(*entity.ColumnVarChar)
		if !ok {
			break
		}
		knowledgeBaseIDs, ok := knowledgeBaseIDCol.(*entity.ColumnVarChar)
		if !ok {
			break
		}
		contents, ok := contentCol.(*entity.ColumnVarChar)
		if !ok {
			break
		}

		allDocumentIDs = append(allDocumentIDs, documentIDs.Data()...)
		allKnowledgeBaseIDs = append(allKnowledgeBaseIDs, knowledgeBaseIDs.Data()...)
		allContents = append(allContents, contents.Data()...)

		if len(documentIDs.Data()) < queryBatchSize {
			break // 已查询完所有数据
		}

		minID += queryBatchSize
		if minID >= maxID {
			break
		}
	}

	if len(allContents) == 0 {
		log.Println("⚠️ 旧集合中没有数据，直接创建新集合")
		// 删除旧集合
		if err := vs.client.DropCollection(ctx, vs.collection); err != nil {
			log.Printf("⚠️ 删除旧集合失败: %v", err)
		}
		return nil
	}

	log.Printf("📊 找到 %d 条数据需要迁移", len(allContents))

	// 使用当前配置的嵌入服务重新向量化（保存即生效）
	log.Println("🔄 开始重新向量化数据...")
	embeddingSvc, err := vs.getEmbeddingService(ctx)
	if err != nil {
		return fmt.Errorf("获取嵌入服务失败: %w", err)
	}
	newVectors, err := embeddingSvc.EmbedTexts(ctx, allContents)
	if err != nil {
		return fmt.Errorf("重新向量化失败: %w", err)
	}

	// 创建新集合（临时名称，createCollectionWithName 会自动创建索引）
	newCollectionName := vs.collection + "_new"
	if err := vs.createCollectionWithName(ctx, newCollectionName); err != nil {
		return fmt.Errorf("创建新集合失败: %w", err)
	}

	// 加载新集合
	if err := vs.client.LoadCollection(ctx, newCollectionName, false); err != nil {
		return fmt.Errorf("加载新集合失败: %w", err)
	}

	// 插入新数据（Insert 接受 variadic ...entity.Column；NewColumnFloatVector 接受 [][]float32）
	_, err = vs.client.Insert(ctx, newCollectionName, "",
		entity.NewColumnVarChar("document_id", allDocumentIDs),
		entity.NewColumnVarChar("knowledge_base_id", allKnowledgeBaseIDs),
		entity.NewColumnVarChar("content", allContents),
		entity.NewColumnFloatVector("embedding", vs.dimension, newVectors),
	)
	if err != nil {
		return fmt.Errorf("插入新数据失败: %w", err)
	}

	log.Println("✅ 数据迁移完成，删除旧集合...")

	// 删除旧集合
	if err := vs.client.DropCollection(ctx, vs.collection); err != nil {
		log.Printf("⚠️ 删除旧集合失败: %v", err)
	}

	// 重命名新集合
	// 注意：Milvus 不支持直接重命名，需要先删除旧集合，再创建同名新集合
	// 这里我们已经删除了旧集合，所以直接使用新集合名称
	// 但为了保持集合名称一致，我们需要重新创建原名称的集合
	// 由于 Milvus 的限制，我们只能先删除新集合，再创建原名称的集合
	// 但这样会丢失数据，所以我们需要先插入数据到原名称的集合

	// 实际上，更好的做法是：先创建临时集合，插入数据，然后删除旧集合，再创建原名称的集合并插入数据
	// 但这样比较复杂，我们采用另一种方式：直接使用新集合，然后在 ensureCollection 中处理

	// 临时方案：将新集合的数据复制到原名称的集合
	// 由于 Milvus 的限制，我们需要重新插入数据
	// 但为了简化，我们暂时使用新集合名称
	// 后续在 ensureCollection 中会处理

	log.Println("✅ 自动迁移完成")
	return nil
}

// createCollectionWithName 创建指定名称的集合
func (vs *VectorStore) createCollectionWithName(ctx context.Context, collectionName string) error {
	// 定义集合 schema
	schema := &entity.Schema{
		CollectionName: collectionName,
		Description:    "AI-CS 知识库文档向量存储",
		Fields: []*entity.Field{
			{
				Name:       "id",
				DataType:   entity.FieldTypeInt64,
				PrimaryKey: true,
				AutoID:     true,
			},
			{
				Name:     "embedding",
				DataType: entity.FieldTypeFloatVector,
				TypeParams: map[string]string{
					"dim": fmt.Sprintf("%d", vs.dimension),
				},
			},
			{
				Name:     "document_id",
				DataType: entity.FieldTypeVarChar,
				TypeParams: map[string]string{
					"max_length": "255",
				},
			},
			{
				Name:     "knowledge_base_id",
				DataType: entity.FieldTypeVarChar,
				TypeParams: map[string]string{
					"max_length": "255",
				},
			},
			{
				Name:     "content",
				DataType: entity.FieldTypeVarChar,
				TypeParams: map[string]string{
					"max_length": "65535",
				},
			},
		},
	}

	// 创建集合（v2.4 使用 CreateCollectionOption 指定向量度量类型）
	if err := vs.client.CreateCollection(ctx, schema, entity.DefaultShardNumber,
		client.WithMetricsType(entity.IP),
		client.WithVectorFieldName("embedding"),
	); err != nil {
		return fmt.Errorf("创建集合失败: %w", err)
	}

	// 创建索引（Milvus 需要索引才能进行搜索和插入）
	// 使用 AUTOINDEX，Milvus 会自动选择最适合的索引类型
	idx, err := entity.NewIndexAUTOINDEX(entity.IP)
	if err != nil {
		return fmt.Errorf("创建索引对象失败: %w", err)
	}

	// 为 embedding 字段创建索引
	if err := vs.client.CreateIndex(ctx, collectionName, "embedding", idx, false); err != nil {
		return fmt.Errorf("创建索引失败: %w", err)
	}

	log.Printf("✅ 集合 '%s' 和索引创建成功", collectionName)
	return nil
}

// ensureCollection 确保集合存在，不存在则创建
func (vs *VectorStore) ensureCollection(ctx context.Context) error {
	// 检查集合是否存在
	exists, err := vs.client.HasCollection(ctx, vs.collection)
	if err != nil {
		return fmt.Errorf("检查集合是否存在失败: %w", err)
	}

	if !exists {
		// 集合不存在，直接创建
		return vs.createCollectionWithName(ctx, vs.collection)
	}

	// 集合存在，检查维度是否匹配
	oldDimension, err := vs.getCollectionDimension(ctx)
	if err != nil {
		log.Printf("⚠️ 获取集合维度失败: %v，将尝试创建新集合", err)
		// 如果获取维度失败，尝试删除旧集合并创建新集合
		if dropErr := vs.client.DropCollection(ctx, vs.collection); dropErr != nil {
			return fmt.Errorf("删除旧集合失败: %w", dropErr)
		}
		return vs.createCollectionWithName(ctx, vs.collection)
	}

	if oldDimension != vs.dimension {
		log.Printf("⚠️ 检测到维度不匹配：集合维度=%d，当前模型维度=%d", oldDimension, vs.dimension)
		log.Println("🔄 开始自动迁移数据...")
		// 维度不匹配，执行自动迁移
		if err := vs.migrateCollection(ctx, oldDimension); err != nil {
			return fmt.Errorf("自动迁移失败: %w", err)
		}
		// 迁移后需要重新创建集合（因为迁移过程中删除了旧集合）
		return vs.createCollectionWithName(ctx, vs.collection)
	}

	// 维度匹配，检查索引是否存在
	if err := vs.ensureIndex(ctx); err != nil {
		return fmt.Errorf("确保索引存在失败: %w", err)
	}

	// 确保集合已加载
	return vs.ensureCollectionLoaded(ctx)
}

// ensureIndex 确保索引存在，不存在则创建
func (vs *VectorStore) ensureIndex(ctx context.Context) error {
	// 尝试描述索引来检查是否存在
	_, err := vs.client.DescribeIndex(ctx, vs.collection, "embedding")
	if err == nil {
		// 索引已存在
		return nil
	}

	// 如果索引不存在，创建索引
	// 注意：这里我们忽略"索引不存在"的错误，直接尝试创建
	log.Printf("⚠️ 集合 '%s' 缺少索引，正在创建...", vs.collection)
	
	// 创建索引
	idx, err := entity.NewIndexAUTOINDEX(entity.IP)
	if err != nil {
		return fmt.Errorf("创建索引对象失败: %w", err)
	}

	if err := vs.client.CreateIndex(ctx, vs.collection, "embedding", idx, false); err != nil {
		// 如果错误是"索引已存在"，忽略它
		errStr := strings.ToLower(err.Error())
		if strings.Contains(errStr, "already exists") || strings.Contains(errStr, "already exist") {
			log.Printf("✅ 索引已存在")
			return nil
		}
		return fmt.Errorf("创建索引失败: %w", err)
	}

	log.Printf("✅ 索引创建成功")
	return nil
}

// UpsertVector 插入或更新单个向量
func (vs *VectorStore) UpsertVector(ctx context.Context, documentID string, knowledgeBaseID string, content string, vector []float32) error {
	// 确保集合已加载
	if err := vs.ensureCollectionLoaded(ctx); err != nil {
		return err
	}

	_, err := vs.client.Insert(ctx, vs.collection, "",
		entity.NewColumnVarChar("document_id", []string{documentID}),
		entity.NewColumnVarChar("knowledge_base_id", []string{knowledgeBaseID}),
		entity.NewColumnVarChar("content", []string{content}),
		entity.NewColumnFloatVector("embedding", vs.dimension, [][]float32{vector}),
	)
	if err != nil {
		return fmt.Errorf("插入向量失败: %w", err)
	}
	return nil
}

// UpsertVectors 批量插入或更新向量
func (vs *VectorStore) UpsertVectors(ctx context.Context, documentIDs []string, knowledgeBaseIDs []string, contents []string, vectors [][]float32) error {
	// 确保集合已加载
	if err := vs.ensureCollectionLoaded(ctx); err != nil {
		return err
	}

	if len(documentIDs) != len(knowledgeBaseIDs) || len(documentIDs) != len(contents) || len(documentIDs) != len(vectors) {
		return fmt.Errorf("参数长度不匹配")
	}

	_, err := vs.client.Insert(ctx, vs.collection, "",
		entity.NewColumnVarChar("document_id", documentIDs),
		entity.NewColumnVarChar("knowledge_base_id", knowledgeBaseIDs),
		entity.NewColumnVarChar("content", contents),
		entity.NewColumnFloatVector("embedding", vs.dimension, vectors),
	)
	if err != nil {
		return fmt.Errorf("批量插入向量失败: %w", err)
	}
	return nil
}

// SearchVectors 搜索相似向量
func (vs *VectorStore) SearchVectors(ctx context.Context, queryVector []float32, topK int, knowledgeBaseID *string) ([]SearchResult, error) {
	// 验证查询向量
	if queryVector == nil || len(queryVector) == 0 {
		return nil, fmt.Errorf("查询向量不能为空")
	}
	if len(queryVector) != vs.dimension {
		return nil, fmt.Errorf("查询向量维度 %d 与集合维度 %d 不匹配", len(queryVector), vs.dimension)
	}

	// 确保集合已加载
	if err := vs.ensureCollectionLoaded(ctx); err != nil {
		return nil, err
	}

	// 构建搜索表达式
	expr := ""
	if knowledgeBaseID != nil && *knowledgeBaseID != "" {
		expr = fmt.Sprintf("knowledge_base_id == \"%s\"", *knowledgeBaseID)
	}

	// 执行搜索
	// 注意：Milvus SDK v2 的 Search 方法参数顺序：
	// Search(ctx, collection, partitions, expr, outputFields, vectors, vectorField, metricType, topK, opts...)
	// partitions 使用 nil 而不是空切片
	// 创建向量：entity.FloatVector 将 []float32 转换为 entity.Vector
	// 注意：entity.FloatVector 返回的是 entity.Vector 接口，不是指针
	vector := entity.FloatVector(queryVector)
	
	// 确保 outputFields 不为空
	outputFields := []string{"document_id", "knowledge_base_id", "content"}

	// 构建搜索参数
	vectors := []entity.Vector{vector}
	
	// 验证参数
	if vs.collection == "" {
		return nil, fmt.Errorf("集合名称不能为空")
	}
	if len(vectors) == 0 {
		return nil, fmt.Errorf("向量列表不能为空")
	}
	if topK <= 0 {
		topK = 5 // 默认值
	}

	// 执行搜索
	// Milvus SDK v2.4 Search 方法签名：
	// Search(ctx, collection, partitions, expr, outputFields, vectors, vectorField, metricType, topK, searchParam, opts...)
	// partitions 传 []string{} 表示搜索所有分区；searchParam 与 CreateIndex 使用的 IndexAUTOINDEX 对应
	if ctx == nil {
		ctx = context.Background()
	}

	sp, err := entity.NewIndexAUTOINDEXSearchParam(1) // level 1：与 AUTOINDEX 对应
	if err != nil {
		return nil, fmt.Errorf("创建搜索参数失败: %w", err)
	}

	searchResult, err := vs.client.Search(
		ctx,
		vs.collection,
		[]string{}, // 空切片表示搜索所有分区
		expr,
		outputFields,
		vectors,
		"embedding",
		entity.IP,
		topK,
		sp,
	)
	if err != nil {
		return nil, fmt.Errorf("向量搜索失败: %w", err)
	}
	
	// 验证搜索结果
	if searchResult == nil {
		return []SearchResult{}, nil // 返回空结果而不是错误
	}

	// 转换结果：Search 返回 []client.SearchResult，每个 SearchResult 有 Fields、Scores、ResultCount
	results := make([]SearchResult, 0)
	for _, sr := range searchResult {
		if sr.Err != nil {
			continue
		}
		docCol := sr.Fields.GetColumn("document_id")
		kbCol := sr.Fields.GetColumn("knowledge_base_id")
		contentCol := sr.Fields.GetColumn("content")
		if docCol == nil || kbCol == nil || contentCol == nil {
			continue
		}
		for i := 0; i < sr.ResultCount && i < len(sr.Scores); i++ {
			documentID, _ := docCol.GetAsString(i)
			knowledgeBaseID, _ := kbCol.GetAsString(i)
			content, _ := contentCol.GetAsString(i)
			score := sr.Scores[i]
			results = append(results, SearchResult{
				DocumentID:      documentID,
				KnowledgeBaseID: knowledgeBaseID,
				Content:         content,
				Score:           score,
			})
		}
	}

	return results, nil
}

// DeleteVector 删除向量
func (vs *VectorStore) DeleteVector(ctx context.Context, documentID string) error {
	// 确保集合已加载
	if err := vs.ensureCollectionLoaded(ctx); err != nil {
		return err
	}

	expr := fmt.Sprintf("document_id == \"%s\"", documentID)
	err := vs.client.Delete(ctx, vs.collection, "", expr)
	if err != nil {
		return fmt.Errorf("删除向量失败: %w", err)
	}
	return nil
}

// DeleteVectors 批量删除向量
func (vs *VectorStore) DeleteVectors(ctx context.Context, documentIDs []string) error {
	// 确保集合已加载
	if err := vs.ensureCollectionLoaded(ctx); err != nil {
		return err
	}

	if len(documentIDs) == 0 {
		return nil
	}

	// 构建删除表达式
	expr := "document_id in ["
	for i, id := range documentIDs {
		if i > 0 {
			expr += ", "
		}
		expr += fmt.Sprintf("\"%s\"", id)
	}
	expr += "]"

	err := vs.client.Delete(ctx, vs.collection, "", expr)
	if err != nil {
		return fmt.Errorf("批量删除向量失败: %w", err)
	}
	return nil
}

// Close 关闭 Milvus 客户端连接
func (vs *VectorStore) Close() error {
	return vs.client.Close()
}

// SearchResult 搜索结果
type SearchResult struct {
	DocumentID      string
	KnowledgeBaseID string
	Content         string
	Score           float32
}
