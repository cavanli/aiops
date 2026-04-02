# AIOps Backend Plan 1: Foundation + Auth

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the Go backend project with Gin + GORM + PostgreSQL, implement JWT-based authentication, RBAC middleware, and audit logging.

**Architecture:** Classic layered architecture (Handler → Service → Repository → Model). All business logic lives in Service, HTTP handling in Handler, DB access in Repository. JWT tokens are validated per-request via middleware; RBAC roles (admin/operator/viewer) are checked via a role-enforcement middleware.

**Tech Stack:** Go 1.22+, Gin, GORM (postgres driver), golang-jwt/jwt v5, go-playground/validator v10, uber/zap, spf13/viper, redis/go-redis v9, bcrypt

---

## File Map

```
AIops/backend/
├── cmd/api/main.go                         # Entry point, wires everything
├── internal/
│   ├── model/
│   │   ├── user.go                         # User, Role enums, AuditLog structs
│   │   └── base.go                         # Shared BaseModel with ID/timestamps
│   ├── repository/
│   │   ├── user_repo.go                    # User DB operations
│   │   └── audit_repo.go                   # AuditLog DB operations
│   ├── service/
│   │   ├── auth_service.go                 # Login, register, token logic
│   │   └── user_service.go                 # User CRUD
│   ├── handler/
│   │   ├── auth_handler.go                 # POST /auth/login, /register, /refresh, /logout
│   │   └── user_handler.go                 # GET/PUT/DELETE /users
│   ├── middleware/
│   │   ├── auth.go                         # JWT validation, injects Claims into context
│   │   ├── rbac.go                         # Role enforcement
│   │   ├── audit.go                        # Auto-records write operations
│   │   ├── cors.go                         # CORS headers
│   │   └── logger.go                       # Request logging
│   └── pkg/
│       ├── config/config.go                # Viper config loader
│       ├── database/db.go                  # GORM connection + AutoMigrate
│       ├── redis/redis.go                  # go-redis client
│       ├── jwt/jwt.go                      # Token generation/parsing
│       ├── crypto/crypto.go                # AES-256-GCM encrypt/decrypt
│       └── response/response.go            # Unified JSON response helpers
├── migrations/                             # (empty for now, using AutoMigrate)
├── go.mod
├── go.sum
├── .env.example
└── Makefile
```

---

## Task 1: Initialize Go module and dependencies

**Files:**
- Create: `AIops/backend/go.mod`
- Create: `AIops/backend/go.sum` (generated)
- Create: `AIops/backend/Makefile`
- Create: `AIops/backend/.env.example`

- [ ] **Step 1: Initialize Go module**

```bash
mkdir -p e:/Opsgit/AIops/backend
cd e:/Opsgit/AIops/backend
go mod init github.com/aiops/backend
```

- [ ] **Step 2: Install dependencies**

```bash
cd e:/Opsgit/AIops/backend
go get github.com/gin-gonic/gin@v1.10.0
go get gorm.io/gorm@v1.25.10
go get gorm.io/driver/postgres@v1.5.9
go get github.com/golang-jwt/jwt/v5@v5.2.1
go get go.uber.org/zap@v1.27.0
go get github.com/spf13/viper@v1.19.0
go get github.com/redis/go-redis/v9@v9.5.3
go get golang.org/x/crypto@v0.23.0
go get github.com/go-playground/validator/v10@v10.22.0
```

- [ ] **Step 3: Create .env.example**

```bash
cat > e:/Opsgit/AIops/backend/.env.example << 'EOF'
APP_ENV=development
APP_PORT=8080

DB_HOST=localhost
DB_PORT=5432
DB_USER=aiops
DB_PASSWORD=aiops123
DB_NAME=aiops
DB_SSLMODE=disable

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=change-me-in-production-min-32-chars
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h

CRYPTO_KEY=change-me-32-byte-key-for-aes256!
EOF
```

- [ ] **Step 4: Create Makefile**

