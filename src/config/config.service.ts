import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  private readonly envConfig:EnvConfig = {mongodbConnection: ''}

  constructor(private readonly _configService: ConfigService){
    console.log(this._configService)
    this.envConfig.mongodbConnection = this._configService.get('MONGO_CONNECTION');
  }

  get mongoConnection() {
    return this.envConfig.mongodbConnection;
  }
}

export interface EnvConfig{
  mongodbConnection: string;
}
