// Questão de múltipla escolha com feedback por opção. Formativa: pode ser respondida de novo.
import type { Questao as DadosQuestao } from '../tipos.ts';
import { formatar } from './TextoRico.tsx';

interface Props {
  questao: DadosQuestao;
  escolhida: number | undefined;
  aoEscolher: (opcao: number) => void;
}

export default function Questao({ questao, escolhida, aoEscolher }: Props) {
  const opcao = escolhida !== undefined ? questao.opcoes[escolhida] : undefined;
  return (
    <fieldset className="questao">
      <legend>{formatar(questao.enunciado)}</legend>
      {questao.opcoes.map((o, i) => (
        <label key={i} className={`opcao ${escolhida === i ? (o.correta ? 'certa' : 'errada') : ''}`}>
          <input type="radio" name={questao.id} checked={escolhida === i} onChange={() => aoEscolher(i)} />
          <span>{formatar(o.texto)}</span>
        </label>
      ))}
      <div className="feedback" aria-live="polite">
        {opcao && (
          <p className={opcao.correta ? 'certa' : 'errada'}>
            <strong>{opcao.correta ? 'Correto. ' : 'Ainda não. '}</strong>
            {formatar(opcao.feedback)}
          </p>
        )}
      </div>
    </fieldset>
  );
}
