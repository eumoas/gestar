from typing import List, Dict

class TriagemMock:
    """Motor de triagem simulada conforme SDD (regras determinísticas).

    Regras principais implementadas:
    - cefaleia intensa + visao embaçada + edema antes de 37 semanas -> vermelho
      (padrão compatível com pré-eclâmpsia; cenário de demonstração principal)
    - contrações regulares antes de 37 semanas -> vermelho
    - sangramento -> vermelho (regra clínica do protocolo, não exposta como opção
      na interface do diário de sintomas)
    - EPDS >=13 -> vermelho, 10-12 -> amarelo
    - default -> verde
    """

    def _idade_gestacional_semanas(self, dum):
        # dum pode ser string 'YYYY-MM-DD' ou date
        from datetime import date, datetime
        if isinstance(dum, str):
            dum = datetime.fromisoformat(dum).date()
        hoje = date.today()
        delta = hoje - dum
        semanas = delta.days // 7
        return semanas

    def triar(self, gestante: Dict, sintomas: List[str]) -> Dict:
        # sintomas: lista de strings simples
        s = [x.lower() for x in sintomas]
        nivel = 'verde'
        mensagem = 'Sem sinais de alerta.'

        # checar cefaleia intensa + visão embaçada + edema (cenário principal de demonstração)
        if 'cefaleia intensa' in s and 'visão embaçada' in s and 'edema' in s:
            semanas = self._idade_gestacional_semanas(gestante.get('dum'))
            if semanas < 37:
                nivel = 'vermelho'
                mensagem = 'Sinais sugestivos de pré-eclâmpsia. Procure UBS ou maternidade.'
                return {'nivel': nivel, 'mensagem': mensagem}

        if 'contrações regulares' in s:
            semanas = self._idade_gestacional_semanas(gestante.get('dum'))
            if semanas < 37:
                nivel = 'vermelho'
                mensagem = 'Contrações pré-termo. Procure atendimento imediato.'
                return {'nivel': nivel, 'mensagem': mensagem}

        if 'sangramento' in s or 'sangramento vaginal' in s:
            nivel = 'vermelho'
            mensagem = 'Sangramento detectado. Procure atendimento imediatamente.'
            return {'nivel': nivel, 'mensagem': mensagem}

        # checar EPDS sent via sintomas map (ex: 'epds:12')
        for item in s:
            if item.startswith('epds:'):
                try:
                    val = int(item.split(':',1)[1])
                    if val >= 13:
                        return {'nivel':'vermelho','mensagem':'EPDS >=13 — procure avaliação profissional.'}
                    if 10 <= val <= 12:
                        return {'nivel':'amarelo','mensagem':'EPDS entre 10 e 12 — monitoramento e acolhimento.'}
                except ValueError:
                    pass

        # default
        return {'nivel': nivel, 'mensagem': mensagem}
