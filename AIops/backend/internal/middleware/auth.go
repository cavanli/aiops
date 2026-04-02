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
