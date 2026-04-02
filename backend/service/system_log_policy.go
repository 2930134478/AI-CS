package service

import (
	"fmt"
	"os"
	"strings"
)

// 数据库落库最低级别（数值越大越严重）。低于 min 的日志不写 system_logs。
const (
	logRankDebug = 0
	logRankInfo  = 1
	logRankWarn  = 2
	logRankError = 3
	logRankNone  = -1 // 环境变量 none/off：全部不落库
)

func logLevelRank(level string) int {
	switch strings.ToLower(strings.TrimSpace(level)) {
	case "debug", "trace":
		return logRankDebug
	case "info":
		return logRankInfo
	case "warn", "warning":
		return logRankWarn
	case "error", "err", "fatal", "critical":
		return logRankError
	default:
		return logRankInfo
	}
}

// ParseSystemLogMinPersistLevel 解析 SYSTEM_LOG_MIN_LEVEL。
// debug|info|warn|error|none；空默认为 info；无法识别时回退为 info。
func ParseSystemLogMinPersistLevel(s string) int {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "", "info":
		return logRankInfo
	case "debug", "trace":
		return logRankDebug
	case "warn", "warning":
		return logRankWarn
	case "error", "err":
		return logRankError
	case "none", "off", "disable", "false", "0":
		return logRankNone
	default:
		return logRankInfo
	}
}

// ParseSystemLogMinPersistLevelStrict 用于 API：非法取值返回错误。
func ParseSystemLogMinPersistLevelStrict(s string) (int, error) {
	v := strings.ToLower(strings.TrimSpace(s))
	if v == "" {
		return 0, fmt.Errorf("min_level 不能为空")
	}
	switch v {
	case "debug", "trace":
		return logRankDebug, nil
	case "info":
		return logRankInfo, nil
	case "warn", "warning":
		return logRankWarn, nil
	case "error", "err":
		return logRankError, nil
	case "none", "off", "disable", "false", "0":
		return logRankNone, nil
	default:
		return 0, fmt.Errorf("无效的 min_level，可选: debug, info, warn, error, none")
	}
}

// SystemLogMinPersistLevelFromEnv 读取环境变量 SYSTEM_LOG_MIN_LEVEL。
func SystemLogMinPersistLevelFromEnv() int {
	return ParseSystemLogMinPersistLevel(os.Getenv("SYSTEM_LOG_MIN_LEVEL"))
}

// SystemLogMinLevelLabel 用于启动日志说明。
func SystemLogMinLevelLabel(min int) string {
	switch min {
	case logRankDebug:
		return "debug"
	case logRankInfo:
		return "info"
	case logRankWarn:
		return "warn"
	case logRankError:
		return "error"
	case logRankNone:
		return "none"
	default:
		return "info"
	}
}
