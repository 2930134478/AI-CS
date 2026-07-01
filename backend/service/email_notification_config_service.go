package service

import (
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"github.com/2930134478/AI-CS/backend/utils"
)

// EmailNotificationConfigResult 返回给前端的配置（密码脱敏）
type EmailNotificationConfigResult struct {
	ID                    uint      `json:"id"`
	Enabled               bool      `json:"enabled"`
	SMTPHost              string    `json:"smtp_host"`
	SMTPPort              int       `json:"smtp_port"`
	SMTPUser              string    `json:"smtp_user"`
	SMTPPasswordMasked    string    `json:"smtp_password_masked"`
	FromEmail             string    `json:"from_email"`
	FromName              string    `json:"from_name"`
	OfflineDelaySeconds   int       `json:"offline_delay_seconds"`
	EffectiveEnabled      bool      `json:"effective_enabled"`
	EffectiveDelaySeconds int       `json:"effective_delay_seconds"`
	PersistedInDatabase   bool      `json:"persisted_in_database"`
	EnvEnabled            bool      `json:"env_enabled"`
	EnvDelaySeconds       int       `json:"env_delay_seconds"`
	UpdatedAt             time.Time `json:"updated_at,omitempty"`
}

// UpdateEmailNotificationConfigInput 更新离线邮件配置
type UpdateEmailNotificationConfigInput struct {
	Enabled             *bool
	SMTPHost            *string
	SMTPPort            *int
	SMTPUser            *string
	SMTPPassword        *string
	FromEmail           *string
	FromName            *string
	OfflineDelaySeconds *int
}

// ResolvedSMTPConfig 实际发信用的 SMTP 配置
type ResolvedSMTPConfig struct {
	Enabled             bool
	SMTPHost            string
	SMTPPort            int
	SMTPUser            string
	SMTPPassword        string
	FromEmail           string
	FromName            string
	OfflineDelaySeconds int
}

// EmailNotificationConfigService 离线邮件配置服务
type EmailNotificationConfigService struct {
	repo     *repository.EmailNotificationConfigRepository
	userRepo *repository.UserRepository
}

// NewEmailNotificationConfigService 创建服务实例
func NewEmailNotificationConfigService(
	repo *repository.EmailNotificationConfigRepository,
	userRepo *repository.UserRepository,
) *EmailNotificationConfigService {
	return &EmailNotificationConfigService{repo: repo, userRepo: userRepo}
}

func emailNotificationEnabledFromEnv() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("OFFLINE_EMAIL_ENABLED")))
	return v == "1" || v == "true" || v == "yes"
}

func offlineEmailDelaySecondsFromEnv() int {
	sec := 60
	if v := os.Getenv("OFFLINE_EMAIL_DELAY_SECONDS"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed >= 0 {
			sec = parsed
		}
	}
	return sec
}

func smtpConfigFromEnv() (host, user, password, fromEmail, fromName string, port int) {
	host = strings.TrimSpace(os.Getenv("SMTP_HOST"))
	user = strings.TrimSpace(os.Getenv("SMTP_USER"))
	password = os.Getenv("SMTP_PASSWORD")
	fromEmail = strings.TrimSpace(os.Getenv("SMTP_FROM_EMAIL"))
	fromName = strings.TrimSpace(os.Getenv("SMTP_FROM_NAME"))
	port = 465
	if v := os.Getenv("SMTP_PORT"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil && parsed > 0 {
			port = parsed
		}
	}
	return
}

// ResolveEffective 合并 DB 与 .env，DB 优先
func (s *EmailNotificationConfigService) ResolveEffective() (ResolvedSMTPConfig, error) {
	envEnabled := emailNotificationEnabledFromEnv()
	envDelay := offlineEmailDelaySecondsFromEnv()
	envHost, envUser, envPass, envFrom, envFromName, envPort := smtpConfigFromEnv()

	resolved := ResolvedSMTPConfig{
		Enabled:             envEnabled,
		SMTPHost:            envHost,
		SMTPPort:            envPort,
		SMTPUser:            envUser,
		SMTPPassword:        envPass,
		FromEmail:           envFrom,
		FromName:            envFromName,
		OfflineDelaySeconds: envDelay,
	}

	row, err := s.repo.Get()
	if err != nil {
		return resolved, err
	}
	if row == nil {
		return resolved, nil
	}

	resolved.Enabled = row.Enabled
	if row.SMTPHost != "" {
		resolved.SMTPHost = row.SMTPHost
	}
	if row.SMTPPort > 0 {
		resolved.SMTPPort = row.SMTPPort
	}
	if row.SMTPUser != "" {
		resolved.SMTPUser = row.SMTPUser
	}
	if row.FromEmail != "" {
		resolved.FromEmail = row.FromEmail
	}
	if row.FromName != "" {
		resolved.FromName = row.FromName
	}
	if row.OfflineDelaySeconds >= 0 {
		resolved.OfflineDelaySeconds = row.OfflineDelaySeconds
	}
	if row.SMTPPassword != "" {
		decrypted, err := utils.DecryptAPIKey(row.SMTPPassword)
		if err != nil {
			return resolved, fmt.Errorf("解密 SMTP 密码失败: %w", err)
		}
		resolved.SMTPPassword = decrypted
	}
	return resolved, nil
}

