import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { UsersService } from './users.service';

function clientIp(req: Request): string | null {
  const x = req.headers['x-forwarded-for'];
  if (typeof x === 'string' && x) return x.split(',')[0].trim();
  if (Array.isArray(x) && x[0]) return String(x[0]).split(',')[0].trim();
  return req.socket?.remoteAddress ?? null;
}

@Controller(['users', 'api/users'])
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list() {
    return this.usersService.findAll();
  }

  @Post('login')
  login(@Body() body: { email?: string; password?: string }, @Req() req: Request) {
    return this.usersService.login(body.email ?? '', body.password ?? '', { ip: clientIp(req) });
  }

  @Post()
  create(
    @Body()
    body: { name?: string; email?: string; role?: string; matricule?: string; allowedPages?: string[] },
    @Req() req: Request,
  ) {
    return this.usersService.create(
      {
        name: body.name ?? '',
        email: body.email ?? '',
        role: body.role ?? 'user',
        matricule: body.matricule ?? '',
        allowedPages: body.allowedPages ?? [],
      },
      { ip: clientIp(req) },
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.usersService.remove(id, { ip: clientIp(req) });
  }
}
