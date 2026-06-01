const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/motores?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
    const motores = await response.json();

    // Solo motores que tienen foto — sin foto Meta los rechaza igual
    const conFoto = motores.filter(m => {
      if (Array.isArray(m.fotos)) return m.fotos.length > 0 && m.fotos[0];
      return typeof m.fotos === 'string' && m.fotos.trim();
    });

    const headers = [
      'id', 'vehicle_id', 'title', 'description', 'url',
      'image_link', 'make', 'model', 'year',
      'mileage.value', 'mileage.unit',
      'state_of_vehicle', 'condition', 'availability',
      'vehicle_type', 'body_style', 'drivetrain',
      'transmission', 'fuel_type', 'price'
    ];

    const rows = conFoto.map((m) => {
      const img = Array.isArray(m.fotos) ? m.fotos[0] : m.fotos;
      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const km = m.kilometraje ? String(m.kilometraje).replace(/\D/g, '') || '1' : '1';
      const year = m.anio ? String(m.anio) : '2000';
      const desc = `Motor ${title} usado original con garantia de funcionamiento. Desbalizar S.A., Bolivar, Buenos Aires.`;

      return [
        m.id, m.id, title, desc, url,
        img,
        m.marca || '', m.modelo || '', year,
        km, 'KM',
        'used', 'GOOD', 'available',
        'CAR_TRUCK', 'OTHER', 'OTHER',
        'OTHER', 'GASOLINE', '1 ARS'
      ].map(v => String(v == null ? '' : v).replace(/\t/g, ' ').replace(/\n/g, ' ')).join('\t');
    });

    const tsv = [headers.join('\t'), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(tsv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
