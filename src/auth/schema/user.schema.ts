import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({required: true, select: false})
  password: string;

  @Prop({unique: true})
  email: string

  @Prop()
  name: string;

  async verifyPassword(password: string): Promise<boolean>{ return true }
}

export const UserSchema = SchemaFactory.createForClass(User);
