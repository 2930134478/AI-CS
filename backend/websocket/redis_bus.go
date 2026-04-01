package websocket

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
)

type DistributedBus interface {
	Publish(msg *Message) error
	Subscribe(handler func(msg *Message))
	Close() error
}

type redisWireMessage struct {
	ConversationID uint            `json:"conversation_id"`
	Type           string          `json:"type"`
	Scope          string          `json:"scope,omitempty"`
	Data           json.RawMessage `json:"data"`
	Source         string          `json:"source"`
}

type RedisBus struct {
	ctx     context.Context
	client  *redis.Client
	channel string
	nodeID  string
	pubsub  *redis.PubSub
}

func NewRedisBusFromEnv() (DistributedBus, error) {
	redisURL := os.Getenv("REDIS_URL")
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisURL == "" && redisAddr == "" {
		return nil, nil
	}

	var opts *redis.Options
	var err error
	if redisURL != "" {
		opts, err = redis.ParseURL(redisURL)
		if err != nil {
			return nil, fmt.Errorf("parse REDIS_URL failed: %w", err)
		}
	} else {
		opts = &redis.Options{
			Addr:     redisAddr,
			Password: os.Getenv("REDIS_PASSWORD"),
			DB:       0,
		}
		if dbRaw := os.Getenv("REDIS_DB"); dbRaw != "" {
			if db, parseErr := strconv.Atoi(dbRaw); parseErr == nil {
				opts.DB = db
			}
		}
	}

	client := redis.NewClient(opts)
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if pingErr := client.Ping(ctx).Err(); pingErr != nil {
		_ = client.Close()
		return nil, fmt.Errorf("redis ping failed: %w", pingErr)
	}

	channel := os.Getenv("REDIS_WS_CHANNEL")
	if channel == "" {
		channel = "ai_cs:ws_events"
	}
	nodeID := fmt.Sprintf("%s-%d", hostnameOrDefault(), time.Now().UnixNano())
	return &RedisBus{
		ctx:     context.Background(),
		client:  client,
		channel: channel,
		nodeID:  nodeID,
	}, nil
}

func (r *RedisBus) Publish(msg *Message) error {
	if msg == nil {
		return nil
	}
	dataBytes, err := json.Marshal(msg.Data)
	if err != nil {
		return err
	}
	wire := redisWireMessage{
		ConversationID: msg.ConversationID,
		Type:           msg.Type,
		Scope:          msg.Scope,
		Data:           dataBytes,
		Source:         r.nodeID,
	}
	payload, err := json.Marshal(wire)
	if err != nil {
		return err
	}
	return r.client.Publish(r.ctx, r.channel, payload).Err()
}

func (r *RedisBus) Subscribe(handler func(msg *Message)) {
	if handler == nil {
		return
	}
	r.pubsub = r.client.Subscribe(r.ctx, r.channel)
	ch := r.pubsub.Channel()
	go func() {
		for item := range ch {
			var wire redisWireMessage
			if err := json.Unmarshal([]byte(item.Payload), &wire); err != nil {
				continue
			}
			if wire.Source == r.nodeID {
				continue
			}
			var data interface{}
			if err := json.Unmarshal(wire.Data, &data); err != nil {
				continue
			}
			handler(&Message{
				ConversationID: wire.ConversationID,
				Type:           wire.Type,
				Scope:          wire.Scope,
				Data:           data,
				FromRemote:     true,
			})
		}
	}()
}

func (r *RedisBus) Close() error {
	if r.pubsub != nil {
		_ = r.pubsub.Close()
	}
	return r.client.Close()
}

func hostnameOrDefault() string {
	name, err := os.Hostname()
	if err != nil || name == "" {
		return "node"
	}
	return name
}
