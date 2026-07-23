#!/usr/bin/env bash
set -euo pipefail

NAMESPACE="asesoria-inmobiliaria"
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

kubectl delete ingress n8n -n "$NAMESPACE" --ignore-not-found
kubectl delete -f "$SCRIPT_DIR/11-n8n.yaml" --ignore-not-found
kubectl delete job n8n-db-init -n "$NAMESPACE" --ignore-not-found

echo "n8n fue retirado, pero el PVC, PV, base de datos y Secret se conservaron para evitar pérdida de información."
echo "No elimine esos recursos salvo que desee borrar n8n permanentemente."
