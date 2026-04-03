// ============================================================================
// 💣 MOTOR MATEMÁTICO: CAMPO MINADO (MINES) - VERSÃO SINESTÉSICA (PITCH SHIFT)
// ============================================================================

let motorMines = {
    jogando: false,
    apostaAtual: 0,
    qtdBombas: 3,
    multiplicador: 1.0,
    diamantesAchados: 0,
    lucroPotencial: 0,
    gradeSecreta: [], // 0 = Diamante 💎, 1 = Bomba 💣
    // 🚨 A MÁGICA: Variável para controlar a altura do som
    frequenciaSomAtual: 1.0 
};

// 🚨 Som dedicado e manipulável do Diamante (Pitch Shift)
const somDiamanteMines = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

window.ajustarApostaMines = function(valor) {
    if (motorMines.jogando) return;
    const visor = document.getElementById('mines-aposta-input');
    if (!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.ajustarBombasMines = function(valor) {
    if (motorMines.jogando) return;
    const visor = document.getElementById('mines-bombas-input');
    if (!visor) return;
    
    let qtd = parseInt(visor.innerText) + valor;
    if (qtd < 1) qtd = 1;
    if (qtd > 20) qtd = 20;
    
    visor.innerText = qtd;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.4);
    if(window.Haptics) window.Haptics.toqueLeve();
};

// --- LÓGICA DO JOGO ---

window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'mines') {
        const mesa = document.getElementById('mesa-mines');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            desenharGradeMines();
        }
    } else if (typeof window.abrirMesaCassinoOriginal === 'function') {
        window.abrirMesaCassinoOriginal(nomeDoJogo);
    }
};

window.fecharMesaMines = function() {
    if (motorMines.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("Você está em jogo! Retire o lucro ou continue.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-mines');
    if(mesa) {
        mesa.classList.add('escondido');
        mesa.style.display = 'none';
    }
};

function desenharGradeMines() {
    const gradeHTML = document.getElementById('grade-mines');
    if (!gradeHTML) return;
    gradeHTML.innerHTML = "";
    
    for (let i = 0; i < 25; i++) {
        const bloco = document.createElement('div');
        bloco.className = "bloco-mines";
        bloco.id = `bloco-mines-${i}`;
        bloco.onclick = () => {
            if (!motorMines.jogando) {
                if(typeof mostrarToast === 'function') mostrarToast("Aposte e clique em Iniciar!", "💸");
            } else {
                revelarBlocoMines(i);
            }
        };
        gradeHTML.appendChild(bloco);
    }
}

window.iniciarRodadaMines = function() {
    const aposta = parseInt(document.getElementById('mines-aposta-input').innerText);
    const bombas = parseInt(document.getElementById('mines-bombas-input').innerText);
    
    if (aposta < 10) {
        if(typeof mostrarToast === 'function') mostrarToast("Aposta mínima de 10💰", "⚠️");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        return;
    }
    if ((window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Aposta no Mines");

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesStart', 0.8);

    motorMines.jogando = true;
    motorMines.apostaAtual = aposta;
    motorMines.qtdBombas = bombas;
    motorMines.multiplicador = 1.0;
    motorMines.diamantesAchados = 0;
    motorMines.lucroPotencial = aposta;
    motorMines.frequenciaSomAtual = 1.0; // 🚨 Zera a "escada musical"

    document.getElementById('btn-mines-iniciar').classList.add('escondido');
    document.getElementById('mines-painel-saque').classList.remove('escondido');
    atualizarPlacarMines();

    motorMines.gradeSecreta = Array(25).fill(0); 
    let bombasPlantadas = 0;
    while (bombasPlantadas < motorMines.qtdBombas) {
        let pos = Math.floor(Math.random() * 25);
        if (motorMines.gradeSecreta[pos] === 0) {
            motorMines.gradeSecreta[pos] = 1; 
            bombasPlantadas++;
        }
    }

    desenharGradeMines();
    if(window.Haptics) window.Haptics.toqueForte();
};

window.revelarBlocoMines = function(index) {
    if (!motorMines.jogando) return;
    
    const bloco = document.getElementById(`bloco-mines-${index}`);
    if (!bloco || bloco.classList.contains('revelado-diamante')) return;

    const ehBomba = motorMines.gradeSecreta[index] === 1;

    if (ehBomba) {
        // 🔊 SOM DE EXPLOSÃO! Quebra brutalmente a música.
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesBomba', 1.0);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 400]);
                    }
        
        bloco.classList.add('revelado-bomba');
        bloco.innerHTML = "💣";
        
        // Efeito de susto: A tela do jogo pisca em vermelho!
        bloco.parentElement.style.boxShadow = "inset 0 0 50px rgba(255, 0, 50, 0.8)";
        
        encerrarRodadaMines("derrota");
    } else {
        // 🚨 A MÁGICA: A ESCADA MUSICAL DO DIAMANTE!
        if (!window.SantuarioSomPausado) {
            somDiamanteMines.currentTime = 0;
            somDiamanteMines.playbackRate = motorMines.frequenciaSomAtual;
            somDiamanteMines.volume = 0.8;
            somDiamanteMines.play().catch(e=>{});
            
            // O próximo diamante fará um som ligeiramente mais rápido e agudo (Tensão/Dopamina)
            motorMines.frequenciaSomAtual += 0.08; 
            if (motorMines.frequenciaSomAtual > 2.5) motorMines.frequenciaSomAtual = 2.5; // Limite do navegador
        }

        if(window.Haptics) window.Haptics.sucesso();
        
        bloco.classList.add('revelado-diamante');
        bloco.innerHTML = "💎";
        motorMines.diamantesAchados++;
        
        let fatorRisco = motorMines.qtdBombas / 25; 
        motorMines.multiplicador += fatorRisco + (motorMines.diamantesAchados * 0.05);
        
        motorMines.lucroPotencial = Math.floor(motorMines.apostaAtual * motorMines.multiplicador);
        atualizarPlacarMines();

        // Se ela abriu o último diamante da grade, ela saca automaticamente
        if (motorMines.diamantesAchados === (25 - motorMines.qtdBombas)) {
            sacarMines();
        }
    }
};

window.sacarMines = function() {
    if (!motorMines.jogando) return;
    
    if(typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(motorMines.lucroPotencial, "Saque vitorioso no Mines");
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesSaque', 1.0);
    
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100, 50, 300]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#2ecc71'], particleCount: 150});
    if(typeof mostrarToast === 'function') mostrarToast(`Saque brilhante! +${motorMines.lucroPotencial}💰`, "✨");

    encerrarRodadaMines("vitoria");
};

function atualizarPlacarMines() {
    const multVisor = document.getElementById('mines-multiplicador-texto');
    const lucroVisor = document.getElementById('mines-lucro-texto');
    if (multVisor) multVisor.innerText = motorMines.multiplicador.toFixed(2);
    if (lucroVisor) lucroVisor.innerText = motorMines.lucroPotencial;
}

function encerrarRodadaMines(resultado) {
    motorMines.jogando = false;
    
    // Revela todo o tabuleiro
    for (let i = 0; i < 25; i++) {
        const bloco = document.getElementById(`bloco-mines-${i}`);
        if (bloco && !bloco.classList.contains('revelado-diamante') && !bloco.classList.contains('revelado-bomba')) {
            bloco.classList.add('opaco');
            bloco.innerHTML = (motorMines.gradeSecreta[i] === 1) ? "💣" : "💎";
        }
    }

    document.getElementById('btn-mines-iniciar').classList.remove('escondido');
    document.getElementById('mines-painel-saque').classList.add('escondido');
    
    const gradeHTML = document.getElementById('grade-mines');
    
    if (resultado === "derrota") {
        if(typeof mostrarToast === 'function') mostrarToast("BOOM! Você perdeu.", "🔥");
    } else {
        // Se ela sacou, o tabuleiro brilha em ouro
        if (gradeHTML) gradeHTML.style.boxShadow = "inset 0 0 50px rgba(212, 175, 55, 0.4)";
    }
    
    // Limpa os efeitos visuais 3 segundos depois
    setTimeout(() => {
        if (gradeHTML) gradeHTML.style.boxShadow = "none";
    }, 3000);
}


// ============================================================================
// 🎰 MOTOR JS PURO E BLINDADO: CAÇA-NÍQUEL (SLOTS) COM TENSÃO NEAR-MISS
// ============================================================================

if (!window.SlotMachineAPI) {
    window.SlotMachineAPI = { 
        girando: false, 
        modoAuto: false, 
        loopAuto: null 
    };
}

// 🚪 Roteador
const roteadorAntesSlots = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'slots') {
        const mesa = document.getElementById('mesa-slots');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            
            // Verifica e cria o Botão de Auto-Giro se não existir
            if (!document.getElementById('btn-slots-auto')) {
                const painelAposta = document.querySelector('.painel-aposta-slots');
                if (painelAposta) {
                    const btnAuto = document.createElement('button');
                    btnAuto.id = 'btn-slots-auto';
                    btnAuto.innerText = '🤖 MODO AUTO';
                    btnAuto.style.marginTop = '10px';
                    btnAuto.style.padding = '10px';
                    btnAuto.style.background = 'linear-gradient(145deg, #3498db, #2980b9)';
                    btnAuto.style.border = 'none';
                    btnAuto.style.color = '#fff';
                    btnAuto.style.borderRadius = '20px';
                    btnAuto.style.cursor = 'pointer';
                    btnAuto.onclick = window.alternarGiroAutomatico;
                    painelAposta.appendChild(btnAuto);
                }
            }
        }
    } else if (typeof roteadorAntesSlots === 'function') {
        roteadorAntesSlots(nomeDoJogo);
    }
};

window.fecharMesaSlots = function() {
    if (window.SlotMachineAPI.girando) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde o giro terminar!", "⚠️");
        return;
    }
    // Desliga o modo auto se estiver saindo
    if (window.SlotMachineAPI.modoAuto) window.alternarGiroAutomatico();
    
    const mesa = document.getElementById('mesa-slots');
    if(mesa) mesa.style.display = 'none';
};

// 💰 Botões de Aposta
window.ajustarApostaSlots = function(valor) {
    if (window.SlotMachineAPI.girando || window.SlotMachineAPI.modoAuto) return;
    
    const visor = document.getElementById('slots-aposta-input');
    if (!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics && window.Haptics.toqueLeve) window.Haptics.toqueLeve();
};

// 🤖 Função do Modo Automático
window.alternarGiroAutomatico = function() {
    const btnAuto = document.getElementById('btn-slots-auto');
    if (window.SlotMachineAPI.modoAuto) {
        window.SlotMachineAPI.modoAuto = false;
        clearInterval(window.SlotMachineAPI.loopAuto);
        if (btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #3498db, #2980b9)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Automático Desativado.", "🛑");
    } else {
        window.SlotMachineAPI.modoAuto = true;
        if (btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Automático Ativado! 🎰", "🤖");
        window.girarSlots(); // Dispara o primeiro já de cara
    }
};

// 🌪️ O Motor de Giro Físico (A MÁGICA DA TENSÃO ACONTECE AQUI)
window.girarSlots = function() {
    const btn = document.getElementById('btn-slots-iniciar') || document.getElementById('btn-slots-girar');
    if (window.SlotMachineAPI.girando) return;
    
    const visor = document.getElementById('slots-aposta-input');
    let aposta = 50;
    if (visor) aposta = parseInt(visor.innerText);
    
    if (isNaN(aposta) || aposta < 10) {
        if(typeof mostrarToast === 'function') mostrarToast("Aposta mínima é 10!", "⚠️");
        if (window.SlotMachineAPI.modoAuto) window.alternarGiroAutomatico(); // Trava se quebrar a regra
        return;
    }
    
    if ((window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6);
        if(window.Haptics) window.Haptics.erro();
        if (window.SlotMachineAPI.modoAuto) window.alternarGiroAutomatico(); // Para o robô se ficar pobre
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Giro no Caça-Níquel");

    window.SlotMachineAPI.girando = true;

    if (btn) {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 50, 50]);
                    }

    const simbolosLocais = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
    const premiosLocais = { '🍒': 3, '🍋': 5, '🍇': 10, '🔔': 20, '💎': 50, '7️⃣': 100 };

    // Ativa a animação de velocidade do CSS
    for(let i=1; i<=3; i++) {
        const slot = document.getElementById(`slot${i}`);
        if(slot) {
            slot.classList.remove('slot-vitoria-anim');
            slot.classList.add('slot-girando');
        }
    }

    // =========================================================
    // 🚨 O CÉREBRO MATEMÁTICO (Gera o resultado por trás da cortina)
    // =========================================================
    let chance = Math.random(); 
    let resultado = [];
    let isNearMiss = false;

    if (chance <= 0.01) {
        resultado = ['7️⃣', '7️⃣', '7️⃣']; // 1% Jackpot
    } else if (chance <= 0.04) {
        resultado = ['💎', '💎', '💎']; // 3% Mega
    } else if (chance <= 0.14) {
        let simboloMedio = Math.random() > 0.5 ? '🍇' : '🔔';
        resultado = [simboloMedio, simboloMedio, simboloMedio]; // 10%
    } else if (chance <= 0.39) {
        let simboloPequeno = Math.random() > 0.5 ? '🍒' : '🍋';
        resultado = [simboloPequeno, simboloPequeno, simboloPequeno]; // 25%
    } else {
        // 61% de Chance de Perder
        let s1 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
        let s2 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
        let s3 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];

        // 🚨 A MÁGICA PSICOLÓGICA (Near Miss - Quase Lá)
        // 40% das vezes que ela perde, os dois primeiros blocos serão OBRIGATORIAMENTE iguais para dar a ilusão de chance
        if (Math.random() > 0.6) {
            s2 = s1;
            isNearMiss = true; 
        }

        // Garante que o terceiro símbolo seja diferente para consolidar a derrota
        while (s1 === s2 && s2 === s3) {
            s3 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
        }
        
        resultado = [s1, s2, s3];
    }

    // Faz os emojis trocarem no fundo
    let motorVisual = setInterval(() => {
        for(let i=1; i<=3; i++) {
            let slotDiv = document.getElementById(`slot${i}`);
            if (slotDiv && slotDiv.classList.contains('slot-girando')) {
                slotDiv.innerText = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
            }
        }
    }, 50);

    // =========================================================
    // 🚨 CONTROLE DE TENSÃO E SUSPENSE DE PARADA
    // =========================================================
    // Os tempos de parada da roleta (1 e 2 param normais, a 3ª pode demorar!)
    let tempoParada = [1000, 1500, 2000];

    // Se o resultado final for uma vitória OU um Near Miss (s1 e s2 iguais), a 3ª roleta vai entrar em TENSÃO
    if ((resultado[0] === resultado[1] && resultado[1] === resultado[2]) || isNearMiss) {
        tempoParada[2] = 3500; // Atrasa a parada em 1 segundo e meio a mais
        
        // Coloca o som de tensão rolando apenas na última roleta
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('roleta', 1.0); // Usa o som da roleta para simular o motor girando forte
            const slot3 = document.getElementById('slot3');
            if (slot3) slot3.style.boxShadow = "inset 0 0 30px rgba(255, 215, 0, 0.8)"; // Brilha em dourado de expectativa
        }, 1500); // Exato momento em que o slot 2 parou
    }

    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            let roleta = document.getElementById(`slot${i+1}`);
            if (roleta) {
                roleta.classList.remove('slot-girando');
                roleta.innerText = resultado[i];
                roleta.style.transform = "translateY(0)"; 
                roleta.style.boxShadow = "none"; // Remove o brilho dourado de tensão
            }
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsPlin', 0.9);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
        }, tempoParada[i]);
    }

    // O Veredito Final (Ouve o último tempo programado)
    setTimeout(() => {
        clearInterval(motorVisual);
        window.SlotMachineAPI.girando = false;
        
        try {
            let venceu = (resultado[0] === resultado[1] && resultado[1] === resultado[2]);
            if (venceu) {
                let mult = premiosLocais[resultado[0]] || 10;
                let lucro = aposta * mult;
                
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "JACKPOT no Caça-Níquel!");
                if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 400]);
                    }
                if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#D4AF37'], particleCount: 200});
                if(typeof mostrarToast === 'function') mostrarToast(`JACKPOT! ${mult}x (+${lucro}💰)`, "🎰");
                
                for(let i=1; i<=3; i++) {
                    const slot = document.getElementById(`slot${i}`);
                    if (slot) slot.classList.add('slot-vitoria-anim');
                }
            } else {
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                // Um leve suspiro de derrota visual
                if (isNearMiss && window.Haptics) navigator.vibrate([20, 50, 20]);
            }
        } catch(e) {
            console.error(e);
        } finally {
            if (btn) {
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
            }
            
            // 🚨 Se estiver no Modo Auto, dispara de novo com segurança
            if (window.SlotMachineAPI.modoAuto) {
                window.SlotMachineAPI.loopAuto = setTimeout(window.girarSlots, 1500); 
            }
        }
    }, tempoParada[2] + 200); // 200ms após o último cilindro parar para dar o feedback
};


// ============================================================================
// 🚀 MOTOR GRÁFICO, MATEMÁTICO E SONORO: CRASH (ESTILO AVIATOR) COM TENSÃO
// ============================================================================

const roteadorAntigo = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'crash') {
        const mesa = document.getElementById('mesa-crash');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            resetarGraficoCrash();
        }
    } else {
        if(typeof roteadorAntigo === 'function') roteadorAntigo(nomeDoJogo);
    }
};

window.fecharMesaCrash = function() {
    if (motorCrash.voando) {
        if(typeof mostrarToast === 'function') mostrarToast("Você está no ar! Retire o lucro antes de sair.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-crash');
    if(mesa) mesa.style.display = 'none';
};

let motorCrash = {
    voando: false,
    aposta: 0,
    multiplicadorAtual: 1.00,
    pontoExplosao: 1.00,
    motorLogica: null,
    motorVisual: null
};

// 🚨 NOVO MOTOR AUDIOVISUAL DO FOGUETINHO (BATIMENTO DE TENSÃO)
const somTensaoCrash = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somTensaoCrash.loop = true;

window.ajustarApostaCrash = function(valor) {
    if (motorCrash.voando) return;
    const input = document.getElementById('crash-aposta-input');
    if(!input) return;
    let novaAposta = parseInt(input.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    input.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.acaoCrash = function() {
    if (!motorCrash.voando) iniciarVooCrash();
    else sacarLucroCrash();
};

function iniciarVooCrash() {
    const input = document.getElementById('crash-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Lançamento Aviator");
    
    motorCrash.voando = true;
    motorCrash.aposta = aposta;
    motorCrash.multiplicadorAtual = 1.00;
    
    // RTP: Curva de probabilidade de Cassino
    let sorte = Math.random();
    if (sorte < 0.05) motorCrash.pontoExplosao = 1.00; 
    else {
        motorCrash.pontoExplosao = (1 / (1 - sorte)) * 0.95; 
        if (motorCrash.pontoExplosao < 1.01) motorCrash.pontoExplosao = 1.01;
    }

    resetarGraficoCrash();
    
    const btn = document.getElementById('btn-acao-crash');
    if(btn) {
        btn.innerHTML = `RETIRAR <span id="crash-btn-lucro">0</span>💰`;
        btn.style.background = "linear-gradient(145deg, #f39c12, #d35400)";
        btn.style.boxShadow = "0 10px 30px rgba(243, 156, 18, 0.6)";
    }
    
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) foguete.classList.add('foguete-voando-aviator');
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('crashStart', 0.8);
    if(window.Haptics) window.Haptics.toqueForte();

    // 🚨 Inicia som de tensão do coração (Respeitando o Mudo Global)
    if (!window.SantuarioSomPausado) {
        somTensaoCrash.playbackRate = 1.0;
        somTensaoCrash.volume = 0.5;
        somTensaoCrash.play().catch(e=>{});
    }

    // O CÉREBRO MATEMÁTICO (Roda independente do visual)
    motorCrash.motorLogica = setInterval(() => {
        let incremento = 0.001 + (motorCrash.multiplicadorAtual * 0.005);
        motorCrash.multiplicadorAtual += incremento;

        if (motorCrash.multiplicadorAtual >= motorCrash.pontoExplosao) {
            motorCrash.multiplicadorAtual = motorCrash.pontoExplosao;
            explodirFoguete();
            return;
        }

        const visorMult = document.getElementById('crash-multiplicador-visor');
        const visorLucro = document.getElementById('crash-btn-lucro');
        
        if(visorMult) visorMult.innerText = motorCrash.multiplicadorAtual.toFixed(2) + "x";
        if(visorLucro) visorLucro.innerText = Math.floor(motorCrash.aposta * motorCrash.multiplicadorAtual);
    }, 50);

    // O MOTOR GRÁFICO CANVAS (60 FPS)
    desenharGraficoAviator();
}

// 🎨 A MÁGICA DE LAS VEGAS: Renderização da Curva e Alarme Visual
function desenharGraficoAviator() {
    if (!motorCrash.voando) return; // Para de desenhar se explodiu ou sacou

    const canvas = document.getElementById('crash-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let progressoVisual = (motorCrash.multiplicadorAtual - 1.0) / 1.0; 
    if (progressoVisual > 1) progressoVisual = 1; 

    // 🚨 A MÁGICA DO PITCH SHIFTING (Acelera o coração e deixa mais agudo conforme sobe!)
    let taxaVelocidade = 1.0 + ((motorCrash.multiplicadorAtual - 1.0) * 0.5); 
    if (taxaVelocidade > 3.0) taxaVelocidade = 3.0; // Limite do iOS
    somTensaoCrash.playbackRate = taxaVelocidade;

    // 🚨 ALARME VISUAL: Tela avermelhada de perigo se passar de 2.0x
    const containerGrafico = document.getElementById('crash-tela-grafico');
    if (motorCrash.multiplicadorAtual > 2.0 && containerGrafico) {
        let intensidade = (motorCrash.multiplicadorAtual - 2.0) * 0.3;
        if (intensidade > 0.6) intensidade = 0.6;
        containerGrafico.style.boxShadow = `inset 0 0 50px rgba(255, 50, 50, ${intensidade})`;
        
        // Simula o tremor do ar no iOS (vibração de alta frequência baseada na tela)
        if(window.Haptics && Math.random() > 0.9) window.Haptics.toqueLeve();
    }

    // Coordenadas
    const startX = 20;
    const startY = canvas.height - 20;
    const alvoX = startX + progressoVisual * (canvas.width - 60);
    const alvoY = startY - Math.pow(progressoVisual, 0.8) * (canvas.height - 80);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha o preenchimento de energia sob a curva
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(alvoX, startY, alvoX, alvoY);
    ctx.lineTo(alvoX, startY);
    ctx.lineTo(startX, startY);
    
    let gradienteFundo = ctx.createLinearGradient(0, alvoY, 0, startY);
    gradienteFundo.addColorStop(0, "rgba(241, 196, 15, 0.4)"); 
    gradienteFundo.addColorStop(1, "rgba(241, 196, 15, 0.0)"); 
    ctx.fillStyle = gradienteFundo;
    ctx.fill();

    // 2. Desenha a Linha Dourada
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(alvoX, startY, alvoX, alvoY);
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#f1c40f";
    ctx.stroke();

    // 3. Move o Foguete Físico (Emoji) para a ponta da linha
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) {
        foguete.style.left = `${alvoX - 25}px`; 
        foguete.style.top = `${alvoY - 25}px`;
        let inclinacao = progressoVisual * 45; 
        foguete.style.transform = `rotate(${inclinacao}deg)`;
    }

    motorCrash.motorVisual = requestAnimationFrame(desenharGraficoAviator);
}

function sacarLucroCrash() {
    clearInterval(motorCrash.motorLogica);
    cancelAnimationFrame(motorCrash.motorVisual);
    motorCrash.voando = false;
    somTensaoCrash.pause(); // Para o coração
    
    let lucroFinal = Math.floor(motorCrash.aposta * motorCrash.multiplicadorAtual);
    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucroFinal, "Voo Perfeito no Aviator!");
    
    const visor = document.getElementById('crash-multiplicador-visor');
    const foguete = document.getElementById('crash-foguete-icone');
    
    if(visor) visor.style.color = "#2ecc71"; 
    if(foguete) foguete.classList.remove('foguete-voando-aviator');
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('crashCashout', 1.0);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#f1c40f'], particleCount: 100});
    if(typeof mostrarToast === 'function') mostrarToast(`Saque Perfeito! +${lucroFinal}💰`, "🚀");

    voltarBotaoApostarCrash();
}

function explodirFoguete() {
    clearInterval(motorCrash.motorLogica);
    cancelAnimationFrame(motorCrash.motorVisual);
    motorCrash.voando = false;
    somTensaoCrash.pause(); // Para o coração
    
    const visor = document.getElementById('crash-multiplicador-visor');
    if(visor) {
        visor.innerText = motorCrash.multiplicadorAtual.toFixed(2) + "x";
        visor.classList.add('texto-explodiu');
    }
    
    const tela = document.getElementById('crash-tela-grafico');
    if(tela) tela.classList.add('tela-crash-explodiu');
    
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) {
        foguete.classList.remove('foguete-voando-aviator');
        foguete.classList.add('foguete-explodido');
        foguete.innerText = "💥";
    }
    
    // Tinta o Canvas de vermelho
    const canvas = document.getElementById('crash-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "rgba(231, 76, 60, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('crashBoom', 0.9);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 500]);
                    }
    if(typeof mostrarToast === 'function') mostrarToast("CRASH! O foguete explodiu.", "💥");

    voltarBotaoApostarCrash();
}

function voltarBotaoApostarCrash() {
    const btn = document.getElementById('btn-acao-crash');
    if(btn) {
        btn.innerHTML = "APOSTAR 🚀";
        btn.style.background = "linear-gradient(145deg, #2ecc71, #27ae60)";
        btn.style.boxShadow = "0 10px 30px rgba(46, 204, 113, 0.4)";
    }
}

function resetarGraficoCrash() {
    const visor = document.getElementById('crash-multiplicador-visor');
    if(visor) {
        visor.innerText = "1.00x";
        visor.style.color = "#fff";
        visor.classList.remove('texto-explodiu');
    }
    
    const tela = document.getElementById('crash-tela-grafico');
    if(tela) {
        tela.classList.remove('tela-crash-explodiu');
        tela.style.boxShadow = "none"; // Reseta o alarme visual vermelho
    }
    
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) {
        foguete.classList.remove('foguete-explodido');
        foguete.innerText = "🚀";
        foguete.style.left = "20px";
        foguete.style.bottom = "20px";
        foguete.style.top = "auto";
        foguete.style.transform = "rotate(0deg)";
    }

    const canvas = document.getElementById('crash-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}


// ============================================================================
// 🃏 MOTOR MATEMÁTICO, IA E ÁUDIO: BLACKJACK (21) - VERSÃO HIGH STAKES
// ============================================================================

// 🚨 Roteador Mestre Atualizado
const roteadorMestre = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'blackjack') {
        const mesa = document.getElementById('mesa-blackjack');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            resetarMesaBJ(true); 
        }
    } else {
        if(typeof roteadorMestre === 'function') roteadorMestre(nomeDoJogo);
    }
};

window.fecharMesaBlackjack = function() {
    if (motorBJ.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("A rodada está em andamento!", "⚠️");
        return;
    }
    somTensaoBJ.pause(); // Garante o silêncio ao sair
    const mesa = document.getElementById('mesa-blackjack');
    if(mesa) mesa.style.display = 'none';
};

// --- O CÉREBRO DO JOGO ---
let motorBJ = {
    jogando: false,
    aposta: 0,
    maoJogador: [],
    maoDealer: [],
    taxaCoracao: 1.0,
    baralho: {
        valores: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],
        naipes: ['♠', '♥', '♦', '♣']
    }
};

// 🚨 MOTOR DE TENSÃO DO BLACKJACK
const somTensaoBJ = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somTensaoBJ.loop = true;

window.ajustarApostaBJ = function(valor) {
    if (motorBJ.jogando) return;
    const input = document.getElementById('bj-aposta-input');
    if(!input) return;
    
    let novaAposta = parseInt(input.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    input.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function sacarCartaAletoria() {
    const valor = motorBJ.baralho.valores[Math.floor(Math.random() * motorBJ.baralho.valores.length)];
    const naipe = motorBJ.baralho.naipes[Math.floor(Math.random() * motorBJ.baralho.naipes.length)];
    return { valor, naipe };
}

function calcularPontos(mao) {
    let pontos = 0;
    let ases = 0;

    for (let carta of mao) {
        if (['J', 'Q', 'K'].includes(carta.valor)) {
            pontos += 10;
        } else if (carta.valor === 'A') {
            pontos += 11;
            ases += 1;
        } else {
            pontos += parseInt(carta.valor);
        }
    }

    while (pontos > 21 && ases > 0) {
        pontos -= 10;
        ases -= 1;
    }
    return pontos;
}

function renderizarCartaHTML(carta, oculta = false) {
    const div = document.createElement('div');
    div.className = `carta-bj ${oculta ? 'oculta' : ''}`;
    
    if (!oculta) {
        const corCorreta = (carta.naipe === '♥' || carta.naipe === '♦') ? 'vermelha' : 'preta';
        div.classList.add(corCorreta);
        div.innerHTML = `
            <div class="carta-bj-topo">${carta.valor}${carta.naipe}</div>
            <div class="carta-bj-centro">${carta.naipe}</div>
            <div class="carta-bj-base">${carta.valor}${carta.naipe}</div>
        `;
    }
    return div;
}

function atualizarMesaVisual() {
    const divJogador = document.getElementById('bj-jogador-cartas');
    if(divJogador) {
        divJogador.innerHTML = "";
        motorBJ.maoJogador.forEach(c => divJogador.appendChild(renderizarCartaHTML(c)));
    }
    const pontosJog = document.getElementById('bj-jogador-pontos');
    if(pontosJog) pontosJog.innerText = calcularPontos(motorBJ.maoJogador);

    const divDealer = document.getElementById('bj-dealer-cartas');
    const pontosDeal = document.getElementById('bj-dealer-pontos');
    if(divDealer) {
        divDealer.innerHTML = "";
        if (motorBJ.jogando) {
            divDealer.appendChild(renderizarCartaHTML(motorBJ.maoDealer[0], true));
            if (motorBJ.maoDealer.length > 1) {
                divDealer.appendChild(renderizarCartaHTML(motorBJ.maoDealer[1]));
            }
            if(pontosDeal) pontosDeal.innerText = "?";
        } else {
            motorBJ.maoDealer.forEach(c => divDealer.appendChild(renderizarCartaHTML(c)));
            if(pontosDeal) pontosDeal.innerText = calcularPontos(motorBJ.maoDealer);
        }
    }
}

window.iniciarRodadaBJ = function() {
    const input = document.getElementById('bj-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Aposta no Blackjack");
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);

    motorBJ.jogando = true;
    motorBJ.aposta = aposta;
    motorBJ.maoJogador = [];
    motorBJ.maoDealer = [];
    motorBJ.taxaCoracao = 1.0;

    document.getElementById('bj-painel-aposta').classList.add('escondido');
    document.getElementById('bj-painel-resultado').classList.add('escondido');
    document.getElementById('bj-painel-acao').classList.remove('escondido');
    
    const mesa = document.getElementById('mesa-blackjack');
    if(mesa) mesa.style.boxShadow = "none"; // Reseta alarme visual

    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 50, 30]);
                    }

    setTimeout(() => { motorBJ.maoJogador.push(sacarCartaAletoria()); atualizarMesaVisual(); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7); }, 200);
    setTimeout(() => { motorBJ.maoDealer.push(sacarCartaAletoria()); atualizarMesaVisual(); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7); }, 600);
    setTimeout(() => { motorBJ.maoJogador.push(sacarCartaAletoria()); atualizarMesaVisual(); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7); }, 1000);
    setTimeout(() => { 
        motorBJ.maoDealer.push(sacarCartaAletoria()); 
        atualizarMesaVisual(); 
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7);
        
        if (calcularPontos(motorBJ.maoJogador) === 21) {
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 300]);
                    }
            finalizarRodadaBJ("BLACKJACK");
        }
    }, 1400);
};

window.comprarCartaBJ = function() {
    if (!motorBJ.jogando) return;
    
    // 🚨 O RISCO: Se ela pedir carta com 15+ pontos, a mesa pisca em perigo
    let pontosAtuais = calcularPontos(motorBJ.maoJogador);
    if (pontosAtuais >= 15) {
        const mesa = document.getElementById('mesa-blackjack');
        if(mesa) {
            mesa.style.boxShadow = "inset 0 0 50px rgba(231, 76, 60, 0.4)";
            setTimeout(() => mesa.style.boxShadow = "none", 300);
        }
    }

    motorBJ.maoJogador.push(sacarCartaAletoria());
    atualizarMesaVisual();
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
    if(window.Haptics) navigator.vibrate(30);

    if (calcularPontos(motorBJ.maoJogador) > 21) {
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
        finalizarRodadaBJ("ESTOUROU");
    }
};

window.pararBJ = function() {
    if (!motorBJ.jogando) return;
    
    // 🚨 THE SQUEEZE: O suspense da IA do Dealer
    // Desativa os botões para ela só assistir o show
    document.getElementById('bj-painel-acao').classList.add('escondido');
    
    // Inicia o coração se não estiver mutado
    if (!window.SantuarioSomPausado) {
        somTensaoBJ.currentTime = 0;
        somTensaoBJ.playbackRate = motorBJ.taxaCoracao;
        somTensaoBJ.volume = 0.6;
        somTensaoBJ.play().catch(e=>{});
    }

    // Pausa dramática de 1.5s antes de revelar a carta secreta
    setTimeout(() => {
        motorBJ.jogando = false; 
        atualizarMesaVisual(); 
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
        
        // Loop recursivo para o dealer comprar cartas lentamente e com aumento de tensão
        function turnoDealer() {
            let pontosDealer = calcularPontos(motorBJ.maoDealer);
            
            if (pontosDealer < 17) {
                setTimeout(() => {
                    motorBJ.maoDealer.push(sacarCartaAletoria());
                    atualizarMesaVisual();
                    
                    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7);
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
                    
                    // Acelera o coração a cada carta do dealer
                    motorBJ.taxaCoracao += 0.2;
                    somTensaoBJ.playbackRate = motorBJ.taxaCoracao;
                    
                    turnoDealer(); // Chama de novo
                }, 1200); // 1.2s de angústia entre cada carta
            } else {
                setTimeout(() => { finalizarRodadaBJ("COMPARAÇÃO"); }, 1000);
            }
        }
        
        turnoDealer();

    }, 1500);
};

