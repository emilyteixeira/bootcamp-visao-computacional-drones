"""Grava replays do trackers.ByteTrackTracker (versões de projeto-3/requirements.txt) sobre as
detecções das cenas do laboratório, para o curso mostrar a saída real do Python ao lado da
simulação JS.

Uso (na pasta visualizadores/, com trackers==2.6.1, supervision==0.30.5, numpy==2.3.5):
    npx tsx scripts/exportar-cenas.ts oclusao > /tmp/oclusao.json
    python scripts/exportar-replays-bytetrack.py /tmp/oclusao.json oclusao-nb02
    python scripts/exportar-replays-bytetrack.py /tmp/oclusao.json oclusao-nb02-buffer60 lost_track_buffer=60
"""
import json
import platform
import sys
from importlib.metadata import version
from pathlib import Path

import numpy as np
import supervision as sv
from trackers import ByteTrackTracker

DESTINO = Path(__file__).resolve().parent.parent / "src" / "curso" / "replays"
# Notebook 02 (células 15 e 22). frame_rate=30: FPS da cena sintética.
NB02 = dict(frame_rate=30.0, high_conf_det_threshold=0.25, track_activation_threshold=0.35,
            minimum_consecutive_frames=2, minimum_iou_threshold=0.10, lost_track_buffer=30)
LIMIAR_DETECTOR = 0.10


def main(entrada, nome, *ajustes):
    cena = json.loads(Path(entrada).read_text())
    parametros = dict(NB02)
    for a in ajustes:
        k, v = a.split("=")
        parametros[k] = type(parametros[k])(float(v)) if isinstance(parametros[k], float) else int(v)
    tracker = ByteTrackTracker(**parametros)
    quadros = []
    for brutas in cena["quadros"]:
        idx = [i for i, d in enumerate(brutas) if d["confidence"] >= LIMIAR_DETECTOR]
        det = sv.Detections(xyxy=np.array([brutas[i]["xyxy"] for i in idx], dtype=float).reshape(-1, 4),
                            confidence=np.array([brutas[i]["confidence"] for i in idx], dtype=float),
                            data={"i": np.array(idx, dtype=int)})
        res = tracker.update(det)
        por_indice = dict(zip(res.data["i"].tolist(), res.tracker_id.tolist())) if len(res) else {}
        quadros.append({
            # tracker_id de cada detecção que passou pelo filtro, na ordem de entrada.
            "ids": [int(por_indice[i]) for i in idx],
            # [tracker_id, quadros sem atualizar, x1, y1, x2, y2] de cada trilha viva.
            "trilhas": [[int(t.tracker_id), int(t.time_since_update)] + [round(float(v), 1) for v in t.get_state_bbox()]
                        for t in tracker.tracks],
        })
    replay = {
        "schemaVersion": 1,
        "nome": nome,
        "cenario": cena["cenario"],
        "hashDeteccoes": cena["hashDeteccoes"],
        "parametros": {**parametros, "limiar_detector": LIMIAR_DETECTOR},
        "ambiente": {"python": platform.python_version(),
                     **{p: version(p) for p in ["trackers", "supervision", "numpy", "scipy"]}},
        "quadros": quadros,
    }
    DESTINO.mkdir(parents=True, exist_ok=True)
    (DESTINO / f"{nome}.json").write_text(json.dumps(replay, separators=(",", ":")) + "\n")
    print(nome, len(quadros), "quadros")


if __name__ == "__main__":
    main(*sys.argv[1:])
