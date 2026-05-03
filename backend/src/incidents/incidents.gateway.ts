import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { Incident } from './entities/incident.entity';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class IncidentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(IncidentsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitIncidentCreated(incident: Incident) {
    this.server.emit('incident:created', incident);
  }

  emitIncidentUpdated(incident: Incident) {
    this.server.emit('incident:updated', incident);
  }

  emitIncidentDeleted(id: string) {
    this.server.emit('incident:deleted', { id });
  }
}