function finalizarRodadaBJ(motivo) {
    motorBJ.jogando = false;
    somTensaoBJ.pause(); // Cessa a tensão musical
    atualizarMesaVisual(); 

    document.getElementById('bj-painel-acao').classList.add('escondido');
    document.getElementById('bj-painel-resultado').classList.remove('escondido');

    const pontosJ = calcularPontos(motorBJ.maoJogador);
    const pontosD = calcularPontos(motorBJ.maoDealer);

    let lucro = 0;
    let msgToast = "";
    let iconeToast = "";

    if (motivo === "BLACKJACK") {
        lucro = motorBJ.aposta * 2.5; 
        msgToast = `BLACKJACK! +${lucro}💰`;
        iconeToast = "🃏✨";
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjBlackjack', 1.0); 
        
    } else if (motivo === "ESTOUROU") {
        msgToast = "Você estourou! A casa vence.";
        iconeToast = "💥";
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjBust', 0.8); 
        
        // 🚨 TREMEDEIRA DE ESTOURO
        const mesa = document.getElementById('mesa-blackjack');
        if (mesa) {
            mesa.style.boxShadow = "inset 0 0 80px rgba(231, 76, 60, 0.8)";
            mesa.style.transform = "translateX(5px)";
            setTimeout(()=> mesa.style.transform = "translateX(-5px)", 50);
            setTimeout(()=> mesa.style.transform = "translateX(5px)", 100);
            setTimeout(()=> { mesa.style.transform = "translateX(0)"; mesa.style.boxShadow = "none"; }, 150);
        }

    } else {
        if (pontosD > 21) {
            lucro = motorBJ.aposta * 2; 
            msgToast = `Dealer estourou! Você venceu! +${lucro}💰`;
            iconeToast = "💸";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjWin', 0.9); 
            
        } else if (pontosJ > pontosD) {
            lucro = motorBJ.aposta * 2; 
            msgToast = `Sua mão é maior! Você venceu! +${lucro}💰`;
            iconeToast = "🏆";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjWin', 0.9); 
            
        } else if (pontosJ < pontosD) {
            msgToast = "O Dealer venceu esta mão.";
            iconeToast = "🏦";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjLose', 0.7); 
            
        } else {
            lucro = motorBJ.aposta; 
            msgToast = "Empate (Push). Aposta devolvida.";
            iconeToast = "🤝";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjPush', 0.8); 
        }
    }

    if (lucro > 0) {
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "Vitória no Blackjack");
        if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#ffffff'], particleCount: 150});
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100, 200, 200]);
                    }
    } else if (lucro === 0 && pontosJ !== pontosD) {
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 200]);
                    }
    }

    if(typeof mostrarToast === 'function') mostrarToast(msgToast, iconeToast);
}

window.resetarMesaBJ = function(init = false) {
    motorBJ.jogando = false;
    somTensaoBJ.pause();
    document.getElementById('bj-painel-resultado').classList.add('escondido');
    document.getElementById('bj-painel-acao').classList.add('escondido');
    document.getElementById('bj-painel-aposta').classList.remove('escondido');
    
    const divJog = document.getElementById('bj-jogador-cartas');
    const divDeal = document.getElementById('bj-dealer-cartas');
    const ptsJog = document.getElementById('bj-jogador-pontos');
    const ptsDeal = document.getElementById('bj-dealer-pontos');
    
    if(divJog) divJog.innerHTML = "";
    if(divDeal) divDeal.innerHTML = "";
    if(ptsJog) ptsJog.innerText = "0";
    if(ptsDeal) ptsDeal.innerText = "?";
    
    const mesa = document.getElementById('mesa-blackjack');
    if(mesa) mesa.style.boxShadow = "none";
    
    if(!init && window.Haptics) window.Haptics.toqueLeve();
};


// ============================================================================
// 🎡 MOTOR MATEMÁTICO, FÍSICO E SONORO: ROLETA DA SORTE (HIGH STAKES)
// ============================================================================

const roteadorAntesDaRoleta = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'roleta') {
        const mesa = document.getElementById('mesa-roleta');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            
            // Inicia o giro ocioso (esperando apostas)
            const disco = document.getElementById('disco-roleta');
            disco.style.transition = 'none';
            disco.classList.add('roleta-respirando');
        }
    } else {
        if(typeof roteadorAntesDaRoleta === 'function') roteadorAntesDaRoleta(nomeDoJogo);
    }
};

window.fecharMesaRoleta = function() {
    if (motorRoleta.girando) {
        if(typeof mostrarToast === 'function') mostrarToast("A roda está girando! Aguarde.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-roleta');
    if(mesa) mesa.style.display = 'none';
};

// --- O CÉREBRO DA MÁQUINA ---
let motorRoleta = {
    girando: false,
    anguloAtual: 0
};

window.ajustarApostaRoleta = function(valor) {
    if (motorRoleta.girando) return;
    const input = document.getElementById('roleta-aposta-input');
    if(!input) return;
    
    let novaAposta = parseInt(input.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    input.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

// 🚨 O LEITOR DE MATRIZ (Lê a posição do CSS em tempo real)
function obterAnguloVisualReal(elemento) {
    const style = window.getComputedStyle(elemento);
    const matrix = style.getPropertyValue('transform');
    if (matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        let angulo = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        return (angulo < 0) ? angulo + 360 : angulo;
    }
    return 0;
}

window.apostarRoleta = function(corApostada) {
    if (motorRoleta.girando) return;
    
    const input = document.getElementById('roleta-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, `Aposta no ${corApostada.toUpperCase()}`);
    
    motorRoleta.girando = true;
    const disco = document.getElementById('disco-roleta');
    
    let anguloVisualCongelado = obterAnguloVisualReal(disco);
    
    disco.classList.remove('roleta-respirando');
    disco.style.transition = 'none';
    disco.style.transform = `rotate(${anguloVisualCongelado}deg)`;
    
    void disco.offsetWidth; // Reflow force

    // MATEMÁTICA PURA
    let numeroSorteado = Math.floor(Math.random() * 15); 
    let corCaiu = "";
    let posicaoAlvoNaRoda = 0;

    const posicoesVermelhas = [12, 60, 108, 156, 204, 252, 300];
    const posicoesPretas = [36, 84, 132, 180, 228, 276, 324];

    if (numeroSorteado === 0) {
        corCaiu = "verde";
        posicaoAlvoNaRoda = 354; 
    } else if (numeroSorteado >= 1 && numeroSorteado <= 7) {
        corCaiu = "vermelho";
        posicaoAlvoNaRoda = posicoesVermelhas[numeroSorteado - 1]; 
    } else {
        corCaiu = "preto";
        posicaoAlvoNaRoda = posicoesPretas[numeroSorteado - 8]; 
    }

    let rotacaoParaOAlvo = (360 - posicaoAlvoNaRoda) % 360;
    let distanciaFaltante = rotacaoParaOAlvo - (anguloVisualCongelado % 360);
    if (distanciaFaltante <= 0) distanciaFaltante += 360; 

    // O Torque (Várias voltas antes de parar)
    motorRoleta.anguloAtual = anguloVisualCongelado + 3600 + distanciaFaltante;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('roletaSpin', 1.0);

    // Física de Rotação (9 Segundos)
    disco.style.transition = 'transform 9s cubic-bezier(0.1, 0.95, 0.15, 1)';
    disco.style.transform = `rotate(${motorRoleta.anguloAtual}deg)`;
    
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([20, 50, 20, 50, 20, 50]);
                    }
    if(typeof mostrarToast === 'function') mostrarToast("Rien ne va plus! (Apostas encerradas)", "🎲");

    // 🚨 A MÁGICA: O som da catraca desacelerando hiper-realista
    let tempoAtual = 0;
    let intervaloBase = 25; 
    const somCatraca = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    somCatraca.volume = 0.4;

    function tocarCatraca() {
        if (!motorRoleta.girando) return;
        
        if (!window.SantuarioSomPausado) {
            somCatraca.currentTime = 0;
            somCatraca.play().catch(e=>{});
        }
        
        if (window.Haptics) window.Haptics.toqueLeve();

        tempoAtual += intervaloBase;
        intervaloBase = 25 + Math.pow(tempoAtual / 600, 2.5); // Desaceleração exponencial dramática

        if (tempoAtual < 8600) { // Para um pouquinho antes da física CSS concluir
            setTimeout(tocarCatraca, intervaloBase);
        }
    }
    tocarCatraca();

    setTimeout(() => {
        verificarVitoriaRoleta(corApostada, corCaiu, aposta);
    }, 9000);
};

function verificarVitoriaRoleta(corApostada, corCaiu, aposta) {
    motorRoleta.girando = false;
    
    const disco = document.getElementById('disco-roleta');
    if(disco) {
        let anguloFinal = obterAnguloVisualReal(disco);
        disco.style.transition = 'none';
        disco.style.transform = `rotate(${anguloFinal}deg)`;
        void disco.offsetWidth;
        disco.classList.add('roleta-respirando');
    }

    let lucro = 0;
    let msgToast = "";
    let icone = "";

    // 🚨 AVALIAÇÃO E O "ZERO VERDE DO AFETO"
    if (corApostada === corCaiu) {
        if (corCaiu === "verde") {
            lucro = aposta * 14;
            // O JACKPOT SUPREMO DO RELACIONAMENTO
            msgToast = `ZERO VERDE! +${lucro}💰 E VOCÊ GANHOU UM MIMO ROMÂNTICO!`;
            icone = "💚";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#D4AF37', '#ffffff'], particleCount: 300, spread: 150});
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300, 100, 500]);
                    }
            
        } else {
            lucro = aposta * 2;
            msgToast = `Caiu no ${corCaiu.toUpperCase()}! +${lucro}💰`;
            icone = (corCaiu === "vermelho") ? "🔴" : "⚫";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', (corCaiu==='vermelho'?'#e74c3c':'#2c3e50')], particleCount: 100});
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 400]);
                    }
        }
        
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, `Vitória na Roleta (${corCaiu.toUpperCase()})`);
        
    } else {
        msgToast = `Caiu no ${corCaiu.toUpperCase()}. A casa venceu.`;
        icone = "💸";
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
    }

    if(typeof mostrarToast === 'function') mostrarToast(msgToast, icone);
}


// ============================================================================
// ☄️ MOTOR FÍSICO, MATEMÁTICO E SONORO: PLINKO (MÚLTIPLAS BOLAS & RASTRO)
// ============================================================================

const roteadorAntesPlinko = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'plinko') {
        const mesa = document.getElementById('mesa-plinko');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            if (!motorPlinko.construido) construirPiramidePlinko();
        }
    } else {
        if(typeof roteadorAntesPlinko === 'function') roteadorAntesPlinko(nomeDoJogo);
    }
};

window.fecharMesaPlinko = function() {
    const mesa = document.getElementById('mesa-plinko');
    if(mesa) mesa.style.display = 'none';
};

let motorPlinko = {
    construido: false,
    linhas: 10, 
    multiplicadores: [50, 15, 5, 1.5, 0.2, 0.2, 1.5, 5, 15, 50], 
    coresCacapas: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
};

window.ajustarApostaPlinko = function(valor) {
    const visor = document.getElementById('plinko-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function construirPiramidePlinko() {
    const board = document.getElementById('plinko-board');
    const cacapasDiv = document.getElementById('plinko-cacapas');
    if(!board || !cacapasDiv) return;
    
    // 🚨 Removemos a linha "board.innerHTML = ''" que estava deletando as caçapas!
    
    // 1. Pinos (Só constrói se o quadro estiver vazio para evitar duplicação)
    if (board.querySelectorAll('.plinko-pino').length === 0) {
        for (let linha = 0; linha < motorPlinko.linhas; linha++) {
            let qtdPinos = linha + 3; 
            for (let pino = 0; pino < qtdPinos; pino++) {
                let dot = document.createElement('div');
                dot.className = 'plinko-pino';
                let posX = 50 + ((pino - (qtdPinos - 1) / 2) * 8); 
                let posY = 10 + (linha * 8.5); 
                dot.style.left = `${posX}%`;
                dot.style.top = `${posY}%`;
                dot.id = `pino-${linha}-${pino}`;
                board.appendChild(dot);
            }
        }
    }

    // 2. Caçapas
    cacapasDiv.innerHTML = ""; // Limpa apenas as caçapas antigas
    for (let i = 0; i < motorPlinko.multiplicadores.length; i++) {
        let cacapa = document.createElement('div');
        cacapa.className = 'plinko-cacapa';
        cacapa.innerText = `${motorPlinko.multiplicadores[i]}x`;
        cacapa.style.background = motorPlinko.coresCacapas[i];
        cacapa.id = `cacapa-${i}`;
        cacapasDiv.appendChild(cacapa);
    }
    
    motorPlinko.construido = true;
}

// 🚨 SOM DA BOLINHA BATENDO (Permite Pitch Shifting por bola)
function criarSomBatidaPlinko() {
    const som = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'); // Um 'ting' que vamos alterar
    return som;
}

window.soltarBolinhaPlinko = function() {
    const input = document.getElementById('plinko-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const btn = document.getElementById('btn-plinko-jogar');
    if(btn) {
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Lançamento no Plinko");

    const board = document.getElementById('plinko-board');
    const bola = document.createElement('div');
    bola.className = 'plinko-bola';
    board.appendChild(bola);

    let linhaAtual = 0;
    let posX = 50; 
    let posY = 2; 
    
    bola.style.left = `${posX}%`;
    bola.style.top = `${posY}%`;

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('plinkoDrop', 0.8);

    // 🚨 A MÁGICA: Cada bola ganha a sua própria física e áudio!
    const somBatida = criarSomBatidaPlinko();
    let frequenciaBatida = 2.0; // Começa agudo lá no topo da pirâmide

    let quedaInterval = setInterval(() => {
        if (linhaAtual >= motorPlinko.linhas) {
            clearInterval(quedaInterval);
            bola.remove();
            
            // FÍSICA PURA: Se a bola foi muito para o lado esquerdo (posX baixo) ou direito (posX alto), ela cai nas caçapas extremas
            let range = 4.0 * motorPlinko.linhas; // Distância máxima possível de ser viajada do centro
            let offsetCentral = (posX - 50); // - range a + range
            let proporcao = (offsetCentral + range) / (range * 2); // 0.0 a 1.0
            
            let bucketIndex = Math.floor(proporcao * motorPlinko.multiplicadores.length);
            if (bucketIndex < 0) bucketIndex = 0;
            if (bucketIndex >= motorPlinko.multiplicadores.length) bucketIndex = motorPlinko.multiplicadores.length - 1;

            pagarPlinko(bucketIndex, aposta);
            return;
        }

        // 🚨 RASTRO LUMINOSO (Cauda de Cometa)
        const fantasma = document.createElement('div');
        fantasma.className = 'plinko-bola';
        fantasma.style.left = `${posX}%`;
        fantasma.style.top = `${posY}%`;
        fantasma.style.opacity = '0.5';
        fantasma.style.transform = 'scale(0.8)';
        fantasma.style.transition = 'all 0.4s ease-out';
        board.appendChild(fantasma);
        setTimeout(() => fantasma.remove(), 400); // O fantasma some rápido

        // Matemática do Quique
        let direcao = Math.random() > 0.5 ? 1 : -1;
        posX += (direcao * 4);
        posY = 10 + (linhaAtual * 8.5); 
        
        bola.style.left = `${posX}%`;
        bola.style.top = `${posY}%`;

        // 🚨 A MÁGICA SONORA: O som fica mais grave (pesado) conforme a bola desce!
        if (!window.SantuarioSomPausado) {
            somBatida.currentTime = 0;
            somBatida.playbackRate = frequenciaBatida;
            somBatida.volume = 0.3 + (linhaAtual * 0.06); // Fica mais alto no fundo
            somBatida.play().catch(e=>{});
            frequenciaBatida -= 0.15; // O Pitch vai caindo para ficar grave
            if (frequenciaBatida < 0.5) frequenciaBatida = 0.5;
        }

        if(window.Haptics) window.Haptics.toqueLeve();

        // 🚨 FÍSICA: Dá um soquinho no pino que foi acertado
        const pinoBatido = document.elementFromPoint(
            bola.getBoundingClientRect().left + 10, 
            bola.getBoundingClientRect().top + 10
        );
        if (pinoBatido && pinoBatido.classList.contains('plinko-pino')) {
            pinoBatido.style.transform = 'scale(1.4)';
            pinoBatido.style.background = '#f1c40f'; // Brilha em ouro
            setTimeout(() => {
                pinoBatido.style.transform = 'scale(1)';
                pinoBatido.style.background = 'rgba(255,255,255,0.3)';
            }, 150);
        }

        linhaAtual++;
    }, 300);
};

function pagarPlinko(bucketIndex, aposta) {
    const mult = motorPlinko.multiplicadores[bucketIndex];
    const lucro = Math.floor(aposta * mult);
    
    const cacapa = document.getElementById(`cacapa-${bucketIndex}`);
    if(cacapa) {
        cacapa.classList.add('plinko-cacapa-hit');
        cacapa.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cacapa.classList.remove('plinko-cacapa-hit');
            cacapa.style.transform = 'scale(1)';
        }, 200);
    }

    if (lucro > aposta) {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0); 
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, `Prêmio Plinko (${mult}x)`);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100, 200]);
                    }
        if(mult >= 15 && typeof confetti === 'function') confetti({colors: ['#e74c3c', '#f1c40f'], particleCount: 100}); 
        if(typeof mostrarToast === 'function') mostrarToast(`PLINKO! ${mult}x (+${lucro}💰)`, "✨");
    } else {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.6); 
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "Retorno Plinko");
        if(window.Haptics) window.Haptics.toqueLeve();
    }
}


// ============================================================================
// 🎫 MOTOR GRÁFICO, MATEMÁTICO E SONORO: RASPADINHA VIP (AUTO-REVEAL)
// ============================================================================

const roteadorAntesRaspadinha = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'raspadinha') {
        const mesa = document.getElementById('mesa-raspadinha');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            prepararBilheteRaspadinha(true); 
        }
    } else if (typeof roteadorAntesRaspadinha === 'function') {
        roteadorAntesRaspadinha(nomeDoJogo);
    }
};

window.fecharMesaRaspadinha = function() {
    if (motorRaspadinha.jogando && !motorRaspadinha.finalizado) {
        if(typeof mostrarToast === 'function') mostrarToast("Termine de raspar seu bilhete!", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-raspadinha');
    if(mesa) mesa.style.display = 'none';
};

let motorRaspadinha = {
    jogando: false,
    finalizado: true,
    apostaAtual: 0,
    lucro: 0,
    simbolosNaMesa: [],
    pixelsRaspados: 0,
    totalPixels: 0,
    tempoUltimoSomFriccao: 0, 
    simbolos: [
        { emoji: '💎', mult: 50 },
        { emoji: '🍀', mult: 20 },
        { emoji: '🍒', mult: 5 },
        { emoji: '🍋', mult: 2 },
        { emoji: '🥑', mult: 0 } 
    ],
    canvas: null,
    ctx: null
};

window.ajustarApostaRaspadinha = function(valor) {
    if (motorRaspadinha.jogando && !motorRaspadinha.finalizado) return;
    const visor = document.getElementById('raspadinha-aposta-input');
    if(!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function prepararBilheteRaspadinha(apenasVisual = false) {
    const grid = document.getElementById('raspadinha-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    for (let i = 0; i < 9; i++) {
        const div = document.createElement('div');
        div.className = 'raspadinha-celula';
        div.innerText = apenasVisual ? "❓" : motorRaspadinha.simbolosNaMesa[i];
        div.id = `rasp-celula-${i}`;
        grid.appendChild(div);
    }

    const canvas = document.getElementById('raspadinha-canvas');
    if (!canvas) return;
    motorRaspadinha.canvas = canvas;
    motorRaspadinha.ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // 🚨 Salva a área total para calcular a porcentagem raspada (Auto-Reveal)
    motorRaspadinha.totalPixels = canvas.width * canvas.height;
    
    motorRaspadinha.ctx.globalCompositeOperation = "source-over";
    
    let gradient = motorRaspadinha.ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#bdc3c7");
    gradient.addColorStop(0.5, "#ecf0f1");
    gradient.addColorStop(1, "#95a5a6");
    
    motorRaspadinha.ctx.fillStyle = gradient;
    motorRaspadinha.ctx.fillRect(0, 0, canvas.width, canvas.height);

    motorRaspadinha.ctx.fillStyle = "#34495e";
    motorRaspadinha.ctx.font = "bold 24px Arial";
    motorRaspadinha.ctx.textAlign = "center";
    motorRaspadinha.ctx.fillText("RASPE AQUI", canvas.width/2, canvas.height/2);

    configurarToqueRaspadinha();
}

window.comprarRaspadinha = function() {
    const input = document.getElementById('raspadinha-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Compra de Bilhete");

    motorRaspadinha.jogando = true;
    motorRaspadinha.finalizado = false;
    motorRaspadinha.apostaAtual = aposta;
    motorRaspadinha.pixelsRaspados = 0;

    let sorte = Math.random();
    motorRaspadinha.simbolosNaMesa = Array(9).fill("");
    motorRaspadinha.lucro = 0;

    if (sorte < 0.40) { // 40% de chance de vitória
        let symSorte = Math.random();
        let simboloVencedor;
        if (symSorte < 0.02) simboloVencedor = motorRaspadinha.simbolos[0]; 
        else if (symSorte < 0.10) simboloVencedor = motorRaspadinha.simbolos[1]; 
        else if (symSorte < 0.40) simboloVencedor = motorRaspadinha.simbolos[2]; 
        else simboloVencedor = motorRaspadinha.simbolos[3]; 

        motorRaspadinha.lucro = aposta * simboloVencedor.mult;

        let posicoesVit = [];
        while(posicoesVit.length < 3) {
            let p = Math.floor(Math.random() * 9);
            if (!posicoesVit.includes(p)) posicoesVit.push(p);
        }
        
        posicoesVit.forEach(p => motorRaspadinha.simbolosNaMesa[p] = simboloVencedor.emoji);
        
        for (let i = 0; i < 9; i++) {
            if (motorRaspadinha.simbolosNaMesa[i] === "") {
                let lixo = motorRaspadinha.simbolos[Math.floor(Math.random() * 5)].emoji;
                while (lixo === simboloVencedor.emoji) {
                    lixo = motorRaspadinha.simbolos[Math.floor(Math.random() * 5)].emoji;
                }
                motorRaspadinha.simbolosNaMesa[i] = lixo;
            }
        }
    } else { // 60% de chance de perder (Near Miss - Quase Lá)
        let lixos = [
            motorRaspadinha.simbolos[0].emoji, motorRaspadinha.simbolos[0].emoji, 
            motorRaspadinha.simbolos[1].emoji, motorRaspadinha.simbolos[1].emoji, 
            motorRaspadinha.simbolos[2].emoji, motorRaspadinha.simbolos[2].emoji, 
            motorRaspadinha.simbolos[3].emoji, motorRaspadinha.simbolos[3].emoji, 
            motorRaspadinha.simbolos[4].emoji 
        ];
        lixos.sort(() => Math.random() - 0.5);
        motorRaspadinha.simbolosNaMesa = lixos;
    }

    prepararBilheteRaspadinha(false);

    const canvas = document.getElementById('raspadinha-canvas');
    canvas.style.opacity = "1";
    canvas.style.pointerEvents = "auto";
    
    const btn = document.getElementById('btn-raspadinha-comprar');
    btn.innerHTML = "RASPE A TELA COM O DEDO 👆";
    btn.style.background = "#555";
    btn.style.pointerEvents = "none";
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 50]);
                    }
};

function configurarToqueRaspadinha() {
    const canvas = motorRaspadinha.canvas;
    let raspando = false;
    let ultimaChamada = 0; // Para throttling de performance

    const apagarTinta = (x, y) => {
        if (!motorRaspadinha.jogando || motorRaspadinha.finalizado) return;
        
        const ctx = motorRaspadinha.ctx;
        
        // 🚨 MOEDA MAIOR: Aumentado o raio de 18 para 35! Limpa muito mais rápido!
        const RAIO_MOEDA = 35;
        
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, RAIO_MOEDA, 0, Math.PI * 2); 
        ctx.fill();

        let agora = Date.now();
        if (agora - motorRaspadinha.tempoUltimoSomFriccao > 150) { 
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('raspando', 0.5);
            motorRaspadinha.tempoUltimoSomFriccao = agora;
            if(window.Haptics && Math.random() > 0.6) window.Haptics.toqueLeve();
        }

        // 🚨 A MÁGICA DO AUTO-REVEAL: Calcula os "arranhões" com base na área da moeda
        // A cada raspada de raio 35, ela apaga aproximadamente 3848 pixels da tela
        motorRaspadinha.pixelsRaspados += (Math.PI * Math.pow(RAIO_MOEDA, 2));
        
        // Se ela raspar 60% da área do bilhete, o jogo revela o resto sozinho!
        if (motorRaspadinha.pixelsRaspados > (motorRaspadinha.totalPixels * 0.6)) {
            revelarTudoRaspadinha();
        }
    };

    // 🚨 THROTTLING: Impede o iPhone de engasgar com 120Hz de toque na tela
    const desenharComThrottling = (e) => {
        let agora = Date.now();
        if (agora - ultimaChamada < 15) return; // Limita a ~60FPS
        ultimaChamada = agora;
        
        const rect = canvas.getBoundingClientRect();
        apagarTinta(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    };

    canvas.addEventListener('touchstart', (e) => {
        raspando = true;
        desenharComThrottling(e);
    }, {passive: false});

    canvas.addEventListener('touchmove', (e) => {
        if (!raspando) return;
        if(e.cancelable) e.preventDefault(); 
        desenharComThrottling(e);
    }, {passive: false});

    canvas.addEventListener('touchend', () => raspando = false);
    canvas.addEventListener('touchcancel', () => raspando = false);

    // Mouse PC
    canvas.addEventListener('mousedown', (e) => {
        raspando = true;
        const rect = canvas.getBoundingClientRect();
        apagarTinta(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!raspando) return;
        const rect = canvas.getBoundingClientRect();
        apagarTinta(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mouseup', () => raspando = false);
    canvas.addEventListener('mouseleave', () => raspando = false);
}

function revelarTudoRaspadinha() {
    motorRaspadinha.finalizado = true;
    
    const canvas = motorRaspadinha.canvas;
    canvas.style.transition = "opacity 0.8s ease-out"; // 🚨 Dissolução mágica suave
    canvas.style.opacity = "0";
    canvas.style.pointerEvents = "none";

    let contagem = {};
    motorRaspadinha.simbolosNaMesa.forEach(s => contagem[s] = (contagem[s] || 0) + 1);
    
    let achouVencedor = false;
    for (const [simbolo, qtd] of Object.entries(contagem)) {
        if (qtd >= 3) {
            achouVencedor = true;
            for (let i = 0; i < 9; i++) {
                if (motorRaspadinha.simbolosNaMesa[i] === simbolo) {
                    const cel = document.getElementById(`rasp-celula-${i}`);
                    if(cel) cel.classList.add('raspadinha-vitoria-anim');
                }
            }
        }
    }

    // Atraso de 0.8s para deixar a dissolução da tinta acontecer antes da tela piscar os prêmios
    setTimeout(() => {
        if (motorRaspadinha.lucro > 0) {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(motorRaspadinha.lucro, "Prêmio na Raspadinha!");
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#bdc3c7', '#D4AF37'], particleCount: 200});
            if(typeof mostrarToast === 'function') mostrarToast(`RASPOU E GANHOU! +${motorRaspadinha.lucro}💰`, "🎫");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
            if(typeof mostrarToast === 'function') mostrarToast("Não foi dessa vez. Tente novamente!", "💸");
        }

        const btn = document.getElementById('btn-raspadinha-comprar');
        if(btn) {
            btn.innerHTML = "Comprar Novo Bilhete 🎫";
            btn.style.background = "linear-gradient(145deg, #bdc3c7, #7f8c8d)";
            btn.style.pointerEvents = "auto";
        }
        motorRaspadinha.jogando = false;
    }, 800);
}


// ============================================================================
// 🗼 MOTOR MATEMÁTICO, GRÁFICO E SONORO: A TORRE (TOWERS) COM TENSÃO VERTICAL
// ============================================================================

const roteadorAntesTowers = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'towers') {
        const mesa = document.getElementById('mesa-towers');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            desenharGradeTowers(); 
        }
    } else if (typeof roteadorAntesTowers === 'function') {
        roteadorAntesTowers(nomeDoJogo);
    }
};

window.fecharMesaTowers = function() {
    if (motorTowers.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("Escalada em andamento! Retire o lucro.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-towers');
    if(mesa) mesa.style.display = 'none';
};

// A Matemática do Vício: 8 andares. Chance de passar = 66% por andar.
const MULTIPLICADORES_TOWERS = [1.42, 2.02, 2.88, 4.09, 5.82, 8.27, 11.76, 16.71];

let motorTowers = {
    jogando: false,
    apostaAtual: 0,
    andarAtual: 0, // Vai de 0 a 7 (0 é o chão)
    lucroPotencial: 0,
    frequenciaSomTowers: 1.0, 
    gradeSecreta: [] 
};

// 🚨 O Áudio Manipulável do Cristal
const somCristalTowers = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

window.ajustarApostaTowers = function(valor) {
    if (motorTowers.jogando) return;
    const visor = document.getElementById('towers-aposta-input');
    if(!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function desenharGradeTowers() {
    const grid = document.getElementById('towers-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    // 🚨 CORREÇÃO: Restaurada a sua ordem original (0 a 7)! 
    // O CSS 'column-reverse' cuida de empurrar o 0 para a base da tela perfeitamente.
    for (let linha = 0; linha < 8; linha++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'towers-row towers-row-disabled'; 
        rowDiv.id = `towers-row-${linha}`;

        for (let col = 0; col < 3; col++) {
            const bloco = document.createElement('div');
            bloco.className = 'towers-bloco';
            bloco.id = `towers-bloco-${linha}-${col}`;
            
            bloco.onclick = () => {
                if (!motorTowers.jogando) {
                    if(typeof mostrarToast === 'function') mostrarToast("Aposte primeiro!", "💸");
                } else if (linha === motorTowers.andarAtual) {
                    clicarBlocoTowers(linha, col);
                }
            };
            rowDiv.appendChild(bloco);
        }
        grid.appendChild(rowDiv);
    }
}

window.iniciarRodadaTowers = function() {
    const input = document.getElementById('towers-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Escalada na Torre");

    motorTowers.jogando = true;
    motorTowers.apostaAtual = aposta;
    motorTowers.andarAtual = 0;
    motorTowers.lucroPotencial = aposta;
    motorTowers.frequenciaSomTowers = 1.0; // Reseta a música!

    const btnIniciar = document.getElementById('btn-towers-iniciar');
    const painelSaque = document.getElementById('towers-painel-saque');
    if(btnIniciar) btnIniciar.classList.add('escondido');
    if(painelSaque) painelSaque.classList.remove('escondido');
    
    const lucroVisor = document.getElementById('towers-lucro-texto');
    const multVisor = document.getElementById('towers-proximo-mult');
    if(lucroVisor) lucroVisor.innerText = "0";
    if(multVisor) multVisor.innerText = MULTIPLICADORES_TOWERS[0];

    motorTowers.gradeSecreta = [];
    for (let i = 0; i < 8; i++) {
        let linha = [0, 0, 0];
        let bombaPos = Math.floor(Math.random() * 3);
        linha[bombaPos] = 1;
        motorTowers.gradeSecreta.push(linha);
    }

    desenharGradeTowers(); 
    ativarAndarTowers(0); // Começa pela base!
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100]);
                    }
};

function ativarAndarTowers(linha) {
    if (linha > 0) {
        const linhaAnterior = document.getElementById(`towers-row-${linha - 1}`);
        if(linhaAnterior) {
            linhaAnterior.classList.add('towers-row-disabled');
            Array.from(linhaAnterior.children).forEach(b => b.classList.remove('towers-bloco-ativo'));
        }
    }

    const linhaAtual = document.getElementById(`towers-row-${linha}`);
    if(linhaAtual) {
        linhaAtual.classList.remove('towers-row-disabled');
        Array.from(linhaAtual.children).forEach(bloco => {
            bloco.classList.add('towers-bloco-ativo');
            // 🚨 EFEITO DE PULSO NEON AO ATIVAR O ANDAR
            bloco.style.transform = "scale(1.1)";
            bloco.style.boxShadow = "0 0 15px #00d4ff";
            setTimeout(() => {
                bloco.style.transform = "scale(1)";
                bloco.style.boxShadow = "none";
            }, 300);
        });
    }
}

function clicarBlocoTowers(linha, col) {
    const ehBomba = motorTowers.gradeSecreta[linha][col] === 1;
    const blocoClicado = document.getElementById(`towers-bloco-${linha}-${col}`);
    if(!blocoClicado) return;

    const linhaDOM = document.getElementById(`towers-row-${linha}`);
    if(linhaDOM) {
        Array.from(linhaDOM.children).forEach(b => b.classList.remove('towers-bloco-ativo'));
    }

    if (ehBomba) {
        // PERDEU TUDO
        blocoClicado.classList.add('towers-bloco-bomb');
        blocoClicado.innerHTML = "💣";
        revelarRestoAndarTowers(linha, col);
        
        // 🚨 FÍSICA: O SOLAVANCO DE QUEDA!
        const grade = document.getElementById('towers-grid');
        if (grade) {
            grade.style.transition = "transform 0.1s ease-in-out";
            grade.style.transform = "translateY(20px)"; // Despenca visualmente
            grade.style.boxShadow = "inset 0 0 50px rgba(255, 0, 50, 0.8)"; // Luz de emergência
            setTimeout(() => {
                grade.style.transform = "translateY(0)";
            }, 150);
        }

        if(window.CassinoAudio && !window.SantuarioSomPausado) {
            window.CassinoAudio.tocar('minesBomba', 1.0);
            setTimeout(() => window.CassinoAudio.tocar('slotsLose', 0.8), 300); 
        }
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 400]);
                    }
        
        encerrarTowers("derrota");
    } else {
        // 🚨 A ESCADA MUSICAL DO CRISTAL
        if (!window.SantuarioSomPausado) {
            somCristalTowers.currentTime = 0;
            somCristalTowers.playbackRate = motorTowers.frequenciaSomTowers;
            somCristalTowers.volume = 0.5 + (linha * 0.05); // Mais alto no topo
            somCristalTowers.play().catch(e=>{});
            
            motorTowers.frequenciaSomTowers += 0.15; // O tom sobe!
            if (motorTowers.frequenciaSomTowers > 2.5) motorTowers.frequenciaSomTowers = 2.5;
}
if (window.Haptics && navigator.vibrate) {
    navigator.vibrate([30 + (linha * 5)]); // O "clique" físico fica mais forte no topo
}

        blocoClicado.classList.add('towers-bloco-safe');
        blocoClicado.innerHTML = "💎";
        revelarRestoAndarTowers(linha, col);

        motorTowers.lucroPotencial = Math.floor(motorTowers.apostaAtual * MULTIPLICADORES_TOWERS[linha]);
        const lucroVisor = document.getElementById('towers-lucro-texto');
        if(lucroVisor) lucroVisor.innerText = motorTowers.lucroPotencial;

        motorTowers.andarAtual++;

        if (motorTowers.andarAtual < 8) {
            const multVisor = document.getElementById('towers-proximo-mult');
            if(multVisor) multVisor.innerText = MULTIPLICADORES_TOWERS[motorTowers.andarAtual];
            
            setTimeout(() => { ativarAndarTowers(motorTowers.andarAtual); }, 400); // 🚨 Delay de suspense para o próximo andar!
        } else {
            setTimeout(() => { sacarTowers(); }, 500); // Zerou a torre
        }
    }
}

function revelarRestoAndarTowers(linha, colClicada) {
    for (let c = 0; c < 3; c++) {
        if (c !== colClicada) {
            let bloco = document.getElementById(`towers-bloco-${linha}-${c}`);
            if(bloco) {
                bloco.style.opacity = "0.5";
                if (motorTowers.gradeSecreta[linha][c] === 1) {
                    bloco.innerHTML = "💣";
                } else {
                    bloco.innerHTML = "💎";
                }
            }
        }
    }
}

window.sacarTowers = function() {
    if (!motorTowers.jogando) return;
    
    if(typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(motorTowers.lucroPotencial, "Saque nas Alturas da Torre");
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesSaque', 1.0);

    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100, 50, 400]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#00d4ff', '#D4AF37', '#ffffff'], particleCount: 250, spread: 120, origin: {y: 0.1}}); 
    if(typeof mostrarToast === 'function') mostrarToast(`Saque nas Alturas! +${motorTowers.lucroPotencial}💰`, "🗼");

    encerrarTowers("vitoria");
};

function encerrarTowers(resultado) {
    motorTowers.jogando = false;
    
    const grade = document.getElementById('towers-grid');
    if (resultado === "vitoria" && grade) {
        grade.style.boxShadow = "inset 0 0 50px rgba(0, 212, 255, 0.4)"; 
        setTimeout(() => grade.style.boxShadow = "none", 3000);
    } else if (resultado === "derrota" && grade) {
        setTimeout(() => grade.style.boxShadow = "none", 3000);
    }

    document.getElementById('btn-towers-iniciar').classList.remove('escondido');
    document.getElementById('towers-painel-saque').classList.add('escondido');
    
    if (resultado === "derrota") {
        if(typeof mostrarToast === 'function') mostrarToast("Você caiu da torre! A casa vence.", "🔥");
    }
}

// ============================================================================
// ↕️ MOTOR MATEMÁTICO, FÍSICO E SONORO: HI-LO (COM SUSPENSE E STREAK)
// ============================================================================

const roteadorAntesHiLo = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'hilo') {
        const mesa = document.getElementById('mesa-hilo');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            resetarMesaHiLo();
        }
    } else if (typeof roteadorAntesHiLo === 'function') {
        roteadorAntesHiLo(nomeDoJogo);
    }
};

