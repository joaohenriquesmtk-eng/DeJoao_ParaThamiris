// ============================================================================
// VERSÃO 2.0 - WALKIE-TALKIE ESPACIAL (PAGER)
// Padrão Elite: Sintetizador de Beep, MediaRecorder Otimizado, Autoplay Bypass.
// ============================================================================

window.gravadorPTT = null;
window.chunksDeAudioPTT = [];
window.isGravandoPTT = false;
window.audioRecebidoPTT = null;

// O Sintetizador de Elite: Cria o som de rádio amador (Beep) usando pura matemática, sem arquivos externos
function tocarBeepRadio(tipo) {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'square'; // Tipo de onda áspera e robótica (estilo rádio)
        
        if (tipo === 'inicio') {
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (tipo === 'fim') {
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
        }
    } catch (e) {
        console.log("AudioContext não suportado para o beep.");
    }
}

// Animação do Equalizador Digital Falso
let loopEqualizador = null;
function iniciarEqualizadorVisor() {
    const container = document.getElementById('pager-ondas-visuais');
    if (!container) return;
    container.innerHTML = '';
    
    // Cria 10 barras
    for(let i=0; i<10; i++) {
        let barra = document.createElement('div');
        barra.style.width = '4px';
        barra.style.background = '#8ab4f8';
        barra.style.borderRadius = '2px';
        barra.style.transition = 'height 0.1s ease';
        barra.style.height = '4px';
        container.appendChild(barra);
    }
    
    if(loopEqualizador) clearInterval(loopEqualizador);
    loopEqualizador = setInterval(() => {
        Array.from(container.children).forEach(barra => {
            let altura = Math.floor(Math.random() * 25) + 4;
            barra.style.height = `${altura}px`;
            barra.style.background = window.isGravandoPTT ? '#ff3366' : '#8ab4f8';
            barra.style.boxShadow = `0 0 8px ${window.isGravandoPTT ? '#ff3366' : '#8ab4f8'}`;
        });
    }, 100);
}

function pararEqualizadorVisor() {
    if(loopEqualizador) clearInterval(loopEqualizador);
    const container = document.getElementById('pager-ondas-visuais');
    if (container) {
        Array.from(container.children).forEach(barra => {
            barra.style.height = '4px';
            barra.style.background = '#444';
            barra.style.boxShadow = 'none';
        });
    }
}

window.inicializarPager = function() {
    console.log("📻 Walkie-Talkie Sintonizado");
    pararEqualizadorVisor(); // Começa parado
    escutarFrequenciaPager();
};

window.sairDoPager = function() {
    if (window.isGravandoPTT) window.pararGravacaoPTT(); // Segurança
    if (loopEqualizador) clearInterval(loopEqualizador);
    if (window.audioRecebidoPTT) {
        window.audioRecebidoPTT.pause();
        window.audioRecebidoPTT = null;
    }
    window.voltarMenuJogos();
};

// ==========================================
// A MÁQUINA DE GRAVAÇÃO (PUSH TO TALK)
// ==========================================
window.iniciarGravacaoPTT = async function(e) {
    if (e) {
        e.preventDefault(); 
        e.stopPropagation();
    }
    
    // Trava para evitar múltiplos toques acidentais
    if (window.isGravandoPTT) return; 

    // Primeiro toque pode pedir permissão de microfone. Vamos ser educados.
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        let options = {};
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
            options = { mimeType: 'audio/mp4' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            options = { mimeType: 'audio/webm' };
        }
        
        window.gravadorPTT = new MediaRecorder(stream, options);
        window.chunksDeAudioPTT = [];

        window.gravadorPTT.ondataavailable = event => {
            if (event.data.size > 0) window.chunksDeAudioPTT.push(event.data);
        };

        window.gravadorPTT.onstop = processarEEnviarAudioPTT;

        // Inicia
        window.isGravandoPTT = true;
        window.gravadorPTT.start();
        
        // Feedback Físico e Auditivo
        if(window.Haptics) window.Haptics.toqueForte();
        tocarBeepRadio('inicio');
        if(typeof window.pauseAudioJogos === 'function') window.pauseAudioJogos(); // Muta a música de fundo

        // UI Change
        const btn = document.getElementById('btn-ptt-mestre');
        const icone = document.getElementById('icone-mic-ptt');
        const txt = document.getElementById('texto-btn-ptt');
        const statusTxt = document.getElementById('pager-status-texto');
        
        if(btn) btn.classList.add('gravando');
        if(icone) { icone.innerText = '🔴'; icone.style.filter = 'drop-shadow(0 0 10px #ff3366)'; }
        if(txt) { txt.innerText = 'FALANDO'; txt.style.color = '#ff3366'; }
        if(statusTxt) { statusTxt.innerText = 'TRANSMITINDO...'; statusTxt.style.color = '#ff3366'; }
        
        iniciarEqualizadorVisor();

    } catch (err) {
        console.error("Erro no microfone:", err);
        if(typeof mostrarToast === 'function') mostrarToast("O rádio precisa de acesso ao microfone!", "🎙️");
    }
};

