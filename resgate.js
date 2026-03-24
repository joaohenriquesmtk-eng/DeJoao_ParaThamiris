// ============================================================================
// PROTOCOLO DE RESGATE EMOCIONAL (S.O.S PSICOLÓGICO)
// ============================================================================

window.cicloTextosResgate = null;

window.iniciarResgateEmocional = function() {
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
        let playPromise = lofi.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.warn("Lofi de resgate pendente.", e));
        }
    }
    
    if (voz) { 
        voz.volume = 1.0; 
        let vozPromise = voz.play();
        if (vozPromise !== undefined) {
            vozPromise.catch(e => console.warn("Áudio de voz não encontrado. Adicione conforto.mp3 na pasta assets/sons/resgate/ para ativar.", e));
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
            // Fade Out
            textoGuia.style.opacity = 0;
            
            setTimeout(() => {
                // Troca o texto enquanto está invisível e faz o Fade In
                textoGuia.innerText = frases[fase % frases.length];
                textoGuia.style.opacity = 1;
            }, 1000);

        }, 4000); // Troca a cada 4 segundos (Metade do ciclo do pulmão)
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

    if (window.Haptics) navigator.vibrate([200, 100, 200, 100, 500]);
};

window.encerrarResgateEmocional = function() {
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