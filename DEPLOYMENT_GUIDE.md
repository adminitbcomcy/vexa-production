# Vexa.ai Complete Deployment Guide

**Date**: November 20, 2025
**Cluster**: axiomic-voice (3 Control Planes + 2 Workers)
**Domain**: voice.axiomic.com.cy

---

## Overview

This guide provides complete step-by-step instructions for deploying the Vexa.ai AI meeting transcription platform on your production Kubernetes cluster.

### Architecture

**Backend**: 7 microservices
- **api-gateway**: FastAPI REST + WebSocket API (port 8000)
- **admin-api**: User management and authentication (port 8001)
- **bot-manager**: Orchestrates meeting bots (port 8002)
- **transcription-collector**: Aggregates transcripts (port 8003)
- **mcp**: Model Context Protocol server (port 18888)
- **vexa-bot**: Meeting capture bot (Kubernetes Jobs)
- **whisper-proxy**: RunPod.io GPU transcription (port 8080)

**Infrastructure**:
- PostgreSQL 15 (50Gi persistent storage)
- Redis 7 (10Gi persistent storage)
- Longhorn distributed storage
- Nginx Ingress with TLS
- KEDA for autoscaling

**Frontend**: Next.js 15 + shadcn/ui premium dashboard

---

## Prerequisites

### Cluster Requirements

✅ **Kubernetes**: v1.34.0 (Your cluster: axiomic-voice)
✅ **Nodes**: 3 Control Planes + 2 Workers (40 vCPU, 120GB RAM total)
✅ **CNI**: Calico v3.28.0
✅ **Storage**: Longhorn (needs installation)
✅ **Ingress**: Nginx Ingress Controller (needs installation)
✅ **Autoscaling**: KEDA (needs installation)

### Tools Required

Install on your local machine:

```bash
# kubectl
curl -LO "https://dl.k8s.io/release/v1.34.0/bin/darwin/amd64/kubectl"
chmod +x kubectl && sudo mv kubectl /usr/local/bin/

# Helm 3
brew install helm

# Optional: k9s for cluster visualization
brew install k9s
```

### Access Configuration

Configure kubectl to access your cluster:

```bash
# From CP-1, copy admin kubeconfig
scp root@212.47.66.31:/etc/kubernetes/admin.conf ~/.kube/config-axiomic-voice

# Set as current context
export KUBECONFIG=~/.kube/config-axiomic-voice

# Verify access
kubectl get nodes
# Should show all 5 nodes as Ready
```

### External Services Required

1. **RunPod.io Account**: For GPU-based Whisper transcription
   - Sign up: https://www.runpod.io
   - Create Serverless Endpoint with Whisper large-v3
   - Note: API Key and Endpoint ID

2. **Clerk Account** (for frontend): For authentication
   - Sign up: https://clerk.com
   - Create application, note API keys

3. **OpenAI Account** (optional): For MCP AI features
   - API key from https://platform.openai.com

4. **Docker Registry**: To push built images
   - DockerHub, GitHub Container Registry, or private registry

---

## Phase 1: Infrastructure Setup

### 1.1 Install Longhorn (Distributed Storage)

```bash
# Add Longhorn Helm repo
helm repo add longhorn https://charts.longhorn.io
helm repo update

# Install Longhorn
helm install longhorn longhorn/longhorn \
  --namespace longhorn-system \
  --create-namespace \
  --set defaultSettings.defaultDataPath="/var/lib/longhorn" \
  --set persistence.defaultClassReplicaCount=2

# Verify installation (wait for all pods Running)
kubectl get pods -n longhorn-system -w

# Set Longhorn as default StorageClass
kubectl patch storageclass longhorn -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

### 1.2 Install Nginx Ingress Controller

```bash
# Add Nginx Helm repo
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

# Install Nginx Ingress
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=30080 \
  --set controller.service.nodePorts.https=30443

# Verify installation
kubectl get pods -n ingress-nginx -w
kubectl get svc -n ingress-nginx
```

**Configure DNS**: Point `voice.axiomic.com.cy` to your cluster nodes (212.47.66.31, 212.47.66.35, or 212.47.66.29).

### 1.3 Install cert-manager (TLS Certificates)

```bash
# Add cert-manager Helm repo
helm repo add jetstack https://charts.jetstack.io
helm repo update

# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.crds.yaml

helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --version v1.13.0

# Create Let's Encrypt ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com  # CHANGE THIS
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
      - http01:
          ingress:
            class: nginx
EOF
```

### 1.4 Install KEDA (Event-Driven Autoscaling)

```bash
# Add KEDA Helm repo
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

# Install KEDA
helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace

# Verify installation
kubectl get pods -n keda -w
```

---

## Phase 2: Build Docker Images

### 2.1 Clone Vexa.ai Source

The source is already cloned at `/Users/leonid/Documents/vexa-production/vexa-source`.

### 2.2 Build All Images

Create build script:

```bash
cd /Users/leonid/Documents/vexa-production/vexa-source

