---
name: "DockerOps"
emoji: "🐳"
description: "Docker 运维专家 - 容器管理、镜像优化、网络排查、集群运维"
os: [linux, darwin, windows]
requires:
  bins: [docker]
version: "1.1.0"
author: "OpenOcta"
category: "containers"
tags: [docker, container, devops, microservices]
---

## 配置说明

### 环境变量配置
```bash
# Docker 连接配置
export DOCKER_HOST="unix:///var/run/docker.sock"
export DOCKER_TLS_VERIFY="1"
export DOCKER_CERT_PATH="~/.docker"

# 镜像仓库配置
export DOCKER_REGISTRY="docker.io"
export DOCKER_USERNAME=""
export DOCKER_PASSWORD=""

# 日志配置
export DOCKER_LOG_LEVEL="info"
export DOCKER_LOG_DRIVER="json-file"
export DOCKER_LOG_OPTS="max-size=10m,max-file=3"
```

### 配置文件示例
```json
// ~/.docker/config.json
{
  "auths": {
    "https://index.docker.io/v1/": {
      "auth": "base64_encoded_credentials"
    }
  },
  "HttpHeaders": {
    "User-Agent": "Docker-Client/24.0.0"
  },
  "psFormat": "table {{.ID}}\t{{.Image}}\t{{.Status}}\t{{.Names}}",
  "imagesFormat": "table {{.ID}}\t{{.Repository}}\t{{.Tag}}\t{{.Size}}"
}
```

## 输入参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `container_name` | string | 否 | 容器名称 | `nginx-app` |
| `image_name` | string | 否 | 镜像名称 | `nginx:latest` |
| `command` | string | 否 | 执行命令 | `stats` |
| `namespace` | string | 否 | Docker Swarm 命名空间 | `production` |

## 输出格式

### 容器状态输出
```json
{
  "status": "success",
  "data": {
    "containers": [
      {
        "id": "abc123def456",
        "name": "nginx-app",
        "image": "nginx:latest",
        "status": "running",
        "ports": ["80:8080"],
        "resources": {
          "cpu": "50%",
          "memory": "128MiB/256MiB"
        }
      }
    ]
  }
}
```

> **PowerShell 支持**: 本 Skill 中的 docker 命令在 Windows PowerShell 中完全兼容，可直接使用。以下提供 Windows 特定的路径和额外命令。

# Docker 运维助手

你是 Docker 容器运维专家，擅长容器生命周期管理、镜像优化、网络故障排查和 Docker Swarm 集群运维。

## 核心能力

- **容器管理**：生命周期管理、资源限制、健康检查、日志管理
- **镜像优化**：多阶段构建、层缓存、镜像瘦身、安全扫描
- **网络排查**：网络模式、端口映射、DNS 解析、跨主机通信
- **存储管理**：Volume、Bind Mount、存储驱动、数据备份
- **安全加固**：Capabilities、Seccomp、AppArmor、用户命名空间
- **集群运维**：Swarm 模式、服务编排、滚动更新、故障转移
- **性能调优**：资源限制、CGroups、运行时优化

## 标准诊断流程

```bash
# 1. Docker 基本信息
docker version
docker info

# 2. 容器状态
docker ps -a
docker stats --no-stream

# 3. 资源使用
docker system df -v
docker system events --since 1h

# 4. 日志查看
docker logs <container>
docker logs --tail 100 -f <container>

# 5. 网络检查
docker network ls
docker network inspect <network>
```

## 常见故障处理

### 1. 容器无法启动
```bash
# 查看容器状态
docker ps -a --filter "status=exited"

# 查看详细日志
docker logs --tail 100 <container_id>

# 检查退出码
docker inspect <container_id> --format='{{.State.ExitCode}}'

# 常见退出码：
# 0 - 正常退出
# 1 - 应用程序错误
# 137 (128+9) - 被 SIGKILL 终止（通常是 OOM）
# 143 (128+15) - 被 SIGTERM 终止

# 检查资源限制
docker inspect <container_id> | grep -A 10 "Memory"

# 手动运行调试
docker run -it --entrypoint /bin/sh <image>
```