// GetForAPI 返回给前端的配置
func (s *EmailNotificationConfigService) GetForAPI() (*EmailNotificationConfigResult, error) {
	envEnabled := emailNotificationEnabledFromEnv()
	envDelay := offlineEmailDelaySecondsFromEnv()
	effective, err := s.ResolveEffective()
	if err != nil {
		return nil, err
	}

	envHost, envUser, _, envFrom, envFromName, envPort := smtpConfigFromEnv()

	result := &EmailNotificationConfigResult{
		Enabled:               envEnabled,
		SMTPPort:              envPort,
		OfflineDelaySeconds:   envDelay,
		EffectiveEnabled:      effective.Enabled,
		EffectiveDelaySeconds: effective.OfflineDelaySeconds,
		EnvEnabled:            envEnabled,
		EnvDelaySeconds:       envDelay,
		SMTPHost:              envHost,
		SMTPUser:              envUser,
		FromEmail:             envFrom,
		FromName:              envFromName,
	}

	row, err := s.repo.Get()
	if err != nil {
		return nil, err
	}
	if row != nil {
		result.PersistedInDatabase = true
		result.ID = row.ID
		result.Enabled = row.Enabled
		result.SMTPHost = row.SMTPHost
		result.SMTPPort = row.SMTPPort
		if result.SMTPPort <= 0 {
			result.SMTPPort = 465
		}
		result.SMTPUser = row.SMTPUser
		result.FromEmail = row.FromEmail
		result.FromName = row.FromName
		result.OfflineDelaySeconds = row.OfflineDelaySeconds
		result.UpdatedAt = row.UpdatedAt
		if row.SMTPPassword != "" {
			result.SMTPPasswordMasked = "******"
		}
	}
	return result, nil
}

// Update 更新配置（仅管理员）
func (s *EmailNotificationConfigService) Update(userID uint, input UpdateEmailNotificationConfigInput) (*EmailNotificationConfigResult, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("用户不存在")
	}
	if user.Role != "admin" {
		return nil, errors.New("仅管理员可修改离线邮件配置")
	}

	c, err := s.repo.Get()
	if err != nil {
		return nil, err
	}
	if c == nil {
		c = &models.EmailNotificationConfig{ID: 1, SMTPPort: 465, OfflineDelaySeconds: 60}
	}

	if input.Enabled != nil {
		c.Enabled = *input.Enabled
	}
	if input.SMTPHost != nil {
		c.SMTPHost = strings.TrimSpace(*input.SMTPHost)
	}
	if input.SMTPPort != nil && *input.SMTPPort > 0 {
		c.SMTPPort = *input.SMTPPort
	}
	if input.SMTPUser != nil {
		c.SMTPUser = strings.TrimSpace(*input.SMTPUser)
	}
	if input.SMTPPassword != nil && strings.TrimSpace(*input.SMTPPassword) != "" {
		encrypted, err := utils.EncryptAPIKey(strings.TrimSpace(*input.SMTPPassword))
		if err != nil {
			return nil, fmt.Errorf("加密 SMTP 密码失败: %w", err)
		}
		c.SMTPPassword = encrypted
	}
	if input.FromEmail != nil {
		c.FromEmail = strings.TrimSpace(*input.FromEmail)
	}
	if input.FromName != nil {
		c.FromName = strings.TrimSpace(*input.FromName)
	}
	if input.OfflineDelaySeconds != nil {
		if *input.OfflineDelaySeconds < 0 {
			return nil, errors.New("离线延迟秒数不能为负数")
		}
		c.OfflineDelaySeconds = *input.OfflineDelaySeconds
	}

	if err := s.repo.Save(c); err != nil {
		return nil, err
	}
	return s.GetForAPI()
}

// ResetToEnv 删除数据库覆盖，恢复 .env
func (s *EmailNotificationConfigService) ResetToEnv(userID uint) (*EmailNotificationConfigResult, error) {
	user, err := s.userRepo.GetByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("用户不存在")
	}
	if user.Role != "admin" {
		return nil, errors.New("仅管理员可修改离线邮件配置")
	}
	if err := s.repo.Delete(); err != nil {
		return nil, err
	}
	return s.GetForAPI()
}
