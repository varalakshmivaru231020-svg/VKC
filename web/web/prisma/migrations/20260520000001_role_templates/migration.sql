-- CreateTable: role_templates
CREATE TABLE "role_templates" (
    "id"          TEXT NOT NULL,
    "name"        VARCHAR(100) NOT NULL,
    "description" VARCHAR(300),
    "permissions" JSONB NOT NULL DEFAULT '{}',
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "role_templates_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "role_templates_name_key" ON "role_templates"("name");

-- AlterTable: users — add roleTemplateId FK
ALTER TABLE "users" ADD COLUMN "roleTemplateId" TEXT;

ALTER TABLE "users"
    ADD CONSTRAINT "users_roleTemplateId_fkey"
    FOREIGN KEY ("roleTemplateId")
    REFERENCES "role_templates"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed a default Admin Full-Access role template
INSERT INTO "role_templates" ("id","name","description","permissions","isActive","updatedAt")
VALUES (
  'default-admin-role',
  'Full Access',
  'Complete access to all modules — suitable for store managers',
  '{"dashboard":{"view":true},"orders":{"view":true,"edit":true,"delete":true},"products":{"view":true,"edit":true,"delete":true},"categories":{"view":true,"edit":true,"delete":true},"customers":{"view":true,"edit":true,"delete":true},"reviews":{"view":true,"edit":true,"delete":true},"coupons":{"view":true,"edit":true,"delete":true},"banners":{"view":true,"edit":true,"delete":true},"reports":{"view":true},"settings":{"view":true,"edit":true},"stock":{"view":true,"edit":true},"shipments":{"view":true,"edit":true}}',
  true,
  NOW()
);
