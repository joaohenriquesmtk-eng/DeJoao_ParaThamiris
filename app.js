// 3. NAVEGAÇÃO SPA COM TRANSIÇÕES NÍVEL "APPLE" (View Transitions API)
function configurarNavegacao() {
    const botoesMenu = document.querySelectorAll('.item-menu');
    const todasAsTelas = document.querySelectorAll('.tela');
    let trocandoTela = false; // Trava de segurança

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', async (evento) => {
            evento.preventDefault();
            const telaAlvo = botao.getAttribute('data-alvo');
            
            // Se já estiver na tela ou a animação estiver rodando, ignora
            if (telaAlvo === telaAtual || trocandoTela) return;
            trocandoTela = true;
            const telaAnterior = telaAtual;

            // A função exata de troca de classes no DOM
            const atualizarDOM = () => {
                // 1. Atualiza os botões do menu
                botoesMenu.forEach(b => b.classList.remove('ativo'));
                botao.classList.add('ativo');

                // 2. Esconde todas as telas principais com segurança
                todasAsTelas.forEach(tela => {
                    pausarMidiasDeElemento(tela);
                    tela.classList.add('escondido');
                    tela.classList.remove('saindo');
                    tela.classList.remove('ativo');
                });

                // 3. Mostra apenas a tela que você clicou
                const elementoTela = document.getElementById(telaAlvo);
                if (elementoTela) {
                    elementoTela.classList.remove('escondido');
                    elementoTela.classList.add('ativo');
                    ativarImagensDeElemento(elementoTela);
                    reativarVideosDeElemento(elementoTela);
                }

                telaAtual = telaAlvo;

                document.body.classList.remove('home-ativa', 'jogos-ativa', 'cofre-ativa', 'leis-ativa', 'jornada-ativa');

                if (telaAlvo === 'home') document.body.classList.add('home-ativa');
                if (telaAlvo === 'jogos') document.body.classList.add('jogos-ativa');
                if (telaAlvo === 'cofre') document.body.classList.add('cofre-ativa');
                if (telaAlvo === 'leis') document.body.classList.add('leis-ativa');
                if (telaAlvo === 'jornada') document.body.classList.add('jornada-ativa');

                // ==========================================
                // LÓGICAS ESPECÍFICAS DE CADA TELA
                // ==========================================
                
                // INICIALIZA A JORNADA 3D APENAS AO CLICAR NA ABA
                if (telaAlvo === 'jornada') {
                    if (typeof window.inicializarJornada3D === 'function') window.inicializarJornada3D();
                }

                // Áudio dos Jogos
                if (telaAlvo === 'jogos') {
                    if (typeof playAudioJogos === 'function') playAudioJogos();
                } else if (telaAnterior === 'jogos') {
                    if (typeof pauseAudioJogos === 'function') pauseAudioJogos();
                }

                // Animação do Pergaminho
                if (telaAlvo === 'leis') {
                    if(typeof window.animarLeisEmCascata === 'function') window.animarLeisEmCascata();
                }

                // Áudio Espacial (Mesa de Som)
                if (telaAlvo === 'cofre') {
                    if (window.MotorDeAudio) window.MotorDeAudio.abafar(); 
                } else if (telaAnterior === 'cofre') {
                    if (window.MotorDeAudio) window.MotorDeAudio.focar(); 
                }
                
            };

            // A MÁGICA: Se o celular suportar a View Transitions API
            if (document.startViewTransition) {
                const transicao = document.startViewTransition(() => atualizarDOM());
                await transicao.finished; // Espera a animação gráfica terminar
            } else {
                // FALLBACK: Para celulares muito antigos, mantém o seu efeito antigo
                const telaAtiva = document.getElementById(telaAnterior);
                if (telaAtiva) telaAtiva.classList.add('saindo');
                await new Promise(r => setTimeout(r, 300));
                atualizarDOM();
            }

            trocandoTela = false; // Libera o clique novamente
        });
    });
}

window.santuarioBootExecutado = window.santuarioBootExecutado || false;
window.listenerLoginBootRegistrado = window.listenerLoginBootRegistrado || false;
window.onLoginSucessoBoot = window.onLoginSucessoBoot || null;

// ========== SERVICE WORKER E ATUALIZAÇÕES ==========
window.toastServiceWorkerMostrado = false;

function mostrarToastServiceWorkerAtivo() {
    window.toastServiceWorkerMostrado = true;
    return;
}

