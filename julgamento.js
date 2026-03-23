// ============================================================================
// JULGAMENTO DA SAFRA: THE MAGNETIC MATCH-3 (PADRÃO OURO)
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
    window.julgamentoAtivo = false; // 🚨 TRAVA MESTRA ADICIONADA

    // Variáveis para detectar Arraste (Swipe)
    let startX = 0, startY = 0;

    // 4. INICIALIZAÇÃO
    window.iniciarJulgamento = function() {
        console.log("Iniciando Match-3 Magnético Sênior...");
        nivel = 1;
        metaNivel = 1000;
        iniciarNovoNivel();
        
        const btnNovo = document.getElementById('julgamento-btn-novo');
        if(btnNovo) btnNovo.onclick = () => { iniciarNovoNivel(true); };
    };

    function iniciarNovoNivel(resetarTudo = false) {
        if(resetarTudo) { pontuacao = 0; nivel = 1; metaNivel = 1000; }
        
        movimentosRestantes = 20 + (nivel * 2); 
        processandoCascata = false;
        
        gerarGradeInicial();
        atualizarPlacarUI();
    }

    // 5. GERAÇÃO BLINDADA DO TABULEIRO
    function gerarGradeInicial() {
        const tabuleiro = document.getElementById('julgamento-grade');
        tabuleiro.innerHTML = '';
        grade = [];

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

    // 6. A LÓGICA DE MOVIMENTO UNIFICADO
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

        if (grade[origemL][origemC].emoji === SEMENTE_DOURADA && Math.abs(dx) < 20 && Math.abs(dy) < 20) {
            joiaSelecionada.el.classList.remove('joia-selecionada');
            joiaSelecionada = null;
            detonarOndaDeChoque(origemL, origemC);
            return;
        }

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

    // 🚨 O MOTOR DE TROCA RECONSTRUÍDO
    async function tentarTroca(l1, c1, l2, c2) {
        if (processandoCascata) return;
        processandoCascata = true;

        movimentosRestantes--;
        atualizarPlacarUI();

        // 1. Troca Física na Memória
        let temp = grade[l1][c1];
        grade[l1][c1] = grade[l2][c2];
        grade[l2][c2] = temp;

        // 2. Renderiza a nova posição
        atualizarVisualDaGrade();
        if(AudioMatch.troca) {
            AudioMatch.troca.currentTime = 0;
            AudioMatch.troca.play().catch(e => console.log(e));
        }

        // Aguarda a mente do jogador registrar o movimento
        await new Promise(r => setTimeout(r, 250)); 

        const matches = encontrarMatches();
        if (matches.length > 0) {
            await processarMatches(matches);
        } else {
            // Se NÃO deu match, desfaz a troca na memória!
            if(typeof mostrarToast === 'function') mostrarToast("Sem combinação! Movimento perdido.", "⚠️");
            if(window.Haptics) navigator.vibrate(50);
            
            temp = grade[l1][c1];
            grade[l1][c1] = grade[l2][c2];
            grade[l2][c2] = temp;
            
            // Renderiza as peças de volta pro lugar original
            atualizarVisualDaGrade();
            processandoCascata = false;
        }

        // Se gastou o movimento fazendo uma troca inútil e zerou:
        if (movimentosRestantes <= 0 && !processandoCascata) {
            verificarFimDeTurno();
        }
    }

    // 7. O ALGORITMO DE MATCH-3 (BLINDADO CONTRA OUT-OF-BOUNDS)
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

    async function processarMatches(matches) {
        // 🚨 O ABORTAR MAGNÉTICO: Se o jogo foi fechado, para de gastar bateria!
        if (matches.length === 0 || !window.julgamentoAtivo) {
            processandoCascata = false; 
            return; 
        }

        const recompensa = matches.length * 15;
        pontuacao += recompensa;
        AudioMatch.match3.currentTime = 0; AudioMatch.match3.play();
        if(window.Haptics) navigator.vibrate([30, 50]);

        if (typeof integrarComArvoreDaVida === 'function') integrarComArvoreDaVida(recompensa);

        if (matches.length >= 5) {
            AudioMatch.match5.play();
            mostrarTextoFlutuante("SEMENTE DOURADA!");
            const meio = matches[Math.floor(matches.length / 2)];
            grade[meio.l][meio.c] = { emoji: SEMENTE_DOURADA, cor: '#f1c40f' };
            matches = matches.filter(m => !(m.l === meio.l && m.c === meio.c));
        } else if (matches.length === 4) {
            mostrarTextoFlutuante("COLHEITA FORTE!");
        }

        matches.forEach(m => {
            const el = document.getElementById(`joia-${m.l}-${m.c}`);
            if (el) el.classList.add('anim-explodindo');
            grade[m.l][m.c] = null; 
        });

        atualizarPlacarUI();
        await new Promise(r => setTimeout(r, 300));
        
        // 🚨 CHECAGEM DE VIDA ANTES DA GRAVIDADE
        if (!window.julgamentoAtivo) {
            processandoCascata = false; 
            return; 
        }

        aplicarGravidade();
        preencherGrade();
        atualizarVisualDaGrade();
        await new Promise(r => setTimeout(r, 300));

        // 🚨 CHECAGEM DE VIDA ANTES DA NOVA CASCATA
        if (!window.julgamentoAtivo) {
            processandoCascata = false; 
            return; 
        }

        const novosMatches = encontrarMatches();
        if (novosMatches.length > 0) {
            mostrarTextoFlutuante("CASCATA!");
            await processarMatches(novosMatches); 
        } else {
            // Terminamos a rodada inteira. Verifica vitória ou derrota.
            processandoCascata = false; 
            verificarFimDeTurno();
        }
    }

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
        
        // Se a grade ainda está vazia (início do jogo), criamos as "caixas" vazias uma única vez
        if (tabuleiro.children.length === 0) {
            for (let l = 0; l < LINHAS; l++) {
                for (let c = 0; c < COLUNAS; c++) {
                    criarElementoVisual(l, c, { emoji: '', cor: 'transparent' });
                }
            }
        }

        // Agora, nós apenas atualizamos o que está DENTRO das caixas já existentes! (Alta performance)
        for (let l = 0; l < LINHAS; l++) {
            for (let c = 0; c < COLUNAS; c++) {
                const el = document.getElementById(`joia-${l}-${c}`);
                if (el) {
                    const joiaAtual = grade[l][c];
                    
                    if (joiaAtual) {
                        el.innerText = joiaAtual.emoji;
                        el.style.filter = `drop-shadow(0 0 8px ${joiaAtual.cor})`;
                        el.style.opacity = '1';
                        
                        if (joiaAtual.emoji === SEMENTE_DOURADA) {
                            el.classList.add('semente-dourada');
                        } else {
                            el.classList.remove('semente-dourada');
                        }
                        
                        // Garante que não ficou preso na animação de explosão
                        el.classList.remove('anim-explodindo'); 
                    } else {
                        // Se o espaço estiver vazio na matriz (durante a gravidade), apagamos a peça visualmente
                        el.innerText = '';
                        el.style.filter = 'none';
                        el.style.opacity = '0';
                        el.classList.remove('semente-dourada');
                    }
                }
            }
        }
    }

    // 8. BOMBA NUCLEAR (SEMENTE DOURADA) E GERENCIAMENTO DE TURNOS
    async function detonarOndaDeChoque(lSemente, cSemente) {
        processandoCascata = true;
        movimentosRestantes--; 
        atualizarPlacarUI();

        AudioMatch.explosaoNuke.play();
        if(window.Haptics) navigator.vibrate([100, 50, 100, 50, 200, 100, 300]); 

        mostrarTextoFlutuante("ONDA DE CHOQUE!");
        const flash = document.getElementById('flash-choque');
        if (flash) {
            flash.classList.remove('escondido');
            flash.style.animation = 'none';
            void flash.offsetWidth; 
            flash.style.animation = 'sumirChoque 1s forwards ease-out';
        }

        pontuacao += 1500; 
        if (typeof integrarComArvoreDaVida === 'function') integrarComArvoreDaVida(1500);
        atualizarPlacarUI();

        for (let l = 0; l < LINHAS; l++) {
            for (let c = 0; c < COLUNAS; c++) {
                const el = document.getElementById(`joia-${l}-${c}`);
                if (el) el.classList.add('anim-explodindo');
                grade[l][c] = null;
            }
        }

        await new Promise(r => setTimeout(r, 400));
        
        if (!window.julgamentoAtivo) {
            processandoCascata = false; 
            return; 
        }

        preencherGrade();
        atualizarVisualDaGrade();
        
        const novosMatches = encontrarMatches();
        if (novosMatches.length > 0) {
            await processarMatches(novosMatches);
        } else {
            processandoCascata = false;
            verificarFimDeTurno();
        }
    }

    function verificarFimDeTurno() {
        if (pontuacao >= metaNivel) {
            subirDeNivel();
        } else if (movimentosRestantes <= 0) {
            gameOver();
        } else {
            processandoCascata = false; // O jogador pode continuar!
        }
    }

    function subirDeNivel() {
        processandoCascata = true; 
        nivel++;
        pontuacao = 0;
        metaNivel = Math.floor(metaNivel * 1.5); 
        movimentosRestantes = 15 + Math.floor(nivel * 2); 
        
        AudioMatch.subirNivel.play();
        mostrarTextoFlutuante(`NÍVEL ${nivel}!`);
        if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#9b59b6'], spread: 90});
        
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

    // 9. FUNÇÕES DE UI
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