import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { RegisterUserDTO } from './dto/registerUser.dto';
import { AuthService } from './auth.service';
import { LoginUserDTO } from './dto/loginUser.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService){}

  @Post('login')
  onLogin(@Body() body: LoginUserDTO){
    return this._authService.loginUser(body.username, body.password);
  }

  @Post('register')
  onRegister(@Body() body: RegisterUserDTO){
    return this._authService.registerUser(body);
  }

  @Get('/users/:id')
  getOne(@Param('id') id: string){
    return this._authService.getOne(id);
  }
}
