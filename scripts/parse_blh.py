import json
import re
import unicodedata
from pathlib import Path

# RAW é um extrato em markdown da lista da Fiocruz (não versionado; já consumido
# uma vez para gerar o OUT abaixo, que é a fonte de verdade a partir daqui).
RAW = "blh_raw.md"
OUT = Path(__file__).resolve().parent.parent / "backend" / "app" / "data" / "blh_unidades.json"

TIPOS = {
    "Banco de Leite": "banco",
    "Centro de Referência": "centro_referencia",
    "Posto Coleta": "posto_coleta",
}

UFS = {
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
    "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
}


def slugify(txt: str) -> str:
    norm = unicodedata.normalize("NFKD", txt).encode("ascii", "ignore").decode()
    norm = re.sub(r"[^a-zA-Z0-9]+", "-", norm).strip("-").lower()
    return norm


with open(RAW, encoding="utf-8") as f:
    lines = f.read().split("\n")

estado = None
tipo = None
items = []
buf = []


def flush():
    if buf:
        items.append((estado, tipo, " ".join(buf)))
        buf.clear()


for line in lines:
    stripped = line.strip()
    m_estado = re.match(r"^\*\*(.+)\*\*$", stripped)
    if m_estado and m_estado.group(1) not in ("FIOCRUZ",) and "Rede Global" not in m_estado.group(1):
        flush()
        estado = m_estado.group(1)
        continue
    if stripped.startswith("### "):
        flush()
        tipo = TIPOS.get(stripped[4:].strip(), stripped[4:].strip())
        continue
    if stripped.startswith("-   ["):
        flush()
        buf.append(stripped[4:])
        continue
    if buf and stripped:
        buf.append(stripped)
    elif buf and not stripped:
        pass
flush()

unidades = []
problemas = []

for estado_nome, tipo_u, texto in items:
    texto = texto.replace("\\", " ")
    texto = re.sub(r"\s*>\s*", " ", texto)
    texto = re.sub(r"\s+", " ", texto).strip()

    m = re.match(r"\[(.+?)\]\((https?://[^\)]+)\)\s*(.*)", texto)
    if not m:
        problemas.append({"motivo": "sem link", "texto": texto[:120]})
        continue
    nome, url, resto = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()

    telefone = None
    m_tel = re.search(r"Telefone:\s*([\d\-\(\)\s/]+)?$", resto)
    if m_tel:
        telefone = (m_tel.group(1) or "").strip() or None
        resto = resto[: m_tel.start()].strip()

    endereco_completo = resto.rstrip("-").strip()

    municipio = uf = cep = None
    m_addr = re.search(
        r",\s*([^,]+?),\s*([A-Z]{2})\s*,\s*CEP:\s*([\d\.\-]+)", endereco_completo
    )
    if m_addr and m_addr.group(2) in UFS:
        municipio = m_addr.group(1).strip().title()
        uf = m_addr.group(2)
        cep = m_addr.group(3).replace(".", "")
        endereco = endereco_completo[: m_addr.start()].strip().rstrip(",")
    else:
        endereco = endereco_completo
        problemas.append({"motivo": "endereco nao estruturado", "nome": nome})

    unidades.append(
        {
            "id": slugify(f"{uf or estado_nome}-{nome}")[:80],
            "nome": nome,
            "tipo": tipo_u,
            "endereco": endereco,
            "municipio": municipio,
            "uf": uf,
            "cep": cep,
            "telefone": telefone,
            "url": url,
            "estado": estado_nome,
            "latitude": None,
            "longitude": None,
            "precisao_geo": None,
        }
    )

seen = {}
for u in unidades:
    base = u["id"]
    n = seen.get(base, 0)
    if n:
        u["id"] = f"{base}-{n+1}"
    seen[base] = n + 1

with open(OUT, "w", encoding="utf-8") as f:
    json.dump({"fonte": "rBLH Fiocruz (lista fornecida pela autora)",
               "unidades": unidades}, f, ensure_ascii=False, indent=2)

print(f"unidades: {len(unidades)}")
print(f"problemas: {len(problemas)}")
for p in problemas[:15]:
    print("  ", p)

from collections import Counter
print(Counter(u["tipo"] for u in unidades))
print(f"com telefone: {sum(1 for u in unidades if u['telefone'])}")
print(f"com uf estruturada: {sum(1 for u in unidades if u['uf'])}")
