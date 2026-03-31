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
                    tela.classList.add('escondido');
                    tela.classList.remove('saindo');
                    tela.classList.remove('ativo');
                });

                // 3. Mostra apenas a tela que você clicou
                const elementoTela = document.getElementById(telaAlvo);
                if (elementoTela) {
                    elementoTela.classList.remove('escondido');
                    elementoTela.classList.add('ativo');
                }

                telaAtual = telaAlvo;

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

// ========== SERVICE WORKER E ATUALIZAÇÕES ==========
function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Service Worker registrado!', reg);
                mostrarToast('✅ Service Worker ativo!');

                reg.addEventListener('updatefound', () => {
                    const novoSW = reg.installing;
                    console.log('Nova versão do Service Worker encontrada!');
                    novoSW.addEventListener('statechange', () => {
                        if (novoSW.state === 'installed' && navigator.serviceWorker.controller) {
                            mostrarToast('🔄 Nova versão disponível! Feche e abra o app novamente.');
                        }
                    });
                });
            })
            .catch(err => {
                console.error('Erro ao registrar Service Worker:', err);
                mostrarToast('❌ Erro ao registrar Service Worker: ' + err.message);
            });
    } else {
        mostrarToast('❌ Service Worker não suportado neste navegador.');
    }
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

// ==========================================
// BOOT DO SISTEMA
// ==========================================
window.addEventListener('DOMContentLoaded', () => {

    // --- 1. REMOVER SPLASH SCREEN ---
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('oculto');
            setTimeout(() => splash.remove(), 1000);
            window.injetarMotor3D(); // <--- CHAMA O 3D DEPOIS QUE A TELA APARECEU
        }, 2500); 
    }

    // --- 2. RASTRO DE LUZ (MAGIC TOUCH TRAIL) ---
    const criarRastro = (e) => {
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        if (x === undefined || y === undefined) return;

        const rastro = document.createElement('div');
        rastro.className = 'rastro-luz';
        rastro.style.left = `${x}px`;
        rastro.style.top = `${y}px`;
        document.body.appendChild(rastro);
        setTimeout(() => rastro.remove(), 800);
    };
    window.addEventListener('mousemove', criarRastro);

    // --- 3. EFEITO RIPPLE NOS BOTÕES (ONDAS NA ÁGUA) ---
    const elementosClicaveis = document.querySelectorAll('button, .item-menu, .btn-acao, .item-jogo, .item-cofre');
    elementosClicaveis.forEach(btn => {
        btn.classList.add('btn-ripple'); 
        
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX) || rect.left + rect.width/2;
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || rect.top + rect.height/2;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            const circulo = document.createElement('span');
            circulo.classList.add('ripple-onda');
            
            const diametro = Math.max(this.clientWidth, this.clientHeight);
            circulo.style.width = circulo.style.height = `${diametro}px`;
            circulo.style.left = `${x - diametro/2}px`;
            circulo.style.top = `${y - diametro/2}px`;
            
            this.appendChild(circulo);
            setTimeout(() => circulo.remove(), 600);
        });
    });

    // --- MELHORIA: EFEITO PARALLAX NAS PARTÍCULAS ---
    const particulas = document.querySelector('.particulas');
    if (particulas) {
        let animacaoParallaxPendente = false;
window.addEventListener('deviceorientation', (e) => {
    if (animacaoParallaxPendente) return;
    animacaoParallaxPendente = true;
    requestAnimationFrame(() => {
        const x = Math.min(Math.max(e.gamma, -30), 30);
        const y = Math.min(Math.max(e.beta - 45, -30), 30);
        if (particulas) {
            // translate3d obriga a placa de vídeo a fazer o trabalho suavemente
            particulas.style.transform = `translate3d(${x * 0.5}px, ${y * 0.5}px, 0)`;
        }
        animacaoParallaxPendente = false;
    });
});

        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            particulas.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
    
    setInterval(atualizarMotorDoTempo, 1000);
    atualizarMotorDoTempo();
    atualizarDinamicaHome();
    configurarNavegacao();
    carregarDadosExternos();
    carregarLeis();
    atualizarClima();
    atualizarSaudacao();
    setInterval(atualizarSaudacao, 60000);
    verificarEstadoBotaoSurpresa();
    setInterval(verificarEstadoBotaoSurpresa, 60000);

    const temaIcon = document.getElementById('tema-icon');
    const temaSelector = document.getElementById('tema-selector');

    if (temaIcon && temaSelector) {
        temaIcon.addEventListener('click', () => {
            temaSelector.classList.toggle('escondido');
        });
        document.querySelectorAll('.btn-tema').forEach(btn => {
            btn.addEventListener('click', () => {
                temaSelector.classList.add('escondido');
            });
        });
    }

    if (typeof inicializarSurpresaDiaria === 'function') inicializarSurpresaDiaria();
    const btnSurpresa = document.getElementById("btn-surpresa");
    if (btnSurpresa && typeof mostrarMensagemSurpresa === 'function') {
        btnSurpresa.onclick = mostrarMensagemSurpresa;
    }

    registrarServiceWorker();

    const btnVerificar = document.getElementById('btn-verificar-atualizacao');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', verificarAtualizacao);
    }

    window.addEventListener('loginSucesso', () => {
        if (window.SantuarioApp && typeof window.SantuarioApp.conectar === 'function') {
            window.SantuarioApp.conectar();
        }
    });

    // --- MELHORIA UX: O TOQUE SECRETO (EASTER EGG) ---
    const timerSecreto = document.getElementById('timer-principal');
    let timerPressionado; 

    if (timerSecreto) {
        const segredos = [
            "Você descobriu um segredo: Eu te amo mais do que ontem! 💖",
            "Mesmo de olhos fechados, é o seu rosto que eu vejo. ✨",
            "Colombo e Goiânia nunca estiveram tão perto. 🌍",
            "Continue segurando minha mão, mesmo de longe. 🤝",
            "Cada segundo desse contador valeu a pena por te conhecer. ⏳"
        ];

        const revelarSegredo = () => {
            const fraseSorteada = segredos[Math.floor(Math.random() * segredos.length)];
            mostrarToast(fraseSorteada);

            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 80,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#D4AF37', '#ff6b6b', '#ffffff'] 
                });
            }
            
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]); 
            }
        };

        const iniciarToque = (e) => {
            if (e.type === 'touchstart') { e.preventDefault(); }
            timerPressionado = setTimeout(revelarSegredo, 3000);
            timerSecreto.style.transform = 'scale(0.95)';
            timerSecreto.style.opacity = '0.7';
            timerSecreto.style.transition = 'all 3s ease'; 
        };

        const cancelarToque = () => {
            clearTimeout(timerPressionado);
            timerSecreto.style.transform = 'scale(1)';
            timerSecreto.style.opacity = '1';
            timerSecreto.style.transition = 'all 0.2s ease';
        };

        timerSecreto.addEventListener('touchstart', iniciarToque, {passive: false});
        timerSecreto.addEventListener('touchend', cancelarToque);
        timerSecreto.addEventListener('touchcancel', cancelarToque); 
        timerSecreto.addEventListener('mousedown', iniciarToque);
        timerSecreto.addEventListener('mouseup', cancelarToque);
        timerSecreto.addEventListener('mouseleave', cancelarToque);
    }

    // --- 1. CICLO CIRCADIANO ---
    const atualizarCicloDia = () => {
        const hora = new Date().getHours();
        const body = document.body;
        body.classList.remove('manha', 'tarde', 'crepusculo', 'noite');
        if (hora >= 5 && hora < 12) { body.classList.add('manha'); } 
        else if (hora >= 12 && hora < 17) { body.classList.add('tarde'); } 
        else if (hora >= 17 && hora < 19) { body.classList.add('crepusculo'); } 
        else { body.classList.add('noite'); }
    };
    atualizarCicloDia(); 
    setInterval(atualizarCicloDia, 60000); 

    // --- 2. OURO VIVO NA FRASE DO DIA ---
    const observarFraseDia = new MutationObserver(() => {
        const textoMaquina = document.getElementById('texto-maquina-escrever');
        if (textoMaquina && !textoMaquina.classList.contains('texto-ouro-vivo')) {
            textoMaquina.classList.add('texto-ouro-vivo');
        }
    });
    const elFrase = document.getElementById('frase-do-dia');
    if (elFrase) observarFraseDia.observe(elFrase, { childList: true, subtree: true });

    // --- 3. REFLEXO DE CRISTAL NOS CARTÕES DE VIDRO ---
    const ativarReflexo = () => {
        const cartoes = document.querySelectorAll('.cartao-vidro');
        const cartaoSorteado = cartoes[Math.floor(Math.random() * cartoes.length)];
        
        if (cartaoSorteado) {
            cartaoSorteado.classList.add('reflexo-ativo');
            setTimeout(() => { cartaoSorteado.classList.remove('reflexo-ativo'); }, 1000);
        }
    };
    setInterval(ativarReflexo, 6000);

    let ultimoTempoReflexo = 0;
    window.addEventListener('deviceorientation', (e) => {
        const agora = Date.now();
        if ((Math.abs(e.gamma) > 10 || Math.abs(e.beta) > 10) && agora - ultimoTempoReflexo > 2000) {
            ativarReflexo();
            ultimoTempoReflexo = agora;
        }
    });

    // ==========================================
    // SISTEMA DE ALERTA INTELIGENTE
    // ==========================================
    window.mostrarAlertaEmergencia = (estado, nomeParceiro) => {
        const modal = document.getElementById('modal-emergencia');
        const titulo = document.getElementById('emergencia-titulo');
        const mensagem = document.getElementById('emergencia-mensagem');
        
        if (!modal) return;

        const dataHoje = new Date().toLocaleDateString('pt-BR');
        const chaveAlerta = `alerta_visto_${estado}_${dataHoje}`;

        if (localStorage.getItem(chaveAlerta) === 'sim') return; 

        let msg = "";
        let cor = "#ff6b6b";
        
        if (estado === 'cansado' || estado === 'cansada') { 
            msg = window.souJoao ? `${nomeParceiro} está CANSADA. Ela precisa de você agora. Dê uma atenção especial.` : `${nomeParceiro} está CANSADO. Ele precisa de você agora. Dê uma atenção especial.`; 
            cor = "#f39c12"; 
        } else if (estado === 'triste') {
            msg = `${nomeParceiro} está TRISTE. Vá dar um abraço ou mande uma mensagem de carinho.`;
            cor = "#3498db";
        } else if (estado === 'doente') {
            msg = `${nomeParceiro} está DOENTE. Precisa de cuidados e muito mimo hoje.`;
            cor = "#e74c3c";
        } else {
            msg = `${nomeParceiro} ativou um alerta de atenção.`;
        }

        if(titulo) titulo.style.color = cor;
        if(mensagem) mensagem.innerText = msg;
        
        modal.classList.remove('escondido');

        const btnFechar = document.getElementById('btn-fechar-emergencia') || modal.querySelector('button');
        if (btnFechar) {
            btnFechar.onclick = () => {
                modal.classList.add('escondido');
                localStorage.setItem(chaveAlerta, 'sim'); 
            };
        }
    };

    // ==========================================
    // SISTEMA NEURAL: SANTUÁRIO NA MENTE (OFFLINE)
    // ==========================================
    window.configurarModoOffline = () => {
        const aviso = document.getElementById('aviso-offline');
        const elementosParaCongelar = ['btn-pulso', 'btn-gravar-eco', 'btn-add-foto', 'input-mood'];

        const atualizarEstadoConexao = () => {
            if (navigator.onLine) {
                if (aviso) aviso.classList.add('escondido');
                elementosParaCongelar.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.remove('desativado-offline');
                });
                if (window.SantuarioApp && typeof window.SantuarioApp.conectar === 'function') {
                    console.log("Internet restaurada. Reconectando ao núcleo...");
                }
            } else {
                if (aviso) aviso.classList.remove('escondido');
                elementosParaCongelar.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('desativado-offline');
                });
            }
        };

        window.addEventListener('online', atualizarEstadoConexao);
        window.addEventListener('offline', atualizarEstadoConexao);
        atualizarEstadoConexao();
    };

    // ==========================================
    // MOTOR DO VIDRO MAGNÉTICO + GLARE (OTIMIZADO PARA GPU)
    // ==========================================
    window.ativarVidroMagnetico = () => {
        if (window.DeviceOrientationEvent) {
            let animacaoPendente = false;

            window.addEventListener('deviceorientation', (e) => {
                // Se a placa de vídeo ainda não processou o último quadro, ignora a leitura do sensor
                if (animacaoPendente) return;
                animacaoPendente = true;

                requestAnimationFrame(() => {
                    const tiltX = Math.min(Math.max((e.beta || 0) - 45, -10), 10); 
                    const tiltY = Math.min(Math.max(e.gamma || 0, -10), 10);
                    const glareX = (e.gamma || 0) * 1.5;
                    const glareY = ((e.beta || 0) - 45) * 1.5;

                    document.documentElement.style.setProperty('--tilt-x', `${tiltX / -2}deg`);
                    document.documentElement.style.setProperty('--tilt-y', `${tiltY / 2}deg`);
                    document.documentElement.style.setProperty('--glare-x', `${glareX}`);
                    document.documentElement.style.setProperty('--glare-y', `${glareY}`);
                    
                    animacaoPendente = false; // Libera para a próxima leitura
                });
            }, { passive: true }); // passive: true avisa o navegador que não vamos travar o scroll
        }
    };


    // ==========================================
    // INICIALIZADOR GLOBAL MESTRE (O BOOT)
    // ==========================================
    
    window.addEventListener('load', () => {
        if(typeof ativarVidroMagnetico === 'function') ativarVidroMagnetico();
        if(typeof ativarParticulasDeToque === 'function') ativarParticulasDeToque();
        if(typeof ativarBottomSheets === 'function') ativarBottomSheets();
        if(typeof configurarModoOffline === 'function') configurarModoOffline();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.comando === 'disparar_pulso_remoto') {
                    setTimeout(() => {
                        if(typeof window.enviarPulso === 'function') {
                            window.enviarPulso();
                            mostrarToast("💖 Pulso enviado direto da notificação!");
                        }
                    }, 1000); 
                }
            });
        }

        const urlParams = new URLSearchParams(window.location.search);
        const acaoSiri = urlParams.get('acao');
        
        if (acaoSiri) {
            setTimeout(() => {
                if (acaoSiri === 'pulso' || acaoSiri === 'disparar_pulso_remoto') {
                    if(typeof window.enviarPulso === 'function') {
                        window.enviarPulso();
                        if(typeof window.mostrarToast === 'function') window.mostrarToast("💖 Pulso enviado pela Siri/Atalho!");
                    }
                } 
                else if (acaoSiri === 'mood') {
                    const sentimento = urlParams.get('tipo') || 'saudade';
                    const inputMood = document.getElementById('input-mood');
                    if (inputMood) inputMood.value = "Enviado por comando de voz 🎙️";
                    if(typeof window.enviarMood === 'function') window.enviarMood(sentimento);
                } 
                else if (acaoSiri === 'cofre') {
                    const abaCofre = document.querySelector('[data-alvo="cofre"]');
                    if (abaCofre) abaCofre.click();
                }
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 3000); 
        }
    });

    // =========================================================================
    // FASE 2: A MÁGICA DA OTIMIZAÇÃO (O SEGREDO PARA A GPU DO CELULAR NÃO FRITAR)
    // =========================================================================
    window.addEventListener('motor3DPronto', () => {
        // 1. CARREGAMENTO IMEDIATO: Apenas o que a Home precisa de cara!
        if(typeof inicializarGlobo3D === 'function') inicializarGlobo3D(); 
        if(typeof inicializarCoracao3D === 'function') inicializarCoracao3D(); 
        if(typeof inicializarOrbeClima === 'function') inicializarOrbeClima(); 

        // 🚨 REMOVIDOS: Eco, Bússola, Carrossel, Prisma e Jornada.
        // Eles agora são invocados sob demanda, salvando 70% da memória RAM!
    });
}); // Fecha o DOMContentLoaded

