import { PrismaClient, Prisma } from '@prisma/client';
import { platformFeeCents } from '@marketplace/shared';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// Árbol de 2 niveles. Idempotente: upsert por slug.
const CATEGORIES: Record<string, string[]> = {
  Tecnología: ['Celulares', 'Computación', 'Audio y TV'],
  Hogar: ['Muebles', 'Cocina', 'Jardín'],
  Indumentaria: ['Hombre', 'Mujer', 'Niños'],
  Alimentos: ['Almacén', 'Bebidas', 'Frescos'],
  Deportes: ['Fitness', 'Ciclismo', 'Camping'],
};

type Spec = { key: string; value: string };
type Variant = { attributes?: Record<string, string>; stock: number };

interface DemoProduct {
  title: string;
  description: string;
  categorySlug: string;
  priceCents: number;
  stock: number;
  brand?: string;
  condition?: 'NEW' | 'USED';
  status?: 'ACTIVE' | 'DRAFT' | 'PAUSED';
  photo: string; // palabras clave para loremflickr (foto temática)
  specs?: Spec[];
  variants?: Variant[]; // si viene, reemplaza la variante única
}

interface DemoSeller {
  email: string;
  name: string;
  slug: string;
  profile: Prisma.BusinessUpdateInput &
    Partial<Prisma.BusinessCreateWithoutOwnerInput>;
  products: DemoProduct[];
}

// Foto temática estable (loremflickr indexa por palabra clave; lock fija la imagen)
function photos(keywords: string, slug: string): string[] {
  const base = `https://loremflickr.com/640/480/${encodeURIComponent(keywords)}`;
  const lock = hashSeed(slug);
  return [
    `${base}?lock=${lock}`,
    `${base}?lock=${lock + 1}`,
    `${base}?lock=${lock + 2}`,
  ];
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 100000;
  return h + 1;
}

