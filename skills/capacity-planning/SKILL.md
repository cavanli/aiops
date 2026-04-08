---
name: "CapacityPlanning"
emoji: "📊"
description: "容量规划专家 - 资源预测、负载测试、扩展决策、季节性容量管理"
os: [linux, darwin, windows]
requires:
  bins: [kubectl]
version: "1.0.0"
author: "OpenOcta"
category: "planning"
tags: [capacity-planning, resource-planning, scaling, forecasting]
---

## 配置说明

### 环境变量配置
```bash
# 监控数据源
export PROMETHEUS_URL="http://prometheus:9090"
export DATADOG_API_KEY=""
export DATADOG_APP_KEY=""

# 容量阈值
export CPU_THRESHOLD="70"
export MEMORY_THRESHOLD="80"
export DISK_THRESHOLD="85"
```

### 配置文件示例
```yaml
# capacity-config.yaml
forecasting:
  horizon_days: 90
  models:
    - linear_regression
    - seasonal_arima

thresholds:
  cpu:
    warning: 70
    critical: 85
  memory:
    warning: 80
    critical: 90
  storage:
    warning: 75
    critical: 85

scaling:
  headroom_percent: 20
  max_nodes: 100
  min_nodes: 3
```

## 输入参数

| 参数名 | 类型 | 必填 | 描述 | 示例 |
|--------|------|------|------|------|
| `service_name` | string | 是 | 服务名称 | `order-service` |
| `forecast_days` | number | 否 | 预测天数 | `90` |
| `resource_type` | string | 否 | 资源类型 | `cpu`, `memory`, `storage` |
| `historical_days` | number | 否 | 历史数据天数 | `30` |

## 输出格式

### 容量预测输出
```json
{
  "status": "success",
  "data": {
    "service": "order-service",
    "forecast_period": "90 days",
    "current_usage": {
      "cpu": "45%",
      "memory": "60%",
      "storage": "55%"
    },
    "predictions": [
      {
        "date": "2024-04-15",
        "cpu": "65%",
        "memory": "75%",
        "recommendation": "scale_up"
      }
    ],
    "recommendations": {
      "immediate": [],
      "30_days": ["增加 2 个节点"],
      "90_days": ["考虑存储扩容"]
    }
  }
}
```

# 容量规划运维助手

你是容量规划专家，擅长预测系统资源需求、制定扩展策略，确保系统能够应对当前和未来的负载。

## 概述

容量规划是确保系统能够满足当前和未来需求的关键 SRE 实践。Google SRE 强调：**容量规划既是科学也是艺术**，需要数据驱动的预测与灵活的策略相结合。

## 资源需求预测

### 容量规划核心原则

#### Google SRE 容量规划原则

1. **N+2 配置**：系统应能同时承受计划内和计划外的最大规模故障而不影响用户体验
2. **验证需求预测**：持续将预测与实际对比，直到预测稳定准确
3. **基于负载测试**：通过实际负载测试而非假设来确定容量
4. **区分首日负载与稳态**：发布时的负载通常与长期负载不同

### 需求预测方法

#### 1. 趋势分析预测

```python
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression

def forecast_capacity(historical_data, forecast_periods=90):
    """
    基于历史趋势预测容量需求
    """
    # 准备数据
    df = historical_data.copy()
    df['days'] = (df['date'] - df['date'].min()).dt.days

    # 线性回归预测
    X = df['days'].values.reshape(-1, 1)
    y = df['resource_usage'].values

    model = LinearRegression()
    model.fit(X, y)

    # 预测未来
    future_days = np.arange(
        df['days'].max() + 1,
        df['days'].max() + forecast_periods + 1
    ).reshape(-1, 1)

    forecast = model.predict(future_days)

    # 添加置信区间
    confidence_interval = calculate_confidence_interval(model, X, y, future_days)

    return {
        'forecast': forecast,
        'upper_bound': forecast + confidence_interval,
        'lower_bound': forecast - confidence_interval,
        'growth_rate': model.coef_[0]
    }
```

