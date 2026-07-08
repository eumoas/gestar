"""Geocodificacao unica do blh_unidades.json via Nominatim (OpenStreetMap).

Roda uma vez, grava latitude/longitude no proprio JSON e gera um relatorio
das unidades que precisaram de fallback ou falharam. Nao usar em producao:
o app le as coordenadas prontas do arquivo.

Uso:
    pip install requests
    python geocodificar_blh.py

Respeita o limite de 1 requisicao/segundo do Nominatim e retoma de onde
parou se for interrompido (pula unidades que ja tem coordenadas).
Tempo estimado para 491 unidades com fallbacks: 10 a 25 minutos.
"""

import json
import time
from pathlib import Path

import requests

ARQUIVO = Path(__file__).resolve().parent.parent / "backend" / "app" / "data" / "blh_unidades.json"
RELATORIO = Path(__file__).resolve().parent / "geocodificacao_relatorio.txt"
NOMINATIM = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "gestar-prototipo-academico/1.0 (contato da autora)"}
PAUSA = 1.1


def consultar(q: str):
    r = requests.get(
        NOMINATIM,
        params={"q": q, "format": "json", "limit": 1, "countrycodes": "br"},
        headers=HEADERS,
        timeout=20,
    )
    r.raise_for_status()
    dados = r.json()
    time.sleep(PAUSA)
    if dados:
        return float(dados[0]["lat"]), float(dados[0]["lon"])
    return None


def geocodificar(u: dict):
    """Tenta do mais preciso ao mais grosseiro. Retorna (lat, lon, precisao)."""
    municipio_uf = f"{u['municipio']}, {u['uf']}, Brasil"

    tentativas = [
        (f"{u['endereco']}, {municipio_uf}", "endereco"),
        (f"{u['cep']}, Brasil" if u.get("cep") else None, "cep"),
        (municipio_uf, "municipio"),
    ]
    for consulta, precisao in tentativas:
        if not consulta:
            continue
        try:
            resultado = consultar(consulta)
        except requests.RequestException as e:
            print(f"  erro de rede ({precisao}): {e}")
            continue
        if resultado:
            return resultado[0], resultado[1], precisao
    return None, None, "falha"


def main():
    with open(ARQUIVO, encoding="utf-8") as f:
        base = json.load(f)

    unidades = base["unidades"]
    pendentes = [u for u in unidades if u["latitude"] is None]
    print(f"{len(pendentes)} de {len(unidades)} unidades a geocodificar")

    relatorio = []
    for i, u in enumerate(pendentes, 1):
        lat, lon, precisao = geocodificar(u)
        u["latitude"], u["longitude"], u["precisao_geo"] = lat, lon, precisao
        print(f"[{i}/{len(pendentes)}] {precisao:9s} {u['nome'][:60]}")
        if precisao != "endereco":
            relatorio.append(f"{precisao:9s} | {u['uf']} | {u['nome']}")

        if i % 25 == 0:
            with open(ARQUIVO, "w", encoding="utf-8") as f:
                json.dump(base, f, ensure_ascii=False, indent=2)

    with open(ARQUIVO, "w", encoding="utf-8") as f:
        json.dump(base, f, ensure_ascii=False, indent=2)

    with open(RELATORIO, "w", encoding="utf-8") as f:
        f.write("Unidades geocodificadas por fallback (revisar se desejado):\n\n")
        f.write("\n".join(relatorio) or "nenhuma")

    total = len(unidades)
    por_precisao = {}
    for u in unidades:
        por_precisao[u["precisao_geo"]] = por_precisao.get(u["precisao_geo"], 0) + 1
    print("\nResumo:", {k: f"{v} ({100*v/total:.0f}%)" for k, v in por_precisao.items()})
    print(f"Relatorio de fallbacks em {RELATORIO}")


if __name__ == "__main__":
    main()
