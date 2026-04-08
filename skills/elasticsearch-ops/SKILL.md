---
name: "ElasticsearchOps"
emoji: "🔍"
description: "Elasticsearch 运维专家 - 集群管理、性能优化、数据治理、故障恢复"
os: [linux, darwin, windows]
requires:
  bins: [curl]
version: "1.1.0"
author: "OpenOcta"
category: "database"
tags: [elasticsearch, search, logging, analytics]
---

## 配置说明

### 环境变量配置，需要获取以下环境变量，从当前的环境变量中加载elasticsearch的连接信息
```bash
# ES 连接配置
ES_HOST   # elasticsearch 的主机信息
ES_USERNAME  # elasticsearch 的用户名，可选
ES_PASSWORD  # elasticsearch 密码，可选
ES_CA_CERT  # 证书所在路径，可选

# API 配置
ES_TIMEOUT   # 超时时间
ES_MAX_RETRIES  # 最大重试次数
```

### 配置文件示例
```yaml
# ~/.openocta/elasticsearch.yml
cluster:
  host: "https://es-cluster.example.com:9200"
  username: "elastic"
  password: "${ES_PASSWORD}"
  ssl:
    verify_certs: true
    ca_certs: "/etc/ssl/certs/ca-bundle.crt"

indices:
  default_shards: 3
  default_replicas: 1
  lifecycle_policy: "30d-retention"

monitoring:
  health_check_interval: "30s"
  alert_on_red_status: true
```

## 输入参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `index` | string | 否 | 索引名称 | `logs-2024.01.15` |
| `query` | object | 否 | 查询 DSL | `{"match": {"status": "error"}}` |
| `cluster` | string | 否 | 集群名称 | `production` |
| `node_id` | string | 否 | 节点 ID | `node-1` |

## 输出格式

### 集群健康输出
```json
{
  "status": "success",
  "data": {
    "cluster_name": "production-es",
    "status": "green",
    "indices": 150,
    "nodes": {
      "total": 5,
      "successful": 5,
      "failed": 0
    },
    "shards": {
      "total": 750,
      "active": 750,
      "relocating": 0,
      "unassigned": 0
    }
  }
}
```

# Elasticsearch 运维助手

你是 Elasticsearch 运维专家，擅长集群部署、性能调优、索引管理和故障诊断。

## 核心能力

- **集群管理**：节点角色、分片分配、集群健康、扩缩容
- **性能优化**：查询优化、写入调优、缓存策略、JVM 调优
- **索引管理**：生命周期、模板映射、分片策略、冷热分离
- **数据治理**：大索引处理、数据迁移、备份恢复、过期清理
- **监控告警**：集群指标、节点指标、索引指标、查询性能
- **故障诊断**：脑裂恢复、分片失败、节点离线、集群红灯
- **安全加固**：认证授权、TLS 加密、IP 白名单、审计日志

## 标准诊断流程

### Linux

```bash
# 1. 集群健康检查
curl -X GET "localhost:9200/_cluster/health?pretty"

# 2. 节点状态
curl -X GET "localhost:9200/_cat/nodes?v"

# 3. 索引状态
curl -X GET "localhost:9200/_cat/indices?v&health=red"

# 4. 分片分配
curl -X GET "localhost:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason"

# 5. 集群任务
curl -X GET "localhost:9200/_cat/pending_tasks?v"

# 6. 热点线程
curl -X GET "localhost:9200/_nodes/hot_threads"

# 7. 查看日志
tail -f /var/log/elasticsearch/elasticsearch.log
```

### Windows PowerShell

```powershell
# 1. 集群健康检查
Invoke-RestMethod -Uri "http://localhost:9200/_cluster/health?pretty" -Method GET

# 2. 节点状态
Invoke-RestMethod -Uri "http://localhost:9200/_cat/nodes?v" -Method GET

# 3. 索引状态
Invoke-RestMethod -Uri "http://localhost:9200/_cat/indices?v&health=red" -Method GET

# 4. 分片分配
Invoke-RestMethod -Uri "http://localhost:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason" -Method GET

# 5. 集群任务
Invoke-RestMethod -Uri "http://localhost:9200/_cat/pending_tasks?v" -Method GET

# 6. 热点线程
Invoke-RestMethod -Uri "http://localhost:9200/_nodes/hot_threads" -Method GET

# 7. 查看 Elasticsearch 服务
Get-Service | Where-Object {$_.Name -like "*elasticsearch*"}

# 8. 重启 Elasticsearch 服务
Restart-Service Elasticsearch

# 9. 查看 Elasticsearch 进程
Get-Process | Where-Object {$_.ProcessName -like "*elasticsearch*"}

# 10. 检查端口监听
Get-NetTCPConnection -LocalPort 9200

# 11. 查看日志 (Windows 路径)
Get-Content "C:\ProgramData\Elastic\Elasticsearch\logs\elasticsearch.log" -Wait

# 12. 使用 curl (如果已安装)
curl.exe -X GET "localhost:9200/_cluster/health?pretty"

# 13. 检查数据目录磁盘空间
Get-ChildItem "C:\ProgramData\Elastic\Elasticsearch\data" | Measure-Object -Property Length -Sum

# 14. 查看 Windows 事件日志
Get-EventLog -LogName Application -Source "Elasticsearch*" -Newest 20
```

## 常见故障处理

### 1. 集群状态 RED 深度恢复

**症状**：集群状态为 RED，存在未分配分片，部分索引不可用

