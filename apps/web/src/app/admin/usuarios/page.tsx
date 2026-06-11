import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import type { AdminUserDto } from '@marketplace/shared';
import { authFetch } from '@/lib/api';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import {
  adminUserRoleAction,
  adminUserStatusAction,
} from '@/lib/trust-actions';

export const metadata: Metadata = { title: 'Usuarios' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const token = await getAccessToken();
  if (!token) redirect('/login');
  const me = await getCurrentUser();

  const { q } = await searchParams;
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  const users = await authFetch<AdminUserDto[]>(
    token,
    `/admin/users${query}`,
  ).catch(() => []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <form action="/admin/usuarios" className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por email o nombre…"
            className="field-input w-64 !py-2"
          />
          <button type="submit" className="btn-secondary !py-2">
            Buscar
          </button>
        </form>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs font-semibold uppercase tracking-wider text-zinc-400">
              <th className="px-5 py-3.5">Usuario</th>
              <th className="px-5 py-3.5">Negocio</th>
              <th className="px-5 py-3.5">Rol</th>
              <th className="px-5 py-3.5">Estado</th>
              <th className="px-5 py-3.5">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === me?.id;
              return (
                <tr
                  key={user.id}
                  className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50/60"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-zinc-800">{user.name}</p>
                    <p className="text-xs text-zinc-400">
                      {user.email}
                      {user.emailVerified ? ' ✓' : ' (sin verificar)'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-zinc-600">
                    {user.businessName ?? '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.role === 'ADMIN'
                          ? 'bg-red-50 text-red-600'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {user.role === 'ADMIN' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        user.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {user.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {isSelf ? (
                      <span className="text-xs text-zinc-300">Sos vos</span>
                    ) : (
                      <div className="flex items-center gap-3">
                        <form action={adminUserStatusAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="status"
                            value={user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}
                          />
                          <button
                            type="submit"
                            className={`text-xs hover:underline ${
                              user.status === 'ACTIVE'
                                ? 'text-red-600'
                                : 'text-green-700'
                            }`}
                          >
                            {user.status === 'ACTIVE' ? 'Suspender' : 'Reactivar'}
                          </button>
                        </form>
                        <form action={adminUserRoleAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="role"
                            value={user.role === 'ADMIN' ? 'USER' : 'ADMIN'}
                          />
                          <button
                            type="submit"
                            className="text-xs text-zinc-500 hover:text-zinc-900 hover:underline"
                          >
                            {user.role === 'ADMIN' ? 'Quitar admin' : 'Hacer admin'}
                          </button>
                        </form>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && (
          <p className="p-10 text-center text-sm text-zinc-500">
            No se encontraron usuarios.
          </p>
        )}
      </div>
    </div>
  );
}