const SELLERS: DemoSeller[] = [
  {
    email: 'demo@marketplace.local',
    name: 'Tienda Demo',
    slug: 'tienda-demo',
    profile: {
      description:
        'Tecnología y hogar con envío a todo el país. La tienda de muestra del marketplace.',
      phone: '011 4555-1234',
      whatsapp: '+54 9 11 5555-1234',
      email: 'hola@tiendademo.com',
      website: 'tiendademo.com',
      instagram: '@tiendademo',
      address: 'Av. Corrientes 1234',
      city: 'CABA',
      province: 'Buenos Aires',
      hours: 'Lun a Vie de 9 a 18 hs · Sáb de 10 a 14 hs',
      policies:
        'Cambios y devoluciones dentro de los 30 días con el comprobante. Envíos a todo el país en 3 a 5 días hábiles.',
      pickupEnabled: true,
      shippingCents: 250000,
    },
    products: [
      {
        title: 'Celular X20 128GB',
        description:
          'Pantalla AMOLED de 6,5", 8GB de RAM y cámara triple de 50MP.',
        categorySlug: 'tecnologia-celulares',
        priceCents: 45000000,
        stock: 15,
        brand: 'Samsung',
        photo: 'smartphone,phone',
        specs: [
          { key: 'Pantalla', value: '6,5" AMOLED' },
          { key: 'Memoria', value: '128 GB' },
          { key: 'RAM', value: '8 GB' },
          { key: 'Cámara', value: 'Triple 50 MP' },
        ],
        variants: [
          { attributes: { color: 'Negro' }, stock: 15 },
          { attributes: { color: 'Azul' }, stock: 8 },
        ],
      },
      {
        title: 'Notebook 14" Ryzen 5 16GB',
        description:
          'Liviana y rápida, ideal para trabajo y estudio. SSD de 512GB.',
        categorySlug: 'tecnologia-computacion',
        priceCents: 89999900,
        stock: 7,
        brand: 'Lenovo',
        photo: 'laptop,notebook',
        specs: [
          { key: 'Procesador', value: 'AMD Ryzen 5' },
          { key: 'RAM', value: '16 GB' },
          { key: 'Almacenamiento', value: 'SSD 512 GB' },
          { key: 'Garantía', value: '12 meses' },
        ],
      },
      {
        title: 'Auriculares Bluetooth con cancelación de ruido',
        description: 'Hasta 30 horas de batería y estuche de carga rápida.',
        categorySlug: 'tecnologia-audio-y-tv',
        priceCents: 7850000,
        stock: 32,
        brand: 'JBL',
        photo: 'headphones',
        specs: [
          { key: 'Batería', value: '30 horas' },
          { key: 'Conectividad', value: 'Bluetooth 5.3' },
        ],
      },
      {
        title: 'Smart TV 50" 4K',
        description: 'Resolución 4K, HDR y sistema operativo con apps incluidas.',
        categorySlug: 'tecnologia-audio-y-tv',
        priceCents: 52000000,
        stock: 9,
        brand: 'LG',
        photo: 'television,tv',
        specs: [
          { key: 'Pantalla', value: '50" 4K UHD' },
          { key: 'HDR', value: 'Sí' },
        ],
      },
      {
        title: 'Mesa ratona de madera maciza',
        description: 'Paraíso lustrado, 90x50cm. Hecha a mano.',
        categorySlug: 'hogar-muebles',
        priceCents: 12500000,
        stock: 4,
        photo: 'wooden,table,furniture',
        specs: [
          { key: 'Material', value: 'Madera de paraíso' },
          { key: 'Medidas', value: '90 x 50 cm' },
        ],
      },
      {
        title: 'Cafetera express 19 bares',
        description: 'Con espumador de leche y portafiltro doble.',
        categorySlug: 'hogar-cocina',
        priceCents: 18999000,
        stock: 11,
        brand: 'Philips',
        photo: 'coffee,espresso,machine',
        specs: [
          { key: 'Presión', value: '19 bares' },
          { key: 'Potencia', value: '1450 W' },
        ],
      },
      {
        title: 'Set de ollas antiadherentes (borrador)',
        description: 'Juego de 5 piezas. Todavía afinando fotos y precio.',
        categorySlug: 'hogar-cocina',
        priceCents: 14500000,
        stock: 6,
        status: 'DRAFT',
        photo: 'pots,kitchen',
        specs: [{ key: 'Piezas', value: '5' }],
      },
    ],
  },
  {
    email: 'moda@marketplace.local',
    name: 'Moda Urbana',
    slug: 'moda-urbana',
    profile: {
      description:
        'Indumentaria urbana y calzado. Tendencias para todos los días.',
      phone: '011 4777-9000',
      whatsapp: '+54 9 11 4777-9000',
      email: 'hola@modaurbana.com',
      instagram: '@moda.urbana',
      city: 'Rosario',
      province: 'Santa Fe',
      hours: 'Lun a Sáb de 10 a 20 hs',
      policies: 'Primer cambio sin cargo. Envíos en 48/72 hs.',
      pickupEnabled: true,
      shippingCents: 180000,
    },
    products: [
      {
        title: 'Zapatillas running ultralivianas',
        description: 'Suela con retorno de energía, talles 38 al 45.',
        categorySlug: 'deportes-fitness',
        priceCents: 9899900,
        stock: 25,
        brand: 'Nike',
        photo: 'sneakers,running,shoes',
        specs: [{ key: 'Drop', value: '8 mm' }],
        variants: [
          { attributes: { talle: '40' }, stock: 10 },
          { attributes: { talle: '42' }, stock: 9 },
          { attributes: { talle: '44' }, stock: 6 },
        ],
      },
      {
        title: 'Remera oversize de algodón',
        description: 'Algodón peinado, corte holgado. Varios colores y talles.',
        categorySlug: 'indumentaria-hombre',
        priceCents: 2499900,
        stock: 40,
        brand: 'Urban',
        photo: 'tshirt,clothing',
        specs: [{ key: 'Material', value: 'Algodón 100%' }],
        variants: [
          { attributes: { talle: 'M', color: 'Negro' }, stock: 15 },
          { attributes: { talle: 'L', color: 'Negro' }, stock: 12 },
          { attributes: { talle: 'M', color: 'Blanco' }, stock: 13 },
        ],
      },
      {
        title: 'Campera rompevientos impermeable',
        description: 'Liviana, con capucha y bolsillos con cierre.',
        categorySlug: 'indumentaria-mujer',
        priceCents: 4599900,
        stock: 18,
        brand: 'Montagne',
        photo: 'jacket,clothing',
        specs: [
          { key: 'Material', value: 'Nylon impermeable' },
          { key: 'Capucha', value: 'Sí' },
        ],
        variants: [
          { attributes: { talle: 'S' }, stock: 6 },
          { attributes: { talle: 'M' }, stock: 7 },
          { attributes: { talle: 'L' }, stock: 5 },
        ],
      },
      {
        title: 'Buzo canguro friza (pausado)',
        description: 'Friza de invierno. Pausado hasta reponer stock.',
        categorySlug: 'indumentaria-hombre',
        priceCents: 3899900,
        stock: 0,
        status: 'PAUSED',
        brand: 'Urban',
        photo: 'hoodie,sweatshirt',
        specs: [{ key: 'Material', value: 'Algodón frisado' }],
      },
    ],
  },
  {
    email: 'natural@marketplace.local',
    name: 'Natural Market',
    slug: 'natural-market',
    profile: {
      description:
        'Almacén natural, bebidas y todo para tu salida al aire libre.',
      phone: '0351 155-2020',
      whatsapp: '+54 9 351 155-2020',
      email: 'ventas@naturalmarket.com',
      city: 'Córdoba',
      province: 'Córdoba',
      hours: 'Lun a Vie de 9 a 19 hs',
      policies: 'Productos frescos con cadena de frío. Retiro en local disponible.',
      pickupEnabled: true,
      shippingCents: 200000,
    },
    products: [
      {
        title: 'Yerba mate orgánica 1kg',
        description: 'Estacionada 24 meses, sin polvo. Directo del productor.',
        categorySlug: 'alimentos-almacen',
        priceCents: 850000,
        stock: 120,
        photo: 'mate,tea,herbs',
        specs: [
          { key: 'Estacionamiento', value: '24 meses' },
          { key: 'Tipo', value: 'Orgánica, sin polvo' },
        ],
      },
      {
        title: 'Vino Malbec reserva 750ml',
        description: 'Cosecha de altura, crianza en roble. Caja x6 disponible.',
        categorySlug: 'alimentos-bebidas',
        priceCents: 1290000,
        stock: 60,
        brand: 'Finca del Valle',
        photo: 'wine,bottle,redwine',
        specs: [
          { key: 'Varietal', value: 'Malbec' },
          { key: 'Volumen', value: '750 ml' },
        ],
      },
      {
        title: 'Carpa iglú 4 personas',
        description: 'Doble techo impermeable, armado rápido. Bolso incluido.',
        categorySlug: 'deportes-camping',
        priceCents: 24900000,
        stock: 8,
        brand: 'Waterdog',
        photo: 'tent,camping',
        specs: [
          { key: 'Capacidad', value: '4 personas' },
          { key: 'Columna de agua', value: '2000 mm' },
        ],
      },
      {
        title: 'Bicicleta rodado 28 21 cambios',
        description:
          'Cuadro de aluminio, frenos a disco. Usada, en muy buen estado.',
        categorySlug: 'deportes-ciclismo',
        priceCents: 35000000,
        stock: 1,
        brand: 'Vairo',
        condition: 'USED',
        photo: 'bicycle,mountainbike',
        specs: [
          { key: 'Rodado', value: '28' },
          { key: 'Cambios', value: '21' },
          { key: 'Cuadro', value: 'Aluminio' },
        ],
      },
      {
        title: 'Set de mancuernas ajustables 20kg',
        description: 'Par de mancuernas con discos intercambiables.',
        categorySlug: 'deportes-fitness',
        priceCents: 16500000,
        stock: 14,
        photo: 'dumbbell,gym,fitness',
        specs: [{ key: 'Peso máximo', value: '20 kg (c/u)' }],
      },
    ],
  },
];

