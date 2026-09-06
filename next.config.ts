import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const configDir = path.dirname(fileURLToPath(import.meta.url));
// When running from a git worktree inside .claude/worktrees/, node_modules live
// 3 levels up at the repo root. Turbopack needs an explicit root to resolve them.
const repoRoot = configDir.includes('/.claude/worktrees/')
  ? path.resolve(configDir, '../../../')
  : configDir;

// Cabeçalhos de segurança aplicados a todas as respostas.
//
// O script-src continua com 'unsafe-inline' e 'unsafe-eval' porque o Next
// injeta scripts inline de hidratação em toda página; trocar isso por nonce
// exige gerar o nonce no proxy.ts e propagá-lo, o que é uma mudança à parte.
// O resto da política é fechado, e é dele que vem a maior parte do ganho:
// 'frame-ancestors' impede que o site seja embutido em outro (clickjacking),
// 'connect-src' limita para onde o navegador pode mandar dados, e 'form-action'
// impede que um formulário injetado poste em outro domínio.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // O microfone fica liberado para a própria origem: a gravação de áudio do CRM
  // depende dele. Câmera, geolocalização e pagamento não são usados em lugar nenhum.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), payment=(), microphone=(self)" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Otimiza imports de bibliotecas com barrel files (index.js que re-exporta tudo)
  // Isso evita carregar módulos não utilizados, reduzindo o bundle em 15-25KB
  // Ref: https://vercel.com/blog/how-we-optimized-package-imports-in-next-js
  experimental: {
    optimizePackageImports: [
      'lucide-react',      // 1500+ ícones, carrega só os usados
      'recharts',          // Biblioteca de gráficos pesada
      'date-fns',          // Utilitários de data
      '@radix-ui/react-icons',
    ],
  },
  turbopack: {
    root: repoRoot,
  },
  async rewrites() {
    return [{ source: '/api/chat', destination: '/api/ai/chat' }];
  },
  async redirects() {
    return [
      { source: '/solucoes/inteligencia-artificial-aplicada', destination: '/solucoes/inteligencia-artificial', permanent: true },
      { source: '/solucoes/integracao-entre-ferramentas', destination: '/solucoes/integracao-de-sistemas', permanent: true },
      { source: '/solucoes/sites-e-landing-pages', destination: '/solucoes/sistemas-sob-medida', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        ],
      },
      {
        source: "/api/mcp",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Authorization, Content-Type, X-Api-Key" },
        ],
      },
    ];
  },
};

export default nextConfig;
