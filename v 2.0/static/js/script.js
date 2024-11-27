document.addEventListener('DOMContentLoaded', () => {
    const loteriasMenu = document.getElementById('loteriasMenu');
    const loading = document.getElementById('loading');
    const resultado = document.getElementById('resultado');
    const historico = document.getElementById('historico');
    const estatisticas = document.getElementById('estatisticas');
    let loteriaAtual = '';

    const cores = {
        'megasena': '#209869',
        'lotofacil': '#930089',
        'quina': '#260085',
        'lotomania': '#F78100',
        'timemania': '#00FF48',
        'duplasena': '#A61324',
        'federal': '#0B2F3F',
        'loteca': '#DD1F2D',
        'supersete': '#A8CF45',
        'diadesorte': '#BFAF83',
        'maismilionaria': '#DEBB00'
    };

    // Variáveis globais para os gráficos
    let graficoFrequencia = null;
    let graficoParidade = null;
    let graficoDezenas = null;

    const consultarLoteria = async (modalidade) => {
        try {
            loading.classList.remove('d-none');
            resultado.classList.add('d-none');
            historico.classList.add('d-none');
            estatisticas.classList.add('d-none');
            
            loteriaAtual = modalidade;
            const response = await fetch(`/api/loteria/${modalidade}`);
            
            if (!response.ok) {
                throw new Error('Erro ao consultar a API');
            }
            
            const data = await response.json();
            
            if (data.erro) {
                throw new Error(data.erro);
            }
            
            preencherResultado(data);
            resultado.classList.remove('d-none');
            
        } catch (error) {
            console.error('Erro:', error);
            resultado.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    ${error.message}
                </div>`;
            resultado.classList.remove('d-none');
        } finally {
            loading.classList.add('d-none');
        }
    };

    const consultarHistorico = async () => {
        try {
            loading.classList.remove('d-none');
            const response = await fetch(`/api/historico/${loteriaAtual}`);
            
            if (!response.ok) {
                throw new Error('Erro ao consultar histórico');
            }
            
            const data = await response.json();
            
            if (data.erro) {
                throw new Error(data.erro);
            }
            
            preencherHistorico(data);
            historico.classList.remove('d-none');
            
        } catch (error) {
            console.error('Erro:', error);
            historico.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    ${error.message}
                </div>`;
            historico.classList.remove('d-none');
        } finally {
            loading.classList.add('d-none');
        }
    };

    const carregarEstatisticas = async () => {
        try {
            loading.classList.remove('d-none');
            const estatisticasDiv = document.getElementById('estatisticas');
            estatisticasDiv.classList.add('d-none');
            document.getElementById('mensagemEstatisticas').style.display = 'none';

            const response = await fetch(`/api/estatisticas/${loteriaAtual}`);
            const data = await response.json();

            if (response.status === 503) {
                // Modalidade em implementação
                document.getElementById('mensagemEstatisticas').innerHTML = `
                    <div class="alert alert-info" role="alert">
                        <h4 class="alert-heading">Estatísticas não disponíveis</h4>
                        <p>O serviço de estatísticas para esta modalidade está em implementação.</p>
                    </div>`;
                document.getElementById('mensagemEstatisticas').style.display = 'block';
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar estatísticas');
            }

            // Limpar gráficos existentes
            if (graficoFrequencia instanceof Chart) {
                graficoFrequencia.destroy();
                graficoFrequencia = null;
            }
            if (graficoParidade instanceof Chart) {
                graficoParidade.destroy();
                graficoParidade = null;
            }
            if (graficoDezenas instanceof Chart) {
                graficoDezenas.destroy();
                graficoDezenas = null;
            }

            const estatisticas = data.estatisticas_detalhadas;
            const dadosParidade = estatisticas.distribuicao_paridade;
            const maxNumero = estatisticas.max_numero;
            const cor = cores[loteriaAtual];

            // Atualizar o total de concursos
            document.getElementById('totalConcursos').textContent = estatisticas.total_concursos || 0;

            // Gráfico de frequência dos números
            const labels = [];
            const frequencias = [];
            const backgroundColors = [];
            const borderColors = [];

            // Criar array com todos os números possíveis
            for (let i = 1; i <= maxNumero; i++) {
                const numeroFormatado = i.toString().padStart(2, '0');
                labels.push(numeroFormatado);
                
                // Procurar a frequência do número nos dados
                const numeroEncontrado = data.numeros.find(([num]) => parseInt(num) === i);
                frequencias.push(numeroEncontrado ? numeroEncontrado[1] : 0);
                
                backgroundColors.push(cor + '80'); // 50% de opacidade
                borderColors.push(cor);
            }

            // Mostrar a div de estatísticas antes de criar os gráficos
            estatisticasDiv.classList.remove('d-none');

            // Configuração do gráfico de frequência
            const ctxFreq = document.getElementById('graficoFrequencia');
            if (ctxFreq) {
                graficoFrequencia = new Chart(ctxFreq, {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [{
                            label: 'Frequência',
                            data: frequencias,
                            backgroundColor: backgroundColors,
                            borderColor: borderColors,
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }

            // Gráfico de Paridade
            const ctxParidade = document.getElementById('graficoParidade');
            if (ctxParidade) {
                graficoParidade = new Chart(ctxParidade, {
                    type: 'doughnut',
                    data: {
                        labels: ['Pares', 'Ímpares'],
                        datasets: [{
                            data: [
                                dadosParidade.pares.quantidade,
                                dadosParidade.impares.quantidade
                            ],
                            backgroundColor: [cor + '80', cor],
                            borderColor: [cor, cor],
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }

            // Gráfico de Distribuição por Dezenas (exceto para Super Sete)
            const containerDezenas = document.getElementById('containerGraficoDezenas');
            if (loteriaAtual === 'supersete') {
                containerDezenas.style.display = 'none';
            } else {
                containerDezenas.style.display = 'block';
                const ctxDezenas = document.getElementById('graficoDezenas');
                if (ctxDezenas) {
                    graficoDezenas = new Chart(ctxDezenas, {
                        type: 'bar',
                        data: {
                            labels: Object.keys(estatisticas.distribuicao_dezenas),
                            datasets: [{
                                label: 'Quantidade',
                                data: Object.values(estatisticas.distribuicao_dezenas),
                                backgroundColor: backgroundColors.slice(0, Object.keys(estatisticas.distribuicao_dezenas).length),
                                borderColor: borderColors.slice(0, Object.keys(estatisticas.distribuicao_dezenas).length),
                                borderWidth: 1
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true
                                }
                            }
                        }
                    });
                }
            }

            // Atualiza informações adicionais
            document.getElementById('numerosPares').textContent = 
                `${dadosParidade.pares.quantidade} (${dadosParidade.pares.percentual.toFixed(1)}%)`;
            document.getElementById('numerosImpares').textContent = 
                `${dadosParidade.impares.quantidade} (${dadosParidade.impares.percentual.toFixed(1)}%)`;

        } catch (error) {
            console.error('Erro:', error);
            document.getElementById('mensagemEstatisticas').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    <h4 class="alert-heading">Erro ao carregar estatísticas</h4>
                    <p>${error.message}</p>
                </div>`;
            document.getElementById('mensagemEstatisticas').style.display = 'block';
        } finally {
            loading.classList.add('d-none');
        }
    };

    // Função para formatar valores monetários
    const formatarValorMonetario = (valor) => {
        if (!valor) return 'R$ 0,00';
        
        // Converte para número se for string
        let valorNumerico = typeof valor === 'string' ? 
            parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.')) : 
            parseFloat(valor);

        // Se não for um número válido, retorna zero formatado
        if (isNaN(valorNumerico)) return 'R$ 0,00';

        // Formata o número para o padrão brasileiro
        return valorNumerico.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const preencherResultado = (data) => {
        document.getElementById('tituloLoteria').textContent = data.nome;
        document.getElementById('concurso').textContent = data.concurso;
        document.getElementById('data').textContent = data.data;
        document.getElementById('local').textContent = data.local || 'Não informado';
        document.getElementById('acumulou').textContent = data.acumulou ? 'Sim' : 'Não';
        document.getElementById('proximoConcurso').textContent = data.proximoConcurso;
        document.getElementById('dataProximoConcurso').textContent = data.dataProximoConcurso;
        document.getElementById('valorEstimado').textContent = formatarValorMonetario(data.valorEstimadoProximoConcurso);
        document.getElementById('valorAcumulado').textContent = formatarValorMonetario(data.valorAcumuladoProximoConcurso);
        document.getElementById('valorArrecadado').textContent = formatarValorMonetario(data.valorArrecadado);
        document.getElementById('observacao').textContent = data.observacao || 'Nenhuma observação';

        // Preencher premiações
        const premiacoesBody = document.getElementById('premiacoesBody');
        premiacoesBody.innerHTML = '';
        if (data.premiacoes && data.premiacoes.length > 0) {
            data.premiacoes.forEach(premiacao => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${premiacao.descricao}</td>
                    <td>${premiacao.ganhadores}</td>
                    <td>${formatarValorMonetario(premiacao.valorPremio)}</td>
                `;
                premiacoesBody.appendChild(tr);
            });
        } else {
            premiacoesBody.innerHTML = '<tr><td colspan="3" class="text-center">Nenhuma premiação disponível</td></tr>';
        }

        const dezenasContainer = document.getElementById('dezenas');
        dezenasContainer.innerHTML = '';
        
        data.dezenas.forEach(dezena => {
            const span = document.createElement('span');
            span.className = 'dezena';
            span.textContent = dezena;
            dezenasContainer.appendChild(span);
        });
    };

    const preencherHistorico = (data) => {
        const tbody = document.getElementById('historicoBody');
        tbody.innerHTML = '';

        // Pega os 10 concursos mais recentes
        const concursos = data.slice(0, 10);

        concursos.forEach(concurso => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${concurso.concurso}</td>
                <td>${concurso.data}</td>
                <td>${concurso.dezenas.join(', ')}</td>
                <td>${concurso.acumulou ? 'Sim' : 'Não'}</td>
            `;
            tbody.appendChild(tr);
        });
    };

    loteriasMenu.addEventListener('click', (event) => {
        if (event.target.matches('[data-loteria]')) {
            const modalidade = event.target.dataset.loteria;
            
            document.querySelectorAll('[data-loteria]').forEach(btn => {
                btn.classList.remove('active');
            });
            
            event.target.classList.add('active');
            consultarLoteria(modalidade);
        }
    });

    document.getElementById('btnEstatisticas').addEventListener('click', () => {
        if (loteriaAtual) {
            resultado.classList.add('d-none');
            historico.classList.add('d-none');
            carregarEstatisticas();
        }
    });

    document.getElementById('btnHistorico').addEventListener('click', () => {
        if (loteriaAtual) {
            resultado.classList.add('d-none');
            estatisticas.classList.add('d-none');
            consultarHistorico();
        }
    });

    // Consulta a Mega-Sena por padrão ao carregar a página
    document.querySelector('[data-loteria="megasena"]').click();
});