function registrarServiceWorker() {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('./sw.js')
        .then(reg => {
            console.log('Service Worker registrado!', reg);
            mostrarToastServiceWorkerAtivo();

            navigator.serviceWorker.ready
                .then(() => {
                    mostrarToastServiceWorkerAtivo();
                })
                .catch(() => {});

            reg.addEventListener('updatefound', () => {
                const novoSW = reg.installing;
                if (!novoSW) return;

                novoSW.addEventListener('statechange', () => {
                    if (novoSW.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('Nova versão do app disponível.');
                    }
                });
            });
        })
        .catch(err => {
            console.error('Erro ao registrar Service Worker:', err);
        });
}

function verificarAtualizacao() {
    mostrarToast('🔍 Verificando atualizações...');

    if (!('serviceWorker' in navigator)) {
        mostrarToast('❌ Service Worker não suportado neste navegador.');
        return;
    }

    navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => {
                    mostrarToast('✅ Service Worker registrado. Recarregue a página.');
                })
                .catch(err => {
                    console.error('Erro ao registrar:', err);
                    mostrarToast('❌ Erro ao registrar: ' + err.message);
                });
            return;
        }

        reg.update()
            .then(() => {
                if (reg.installing) {
                    reg.installing.addEventListener('statechange', function () {
                        if (this.state === 'installed' && navigator.serviceWorker.controller) {
                            mostrarToast('🔄 Nova versão disponível! Feche e reabra o app.');
                        }
                    });
                } else if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    mostrarToast('🔄 Nova versão disponível! Aplicando...');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    mostrarToast('✅ Você já está na versão mais recente.');
                }
            })
            .catch(err => {
                console.error('Erro ao atualizar:', err);
                mostrarToast('❌ Erro ao verificar atualização.');
            });
    });
}

function agendarTarefaLeveBoot(fn, atraso = 0, timeoutIdle = 2000) {
    const timer = setTimeout(() => {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                try {
                    fn();
                } catch (erro) {
                    console.error('Falha em tarefa leve do boot:', erro);
                }
            }, { timeout: timeoutIdle });
        } else {
            setTimeout(() => {
                try {
                    fn();
                } catch (erro) {
                    console.error('Falha em tarefa leve do boot:', erro);
                }
            }, 0);
        }
    }, atraso);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addTimeout('boot', timer);
    }
}

function bootCritico() {
    window.isAndroidDevice = /Android/i.test(navigator.userAgent);

    if (window.isAndroidDevice) {
        document.documentElement.classList.add('modo-android-desempenho');
        console.log("🤖 Android detectado! Cortando processamentos pesados.");
    } else {
        console.log("🍏 iOS detectado! Gráficos no modo Ultra.");
    }

    atualizarMotorDoTempo();
    atualizarDinamicaHome();
    configurarNavegacao();
    verificarEstadoBotaoSurpresa();

    const home = document.getElementById('home');
    if (home) {
        ativarImagensDeElemento(home);
        reativarVideosDeElemento(home);
    }

    const temaIcon = document.getElementById('tema-icon');
    const temaSelector = document.getElementById('tema-selector');

    if (temaIcon && temaSelector) {
        temaIcon.onclick = () => {
            temaSelector.classList.toggle('escondido');
        };

        document.querySelectorAll('.btn-tema').forEach(btn => {
            btn.onclick = () => {
                temaSelector.classList.add('escondido');
            };
        });
    }

    const btnVerificar = document.getElementById('btn-verificar-atualizacao');
    if (btnVerificar) {
        btnVerificar.onclick = verificarAtualizacao;
    }
}

function bootSecundario() {
    window.SantuarioRuntime.addInterval('boot', setInterval(atualizarMotorDoTempo, 1000));
    window.SantuarioRuntime.addInterval('boot', setInterval(atualizarSaudacao, 60000));
    window.SantuarioRuntime.addInterval('boot', setInterval(verificarEstadoBotaoSurpresa, 60000));

    atualizarSaudacao();

    agendarTarefaLeveBoot(() => {
        carregarDadosExternos();
    }, 500, 2500);

    agendarTarefaLeveBoot(() => {
        carregarLeis();
    }, 900, 3000);

    agendarTarefaLeveBoot(() => {
        atualizarClima();
    }, 1400, 3000);

    if (typeof inicializarSurpresaDiaria === 'function') {
        agendarTarefaLeveBoot(() => {
            inicializarSurpresaDiaria();
        }, 1200, 2500);
    }

    const btnSurpresa = document.getElementById("btn-surpresa");
    if (btnSurpresa && typeof mostrarMensagemSurpresa === 'function') {
        btnSurpresa.onclick = mostrarMensagemSurpresa;
    }
}

