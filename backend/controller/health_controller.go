package controller

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
)

// HealthController 健康检查控制器
type HealthController struct {
	healthChecker interface{} // rag.HealthChecker
	retrievalService interface{} // rag.RetrievalService
}

// NewHealthController 创建健康检查控制器实例
func NewHealthController(healthChecker interface{}, retrievalService interface{}) *HealthController {
	return &HealthController{
		healthChecker: healthChecker,
		retrievalService: retrievalService,
	}
}

// HealthCheck 健康检查
func (c *HealthController) HealthCheck(ctx *gin.Context) {
	// 类型断言获取 healthChecker
	type HealthChecker interface {
		Check(ctx context.Context) error
	}
	
	checker, ok := c.healthChecker.(HealthChecker)
	if !ok {
		ctx.JSON(http.StatusOK, gin.H{
			"status": "healthy",
			"message": "健康检查器未初始化",
		})
		return
	}

	// 执行健康检查
	err := checker.Check(context.Background())
	isHealthy := err == nil
	
	status := "healthy"
	httpStatus := http.StatusOK
	if !isHealthy {
		status = "unhealthy"
		httpStatus = http.StatusServiceUnavailable
	}

	ctx.JSON(httpStatus, gin.H{
		"status": status,
		"error": func() string {
			if err != nil {
				return err.Error()
			}
			return ""
		}(),
	})
}

// Metrics 获取性能指标（GET /health/metrics）
func (c *HealthController) Metrics(ctx *gin.Context) {
	// 类型断言获取 retrievalService
	type RetrievalService interface {
		GetMetrics() map[string]interface{}
	}
	
	service, ok := c.retrievalService.(RetrievalService)
	if !ok {
		ctx.JSON(http.StatusOK, gin.H{
			"message": "性能指标服务未初始化",
		})
		return
	}

	// 获取指标
	metrics := service.GetMetrics()
	ctx.JSON(http.StatusOK, metrics)
}
