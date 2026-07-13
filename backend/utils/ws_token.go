package utils

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

func wsTokenSecret() []byte {
	// 与现有系统保持一致：优先使用 ENCRYPTION_KEY；未设置时回退固定开发值。
	secret := os.Getenv("ENCRYPTION_KEY")
	if secret == "" {
		secret = "abcdefghijklmnopqrstuvwxyz123456"
	}
	return []byte(secret)
}

// GenerateWSToken 生成客服 WebSocket 短期令牌。
func GenerateWSToken(userID uint, ttl time.Duration) (token string, expireAt int64, err error) {
	if userID == 0 {
		return "", 0, fmt.Errorf("invalid user id")
	}
	if ttl <= 0 {
		ttl = 24 * time.Hour
	}
	expireAt = time.Now().Add(ttl).Unix()
	payload := fmt.Sprintf("%d:%d", userID, expireAt)
	payloadEnc := base64.RawURLEncoding.EncodeToString([]byte(payload))

	mac := hmac.New(sha256.New, wsTokenSecret())
	_, _ = mac.Write([]byte(payloadEnc))
	signature := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return payloadEnc + "." + signature, expireAt, nil
}

// ParseAgentToken 解析并校验客服会话令牌，返回 userID（用于 HTTP API 鉴权）。
func ParseAgentToken(token string) (userID uint, ok bool) {
	if token == "" {
		return 0, false
	}
	parts := strings.Split(token, ".")
	if len(parts) != 2 {
		return 0, false
	}
	payloadEnc, signature := parts[0], parts[1]

	mac := hmac.New(sha256.New, wsTokenSecret())
	_, _ = mac.Write([]byte(payloadEnc))
	expectedSig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
		return 0, false
	}

	payloadRaw, err := base64.RawURLEncoding.DecodeString(payloadEnc)
	if err != nil {
		return 0, false
	}
	payloadParts := strings.Split(string(payloadRaw), ":")
	if len(payloadParts) != 2 {
		return 0, false
	}
	uid64, err := strconv.ParseUint(payloadParts[0], 10, 64)
	if err != nil || uid64 == 0 {
		return 0, false
	}
	expireAt, err := strconv.ParseInt(payloadParts[1], 10, 64)
	if err != nil {
		return 0, false
	}
	if time.Now().Unix() > expireAt {
		return 0, false
	}
	return uint(uid64), true
}

// ValidateWSToken 校验客服 WebSocket 令牌是否与用户匹配且未过期。
func ValidateWSToken(token string, expectedUserID uint) bool {
	if expectedUserID == 0 || token == "" {
		return false
	}
	uid, ok := ParseAgentToken(token)
	return ok && uid == expectedUserID
}

