// ============================================================================
// CINE QUÂNTICO (YOUTUBE + GOOGLE DRIVE) - TITAN TIER ENGINE (ANTI-CORS)
// ============================================================================

window.estadoCinema = {
    videoId: null,
    tipoVideo: null,
    ultimoTimestamp: null,
    euPronto: false,
    parceiroPronto: false,
    contagemEmAndamento: false,
    apiYTPronta: false
};

window.youtubePlayer = null;

function injetarAPIYouTube() {
    if (!window.YT) {
        console.log("Injetando API Quântica do YouTube...");
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }
}

window.onYouTubeIframeAPIReady = function() {
    console.log("Motor YouTube chancelado e aguardando ordens.");
    window.estadoCinema.apiYTPronta = true;
    
    if (window.estadoCinema.videoId && window.estadoCinema.tipoVideo === 'youtube' && !window.youtubePlayer) {
        window.carregarVideoNoPlayer(window.estadoCinema.videoId, 'youtube');
    }
};

window.inicializarCinema = function() {
    console.log("Multiplex Duplo Online.");
    injetarAPIYouTube();
    window.escutarCinemaGlobal();
    
    document.getElementById('texto-status-eu').innerText = "Aguardando Filme...";
    const luzStatus = document.getElementById('luz-status-eu');
    if (luzStatus) luzStatus.classList.remove('pronto');
    
    const btnChave = document.getElementById('btn-chave-dupla');
    if (btnChave) btnChave.classList.remove('ativado');
    
    window.estadoCinema.euPronto = false;
};

window.toggleInstrucoesCinema = function() {
    const inst = document.getElementById('instrucoes-cinema');
    if (inst) inst.classList.toggle('escondido');
};

window.processarLinkVideo = function() {
    const input = document.getElementById('input-link-video');
    const url = input.value.trim();
    if (!url) return;

    let videoIdExtraido = null;
    let tipoIdentificado = null;

    const regexYT = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const matchYT = url.match(regexYT);

    const regexDrive = /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/i;
    const matchDrive = url.match(regexDrive);

    if (matchYT && matchYT[1]) {
        videoIdExtraido = matchYT[1];
        tipoIdentificado = 'youtube';
    } else if (matchDrive && matchDrive[1]) {
        videoIdExtraido = matchDrive[1];
        tipoIdentificado = 'drive';
    }

    if (videoIdExtraido && tipoIdentificado) {
        if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
        const { db, ref, update } = window.SantuarioApp.modulos;
        
        update(ref(db, 'utilitarios/cinema'), {
            videoId: videoIdExtraido,
            tipo: tipoIdentificado,
            timestamp: Date.now(),
            [window.MEU_NOME]: false,
            [window.NOME_PARCEIRO]: false
        }).then(() => {
            input.value = "";
            if(window.Haptics) window.Haptics.sucesso();
            if(typeof mostrarToast === 'function') mostrarToast(`Link ${tipoIdentificado.toUpperCase()} interceptado.`, "📡");
        });
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("URL corrompida.", "⚠️");
        if(window.Haptics) window.Haptics.erro();
    }
};

