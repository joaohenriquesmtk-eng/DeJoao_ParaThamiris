// ============================================================================
// VERSÃO 2.0 - MOTOR DE CINE QUÂNTICO (YOUTUBE API + FIREBASE REALTIME)
// Padrão Elite: Inicialização Inteligente, Bypass de Autoplay Mobile, Origin Fix.
// ============================================================================

window.playerCinema = null;
window.isCinemaSyncing = false; // A Trava Quântica Anti-Loop
window.idVideoAtual = null;
window.ytApiPronta = false; // Bandeira de segurança da API
let dadosPendentesParaMontagem = null;

// Função chamada pelo core.js quando o módulo é injetado
window.inicializarCinema = function() {
    console.log("🎬 Cine Quântico Ativado");

    // Reseta o estado local ao entrar na sala
    window.playerCinema = null;
    window.isCinemaSyncing = false;
    window.idVideoAtual = null;
    dadosPendentesParaMontagem = null;

    // 1. Carrega a API IFrame do YouTube dinamicamente (Padrão Ouro do Google)
    if (!window.YT || !window.YT.Player) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        
        // A API do YouTube exige esta função global exata para avisar que carregou
        window.onYouTubeIframeAPIReady = function() {
            window.ytApiPronta = true;
            console.log("✅ YouTube API Carregada e Pronta");
            checarFilaDeMontagem();
        };
    } else {
        window.ytApiPronta = true;
        checarFilaDeMontagem();
    }

    escutarNuvemCinema();
    escutarNuvemReacoes();
};

// 🚨 A MÁGICA: Só monta o player quando a API estiver pronta E houver um vídeo de verdade!
function checarFilaDeMontagem() {
    if (window.ytApiPronta && dadosPendentesParaMontagem && !window.playerCinema) {
        montarPlayerYoutube(dadosPendentesParaMontagem);
    }
}

function montarPlayerYoutube(dados) {
    if (window.playerCinema) return; 

    // Garante que o container existe
    const containerBox = document.getElementById('youtube-player-container');
    if(!containerBox) return;

    window.isCinemaSyncing = true; // Trava enquanto constrói
    window.idVideoAtual = dados.videoId;

    window.playerCinema = new YT.Player('youtube-player-container', {
        height: '100%',
        width: '100%',
        videoId: dados.videoId, // Nunca inicia vazio, evitando o erro de Origin do postMessage
        playerVars: {
            'playsinline': 1, 
            'controls': 1,
            'disablekb': 1,
            'rel': 0,
            'modestbranding': 1,
            'enablejsapi': 1, 
            'origin': window.location.origin // Carimbo oficial de segurança
        },
        events: {
            'onReady': (event) => {
                console.log("🎥 Player Montado com Sucesso");
                
                if (dados.time > 0) {
                    event.target.seekTo(dados.time, true);
                }
                
                const precisaOverlay = dados.autor !== window.MEU_NOME;
                
                if (precisaOverlay) {
                    const txtAutor = document.getElementById('cinema-autor-texto');
                    if (txtAutor) txtAutor.innerText = dados.autor;
                    const overlay = document.getElementById('cinema-overlay');
                    if (overlay) overlay.classList.remove('escondido');
                    event.target.pauseVideo();
                } else if (dados.status === 'PLAYING') {
                    event.target.playVideo();
                } else {
                    event.target.pauseVideo();
                }

                // 🚨 PROTOCOLO PI-P (Picture in Picture)
                setTimeout(() => {
                    const iframeVideo = document.querySelector('#youtube-player-container');
                    if (iframeVideo) {
                        // Injeta permissão de PiP na tag do iframe gerada pelo YouTube
                        iframeVideo.setAttribute('allow', 'picture-in-picture');
                        
                        // Mostra o Botão de Janela Flutuante na UI
                        const btnPip = document.getElementById('btn-pip-cinema');
                        if (btnPip && document.pictureInPictureEnabled) {
                            btnPip.classList.remove('escondido');
                        }
                    }
                }, 1000);

                setTimeout(() => { window.isCinemaSyncing = false; }, 800);
            },
            'onStateChange': propagarMudancaDeEstado
        }
    });
}