### 2. 镜像拉取失败
```bash
# 检查网络
curl -v https://registry-1.docker.io/v2/

# 配置镜像加速
cat > /etc/docker/daemon.json <<EOF
{
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
}
EOF
systemctl restart docker

# 登录镜像仓库
docker login registry.example.com

# 检查镜像是否存在
docker pull nginx:alpine  # 测试拉取
```

**PowerShell (Windows)**:
```powershell
# 检查网络
Test-NetConnection -ComputerName registry-1.docker.io -Port 443
Invoke-WebRequest -Uri https://registry-1.docker.io/v2/ -UseBasicParsing

# 配置镜像加速 (Windows)
# 编辑 C:\ProgramData\docker\config\daemon.json
$config = @{
    "registry-mirrors" = @(
        "https://docker.mirrors.ustc.edu.cn",
        "https://hub-mirror.c.163.com"
    )
} | ConvertTo-Json -Depth 10

$config | Out-File -FilePath "C:\ProgramData\docker\config\daemon.json" -Encoding utf8

# 重启 Docker 服务
Restart-Service docker

# 或使用 sc 命令
sc stop docker
sc start docker

# 登录镜像仓库
docker login registry.example.com

# 检查镜像
docker pull nginx:alpine
```

### 3. 容器网络不通
```bash
# 查看容器网络配置
docker inspect <container> --format='{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# 进入容器测试
docker exec -it <container> ping 8.8.8.8

# 检查端口映射
docker port <container>

# 检查 iptables
iptables -t nat -L DOCKER -n --line-numbers

# 检查 DNS
docker exec <container> cat /etc/resolv.conf

# 创建测试容器
docker run --rm --network container:<target_container> busybox wget -O- http://localhost:8080
```

### 4. 磁盘空间不足
```bash
# 查看空间使用
docker system df

# 清理未使用数据
docker system prune -a  # 清理所有未使用
docker volume prune      # 清理未使用卷
docker image prune       # 清理未使用镜像

# 清理特定资源
docker rm $(docker ps -aq)  # 删除所有容器
docker rmi $(docker images -q -f dangling=true)  # 删除悬空镜像

# 查看容器层大小
docker ps -s
```

**PowerShell (Windows)**:
```powershell
# 查看空间使用
docker system df

# 清理未使用数据
docker system prune -a
docker volume prune
docker image prune

# 清理特定资源 (PowerShell 语法)
docker ps -aq | ForEach-Object { docker rm $_ }  # 删除所有容器
docker images -q -f dangling=true | ForEach-Object { docker rmi $_ }  # 删除悬空镜像

# 查看容器层大小
docker ps -s

# 检查 Docker 数据根目录磁盘空间 (Windows 默认在 C:\ProgramData\docker)
Get-ChildItem "C:\ProgramData\docker" -Recurse | Measure-Object -Property Length -Sum

# 查看 Windows Docker 磁盘使用情况
Get-Volume | Where-Object {$_.DriveLetter -eq 'C'} | Select-Object DriveLetter, @{N="SizeGB";E={[math]::Round($_.Size/1GB, 2)}}, @{N="UsedGB";E={[math]::Round(($_.Size - $_.SizeRemaining)/1GB, 2)}}, @{N="FreeGB";E={[math]::Round($_.SizeRemaining/1GB, 2)}}
```

### 5. 容器 OOM
```bash
# 检查 OOM 事件
docker inspect <container> | grep OOMKilled
dmesg | grep -i "killed process"

# 查看内存限制
docker inspect <container> --format='{{.HostConfig.Memory}}'

# 调整内存限制
docker update --memory 2g --memory-swap 2g <container>

# 运行新容器时设置
docker run -m 2g --memory-swap 2g <image>
```

## 镜像优化最佳实践

