# Frontend Deployment Status - Vexa.ai

**Last Updated**: November 21, 2025
**Domain**: https://voice.axiomic.com.cy
**Status**: ✅ Ready for Manual Configuration & Testing

---

## ✅ Completed Tasks

### 1. Frontend Application Structure
- ✅ Next.js 15 App Router setup
- ✅ TypeScript configuration
- ✅ shadcn/ui components integrated
- ✅ Tailwind CSS styling
- ✅ Dark mode support (next-themes)
- ✅ Internationalization ready (next-intl)

### 2. Clerk Authentication Integration
- ✅ @clerk/nextjs v5.7.0 installed
- ✅ ClerkProvider configured in root layout
- ✅ Middleware with `clerkMiddleware()` (current API, not deprecated)
- ✅ Sign-in page at `/sign-in/[[...sign-in]]`
- ✅ Sign-up page at `/sign-up/[[...sign-up]]`
- ✅ Protected dashboard routes
- ✅ UserButton component integrated
- ✅ API token injection via ApiAuthProvider

### 3. Clerk API Configuration (Automated)
- ✅ API access verified (Instance: ins_35kLBDP9yYI0I1q4pgsxoy9iC53)
- ✅ Allowed origins configured:
  - `https://voice.axiomic.com.cy`
  - `http://localhost:3000`
- ✅ Configuration script created: `scripts/configure-clerk.sh`

### 4. Environment Variables
- ✅ `.env.local` created with Clerk credentials
- ✅ `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` set
- ✅ `CLERK_SECRET_KEY` set
- ✅ Backend API URLs configured
- ✅ Admin API token configured
- ⚠️ `CLERK_WEBHOOK_SECRET` - waiting for webhook creation

### 5. API Client Integration
- ✅ Axios client configured (`lib/api/client.ts`)
- ✅ Clerk JWT token injection
- ✅ Bearer token authentication
- ✅ Request/response interceptors
- ✅ Error handling

### 6. Dashboard Pages
- ✅ `/meetings` - Meetings list with search
- ✅ `/record` - Recording interface
- ✅ `/settings` - User settings
- ✅ Protected layout with navigation
- ✅ TanStack Query integration for data fetching

### 7. API Hooks
- ✅ `useMeetings()` - Fetch meetings list
- ✅ `useMeeting()` - Fetch single meeting
- ✅ `useCreateMeeting()` - Create meeting
- ✅ `useUpdateMeeting()` - Update meeting
- ✅ `useDeleteMeeting()` - Delete meeting
- ✅ `useStartRecording()` - Start recording
- ✅ `useStopRecording()` - Stop recording
- ✅ `useTranscription()` - Get transcription
- ✅ `useAnalysis()` - Get AI analysis

### 8. Docker Configuration
- ✅ Multi-stage Dockerfile
- ✅ Next.js standalone output configured
- ✅ Production-optimized build
- ✅ Non-root user security
- ✅ Image target: `ghcr.io/adminitbcomcy/vexa-frontend:1.0.0`

### 9. Documentation
- ✅ `CLERK_QUICK_SETUP.md` - User-friendly setup guide
- ✅ `CLERK_DASHBOARD_LINKS.md` - Dashboard navigation
- ✅ `scripts/configure-clerk.sh` - Automation script
- ✅ Inline code comments and type definitions

---

## ⚠️ Pending Manual Steps (Required)

### Step 1: Complete Clerk Dashboard Configuration (10-15 minutes)

**Open**: https://dashboard.clerk.com
**Select Application**: axiomic-voice

#### 1.1 Create Webhook Endpoint (CRITICAL)

**Navigation**: Dashboard → Configure → Webhooks

1. Click **"Add Endpoint"** or **"Create Endpoint"**
2. **Endpoint URL**: `https://voice.axiomic.com.cy/api/webhooks/clerk`
3. **Description**: `Vexa user sync webhook`
4. **Subscribe to events**:
   - ☑️ `user.created`
   - ☑️ `user.updated`
   - ☑️ `user.deleted`