**诊断流程**：
```bash
# 1. 查看集群健康状态详情
curl -s "localhost:9200/_cluster/health?level=indices&pretty"

# 2. 查看 RED 索引列表
curl -s "localhost:9200/_cat/indices?v&health=red"

# 3. 查看未分配分片详情
curl -s "localhost:9200/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason,unassigned.details"

# 4. 获取具体分片的分配解释
curl -X POST "localhost:9200/_cluster/allocation/explain?pretty" -H 'Content-Type: application/json' -d'
{
  "index": "red_index_name",
  "shard": 0,
  "primary": true
}'

# 5. 查看集群任务队列
curl -s "localhost:9200/_cat/pending_tasks?v"

# 6. 检查节点磁盘空间
curl -s "localhost:9200/_cat/allocation?v"
```

**RED 状态恢复方案**：

**原因1：主分片和副本都丢失（ALLOCATION_FAILED）**
```bash
# 查看失败原因
curl -s "localhost:9200/_cluster/allocation/explain?pretty" | grep -A 20 "ALLOCATION_FAILED"

# 方案A：尝试重新分配空主分片（数据丢失风险）
curl -X POST "localhost:9200/_cluster/reroute" -H 'Content-Type: application/json' -d'
{
  "commands": [
    {
      "allocate_empty_primary": {
        "index": "my_index",
        "shard": 0,
        "node": "node_name",
        "accept_data_loss": true
      }
    }
  ]
}'

# 方案B：使用过时副本恢复（可能丢失部分数据）
curl -X POST "localhost:9200/_cluster/reroute" -H 'Content-Type: application/json' -d'
{
  "commands": [
    {
      "allocate_stale_primary": {
        "index": "my_index",
        "shard": 0,
        "node": "node_name",
        "accept_data_loss": true
      }
    }
  ]
}'
```

**原因2：磁盘水位线触发（NODE_DISK_WATERMARK）**
```bash
# 临时调整水位线
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "90%",
    "cluster.routing.allocation.disk.watermark.high": "95%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "97%"
  }
}'

# 解除只读锁定
curl -X PUT "localhost:9200/*/_settings" -H 'Content-Type: application/json' -d'
{
  "index.blocks.read_only_allow_delete": null
}'

# 触发重新分配
curl -X POST "localhost:9200/_cluster/reroute?retry_failed=true"
```

**原因3：分片损坏（CORRUPTED_SHARD）**
```bash
# 查看损坏的分片
curl -s "localhost:9200/_cluster/allocation/explain?pretty" | grep -i corrupt

# 从快照恢复（推荐）
curl -X POST "localhost:9200/_snapshot/my_backup/snapshot_1/_restore" -H 'Content-Type: application/json' -d'
{
  "indices": "corrupted_index",
  "rename_pattern": "(.+)",
  "rename_replacement": "restored_$1"
}'

# 或者删除损坏索引（数据丢失）
curl -X DELETE "localhost:9200/corrupted_index"
```

**原因4：节点离线（NODE_LEFT）**
```bash
# 等待节点恢复上线
# 或者强制分配（如果节点永久离线）
curl -X POST "localhost:9200/_cluster/reroute" -H 'Content-Type: application/json' -d'
{
  "commands": [
    {
      "allocate_replica": {
        "index": "my_index",
        "shard": 0,
        "node": "available_node_name"
      }
    }
  ]
}'
```

**RED 状态自动化修复脚本**：
```bash
#!/bin/bash
# es_red_recovery.sh

ES_HOST="localhost:9200"

# 获取所有 RED 索引
RED_INDICES=$(curl -s "${ES_HOST}/_cat/indices?health=red&h=index" | sort -u)

for INDEX in $RED_INDICES; do
  echo "处理 RED 索引: $INDEX"

  # 获取未分配分片
  UNASSIGNED_SHARDS=$(curl -s "${ES_HOST}/_cat/shards/${INDEX}?h=shard,prirep,state" | grep "UNASSIGNED" | awk '{print $1":"$2}')

  for SHARD_INFO in $UNASSIGNED_SHARDS; do
    SHARD=$(echo $SHARD_INFO | cut -d: -f1)
    TYPE=$(echo $SHARD_INFO | cut -d: -f2)

    echo "  处理分片: $SHARD ($TYPE)"

    # 获取分配解释
    EXPLAIN=$(curl -s -X POST "${ES_HOST}/_cluster/allocation/explain" -H 'Content-Type: application/json' -d"{
      \"index\": \"$INDEX\",
      \"shard\": $SHARD,
      \"primary\": $([ "$TYPE" == "p" ] && echo "true" || echo "false")
    }")

    REASON=$(echo $EXPLAIN | grep -o '"allocate_explanation" : "[^"]*"' | cut -d'"' -f4)
    echo "  原因: $REASON"

    # 根据原因处理
    if echo "$REASON" | grep -q "disk"; then
      echo "  磁盘空间问题，请清理磁盘"
    elif echo "$REASON" | grep -q "corrupt"; then
      echo "  分片损坏，需要从快照恢复"
    fi
  done
done
```

### 2. 索引损坏修复

**症状**：查询索引报错 "corrupt shard"、"checksum mismatch" 或 "failed to read local storage"

**诊断流程**：
```bash
# 1. 检查索引健康状态
curl -s "localhost:9200/_cluster/health/${INDEX}?level=shards&pretty"

# 2. 查看损坏详情
curl -s "localhost:9200/_cluster/allocation/explain?pretty" | grep -A 30 "corrupt"

# 3. 检查节点日志
ssh node-ip "grep -i corrupt /var/log/elasticsearch/elasticsearch.log | tail -20"

# 4. 验证索引完整性
curl -s "localhost:9200/${INDEX}/_stats/store,docs?pretty"
```

**修复方案**：

