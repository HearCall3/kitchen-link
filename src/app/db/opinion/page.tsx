// app/db/opinion/page.tsx

import Link from 'next/link';
import { PostAnOpinionCRUD } from '../../../components/UI/PostAnOpinionCRUD';

export default function OpinionRoutePage() {
  return (
    <div className="p-4">
      <Link href="/db" className="text-blue-600 hover:underline mb-4 block">
        ← メニューに戻る
      </Link>
      <PostAnOpinionCRUD />
    </div>
  );
}