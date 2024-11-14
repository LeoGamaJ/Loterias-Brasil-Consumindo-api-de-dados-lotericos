# Loterias Brasil: Consulta de Resultados de Loterias

Esta aplicação permite que os usuários consultem os últimos resultados, históricos e relatórios das principais loterias do Brasil.

## Funcionalidades

- **Consulta de Últimos Resultados**: Veja os números sorteados mais recentemente em diferentes tipos de loteria.
- **Histórico de Resultados**: Acesse os resultados passados de qualquer loteria selecionada.
- **Relatórios Estatísticos**: Gere relatórios que mostram a frequência de dezenas sorteadas e a distribuição de números pares e ímpares com visualização em gráficos.

## Tecnologias Utilizadas

- **Backend**: Flask (Python)
- **Frontend**: HTML, Bootstrap 5.3, JavaScript, Chart.js
- **API**: Integração com a API de loterias para obter dados em tempo real

## Como Executar a Aplicação

### Pré-requisitos

- Python 3.x
- pip (gerenciador de pacotes do Python)

### Passos para Configuração

1. **Clone o Repositório**
   ```bash
   git clone https://github.com/seu-usuario/loterias-brasil.git
   cd loterias-brasil
   ```

2. **Crie um Ambiente Virtual**
   ```bash
   python -m venv venv
   source venv/bin/activate  # No Windows use `venv\Scripts\activate`
   ```

3. **Instale as Dependências**
   ```bash
   pip install -r requirements.txt
   ```

4. **Execute o Servidor**
   ```bash
   flask run
   ```
   O aplicativo estará disponível em `http://127.0.0.1:5000`.

## Estrutura do Projeto

- `app.py`: Contém a lógica do backend em Flask.
- `templates/index.html`: Página HTML principal da aplicação.
- `static/css/style.css`: Estilos customizados.
- `static/js/scripts.js`: Lógica de interação no frontend e manipulação de gráficos.
- `requirements.txt`: Lista de dependências do Python.

## Possíveis Melhorias

- Implementar caching para melhorar o desempenho.
- Melhorar a acessibilidade da interface do usuário.
- Adicionar suporte a múltiplos idiomas (internacionalização).

## Contribuindo

Contribuições são bem-vindas! Se você tiver sugestões, melhorias ou correções, sinta-se à vontade para abrir um pull request ou relatar um problema.

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

---

Se você tiver alguma dúvida ou problema, por favor, entre em contato via [leo@leogama.cloud](mailto:leo@leogama.cloud)
