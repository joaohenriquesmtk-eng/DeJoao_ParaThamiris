// ==========================================
// MOTOR TÁTIL SÊNIOR (ILUSÃO FÍSICA)
// ==========================================
window.Haptics = {
    toqueLeve: () => { if(navigator.vibrate) navigator.vibrate(10); }, // Tique muito sutil
    toqueForte: () => { if(navigator.vibrate) navigator.vibrate(30); }, // Confirmação
    sucesso: () => { if(navigator.vibrate) navigator.vibrate([20, 50, 20]); }, // Tique-tique
    erro: () => { if(navigator.vibrate) navigator.vibrate([40, 50, 40, 50, 60]); } // Tum-Tum grave
};

// Aplicando magicamente a todos os botões do aplicativo de uma vez:
window.addEventListener('load', () => {
    document.querySelectorAll('button, .item-menu, .item-cofre').forEach(btn => {
        btn.addEventListener('touchstart', window.Haptics.toqueLeve, {passive: true});
    });
});

// ==========================================
// 1. GERADOR DE PARTÍCULAS (STARDUST RIPPLE)
// ==========================================
window.ativarParticulasDeToque = () => {
    // Função que desenha a luz no eixo X e Y
    const criarParticula = (x, y) => {
        const particula = document.createElement('div');
        particula.className = 'particula-toque';
        particula.style.left = `${x}px`;
        particula.style.top = `${y}px`;
        
        document.body.appendChild(particula);

        // O Lixeiro: Remove a div invisível após a animação acabar para não travar a memória RAM
        setTimeout(() => {
            particula.remove();
        }, 600);
    };

    // Sensor de toque na tela (Celular)
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 0) {
            criarParticula(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    // Sensor de clique do mouse (PC/Testes)
    document.addEventListener('mousedown', (e) => {
        criarParticula(e.clientX, e.clientY);
    });
};

// ==========================================
// 7. MOTOR DE ÁUDIO ESPACIAL (WEB AUDIO API)
// ==========================================
window.MotorDeAudio = {
    ctx: null,
    filtro: null,
    musica: null,
    iniciado: false,

    iniciar: function() {
        if (this.iniciado) return;

        // Tenta pegar a música de fundo existente ou cria uma invisível
        this.musica = document.getElementById('audio-ambiente') || new Audio('assets/ambient.mp3');
        this.musica.loop = true;
        this.musica.volume = 0.3;

        // Cria o Contexto de Áudio (A Mesa de Som do Navegador)
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        // Cria o "Abafador" (Filtro Passa-Baixa / Lowpass)
        this.filtro = this.ctx.createBiquadFilter();
        this.filtro.type = 'lowpass';
        this.filtro.frequency.value = 20000; // 20kHz: Totalmente aberto (som limpo)

        // Conecta os cabos invisíveis: Música -> Filtro -> Alto-falante do Celular
        const track = this.ctx.createMediaElementSource(this.musica);
        track.connect(this.filtro).connect(this.ctx.destination);

        this.iniciado = true;
        this.musica.play().catch(e => console.log("Áudio bloqueado até o usuário interagir."));
    },

    // Efeito de "Mergulho": Abafa o som cortando os agudos
    abafar: function() {
        if (!this.iniciado) return;
        // Desce a frequência para 600Hz em 0.3 segundos (Cria a sensação de som atrás da porta)
        this.filtro.frequency.setTargetAtTime(600, this.ctx.currentTime, 0.3);
        this.musica.volume = 0.1;
    },

    // Efeito de "Retorno": Abre o som novamente
    focar: function() {
        if (!this.iniciado) return;
        // Sobe a frequência de volta para o limite da audição humana
        this.filtro.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.3);
        this.musica.volume = 0.2;
    }
};

// REGRA DOS NAVEGADORES: O áudio espacial só pode ser ativado no PRIMEIRO TOQUE na tela
document.addEventListener('touchstart', () => {
    if (window.MotorDeAudio && !window.MotorDeAudio.iniciado) window.MotorDeAudio.iniciar();
}, { once: true, passive: true });
document.addEventListener('mousedown', () => {
    if (window.MotorDeAudio && !window.MotorDeAudio.iniciado) window.MotorDeAudio.iniciar();
}, { once: true });


// ==========================================
// 2. MOTOR BOTTOM SHEET (SWIPE TO CLOSE)
// ==========================================
window.ativarBottomSheets = () => {
    const sheets = document.querySelectorAll('.bottom-sheet');
    
    sheets.forEach(sheet => {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        const overlay = sheet.parentElement; 

        // 1. Dedo encostou na aba
        sheet.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
            sheet.style.transition = 'none'; // Desliga a animação para o vidro grudar no dedo
        }, { passive: true });

        // 2. Dedo está puxando para baixo
        sheet.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            
            // Só permite arrastar o vidro para BAIXO, nunca para cima
            if (deltaY > 0) {
                sheet.style.transform = `translateY(${deltaY}px)`;
            }
        }, { passive: true });

        // 3. Dedo soltou a tela
        sheet.addEventListener('touchend', () => {
            isDragging = false;
            sheet.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'; // Liga a animação de novo
            
            const deltaY = currentY - startY;
            
            // Se puxou mais de 100 pixels pra baixo, fecha o modal de vez!
            if (deltaY > 100) {
                sheet.style.transform = `translateY(100%)`;
                
                setTimeout(() => {
                    // Integração com a sua função original de fechar!
                    if (overlay.id === 'modal-emergencia' && typeof fecharEmergencia === 'function') {
                        fecharEmergencia();
                    } else {
                        overlay.classList.add('escondido');
                    }
                    // Reseta para quando abrir da próxima vez
                    setTimeout(() => sheet.style.transform = '', 100);
                }, 300); 
            } else {
                // Se puxou só um pouquinho e soltou, dá o Efeito Mola (volta pro topo)
                sheet.style.transform = 'translateY(0)';
            }
        });
    });
};

