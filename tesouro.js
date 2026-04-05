// ============================================================================
// VERSÃO 2.0 TWIN TURBO - TESOURO OCULTO FULLSCREEN + AUDIO RECORDER
// ============================================================================

window.tesouroWatchId = null;
let arquivosTesouro = { foto: null, video: null, audio: null };
let tesouroIdVigente = null;

// Variáveis do Gravador Nativo
let mediaRecorderTesouro = null;
let audioChunksTesouro = [];

window.inicializarTesouro = function() {
    console.log("🛰️ Módulo GPS Acionado - HUD Fullscreen");
    arquivosTesouro = { foto: null, video: null, audio: null };
    tesouroIdVigente = null;

    // Reseta visual dos botões
    ['foto', 'video'].forEach(tipo => {
        const lbl = document.getElementById(`lbl-tesouro-${tipo}`);
        if(lbl) lbl.classList.remove('anexado');
    });
    
    // Reseta botão de gravação
    const btnMic = document.getElementById('lbl-tesouro-audio');
    if (btnMic) {
        btnMic.classList.remove('anexado', 'gravando');
        document.getElementById('icone-mic-tesouro').innerText = '🎙️';
        document.getElementById('texto-mic-tesouro').innerText = 'Gravar';
    }
    
    const txtStatus = document.getElementById('tesouro-midia-status');
    if(txtStatus) txtStatus.innerText = "";

    document.getElementById('instrucoes-tesouro').classList.add('escondido');
    document.getElementById('tesouro-estado-criador').classList.remove('escondido');
    document.getElementById('tesouro-estado-cacador').classList.add('escondido');
    document.getElementById('tesouro-estado-revelado').classList.add('escondido');
    
    escutarRadarTesouros();
};

window.sairDoTesouro = function() {
    if (window.tesouroWatchId !== null) {
        navigator.geolocation.clearWatch(window.tesouroWatchId);
        window.tesouroWatchId = null;
    }
    
    // Mata a gravação se estiver rodando
    if (mediaRecorderTesouro && mediaRecorderTesouro.state === 'recording') {
        mediaRecorderTesouro.stop();
    }

    const vid = document.getElementById('tesouro-vid-revelado');
    const aud = document.getElementById('tesouro-aud-revelado');
    if (vid) { vid.pause(); vid.src = ""; }
    if (aud) { aud.pause(); aud.src = ""; }

    window.voltarMenuJogos();
};

window.toggleInstrucoesTesouro = function() {
    document.getElementById('instrucoes-tesouro').classList.toggle('escondido');
    if(window.Haptics) window.Haptics.toqueLeve();
};

// ==========================================
// LÓGICA DO CRIADOR E UPLOAD MULTIMÍDIA
// ==========================================
window.pegarMinhaCoordenada = function() {
    if (navigator.geolocation) {
        if(typeof mostrarToast === 'function') mostrarToast("Sintonizando satélite...", "🛰️");
        navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById('tesouro-lat').value = pos.coords.latitude.toFixed(6);
            document.getElementById('tesouro-lon').value = pos.coords.longitude.toFixed(6);
            if(window.Haptics) window.Haptics.sucesso();
        }, (err) => {
            if(typeof mostrarToast === 'function') mostrarToast("Permita o GPS para marcar o local.", "❌");
        }, { enableHighAccuracy: true });
    }
};

window.processarMidiaTesouro = function(event, tipo) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
        if(typeof mostrarToast === 'function') mostrarToast("Arquivo muito grande. O limite é 25MB.", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const lbl = document.getElementById(`lbl-tesouro-${tipo}`);
    const status = document.getElementById('tesouro-midia-status');
    
    if (tipo === 'foto') {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const scaleSize = Math.min(1080 / img.width, 1); 
                canvas.width = img.width * scaleSize;
                canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                arquivosTesouro.foto = canvas.toDataURL('image/jpeg', 0.7);
                feedbackAnexoUI(lbl, status, '📸 Foto');
            };
        };
        reader.readAsDataURL(file);
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            arquivosTesouro[tipo] = e.target.result;
            feedbackAnexoUI(lbl, status, '🎥 Vídeo');
        };
        reader.readAsDataURL(file);
    }
};

