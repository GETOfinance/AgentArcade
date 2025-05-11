import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateAgentService } from './create-agent.service';
import { CreateAgentDto, CreateElizaAgentDto } from './dto/create-agent-dto';

@Controller('create-agent')
export class CreateAgentController {
  constructor(private readonly createAgentService: CreateAgentService) {}

  @Post()
  async create(@Body() createAgentDto: CreateAgentDto) {
    await this.createAgentService.create(createAgentDto);
  }

  // Main endpoint for Rootstock
  @Post('rootstock')
  async createRootstockAgent(@Body() createElizaAgentDto: CreateElizaAgentDto) {
    const data =
      await this.createAgentService.createRootstockAgent(createElizaAgentDto);

    return data;
  }

  // Legacy endpoints kept for backward compatibility - both redirect to Rootstock
  @Post('flow')
  async createFlowAgent(@Body() createElizaAgentDto: CreateElizaAgentDto) {
    return this.createRootstockAgent(createElizaAgentDto);
  }

  @Post('opencampuscodex')
  async createOpenCampusCodexAgent(@Body() createElizaAgentDto: CreateElizaAgentDto) {
    return this.createRootstockAgent(createElizaAgentDto);
  }

  @Get('all')
  async getAllAgents() {
    return this.createAgentService.getAllAgents();
  }

  @Get('stats')
  async getAgentStats() {
    return this.createAgentService.getAgentStats();
  }

  @Get('delete/:agentName')
  async deleteAgent(@Param('agentName') agentName: string) {
    return this.createAgentService.deleteAgent(agentName);
  }
}
