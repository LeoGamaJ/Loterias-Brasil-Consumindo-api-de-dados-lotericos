from flask import Flask, render_template, jsonify, request
from enum import Enum
from typing import List, Dict, Any, Optional
import requests
from datetime import datetime
from collections import Counter
from dataclasses import dataclass, field
import logging

# Configuração de logs
logging.basicConfig(level=logging.INFO)

app = Flask(__name__)

# Enum para os tipos de loteria
class TipoLoteria(Enum):
    DIA_DE_SORTE = "diadesorte"
    DUPLA_SENA = "duplasena"
    FEDERAL = "federal"
    LOTOFACIL = "lotofacil"
    LOTOMANIA = "lotomania"
    MAIS_MILIONARIA = "maismilionaria"
    MEGA_SENA = "megasena"
    QUINA = "quina"
    SUPER_SETE = "supersete"
    TIMEMANIA = "timemania"

# Classe para formatação dos resultados da loteria
@dataclass
class ResultadoLoteria:
    concurso: int
    loteria: str
    data: str
    data_proximo_concurso: str
    dezenas: List[str] = field(default_factory=list)
    dezenas_ordem_sorteio: List[str] = field(default_factory=list)
    acumulou: bool = False
    valor_acumulado: float = 0.0
    valor_estimado_proximo_concurso: float = 0.0
    local: str = 'N/A'
    mes_sorte: str = 'N/A'
    estados_premiados: List[Dict[str, Any]] = field(default_factory=list)
    local_ganhadores: List[Dict[str, Any]] = field(default_factory=list)
    observacao: str = 'N/A'
    premiacoes: List[Dict[str, Any]] = field(default_factory=list)
    valor_arrecadado: float = 0.0
    valor_acumulado_concurso_especial: float = 0.0
    valor_acumulado_concurso_0_5: float = 0.0
    time_coracao: str = 'N/A'
    trevos: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, dados: Dict[str, Any]) -> 'ResultadoLoteria':
        """Cria uma instância de ResultadoLoteria a partir de um dicionário."""
        return cls(
            concurso=dados.get('concurso', 0),
            loteria=dados.get('loteria', 'N/A'),
            data=cls._parse_data(dados.get('data', '')),
            data_proximo_concurso=cls._parse_data(dados.get('dataProximoConcurso', '')),
            dezenas=dados.get('dezenas', []),
            dezenas_ordem_sorteio=dados.get('dezenasOrdemSorteio', []),
            acumulou=dados.get('acumulou', False),
            valor_acumulado=dados.get('valorAcumulado', 0.0),
            valor_estimado_proximo_concurso=dados.get('valorEstimadoProximoConcurso', 0.0),
            local=dados.get('local', 'N/A'),
            mes_sorte=dados.get('mesSorte', 'N/A'),
            estados_premiados=dados.get('estadosPremiados', []),
            local_ganhadores=dados.get('localGanhadores', []),
            observacao=dados.get('observacao', 'N/A'),
            premiacoes=dados.get('premiacoes', []),
            valor_arrecadado=dados.get('valorArrecadado', 0.0),
            valor_acumulado_concurso_especial=dados.get('valorAcumuladoConcursoEspecial', 0.0),
            valor_acumulado_concurso_0_5=dados.get('valorAcumuladoConcurso_0_5', 0.0),
            time_coracao=dados.get('timeCoracao', 'N/A'),
            trevos=dados.get('trevos', [])
        )

    @staticmethod
    def _parse_data(data_str: str) -> str:
        """Converte string de data para um formato legível."""
        try:
            return datetime.strptime(data_str, '%d/%m/%Y').strftime('%d/%m/%Y')
        except ValueError:
            return 'N/A'

    def to_dict(self) -> Dict[str, Any]:
        """Retorna um dicionário formatado para exibição."""
        return {
            'concurso': self.concurso,
            'loteria': self.loteria,
            'data': self.data,
            'data_proximo_concurso': self.data_proximo_concurso,
            'dezenas': ', '.join(self.dezenas),
            'dezenas_ordem_sorteio': ', '.join(self.dezenas_ordem_sorteio),
            'acumulou': 'Sim' if self.acumulou else 'Não',
            'valor_acumulado': f"R$ {self.valor_acumulado:,.2f}",
            'valor_estimado_proximo': f"R$ {self.valor_estimado_proximo_concurso:,.2f}",
            'local': self.local,
            'mes_sorte': self.mes_sorte,
            'local_ganhadores': self.formatar_ganhadores(),
            'observacao': self.observacao,
            'premiacoes': self.premiacoes,
            'valor_arrecadado': f"R$ {self.valor_arrecadado:,.2f}",
            'valor_acumulado_concurso_especial': f"R$ {self.valor_acumulado_concurso_especial:,.2f}",
            'valor_acumulado_concurso_0_5': f"R$ {self.valor_acumulado_concurso_0_5:,.2f}",
            'time_coracao': self.time_coracao,
            'trevos': ', '.join(self.trevos),
        }

    def formatar_ganhadores(self) -> List[Dict[str, Any]]:
        """Formata os dados dos ganhadores por localidade."""
        return [
            {
                'municipio': g.get('municipio', 'N/A'),
                'uf': g.get('uf', 'N/A'),
                'ganhadores': g.get('ganhadores', 0)
            }
            for g in self.local_ganhadores
        ]