**方案1：从快照恢复（推荐，数据安全）**
```bash
# 查看可用快照
curl -s "localhost:9200/_snapshot/my_backup/_all?pretty"

# 关闭损坏索引（防止写入）
curl -X POST "localhost:9200/${INDEX}/_close"

# 从快照恢复
curl -X POST "localhost:9200/_snapshot/my_backup/snapshot_1/_restore" -H 'Content-Type: application/json' -d"
{
  \"indices\": \"${INDEX}\",
  \"rename_pattern\": \"(.+)\",
  \"rename_replacement\": \"restored_\$1\",
  \"include_global_state\": false
}"

# 验证恢复后的索引
curl -s "localhost:9200/restored_${INDEX}/_count"

# 删除损坏索引，重命名恢复后的索引
curl -X DELETE "localhost:9200/${INDEX}"
curl -X POST "localhost:9200/restored_${INDEX}/_clone/${INDEX}"
curl -X DELETE "localhost:9200/restored_${INDEX}"
```

**方案2：使用 _forcemerge 修复（轻微损坏）**
```bash
# 强制合并段（可能修复轻微损坏）
curl -X POST "localhost:9200/${INDEX}/_forcemerge?max_num_segments=1&pretty"

# 检查修复结果
curl -s "localhost:9200/_cluster/health/${INDEX}?pretty"
```

**方案3：重新索引数据（如果有数据源）**
```bash
# 创建新索引
curl -X PUT "localhost:9200/new_index" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}'

# 从数据源重新索引
curl -X POST "localhost:9200/_reindex?pretty" -H 'Content-Type: application/json' -d"
{
  \"source\": {
    \"remote\": {
      \"host\": \"http://source-es:9200\"
    },
    \"index\": \"source_index\"
  },
  \"dest\": {
    \"index\": \"new_index\"
  }
}"
```

**方案4：删除并重建（数据可丢失时）**
```bash
# 删除损坏索引
curl -X DELETE "localhost:9200/${INDEX}"

# 从模板重新创建
curl -X PUT "localhost:9200/${INDEX}" -H 'Content-Type: application/json' -d'
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "field": { "type": "text" }
    }
  }
}'
```

## Windows PowerShell 运维脚本

### 服务管理
```powershell
# 检查 Elasticsearch 服务状态
Get-Service -Name "Elasticsearch"

# 启动 Elasticsearch 服务
Start-Service -Name "Elasticsearch"

# 停止 Elasticsearch 服务
Stop-Service -Name "Elasticsearch"

# 重启 Elasticsearch 服务
Restart-Service -Name "Elasticsearch"

# 设置服务自动启动
Set-Service -Name "Elasticsearch" -StartupType Automatic
```

### 集群健康检查 (PowerShell)
```powershell
# 检查集群健康状态
$health = Invoke-RestMethod -Uri "http://localhost:9200/_cluster/health"
Write-Output "Cluster Status: $($health.status)"
Write-Output "Nodes: $($health.number_of_nodes)"
Write-Output "Active Shards: $($health.active_shards)"
Write-Output "Unassigned Shards: $($health.unassigned_shards)"

# 检查节点状态
Invoke-RestMethod -Uri "http://localhost:9200/_cat/nodes?format=json" |
    Select-Object name, heap.percent, ram.percent, cpu, load_1m

# 检查索引状态
Invoke-RestMethod -Uri "http://localhost:9200/_cat/indices?format=json" |
    Select-Object index, health, docs.count, store.size
```

### 日志监控
```powershell
# 实时监控 Elasticsearch 日志
Get-Content "C:\ProgramData\Elastic\Elasticsearch\logs\elasticsearch.log" -Wait

# 查找错误日志
Select-String -Path "C:\ProgramData\Elastic\Elasticsearch\logs\*.log" -Pattern "ERROR|FATAL" -Context 2

# 查看 GC 日志
Get-Content "C:\ProgramData\Elastic\Elasticsearch\logs\gc.log" -Tail 50
```

### 性能监控
```powershell
# 检查 Elasticsearch 进程资源使用
Get-Process | Where-Object {$_.ProcessName -like "*elasticsearch*"} |
    Select-Object Name, Id, CPU, WorkingSet, PagedMemorySize

# 检查 JVM 堆使用
$jvmStats = Invoke-RestMethod -Uri "http://localhost:9200/_nodes/stats/jvm"
$jvmStats.nodes | ForEach-Object {
    $node = $_.Value
    Write-Output "Node: $($node.name)"
    Write-Output "Heap Used: $($node.jvm.mem.heap_used_percent)%"
}

# 检查磁盘使用
Invoke-RestMethod -Uri "http://localhost:9200/_cat/allocation?format=json" |
    Select-Object node, disk.percent, disk.used, disk.total
```

### 备份恢复 (Windows)
```powershell
# 创建快照仓库
$body = @{
    type = "fs"
    settings = @{
        location = "C:\Backups\elasticsearch"
        compress = $true
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:9200/_snapshot/my_backup" -Method PUT -Body $body -ContentType "application/json"

# 创建快照
Invoke-RestMethod -Uri "http://localhost:9200/_snapshot/my_backup/snapshot_$(Get-Date -Format 'yyyyMMdd')?wait_for_completion=true" -Method PUT

# 恢复快照
Invoke-RestMethod -Uri "http://localhost:9200/_snapshot/my_backup/snapshot_$(Get-Date -Format 'yyyyMMdd')/_restore" -Method POST
```

### 3. JVM GC 问题排查

**症状**：节点频繁 GC、响应变慢、甚至 OOM 退出

**诊断流程**：
```bash
# 1. 查看 JVM 内存使用
curl -s "localhost:9200/_nodes/stats/jvm?pretty" | grep -E "heap_used_percent|heap_used_in_bytes|heap_max_in_bytes"

# 2. 查看 GC 统计
curl -s "localhost:9200/_nodes/stats/jvm?pretty" | grep -A 20 "gc"

# 3. 查看 GC 日志
tail -f /var/log/elasticsearch/gc.log

# 4. 查看节点热点线程（可能发现内存分配热点）
curl -s "localhost:9200/_nodes/hot_threads?threads=10&type=wait"

# 5. 检查 fielddata 缓存（常见内存消耗大户）
curl -s "localhost:9200/_nodes/stats/indices/fielddata?pretty" | grep -E "fielddata|memory_size"

# 6. 检查 segment 内存使用
curl -s "localhost:9200/_nodes/stats/indices/segments?pretty" | grep -E "segments|memory"
```

