#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="asesoria-inmobiliaria"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="n8n.asesoriainmobiliariajb.com"

kubectl get namespace "$NAMESPACE" >/dev/null
kubectl -n "$NAMESPACE" get service postgres-service >/dev/null
kubectl -n traefik get service traefik >/dev/null

mkdir -p /var/lib/asesoria-inmobiliaria/n8n
chown -R 1000:1000 /var/lib/asesoria-inmobiliaria/n8n
chmod 700 /var/lib/asesoria-inmobiliaria/n8n

bash "$SCRIPT_DIR/create-n8n-secrets.sh"
kubectl apply -f "$SCRIPT_DIR/09-n8n-storage.yaml"

kubectl delete job n8n-db-init \
  -n "$NAMESPACE" \
  --ignore-not-found
kubectl apply -f "$SCRIPT_DIR/10-n8n-db-init.yaml"
kubectl wait --for=condition=complete \
  job/n8n-db-init \
  -n "$NAMESPACE" \
  --timeout=300s
kubectl logs job/n8n-db-init -n "$NAMESPACE"

kubectl apply -f "$SCRIPT_DIR/11-n8n.yaml"
kubectl apply -f "$SCRIPT_DIR/07-ingress.yaml"
kubectl rollout status deployment/n8n \
  -n "$NAMESPACE" \
  --timeout=600s

kubectl get deployment,pod,service,ingress,pvc \
  -n "$NAMESPACE" \
  -o wide

printf '\nPrueba directa por Traefik:\n'
curl --fail --silent --show-error --head \
  -H "Host: ${DOMAIN}" \
  http://127.0.0.1:30080/ || true

printf '\nn8n quedó instalado en Kubernetes. Continúe con la configuración Nginx/TLS de INSTALAR_N8N.md.\n'
