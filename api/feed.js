// api/feed.js — Feed de vehículos para Meta Catalog
// Formato XML listings que Meta acepta para catálogo de Vehículos

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/motores?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);

    const motores = await response.json();

    const items = motores.map((m) => {
      let imageUrl = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) imageUrl = m.fotos[0];
      else if (typeof m.fotos === 'string' && m.fotos) imageUrl = m.fotos;

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const mileage = m.kilometraje ? String(m.kilometraje).replace(/\D/g, '') : '0';
      const year = m.anio ? String(m.anio) : '2000';
      const desc = [
        m.marca && `Marca: ${m.marca}`,
        m.modelo && `Modelo: ${m.modelo}`,
        m.anio && `Anio: ${m.anio}`,
        m.cilindrada && `Cilindrada: ${m.cilindrada}`,
        m.codigo_motor && `Codigo: ${m.codigo_motor}`,
        'Motor usado original con garantia. Desbalizar S.A., Bolivar Bs.As.',
      ].filter(Boolean).join(' | ');

      return `  <listing>
    <id>${esc(String(m.id))}</id>
    <url>${esc(url)}</url>
    <title>${esc(title)}</title>
    <description>${esc(desc)}</description>
    <image_url>${esc(imageUrl)}</image_url>
    <make>${esc(m.marca || 'Sin marca')}</make>
    <model>${esc(m.modelo || 'Sin modelo')}</model>
    <year>${esc(year)}</year>
    <mileage>${mileage}</mileage>
    <mileage_unit>KM</mileage_unit>
    <condition>used</condition>
    <availability>available</availability>
    <vehicle_type>car</vehicle_type>
    <body_style>other</body_style>
    <drivetrain>AWD</drivetrain>
    <transmission>automatic</transmission>
    <fuel_type>gasoline</fuel_type>
    <exterior_color>Silver</exterior_color>
    <price>1 ARS</price>
  </listing>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="utf-8"?>
<listings>
  <title>Desbalizar S.A. - Motores usados</title>
  <link rel="self" href="https://catalogo-motores.vercel.app/api/feed"/>
${items}
</listings>`;

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: err.message });
  }
}

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
