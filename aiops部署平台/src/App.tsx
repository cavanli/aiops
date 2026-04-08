import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Cpu, 
  Wrench, 
  Zap, 
  GitBranch, 
  Bot, 
  Database, 
  Settings,
  Menu,
  X,
  Bell,
  Search,
  User,
  ChevronRight,
  Activity,
  Server,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// Placeholder Pages
const Dashboard = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-slate-900">基础设施概览</h1>
      <div className="flex gap-2">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
          <Server size={18} /> 新建部署
        </button>
      </div>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: '活跃服务器', value: '124', icon: Server, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: '运行中智能体', value: '12', icon: Bot, color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: '部署成功率', value: '99.2%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: '系统负载', value: '24%', icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' },
      ].map((stat, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={cn("p-2 rounded-lg", stat.bg)}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <span className="text-xs font-medium text-slate-400">过去 24 小时</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
          <p className="text-sm text-slate-500">{stat.label}</p>
        </motion.div>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Terminal size={18} className="text-indigo-600" /> 最近动态
        </h3>
        <div className="space-y-4">
          {[
            { event: 'K8s 集群部署', status: '进行中', time: '2 分钟前', user: '管理员' },
            { event: 'Nginx 技能已更新', status: '成功', time: '15 分钟前', user: '系统' },
            { event: 'MCP 服务: Postgres 已启动', status: '成功', time: '1 小时前', user: '运维开发' },
            { event: '安全补丁应用失败', status: '失败', time: '3 小时前', user: '智能体-01' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  item.status === '成功' ? 'bg-emerald-500' : item.status === '进行中' ? 'bg-blue-500' : 'bg-red-500'
                )} />
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.event}</p>
                  <p className="text-xs text-slate-500">{item.user} • {item.time}</p>
                </div>
              </div>
              <span className={cn(
                "text-xs px-2 py-1 rounded-full font-medium",
                item.status === '成功' ? 'bg-emerald-50 text-emerald-700' : item.status === '进行中' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
              )}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Cpu size={18} className="text-indigo-600" /> 模型使用分布
        </h3>
        <div className="space-y-6">
          {[
            { name: 'DeepSeek-V3', usage: 75, color: 'bg-indigo-500' },
            { name: 'GPT-4o', usage: 45, color: 'bg-blue-500' },
            { name: 'Claude 3.5 Sonnet', usage: 30, color: 'bg-purple-500' },
            { name: 'Ollama (本地)', usage: 15, color: 'bg-slate-500' },
          ].map((model, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-700">{model.name}</span>
                <span className="text-slate-500">{model.usage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${model.usage}%` }}
                  className={cn("h-full rounded-full", model.color)}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ModelSquare = () => (
  <div className="p-6">
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold text-slate-900">模型广场</h1>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
        添加自定义模型
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: 'DeepSeek-V3', provider: 'DeepSeek', type: '国内', status: '活跃', latency: '120ms' },
        { name: 'GPT-4o', provider: 'OpenAI', type: '国外', status: '活跃', latency: '450ms' },
        { name: 'Claude 3.5 Sonnet', provider: 'Anthropic', type: '国外', status: '活跃', latency: '380ms' },
        { name: 'Qwen-Max', provider: 'Alibaba', type: '国内', status: '活跃', latency: '150ms' },
        { name: 'Llama 3.1 70B', provider: 'Ollama', type: '本地', status: '活跃', latency: '50ms' },
      ].map((model, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-slate-900">{model.name}</h3>
              <p className="text-xs text-slate-500">{model.provider}</p>
            </div>
            <span className={cn(
              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
              model.type === '国内' ? 'bg-red-50 text-red-600' : model.type === '国外' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-600'
            )}>
              {model.type}
            </span>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-50">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Activity size={14} /> {model.latency}
            </div>
            <button className="text-xs font-medium text-indigo-600 hover:underline">配置</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const SkillLibrary = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">技能库</h1>
        <p className="text-sm text-slate-500">为您的基础设施提供原子化自动化能力</p>
      </div>
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">
          <Search size={16} /> 浏览市场
        </button>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium">
          创建新技能
        </button>
      </div>
    </div>

    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {['全部技能', '环境配置', '部署实施', '测试验证', '安全合规'].map((cat, i) => (
        <button key={i} className={cn(
          "px-4 py-2 rounded-full text-sm font-medium border whitespace-nowrap transition-all",
          i === 0 ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-600 hover:text-indigo-600"
        )}>
          {cat}
        </button>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[
        { name: '磁盘健康检查', category: '环境配置', author: '官方', description: '深度扫描 SMART 数据和文件系统完整性。' },
        { name: 'K8s 节点安装', category: '部署实施', author: '社区', description: '自动将新节点加入现有集群。' },
        { name: 'Nginx 安全加固', category: '安全合规', author: '安全团队', description: '将 CIS 基准应用于 Nginx 配置。' },
        { name: 'Prometheus 导出器设置', category: '测试验证', author: '官方', description: '安装并配置 node_exporter 和自定义指标。' },
        { name: 'BGP 配置生成器', category: '环境配置', author: '网络团队', description: '为叶脊架构生成 FRR 配置。' },
        { name: '冒烟测试套件', category: '测试验证', author: '质量团队', description: '执行一系列 HTTP 和 TCP 健康检查。' },
      ].map((skill, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-300 transition-all group">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Wrench size={20} />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{skill.category}</span>
          </div>
          <h3 className="font-bold text-slate-900 mb-1">{skill.name}</h3>
          <p className="text-xs text-slate-500 mb-4 line-clamp-2">{skill.description}</p>
          <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-50">
            <span className="text-slate-400">来自 {skill.author}</span>
            <button className="text-indigo-600 font-semibold">使用技能</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const MCPCenter = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">MCP 中心</h1>
        <p className="text-sm text-slate-500">管理模型上下文协议 (MCP) 服务与工具包</p>
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium">
        <Zap size={18} /> 启动新 MCP
      </button>
    </div>

    <div className="bg-slate-900 rounded-xl p-6 text-slate-300 font-mono text-sm shadow-inner">
      <div className="flex items-center gap-2 mb-4 text-slate-500">
        <Terminal size={16} />
        <span>npx-引擎-控制台</span>
      </div>
      <div className="space-y-1">
        <p className="text-emerald-400">$ npx @modelcontextprotocol/server-postgres --db-url=...</p>
        <p>正在启动 MCP 服务: Postgres...</p>
        <p className="text-blue-400">[信息] 服务正在 stdio 上监听</p>
        <p className="text-emerald-400">$ npx @modelcontextprotocol/server-github --token=***</p>
        <p>正在启动 MCP 服务: GitHub...</p>
        <p className="text-blue-400">[信息] 服务正在 stdio 上监听</p>
        <p className="animate-pulse">_</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { name: 'Postgres MCP', status: '运行中', tools: 12, uptime: '2天 4小时', icon: Database },
        { name: 'GitHub MCP', status: '运行中', tools: 8, uptime: '5小时 12分', icon: GitBranch },
        { name: '本地文件系统 MCP', status: '已停止', tools: 4, uptime: '0秒', icon: Server },
        { name: 'Google Maps MCP', status: '运行中', tools: 6, uptime: '12天', icon: Zap },
      ].map((mcp, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center gap-4">
          <div className={cn(
            "p-3 rounded-lg",
            mcp.status === '运行中' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'
          )}>
            <mcp.icon size={24} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-slate-900">{mcp.name}</h4>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                mcp.status === '运行中' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              )}>
                {mcp.status}
              </span>
            </div>
            <p className="text-xs text-slate-500">{mcp.tools} 个可用工具 • 运行时间: {mcp.uptime}</p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><Settings size={16} /></button>
            <button className={cn(
              "p-2 rounded-lg transition-colors",
              mcp.status === '运行中' ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"
            )}>
              {mcp.status === '运行中' ? <X size={16} /> : <Zap size={16} />}
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Workflows = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">工作流</h1>
        <p className="text-sm text-slate-500">编排复杂的基础设施部署流水线</p>
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium">
        <GitBranch size={18} /> 新建工作流
      </button>
    </div>

    <div className="space-y-4">
      {[
        { name: '标准 Web 栈部署', steps: 8, lastRun: '2 小时前', status: '成功', successRate: '98%' },
        { name: '数据库集群配置', steps: 12, lastRun: '1 天前', status: '成功', successRate: '94%' },
        { name: '安全审计与补丁更新', steps: 5, lastRun: '15 分钟前', status: '进行中', successRate: '100%' },
        { name: '旧版应用迁移', steps: 24, lastRun: '3 天前', status: '失败', successRate: '72%' },
      ].map((wf, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <GitBranch size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{wf.name}</h3>
              <p className="text-xs text-slate-500">{wf.steps} 个步骤 • 上次运行: {wf.lastRun}</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <p className="text-xs text-slate-400 mb-1">成功率</p>
              <p className="text-sm font-bold text-slate-700">{wf.successRate}</p>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase",
              wf.status === '成功' ? 'bg-emerald-50 text-emerald-700' : wf.status === '进行中' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
            )}>
              {wf.status}
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const Agents = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">自主智能体 (Agents)</h1>
        <p className="text-sm text-slate-500">监控并管理您的服务器集群的智能实体</p>
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium">
        <Bot size={18} /> 派生智能体
      </button>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[
        { name: '哨兵-Alpha', role: '监控与自愈', status: '活跃', tasks: 142, model: 'DeepSeek-V3' },
        { name: '部署者-01', role: '基础设施配置', status: '空闲', tasks: 89, model: 'GPT-4o' },
        { name: '审计官-Prime', role: '安全与合规', status: '活跃', tasks: 215, model: 'Claude 3.5' },
        { name: '优化器-X', role: '资源优化', status: '活跃', tasks: 67, model: 'Llama 3.1' },
      ].map((agent, i) => (
        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex gap-6">
          <div className="relative">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white">
              <Bot size={32} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-slate-900">{agent.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{agent.role}</p>
              </div>
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">{agent.model}</span>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase">任务数</p>
                <p className="text-sm font-bold text-slate-700">{agent.tasks}</p>
              </div>
              <div className="h-8 w-px bg-slate-100"></div>
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 uppercase mb-1">当前关注</p>
                <p className="text-xs text-slate-600 truncate">正在分析 cluster-04-node-02 的日志...</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const RAGEngine = () => (
  <div className="p-6 space-y-6">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">RAG 知识库</h1>
        <p className="text-sm text-slate-500">通过基础设施文档增强 AI 能力</p>
      </div>
      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm font-medium">
        <Database size={18} /> 上传文档
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-1">
        <h3 className="font-bold text-slate-900 mb-4">数据源</h3>
        <div className="space-y-3">
          {[
            { name: 'Confluence 文档', type: '外部', status: '已同步' },
            { name: 'GitHub Wiki', type: '外部', status: '同步中' },
            { name: '本地 PDF 手册', type: '本地', status: '已同步' },
            { name: '历史故障日志', type: '数据库', status: '已同步' },
          ].map((source, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-900">{source.name}</p>
                <p className="text-[10px] text-slate-500">{source.type}</p>
              </div>
              <div className={cn(
                "w-2 h-2 rounded-full",
                source.status === '已同步' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              )} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
        <h3 className="font-bold text-slate-900 mb-4">向量搜索预览</h3>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="询问关于基础设施的任何问题..." 
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-600 mb-1 uppercase tracking-wider">AI 回答</p>
            <p className="text-sm text-slate-700 leading-relaxed">
              根据 <strong>标准 Web 栈部署</strong> 工作流和 <strong>CIS 基准</strong>，
              Ubuntu 22.04 上的 Nginx 推荐配置包括禁用 TLS 1.0/1.1 并启用 HSTS。
              详情请参阅 <code>/docs/security/nginx-hardening.pdf</code>。
            </p>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">来源: nginx-hardening.pdf</span>
            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500">来源: confluence/infra-standards</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Sidebar = ({ isOpen, toggle }: { isOpen: boolean, toggle: () => void }) => {
  const location = useLocation();
  
  const menuItems = [
    { icon: LayoutDashboard, label: '控制面板', path: '/' },
    { icon: Cpu, label: '模型广场', path: '/models' },
    { icon: Wrench, label: '技能库', path: '/skills' },
    { icon: Zap, label: 'MCP 中心', path: '/mcp' },
    { icon: GitBranch, label: '工作流', path: '/workflows' },
    { icon: Bot, label: '智能体 (Agent)', path: '/agents' },
    { icon: Database, label: 'RAG 引擎', path: '/rag' },
    { icon: Settings, label: '系统设置', path: '/settings' },
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Zap className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">AIOps部署平台</span>
        </div>
        <button onClick={toggle} className="lg:hidden">
          <X size={20} />
        </button>
      </div>
      
      <nav className="mt-6 px-4 space-y-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
              location.pathname === item.path 
                ? "bg-indigo-600 text-white" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
            <User size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">管理员用户</p>
            <p className="text-xs text-slate-500 truncate">xintiao710@gmail.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Header = ({ onMenuClick }: { onMenuClick: () => void }) => (
  <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-40">
    <div className="flex items-center gap-4">
      <button onClick={onMenuClick} className="lg:hidden p-2 hover:bg-slate-100 rounded-lg">
        <Menu size={20} />
      </button>
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input 
          type="text" 
          placeholder="搜索资源、技能、日志..." 
          className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64 lg:w-96"
        />
      </div>
    </div>
    
    <div className="flex items-center gap-4">
      <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg relative">
        <Bell size={20} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
      </button>
      <div className="h-8 w-px bg-slate-200 mx-2"></div>
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer hover:text-indigo-600">
        <span>生产集群</span>
        <ChevronRight size={16} className="rotate-90" />
      </div>
    </div>
  </header>
);

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 font-sans antialiased">
        <Sidebar isOpen={isSidebarOpen} toggle={() => setIsSidebarOpen(false)} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          
          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/models" element={<ModelSquare />} />
                <Route path="/skills" element={<SkillLibrary />} />
                <Route path="/mcp" element={<MCPCenter />} />
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/rag" element={<RAGEngine />} />
                <Route path="/settings" element={<div className="p-6 text-slate-900 font-bold text-2xl">系统设置内容</div>} />
              </Routes>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Router>
  );
}
