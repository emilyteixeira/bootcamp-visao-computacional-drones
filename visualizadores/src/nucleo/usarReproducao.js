// Relógio de reprodução quadro a quadro (play/pausa, velocidade, laço), estilo linha do tempo do Blender.
import { useCallback, useEffect, useRef, useState } from 'react';

export function usarReproducao(totalQuadros, fps = 30) {
  const [quadro, setQuadro] = useState(0);
  const [tocando, setTocando] = useState(true);
  const [velocidade, setVelocidade] = useState(0.5);
  const acumulado = useRef(0);

  useEffect(() => {
    if (!tocando) return;
    let id;
    let anterior = performance.now();
    const passo = (agora) => {
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

  const irPara = useCallback((q) => setQuadro(Math.max(0, Math.min(totalQuadros - 1, q))), [totalQuadros]);

  // Atalhos do Blender: Espaço = play/pausa, ←/→ = quadro, Shift+← = início.
  useEffect(() => {
    const aoTeclar = (e) => {
      if (e.target.closest('input, select, textarea, button')) return;
      if (e.code === 'Space') { e.preventDefault(); setTocando((t) => !t); }
      if (e.key === 'ArrowRight') { setTocando(false); setQuadro((q) => Math.min(totalQuadros - 1, q + 1)); }
      if (e.key === 'ArrowLeft') { setTocando(false); setQuadro((q) => (e.shiftKey ? 0 : Math.max(0, q - 1))); }
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, [totalQuadros]);

  return { quadro, irPara, tocando, setTocando, velocidade, setVelocidade };
}
