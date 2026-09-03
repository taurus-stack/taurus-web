# Taurus Web

<div align="center">

**Enterprise Web Management Interface for Taurus Ops**

[English](README.en.md) | [中文](README.zh-CN.md)

[![License](https://img.shields.io/badge/license-AGPLv3-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vue Version](https://img.shields.io/badge/vue-3.2+-green.svg)](https://vuejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-4.9+-blue.svg)](https://www.typescriptlang.org/)

</div>

---

## 📖 Introduction

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

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- npm >= 7.0.0

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/taurus-web.git
cd taurus-web

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

### Build

```bash
# Production build
npm run build

# Local production build
npm run build:local
```

---

## 📁 Project Structure

```
taurus-web/
├── src/
│   ├── api/              # API interface definitions
│   │   ├── login/        # Login APIs
│   │   ├── menu/         # Menu APIs
│   │   └── taurus/       # Business APIs
│   ├── components/       # Shared components
│   │   ├── dvaSelect/    # dvadmin select component
│   │   ├── foreignKey/   # Foreign key component
│   │   ├── manyToMany/   # Many-to-many component
│   │   └── table/        # Table components
│   ├── layout/           # Layout components
│   ├── router/           # Router configuration
│   ├── stores/           # Pinia state management
│   │   └── taurus/       # Business stores
│   ├── utils/            # Utility functions
│   │   ├── request.ts    # Axios wrapper
│   │   ├── websocket.ts  # WebSocket wrapper
│   │   └── dictionary.ts # Dictionary utilities
│   └── views/            # Page views
│       └── taurus/       # Business pages
├── public/               # Static assets
├── mock/                 # Mock data
├── .env.example          # Environment variables example
├── package.json          # Dependencies
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── tailwind.config.js    # Tailwind CSS configuration
```

---

## 🛠️ Tech Stack

| Component | Version | Description |
|-----------|---------|-------------|
| Vue | 3.2+ | Progressive JavaScript framework |
| TypeScript | 4.9+ | Typed JavaScript |
| Vite | 4.0+ | Next generation frontend tooling |
| Element Plus | 2.8+ | Vue 3 UI library |
| fast-crud | 1.20+ | Vue CRUD framework |
| Pinia | 2.0+ | Vue state management |
| Vue Router | 4.1+ | Official router for Vue |
| Axios | 1.2+ | HTTP client |
| TailwindCSS | 3.2+ | Utility-first CSS framework |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:8000` |
| `VITE_APP_TITLE` | Application title | `Taurus Ops` |
| `VITE_USE_MOCK` | Enable mock data | `false` |
| `VITE_PM_ENABLED` | Enable button permission | `true` |

---

## 🚢 Deployment

### Static Hosting

```bash
# Build the project
npm run build

# Upload dist/ folder to your hosting service
```

### Docker

```bash
# Build Docker image
docker build -t taurus-web .

# Run container
docker run -p 80:80 taurus-web
```

### Nginx Configuration

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

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

---

## 🔗 Related Links

- [Taurus Backend](https://github.com/your-org/taurus-backend) - Backend API service
- [Taurus Auth](https://github.com/your-org/taurus-auth) - Ticket authentication service
- [Taurus Executor](https://github.com/your-org/taurus-executor) - Client executor
- [Taurus Supervisor](https://github.com/your-org/taurus-supervisor) - Host supervisor

---

## 📧 Contact

- Issues: [GitHub Issues](https://github.com/your-org/taurus-web/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/taurus-web/discussions)
- Security: [SECURITY.md](SECURITY.md)
