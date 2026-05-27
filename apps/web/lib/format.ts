export const publicApiUrl = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export const assetUrl = (path?: string) => {
  if (!path) return '/property-placeholder.svg';
  return /^https?:\/\//i.test(path) ? path : `${publicApiUrl()}${path}`;
};

export const pesos = (amount: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
export const fecha = (value: string) => new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value));
export const tamanoArchivo = (size: number) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 ** 2).toFixed(1)} MB`;
};