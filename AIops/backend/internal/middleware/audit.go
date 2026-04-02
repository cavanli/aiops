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