5. Click **"Create"**
6. **COPY THE SIGNING SECRET** (starts with `whsec_...`)

**Add to `.env.local`**:
```bash
cd /Users/leonid/Documents/vexa-production/frontend
# Edit .env.local and add:
CLERK_WEBHOOK_SECRET=whsec_YOUR_COPIED_SECRET_HERE
```

#### 1.2 Configure Domains & URLs

**Navigation**: Dashboard → Configure → Domains (or URLs)

Set these values:

| Setting | Value |
|---------|-------|
| **Home URL** | `https://voice.axiomic.com.cy` |
| **Sign in URL** | `https://voice.axiomic.com.cy/sign-in` |
| **Sign up URL** | `https://voice.axiomic.com.cy/sign-up` |
| **After sign in** | `https://voice.axiomic.com.cy/meetings` |
| **After sign up** | `https://voice.axiomic.com.cy/meetings` |

For development, ensure `http://localhost:3000` is also allowed.

#### 1.3 Verify Path Configuration

**Navigation**: Dashboard → Paths (or Components)

Ensure these are set:
```
Sign-in path: /sign-in
Sign-up path: /sign-up
```

#### 1.4 Enable Social Connections (Optional)

**Navigation**: Dashboard → User & Authentication → Social Connections

**Recommended**:
- ✅ Google - Toggle on → Click "Apply"
- ✅ Microsoft - Toggle on → Click "Apply" (useful for Teams integration)

---

## 🧪 Step 2: Local Testing

Once webhook secret is added to `.env.local`:

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser
open http://localhost:3000
```

### Test Checklist:

- [ ] Homepage loads without errors
- [ ] Click "Sign In" or "Sign Up"
- [ ] Clerk authentication modal appears
- [ ] Create a test account (email + password or social login)
- [ ] After signup, redirects to `/meetings`
- [ ] UserButton appears in header
- [ ] Can navigate to /record and /settings
- [ ] Can sign out and sign back in
- [ ] Check browser console for errors
- [ ] Verify API calls include `Authorization: Bearer <jwt>` header

### Expected Behavior:

1. **Homepage** (`/`) - Public, shows landing page
2. **Sign In** (`/sign-in`) - Clerk modal with auth options
3. **Sign Up** (`/sign-up`) - Clerk registration modal
4. **Meetings** (`/meetings`) - Protected, requires authentication
5. **Record** (`/record`) - Protected, recording interface
6. **Settings** (`/settings`) - Protected, user preferences

### Common Issues:

**Issue**: "Clerk: Missing publishableKey"
- **Fix**: Check `.env.local` has `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Restart dev server after changing .env.local

**Issue**: Sign in works but redirect fails
- **Fix**: Verify paths in Clerk Dashboard match `/sign-in` and `/sign-up`
- Check "After sign in" is set to `/meetings`

**Issue**: "401 Unauthorized" from backend API
- **Fix**: Check Vexa backend JWT verification is configured
- Verify token is being sent in Authorization header (check Network tab)

---

## 🚀 Step 3: Production Deployment

Once local testing succeeds:

### 3.1 Build Docker Image

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Build production image
docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 .

# Test image locally (optional)
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ \
  -e CLERK_SECRET_KEY=sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci \
  -e CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET \
  -e NEXT_PUBLIC_VEXA_API_URL=https://voice.axiomic.com.cy \
  ghcr.io/adminitbcomcy/vexa-frontend:1.0.0

# Push to registry
docker push ghcr.io/adminitbcomcy/vexa-frontend:1.0.0
```

### 3.2 Add Secrets to Kubernetes

```bash
ssh root@212.47.66.31

