import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    bodyParser: false
  });


  app.enableCors({
    origin: [
      'http://localhost:8081',
      'http://127.0.0.1:8081',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })





  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )


const config = new DocumentBuilder()
  .setTitle('POSapp API')
  .setDescription('API BACKEND PARA POSapp')
  .setVersion('1.0')
  .addCookieAuth('better-auth.session_token')
  .build()


const document =SwaggerModule.createDocument(app, config)
SwaggerModule.setup('docs', app, document)






  

  // await app.listen(process.env.PORT ?? 3000);
  // await app.listen(3000, "0.0.0.0");
  await app.listen(process.env.PORT ?? 3000, "0.0.0.0");
}
await bootstrap();
