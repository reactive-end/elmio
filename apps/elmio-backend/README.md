# ElMio Backend

Backend NestJS del proyecto ElMio.

## Galeria y Google Cloud Storage

El modulo `gallery` soporta dos modos de almacenamiento:

1. Local en disco.
2. Google Cloud Storage.

Si defines las variables de entorno del bucket, el backend usara GCS automaticamente. Si no existen, seguira usando almacenamiento local bajo `storage/gallery/`.

### Variables esperadas

- `GCS_BUCKET_NAME`: nombre del bucket.
- `GCS_CREDENTIALS_JSON`: contenido completo del archivo JSON de credenciales.
- `GCS_CREDENTIALS_JSON_PATH`: ruta local a un archivo JSON de credenciales.
- `GCS_PUBLIC_BASE_URL`: opcional. URL publica base del bucket o CDN.

### Prioridad de credenciales

1. `GCS_CREDENTIALS_JSON`
2. `GCS_CREDENTIALS_JSON_PATH`
3. Credenciales por defecto del entorno si el SDK las encuentra.

### Ejemplo con JSON inline

```env
GCS_BUCKET_NAME=mi-bucket
GCS_CREDENTIALS_JSON={"type":"service_account","project_id":"..."}
```

### Ejemplo con archivo JSON

```env
GCS_BUCKET_NAME=mi-bucket
GCS_CREDENTIALS_JSON_PATH=C:\secrets\gcs-service-account.json
```
