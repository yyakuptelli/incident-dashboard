import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Severity } from '../entities/incident.entity';

export class CreateIncidentDto {
  @ApiProperty({ example: 'Database timeout on payment service' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'Users are receiving timeout errors during checkout.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Payment API' })
  @IsNotEmpty({ message: 'Service cannot be empty' })
  @IsString()
  service: string;

  @ApiProperty({ enum: Severity, example: Severity.HIGH })
  @IsEnum(Severity, { message: 'severity must be one of: low, medium, high, critical' })
  severity: Severity;
}
