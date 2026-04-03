// AIops/backend/cmd/api/main.go
package main

import (
	"fmt"
	"os"
	"time"

	"github.com/aiops/backend/internal/handler"
	"github.com/aiops/backend/internal/middleware"
	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/config"
	"github.com/aiops/backend/internal/pkg/crypto"
	"github.com/aiops/backend/internal/pkg/database"
	jwtpkg "github.com/aiops/backend/internal/pkg/jwt"
	"github.com/aiops/backend/internal/repository"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func main() {
	// Load config from environment
	cfg := config.Load()

	// Logger
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	// Database
	db := database.New(&cfg.DB, cfg.App.Env)
	database.AutoMigrate(db,
		&model.User{},
		&model.AuditLog{},
		&model.Host{},
		&model.HostGroup{},
		&model.HostEnvVar{},
		&model.AIModel{},
		&model.APIKey{},
	)

	// Crypto
	cryptoSvc, err := crypto.New(cfg.Crypto.Key)
	if err != nil {
		logger.Fatal("failed to init crypto", zap.Error(err))
	}
	_ = cryptoSvc // used by future modules

	// JWT
	accessTTL, _ := time.ParseDuration(cfg.JWT.AccessTTL)
	refreshTTL, _ := time.ParseDuration(cfg.JWT.RefreshTTL)
	jwtSvc := jwtpkg.New(cfg.JWT.Secret, accessTTL, refreshTTL)

	// Repositories
	userRepo := repository.NewUserRepo(db)
	auditRepo := repository.NewAuditRepo(db)

	// Services
	authSvc := service.NewAuthService(userRepo, jwtSvc)
	userSvc := service.NewUserService(userRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authSvc)
	userHandler := handler.NewUserHandler(userSvc, auditRepo)

	// Host management
	hostRepo := repository.NewHostRepo(db)
	_ = repository.NewHostGroupRepo(db)
	_ = repository.NewHostEnvVarRepo(db)
	sshSvc := service.NewSSHService()
	hostSvc := service.NewHostService(hostRepo, cryptoSvc, sshSvc)
	hostHandler := handler.NewHostHandler(hostSvc)

	// Router
	if cfg.App.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(middleware.CORS())
	r.Use(middleware.Logger(logger))
	r.Use(gin.Recovery())

	api := r.Group("/api/v1")

	// Public routes
	auth := api.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
		auth.POST("/refresh", authHandler.Refresh)
		auth.POST("/logout", authHandler.Logout)
	}

	// Protected routes
	protected := api.Group("")
	protected.Use(middleware.Auth(jwtSvc))
	protected.Use(middleware.AuditWrite(auditRepo))
	{
		users := protected.Group("/users")
		users.GET("", middleware.RequireRole("admin"), userHandler.List)
		users.GET("/:id", middleware.RequireRole("admin"), userHandler.Get)
		users.PUT("/:id", middleware.RequireRole("admin"), userHandler.UpdateRole)
		users.DELETE("/:id", middleware.RequireRole("admin"), userHandler.Delete)

		protected.GET("/audit-logs", middleware.RequireRole("admin"), userHandler.AuditLogs)

		hosts := protected.Group("/hosts")
		{
			hosts.POST("", middleware.RequireRole("admin", "operator"), hostHandler.CreateHost)
			hosts.GET("", hostHandler.ListHosts)
			hosts.GET("/:id", hostHandler.GetHost)
			hosts.PUT("/:id", middleware.RequireRole("admin", "operator"), hostHandler.UpdateHost)
			hosts.DELETE("/:id", middleware.RequireRole("admin"), hostHandler.DeleteHost)
			hosts.POST("/:id/test", middleware.RequireRole("admin", "operator"), hostHandler.TestConnection)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	addr := fmt.Sprintf(":%s", cfg.App.Port)
	logger.Info("starting server", zap.String("addr", addr))
	if err := r.Run(addr); err != nil {
		logger.Fatal("server failed", zap.Error(err))
		os.Exit(1)
	}
}
