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
      'image',          // Meta requiere "image", no "image_link"
      'make',
      'model',
      'year',
      'mileage',        // número entero puro
      'state_of_vehicle',
      'condition',
      'availability',
      'vehicle_type',
      'body_style',
      'transmission',
      'fuel_type',
      'price',
      'dealer_name',
      'dealer_id',
      'address',        // Meta requiere "address" combinado, no addr1/city/etc separados
    ];

    const rows = motores.map((m) => {
      let img = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) img = m.fotos[0] || '';
      else if (typeof m.fotos === 'string') {
        try { const arr = JSON.parse(m.fotos); img = Array.isArray(arr) ? arr[0] : m.fotos; }
        catch { img = m.fotos; }
      }

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const url = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const km = m.km ? parseInt(String(m.km).replace(/\D/g, ''), 10) || 1 : 1;
      const year = m.anio ? parseInt(String(m.anio), 10) : 2000;
      const desc = `Motor ${title} usado original con garantia de funcionamiento. Desbalizar S.A., Bolivar, Buenos Aires.`;
      const address = 'Santiago del Estero 910, Bolivar, Buenos Aires, AR 6550';

      return [
        m.id,
        title,
        desc,
        url,
        img,
        m.marca || '',
        m.modelo || '',
        year,
        km,
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
        address,
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
