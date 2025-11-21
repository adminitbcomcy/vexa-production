# Clerk Dashboard Configuration for voice.axiomic.com.cy

## ✅ Current Configuration

**Application Name**: axiomic-voice
**Application ID**: app_35kLB…TBUwZiti4
**Instance ID**: ins_35kLB…sxoy9iC53

**API Keys** (already added to `.env.local`):
- Publishable Key: `pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ`
- Secret Key: `sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci`

---

## 📋 Steps to Configure in Clerk Dashboard

### Step 1: Update Domain Settings

1. Go to Clerk Dashboard: https://dashboard.clerk.com
2. Select application: **axiomic-voice**
3. Navigate to: **Settings** → **Domains**
4. Update the following URLs:

```
Home URL: https://voice.axiomic.com.cy
```

### Step 2: Configure Paths

Go to: **Settings** → **Paths**

Update these paths:

```
Sign in: /sign-in
Sign up: /sign-up
Home (after sign in): /meetings
Home (after sign up): /meetings
```

### Step 3: Set Up Webhook for User Sync

1. Go to: **Settings** → **Webhooks**
2. Click: **Add Endpoint**
3. Configure:

```
Endpoint URL: https://voice.axiomic.com.cy/api/webhooks/clerk
Description: Sync users to Vexa backend
```

4. **Select Events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`

5. Click: **Create**

6. **Copy the Signing Secret** (starts with `whsec_...`)

7. Add to `.env.local`:
```bash
CLERK_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Step 4: Configure Social Connections (Optional)

Go to: **Settings** → **Authentication** → **Social Connections**

Recommended to enable:
- ✅ **Google** (for easy sign-in)
- ✅ **Microsoft** (for Teams integration)

### Step 5: Configure Email Settings

Go to: **Settings** → **Email & SMS**

1. **From email**: Set your domain or use Clerk's default
2. **Email templates**: Customize if needed
3. **Email verification**: Keep enabled

### Step 6: Session & Security Settings

Go to: **Settings** → **Sessions**

Recommended settings:
```
Session lifetime: 7 days
Inactivity timeout: 1 day
Multi-session handling: Allow multiple sessions
```

---

## 🔧 Backend Configuration Required

### Update Vexa Backend to Accept Clerk JWT

Your backend needs to verify Clerk JWT tokens. Here's what needs to be added:

#### Option 1: Using Clerk Backend SDK (Recommended)

Install Clerk SDK in your backend:

```bash
# For Python/FastAPI
pip install clerk-backend-api
```

Add verification middleware:

```python
from clerk_backend_api import Clerk
from fastapi import HTTPException, Depends, Header

clerk_client = Clerk(bearer_auth=os.getenv("CLERK_SECRET_KEY"))

async def verify_clerk_token(authorization: str = Header(...)):
    """Verify Clerk JWT token from Authorization header"""
    try:
        # Extract token from "Bearer <token>"
        token = authorization.replace("Bearer ", "")

        # Verify token with Clerk
        session = clerk_client.sessions.verify_token(token)

        # Get user info
        user = clerk_client.users.get(session.user_id)

        return user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# Use in protected routes
@app.get("/api/meetings")
async def get_meetings(user = Depends(verify_clerk_token)):
    # user.id, user.email_addresses[0].email_address
    return {"meetings": []}
```

#### Option 2: Manual JWT Verification

```python
import jwt
import requests
from functools import lru_cache

@lru_cache()
def get_clerk_jwks():
    """Fetch Clerk's public keys for JWT verification"""
    response = requests.get("https://dominant-ram-47.clerk.accounts.dev/.well-known/jwks.json")
    return response.json()

def verify_clerk_jwt(token: str):
    """Verify Clerk JWT manually"""
    jwks = get_clerk_jwks()
    # Verify JWT using jwks
    # ... (standard JWT verification)
    pass
```

### Create User Sync Endpoint

Add this endpoint to your Vexa backend (Admin API):

```python
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ClerkUserSync(BaseModel):
    clerk_id: str
    email: str
    name: str | None = None
    image_url: str | None = None

@router.post("/api/admin/users/sync")
async def sync_clerk_user(
    user_data: ClerkUserSync,
    x_admin_token: str = Header(..., alias="X-Admin-Token")
):
    """Sync user from Clerk webhook"""

    # Verify admin token
    if x_admin_token != os.getenv("VEXA_ADMIN_API_TOKEN"):
        raise HTTPException(status_code=403, detail="Invalid admin token")

    # Create or update user in database
    user = await db.users.upsert(
        where={"clerk_id": user_data.clerk_id},
        update={
            "email": user_data.email,
            "name": user_data.name,
            "image_url": user_data.image_url,
        },
        create={
            "clerk_id": user_data.clerk_id,
            "email": user_data.email,
            "name": user_data.name,
            "image_url": user_data.image_url,
        }
    )

    return {"status": "success", "user_id": user.id}
```

---

## 🧪 Testing Locally

### 1. Start Development Server

```bash
cd /Users/leonid/Documents/vexa-production/frontend
npm install
npm run dev
```

### 2. Test Authentication Flow

1. Open http://localhost:3000
2. Click "Sign In" or go to http://localhost:3000/sign-in
3. Create a test account
4. Verify redirect to `/meetings`
5. Check that `UserButton` appears in header
6. Try signing out

### 3. Test API Integration

Check browser DevTools → Network:
- API calls should have `Authorization: Bearer <token>` header
- Backend should accept the token
- User should be synced to database

### 4. Test Webhook (Local)