function slugOf(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function seedCategories() {
  for (const [parentName, children] of Object.entries(CATEGORIES)) {
    const parent = await prisma.category.upsert({
      where: { slug: slugOf(parentName) },
      update: {},
      create: { name: parentName, slug: slugOf(parentName) },
    });
    for (const childName of children) {
      const childSlug = `${parent.slug}-${slugOf(childName)}`;
      await prisma.category.upsert({
        where: { slug: childSlug },
        update: {},
        create: { name: childName, slug: childSlug, parentId: parent.id },
      });
    }
  }
  console.log('Categorías sembradas.');
}

async function upsertUser(
  email: string,
  name: string,
  password: string,
  opts: { role?: 'USER' | 'ADMIN'; phone?: string } = {},
) {
  return prisma.user.upsert({
    where: { email },
    update: {
      emailVerifiedAt: new Date(),
      ...(opts.role && { role: opts.role }),
    },
    create: {
      email,
      name,
      passwordHash: await argon2.hash(password),
      emailVerifiedAt: new Date(),
      role: opts.role ?? 'USER',
      phone: opts.phone ?? null,
    },
  });
}

async function seedSellers() {
  for (const seller of SELLERS) {
    const owner = await upsertUser(seller.email, seller.name, seedPassword(seller));
    const business = await prisma.business.upsert({
      where: { ownerId: owner.id },
      update: seller.profile,
      create: {
        ...(seller.profile as Prisma.BusinessCreateWithoutOwnerInput),
        ownerId: owner.id,
        name: seller.name,
        slug: seller.slug,
        status: 'ACTIVE',
      },
    });

    for (const demo of seller.products) {
      const category = await prisma.category.findUnique({
        where: { slug: demo.categorySlug },
      });
      if (!category) {
        console.warn(`Categoría no encontrada: ${demo.categorySlug}`);
        continue;
      }

      const slug = slugOf(demo.title);
      const variants = demo.variants ?? [{ stock: demo.stock }];
      const imageUrls = photos(demo.photo, slug);

      const product = await prisma.product.upsert({
        where: { slug },
        update: {
          description: demo.description,
          brand: demo.brand ?? null,
          condition: demo.condition ?? 'NEW',
          status: demo.status ?? 'ACTIVE',
          specs: demo.specs ?? [],
          images: {
            deleteMany: {},
            create: imageUrls.map((url, i) => ({ url, position: i })),
          },
        },
        create: {
          businessId: business.id,
          categoryId: category.id,
          title: demo.title,
          slug,
          description: demo.description,
          brand: demo.brand ?? null,
          condition: demo.condition ?? 'NEW',
          status: demo.status ?? 'ACTIVE',
          specs: demo.specs ?? [],
          variants: {
            create: variants.map((v, i) => ({
              priceCents: demo.priceCents,
              stock: v.stock,
              attributes: v.attributes ?? {},
              isDefault: i === 0,
            })),
          },
          images: {
            create: imageUrls.map((url, i) => ({ url, position: i })),
          },
        },
      });

      // si el producto ya existía con una sola variante, sumamos las extra
      if (variants.length > 1) {
        const count = await prisma.productVariant.count({
          where: { productId: product.id },
        });
        if (count <= 1) {
          for (const v of variants.slice(1)) {
            await prisma.productVariant.create({
              data: {
                productId: product.id,
                priceCents: demo.priceCents,
                stock: v.stock,
                attributes: v.attributes ?? {},
              },
            });
          }
        }
      }
    }
    const total = seller.products.length;
    console.log(`Tienda "${seller.name}" sembrada (${total} productos).`);
  }
}

// password por defecto de cada vendedor (demo conserva la histórica)
function seedPassword(seller: DemoSeller): string {
  if (seller.email === 'demo@marketplace.local') return 'demo-marketplace-123';
  return `${seller.slug}-123`;
}

async function seedAdmin() {
  await upsertUser('admin@marketplace.local', 'Admin', 'admin-marketplace-123', {
    role: 'ADMIN',
  });
  console.log('Usuario admin listo (admin@marketplace.local).');
}

// ── Compradores, órdenes, reseñas, preguntas, etc. ──────────
// Se siembra una sola vez (si el comprador principal ya tiene órdenes, se omite).

const BUYER1 = 'comprador@marketplace.local';
const BUYER2 = 'compradora@marketplace.local';

async function variantOf(slug: string) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { slug },
    include: { variants: { orderBy: { isDefault: 'desc' } } },
  });
  return { product, variant: product.variants[0] };
}

