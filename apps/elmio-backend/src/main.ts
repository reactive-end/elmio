import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

/**
 * Inicializa la aplicacion NestJS.
 * Configura el prefijo global `/api` para todos los endpoints
 * y levanta el servidor HTTP en el puerto definido por `PORT` o 3001 por defecto.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir desarrollo local en localhost y 127.0.0.1 en cualquier puerto
      if (!origin || /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