# Add Clerk secrets to existing vexa-secrets
kubectl patch secret vexa-secrets -n vexa --type='json' -p='[
  {"op":"add","path":"/data/clerk-publishable-key","value":"'$(echo -n "pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ" | base64)'"},
  {"op":"add","path":"/data/clerk-secret-key","value":"'$(echo -n "sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci" | base64)'"},
  {"op":"add","path":"/data/clerk-webhook-secret","value":"'$(echo -n "whsec_YOUR_ACTUAL_WEBHOOK_SECRET" | base64)'"}
]'

# Verify secrets added
kubectl get secret vexa-secrets -n vexa -o jsonpath='{.data}' | grep clerk
```

### 3.3 Create Frontend Helm Deployment

Create `/root/helm/vexa-official/templates/frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "vexa.fullname" . }}-frontend
  labels:
    {{- include "vexa.labels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
spec:
  replicas: {{ .Values.frontend.replicas }}
  selector:
    matchLabels:
      {{- include "vexa.selectorLabels" . | nindent 6 }}
      app.kubernetes.io/component: frontend
  template:
    metadata:
      labels:
        {{- include "vexa.selectorLabels" . | nindent 8 }}
        app.kubernetes.io/component: frontend
    spec:
      imagePullSecrets:
        - name: {{ .Values.imagePullSecrets }}
      containers:
      - name: frontend
        image: "{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
        imagePullPolicy: {{ .Values.frontend.image.pullPolicy }}
        ports:
        - containerPort: 3000
          name: http
        env:
        - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secrets.name }}
              key: clerk-publishable-key
        - name: CLERK_SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secrets.name }}
              key: clerk-secret-key
        - name: CLERK_WEBHOOK_SECRET
          valueFrom:
            secretKeyRef:
              name: {{ .Values.secrets.name }}
              key: clerk-webhook-secret
        - name: NEXT_PUBLIC_VEXA_API_URL
          value: "https://{{ .Values.ingress.host }}"
        - name: NEXT_PUBLIC_VEXA_WS_URL
          value: "wss://{{ .Values.ingress.host }}/ws"
        - name: NEXT_PUBLIC_APP_URL
          value: "https://{{ .Values.ingress.host }}"
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /
            port: http
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: http
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          {{- toYaml .Values.frontend.resources | nindent 10 }}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ include "vexa.fullname" . }}-frontend
  labels:
    {{- include "vexa.labels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
spec:
  type: ClusterIP
  ports:
  - port: 3000
    targetPort: http
    protocol: TCP
    name: http
  selector:
    {{- include "vexa.selectorLabels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
```

### 3.4 Update custom-values.yaml

Add to `/root/helm/custom-values.yaml`:

```yaml
frontend:
  replicas: 2
  image:
    repository: ghcr.io/adminitbcomcy/vexa-frontend
    tag: "1.0.0"
    pullPolicy: Always
  resources:
    requests:
      memory: "256Mi"
      cpu: "200m"
    limits:
      memory: "512Mi"
      cpu: "500m"
```

### 3.5 Update Ingress

Update `/root/helm/vexa-official/templates/ingress.yaml` to route `/` to frontend:

```yaml
spec:
  rules:
  - host: {{ .Values.ingress.host }}
    http:
      paths:
      # Frontend (root and app pages)
      - path: /
        pathType: Prefix
        backend:
          service:
            name: {{ include "vexa.fullname" . }}-frontend
            port:
              number: 3000
      # API Gateway (backend)
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: {{ include "vexa.fullname" . }}-api-gateway
            port:
              number: 8000
      # WebSocket
      - path: /ws
        pathType: Prefix
        backend:
          service:
            name: {{ include "vexa.fullname" . }}-api-gateway
            port:
              number: 8000
```

### 3.6 Deploy

```bash
# On CP-1
ssh root@212.47.66.31

# Deploy updated Helm chart
helm upgrade vexa /root/helm/vexa-official -n vexa -f /root/helm/custom-values.yaml

# Watch rollout
kubectl rollout status deployment/vexa-frontend -n vexa

# Check pods
kubectl get pods -n vexa -l app.kubernetes.io/component=frontend

# Check logs
kubectl logs -n vexa -l app.kubernetes.io/component=frontend --tail=50 -f
```

### 3.7 Verify Production

```bash
# Test homepage
curl -I https://voice.axiomic.com.cy
# Should return 200 OK

# Test sign-in page
curl -I https://voice.axiomic.com.cy/sign-in
# Should return 200 OK

# Open in browser
open https://voice.axiomic.com.cy
```

**Test Production Checklist**:
- [ ] Homepage loads
- [ ] Sign in/Sign up works
- [ ] After auth, redirects to /meetings
- [ ] API calls to backend succeed
- [ ] WebSocket connection works (if used)
- [ ] Webhook receives user.created events
- [ ] TLS certificate is valid
- [ ] No console errors

---

## 📋 Environment Variables Summary

### Required in `.env.local` (Local Development)

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci
CLERK_WEBHOOK_SECRET=whsec_YOUR_SECRET  # Add after webhook creation

# Vexa API
NEXT_PUBLIC_VEXA_API_URL=https://voice.axiomic.com.cy
NEXT_PUBLIC_VEXA_WS_URL=wss://voice.axiomic.com.cy/ws
VEXA_ADMIN_API_TOKEN=uhM0NvSuT9ZDF8TgDI0EhS1wp7qVk78HyUCYBcXObrg

# App
NEXT_PUBLIC_APP_URL=https://voice.axiomic.com.cy
NODE_ENV=development
```

### Required in Kubernetes Secret (Production)

Base64-encoded in `vexa-secrets`:
- `clerk-publishable-key`
- `clerk-secret-key`
- `clerk-webhook-secret`

---

## 🔒 Security Notes

1. **Never commit `.env.local`** - Already in .gitignore
2. **Rotate secrets** if accidentally exposed
3. **Webhook signature verification** - Backend must verify `svix-signature` header
4. **HTTPS only** in production - HTTP allowed only for localhost:3000
5. **JWT validation** - Backend must verify Clerk JWT tokens
6. **CORS** - Backend must allow origin `https://voice.axiomic.com.cy`

---

## 🆘 Troubleshooting

### Can't Find Webhooks in Dashboard?

Try these locations:
1. **Configure** → **Webhooks**
2. **Settings** → **Webhooks**
3. **Developers** → **Webhooks**
4. Look for **"Svix"** or **"Webhook Portal"** button

### Webhook Secret Not Working?

Format must be:
```bash
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
No quotes, no spaces, starts with `whsec_`.

### Sign In Not Working?

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
3. Check domain is allowed in Clerk Dashboard (allowed origins)
4. Clear browser cache and cookies
5. Check middleware.ts routes are correct

### API Calls Failing?

1. Check Network tab - is `Authorization: Bearer <token>` header present?
2. Verify backend accepts and validates Clerk JWT tokens
3. Check CORS settings on backend
4. Verify API URL in `.env.local` is correct
5. Check backend logs for authentication errors

---

## 📞 Support Resources

- **Clerk Documentation**: https://clerk.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **Clerk Support**: https://clerk.com/support
- **Clerk Discord**: https://clerk.com/discord
- **GitHub Issues**: https://github.com/adminitbcomcy/vexa-production/issues

---

## ✅ Current Status Summary

**Infrastructure**: ✅ Kubernetes cluster operational (5 nodes)
**Backend Services**: ✅ All deployed and healthy
**Frontend Code**: ✅ Complete and ready
**Clerk API Config**: ✅ Automated configuration complete
**Clerk Dashboard**: ⚠️ Manual steps required (webhook, domains)
**Local Testing**: ⏭️ Ready after webhook secret added
**Docker Image**: ⏭️ Ready to build
**Production Deploy**: ⏭️ Ready after testing

**Next Immediate Action**: Complete Clerk Dashboard webhook configuration and add webhook secret to `.env.local`

---

**End of Status Document**
*Last updated: November 21, 2025*
