# Vexa.ai Official Helm Chart - Production Deployment Guide

🚀 **Complete Kubernetes deployment for Vexa.ai AI Meeting Transcription Platform**

**Cluster**: axiomic-voice (3 Control Planes + 2 Workers)
**Domain**: voice.axiomic.com.cy
**Created**: November 20, 2025

---

## 📋 Table of Contents

1. [What's Included](#whats-included)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Complete Installation Guide](#complete-installation-guide)
5. [Missing Templates - Copy-Paste Guide](#missing-templates)
6. [RunPod.io Whisper Proxy Implementation](#runpodio-whisper-proxy)
7. [Building Docker Images](#building-docker-images)
8. [Deployment](#deployment)
9. [Verification](#verification)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 What's Included

This Helm chart deploys the complete Vexa.ai platform:

### ✅ **Core Infrastructure** (Ready to Deploy)
- **PostgreSQL 15** - StatefulSet with 50Gi persistent storage
- **Redis 7** - StatefulSet with 10Gi persistent storage
- **API Gateway** - Deployment with autoscaling (2-10 replicas)
- **Ingress** - Nginx with TLS (Let's Encrypt)
- **ConfigMap** - Application configuration
- **Helpers** - Templating functions

### ⚠️ **Services to Complete** (Templates Provided Below)
- **Admin API** - User management
- **Bot Manager** - Meeting bot orchestration + RBAC
- **Transcription Collector** - Transcript aggregation
- **MCP** - Model Context Protocol
- **Whisper Proxy** - RunPod.io integration

---

## 📦 Prerequisites

### Cluster Requirements
- ✅ **Kubernetes 1.28+** (you have v1.34.0)
- ✅ **3 Control Planes + 2 Workers** (axiomic-voice cluster)
- ✅ **Longhorn** for persistent storage
- ✅ **Nginx Ingress Controller**
- ✅ **cert-manager** for TLS certificates

### External Services
- [ ] **RunPod.io Account** - Serverless GPU for Whisper
  - Create account: https://www.runpod.io
  - Create Serverless Endpoint with Whisper large-v3
  - Get API Key and Endpoint ID

### Tools Installed Locally
- `kubectl` configured for cluster
- `helm 3.x`
- `docker` (for building images)
- Access to a Docker registry (Docker Hub, GHCR, Harbor, etc.)

---

## 🚀 Quick Start

```bash
# 1. Create namespace
kubectl create namespace vexa

# 2. Create secrets
kubectl create secret generic vexa-secrets -n vexa \
  --from-literal=db-password=$(openssl rand -base64 32) \
  --from-literal=redis-password=$(openssl rand -base64 32) \
  --from-literal=admin-api-token=$(openssl rand -hex 32) \
  --from-literal=runpod-api-key='YOUR_RUNPOD_API_KEY' \
  --from-literal=openai-api-key='sk-...'  # Optional, for AI summaries

# 3. Edit values.yaml
# - Set global.imageRegistry to your Docker registry
# - Update ingress domain if needed
# - Configure RunPod endpoint ID

# 4. Install chart
helm install vexa . -n vexa -f values.yaml

# 5. Watch deployment
kubectl get pods -n vexa -w
```

---

## 📚 Complete Installation Guide

### Step 1: Build Docker Images

See [Building Docker Images](#building-docker-images) section below.

### Step 2: Create Kubernetes Secrets

```bash
export VEXA_NS=vexa

# Generate strong random passwords
export DB_PASSWORD=$(openssl rand -base64 32)
export REDIS_PASSWORD=$(openssl rand -base64 32)
export ADMIN_API_TOKEN=$(openssl rand -hex 32)

# Get your RunPod.io credentials
export RUNPOD_API_KEY="your-runpod-api-key"
export RUNPOD_ENDPOINT_ID="your-endpoint-id"

# Get OpenAI API key (for AI summaries)
export OPENAI_API_KEY="sk-..."

# Create secret
kubectl create secret generic vexa-secrets \
  --namespace=$VEXA_NS \
  --from-literal=db-password=$DB_PASSWORD \
  --from-literal=redis-password=$REDIS_PASSWORD \
  --from-literal=admin-api-token=$ADMIN_API_TOKEN \
  --from-literal=runpod-api-key=$RUNPOD_API_KEY \
  --from-literal=openai-api-key=$OPENAI_API_KEY

# Save credentials securely
cat > ~/vexa-credentials.txt <<EOF
DB_PASSWORD=$DB_PASSWORD
REDIS_PASSWORD=$REDIS_PASSWORD
ADMIN_API_TOKEN=$ADMIN_API_TOKEN
RUNPOD_API_KEY=$RUNPOD_API_KEY
EOF
chmod 600 ~/vexa-credentials.txt
```

### Step 3: Configure values.yaml

```bash
cd /Users/leonid/Documents/vexa-production/helm/vexa-official

# Edit values.yaml
vi values.yaml

# Key changes:
# 1. Set global.imageRegistry to your registry
# 2. Update whisperProxy.env.RUNPOD_ENDPOINT_ID
# 3. Verify ingress.hosts domain
```

### Step 4: Install Missing Templates

Complete the missing deployment templates using the patterns below (see [Missing Templates](#missing-templates)).

### Step 5: Deploy Helm Chart

```bash
# Dry-run to check
helm install vexa . -n vexa -f values.yaml --dry-run --debug

# Install
helm install vexa . -n vexa -f values.yaml

# Watch pods start
kubectl get pods -n vexa -w

# Check services
kubectl get svc -n vexa

# Check ingress
kubectl get ingress -n vexa
```

### Step 6: Run Database Migrations

```bash
# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/component=postgresql -n vexa --timeout=5m

# Run migrations (from admin-api pod)
kubectl exec -n vexa deployment/vexa-admin-api -- alembic upgrade head
```

### Step 7: Create Admin User

```bash
# Port-forward to admin-api
kubectl port-forward -n vexa svc/vexa-admin-api 8001:8001 &

# Get admin token
export ADMIN_TOKEN=$(kubectl get secret vexa-secrets -n vexa -o jsonpath='{.data.admin-api-token}' | base64 -d)

# Create first user
curl -X POST http://localhost:8001/admin/users \
  -H "X-Admin-API-Key: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@axiomic.com.cy",
    "name": "Administrator",
    "max_concurrent_bots": 10
  }'

# Response will include user_id - save it

# Generate API token for user
curl -X POST http://localhost:8001/admin/users/{user_id}/tokens \
  -H "X-Admin-API-Key: $ADMIN_TOKEN"

# Save the returned API token - users will use this to access Vexa API
```

---

## 🔨 Missing Templates

The following deployment templates follow the same pattern as `api-gateway-deployment.yaml`. Create them by copying and modifying:

### Template Pattern

Each service needs:
1. **Service** (ClusterIP)
2. **Deployment** with container spec
3. **HorizontalPodAutoscaler** (if autoscaling enabled)
4. **PodDisruptionBudget** (if PDB enabled)

### Admin API Deployment

**File**: `templates/admin-api-deployment.yaml`

```yaml
{{- if .Values.adminApi.enabled }}
apiVersion: v1
kind: Service
metadata:
  name: {{ include "vexa.fullname" . }}-admin-api
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "vexa.adminApi.labels" . | nindent 4 }}
spec:
  type: {{ .Values.adminApi.service.type }}
  ports:
    - port: {{ .Values.adminApi.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "vexa.adminApi.selectorLabels" . | nindent 4 }}
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "vexa.fullname" . }}-admin-api
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "vexa.adminApi.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.adminApi.replicaCount }}
  selector:
    matchLabels:
      {{- include "vexa.adminApi.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "vexa.adminApi.selectorLabels" . | nindent 8 }}
    spec:
      securityContext:
        {{- toYaml .Values.securityContext | nindent 8 }}
      containers:
        - name: admin-api
          image: "{{ include "vexa.imageRepository" .Values.adminApi.image }}:{{ .Values.adminApi.image.tag }}"
          imagePullPolicy: {{ .Values.global.imagePullPolicy }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          ports:
            - name: http
              containerPort: {{ .Values.adminApi.service.targetPort }}
          env:
            - name: LOG_LEVEL
              value: {{ .Values.adminApi.env.LOG_LEVEL | quote }}
            - name: ADMIN_API_TOKEN
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.secrets.existingSecret }}
                  key: admin-api-token
            - name: DB_HOST
              value: {{ .Values.adminApi.env.DB_HOST | quote }}
            - name: DB_PORT
              value: {{ .Values.adminApi.env.DB_PORT | quote }}
            - name: DB_NAME
              value: {{ .Values.adminApi.env.DB_NAME | quote }}
            - name: DB_USER
              value: {{ .Values.adminApi.env.DB_USER | quote }}
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.secrets.existingSecret }}
                  key: db-password
          resources:
            {{- toYaml .Values.adminApi.resources | nindent 12 }}
          livenessProbe:
            {{- toYaml .Values.healthChecks.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.healthChecks.readinessProbe | nindent 12 }}
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
---
{{- if .Values.adminApi.autoscaling.enabled }}
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: {{ include "vexa.fullname" . }}-admin-api
  namespace: {{ .Release.Namespace }}
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: {{ include "vexa.fullname" . }}-admin-api
  minReplicas: {{ .Values.adminApi.autoscaling.minReplicas }}
  maxReplicas: {{ .Values.adminApi.autoscaling.maxReplicas }}
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: {{ .Values.adminApi.autoscaling.targetCPUUtilizationPercentage }}
{{- end }}
{{- end }}
```

### Bot Manager Deployment + RBAC

**File**: `templates/bot-manager-deployment.yaml`

```yaml
{{- if .Values.botManager.enabled }}
---
# ServiceAccount for creating Jobs
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ include "vexa.fullname" . }}-bot-manager
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "vexa.botManager.labels" . | nindent 4 }}
---
# Role with permissions to manage Jobs
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ include "vexa.fullname" . }}-bot-manager
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "vexa.botManager.labels" . | nindent 4 }}
rules:
  - apiGroups: ["batch"]
    resources: ["jobs"]
    verbs: ["create", "get", "list", "watch", "delete", "patch"]
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/log"]
    verbs: ["get"]
---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ include "vexa.fullname" . }}-bot-manager
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "vexa.botManager.labels" . | nindent 4 }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ include "vexa.fullname" . }}-bot-manager
subjects:
  - kind: ServiceAccount
    name: {{ include "vexa.fullname" . }}-bot-manager
    namespace: {{ .Release.Namespace }}
---
# Service
apiVersion: v1
kind: Service
metadata:
  name: {{ include "vexa.fullname" . }}-bot-manager
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "vexa.botManager.labels" . | nindent 4 }}
spec:
  type: {{ .Values.botManager.service.type }}
  ports:
    - port: {{ .Values.botManager.service.port }}
      targetPort: http
      protocol: TCP
      name: http
  selector:
    {{- include "vexa.botManager.selectorLabels" . | nindent 4 }}
---
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ include "vexa.fullname" . }}-bot-manager
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "vexa.botManager.labels" . | nindent 4 }}
spec:
  replicas: {{ .Values.botManager.replicaCount }}
  selector:
    matchLabels:
      {{- include "vexa.botManager.selectorLabels" . | nindent 6 }}
  template:
    metadata:
      labels:
        {{- include "vexa.botManager.selectorLabels" . | nindent 8 }}
    spec:
      serviceAccountName: {{ include "vexa.fullname" . }}-bot-manager
      securityContext:
        {{- toYaml .Values.securityContext | nindent 8 }}
      containers:
        - name: bot-manager
          image: "{{ include "vexa.imageRepository" .Values.botManager.image }}:{{ .Values.botManager.image.tag }}"
          imagePullPolicy: {{ .Values.global.imagePullPolicy }}
          securityContext:
            {{- toYaml .Values.containerSecurityContext | nindent 12 }}
          ports:
            - name: http
              containerPort: {{ .Values.botManager.service.targetPort }}
          env:
            - name: LOG_LEVEL
              value: {{ .Values.botManager.env.LOG_LEVEL | quote }}
            - name: BOT_IMAGE
              value: {{ .Values.botManager.env.BOT_IMAGE | quote }}
            - name: BOT_NAMESPACE
              value: {{ .Values.botManager.env.BOT_NAMESPACE | quote }}
            - name: DB_HOST
              value: {{ .Values.botManager.env.DB_HOST | quote }}
            - name: DB_PORT
              value: {{ .Values.botManager.env.DB_PORT | quote }}
            - name: DB_NAME
              value: {{ .Values.botManager.env.DB_NAME | quote }}
            - name: DB_USER
              value: {{ .Values.botManager.env.DB_USER | quote }}
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.secrets.existingSecret }}
                  key: db-password
            - name: REDIS_HOST
              value: {{ .Values.botManager.env.REDIS_HOST | quote }}
            - name: REDIS_PORT
              value: {{ .Values.botManager.env.REDIS_PORT | quote }}
            - name: REDIS_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.secrets.existingSecret }}
                  key: redis-password
            - name: CELERY_BROKER_URL
              value: {{ .Values.botManager.env.CELERY_BROKER_URL | quote }}
            - name: CELERY_RESULT_BACKEND
              value: {{ .Values.botManager.env.CELERY_RESULT_BACKEND | quote }}
          resources:
            {{- toYaml .Values.botManager.resources | nindent 12 }}
          livenessProbe:
            {{- toYaml .Values.healthChecks.livenessProbe | nindent 12 }}
          readinessProbe:
            {{- toYaml .Values.healthChecks.readinessProbe | nindent 12 }}
          volumeMounts:
            - name: tmp
              mountPath: /tmp
      volumes:
        - name: tmp
          emptyDir: {}
{{- end }}
```

### Transcription Collector, MCP, Whisper Proxy

For these services, follow the same pattern as `admin-api-deployment.yaml` but:
- Replace service names (transcription-collector, mcp, whisper-proxy)
- Update labels using corresponding helper functions
- Adjust environment variables based on `values.yaml`

**Copy-Paste Template**:
```bash
# Copy api-gateway-deployment.yaml as starting point
cp templates/api-gateway-deployment.yaml templates/transcription-collector-deployment.yaml

# Then find/replace:
# apiGateway → transcriptionCollector
# api-gateway → transcription-collector
# Update port numbers and env vars based on values.yaml
```

---

## 🌐 RunPod.io Whisper Proxy

The Whisper Proxy service acts as a bridge between Vexa.ai and RunPod.io Serverless GPU inference.

### RunPod.io Setup

1. **Create Account**: https://www.runpod.io
2. **Navigate to Serverless** → Create Endpoint
3. **Select Template**: "Whisper" or custom Docker image
4. **Configuration**:
   - Model: `large-v3`
   - Min Workers: 0
   - Max Workers: 3
   - GPU Type: A4000 or better
5. **Deploy** and note:
   - Endpoint ID (e.g., `abc123-whisper-v3`)
   - API Key

### Whisper Proxy Implementation

**File**: `services/whisper-proxy/Dockerfile`

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
RUN pip install --no-cache-dir \
    fastapi==0.104.1 \
    uvicorn[standard]==0.24.0 \
    httpx==0.25.1 \
    websockets==12.0 \
    redis==5.0.1 \
    pydantic==2.5.0

# Copy application code
COPY whisper_proxy.py .

EXPOSE 9090 9091

CMD ["uvicorn", "whisper_proxy:app", "--host", "0.0.0.0", "--port", "9090"]
```

**File**: `services/whisper-proxy/whisper_proxy.py`

```python
"""
Vexa.ai Whisper Proxy - RunPod.io Integration
Proxies audio streams to RunPod Serverless GPU for Whisper transcription
"""
import os
import json
import asyncio
import logging
from typing import Optional

import httpx
import redis.asyncio as aioredis
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

# Configuration
RUNPOD_API_KEY = os.getenv("RUNPOD_API_KEY")
RUNPOD_ENDPOINT_ID = os.getenv("RUNPOD_ENDPOINT_ID")
RUNPOD_API_URL = f"https://api.runpod.ai/v2/{RUNPOD_ENDPOINT_ID}/runsync"

REDIS_HOST = os.getenv("REDIS_HOST", "vexa-redis-master")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
REDIS_STREAM_NAME = os.getenv("REDIS_STREAM_NAME", "transcription_segments")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

logging.basicConfig(level=LOG_LEVEL)
logger = logging.getLogger(__name__)

app = FastAPI(title="Vexa Whisper Proxy")

# Redis connection pool
redis_client: Optional[aioredis.Redis] = None


class TranscriptionRequest(BaseModel):
    audio_base64: str
    language: str = "auto"
    task: str = "transcribe"


@app.on_event("startup")
async def startup():
    global redis_client
    redis_client = await aioredis.from_url(
        f"redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}",
        decode_responses=True
    )
    logger.info("Connected to Redis")


@app.on_event("shutdown")
async def shutdown():
    if redis_client:
        await redis_client.close()


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.post("/transcribe")
async def transcribe_audio(request: TranscriptionRequest):
    """HTTP endpoint for audio transcription"""
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            RUNPOD_API_URL,
            headers={
                "Authorization": f"Bearer {RUNPOD_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "input": {
                    "audio": request.audio_base64,
                    "model": "large-v3",
                    "language": request.language if request.language != "auto" else None,
                    "task": request.task
                }
            }
        )

        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)

        result = response.json()
        return result


@app.websocket("/ws")
async def websocket_transcription(websocket: WebSocket):
    """
    WebSocket endpoint for real-time audio streaming
    Receives audio chunks, sends to RunPod, publishes to Redis stream
    """
    await websocket.accept()
    logger.info("WebSocket client connected")

    try:
        while True:
            # Receive audio chunk from client
            data = await websocket.receive_json()

            # Extract audio and metadata
            audio_base64 = data.get("audio")
            session_id = data.get("session_id")
            meeting_id = data.get("meeting_id")
            language = data.get("language", "auto")

            if not audio_base64:
                await websocket.send_json({"error": "Missing audio data"})
                continue

            # Send to RunPod for transcription
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    RUNPOD_API_URL,
                    headers={
                        "Authorization": f"Bearer {RUNPOD_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "input": {
                            "audio": audio_base64,
                            "model": "large-v3",
                            "language": language if language != "auto" else None,
                            "task": "transcribe",
                            "return_timestamps": "word"
                        }
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    transcription = result.get("output", {})

                    # Publish to Redis stream for transcription-collector
                    segment = {
                        "session_id": session_id,
                        "meeting_id": meeting_id,
                        "text": transcription.get("text", ""),
                        "language": transcription.get("language", language),
                        "segments": json.dumps(transcription.get("segments", []))
                    }

                    await redis_client.xadd(REDIS_STREAM_NAME, segment)

                    # Send confirmation back to client
                    await websocket.send_json({
                        "status": "success",
                        "transcription": transcription
                    })
                else:
                    logger.error(f"RunPod API error: {response.status_code} - {response.text}")
                    await websocket.send_json({
                        "status": "error",
                        "message": "Transcription failed"
                    })

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.exception(f"WebSocket error: {e}")
        await websocket.close()
```

---

## 🐳 Building Docker Images

### Structure

You need to build 7 Docker images from the Vexa.ai repository:

```bash
cd /Users/leonid/Documents/vexa-production/vexa-source

# Set your Docker registry
export REGISTRY="your-registry.com"  # e.g., "registry.axiomic.com.cy" or "docker.io/youruser"

# Build all images
docker build -t $REGISTRY/vexa-api-gateway:1.0.0 -f services/api-gateway/Dockerfile services/api-gateway
docker build -t $REGISTRY/vexa-admin-api:1.0.0 -f services/admin-api/Dockerfile services/admin-api
docker build -t $REGISTRY/vexa-bot-manager:1.0.0 -f services/bot-manager/Dockerfile services/bot-manager
docker build -t $REGISTRY/vexa-transcription-collector:1.0.0 -f services/transcription-collector/Dockerfile services/transcription-collector
docker build -t $REGISTRY/vexa-mcp:1.0.0 -f services/mcp/Dockerfile services/mcp
docker build -t $REGISTRY/vexa-bot:1.0.0 -f services/vexa-bot/core/Dockerfile services/vexa-bot/core

# Build Whisper Proxy (custom)
cd /Users/leonid/Documents/vexa-production/services/whisper-proxy
docker build -t $REGISTRY/vexa-whisper-proxy:1.0.0 .

# Push all images
docker push $REGISTRY/vexa-api-gateway:1.0.0
docker push $REGISTRY/vexa-admin-api:1.0.0
docker push $REGISTRY/vexa-bot-manager:1.0.0
docker push $REGISTRY/vexa-transcription-collector:1.0.0
docker push $REGISTRY/vexa-mcp:1.0.0
docker push $REGISTRY/vexa-bot:1.0.0
docker push $REGISTRY/vexa-whisper-proxy:1.0.0
```

---

## 📥 Deployment

### Full Deployment

```bash
# Navigate to Helm chart
cd /Users/leonid/Documents/vexa-production/helm/vexa-official

# Update values.yaml with your registry
sed -i '' "s|\${REGISTRY}|$REGISTRY|g" values.yaml

# Install
helm install vexa . -n vexa -f values.yaml

# Or upgrade if already installed
helm upgrade vexa . -n vexa -f values.yaml
```

### Verification Commands

```bash
# Check pods
kubectl get pods -n vexa

# Check services
kubectl get svc -n vexa

# Check ingress
kubectl get ingress -n vexa

# Check PVCs
kubectl get pvc -n vexa

# Check logs
kubectl logs -n vexa deployment/vexa-api-gateway -f
kubectl logs -n vexa deployment/vexa-admin-api -f
kubectl logs -n vexa deployment/vexa-bot-manager -f

# Test database connection
kubectl exec -n vexa deployment/vexa-api-gateway -- pg_isready -h vexa-postgresql -p 5432 -U vexa

# Test Redis connection
kubectl exec -n vexa deployment/vexa-api-gateway -- redis-cli -h vexa-redis-master -p 6379 -a $REDIS_PASSWORD ping
```

---

## ✅ Verification

### Test API Endpoints

```bash
# Get Ingress IP
export INGRESS_IP=$(kubectl get ingress -n vexa vexa -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Add to /etc/hosts (or configure DNS)
echo "$INGRESS_IP voice.axiomic.com.cy" | sudo tee -a /etc/hosts

# Test health endpoint
curl https://voice.axiomic.com.cy/api/health

# Test admin API
curl https://voice.axiomic.com.cy/admin/users \
  -H "X-Admin-API-Key: $ADMIN_TOKEN"
```

### Test WebSocket

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c wss://voice.axiomic.com.cy/ws?api_key=YOUR_USER_API_TOKEN

# Send ping
> {"action": "ping"}

# Should receive:
< {"event": "pong"}
```

### Test Meeting Bot

```bash
# Create a test Google Meet
# Get meeting code (e.g., xxx-xxxx-xxx)

# Start bot
curl -X POST https://voice.axiomic.com.cy/api/bots \
  -H "X-API-Key: YOUR_USER_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "google_meet",
    "native_meeting_id": "xxx-xxxx-xxx"
  }'

# Check bot status
curl https://voice.axiomic.com.cy/api/bots/status \
  -H "X-API-Key: YOUR_USER_API_TOKEN"

# Monitor bot logs
kubectl logs -n vexa -l job-name=vexa-bot-xxx -f
```

---

## 🐛 Troubleshooting

### Pods Not Starting

```bash
# Describe pod
kubectl describe pod -n vexa POD_NAME

# Check events
kubectl get events -n vexa --sort-by='.lastTimestamp'

# Check logs
kubectl logs -n vexa POD_NAME
```

### Database Connection Issues

```bash
# Check PostgreSQL pod
kubectl get pod -n vexa -l app.kubernetes.io/component=postgresql

# Check PostgreSQL logs
kubectl logs -n vexa statefulset/vexa-postgresql

# Test connection from api-gateway
kubectl exec -n vexa deployment/vexa-api-gateway -- \
  pg_isready -h vexa-postgresql -p 5432 -U vexa
```

### Ingress Not Working

```bash
# Check Ingress status
kubectl describe ingress -n vexa vexa

# Check Nginx Ingress Controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Check TLS certificate
kubectl get certificate -n vexa
kubectl describe certificate -n vexa vexa-tls
```

### RunPod.io Integration Issues

```bash
# Check Whisper Proxy logs
kubectl logs -n vexa deployment/vexa-whisper-proxy -f

# Test RunPod endpoint manually
curl -X POST https://api.runpod.ai/v2/$RUNPOD_ENDPOINT_ID/runsync \
  -H "Authorization: Bearer $RUNPOD_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": {"audio": "test", "model": "large-v3"}}'
```

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ All pods are Running
- ✅ PostgreSQL and Redis StatefulSets are healthy
- ✅ Ingress has external IP assigned
- ✅ Health endpoints return 200 OK
- ✅ WebSocket connection works
- ✅ Admin API can create users
- ✅ Meeting bot can be started
- ✅ Transcription flows through RunPod.io

---

## 📚 Next Steps

1. **Deploy Frontend** - See `/Users/leonid/Documents/vexa-production/frontend/README.md`
2. **Configure DNS** - Point `voice.axiomic.com.cy` to Ingress IP
3. **Set up Monitoring** - Prometheus + Grafana
4. **Configure Backups** - Longhorn snapshots + etcd backups
5. **Load Testing** - Test with multiple concurrent meetings

---

**Built with** ❤️ for production deployment on axiomic-voice Kubernetes cluster
**Date**: November 20, 2025
**Version**: 1.0.0
