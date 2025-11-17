package service

import (
	"errors"

	"github.com/2930134478/AI-CS/backend/models"
	"github.com/2930134478/AI-CS/backend/repository"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// ErrInvalidCredentials indicates login attempt failed.
var (
	ErrInvalidCredentials = errors.New("invalid username or password")
	ErrUsernameExists     = errors.New("username already exists")
)

// AuthService 负责认证相关的业务逻辑。
type AuthService struct {
	users *repository.UserRepository
}

// NewAuthService 创建 AuthService 实例。
func NewAuthService(users *repository.UserRepository) *AuthService {
	return &AuthService{users: users}
}

// Login 校验账号密码并返回用户信息。
func (s *AuthService) Login(username, password string) (*models.User, error) {
	user, err := s.users.FindByUsername(username)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return user, nil
}

func (s *AuthService) CreateAgent(input CreateAgentInput) (*models.User, error) {
	if input.Username == "" || input.Password == "" {
		return nil, errors.New("username and password are required")
	}

	if _, err := s.users.FindByUsername(input.Username); err == nil {
		return nil, ErrUsernameExists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	role := input.Role
	if role == "" {
		role = "agent"
	}

	user := &models.User{
		Username: input.Username,
		Password: string(hash),
		Role:     role,
	}

	if err := s.users.Create(user); err != nil {
		return nil, err
	}

	return user, nil
}