interface OrderLine {
  slug: string;
  quantity: number;
}

async function createOrder(
  buyerId: string,
  address: Prisma.JsonObject,
  lines: OrderLine[],
  opts: {
    orderStatus: 'PAID' | 'PENDING_PAYMENT' | 'CANCELLED';
    subStatus: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    trackingCode?: string;
    cancelReason?: string;
    daysAgo?: number;
  },
) {
  // agrupar líneas por negocio → una sub-orden por negocio
  const resolved = await Promise.all(
    lines.map(async (l) => {
      const { product, variant } = await variantOf(l.slug);
      return { line: l, product, variant };
    }),
  );

  const byBusiness = new Map<string, typeof resolved>();
  for (const r of resolved) {
    const arr = byBusiness.get(r.product.businessId) ?? [];
    arr.push(r);
    byBusiness.set(r.product.businessId, arr);
  }

  const createdAt = opts.daysAgo
    ? new Date(Date.now() - opts.daysAgo * 24 * 3600 * 1000)
    : new Date();

  const subOrders: Prisma.SubOrderCreateWithoutOrderInput[] = [];
  let total = 0;
  let shippingTotal = 0;

  for (const [businessId, items] of byBusiness) {
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: businessId },
    });
    const subtotal = items.reduce(
      (sum, it) => sum + it.variant.priceCents * it.line.quantity,
      0,
    );
    const shipping = business.shippingCents ?? 0;
    total += subtotal + shipping;
    shippingTotal += shipping;

    subOrders.push({
      business: { connect: { id: businessId } },
      status: opts.subStatus,
      subtotalCents: subtotal,
      shippingMethod: 'SHIPPING',
      shippingCents: shipping,
      feeCents: platformFeeCents(subtotal),
      trackingCode: opts.trackingCode ?? null,
      cancelReason: opts.cancelReason ?? null,
      items: {
        create: items.map((it) => ({
          variant: { connect: { id: it.variant.id } },
          quantity: it.line.quantity,
          unitPriceCents: it.variant.priceCents,
          titleSnapshot: it.product.title,
          attributesSnapshot: (it.variant.attributes ??
            {}) as Prisma.InputJsonValue,
        })),
      },
    });
  }

  const order = await prisma.order.create({
    data: {
      buyer: { connect: { id: buyerId } },
      status: opts.orderStatus,
      totalCents: total,
      shippingCents: shippingTotal,
      shippingAddress: address,
      createdAt,
      subOrders: { create: subOrders },
      ...(opts.orderStatus === 'PAID' && {
        payment: {
          create: {
            status: 'APPROVED',
            amountCents: total,
            providerPaymentId: `seed-${Math.random().toString(36).slice(2, 11)}`,
          },
        },
      }),
    },
    include: { subOrders: { include: { items: true } } },
  });
  return order;
}

