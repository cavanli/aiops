package redis

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/aiops/backend/internal/pkg/config"
	goredis "github.com/redis/go-redis/v9"
)

func New(cfg *config.RedisConfig) *goredis.Client {
	client := goredis.NewClient(&goredis.Options{
		Addr:         fmt.Sprintf("%s:%s", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           0,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("failed to connect to redis: %v", err)
	}

	return client
}
