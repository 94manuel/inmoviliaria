import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ImportBatchStatus,
  ImportRecordStatus,
  InvoiceStatus,
  LeaseStatus,
  PropertyStatus,
  Prisma,
  PrismaClient,
} from "../src/generated/prisma/client.js";
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL no está configurada.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

type LeaseRow = {
  legacyCode: string;
  sourceSheet: string;
  sourceRow: number;
  address: string | null;
  city: string;
  neighborhood: string;
  locality: string;
  ownerName: string | null;
  ownerNormalized: string;
  tenantName: string | null;
  tenantNormalized: string;
  tenantDocument: string | null;
  tenantPhone: string | null;
  tenantEmail: string | null;
  tenantRaw: string | null;
  coTenantsRaw: string | null;
  leaseStartDate: string | null;
  leaseEndDate: string | null;
  leaseStatus: keyof typeof LeaseStatus;
  expectedPayment: number | null;
  ownerExpectedPayout: number | null;
  contractRaw: string | number | null;
  novelty: string | null;
  observations: string | null;
  needsReview: boolean;
  reviewFlags: string;
};

type ImportFile = {
  metadata: Record<string, unknown>;
  leases: LeaseRow[];
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value: string) =>
  normalize(value).replace(/\s+/g, "-").slice(0, 120);

const parseDate = (value: string | null) =>
  value ? new Date(`${value}T12:00:00-05:00`) : null;

const currentPeriod = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12));
};

const dueDateForPeriod = (period: Date) => {
  const day = Number(process.env.DEFAULT_DUE_DAY ?? "5");
  return new Date(Date.UTC(period.getUTCFullYear(), period.getUTCMonth(), day, 12));
};

