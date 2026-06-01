// api/feed.js — Feed de vehículos para Meta Catalog

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

    const headers = [
      'id', 'vehicle_id', 'url', 'title', 'description',
      'image[0].url', 'make', 'model', 'year',
      'mileage.value', 'mileage.unit',
      'state_of_vehicle', 'condition', 'availability',
      'vehicle_type', 'body_style', 'drivetrain',
      'transmission', 'fuel_type', 'exterior_color',
      'price', 'address'
    ];

    const rows = motores.map((m) => {
      let imageUrl = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) imageUrl = m.fotos[0];
      else if (typeof m.fotos === 'string' && m.fotos) imageUrl = m.fotos;

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const mileageValue = m.kilometraje ? String(m.kilometraje).replace(/\D/g, '') : '0';
      const year = m.anio ? String(m.anio) : '2000';
      const desc = [
        m.marca && `Marca: ${m.marca}`,
        m.modelo && `Modelo: ${m.modelo}`,
        m.anio && `Anio: ${m.anio}`,
        m.cilindrada && `Cilindrada: ${m.cilindrada}`,
        'Motor usado original con garantia. Desbalizar S.A. Bolivar Bs.As.',
      ].filter(Boolean).join(' | ');

      return [
        m.id, m.id, url, title, desc,
        imageUrl,
        m.marca || 'OTHER',
        m.modelo || 'OTHER',
        year,
        mileageValue, 'KM',
        'used',
        'GOOD',
        'available',
        'CAR_TRUCK',
        'OTHER',
        'OTHER',
        'OTHER',
        'GASOLINE',
        'OTHER',
        '1 ARS',
        'Santiago del Estero 910, Bolivar, Buenos Aires, AR, 6550',
      ].map(csvCell).join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(csv);
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: err.message });
  }
}

function csvCell(val) {
  const str = String(val == null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
