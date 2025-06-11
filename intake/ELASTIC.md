# 🟢 Elasticsearch 8.13.2 en Docker — Multi-Tenant Dev Setup

Este README explica **cómo levantar varias instancias (tenants) de Elasticsearch** en la misma máquina usando Docker, evitando los errores típicos de permisos y de HTTPS que aparecieron a partir de la versión 8.x.

---

## 1 · Requisitos

| Recurso | Mínimo recomendado |
|---------|--------------------|
| RAM VM  | 4 GB (2 GB heap + 2 GB OS cache) |
| Docker  | 20.10 o superior   |
| Puertos | 9200, 9201, … (uno por tenant) |

---

## 2 · Problemas comunes que resolvimos

| Error / Síntoma | Causa | Fix aplicado |
|-----------------|-------|--------------|
| `curl: (52) Empty reply from server` | Elasticsearch escucha **HTTPS** pero le envías **HTTP** | Desactivar seguridad/SSL |
| `failed to obtain lock on .../data` | Volumen host sin permisos de escritura | Cambiar propietario (UID 1000) |
| Contenedor se cae por OOM | Heap demasiado pequeño (512 MB) | Subir a **2 GB** |

---

## 3 · Pasos previos

```bash
# Crea el directorio de datos del nuevo tenant
sudo mkdir -p /opt/es_data/otro_tenant

# Dale permisos al UID/GID 1000 (usuario 'elasticsearch' dentro del contenedor)
sudo chown -R 1000:1000 /opt/es_data/otro_tenant


⸻

4 · Comando Docker por tenant

docker run -d \
  --name es-otro-tenant \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms2g -Xmx2g" \
  -e "xpack.security.enabled=false" \
  -e "xpack.security.http.ssl.enabled=false" \
  -p 9201:9200 \
  -v /opt/es_data/otro_tenant:/usr/share/elasticsearch/data \
  docker.elastic.co/elasticsearch/elasticsearch:8.13.2

🔁 Repite con otros nombres, volúmenes y puertos (9202, 9203…) para más tenants.

⸻

5 · Test rápido

curl http://localhost:9201

Respuesta esperada:

{
  "name": "es-otro-tenant",
  "cluster_name": "docker-cluster",
  "version": { "number": "8.13.2", ... },
  "tagline": "You Know, for Search"
}


⸻

6 · Tips de desarrollo
	•	Kibana: levántala en otro contenedor y apunta su ELASTICSEARCH_HOSTS al puerto del tenant adecuado.
	•	Persistencia: los datos quedan en /opt/es_data/<tenant>. Haz backup si los necesitas.
	•	Producción: activa de nuevo xpack.security y genera certificados/tokens.

⸻

¡Listo! Con esto tienes un entorno multi-tenant de Elasticsearch 8.13.2 listo para desarrollo local o pruebas en EC2.