#### 2. 季节性预测

```python
def seasonal_forecast(historical_data, season_length=7):
    """
    考虑季节性因素的容量预测
    """
    # 计算季节性因子
    seasonal_factors = historical_data.groupby(
        historical_data['date'].dt.dayofweek
    )['resource_usage'].mean()

    # 去季节化
    deseasonalized = historical_data.copy()
    deseasonalized['adjusted'] = deseasonalized.apply(
        lambda row: row['resource_usage'] / seasonal_factors[row['date'].dayofweek],
        axis=1
    )

    # 趋势预测
    trend_forecast = forecast_capacity(deseasonalized)

    # 重新应用季节性
    future_dates = pd.date_range(
        start=historical_data['date'].max() + pd.Timedelta(days=1),
        periods=90
    )

    seasonal_forecast = []
    for i, date in enumerate(future_dates):
        factor = seasonal_factors[date.dayofweek]
        value = trend_forecast['forecast'][i] * factor
        seasonal_forecast.append(value)

    return seasonal_forecast
```

#### 3. 事件驱动预测

```yaml
# 事件驱动容量规划
events:
  black_friday:
    date: "2024-11-29"
    expected_traffic_multiplier: 5.0
    preparation_weeks: 4

  product_launch:
    date: "2024-06-15"
    expected_traffic_multiplier: 3.0
    preparation_weeks: 2

  marketing_campaign:
    date: "2024-03-01"
    expected_traffic_multiplier: 2.5
    preparation_weeks: 1

# 容量缓冲策略
buffer_strategy:
  normal_operations: 1.3  # 30% 缓冲
  peak_events: 2.0        # 100% 缓冲
  critical_systems: 1.5   # 50% 缓冲
```

### 容量规划文档模板

```markdown
# [服务名] 容量规划文档

## 服务信息
- 服务名称: [名称]
- 服务类型: [计算/存储/网络]
- 当前版本: [版本]
- 负责团队: [团队]

## 当前容量基线

### 资源使用 (过去 30 天平均)
| 资源类型 | 当前使用 | 容量上限 | 使用率 | 建议阈值 |
|----------|----------|----------|--------|----------|
| CPU | 40 cores | 100 cores | 40% | 70% |
| 内存 | 160 GB | 400 GB | 40% | 80% |
| 磁盘 | 2 TB | 5 TB | 40% | 85% |
| 网络 | 2 Gbps | 10 Gbps | 20% | 70% |

### 性能基线
| 指标 | P50 | P95 | P99 | 目标 |
|------|-----|-----|-----|------|
| 响应时间 | 50ms | 100ms | 200ms | < 200ms |
| 吞吐量 | 1000 RPS | 1500 RPS | 1800 RPS | > 1000 RPS |
| 错误率 | 0.01% | 0.05% | 0.1% | < 0.1% |

## 需求预测

### 增长预测
| 时间范围 | 预计增长 | 所需容量 | 行动项 |
|----------|----------|----------|--------|
| 3 个月 | 20% | 120 cores | 扩容准备 |
| 6 个月 | 50% | 150 cores | 架构评估 |
| 12 个月 | 100% | 200 cores | 长期规划 |

### 季节性考虑
- [ ] 工作日 vs 周末流量差异
- [ ] 月度/季度业务周期
- [ ] 年度促销活动
- [ ] 节假日影响

## 容量决策

### 扩展策略
- [ ] 水平扩展
- [ ] 垂直扩展
- [ ] 混合策略

### 时间计划
| 里程碑 | 日期 | 容量变化 | 负责人 |
|--------|------|----------|--------|
| 阶段 1 | YYYY-MM | +20% | [姓名] |
| 阶段 2 | YYYY-MM | +30% | [姓名] |

## 风险评估

### 容量风险
| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| 增长超预期 | 中 | 高 | 预留 50% 缓冲 |
| 供应链延迟 | 低 | 中 | 提前 2 个月采购 |

## 审查计划
- 下次审查日期: YYYY-MM-DD
- 审查频率: 每月
```

