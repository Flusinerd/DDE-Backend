import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { hash, compare } from 'bcrypt';



@Module({
  providers: [AuthService],
  controllers: [AuthController],
  imports: [
    MongooseModule.forFeatureAsync([
      { 
        name: User.name, 
        useFactory: () => {
          const schema = UserSchema;
          schema.pre<User>('save', async function() {
            this.password = await hash(this.password, 10)
          });
          schema.methods.verifyPassword = async function(password: string): Promise<boolean> {
            return compare(password, this.password);
          }
          return schema;
        }
      },
    ]),
  ],
})
export class AuthModule {}
