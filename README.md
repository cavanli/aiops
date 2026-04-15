# AIOps 智能部署中台 - 详细产品需求文档 (Detailed PRD)

## 1. 项目概述
### 1.1 项目愿景
打造一个灵活、智能的运维中台，将 Ansible 的执行力与大语言模型 (LLM) 的理解力有机结合。系统支持“双模驱动”：既可以通过 AI 自动解析部署方案，也可以在无 AI 引擎的情况下，通过加载预定义的技能库与工作流实现标准化部署。

### 1.2 核心价值
- **降低门槛**：无需深厚的 Ansible 编写经验，通过自然语言方案驱动部署。
- **提升效率**：自动化解析复杂方案，减少人工配置错误。
- **闭环管理**：从主机纳管、资产管理到流程编排、AI 审计的全生命周期管理。

---

## 2. 用户角色
- **运维工程师 (DevOps)**：负责主机纳管、资产上传、工作流编排及部署实施。
- **系统管理员 (Admin)**：负责模型接入、MCP 服务配置、系统权限管理。

---

## 3. 信息架构 (Information Architecture)
### 3.1 导航结构
- **控制面板 (Dashboard)**：全局状态监控、快捷入口。
- **主机管理 (Host Management)**：主机清单管理、分组管理、连通性测试。
- **部署资源 (Deployment Resources)**：部署资产管理、文件上传、批量分发。
- **技能中心 (Skill Center)**：原子技能管理、MCP 服务集成。
- **部署编排 (Deployment Orchestration)**：可视化编排、Ansible/AI 混合工作流。
- **智能部署 (Intelligent Deployment)**：AI 驱动的方案解析与自动化部署向导。
- **系统设置 (Settings)**：API Key 管理、全局配置。

---

## 4. 详细功能需求

### 4.1 部署向导 (Deployment Wizard)
**场景**：用户点击“新建部署”，系统提供两种路径：
- **路径 A：智能驱动 (AI-Driven)**
    - **前提**：已配置大模型引擎。
    - **流程**：上传方案 -> AI 自动解析 -> 识别主机与资产 -> 生成临时工作流 -> 执行。
- **路径 B：标准驱动 (Standard-Driven)**
    - **前提**：无 AI 引擎或用户选择手动。
    - **流程**：选择预定义工作流 -> 加载技能包 -> 手动关联主机与资产 -> 执行。
- **通用步骤**：
    - **执行与监控**：实时流式日志输出，进度条显示。

### 4.2 主机管理 (Host Management)
- **核心功能**：
    - 支持 Ansible Inventory 格式导入。
    - 实时 Ping 测试，显示系统版本、内核、负载。
    - 主机分组管理，支持自定义标签。

### 4.3 部署资源 (Deployment Resources)
- **核心功能**：
    - 资产类型：Playbook, Role, Config, Static File。
    - **批量分发**：
        - 选择资产 -> 选择主机组 -> 指定目标路径。
        - 逻辑：后台调用 Ansible `copy` 或 `unarchive` 模块。
        - 状态：显示“已就绪”、“同步中”、“失败”。

### 4.4 技能中心 (Skill Center)
- **核心功能**：
    - **技能管理**：原子化脚本封装，支持参数化调用。
    - **MCP 集成**：启动/停止 MCP 服务，为智能体提供实时上下文。

### 4.5 部署编排 (Deployment Orchestration)
- **编排画布**：
    - 节点类型：
        - **Ansible 节点**（核心）：执行指定 Playbook 或 Ad-hoc 命令。
        - **技能节点**（核心）：加载原子化技能包。
        - **AI 节点**（可选）：逻辑判断、文本处理、异常分析。
        - **控制节点**：并行、分支、等待。
- **执行历史**：记录每次运行的详细日志、耗时及节点状态。

### 4.6 智能部署 (Intelligent Deployment)
- **核心功能**：
    - **智能体定义**：名称、角色描述、关联模型、工具集 (Skills)。
    - **模型管理**：配置多个 Provider 的 API Key，支持模型切换与参数调优。

---

## 5. 数据模型 (Data Models)

### 5.1 主机 (Host)
```json
{
  "id": "string",
  "hostname": "string",
  "ip": "string",
  "group": "string",
  "status": "online | offline",
  "os": "string",
  "ansible_reachable": "boolean"
}
```

### 5.2 资产 (Asset)
```json
{
  "id": "string (ast-xxx)",
  "name": "string",
  "type": "playbook | role | config | static",
  "path": "string",
  "size": "string",
  "source": "upload | local"
}
```

### 5.3 工作流 (Workflow)
```json
{
  "id": "string",
  "name": "string",
  "steps": [
    {
      "type": "ansible | ai | skill",
      "action": "string",
      "params": "object"
    }
  ]
}
```

---

## 6. 技术实现要点
- **执行引擎**：前端通过 API 触发后端 Python/Ansible 进程（核心能力）。
- **AI 引擎**：作为插件化能力集成，支持多种 Provider。若未配置，系统自动降级为标准工作流模式。
- **AI 交互**：使用 SSE (Server-Sent Events) 实现解析过程的流式反馈。
- **状态管理**：使用 React Context 或 Zustand 管理全局主机/资产状态。
- **动画效果**：使用 `motion` 实现模态框弹出、进度条滚动及列表进入效果。

---

## 7. UI/UX 规范
- **色调**：深色侧边栏 (Slate-900) + 浅色内容区 (Slate-50) + 品牌色 (Indigo-600)。
- **字体**：Inter (UI), JetBrains Mono (Code/Logs)。
- **交互**：
    - 所有长耗时操作需有 Loading 状态。
    - 关键操作（如删除、分发）需有二次确认。
    - 列表支持搜索与筛选。

---

## 8. 安全性
- **API Key 保护**：所有密钥存储在环境变量中，前端不暴露。
- **权限控制**：基于角色的访问控制 (RBAC)。
- **审计日志**：记录所有部署操作的执行人、时间及结果。