For local testing, use ngrok:

```bash
# In another terminal
npx ngrok http 3000

# Copy the ngrok URL (e.g., https://abc123.ngrok.io)
# Add webhook in Clerk Dashboard:
# https://abc123.ngrok.io/api/webhooks/clerk
```

---

## 🐳 Production Deployment

### 1. Add Secrets to Kubernetes

```bash
# SSH to Kubernetes control plane
ssh root@212.47.66.31

# Add Clerk secrets
kubectl patch secret vexa-secrets -n vexa \
  --type='json' \
  -p='[
    {
      "op": "add",
      "path": "/data/clerk-publishable-key",
      "value": "'$(echo -n "pk_test_ZG9taW5hbnQtcmFtLTQ3LmNsZXJrLmFjY291bnRzLmRldiQ" | base64)'"
    },
    {
      "op": "add",
      "path": "/data/clerk-secret-key",
      "value": "'$(echo -n "sk_test_qBeSaR5jRlNhE7A544epxNvse5hGPJtLAnyV8rk7Ci" | base64)'"
    },
    {
      "op": "add",
      "path": "/data/clerk-webhook-secret",
      "value": "'$(echo -n "PASTE_YOUR_WEBHOOK_SECRET_HERE" | base64)'"
    }
  ]'

# Verify secrets
kubectl get secret vexa-secrets -n vexa -o jsonpath='{.data.clerk-publishable-key}' | base64 -d
```

### 2. Build Docker Image

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Build
docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 .

# Login to GHCR
echo $GITHUB_TOKEN | docker login ghcr.io -u adminitbcomcy --password-stdin

# Push
docker push ghcr.io/adminitbcomcy/vexa-frontend:1.0.0
```

### 3. Create Frontend Helm Template

Create `helm/vexa-official/templates/frontend-deployment.yaml`:

```yaml
{{- if .Values.frontend.enabled -}}
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

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "vexa.fullname" . }}-frontend
  labels:
    {{- include "vexa.labels" . | nindent 4 }}
    app.kubernetes.io/component: frontend
spec:
  replicas: {{ .Values.frontend.replicaCount }}
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
      {{- if .Values.imagePullSecrets }}
      imagePullSecrets:
        {{- toYaml .Values.imagePullSecrets | nindent 8 }}
      {{- end }}
      containers:
        - name: frontend
          image: "{{ .Values.global.imageRegistry }}/{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}"
          imagePullPolicy: {{ .Values.global.imagePullPolicy }}
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          env:
            - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
              valueFrom:
                secretKeyRef:
                  name: {{ include "vexa.fullname" . }}-secrets
                  key: clerk-publishable-key
            - name: CLERK_SECRET_KEY
              valueFrom:
                secretKeyRef:
                  name: {{ include "vexa.fullname" . }}-secrets
                  key: clerk-secret-key
            - name: CLERK_WEBHOOK_SECRET
              valueFrom:
                secretKeyRef:
                  name: {{ include "vexa.fullname" . }}-secrets
                  key: clerk-webhook-secret
            - name: VEXA_ADMIN_API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: {{ include "vexa.fullname" . }}-secrets
                  key: admin-api-token
            - name: NEXT_PUBLIC_VEXA_API_URL
              value: "https://{{ .Values.global.domain }}"
            - name: NEXT_PUBLIC_VEXA_WS_URL
              value: "wss://{{ .Values.global.domain }}/ws"
            - name: NEXT_PUBLIC_APP_URL
              value: "https://{{ .Values.global.domain }}"
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
            {{- toYaml .Values.frontend.resources | nindent 12 }}
{{- end }}
```

### 4. Update custom-values.yaml

Add frontend configuration:

```yaml
frontend:
  enabled: true
  replicaCount: 2

  image:
    repository: vexa-frontend
    tag: "1.0.0"

  resources:
    requests:
      memory: 256Mi
      cpu: 100m
    limits:
      memory: 512Mi
      cpu: 500m
```

### 5. Update Ingress

Update `helm/vexa-official/templates/ingress.yaml` to add frontend route at the top:

```yaml
        - path: /
          pathType: Prefix
          service:
            name: vexa-frontend
            port: 3000
        - path: /api
          pathType: Prefix
          service:
            name: vexa-api-gateway
            port: 8000
```

### 6. Deploy

```bash
# On Kubernetes control plane
helm upgrade vexa /root/helm/vexa-official -n vexa -f /root/helm/custom-values.yaml

# Check status
kubectl get pods -n vexa | grep frontend
kubectl logs -n vexa -l app.kubernetes.io/component=frontend -f
```

---

## ✅ Verification Checklist

- [ ] Clerk Dashboard domain set to voice.axiomic.com.cy
- [ ] Webhook configured and secret copied
- [ ] Backend accepts Clerk JWT tokens
- [ ] User sync endpoint created
- [ ] Local testing successful
- [ ] Docker image built and pushed
- [ ] Kubernetes secrets added
- [ ] Helm chart deployed
- [ ] Frontend accessible at https://voice.axiomic.com.cy
- [ ] Sign in/up works in production
- [ ] User synced to database
- [ ] Protected routes work

---

## 🎉 You're Done!

Your Vexa.ai frontend with Clerk authentication is now configured for:
- **Local development**: http://localhost:3000
- **Production**: https://voice.axiomic.com.cy

**Next steps:**
1. Complete Clerk Dashboard configuration (Steps 1-6 above)
2. Test locally
3. Deploy to production
4. Verify authentication flow
