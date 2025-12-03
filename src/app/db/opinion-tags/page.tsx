// app/db/opinion-tags/page.tsx

import Link from 'next/link';
import { OpinionTagsCRUD } from '@/components/UI/OpinionTagsCRUD';

export default function OpinionTagsRoutePage() {
  return (
    <div className="p-4">
      <Link href="/db" className="text-blue-600 hover:underline mb-4 block">← メニューに戻る</Link>
      <OpinionTagsCRUD />
    </div>
  );
}