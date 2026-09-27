// MODELO para novos visualizadores. Copie esta pasta para src/visualizadores/<id>/ e registre em src/registro.ts.
// Estrutura sugerida:
//   logica.ts            → matemática pura (sem React), testável em tests/<id>.test.ts
//   Cena3D.tsx           → objetos three.js/R3F dentro do <Viewport3D>
//   <Nome>Visualizador.tsx → layout: palco (viewport + linha do tempo) e painel lateral
import { useRef, useState } from 'react';
import Viewport3D, { type ControleViewport } from '../../nucleo/Viewport3D.tsx';
import Controle from '../../nucleo/ui/Controle.tsx';

export default function ModeloVisualizador() {
  const [tamanho, setTamanho] = useState(1);
  const viewport = useRef<ControleViewport>(null);
  return (
    <div className="bt">
      <section className="bt-palco">
        <p className="rotulo">Novo conceito</p>
        <h1>Título do conceito</h1>
        <div className="bt-viewport">
          <Viewport3D ref={viewport}>
            <mesh position={[0, tamanho / 2, 0]}>
              <boxGeometry args={[tamanho, tamanho, tamanho]} />
              <meshStandardMaterial color="#4772b3" />
            </mesh>
          </Viewport3D>
        </div>
      </section>
      <aside className="bt-painel">
        <div className="painel-secao">
          <Controle id="modelo-tamanho" rotulo="Tamanho" codigo="parametro_da_biblioteca" valor={tamanho} min={0.2} max={3} passo={0.1} aoMudar={setTamanho}>
            <p className="controle-papel">Explique o papel do parâmetro e o efeito de aumentá-lo ou reduzi-lo.</p>
          </Controle>
        </div>
      </aside>
    </div>
  );
}
