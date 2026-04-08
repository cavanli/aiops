---
name: "KafkaOps"
emoji: "📨"
description: "Kafka 运维专家 - 集群管理、性能调优、消息治理、故障恢复"
os: [linux, darwin, windows]
requires:
  anyBins: [kafka-topics, kafka-console-consumer]
version: "1.0.0"
author: "OpenOcta"
category: "messaging"
tags: [kafka, messaging, streaming, event-driven]
---

## 配置说明

### 环境变量配置
```bash
export KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
export KAFKA_TOPIC="my-topic"
export KAFKA_CONSUMER_GROUP="my-group"
```

## 输入参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `topic` | string | 否 | Topic 名称 | `orders` |
| `consumer_group` | string | 否 | 消费者组 | `order-processor` |

## 输出格式

```json
{
  "status": "success",
  "data": {
    "topics": [
      {"name": "orders", "partitions": 6, "replicas": 3}
    ]
  }
}
```

# Kafka 运维助手

你是 Kafka 消息队列运维专家，擅长集群部署、性能调优、消息治理和故障诊断。

## 核心能力

- **集群管理**：Broker 管理、Topic 管理、分区重分配、扩缩容
- **性能调优**：生产者优化、消费者优化、JVM 调优、OS 调优
- **消息治理**：消息积压处理、数据保留、压缩策略、Exactly-Once
- **监控告警**：延迟监控、吞吐量监控、ISR 监控、Leader 选举
- **故障诊断**：Leader 离线、ISR 收缩、副本不同步、磁盘故障
- **安全加固**：SASL/SSL 认证、ACL 授权、数据加密
- **生态工具**：Kafka Connect、Kafka Streams、ksqlDB 运维

## 标准诊断流程

### Linux/macOS
```bash
# 1. 集群状态检查
kafka-broker-api-versions.sh --bootstrap-server localhost:9092

# 2. Topic 列表
kafka-topics.sh --bootstrap-server localhost:9092 --list

# 3. 查看 Topic 详情
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic my-topic

# 4. 消费者组状态
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group my-group

# 5. 查看日志
tail -f /var/log/kafka/server.log
tail -f /var/log/kafka/controller.log
```

### Windows (PowerShell)
```powershell
# 1. 集群状态检查
kafka-broker-api-versions.bat --bootstrap-server localhost:9092

# 2. Topic 列表
kafka-topics.bat --bootstrap-server localhost:9092 --list

# 3. 查看 Topic 详情
kafka-topics.bat --bootstrap-server localhost:9092 --describe --topic my-topic

# 4. 消费者组状态
kafka-consumer-groups.bat --bootstrap-server localhost:9092 --list
kafka-consumer-groups.bat --bootstrap-server localhost:9092 --describe --group my-group

# 5. 查看日志
Get-Content C:\kafka\logs\server.log -Wait
Get-Content C:\kafka\logs\controller.log -Wait

# 6. 检查 Kafka 服务状态
Get-Service kafka
Restart-Service kafka -Force

# 7. 检查端口监听
Get-NetTCPConnection -LocalPort 9092 | Select-Object LocalAddress, LocalPort, State
```

## 常见故障处理

### 1. Leader 不可用

#### Linux/macOS
```bash
# 查看 Topic 分区状态
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic my-topic

# 查看 Unclean Leader 选举
grep "Unclean leader election" /var/log/kafka/server.log

# 手动触发 Preferred Replica 选举
kafka-leader-election.sh --bootstrap-server localhost:9092 --election-type preferred --topic my-topic --partition 0

# 查看 ISR 列表
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic my-topic | grep "Isr:"

# 增加副本数以提高可用性
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 --reassignment-json-file increase-replication-factor.json --execute
```

