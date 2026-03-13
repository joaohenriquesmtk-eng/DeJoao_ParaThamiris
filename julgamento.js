// ==========================================
// JULGAMENTO DA SAFRA - COM ANIMAÇÕES E ÁUDIO
// ==========================================

(function() {
    // ========== VARIÁVEIS PRIVADAS ==========
    const tiposPecas = ['🌽', '⚖️', '🌱', '📜', '🔨', '🌻'];
    let grade = [];
    const linhas = 6;
    const colunas = 6;
    let pontuacao = 0;
    let nivel = 1;
    let meta = 100;
    let selecionada = null;
    let jogoAtivo = true;
    let processando = false; // Evita múltiplas animações simultâneas

    // ========== EFEITOS SONOROS ==========
    const somAcerto = new Audio('assets/sons/acerto.mp3');
    const somErro   = new Audio('assets/sons/erro.mp3');
    const somNivel  = new Audio('assets/sons/nivel.mp3');

    somAcerto.volume = 0.6;
    somErro.volume   = 0.6;
    somNivel.volume  = 0.7;

    somAcerto.load();
    somErro.load();
    somNivel.load();

    function tocarSom(som) {
        if (som) {
            som.currentTime = 0;
            som.play().catch(e => console.log('Áudio bloqueado:', e));
        }
    }

    // ========== FUNÇÕES AUXILIARES ==========
    function mostrarToast(mensagem) {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast(mensagem);
        } else {
            alert(mensagem);
        }
    }

    function gerarGradeAleatoria() {
        const novaGrade = [];
        for (let i = 0; i < linhas; i++) {
            novaGrade[i] = [];
            for (let j = 0; j < colunas; j++) {
                novaGrade[i][j] = tiposPecas[Math.floor(Math.random() * tiposPecas.length)];
            }
        }
        return novaGrade;
    }

    function renderizarGrade() {
        const gradeDiv = document.getElementById('julgamento-grade');
        if (!gradeDiv) {
            console.error('Elemento #julgamento-grade não encontrado!');
            return;
        }
        gradeDiv.innerHTML = '';
        for (let i = 0; i < linhas; i++) {
            for (let j = 0; j < colunas; j++) {
                const peca = document.createElement('div');
                peca.className = 'peca-julgamento';
                peca.dataset.linha = i;
                peca.dataset.coluna = j;
                peca.innerText = grade[i][j];
                peca.onclick = () => selecionarPeca(i, j);
                gradeDiv.appendChild(peca);
            }
        }
    }

    function atualizarInterface() {
        const nivelEl = document.getElementById('julgamento-nivel');
        const pontosEl = document.getElementById('julgamento-pontos');
        const metaEl = document.getElementById('julgamento-meta');
        if (nivelEl) nivelEl.innerText = nivel;
        if (pontosEl) pontosEl.innerText = pontuacao;
        if (metaEl) metaEl.innerText = meta;
    }

    function salvarJogo() {
        const dados = { grade, pontuacao, nivel, meta };
        localStorage.setItem('julgamento_safra', JSON.stringify(dados));
    }

    // ========== VERIFICAÇÃO DE JOGADAS POSSÍVEIS ==========
    function temJogadaPossivel() {
        for (let i = 0; i < linhas; i++) {
            for (let j = 0; j < colunas; j++) {
                // Troca com vizinho da direita
                if (j + 1 < colunas) {
                    const temp = grade[i][j];
                    grade[i][j] = grade[i][j+1];
                    grade[i][j+1] = temp;
                    if (verificarCombinacoes()) {
                        const temp2 = grade[i][j];
                        grade[i][j] = grade[i][j+1];
                        grade[i][j+1] = temp2;
                        return true;
                    }
                    const temp2 = grade[i][j];
                    grade[i][j] = grade[i][j+1];
                    grade[i][j+1] = temp2;
                }
                // Troca com vizinho de baixo
                if (i + 1 < linhas) {
                    const temp = grade[i][j];
                    grade[i][j] = grade[i+1][j];
                    grade[i+1][j] = temp;
                    if (verificarCombinacoes()) {
                        const temp2 = grade[i][j];
                        grade[i][j] = grade[i+1][j];
                        grade[i+1][j] = temp2;
                        return true;
                    }
                    const temp2 = grade[i][j];
                    grade[i][j] = grade[i+1][j];
                    grade[i+1][j] = temp2;
                }
            }
        }
        return false;
    }

    // ========== MECÂNICAS DO JOGO ==========
    function saoAdjacentes(a, b) {
        return (Math.abs(a.linha - b.linha) + Math.abs(a.coluna - b.coluna)) === 1;
    }

    function trocarPecas(a, b) {
        const temp = grade[a.linha][a.coluna];
        grade[a.linha][a.coluna] = grade[b.linha][b.coluna];
        grade[b.linha][b.coluna] = temp;
        renderizarGrade();
    }

    function verificarCombinacoes() {
        for (let i = 0; i < linhas; i++) {
            for (let j = 0; j < colunas - 2; j++) {
                if (grade[i][j] && grade[i][j] === grade[i][j+1] && grade[i][j] === grade[i][j+2]) {
                    return true;
                }
            }
        }
        for (let j = 0; j < colunas; j++) {
            for (let i = 0; i < linhas - 2; i++) {
                if (grade[i][j] && grade[i][j] === grade[i+1][j] && grade[i][j] === grade[i+2][j]) {
                    return true;
                }
            }
        }
        return false;
    }

    // Aplica gravidade SEM animação (interna, para o modelo)
    function aplicarGravidadeModelo() {
        for (let j = 0; j < colunas; j++) {
            const coluna = [];
            for (let i = 0; i < linhas; i++) {
                if (grade[i][j] !== null) {
                    coluna.push(grade[i][j]);
                }
            }
            for (let i = linhas - 1; i >= 0; i--) {
                if (coluna.length > 0) {
                    grade[i][j] = coluna.pop();
                } else {
                    grade[i][j] = null;
                }
            }
        }
    }

    // Preenche os nulls com novas peças (modelo)
    function preencherNovasPecasModelo() {
        for (let i = 0; i < linhas; i++) {
            for (let j = 0; j < colunas; j++) {
                if (grade[i][j] === null) {
                    grade[i][j] = tiposPecas[Math.floor(Math.random() * tiposPecas.length)];
                }
            }
        }
    }

    // Versão com animação de queda para as NOVAS peças
    function aplicarGravidadeEAnimar() {
        // Primeiro, aplicamos a gravidade normalmente (sem animação) no modelo
        aplicarGravidadeModelo();

        // Depois, ao renderizar, as peças que estão no topo (ou que mudaram) podem ganhar a classe 'nova'
        // Mas como a grade já foi atualizada, precisamos identificar quais peças são novas.
        // Uma abordagem simples: após aplicar gravidade e preencher novas peças, renderizamos e adicionamos 'nova' a todas as peças que acabaram de ser criadas.
        // No entanto, como não temos histórico, faremos o seguinte: após preencher, renderizamos e, em seguida, adicionamos a classe 'nova' a todas as peças.
        // Isso fará com que todas as peças recém-chegadas (e até mesmo as que caíram) ganhem a animação, o que é aceitável visualmente.
    }

    function processarCombinacoes() {
        if (processando) return; // Evita loops enquanto anima
        processando = true;

        let combinou = false;
        const animacoes = [];

        // Identifica todas as combinações
        const removerSet = new Set();

        // Linhas
        for (let i = 0; i < linhas; i++) {
            for (let j = 0; j < colunas - 2; j++) {
                if (grade[i][j] && grade[i][j] === grade[i][j+1] && grade[i][j] === grade[i][j+2]) {
                    let k = j;
                    while (k < colunas && grade[i][k] === grade[i][j]) {
                        removerSet.add(`${i},${k}`);
                        k++;
                    }
                    combinou = true;
                }
            }
        }
        // Colunas
        for (let j = 0; j < colunas; j++) {
            for (let i = 0; i < linhas - 2; i++) {
                if (grade[i][j] && grade[i][j] === grade[i+1][j] && grade[i][j] === grade[i+2][j]) {
                    let k = i;
                    while (k < linhas && grade[k][j] === grade[i][j]) {
                        removerSet.add(`${k},${j}`);
                        k++;
                    }
                    combinou = true;
                }
            }
        }

        if (!combinou) {
            processando = false;
            return;
        }

        tocarSom(somAcerto); // 🔊 Som de acerto

        const paraRemover = Array.from(removerSet).map(coord => {
            const [l, c] = coord.split(',').map(Number);
            return { linha: l, coluna: c };
        });

        // Aplica animação de "removendo" nas peças
        paraRemover.forEach(pos => {
            const pecaEl = document.querySelector(`.peca-julgamento[data-linha="${pos.linha}"][data-coluna="${pos.coluna}"]`);
            if (pecaEl) {
                pecaEl.classList.add('removendo');
            }
        });

        // Aguarda a animação (300ms) e então remove as peças do modelo e aplica gravidade
        setTimeout(() => {
            // Remove as peças do modelo (marca como null)
            paraRemover.forEach(pos => {
                grade[pos.linha][pos.coluna] = null;
            });

            pontuacao += paraRemover.length * 10;

            // Aplica gravidade e preenche novas peças (modelo)
            aplicarGravidadeModelo();
            preencherNovasPecasModelo();

            // Verifica se atingiu meta
            if (pontuacao >= meta) {
                nivel++;
                meta = Math.floor(meta * 1.5);
                pontuacao = 0;
                tocarSom(somNivel);
                mostrarToast(`🥳 Nível ${nivel}!`);
            }

            atualizarInterface();
            salvarJogo();

            // Renderiza a grade (agora com as novas peças)
            renderizarGrade();

            // Adiciona animação de queda nas novas peças (todas as que estão na grade podem ganhar 'nova', mas para evitar excesso, podemos adicionar apenas nas que estão no topo? Na prática, todas as peças recém-chegadas estão em posições que podem ter mudado. Vamos adicionar 'nova' em todas e remover após a animação)
            document.querySelectorAll('.peca-julgamento').forEach(el => {
                el.classList.add('nova');
                setTimeout(() => {
                    el.classList.remove('nova');
                }, 400); // duração da animação 'cairMola'
            });

            // Verifica se ainda há combinações (chama novamente)
            if (verificarCombinacoes()) {
                processarCombinacoes(); // recursivo
            } else {
                processando = false;
                // Verifica se há jogadas possíveis, senão reembaralha
                if (!temJogadaPossivel()) {
                    grade = gerarGradeAleatoria();
                    mostrarToast("🌀 Grade reembaralhada!");
                    renderizarGrade();
                    salvarJogo();
                }
            }
        }, 300); // tempo da animação de remoção
    }

    function selecionarPeca(linha, coluna) {
        if (!jogoAtivo || processando) return; // bloqueia durante animações

        if (selecionada === null) {
            selecionada = { linha, coluna };
            document.querySelector(`.peca-julgamento[data-linha="${linha}"][data-coluna="${coluna}"]`).classList.add('selecionada');
        } else {
            const primeira = selecionada;
            const segunda = { linha, coluna };
            if (saoAdjacentes(primeira, segunda)) {
                trocarPecas(primeira, segunda);
                if (verificarCombinacoes()) {
                    processarCombinacoes();
                } else {
                    trocarPecas(primeira, segunda); // desfaz
                    tocarSom(somErro);
                    mostrarToast("❌ Sem combinação!");
                }
            } else {
                tocarSom(somErro);
                mostrarToast("❌ Escolha uma peça adjacente!");
            }
            document.querySelectorAll('.peca-julgamento').forEach(p => p.classList.remove('selecionada'));
            selecionada = null;
        }
    }

    function reiniciarJogo() {
        if (confirm('Reiniciar o jogo? Todo progresso será perdido.')) {
            localStorage.removeItem('julgamento_safra');
            grade = gerarGradeAleatoria();
            pontuacao = 0;
            nivel = 1;
            meta = 100;
            atualizarInterface();
            renderizarGrade();
            salvarJogo();
        }
    }

    function novoCaso() {
        if (confirm('Iniciar novo caso? A pontuação atual será perdida.')) {
            grade = gerarGradeAleatoria();
            pontuacao = 0;
            renderizarGrade();
            atualizarInterface();
            salvarJogo();
        }
    }

    function inicializarJulgamento() {
        console.log('Inicializando Julgamento da Safra');
        const salvo = localStorage.getItem('julgamento_safra');
        if (salvo) {
            try {
                const dados = JSON.parse(salvo);
                grade = dados.grade;
                pontuacao = dados.pontuacao;
                nivel = dados.nivel;
                meta = dados.meta;
                if (!grade || grade.length !== linhas) grade = gerarGradeAleatoria();
            } catch (e) {
                console.warn('Erro ao carregar dados, gerando nova grade', e);
                grade = gerarGradeAleatoria();
            }
        } else {
            grade = gerarGradeAleatoria();
        }
        atualizarInterface();
        renderizarGrade();
    }

    // ========== EXPOR FUNÇÕES GLOBAIS ==========
    window.toggleInstrucoesJulgamento = function() {
        const el = document.getElementById('instrucoes-julgamento');
        if (el) el.classList.toggle('escondido');
    };

    window.iniciarJulgamento = function() {
        console.log('Iniciando Julgamento da Safra');
        inicializarJulgamento();

        const btnNovo = document.getElementById('julgamento-btn-novo');
        if (btnNovo) {
            const novoBtn = btnNovo.cloneNode(true);
            btnNovo.parentNode.replaceChild(novoBtn, btnNovo);
            novoBtn.addEventListener('click', novoCaso);
        }

        const btnReiniciar = document.getElementById('julgamento-btn-reiniciar');
        if (btnReiniciar) {
            const novoReiniciar = btnReiniciar.cloneNode(true);
            btnReiniciar.parentNode.replaceChild(novoReiniciar, btnReiniciar);
            novoReiniciar.addEventListener('click', reiniciarJogo);
        }
    };
})();