// Relógio de reprodução quadro a quadro (play/pausa, velocidade, laço), estilo linha do tempo do Blender.
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';

export interface Reproducao {
  quadro: number;
  irPara: (q: number) => void;
  tocando: boolean;
  setTocando: Dispatch<SetStateAction<boolean>>;
  velocidade: number;
  setVelocidade: Dispatch<SetStateAction<number>>;
}

// iniciarTocando = false: a aula guiada começa pausada (plano §6); o laboratório segue tocando.
export function usarReproducao(totalQuadros: number, fps = 30, iniciarTocando = true, quadroInicial = 0): Reproducao {
  const [quadro, setQuadro] = useState(quadroInicial);
  const [tocando, setTocando] = useState(iniciarTocando);
  const [velocidade, setVelocidade] = useState(0.5);
  const acumulado = useRef(0);

  useEffect(() => {
    if (!tocando) return;
    let id = 0;
    let anterior = performance.now();
    const passo = (agora: number) => {
      acumulado.current += ((agora - anterior) / 1000) * fps * velocidade;
      anterior = agora;
      if (acumulado.current >= 1) {
        const n = Math.floor(acumulado.current);
        acumulado.current -= n;
        setQuadro((q) => (q + n) % totalQuadros);
      }
      id = requestAnimationFrame(passo);
    };
    id = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(id);
  }, [tocando, velocidade, fps, totalQuadros]);

  const irPara = useCallback((q: number) => setQuadro(Math.max(0, Math.min(totalQuadros - 1, q))), [totalQuadros]);

  // Atalhos do Blender: Espaço = play/pausa, ←/→ = quadro, Shift+← = início.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.target as Element | null)?.closest('input, select, textarea, button')) return;
      if (e.code === 'Space') { e.preventDefault(); setTocando((t) => !t); }
      if (e.key === 'ArrowRight') { setTocando(false); setQuadro((q) => Math.min(totalQuadros - 1, q + 1)); }
      if (e.key === 'ArrowLeft') { setTocando(false); setQuadro((q) => (e.shiftKey ? 0 : Math.max(0, q - 1))); }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [totalQuadros]);

  return { quadro, irPara, tocando, setTocando, velocidade, setVelocidade };
}
