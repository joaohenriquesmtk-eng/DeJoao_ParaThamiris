// ============================================================================
// PROTOCOLO DE RESGATE EMOCIONAL (S.O.S PSICOLÓGICO)
// ============================================================================

window.cicloTextosResgate = null;

window.iniciarResgateEmocional = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('resgate');
    }

    console.log("Protocolo de Resgate Acionado.");

    // 1. ISOLAMENTO ACÚSTICO: Destrói qualquer som do aplicativo
    document.querySelectorAll('audio').forEach(function(a) {
        if (!a.id.includes('resgate')) a.pause();
    });
    if (typeof pauseAudioJogos === 'function') pauseAudioJogos();
    if (typeof pausarAmbiente === 'function') pausarAmbiente();

    // 2. APRESENTAÇÃO VISUAL ABSOLUTA
    const tela = document.getElementById('tela-resgate-emocional');
    if (tela) {
        tela.classList.remove('escondido');
        tela.style.display = 'flex'; // Força o CSS a obedecer
    }
    
    // 3. TERAPIA SONORA (Blindada contra falta de arquivos)
    const lofi = document.getElementById('audio-resgate-lofi');
    const voz = document.getElementById('audio-resgate-voz');
    
    if (lofi) {
        lofi.volume = 0.4;

        if (window.safePlayMedia) {
            window.safePlayMedia(lofi);
        } else {
            const playPromise = lofi.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {});
            }
        }
    }
    
    if (voz) {
        voz.volume = 1.0;

        if (window.safePlayMedia) {
            window.safePlayMedia(voz);
        } else {
            const vozPromise = voz.play();
            if (vozPromise !== undefined) {
                vozPromise.catch(() => {});
            }
        }
    }

    // 4. GUIAMENTO RESPIRATÓRIO (Sincronizado com os 8s do CSS)
    const textoGuia = document.getElementById('texto-guia-resgate');
    if (textoGuia) {
        let fase = 0;
        const frases = [
            `Estou aqui, ${window.MEU_NOME}...`, // 0s
            "Inspire lentamente...",             // 4s
            "Solte o ar devagar...",             // 8s
            "Vai ficar tudo bem.",               // 12s
            "Eu te amo muito."                   // 16s
        ];

        textoGuia.innerText = frases[0];
        textoGuia.style.opacity = 1;

        if (window.cicloTextosResgate) clearInterval(window.cicloTextosResgate);

        window.cicloTextosResgate = setInterval(() => {
            fase++;
            textoGuia.style.opacity = 0;

            const timerFadeResgate = setTimeout(() => {
                textoGuia.innerText = frases[fase % frases.length];
                textoGuia.style.opacity = 1;
            }, 1000);

            if (window.SantuarioRuntime) {
                window.SantuarioRuntime.addTimeout('resgate', timerFadeResgate);
            }

        }, 4000);

        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.addInterval('resgate', window.cicloTextosResgate);
        }
    }

    // 5. O SINALIZADOR DE EMERGÊNCIA (ALERTA MÁXIMO PRO PARCEIRO)
    if (window.SantuarioApp && window.SantuarioApp.modulos) {
        const { db, ref, set } = window.SantuarioApp.modulos;
        const refEmergencia = ref(db, 'moods/' + window.MEU_NOME.toLowerCase());
        
        set(refEmergencia, {
            estado: 'CRÍTICO',
            mensagem: "🚨 INICIOU O PROTOCOLO DE RESGATE! Pare tudo e me ligue agora.",
            timestamp: Date.now()
        });
    }

    if (window.Haptics && window.safeVibrate) window.safeVibrate([200, 100, 200, 100, 500]);
};

window.encerrarResgateEmocional = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('resgate');
    }

    // 1. DESLIGA A CÂMARA
    const tela = document.getElementById('tela-resgate-emocional');
    if (tela) {
        tela.classList.add('escondido');
        tela.style.display = 'none';
    }

    // 2. CESSA O ÁUDIO DE RESGATE
    const lofi = document.getElementById('audio-resgate-lofi');
    const voz = document.getElementById('audio-resgate-voz');
    if (lofi) lofi.pause();
    if (voz) voz.pause();

    if (window.cicloTextosResgate) clearInterval(window.cicloTextosResgate);

    // 3. AVISA QUE A CRISE PASSOU
    if (window.SantuarioApp && window.SantuarioApp.modulos) {
        const { db, ref, set } = window.SantuarioApp.modulos;
        const refEmergencia = ref(db, 'moods/' + window.MEU_NOME.toLowerCase());
        
        set(refEmergencia, {
            estado: 'radiante', // Volta para um estado positivo
            mensagem: "A crise passou. Estou me sentindo melhor agora. Obrigado(a) por existir.",
            timestamp: Date.now()
        });
    }

    // 4. RETORNA A MÚSICA NORMAL DO APP
    if (typeof playAudioJogos === 'function') playAudioJogos();
};