window.pararGravacaoPTT = function(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    if (!window.isGravandoPTT || !window.gravadorPTT) return;
    
    window.isGravandoPTT = false;
    window.gravadorPTT.stop(); // Dispara o 'onstop' ali de cima
    
    // Desliga as trilhas de áudio da câmera/microfone para a luz verde apagar no topo do iPhone
    window.gravadorPTT.stream.getTracks().forEach(track => track.stop());
    
    // Feedback Físico e Auditivo
    tocarBeepRadio('fim');
    if(window.Haptics) navigator.vibrate(20);
    
    // UI Change
    const btn = document.getElementById('btn-ptt-mestre');
    const icone = document.getElementById('icone-mic-ptt');
    const txt = document.getElementById('texto-btn-ptt');
    const statusTxt = document.getElementById('pager-status-texto');
    
    if(btn) btn.classList.remove('gravando');
    if(icone) { icone.innerText = '🎙️'; icone.style.filter = 'drop-shadow(0 0 10px rgba(138, 180, 248, 0.5))'; }
    if(txt) { txt.innerText = 'SEGURE'; txt.style.color = '#8ab4f8'; }
    if(statusTxt) { statusTxt.innerText = 'ENVIANDO...'; statusTxt.style.color = '#f1c40f'; }
    
    pararEqualizadorVisor();
};

async function processarEEnviarAudioPTT() {
    if (window.chunksDeAudioPTT.length === 0) {
        retomarEstadoLivre();
        return;
    }

    const blob = new Blob(window.chunksDeAudioPTT, { type: window.gravadorPTT.mimeType });
    const reader = new FileReader();
    
    reader.onloadend = async () => {
        const base64Audio = reader.result;
        try {
            const { db, ref, set, storage, storageRef, uploadString, getDownloadURL } = window.SantuarioApp.modulos;
            const idUnico = Date.now().toString();
            
            // 1. Sobe o arquivo para o Disco do Firebase
            const audioStorageRef = storageRef(storage, `pager_audios/${window.MEU_NOME}_${idUnico}`);
            await uploadString(audioStorageRef, base64Audio, 'data_url');
            const urlAudioFirebase = await getDownloadURL(audioStorageRef);

            // 2. Avisa o celular dela pelo Realtime Database (Gatilho Instantâneo)
            const refCanal = ref(db, 'pager/frequencia');
            await set(refCanal, {
                autor: window.MEU_NOME,
                url: urlAudioFirebase,
                timestamp: Date.now()
            });

            retomarEstadoLivre();
        } catch (error) {
            console.error("Erro ao enviar PTT:", error);
            if(typeof mostrarToast === 'function') mostrarToast("Falha na transmissão por satélite.", "❌");
            retomarEstadoLivre();
        }
    };
    reader.readAsDataURL(blob);
}

function retomarEstadoLivre() {
    const statusTxt = document.getElementById('pager-status-texto');
    if(statusTxt) { statusTxt.innerText = 'SINAL LIVRE'; statusTxt.style.color = '#8ab4f8'; }
    if(typeof window.playAudioJogos === 'function') window.playAudioJogos(); // Retoma música ambiente
}

// ==========================================
// O RECEPTOR (TOCAR AUTOMATICAMENTE)
// ==========================================
let ultimaMensagemRecebidaTimestamp = Date.now(); // Ignora históricos antigos ao abrir

function escutarFrequenciaPager() {
    if (!window.SantuarioApp || !window.MEU_NOME) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refCanal = ref(db, 'pager/frequencia');

    onValue(refCanal, (snapshot) => {
        const dados = snapshot.val();
        if (!dados || !dados.url) return;

        // Ignora as próprias mensagens ou mensagens do passado
        if (dados.autor === window.MEU_NOME) return;
        if (dados.timestamp <= ultimaMensagemRecebidaTimestamp) return;

        ultimaMensagemRecebidaTimestamp = dados.timestamp; // Atualiza a trava

        console.log("📻 Transmissão recebida!");
        
        // Muta a música ambiente
        if(typeof window.pauseAudioJogos === 'function') window.pauseAudioJogos();
        
        // Efeito de chiado de entrada
        tocarBeepRadio('inicio');
        
        // UI
        const statusTxt = document.getElementById('pager-status-texto');
        if(statusTxt) { statusTxt.innerText = 'RECEBENDO...'; statusTxt.style.color = '#2ecc71'; }
        iniciarEqualizadorVisor();
        if(window.Haptics) navigator.vibrate([50, 100, 50]);

        // Carrega e toca o áudio enviado
        window.audioRecebidoPTT = new Audio(dados.url);
        
        // Um leve delay (300ms) para dar tempo do 'beep' de início tocar e a UI atualizar
        setTimeout(() => {
            window.audioRecebidoPTT.play().catch(e => {
                console.error("Autoplay bloqueado pela Apple/Google:", e);
                if(statusTxt) { statusTxt.innerText = 'TOQUE PARA OUVIR'; statusTxt.style.color = '#e74c3c'; }
                pararEqualizadorVisor();
                
                // O fallback caso o navegador exija um toque
                const btnMestre = document.getElementById('btn-ptt-mestre');
                const toqueHandler = () => {
                    window.audioRecebidoPTT.play();
                    btnMestre.removeEventListener('pointerdown', toqueHandler);
                };
                btnMestre.addEventListener('pointerdown', toqueHandler);
            });
        }, 300);

        // Quando o áudio dela terminar de falar
        window.audioRecebidoPTT.onended = () => {
            tocarBeepRadio('fim'); // O chiado final do rádio amador
            pararEqualizadorVisor();
            if(statusTxt) { statusTxt.innerText = 'SINAL LIVRE'; statusTxt.style.color = '#8ab4f8'; }
            if(typeof window.playAudioJogos === 'function') window.playAudioJogos(); // Retoma música
            window.audioRecebidoPTT = null;
        };
    });
}