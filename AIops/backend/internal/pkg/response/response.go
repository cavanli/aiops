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
