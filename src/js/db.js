export async function saveResult({ nombre, respuestas, perfil }) {
  try {
    await fetch('/api/save-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, respuestas, perfil }),
    });
  } catch (err) {
    console.warn('No se pudo guardar el resultado', err);
  }
}
