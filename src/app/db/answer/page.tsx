// app/db/answer/page.tsx

import Link from 'next/link';
import { QuestionAnswerCRUD } from '../../../components/UI/QuestionAnswerCRUD';

export default function QuestionAnswerRoutePage() {
  return (
    <div className="p-4">
      <Link href="/db" className="text-blue-600 hover:underline mb-4 block">← メニューに戻る</Link>
      <QuestionAnswerCRUD />
    </div>
  );
}