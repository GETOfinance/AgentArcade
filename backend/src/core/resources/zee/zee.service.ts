import { Injectable } from '@nestjs/common';
import { ZeeRepository } from './zee.repository';
import { CreateZeeDto } from './dto/create-zee.dto';

@Injectable()
export class ZeeService {
  constructor(
    private readonly ZeeRepository: ZeeRepository,
  ) {}

  async create(createZeeDto: CreateZeeDto) {
    const data = await this.ZeeRepository.create(createZeeDto);

    return data;
  }

  async runZeeWorkflow(zeeName: string) {
    const data = await this.ZeeRepository.findByName(zeeName);

    // Covalent agent service removed
    console.log(`Zee workflow ${zeeName} found, but Covalent agent service has been removed.`);

    return {
      message: `Zee workflow ${zeeName} found, but Covalent agent service has been removed.`
    };
  }
}
