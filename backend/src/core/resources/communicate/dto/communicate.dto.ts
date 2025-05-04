import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CommunicateDto {
  @IsString()
  @IsOptional()
  userInput?: string;

  @IsString()
  @IsOptional()
  message?: string;

  constructor(partial: Partial<CommunicateDto>) {
    Object.assign(this, partial);
  }
}
