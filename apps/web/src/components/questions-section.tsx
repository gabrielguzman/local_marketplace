'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { QuestionDto } from '@marketplace/shared';
import type { ActionState } from '@/lib/auth-actions';
import { answerQuestionAction, askQuestionAction } from '@/lib/qa-actions';

const initialState: ActionState = { error: null };

function AnswerForm({
  productId,
  slug,
  questionId,
}: {
  productId: string;
  slug: string;
  questionId: string;
}) {
  const [state, action, pending] = useActionState(
    answerQuestionAction,
    initialState,
  );
  if (state.ok) return null;
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="questionId" value={questionId} />
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="answer"
        rows={2}
        required
        maxLength={500}
        placeholder="Respondé esta pregunta"
        className="field-input !py-2 text-sm"
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-primary !px-3 !py-1.5 text-xs"
      >
        {pending ? 'Enviando…' : 'Responder'}
      </button>
    </form>
  );
}

export function QuestionsSection({
  productId,
  slug,
  questions,
  canAnswer,
  isLoggedIn,
}: {
  productId: string;
  slug: string;
  questions: QuestionDto[];
  canAnswer: boolean;
  isLoggedIn: boolean;
}) {
  const [askState, askAction, asking] = useActionState(
    askQuestionAction,
    initialState,
  );
  const [asked, setAsked] = useState(false);

  return (
    <section className="surface-card p-6">
      <h2 className="mb-4 text-base font-bold tracking-tight">
        Preguntas y respuestas
      </h2>

      {isLoggedIn ? (
        asked && !askState.error ? (
          <p className="mb-4 rounded-lg bg-green-50 px-3.5 py-2.5 text-sm font-medium text-green-700">
            ✓ Enviamos tu pregunta. El vendedor te va a responder.
          </p>
        ) : (
          <form
            action={askAction}
            onSubmit={() => setAsked(true)}
            className="mb-5 space-y-2"
          >
            <input type="hidden" name="productId" value={productId} />
            <input type="hidden" name="slug" value={slug} />
            <textarea
              name="body"
              rows={2}
              required
              minLength={5}
              maxLength={500}
              placeholder="¿Querés saber algo sobre este producto?"
              className="field-input !py-2 text-sm"
            />
            {askState.error && (
              <p className="text-xs text-red-600">{askState.error}</p>
            )}
            <button
              type="submit"
              disabled={asking}
              className="btn-secondary !py-1.5 text-xs"
            >
              {asking ? 'Enviando…' : 'Preguntar'}
            </button>
          </form>
        )
      ) : (
        <p className="mb-5 text-sm text-zinc-500">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Iniciá sesión
          </Link>{' '}
          para hacer una pregunta.
        </p>
      )}

      {questions.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Todavía no hay preguntas. ¡Sé el primero en preguntar!
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {questions.map((q) => (
            <li key={q.id} className="py-3.5 first:pt-0 last:pb-0">
              <p className="text-sm font-medium text-zinc-800">{q.body}</p>
              {q.answer ? (
                <p className="mt-1.5 rounded-lg border-l-2 border-brand-200 bg-brand-50/40 py-1.5 pl-3 text-sm text-zinc-600">
                  <span className="font-semibold text-brand-700">
                    Respuesta:{' '}
                  </span>
                  {q.answer}
                </p>
              ) : canAnswer ? (
                <AnswerForm
                  productId={productId}
                  slug={slug}
                  questionId={q.id}
                />
              ) : (
                <p className="mt-1 text-xs text-zinc-400">
                  Sin responder todavía
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
