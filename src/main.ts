// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import { ValidationPipe } from '@nestjs/common';
// import { INestApplication } from '@nestjs/common';
// import cookieParser from 'cookie-parser';
// import cookieSession from 'cookie-session';
// import { Request, Response } from 'express';

// let cachedServer: any;

// async function createApp(): Promise<INestApplication> {
//   if (cachedServer) {
//     return cachedServer;
//   }

//   const app = await NestFactory.create(AppModule);

//   app.use(cookieParser());
//   app.setGlobalPrefix('api');

//   app.use(
//     cookieSession({
//       name: 'session',
//       keys: [process.env.SESSION_SECRET || 'supersecret'],
//       maxAge: 10 * 60 * 1000, // 10 minutes (only needed during auth flow)
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
//       httpOnly: true,
//     }),
//   );

//   app.enableCors({
//     origin: process.env.FRONTEND_URL,
//     credentials: true,
//   });

//   app.useGlobalPipes(new ValidationPipe());

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

//   await app.init();

//   cachedServer = app;
//   return app;
// }

// // For Vercel serverless
// export default async (req: Request, res: Response) => {
//   const app = await createApp();
//   const expressInstance = app.getHttpAdapter().getInstance();
//   expressInstance(req, res);
// };

// // For local development
// if (require.main === module) {
//   async function bootstrap() {
//     const app = await createApp();
//     const port = process.env.PORT ?? 3001;
//     await app.listen(port);
//     console.log(`Application is running on: http://localhost:${port}`);
//   }
//   bootstrap();
// }


import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';
// import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser()); // 👈 add this
  app.setGlobalPrefix('api');

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'supersecret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // true if HTTPS
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true, // allow cookies
  });

  app.useGlobalPipes(new ValidationPipe());
  // app.useGlobalInterceptors(new TransformInterceptor());

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

  // app.connectMicroservice<MicroserviceOptions>({
  //   transport: Transport.RMQ,
  //   options: {
  //     urls: ['amqp://localhost:5672'],
  //     queue: 'request',
  //   },
  // });

  // await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();