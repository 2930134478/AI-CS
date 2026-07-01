package utils

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
)

// GenerateConversationAccessToken 生成访客会话访问令牌（64 字符 hex，256 bit 熵）。
func GenerateConversationAccessToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("generate conversation access token: %w", err)
	}
	return hex.EncodeToString(b), nil
}
