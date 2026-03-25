package infra

import (
	"context"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/milvus-io/milvus-sdk-go/v2/client"
)

// MilvusConfig Milvus 连接配置
type MilvusConfig struct {
	Host string
	Port string
}

// GetMilvusConfig 从环境变量读取 Milvus 配置
func GetMilvusConfig() *MilvusConfig {
	host := os.Getenv("MILVUS_HOST")
	if host == "" {
		host = "localhost" // 默认值
	}
	port := os.Getenv("MILVUS_PORT")
	if port == "" {
		port = "19530" // 默认端口
	}
	return &MilvusConfig{
		Host: host,
		Port: port,
	}
}

func envTruthy(key string) bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	return v == "1" || v == "true" || v == "yes" || v == "on"
}

// IsMilvusDisabled 为 true 时跳过连接 Milvus（不参与 RAG / 向量化，核心 HTTP 仍可启动）。
// 环境变量：MILVUS_DISABLED 或 VECTOR_STORE_DISABLED。
func IsMilvusDisabled() bool {
	return envTruthy("MILVUS_DISABLED") || envTruthy("VECTOR_STORE_DISABLED")
}

// IsMilvusRequired 为 true 时，若 Milvus 不可用则启动失败（便于生产环境强依赖向量库时 fail-fast）。
// 环境变量：MILVUS_REQUIRED。
func IsMilvusRequired() bool {
	return envTruthy("MILVUS_REQUIRED")
}

// NewMilvusClient 创建 Milvus 客户端连接
func NewMilvusClient() (client.Client, error) {
	config := GetMilvusConfig()
	// 构建连接地址
	address := fmt.Sprintf("%s:%s", config.Host, config.Port)
	// 创建客户端
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	milvusClient, err := client.NewClient(
		ctx,
		client.Config{
			Address:  address,
			Username: os.Getenv("MILVUS_USERNAME"), // 可选
			Password: os.Getenv("MILVUS_PASSWORD"), // 可选
		},
	)
	if err != nil {
		return nil, fmt.Errorf("连接 Milvus 失败: %w", err)
	}
	return milvusClient, nil
}

// HealthCheck 检查 Milvus 连接健康状态
func HealthCheck(milvusClient client.Client) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	// 尝试列出集合来验证连接
	_, err := milvusClient.ListCollections(ctx)
	if err != nil {
		return fmt.Errorf("Milvus 健康检查失败: %w", err)
	}
	return nil
}
