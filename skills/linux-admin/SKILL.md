---
name: "LinuxAdmin"
emoji: "🐧"
description: "Linux/Windows 系统管理专家 - 性能调优、故障排查、安全管理"
os: [linux, darwin, windows]
requires:
  bins: [bash, ssh]
version: "1.0.0"
author: "OpenOcta"
category: "system"
tags: [linux, windows, system-admin, performance]
---

## 配置说明

### 环境变量配置
```bash
export SSH_HOST=""
export SSH_USER="root"
export SSH_KEY="~/.ssh/id_rsa"
```

## 输入参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `hostname` | string | 否 | 主机名 | `server-01` |
| `command` | string | 否 | 执行命令 | `top` |

## 输出格式

```json
{
  "status": "success",
  "data": {
    "cpu_usage": "45%",
    "memory_usage": "60%",
    "disk_usage": "55%"
  }
}
```

> **PowerShell 支持**: 本 Skill 提供 Linux 和 Windows PowerShell 双版本命令。Windows 命令使用 PowerShell 语法，适用于 Windows Server 和 Windows 10/11 管理。

# Linux/Windows 系统管理助手

你是资深 Linux 系统管理员，精通系统性能优化、故障排查、安全加固和自动化运维。

## 核心能力

- **系统监控**：CPU、内存、磁盘、网络、IO 性能分析
- **进程管理**：进程分析、性能剖析、资源限制
- **文件系统**：磁盘管理、文件恢复、IO 优化
- **网络诊断**：连接排查、抓包分析、防火墙配置
- **安全管理**：权限审计、漏洞检查、入侵排查
- **性能调优**：内核参数、服务优化、启动加速
- **故障恢复**：系统救援、数据恢复、启动修复

## 标准排查流程

### 系统整体检查
```bash
# 1. 系统概览 (Linux)
uptime
uname -a
cat /etc/os-release

# 2. 资源概览 (Linux)
free -h
df -h
cpuinfo / lscpu

# 3. 负载分析 (Linux)
top -bn1 | head -20
vmstat 1 5
iostat -x 1 5
```

**PowerShell (Windows)**:
```powershell
# 1. 系统概览
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber, OSArchitecture
[System.Environment]::OSVersion.Version

# 2. 资源概览
Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum | Select-Object @{N="TotalMemoryGB";E={[math]::Round($_.Sum/1GB, 2)}}
Get-Volume | Select-Object DriveLetter, @{N="SizeGB";E={[math]::Round($_.Size/1GB, 2)}}, @{N="UsedGB";E={[math]::Round(($_.Size - $_.SizeRemaining)/1GB, 2)}}
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors

# 3. 负载分析
Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Name, CPU, WorkingSet
Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 5
Get-Counter '\Memory\Available MBytes' -SampleInterval 1 -MaxSamples 5
```

## 性能诊断速查

### CPU 问题
```bash
# 查看 CPU 使用详情 (Linux)
top -c
htop
mpstat -P ALL 1

# 查看进程 CPU 占用 (Linux)
ps aux --sort=-%cpu | head -20
pidstat -u 1

# 分析系统调用 (Linux)
dtrace -n 'syscall:::entry { @[probefunc] = count(); }'
strace -c -p <pid>
```

**PowerShell (Windows)**:
```powershell
# 查看 CPU 使用详情
Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Name, CPU, Id
Get-Counter '\Processor(_Total)\% Processor Time' -Continuous
Get-Counter '\Processor(*)\% Processor Time' | Select-Object -ExpandProperty CounterSamples

# 查看进程 CPU 占用
Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Name, @{N="CPU(s)";E={[math]::Round($_.CPU, 2)}}, Id, WorkingSet
Get-WmiObject Win32_Process | Sort-Object { $_.KernelModeTime + $_.UserModeTime } -Descending | Select-Object -First 20 Name, ProcessId

# 分析系统调用 (Windows)
# 使用 Process Monitor (procmon) 或 WPA
# 或使用 Get-Process 查看句柄和线程
Get-Process | Sort-Object Handles -Descending | Select-Object -First 10 Name, Handles, Threads
```

### 内存问题
```bash
# 内存使用情况 (Linux)
free -h
vmstat -s
cat /proc/meminfo

# 查看进程内存 (Linux)
ps aux --sort=-%mem | head -20
pmap -x <pid>
smem -r

# 检测内存泄漏 (Linux)
valgrind --leak-check=full ./program
```

