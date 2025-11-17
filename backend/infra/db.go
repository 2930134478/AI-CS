package infra

import (
	"fmt"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// 初始化数据库连接（从环境变量读取配置）
// 需要的环境变量：
// DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
func NewDB() (*gorm.DB, error) {
	host := os.Getenv("DB_HOST")
	port := os.Getenv("DB_PORT")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	name := os.Getenv("DB_NAME")

	// 最小校验，避免使用硬编码默认值
	if host == "" || port == "" || user == "" || name == "" {
		return nil, fmt.Errorf("database env not set: require DB_HOST, DB_PORT, DB_USER, DB_NAME")
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true&charset=utf8mb4&loc=Local", user, password, host, port, name)
	return gorm.Open(mysql.Open(dsn), &gorm.Config{})
}
