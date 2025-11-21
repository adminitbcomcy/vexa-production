# Vexa.ai Frontend Setup Instructions

## ✅ What Has Been Created

### Core Configuration Files
- ✅ `middleware.ts` - Clerk authentication + next-intl
- ✅ `.env.local.example` - Environment variables template
- ✅ `app/layout.tsx` - Root layout with Clerk, Theme, Query providers
- ✅ `app/globals.css` - Tailwind + shadcn/ui styles

### Providers
- ✅ `providers/query-provider.tsx` - TanStack Query setup
- ✅ `providers/theme-provider.tsx` - Dark mode support
- ✅ `providers/api-auth-provider.tsx` - Clerk token injection into API client

### API Integration
- ✅ `lib/api/client.ts` - Axios client with Clerk Bearer token authentication
- ✅ `lib/api/meetings.ts` - All meeting API functions
- ✅ `lib/utils.ts` - Utility functions (cn)

### Hooks
- ✅ `hooks/use-meetings.ts` - TanStack Query hooks for meetings

### Components
- ✅ `components/ui/sonner.tsx` - Toast notifications
- ✅ `components/meetings/meeting-card.tsx` - Meeting card component (already existed)

### Pages & Layouts
- ✅ `app/page.tsx` - Root redirect
- ✅ `app/[locale]/page.tsx` - Locale redirect
- ✅ `app/[locale]/(auth)/sign-in/[[...sign-in]]/page.tsx` - Sign in page
- ✅ `app/[locale]/(auth)/sign-up/[[...sign-up]]/page.tsx` - Sign up page
- ✅ `app/[locale]/(dashboard)/layout.tsx` - Dashboard layout with header
- ✅ `app/api/webhooks/clerk/route.ts` - Clerk webhook for user sync

---

## 🚀 Next Steps to Complete Frontend

### 1. Install Dependencies

```bash
cd /Users/leonid/Documents/vexa-production/frontend

# Install all packages
npm install

# Initialize shadcn/ui
npx shadcn@latest init

# Add required shadcn components
npx shadcn@latest add button card input tabs scroll-area skeleton \
  badge dialog dropdown-menu label select separator table toast sonner
```

### 2. Configure Environment Variables

Create `.env.local` from example:

```bash
cp .env.local.example .env.local
```

Then add your Clerk keys:
1. Go to https://clerk.com
2. Create new application "Vexa.ai"
3. Copy API keys to `.env.local`
4. Add webhook secret for user sync

### 3. Create Meetings Page

**File**: `app/[locale]/(dashboard)/meetings/page.tsx`

```typescript
'use client';

import { useMeetings } from '@/hooks/use-meetings';
import { MeetingCard } from '@/components/meetings/meeting-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function MeetingsPage({ params }: { params: { locale: string } }) {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useMeetings({ search: search || undefined });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Meetings</h1>
          <p className="text-muted-foreground mt-1">
            View and manage your recorded meetings
          </p>
        </div>

        <Link href={`/${params.locale}/record`}>
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Start Recording
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Meetings Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : data && data.meetings.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} locale={params.locale} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No meetings found</p>
        </div>
      )}
    </div>
  );
}
```

### 4. Create Record Page (Start Recording)

**File**: `app/[locale]/(dashboard)/record/page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useCreateBot } from '@/hooks/use-meetings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function RecordPage({ params }: { params: { locale: string } }) {
  const router = useRouter();
  const [platform, setPlatform] = useState<'google_meet' | 'teams' | 'zoom'>('google_meet');
  const [meetingUrl, setMeetingUrl] = useState('');

  const createBot = useCreateBot();

  const handleStartRecording = async () => {
    if (!meetingUrl) {
      toast.error('Please enter a meeting URL');
      return;
    }

    try {
      await createBot.mutateAsync({
        meeting_url: meetingUrl,
        platform,
      });

      toast.success('Bot started successfully!');
      router.push(`/${params.locale}/meetings`);
    } catch (error) {
      toast.error('Failed to start recording');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Start Recording</h1>
        <p className="text-muted-foreground mt-1">
          Enter meeting details to start recording
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-lg space-y-6">
        <div className="space-y-2">
          <Label>Platform</Label>
          <Select value={platform} onValueChange={(v: any) => setPlatform(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="google_meet">Google Meet</SelectItem>
              <SelectItem value="teams">Microsoft Teams</SelectItem>
              <SelectItem value="zoom">Zoom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Meeting URL</Label>
          <Input
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
          />
        </div>

        <Button
          onClick={handleStartRecording}
          disabled={createBot.isPending}
          className="w-full"
          size="lg"
        >
          {createBot.isPending ? 'Starting...' : 'Start Recording'}
        </Button>
      </div>
    </div>
  );
}
```

### 5. Create Settings Page

**File**: `app/[locale]/(dashboard)/settings/page.tsx`

```typescript
export default function SettingsPage() {
  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-4xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-lg shadow-lg">
        <p className="text-muted-foreground">Settings page - Coming soon</p>
      </div>
    </div>
  );
}
```

### 6. Build Docker Image

**File**: `Dockerfile`

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 7. Build and Push Image

```bash
# Build
docker build -t ghcr.io/adminitbcomcy/vexa-frontend:1.0.0 .

# Push
docker push ghcr.io/adminitbcomcy/vexa-frontend:1.0.0
```

### 8. Create Helm Chart

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
          image: "{{ include "vexa.imageRepository" (dict "imageRoot" .Values.frontend.image "global" .Values.global) }}"
          imagePullPolicy: {{ .Values.global.imagePullPolicy }}
          ports:
            - name: http
              containerPort: 3000
              protocol: TCP
          env:
            - name: NEXT_PUBLIC_VEXA_API_URL
              value: "https://{{ .Values.global.domain }}"
            - name: NEXT_PUBLIC_VEXA_WS_URL
              value: "wss://{{ .Values.global.domain }}/ws"
            - name: NEXT_PUBLIC_APP_URL
              value: "https://{{ .Values.global.domain }}"
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

### 9. Update custom-values.yaml

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

  autoscaling:
    enabled: true
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70
```

### 10. Update Ingress

Update `helm/vexa-official/templates/ingress.yaml` to add frontend route:

```yaml
        - path: /
          pathType: Prefix
          service:
            name: vexa-frontend
            port: 3000
```

---

## 🎯 Deployment Summary

1. ✅ Configure Clerk (https://clerk.com)
2. ✅ Add Clerk API keys to Kubernetes secret
3. ✅ Build and push Docker image
4. ✅ Update Helm chart with frontend
5. ✅ Deploy with: `helm upgrade vexa helm/vexa-official -n vexa -f helm/custom-values.yaml`

---

## 📝 Clerk Configuration Steps

1. Create account at https://clerk.com
2. Create application "Vexa.ai"
3. Get API keys from Dashboard → API Keys
4. Configure webhooks:
   - URL: `https://voice.axiomic.com.cy/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
5. Add keys to Kubernetes:

```bash
kubectl patch secret vexa-secrets -n vexa \
  --type='json' \
  -p='[
    {"op": "add", "path": "/data/clerk-publishable-key", "value": "'$(echo -n "pk_test_..." | base64)'"},
    {"op": "add", "path": "/data/clerk-secret-key", "value": "'$(echo -n "sk_test_..." | base64)'"},
    {"op": "add", "path": "/data/clerk-webhook-secret", "value": "'$(echo -n "whsec_..." | base64)'"}
  ]'
```

---

**All critical files created! Ready for development and deployment!** 🚀