// 🚨 O NOVO MOTOR DE GRAVAÇÃO EM TEMPO REAL 🚨
window.toggleGravarAudioTesouro = async function() {
    const btnMic = document.getElementById('lbl-tesouro-audio');
    const icone = document.getElementById('icone-mic-tesouro');
    const texto = document.getElementById('texto-mic-tesouro');
    const status = document.getElementById('tesouro-midia-status');

    // Se estiver parado, INICIA A GRAVAÇÃO
    if (!mediaRecorderTesouro || mediaRecorderTesouro.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let options = {};
            if (MediaRecorder.isTypeSupported('audio/mp4')) { options = { mimeType: 'audio/mp4' }; } 
            else if (MediaRecorder.isTypeSupported('audio/webm')) { options = { mimeType: 'audio/webm' }; }
            
            mediaRecorderTesouro = new MediaRecorder(stream, options);
            audioChunksTesouro = [];

            mediaRecorderTesouro.ondataavailable = e => {
                if (e.data.size > 0) audioChunksTesouro.push(e.data);
            };

            mediaRecorderTesouro.onstop = () => {
                const blob = new Blob(audioChunksTesouro, { type: mediaRecorderTesouro.mimeType });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    arquivosTesouro.audio = reader.result; 
                    
                    // UI: Mudou de Gravando para Gravado
                    btnMic.classList.remove('gravando');
                    btnMic.classList.add('anexado');
                    icone.innerText = '✔️';
                    texto.innerText = 'Gravado';
                    if (status && !status.innerText.includes('Áudio')) status.innerText += " [🎙️ Áudio Selado]";
                    if (window.Haptics) window.Haptics.sucesso();
                };
                stream.getTracks().forEach(track => track.stop());
            };

            // Inicia e altera a UI para piscar em vermelho
            mediaRecorderTesouro.start();
            btnMic.classList.add('gravando');
            icone.innerText = '⏹️';
            texto.innerText = 'Parar';
            
            if(typeof window.pauseAudioJogos === 'function') window.pauseAudioJogos(); // Muta a música ambiente
            if(window.Haptics) window.Haptics.toqueForte();

        } catch (err) {
            console.error("Erro no microfone:", err);
            if(typeof mostrarToast === 'function') mostrarToast("Permita o acesso ao microfone!", "🎙️");
        }
    } 
    // Se estiver gravando, PARA E SALVA
    else if (mediaRecorderTesouro.state === 'recording') {
        mediaRecorderTesouro.stop();
        if(typeof window.playAudioJogos === 'function') window.playAudioJogos(); // Devolve a música
    }
};

function feedbackAnexoUI(label, statusDOM, texto) {
    if (label) label.classList.add('anexado');
    if (statusDOM && !statusDOM.innerText.includes(texto)) {
        statusDOM.innerText += ` [${texto} Selado] `;
    }
    if (window.Haptics) window.Haptics.toqueLeve();
}

window.enterrarTesouro = async function() {
    const lat = document.getElementById('tesouro-lat').value;
    const lon = document.getElementById('tesouro-lon').value;
    const msg = document.getElementById('tesouro-msg').value;

    if (!lat || !lon) {
        if(typeof mostrarToast === 'function') mostrarToast("As coordenadas são obrigatórias.", "⚠️");
        return;
    }
    if (!msg.trim() && !arquivosTesouro.foto && !arquivosTesouro.video && !arquivosTesouro.audio) {
        if(typeof mostrarToast === 'function') mostrarToast("O baú não pode estar vazio.", "⚠️");
        return;
    }

    // Se ele esqueceu de apertar Parar, para e salva
    if (mediaRecorderTesouro && mediaRecorderTesouro.state === 'recording') {
        mediaRecorderTesouro.stop();
        // Dá um tempinho minúsculo pro blob ser lido
        await new Promise(r => setTimeout(r, 500)); 
    }

    const btn = document.getElementById('btn-enterrar-mestre');
    btn.disabled = true;
    btn.innerHTML = "Subindo pro Satélite... ⏳";
    btn.style.opacity = "0.7";

    try {
        const { db, ref, set, storage, storageRef, uploadString, getDownloadURL } = window.SantuarioApp.modulos;
        const idUnico = Date.now().toString();
        let urls = { foto: null, video: null, audio: null };

        const processarUpload = async (tipo, pastaStr) => {
            if (arquivosTesouro[tipo]) {
                const sRef = storageRef(storage, `tesouros_geo/${window.MEU_NOME}_${pastaStr}_${idUnico}`);
                await uploadString(sRef, arquivosTesouro[tipo], 'data_url');
                urls[tipo] = await getDownloadURL(sRef);
            }
        };

        if(typeof mostrarToast === 'function') mostrarToast("Criptografando carga...", "🚀");
        await processarUpload('foto', 'img');
        await processarUpload('video', 'vid');
        await processarUpload('audio', 'aud');

        const refDestino = ref(db, `tesouros_geo/${window.NOME_PARCEIRO.toLowerCase()}`);
        await set(refDestino, {
            id: idUnico,
            lat: parseFloat(lat),
            lon: parseFloat(lon),
            mensagem: window.SantuarioCrypto ? window.SantuarioCrypto.codificar(msg) : msg,
            url_foto: urls.foto,
            url_video: urls.video,
            url_audio: urls.audio,
            autor: window.MEU_NOME,
            timestamp: Date.now()
        });

        if(typeof mostrarToast === 'function') mostrarToast("Relíquia enterrada com precisão militar!", "🗺️");
        if(window.Haptics) window.Haptics.sucesso();
        window.sairDoTesouro();

    } catch (err) {
        console.error("Erro no enterro:", err);
        if(typeof mostrarToast === 'function') mostrarToast("Falha na transmissão por satélite.", "❌");
    } finally {
        btn.disabled = false;
        btn.innerHTML = "ENTERRAR RELÍQUIA";
        btn.style.opacity = "1";
    }
};