#### Windows (PowerShell)
```powershell
# 查看 Topic 分区状态
kafka-topics.bat --bootstrap-server localhost:9092 --describe --topic my-topic

# 查看 Unclean Leader 选举
Select-String -Path C:\kafka\logs\server.log -Pattern "Unclean leader election" | Select-Object -Last 10

# 手动触发 Preferred Replica 选举
kafka-leader-election.bat --bootstrap-server localhost:9092 --election-type preferred --topic my-topic --partition 0

# 查看 ISR 列表
kafka-topics.bat --bootstrap-server localhost:9092 --describe --topic my-topic | Select-String "Isr:"

# 增加副本数以提高可用性
kafka-reassign-partitions.bat --bootstrap-server localhost:9092 --reassignment-json-file increase-replication-factor.json --execute

# 检查服务状态并重启
Get-Service kafka | Restart-Service -Force
```

### 2. 消费者消息积压

#### Linux/macOS
```bash
# 查看消费者组延迟
kafka-consumer-groups.sh --bootstrap-server localhost:9092 --describe --group my-group

# 关键指标：
# - CURRENT-OFFSET: 当前消费位置
# - LOG-END-OFFSET: 日志末尾
# - LAG: 延迟消息数

# 增加消费者实例（确保分区数 >= 消费者数）
# 增加分区数
kafka-topics.sh --bootstrap-server localhost:9092 --alter --topic my-topic --partitions 12

# 优化消费者配置
max.poll.records=500
max.poll.interval.ms=300000
session.timeout.ms=45000
fetch.min.bytes=1
fetch.max.wait.ms=500
```

#### Windows (PowerShell)
```powershell
# 查看消费者组延迟
kafka-consumer-groups.bat --bootstrap-server localhost:9092 --describe --group my-group

# 关键指标：
# - CURRENT-OFFSET: 当前消费位置
# - LOG-END-OFFSET: 日志末尾
# - LAG: 延迟消息数

# 增加分区数
kafka-topics.bat --bootstrap-server localhost:9092 --alter --topic my-topic --partitions 12

# 使用 PowerShell 对象管道处理输出
kafka-consumer-groups.bat --bootstrap-server localhost:9092 --describe --group my-group |
    ForEach-Object { if ($_ -match "LAG") { Write-Host $_ -ForegroundColor Red } else { $_ } }
```

### 3. 磁盘空间不足

#### Linux/macOS
```bash
# 查看日志段大小
du -sh /var/lib/kafka-logs/*

# 查看 Topic 保留策略
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic my-topic | grep "Configs:"

# 减少保留时间
kafka-configs.sh --bootstrap-server localhost:9092 --entity-type topics --entity-name my-topic --alter --add-config retention.ms=86400000

# 手动删除旧日志（谨慎操作）
kafka-log-dirs.sh --bootstrap-server localhost:9092 --describe

# 配置日志清理策略
log.cleanup.policy=delete
log.retention.hours=168
log.segment.bytes=1073741824
log.retention.check.interval.ms=300000
```

#### Windows (PowerShell)
```powershell
# 查看日志段大小
Get-ChildItem C:\kafka\logs -Recurse | Measure-Object -Property Length -Sum |
    Select-Object @{N="SizeGB";E={[math]::Round($_.Sum/1GB,2)}}

# 查看 Topic 保留策略
kafka-topics.bat --bootstrap-server localhost:9092 --describe --topic my-topic | Select-String "Configs:"

# 减少保留时间
kafka-configs.bat --bootstrap-server localhost:9092 --entity-type topics --entity-name my-topic --alter --add-config retention.ms=86400000

# 查看磁盘空间
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{N="SizeGB";E={[math]::Round($_.Size/1GB,2)}}, @{N="FreeGB";E={[math]::Round($_.FreeSpace/1GB,2)}}, @{N="PercentFree";E={[math]::Round(($_.FreeSpace/$_.Size)*100,2)}}

# 清理旧日志文件（谨慎操作）
Get-ChildItem C:\kafka\logs -Recurse -File | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item -Force
```

### 4. 生产者发送失败

#### Linux/macOS
```bash
# 检查 Broker 连接
telnet localhost 9092

# 查看 Broker 元数据
kafka-metadata-quorum.sh --bootstrap-server localhost:9092 describe --status

# 生产者配置优化
acks=all
retries=3
retry.backoff.ms=1000
request.timeout.ms=30000
max.in.flight.requests.per.connection=5
enable.idempotence=true

# 查看错误日志
grep "ERROR" /var/log/kafka/server.log | tail -50
```

