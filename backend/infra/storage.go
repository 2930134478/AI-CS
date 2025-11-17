package infra

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

// StorageService 文件存储服务接口（可扩展为云存储）
type StorageService interface {
	// SaveAvatar 保存头像文件，返回文件URL
	SaveAvatar(userID uint, file io.Reader, filename string) (string, error)
	// DeleteFile 删除文件
	DeleteFile(fileURL string) error
	// GetFileURL 获取文件的完整URL
	GetFileURL(filePath string) string
}

// LocalStorageService 本地文件存储服务
type LocalStorageService struct {
	baseDir    string // 基础目录
	publicPath string // 公共访问路径
}

// NewLocalStorageService 创建本地存储服务实例
func NewLocalStorageService(baseDir, publicPath string) *LocalStorageService {
	// 确保基础目录存在
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		panic(fmt.Sprintf("创建存储目录失败: %v", err))
	}
	// 确保头像目录存在
	avatarDir := filepath.Join(baseDir, "avatars")
	if err := os.MkdirAll(avatarDir, 0755); err != nil {
		panic(fmt.Sprintf("创建头像目录失败: %v", err))
	}
	return &LocalStorageService{
		baseDir:    baseDir,
		publicPath: publicPath,
	}
}

// SaveAvatar 保存头像文件
func (s *LocalStorageService) SaveAvatar(userID uint, file io.Reader, filename string) (string, error) {
	// 获取文件扩展名
	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".jpg" // 默认使用 jpg
	}
	// 生成唯一文件名：user_{userID}_{timestamp}{ext}
	timestamp := time.Now().Unix()
	newFilename := fmt.Sprintf("user_%d_%d%s", userID, timestamp, ext)
	
	// 保存到 avatars 目录
	avatarDir := filepath.Join(s.baseDir, "avatars")
	filePath := filepath.Join(avatarDir, newFilename)
	
	// 创建文件
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("创建文件失败: %w", err)
	}
	defer dst.Close()
	
	// 复制文件内容
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("保存文件失败: %w", err)
	}
	
	// 返回相对路径（用于构建URL）
	relativePath := filepath.Join("avatars", newFilename)
	return s.GetFileURL(relativePath), nil
}

// DeleteFile 删除文件
func (s *LocalStorageService) DeleteFile(fileURL string) error {
	// 从URL中提取文件路径
	// 假设URL格式为: /uploads/avatars/filename.jpg
	// 需要去掉 /uploads/ 前缀，得到相对路径
	relativePath := fileURL
	if len(s.publicPath) > 0 && len(fileURL) > len(s.publicPath) {
		if fileURL[:len(s.publicPath)] == s.publicPath {
			relativePath = fileURL[len(s.publicPath):]
			// 去掉开头的 /
			if len(relativePath) > 0 && relativePath[0] == '/' {
				relativePath = relativePath[1:]
			}
		}
	}
	
	filePath := filepath.Join(s.baseDir, relativePath)
	if err := os.Remove(filePath); err != nil {
		if os.IsNotExist(err) {
			return nil // 文件不存在，认为删除成功
		}
		return fmt.Errorf("删除文件失败: %w", err)
	}
	return nil
}

// GetFileURL 获取文件的完整URL
func (s *LocalStorageService) GetFileURL(filePath string) string {
	// 确保路径使用正斜杠（用于URL）
	urlPath := filepath.ToSlash(filePath)
	// 如果 publicPath 为空，返回相对路径
	if s.publicPath == "" {
		return "/" + urlPath
	}
	// 确保 publicPath 以 / 结尾
	publicPath := s.publicPath
	if publicPath[len(publicPath)-1] != '/' {
		publicPath += "/"
	}
	// 确保 urlPath 不以 / 开头
	if len(urlPath) > 0 && urlPath[0] == '/' {
		urlPath = urlPath[1:]
	}
	return publicPath + urlPath
}