## 负载测试方法

### 负载测试类型

| 测试类型 | 目的 | 方法 | 工具 |
|----------|------|------|------|
| **负载测试** | 验证系统在预期负载下的表现 | 逐步增加负载到目标水平 | k6, JMeter, Locust |
| **压力测试** | 找到系统极限 | 持续增加负载直到故障 | k6, Gatling |
| ** soak 测试** | 验证长期稳定性 | 保持高负载数小时/天 | k6, custom scripts |
| **峰值测试** | 验证突发流量处理 | 突然增加大量负载 | k6, Loader.io |
| **容量测试** | 确定最大容量 | 找到性能拐点 | k6, custom tools |

### 负载测试实施

#### k6 测试脚本示例

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// 自定义指标
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// 测试配置
export const options = {
  stages: [
    { duration: '5m', target: 100 },   // 预热阶段
    { duration: '10m', target: 100 },  // 稳定负载
    { duration: '5m', target: 200 },   // 增加负载
    { duration: '10m', target: 200 },  // 峰值负载
    { duration: '5m', target: 100 },   // 降低负载
    { duration: '10m', target: 100 },  // 恢复验证
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% 请求 < 500ms
    errors: ['rate<0.1'],              // 错误率 < 10%
  },
};

// 测试场景
export default function () {
  const start = Date.now();

  // API 调用
  const response = http.get('https://api.example.com/endpoint');

  // 记录响应时间
  responseTime.add(Date.now() - start);

  // 验证响应
  const checkRes = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 记录错误率
  errorRate.add(!checkRes);

  sleep(1);
}
```

#### 分布式负载测试

```yaml
# k6-operator 配置
apiVersion: k6.io/v1alpha1
kind: K6
metadata:
  name: distributed-load-test
spec:
  parallelism: 10  # 10 个并发执行器
  script:
    configMap:
      name: load-test-script
      file: load-test.js
  arguments: --out influxdb=http://influxdb:8086/k6
  runner:
    resources:
      limits:
        cpu: "2"
        memory: "4Gi"
```

### 负载测试检查清单

#### 测试前

- [ ] 明确测试目标
- [ ] 确定测试场景
- [ ] 准备测试数据
- [ ] 配置监控和告警
- [ ] 通知相关团队
- [ ] 准备回滚方案
- [ ] 获得测试授权

#### 测试中

- [ ] 监控系统指标
- [ ] 记录关键数据点
- [ ] 观察错误模式
- [ ] 注意资源瓶颈
- [ ] 准备随时停止

#### 测试后

- [ ] 分析测试结果
- [ ] 识别性能瓶颈
- [ ] 计算容量上限
- [ ] 编写测试报告
- [ ] 制定优化计划

### 负载测试报告模板

```markdown
# 负载测试报告

## 测试概述
- 测试日期: YYYY-MM-DD
- 测试目标: [目标描述]
- 测试环境: [环境信息]
- 测试工具: [工具名称]

## 测试场景
| 场景 | 并发用户数 | 持续时间 | 目标 RPS |
|------|------------|----------|----------|
| 正常负载 | 100 | 30 分钟 | 1000 |
| 峰值负载 | 500 | 15 分钟 | 5000 |
| 压力测试 | 1000 | 10 分钟 | 10000 |

## 测试结果

### 性能指标
| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| 平均响应时间 | < 200ms | 180ms | ✅ 通过 |
| P95 响应时间 | < 500ms | 450ms | ✅ 通过 |
| 错误率 | < 1% | 0.5% | ✅ 通过 |
| 吞吐量 | > 1000 RPS | 1200 RPS | ✅ 通过 |

### 资源使用
| 资源 | 峰值使用率 | 瓶颈 | 建议 |
|------|------------|------|------|
| CPU | 85% | 是 | 增加 20% 容量 |
| 内存 | 70% | 否 | 当前充足 |
| 磁盘 I/O | 90% | 是 | 考虑 SSD 升级 |

