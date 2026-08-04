# Despliegue de usuarios, asignaciones y cartera

Esta actualización agrega el menú **Usuarios**, detalle completo por persona, asignación de inmuebles, facturación inicial, estado de cartera e historial de pagos. También carga los 92 registros históricos en el directorio administrativo y unifica los perfiles con las cuentas web cuando el correo coincide.

## Cambios que se despliegan

- API NestJS.
- Web Next.js.
- ConfigMap (`IMPORT_CREATE_CURRENT_INVOICES=true`).
- Migración Prisma `202608040001_unify_users_and_payment_history`.
- Job idempotente para cargar usuarios y contratos históricos.

No reinstala PostgreSQL, MinIO ni sus volúmenes.

## Variables

```bash
cd /root/inmoviliaria
export NS=asesoria-inmobiliaria
export RELEASE=20260804-usuarios-cartera
```

## Construir imágenes

```bash
docker build --no-cache --progress=plain \
  -f apps/api/Dockerfile \
  -t asesoria-inmobiliaria-api:$RELEASE .

docker build --no-cache --progress=plain \
  --build-arg NEXT_PUBLIC_API_URL=https://asesoriainmobiliariajb.com \
  -f apps/web/Dockerfile \
  -t asesoria-inmobiliaria-web:$RELEASE .
```

## Importar en containerd

```bash
docker save asesoria-inmobiliaria-api:$RELEASE \
  | ctr --address /run/containerd/containerd.sock --namespace k8s.io images import -

docker save asesoria-inmobiliaria-web:$RELEASE \
  | ctr --address /run/containerd/containerd.sock --namespace k8s.io images import -

ctr --address /run/containerd/containerd.sock --namespace k8s.io images list \
  | grep "$RELEASE"
```

## Aplicar ConfigMap y migración

```bash
kubectl apply -f k8s/01-configmap.yaml

kubectl delete job asesoria-db-migrate -n "$NS" --ignore-not-found
sed "s|asesoria-inmobiliaria-api:local|asesoria-inmobiliaria-api:${RELEASE}|g" \
  k8s/12-integration-migrate-job.yaml | kubectl apply -f -

kubectl wait --for=condition=complete job/asesoria-db-migrate \
  -n "$NS" --timeout=600s
kubectl logs job/asesoria-db-migrate -n "$NS"
```

La migración enlaza perfiles históricos con cuentas web existentes, crea perfiles para las cuentas que todavía no los tenían y genera el cobro corriente para los contratos activos que aún no tienen factura del mes.

## Actualizar API y Web

```bash
kubectl set image deployment/api \
  api=asesoria-inmobiliaria-api:$RELEASE -n "$NS"
kubectl rollout status deployment/api -n "$NS" --timeout=600s

kubectl set image deployment/web \
  web=asesoria-inmobiliaria-web:$RELEASE -n "$NS"
kubectl rollout status deployment/web -n "$NS" --timeout=600s
```

## Cargar los registros históricos

Este Job es idempotente y debe ejecutarse para que todos los usuarios, contratos e inmuebles de la fuente histórica queden disponibles en el panel.

```bash
kubectl delete job asesoria-cargar-usuarios-historicos \
  -n "$NS" --ignore-not-found

sed "s|asesoria-inmobiliaria-api:local|asesoria-inmobiliaria-api:${RELEASE}|g" \
  k8s/13-cargar-usuarios-historicos-job.yaml | kubectl apply -f -

kubectl wait --for=condition=complete \
  job/asesoria-cargar-usuarios-historicos \
  -n "$NS" --timeout=1200s

kubectl logs job/asesoria-cargar-usuarios-historicos -n "$NS"
```

## Validación

```bash
kubectl get deployment api web -n "$NS" \
  -o custom-columns=DEPLOYMENT:.metadata.name,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image

curl -sS -o /dev/null -w 'Web: HTTP %{http_code}\n' \
  https://asesoriainmobiliariajb.com/

curl -sS -o /dev/null -w 'API pública: HTTP %{http_code}\n' \
  https://asesoriainmobiliariajb.com/api/properties
```

En la interfaz administrativa:

1. Abrir `/admin/usuarios` y comprobar que aparezcan los registros históricos y las cuentas web.
2. Abrir un usuario y revisar datos personales, contratos, facturas y pagos.
3. Asignar un inmueble disponible.
4. Confirmar que el inmueble pase a arrendado y desaparezca del catálogo público.
5. Verificar que se cree una factura pendiente y que los pagos posteriores queden en el historial.
