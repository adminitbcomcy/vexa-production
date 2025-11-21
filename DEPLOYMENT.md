# Deployment Guide - Vexa.ai Production Platform

## Prerequisites

- Kubernetes cluster running (5 nodes, Rocky Linux 9)
- kubectl configured with cluster admin access
- Helm 3.x installed
- Ansible installed (for cluster completion)

## Step 1: Complete Cluster Setup

If CP-2, CP-3, or workers haven't joined yet:

```bash
cd ansible/
ansible-playbook -i inventory/hosts.yml site.yml
```

Verify all nodes are Ready:
```bash
kubectl get nodes
```

## Step 2: Install Infrastructure Services

### 2.1 Longhorn (Distributed Storage)

```bash
helm repo add longhorn https://charts.longhorn.io
helm repo update

helm install longhorn longhorn/longhorn \
  --namespace longhorn-system \
  --create-namespace \
  --set defaultSettings.defaultReplicaCount=3 \
  --set persistence.defaultClass=true \
  --set persistence.defaultClassReplicaCount=3
```

Wait for Longhorn to be ready:
```bash
kubectl -n longhorn-system get pods -w
```

### 2.2 KEDA (Autoscaling)

```bash
helm repo add kedacore https://kedacore.github.io/charts
helm repo update

helm install keda kedacore/keda \
  --namespace keda \
  --create-namespace
```

### 2.3 NVIDIA GPU Operator (for Whisper)

```bash
helm repo add nvidia https://helm.ngc.nvidia.com/nvidia
helm repo update

helm install gpu-operator nvidia/gpu-operator \
  --namespace gpu-operator-system \
  --create-namespace \
  --set driver.enabled=true \
  --set toolkit.enabled=true \
  --set devicePlugin.enabled=true
```

### 2.4 Nginx Ingress Controller

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=NodePort \
  --set controller.service.nodePorts.http=30080 \
  --set controller.service.nodePorts.https=30443
```

## Step 3: Deploy Vexa.ai Backend

### 3.1 Create namespace

```bash
kubectl create namespace vexa
```

### 3.2 Create secrets

```bash
kubectl create secret generic vexa-secrets \
  --namespace=vexa \
  --from-literal=openai-api-key='sk-...' \
  --from-literal=database-password='your-secure-password' \
  --from-literal=redis-password='your-redis-password'
```

### 3.3 Install Vexa Helm chart

Edit `helm/vexa/values.yaml` first:
- Set PostgreSQL and Redis passwords (must match secrets)
- Configure OpenAI API key
- Adjust resource limits as needed

```bash
helm install vexa ./helm/vexa \
  --namespace vexa \
  -f helm/vexa/values.yaml
```

### 3.4 Wait for all pods to be ready

```bash
kubectl get pods -n vexa -w
```

Expected pods:
- vexa-postgresql-0
- vexa-redis-master-0
- vexa-api-xxxxx (3 replicas)
- vexa-websocket-xxxxx (2 replicas)
- vexa-whisper-worker-xxxxx (2 replicas, if GPU available)
- vexa-playwright-bot-xxxxx (2 replicas)
- vexa-celery-worker-xxxxx (2 replicas)

## Step 4: Deploy Frontend

### 4.1 Build frontend Docker image

```bash
cd frontend/

# Build
docker build -t vexa-frontend:1.0.0 .

# Tag for your registry (if using one)
docker tag vexa-frontend:1.0.0 registry.example.com/vexa-frontend:1.0.0

# Push to registry
docker push registry.example.com/vexa-frontend:1.0.0
```

Or load directly to cluster nodes (if no registry):
```bash
docker save vexa-frontend:1.0.0 | ssh root@212.47.66.33 docker load
docker save vexa-frontend:1.0.0 | ssh root@212.47.66.27 docker load
```

### 4.2 Deploy frontend

Edit `helm/frontend/values.yaml`:
- Update image repository if using registry
- Configure Clerk API keys
- Set Vexa API URL

```bash
helm install frontend ./helm/frontend \
  --namespace vexa \
  -f helm/frontend/values.yaml