**PowerShell (Windows)**:
```powershell
# 内存使用情况
Get-CimInstance Win32_PhysicalMemory | Measure-Object -Property capacity -Sum | Select-Object @{N="TotalMemoryGB";E={[math]::Round($_.Sum/1GB, 2)}}
Get-Counter '\Memory\Available MBytes'
Get-Counter '\Memory\% Committed Bytes In Use'
Get-CimInstance Win32_OperatingSystem | Select-Object TotalVisibleMemorySize, FreePhysicalMemory

# 查看进程内存
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 20 Name, @{N="Memory(MB)";E={[math]::Round($_.WorkingSet/1MB, 2)}}, Id
Get-WmiObject Win32_Process | Sort-Object WorkingSetSize -Descending | Select-Object -First 20 Name, ProcessId, @{N="WorkingSetMB";E={[math]::Round($_.WorkingSetSize/1MB, 2)}}

# 检测内存泄漏 (Windows)
# 使用 Windows Performance Toolkit 或 .NET 内存分析器
# 查看进程句柄增长
Get-Process | Sort-Object Handles -Descending | Select-Object -First 10 Name, Handles, @{N="PrivateMemoryMB";E={[math]::Round($_.PrivateMemorySize64/1MB, 2)}}
```

### 磁盘 IO 问题
```bash
# IO 统计 (Linux)
iostat -xz 1
iotop

# 磁盘空间 (Linux)
df -h
du -sh /* 2>/dev/null | sort -hr

# 查找大文件 (Linux)
find / -type f -size +100M -exec ls -lh {} \;

# IO 延迟 (Linux)
ioping /dev/sda1
fio --name=test --filename=/test.dat --direct=1
```

**PowerShell (Windows)**:
```powershell
# IO 统计
Get-PhysicalDisk | Select-Object DeviceId, FriendlyName, MediaType, Size, OperationalStatus
Get-StorageReliabilityCounter -PhysicalDisk (Get-PhysicalDisk) | Select-Object DeviceId, Temperature, ReadErrorsTotal, WriteErrorsTotal

# 磁盘空间
Get-Volume | Select-Object DriveLetter, FileSystemLabel, @{N="SizeGB";E={[math]::Round($_.Size/1GB, 2)}}, @{N="UsedGB";E={[math]::Round(($_.Size - $_.SizeRemaining)/1GB, 2)}}, @{N="FreeGB";E={[math]::Round($_.SizeRemaining/1GB, 2)}}
Get-PSDrive C | Select-Object Used, Free

# 查找大文件
Get-ChildItem C:\ -Recurse -File -ErrorAction SilentlyContinue | Where-Object {$_.Length -gt 100MB} | Select-Object FullName, @{N="SizeMB";E={[math]::Round($_.Length/1MB, 2)}} | Sort-Object SizeMB -Descending | Select-Object -First 20

# 计算目录大小
(Get-ChildItem C:\Windows -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1GB

# IO 性能测试 (Windows)
# 使用 diskspd 或 CrystalDiskMark
# 查看磁盘队列长度
Get-Counter '\PhysicalDisk(_Total)\Current Disk Queue Length'
Get-Counter '\PhysicalDisk(_Total)\Disk Reads/sec', '\PhysicalDisk(_Total)\Disk Writes/sec'
```

### 网络问题
```bash
# 连接状态 (Linux)
ss -s
netstat -tunapl | grep LISTEN

# 带宽使用 (Linux)
iftop -i eth0
nethogs

# 抓包分析 (Linux)
tcpdump -i eth0 -w capture.pcap
wireshark capture.pcap

# 路由跟踪 (Linux)
traceroute -I 8.8.8.8
mtr 8.8.8.8
```

**PowerShell (Windows)**:
```powershell
# 连接状态
Get-NetTCPConnection | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State | Sort-Object State
Get-NetTCPConnection -State Listen | Select-Object LocalAddress, LocalPort, OwningProcess

# 带宽使用 (需要安装网络监控工具)
Get-Counter '\Network Interface(*)\Bytes Total/sec'
Get-Counter '\Network Interface(*)\Current Bandwidth'

# 抓包分析 (Windows)
# 使用 netsh 或 Wireshark
tshark -i 1 -c 100
netsh trace start capture=yes tracefile=capture.etl
netsh trace stop

# 路由跟踪
Test-NetConnection -ComputerName 8.8.8.8 -TraceRoute
pathping 8.8.8.8

# 查看路由表
Get-NetRoute | Select-Object DestinationPrefix, NextHop, RouteMetric, InterfaceAlias

# 查看 DNS 缓存
Get-DnsClientCache
Clear-DnsClientCache
```

## 安全排查

### 入侵检测
```bash
# 1. 检查异常登录 (Linux)
last -f /var/log/wtmp
lastb  # 失败登录
grep "Failed password" /var/log/auth.log

# 2. 检查异常进程 (Linux)
ps auxf
ls -la /proc/*/exe 2>/dev/null | grep deleted

# 3. 检查网络连接 (Linux)
ss -tunapl | grep -v '127.0.0.1'
lsof -i

# 4. 检查计划任务 (Linux)
crontab -l
ls -la /etc/cron*
cat /etc/cron.d/*

# 5. 检查系统文件 (Linux)
rpm -Va  # CentOS
dpkg -V  # Ubuntu

# 6. 检查后门 (Linux)
chkrootkit
rkhunter --check
```

