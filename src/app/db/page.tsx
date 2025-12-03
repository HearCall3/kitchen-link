// app/db/page.tsx (更新後)

import Link from 'next/link';

// 操作対象のテーブルリスト
const transactionTables = [
  { name: 'アカウント作成 (User/Store)', path: 'account-create' }, // 👈 追加
  { name: '意見投稿', path: 'opinion' },
  { name: '出店情報', path: 'opening-info' },
  { name: 'アンケート作成・回答', path: 'questions-and-answers' }, // アンケート関連を統合するパスとして修正
  { name: 'いいね', path: 'like' },
  { name: '意見タグ管理 (中間テーブル)', path: 'opinion-tags' },
];

export default function DBMenuPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">データベース操作メニュー</h1>
      <p className="mb-8 text-gray-600">操作したいトランザクションテーブルを選択してください。</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {transactionTables.map((table) => (
          <Link 
            key={table.path} 
            href={`/db/${table.path}`}
            className="block p-6 border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition duration-150"
          >
            <h2 className="text-xl font-semibold text-blue-600">{table.name}</h2>
            <p className="text-sm text-gray-500 mt-1">/{table.path} ページへ遷移</p>
          </Link>
        ))}
      </div>
    </div>
  );
}