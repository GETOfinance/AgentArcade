import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CommunicateModule } from './core/resources/communicate/communicate.module';
import { CreateAgentModule } from './core/resources/create-agent/create-agent.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ZeeModule } from './core/resources/zee/zee.module';
import { OpenAIModule } from './lib/openai/openai.module';

// Check if SKIP_MONGODB environment variable is set
const skipMongoDB = process.env.SKIP_MONGODB === 'true';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    // Only include MongooseModule if not skipping MongoDB
    ...(skipMongoDB
      ? []
      : [
          MongooseModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
              uri:
                configService.get<string>('MONGODB_URI') ??
                'mongodb://localhost:27017/agentic-eth',
              // For testing purposes, we'll make the connection optional
              connectionFactory: (connection) => {
                connection.on('error', (error) => {
                  console.warn('MongoDB connection error:', error);
                  console.warn('Continuing without MongoDB for testing purposes');
                });
                return connection;
              },
            }),
          }),
        ]),
    CommunicateModule,
    CreateAgentModule,
    ZeeModule,
    OpenAIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