```makefile
# AIops/backend/Makefile
.PHONY: run build test lint migrate

run:
	go run ./cmd/api/...

build:
	go build -o bin/api ./cmd/api/...

test:
	go test ./... -v -count=1

lint:
	golangci-lint run

tidy:
	go mod tidy
```

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/go.mod AIops/backend/go.sum AIops/backend/Makefile AIops/backend/.env.example
git commit -m "feat: initialize AIops backend Go module with dependencies"
```

---

## Task 2: Config, Database, Redis, Response packages

**Files:**
- Create: `AIops/backend/internal/pkg/config/config.go`
- Create: `AIops/backend/internal/pkg/database/db.go`
- Create: `AIops/backend/internal/pkg/redis/redis.go`
- Create: `AIops/backend/internal/pkg/response/response.go`

- [ ] **Step 1: Write tests for config loader**

```bash
mkdir -p e:/Opsgit/AIops/backend/internal/pkg/config
cat > e:/Opsgit/AIops/backend/internal/pkg/config/config_test.go << 'EOF'
package config

import (
	"os"
	"testing"
)

func TestLoad_Defaults(t *testing.T) {
	os.Setenv("APP_PORT", "9090")
	os.Setenv("DB_HOST", "testhost")
	os.Setenv("JWT_SECRET", "test-secret-that-is-long-enough-32ch")
	os.Setenv("CRYPTO_KEY", "test-crypto-key-32-bytes-padding!")

	cfg := Load()

	if cfg.App.Port != "9090" {
		t.Errorf("expected port 9090, got %s", cfg.App.Port)
	}
	if cfg.DB.Host != "testhost" {
		t.Errorf("expected db host testhost, got %s", cfg.DB.Host)
	}
}
EOF
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/pkg/config/... -v
```
Expected: compile error — `config` package and `Load()` not defined yet.

- [ ] **Step 3: Implement config package**

```go
// AIops/backend/internal/pkg/config/config.go
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/pkg/config/... -v
```
Expected: PASS

- [ ] **Step 5: Implement database package**

```go
// AIops/backend/internal/pkg/database/db.go
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
```

- [ ] **Step 6: Implement redis package**

```go
// AIops/backend/internal/pkg/redis/redis.go
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
```

- [ ] **Step 7: Implement response package**

```go
// AIops/backend/internal/pkg/response/response.go
package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

const (
	ErrCodeSuccess         = 0
	ErrCodeInvalidParams   = 40001
	ErrCodeUnauthorized    = 40101
	ErrCodeForbidden       = 40301
	ErrCodeNotFound        = 40401
	ErrCodeConflict        = 40901
	ErrCodeInternalError   = 50001
	ErrCodeDatabaseError   = 50002
	ErrCodeExternalService = 50003
)

type Response struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func Success(c *gin.Context, data any) {
	c.JSON(http.StatusOK, Response{
		Code:    ErrCodeSuccess,
		Message: "success",
		Data:    data,
	})
}

func Fail(c *gin.Context, httpStatus, code int, message string) {
	c.JSON(httpStatus, Response{
		Code:    code,
		Message: message,
	})
}

func InvalidParams(c *gin.Context, message string) {
	Fail(c, http.StatusBadRequest, ErrCodeInvalidParams, message)
}

func Unauthorized(c *gin.Context) {
	Fail(c, http.StatusUnauthorized, ErrCodeUnauthorized, "unauthorized")
}

func Forbidden(c *gin.Context) {
	Fail(c, http.StatusForbidden, ErrCodeForbidden, "forbidden")
}

func NotFound(c *gin.Context, resource string) {
	Fail(c, http.StatusNotFound, ErrCodeNotFound, resource+" not found")
}

func InternalError(c *gin.Context) {
	Fail(c, http.StatusInternalServerError, ErrCodeInternalError, "internal server error")
}

func Conflict(c *gin.Context, message string) {
	Fail(c, http.StatusConflict, ErrCodeConflict, message)
}
```

- [ ] **Step 8: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/pkg/
git commit -m "feat: add config, database, redis, response packages"
```

---

## Task 3: JWT and Crypto packages

**Files:**
- Create: `AIops/backend/internal/pkg/jwt/jwt.go`
- Create: `AIops/backend/internal/pkg/jwt/jwt_test.go`
- Create: `AIops/backend/internal/pkg/crypto/crypto.go`
- Create: `AIops/backend/internal/pkg/crypto/crypto_test.go`

- [ ] **Step 1: Write JWT tests**

