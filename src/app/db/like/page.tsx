// app/db/like/page.tsx

import Link from 'next/link';
import { PressLikeCRUD } from '../../../components/UI/PressLikeCRUD';

export default function PressLikeRoutePage() {
  return (
    <div className="p-4">
      <Link href="/db" className="text-blue-600 hover:underline mb-4 block">← メニューに戻る</Link>
      <PressLikeCRUD />
    </div>
  );
}