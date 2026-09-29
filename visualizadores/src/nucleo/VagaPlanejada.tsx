// Página exibida para entradas 'planejado' do registro: a vaga reservada para um novo visualizador.
import type { VisualizadorPlanejado } from '../registro.ts';

export default function VagaPlanejada({ visualizador }: { visualizador: VisualizadorPlanejado }) {
  return (
    <section className="vaga">
      <p className="rotulo">Módulo planejado</p>
      <h1>{visualizador.titulo}</h1>
      <p className="vaga-sub">{visualizador.subtitulo}</p>
      <p className="vaga-ideia">{visualizador.ideia}</p>
      <h2>Como criar este módulo</h2>
      <ol className="passos">
        <li>Copie <code>src/visualizadores/_modelo/</code> para <code>src/visualizadores/{visualizador.id}/</code>.</li>
        <li>Em <code>src/registro.ts</code>, troque <code>status: 'planejado'</code> por <code>'pronto'</code> e adicione <code>Componente: lazy(() =&gt; import(…))</code>.</li>
        <li>Reutilize <code>Viewport3D</code> (câmera, grade e gizmo estilo Blender), <code>LinhaDoTempo</code>, <code>Controle</code> e <code>usarReproducao</code> de <code>src/nucleo/</code>.</li>
        <li>Mantenha a lógica pura (sem React) em arquivos <code>.ts</code> testáveis com <code>npm test</code>.</li>
      </ol>
    </section>
  );
}