// Localize a função voltarMenuJogos e adicione a trava do Julgamento, Contratos e Defesa:
window.voltarMenuJogos = function() {
    window.julgamentoAtivo = false; // 🚨 MATA O LOOP FANTASMA DO MATCH-3 IMEDIATAMENTE

    // 🚨 ADICIONADO 'contratos' e 'defesa' NA LISTA DE JOGOS PARA ESCONDER
    const jogosContainers = ['termo', 'tribunal', 'sincronia', 'julgamento', 'minifazenda', 'jardim', 'contratos', 'estufa', 'cartorio', 'banco', 'pericia', 'logistica', 'agua', 'agenda', 'roleta', 'guardiao', 'cinema', 'correio', 'pager', 'tesouro'];
    
    jogosContainers.forEach(jogoId => {
        const el = document.getElementById(`container-${jogoId}`);
        if (el) el.classList.add('escondido');
    });

    const menuLista = document.getElementById('menu-jogos-lista');
    const menuGrid = document.querySelector('.jogos-grid');
    const menuJogos = document.getElementById('menu-jogos');
    const headerJogos = document.getElementById('header-jogos-main');
    const navInferior = document.querySelector('.menu-inferior');

    if (menuLista) menuLista.classList.remove('escondido');
    if (menuGrid) menuGrid.classList.remove('escondido');
    if (menuJogos) menuJogos.classList.remove('escondido');
    if (headerJogos) headerJogos.classList.remove('escondido');
    if (navInferior) navInferior.classList.remove('escondido');

    document.body.classList.remove('modo-jogo-ativo');
};

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