// ==========================================
// LÓGICA DO CAÇADOR (O RADAR)
// ==========================================
let dadosDoTesouroAtual = null;

function escutarRadarTesouros() {
    if (!window.SantuarioApp || !window.MEU_NOME) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refMeuMapa = ref(db, `tesouros_geo/${window.MEU_NOME.toLowerCase()}`);
    
    onValue(refMeuMapa, (snapshot) => {
        const dados = snapshot.val();
        
        if (!dados) {
            document.getElementById('tesouro-estado-criador').classList.remove('escondido');
            document.getElementById('tesouro-estado-cacador').classList.add('escondido');
            document.getElementById('tesouro-estado-revelado').classList.add('escondido');
            if (window.tesouroWatchId !== null) {
                navigator.geolocation.clearWatch(window.tesouroWatchId);
                window.tesouroWatchId = null;
            }
            return;
        }

        dadosDoTesouroAtual = dados;
        tesouroIdVigente = dados.id;

        document.getElementById('tesouro-estado-criador').classList.add('escondido');
        document.getElementById('tesouro-estado-cacador').classList.remove('escondido');
        document.getElementById('tesouro-estado-revelado').classList.add('escondido');
        
        iniciarRastreamentoFisico();
    });
}

function iniciarRastreamentoFisico() {
    if (!navigator.geolocation) {
        document.getElementById('tesouro-distancia-texto').innerText = "GPS INATIVO";
        return;
    }

    if (window.tesouroWatchId !== null) navigator.geolocation.clearWatch(window.tesouroWatchId);

    window.tesouroWatchId = navigator.geolocation.watchPosition((pos) => {
        const minhaLat = pos.coords.latitude;
        const minhaLon = pos.coords.longitude;
        
        const distMetros = calcularFisicaHaversine(minhaLat, minhaLon, dadosDoTesouroAtual.lat, dadosDoTesouroAtual.lon);
        const txt = document.getElementById('tesouro-distancia-texto');
        const blip = document.getElementById('radar-alvo');

        if (txt) {
            if (distMetros > 1000) {
                txt.innerText = (distMetros / 1000).toFixed(2) + " KM";
            } else {
                txt.innerText = distMetros.toFixed(0) + " M";
            }
        }

        if (blip) {
            let raioVisual = Math.min(distMetros / 2000, 1) * 45; 
            let anguloRad = Date.now() / 800; 
            let posX = 50 + (Math.cos(anguloRad) * raioVisual);
            let posY = 50 + (Math.sin(anguloRad) * raioVisual);
            blip.style.left = `${posX}%`;
            blip.style.top = `${posY}%`;
        }

        if (distMetros <= 40) {
            desbloquearTesouroFisico();
        }

    }, (err) => {
        console.error("GPS Perdido:", err);
        document.getElementById('tesouro-distancia-texto').innerText = "SINAL PERDIDO";
    }, { enableHighAccuracy: true, maximumAge: 0 });
}

function calcularFisicaHaversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const p1 = lat1 * Math.PI/180;
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

