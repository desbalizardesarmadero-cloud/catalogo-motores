const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Dirección fija del negocio en formato JSON que Meta acepta
const DIRECCION = JSON.stringify({
  addr1: "Santiago del Estero 910",
  city: "Bolivar",
  region: "Buenos Aires",
  country: "AR",
  postal_code: "6550"
});

export default async function handler(req, res) {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/motores?select=*&order=created_at.desc`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    if (!response.ok) throw new Error(`Supabase error: ${response.status}`);
    const motores = await response.json();

    const headers = [
      'id', 'vehicle_id', 'title', 'description', 'url',
      'image', 'make', 'model', 'year',
      'mileage.value', 'mileage.unit',
      'state_of_vehicle', 'condition', 'availability',
      'vehicle_type', 'body_style', 'drivetrain',
      'transmission', 'fuel_type', 'price', 'address'
    ];

    const rows = motores.map((m) => {
      let img = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) img = m.fotos[0] || '';
      else if (typeof m.fotos === 'string') img = m.fotos;

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const km = m.kilometraje ? String(m.kilometraje).replace(/\D/g, '') || '1' : '1';
      const year = m.anio ? String(m.anio) : '2000';
      const desc = `Motor ${title} usado original con garantia. Desbalizar S.A., Bolivar Bs.As.`;

      return [
        m.id, m.id, title, desc, url,
        img,
        m.marca || '', m.modelo || '', year,
        km, 'KM',
        'used', 'GOOD', 'available',
        'CAR_TRUCK', 'OTHER', 'OTHER',
        'OTHER', 'GASOLINE', '1 ARS',
        DIRECCION
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
