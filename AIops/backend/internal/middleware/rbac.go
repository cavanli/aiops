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