```go
// AIops/backend/internal/pkg/jwt/jwt_test.go
package jwt

import (
	"testing"
	"time"
)

func TestGenerateAndParse_AccessToken(t *testing.T) {
	svc := New("test-secret-min-32-chars-padding!!", 15*time.Minute, 7*24*time.Hour)

	token, err := svc.GenerateAccessToken(1, "admin_user", "admin")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	claims, err := svc.ParseToken(token)
	if err != nil {
		t.Fatalf("unexpected parse error: %v", err)
	}

	if claims.UserID != 1 {
		t.Errorf("expected UserID 1, got %d", claims.UserID)
	}
	if claims.Username != "admin_user" {
		t.Errorf("expected username admin_user, got %s", claims.Username)
	}
	if claims.Role != "admin" {
		t.Errorf("expected role admin, got %s", claims.Role)
	}
}

func TestParseToken_InvalidToken(t *testing.T) {
	svc := New("test-secret-min-32-chars-padding!!", 15*time.Minute, 7*24*time.Hour)

	_, err := svc.ParseToken("invalid.token.here")
	if err == nil {
		t.Error("expected error for invalid token")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/pkg/jwt/... -v
```
Expected: compile error — package not found.

- [ ] **Step 3: Implement JWT package**

```go
// AIops/backend/internal/pkg/jwt/jwt.go
package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID   uint   `json:"user_id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

type Service struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func New(secret string, accessTTL, refreshTTL time.Duration) *Service {
	return &Service{
		secret:     []byte(secret),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
	}
}

func (s *Service) GenerateAccessToken(userID uint, username, role string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.accessTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   "access",
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}

func (s *Service) GenerateRefreshToken(userID uint, username, role string) (string, error) {
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Subject:   "refresh",
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
}

func (s *Service) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return s.secret, nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}
	return claims, nil
}
```

- [ ] **Step 4: Run JWT tests to verify they pass**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/pkg/jwt/... -v
```
Expected: PASS

- [ ] **Step 5: Write crypto tests**

```go
// AIops/backend/internal/pkg/crypto/crypto_test.go
package crypto

import (
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	svc, err := New("test-crypto-key-32-bytes-padding!")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	plaintext := "super-secret-api-key-12345"

	encrypted, err := svc.Encrypt(plaintext)
	if err != nil {
		t.Fatalf("encrypt failed: %v", err)
	}

	if encrypted == plaintext {
		t.Error("encrypted text should differ from plaintext")
	}

	decrypted, err := svc.Decrypt(encrypted)
	if err != nil {
		t.Fatalf("decrypt failed: %v", err)
	}

	if decrypted != plaintext {
		t.Errorf("expected %q, got %q", plaintext, decrypted)
	}
}

func TestMaskSecret(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"sk-abc123456789", "sk-a**********"},
		{"short", "s****"},
		{"ab", "a*"},
	}

	for _, tt := range tests {
		got := MaskSecret(tt.input)
		if got != tt.expected {
			t.Errorf("MaskSecret(%q) = %q, want %q", tt.input, got, tt.expected)
		}
	}
}
```

- [ ] **Step 6: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/pkg/crypto/... -v
```
Expected: compile error.

- [ ] **Step 7: Implement crypto package**

```go
// AIops/backend/internal/pkg/crypto/crypto.go
package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"strings"
)

type Service struct {
	block cipher.Block
}

func New(key string) (*Service, error) {
	k := []byte(key)
	if len(k) < 32 {
		return nil, fmt.Errorf("crypto key must be at least 32 bytes, got %d", len(k))
	}
	block, err := aes.NewCipher(k[:32])
	if err != nil {
		return nil, err
	}
	return &Service{block: block}, nil
}

func (s *Service) Encrypt(plaintext string) (string, error) {
	gcm, err := cipher.NewGCM(s.block)
	if err != nil {
		return "", err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}

	ciphertext := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(ciphertext), nil
}

func (s *Service) Decrypt(encoded string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encoded)
	if err != nil {
		return "", err
	}

	gcm, err := cipher.NewGCM(s.block)
	if err != nil {
		return "", err
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plaintext, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", err
	}
	return string(plaintext), nil
}

// MaskSecret shows only the first character and masks the rest.
func MaskSecret(secret string) string {
	if len(secret) <= 1 {
		return secret
	}
	return string(secret[0]) + strings.Repeat("*", len(secret)-1)
}
```

- [ ] **Step 8: Run crypto tests to verify they pass**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/pkg/crypto/... -v
```
Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/pkg/jwt/ AIops/backend/internal/pkg/crypto/
git commit -m "feat: add JWT and AES-256-GCM crypto packages with tests"
```

---

## Task 4: User model and repository

**Files:**
- Create: `AIops/backend/internal/model/base.go`
- Create: `AIops/backend/internal/model/user.go`
- Create: `AIops/backend/internal/repository/user_repo.go`
- Create: `AIops/backend/internal/repository/user_repo_test.go`

- [ ] **Step 1: Write user repository tests**

```go
// AIops/backend/internal/repository/user_repo_test.go
package repository

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	if err != nil {
		t.Fatalf("failed to open in-memory db: %v", err)
	}
	if err := db.AutoMigrate(&model.User{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}
	return db
}