async function seedActivity() {
  const existing = await prisma.order.count({
    where: { buyer: { email: BUYER1 } },
  });
  if (existing > 0) {
    console.log('Actividad de demo ya presente, se omite.');
    return;
  }

  const buyer1 = await upsertUser(BUYER1, 'Lucía Gómez', 'comprador-123', {
    phone: '011 4666-7788',
  });
  const buyer2 = await upsertUser(BUYER2, 'Martín Pérez', 'comprador-123');

  // Direcciones guardadas
  await prisma.address.createMany({
    data: [
      {
        userId: buyer1.id,
        street: 'Av. Santa Fe',
        number: '2050',
        city: 'CABA',
        province: 'Buenos Aires',
        zipCode: '1123',
        isDefault: true,
      },
      {
        userId: buyer1.id,
        street: 'Belgrano',
        number: '760',
        city: 'La Plata',
        province: 'Buenos Aires',
        zipCode: '1900',
        isDefault: false,
      },
      {
        userId: buyer2.id,
        street: 'Bv. Oroño',
        number: '1500',
        city: 'Rosario',
        province: 'Santa Fe',
        zipCode: '2000',
        isDefault: true,
      },
    ],
  });

  const addr1: Prisma.JsonObject = {
    street: 'Av. Santa Fe',
    number: '2050',
    city: 'CABA',
    province: 'Buenos Aires',
    zipCode: '1123',
  };
  const addr2: Prisma.JsonObject = {
    street: 'Bv. Oroño',
    number: '1500',
    city: 'Rosario',
    province: 'Santa Fe',
    zipCode: '2000',
  };

  // Favoritos
  const favSlugs = ['notebook-14-ryzen-5-16gb', 'vino-malbec-reserva-750ml'];
  for (const slug of favSlugs) {
    const p = await prisma.product.findUnique({ where: { slug } });
    if (p) {
      await prisma.favorite.create({
        data: { userId: buyer1.id, productId: p.id },
      });
    }
  }

  // Órdenes en distintos estados ────────────────────────────
  // A) Entregada (habilita reseñas) — buyer1
  const delivered = await createOrder(
    buyer1.id,
    addr1,
    [
      { slug: 'auriculares-bluetooth-con-cancelacion-de-ruido', quantity: 1 },
      { slug: 'cafetera-express-19-bares', quantity: 1 },
    ],
    { orderStatus: 'PAID', subStatus: 'DELIVERED', daysAgo: 20 },
  );

  // B) Enviada con tracking — buyer1
  await createOrder(
    buyer1.id,
    addr1,
    [{ slug: 'remera-oversize-de-algodon', quantity: 2 }],
    {
      orderStatus: 'PAID',
      subStatus: 'SHIPPED',
      trackingCode: 'AR123456789',
      daysAgo: 4,
    },
  );

  // C) Confirmada (en preparación) — buyer2
  await createOrder(
    buyer2.id,
    addr2,
    [{ slug: 'yerba-mate-organica-1kg', quantity: 3 }],
    { orderStatus: 'PAID', subStatus: 'CONFIRMED', daysAgo: 1 },
  );

  // D) Pendiente de pago — buyer1
  await createOrder(
    buyer1.id,
    addr1,
    [{ slug: 'set-de-mancuernas-ajustables-20kg', quantity: 1 }],
    { orderStatus: 'PENDING_PAYMENT', subStatus: 'PENDING' },
  );

  // E) Cancelada por el vendedor — buyer2
  await createOrder(
    buyer2.id,
    addr2,
    [{ slug: 'carpa-iglu-4-personas', quantity: 1 }],
    {
      orderStatus: 'CANCELLED',
      subStatus: 'CANCELLED',
      cancelReason: 'Sin stock disponible al momento de preparar el envío.',
      daysAgo: 8,
    },
  );

  console.log('Órdenes de demo creadas (entregada, enviada, confirmada, pendiente, cancelada).');

  // Reseñas sobre los productos entregados ───────────────────
  void delivered;
  const reviewed = await seedReviews(buyer1.id);

  // Votos "útil" sobre las reseñas (de usuarios distintos al autor) ───
  if (reviewed.length > 0) {
    const voters = await prisma.user.findMany({
      where: {
        email: {
          in: [BUYER2, 'admin@marketplace.local', 'moda@marketplace.local'],
        },
      },
      select: { id: true },
    });
    await prisma.reviewVote.createMany({
      data: reviewed.flatMap((r) =>
        voters.map((v) => ({ reviewId: r.id, userId: v.id })),
      ),
      skipDuplicates: true,
    });
  }

  // Preguntas (respondidas y sin responder) ──────────────────
  await seedQuestions(buyer1.id, buyer2.id);

  // Notificaciones in-app ────────────────────────────────────
  await seedNotifications(buyer1.id);

  // Denuncias para la cola de moderación del admin ───────────
  await seedReports(buyer2.id, reviewed[0]?.id);

  console.log('Actividad de demo sembrada (reseñas, votos, preguntas, notificaciones, denuncias).');
}

