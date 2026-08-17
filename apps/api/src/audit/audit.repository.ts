import { Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

export type AuditWrite = {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  departmentId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

export type Db = Prisma.TransactionClient | PrismaService;

@Injectable()
export class AuditRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  append(entry: AuditWrite, db: Db = this.prisma) {
    return db.auditEntry.create({
      data: {
        actorUserId: entry.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        departmentId: entry.departmentId ?? null,
        metadata: entry.metadata ?? undefined,
      },
    });
  }
}