### Dockerfile 优化
```dockerfile
# 使用多阶段构建
FROM golang:1.19 AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
CMD ["./main"]

# 优化建议：
# 1. 使用 .dockerignore 排除不必要文件
# 2. 合并 RUN 指令减少层数
# 3. 使用 alpine 或 distroless 基础镜像
# 4. 固定镜像版本标签
```

### 镜像安全扫描
```bash
# 使用 Trivy 扫描
trivy image nginx:latest

# 使用 Docker Scout
docker scout quickview nginx:latest
docker scout cves nginx:latest

# 使用 Snyk
docker scan nginx:latest
```

## 网络故障排查

```bash
# 查看容器网络命名空间
ls -la /var/run/docker/netns/

# 进入网络命名空间调试
nsenter --net=/var/run/docker/netns/<id> ip addr

# 查看 iptables 规则
iptables -t nat -L -n -v | grep DOCKER

# 查看网桥
docker network inspect bridge
brctl show

# 测试容器间通信
docker run --rm --network container:<container> nicolaka/netshoot ping localhost
```

**PowerShell (Windows)**:
```powershell
# Windows Docker 使用不同的网络模型 (NAT 或 WSL2)
# 查看 Docker 网络
docker network ls
docker network inspect bridge

# 查看 Windows 网络配置
Get-NetAdapter | Where-Object {$_.Name -like "*Docker*"}
Get-NetIPAddress | Where-Object {$_.InterfaceAlias -like "*Docker*"}

# 查看端口映射
Get-NetTCPConnection | Where-Object {$_.LocalPort -in (80, 443, 8080)}

# 测试容器间通信
docker run --rm --network container:<container> nicolaka/netshoot ping localhost

# Windows 容器网络诊断
docker network inspect nat
Get-ContainerNetwork
```

## Docker Compose 运维

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 扩展服务
docker-compose up -d --scale web=3

# 滚动更新
docker-compose pull
docker-compose up -d

# 健康检查
docker-compose ps
docker-compose events
```

## Swarm 集群运维

```bash
# 初始化集群
docker swarm init --advertise-addr <ip>

# 加入节点
docker swarm join --token <token> <manager-ip>:2377

# 查看节点
docker node ls
docker node inspect <node>

# 部署服务
docker service create --name web --replicas 3 -p 80:80 nginx

# 更新服务
docker service update --image nginx:alpine web

# 查看服务状态
docker service ps web
docker service logs web

# 故障转移
docker node update --availability drain <node>
```

## 监控指标

```bash
# 启用 Docker 远程 API 监控
# /etc/docker/daemon.json
{
  "metrics-addr": "0.0.0.0:9323",
  "experimental": true
}

# 关键指标
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.PIDs}}"

# cAdvisor 监控
docker run -d --name=cadvisor \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --publish=8080:8080 \
  google/cadvisor:latest
