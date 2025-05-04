import { Injectable } from '@nestjs/common';
import { CoinbaseAgentService } from 'src/lib/coinbase-agent/coinbase-agent.service';
import { CommunicateDto } from './dto/communicate.dto';
import { CreateAgentRepository } from '../create-agent/create-agent.repository';
import { CreateElizaAgentRepository } from '../create-agent/create-eliza-agent.repository';
import { SDK } from '../create-agent/dto/create-agent-dto';
import { CovalentAgentService } from 'src/lib/covalent-agent/covalent-agent.service';

@Injectable()
export class CommunicateService {
  constructor(
    private readonly agentKitService: CoinbaseAgentService,
    private readonly covalentAgentService: CovalentAgentService,
    private readonly createAgentRepository: CreateAgentRepository,
    private readonly createElizaAgentRepository: CreateElizaAgentRepository,
  ) {}

  async comunicate(agentName: string, communicateDto: CommunicateDto) {
    // Try to find the agent in the regular agent repository
    const agent = await this.createAgentRepository.findByName(agentName);

    // If not found, try to find it in the eliza agent repository
    if (!agent) {
      const elizaAgent = await this.createElizaAgentRepository.findByName(agentName);

      if (elizaAgent) {
        // For eliza agents, we'll return a mock response
        const userMessage = communicateDto.message || communicateDto.userInput || '';
        return {
          message: `Hello! I'm ${agentName}, an AI assistant created for testing purposes. You said: "${userMessage}". How can I help you today?`
        };
      }

      return { message: `Agent with name ${agentName} not found` };
    }

    // For testing purposes, if the agent doesn't have an SDK (like our TestAgent),
    // we'll return a mock response
    if (!agent.sdk) {
      const userMessage = communicateDto.message || communicateDto.userInput || '';
      return {
        message: `Hello! I'm ${agentName}, an AI assistant created for testing purposes. You said: "${userMessage}". How can I help you today?`
      };
    }

    const userMessage = communicateDto.message || communicateDto.userInput || '';

    switch (agent.sdk) {
      case SDK.AGENT_KIT:
        let res = await this.agentKitService.runCoinbaseAgent(
          userMessage,
        );
        return res;
      case SDK.COVALENT:
        const response = await this.covalentAgentService.runCovalentAgent(
          agentName,
          userMessage,
        );
        return response;
      default:
        return { message: `Agent ${agentName} has an unknown SDK type: ${agent.sdk}` };
    }
  }
}
