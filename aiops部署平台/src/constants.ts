export interface NavItem {
  title: string;
  href: string;
  icon: string;
}

export const navigation: NavItem[] = [
  { title: "控制面板", href: "/", icon: "LayoutDashboard" },
  { title: "模型广场", href: "/models", icon: "Cpu" },
  { title: "技能库", href: "/skills", icon: "Wrench" },
  { title: "MCP 中心", href: "/mcp", icon: "Zap" },
  { title: "工作流", href: "/workflows", icon: "GitBranch" },
  { title: "智能体 (Agent)", href: "/agents", icon: "Bot" },
  { title: "RAG 引擎", href: "/rag", icon: "Database" },
  { title: "系统设置", href: "/settings", icon: "Settings" },
];
