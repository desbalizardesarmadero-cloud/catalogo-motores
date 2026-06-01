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
      'id',
      'retailer_id',
      'title',
      'description',
      'link',
      'image_link',
      'price',
      'availability',
      'condition',
      'brand',
    ];

    const rows = motores.map((m) => {
      let img = '';
      if (Array.isArray(m.fotos) && m.fotos.length > 0) img = m.fotos[0] || '';
      else if (typeof m.fotos === 'string') {
        try { const arr = JSON.parse(m.fotos); img = Array.isArray(arr) ? arr[0] : m.fotos; }
        catch { img = m.fotos; }
      }

      const title = [m.marca, m.modelo].filter(Boolean).join(' ') || 'Motor usado';
      const link = `https://catalogo-motores.vercel.app/motor.html?id=${m.id}`;
      const desc = `Motor ${title} usado original con garantia de funcionamiento. Desbalizar S.A., Bolivar, Buenos Aires.`;
      const id = `motor-${m.id}`;

      return [
        id,
        id,
        title,
        desc,
        link,
        img,
        '1 ARS',
        'in stock',
        'used',
        m.marca || 'Desbalizar',
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
