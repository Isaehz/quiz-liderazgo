import { neon } from '@neondatabase/serverless';

const VALID = new Set(['A', 'B', 'C']);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { nombre, respuestas, perfil } = req.body ?? {};

  if (
    !Array.isArray(respuestas) ||
    respuestas.length !== 5 ||
    !respuestas.every(r => VALID.has(r))
  ) {
    return res.status(400).json({ error: 'Respuestas inválidas' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO resultados (nombre, respuestas, perfil)
      VALUES (
        ${String(nombre ?? '').slice(0, 100)},
        ${JSON.stringify(respuestas)}::jsonb,
        ${String(perfil ?? '').slice(0, 50)}
      )
    `;
    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al guardar' });
  }
}
