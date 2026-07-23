# Instalar n8n para Asesoría Inmobiliaria JB

Dominio público:

```text
https://n8n.asesoriainmobiliariajb.com
```

Arquitectura:

```text
Nginx del VPS :80/:443
        ↓
Traefik NodePort :30080
        ↓
Ingress host n8n.asesoriainmobiliariajb.com
        ↓
n8n-service:5678
        ↓
Pod n8n + PostgreSQL + PVC
```

## 1. DNS

Cree o confirme este registro:

```text
Tipo: A
Nombre: n8n
Destino: 72.62.97.58
```

Verifique:

```bash
dig +short n8n.asesoriainmobiliariajb.com A
```

## 2. Directorio persistente

```bash
mkdir -p /var/lib/asesoria-inmobiliaria/n8n
chown -R 1000:1000 /var/lib/asesoria-inmobiliaria/n8n
chmod 700 /var/lib/asesoria-inmobiliaria/n8n
```

## 3. Secret y base de datos independiente

```bash
cd ~/inmoviliaria
bash k8s/create-n8n-secrets.sh
kubectl apply -f k8s/09-n8n-storage.yaml
kubectl delete job n8n-db-init -n asesoria-inmobiliaria --ignore-not-found
kubectl apply -f k8s/10-n8n-db-init.yaml
kubectl wait --for=condition=complete job/n8n-db-init \
  -n asesoria-inmobiliaria \
  --timeout=300s
kubectl logs job/n8n-db-init -n asesoria-inmobiliaria
```

## 4. Instalar n8n y actualizar Ingress

```bash
kubectl apply -f k8s/11-n8n.yaml
kubectl rollout status deployment/n8n \
  -n asesoria-inmobiliaria \
  --timeout=600s
kubectl apply -f k8s/07-ingress.yaml
```

Verifique:

```bash
kubectl get deployment,pod,service,ingress,pvc \
  -n asesoria-inmobiliaria \
  -o wide
```

## 5. Probar Traefik antes de Nginx

```bash
curl -I \
  -H 'Host: n8n.asesoriainmobiliariajb.com' \
  http://127.0.0.1:30080/

curl -I \
  -H 'Host: n8n.asesoriainmobiliariajb.com' \
  http://127.0.0.1:30080/healthz
```

La ruta `/` con `pathType: Prefix` incluye todos los accesos de n8n:

- Editor web y recursos estáticos.
- API REST interna del editor.
- `/webhook/*`.
- `/webhook-test/*`.
- Formularios y callbacks.
- SSE y WebSockets.

## 6. Configuración HTTP temporal de Nginx

```bash
mkdir -p /var/www/certbot/.well-known/acme-challenge
cp k8s/nginx-n8n-bootstrap.conf \
  /etc/nginx/sites-available/n8n.asesoriainmobiliariajb.com
ln -sfn \
  /etc/nginx/sites-available/n8n.asesoriainmobiliariajb.com \
  /etc/nginx/sites-enabled/n8n.asesoriainmobiliariajb.com
nginx -t
systemctl reload nginx
```

Pruebe:

```bash
curl -I http://n8n.asesoriainmobiliariajb.com/
```

## 7. Certificado TLS

```bash
certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d n8n.asesoriainmobiliariajb.com
```

## 8. Nginx HTTPS definitivo

```bash
cp k8s/nginx-n8n.asesoriainmobiliariajb.com.conf \
  /etc/nginx/sites-available/n8n.asesoriainmobiliariajb.com
nginx -t
systemctl reload nginx
```

Verifique que no redirija al dominio principal:

```bash
curl -sSIL https://n8n.asesoriainmobiliariajb.com/ \
  | grep -Ei 'HTTP/|location:'
```

## 9. Acceso inicial

Abra:

```text
https://n8n.asesoriainmobiliariajb.com
```

En el primer ingreso, n8n solicitará crear la cuenta propietaria. Esa cuenta no se genera en los YAML.

## Diagnóstico

```bash
kubectl logs deployment/n8n \
  -n asesoria-inmobiliaria \
  --tail=200

kubectl describe ingress n8n \
  -n asesoria-inmobiliaria

kubectl get endpoints n8n-service \
  -n asesoria-inmobiliaria

kubectl logs deployment/traefik \
  -n traefik \
  --tail=200

tail -n 100 \
  /var/log/nginx/n8n.asesoriainmobiliariajb.com.error.log
```

## Copias de seguridad

Deben respaldarse conjuntamente:

```text
/var/lib/asesoria-inmobiliaria/postgres
/var/lib/asesoria-inmobiliaria/n8n
/root/asesoria-inmobiliaria-n8n-secrets.env
```

La variable `N8N_ENCRYPTION_KEY` no debe cambiarse ni perderse; n8n la usa para descifrar las credenciales guardadas.
