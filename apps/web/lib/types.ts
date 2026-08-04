export type Role = 'ADMIN' | 'USER';
export type PropertyStatus = 'AVAILABLE' | 'RENTED' | 'ARCHIVED';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'VOID';
export type ChargeCatalogType = 'SERVICE' | 'PRODUCT';
export type StoredFilePurpose = 'PROPERTY_IMAGE' | 'GENERIC';

export interface ChargeCatalogItem {
  id: string;
  type: ChargeCatalogType;
  code: string;
  name: string;
  unitPrice: number;
  active: boolean;
}

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
  tour360Url?: string | null;
  videoUrl?: string | null;
  published: boolean;
  status: PropertyStatus;
  images: PropertyImage[];
  _count?: { leases: number };
}

export interface NewsPost {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  sourceLabel?: string | null;
  externalUrl?: string | null;
  published: boolean;
  createdAt: string;
  createdBy?: { id: string; name: string };
}

export interface Invoice {
  id: string;
  code: string;
  period: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  paidAt?: string | null;
  user?: { name: string; email: string } | null;
  tenant?: { name: string; email?: string | null } | null;
  lease: { id?: string; property: { title: string; address?: string }; user?: { name: string } };
  lineItems?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    total: number;
    catalogItem: { code: string; name: string; type: ChargeCatalogType };
  }>;
  payments?: Array<{ reference: string; status: string; provider: string }>;
}

export interface Lease {
  id: string;
  user?: { id: string; name: string; email: string } | null;
  tenant?: { id: string; name: string; email?: string | null } | null;
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

export interface StoredFile {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  purpose: StoredFilePurpose;
  publicPath: string;
  downloadPath?: string;
  createdAt: string;
  createdBy?: { id: string; name: string; email: string } | null;
}


export interface BankPaymentNotification {
  id: string;
  outlookMessageId: string;
  sender: string;
  subject: string;
  payerName?: string | null;
  amount?: number | null;
  accountLast4?: string | null;
  bankReference?: string | null;
  receivedAt: string;
  status: 'RECEIVED' | 'MATCHED' | 'REVIEW_REQUIRED' | 'REJECTED' | 'DUPLICATE' | 'ERROR';
  reviewReason?: string | null;
  payment?: { id: string; reference: string; status: string } | null;
  matchedInvoice?: { id: string; code: string; amount: number } | null;
  matchedLease?: { tenant?: { name: string; email?: string | null } | null; property: { address: string } } | null;
}

export interface ReceivingBankAccount {
  id: string;
  bank: string;
  label: string;
  accountLast4: string;
  active: boolean;
  _count: { leaseLinks: number; notifications: number };
}

export interface ImportBatch {
  id: string;
  sourceFile: string;
  status: 'PROCESSING' | 'COMPLETED' | 'COMPLETED_WITH_REVIEW' | 'FAILED';
  totalRows: number;
  importedRows: number;
  reviewRows: number;
  startedAt: string;
  finishedAt?: string | null;
  _count: { records: number };
}
