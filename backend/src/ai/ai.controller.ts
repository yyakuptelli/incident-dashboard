import { Body, Controller, Post, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AiService } from './ai.service';

class AnalyzeDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;
}

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  @HttpCode(200)
  @ApiOperation({ summary: 'Auto-classify incident severity, service and generate a summary' })
  analyze(@Body() dto: AnalyzeDto) {
    return this.aiService.analyze(dto.title, dto.description);
  }
}
