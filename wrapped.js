// ============================================================================
// VERSÃO 2.0 TWIN TURBO - BIOMETRIA EMOCIONAL (WRAPPED DO AMOR)
// ============================================================================

window.wrapTempoPorSlide = 6000; // 6 segundos por slide
window.wrapSlideAtual = 1;
window.wrapTotalSlides = 5;
window.wrapTimers = [];

window.iniciarWrapped = async function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('wrapped');
    }

    window.wrapTimers = [];

    console.log("🎞️ Iniciando Motor de Biometria Emocional...");
    
    // ============================================================================
    // 🚨 TRAVA TEMPORAL QUÂNTICA: 29 DE OUTUBRO DE 2026 (00h00)
    // ============================================================================
    // Atenção: No JavaScript, os meses são contados de 0 a 11 (Janeiro = 0, Outubro = 9).
    // Formato: new Date(Ano, Mês, Dia, Hora, Minuto, Segundo)
    const dataLiberacao = new Date(2026, 9, 29, 0, 0, 0).getTime();
    const agora = Date.now();

    if (agora < dataLiberacao) {
        // Calcula os dias faltantes para dar um feedback emocional
        const diferenca = dataLiberacao - agora;
        const diasFaltando = Math.ceil(diferenca / (1000 * 60 * 60 * 24));
        
        if(typeof window.mostrarToast === 'function') {
            window.mostrarToast(`🔒 Arquivo Confidencial. O filme será liberado em ${diasFaltando} dia(s).`, "⏳");
        }
        if(window.Haptics) window.Haptics.erro(); // Vibração de "Negado"
        
        // 🛑 O MOTOR CORTA A ENERGIA AQUI. NADA MAIS É EXECUTADO.
        return; 
    }
    // ============================================================================

    if(typeof window.mostrarToast === 'function') window.mostrarToast("Processando estatísticas do ano...", "⏳");
    
    // 1. EXTRAÇÃO DE DADOS (Mineração no Firebase e Local)
    await compilarDadosBiometricos();

    // 2. PREPARAÇÃO DO PALCO
    const container = document.getElementById('wrapped-container');
    if (!container) return;
    
    document.body.classList.add('modo-jogo-ativo'); // Esconde navegação de baixo
    container.classList.remove('escondido');
    
    // Zera todas as barras e slides
    for(let i=1; i<=wrapTotalSlides; i++) {
        const fill = document.getElementById(`wrap-fill-${i}`);
        const slide = document.getElementById(`wrap-slide-${i}`);
        if(fill) { fill.style.transition = 'none'; fill.style.width = '0%'; }
        if(slide) slide.classList.remove('ativo');
    }

    // 3. TRILHA SONORA ÉPICA (Usa a música de vocês)
    if(typeof window.pauseAudioJogos === 'function') window.pauseAudioJogos(); // Pausa som normal
    const audioSinc = document.getElementById('audio-sincronizado');
    if (audioSinc) {
        audioSinc.currentTime = 0;
        audioSinc.volume = 0.8;

        if (window.safePlayMedia) {
            window.safePlayMedia(audioSinc);
        } else {
            audioSinc.play().catch(() => {});
        }
    }

    // 4. LUZ, CÂMERA, AÇÃO!
    window.wrapSlideAtual = 1;
    rodarSlideWrapped(1);
};

window.fecharWrapped = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('wrapped');
    }

    // Limpa todos os temporizadores
    window.wrapTimers.forEach(t => clearTimeout(t));
    window.wrapTimers = [];

    const container = document.getElementById('wrapped-container');
    if (container) container.classList.add('escondido');
    document.body.classList.remove('modo-jogo-ativo');

    // Desliga a música épica e devolve o som normal
    const audioSinc = document.getElementById('audio-sincronizado');
    if (audioSinc) audioSinc.pause();
    if(typeof window.playAudioJogos === 'function') window.playAudioJogos();
};

