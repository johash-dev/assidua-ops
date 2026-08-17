-- AO-F-001 department + category tree
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "defaultSlaDays" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CategoryNode" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "parentId" TEXT,
    "isLeaf" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryNode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CategoryNode_departmentId_idx" ON "CategoryNode"("departmentId");
CREATE INDEX "CategoryNode_parentId_idx" ON "CategoryNode"("parentId");

ALTER TABLE "CategoryNode" ADD CONSTRAINT "CategoryNode_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CategoryNode" ADD CONSTRAINT "CategoryNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CategoryNode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