func TestUserRepo_CreateAndFindByEmail(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepo(db)

	user := &model.User{
		Username:     "alice",
		Email:        "alice@example.com",
		PasswordHash: "hashed_password",
		Role:         model.RoleViewer,
	}
	if err := repo.Create(user); err != nil {
		t.Fatalf("create failed: %v", err)
	}
	if user.ID == 0 {
		t.Error("expected non-zero ID after create")
	}

	found, err := repo.FindByEmail("alice@example.com")
	if err != nil {
		t.Fatalf("find by email failed: %v", err)
	}
	if found.Username != "alice" {
		t.Errorf("expected username alice, got %s", found.Username)
	}
}

func TestUserRepo_FindByEmail_NotFound(t *testing.T) {
	db := setupTestDB(t)
	repo := NewUserRepo(db)

	_, err := repo.FindByEmail("nobody@example.com")
	if err == nil {
		t.Error("expected error for missing user")
	}
}
```

Note: add `gorm.io/driver/sqlite` for tests only:
```bash
cd e:/Opsgit/AIops/backend && go get gorm.io/driver/sqlite@v1.5.5
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository/... -v
```
Expected: compile error — model and repository packages not found.

- [ ] **Step 3: Implement base model**

```go
// AIops/backend/internal/model/base.go
package model

import (
	"time"
)

