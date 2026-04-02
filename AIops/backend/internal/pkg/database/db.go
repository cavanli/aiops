package database

import (
	"fmt"
	"log"

	"github.com/aiops/backend/internal/pkg/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func New(cfg *config.DBConfig) *gorm.DB {
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s TimeZone=UTC",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode,
	)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("failed to get underlying sql.DB: %v", err)
	}
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)

	return db
}

func AutoMigrate(db *gorm.DB, models ...interface{}) {
	if err := db.AutoMigrate(models...); err != nil {
		log.Fatalf("failed to migrate: %v", err)
	}
}