window.fecharMesaHiLo = function() {
    if (motorHiLo.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("Aposta rolando! Retire o lucro primeiro.", "⚠️");
        return;
    }
    somTensaoHiLo.pause();
    const mesa = document.getElementById('mesa-hilo');
    if(mesa) mesa.style.display = 'none';
};

let motorHiLo = {
    jogando: false,
    aposta: 0,
    lucroPotencial: 0,
    multiplicadorAtual: 1.00,
    cartaAtual: 8,
    acertosSeguidos: 0, // 🚨 Rastreador de Combo para a Escada Musical
    frequenciaSomAcerto: 1.0,
    naipes: ['♠', '♥', '♦', '♣']
};

// 🚨 MOTOR DE TENSÃO DO HI-LO
const somTensaoHiLo = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somTensaoHiLo.loop = true;
const somAcertoHiLo = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

window.ajustarApostaHiLo = function(valor) {
    if (motorHiLo.jogando) return;
    const visor = document.getElementById('hilo-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function formatarValorCarta(valor) {
    if(valor === 11) return 'J';
    if(valor === 12) return 'Q';
    if(valor === 13) return 'K';
    if(valor === 14) return 'A';
    return valor.toString();
}

function gerarCartaAleatoria() {
    return Math.floor(Math.random() * 13) + 2; 
}

function atualizarVisualCarta(valor) {
    const cartaFrente = document.getElementById('hilo-carta-frente');
    const topo = document.getElementById('hilo-topo');
    const centro = document.getElementById('hilo-centro');
    const base = document.getElementById('hilo-base');

    const naipe = motorHiLo.naipes[Math.floor(Math.random() * motorHiLo.naipes.length)];
    const cor = (naipe === '♥' || naipe === '♦') ? 'vermelha' : 'preta';
    
    cartaFrente.className = `carta-bj ${cor}`;
    let strValor = formatarValorCarta(valor);

    if(topo) topo.innerText = strValor + naipe;
    if(centro) centro.innerText = naipe;
    if(base) base.innerText = strValor + naipe;
}

function calcularMultiplicadores(valorCarta) {
    let cartasMaiores = 14 - valorCarta;
    let cartasMenores = valorCarta - 2;

    let probMaior = cartasMaiores / 12;
    let probMenor = cartasMenores / 12;

    let multMaior = probMaior > 0 ? (0.96 / probMaior) : 0;
    let multMenor = probMenor > 0 ? (0.96 / probMenor) : 0;

    return { 
        maior: Math.max(1.05, multMaior).toFixed(2), 
        menor: Math.max(1.05, multMenor).toFixed(2) 
    };
}

function atualizarBotoesEPlacar() {
    const mults = calcularMultiplicadores(motorHiLo.cartaAtual);
    const btnMaior = document.getElementById('btn-hilo-maior');
    const btnMenor = document.getElementById('btn-hilo-menor');

    if (mults.maior == 0) {
        if(btnMaior) btnMaior.classList.add('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-maior');
        if(m) m.innerText = "Bloqueado";
    } else {
        if(btnMaior) btnMaior.classList.remove('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-maior');
        if(m) m.innerText = mults.maior + "x";
    }

    if (mults.menor == 0) {
        if(btnMenor) btnMenor.classList.add('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-menor');
        if(m) m.innerText = "Bloqueado";
    } else {
        if(btnMenor) btnMenor.classList.remove('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-menor');
        if(m) m.innerText = mults.menor + "x";
    }

    const lTexto = document.getElementById('hilo-lucro-texto');
    const mTexto = document.getElementById('hilo-multiplicador-texto');
    if(lTexto) lTexto.innerText = motorHiLo.lucroPotencial;
    if(mTexto) mTexto.innerText = motorHiLo.multiplicadorAtual.toFixed(2);
}

window.iniciarRodadaHiLo = function() {
    const input = document.getElementById('hilo-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Aposta no Hi-Lo");

    motorHiLo.jogando = true;
    motorHiLo.aposta = aposta;
    motorHiLo.lucroPotencial = aposta;
    motorHiLo.multiplicadorAtual = 1.00;
    motorHiLo.acertosSeguidos = 0;
    motorHiLo.frequenciaSomAcerto = 1.0;

    const pAposta = document.getElementById('hilo-painel-aposta');
    const bIniciar = document.getElementById('btn-hilo-iniciar');
    const pLucro = document.getElementById('hilo-painel-lucro');
    const pDecisao = document.getElementById('hilo-painel-decisao');
    
    if(pAposta) pAposta.classList.add('escondido');
    if(bIniciar) bIniciar.classList.add('escondido');
    if(pLucro) pLucro.classList.remove('escondido');
    if(pDecisao) pDecisao.classList.remove('escondido');

    const cartaFrente = document.getElementById('hilo-carta-frente');
    if(cartaFrente) {
        cartaFrente.classList.remove('hilo-carta-girando');
        void cartaFrente.offsetWidth; 
        cartaFrente.classList.add('hilo-carta-girando');
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100]);
                    }

    setTimeout(() => {
        motorHiLo.cartaAtual = gerarCartaAleatoria();
        atualizarVisualCarta(motorHiLo.cartaAtual);
        atualizarBotoesEPlacar();
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7);
    }, 300);
};

window.adivinharHiLo = function(escolha) {
    if (!motorHiLo.jogando) return;
    
    const painelDecisao = document.getElementById('hilo-painel-decisao');
    if(painelDecisao) painelDecisao.style.pointerEvents = 'none'; // Trava a mesa

    let novaCarta = gerarCartaAleatoria();
    while (novaCarta === motorHiLo.cartaAtual) {
        novaCarta = gerarCartaAleatoria();
    }

    let venceu = false;
    let multCalculado = calcularMultiplicadores(motorHiLo.cartaAtual);
    let ganhoMultiplicador = 1.00;

    if (escolha === 'maior' && novaCarta > motorHiLo.cartaAtual) {
        venceu = true;
        ganhoMultiplicador = parseFloat(multCalculado.maior);
    } else if (escolha === 'menor' && novaCarta < motorHiLo.cartaAtual) {
        venceu = true;
        ganhoMultiplicador = parseFloat(multCalculado.menor);
    }

    const cartaFrente = document.getElementById('hilo-carta-frente');
    
    // 🚨 O SQUEEZE: Suspense pesado antes de revelar a carta
    if (!window.SantuarioSomPausado) {
        somTensaoHiLo.currentTime = 0;
        // O coração bate mais rápido a cada acerto em sequência!
        somTensaoHiLo.playbackRate = 1.0 + (motorHiLo.acertosSeguidos * 0.15); 
        somTensaoHiLo.volume = 0.6;
        somTensaoHiLo.play().catch(e=>{});
    }

    if (cartaFrente) {
        cartaFrente.style.transform = "scale(1.05)";
        cartaFrente.style.boxShadow = "0 0 30px rgba(241, 196, 15, 0.5)"; // Brilho de expectativa
    }
    
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }

    // O Tempo do Medo (1.2 segundos de coração batendo antes de virar)
    setTimeout(() => {
        somTensaoHiLo.pause();
        
        if(cartaFrente) {
            cartaFrente.style.transform = "scale(1)";
            cartaFrente.style.boxShadow = "none";
            cartaFrente.classList.remove('hilo-carta-girando');
            void cartaFrente.offsetWidth; 
            cartaFrente.classList.add('hilo-carta-girando');
        }
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }

        setTimeout(() => {
            motorHiLo.cartaAtual = novaCarta;
            atualizarVisualCarta(motorHiLo.cartaAtual);
            
            if (venceu) {
                motorHiLo.acertosSeguidos++;
                
                if(cartaFrente) {
                    cartaFrente.classList.add('hilo-vitoria-glow');
                    setTimeout(() => cartaFrente.classList.remove('hilo-vitoria-glow'), 500);
                }
                
                motorHiLo.multiplicadorAtual *= ganhoMultiplicador;
                motorHiLo.lucroPotencial = Math.floor(motorHiLo.aposta * motorHiLo.multiplicadorAtual);
                
                atualizarBotoesEPlacar();
                if(painelDecisao) painelDecisao.style.pointerEvents = 'auto';
                
                // 🚨 ESCADA MUSICAL: O plin fica mais agudo e frenético!
                if (!window.SantuarioSomPausado) {
                    somAcertoHiLo.currentTime = 0;
                    somAcertoHiLo.playbackRate = motorHiLo.frequenciaSomAcerto;
                    somAcertoHiLo.volume = 0.8;
                    somAcertoHiLo.play().catch(e=>{});
                    
                    motorHiLo.frequenciaSomAcerto += 0.1;
                    if (motorHiLo.frequenciaSomAcerto > 2.5) motorHiLo.frequenciaSomAcerto = 2.5;
                }
                
                if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 50, 100]);
                    }
            } else {
                if(cartaFrente) cartaFrente.classList.add('hilo-derrota-glow');
                
                // 🚨 EXPLOSÃO DE DERROTA VISUAL
                const mesa = document.getElementById('mesa-hilo');
                if (mesa) {
                    mesa.style.boxShadow = "inset 0 0 80px rgba(231, 76, 60, 0.8)";
                    setTimeout(() => mesa.style.boxShadow = "none", 400);
                }

                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 500]);
                    }
                
                encerrarRodadaHiLo("derrota");
            }
        }, 300); // Tempo da animação CSS da carta girando
    }, 1200); // O Squeeze de 1.2 segundos
};

window.sacarHiLo = function() {
    if (!motorHiLo.jogando) return;
    
    if(typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(motorHiLo.lucroPotencial, "Saque Mestre no Hi-Lo");
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesSaque', 1.0);

    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100, 50, 400]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#e67e22', '#D4AF37'], particleCount: 200});
    if(typeof mostrarToast === 'function') mostrarToast(`Lucro Perfeito! +${motorHiLo.lucroPotencial}💰`, "↕️");

    encerrarRodadaHiLo("vitoria");
};

function encerrarRodadaHiLo(resultado) {
    motorHiLo.jogando = false;
    somTensaoHiLo.pause();
    
    const painelDecisao = document.getElementById('hilo-painel-decisao');
    if(painelDecisao) painelDecisao.style.pointerEvents = 'auto';
    
    setTimeout(() => {
        resetarMesaHiLo();
        if (resultado === "derrota") {
            if(typeof mostrarToast === 'function') mostrarToast("Errou! A banca levou.", "🔥");
        }
    }, 1500); 
}

function resetarMesaHiLo() {
    motorHiLo.jogando = false;
    const pAposta = document.getElementById('hilo-painel-aposta');
    const bIniciar = document.getElementById('btn-hilo-iniciar');
    const pLucro = document.getElementById('hilo-painel-lucro');
    const pDecisao = document.getElementById('hilo-painel-decisao');
    
    if(pAposta) pAposta.classList.remove('escondido');
    if(bIniciar) bIniciar.classList.remove('escondido');
    if(pLucro) pLucro.classList.add('escondido');
    if(pDecisao) pDecisao.classList.add('escondido');
    
    const cartaFrente = document.getElementById('hilo-carta-frente');
    if(cartaFrente) cartaFrente.className = "carta-bj oculta";
    
    const topo = document.getElementById('hilo-topo');
    const centro = document.getElementById('hilo-centro');
    const base = document.getElementById('hilo-base');
    if(topo) topo.innerText = "";
    if(centro) centro.innerText = "";
    if(base) base.innerText = "";
}


// ============================================================================
// 🎲 MOTOR MATEMÁTICO E SONORO: DADO DE OURO (CRYPTO DICE HIGH STAKES)
// ============================================================================

const roteadorAntesDice = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'dice') {
        const mesa = document.getElementById('mesa-dice');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            atualizarSliderDice(); 
        }
    } else if (typeof roteadorAntesDice === 'function') {
        roteadorAntesDice(nomeDoJogo);
    }
};

window.fecharMesaDice = function() {
    if (motorDice.rolando) {
        if(typeof mostrarToast === 'function') mostrarToast("O dado está girando!", "⚠️");
        return;
    }
    somTickDice.pause();
    const mesa = document.getElementById('mesa-dice');
    if(mesa) mesa.style.display = 'none';
};

let motorDice = {
    rolando: false,
    aposta: 0,
    chanceVitoria: 50,
    multiplicador: 1.98 
};

// 🚨 O MOTOR SONORO DO DADO (Para criar tensão na desaceleração)
const somTickDice = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

window.ajustarApostaDice = function(valor) {
    if (motorDice.rolando) return;
    const visor = document.getElementById('dice-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.atualizarSliderDice = function() {
    if (motorDice.rolando) return;
    
    const slider = document.getElementById('dice-slider');
    if(!slider) return;
    let valor = parseFloat(slider.value);
    
    motorDice.chanceVitoria = valor;
    motorDice.multiplicador = (99 / motorDice.chanceVitoria);

    const alvoV = document.getElementById('dice-alvo-visor');
    const chanceV = document.getElementById('dice-chance-visor');
    const multV = document.getElementById('dice-mult-visor');
    
    if(alvoV) alvoV.innerText = motorDice.chanceVitoria.toFixed(2);
    if(chanceV) chanceV.innerText = motorDice.chanceVitoria.toFixed(0) + "%";
    if(multV) multV.innerText = motorDice.multiplicador.toFixed(2) + "x";

    const track = document.getElementById('dice-track-visual');
    const thumb = document.getElementById('dice-thumb-visual');
    
    if(track) track.style.background = `linear-gradient(to right, #00b09b 0%, #96c93d ${valor}%, #ff0844 ${valor}%, #ffb199 100%)`;
    if(thumb) thumb.style.left = `${valor}%`;
    
    if(window.Haptics && Math.random() > 0.8) window.Haptics.toqueLeve();
};

window.jogarDice = function() {
    if (motorDice.rolando) return;

    const input = document.getElementById('dice-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Rolou o Dado");

    motorDice.rolando = true;
    
    const visor = document.getElementById('dice-resultado-visor');
    const anel = document.getElementById('dice-anel-energia');
    
    if(visor) {
        visor.classList.remove('dice-vitoria-glow', 'dice-derrota-glow');
        visor.classList.add('dice-texto-rolando');
        visor.style.color = "#fff";
    }
    
    if(anel) anel.classList.add('dice-anel-rolando');
    
    const btn = document.getElementById('btn-dice-iniciar');
    if(btn) {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('diceRoll', 0.8);

    let numeroSorteado = (Math.random() * 100).toFixed(2);
    let tempoRolagem = 0;
    let intervalo = 30; // Começa absurdamente rápido
    let rolagens = 0;

    // 🚨 A MÁGICA: Loop recursivo para aplicar fricção/desaceleração e o Estrobo de Cores
    function rodarDadoAnimacao() {
        let numTemp = (Math.random() * 100).toFixed(2);
        if(visor) visor.innerText = numTemp;

        // 🚨 ESTROBO DA ESPERANÇA: Pinta a tela se está ganhando ou perdendo naquele milissegundo!
        if (parseFloat(numTemp) < motorDice.chanceVitoria) {
            if(visor) visor.style.color = "#2ecc71";
            if(anel) anel.style.borderColor = "rgba(46, 204, 113, 0.4)";
        } else {
            if(visor) visor.style.color = "#e74c3c";
            if(anel) anel.style.borderColor = "rgba(231, 76, 60, 0.4)";
        }

        // 🚨 PITCH SHIFTING: O clique do dado vai ficando mais agudo e lento
        if (!window.SantuarioSomPausado) {
            somTickDice.currentTime = 0;
            somTickDice.playbackRate = 1.0 + (rolagens * 0.05);
            if (somTickDice.playbackRate > 3.0) somTickDice.playbackRate = 3.0;
            somTickDice.volume = 0.4;
            somTickDice.play().catch(e=>{});
        }

        if(window.Haptics && rolagens % 3 === 0) navigator.vibrate(10); // Vibração que acompanha a lentidão

        rolagens++;
        tempoRolagem += intervalo;
        intervalo = 30 + Math.pow(rolagens, 1.8); // A curva inercial de frenagem

        if (tempoRolagem < 2500) { // 2.5s de pura tensão
            setTimeout(rodarDadoAnimacao, intervalo);
        } else {
            // FIM DA ROLAGEM
            if(visor) {
                visor.classList.remove('dice-texto-rolando');
                visor.style.color = "#fff";
                visor.innerText = numeroSorteado;
            }
            if(anel) {
                anel.classList.remove('dice-anel-rolando'); 
                anel.style.border = "4px solid rgba(0, 242, 254, 0.2)";
            }
            
            finalizarRolagemDice(parseFloat(numeroSorteado), aposta);
        }
    }
    
    rodarDadoAnimacao(); // Dispara o motor inercial
};

function finalizarRolagemDice(resultado, aposta) {
    const visor = document.getElementById('dice-resultado-visor');
    const anel = document.getElementById('dice-anel-energia');
    const btn = document.getElementById('btn-dice-iniciar');
    
    let venceu = resultado < motorDice.chanceVitoria;

    if (venceu) {
        let lucro = Math.floor(aposta * motorDice.multiplicador);
        
        // 🚨 O MEGA JACKPOT DE RISCO (Menos de 15% de chance)
        if (motorDice.chanceVitoria <= 15) {
            if(visor) visor.classList.add('dice-vitoria-glow');
            if(anel) {
                anel.style.borderColor = "#f1c40f"; // Ouro Supremo!
                anel.style.boxShadow = "0 0 50px rgba(241, 196, 15, 0.8), inset 0 0 25px rgba(241, 196, 15, 0.5)";
            }
            
            // Tremor de tela absurdo
            const mesa = document.getElementById('mesa-dice');
            if(mesa) {
                mesa.style.transform = "scale(1.05)";
                setTimeout(()=> mesa.style.transform = "scale(1)", 150);
            }

            if(window.CassinoAudio && !window.SantuarioSomPausado) {
                window.CassinoAudio.tocar('slotsWin', 1.0);
                setTimeout(()=> window.CassinoAudio.tocar('slotsWin', 1.0), 300); // Toca dobrado!
            }
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 300, 100, 500, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#e67e22', '#ffffff'], particleCount: 300, spread: 160});
            if(typeof mostrarToast === 'function') mostrarToast(`🔥 MEGA JACKPOT EXTREMO! +${lucro}💰`, "👑");
            
        } else {
            // Vitória Normal
            if(visor) visor.classList.add('dice-vitoria-glow');
            if(anel) {
                anel.style.borderColor = "#2ecc71"; 
                anel.style.boxShadow = "0 0 30px rgba(46, 204, 113, 0.6), inset 0 0 15px rgba(46, 204, 113, 0.3)";
            }
            
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#00f2fe', '#2ecc71'], particleCount: 150});
            if(typeof mostrarToast === 'function') mostrarToast(`Golpe de Mestre! +${lucro}💰`, "🎲");
        }

        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, `Vitória no Dado (${motorDice.multiplicador.toFixed(2)}x)`);
        
    } else {
        if(visor) visor.classList.add('dice-derrota-glow');
        if(anel) {
            anel.style.borderColor = "#ff0844"; 
            anel.style.boxShadow = "0 0 30px rgba(255, 8, 68, 0.6), inset 0 0 15px rgba(255, 8, 68, 0.3)";
        }
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 400]);
                    }
        if(typeof mostrarToast === 'function') mostrarToast("Queimou os circuitos! A casa venceu.", "🔥");
    }

    setTimeout(() => {
        motorDice.rolando = false;
        if(btn) {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
        if(visor) {
            visor.classList.remove('dice-vitoria-glow', 'dice-derrota-glow');
            visor.style.color = "#fff";
        }
        if(anel) {
            anel.style.borderColor = "rgba(0, 242, 254, 0.2)";
            anel.style.boxShadow = "inset 0 0 20px rgba(0, 242, 254, 0.1), 0 0 30px rgba(0,0,0,0.8)";
        }
    }, 2000); 
}

// ============================================================================
// 🐯 MOTOR MATEMÁTICO, GRÁFICO E SONORO: TIGRINHO (FORTUNE TIGER)
// ============================================================================

// 🚨 ROTEADOR MESTRE DE MESAS (ATUALIZADO PARA O TIGRINHO)
const roteadorMestreCassino = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'tigrinho') {
        const mesa = document.getElementById('mesa-tigrinho');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            if(typeof construirGridTigrinho === 'function') construirGridTigrinho();
        }
    } else {
        // Se não for tigrinho, tenta abrir os outros jogos através do roteador antigo
        if(typeof roteadorMestreCassino === 'function') {
            roteadorMestreCassino(nomeDoJogo);
        }
    }
};

// FUNÇÃO PARA FECHAR O TIGRINHO
window.fecharMesaTigrinho = function() {
    if (typeof motorTigrinho !== 'undefined' && motorTigrinho.girando) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde o giro terminar!", "⚠️");
        return;
    }
    // Desliga o modo auto se estiver saindo
    if (typeof motorTigrinho !== 'undefined' && motorTigrinho.modoAuto) {
        window.alternarGiroAutoTigrinho();
    }
    const mesa = document.getElementById('mesa-tigrinho');
    if(mesa) mesa.style.display = 'none';
};

let motorTigrinho = {
    gridCriado: false,
    girando: false,
    modoAuto: false,
    loopAuto: null,
    modoCartaSorte: false,
    simboloSorte: "",
    gridAtual: ["", "", "", "", "", "", "", "", ""],
    simbolos: [
        { id: 'moeda', emoji: '🪙', mult: 2 },
        { id: 'lanterna', emoji: '🏮', mult: 5 },
        { id: 'saco', emoji: '💰', mult: 10 },
        { id: 'foguete', emoji: '🎇', mult: 20 },
        { id: 'envelope', emoji: '🧧', mult: 50 },
        { id: 'wild', emoji: '🐯', mult: 100 } // O Wild serve como coringa e paga mais
    ],
    // As 5 linhas clássicas de pagamento 3x3
    linhasPagamento: [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontais
        [0, 4, 8], [2, 4, 6]             // Diagonais
    ]
};

// =======================================================
// 🤫 ALGORITMO CRIPTOGRAFADO: O BUG DO TIGRINHO PAGANTE
// =======================================================
window.verificarHorarioPaganteTigrinho = function() {
    const agora = new Date();
    const dia = agora.getDate();
    const hora = agora.getHours();
    const minutoAtual = agora.getMinutes();

    // Cria uma "Semente Matemática" única para esta hora específica deste dia
    const semente = (dia * 73) + (hora * 13);
    
    // Gera 3 "Minutos Mágicos" usando a semente embaralhada
    const minutoMagico1 = (semente * 3) % 60;
    const minutoMagico2 = (semente * 7) % 60;
    const minutoMagico3 = (semente * 11) % 60;

    // Se o relógio do celular bater com um dos 3 minutos, o BUG ESTÁ ATIVO!
    const bugAtivado = (minutoAtual === minutoMagico1 || minutoAtual === minutoMagico2 || minutoAtual === minutoMagico3);
    
    // 👁️ O SPOILER VISUAL DISCRETO
    const visorAposta = document.getElementById('tigrinho-aposta-input');
    const mascote = document.getElementById('tigrinho-mascote');
    
    if (visorAposta && mascote) {
        if (bugAtivado) {
            // Brilho dourado sutil no número da aposta e pulso no mascote
            visorAposta.style.textShadow = "0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(241, 196, 15, 0.5)";
            visorAposta.style.color = "#fff7d6";
            mascote.style.filter = "drop-shadow(0 0 15px rgba(212, 175, 55, 0.4))";
        } else {
            // Volta ao visual padrão de forma imperceptível
            visorAposta.style.textShadow = "none";
            visorAposta.style.color = "white";
            mascote.style.filter = "none";
        }
    }

    return bugAtivado;
};

// Deixa um espião rodando a cada 5 segundos para ligar/desligar o spoiler visual na tela
setInterval(() => {
    const mesa = document.getElementById('mesa-tigrinho');
    if (mesa && mesa.style.display === 'flex') {
        window.verificarHorarioPaganteTigrinho();
    }
}, 5000);

window.ajustarApostaTigrinho = function(valor) {
    if (motorTigrinho.girando || motorTigrinho.modoAuto) return;
    const visor = document.getElementById('tigrinho-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function construirGridTigrinho() {
    const grid = document.getElementById('tigrinho-grid');
    grid.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        let cel = document.createElement('div');
        cel.className = 'tigrinho-celula';
        cel.id = `tigrinho-cel-${i}`;
        // Preenche com símbolos aleatórios iniciais
        let symAleatorio = motorTigrinho.simbolos[Math.floor(Math.random() * motorTigrinho.simbolos.length)].emoji;
        cel.innerText = symAleatorio;
        motorTigrinho.gridAtual[i] = symAleatorio;
        grid.appendChild(cel);
    }
    motorTigrinho.gridCriado = true;
}

window.alternarGiroAutoTigrinho = function() {
    const btnAuto = document.getElementById('btn-tigrinho-auto');
    if (motorTigrinho.modoAuto) {
        motorTigrinho.modoAuto = false;
        clearInterval(motorTigrinho.loopAuto);
        if(btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #3498db, #2980b9)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Auto Desligado", "🛑");
    } else {
        motorTigrinho.modoAuto = true;
        if(btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Auto Ligado! 🤖", "✨");
        girarTigrinho(); 
    }
};

window.girarTigrinho = function() {
    if (motorTigrinho.girando) return;

    const input = document.getElementById('tigrinho-aposta-input');
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(motorTigrinho.modoAuto) alternarGiroAutoTigrinho();
        return;
    }

    // Se NÃO estiver no modo "Carta da Sorte", cobra a aposta normal
    if (!motorTigrinho.modoCartaSorte) {
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Giro no Tigrinho");
    }

    motorTigrinho.girando = true;
    const btn = document.getElementById('btn-tigrinho-girar');
    if(btn) { btn.style.opacity = "0.5"; btn.style.pointerEvents = "none"; }
    
    limparVitoriasTigrinho();

    // 🚨 A MÁGICA HACKEADA: Lê o Bug Cósmico
    const bugAtivado = window.verificarHorarioPaganteTigrinho();
    
    // Se o bug estiver ativo, a chance de ele soltar a Carta da Sorte sobe de 10% para 50%!
    const chanceCartaSorte = bugAtivado ? 0.50 : 0.10;

    // Sorteio do Modo Carta da Sorte 
    if (!motorTigrinho.modoCartaSorte && Math.random() < chanceCartaSorte) {
        iniciarModoCartaSorte();
        return; // Interrompe o giro normal, o modo carta sorte assume
    }

    executarAnimacaoRolosTigrinho(aposta);
};

function iniciarModoCartaSorte() {
    motorTigrinho.modoCartaSorte = true;
    const mascote = document.getElementById('tigrinho-mascote');
    const msg = document.getElementById('tigrinho-mensagem');
    
    // Escolhe o símbolo da sorte
    const symObj = motorTigrinho.simbolos[Math.floor(Math.random() * (motorTigrinho.simbolos.length - 1))]; // Exclui o Wild
    motorTigrinho.simboloSorte = symObj.emoji;

    if(mascote) mascote.classList.add('tigrinho-modo-sorte');
    if(msg) {
        msg.innerText = `🔥 CARTA DA SORTE: ${motorTigrinho.simboloSorte} 🔥`;
        msg.style.color = "#00f2fe";
    }

    // 🔊 SOM DE TENSÃO SUPREMA!
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('roleta', 1.0); // Som tenso longo
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300, 100, 500]);
                    }
    if(typeof mostrarToast === 'function') mostrarToast(`O Tigre escolheu ${motorTigrinho.simboloSorte}! Giros Grátis!`, "🐯");

    setTimeout(() => {
        executarAnimacaoRolosTigrinho(parseInt(document.getElementById('tigrinho-aposta-input').innerText));
    }, 2000);
}

// =========================================
// 🐯 MOTOR AUDIOVISUAL DO TIGRINHO PREMIER
// =========================================

function executarAnimacaoRolosTigrinho(aposta) {
    if(!window.SantuarioSomPausado && window.CassinoAudio) window.CassinoAudio.tocar('slotsStart', 0.8);
    if(window.Haptics) window.Haptics.toqueForte();

    let novoGrid = [];
    
    // 🚨 A MÁGICA HACKEADA 2: Altera a matemática dos rolos!
    const bugAtivado = window.verificarHorarioPaganteTigrinho();
    let chanceDerrota = motorTigrinho.modoCartaSorte ? 0.35 : 0.70;
    
    // Se o bug estiver ativo no giro normal, a chance de derrota despenca de 70% para 20%!
    if (bugAtivado && !motorTigrinho.modoCartaSorte) {
        chanceDerrota = 0.20; 
    }

    for (let i = 0; i < 9; i++) {
        if (motorTigrinho.modoCartaSorte && motorTigrinho.gridAtual[i] === motorTigrinho.simboloSorte) {
            novoGrid[i] = motorTigrinho.simboloSorte;
            continue; 
        }
        let sorteio = Math.random();
        novoGrid[i] = sorteio < chanceDerrota ? 
                      motorTigrinho.simbolos[Math.floor(Math.random() * 3)].emoji : 
                      motorTigrinho.simbolos[Math.floor(Math.random() * motorTigrinho.simbolos.length)].emoji;
    }

    // 🚨 A MÁGICA: Inicia animação e garante a limpeza posterior
    for(let i=0; i<9; i++) {
        const cel = document.getElementById(`tigrinho-cel-${i}`);
        if(cel && !cel.classList.contains('tigrinho-celula-trancada')) {
            cel.classList.add('tigrinho-girando');
        }
    }

    let trocasFalsas = setInterval(() => {
        for (let i = 0; i < 9; i++) {
            const cel = document.getElementById(`tigrinho-cel-${i}`);
            if (cel && cel.classList.contains('tigrinho-girando')) {
                cel.innerText = motorTigrinho.simbolos[Math.floor(Math.random() * motorTigrinho.simbolos.length)].emoji;
            }
        }
    }, 60);

    // Parada escalonada das colunas para gerar suspense (0.8s, 1.4s, 2.0s)
    [0, 1, 2].forEach(col => {
        setTimeout(() => {
            for (let lin = 0; lin < 3; lin++) {
                let index = col + (lin * 3);
                const cel = document.getElementById(`tigrinho-cel-${index}`);
                if (cel && cel.classList.contains('tigrinho-girando')) {
                    cel.classList.remove('tigrinho-girando'); // 🚨 LIMPA O DESFOQUE AQUI
                    cel.innerText = novoGrid[index];
                    motorTigrinho.gridAtual[index] = novoGrid[index];
                    
                    // Juice: Pequeno "pulo" ao parar
                    cel.style.transform = "scale(0.9)";
                    setTimeout(() => cel.style.transform = "scale(1)", 100);
                }
            }
            if(!window.SantuarioSomPausado && window.CassinoAudio) window.CassinoAudio.tocar('slotsPlin', 0.6);
            if(window.Haptics) window.Haptics.toqueLeve();
        }, 800 + (col * 600));
    });

    setTimeout(() => {
        clearInterval(trocasFalsas);
        avaliarGridTigrinho(novoGrid, aposta);
    }, 2200);
}

function avaliarGridTigrinho(grid, aposta) {
    let lucroTotal = 0;
    let celulasVencedoras = new Set();
    const msgVisor = document.getElementById('tigrinho-mensagem');

    // 1. MODO CARTA DA SORTE (RESPEITANDO O RITMO)
    if (motorTigrinho.modoCartaSorte) {
        let novosTrancados = 0;
        for (let i = 0; i < 9; i++) {
            if (grid[i] === motorTigrinho.simboloSorte) {
                if (!document.getElementById(`tigrinho-cel-${i}`).classList.contains('tigrinho-celula-trancada')) {
                    novosTrancados++;
                }
                celulasVencedoras.add(i);
                document.getElementById(`tigrinho-cel-${i}`).classList.add('tigrinho-celula-trancada');
            }
        }

        if (celulasVencedoras.size === 9) {
            let multSym = motorTigrinho.simbolos.find(s => s.emoji === motorTigrinho.simboloSorte).mult;
            lucroTotal = aposta * multSym * 10;
            encerrarGiroTigrinho(lucroTotal, true, true);
            return;
        }

        if (novosTrancados > 0) {
            if(!window.SantuarioSomPausado && window.CassinoAudio) window.CassinoAudio.tocar('minesDiamante', 0.8);
            msgVisor.innerText = `MAIS UM! ${motorTigrinho.simboloSorte}`;
            setTimeout(() => executarAnimacaoRolosTigrinho(aposta), 1200);
            return;
        } else {
            // Fim do Modo Sorte
            motorTigrinho.modoCartaSorte = false;
            document.getElementById('tigrinho-mascote').classList.remove('tigrinho-modo-sorte-ativo');
            msgVisor.innerText = "Calculando Vitórias...";
            Array.from(document.querySelectorAll('.tigrinho-celula')).forEach(c => c.classList.remove('tigrinho-celula-trancada'));
        }
    }

    // 2. VERIFICAÇÃO DE LINHAS (DOPAMINA AUDIOVISUAL)
    motorTigrinho.linhasPagamento.forEach(linha => {
        let s1 = grid[linha[0]], s2 = grid[linha[1]], s3 = grid[linha[2]];
        if ((s1===s2 && s2===s3) || (s1==='🐯' && s2===s3) || (s2==='🐯' && s1===s3)) {
            linha.forEach(i => celulasVencedoras.add(i));
            let symReal = s1 === '🐯' ? s2 : s1;
            let mult = (motorTigrinho.simbolos.find(s => s.emoji === symReal) || {mult:10}).mult;
            lucroTotal += aposta * mult;
        }
    });

    celulasVencedoras.forEach(i => document.getElementById(`tigrinho-cel-${i}`).classList.add('tigrinho-celula-vitoria'));
    encerrarGiroTigrinho(lucroTotal, lucroTotal > 0, false);
}

