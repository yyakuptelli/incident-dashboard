import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { IncidentRepository } from './repositories/incident.repository';
import { AuditService } from '../audit/audit.service';
import { CreateIncidentDto } from './dto/create-incident.dto';
import { UpdateIncidentDto } from './dto/update-incident.dto';
import { QueryIncidentDto } from './dto/query-incident.dto';
import { Incident } from './entities/incident.entity';

@Injectable()
export class IncidentsService {
  private readonly logger = new Logger(IncidentsService.name);

  constructor(
    private readonly incidentRepository: IncidentRepository,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateIncidentDto): Promise<Incident> {
    try {
      const incident = await this.incidentRepository.create(dto);
      this.logger.log(`Created incident: ${incident.id}`);
      await this.auditService.log(incident.id, 'created', null);
      return incident;
    } catch (err) {
      this.logger.error(`Failed to create incident: ${(err as Error).message}`);
      throw err;
    }
  }

  async findAll(query: QueryIncidentDto) {
    try {
      return await this.incidentRepository.findAll(query);
    } catch (err) {
      this.logger.error(`Failed to list incidents: ${(err as Error).message}`);
      throw err;
    }
  }

  async findOne(id: string): Promise<Incident> {
    const incident = await this.incidentRepository.findOne(id);
    if (!incident) {
      this.logger.warn(`Incident not found: ${id}`);
      throw new NotFoundException(`Incident ${id} not found`);
    }
    return incident;
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<Incident> {
    try {
      const before = await this.findOne(id);
      const incident = await this.incidentRepository.update(id, dto);
      if (!incident) throw new NotFoundException(`Incident ${id} not found`);
      this.logger.log(`Updated incident: ${id}`);

      const changes: Record<string, { from: unknown; to: unknown }> = {};
      for (const key of Object.keys(dto) as (keyof UpdateIncidentDto)[]) {
        if (dto[key] !== undefined && dto[key] !== before[key]) {
          changes[key] = { from: before[key], to: dto[key] };
        }
      }
      await this.auditService.log(id, 'updated', Object.keys(changes).length ? changes : null);
      return incident;
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        this.logger.error(`Failed to update incident ${id}: ${(err as Error).message}`);
      }
      throw err;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      const deleted = await this.incidentRepository.remove(id);
      if (!deleted) {
        this.logger.warn(`Delete attempted on non-existent incident: ${id}`);
        throw new NotFoundException(`Incident ${id} not found`);
      }
      this.logger.log(`Deleted incident: ${id}`);
      await this.auditService.log(id, 'deleted', null);
    } catch (err) {
      if (!(err instanceof NotFoundException)) {
        this.logger.error(`Failed to delete incident ${id}: ${(err as Error).message}`);
      }
      throw err;
    }
  }

  getAuditLog(incidentId: string) {
    return this.auditService.findByIncident(incidentId);
  }
}