```

## MCP 工具支持

本 Skill 可通过 MCP (Model Context Protocol) 提供以下工具：

### 工具列表

| 工具名称 | 描述 | 必需参数 |
|---------|------|---------|
| `docker_check_system` | 检查 Docker 系统信息和资源使用 | 无 |
| `docker_list_containers` | 列出容器状态 | 无 |
| `docker_get_container_logs` | 获取容器日志 | container_id |
| `docker_inspect_container` | 查看容器详细配置和状态 | container_id |
| `docker_check_network` | 检查 Docker 网络配置 | network_name |

### 工具定义示例

```json
{
  "name": "docker_check_system",
  "description": "检查 Docker 系统信息，包括版本、存储驱动、资源使用等",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

```json
{
  "name": "docker_list_containers",
  "description": "列出所有容器及其状态，支持过滤",
  "inputSchema": {
    "type": "object",
    "properties": {
      "all": {
        "type": "boolean",
        "description": "是否显示已停止的容器",
        "default": true
      },
      "filter": {
        "type": "string",
        "description": "过滤条件，如 status=running"
      }
    }
  }
}
```

```json
{
  "name": "docker_get_container_logs",
  "description": "获取容器日志",
  "inputSchema": {
    "type": "object",
    "properties": {
      "container_id": {
        "type": "string",
        "description": "容器 ID 或名称"
      },
      "tail": {
        "type": "integer",
        "description": "显示最后 N 行",
        "default": 100
      },
      "follow": {
        "type": "boolean",
        "description": "是否持续跟踪日志",
        "default": false
      }
    },
    "required": ["container_id"]
  }
}
```

```json
{
  "name": "docker_inspect_container",
  "description": "查看容器详细配置、状态、网络、资源限制等",
  "inputSchema": {
    "type": "object",
    "properties": {
      "container_id": {
        "type": "string",
        "description": "容器 ID 或名称"
      }
    },
    "required": ["container_id"]
  }
}
```

```json
{
  "name": "docker_check_network",
  "description": "检查 Docker 网络配置和连接状态",
  "inputSchema": {
    "type": "object",
    "properties": {
      "network_name": {
        "type": "string",
        "description": "网络名称，为空则列出所有网络"
      }
    }
  }
}
```

### Python MCP Server 示例

```python
from mcp.server import Server
from mcp.types import TextContent
import subprocess
import json

app = Server("docker-ops")

@app.call_tool()
def call_tool(name: str, arguments: dict):
    if name == "docker_check_system":
        commands = [
            "docker version --format 'Server: {{.Server.Version}}'",
            "docker info --format 'Storage Driver: {{.Driver}}\\nContainers: {{.Containers}}\\nImages: {{.Images}}'",
            "docker system df"
        ]
        results = []
        for cmd in commands:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            results.append(result.stdout)
        return [TextContent(type="text", text="\n".join(results))]

    elif name == "docker_list_containers":
        all_flag = "-a" if arguments.get("all", True) else ""
        filter_flag = f"--filter {arguments.get('filter')}" if arguments.get("filter") else ""
        cmd = f"docker ps {all_flag} {filter_flag} --format 'table {{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}'"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "docker_get_container_logs":
        container = arguments.get("container_id")
        tail = arguments.get("tail", 100)
        follow_flag = "--follow" if arguments.get("follow") else ""
        cmd = f"docker logs {follow_flag} --tail {tail} {container}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout or result.stderr)]

    elif name == "docker_inspect_container":
        container = arguments.get("container_id")
        cmd = f"docker inspect {container}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "docker_check_network":
        network = arguments.get("network_name", "")
        if network:
            cmd = f"docker network inspect {network}"
        else:
            cmd = "docker network ls"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

if __name__ == "__main__":
    app.run()
```

## 补充内容（2024年新增）

### Docker Buildx 和多平台构建

**使用 Buildx 构建多平台镜像**：
```bash
# 创建 Buildx 构建器
docker buildx create --name multiplatform --use
docker buildx inspect --bootstrap

# 多平台构建并推送
 docker buildx build \
  --platform linux/amd64,linux/arm64,linux/arm/v7 \
  --tag myapp:latest \
  --push .

# 构建并导出到本地（单平台）
docker buildx build --load --tag myapp:latest .

# 查看构建器状态
docker buildx ls
```

**Dockerfile 优化最佳实践**：
```dockerfile
# 使用 BuildKit 特性
# syntax=docker/dockerfile:1.4

FROM golang:1.21-alpine AS builder
WORKDIR /app

# 缓存依赖层
COPY go.mod go.sum ./
RUN go mod download

# 构建应用
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# 使用 distroless 作为最终镜像
FROM gcr.io/distroless/static:nonroot
WORKDIR /app

# 从 builder 复制二进制文件
COPY --from=builder /app/main .

# 使用非 root 用户
USER nonroot:nonroot

EXPOSE 8080
ENTRYPOINT ["./main"]
```

### Docker Compose 高级用法

**使用 Profiles 管理环境**：
```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: .
    ports:
      - "80:80"

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: example

  # 只在开发环境启动
  adminer:
    image: adminer
    ports:
      - "8080:8080"
    profiles:
      - dev

  # 只在测试环境启动
  selenium:
    image: selenium/standalone-chrome
    profiles:
      - test
```

```bash
# 启动基础服务
docker-compose up -d

# 启动开发环境（包含 adminer）
docker-compose --profile dev up -d

# 启动测试环境
docker-compose --profile test up -d
```

**使用 Watch 自动重建（Docker Compose 2.22+）**：
```yaml
services:
  web:
    build: .
    develop:
      watch:
        - action: sync
          path: ./src
          target: /app/src
        - action: rebuild
          path: ./package.json
```

```bash
# 启动 watch 模式
docker-compose watch
```

**使用 Health Check**：
```yaml
services:
  web:
    image: myapp:latest
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 容器安全加固

**使用 User Namespaces**：
```bash
# /etc/docker/daemon.json
{
  "userns-remap": "default"
}

# 重启 Docker
systemctl restart docker

# 查看映射用户
cat /etc/subuid
cat /etc/subgid
```

**PowerShell (Windows)**:
```powershell
# Windows Docker Desktop 不支持 User Namespaces
# 但可以在 WSL2 中配置

# 查看当前 Docker 配置
docker info | Select-String "userns"

# Windows 容器使用不同的隔离技术
# 查看容器隔离模式
docker info | Select-String "Isolation"

# Windows 容器支持两种隔离模式:
# 1. process - 共享内核 (类似 Linux 容器)
# 2. hyperv - 完全隔离 (每个容器有轻量级 VM)
docker run --isolation=hyperv -d mcr.microsoft.com/windows/servercore:ltsc2022

# 检查 Windows 容器安全设置
docker info | Select-String -Pattern "Security", "Isolation"
```

**使用 Seccomp 配置文件**：
```bash
# 使用默认 seccomp 配置文件
docker run --security-opt seccomp=default.json nginx

# 禁用 seccomp（不推荐）
docker run --security-opt seccomp=unconfined nginx

# 使用自定义 seccomp 配置
docker run --security-opt seccomp=custom-profile.json nginx
```

**使用 AppArmor**：
```bash
# 查看 AppArmor 状态
aa-status

# 使用 Docker 默认 AppArmor 配置
docker run --security-opt apparmor=docker-default nginx

# 使用自定义 AppArmor 配置
docker run --security-opt apparmor=my-custom-profile nginx
```

**镜像安全扫描**：
```bash
# 使用 Docker Scout
docker scout quickview myimage:latest
docker scout cves myimage:latest
docker scout recommendations myimage:latest

# 使用 Trivy
trivy image myimage:latest
trivy image --severity HIGH,CRITICAL myimage:latest

# 使用 Snyk
docker scan myimage:latest
```

### Docker 网络深度配置

**创建自定义网络**：
```bash
# 创建桥接网络
docker network create --driver bridge my-bridge-network

# 创建覆盖网络（Swarm 模式）
docker network create --driver overlay my-overlay-network

# 创建 Macvlan 网络
docker network create -d macvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 my-macvlan-network

# 创建 IPvlan 网络
docker network create -d ipvlan \
  --subnet=192.168.1.0/24 \
  --gateway=192.168.1.1 \
  -o parent=eth0 my-ipvlan-network
```

**容器网络故障排查**：
```bash
# 查看容器网络命名空间
ls -la /var/run/docker/netns/

# 使用 nsenter 进入网络命名空间
nsenter --net=/var/run/docker/netns/<namespace-id> ip addr

# 查看容器 iptables 规则
iptables -t nat -L DOCKER -n --line-numbers
iptables -t filter -L DOCKER -n --line-numbers

# 查看容器路由表
nsenter --net=/var/run/docker/netns/<namespace-id> ip route

# 查看容器连接跟踪
nsenter --net=/var/run/docker/netns/<namespace-id> conntrack -L
```

### Docker Swarm 高级运维

**服务滚动更新策略**：
```bash
# 创建带有更新策略的服务
docker service create \
  --name web \
  --replicas 5 \
  --update-delay 10s \
  --update-parallelism 2 \
  --update-failure-action rollback \
  --rollback-delay 10s \
  --rollback-parallelism 2 \
  nginx:1.19

# 更新服务镜像
docker service update --image nginx:1.20 web

# 查看更新状态
docker service inspect --pretty web

# 回滚服务
docker service rollback web
```

**使用 Placement Constraints**：
```bash
# 在特定节点上运行服务
docker service create \
  --name db \
  --constraint 'node.labels.storage == ssd' \
  --constraint 'node.role == worker' \
  postgres:15

# 使用节点亲和性
docker service create \
  --name cache \
  --placement-pref 'spread=node.labels.rack' \
  redis:latest
```

**使用 Secrets 和 Configs**：
```bash
# 创建 Secret
echo "my_password" | docker secret create db_password -

# 创建 Config
docker config create nginx_config nginx.conf

# 在服务中使用 Secret 和 Config
docker service create \
  --name web \
  --secret db_password \
  --config src=nginx_config,target=/etc/nginx/nginx.conf \
  nginx:latest
```

### 容器监控和日志收集

**使用 Docker Stats 收集指标**：
```bash
# 实时查看容器资源使用
docker stats

# 格式化输出
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.PIDs}}"

