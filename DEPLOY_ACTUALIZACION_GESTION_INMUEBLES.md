# Despliegue: imágenes opcionales, edición y asignación de inmuebles

Esta versión agrega:

- Imagen predeterminada cuando se crea un inmueble sin fotografías.
- Edición completa de datos, publicación, fotos, foto 360 y video.
- Asignación a arrendatarios importados desde datos históricos.
- Creación de un arrendatario nuevo y asignación inmediata.
- Desasignación de un inmueble para devolverlo al estado `AVAILABLE`.

## Alcance del despliegue

Documento de referencia de la actualización anterior. Para la versión vigente de usuarios y cartera use `DEPLOY_ACTUALIZACION_USUARIOS_CARTERA.md`, que sí incluye una migración de datos.

```bash
cd /root/inmoviliaria
export NS=asesoria-inmobiliaria
export RELEASE=20260804-gestion-inmuebles
```

### Construir

```bash
docker build --no-cache --progress=plain \
  -f apps/api/Dockerfile \
  -t asesoria-inmobiliaria-api:$RELEASE .

docker build --no-cache --progress=plain \
  --build-arg NEXT_PUBLIC_API_URL=https://asesoriainmobiliariajb.com \
  -f apps/web/Dockerfile \
  -t asesoria-inmobiliaria-web:$RELEASE .
```

### Importar en containerd de Kubernetes

```bash
docker save asesoria-inmobiliaria-api:$RELEASE \
  | ctr --address /run/containerd/containerd.sock --namespace k8s.io images import -

docker save asesoria-inmobiliaria-web:$RELEASE \
  | ctr --address /run/containerd/containerd.sock --namespace k8s.io images import -

ctr --address /run/containerd/containerd.sock --namespace k8s.io images list \
  | grep "$RELEASE"
```

### Actualizar los deployments

```bash
kubectl set image deployment/api \
  api=asesoria-inmobiliaria-api:$RELEASE \
  -n "$NS"

kubectl rollout status deployment/api -n "$NS" --timeout=600s

kubectl set image deployment/web \
  web=asesoria-inmobiliaria-web:$RELEASE \
  -n "$NS"

kubectl rollout status deployment/web -n "$NS" --timeout=600s
```

### Validar

```bash
kubectl get deployment api web -n "$NS" \
  -o custom-columns=DEPLOYMENT:.metadata.name,READY:.status.readyReplicas,IMAGE:.spec.template.spec.containers[0].image

kubectl logs deployment/api -n "$NS" --tail=200
kubectl logs deployment/web -n "$NS" --tail=200
```

En la web administrativa:

1. Crear un inmueble sin fotografía y comprobar que se vea la imagen predeterminada.
2. Abrir **Editar** y modificar los datos.
3. Seleccionar un arrendatario proveniente de los datos históricos y guardar.
4. Crear otro inmueble asignándolo a un arrendatario nuevo.
5. Desasignar un inmueble y comprobar que vuelva al estado `AVAILABLE`.

## Comportamiento de la asignación

- Al asignar, se crea o actualiza un contrato activo y el inmueble pasa a `RENTED`.
- Si ya existía otro contrato activo para ese inmueble, se cierra antes de crear la nueva asignación.
- Al desasignar, el contrato activo se marca como finalizado y el inmueble pasa a `AVAILABLE`.
- Si el correo del arrendatario coincide con una cuenta de usuario de la aplicación, ambas identidades se enlazan automáticamente.
