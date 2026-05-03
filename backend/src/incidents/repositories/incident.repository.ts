import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Incident } from '../entities/incident.entity';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { QueryIncidentDto } from '../dto/query-incident.dto';

@Injectable()
export class IncidentRepository {
  constructor(
    @InjectRepository(Incident)
    private readonly repo: Repository<Incident>,
  ) {}

  async create(dto: CreateIncidentDto): Promise<Incident> {
    const incident = this.repo.create(dto);
    return this.repo.save(incident);
  }

  async findAll(query: QueryIncidentDto): Promise<{ data: Incident[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10, status, severity, service } = query;
    const qb = this.repo.createQueryBuilder('incident');

    if (status) qb.andWhere('incident.status = :status', { status });
    if (severity) qb.andWhere('incident.severity = :severity', { severity });
    if (service) qb.andWhere('incident.service ILIKE :service', { service: `${service}%` });

    qb.orderBy('incident.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Incident | null> {
    return this.repo.findOne({ where: { id } });
  }

  async update(id: string, dto: UpdateIncidentDto): Promise<Incident | null> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return (result.affected ?? 0) > 0;
  }
}