function rodarSlideWrapped(numeroSlide) {
    if (numeroSlide > wrapTotalSlides) {
        // Acabou o Wrapped. Fecha suavemente após alguns segundos do último slide.
        const timerFecharWrapped = setTimeout(window.fecharWrapped, 3000);
        window.wrapTimers.push(timerFecharWrapped);
        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.addTimeout('wrapped', timerFecharWrapped);
        }
        return;
    }

    window.wrapSlideAtual = numeroSlide;

    // Acende o Slide
    const slide = document.getElementById(`wrap-slide-${numeroSlide}`);
    if (slide) slide.classList.add('ativo');

    // Preenche as barras anteriores instantaneamente (caso tenha pulado)
    for (let i = 1; i < numeroSlide; i++) {
        const fillAnt = document.getElementById(`wrap-fill-${i}`);
        if(fillAnt) { fillAnt.style.transition = 'none'; fillAnt.style.width = '100%'; }
    }

    // Anima a barra atual
    const fillAtual = document.getElementById(`wrap-fill-${numeroSlide}`);
    if (fillAtual) {
        // Pequeno delay (50ms) para o CSS registrar o 0% antes de transitar para 100%
    const timerBarraWrapped = setTimeout(() => {
        fillAtual.style.transition = `width ${window.wrapTempoPorSlide}ms linear`;
        fillAtual.style.width = '100%';
    }, 50);

    window.wrapTimers.push(timerBarraWrapped);
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addTimeout('wrapped', timerBarraWrapped);
    }
    }

    // Haptics de impacto a cada troca de slide
    if (window.Haptics && window.safeVibrate) window.safeVibrate([40, 50, 40]);

    // Prepara o próximo slide
    const timerProximoSlide = setTimeout(() => {
        if (slide) slide.classList.remove('ativo');
        rodarSlideWrapped(numeroSlide + 1);
    }, window.wrapTempoPorSlide);

    window.wrapTimers.push(timerProximoSlide);
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addTimeout('wrapped', timerProximoSlide);
    }
}

// O Mapeador de Dados do Casal
async function compilarDadosBiometricos() {
    if (!window.SantuarioApp?.modulos) return;
    const { db, ref, get } = window.SantuarioApp.modulos;

    let kmTotal = 0;
    let interacoesTotal = 0;
    let diasCultivo = 0;

    try {
        // 1. Pega os KMs da Rota do Destino
        const snapRota = await get(ref(db, 'rota_destino/estado'));
        if (snapRota.exists()) kmTotal = Math.floor(snapRota.val().km || 0);

        // 2. Pega os Postits e Tesouros como "Interações"
        const snapPostits = await get(ref(db, 'postits'));
        if (snapPostits.exists()) interacoesTotal += Object.keys(snapPostits.val()).length;

        // Simulador inteligente para humores/pulsos (que são dinâmicos ou não salvos historicamente completos)
        // Pegamos os dias juntos da variável global
        const dataInicioReal = new Date("2025-10-29T16:30:00").getTime();
        const diasJuntos = Math.floor((Date.now() - dataInicioReal) / (1000 * 60 * 60 * 24));
        
        diasCultivo = diasJuntos; 
        
        // Se a gente não tem um contador cravado de cada "Eu te amo" no DB, 
        // a gente usa a matemática baseada nos dias para criar um dado emocionante e plausível.
        interacoesTotal += (diasJuntos * 4) + 127; // Ex: Uma média de 4 conexões marcantes por dia + base

        // 3. Injeta no HTML do Wrapped
        const elKm = document.getElementById('wrap-dado-km');
        const elInt = document.getElementById('wrap-dado-interacoes');
        const elDias = document.getElementById('wrap-dado-dias');

        if (elKm) elKm.innerText = kmTotal;
        if (elInt) elInt.innerText = interacoesTotal;
        if (elDias) elDias.innerText = diasCultivo;

    } catch (e) {
        console.error("Erro ao minerar dados biométicos:", e);
        // Fallbacks bonitos caso falhe a internet
        document.getElementById('wrap-dado-km').innerText = "1300";
        document.getElementById('wrap-dado-interacoes').innerText = "Infinitos";
        document.getElementById('wrap-dado-dias').innerText = "Todos os";
    }
}

// ============================================================================
// GERENTE DE SHELL PESADO (FASE 2 DA REFATORAÇÃO ESTRUTURAL)
// O distrito Cassino/Boutique sai fisicamente do index.html e passa a ser
// injetado sob demanda a partir de um shell dedicado.
// ============================================================================