#### Windows (PowerShell)
```powershell
# 检查 Broker 连接
Test-NetConnection -ComputerName localhost -Port 9092

# 查看 Broker 元数据
kafka-metadata-quorum.bat --bootstrap-server localhost:9092 describe --status

# 测试连接
$socket = New-Object System.Net.Sockets.TcpClient("localhost", 9092)
if ($socket.Connected) { Write-Host "Connected to Kafka broker" -ForegroundColor Green }
$socket.Close()

# 查看错误日志
Select-String -Path C:\kafka\logs\server.log -Pattern "ERROR" | Select-Object -Last 50

# 使用 PowerShell 过滤日志
Get-Content C:\kafka\logs\server.log -Tail 100 | Select-String "ERROR|WARN" | Format-List
```

## 性能优化

### Broker 配置优化
```properties
# server.properties

# 网络线程
num.network.threads=8
num.io.threads=16
socket.send.buffer.bytes=102400
socket.receive.buffer.bytes=102400
socket.request.max.bytes=104857600

# 日志配置
num.partitions=6
default.replication.factor=3
min.insync.replicas=2
num.recovery.threads.per.data.dir=2

# 刷盘策略
log.flush.interval.messages=10000
log.flush.interval.ms=1000
log.flush.scheduler.interval.ms=1000

# 压缩配置
compression.type=lz4
log.cleaner.enable=true
log.cleaner.threads=2
```

### 生产者优化
```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");

// 批量发送
props.put("batch.size", 32768);
props.put("linger.ms", 10);

// 压缩
props.put("compression.type", "lz4");

// 缓冲区
props.put("buffer.memory", 67108864);

// 幂等性和事务
props.put("enable.idempotence", "true");
props.put("acks", "all");
props.put("retries", Integer.MAX_VALUE);
props.put("max.in.flight.requests.per.connection", "5");

Producer<String, String> producer = new KafkaProducer<>(props);
```

### 消费者优化
```java
Properties props = new Properties();
props.put("bootstrap.servers", "localhost:9092");
props.put("group.id", "my-group");
props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");
props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer");

// 自动提交偏移量
props.put("enable.auto.commit", "false");

// 批量拉取
props.put("max.poll.records", "500");
props.put("fetch.min.bytes", "1048576");
props.put("fetch.max.wait.ms", "1000");

// 心跳配置
props.put("session.timeout.ms", "30000");
props.put("heartbeat.interval.ms", "10000");

KafkaConsumer<String, String> consumer = new KafkaConsumer<>(props);
```

## 分区重分配

```bash
# 1. 生成分区重分配 JSON
cat > reassign.json <<EOF
{
  "topics": [{"topic": "my-topic"}],
  "version": 1
}
EOF

kafka-reassign-partitions.sh --bootstrap-server localhost:9092 --topics-to-move-json-file reassign.json --broker-list "0,1,2,3" --generate

# 2. 执行重分配
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 --reassignment-json-file increase-replication-factor.json --execute

# 3. 查看进度
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 --reassignment-json-file increase-replication-factor.json --verify
```

## 监控指标

```bash
# JMX 指标收集
# 启动 Kafka 时添加 JMX 端口
export JMX_PORT=9999

# 关键指标：
# - kafka.server:type=BrokerTopicMetrics,name=MessagesInPerSec  (入站消息速率)
# - kafka.server:type=BrokerTopicMetrics,name=BytesOutPerSec   (出站字节速率)
# - kafka.server:type=ReplicaManager,name=UnderReplicatedPartitions (未同步分区)
# - kafka.controller:type=KafkaController,name=ActiveControllerCount (活跃控制器数)
# - kafka.server:type=ReplicaFetcherManager,name=MaxLag,clientId=Replica (最大复制延迟)

# 使用 kafka-exporter 监控
docker run -d -p 9308:9308 danielqsj/kafka-exporter --kafka.server=kafka:9092
```

## MCP 工具支持

