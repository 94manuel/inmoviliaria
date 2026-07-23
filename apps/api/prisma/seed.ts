import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL no está configurada para ejecutar el seed.');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const adminEmail = process.env.ADMIN_INITIAL_EMAIL ?? 'admin@asesoriainmobiliariajb.com';
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
const customerEmail = process.env.CUSTOMER_INITIAL_EMAIL ?? 'cliente@asesoriainmobiliariajb.com';
const customerPassword = process.env.CUSTOMER_INITIAL_PASSWORD;

if (!adminPassword || !customerPassword) {
  throw new Error('ADMIN_INITIAL_PASSWORD y CUSTOMER_INITIAL_PASSWORD son obligatorias para ejecutar el seed.');
}

async function seed(): Promise<void> {
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Administrador Asesoría Inmobiliaria JB',
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
      phone: '300 000 0000',
    },
  });
  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    update: {},
    create: {
      name: 'Laura Martínez',
      email: customerEmail,
      passwordHash: await bcrypt.hash(customerPassword, 12),
      role: 'USER',
      phone: '301 555 1188',
    },
  });

  const [rentService, adminFeeService] = await Promise.all([
    prisma.chargeCatalogItem.upsert({
      where: { code: 'SERV-ARRIENDO' },
      update: { name: 'Canon de arrendamiento', unitPrice: 3400000, active: true, type: 'SERVICE' },
      create: { code: 'SERV-ARRIENDO', name: 'Canon de arrendamiento', unitPrice: 3400000, type: 'SERVICE' },
    }),
    prisma.chargeCatalogItem.upsert({
      where: { code: 'SERV-ADMIN' },
      update: { name: 'Cuota de administración', unitPrice: 520000, active: true, type: 'SERVICE' },
      create: { code: 'SERV-ADMIN', name: 'Cuota de administración', unitPrice: 520000, type: 'SERVICE' },
    }),
    prisma.chargeCatalogItem.upsert({
      where: { code: 'SERV-ESTUDIO' },
      update: { name: 'Estudio de arrendamiento', unitPrice: 180000, active: true, type: 'SERVICE' },
      create: { code: 'SERV-ESTUDIO', name: 'Estudio de arrendamiento', unitPrice: 180000, type: 'SERVICE' },
    }),
    prisma.chargeCatalogItem.upsert({
      where: { code: 'PROD-COPIA-LLAVE' },
      update: { name: 'Copia de llave adicional', unitPrice: 25000, active: true, type: 'PRODUCT' },
      create: { code: 'PROD-COPIA-LLAVE', name: 'Copia de llave adicional', unitPrice: 25000, type: 'PRODUCT' },
    }),
  ]);

  const apartment = await prisma.property.upsert({
    where: { slug: 'apartamento-luz-chico' },
    update: {},
    create: {
      title: 'Apartamento Luz · Chicó',
      slug: 'apartamento-luz-chico',
      description: 'Apartamento moderno con iluminación natural, balcón panorámico y espacios pensados para una vida tranquila cerca de restaurantes, parques y vías principales.',
      monthlyRent: 3400000,
      administrationFee: 520000,
      deposit: 3400000,
      city: 'Bogotá',
      neighborhood: 'Chicó',
      address: 'Calle 94 # 13-42',
      bedrooms: 2,
      bathrooms: 2,
      areaM2: 86,
      parking: 1,
      features: ['Balcón', 'Vigilancia 24 horas', 'Zona coworking', 'Parqueadero cubierto'],
      createdById: admin.id,
      images: { create: [
        { url: '/uploads/seed/apartamento-luz.svg', alt: 'Sala del apartamento Luz', sortOrder: 0 },
        { url: '/uploads/seed/apartamento-luz-2.svg', alt: 'Habitación del apartamento Luz', sortOrder: 1 },
      ] },
    },
  });
  await prisma.property.upsert({
    where: { slug: 'casa-bosque-suba' },
    update: {},
    create: {
      title: 'Casa Bosque · Suba',
      slug: 'casa-bosque-suba',
      description: 'Casa familiar de dos niveles con jardín interior, estudio independiente y amplios ambientes para compartir. Ubicada en conjunto residencial tranquilo.',
      monthlyRent: 2850000,
      administrationFee: 310000,
      deposit: 2850000,
      city: 'Bogotá',
      neighborhood: 'Suba',
      address: 'Carrera 92 # 147-10',
      bedrooms: 3,
      bathrooms: 3,
      areaM2: 132,
      parking: 2,
      features: ['Jardín', 'Estudio', 'Conjunto cerrado', 'Depósito'],
      createdById: admin.id,
      images: { create: [{ url: '/uploads/seed/casa-bosque.svg', alt: 'Fachada Casa Bosque', sortOrder: 0 }] },
    },
  });
  await prisma.property.upsert({
    where: { slug: 'loft-norte-usaquen' },
    update: {},
    create: {
      title: 'Loft Norte · Usaquén',
      slug: 'loft-norte-usaquen',
      description: 'Loft contemporáneo para profesionales, con cocina abierta, acabados cálidos y excelente conexión hacia el centro empresarial y gastronómico de Usaquén.',
      monthlyRent: 2100000,
      administrationFee: 290000,
      deposit: 2100000,
      city: 'Bogotá',
      neighborhood: 'Usaquén',
      address: 'Calle 118 # 7-33',
      bedrooms: 1,
      bathrooms: 1,
      areaM2: 52,
      parking: 1,
      features: ['Gimnasio', 'Terraza comunal', 'Pet friendly'],
      createdById: admin.id,
      images: { create: [{ url: '/uploads/seed/loft-norte.svg', alt: 'Interior Loft Norte', sortOrder: 0 }] },
    },
  });

  let lease = await prisma.lease.findFirst({ where: { propertyId: apartment.id, userId: customer.id, active: true } });
  lease ??= await prisma.lease.create({
    data: {
      propertyId: apartment.id,
      userId: customer.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      active: true,
    },
  });
  const pendingInvoice = await prisma.invoice.upsert({
    where: { code: 'FAC-2026-0005' },
    update: {
      amount: 3920000,
      status: 'PENDING',
      period: new Date('2026-05-01'),
      dueDate: new Date('2026-05-10'),
    },
    create: {
      code: 'FAC-2026-0005',
      period: new Date('2026-05-01'),
      dueDate: new Date('2026-05-10'),
      amount: 3920000,
      status: 'PENDING',
      leaseId: lease.id,
      userId: customer.id,
    },
  });
  const paidInvoice = await prisma.invoice.upsert({
    where: { code: 'FAC-2026-0004' },
    update: {
      amount: 3920000,
      status: 'PAID',
      paidAt: new Date('2026-04-08'),
      period: new Date('2026-04-01'),
      dueDate: new Date('2026-04-10'),
    },
    create: {
      code: 'FAC-2026-0004',
      period: new Date('2026-04-01'),
      dueDate: new Date('2026-04-10'),
      amount: 3920000,
      status: 'PAID',
      paidAt: new Date('2026-04-08'),
      leaseId: lease.id,
      userId: customer.id,
    },
  });

  await prisma.invoiceLineItem.upsert({
    where: { invoiceId_catalogItemId: { invoiceId: pendingInvoice.id, catalogItemId: rentService.id } },
    update: { quantity: 1, unitPrice: rentService.unitPrice, total: rentService.unitPrice },
    create: {
      invoiceId: pendingInvoice.id,
      catalogItemId: rentService.id,
      quantity: 1,
      unitPrice: rentService.unitPrice,
      total: rentService.unitPrice,
    },
  });
  await prisma.invoiceLineItem.upsert({
    where: { invoiceId_catalogItemId: { invoiceId: pendingInvoice.id, catalogItemId: adminFeeService.id } },
    update: { quantity: 1, unitPrice: adminFeeService.unitPrice, total: adminFeeService.unitPrice },
    create: {
      invoiceId: pendingInvoice.id,
      catalogItemId: adminFeeService.id,
      quantity: 1,
      unitPrice: adminFeeService.unitPrice,
      total: adminFeeService.unitPrice,
    },
  });
  await prisma.invoiceLineItem.upsert({
    where: { invoiceId_catalogItemId: { invoiceId: paidInvoice.id, catalogItemId: rentService.id } },
    update: { quantity: 1, unitPrice: rentService.unitPrice, total: rentService.unitPrice },
    create: {
      invoiceId: paidInvoice.id,
      catalogItemId: rentService.id,
      quantity: 1,
      unitPrice: rentService.unitPrice,
      total: rentService.unitPrice,
    },
  });
  await prisma.invoiceLineItem.upsert({
    where: { invoiceId_catalogItemId: { invoiceId: paidInvoice.id, catalogItemId: adminFeeService.id } },
    update: { quantity: 1, unitPrice: adminFeeService.unitPrice, total: adminFeeService.unitPrice },
    create: {
      invoiceId: paidInvoice.id,
      catalogItemId: adminFeeService.id,
      quantity: 1,
      unitPrice: adminFeeService.unitPrice,
      total: adminFeeService.unitPrice,
    },
  });

  await prisma.payment.upsert({
    where: { reference: 'SEED-PAGO-FAC-2026-0004' },
    update: {},
    create: {
      reference: 'SEED-PAGO-FAC-2026-0004',
      amount: paidInvoice.amount,
      provider: 'MOCK',
      status: 'APPROVED',
      invoiceId: paidInvoice.id,
      userId: customer.id,
    },
  });
  await prisma.contactMessage.upsert({
    where: { id: 'seed-contacto-inicial' },
    update: {},
    create: {
      id: 'seed-contacto-inicial',
      name: 'Carlos Ramírez',
      email: 'carlos@example.com',
      subject: 'Visita al Loft Norte',
      message: 'Deseo coordinar una visita al inmueble durante esta semana. Quedo atento a disponibilidad.',
    },
  });
  console.log(`Seed completado. Factura pendiente disponible: ${pendingInvoice.code}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