# Set your Docker registry
export DOCKER_REGISTRY="your-registry"  # e.g., "ghcr.io/your-username" or "your-dockerhub-username"
export IMAGE_TAG="1.0.0"

# Build all service images
docker build -t ${DOCKER_REGISTRY}/vexa-api-gateway:${IMAGE_TAG} -f services/api-gateway/Dockerfile .
docker build -t ${DOCKER_REGISTRY}/vexa-admin-api:${IMAGE_TAG} -f services/admin-api/Dockerfile .
docker build -t ${DOCKER_REGISTRY}/vexa-bot-manager:${IMAGE_TAG} -f services/bot-manager/Dockerfile .
docker build -t ${DOCKER_REGISTRY}/vexa-transcription-collector:${IMAGE_TAG} -f services/transcription-collector/Dockerfile .
docker build -t ${DOCKER_REGISTRY}/vexa-mcp:${IMAGE_TAG} -f services/mcp/Dockerfile .
docker build -t ${DOCKER_REGISTRY}/vexa-bot:${IMAGE_TAG} -f services/vexa-bot/Dockerfile .

# Push all images
docker push ${DOCKER_REGISTRY}/vexa-api-gateway:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/vexa-admin-api:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/vexa-bot-manager:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/vexa-transcription-collector:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/vexa-mcp:${IMAGE_TAG}
docker push ${DOCKER_REGISTRY}/vexa-bot:${IMAGE_TAG}
```

### 2.3 Build Whisper Proxy Image

The implementation is in `/Users/leonid/Documents/vexa-production/helm/vexa-official/README.md` (complete Python code provided).

```bash
cd /Users/leonid/Documents/vexa-production/helm/vexa-official

# Create whisper-proxy directory structure (follow README instructions)
mkdir -p whisper-proxy
# Copy code from README.md into whisper-proxy/whisper_proxy.py
# Create Dockerfile and requirements.txt (templates in README)

# Build and push
docker build -t ${DOCKER_REGISTRY}/vexa-whisper-proxy:${IMAGE_TAG} -f whisper-proxy/Dockerfile whisper-proxy/
docker push ${DOCKER_REGISTRY}/vexa-whisper-proxy:${IMAGE_TAG}
```

---

## Phase 3: Deploy Vexa.ai Backend

### 3.1 Prepare values.yaml

```bash
cd /Users/leonid/Documents/vexa-production/helm/vexa-official

# Copy values.yaml to custom-values.yaml
cp values.yaml custom-values.yaml
```

Edit `custom-values.yaml`:

```yaml
global:
  domain: voice.axiomic.com.cy
  imageRegistry: "your-registry/"  # e.g., "ghcr.io/your-username/"
  storageClass: longhorn

# Update all image repositories
apiGateway:
  image:
    repository: vexa-api-gateway
    tag: "1.0.0"

adminApi:
  image:
    repository: vexa-admin-api
    tag: "1.0.0"

# ... repeat for all services

# CRITICAL: Configure secrets section
secrets:
  jwtSecret: "your-strong-jwt-secret-here"  # Generate: openssl rand -hex 32
  runpodApiKey: "your-runpod-api-key"
  runpodEndpointId: "your-runpod-endpoint-id"
  openaiApiKey: "sk-..."  # Optional

  # Optional: Platform OAuth credentials
  googleMeet:
    clientId: ""
    clientSecret: ""
  teams:
    clientId: ""
    clientSecret: ""
  zoom:
    clientId: ""
    clientSecret: ""

# Database passwords
postgresql:
  auth:
    username: vexa
    password: "your-strong-db-password"  # Generate strong password

redis:
  auth:
    password: "your-strong-redis-password"  # Generate strong password
```

### 3.2 Deploy Helm Chart

```bash
# Create namespace
kubectl create namespace vexa

# Validate chart
helm lint . -f custom-values.yaml

# Dry-run to check rendered templates
helm install vexa . \
  --namespace vexa \
  --values custom-values.yaml \
  --dry-run --debug

# Deploy!
helm install vexa . \
  --namespace vexa \
  --values custom-values.yaml
```

### 3.3 Verify Deployment

```bash
# Watch pods starting up
kubectl get pods -n vexa -w

# Check all services
kubectl get svc -n vexa

# Check ingress
kubectl get ingress -n vexa

# Check TLS certificate
kubectl get certificate -n vexa