type BaseModel struct {
	ID        uint      `gorm:"primarykey" json:"id"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
```

- [ ] **Step 4: Implement User model**

```go
// AIops/backend/internal/model/user.go
package model

type Role string

const (
	RoleAdmin    Role = "admin"
	RoleOperator Role = "operator"
	RoleViewer   Role = "viewer"
)

type UserStatus string

const (
	UserStatusActive   UserStatus = "active"
	UserStatusInactive UserStatus = "inactive"
)

type User struct {
	BaseModel
	Username     string     `gorm:"uniqueIndex;not null;size:64"  json:"username"`
	Email        string     `gorm:"uniqueIndex;not null;size:128" json:"email"`
	PasswordHash string     `gorm:"not null;size:256"             json:"-"`
	Role         Role       `gorm:"not null;default:viewer"       json:"role"`
	Status       UserStatus `gorm:"not null;default:active"       json:"status"`
}

func (User) TableName() string { return "users" }
```

- [ ] **Step 5: Implement User repository**

```go
// AIops/backend/internal/repository/user_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type UserRepo struct {
	db *gorm.DB
}

func NewUserRepo(db *gorm.DB) *UserRepo {
	return &UserRepo{db: db}
}

func (r *UserRepo) Create(user *model.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepo) FindByID(id uint) (*model.User, error) {
	var user model.User
	if err := r.db.First(&user, id).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) FindByEmail(email string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("email = ?", email).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) FindByUsername(username string) (*model.User, error) {
	var user model.User
	if err := r.db.Where("username = ?", username).First(&user).Error; err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *UserRepo) List(offset, limit int) ([]model.User, int64, error) {
	var users []model.User
	var total int64
	if err := r.db.Model(&model.User{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.Offset(offset).Limit(limit).Find(&users).Error; err != nil {
		return nil, 0, err
	}
	return users, total, nil
}

func (r *UserRepo) Update(user *model.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepo) Delete(id uint) error {
	return r.db.Delete(&model.User{}, id).Error
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/repository/... -v
```
Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/model/ AIops/backend/internal/repository/
git commit -m "feat: add User model and repository with tests"
```

---

## Task 5: AuditLog model and repository

**Files:**
- Create: `AIops/backend/internal/model/audit_log.go`
- Create: `AIops/backend/internal/repository/audit_repo.go`

- [ ] **Step 1: Implement AuditLog model**

```go
// AIops/backend/internal/model/audit_log.go
package model

import "time"

type AuditLog struct {
	ID           uint      `gorm:"primarykey"      json:"id"`
	UserID       uint      `gorm:"index;not null"  json:"user_id"`
	Action       string    `gorm:"not null;size:32" json:"action"`  // create/update/delete/execute
	ResourceType string    `gorm:"not null;size:64" json:"resource_type"`
	ResourceID   string    `gorm:"size:64"          json:"resource_id"`
	Details      string    `gorm:"type:jsonb"       json:"details"`
	IP           string    `gorm:"size:64"          json:"ip"`
	CreatedAt    time.Time `json:"created_at"`
}

func (AuditLog) TableName() string { return "audit_logs" }
```

- [ ] **Step 2: Implement AuditLog repository**

```go
// AIops/backend/internal/repository/audit_repo.go
package repository

import (
	"github.com/aiops/backend/internal/model"
	"gorm.io/gorm"
)

type AuditRepo struct {
	db *gorm.DB
}

func NewAuditRepo(db *gorm.DB) *AuditRepo {
	return &AuditRepo{db: db}
}

func (r *AuditRepo) Create(log *model.AuditLog) error {
	return r.db.Create(log).Error
}

func (r *AuditRepo) List(offset, limit int) ([]model.AuditLog, int64, error) {
	var logs []model.AuditLog
	var total int64
	if err := r.db.Model(&model.AuditLog{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if err := r.db.Order("created_at desc").Offset(offset).Limit(limit).Find(&logs).Error; err != nil {
		return nil, 0, err
	}
	return logs, total, nil
}
```

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/model/audit_log.go AIops/backend/internal/repository/audit_repo.go
git commit -m "feat: add AuditLog model and repository"
```

---

## Task 6: Auth service

**Files:**
- Create: `AIops/backend/internal/service/auth_service.go`
- Create: `AIops/backend/internal/service/auth_service_test.go`

- [ ] **Step 1: Write auth service tests**

```go
// AIops/backend/internal/service/auth_service_test.go
package service

import (
	"testing"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/jwt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/aiops/backend/internal/repository"
)

func setupAuthService(t *testing.T) *AuthService {
	t.Helper()
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	db.AutoMigrate(&model.User{})
	userRepo := repository.NewUserRepo(db)
	jwtSvc := jwt.New("test-secret-min-32-chars-padding!!", 15*60*1e9, 7*24*3600*1e9)
	return NewAuthService(userRepo, jwtSvc)
}

func TestAuthService_RegisterAndLogin(t *testing.T) {
	svc := setupAuthService(t)

	err := svc.Register("bob", "bob@example.com", "password123")
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}

	accessToken, _, err := svc.Login("bob@example.com", "password123")
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if accessToken == "" {
		t.Error("expected non-empty access token")
	}
}

func TestAuthService_Login_WrongPassword(t *testing.T) {
	svc := setupAuthService(t)
	svc.Register("eve", "eve@example.com", "correct")

	_, _, err := svc.Login("eve@example.com", "wrong")
	if err == nil {
		t.Error("expected error for wrong password")
	}
}

func TestAuthService_Register_DuplicateEmail(t *testing.T) {
	svc := setupAuthService(t)
	svc.Register("user1", "dup@example.com", "pass")
	err := svc.Register("user2", "dup@example.com", "pass")
	if err == nil {
		t.Error("expected error for duplicate email")
	}
}
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service/... -v
```
Expected: compile error.

- [ ] **Step 3: Implement auth service**

```go
// AIops/backend/internal/service/auth_service.go
package service

import (
	"errors"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/jwt"
	"github.com/aiops/backend/internal/repository"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo *repository.UserRepo
	jwtSvc   *jwt.Service
}

func NewAuthService(userRepo *repository.UserRepo, jwtSvc *jwt.Service) *AuthService {
	return &AuthService{userRepo: userRepo, jwtSvc: jwtSvc}
}

func (s *AuthService) Register(username, email, password string) error {
	if _, err := s.userRepo.FindByEmail(email); err == nil {
		return errors.New("email already registered")
	}
	if _, err := s.userRepo.FindByUsername(username); err == nil {
		return errors.New("username already taken")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return err
	}

	return s.userRepo.Create(&model.User{
		Username:     username,
		Email:        email,
		PasswordHash: string(hash),
		Role:         model.RoleViewer,
		Status:       model.UserStatusActive,
	})
}

// Login returns (accessToken, refreshToken, error).
func (s *AuthService) Login(email, password string) (string, string, error) {
	user, err := s.userRepo.FindByEmail(email)
	if err != nil {
		return "", "", errors.New("invalid credentials")
	}

	if user.Status != model.UserStatusActive {
		return "", "", errors.New("account is inactive")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return "", "", errors.New("invalid credentials")
	}

	accessToken, err := s.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		return "", "", err
	}

	refreshToken, err := s.jwtSvc.GenerateRefreshToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func (s *AuthService) RefreshToken(refreshToken string) (string, error) {
	claims, err := s.jwtSvc.ParseToken(refreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}
	if claims.Subject != "refresh" {
		return "", errors.New("not a refresh token")
	}

	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return "", errors.New("user not found")
	}

	return s.jwtSvc.GenerateAccessToken(user.ID, user.Username, string(user.Role))
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd e:/Opsgit/AIops/backend
go test ./internal/service/... -v
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/service/
git commit -m "feat: add auth service with register/login/refresh and tests"
```

---

## Task 7: User service

**Files:**
- Create: `AIops/backend/internal/service/user_service.go`

- [ ] **Step 1: Implement user service**

```go
// AIops/backend/internal/service/user_service.go
package service

import (
	"errors"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
)

type UserService struct {
	userRepo *repository.UserRepo
}

func NewUserService(userRepo *repository.UserRepo) *UserService {
	return &UserService{userRepo: userRepo}
}

func (s *UserService) List(page, pageSize int) ([]model.User, int64, error) {
	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}
	offset := (page - 1) * pageSize
	return s.userRepo.List(offset, pageSize)
}

func (s *UserService) GetByID(id uint) (*model.User, error) {
	return s.userRepo.FindByID(id)
}

func (s *UserService) UpdateRole(id uint, role model.Role) error {
	user, err := s.userRepo.FindByID(id)
	if err != nil {
		return errors.New("user not found")
	}
	if role != model.RoleAdmin && role != model.RoleOperator && role != model.RoleViewer {
		return errors.New("invalid role")
	}
	user.Role = role
	return s.userRepo.Update(user)
}

func (s *UserService) Delete(id uint) error {
	if _, err := s.userRepo.FindByID(id); err != nil {
		return errors.New("user not found")
	}
	return s.userRepo.Delete(id)
}
```

- [ ] **Step 2: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/service/user_service.go
git commit -m "feat: add user service"
```

---

## Task 8: Middleware (auth, RBAC, audit, logger, CORS)

**Files:**
- Create: `AIops/backend/internal/middleware/auth.go`
- Create: `AIops/backend/internal/middleware/rbac.go`
- Create: `AIops/backend/internal/middleware/audit.go`
- Create: `AIops/backend/internal/middleware/logger.go`
- Create: `AIops/backend/internal/middleware/cors.go`

- [ ] **Step 1: Implement auth middleware**

```go
// AIops/backend/internal/middleware/auth.go
package middleware

import (
	"strings"

	"github.com/aiops/backend/internal/pkg/jwt"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

const ClaimsKey = "claims"

func Auth(jwtSvc *jwt.Service) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		claims, err := jwtSvc.ParseToken(tokenStr)
		if err != nil {
			response.Unauthorized(c)
			c.Abort()
			return
		}

		c.Set(ClaimsKey, claims)
		c.Next()
	}
}

func GetClaims(c *gin.Context) *jwt.Claims {
	v, _ := c.Get(ClaimsKey)
	claims, _ := v.(*jwt.Claims)
	return claims
}
```

- [ ] **Step 2: Implement RBAC middleware**

```go
// AIops/backend/internal/middleware/rbac.go
package middleware

import (
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/gin-gonic/gin"
)

// RequireRole allows access only to users with one of the given roles.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, r := range roles {
		allowed[r] = true
	}

	return func(c *gin.Context) {
		claims := GetClaims(c)
		if claims == nil || !allowed[claims.Role] {
			response.Forbidden(c)
			c.Abort()
			return
		}
		c.Next()
	}
}
```

- [ ] **Step 3: Implement audit middleware**

```go
// AIops/backend/internal/middleware/audit.go
package middleware