async function seedReviews(buyerId: string) {
  const created: { id: string; productId: string }[] = [];
  const reviewsData = [
    {
      slug: 'auriculares-bluetooth-con-cancelacion-de-ruido',
      rating: 5,
      comment:
        'Excelentes, la cancelación de ruido funciona muy bien y la batería rinde un montón.',
      sellerResponse: '¡Gracias por tu compra, Lucía! Que los disfrutes.',
    },
    {
      slug: 'cafetera-express-19-bares',
      rating: 4,
      comment: 'Muy buena cafetera, calienta rápido. El espumador podría ser mejor.',
    },
  ];

  for (const r of reviewsData) {
    const product = await prisma.product.findUnique({ where: { slug: r.slug } });
    if (!product) continue;
    const review = await prisma.review.create({
      data: {
        productId: product.id,
        businessId: product.businessId,
        authorId: buyerId,
        rating: r.rating,
        comment: r.comment,
        ...(r.sellerResponse && {
          sellerResponse: r.sellerResponse,
          sellerRespondedAt: new Date(),
        }),
      },
    });
    created.push({ id: review.id, productId: product.id });
  }
  return created;
}

async function seedQuestions(buyer1Id: string, buyer2Id: string) {
  const qs = [
    {
      slug: 'celular-x20-128gb',
      authorId: buyer1Id,
      body: '¿Viene con cargador en la caja?',
      answer: 'Sí, incluye cargador de 25W y cable USB-C.',
    },
    {
      slug: 'notebook-14-ryzen-5-16gb',
      authorId: buyer2Id,
      body: '¿Se le puede ampliar la memoria RAM?',
      answer: 'Tiene un slot libre, se puede llevar hasta 32 GB.',
    },
    {
      slug: 'smart-tv-50-4k',
      authorId: buyer2Id,
      body: '¿Tiene Bluetooth para conectar auriculares?',
      answer: null,
    },
  ];
  for (const q of qs) {
    const product = await prisma.product.findUnique({ where: { slug: q.slug } });
    if (!product) continue;
    await prisma.question.create({
      data: {
        productId: product.id,
        authorId: q.authorId,
        body: q.body,
        ...(q.answer && { answer: q.answer, answeredAt: new Date() }),
      },
    });
  }
}

