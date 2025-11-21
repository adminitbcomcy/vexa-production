{{/*
Expand the name of the chart.
*/}}
{{- define "vexa.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "vexa.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "vexa.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "vexa.labels" -}}
helm.sh/chart: {{ include "vexa.chart" . }}
{{ include "vexa.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "vexa.selectorLabels" -}}
app.kubernetes.io/name: {{ include "vexa.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "vexa.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "vexa.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
PostgreSQL connection string
*/}}
{{- define "vexa.postgresqlUrl" -}}
{{- if .Values.postgresql.enabled }}
postgresql://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ include "vexa.fullname" . }}-postgresql:{{ .Values.postgresql.primary.service.ports.postgresql }}/{{ .Values.postgresql.auth.database }}
{{- else }}
{{- .Values.externalDatabase.url }}
{{- end }}
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "vexa.redisUrl" -}}
{{- if .Values.redis.enabled }}
redis://:{{ .Values.redis.auth.password }}@{{ include "vexa.fullname" . }}-redis-master:{{ .Values.redis.master.service.ports.redis }}/0
{{- else }}
{{- .Values.externalRedis.url }}
{{- end }}
{{- end }}

{{/*
Image repository with registry (Bitnami pattern)
Usage: {{ include "vexa.imageRepository" (dict "imageRoot" .Values.apiGateway.image "global" .Values.global) }}
*/}}
{{- define "vexa.imageRepository" -}}
{{- $registryName := default .imageRoot.registry ((.global).imageRegistry) -}}
{{- $repositoryName := .imageRoot.repository -}}
{{- $separator := ":" -}}
{{- $termination := .imageRoot.tag | toString -}}
{{- if .imageRoot.digest }}
    {{- $separator = "@" -}}
    {{- $termination = .imageRoot.digest | toString -}}
{{- end -}}
{{- if $registryName }}
    {{- printf "%s/%s%s%s" $registryName $repositoryName $separator $termination -}}
{{- else -}}
    {{- printf "%s%s%s"  $repositoryName $separator $termination -}}
{{- end -}}
{{- end }}

{{/*
API Gateway labels
*/}}
{{- define "vexa.apiGateway.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: api-gateway
{{- end }}

{{- define "vexa.apiGateway.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: api-gateway
{{- end }}

{{/*
Admin API labels
*/}}
{{- define "vexa.adminApi.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: admin-api
{{- end }}

{{- define "vexa.adminApi.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: admin-api
{{- end }}

{{/*
Bot Manager labels
*/}}
{{- define "vexa.botManager.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: bot-manager
{{- end }}

{{- define "vexa.botManager.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: bot-manager
{{- end }}

{{/*
Transcription Collector labels
*/}}
{{- define "vexa.transcriptionCollector.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: transcription-collector
{{- end }}

{{- define "vexa.transcriptionCollector.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: transcription-collector
{{- end }}

{{/*
Whisper Proxy labels
*/}}
{{- define "vexa.whisperProxy.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: whisper-proxy
{{- end }}

{{- define "vexa.whisperProxy.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: whisper-proxy
{{- end }}

{{/*
MCP labels
*/}}
{{- define "vexa.mcp.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: mcp
{{- end }}

{{- define "vexa.mcp.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: mcp
{{- end }}

{{/*
PostgreSQL labels
*/}}
{{- define "vexa.postgresql.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: postgresql
{{- end }}

{{- define "vexa.postgresql.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: postgresql
{{- end }}

{{/*
Redis labels
*/}}
{{- define "vexa.redis.labels" -}}
{{ include "vexa.labels" . }}
app.kubernetes.io/component: redis
{{- end }}

{{- define "vexa.redis.selectorLabels" -}}
{{ include "vexa.selectorLabels" . }}
app.kubernetes.io/component: redis
{{- end }}
