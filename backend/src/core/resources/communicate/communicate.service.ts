import { Injectable } from '@nestjs/common';
import { CoinbaseAgentService } from 'src/lib/coinbase-agent/coinbase-agent.service';
import { CommunicateDto } from './dto/communicate.dto';
import { CreateAgentRepository } from '../create-agent/create-agent.repository';
import { CreateElizaAgentRepository } from '../create-agent/create-eliza-agent.repository';
import { SDK } from '../create-agent/dto/create-agent-dto';
import { OpenAIService } from 'src/lib/openai/openai.service';

@Injectable()
export class CommunicateService {
  constructor(
    private readonly agentKitService: CoinbaseAgentService,
    private readonly createAgentRepository: CreateAgentRepository,
    private readonly createElizaAgentRepository: CreateElizaAgentRepository,
    private readonly openAIService: OpenAIService,
  ) {}

  async comunicate(agentName: string, communicateDto: CommunicateDto) {
    // Try to find the agent in the regular agent repository
    const agent = await this.createAgentRepository.findByName(agentName);

    // If not found, try to find it in the eliza agent repository
    if (!agent) {
      const elizaAgent = await this.createElizaAgentRepository.findByName(agentName);

      if (elizaAgent) {
        // For eliza agents, use OpenAI to generate a response
        const userMessage = communicateDto.message || communicateDto.userInput || '';
        const response = await this.openAIService.generateResponse(
          agentName,
          elizaAgent.bio,
          userMessage
        );
        return {
          message: response
        };
      }

      return { message: `Agent with name ${agentName} not found` };
    }

    // For testing purposes, if the agent doesn't have an SDK (like our TestAgent),
    // use OpenAI to generate a response
    if (!agent.sdk) {
      const userMessage = communicateDto.message || communicateDto.userInput || '';
      const response = await this.openAIService.generateResponse(
        agentName,
        ['A DeFi assistant specialized in Rootstock Testnet blockchain'],
        userMessage
      );
      return {
        message: response
      };
    }

    const userMessage = communicateDto.message || communicateDto.userInput || '';

    switch (agent.sdk) {
      case SDK.AGENT_KIT:
        let res = await this.agentKitService.runCoinbaseAgent(
          userMessage,
        );
        return res;
      // Covalent case removed
      default:
        return { message: `Agent ${agentName} has an unknown SDK type: ${agent.sdk}` };
    }
  }
}
