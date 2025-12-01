// app/db/opening-info/page.tsx

import Link from 'next/link';
import { StoreOpeningInformationCRUD } from '../../../components/UI/StoreOpeningInformationCRUD';

export default function StoreOpeningInfoRoutePage() {
  return (
    <div className="p-4">
      <Link href="/db" className="text-blue-600 hover:underline mb-4 block">← メニューに戻る</Link>
      <StoreOpeningInformationCRUD />
    </div>
  );
}