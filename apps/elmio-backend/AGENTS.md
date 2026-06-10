# ElMio Backend

## Stack
- NestJS 11
- TypeScript
- Jest y Supertest
- Arquitectura hexagonal por feature

## Reglas
- Mantener cada feature dentro de `src/modules/<feature>/`.
- Separar `domain`, `application`, `infrastructure` y `presentation`.
- Los controllers solo adaptan HTTP hacia casos de uso.
- Los casos de uso orquestan la logica de aplicacion.
- La infraestructura implementa puertos definidos por el dominio.
- El dominio no depende de NestJS ni de detalles HTTP.
- El dominio usa TypeORM para definir entidades con decoradores.
- Todos los endpoints HTTP se exponen bajo el prefijo `/api`.
- El uso de `any` y `unknown` esta prohibido. Tipos explicitos en todo el codigo.
- Toda funcion con logica de negocio y todo endpoint HTTP deben documentarse con JSDoc (proposito, `@param`, `@returns`).
- Principio de responsabilidad unica (SRP): cada archivo tiene una sola razon para cambiar.
- Los servicios de aplicacion y los casos de uso deben estar en archivos dedicados, no mezclados con infraestructura ni presentacion.

## Knowledge Graph (graphify-out/)

La raiz del repositorio contiene un directorio `graphify-out/` con un grafo de conocimiento pre-calculado del proyecto. Antes de proponer cambios arquitectonicos, refactors o nuevas dependencias, **leelo**: es la fuente mas rapida para entender modulos, sus relaciones, god nodes y convenciones compartidas.

Archivos clave:
- `graph.json` — datos crudos del grafo (nodos, aristas, comunidades).
- `GRAPH_REPORT.md` — reporte legible: god nodes, conexiones sorprendentes, preguntas sugeridas.
- `graph.html` — visualizador interactivo (abrir en navegador).
- `manifest.json` — manifiesto de archivos procesados (usado por `graphify --update`).

Reglas de uso:
- Cuando te preguntes "¿que llama a X?" o "¿como se conecta Y con Z?", prefiere `graphify query "<pregunta>"` antes que un grep manual.
- Si modificas estructura de modulos, entidades o migraciones, regenera el grafo con `graphify --update` para mantenerlo sincronizado.
- El grafo rastrea los `file_type` y `confidence_score` de cada arista (EXTRACTED / INFERRED / AMBIGUOUS); respeta esa auditoria al tomar decisiones.
