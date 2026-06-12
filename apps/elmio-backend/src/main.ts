import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Inicializa la aplicacion NestJS.
 * Configura el prefijo global `/api` para todos los endpoints
 * y levanta el servidor HTTP en el puerto definido por `PORT` o 3001 por defecto.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : [];

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Permitir solicitudes sin origen (como Postman o curl)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Permitir desarrollo local en localhost y 127.0.0.1 en cualquier puerto
      if (/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }

      // Permitir orígenes definidos en la variable de entorno
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