```

## Step 5: Configure DNS and Access

### 5.1 Get Ingress IP

```bash
kubectl get svc -n ingress-nginx
```

Note the NodePort for HTTP (usually 30080) and HTTPS (30443).

### 5.2 Configure DNS

Add DNS A records pointing to any cluster node public IP:
- `vexa.yourdomain.com` → 212.47.66.31 (or any node)
- `api.vexa.yourdomain.com` → 212.47.66.31

Or for local testing, add to `/etc/hosts`:
```
212.47.66.31 vexa.local api.vexa.local
```

### 5.3 Access the application

```
https://vexa.local:30443
```

## Step 6: Verify Deployment

### 6.1 Check all pods

```bash
kubectl get pods -A
```

### 6.2 Check Vexa API

```bash
curl -k https://vexa.local:30443/api/health
```

### 6.3 Check WebSocket

```bash
wscat -c wss://vexa.local:30443/ws
```

### 6.4 Access frontend

Open browser: `https://vexa.local:30443`

Expected screens:
- Login page (Clerk auth)
- Meetings library after login
- Functional meeting recording

## Troubleshooting

### Pods not starting

```bash
kubectl describe pod <pod-name> -n vexa
kubectl logs <pod-name> -n vexa --previous
```

### GPU not detected

```bash
kubectl describe nodes | grep nvidia.com/gpu
kubectl get pods -n gpu-operator-system
```

### Database connection issues

```bash
kubectl logs -n vexa deployment/vexa-api | grep -i database
kubectl exec -it -n vexa vexa-postgresql-0 -- psql -U vexa
```

### Ingress not working

```bash
kubectl get ingress -n vexa
kubectl describe ingress vexa-ingress -n vexa
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
```

## Scaling

### Scale Whisper workers

```bash
kubectl scale deployment vexa-whisper-worker -n vexa --replicas=5
```

### Scale API servers

```bash
kubectl scale deployment vexa-api -n vexa --replicas=5
```

### KEDA autoscaling

KEDA will automatically scale based on Redis queue depth (configured in values.yaml).

Monitor ScaledObjects:
```bash
kubectl get scaledobject -n vexa
kubectl describe scaledobject vexa-whisper-worker -n vexa
```

## Monitoring

### Check resource usage

```bash
kubectl top nodes
kubectl top pods -n vexa
```

### Longhorn dashboard

```bash
kubectl port-forward -n longhorn-system svc/longhorn-frontend 8080:80
```
Open: `http://localhost:8080`

### Prometheus/Grafana (if installed)

```bash
kubectl port-forward -n monitoring svc/grafana 3000:80
```
Open: `http://localhost:3000`

## Backup and Recovery

### Backup PostgreSQL

```bash
kubectl exec -n vexa vexa-postgresql-0 -- pg_dump -U vexa vexa > backup.sql
```

### Backup Longhorn volumes

Use Longhorn UI to create snapshots:
- Navigate to Volume
- Create Snapshot
- Export to S3 (configure backup target in Longhorn settings)

### Restore

```bash
cat backup.sql | kubectl exec -i -n vexa vexa-postgresql-0 -- psql -U vexa vexa
```

## Updating

### Update Vexa backend

```bash
helm upgrade vexa ./helm/vexa -n vexa -f helm/vexa/values.yaml
```

### Update frontend

```bash
# Build new image
docker build -t vexa-frontend:1.1.0 frontend/

# Update values.yaml with new tag
# Then upgrade
helm upgrade frontend ./helm/frontend -n vexa -f helm/frontend/values.yaml
```

## Production Checklist

Before going live:

- [ ] Change all default passwords in values.yaml
- [ ] Configure real domain names (not .local)
- [ ] Set up TLS certificates (Let's Encrypt via cert-manager)
- [ ] Enable Longhorn S3 backup
- [ ] Configure monitoring alerts
- [ ] Set up log aggregation (Loki/ELK)
- [ ] Enable network policies (Calico)
- [ ] Configure resource quotas
- [ ] Set up disaster recovery plan
- [ ] Perform load testing
- [ ] Configure rate limiting on Ingress
- [ ] Set up database replication (if needed)
- [ ] Document runbooks for common issues

## Support

For issues, check logs:
```bash
kubectl logs -n vexa <pod-name> --tail=100 -f
```

For support: support@vexa.ai
