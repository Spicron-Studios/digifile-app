import { redirect } from 'next/navigation';

export default function LoginPage(): never {
  redirect('/login/signin');
}
