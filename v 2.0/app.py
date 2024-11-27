from flask import Flask, render_template, jsonify, request
import requests
from datetime import datetime
import json
from collections import defaultdict
import threading
import time

app = Flask(__name__)

# Cache para armazenar resultados
cache = {
    'resultados': {},
    'ultima_atualizacao': {},
    'estatisticas': defaultdict(dict)
}

def atualizar_cache():
    while True:
        for modalidade in ['megasena', 'lotofacil', 'quina', 'lotomania', 'timemania',
                          'duplasena', 'federal', 'diadesorte', 'supersete', 'maismilionaria']:
            try:
                resultado = consultar_modalidade(modalidade)
                if resultado:
                    cache['resultados'][modalidade] = resultado
                    cache['ultima_atualizacao'][modalidade] = datetime.now()
                    atualizar_estatisticas(modalidade, resultado)
            except Exception as e:
                print(f"Erro ao atualizar cache para {modalidade}: {str(e)}")
        time.sleep(300)  # Atualiza a cada 5 minutos

def atualizar_estatisticas(modalidade, resultado):
    if not resultado:
        return
    
    numeros = resultado.get('dezenas', [])
    stats = defaultdict(int)
    
    for numero in numeros:
        stats[numero] += 1
    
    cache['estatisticas'][modalidade] = {
        'numeros_frequentes': sorted(stats.items(), key=lambda x: x[1], reverse=True)[:10],
        'ultima_atualizacao': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    }

