import { Module } from '@nestjs/common';
import { CommunicateService } from './communicate.service';
import { CommunicateController } from './communicate.controller';
import { CoinbaseAgentModule } from 'src/lib/coinbase-agent/coinbase-agent.module';
import { CreateAgentModule } from '../create-agent/create-agent.module';
import { OpenAIModule } from 'src/lib/openai/openai.module';

@Module({
  imports: [
    CoinbaseAgentModule.register(),
    // CovalentAgentModule removed
    CreateAgentModule,
    OpenAIModule,
  ],
  controllers: [CommunicateController],
  providers: [CommunicateService],
})
export class CommunicateModule {}
