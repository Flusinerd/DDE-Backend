import { Controller, Post, Body, Get, Put, Param } from '@nestjs/common';
import { SshService } from './ssh.service';

@Controller('ssh')
export class SshController {

  constructor(private readonly _sshService: SshService){}

  @Get()
  async getAllConnections(){
    return this._sshService['_idCounter'];
  }
}
