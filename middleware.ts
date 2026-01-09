import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ミドルウェアで保護するパスの除外リスト
const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/assets',
]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname.startsWith(p)) || pathname.startsWith('/api/') || pathname.includes('.')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (isPublic(pathname)) return NextResponse.next()

  // NextAuth の JWT を取得
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  const hasUserId = !!token?.userId
  const hasStoreId = !!token?.storeId

  // 両方のIDがない（＝初期設定未完了）場合、/user および /store のみ許可し、それ以外は /user に誘導する
  const allowedWhenNotInitialized = ['/user', '/store', '/api/auth', '/login']
  const normalized = pathname.toLowerCase()

  if (!hasUserId && !hasStoreId) {
    const isAllowed = allowedWhenNotInitialized.some(p => normalized.startsWith(p)) || normalized === '/' 
    if (!isAllowed) {
      const url = req.nextUrl.clone()
      url.pathname = '/user'
      return NextResponse.redirect(url)
    }
  }

  // 初期設定済み（いずれかのIDが存在）なのに /user や /store の初期設定ページに戻ろうとしたらトップへ
  if ((hasUserId || hasStoreId) && (normalized === '/user' || normalized === '/store')) {
    const url = req.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/:path*',
}