function encerrarGiroTigrinho(lucro, venceu, telaCheia) {
    if (venceu) {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "Bênção do Tigrinho!");
        
        if (telaCheia) {
            // O MEGA PAGAMENTO DA CARTA DA SORTE
            if(window.CassinoAudio && !window.SantuarioSomPausado) setTimeout(()=> window.CassinoAudio.tocar('slotsWin', 1.0), 500);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 300, 100, 500, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#f1c40f', '#ffffff'], particleCount: 300, spread: 160});
            if(typeof mostrarToast === 'function') mostrarToast(`TELA CHEIA! MEGA BIG WIN! +${lucro}💰`, "🐯");
        } else {
            // Pagamento normal de linha
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 400]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#d35400'], particleCount: 100});
            if(typeof mostrarToast === 'function') mostrarToast(`BIG WIN! +${lucro}💰`, "🎉");
        }
    } else {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
    }

    setTimeout(() => {
        motorTigrinho.girando = false;
        const btn = document.getElementById('btn-tigrinho-girar');
        if(btn) { btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }

        // Se estiver no Modo Auto e não for a Carta da Sorte travando, roda de novo
        if (motorTigrinho.modoAuto && !motorTigrinho.modoCartaSorte) {
            motorTigrinho.loopAuto = setTimeout(window.girarTigrinho, 1500);
        }
    }, 2000);
}

function limparVitoriasTigrinho() {
    Array.from(document.querySelectorAll('.tigrinho-celula')).forEach(cel => {
        cel.classList.remove('tigrinho-celula-vitoria');
    });
}

// // ============================================================================
// 🚪 ROTEADOR GERAL: ARENA CONEXÃO (CORRIGIDO PARA A NOVA ERA)
// ============================================================================
if (typeof window.roteadorCapturado === 'undefined') {
    window.originalAbrirMesa = window.abrirMesaCassino;
    window.roteadorCapturado = true;
}

window.abrirMesaCassino = function(nomeDoJogo) {
    // 1. Esconde todas as mesas abertas
    document.querySelectorAll('[id^="mesa-"]').forEach(m => { 
        m.classList.add('escondido'); m.style.display = 'none'; 
    });
    
    if (nomeDoJogo === 'bj-coop') {
        const mesa = document.getElementById('mesa-bj-coop');
        if(mesa) { mesa.classList.remove('escondido'); mesa.style.display = 'flex'; }
        if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
        if(typeof iniciarOuvinteBlackjack === 'function') iniciarOuvinteBlackjack();
        return; 
    }

    let idMesa = nomeDoJogo.toLowerCase();
    
    // 🚨 AQUI ESTAVA O VILÃO! 
    // Removemos a regra antiga que confundia "dadosmentiroso" com o "craps".
    // Agora as rotas são precisas e não sequestram palavras semelhantes.
    
    if (idMesa.includes('roleta') && !idMesa.includes('multi')) idMesa = 'roleta-multi';
    if (idMesa.includes('poker') && !idMesa.includes('carib')) idMesa = 'poker';
    if (idMesa === 'craps') idMesa = 'craps'; // Rota exata, sem "includes('dados')"
    if (idMesa.includes('sic') || idMesa.includes('trindade')) idMesa = 'sicbo';
    if (idMesa.includes('baccarat') || idMesa.includes('bacara')) idMesa = 'baccarat';
    if (idMesa.includes('carib')) idMesa = 'carib';
    if (idMesa.includes('paigow') || idMesa.includes('pai')) idMesa = 'paigow';
    if (idMesa.includes('wheel') || idMesa.includes('fortuna')) idMesa = 'wheel';
    if (idMesa.includes('bridge') || idMesa.includes('ponte')) idMesa = 'bridge';

    // 2. Abre a mesa correta
    const mesa = document.getElementById('mesa-' + idMesa);
    if(mesa) { 
        mesa.classList.remove('escondido'); 
        mesa.style.display = 'flex'; 
    }
    
    if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();

    // 3. Dá a ignição no motor multiplayer correto
    if (idMesa === 'uno' && typeof iniciarOuvinteUno === 'function') iniciarOuvinteUno();
    else if (idMesa === 'poker' && typeof iniciarOuvintePoker === 'function') iniciarOuvintePoker();
    else if (idMesa === 'roleta-multi' && typeof iniciarOuvinteRoletaMulti === 'function') iniciarOuvinteRoletaMulti();
    else if (idMesa === 'craps' && typeof iniciarOuvinteCraps === 'function') iniciarOuvinteCraps();
    else if (idMesa === 'sicbo' && typeof iniciarOuvinteSicBo === 'function') iniciarOuvinteSicBo();
    else if (idMesa === 'baccarat' && typeof iniciarOuvinteBaccarat === 'function') iniciarOuvinteBaccarat();
    else if (idMesa === 'carib' && typeof iniciarOuvinteCarib === 'function') iniciarOuvinteCarib();
    else if (idMesa === 'paigow' && typeof iniciarOuvintePaiGow === 'function') iniciarOuvintePaiGow();
    else if (idMesa === 'wheel' && typeof iniciarOuvinteWheel === 'function') iniciarOuvinteWheel();
    else if (idMesa === 'bridge' && typeof iniciarOuvinteBridge === 'function') iniciarOuvinteBridge();
    else if (idMesa === 'duelo21' && typeof iniciarOuvinteDuelo21 === 'function') iniciarOuvinteDuelo21();
    else if (idMesa === 'dadosmentiroso' && typeof iniciarOuvinteDadosMentiroso === 'function') iniciarOuvinteDadosMentiroso();
    
    else if (typeof window.originalAbrirMesa === 'function') window.originalAbrirMesa(nomeDoJogo);
};

// ==========================================
// 🧭 NAVEGAÇÃO EXCLUSIVA DO CASSINO A DOIS
// ==========================================

window.fecharMesaCassinoDois = function(idMesa) {
    const mesa = document.getElementById('mesa-' + idMesa);
    if (mesa) {
        mesa.style.display = 'none';
        mesa.classList.add('escondido');
    }
    const vitrine = document.getElementById('overlay-cassino-dois');
    if (vitrine) {
        vitrine.style.display = 'flex';
        vitrine.classList.remove('escondido');
    }
};

window.fecharCassinoDois = function() {
    const vitrine = document.getElementById('overlay-cassino-dois');
    if (vitrine) {
        vitrine.style.display = 'none';
        vitrine.classList.add('escondido');
    }
};

// O Roteador Global que protege e abre as 3 únicas mesas do Cassino a Dois
if (typeof window.roteadorCapturado === 'undefined') {
    window.originalAbrirMesa = window.abrirMesaCassino;
    window.roteadorCapturado = true;
}

window.abrirMesaCassino = function(nomeDoJogo) {
    document.querySelectorAll('[id^="mesa-"]').forEach(m => { 
        m.classList.add('escondido'); m.style.display = 'none'; 
    });

    let idMesa = nomeDoJogo.toLowerCase();
    
    // 🚨 Vacina contra colisão de nomes:
    if (idMesa.includes('russa') || idMesa === 'roletarussa') idMesa = 'roletarussa';
    else if (idMesa.includes('roleta') && !idMesa.includes('multi')) idMesa = 'roleta-multi';

    const mesa = document.getElementById('mesa-' + idMesa);
    if(mesa) { 
        mesa.classList.remove('escondido'); 
        mesa.style.display = 'flex'; 
    }
    
    if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();

    // Redirecionamento blindado para os jogos
    if (idMesa === 'uno' && typeof iniciarOuvinteUno === 'function') iniciarOuvinteUno();
    else if (idMesa === 'duelo21' && typeof iniciarOuvinteDuelo21 === 'function') iniciarOuvinteDuelo21();
    else if (idMesa === 'dadosmentiroso' && typeof iniciarOuvinteDadosMentiroso === 'function') iniciarOuvinteDadosMentiroso();
    else if (idMesa === 'roletarussa' && typeof iniciarOuvinteRoletaRussa === 'function') iniciarOuvinteRoletaRussa();
    else if (idMesa === 'pontevidro' && typeof iniciarOuvintePonteVidro === 'function') iniciarOuvintePonteVidro();
    else if (idMesa === 'corrida' && typeof iniciarOuvinteCorrida === 'function') iniciarOuvinteCorrida();
    else if (idMesa === 'desarmebomba' && typeof iniciarOuvinteDesarmeBomba === 'function') iniciarOuvinteDesarmeBomba();
    // 🚨 IGNIÇÃO DO COLISEU DOS ELEMENTOS
    else if (idMesa === 'elementos' && typeof iniciarOuvinteElementos === 'function') iniciarOuvinteElementos();
    // 🚨 IGNIÇÃO DO CAÇA AO DIAMANTE
    else if (idMesa === 'cacadiamante' && typeof iniciarOuvinteCacaDiamante === 'function') iniciarOuvinteCacaDiamante();
    // 🚨 A IGNIÇÃO DO CHEFÃO FINAL
    else if (idMesa === 'sincroniacofre' && typeof iniciarOuvinteSincroniaCofre === 'function') iniciarOuvinteSincroniaCofre();
    // 🚨 A IGNIÇÃO DO NOVO CO-OP
    else if (idMesa === 'campominado' && typeof iniciarOuvinteCampoMinado === 'function') iniciarOuvinteCampoMinado();
    else if (idMesa === 'transmissao' && typeof iniciarOuvinteTransmissao === 'function') iniciarOuvinteTransmissao();
    else if (idMesa === 'reator' && typeof iniciarOuvinteReator === 'function') iniciarOuvinteReator();
    // Se for jogo Solo, passa o controle de volta
    else if (typeof window.originalAbrirMesa === 'function') window.originalAbrirMesa(nomeDoJogo);
};

// ============================================================================
// 🎴 MOTOR REAL-TIME: UNO CLASSIC ROYALE
// ============================================================================
window.motorUno = {
    jogando: false, meuId: '', parceiroId: '', turno: '', minhaMao: [],
    cartasOponente: 0, cartaDescarte: null, corAtual: '', pote: 0,
    indexPendente: null, cartaPendente: null, vencedor: null, vitoriaComemorada: false
};

const somHeartbeatUno = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somHeartbeatUno.loop = true;

window.iniciarOuvinteUno = function() {
    window.motorUno.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorUno.parceiroId = window.souJoao ? 'thamiris' : 'joao';
    const { db, ref, onValue, update } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/uno_royale`), async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        window.motorUno.jogando = true;
        window.motorUno.turno = data.turno;
        window.motorUno.cartaDescarte = data.descarte;
        window.motorUno.corAtual = data.corAtual;
        window.motorUno.pote = data.pote || 0;
        window.motorUno.vencedor = data.vencedor || null;
        window.motorUno.minhaMao = data.jogadores[window.motorUno.meuId]?.mao || [];
        window.motorUno.cartasOponente = data.jogadores[window.motorUno.parceiroId]?.qtdCartas || 0;

        if (window.motorUno.vencedor) {
            renderizarMesaUno();
            somHeartbeatUno.pause();
            if (window.motorUno.vencedor === window.motorUno.meuId && !window.motorUno.vitoriaComemorada) {
                window.motorUno.vitoriaComemorada = true;
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(window.motorUno.pote, `Vitória no UNO`);
                if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], particleCount: 300});
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            }
            return; 
        }

        if (data.ataquePendente && data.ataquePendente.alvo === window.motorUno.meuId) {
            for(let i = 0; i < data.ataquePendente.qtd; i++) {
                window.motorUno.minhaMao.push(gerarCartaUnoAleatoria());
            }
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
            const up = {};
            up[`cassino/uno_royale/jogadores/${window.motorUno.meuId}/mao`] = window.motorUno.minhaMao;
            up[`cassino/uno_royale/jogadores/${window.motorUno.meuId}/qtdCartas`] = window.motorUno.minhaMao.length;
            up[`cassino/uno_royale/ataquePendente`] = null; 
            await update(ref(db), up);
            return; 
        }

        renderizarMesaUno();
        avaliarTensaoUno(); 
    });
};

function formatarSimboloUno(valor) {
    if (valor === 'bloqueio') return '🚫';
    if (valor === 'inverte') return '🔄';
    if (valor === 'muda_cor') return '🎨';
    return valor;
}

function criarElementoCarta(simbolo) {
    return `<div class="uno-oval"><span class="uno-val">${simbolo}</span></div>`;
}

function renderizarMesaUno() {
    const indTurno = document.getElementById('uno-indicador-turno');
    const topoOponente = document.getElementById('uno-status-oponente');
    const visorPote = document.getElementById('uno-pote-valor');
    
    if (visorPote) visorPote.innerText = window.motorUno.pote;

    if (indTurno && topoOponente) {
        if (window.motorUno.vencedor) {
            indTurno.innerText = window.motorUno.vencedor === window.motorUno.meuId ? "VITÓRIA 🏆" : "DERROTA 💀";
            indTurno.style.color = window.motorUno.vencedor === window.motorUno.meuId ? "rgba(212, 175, 55, 0.15)" : "rgba(235, 77, 75, 0.15)";
        } else if (window.motorUno.turno === window.motorUno.meuId) {
            indTurno.innerText = "SUA VEZ";
            indTurno.style.color = "rgba(46, 204, 113, 0.08)";
        } else {
            indTurno.innerText = "OPONENTE";
            indTurno.style.color = "rgba(235, 77, 75, 0.08)";
        }
    }

    const descarte = document.getElementById('uno-descarte');
    if (descarte && window.motorUno.cartaDescarte) {
        descarte.className = `uno-card uno-${window.motorUno.corAtual} animacao-descarte`;
        descarte.innerHTML = criarElementoCarta(formatarSimboloUno(window.motorUno.cartaDescarte.valor));
    }

    const oponenteDiv = document.getElementById('uno-mao-oponente');
    if (oponenteDiv) {
        oponenteDiv.innerHTML = "";
        for (let i = 0; i < window.motorUno.cartasOponente; i++) {
            oponenteDiv.innerHTML += `<div class="uno-card-op"><div class="uno-oval-op"></div></div>`;
        }
    }

    const minhaMaoDiv = document.getElementById('uno-minha-mao');
    if (minhaMaoDiv) {
        minhaMaoDiv.innerHTML = "";
        window.motorUno.minhaMao.forEach((carta, index) => {
            let c = document.createElement('div');
            c.className = `uno-card uno-${carta.cor}`;
            c.innerHTML = criarElementoCarta(formatarSimboloUno(carta.valor));

            let podeJogar = false;
            if (window.motorUno.turno === window.motorUno.meuId && !window.motorUno.vencedor) {
                if (carta.cor === 'preto' || carta.cor === window.motorUno.corAtual || carta.valor === window.motorUno.cartaDescarte?.valor) {
                    podeJogar = true;
                    c.classList.add('uno-jogavel');
                }
            }

            c.onclick = () => {
                if (window.motorUno.vencedor) return;
                if (podeJogar) window.jogarCartaNoFirebase(carta, index);
            };
            minhaMaoDiv.appendChild(c);
        });
    }

    const btnGritar = document.getElementById('btn-uno-gritar');
    if (btnGritar) {
        if (window.motorUno.minhaMao.length === 1 && !window.motorUno.vencedor) {
            btnGritar.classList.remove('escondido');
            btnGritar.style.display = 'block';
        } else {
            btnGritar.classList.add('escondido');
            btnGritar.style.display = 'none';
        }
    }
}

function avaliarTensaoUno() {
    if (window.motorUno.vencedor) { somHeartbeatUno.pause(); return; }
    if (window.motorUno.cartasOponente === 1 || window.motorUno.minhaMao.length === 1) {
        if (!window.SantuarioSomPausado && somHeartbeatUno.paused) somHeartbeatUno.play().catch(e=>{});
    } else {
        somHeartbeatUno.pause();
    }
}

window.jogarCartaNoFirebase = function(carta, index) {
    if (window.motorUno.vencedor) return;
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.9);
    
    if (carta.cor === 'preto') {
        window.motorUno.indexPendente = index;
        window.motorUno.cartaPendente = carta;
        document.getElementById('uno-seletor-cor').classList.remove('escondido');
        return; 
    }
    processarJogada(carta, index, carta.cor);
};

window.escolherCorUno = function(corEscolhida) {
    document.getElementById('uno-seletor-cor').classList.add('escondido');
    processarJogada(window.motorUno.cartaPendente, window.motorUno.indexPendente, corEscolhida);
};

async function processarJogada(carta, index, corFinal) {
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    let novaMao = [...window.motorUno.minhaMao];
    novaMao.splice(index, 1);

    let proximoTurno = window.motorUno.parceiroId;
    if (carta.valor === 'bloqueio' || carta.valor === 'inverte' || carta.valor === '+2' || carta.valor === '+4') {
        proximoTurno = window.motorUno.meuId;
    }

    const updates = {};
    updates[`cassino/uno_royale/jogadores/${window.motorUno.meuId}/mao`] = novaMao;
    updates[`cassino/uno_royale/jogadores/${window.motorUno.meuId}/qtdCartas`] = novaMao.length;
    updates[`cassino/uno_royale/descarte`] = carta;
    updates[`cassino/uno_royale/corAtual`] = corFinal;
    updates[`cassino/uno_royale/turno`] = proximoTurno;

    if (carta.valor === '+2' || carta.valor === '+4') {
        updates[`cassino/uno_royale/ataquePendente`] = { alvo: window.motorUno.parceiroId, qtd: carta.valor === '+4' ? 4 : 2 };
    }

    if (novaMao.length === 0) updates[`cassino/uno_royale/vencedor`] = window.motorUno.meuId;

    await update(ref(db), updates);
}

window.gritarUnoAction = function() {
    document.getElementById('btn-uno-gritar').style.display = 'none';
    if(typeof confetti === 'function') confetti({colors: ['#eb4d4b', '#f1c40f'], particleCount: 150});
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 0.8);
};

function gerarCartaUnoAleatoria() {
    const cores = ['vermelho', 'azul', 'verde', 'amarelo'];
    const valores = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'inverte', 'bloqueio'];
    
    if (Math.random() < 0.08) return { cor: 'preto', valor: Math.random() > 0.5 ? '+4' : 'muda_cor' };
    return { cor: cores[Math.floor(Math.random() * cores.length)], valor: valores[Math.floor(Math.random() * valores.length)] };
}

window.comprarCartaUno = async function() {
    if (window.motorUno.vencedor || window.motorUno.turno !== window.motorUno.meuId) return;
    window.motorUno.minhaMao.push(gerarCartaUnoAleatoria());
    
    const { db, ref, update } = window.SantuarioApp.modulos;
    const updates = {};
    updates[`cassino/uno_royale/jogadores/${window.motorUno.meuId}/mao`] = window.motorUno.minhaMao;
    updates[`cassino/uno_royale/jogadores/${window.motorUno.meuId}/qtdCartas`] = window.motorUno.minhaMao.length;
    updates[`cassino/uno_royale/turno`] = window.motorUno.parceiroId; 

    await update(ref(db), updates);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
};

window.iniciarDueloUno = async function() {
    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-100, "Inscrição: Duelo UNO Royale");
    
    window.motorUno.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorUno.parceiroId = window.souJoao ? 'thamiris' : 'joao';
    window.motorUno.vitoriaComemorada = false; 

    const { db, ref, update } = window.SantuarioApp.modulos;
    
    let maoJoao = []; let maoThamiris = [];
    for(let i = 0; i < 7; i++) { maoJoao.push(gerarCartaUnoAleatoria()); maoThamiris.push(gerarCartaUnoAleatoria()); }

    let prim = gerarCartaUnoAleatoria();
    while(prim.cor === 'preto') prim = gerarCartaUnoAleatoria();

    await update(ref(db), {
        'cassino/uno_royale': {
            turno: window.motorUno.meuId,
            descarte: prim, corAtual: prim.cor, pote: 500, ataquePendente: null, vencedor: null,
            jogadores: { joao: { mao: maoJoao, qtdCartas: 7 }, thamiris: { mao: maoThamiris, qtdCartas: 7 } }
        }
    });
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
};

// ==========================================
// 🩸 MOTOR REAL-TIME: DUELO DE 21
// ==========================================
window.motorDuelo21 = {
    meuId: '', parceiroId: '', status: 'apostando', turno: '', pote: 0, vencedor: null, vitoriaComemorada: false, quemFinalizou: '',
    prontos: { joao: false, thamiris: false },
    apostas: { joao: 0, thamiris: 0 },
    baralho: [],
    jogadores: { joao: { mao: [], status: 'jogando' }, thamiris: { mao: [], status: 'jogando' } }
};

window.iniciarOuvinteDuelo21 = function() {
    window.motorDuelo21.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorDuelo21.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/duelo21_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorDuelo21.status = data.status || 'apostando';
            window.motorDuelo21.turno = data.turno || '';
            window.motorDuelo21.pote = Number(data.pote) || 0;
            window.motorDuelo21.vencedor = data.vencedor || null;
            window.motorDuelo21.quemFinalizou = data.quemFinalizou || '';
            window.motorDuelo21.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorDuelo21.apostas = data.apostas || { joao: 0, thamiris: 0 };
            window.motorDuelo21.baralho = JSON.parse(data.baralho || "[]");

            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            window.motorDuelo21.jogadores = {
                joao: { status: jInfo.status || 'jogando', mao: JSON.parse(jInfo.mao || "[]") },
                thamiris: { status: tInfo.status || 'jogando', mao: JSON.parse(tInfo.mao || "[]") }
            };

            renderizarMesaDuelo21();

            if (window.motorDuelo21.status === 'resultado' && !window.motorDuelo21.vitoriaComemorada) {
                window.motorDuelo21.vitoriaComemorada = true;
                processarFimDuelo21();
            }
        } catch (e) { }
    });
};

function calcularPontosDuelo21(mao) {
    if (!mao || !Array.isArray(mao)) return 0;
    let soma = 0; let ases = 0;
    mao.forEach(c => {
        if (c && c.valor === 'A') { soma += 11; ases += 1; }
        else if (c && ['J', 'Q', 'K'].includes(c.valor)) { soma += 10; }
        else if (c && c.valor) { soma += parseInt(c.valor) || 0; }
    });
    while (soma > 21 && ases > 0) { soma -= 10; ases -= 1; }
    return soma;
}

function criarBaralhoDuelo21() {
    const naipes = ['♥️', '♦️', '♣️', '♠️'];
    const valores = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let baralho = [];
    for(let n of naipes) {
        for(let v of valores) {
            baralho.push({ naipe: n, valor: v, cor: (n==='♥️'||n==='♦️') ? 'poker-red' : 'poker-black' });
        }
    }
    return baralho.sort(() => Math.random() - 0.5);
}

function criarDivCartaDuelo21(carta, oculta = false) {
    if (oculta) return `<div class="poker-card-back animacao-distribuir" style="width: 55px; height: 80px;"></div>`;
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="width: 55px; height: 80px; font-size: 0.9em;">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro" style="font-size: 1.8rem;">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

window.ajustarApostaDuelo21 = function(delta) {
    if (window.motorDuelo21.status !== 'apostando') return;
    if (window.motorDuelo21.prontos[window.motorDuelo21.meuId]) return; 
    
    let visor = document.getElementById('duelo21-valor-aposta');
    let atual = Number(visor.innerText) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    visor.innerText = novoValor;
    let apostaOponente = window.motorDuelo21.apostas[window.motorDuelo21.parceiroId] || 0;
    document.getElementById('duelo21-pote-valor').innerText = novoValor + apostaOponente;

    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarDuelo21 = async function() {
    if (window.motorDuelo21.status !== 'apostando') return;
    if (window.motorDuelo21.prontos[window.motorDuelo21.meuId]) return;

    let minhaAposta = Number(document.getElementById('duelo21-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const dueloRef = ref(db, `cassino/duelo21_royale`);

    let meusProntos = { ...window.motorDuelo21.prontos };
    meusProntos[window.motorDuelo21.meuId] = true;

    let minhasApostas = { ...window.motorDuelo21.apostas };
    minhasApostas[window.motorDuelo21.meuId] = minhaAposta;

    if (meusProntos[window.motorDuelo21.parceiroId] === true) {
        let poteTotal = minhasApostas.joao + minhasApostas.thamiris;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-poteTotal, `Pote do Duelo 21`);

        let baralho = criarBaralhoDuelo21(); 
        let maoJoao = [baralho.pop(), baralho.pop()];
        let maoThamiris = [baralho.pop(), baralho.pop()];

        let stJoao = calcularPontosDuelo21(maoJoao) === 21 ? 'blackjack' : 'jogando';
        let stThamiris = calcularPontosDuelo21(maoThamiris) === 21 ? 'blackjack' : 'jogando';
        let quemComeca = Math.random() > 0.5 ? 'joao' : 'thamiris';
        
        let statusGeral = 'jogando';
        let quemFim = '';
        if (stJoao === 'blackjack' || stThamiris === 'blackjack') {
            statusGeral = 'resultado';
            quemFim = window.motorDuelo21.meuId;
        }

        await update(dueloRef, {
            status: statusGeral, turno: quemComeca, apostas: minhasApostas, pote: poteTotal,
            vencedor: null, quemFinalizou: quemFim, baralho: JSON.stringify(baralho),
            jogadores: {
                joao: { mao: JSON.stringify(maoJoao), status: stJoao },
                thamiris: { mao: JSON.stringify(maoThamiris), status: stThamiris }
            },
            prontos: { joao: false, thamiris: false }
        });
        
        window.motorDuelo21.status = statusGeral;
        renderizarMesaDuelo21();
    } else {
        await update(dueloRef, { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
        window.motorDuelo21.prontos = meusProntos;
        renderizarMesaDuelo21();
    }
};

window.acaoDuelo21 = async function(acao) {
    if (window.motorDuelo21.status !== 'jogando') return;
    if (window.motorDuelo21.turno !== window.motorDuelo21.meuId) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    
    let eu = window.motorDuelo21.jogadores[window.motorDuelo21.meuId];
    let minhaMao = [...(eu.mao || [])];
    let baralho = [...(window.motorDuelo21.baralho || [])];
    let meuStatus = eu.status;
    let proxTurno = window.motorDuelo21.parceiroId;

    if (acao === 'comprar' && baralho.length > 0) {
        minhaMao.push(baralho.pop());
        let pts = calcularPontosDuelo21(minhaMao);
        if (pts > 21) meuStatus = 'estourou';
        else if (pts === 21) meuStatus = 'parou';
        else proxTurno = window.motorDuelo21.meuId; 
    } else if (acao === 'parar') {
        meuStatus = 'parou';
    }

    let opStatus = window.motorDuelo21.jogadores[window.motorDuelo21.parceiroId].status;
    if (opStatus !== 'jogando' && proxTurno === window.motorDuelo21.parceiroId) {
        proxTurno = 'fim'; 
    }

    up[`cassino/duelo21_royale/jogadores/${window.motorDuelo21.meuId}/mao`] = JSON.stringify(minhaMao);
    up[`cassino/duelo21_royale/jogadores/${window.motorDuelo21.meuId}/status`] = meuStatus;
    up[`cassino/duelo21_royale/baralho`] = JSON.stringify(baralho);
    
    if (proxTurno === 'fim' || meuStatus === 'estourou') {
        up[`cassino/duelo21_royale/status`] = 'resultado';
        up[`cassino/duelo21_royale/quemFinalizou`] = window.motorDuelo21.meuId;
    } else {
        up[`cassino/duelo21_royale/turno`] = proxTurno;
    }

    await update(ref(db), up);
};

window.processarFimDuelo21 = async function() {
    if (window.motorDuelo21.quemFinalizou !== window.motorDuelo21.meuId) return; 

    const { db, ref, set } = window.SantuarioApp.modulos;
    const jJoao = window.motorDuelo21.jogadores.joao;
    const jThamiris = window.motorDuelo21.jogadores.thamiris;
    const ptsJoao = calcularPontosDuelo21(jJoao.mao);
    const ptsThamiris = calcularPontosDuelo21(jThamiris.mao);

    let vencedor = 'empate';
    if (jJoao.status === 'estourou' && jThamiris.status !== 'estourou') vencedor = 'thamiris';
    else if (jThamiris.status === 'estourou' && jJoao.status !== 'estourou') vencedor = 'joao';
    else if (jJoao.status === 'estourou' && jThamiris.status === 'estourou') vencedor = 'empate'; 
    else if (ptsJoao > ptsThamiris) vencedor = 'joao';
    else if (ptsThamiris > ptsJoao) vencedor = 'thamiris';
    
    await set(ref(db, `cassino/duelo21_royale/vencedor`), vencedor);
};

window.renderizarMesaDuelo21 = function() {
    const duel = window.motorDuelo21;
    const painelAposta = document.getElementById('duelo21-painel-aposta');
    const painelAcao = document.getElementById('duelo21-painel-acao');
    const painelResultado = document.getElementById('duelo21-painel-resultado'); 
    const avisoCentro = document.getElementById('duelo21-aviso-centro');

    const eu = duel.jogadores[duel.meuId];
    const op = duel.jogadores[duel.parceiroId];

    // 🚨 Cálculo Dinâmico do Pote na Interface
    let minhaAposta = Number(document.getElementById('duelo21-valor-aposta').innerText) || 50;
    let apostaParceiro = duel.apostas[duel.parceiroId] || 0;
    document.getElementById('duelo21-pote-valor').innerText = duel.status === 'apostando' ? (minhaAposta + apostaParceiro) : duel.pote;

    if (duel.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        if(painelResultado) painelResultado.classList.add('escondido');

        if(avisoCentro) { avisoCentro.innerText = "Aguardando Desafio..."; avisoCentro.style.color = "#f1c40f"; }
        
        const btnInic = painelAposta ? painelAposta.querySelector('button:last-child') : null;
        if (btnInic) {
            if (duel.prontos[duel.meuId]) {
                btnInic.innerText = "ESPERANDO RIVAL... ⏳"; btnInic.style.background = "#555";
            } else {
                btnInic.innerText = "APOSTAR E DESAFIAR ⚔️"; btnInic.style.background = "linear-gradient(145deg, #e74c3c, #c0392b)";
            }
        }
        return; 
    }

    if(painelAposta) painelAposta.classList.add('escondido');

    const divMinhaMao = document.getElementById('duelo21-sua-mao');
    if (divMinhaMao && eu.mao) {
        divMinhaMao.innerHTML = '';
        eu.mao.forEach((c) => divMinhaMao.innerHTML += criarDivCartaDuelo21(c, false));
        document.getElementById('duelo21-sua-pontuacao').innerText = calcularPontosDuelo21(eu.mao);
    }

    const divMaoOponente = document.getElementById('duelo21-mao-oponente');
    const ptsOponente = document.getElementById('duelo21-oponente-pontuacao');
    
    if (divMaoOponente && op.mao) {
        divMaoOponente.innerHTML = '';
        if (duel.status === 'resultado') {
            op.mao.forEach((c) => divMaoOponente.innerHTML += criarDivCartaDuelo21(c, false));
            ptsOponente.innerText = calcularPontosDuelo21(op.mao);
        } else {
            divMaoOponente.innerHTML += criarDivCartaDuelo21(op.mao[0], true); 
            let cartasVisiveis = [];
            for (let i = 1; i < op.mao.length; i++) {
                divMaoOponente.innerHTML += criarDivCartaDuelo21(op.mao[i], false); 
                cartasVisiveis.push(op.mao[i]);
            }
            ptsOponente.innerText = calcularPontosDuelo21(cartasVisiveis) + " + ?";
        }
    }

    if (duel.status === 'jogando') {
        if(painelResultado) painelResultado.classList.add('escondido');
        
        if (eu.status === 'estourou') {
            if(avisoCentro) { avisoCentro.innerText = "💀 VOCÊ ESTOUROU!"; avisoCentro.style.color = "#e74c3c"; }
            if(painelAcao) painelAcao.classList.add('escondido');
        } else if (duel.turno === duel.meuId) {
            if(avisoCentro) { avisoCentro.innerText = "SUA VEZ! Compre ou Pare."; avisoCentro.style.color = "#2ecc71"; }
            if(painelAcao) painelAcao.classList.remove('escondido');
        } else {
            if(avisoCentro) { avisoCentro.innerText = "Turno da Adversária ⏳"; avisoCentro.style.color = "#f39c12"; }
            if(painelAcao) painelAcao.classList.add('escondido');
        }
    } 
    else if (duel.status === 'resultado') {
        if(painelAcao) painelAcao.classList.add('escondido');
        if(painelResultado) painelResultado.classList.remove('escondido'); 
        
        if (duel.vencedor) {
            if (duel.vencedor === duel.meuId) {
                if(avisoCentro) { avisoCentro.innerText = "🏆 VOCÊ VENCEU O DUELO!"; avisoCentro.style.color = "#2ecc71"; }
                if (duel.quemFinalizou === duel.meuId && !duel.moedasPagas) {
                    duel.moedasPagas = true;
                    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(duel.pote, `Vitória no Duelo 21`);
                    if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#ffffff'], particleCount: 300});
                }
            } else if (duel.vencedor === 'empate') {
                if(avisoCentro) { avisoCentro.innerText = "🤝 EMPATE! Pote devolvido."; avisoCentro.style.color = "#f1c40f"; }
                if (duel.quemFinalizou === duel.meuId && !duel.moedasPagas) {
                    duel.moedasPagas = true;
                    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(duel.pote, `Empate no Duelo 21`);
                }
            } else {
                if(avisoCentro) { avisoCentro.innerText = "🩸 VOCÊ FOI DERROTADO."; avisoCentro.style.color = "#e74c3c"; }
            }
        }
    }
};

window.resetarDuelo21 = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorDuelo21.moedasPagas = false;
    await set(ref(db, `cassino/duelo21_royale`), {
        status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', 
        prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 }
    });
};

// ==========================================
// 🎲 MOTOR REAL-TIME: DADOS DO MENTIROSO
// ==========================================

window.motorDadosMentiroso = {
    meuId: '', parceiroId: '', status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', moedasPagas: false, quemApostou: '', 
    prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
    jogadores: { joao: { dados: [], checou: false }, thamiris: { dados: [], checou: false } }
};

function safeParseDados(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') { try { return JSON.parse(val); } catch(e) { return []; } }
    return [];
}

window.iniciarOuvinteDadosMentiroso = function() {
    window.motorDadosMentiroso.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorDadosMentiroso.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/dados_mentiroso`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorDadosMentiroso.status = data.status || 'apostando';
            window.motorDadosMentiroso.turno = data.turno || '';
            window.motorDadosMentiroso.pote = Number(data.pote) || 0;
            window.motorDadosMentiroso.vencedor = data.vencedor || null;
            window.motorDadosMentiroso.quemFinalizou = data.quemFinalizou || '';
            window.motorDadosMentiroso.quemApostou = data.quemApostou || '';
            window.motorDadosMentiroso.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorDadosMentiroso.apostas = data.apostas || { joao: 0, thamiris: 0 };

            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            window.motorDadosMentiroso.jogadores = {
                joao: { checou: jInfo.checou || false, dados: safeParseDados(jInfo.dados) },
                thamiris: { checou: tInfo.checou || false, dados: safeParseDados(tInfo.dados) }
            };

            renderizarMesaDadosMentiroso();

            if (window.motorDadosMentiroso.status === 'resultado' && !window.motorDadosMentiroso.moedasPagas) {
                processarFimDadosMentiroso();
            }
        } catch (e) { }
    });
};

