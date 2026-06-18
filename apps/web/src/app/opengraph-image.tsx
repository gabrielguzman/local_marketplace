import { ImageResponse } from 'next/og';

export const alt = 'Mercato — comprá y vendé en tiendas de tu zona';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #4338ca 0%, #4f46e5 55%, #6366f1 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: 'white',
              color: '#4f46e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 56,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 56, fontWeight: 800 }}>Mercato</div>
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Los negocios de tu zona, a un click.
        </div>
        <div style={{ marginTop: 24, fontSize: 32, color: '#c7d2fe' }}>
          Comprá directo · Vendé fácil
        </div>
      </div>
    ),
    { ...size },
  );
}
