package config

import (
	"log"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	App    AppConfig
	DB     DBConfig
	Redis  RedisConfig
	JWT    JWTConfig
	Crypto CryptoConfig
}

type AppConfig struct {
	Env  string
	Port string
}

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
}

type JWTConfig struct {
	Secret     string
	AccessTTL  string
	RefreshTTL string
}

type CryptoConfig struct {
	Key string
}

func Load() *Config {
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	viper.SetDefault("APP_ENV", "development")
	viper.SetDefault("APP_PORT", "8080")
	viper.SetDefault("DB_PORT", "5432")
	viper.SetDefault("DB_SSLMODE", "disable")
	viper.SetDefault("REDIS_PORT", "6379")
	viper.SetDefault("JWT_ACCESS_TTL", "15m")
	viper.SetDefault("JWT_REFRESH_TTL", "168h")

	cfg := &Config{
		App: AppConfig{
			Env:  viper.GetString("APP_ENV"),
			Port: viper.GetString("APP_PORT"),
		},
		DB: DBConfig{
			Host:     viper.GetString("DB_HOST"),
			Port:     viper.GetString("DB_PORT"),
			User:     viper.GetString("DB_USER"),
			Password: viper.GetString("DB_PASSWORD"),
			Name:     viper.GetString("DB_NAME"),
			SSLMode:  viper.GetString("DB_SSLMODE"),
		},
		Redis: RedisConfig{
			Host:     viper.GetString("REDIS_HOST"),
			Port:     viper.GetString("REDIS_PORT"),
			Password: viper.GetString("REDIS_PASSWORD"),
		},
		JWT: JWTConfig{
			Secret:     viper.GetString("JWT_SECRET"),
			AccessTTL:  viper.GetString("JWT_ACCESS_TTL"),
			RefreshTTL: viper.GetString("JWT_REFRESH_TTL"),
		},
		Crypto: CryptoConfig{
			Key: viper.GetString("CRYPTO_KEY"),
		},
	}

	if cfg.JWT.Secret == "" {
		log.Fatal("JWT_SECRET is required")
	}
	if len(cfg.Crypto.Key) < 32 {
		log.Fatal("CRYPTO_KEY must be at least 32 characters")
	}

	return cfg
}
