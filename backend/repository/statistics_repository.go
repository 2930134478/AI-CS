package repository

import (
	"time"

	"github.com/2930134478/AI-CS/backend/models"
	"gorm.io/gorm"
)

// StatisticsRepository 封装与统计数据相关的数据库操作。
type StatisticsRepository struct {
	db *gorm.DB
}

// NewStatisticsRepository 创建统计仓库实例。
func NewStatisticsRepository(db *gorm.DB) *StatisticsRepository {
	return &StatisticsRepository{db: db}
}

// GetTodayConversationCount 获取今日对话数。
func (r *StatisticsRepository) GetTodayConversationCount() (int64, error) {
	var count int64
	today := time.Now().Format("2006-01-02")
	err := r.db.Model(&models.Conversation{}).
		Where("DATE(created_at) = ?", today).
		Count(&count).Error
	return count, err
}

// GetTodayMessageCount 获取今日消息数。
func (r *StatisticsRepository) GetTodayMessageCount() (int64, error) {
	var count int64
	today := time.Now().Format("2006-01-02")
	err := r.db.Model(&models.Message{}).
		Where("DATE(created_at) = ?", today).
		Where("message_type = ?", "user_message").
		Count(&count).Error
	return count, err
}

// GetTotalConversationCount 获取总对话数。
func (r *StatisticsRepository) GetTotalConversationCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.Conversation{}).Count(&count).Error
	return count, err
}

// GetTotalMessageCount 获取总消息数。
func (r *StatisticsRepository) GetTotalMessageCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.Message{}).
		Where("message_type = ?", "user_message").
		Count(&count).Error
	return count, err
}

// GetActiveVisitorCount 获取活跃访客数（有未关闭对话的访客）。
func (r *StatisticsRepository) GetActiveVisitorCount() (int64, error) {
	var count int64
	err := r.db.Model(&models.Conversation{}).
		Where("conversation_type = ? AND status != ?", "visitor", "closed").
		Distinct("visitor_id").
		Count(&count).Error
	return count, err
}

// GetConversationTrend 获取对话趋势数据（最近N天）。
func (r *StatisticsRepository) GetConversationTrend(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// 获取最近N天的对话统计
	query := `
		SELECT
			DATE(created_at) as date,
			COUNT(*) as count
		FROM conversations
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
			AND conversation_type = 'visitor'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`

	if err := r.db.Raw(query, days).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetMessageTrend 获取消息趋势数据（最近N天）。
func (r *StatisticsRepository) GetMessageTrend(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := `
		SELECT
			DATE(created_at) as date,
			COUNT(*) as count
		FROM messages
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
			AND message_type = 'user_message'
		GROUP BY DATE(created_at)
		ORDER BY date ASC
	`

	if err := r.db.Raw(query, days).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetAgentWorkload 获取客服工作量统计。
func (r *StatisticsRepository) GetAgentWorkload(startDate, endDate time.Time) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := `
		SELECT
			u.id as agent_id,
			COALESCE(u.nickname, u.username) as agent_name,
			COUNT(DISTINCT c.id) as conversation_count,
			COUNT(m.id) as message_count
		FROM users u
		LEFT JOIN conversations c ON c.agent_id = u.id
			AND c.conversation_type = 'visitor'
			AND c.created_at BETWEEN ? AND ?
		LEFT JOIN messages m ON m.sender_id = u.id
			AND m.sender_is_agent = 1
			AND m.message_type = 'user_message'
			AND m.created_at BETWEEN ? AND ?
		WHERE u.role IN ('admin', 'agent')
		GROUP BY u.id, u.nickname, u.username
		ORDER BY conversation_count DESC, message_count DESC
	`

	if err := r.db.Raw(query, startDate, endDate, startDate, endDate).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetVisitorSourceStats 获取访客来源统计。
func (r *StatisticsRepository) GetVisitorSourceStats(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	// 按网站来源统计
	query := `
		SELECT
			CASE
				WHEN website IS NULL OR website = '' THEN '未知'
				WHEN website LIKE '%google%' THEN 'Google'
				WHEN website LIKE '%baidu%' THEN '百度'
				WHEN website LIKE '%bing%' THEN 'Bing'
				WHEN website LIKE '%sogou%' THEN '搜狗'
				ELSE '直接访问'
			END as source,
			COUNT(DISTINCT visitor_id) as count
		FROM conversations
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
			AND conversation_type = 'visitor'
		GROUP BY source
		ORDER BY count DESC
	`

	if err := r.db.Raw(query, days).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetBrowserStats 获取浏览器统计。
func (r *StatisticsRepository) GetBrowserStats(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := `
		SELECT
			CASE
				WHEN browser LIKE '%Chrome%' THEN 'Chrome'
				WHEN browser LIKE '%Firefox%' THEN 'Firefox'
				WHEN browser LIKE '%Safari%' THEN 'Safari'
				WHEN browser LIKE '%Edge%' THEN 'Edge'
				WHEN browser LIKE '%MSIE%' OR browser LIKE '%Trident%' THEN 'IE'
				WHEN browser IS NULL OR browser = '' THEN '未知'
				ELSE '其他'
			END as browser,
			COUNT(*) as count
		FROM conversations
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
			AND conversation_type = 'visitor'
		GROUP BY browser
		ORDER BY count DESC
	`

	if err := r.db.Raw(query, days).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetAIResponseStats 获取AI回复统计。
func (r *StatisticsRepository) GetAIResponseStats(days int) (map[string]interface{}, error) {
	var results map[string]interface{}

	// AI模式下的消息数
	query := `
		SELECT
			COUNT(*) as total_ai_responses,
			COUNT(CASE WHEN chat_mode = 'ai' THEN 1 END) as ai_mode_count,
			COUNT(CASE WHEN chat_mode = 'human' THEN 1 END) as human_mode_count
		FROM messages
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
			AND sender_is_agent = 0
	`

	if err := r.db.Raw(query, days).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}

// GetHourlyDistribution 获取对话时间分布（按小时）。
func (r *StatisticsRepository) GetHourlyDistribution(days int) ([]map[string]interface{}, error) {
	var results []map[string]interface{}

	query := `
		SELECT
			HOUR(created_at) as hour,
			COUNT(*) as count
		FROM conversations
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
			AND conversation_type = 'visitor'
		GROUP BY HOUR(created_at)
		ORDER BY hour ASC
	`

	if err := r.db.Raw(query, days).Scan(&results).Error; err != nil {
		return nil, err
	}

	return results, nil
}