function desbloquearTesouroFisico() {
    if (window.tesouroWatchId !== null) {
        navigator.geolocation.clearWatch(window.tesouroWatchId);
        window.tesouroWatchId = null;
    }

    document.getElementById('tesouro-estado-cacador').classList.add('escondido');
    const painelRevelado = document.getElementById('tesouro-estado-revelado');
    painelRevelado.classList.remove('escondido');

    const img = document.getElementById('tesouro-img-revelada');
    const vid = document.getElementById('tesouro-vid-revelado');
    const audBox = document.getElementById('tesouro-aud-box');
    const audPlayer = document.getElementById('tesouro-aud-revelado');
    const msg = document.getElementById('tesouro-msg-revelada');
    const msgBox = document.getElementById('tesouro-msg-box');

    if (dadosDoTesouroAtual.url_foto) {
        img.src = dadosDoTesouroAtual.url_foto;
        img.classList.remove('escondido');
    } else { img.classList.add('escondido'); }

    if (dadosDoTesouroAtual.url_video) {
        vid.src = dadosDoTesouroAtual.url_video;
        vid.classList.remove('escondido');
    } else { vid.classList.add('escondido'); }

    if (dadosDoTesouroAtual.url_audio) {
        audPlayer.src = dadosDoTesouroAtual.url_audio;
        audBox.classList.remove('escondido');
    } else { audBox.classList.add('escondido'); }

    let msgTexto = dadosDoTesouroAtual.mensagem;
    if (window.SantuarioCrypto) msgTexto = window.SantuarioCrypto.decodificar(msgTexto);
    
    if (msgTexto && msgTexto.trim() !== "") {
        msg.innerText = msgTexto;
        msgBox.classList.remove('escondido');
    } else {
        msgBox.classList.add('escondido');
    }

    if ((dadosDoTesouroAtual.url_audio || dadosDoTesouroAtual.url_video) && typeof window.pauseAudioJogos === 'function') {
        window.pauseAudioJogos();
    }

    if(window.Haptics) navigator.vibrate([200, 100, 400, 100, 600]);
    if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#2ecc71', '#ffffff'], particleCount: 300, spread: 180, zIndex: 100000});

    // ==========================================
    // 💎 O SAQUE DO TESOURO (A EXPLOSÃO DIAMANTE)
    // ==========================================
    
    // Evita que o prêmio seja dado duas vezes se a pessoa fechar e abrir a mesma cápsula
    const idUnicoPremio = `premio_resgatado_${tesouroIdVigente}`;
    const jaResgatou = localStorage.getItem(idUnicoPremio);

    if (!jaResgatou) {
        setTimeout(async () => {
            // O Jackpot da Exploração Real (100.000 a 500.000 Moedas!)
            const jackpotExploracao = Math.floor(Math.random() * 400000) + 100000;
            
            // Recompensa em Itens Orgânicos Raros para a Mochila (Munição pro Guardião!)
            const bonusMorangos = Math.floor(Math.random() * 15) + 5; // 5 a 20 Morangos
            const bonusOrvalho = Math.floor(Math.random() * 10) + 5;  // 5 a 15 Orvalhos
            const bonusRosas = Math.floor(Math.random() * 5) + 1;     // 1 a 5 Rosas de Luxo
            
            // 1. Credita as Moedas na conta do Casal
            if (typeof atualizarPontosCasal === 'function') {
                atualizarPontosCasal(jackpotExploracao, "Descoberta Arqueológica (GPS)");
            }
            
            // 2. Credita a Mochila Global
            if (typeof window.adicionarItemInventario === 'function') {
                await window.adicionarItemInventario('morangos', bonusMorangos);
                await window.adicionarItemInventario('gotas_orvalho', bonusOrvalho);
                await window.adicionarItemInventario('rosas', bonusRosas);
            }
            
            // 3. Efeitos Sonoros e Avisos Visuais Absurdos
            if (typeof mostrarToast === 'function') {
                mostrarToast(`BAÚ ÉPICO: +${jackpotExploracao.toLocaleString('pt-BR')} 💰`, "🗺️");
                setTimeout(() => mostrarToast(`Saque Extra: +${bonusMorangos}🍓, +${bonusOrvalho}💧, +${bonusRosas}🌹`, "🎒"), 2000);
            }

            // Toca um som de conquista/baú aberto
            const audioBau = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3');
            audioBau.volume = 1.0;
            audioBau.play().catch(e=>{});

            // 4. Trava de segurança
            localStorage.setItem(idUnicoPremio, "true");
            
        }, 3500); // Aguarda 3,5s para a pessoa apreciar a sua mensagem/foto antes de jogar o dinheiro nela!
    }
}

window.destruirTesouroLido = function() {
    const { db, ref, remove } = window.SantuarioApp.modulos;
    const refDestino = ref(db, `tesouros_geo/${window.MEU_NOME.toLowerCase()}`);
    
    remove(refDestino).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Memória guardada. O satélite foi zerado.", "✨");
        if(window.Haptics) window.Haptics.toqueLeve();
        window.sairDoTesouro();
    });
};