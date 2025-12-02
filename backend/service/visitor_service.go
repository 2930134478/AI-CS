package service

import (
	_ "github.com/2930134478/AI-CS/backend/models" // 用于访问 models.User 类型（通过 repository 返回）
	"github.com/2930134478/AI-CS/backend/repository"
)

// OnlineAgentHub 描述获取在线客服ID列表的能力。
type OnlineAgentHub interface {
	GetOnlineAgentIDs() map[uint]bool
}

// VisitorService 负责访客相关的业务逻辑。
type VisitorService struct {
	userRepo *repository.UserRepository
	hub      OnlineAgentHub
}

// NewVisitorService 创建 VisitorService 实例。
func NewVisitorService(userRepo *repository.UserRepository, hub OnlineAgentHub) *VisitorService {
	return &VisitorService{
		userRepo: userRepo,
		hub:      hub,
	}
}

// GetOnlineAgents 获取所有在线客服列表。
// 返回在线客服的基本信息（ID、昵称、头像）。
func (s *VisitorService) GetOnlineAgents() ([]OnlineAgent, error) {
	// 从 WebSocket Hub 获取在线客服ID列表
	onlineAgentIDs := s.hub.GetOnlineAgentIDs()

	if len(onlineAgentIDs) == 0 {
		return []OnlineAgent{}, nil
	}

	// 将 map 转换为 ID 列表
	ids := make([]uint, 0, len(onlineAgentIDs))
	for id := range onlineAgentIDs {
		ids = append(ids, id)
	}

	// 从数据库查询这些客服的详细信息（包含 admin 和 agent 角色）
	users, err := s.userRepo.FindByIDsAndRoles(ids, []string{"admin", "agent"})
	if err != nil {
		return nil, err
	}

	// 转换为 OnlineAgent 列表
	agents := make([]OnlineAgent, 0, len(users))
	for _, user := range users {
		agents = append(agents, OnlineAgent{
			ID:        user.ID,
			Nickname:  user.Nickname,
			AvatarURL: user.AvatarURL,
		})
	}

	return agents, nil
}
