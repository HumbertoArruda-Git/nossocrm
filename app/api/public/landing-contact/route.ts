import { NextResponse } from 'next/server';
import { handleLandingSubmission } from '@/lib/public-landing/service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const result = await handleLandingSubmission(request);
  return NextResponse.json(result.body, { status: result.status });
}

export async function GET() {
  return NextResponse.json({ error: 'Método não permitido', code: 'METHOD_NOT_ALLOWED' }, { status: 405, headers: { Allow: 'POST' } });
}

export async function PUT() { return GET(); }
export async function PATCH() { return GET(); }
export async function DELETE() { return GET(); }
