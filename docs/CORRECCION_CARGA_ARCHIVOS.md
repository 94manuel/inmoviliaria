# Corrección de carga de imágenes y archivos

Esta versión corrige los límites incompatibles entre Next.js, NestJS y Nginx que podían provocar errores al cargar fotografías o documentos grandes.

## Cambios aplicados

- Next.js Server Actions: límite de cuerpo aumentado a 75 MB.
- Nginx: `client_max_body_size` aumentado a 80 MB.
- API NestJS: límite total por solicitud de 70 MB.
- Archivos generales: máximo 20 archivos, 25 MB por archivo y 70 MB en total.
- Inmuebles: máximo 10 fotografías de 5 MB y una panorámica 360 de 15 MB.
- Configuración añadida a `.env`, `.env.example` y Kubernetes.
- Mensajes de ayuda del panel administrativo actualizados.

## Reconstrucción requerida

Los directorios generados `.next` y `dist` se eliminaron deliberadamente para evitar desplegar compilaciones antiguas. Reconstruya las imágenes después de extraer el ZIP:

```bash
docker build --no-cache -f apps/api/Dockerfile -t asesoria-inmobiliaria-api:local .
docker build --no-cache --build-arg NEXT_PUBLIC_API_URL=https://asesoriainmobiliariajb.com -f apps/web/Dockerfile -t asesoria-inmobiliaria-web:local .
```

## Kubernetes

```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl rollout restart deployment/api deployment/web -n asesoria-inmobiliaria
```

## Nginx

```bash
sudo cp k8s/nginx-asesoriainmobiliariajb.com.conf /etc/nginx/sites-available/asesoriainmobiliariajb.com
sudo nginx -t
sudo systemctl reload nginx
```

## Diagnóstico

```bash
chmod +x scripts/diagnostico-carga-archivos.sh
sudo ./scripts/diagnostico-carga-archivos.sh | tee diagnostico-archivos.log
```
