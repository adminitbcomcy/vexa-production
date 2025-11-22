# Kubernetes Cluster Restore Guide

**Last Updated**: November 22, 2025
**Cluster**: axiomic-voice (5-node Kubernetes v1.34.0)
**Repository**: https://github.com/adminitbcomcy/vexa-production

---

## Overview

This directory contains complete configuration snapshots of the production Kubernetes cluster. All configurations were exported on November 22, 2025 and can be used to restore cluster state.

## Directory Structure

```
k8s-cluster-state/
├── RESTORE_GUIDE.md           # This file
├── metallb/                    # MetalLB LoadBalancer configurations
│   ├── metallb-ipaddresspool.yaml
│   ├── metallb-l2advertisement.yaml
│   └── metallb-deployments.yaml
├── ingress-nginx/              # Nginx Ingress Controller
│   ├── ingress-nginx-deployment.yaml
│   └── ingress-nginx-services.yaml
├── vexa/                       # Vexa.ai application namespace
│   ├── vexa-deployments.yaml  # All microservice deployments
│   ├── vexa-services.yaml     # All services
│   ├── vexa-secrets.yaml      # Secrets (SENSITIVE!)
│   ├── vexa-configmaps.yaml   # ConfigMaps
│   ├── vexa-pvcs.yaml         # Persistent Volume Claims
│   └── vexa-ingress.yaml      # Ingress routing
└── system-configs/             # System-level configurations
    ├── haproxy.cfg             # HAProxy load balancer config (control planes)
    ├── calico-networkpolicies.yaml
    └── (additional system configs)
```

---

## Prerequisites for Restore

### 1. Cluster Infrastructure

You must have a running Kubernetes cluster with:
- **Kubernetes v1.34.0** (or compatible version)
- **CNI**: Calico v3.28.0 installed
- **3 Control Plane nodes** + 2 Worker nodes
- **Public IPs**: 212.47.66.31, 212.47.66.35, 212.47.66.29, 212.47.66.33, 212.47.66.27

### 2. Required Components

Before restoring applications, ensure these are installed:

```bash
# MetalLB v0.15.2
kubectl apply -f https://raw.githubusercontent.com/metallb/metallb/v0.15.2/config/manifests/metallb-native.yaml

# Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml

# Longhorn (for persistent storage)
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/v1.7.2/deploy/longhorn.yaml
```

---

## Restore Procedure

### Step 1: Restore MetalLB Configuration

MetalLB provides LoadBalancer service type support for bare-metal clusters.

```bash
# Apply IPAddressPool (public IP 212.47.66.31)
kubectl apply -f k8s-cluster-state/metallb/metallb-ipaddresspool.yaml

# Apply L2Advertisement (ARP-based)
kubectl apply -f k8s-cluster-state/metallb/metallb-l2advertisement.yaml

# Verify
kubectl get ipaddresspools -n metallb-system
kubectl get l2advertisements -n metallb-system
```

**Expected Output**:
```
NAME             AUTO ASSIGN   AVAILABLE IPS
public-ip-pool   true          212.47.66.31/32
```

### Step 2: Restore Ingress-Nginx Configuration

Patch the Ingress Controller service to use LoadBalancer type:

```bash
# Apply service configuration (LoadBalancer type with external IP)
kubectl apply -f k8s-cluster-state/ingress-nginx/ingress-nginx-services.yaml

# Verify external IP assignment
kubectl get svc -n ingress-nginx ingress-nginx-controller
```

**Expected Output**:
```
NAME                       TYPE           EXTERNAL-IP      PORTS
ingress-nginx-controller   LoadBalancer   212.47.66.31     80:32744/TCP,443:32137/TCP
```

### Step 3: Create Vexa Namespace

```bash
kubectl create namespace vexa
```

### Step 4: Restore Secrets (CRITICAL!)

⚠️ **IMPORTANT**: Secrets contain sensitive data (database passwords, API keys, etc.)

