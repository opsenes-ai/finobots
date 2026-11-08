# Security Policy

## Supported Versions

We actively maintain security fixes for the following versions:

| Version | Supported |
| --- | --- |
| 0.1.x | Yes |
| < 0.1 | No |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do not** open a public GitHub issue.
2. Email **security@finobots.com** with a description of the vulnerability, steps to reproduce, and potential impact.
3. Include any relevant code snippets, screenshots, or proof of concept.

### Response Timeline

| Step | Expected Timeframe |
| --- | --- |
| Acknowledgment of report | Within 48 hours |
| Initial assessment | Within 5 business days |
| Fix or mitigation | Within 30 days (severity dependent) |
| Public disclosure | After fix is released, coordinated with reporter |

### What to Expect

- We will acknowledge your report promptly and keep you informed of progress.
- We will credit you in the release notes unless you prefer to remain anonymous.
- We will not take legal action against reporters who act in good faith.

### What We Ask

- Give us reasonable time to investigate and fix the issue before public disclosure.
- Do not exploit the vulnerability or access data that is not yours.
- Avoid testing on production systems.

## Security Best Practices for Contributors

When contributing to this project:

- Never commit secrets, API keys, passwords, or tokens to the repository.
- Use `.env.local` for local secrets (it is gitignored).
- Report any accidental commits of secrets to **security@finobots.com** immediately.
- Follow secure coding practices (parameterized queries, input validation, proper error handling).
