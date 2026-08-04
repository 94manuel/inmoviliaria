import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

@Injectable()
export class N8nApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.N8N_PAYMENTS_API_KEY;
    if (!expected) {
      throw new ServiceUnavailableException('La integración n8n no está configurada en el servidor.');
    }

    const request = context.switchToHttp().getRequest<Request>();
    const receivedHeader = request.header('x-api-key') ?? '';
    const received = Buffer.from(receivedHeader);
    const configured = Buffer.from(expected);

    if (received.length !== configured.length || !timingSafeEqual(received, configured)) {
      throw new UnauthorizedException('API key de n8n inválida.');
    }
    return true;
  }
}
