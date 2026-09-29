"""Executa os trechos Python da aula (src/curso/trechos.json) nas versões fixadas do projeto 3
e grava o resultado em src/curso/validacao-trechos.json, exibido ao lado de cada trecho.

- "executado": roda preparo + código + verificação num namespace novo; guarda a saída impressa.
- "ilustrativo": não roda (depende de modelo, pesos ou pacotes pesados); confere que cada nome
  de API em "requer" existe nas versões instaladas.

Uso (na pasta visualizadores/): python scripts/validar-trechos.py
"""
import contextlib
import hashlib
import io
import json
import platform
import traceback
from datetime import date
from importlib.metadata import version
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PREAMBULO = "import numpy as np\nimport supervision as sv\n"


def validar(t):
    ns = {}
    saida = io.StringIO()
    try:
        with contextlib.redirect_stdout(saida):
            exec(PREAMBULO, ns)
            if t["execucao"] == "executado":
                exec(t.get("preparo", ""), ns)
                exec(t["codigo"], ns)
                exec(t.get("verificacao", ""), ns)
            else:
                for nome in t.get("requer", []):
                    eval(nome, ns)
        return {"status": "ok", "saida": saida.getvalue()}
    except Exception:
        return {"status": "falhou", "saida": saida.getvalue(), "erro": traceback.format_exc(limit=2)}


def main():
    trechos = json.loads((RAIZ / "src/curso/trechos.json").read_text())
    resultados = {}
    for t in trechos:
        r = validar(t)
        r["execucao"] = t["execucao"]
        r["hashCodigo"] = hashlib.sha256(t["codigo"].encode()).hexdigest()
        resultados[t["id"]] = r
        print(t["id"], r["status"])
    relatorio = {
        "data": date.today().isoformat(),
        "ambiente": {"python": platform.python_version(),
                     **{p: version(p) for p in ["supervision", "trackers", "numpy", "opencv-python"]}},
        "resultados": resultados,
    }
    (RAIZ / "src/curso/validacao-trechos.json").write_text(json.dumps(relatorio, ensure_ascii=False, indent=1) + "\n")
    if any(r["status"] != "ok" for r in resultados.values()):
        raise SystemExit("Há trechos com falha.")


if __name__ == "__main__":
    main()
