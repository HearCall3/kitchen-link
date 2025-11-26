// サーバーコンポーネントであることを明示
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import CrudButtons from '@/components/CrudButtons'; 
import AccountInsertForm from '@/components/AccountInsertForm';
import UserCrudActions from '@/components/UserCrudActions'; 
import { StoreForm } from '@/components/StoreForm';
import { PostForm } from '@/components/PostForm';
import {LikeButton} from '@/components/LikeButton';

// テスト用のメアド
const TEST_EMAIL = 'user.login.test@example.com';

// ★ 1. 型定義: Prismaクエリのペイロードを抽出

// Accounts (Vendor + Locations) の型
const vendorLocationsQuery = {
  where: { accountType: 'Vendor' },
  include: { locations: true, gender: true, ageGroup: true, occupation: true },
} satisfies Prisma.AccountFindManyArgs;
export type VendorLocationPayload = Prisma.AccountGetPayload<typeof vendorLocationsQuery>;

// Accounts (User) の型
const userAccountsQuery = {
  where: { accountType: 'User' },
  include: { gender: true, ageGroup: true, occupation: true },
} satisfies Prisma.AccountFindManyArgs;
export type UserAccountPayload = Prisma.AccountGetPayload<typeof userAccountsQuery>;


// Comments (Comments + Account) の型
const latestCommentsQuery = {
  orderBy: { postedAt: 'desc' },
  take: 3,
  include: { account: true },
} satisfies Prisma.CommentFindManyArgs;
export type LatestCommentPayload = Prisma.CommentGetPayload<typeof latestCommentsQuery>;


// マスタデータの型定義
type GenderFindMany = Awaited<ReturnType<typeof prisma.gender.findMany>>;
export type GenderPayload = GenderFindMany[number];

type AgeGroupFindMany = Awaited<ReturnType<typeof prisma.ageGroup.findMany>>;
export type AgeGroupPayload = AgeGroupFindMany[number];

type OccupationFindMany = Awaited<ReturnType<typeof prisma.occupation.findMany>>;
export type OccupationPayload = OccupationFindMany[number];


