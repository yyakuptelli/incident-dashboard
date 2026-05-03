import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IncidentsService } from './incidents.service';
import { IncidentsGateway } from './incidents.gateway';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentDto } from './dto/query-incident.dto';

@ApiTags('incidents')
@Controller('incidents')
export class IncidentsController {
  private readonly logger = new Logger(IncidentsController.name);

  constructor(
    private readonly service: IncidentsService,
    private readonly gateway: IncidentsGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create incident' })
  @ApiResponse({ status: 201 })
  async create(@Body() dto: CreateIncidentDto) {
    this.logger.log(`POST /incidents title="${dto.title}" service="${dto.service}"`);
    const incident = await this.service.create(dto);
    this.gateway.emitIncidentCreated(incident);
    return incident;
  }

  @Get()
  @ApiOperation({ summary: 'List incidents with filtering and pagination' })
  findAll(@Query() query: QueryIncidentDto) {
    this.logger.log(`GET /incidents query=${JSON.stringify(query)}`);
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get incident by id' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`GET /incidents/${id}`);
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update incident' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateIncidentDto,
  ) {
    this.logger.log(`PATCH /incidents/${id} body=${JSON.stringify(dto)}`);
    const incident = await this.service.update(id, dto);
    this.gateway.emitIncidentUpdated(incident);
    return incident;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete incident' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`DELETE /incidents/${id}`);
    await this.service.remove(id);
    this.gateway.emitIncidentDeleted(id);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get audit log for an incident' })
  getAuditLog(@Param('id', ParseUUIDPipe) id: string) {
    this.logger.log(`GET /incidents/${id}/audit`);
    return this.service.getAuditLog(id);
  }
}