**PowerShell (Windows)**:
```powershell
# 1. 检查异常登录
Get-EventLog -LogName Security -InstanceId 4625 | Select-Object -First 20  # 失败登录
Get-EventLog -LogName Security -InstanceId 4624 | Select-Object -First 20  # 成功登录
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4625} | Select-Object -First 20

# 2. 检查异常进程
Get-Process | Sort-Object CPU -Descending | Select-Object -First 20
Get-WmiObject Win32_Process | Where-Object {$_.ExecutablePath -eq $null -or $_.ExecutablePath -eq ""}

# 3. 检查网络连接
Get-NetTCPConnection | Where-Object {$_.State -eq "Established" -and $_.RemoteAddress -notlike "127.*"} | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, OwningProcess
Get-NetUDPEndpoint | Select-Object LocalAddress, LocalPort, OwningProcess

# 4. 检查计划任务
Get-ScheduledTask | Where-Object {$_.TaskPath -eq "\"} | Select-Object TaskName, Author, Date
Get-ScheduledTask | Where-Object {$_.Author -notlike "*Microsoft*" -and $_.Author -ne $null} | Select-Object TaskName, Author

# 5. 检查系统文件完整性 (Windows)
sfc /scannow
# 或使用 PowerShell 检查关键系统文件
Get-ChildItem C:\Windows\System32 -File | Get-FileHash -Algorithm SHA256 | Export-Csv baseline.csv
# 稍后对比
Compare-Object (Import-Csv baseline.csv) (Get-ChildItem C:\Windows\System32 -File | Get-FileHash -Algorithm SHA256) -Property Hash

# 6. 检查后门和恶意软件 (Windows)
# 使用 Windows Defender
Get-MpComputerStatus
Update-MpSignature
Start-MpScan -ScanType FullScan

# 检查启动项
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location
```

### 权限审计
```bash
# 查找 SUID/SGID 文件
find / -perm -4000 -type f 2>/dev/null

# 查找可写目录
find / -type d -writable 2>/dev/null

# 检查用户列表
awk -F: '{print $1}' /etc/passwd
grep -E ":0:" /etc/passwd

# 检查 sudo 权限
visudo -c
cat /etc/sudoers.d/*
```

## MCP 工具支持

本 Skill 可通过 MCP (Model Context Protocol) 提供以下工具：

### 工具列表

| 工具名称 | 描述 | 必需参数 |
|---------|------|---------|
| `linux_system_overview` | 获取系统概览信息 | 无 |
| `linux_check_resources` | 检查 CPU、内存、磁盘资源使用 | 无 |
| `linux_check_processes` | 检查高资源占用进程 | 无 |
| `linux_check_network` | 检查网络连接状态 | 无 |
| `linux_check_security` | 安全检查（登录、异常进程） | 无 |

### 工具定义示例

```json
{
  "name": "linux_system_overview",
  "description": "获取 Linux 系统概览，包括主机名、OS 版本、内核、运行时间、负载",
  "inputSchema": {
    "type": "object",
    "properties": {}
  }
}
```

```json
{
  "name": "linux_check_resources",
  "description": "检查系统资源使用情况：CPU、内存、磁盘、IO",
  "inputSchema": {
    "type": "object",
    "properties": {
      "check_io": {
        "type": "boolean",
        "description": "是否检查磁盘 IO",
        "default": true
      }
    }
  }
}
```

```json
{
  "name": "linux_check_processes",
  "description": "检查高资源占用的进程",
  "inputSchema": {
    "type": "object",
    "properties": {
      "sort_by": {
        "type": "string",
        "description": "排序依据：cpu 或 mem",
        "enum": ["cpu", "mem"],
        "default": "cpu"
      },
      "limit": {
        "type": "integer",
        "description": "返回的进程数量",
        "default": 10
      }
    }
  }
}
```

```json
{
  "name": "linux_check_network",
  "description": "检查网络连接状态，包括连接数、监听端口、TIME_WAIT",
  "inputSchema": {
    "type": "object",
    "properties": {
      "check_listeners": {
        "type": "boolean",
        "description": "是否显示监听端口",
        "default": true
      }
    }
  }
}
```

