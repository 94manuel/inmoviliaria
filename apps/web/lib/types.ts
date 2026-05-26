export type Role = 'ADMIN' | 'USER';
export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'ARCHIVED';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'VOID';

export interface User {
  sub: string;
  email: string;
  name: string;
  role: Role;
}

export interface PropertyImage { id: string; url: string; alt: string; sortOrder: number }
export interface Property {
  id: string;
  title: string;
  slug: string;
  description: string;
  monthlyRent: number;
  administrationFee: number;
  deposit: number;
  city: string;
  neighborhood: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  areaM2: number;
  parking: number;
  features: string[];
  published: boolean;
  status: PropertyStatus;
  images: PropertyImage[];
  _count?: { leases: number };
}

export interface Invoice {
  id: string;
  code: string;
  period: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  paidAt?: string | null;
  user?: { name: string; email: string };
  lease: { id?: string; property: { title: string; address?: string }; user?: { name: string } };
  payments?: Array<{ reference: string; status: string; provider: string }>;
}

export interface Lease {
  id: string;
  user: { id: string; name: string; email: string };
  property: { title: string; monthlyRent: number };
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}
