import type { Metadata } from 'next';
import { AuthForm } from '@/components/AuthForm';

export const metadata: Metadata = { title: 'Ingresar' };
export default function LoginPage() { return <section className="authSection"><AuthForm mode="login" /></section>; }