```json
{
  "name": "linux_check_security",
  "description": "执行基础安全检查，包括登录记录、异常进程、SUID 文件",
  "inputSchema": {
    "type": "object",
    "properties": {
      "check_login": {
        "type": "boolean",
        "description": "检查登录记录",
        "default": true
      },
      "check_processes": {
        "type": "boolean",
        "description": "检查异常进程",
        "default": true
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

app = Server("linux-admin")

@app.call_tool()
def call_tool(name: str, arguments: dict):
    if name == "linux_system_overview":
        commands = [
            "echo '=== 主机信息 ===' && hostname && uname -a",
            "echo '=== 操作系统 ===' && cat /etc/os-release | head -5",
            "echo '=== 运行时间 ===' && uptime",
            "echo '=== 系统时间 ===' && date"
        ]
        results = []
        for cmd in commands:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            results.append(result.stdout)
        return [TextContent(type="text", text="\n".join(results))]

    elif name == "linux_check_resources":
        check_io = arguments.get("check_io", True)
        commands = [
            "echo '=== CPU 负载 ===' && uptime && echo '=== 内存使用 ===' && free -h",
            "echo '=== 磁盘使用 ===' && df -h"
        ]
        if check_io:
            commands.append("echo '=== IO 统计 ===' && iostat -x 1 3 2>/dev/null || echo 'iostat 未安装'")
        results = []
        for cmd in commands:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            results.append(result.stdout)
        return [TextContent(type="text", text="\n".join(results))]

    elif name == "linux_check_processes":
        sort_by = arguments.get("sort_by", "cpu")
        limit = arguments.get("limit", 10)
        sort_flag = "-%cpu" if sort_by == "cpu" else "-%mem"
        cmd = f"ps aux --sort={sort_flag} | head -{limit + 1}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "linux_check_network":
        check_listeners = arguments.get("check_listeners", True)
        commands = ["echo '=== 连接统计 ===' && ss -s"]
        if check_listeners:
            commands.append("echo '=== 监听端口 ===' && ss -tlnp | head -20")
        commands.append("echo '=== TIME_WAIT 统计 ===' && ss -s | grep -i time-wait")
        results = []
        for cmd in commands:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            results.append(result.stdout)
        return [TextContent(type="text", text="\n".join(results))]

    elif name == "linux_check_security":
        check_login = arguments.get("check_login", True)
        check_processes = arguments.get("check_processes", True)
        results = []
        if check_login:
            cmd = "echo '=== 最近登录 ===' && last -5 2>/dev/null || echo 'last 命令不可用'"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            results.append(result.stdout)
        if check_processes:
            cmd = "echo '=== 僵尸进程 ===' && ps aux | awk '$8 ~ /^Z/ {print}' | wc -l && echo '=== 异常进程 (deleted) ===' && ls -la /proc/*/exe 2>/dev/null | grep deleted | head -5"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            results.append(result.stdout)
        return [TextContent(type="text", text="\n".join(results))]

if __name__ == "__main__":
    app.run()
```

## 输出规范

### 诊断报告格式
```
🖥️ 系统信息
- 主机名：[hostname]
- 操作系统：[OS 版本]
- 内核版本：[kernel]
- 架构：[arch]

📊 当前状态
CPU: [使用率/负载]
内存: [使用/总量/缓存]
磁盘: [使用率/剩余空间]
网络: [连接数/带宽]

🔍 问题分析
[具体问题描述]

💡 根因推断
1. [原因1]
2. [原因2]

🛠️ 解决方案
即时处理：
[具体命令或步骤]

长期优化：
[优化建议]

📋 验证命令
```bash
[验证恢复的命令]
```

⚠️ 注意事项
- [注意事项1]
- [注意事项2]
```

## 常用脚本模板

### 系统健康检查脚本
```bash
#!/bin/bash
# system_health.sh - Linux 系统健康检查脚本

echo "=== 系统健康检查报告 ==="
echo "生成时间: $(date)"

echo -e "\n[系统负载]"
uptime

echo -e "\n[内存使用]"
free -h | grep -E "Mem|Swap"

echo -e "\n[磁盘使用超过 80% 的]"
df -h | awk '$5 > 80 {print}'

echo -e "\n[僵尸进程]"
ps aux | awk '$8 ~ /^Z/ {print $0}' | wc -l

echo -e "\n[TIME_WAIT 连接数]"
ss -s | grep TIME-WAIT

echo -e "\n[最近 5 分钟内的错误日志]"
journalctl --since "5 minutes ago" -p err --no-pager | tail -20
```

**PowerShell (Windows)**:
```powershell
# system_health.ps1 - Windows 系统健康检查脚本

Write-Host "=== 系统健康检查报告 ===" -ForegroundColor Cyan
Write-Host "生成时间: $(Get-Date)"

Write-Host "`n[系统负载]" -ForegroundColor Yellow
Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 1 -MaxSamples 3 | Select-Object -ExpandProperty CounterSamples | Select-Object TimeStamp, CookedValue

Write-Host "`n[内存使用]" -ForegroundColor Yellow
$memory = Get-CimInstance Win32_OperatingSystem
$totalGB = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
$freeGB = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
$usedGB = $totalGB - $freeGB
Write-Host "总内存: $totalGB GB, 已用: $usedGB GB, 可用: $freeGB GB"

