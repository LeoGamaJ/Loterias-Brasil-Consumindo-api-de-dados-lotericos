// Função para inicializar eventos ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    configurarEventos();
});

function configurarEventos() {
    const form = document.getElementById('consulta-form');
    const historicoBtn = document.getElementById('historico-btn');
    const relatorioBtn = document.getElementById('relatorio-btn');

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        const loteria = obterLoteriaSelecionada();
        if (loteria) {
            buscarResultado(loteria);
        }
    });

    historicoBtn.addEventListener('click', function () {
        const loteria = obterLoteriaSelecionada();
        if (loteria) {
            buscarHistorico(loteria);
        }
    });

    relatorioBtn.addEventListener('click', function () {
        const loteria = obterLoteriaSelecionada();
        if (loteria) {
            gerarRelatorio(loteria);
        }
    });
}

// Função para obter a loteria selecionada no formulário
function obterLoteriaSelecionada() {
    const loteriaSelect = document.getElementById('loteria-select');
    const loteria = loteriaSelect.value.trim();

    // Validação adicional
    if (!loteria) {
        exibirMensagem('Por favor, selecione uma loteria.', 'warning');
        return null;
    }

    // Validação de opções válidas
    const opcoesValidas = [
        'diadesorte', 'duplasena', 'federal', 'lotofacil', 'lotomania', 
        'maismilionaria', 'megasena', 'quina', 'supersete', 'timemania'
    ];
    if (!opcoesValidas.includes(loteria.toLowerCase())) {
        exibirMensagem('Loteria inválida. Por favor, selecione uma opção válida.', 'danger');
        return null;
    }

    return loteria;
}

// Função para buscar o último resultado
async function buscarResultado(loteria) {
    mostrarLoading(true);
    try {
        console.log(`Buscando resultado para: ${loteria}`); // Log para debug
        const response = await fetch(`/resultado?loteria=${encodeURIComponent(loteria)}`);
        const data = await response.json();

        mostrarLoading(false);
        
        // Verificar se a resposta contém um erro
        if (response.ok) {
            if (data.error || !data.concurso) {
                exibirMensagem('Loteria inválida ou resultado não encontrado.', 'danger');
            } else {
                exibirResultado(data);
            }
        } else {
            exibirMensagem(`Erro ${response.status}: ${data.message}`, 'danger');
        }
    } catch (error) {
        mostrarLoading(false);
        exibirMensagem('Erro ao buscar os dados. Tente novamente mais tarde.', 'danger');
        console.error('Erro na busca do resultado:', error); // Log para debug
    }
}

// Função para buscar histórico de resultados
async function buscarHistorico(loteria) {
    mostrarLoading(true);
    try {
        console.log(`Buscando histórico para: ${loteria}`); // Log para debug
        const response = await fetch(`/todos-resultados?loteria=${encodeURIComponent(loteria)}`);
        const data = await response.json();

        mostrarLoading(false);

        if (response.ok) {
            if (data.error || data.length === 0) {
                exibirMensagem('Histórico não encontrado para esta loteria.', 'warning');
            } else {
                exibirHistorico(data);
            }
        } else {
            exibirMensagem(`Erro ${response.status}: ${data.message}`, 'danger');
        }
    } catch (error) {
        mostrarLoading(false);
        exibirMensagem('Erro ao buscar histórico. Tente novamente mais tarde.', 'danger');
        console.error('Erro na busca do histórico:', error); // Log para debug
    }
}

// Função para gerar relatório estatístico
async function gerarRelatorio(loteria) {
    mostrarLoading(true);
    try {
        console.log(`Gerando relatório para: ${loteria}`); // Log para debug
        const response = await fetch(`/relatorio?loteria=${encodeURIComponent(loteria)}`);
        const data = await response.json();

        mostrarLoading(false);

        if (response.ok) {
            if (data.error || Object.keys(data).length === 0) {
                exibirMensagem('Nenhum dado disponível para o relatório.', 'warning');
            } else {
                exibirRelatorio(data);
            }
        } else {
            exibirMensagem(`Erro ${response.status}: ${data.message}`, 'danger');
        }
    } catch (error) {
        mostrarLoading(false);
        exibirMensagem('Erro ao gerar o relatório. Tente novamente mais tarde.', 'danger');
        console.error('Erro na geração do relatório:', error); // Log para debug
    }
}

