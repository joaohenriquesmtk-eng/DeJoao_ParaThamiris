// ============================================================================
// PAUTA DE AUDIÊNCIAS (RELÓGIO DO DESTINO) - TITAN TIER ENGINE
// ============================================================================

window.bancoEventos = {};
window.loopRelogiosGlobais = null;

window.inicializarAgenda = function() {
    console.log("Iniciando Astrolábio Temporal...");
    window.escutarAgendaGlobal();
    
    if (window.loopRelogiosGlobais) clearInterval(window.loopRelogiosGlobais);
    window.loopRelogiosGlobais = setInterval(window.processarTickDosRelogios, 1000);
};

window.toggleInstrucoesAgenda = function() {
    const inst = document.getElementById('instrucoes-agenda');
    if (inst) inst.classList.toggle('escondido');
};

window.selecionarIconeAgenda = function(botaoEl, icone) {
    document.querySelectorAll('.btn-icone-titan').forEach(b => b.classList.remove('ativo'));
    botaoEl.classList.add('ativo');
    document.getElementById('agenda-input-icone').value = icone;
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.abrirModalNovaAudiencia = function() {
    const modal = document.getElementById('modal-nova-audiencia');
    if (modal) modal.classList.remove('escondido');
    
    const agora = new Date();
    agora.setMinutes(agora.getMinutes() - agora.getTimezoneOffset());
    document.getElementById('agenda-input-data').value = agora.toISOString().slice(0,16);
    
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.fecharModalNovaAudiencia = function() {
    const modal = document.getElementById('modal-nova-audiencia');
    if (modal) modal.classList.add('escondido');
    document.getElementById('agenda-input-titulo').value = "";
};

window.salvarNovaAudiencia = function() {
    const titulo = document.getElementById('agenda-input-titulo').value.trim();
    const dataStr = document.getElementById('agenda-input-data').value;
    const icone = document.getElementById('agenda-input-icone').value;
    
    if (!titulo || !dataStr) {
        if(typeof mostrarToast === 'function') mostrarToast("O destino exige um nome e uma data.", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const timestampAlvo = new Date(dataStr).getTime();
    const timestampAgora = Date.now();

    if (timestampAlvo <= timestampAgora) {
        if(typeof mostrarToast === 'function') mostrarToast("Você não pode agendar o passado.", "⏳");
        if(window.Haptics) window.Haptics.erro();
        return;
    }
    
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, push } = window.SantuarioApp.modulos;
    const refAgenda = ref(db, 'agenda_santuario/eventos');
    
    push(refAgenda, {
        titulo: titulo,
        dataAlvo: timestampAlvo,
        icone: icone,
        criador: window.MEU_NOME,
        criadoEm: timestampAgora // O MARCO ZERO
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("O relógio começou a girar.", "🔭");
        if(window.Haptics) window.Haptics.sucesso();
        window.fecharModalNovaAudiencia();
    });
};

window.escutarAgendaGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refAgenda = ref(db, 'agenda_santuario/eventos');
    
    onValue(refAgenda, (snapshot) => {
        window.bancoEventos = snapshot.val() || {};
        window.renderizarListaDeEventos();
        window.processarTickDosRelogios(); 
    });
};

window.excluirEventoAgenda = function(idEvento) {
    if (!confirm("Isso apagará este marco da linha do tempo. Deseja prosseguir?")) return;
    
    const { db, ref, remove } = window.SantuarioApp.modulos;
    remove(ref(db, `agenda_santuario/eventos/${idEvento}`));
    if(window.Haptics) navigator.vibrate([50, 50, 50]);
};

window.renderizarListaDeEventos = function() {
    const lista = document.getElementById('lista-eventos-agenda');
    if (!lista) return;
    lista.innerHTML = "";

    if (Object.keys(window.bancoEventos).length === 0) {
        lista.innerHTML = `<p style="text-align: center; color: #666; font-style: italic; font-family: 'Playfair Display', serif; font-size: 1.1rem; margin-top: 30px;">O futuro é uma página em branco.<br>Crave a próxima audiência.</p>`;
        return;
    }

    const eventos = Object.keys(window.bancoEventos).map(key => ({ id: key, ...window.bancoEventos[key] }));
    const agora = Date.now();
    
    eventos.sort((a, b) => {
        const aPassou = a.dataAlvo < agora;
        const bPassou = b.dataAlvo < agora;
        if (aPassou && !bPassou) return 1;
        if (!aPassou && bPassou) return -1;
        if (!aPassou && !bPassou) return a.dataAlvo - b.dataAlvo; 
        return b.dataAlvo - a.dataAlvo; 
    });

    eventos.forEach(evt => {
        const dataFormatada = new Date(evt.dataAlvo).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
        
        // Injetamos a estrutura complexa do cartão
        const cartao = document.createElement('div');
        cartao.className = `cartao-tempo-titan`;
        cartao.id = `cartao-evento-${evt.id}`;
        
        // Atributos vitais para o motor de cálculo do tick
        cartao.setAttribute('data-alvo', evt.dataAlvo); 
        cartao.setAttribute('data-criado', evt.criadoEm); 
        
        cartao.innerHTML = `
            <div class="astrolabio-box">
                <svg class="anel-tempo-svg" viewBox="0 0 100 100">
                    <circle class="anel-tempo-bg" cx="50" cy="50" r="45"></circle>
                    <circle class="anel-tempo-progresso" id="ring-${evt.id}" cx="50" cy="50" r="45"></circle>
                </svg>
                <div class="icone-astrolabio">${evt.icone}</div>
            </div>

            <div class="dados-tempo-box">
                <div class="cabecalho-tempo">
                    <div>
                        <h3 class="titulo-evento-titan">${evt.titulo}</h3>
                        <span class="data-evento-titan">DATA ESTELAR: ${dataFormatada}</span>
                    </div>
                    <button class="btn-deletar-titan" onclick="window.excluirEventoAgenda('${evt.id}')">✖</button>
                </div>

                <div class="grid-nixie">
                    <div class="bloco-nixie">
                        <span class="numero-nixie" id="clock-dias-${evt.id}">00</span>
                        <span class="label-nixie">Dias</span>
                    </div>
                    <div class="bloco-nixie">
                        <span class="numero-nixie" id="clock-horas-${evt.id}">00</span>
                        <span class="label-nixie">Horas</span>
                    </div>
                    <div class="bloco-nixie">
                        <span class="numero-nixie" id="clock-mins-${evt.id}">00</span>
                        <span class="label-nixie">Mins</span>
                    </div>
                    <div class="bloco-nixie">
                        <span class="numero-nixie" id="clock-secs-${evt.id}">00</span>
                        <span class="label-nixie">Segs</span>
                    </div>
                </div>
            </div>
        `;
        lista.appendChild(cartao);
    });
};

// O MOTOR MATEMÁTICO DE ALTA PRECISÃO
window.processarTickDosRelogios = function() {
    const agora = Date.now();
    const cartoes = document.querySelectorAll('.cartao-tempo-titan');
    
    cartoes.forEach(cartao => {
        const alvo = parseInt(cartao.getAttribute('data-alvo'));
        const criadoEm = parseInt(cartao.getAttribute('data-criado'));
        const idStr = cartao.id.replace('cartao-evento-', '');
        
        let diferenca = alvo - agora;
        
        // 1. ATUALIZAÇÃO DO ASTROLÁBIO (SVG RING)
        const anel = document.getElementById(`ring-${idStr}`);
        if (anel) {
            const tempoTotal = alvo - criadoEm;
            const tempoPassado = agora - criadoEm;
            // Circunferência = 2 * PI * 45 = 282.7 (arredondado para 283)
            let porcentagemProgresso = (tempoPassado / tempoTotal);
            if (porcentagemProgresso < 0) porcentagemProgresso = 0;
            if (porcentagemProgresso > 1) porcentagemProgresso = 1;
            
            const offsetSvg = 283 - (283 * porcentagemProgresso);
            anel.style.strokeDashoffset = offsetSvg;
        }

        // 2. ATUALIZAÇÃO DOS NIXIE TUBES E ESTADOS
        if (diferenca <= 0) {
            cartao.classList.add('evento-passado');
            cartao.classList.remove('evento-emergencia');
            document.getElementById(`clock-dias-${idStr}`).innerText = "00";
            document.getElementById(`clock-horas-${idStr}`).innerText = "00";
            document.getElementById(`clock-mins-${idStr}`).innerText = "00";
            document.getElementById(`clock-secs-${idStr}`).innerText = "00";
            return;
        }

        const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
        const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);

        document.getElementById(`clock-dias-${idStr}`).innerText = String(dias).padStart(2, '0');
        document.getElementById(`clock-horas-${idStr}`).innerText = String(horas).padStart(2, '0');
        document.getElementById(`clock-mins-${idStr}`).innerText = String(minutos).padStart(2, '0');
        document.getElementById(`clock-secs-${idStr}`).innerText = String(segundos).padStart(2, '0');

        // Modo Urgência Suprema (< 24h)
        if (dias === 0) {
            cartao.classList.add('evento-emergencia');
        } else {
            cartao.classList.remove('evento-emergencia');
        }
    });
};