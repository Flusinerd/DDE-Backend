import { Module } from '@nestjs/common';
import { KubernetesController } from './kubernetes.controller';
import { KubernetesService } from './kubernetes.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [KubernetesController],
  providers: [KubernetesService],
})
export class KubernetesModule {}