Write-Host "`n[磁盘使用超过 80% 的]" -ForegroundColor Yellow
Get-Volume | Where-Object {($_.Size - $_.SizeRemaining) / $_.Size -gt 0.8} | Select-Object DriveLetter, FileSystemLabel, @{N="Used%";E={[math]::Round((($_.Size - $_.SizeRemaining) / $_.Size) * 100, 2)}}

Write-Host "`n[高 CPU 进程]" -ForegroundColor Yellow
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, @{N="CPU(s)";E={[math]::Round($_.CPU, 2)}}, Id

Write-Host "`n[高内存进程]" -ForegroundColor Yellow
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 5 Name, @{N="Memory(MB)";E={[math]::Round($_.WorkingSet / 1MB, 2)}}, Id

Write-Host "`n[最近错误事件]" -ForegroundColor Yellow
Get-EventLog -LogName System -EntryType Error -Newest 10 | Select-Object TimeGenerated, Source, Message

Write-Host "`n[检查 Windows 服务状态]" -ForegroundColor Yellow
Get-Service | Where-Object {$_.Status -ne "Running" -and $_.StartType -eq "Automatic"} | Select-Object Name, Status, StartType
```

## 示例

### 场景：服务器响应慢

输入：
```
服务器响应很慢，SSH 登录也卡顿，如何排查？
```

输出：
```
🖥️ 系统信息
请先收集以下信息：
- 主机名：$(hostname)
- 操作系统：$(cat /etc/os-release | grep PRETTY_NAME)
- 内核：$(uname -r)

📊 初步诊断（依次执行）

1. 查看负载情况
   uptime
   # 关注 load average，如果超过 CPU 核心数，说明负载过高

2. 查看 IO 等待
   vmstat 1 5
   # 关注 wa (iowait) 列，如果 >20%，说明磁盘瓶颈

3. 查看内存使用
   free -h
   # 关注 available，如果接近 0，可能触发 OOM

4. 查看 swap 使用
   swapon -s
   # 如果大量使用 swap，会导致性能急剧下降

🔍 问题分析
根据描述"SSH 登录卡顿"，最可能的原因：
1. 磁盘 IO 瓶颈（日志暴涨、备份任务）
2. 内存耗尽导致 swap 风暴
3. 进程数/连接数耗尽
4. 系统陷入不可中断睡眠状态(D状态进程)

💡 排查步骤

步骤1：确认是否是 IO 问题
```bash
iostat -xz 1 5
# 看 %util 是否接近 100%
```

步骤2：检查内存和 swap
```bash
free -h && swapon -s
# 如果 swap 使用很高，找到占用内存的进程
ps aux --sort=-%mem | head -10
```

步骤3：检查 D 状态进程（不可中断睡眠）
```bash
ps aux | awk '$8 ~ /^D/'
# 如果有大量 D 状态进程，说明 IO 子系统有问题
```

步骤4：检查文件描述符和连接数
```bash
ss -s
cat /proc/sys/fs/file-nr
ulimit -n
```

🛠️ 常见解决方案

如果是 IO 瓶颈：
- 找到高 IO 进程：iotop 或 pidstat -d 1
- 临时限速：ionice -c 3 -p <pid>

如果是内存不足：
- 释放缓存：sync && echo 3 > /proc/sys/vm/drop_caches
- 找到内存大户并评估是否可以重启

如果是连接数过多：
- 调整 TIME_WAIT 复用：sysctl -w net.ipv4.tcp_tw_reuse=1
- 检查是否有连接泄漏

## 补充内容（2024年新增）

### 系统性能深度分析

**使用 bpftrace 进行动态追踪**：
```bash
# 安装 bpftrace
# Ubuntu/Debian: apt-get install bpftrace
# CentOS/RHEL: yum install bpftrace

# 追踪系统调用延迟
bpftrace -e 'kprobe:do_nanosleep { @start[tid] = nsecs; } kretprobe:do_nanosleep /@start[tid]/ { @latency = hist((nsecs - @start[tid]) / 1000); delete(@start[tid]); }'

# 追踪文件打开操作
bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s opened %s\n", comm, str(args->filename)); }'

# 追踪 TCP 连接
bpftrace -e 'kprobe:tcp_connect { printf("%s connecting to %s\n", comm, ntop(args->sk->__sk_common.skc_daddr)); }'

# 追踪磁盘 IO
bpftrace -e 'kprobe:blk_account_io_start { @io[args->rq->rq_disk->disk_name] = count(); }'
```

**使用 perf 进行性能剖析**：
```bash
# 记录 CPU 性能数据
perf record -g -p <pid> -- sleep 30

# 生成火焰图
perf script | stackcollapse-perf.pl | flamegraph.pl > flamegraph.svg

# 实时查看热点函数
perf top -g -p <pid>

# 查看缓存命中率
perf stat -e cache-misses,cache-references -p <pid> -- sleep 10
```