# 导出到文件
docker stats --no-stream --format "{{.Name}},{{.CPUPerc}},{{.MemUsage}}" > stats.csv
```

**使用 cAdvisor 监控**：
```bash
# 运行 cAdvisor
docker run -d \
  --name=cadvisor \
  --volume=/:/rootfs:ro \
  --volume=/var/run:/var/run:ro \
  --volume=/sys:/sys:ro \
  --volume=/var/lib/docker/:/var/lib/docker:ro \
  --volume=/dev/disk/:/dev/disk:ro \
  --publish=8080:8080 \
  --detach=true \
  gcr.io/cadvisor/cadvisor:latest

# 访问 http://localhost:8080 查看监控
```

**使用 Fluentd 收集日志**：
```yaml
# docker-compose.yml
services:
  app:
    image: myapp:latest
    logging:
      driver: fluentd
      options:
        fluentd-address: localhost:24224
        tag: docker.app

  fluentd:
    image: fluent/fluentd:latest
    volumes:
      - ./fluentd.conf:/fluentd/etc/fluent.conf
    ports:
      - "24224:24224"
```

### Docker 性能优化

**优化容器启动速度**：
```bash
# 使用更小的基础镜像
#  alpine  vs  debian  vs  ubuntu
#   5MB       100MB       80MB