class LoteriasCaixaAPI:
    base_url = "https://loteriascaixa-api.herokuapp.com/api"

    def obter_ultimo_resultado(self, loteria: TipoLoteria) -> Optional[ResultadoLoteria]:
        """Consulta o último resultado de uma loteria específica."""
        url = f"{self.base_url}/{loteria.value}/latest"
        logging.info(f"Consultando último resultado para: {loteria.value}")
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            dados = response.json()
            return ResultadoLoteria.from_dict(dados)
        except requests.RequestException as e:
            logging.error(f"Erro ao acessar a API para {loteria.value}: {e}")
            return None

    def obter_todos_resultados(self, loteria: TipoLoteria) -> List[ResultadoLoteria]:
        """Consulta todos os resultados de uma loteria."""
        url = f"{self.base_url}/{loteria.value}"
        logging.info(f"Consultando todos os resultados para: {loteria.value}")
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            dados = response.json()
            return [ResultadoLoteria.from_dict(resultado) for resultado in dados]
        except requests.RequestException as e:
            logging.error(f"Erro ao acessar a API para {loteria.value}: {e}")
            return []

api = LoteriasCaixaAPI()

@app.route('/')
def index():
    """Rota para a página inicial."""
    return render_template('index.html', loterias=[l.value for l in TipoLoteria])

@app.route('/resultado', methods=['GET'])
def obter_resultado():
    """Rota para obter o último resultado de uma loteria."""
    loteria = request.args.get('loteria', '').lower()
    logging.info(f"Requisição de resultado para loteria: {loteria}")
    if loteria in [l.value for l in TipoLoteria]:
        tipo_loteria = TipoLoteria(loteria)
        resultado = api.obter_ultimo_resultado(tipo_loteria)
        if resultado:
            return jsonify(resultado.to_dict())
    return jsonify({'error': 'Loteria inválida ou resultado não encontrado'}), 404

@app.route('/todos-resultados', methods=['GET'])
def obter_todos_resultados():
    """Rota para obter todos os resultados de uma loteria."""
    loteria = request.args.get('loteria', '').lower()
    logging.info(f"Requisição de todos os resultados para loteria: {loteria}")
    if loteria in [l.value for l in TipoLoteria]:
        tipo_loteria = TipoLoteria(loteria)
        resultados = api.obter_todos_resultados(tipo_loteria)
        return jsonify([resultado.to_dict() for resultado in resultados])
    return jsonify({'error': 'Loteria inválida ou sem resultados'}), 404

@app.route('/relatorio', methods=['GET'])
def gerar_relatorio():
    """Rota para gerar um relatório estatístico das dezenas mais sorteadas."""
    loteria = request.args.get('loteria', '').lower()
    logging.info(f"Requisição de relatório para loteria: {loteria}")
    if loteria in [l.value for l in TipoLoteria]:
        tipo_loteria = TipoLoteria(loteria)
        resultados = api.obter_todos_resultados(tipo_loteria)
        if resultados:
            estatisticas = gerar_estatisticas_dezenas(resultados)
            estatisticas.update(gerar_estatisticas_pares_impares(resultados))
            return jsonify(estatisticas)
    return jsonify({'error': 'Loteria inválida ou sem dados para análise'}), 404

def gerar_estatisticas_dezenas(resultados: List[ResultadoLoteria]) -> Dict[str, Any]:
    """Gera estatísticas das dezenas mais sorteadas."""
    dezenas = [dezena for resultado in resultados for dezena in resultado.dezenas]
    estatisticas_dezenas = dict(Counter(dezenas))
    return {
        'frequencia_dezenas': estatisticas_dezenas
    }

def gerar_estatisticas_pares_impares(resultados: List[ResultadoLoteria]) -> Dict[str, Any]:
    """Gera estatísticas sobre a quantidade de números pares e ímpares sorteados."""
    pares = 0
    impares = 0
    for resultado in resultados:
        for dezena in resultado.dezenas:
            numero = int(dezena)
            if numero % 2 == 0:
                pares += 1
            else:
                impares += 1
    return {
        'pares': pares,
        'impares': impares
    }

if __name__ == '__main__':
    app.run(debug=True)