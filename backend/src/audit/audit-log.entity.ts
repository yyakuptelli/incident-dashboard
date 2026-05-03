import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export type AuditAction = 'created' | 'updated' | 'deleted';

@Entity('incident_audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  incidentId: string;

  @Column()
  action: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  changes: Record<string, { from: unknown; to: unknown }> | null;

  @CreateDateColumn()
  createdAt: Date;
}
