// ==========================================
// MINI FAZENDA - VERSÃO AUTOSSUFICIENTE E CORRIGIDA (COM CRESCIMENTO OFFLINE)
// ==========================================

(function() {
    const tiposSementes = [
        { nome: 'Milho', icone: '🌽', tempo: 120000, preco: 10, recompensa: 15, exp: 6 },
        { nome: 'Cenoura', icone: '🥕', tempo: 180000, preco: 12, recompensa: 18, exp: 9 },
        { nome: 'Tomate', icone: '🍅', tempo: 210000, preco: 15, recompensa: 22, exp: 12 },
        { nome: 'Abóbora', icone: '🎃', tempo: 280000, preco: 20, recompensa: 30, exp: 15 }
    ];

    let sementeSelecionada = 0;
    let loopFazendaAtivo = null;

    let fazenda = {
        tamanho: 1,
        slots: [],
        sementes: [0, 0, 0, 0],
        dinheiro: 50,
        nivel: 1,
        experiencia: 0,
        expProximoNivel: 50
    };

    function mostrarToast(mensagem) {
        const toast = document.getElementById('toast-mensagem');
        if (toast) {
            toast.innerText = mensagem;
            toast.classList.remove('escondido');
            setTimeout(() => toast.classList.add('escondido'), 2000);
        } else {
            alert(mensagem);
        }
    }

    function inicializarGrade() {
        fazenda.slots = [];
        for (let i = 0; i < fazenda.tamanho; i++) {
            fazenda.slots[i] = [];
            for (let j = 0; j < fazenda.tamanho; j++) {
                fazenda.slots[i][j] = { estado: 'vazio', tipoSemente: null, plantadoEm: null };
            }
        }
    }

    function salvarFazenda() {
        localStorage.setItem('minifazenda_dados', JSON.stringify(fazenda));
        if (window.SantuarioDB && window.SantuarioDB_Functions) {
            const userId = localStorage.getItem('santuario_user_id') || 'desconhecido';
            const { ref, set } = window.SantuarioDB_Functions;
            set(ref(window.SantuarioDB, 'fazenda/' + userId), fazenda)
                .catch((error) => console.error("Erro ao salvar nuvem:", error));
        }
    }

    // ==========================================
    // NOVA FUNÇÃO: Verifica o crescimento baseado no tempo real (offline)
    // ==========================================
    function verificarCrescimentoOffline() {
        if (!fazenda || !fazenda.slots) return false;

        const agora = Date.now();
        let mudou = false;

        for (let i = 0; i < fazenda.tamanho; i++) {
            if (!fazenda.slots[i]) continue;
            for (let j = 0; j < fazenda.tamanho; j++) {
                const slot = fazenda.slots[i][j];
                if (slot && slot.estado === 'plantado' && slot.plantadoEm) {
                    const tempoPassado = agora - slot.plantadoEm;
                    const tempoNecessario = tiposSementes[slot.tipoSemente].tempo;
                    if (tempoPassado >= tempoNecessario) {
                        slot.estado = 'pronto';
                        mudou = true;
                    }
                }
            }
        }

        if (mudou) {
            salvarFazenda();
        }
        return mudou;
    }

    function loopCrescimento() {
        if (fazenda && fazenda.slots && fazenda.slots.length > 0) {
            if (verificarCrescimentoOffline()) {
                renderizarFazenda();
                mostrarToast("🌾 Colheita pronta!");
            }
        }
    }

    // ==========================================
    // CARREGAR FAZENDA (agora com verificação offline)
    // ==========================================
    function carregarFazenda() {
        const userId = localStorage.getItem('santuario_user_id') || 'desconhecido';
        if (window.SantuarioDB && window.SantuarioDB_Functions) {
            const { ref, get } = window.SantuarioDB_Functions;
            get(ref(window.SantuarioDB, 'fazenda/' + userId)).then((snapshot) => {
                if (snapshot.exists()) {
                    fazenda = snapshot.val();
                } else {
                    inicializarNovaFazenda();
                }
                verificarIntegridadeGrade();
                // VERIFICA CRESCIMENTO OFFLINE ANTES DE RENDERIZAR
                verificarCrescimentoOffline();
                renderizarFazenda();
            }).catch(() => {
                tentarCarregarLocal();
            });
        } else {
            tentarCarregarLocal();
        }
    }

    function tentarCarregarLocal() {
        const salvoLocal = localStorage.getItem('minifazenda_dados');
        if (salvoLocal) {
            try {
                fazenda = JSON.parse(salvoLocal);
                verificarIntegridadeGrade();
                // VERIFICA CRESCIMENTO OFFLINE ANTES DE RENDERIZAR
                verificarCrescimentoOffline();
            } catch (e) {
                inicializarNovaFazenda();
            }
        } else {
            inicializarNovaFazenda();
        }
        renderizarFazenda();
    }

    function verificarIntegridadeGrade() {
        if (!fazenda.slots || fazenda.slots.length !== fazenda.tamanho) {
            inicializarGrade();
        }
    }

    function inicializarNovaFazenda() {
        fazenda = { tamanho: 1, slots: [], sementes: [0, 0, 0, 0], dinheiro: 50, nivel: 1, experiencia: 0, expProximoNivel: 50 };
        inicializarGrade();
    }

    function renderizarFazenda() {
        renderizarGrade();
        renderizarDeposito();
        atualizarInterface();
    }

    function renderizarGrade() {
        const gradeDiv = document.getElementById('mf-grade');
        if (!gradeDiv) return;

        gradeDiv.style.gridTemplateColumns = `repeat(${fazenda.tamanho}, 1fr)`;
        gradeDiv.innerHTML = '';

        for (let i = 0; i < fazenda.tamanho; i++) {
            if (!fazenda.slots[i]) continue;
            for (let j = 0; j < fazenda.tamanho; j++) {
                const slot = fazenda.slots[i][j];
                const slotDiv = document.createElement('div');
                slotDiv.className = 'slot-fazenda';
                slotDiv.dataset.linha = i;
                slotDiv.dataset.coluna = j;

                if (slot.estado === 'vazio') {
                    slotDiv.innerHTML = '➕';
                    slotDiv.onclick = () => plantar(i, j);
                } else if (slot.estado === 'plantado') {
                    const tipo = tiposSementes[slot.tipoSemente];
                    slotDiv.innerHTML = tipo ? tipo.icone : '🌱';
                    slotDiv.classList.add('crescendo');
                    slotDiv.onclick = () => mostrarToast("🌱 Ainda crescendo...");
                } else if (slot.estado === 'pronto') {
                    const tipo = tiposSementes[slot.tipoSemente];
                    slotDiv.innerHTML = tipo ? tipo.icone : '🌾';
                    slotDiv.classList.add('pronto');
                    slotDiv.onclick = () => colher(i, j);
                }
                gradeDiv.appendChild(slotDiv);
            }
        }
    }

    function renderizarDeposito() {
        const depositoDiv = document.getElementById('mf-deposito');
        if (!depositoDiv) return;
        depositoDiv.innerHTML = '';
        tiposSementes.forEach((tipo, idx) => {
            const qtd = fazenda.sementes[idx] || 0;
            const item = document.createElement('div');
            item.className = 'item-deposito';
            item.innerHTML = `${tipo.icone} <span style="font-weight:bold; font-size:1.1rem; margin-left:4px;">${qtd}</span>`;
            if (qtd <= 0) {
                item.style.opacity = '0.4';
                item.style.filter = 'grayscale(1)';
            }
            depositoDiv.appendChild(item);
        });
    }

    function atualizarInterface() {
        const elDinheiro = document.getElementById('mf-dinheiro');
        if (elDinheiro) elDinheiro.innerText = fazenda.dinheiro;
        const elNivel = document.getElementById('mf-nivel');
        if (elNivel) elNivel.innerText = fazenda.nivel;
        const elExp = document.getElementById('mf-exp');
        if (elExp) elExp.innerText = fazenda.experiencia;
        const elExpProx = document.getElementById('mf-exp-prox');
        if (elExpProx) elExpProx.innerText = fazenda.expProximoNivel;
    }

    function atualizarPrecoBotao() {
        const precoSpan = document.getElementById('mf-preco-semente');
        const tipo = tiposSementes[sementeSelecionada];
        if (precoSpan && tipo) {
            precoSpan.innerText = `(${tipo.preco}💰)`;
        }
    }

    function plantar(linha, coluna) {
        const slot = fazenda.slots[linha][coluna];
        if (slot.estado !== 'vazio') return;

        const qtd = fazenda.sementes[sementeSelecionada] || 0;
        if (qtd <= 0) {
            mostrarToast("❌ Sem sementes!");
            const slotDiv = document.querySelector(`.slot-fazenda[data-linha="${linha}"][data-coluna="${coluna}"]`);
            if (slotDiv) {
                slotDiv.classList.add('erro-plantio');
                setTimeout(() => slotDiv.classList.remove('erro-plantio'), 400);
            }
            return;
        }

        const slotDiv = document.querySelector(`.slot-fazenda[data-linha="${linha}"][data-coluna="${coluna}"]`);
        if (slotDiv) {
            slotDiv.classList.add('animacao-plantar');
            setTimeout(() => slotDiv.classList.remove('animacao-plantar'), 300);
        }

        fazenda.sementes[sementeSelecionada] = qtd - 1;
        slot.estado = 'plantado';
        slot.tipoSemente = sementeSelecionada;
        slot.plantadoEm = Date.now();

        salvarFazenda();
        renderizarFazenda();
    }

    function colher(linha, coluna) {
        const slot = fazenda.slots[linha][coluna];
        if (slot.estado !== 'pronto') return;

        const slotDiv = document.querySelector(`.slot-fazenda[data-linha="${linha}"][data-coluna="${coluna}"]`);
        if (slotDiv) {
            slotDiv.classList.add('colhendo');
            slotDiv.onclick = null;
        }

        setTimeout(() => {
            const tipo = tiposSementes[slot.tipoSemente];
            fazenda.dinheiro += tipo.recompensa;
            fazenda.experiencia += tipo.exp;

            let subiu = false;
            while (fazenda.experiencia >= fazenda.expProximoNivel) {
                fazenda.experiencia -= fazenda.expProximoNivel;
                fazenda.nivel++;
                fazenda.expProximoNivel = Math.floor(fazenda.expProximoNivel * 1.5);
                subiu = true;
                if (fazenda.tamanho < 6) {
                    fazenda.tamanho++;
                    const novoTamanho = fazenda.tamanho;
                    const novosSlots = [];
                    for (let i = 0; i < novoTamanho; i++) {
                        novosSlots[i] = [];
                        for (let j = 0; j < novoTamanho; j++) {
                            if (i < fazenda.slots.length && j < fazenda.slots[i].length) {
                                novosSlots[i][j] = fazenda.slots[i][j];
                            } else {
                                novosSlots[i][j] = { estado: 'vazio', tipoSemente: null, plantadoEm: null };
                            }
                        }
                    }
                    fazenda.slots = novosSlots;
                }
            }
            if (subiu) mostrarToast(`🥳 Nível ${fazenda.nivel}!`);

            slot.estado = 'vazio';
            slot.tipoSemente = null;
            slot.plantadoEm = null;

            salvarFazenda();
            renderizarFazenda();
        }, 400);
    }

    window.iniciarMiniFazenda = function() {
        const btnComprar = document.getElementById('mf-btn-comprar-semente');
        if (btnComprar) {
            const novoBtn = btnComprar.cloneNode(true);
            btnComprar.parentNode.replaceChild(novoBtn, btnComprar);
            novoBtn.addEventListener('click', () => {
                const tipo = tiposSementes[sementeSelecionada];
                if (!tipo) return;
                if (fazenda.dinheiro >= tipo.preco) {
                    fazenda.dinheiro -= tipo.preco;
                    fazenda.sementes[sementeSelecionada]++;
                    salvarFazenda();
                    renderizarFazenda();
                    mostrarToast(`🌱 ${tipo.nome} comprada!`);
                } else {
                    mostrarToast("❌ Dinheiro insuficiente!");
                }
            });
        }

        const btnReiniciar = document.getElementById('mf-btn-reiniciar');
        if (btnReiniciar) {
            const novoReiniciar = btnReiniciar.cloneNode(true);
            btnReiniciar.parentNode.replaceChild(novoReiniciar, btnReiniciar);
            novoReiniciar.addEventListener('click', () => {
                if (confirm('Recomeçar a fazenda? Todo progresso será zerado.')) {
                    localStorage.removeItem('minifazenda_dados');
                    inicializarNovaFazenda();
                    salvarFazenda();
                    renderizarFazenda();
                    mostrarToast("🚜 Fazenda reiniciada!");
                }
            });
        }

        document.querySelectorAll('.btn-tipo-semente').forEach(btn => {
            const novoBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(novoBtn, btn);
            novoBtn.addEventListener('click', () => {
                document.querySelectorAll('.btn-tipo-semente').forEach(b => b.classList.remove('selecionado'));
                novoBtn.classList.add('selecionado');
                sementeSelecionada = parseInt(novoBtn.dataset.tipo);
                atualizarPrecoBotao();
            });
        });

        const btnMilho = document.querySelector('.btn-tipo-semente[data-tipo="0"]');
        if (btnMilho) {
            btnMilho.classList.add('selecionado');
            sementeSelecionada = 0;
        }
        atualizarPrecoBotao();

        carregarFazenda();

        if (loopFazendaAtivo) clearInterval(loopFazendaAtivo);
        loopFazendaAtivo = setInterval(loopCrescimento, 2000);
    };

    window.toggleInstrucoesMiniFazenda = function() {
        const instrucoes = document.getElementById('instrucoes-minifazenda');
        if (instrucoes) instrucoes.classList.toggle('escondido');
    };
})();