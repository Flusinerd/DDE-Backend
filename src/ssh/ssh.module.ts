import { Module } from '@nestjs/common';
import { SshService } from './ssh.service';
import { SshController } from './ssh.controller';
import { SSHGateway } from './sshgateway';

@Module({
  providers: [SshService, SSHGateway]
})
export class SshModule {}