## 结论与建议
1. [结论 1]
2. [结论 2]
3. [建议 1]
4. [建议 2]
```

## 垂直/水平扩展决策

### 扩展策略对比

| 维度 | 垂直扩展 (Scale Up) | 水平扩展 (Scale Out) |
|------|---------------------|----------------------|
| **定义** | 增加单个节点的资源 | 增加节点数量 |
| **上限** | 硬件限制 | 理论上无限制 |
| **复杂度** | 低 | 高 |
| **成本** | 非线性增长 | 线性增长 |
| **可用性** | 单点故障风险 | 更好的容错性 |
| **适用场景** | 单体应用、数据库 | 分布式系统、微服务 |

### 决策框架

```yaml
# 扩展决策树
decision_tree:
  question_1: "应用是否支持分布式架构？"

  if_no:
    decision: "垂直扩展"
    options:
      - "升级 CPU/内存"
      - "使用更高性能存储"
      - "优化应用代码"

  if_yes:
    question_2: "瓶颈是计算资源还是数据？"

    if_compute:
      decision: "水平扩展"
      implementation:
        - "增加应用实例"
        - "配置负载均衡"
        - "实现无状态设计"

    if_data:
      question_3: "数据是否可以分片？"

      if_yes:
        decision: "水平扩展 + 数据分片"
        implementation:
          - "实现数据分片策略"
          - "配置分片路由"
          - "处理跨分片查询"

      if_no:
        decision: "垂直扩展 + 读写分离"
        implementation:
          - "主从复制"
          - "读写分离"
          - "缓存优化"
```

### 自动扩缩容配置

#### Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: my-app-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 3
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 65
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 70
    - type: Pods
      pods:
        metric:
          name: http_requests_per_second
        target:
          type: AverageValue
          averageValue: "1000"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300  # 缩容冷却期 5 分钟
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Percent
          value: 100
          periodSeconds: 15
        - type: Pods
          value: 4
          periodSeconds: 15
      selectPolicy: Max
```

#### 集群自动扩缩容 (Cluster Autoscaler)

```yaml
# 集群自动扩缩容配置
apiVersion: autoscaling.x-k8s.io/v1beta1
kind: ClusterAutoscaler
metadata:
  name: default
spec:
  resourceLimits:
    maxNodesTotal: 100
    cores:
      min: 10
      max: 1000
    memory:
      min: 64
      max: 4096
  scaleDown:
    enabled: true
    delayAfterAdd: 10m
    delayAfterDelete: 5m
    delayAfterFailure: 30s
    unneededTime: 10m
```

### 扩展最佳实践

1. **提前扩展**
   - 在达到容量上限前扩展
   - 考虑扩展操作的时间延迟

2. **渐进式扩展**
   - 避免大规模一次性扩展
   - 小步快跑，验证后再继续

3. **成本优化**
   - 使用 spot/preemptible 实例
   - 实施自动缩容
   - 定期审查资源使用

4. **测试扩展能力**
   - 定期验证扩展机制
   - 测试最大扩展极限

## 季节性容量管理

### 季节性模式识别

```python
def analyze_seasonal_patterns(historical_data):
    """
    分析历史数据的季节性模式
    """
    patterns = {
        'daily': {},
        'weekly': {},
        'monthly': {},
        'yearly': {}
    }

    # 日模式
    patterns['daily'] = historical_data.groupby(
        historical_data['timestamp'].dt.hour
    )['traffic'].mean()

    # 周模式
    patterns['weekly'] = historical_data.groupby(
        historical_data['timestamp'].dt.dayofweek
    )['traffic'].mean()

    # 月模式
    patterns['monthly'] = historical_data.groupby(
        historical_data['timestamp'].dt.month
    )['traffic'].mean()

    # 特殊事件
    patterns['events'] = identify_special_events(historical_data)

    return patterns
```

