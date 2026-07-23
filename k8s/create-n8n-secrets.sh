#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="asesoria-inmobiliaria"
SECRET_NAME="n8n-secrets"
SECRETS_FILE="/root/asesoria-inmobiliaria-n8n-secrets.env"

kubectl get namespace "$NAMESPACE" >/dev/null

umask 077

if kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" >/dev/null 2>&1; then
  echo "El Secret $SECRET_NAME ya existe; se conservarán la contraseña y la llave de cifrado actuales."
  N8N_DB_USER="$(kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.N8N_DB_USER}' | base64 -d)"
  N8N_DB_PASSWORD="$(kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.N8N_DB_PASSWORD}' | base64 -d)"
  N8N_DB_DATABASE="$(kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.N8N_DB_DATABASE}' | base64 -d)"
  N8N_ENCRYPTION_KEY="$(kubectl -n "$NAMESPACE" get secret "$SECRET_NAME" -o jsonpath='{.data.N8N_ENCRYPTION_KEY}' | base64 -d)"
else
  N8N_DB_USER="n8n"
  N8N_DB_DATABASE="n8n"
  N8N_DB_PASSWORD="$(openssl rand -hex 32)"
  N8N_ENCRYPTION_KEY="$(openssl rand -hex 64)"

  kubectl -n "$NAMESPACE" create secret generic "$SECRET_NAME" \
    --from-literal=N8N_DB_USER="$N8N_DB_USER" \
    --from-literal=N8N_DB_PASSWORD="$N8N_DB_PASSWORD" \
    --from-literal=N8N_DB_DATABASE="$N8N_DB_DATABASE" \
    --from-literal=N8N_ENCRYPTION_KEY="$N8N_ENCRYPTION_KEY"
fi

cat > "$SECRETS_FILE" <<VARS
N8N_DB_USER=${N8N_DB_USER}
N8N_DB_PASSWORD=${N8N_DB_PASSWORD}
N8N_DB_DATABASE=${N8N_DB_DATABASE}
N8N_ENCRYPTION_KEY=${N8N_ENCRYPTION_KEY}
VARS

chmod 600 "$SECRETS_FILE"
echo "Secret de n8n disponible. Copia local protegida: $SECRETS_FILE"
echo "No cambies ni elimines N8N_ENCRYPTION_KEY después de guardar credenciales en n8n."
