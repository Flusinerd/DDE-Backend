import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SshModule } from './ssh/ssh.module';
import { KubernetesModule } from './kubernetes/kubernetes.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    SshModule,
    KubernetesModule,
    MongooseModule.forRoot(process.env.MONGO_CONNECTION),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
