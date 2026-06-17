'use client';

import { useState, useTransition } from 'react';
import type { MessageDto } from '@marketplace/shared';
import {
  getOrderThreadAction,
  sendOrderMessageAction,
} from '@/lib/message-actions';

export function OrderChat({
  subOrderId,
  counterparty,
}: {
  subOrderId: string;
  counterparty: string;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MessageDto[] | null>(null);
  const [text, setText] = useState('');
  const [pending, start] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && messages === null) {
      start(async () => {
        const thread = await getOrderThreadAction(subOrderId);
        setMessages(thread?.messages ?? []);
      });
    }
  }

  function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    start(async () => {
      const thread = await sendOrderMessageAction(subOrderId, body);
      if (thread) {
        setMessages(thread.messages);
        setText('');
      }
    });
  }

  return (
    <div className="border-t border-zinc-100">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
      >
        <span className="flex items-center gap-2">
          <span aria-hidden="true">💬</span>
          Mensajes con {counterparty}
        </span>
        <svg
          className={`h-4 w-4 text-zinc-400 transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="space-y-3 px-5 pb-4">
          <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg bg-zinc-50 p-3">
            {messages === null ? (
              <p className="py-4 text-center text-xs text-zinc-400">
                Cargando…
              </p>
            ) : messages.length === 0 ? (
              <p className="py-4 text-center text-xs text-zinc-400">
                Todavía no hay mensajes. Escribí para coordinar la entrega o
                resolver una duda.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      m.mine
                        ? 'bg-brand-600 text-white'
                        : 'border border-zinc-200 bg-white text-zinc-700'
                    }`}
                  >
                    <p className="whitespace-pre-line break-words">{m.body}</p>
                    <p
                      className={`mt-0.5 text-[10px] ${m.mine ? 'text-white/70' : 'text-zinc-400'}`}
                    >
                      {new Date(m.createdAt).toLocaleString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={send} className="flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={1}
              maxLength={2000}
              placeholder="Escribí un mensaje…"
              className="field-input flex-1 resize-none !py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) send(e);
              }}
            />
            <button
              type="submit"
              disabled={pending || text.trim().length === 0}
              className="btn-primary !px-4 !py-2"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
