// Gerador pseudoaleatório determinístico (mulberry32).
// A mesma semente reproduz exatamente a mesma cena: requisito para comparar parâmetros.
export interface Rng {
  proximo: () => number;
  normal: () => number;
  entre: (min: number, max: number) => number;
}

export function criarRng(semente = 1): Rng {
  let a = semente >>> 0;
  const proximo = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = () => {
    const u = Math.max(proximo(), 1e-9);
    const v = proximo();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { proximo, normal, entre: (min: number, max: number) => min + (max - min) * proximo() };
}
