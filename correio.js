// ============================================================================
// CORREIO ELEGANTE (LOGÍSTICA DO AFETO) - GOD TIER ENGINE
// ============================================================================

window.TEMPO_TRANSITO_MS = 12 * 60 * 60 * 1000; // 12 Horas de Delay
window.correioOffCartas = null;
window.correioIntervalRender = null;
window.correioAudioSelo = null;

window.inicializarCorreio = function() {
    console.log("Servidores Postais God Tier Online.");

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('correio');
    }

    if (!window.correioAudioSelo) {
        window.correioAudioSelo = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        window.correioAudioSelo.volume = 0.4;
    }

    window.escutarCartasGlobais();

    window.correioIntervalRender = setInterval(window.renderizarListaDeCartas, 30000);
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addInterval('correio', window.correioIntervalRender);
    }
};

window.toggleInstrucoesCorreio = function() {
    const inst = document.getElementById('instrucoes-correio');
    if (inst) inst.classList.toggle('escondido');
};

window.abrirModalEscrita = function() {
    document.getElementById('modal-escrita-carta').classList.remove('escondido');
    const nomeEl = document.getElementById('nome-assinatura-redacao');
    if(nomeEl) nomeEl.innerText = window.MEU_NOME || "Eu";
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.fecharModalEscrita = function() {
    document.getElementById('modal-escrita-carta').classList.add('escondido');
    document.getElementById('input-texto-carta').value = "";
};

window.enviarCartaCorreio = function() {
    const texto = document.getElementById('input-texto-carta').value.trim();
    if (!texto) return;

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, push } = window.SantuarioApp.modulos;
    
    // Criptografa para ninguém ler do banco de dados direto
    const textoSeguro = window.SantuarioCrypto ? window.SantuarioCrypto.codificar(texto) : texto;

    push(ref(db, 'utilitarios/correio'), {
        remetente: window.MEU_NOME,
        destinatario: window.NOME_PARCEIRO,
        conteudo: textoSeguro,
        timestampEnvio: Date.now(),
        lida: false
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Envelope lacrado. Mensageiro em rota.", "✉️");
        if(window.Haptics) window.Haptics.sucesso();
        window.fecharModalEscrita();
    });
};

window.escutarCartasGlobais = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;

    window.correioOffCartas = onValue(ref(db, 'utilitarios/correio'), (snapshot) => {
        window.bancoCartas = snapshot.val() || {};
        window.renderizarListaDeCartas();
    });

    if (window.SantuarioRuntime && window.correioOffCartas) {
        window.SantuarioRuntime.addCleanup('correio', window.correioOffCartas);
    }
};

// 🚨 A MÁGICA FÍSICA: Abre o envelope em 3 etapas
window.quebrarSeloEAbrir = function(idCarta, elementoSelo) {
    const envelopePai = document.getElementById(`env-${idCarta}`);
    if(!envelopePai) return;

    // 1. Som tátil forte de cera quebrando
    if (window.Haptics && window.safeVibrate) window.safeVibrate([100, 30, 50]);

    if (!window.correioAudioSelo) {
        window.correioAudioSelo = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        window.correioAudioSelo.volume = 0.4;
    }

    window.correioAudioSelo.currentTime = 0;
    if (window.safePlayMedia) {
        window.safePlayMedia(window.correioAudioSelo);
    } else {
        window.correioAudioSelo.play().catch(() => {});
    }

    // 2. Aciona o CSS que rotaciona a aba e sobe o papel
    envelopePai.classList.add('envelope-aberto');
    elementoSelo.style.pointerEvents = "none";

    // 3. Atualiza no Firebase como LIDA silenciosamente
    setTimeout(() => {
        if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
        const { db, ref, update } = window.SantuarioApp.modulos;
        update(ref(db, `utilitarios/correio/${idCarta}`), { lida: true });
    }, 1500); // Dá tempo da animação rolar
};

