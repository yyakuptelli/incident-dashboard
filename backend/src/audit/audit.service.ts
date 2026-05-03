import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly repo: Repository<AuditLog>,
  ) {}

  log(incidentId: string, action: AuditAction, changes: Record<string, { from: unknown; to: unknown }> | null = null) {
    return this.repo.save(this.repo.create({ incidentId, action, changes }));
  }

  findByIncident(incidentId: string) {
    return this.repo.find({
      where: { incidentId },
      order: { createdAt: 'DESC' },
    });
  }
}
