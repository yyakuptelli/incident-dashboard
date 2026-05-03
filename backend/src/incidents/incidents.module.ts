import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Incident } from './entities/incident.entity';
import { IncidentRepository } from './repositories/incident.repository';
import { IncidentsService } from './incidents.service';
import { IncidentsController } from './incidents.controller';
import { IncidentsGateway } from './incidents.gateway';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([Incident]), AuditModule],
  providers: [IncidentRepository, IncidentsService, IncidentsGateway],
  controllers: [IncidentsController],
})
export class IncidentsModule {}