window.carregarVideoNoPlayer = function(videoId, tipo) {
    const telaEstatica = document.getElementById('tela-estatica-cinema');
    const playerNativo = document.getElementById('player-nativo');
    const ambilight = document.getElementById('cinema-ambilight');

    if (telaEstatica) {
        telaEstatica.style.opacity = 0;
        setTimeout(() => { telaEstatica.classList.add('escondido'); }, 1000);
    }

    if (tipo === 'youtube') {
        if (playerNativo) {
            playerNativo.classList.add('escondido');
            playerNativo.pause(); 
            playerNativo.removeAttribute('src'); 
        }
        
        if (ambilight) {
            ambilight.style.background = '#e50914';
            ambilight.style.opacity = '0.3';
        }

        // Destrói o Iframe antigo para forçar uma recarga limpa
        if (window.youtubePlayer) {
            try { window.youtubePlayer.destroy(); } catch(e) {}
            window.youtubePlayer = null;
        }

        let playerYT = document.getElementById('player-youtube');
        if (!playerYT) {
            playerYT = document.createElement('div');
            playerYT.id = 'player-youtube';
            const telaProjetor = document.querySelector('.tela-projetor');
            if (telaProjetor) telaProjetor.prepend(playerYT);
        }
        playerYT.classList.remove('escondido');

        if (window.YT && window.YT.Player) {
            window.youtubePlayer = new YT.Player('player-youtube', {
                videoId: videoId,
                host: 'https://www.youtube.com', // Força a rota segura do Google
                playerVars: { 
                    'controls': 1, 
                    'disablekb': 1, 
                    'rel': 0,
                    'enablejsapi': 1,
                    'modestbranding': 1, // Remove logos pesadas do YT
                    'origin': window.location.origin
                },
                events: {
                    'onReady': (event) => {
                        event.target.pauseVideo();
                        console.log("Projetor YT ancorado em segurança máxima.");
                    }
                }
            });
        }
        
    } else if (tipo === 'drive') {
        if (window.youtubePlayer) {
            try { window.youtubePlayer.destroy(); } catch(e) {}
            window.youtubePlayer = null;
        }
        
        let playerYT = document.getElementById('player-youtube');
        if (playerYT) playerYT.classList.add('escondido');
        
        if (playerNativo) {
            playerNativo.classList.remove('escondido');
            const linkStreamingDireto = `https://drive.google.com/uc?export=download&id=${videoId}`;
            playerNativo.src = linkStreamingDireto;
            playerNativo.currentTime = 0;
            playerNativo.pause();
        }
        
        if (ambilight) {
            ambilight.style.background = '#2ecc71';
            ambilight.style.opacity = '0.3';
        }
    }
};

window.alternarStatusProntoCinema = function() {
    if (!window.estadoCinema.videoId) {
        if(typeof mostrarToast === 'function') mostrarToast("O projetor está sem fita.", "🎬");
        return;
    }

    const novoStatus = !window.estadoCinema.euPronto;
    window.estadoCinema.euPronto = novoStatus;

    const btn = document.getElementById('btn-chave-dupla');
    if (novoStatus) {
        if (btn) btn.classList.add('ativado');
        document.getElementById('texto-btn-chave').innerText = "SISTEMA ARMADO";
        if(window.Haptics) navigator.vibrate([50, 100, 50]);
    } else {
        if (btn) btn.classList.remove('ativado');
        document.getElementById('texto-btn-chave').innerText = "ESTOU PRONTO (Sincronizar)";
        if(window.Haptics) window.Haptics.toqueLeve();
    }

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, update } = window.SantuarioApp.modulos;
    update(ref(db, 'utilitarios/cinema'), {
        [window.MEU_NOME]: novoStatus
    });
};

