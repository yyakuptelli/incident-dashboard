import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsModule } from './incidents/incidents.module';
import { Incident } from './incidents/entities/incident.entity';
import { AuditLog } from './audit/audit-log.entity';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST', 'localhost'),
        port: config.get<number>('DATABASE_PORT', 5432),
        username: config.get('DATABASE_USER', 'adl_user'),
        password: config.get('DATABASE_PASSWORD', 'adl_pass'),
        database: config.get('DATABASE_NAME', 'adl_db'),
        entities: [Incident, AuditLog],
        synchronize: true,
        logging: false,
      }),
    }),
    IncidentsModule,
    AiModule,
  ],
})
export class AppModule {}
