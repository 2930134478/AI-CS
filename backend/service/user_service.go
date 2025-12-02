package service

import (
	"errors"
	"strings"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserService 负责用户管理领域的业务编排。
type UserService struct {
	users *repository.UserRepository
}

// NewUserService 创建 UserService 实例。
func NewUserService(users *repository.UserRepository) *UserService {
	return &UserService{users: users}
}

// ListUsers 获取所有用户列表。
func (s *UserService) ListUsers() ([]UserSummary, error) {
	users, err := s.users.ListUsers()
	if err != nil {
		return nil, err
	}

	summaries := make([]UserSummary, 0, len(users))
	for _, user := range users {
		summaries = append(summaries, UserSummary{
			ID:                     user.ID,
			Username:               user.Username,
			Role:                   user.Role,
			Nickname:               user.Nickname,
			Email:                  user.Email,
			AvatarURL:              user.AvatarURL,
			ReceiveAIConversations: user.ReceiveAIConversations,
			CreatedAt:              user.CreatedAt,
			UpdatedAt:              user.UpdatedAt,
		})
	}

	return summaries, nil
}

// GetUser 获取用户详情。
func (s *UserService) GetUser(id uint) (*UserSummary, error) {
	user, err := s.users.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}

	return &UserSummary{
		ID:                     user.ID,
		Username:               user.Username,
		Role:                   user.Role,
		Nickname:               user.Nickname,
		Email:                  user.Email,
		AvatarURL:              user.AvatarURL,
		ReceiveAIConversations: user.ReceiveAIConversations,
		CreatedAt:              user.CreatedAt,
		UpdatedAt:              user.UpdatedAt,
	}, nil
}

// CreateUser 创建新用户。
func (s *UserService) CreateUser(input CreateUserInput) (*UserSummary, error) {
	// 验证必填字段
	if input.Username == "" || input.Password == "" {
		return nil, errors.New("用户名和密码不能为空")
	}

	// 验证角色
	if input.Role != "admin" && input.Role != "agent" {
		return nil, errors.New("角色只能是 admin 或 agent")
	}

	// 检查用户名是否已存在
	if _, err := s.users.FindByUsername(input.Username); err == nil {
		return nil, ErrUsernameExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// 加密密码
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.New("密码加密失败")
	}

	// 创建用户
	user := &models.User{
		Username:               input.Username,
		Password:               string(hash),
		Role:                   input.Role,
		ReceiveAIConversations: true, // 默认接收 AI 对话
	}

	// 设置可选字段
	if input.Nickname != nil {
		user.Nickname = strings.TrimSpace(*input.Nickname)
	}
	if input.Email != nil {
		user.Email = strings.TrimSpace(*input.Email)
	}

	if err := s.users.Create(user); err != nil {
		return nil, err
	}

	return &UserSummary{
		ID:                     user.ID,
		Username:               user.Username,
		Role:                   user.Role,
		Nickname:               user.Nickname,
		Email:                  user.Email,
		AvatarURL:              user.AvatarURL,
		ReceiveAIConversations: user.ReceiveAIConversations,
		CreatedAt:              user.CreatedAt,
		UpdatedAt:              user.UpdatedAt,
	}, nil
}

// UpdateUser 更新用户信息。
func (s *UserService) UpdateUser(input UpdateUserInput) (*UserSummary, error) {
	// 检查用户是否存在
	_, err := s.users.GetByID(input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}

	// 构建更新字段
	updates := make(map[string]interface{})

	// 更新角色
	if input.Role != nil {
		role := strings.TrimSpace(*input.Role)
		if role != "admin" && role != "agent" {
			return nil, errors.New("角色只能是 admin 或 agent")
		}
		updates["role"] = role
	}

	// 更新昵称
	if input.Nickname != nil {
		updates["nickname"] = strings.TrimSpace(*input.Nickname)
	}

	// 更新邮箱
	if input.Email != nil {
		updates["email"] = strings.TrimSpace(*input.Email)
	}

	// 更新 AI 对话接收设置
	if input.ReceiveAIConversations != nil {
		updates["receive_ai_conversations"] = *input.ReceiveAIConversations
	}

	// 如果没有需要更新的字段，直接返回
	if len(updates) == 0 {
		return s.GetUser(input.UserID)
	}

	// 执行更新
	if err := s.users.UpdateFields(input.UserID, updates); err != nil {
		return nil, err
	}

	// 返回更新后的用户信息
	return s.GetUser(input.UserID)
}

// DeleteUser 删除用户。
func (s *UserService) DeleteUser(id uint, currentUserID uint) error {
	// 防止删除当前登录用户
	if id == currentUserID {
		return errors.New("不能删除当前登录用户")
	}

	// 检查用户是否存在并获取用户信息
	user, err := s.users.GetByID(id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在")
		}
		return err
	}

	// 防止删除最后一个管理员
	if user.Role == "admin" {
		count, err := s.users.CountByRole("admin")
		if err != nil {
			return err
		}
		if count <= 1 {
			return errors.New("不能删除最后一个管理员")
		}
	}

	// 执行删除
	if err := s.users.Delete(id); err != nil {
		return err
	}

	return nil
}

// UpdateUserPassword 更新用户密码。
func (s *UserService) UpdateUserPassword(input UpdatePasswordInput) error {
	// 检查用户是否存在
	user, err := s.users.GetByID(input.UserID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("用户不存在")
		}
		return err
	}

	// 验证新密码
	if input.NewPassword == "" {
		return errors.New("新密码不能为空")
	}

	// 如果不是管理员操作，需要验证旧密码
	if !input.IsAdmin {
		if input.OldPassword == nil || *input.OldPassword == "" {
			return errors.New("需要提供旧密码")
		}
		if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(*input.OldPassword)); err != nil {
			return errors.New("旧密码不正确")
		}
	}

	// 加密新密码
	hash, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return errors.New("密码加密失败")
	}

	// 更新密码
	if err := s.users.UpdateFields(input.UserID, map[string]interface{}{
		"password": string(hash),
	}); err != nil {
		return err
	}

	return nil
}