```bash
# Apply secrets FIRST (other resources depend on them)
kubectl apply -f k8s-cluster-state/vexa/vexa-secrets.yaml
```

### Step 5: Restore ConfigMaps

```bash
kubectl apply -f k8s-cluster-state/vexa/vexa-configmaps.yaml
```

### Step 6: Restore Persistent Volume Claims

```bash
# Apply PVCs (Longhorn will provision volumes)
kubectl apply -f k8s-cluster-state/vexa/vexa-pvcs.yaml

# Wait for all PVCs to be Bound
kubectl get pvc -n vexa
```

**Expected PVCs**:
- `postgresql-data` (10Gi)
- `redis-data` (5Gi)

### Step 7: Restore Services

```bash
# Apply all services
kubectl apply -f k8s-cluster-state/vexa/vexa-services.yaml

# Verify
kubectl get svc -n vexa
```

**Expected Services**:
- frontend (ClusterIP, port 3000)
- vexa-api-gateway (ClusterIP, port 8000)
- vexa-admin-api, bot-manager, mcp, transcription-collector
- postgresql (ClusterIP, port 5432)
- redis (ClusterIP, port 6379)
- whisper-proxy (ClusterIP, port 9090)

### Step 8: Restore Deployments

```bash
# Apply all deployments
kubectl apply -f k8s-cluster-state/vexa/vexa-deployments.yaml

# Monitor deployment progress
kubectl get pods -n vexa -w
```

**Wait for all pods to reach Running/Ready state** (this may take 5-10 minutes).

### Step 9: Restore Ingress

```bash
# Apply ingress routing rules
kubectl apply -f k8s-cluster-state/vexa/vexa-ingress.yaml

# Verify
kubectl get ingress -n vexa
```

**Expected Ingress**:
- Host: `voice.axiomic.com.cy`
- Paths: `/api`, `/admin`, `/ws`, `/`
- ADDRESS: Should show control plane IPs

### Step 10: Verify Complete Restore

```bash
# Check all pods are running
kubectl get pods -n vexa

# Check services have endpoints
kubectl get endpoints -n vexa

# Test external access
curl -I http://voice.axiomic.com.cy/
# Should return: HTTP/1.1 308 Permanent Redirect (to HTTPS)

curl -skI https://voice.axiomic.com.cy/
# Should return: HTTP/2 200 (or Clerk redirect if not authenticated)
```

---

## System-Level Configuration (Manual)

Some configurations require manual setup on cluster nodes:

### HAProxy (Control Plane Nodes Only)

HAProxy provides VIP 10.0.0.100 for kube-apiserver high availability.

**Apply on**: CP-1 (212.47.66.31), CP-2 (212.47.66.35), CP-3 (212.47.66.29)

```bash
# On each control plane node:
scp k8s-cluster-state/system-configs/haproxy.cfg root@<node-ip>:/etc/haproxy/
systemctl restart haproxy
systemctl enable haproxy
```

### Firewalld Configuration

**NOTE**: Currently firewalld is STOPPED on all nodes to avoid conflicts with MetalLB and pod networking.

**To re-enable securely**:

```bash
# On all 5 nodes:
firewall-cmd --permanent --zone=trusted --add-interface=cali+
firewall-cmd --permanent --zone=trusted --add-interface=tunl+
firewall-cmd --permanent --zone=public --add-port=80/tcp
firewall-cmd --permanent --zone=public --add-port=443/tcp
firewall-cmd --reload
systemctl start firewalld
```

---

## Critical Notes

### 1. Secrets Management

**⚠️ SECURITY WARNING**: `vexa-secrets.yaml` contains:
- PostgreSQL password
- Redis password (URL-encoded: `cqbd1jZlC94YwddNbi33fJG`)
- Clerk API keys
- GitHub Container Registry credentials

**DO NOT commit this file to public repositories!** It is gitignored.

### 2. Database Persistence