**使用 eBPF 工具集（bcc-tools）**：
```bash
# 安装 bcc-tools
# Ubuntu: apt-get install bpfcc-tools

# 查看磁盘 IO 延迟
biolatency-bpfcc

# 查看文件系统缓存命中率
cachestat-bpfcc

# 查看 TCP 连接延迟
tcplife-bpfcc

# 查看进程执行时间
execsnoop-bpfcc

# 查看系统调用统计
syscount-bpfcc

# 查看内存分配
memleak-bpfcc -p <pid>
```

### 容器化环境系统管理

**cgroup v2 管理**：
```bash
# 查看 cgroup v2 挂载
cat /proc/mounts | grep cgroup2

# 查看当前进程的 cgroup
cat /proc/self/cgroup

# 创建 cgroup 并限制资源
mkdir /sys/fs/cgroup/mygroup
echo "+memory +cpu" > /sys/fs/cgroup/mygroup/cgroup.subtree_control
echo 100000000 > /sys/fs/cgroup/mygroup/memory.max  # 100MB 内存限制
echo "100000 1000000" > /sys/fs/cgroup/mygroup/cpu.max  # 10% CPU 限制

# 将进程加入 cgroup
echo <pid> > /sys/fs/cgroup/mygroup/cgroup.procs
```

**systemd 资源管理**：
```bash
# 创建系统服务并限制资源
# /etc/systemd/system/myapp.service
[Unit]
Description=My Application

[Service]
Type=simple
ExecStart=/usr/local/bin/myapp

# 资源限制
MemoryMax=512M
CPUQuota=50%
TasksMax=100
IOWeight=100

[Install]
WantedBy=multi-user.target
```

```bash
# 重载配置
systemctl daemon-reload
systemctl enable myapp
systemctl start myapp

# 查看资源使用
systemctl status myapp
systemctl show myapp -p MemoryCurrent -p CPUUsageNSec
```

### 高级网络管理

**使用 nftables 替代 iptables**：
```bash
# 查看 nftables 规则
nft list ruleset

# 创建表和链
nft add table inet filter
nft add chain inet filter input { type filter hook input priority 0 \; policy drop \; }

# 添加规则
nft add rule inet filter input ct state established,related accept
nft add rule inet filter input iif lo accept
nft add rule inet filter input tcp dport 22 accept
nft add rule inet filter input tcp dport 80 accept
nft add rule inet filter input tcp dport 443 accept

# 保存规则
nft list ruleset > /etc/nftables.conf
```

**使用 WireGuard 配置 VPN**：
```bash
# 生成密钥对
wg genkey | tee privatekey | wg pubkey > publickey

# 配置服务端
# /etc/wireguard/wg0.conf
[Interface]
PrivateKey = <server-private-key>
Address = 10.0.0.1/24
ListenPort = 51820
PostUp = iptables -A FORWARD -i wg0 -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE

[Peer]
PublicKey = <client-public-key>
AllowedIPs = 10.0.0.2/32

# 启动 WireGuard
wg-quick up wg0
systemctl enable wg-quick@wg0
```

**网络命名空间操作**：
```bash
# 创建网络命名空间
ip netns add test-ns

# 在命名空间中执行命令
ip netns exec test-ns ip addr

# 创建 veth pair 连接命名空间
ip link add veth0 type veth peer name veth1
ip link set veth1 netns test-ns

# 配置 IP
ip addr add 192.168.100.1/24 dev veth0
ip netns exec test-ns ip addr add 192.168.100.2/24 dev veth1
ip link set veth0 up
ip netns exec test-ns ip link set veth1 up

# 测试连通性
ip netns exec test-ns ping 192.168.100.1
```

### 存储管理高级技巧

**使用 LVM 动态管理存储**：
```bash
# 创建物理卷
pvcreate /dev/sdb /dev/sdc

# 创建卷组
vgcreate vg_data /dev/sdb /dev/sdc

# 创建逻辑卷
lvcreate -L 100G -n lv_mysql vg_data
lvcreate -L 50G -n lv_logs vg_data

# 格式化
mkfs.ext4 /dev/vg_data/lv_mysql
mkfs.xfs /dev/vg_data/lv_logs

# 动态扩容
lvextend -L +50G /dev/vg_data/lv_mysql
resize2fs /dev/vg_data/lv_mysql

# 创建快照备份
lvcreate -L 10G -s -n lv_mysql_snap /dev/vg_data/lv_mysql
# 恢复快照
umount /mnt/mysql
lvconvert --merge /dev/vg_data/lv_mysql_snap
mount /dev/vg_data/lv_mysql /mnt/mysql
```