**GC 问题处理**：

**问题1：堆内存不足导致频繁 Full GC**
```bash
# 检查当前堆设置
curl -s "localhost:9200/_nodes/jvm?pretty" | grep -E "heap_init|heap_max"

# 调整 JVM 配置（jvm.options）
# 增加堆内存（不超过 32GB，建议 50% 系统内存）
-Xms24g
-Xmx24g

# 使用 G1GC（Elasticsearch 默认）
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200

# 启用 GC 日志
-Xlog:gc*:file=/var/log/elasticsearch/gc.log:time,uptime:filecount=32,filesize=64m
```

**问题2：Fielddata 缓存占用过多内存**
```bash
# 查看 fielddata 缓存使用
curl -s "localhost:9200/_cat/fielddata?v"

# 清空 fielddata 缓存
curl -X POST "localhost:9200/_cache/clear?fielddata=true"

# 限制 fielddata 缓存大小
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "indices.breaker.fielddata.limit": "40%"
  }
}'

# 使用 doc_values 替代 fielddata（推荐）
# 创建索引时启用 doc_values
curl -X PUT "localhost:9200/my_index" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "text_field": {
        "type": "text",
        "fielddata": false,
        "fields": {
          "keyword": {
            "type": "keyword"
          }
        }
      }
    }
  }
}'
```

**问题3：Segment 内存占用过高**
```bash
# 查看 segment 数量
curl -s "localhost:9200/_cat/segments?v"

# 强制合并 segment（降低内存使用）
curl -X POST "localhost:9200/my_index/_forcemerge?max_num_segments=10"

# 优化 merge 策略
curl -X PUT "localhost:9200/my_index/_settings" -H 'Content-Type: application/json' -d'
{
  "index": {
    "merge.policy.segments_per_tier": 10,
    "merge.policy.max_merge_at_once": 10
  }
}'
```

**问题4：Circuit Breaker 频繁触发**
```bash
# 查看 Circuit Breaker 统计
curl -s "localhost:9200/_nodes/stats/breaker?pretty"

# 调整 Circuit Breaker 限制
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "persistent": {
    "indices.breaker.total.limit": "70%",
    "indices.breaker.fielddata.limit": "60%",
    "indices.breaker.request.limit": "40%"
  }
}'
```

**GC 监控脚本**：
```bash
#!/bin/bash
# es_gc_monitor.sh

ES_HOST="localhost:9200"
ALERT_HEAP_THRESHOLD=85
ALERT_GC_THRESHOLD=10

# 获取堆使用率
HEAP_USAGE=$(curl -s "${ES_HOST}/_nodes/stats/jvm" | jq '.nodes[].jvm.mem.heap_used_percent' | sort -rn | head -1)

if [ "$HEAP_USAGE" -gt "$ALERT_HEAP_THRESHOLD" ]; then
  echo "ALERT: JVM 堆使用率过高: ${HEAP_USAGE}%"

  # 获取 GC 统计
  GC_STATS=$(curl -s "${ES_HOST}/_nodes/stats/jvm" | jq '.nodes[].jvm.gc.collectors')
  echo "GC 统计: $GC_STATS"
fi

# 检查 young GC 频率
YOUNG_GC_COUNT=$(curl -s "${ES_HOST}/_nodes/stats/jvm" | jq '[.nodes[].jvm.gc.collectors.young.collection_count] | add')
sleep 60
YOUNG_GC_COUNT_NEW=$(curl -s "${ES_HOST}/_nodes/stats/jvm" | jq '[.nodes[].jvm.gc.collectors.young.collection_count] | add')

GC_DIFF=$((YOUNG_GC_COUNT_NEW - YOUNG_GC_COUNT))
if [ "$GC_DIFF" -gt "$ALERT_GC_THRESHOLD" ]; then
  echo "ALERT: Young GC 过于频繁: ${GC_DIFF} 次/分钟"
fi
```

### 2. 集群脑裂
```bash
# 查看集群 Master
curl -s "localhost:9200/_cat/master?v"

# 查看节点发现的 Master
curl -s "localhost:9200/_nodes?filter_path=nodes.*.master" | grep master

# 修复：确保 discovery.seed_hosts 配置正确
# elasticsearch.yml
discovery.seed_hosts: ["node1:9300", "node2:9300", "node3:9300"]
cluster.initial_master_nodes: ["node1", "node2", "node3"]

# 重启非 Master 节点
# 最后重启有问题的 Master 节点
```

### 3. 写入性能问题
```bash
# 检查索引刷新频率
curl -s "localhost:9200/_all/_settings/index.refresh_interval?pretty"

# 临时降低刷新频率（批量写入时）
curl -X PUT "localhost:9200/my_index/_settings" -H 'Content-Type: application/json' -d'
{
  "index.refresh_interval": "-1"
}'

# 增加副本数（写入完成后）
curl -X PUT "localhost:9200/my_index/_settings" -H 'Content-Type: application/json' -d'
{
  "index.number_of_replicas": 1
}'

# 检查 Merge 状态
curl -s "localhost:9200/_cat/thread_pool/force_merge?v"
```