function rolar3Dados() { return [ Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1, Math.floor(Math.random() * 6) + 1 ]; }
function somaDados(dadosArr) { return (!dadosArr || dadosArr.length === 0) ? 0 : dadosArr.reduce((a, b) => a + b, 0); }

function criarDivDado(valor, oculto = false) {
    if (oculto) {
        return `<div style="width: 65px; height: 65px; background: linear-gradient(145deg, #1a0b2e, #0d041a); border: 2px solid rgba(155, 89, 182, 0.8); border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 0 15px rgba(155, 89, 182, 0.4); display: flex; justify-content: center; align-items: center; font-size: 2.8rem; color: #f1c40f; text-shadow: 0 0 15px rgba(241, 196, 15, 0.8); font-weight: 900; margin: 0 5px;">?</div>`;
    }
    const faces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    return `<div style="width: 65px; height: 65px; background: linear-gradient(145deg, #ffffff, #e0e0e0); border: 1px solid #fff; border-radius: 12px; box-shadow: 0 10px 20px rgba(0,0,0,0.6), inset 0 -5px 15px rgba(0,0,0,0.2), inset 0 5px 15px rgba(255,255,255,1); display: flex; justify-content: center; align-items: center; font-size: 4.5rem; color: #8e44ad; text-shadow: 0 3px 5px rgba(0,0,0,0.4); line-height: 1; margin: 0 5px; font-family: 'Segoe UI', Arial, sans-serif;">${faces[valor]}</div>`;
}

window.ajustarApostaDadosMentiroso = function(delta) {
    if (window.motorDadosMentiroso.status !== 'apostando') return;
    if (window.motorDadosMentiroso.prontos[window.motorDadosMentiroso.meuId]) return; 
    
    let visor = document.getElementById('dadosmentiroso-valor-aposta');
    let atual = Number(visor.innerText) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    visor.innerText = novoValor;
    let apostaOponente = window.motorDadosMentiroso.apostas[window.motorDadosMentiroso.parceiroId] || 0;
    document.getElementById('dadosmentiroso-pote-valor').innerText = novoValor + apostaOponente;

    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarDadosMentiroso = async function() {
    if (window.motorDadosMentiroso.status !== 'apostando') return;
    if (window.motorDadosMentiroso.prontos[window.motorDadosMentiroso.meuId]) return;

    let minhaAposta = Number(document.getElementById('dadosmentiroso-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/dados_mentiroso`);

    let meusProntos = { ...window.motorDadosMentiroso.prontos };
    meusProntos[window.motorDadosMentiroso.meuId] = true;

    let minhasApostas = { ...window.motorDadosMentiroso.apostas };
    minhasApostas[window.motorDadosMentiroso.meuId] = minhaAposta;

    if (meusProntos[window.motorDadosMentiroso.parceiroId] === true) {
        let poteTotal = minhasApostas.joao + minhasApostas.thamiris;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-poteTotal, `Pote dos Dados`);

        let dJoao = rolar3Dados(); let dThamiris = rolar3Dados();
        let quemComeca = Math.random() > 0.5 ? 'joao' : 'thamiris';

        await update(jogoRef, {
            status: 'jogando', turno: quemComeca, apostas: minhasApostas, pote: poteTotal,
            vencedor: null, quemFinalizou: '', quemApostou: '',
            jogadores: {
                joao: { dados: JSON.stringify(dJoao), checou: false },
                thamiris: { dados: JSON.stringify(dThamiris), checou: false }
            },
            prontos: { joao: false, thamiris: false }
        });
        
        window.motorDadosMentiroso.status = 'jogando';
        renderizarMesaDadosMentiroso();
    } else {
        await update(jogoRef, { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
        window.motorDadosMentiroso.prontos = meusProntos;
        renderizarMesaDadosMentiroso();
    }
};

window.acaoDadosMentiroso = async function(acao) {
    if (window.motorDadosMentiroso.status !== 'jogando') return;
    if (window.motorDadosMentiroso.turno !== window.motorDadosMentiroso.meuId) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    let jogo = window.motorDadosMentiroso;
    let proxTurno = jogo.parceiroId;

    if (acao === 'apostar') {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-50, `Blefe nos Dados`);
        up[`cassino/dados_mentiroso/pote`] = jogo.pote + 50;
        up[`cassino/dados_mentiroso/quemApostou`] = jogo.meuId;
        up[`cassino/dados_mentiroso/jogadores/${jogo.meuId}/checou`] = false;
        up[`cassino/dados_mentiroso/jogadores/${jogo.parceiroId}/checou`] = false; 
        up[`cassino/dados_mentiroso/turno`] = proxTurno;
    } 
    else if (acao === 'pagar') {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-50, `Call nos Dados`);
        up[`cassino/dados_mentiroso/pote`] = jogo.pote + 50;
        up[`cassino/dados_mentiroso/status`] = 'resultado';
        up[`cassino/dados_mentiroso/quemFinalizou`] = jogo.meuId;
    }
    else if (acao === 'fugir') {
        up[`cassino/dados_mentiroso/status`] = 'resultado';
        up[`cassino/dados_mentiroso/vencedor`] = jogo.parceiroId;
        up[`cassino/dados_mentiroso/quemFinalizou`] = jogo.meuId;
    }
    else if (acao === 'check') {
        let opChecou = jogo.jogadores[jogo.parceiroId].checou;
        if (opChecou) {
            up[`cassino/dados_mentiroso/status`] = 'resultado';
            up[`cassino/dados_mentiroso/quemFinalizou`] = jogo.meuId;
        } else {
            up[`cassino/dados_mentiroso/jogadores/${jogo.meuId}/checou`] = true;
            up[`cassino/dados_mentiroso/turno`] = proxTurno;
        }
    }

    await update(ref(db), up);
};

window.processarFimDadosMentiroso = async function() {
    if (window.motorDadosMentiroso.quemFinalizou !== window.motorDadosMentiroso.meuId) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    let jogo = window.motorDadosMentiroso;
    let vencedor = jogo.vencedor; 

    if (!vencedor) {
        let ptsJoao = somaDados(jogo.jogadores.joao.dados);
        let ptsThamiris = somaDados(jogo.jogadores.thamiris.dados);
        if (ptsJoao > ptsThamiris) vencedor = 'joao';
        else if (ptsThamiris > ptsJoao) vencedor = 'thamiris';
        else vencedor = 'empate';
    }
    await set(ref(db, `cassino/dados_mentiroso/vencedor`), vencedor);
};

window.renderizarMesaDadosMentiroso = function() {
    const jogo = window.motorDadosMentiroso;
    const painelAposta = document.getElementById('dadosmentiroso-painel-aposta');
    const painelAtaque = document.getElementById('dadosmentiroso-painel-ataque');
    const painelDefesa = document.getElementById('dadosmentiroso-painel-defesa');
    const painelResultado = document.getElementById('dadosmentiroso-painel-resultado');
    const avisoCentro = document.getElementById('dadosmentiroso-aviso-centro');

    const eu = jogo.jogadores[jogo.meuId];
    const op = jogo.jogadores[jogo.parceiroId];

    // 🚨 Cálculo Dinâmico do Pote
    let minhaAposta = Number(document.getElementById('dadosmentiroso-valor-aposta').innerText) || 50;
    let apostaParceiro = jogo.apostas[jogo.parceiroId] || 0;
    const visorPote = document.getElementById('dadosmentiroso-pote-valor');
    if (visorPote) visorPote.innerText = jogo.status === 'apostando' ? (minhaAposta + apostaParceiro) : jogo.pote;

    const divMinhaMao = document.getElementById('dadosmentiroso-sua-mao');
    if (divMinhaMao && eu.dados && eu.dados.length > 0) {
        divMinhaMao.innerHTML = eu.dados.map(v => criarDivDado(v, false)).join('');
        document.getElementById('dadosmentiroso-sua-pontuacao').innerText = somaDados(eu.dados);
    }

    const divMaoOponente = document.getElementById('dadosmentiroso-mao-oponente');
    if (divMaoOponente && op.dados && op.dados.length > 0) {
        if (jogo.status === 'resultado') {
            divMaoOponente.innerHTML = op.dados.map(v => criarDivDado(v, false)).join('');
        } else {
            divMaoOponente.innerHTML = op.dados.map(v => criarDivDado(v, true)).join('');
        }
    }

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelAtaque) painelAtaque.classList.add('escondido');
        if(painelDefesa) painelDefesa.classList.add('escondido');
        if(painelResultado) painelResultado.classList.add('escondido');

        if(avisoCentro) { avisoCentro.innerText = "Aguardando Oponente..."; avisoCentro.style.color = "#f1c40f"; }

        const btnInic = document.getElementById('btn-iniciar-dadosmentiroso');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "ESPERANDO RIVAL... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "APOSTAR E LANÇAR 🎲"; btnInic.style.background = "linear-gradient(145deg, #9b59b6, #8e44ad)"; }
        }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelResultado) painelResultado.classList.add('escondido');
        
        if (jogo.turno === jogo.meuId) {
            if(painelAtaque) painelAtaque.classList.add('escondido');
            if(painelDefesa) painelDefesa.classList.add('escondido');

            if (jogo.quemApostou === jogo.parceiroId) {
                if(avisoCentro) { avisoCentro.innerText = "O OPONENTE BLEFOU! Vai pagar para ver?"; avisoCentro.style.color = "#e74c3c"; }
                if(painelDefesa) painelDefesa.classList.remove('escondido');
            } else {
                if(avisoCentro) { avisoCentro.innerText = "SUA VEZ! Passe ou Blefe."; avisoCentro.style.color = "#2ecc71"; }
                if(painelAtaque) painelAtaque.classList.remove('escondido');
            }
        } else {
            if(painelAtaque) painelAtaque.classList.add('escondido');
            if(painelDefesa) painelDefesa.classList.add('escondido');
            if(avisoCentro) { avisoCentro.innerText = "Aguardando Decisão... ⏳"; avisoCentro.style.color = "#f39c12"; }
        }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAtaque) painelAtaque.classList.add('escondido');
        if(painelDefesa) painelDefesa.classList.add('escondido');
        if(painelResultado) painelResultado.classList.remove('escondido'); 
        
        if (jogo.vencedor) {
            if (jogo.vencedor === jogo.meuId) {
                if(avisoCentro) { avisoCentro.innerText = "🏆 VOCÊ VENCEU O BLEFE!"; avisoCentro.style.color = "#2ecc71"; }
                if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                    jogo.moedasPagas = true;
                    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(jogo.pote, `Vitória no Blefe`);
                    if(typeof confetti === 'function') confetti({colors: ['#9b59b6', '#ffffff'], particleCount: 300});
                }
            } else if (jogo.vencedor === 'empate') {
                if(avisoCentro) { avisoCentro.innerText = "🤝 EMPATE!"; avisoCentro.style.color = "#f1c40f"; }
                if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                    jogo.moedasPagas = true;
                    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(jogo.pote, `Empate no Blefe`);
                }
            } else {
                if(avisoCentro) { avisoCentro.innerText = "🩸 VOCÊ FOI ENGANADO."; avisoCentro.style.color = "#e74c3c"; }
            }
        }
    }
};

window.resetarDadosMentiroso = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorDadosMentiroso.moedasPagas = false;
    await set(ref(db, `cassino/dados_mentiroso`), {
        status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', quemApostou: '',
        prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 }
    });
};

// ==========================================
// 💣 MOTOR REAL-TIME: ROLETA RUSSA DO COFRE
// ==========================================

window.motorRoletaRussa = {
    meuId: '', parceiroId: '', status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', moedasPagas: false,
    prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
    grade: [], caixasAbertas: [], loots: { joao: 0, thamiris: 0 }
};

window.iniciarOuvinteRoletaRussa = function() {
    window.motorRoletaRussa.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorRoletaRussa.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    if (!window.roletaRussaResetadoNuclear) {
        window.roletaRussaResetadoNuclear = true;
        set(ref(db, `cassino/roleta_russa`), {
            status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', 
            prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
            grade: '[]', caixasAbertas: '[]', loots: { joao: 0, thamiris: 0 }
        });
    }

    onValue(ref(db, `cassino/roleta_russa`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};
            
            if (data.status === 'jogando' && !data.grade) { await resetarRoletaRussa(); return; }

            window.motorRoletaRussa.status = data.status || 'apostando';
            window.motorRoletaRussa.turno = data.turno || '';
            window.motorRoletaRussa.pote = Number(data.pote) || 0;
            window.motorRoletaRussa.vencedor = data.vencedor || null;
            window.motorRoletaRussa.quemFinalizou = data.quemFinalizou || '';
            window.motorRoletaRussa.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorRoletaRussa.apostas = data.apostas || { joao: 0, thamiris: 0 };
            
            window.motorRoletaRussa.grade = JSON.parse(data.grade || "[]");
            window.motorRoletaRussa.caixasAbertas = JSON.parse(data.caixasAbertas || "[]");
            
            let lj = data.loots?.joao || 0; let lt = data.loots?.thamiris || 0;
            window.motorRoletaRussa.loots = { joao: Number(lj), thamiris: Number(lt) };

            renderizarMesaRoletaRussa();

            if (window.motorRoletaRussa.status === 'resultado' && !window.motorRoletaRussa.moedasPagas) {
                processarFimRoletaRussa();
            }
        } catch (e) { }
    });
};

function gerarGradeRoletaRussa() {
    let g = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    return g.sort(() => Math.random() - 0.5);
}

function criarDivCaixa(index, conteudo, revelada) {
    if (!revelada) {
        return `<div onclick="clicarCaixaRoletaRussa(${index})" style="width: 100%; aspect-ratio: 1; background: linear-gradient(145deg, #1f1103, #0a0501); border: 2px solid rgba(243, 156, 18, 0.6); border-radius: 8px; box-shadow: 0 5px 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(243, 156, 18, 0.2); display: flex; justify-content: center; align-items: center; cursor: pointer; transition: transform 0.1s;"><span style="font-size: 1.5rem; opacity: 0.3;">📦</span></div>`;
    }
    if (conteudo === 1) return `<div style="width: 100%; aspect-ratio: 1; background: rgba(231, 76, 60, 0.3); border: 2px solid #e74c3c; border-radius: 8px; box-shadow: inset 0 0 20px rgba(231, 76, 60, 0.8), 0 0 20px rgba(231, 76, 60, 0.6); display: flex; justify-content: center; align-items: center; font-size: 2rem;">💣</div>`;
    return `<div style="width: 100%; aspect-ratio: 1; background: rgba(46, 204, 113, 0.2); border: 2px solid #2ecc71; border-radius: 8px; box-shadow: inset 0 0 15px rgba(46, 204, 113, 0.5); display: flex; justify-content: center; align-items: center; font-size: 2rem;">💎</div>`;
}

