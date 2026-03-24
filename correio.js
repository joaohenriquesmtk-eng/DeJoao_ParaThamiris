// ============================================================================
// CORREIO ELEGANTE (LOGÍSTICA DO AFETO) - TITAN TIER SUPREMO
// ============================================================================

window.TEMPO_TRANSITO_MS = 12 * 60 * 60 * 1000; // 12 Horas Fixas

window.inicializarCorreio = function() {
    console.log("Acionando Protocolo Postal Titan...");
    window.escutarCartasGlobais();
    setInterval(() => {
        window.renderizarListaDeCartas();
    }, 60000); // Atualiza telemetria a cada minuto
};

window.toggleInstrucoesCorreio = function() {
    const inst = document.getElementById('instrucoes-correio');
    if (inst) inst.classList.toggle('escondido');
};

window.abrirModalEscrita = function() {
    document.getElementById('modal-escrita-carta').classList.remove('escondido');
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
    
    push(ref(db, 'utilitarios/correio'), {
        remetente: window.MEU_NOME,
        destinatario: window.NOME_PARCEIRO,
        conteudo: texto,
        timestampEnvio: Date.now(),
        lida: false
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Documento entregue ao mensageiro.", "📜");
        if(window.Haptics) window.Haptics.sucesso();
        window.fecharModalEscrita();
    });
};

window.escutarCartasGlobais = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, 'utilitarios/correio'), (snapshot) => {
        window.bancoCartas = snapshot.val() || {};
        window.renderizarListaDeCartas();
    });
};

window.abrirCartaTitan = function(idCarta, elementoLacre) {
    elementoLacre.classList.add('lacre-quebrando');
    
    // SFX de lacre partindo
    const crackSom = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    crackSom.playbackRate = 2; crackSom.volume = 0.5; crackSom.play().catch(e=>{});
    
    if(window.Haptics) navigator.vibrate([30, 100]);

    setTimeout(() => {
        if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
        const { db, ref, update } = window.SantuarioApp.modulos;
        update(ref(db, `utilitarios/correio/${idCarta}`), { lida: true });
    }, 600);
};

window.renderizarListaDeCartas = function() {
    const lista = document.getElementById('lista-cartas-correio');
    const rotaSvg = document.getElementById('rota-ativa-svg');
    if (!lista) return;
    lista.innerHTML = "";

    const agora = Date.now();
    const cartas = Object.keys(window.bancoCartas).map(id => ({ id, ...window.bancoCartas[id] }));
    
    // Ordenação Cronológica
    cartas.sort((a, b) => b.timestampEnvio - a.timestampEnvio);

    let maiorProgresso = 0;

    cartas.forEach(carta => {
        if (carta.destinatario !== window.MEU_NOME && carta.remetente !== window.MEU_NOME) return;

        const tempoPassado = agora - carta.timestampEnvio;
        const progresso = Math.min((tempoPassado / window.TEMPO_TRANSITO_MS) * 100, 100);
        
        if (progresso < 100 && progresso > maiorProgresso) maiorProgresso = progresso;

        const div = document.createElement('div');
        
        if (progresso < 100) {
            // CARTA EM TRÂNSITO (ENVELOPE LACRADO COM INFOS DE ROTA)
            div.innerHTML = `
                <div class="envelope-titan">
                    <div style="font-family: monospace; font-size: 0.7rem; color: #5d0000; margin-bottom: 20px; opacity: 0.6;">EM TRÂNSITO GEOGRÁFICO</div>
                    <div class="lacre-cera-titan" style="cursor: default; opacity: 0.8; filter: grayscale(0.5);"></div>
                    <div style="margin-top: 20px; text-align: center;">
                        <span style="display:block; color: #2c3e50; font-family: 'Playfair Display';">Para: ${carta.destinatario}</span>
                        <div style="width: 150px; height: 2px; background: rgba(0,0,0,0.1); margin: 10px auto;">
                            <div style="width: ${progresso}%; height: 100%; background: #6ab04c;"></div>
                        </div>
                        <span style="font-size: 0.7rem; color: #888; font-family: monospace;">ENTREGA ESTIMADA: ${Math.ceil((window.TEMPO_TRANSITO_MS - tempoPassado) / 3600000)} HORAS</span>
                    </div>
                </div>
            `;
        } else {
            // CARTA ENTREGUE
            if (carta.destinatario === window.MEU_NOME && !carta.lida) {
                div.innerHTML = `
                    <div class="envelope-titan" style="border-color: #6ab04c; box-shadow: 0 0 30px rgba(106,176,76,0.2);">
                        <div style="color: #6ab04c; font-family: monospace; font-size: 0.7rem; margin-bottom: 20px; font-weight: bold; letter-spacing: 2px;">MENSAGEIRO NO LOCAL</div>
                        <div class="lacre-cera-titan" onclick="window.abrirCartaTitan('${carta.id}', this)"></div>
                        <div style="margin-top: 20px; text-align: center;">
                            <span style="color: #2c3e50; font-family: 'Playfair Display'; font-weight: bold;">Correspondência de ${carta.remetente}</span>
                            <p style="font-size: 0.6rem; color: #888; text-transform: uppercase; margin-top: 10px;">Toque para quebrar o lacre</p>
                        </div>
                    </div>
                `;
            } else {
                // CARTA JÁ ABERTA
                div.innerHTML = `
                    <div class="papel-carta-titan">
                        <div style="font-size: 0.7rem; color: #999; margin-bottom: 20px; font-family: monospace; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                            ARQUIVADO EM ${new Date(carta.timestampEnvio).toLocaleDateString()} • ORIGEM: ${carta.remetente}
                        </div>
                        <div style="min-height: 100px;">${carta.conteudo.replace(/\n/g, '<br>')}</div>
                        <div style="margin-top: 30px; text-align: right; font-style: italic; opacity: 0.7;">— Assinado, ${carta.remetente}</div>
                    </div>
                `;
            }
        }
        lista.appendChild(div);
    });

    // Atualiza o rastro de luz no mapa (stroke-dashoffset vai de 300 a 0)
    if (rotaSvg) {
        const offset = 300 - (300 * (maiorProgresso / 100));
        rotaSvg.style.strokeDashoffset = offset;
        document.getElementById('status-envio').innerText = maiorProgresso > 0 ? "EM TRÂNSITO" : "AGUARDANDO";
    }
};