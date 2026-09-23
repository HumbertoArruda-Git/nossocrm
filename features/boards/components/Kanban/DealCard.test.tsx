import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { DealView } from '@/types';
import { DealCard } from './DealCard';

vi.mock('./ActivityStatusIcon', () => ({ ActivityStatusIcon: () => null }));

const deal = {
  id: 'deal-1',
  title: 'Padaria Central',
  companyName: 'Padaria Central',
  value: 0,
  tags: [],
  priority: 'low',
  isWon: false,
  isLost: false,
  owner: { name: 'Sem Dono', avatar: '' },
  customFields: {},
} as unknown as DealView;

function renderCard(followUpAlert?: 'today' | 'overdue') {
  return render(
    <DealCard deal={deal} isProspeccaoComercial followUpAlert={followUpAlert} isRotting={false}
      activityStatus="yellow" isDragging={false} onDragStart={vi.fn()} onSelect={vi.fn()}
      isMenuOpen={false} setOpenMenuId={vi.fn()} onQuickAddActivity={vi.fn()}
      setLastMouseDownDealId={vi.fn()} />
  );
}

describe('DealCard: indicador de follow-up do WhatsApp assistido', () => {
  it('mostra "Follow-up hoje"', () => {
    renderCard('today');
    expect(screen.getByText('Follow-up hoje')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /follow-up hoje/ })).toBeInTheDocument();
  });

  it('mostra "Follow-up vencido"', () => {
    renderCard('overdue');
    expect(screen.getByText('Follow-up vencido')).toBeInTheDocument();
  });

  it('follow-up futuro ou inexistente não aparece no card', () => {
    renderCard();
    expect(screen.queryByText(/Follow-up/)).toBeNull();
  });
});