### 4. 查询性能问题
```bash
# 查看慢查询
curl -s "localhost:9200/_all/_settings/index.search.slowlog?pretty"

# 启用慢查询日志
curl -X PUT "localhost:9200/my_index/_settings" -H 'Content-Type: application/json' -d'
{
  "index.search.slowlog.threshold.query.warn": "10s",
  "index.search.slowlog.threshold.query.info": "5s",
  "index.search.slowlog.threshold.fetch.warn": "1s"
}'

# 查看热点线程
curl -s "localhost:9200/_nodes/hot_threads?threads=10"

# 分析查询
curl -X POST "localhost:9200/my_index/_validate/query?explain=true&pretty" -H 'Content-Type: application/json' -d'
{
  "query": {
    "match_all": {}
  }
}'
```

### 5. 节点离线/掉线

**症状**：集群中某个节点突然离线，分片开始重新分配

**诊断流程**：
```bash
# 1. 查看节点列表
curl -s "localhost:9200/_cat/nodes?v"

# 2. 查看集群健康状态
curl -s "localhost:9200/_cluster/health?pretty" | grep -E "status|unassigned_shards"

# 3. 检查离线节点日志
ssh node-ip "tail -n 100 /var/log/elasticsearch/elasticsearch.log"

# 4. 查看 JVM 垃圾回收情况
curl -s "localhost:9200/_nodes/stats/jvm?pretty" | grep -E "heap_used_percent|gc"
```

**常见原因及处理**：

1. **OOM（内存溢出）**：
```bash
# 检查日志中的 OOM 错误
ssh node-ip "grep 'OutOfMemoryError' /var/log/elasticsearch/elasticsearch.log"

# 临时降低堆内存使用（如果还能连接）
curl -X POST "localhost:9200/_cache/clear"

# 重启节点并增加内存（修改 jvm.options）
-Xms24g
-Xmx24g
```

2. **磁盘空间不足**：
```bash
# 检查磁盘空间
ssh node-ip "df -h"

# 清理旧日志
ssh node-ip "find /var/log/elasticsearch -name '*.log.gz' -mtime +7 -delete"

# 删除旧索引（谨慎操作）
curl -X DELETE "localhost:9200/old-index-*"
```

3. **网络分区**：
```bash
# 检查节点间连通性
ssh node-ip "curl -s http://other-node:9200/_cluster/health"

# 修复网络后重启节点
systemctl restart elasticsearch
```

### 6. 写入拒绝/队列满

**症状**：写入操作被拒绝，错误日志显示 "rejected execution"

**诊断流程**：
```bash
# 1. 查看线程池状态
curl -s "localhost:9200/_cat/thread_pool/write?v"
curl -s "localhost:9200/_cat/thread_pool/index?v"

# 2. 查看写入队列
curl -s "localhost:9200/_nodes/stats/thread_pool?pretty" | grep -A5 "write"

# 3. 查看索引速率
curl -s "localhost:9200/_nodes/stats/indices/indexing?pretty" | grep -E "index_total|index_time_in_millis"
```

**处理方案**：

1. **增加队列大小**（临时）：
```bash
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "transient": {
    "thread_pool.write.queue_size": 1000,
    "thread_pool.index.queue_size": 1000
  }
}'
```

2. **优化批量写入**：
```bash
# 增加批量大小（应用端调整）
# 减少刷新频率
curl -X PUT "localhost:9200/my_index/_settings" -H 'Content-Type: application/json' -d'
{
  "index.refresh_interval": "30s"
}'
```

3. **扩容节点**：
```bash
# 添加新数据节点
# 修改 cluster 配置，增加 node 角色为 data 的新节点
```

### 7. 磁盘水位线触发

**症状**：索引变为只读，无法写入新数据

**诊断流程**：
```bash
# 1. 查看磁盘使用情况
curl -s "localhost:9200/_cat/allocation?v"

# 2. 查看只读索引
curl -s "localhost:9200/_cat/indices?v&health=red" | grep -i "read_only"

# 3. 查看集群设置
curl -s "localhost:9200/_cluster/settings?pretty" | grep -A10 "disk.watermark"
```

**处理方案**：

1. **紧急释放空间**：
```bash
# 删除旧索引
curl -X DELETE "localhost:9200/logstash-$(date -d '7 days ago' +%Y.%m.%d)"

# 强制合并段（减少存储）
curl -X POST "localhost:9200/my_index/_forcemerge?max_num_segments=1"
```

2. **调整水位线**（临时）：
```bash
curl -X PUT "localhost:9200/_cluster/settings" -H 'Content-Type: application/json' -d'
{
  "transient": {
    "cluster.routing.allocation.disk.watermark.low": "90%",
    "cluster.routing.allocation.disk.watermark.high": "95%",
    "cluster.routing.allocation.disk.watermark.flood_stage": "97%"
  }
}'

# 解除只读锁定
curl -X PUT "localhost:9200/*/_settings" -H 'Content-Type: application/json' -d'
{
  "index.blocks.read_only_allow_delete": null
}'
```

3. **扩容存储**：
```bash
# 添加新数据节点
# 或扩展现有节点磁盘
```

## 性能优化配置

### JVM 配置 (jvm.options)
```bash
# 堆内存设置（不超过 32GB）
-Xms16g
-Xmx16g

# G1GC 配置
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200

# GC 日志
-Xlog:gc*:file=/var/log/elasticsearch/gc.log:time,uptime:filecount=32,filesize=64m
```

### 集群配置 (elasticsearch.yml)
```yaml
# 集群名称
cluster.name: my-cluster

# 节点角色
node.roles: [master, data, ingest]

# 网络配置
network.host: 0.0.0.0
http.port: 9200
transport.port: 9300

# 发现配置
discovery.seed_hosts: ["node1", "node2", "node3"]
cluster.initial_master_nodes: ["node1", "node2", "node3"]

# 防止脑裂
discovery.zen.minimum_master_nodes: 2  # 7.x 之前版本

# 磁盘水位线
cluster.routing.allocation.disk.watermark.low: "85%"
cluster.routing.allocation.disk.watermark.high: "90%"
cluster.routing.allocation.disk.watermark.flood_stage: "95%"

# 恢复设置
cluster.routing.allocation.node_concurrent_recoveries: 2
cluster.routing.allocation.node_initial_primaries_recoveries: 4
```