async function seedNotifications(buyerId: string) {
  // notificaciones para los vendedores (ventas) y el comprador (estado/reseña)
  const seller = await prisma.user.findUnique({
    where: { email: 'demo@marketplace.local' },
  });
  if (seller) {
    await prisma.notification.createMany({
      data: [
        {
          userId: seller.id,
          type: 'SALE',
          title: '¡Nueva venta!',
          body: 'Vendiste Auriculares Bluetooth con cancelación de ruido',
          link: '/vender/ventas',
        },
        {
          userId: seller.id,
          type: 'QUESTION',
          title: 'Te hicieron una pregunta',
          body: '¿Viene con cargador en la caja?',
          link: '/p/celular-x20-128gb',
        },
      ],
    });
  }
  await prisma.notification.createMany({
    data: [
      {
        userId: buyerId,
        type: 'ORDER_STATUS',
        title: 'Tu pedido fue enviado',
        body: 'Seguimiento: AR123456789',
        link: '/compras',
      },
      {
        userId: buyerId,
        type: 'REVIEW_REPLY',
        title: 'El vendedor respondió tu reseña',
        body: 'Auriculares Bluetooth con cancelación de ruido',
        link: '/p/auriculares-bluetooth-con-cancelacion-de-ruido',
        readAt: new Date(),
      },
    ],
  });
}

async function seedReports(reporterId: string, reviewId?: string) {
  // denuncia de producto (cola de moderación)
  const product = await prisma.product.findUnique({
    where: { slug: 'buzo-canguro-friza-pausado' },
  });
  if (product) {
    await prisma.report.create({
      data: {
        productId: product.id,
        reporterId,
        reason: 'OTHER',
        details: 'La foto no coincide con la descripción del producto.',
      },
    });
  }
  // denuncia de reseña ofensiva
  if (reviewId) {
    await prisma.reviewReport.create({
      data: { reviewId, reporterId },
    });
  }
}

async function main() {
  await seedCategories();
  await seedAdmin();
  await seedSellers();
  await seedActivity();
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    return prisma.$disconnect().then(() => process.exit(1));
  });
