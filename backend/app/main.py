from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Dict, List, Optional
import datetime
from .services.triagem_mock import TriagemMock

app = FastAPI(title="Gestar - Etapa 1")


class GestanteIn(BaseModel):
    nome: str
    dum: datetime.date
    paridade: Optional[int] = 0
    condicoes_previas: Optional[List[str]] = []


class SintomasIn(BaseModel):
    sintomas: List[str]
    # Campo aditivo e opcional: intensidade (1-5) por sintoma selecionado, ex.
    # {"cefaleia intensa": 4}. Só alimenta o histórico exibido na interface —
    # a lógica de triagem (TriagemMock.triar) continua recebendo só `sintomas`
    # e decidindo o nível do mesmo jeito de sempre.
    intensidade: Optional[Dict[str, int]] = None


class CarteiraPatch(BaseModel):
    item_id: str
    status: str


# ---------------------------------------------------------------------------
# Seed em memória (Etapa 1: sem banco de dados, respostas simuladas)
#
# As DUMs são calculadas em relação à data de hoje (e não fixas), para que as
# gestantes fiquem sempre em fases distintas e plausíveis da jornada (1º ao 3º
# trimestre), não importando em que dia o protótipo for demonstrado.
# ---------------------------------------------------------------------------
def _dum_ha_semanas(semanas: int) -> str:
    return str(datetime.date.today() - datetime.timedelta(weeks=semanas))


GESTANTES = [
    {"id": 1, "nome": "Maria Silva", "dum": _dum_ha_semanas(10), "paridade": 1, "condicoes_previas": []},
    {"id": 2, "nome": "Ana Costa", "dum": _dum_ha_semanas(20), "paridade": 0, "condicoes_previas": ["hipertensão"]},
    {"id": 3, "nome": "Joana Pereira", "dum": _dum_ha_semanas(30), "paridade": 2, "condicoes_previas": []},
    {"id": 4, "nome": "Clara Gomes", "dum": _dum_ha_semanas(6), "paridade": 0, "condicoes_previas": []},
    {"id": 5, "nome": "Beatriz Lima", "dum": _dum_ha_semanas(26), "paridade": 1, "condicoes_previas": ["diabetes gestacional"]},
    {"id": 6, "nome": "Rafaela Nunes", "dum": _dum_ha_semanas(35), "paridade": 0, "condicoes_previas": []},
    {"id": 7, "nome": "Sofia Rocha", "dum": _dum_ha_semanas(33), "paridade": 3, "condicoes_previas": []},
    {"id": 8, "nome": "Laura Mendes", "dum": _dum_ha_semanas(15), "paridade": 0, "condicoes_previas": []},
]

# Ao menos um caso de alerta vermelho ativo, para que o painel da equipe seja
# demonstrável imediatamente após subir a aplicação (SDD, seção 5).
ALERTAS = [
    {
        "id": 1,
        "gestacao_id": 7,
        "nivel": "vermelho",
        "mensagem": "Sinais sugestivos de pré-eclâmpsia. Procure UBS ou maternidade.",
        "origem": "regra",
        "tratado": False,
        "criado_em": datetime.datetime.utcnow().isoformat(),
    }
]
SINTOMAS_HISTORICO = {}  # gestacao_id -> list de registros
CARTEIRA_OVERRIDES = {}  # item_id -> status manual

triagem = TriagemMock()


# ---------------------------------------------------------------------------
# Helpers de idade gestacional (compartilham a mesma lógica do protocolo MS)
# ---------------------------------------------------------------------------
def _parse_date(d):
    if isinstance(d, str):
        return datetime.datetime.fromisoformat(d).date()
    return d


def calc_dpp(dum):
    return _parse_date(dum) + datetime.timedelta(days=280)


