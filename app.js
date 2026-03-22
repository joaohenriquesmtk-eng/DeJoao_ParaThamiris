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
    // ==========================================
    // INICIALIZAÇÃO DAS MÁGICAS UI/UX SUPREMAS
    // ==========================================

    // --- 1. REMOVER SPLASH SCREEN ---
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('oculto');
            // Remove o código do HTML após sumir para deixar o app leve
            setTimeout(() => splash.remove(), 1000);
            window.injetarMotor3D(); // <--- CHAMA O 3D DEPOIS QUE A TELA APARECEU
        }, 2500); // A tela de abertura fica por 2.5 segundos
    }

    // --- 2. RASTRO DE LUZ (MAGIC TOUCH TRAIL) ---
    const criarRastro = (e) => {
        // Pega a posição exata do dedo na tela ou do mouse
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        if (x === undefined || y === undefined) return;

        const rastro = document.createElement('div');
        rastro.className = 'rastro-luz';
        rastro.style.left = `${x}px`;
        rastro.style.top = `${y}px`;
        document.body.appendChild(rastro);

        // O rastro some sozinho em menos de 1 segundo
        setTimeout(() => rastro.remove(), 800);
    };
    window.addEventListener('mousemove', criarRastro);
    window.addEventListener('touchmove', criarRastro, {passive: true});

    // --- 3. EFEITO RIPPLE NOS BOTÕES (ONDAS NA ÁGUA) ---
    // Pega todos os botões e itens clicáveis do app
    const elementosClicaveis = document.querySelectorAll('button, .item-menu, .btn-acao, .item-jogo, .item-cofre');
    elementosClicaveis.forEach(btn => {
        btn.classList.add('btn-ripple'); // Prepara o botão para a onda
        
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            // Calcula exatamente onde o dedo tocou dentro do botão
            const clientX = e.clientX || (e.touches && e.touches[0].clientX) || rect.left + rect.width/2;
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || rect.top + rect.height/2;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            const circulo = document.createElement('span');
            circulo.classList.add('ripple-onda');
            
            // Define o tamanho da onda baseado no tamanho do botão
            const diametro = Math.max(this.clientWidth, this.clientHeight);
            circulo.style.width = circulo.style.height = `${diametro}px`;
            circulo.style.left = `${x - diametro/2}px`;
            circulo.style.top = `${y - diametro/2}px`;
            
            this.appendChild(circulo);
            // Limpa a onda depois que a animação termina
            setTimeout(() => circulo.remove(), 600);
        });
    });

    // --- MELHORIA: EFEITO PARALLAX NAS PARTÍCULAS ---
    const particulas = document.querySelector('.particulas');
    if (particulas) {
        // Lógica para quando ela estiver no celular (usando o giroscópio)
        window.addEventListener('deviceorientation', (e) => {
            // O e.gamma lê a inclinação para os lados, o e.beta lê para frente/trás
            const x = Math.min(Math.max(e.gamma, -30), 30); 
            const y = Math.min(Math.max(e.beta - 45, -30), 30); 
            particulas.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
        });

        // Lógica para se vocês abrirem no computador (usando o mouse)
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
    // Verifica o estado do botão de mensagem surpresa agora
    verificarEstadoBotaoSurpresa();

    // E a cada minuto, verifica se o dia mudou (para reativar à meia‑noite)
    setInterval(verificarEstadoBotaoSurpresa, 60000);

    // ==========================================
    // Ícone de temas - abrir/fechar seletor
    // ==========================================
    const temaIcon = document.getElementById('tema-icon');
    const temaSelector = document.getElementById('tema-selector');

    if (temaIcon && temaSelector) {
        // Clicar no ícone abre/fecha o seletor
        temaIcon.addEventListener('click', () => {
            temaSelector.classList.toggle('escondido');
        });

        // Fechar o seletor ao escolher um tema (os botões já existem)
        document.querySelectorAll('.btn-tema').forEach(btn => {
            btn.addEventListener('click', () => {
                temaSelector.classList.add('escondido');
            });
        });
    }

    // Funções de mensagem surpresa (se existirem)
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

    // Aguarda o login para atualizar a interface do pulso
    window.addEventListener('loginSucesso', () => {
        if (window.SantuarioApp && typeof window.SantuarioApp.conectar === 'function') {
            window.SantuarioApp.conectar();
        }
    });

    // --- MELHORIA UX: O TOQUE SECRETO (EASTER EGG) ---
    const timerSecreto = document.getElementById('timer-principal');
    let timerPressionado; // Variável que vai contar o tempo do dedo na tela

    if (timerSecreto) {
        // Frases que ela pode descobrir ao segurar o dedo (Você pode adicionar quantas quiser!)
        const segredos = [
            "Você descobriu um segredo: Eu te amo mais do que ontem! 💖",
            "Mesmo de olhos fechados, é o seu rosto que eu vejo. ✨",
            "Colombo e Goiânia nunca estiveram tão perto. 🌍",
            "Continue segurando minha mão, mesmo de longe. 🤝",
            "Cada segundo desse contador valeu a pena por te conhecer. ⏳"
        ];

        // Função que acontece se ela segurar por 3 segundos
        const revelarSegredo = () => {
            // Escolhe uma frase aleatória
            const fraseSorteada = segredos[Math.floor(Math.random() * segredos.length)];
            
            // Usa o seu sistema de "Toast" (aquela notificação que sobe na tela) para mostrar a frase
            mostrarToast(fraseSorteada);

            // Efeito visual de confetes (que você já tem instalado)
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 80,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#D4AF37', '#ff6b6b', '#ffffff'] // Dourado, vermelho claro e branco
                });
            }
            
            // Faz o celular vibrar suavemente (como se fosse um batimento de coração)
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]); 
            }
        };

        // Quando ela ENCOSTAR o dedo (ou clicar com o mouse)
        const iniciarToque = (e) => {
            // Evita que a tela dê zoom no celular
            if (e.type === 'touchstart') { e.preventDefault(); }
            // Começa a contar 3 segundos (3000 milissegundos)
            timerPressionado = setTimeout(revelarSegredo, 3000);
            // Dá um efeitinho visual de que o botão está afundando
            timerSecreto.style.transform = 'scale(0.95)';
            timerSecreto.style.opacity = '0.7';
            timerSecreto.style.transition = 'all 3s ease'; // Transição lenta para dar suspense
        };

        // Quando ela TIRAR o dedo (ou soltar o clique)
        const cancelarToque = () => {
            // Cancela o cronômetro se ela soltar antes dos 3 segundos
            clearTimeout(timerPressionado);
            // Volta o texto ao normal instantaneamente
            timerSecreto.style.transform = 'scale(1)';
            timerSecreto.style.opacity = '1';
            timerSecreto.style.transition = 'all 0.2s ease';
        };

        // Adiciona os "escutadores" para o celular (touch) e computador (mouse)
        timerSecreto.addEventListener('touchstart', iniciarToque, {passive: false});
        timerSecreto.addEventListener('touchend', cancelarToque);
        timerSecreto.addEventListener('touchcancel', cancelarToque); // Caso ela arraste o dedo

        timerSecreto.addEventListener('mousedown', iniciarToque);
        timerSecreto.addEventListener('mouseup', cancelarToque);
        timerSecreto.addEventListener('mouseleave', cancelarToque);
    }

    // ==========================================
    // INICIALIZAÇÃO DA JANELA VIVA
    // ==========================================

    // --- 1. CICLO CIRCADIANO (Mudança de Fundo por Hora) ---
    const atualizarCicloDia = () => {
        const hora = new Date().getHours();
        const body = document.body;
        
        // Limpa as classes antigas
        body.classList.remove('manha', 'tarde', 'crepusculo', 'noite');
        
        // Define a nova classe baseada na hora local dela
        if (hora >= 5 && hora < 12) {
            body.classList.add('manha'); // 05h às 11h59
        } else if (hora >= 12 && hora < 17) {
            body.classList.add('tarde'); // 12h às 16h59
        } else if (hora >= 17 && hora < 19) {
            body.classList.add('crepusculo'); // 17h às 18h59
        } else {
            body.classList.add('noite'); // 19h às 04h59
        }
    };
    atualizarCicloDia(); // Roda assim que o app abre
    setInterval(atualizarCicloDia, 60000); // Checa de 1 em 1 minuto se a hora mudou

    // --- 2. OURO VIVO NA FRASE DO DIA ---
    // Precisamos adicionar a classe de ouro no texto que é digitado ao vivo
    const observarFraseDia = new MutationObserver(() => {
        const textoMaquina = document.getElementById('texto-maquina-escrever');
        if (textoMaquina && !textoMaquina.classList.contains('texto-ouro-vivo')) {
            textoMaquina.classList.add('texto-ouro-vivo');
        }
    });
    const elFrase = document.getElementById('frase-do-dia');
    if (elFrase) {
        // Fica observando para adicionar o brilho assim que a máquina começar a escrever
        observarFraseDia.observe(elFrase, { childList: true, subtree: true });
    }

    // --- 3. REFLEXO DE CRISTAL NOS CARTÕES DE VIDRO ---
    const ativarReflexo = () => {
        const cartoes = document.querySelectorAll('.cartao-vidro');
        // Escolhe um cartão aleatório para dar o reflexo (para não ficar artificial)
        const cartaoSorteado = cartoes[Math.floor(Math.random() * cartoes.length)];
        
        if (cartaoSorteado) {
            cartaoSorteado.classList.add('reflexo-ativo');
            // Remove a classe depois que a luz passar, para poder acontecer de novo
            setTimeout(() => {
                cartaoSorteado.classList.remove('reflexo-ativo');
            }, 1000);
        }
    };
    
    // O reflexo acontece sozinho de tempos em tempos (a cada 6 segundos)
    setInterval(ativarReflexo, 6000);

    // E também acontece quando ela inclinar o celular (reaproveitando seu evento de deviceorientation)
    let ultimoTempoReflexo = 0;
    window.addEventListener('deviceorientation', (e) => {
        const agora = Date.now();
        // Se ela mexer muito o celular (movimento brusco de mais de 10 graus) e já passou 2 segundos do último reflexo
        if ((Math.abs(e.gamma) > 10 || Math.abs(e.beta) > 10) && agora - ultimoTempoReflexo > 2000) {
            ativarReflexo();
            ultimoTempoReflexo = agora;
        }
    });

    // ==========================================
    // SISTEMA DE ALERTA INTELIGENTE (MEMÓRIA DIÁRIA)
    // ==========================================
    window.mostrarAlertaEmergencia = (estado, nomeParceiro) => {
        const modal = document.getElementById('modal-emergencia');
        const titulo = document.getElementById('emergencia-titulo');
        const mensagem = document.getElementById('emergencia-mensagem');
        
        if (!modal) return;

        // O TRUQUE: Cria uma "chave de memória" combinando o estado e a data de hoje
        const dataHoje = new Date().toLocaleDateString('pt-BR');
        const chaveAlerta = `alerta_visto_${estado}_${dataHoje}`;

        // Se o seu celular lembrar que você já fechou esse alerta HOJE, ele cancela a exibição!
        if (localStorage.getItem(chaveAlerta) === 'sim') {
            return; 
        }

        let msg = "";
        let cor = "#ff6b6b";
        
        // Personalização da mensagem
        if (estado === 'cansado' || estado === 'cansada') { 
            if (window.souJoao) {
                msg = `${nomeParceiro} está CANSADA. Ela precisa de você agora. Dê uma atenção especial.`; 
            } else {
                msg = `${nomeParceiro} está CANSADO. Ele precisa de você agora. Dê uma atenção especial.`; 
            }
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
        
        // Mostra o modal na tela
        modal.classList.remove('escondido');

        // Configura o botão para fechar e GRAVAR NA MEMÓRIA que você já atendeu o chamado
        const btnFechar = document.getElementById('btn-fechar-emergencia') || modal.querySelector('button');
        if (btnFechar) {
            btnFechar.onclick = () => {
                modal.classList.add('escondido');
                // Salva no celular que já viu, para não incomodar mais hoje com o mesmo estado
                localStorage.setItem(chaveAlerta, 'sim'); 
            };
        }
    };

    // ==========================================
    // SISTEMA NEURAL: SANTUÁRIO NA MENTE (OFFLINE)
    // ==========================================
    window.configurarModoOffline = () => {
        const aviso = document.getElementById('aviso-offline');
        
        // Lista de IDs de botões que precisam de internet para funcionar
        const elementosParaCongelar = [
            'btn-pulso', 
            'btn-gravar-eco', 
            'btn-add-foto', 
            'input-mood'
        ];

        const atualizarEstadoConexao = () => {
            if (navigator.onLine) {
                // VOLTOU A INTERNET: O Santuário respira novamente
                if (aviso) aviso.classList.add('escondido');
                
                elementosParaCongelar.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.remove('desativado-offline');
                });

                // Tenta reconectar a comunicação em tempo real
                if (window.SantuarioApp && typeof window.SantuarioApp.conectar === 'function') {
                    console.log("Internet restaurada. Reconectando ao núcleo...");
                }
            } else {
                // CAIU A INTERNET: Ativa o modo "Santuário na Mente"
                if (aviso) aviso.classList.remove('escondido');
                
                elementosParaCongelar.forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.classList.add('desativado-offline');
                });
            }
        };

        // Os "ouvidos" do JavaScript para a placa de rede do celular
        window.addEventListener('online', atualizarEstadoConexao);
        window.addEventListener('offline', atualizarEstadoConexao);
        
        // Faz a checagem inicial assim que o app abre
        atualizarEstadoConexao();
    };

    // ==========================================
    // MOTOR DO VIDRO MAGNÉTICO + GLARE (NÍVEL 9)
    // ==========================================
    window.ativarVidroMagnetico = () => {
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (e) => {
                // 1. Cálculo para a inclinação do Cartão (3D)
                const tiltX = Math.min(Math.max((e.beta || 0) - 45, -10), 10); 
                const tiltY = Math.min(Math.max(e.gamma || 0, -10), 10);
                
                // 2. Cálculo para a posição do Brilho (Glare)
                // Multiplicamos por valores maiores para a luz correr mais rápido que o vidro
                const glareX = (e.gamma || 0) * 1.5;
                const glareY = ((e.beta || 0) - 45) * 1.5;

                // Injeta as variáveis CSS no documento
                document.documentElement.style.setProperty('--tilt-x', `${tiltX / -2}deg`);
                document.documentElement.style.setProperty('--tilt-y', `${tiltY / 2}deg`);
                
                // Variáveis do Brilho
                document.documentElement.style.setProperty('--glare-x', `${glareX}`);
                document.documentElement.style.setProperty('--glare-y', `${glareY}`);
            });
        }
    };


    // ==========================================
    // INICIALIZADOR GLOBAL MESTRE (O BOOT)
    // ==========================================
    
    // FASE 1: Motores Leves (Iniciam instantaneamente com a tela)
    window.addEventListener('load', () => {
        if(typeof ativarVidroMagnetico === 'function') ativarVidroMagnetico();
        if(typeof ativarParticulasDeToque === 'function') ativarParticulasDeToque();
        if(typeof ativarBottomSheets === 'function') ativarBottomSheets();
        if(typeof configurarModoOffline === 'function') configurarModoOffline();

        // RADAR DE COMANDOS DA TELA DE BLOQUEIO
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

        // ==========================================
        // CENTRAL DE COMANDOS DA SIRI (DEEP LINKS)
        // ==========================================
        const urlParams = new URLSearchParams(window.location.search);
        const acaoSiri = urlParams.get('acao');
        
        if (acaoSiri) {
            // Espera 3 segundos para o Firebase e a Identidade carregarem totalmente
            setTimeout(() => {
                if (acaoSiri === 'pulso' || acaoSiri === 'disparar_pulso_remoto') {
                    if(typeof window.enviarPulso === 'function') {
                        window.enviarPulso();
                        if(typeof window.mostrarToast === 'function') window.mostrarToast("💖 Pulso enviado pela Siri/Atalho!");
                    }
                } 
                else if (acaoSiri === 'mood') {
                    const sentimento = urlParams.get('tipo') || 'saudade';
                    // Simula o preenchimento invisível e o envio
                    const inputMood = document.getElementById('input-mood');
                    if (inputMood) inputMood.value = "Enviado por comando de voz 🎙️";
                    if(typeof window.enviarMood === 'function') window.enviarMood(sentimento);
                } 
                else if (acaoSiri === 'cofre') {
                    // Força o clique na aba do cofre
                    const abaCofre = document.querySelector('[data-alvo="cofre"]');
                    if (abaCofre) abaCofre.click();
                }

                // O PULO DO GATO: Limpa a URL depois de executar, para não repetir se ela atualizar a página
                window.history.replaceState({}, document.title, window.location.pathname);
            }, 3000); 
        }
    });

    // FASE 2: A MÁGICA (Escalonamento Quântico de Memória)
    // Impede o celular de fritar ao tentar carregar 8 motores 3D no mesmo milissegundo.
    window.addEventListener('motor3DPronto', () => {
        
        // 1º Lote (Imediato) - O essencial da Home para encantar os olhos
        if(typeof inicializarGlobo3D === 'function') inicializarGlobo3D();
        if(typeof inicializarCoracao3D === 'function') inicializarCoracao3D();
        
        // 2º Lote (Espera 1 segundo) - O fundo do oceano e a Árvore
        setTimeout(() => {
            if(typeof inicializarOceanoQuantico === 'function') inicializarOceanoQuantico();
            if(typeof inicializarPrisma3D === 'function') inicializarPrisma3D();
        }, 1000);

        // 3º Lote (Espera 2.5 segundos) - Itens dos menus que não estão visíveis
        setTimeout(() => {
            if(typeof inicializarOrbeClima === 'function') inicializarOrbeClima();
            if(typeof inicializarEco3D === 'function') inicializarEco3D();
        }, 2500);

        // 4º Lote (Espera 4 segundos) - Relíquias Profundas
        setTimeout(() => {
            if(typeof inicializarBussola3D === 'function') inicializarBussola3D();
            if(typeof inicializarCarrossel3D === 'function') inicializarCarrossel3D();
        }, 4000);
        
    });

}); // Fecha o DOMContentLoaded



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