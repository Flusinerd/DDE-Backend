import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SshService } from './ssh.service';
import { SSHConfig } from './interface/sshconfig.interface';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class SSHGateway {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SSH Gateway');

  constructor(private readonly _sshService: SshService) {
    this.logger.log("Gateway running");
  }

  @SubscribeMessage('connectSSH')
  async connectSSH(
    @MessageBody() data: SSHConfig,
    @ConnectedSocket() client: Socket,
  ) {
    const connection = await this._sshService.connectToServer(data, client.id);
    const shell = await this._sshService.openShellSession(connection.id, client.id);
    shell.socket.on('data', (data: Buffer) => {
      console.log('Recieving from shell', data.toString('utf-8'));
      client.emit('sshmessage', data.toString('utf-8'));
    });
    client.on('disconnect', () => {
      console.log('Client disconnected', client.id);
      const connectionId = this._sshService.getConnectionId(client.id);
      this._sshService.closeConnection(connectionId);
    });
    return client.id;
  }

  @SubscribeMessage('shellMessage')
  async onShellMessage(@MessageBody() msg: string, @ConnectedSocket() client: Socket){
    this._sshService.sendShellMessage(client.id, msg);
    console.log('Sending to shell', msg);
    return client.id;
  }
}
