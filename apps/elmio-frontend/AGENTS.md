<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ElMio Frontend

## Stack
- Next.js 16 con App Router
- React 19
- TypeScript
- Tailwind CSS v4
- GSAP
- Zod

## Reglas
- Usar Server Components por defecto.
- Crear Client Components solo cuando hagan falta APIs del navegador, interaccion o GSAP.
- Usar Tailwind como capa principal de estilos.
- Usar Zod para validaciones de formularios, payloads y datos de UI.
- Mantener `app/page.tsx` vacio hasta que se pida funcionalidad.
- Evitar contenido de ejemplo, placeholders y boilerplate visual innecesario.
- El uso de `any` y `unknown` esta prohibido. Tipos explicitos en todo el codigo.
- Toda funcion con logica de UI relevante y toda ruta deben documentarse con JSDoc (proposito, `@param`, `@returns`).
- Los componentes siguen atomic design (atoms, molecules, organisms, templates, pages).
- Principio de responsabilidad unica (SRP): la logica de cada componente se extrae a un hook dedicado.
- Cada componente vive en su carpeta con maximo 3 archivos: `Componente.tsx`, `Componente.d.ts` y `useComponente.ts`.
- Las pantallas no contienen logica de negocio; esta se delega a hooks.
- Las llamadas a APIs externas o servicios van en archivos `.service.ts` dentro de una carpeta `services/`.
