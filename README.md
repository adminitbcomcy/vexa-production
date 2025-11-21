# Vexa.ai Production Platform

> Enterprise-grade AI meeting assistant SaaS platform (Fireflies.ai/tl;dv/Jamie.ai level) deployed on HA Kubernetes cluster (Rocky Linux 9)

## Overview

Complete production-ready platform featuring:
- **Backend**: Vexa.ai (API, Redis, PostgreSQL, WebSocket, Whisper GPU transcription, Playwright bots)
- **Frontend**: Premium Next.js 15 UI with shadcn/ui (dark mode, real-time updates, PWA)
- **Infrastructure**: HA Kubernetes (3 control planes + 2 workers) on Rocky Linux 9
- **Storage**: Longhorn distributed block storage
- **Autoscaling**: KEDA event-driven scaling
- **GPU**: NVIDIA Operator for Whisper transcription

## Architecture

### Cluster Topology
```
5 Contabo VPS Nodes (8 vCPU, 24GB RAM, 200GB NVMe each):
├── Control Plane 1: 212.47.66.31 (10.0.0.2) - MASTER
├── Control Plane 2: 212.47.66.35 (10.0.0.1) - BACKUP
├── Control Plane 3: 212.47.66.29 (10.0.0.4) - BACKUP
├── Worker 1: 212.47.66.33 (10.0.0.3)
└── Worker 2: 212.47.66.27 (10.0.0.5)

VIP: 10.0.0.100 (HAProxy + Keepalived for API server HA)
```

### Network Design
- **eth0**: Public internet (212.47.64.0/21)
- **eth1**: Private cluster VLAN (10.0.0.0/22)
- **CNI**: Calico v3.28.0 (configured for eth1)
- **Ingress**: Nginx Ingress Controller with TLS

### Application Stack
```
┌─────────────────────────────────────────┐
│         Frontend (Next.js 15)           │
│   - Meetings Library                    │
│   - Transcript Timeline                 │
│   - AI Summary Dashboard                │
│   - Real-time WebSocket Updates         │
│   - shadcn/ui + Tailwind + Framer      │
└─────────────────────────────────────────┘
                    ↓ REST + WebSocket
┌─────────────────────────────────────────┐
│          Vexa.ai Backend                │
├─────────────────────────────────────────┤
│ - API Server (FastAPI)                  │
│ - WebSocket Gateway (real-time)         │
│ - Whisper GPU Workers (transcription)   │
│ - Playwright Bots (meeting capture)     │
│ - Redis (queue + cache)                 │
│ - PostgreSQL (metadata)                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Infrastructure Services            │
├─────────────────────────────────────────┤
│ - Longhorn (storage)                    │
│ - KEDA (autoscaling)                    │
│ - NVIDIA GPU Operator                   │
│ - Prometheus + Grafana (monitoring)     │
└─────────────────────────────────────────┘
```

## Quick Start

### Prerequisites
- 5-node Kubernetes cluster already running (see `/Users/leonid/Documents/contabo/` for setup)
- kubectl configured with admin access
- Helm 3.x installed
- Ansible installed locally

### Step 1: Complete Cluster Setup (if needed)

If CP-2, CP-3, or workers not yet joined:

```bash
cd ansible/
ansible-playbook -i inventory/hosts.yml site.yml
```

This will:
- Verify cluster state
- Join remaining control plane nodes
- Join worker nodes
- Verify Calico CNI
- Label nodes appropriately

### Step 2: Install Infrastructure Services

```bash
# Install Longhorn storage
helm repo add longhorn https://charts.longhorn.io
helm install longhorn longhorn/longhorn \
  --namespace longhorn-system \
  --create-namespace \
  -f helm/longhorn/values.yaml

# Install KEDA autoscaling
helm repo add kedacore https://kedacore.github.io/charts
helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace \
  -f helm/keda/values.yaml

# Install NVIDIA GPU Operator (for Whisper)
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator-system \
  --create-namespace \
  -f helm/gpu-operator/values.yaml

# Install Nginx Ingress Controller
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  -f helm/nginx-ingress/values.yaml
```

### Step 3: Deploy Vexa.ai Backend

```bash
# Create namespace
kubectl create namespace vexa

# Install Vexa.ai
helm install vexa ./helm/vexa \
  --namespace vexa \
  -f helm/vexa/values.yaml
```

Wait for all pods to be ready:
```bash
kubectl get pods -n vexa -w
```

### Step 4: Deploy Frontend

```bash
# Build frontend Docker image
cd frontend/
docker build -t vexa-frontend:latest .

# Load image to cluster nodes (or push to registry)
# Then deploy
helm install frontend ./helm/frontend \
  --namespace vexa \
  -f helm/frontend/values.yaml
```

