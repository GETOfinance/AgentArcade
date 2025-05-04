import { Injectable, Optional } from '@nestjs/common';
import { Zee } from './zee.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateZeeDto } from './dto/create-zee.dto';

// In-memory storage for testing without MongoDB
const inMemoryZees: Zee[] = [];

@Injectable()
export class ZeeRepository {
  private readonly skipMongoDB: boolean;
  private readonly zeeModel?: Model<Zee>;

  constructor(
    @Optional() @InjectModel(Zee.name) zeeModel?: Model<Zee>,
  ) {
    this.skipMongoDB = process.env.SKIP_MONGODB === 'true';
    this.zeeModel = zeeModel;
  }

  async create(createZeeDto: CreateZeeDto) {
    if (this.skipMongoDB) {
      // Map the DTO fields to match the schema
      const newZee = {
        ...createZeeDto,
        _id: Date.now().toString(),
        // Map zeeGoal from DTO to goal in schema
        goal: createZeeDto.zeeGoal
      };
      inMemoryZees.push(newZee as unknown as Zee);
      return newZee;
    }

    const newZee = new this.zeeModel(createZeeDto);
    return await newZee.save();
  }

  async findAll() {
    if (this.skipMongoDB) {
      return inMemoryZees;
    }

    const data = await this.zeeModel.find().lean();
    return data;
  }

  async findByName(name: string) {
    if (this.skipMongoDB) {
      return inMemoryZees.find(zee => zee['zeeName'] === name) || null;
    }

    const data = await this.zeeModel.findOne({ zeeName: name }).lean();
    return data;
  }
}
