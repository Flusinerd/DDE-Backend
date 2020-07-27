import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
import { RegisterUserDTO } from './dto/registerUser.dto';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private userModel: Model<User>){}

  async registerUser(userData: RegisterUserDTO): Promise<User>{
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async getOne(id: string): Promise<User>{
    return this.userModel.findById(id);
  }

  async loginUser(username: string, password: string): Promise<User>{
    const userWithPassword = await this.userModel.findOne({username}).select('+password');
    if (!userWithPassword || !userWithPassword.verifyPassword(password)) {
      throw new Error ('Wrong Credentials');
    }
    delete userWithPassword.password;
    return userWithPassword;
  }
  
  private async _getOneWithPassword(id: string): Promise<User>{
    return this.userModel.findById(id).select('+password');
  }
}
