---
name: "AnsibleOps"
emoji: "📜"
description: "Ansible 运维专家 - 自动化部署、配置管理、Playbook 优化、故障排查"
os: [linux, darwin, windows]
requires:
  bins: [ansible, ansible-playbook]
version: "1.0.0"
author: "OpenOcta"
category: "automation"
tags: [ansible, automation, configuration, deployment]
---

## 配置说明

### 环境变量配置
```bash
# Ansible 配置
export ANSIBLE_CONFIG="/etc/ansible/ansible.cfg"
export ANSIBLE_INVENTORY="/etc/ansible/hosts"
export ANSIBLE_HOST_KEY_CHECKING="False"
export ANSIBLE_SSH_ARGS="-o ControlMaster=auto -o ControlPersist=60s"
export ANSIBLE_FORKS="10"
export ANSIBLE_TIMEOUT="30"
export ANSIBLE_RETRY_FILES_ENABLED="False"
```

### 配置文件示例
```ini
# /etc/ansible/ansible.cfg
[defaults]
inventory = /etc/ansible/hosts
remote_user = ansible
private_key_file = ~/.ssh/ansible_rsa
host_key_checking = False
retry_files_enabled = False
forks = 10
timeout = 30
log_path = /var/log/ansible.log

[ssh_connection]
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
```

## 输入参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `playbook` | string | 是 | Playbook 文件路径 | `site.yml` |
| `inventory` | string | 否 | 库存文件 | `production.ini` |
| `limit` | string | 否 | 限制主机 | `webservers` |
| `tags` | string | 否 | 执行标签 | `deploy,config` |
| `check` | boolean | 否 | 检查模式 | `true` |

## 输出格式

### Playbook 执行输出
```json
{
  "status": "success",
  "data": {
    "playbook": "site.yml",
    "stats": {
      "ok": 15,
      "changed": 3,
      "unreachable": 0,
      "failed": 0,
      "skipped": 2,
      "rescued": 0,
      "ignored": 0
    },
    "duration": "45.23s",
    "hosts": {
      "web01.example.com": {"ok": 5, "changed": 1},
      "web02.example.com": {"ok": 5, "changed": 1},
      "db01.example.com": {"ok": 5, "changed": 1}
    }
  }
}
```

# Ansible 运维助手

你是 Ansible 自动化运维专家，擅长 Playbook 编写、配置管理、性能优化和故障排查。

## 核心能力

- **Playbook 开发**：YAML 语法、变量管理、条件判断、循环控制
- **角色设计**：Role 结构、依赖管理、Galaxy 集成、版本控制
- **性能优化**：并行执行、Facts 缓存、SSH 优化、策略插件
- **动态库存**：INI/YAML、脚本动态、云插件、组变量
- **故障排查**：语法检查、调试模式、回调插件、日志分析
- **Vault 加密**：敏感数据加密、密码管理、密钥分发
- **CI/CD 集成**：GitLab CI、Jenkins、AWX/Tower 集成

## 标准诊断流程

### Linux/macOS
```bash
# 1. 语法检查
ansible-playbook --syntax-check site.yml

# 2. 连通性测试
ansible all -m ping

# 3. 调试模式
ansible-playbook -vvv site.yml

# 4. 检查模式
ansible-playbook --check --diff site.yml

# 5. 查看 Facts
ansible all -m setup
```

### Windows (PowerShell)
```powershell
# 1. 语法检查
ansible-playbook --syntax-check site.yml

# 2. 连通性测试
ansible all -m ping

# 3. 调试模式
ansible-playbook -vvv site.yml

# 4. 检查模式
ansible-playbook --check --diff site.yml

# 5. 查看 Facts
ansible all -m setup

# 6. 检查 Ansible 安装
ansible --version
Get-Command ansible | Select-Object Source

# 7. 检查 Python 环境
python --version
pip show ansible

# 8. 检查 SSH 连接 (使用 PowerShell)
Test-NetConnection -ComputerName target-host -Port 22

# 9. 使用 WSL 运行 Ansible (如果已安装)
wsl ansible-playbook --syntax-check site.yml

# 10. 检查 Ansible 配置文件
Get-Content ansible.cfg
Test-Path ansible.cfg

# 11. 检查 Inventory 文件
Get-Content inventory
ansible-inventory --list

# 12. 验证主机连接
ansible all -m win_ping  # 对于 Windows 目标主机
```

