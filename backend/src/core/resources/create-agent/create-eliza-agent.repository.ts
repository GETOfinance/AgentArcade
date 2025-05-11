import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ElizaAgent } from './agent.schema';
import { Model } from 'mongoose';
import { CreateElizaAgentDto } from './dto/create-agent-dto';

// In-memory storage for testing without MongoDB
const inMemoryElizaAgents: (ElizaAgent & { createdAt: Date })[] = [];

// Log function for debugging
function logElizaAgents() {
  console.log('In-memory eliza agents:', JSON.stringify(inMemoryElizaAgents, null, 2));
}

@Injectable()
export class CreateElizaAgentRepository {
  private readonly skipMongoDB: boolean;
  private readonly elizaAgentModel?: Model<ElizaAgent>;

  constructor(
    @Optional() @InjectModel(ElizaAgent.name)
    elizaAgentModel?: Model<ElizaAgent>,
  ) {
    this.skipMongoDB = process.env.SKIP_MONGODB === 'true';
    this.elizaAgentModel = elizaAgentModel;
  }

  async create(
    createElizaAgentDto: CreateElizaAgentDto & {
      imageName: string;
      containerName: string;
      port: number;
    },
  ) {
    if (this.skipMongoDB) {
      const newElizaAgent = {
        ...createElizaAgentDto,
        _id: Date.now().toString(),
        createdAt: new Date(),
      };
      inMemoryElizaAgents.push(newElizaAgent as any);
      console.log('Created eliza agent:', JSON.stringify(newElizaAgent, null, 2));
      logElizaAgents();
      return newElizaAgent;
    }

    const newElizaAgent = new this.elizaAgentModel(createElizaAgentDto);
    return newElizaAgent.save();
  }

  async findByName(agentName: string) {
    if (this.skipMongoDB) {
      console.log(`Finding eliza agent by name: ${agentName}`);
      logElizaAgents();
      const agent = inMemoryElizaAgents.find(agent => agent['agentName'] === agentName) || null;
      console.log('Found eliza agent:', agent ? JSON.stringify(agent, null, 2) : 'null');
      return agent;
    }

    const agent = await this.elizaAgentModel.findOne({ agentName });
    return agent;
  }

  async findLast() {
    if (this.skipMongoDB) {
      if (inMemoryElizaAgents.length === 0) return null;

      // Sort by createdAt in descending order and return the first one
      return [...inMemoryElizaAgents]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
    }

    const agent = await this.elizaAgentModel.findOne().sort({ createdAt: -1 });
    return agent;
  }

  async findAll() {
    if (this.skipMongoDB) {
      return inMemoryElizaAgents;
    }

    const agents = await this.elizaAgentModel.find().sort({ createdAt: -1 });
    return agents;
  }

  async deleteByName(agentName: string) {
    if (this.skipMongoDB) {
      const index = inMemoryElizaAgents.findIndex(agent => agent.agentName === agentName);
      if (index !== -1) {
        inMemoryElizaAgents.splice(index, 1);
        return true;
      }
      return false;
    }

    const result = await this.elizaAgentModel.deleteOne({ agentName });
    return result.deletedCount > 0;
  }
}
