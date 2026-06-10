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
- El componente `CedulaInput` (molecule) maneja la entrada de cedula de identidad con Select (V, E, G) y campo numerico formateado con espacios (min 7, max 9 digitos).
- El componente `PhoneInput` (molecule) maneja la entrada de telefono con Select (0412, 0422, 0414, 0424, 0416, 0426) y campo numerico de exactamente 7 digitos formateado con espacios.

# Guía de Estilo y Consistencia Visual para Formularios y Tablas (Frontend)

Esta guía documenta los estándares de diseño y desarrollo establecidos en **ElMio** para garantizar que todas las interfaces de usuario (especialmente formularios, listados y tablas) se mantengan consistentes, sumamente premium, limpias y libres de estilos toscos (como bordes oscuros o excesos de negritas).

---

## 1. Estructura de Formularios Premium

Todos los formularios del sistema deben evitar etiquetas manuales con negritas exageradas y bordes manuales en los inputs. En su lugar, se deben emplear estrictamente los componentes atómicos y moleculares del sistema de diseño.

### Componentes Clave a Utilizar:
- `FormField` (`@/components/molecules/FormField/FormField`): Maneja de forma limpia el label, estado requerido y mensajes de error sin negritas toscas.
- `Input` (`@/components/atoms/Input/Input`): Input nativo estilizado con bordes sutiles y HSL.
- `Select` (`@/components/atoms/Select/Select`): Select nativo estilizado.
- `Button` (`@/components/atoms/Button/Button`): Botón interactivo con estados de carga e iconografía.
- `Alert` (`@/components/atoms/Alert/Alert`): Banner de éxitos o errores.

### Tarjeta / Contenedor del Formulario
El contenedor del formulario debe usar siempre un borde sutil (`border-gray-100`), una sombra ligera (`shadow-sm`) y esquinas redondeadas estándar (`rounded-2xl`):
```tsx
<div className="flex flex-col gap-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
  {/* Cabecera, Alertas y Campos */}
</div>
```

### Marcación Estándar de un Campo de Formulario:
```tsx
import { FormField } from '@/components/molecules/FormField/FormField'
import { Input } from '@/components/atoms/Input/Input'

// Correcto:
<FormField label="Nombre de la Moneda" required>
  <Input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    placeholder="ej. Euro"
  />
</FormField>
```
*Evitar div manuales con clases toscas de tipo `text-xs font-bold text-gray-500 uppercase tracking-wider mb-2`.*

---

## 2. Estructura de Tablas Premium e Interactivas

Las tablas deben ser ligeras, limpias y proporcionar transiciones suaves de hover.

### Estructura de Clases Estándar:
- **Contenedor**: Debe usar el mismo estilo que los formularios para bordes y sombras:
  ```tsx
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full">
        {/* ... */}
      </table>
    </div>
  </div>
  ```
- **Encabezados (`thead / tr / th`)**: Los títulos de columna deben ser claros, delgados y con colores suaves:
  ```tsx
  <thead>
    <tr className="border-b border-gray-100 bg-gray-50/20">
      <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-6 py-4">
        Columna
      </th>
    </tr>
  </thead>
  ```
- **Cuerpo (`tbody / tr / td`)**:
  - Las filas deben tener una sutil división inferior y cambio de fondo en hover:
    ```tsx
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-6 py-4 text-sm text-body">
        Dato
      </td>
    </tr>
    ```

---

## 3. Botones Estilizados y Ajustes de Altura

Para mantener la elegancia de los botones en cabeceras o formularios, se debe evitar que se vean toscos o excesivamente altos:
- Utilizar el componente `<Button>` con la variante y padding idóneos.
- Para botones de control en cabeceras de tablas o barras de herramientas, aplicar la clase de padding vertical reducido `!py-2.5` para darles un aspecto moderno y fino:
  ```tsx
  <Button className="flex items-center gap-1.5 !py-2.5">
    <Plus className="h-4 w-4" strokeWidth={1.5} />
    Agregar Moneda
  </Button>
  ```

---

## 4. Ancho Completo en Formularios y Pantallas Adicionales

Para lograr simetría visual en toda la plataforma y simular la robustez y limpieza del catálogo de productos, los formularios no deben limitarse con anchos máximos acotados (como `max-w-2xl` o `max-w-3xl`) que los angosten y centren artificialmente.
- Los contenedores principales de los formularios deben emplear la clase `w-full` en lugar de clases de ancho máximo.
- El formulario se "comerá" todo el ancho del layout disponible, adaptándose armoniosamente a la rejilla responsiva general.

---

## 5. Checklist para Nuevas Pantallas

- [ ] ¿El contenedor tiene `border-gray-100`, `rounded-2xl` y `shadow-sm`?
- [ ] ¿Las cabeceras de tabla utilizan `font-medium text-gray-400` en lugar de negritas oscuras?
- [ ] ¿Los inputs están envueltos exclusivamente en componentes `FormField`?
- [ ] ¿Las alertas usan el componente `<Alert>` del sistema?
- [ ] ¿Los botones tienen padding vertical `!py-2.5` en cabeceras para ser menos altos?
- [ ] ¿Se evitaron por completo estilos en línea manuales o clases de bordes marcados tipo `border-gray-150` o superiores?
- [ ] ¿Los contenedores de formularios utilizan `w-full` para ocupar el 100% de la anchura del layout y mantener simetría visual?

## Knowledge Graph (graphify-out/)

La raiz del repositorio contiene un directorio `graphify-out/` con un grafo de conocimiento pre-calculado del proyecto completo (backend + frontend). Antes de proponer cambios arquitectonicos, refactors o nuevos componentes, **leelo**: es la fuente mas rapida para entender modulos, sus relaciones, god nodes, atomic design en uso y convenciones compartidas.

Archivos clave:
- `graph.json` — datos crudos del grafo (nodos, aristas, comunidades).
- `GRAPH_REPORT.md` — reporte legible: god nodes, conexiones sorprendentes, preguntas sugeridas.
- `graph.html` — visualizador interactivo (abrir en navegador).
- `manifest.json` — manifiesto de archivos procesados (usado por `graphify --update`).

Reglas de uso:
- Cuando te preguntes "¿que componentes dependen de X?" o "¿como se conecta la pagina Y con sus servicios?", prefiere `graphify query "<pregunta>"` antes que un grep manual.
- Si anades nuevos componentes, paginas, hooks o servicios, regenera el grafo con `graphify --update` para mantenerlo sincronizado.
- El grafo rastrea los `file_type` y `confidence_score` de cada arista (EXTRACTED / INFERRED / AMBIGUOUS); respeta esa auditoria al tomar decisiones.

