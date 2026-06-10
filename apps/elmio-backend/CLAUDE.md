@AGENTS.md

## Knowledge Graph (graphify-out/)

La raiz del repositorio contiene un directorio `graphify-out/` con un grafo de conocimiento pre-calculado del proyecto completo. Antes de proponer cambios arquitectonicos, refactors o nuevas dependencias, **leelo**: es la fuente mas rapida para entender modulos, sus relaciones, god nodes y convenciones compartidas.

Archivos clave:
- `graph.json` — datos crudos del grafo (nodos, aristas, comunidades).
- `GRAPH_REPORT.md` — reporte legible: god nodes, conexiones sorprendentes, preguntas sugeridas.
- `graph.html` — visualizador interactivo (abrir en navegador).
- `manifest.json` — manifiesto de archivos procesados (usado por `graphify --update`).

Reglas de uso:
- Cuando te preguntes "¿que llama a X?" o "¿como se conecta Y con Z?", prefiere `graphify query "<pregunta>"` antes que un grep manual.
- Si modificas estructura de modulos, entidades o migraciones, regenera el grafo con `graphify --update` para mantenerlo sincronizado.
- El grafo rastrea los `file_type` y `confidence_score` de cada arista (EXTRACTED / INFERRED / AMBIGUOUS); respeta esa auditoria al tomar decisiones.
