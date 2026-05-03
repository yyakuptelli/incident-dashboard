import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Severity, Status } from '../entities/incident.entity';

export class UpdateIncidentDto {
  @ApiPropertyOptional({ enum: Status })
  @IsOptional()
  @IsEnum(Status, { message: 'status must be one of: open, investigating, resolved' })
  status?: Status;

  @ApiPropertyOptional({ enum: Severity })
  @IsOptional()
  @IsEnum(Severity, { message: 'severity must be one of: low, medium, high, critical' })
  severity?: Severity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;
}
