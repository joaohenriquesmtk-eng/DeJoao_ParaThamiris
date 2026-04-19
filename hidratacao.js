// ============================================================================
// HIDRATAÇÃO QUÂNTICA (CRYO-TUBES) - THE TITAN TIER ENGINE
// ============================================================================

window.estadoAgua = {
    metaDiaria: 2000, // 2 Litros
    copo: 250,
    eu: { ml: 0, data: '' },
    parceiro: { ml: 0, data: '' }
};

window.hidratacaoOffNivel = null;
window.hidratacaoTimerEu = null;
window.hidratacaoTimerParceiro = null;
window.hidratacaoAudioCopo = null;

function pegarDataDeHoje() {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

window.inicializarHidratacao = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('hidratacao');
    }

    if (typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();

    console.log("Inicializando Laboratório de Fluidos...");

    const nomeParc = document.getElementById('nome-parceiro-agua');
    if (nomeParc) nomeParc.innerText = window.NOME_PARCEIRO || "Amor";

    if (!window.hidratacaoAudioCopo) {
        window.hidratacaoAudioCopo = new Audio('https://assets.mixkit.co/active_storage/sfx/2405/2405-preview.mp3');
        window.hidratacaoAudioCopo.volume = 0.8;
    }

    window.atualizarOrvalhoUI();
    window.escutarNivelAguaGlobal();
};

window.atualizarOrvalhoUI = function() {
    let orvalho = parseInt(localStorage.getItem('santuario_gotas_orvalho') || '0');
    const badge = document.getElementById('hidratacao-orvalho-hud');
    if (badge) badge.innerText = orvalho;
};

window.toggleInstrucoesHidratacao = function() {
    const inst = document.getElementById('instrucoes-hidratacao');
    if (inst) inst.classList.toggle('escondido');
};

// --- EFEITO DE PARTÍCULAS (BOLHAS) ---
window.gerarBolhas = function(containerId, quantidade) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const quantidadeFinal = Math.min(quantidade, 8);
    for (let i = 0; i < quantidadeFinal; i++) {
        const bolha = document.createElement('div');
        bolha.classList.add('bolha-h2o');
        
        // Randomiza tamanho, posição X e velocidade
        const size = Math.random() * 8 + 4; // 4px a 12px
        const left = Math.random() * 80 + 10; // 10% a 90%
        const vel = Math.random() * 2 + 1.5; // 1.5s a 3.5s

        bolha.style.width = `${size}px`;
        bolha.style.height = `${size}px`;
        bolha.style.left = `${left}%`;
        bolha.style.setProperty('--velocidade', `${vel}s`);

        container.appendChild(bolha);

        // Remove a bolha do DOM quando a animação acaba para não pesar a memória
        setTimeout(() => {
            if (bolha.parentNode) bolha.parentNode.removeChild(bolha);
        }, vel * 1000);
    }
};

// --- FÍSICA NO DOM (ATUALIZADA PARA O CILINDRO) ---
function atualizarTanqueAgua(quem, mlDepositado) {
    const meta = window.estadoAgua.metaDiaria;
    const porcentagem = Math.min((mlDepositado / meta) * 100, 100);

    const liquidoEl = document.getElementById(`liquido-${quem}`);
    const valorEl = document.getElementById(`valor-ml-${quem}`);

    if (liquidoEl) liquidoEl.style.height = `${porcentagem}%`;

    if (!valorEl) return;

    let timerKey = quem === 'eu' ? 'hidratacaoTimerEu' : 'hidratacaoTimerParceiro';

    if (window[timerKey]) {
        clearInterval(window[timerKey]);
        window[timerKey] = null;
    }

    let atual = parseInt(valorEl.innerText) || 0;
    if (atual === mlDepositado) return;

    if (mlDepositado > atual) {
        window.gerarBolhas(`bolhas-container-${quem}`, 8);
    }

    let incremento = Math.ceil(Math.abs(mlDepositado - atual) / 15);

    window[timerKey] = setInterval(() => {
        if (atual < mlDepositado) {
            atual += incremento;
            if (atual > mlDepositado) atual = mlDepositado;
        } else {
            atual -= incremento;
            if (atual < mlDepositado) atual = mlDepositado;
        }

        valorEl.innerText = atual;

        if (atual === mlDepositado) {
            clearInterval(window[timerKey]);
            window[timerKey] = null;
        }
    }, 30);

    if (window.SantuarioRuntime && window[timerKey]) {
        window.SantuarioRuntime.addInterval('hidratacao', window[timerKey]);
    }
}