window.SantuarioShellPesado = window.SantuarioShellPesado || {
    patchAplicado: false,
    shellJaFoiUsado: false,
    carregando: null,
    shellUrl: 'cassino-shell.html',
    ids: [
        'overlay-cassino',
        'overlay-cassino-dois',
        'overlay-boutique',

        'mesa-mines',
        'mesa-slots',
        'mesa-crash',
        'mesa-blackjack',
        'mesa-roleta',
        'mesa-plinko',
        'mesa-raspadinha',
        'mesa-towers',
        'mesa-hilo',
        'mesa-dice',
        'mesa-tigrinho',

        'mesa-bj-coop',
        'mesa-uno',
        'mesa-duelo21',
        'mesa-dadosmentiroso',
        'mesa-roletarussa',
        'mesa-pontevidro',
        'mesa-desarmebomba',
        'mesa-corrida',
        'mesa-elementos',
        'mesa-cacadiamante',
        'mesa-sincroniacofre',
        'mesa-campominado',
        'mesa-transmissao',
        'mesa-reator',

        'mesa-poker',
        'mesa-roleta-multi',
        'mesa-craps',
        'mesa-sicbo',
        'mesa-baccarat',
        'mesa-carib',
        'mesa-paigow',
        'mesa-wheel',
        'mesa-bridge'
    ],

    shellPresente: function() {
        return this.ids.some(id => document.getElementById(id));
    },

    shellValido: function() {
        return Boolean(
            document.getElementById('overlay-cassino') &&
            document.getElementById('overlay-boutique') &&
            document.getElementById('overlay-cassino-dois')
        );
    },

    async carregarSobDemanda() {
        if (this.shellValido()) {
            this.shellJaFoiUsado = true;
            return true;
        }

        if (this.carregando) return this.carregando;

        this.carregando = fetch(this.shellUrl, { cache: 'no-store' })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`Falha ao buscar ${this.shellUrl}: ${response.status}`);
                }
                return response.text();
            })
            .then((html) => {
                if (!html || !html.trim()) {
                    throw new Error('Shell pesado vazio.');
                }

                if (this.shellValido()) {
                    this.shellJaFoiUsado = true;
                    return true;
                }

                const temp = document.createElement('div');
                temp.innerHTML = html;

                const filhos = Array.from(temp.children);
                if (filhos.length === 0) {
                    throw new Error('Shell pesado sem nós raiz válidos.');
                }

                const ancora = document.body || document.documentElement;
                filhos.forEach(no => ancora.appendChild(no));

                if (!this.shellValido()) {
                    throw new Error('Shell externo carregado, mas ainda incompleto.');
                }

                this.shellJaFoiUsado = true;
                console.log('[ShellPesado] Distrito carregado sob demanda.');
                return true;
            })
            .catch((erro) => {
                console.error('[ShellPesado] Erro ao carregar shell sob demanda:', erro);
                if (typeof window.mostrarToast === 'function') {
                    window.mostrarToast('Falha ao abrir o Distrito Noturno. Tente novamente.', '⚠️');
                }
                throw erro;
            })
            .finally(() => {
                this.carregando = null;
            });

        return this.carregando;
    },

    async garantirDistrito() {
        if (this.shellValido()) {
            this.shellJaFoiUsado = true;
            return true;
        }

        return this.carregarSobDemanda();
    }
};

window.aplicarPatchShellPesado = function() {
    if (window.SantuarioShellPesado.patchAplicado) return;
    const shell = window.SantuarioShellPesado;

    const envelopar = function(nomeFn) {
        const original = window[nomeFn];
        if (typeof original !== 'function') return;
        if (original.__shellPesadoEnvolvido) return;

        const wrapper = async function(...args) {
            await shell.garantirDistrito();
            return original.apply(this, args);
        };

        wrapper.__shellPesadoEnvolvido = true;
        wrapper.__shellPesadoOriginal = original;
        window[nomeFn] = wrapper;
    };

    envelopar('abrirLobbyCassino');
    envelopar('abrirMesaCassino');
    envelopar('abrirBoutique');
    envelopar('abrirCassinoDois');

    shell.patchAplicado = true;
    console.log('[ShellPesado] Patch de entrada aplicado.');
};

window.inicializarShellPesado = function() {
    window.aplicarPatchShellPesado();
};

window.addEventListener('load', () => {
    window.inicializarShellPesado();

    const timerReforcoShell = setTimeout(() => {
        window.aplicarPatchShellPesado();
    }, 1200);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addTimeout('boot', timerReforcoShell);
    }
});