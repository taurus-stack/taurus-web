# Contributing to Taurus Web

Thank you for your interest in contributing to Taurus Web! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and constructive in all interactions.

## Getting Started

### Development Environment

1. **Fork and clone** the repository
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start development server**:
   ```bash
   npm run dev
   ```
4. **Run tests** to ensure everything works:
   ```bash
   npm run test
   ```

### Development Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. **Format your code**:
   ```bash
   npm run format
   ```

4. **Run linters**:
   ```bash
   npm run lint
   ```

5. **Run tests**:
   ```bash
   npm run test
   ```

6. Commit your changes with clear, descriptive commit messages

7. Push to your fork and submit a Pull Request

## Pull Request Guidelines

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Tests added for new functionality
- [ ] All tests pass (`npm run test`)
- [ ] Linters pass (`npm run lint`)
- [ ] Documentation updated if necessary

### PR Description

Please include:
- **What** changes you made
- **Why** you made these changes
- **How** to test the changes
- Any **breaking changes** or migration notes

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/) format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(host): add host batch import feature
fix(login): resolve token refresh issue
docs(readme): update installation instructions
test(api): add unit tests for host API
```

## Code Style

We use:
- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type checking

Run `npm run format` and `npm run lint` to ensure compliance.

## Testing

### Running Tests

```bash
# All tests
npm run test

# Unit tests only
npm run test:unit

# E2E tests only
npm run test:e2e

# Specific test file
npm run test -- --grep "HostList"

# With coverage
npm run test:coverage
```

### Writing Tests

- Write tests for all new functionality
- Unit tests should be fast and isolated
- E2E tests should test real user workflows
- Use fixtures from test utilities for common setup

## Architecture Overview

Taurus Web consists of several key components:

- **api/**: API interface definitions
  - `login/`: Authentication APIs
  - `menu/`: Menu APIs
  - `taurus/`: Business APIs
- **components/**: Shared components
  - `dvaSelect/`: dvadmin select component
  - `foreignKey/`: Foreign key component
  - `manyToMany/`: Many-to-many component
  - `table/`: Table components
- **views/**: Page views
  - `taurus/`: Business pages
- **stores/**: Pinia state management
- **utils/**: Utility functions
  - `request.ts`: Axios wrapper
  - `websocket.ts`: WebSocket wrapper
  - `dictionary.ts`: Dictionary utilities

## Reporting Issues

When reporting bugs, please include:

- **Taurus Web version**
- **Node.js version**
- **Browser and version**
- **Operating system**
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** (if applicable)

## Feature Requests

We welcome feature requests! Please:

1. Check existing issues to avoid duplicates
2. Describe the use case clearly
3. Explain why this feature would be valuable
4. Suggest implementation approach (optional)

## Documentation

Good documentation is crucial. When contributing:

- Update relevant docs in `docs/`
- Add JSDoc comments to new functions/classes
- Update README if user-facing changes
- Include examples for new features

## Release Process

Releases are managed by maintainers. The process:

1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag
4. Build and publish
5. Create GitHub release

## Questions?

- **General questions**: Open a [Discussion](https://github.com/your-org/taurus-web/discussions)
- **Bug reports**: Open an [Issue](https://github.com/your-org/taurus-web/issues)
- **Code review**: Submit a [Pull Request](https://github.com/your-org/taurus-web/pulls)

Thank you for contributing!
