# V 1.0

import requests
from tqdm import tqdm
import time
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph

def consultar_modalidade(mod, progress_bar):
    url = f'https://loteriascaixa-api.herokuapp.com/api/{mod}/latest'

    try:
        req = requests.get(url, timeout=3)
        req.raise_for_status()
        modalidades = req.json()
        return [modalidades["loteria"], modalidades["concurso"], modalidades["data"], modalidades["dezenas"],
                modalidades["acumulou"], modalidades["proximoConcurso"], modalidades["dataProximoConcurso"],
                modalidades["valorEstimadoProximoConcurso"]], None
    except requests.exceptions.RequestException as e:
        return None, f"Erro ao consultar {mod}: {e}"

def exibir_detalhes_erro(mod, erro):
    print(f"Erro ao consultar {mod}: {erro}")

def exibir_resultados(resultados):
    print("\nResultados das consultas:\n")

    for item in resultados:
        print(f"Loteria: {item[0]}\nConcurso: {item[1]}\nData: {item[2]}\nDezenas: {item[3]}\nAcumulou: {item[4]}\nPróximo concurso: {item[5]}\nData do próximo concurso : {item[6]}\nValor estimado do próximo concurso: R$ {item[7]:.0f}\n")
    print("Todas as consultas foram concluídas.")

def salvar_em_pdf(resultados):
    nome_arquivo = "resultados_loterias.pdf"

    doc = SimpleDocTemplate(nome_arquivo, pagesize=letter)
    styles = getSampleStyleSheet()

    story = []

    for item in resultados:
        texto = f"<b>Loteria:</b> {item[0]}<br/><b>Concurso:</b> {item[1]}<br/><b>Data:</b> {item[2]}<br/><b>Dezenas:</b> {', '.join(item[3])}<br/><b>Acumulou:</b> {item[4]}<br/><b>Próximo concurso:</b> {item[5]}<br/><b>Data do próximo concurso:</b> {item[6]}<br/><b>Valor estimado do próximo concurso:</b> R$ {item[7]:.0f}<br/><br/>"
        p = Paragraph(texto, styles["Normal"])
        story.append(p)

    doc.build(story)


    print(f"Os resultados foram salvos em: {nome_arquivo}")

def main():
    lista_modalidades = [
        "maismilionaria",
        "megasena",
        "lotofacil",
        "quina",
        "lotomania",
        "timemania",
        "duplasena",
        "federal",
        "diadesorte",
        "supersete"
    ]

    resultados = []
    erros = []

    with tqdm(total=len(lista_modalidades), desc="Consultas") as progress_bar:
        for mod in lista_modalidades:
            resultado, erro = consultar_modalidade(mod, progress_bar)
            if resultado:
                resultados.append(resultado)
            else:
                erros.append((mod, erro))
                exibir_detalhes_erro(mod, erro)
            progress_bar.update(1)
            time.sleep(1)  # Simula o tempo de consulta

        print("\n")

    if erros:
        opcao = input("Deseja tentar novamente as consultas que falharam? (S/N): ").lower()
        if opcao == "s":
            for mod, _ in erros:
                resultado, erro = consultar_modalidade(mod, None)
                if resultado:
                    resultados.append(resultado)
                else:
                    exibir_detalhes_erro(mod, erro)

    exibir_resultados(resultados)
    salvar_em_pdf(resultados)

if __name__ == "__main__":
    main()
