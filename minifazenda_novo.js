// ==========================================
// MINI FAZENDA - VERSÃO AUTOSSUFICIENTE
// ==========================================

(function() {
    // Evita poluição global
const tiposSementes = [
    { nome: 'Milho', icone: '🌽', tempo: 120000, preco: 10, recompensa: 15, exp: 6 },
    { nome: 'Cenoura', icone: '🥕', tempo: 150000, preco: 12, recompensa: 18, exp: 9 },
    { nome: 'Tomate', icone: '🍅', tempo: 180000, preco: 15, recompensa: 22, exp: 12 },
    { nome: 'Abóbora', icone: '🎃', tempo: 200000, preco: 20, recompensa: 30, exp: 15 }
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

    // Função toast local (para não depender do script.js)
    function mostrarToast(mensagem) {
        const toast = document.getElementById('toast-mensagem');
        if (toast) {
            toast.innerText = mensagem;
            toast.classList.remove('escondido');
            setTimeout(() => toast.classList.add('escondido'), 2000);
        } else {
            alert(mensagem); // fallback
        }
    }

    function inicializarGrade() {
        fazenda.slots = [];
        for (let i = 0; i < fazenda.tamanho; i++) {
            fazenda.slots[i] = [];
            for (let j = 0; j < fazenda.tamanho; j++) {
                fazenda.slots[i][j] = {
                    estado: 'vazio',
                    tipoSemente: null,
                    plantadoEm: null
                };
            }
        }
    }

    // --- NOVA LÓGICA DE SINCRONIZAÇÃO COM FIREBASE ---

function salvarFazenda() {
    // 1. Salva no navegador (backup rápido)
    localStorage.setItem('minifazenda_dados', JSON.stringify(fazenda));

    // 2. Salva na nuvem (Firebase)
    if (window.SantuarioDB && window.SantuarioDB_Functions) {
        const userId = localStorage.getItem('santuario_user_id') || 'desconhecido';
        const { ref, set } = window.SantuarioDB_Functions;
        
        set(ref(window.SantuarioDB, 'fazenda/' + userId), fazenda)
            .catch((error) => console.error("Erro ao salvar nuvem:", error));
    }
}

function carregarFazenda() {
    const userId = localStorage.getItem('santuario_user_id') || 'desconhecido';
    
    // Tenta puxar da nuvem primeiro para ter o dado mais atual
    if (window.SantuarioDB && window.SantuarioDB_Functions) {
        const { ref, get } = window.SantuarioDB_Functions;
        
        get(ref(window.SantuarioDB, 'fazenda/' + userId)).then((snapshot) => {
            if (snapshot.exists()) {
                fazenda = snapshot.val();
                console.log("Dados da nuvem carregados!");
            } else {
                console.log("Nenhum dado na nuvem. Iniciando nova fazenda.");
                inicializarNovaFazenda();
            }
            renderizarGrade();
        }).catch((err) => {
            console.error("Erro ao buscar nuvem, usando local:", err);
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
            // Garantir que a estrutura de slots seja compatível com o tamanho atual
            if (!fazenda.slots || fazenda.slots.length !== fazenda.tamanho) {
                inicializarGrade();
            }
        } catch (e) {
            console.error('Erro ao carregar dados locais, resetando', e);
            inicializarNovaFazenda();
        }
    } else {
        inicializarNovaFazenda();
    }
    renderizarGrade();
}

function inicializarNovaFazenda() {
    fazenda = {
        tamanho: 1,
        slots: [],
        sementes: [0, 0, 0, 0],
        dinheiro: 50,
        nivel: 1,
        experiencia: 0,
        expProximoNivel: 50
    };
    inicializarGrade(); // Isso preenche os slots corretamente
}

function verificarCrescimentoOffline() {
    // TRAVA DE SEGURANÇA: Se a fazenda ou os slots não existirem, para aqui e não dá erro
    if (!fazenda || !fazenda.slots) {
        console.warn("Aguardando carregamento dos slots da fazenda...");
        return; 
    }

    const agora = Date.now();
    let mudou = false;

    fazenda.slots.forEach(slot => {
        // Verifica se o slot existe antes de ler a propriedade [0]
        if (slot && slot.plantada) {
            const tempoPassado = agora - slot.timestamp;
            const tempoNecessario = tiposSementes[slot.tipo].tempo;

            if (slot.estagio < 2 && tempoPassado >= tempoNecessario) {
                slot.estagio = 2;
                mudou = true;
            } else if (slot.estagio < 1 && tempoPassado >= tempoNecessario / 2) {
                slot.estagio = 1;
                mudou = true;
            }
        }
    });

    if (mudou) {
        renderizarFazenda();
        salvarFazenda();
    }
}

function loopCrescimento() {
    // TRAVA DE SEGURANÇA: Só executa se a fazenda estiver pronta
    if (fazenda && fazenda.slots && fazenda.slots.length > 0) {
        verificarCrescimentoOffline();
    }
}

// Função unificada para atualizar toda a parte visual da fazenda de uma vez
function renderizarFazenda() {
    renderizarGrade();
    renderizarDeposito();
    atualizarInterface();
}

function renderizarGrade() {
    const gradeDiv = document.getElementById('mf-grade');
    if (!gradeDiv) {
        console.error('Grade não encontrada');
        return;
    }

    gradeDiv.style.gridTemplateColumns = `repeat(${fazenda.tamanho}, 1fr)`;
    gradeDiv.innerHTML = '';

    for (let i = 0; i < fazenda.tamanho; i++) {
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
                slotDiv.classList.add('crescendo'); // Adiciona classe de crescimento
                slotDiv.onclick = () => mostrarToast("🌱 Ainda crescendo...");
            } else if (slot.estado === 'pronto') {
                const tipo = tiposSementes[slot.tipoSemente];
                slotDiv.innerHTML = tipo ? tipo.icone : '🌾';
                slotDiv.classList.add('pronto'); // Já existia
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
            item.innerHTML = `${tipo.icone} <span>${qtd}</span>`;
            if (qtd <= 0) {
                item.style.opacity = '0.4';
                item.style.filter = 'grayscale(1)';
            }
            depositoDiv.appendChild(item);
        });
    }

    function atualizarInterface() {
        console.log('Atualizando interface...');
        const elDinheiro = document.getElementById('mf-dinheiro');
        if (elDinheiro) {
            elDinheiro.innerText = fazenda.dinheiro;
            console.log('Dinheiro atualizado:', fazenda.dinheiro);
        } else {
            console.error('Elemento mf-dinheiro não encontrado');
        }

        const elNivel = document.getElementById('mf-nivel');
        if (elNivel) {
            elNivel.innerText = fazenda.nivel;
            console.log('Nível atualizado:', fazenda.nivel);
        } else {
            console.error('Elemento mf-nivel não encontrado');
        }

        const elExp = document.getElementById('mf-exp');
        if (elExp) {
            elExp.innerText = fazenda.experiencia;
            console.log('EXP atualizado:', fazenda.experiencia);
        } else {
            console.error('Elemento mf-exp não encontrado');
        }

        const elExpProx = document.getElementById('mf-exp-prox');
        if (elExpProx) {
            elExpProx.innerText = fazenda.expProximoNivel;
            console.log('EXP próximo atualizado:', fazenda.expProximoNivel);
        } else {
            console.error('Elemento mf-exp-prox não encontrado');
        }
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
    if (slot.estado !== 'vazio') {
        mostrarToast("❌ Espaço ocupado");
        return;
    }
    const qtd = fazenda.sementes[sementeSelecionada] || 0;
    if (qtd <= 0) {
        mostrarToast("❌ Sem sementes!");
        // Aplica animação de erro no slot (opcional)
        const slotDiv = document.querySelector(`.slot-fazenda[data-linha="${linha}"][data-coluna="${coluna}"]`);
        if (slotDiv) {
            slotDiv.classList.add('erro-plantio');
            setTimeout(() => slotDiv.classList.remove('erro-plantio'), 400);
        }
        return;
    }

    // Aplica animação de plantio no slot
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
    atualizarInterface();
    renderizarDeposito();
    renderizarGrade(); // Isso recria os elementos, então a classe de animação será perdida, mas o efeito já foi visto
}

function colher(linha, coluna) {
    const slot = fazenda.slots[linha][coluna];
    if (slot.estado !== 'pronto') return;

    const slotDiv = document.querySelector(`.slot-fazenda[data-linha="${linha}"][data-coluna="${coluna}"]`);
    if (slotDiv) {
        slotDiv.classList.add('colhendo');
        // Desabilita o clique durante a animação
        slotDiv.onclick = null;
    }

    // Aguarda a animação terminar (400ms) e então processa a colheita
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
                // Expande a grade
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
        atualizarInterface();
        renderizarDeposito();
        renderizarGrade();
    }, 400); // Tempo da animação de colheita
}

    // Função de inicialização pública
    window.iniciarMiniFazenda = function() {
        console.log('Iniciando Mini Fazenda Autossuficiente');

        // Botão comprar
        const btnComprar = document.getElementById('mf-btn-comprar-semente');
        if (btnComprar) {
            // Remove listener antigo para não duplicar
            const novoBtn = btnComprar.cloneNode(true);
            btnComprar.parentNode.replaceChild(novoBtn, btnComprar);
            novoBtn.addEventListener('click', () => {
                const tipo = tiposSementes[sementeSelecionada];
                if (!tipo) return;
                if (fazenda.dinheiro >= tipo.preco) {
                    fazenda.dinheiro -= tipo.preco;
                    fazenda.sementes[sementeSelecionada]++;
                    salvarFazenda();
                    atualizarInterface();
                    renderizarDeposito();
                    mostrarToast(`🌱 ${tipo.nome} comprada!`);
                } else {
                    mostrarToast("❌ Dinheiro insuficiente!");
                }
            });
        }

        // Botão reiniciar
        const btnReiniciar = document.getElementById('mf-btn-reiniciar');
        if (btnReiniciar) {
            const novoReiniciar = btnReiniciar.cloneNode(true);
            btnReiniciar.parentNode.replaceChild(novoReiniciar, btnReiniciar);
            novoReiniciar.addEventListener('click', () => {
                if (confirm('Recomeçar a fazenda?')) {
                    localStorage.removeItem('santuario_fazenda_nova');
                    resetarFazenda();
                    atualizarInterface();
                    renderizarDeposito();
                    renderizarGrade();
                    mostrarToast("🚜 Reiniciada!");
                }
            });
        }

        // Botões de seleção de semente
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

        // Seleciona milho por padrão
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

    // Função para alternar instruções (já existente, mas reforçada)
    window.toggleInstrucoesMiniFazenda = function() {
        console.log('Toggle instruções chamado'); // Log para depuração
        const instrucoes = document.getElementById('instrucoes-minifazenda');
        if (instrucoes) {
            instrucoes.classList.toggle('escondido');
        } else {
            console.error('Elemento instrucoes-minifazenda não encontrado');
        }
    };
})();