window.escutarCinemaGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refCinema = ref(db, 'utilitarios/cinema');
    
    onValue(refCinema, (snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;

        const mudouVideo = dados.videoId !== window.estadoCinema.videoId;
        const forcarReload = dados.timestamp !== window.estadoCinema.ultimoTimestamp;

        if (dados.videoId && (mudouVideo || forcarReload || (!window.youtubePlayer && dados.tipo === 'youtube'))) {
            
            window.estadoCinema.videoId = dados.videoId;
            window.estadoCinema.tipoVideo = dados.tipo || 'youtube';
            window.estadoCinema.ultimoTimestamp = dados.timestamp;
            window.estadoCinema.contagemEmAndamento = false;
            
            window.estadoCinema.euPronto = false;
            const btnChave = document.getElementById('btn-chave-dupla');
            if (btnChave) btnChave.classList.remove('ativado');
            document.getElementById('texto-btn-chave').innerText = "ESTOU PRONTO (Sincronizar)";
            
            window.carregarVideoNoPlayer(dados.videoId, window.estadoCinema.tipoVideo);
        }

        const euProntoNuven = dados[window.MEU_NOME] || false;
        const parceiroProntoNuvem = dados[window.NOME_PARCEIRO] || false;
        
        window.estadoCinema.euPronto = euProntoNuven;
        window.estadoCinema.parceiroPronto = parceiroProntoNuvem;

        if (euProntoNuven) {
            document.getElementById('luz-status-eu').classList.add('pronto');
            document.getElementById('texto-status-eu').innerText = "Sistema Armado";
            document.getElementById('texto-status-eu').style.color = "#00ffcc";
        } else {
            document.getElementById('luz-status-eu').classList.remove('pronto');
            document.getElementById('texto-status-eu').innerText = "Ajustando Poltrona...";
            document.getElementById('texto-status-eu').style.color = "#888";
        }

        const iconeConexao = document.getElementById('icone-conexao-cinema');
        if (parceiroProntoNuvem) {
            document.getElementById('luz-status-parceiro').classList.add('pronto');
            document.getElementById('texto-status-parceiro').innerText = "Pronta e Aguardando";
            document.getElementById('texto-status-parceiro').style.color = "#00ffcc";
            if (iconeConexao) {
                iconeConexao.style.filter = "grayscale(0)";
                iconeConexao.style.textShadow = "0 0 15px #00ffcc";
            }
        } else {
            document.getElementById('luz-status-parceiro').classList.remove('pronto');
            document.getElementById('texto-status-parceiro').innerText = "Ainda não está pronta";
            document.getElementById('texto-status-parceiro').style.color = "#888";
            if (iconeConexao) {
                iconeConexao.style.filter = "grayscale(1)";
                iconeConexao.style.textShadow = "none";
            }
        }

        if (euProntoNuven && parceiroProntoNuvem && window.estadoCinema.videoId && !window.estadoCinema.contagemEmAndamento) {
            window.iniciarContagemCinematografica();
        }
    });
};

window.iniciarContagemCinematografica = function() {
    window.estadoCinema.contagemEmAndamento = true;
    
    if (window.estadoCinema.tipoVideo === 'youtube') {
        if (window.youtubePlayer && typeof window.youtubePlayer.seekTo === 'function') {
            window.youtubePlayer.seekTo(0);
            window.youtubePlayer.pauseVideo();
        }
    } else if (window.estadoCinema.tipoVideo === 'drive') {
        const playerNativo = document.getElementById('player-nativo');
        if (playerNativo) {
            playerNativo.currentTime = 0;
            playerNativo.pause();
        }
    }

    const overlay = document.getElementById('overlay-contagem-cinema');
    const numeroEl = document.getElementById('numero-contagem-cinema');
    const ambilight = document.getElementById('cinema-ambilight');
    
    if (overlay) overlay.classList.remove('escondido');
    if (ambilight) {
        ambilight.style.background = '#00d4ff';
        ambilight.style.opacity = '0.5';
    }

    let contador = 3;
    if (numeroEl) numeroEl.innerText = contador;

    const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    beep.volume = 0.5; beep.play().catch(e=>{});

    let intervalo = setInterval(() => {
        contador--;
        if (contador > 0) {
            if (numeroEl) numeroEl.innerText = contador;
            beep.currentTime = 0; beep.play().catch(e=>{});
            if(window.Haptics) navigator.vibrate(50);
        } else {
            clearInterval(intervalo);
            if (numeroEl) numeroEl.innerText = "PLAY";
            if(window.Haptics) navigator.vibrate([100, 100, 400]);
            
            setTimeout(() => {
                if (overlay) overlay.classList.add('escondido');
                if (ambilight) ambilight.style.opacity = '0.1';
                
                if (window.estadoCinema.tipoVideo === 'youtube') {
                    if (window.youtubePlayer && typeof window.youtubePlayer.playVideo === 'function') {
                        window.youtubePlayer.playVideo();
                    }
                } else if (window.estadoCinema.tipoVideo === 'drive') {
                    const playerNativo = document.getElementById('player-nativo');
                    if (playerNativo) {
                        playerNativo.play().catch(err => {
                            console.error("Autoplay bloqueado pelo navegador.", err);
                            if(typeof mostrarToast === 'function') mostrarToast("Toque no player para dar o play.", "⚠️");
                        });
                    }
                }
            }, 800);
        }
    }, 1000);
};