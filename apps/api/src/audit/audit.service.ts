import { Inject, Injectable } from "@nestjs/common";
import { AuditRepository, type AuditWrite, type Db } from "./audit.repository";

@Injectable()
export class AuditService {
  constructor(@Inject(AuditRepository) private readonly repo: AuditRepository) {}

  append(entry: AuditWrite, db?: Db) {
    return this.repo.append(entry, db);
  }
}