If restoring to a **new cluster**, PostgreSQL PVC will be empty. You'll need to:
1. Restore database schema: Run migrations
2. Or restore from backup

### 3. Frontend Environment Variables

Frontend deployment requires these secrets:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`
- `VEXA_ADMIN_API_TOKEN`

These are stored in `vexa-secrets.yaml`.

### 4. Docker Image Availability

All deployments reference images from `ghcr.io/adminitbcomcy/*`. Ensure:
- Images are pushed to GitHub Container Registry
- `imagePullSecrets: [name: ghcr-secret]` is configured
- Secret `ghcr-secret` exists in `vexa` namespace (included in vexa-secrets.yaml)

### 5. DNS Configuration

Ensure DNS A record exists:
```
voice.axiomic.com.cy  →  212.47.66.31
```

---

## Troubleshooting

### Pods Stuck in Pending

**Symptom**: Pods show status "Pending"

**Check**:
```bash
kubectl describe pod <pod-name> -n vexa
```

**Common Causes**:
- PVCs not bound (check Longhorn installation)
- Node resources exhausted
- ImagePullBackOff (check imagePullSecrets)

### LoadBalancer Service Has No External-IP

**Symptom**: `kubectl get svc -n ingress-nginx` shows `<pending>`

**Fix**:
```bash
# Verify MetalLB is running
kubectl get pods -n metallb-system

# Check IPAddressPool
kubectl get ipaddresspool -n metallb-system public-ip-pool -o yaml

# Check MetalLB logs
kubectl logs -n metallb-system -l app=metallb
```

### 502 Bad Gateway on External Access

**Symptom**: `curl https://voice.axiomic.com.cy/` returns 502

**Causes**:
1. Frontend pods not ready
2. Service endpoints empty
3. Ingress misconfigured

**Debug**:
```bash
# Check frontend pods
kubectl get pods -n vexa -l app.kubernetes.io/component=frontend

# Check service endpoints
kubectl get endpoints -n vexa frontend
# Should show pod IPs (e.g., 10.244.24.197:3000)

# Check ingress
kubectl describe ingress -n vexa
```

### Frontend Shows "Internal Server Error"

**Symptom**: Page loads but shows error

**Common Causes**:
1. Clerk webhook URL not configured
2. API Gateway unreachable
3. Database connection failed

**Debug**:
```bash
# Check frontend logs
kubectl logs -n vexa -l app.kubernetes.io/component=frontend --tail=50

# Check API Gateway logs
kubectl logs -n vexa -l app.kubernetes.io/name=vexa-api-gateway --tail=50

# Check database connectivity
kubectl exec -it -n vexa <frontend-pod> -- curl http://postgresql:5432
```

---

## Backup Strategy (Recommended)

To maintain ability to restore in the future:

### 1. Automated Snapshot Script

Create a cron job to export cluster state weekly:

```bash
#!/bin/bash
# /usr/local/bin/backup-cluster-state.sh

export KUBECONFIG=/etc/kubernetes/admin.conf
BACKUP_DIR="/backup/k8s-$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Export all configurations
kubectl get all -A -o yaml > "$BACKUP_DIR/all-resources.yaml"
kubectl get secrets -A -o yaml > "$BACKUP_DIR/all-secrets.yaml"
kubectl get pvc -A -o yaml > "$BACKUP_DIR/all-pvcs.yaml"

# Compress and upload to external storage
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR"
# scp to backup server...
```

### 2. Database Backups

```bash
# PostgreSQL backup
kubectl exec -n vexa <postgresql-pod> -- pg_dumpall -U postgres > backup.sql

# Or use Velero for automated cluster backups
```

---

## Contact & Support

- **Repository**: https://github.com/adminitbcomcy/vexa-production
- **Cluster Domain**: voice.axiomic.com.cy
- **Documentation**: See CLAUDE.md for detailed cluster history

---

**Last Export Date**: November 22, 2025
**Cluster Version**: Kubernetes v1.34.0
**Total Configurations**: 19 YAML files (868KB)
