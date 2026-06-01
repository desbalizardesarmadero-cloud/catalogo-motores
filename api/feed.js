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

    const headers = [
      'vehicle_id',
      'title',
      'description',
      'url',
      'image_link',         // TSV usa image_link (no image, no array)
      'make',
      'model',
      'year',
      'mileage',            // solo número entero, sin unidad
      'state_of_vehicle',   // used / new
      'condition',          // GOOD / EXCELLENT / FAIR / POOR
      'availability',       // available / not available
      'vehicle_type',
      'body_style',
      'transmission',
      'fuel_type',
      'price',
      'dealer_name',
      'dealer_id',
      'addr1',
      'city',
      'region',
      'country',
      'postal_code',
    ];

    const rows = motores.map((m) => {
      let img = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) img = m.fotos[0] || '';
      else if (typeof m.fotos === 'string') img = m.fotos || '';

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      // mileage: número entero puro, sin texto ni unidad
      const km = m.kilometraje ? parseInt(String(m.kilometraje).replace(/\D/g, ''), 10) || 0 : 0;
      const year = m.anio ? parseInt(String(m.anio), 10) : 2000;
      const desc = `Motor ${title} usado original con garantia de funcionamiento. Desbalizar S.A., Bolivar, Buenos Aires.`;

      return [
        m.id,
        title,
        desc,
        url,
        img,
        m.marca || '',
        m.modelo || '',
        year,
        km,               // número entero, ej: 150000
        'used',
        'GOOD',
        'available',
        'CAR_TRUCK',
        'OTHER',
        'OTHER',
        'GASOLINE',
        '1 ARS',
        'Desbalizar S.A.',
        'desbalizar-001',
        'Santiago del Estero 910',
        'Bolivar',
        'Buenos Aires',
        'AR',
        '6550',
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
