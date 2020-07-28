import { Module, DynamicModule } from '@nestjs/common';
import { ConfigurationService } from './config.service';

@Module({
  providers: [ConfigurationService],
  exports: [ConfigurationService]
})
export class ConfigurationModule {}
