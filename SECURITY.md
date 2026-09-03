# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

We take the security of Taurus Web seriously. If you believe you have found a security vulnerability, please report it to us as described below.

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to [taurusops@163.com](mailto:taurusops@163.com).

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the requested information listed below (as much as you can provide) to help us better understand the nature and scope of the possible issue:

- Type of issue (e.g. XSS, CSRF, injection attacks, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

This information will help us triage your report more quickly.

## Preferred Languages

We prefer all communications to be in English.

## Security Best Practices

When deploying Taurus Web in production:

1. **Always use HTTPS**: Enable HTTPS for all communications
2. **Keep dependencies updated**: Regularly update npm packages
3. **Use strong authentication**: Implement proper JWT token handling
4. **Enable CSP**: Configure Content Security Policy headers
5. **Limit API exposure**: Only expose necessary API endpoints
6. **Regular security audits**: Conduct periodic security reviews
7. **Use environment variables**: Never hardcode sensitive information
8. **Enable CORS properly**: Configure CORS for specific domains only

## Security Features

Taurus Web includes several security features:

- **JWT Authentication**: Secure token-based authentication
- **RBAC**: Role-based access control for fine-grained permissions
- **CSRF Protection**: Built-in CSRF token handling
- **XSS Prevention**: Automatic escaping and CSP headers
- **Input Validation**: Client-side and server-side validation
- **Secure API Communication**: HTTPS-only API calls
- **Session Management**: Proper session handling and timeout
