import { HttpException } from "@nestjs/common";

export class TaxonomyHttpError extends HttpException {
  constructor(status: number, code: string, message: string) {
    super({ code, message }, status);
  }
}

export function taxonomyFail(status: number, code: string, message: string): never {
  throw new TaxonomyHttpError(status, code, message);
}