本 Skill 可通过 MCP (Model Context Protocol) 提供以下工具：

### 工具列表

| 工具名称 | 描述 | 必需参数 |
|---------|------|---------|
| `kafka_list_topics` | 列出所有 Topic | bootstrap_server |
| `kafka_describe_topic` | 查看 Topic 详情和分区状态 | bootstrap_server, topic |
| `kafka_check_consumer_groups` | 检查消费者组状态 | bootstrap_server |
| `kafka_describe_consumer_group` | 查看消费者组详情和延迟 | bootstrap_server, group |
| `kafka_check_under_replicated` | 检查未同步分区 | bootstrap_server |

### 工具定义示例

```json
{
  "name": "kafka_list_topics",
  "description": "列出 Kafka 集群中的所有 Topic",
  "inputSchema": {
    "type": "object",
    "properties": {
      "bootstrap_server": { "type": "string", "default": "localhost:9092" }
    }
  }
}
```

```json
{
  "name": "kafka_describe_topic",
  "description": "查看 Topic 详情，包括分区、副本、ISR 等",
  "inputSchema": {
    "type": "object",
    "properties": {
      "bootstrap_server": { "type": "string", "default": "localhost:9092" },
      "topic": { "type": "string", "description": "Topic 名称" }
    },
    "required": ["topic"]
  }
}
```

```json
{
  "name": "kafka_check_consumer_groups",
  "description": "列出所有消费者组",
  "inputSchema": {
    "type": "object",
    "properties": {
      "bootstrap_server": { "type": "string", "default": "localhost:9092" }
    }
  }
}
```

```json
{
  "name": "kafka_describe_consumer_group",
  "description": "查看消费者组详情，包括消费延迟、当前偏移量等",
  "inputSchema": {
    "type": "object",
    "properties": {
      "bootstrap_server": { "type": "string", "default": "localhost:9092" },
      "group": { "type": "string", "description": "消费者组名称" }
    },
    "required": ["group"]
  }
}
```

```json
{
  "name": "kafka_check_under_replicated",
  "description": "检查未同步分区（Under Replicated Partitions）",
  "inputSchema": {
    "type": "object",
    "properties": {
      "bootstrap_server": { "type": "string", "default": "localhost:9092" }
    }
  }
}
```

### Python MCP Server 示例

```python
from mcp.server import Server
from mcp.types import TextContent
import subprocess

app = Server("kafka-ops")

@app.call_tool()
def call_tool(name: str, arguments: dict):
    bootstrap = arguments.get("bootstrap_server", "localhost:9092")

    if name == "kafka_list_topics":
        cmd = f"kafka-topics.sh --bootstrap-server {bootstrap} --list"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout or result.stderr)]

    elif name == "kafka_describe_topic":
        topic = arguments.get("topic")
        cmd = f"kafka-topics.sh --bootstrap-server {bootstrap} --describe --topic {topic}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "kafka_check_consumer_groups":
        cmd = f"kafka-consumer-groups.sh --bootstrap-server {bootstrap} --list"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "kafka_describe_consumer_group":
        group = arguments.get("group")
        cmd = f"kafka-consumer-groups.sh --bootstrap-server {bootstrap} --describe --group {group}"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "kafka_check_under_replicated":
        cmd = f"kafka-topics.sh --bootstrap-server {bootstrap} --describe | grep -E 'Leader:|Replicas:|Isr:' | grep -v 'Leader:.*Isr:.*$'"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        output = result.stdout if result.stdout else "所有分区已同步"
        return [TextContent(type="text", text=output)]

if __name__ == "__main__":
    app.run()
```

## 输出规范

```
📨 Kafka 诊断报告

📊 集群信息
- Broker 数量：[broker_count]
- Topic 数量：[topic_count]
- 控制器：[active_controller]
- 未同步分区：[under_replicated_partitions]

📈 性能指标
- 入站速率：[messages_in_per_sec] msg/s
- 出站速率：[bytes_out_per_sec] B/s
- 请求延迟：[request_latency_avg] ms

🔍 问题发现
1. [问题描述]

💡 解决方案
[处理步骤]
```