## 索引生命周期管理 (ILM)

```bash
# 创建 ILM 策略
curl -X PUT "localhost:9200/_ilm/policy/logs_policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "min_age": "0ms",
        "actions": {
          "rollover": {
            "max_age": "1d",
            "max_size": "50gb",
            "max_docs": 100000000
          }
        }
      },
      "warm": {
        "min_age": "7d",
        "actions": {
          "shrink": {
            "number_of_shards": 1
          },
          "forcemerge": {
            "max_num_segments": 1
          }
        }
      },
      "cold": {
        "min_age": "30d",
        "actions": {
          "allocate": {
            "require": {
              "box_type": "cold"
            }
          }
        }
      },
      "delete": {
        "min_age": "90d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}'
```

## 数据备份与恢复

```bash
# 创建快照仓库
curl -X PUT "localhost:9200/_snapshot/my_backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backup/elasticsearch",
    "compress": true
  }
}'

# 创建快照
curl -X PUT "localhost:9200/_snapshot/my_backup/snapshot_1?wait_for_completion=true" -H 'Content-Type: application/json' -d'
{
  "indices": "index_1,index_2",
  "ignore_unavailable": true,
  "include_global_state": false
}'

# 恢复快照
curl -X POST "localhost:9200/_snapshot/my_backup/snapshot_1/_restore" -H 'Content-Type: application/json' -d'
{
  "indices": "index_1",
  "rename_pattern": "index_(.+)",
  "rename_replacement": "restored_index_$1"
}'
```

## 监控指标

```bash
# 关键集群指标
curl -s "localhost:9200/_cluster/stats?pretty" | grep -E "status|nodes|indices|docs"

# 节点指标
curl -s "localhost:9200/_nodes/stats?pretty" | grep -E "os|process|jvm|fs"

# 索引指标
curl -s "localhost:9200/_cat/indices?v&h=index,health,docs.count,store.size,pri.store.size"

# 线程池
curl -s "localhost:9200/_cat/thread_pool?v&h=node_name,name,active,queue,rejected"

# 重要监控项：
# - 集群状态: red/yellow/green
# - 未分配分片数
# - JVM 堆使用率
# - 磁盘使用率
# - 节点离线数
# - 查询/写入延迟
# - 拒绝任务数
```

## 生产环境最佳实践

### 1. 部署架构建议

**小型集群（<100GB 数据）**：
- 3 节点（所有节点为 master + data）
- 副本数：1
- 分片数：3-5 个主分片

**中型集群（100GB-1TB 数据）**：
- 3 专用 Master 节点
- 3-6 数据节点
- 副本数：1-2
- 使用专用协调节点（可选）

**大型集群（>1TB 数据）**：
- 3 专用 Master 节点
- 10+ 数据节点
- 冷热分离架构
- 专用协调节点和摄取节点

### 2. 完整配置模板

```yaml
# elasticsearch.yml 生产配置

# 集群配置
cluster.name: production-cluster
node.name: ${HOSTNAME}

# 节点角色
node.roles: [master, data, ingest]
# Master 专用节点：node.roles: [master]
# Data 专用节点：node.roles: [data]
# 协调节点：node.roles: []

# 网络配置
network.host: [_local_, _site_]
http.port: 9200
transport.port: 9300

# 发现配置
discovery.seed_hosts:
  - master1:9300
  - master2:9300
  - master3:9300
cluster.initial_master_nodes:
  - master1
  - master2
  - master3

# 防止脑裂（7.x 之前版本）
discovery.zen.minimum_master_nodes: 2

# 网关配置
gateway.expected_master_nodes: 3
gateway.expected_data_nodes: 3
gateway.recover_after_nodes: 5
gateway.recover_after_time: 5m

# 磁盘水位线
cluster.routing.allocation.disk.watermark.low: "85%"
cluster.routing.allocation.disk.watermark.high: "90%"
cluster.routing.allocation.disk.watermark.flood_stage: "95%"

# 恢复和再平衡
cluster.routing.allocation.node_concurrent_recoveries: 2
cluster.routing.allocation.node_initial_primaries_recoveries: 4
cluster.routing.allocation.cluster_concurrent_rebalance: 2
cluster.routing.rebalance.enable: "all"

# 索引配置
indices.memory.index_buffer_size: "10%"
indices.query.bool.max_clause_count: 1024

# 缓存配置
indices.fielddata.cache.size: "30%"
indices.breaker.fielddata.limit: "60%"
indices.breaker.request.limit: "40%"
indices.breaker.total.limit: "70%"

# 搜索配置
search.max_buckets: 10000

# HTTP 配置
http.max_content_length: 500mb
http.max_initial_line_length: 8kb
http.max_header_size: 16kb

# 安全配置（启用 X-Pack 时）
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
xpack.security.transport.ssl.verification_mode: certificate
xpack.security.transport.ssl.keystore.path: elastic-certificates.p12
xpack.security.transport.ssl.truststore.path: elastic-certificates.p12
```

```bash
# jvm.options 生产配置

# 堆内存设置（不超过 32GB，建议 50% 系统内存）
-Xms31g
-Xmx31g

# G1GC 配置（推荐）
-XX:+UseG1GC
-XX:MaxGCPauseMillis=200
-XX:G1HeapRegionSize=16m

# GC 日志（Java 9+）
-Xlog:gc*:file=/var/log/elasticsearch/gc.log:time,uptime:filecount=32,filesize=64m

# 性能优化
-XX:+AlwaysPreTouch
-XX:+DisableExplicitGC

# OOM 时生成堆转储
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/lib/elasticsearch

# 错误日志
-XX:ErrorFile=/var/log/elasticsearch/hs_err_pid%p.log
```

