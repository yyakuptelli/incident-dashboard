import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { IncidentsGateway } from './incidents.gateway';
import { Severity, Status } from './entities/incident.entity';

const mockIncident = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  title: 'DB connection timeout',
  description: 'Connection pool exhausted',
  service: 'Payment API',
  severity: Severity.HIGH,
  status: Status.OPEN,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  deletedAt: null,
};

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getAuditLog: jest.fn(),
};

const mockGateway = {
  emitIncidentCreated: jest.fn(),
  emitIncidentUpdated: jest.fn(),
  emitIncidentDeleted: jest.fn(),
};

describe('IncidentsController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IncidentsController],
      providers: [
        { provide: IncidentsService, useValue: mockService },
        { provide: IncidentsGateway, useValue: mockGateway },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /incidents', () => {
    it('creates an incident and returns 201', async () => {
      mockService.create.mockResolvedValueOnce(mockIncident);

      const res = await request(app.getHttpServer())
        .post('/incidents')
        .send({ title: 'DB connection timeout', service: 'Payment API', severity: 'high' })
        .expect(201);

      expect(res.body.title).toBe('DB connection timeout');
      expect(mockGateway.emitIncidentCreated).toHaveBeenCalledWith(mockIncident);
    });

    it('returns 400 when title is missing', async () => {
      await request(app.getHttpServer())
        .post('/incidents')
        .send({ service: 'Payment API', severity: 'high' })
        .expect(400);
    });

    it('returns 400 when severity is invalid', async () => {
      await request(app.getHttpServer())
        .post('/incidents')
        .send({ title: 'Test', service: 'Payment API', severity: 'extreme' })
        .expect(400);
    });
  });

  describe('GET /incidents', () => {
    it('returns paginated incident list', async () => {
      const paginated = { data: [mockIncident], total: 1, totalPages: 1, currentPage: 1 };
      mockService.findAll.mockResolvedValueOnce(paginated);

      const res = await request(app.getHttpServer())
        .get('/incidents')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.total).toBe(1);
    });

    it('passes filter params to service', async () => {
      mockService.findAll.mockResolvedValueOnce({ data: [], total: 0, totalPages: 0, currentPage: 1 });

      await request(app.getHttpServer())
        .get('/incidents?status=open&severity=high&page=1&limit=5')
        .expect(200);

      expect(mockService.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'open', severity: 'high' }),
      );
    });
  });

  describe('GET /incidents/:id', () => {
    it('returns a single incident', async () => {
      mockService.findOne.mockResolvedValueOnce(mockIncident);

      const res = await request(app.getHttpServer())
        .get(`/incidents/${mockIncident.id}`)
        .expect(200);

      expect(res.body.id).toBe(mockIncident.id);
    });

    it('returns 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/incidents/not-a-uuid')
        .expect(400);
    });
  });

  describe('PATCH /incidents/:id', () => {
    it('updates an incident and emits socket event', async () => {
      const updated = { ...mockIncident, status: Status.INVESTIGATING };
      mockService.update.mockResolvedValueOnce(updated);

      const res = await request(app.getHttpServer())
        .patch(`/incidents/${mockIncident.id}`)
        .send({ status: 'investigating' })
        .expect(200);

      expect(res.body.status).toBe('investigating');
      expect(mockGateway.emitIncidentUpdated).toHaveBeenCalledWith(updated);
    });
  });

  describe('DELETE /incidents/:id', () => {
    it('soft deletes and returns 204', async () => {
      mockService.remove.mockResolvedValueOnce(undefined);

      await request(app.getHttpServer())
        .delete(`/incidents/${mockIncident.id}`)
        .expect(204);

      expect(mockGateway.emitIncidentDeleted).toHaveBeenCalledWith(mockIncident.id);
    });
  });

  describe('GET /incidents/:id/audit', () => {
    it('returns audit log entries', async () => {
      const auditLog = [{ id: 'audit-1', action: 'created', changes: null, createdAt: new Date() }];
      mockService.getAuditLog.mockResolvedValueOnce(auditLog);

      const res = await request(app.getHttpServer())
        .get(`/incidents/${mockIncident.id}/audit`)
        .expect(200);

      expect(res.body).toHaveLength(1);
      expect(res.body[0].action).toBe('created');
    });
  });
});
