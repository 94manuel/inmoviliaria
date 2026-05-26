import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Crear cuenta' };
export default function RegisterPage() { return <section className="authSection"><AuthForm mode="register" /></section>; }
