package service

import (
	"errors"
	"io"

	"github.com/2930134478/AI-CS/backend/infra"
	"github.com/2930134478/AI-CS/backend/repository"
	"gorm.io/gorm"
)

// ProfileService 负责个人资料相关的业务逻辑。
type ProfileService struct {
	users   *repository.UserRepository
	storage infra.StorageService
}

// NewProfileService 创建 ProfileService 实例。
func NewProfileService(users *repository.UserRepository, storage infra.StorageService) *ProfileService {
	return &ProfileService{
		users:   users,
		storage: storage,
	}
}

// GetProfile 获取用户的个人资料。
func (s *ProfileService) GetProfile(userID uint) (*ProfileResult, error) {
	user, err := s.users.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}

	return &ProfileResult{
		ID:        user.ID,
		Username:  user.Username,
		Role:      user.Role,
		AvatarURL: user.AvatarURL,
		Nickname:  user.Nickname,
		Email:     user.Email,
	}, nil
}

// UpdateProfile 更新用户的个人资料。
func (s *ProfileService) UpdateProfile(input UpdateProfileInput) (*ProfileResult, error) {
	// 检查用户是否存在
	if _, err := s.users.GetByID(input.UserID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}

	updates := make(map[string]interface{})
	if input.Nickname != nil {
		updates["nickname"] = *input.Nickname
	}
	if input.Email != nil {
		updates["email"] = *input.Email
	}

	if len(updates) > 0 {
		if err := s.users.UpdateFields(input.UserID, updates); err != nil {
			return nil, err
		}
	}

	return s.GetProfile(input.UserID)
}

// UploadAvatar 上传用户头像。
func (s *ProfileService) UploadAvatar(userID uint, file io.Reader, filename string) (*ProfileResult, error) {
	// 检查用户是否存在
	user, err := s.users.GetByID(userID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("用户不存在")
		}
		return nil, err
	}

	// 如果已有头像，删除旧头像
	if user.AvatarURL != "" {
		if err := s.storage.DeleteFile(user.AvatarURL); err != nil {
			// 删除失败不阻止更新，只记录警告
			// log.Printf("删除旧头像失败: %v", err)
		}
	}

	// 保存新头像
	avatarURL, err := s.storage.SaveAvatar(userID, file, filename)
	if err != nil {
		return nil, err
	}

	// 更新用户头像URL
	updates := map[string]interface{}{
		"avatar_url": avatarURL,
	}
	if err := s.users.UpdateFields(userID, updates); err != nil {
		return nil, err
	}

	return s.GetProfile(userID)
}

