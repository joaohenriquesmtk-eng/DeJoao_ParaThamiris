// ============================================================================
// PAUTA DE AUDIÊNCIAS (RELÓGIO DO DESTINO) - TITAN TIER ENGINE
// ============================================================================

window.bancoEventos = {};
window.loopRelogiosGlobais = null;
window.agendaOffEventos = null;

window.inicializarAgenda = function() {
    console.log("Iniciando Astrolábio Temporal...");

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('agenda');
    }

    window.escutarAgendaGlobal();

    if (window.loopRelogiosGlobais) clearInterval(window.loopRelogiosGlobais);
    window.loopRelogiosGlobais = setInterval(() => {
        const containerAgenda = document.getElementById('container-agenda');
        if (!containerAgenda || containerAgenda.classList.contains('escondido')) return;
        window.processarTickDosRelogios();
    }, 1000);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addInterval('agenda', window.loopRelogiosGlobais);
    }
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

    window.agendaOffEventos = onValue(refAgenda, (snapshot) => {
        window.bancoEventos = snapshot.val() || {};
        window.renderizarListaDeEventos();
        window.processarTickDosRelogios();
    });

    if (window.SantuarioRuntime && window.agendaOffEventos) {
        window.SantuarioRuntime.addCleanup('agenda', window.agendaOffEventos);
    }
};

window.excluirEventoAgenda = function(idEvento) {
    if (!confirm("Isso apagará este marco da linha do tempo. Deseja prosseguir?")) return;
    
    const { db, ref, remove } = window.SantuarioApp.modulos;
    remove(ref(db, `agenda_santuario/eventos/${idEvento}`));
    if (window.Haptics && window.safeVibrate) window.safeVibrate([50, 50, 50]);
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
        
        // Injetamos a estrutura complexa do cartão com Responsividade Flex embutida
        const cartao = document.createElement('div');
        cartao.className = `cartao-tempo-titan`;
        cartao.id = `cartao-evento-${evt.id}`;
        
        // Atributos vitais para o motor de cálculo do tick
        cartao.setAttribute('data-alvo', evt.dataAlvo); 
        cartao.setAttribute('data-criado', evt.criadoEm); 
        
        // A MÁGICA DO CSS RESPONSIVO (Garante a perfeição em qualquer celular)
        cartao.style.cssText = `
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            padding: 25px 15px; 
            background: linear-gradient(145deg, rgba(15,15,15,0.9), rgba(5,5,5,0.95)); 
            border: 1px solid rgba(212,175,55,0.3); 
            border-radius: 16px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.7); 
            position: relative; 
            width: 100%; 
            box-sizing: border-box;
            gap: 15px;
            transition: all 0.5s ease;
        `;
        
        cartao.innerHTML = `
            <button onclick="window.excluirEventoAgenda('${evt.id}')" style="position: absolute; top: 12px; right: 12px; background: rgba(255, 51, 102, 0.1); border: 1px solid rgba(255, 51, 102, 0.3); color: #ff3366; font-size: 1rem; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; z-index: 10;">✖</button>

            <div style="position: relative; width: 70px; height: 70px; display: flex; justify-content: center; align-items: center;">
                <svg viewBox="0 0 100 100" style="position: absolute; width: 100%; height: 100%; transform: rotate(-90deg); overflow: visible;">
                    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(212,175,55,0.15)" stroke-width="6"></circle>
                    <circle id="ring-${evt.id}" cx="50" cy="50" r="46" fill="none" stroke="#D4AF37" stroke-width="6" stroke-linecap="round" style="stroke-dasharray: 289; stroke-dashoffset: 0; transition: stroke-dashoffset 1s linear; filter: drop-shadow(0 0 4px rgba(212,175,55,0.6));"></circle>
                </svg>
                <div style="font-size: 1.8rem; position: relative; z-index: 2; filter: drop-shadow(0 0 5px rgba(212,175,55,0.5));">${evt.icone}</div>
            </div>

            <div style="width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center;">
                <h3 style="color: #D4AF37; font-family: 'Playfair Display', serif; font-size: clamp(1.1rem, 5vw, 1.4rem); margin: 0 0 5px 0; text-transform: uppercase; letter-spacing: 1px; word-wrap: break-word;">${evt.titulo}</h3>
                <span style="color: #888; font-size: 0.75rem; font-family: monospace; letter-spacing: 2px;">ALVO: ${dataFormatada}</span>
            </div>

            <div style="display: flex; justify-content: center; gap: 8px; width: 100%; max-width: 320px;">
                <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; padding: 12px 5px; flex: 1; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
                    <span id="clock-dias-${evt.id}" style="color: #fff; font-family: monospace; font-size: clamp(1.1rem, 5vw, 1.5rem); font-weight: bold; text-shadow: 0 0 8px rgba(212,175,55,0.5);">00</span>
                    <span style="color: #D4AF37; font-size: 0.6rem; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px;">Dias</span>
                </div>
                <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; padding: 12px 5px; flex: 1; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
                    <span id="clock-horas-${evt.id}" style="color: #fff; font-family: monospace; font-size: clamp(1.1rem, 5vw, 1.5rem); font-weight: bold; text-shadow: 0 0 8px rgba(212,175,55,0.5);">00</span>
                    <span style="color: #D4AF37; font-size: 0.6rem; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px;">Horas</span>
                </div>
                <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; padding: 12px 5px; flex: 1; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
                    <span id="clock-mins-${evt.id}" style="color: #fff; font-family: monospace; font-size: clamp(1.1rem, 5vw, 1.5rem); font-weight: bold; text-shadow: 0 0 8px rgba(212,175,55,0.5);">00</span>
                    <span style="color: #D4AF37; font-size: 0.6rem; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px;">Mins</span>
                </div>
                <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(212,175,55,0.2); border-radius: 8px; padding: 12px 5px; flex: 1; display: flex; flex-direction: column; align-items: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
                    <span id="clock-secs-${evt.id}" style="color: #fff; font-family: monospace; font-size: clamp(1.1rem, 5vw, 1.5rem); font-weight: bold; text-shadow: 0 0 8px rgba(212,175,55,0.5);">00</span>
                    <span style="color: #D4AF37; font-size: 0.6rem; text-transform: uppercase; margin-top: 4px; letter-spacing: 1px;">Segs</span>
                </div>
            </div>
        `;
        lista.appendChild(cartao);
    });
};

// O MOTOR MATEMÁTICO DE ALTA PRECISÃO E CÁLCULO
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
            // O cálculo da Circunferência corrigido para o novo tamanho menor:
            let porcentagemProgresso = (tempoPassado / tempoTotal);
            if (porcentagemProgresso < 0) porcentagemProgresso = 0;
            if (porcentagemProgresso > 1) porcentagemProgresso = 1;
            
            const offsetSvg = 289 - (289 * porcentagemProgresso);
            anel.style.strokeDashoffset = offsetSvg;
        }

        // 2. ATUALIZAÇÃO DOS NIXIE TUBES E ESTADOS
        if (diferenca <= 0) {
            // Venceu o tempo! O anel vira verde e a contagem zera
            cartao.style.borderColor = '#2ecc71';
            cartao.style.boxShadow = '0 10px 30px rgba(46,204,113,0.3)';
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
            cartao.style.borderColor = '#e74c3c';
            cartao.style.boxShadow = '0 10px 30px rgba(231,76,60,0.3)';
        } else {
            cartao.style.borderColor = 'rgba(212,175,55,0.3)';
            cartao.style.boxShadow = '0 10px 30px rgba(0,0,0,0.7)';
        }
    });
};