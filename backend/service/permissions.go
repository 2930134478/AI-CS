package service

import (
	"encoding/json"
	"errors"
	"sort"
	"strings"
)

// PermissionKey 定义客服端菜单/功能的权限键（单级开关：有/无）。
// 说明：目前系统没有真正的登录态（JWT/Session），所以权限校验依赖 X-User-Id。
type PermissionKey string

const (
	PermChat      PermissionKey = "chat"      // 对话
	PermKBTest    PermissionKey = "kb_test"   // 知识库测试（内部对话）
	PermKnowledge PermissionKey = "knowledge" // 知识库（含文档/导入）
	PermFAQs      PermissionKey = "faqs"      // 事件管理
	PermAnalytics PermissionKey = "analytics" // 数据报表
	PermLogs      PermissionKey = "logs"      // 日志中心
	PermPrompts   PermissionKey = "prompts"   // 提示词
	PermSettings  PermissionKey = "settings"  // AI 配置
	PermUsers     PermissionKey = "users"     // 用户管理
)

func AllPermissionKeys() []string {
	keys := []string{
		string(PermChat),
		string(PermKBTest),
		string(PermKnowledge),
		string(PermFAQs),
		string(PermAnalytics),
		string(PermLogs),
		string(PermPrompts),
		string(PermSettings),
		string(PermUsers),
	}
	sort.Strings(keys)
	return keys
}

func DefaultAgentPermissions() []string {
	return []string{string(PermChat)}
}

func normalizePermissionKeys(keys []string) []string {
	seen := map[string]bool{}
	out := make([]string, 0, len(keys))
	for _, k := range keys {
		kk := strings.TrimSpace(k)
		if kk == "" {
			continue
		}
		if seen[kk] {
			continue
		}
		seen[kk] = true
		out = append(out, kk)
	}
	sort.Strings(out)
	return out
}

func validatePermissionKeys(keys []string) error {
	allowed := map[string]bool{}
	for _, k := range AllPermissionKeys() {
		allowed[k] = true
	}
	for _, k := range keys {
		if !allowed[k] {
			return errors.New("存在不支持的权限键: " + k)
		}
	}
	return nil
}

// EncodePermissions 将权限数组编码为 JSON 字符串，用于存表。
func EncodePermissions(keys []string) (string, error) {
	n := normalizePermissionKeys(keys)
	if err := validatePermissionKeys(n); err != nil {
		return "", err
	}
	b, err := json.Marshal(n)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

// DecodePermissions 从 JSON 字符串解码权限数组。空串/无效 JSON 视为无权限数组。
func DecodePermissions(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil
	}
	var keys []string
	if err := json.Unmarshal([]byte(raw), &keys); err != nil {
		return nil
	}
	return normalizePermissionKeys(keys)
}