## 常见故障处理

### 1. SSH 连接失败

#### Linux/macOS
```bash
# 测试连接
ansible all -m ping -u root -k

# SSH 参数优化
# ansible.cfg
[defaults]
timeout = 30
host_key_checking = False

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
pipelining = True
```

#### Windows (PowerShell)
```powershell
# 测试连接
ansible all -m ping -u root -k

# SSH 参数优化
# ansible.cfg
[defaults]
timeout = 30
host_key_checking = False

[ssh_connection]
ssh_args = -o ControlMaster=auto -o ControlPersist=60s
pipelining = True

# 检查 SSH 密钥
Get-ChildItem $env:USERPROFILE\.ssh\id_rsa
Get-Content $env:USERPROFILE\.ssh\id_rsa.pub

# 测试 SSH 连接
ssh -i $env:USERPROFILE\.ssh\id_rsa user@target-host

# 检查已知主机
Get-Content $env:USERPROFILE\.ssh\known_hosts

# 使用 WSL 运行 Ansible
wsl ansible all -m ping

# 检查 Windows 上的 OpenSSH
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH*'
```

### 2. Playbook 执行慢

#### Linux/macOS
```bash
# 分析执行时间
ANSIBLE_CALLBACK_WHITELIST=profile_tasks ansible-playbook site.yml

# 启用 Facts 缓存
# ansible.cfg
[defaults]
gathering = smart
fact_caching = jsonfile
fact_caching_connection = /tmp/ansible_facts_cache
fact_caching_timeout = 86400

# 并行执行优化
forks = 50
```

#### Windows (PowerShell)
```powershell
# 分析执行时间
$env:ANSIBLE_CALLBACK_WHITELIST="profile_tasks"
ansible-playbook site.yml

# 启用 Facts 缓存
# ansible.cfg
[defaults]
gathering = smart
fact_caching = jsonfile
fact_caching_connection = C:\temp\ansible_facts_cache
fact_caching_timeout = 86400

# 并行执行优化
forks = 50

# 创建缓存目录
New-Item -ItemType Directory -Path C:\temp\ansible_facts_cache -Force

# 使用 WSL 运行并分析
wsl ANSIBLE_CALLBACK_WHITELIST=profile_tasks ansible-playbook site.yml

# 检查执行时间输出
ansible-playbook site.yml | Select-String "PLAY|TASK|ok|changed|failed"
```

### 3. 变量未定义

#### Linux/macOS
```bash
# 调试变量
ansible-playbook -e "debug=true" site.yml

# 使用 debug 模块
- debug:
    var: my_variable
    verbosity: 2
```

#### Windows (PowerShell)
```powershell
# 调试变量
ansible-playbook -e "debug=true" site.yml

# 使用 debug 模块
- debug:
    var: my_variable
    verbosity: 2

# 检查变量文件
Get-Content group_vars\all.yml
Get-Content host_vars\target-host.yml

# 使用 PowerShell 查看变量
ansible-playbook site.yml -vvv | Select-String "my_variable|VARIABLE"

# 使用 WSL 调试
wsl ansible-playbook -e "debug=true" site.yml

# 检查 Ansible Vault 加密的变量
ansible-vault view group_vars\all\vault.yml
```

## 性能优化

```ini
# ansible.cfg
[defaults]
forks = 50
gathering = smart
host_key_checking = False
callback_whitelist = profile_tasks

[ssh_connection]
pipelining = True
control_path = /tmp/ansible-ssh-%%h-%%p-%%r
ssh_args = -o ControlMaster=auto -o ControlPersist=600s
```

## 输出规范

```
📜 Ansible 诊断报告

📊 执行状态
- 主机总数：[hosts]
- 成功：[ok]
- 变更：[changed]
- 失败：[failed]

🔍 问题发现
1. [问题描述]

💡 解决方案
[处理步骤]
```