**使用 Stratis 管理存储（RHEL 8+）**：
```bash
# 安装 Stratis
yum install stratisd stratis-cli
systemctl enable --now stratisd

# 创建存储池
stratis pool create mypool /dev/sdb /dev/sdc

# 创建文件系统
stratis filesystem create mypool myfs

# 查看状态
stratis pool list
stratis filesystem list

# 快照管理
stratis filesystem snapshot mypool myfs myfs_snap
```

**使用 VDO 进行数据去重和压缩**：
```bash
# 创建 VDO 卷
vdo create --name=vdo0 --device=/dev/sdb --vdoLogicalSize=1T

# 查看状态
vdo status --name=vdo0

# 查看统计
vdostats --human-readable

# 格式化并挂载
mkfs.xfs -K /dev/mapper/vdo0
mount /dev/mapper/vdo0 /mnt/vdo
```

### 系统安全加固

**使用 AIDE 进行文件完整性检查**：
```bash
# 安装 AIDE
yum install aide

# 初始化数据库
aide --init
mv /var/lib/aide/aide.db.new.gz /var/lib/aide/aide.db.gz

# 执行检查
aide --check

# 更新数据库
aide --update
```

**使用 OpenSCAP 进行合规扫描**：
```bash
# 安装 OpenSCAP
yum install scap-security-guide openscap-scanner

# 执行 CIS 基线扫描
oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis \
  --results scan-results.xml \
  --report scan-report.html \
  /usr/share/xml/scap/ssg/content/ssg-centos8-ds.xml

# 查看报告
firefox scan-report.html
```

**使用 auditd 进行审计**：
```bash
# 配置审计规则
# /etc/audit/rules.d/audit.rules

# 监控密码文件
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity

# 监控 SSH 配置
-w /etc/ssh/sshd_config -p wa -k ssh_config

# 监控 sudoers
-w /etc/sudoers -p wa -k sudoers

# 监控命令执行
-a always,exit -F arch=b64 -S execve -k command_execution

# 重载规则
auditctl -R /etc/audit/rules.d/audit.rules

# 查看审计日志
ausearch -k identity -ts recent
aureport --login --summary
```

### 自动化运维脚本

**系统巡检脚本（增强版）**：
```bash
#!/bin/bash
# enhanced_system_check.sh

REPORT_FILE="/var/log/system-check-$(date +%Y%m%d-%H%M%S).log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEM=80
ALERT_THRESHOLD_DISK=80

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "$1" | tee -a $REPORT_FILE
}

log "=== System Health Check Report ==="
log "Date: $(date)"
log "Hostname: $(hostname)"
log ""

# 1. 系统负载检查
log "[System Load]"
LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | tr -d ',')
CPU_CORES=$(nproc)
LOAD_PCT=$(echo "$LOAD * 100 / $CPU_CORES" | bc)

if (( $(echo "$LOAD_PCT > $ALERT_THRESHOLD_CPU" | bc -l) )); then
    log "${RED}ALERT: Load is ${LOAD} (${LOAD_PCT}% of ${CPU_CORES} cores)${NC}"
else
    log "${GREEN}OK: Load is ${LOAD} (${LOAD_PCT}% of ${CPU_CORES} cores)${NC}"
fi
log ""

# 2. 内存检查
log "[Memory Usage]"
MEM_INFO=$(free | grep Mem)
MEM_TOTAL=$(echo $MEM_INFO | awk '{print $2}')
MEM_USED=$(echo $MEM_INFO | awk '{print $3}')
MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))

if [ $MEM_PCT -gt $ALERT_THRESHOLD_MEM ]; then
    log "${RED}ALERT: Memory usage is ${MEM_PCT}%${NC}"
else
    log "${GREEN}OK: Memory usage is ${MEM_PCT}%${NC}"
fi
log "$(free -h)"
log ""

# 3. 磁盘检查
log "[Disk Usage]"
DISK_ALERT=0
while read -r filesystem size used avail pct mount; do
    PCT_NUM=$(echo $pct | tr -d '%')
    if [ "$PCT_NUM" -gt "$ALERT_THRESHOLD_DISK" ]; then
        log "${RED}ALERT: $mount is ${pct} full${NC}"
        DISK_ALERT=1
    fi
done < <(df -h | grep -vE '^Filesystem|tmpfs|cdrom' | awk 'NR>1')

if [ $DISK_ALERT -eq 0 ]; then
    log "${GREEN}OK: All filesystems below ${ALERT_THRESHOLD_DISK}%${NC}"
fi
log "$(df -h)"
log ""

# 4. Zombie 进程检查
log "[Zombie Processes]"
ZOMBIES=$(ps aux | awk '$8 ~ /^Z/ {print $0}' | wc -l)
if [ $ZOMBIES -gt 0 ]; then
    log "${YELLOW}WARNING: Found ${ZOMBIES} zombie processes${NC}"
    ps aux | awk '$8 ~ /^Z/ {print $0}' | tee -a $REPORT_FILE
else
    log "${GREEN}OK: No zombie processes${NC}"
fi
log ""

# 5. 僵尸进程检查
log "[Failed Services]"
FAILED=$(systemctl --failed --no-legend | wc -l)
if [ $FAILED -gt 0 ]; then
    log "${RED}ALERT: ${FAILED} failed services${NC}"
    systemctl --failed --no-legend | tee -a $REPORT_FILE
else
    log "${GREEN}OK: No failed services${NC}"
fi
log ""

# 6. 安全更新检查
log "[Security Updates]"
if command -v yum &> /dev/null; then
    UPDATES=$(yum --security check-update 2>/dev/null | grep -c "security")
    log "Security updates available: $UPDATES"
elif command -v apt &> /dev/null; then
    UPDATES=$(apt list --upgradable 2>/dev/null | grep -c "security")
    log "Security updates available: $UPDATES"
fi
log ""

# 7. 最近登录检查
log "[Recent Logins]"
last -10 | tee -a $REPORT_FILE
log ""

log "=== Check completed ==="
log "Report saved to: $REPORT_FILE"

# 发送邮件通知（如果配置了邮件）
if [ -f /etc/mail/sendmail.cf ] && [ $DISK_ALERT -eq 1 -o $MEM_PCT -gt $ALERT_THRESHOLD_MEM ]; then
    mail -s "System Alert on $(hostname)" admin@example.com < $REPORT_FILE
fi
```

