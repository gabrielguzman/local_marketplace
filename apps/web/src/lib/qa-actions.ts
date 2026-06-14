'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ApiRequestError, authFetch } from './api';
import type { ActionState } from './auth-actions';
import { getAccessToken } from './session';

function toActionError(err: unknown): ActionState {
  if (err instanceof ApiRequestError) return { error: err.message };
  return { error: 'Algo salió mal, probá de nuevo' };
}

export async function askQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const productId = String(formData.get('productId') ?? '');
  const slug = String(formData.get('slug') ?? '');
  try {
    await authFetch(token, `/products/${productId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: String(formData.get('body') ?? '') }),
    });
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/p/${slug}`);
  return { error: null, ok: true };
}

export async function answerQuestionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = await getAccessToken();
  if (!token) redirect('/login');

  const productId = String(formData.get('productId') ?? '');
  const questionId = String(formData.get('questionId') ?? '');
  const slug = String(formData.get('slug') ?? '');
  try {
    await authFetch(
      token,
      `/products/${productId}/questions/${questionId}/answer`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: String(formData.get('answer') ?? '') }),
      },
    );
  } catch (err) {
    return toActionError(err);
  }
  revalidatePath(`/p/${slug}`);
  return { error: null, ok: true };
}