function extrairIdDoYouTube(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

window.carregarNovoVideoCinema = function() {
    const input = document.getElementById('cinema-url-input');
    if (!input || !input.value.trim()) {
        if(typeof mostrarToast === 'function') mostrarToast("Cole um link válido do YouTube primeiro.", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const videoId = extrairIdDoYouTube(input.value.trim());
    if (!videoId) {
        if(typeof mostrarToast === 'function') mostrarToast("Link não reconhecido. Use um link padrão do YouTube.", "❌");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    input.value = ""; 
    window.idVideoAtual = videoId;
    
    const { db, ref, set } = window.SantuarioApp.modulos;
    set(ref(db, 'cinema/estado'), {
        videoId: videoId,
        status: 'PAUSED',
        time: 0,
        timestamp: Date.now(),
        autor: window.MEU_NOME
    });

    if(window.Haptics) window.Haptics.sucesso();
};

function propagarMudancaDeEstado(event) {
    if (window.isCinemaSyncing) return;
    if (!window.SantuarioApp || !window.idVideoAtual) return;

    const { db, ref, set } = window.SantuarioApp.modulos;
    const currentTime = window.playerCinema.getCurrentTime();
    
    // YT.PlayerState.PLAYING == 1 | PAUSED == 2
    if (event.data === YT.PlayerState.PLAYING) {
        set(ref(db, 'cinema/estado'), {
            videoId: window.idVideoAtual,
            status: 'PLAYING',
            time: currentTime,
            timestamp: Date.now(),
            autor: window.MEU_NOME
        });
    } else if (event.data === YT.PlayerState.PAUSED) {
        set(ref(db, 'cinema/estado'), {
            videoId: window.idVideoAtual,
            status: 'PAUSED',
            time: currentTime,
            timestamp: Date.now(),
            autor: window.MEU_NOME
        });
    }
}

function escutarNuvemCinema() {
    if (!window.SantuarioApp) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, 'cinema/estado'), (snapshot) => {
        const dados = snapshot.val();
        if (!dados || !dados.videoId) return;

        const indicador = document.getElementById('indicador-sync-cinema');
        if (indicador) {
            indicador.style.background = '#2ecc71';
            indicador.style.boxShadow = '0 0 10px #2ecc71';
            indicador.title = "Sincronia Quântica Ativa";
        }

        // Se o player AINDA NÃO EXISTE, guarda na fila e manda montar
        if (!window.playerCinema || typeof window.playerCinema.loadVideoById !== 'function') {
            dadosPendentesParaMontagem = dados;
            checarFilaDeMontagem();
            return;
        }

        // Se é um vídeo novo que alguém colocou
        if (dados.videoId !== window.idVideoAtual) {
            window.idVideoAtual = dados.videoId;
            window.isCinemaSyncing = true; // Ativa a trava
            
            window.playerCinema.loadVideoById(dados.videoId, dados.time);
            window.playerCinema.pauseVideo(); // Carrega pausado
            
            if (dados.autor !== window.MEU_NOME) {
                const txtAutor = document.getElementById('cinema-autor-texto');
                if (txtAutor) txtAutor.innerText = dados.autor;
                const overlay = document.getElementById('cinema-overlay');
                if (overlay) overlay.classList.remove('escondido');

                if(typeof mostrarToast === 'function') mostrarToast(`Sessão criada por ${dados.autor}!`, "🍿");
                if(window.Haptics) window.Haptics.toqueForte();
            }
            
            setTimeout(() => { window.isCinemaSyncing = false; }, 800); 
            return; 
        }

        // Se for o mesmo vídeo rolando, Sincroniza o Tempo e Play/Pause
        window.isCinemaSyncing = true; // Trava anti-loop
        
        const tempoLocal = window.playerCinema.getCurrentTime() || 0;
        // Margem de tolerância de 2.5s para conexões mais lentas não engasgarem o vídeo
        if (Math.abs(tempoLocal - dados.time) > 2.5) {
            window.playerCinema.seekTo(dados.time, true);
        }

        if (dados.status === 'PLAYING') {
            window.playerCinema.playVideo();
        } else if (dados.status === 'PAUSED') {
            window.playerCinema.pauseVideo();
        }

        setTimeout(() => { window.isCinemaSyncing = false; }, 800); 
    });
}

window.entrarNaSessaoCinema = function() {
    const overlay = document.getElementById('cinema-overlay');
    if (overlay) overlay.classList.add('escondido');
    if (window.playerCinema && typeof window.playerCinema.playVideo === 'function') {
        window.playerCinema.playVideo();
    }
};

// 🚨 RECONSTRUÇÃO DO DOM: A cura para os Iframe Ghosts (Fantasmas do YouTube)
window.sairDoCinema = function() {
    if (window.playerCinema && typeof window.playerCinema.destroy === 'function') {
        window.playerCinema.destroy(); // Remove o iframe do YouTube
        window.playerCinema = null;
    }
    
    // Como a API destruiu a nossa <div> original junto com o iframe, nós a criamos de volta!
    const telaCinema = document.querySelector('#container-cinema > div > div:nth-child(2) > div:nth-child(2)');
    if (telaCinema) {
        if (!document.getElementById('youtube-player-container')) {
            const novaDiv = document.createElement('div');
            novaDiv.id = 'youtube-player-container';
            novaDiv.style.width = '100%';
            novaDiv.style.height = '100%';
            telaCinema.insertBefore(novaDiv, telaCinema.firstChild);
        }
    }

    window.voltarMenuJogos(); 
};

// ==========================================
// O MOTOR DE EMOÇÕES FÍSICAS (CORAÇÕES VOADORES)
// ==========================================
window.enviarReacaoCinema = function() {
    if (!window.SantuarioApp) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const idReacao = Date.now() + Math.floor(Math.random() * 1000);
    set(ref(db, `cinema/reacoes/${idReacao}`), {
        autor: window.MEU_NOME,
        timestamp: Date.now()
    });

    if(window.Haptics) window.Haptics.toqueLeve();
};

window.escutarNuvemReacoes = function() {
    if (!window.SantuarioApp) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    let horaDeAberturaDaTela = Date.now();

    onValue(ref(db, 'cinema/reacoes'), (snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;

        const container = document.getElementById('reacoes-voadores-container');
        if (!container) return;

        const arrayReacoes = Object.keys(dados).map(k => dados[k]);
        const reacoesNovas = arrayReacoes.filter(r => r.timestamp > horaDeAberturaDaTela);
        
        horaDeAberturaDaTela = Date.now();

        reacoesNovas.forEach(reacao => {
            const coracao = document.createElement('div');
            coracao.className = 'coracao-cinema';
            coracao.innerHTML = reacao.autor === 'Thamiris' ? '💖' : '💙';
            
            const espalhamentoHorizontal = (Math.random() * 60) - 30; 
            coracao.style.left = `calc(50% + ${espalhamentoHorizontal}px)`;
            
            container.appendChild(coracao);
            
            setTimeout(() => {
                if (container.contains(coracao)) container.removeChild(coracao);
            }, 2500);

            if(window.Haptics && reacao.autor !== window.MEU_NOME) {
                navigator.vibrate(20);
            }
        });
    });
};

// ==========================================
// 🚀 MODO JANELA FLUTUANTE (Picture-in-Picture)
// ==========================================
window.ativarModoFlutuanteCinema = async function() {
    const iframeVideo = document.querySelector('#youtube-player-container');
    
    if (!iframeVideo) {
        if(typeof mostrarToast === 'function') mostrarToast("O projetor ainda está desligado.", "⚠️");
        return;
    }

    try {
        // Como o YouTube roda em um iframe isolado, a API padrão não captura o vídeo facilmente.
        // Solução de Engenharia: Forçamos o navegador a colocar o IFRAME inteiro em modo Fullscreen,
        // E usamos o 'playsinline=1' que configuramos lá em cima para permitir que o SO gerencie o PiP.
        
        if(typeof mostrarToast === 'function') mostrarToast("Se o vídeo pausar ao sair do app, dê play na janelinha flutuante!", "ℹ️");
        
        if (iframeVideo.requestFullscreen) {
            await iframeVideo.requestFullscreen();
        } else if (iframeVideo.webkitRequestFullscreen) { /* Safari */
            await iframeVideo.webkitRequestFullscreen();
        } else if (iframeVideo.msRequestFullscreen) { /* IE11 */
            await iframeVideo.msRequestFullscreen();
        }

        if(window.Haptics) window.Haptics.sucesso();

    } catch (erro) {
        console.error("Erro ao solicitar modo flutuante:", erro);
        if(typeof mostrarToast === 'function') mostrarToast("O seu celular não autorizou a janela flutuante.", "❌");
    }
};