import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IncidentsService } from './incidents/incidents.service';
import { Severity } from './incidents/entities/incident.entity';

const seeds = [
  { title: 'Database timeout on payment service', description: 'Users receiving timeout errors during checkout.', service: 'Payment API', severity: Severity.HIGH },
  { title: 'Auth token expiry not handled', description: 'Expired tokens not returning 401, causing silent failures.', service: 'Auth Service', severity: Severity.CRITICAL },
  { title: 'Notification emails delayed', description: 'Email queue backed up, notifications delayed by 30+ mins.', service: 'Notification Worker', severity: Severity.MEDIUM },
  { title: 'Slow query on orders endpoint', description: 'GET /orders taking 4-5s due to missing index.', service: 'Payment API', severity: Severity.LOW },
  { title: 'Memory leak in worker process', description: 'Worker memory grows unbounded after 24h uptime.', service: 'Notification Worker', severity: Severity.HIGH },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const service = app.get(IncidentsService);

  for (const item of seeds) {
    await service.create(item);
  }

  console.log('Seed data inserted.');
  await app.close();
}

seed().catch(console.error);