// Função para exibir o resultado
function exibirResultado(data) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
        <div class="card mt-4">
            <div class="card-header bg-success text-white">
                Resultado do Concurso ${data.concurso}
            </div>
            <div class="card-body">
                <p><strong>Loteria:</strong> ${data.loteria.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Data do Concurso:</strong> ${data.data}</p>
                <p><strong>Dezenas Sorteadas:</strong> ${data.dezenas}</p>
                <p><strong>Acumulou:</strong> ${data.acumulou}</p>
                <p><strong>Próximo Concurso:</strong> ${data.data_proximo_concurso}</p>
                <p><strong>Valor Estimado:</strong> ${data.valor_estimado_proximo}</p>
                <p><strong>Local:</strong> ${data.local}</p>
                <p><strong>Mês da Sorte:</strong> ${data.mes_sorte}</p>
                <p><strong>Observação:</strong> ${data.observacao}</p>
                <p><strong>Valor Arrecadado:</strong> ${data.valor_arrecadado}</p>
                <p><strong>Valor Acumulado Concurso Especial:</strong> ${data.valor_acumulado_concurso_especial}</p>
                <p><strong>Valor Acumulado (0-5):</strong> ${data.valor_acumulado_concurso_0_5}</p>
                <p><strong>Time do Coração:</strong> ${data.time_coracao}</p>
                <p><strong>Trevos:</strong> ${data.trevos}</p>
                <h5>Premiações:</h5>
                <ul>
                    ${data.premiacoes.map(p => `<li>${p.descricao}: ${p.ganhadores} ganhadores, R$${p.valorPremio.toFixed(2)}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

// Função para exibir o histórico de resultados
function exibirHistorico(data) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = data.map((resultado) => `
        <div class="card mt-4">
            <div class="card-header bg-secondary text-white">
                Concurso ${resultado.concurso}
            </div>
            <div class="card-body">
                <p><strong>Loteria:</strong> ${resultado.loteria.replace('_', ' ').toUpperCase()}</p>
                <p><strong>Data do Concurso:</strong> ${resultado.data}</p>
                <p><strong>Dezenas Sorteadas:</strong> ${resultado.dezenas}</p>
            </div>
        </div>
    `).join('');
}

// Função para exibir o relatório estatístico e gráficos
function exibirRelatorio(data) {
    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
        <div class="card mt-4">
            <div class="card-header bg-info text-white">
                Relatório Estatístico
            </div>
            <div class="card-body">
                <ul>
                    ${Object.entries(data.frequencia_dezenas).map(([dezena, quantidade]) => `<li>${dezena}: ${quantidade} vezes</li>`).join('')}
                </ul>
                <p><strong>Pares:</strong> ${data.pares}</p>
                <p><strong>Ímpares:</strong> ${data.impares}</p>
            </div>
        </div>
    `;

    // Exibir gráficos
    const chartContainer = document.getElementById('chart-container');
    chartContainer.style.display = 'block';

    const ctxDezenas = document.getElementById('chartDezenas').getContext('2d');
    const ctxParesImpares = document.getElementById('chartParesImpares').getContext('2d');

    new Chart(ctxDezenas, {
        type: 'bar',
        data: {
            labels: Object.keys(data.frequencia_dezenas),
            datasets: [{
                label: 'Frequência das Dezenas',
                data: Object.values(data.frequencia_dezenas),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    new Chart(ctxParesImpares, {
        type: 'pie',
        data: {
            labels: ['Pares', 'Ímpares'],
            datasets: [{
                label: 'Distribuição de Pares e Ímpares',
                data: [data.pares, data.impares],
                backgroundColor: ['rgba(75, 192, 192, 0.6)', 'rgba(255, 99, 132, 0.6)'],
                borderColor: ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'],
                borderWidth: 1
            }]
        }
    });
}

// Função para exibir a mensagem de erro ou sucesso
function exibirMensagem(mensagem, tipo) {
    const mensagemErro = document.getElementById('mensagem-erro');
    mensagemErro.className = `alert alert-${tipo}`;
    mensagemErro.textContent = mensagem;
    mensagemErro.classList.remove('d-none');
}

// Função para mostrar ou esconder o spinner de loading
function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    loading.style.display = mostrar ? 'block' : 'none';
}