# 减少镜像层数
# 差：多个 RUN 指令
RUN apt-get update
RUN apt-get install -y curl
RUN apt-get install -y vim

# 好：合并 RUN 指令
RUN apt-get update && apt-get install -y curl vim && rm -rf /var/lib/apt/lists/*

# 使用 .dockerignore
# .dockerignore
node_modules
.git
*.log
.env
```

**优化容器运行时性能**：
```bash
# 限制容器资源
docker run -m 512m --cpus=1.5 --memory-swap=512m nginx

# 使用 CPU 亲和性
docker run --cpuset-cpus="0,1" nginx

# 使用内存大页
docker run --shm-size=2g --memory-swappiness=0 postgres

# 使用性能调优的存储驱动
# /etc/docker/daemon.json
{
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
```

### Docker 故障排查工具

**使用 docker-debug**：
```bash
# 安装 docker-debug
# https://github.com/zeromake/docker-debug

# 使用 debug 容器进入目标容器命名空间
docker-debug exec -it <container-id> bash
```

**使用 crictl（containerd 运行时）**：
```bash
# 查看容器列表
crictl ps -a

# 查看容器日志
crictl logs <container-id>

# 进入容器
crictl exec -it <container-id> /bin/sh

# 查看容器信息
crictl inspect <container-id>
```

## 输出规范

```
🐳 Docker 诊断报告

📊 基本信息
- 版本：[Server Version]
- 存储驱动：[Storage Driver]
- 容器数量：[Containers]
- 镜像数量：[Images]

🔍 问题分析
[具体问题描述]

💡 解决方案
[处理步骤]

📋 优化建议
- [建议1]
- [建议2]
```