// ==========================================
// 4. MOTOR DE TIPOGRAFIA CINEMATOGRÁFICA
// ==========================================
window.animarTextoCinematografico = (elemento) => {
    if (!elemento) return;
    
    // Captura o texto puro
    const texto = elemento.innerText || elemento.textContent;
    elemento.innerHTML = ''; // Esvazia a div original
    
    // Quebra o texto usando os espaços
    const palavras = texto.split(' ');
    
    palavras.forEach((palavra, index) => {
        const span = document.createElement('span');
        span.innerText = palavra + ' ';
        span.className = 'palavra-revelada';
        
        // A MÁGICA: Cada palavra atrasa 40 milissegundos em relação à anterior
        span.style.animationDelay = `${index * 0.04}s`; 
        
        elemento.appendChild(span);
    });
};

// ==========================================
// MOTOR DO PERGAMINHO (ABA LEIS)
// ==========================================
window.animarLeisEmCascata = () => {
    const leis = document.querySelectorAll('.lei-item');
    if (!leis.length) return;

    leis.forEach((lei, index) => {
        lei.classList.remove('visivel');
        
        // O atraso agora dá um efeito de leitura processual
        setTimeout(() => {
            lei.classList.add('visivel');
            if (window.Haptics && index % 2 === 0) navigator.vibrate(10); // Vibração sutil ao aparecer
        }, index * 250); 
    });
};

window.renovarVotos = () => {
    const btnSelo = document.getElementById('btn-renovar-votos');
    const assinaturas = document.getElementById('area-assinaturas-doc');
    const status = document.getElementById('status-renovacao');
    
    // Evita duplo clique
    if (btnSelo.classList.contains('carimbado')) return;

    // 1. O Peso do Carimbo (Feedback Tátil Profundo)
    if (window.Haptics) navigator.vibrate([100, 50, 150]);

    // 2. Animação de afundar o selo de cera no papel
    if (btnSelo) {
        btnSelo.classList.add('carimbado');
        btnSelo.querySelector('.selo-texto').innerHTML = "VOTOS<br>SANCIONADOS";
    }

    // 3. Atualiza o status jurídico
    if (status) {
        status.innerText = "Sancionado legalmente no dia de hoje.";
        status.style.color = "var(--cor-primaria)";
    }

    // 4. Revela as assinaturas com um delay dramático
    if (assinaturas) {
        setTimeout(() => {
            assinaturas.classList.remove('escondido');
            // Timeout duplo para garantir que o display:flex aplique antes da opacidade
            setTimeout(() => assinaturas.classList.add('reveladas'), 50);
            
            // Toca a notificação no topo da tela
            if (typeof window.mostrarToast === 'function') {
                window.mostrarToast("Votos lavrados em ata. O amor prevalece.", "⚖️");
            }
        }, 600);
    }
};

    // ==========================================
    // 3. MOTOR DA ILHA DINÂMICA
    // ==========================================
    window.toastTimer = null; // Variável global para controlar o tempo

    window.mostrarToast = (mensagem, icone = "✨") => {
        const ilha = document.getElementById('dynamic-island');
        if (!ilha) return;

        const textoEl = document.getElementById('island-text');
        const iconeEl = document.getElementById('island-icon');

        // Personaliza o ícone dependendo da mensagem
        if (mensagem.toLowerCase().includes('pulso')) icone = "💖";
        if (mensagem.toLowerCase().includes('erro')) icone = "❌";

        textoEl.innerText = mensagem;
        iconeEl.innerText = icone;

        // Feedback Tátil (Se já tivermos instalado o Haptics no passo anterior)
        if (window.Haptics && window.Haptics.toqueLeve) window.Haptics.toqueLeve();

        // Expande a ilha!
        ilha.classList.add('ativa');

        // Se já tinha um aviso rodando, zera o cronômetro para não fechar na cara
        if (window.toastTimer) clearTimeout(window.toastTimer);

        // Encolhe a ilha e some depois de 3 segundos
        window.toastTimer = setTimeout(() => {
            ilha.classList.remove('ativa');
        }, 3000);
    };

// ==========================================
// 10. MOTOR DE MICRO-INTERAÇÕES LOTTIE
// ==========================================
window.LottieManager = {
    instancia: null,
    
    play: (mood) => {
        const container = document.getElementById('lottie-mood-container');
        if (!container) return;

        // Limpa a animação anterior
        if (window.LottieManager.instancia) {
            window.LottieManager.instancia.destroy();
        }

        // Mapeamento de animações (Links públicos de alta qualidade)
        const animações = {
            'radiante': 'https://fonts.gstatic.com/s/i/short-term/release/googlestars/sparkles/default/24px.svg', // Placeholder ou JSON real
            'triste': 'https://assets5.lottiefiles.com/packages/lf20_96py93xa.json', // Chuva
            'apaixonada': 'https://assets5.lottiefiles.com/packages/lf20_02m6o2pw.json', // Coração batendo
            'ansiosa': 'https://assets10.lottiefiles.com/packages/lf20_T69r0P.json', // Redemoinho/Mente
            'cansada': 'https://assets3.lottiefiles.com/packages/lf20_i9mxcD.json' // Bateria acabando
        };

        const url = animações[mood.toLowerCase()];
        if (!url) return;

        window.LottieManager.instancia = lottie.loadAnimation({
            container: container,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            path: url
        });
    }
};