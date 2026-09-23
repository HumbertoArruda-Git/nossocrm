import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAllowedOrigin } from '@/lib/security/sameOrigin';

const uuid = z.string().uuid();
const bodySchema = z.object({
  event: z.enum(['initial_sent', 'follow_up_sent', 'replied']),
  message: z.string().max(10000),
  requestId: uuid,
  followUpTaskId: uuid.optional(),
}).superRefine((body, ctx) => {
  if (body.event !== 'replied' && !body.message.trim()) {
    ctx.addIssue({ code: 'custom', path: ['message'], message: 'Mensagem obrigatória' });
  }
  if (body.event === 'follow_up_sent' && !body.followUpTaskId) {
    ctx.addIssue({ code: 'custom', path: ['followUpTaskId'], message: 'Tarefa obrigatória' });
  }
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ dealId: string }> }
) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Origem inválida' }, { status: 403 });
  }
  const { dealId } = await params;
  const parsedId = uuid.safeParse(dealId);
  const parsedBody = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsedId.success || !parsedBody.success) {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }
  const { data: profile } = await supabase.from('profiles')
    .select('organization_id').eq('id', user.id).maybeSingle();
  const orgId = profile?.organization_id;
  if (!orgId) {
    return NextResponse.json({ error: 'Organização indisponível' }, { status: 403 });
  }
  const { data: deal } = await supabase.from('deals')
    .select('id, organization_id, contact_id, board_id, deleted_at')
    .eq('id', dealId).eq('organization_id', orgId).is('deleted_at', null).maybeSingle();
  if (!deal?.contact_id) {
    return NextResponse.json({ error: 'Negócio indisponível' }, { status: 404 });
  }
  const [contactResult, boardResult] = await Promise.all([
    supabase.from('contacts').select('id').eq('id', deal.contact_id)
      .eq('organization_id', orgId).is('deleted_at', null).maybeSingle(),
    supabase.from('boards').select('key').eq('id', deal.board_id)
      .eq('organization_id', orgId).is('deleted_at', null).maybeSingle(),
  ]);
  if (!contactResult.data || boardResult.data?.key !== 'prospeccao-comercial') {
    return NextResponse.json({ error: 'Contato ou quadro indisponível' }, { status: 404 });
  }

  const body = parsedBody.data;
  const { data, error } = await supabase.rpc('record_assisted_whatsapp', {
    p_deal_id: dealId,
    p_event: body.event,
    p_message: body.message,
    p_request_id: body.requestId,
    p_follow_up_task_id: body.followUpTaskId ?? null,
  });
  if (error) {
    console.error('[whatsapp-assisted] Falha na confirmação:', error.code);
    return NextResponse.json({ error: 'Não foi possível confirmar a ação' }, { status: 409 });
  }
  return NextResponse.json(data);
}
