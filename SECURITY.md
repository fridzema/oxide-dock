# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

**Do not open a public issue.**

Instead, use [GitHub Security Advisories](https://github.com/fridzema/oxide-dock/security/advisories/new) to privately report the vulnerability.

You should receive a response within 48 hours. We will work with you to understand the issue and coordinate a fix before any public disclosure.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| 0.x     | Yes       |

## Security Practices

- Dependencies are audited via `cargo audit` in CI (Rust) and reviewed regularly
- Tauri capabilities follow least-privilege principles
- Content Security Policy is enabled by default