async function main() {
  const inputPath = resolve(
    process.argv[2] ?? "../../integrations/datos/arrendamientos_normalizados.json",
  );
  const raw = await readFile(inputPath);
  const checksum = createHash("sha256").update(raw).digest("hex");
  const payload = JSON.parse(raw.toString("utf8")) as ImportFile;

  const existing = await prisma.importBatch.findUnique({ where: { checksum } });
  if (existing?.status === ImportBatchStatus.COMPLETED) {
    console.log(`El archivo ya fue importado: ${existing.id}`);
    return;
  }

  const adminEmail = process.env.IMPORT_ADMIN_EMAIL;
  if (!adminEmail) {
    throw new Error("Defina IMPORT_ADMIN_EMAIL con el correo de un administrador existente.");
  }

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) {
    throw new Error(`No existe el administrador ${adminEmail}.`);
  }

  const batch = await prisma.importBatch.upsert({
    where: { checksum },
    update: {
      status: ImportBatchStatus.PROCESSING,
      errorMessage: null,
      totalRows: payload.leases.length,
      finishedAt: null,
    },
    create: {
      sourceFile: inputPath.split(/[\\/]/).pop() ?? inputPath,
      checksum,
      totalRows: payload.leases.length,
    },
  });

  const accountLast4List = (process.env.BANCOLOMBIA_ACCOUNT_LAST4 ?? "")
    .split(",")
    .map((value) => value.replace(/\D/g, "").slice(-4))
    .filter((value) => value.length === 4);

  const receivingAccounts = [];
  for (const accountLast4 of accountLast4List) {
    receivingAccounts.push(
      await prisma.receivingBankAccount.upsert({
        where: {
          bank_accountLast4: {
            bank: "Bancolombia",
            accountLast4,
          },
        },
        update: { active: true },
        create: {
          bank: "Bancolombia",
          accountLast4,
          label: `Bancolombia ****${accountLast4}`,
        },
      }),
    );
  }

  let importedRows = 0;
  let reviewRows = 0;

  for (const row of payload.leases) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        if (!row.address || !row.ownerName || !row.tenantName) {
          throw new Error("Faltan dirección, propietario o arrendatario.");
        }

        const owner = await tx.owner.upsert({
          where: { normalizedName: row.ownerNormalized || normalize(row.ownerName) },
          update: { name: row.ownerName },
          create: {
            name: row.ownerName,
            normalizedName: row.ownerNormalized || normalize(row.ownerName),
          },
        });

        const property = await tx.property.upsert({
          where: { legacyCode: row.legacyCode },
          update: {
            title: row.address,
            description: row.observations ?? "",
            monthlyRent: row.expectedPayment ?? 0,
            city: row.city || "Bogotá D.C.",
            neighborhood: row.neighborhood ?? "",
            locality: row.locality ?? "",
            address: row.address,
            rawAddress: row.address,
            status:
              row.leaseStatus === "ENDED"
                ? PropertyStatus.AVAILABLE
                : PropertyStatus.RENTED,
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
          },
          create: {
            legacyCode: row.legacyCode,
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
            title: row.address,
            slug: `${slugify(row.address)}-${row.legacyCode.toLowerCase()}`,
            description: row.observations ?? "",
            monthlyRent: row.expectedPayment ?? 0,
            city: row.city || "Bogotá D.C.",
            neighborhood: row.neighborhood ?? "",
            locality: row.locality ?? "",
            address: row.address,
            rawAddress: row.address,
            status:
              row.leaseStatus === "ENDED"
                ? PropertyStatus.AVAILABLE
                : PropertyStatus.RENTED,
            published: false,
            features: [],
            createdById: admin.id,
          },
        });

        await tx.propertyOwner.upsert({
          where: {
            propertyId_ownerId: {
              propertyId: property.id,
              ownerId: owner.id,
            },
          },
          update: {
            monthlyExpectedPayout: row.ownerExpectedPayout,
            source: `${row.sourceSheet}:${row.sourceRow}`,
          },
          create: {
            propertyId: property.id,
            ownerId: owner.id,
            monthlyExpectedPayout: row.ownerExpectedPayout,
            source: `${row.sourceSheet}:${row.sourceRow}`,
          },
        });

        const sourceKey = `LEGACY:${row.legacyCode}`;
        const normalizedEmail = row.tenantEmail?.trim().toLowerCase() || null;
        const [tenantBySource, linkedUser] = await Promise.all([
          tx.tenant.findUnique({ where: { sourceKey } }),
          normalizedEmail
            ? tx.user.findUnique({ where: { email: normalizedEmail }, include: { tenantProfile: true } })
            : Promise.resolve(null),
        ]);

        const tenantData = {
          name: row.tenantName,
          normalizedName: row.tenantNormalized || normalize(row.tenantName),
          documentNumber: row.tenantDocument,
          phone: row.tenantPhone,
          email: normalizedEmail,
        };

        const tenant = tenantBySource
          ? await tx.tenant.update({
              where: { id: tenantBySource.id },
              data: {
                ...tenantData,
                userId: tenantBySource.userId ?? (linkedUser?.tenantProfile ? undefined : linkedUser?.id),
              },
            })
          : linkedUser?.tenantProfile
            ? await tx.tenant.update({
                where: { id: linkedUser.tenantProfile.id },
                data: tenantData,
              })
            : await tx.tenant.create({
                data: { ...tenantData, sourceKey, userId: linkedUser?.id },
              });

        const leaseStatus = LeaseStatus[row.leaseStatus] ?? LeaseStatus.LEGAL_REVIEW;
        const lease = await tx.lease.upsert({
          where: { legacyCode: row.legacyCode },
          update: {
            propertyId: property.id,
            tenantId: tenant.id,
            userId: tenant.userId,
            startDate: parseDate(row.leaseStartDate),
            endDate: parseDate(row.leaseEndDate),
            active: leaseStatus !== LeaseStatus.ENDED,
            status: leaseStatus,
            expectedMonthlyPayment: row.expectedPayment,
            ownerExpectedPayout: row.ownerExpectedPayout,
            rawContractData:
              row.contractRaw === null ? null : String(row.contractRaw),
            rawCoTenants: row.coTenantsRaw,
            novelty: row.novelty,
            observations: row.observations,
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
          },
          create: {
            legacyCode: row.legacyCode,
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
            propertyId: property.id,
            tenantId: tenant.id,
            userId: tenant.userId,
            startDate: parseDate(row.leaseStartDate),
            endDate: parseDate(row.leaseEndDate),
            active: leaseStatus !== LeaseStatus.ENDED,
            status: leaseStatus,
            expectedMonthlyPayment: row.expectedPayment,
            ownerExpectedPayout: row.ownerExpectedPayout,
            rawContractData:
              row.contractRaw === null ? null : String(row.contractRaw),
            rawCoTenants: row.coTenantsRaw,
            novelty: row.novelty,
            observations: row.observations,
          },
        });

        const aliases = [
          row.tenantName,
          row.tenantRaw,
        ]
          .filter((value): value is string => Boolean(value))
          .map((value) => ({
            alias: value,
            normalizedAlias: normalize(value),
          }))
          .filter((value) => value.normalizedAlias);

        for (const alias of aliases) {
          await tx.leasePayerAlias.upsert({
            where: {
              leaseId_normalizedAlias: {
                leaseId: lease.id,
                normalizedAlias: alias.normalizedAlias,
              },
            },
            update: { alias: alias.alias },
            create: { leaseId: lease.id, ...alias },
          });
        }

        for (const account of receivingAccounts) {
          await tx.leaseReceivingAccount.upsert({
            where: {
              leaseId_accountId: {
                leaseId: lease.id,
                accountId: account.id,
              },
            },
            update: { active: lease.active },
            create: {
              leaseId: lease.id,
              accountId: account.id,
              active: lease.active,
            },
          });
        }

        if (
          process.env.IMPORT_CREATE_CURRENT_INVOICES === "true" &&
          lease.active &&
          row.expectedPayment &&
          row.expectedPayment > 0
        ) {
          const period = currentPeriod();
          const code = `${row.legacyCode}-${period.toISOString().slice(0, 7)}`;
          await tx.invoice.upsert({
            where: { code },
            update: {
              amount: row.expectedPayment,
              dueDate: dueDateForPeriod(period),
              leaseId: lease.id,
              tenantId: tenant.id,
              userId: tenant.userId,
            },
            create: {
              code,
              period,
              dueDate: dueDateForPeriod(period),
              amount: row.expectedPayment,
              status: InvoiceStatus.PENDING,
              leaseId: lease.id,
              tenantId: tenant.id,
              userId: tenant.userId,
            },
          });
        }

        return { propertyId: property.id, needsReview: row.needsReview };
      });

      importedRows += 1;
      if (row.needsReview) reviewRows += 1;

      await prisma.importRecord.upsert({
        where: {
          batchId_sourceSheet_sourceRow: {
            batchId: batch.id,
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
          },
        },
        update: {
          status: row.needsReview
            ? ImportRecordStatus.REVIEW_REQUIRED
            : ImportRecordStatus.IMPORTED,
          entityId: result.propertyId,
          reviewReason: row.reviewFlags || null,
          payload: row as Prisma.InputJsonValue,
        },
        create: {
          batchId: batch.id,
          sourceSheet: row.sourceSheet,
          sourceRow: row.sourceRow,
          legacyCode: row.legacyCode,
          status: row.needsReview
            ? ImportRecordStatus.REVIEW_REQUIRED
            : ImportRecordStatus.IMPORTED,
          entityId: result.propertyId,
          reviewReason: row.reviewFlags || null,
          payload: row as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      reviewRows += 1;
      await prisma.importRecord.upsert({
        where: {
          batchId_sourceSheet_sourceRow: {
            batchId: batch.id,
            sourceSheet: row.sourceSheet,
            sourceRow: row.sourceRow,
          },
        },
        update: {
          status: ImportRecordStatus.ERROR,
          reviewReason: error instanceof Error ? error.message : String(error),
          payload: row as Prisma.InputJsonValue,
        },
        create: {
          batchId: batch.id,
          sourceSheet: row.sourceSheet,
          sourceRow: row.sourceRow,
          legacyCode: row.legacyCode,
          status: ImportRecordStatus.ERROR,
          reviewReason: error instanceof Error ? error.message : String(error),
          payload: row as Prisma.InputJsonValue,
        },
      });
    }
  }

  await prisma.importBatch.update({
    where: { id: batch.id },
    data: {
      status:
        reviewRows > 0
          ? ImportBatchStatus.COMPLETED_WITH_REVIEW
          : ImportBatchStatus.COMPLETED,
      importedRows,
      reviewRows,
      finishedAt: new Date(),
    },
  });

  console.log({ batchId: batch.id, importedRows, reviewRows });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
