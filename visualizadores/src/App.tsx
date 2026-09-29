import { Suspense, useEffect, useState } from 'react';
import { VISUALIZADORES, visualizadorPorId } from './registro.ts';
import VagaPlanejada from './nucleo/VagaPlanejada.tsx';

// Roteamento por âncora simples (#bytetrack): funciona no link compartilhado do Artifact.
const lerAncora = () => (typeof location !== 'undefined' ? location.hash.replace('#', '') : '');

export default function App() {
  const [atual, setAtual] = useState(() => visualizadorPorId(lerAncora()).id);

  useEffect(() => {
    const aoMudar = () => setAtual(visualizadorPorId(lerAncora()).id);
    window.addEventListener('hashchange', aoMudar);
    return () => window.removeEventListener('hashchange', aoMudar);
  }, []);

  const v = visualizadorPorId(atual);
  return (
    <div className="app">
      <header className="barra-topo">
        <div className="marca">
          <span className="marca-simbolo" aria-hidden="true" />
          <div>
            <strong>Laboratório de Visão</strong>
            <small>Bootcamp · Visão Computacional aplicada a drones</small>
          </div>
        </div>
        <nav className="abas-modulos" aria-label="Visualizadores">
          {VISUALIZADORES.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`aba-modulo ${item.id === atual ? 'ativa' : ''} ${item.status}`}
              aria-current={item.id === atual ? 'page' : undefined}
              title={item.subtitulo}
            >
              {item.titulo}
              {item.status === 'planejado' && <span className="selo">em breve</span>}
            </a>
          ))}
        </nav>
      </header>
      <main className="conteudo">
        {v.status === 'pronto' ? (
          <Suspense fallback={<div className="carregando">Carregando {v.titulo}…</div>}>
            <v.Componente />
          </Suspense>
        ) : (
          <VagaPlanejada visualizador={v} />
        )}
      </main>
    </div>
  );
}