### 季节性容量策略

#### 1. 预置容量 (Provisioned Capacity)

```yaml
# 年度容量计划
seasonal_capacity_plan:
  q1_normal:
    baseline_multiplier: 1.0
    preparation: "标准维护"

  q2_growth:
    baseline_multiplier: 1.2
    preparation: "提前扩容 20%"

  q3_peak:
    baseline_multiplier: 2.0
    preparation:
      - "提前 1 个月扩容"
      - "启用额外区域"
      - "增加缓存容量"

  q4_holiday:
    baseline_multiplier: 3.0
    preparation:
      - "提前 2 个月扩容"
      - "全区域部署"
      - "24/7 值班"
      - "冻结非紧急发布"
```

#### 2. 弹性容量 (Elastic Capacity)

```yaml
# 自动扩缩容策略
elastic_strategy:
  predictive_scaling:
    enabled: true
    forecast_horizon: "24h"
    ml_model: "aws-forecast"

  scheduled_scaling:
    daily_peak:
      cron: "0 9 * * *"
      min_replicas: 10
      max_replicas: 50
    daily_offpeak:
      cron: "0 23 * * *"
      min_replicas: 3
      max_replicas: 10

  event_based_scaling:
    flash_sale:
      trigger: "event:flash_sale_start"
      min_replicas: 20
      duration: "2h"
```

### 节假日容量管理

#### 大促准备清单

**提前 4 周：**
- [ ] 历史数据分析
- [ ] 容量需求预测
- [ ] 架构审查
- [ ] 性能优化

**提前 2 周：**
- [ ] 容量扩容实施
- [ ] 负载测试验证
- [ ] 监控增强
- [ ] 值班安排

**提前 1 周：**
- [ ] 发布冻结
- [ ] 应急预案演练
- [ ] 供应商沟通
- [ ] 团队培训

**活动期间：**
- [ ] 实时监控
- [ ] 快速响应
- [ ] 定期状态同步
- [ ] 记录关键指标

**活动后：**
- [ ] 容量回收
- [ ] 成本分析
- [ ] 经验总结
- [ ] 文档更新

## 实践检查清单

### 容量规划流程

- [ ] 收集历史使用数据
- [ ] 分析增长趋势
- [ ] 识别季节性模式
- [ ] 预测未来需求
- [ ] 计算所需容量
- [ ] 制定扩展计划
- [ ] 准备预算申请
- [ ] 实施容量变更
- [ ] 验证容量充足
- [ ] 定期审查更新

### 负载测试流程

- [ ] 定义测试目标
- [ ] 设计测试场景
- [ ] 准备测试环境
- [ ] 生成测试数据
- [ ] 配置监控
- [ ] 执行测试
- [ ] 分析结果
- [ ] 识别瓶颈
- [ ] 制定优化计划
- [ ] 重新测试验证

### 扩展决策检查

- [ ] 评估当前架构
- [ ] 识别扩展瓶颈
- [ ] 分析成本影响
- [ ] 考虑运维复杂度
- [ ] 评估风险
- [ ] 制定实施计划
- [ ] 准备回滚方案
- [ ] 测试扩展机制

## 真实案例参考

### 案例：黑色星期五容量规划

**背景**：电商平台黑色星期五大促

**挑战**：
- 预期流量增长 5 倍
- 不能有任何 downtime
- 成本控制要求

**策略**：
1. 提前 2 个月开始准备
2. 基于历史数据预测需求
3. 混合使用预留实例和按需实例
4. 实施多级缓存策略
5. 关键路径优化

**结果**：
- 成功应对 6 倍流量增长
- 零事故
- 成本控制在预算内

### 案例：从垂直扩展到水平扩展

**背景**：单体应用性能瓶颈

**问题**：
- 垂直扩展到硬件极限
- 单点故障风险
- 维护窗口影响大

**转型**：
1. 应用微服务化改造
2. 实现无状态设计
3. 数据分片
4. 引入服务网格

