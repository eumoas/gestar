# Backend Gestar - Etapa 1

Como rodar:

1. Criar virtualenv e instalar dependências:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r ../requirements.txt
```

2. Rodar o servidor:

```bash
uvicorn app.main:app --reload --port 8000
```

API:
- GET /api/gestantes
- POST /api/gestantes
- POST /api/gestantes/{id}/sintomas