# View logs
kubectl logs -n vexa -l app.kubernetes.io/component=api-gateway --tail=100 -f
```

**Expected pods** (wait for all Running):
- vexa-postgresql-0 (StatefulSet)
- vexa-redis-0 (StatefulSet)
- vexa-api-gateway-xxx-xxx (2+ replicas)
- vexa-admin-api-xxx-xxx
- vexa-bot-manager-xxx-xxx
- vexa-transcription-collector-xxx-xxx
- vexa-mcp-xxx-xxx
- vexa-whisper-proxy-xxx-xxx

### 3.4 Run Database Migrations

```bash
# Get PostgreSQL pod name
POSTGRES_POD=$(kubectl get pod -n vexa -l app.kubernetes.io/component=postgresql -o jsonpath='{.items[0].metadata.name}')

# Connect to PostgreSQL
kubectl exec -it -n vexa $POSTGRES_POD -- psql -U vexa -d vexa

# Run migrations (SQL commands from Vexa.ai source)
# The schema is in vexa-source/services/api-gateway/migrations/

# Or run migrations via API Gateway
API_POD=$(kubectl get pod -n vexa -l app.kubernetes.io/component=api-gateway -o jsonpath='{.items[0].metadata.name}')
kubectl exec -it -n vexa $API_POD -- python -m alembic upgrade head
```

### 3.5 Create Admin User

```bash
# Create admin user via API
kubectl run -it --rm curl --image=curlimages/curl -n vexa -- sh

# Inside pod:
curl -X POST https://voice.axiomic.com.cy/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-secure-password",
    "is_admin": true
  }'

# Save the returned API token!
```

---

## Phase 4: Deploy Frontend

### 4.1 Configure Environment

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Create .env.local
cat > .env.local <<EOF
# Vexa.ai API
NEXT_PUBLIC_VEXA_API_URL=https://voice.axiomic.com.cy/api
NEXT_PUBLIC_VEXA_WS_URL=wss://voice.axiomic.com.cy/ws

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/meetings
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/meetings

# App
NEXT_PUBLIC_APP_URL=https://voice.axiomic.com.cy
EOF
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Build Production Image

```bash
# Build frontend
docker build -t ${DOCKER_REGISTRY}/vexa-frontend:${IMAGE_TAG} .

# Push to registry
docker push ${DOCKER_REGISTRY}/vexa-frontend:${IMAGE_TAG}
```

### 4.4 Deploy Frontend to Kubernetes

Create `frontend-deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: vexa-frontend
  namespace: vexa
spec:
  replicas: 2
  selector:
    matchLabels:
      app: vexa-frontend
  template:
    metadata:
      labels:
        app: vexa-frontend
    spec:
      containers:
        - name: frontend
          image: your-registry/vexa-frontend:1.0.0
          ports:
            - containerPort: 3000
          env:
            - name: NEXT_PUBLIC_VEXA_API_URL
              value: "https://voice.axiomic.com.cy/api"
            - name: NEXT_PUBLIC_VEXA_WS_URL
              value: "wss://voice.axiomic.com.cy/ws"
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: vexa-frontend
  namespace: vexa
spec:
  selector:
    app: vexa-frontend
  ports:
    - port: 3000
      targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: vexa-frontend
  namespace: vexa
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - voice.axiomic.com.cy
      secretName: vexa-frontend-tls
  rules:
    - host: voice.axiomic.com.cy
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: vexa-frontend
                port:
                  number: 3000
```

Deploy:

```bash
kubectl apply -f frontend-deployment.yaml

# Verify
kubectl get pods -n vexa -l app=vexa-frontend
kubectl get ingress -n vexa vexa-frontend
```

---

## Phase 5: Testing & Verification

### 5.1 Health Checks

```bash
# Test API Gateway
curl https://voice.axiomic.com.cy/api/health

# Test all services health
for service in api-gateway admin-api bot-manager transcription-collector mcp whisper-proxy; do
  echo "Testing $service..."
  kubectl exec -n vexa -it $(kubectl get pod -n vexa -l app.kubernetes.io/component=$service -o jsonpath='{.items[0].metadata.name}') -- curl -s localhost:8000/health || echo "Port varies"
done
```

### 5.2 Create Test Bot

```bash
# Get API token from admin user creation
export VEXA_TOKEN="your-api-token"

# Create bot for Google Meet
curl -X POST https://voice.axiomic.com.cy/api/bots \
  -H "X-API-Key: $VEXA_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "google_meet",
    "native_meeting_id": "abc-defg-hij",
    "config": {
      "auto_join": true,
      "record_audio": true
    }
  }'

# Check bot status
kubectl get jobs -n vexa
kubectl get pods -n vexa | grep vexa-bot
```

### 5.3 Test WebSocket

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "wss://voice.axiomic.com.cy/ws?api_key=$VEXA_TOKEN"

# Subscribe to meeting
> {"action": "subscribe", "meetings": [{"platform": "google_meet", "native_id": "abc-defg-hij"}]}

# Should receive: {"event": "subscribed", "data": {"meeting_ids": ["..."]}}

# Wait for transcription events:
# {"event": "transcript.mutable", "data": {...}}
```