**收益**：
- 扩展能力从 10 倍提升到 100 倍
- 故障隔离
- 独立部署
- 成本降低 30%

## 常用命令

### 性能监控（容量数据采集）

```bash
# Linux - 系统资源监控
top -bn1 | grep "Cpu(s)"
free -m
df -h

# PowerShell - 系统资源监控
Get-Counter '\Processor(_Total)\% Processor Time' -SampleInterval 5 -MaxSamples 12
Get-Counter '\Memory\Available MBytes', '\Memory\% Committed Bytes In Use'
Get-Counter '\LogicalDisk(*)\% Free Space' | Select-Object -ExpandProperty CounterSamples | Where-Object { $_.CookedValue -lt 20 }

# PowerShell - 进程资源使用
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, Id, WorkingSet, CPU | Format-Table -AutoSize

# PowerShell - 网络吞吐量
Get-Counter '\Network Interface(*)\Bytes Total/sec' | Select-Object -ExpandProperty CounterSamples | Sort-Object CookedValue -Descending | Select-Object -First 5
```

### JSON数据处理（容量规划数据）

```bash
# Linux - 使用jq处理容量数据
cat capacity-data.json | jq '.resources[] | select(.usage_percent > 80)'

# PowerShell - 处理容量数据
$capacityData = Get-Content capacity-data.json | ConvertFrom-Json
$capacityData.resources | Where-Object { $_.usage_percent -gt 80 } | Select-Object name, usage_percent, threshold

# PowerShell - 容量预测计算
$historicalData = Get-Content historical-usage.json | ConvertFrom-Json
$growthRate = ($historicalData[-1].usage - $historicalData[0].usage) / $historicalData[0].usage
$predictedUsage = $historicalData[-1].usage * (1 + $growthRate)
Write-Output "Current Usage: $($historicalData[-1].usage)GB"
Write-Output "Predicted Usage (next period): $([math]::Round($predictedUsage, 2))GB"
Write-Output "Growth Rate: $([math]::Round($growthRate * 100, 2))%"

# PowerShell - 容量规划报告生成
$capacityReport = @()
$capacityReport += [PSCustomObject]@{
    Resource = "CPU"
    Current = "45%"
    Threshold = "70%"
    Status = "Healthy"
    Recommendation = "No action needed"
}
$capacityReport += [PSCustomObject]@{
    Resource = "Memory"
    Current = "82%"
    Threshold = "80%"
    Status = "Warning"
    Recommendation = "Scale up within 2 weeks"
}
$capacityReport | ConvertTo-Json | Out-File capacity-report.json
```

### 日志分析（负载模式分析）

```bash
# Linux - 分析访问日志
cat access.log | awk '{print $4}' | cut -d: -f2 | sort | uniq -c | sort -rn

# PowerShell - 分析访问日志
Get-Content access.log | ForEach-Object {
    $hour = ($_ -split " ")[3].Split(":")[1]
    $hour
} | Group-Object | Sort-Object Count -Descending | Select-Object Name, Count

# PowerShell - 计算峰值负载时间
$logs = Get-Content access.log
$hourlyStats = $logs | ForEach-Object {
    if ($_ -match "\[(\d{2})/\w+/\d{4}:(\d{2}):") {
        "$($matches[1]):$($matches[2])"
    }
} | Group-Object | Select-Object Name, Count | Sort-Object Count -Descending
$hourlyStats | Select-Object -First 5
```

### 文件操作（容量报告管理）

