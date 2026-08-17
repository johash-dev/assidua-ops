import { HttpException } from "@nestjs/common";

export class IdentityHttpError extends HttpException {
  constructor(status: number, code: string, message: string) {
    super({ code, message }, status);
  }
}

export function identityFail(status: number, code: string, message: string): never {
  throw new IdentityHttpError(status, code, message);
}
