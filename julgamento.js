// ============================================================================
// JULGAMENTO DA SAFRA: THE MAGNETIC MATCH-3 (ARQUITETURA DEFINITIVA)
// ============================================================================

(function() {
    // 1. ÁUDIOS CINEMATOGRÁFICOS E LOCAIS
    const AudioMatch = {
        troca: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        match3: new Audio('assets/sons/acerto.mp3'),
        match5: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
        explosaoNuke: new Audio('https://assets.mixkit.co/active_storage/sfx/2771/2771-preview.mp3'),
        subirNivel: new Audio('assets/sons/nivel.mp3'),
        erroGameOver: new Audio('assets/sons/erro.mp3')
    };
    Object.values(AudioMatch).forEach(a => a.volume = 0.5);

    // 2. CONFIGURAÇÕES DO TABULEIRO (GEOMETRIA RIGOROSA)
    const LINHAS = 7;
    const COLUNAS = 6;
    const JOIAS = [
        { emoji: '🌽', cor: '#f1c40f' }, 
        { emoji: '⚖️', cor: '#9b59b6' }, 
        { emoji: '☕', cor: '#7f8c8d' }, 
        { emoji: '🔨', cor: '#e74c3c' }, 
        { emoji: '💧', cor: '#3498db' }, 
        { emoji: '🌱', cor: '#2ecc71' }  
    ];
    const SEMENTE_DOURADA = '🌟';

    // 3. ESTADO DO JOGO
    let grade = []; 
    let pontuacao = 0;
    let nivel = 1;
    let metaNivel = 1000;
    let movimentosRestantes = 15;
    
    let joiaSelecionada = null; 
    let processandoCascata = false; 
    window.julgamentoAtivo = false; 

    // Variáveis para detectar Arraste (Swipe)
    let startX = 0, startY = 0;

    // 4. INICIALIZAÇÃO
    window.iniciarJulgamento = function() {
        console.log("Iniciando Match-3 Motor Definitivo...");
        if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI(); // 🚨 PUXA O SALDO DO BANCO CENTRAL NA HORA
        
        nivel = 1;
        metaNivel = 500; // 🚨 BALANCEAMENTO: 1000 era frustrante. 500 é perfeito para a fase 1.
        iniciarNovoNivel();
        
        const btnNovo = document.getElementById('julgamento-btn-novo');
        if(btnNovo) btnNovo.onclick = () => { iniciarNovoNivel(true); };
    };

    function iniciarNovoNivel(resetarTudo = false) {
        if(resetarTudo) { pontuacao = 0; nivel = 1; metaNivel = 500; }
        
        // 🚨 MAIS TRANQUILIDADE: Aumentamos a base de movimentos de 15 para 30!
        movimentosRestantes = 30 + (nivel * 3); 
        processandoCascata = false;
        
        gerarGradeInicial();
        atualizarPlacarUI();
    }

    // 5. GERAÇÃO INTELIGENTE (ANTI-DEADLOCK)
    function gerarGradeInicial() {
        const tabuleiro = document.getElementById('julgamento-grade');
        tabuleiro.innerHTML = '';
        grade = [];

        let tabuleiroValido = false;
        
        while (!tabuleiroValido) {
            for (let l = 0; l < LINHAS; l++) {
                grade[l] = [];
                for (let c = 0; c < COLUNAS; c++) {
                    let joia;
                    let isMatch;
                    do {
                        isMatch = false;
                        joia = JOIAS[Math.floor(Math.random() * JOIAS.length)];
                        if (c >= 2 && grade[l][c-1].emoji === joia.emoji && grade[l][c-2].emoji === joia.emoji) isMatch = true;
                        if (l >= 2 && grade[l-1][c].emoji === joia.emoji && grade[l-2][c].emoji === joia.emoji) isMatch = true;
                    } while (isMatch);

                    grade[l][c] = { ...joia };
                }
            }
            // Verifica se o tabuleiro recém-criado possui PELO MENOS um movimento possível
            if (existemMovimentosPossiveis()) tabuleiroValido = true;
        }

        atualizarVisualDaGrade();
    }

    function criarElementoVisual(l, c, joia) {
        const tabuleiro = document.getElementById('julgamento-grade');
        const div = document.createElement('div');
        div.className = 'joia-cristal';
        div.id = `joia-${l}-${c}`;
        div.innerText = joia.emoji;
        div.style.filter = `drop-shadow(0 0 8px ${joia.cor})`;

        if (joia.emoji === SEMENTE_DOURADA) div.classList.add('semente-dourada');

        div.addEventListener('touchstart', e => {
            if(processandoCascata) return;
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
            lidarSelecaoInicial(l, c, div);
        }, {passive: true});

        div.addEventListener('touchend', e => {
            lidarSoltura(l, c, e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        });

        div.addEventListener('mousedown', e => {
            if(processandoCascata) return;
            startX = e.clientX; startY = e.clientY;
            lidarSelecaoInicial(l, c, div);
        });

        div.addEventListener('mouseup', e => {
            lidarSoltura(l, c, e.clientX, e.clientY);
        });

        tabuleiro.appendChild(div);
        return div;
    }

    // 6. A LÓGICA DE MOVIMENTO CINÉTICO
    function lidarSelecaoInicial(l, c, el) {
        if (!joiaSelecionada) {
            joiaSelecionada = { l, c, el };
            el.classList.add('joia-selecionada');
            if(window.Haptics) window.Haptics.toqueLeve();
        }
    }

    function lidarSoltura(origemL, origemC, endX, endY) {
        if (processandoCascata || !joiaSelecionada) return;

        let dx = endX - startX;
        let dy = endY - startY;

        if (Math.abs(dx) > 30 || Math.abs(dy) > 30) {
            joiaSelecionada.el.classList.remove('joia-selecionada');
            let targetL = origemL; 
            let targetC = origemC;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                if (dx > 0) targetC++; else targetC--; 
            } else {
                if (dy > 0) targetL++; else targetL--; 
            }

            if (targetL >= 0 && targetL < LINHAS && targetC >= 0 && targetC < COLUNAS) {
                tentarTroca(origemL, origemC, targetL, targetC);
            }
            joiaSelecionada = null;
        } else {
            // Lida com clique em duas peças separadamente
            if (joiaSelecionada.l !== origemL || joiaSelecionada.c !== origemC) {
                joiaSelecionada.el.classList.remove('joia-selecionada');
                const adjacente = (Math.abs(joiaSelecionada.l - origemL) === 1 && joiaSelecionada.c === origemC) || 
                                  (Math.abs(joiaSelecionada.c - origemC) === 1 && joiaSelecionada.l === origemL);
                if (adjacente) {
                    tentarTroca(joiaSelecionada.l, joiaSelecionada.c, origemL, origemC);
                }
                joiaSelecionada = null;
            }
        }
    }

    // 🚨 MOTOR DE TROCA E BOMBA DE COR (COLOR BOMB)
    async function tentarTroca(l1, c1, l2, c2) {
        if (processandoCascata) return;
        processandoCascata = true;

        movimentosRestantes--;
        atualizarPlacarUI();

        // 1. Troca Física na Memória
        let temp = grade[l1][c1];
        grade[l1][c1] = grade[l2][c2];
        grade[l2][c2] = temp;

        atualizarVisualDaGrade();
        if(AudioMatch.troca) {
            AudioMatch.troca.currentTime = 0;
            AudioMatch.troca.play().catch(e => console.log(e));
        }

        await new Promise(r => setTimeout(r, 250)); 

        // 🚨 LÓGICA DA BOMBA DE COR (SEMENTE DOURADA)
        let isBomba1 = grade[l1][c1].emoji === SEMENTE_DOURADA;
        let isBomba2 = grade[l2][c2].emoji === SEMENTE_DOURADA;

        if (isBomba1 || isBomba2) {
            let matchesBomb = [];
            
            // SUPERNOVA (Duas bombas se chocando)
            if (isBomba1 && isBomba2) {
                mostrarTextoFlutuante("SUPERNOVA!");
                for (let l = 0; l < LINHAS; l++) {
                    for (let c = 0; c < COLUNAS; c++) {
                        matchesBomb.push({l, c});
                    }
                }
            } else {
                // ANIMAÇÃO DE BOMBA DE COR
                let corAlvo = isBomba1 ? grade[l2][c2].emoji : grade[l1][c1].emoji;
                mostrarTextoFlutuante("RAIO DOURADO!");
                
                matchesBomb.push({l: l1, c: c1}); // Destrói a bomba
                matchesBomb.push({l: l2, c: c2}); // Destrói o alvo
                
                for (let l = 0; l < LINHAS; l++) {
                    for (let c = 0; c < COLUNAS; c++) {
                        if (grade[l][c] && grade[l][c].emoji === corAlvo) {
                            matchesBomb.push({l, c});
                        }
                    }
                }
            }
            
            AudioMatch.explosaoNuke.play();
            if(window.Haptics) navigator.vibrate([100, 50, 200, 100, 300]);
            await processarMatchesComArray(matchesBomb, true);
            return; // Encerra aqui pois a bomba limpa a etapa
        }

        // LÓGICA TRADICIONAL DE MATCH-3
        const matches = encontrarMatches();
        if (matches.length > 0) {
            await processarMatchesComArray(matches, false);
        } else {
            // Se NÃO deu match e não foi bomba, desfaz a troca na memória!
            if(typeof mostrarToast === 'function') mostrarToast("Movimento inválido!", "⚠️");
            if(window.Haptics) navigator.vibrate(50);
            
            temp = grade[l1][c1];
            grade[l1][c1] = grade[l2][c2];
            grade[l2][c2] = temp;
            
            atualizarVisualDaGrade();
            processandoCascata = false;
        }

        if (movimentosRestantes <= 0 && !processandoCascata) {
            verificarFimDeTurno();
        }
    }

    // 7. O ALGORITMO DE MATCH-3 (BLINDADO)
    function encontrarMatches() {
        let matches = new Set(); 

        for (let l = 0; l < LINHAS; l++) {
            for (let c = 0; c < COLUNAS - 2; c++) {
                if (!grade[l][c]) continue;
                let emoji = grade[l][c].emoji;
                if (!emoji || emoji === SEMENTE_DOURADA) continue;

                if (grade[l][c+1] && grade[l][c+2] && grade[l][c+1].emoji === emoji && grade[l][c+2].emoji === emoji) {
                    matches.add(`${l},${c}`); matches.add(`${l},${c+1}`); matches.add(`${l},${c+2}`);
                    if (c+3 < COLUNAS && grade[l][c+3] && grade[l][c+3].emoji === emoji) matches.add(`${l},${c+3}`);
                    if (c+4 < COLUNAS && grade[l][c+4] && grade[l][c+4].emoji === emoji) matches.add(`${l},${c+4}`);
                }
            }
        }

        for (let c = 0; c < COLUNAS; c++) {
            for (let l = 0; l < LINHAS - 2; l++) {
                if (!grade[l][c]) continue;
                let emoji = grade[l][c].emoji;
                if (!emoji || emoji === SEMENTE_DOURADA) continue;

                if (grade[l+1] && grade[l+1][c] && grade[l+2] && grade[l+2][c] && grade[l+1][c].emoji === emoji && grade[l+2][c].emoji === emoji) {
                    matches.add(`${l},${c}`); matches.add(`${l+1},${c}`); matches.add(`${l+2},${c}`);
                    if (l+3 < LINHAS && grade[l+3] && grade[l+3][c] && grade[l+3][c].emoji === emoji) matches.add(`${l+3},${c}`);
                    if (l+4 < LINHAS && grade[l+4] && grade[l+4][c] && grade[l+4][c].emoji === emoji) matches.add(`${l+4},${c}`);
                }
            }
        }

        return Array.from(matches).map(pos => {
            const [l, c] = pos.split(',').map(Number);
            return { l, c };
        });
    }

    // 8. O MOTOR DE CASCATA E RESOLUÇÃO
    async function processarMatchesComArray(matches, isBombAttack = false) {
        if (matches.length === 0 || !window.julgamentoAtivo) {
            processandoCascata = false; 
            return; 
        }

        // Remove duplicatas do array (caso o match cruzado crie)
        const matchesUnicos = matches.filter((v, i, a) => a.findIndex(t => (t.l === v.l && t.c === v.c)) === i);

        const recompensa = matchesUnicos.length * (isBombAttack ? 25 : 15);
        pontuacao += recompensa;
        
        // 🚨 INFLAÇÃO DO BEM: Paga 1 Moeda por cada pecinha destruída no jogo!
        if (typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(matchesUnicos.length, "Pedras Quebradas na Safra");
            // Atualiza a interface da Fazenda (se aberta no fundo) para ela não perder a conta
            const capitalUI = document.getElementById('fazenda-capital');
            if (capitalUI) capitalUI.innerText = window.pontosDoCasal;
        }
        
        if (!isBombAttack) {
            AudioMatch.match3.currentTime = 0; AudioMatch.match3.play();
        }
        if(window.Haptics) navigator.vibrate([30, 50]);

        if (typeof integrarComArvoreDaVida === 'function') integrarComArvoreDaVida(recompensa);

        // Gera a Semente Dourada se for um match massivo (e não for um ataque de bomba)
        if (!isBombAttack && matchesUnicos.length >= 5) {
            AudioMatch.match5.play();
            mostrarTextoFlutuante("SEMENTE DOURADA!");
            const meio = matchesUnicos[Math.floor(matchesUnicos.length / 2)];
            grade[meio.l][meio.c] = { emoji: SEMENTE_DOURADA, cor: '#f1c40f' };
            // Remove a peça do meio da lista de destruição
            matchesUnicos.splice(matchesUnicos.findIndex(m => m.l === meio.l && m.c === meio.c), 1);
        } else if (!isBombAttack && matchesUnicos.length === 4) {
            mostrarTextoFlutuante("COLHEITA FORTE!");
        }

        // Efeito visual de explosão
        matchesUnicos.forEach(m => {
            const el = document.getElementById(`joia-${m.l}-${m.c}`);
            if (el) el.classList.add('anim-explodindo');
            grade[m.l][m.c] = null; 
        });

        atualizarPlacarUI();
        await new Promise(r => setTimeout(r, 300));
        
        if (!window.julgamentoAtivo) { processandoCascata = false; return; }

        aplicarGravidade();
        preencherGrade();
        atualizarVisualDaGrade();
        await new Promise(r => setTimeout(r, 300));

        if (!window.julgamentoAtivo) { processandoCascata = false; return; }

        const novosMatches = encontrarMatches();
        if (novosMatches.length > 0) {
            if(!isBombAttack) mostrarTextoFlutuante("CASCATA!");
            await processarMatchesComArray(novosMatches, false); 
        } else {
            // CASCATA CONCLUÍDA. HORA DA VERIFICAÇÃO MESTRA DE INTELIGÊNCIA ARTIFICIAL:
            if (!existemMovimentosPossiveis() && pontuacao < metaNivel && movimentosRestantes > 0) {
                await executarAutoShuffle();
            } else {
                processandoCascata = false; 
                verificarFimDeTurno();
            }
        }
    }

    // 🚨 A INTELIGÊNCIA ARTIFICIAL: DETECTOR DE DEADLOCK
    function existemMovimentosPossiveis() {
        // Simula todos os movimentos possíveis invisivelmente
        for (let l = 0; l < LINHAS; l++) {
            for (let c = 0; c < COLUNAS; c++) {
                
                // Simula troca para a direita
                if (c < COLUNAS - 1) {
                    swapGradeInvisivel(l, c, l, c + 1);
                    if (encontrarMatchesInvisiveis() || simularBomba(l, c, l, c+1)) {
                        swapGradeInvisivel(l, c, l, c + 1); // Desfaz
                        return true;
                    }
                    swapGradeInvisivel(l, c, l, c + 1); // Desfaz
                }
                
                // Simula troca para baixo
                if (l < LINHAS - 1) {
                    swapGradeInvisivel(l, c, l + 1, c);
                    if (encontrarMatchesInvisiveis() || simularBomba(l, c, l+1, c)) {
                        swapGradeInvisivel(l, c, l + 1, c); // Desfaz
                        return true;
                    }
                    swapGradeInvisivel(l, c, l + 1, c); // Desfaz
                }
            }
        }
        return false;
    }

    function simularBomba(l1, c1, l2, c2) {
        if (!grade[l1][c1] || !grade[l2][c2]) return false;
        return grade[l1][c1].emoji === SEMENTE_DOURADA || grade[l2][c2].emoji === SEMENTE_DOURADA;
    }

    function swapGradeInvisivel(l1, c1, l2, c2) {
        let temp = grade[l1][c1];
        grade[l1][c1] = grade[l2][c2];
        grade[l2][c2] = temp;
    }

    function encontrarMatchesInvisiveis() {
        const matches = encontrarMatches();
        return matches.length > 0;
    }

    async function executarAutoShuffle() {
        mostrarTextoFlutuante("EMBARALHANDO...");
        if(window.Haptics) navigator.vibrate([100, 100, 100]);
        
        // Efeito visual de quebra
        for (let l = 0; l < LINHAS; l++) {
            for (let c = 0; c < COLUNAS; c++) {
                const el = document.getElementById(`joia-${l}-${c}`);
                if (el) {
                    el.style.opacity = '0';
                    el.style.transform = 'scale(0.5)';
                }
            }
        }
        
        await new Promise(r => setTimeout(r, 500));
        
        gerarGradeInicial(); // Esta função já é blindada contra deadlocks iniciais!
        
        await new Promise(r => setTimeout(r, 200));
        mostrarTextoFlutuante("JOGO SALVO!");
        processandoCascata = false;
        verificarFimDeTurno();
    }

    // 9. GRAVIDADE E PREENCHIMENTO
    function aplicarGravidade() {
        for (let c = 0; c < COLUNAS; c++) {
            let chao = LINHAS - 1;
            for (let l = LINHAS - 1; l >= 0; l--) {
                if (grade[l][c] !== null) {
                    if (chao !== l) {
                        grade[chao][c] = grade[l][c];
                        grade[l][c] = null;
                    }
                    chao--;
                }
            }
        }
    }

    function preencherGrade() {
        for (let l = 0; l < LINHAS; l++) {
            for (let c = 0; c < COLUNAS; c++) {
                if (grade[l][c] === null) {
                    grade[l][c] = { ...JOIAS[Math.floor(Math.random() * JOIAS.length)] };
                }
            }
        }
    }

    function atualizarVisualDaGrade() {
        const tabuleiro = document.getElementById('julgamento-grade');
        
        if (tabuleiro.children.length === 0) {
            for (let l = 0; l < LINHAS; l++) {
                for (let c = 0; c < COLUNAS; c++) {
                    criarElementoVisual(l, c, { emoji: '', cor: 'transparent' });
                }
            }
        }

        for (let l = 0; l < LINHAS; l++) {
            for (let c = 0; c < COLUNAS; c++) {
                const el = document.getElementById(`joia-${l}-${c}`);
                if (el) {
                    const joiaAtual = grade[l][c];
                    
                    if (joiaAtual) {
                        el.innerText = joiaAtual.emoji;
                        el.style.filter = `drop-shadow(0 0 8px ${joiaAtual.cor})`;
                        el.style.opacity = '1';
                        el.style.transform = 'scale(1)';
                        
                        if (joiaAtual.emoji === SEMENTE_DOURADA) {
                            el.classList.add('semente-dourada');
                        } else {
                            el.classList.remove('semente-dourada');
                        }
                        
                        el.classList.remove('anim-explodindo'); 
                    } else {
                        el.innerText = '';
                        el.style.filter = 'none';
                        el.style.opacity = '0';
                        el.classList.remove('semente-dourada');
                    }
                }
            }
        }
    }

    // 10. CONTROLE DE TURNOS
    function verificarFimDeTurno() {
        if (pontuacao >= metaNivel) {
            subirDeNivel();
        } else if (movimentosRestantes <= 0) {
            gameOver();
        }
    }

    function subirDeNivel() {
        processandoCascata = true; 
        nivel++;
        pontuacao = 0;
        metaNivel = Math.floor(metaNivel * 1.5); 
        
        // 🚨 BUG CORRIGIDO: Mantendo a mesma generosidade matemática de 30 turnos + bônus do nível.
        movimentosRestantes = 30 + (nivel * 3); 
        
        AudioMatch.subirNivel.play();
        mostrarTextoFlutuante(`NÍVEL ${nivel}! +150💰`);
        if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#9b59b6'], spread: 90});
        
        // 🚨 INFLAÇÃO DO BEM: O prêmio gordo por passar de fase
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(150, `Subiu para o Nível ${nivel} na Safra`);
        
        let statsTribunal = JSON.parse(localStorage.getItem('estatisticasCasalTribunal')) || { ganhos: 0, perdidos: 0 };
        statsTribunal.ganhos++;
        localStorage.setItem('estatisticasCasalTribunal', JSON.stringify(statsTribunal));
        
        setTimeout(() => {
            gerarGradeInicial();
            atualizarPlacarUI();
            processandoCascata = false;
        }, 2000);
    }

    function gameOver() {
        processandoCascata = true;
        AudioMatch.erroGameOver.play();
        mostrarTextoFlutuante("SEM MOVIMENTOS!");
        if(window.Haptics) navigator.vibrate([200, 100, 200]);
        
        setTimeout(() => {
            if(typeof mostrarToast === 'function') mostrarToast("A safra foi perdida. Tentando novamente!", "⏳");
            iniciarNovoNivel(); 
        }, 2500);
    }

    // 11. INTERFACE
    function atualizarPlacarUI() {
        document.getElementById('julgamento-pontuacao').innerText = pontuacao;
        document.getElementById('julgamento-nivel').innerText = nivel;
        document.getElementById('julgamento-prox-nivel').innerText = nivel;
        document.getElementById('julgamento-meta').innerText = metaNivel;
        document.getElementById('julgamento-movimentos').innerText = movimentosRestantes;
        
        let progresso = (pontuacao / metaNivel) * 100;
        if(progresso > 100) progresso = 100;
        document.getElementById('julgamento-barra-progresso').style.width = `${progresso}%`;
    }

    function integrarComArvoreDaVida(pontosGanhos) {
        if (window.statusPlanta && typeof window.statusPlanta.nivel !== 'undefined') {
            window.statusPlanta.nivel += (pontosGanhos / 1000); 
            if (window.statusPlanta.nivel > 100) window.statusPlanta.nivel = 100;
            if (typeof window.renderizarPlanta === 'function') window.renderizarPlanta();
        }
    }

    function mostrarTextoFlutuante(texto) {
        const div = document.getElementById('texto-combo-flutuante');
        if (!div) return;
        
        div.innerHTML = texto;
        div.classList.remove('escondido'); 
        div.classList.remove('mostrar-animacao');
        
        void div.offsetWidth; 
        
        div.classList.add('mostrar-animacao');
    }

    window.toggleInstrucoesJulgamento = function() {
        document.getElementById('instrucoes-julgamento').classList.toggle('escondido');
    };

})();