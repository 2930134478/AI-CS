package controller

import (
	"log"
	"net/http"
	"strconv"

	"github.com/2930134478/AI-CS/backend/service"
	"github.com/gin-gonic/gin"
)

// StatisticsController 负责处理统计数据相关的 HTTP 请求。
type StatisticsController struct {
	service *service.StatisticsService
}

// NewStatisticsController 创建 StatisticsController 实例。
func NewStatisticsController(service *service.StatisticsService) *StatisticsController {
	return &StatisticsController{service: service}
}

// GetDashboardStats 获取 Dashboard 概览统计数据。
// GET /statistics/dashboard
func (c *StatisticsController) GetDashboardStats(ctx *gin.Context) {
	stats, err := c.service.GetDashboardStats()
	if err != nil {
		log.Printf("获取Dashboard统计数据失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取统计数据失败"})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}

// GetConversationTrend 获取对话趋势数据。
// GET /statistics/conversations/trend?days=7
func (c *StatisticsController) GetConversationTrend(ctx *gin.Context) {
	days := 7
	if daysStr := ctx.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	trend, err := c.service.GetConversationTrend(days)
	if err != nil {
		log.Printf("获取对话趋势数据失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取趋势数据失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"trend": trend,
		"days":  days,
	})
}

// GetAgentWorkload 获取客服工作量统计。
// GET /statistics/agents/workload?days=7
func (c *StatisticsController) GetAgentWorkload(ctx *gin.Context) {
	days := 7
	if daysStr := ctx.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	workload, err := c.service.GetAgentWorkload(days)
	if err != nil {
		log.Printf("获取客服工作量数据失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取工作量数据失败"})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"workload": workload,
		"days":     days,
	})
}

// GetVisitorAnalytics 获取访客分析数据。
// GET /statistics/visitors?days=7
func (c *StatisticsController) GetVisitorAnalytics(ctx *gin.Context) {
	days := 7
	if daysStr := ctx.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	analytics, err := c.service.GetVisitorAnalytics(days)
	if err != nil {
		log.Printf("获取访客分析数据失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取访客分析数据失败"})
		return
	}

	ctx.JSON(http.StatusOK, analytics)
}

// GetAIStats 获取AI统计数据。
// GET /statistics/ai?days=7
func (c *StatisticsController) GetAIStats(ctx *gin.Context) {
	days := 7
	if daysStr := ctx.Query("days"); daysStr != "" {
		if d, err := strconv.Atoi(daysStr); err == nil && d > 0 {
			days = d
		}
	}

	stats, err := c.service.GetAIStats(days)
	if err != nil {
		log.Printf("获取AI统计数据失败: %v", err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "获取AI统计数据失败"})
		return
	}

	ctx.JSON(http.StatusOK, stats)
}
