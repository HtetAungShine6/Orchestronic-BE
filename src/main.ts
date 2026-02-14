// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// // import { TransformInterceptor } from './common/interceptors/transform.interceptor';
// import { ValidationPipe } from '@nestjs/common';
// // import { MicroserviceOptions, Transport } from '@nestjs/microservices';
// import * as cookieParser from 'cookie-parser';
// import * as session from 'express-session';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.use(cookieParser()); // 👈 add this
//   app.setGlobalPrefix('api');

//   app.use(
//     session({
//       secret: process.env.SESSION_SECRET || 'supersecret',
//       resave: false,
//       saveUninitialized: false,
//       cookie: { secure: true }, // true if HTTPS
//     }),
//   );

//   app.enableCors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true, // allow cookies
//   });

//   app.useGlobalPipes(new ValidationPipe());
//   // app.useGlobalInterceptors(new TransformInterceptor());

//   const config = new DocumentBuilder()
//     .setTitle('Orchestronic API')
//     .setDescription('API documentation for Orchestronic')
//     .addBearerAuth(
//       {
//         type: 'http',
//         scheme: 'bearer',
//         bearerFormat: 'JWT',
//         in: 'header',
//       },
//       'access-token',
//     )
//     .setVersion('1.0')
//     .build();

//   const documentFactory = () => SwaggerModule.createDocument(app, config);
//   SwaggerModule.setup('api', app, documentFactory, {
//     customSiteTitle: 'Orchestronic API',
//     customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
//     customJs: [
//       'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
//       'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
//     ],
//     customCssUrl: [
//       'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
//       'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
//       'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
//     ],
//   });

//   // app.connectMicroservice<MicroserviceOptions>({
//   //   transport: Transport.RMQ,
//   //   options: {
//   //     urls: ['amqp://localhost:5672'],
//   //     queue: 'request',
//   //   },
//   // });

//   // await app.startAllMicroservices();
//   await app.listen(process.env.PORT ?? 3001);
// }
// bootstrap();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const normalizeEnvValue = (value: string) =>
    value.trim().replace(/^['"]|['"]$/g, '');

  const frontendOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => normalizeEnvValue(origin))
    .filter(Boolean);
  const backendOrigins = (process.env.BACKEND_URL || '')
    .split(',')
    .map((origin) => normalizeEnvValue(origin))
    .filter(Boolean);
  const allowedOrigins = new Set([...frontendOrigins, ...backendOrigins]);

  app.use(cookieParser());
  app.setGlobalPrefix('api');

  // ✅ IMPORTANT on Vercel (behind proxy) so secure cookies work correctly
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'supersecret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        httpOnly: true,
      },
    }),
  );

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server calls and direct browser navigations without Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      // Keep Swagger and Vercel preview domains usable without constant env edits
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      if (origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe());

  const config = new DocumentBuilder()
    .setTitle('Orchestronic API')
    .setDescription('API documentation for Orchestronic')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .setVersion('1.0')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, documentFactory, {
    customSiteTitle: 'Orchestronic API',
    customfavIcon: 'https://avatars.githubusercontent.com/u/6936373?s=200&v=4',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.css',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.css',
    ],
  });

  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
