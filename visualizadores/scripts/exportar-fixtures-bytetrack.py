"""Exporta fixtures de referência do trackers.ByteTrackTracker (versões de projeto-3/requirements.txt).

Cada fixture é uma sequência curta e determinística de detecções construída à mão,
executada pelo tracker Python. O JSON guarda entrada e saída para que
tests/fixtures-python.test.js compare o motor didático do navegador.

Uso (ambiente com trackers==2.6.1, supervision==0.30.5, numpy==2.3.5; não exige GPU):
    python scripts/exportar-fixtures-bytetrack.py
"""
import json
import platform
from importlib.metadata import version
from pathlib import Path

import numpy as np
import supervision as sv
from trackers import ByteTrackTracker

DESTINO = Path(__file__).resolve().parent.parent / "tests" / "fixtures" / "bytetrack"

# Parâmetros do notebook 02_tracking.ipynb (célula 22) e filtro do detector (célula 15).
NOTEBOOK_02 = dict(frame_rate=30.0, high_conf_det_threshold=0.25, track_activation_threshold=0.35,
                   minimum_consecutive_frames=2, minimum_iou_threshold=0.10, lost_track_buffer=30)


def caixa(cx, cy, w=40, h=20):
    return [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2]


def det(cx, cy, score, w=40, h=20):
    return {"xyxy": caixa(cx, cy, w, h), "confidence": score}


def executar(nome, descricao, quadros, limiar_detector=0.10, **ajustes):
    parametros = {**NOTEBOOK_02, **ajustes}
    tracker = ByteTrackTracker(**parametros)
    saida = []
    for brutas in quadros:
        # O filtro do detector acontece fora do tracker, como em detectar() dos notebooks.
        indices = [i for i, d in enumerate(brutas) if d["confidence"] >= limiar_detector]
        if indices:
            entrada = sv.Detections(
                xyxy=np.array([brutas[i]["xyxy"] for i in indices], dtype=float),
                confidence=np.array([brutas[i]["confidence"] for i in indices], dtype=float),
                data={"indice": np.array(indices)},
            )
        else:
            entrada = sv.Detections.empty()
        resultado = tracker.update(entrada)
        associacoes = []
        if len(resultado):
            for indice, tid in zip(resultado.data["indice"], resultado.tracker_id):
                associacoes.append({"det": int(indice), "tracker_id": int(tid)})
        associacoes.sort(key=lambda a: a["det"])
        trilhas = [{"tracker_id": int(t.tracker_id), "sem_atualizar": int(t.time_since_update),
                    "consecutivas": int(t.number_of_successful_consecutive_updates),
                    "xyxy": [round(float(v), 4) for v in t.get_state_bbox()]} for t in tracker.tracks]
        saida.append({"deteccoes": brutas, "saida": associacoes, "trilhas": trilhas})
    return {"schemaVersion": 1, "nome": nome, "descricao": descricao,
            "parametros": {**parametros, "limiar_detector": limiar_detector,
                           "maximum_frames_without_update": tracker.maximum_frames_without_update},
            "quadros": saida}


