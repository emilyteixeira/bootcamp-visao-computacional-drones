// Verifica se o navegador consegue criar um contexto WebGL (sem ele, a cena 3D não renderiza).
export function suportaWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
