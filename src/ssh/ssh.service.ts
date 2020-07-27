import { Injectable } from '@nestjs/common';
import SSH2Promise = require('ssh2-promise');
import { SSHConnetion } from './interface/sshConnection.interface';
import { BehaviorSubject } from 'rxjs';
import { ShellSocket } from './interface/shellsocket.interface';
import { SSHConfig } from './interface/sshconfig.interface';
import { clearScreenDown } from 'readline';

@Injectable()
export class SshService {
  
  private _connections = new BehaviorSubject<SSHConnetion[]>([]);
  private _idCounter = 0;
  private _socketIdCounter = 0;
  private _shells = new BehaviorSubject<ShellSocket[]>([]);

  /**
   * Creates a connection to a SSH Server and returns the connection together with the connection ID
   * @param config SSH Connection Config
   */
  async connectToServer(config: SSHConfig, clientId: string): Promise<SSHConnetion>{
    const connection = new SSH2Promise(config);
    const connectionObject: SSHConnetion = {
      id: this._idCounter++,
      sshConnection: connection,
      clientId,
      isOpen: true,
    }
    const connections = this._connections.getValue()
    connections.push(connectionObject);
    this._connections.next(connections);

    await connection.connect();
    console.log('Connected to host: ' + config.host);
    return connectionObject;
  }

  /**
   * Closes a connection and returns true if successfull
   * @param connectionId Connection id
   */
  async closeConnection(connectionId: number): Promise<boolean>{
    let connection: SSHConnetion;
    try {
      connection = this._findConnectionWithId(connectionId);
    } catch (error) {
      throw error;
    }
    await connection.sshConnection.close();
    console.log(`Connection ${connection.id} closed`);
    const connections = this._connections.getValue();
    const index = connections.findIndex((searchElement) => searchElement.id === connectionId);
    if (index >= 0){
      connections[index].isOpen = false;
    }
    this._connections.next(connections);
    console.log('connections', this._connections.getValue());
    return true;
  }

  getConnectionId(clientId: string): number{
    const connection = this._connections.getValue().find((searchElement) => searchElement.clientId === clientId);
    if (connection){
      return connection.id
    }
    return undefined;
  }

  /**
   * Opens a shell socket and returns a promise with the socket
   * @param connectionId connection id
   */
  async openShellSession(connectionId: number, clientId: string){
    let connection: SSHConnetion;
    try {
      connection = this._findConnectionWithId(connectionId)
    } catch (error) {
      throw error;
    }
    const socket = await connection.sshConnection.shell();
    const shells = this._shells.getValue();
    const shellObject = {
      id: this._socketIdCounter++,
      isOpen: true,
      socket,
      clientId,
    }

    shells.push(shellObject);
    this._shells.next(shells);
    return shellObject;
  }

  /**
   * Finds a SSHConnection in the existing connections and returns it
   * @param connectionId Connection ID
   */
  private _findConnectionWithId(connectionId: number): SSHConnetion{
    const connection = this._connections.getValue().find((searchConnection) => searchConnection.id === connectionId);
    if (!connection) throw new Error('No connection with that ID exists');
    return connection;
  }

  private _findConnectionWithClientId(clientId: string): SSHConnetion{
    const connections = this._connections.getValue();
    const connection = connections.find((searchElement) => searchElement.clientId === clientId);
    if (!connection) throw new Error ('No Connection found');
    return connection;
  }

  private _findShellSocket(clientId: string): ShellSocket{
    const shellSocket = this._shells.getValue().find((searchElement) => searchElement.clientId === clientId);
    if (!shellSocket) throw new Error('No Shell Socket found');
    return shellSocket
  }

  async sendShellMessage(clientId: string, msg: string): Promise<void>{
    try {
      const connection = this._findConnectionWithClientId(clientId);
      if (!connection.isOpen) throw new Error('Connection is closed');
      const shellSocket = this._findShellSocket(clientId);
      shellSocket.socket.write(msg);
    } catch (error) {
      throw error;
    }
  }
}
