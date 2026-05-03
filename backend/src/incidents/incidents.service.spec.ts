import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IncidentsService } from './incidents.service';
import { IncidentRepository } from './repositories/incident.repository';
import { AuditService } from '../audit/audit.service';
import { Severity, Status } from './entities/incident.entity';

const mockIncident = {
  id: 'uuid-1',
  title: 'Test incident',
  description: 'desc',
  service: 'Payment API',
  severity: Severity.HIGH,
  status: Status.OPEN,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const mockRepo = {
  create: jest.fn().mockResolvedValue(mockIncident),
  findAll: jest.fn().mockResolvedValue({ data: [mockIncident], total: 1, page: 1, totalPages: 1 }),
  findOne: jest.fn().mockResolvedValue(mockIncident),
  update: jest.fn().mockResolvedValue({ ...mockIncident, status: Status.RESOLVED }),
  remove: jest.fn().mockResolvedValue(true),
};

const mockAudit = {
  log: jest.fn().mockResolvedValue({}),
  findByIncident: jest.fn().mockResolvedValue([]),
};

describe('IncidentsService', () => {
  let service: IncidentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        { provide: IncidentRepository, useValue: mockRepo },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    jest.clearAllMocks();
    mockRepo.create.mockResolvedValue(mockIncident);
    mockRepo.findOne.mockResolvedValue(mockIncident);
    mockRepo.update.mockResolvedValue({ ...mockIncident, status: Status.RESOLVED });
    mockRepo.remove.mockResolvedValue(true);
    mockAudit.log.mockResolvedValue({});
  });

  it('create — returns incident and logs audit', async () => {
    const dto = { title: 'Test', service: 'Payment API', severity: Severity.HIGH };
    const result = await service.create(dto);
    expect(result.id).toBe('uuid-1');
    expect(mockAudit.log).toHaveBeenCalledWith('uuid-1', 'created', null);
  });

  it('findOne — throws NotFoundException when not found', async () => {
    mockRepo.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
  });

  it('update — patches fields and records audit changes', async () => {
    const result = await service.update('uuid-1', { status: Status.RESOLVED });
    expect(result.status).toBe(Status.RESOLVED);
    expect(mockAudit.log).toHaveBeenCalledWith(
      'uuid-1',
      'updated',
      { status: { from: Status.OPEN, to: Status.RESOLVED } },
    );
  });

  it('remove — soft deletes and logs audit', async () => {
    await service.remove('uuid-1');
    expect(mockRepo.remove).toHaveBeenCalledWith('uuid-1');
    expect(mockAudit.log).toHaveBeenCalledWith('uuid-1', 'deleted', null);
  });

  it('remove — throws NotFoundException when incident does not exist', async () => {
    mockRepo.remove.mockResolvedValueOnce(false);
    await expect(service.remove('missing')).rejects.toThrow(NotFoundException);
  });
});
