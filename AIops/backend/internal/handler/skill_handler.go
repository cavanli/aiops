// internal/handler/skill_handler.go
package handler

import (
	"net/http"
	"strconv"

	"github.com/aiops/backend/internal/model"
	"github.com/aiops/backend/internal/pkg/response"
	"github.com/aiops/backend/internal/service"
	"github.com/gin-gonic/gin"
)

type SkillHandler struct {
	skillSvc *service.SkillService
}

func NewSkillHandler(skillSvc *service.SkillService) *SkillHandler {
	return &SkillHandler{skillSvc: skillSvc}
}

type CreateSkillRequest struct {
	Name          string `json:"name" binding:"required"`
	Category      string `json:"category" binding:"required,oneof=env_setup deployment testing security"`
	Description   string `json:"description"`
	ScriptContent string `json:"script_content"`
	ScriptType    string `json:"script_type" binding:"omitempty,oneof=shell python ansible"`
	Author        string `json:"author"`
}

func (h *SkillHandler) CreateSkill(c *gin.Context) {
	var req CreateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}

	scriptType := req.ScriptType
	if scriptType == "" {
		scriptType = "shell"
	}

	skill := &model.Skill{
		Name:          req.Name,
		Category:      model.SkillCategory(req.Category),
		Description:   req.Description,
		ScriptContent: req.ScriptContent,
		ScriptType:    scriptType,
		Author:        req.Author,
	}

	if err := h.skillSvc.CreateSkill(skill); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, skill)
}

func (h *SkillHandler) GetSkill(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid skill ID")
		return
	}

	skill, err := h.skillSvc.GetSkill(uint(id))
	if err != nil {
		response.Fail(c, http.StatusNotFound, response.ErrCodeNotFound, "skill not found")
		return
	}

	response.Success(c, skill)
}

func (h *SkillHandler) ListSkills(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	category := c.Query("category")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	offset := (page - 1) * pageSize
	skills, total, err := h.skillSvc.ListSkills(offset, pageSize, category)
	if err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, gin.H{
		"items":     skills,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

type UpdateSkillRequest struct {
	Name          string `json:"name"`
	Category      string `json:"category" binding:"omitempty,oneof=env_setup deployment testing security"`
	Description   string `json:"description"`
	ScriptContent string `json:"script_content"`
	ScriptType    string `json:"script_type" binding:"omitempty,oneof=shell python ansible"`
	Author        string `json:"author"`
}

func (h *SkillHandler) UpdateSkill(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid skill ID")
		return
	}

	var req UpdateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, err.Error())
		return
	}

	skill := &model.Skill{
		BaseModel:     model.BaseModel{ID: uint(id)},
		Name:          req.Name,
		Category:      model.SkillCategory(req.Category),
		Description:   req.Description,
		ScriptContent: req.ScriptContent,
		ScriptType:    req.ScriptType,
		Author:        req.Author,
	}

	if err := h.skillSvc.UpdateSkill(skill); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, skill)
}

func (h *SkillHandler) DeleteSkill(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		response.Fail(c, http.StatusBadRequest, response.ErrCodeInvalidParams, "invalid skill ID")
		return
	}

	if err := h.skillSvc.DeleteSkill(uint(id)); err != nil {
		response.Fail(c, http.StatusInternalServerError, response.ErrCodeInternalError, err.Error())
		return
	}

	response.Success(c, nil)
}
