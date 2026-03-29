// ============================================================================
// ROTA DE ESCOAMENTO (PIPE MANIA AGRONÔMICO) - THE GOD TIER ENGINE
// ============================================================================

window.estadoLogistica = {
    jogando: false,
    tempoRestante: 60,
    timerId: null,
    grid: [], // Matriz 5x5
    historicoVitorias: 0
};

// SVG Paths Imaculados (100x100 viewBox). Corrente = stroke="currentColor"
const SVGS = {
    'I': '<path d="M 50 0 L 50 100" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="square"/>',
    'L': '<path d="M 50 0 L 50 50 L 100 50" fill="none" stroke="currentColor" stroke-width="20" stroke-linejoin="miter" stroke-linecap="square"/>',
    'T': '<path d="M 0 50 L 100 50 M 50 50 L 50 100" fill="none" stroke="currentColor" stroke-width="20" stroke-linejoin="miter" stroke-linecap="square"/>',
    'X': '<path d="M 0 50 L 100 50 M 50 0 L 50 100" fill="none" stroke="currentColor" stroke-width="20" stroke-linecap="square"/>',
    'S': '<circle cx="50" cy="50" r="22" fill="currentColor"/><path d="M 50 50 L 100 50" fill="none" stroke="currentColor" stroke-width="24"/>',
    'E': '<path d="M 50 0 L 50 50" fill="none" stroke="currentColor" stroke-width="24"/><rect x="25" y="50" width="50" height="25" fill="currentColor" rx="4"/>'
};

// Direções: 0=Top, 1=Right, 2=Bottom, 3=Left
const PORTAS_BASE = {
    'I': [0, 2],
    'L': [0, 1],
    'T': [1, 2, 3], 
    'X': [0, 1, 2, 3],
    'S': [1], // Silo sempre manda pra Direita no rot 0
    'E': [0]  // Porto sempre recebe de Cima no rot 0
};

// Plantas Baixas (Níveis 5x5 Garantidos Solucionáveis)
const PLANTAS_NIVEIS = [
    [ // Nível 1
        [{t:'S', r:0}, {t:'I', r:1}, {t:'L', r:2}, {t:'T', r:0}, {t:'I', r:1}],
        [{t:'L', r:1}, {t:'X', r:0}, {t:'I', r:0}, {t:'L', r:3}, {t:'T', r:2}],
        [{t:'I', r:0}, {t:'T', r:1}, {t:'L', r:0}, {t:'L', r:1}, {t:'X', r:0}],
        [{t:'X', r:0}, {t:'L', r:2}, {t:'T', r:3}, {t:'I', r:0}, {t:'L', r:0}],
        [{t:'T', r:1}, {t:'I', r:1}, {t:'L', r:1}, {t:'L', r:0}, {t:'E', r:0}]
    ],
    [ // Nível 2
        [{t:'S', r:0}, {t:'L', r:2}, {t:'X', r:0}, {t:'L', r:2}, {t:'L', r:3}],
        [{t:'T', r:1}, {t:'I', r:0}, {t:'L', r:0}, {t:'I', r:0}, {t:'I', r:0}],
        [{t:'L', r:1}, {t:'L', r:3}, {t:'I', r:1}, {t:'L', r:3}, {t:'I', r:0}],
        [{t:'I', r:0}, {t:'L', r:0}, {t:'L', r:2}, {t:'X', r:0}, {t:'L', r:3}],
        [{t:'L', r:0}, {t:'I', r:1}, {t:'L', r:3}, {t:'T', r:2}, {t:'E', r:0}]
    ]
];

window.inicializarLogistica = function() {
    if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI(); // 🚨 PUXA O SALDO
    console.log("Abrindo Planta de Escoamento...");
    const hist = parseInt(localStorage.getItem('santuario_logistica_vitorias') || '0');
    window.estadoLogistica.historicoVitorias = hist;
    document.getElementById('logistica-contratos-hud').innerText = hist;
    
    document.getElementById('logistica-painel-inicio').classList.remove('escondido');
    document.getElementById('logistica-tabuleiro').innerHTML = '';
    window.pararTimerLogistica();
};

