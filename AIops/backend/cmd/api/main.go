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
		&model.Workflow{},
		&model.WorkflowExecution{},
		&model.DeploymentTemplate{},
		&model.DeploymentTask{},
		&model.Skill{},
		&model.Agent{},
	)

	// Crypto
	cryptoSvc, err := crypto.New(cfg.Crypto.Key)
	if err != nil {
		logger.Fatal("failed to init crypto", zap.Error(err))
	}

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
	hostGroupRepo := repository.NewHostGroupRepo(db)
	hostEnvVarRepo := repository.NewHostEnvVarRepo(db)
	sshSvc := service.NewSSHService()
	hostSvc := service.NewHostService(hostRepo, cryptoSvc, sshSvc)
	hostHandler := handler.NewHostHandler(hostSvc)
	hostGroupSvc := service.NewHostGroupService(hostGroupRepo)
	hostGroupHandler := handler.NewHostGroupHandler(hostGroupSvc)
	hostEnvVarSvc := service.NewHostEnvVarService(hostEnvVarRepo, cryptoSvc)
	hostEnvVarHandler := handler.NewHostEnvVarHandler(hostEnvVarSvc)

	// Model marketplace
	modelRepo := repository.NewModelRepo(db)
	apiKeyRepo := repository.NewAPIKeyRepo(db)
	modelSvc := service.NewModelService(modelRepo, apiKeyRepo, cryptoSvc)
	modelHandler := handler.NewModelHandler(modelSvc)

	// Workflow engine
	workflowRepo := repository.NewWorkflowRepo(db)
	executionRepo := repository.NewExecutionRepo(db)
	workflowSvc := service.NewWorkflowService(workflowRepo, executionRepo)
	workflowHandler := handler.NewWorkflowHandler(workflowSvc)

	// Deployment engine
	templateRepo := repository.NewTemplateRepo(db)
	taskRepo := repository.NewTaskRepo(db)
	deploymentSvc := service.NewDeploymentService(templateRepo, taskRepo, hostRepo, cryptoSvc)
	deploymentHandler := handler.NewDeploymentHandler(deploymentSvc)

	// Skills library
	skillRepo := repository.NewSkillRepo(db)
	skillSvc := service.NewSkillService(skillRepo)
	skillHandler := handler.NewSkillHandler(skillSvc)

	// Agents
	agentRepo := repository.NewAgentRepo(db)
	agentSvc := service.NewAgentService(agentRepo)
	agentHandler := handler.NewAgentHandler(agentSvc)

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
			hosts.GET("/:id/env-vars", hostEnvVarHandler.List)
			hosts.POST("/:id/env-vars", middleware.RequireRole("admin", "operator"), hostEnvVarHandler.Create)
			hosts.DELETE("/:id/env-vars/:var_id", middleware.RequireRole("admin", "operator"), hostEnvVarHandler.Delete)
		}

		hostGroups := protected.Group("/host-groups")
		{
			hostGroups.GET("", hostGroupHandler.List)
			hostGroups.POST("", middleware.RequireRole("admin", "operator"), hostGroupHandler.Create)
			hostGroups.GET("/:id", hostGroupHandler.Get)
			hostGroups.PUT("/:id", middleware.RequireRole("admin", "operator"), hostGroupHandler.Update)
			hostGroups.DELETE("/:id", middleware.RequireRole("admin"), hostGroupHandler.Delete)
		}

		// Model marketplace routes
		models := protected.Group("/models")
		{
			models.GET("", modelHandler.ListModels)
			models.POST("", middleware.RequireRole("admin"), modelHandler.CreateModel)
			models.GET("/:id", modelHandler.GetModel)
			models.PUT("/:id", middleware.RequireRole("admin"), modelHandler.UpdateModel)
			models.DELETE("/:id", middleware.RequireRole("admin"), modelHandler.DeleteModel)
			models.POST("/:id/test", middleware.RequireRole("admin", "operator"), modelHandler.TestModel)
		}

		// API keys routes
		apiKeys := protected.Group("/api-keys")
		{
			apiKeys.GET("", modelHandler.ListAPIKeys)
			apiKeys.POST("", middleware.RequireRole("admin"), modelHandler.CreateAPIKey)
			apiKeys.DELETE("/:id", middleware.RequireRole("admin"), modelHandler.DeleteAPIKey)
		}

		// Workflow routes
		workflows := protected.Group("/workflows")
		{
			workflows.GET("", workflowHandler.ListWorkflows)
			workflows.POST("", middleware.RequireRole("admin", "operator"), workflowHandler.CreateWorkflow)
			workflows.GET("/:id", workflowHandler.GetWorkflow)
			workflows.PUT("/:id", middleware.RequireRole("admin", "operator"), workflowHandler.UpdateWorkflow)
			workflows.DELETE("/:id", middleware.RequireRole("admin"), workflowHandler.DeleteWorkflow)
			workflows.POST("/:id/execute", middleware.RequireRole("admin", "operator"), workflowHandler.ExecuteWorkflow)
		}

		// Workflow execution routes
		executions := protected.Group("/workflow-executions")
		{
			executions.GET("", workflowHandler.ListExecutions)
			executions.GET("/:id", workflowHandler.GetExecution)
		}

		// Deployment template routes
		templates := protected.Group("/deployment-templates")
		{
			templates.GET("", deploymentHandler.ListTemplates)
			templates.POST("", middleware.RequireRole("admin", "operator"), deploymentHandler.CreateTemplate)
			templates.GET("/:id", deploymentHandler.GetTemplate)
			templates.PUT("/:id", middleware.RequireRole("admin", "operator"), deploymentHandler.UpdateTemplate)
			templates.DELETE("/:id", middleware.RequireRole("admin"), deploymentHandler.DeleteTemplate)
		}

		// Deployment task routes
		deployments := protected.Group("/deployments")
		{
			deployments.GET("", deploymentHandler.ListTasks)
			deployments.POST("", middleware.RequireRole("admin", "operator"), deploymentHandler.CreateTask)
			deployments.GET("/:id", deploymentHandler.GetTask)
			deployments.POST("/:id/cancel", middleware.RequireRole("admin", "operator"), deploymentHandler.CancelTask)
		}

		// Skills library routes
		skills := protected.Group("/skills")
		{
			skills.GET("", skillHandler.ListSkills)
			skills.POST("", middleware.RequireRole("admin", "operator"), skillHandler.CreateSkill)
			skills.GET("/:id", skillHandler.GetSkill)
			skills.PUT("/:id", middleware.RequireRole("admin", "operator"), skillHandler.UpdateSkill)
			skills.DELETE("/:id", middleware.RequireRole("admin"), skillHandler.DeleteSkill)
		}

		// Agents routes
		agents := protected.Group("/agents")
		{
			agents.GET("", agentHandler.ListAgents)
			agents.POST("", middleware.RequireRole("admin", "operator"), agentHandler.CreateAgent)
			agents.GET("/:id", agentHandler.GetAgent)
			agents.PUT("/:id", middleware.RequireRole("admin", "operator"), agentHandler.UpdateAgent)
			agents.DELETE("/:id", middleware.RequireRole("admin"), agentHandler.DeleteAgent)
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
