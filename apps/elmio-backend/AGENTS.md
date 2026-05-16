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
