// app/db/account-create/page.tsx

import Link from 'next/link';
import { AccountCreationForm } from '@/components/UI/AccountCreationForm';

export default function AccountCreateRoutePage() {
  return (
    <div className="p-4">
      <Link href="/db" className="text-blue-600 hover:underline mb-4 block">
        ← メニューに戻る
      </Link>
      <AccountCreationForm />
    </div>
  );
}