def calc_semanas(dum):
    hoje = datetime.date.today()
    delta = hoje - _parse_date(dum)
    return max(delta.days // 7, 0)


def trimestre_por_semana(semanas: int) -> int:
    if semanas <= 13:
        return 1
    if semanas <= 27:
        return 2
    return 3


def enrich(g: dict) -> dict:
    semanas = calc_semanas(g["dum"])
    return {
        **g,
        "semanas": semanas,
        "trimestre": trimestre_por_semana(semanas),
        "dpp": str(calc_dpp(g["dum"])),
    }


def find_gestante(id: int) -> dict:
    g = next((x for x in GESTANTES if x["id"] == id), None)
    if not g:
        raise HTTPException(status_code=404, detail="Gestante não encontrada")
    return g


# ---------------------------------------------------------------------------
# Carteira de pré-natal (consultas e exames por trimestre, conforme protocolo MS)
# ---------------------------------------------------------------------------
CONSULTAS_TEMPLATE = [
    {"semana": 10, "descricao": "1ª consulta de pré-natal"},
    {"semana": 16, "descricao": "Consulta de rotina"},
    {"semana": 22, "descricao": "Consulta de rotina"},
    {"semana": 28, "descricao": "Consulta + vacina dTpa"},
    {"semana": 32, "descricao": "Consulta de rotina"},
    {"semana": 36, "descricao": "Consulta de rotina"},
    {"semana": 39, "descricao": "Consulta final"},
]

EXAMES_TEMPLATE = [
    {"semana": 10, "descricao": "Tipagem sanguínea e sorologias (HIV, sífilis, hepatites)"},
    {"semana": 12, "descricao": "Ultrassom morfológico do 1º trimestre"},
    {"semana": 24, "descricao": "Ultrassom morfológico do 2º trimestre"},
    {"semana": 26, "descricao": "Teste de tolerância à glicose (TTG)"},
    {"semana": 35, "descricao": "Pesquisa de Streptococcus do grupo B"},
    {"semana": 36, "descricao": "Hemograma do 3º trimestre"},
]


def build_carteira(g: dict) -> List[dict]:
    semanas = calc_semanas(g["dum"])
    itens = []
    for categoria, template in (("consulta", CONSULTAS_TEMPLATE), ("exame", EXAMES_TEMPLATE)):
        for item in template:
            item_id = f"{g['id']}:{categoria}:{item['semana']}"
            status_auto = "realizada" if semanas >= item["semana"] else "pendente"
            status = CARTEIRA_OVERRIDES.get(item_id, status_auto)
            itens.append({
                "item_id": item_id,
                "categoria": categoria,
                "descricao": item["descricao"],
                "semana_prevista": item["semana"],
                "trimestre": trimestre_por_semana(item["semana"]),
                "status": status,
            })
    itens.sort(key=lambda x: x["semana_prevista"])
    return itens


# ---------------------------------------------------------------------------
# Gestante
# ---------------------------------------------------------------------------
@app.get('/api/gestantes')
async def list_gestantes():
    return [enrich(g) for g in GESTANTES]


@app.get('/api/gestantes/{id}')
async def get_gestante(id: int):
    return enrich(find_gestante(id))


@app.post('/api/gestantes')
async def create_gestante(g: GestanteIn):
    new_id = max([x['id'] for x in GESTANTES]) + 1 if GESTANTES else 1
    item = {
        "id": new_id,
        "nome": g.nome,
        "dum": str(g.dum),
        "paridade": g.paridade or 0,
        "condicoes_previas": g.condicoes_previas or [],
    }
    GESTANTES.append(item)
    return enrich(item)


@app.get('/api/gestantes/{id}/jornada')
async def jornada(id: int):
    g = find_gestante(id)
    timeline = [
        {"tipo": "onboarding", "data": "2024-07-01", "descricao": "Onboarding e cálculo de DPP"},
        {"tipo": "consulta", "data": "2024-09-01", "descricao": "Consulta do 1º trimestre"},
    ]
    return {"gestante": enrich(g), "timeline": timeline}


@app.get('/api/gestantes/{id}/carteira')
async def carteira(id: int):
    g = find_gestante(id)
    return {"gestante_id": id, "semana_atual": calc_semanas(g["dum"]), "itens": build_carteira(g)}


@app.patch('/api/gestantes/{id}/carteira')
async def atualizar_carteira(id: int, payload: CarteiraPatch):
    find_gestante(id)
    if payload.status not in ("pendente", "realizada"):
        raise HTTPException(status_code=400, detail="status deve ser 'pendente' ou 'realizada'")
    CARTEIRA_OVERRIDES[payload.item_id] = payload.status
    return {"item_id": payload.item_id, "status": payload.status}


@app.get('/api/gestantes/{id}/sintomas')
async def historico_sintomas(id: int):
    find_gestante(id)
    return SINTOMAS_HISTORICO.get(id, [])


@app.post('/api/gestantes/{id}/sintomas')
async def registrar_sintomas(id: int, payload: SintomasIn):
    g = find_gestante(id)
    resultado = triagem.triar(g, payload.sintomas)
    registro = {
        "data": datetime.datetime.utcnow().isoformat(),
        "sintomas": payload.sintomas,
        "intensidade": payload.intensidade or {},
        "nivel": resultado["nivel"],
        "mensagem": resultado["mensagem"],
    }
    SINTOMAS_HISTORICO.setdefault(id, []).append(registro)
    if resultado['nivel'] in ('vermelho',):
        ALERTAS.append({
            'id': len(ALERTAS) + 1,
            'gestacao_id': id,
            'nivel': resultado['nivel'],
            'mensagem': resultado['mensagem'],
            'origem': 'regra',
            'tratado': False,
            'criado_em': datetime.datetime.utcnow().isoformat()
        })
    return {**resultado, 'simulado': True}


@app.post('/api/gestantes/{id}/epds')
async def registrar_epds(id: int, payload: dict):
    find_gestante(id)
    respostas = payload.get('respostas', {})
    pontuacao = sum(int(v) for v in respostas.values()) if respostas else 0
    nivel = 'verde'
    mensagem = 'Pontuação EPDS dentro do esperado.'
    if pontuacao >= 13:
        nivel = 'vermelho'
        mensagem = 'Sinais de risco de depressão pós-parto. Procure avaliação profissional.'
    elif 10 <= pontuacao <= 12:
        nivel = 'amarelo'
        mensagem = 'Sinais moderados. Aconselha-se monitoramento e acolhimento.'
    resultado = {'pontuacao': pontuacao, 'nivel': nivel, 'mensagem': mensagem}
    if nivel == 'vermelho':
        ALERTAS.append({
            'id': len(ALERTAS) + 1,
            'gestacao_id': id,
            'nivel': nivel,
            'mensagem': mensagem,
            'origem': 'epds',
            'tratado': False,
            'criado_em': datetime.datetime.utcnow().isoformat()
        })
    return {**resultado, 'simulado': True}


# ---------------------------------------------------------------------------
# Equipe
# ---------------------------------------------------------------------------
@app.get('/api/equipe/dashboard')
async def dashboard():
    contagem = {'verde': 0, 'amarelo': 0, 'vermelho': 0}
    resumo = []
    for g in GESTANTES:
        pendentes = [a for a in ALERTAS if a['gestacao_id'] == g['id'] and not a.get('tratado')]
        niveis = [a['nivel'] for a in pendentes]
        nivel = 'vermelho' if 'vermelho' in niveis else 'amarelo' if 'amarelo' in niveis else 'verde'
        contagem[nivel] += 1
        semanas = calc_semanas(g['dum'])
        resumo.append({
            "gestante_id": g['id'],
            "nome": g['nome'],
            "semanas": semanas,
            "trimestre": trimestre_por_semana(semanas),
            "nivel": nivel,
            "alertas_pendentes": len(pendentes),
        })
    return {"contagem": contagem, "gestantes": resumo}


@app.get('/api/equipe/alertas')
async def lista_alertas():
    return ALERTAS


@app.patch('/api/equipe/alertas/{alerta_id}')
async def tratar_alerta(alerta_id: int):
    alerta = next((a for a in ALERTAS if a['id'] == alerta_id), None)
    if not alerta:
        raise HTTPException(status_code=404, detail='Alerta não encontrado')
    alerta['tratado'] = True
    return alerta


# Servir o build do frontend (React/Vite) como estático, na mesma porta da API.
# STATIC_DIR permite apontar para outro local (ex.: layout do container de deploy);
# por padrão aponta para <raiz do repo>/frontend/dist.
import os
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
dist_path = Path(os.environ.get('STATIC_DIR', PROJECT_ROOT / 'frontend' / 'dist'))
if dist_path.exists():
    app.mount('/', StaticFiles(directory=str(dist_path), html=True), name='static')
else:
    # não há build do frontend ainda (ex.: ambiente de desenvolvimento com Vite
    # separado em :5173); a API continua disponível normalmente em /api.
    pass
