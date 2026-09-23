/**
 * Runs public/sw.js in a fake ServiceWorker scope: which requests it answers from
 * Cache Storage, and which it leaves to the network.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

const ORIGIN = 'https://crm.example.com';
const SW_SOURCE = fs.readFileSync(path.join(__dirname, '../public/sw.js'), 'utf8');

type Listener = (event: Record<string, unknown>) => void;

function loadServiceWorker(existingCaches: string[]) {
  const listeners: Record<string, Listener> = {};
  const stored = new Map<string, Set<string>>(existingCaches.map((name) => [name, new Set()]));
  const openCache = (name: string) => {
    if (!stored.has(name)) stored.set(name, new Set());
    const entries = stored.get(name)!;
    return {
      addAll: async (urls: string[]) => urls.forEach((url) => entries.add(url)),
      put: async (req: { url: string }) => { entries.add(req.url); },
    };
  };
  const caches = {
    open: vi.fn(async (name: string) => openCache(name)),
    keys: vi.fn(async () => [...stored.keys()]),
    delete: vi.fn(async (name: string) => stored.delete(name)),
    match: vi.fn(async () => undefined),
  };
  const network = vi.fn(async () => ({ clone: () => ({}) }));
  const self = {
    location: { origin: ORIGIN },
    addEventListener: (type: string, listener: Listener) => { listeners[type] = listener; },
    skipWaiting: vi.fn(),
    clients: { claim: vi.fn() },
  };
  vm.runInNewContext(SW_SOURCE, { self, caches, fetch: network, URL, Promise });
  return { listeners, stored, caches, network };
}

function fetchEvent(url: string, init: { method?: string; mode?: string } = {}) {
  const respondWith = vi.fn();
  return {
    event: { request: { url, method: init.method ?? 'GET', mode: init.mode ?? 'cors' }, respondWith },
    respondWith,
  };
}

describe('service worker', () => {
  let sw: ReturnType<typeof loadServiceWorker>;

  beforeEach(() => {
    sw = loadServiceWorker(['nossocrm-shell-v2', 'outro-app']);
  });

  it.each([
    ['REST do Supabase', 'https://abc.supabase.co/rest/v1/activities?deal_id=eq.1'],
    ['Auth do Supabase', 'https://abc.supabase.co/auth/v1/user'],
    ['API do próprio app', `${ORIGIN}/api/deals/1/whatsapp-assisted`],
    ['payload RSC', `${ORIGIN}/boards?_rsc=abc`],
    ['arquivo público fora de /_next/static', `${ORIGIN}/lame.min.js`],
    ['asset estático de outro domínio', 'https://cdn.example.net/_next/static/x.js'],
  ])('não intercepta %s', (_label, url) => {
    const { event, respondWith } = fetchEvent(url);
    sw.listeners.fetch(event);
    expect(respondWith).not.toHaveBeenCalled();
  });

  it('nunca intercepta escrita (POST)', () => {
    const { event, respondWith } = fetchEvent(`${ORIGIN}/_next/static/chunk.js`, { method: 'POST' });
    sw.listeners.fetch(event);
    expect(respondWith).not.toHaveBeenCalled();
  });

  it.each([
    `${ORIGIN}/_next/static/chunks/app.js`,
    `${ORIGIN}/_next/static/media/font.woff2`,
    `${ORIGIN}/icons/icon.svg`,
  ])('continua servindo asset estático do cache: %s', (url) => {
    const { event, respondWith } = fetchEvent(url);
    sw.listeners.fetch(event);
    expect(respondWith).toHaveBeenCalledOnce();
  });

  it('navegação continua network-first (fallback offline)', () => {
    const { event, respondWith } = fetchEvent(`${ORIGIN}/boards`, { mode: 'navigate' });
    sw.listeners.fetch(event);
    expect(respondWith).toHaveBeenCalledOnce();
  });

  it('ao ativar, apaga o cache v2 (que guardava dados da API) e qualquer outro cache antigo', async () => {
    let done: Promise<unknown> = Promise.resolve();
    await sw.listeners.install({ waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    sw.listeners.activate({ waitUntil: (p: Promise<unknown>) => { done = p; } });
    await done;
    expect([...sw.stored.keys()]).toEqual(['nossocrm-shell-v3']);
    expect(sw.caches.delete).toHaveBeenCalledWith('nossocrm-shell-v2');
  });
});
