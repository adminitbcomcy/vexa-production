# Clerk Dashboard - Direct Configuration Links

## ✅ Automatic Configuration Completed

The script has automatically configured:
- ✅ Allowed origins (voice.axiomic.com.cy + localhost:3000)
- ✅ API access verified
- ✅ Instance settings updated

---

## 🔧 Manual Configuration Required

Click these direct links to complete the setup:

### 1. Webhook Configuration (REQUIRED)

**Link**: https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/webhooks

**Steps:**
1. Click **"Add Endpoint"**
2. **Endpoint URL**: `https://voice.axiomic.com.cy/api/webhooks/clerk`
3. **Select events**:
   - ☑️ `user.created`
   - ☑️ `user.updated`
   - ☑️ `user.deleted`
4. Click **"Create"**
5. **Copy the Signing Secret** (starts with `whsec_...`)
6. Add to `.env.local`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

---

### 2. Domain Configuration

**Link**: https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/domains

**Steps:**
1. Check if **voice.axiomic.com.cy** is listed
2. If not, click **"Add domain"**
3. Enter: `voice.axiomic.com.cy`
4. Verify ownership if required (DNS or HTTP verification)

---

### 3. Path Configuration

**Link**: https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/paths

**Configure these paths:**

| Setting | Value |
|---------|-------|
| Sign in | `/sign-in` |
| Sign up | `/sign-up` |
| After sign in | `/meetings` |
| After sign up | `/meetings` |
| Home URL | `https://voice.axiomic.com.cy` |

---

### 4. Social Connections (Optional but Recommended)

**Link**: https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/user-authentication/social-connections

**Enable:**
- ✅ **Google** - For easy sign-in
- ✅ **Microsoft** - For Teams integration

**Steps:**
1. Click on **Google**
2. Toggle **"Enable for sign-up and sign-in"**
3. Click **"Apply"**
4. Repeat for Microsoft if needed

---

### 5. Session Settings (Optional)

**Link**: https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/sessions

**Recommended settings:**
- **Session lifetime**: 7 days
- **Inactivity timeout**: 1 day
- **Multi-session handling**: Allow multiple sessions

---

### 6. Email Templates (Optional)

**Link**: https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/email-sms

Customize email templates for:
- Welcome email
- Email verification
- Password reset
- etc.

---

## 📋 Quick Checklist

Open these links one by one and complete the configuration:

- [ ] [Webhooks](https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/webhooks) - Create endpoint
- [ ] [Domains](https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/domains) - Verify domain
- [ ] [Paths](https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/paths) - Set redirect paths
- [ ] [Social](https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/user-authentication/social-connections) - Enable Google/Microsoft
- [ ] [Sessions](https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/sessions) - Configure lifetime
- [ ] [Email](https://dashboard.clerk.com/apps/ins_35kLBDP9yYI0I1q4pgsxoy9iC53/email-sms) - Customize templates

---

## 🧪 Test After Configuration

Once you've completed all manual steps:

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Make sure webhook secret is in .env.local
cat .env.local | grep CLERK_WEBHOOK_SECRET

# Start dev server
npm run dev

# Open http://localhost:3000
# Try signing up
# Verify redirect to /meetings
```

---

## 🚀 Production Deployment

After successful local testing:

```bash
# 1. Build Docker image
docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 .

# 2. Push to registry
docker push ghcr.io/adminitbcomcy/vexa-frontend:1.0.0

# 3. Add secrets to Kubernetes (include webhook secret!)
ssh root@212.47.66.31
kubectl patch secret vexa-secrets -n vexa ...

# 4. Deploy
helm upgrade vexa /root/helm/vexa-official -n vexa -f /root/helm/custom-values.yaml

# 5. Test production
curl https://voice.axiomic.com.cy
```

---

## 📞 Support

If you encounter issues:

- **Clerk Support**: https://clerk.com/support
- **Clerk Docs**: https://clerk.com/docs
- **API Reference**: https://clerk.com/docs/reference/backend-api

---

## ✅ Configuration Summary

**Application**: axiomic-voice
**Instance ID**: ins_35kLBDP9yYI0I1q4pgsxoy9iC53
**Production Domain**: https://voice.axiomic.com.cy

**API Keys** (in `.env.local`):
- Publishable: `pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ`
- Secret: `sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci`
- Webhook Secret: *To be added after webhook creation*

**Completed via Script**:
✅ Allowed origins configured
✅ API access verified

**Complete in Dashboard**:
⚠️ Webhook endpoint
⚠️ Domain verification
⚠️ Path configuration
⚠️ Social connections