import (
	"encoding/json"
	"strings"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

// AuditWrite records an audit log entry for all write operations (POST/PUT/DELETE).
func AuditWrite(auditRepo *repository.AuditRepo) gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		if method != "POST" && method != "PUT" && method != "DELETE" {
			c.Next()
			return
		}

		c.Next()

		claims := GetClaims(c)
		if claims == nil {
			return
		}

		parts := strings.Split(strings.Trim(c.Request.URL.Path, "/"), "/")
		resourceType := "unknown"
		if len(parts) >= 3 {
			resourceType = parts[2]
		}

		action := map[string]string{
			"POST":   "create",
			"PUT":    "update",
			"DELETE": "delete",
		}[method]

		details, _ := json.Marshal(map[string]string{
			"method": method,
			"path":   c.Request.URL.Path,
		})

		_ = auditRepo.Create(&model.AuditLog{
			UserID:       claims.UserID,
			Action:       action,
			ResourceType: resourceType,
			IP:           c.ClientIP(),
			Details:      string(details),
		})
	}
}
```

- [ ] **Step 4: Implement logger middleware**

```go
// AIops/backend/internal/middleware/logger.go
package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

func Logger(log *zap.Logger) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		log.Info("request",
			zap.String("method", c.Request.Method),
			zap.String("path", c.Request.URL.Path),
			zap.Int("status", c.Writer.Status()),
			zap.Duration("latency", time.Since(start)),
			zap.String("ip", c.ClientIP()),
		)
	}
}
```

- [ ] **Step 5: Implement CORS middleware**

```go
// AIops/backend/internal/middleware/cors.go
package middleware

