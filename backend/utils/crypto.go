package utils

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"os"
)

// 获取加密密钥（优先从环境变量读取，否则使用默认值）
// 重要说明：
// 1. 这个密钥是固定的，用于加密/解密所有 API Key
// 2. API Key 的长度可以不同，但都用同一个加密密钥加密
// 3. 如果改变这个密钥，之前加密的 API Key 将无法解密
// 4. 生产环境必须从环境变量 ENCRYPTION_KEY 读取
// AES-256 需要 32 字节的密钥
func getEncryptionKey() []byte {
	key := os.Getenv("ENCRYPTION_KEY")
	if key != "" && len(key) == 32 {
		return []byte(key)
	}
	// 默认密钥（仅用于开发环境，生产环境必须设置 ENCRYPTION_KEY）
	return []byte("abcdefghijklmnopqrstuvwxyz123456") // 32 bytes for AES-256
}

// EncryptAPIKey 加密 API Key
// 参数：
//   - plaintext: 用户输入的 API Key（长度可变，不同服务商不同）
//
// 返回：
//   - 加密后的字符串（base64 编码）
//
// 说明：
//   - 无论 API Key 多长，都用同一个固定的 encryptionKey 加密
//   - 加密密钥（encryptionKey）是固定的，不会因为 API Key 长度变化而改变
func EncryptAPIKey(plaintext string) (string, error) {
	// 验证输入
	if plaintext == "" {
		return "", errors.New("API Key 不能为空")
	}

	// 获取加密密钥（优先从环境变量读取）
	key := getEncryptionKey()
	if len(key) != 32 {
		return "", errors.New("加密密钥长度必须为 32 字节")
	}

	// 创建 AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", fmt.Errorf("创建加密器失败: %v", err)
	}

	// 创建 GCM（Galois/Counter Mode）
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("创建 GCM 失败: %v", err)
	}

	// 生成随机 nonce
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("生成随机数失败: %v", err)
	}

	// 加密数据
	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)

	// 返回 base64 编码的密文
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

// DecryptAPIKey 解密 API Key
func DecryptAPIKey(ciphertext string) (string, error) {
	// 获取加密密钥（优先从环境变量读取）
	key := getEncryptionKey()
	if len(key) != 32 {
		return "", errors.New("加密密钥长度必须为 32 字节")
	}

	// 解码 base64
	data, err := base64.StdEncoding.DecodeString(ciphertext)
	if err != nil {
		return "", err
	}

	// 创建 AES cipher
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}

	// 创建 GCM
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}

	// 检查数据长度
	if len(data) < gcm.NonceSize() {
		return "", errors.New("ciphertext too short")
	}

	// 提取 nonce 和密文
	nonce, ciphertextBytes := data[:gcm.NonceSize()], data[gcm.NonceSize():]

	// 解密数据
	plaintext, err := gcm.Open(nil, nonce, ciphertextBytes, nil)
	if err != nil {
		return "", err
	}

	return string(plaintext), nil
}