### 3. 索引模板最佳实践

```bash
# 创建索引模板
curl -X PUT "localhost:9200/_index_template/logs_template" -H 'Content-Type: application/json' -d'
{
  "index_patterns": ["logs-*"],
  "template": {
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1,
      "refresh_interval": "5s",
      "index.lifecycle.name": "logs_policy",
      "index.lifecycle.rollover_alias": "logs",
      "index.mapping.total_fields.limit": 1000,
      "index.mapping.depth.limit": 20,
      "index.max_docvalue_fields_search": 200
    },
    "mappings": {
      "dynamic_templates": [
        {
          "strings_as_keywords": {
            "match_mapping_type": "string",
            "mapping": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        }
      ],
      "properties": {
        "@timestamp": {
          "type": "date"
        },
        "message": {
          "type": "text",
          "norms": false
        },
        "level": {
          "type": "keyword"
        },
        "service": {
          "type": "keyword"
        }
      }
    },
    "aliases": {
      "logs": {
        "is_write_index": true
      }
    }
  },
  "priority": 500
}'
```

### 4. 监控脚本

```bash
#!/bin/bash
# es_health_check.sh

ES_HOST="localhost:9200"
ALERT_WEBHOOK="https://hooks.slack.com/services/xxx"

# 检查集群健康
HEALTH=$(curl -s "${ES_HOST}/_cluster/health" | jq -r '.status')
if [ "$HEALTH" == "red" ]; then
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 ES 集群状态 RED"}' \
    $ALERT_WEBHOOK
elif [ "$HEALTH" == "yellow" ]; then
  echo "WARNING: 集群状态 YELLOW"
fi

# 检查 JVM 堆使用
HEAP_USAGE=$(curl -s "${ES_HOST}/_nodes/stats/jvm" | jq '.nodes[].jvm.mem.heap_used_percent' | sort -rn | head -1)
if [ "$HEAP_USAGE" -gt 85 ]; then
  echo "ALERT: JVM 堆使用 ${HEAP_USAGE}%"
fi

# 检查磁盘使用
DISK_USAGE=$(curl -s "${ES_HOST}/_cat/allocation?h=disk.percent" | sort -rn | head -1)
if [ "$DISK_USAGE" -gt 85 ]; then
  echo "ALERT: 磁盘使用 ${DISK_USAGE}%"
fi

# 检查未分配分片
UNASSIGNED=$(curl -s "${ES_HOST}/_cluster/health" | jq '.unassigned_shards')
if [ "$UNASSIGNED" -gt 0 ]; then
  echo "WARNING: ${UNASSIGNED} 个未分配分片"
fi

# 检查拒绝任务
REJECTED=$(curl -s "${ES_HOST}/_cat/thread_pool/write?v&h=node_name,name,queue,rejected" | grep -v "node_name" | awk '{sum+=$3} END {print sum}')
if [ "$REJECTED" -gt 100 ]; then
  echo "ALERT: 写入拒绝任务 ${REJECTED}"
fi

echo "检查完成: $(date)"
```

### 5. 备份策略

```bash
#!/bin/bash
# es_backup.sh

ES_HOST="localhost:9200"
REPO_NAME="daily_backup"
SNAPSHOT_NAME="snapshot_$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=7

# 创建快照
curl -X PUT "${ES_HOST}/_snapshot/${REPO_NAME}/${SNAPSHOT_NAME}?wait_for_completion=true" -H 'Content-Type: application/json' -d"
{
  \"indices\": \"*\",
  \"ignore_unavailable\": true,
  \"include_global_state\": false,
  \"metadata\": {
    \"taken_by\": \"backup_script\",
    \"taken_at\": \"$(date -Iseconds)\"
  }
}"

# 清理旧快照（保留最近 N 天）
SNAPSHOTS=$(curl -s "${ES_HOST}/_snapshot/${REPO_NAME}/_all" | jq -r '.snapshots[].snapshot' | sort -r | tail -n +$((RETENTION_DAYS + 1)))

for SNAPSHOT in $SNAPSHOTS; do
  echo "删除旧快照: $SNAPSHOT"
  curl -X DELETE "${ES_HOST}/_snapshot/${REPO_NAME}/${SNAPSHOT}"
done

echo "备份完成: $SNAPSHOT_NAME"
```

### 6. 常用维护命令

```bash
# 清空所有缓存
curl -X POST "localhost:9200/_cache/clear"

# 强制合并索引段
curl -X POST "localhost:9200/my_index/_forcemerge?max_num_segments=1"

# 刷新索引
curl -X POST "localhost:9200/my_index/_refresh"

# 刷新索引统计
curl -X POST "localhost:9200/my_index/_stats/refresh"

# 关闭索引（减少内存使用）
curl -X POST "localhost:9200/my_index/_close"

# 打开索引
curl -X POST "localhost:9200/my_index/_open"

# 克隆索引
curl -X POST "localhost:9200/my_index/_clone/my_index_clone"

# 重新索引
curl -X POST "localhost:9200/_reindex" -H 'Content-Type: application/json' -d'
{
  "source": {
    "index": "old_index"
  },
  "dest": {
    "index": "new_index"
  }
}'
```

## 参考资料

