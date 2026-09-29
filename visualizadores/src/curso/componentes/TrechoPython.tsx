// Trecho de código Python com proveniência e o resultado da validação nas versões fixadas.
import { TRECHOS, VALIDACAO } from '../trechos.ts';

export default function TrechoPython({ id }: { id: string }) {
  const t = TRECHOS[id];
  if (!t) return null;
  const v = VALIDACAO.resultados[id];
  const amb = VALIDACAO.ambiente;
  const versoes = `supervision ${amb.supervision} · trackers ${amb.trackers} · Python ${amb.python}`;
  return (
    <figure className="codigo">
      <figcaption>
        <span>{t.origem}</span>
        {v?.status === 'ok' && t.execucao === 'executado' && <span className="selo-validacao ok" title={`Validado em ${VALIDACAO.data}`}>executado: {versoes}</span>}
        {v?.status === 'ok' && t.execucao === 'ilustrativo' && <span className="selo-validacao ilustrativo" title={t.motivo}>ilustrativo · API conferida</span>}
        {(!v || v.status !== 'ok') && <span className="selo-validacao falhou">não validado</span>}
      </figcaption>
      <pre tabIndex={0} aria-label={`Código: ${t.origem}`}><code>{t.codigo}</code></pre>
      {t.execucao === 'ilustrativo' && t.motivo && <p className="codigo-nota">{t.motivo}</p>}
      {t.execucao === 'executado' && v?.saida && (
        <div className="codigo-saida">
          <span>Saída registrada ({VALIDACAO.data})</span>
          <pre tabIndex={0} aria-label="Saída registrada">{v.saida.trimEnd()}</pre>
        </div>
      )}
    </figure>
  );
}