window.toggleInstrucoesLogistica = function() {
    const inst = document.getElementById('instrucoes-logistica');
    if (inst) inst.classList.toggle('escondido');
};

window.iniciarPartidaLogistica = function() {
    document.getElementById('logistica-painel-inicio').classList.add('escondido');
    
    // Escolhe mapa aleatório
    const plantaEscolhida = PLANTAS_NIVEIS[Math.floor(Math.random() * PLANTAS_NIVEIS.length)];
    
    // Constrói a Grid copiando o blueprint e embaralhando a rotação (Exceto S e E)
    window.estadoLogistica.grid = plantaEscolhida.map(row => 
        row.map(cell => ({
            t: cell.t,
            r: (cell.t === 'S' || cell.t === 'E') ? cell.r : Math.floor(Math.random() * 4), // 0,1,2,3
            fluxo: false
        }))
    );

    window.estadoLogistica.jogando = true;
    window.estadoLogistica.tempoRestante = 60;
    window.renderizarTabuleiroLogistica();
    window.atualizarFluxoEletrico();
    window.iniciarTimerLogistica();
    
    if(window.Haptics) navigator.vibrate([100, 50, 100]); // Motor ligando
};

// Transforma o número de rotação (0-3) em graus
function getRotacaoDeg(r) { return r * 90; }

// Retorna as portas abertas baseadas na rotação atual
function getPortasAbertas(tipo, rot) {
    return PORTAS_BASE[tipo].map(p => (p + rot) % 4);
}

window.renderizarTabuleiroLogistica = function() {
    const tabuleiro = document.getElementById('logistica-tabuleiro');
    tabuleiro.innerHTML = '';

    for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
            const tile = window.estadoLogistica.grid[y][x];
            
            const div = document.createElement('div');
            div.className = `tile-logistica ${tile.fluxo ? 'fluxo-ativo' : ''} ${(tile.t === 'S' || tile.t === 'E') ? 'nao-interativo' : ''}`;
            
            let badges = '';
            if (tile.t === 'S') badges = '<div class="badge-silo">S</div>';
            if (tile.t === 'E') badges = '<div class="badge-porto">P</div>';

            div.innerHTML = `
                ${badges}
                <svg viewBox="0 0 100 100" style="transform: rotate(${getRotacaoDeg(tile.r)}deg);">
                    ${SVGS[tile.t]}
                </svg>
            `;

            if (tile.t !== 'S' && tile.t !== 'E' && window.estadoLogistica.jogando) {
                div.onclick = () => window.girarTile(y, x);
            }

            tabuleiro.appendChild(div);
        }
    }
};

window.girarTile = function(y, x) {
    if (!window.estadoLogistica.jogando) return;
    
    const tile = window.estadoLogistica.grid[y][x];
    tile.r = (tile.r + 1) % 4; // Gira 90 graus
    
    if(window.Haptics) window.Haptics.toqueLeve();
    
    // Opcional: Som mecânico de catraca
    const clickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    clickSound.volume = 0.2; clickSound.playbackRate = 2.0; clickSound.play().catch(e=>{});

    window.atualizarFluxoEletrico(); // A Mágica do Pathfinding acontece aqui!
};

