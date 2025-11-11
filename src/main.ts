import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Server');
  const app = await NestFactory.create(AppModule);

  // Enable CORS for access from React Native / other devices
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: '*',
  });

  // Log every incoming request (middleware)
  app.use((req, res, next) => {
    const start = Date.now();
    logger.log(`➡️  ${req.method} ${req.url}`);

    res.on('finish', () => {
      const ms = Date.now() - start;
      logger.log(`⬅️  ${req.method} ${req.url} [${res.statusCode}] (${ms}ms)`);
    });

    next();
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  const host = '0.0.0.0'; // for access across network

  await app.listen(port, host);
  logger.log(`🚀 Server running at http://${host}:${port}`);
}

bootstrap();