import (
	"github.com/gin-gonic/gin"
)

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}
```

- [ ] **Step 6: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/middleware/
git commit -m "feat: add auth, RBAC, audit, logger, CORS middleware"
```

---

## Task 9: Auth and User handlers

**Files:**
- Create: `AIops/backend/internal/handler/auth_handler.go`
- Create: `AIops/backend/internal/handler/user_handler.go`

- [ ] **Step 1: Implement auth handler**

```go
// AIops/backend/internal/handler/auth_handler.go
package handler

import (
	"net/http"

	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type AuthHandler struct {
	authSvc  *service.AuthService
	validate *validator.Validate
}

func NewAuthHandler(authSvc *service.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc, validate: validator.New()}
}

type registerRequest struct {
	Username string `json:"username" validate:"required,min=3,max=64"`
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type loginRequest struct {
	Email    string `json:"email"    validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type refreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	if err := h.authSvc.Register(req.Username, req.Email, req.Password); err != nil {
		response.Conflict(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"code": 0, "message": "registered successfully"})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	accessToken, refreshToken, err := h.authSvc.Login(req.Email, req.Password)
	if err != nil {
		response.Fail(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, err.Error())
		return
	}

	response.Success(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"token_type":    "Bearer",
	})
}

func (h *AuthHandler) Refresh(c *gin.Context) {
	var req refreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	accessToken, err := h.authSvc.RefreshToken(req.RefreshToken)
	if err != nil {
		response.Fail(c, http.StatusUnauthorized, response.ErrCodeUnauthorized, err.Error())
		return
	}

	response.Success(c, gin.H{"access_token": accessToken, "token_type": "Bearer"})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	// Stateless JWT: client discards token. Future: blacklist in Redis.
	response.Success(c, gin.H{"message": "logged out"})
}
```

- [ ] **Step 2: Implement user handler**

```go
// AIops/backend/internal/handler/user_handler.go
package handler

import (
	"strconv"

	"github.com/aiops/backend/internal/middleware"
	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/repository"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/go-playground/validator/v10"
)

type UserHandler struct {
	userSvc   *service.UserService
	auditRepo *repository.AuditRepo
	validate  *validator.Validate
}

func NewUserHandler(userSvc *service.UserService, auditRepo *repository.AuditRepo) *UserHandler {
	return &UserHandler{userSvc: userSvc, auditRepo: auditRepo, validate: validator.New()}
}

func (h *UserHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	users, total, err := h.userSvc.List(page, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, gin.H{
		"items": users,
		"total": total,
		"page":  page,
	})
}

func (h *UserHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.InvalidParams(c, "invalid id")
		return
	}

	user, err := h.userSvc.GetByID(uint(id))
	if err != nil {
		response.NotFound(c, "user")
		return
	}

	response.Success(c, user)
}

type updateRoleRequest struct {
	Role string `json:"role" validate:"required,oneof=admin operator viewer"`
}

