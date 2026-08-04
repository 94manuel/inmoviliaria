# Despliegue de facturas y contratos PDF

Esta actualización modifica API, Web, ConfigMap y PostgreSQL mediante Prisma. No reinstala PostgreSQL, MinIO, n8n ni los volúmenes.

## 1. Variables

```bash
cd /root/inmoviliaria
export NS="asesoria-inmobiliaria"
export RELEASE="20260804-facturas-contratos"
```

## 2. Actualizar Git

```bash
git status --short
git pull --ff-only origin main
```

Verificar:

```bash
test -f apps/api/prisma/migrations/202608040002_invoice_management_and_contract_pdfs/migration.sql
test -f apps/web/components/AdminInvoiceManager.tsx
test -f apps/web/components/AdminLeaseContractForm.tsx
```

## 3. Construir imágenes

```bash
docker build --no-cache --progress=plain \
  -f apps/api/Dockerfile \
  -t "asesoria-inmobiliaria-api:${RELEASE}" .

docker build --no-cache --progress=plain \
  --build-arg NEXT_PUBLIC_API_URL=https://asesoriainmobiliariajb.com \
  -f apps/web/Dockerfile \
  -t "asesoria-inmobiliaria-web:${RELEASE}" .
```

## 4. Importar en containerd

```bash
docker save "asesoria-inmobiliaria-api:${RELEASE}" \
  | ctr --address /run/containerd/containerd.sock --namespace k8s.io images import -

docker save "asesoria-inmobiliaria-web:${RELEASE}" \
  | ctr --address /run/containerd/containerd.sock --namespace k8s.io images import -

ctr --address /run/containerd/containerd.sock --namespace k8s.io images list \
  | grep "$RELEASE"
```

## 5. ConfigMap

```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl get configmap asesoria-config -n "$NS" \
  -o jsonpath='{.data.CONTRACT_MAX_FILE_SIZE}'; echo
```

Debe mostrar `25000000`.

## 6. Migración

```bash
kubectl delete job asesoria-db-migrate -n "$NS" --ignore-not-found

sed "s|asesoria-inmobiliaria-api:local|asesoria-inmobiliaria-api:${RELEASE}|g" \
  k8s/12-integration-migrate-job.yaml \
  | kubectl apply -f -

kubectl wait --for=condition=complete \
  job/asesoria-db-migrate -n "$NS" --timeout=600s

kubectl logs job/asesoria-db-migrate -n "$NS"
```

La salida debe indicar que se aplicó `202608040002_invoice_management_and_contract_pdfs`.

## 7. Actualizar API y Web

```bash
kubectl set image deployment/api \
  api="asesoria-inmobiliaria-api:${RELEASE}" -n "$NS"
kubectl rollout status deployment/api -n "$NS" --timeout=600s

kubectl set image deployment/web \
  web="asesoria-inmobiliaria-web:${RELEASE}" -n "$NS"
kubectl rollout status deployment/web -n "$NS" --timeout=600s
```

## 8. Verificación

```bash
kubectl get deployment api web -n "$NS" \
  -o custom-columns='DEPLOYMENT:.metadata.name,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image'

kubectl logs deployment/api -n "$NS" --tail=300
kubectl logs deployment/web -n "$NS" --tail=300
```

Pruebas funcionales:

1. Abrir `/admin/facturas` y editar valor, estado y vencimiento de una factura temporal.
2. Marcarla pagada y confirmar que aparece un pago manual en el historial.
3. Eliminar una factura temporal y confirmar que desaparece de la cuenta del usuario.
4. Abrir `/admin/usuarios/:id`, cargar un PDF firmado y visualizarlo.
5. Entrar como el usuario y abrir `/mi-cuenta` para visualizar y descargar el contrato.
6. Intentar abrir el contrato sin sesión: debe responder como no autorizado.

## Rollback de aplicación

Se pueden revertir los deployments con:

```bash
kubectl rollout undo deployment/api -n "$NS"
kubectl rollout undo deployment/web -n "$NS"
```

La migración permanece aplicada y es compatible con la versión anterior porque solo agrega columnas, índice, relación y valor de enum.
