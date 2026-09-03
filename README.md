# Taurus Web

<div align="center">

**企业级 Web 管理界面 | Enterprise Web Management Interface**

[English](README.en.md) | [中文](README.zh-CN.md)

[![License](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vue Version](https://img.shields.io/badge/vue-3.2+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-4.9+-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📖 简介 / Introduction

**中文** | [English](README.en.md)

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

## English | [中文](README.zh-CN.md)

Taurus Web is the frontend management interface for Taurus Ops distributed operations management system. Built with Vue 3, TypeScript, Vite, and Element Plus, it provides a modern user interface and efficient development experience.

### Key Features

- 🚀 **Modern Tech Stack**: Vue 3 + TypeScript + Vite + Element Plus
- 🔐 **RBAC Permission**: Fine-grained role-based access control (menu/button/field level)
- 📊 **CRUD Framework**: fast-crud for rapid development
- 🔄 **Real-time Updates**: WebSocket support
- 🌙 **Theme Customization**: Dark/Light themes with customizable colors
- 🌍 **Internationalization**: Multi-language support (i18n ready)
- 📱 **Responsive Design**: Seamless experience on desktop and mobile

---

## 🚀 快速开始 / Quick Start

### 环境要求 / Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0

### 安装 / Installation

```bash
# 克隆仓库 / Clone the repository
git clone https://github.com/your-org/taurus-web.git
cd taurus-web

# 安装依赖 / Install dependencies
npm install

# 配置环境变量 / Configure environment
cp .env.example .env

# 启动开发服务器 / Start development server
npm run dev
```

### 构建 / Build

```bash
# 生产环境构建 / Production build
npm run build

# 本地生产环境构建 / Local production build
npm run build:local
```

---

## 📁 项目结构 / Project Structure

```
taurus-web/
├── src/
│   ├── api/              # API 接口定义 / API interface definitions
│   │   ├── login/        # 登录 API / Login APIs
│   │   ├── menu/         # 菜单 API / Menu APIs
│   │   └── taurus/       # 业务 API / Business APIs
│   ├── components/       # 共享组件 / Shared components
│   │   ├── dvaSelect/    # dvadmin 选择器 / dvadmin select
│   │   ├── foreignKey/   # 外键组件 / Foreign key component
│   │   ├── manyToMany/   # 多对多组件 / Many-to-many component
│   │   └── table/        # 表格组件 / Table components
│   ├── layout/           # 布局组件 / Layout components
│   ├── router/           # 路由配置 / Router configuration
│   ├── stores/           # Pinia 状态管理 / Pinia stores
│   │   └── taurus/       # 业务状态 / Business stores
│   ├── utils/            # 工具函数 / Utility functions
│   │   ├── request.ts    # Axios 封装 / Axios wrapper
│   │   ├── websocket.ts  # WebSocket 封装 / WebSocket wrapper
│   │   └── dictionary.ts # 字典工具 / Dictionary utilities
│   └── views/            # 页面视图 / Page views
│       └── taurus/       # 业务页面 / Business pages
├── public/               # 静态资源 / Static assets
├── mock/                 # Mock 数据 / Mock data
├── .env.example          # 环境变量示例 / Environment variables example
├── package.json          # 依赖配置 / Dependencies
├── vite.config.ts        # Vite 配置 / Vite configuration
├── tsconfig.json         # TypeScript 配置 / TypeScript configuration
└── tailwind.config.js    # Tailwind CSS 配置 / Tailwind CSS configuration
```

---

## 🛠️ 技术栈 / Tech Stack

| 组件 / Component | 版本 / Version | 说明 / Description |
|------------------|----------------|--------------------|
| Vue | 3.2+ | 渐进式 JavaScript 框架 / Progressive JavaScript framework |
| TypeScript | 4.9+ | 类型化的 JavaScript / Typed JavaScript |
| Vite | 4.0+ | 下一代前端工具 / Next generation frontend tooling |
| Element Plus | 2.8+ | Vue 3 UI 库 / Vue 3 UI library |
| fast-crud | 1.20+ | Vue CRUD 框架 / Vue CRUD framework |
| Pinia | 2.0+ | Vue 状态管理 / Vue state management |
| Vue Router | 4.1+ | Vue 官方路由 / Official router for Vue |
| Axios | 1.2+ | HTTP 客户端 / HTTP client |
| TailwindCSS | 3.2+ | 实用优先的 CSS 框架 / Utility-first CSS framework |

---

## ⚙️ 配置 / Configuration

### 环境变量 / Environment Variables

| 变量 / Variable | 说明 / Description | 默认值 / Default |
|-----------------|--------------------|--------------------|
| `VITE_API_URL` | 后端 API 地址 / Backend API URL | `/` |
| `VITE_WS_URL` | WebSocket 地址 / WebSocket URL | `ws://localhost:8000` |
| `VITE_APP_TITLE` | 应用标题 / Application title | `Taurus Ops` |
| `VITE_USE_MOCK` | 启用 Mock 数据 / Enable mock data | `false` |
| `VITE_PM_ENABLED` | 启用按钮权限 / Enable button permission | `true` |

---

## 🚢 部署 / Deployment

### 静态托管 / Static Hosting

```bash
# 构建项目 / Build the project
npm run build

# 将 dist/ 文件夹上传到你的托管服务 / Upload dist/ folder to your hosting service
```

### Docker

```bash
# 构建 Docker 镜像 / Build Docker image
docker build -t taurus-web .

# 运行容器 / Run container
docker run -p 80:80 taurus-web
```

### Nginx 配置 / Nginx Configuration

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

## 🤝 贡献 / Contributing

欢迎贡献！请参阅 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细信息。

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 许可证 / License

本项目基于 GNU Affero General Public License v3.0 发布 - 详见 [LICENSE](LICENSE) 文件。

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

## 🔗 相关链接 / Links

- [Taurus Backend](https://github.com/your-org/taurus-backend) - 后端 API 服务 / Backend API service
- [Taurus Auth](https://github.com/your-org/taurus-auth) - 票据鉴权服务 / Ticket authentication service
- [Taurus Executor](https://github.com/your-org/taurus-executor) - 客户端执行器 / Client executor
- [Taurus Supervisor](https://github.com/your-org/taurus-supervisor) - 主机守护进程 / Host supervisor

---

## 📧 联系方式 / Contact

- 问题反馈 / Issues: [GitHub Issues](https://github.com/your-org/taurus-web/issues)
- 讨论区 / Discussions: [GitHub Discussions](https://github.com/your-org/taurus-web/discussions)
- 安全漏洞 / Security: [SECURITY.md](SECURITY.md)