def fixtures():
    q = []
    # 1. Nascimento sem trilhas: uma caixa alta andando para a direita.
    q.append(executar("nascimento", "Uma detecção alta por quadro; ID só após a confirmação.",
                      [[det(100 + 5 * t, 100, 0.9)] for t in range(5)]))
    # 2. Quadros vazios intercalados: o tracker precisa avançar mesmo sem detecções.
    q.append(executar("quadros-vazios", "Quadros sem detecção no início, no meio e no fim.",
                      [[], [det(100, 100, 0.9)], [det(104, 100, 0.9)], [], [det(112, 100, 0.9)], []]))
    # 3. Limites exatos: score = high (0,25) conta como ALTA; = ativação (0,35) nasce; 0,34 não nasce.
    q.append(executar("limites-thresholds", "Scores exatamente nos limiares de alta e de ativação.",
                      [[det(100, 100, 0.35), det(300, 100, 0.34), det(500, 100, 0.25)]] * 3))
    # 4. Baixa isolada: 0,18 nunca inicia trilha.
    q.append(executar("baixa-isolada", "Detecção de 0,18 sem trilha prévia não produz ID.",
                      [[det(100 + 4 * t, 100, 0.18)] for t in range(5)]))
    # 5. Microcena do plano §5: trilha confirmada recebe caixas 0,18 durante uma oclusão parcial.
    micro = [[det(100 + 4 * t, 100, 0.9 if t < 3 or t >= 7 else 0.18)] for t in range(10)]
    q.append(executar("recuperacao-baixa", "Filtro 0,10: a etapa 2 mantém o ID com score 0,18.",
                      micro, lost_track_buffer=3))
    q.append(executar("recuperacao-baixa-filtrada", "Filtro 0,25: as caixas 0,18 não chegam ao tracker.",
                      micro, limiar_detector=0.25, lost_track_buffer=3))
    # 6. Confirmação interrompida: falha no 2º quadro reinicia a contagem.
    q.append(executar("confirmacao-interrompida", "Tentativa sem par é removida; nova tentativa depois.",
                      [[det(100, 100, 0.9)], [], [det(108, 100, 0.9)], [det(112, 100, 0.9)]]))
    # 7. Buffer antes/no/depois do limite (buffer 3 a 30 FPS → 3 quadros).
    for lacuna in (3, 4):
        seq = [[det(100 + 4 * t, 100, 0.9)] if t < 3 or t >= 3 + lacuna else [] for t in range(3 + lacuna + 2)]
        q.append(executar(f"buffer-lacuna-{lacuna}", f"Lacuna de {lacuna} quadros com buffer 3.",
                          seq, lost_track_buffer=3))
    q.append(executar("buffer-zero", "lost_track_buffer=0 remove a trilha na primeira falta.",
                      [[det(100, 100, 0.9)], [det(100, 100, 0.9)], [], [det(100, 100, 0.9)]], lost_track_buffer=0))
    # 8. Buffer com FPS não múltiplo de 30 (25 FPS, buffer 5 → 25/30·5 = 4,17).
    seq = [[det(100, 100, 0.9)] if t < 3 or t >= 8 else [] for t in range(10)]
    q.append(executar("buffer-fps-25", "25 FPS e buffer 5: lacuna de 5 quadros.", seq,
                      frame_rate=25.0, lost_track_buffer=5))
    # 9. Etapa 2 com trilha tentativa: nasce alta, segue com baixa.
    q.append(executar("etapa2-tentativa", "Tentativa recebe apenas caixa 0,20 no quadro seguinte.",
                      [[det(100, 100, 0.9)], [det(102, 100, 0.20)], [det(104, 100, 0.9)]]))
    # 10. Etapa 2 com trilha perdida: some um quadro e volta com score baixo.
    q.append(executar("etapa2-perdida", "Trilha confirmada some 1 quadro e volta com 0,20.",
                      [[det(100, 100, 0.9)], [det(100, 100, 0.9)], [], [det(100, 100, 0.20)],
                       [det(100, 100, 0.20)], [det(100, 100, 0.9)]]))
    # 11. minimum_consecutive_frames = 1: quando o ID é emitido?
    q.append(executar("confirmacao-1-quadro", "minimum_consecutive_frames=1 com falso positivo de 1 quadro.",
                      [[det(100, 100, 0.9), det(400, 100, 0.9)], [det(100, 100, 0.9)], [det(100, 100, 0.9)]],
                      minimum_consecutive_frames=1))
    q.append(executar("confirmacao-3-quadros", "minimum_consecutive_frames=3: ID no 3º quadro seguido.",
                      [[det(100 + 4 * t, 100, 0.9)] for t in range(5)], minimum_consecutive_frames=3))
    q.append(executar("tentativa-sobrevive-min1", "Com mínimo 1, tentativa sem par sobrevive um quadro.",
                      [[det(100, 100, 0.9)], [], [det(100, 100, 0.9)], [], [], [det(100, 100, 0.9)]],
                      minimum_consecutive_frames=1))
    # 12. Ambiguidade: limiar aplicado depois da atribuição ótima pode descartar um par válido.
    # IoU: A×d1 0,694; A×d2 0,337; B×d1 0,336; B×d2 0,036. A soma máxima escolhe A×d1 + B×d2 e
    # depois rejeita B×d2 (< 0,10), embora A×d2 + B×d1 fossem dois pares válidos.
    a, b = [28, 12, 72, 68], [64, 20, 92, 72]
    d1, d2 = [28, 16, 88, 68], [12, 32, 68, 56]
    q.append(executar("ambiguidade-limiar", "Atribuição ótima seguida de rejeição pelo IoU mínimo.",
                      [[{"xyxy": a, "confidence": 0.9}, {"xyxy": b, "confidence": 0.9}]] * 2
                      + [[{"xyxy": d1, "confidence": 0.9}, {"xyxy": d2, "confidence": 0.9}]] * 2))
    # 13. Movimento constante com oclusão: compara a previsão de Kalman (XYXY vs cx,cy,w,h local).
    seq = [[det(100 + 12 * t, 200 + 3 * t, 0.9, 60, 30)] if not 8 <= t < 13 else [] for t in range(20)]
    q.append(executar("kalman-oclusao", "Velocidade constante e lacuna de 5 quadros.", seq))
    return q


def main():
    DESTINO.mkdir(parents=True, exist_ok=True)
    ambiente = {"python": platform.python_version(),
                **{p: version(p) for p in ["trackers", "supervision", "numpy", "scipy"]}}
    nomes = []
    for f in fixtures():
        f["ambiente"] = ambiente
        (DESTINO / f"{f['nome']}.json").write_text(json.dumps(f, ensure_ascii=False, indent=1) + "\n")
        nomes.append(f["nome"])
    (DESTINO / "manifest.json").write_text(json.dumps({"schemaVersion": 1, "ambiente": ambiente,
                                                      "fixtures": nomes}, indent=1) + "\n")
    print(len(nomes), "fixtures em", DESTINO)


if __name__ == "__main__":
    main()