/* ページコンポーネント
サーバー側でデータをフェッチし、CRUD UIを配置します。
*/
export default async function DbPage() {
  // 2. データをフェッチする
  const vendorLocations: VendorLocationPayload[] = await prisma.account.findMany(vendorLocationsQuery);
  const userAccounts: UserAccountPayload[] = await prisma.account.findMany(userAccountsQuery);
  const latestComments: LatestCommentPayload[] = await prisma.comment.findMany(latestCommentsQuery);
  
  // マスタデータ
  const genders: GenderPayload[] = await prisma.gender.findMany();
  const ageGroups: AgeGroupPayload[] = await prisma.ageGroup.findMany();
  const occupations: OccupationPayload[] = await prisma.occupation.findMany();
  const masterData = { genders, ageGroups, occupations };

  // 実際にはここで認証情報からユーザーメールを取得します。
  const userEmail = TEST_EMAIL;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1 style={{ borderBottom: '3px solid #ccc', paddingBottom: '10px' }}>🎉 データベース CRUD ダッシュボード 🎉</h1>
      <p style={{ marginBottom: '30px', color: '#666' }}>すべてのデータ参照と、アカウントの追加/更新/削除が可能です。</p>

      {/* 3. 新規追加フォームの配置 (INSERT) */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ color: '#4CAF50' }}>➕ 新規アカウント追加</h2>
        <AccountInsertForm masterData={masterData} userEmail={TEST_EMAIL} />
      </div>
      
      <hr style={{ margin: '30px 0' }}/>
      
      {/* 4. マスタデータ表示セクション */}
      <div style={{ marginTop: '30px', border: '1px solid #ddd', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
        <h2 style={{ color: '#555' }}>📚 マスタデータ一覧</h2>
        <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap' }}>
          
          {/* 性別マスタ */}
          <div>
            <h3 style={{ fontSize: '1.1em', marginBottom: '5px' }}>性別 (Genders)</h3>
            <ul style={{ listStyleType: 'disc', marginLeft: '20px' }}>
              {genders.map(g => (<li key={g.code}>{g.code}: {g.name}</li>))}
            </ul>
          </div>

          {/* 年齢層マスタ */}
          <div>
            <h3 style={{ fontSize: '1.1em', marginBottom: '5px' }}>年齢層 (Age Groups)</h3>
            <ul style={{ listStyleType: 'disc', marginLeft: '20px' }}>
              {ageGroups.map(a => (<li key={a.code}>{a.code}: {a.name}</li>))}
            </ul>
          </div>

          {/* 職業マスタ */}
          <div>
            <h3 style={{ fontSize: '1.1em', marginBottom: '5px' }}>職業 (Occupations)</h3>
            <ul style={{ listStyleType: 'disc', marginLeft: '20px' }}>
              {occupations.map(o => (<li key={o.code}>{o.code}: {o.name}</li>))}
            </ul>
          </div>
        </div>
      </div>

      <hr style={{ margin: '30px 0' }}/>
      
      {/* 5. 一般利用者（User）情報セクション */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ color: '#007BFF' }}>🧑‍🤝‍🧑 一般利用者（User）情報</h2>
        {userAccounts.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {userAccounts.map((user: UserAccountPayload) => (
              <li key={user.email} style={{ marginBottom: '15px', border: '1px solid #007BFF', padding: '15px', borderRadius: '8px', backgroundColor: '#eef7ff' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/* 情報表示 */}
                  <div>
                    <strong style={{ fontSize: '1.1em' }}>ID: {user.email}</strong> / <strong>ニックネーム:</strong> {user.nickname}
                    <br />
                    <small style={{ display: 'block', marginTop: '5px' }}>
                      性別: {user.gender?.name ?? '未設定'} | 
                      年齢層: {user.ageGroup?.name ?? '未設定'} | 
                      職業: {user.occupation?.name ?? '未設定'}
                    </small>
                    <small style={{ display: 'block', marginTop: '5px' }}>
                      紹介文: {user.introduction ?? 'なし'}
                    </small>
                  </div>
                  {/* CRUD Actions */}
                  <UserCrudActions user={user} masterData={masterData} /> 
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>一般利用者アカウントが見つかりませんでした。</p>
        )}
      </div>

      <hr style={{ margin: '30px 0' }}/>


      {/* 6. ベンダー情報セクション */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ color: '#FF9800' }}>📝 ベンダーと出店情報</h2>
        {vendorLocations.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {vendorLocations.map((vendor: VendorLocationPayload) => (
              <li key={vendor.email} style={{ marginBottom: '15px', border: '1px solid #FF9800', padding: '15px', borderRadius: '8px', backgroundColor: '#fff8ee' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  {/* 情報表示 */}
                  <div>
                    <strong style={{ fontSize: '1.1em' }}>ID: {vendor.email}</strong> / <strong>店舗名:</strong> {vendor.storeName ?? 'N/A'}
                    <br />
                    <small style={{ display: 'block', marginTop: '5px' }}>
                      ニックネーム: {vendor.nickname} | 
                      紹介文: {vendor.introduction ?? 'なし'}
                    </small>
                    <small style={{ display: 'block', marginTop: '5px' }}>
                      出店履歴: {vendor.locations.length}件
                    </small>
                  </div>
                  {/* CRUD Actions */}
                  <CrudButtons vendor={vendor} masterData={masterData} /> 
                </div>

                {/* Locations表示 */}
                {vendor.locations.length > 0 && (
                  <div style={{ marginTop: '10px', paddingLeft: '20px', borderLeft: '2px dotted #FF9800' }}>
                    <strong>出店履歴:</strong>
                    <ul style={{ listStyleType: 'circle', marginLeft: '20px', marginTop: '5px' }}>
                      {vendor.locations.map((loc) => (
                        <li key={loc.id}>
                          {loc.locationName} (緯度: {loc.latitude.toString()}, 経度: {loc.longitude.toString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>ベンダーアカウントが見つかりませんでした。</p>
        )}
      </div>
      
      <hr style={{ margin: '30px 0' }}/>


        {/* 出店情報 CRUD フォーム */}
      <StoreForm userEmail={userEmail}/>

      {/* 意見投稿 CRUD フォーム */}
      <PostForm userEmail={userEmail}/>
      
      {/* ... いいねボタンのテスト表示 ... */}
      <LikeButton commentId={1} userEmail={TEST_EMAIL} isLiked={false} />
      
      {/* 7. 最新の投稿セクション */}
      <div>
        <h2 style={{ color: '#888' }}>🗣️ 最新の意見投稿</h2>
        {latestComments.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {latestComments.map((comment: LatestCommentPayload) => (
              <li key={comment.id} style={{ marginBottom: '10px', borderBottom: '1px dashed #ccc', paddingBottom: '10px' }}>
                「{comment.commentText}」 - <strong>{comment.account.nickname}</strong>
                <br/>
                <small style={{ color: '#999' }}>投稿日時: {comment.postedAt.toLocaleString()}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>投稿が見つかりませんでした。</p>
        )}
      </div>
    </div>
  );
}