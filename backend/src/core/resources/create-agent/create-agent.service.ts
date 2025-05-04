import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAgentDto, CreateElizaAgentDto } from './dto/create-agent-dto';
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

  async createRootstockAgent(createElizaAgentDto: CreateElizaAgentDto) {
    try {
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
