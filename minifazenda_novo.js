// ==========================================
// MINI FAZENDA - VERSÃO COMPLETA COM MELHORIAS
// ==========================================

(function() {
    // ========== CONFIGURAÇÕES ==========
    const tiposSementes = [
        { nome: 'Milho', icone: '🌽', tempo: 120000, preco: 10, recompensa: 15, exp: 6 },
        { nome: 'Cenoura', icone: '🥕', tempo: 180000, preco: 12, recompensa: 18, exp: 9 },
        { nome: 'Tomate', icone: '🍅', tempo: 210000, preco: 15, recompensa: 22, exp: 12 },
        { nome: 'Abóbora', icone: '🎃', tempo: 280000, preco: 20, recompensa: 30, exp: 15 },
        { nome: 'Morango', icone: '🍓', tempo: 150000, preco: 18, recompensa: 25, exp: 10 },
        { nome: 'Alface', icone: '🥬', tempo: 90000, preco: 8, recompensa: 12, exp: 5 },
        { nome: 'Girassol', icone: '🌻', tempo: 240000, preco: 25, recompensa: 35, exp: 18 },
        { nome: 'Batata', icone: '🥔', tempo: 200000, preco: 14, recompensa: 20, exp: 11 }
    ];

    const sons = {
    plantar: new Audio('assets/sons/mf/plantar.mp3'),
    colher: new Audio('assets/sons/mf/colher.mp3'),
    comprar: new Audio('assets/sons/mf/comprar.mp3'),
    levelUp: new Audio('assets/sons/mf/levelup.mp3'),
    regar: new Audio('assets/sons/mf/regar.mp3')
};

function getDb() {
    return window.SantuarioApp?.modulos?.db || window.SantuarioDB;
}
function getRef() {
    return window.SantuarioApp?.modulos?.ref;
}
function getRunTransaction() {
    return window.SantuarioApp?.modulos?.runTransaction;
}

// Ajuste de volume global
Object.values(sons).forEach(s => s.volume = 0.4);

function tocarSom(nome) {
    const som = sons[nome];
    if (som) {
        // Verifica se o som terminou de carregar antes de dar play
        if (som.readyState >= 2) { 
            som.currentTime = 0;
            som.play().catch(e => {
                // Se o erro for por falta de interação do usuário, ignoramos silenciosamente
                if (e.name !== 'NotAllowedError') {
                    console.warn(`Erro ao tocar som [${nome}]:`, e.message);
                }
            });
        } else {
            // Tenta carregar se ainda não estiver pronto
            som.load();
        }
    }
}

    const tiposAnimais = [
        { nome: 'Galinha', icone: '🐔', preco: 30, felicidadeInicial: 100, decremento: 5 },
        { nome: 'Vaca', icone: '🐄', preco: 50, felicidadeInicial: 100, decremento: 8 },
        { nome: 'Porco', icone: '🐖', preco: 40, felicidadeInicial: 100, decremento: 6 }
    ];

    let sementeSelecionada = 0;
    let loopFazendaAtivo = null;

    // Estado inicial da fazenda
    let fazenda = {
        tamanho: 1,
        slots: [],
        sementes: new Array(tiposSementes.length).fill(0),
        dinheiro: 50,
        nivel: 1,
        experiencia: 0,
        expProximoNivel: 50,
        animais: [],
        experienciaPlantas: new Array(tiposSementes.length).fill(0)
    };

// ========== REFERÊNCIAS FIREBASE ==========
// NO TOPO DO ARQUIVO minifazenda_novo.js
let db, userId, ref, set, get, onValue, runTransaction;

function garantirConexaoFirebase() {
    // Tenta pegar do objeto global que o seu script.js configura
    const modulos = window.SantuarioApp?.modulos;
    
    db = modulos?.db || window.SantuarioDB;
    userId = localStorage.getItem('santuario_user_id') || 'desconhecido';
    ref = modulos?.ref;
    set = modulos?.set;
    get = modulos?.get;
    onValue = modulos?.onValue;
    runTransaction = modulos?.runTransaction;

    if (!db || !runTransaction) {
        console.warn("⚠️ Aguardando inicialização completa do Firebase...");
        return false;
    }
    return true;
}

// Função auxiliar para obter runTransaction dinamicamente
function getRunTransaction() {
    return window.SantuarioApp?.modulos?.runTransaction;
}

    // ========== FUNÇÕES AUXILIARES ==========
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
        if (db && ref && set) {
            set(ref(db, 'fazenda/' + userId), fazenda)
                .catch((error) => console.error("Erro ao salvar nuvem:", error));
        }
    }

    // ========== SISTEMA DE CLIMA ==========
    async function obterFatorClima() {
        if (!db || !get) return 1.0;
        try {
            const snapshot = await get(ref(db, 'clima'));
            const clima = snapshot.val() || 'ensolarado';
            const fatores = {
                'ensolarado': 1.0,
                'nublado': 0.9,
                'chuvoso': 0.8,
                'seco': 1.2
            };
            return fatores[clima] || 1.0;
        } catch (e) {
            console.error('Erro ao obter clima:', e);
            return 1.0;
        }
    }

    // ========== CRESCIMENTO OFFLINE ==========
    async function verificarCrescimentoOffline() {
        if (!fazenda || !fazenda.slots) return false;

        const fator = await obterFatorClima();
        const agora = Date.now();
        let mudou = false;

        for (let i = 0; i < fazenda.tamanho; i++) {
            if (!fazenda.slots[i]) continue;
            for (let j = 0; j < fazenda.tamanho; j++) {
                const slot = fazenda.slots[i][j];
                if (slot && slot.estado === 'plantado' && slot.plantadoEm) {
                    const bonus = getBonusPlanta(slot.tipoSemente);
                    const tempoPassado = (agora - slot.plantadoEm) * fator;
                    const tempoNecessario = tiposSementes[slot.tipoSemente].tempo * bonus.tempo;
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

    async function loopCrescimento() {
        if (fazenda && fazenda.slots && fazenda.slots.length > 0) {
            if (await verificarCrescimentoOffline()) {
                renderizarFazenda();
                mostrarToast("🌾 Colheita pronta!");
            }
        }
        atualizarAnimais(); // atualiza felicidade dos animais a cada loop
    }

    // ========== SISTEMA DE ANIMAIS ==========
    function renderizarAnimais() {
    const animaisDiv = document.getElementById('mf-animais');
    if (!animaisDiv) return;
    animaisDiv.innerHTML = '';

    if (fazenda.animais.length === 0) {
        animaisDiv.innerHTML = '<div style="text-align:center; padding:10px; opacity:0.7;">🐾 Nenhum animal ainda.<br>Compre um na loja!</div>';
        return;
    }

    fazenda.animais.forEach((animal, index) => {
        const tipo = tiposAnimais.find(t => t.nome === animal.tipo);
        if (!tipo) return;

        // Define a classe de cor baseada na felicidade
        let classeFelicidade = '';
        if (animal.felicidade >= 70) classeFelicidade = 'alta';
        else if (animal.felicidade >= 30) classeFelicidade = 'media';
        else classeFelicidade = 'baixa';

        const card = document.createElement('div');
        card.className = 'item-animal-card';
        card.setAttribute('title', `Felicidade: ${animal.felicidade}%`); // tooltip nativo

        card.innerHTML = `
            <div class="animal-icone">${tipo.icone}</div>
            <span class="animal-nome">${animal.nome}</span>
            <div class="animal-felicidade">
                <span class="status-felicidade ${classeFelicidade}"></span>
                <span>${animal.felicidade}%</span>
            </div>
            <button class="btn-alimentar-card" data-animal-index="${index}" title="Alimentar (custa 5💰)">🍎</button>
        `;

        // Evento do botão alimentar
        const btnAlimentar = card.querySelector('.btn-alimentar-card');
        btnAlimentar.addEventListener('click', async (e) => {
            e.stopPropagation();
            await alimentarAnimal(index);
        });

        // Opcional: clicar no card também poderia alimentar? Decidi não para evitar acidentes.
        // Se quiser, pode adicionar card.addEventListener('click', ...)

        animaisDiv.appendChild(card);
    });
}

    function atualizarAnimais() {
        const agora = Date.now();
        fazenda.animais.forEach(animal => {
            if (agora - animal.ultimaAlimentacao > 3600000) { // 1 hora
                animal.felicidade = Math.max(0, animal.felicidade - 10);
                animal.ultimaAlimentacao = agora;
            }
        });
    }

    async function alimentarAnimal(index) {
        const animal = fazenda.animais[index];
        if (fazenda.dinheiro >= 5) {
            fazenda.dinheiro -= 5;
            animal.felicidade = Math.min(100, animal.felicidade + 20);
            animal.ultimaAlimentacao = Date.now();
            salvarFazenda();
            renderizarFazenda();
            mostrarToast(`🐔 Alimentou ${animal.nome}!`);
            atualizarEstatistica('totalAlimentacoes');
            await atualizarMetaPorAcao('alimentar');
        } else {
            mostrarToast("❌ Dinheiro insuficiente!");
        }
    }

    // ========== SISTEMA DE NÍVEL POR PLANTA ==========
    function getBonusPlanta(tipoIdx) {
        const exp = fazenda.experienciaPlantas[tipoIdx] || 0;
        if (exp >= 50) return { recompensa: 1.4, tempo: 0.7 };
        if (exp >= 25) return { recompensa: 1.25, tempo: 0.8 };
        if (exp >= 10) return { recompensa: 1.1, tempo: 0.9 };
        return { recompensa: 1.0, tempo: 1.0 };
        
    }

    // ========== MERCADO (PREÇOS VARIÁVEIS) ==========
    async function getPrecoCompra(tipoNome) {
        if (!db || !get) return 10;
        try {
            const snapshot = await get(ref(db, `precosMercado/${tipoNome.toLowerCase()}`));
            return snapshot.val() || 10;
        } catch (e) {
            console.error('Erro ao obter preço:', e);
            return 10;
        }
    }

    // ========== FUNÇÕES DE ESTATÍSTICAS ==========
    async function atualizarEstatistica(campo, incremento = 1) {
    // Se não estiver conectado, tenta conectar agora
    if (!db && !garantirConexaoFirebase()) return;

    const statsRef = ref(db, `jogadores/${userId}/estatisticas/${campo}`);
    
    try {
        await runTransaction(statsRef, (valorAtual) => {
            return (valorAtual || 0) + incremento;
        });
        console.log(`✅ Estatística [${campo}] atualizada!`);
    } catch (e) {
        console.error("❌ Erro ao salvar no Firebase:", e);
    }
}

    function atualizarProgressoMeta(metaId, incremento = 1) {
        const rt = getRunTransaction();
        if (!db || !userId || userId === 'desconhecido' || !rt) return;
        const hoje = new Date().toISOString().split('T')[0];
        const metaRef = ref(db, `metasDiarias/${hoje}/${userId}/${metaId}/progresso`);
        rt(metaRef, (valorAtual) => (valorAtual || 0) + incremento)
            .then(() => verificarMetaCompleta(hoje, metaId))
            .catch(err => console.error('Erro ao atualizar meta:', err));
    }

    async function verificarMetaCompleta(data, metaId) {
        if (!db || !userId) return;
        const metaRef = ref(db, `metasDiarias/${data}/${userId}/${metaId}`);
        const snap = await get(metaRef);
        const meta = snap.val();
        if (meta && meta.progresso >= meta.total && !meta.completo) {
            await set(ref(db, `metasDiarias/${data}/${userId}/${metaId}/completo`), true);
            if (meta.recompensa) {
                fazenda.dinheiro += meta.recompensa;
                salvarFazenda();
                mostrarToast(`🎉 Meta cumprida! Ganhou ${meta.recompensa}💰`);
            }
        }
    }

    async function atualizarMetaPorAcao(tipoAcao, cultura = null) {
        if (!db || !userId || userId === 'desconhecido') return;
        const hoje = new Date().toISOString().split('T')[0];
        const metasRef = ref(db, `metasDiarias/${hoje}/${userId}`);
        const snap = await get(metasRef);
        const metas = snap.val() || {};
        
        for (const [metaId, meta] of Object.entries(metas)) {
            if (meta.completo) continue;
            if (meta.tipo === tipoAcao) {
                if (meta.cultura && meta.cultura !== cultura) continue;
                await atualizarProgressoMeta(metaId, 1);
                break;
            }
        }
    }

    let ouvinteConquistasAtivo = false;

    function renderizarConquistas() {
        const conquistasDiv = document.getElementById('mf-conquistas-lista');
        if (!conquistasDiv || !db || !userId) return;

        // Trava de segurança: evita recriar o ouvinte toda vez que a fazenda atualiza a tela
        if (ouvinteConquistasAtivo) return; 
        ouvinteConquistasAtivo = true;

        const conquistasRef = ref(db, `conquistas/${userId}`);
        
        onValue(conquistasRef, (snapshot) => {
            const conquistas = snapshot.val() || {};
            conquistasDiv.innerHTML = '';

            const listaConquistas = [
                { id: 'primeiraColheita', icone: '🌱', nome: 'Primeira Colheita', desc: 'Colha sua primeira planta' },
                { id: 'mestreMilho', icone: '🌽', nome: 'Mestre Milho', desc: 'Colha 100 milhos' },
                { id: 'jardineiroDedicado', icone: '🌿', nome: 'Jardineiro Dedicado', desc: 'Plante 50 vezes' },
                { id: 'amigoDosAnimais', icone: '🐾', nome: 'Amigo dos Animais', desc: 'Tenha 10 animais' },
            ];

            listaConquistas.forEach(conq => {
                const data = conquistas[conq.id];
                const desbloqueada = data && data.desbloqueada;
                const div = document.createElement('div');
                div.className = `item-conquista ${desbloqueada ? 'desbloqueada' : 'bloqueada'}`;
                div.innerHTML = `
                    <span class="conquista-icone">${conq.icone}</span>
                    <div class="conquista-info">
                        <span class="conquista-nome">${conq.nome}</span>
                        <span class="conquista-desc">${conq.desc}</span>
                    </div>
                    ${desbloqueada ? '<span class="conquista-check">✅</span>' : '<span class="conquista-check">🔒</span>'}
                `;
                conquistasDiv.appendChild(div);
            });
        });
    }

    function renderizarMetasDiarias() {
        const metasDiv = document.getElementById('mf-metas');
        if (!metasDiv || !db || !userId) return;
        const hoje = new Date().toISOString().split('T')[0];
        get(ref(db, `metasDiarias/${hoje}/${userId}`)).then(snap => {
            const metas = snap.val() || {};
            metasDiv.innerHTML = '<h4 style="color: #FFD700; margin-bottom: 10px; text-align: center;">📅 Metas de Hoje</h4>';
            Object.keys(metas).forEach(key => {
                const m = metas[key];
                const percent = (m.progresso / m.total) * 100;
                metasDiv.innerHTML += `
                    <div class="item-meta" style="background: rgba(0,0,0,0.4); border-radius: 10px; padding: 8px; margin-bottom: 8px;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>${m.descricao}</span>
                            <span>${m.completo ? '✅' : ''}</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.2); height: 8px; border-radius: 4px; margin: 5px 0;">
                            <div style="width: ${percent}%; height: 100%; background: #FFD700; border-radius: 4px;"></div>
                        </div>
                        <div style="font-size: 0.8rem;">${m.progresso}/${m.total}</div>
                    </div>
                `;
            });
        });
    }

    // ========== FUNÇÕES DE RENDERIZAÇÃO ==========
    function renderizarFazenda() {
        renderizarGrade();
        renderizarDeposito();
        atualizarInterface();
        renderizarAnimais();
        renderizarConquistas();
        renderizarMetasDiarias();
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
            const nivel = Math.floor((fazenda.experienciaPlantas[idx] || 0) / 10) + 1;
            const item = document.createElement('div');
            item.className = 'item-deposito';
            item.innerHTML = `${tipo.icone} <span style="font-weight:bold; font-size:1.1rem;">${qtd}</span> <span style="font-size:0.7rem;">(Nv.${nivel})</span>`;
            if (qtd <= 0) {
                item.style.opacity = '0.4';
                item.style.filter = 'grayscale(1)';
            } else {
                item.onclick = async () => {
    const precoVenda = await getPrecoCompra(tipo.nome);
    const valor = Math.floor(precoVenda * 0.7);
    fazenda.dinheiro += valor;
    fazenda.sementes[idx]--;
    salvarFazenda();
    renderizarFazenda();
    mostrarToast(`💰 Vendido 1 ${tipo.nome} por ${valor}💰!`);

    // --- Registrar venda no Firebase ---
    const db = getDb();
    const ref = getRef();
    const rt = getRunTransaction();
    if (db && ref && rt) {
        const vendaRef = ref(db, `vendas/${tipo.nome.toLowerCase()}`);
        rt(vendaRef, (valorAtual) => (valorAtual || 0) + 1)
            .catch(err => console.error('Erro ao registrar venda:', err));
    }
    // ----------------------------------
};
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

    // ========== AÇÕES DO JOGADOR ==========
    async function plantar(linha, coluna) {
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

        // Atualiza estatísticas
        atualizarEstatistica('totalPlantios');
        atualizarEstatistica(`${tiposSementes[sementeSelecionada].nome.toLowerCase()}sPlantados`);

        // Atualiza metas
        await atualizarMetaPorAcao('plantar', tiposSementes[sementeSelecionada].nome.toLowerCase());

        salvarFazenda();
        renderizarFazenda();
        tocarSom('plantar');
    }

    async function colher(linha, coluna) {
        const slot = fazenda.slots[linha][coluna];
        if (slot.estado !== 'pronto') return;

        const tipo = tiposSementes[slot.tipoSemente];
        await atualizarMetaPorAcao('colher', tipo.nome.toLowerCase());

        const slotDiv = document.querySelector(`.slot-fazenda[data-linha="${linha}"][data-coluna="${coluna}"]`);
        if (!slotDiv) return;

        // Animações
        slotDiv.style.pointerEvents = 'none';
        const rect = slotDiv.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const bonus = getBonusPlanta(slot.tipoSemente);
        const recompensa = Math.round(tipo.recompensa * bonus.recompensa);

        const floatingText = document.createElement('div');
        floatingText.className = 'floating-text';
        floatingText.innerText = `+${recompensa}💰`;
        floatingText.style.left = `${centerX}px`;
        floatingText.style.top = `${centerY}px`;
        document.body.appendChild(floatingText);
        tocarSom('colher');
confetti({
    particleCount: 40,
    spread: 50,
    origin: { y: 0.7 },
    colors: ['#D4AF37', '#2ecc71', '#ffffff']
});

        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = `${centerX + (Math.random() - 0.5) * 30}px`;
                particle.style.top = `${centerY + (Math.random() - 0.5) * 30}px`;
                document.body.appendChild(particle);
                setTimeout(() => particle.remove(), 600);
            }, i * 30);
        }

        slotDiv.classList.add('colhendo');

        setTimeout(() => {
            floatingText.remove();

            fazenda.dinheiro += recompensa;
            fazenda.experiencia += tipo.exp;
            fazenda.experienciaPlantas[slot.tipoSemente] = (fazenda.experienciaPlantas[slot.tipoSemente] || 0) + 1;

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
            if (subiu) {
    mostrarToast(`🥳 Nível ${fazenda.nivel}!`);
    tocarSom('levelUp');   // <-- adicione esta linha
}

            // Atualiza estatísticas de colheita
            atualizarEstatistica('totalColheitas');
            atualizarEstatistica(`${tipo.nome.toLowerCase()}sColhidos`);

            slot.estado = 'vazio';
            slot.tipoSemente = null;
            slot.plantadoEm = null;

            slotDiv.style.pointerEvents = 'auto';
            salvarFazenda();
            renderizarFazenda();
        }, 400);
    }

    // ========== INICIALIZAÇÃO ==========
    function carregarFazenda() {
        const userId = localStorage.getItem('santuario_user_id') || 'desconhecido';
        if (db && get) {
            get(ref(db, 'fazenda/' + userId)).then(async (snapshot) => {
                if (snapshot.exists()) {
                    fazenda = snapshot.val();
                } else {
                    inicializarNovaFazenda();
                }
                verificarIntegridadeGrade();
                await verificarCrescimentoOffline();
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
                verificarCrescimentoOffline().then(() => renderizarFazenda());
            } catch (e) {
                inicializarNovaFazenda();
                renderizarFazenda();
            }
        } else {
            inicializarNovaFazenda();
            renderizarFazenda();
        }
    }

    function verificarIntegridadeGrade() {
        if (!fazenda.slots || fazenda.slots.length !== fazenda.tamanho) {
            inicializarGrade();
        }
        if (!fazenda.experienciaPlantas) {
            fazenda.experienciaPlantas = new Array(tiposSementes.length).fill(0);
        }
        if (!fazenda.animais) {
            fazenda.animais = [];
        }
    }

    function inicializarNovaFazenda() {
        fazenda = {
            tamanho: 1,
            slots: [],
            sementes: new Array(tiposSementes.length).fill(0),
            dinheiro: 50,
            nivel: 1,
            experiencia: 0,
            expProximoNivel: 50,
            animais: [],
            experienciaPlantas: new Array(tiposSementes.length).fill(0)
        };
        inicializarGrade();
    }

    function animarRega(elemento) {
    tocarSom('regar');
    for (let i = 0; i < 5; i++) {
        const gota = document.createElement('div');
        gota.className = 'gota';
        gota.style.left = Math.random() * 40 + 'px';
        gota.style.top = '-10px';
        elemento.appendChild(gota);
        setTimeout(() => gota.remove(), 600);
    }
}

    // ========== CONTROLE DE ORIENTAÇÃO ==========
    function ajustarLayoutPelaOrientacao() {
    const aviso = document.getElementById('aviso-orientacao');
    const conteudo = document.getElementById('conteudo-minifazenda');
    const container = document.getElementById('container-minifazenda');
    if (!aviso || !conteudo || !container) return;

    if (window.matchMedia("(orientation: portrait)").matches) {
        aviso.classList.remove('escondido');
        conteudo.classList.add('escondido');
    } else {
        aviso.classList.add('escondido');
        conteudo.classList.remove('escondido');
    }
}

    // ========== EXPOR FUNÇÕES GLOBAIS ==========
    window.iniciarMiniFazenda = function() {
        garantirConexaoFirebase();
        
        // Botão comprar semente (o resto do código continua igual...)
        const btnComprar = document.getElementById('mf-btn-comprar-semente');
        if (btnComprar) {
            const novoBtn = btnComprar.cloneNode(true);
            btnComprar.parentNode.replaceChild(novoBtn, btnComprar);
            novoBtn.addEventListener('click', async () => {
                const tipo = tiposSementes[sementeSelecionada];
                if (!tipo) return;
                const preco = await getPrecoCompra(tipo.nome);
                if (fazenda.dinheiro >= preco) {
                    fazenda.dinheiro -= preco;
                    fazenda.sementes[sementeSelecionada]++;
                    salvarFazenda();
                    renderizarFazenda();
                    tocarSom('comprar');
                    mostrarToast(`🌱 ${tipo.nome} comprada por ${preco}💰!`);
                    atualizarEstatistica('totalCompras');
                    await atualizarMetaPorAcao('comprarSemente');
                } else {
                    mostrarToast("❌ Dinheiro insuficiente!");
                }
            });
        }

        // Botões de compra de animal
        document.querySelectorAll('.btn-tipo-animal').forEach(btn => {
            const novoBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(novoBtn, btn);
            novoBtn.addEventListener('click', async () => {
                const animalIdx = parseInt(novoBtn.dataset.animal);
                const tipo = tiposAnimais[animalIdx];
                if (!tipo) return;
                
                if (fazenda.dinheiro < tipo.preco) {
                    mostrarToast("❌ Dinheiro insuficiente!");
                    return;
                }
                
                await atualizarMetaPorAcao('comprarAnimal');
                
                fazenda.dinheiro -= tipo.preco;
                fazenda.animais.push({
                    tipo: tipo.nome,
                    nome: tipo.nome,
                    felicidade: tipo.felicidadeInicial,
                    ultimaAlimentacao: Date.now()
                });
                salvarFazenda();
                renderizarFazenda();
                tocarSom('comprar');
                mostrarToast(`🐣 Você comprou um(a) ${tipo.nome}!`);
                atualizarEstatistica('totalAnimais');
            });
        });

        // Botão reiniciar
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

        // Seleção de sementes
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

        // Controle de abas
        const btnAbaCultivo = document.querySelector('[data-aba="cultivo"]');
        const btnAbaAnimais = document.querySelector('[data-aba="animais"]');
        const btnAbaConquistas = document.querySelector('[data-aba="conquistas"]');
        const abaCultivo = document.getElementById('aba-cultivo');
        const abaAnimais = document.getElementById('aba-animais');
        const abaConquistas = document.getElementById('aba-conquistas');

        function ativarAba(abaNome) {
            document.querySelectorAll('.painel-abas button').forEach(btn => btn.classList.remove('aba-ativa'));
            document.querySelectorAll('.aba-conteudo').forEach(aba => aba.classList.add('escondido'));

            if (abaNome === 'cultivo') {
                btnAbaCultivo.classList.add('aba-ativa');
                abaCultivo.classList.remove('escondido');
            } else if (abaNome === 'animais') {
                btnAbaAnimais.classList.add('aba-ativa');
                abaAnimais.classList.remove('escondido');
                renderizarAnimais();
            } else if (abaNome === 'conquistas') {
                btnAbaConquistas.classList.add('aba-ativa');
                abaConquistas.classList.remove('escondido');
                renderizarConquistas();
                renderizarMetasDiarias();
            }
        }

        btnAbaCultivo.addEventListener('click', () => ativarAba('cultivo'));
        btnAbaAnimais.addEventListener('click', () => ativarAba('animais'));
        btnAbaConquistas.addEventListener('click', () => ativarAba('conquistas'));

        ativarAba('cultivo');

        const btnMilho = document.querySelector('.btn-tipo-semente[data-tipo="0"]');
        if (btnMilho) {
            btnMilho.classList.add('selecionado');
            sementeSelecionada = 0;
        }
        atualizarPrecoBotao();

        // Colapso da seção "Suas sementes"
        function initCollapseSementes() {
            const section = document.querySelector('.deposito-area');
            const btn = document.getElementById('collapseSementesBtn');
            
            if (!section || !btn) return;

            function ajustarAlturaContainer() {
                const header = section.querySelector('.section-header');
                if (!header) return;
                if (section.classList.contains('collapsed')) {
                    const alturaHeader = header.offsetHeight;
                    section.style.height = alturaHeader + 'px';
                } else {
                    section.style.height = '';
                }
            }

            function setCollapseState(collapsed) {
                if (collapsed) {
                    section.classList.add('collapsed');
                    btn.classList.remove('rotated');
                } else {
                    section.classList.remove('collapsed');
                    btn.classList.add('rotated');
                }
                ajustarAlturaContainer();
                localStorage.setItem('sementesCollapsed', collapsed);
            }

            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isCollapsed = section.classList.contains('collapsed');
                setCollapseState(!isCollapsed);
            });

            const header = document.querySelector('.section-header');
            if (header) {
                header.addEventListener('click', (e) => {
                    if (e.target === btn) return;
                    const isCollapsed = section.classList.contains('collapsed');
                    setCollapseState(!isCollapsed);
                });
            }

            const wasCollapsed = localStorage.getItem('sementesCollapsed') === 'true';
            setCollapseState(wasCollapsed);

            window.addEventListener('resize', () => {
                if (section.classList.contains('collapsed')) {
                    ajustarAlturaContainer();
                }
            });
        }

        initCollapseSementes();

        carregarFazenda();

        window.orientacaoListener = ajustarLayoutPelaOrientacao;
        window.addEventListener('orientationchange', window.orientacaoListener);
        window.addEventListener('resize', window.orientacaoListener);
        ajustarLayoutPelaOrientacao();

        if (loopFazendaAtivo) clearInterval(loopFazendaAtivo);
        loopFazendaAtivo = setInterval(async () => {
            await loopCrescimento();
        }, 2000);
    };

    window.toggleInstrucoesMiniFazenda = function() {
        const instrucoes = document.getElementById('instrucoes-minifazenda');
        if (instrucoes) instrucoes.classList.toggle('escondido');
    };
})();