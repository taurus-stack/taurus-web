# Taurus Web

<div align="center">

**Taurus Ops 企业级 Web 管理界面**

[English](README.en.md) | [中文](README.zh-CN.md)

[![License](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vue Version](https://img.shields.io/badge/vue-3.2+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-4.9+-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📖 简介

Taurus Web 是 Taurus Ops 分布式运维管理系统的前端管理界面，基于 Vue 3、TypeScript、Vite 和 Element Plus 构建，提供现代化的用户界面和高效的开发体验。

### 核心特性

- 🚀 **现代技术栈**：Vue 3 + TypeScript + Vite + Element Plus
- 🔐 **RBAC 权限**：细粒度的基于角色的访问控制（菜单/按钮/字段级别）
- 📊 **CRUD 框架**：使用 fast-crud 快速开发
- 🔄 **实时通信**：WebSocket 支持实时更新
- 🌙 **主题定制**：深色/浅色主题，可自定义颜色
- 🌍 **国际化**：多语言支持（i18n 就绪）
- 📱 **响应式设计**：桌面和移动设备无缝运行

---

## 🚀 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/taurus-web.git
cd taurus-web

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env

# 启动开发服务器
npm run dev
```

### 构建

```bash
# 生产环境构建
npm run build

# 本地生产环境构建
npm run build:local
```

---

## 📁 项目结构

```
taurus-web/
├── src/
│   ├── api/              # API 接口定义
│   │   ├── login/        # 登录 API
│   │   ├── menu/         # 菜单 API
│   │   └── taurus/       # 业务 API
│   ├── components/       # 共享组件
│   │   ├── dvaSelect/    # dvadmin 选择器组件
│   │   ├── foreignKey/   # 外键组件
│   │   ├── manyToMany/   # 多对多组件
│   │   └── table/        # 表格组件
│   ├── layout/           # 布局组件
│   ├── router/           # 路由配置
│   ├── stores/           # Pinia 状态管理
│   │   └── taurus/       # 业务状态
│   ├── utils/            # 工具函数
│   │   ├── request.ts    # Axios 封装
│   │   ├── websocket.ts  # WebSocket 封装
│   │   └── dictionary.ts # 字典工具
│   └── views/            # 页面视图
│       └── taurus/       # 业务页面
├── public/               # 静态资源
├── mock/                 # Mock 数据
├── .env.example          # 环境变量示例
├── package.json          # 依赖配置
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
└── tailwind.config.js    # Tailwind CSS 配置
```

---

## 🛠️ 技术栈

| 组件 | 版本 | 说明 |
|------|------|------|
| Vue | 3.2+ | 渐进式 JavaScript 框架 |
| TypeScript | 4.9+ | 类型化的 JavaScript |
| Vite | 4.0+ | 下一代前端工具 |
| Element Plus | 2.8+ | Vue 3 UI 库 |
| fast-crud | 1.20+ | Vue CRUD 框架 |
| Pinia | 2.0+ | Vue 状态管理 |
| Vue Router | 4.1+ | Vue 官方路由 |
| Axios | 1.2+ | HTTP 客户端 |
| TailwindCSS | 3.2+ | 实用优先的 CSS 框架 |

---

## ⚙️ 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_API_URL` | 后端 API 地址 | `/` |
| `VITE_WS_URL` | WebSocket 地址 | `ws://localhost:8000` |
| `VITE_APP_TITLE` | 应用标题 | `Taurus Ops` |
| `VITE_USE_MOCK` | 启用 Mock 数据 | `false` |
| `VITE_PM_ENABLED` | 启用按钮权限 | `true` |

---

## 🚢 部署

### 静态托管

```bash
# 构建项目
npm run build

# 将 dist/ 文件夹上传到你的托管服务
```

### Docker

```bash
# 构建 Docker 镜像
docker build -t taurus-web .

# 运行容器
docker run -p 80:80 taurus-web
```

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend-server:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /ws {
        proxy_pass http://backend-server:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 🤝 贡献

欢迎贡献！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

---

## 📄 许可证

本项目基于 MIT 许可证发布 - 详见 [LICENSE](LICENSE) 文件。

---

## 🔗 相关链接

- [Taurus Backend](https://github.com/your-org/taurus-backend) - 后端 API 服务
- [Taurus Auth](https://github.com/your-org/taurus-auth) - 票据鉴权服务
- [Taurus Executor](https://github.com/your-org/taurus-executor) - 客户端执行器
- [Taurus Supervisor](https://github.com/your-org/taurus-supervisor) - 主机守护进程

---

## 📧 联系方式

- 问题反馈：[GitHub Issues](https://github.com/your-org/taurus-web/issues)
- 讨论区：[GitHub Discussions](https://github.com/your-org/taurus-web/discussions)
- 安全漏洞：[SECURITY.md](SECURITY.md)