function bootSobDemanda() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        window.SantuarioRuntime.addTimeout('boot', setTimeout(() => {
            splash.classList.add('oculto');

            window.SantuarioRuntime.addTimeout('boot', setTimeout(() => splash.remove(), 1000));

            agendarTarefaLeveBoot(() => {
                if (typeof window.injetarMotor3D === 'function') {
                    window.injetarMotor3D();
                }
            }, 300, 2500);

            agendarTarefaLeveBoot(() => {
                registrarServiceWorker();
            }, 700, 3000);
        }, 2500));
    }

    if (!window.listenerLoginBootRegistrado) {
        window.listenerLoginBootRegistrado = true;

        window.onLoginSucessoBoot = () => {
            if (window.SantuarioApp && typeof window.SantuarioApp.conectar === 'function') {
                window.SantuarioApp.conectar();
            }
        };

        window.addEventListener('loginSucesso', window.onLoginSucessoBoot);

        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.addCleanup('boot-ui', () => {
                if (window.onLoginSucessoBoot) {
                    window.removeEventListener('loginSucesso', window.onLoginSucessoBoot);
                    window.onLoginSucessoBoot = null;
                }
                window.listenerLoginBootRegistrado = false;
            });
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (window.santuarioBootExecutado) return;
    window.santuarioBootExecutado = true;

    bootCritico();
    bootSecundario();
    bootSobDemanda();
}, { once: true });

// ==========================================
// INJEÇÃO LAZY LOAD (MOTOR 3D)
// ==========================================
window.injetarMotor3D = function() {
    if (document.getElementById('motor-3d-script')) return; // Evita carregar duas vezes
    
    const script = document.createElement('script');
    script.src = 'graficos3d.js';
    script.id = 'motor-3d-script';
    
    script.onload = () => {
        console.log("🚀 GPU Ativada: Motor 3D injetado via Lazy Load!");
        // Emite um sinal global avisando que o 3D chegou na área
        window.dispatchEvent(new Event('motor3DPronto'));
    };
    
    document.body.appendChild(script); // Dispara o download em segundo plano
};

function pausarMidiasDeElemento(elemento) {
    if (!elemento) return;

    const midias = elemento.querySelectorAll('audio, video');
    midias.forEach(midia => {
        try {
            midia.pause();

            if (midia.tagName === 'VIDEO' && !midia.hasAttribute('data-preload-fixo')) {
                midia.setAttribute('preload', 'none');
            }
        } catch (erro) {
            console.warn('Falha ao pausar mídia:', erro);
        }
    });
}

function reativarVideosDeElemento(elemento) {
    if (!elemento) return;

    const videos = elemento.querySelectorAll('video');
    videos.forEach(video => {
        const deveRetomar =
            video.hasAttribute('loop') ||
            video.hasAttribute('autoplay') ||
            video.className.includes('clima') ||
            (video.id && video.id.includes('clima'));

        if (!deveRetomar) return;

        if (video.getAttribute('preload') === 'none') {
            video.setAttribute('preload', 'metadata');
        }

        try {
            const tentativa = video.play();
            if (tentativa && typeof tentativa.catch === 'function') {
                tentativa.catch(() => {});
            }
        } catch (erro) {
            console.warn('Falha ao retomar vídeo:', erro);
        }
    });
}

function ativarImagensDeElemento(elemento) {
    if (!elemento) return;

    const imagens = elemento.querySelectorAll('img[loading="lazy"]');
    imagens.forEach(img => {
        img.decoding = 'async';
        img.fetchPriority = 'low';
    });
}

// 🚨 FORÇA O iPHONE A DESCER A TELA QUANDO O TECLADO FECHA
const onFocusOutSantuario = function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        const timerFocusOut = setTimeout(function() {
            window.scrollTo(document.body.scrollLeft, document.body.scrollTop);
        }, 100);

        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.addTimeout('boot', timerFocusOut);
        }
    }
};

document.addEventListener('focusout', onFocusOutSantuario);

if (window.SantuarioRuntime) {
    window.SantuarioRuntime.addCleanup('boot', () => {
        document.removeEventListener('focusout', onFocusOutSantuario);
    });
}