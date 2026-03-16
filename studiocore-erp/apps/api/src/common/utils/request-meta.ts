import { Request } from 'express';

export const getRequestMeta = (request: Request) => ({
  ipAddress: request.ip,
  userAgent: request.get('user-agent') || null,
});
