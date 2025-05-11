import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAgentDto, CreateElizaAgentDto, TYPE } from './dto/create-agent-dto';
import * as path from 'path';
import { CreateAgentRepository } from './create-agent.repository';
import * as fs from 'fs';
import { CreateElizaAgentRepository } from './create-eliza-agent.repository';
import * as Docker from 'dockerode';

@Injectable()
export class CreateAgentService {
  constructor(
    private readonly createAgentRepository: CreateAgentRepository,
    private readonly createElizaAgentRepository: CreateElizaAgentRepository,
  ) {}

  async create(createAgentDto: CreateAgentDto) {
    const newAgent = await this.createAgentRepository.create({
      ...createAgentDto,
    });

    return newAgent;
  }

  async getAllAgents() {
    try {
      // Get all agents from the ElizaAgent collection
      const agents = await this.createElizaAgentRepository.findAll();

      return {
        status: HttpStatus.OK,
        agents: agents.map(agent => ({
          id: agent._id,
          agentName: agent.agentName,
          bio: agent.bio,
          type: agent.type,
          knowledge: agent.knowledge,
          chain: agent.chain,
          contractAddress: agent.contractAddress,
          imageName: agent.imageName,
          port: agent.port,
          createdAt: agent.createdAt
        }))
      };
    } catch (error) {
      console.error('Error fetching agents:', error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message
      };
    }
  }

  async getAgentStats() {
    try {
      // Get all agents from the ElizaAgent collection
      const agents = await this.createElizaAgentRepository.findAll();

      console.log('Found agents:', agents.map(a => ({ name: a.agentName, type: a.type })));

      // Calculate stats from the actual database
      const totalAgents = agents.length;

      // Count agents by type (case-insensitive comparison)
      const gameAgents = agents.filter(agent =>
        agent.type?.toLowerCase() === 'game').length;

      const defiAgents = agents.filter(agent =>
        agent.type?.toLowerCase() === 'defi').length;

      const socialAgents = agents.filter(agent =>
        agent.type?.toLowerCase() === 'social').length;

      // Calculate percentage changes (for demo purposes, we'll use fixed values)
      // In a real app, you might compare with previous period data
      const characterChange = '+12%';
      const gameChange = '+6%';
      const defiChange = '+6%';
      const socialChange = '+6%';

      return {
        status: HttpStatus.OK,
        stats: {
          totalCharacters: {
            value: totalAgents,
            change: characterChange
          },
          totalGames: {
            value: gameAgents,
            change: gameChange
          },
          totalDefi: {
            value: defiAgents,
            change: defiChange
          },
          totalSocial: {
            value: socialAgents,
            change: socialChange
          }
        }
      };
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message
      };
    }
  }

  async deleteAgent(agentName: string) {
    try {
      const deleted = await this.createElizaAgentRepository.deleteByName(agentName);

      if (deleted) {
        return {
          status: HttpStatus.OK,
          message: `Agent "${agentName}" successfully deleted`
        };
      } else {
        return {
          status: HttpStatus.NOT_FOUND,
          message: `Agent "${agentName}" not found`
        };
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message
      };
    }
  }

  async createRootstockAgent(createElizaAgentDto: CreateElizaAgentDto) {
    try {
      // Log the received data for debugging
      console.log('Received data:', JSON.stringify(createElizaAgentDto, null, 2));

      // Validate required fields
      if (!createElizaAgentDto.agentName) {
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Agent name is required'
        };
      }

      if (!createElizaAgentDto.bio || !Array.isArray(createElizaAgentDto.bio) || createElizaAgentDto.bio.length === 0) {
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Bio is required and must be an array of strings'
        };
      }

      if (!createElizaAgentDto.type) {
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Type is required'
        };
      }

      if (!createElizaAgentDto.knowledge || !Array.isArray(createElizaAgentDto.knowledge)) {
        return {
          status: HttpStatus.BAD_REQUEST,
          error: 'Knowledge is required and must be an array of strings'
        };
      }

      //store the agent info in db
      let readFile;

      console.log('dirname', __dirname);

      if (createElizaAgentDto.type === 'game') {
        readFile = fs.readFileSync(
          path.join(
            process.cwd(),
            '/src/core/resources/create-agent/characters/game.json',
          ),
          'utf-8',
        );
      } else if (createElizaAgentDto.type === 'social') {
        readFile = fs.readFileSync(
          path.join(
            process.cwd(),
            '/src/core/resources/create-agent/characters/social-character.json',
          ),
          'utf-8',
        );
      } else if (createElizaAgentDto.type === 'ai-companion') {
        readFile = fs.readFileSync(
          path.join(
            process.cwd(),
            '/src/core/resources/create-agent/characters/ai-companion.json',
          ),
          'utf-8',
        );
      } else {
        readFile = fs.readFileSync(
          path.join(
            process.cwd(),
            '/src/core/resources/create-agent/characters/defi-character.json',
          ),
          'utf-8',
        );
      }

      const jsonObject = JSON.parse(readFile);

      jsonObject.name = createElizaAgentDto.agentName;
      jsonObject.bio = createElizaAgentDto.bio;

      // Add contract address and chain if available
      if (createElizaAgentDto.contractAddress) {
        jsonObject.contractAddress = createElizaAgentDto.contractAddress;
      }

      if (createElizaAgentDto.chain) {
        jsonObject.chain = createElizaAgentDto.chain;
      } else {
        jsonObject.chain = 'rootstock';
      }

      // Check if elizaRootstock directory exists
      const elizaRootstockPath = path.join(process.cwd(), '../elizaRootstock');
      const charactersPath = path.join(elizaRootstockPath, 'characters');

      try {
        // Create directories if they don't exist
        if (!fs.existsSync(elizaRootstockPath)) {
          fs.mkdirSync(elizaRootstockPath, { recursive: true });
        }
        if (!fs.existsSync(charactersPath)) {
          fs.mkdirSync(charactersPath, { recursive: true });
        }

        const filePath = path.join(charactersPath, `${createElizaAgentDto.agentName}.json`);

        fs.writeFileSync(filePath, JSON.stringify(jsonObject, null, 2));
        console.log(`Character file created at ${filePath}`);
      } catch (err) {
        console.log('Error creating character file:', err);
      }

      const lastAgent = await this.createElizaAgentRepository.findLast();

      // Default to port 3000 if lastAgent is null or port is not defined
      const port = lastAgent?.port ? lastAgent.port + 1 : 3000;

      console.log('Skipping Docker operations for testing purposes...');

      // For testing purposes, we'll skip Docker operations
      // and just create the agent in the database
      await this.createElizaAgentRepository.create({
        ...createElizaAgentDto,
        imageName: `agentic-${createElizaAgentDto.agentName}`,
        containerName: 'test-container-id',
        port: port,
      });

      console.log('Added new agent in DB...');

      return { status: HttpStatus.OK };
    } catch (error) {
      console.log(error);
      return { status: HttpStatus.INTERNAL_SERVER_ERROR, error: error.message };
    }
  }
}
