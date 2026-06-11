import { TabNav } from '@/components/tab-nav';

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <TabNav
        tabs={[
          { href: '/vender', label: 'Resumen' },
          { href: '/vender/productos', label: 'Productos' },
          { href: '/vender/ventas', label: 'Ventas' },
          { href: '/vender/negocio', label: 'Mi negocio' },
        ]}
      />
      {children}
    </div>
  );
}
