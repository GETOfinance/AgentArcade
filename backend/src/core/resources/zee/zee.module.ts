import { Module } from '@nestjs/common';
import { ZeeService } from './zee.service';
import { ZeeController } from './zee.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Zee, ZeeSchema } from './zee.schema';
import { ZeeRepository } from './zee.repository';

// Check if SKIP_MONGODB environment variable is set
const skipMongoDB = process.env.SKIP_MONGODB === 'true';

@Module({
  imports: [
    // Only include MongooseModule if not skipping MongoDB
    ...(skipMongoDB
      ? []
      : [MongooseModule.forFeature([{ name: Zee.name, schema: ZeeSchema }])]),
    // CovalentAgentModule removed
  ],
  controllers: [ZeeController],
  providers: [ZeeService, ZeeRepository],
})
export class ZeeModule {}