def consultar_modalidade(mod):
    url = f'https://loteriascaixa-api.herokuapp.com/api/{mod}/latest'
    try:
        req = requests.get(url, timeout=5)
        req.raise_for_status()
        return req.json()
    except Exception as e:
        print(f"Erro ao consultar API para {mod}: {str(e)}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/loteria/<modalidade>')
def get_loteria(modalidade):
    # Tenta pegar do cache primeiro
    if modalidade in cache['resultados']:
        ultima_atualizacao = cache['ultima_atualizacao'].get(modalidade)
        if ultima_atualizacao:
            tempo_decorrido = (datetime.now() - ultima_atualizacao).seconds
            if tempo_decorrido < 300:  # Se dados têm menos de 5 minutos
                return jsonify(cache['resultados'][modalidade])
    
    # Se não está no cache ou está desatualizado, consulta a API
    resultado = consultar_modalidade(modalidade)
    if resultado:
        cache['resultados'][modalidade] = resultado
        cache['ultima_atualizacao'][modalidade] = datetime.now()
        atualizar_estatisticas(modalidade, resultado)
        return jsonify(resultado)
    else:
        return jsonify({'error': 'Erro ao consultar a API'}), 500

@app.route('/api/estatisticas/<modalidade>')
def get_estatisticas(modalidade):
    try:
        # Verifica se a modalidade está em implementação
        modalidades_em_implementacao = ['timemania', 'federal', 'diadesorte', 'maismilionaria']
        if modalidade in modalidades_em_implementacao:
            return jsonify({
                'error': 'Estatísticas não disponíveis',
                'message': 'Serviço em implementação.'
            }), 503

        url = f'https://loteriascaixa-api.herokuapp.com/api/{modalidade}'
        req = requests.get(url, timeout=5)
        req.raise_for_status()
        data = req.json()
        
        if not isinstance(data, list):
            data = [data]
            
        # Define os intervalos baseado na modalidade
        if modalidade == 'lotofacil':
            max_numero = 25
            intervalos = {
                '01-05': 0, '06-10': 0, '11-15': 0,
                '16-20': 0, '21-25': 0
            }
        elif modalidade == 'quina':
            max_numero = 80
            intervalos = {
                '01-10': 0, '11-20': 0, '21-30': 0, '31-40': 0,
                '41-50': 0, '51-60': 0, '61-70': 0, '71-80': 0
            }
        elif modalidade == 'lotomania':
            max_numero = 100
            intervalos = {
                '01-10': 0, '11-20': 0, '21-30': 0, '31-40': 0,
                '41-50': 0, '51-60': 0, '61-70': 0, '71-80': 0,
                '81-90': 0, '91-100': 0
            }
        elif modalidade == 'supersete':
            max_numero = 9
            intervalos = None  # Não usar distribuição por dezenas
        else:  # megasena e outras
            max_numero = 60
            intervalos = {
                '01-10': 0, '11-20': 0, '21-30': 0,
                '31-40': 0, '41-50': 0, '51-60': 0
            }
            
        # Inicializa contadores
        numeros = defaultdict(int)
        total_concursos = 0
        total_pares = 0
        total_impares = 0
        
        # Processa cada concurso
        for concurso in data:
            if isinstance(concurso, dict) and 'dezenas' in concurso:
                dezenas = concurso['dezenas']
                if isinstance(dezenas, list):
                    total_concursos += 1
                    
                    # Conta pares e ímpares no concurso
                    pares_concurso = sum(1 for d in dezenas if int(d) % 2 == 0)
                    impares_concurso = len(dezenas) - pares_concurso
                    total_pares += pares_concurso
                    total_impares += impares_concurso
                    
                    # Contagem por dezena
                    for dezena in dezenas:
                        num = int(dezena)
                        numeros[str(dezena)] += 1
                        
                        # Classifica em intervalos (exceto para supersete)
                        if intervalos is not None:
                            if modalidade == 'lotofacil':
                                if 1 <= num <= 5:
                                    intervalos['01-05'] += 1
                                elif 6 <= num <= 10:
                                    intervalos['06-10'] += 1
                                elif 11 <= num <= 15:
                                    intervalos['11-15'] += 1
                                elif 16 <= num <= 20:
                                    intervalos['16-20'] += 1
                                elif 21 <= num <= 25:
                                    intervalos['21-25'] += 1
                            else:
                                intervalo_base = ((num - 1) // 10) * 10 + 1
                                intervalo_fim = min(intervalo_base + 9, max_numero)
                                chave = f'{intervalo_base:02d}-{intervalo_fim:02d}'
                                intervalos[chave] += 1
        
        if not numeros:
            return jsonify({'error': 'Não foi possível calcular as estatísticas'}), 500
                
        total_numeros = total_pares + total_impares
        
        # Prepara estatísticas detalhadas
        estatisticas_detalhadas = {
            'distribuicao_paridade': {
                'pares': {
                    'quantidade': total_pares,
                    'percentual': (total_pares / total_numeros * 100) if total_numeros > 0 else 0
                },
                'impares': {
                    'quantidade': total_impares,
                    'percentual': (total_impares / total_numeros * 100) if total_numeros > 0 else 0
                }
            },
            'max_numero': max_numero,
            'total_concursos': total_concursos
        }

        # Adiciona distribuição por dezenas apenas se não for supersete
        if intervalos is not None:
            estatisticas_detalhadas['distribuicao_dezenas'] = intervalos
        
        # Ordena números por frequência e depois por valor
        numeros_ordenados = sorted(
            [(dezena, freq) for dezena, freq in numeros.items()],
            key=lambda x: (-x[1], x[0])
        )
        
        return jsonify({
            'numeros': numeros_ordenados,
            'total_concursos': total_concursos,
            'estatisticas_detalhadas': estatisticas_detalhadas
        })
        
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Erro ao acessar a API: {str(e)}'}), 500
    except Exception as e:
        return jsonify({'error': f'Erro ao processar os dados: {str(e)}'}), 500

@app.route('/api/historico/<modalidade>')
def get_historico(modalidade):
    try:
        url = f'https://loteriascaixa-api.herokuapp.com/api/{modalidade}'
        req = requests.get(url, timeout=5)
        req.raise_for_status()
        data = req.json()
        
        # Verifica se data é uma lista
        if not isinstance(data, list):
            data = [data]  # Converte para lista se for um único objeto
            
        # Ordena por concurso em ordem decrescente
        data_ordenada = sorted(data, key=lambda x: x.get('concurso', 0), reverse=True)
        
        return jsonify(data_ordenada)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Inicia thread de atualização do cache
    threading.Thread(target=atualizar_cache, daemon=True).start()
    app.run(debug=True)
