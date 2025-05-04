import { InjectModel } from '@nestjs/mongoose';
import { Agent } from './agent.schema';
import { Model } from 'mongoose';
import { Injectable, Optional } from '@nestjs/common';

// In-memory storage for testing without MongoDB
const inMemoryAgents: Agent[] = [];

// Log function for debugging
function logAgents() {
  console.log('In-memory agents:', JSON.stringify(inMemoryAgents, null, 2));
}

@Injectable()
export class CreateAgentRepository {
  private readonly skipMongoDB: boolean;
  private readonly agentModel?: Model<Agent>;

  constructor(
    @Optional() @InjectModel(Agent.name) agentModel?: Model<Agent>,
  ) {
    this.skipMongoDB = process.env.SKIP_MONGODB === 'true';
    this.agentModel = agentModel;
  }

  async create(agent: any) {
    if (this.skipMongoDB) {
      const newAgent = { ...agent, _id: Date.now().toString() };
      inMemoryAgents.push(newAgent as Agent);
      console.log('Created agent:', JSON.stringify(newAgent, null, 2));
      logAgents();
      return newAgent;
    }

    const newAgent = new this.agentModel(agent);
    return newAgent.save();
  }

  async findByName(agentName: string) {
    if (this.skipMongoDB) {
      console.log(`Finding agent by name: ${agentName}`);
      logAgents();
      const agent = inMemoryAgents.find(agent => agent.agentName === agentName) || null;
      console.log('Found agent:', agent ? JSON.stringify(agent, null, 2) : 'null');
      return agent;
    }

    const agent = await this.agentModel.findOne({ agentName });
    return agent;
  }
}
