import { redirect } from 'next/navigation';
import { getCurrentUser } from './api';
import type { User } from './types';

export async function requireUser(role?: 'ADMIN' | 'USER'): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (role && user.role !== role) redirect(user.role === 'ADMIN' ? '/admin' : '/mi-cuenta');
  return user;
}