// --- COMUNICAÇÃO FIREBASE ---
window.escutarNivelAguaGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    const refAgua = ref(db, 'saude/hidratacao');
    
    window.hidratacaoOffNivel = onValue(refAgua, (snapshot) => {
        const dados = snapshot.val();
        const hoje = pegarDataDeHoje();

        // 1. Processa EU
        if (dados && dados[window.MEU_NOME]) {
            const meuDado = dados[window.MEU_NOME];
            if (meuDado.data === hoje) {
                window.estadoAgua.eu.ml = meuDado.ml;
            } else {
                window.estadoAgua.eu.ml = 0; 
                set(ref(db, `saude/hidratacao/${window.MEU_NOME}`), { ml: 0, data: hoje, metaAlcancada: false });
            }
        } else {
            window.estadoAgua.eu.ml = 0;
        }

        // 2. Processa PARCEIRO
        const statusParceiro = document.getElementById('status-agua-parceiro');
        if (dados && dados[window.NOME_PARCEIRO]) {
            const parceiroDado = dados[window.NOME_PARCEIRO];
            if (parceiroDado.data === hoje) {
                window.estadoAgua.parceiro.ml = parceiroDado.ml;
                statusParceiro.innerText = "Sincronizado ✅";
                statusParceiro.style.color = "#00ffcc";
            } else {
                window.estadoAgua.parceiro.ml = 0;
                statusParceiro.innerText = "Seco Hoje 🏜️";
                statusParceiro.style.color = "#e74c3c";
            }
        } else {
            window.estadoAgua.parceiro.ml = 0;
            statusParceiro.innerText = "Aguardando...";
            statusParceiro.style.color = "#aaa";
        }

        // 3. Renderiza a Física na Tela
        atualizarTanqueAgua('eu', window.estadoAgua.eu.ml);
        atualizarTanqueAgua('parceiro', window.estadoAgua.parceiro.ml);
        
        checarMetaDiaria(dados);
    });
    if (window.SantuarioRuntime && window.hidratacaoOffNivel) {
        window.SantuarioRuntime.addCleanup('hidratacao', window.hidratacaoOffNivel);
    }
};

window.registrarCopoAgua = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    
    // SFX Imersivo
    if (!window.hidratacaoAudioCopo) {
        window.hidratacaoAudioCopo = new Audio('https://assets.mixkit.co/active_storage/sfx/2405/2405-preview.mp3');
        window.hidratacaoAudioCopo.volume = 0.8;
    }

    window.hidratacaoAudioCopo.currentTime = 0;
    if (window.safePlayMedia) {
        window.safePlayMedia(window.hidratacaoAudioCopo);
    } else {
        window.hidratacaoAudioCopo.play().catch(() => {});
    }

    if (window.Haptics && window.safeVibrate) window.safeVibrate([40, 60, 40, 60, 150]);

    const hoje = pegarDataDeHoje();
    const novoNivel = window.estadoAgua.eu.ml + window.estadoAgua.copo;
    
    // Atualização Otimista
    window.estadoAgua.eu.ml = novoNivel;
    atualizarTanqueAgua('eu', novoNivel);

    // Salva na Nuvem
    const { db, ref, set } = window.SantuarioApp.modulos;
    set(ref(db, `saude/hidratacao/${window.MEU_NOME}`), {
        ml: novoNivel,
        data: hoje,
        metaAlcancada: (novoNivel >= window.estadoAgua.metaDiaria)
    });
};

function checarMetaDiaria(dadosGlobais) {
    if (!dadosGlobais) return;
    
    const euDado = dadosGlobais[window.MEU_NOME];
    const msgTela = document.getElementById('msg-meta-diaria');
    const chaveConquistaLocal = `agua_meta_${pegarDataDeHoje()}`; 

    if (euDado && euDado.ml >= window.estadoAgua.metaDiaria && !localStorage.getItem(chaveConquistaLocal)) {
        
        window.safeSetItem(localStorage, chaveConquistaLocal, 'true');
        
        if (window.Haptics && window.safeVibrate) window.safeVibrate([100, 200, 500]);
        if(typeof confetti === 'function') confetti({colors: ['#00d4ff', '#00ffcc', '#ffffff'], particleCount: 200, spread: 120, origin: {y: 0.8}});
        
        let orvalhoTotal = parseInt(localStorage.getItem('santuario_gotas_orvalho') || '0') + 1;
        localStorage.setItem('santuario_gotas_orvalho', orvalhoTotal);
        window.atualizarOrvalhoUI();

        // 🚨 INFLAÇÃO DO BEM: Recompensa multiplicada de 100 para 250!
        if (typeof atualizarPontosCasal === 'function') atualizarPontosCasal(250, "Meta de Hidratação Atingida");

        msgTela.innerText = "Corpo 100% Hidratado! +1 Gota de Orvalho e +250💰!";
        msgTela.style.opacity = 1;

        if(typeof mostrarToast === 'function') mostrarToast("Sintese Celular Completa! +250💰", "💧");
    } else if (euDado && euDado.ml >= window.estadoAgua.metaDiaria) {
        msgTela.innerText = "Manutenção Vital Estável.";
        msgTela.style.opacity = 1;
    } else {
        msgTela.style.opacity = 0;
    }
}