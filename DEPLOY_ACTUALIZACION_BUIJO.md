# Despliegue de la actualización BUIJO

La actualización modifica **API, Web y el esquema de PostgreSQL**. No reinstala PostgreSQL, MinIO ni n8n.

## 1. Configurar las variables nuevas en el Secret existente

```bash
export NS=asesoria-inmobiliaria
export N8N_PAYMENTS_API_KEY="$(openssl rand -hex 32)"
export BANCOLOMBIA_ALLOWED_SENDERS="REMITENTE_REAL_VERIFICADO@bancolombia.com.co"
export BANCOLOMBIA_ACCOUNT_LAST4="1234"
export IMPORT_ADMIN_EMAIL="admin@asesoriainmobiliariajb.com"

kubectl patch secret asesoria-secrets -n "$NS" --type merge -p "$(
  python3 - <<'PY'
import base64, json, os
keys = [
    "N8N_PAYMENTS_API_KEY",
    "BANCOLOMBIA_ALLOWED_SENDERS",
    "BANCOLOMBIA_ACCOUNT_LAST4",
    "IMPORT_ADMIN_EMAIL",
]
print(json.dumps({
    "data": {
        key: base64.b64encode(os.environ[key].encode()).decode()
        for key in keys
    }
}))
PY
)"
```

Guarde la API key en un gestor de contraseñas. Se utilizará en una credencial `Header Auth` de n8n:

```text
Header: X-API-Key
Value: <N8N_PAYMENTS_API_KEY>
```

## 2. Construir Web y API

Desde la raíz del proyecto:

```bash
export RELEASE=20260803-buijo-integrado

docker build --no-cache \
  -f apps/api/Dockerfile \
  -t asesoria-inmobiliaria-api:$RELEASE .

docker build --no-cache \
  --build-arg NEXT_PUBLIC_API_URL=https://asesoriainmobiliariajb.com \
  -f apps/web/Dockerfile \
  -t asesoria-inmobiliaria-web:$RELEASE .
```

## 3. Importar las imágenes al runtime de Kubernetes

K3s:

```bash
docker save asesoria-inmobiliaria-api:$RELEASE | k3s ctr images import -
docker save asesoria-inmobiliaria-web:$RELEASE | k3s ctr images import -
```

Containerd estándar:

```bash
docker save asesoria-inmobiliaria-api:$RELEASE | ctr -n k8s.io images import -
docker save asesoria-inmobiliaria-web:$RELEASE | ctr -n k8s.io images import -
```

## 4. Aplicar el ConfigMap

```bash
kubectl apply -f k8s/01-configmap.yaml
```

## 5. Ejecutar la migración antes de actualizar los pods

Cambie la imagen del Job:

```bash
sed "s|asesoria-inmobiliaria-api:local|asesoria-inmobiliaria-api:$RELEASE|" \
  k8s/12-integration-migrate-job.yaml \
  | kubectl apply -f -

kubectl wait --for=condition=complete \
  job/asesoria-db-migrate \
  -n asesoria-inmobiliaria \
  --timeout=300s

kubectl logs job/asesoria-db-migrate -n asesoria-inmobiliaria
```

Si el Job ya existe de una ejecución anterior:

```bash
kubectl delete job asesoria-db-migrate -n asesoria-inmobiliaria --ignore-not-found
```

y vuelva a aplicarlo.

## 6. Actualizar únicamente API y Web

```bash
kubectl set image deployment/api \
  api=asesoria-inmobiliaria-api:$RELEASE \
  -n asesoria-inmobiliaria

kubectl rollout status deployment/api \
  -n asesoria-inmobiliaria \
  --timeout=300s

kubectl set image deployment/web \
  web=asesoria-inmobiliaria-web:$RELEASE \
  -n asesoria-inmobiliaria

kubectl rollout status deployment/web \
  -n asesoria-inmobiliaria \
  --timeout=300s
```

## 7. Importar los arrendamientos

Este paso es opcional y se ejecuta una sola vez por versión del archivo. El importador es idempotente por checksum.

```bash
kubectl delete job asesoria-import-arrendamientos \
  -n asesoria-inmobiliaria \
  --ignore-not-found

sed "s|asesoria-inmobiliaria-api:local|asesoria-inmobiliaria-api:$RELEASE|" \
  k8s/13-cargar-usuarios-historicos-job.yaml \
  | kubectl apply -f -

kubectl wait --for=condition=complete \
  job/asesoria-import-arrendamientos \
  -n asesoria-inmobiliaria \
  --timeout=900s

kubectl logs job/asesoria-import-arrendamientos \
  -n asesoria-inmobiliaria
```

La configuración vigente usa `IMPORT_CREATE_CURRENT_INVOICES=true` para crear el cobro corriente de los contratos activos que aún no tienen factura del periodo.

## 8. Importar el workflow n8n

Use preferiblemente:

```text
integrations/n8n/BUIJO_v2_conciliacion_bancolombia_prisma.json
```

Después configure:

- Credencial Microsoft Outlook OAuth2.
- Credencial Header Auth con `X-API-Key`.
- Remitente exacto de Bancolombia.
- Últimos cuatro dígitos de las cuentas.
- Correo interno para revisión.

No active simultáneamente los dos workflows sobre el mismo buzón. El segundo JSON se conserva para compatibilidad.

## 9. Verificaciones

```bash
kubectl get pods -n asesoria-inmobiliaria
kubectl logs deployment/api -n asesoria-inmobiliaria --tail=200
kubectl logs deployment/web -n asesoria-inmobiliaria --tail=200
```

Abra:

```text
https://asesoriainmobiliariajb.com/admin/conciliacion
https://asesoriainmobiliariajb.com/admin/inmuebles
```

Pruebe el retiro de un inmueble y confirme que desaparece del catálogo público. Si tiene contratos, facturas o pagos, debe quedar archivado para conservar el historial; si no tiene historial, puede eliminarse definitivamente.