// O Algoritmo de Busca em Profundidade (DFS)
window.atualizarFluxoEletrico = function() {
    const grid = window.estadoLogistica.grid;
    
    // 1. Reseta todo o fluxo
    for(let y=0; y<5; y++) for(let x=0; x<5; x++) grid[y][x].fluxo = false;

    // 2. Encontra o Silo (S)
    let startY = 0, startX = 0;
    for(let y=0; y<5; y++) for(let x=0; x<5; x++) if (grid[y][x].t === 'S') { startY = y; startX = x; }

    // 3. Pilha para explorar
    let pilha = [[startY, startX]];
    grid[startY][startX].fluxo = true;
    let vitoria = false;

    while(pilha.length > 0) {
        let [y, x] = pilha.pop();
        let tile = grid[y][x];
        
        if (tile.t === 'E') { vitoria = true; }

        let portasOut = getPortasAbertas(tile.t, tile.r);
        
        portasOut.forEach(dir => {
            let ny = y + (dir === 2 ? 1 : dir === 0 ? -1 : 0);
            let nx = x + (dir === 1 ? 1 : dir === 3 ? -1 : 0);

            // Se vizinho está dentro do grid
            if(ny >= 0 && ny < 5 && nx >= 0 && nx < 5) {
                let nTile = grid[ny][nx];
                if (!nTile.fluxo) {
                    let portasIn = getPortasAbertas(nTile.t, nTile.r);
                    let direcaoOposta = (dir + 2) % 4; // A porta do vizinho tem que olhar pra mim
                    
                    if(portasIn.includes(direcaoOposta)) {
                        nTile.fluxo = true;
                        pilha.push([ny, nx]);
                    }
                }
            }
        });
    }

    window.renderizarTabuleiroLogistica();

    if (vitoria && window.estadoLogistica.jogando) {
        window.finalizarPartidaComVitoria();
    }
};

window.iniciarTimerLogistica = function() {
    window.pararTimerLogistica();
    const barra = document.getElementById('logistica-timer-barra');
    const texto = document.getElementById('logistica-timer-texto');
    
    barra.classList.remove('timer-critico');
    barra.style.width = '100%';

    window.estadoLogistica.timerId = setInterval(() => {
        window.estadoLogistica.tempoRestante--;
        const tempo = window.estadoLogistica.tempoRestante;
        const porcentagem = (tempo / 60) * 100;
        
        texto.innerText = `${tempo}s`;
        barra.style.width = `${porcentagem}%`;

        if (tempo <= 10) {
            barra.classList.add('timer-critico');
            if(window.Haptics) navigator.vibrate(50); // Batimento cardíaco de tensão
        }

        if (tempo <= 0) {
            window.finalizarPartidaComDerrota();
        }
    }, 1000);
};

window.pararTimerLogistica = function() {
    if (window.estadoLogistica.timerId) clearInterval(window.estadoLogistica.timerId);
    document.getElementById('logistica-timer-barra').style.width = '100%';
    document.getElementById('logistica-timer-texto').innerText = '60s';
};

window.finalizarPartidaComVitoria = function() {
    window.estadoLogistica.jogando = false;
    window.pararTimerLogistica();

    if(window.Haptics) navigator.vibrate([100, 100, 400]);
    if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#2ecc71'], particleCount: 200, spread: 100});
    
    // 🚨 INFLAÇÃO DO BEM: Recompensa aumentada de 50 para 300!
    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(300, "Contrato Logístico Cumprido!");
    
    window.estadoLogistica.historicoVitorias++;
    localStorage.setItem('santuario_logistica_vitorias', window.estadoLogistica.historicoVitorias);
    document.getElementById('logistica-contratos-hud').innerText = window.estadoLogistica.historicoVitorias;

    setTimeout(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Rota Estabelecida! +300💰", "🚢"); // 🚨 ATUALIZADO
        document.getElementById('logistica-painel-inicio').classList.remove('escondido');
        document.querySelector('#logistica-painel-inicio h2').innerText = "Carga Entregue!";
        document.querySelector('#logistica-painel-inicio p').innerText = "Você faturou R$ 300. Pronto para o próximo contrato?";
    }, 1500);
};

window.finalizarPartidaComDerrota = function() {
    window.estadoLogistica.jogando = false;
    window.pararTimerLogistica();
    
    if(window.Haptics) window.Haptics.erro();
    if(typeof mostrarToast === 'function') mostrarToast("O navio partiu! Contrato perdido.", "⏳");

    setTimeout(() => {
        document.getElementById('logistica-painel-inicio').classList.remove('escondido');
        document.querySelector('#logistica-painel-inicio h2').innerText = "Navio Partiu";
        document.querySelector('#logistica-painel-inicio p').innerText = "A rodovia não foi entregue a tempo. Tente novamente.";
    }, 1000);
};