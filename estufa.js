// ============================================================================
// ESTUFA DE FOCO (POMODORO QUÂNTICO) - CÓDIGO BLINDADO E CORRIGIDO
// ============================================================================

// Variáveis Globais Acessíveis
window.tempoPadraoMinutos = 25;
window.tempoRestanteSegundos = 25 * 60;
window.duracaoTotalSegundos = 25 * 60;
window.loopCronometro = null;
window.somAtual = null;

window.estufaEstado = {
    ativo: false,
    momentoFim: null,
    autor: null,
    minutosIniciais: 25
};

window.iniciarInterfaceEstufa = function() {
    console.log("Iniciando Estufa de Foco...");
    
    // 🚨 EXTINTOR DE ÁUDIO ABSOLUTO (Sem Loop Infinito)
    document.querySelectorAll('audio').forEach(function(a) {
        // Pausa absolutamente tudo que não for som de dentro da própria estufa (chuva/lofi)
        if (!a.id.includes('estufa')) a.pause();
    });
    if (typeof pauseAudioJogos === 'function') pauseAudioJogos();
    if (typeof pausarAmbiente === 'function') pausarAmbiente();
    // ---------------------------------------------------------

    window.atualizarHumoUI();
    window.escutarEstufaGlobal();
    window.desenharTempo(window.tempoRestanteSegundos);
};

window.atualizarHumoUI = function() {
    let humus = parseInt(localStorage.getItem('santuario_humus_ouro') || '0');
    const badge = document.getElementById('estufa-humus-qtd');
    if (badge) badge.innerText = humus;
};

window.ajustarTempoEstufa = function(minutosDelta) {
    if (window.estufaEstado.ativo) return; // Trava se já estiver rodando
    
    window.tempoPadraoMinutos += minutosDelta;
    if (window.tempoPadraoMinutos < 5) window.tempoPadraoMinutos = 5;
    if (window.tempoPadraoMinutos > 120) window.tempoPadraoMinutos = 120;
    
    window.tempoRestanteSegundos = window.tempoPadraoMinutos * 60;
    window.duracaoTotalSegundos = window.tempoPadraoMinutos * 60;
    window.desenharTempo(window.tempoRestanteSegundos);
    
    if (window.Haptics) window.Haptics.toqueLeve();
};

window.desenharTempo = function(segundos) {
    const display = document.getElementById('estufa-tempo');
    const anel = document.getElementById('estufa-anel-progresso');
    
    if (!display) return;

    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    display.innerText = `${String(min).padStart(2, '0')}:${String(seg).padStart(2, '0')}`;

    if (anel) {
        const porcentagem = Math.max(0, segundos / window.duracaoTotalSegundos);
        const offset = 565.48 - (porcentagem * 565.48);
        anel.style.strokeDashoffset = offset;
        
        // Muda cor se estiver acabando
        if (porcentagem < 0.2) {
            anel.style.stroke = '#e74c3c';
            display.style.color = '#e74c3c';
            display.style.textShadow = '0 0 20px rgba(231, 76, 60, 0.5)';
        } else {
            anel.style.stroke = '#2ecc71';
            display.style.color = '#fff';
            display.style.textShadow = '0 0 20px rgba(46, 204, 113, 0.5)';
        }
    }
};

// --- SINCRONIZAÇÃO COM O FIREBASE ---
window.escutarEstufaGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refEstufa = ref(db, 'estufa_foco/estado_global');
    
    onValue(refEstufa, (snapshot) => {
        const dados = snapshot.val();
        const statusParceiro = document.getElementById('estufa-status-parceiro');
        const textoParceiro = document.getElementById('estufa-texto-parceiro');
        const dot = statusParceiro ? statusParceiro.querySelector('.status-dot') : null;

        if (dados && dados.ativo && dados.momentoFim > Date.now()) {
            // Alguém iniciou o foco!
            window.estufaEstado = dados;
            window.duracaoTotalSegundos = dados.minutosIniciais * 60;
            
            if (statusParceiro && dot && textoParceiro) {
                statusParceiro.style.borderColor = '#2ecc71';
                statusParceiro.style.background = 'rgba(46, 204, 113, 0.1)';
                dot.style.background = '#2ecc71';
                dot.style.boxShadow = '0 0 10px #2ecc71';
                
                if (dados.autor === window.MEU_NOME) {
                    textoParceiro.innerText = `Você plantou a semente. Aguardando ${window.NOME_PARCEIRO}...`;
                    textoParceiro.style.color = "#2ecc71";
                } else {
                    textoParceiro.innerText = `${window.NOME_PARCEIRO} está em Foco Profundo! Junte-se!`;
                    textoParceiro.style.color = "#FFD700";
                }
            }
            window.iniciarCronometroLocal();
        } else {
            // Sessão encerrada ou livre
            window.estufaEstado.ativo = false;
            window.pararCronometroLocal(false);
            
            if (statusParceiro && dot && textoParceiro) {
                statusParceiro.style.borderColor = 'rgba(255,255,255,0.1)';
                statusParceiro.style.background = 'rgba(255,255,255,0.05)';
                dot.style.background = '#555';
                dot.style.boxShadow = 'none';
                textoParceiro.innerText = "A estufa está silenciosa. Pronta para plantar.";
                textoParceiro.style.color = "#aaa";
            }
        }
    });
};

window.iniciarCicloEstufa = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const momentoFim = Date.now() + (window.tempoPadraoMinutos * 60 * 1000);
    
    const refEstufa = ref(db, 'estufa_foco/estado_global');
    set(refEstufa, {
        ativo: true,
        momentoFim: momentoFim,
        minutosIniciais: window.tempoPadraoMinutos,
        autor: window.MEU_NOME
    });

    if (window.Haptics) window.Haptics.sucesso();
};

