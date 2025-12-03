// app/db/questions-and-answers/page.tsx

import Link from 'next/link';
import { QuestionnaireCRUD } from '@/components/UI/QuestionnaireCRUD';

export default function QuestionnaireRoutePage() {
  return (
    <div className="p-4">
      <Link href="/db" className="text-blue-600 hover:underline mb-4 block">
        ← メニューに戻る
      </Link>
      <QuestionnaireCRUD />
    </div>
  );
}