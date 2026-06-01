// api/feed.js — Feed vehículos Meta, formato Google Vehicle Ads (compatible con Meta)

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

    // Usar TSV (tab-separated) — evita problemas con comas en los datos
    // y Meta lo acepta igual que CSV
    const headers = [
      'id', 'vehicle_id', 'title', 'description', 'url',
      'image_link',
      'make', 'model', 'year',
      'mileage', 'mileage_unit',
      'state_of_vehicle', 'condition', 'availability',
      'vehicle_type', 'body_style', 'drivetrain',
      'transmission', 'fuel_type', 'color',
      'price',
      'dealer_name', 'dealer_id',
      'address', 'city', 'region', 'country', 'zip'
    ];

    const rows = motores.map((m) => {
      let img = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) img = m.fotos[0];
      else if (typeof m.fotos === 'string' && m.fotos) img = m.fotos;

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const km = m.kilometraje ? String(m.kilometraje).replace(/\D/g, '') : '0';
      const year = m.anio ? String(m.anio) : '2000';
      const desc = `Motor ${m.marca || ''} ${m.modelo || ''} usado original con garantia. Desbalizar S.A. Bolivar Bs.As.`.trim();

      return [
        m.id, m.id, title, desc, url,
        img,
        m.marca || '', m.modelo || '', year,
        km, 'KM',
        'used', 'GOOD', 'available',
        'CAR_TRUCK', 'OTHER', 'OTHER',
        'OTHER', 'GASOLINE', 'OTHER',
        '1 ARS',
        'Desbalizar S.A.', '1',
        'Santiago del Estero 910', 'Bolivar', 'Buenos Aires', 'AR', '7550'
      ].map(t).join('\t');
    });

    const tsv = [headers.join('\t'), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(tsv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Tab-separated: solo escapar tabs y newlines dentro del valor
function t(val) {
  return String(val == null ? '' : val).replace(/\t/g, ' ').replace(/\n/g, ' ');
}