// ==========================================
// 🚀 O ANIQUILADOR DE GARGALOS (UNMOUNTING & LAZY LOAD DEFINITIVO)
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    const motorDeUnmount = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.attributeName === 'class') {
                const elemento = mutation.target;
                
                // Verifica se a tela/jogo acabou de ser ocultada
                const foiOcultado = elemento.classList.contains('escondido') || 
                                    elemento.classList.contains('takeover-escondido') ||
                                    (!elemento.classList.contains('ativo') && elemento.classList.contains('tela'));
                
                if (foiOcultado) {
                    // 1. LIBERAÇÃO DE PLACA DE VÍDEO (GPU): Destrói Canvas 3D perdidos
                    const graficos3D = elemento.querySelectorAll('canvas');
                    graficos3D.forEach(canvas => {
                        const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
                        if (gl) {
                            const ext = gl.getExtension('WEBGL_lose_context');
                            if (ext) ext.loseContext(); // Purga a RAM imediatamente
                        }
                        canvas.remove(); // Remove o esqueleto do DOM para ser recriado limpo no futuro
                    });

                    // 2. HIBERNAÇÃO MULTIMÍDIA: Para todos os vídeos ocultos (ex: galaxia.mp4, reencontro.mp4)
                    const videos = elemento.querySelectorAll('video');
                    videos.forEach(v => v.pause());

                    // 3. UNMOUNTING REAL (DESTRUIÇÃO DE DOM): Limpa as entranhas dos minigames
                    // Protegemos os containers que você fez "hardcoded" direto no HTML (água, fantasma e paradoxo)
                    const containersProtegidos = ['container-agua', 'container-fantasma', 'container-paradoxo', 'container-roleta'];
                    
                    if (elemento.id.startsWith('container-') && !containersProtegidos.includes(elemento.id)) {
                        // Aguarda 300ms (tempo da animação visual de fechamento do jogo) antes de pulverizar o código
                        setTimeout(() => { 
                            if (elemento.classList.contains('escondido')) {
                                elemento.innerHTML = ''; // 🔥 A MÁGICA: Apaga as mil linhas de HTML do jogo da memória!
                            }
                        }, 300);
                    }
                }
            }
        });
    });

    // Coloca o Motor para vigiar absolutamente TODAS as janelas pesadas do Santuário
    const blocosPesados = document.querySelectorAll('.tela, [id^="container-"], [id^="mesa-"], [id^="overlay-"]');
    blocosPesados.forEach(bloco => {
        motorDeUnmount.observe(bloco, { attributes: true });
    });
});