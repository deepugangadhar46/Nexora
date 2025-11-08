# Security Policy

## 🚨 CRITICAL: Secrets Committed to Repository

**If you have committed secrets to this repository, follow these steps immediately:**

### 1. Rotate ALL Credentials

All secrets found in any `.env` file that was committed must be rotated immediately:

#### Database Credentials
- [ ] Aiven MySQL password
- [ ] Database user credentials
- [ ] SSL certificates

#### API Keys
- [ ] Groq API Key
- [ ] HuggingFace Token
- [ ] Kimi API Key
- [ ] ElevenLabs API Key
- [ ] Cloudinary API credentials
- [ ] Firecrawl API Key
- [ ] E2B API Key

#### OAuth Secrets
- [ ] Google OAuth Client Secret
- [ ] GitHub OAuth Client Secret

#### Authentication
- [ ] JWT Secret Key
- [ ] NextAuth Secret

#### Third-Party Services
- [ ] Vercel Token
- [ ] Sentry Auth Token
- [ ] Any other API keys or tokens

### 2. Remove Secrets from Git History

```bash
# Install git-filter-repo (recommended method)
pip install git-filter-repo

# Remove .env files from entire git history
git filter-repo --path .env --invert-paths
git filter-repo --path backend/.env --invert-paths
git filter-repo --path frontend/.env --invert-paths

# Force push to remote (WARNING: This rewrites history)
git push origin --force --all
git push origin --force --tags
```

**Alternative using BFG Repo-Cleaner:**
```bash
# Download BFG from https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push origin --force --all
```

### 3. Update .gitignore

Ensure your `.gitignore` includes:

```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production
.env.development
backend/.env
frontend/.env
frontend/.env.local
**/.env
**/.env.local
```

### 4. Proper Environment Variable Setup

#### Backend (.env in backend/ directory)
```bash
# backend/.env (NEVER commit this file)
DB_PASSWORD=your_new_password
GOOGLE_CLIENT_SECRET=your_new_secret
GITHUB_CLIENT_SECRET=your_new_secret
JWT_SECRET=your_new_jwt_secret
# ... other secrets
```

#### Frontend (.env.local in frontend/ directory)
```bash
# frontend/.env.local (NEVER commit this file)
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GITHUB_CLIENT_ID=your_client_id
# Note: NO secrets here, only public config
```

### 5. Use Environment-Specific Files

- **Development**: `.env.local` (gitignored)
- **Production**: Use environment variables from hosting platform (Vercel, Railway, etc.)
- **Example files**: `.env.example` (safe to commit, no real values)

## Security Best Practices

### OAuth Configuration

**Backend** (server-side):
- `GOOGLE_CLIENT_ID` - Can be public
- `GOOGLE_CLIENT_SECRET` - **MUST BE SECRET**
- `GITHUB_CLIENT_ID` - Can be public
- `GITHUB_CLIENT_SECRET` - **MUST BE SECRET**

**Frontend** (client-side):
- `VITE_GOOGLE_CLIENT_ID` - Public, safe to expose
- `VITE_GITHUB_CLIENT_ID` - Public, safe to expose
- **NEVER** include `CLIENT_SECRET` in frontend

### Database Security

1. **SSL/TLS**: Always use SSL for database connections
2. **Certificates**: Store CA certificates outside the repository
3. **Credentials**: Use strong, unique passwords
4. **Access**: Limit database user permissions to minimum required

### API Keys

1. **Rotation**: Rotate keys every 90 days
2. **Scope**: Use minimum required permissions
3. **Monitoring**: Enable API usage monitoring
4. **Rate Limiting**: Implement rate limiting on all endpoints

### JWT Tokens

1. **Secret**: Use cryptographically secure random string (min 32 bytes)
2. **Expiration**: Set appropriate expiration times
   - Access tokens: 1-24 hours
   - Refresh tokens: 7-30 days
3. **Storage**: Store refresh tokens securely (httpOnly cookies preferred)

## Deployment Checklist

- [ ] All secrets rotated after any exposure
- [ ] `.env` files added to `.gitignore`
- [ ] No secrets in git history
- [ ] Environment variables set in hosting platform
- [ ] OAuth redirect URIs configured correctly
- [ ] CORS configured for production domain only
- [ ] Rate limiting enabled
- [ ] Sentry or error monitoring configured
- [ ] SSL/TLS certificates valid
- [ ] Database backups configured

## Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Email security concerns to: security@nexora.ai

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Updates

Check for security updates regularly:
- `npm audit` for frontend dependencies
- `pip-audit` for backend dependencies
- Monitor GitHub security advisories

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OAuth 2.0 Security Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
