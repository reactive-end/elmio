# ElMio (monorepo raiz)

Monorepo de la plataforma ElMio, insurtech venezolana. Contiene el backend y el frontend como workspaces independientes bajo `apps/`.

## Estructura

```
elmio/
├── apps/
│   ├── elmio-backend/    # NestJS 11 + TypeORM (arquitectura hexagonal)
│   └── elmio-frontend/   # Next.js 16 + React 19 + Tailwind v4 + GSAP
├── marketplace-default.json
├── package.json          # workspaces: apps/*
└── CLAUDE.md             # este archivo
```

Cada workspace tiene su propio `AGENTS.md` (y `CLAUDE.md` en el caso del frontend) con reglas detalladas. **Leelos primero** antes de tocar codigo de un workspace:

- `apps/elmio-backend/AGENTS.md` — reglas de backend (hexagonal, SRP, JSDoc, no any/unknown).
- `apps/elmio-frontend/AGENTS.md` — reglas de frontend (atomic design, w-full, premium container, JSDoc, no any/unknown).
- `apps/elmio-frontend/CLAUDE.md` — hereda de su `AGENTS.md` y anade la guia de knowledge graph.

## Convenciones compartidas (validas en ambos workspaces)

- **Sin `any` ni `unknown`**: tipos explicitos en todo el codigo.
- **JSDoc obligatorio**: en funciones con logica de negocio / endpoints / rutas / componentes.
- **SRP**: una razon para cambiar por archivo. La logica de componentes se extrae a hooks.
- **Prettier**: el script `npm run lint` en la raiz formatea con `prettier` y delega a los workspaces.

## Comandos utiles

```bash
# Lint en todo el monorepo
npm run lint

# Auto-fix de formato
npm run lint:fix

# Trabajar en un workspace especifico
cd apps/elmio-backend
cd apps/elmio-frontend
```

> Para comandos especificos de cada app (build, test, dev server) consulta el `package.json` y `AGENTS.md` del workspace correspondiente.

## Knowledge Graph (graphify-out/)

La raiz del repositorio contiene un directorio `graphify-out/` con un grafo de conocimiento pre-calculado del proyecto completo (backend + frontend). **Es la fuente mas rapida** para entender modulos cross-app, sus relaciones, god nodes y convenciones compartidas.

Archivos clave:
- `graph.json` — datos crudos del grafo (nodos, aristas, comunidades).
- `GRAPH_REPORT.md` — reporte legible: god nodes, conexiones sorprendentes, preguntas sugeridas.
- `graph.html` — visualizador interactivo (abrir en navegador).
- `manifest.json` — manifiesto de archivos procesados (usado por `graphify --update`).

Reglas de uso:
- Antes de proponer cambios arquitectonicos, refactors cross-app o nuevas dependencias, **lee `GRAPH_REPORT.md`**.
- Cuando te preguntes "¿que modulo llama a X?" o "¿como se conecta Y con Z?" (en uno o ambos workspaces), prefiere `graphify query "<pregunta>"` antes que un grep manual.
- Si modificas estructura de modulos, entidades, paginas o servicios, regenera el grafo con `graphify --update` para mantenerlo sincronizado.
- El grafo rastrea `file_type` y `confidence_score` de cada arista (EXTRACTED / INFERRED / AMBIGUOUS); respeta esa auditoria al tomar decisiones.
