import { notFound, redirect } from 'next/navigation';
import { TabNav } from '@/components/tab-nav';
import { getCurrentUser } from '@/lib/session';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (user.role !== 'ADMIN') notFound();

  return (
    <div className="space-y-6">
      <TabNav
        tabs={[
          { href: '/admin', label: 'Denuncias' },
          { href: '/admin/usuarios', label: 'Usuarios' },
          { href: '/admin/negocios', label: 'Negocios' },
          { href: '/admin/productos', label: 'Productos' },
          { href: '/admin/ordenes', label: 'Órdenes' },
          { href: '/admin/auditoria', label: 'Auditoría' },
        ]}
      />
      {children}
    </div>
  );
}