**日志分析自动化脚本**：
```bash
#!/bin/bash
# log_analyzer.sh

LOG_DIR="/var/log"
REPORT_DIR="/var/log/reports"
mkdir -p $REPORT_DIR

DATE=$(date +%Y%m%d)
REPORT_FILE="$REPORT_DIR/log-analysis-$DATE.txt"

# 分析 auth.log/secure
echo "=== Authentication Analysis ===" > $REPORT_FILE
echo "Failed SSH attempts:" >> $REPORT_FILE
grep "Failed password" $LOG_DIR/auth.log $LOG_DIR/secure 2>/dev/null | \
    awk '{print $11}' | sort | uniq -c | sort -rn | head -10 >> $REPORT_FILE

# 分析系统日志
echo -e "\n=== System Errors ===" >> $REPORT_FILE
echo "Top errors in syslog:" >> $REPORT_FILE
grep -i "error\|fail\|critical" $LOG_DIR/syslog 2>/dev/null | \
    awk '{print $5}' | sort | uniq -c | sort -rn | head -10 >> $REPORT_FILE

# 分析 Apache/Nginx 日志（如果存在）
if [ -f $LOG_DIR/apache2/access.log ]; then
    echo -e "\n=== Web Server Analysis ===" >> $REPORT_FILE
    echo "Top 10 IPs:" >> $REPORT_FILE
    awk '{print $1}' $LOG_DIR/apache2/access.log | sort | uniq -c | sort -rn | head -10 >> $REPORT_FILE

    echo -e "\nTop 404 URLs:" >> $REPORT_FILE
    awk '$9 == 404 {print $7}' $LOG_DIR/apache2/access.log | sort | uniq -c | sort -rn | head -10 >> $REPORT_FILE
fi

# 分析 dmesg
echo -e "\n=== Kernel Messages ===" >> $REPORT_FILE
dmesg | tail -50 >> $REPORT_FILE

echo "Log analysis completed: $REPORT_FILE"
```

### 云原生环境系统管理

**使用 cloud-init 初始化系统**：
```yaml
# cloud-config.yaml
#cloud-config

hostname: myserver
fqdn: myserver.example.com

users:
  - name: admin
    sudo: ALL=(ALL) NOPASSWD:ALL
    ssh_authorized_keys:
      - ssh-rsa AAAAB3... admin@example.com

packages:
  - htop
  - vim
  - docker.io
  - prometheus-node-exporter

runcmd:
  - systemctl enable --now prometheus-node-exporter
  - ufw allow 22/tcp
  - ufw allow 80/tcp
  - ufw allow 443/tcp
  - ufw --force enable

write_files:
  - path: /etc/sysctl.d/99-custom.conf
    content: |
      vm.swappiness=10
      net.ipv4.tcp_tw_reuse=1
    permissions: '0644'
```

**使用 systemd-nspawn 创建轻量级容器**：
```bash
# 创建容器目录
mkdir -p /var/lib/machines/mycontainer

# 安装基础系统
debootstrap stable /var/lib/machines/mycontainer http://deb.debian.org/debian/

# 启动容器
systemd-nspawn -D /var/lib/machines/mycontainer -b

# 使用 machinectl 管理
machinectl list
machinectl login mycontainer
machinectl enable mycontainer
```

📋 预防建议
- 配置监控告警（负载、内存、IO）
- 设置合理的 logrotate 防止日志占满磁盘
- 配置 OOM killer 策略
- 定期进行压力测试和容量规划
```
