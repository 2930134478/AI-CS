package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// FAQController 负责处理 FAQ（常见问题）相关的 HTTP 请求。
type FAQController struct {
	faqService *service.FAQService
}

// NewFAQController 创建 FAQController 实例。
func NewFAQController(faqService *service.FAQService) *FAQController {
	return &FAQController{faqService: faqService}
}

// ListFAQs 获取 FAQ 列表，支持关键词搜索。
// GET /faqs?query=openai%api%调用
func (f *FAQController) ListFAQs(c *gin.Context) {
	// 获取查询参数
	query := c.Query("query")

	// 查询 FAQ 列表
	faqs, err := f.faqService.ListFAQs(query)
	if err != nil {
		log.Printf("查询 FAQ 列表失败: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "查询 FAQ 列表失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"faqs": faqs,
	})
}

// GetFAQ 获取 FAQ 详情。
// GET /faqs/:id
func (f *FAQController) GetFAQ(c *gin.Context) {
	// 获取 ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "FAQ ID 不合法"})
		return
	}

	// 查询 FAQ
	faq, err := f.faqService.GetFAQ(uint(id))
	if err != nil {
		log.Printf("查询 FAQ 失败: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, faq)
}

// CreateFAQ 创建新的 FAQ 记录。
// POST /faqs
func (f *FAQController) CreateFAQ(c *gin.Context) {
	var req struct {
		Question string `json:"question" binding:"required"`
		Answer   string `json:"answer" binding:"required"`
		Keywords string `json:"keywords"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 创建 FAQ
	faq, err := f.faqService.CreateFAQ(service.CreateFAQInput{
		Question: req.Question,
		Answer:   req.Answer,
		Keywords: req.Keywords,
	})
	if err != nil {
		log.Printf("创建 FAQ 失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, faq)
}

// UpdateFAQ 更新 FAQ 记录。
// PUT /faqs/:id
func (f *FAQController) UpdateFAQ(c *gin.Context) {
	// 获取 ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "FAQ ID 不合法"})
		return
	}

	var req struct {
		Question *string `json:"question"`
		Answer   *string `json:"answer"`
		Keywords *string `json:"keywords"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新 FAQ
	faq, err := f.faqService.UpdateFAQ(uint(id), service.UpdateFAQInput{
		Question: req.Question,
		Answer:   req.Answer,
		Keywords: req.Keywords,
	})
	if err != nil {
		log.Printf("更新 FAQ 失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, faq)
}

// DeleteFAQ 删除 FAQ 记录。
// DELETE /faqs/:id
func (f *FAQController) DeleteFAQ(c *gin.Context) {
	// 获取 ID
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil || id == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "FAQ ID 不合法"})
		return
	}

	// 删除 FAQ
	if err := f.faqService.DeleteFAQ(uint(id)); err != nil {
		log.Printf("删除 FAQ 失败: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