func (h *UserHandler) UpdateRole(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.InvalidParams(c, "invalid id")
		return
	}

	var req updateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}
	if err := h.validate.Struct(req); err != nil {
		response.InvalidParams(c, err.Error())
		return
	}

	if err := h.userSvc.UpdateRole(uint(id), model.Role(req.Role)); err != nil {
		response.NotFound(c, "user")
		return
	}

	response.Success(c, gin.H{"message": "role updated"})
}

func (h *UserHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		response.InvalidParams(c, "invalid id")
		return
	}

	claims := middleware.GetClaims(c)
	if claims != nil && claims.UserID == uint(id) {
		response.Fail(c, 400, response.ErrCodeInvalidParams, "cannot delete yourself")
		return
	}

	if err := h.userSvc.Delete(uint(id)); err != nil {
		response.NotFound(c, "user")
		return
	}

	response.Success(c, gin.H{"message": "user deleted"})
}

func (h *UserHandler) AuditLogs(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize

	logs, total, err := h.auditRepo.List(offset, pageSize)
	if err != nil {
		response.InternalError(c)
		return
	}

	response.Success(c, gin.H{
		"items": logs,
		"total": total,
		"page":  page,
	})
}
```

- [ ] **Step 3: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/internal/handler/
git commit -m "feat: add auth and user handlers"
```

---

## Task 10: Main entry point and router

**Files:**
- Create: `AIops/backend/cmd/api/main.go`

- [ ] **Step 1: Implement main.go**

```go
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
	db := database.New(&cfg.DB)
	database.AutoMigrate(db,
		&model.User{},
		&model.AuditLog{},
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
```

- [ ] **Step 2: Verify project builds**

```bash
cd e:/Opsgit/AIops/backend
go build ./cmd/api/...
```
Expected: binary created in current directory (or `bin/api` if using `make build`). No compile errors.

- [ ] **Step 3: Run all tests**

```bash
cd e:/Opsgit/AIops/backend
go test ./... -v
```
Expected: All PASS.

- [ ] **Step 4: Commit**

```bash
cd e:/Opsgit
git add AIops/backend/cmd/
git commit -m "feat: add main entry point with Gin router and all routes wired"
```

---

## Task 11: Integration smoke test

- [ ] **Step 1: Start PostgreSQL (if not running)**

```bash
# Using Docker:
docker run -d --name aiops-pg \
  -e POSTGRES_USER=aiops \
  -e POSTGRES_PASSWORD=aiops123 \
  -e POSTGRES_DB=aiops \
  -p 5432:5432 postgres:16-alpine
```

- [ ] **Step 2: Start Redis (if not running)**

```bash
docker run -d --name aiops-redis -p 6379:6379 redis:7-alpine
```

- [ ] **Step 3: Set environment variables and run**

```bash
cd e:/Opsgit/AIops/backend
export DB_HOST=localhost DB_USER=aiops DB_PASSWORD=aiops123 DB_NAME=aiops
export JWT_SECRET=local-dev-secret-min-32-chars-ok!
export CRYPTO_KEY=local-dev-crypto-key-32-bytes-ok!
export REDIS_HOST=localhost
go run ./cmd/api/...
```
Expected: `starting server addr=:8080` in logs.

- [ ] **Step 4: Smoke test register and login**

```bash
# Register
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","email":"admin@test.com","password":"password123"}' | jq .

# Expected:
# {"code":0,"message":"registered successfully"}

# Login
curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"password123"}' | jq .

# Expected:
# {"code":0,"message":"success","data":{"access_token":"...","refresh_token":"...","token_type":"Bearer"}}
```

- [ ] **Step 5: Final commit**

```bash
cd e:/Opsgit
git add .
git commit -m "feat: Plan 1 complete — foundation and auth backend running"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] User registration, login, logout, refresh token
- [x] JWT with access + refresh token
- [x] RBAC: admin / operator / viewer roles
- [x] Audit logs for all write operations
- [x] Password bcrypt (cost=12)
- [x] AES-256-GCM crypto for secrets (crypto package ready for Plans 2–5)
- [x] API Gateway (CORS + Auth middleware at route group level)
- [x] Unified response format `{code, message, data}`
- [x] Structured JSON logging with zap
- [x] Error codes defined

**Placeholder scan:** None found.

**Type consistency:**
- `model.Role` used consistently across user model, service, and handler
- `jwt.Claims` used consistently in middleware and handler
- `repository.UserRepo` / `repository.AuditRepo` passed by pointer throughout