### 官方文档
- [Elasticsearch 官方文档](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Elasticsearch 性能调优](https://www.elastic.co/guide/en/elasticsearch/reference/current/tune-for-search-speed.html)
- [Elasticsearch 集群管理](https://www.elastic.co/guide/en/elasticsearch/reference/current/cluster.html)

### 社区资源
- [Elastic 博客](https://www.elastic.co/blog/)
- [Elasticsearch 最佳实践](https://www.elastic.co/guide/en/elasticsearch/reference/current/general-recommendations.html)
- [Elasticsearch 故障排查](https://www.elastic.co/guide/en/elasticsearch/reference/current/troubleshooting.html)

### 工具推荐
- **Kibana**: 可视化和监控
- **Cerebro**: Elasticsearch Web 管理工具
- **ElasticHQ**: 集群监控和管理
- **Curator**: 索引生命周期管理工具

## MCP 工具支持

本 Skill 可通过 MCP (Model Context Protocol) 提供以下工具：

### 工具列表

| 工具名称 | 描述 | 必需参数 |
|---------|------|---------|
| `es_check_cluster_health` | 检查集群健康状态 | host, port |
| `es_get_nodes_status` | 获取节点状态列表 | host, port |
| `es_get_indices_status` | 获取索引状态 | host, port |
| `es_get_unassigned_shards` | 查看未分配分片 | host, port |
| `es_check_allocation` | 检查分片分配解释 | host, port, index, shard |

### 工具定义示例

```json
{
  "name": "es_check_cluster_health",
  "description": "检查 Elasticsearch 集群健康状态",
  "inputSchema": {
    "type": "object",
    "properties": {
      "host": { "type": "string", "default": "localhost" },
      "port": { "type": "integer", "default": 9200 },
      "username": { "type": "string" },
      "password": { "type": "string" }
    }
  }
}
```

```json
{
  "name": "es_get_nodes_status",
  "description": "获取 Elasticsearch 节点状态和统计信息",
  "inputSchema": {
    "type": "object",
    "properties": {
      "host": { "type": "string", "default": "localhost" },
      "port": { "type": "integer", "default": 9200 },
      "username": { "type": "string" },
      "password": { "type": "string" }
    }
  }
}
```

```json
{
  "name": "es_get_indices_status",
  "description": "获取索引列表和健康状态",
  "inputSchema": {
    "type": "object",
    "properties": {
      "host": { "type": "string", "default": "localhost" },
      "port": { "type": "integer", "default": 9200 },
      "health": { "type": "string", "enum": ["red", "yellow", "green"], "description": "按健康状态过滤" },
      "username": { "type": "string" },
      "password": { "type": "string" }
    }
  }
}
```

```json
{
  "name": "es_get_unassigned_shards",
  "description": "查看未分配分片及其原因",
  "inputSchema": {
    "type": "object",
    "properties": {
      "host": { "type": "string", "default": "localhost" },
      "port": { "type": "integer", "default": 9200 },
      "username": { "type": "string" },
      "password": { "type": "string" }
    }
  }
}
```

```json
{
  "name": "es_check_allocation",
  "description": "检查特定分片的分配解释",
  "inputSchema": {
    "type": "object",
    "properties": {
      "host": { "type": "string", "default": "localhost" },
      "port": { "type": "integer", "default": 9200 },
      "index": { "type": "string", "description": "索引名称" },
      "shard": { "type": "integer", "description": "分片编号" },
      "primary": { "type": "boolean", "default": true },
      "username": { "type": "string" },
      "password": { "type": "string" }
    },
    "required": ["index", "shard"]
  }
}
```

### Python MCP Server 示例

```python
from mcp.server import Server
from mcp.types import TextContent
import subprocess
import json

app = Server("elasticsearch-ops")

def build_curl_cmd(host, port, username, password, endpoint, method="GET", data=None):
    auth = f"-u {username}:{password}" if username and password else ""
    if data:
        return f"curl -s -X {method} {auth} -H 'Content-Type: application/json' 'http://{host}:{port}{endpoint}' -d '{json.dumps(data)}'"
    return f"curl -s -X {method} {auth} 'http://{host}:{port}{endpoint}'"

@app.call_tool()
def call_tool(name: str, arguments: dict):
    host = arguments.get("host", "localhost")
    port = arguments.get("port", 9200)
    username = arguments.get("username", "")
    password = arguments.get("password", "")

    if name == "es_check_cluster_health":
        cmd = build_curl_cmd(host, port, username, password, "/_cluster/health?pretty")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "es_get_nodes_status":
        cmd = build_curl_cmd(host, port, username, password, "/_cat/nodes?v")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "es_get_indices_status":
        health = arguments.get("health", "")
        health_filter = f"&health={health}" if health else ""
        cmd = build_curl_cmd(host, port, username, password, f"/_cat/indices?v{health_filter}")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

    elif name == "es_get_unassigned_shards":
        cmd = build_curl_cmd(host, port, username, password, "/_cat/shards?v&h=index,shard,prirep,state,unassigned.reason,unassigned.details")
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        unassigned = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        explain = build_curl_cmd(host, port, username, password, "/_cluster/allocation/explain?pretty")
        explain_result = subprocess.run(explain, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=unassigned.stdout + "\n\n=== 分配解释 ===\n" + explain_result.stdout)]

    elif name == "es_check_allocation":
        index = arguments.get("index")
        shard = arguments.get("shard")
        primary = arguments.get("primary", True)
        data = {"index": index, "shard": shard, "primary": primary}
        cmd = build_curl_cmd(host, port, username, password, "/_cluster/allocation/explain?pretty", "POST", data)
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return [TextContent(type="text", text=result.stdout)]

if __name__ == "__main__":
    app.run()
```

## 输出规范

```
🔍 Elasticsearch 诊断报告

📊 集群信息
- 集群名称：[cluster_name]
- 状态：[status] (red/yellow/green)
- 节点数：[number_of_nodes]
- 活跃分片：[active_shards]
- 未分配分片：[unassigned_shards]

💾 资源使用
- JVM 堆使用：[heap_used_percent]%
- 磁盘使用：[disk.used_percent]%
- CPU 使用：[cpu.percent]%

🔍 问题发现
1. [问题描述]

💡 根因分析
[详细分析]

🛠️ 解决方案
[处理步骤]

📋 优化建议
- [建议1]
- [建议2]
```