window.cancelarCicloEstufa = function() {
    if (!confirm("Tem certeza que deseja abandonar o foco? A semente vai morrer e não haverá Húmus de Ouro.")) return;
    
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const refEstufa = ref(db, 'estufa_foco/estado_global');
    set(refEstufa, { ativo: false }); 
};

window.iniciarCronometroLocal = function() {
    if (window.loopCronometro) clearInterval(window.loopCronometro);

    const ctrTempo = document.getElementById('estufa-controles-tempo');
    const btnIniciar = document.getElementById('btn-estufa-iniciar');
    const btnCancelar = document.getElementById('btn-estufa-cancelar');
    const txtFase = document.getElementById('estufa-fase-texto');
    const container = document.getElementById('container-estufa');

    if(ctrTempo) ctrTempo.classList.add('escondido');
    if(btnIniciar) btnIniciar.classList.add('escondido');
    if(btnCancelar) btnCancelar.classList.remove('escondido');
    if(txtFase) txtFase.innerText = "Foco Profundo";
    if(container) container.classList.add('modo-foco-profundo');

    const checarTempo = () => {
        const agora = Date.now();
        const faltaMs = window.estufaEstado.momentoFim - agora;
        
        if (faltaMs <= 0) {
            window.concluirCicloComSucesso();
        } else {
            window.tempoRestanteSegundos = Math.ceil(faltaMs / 1000);
            window.desenharTempo(window.tempoRestanteSegundos);
        }
    };

    checarTempo(); 
    window.loopCronometro = setInterval(checarTempo, 1000);
};

window.pararCronometroLocal = function(sucesso) {
    if (window.loopCronometro) clearInterval(window.loopCronometro);
    window.loopCronometro = null;

    window.tempoRestanteSegundos = window.tempoPadraoMinutos * 60;
    window.duracaoTotalSegundos = window.tempoPadraoMinutos * 60;
    window.desenharTempo(window.tempoRestanteSegundos);

    const ctrTempo = document.getElementById('estufa-controles-tempo');
    const btnIniciar = document.getElementById('btn-estufa-iniciar');
    const btnCancelar = document.getElementById('btn-estufa-cancelar');
    const txtFase = document.getElementById('estufa-fase-texto');
    const container = document.getElementById('container-estufa');

    if(ctrTempo) ctrTempo.classList.remove('escondido');
    if(btnIniciar) btnIniciar.classList.remove('escondido');
    if(btnCancelar) btnCancelar.classList.add('escondido');
    if(txtFase) txtFase.innerText = sucesso ? "Concluído!" : "Pronto para iniciar";
    if(container) container.classList.remove('modo-foco-profundo');
    
    window.desligarSonsAmbientes();
};

window.concluirCicloComSucesso = function() {
    window.pararCronometroLocal(true);
    const audioFim = document.getElementById('audio-estufa-conclusao');
    if(audioFim) audioFim.play().catch(e => console.log(e));
    
    if (window.Haptics && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);
    if (typeof confetti === 'function') confetti({colors: ['#3498db', '#D4AF37'], particleCount: 150});

    // 🚨 Gera as Gotas de Orvalho baseadas no tempo focado!
    const gotasGanhos = window.estufaEstado.minutosIniciais >= 20 ? 3 : 1;
    
    // 🚨 MÁGICA: Envia para a Mochila Global do Casal
    if (typeof window.adicionarItemInventario === 'function') {
        window.adicionarItemInventario('gotas_orvalho', gotasGanhos);
    }
    
    if(typeof mostrarToast === 'function') mostrarToast(`Foco Impecável! Você gerou +${gotasGanhos} Gotas de Orvalho 💧!`, "🧠");

    const { db, ref, set } = window.SantuarioApp.modulos;
    set(ref(db, 'estufa_foco/estado_global'), { ativo: false });
};

window.alternarSomAmbiente = function(tipo) {
    const audioChuva = document.getElementById('audio-estufa-chuva');
    const audioLofi = document.getElementById('audio-estufa-lofi');
    const btnChuva = document.getElementById('btn-som-chuva');
    const btnLofi = document.getElementById('btn-som-lofi');

    if (window.somAtual === tipo) {
        window.desligarSonsAmbientes();
        return;
    }

    window.desligarSonsAmbientes();
    window.somAtual = tipo;

    if (tipo === 'chuva') {
        if(audioChuva) { audioChuva.volume = 0.5; audioChuva.play(); }
        if(btnChuva) btnChuva.classList.add('ativo');
    } else if (tipo === 'lofi') {
        if(audioLofi) { audioLofi.volume = 0.5; audioLofi.play(); }
        if(btnLofi) btnLofi.classList.add('ativo');
    }
};

window.desligarSonsAmbientes = function() {
    const audioChuva = document.getElementById('audio-estufa-chuva');
    const audioLofi = document.getElementById('audio-estufa-lofi');
    const btnChuva = document.getElementById('btn-som-chuva');
    const btnLofi = document.getElementById('btn-som-lofi');

    if(audioChuva) audioChuva.pause();
    if(audioLofi) audioLofi.pause();
    if(btnChuva) btnChuva.classList.remove('ativo');
    if(btnLofi) btnLofi.classList.remove('ativo');
    window.somAtual = null;
};

window.toggleInstrucoesEstufa = function() {
    const inst = document.getElementById('instrucoes-estufa');
    if(inst) inst.classList.toggle('escondido');
};