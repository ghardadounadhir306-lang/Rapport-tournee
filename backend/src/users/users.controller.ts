import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller(['users', 'api/users'])
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.findAll();
  }

  @Post('login')
  login(@Body() body: { email?: string; password?: string }) {
    return this.usersService.login(body.email ?? '', body.password ?? '');
  }

  @Post()
  create(@Body() body: { name?: string; email?: string; role?: string }) {
    return this.usersService.create({
      name: body.name ?? '',
      email: body.email ?? '',
      role: body.role ?? 'user',
    });
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