```bash
# Linux - 压缩历史数据
tar -czf capacity-history-$(date +%Y%m).tar.gz ./capacity-data/

# PowerShell - 压缩历史数据
$archiveName = "capacity-history-$(Get-Date -Format 'yyyyMM').zip"
Compress-Archive -Path ./capacity-data/* -DestinationPath $archiveName -Force

# PowerShell - 清理旧数据
Get-ChildItem ./capacity-data/ -Filter "*.json" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-90) } | Remove-Item -Force

# PowerShell - 生成容量趋势CSV
$trendData = @()
for ($i = 30; $i -ge 0; $i--) {
    $date = (Get-Date).AddDays(-$i).ToString("yyyy-MM-dd")
    $cpu = Get-Random -Minimum 40 -Maximum 80
    $memory = Get-Random -Minimum 50 -Maximum 90
    $trendData += [PSCustomObject]@{ Date = $date; CPU = "$cpu%"; Memory = "$memory%" }
}
$trendData | Export-Csv capacity-trend.csv -NoTypeInformation
```

### 日期时间处理（容量规划周期）

```bash
# Linux - 计算规划周期
date -d "+3 months" +%Y-%m-%d
date -d "+1 year" +%Y-%m-%d

# PowerShell - 容量规划周期
$planningHorizons = @{
    "ShortTerm" = (Get-Date).AddMonths(3).ToString("yyyy-MM")
    "MediumTerm" = (Get-Date).AddMonths(6).ToString("yyyy-MM")
    "LongTerm" = (Get-Date).AddYears(1).ToString("yyyy-MM")
}
$planningHorizons | ForEach-Object { "Planning Horizon: $($_.Key) -> $($_.Value)" }

# PowerShell - 季节性容量规划
$seasonalPeaks = @(
    [PSCustomObject]@{ Season = "Q1"; PeakDate = (Get-Date -Month 3 -Day 15).ToString("yyyy-MM-dd"); Multiplier = 1.2 }
    [PSCustomObject]@{ Season = "Q2"; PeakDate = (Get-Date -Month 6 -Day 15).ToString("yyyy-MM-dd"); Multiplier = 1.0 }
    [PSCustomObject]@{ Season = "Q3"; PeakDate = (Get-Date -Month 9 -Day 15).ToString("yyyy-MM-dd"); Multiplier = 1.5 }
    [PSCustomObject]@{ Season = "Q4"; PeakDate = (Get-Date -Month 12 -Day 15).ToString("yyyy-MM-dd"); Multiplier = 2.0 }
)
$seasonalPeaks | ConvertTo-Json | Out-File seasonal-capacity-plan.json
```

## 输出规范

```
📊 容量规划诊断报告

📈 容量现状
- 评估时间：[timestamp]
- 评估范围：[services/scope]
- 当前负载：[current_load]

💾 资源使用
| 资源类型 | 当前使用 | 容量阈值 | 状态 | 预计耗尽时间 |
|----------|----------|----------|------|--------------|
| CPU | [cpu]% | [threshold]% | [healthy/warning/critical] | [time] |
| Memory | [memory]% | [threshold]% | [healthy/warning/critical] | [time] |
| Disk | [disk]% | [threshold]% | [healthy/warning/critical] | [time] |
| Network | [network]Mbps | [threshold]Mbps | [healthy/warning/critical] | [time] |

📊 负载趋势
- 增长率：[growth_rate]%/月
- 预测峰值时间：[peak_time]
- 季节性因子：[seasonal_factor]

🔍 风险识别
1. [风险描述]
   - 影响：[impact]
   - 紧急程度：[urgency]
   - 建议行动：[action]

💡 扩展建议
- 短期（3个月）：[short_term_action]
- 中期（6个月）：[medium_term_action]
- 长期（1年）：[long_term_action]

💰 成本预估
| 方案 | 成本 | 收益 | ROI |
|------|------|------|-----|
| [方案1] | [cost] | [benefit] | [roi] |
| [方案2] | [cost] | [benefit] | [roi] |
```

## 参考资源

- [Google SRE Book - 处理过载](https://sre.google/sre-book/handling-overload/)
- [Google SRE Book - 解决级联故障](https://sre.google/sre-book/addressing-cascading-failures/)
- [Google SRE Workbook - 管理负载](https://sre.google/workbook/managing-load/)
- [k6 负载测试文档](https://k6.io/docs/)
- [Kubernetes Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