window.renderizarListaDeCartas = function() {
    const lista = document.getElementById('lista-cartas-correio');
    const rotaSvg = document.getElementById('rota-ativa-svg');
    if (!lista) return;
    
    lista.innerHTML = "";

    const agora = Date.now();
    const cartas = Object.keys(window.bancoCartas).map(id => ({ id, ...window.bancoCartas[id] }));
    
    cartas.sort((a, b) => b.timestampEnvio - a.timestampEnvio);

    let maiorProgresso = 0;

    cartas.forEach(carta => {
        if (carta.destinatario !== window.MEU_NOME && carta.remetente !== window.MEU_NOME) return;

        const tempoPassado = agora - carta.timestampEnvio;
        const progresso = Math.min((tempoPassado / window.TEMPO_TRANSITO_MS) * 100, 100);
        
        if (progresso < 100 && progresso > maiorProgresso) maiorProgresso = progresso;

        // Descriptografa o texto
        const textoLegivel = window.SantuarioCrypto ? window.SantuarioCrypto.decodificar(carta.conteudo) : carta.conteudo;
        const div = document.createElement('div');
        
        if (progresso < 100) {
            // CARTA EM ROTA (Apenas um card tático de transporte)
            div.innerHTML = `
                <div class="envelope-transito">
                    <div style="font-family: monospace; font-size: 0.7rem; color: #D4AF37; display:flex; justify-content:space-between;">
                        <span>De: ${carta.remetente.toUpperCase()}</span>
                        <span>Carga Selada 🔒</span>
                    </div>
                    <div class="barra-transito-bg">
                        <div class="barra-transito-fill" style="width: ${progresso}%"></div>
                    </div>
                    <span style="font-size: 0.7rem; color: #888; font-family: monospace;">FALTAM: ${Math.ceil((window.TEMPO_TRANSITO_MS - tempoPassado) / 3600000)} HORAS</span>
                </div>
            `;
        } else {
            // CARTA ENTREGUE
            const lida = carta.lida;
            const foiPraMim = carta.destinatario === window.MEU_NOME;
            
            // Se for para mim e não lida, ela nasce FECHADA. Se já foi lida (ou fui eu que mandei), nasce ABERTA.
            const classeEstado = (foiPraMim && !lida) ? "" : "envelope-aberto";
            const seloOculto = (foiPraMim && !lida) ? "" : "style='opacity:0; pointer-events:none;'";
            
            const dataFormatada = new Date(carta.timestampEnvio + window.TEMPO_TRANSITO_MS).toLocaleDateString('pt-BR');

            div.innerHTML = `
                <div class="container-carta-3d" style="margin-bottom: ${lida || !foiPraMim ? '120px' : '0'};">
                    <div id="env-${carta.id}" class="envelope-fisico ${classeEstado}">
                        
                        <div class="papel-timbrado-interno">
                            <div style="font-family:monospace; font-size:0.6rem; color:#888; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:15px;">Entregue em: ${dataFormatada}</div>
                            <div style="white-space: pre-wrap; font-size: 1.1rem;">${textoLegivel}</div>
                            <div style="margin-top:20px; text-align:right; font-style:italic; color:#666;">— ${carta.remetente}</div>
                        </div>

                        <div class="aba-esquerda"></div>
                        <div class="aba-direita"></div>
                        <div class="aba-inferior"></div>
                        <div class="aba-superior"></div>
                        
                        <div class="selo-cera-real" ${seloOculto} onclick="window.quebrarSeloEAbrir('${carta.id}', this)"></div>
                        
                    </div>
                </div>
            `;
        }
        lista.appendChild(div);
    });

    // Atualiza HUD Principal do Radar
    if (rotaSvg) {
        // stroke-dashoffset vai de 350 (vazio) a 0 (cheio)
        const offset = 350 - (350 * (maiorProgresso / 100));
        rotaSvg.style.strokeDashoffset = offset;
        const statusRadar = document.getElementById('status-envio');
        if(statusRadar) {
            statusRadar.innerText = maiorProgresso > 0 ? "MENSAGEIRO EM ROTA" : "SISTEMA OCIOSO";
            statusRadar.style.color = maiorProgresso > 0 ? "#D4AF37" : "#888";
        }
    }
};