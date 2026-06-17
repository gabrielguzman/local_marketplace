import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso de Mercato.',
};

export default function TerminosPage() {
  return (
    <article className="mx-auto max-w-3xl py-10">
      <h1 className="text-3xl font-bold tracking-tight">
        Términos y Condiciones
      </h1>
      <p className="mt-2 text-sm text-zinc-400">
        Última actualización: 15 de junio de 2026
      </p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-zinc-600">
        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            1. Qué es Mercato
          </h2>
          <p>
            Mercato es un mercado en línea que conecta a compradores con
            negocios y vendedores independientes. Mercato facilita la
            publicación, la búsqueda y la compra de productos, pero no es el
            fabricante ni, salvo aclaración expresa, el vendedor de los
            productos publicados. La relación de compraventa se celebra entre el
            comprador y el vendedor.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            2. Cuenta de usuario
          </h2>
          <p>
            Para comprar o vender necesitás una cuenta con datos veraces y
            actualizados. Sos responsable de la confidencialidad de tu
            contraseña y de toda la actividad realizada desde tu cuenta. Podemos
            suspender cuentas que incumplan estos términos o que detectemos como
            fraudulentas.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            3. Publicaciones y obligaciones del vendedor
          </h2>
          <p>
            El vendedor es el único responsable de la veracidad de sus
            publicaciones, del stock informado, de la calidad de los productos y
            de cumplir con la entrega en las condiciones ofrecidas. Está
            prohibido publicar productos ilegales, falsificados, peligrosos o
            que infrinjan derechos de terceros.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            4. Compras, precios y pagos
          </h2>
          <p>
            Los precios se muestran en pesos argentinos e incluyen los impuestos
            que correspondan, salvo aclaración. El costo de envío se informa
            antes de confirmar la compra. Al concretar una compra, el comprador
            acepta el precio y las condiciones vigentes en ese momento.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            5. Comisión de la plataforma
          </h2>
          <p>
            Mercato cobra al vendedor una comisión sobre el monto de cada venta
            concretada. La comisión vigente se informa en el panel del vendedor.
            La liquidación del neto (precio más envío, menos comisión) se realiza
            una vez que la venta figura como entregada.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            6. Cancelaciones y devoluciones
          </h2>
          <p>
            El comprador puede cancelar una orden mientras no esté pagada.
            Conforme a la normativa de defensa del consumidor aplicable, podés
            tener derecho a retractar la compra dentro de los plazos legales.
            Las políticas particulares de cambios y devoluciones de cada tienda
            se muestran en su perfil.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            7. Conducta y contenido
          </h2>
          <p>
            Las reseñas, preguntas y mensajes deben ser respetuosos y veraces.
            Nos reservamos el derecho de moderar o eliminar contenido que sea
            ofensivo, engañoso o que incumpla la ley o estos términos.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            8. Limitación de responsabilidad
          </h2>
          <p>
            Mercato no garantiza la disponibilidad ininterrumpida del servicio y
            actúa como intermediario entre las partes. En la medida permitida
            por la ley, no somos responsables por los daños derivados de la
            relación entre comprador y vendedor.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-bold text-zinc-900">
            9. Cambios en los términos
          </h2>
          <p>
            Podemos actualizar estos términos. Publicaremos la versión vigente en
            esta página con su fecha de actualización. El uso continuado del
            servicio implica la aceptación de los cambios.
          </p>
        </section>

        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-xs text-zinc-500">
          Este documento es una versión preliminar de carácter general y no
          constituye asesoramiento legal. Antes de operar comercialmente debe
          ser revisado por un profesional del derecho.
        </p>
      </div>
    </article>
  );
}