### Step 5: Access the Application

Get Ingress IP:
```bash
kubectl get ingress -n vexa
```

Add to `/etc/hosts`:
```
<INGRESS_IP> vexa.local
```

Open browser: `https://vexa.local`

## Development

### Frontend Development

```bash
cd frontend/
npm install
npm run dev
```

Open `http://localhost:3000`

Environment variables (`.env.local`):
```env
VEXA_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

### Vexa.ai Configuration

Edit `helm/vexa/values.yaml` for:
- Resource limits
- GPU allocation
- Whisper model size
- Autoscaling thresholds
- API keys

## Features

### Frontend Features
✅ **Meetings Library** - Grid view with search, filters, tags
✅ **Transcript Timeline** - Speaker-separated, timestamped, searchable
✅ **AI Summary** - Overview, Key Decisions, Action Items, Questions, Highlights
✅ **AI Chat** - Query meeting context ("What were Ivan's action items?")
✅ **Real-time Updates** - WebSocket for live transcription progress
✅ **Dark Mode** - System preference + manual toggle
✅ **i18n** - Russian + English
✅ **PWA** - Install as mobile/desktop app
✅ **Export** - PDF/Markdown summaries
✅ **Share** - Generate public meeting links

### Backend Features
✅ **Meeting Capture** - Playwright bots join Zoom/Meet/Teams
✅ **Transcription** - Whisper GPU (large-v3 model)
✅ **Speaker Diarization** - Identify individual speakers
✅ **AI Summarization** - GPT-4 for insights
✅ **Real-time Streaming** - WebSocket live transcription
✅ **Autoscaling** - KEDA scales workers based on queue depth
✅ **Persistent Storage** - Longhorn for recordings/transcripts

## Monitoring

Access Grafana dashboard:
```bash
kubectl port-forward -n monitoring svc/grafana 3000:80
```

Key metrics:
- Whisper GPU utilization
- Transcription queue depth
- API response times
- WebSocket connection count

## Scaling

### Horizontal Scaling
```bash
# Scale Whisper workers
kubectl scale deployment vexa-whisper-worker -n vexa --replicas=5

# KEDA autoscales based on Redis queue depth
# Configure in helm/vexa/templates/scaled-object.yaml
```

### Vertical Scaling
Edit `helm/vexa/values.yaml`:
```yaml
whisperWorker:
  resources:
    limits:
      nvidia.com/gpu: 1
      memory: 16Gi
      cpu: 4
```

Then upgrade:
```bash
helm upgrade vexa ./helm/vexa -n vexa -f helm/vexa/values.yaml
```

## Troubleshooting

### Check Vexa pods
```bash
kubectl get pods -n vexa
kubectl logs -n vexa deployment/vexa-api -f
```

### Check Whisper GPU allocation
```bash
kubectl describe node | grep nvidia.com/gpu
```

### Test WebSocket connection
```bash
wscat -c ws://vexa.local/ws/transcription/<meeting-id>
```

### Restart failed components
```bash
kubectl rollout restart deployment/vexa-api -n vexa
```

## Production Checklist

Before going live:

- [ ] Configure TLS certificates (Let's Encrypt)
- [ ] Set up database backups (Longhorn snapshots)
- [ ] Configure monitoring alerts (Prometheus)
- [ ] Set up log aggregation (Loki)
- [ ] Enable authentication (Clerk production keys)
- [ ] Configure rate limiting (Nginx Ingress)
- [ ] Set resource quotas per namespace
- [ ] Enable network policies (Calico)
- [ ] Configure backup retention policy
- [ ] Set up disaster recovery plan

## Repository Structure

```
vexa-production/
├── ansible/                     # Infrastructure automation
│   ├── site.yml                # Main playbook
│   ├── inventory/              # Cluster hosts
│   └── roles/                  # Ansible roles
├── helm/                       # Kubernetes deployments
│   ├── vexa/                   # Vexa.ai backend
│   ├── frontend/               # Next.js frontend
│   ├── longhorn/               # Storage
│   ├── keda/                   # Autoscaling
│   ├── gpu-operator/           # NVIDIA
│   └── nginx-ingress/          # Ingress controller
├── frontend/                   # Next.js 15 application
│   ├── app/                    # App Router pages
│   ├── components/             # React components
│   ├── lib/                    # API client, utils
│   ├── hooks/                  # Custom hooks
│   └── types/                  # TypeScript types
├── docs/                       # Documentation
└── README.md                   # This file
```

## License

MIT

## Support

For issues or questions, contact: support@vexa.ai
