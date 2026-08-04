#!/usr/bin/env bash
set -u

NS="${NS:-asesoria-inmobiliaria}"
DOMAIN="${DOMAIN:-asesoriainmobiliariajb.com}"

title() { printf '\n\n===== %s =====\n' "$1"; }
run() { printf '\n$ %q ' "$1"; shift; printf '%q ' "$@"; printf '\n'; "$@" 2>&1 || true; }

title "Pods, reinicios y estado"
kubectl get pods -n "$NS" -o wide || true

title "PVC y PV"
kubectl get pvc -n "$NS" || true
kubectl get pv | grep -E 'asesoria|minio|postgres|NAME' || true

title "Servicios, endpoints e ingress"
kubectl get svc,endpoints,ingress -n "$NS" -o wide || true

title "Eventos recientes"
kubectl get events -n "$NS" --sort-by=.lastTimestamp | tail -80 || true

title "Errores del frontend Next.js"
kubectl logs deployment/web -n "$NS" --tail=400 2>&1 \
  | grep -Ei 'Body exceeded|413|server action|invalid server actions|error|exception|oom|killed' \
  || true

title "Errores del API NestJS y MinIO"
kubectl logs deployment/api -n "$NS" --tail=400 2>&1 \
  | grep -Ei 'minio|s3|storage|ECONN|NoSuchKey|AccessDenied|Signature|error|exception|413' \
  || true

title "Logs de MinIO"
kubectl logs deployment/minio -n "$NS" --tail=250 2>&1 || true

title "Salud de MinIO desde el clúster"
POD="minio-health-$(date +%s)"
kubectl run "$POD" -n "$NS" --rm -i --restart=Never \
  --image=curlimages/curl:8.12.1 --command -- \
  curl -fsS -D - http://minio-service:9000/minio/health/live || true

title "Pruebas públicas"
for path in / /inmuebles /api/properties; do
  echo "--- https://${DOMAIN}${path}"
  curl -skS -o /dev/null -D - --max-time 20 "https://${DOMAIN}${path}" | head -20 || true
done

title "Errores de Nginx relacionados con tamaño o upstream"
if command -v journalctl >/dev/null 2>&1; then
  journalctl -u nginx -n 300 --no-pager 2>&1 \
    | grep -Ei 'too large body|413|upstream|502|503|connect\(\) failed|timed out' \
    || true
fi

cat <<'EOF'

Interpretación rápida:
- "Body exceeded 1 MB limit" o HTTP 413 desde Next.js: falta aumentar serverActions.bodySizeLimit y reconstruir la imagen web.
- "client intended to send too large body" o 413 en Nginx: aumente client_max_body_size y recargue Nginx.
- MinIO health falla, PVC Pending o pod reiniciando: el API no puede leer ni guardar archivos.
- NoSuchKey: la base de datos referencia un objeto que ya no existe en el volumen de MinIO.
- AccessDenied/SignatureDoesNotMatch: credenciales del API y MinIO no coinciden.
- OOMKilled: la carga en memoria es demasiado grande; reduzca el total o implemente carga directa/presignada a MinIO.
EOF