### 5.4 Test Frontend

1. Open browser: https://voice.axiomic.com.cy
2. Sign up with Clerk authentication
3. Navigate to Meetings Library
4. Click "Start Recording" and test bot creation
5. View meeting detail page with live transcription

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod status
kubectl describe pod -n vexa <pod-name>

# Check logs
kubectl logs -n vexa <pod-name> --previous

# Common issues:
# 1. Image pull errors: Check imageRegistry in values.yaml
# 2. Secret not found: Verify secrets in custom-values.yaml
# 3. PVC pending: Check Longhorn installation
```

### Database Connection Errors

```bash
# Check PostgreSQL logs
kubectl logs -n vexa vexa-postgresql-0

# Test connection from api-gateway
kubectl exec -n vexa -it $(kubectl get pod -n vexa -l app.kubernetes.io/component=api-gateway -o jsonpath='{.items[0].metadata.name}') -- sh
> apt-get update && apt-get install -y postgresql-client
> psql -h vexa-postgresql -U vexa -d vexa
```

### Ingress Not Working

```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller --tail=100 -f

# Check certificate status
kubectl describe certificate -n vexa vexa-tls

# Check DNS resolution
nslookup voice.axiomic.com.cy
```

### RunPod.io Errors

```bash
# Check whisper-proxy logs
kubectl logs -n vexa -l app.kubernetes.io/component=whisper-proxy --tail=100 -f

# Test RunPod.io API directly
curl -X POST https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}/run \
  -H "Authorization: Bearer ${RUNPOD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"input": {"audio": "base64-encoded-audio", "model": "large-v3"}}'
```

---

## Monitoring & Maintenance

### View Cluster Resources

```bash
# All Vexa resources
kubectl get all -n vexa

# Storage usage
kubectl get pvc -n vexa

# HPA status
kubectl get hpa -n vexa

# Top pods by resource usage
kubectl top pods -n vexa
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment vexa-api-gateway -n vexa --replicas=5

# View autoscaling metrics
kubectl describe hpa -n vexa vexa-api-gateway
```

### Backup Database

```bash
# PostgreSQL backup
kubectl exec -n vexa vexa-postgresql-0 -- pg_dump -U vexa vexa > vexa-backup-$(date +%Y%m%d).sql

# Restore
kubectl exec -i -n vexa vexa-postgresql-0 -- psql -U vexa vexa < vexa-backup-20251120.sql
```

### Upgrade

```bash
# Update images in custom-values.yaml
# Set new image tags

# Upgrade Helm release
helm upgrade vexa /Users/leonid/Documents/vexa-production/helm/vexa-official \
  --namespace vexa \
  --values custom-values.yaml

# Rollback if needed
helm rollback vexa -n vexa
```

---

## Security Considerations

1. **Secrets Management**: Consider using Kubernetes External Secrets Operator or HashiCorp Vault
2. **Network Policies**: Implement Calico network policies to restrict pod-to-pod communication
3. **RBAC**: Review and tighten bot-manager ServiceAccount permissions
4. **TLS**: Ensure all services use TLS (already configured in Ingress)
5. **API Keys**: Rotate JWT secrets, RunPod API keys, and database passwords regularly
6. **Updates**: Keep Docker images updated with security patches

---

## Next Steps

### Production Hardening

1. **Monitoring Stack**: Install Prometheus + Grafana
   ```bash
   helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
   helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
   ```

2. **Log Aggregation**: Install Loki + Promtail
   ```bash
   helm repo add grafana https://grafana.github.io/helm-charts
   helm install loki grafana/loki-stack -n logging --create-namespace
   ```

3. **Backups**: Set up automated etcd and PostgreSQL backups
4. **Disaster Recovery**: Document and test cluster recovery procedures
5. **Load Testing**: Test with high concurrent meeting bot loads
6. **Cost Optimization**: Monitor RunPod.io usage and optimize Whisper model size

### Feature Development

1. Complete remaining frontend components (see `FRONTEND_IMPLEMENTATION.md`)
2. Implement AI Chat interface
3. Add meeting analytics dashboard
4. Implement action item tracking
5. Add calendar integrations (Google Calendar, Outlook)

---

## Support & Documentation

- **Backend Helm Chart**: `/Users/leonid/Documents/vexa-production/helm/vexa-official/README.md`
- **Frontend Guide**: `/Users/leonid/Documents/vexa-production/frontend/FRONTEND_IMPLEMENTATION.md`
- **Kubernetes Cluster**: `/Users/leonid/Documents/contabo/CLAUDE.md`
- **Vexa.ai Source**: `/Users/leonid/Documents/vexa-production/vexa-source/`

---

**End of Deployment Guide**
*Last Updated: November 20, 2025*
