import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Cómo Mercato trata tus datos personales.',
};

export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">
        Política de Privacidad
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Última actualización: 15 de junio de 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-600">
        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            1. Datos que recopilamos
          </h2>
          <p>
            Recopilamos los datos que nos brindás al crear tu cuenta (nombre,
            email, teléfono), los de tus direcciones de envío, los de tus
            negocios y publicaciones, y los datos necesarios para procesar tus
            compras y ventas. También registramos datos de uso para operar y
            mejorar el servicio.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            2. Para qué los usamos
          </h2>
          <p>
            Usamos tus datos para crear y administrar tu cuenta, procesar
            órdenes y pagos, coordinar envíos, enviarte notificaciones sobre tus
            compras y ventas, prevenir fraudes y cumplir obligaciones legales.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            3. Con quién los compartimos
          </h2>
          <p>
            Compartimos únicamente los datos necesarios para concretar una
            operación: el vendedor recibe los datos de envío del comprador, y el
            comprador ve los datos de contacto de la tienda. Podemos usar
            proveedores (pagos, envío de emails, infraestructura) que tratan
            datos en nuestro nombre y bajo confidencialidad. No vendemos tus
            datos personales.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            4. Tus derechos
          </h2>
          <p>
            Conforme a la Ley 25.326 de Protección de Datos Personales, podés
            acceder, rectificar, actualizar y solicitar la supresión de tus
            datos. Podés gestionar tu perfil desde tu cuenta o dar de baja la
            cuenta, lo que anonimiza tus datos personales conservando lo mínimo
            que exija la ley (por ejemplo, registros de operaciones).
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            5. Seguridad
          </h2>
          <p>
            Aplicamos medidas técnicas y organizativas razonables para proteger
            tus datos. Las contraseñas se almacenan cifradas (hash) y nunca en
            texto plano. Ningún sistema es 100% infalible, por lo que te pedimos
            cuidar tus credenciales.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            6. Conservación
          </h2>
          <p>
            Conservamos tus datos mientras tu cuenta esté activa y durante el
            tiempo necesario para cumplir con obligaciones legales, contables y
            de defensa ante reclamos.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            7. Contacto
          </h2>
          <p>
            Por consultas sobre el tratamiento de tus datos podés escribirnos
            desde la sección de ayuda de tu cuenta. La autoridad de aplicación
            en Argentina es la Agencia de Acceso a la Información Pública.
          </p>
        </section>

        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
          Esta política es una versión preliminar de carácter general y no
          constituye asesoramiento legal. Antes de operar comercialmente debe
          ser revisada por un profesional del derecho.
        </p>
      </div>
    </article>
  );
}