window.ajustarApostaRoletaRussa = function(delta) {
    if (window.motorRoletaRussa.status !== 'apostando') return;
    if (window.motorRoletaRussa.prontos[window.motorRoletaRussa.meuId]) return; 
    
    let visor = document.getElementById('roletarussa-valor-aposta');
    let atual = Number(visor.innerText) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    visor.innerText = novoValor;
    let apostaOponente = window.motorRoletaRussa.apostas[window.motorRoletaRussa.parceiroId] || 0;
    document.getElementById('roletarussa-pote-valor').innerText = novoValor + apostaOponente;

    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarRoletaRussa = async function() {
    let minhaAposta = Number(document.getElementById('roletarussa-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/roleta_russa`);

    let meusProntos = { ...window.motorRoletaRussa.prontos };
    meusProntos[window.motorRoletaRussa.meuId] = true;

    let minhasApostas = { ...window.motorRoletaRussa.apostas };
    minhasApostas[window.motorRoletaRussa.meuId] = minhaAposta;

    if (meusProntos[window.motorRoletaRussa.parceiroId] === true) {
        let poteTotal = minhasApostas.joao + minhasApostas.thamiris;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-poteTotal, `Entrada Roleta Russa`);
        
        let grade = gerarGradeRoletaRussa();
        let quemComeca = Math.random() > 0.5 ? 'joao' : 'thamiris';

        await update(jogoRef, {
            status: 'jogando', turno: quemComeca, apostas: minhasApostas, pote: poteTotal,
            vencedor: null, quemFinalizou: '', grade: JSON.stringify(grade), caixasAbertas: '[]',
            loots: { joao: 0, thamiris: 0 }, prontos: { joao: false, thamiris: false }
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(jogoRef, { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
    }
};

window.clicarCaixaRoletaRussa = async function(index) {
    if (window.motorRoletaRussa.status !== 'jogando') return;
    if (window.motorRoletaRussa.turno !== window.motorRoletaRussa.meuId) return;
    if (window.motorRoletaRussa.caixasAbertas.includes(index)) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {}; let jogo = window.motorRoletaRussa;
    let conteudo = jogo.grade[index];
    let abertas = [...jogo.caixasAbertas];
    abertas.push(index);
    up[`cassino/roleta_russa/caixasAbertas`] = JSON.stringify(abertas);

    if (conteudo === 1) {
        if (window.Haptics && navigator.vibrate) navigator.vibrate([300, 100, 400]);
        up[`cassino/roleta_russa/status`] = 'resultado';
        up[`cassino/roleta_russa/vencedor`] = jogo.parceiroId;
        up[`cassino/roleta_russa/quemFinalizou`] = jogo.meuId;
    } else {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
        if (window.Haptics && navigator.vibrate) navigator.vibrate(20);
        let meuLoot = jogo.loots[jogo.meuId] + 50;
        up[`cassino/roleta_russa/loots/${jogo.meuId}`] = meuLoot;
        up[`cassino/roleta_russa/turno`] = jogo.parceiroId;
    }
    await update(ref(db), up);
};

window.processarFimRoletaRussa = async function() {
    if (window.motorRoletaRussa.quemFinalizou !== window.motorRoletaRussa.meuId) return;
    let jogo = window.motorRoletaRussa;
    let saqueTotal = jogo.pote + jogo.loots.joao + jogo.loots.thamiris;
    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(saqueTotal, `Vitória Roleta Russa`);
};

window.renderizarMesaRoletaRussa = function() {
    const jogo = window.motorRoletaRussa;
    const painelAposta = document.getElementById('roletarussa-painel-aposta');
    const painelRes = document.getElementById('roletarussa-painel-resultado');
    const avisoCentro = document.getElementById('roletarussa-aviso-centro');
    const containerLoot = document.getElementById('roletarussa-seuloot-container');

    if (avisoCentro) { avisoCentro.style.textAlign = "center"; avisoCentro.style.lineHeight = "1.4"; }
    const artOponente = window.souJoao ? "A ADVERSÁRIA" : "O ADVERSÁRIO";
    const prepOponente = window.souJoao ? "A ADVERSÁRIA" : "O ADVERSÁRIO"; 
    const acaoOponente = window.souJoao ? "Adversária" : "Adversário";

    // 🚨 Cálculo Dinâmico do Pote
    let minhaAposta = Number(document.getElementById('roletarussa-valor-aposta').innerText) || 50;
    let apostaParceiro = jogo.apostas[jogo.parceiroId] || 0;
    document.getElementById('roletarussa-pote-valor').innerText = jogo.status === 'apostando' ? (minhaAposta + apostaParceiro) : jogo.pote;

    document.getElementById('roletarussa-loot-jogador').innerText = jogo.loots[jogo.meuId] || 0;
    document.getElementById('roletarussa-loot-oponente').innerText = jogo.loots[jogo.parceiroId] || 0;

    const gridDiv = document.getElementById('roletarussa-grade');
    if (gridDiv && jogo.grade.length > 0) {
        let html = '';
        for (let i = 0; i < 16; i++) {
            let isAberta = jogo.caixasAbertas.includes(i);
            if (jogo.status === 'resultado' && jogo.grade[i] === 1) isAberta = true; 
            html += criarDivCaixa(i, jogo.grade[i], isAberta);
        }
        gridDiv.innerHTML = html;
    } else if (gridDiv) {
        gridDiv.innerHTML = '';
        for (let i=0; i<16; i++) gridDiv.innerHTML += criarDivCaixa(i, 0, false);
    }

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(containerLoot) containerLoot.classList.add('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "Aguardando Oponente..."; avisoCentro.style.color = "#f1c40f"; }
        const btnInic = document.getElementById('btn-iniciar-roletarussa');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "ESPERANDO RIVAL... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "CRIAR TABULEIRO 💣"; btnInic.style.background = "linear-gradient(145deg, #f39c12, #d35400)"; }
        }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(containerLoot) containerLoot.classList.remove('escondido');

        if (jogo.turno === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = "SUA VEZ! Escolha uma caixa..."; avisoCentro.style.color = "#2ecc71"; }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `${acaoOponente} clicando... ⏳`; avisoCentro.style.color = "#f39c12"; }
        }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        
        if (jogo.vencedor === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = `🏆 ${artOponente} ACHOU A BOMBA!\nO SAQUE É TODO SEU!`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#f39c12', '#2ecc71'], particleCount: 300});
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `💥 CABUM! VOCÊ PERDEU TUDO\nPARA ${prepOponente}.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            }
        }
    }
};

window.resetarRoletaRussa = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorRoletaRussa.moedasPagas = false;
    await set(ref(db, `cassino/roleta_russa`), {
        status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', 
        prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
        grade: '[]', caixasAbertas: '[]', loots: { joao: 0, thamiris: 0 }
    });
};

// ==========================================
// 🧊 MOTOR REAL-TIME: A PONTE DE VIDRO (CO-OP)
// ==========================================

window.motorPonteVidro = {
    meuId: '', parceiroId: '', status: 'apostando', turno: '', 
    apostaAtual: 50, poteInicial: 0, vencedor: null, quemFinalizou: '', moedasPagas: false,
    prontos: { joao: false, thamiris: false },
    passoAtual: 0, caminhoSeguro: [], // Array de 10 passos (0=Esq, 1=Dir)
    multiplicadores: [1.2, 1.5, 2.0, 3.0, 5.0, 8.0, 12.0, 20.0, 50.0, 100.0]
};

window.iniciarOuvintePonteVidro = function() {
    window.motorPonteVidro.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorPonteVidro.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    // ☢️ RESET NUCLEAR AUTOMÁTICO ☢️
    if (!window.ponteVidroResetadoNuclear) {
        window.ponteVidroResetadoNuclear = true;
        set(ref(db, `cassino/ponte_vidro`), {
            status: 'apostando', turno: '', apostaAtual: 50, poteInicial: 0, 
            vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false },
            passoAtual: 0, caminhoSeguro: '[]'
        });
    }

    onValue(ref(db, `cassino/ponte_vidro`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};

            if (data.status === 'jogando' && !data.caminhoSeguro) {
                await resetarPonteVidro(); return;
            }

            window.motorPonteVidro.status = data.status || 'apostando';
            window.motorPonteVidro.turno = data.turno || '';
            window.motorPonteVidro.apostaAtual = Number(data.apostaAtual) || 50;
            window.motorPonteVidro.poteInicial = Number(data.poteInicial) || 0;
            window.motorPonteVidro.vencedor = data.vencedor || null;
            window.motorPonteVidro.quemFinalizou = data.quemFinalizou || '';
            window.motorPonteVidro.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorPonteVidro.passoAtual = Number(data.passoAtual) || 0;
            window.motorPonteVidro.caminhoSeguro = JSON.parse(data.caminhoSeguro || "[]");

            renderizarMesaPonteVidro();

            if (window.motorPonteVidro.status === 'resultado' && !window.motorPonteVidro.moedasPagas) {
                processarFimPonteVidro();
            }
        } catch (e) { console.error("Erro Ponte de Vidro", e); }
    });
};

function gerarCaminhoPonte() {
    let caminho = [];
    for (let i = 0; i < 10; i++) {
        caminho.push(Math.random() > 0.5 ? 1 : 0); // 0 = Esquerda Segura, 1 = Direita Segura
    }
    return caminho;
}

window.ajustarApostaPonteVidro = function(delta) {
    if (window.motorPonteVidro.status !== 'apostando') return;
    if (window.motorPonteVidro.prontos[window.motorPonteVidro.meuId]) return; 
    let atual = Number(window.motorPonteVidro.apostaAtual) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    window.motorPonteVidro.apostaAtual = novoValor;
    const visor = document.getElementById('pontevidro-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarPonteVidro = async function() {
    let aposta = Number(window.motorPonteVidro.apostaAtual) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/ponte_vidro`);

    let meusProntos = { ...window.motorPonteVidro.prontos };
    meusProntos[window.motorPonteVidro.meuId] = true;

    if (meusProntos[window.motorPonteVidro.parceiroId] === true) {
        // Cobra a aposta dos dois (Co-op)
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-(aposta * 2), `Entrada Ponte de Vidro`);
        
        let caminho = gerarCaminhoPonte();
        let quemComeca = Math.random() > 0.5 ? 'joao' : 'thamiris';

        await update(jogoRef, {
            status: 'jogando', turno: quemComeca, apostaAtual: aposta, poteInicial: aposta * 2,
            vencedor: null, quemFinalizou: '', passoAtual: 0, caminhoSeguro: JSON.stringify(caminho),
            prontos: { joao: false, thamiris: false }
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(jogoRef, { prontos: meusProntos, apostaAtual: aposta, status: 'apostando' });
    }
};

window.pisarPonteVidro = async function(escolha) {
    let jogo = window.motorPonteVidro;
    if (jogo.status !== 'jogando') return;
    if (jogo.turno !== jogo.meuId) {
        if(typeof mostrarToast === 'function') mostrarToast("Espere a sua vez de pisar!", "⏳");
        return;
    }

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    
    let passo = jogo.passoAtual;
    let vidroSeguro = jogo.caminhoSeguro[passo];
    
    const divEsq = document.getElementById('vidro-esquerdo');
    const divDir = document.getElementById('vidro-direito');

    if (escolha === vidroSeguro) {
        // SUCESSO!
        if (window.Haptics && navigator.vibrate) navigator.vibrate([20, 50, 20]);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
        
        let vidroAlvo = escolha === 0 ? divEsq : divDir;
        vidroAlvo.style.background = "linear-gradient(145deg, rgba(46,204,113,0.4), rgba(46,204,113,0.1))";
        vidroAlvo.style.borderColor = "#2ecc71";
        
        setTimeout(async () => {
            vidroAlvo.style.background = "linear-gradient(145deg, rgba(0,242,254,0.15), rgba(0,242,254,0.05))";
            vidroAlvo.style.borderColor = "rgba(0,242,254,0.6)";
            
            if (passo + 1 >= 10) {
                // ZERARAM A PONTE!
                up[`cassino/ponte_vidro/status`] = 'resultado';
                up[`cassino/ponte_vidro/vencedor`] = 'jogadores';
                up[`cassino/ponte_vidro/quemFinalizou`] = jogo.meuId;
            } else {
                // AVANÇA O PASSO E PASSA O TURNO PRO PARCEIRO (Co-op Pura)
                up[`cassino/ponte_vidro/passoAtual`] = passo + 1;
                up[`cassino/ponte_vidro/turno`] = jogo.parceiroId;
            }
            await update(ref(db), up);
        }, 600);

    } else {
        // QUEBROU! A QUEDA!
        if (window.Haptics && navigator.vibrate) navigator.vibrate([300, 100, 500]);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
        
        let vidroAlvo = escolha === 0 ? divEsq : divDir;
        vidroAlvo.style.background = "rgba(231, 76, 60, 0.4)";
        vidroAlvo.style.borderColor = "#e74c3c";
        vidroAlvo.innerHTML = "<span style='font-size: 3rem;'>💥</span>";
        
        setTimeout(async () => {
            up[`cassino/ponte_vidro/status`] = 'resultado';
            up[`cassino/ponte_vidro/vencedor`] = 'casa'; // A Casa ganhou (vocês perderam)
            up[`cassino/ponte_vidro/quemFinalizou`] = jogo.meuId;
            await update(ref(db), up);
        }, 800);
    }
};

window.sacarPonteVidro = async function() {
    let jogo = window.motorPonteVidro;
    if (jogo.status !== 'jogando' || jogo.turno !== jogo.meuId || jogo.passoAtual === 0) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    up[`cassino/ponte_vidro/status`] = 'resultado';
    up[`cassino/ponte_vidro/vencedor`] = 'saque'; 
    up[`cassino/ponte_vidro/quemFinalizou`] = jogo.meuId;
    await update(ref(db), up);
};

window.processarFimPonteVidro = async function() {
    if (window.motorPonteVidro.quemFinalizou !== window.motorPonteVidro.meuId) return;
    let jogo = window.motorPonteVidro;
    
    if (jogo.vencedor === 'jogadores' || jogo.vencedor === 'saque') {
        let multiAtual = jogo.passoAtual === 0 ? 1 : jogo.multiplicadores[jogo.passoAtual - 1];
        if (jogo.vencedor === 'jogadores') multiAtual = jogo.multiplicadores[9]; // ZEROU A PONTE
        
        let lucroGanho = Math.floor(jogo.poteInicial * multiAtual);
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(lucroGanho, `Sobrevivência na Ponte de Vidro (${multiAtual}x)`);
        }
    }
};

window.renderizarMesaPonteVidro = function() {
    const jogo = window.motorPonteVidro;
    const painelAposta = document.getElementById('pontevidro-painel-aposta');
    const painelRes = document.getElementById('pontevidro-painel-resultado');
    const painelAcao = document.getElementById('pontevidro-painel-acao');
    const areaVidros = document.getElementById('pontevidro-area-vidros');
    const avisoCentro = document.getElementById('pontevidro-aviso-centro');

    const acaoOponente = window.souJoao ? "Adversária" : "Adversário";
    
    if (avisoCentro) {
        avisoCentro.style.textAlign = "center";
        avisoCentro.style.lineHeight = "1.4";
    }

    // Status Superior
    let multiExibido = jogo.passoAtual === 0 ? 1.0 : jogo.multiplicadores[jogo.passoAtual - 1];
    if (jogo.status === 'resultado' && jogo.vencedor === 'jogadores') multiExibido = jogo.multiplicadores[9];
    
    document.getElementById('pontevidro-passo-texto').innerText = `${jogo.passoAtual} / 10`;
    document.getElementById('pontevidro-multiplicador').innerText = multiExibido.toFixed(1);
    document.getElementById('pontevidro-lucro-valor').innerText = Math.floor(jogo.poteInicial * multiExibido);

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        if(areaVidros) areaVidros.classList.add('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "Aguardando Oponente..."; avisoCentro.style.color = "#00f2fe"; }
        const btnInic = document.getElementById('btn-iniciar-pontevidro');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "ESPERANDO PARCEIRO... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "PAGAR E ENTRAR 🎟️"; btnInic.style.background = "linear-gradient(145deg, #00f2fe, #00a8cc)"; }
        }
        
        // Reseta os vidros
        const divEsq = document.getElementById('vidro-esquerdo');
        const divDir = document.getElementById('vidro-direito');
        if(divEsq) { divEsq.style.background = "linear-gradient(145deg, rgba(0,242,254,0.15), rgba(0,242,254,0.05))"; divEsq.style.borderColor = "rgba(0,242,254,0.6)"; divEsq.innerHTML = "<span style='font-size: 3rem; filter: drop-shadow(0 0 10px rgba(0,242,254,0.8));'>👈</span>"; }
        if(divDir) { divDir.style.background = "linear-gradient(145deg, rgba(0,242,254,0.15), rgba(0,242,254,0.05))"; divDir.style.borderColor = "rgba(0,242,254,0.6)"; divDir.innerHTML = "<span style='font-size: 3rem; filter: drop-shadow(0 0 10px rgba(0,242,254,0.8));'>👉</span>"; }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(areaVidros) areaVidros.classList.remove('escondido');

        if (jogo.turno === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = "SUA VEZ!\nEscolha o vidro seguro..."; avisoCentro.style.color = "#00f2fe"; }
            // Só mostra o botão de sacar se não for o primeiro passo
            if(painelAcao && jogo.passoAtual > 0) painelAcao.classList.remove('escondido');
            else if(painelAcao) painelAcao.classList.add('escondido');
        } else {
            if(avisoCentro) { avisoCentro.innerText = `O ${acaoOponente} está\nescolhendo o vidro... ⏳`; avisoCentro.style.color = "#f39c12"; }
            if(painelAcao) painelAcao.classList.add('escondido');
        }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        
        if (jogo.vencedor === 'jogadores') {
            if(avisoCentro) { avisoCentro.innerText = `🏆 VOCÊS ZERARAM A PONTE!\nO MULTIPLICADOR MÁXIMO É DE VOCÊS!`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#00f2fe', '#ffffff'], particleCount: 400});
            }
        } else if (jogo.vencedor === 'saque') {
            if(avisoCentro) { avisoCentro.innerText = `💰 FUGIRAM COM O LUCRO!\nVocês sacaram ${Math.floor(jogo.poteInicial * multiExibido)} moedas.`; avisoCentro.style.color = "#f1c40f"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 1.0);
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `💥 O VIDRO QUEBROU!\nVocês caíram e perderam o pote.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            }
        }
    }
};

window.resetarPonteVidro = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorPonteVidro.moedasPagas = false;
    await set(ref(db, `cassino/ponte_vidro`), {
        status: 'apostando', turno: '', apostaAtual: window.motorPonteVidro.apostaAtual, poteInicial: 0, 
        vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false },
        passoAtual: 0, caminhoSeguro: '[]'
    });
};

// ==========================================
// 🧨 MOTOR REAL-TIME: DESARME A BOMBA EXTREMO
// ==========================================

window.motorDesarmeBomba = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAtual: 50, pote: 0, 
    vencedor: null, quemFinalizou: '', moedasPagas: false, prontos: { joao: false, thamiris: false },
    desarmador: '', regrasManual: [], luzAtual: '', serialNumber: 0, 
    fioCorreto: '[]', fiosCortados: 0, listaFiosCortados: '[]', endTime: 0
};

window.intervaloBombaTimer = null;

window.iniciarOuvinteDesarmeBomba = function() {
    window.motorDesarmeBomba.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorDesarmeBomba.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    // Reset Nuclear
    if (!window.desarmeBombaResetadoNuclear) {
        window.desarmeBombaResetadoNuclear = true;
        set(ref(db, `cassino/desarme_bomba`), {
            status: 'apostando', apostaAtual: 50, pote: 0, vencedor: null, quemFinalizou: '', 
            prontos: { joao: false, thamiris: false }
        });
    }

    onValue(ref(db, `cassino/desarme_bomba`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};

            if (data.status === 'jogando' && !data.desarmador) {
                await resetarDesarmeBomba(); return;
            }

            window.motorDesarmeBomba.status = data.status || 'apostando';
            window.motorDesarmeBomba.apostaAtual = Number(data.apostaAtual) || 50;
            window.motorDesarmeBomba.pote = Number(data.pote) || 0;
            window.motorDesarmeBomba.vencedor = data.vencedor || null;
            window.motorDesarmeBomba.quemFinalizou = data.quemFinalizou || '';
            window.motorDesarmeBomba.prontos = data.prontos || { joao: false, thamiris: false };
            
            window.motorDesarmeBomba.desarmador = data.desarmador || '';
            window.motorDesarmeBomba.luzAtual = data.luzAtual || '';
            window.motorDesarmeBomba.serialNumber = Number(data.serialNumber) || 0;
            
            window.motorDesarmeBomba.fioCorreto = data.fioCorreto || '[]';
            window.motorDesarmeBomba.fiosCortados = Number(data.fiosCortados) || 0;
            window.motorDesarmeBomba.listaFiosCortados = data.listaFiosCortados || '[]';
            
            window.motorDesarmeBomba.endTime = Number(data.endTime) || 0;
            window.motorDesarmeBomba.regrasManual = JSON.parse(data.regrasManual || "[]");

            renderizarMesaDesarmeBomba();
            gerenciarRelogioBomba();

            if (window.motorDesarmeBomba.status === 'resultado' && !window.motorDesarmeBomba.moedasPagas) {
                processarFimDesarmeBomba();
            }
        } catch (e) { console.error("Erro na Bomba", e); }
    });
};

function obterFioAleatorio() {
    let fios = ['vermelho', 'azul', 'verde', 'amarelo'];
    return fios[Math.floor(Math.random() * fios.length)];
}

function gerarRegrasBombaExtrema() {
    let luzes = [
        { cor: 'vermelho', hex: '#ff4757', nome: 'VERMELHA 🔴' },
        { cor: 'azul', hex: '#3498db', nome: 'AZUL 🔵' },
        { cor: 'verde', hex: '#2ecc71', nome: 'VERDE 🟢' },
        { cor: 'amarelo', hex: '#f1c40f', nome: 'AMARELA 🟡' }
    ];
    let regras = [];
    
    for(let i=0; i<4; i++) {
        let seqPar = [obterFioAleatorio(), obterFioAleatorio()];
        while(seqPar[0] === seqPar[1]) seqPar[1] = obterFioAleatorio(); // Impede dois iguais seguidos

        let seqImpar = [obterFioAleatorio(), obterFioAleatorio()];
        while(seqImpar[0] === seqImpar[1]) seqImpar[1] = obterFioAleatorio();

        regras.push({ luzObj: luzes[i], seqPar: seqPar, seqImpar: seqImpar });
    }
    return regras.sort(() => Math.random() - 0.5);
}

window.ajustarApostaDesarmeBomba = function(delta) {
    if (window.motorDesarmeBomba.status !== 'apostando') return;
    if (window.motorDesarmeBomba.prontos[window.motorDesarmeBomba.meuId]) return; 
    let novoValor = (Number(window.motorDesarmeBomba.apostaAtual) || 50) + delta;
    if (novoValor < 10) novoValor = 10;
    window.motorDesarmeBomba.apostaAtual = novoValor;
    const visor = document.getElementById('desarmebomba-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarDesarmeBomba = async function() {
    let aposta = Number(window.motorDesarmeBomba.apostaAtual) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/desarme_bomba`);

    let meusProntos = { ...window.motorDesarmeBomba.prontos };
    meusProntos[window.motorDesarmeBomba.meuId] = true;

    if (meusProntos[window.motorDesarmeBomba.parceiroId] === true) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-(aposta * 2), `Missão C-4 Extrema`);
        
        let regras = gerarRegrasBombaExtrema();
        let regraSorteada = regras[Math.floor(Math.random() * regras.length)];
        
        // Gera um Serial Number de 3 dígitos
        let serialNum = Math.floor(Math.random() * 899) + 100; 
        let isPar = (serialNum % 2 === 0);
        
        // Define qual é a sequência real que deve ser cortada!
        let seqCorreta = isPar ? regraSorteada.seqPar : regraSorteada.seqImpar;

        let quemDesarma = Math.random() > 0.5 ? 'joao' : 'thamiris';
        let tempoFinal = Date.now() + (25 * 1000); // 🚨 EXATOS 25 SEGUNDOS DE TENSÃO!

        await update(jogoRef, {
            status: 'jogando', apostaAtual: aposta, pote: aposta * 2,
            vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false },
            desarmador: quemDesarma, luzAtual: JSON.stringify(regraSorteada.luzObj), 
            serialNumber: serialNum, fioCorreto: JSON.stringify(seqCorreta), 
            fiosCortados: 0, listaFiosCortados: '[]',
            regrasManual: JSON.stringify(regras), endTime: tempoFinal
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(jogoRef, { prontos: meusProntos, apostaAtual: aposta, status: 'apostando' });
    }
};

function gerenciarRelogioBomba() {
    if (window.motorDesarmeBomba.status !== 'jogando') {
        if (window.intervaloBombaTimer) clearInterval(window.intervaloBombaTimer);
        return;
    }
    
    if (window.intervaloBombaTimer) clearInterval(window.intervaloBombaTimer);
    
    const timerUI = document.getElementById('desarmebomba-timer');
    const dbMods = window.SantuarioApp.modulos;
    
    window.intervaloBombaTimer = setInterval(async () => {
        let agora = Date.now();
        let faltam = Math.ceil((window.motorDesarmeBomba.endTime - agora) / 1000);
        
        if (faltam <= 0) {
            faltam = 0;
            clearInterval(window.intervaloBombaTimer);
            if (timerUI) timerUI.innerText = "00:00";
            
            // Só o Desarmador explode a bomba para evitar chamadas duplas no banco
            if (window.motorDesarmeBomba.meuId === window.motorDesarmeBomba.desarmador && window.motorDesarmeBomba.status === 'jogando') {
                await dbMods.update(dbMods.ref(dbMods.db), {
                    [`cassino/desarme_bomba/status`]: 'resultado',
                    [`cassino/desarme_bomba/vencedor`]: 'casa', // BOOM!
                    [`cassino/desarme_bomba/quemFinalizou`]: window.motorDesarmeBomba.meuId
                });
            }
        } else {
            if (timerUI) {
                timerUI.innerText = faltam >= 10 ? `00:${faltam}` : `00:0${faltam}`;
                timerUI.style.color = faltam <= 10 ? '#ff4757' : '#2ecc71';
            }
            // Batimento cardíaco tátil nos últimos 5 segundos
            if (faltam <= 5 && window.Haptics && navigator.vibrate) navigator.vibrate(50);
        }
    }, 1000);
}

window.cortarFioBomba = async function(corCortada) {
    let jogo = window.motorDesarmeBomba;
    if (jogo.status !== 'jogando' || jogo.meuId !== jogo.desarmador) return;

    let listaJaCortados = JSON.parse(jogo.listaFiosCortados || "[]");
    if (listaJaCortados.includes(corCortada)) return; // Fio já foi cortado, não faz nada!

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    
    let seqCorreta = JSON.parse(jogo.fioCorreto || "[]");
    let indexAtual = jogo.fiosCortados || 0;

    if (corCortada === seqCorreta[indexAtual]) {
        // ACERTOU O FIO DO PASSO ATUAL!
        if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.5);
        
        listaJaCortados.push(corCortada);
        up[`cassino/desarme_bomba/listaFiosCortados`] = JSON.stringify(listaJaCortados);
        
        let proximoIndex = indexAtual + 1;
        if (proximoIndex === seqCorreta.length) {
            // CORTOU A SEQUÊNCIA INTEIRA COM SUCESSO!
            up[`cassino/desarme_bomba/status`] = 'resultado';
            up[`cassino/desarme_bomba/vencedor`] = 'jogadores';
            up[`cassino/desarme_bomba/quemFinalizou`] = jogo.meuId;
        } else {
            // Continua cortando...
            up[`cassino/desarme_bomba/fiosCortados`] = proximoIndex;
        }
    } else {
        // ERROU A SEQUÊNCIA! BOOM DIRETO!
        if (window.Haptics && navigator.vibrate) navigator.vibrate([300, 100, 500]);
        up[`cassino/desarme_bomba/status`] = 'resultado';
        up[`cassino/desarme_bomba/vencedor`] = 'casa';
        up[`cassino/desarme_bomba/quemFinalizou`] = jogo.meuId;
    }

    await update(ref(db), up);
};

window.processarFimDesarmeBomba = async function() {
    if (window.motorDesarmeBomba.quemFinalizou !== window.motorDesarmeBomba.meuId) return;
    let jogo = window.motorDesarmeBomba;
    
    if (jogo.vencedor === 'jogadores') {
        let lucro = jogo.pote * 3; // Continua pagando muito bem!
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(lucro, `Desarme Efetuado (C-4)`);
    }
};

window.renderizarMesaDesarmeBomba = function() {
    const jogo = window.motorDesarmeBomba;
    const painelAposta = document.getElementById('desarmebomba-painel-aposta');
    const painelRes = document.getElementById('desarmebomba-painel-resultado');
    const avisoCentro = document.getElementById('desarmebomba-aviso-centro');
    
    const visaoDesarmador = document.getElementById('visao-desarmador');
    const visaoEspecialista = document.getElementById('visao-especialista');

    if (avisoCentro) { avisoCentro.style.textAlign = "center"; avisoCentro.style.lineHeight = "1.4"; }
    document.getElementById('desarmebomba-pote-valor').innerText = jogo.status === 'apostando' ? (jogo.apostaAtual * 2) : (jogo.pote * 3);

    // Lógica Visual dos Fios Cortados
    ['vermelho', 'azul', 'verde', 'amarelo'].forEach(cor => {
        let divFio = document.getElementById(`fio-bomba-${cor}`);
        if (divFio) {
            divFio.style.opacity = '1';
            divFio.style.pointerEvents = 'auto';
        }
    });
    
    let listaJaCortados = JSON.parse(jogo.listaFiosCortados || "[]");
    listaJaCortados.forEach(cor => {
        let divFio = document.getElementById(`fio-bomba-${cor}`);
        if (divFio) {
            divFio.style.opacity = '0.2'; // Fica transparente/apagado quando cortado
            divFio.style.pointerEvents = 'none'; // Não deixa clicar de novo
        }
    });

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(visaoDesarmador) visaoDesarmador.classList.add('escondido');
        if(visaoEspecialista) visaoEspecialista.classList.add('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "Aguardando Equipe..."; avisoCentro.style.color = "#00f2fe"; }
        const btnInic = document.getElementById('btn-iniciar-desarmebomba');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "AGUARDANDO PARCEIRO... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "ASSUMIR O RISCO 🧨"; btnInic.style.background = "linear-gradient(145deg, #ff4757, #c0392b)"; }
        }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelRes) painelRes.classList.add('escondido');

        if (jogo.meuId === jogo.desarmador) {
            if(avisoCentro) { avisoCentro.innerText = "VOCÊ É O DESARMADOR!\nGrite a Luz e o Nº de Série!"; avisoCentro.style.color = "#ff4757"; }
            if(visaoEspecialista) visaoEspecialista.classList.add('escondido');
            if(visaoDesarmador) {
                visaoDesarmador.classList.remove('escondido');
                let luz = JSON.parse(jogo.luzAtual);
                document.getElementById('desarmebomba-luz').style.background = luz.hex;
                document.getElementById('desarmebomba-luz').style.boxShadow = `0 0 25px ${luz.hex}, inset 0 0 10px #fff`;
                document.getElementById('desarmebomba-serial').innerText = jogo.serialNumber;
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = "VOCÊ É O ESPECIALISTA!\nDescubra a luz, o serial e leia o manual."; avisoCentro.style.color = "#00f2fe"; }
            if(visaoDesarmador) visaoDesarmador.classList.add('escondido');
            if(visaoEspecialista) {
                visaoEspecialista.classList.remove('escondido');
                let ul = document.getElementById('desarmebomba-manual-lista');
                ul.innerHTML = '';
                // Renderiza o Manual Complexo
                jogo.regrasManual.forEach(regra => {
                    ul.innerHTML += `
                    <div style="border: 1px solid ${regra.luzObj.hex}; padding: 10px; border-radius: 8px; background: rgba(0,0,0,0.6);">
                        <div style="color: ${regra.luzObj.hex}; font-weight: bold; margin-bottom: 5px; font-size: 1.1rem;">LUZ ${regra.luzObj.nome}</div>
                        <div style="color: #ccc; font-size: 0.85rem; margin-bottom: 3px;">► Se S/N for <strong>PAR</strong>:</div>
                        <div style="color: #fff; font-size: 0.9rem; font-weight: bold; margin-bottom: 8px; padding-left: 15px;">Corte ${regra.seqPar[0].toUpperCase()}, depois ${regra.seqPar[1].toUpperCase()}</div>
                        
                        <div style="color: #ccc; font-size: 0.85rem; margin-bottom: 3px;">► Se S/N for <strong>ÍMPAR</strong>:</div>
                        <div style="color: #fff; font-size: 0.9rem; font-weight: bold; padding-left: 15px;">Corte ${regra.seqImpar[0].toUpperCase()}, depois ${regra.seqImpar[1].toUpperCase()}</div>
                    </div>`;
                });
            }
        }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(visaoDesarmador) visaoDesarmador.classList.add('escondido');
        if(visaoEspecialista) visaoEspecialista.classList.add('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        
        if (jogo.vencedor === 'jogadores') {
            if(avisoCentro) { avisoCentro.innerText = `🟢 BOMBA DESARMADA!\nA sequência foi exata e o pote triplicou!`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#ff4757', '#2ecc71'], particleCount: 400});
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `💥 CABUM!\nO fio estava errado ou o tempo acabou.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
                // Um delay e um som de explosão fake com o slotsLose
                setTimeout(()=> { if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8); }, 500);
            }
        }
    }
};

window.resetarDesarmeBomba = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorDesarmeBomba.moedasPagas = false;
    await set(ref(db, `cassino/desarme_bomba`), {
        status: 'apostando', apostaAtual: window.motorDesarmeBomba.apostaAtual, pote: 0, 
        vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false }
    });
};


// ==========================================
// 🏎️ MOTOR REAL-TIME: CORRIDA DE SABOTAGEM
// ==========================================

window.motorCorrida = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAtual: 50, pote: 0, 
    vencedor: null, quemFinalizou: '', moedasPagas: false, prontos: { joao: false, thamiris: false },
    meuCarro: -1, carroOponente: -1,
    posicoes: [0, 0, 0, 0], // Posição (0 a 100) dos 4 carros
    velocidades: [0, 0, 0, 0] // Velocidades calculadas pelo host
};

window.loopDeCorridaAnimacao = null;

window.iniciarOuvinteCorrida = function() {
    window.motorCorrida.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorCorrida.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    // ☢️ RESET NUCLEAR
    if (!window.corridaResetadoNuclear) {
        window.corridaResetadoNuclear = true;
        set(ref(db, `cassino/corrida_sabotagem`), {
            status: 'apostando', apostaAtual: 50, pote: 0, vencedor: null, quemFinalizou: '', 
            prontos: { joao: false, thamiris: false },
            selecoes: { joao: -1, thamiris: -1 }, posicoes: "[0,0,0,0]"
        });
    }

    onValue(ref(db, `cassino/corrida_sabotagem`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorCorrida.status = data.status || 'apostando';
            window.motorCorrida.apostaAtual = Number(data.apostaAtual) || 50;
            window.motorCorrida.pote = Number(data.pote) || 0;
            window.motorCorrida.vencedor = data.vencedor || null;
            window.motorCorrida.quemFinalizou = data.quemFinalizou || '';
            window.motorCorrida.prontos = data.prontos || { joao: false, thamiris: false };
            
            let selecoes = data.selecoes || { joao: -1, thamiris: -1 };
            window.motorCorrida.meuCarro = Number(selecoes[window.motorCorrida.meuId]);
            window.motorCorrida.carroOponente = Number(selecoes[window.motorCorrida.parceiroId]);
            
            window.motorCorrida.posicoes = JSON.parse(data.posicoes || "[0,0,0,0]");

            renderizarMesaCorrida();

            // Se o jogo começou e sou o João (Host das animações), eu disparo as velocidades pro Firebase
            if (window.motorCorrida.status === 'jogando' && window.souJoao && !window.loopDeCorridaAnimacao) {
                iniciarFisicaDaCorrida();
            }

            if (window.motorCorrida.status === 'resultado') {
                if (window.loopDeCorridaAnimacao) { cancelAnimationFrame(window.loopDeCorridaAnimacao); window.loopDeCorridaAnimacao = null; }
                if (!window.motorCorrida.moedasPagas) processarFimCorrida();
            }
        } catch (e) { console.error("Erro na Corrida", e); }
    });
};

window.escolherCarroCorrida = async function(indice) {
    if (window.motorCorrida.status !== 'apostando') return;
    if (window.motorCorrida.prontos[window.motorCorrida.meuId]) return; // Já deu pronto
    if (indice === window.motorCorrida.carroOponente) {
        if(typeof mostrarToast === 'function') mostrarToast("Oponente já escolheu este carro!", "🚫");
        return;
    }

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    up[`cassino/corrida_sabotagem/selecoes/${window.motorCorrida.meuId}`] = indice;
    await update(ref(db), up);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.5);
};

window.ajustarApostaCorrida = function(delta) {
    if (window.motorCorrida.status !== 'apostando') return;
    if (window.motorCorrida.prontos[window.motorCorrida.meuId]) return; 
    let novoValor = (Number(window.motorCorrida.apostaAtual) || 50) + delta;
    if (novoValor < 10) novoValor = 10;
    window.motorCorrida.apostaAtual = novoValor;
    const visor = document.getElementById('corrida-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarCorrida = async function() {
    if (window.motorCorrida.meuCarro === -1) {
        if(typeof mostrarToast === 'function') mostrarToast("Escolha um carro primeiro!", "🏎️");
        return;
    }

    let aposta = Number(window.motorCorrida.apostaAtual) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/corrida_sabotagem`);

    let meusProntos = { ...window.motorCorrida.prontos };
    meusProntos[window.motorCorrida.meuId] = true;

    if (meusProntos[window.motorCorrida.parceiroId] === true) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-(aposta * 2), `Entrada Corrida`);
        
        await update(jogoRef, {
            status: 'jogando', apostaAtual: aposta, pote: aposta * 2,
            vencedor: null, quemFinalizou: '', posicoes: "[0,0,0,0]",
            prontos: { joao: false, thamiris: false }
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(jogoRef, { prontos: meusProntos, apostaAtual: aposta, status: 'apostando' });
    }
};

window.sabotarOponente = async function() {
    let jogo = window.motorCorrida;
    if (jogo.status !== 'jogando' || jogo.carroOponente === -1) return;

    // Desativa o botão visualmente por 1 segundo (Cooldown)
    const btnSabotar = document.getElementById('btn-sabotar');
    if (btnSabotar) {
        btnSabotar.disabled = true;
        btnSabotar.style.filter = "grayscale(1)";
        setTimeout(() => { 
            btnSabotar.disabled = false; 
            btnSabotar.style.filter = "none";
        }, 1000);
    }

    if (window.Haptics && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.8);

    const { db, ref, get, update } = window.SantuarioApp.modulos;
    
    // Puxa as posições e empurra o carro inimigo para trás (-8%)
    const snap = await get(ref(db, `cassino/corrida_sabotagem/posicoes`));
    if (snap.exists()) {
        let posAtuais = JSON.parse(snap.val());
        posAtuais[jogo.carroOponente] -= 8;
        if (posAtuais[jogo.carroOponente] < 0) posAtuais[jogo.carroOponente] = 0;
        await update(ref(db), { [`cassino/corrida_sabotagem/posicoes`]: JSON.stringify(posAtuais) });
    }
};

// O HOST (João) cuida de mover os carros para a tela dos dois.
function iniciarFisicaDaCorrida() {
    const { db, ref, update } = window.SantuarioApp.modulos;
    let vel = [Math.random() * 0.6 + 0.3, Math.random() * 0.6 + 0.3, Math.random() * 0.6 + 0.3, Math.random() * 0.6 + 0.3];
    
    let ultimaAttFirebase = Date.now();

    function frameFisica() {
        if (window.motorCorrida.status !== 'jogando') return;

        let minhasPosicoes = [...window.motorCorrida.posicoes];
        let alguemGanhou = false;
        let vencedorId = null;

        for (let i = 0; i < 4; i++) {
            minhasPosicoes[i] += vel[i];
            
            // Randomiza levemente a velocidade ao longo da corrida pra dar emoção
            if (Math.random() < 0.05) vel[i] = Math.random() * 0.6 + 0.3;

            if (minhasPosicoes[i] >= 90) { // 90% é a linha de chegada
                minhasPosicoes[i] = 90;
                alguemGanhou = true;
                
                if (i === window.motorCorrida.meuCarro) vencedorId = 'joao';
                else if (i === window.motorCorrida.carroOponente) vencedorId = 'thamiris';
                else vencedorId = 'bot'; // Um carro neutro venceu!
            }
        }

        window.motorCorrida.posicoes = minhasPosicoes;
        atualizarCarrosVisualmente(minhasPosicoes); // Atualiza minha tela a 60FPS

        // Sincroniza com a Thamiris a cada 200ms para não explodir o banco
        let agora = Date.now();
        if (agora - ultimaAttFirebase > 200 || alguemGanhou) {
            ultimaAttFirebase = agora;
            let up = { [`cassino/corrida_sabotagem/posicoes`]: JSON.stringify(minhasPosicoes) };
            
            if (alguemGanhou) {
                up[`cassino/corrida_sabotagem/status`] = 'resultado';
                up[`cassino/corrida_sabotagem/vencedor`] = vencedorId;
                up[`cassino/corrida_sabotagem/quemFinalizou`] = 'joao';
            }
            update(ref(db), up).catch(e=>{});
        }

        if (!alguemGanhou) window.loopDeCorridaAnimacao = requestAnimationFrame(frameFisica);
    }
    
    window.loopDeCorridaAnimacao = requestAnimationFrame(frameFisica);
}

function atualizarCarrosVisualmente(posicoes) {
    for (let i = 0; i < 4; i++) {
        let divC = document.getElementById(`carro-${i}`);
        if (divC) divC.style.left = `${posicoes[i]}%`;
    }
}

window.processarFimCorrida = async function() {
    if (window.motorCorrida.quemFinalizou !== window.motorCorrida.meuId) return;
    let jogo = window.motorCorrida;
    
    if (jogo.vencedor === jogo.meuId) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(jogo.pote, `Vitória na Corrida`);
    }
};

window.renderizarMesaCorrida = function() {
    const jogo = window.motorCorrida;
    const painelAposta = document.getElementById('corrida-painel-aposta');
    const painelRes = document.getElementById('corrida-painel-resultado');
    const painelSel = document.getElementById('corrida-painel-selecao');
    const painelAcao = document.getElementById('corrida-painel-acao');
    const avisoCentro = document.getElementById('corrida-aviso-centro');

    if (avisoCentro) { avisoCentro.style.textAlign = "center"; avisoCentro.style.lineHeight = "1.4"; }
    document.getElementById('corrida-pote-valor').innerText = jogo.status === 'apostando' ? (jogo.apostaAtual * 2) : jogo.pote;

    // 🚨 CORREÇÃO 2: Atualização Incondicional da Tela!
    // Agora, o JavaScript força os carros a voltarem para o "0" fisicamente na tela
    // assim que o status voltar para 'apostando'.
    atualizarCarrosVisualmente(jogo.posicoes);

    // Renderiza a seleção visual dos carros e os donos nas raias
    for (let i = 0; i < 4; i++) {
        let btn = document.getElementById(`btn-sel-${i}`);
        let dono = document.getElementById(`dono-carro-${i}`);
        
        if (btn) {
            btn.style.opacity = '1';
            btn.style.boxShadow = 'none';
            if (i === jogo.meuCarro) { btn.style.boxShadow = '0 0 15px #fff'; btn.style.transform = 'scale(1.1)'; }
            else if (i === jogo.carroOponente) { btn.style.opacity = '0.3'; }
        }
        
        if (dono) {
            if (i === jogo.meuCarro) { dono.innerText = "VOCÊ"; dono.classList.remove('escondido'); dono.style.color = "#2ecc71"; }
            else if (i === jogo.carroOponente) { dono.innerText = "RIVAL"; dono.classList.remove('escondido'); dono.style.color = "#e74c3c"; }
            else { dono.classList.add('escondido'); }
        }
    }

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelSel) painelSel.classList.remove('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "Escolha seu carro e pague a entrada."; avisoCentro.style.color = "#e67e22"; }
        const btnInic = document.getElementById('btn-iniciar-corrida');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "AGUARDANDO RIVAL... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "PRONTO PARA CORRER 🏁"; btnInic.style.background = "linear-gradient(145deg, #e67e22, #d35400)"; }
        }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelSel) painelSel.classList.add('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(painelAcao) painelAcao.classList.remove('escondido');

        if(avisoCentro) { avisoCentro.innerText = "LARGARAM! SABOTE A ADVERSÁRIA!"; avisoCentro.style.color = "#ff4757"; }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelSel) painelSel.classList.add('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        
        if (jogo.vencedor === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = `🏆 SEU CARRO VENCEU!\nO Pote é todo seu.`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#e67e22', '#ffffff'], particleCount: 400});
            }
        } else if (jogo.vencedor === jogo.parceiroId) {
            if(avisoCentro) { avisoCentro.innerText = `💥 VOCÊ PERDEU!\nO carro adversário cruzou a linha.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `🚕 UM CARRO NEUTRO VENCEU!\nO Pote ficou para a casa.`; avisoCentro.style.color = "#f1c40f"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            }
        }
    }
};

window.resetarCorrida = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorCorrida.moedasPagas = false;
    await set(ref(db, `cassino/corrida_sabotagem`), {
        status: 'apostando', apostaAtual: window.motorCorrida.apostaAtual, pote: 0, 
        vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false },
        selecoes: { joao: -1, thamiris: -1 }, posicoes: "[0,0,0,0]"
    });
};


// ==========================================
// ⚔️ MOTOR REAL-TIME: COLISEU DOS ELEMENTOS
// ==========================================

window.motorElementos = {
    meuId: '', parceiroId: '', status: 'apostando', pote: 0, 
    vencedor: null, quemFinalizou: '', moedasPagas: false, prontos: { joao: false, thamiris: false },
    apostas: { joao: 0, thamiris: 0 }, // 🚨 O SEGREDO: Controle individual de apostas no Firebase
    escolhas: { joao: '', thamiris: '' }
};

window.iniciarOuvinteElementos = function() {
    window.motorElementos.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorElementos.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    // ☢️ RESET NUCLEAR AUTOMÁTICO
    if (!window.elementosResetadoNuclear) {
        window.elementosResetadoNuclear = true;
        set(ref(db, `cassino/elementos_duelo`), {
            status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', 
            prontos: { joao: false, thamiris: false }, 
            apostas: { joao: 0, thamiris: 0 }, 
            escolhas: { joao: '', thamiris: '' }
        });
    }

    onValue(ref(db, `cassino/elementos_duelo`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorElementos.status = data.status || 'apostando';
            window.motorElementos.pote = Number(data.pote) || 0;
            window.motorElementos.vencedor = data.vencedor || null;
            window.motorElementos.quemFinalizou = data.quemFinalizou || '';
            window.motorElementos.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorElementos.apostas = data.apostas || { joao: 0, thamiris: 0 };
            
            let escs = data.escolhas || { joao: '', thamiris: '' };
            window.motorElementos.escolhas = { joao: escs.joao || '', thamiris: escs.thamiris || '' };

            renderizarMesaElementos();

            if (window.motorElementos.status === 'jogando' && window.motorElementos.escolhas.joao !== '' && window.motorElementos.escolhas.thamiris !== '') {
                if (window.souJoao) resolverBatalhaElementos(); 
            }

            if (window.motorElementos.status === 'resultado' && !window.motorElementos.moedasPagas) {
                processarFimElementos();
            }
        } catch (e) { console.error("Erro nos Elementos", e); }
    });
};

window.ajustarApostaElementos = function(delta) {
    if (window.motorElementos.status !== 'apostando') return;
    if (window.motorElementos.prontos[window.motorElementos.meuId]) return; 
    
    let visor = document.getElementById('elementos-valor-aposta');
    let atual = Number(visor.innerText) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    visor.innerText = novoValor; // 🚨 Modifica apenas o SEU valor na tela
    
    // 🚨 Calcula o Pote em tempo real: O seu valor atual + o valor da Thamiris que está no banco
    let apostaOponente = window.motorElementos.apostas[window.motorElementos.parceiroId] || 0;
    document.getElementById('elementos-pote-valor').innerText = novoValor + apostaOponente;

    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarElementos = async function() {
    // Lê exatamente o valor que o jogador deixou na sua própria tela
    let minhaAposta = Number(document.getElementById('elementos-valor-aposta').innerText) || 50;

    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/elementos_duelo`);

    let meusProntos = { ...window.motorElementos.prontos };
    meusProntos[window.motorElementos.meuId] = true;

    // Constrói a aposta individual
    let minhasApostas = { ...window.motorElementos.apostas };
    minhasApostas[window.motorElementos.meuId] = minhaAposta; 

    if (meusProntos[window.motorElementos.parceiroId] === true) {
        // Se ambos deram pronto, junta os dinheiros para formar o prêmio colossal
        let poteTotal = minhasApostas.joao + minhasApostas.thamiris;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-poteTotal, `Entrada no Coliseu`);
        
        await update(jogoRef, {
            status: 'jogando', apostas: minhasApostas, pote: poteTotal,
            vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false },
            escolhas: { joao: '', thamiris: '' }
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        // Manda pro banco apenas a aposta de quem deu pronto
        await update(jogoRef, { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
    }
};

window.escolherElemento = async function(elemento) {
    let jogo = window.motorElementos;
    if (jogo.status !== 'jogando') return;
    if (jogo.escolhas[jogo.meuId] !== '') return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    up[`cassino/elementos_duelo/escolhas/${jogo.meuId}`] = elemento;
    
    if (window.Haptics && navigator.vibrate) navigator.vibrate([50]);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    
    await update(ref(db), up);
};

function resolverBatalhaElementos() {
    let escJoao = window.motorElementos.escolhas.joao;
    let escThamiris = window.motorElementos.escolhas.thamiris;
    let vencedorId = 'empate';

    if (escJoao === 'fogo' && escThamiris === 'planta') vencedorId = 'joao';
    else if (escJoao === 'planta' && escThamiris === 'agua') vencedorId = 'joao';
    else if (escJoao === 'agua' && escThamiris === 'fogo') vencedorId = 'joao';
    else if (escThamiris === 'fogo' && escJoao === 'planta') vencedorId = 'thamiris';
    else if (escThamiris === 'planta' && escJoao === 'agua') vencedorId = 'thamiris';
    else if (escThamiris === 'agua' && escJoao === 'fogo') vencedorId = 'thamiris';

    const { db, ref, update } = window.SantuarioApp.modulos;
    update(ref(db), {
        [`cassino/elementos_duelo/status`]: 'resultado',
        [`cassino/elementos_duelo/vencedor`]: vencedorId,
        [`cassino/elementos_duelo/quemFinalizou`]: window.motorElementos.meuId
    });
}

window.processarFimElementos = async function() {
    if (window.motorElementos.quemFinalizou !== window.motorElementos.meuId) return;
    let jogo = window.motorElementos;
    
    if (jogo.vencedor === jogo.meuId) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(jogo.pote, `Vitória no Coliseu`);
    } else if (jogo.vencedor === 'empate') {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(jogo.pote, `Empate no Coliseu`);
    }
};

window.renderizarMesaElementos = function() {
    const jogo = window.motorElementos;
    const painelAposta = document.getElementById('elementos-painel-aposta');
    const painelRes = document.getElementById('elementos-painel-resultado');
    const painelAcao = document.getElementById('elementos-painel-acao');
    const avisoCentro = document.getElementById('elementos-aviso-centro');
    const areaChoque = document.getElementById('elementos-area-choque');
    const statusOponente = document.getElementById('elementos-status-oponente');

    if (avisoCentro) { avisoCentro.style.textAlign = "center"; avisoCentro.style.lineHeight = "1.4"; }
    
    // 🚨 Cálculo Dinâmico do Pote na Interface
    let minhaAposta = Number(document.getElementById('elementos-valor-aposta').innerText) || 50;
    let apostaParceiro = jogo.apostas[jogo.parceiroId] || 0;
    document.getElementById('elementos-pote-valor').innerText = jogo.status === 'apostando' ? (minhaAposta + apostaParceiro) : jogo.pote;

    ['fogo', 'agua', 'planta'].forEach(el => {
        let btn = document.getElementById(`btn-elemento-${el}`);
        if (btn) {
            if (jogo.escolhas[jogo.meuId] === '') {
                btn.style.opacity = '1'; btn.style.transform = 'scale(1)';
            } else if (jogo.escolhas[jogo.meuId] === el) {
                btn.style.opacity = '1'; btn.style.transform = 'scale(1.1)'; btn.style.boxShadow = '0 0 25px #fff';
            } else {
                btn.style.opacity = '0.3'; btn.style.transform = 'scale(0.9)'; btn.style.boxShadow = 'none';
            }
        }
    });

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(areaChoque) areaChoque.classList.add('escondido');
        if(statusOponente) { statusOponente.innerText = "AGUARDANDO... ⏳"; statusOponente.style.color = "#ccc"; statusOponente.style.borderColor = "#555"; }
        
        if(avisoCentro) { avisoCentro.innerText = "Prepare sua aposta para o Duelo."; avisoCentro.style.color = "#2ecc71"; }
        const btnInic = document.getElementById('btn-iniciar-elementos');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "AGUARDANDO RIVAL... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "DESAFIAR ⚔️"; btnInic.style.background = "linear-gradient(145deg, #2ecc71, #27ae60)"; }
        }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(areaChoque) areaChoque.classList.add('escondido');
        if(painelAcao) painelAcao.classList.remove('escondido');

        if (jogo.escolhas[jogo.parceiroId] === '') {
            if(statusOponente) { statusOponente.innerText = "PENSANDO... 🤔"; statusOponente.style.color = "#f1c40f"; statusOponente.style.borderColor = "#f1c40f"; }
        } else {
            if(statusOponente) { statusOponente.innerText = "ESCOLHA TRANCADA! 🔒"; statusOponente.style.color = "#e74c3c"; statusOponente.style.borderColor = "#e74c3c"; }
        }

        if (jogo.escolhas[jogo.meuId] === '') {
            if(avisoCentro) { avisoCentro.innerText = "FAÇA A SUA ESCOLHA!\nQual elemento você invoca?"; avisoCentro.style.color = "#00f2fe"; }
        } else {
            if(avisoCentro) { avisoCentro.innerText = "ESCOLHA FEITA!\nAguardando a revelação..."; avisoCentro.style.color = "#f39c12"; }
        }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        if(areaChoque) areaChoque.classList.remove('escondido');
        
        if(statusOponente) { statusOponente.innerText = "REVELADO! ⚔️"; statusOponente.style.color = "#fff"; statusOponente.style.borderColor = "#fff"; }

        const emojis = { 'fogo': '🔥', 'agua': '💧', 'planta': '🌿' };
        document.getElementById('choque-meu-elemento').innerText = emojis[jogo.escolhas[jogo.meuId]] || '❓';
        document.getElementById('choque-elemento-oponente').innerText = emojis[jogo.escolhas[jogo.parceiroId]] || '❓';

        if (jogo.vencedor === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = `🏆 SEU ELEMENTO DOMINOU!\nVocê venceu o combate.`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#ffffff'], particleCount: 300});
            }
        } else if (jogo.vencedor === 'empate') {
            if(avisoCentro) { avisoCentro.innerText = `🤝 CHOQUE DE ELEMENTOS!\nEmpate. O dinheiro foi devolvido.`; avisoCentro.style.color = "#f1c40f"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `💀 SEU ELEMENTO FOI DESTRUÍDO!\nA adversária levou o pote.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            }
        }
    }
};

window.resetarElementos = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorElementos.moedasPagas = false;
    await set(ref(db, `cassino/elementos_duelo`), {
        status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', 
        prontos: { joao: false, thamiris: false },
        apostas: { joao: 0, thamiris: 0 }, 
        escolhas: { joao: '', thamiris: '' }
    });
};

// ==========================================
// 💎 MOTOR REAL-TIME: CAÇA AO DIAMANTE AVANÇADO
// ==========================================

window.motorCacaDiamante = {
    meuId: '', parceiroId: '', status: 'apostando', pote: 0, turno: '',
    vencedor: null, quemFinalizou: '', moedasPagas: false, prontos: { joao: false, thamiris: false },
    apostas: { joao: 0, thamiris: 0 },
    prontosOcultacao: { joao: false, thamiris: false },
    // A base agora armazena o índice do Diamante (d) e os índices das Bombas (b)
    bases: { 
        joao: { d: -1, b: [] }, 
        thamiris: { d: -1, b: [] } 
    }, 
    tirosRecebidos: { joao: [], thamiris: [] } 
};

window.iniciarOuvinteCacaDiamante = function() {
    window.motorCacaDiamante.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorCacaDiamante.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    if (!window.cacaDiamanteResetadoNuclear) {
        window.cacaDiamanteResetadoNuclear = true;
        set(ref(db, `cassino/caca_diamante`), {
            status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', 
            prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 }, 
            prontosOcultacao: { joao: false, thamiris: false },
            bases: { joao: { d: -1, b: '[]' }, thamiris: { d: -1, b: '[]' } }, 
            tirosRecebidos: { joao: '[]', thamiris: '[]' }
        });
    }

    onValue(ref(db, `cassino/caca_diamante`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorCacaDiamante.status = data.status || 'apostando';
            window.motorCacaDiamante.turno = data.turno || '';
            window.motorCacaDiamante.pote = Number(data.pote) || 0;
            window.motorCacaDiamante.vencedor = data.vencedor || null;
            window.motorCacaDiamante.quemFinalizou = data.quemFinalizou || '';
            window.motorCacaDiamante.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorCacaDiamante.apostas = data.apostas || { joao: 0, thamiris: 0 };
            window.motorCacaDiamante.prontosOcultacao = data.prontosOcultacao || { joao: false, thamiris: false };
            
            let basesBrutas = data.bases || { joao: { d: -1, b: '[]' }, thamiris: { d: -1, b: '[]' } };
            window.motorCacaDiamante.bases = {
                joao: { d: Number(basesBrutas.joao?.d ?? -1), b: JSON.parse(basesBrutas.joao?.b || "[]") },
                thamiris: { d: Number(basesBrutas.thamiris?.d ?? -1), b: JSON.parse(basesBrutas.thamiris?.b || "[]") }
            };
            
            window.motorCacaDiamante.tirosRecebidos = { 
                joao: JSON.parse((data.tirosRecebidos || {}).joao || "[]"), 
                thamiris: JSON.parse((data.tirosRecebidos || {}).thamiris || "[]") 
            };

            renderizarMesaCacaDiamante();

            // Gatilho para iniciar a Guerra quando ambos trancarem as bases
            if (window.motorCacaDiamante.status === 'escondendo' && window.motorCacaDiamante.prontosOcultacao.joao && window.motorCacaDiamante.prontosOcultacao.thamiris) {
                if (window.souJoao) {
                    const { db, ref, update } = window.SantuarioApp.modulos;
                    update(ref(db), { [`cassino/caca_diamante/status`]: 'jogando' }).catch(e=>{});
                }
            }

            if (window.motorCacaDiamante.status === 'resultado' && !window.motorCacaDiamante.moedasPagas) {
                processarFimCacaDiamante();
            }
        } catch (e) { console.error("Erro Caça Diamante", e); }
    });
};

function criarGridBox(tipo, index, estado) {
    let estiloBase = `width: 100%; aspect-ratio: 1; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; cursor: pointer; transition: all 0.2s;`;
    
    if (tipo === 'defesa') {
        if (estado === 'diamante') return `<div onclick="esconderDefesaCacaDiamante(${index})" style="${estiloBase} background: rgba(0, 206, 201, 0.3); border: 2px solid #00cec9; box-shadow: inset 0 0 15px rgba(0, 206, 201, 0.5);">💎</div>`;
        if (estado === 'bomba') return `<div onclick="esconderDefesaCacaDiamante(${index})" style="${estiloBase} background: rgba(231, 76, 60, 0.3); border: 2px solid #e74c3c; box-shadow: inset 0 0 15px rgba(231, 76, 60, 0.5);">💣</div>`;
        if (estado === 'vazio_atingido') return `<div style="${estiloBase} background: rgba(0, 0, 0, 0.6); border: 2px solid #555; color: #555;">💨</div>`;
        if (estado === 'bomba_atingida') return `<div style="${estiloBase} background: rgba(231, 76, 60, 0.8); border: 2px solid #ff4757; color: #fff;">💥</div>`;
        
        // Estado livre na fase de ocultação
        return `<div onclick="esconderDefesaCacaDiamante(${index})" style="${estiloBase} background: rgba(0, 206, 201, 0.05); border: 2px dashed #00cec9; color: rgba(0, 206, 201, 0.2);">📦</div>`;
    } 
    else { // ATAQUE
        if (estado === 'vazio') return `<div style="${estiloBase} background: rgba(0, 0, 0, 0.6); border: 2px solid #555; opacity: 0.5;">💨</div>`;
        if (estado === 'diamante') return `<div style="${estiloBase} background: rgba(0, 206, 201, 0.8); border: 2px solid #00cec9; box-shadow: 0 0 20px #00cec9;">💎</div>`;
        if (estado === 'bomba') return `<div style="${estiloBase} background: rgba(231, 76, 60, 0.8); border: 2px solid #ff4757; box-shadow: 0 0 20px #e74c3c;">💥</div>`;
        
        // Alvo intacto para atirar
        return `<div onclick="atirarNaBaseInimiga(${index})" style="${estiloBase} background: linear-gradient(145deg, #2c0b0e, #1a0508); border: 2px solid #e74c3c; box-shadow: 0 5px 10px rgba(0,0,0,0.5), inset 0 0 10px rgba(231, 76, 60, 0.2);">❓</div>`;
    }
}

window.ajustarApostaCacaDiamante = function(delta) {
    if (window.motorCacaDiamante.status !== 'apostando') return;
    if (window.motorCacaDiamante.prontos[window.motorCacaDiamante.meuId]) return; 
    let visor = document.getElementById('cacadiamante-valor-aposta');
    let atual = Number(visor.innerText) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    visor.innerText = novoValor; 
    let apostaOponente = window.motorCacaDiamante.apostas[window.motorCacaDiamante.parceiroId] || 0;
    document.getElementById('cacadiamante-pote-valor').innerText = novoValor + apostaOponente;
    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarCacaDiamante = async function() {
    let minhaAposta = Number(document.getElementById('cacadiamante-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/caca_diamante`);

    let meusProntos = { ...window.motorCacaDiamante.prontos };
    meusProntos[window.motorCacaDiamante.meuId] = true;

    let minhasApostas = { ...window.motorCacaDiamante.apostas };
    minhasApostas[window.motorCacaDiamante.meuId] = minhaAposta; 

    if (meusProntos[window.motorCacaDiamante.parceiroId] === true) {
        let poteTotal = minhasApostas.joao + minhasApostas.thamiris;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-poteTotal, `Guerra do Diamante`);
        
        let quemComeca = Math.random() > 0.5 ? 'joao' : 'thamiris';

        await update(jogoRef, {
            status: 'escondendo', turno: quemComeca, apostas: minhasApostas, pote: poteTotal,
            vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false },
            prontosOcultacao: { joao: false, thamiris: false },
            bases: { joao: { d: -1, b: '[]' }, thamiris: { d: -1, b: '[]' } },
            tirosRecebidos: { joao: '[]', thamiris: '[]' }
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(jogoRef, { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
    }
};

window.esconderDefesaCacaDiamante = async function(index) {
    let jogo = window.motorCacaDiamante;
    if (jogo.status !== 'escondendo' || jogo.prontosOcultacao[jogo.meuId]) return;

    let minhaBase = { d: jogo.bases[jogo.meuId].d, b: [...jogo.bases[jogo.meuId].b] };

    // Lógica inteligente de clique (Remove se já tem, Adiciona Diamante primeiro, depois Bombas)
    if (minhaBase.d === index) { minhaBase.d = -1; }
    else if (minhaBase.b.includes(index)) { minhaBase.b = minhaBase.b.filter(i => i !== index); }
    else {
        if (minhaBase.d === -1) { minhaBase.d = index; }
        else if (minhaBase.b.length < 2) { minhaBase.b.push(index); }
        else { return; /* Já colocou os 3 itens */ }
    }

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    up[`cassino/caca_diamante/bases/${jogo.meuId}`] = { d: minhaBase.d, b: JSON.stringify(minhaBase.b) };
    
    if (window.Haptics && navigator.vibrate) navigator.vibrate([20]);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.5);
    await update(ref(db), up);
};

window.trancarBaseCacaDiamante = async function() {
    let jogo = window.motorCacaDiamante;
    if (jogo.bases[jogo.meuId].d === -1 || jogo.bases[jogo.meuId].b.length < 2) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    up[`cassino/caca_diamante/prontosOcultacao/${jogo.meuId}`] = true;
    
    if (window.Haptics && navigator.vibrate) navigator.vibrate([50, 50]);
    await update(ref(db), up);
};

window.atirarNaBaseInimiga = async function(index) {
    let jogo = window.motorCacaDiamante;
    if (jogo.status !== 'jogando') return;
    if (jogo.turno !== jogo.meuId) return;
    
    let tirosNoOponente = [...jogo.tirosRecebidos[jogo.parceiroId]];
    if (tirosNoOponente.includes(index)) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    tirosNoOponente.push(index);
    up[`cassino/caca_diamante/tirosRecebidos/${jogo.parceiroId}`] = JSON.stringify(tirosNoOponente);

    let baseInimiga = jogo.bases[jogo.parceiroId];

    if (index === baseInimiga.d) {
        // ACHOU O DIAMANTE DO INIMIGO! VITÓRIA!
        if (window.Haptics && navigator.vibrate) navigator.vibrate([300, 100, 500]);
        up[`cassino/caca_diamante/status`] = 'resultado';
        up[`cassino/caca_diamante/vencedor`] = jogo.meuId;
        up[`cassino/caca_diamante/quemFinalizou`] = jogo.meuId;
    } 
    else if (baseInimiga.b.includes(index)) {
        // ATIROU NA BOMBA TÁTICA! (Sofre Multa + Passa a Vez)
        if (window.Haptics && navigator.vibrate) navigator.vibrate([200, 50, 200]);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
        
        let multa = 50;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-multa, `Multa por Bomba Tática`);
        up[`cassino/caca_diamante/pote`] = jogo.pote + multa; // Pote engrossa com o sangue de quem errou
        up[`cassino/caca_diamante/turno`] = jogo.parceiroId; // Perde o turno
        
        if(typeof mostrarToast === 'function') mostrarToast("BOMBA! Você perdeu 50 moedas pro pote!", "💥");
    } 
    else {
        // TIRO NA FUMAÇA (Vazio)
        if (window.Haptics && navigator.vibrate) navigator.vibrate(20);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.5);
        up[`cassino/caca_diamante/turno`] = jogo.parceiroId;
    }

    await update(ref(db), up);
};

window.processarFimCacaDiamante = async function() {
    if (window.motorCacaDiamante.quemFinalizou !== window.motorCacaDiamante.meuId) return;
    let jogo = window.motorCacaDiamante;
    if (jogo.vencedor === jogo.meuId) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(jogo.pote, `Vitória Caça Diamante`);
    } 
};

window.renderizarMesaCacaDiamante = function() {
    const jogo = window.motorCacaDiamante;
    const painelAposta = document.getElementById('cacadiamante-painel-aposta');
    const painelRes = document.getElementById('cacadiamante-painel-resultado');
    const avisoCentro = document.getElementById('cacadiamante-aviso-centro');
    
    const areaOponente = document.getElementById('cacadiamante-area-oponente');
    const areaJogador = document.getElementById('cacadiamante-area-jogador');
    const visorPos = document.getElementById('visor-posicionamento');
    const btnTrancar = document.getElementById('btn-trancar-base');

    if (avisoCentro) { avisoCentro.style.textAlign = "center"; avisoCentro.style.lineHeight = "1.4"; }
    
    let minhaAposta = Number(document.getElementById('cacadiamante-valor-aposta').innerText) || 50;
    let apostaParceiro = jogo.apostas[jogo.parceiroId] || 0;
    
    // Atualiza pote na tela com destaque visual quando houver multa
    const visorPote = document.getElementById('cacadiamante-pote-valor');
    let poteAtualCalculado = jogo.status === 'apostando' ? (minhaAposta + apostaParceiro) : jogo.pote;
    
    if (visorPote && Number(visorPote.innerText) < poteAtualCalculado && jogo.status === 'jogando') {
        visorPote.parentElement.style.transform = "scale(1.1)";
        visorPote.parentElement.style.borderColor = "#ff4757";
        setTimeout(()=>{ visorPote.parentElement.style.transform = "scale(1)"; visorPote.parentElement.style.borderColor = "#00cec9"; }, 500);
    }
    if (visorPote) visorPote.innerText = poteAtualCalculado;

    // RENDERIZAR GRADES (AGORA 16 CAIXAS)
    const gridDefesa = document.getElementById('grid-defesa');
    const gridAtaque = document.getElementById('grid-ataque');
    
    if (gridDefesa && gridAtaque) {
        gridDefesa.innerHTML = '';
        gridAtaque.innerHTML = '';
        
        let minhaBase = jogo.bases[jogo.meuId];
        let baseInimiga = jogo.bases[jogo.parceiroId];
        let tirosQueLevei = jogo.tirosRecebidos[jogo.meuId];
        let tirosQueDei = jogo.tirosRecebidos[jogo.parceiroId];

        // Atualiza contadores na fase 1
        if (visorPos) {
            document.getElementById('contador-diamante').innerText = minhaBase.d !== -1 ? '1/1' : '0/1';
            document.getElementById('contador-bombas').innerText = `${minhaBase.b.length}/2`;
            if (minhaBase.d !== -1 && minhaBase.b.length === 2 && !jogo.prontosOcultacao[jogo.meuId]) {
                if(btnTrancar) btnTrancar.classList.remove('escondido');
            } else {
                if(btnTrancar) btnTrancar.classList.add('escondido');
            }
        }

        for(let i=0; i<16; i++) {
            // Desenhar Minha Defesa
            let estadoDefesa = 'oculto';
            if (i === minhaBase.d) estadoDefesa = 'diamante';
            else if (minhaBase.b.includes(i)) estadoDefesa = 'bomba';
            
            // Se tomei tiro ali, mostra o estrago se não era o diamante (que acaba o jogo)
            if (tirosQueLevei.includes(i)) {
                if (minhaBase.b.includes(i)) estadoDefesa = 'bomba_atingida';
                else if (i !== minhaBase.d) estadoDefesa = 'vazio_atingido';
            }
            gridDefesa.innerHTML += criarGridBox('defesa', i, estadoDefesa);

            // Desenhar Ataque
            let estadoAtaque = 'oculto';
            if (tirosQueDei.includes(i)) {
                if (i === baseInimiga.d) estadoAtaque = 'diamante'; // Win
                else if (baseInimiga.b.includes(i)) estadoAtaque = 'bomba'; // Multa
                else estadoAtaque = 'vazio'; // Fumaça
            }
            // Revelar Diamante no fim
            if (jogo.status === 'resultado' && i === baseInimiga.d) estadoAtaque = 'diamante';
            gridAtaque.innerHTML += criarGridBox('ataque', i, estadoAtaque);
        }
    }

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(areaOponente) areaOponente.classList.add('escondido');
        if(areaJogador) areaJogador.classList.add('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "Financie sua base para entrar na guerra."; avisoCentro.style.color = "#00cec9"; }
        const btnInic = document.getElementById('btn-iniciar-cacadiamante');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "AGUARDANDO RIVAL... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "FINANCIAR GUERRA ⚔️"; btnInic.style.background = "linear-gradient(145deg, #00cec9, #01908c)"; }
        }
    } 
    else if (jogo.status === 'escondendo') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(areaOponente) areaOponente.classList.add('escondido');
        if(areaJogador) areaJogador.classList.remove('escondido'); 
        if(visorPos) visorPos.classList.remove('escondido');
        
        if (!jogo.prontosOcultacao[jogo.meuId]) {
            if(avisoCentro) { avisoCentro.innerText = "FASE TÁTICA\nPlante 1 Diamante e 2 Bombas!"; avisoCentro.style.color = "#00cec9"; }
        } else {
            if(avisoCentro) { avisoCentro.innerText = "DEFESAS TRANCADAS!\nAguardando adversária... ⏳"; avisoCentro.style.color = "#f1c40f"; }
            if(btnTrancar) btnTrancar.classList.add('escondido');
        }
    }
    else if (jogo.status === 'jogando') {
        if(visorPos) visorPos.classList.add('escondido');
        if(btnTrancar) btnTrancar.classList.add('escondido');
        if(areaOponente) areaOponente.classList.remove('escondido');
        if(areaJogador) areaJogador.classList.remove('escondido');

        if (jogo.turno === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = "SUA VEZ!\nAtire na Zona Inimiga!"; avisoCentro.style.color = "#e74c3c"; }
        } else {
            if(avisoCentro) { avisoCentro.innerText = "AGUARDE!\nSua base está sob ataque... 💥"; avisoCentro.style.color = "#f39c12"; }
        }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        if(areaOponente) areaOponente.classList.remove('escondido');
        if(areaJogador) areaJogador.classList.remove('escondido');
        if(visorPos) visorPos.classList.add('escondido');
        if(btnTrancar) btnTrancar.classList.add('escondido');
        
        if (jogo.vencedor === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = `🏆 BASE INIMIGA DESTRUÍDA!\nO Diamante é todo seu!`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#00cec9', '#ffffff'], particleCount: 300});
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `💀 SUA BASE CAIU!\nO Diamante foi roubado.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            }
        }
    }
};

window.resetarCacaDiamante = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorCacaDiamante.moedasPagas = false;
    await set(ref(db, `cassino/caca_diamante`), {
        status: 'apostando', turno: '', pote: 0, vencedor: null, quemFinalizou: '', 
        prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 }, 
        prontosOcultacao: { joao: false, thamiris: false },
        bases: { joao: { d: -1, b: '[]' }, thamiris: { d: -1, b: '[]' } }, 
        tirosRecebidos: { joao: '[]', thamiris: '[]' }
    });
};

// ==========================================
// 🏦 MOTOR REAL-TIME: INVASÃO AO COFRE (PVP)
// ==========================================

window.motorSincroniaCofre = {
    meuId: '', parceiroId: '', status: 'apostando', pote: 0, 
    vencedor: null, quemFinalizou: '', moedasPagas: false, 
    prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
    progresso: { joao: 0, thamiris: 0 }, 
    firewallAtual: 'trava' // 'trava', 'fogo', 'agua', 'planta'
};

window.loopFirewall = null;

window.iniciarOuvinteSincroniaCofre = function() { // Mantivemos o nome da função para não quebrar a rota
    window.motorSincroniaCofre.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorSincroniaCofre.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    if (!window.sincroniaCofreResetadoNuclear) {
        window.sincroniaCofreResetadoNuclear = true;
        set(ref(db, `cassino/invasao_cofre`), {
            status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '',
            prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 }, 
            progresso: { joao: 0, thamiris: 0 }, firewallAtual: 'trava'
        });
    }

    onValue(ref(db, `cassino/invasao_cofre`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorSincroniaCofre.status = data.status || 'apostando';
            window.motorSincroniaCofre.pote = Number(data.pote) || 0;
            window.motorSincroniaCofre.vencedor = data.vencedor || null;
            window.motorSincroniaCofre.quemFinalizou = data.quemFinalizou || '';
            window.motorSincroniaCofre.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorSincroniaCofre.apostas = data.apostas || { joao: 0, thamiris: 0 };
            
            let prog = data.progresso || { joao: 0, thamiris: 0 };
            window.motorSincroniaCofre.progresso = { joao: Number(prog.joao), thamiris: Number(prog.thamiris) };
            window.motorSincroniaCofre.firewallAtual = data.firewallAtual || 'trava';

            renderizarMesaSincroniaCofre();

            // O Host (João) coordena a mudança de fase do Firewall a cada 2.5s
            if (window.motorSincroniaCofre.status === 'jogando' && window.souJoao && !window.loopFirewall) {
                iniciarRotinaFirewall();
            }

            if (window.motorSincroniaCofre.status === 'resultado') {
                if (window.loopFirewall) { clearInterval(window.loopFirewall); window.loopFirewall = null; }
                if (!window.motorSincroniaCofre.moedasPagas) processarFimSincroniaCofre();
            }
        } catch (e) { console.error("Erro no Cofre", e); }
    });
};

function iniciarRotinaFirewall() {
    const { db, ref, update } = window.SantuarioApp.modulos;
    const elementos = ['fogo', 'agua', 'planta'];
    
    // Troca inicial
    update(ref(db), { [`cassino/invasao_cofre/firewallAtual`]: elementos[Math.floor(Math.random() * 3)] }).catch(e=>{});

    window.loopFirewall = setInterval(() => {
        if (window.motorSincroniaCofre.status !== 'jogando') {
            clearInterval(window.loopFirewall); window.loopFirewall = null; return;
        }
        let novoEl = elementos[Math.floor(Math.random() * 3)];
        update(ref(db), { [`cassino/invasao_cofre/firewallAtual`]: novoEl }).catch(e=>{});
    }, 2500); // A cada 2.5 segundos o elemento muda!
}

window.ajustarApostaSincroniaCofre = function(delta) {
    if (window.motorSincroniaCofre.status !== 'apostando') return;
    if (window.motorSincroniaCofre.prontos[window.motorSincroniaCofre.meuId]) return; 
    
    let visor = document.getElementById('sincroniacofre-valor-aposta');
    let atual = Number(visor.innerText) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    visor.innerText = novoValor; 
    let apostaOponente = window.motorSincroniaCofre.apostas[window.motorSincroniaCofre.parceiroId] || 0;
    document.getElementById('sincroniacofre-pote-valor').innerText = (novoValor + apostaOponente);

    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarSincroniaCofre = async function() {
    let minhaAposta = Number(document.getElementById('sincroniacofre-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/invasao_cofre`);

    let meusProntos = { ...window.motorSincroniaCofre.prontos };
    meusProntos[window.motorSincroniaCofre.meuId] = true;

    let minhasApostas = { ...window.motorSincroniaCofre.apostas };
    minhasApostas[window.motorSincroniaCofre.meuId] = minhaAposta; 

    if (meusProntos[window.motorSincroniaCofre.parceiroId] === true) {
        let poteCombinado = minhasApostas.joao + minhasApostas.thamiris;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-poteCombinado, `Hack ao Cofre`);
        
        await update(jogoRef, {
            status: 'jogando', apostas: minhasApostas, pote: poteCombinado,
            vencedor: null, quemFinalizou: '', firewallAtual: 'trava',
            prontos: { joao: false, thamiris: false }, progresso: { joao: 0, thamiris: 0 }
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(jogoRef, { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
    }
};

window.atacarFirewall = async function(meuAtaque) {
    let jogo = window.motorSincroniaCofre;
    if (jogo.status !== 'jogando' || jogo.firewallAtual === 'trava') return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    let progressoAtual = jogo.progresso[jogo.meuId];
    let alvo = jogo.firewallAtual;
    
    // Lógica da Vantagem Elementar
    let acertou = false;
    if (alvo === 'fogo' && meuAtaque === 'agua') acertou = true;
    else if (alvo === 'agua' && meuAtaque === 'planta') acertou = true;
    else if (alvo === 'planta' && meuAtaque === 'fogo') acertou = true;

    if (acertou) {
        progressoAtual += 5; // Sobe 5%
        if (window.Haptics && navigator.vibrate) navigator.vibrate([20]);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.5);
    } else {
        progressoAtual -= 10; // Cai 10% de Punição
        if (progressoAtual < 0) progressoAtual = 0;
        if (window.Haptics && navigator.vibrate) navigator.vibrate([100, 50, 100]);
        
        // Efeito visual de falha na tela local
        document.getElementById('nucleo-firewall').style.borderColor = "#e74c3c";
        document.getElementById('nucleo-firewall').style.boxShadow = "inset 0 0 40px #e74c3c";
        setTimeout(()=>{ 
            document.getElementById('nucleo-firewall').style.borderColor = "#333";
            document.getElementById('nucleo-firewall').style.boxShadow = "inset 0 0 20px #000";
        }, 300);
    }

    if (progressoAtual >= 100) {
        progressoAtual = 100;
        up[`cassino/invasao_cofre/status`] = 'resultado';
        up[`cassino/invasao_cofre/vencedor`] = jogo.meuId;
        up[`cassino/invasao_cofre/quemFinalizou`] = jogo.meuId;
    }

    up[`cassino/invasao_cofre/progresso/${jogo.meuId}`] = progressoAtual;
    await update(ref(db), up);
};

window.processarFimSincroniaCofre = async function() {
    if (window.motorSincroniaCofre.quemFinalizou !== window.motorSincroniaCofre.meuId) return;
    let jogo = window.motorSincroniaCofre;
    if (jogo.vencedor === jogo.meuId) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(jogo.pote, `Roubo ao Cofre Concluído`);
    } 
};

window.renderizarMesaSincroniaCofre = function() {
    const jogo = window.motorSincroniaCofre;
    const painelAposta = document.getElementById('sincroniacofre-painel-aposta');
    const painelRes = document.getElementById('sincroniacofre-painel-resultado');
    const tecladoHacker = document.getElementById('teclado-hacker');
    const avisoCentro = document.getElementById('sincroniacofre-aviso-centro');
    const nucleo = document.getElementById('nucleo-firewall');
    const painelProgresso = document.getElementById('painel-hacker-progresso');

    if (avisoCentro) { avisoCentro.style.textAlign = "center"; avisoCentro.style.lineHeight = "1.4"; }
    
    let minhaAposta = Number(document.getElementById('sincroniacofre-valor-aposta').innerText) || 50;
    let apostaParceiro = jogo.apostas[jogo.parceiroId] || 0;
    document.getElementById('sincroniacofre-pote-valor').innerText = jogo.status === 'apostando' ? (minhaAposta + apostaParceiro) : jogo.pote;

    // Atualiza barras de progresso
    document.getElementById('hack-meu-pct').innerText = `${jogo.progresso[jogo.meuId]}%`;
    document.getElementById('hack-meu-bar').style.width = `${jogo.progresso[jogo.meuId]}%`;
    
    document.getElementById('hack-oponente-pct').innerText = `${jogo.progresso[jogo.parceiroId]}%`;
    document.getElementById('hack-oponente-bar').style.width = `${jogo.progresso[jogo.parceiroId]}%`;

    // Visual do Núcleo do Cofre
    const emojiMap = { 'trava': '🔒', 'fogo': '🔥', 'agua': '💧', 'planta': '🌿' };
    const colorMap = { 'trava': '#111', 'fogo': '#e74c3c', 'agua': '#3498db', 'planta': '#2ecc71' };
    if (nucleo) {
        nucleo.innerText = emojiMap[jogo.firewallAtual];
        if (jogo.status === 'jogando') {
            nucleo.style.background = colorMap[jogo.firewallAtual];
            nucleo.style.boxShadow = `0 0 30px ${colorMap[jogo.firewallAtual]}, inset 0 0 20px rgba(255,255,255,0.5)`;
            nucleo.style.borderColor = "#fff";
        } else {
            nucleo.style.background = "#111";
            nucleo.style.boxShadow = "inset 0 0 20px #000";
            nucleo.style.borderColor = "#333";
        }
    }

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(tecladoHacker) tecladoHacker.classList.add('escondido');
        if(painelProgresso) painelProgresso.classList.add('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "Financie a operação hacker."; avisoCentro.style.color = "#f1c40f"; }
        const btnInic = document.getElementById('btn-iniciar-sincroniacofre');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "AGUARDANDO RIVAL... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "CRIAR LINK DE ACESSO 🔌"; btnInic.style.background = "linear-gradient(145deg, #f1c40f, #d4ac0d)"; }
        }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(tecladoHacker) tecladoHacker.classList.remove('escondido');
        if(painelProgresso) painelProgresso.classList.remove('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "SISTEMA ONLINE!\nAtire a fraqueza do Firewall!"; avisoCentro.style.color = "#00f2fe"; }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(tecladoHacker) tecladoHacker.classList.add('escondido');
        if(painelProgresso) painelProgresso.classList.remove('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        
        if (jogo.vencedor === jogo.meuId) {
            if(avisoCentro) { avisoCentro.innerText = `🔓 DOWNLOAD CONCLUÍDO!\nVocê invadiu o cofre primeiro!`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.Haptics && navigator.vibrate) navigator.vibrate([100, 100, 300]);
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#ffffff'], particleCount: 500});
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `🚨 ALARME ACIONADO!\nA adversária hackeou o sistema antes.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.Haptics && navigator.vibrate) navigator.vibrate([500, 200, 500]);
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
                setTimeout(()=> { if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8); }, 500);
            }
        }
    }
};

window.resetarSincroniaCofre = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorSincroniaCofre.moedasPagas = false;
    await set(ref(db, `cassino/invasao_cofre`), {
        status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', 
        prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 }, 
        progresso: { joao: 0, thamiris: 0 }, firewallAtual: 'trava'
    });
};

// ==========================================
// 🔦 MOTOR REAL-TIME: CAMPO MINADO CEGO (CO-OP)
// ==========================================

window.motorCampoMinado = {
    meuId: '', parceiroId: '', status: 'apostando', poteInicial: 0, 
    vencedor: null, quemFinalizou: '', moedasPagas: false, prontos: { joao: false, thamiris: false },
    apostas: { joao: 0, thamiris: 0 },
    rastreador: '', // O parceiro que vê as minas
    minas: [], // Array de 5 posições
    abertas: [], // Array de caixas seguras já abertas
    // Multiplicadores por acerto (11 passos para a vitória total)
    multis: [1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 10.0, 12.0, 15.0]
};

window.iniciarOuvinteCampoMinado = function() {
    window.motorCampoMinado.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorCampoMinado.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    if (!window.campoMinadoResetadoNuclear) {
        window.campoMinadoResetadoNuclear = true;
        set(ref(db, `cassino/campo_minado`), {
            status: 'apostando', poteInicial: 0, vencedor: null, quemFinalizou: '',
            prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
            rastreador: '', minas: '[]', abertas: '[]'
        });
    }

    onValue(ref(db, `cassino/campo_minado`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};

            if (data.status === 'jogando' && !data.minas) { await resetarCampoMinado(); return; }

            window.motorCampoMinado.status = data.status || 'apostando';
            window.motorCampoMinado.poteInicial = Number(data.poteInicial) || 0;
            window.motorCampoMinado.vencedor = data.vencedor || null;
            window.motorCampoMinado.quemFinalizou = data.quemFinalizou || '';
            window.motorCampoMinado.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorCampoMinado.apostas = data.apostas || { joao: 0, thamiris: 0 };
            window.motorCampoMinado.rastreador = data.rastreador || '';
            
            window.motorCampoMinado.minas = JSON.parse(data.minas || "[]");
            window.motorCampoMinado.abertas = JSON.parse(data.abertas || "[]");

            renderizarMesaCampoMinado();

            if (window.motorCampoMinado.status === 'resultado' && !window.motorCampoMinado.moedasPagas) {
                processarFimCampoMinado();
            }
        } catch (e) { console.error("Erro Campo Minado", e); }
    });
};

function desenharCaixaCampoMinado(index, isMina, isAberta, euSouRastreador, jogoAcabou) {
    // 🚨 Adicionado box-sizing: border-box na base de todas as caixas
    let base = `width: 100%; aspect-ratio: 1; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 2rem; transition: all 0.3s; box-sizing: border-box;`;
    
    // VISÃO DO RASTREADOR (O Guia)
    if (euSouRastreador) {
        // 🚨 Removido o 'animation: pulsoUno' e adicionado um brilho neon estático mais forte
        if (isMina) return `<div style="${base} background: rgba(231, 76, 60, 0.4); border: 2px solid #e74c3c; box-shadow: 0 0 15px rgba(231, 76, 60, 0.6), inset 0 0 15px rgba(231,76,60,0.8);">💣</div>`;
        if (isAberta) return `<div style="${base} background: rgba(46, 204, 113, 0.2); border: 2px solid #2ecc71;">✅</div>`;
        return `<div style="${base} background: rgba(0,0,0,0.6); border: 2px solid #555; color: #444;">🛡️</div>`;
    } 
    // VISÃO DO EXPLORADOR (O Jogador Cego)
    else {
        if (isAberta) {
            if (isMina) return `<div style="${base} background: rgba(231, 76, 60, 0.8); border: 2px solid #ff4757; box-shadow: 0 0 20px #e74c3c;">💥</div>`;
            return `<div style="${base} background: rgba(46, 204, 113, 0.4); border: 2px solid #2ecc71; box-shadow: 0 0 15px rgba(46,204,113,0.5);">✅</div>`;
        }
        
        // Se o jogo acabou, revela as minas que ele não pisou
        if (jogoAcabou && isMina) return `<div style="${base} background: rgba(231, 76, 60, 0.2); border: 2px solid #e74c3c; opacity: 0.5;">💣</div>`;
        if (jogoAcabou) return `<div style="${base} background: rgba(0,0,0,0.8); border: 2px solid #333;">💨</div>`;

        // Caixa clicável no escuro
        return `<div onclick="clicarCampoMinado(${index})" style="${base} background: linear-gradient(145deg, #2c0b3e, #150524); border: 2px solid #9b59b6; box-shadow: 0 5px 10px rgba(0,0,0,0.6), inset 0 0 10px rgba(155, 89, 182, 0.2); cursor: pointer;">❓</div>`;
    }
}

window.ajustarApostaCampoMinado = function(delta) {
    if (window.motorCampoMinado.status !== 'apostando') return;
    if (window.motorCampoMinado.prontos[window.motorCampoMinado.meuId]) return; 
    let visor = document.getElementById('campominado-valor-aposta');
    let atual = Number(visor.innerText) || 50;
    let novoValor = atual + delta;
    if (novoValor < 10) novoValor = 10;
    
    visor.innerText = novoValor; 
    let apostaOponente = window.motorCampoMinado.apostas[window.motorCampoMinado.parceiroId] || 0;
    document.getElementById('campominado-lucro-valor').innerText = (novoValor + apostaOponente);
    if (window.Haptics && navigator.vibrate) navigator.vibrate([30]);
};

window.iniciarCampoMinado = async function() {
    let minhaAposta = Number(document.getElementById('campominado-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    const jogoRef = ref(db, `cassino/campo_minado`);

    let meusProntos = { ...window.motorCampoMinado.prontos };
    meusProntos[window.motorCampoMinado.meuId] = true;

    let minhasApostas = { ...window.motorCampoMinado.apostas };
    minhasApostas[window.motorCampoMinado.meuId] = minhaAposta; 

    if (meusProntos[window.motorCampoMinado.parceiroId] === true) {
        let poteTotal = minhasApostas.joao + minhasApostas.thamiris;
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-poteTotal, `Entrada na Expedição`);
        
        // Sorteia as 5 Minas Letais
        let minasGeradas = [];
        while(minasGeradas.length < 5) {
            let r = Math.floor(Math.random() * 16);
            if(!minasGeradas.includes(r)) minasGeradas.push(r);
        }

        let quemEORastreador = Math.random() > 0.5 ? 'joao' : 'thamiris';

        await update(jogoRef, {
            status: 'jogando', apostas: minhasApostas, poteInicial: poteTotal,
            vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false },
            rastreador: quemEORastreador, minas: JSON.stringify(minasGeradas), abertas: '[]'
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(jogoRef, { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
    }
};

window.clicarCampoMinado = async function(index) {
    let jogo = window.motorCampoMinado;
    if (jogo.status !== 'jogando' || jogo.meuId === jogo.rastreador) return;
    if (jogo.abertas.includes(index)) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    let minhasAbertas = [...jogo.abertas];

    if (jogo.minas.includes(index)) {
        // CABUM! PISOU NA MINA!
        minhasAbertas.push(index);
        up[`cassino/campo_minado/abertas`] = JSON.stringify(minhasAbertas);
        up[`cassino/campo_minado/status`] = 'resultado';
        up[`cassino/campo_minado/vencedor`] = 'casa'; // Perderam
        up[`cassino/campo_minado/quemFinalizou`] = jogo.meuId;
        if (window.Haptics && navigator.vibrate) navigator.vibrate([300, 100, 500]);
    } else {
        // SEGURO!
        minhasAbertas.push(index);
        up[`cassino/campo_minado/abertas`] = JSON.stringify(minhasAbertas);
        if (window.Haptics && navigator.vibrate) navigator.vibrate(30);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
        
        // Verificação de Vitória Máxima (Limpou os 11 campos seguros)
        if (minhasAbertas.length === 11) {
            up[`cassino/campo_minado/status`] = 'resultado';
            up[`cassino/campo_minado/vencedor`] = 'jogadores_max';
            up[`cassino/campo_minado/quemFinalizou`] = jogo.meuId;
        }
    }
    await update(ref(db), up);
};

window.sacarCampoMinado = async function() {
    let jogo = window.motorCampoMinado;
    if (jogo.status !== 'jogando' || jogo.abertas.length === 0 || jogo.meuId === jogo.rastreador) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    await update(ref(db), {
        [`cassino/campo_minado/status`]: 'resultado',
        [`cassino/campo_minado/vencedor`]: 'saque',
        [`cassino/campo_minado/quemFinalizou`]: jogo.meuId
    });
};

window.processarFimCampoMinado = async function() {
    if (window.motorCampoMinado.quemFinalizou !== window.motorCampoMinado.meuId) return;
    let jogo = window.motorCampoMinado;
    
    if (jogo.vencedor === 'jogadores_max' || jogo.vencedor === 'saque') {
        let indiceMulti = jogo.abertas.length - 1;
        if (indiceMulti < 0) indiceMulti = 0;
        let multiAtual = jogo.multis[indiceMulti];
        
        let lucroFinal = Math.floor(jogo.poteInicial * multiAtual);
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(lucroFinal, `Fuga do Campo Minado (${multiAtual}x)`);
    }
};

window.renderizarMesaCampoMinado = function() {
    const jogo = window.motorCampoMinado;
    const painelAposta = document.getElementById('campominado-painel-aposta');
    const painelRes = document.getElementById('campominado-painel-resultado');
    const painelAcao = document.getElementById('campominado-painel-acao');
    const avisoCentro = document.getElementById('campominado-aviso-centro');
    const grid = document.getElementById('grid-campominado');

    if (avisoCentro) { avisoCentro.style.textAlign = "center"; avisoCentro.style.lineHeight = "1.4"; }
    
    let minhaAposta = Number(document.getElementById('campominado-valor-aposta').innerText) || 50;
    let apostaParceiro = jogo.apostas[jogo.parceiroId] || 0;
    
    // Atualiza Placar e Multiplicador
    let multiAtual = 1.0;
    if (jogo.abertas.length > 0) multiAtual = jogo.multis[jogo.abertas.length - 1];
    
    document.getElementById('campominado-passos-texto').innerText = `${jogo.abertas.length} / 11`;
    document.getElementById('campominado-multiplicador').innerText = multiAtual.toFixed(1);
    
    let poteParaExibir = jogo.status === 'apostando' ? (minhaAposta + apostaParceiro) : Math.floor(jogo.poteInicial * multiAtual);
    document.getElementById('campominado-lucro-valor').innerText = poteParaExibir;

    let euSouRastreador = (jogo.meuId === jogo.rastreador);
    let jogoAcabou = (jogo.status === 'resultado');

    if (grid) {
        grid.innerHTML = '';
        if (jogo.status === 'apostando') {
            for(let i=0; i<16; i++) grid.innerHTML += `<div style="width: 100%; aspect-ratio: 1; border-radius: 8px; background: rgba(0,0,0,0.5); border: 2px solid #444;"></div>`;
        } else {
            for(let i=0; i<16; i++) {
                let isMina = jogo.minas.includes(i);
                let isAberta = jogo.abertas.includes(i);
                grid.innerHTML += desenharCaixaCampoMinado(i, isMina, isAberta, euSouRastreador, jogoAcabou);
            }
        }
    }

    if (jogo.status === 'apostando') {
        if(painelAposta) painelAposta.classList.remove('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        
        if(avisoCentro) { avisoCentro.innerText = "Financie a expedição."; avisoCentro.style.color = "#9b59b6"; }
        const btnInic = document.getElementById('btn-iniciar-campominado');
        if (btnInic) {
            if (jogo.prontos[jogo.meuId]) { btnInic.innerText = "AGUARDANDO PARCEIRO... ⏳"; btnInic.style.background = "#555"; }
            else { btnInic.innerText = "FINANCIAR EXPEDIÇÃO 🔦"; btnInic.style.background = "linear-gradient(145deg, #9b59b6, #8e44ad)"; }
        }
    } 
    else if (jogo.status === 'jogando') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelRes) painelRes.classList.add('escondido');
        
        if (euSouRastreador) {
            if(painelAcao) painelAcao.classList.add('escondido');
            if(avisoCentro) { avisoCentro.innerText = "📡 VOCÊ É O RASTREADOR!\nGrite onde é seguro pisar!"; avisoCentro.style.color = "#e74c3c"; }
        } else {
            if(painelAcao && jogo.abertas.length > 0) painelAcao.classList.remove('escondido');
            if(avisoCentro) { avisoCentro.innerText = "🚶 VOCÊ É O EXPLORADOR!\nSiga as vozes. Cuidado onde pisa."; avisoCentro.style.color = "#00f2fe"; }
        }
    } 
    else if (jogo.status === 'resultado') {
        if(painelAposta) painelAposta.classList.add('escondido');
        if(painelAcao) painelAcao.classList.add('escondido');
        if(painelRes) painelRes.classList.remove('escondido');
        
        if (jogo.vencedor === 'jogadores_max') {
            if(avisoCentro) { avisoCentro.innerText = `🏆 ZERARAM O CAMPO!\nO Multiplicador Máximo (15x) é de vocês!`; avisoCentro.style.color = "#2ecc71"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof confetti === 'function') confetti({colors: ['#9b59b6', '#2ecc71'], particleCount: 500});
            }
        } else if (jogo.vencedor === 'saque') {
            if(avisoCentro) { avisoCentro.innerText = `💰 FUGIRAM VIVOS!\nVocês sacaram com ${multiAtual.toFixed(1)}x de Lucro!`; avisoCentro.style.color = "#f1c40f"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 1.0);
            }
        } else {
            if(avisoCentro) { avisoCentro.innerText = `💥 CABUM!\nO Explorador pisou na mina. Pote perdido.`; avisoCentro.style.color = "#e74c3c"; }
            if (jogo.quemFinalizou === jogo.meuId && !jogo.moedasPagas) {
                jogo.moedasPagas = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
                setTimeout(()=> { if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8); }, 500);
            }
        }
    }
};

window.resetarCampoMinado = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorCampoMinado.moedasPagas = false;
    await set(ref(db, `cassino/campo_minado`), {
        status: 'apostando', poteInicial: window.motorCampoMinado.poteInicial, 
        vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false }, 
        apostas: { joao: 0, thamiris: 0 }, rastreador: '', minas: '[]', abertas: '[]'
    });
};

// ==========================================
// 👽 MOTOR REAL-TIME: TRANSMISSÃO ALIENÍGENA (CAOS)
// ==========================================

window.motorTransmissao = {
    meuId: '', parceiroId: '', status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', moedasPagas: false,
    prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
    transmissor: '', senhaMestra: [], grade: [], cliques: [], ordemInversa: false, ultimaEmbaralhada: 0, endTime: 0
};
window.intervaloTransmissao = null;
const simbolosAlien = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎', '🔯', '♾️', '☯️'];

window.iniciarOuvinteTransmissao = function() {
    window.motorTransmissao.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorTransmissao.parceiroId = window.souJoao ? 'thamiris' : 'joao';
    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    if (!window.transmissaoResetadoNuclear) {
        window.transmissaoResetadoNuclear = true;
        set(ref(db, `cassino/transmissao`), {
            status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', 
            prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
            ordemInversa: false, ultimaEmbaralhada: 0
        });
    }

    onValue(ref(db, `cassino/transmissao`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};
            if (data.status === 'jogando' && !data.grade) { await resetarTransmissao(); return; }

            window.motorTransmissao.status = data.status || 'apostando';
            window.motorTransmissao.pote = Number(data.pote) || 0;
            window.motorTransmissao.vencedor = data.vencedor || null;
            window.motorTransmissao.quemFinalizou = data.quemFinalizou || '';
            window.motorTransmissao.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorTransmissao.apostas = data.apostas || { joao: 0, thamiris: 0 };
            window.motorTransmissao.transmissor = data.transmissor || '';
            window.motorTransmissao.ordemInversa = data.ordemInversa || false;
            window.motorTransmissao.ultimaEmbaralhada = Number(data.ultimaEmbaralhada) || 0;
            
            // Só regera a grade se vier nova do banco
            let novaGrade = JSON.parse(data.grade || "[]");
            if (JSON.stringify(window.motorTransmissao.grade) !== JSON.stringify(novaGrade) && window.motorTransmissao.meuId !== window.motorTransmissao.transmissor) {
                let gridUI = document.getElementById('grid-alien');
                if (gridUI) { gridUI.style.opacity = '0'; setTimeout(()=> { gridUI.style.opacity = '1'; }, 200); }
            }
            window.motorTransmissao.grade = novaGrade;
            
            window.motorTransmissao.senhaMestra = JSON.parse(data.senhaMestra || "[]");
            window.motorTransmissao.cliques = JSON.parse(data.cliques || "[]");
            window.motorTransmissao.endTime = Number(data.endTime) || 0;

            renderizarMesaTransmissao();
            gerenciarRelogioTransmissao();

            if (window.motorTransmissao.status === 'resultado' && !window.motorTransmissao.moedasPagas) processarFimTransmissao();
        } catch (e) { }
    });
};

window.ajustarApostaTransmissao = function(delta) {
    if (window.motorTransmissao.status !== 'apostando') return;
    if (window.motorTransmissao.prontos[window.motorTransmissao.meuId]) return; 
    let visor = document.getElementById('transmissao-valor-aposta');
    let nv = (Number(visor.innerText) || 50) + delta;
    visor.innerText = nv < 10 ? 10 : nv;
    document.getElementById('transmissao-pote-valor').innerText = (nv + (window.motorTransmissao.apostas[window.motorTransmissao.parceiroId] || 0)) * 5;
    if (window.Haptics && navigator.vibrate) navigator.vibrate(30);
};

window.iniciarTransmissao = async function() {
    let mAposta = Number(document.getElementById('transmissao-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    let meusProntos = { ...window.motorTransmissao.prontos }; meusProntos[window.motorTransmissao.meuId] = true;
    let minhasApostas = { ...window.motorTransmissao.apostas }; minhasApostas[window.motorTransmissao.meuId] = mAposta; 

    if (meusProntos[window.motorTransmissao.parceiroId]) {
        let pT = (minhasApostas.joao + minhasApostas.thamiris);
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-pT, `Decodificação`);
        
        let gradeF = [...simbolosAlien].sort(()=>Math.random() - 0.5);
        let senhaF = gradeF.slice(0, 4).sort(()=>Math.random() - 0.5);
        let trans = Math.random() > 0.5 ? 'joao' : 'thamiris';
        let isInversa = Math.random() > 0.5; // 50% de chance de ser invertido!

        await update(ref(db, `cassino/transmissao`), {
            status: 'jogando', apostas: minhasApostas, pote: pT * 5, transmissor: trans,
            ordemInversa: isInversa, ultimaEmbaralhada: Date.now(),
            senhaMestra: JSON.stringify(senhaF), grade: JSON.stringify(gradeF), cliques: '[]',
            endTime: Date.now() + 60000, prontos: {joao:false, thamiris:false}
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(ref(db, `cassino/transmissao`), { prontos: meusProntos, apostas: minhasApostas, status: 'apostando' });
    }
};

window.clicarSimboloAlien = async function(simbolo) {
    let jogo = window.motorTransmissao;
    if (jogo.status !== 'jogando' || jogo.meuId === jogo.transmissor || jogo.cliques.includes(simbolo)) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let clqs = [...jogo.cliques];
    let up = {};

    // Validação da ordem (Normal ou Inversa)
    let indexEsperado = jogo.ordemInversa ? (3 - clqs.length) : clqs.length;
    let simboloCorreto = jogo.senhaMestra[indexEsperado];

    if (simbolo === simboloCorreto) {
        clqs.push(simbolo);
        if (window.Haptics && navigator.vibrate) navigator.vibrate(30);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
        
        if (clqs.length === 4) {
            up[`cassino/transmissao/status`] = 'resultado';
            up[`cassino/transmissao/vencedor`] = 'jogadores';
            up[`cassino/transmissao/quemFinalizou`] = jogo.meuId;
        }
        up[`cassino/transmissao/cliques`] = JSON.stringify(clqs);
    } else {
        // ERRO! PUNICAO DE -10 SEGUNDOS!
        if (window.Haptics && navigator.vibrate) navigator.vibrate([100,50,100]);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
        
        // Efeito visual de dano no relógio
        let timerUI = document.getElementById('container-timer-transmissao');
        if (timerUI) {
            timerUI.style.background = "rgba(231, 76, 60, 0.4)";
            timerUI.style.transform = "scale(1.1)";
            setTimeout(()=> { timerUI.style.background = "rgba(231, 76, 60, 0.1)"; timerUI.style.transform = "scale(1)"; }, 300);
        }

        let novoTempo = jogo.endTime - 10000;
        up[`cassino/transmissao/endTime`] = novoTempo;
    }
    
    await update(ref(db), up);
};

function gerenciarRelogioTransmissao() {
    if (window.motorTransmissao.status !== 'jogando') {
        if (window.intervaloTransmissao) clearInterval(window.intervaloTransmissao); return;
    }
    if (window.intervaloTransmissao) clearInterval(window.intervaloTransmissao);
    const tmUI = document.getElementById('transmissao-timer');
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    window.intervaloTransmissao = setInterval(async () => {
        let agora = Date.now();
        let f = Math.ceil((window.motorTransmissao.endTime - agora) / 1000);
        
        if (f <= 0) {
            clearInterval(window.intervaloTransmissao);
            if (tmUI) tmUI.innerText = "00:00";
            if (window.motorTransmissao.meuId === window.motorTransmissao.transmissor && window.motorTransmissao.status === 'jogando') {
                await update(ref(db), { [`cassino/transmissao/status`]: 'resultado', [`cassino/transmissao/vencedor`]: 'casa', [`cassino/transmissao/quemFinalizou`]: window.motorTransmissao.meuId });
            }
        } else {
            if (tmUI) { tmUI.innerText = f >= 10 ? `00:${f}` : `00:0${f}`; tmUI.style.color = f <= 10 ? '#e74c3c' : '#2ecc71'; }
            
            // Embaralhamento Quântico a cada 12 segundos (Controlado pelo Host para evitar duplicação)
            if (window.souJoao && window.motorTransmissao.status === 'jogando') {
                if (agora - window.motorTransmissao.ultimaEmbaralhada > 12000) {
                    let novaGrade = [...window.motorTransmissao.grade].sort(()=>Math.random() - 0.5);
                    update(ref(db), { [`cassino/transmissao/grade`]: JSON.stringify(novaGrade), [`cassino/transmissao/ultimaEmbaralhada`]: agora }).catch(e=>{});
                }
            }
        }
    }, 1000);
}

window.processarFimTransmissao = async function() {
    if (window.motorTransmissao.quemFinalizou !== window.motorTransmissao.meuId) return;
    if (window.motorTransmissao.vencedor === 'jogadores' && typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(window.motorTransmissao.pote, `Protocolo Decodificado (5x)`);
};

window.renderizarMesaTransmissao = function() {
    const j = window.motorTransmissao;
    const pAp = document.getElementById('transmissao-painel-aposta');
    const pRe = document.getElementById('transmissao-painel-resultado');
    const aC = document.getElementById('transmissao-aviso-centro');
    const aTrans = document.getElementById('area-transmissor');
    const aRec = document.getElementById('area-receptor');
    
    document.getElementById('transmissao-pote-valor').innerText = j.status === 'apostando' ? ((Number(document.getElementById('transmissao-valor-aposta').innerText) || 50) + (j.apostas[j.parceiroId] || 0)) * 5 : j.pote;
    document.getElementById('transmissao-progresso-receptor').innerText = `${j.cliques.length} / 4`;

    if (j.status === 'apostando') {
        pAp.classList.remove('escondido'); pRe.classList.add('escondido'); aTrans.classList.add('escondido'); aRec.classList.add('escondido');
        aC.innerText = "Financie o Hack."; aC.style.color = "#8e44ad";
        const b = document.getElementById('btn-iniciar-transmissao');
        if (b) b.innerText = j.prontos[j.meuId] ? "AGUARDANDO... ⏳" : "HACKEAR SINAL 📡";
    } 
    else if (j.status === 'jogando') {
        pAp.classList.add('escondido'); pRe.classList.add('escondido');

        if (j.meuId === j.transmissor) {
            aTrans.classList.remove('escondido'); aRec.classList.add('escondido');
            
            // Protocolo Visor
            const visorP = document.getElementById('protocolo-alerta');
            if (j.ordemInversa) {
                visorP.innerText = "⚠️ CUIDADO: ORDEM REVERSA"; visorP.style.color = "#e74c3c"; visorP.style.borderColor = "#e74c3c"; visorP.style.background = "rgba(231,76,60,0.1)";
            } else {
                visorP.innerText = "✅ PROTOCOLO: ORDEM NORMAL"; visorP.style.color = "#2ecc71"; visorP.style.borderColor = "#2ecc71"; visorP.style.background = "rgba(46,204,113,0.1)";
            }

            // Exibe a senha, escurecendo as que já foram clicadas
            document.getElementById('transmissor-codigo').innerHTML = j.senhaMestra.map(s => `<span style="opacity:${j.cliques.includes(s) ? '0.2' : '1'}; transition: opacity 0.3s;">${s}</span>`).join('');
            aC.innerText = "VOCÊ É O TRANSMISSOR!\nDite os símbolos. Leia o protocolo!"; aC.style.color = "#00f2fe";
        } else {
            aTrans.classList.add('escondido'); aRec.classList.remove('escondido');
            document.getElementById('grid-alien').innerHTML = j.grade.map((s) => {
                let isCortado = j.cliques.includes(s);
                let bg = isCortado ? 'rgba(46, 204, 113, 0.4)' : 'linear-gradient(145deg, #2c0b3e, #150524)';
                let st = isCortado ? 'pointer-events: none; border-color: #2ecc71;' : 'cursor: pointer; border-color: #9b59b6;';
                return `<div onclick="clicarSimboloAlien('${s}')" style="width: 100%; aspect-ratio: 1; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 2rem; background: ${bg}; ${st} box-sizing: border-box; box-shadow: 0 5px 10px rgba(0,0,0,0.6);"> ${s} </div>`;
            }).join('');
            aC.innerText = "VOCÊ É O RECEPTOR!\nEscute a ordem. Ache os símbolos!"; aC.style.color = "#2ecc71";
        }
    } 
    else if (j.status === 'resultado') {
        pAp.classList.add('escondido'); aTrans.classList.add('escondido'); aRec.classList.add('escondido'); pRe.classList.remove('escondido');
        if (j.vencedor === 'jogadores') {
            aC.innerText = `🟢 SINAL DECODIFICADO!\nO Pote 5x é de vocês!`; aC.style.color = "#2ecc71";
            if (j.quemFinalizou === j.meuId && !j.moedasPagas) { j.moedasPagas = true; if(typeof confetti === 'function') confetti({colors: ['#8e44ad', '#2ecc71'], particleCount: 300}); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0); }
        } else {
            aC.innerText = `💥 HACK FALHOU!\nO tempo ou o sistema estourou.`; aC.style.color = "#e74c3c";
            if (j.quemFinalizou === j.meuId && !j.moedasPagas) { j.moedasPagas = true; if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8); }
        }
    }
};

window.resetarTransmissao = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorTransmissao.moedasPagas = false;
    await set(ref(db, `cassino/transmissao`), { 
        status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', 
        prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
        ordemInversa: false, ultimaEmbaralhada: 0 
    });
};


// ==========================================
// ☢️ MOTOR REAL-TIME: ESTABILIZADOR DE NÚCLEO
// ==========================================

window.motorReator = {
    meuId: '', parceiroId: '', status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', moedasPagas: false,
    prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 },
    nivel: 1, alvo: 0, carga: 0, botoesJ: [], botoesT: [], endTime: 0
};
window.intervaloReator = null;

window.iniciarOuvinteReator = function() {
    window.motorReator.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorReator.parceiroId = window.souJoao ? 'thamiris' : 'joao';
    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    if (!window.reatorResetadoNuclear) {
        window.reatorResetadoNuclear = true;
        set(ref(db, `cassino/reator`), { status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 } });
    }

    onValue(ref(db, `cassino/reator`), async (snapshot) => {
        try {
            const data = snapshot.val() || {};
            if (data.status === 'jogando' && !data.alvo) { await resetarReator(); return; }

            window.motorReator.status = data.status || 'apostando';
            window.motorReator.pote = Number(data.pote) || 0;
            window.motorReator.vencedor = data.vencedor || null;
            window.motorReator.quemFinalizou = data.quemFinalizou || '';
            window.motorReator.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorReator.apostas = data.apostas || { joao: 0, thamiris: 0 };
            window.motorReator.nivel = Number(data.nivel) || 1;
            window.motorReator.alvo = Number(data.alvo) || 0;
            window.motorReator.carga = Number(data.carga) || 0;
            window.motorReator.endTime = Number(data.endTime) || 0;
            window.motorReator.botoesJ = JSON.parse(data.botoesJ || "[]");
            window.motorReator.botoesT = JSON.parse(data.botoesT || "[]");

            renderizarMesaReator();
            gerenciarRelogioReator();

            if (window.motorReator.status === 'resultado' && !window.motorReator.moedasPagas) processarFimReator();
        } catch (e) { }
    });
};

function gerarBotoesEAlvo(nivel) {
    let bsJ = [Math.floor(Math.random()*10)+5, Math.floor(Math.random()*10)+5, -(Math.floor(Math.random()*8)+3)];
    let bsT = [Math.floor(Math.random()*10)+5, Math.floor(Math.random()*10)+5, -(Math.floor(Math.random()*8)+3)];
    let passos = nivel + 2; 
    let alvoSimulado = 0;
    for(let i=0; i<passos; i++) alvoSimulado += Math.random() > 0.5 ? bsJ[Math.floor(Math.random()*3)] : bsT[Math.floor(Math.random()*3)];
    if (alvoSimulado <= 0) alvoSimulado = bsJ[0] + bsT[0]; // Previne alvo negativo
    return { j: bsJ, t: bsT, a: alvoSimulado };
}

window.ajustarApostaReator = function(delta) {
    if (window.motorReator.status !== 'apostando') return;
    if (window.motorReator.prontos[window.motorReator.meuId]) return; 
    let v = document.getElementById('reator-valor-aposta');
    let nv = (Number(v.innerText) || 50) + delta;
    v.innerText = nv < 10 ? 10 : nv;
    document.getElementById('reator-pote-valor').innerText = (nv + (window.motorReator.apostas[window.motorReator.parceiroId] || 0)) * 5;
    if (window.Haptics && navigator.vibrate) navigator.vibrate(30);
};

window.iniciarReator = async function() {
    let mA = Number(document.getElementById('reator-valor-aposta').innerText) || 50;
    const { db, ref, update } = window.SantuarioApp.modulos;
    let mP = { ...window.motorReator.prontos }; mP[window.motorReator.meuId] = true;
    let mAp = { ...window.motorReator.apostas }; mAp[window.motorReator.meuId] = mA; 

    if (mP[window.motorReator.parceiroId]) {
        let pT = (mAp.joao + mAp.thamiris);
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-pT, `Calibragem`);
        
        let fase1 = gerarBotoesEAlvo(1);

        await update(ref(db, `cassino/reator`), {
            status: 'jogando', apostas: mAp, pote: pT * 5, nivel: 1, carga: 0, alvo: fase1.a,
            botoesJ: JSON.stringify(fase1.j), botoesT: JSON.stringify(fase1.t), endTime: Date.now() + 60000, 
            vencedor: null, quemFinalizou: '', prontos: {joao:false, thamiris:false}
        });
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(ref(db, `cassino/reator`), { prontos: mP, apostas: mAp, status: 'apostando' });
    }
};

window.apertarReator = async function(indiceBtn) {
    let j = window.motorReator;
    if (j.status !== 'jogando') return;
    const { db, ref, update } = window.SantuarioApp.modulos;
    let btnVal = j.meuId === 'joao' ? j.botoesJ[indiceBtn] : j.botoesT[indiceBtn];
    let nCarga = j.carga + btnVal;
    if (window.Haptics && navigator.vibrate) navigator.vibrate(20);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.5);
    await update(ref(db), { [`cassino/reator/carga`]: nCarga });
};

window.travarReator = async function() {
    let j = window.motorReator;
    if (j.status !== 'jogando') return;
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    if (j.carga === j.alvo) {
        if (window.Haptics && navigator.vibrate) navigator.vibrate([50,50]);
        if (j.nivel >= 5) {
            await update(ref(db), { [`cassino/reator/status`]: 'resultado', [`cassino/reator/vencedor`]: 'jogadores', [`cassino/reator/quemFinalizou`]: j.meuId });
        } else {
            let novaFase = gerarBotoesEAlvo(j.nivel + 1);
            await update(ref(db), { [`cassino/reator/nivel`]: j.nivel + 1, [`cassino/reator/carga`]: 0, [`cassino/reator/alvo`]: novaFase.a, [`cassino/reator/botoesJ`]: JSON.stringify(novaFase.j), [`cassino/reator/botoesT`]: JSON.stringify(novaFase.t) });
        }
    } else {
        if (window.Haptics && navigator.vibrate) navigator.vibrate([300,100,500]);
        await update(ref(db), { [`cassino/reator/status`]: 'resultado', [`cassino/reator/vencedor`]: 'casa', [`cassino/reator/quemFinalizou`]: j.meuId });
    }
};

function gerenciarRelogioReator() {
    if (window.motorReator.status !== 'jogando') {
        if (window.intervaloReator) clearInterval(window.intervaloReator); return;
    }
    if (window.intervaloReator) clearInterval(window.intervaloReator);
    const tmUI = document.getElementById('reator-timer');
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    window.intervaloReator = setInterval(async () => {
        let f = Math.ceil((window.motorReator.endTime - Date.now()) / 1000);
        if (f <= 0) {
            clearInterval(window.intervaloReator);
            if (tmUI) tmUI.innerText = "00:00";
            if (window.souJoao && window.motorReator.status === 'jogando') {
                await update(ref(db), { [`cassino/reator/status`]: 'resultado', [`cassino/reator/vencedor`]: 'casa', [`cassino/reator/quemFinalizou`]: 'joao' });
            }
        } else {
            if (tmUI) { tmUI.innerText = f >= 10 ? `00:${f}` : `00:0${f}`; tmUI.style.color = f <= 10 ? '#e74c3c' : '#2ecc71'; }
        }
    }, 1000);
}

window.processarFimReator = async function() {
    if (window.motorReator.quemFinalizou !== window.motorReator.meuId) return;
    if (window.motorReator.vencedor === 'jogadores' && typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(window.motorReator.pote, `Núcleo Estabilizado`);
};

window.renderizarMesaReator = function() {
    const j = window.motorReator;
    const pAp = document.getElementById('reator-painel-aposta');
    const pRe = document.getElementById('reator-painel-resultado');
    const aC = document.getElementById('reator-aviso-centro');
    const ctls = document.getElementById('reator-controles');
    const bT = document.getElementById('btn-reator-travar');
    
    document.getElementById('reator-pote-valor').innerText = j.status === 'apostando' ? ((Number(document.getElementById('reator-valor-aposta').innerText) || 50) + (j.apostas[j.parceiroId] || 0)) * 5 : j.pote;
    document.getElementById('reator-alvo-valor').innerText = j.status === 'jogando' ? j.alvo : "--";
    document.getElementById('reator-carga-atual').innerText = j.carga;
    document.getElementById('reator-nivel-texto').innerText = `${j.nivel} / 5`;

    if (j.carga === j.alvo && j.status === 'jogando') document.getElementById('reator-carga-atual').style.color = "#f1c40f";
    else document.getElementById('reator-carga-atual').style.color = "#2ecc71";

    if (j.status === 'apostando') {
        pAp.classList.remove('escondido'); pRe.classList.add('escondido'); ctls.classList.add('escondido'); bT.classList.add('escondido');
        document.getElementById('reator-nivel-visor').classList.add('escondido');
        aC.innerText = "Pague a taxa de controle."; aC.style.color = "#f39c12";
        const b = document.getElementById('btn-iniciar-reator');
        if (b) b.innerText = j.prontos[j.meuId] ? "AGUARDANDO... ⏳" : "INICIAR REATOR ☢️";
    } 
    else if (j.status === 'jogando') {
        pAp.classList.add('escondido'); pRe.classList.add('escondido'); ctls.classList.remove('escondido'); bT.classList.remove('escondido');
        document.getElementById('reator-nivel-visor').classList.remove('escondido');
        
        let meusBtns = j.meuId === 'joao' ? j.botoesJ : j.botoesT;
        if(meusBtns && meusBtns.length === 3) {
            document.getElementById('btn-reator-1').innerText = meusBtns[0] > 0 ? `+${meusBtns[0]}` : meusBtns[0];
            document.getElementById('btn-reator-2').innerText = meusBtns[1] > 0 ? `+${meusBtns[1]}` : meusBtns[1];
            document.getElementById('btn-reator-3').innerText = meusBtns[2] > 0 ? `+${meusBtns[2]}` : meusBtns[2];
        }
        aC.innerText = "IGUALE A CARGA ATUAL AO ALVO!"; aC.style.color = "#00f2fe";
    } 
    else if (j.status === 'resultado') {
        pAp.classList.add('escondido'); ctls.classList.add('escondido'); bT.classList.add('escondido'); pRe.classList.remove('escondido');
        if (j.vencedor === 'jogadores') {
            aC.innerText = `🟢 NÚCLEO ESTABILIZADO!\nOs 5 níveis foram vencidos!`; aC.style.color = "#2ecc71";
            if (j.quemFinalizou === j.meuId && !j.moedasPagas) { j.moedasPagas = true; if(typeof confetti === 'function') confetti({colors: ['#f39c12', '#2ecc71'], particleCount: 300}); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0); }
        } else {
            aC.innerText = `💥 COLAPSO TOTAL!\nA matemática falhou ou o tempo acabou.`; aC.style.color = "#e74c3c";
            if (j.quemFinalizou === j.meuId && !j.moedasPagas) { j.moedasPagas = true; if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8); }
        }
    }
};

window.resetarReator = async function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    window.motorReator.moedasPagas = false;
    await set(ref(db, `cassino/reator`), { status: 'apostando', pote: 0, vencedor: null, quemFinalizou: '', prontos: { joao: false, thamiris: false }, apostas: { joao: 0, thamiris: 0 } });
};