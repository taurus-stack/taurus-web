# 贡献指南

感谢您对 Taurus Web 项目的兴趣！本文档提供了贡献的指南和说明。

## 行为准则

参与本项目即表示您同意遵守我们的行为准则。请在所有互动中保持尊重和建设性的态度。

## 开始开发

### 开发环境

1. **Fork 并克隆** 仓库
2. **安装依赖**：
   ```bash
   npm install
   ```
3. **启动开发服务器**：
   ```bash
   npm run dev
   ```
4. **运行测试** 确保一切正常：
   ```bash
   npm run test
   ```

### 开发工作流程

1. 从 `main` 创建功能分支：
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 进行修改

3. **格式化代码**：
   ```bash
   npm run format
   ```

4. **运行代码检查**：
   ```bash
   npm run lint
   ```

5. **运行测试**：
   ```bash
   npm run test
   ```

6. 以清晰、描述性的提交消息提交更改

7. 推送到您的 fork 并提交 Pull Request

## Pull Request 指南

### 提交前检查

- [ ] 代码符合项目的风格指南
- [ ] 完成自我审查
- [ ] 必要处添加代码注释
- [ ] 为新功能添加测试
- [ ] 所有测试通过（`npm run test`）
- [ ] 代码检查通过（`npm run lint`）
- [ ] 必要时更新文档

### PR 描述

请包含以下内容：
- **什么** 更改
- **为什么** 进行这些更改
- **如何** 测试这些更改
- 任何 **破坏性更改** 或迁移说明

### 提交消息

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
type(scope): description

[可选的正文]

[可选的页脚]
```

类型：
- `feat`：新功能
- `fix`：Bug 修复
- `docs`：文档更改
- `style`：代码风格更改（格式化等）
- `refactor`：代码重构
- `test`：添加或更新测试
- `chore`：维护任务

示例：
```
feat(host): 添加主机批量导入功能
fix(login): 解决 Token 刷新问题
docs(readme): 更新安装说明
test(api): 添加主机 API 的单元测试
```

## 代码风格

我们使用：
- **ESLint** 进行代码检查
- **Prettier** 进行代码格式化
- **TypeScript** 进行类型检查

运行 `npm run format` 和 `npm run lint` 以确保合规。

## 测试

### 运行测试

```bash
# 全部测试
npm run test

# 仅单元测试
npm run test:unit

# 仅端到端测试
npm run test:e2e

# 特定测试文件
npm run test -- --grep "HostList"

# 覆盖率
npm run test:coverage
```

### 编写测试

- 为所有新功能编写测试
- 单元测试应快速且隔离
- 端到端测试应测试真实的用户工作流
- 使用测试工具中的 fixtures 进行通用设置

## 架构概览

Taurus Web 由以下几个关键组件组成：

- **api/**：API 接口定义
  - `login/`：认证 API
  - `menu/`：菜单 API
  - `taurus/`：业务 API
- **components/**：共享组件
  - `dvaSelect/`：dvadmin 选择器组件
  - `foreignKey/`：外键组件
  - `manyToMany/`：多对多组件
  - `table/`：表格组件
- **views/**：页面视图
  - `taurus/`：业务页面
- **stores/**：Pinia 状态管理
- **utils/**：工具函数
  - `request.ts`：Axios 封装
  - `websocket.ts`：WebSocket 封装
  - `dictionary.ts`：字典工具

## 报告问题

报告 Bug 时，请包含：

- **Taurus Web 版本**
- **Node.js 版本**
- **浏览器和版本**
- **操作系统**
- **复现步骤**
- **预期行为**
- **实际行为**
- **截图**（如适用）

## 功能请求

欢迎功能请求！请：

1. 检查现有问题以避免重复
2. 清晰描述使用场景
3. 解释为什么该功能有价值
4. 建议实现方案（可选）

## 文档

良好的文档至关重要。贡献时：

- 更新 `docs/` 中的相关文档
- 为新函数/类添加 JSDoc 注释
- 如涉及面向用户的更改，更新 README
- 为新功能包含示例

## 发布流程

发布由维护者管理。流程：

1. 在 `package.json` 中升级版本
2. 更新 `CHANGELOG.md`
3. 创建发布标签
4. 构建并发布
5. 创建 GitHub Release

## 有疑问？

- **一般问题**：开启 [Discussion](https://github.com/your-org/taurus-web/discussions)
- **Bug 报告**：开启 [Issue](https://github.com/your-org/taurus-web/issues)
- **代码审查**：提交 [Pull Request](https://github.com/your-org/taurus-web/pulls)

感谢您的贡献！
