// ==========================================
// JULGAMENTO DA SAFRA - MOTOR BLINDADO E COM VIBRAÇÃO
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
    let processando = false; 

    // ========== EFEITOS SONOROS ==========
    const somAcerto = new Audio('assets/sons/acerto.mp3');
    const somNivel  = new Audio('assets/sons/nivel.mp3');

    somAcerto.volume = 0.6;
    somNivel.volume  = 0.7;

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
        if (!gradeDiv) return;
        
        gradeDiv.innerHTML = '';
        for (let i = 0; i < linhas; i++) {
            for (let j = 0; j < colunas; j++) {
                const peca = document.createElement('div');
                peca.className = 'peca-julgamento';
                peca.dataset.linha = i;
                peca.dataset.coluna = j;
                peca.innerText = grade[i][j] || '';
                
                if (grade[i][j] === null) {
                    peca.style.transform = 'scale(0)';
                    peca.style.opacity = '0';
                    peca.style.transition = 'all 0.2s';
                }
                
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
                if (j + 1 < colunas) {
                    const temp = grade[i][j];
                    grade[i][j] = grade[i][j+1];
                    grade[i][j+1] = temp;
                    if (verificarCombinacoes()) {
                        grade[i][j+1] = grade[i][j];
                        grade[i][j] = temp;
                        return true;
                    }
                    grade[i][j+1] = grade[i][j];
                    grade[i][j] = temp;
                }
                if (i + 1 < linhas) {
                    const temp = grade[i][j];
                    grade[i][j] = grade[i+1][j];
                    grade[i+1][j] = temp;
                    if (verificarCombinacoes()) {
                        grade[i+1][j] = grade[i][j];
                        grade[i][j] = temp;
                        return true;
                    }
                    grade[i+1][j] = grade[i][j];
                    grade[i][j] = temp;
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
                if (grade[i][j] && grade[i][j] === grade[i][j+1] && grade[i][j] === grade[i][j+2]) return true;
            }
        }
        for (let j = 0; j < colunas; j++) {
            for (let i = 0; i < linhas - 2; i++) {
                if (grade[i][j] && grade[i][j] === grade[i+1][j] && grade[i][j] === grade[i+2][j]) return true;
            }
        }
        return false;
    }

    function aplicarGravidadeModelo() {
        for (let j = 0; j < colunas; j++) {
            const coluna = [];
            for (let i = 0; i < linhas; i++) {
                if (grade[i][j] !== null) coluna.push(grade[i][j]);
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

    function preencherNovasPecasModelo() {
        for (let i = 0; i < linhas; i++) {
            for (let j = 0; j < colunas; j++) {
                if (grade[i][j] === null) {
                    grade[i][j] = tiposPecas[Math.floor(Math.random() * tiposPecas.length)];
                }
            }
        }
    }

    function resolverCombinacoesSemAnimacao() {
        let combinou = true;
        while (combinou) {
            combinou = false;
            const removerSet = new Set();

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

            if (!combinou) break;

            const paraRemover = Array.from(removerSet).map(coord => {
                const [l, c] = coord.split(',').map(Number);
                return { linha: l, coluna: c };
            });

            paraRemover.forEach(pos => {
                grade[pos.linha][pos.coluna] = null;
            });

            pontuacao += paraRemover.length * 10;
            aplicarGravidadeModelo();
            preencherNovasPecasModelo();

            while (pontuacao >= meta) {
                nivel++;
                meta = Math.floor(meta * 1.5);
                pontuacao = 0;
            }
        }
        atualizarInterface();
        salvarJogo();
    }

    function processarCombinacoes() {
        // Agora verificamos, mas o jogo sempre libera a trava antes de recursões
        if (processando) return; 
        processando = true;

        let combinou = false;
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

        tocarSom(somAcerto); 

        const paraRemover = Array.from(removerSet).map(coord => {
            const [l, c] = coord.split(',').map(Number);
            return { linha: l, coluna: c };
        });

        paraRemover.forEach(pos => {
            const pecaEl = document.querySelector(`.peca-julgamento[data-linha="${pos.linha}"][data-coluna="${pos.coluna}"]`);
            if (pecaEl) pecaEl.classList.add('removendo');
        });

        setTimeout(() => {
            paraRemover.forEach(pos => {
                grade[pos.linha][pos.coluna] = null;
            });

            pontuacao += paraRemover.length * 10;

            aplicarGravidadeModelo();
            preencherNovasPecasModelo();

            if (pontuacao >= meta) {
                nivel++;
                meta = Math.floor(meta * 1.5);
                pontuacao = 0;
                tocarSom(somNivel);
                mostrarToast(`🥳 Nível ${nivel}!`);
            }

            atualizarInterface();
            salvarJogo();
            renderizarGrade();

            document.querySelectorAll('.peca-julgamento').forEach(el => {
                el.classList.add('nova');
                setTimeout(() => el.classList.remove('nova'), 400); 
            });

            if (verificarCombinacoes()) {
                // A SOLUÇÃO DO CONGELAMENTO: Libera a trava explicitamente antes da próxima chamada em cascata!
                processando = false; 
                setTimeout(processarCombinacoes, 400); // Dá um fôlego para as peças caírem na tela
            } else {
                processando = false;
                if (!temJogadaPossivel()) {
                    grade = gerarGradeAleatoria();
                    mostrarToast("🌀 Grade reembaralhada!");
                    renderizarGrade();
                    salvarJogo();
                }
            }
        }, 300); 
    }

    function selecionarPeca(linha, coluna) {
        if (!jogoAtivo || processando || grade[linha][coluna] === null) return; 

        if (selecionada === null) {
            selecionada = { linha, coluna };
            document.querySelector(`.peca-julgamento[data-linha="${linha}"][data-coluna="${coluna}"]`).classList.add('selecionada');
        } else {
            const primeira = selecionada;
            const segunda = { linha, coluna };
            
            // Remove a seleção visual
            document.querySelectorAll('.peca-julgamento').forEach(p => p.classList.remove('selecionada'));
            selecionada = null;

            if (saoAdjacentes(primeira, segunda)) {
                trocarPecas(primeira, segunda);
                
                if (verificarCombinacoes()) {
                    processarCombinacoes();
                } else {
                    processando = true;
                    
                    // Vibração visual (CSS) nas DUAS peças da troca inválida
                    const p1 = document.querySelector(`.peca-julgamento[data-linha="${primeira.linha}"][data-coluna="${primeira.coluna}"]`);
                    const p2 = document.querySelector(`.peca-julgamento[data-linha="${segunda.linha}"][data-coluna="${segunda.coluna}"]`);
                    if (p1) p1.classList.add('erro-plantio');
                    if (p2) p2.classList.add('erro-plantio');
                    
                    // Vibração física (Celular)
                    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                    
                    mostrarToast("❌ Sem combinação!");

                    setTimeout(() => {
                        trocarPecas(primeira, segunda); 
                        processando = false;
                    }, 400);
                }
            } else {
                processando = true;
                
                // Clicou longe, vibra a segunda peça
                const p2 = document.querySelector(`.peca-julgamento[data-linha="${linha}"][data-coluna="${coluna}"]`);
                if (p2) p2.classList.add('erro-plantio');
                
                // Vibração física rápida
                if (navigator.vibrate) navigator.vibrate(100);
                
                mostrarToast("❌ Escolha uma peça adjacente!");
                
                setTimeout(() => {
                    if (p2) p2.classList.remove('erro-plantio');
                    processando = false;
                }, 400);
            }
        }
    }

    function reiniciarJogo() {
        if (confirm('Reiniciar o jogo? Todo progresso será perdido.')) {
            localStorage.removeItem('julgamento_safra');
            grade = gerarGradeAleatoria();
            pontuacao = 0;
            nivel = 1;
            meta = 100;
            resolverCombinacoesSemAnimacao();
            renderizarGrade();
        }
    }

    function novoCaso() {
        if (confirm('Iniciar novo caso? A pontuação atual será perdida.')) {
            grade = gerarGradeAleatoria();
            pontuacao = 0;
            resolverCombinacoesSemAnimacao();
            renderizarGrade();
            atualizarInterface();
            salvarJogo();
        }
    }

    function inicializarJulgamento() {
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
                grade = gerarGradeAleatoria();
            }
        } else {
            grade = gerarGradeAleatoria();
        }
        
        resolverCombinacoesSemAnimacao();
        renderizarGrade();
        atualizarInterface();
    }

    // ========== EXPOR FUNÇÕES GLOBAIS ==========
    window.toggleInstrucoesJulgamento = function() {
        const el = document.getElementById('instrucoes-julgamento');
        if (el) el.classList.toggle('escondido');
    };

    window.iniciarJulgamento = function() {
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