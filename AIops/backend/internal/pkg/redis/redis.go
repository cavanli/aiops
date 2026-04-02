package redis

import (
	"context"
	"fmt"
	"log"

	"github.com/aiops/backend/internal/pkg/config"
	goredis "github.com/redis/go-redis/v9"
)

func New(cfg *config.RedisConfig) *goredis.Client {
	client := goredis.NewClient(&goredis.Options{
		Addr:     fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password: cfg.Password,
		DB:       0,
	})

	if err := client.Ping(context.Background()).Err(); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	return client
}
