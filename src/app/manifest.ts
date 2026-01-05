import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
return {
    name: 'Next.js PWA',
    short_name: 'NextPWA',
    description: 'キッチンカーの出店者と来店者の意見交換ができるアプリです',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
    {
        src: '/icon/logo.png',
        sizes: '192x192',
        type: 'image/png',
    },
    {
        src: '/icon/logo.png',
        sizes: '512x512',
        type: 'image/png',
    },
    ],
}
}