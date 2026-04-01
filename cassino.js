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

// ============================================================================
// 🚪 ROTEADOR GERAL: ARENA CONEXÃO (ATUALIZADO: CASINO BRIDGE)
// ============================================================================
if (typeof window.roteadorCapturado === 'undefined') {
    window.originalAbrirMesa = window.abrirMesaCassino;
    window.roteadorCapturado = true;
}

window.abrirMesaCassino = function(nomeDoJogo) {
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
    if (idMesa.includes('roleta')) idMesa = 'roleta-multi';
    if (idMesa.includes('poker') && !idMesa.includes('carib')) idMesa = 'poker';
    if (idMesa.includes('craps') || idMesa.includes('dados')) idMesa = 'craps';
    if (idMesa.includes('sic') || idMesa.includes('trindade')) idMesa = 'sicbo';
    if (idMesa.includes('baccarat') || idMesa.includes('bacara')) idMesa = 'baccarat';
    if (idMesa.includes('carib')) idMesa = 'carib';
    if (idMesa.includes('paigow') || idMesa.includes('pai')) idMesa = 'paigow';
    if (idMesa.includes('wheel') || idMesa.includes('fortuna')) idMesa = 'wheel';
    // 🚨 ADICIONADO RECONHECIMENTO DO CASINO BRIDGE
    if (idMesa.includes('bridge') || idMesa.includes('ponte')) idMesa = 'bridge';

    const mesa = document.getElementById('mesa-' + idMesa);
    if(mesa) { mesa.classList.remove('escondido'); mesa.style.display = 'flex'; }
    
    if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();

    if (idMesa === 'uno' && typeof iniciarOuvinteUno === 'function') iniciarOuvinteUno();
    else if (idMesa === 'poker' && typeof iniciarOuvintePoker === 'function') iniciarOuvintePoker();
    else if (idMesa === 'roleta-multi' && typeof iniciarOuvinteRoletaMulti === 'function') iniciarOuvinteRoletaMulti();
    else if (idMesa === 'craps' && typeof iniciarOuvinteCraps === 'function') iniciarOuvinteCraps();
    else if (idMesa === 'sicbo' && typeof iniciarOuvinteSicBo === 'function') iniciarOuvinteSicBo();
    else if (idMesa === 'baccarat' && typeof iniciarOuvinteBaccarat === 'function') iniciarOuvinteBaccarat();
    else if (idMesa === 'carib' && typeof iniciarOuvinteCarib === 'function') iniciarOuvinteCarib();
    else if (idMesa === 'paigow' && typeof iniciarOuvintePaiGow === 'function') iniciarOuvintePaiGow();
    else if (idMesa === 'wheel' && typeof iniciarOuvinteWheel === 'function') iniciarOuvinteWheel();
    // 🚨 IGNICÃO DO BRIDGE
    else if (idMesa === 'bridge' && typeof iniciarOuvinteBridge === 'function') iniciarOuvinteBridge();
    
    else if (typeof window.originalAbrirMesa === 'function') window.originalAbrirMesa(nomeDoJogo);
};

// ============================================================================
// 🌉 MOTOR REAL-TIME: CASINO BRIDGE ROYALE (RED DOG CO-OP)
// ============================================================================

window.motorBridge = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAnte: 50,
    vitoriaComemorada: false, quemFinalizou: '', spread: 0,
    prontos: { joao: false, thamiris: false },
    cartas: { pilar1: null, pilar2: null, passo: null },
    acaoEquipe: '' // 'atravessar', 'recuar' ou 'auto'
};

window.fecharMesaBridge = function() {
    const mesa = document.getElementById('mesa-bridge');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function safeParseBridge(val) {
    if (typeof val === 'object' && val !== null) return val;
    if (typeof val === 'string' && val.trim() !== '') {
        try { return JSON.parse(val); } catch(e) { return null; }
    }
    return null;
}

function gerarBaralhoBridge() {
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

function criarDivCartaBridge(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s; width: 70px; height: 100px; font-size: 1.1em;">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro" style="font-size: 2.2rem;">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

function getValorNumericoBridge(valStr) {
    const mapa = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    return mapa[valStr] || 0;
}

window.iniciarOuvinteBridge = function() {
    window.motorBridge.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorBridge.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/bridge_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorBridge.status = data.status || 'apostando';
            window.motorBridge.quemFinalizou = data.quemFinalizou || '';
            window.motorBridge.apostaAnte = Number(data.apostaAnte) || 50;
            window.motorBridge.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorBridge.spread = data.spread || 0;
            window.motorBridge.acaoEquipe = data.acaoEquipe || '';
            
            const cData = data.cartas || {};
            window.motorBridge.cartas = {
                pilar1: safeParseBridge(cData.pilar1),
                pilar2: safeParseBridge(cData.pilar2),
                passo: safeParseBridge(cData.passo)
            };

            renderMesaBridge();

            if (window.motorBridge.status === 'resultado' && !window.motorBridge.vitoriaComemorada) {
                window.motorBridge.vitoriaComemorada = true;
                processarFimBridge();
            }
        } catch (e) {
            console.error("Erro na leitura do Bridge:", e);
        }
    });

    const visor = document.getElementById('bridge-valor-aposta');
    if (visor) visor.innerText = window.motorBridge.apostaAnte;
};

window.ajustarApostaBridge = function(delta) {
    if (window.motorBridge.status !== 'apostando') return;
    if (window.motorBridge.prontos[window.motorBridge.meuId]) return;
    
    let atual = Number(window.motorBridge.apostaAnte) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    const maxAposta = Math.floor(saldo / 6); // Limite de segurança porque a aposta pode dobrar
    if (novoValor > maxAposta) novoValor = maxAposta;
    if (novoValor < 10) novoValor = 10;
    
    window.motorBridge.apostaAnte = novoValor;
    const visor = document.getElementById('bridge-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.iniciarRodadaBridge = async function() {
    if (window.motorBridge.status !== 'apostando') return;
    if (window.motorBridge.prontos[window.motorBridge.meuId]) return;

    let ante = Number(window.motorBridge.apostaAnte);
    if (isNaN(ante) || ante <= 0) return;

    let custoTotal = ante * 2; // Um ante do João, um da Thamiris
    if (Number(window.pontosDoCasal) < custoTotal) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente no Cofre!", "💸");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const bridgeRef = ref(db, `cassino/bridge_royale`);

    const snap = await get(bridgeRef);
    let prontos = (snap.val() || {}).prontos || { joao: false, thamiris: false };
    prontos[window.motorBridge.meuId] = true;

    if (prontos[window.motorBridge.parceiroId] === true) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoTotal, `Casino Bridge (Pedágio)`);
        }

        let baralho = gerarBaralhoBridge(); 
        let c1 = baralho.pop();
        let c2 = baralho.pop();
        let c3 = baralho.pop(); // A carta do destino (escondida no Firebase)

        // Organiza Pilar1 para ser sempre o menor
        let v1 = getValorNumericoBridge(c1.valor);
        let v2 = getValorNumericoBridge(c2.valor);
        if (v1 > v2) {
            let temp = c1; c1 = c2; c2 = temp;
            let tempV = v1; v1 = v2; v2 = tempV;
        }

        let spread = v2 - v1 - 1;
        let novoStatus = 'atravessando';
        let quemFim = '';
        let acaoAuto = '';

        // 🧠 AUTOMAÇÃO: Se for Par ou Consecutivo, resolve na hora!
        if (spread <= 0) {
            novoStatus = 'resultado';
            quemFim = window.motorBridge.meuId;
            acaoAuto = 'auto';
        }

        await update(bridgeRef, {
            status: novoStatus,
            apostaAnte: ante,
            quemFinalizou: quemFim,
            spread: spread,
            acaoEquipe: acaoAuto,
            cartas: { pilar1: JSON.stringify(c1), pilar2: JSON.stringify(c2), passo: JSON.stringify(c3) },
            prontos: { joao: false, thamiris: false } 
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(bridgeRef, { prontos: prontos, apostaAnte: ante });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando Aliado pagar Pedágio...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

window.acaoBridge = async function(escolha) {
    if (window.motorBridge.status !== 'atravessando') return;
    if (window.motorBridge.prontos[window.motorBridge.meuId]) return;

    const ante = Number(window.motorBridge.apostaAnte);
    const custoTravessia = ante * 2; // O "Call" (Cross) custa o mesmo que o Ante pago. Então 2x de débito na conta.

    if (escolha === 'atravessar') {
        const saldo = Number(window.pontosDoCasal);
        if (saldo < custoTravessia) {
            if(typeof mostrarToast === 'function') mostrarToast("Fichas insuficientes para Atravessar!", "💸");
            return;
        }
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoTravessia, `Casino Bridge (Travessia)`);
        }
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const bridgeRef = ref(db, `cassino/bridge_royale`);

    const snap = await get(bridgeRef);
    let dataAtual = snap.val() || {};
    let prontos = dataAtual.prontos || { joao: false, thamiris: false };
    
    prontos[window.motorBridge.meuId] = true;
    let up = { prontos: prontos };

    // Se um decidir recuar, a equipe toda recua (Decisão drástica Co-op)
    let acaoDefinitiva = (dataAtual.acaoEquipe === 'recuar' || escolha === 'recuar') ? 'recuar' : 'atravessar';
    up.acaoEquipe = acaoDefinitiva;

    if (prontos[window.motorBridge.parceiroId] === true) {
        up.status = 'resultado';
        up.quemFinalizou = window.motorBridge.meuId; 
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Decisão tomada. Aguardando parceiro...", "🔒");
    }

    await update(bridgeRef, up);
};

async function processarFimBridge() {
    const ante = Number(window.motorBridge.apostaAnte);
    const cb = window.motorBridge.cartas;
    const spread = window.motorBridge.spread;
    const acao = window.motorBridge.acaoEquipe;
    let ganhoTotal = 0;

    let v1 = getValorNumericoBridge(cb.pilar1.valor);
    let v2 = getValorNumericoBridge(cb.pilar2.valor);
    let v3 = getValorNumericoBridge(cb.passo.valor);

    // 🧠 A MATEMÁTICA CRUEL DA PONTE
    if (acao === 'recuar') {
        // Fugiram. O Ante foi perdido. Volta Zero.
        ganhoTotal = 0;
    } 
    else if (spread === -1) {
        // Os Pilares são um PAR.
        if (v3 === v1) {
            // Trinca! Paga 11:1 no Ante. 
            ganhoTotal = (ante * 2) + ((ante * 2) * 11);
        } else {
            // Empate. Devolve o Ante.
            ganhoTotal = ante * 2;
        }
    } 
    else if (spread === 0) {
        // Consecutivos (Não há ponte). Empate. Devolve o Ante.
        ganhoTotal = ante * 2;
    } 
    else if (acao === 'atravessar' || acao === 'auto') {
        // Decidiram cruzar a ponte! O custo total na mesa agora é Ante + Travessia = 4x Ante.
        const custoTotalPago = ante * 4;
        
        if (v3 > v1 && v3 < v2) {
            // Sucesso! Bateu dentro do Spread.
            let mult = 1;
            if (spread === 1) mult = 5;
            else if (spread === 2) mult = 4;
            else if (spread === 3) mult = 2;
            
            // O Ante paga 1:1, a Travessia paga o Multiplicador
            ganhoTotal = custoTotalPago + ((ante * 2) * mult);
        } else {
            // Caiu fora da ponte ou bateu na trave (empate com pilar perde).
            ganhoTotal = 0;
        }
    }

    // 1️⃣ FESTA VISUAL PARA OS DOIS
    setTimeout(() => {
        if (ganhoTotal > (ante * 4)) {
            if(typeof confetti === 'function') confetti({colors: ['#00d2d3', '#f1c40f'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`TRAVESSIA ÉPICA! +${ganhoTotal} 💰!`, "🌉");
        } else if (ganhoTotal > 0) {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`SALVOS! +${ganhoTotal} devolvidos.`, "🤝");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Ponte quebrou... 💀`, "💸");
        }
    }, 1500);

    // 2️⃣ TRANSAÇÃO SEGURA E RESET
    if (window.motorBridge.quemFinalizou === window.motorBridge.meuId) {
        setTimeout(async () => {
            if (ganhoTotal > 0) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Casino Bridge`);
            }
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, `cassino/bridge_royale`), {
                status: 'apostando', apostaAnte: window.motorBridge.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}, acaoEquipe: '', spread: 0
            });
        }, 1600);
    }
}

function renderMesaBridge() {
    const cb = window.motorBridge;
    const painelAposta = document.getElementById('bridge-painel-aposta');
    const painelAcao = document.getElementById('bridge-painel-acao');
    const btnNovaMao = document.getElementById('btn-bridge-novamao');
    const pilar1 = document.getElementById('bridge-pilar1');
    const pilar2 = document.getElementById('bridge-pilar2');
    const passo = document.getElementById('bridge-passo');
    const infoSpread = document.getElementById('bridge-info-spread');
    const infoRes = document.getElementById('bridge-resultado-jogador');

    if (!painelAposta) return;

    if (cb.status === 'apostando') {
        painelAposta.style.display = 'flex';
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.add('escondido');
        
        pilar1.innerHTML = ''; pilar1.style.border = "2px dashed rgba(255,255,255,0.2)";
        pilar2.innerHTML = ''; pilar2.style.border = "2px dashed rgba(255,255,255,0.2)";
        passo.innerHTML = ''; passo.style.border = "2px solid #f1c40f";
        
        infoSpread.innerText = 'Distância: ?';
        infoRes.innerText = 'AGUARDANDO PEDÁGIO';
        infoRes.style.color = '#f1c40f';

        const btnInic = document.getElementById('btn-iniciar-bridge');
        if (cb.prontos[cb.meuId]) {
            btnInic.innerText = "AGUARDANDO... ⏳"; btnInic.style.background = "#555";
        } else {
            btnInic.innerText = "ERGUER PILARES 🏛️"; btnInic.style.background = "linear-gradient(145deg, #00d2d3, #01a3a4)";
        }
        return; 
    }

    painelAposta.style.display = 'none';

    // Renderiza Pilares
    if (cb.cartas.pilar1 && pilar1.innerHTML === '') {
        pilar1.style.border = "none";
        pilar1.innerHTML = criarDivCartaBridge(cb.cartas.pilar1, 0.1);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.5);
    }
    if (cb.cartas.pilar2 && pilar2.innerHTML === '') {
        pilar2.style.border = "none";
        setTimeout(()=> { 
            pilar2.innerHTML = criarDivCartaBridge(cb.cartas.pilar2, 0.1); 
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.5);
        }, 300);
    }

    // Textos Intermediários
    if (cb.spread === -1) infoSpread.innerText = '⚠️ OS PILARES SÃO IGUAIS (PAR)';
    else if (cb.spread === 0) infoSpread.innerText = '⚠️ SEM ESPAÇO (CONSECUTIVAS)';
    else infoSpread.innerText = `Distância: ${cb.spread} Cartas`;

    if (cb.status === 'atravessando') {
        painelAcao.classList.remove('escondido');
        infoRes.innerText = `VÃO ATRAVESSAR A PONTE?`;
        
        const btnCruzar = document.getElementById('btn-bridge-cruzar');
        const btnRecuar = document.getElementById('btn-bridge-recuar');
        if (cb.prontos[cb.meuId]) {
            btnCruzar.innerText = "AGUARDANDO... ⏳"; btnCruzar.style.background = "#555";
            btnRecuar.innerText = "⏳"; btnRecuar.style.background = "#555";
        } else {
            btnCruzar.innerText = `ATRAVESSAR (+${cb.apostaAnte * 2}💰)`; btnCruzar.style.background = "linear-gradient(145deg, #f1c40f, #f39c12)";
            btnRecuar.innerText = "RECUAR"; btnRecuar.style.background = "linear-gradient(145deg, #e74c3c, #c0392b)";
        }
    } 
    else if (cb.status === 'resultado') {
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.remove('escondido');

        if (cb.acaoEquipe === 'recuar') {
            infoRes.innerText = `A EQUIPE RECUOU (FOLD)`;
            infoRes.style.color = '#e74c3c';
        } else {
            // Revela a carta destino com suspense
            if (cb.cartas.passo && passo.innerHTML === '') {
                passo.style.border = "none";
                setTimeout(()=> { 
                    passo.innerHTML = criarDivCartaBridge(cb.cartas.passo, 0.1);
                    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
                    
                    // Avalia na tela o resultado
                    let v1 = getValorNumericoBridge(cb.cartas.pilar1.valor);
                    let v2 = getValorNumericoBridge(cb.cartas.pilar2.valor);
                    let v3 = getValorNumericoBridge(cb.cartas.passo.valor);
                    
                    if (cb.spread === -1 && v3 === v1) { infoRes.innerText = `🔥 TRINCA JACKPOT!`; infoRes.style.color = '#00d2d3'; }
                    else if (cb.spread <= 0) { infoRes.innerText = `EMPATE SEGURO!`; infoRes.style.color = '#bdc3c7'; }
                    else if (v3 > v1 && v3 < v2) { infoRes.innerText = `TRAVESSIA CONCLUÍDA!`; infoRes.style.color = '#2ecc71'; }
                    else { infoRes.innerText = `A PONTE QUEBROU!`; infoRes.style.color = '#e74c3c'; }
                }, 800);
            }
        }
    }
}

// 🚨 A FUNÇÃO QUE FALTAVA: Reseta a mesa para a próxima rodada
window.resetarMesaBridge = async function() {
    window.motorBridge.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    // Limpa as cartas e zera a mesa na nuvem
    await set(ref(db, `cassino/bridge_royale`), {
        status: 'apostando', 
        apostaAnte: window.motorBridge.apostaAnte, 
        quemFinalizou: '', 
        prontos: {joao: false, thamiris: false}, 
        acaoEquipe: '', 
        spread: 0,
        cartas: { pilar1: null, pilar2: null, passo: null }
    });
};

// ============================================================================
// 🎡 MOTOR REAL-TIME: WHEEL OF FORTUNE (SINCRONIA E FÍSICA ACUMULATIVA)
// ============================================================================

// A roda tem 12 fatias exatas na ordem do nosso gradiente CSS (Sentido Horário)
const fatiasWheel = ['1', '2', '1', '5', '1', '2', '10', '1', '2', '5', '20', 'jackpot'];
window.anguloGlobalWheel = 0; // Essencial para a roda nunca voltar para trás

window.motorWheel = {
    meuId: '', parceiroId: '',
    status: 'apostando',
    apostas: {},
    resultadoSorteado: null,
    quemFinalizou: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } 
};

// Áudio mecânico da roleta (reciclado)
const somCatracaWheel = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

window.fecharMesaWheel = function() {
    const mesa = document.getElementById('mesa-wheel');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
    if (!somCatracaWheel.paused) somCatracaWheel.pause();
};

window.iniciarOuvinteWheel = function() {
    window.motorWheel.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorWheel.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/wheel_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            // Gatilho de Física: Se o status mudou para girando AGORA, roda a animação
            if (data.status === 'girando' && window.motorWheel.status !== 'girando') {
                window.motorWheel.resultadoSorteado = data.resultadoSorteado;
                window.motorWheel.quemFinalizou = data.quemFinalizou;
                window.motorWheel.status = 'girando';
                animarGiroWheel();
            }

            window.motorWheel.status = data.status || 'apostando';
            window.motorWheel.apostas = data.apostas || {};
            window.motorWheel.resultadoSorteado = data.resultadoSorteado || null;
            window.motorWheel.quemFinalizou = data.quemFinalizou || '';
            window.motorWheel.prontos = data.prontos || { joao: false, thamiris: false };

            renderMesaWheel();
        } catch (e) {
            console.error("Erro no ouvinte da Wheel:", e);
        }
    });

    const visor = document.getElementById('wheel-ficha-valor');
    if (visor) visor.innerText = window.motorWheel.valorFicha;
};

window.ajustarFichaWheel = function(delta) {
    if (window.motorWheel.status !== 'apostando') return;
    if (window.motorWheel.prontos[window.motorWheel.meuId]) return;
    
    let atual = Number(window.motorWheel.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorWheel.valorFicha = novoValor;
    const visor = document.getElementById('wheel-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarWheel = async function(tipo) {
    if (window.motorWheel.status !== 'apostando') return;
    
    if (window.motorWheel.prontos[window.motorWheel.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Você já confirmou sua aposta!", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorWheel.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta Wheel: ${tipo.toUpperCase()}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/wheel_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorWheel.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasWheel = async function() {
    if (window.motorWheel.status !== 'apostando') return;
    if (window.motorWheel.prontos[window.motorWheel.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Apostas travadas. Aguarde o giro!", "🔒");
        return;
    }

    let totalDevolvido = 0;
    Object.values(window.motorWheel.apostas).forEach(ap => {
        if (ap.autor === window.motorWheel.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Wheel");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/wheel_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaWheel() {
    const statusTxt = document.getElementById('wheel-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorWheel.status === 'girando' ? "A SORTE ESTÁ LANÇADA..." : "FAÇAM SUAS APOSTAS";
        statusTxt.style.color = window.motorWheel.status === 'girando' ? "#f1c40f" : "#9b59b6";
    }

    document.querySelectorAll('#wheel-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorWheel.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-wheel-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    const btnLancar = document.getElementById('btn-girar-wheel');
    if (btnLancar) {
        if (window.motorWheel.prontos[window.motorWheel.meuId]) {
            btnLancar.innerText = "AGUARDANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "GIRAR RODA 🎡";
            btnLancar.style.background = "linear-gradient(145deg, #9b59b6, #8e44ad)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(155, 89, 182, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#fff";
        }
    }
}

// 🚨 O SORTEIO DE SINCRONIA DUPLA
window.girarWheelCoop = async function() {
    if (window.motorWheel.status !== 'apostando') return;
    if (window.motorWheel.prontos[window.motorWheel.meuId]) return;

    if (Object.keys(window.motorWheel.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("A roda precisa de fichas para girar!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const wheelRef = ref(db, `cassino/wheel_royale`);

    const snap = await get(wheelRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    prontos[window.motorWheel.meuId] = true;

    if (prontos[window.motorWheel.parceiroId] === true) {
        // O Cassino Sorteia um índice de 0 a 11 (As 12 Fatias)
        const indSorteado = Math.floor(Math.random() * 12);

        await update(wheelRef, {
            status: 'girando',
            resultadoSorteado: indSorteado,
            quemFinalizou: window.motorWheel.meuId,
            prontos: { joao: false, thamiris: false } 
        });
    } else {
        await update(wheelRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando confirmação...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarGiroWheel() {
    const disco = document.getElementById('wheel-disco');
    const resVisor = document.getElementById('wheel-resultado-visor');
    if (!disco || !resVisor || window.motorWheel.resultadoSorteado === null) return;

    resVisor.classList.add('escondido');
    
    if(!window.SantuarioSomPausado) {
        somCatracaWheel.currentTime = 0;
        somCatracaWheel.play().catch(()=>{});
    }

    // 🚨 MATEMÁTICA CSS ACUMULATIVA:
    // A Roda tem 12 fatias de 30 graus. O meio da fatia '0' fica aos 15 graus.
    // Para a fatia sorteada ficar no topo, giramos no mínimo 10 voltas (3600 graus) + o ajuste da fatia.
    window.anguloGlobalWheel += 3600; 
    
    const indice = window.motorWheel.resultadoSorteado;
    const ajuste = (indice * 30) + 15;
    const anguloFinal = window.anguloGlobalWheel + (360 - ajuste);

    disco.style.transition = 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)';
    disco.style.transform = `rotate(${anguloFinal}deg)`;

    // Após 5 segundos de giro de tirar o fôlego...
    setTimeout(() => {
        somCatracaWheel.pause();
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        
        const valorFatia = fatiasWheel[indice];
        document.getElementById('wheel-res-texto').innerText = valorFatia === 'jackpot' ? '⭐' : `${valorFatia}x`;
        resVisor.classList.remove('escondido');

        processarRecompensaWheel();
    }, 5100);
}

// 🚨 O POP-UP APARECE PARA OS DOIS, MAS O COFRE SÓ É PROCESSADO POR UM
async function processarRecompensaWheel() {
    const indice = window.motorWheel.resultadoSorteado;
    const resultTipo = fatiasWheel[indice];
    
    let ganhoTotal = 0;
    
    // Tabela de Pagamentos Padrão (Pays "To One")
    // Apostar 50 no 10x, retorna 50 + 500 = 550. Multiplicador total = 11.
    const pagamentos = {
        '1': 2,
        '2': 3,
        '5': 6,
        '10': 11,
        '20': 21,
        'jackpot': 41
    };

    const multFinal = pagamentos[resultTipo];

    Object.values(window.motorWheel.apostas).forEach(ap => {
        if (ap.tipo === resultTipo) {
            ganhoTotal += (Number(ap.valor) * multFinal);
        }
    });

    // 1️⃣ A FESTA VISUAL PARA OS DOIS
    setTimeout(() => {
        if (ganhoTotal > 0) {
            if(typeof confetti === 'function') confetti({colors: ['#9b59b6', '#f1c40f'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A RODA PAGOU +${ganhoTotal} 💰!`, "🎡");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Banca engoliu as fichas... 💀`, "💸");
        }
    }, 100);

    // 2️⃣ A TRANSAÇÃO FINANCEIRA (Só roda no celular do Último a Clicar)
    if (window.motorWheel.quemFinalizou === window.motorWheel.meuId) {
        setTimeout(async () => {
            if (ganhoTotal > 0) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Wheel of Fortune (${resultTipo})`);
            }
            
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, `cassino/wheel_royale`), { 
                status: 'apostando', apostas: {}, resultadoSorteado: null, quemFinalizou: '', prontos: {joao: false, thamiris: false} 
            });
            
            document.getElementById('wheel-resultado-visor').classList.add('escondido');
        }, 3000); // Reseta a mesa após 3 segundos do pop-up
    }
}

// ============================================================================
// 🀄 MOTOR REAL-TIME: PAI GOW TILES (BLINDADO CONTRA JSON ERRORS)
// ============================================================================

window.motorPaiGow = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAnte: 50,
    vitoriaComemorada: false, quemFinalizou: '',
    prontos: { joao: false, thamiris: false },
    dealer: { high: [], low: [], scoreHigh: 0, scoreLow: 0 },
    jogadores: { 
        joao: { high: [], low: [], scoreHigh: 0, scoreLow: 0 }, 
        thamiris: { high: [], low: [], scoreHigh: 0, scoreLow: 0 } 
    }
};

window.fecharMesaPaiGow = function() {
    const mesa = document.getElementById('mesa-paigow');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarPecasPaiGow() {
    let tiles = [];
    for(let i=1; i<=6; i++) {
        for(let j=i; j<=6; j++) {
            tiles.push({v1: i, v2: j});
            tiles.push({v1: i, v2: j}); 
        }
    }
    return tiles.sort(() => Math.random() - 0.5);
}

function criarDivPaiGow(peca, delay) {
    if (!peca) return '';
    return `<div class="paigow-tile animacao-distribuir" style="animation-delay: ${delay}s">
        <div class="pt-top">${peca.v1}</div>
        <div class="pt-divisor"></div>
        <div class="pt-bot">${peca.v2}</div>
    </div>`;
}

function calcPtsPaiGow(t1, t2) {
    if (!t1 || !t2) return 0;
    let isPair = (t1.v1 === t2.v1 && t1.v2 === t2.v2) || (t1.v1 === t2.v2 && t1.v2 === t2.v1);
    let score = (t1.v1 + t1.v2 + t2.v1 + t2.v2) % 10;
    if (isPair) score += 100;
    return score;
}

function stringScore(pts) {
    if (pts >= 100) return `PAR`;
    return `${pts}`;
}

function otimizarPaiGow(mao) {
    if (!mao || mao.length < 4) return { high: [], low: [], scoreHigh: 0, scoreLow: 0 };
    
    let splits = [
        {h1: mao[0], h2: mao[1], l1: mao[2], l2: mao[3]},
        {h1: mao[0], h2: mao[2], l1: mao[1], l2: mao[3]},
        {h1: mao[0], h2: mao[3], l1: mao[1], l2: mao[2]}
    ];
    let bestSplit = null;
    let bestScore = -1;

    splits.forEach(s => {
        let s1 = calcPtsPaiGow(s.h1, s.h2);
        let s2 = calcPtsPaiGow(s.l1, s.l2);
        let high = Math.max(s1, s2);
        let low = Math.min(s1, s2);
        
        let score = (low * 10) + high; 
        if (score > bestScore) {
            bestScore = score;
            bestSplit = {
                high: s1 === high ? [s.h1, s.h2] : [s.l1, s.l2],
                low: s1 === high ? [s.l1, s.l2] : [s.h1, s.h2],
                scoreHigh: high,
                scoreLow: low
            };
        }
    });
    return bestSplit;
}

// 🛡️ O SANITIZADOR DE ARRAYS (Adeus erro de JSON!)
function safeParsePG(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim() !== '') {
        try { return JSON.parse(val); } catch(e) { return []; }
    }
    return [];
}

window.iniciarOuvintePaiGow = function() {
    window.motorPaiGow.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorPaiGow.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/paigow_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorPaiGow.status = data.status || 'apostando';
            window.motorPaiGow.quemFinalizou = data.quemFinalizou || '';
            window.motorPaiGow.apostaAnte = Number(data.apostaAnte) || 50;
            window.motorPaiGow.prontos = data.prontos || { joao: false, thamiris: false };
            
            const dData = data.dealer || {};
            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            // Limpeza cirúrgica dos Arrays
            window.motorPaiGow.dealer = {
                high: safeParsePG(dData.high),
                low: safeParsePG(dData.low),
                scoreHigh: dData.scoreHigh || 0,
                scoreLow: dData.scoreLow || 0
            };

            window.motorPaiGow.jogadores = {
                joao: { 
                    high: safeParsePG(jInfo.high), 
                    low: safeParsePG(jInfo.low), 
                    scoreHigh: jInfo.scoreHigh || 0, 
                    scoreLow: jInfo.scoreLow || 0 
                },
                thamiris: { 
                    high: safeParsePG(tInfo.high), 
                    low: safeParsePG(tInfo.low), 
                    scoreHigh: tInfo.scoreHigh || 0, 
                    scoreLow: tInfo.scoreLow || 0 
                }
            };

            renderMesaPaiGow();

            if (window.motorPaiGow.status === 'resultado' && !window.motorPaiGow.vitoriaComemorada) {
                window.motorPaiGow.vitoriaComemorada = true;
                processarFimPaiGow();
            }
        } catch (e) {
            console.error("Erro na leitura do Pai Gow:", e);
        }
    });

    const visor = document.getElementById('paigow-valor-aposta');
    if (visor) visor.innerText = window.motorPaiGow.apostaAnte;
};

window.ajustarApostaPaiGow = function(delta) {
    if (window.motorPaiGow.status !== 'apostando') return;
    if (window.motorPaiGow.prontos[window.motorPaiGow.meuId]) return;
    
    let atual = Number(window.motorPaiGow.apostaAnte) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    const maxAposta = Math.floor(saldo / 2); 
    if (novoValor > maxAposta) novoValor = maxAposta;
    if (novoValor < 10) novoValor = 10;
    
    window.motorPaiGow.apostaAnte = novoValor;
    const visor = document.getElementById('paigow-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.iniciarRodadaPaiGow = async function() {
    if (window.motorPaiGow.status !== 'apostando') return;
    if (window.motorPaiGow.prontos[window.motorPaiGow.meuId]) return;

    let ante = Number(window.motorPaiGow.apostaAnte);
    if (isNaN(ante) || ante <= 0) return;

    let custoTotal = ante * 2;
    if (Number(window.pontosDoCasal) < custoTotal) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💸");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const pgRef = ref(db, `cassino/paigow_royale`);

    const snap = await get(pgRef);
    let prontos = (snap.val() || {}).prontos || { joao: false, thamiris: false };
    prontos[window.motorPaiGow.meuId] = true;

    if (prontos[window.motorPaiGow.parceiroId] === true) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoTotal, `Pai Gow Tiles (Aposta)`);
        }

        let saco = gerarPecasPaiGow(); 
        let dMao = [saco.pop(), saco.pop(), saco.pop(), saco.pop()];
        let jMao = [saco.pop(), saco.pop(), saco.pop(), saco.pop()];
        let tMao = [saco.pop(), saco.pop(), saco.pop(), saco.pop()];

        let dOpt = otimizarPaiGow(dMao);
        let jOpt = otimizarPaiGow(jMao);
        let tOpt = otimizarPaiGow(tMao);

        await update(pgRef, {
            status: 'resultado', 
            apostaAnte: ante,
            quemFinalizou: window.motorPaiGow.meuId,
            dealer: { high: JSON.stringify(dOpt.high), low: JSON.stringify(dOpt.low), scoreHigh: dOpt.scoreHigh, scoreLow: dOpt.scoreLow },
            jogadores: {
                joao: { high: JSON.stringify(jOpt.high), low: JSON.stringify(jOpt.low), scoreHigh: jOpt.scoreHigh, scoreLow: jOpt.scoreLow },
                thamiris: { high: JSON.stringify(tOpt.high), low: JSON.stringify(tOpt.low), scoreHigh: tOpt.scoreHigh, scoreLow: tOpt.scoreLow }
            },
            prontos: { joao: false, thamiris: false } 
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(pgRef, { prontos: prontos, apostaAnte: ante });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando Aliado...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

// 🚨 MÁGICA DA UX: Pop-up para todos, dinheiro apenas uma vez!
async function processarFimPaiGow() {
    const d = window.motorPaiGow.dealer;
    const ante = Number(window.motorPaiGow.apostaAnte);
    let ganhoTotal = 0;

    const avaliarMao = (p) => {
        let wonHigh = p.scoreHigh > d.scoreHigh;
        let wonLow = p.scoreLow > d.scoreLow;
        
        if (wonHigh && wonLow) return ante * 2; 
        if (wonHigh || wonLow) return ante;     
        return 0;                               
    };

    const jJoao = window.motorPaiGow.jogadores.joao;
    const jThamiris = window.motorPaiGow.jogadores.thamiris;
    
    ganhoTotal += avaliarMao(jJoao);
    ganhoTotal += avaliarMao(jThamiris);

    // 1️⃣ A FESTA VISUAL (Roda no celular dos dois simultaneamente)
    setTimeout(() => {
        if (ganhoTotal > (ante * 2)) {
            if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#fdfbf7'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A EQUIPE DOMINOU! +${ganhoTotal} 💰!`, "🀄");
        } else if (ganhoTotal > 0) {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`EMPATE! +${ganhoTotal} devolvidos.`, "🤝");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`O Imperador levou tudo... 💀`, "💸");
        }
        
        renderMesaPaiGow(); // Atualiza os textos de "Derrota/Vitória" nas cartas
    }, 1500);

    // 2️⃣ A TRANSAÇÃO FINANCEIRA E RESET DA MESA (Roda APENAS no celular de quem deu o último clique)
    if (window.motorPaiGow.quemFinalizou === window.motorPaiGow.meuId) {
        setTimeout(async () => {
            // Paga o prêmio real no cofre
            if (ganhoTotal > (ante * 2)) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Pai Gow Tiles`);
            } else if (ganhoTotal > 0) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Push Pai Gow Tiles`);
            }

            // Reseta a mesa na nuvem
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, `cassino/paigow_royale`), {
                status: 'apostando', apostaAnte: window.motorPaiGow.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}
            });
        }, 1600); // 100ms após o pop-up aparecer
    }
}

function renderMesaPaiGow() {
    const pg = window.motorPaiGow;
    const painelAnte = document.getElementById('paigow-painel-aposta');
    const btnNovaMao = document.getElementById('btn-paigow-novamao');
    const btnInic = document.getElementById('btn-iniciar-paigow');

    if (!painelAnte) return;

    if (pg.status === 'apostando') {
        painelAnte.style.display = 'flex';
        btnNovaMao.classList.add('escondido');
        
        document.getElementById('paigow-dealer-high').innerHTML = '';
        document.getElementById('paigow-dealer-low').innerHTML = '';
        document.getElementById('paigow-oponente-high').innerHTML = '';
        document.getElementById('paigow-oponente-low').innerHTML = '';
        document.getElementById('paigow-jogador-high').innerHTML = '';
        document.getElementById('paigow-jogador-low').innerHTML = '';
        
        document.getElementById('paigow-pts-high').innerText = '';
        document.getElementById('paigow-pts-low').innerText = '';
        document.getElementById('paigow-resultado-jogador').innerText = '';
        document.getElementById('paigow-resultado-oponente').innerText = '';
        document.getElementById('paigow-info-dealer').innerText = '';

        if (pg.prontos[pg.meuId]) {
            btnInic.innerText = "AGUARDANDO... ⏳";
            btnInic.style.background = "#555";
            btnInic.style.boxShadow = "none";
        } else {
            btnInic.innerText = "REVELAR O DESTINO 🀄";
            btnInic.style.background = "linear-gradient(145deg, #c0392b, #8e44ad)";
            btnInic.style.boxShadow = "0 5px 20px rgba(192, 57, 43, 0.4)";
        }
        return; 
    }

    painelAnte.style.display = 'none';

    const desenhar = (divId, arrPecas) => {
        let h = document.getElementById(divId);
        h.innerHTML = '';
        if (Array.isArray(arrPecas)) {
            arrPecas.forEach((p, idx) => h.innerHTML += criarDivPaiGow(p, idx * 0.15));
        }
    };

    // Renderiza limpo, os arrays agora já foram sanitizados!
    desenhar('paigow-dealer-low', pg.dealer.low);
    desenhar('paigow-dealer-high', pg.dealer.high);

    if (pg.status === 'resultado') {
        document.getElementById('paigow-info-dealer').innerText = `Baixa: ${stringScore(pg.dealer.scoreLow)} | Alta: ${stringScore(pg.dealer.scoreHigh)}`;
    }

    const dHigh = pg.dealer.scoreHigh;
    const dLow = pg.dealer.scoreLow;

    const renderJogador = (idJog, pfix) => {
        const j = pg.jogadores[idJog];
        if (!j) return;
        
        desenhar(`paigow-${pfix}-low`, j.low);
        desenhar(`paigow-${pfix}-high`, j.high);
        
        if (idJog === pg.meuId) {
            document.getElementById('paigow-pts-low').innerText = stringScore(j.scoreLow);
            document.getElementById('paigow-pts-high').innerText = stringScore(j.scoreHigh);
        }

        if (pg.status === 'resultado') {
            let winH = j.scoreHigh > dHigh;
            let winL = j.scoreLow > dLow;
            let resT = document.getElementById(`paigow-resultado-${pfix}`);
            
            if (winH && winL) { resT.innerText = '🏆 VITÓRIA (2/2)'; resT.style.color = '#f1c40f'; }
            else if (winH || winL) { resT.innerText = '🤝 EMPATE PUSH (1/2)'; resT.style.color = '#bdc3c7'; }
            else { resT.innerText = '💀 DERROTA (0/2)'; resT.style.color = '#e74c3c'; }
        }
    };

    renderJogador(pg.parceiroId, 'oponente');
    renderJogador(pg.meuId, 'jogador');

    if (pg.status === 'resultado') {
        btnNovaMao.classList.remove('escondido');
    }
}

window.resetarMesaPaiGow = async function() {
    window.motorPaiGow.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/paigow_royale`), {
        status: 'apostando', apostaAnte: window.motorPaiGow.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}
    });
};

// ============================================================================
// 🌴 MOTOR REAL-TIME: CARIBBEAN POKER (AVALIADOR DE MÃOS E SINCRONIA DUPLA)
// ============================================================================

window.motorCarib = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAnte: 50,
    baralho: [], dealer: { mao: [] }, vitoriaComemorada: false, quemFinalizou: '',
    prontos: { joao: false, thamiris: false },
    jogadores: { joao: { mao: [], acao: '' }, thamiris: { mao: [], acao: '' } }
};

window.fecharMesaCarib = function() {
    const mesa = document.getElementById('mesa-carib');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarBaralhoCarib() {
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

function criarDivCartaCarib(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s; width: 55px; height: 80px; font-size: 0.9em;">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro" style="font-size: 1.8rem;">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

// 🧠 A Inteligência Artificial de Avaliação do Poker (Robusta)
function avaliarMaoCarib(mao) {
    if (!mao || mao.length !== 5) return { rank: 0, str: "Erro", score: 0, mult: 1, qualifica: false };
    
    const valMap = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    let nums = mao.map(c => valMap[c.valor]).sort((a,b) => b - a);
    let naipes = mao.map(c => c.naipe);
    
    let isFlush = naipes.every(n => n === naipes[0]);
    let isStraight = false;
    
    if (nums[0] === 14 && nums[1] === 5 && nums[2] === 4 && nums[3] === 3 && nums[4] === 2) {
        isStraight = true; nums = [5,4,3,2,1]; 
    } else {
        isStraight = nums.every((v, i) => i === 0 || v === nums[i-1] - 1);
    }

    let counts = {};
    nums.forEach(v => counts[v] = (counts[v] || 0) + 1);
    let freqs = Object.entries(counts).map(e => ({v: parseInt(e[0]), c: e[1]})).sort((a,b) => b.c - a.c || b.v - a.v);
    
    let rank = 1, str = "Carta Alta", mult = 1;
    if (isStraight && isFlush && nums[0] === 14) { rank = 10; str = "Royal Flush"; mult = 100; }
    else if (isStraight && isFlush) { rank = 9; str = "Straight Flush"; mult = 50; }
    else if (freqs[0].c === 4) { rank = 8; str = "Quadra"; mult = 20; }
    else if (freqs[0].c === 3 && freqs[1].c === 2) { rank = 7; str = "Full House"; mult = 7; }
    else if (isFlush) { rank = 6; str = "Flush"; mult = 5; }
    else if (isStraight) { rank = 5; str = "Sequência"; mult = 4; }
    else if (freqs[0].c === 3) { rank = 4; str = "Trinca"; mult = 3; }
    else if (freqs[0].c === 2 && freqs[1].c === 2) { rank = 3; str = "Dois Pares"; mult = 2; }
    else if (freqs[0].c === 2) { rank = 2; str = "Par"; mult = 1; }

    // Calcula um score preciso para desempate
    let score = rank * 1000000 + freqs[0].v * 10000;
    if (freqs.length > 1) score += freqs[1].v * 100;
    if (freqs.length > 2) score += freqs[2].v;

    // Regra Global do Casino: Qualifica se tiver Par+ ou A-K
    let qualifica = rank > 1 || (nums.includes(14) && nums.includes(13));

    return { rank, str, mult, score, qualifica };
}

window.iniciarOuvinteCarib = function() {
    window.motorCarib.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorCarib.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/caribbean_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorCarib.status = data.status || 'apostando';
            window.motorCarib.quemFinalizou = data.quemFinalizou || '';
            window.motorCarib.apostaAnte = Number(data.apostaAnte) || 50;
            window.motorCarib.prontos = data.prontos || { joao: false, thamiris: false };
            
            window.motorCarib.baralho = JSON.parse(data.baralho || "[]");
            window.motorCarib.dealer = { mao: JSON.parse(data.dealer?.mao || "[]") };

            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            window.motorCarib.jogadores = {
                joao: { acao: jInfo.acao || '', mao: JSON.parse(jInfo.mao || "[]") },
                thamiris: { acao: tInfo.acao || '', mao: JSON.parse(tInfo.mao || "[]") }
            };

            renderMesaCarib();

            if (window.motorCarib.status === 'resultado' && !window.motorCarib.vitoriaComemorada) {
                window.motorCarib.vitoriaComemorada = true;
                processarFimCarib();
            }
        } catch (e) {
            console.error("Erro na leitura do Caribbean:", e);
        }
    });

    const visor = document.getElementById('carib-valor-aposta');
    if (visor) visor.innerText = window.motorCarib.apostaAnte;
};

window.ajustarApostaCarib = function(delta) {
    if (window.motorCarib.status !== 'apostando') return;
    if (window.motorCarib.prontos[window.motorCarib.meuId]) return;
    
    let atual = Number(window.motorCarib.apostaAnte) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    // O custo potencial total (Ante + Call) por jogador é 3x a aposta escolhida. 
    // Como são 2 jogadores, custo máximo potencial = 6x a aposta. Protegemos o cofre:
    const maxAposta = Math.floor(saldo / 6); 
    if (novoValor > maxAposta) novoValor = maxAposta;
    if (novoValor < 10) novoValor = 10;
    
    window.motorCarib.apostaAnte = novoValor;
    const visor = document.getElementById('carib-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

// 🚨 FASE 1: PAGAR ANTE (Sincronia Dupla)
window.iniciarRodadaCarib = async function() {
    if (window.motorCarib.status !== 'apostando') return;
    if (window.motorCarib.prontos[window.motorCarib.meuId]) return;

    let ante = Number(window.motorCarib.apostaAnte);
    if (isNaN(ante) || ante <= 0) return;

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const caribRef = ref(db, `cassino/caribbean_royale`);

    const snap = await get(caribRef);
    let prontos = (snap.val() || {}).prontos || { joao: false, thamiris: false };
    prontos[window.motorCarib.meuId] = true;

    if (prontos[window.motorCarib.parceiroId] === true) {
        // Ambos prontos: Cobra 2x Ante (uma de cada) e dá as cartas
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-(ante * 2), `Caribbean Poker (Ante Co-op)`);
        }

        let baralho = gerarBaralhoCarib(); 
        let mDealer = [baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop()];
        let mJoao = [baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop()];
        let mThamiris = [baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop()];

        await update(caribRef, {
            status: 'jogando',
            apostaAnte: ante,
            baralho: JSON.stringify(baralho),
            dealer: { mao: JSON.stringify(mDealer) },
            jogadores: {
                joao: { mao: JSON.stringify(mJoao), acao: '' },
                thamiris: { mao: JSON.stringify(mThamiris), acao: '' }
            },
            prontos: { joao: false, thamiris: false } // Reseta para a fase 2 (Call/Fold)
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(caribRef, { prontos: prontos, apostaAnte: ante });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando Parceiro pagar Ante...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

// 🚨 FASE 2: CALL OU FOLD (Sincronia Dupla)
window.acaoCarib = async function(escolha) {
    if (window.motorCarib.status !== 'jogando') return;
    if (window.motorCarib.prontos[window.motorCarib.meuId]) return;

    const ante = Number(window.motorCarib.apostaAnte);
    const custoCall = ante * 2;

    if (escolha === 'call') {
        const saldo = Number(window.pontosDoCasal);
        if (saldo < custoCall) {
            if(typeof mostrarToast === 'function') mostrarToast("Fichas insuficientes para o Call!", "💸");
            return;
        }
        // Cobra o Call imediatamente na sua jogada
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoCall, `Caribbean Poker (Call - ${window.motorCarib.meuId})`);
        }
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    } else {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.8);
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const caribRef = ref(db, `cassino/caribbean_royale`);

    const snap = await get(caribRef);
    let dataAtual = snap.val() || {};
    let prontos = dataAtual.prontos || { joao: false, thamiris: false };
    
    prontos[window.motorCarib.meuId] = true;

    let up = { prontos: prontos };
    up[`jogadores/${window.motorCarib.meuId}/acao`] = escolha;

    if (prontos[window.motorCarib.parceiroId] === true) {
        // Os dois decidiram. Vai para o Showdown!
        up.status = 'resultado';
        up.quemFinalizou = window.motorCarib.meuId; // Quem clicou por último resolve a matemática
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Decisão travada. Aguardando a Equipe...", "🔒");
    }

    await update(caribRef, up);
};

// 🚨 FASE 3: SHOWDOWN DA INTELIGÊNCIA ARTIFICIAL
async function processarFimCarib() {
    if (window.motorCarib.quemFinalizou !== window.motorCarib.meuId) {
        renderMesaCarib(); 
        return; 
    }

    const mDealer = window.motorCarib.dealer.mao;
    const avalDealer = avaliarMaoCarib(mDealer);
    const ante = Number(window.motorCarib.apostaAnte);
    const apostaCall = ante * 2;
    
    let ganhoTotal = 0;

    const resolverJogador = (jInfo) => {
        if (jInfo.acao === 'fold') return 0; // Perdeu a Ante. Call não foi pago. Recupera zero.
        
        let avalJ = avaliarMaoCarib(jInfo.mao);
        
        if (!avalDealer.qualifica) {
            // Dealer não qualificou. Ante paga 1:1. Call Empata (Push).
            // Retorno = (Ante original + Prêmio da Ante) + Call devolvido = (2x Ante) + Call
            return (ante * 2) + apostaCall; 
        } else {
            // Dealer qualificou. Briga de Mãos!
            if (avalJ.score > avalDealer.score) {
                // Vitória! Ante paga 1:1. Call paga o multiplicador.
                return (ante * 2) + apostaCall + (apostaCall * avalJ.mult);
            } else if (avalJ.score === avalDealer.score) {
                // Empate absoluto. Push em tudo.
                return ante + apostaCall;
            } else {
                // Derrota. A casa leva tudo.
                return 0;
            }
        }
    };

    const jJoao = window.motorCarib.jogadores.joao;
    const jThamiris = window.motorCarib.jogadores.thamiris;
    
    ganhoTotal += resolverJogador(jJoao);
    ganhoTotal += resolverJogador(jThamiris);

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Caribbean Poker`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#1abc9c', '#D4AF37'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A EQUIPE LEVOU +${ganhoTotal} 💰!`, "🎰");
        }, 1500);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Banca engoliu as apostas... 💀`, "💸");
        }, 1500);
    }
}

function renderMesaCarib() {
    const cb = window.motorCarib;
    const painelAnte = document.getElementById('carib-painel-aposta');
    const painelAcao = document.getElementById('carib-painel-acao');
    const btnNovaMao = document.getElementById('btn-carib-novamao');
    const btnInic = document.getElementById('btn-iniciar-carib');
    const btnFold = document.getElementById('btn-carib-fold');
    const btnCall = document.getElementById('btn-carib-call');

    if (!painelAnte) return;

    if (cb.status === 'apostando') {
        painelAnte.style.display = 'flex';
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.add('escondido');
        
        document.getElementById('carib-mao-dealer').innerHTML = '';
        document.getElementById('carib-mao-oponente').innerHTML = '';
        document.getElementById('carib-mao-jogador').innerHTML = '';
        document.getElementById('carib-resultado-jogador').innerText = '';
        document.getElementById('carib-resultado-oponente').innerText = '';
        document.getElementById('carib-info-dealer').innerText = '';

        if (cb.prontos[cb.meuId]) {
            btnInic.innerText = "AGUARDANDO... ⏳";
            btnInic.style.background = "#555";
        } else {
            btnInic.innerText = "PAGAR ANTE ♠️";
            btnInic.style.background = "linear-gradient(145deg, #1abc9c, #16a085)";
        }
        return; 
    }

    painelAnte.style.display = 'none';

    // RENDERIZA DEALER
    const divDealer = document.getElementById('carib-mao-dealer');
    divDealer.innerHTML = '';
    cb.dealer.mao.forEach((c, idx) => {
        if (idx > 0 && cb.status === 'jogando') {
            // Esconde 4 cartas do Dealer durante o jogo
            divDealer.innerHTML += `<div class="poker-card-back animacao-distribuir" style="width: 55px; height: 80px;"></div>`;
        } else {
            divDealer.innerHTML += criarDivCartaCarib(c, idx * 0.1);
        }
    });

    if (cb.status === 'resultado') {
        let avalD = avaliarMaoCarib(cb.dealer.mao);
        document.getElementById('carib-info-dealer').innerText = avalD.qualifica ? `QUALIFICOU: ${avalD.str}` : `NÃO QUALIFICOU (${avalD.str})`;
        document.getElementById('carib-info-dealer').style.color = avalD.qualifica ? '#e74c3c' : '#bdc3c7';
    }

    // RENDERIZA JOGADORES
    const renderJogador = (idJog, divMao, divRes) => {
        const j = cb.jogadores[idJog];
        const maoH = document.getElementById(divMao);
        if (!maoH || !j) return;
        
        maoH.innerHTML = '';
        j.mao.forEach((c, i) => maoH.innerHTML += criarDivCartaCarib(c, i * 0.1));
        
        let avalJ = avaliarMaoCarib(j.mao);
        let resT = document.getElementById(divRes);
        
        if (j.acao === 'fold') {
            resT.innerText = 'FUGIU (FOLD)';
            resT.style.color = '#e74c3c';
            maoH.style.opacity = '0.5';
        } else if (cb.status === 'resultado') {
            maoH.style.opacity = '1';
            let avalD = avaliarMaoCarib(cb.dealer.mao);
            if (!avalD.qualifica) {
                resT.innerText = `WIN: ${avalJ.str} (+Ante)`;
                resT.style.color = '#2ecc71';
            } else {
                if (avalJ.score > avalD.score) { resT.innerText = `WIN: ${avalJ.str}`; resT.style.color = '#f1c40f'; }
                else if (avalJ.score < avalD.score) { resT.innerText = `LOSE: ${avalJ.str}`; resT.style.color = '#e74c3c'; }
                else { resT.innerText = `PUSH (Empate)`; resT.style.color = '#bdc3c7'; }
            }
        } else if (j.acao === 'call') {
            resT.innerText = `APOSTOU: ${avalJ.str}`;
            resT.style.color = '#f1c40f';
        } else {
            resT.innerText = `Sua vez! Você tem um(a) ${avalJ.str}`;
            resT.style.color = '#1abc9c';
        }
    };

    renderJogador(cb.parceiroId, 'carib-mao-oponente', 'carib-resultado-oponente');
    renderJogador(cb.meuId, 'carib-mao-jogador', 'carib-resultado-jogador');

    // UI DE AÇÃO E BOTÕES
    if (cb.status === 'jogando') {
        painelAcao.classList.remove('escondido');
        if (cb.prontos[cb.meuId]) {
            btnFold.innerText = "AGUARDANDO... ⏳"; btnFold.style.background = "#555";
            btnCall.innerText = "AGUARDANDO... ⏳"; btnCall.style.background = "#555";
        } else {
            btnFold.innerText = "FUGIR (FOLD)"; btnFold.style.background = "linear-gradient(145deg, #e74c3c, #c0392b)";
            btnCall.innerText = `APOSTAR (${cb.apostaAnte * 2}💰)`; btnCall.style.background = "linear-gradient(145deg, #f1c40f, #f39c12)";
        }
    } else if (cb.status === 'resultado') {
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.remove('escondido');
    }
}

window.resetarMesaCarib = async function() {
    window.motorCarib.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/caribbean_royale`), {
        status: 'apostando', apostaAnte: window.motorCarib.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}
    });
};

// ============================================================================
// 👑 MOTOR REAL-TIME: BACCARAT ROYALE (SISTEMA DE SINCRONIA E ANTI-NAN)
// ============================================================================

window.motorBac = {
    meuId: '', parceiroId: '',
    status: 'apostando', // 'apostando', 'rolando', 'resultado'
    apostas: {},
    maoJogador: [],
    maoBanca: [],
    roladoPor: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } 
};

window.fecharMesaBaccarat = function() {
    const mesa = document.getElementById('mesa-baccarat');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarBaralhoBac() {
    const naipes = ['♥️', '♦️', '♣️', '♠️'];
    const valores = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let baralho = [];
    for(let i=0; i<4; i++) { // Baccarat usa múltiplos baralhos, simulando 4 para evitar fim
        for(let n of naipes) {
            for(let v of valores) {
                baralho.push({ naipe: n, valor: v, cor: (n==='♥️'||n==='♦️') ? 'poker-red' : 'poker-black' });
            }
        }
    }
    return baralho.sort(() => Math.random() - 0.5);
}

function criarDivCartaBac(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

// O cálculo de Baccarat retorna sempre um dígito (0-9)
function calcularPontosBac(mao) {
    if (!mao || !Array.isArray(mao)) return 0;
    let soma = 0;
    mao.forEach(c => {
        if (['10', 'J', 'Q', 'K'].includes(c.valor)) { soma += 0; }
        else if (c.valor === 'A') { soma += 1; }
        else { soma += parseInt(c.valor) || 0; }
    });
    return soma % 10;
}

window.iniciarOuvinteBaccarat = function() {
    window.motorBac.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorBac.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/baccarat_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            window.motorBac.status = data.status || 'apostando';
            window.motorBac.apostas = data.apostas || {};
            window.motorBac.roladoPor = data.roladoPor || '';
            window.motorBac.prontos = data.prontos || { joao: false, thamiris: false };
            
            window.motorBac.maoJogador = JSON.parse(data.maoJogador || "[]");
            window.motorBac.maoBanca = JSON.parse(data.maoBanca || "[]");

            renderMesaBaccarat();

            if (window.motorBac.status === 'rolando') {
                animarCartasBaccarat();
            }
        } catch (e) {
            console.error("Erro no ouvinte de Baccarat:", e);
        }
    });

    const visor = document.getElementById('bac-ficha-valor');
    if (visor) visor.innerText = window.motorBac.valorFicha;
};

window.ajustarFichaBaccarat = function(delta) {
    if (window.motorBac.status !== 'apostando') return;
    if (window.motorBac.prontos[window.motorBac.meuId]) return;
    
    let atual = Number(window.motorBac.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorBac.valorFicha = novoValor;
    const visor = document.getElementById('bac-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarBaccarat = async function(tipo) {
    if (window.motorBac.status !== 'apostando') return;
    
    if (window.motorBac.prontos[window.motorBac.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde a distribuição!", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorBac.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta Baccarat: ${tipo.toUpperCase()}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/baccarat_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorBac.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasBaccarat = async function() {
    if (window.motorBac.status !== 'apostando') return;
    if (window.motorBac.prontos[window.motorBac.meuId]) return;

    let totalDevolvido = 0;
    Object.values(window.motorBac.apostas).forEach(ap => {
        if (ap.autor === window.motorBac.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Baccarat");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/baccarat_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaBaccarat() {
    const statusTxt = document.getElementById('bac-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorBac.status === 'rolando' ? "CARTAS NA MESA..." : "FAÇAM SUAS APOSTAS";
        statusTxt.style.color = window.motorBac.status === 'rolando' ? "#D4AF37" : "#D4AF37";
    }

    document.querySelectorAll('#bac-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorBac.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-bac-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    const btnLancar = document.getElementById('btn-lancar-bac');
    if (btnLancar) {
        if (window.motorBac.prontos[window.motorBac.meuId]) {
            btnLancar.innerText = "ESPERANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "DISTRIBUIR 🃏";
            btnLancar.style.background = "linear-gradient(145deg, #D4AF37, #b38b22)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(212, 175, 55, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#000";
        }
    }
}

// 🚨 O SORTEIO DA INTELIGÊNCIA ARTIFICIAL
window.distribuirBaccarat = async function() {
    if (window.motorBac.status !== 'apostando') return;
    if (window.motorBac.prontos[window.motorBac.meuId]) return;

    if (Object.keys(window.motorBac.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("A mesa precisa de fichas!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const bacRef = ref(db, `cassino/baccarat_royale`);

    const snap = await get(bacRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    prontos[window.motorBac.meuId] = true;

    if (prontos[window.motorBac.parceiroId] === true) {
        // O Crupiê tira as cartas
        let baralho = gerarBaralhoBac();
        let maoJ = [baralho.pop(), baralho.pop()];
        let maoB = [baralho.pop(), baralho.pop()];

        // Regra Simplificada de 3ª Carta do Baccarat
        let ptsJ = calcularPontosBac(maoJ);
        let ptsB = calcularPontosBac(maoB);
        
        // Se nenhum tem um "Natural" (8 ou 9), tiram mais cartas
        if (ptsJ < 8 && ptsB < 8) {
            if (ptsJ <= 5) maoJ.push(baralho.pop());
            // Para simplificar a regra brutal da banca, ela compra se <= 5 
            if (ptsB <= 5) maoB.push(baralho.pop()); 
        }

        await update(bacRef, {
            status: 'rolando',
            maoJogador: JSON.stringify(maoJ),
            maoBanca: JSON.stringify(maoB),
            roladoPor: window.motorBac.meuId,
            prontos: { joao: false, thamiris: false } 
        });
    } else {
        await update(bacRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando confirmação...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarCartasBaccarat() {
    const divJ = document.getElementById('bac-mao-jogador');
    const divB = document.getElementById('bac-mao-banca');
    const ptsJ = document.getElementById('bac-pontuacao-jogador');
    const ptsB = document.getElementById('bac-pontuacao-banca');
    
    if (!divJ || !divB) return;

    divJ.innerHTML = '';
    divB.innerHTML = '';
    ptsJ.innerText = '0';
    ptsB.innerText = '0';

    const arrJ = window.motorBac.maoJogador;
    const arrB = window.motorBac.maoBanca;

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);

    // Revela com delay dramático
    setTimeout(() => {
        arrJ.forEach((c, i) => divJ.innerHTML += criarDivCartaBac(c, i*0.2));
        ptsJ.innerText = calcularPontosBac(arrJ);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
    }, 500);

    setTimeout(() => {
        arrB.forEach((c, i) => divB.innerHTML += criarDivCartaBac(c, i*0.2));
        ptsB.innerText = calcularPontosBac(arrB);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
        
        // Finaliza o Jogo
        if (window.motorBac.roladoPor === window.motorBac.meuId) {
            processarRecompensaBaccarat();
        }
    }, 1500); 
}

async function processarRecompensaBaccarat() {
    let ganhoTotal = 0;
    
    const ptsJ = calcularPontosBac(window.motorBac.maoJogador);
    const ptsB = calcularPontosBac(window.motorBac.maoBanca);
    
    let vencedor = '';
    if (ptsJ > ptsB) vencedor = 'jogador';
    else if (ptsB > ptsJ) vencedor = 'banca';
    else vencedor = 'empate';
    
    Object.values(window.motorBac.apostas).forEach(ap => {
        let valorAposta = Number(ap.valor);
        
        if (ap.tipo === vencedor) {
            // Vitória
            if (vencedor === 'jogador') ganhoTotal += (valorAposta * 2);
            if (vencedor === 'banca') ganhoTotal += (valorAposta * 2); 
            if (vencedor === 'empate') ganhoTotal += (valorAposta * 8); // Empate paga OITO pra um!
        } else if (vencedor === 'empate' && (ap.tipo === 'jogador' || ap.tipo === 'banca')) {
            // Regra Clássica: Se der empate, as apostas no jogador e na banca são DEVOLVIDAS
            ganhoTotal += valorAposta;
        }
    });

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Baccarat (${vencedor.toUpperCase()})`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`O BANCO PAGOU +${ganhoTotal} 💰!`, "👑");
        }, 800);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Casa levou... 💀`, "💸");
        }, 800);
    }

    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        await set(ref(db, `cassino/baccarat_royale`), { status: 'apostando', apostas: {}, maoJogador: "[]", maoBanca: "[]", roladoPor: '', prontos: {joao: false, thamiris: false} });
        document.getElementById('bac-mao-jogador').innerHTML = '';
        document.getElementById('bac-mao-banca').innerHTML = '';
        document.getElementById('bac-pontuacao-jogador').innerText = '0';
        document.getElementById('bac-pontuacao-banca').innerText = '0';
    }, 4500);
}

// ============================================================================
// 🐉 MOTOR REAL-TIME: SIC BO TRINDADE (CO-OP COM SINCRONIA PERFEITA)
// ============================================================================

window.motorSicBo = {
    meuId: '', parceiroId: '',
    status: 'apostando', // 'apostando', 'rolando', 'resultado'
    apostas: {},
    resultado: [6, 6, 6],
    roladoPor: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } 
};

// Reutilizamos a física e o som dos dados já em cache
const somCargaSicBo = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'); 

window.fecharMesaSicBo = function() {
    const mesa = document.getElementById('mesa-sicbo');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

window.iniciarOuvinteSicBo = function() {
    window.motorSicBo.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorSicBo.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/sicbo_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            window.motorSicBo.status = data.status || 'apostando';
            window.motorSicBo.apostas = data.apostas || {};
            window.motorSicBo.resultado = data.resultado || [6, 6, 6];
            window.motorSicBo.roladoPor = data.roladoPor || '';
            window.motorSicBo.prontos = data.prontos || { joao: false, thamiris: false };

            renderMesaSicBo();

            if (window.motorSicBo.status === 'rolando') {
                animarRolagemSicBo();
            }
        } catch (e) {
            console.error("Erro no ouvinte de Sic Bo:", e);
        }
    });

    const visor = document.getElementById('sicbo-ficha-valor');
    if (visor) visor.innerText = window.motorSicBo.valorFicha;
};

window.ajustarFichaSicBo = function(delta) {
    if (window.motorSicBo.status !== 'apostando') return;
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) return; // Trava de Segurança
    
    let atual = Number(window.motorSicBo.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorSicBo.valorFicha = novoValor;
    const visor = document.getElementById('sicbo-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarSicBo = async function(tipo) {
    if (window.motorSicBo.status !== 'apostando') return;
    
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde a Trindade agir!", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorSicBo.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta SicBo: ${tipo}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/sicbo_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorSicBo.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasSicBo = async function() {
    if (window.motorSicBo.status !== 'apostando') return;
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Fichas seladas na cúpula!", "🔒");
        return;
    }

    let totalDevolvido = 0;
    Object.values(window.motorSicBo.apostas).forEach(ap => {
        if (ap.autor === window.motorSicBo.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Sic Bo");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/sicbo_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaSicBo() {
    const statusTxt = document.getElementById('sicbo-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorSicBo.status === 'rolando' ? "A CÚPULA TREME..." : "A TRINDADE AGUARDA";
        statusTxt.style.color = window.motorSicBo.status === 'rolando' ? "#e74c3c" : "#f1c40f";
    }

    document.querySelectorAll('#sicbo-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorSicBo.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    const btnLancar = document.getElementById('btn-lancar-sicbo');
    if (btnLancar) {
        if (window.motorSicBo.prontos[window.motorSicBo.meuId]) {
            btnLancar.innerText = "ESPERANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "AGITAR CÚPULA 🥢";
            btnLancar.style.background = "linear-gradient(145deg, #f1c40f, #e67e22)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(241, 196, 15, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#000";
        }
    }
}

// 🚨 SINCRONIA CO-OP: Exatamente como no Craps, blindado.
window.lancarDadosSicBo = async function() {
    if (window.motorSicBo.status !== 'apostando') return;
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) return;

    if (Object.keys(window.motorSicBo.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Honrem os deuses com fichas!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const sicboRef = ref(db, `cassino/sicbo_royale`);

    const snap = await get(sicboRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    prontos[window.motorSicBo.meuId] = true;

    if (prontos[window.motorSicBo.parceiroId] === true) {
        // Gera 3 dados de 1 a 6
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;

        await update(sicboRef, {
            status: 'rolando',
            resultado: [d1, d2, d3],
            roladoPor: window.motorSicBo.meuId,
            prontos: { joao: false, thamiris: false } 
        });
    } else {
        await update(sicboRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando a confirmação do outro lado...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarRolagemSicBo() {
    // Reutiliza a matriz facesDado do Craps, se estiver declarada
    const arrayFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    const d1El = document.getElementById('sicbo-dado1');
    const d2El = document.getElementById('sicbo-dado2');
    const d3El = document.getElementById('sicbo-dado3');
    const resVisor = document.getElementById('sicbo-resultado-texto');
    
    if (!d1El || !d2El || !d3El) return;

    resVisor.classList.add('escondido');
    d1El.classList.add('rolando-dado');
    d2El.classList.add('rolando-dado');
    d3El.classList.add('rolando-dado');
    
    if(!window.SantuarioSomPausado) {
        somCargaSicBo.currentTime = 0;
        somCargaSicBo.play().catch(()=>{});
    }

    let interval = setInterval(() => {
        d1El.innerText = arrayFaces[Math.floor(Math.random() * 6) + 1];
        d2El.innerText = arrayFaces[Math.floor(Math.random() * 6) + 1];
        d3El.innerText = arrayFaces[Math.floor(Math.random() * 6) + 1];
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        d1El.classList.remove('rolando-dado');
        d2El.classList.remove('rolando-dado');
        d3El.classList.remove('rolando-dado');
        somCargaSicBo.pause();
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200]);
                    }

        const resArray = window.motorSicBo.resultado;
        d1El.innerText = arrayFaces[resArray[0]];
        d2El.innerText = arrayFaces[resArray[1]];
        d3El.innerText = arrayFaces[resArray[2]];
        
        const soma = resArray[0] + resArray[1] + resArray[2];
        resVisor.innerText = soma;
        resVisor.classList.remove('escondido');

        if (window.motorSicBo.roladoPor === window.motorSicBo.meuId) {
            processarRecompensaSicBo();
        }
    }, 2800); // Dá um tempinho extra de tensão por serem 3 dados
}

async function processarRecompensaSicBo() {
    let ganhoTotal = 0;
    const res = window.motorSicBo.resultado;
    const soma = res[0] + res[1] + res[2];
    
    // Regras Core do Sic Bo
    const ehTriplo = (res[0] === res[1] && res[1] === res[2]);
    const ehDuplo = (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]);
    
    Object.values(window.motorSicBo.apostas).forEach(ap => {
        let acertou = false;
        let mult = 0;

        // Small/Big pagam 1:1 (dobram o valor). MAS perdem se der Triplo!
        if (ap.tipo === 'pequeno' && soma >= 4 && soma <= 10 && !ehTriplo) { acertou = true; mult = 2; }
        if (ap.tipo === 'grande' && soma >= 11 && soma <= 17 && !ehTriplo) { acertou = true; mult = 2; }
        
        // Duplos e Triplos Jackpot
        if (ap.tipo === 'duplo' && ehDuplo) { acertou = true; mult = 10; }
        if (ap.tipo === 'triplo' && ehTriplo) { acertou = true; mult = 30; }
        
        // Zona Mística
        if (ap.tipo === 'soma_mistica' && (soma === 10 || soma === 11)) { acertou = true; mult = 6; }

        if (acertou) ganhoTotal += (Number(ap.valor) * mult);
    });

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Sic Bo (${soma})`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#e74c3c'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`OS DEUSES PAGARAM +${ganhoTotal} 💰!`, "🐉");
        }, 500);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A cúpula levou as fichas... 💀`, "💸");
        }, 500);
    }

    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        await set(ref(db, `cassino/sicbo_royale`), { status: 'apostando', apostas: {}, resultado: [6,6,6], roladoPor: '', prontos: {joao: false, thamiris: false} });
        document.getElementById('sicbo-resultado-texto').classList.add('escondido');
    }, 4000);
}

// ============================================================================
// ♠️ MOTOR REAL-TIME: BLACKJACK TEAM (TOTALMENTE ISOLADO)
// ============================================================================

window.motorBjCoop = {
    meuId: '', parceiroId: '', status: 'apostando', turno: '', apostaAtual: 50,
    baralho: [], dealer: { mao: [] }, vitoriaComemorada: false, quemFinalizou: '',
    jogadores: { joao: { mao: [], status: 'jogando' }, thamiris: { mao: [], status: 'jogando' } }
};

window.fecharMesaBjCoop = function() {
    const mesa = document.getElementById('mesa-bj-coop');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarBaralhoBjCoop() {
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

function criarDivCartaBjCoop(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

function calcularPontosBjCoop(mao) {
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

window.iniciarOuvinteBlackjack = function() {
    window.motorBjCoop.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorBjCoop.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/blackjack_team`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorBjCoop.status = data.status || 'apostando';
            window.motorBjCoop.turno = data.turno || '';
            window.motorBjCoop.quemFinalizou = data.quemFinalizou || '';
            window.motorBjCoop.apostaAtual = Number(data.apostaAtual) || 50;
            
            window.motorBjCoop.baralho = JSON.parse(data.baralho || "[]");
            window.motorBjCoop.dealer = { mao: JSON.parse(data.dealer?.mao || "[]") };

            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            window.motorBjCoop.jogadores = {
                joao: { status: jInfo.status || 'jogando', mao: JSON.parse(jInfo.mao || "[]") },
                thamiris: { status: tInfo.status || 'jogando', mao: JSON.parse(tInfo.mao || "[]") }
            };

            renderMesaBjCoop();

            if (window.motorBjCoop.status === 'resultado' && !window.motorBjCoop.vitoriaComemorada) {
                window.motorBjCoop.vitoriaComemorada = true;
                processarFimBjCoop();
            }
        } catch (e) {
            console.error("Erro na leitura do Blackjack Co-op:", e);
        }
    });

    const visor = document.getElementById('bj-coop-valor-aposta');
    if (visor) visor.innerText = window.motorBjCoop.apostaAtual;
};

window.ajustarApostaBjCoop = function(delta) {
    if (window.motorBjCoop.status !== 'apostando') return;
    
    let atual = Number(window.motorBjCoop.apostaAtual) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    const maxApostaCasal = Math.floor(saldo / 2); 
    if (novoValor > maxApostaCasal) novoValor = maxApostaCasal;
    if (novoValor < 10) novoValor = 10;
    
    window.motorBjCoop.apostaAtual = novoValor;
    const visor = document.getElementById('bj-coop-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.iniciarRodadaBjCoop = async function() {
    if (window.motorBjCoop.status !== 'apostando') return;

    let apostaBase = Number(window.motorBjCoop.apostaAtual);
    if (isNaN(apostaBase) || apostaBase <= 0) return;

    let custoTotal = apostaBase * 2;
    const saldo = Number(window.pontosDoCasal) || 0;
    
    if (saldo < custoTotal) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-custoTotal, `Aposta: Blackjack Team`);
    }

    if(typeof mostrarToast === 'function') mostrarToast("Distribuindo...", "🃏");

    try {
        let baralho = gerarBaralhoBjCoop(); 
        
        let maoDealer = [baralho.pop(), baralho.pop()];
        let maoJoao = [baralho.pop(), baralho.pop()];
        let maoThamiris = [baralho.pop(), baralho.pop()];

        let stJoao = calcularPontosBjCoop(maoJoao) === 21 ? 'blackjack' : 'jogando';
        let stThamiris = calcularPontosBjCoop(maoThamiris) === 21 ? 'blackjack' : 'jogando';

        let meuId = window.motorBjCoop.meuId;
        let parceiroId = window.motorBjCoop.parceiroId;
        let stEu = meuId === 'joao' ? stJoao : stThamiris;
        let stParceiro = parceiroId === 'joao' ? stJoao : stThamiris;

        let primTurno = meuId;
        if (stEu !== 'jogando') primTurno = parceiroId;
        
        let quemFim = '';
        if (stEu !== 'jogando' && stParceiro !== 'jogando') {
            primTurno = 'dealer';
            quemFim = meuId; 
        }

        const { db, ref, update } = window.SantuarioApp.modulos;
        await update(ref(db, `cassino/blackjack_team`), {
            status: primTurno === 'dealer' ? 'resultado' : 'jogando',
            turno: primTurno,
            quemFinalizou: quemFim,
            apostaAtual: apostaBase,
            baralho: JSON.stringify(baralho),
            dealer: { mao: JSON.stringify(maoDealer) },
            jogadores: {
                joao: { mao: JSON.stringify(maoJoao), status: stJoao },
                thamiris: { mao: JSON.stringify(maoThamiris), status: stThamiris }
            }
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } catch (e) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(custoTotal, `Estorno BJ Team`);
    }
};

window.acaoBjCoop = async function(acao) {
    if (window.motorBjCoop.turno !== window.motorBjCoop.meuId) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    
    let minhaMao = [...(window.motorBjCoop.jogadores[window.motorBjCoop.meuId].mao || [])];
    let baralho = [...(window.motorBjCoop.baralho || [])];
    let meuStatus = window.motorBjCoop.jogadores[window.motorBjCoop.meuId].status;
    let proxTurno = window.motorBjCoop.parceiroId;

    if (acao === 'comprar' && baralho.length > 0) {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
        minhaMao.push(baralho.pop());
        
        let pts = calcularPontosBjCoop(minhaMao);
        if (pts > 21) {
            meuStatus = 'estourou';
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200]);
                    }
        } else if (pts === 21) {
            meuStatus = 'parou';
        } else {
            proxTurno = window.motorBjCoop.meuId; 
        }
    } else if (acao === 'parar') {
        meuStatus = 'parou';
    }

    if (proxTurno === window.motorBjCoop.parceiroId) {
        let statusParceiro = window.motorBjCoop.jogadores[window.motorBjCoop.parceiroId]?.status;
        if (statusParceiro !== 'jogando') {
            proxTurno = 'dealer'; 
        }
    }

    up[`cassino/blackjack_team/jogadores/${window.motorBjCoop.meuId}/mao`] = JSON.stringify(minhaMao);
    up[`cassino/blackjack_team/jogadores/${window.motorBjCoop.meuId}/status`] = meuStatus;
    up[`cassino/blackjack_team/baralho`] = JSON.stringify(baralho);
    up[`cassino/blackjack_team/turno`] = proxTurno;
    
    if (proxTurno === 'dealer') {
        up[`cassino/blackjack_team/status`] = 'resultado';
        up[`cassino/blackjack_team/quemFinalizou`] = window.motorBjCoop.meuId; 
    }

    await update(ref(db), up);
};

async function processarFimBjCoop() {
    if (window.motorBjCoop.quemFinalizou !== window.motorBjCoop.meuId) {
        renderMesaBjCoop(); 
        return; 
    }

    let baralho = [...(window.motorBjCoop.baralho || [])];
    let maoDealer = [...(window.motorBjCoop.dealer.mao || [])];
    
    let ptsDealer = calcularPontosBjCoop(maoDealer);
    while (ptsDealer < 17 && baralho.length > 0) {
        maoDealer.push(baralho.pop());
        ptsDealer = calcularPontosBjCoop(maoDealer);
    }

    const { db, ref, update } = window.SantuarioApp.modulos;
    
    await update(ref(db, `cassino/blackjack_team`), {
        'dealer/mao': JSON.stringify(maoDealer),
        'baralho': JSON.stringify(baralho)
    });

    let ganhoTotal = 0;
    const aposta = Number(window.motorBjCoop.apostaAtual) || 0;
    const jJoao = window.motorBjCoop.jogadores.joao;
    const jThamiris = window.motorBjCoop.jogadores.thamiris;
    const ptsJoao = calcularPontosBjCoop(jJoao.mao);
    const ptsThamiris = calcularPontosBjCoop(jThamiris.mao);

    if (jJoao.status === 'blackjack' && ptsDealer !== 21) ganhoTotal += (aposta * 2.5); 
    else if (jJoao.status !== 'estourou' && (ptsDealer > 21 || ptsJoao > ptsDealer)) ganhoTotal += (aposta * 2); 
    else if (jJoao.status !== 'estourou' && ptsJoao === ptsDealer) ganhoTotal += aposta; 

    if (jThamiris.status === 'blackjack' && ptsDealer !== 21) ganhoTotal += (aposta * 2.5);
    else if (jThamiris.status !== 'estourou' && (ptsDealer > 21 || ptsThamiris > ptsDealer)) ganhoTotal += (aposta * 2);
    else if (jThamiris.status !== 'estourou' && ptsThamiris === ptsDealer) ganhoTotal += aposta;

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Blackjack Team`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#3498db'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A EQUIPE GANHOU +${ganhoTotal} 💰!`, "🎰");
        }, 1000);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A banca venceu... 💀`, "💸");
        }, 1000);
    }
}

function renderMesaBjCoop() {
    const bj = window.motorBjCoop;
    const painelAposta = document.getElementById('bj-coop-painel-aposta');
    const painelAcao = document.getElementById('bj-coop-painel-acao');
    const avisoTurno = document.getElementById('bj-coop-aviso-turno');
    const btnNovaMao = document.getElementById('btn-bj-coop-novamao');

    if (!painelAposta) return;

    if (bj.status === 'apostando') {
        painelAposta.style.display = 'flex';
        painelAcao.classList.add('escondido');
        avisoTurno.classList.add('escondido');
        btnNovaMao.classList.add('escondido');
        document.getElementById('bj-coop-mao-dealer').innerHTML = '';
        document.getElementById('bj-coop-mao-oponente').innerHTML = '';
        document.getElementById('bj-coop-mao-jogador').innerHTML = '';
        document.getElementById('bj-coop-resultado-jogador').innerText = '';
        document.getElementById('bj-coop-resultado-oponente').innerText = '';
        return; 
    }

    painelAposta.style.display = 'none';

    const maoDealerDiv = document.getElementById('bj-coop-mao-dealer');
    if (maoDealerDiv) {
        maoDealerDiv.innerHTML = '';
        bj.dealer.mao.forEach((c, index) => {
            if (index === 1 && bj.status === 'jogando') {
                maoDealerDiv.innerHTML += `<div class="poker-card-back animacao-distribuir" style="width: 55px; height: 80px;"></div>`;
            } else {
                maoDealerDiv.innerHTML += criarDivCartaBjCoop(c, index * 0.1);
            }
        });
    }

    if (bj.status === 'resultado') {
        document.getElementById('bj-coop-pontuacao-dealer').innerText = calcularPontosBjCoop(bj.dealer.mao);
    } else if (bj.dealer.mao.length > 0) {
        document.getElementById('bj-coop-pontuacao-dealer').innerText = calcularPontosBjCoop([bj.dealer.mao[0]]);
    }

    const renderJogador = (idJogador, divMao, divPts, divRes) => {
        const j = bj.jogadores[idJogador];
        if (!j) return;
        const maoHtml = document.getElementById(divMao);
        if (!maoHtml) return;
        
        maoHtml.innerHTML = '';
        j.mao.forEach((c, i) => maoHtml.innerHTML += criarDivCartaBjCoop(c, i * 0.1));
        
        let pts = calcularPontosBjCoop(j.mao);
        const divPontos = document.getElementById(divPts);
        if(divPontos) divPontos.innerText = pts;

        let resTxt = '';
        if (j.status === 'estourou') resTxt = '💥 BUSTED';
        else if (j.status === 'blackjack') resTxt = '⭐ BLACKJACK!';
        else if (j.status === 'parou') resTxt = '🛑 Parou';
        
        if (bj.status === 'resultado') {
            let ptsDealer = calcularPontosBjCoop(bj.dealer.mao);
            if (j.status === 'estourou') resTxt = '💀 BUSTED';
            else if (ptsDealer > 21 || pts > ptsDealer) resTxt = '🏆 WIN!';
            else if (pts === ptsDealer) resTxt = '🤝 PUSH';
            else resTxt = '💸 LOSE';
        }
        const divResultado = document.getElementById(divRes);
        if (divResultado) divResultado.innerText = resTxt;
    };

    renderJogador(bj.parceiroId, 'bj-coop-mao-oponente', 'bj-coop-pontuacao-oponente', 'bj-coop-resultado-oponente');
    renderJogador(bj.meuId, 'bj-coop-mao-jogador', 'bj-coop-pontuacao-jogador', 'bj-coop-resultado-jogador');

    if (bj.status === 'jogando') {
        if (bj.turno === bj.meuId) {
            painelAcao.classList.remove('escondido');
            avisoTurno.classList.add('escondido');
        } else {
            painelAcao.classList.add('escondido');
            avisoTurno.classList.remove('escondido');
            avisoTurno.innerText = `Aguardando Equipe...`;
        }
    } else if (bj.status === 'resultado') {
        painelAcao.classList.add('escondido');
        avisoTurno.classList.add('escondido');
        btnNovaMao.classList.remove('escondido');
    }
}

window.resetarMesaBjCoop = async function() {
    window.motorBjCoop.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/blackjack_team`), {
        status: 'apostando', turno: '', apostaAtual: window.motorBjCoop.apostaAtual, quemFinalizou: ''
    });
};

// ============================================================================
// 🎡 MOTOR REAL-TIME: ROLETA COMPARTILHADA (CO-OP GIGANTE) - BLINDADO
// ============================================================================

// 🚨 HASTEAMENTO GLOBAL EXPLICÍTO: Blindagem total contra ReferenceError no Console
// 🚨 Função de Fechar a Mesa Corrigida (Sem recarregar o app!)
window.fecharMesaRoletaMulti = function() {
    const mesa = document.getElementById('mesa-roleta-multi');
    if(mesa) { 
        mesa.classList.add('escondido'); 
        mesa.style.display = 'none'; 
    }
    
    // Se a roleta estiver tocando som e a pessoa sair, nós pausamos o áudio
    if (typeof somCatracaRoleta !== 'undefined' && !somCatracaRoleta.paused) {
        somCatracaRoleta.pause();
        somCatracaRoleta.currentTime = 0;
    }
};

window.motorRoletaMulti = {
    meuId: '',
    status: 'apostando', // 'apostando', 'girando', 'resultado'
    apostas: {}, 
    resultado: null,
    giradoPor: '',
    valorFicha: 50 // Garantido como número puro
};

// Som mecânico de roleta (Opcional, gera muita dopamina)
const somCatracaRoleta = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

// Variável persistente para acumular as voltas da roleta
window.anguloGlobalRoleta = 0;

window.iniciarOuvinteRoletaMulti = function() {
    window.motorRoletaMulti.meuId = window.souJoao ? 'joao' : 'thamiris';
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/roleta_royale`), (snapshot) => {
        const data = snapshot.val() || { status: 'apostando' };
        
        // Se o status mudou para girando agora, disparar a física
        if (data.status === 'girando' && window.motorRoletaMulti.status !== 'girando') {
            window.motorRoletaMulti.resultado = data.resultado;
            window.motorRoletaMulti.giradoPor = data.giradoPor;
            window.motorRoletaMulti.status = 'girando'; // Sincroniza estado antes de animar
            animarGiroRoletaMulti();
        }

        window.motorRoletaMulti.status = data.status || 'apostando';
        window.motorRoletaMulti.apostas = data.apostas || {};
        window.motorRoletaMulti.resultado = data.resultado || null;
        window.motorRoletaMulti.giradoPor = data.giradoPor || '';

        renderizarMesaRoletaMulti();
    });

    const visor = document.getElementById('roleta-multi-ficha-valor');
    if (visor) visor.innerText = window.motorRoletaMulti.valorFicha;
};

// --- AJUSTE DE FICHA COM TRAVA DE SEGURANÇA E TIPAGEM ---
window.ajustarFichaRoleta = function(delta) {
    if (window.motorRoletaMulti.status !== 'apostando') return;
    
    // Garante que o valor atual seja um número antes de somar
    let atual = Number(window.motorRoletaMulti.valorFicha) || 50;
    let novoValor = atual + delta;
    
    // Regras de limites
    if (novoValor < 10) novoValor = 10;
    
    // Sanitização total do visor contra NaN
    if(isNaN(window.pontosDoCasal)) {
        window.location.reload(); return; // Falha catastrófica de rede/auth
    }
    
    if (novoValor > window.pontosDoCasal) novoValor = window.pontosDoCasal;
    if (novoValor < 10) novoValor = 10; // Teto de segurança pós-salvamento
    
    window.motorRoletaMulti.valorFicha = novoValor;
    
    const visor = document.getElementById('roleta-multi-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

// --- APOSTA CO-OP COM SANITIZAÇÃO TOTAL DO COFRE ---
window.apostarRoletaMulti = async function(tipo) {
    if (window.motorRoletaMulti.status !== 'apostando') {
        if(typeof mostrarToast === 'function') mostrarToast("Roda girando, aguarde!", "⏳");
        return;
    }
    
    // 🛡️ BLINDAGEM FINANCEIRA TOTAL: Impede que NaN chegue ao banco_central
    const valorParaApostar = Number(window.motorRoletaMulti.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) {
        window.motorRoletaMulti.valorFicha = 50; // Auto-reset de visor corrompido
        return;
    }

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6);
        return;
    }

    // Processa o débito na conta conjunta no core.js (NÚMERO LIMPO)
    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Roleta Co-op: ${tipo}`);
    }

    // Salva a ficha física na mesa sincronizada
    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/roleta_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorRoletaMulti.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

// --- LIMPEZA DE MESA COM REEMBOLSO (BLINDADA) ---
window.limparApostasRoleta = async function() {
    if (window.motorRoletaMulti.status !== 'apostando') return;

    let totalDevolvido = 0;
    // Percorre as apostas garantindo tipagem Numérica
    Object.values(window.motorRoletaMulti.apostas).forEach(ap => {
        if (ap.autor === window.motorRoletaMulti.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        // Envia apenas números limpos para o core.js
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Roleta");
        }
        if(typeof mostrarToast === 'function') mostrarToast(`+${totalDevolvido} devolvidos.`, "♻️");
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/roleta_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

// --- RENDERIZAÇÃO VISUAL ---
function renderizarMesaRoletaMulti() {
    const statusTxt = document.getElementById('roleta-multi-status-mesa');
    if (!statusTxt) return;

    statusTxt.innerText = window.motorRoletaMulti.status === 'girando' ? "SORTEANDO..." : "FAÇAM SUAS APOSTAS";
    statusTxt.style.color = window.motorRoletaMulti.status === 'girando' ? "#f1c40f" : "#2ecc71";

    // Limpa containers visualmente
    document.querySelectorAll('.container-fichas').forEach(el => el.innerHTML = '');

    const listaApostas = window.motorRoletaMulti.apostas || {};
    Object.values(listaApostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda};">${ap.valor}</div>`;
        }
    });
}

// --- O GIRO (MATEMÁTICA E SORTEIO) ---
window.girarRoletaMulti = async function() {
    if (window.motorRoletaMulti.status !== 'apostando') return;
    if (Object.keys(window.motorRoletaMulti.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Coloquem ao menos uma ficha!", "⚠️");
        return;
    }

    // O Cassino Sorteia
    const num = Math.floor(Math.random() * 37); // 0 a 36
    const cor = num === 0 ? 'verde' : (num % 2 === 0 ? 'preto' : 'vermelho');

    const { db, ref, update } = window.SantuarioApp.modulos;
    
    // Trava a mesa e revela quem girou
    await update(ref(db, `cassino/roleta_royale`), {
        status: 'girando',
        resultado: { numero: num, cor: cor },
        giradoPor: window.motorRoletaMulti.meuId
    });
};

function animarGiroRoletaMulti() {
    const disco = document.getElementById('roleta-multi-disco');
    const resVisor = document.getElementById('roleta-multi-resultado');
    if (!disco || !resVisor || !window.motorRoletaMulti.resultado) return;

    resVisor.classList.add('escondido');
    disco.classList.add('efeito-blur-giro');
    
    if(!window.SantuarioSomPausado) {
        somCatracaRoleta.currentTime = 0;
        somCatracaRoleta.play().catch(()=>{});
    }

    // 🚨 A MÁGICA DA FÍSICA:
    // 1. Adicionamos no mínimo 5 voltas completas (1800deg) ao ângulo atual
    window.anguloGlobalRoleta += 1800; 
    
    // 2. Calculamos a posição exata do número (Cada fatia tem ~9.72 graus)
    // Subtraímos para o disco girar no sentido horário corretamente
    const ajusteNumero = (window.motorRoletaMulti.resultado.numero * 9.72);
    const anguloFinal = window.anguloGlobalRoleta + (360 - ajusteNumero);

    disco.style.transition = 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)';
    disco.style.transform = `rotate(${anguloFinal}deg)`;

    setTimeout(() => {
        disco.classList.remove('efeito-blur-giro');
        somCatracaRoleta.pause();
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        
        document.getElementById('roleta-multi-res-num').innerText = window.motorRoletaMulti.resultado.numero;
        const rCor = document.getElementById('roleta-multi-res-cor');
        rCor.innerText = window.motorRoletaMulti.resultado.cor;
        rCor.style.color = window.motorRoletaMulti.resultado.cor === 'vermelho' ? '#e74c3c' : (window.motorRoletaMulti.resultado.cor === 'preto' ? '#fff' : '#2ecc71');
        
        resVisor.classList.remove('escondido');

        if (window.motorRoletaMulti.giradoPor === window.motorRoletaMulti.meuId) {
            processarRecompensaRoleta();
        }
    }, 4100);
}

async function processarRecompensaRoleta() {
    let ganho = 0;
    const res = window.motorRoletaMulti.resultado;
    
    Object.values(window.motorRoletaMulti.apostas).forEach(ap => {
        let acertou = false;
        let mult = 2;

        if (ap.tipo === 'vermelho' && res.cor === 'vermelho') acertou = true;
        if (ap.tipo === 'preto' && res.cor === 'preto') acertou = true;
        if (ap.tipo === 'par' && res.numero > 0 && res.numero % 2 === 0) acertou = true;
        if (ap.tipo === 'impar' && res.numero > 0 && res.numero % 2 !== 0) acertou = true;
        if (ap.tipo === 'menor' && res.numero >= 1 && res.numero <= 18) acertou = true;
        if (ap.tipo === 'maior' && res.numero >= 19 && res.numero <= 36) acertou = true;
        if (ap.tipo === 'verde' && res.numero === 0) { acertou = true; mult = 14; } // O Jackpot do Zero!

        if (acertou) ganho += (Number(ap.valor) * mult);
    });

    // Paga apenas números limpos pro core.js
    if (ganho > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(ganho, `Vitória Roleta: ${res.numero}`);
        }
        if(typeof mostrarToast === 'function') mostrarToast(`+${ganho} para o cofre conjunto!`, "🎰");
    } else {
        if(typeof mostrarToast === 'function') mostrarToast(`A mesa levou as fichas.`, "💸");
    }

    // Reseta a mesa para a próxima rodada após 3 segundos
    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        await set(ref(db, `cassino/roleta_royale`), { status: 'apostando', apostas: {}, resultado: null, giradoPor: '' });
        document.getElementById('roleta-multi-resultado').classList.add('escondido');
    }, 4000);
}

// ============================================================================
// ♠️ MOTOR REAL-TIME: TEXAS HOLD'EM POKER (BLINDADO ANTI-CRASH)
// ============================================================================

let motorPoker = {
    meuId: '', parceiroId: '', estado: 'aguardando', turno: '', pote: 0, apostaAtual: 0,
    mesaCartas: [], baralho: [], vencedor: null, vitoriaComemorada: false,
    jogadores: {}
};

window.fecharMesaPoker = function() {
    const mesa = document.getElementById('mesa-poker');
    if(mesa) mesa.style.display = 'none';
};

// ============================================================================
// 1. O OUVINTE DO POKER (COM PAGAMENTO BLINDADO)
// ============================================================================
window.iniciarOuvintePoker = function() {
    motorPoker.meuId = window.souJoao ? 'joao' : 'thamiris';
    motorPoker.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/poker_royale`), async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        motorPoker.estado = data.estado;
        motorPoker.turno = data.turno;
        motorPoker.pote = data.pote;
        motorPoker.apostaAtual = data.apostaAtual;
        motorPoker.vencedor = data.vencedor === "null" ? null : data.vencedor;
        
        motorPoker.baralho = JSON.parse(data.baralho || "[]");
        motorPoker.mesaCartas = JSON.parse(data.mesaCartas || "[]");

        let eu = data.jogadores[motorPoker.meuId] || {};
        let op = data.jogadores[motorPoker.parceiroId] || {};

        motorPoker.jogadores = {
            [motorPoker.meuId]: { ...eu, mao: JSON.parse(eu.mao || "[]") },
            [motorPoker.parceiroId]: { ...op, mao: JSON.parse(op.mao || "[]") }
        };

        // 🚨 FIM DE JOGO E TRANSFERÊNCIA BANCÁRIA
        if (motorPoker.vencedor && !motorPoker.vitoriaComemorada) {
            motorPoker.vitoriaComemorada = true;
            renderizarMesaPoker();
            
            // Lógica de Pagamento
            if (motorPoker.vencedor === motorPoker.meuId) {
                // Vitória sua: Seu celular faz o depósito
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(100, `Prêmio: Poker (Vitória)`);
                if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#2ecc71'], particleCount: 200});
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof mostrarToast === 'function') mostrarToast("VOCÊ VENCEU! +100💰", "🏆");
                
            } else if (motorPoker.vencedor === 'empate') {
                // Empate: Apenas o celular do João processa o dinheiro para não duplicar na conta conjunta!
                if (motorPoker.meuId === 'joao') {
                    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(100, `Prêmio: Poker (Split Pot)`);
                }
                if(typeof confetti === 'function') confetti({colors: ['#3498db', '#ffffff'], particleCount: 100});
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof mostrarToast === 'function') mostrarToast("EMPATE! O prêmio foi dividido.", "🤝");
                
            } else {
                // Derrota
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                if(typeof mostrarToast === 'function') mostrarToast("VOCÊ FOLDOU OU PERDEU! 💀", "🔥");
            }
            return;
        }

        renderizarMesaPoker();
    });
};

function gerarBaralhoPoker() {
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

function criarDivCartaPoker(carta, delay) {
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

function renderizarMesaPoker() {
    if (!motorPoker.jogadores[motorPoker.meuId]) return;
    
    const eu = motorPoker.jogadores[motorPoker.meuId];
    const op = motorPoker.jogadores[motorPoker.parceiroId];

    document.getElementById('poker-pote-valor').innerText = motorPoker.pote;
    document.getElementById('poker-fichas-jogador').innerText = eu.fichas;
    document.getElementById('poker-fichas-oponente').innerText = op.fichas;
    
    document.getElementById('poker-aposta-jogador').innerText = eu.aposta > 0 ? `Apostou: ${eu.aposta}` : '';
    document.getElementById('poker-aposta-oponente').innerText = op.aposta > 0 ? `Apostou: ${op.aposta}` : '';

    const aviso = document.getElementById('poker-estado-aviso');
    if (motorPoker.vencedor) {
        aviso.innerText = motorPoker.vencedor === 'empate' ? "EMPATE (SPLIT POT)" : (motorPoker.vencedor === motorPoker.meuId ? "🏆 VOCÊ VENCEU" : "💀 OPONENTE VENCEU");
        aviso.style.color = motorPoker.vencedor === motorPoker.meuId ? "#2ecc71" : "#e74c3c";
    } else {
        aviso.innerText = motorPoker.estado === 'aguardando' ? "" : motorPoker.estado;
        aviso.style.color = "#f1c40f";
    }

    const maoOponente = document.getElementById('poker-mao-oponente');
    if (maoOponente) {
        maoOponente.innerHTML = "";
        if (motorPoker.estado !== 'aguardando') {
            if (motorPoker.estado === 'showdown' || motorPoker.vencedor) {
                op.mao.forEach(c => maoOponente.innerHTML += criarDivCartaPoker(c, 0));
            } else {
                maoOponente.innerHTML = `<div class="poker-card-back"></div><div class="poker-card-back"></div>`;
            }
        }
    }

    const minhaMao = document.getElementById('poker-minha-mao');
    if (minhaMao) {
        minhaMao.innerHTML = "";
        if (eu.mao) eu.mao.forEach((c, i) => minhaMao.innerHTML += criarDivCartaPoker(c, i*0.2));
    }

    const board = document.getElementById('poker-mesa-cartas');
    if (board) {
        board.innerHTML = "";
        if (motorPoker.mesaCartas) motorPoker.mesaCartas.forEach((c, i) => board.innerHTML += criarDivCartaPoker(c, i*0.1));
    }

    const painelAcao = document.getElementById('poker-painel-acao');
    if (painelAcao && motorPoker.turno === motorPoker.meuId && !motorPoker.vencedor) {
        painelAcao.classList.remove('escondido');
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 50]);
                    }
        
        const btnCall = document.getElementById('btn-poker-check-call');
        const diff = motorPoker.apostaAtual - eu.aposta;
        btnCall.innerText = diff > 0 ? `PAGAR (${diff})` : `CHECK`;
        
        const slider = document.getElementById('poker-raise-slider');
        slider.min = motorPoker.apostaAtual + 20;
        slider.max = eu.fichas;
        slider.value = slider.min;
        document.getElementById('poker-raise-visor').innerText = slider.value;
    } else if (painelAcao) {
        painelAcao.classList.add('escondido');
        document.getElementById('poker-painel-raise').classList.add('escondido');
    }
}

window.acaoPoker = async function(acao, valorRaise = 0) {
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    document.getElementById('poker-painel-raise').classList.add('escondido');
    document.getElementById('poker-painel-acao').classList.add('escondido');

    const { db, ref, update } = window.SantuarioApp.modulos;
    let eu = motorPoker.jogadores[motorPoker.meuId];
    let up = {};

    if (acao === 'fold') {
        up['cassino/poker_royale/vencedor'] = motorPoker.parceiroId;
        await update(ref(db), up);
        return;
    }

    let diff = motorPoker.apostaAtual - eu.aposta;
    if (acao === 'call') {
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/fichas`] = eu.fichas - diff;
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/aposta`] = eu.aposta + diff;
        up[`cassino/poker_royale/pote`] = motorPoker.pote + diff;
        eu.acao = 'call';
    } else if (acao === 'raise') {
        let amt = parseInt(valorRaise);
        let custoReal = amt - eu.aposta; 
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/fichas`] = eu.fichas - custoReal;
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/aposta`] = amt;
        up[`cassino/poker_royale/pote`] = motorPoker.pote + custoReal;
        up[`cassino/poker_royale/apostaAtual`] = amt;
        eu.acao = 'raise';
    }

    up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/acao`] = eu.acao;
    
    let op = motorPoker.jogadores[motorPoker.parceiroId];
    
    // Regras de Avanço do Poker
    if ((eu.acao === 'call' && op.acao !== '') || (eu.acao === 'check' && op.acao === 'check')) {
        up = avancarEstadoPoker(up);
    } else {
        up[`cassino/poker_royale/turno`] = motorPoker.parceiroId;
    }

    await update(ref(db), up);
};

function avancarEstadoPoker(up) {
    up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/aposta`] = 0;
    up[`cassino/poker_royale/jogadores/${motorPoker.parceiroId}/aposta`] = 0;
    up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/acao`] = '';
    up[`cassino/poker_royale/jogadores/${motorPoker.parceiroId}/acao`] = '';
    up[`cassino/poker_royale/apostaAtual`] = 0;
    up[`cassino/poker_royale/turno`] = motorPoker.parceiroId; 

    let baralho = [...motorPoker.baralho]; 
    let mesa = [...motorPoker.mesaCartas]; 

    if (motorPoker.estado === 'preflop') {
        up['cassino/poker_royale/estado'] = 'flop';
        mesa.push(baralho.pop(), baralho.pop(), baralho.pop());
    } else if (motorPoker.estado === 'flop') {
        up['cassino/poker_royale/estado'] = 'turn';
        mesa.push(baralho.pop());
    } else if (motorPoker.estado === 'turn') {
        up['cassino/poker_royale/estado'] = 'river';
        mesa.push(baralho.pop());
    } else if (motorPoker.estado === 'river') {
        up['cassino/poker_royale/estado'] = 'showdown';
        up['cassino/poker_royale/vencedor'] = 'empate'; 
    }

    // 🚨 A MÁGICA: Salva tudo como String invisível para proteger o seu App!
    up['cassino/poker_royale/mesaCartas'] = JSON.stringify(mesa);
    up['cassino/poker_royale/baralho'] = JSON.stringify(baralho);
    return up;
}

// ============================================================================
// 2. O BOTÃO DE NOVA MÃO (RESETANDO A MEMÓRIA DA MESA)
// ============================================================================
window.iniciarMaoPoker = async function() {
    // Cobra a taxa do casal
    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-20, "Taxa: Poker Heads-Up");
    if(typeof mostrarToast === 'function') mostrarToast("Dando as cartas...", "🃏");

    // 🚨 A CORREÇÃO: Limpa o estado da rodada anterior para permitir novos pagamentos
    motorPoker.vitoriaComemorada = false;
    motorPoker.vencedor = null;

    let baralho = gerarBaralhoPoker();
    let maoJoao = [baralho.pop(), baralho.pop()];
    let maoThamiris = [baralho.pop(), baralho.pop()];

    const meuId = window.souJoao ? 'joao' : 'thamiris';
    
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    // Inicia a mesa limpa e segura
    await update(ref(db), {
        'cassino/poker_royale': {
            estado: 'preflop', turno: meuId, pote: 0, apostaAtual: 0,
            mesaCartas: "[]", baralho: JSON.stringify(baralho), vencedor: "null",
            jogadores: {
                joao: { mao: JSON.stringify(maoJoao), fichas: 1000, aposta: 0, acao: '' },
                thamiris: { mao: JSON.stringify(maoThamiris), fichas: 1000, aposta: 0, acao: '' }
            }
        }
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
};

// ============================================================================
// 🎴 MOTOR REAL-TIME: UNO CLASSIC ROYALE (BLINDADO E JUICY)
// ============================================================================

let motorUno = {
    jogando: false, meuId: '', parceiroId: '', turno: '', minhaMao: [],
    cartasOponente: 0, cartaDescarte: null, corAtual: '', pote: 0,
    indexPendente: null, cartaPendente: null, vencedor: null, vitoriaComemorada: false
};

const somHeartbeatUno = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somHeartbeatUno.loop = true;

window.fecharMesaUno = function() {
    somHeartbeatUno.pause();
    const mesa = document.getElementById('mesa-uno');
    if(mesa) mesa.style.display = 'none';
};

// ============================================================================
// 2. O PAGAMENTO DO PRÊMIO AO VENCEDOR
// ============================================================================
window.iniciarOuvinteUno = function() {
    motorUno.meuId = window.souJoao ? 'joao' : 'thamiris';
    motorUno.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, update } = window.SantuarioApp.modulos;
    const unoRef = ref(db, `cassino/uno_royale`);

    onValue(unoRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        motorUno.jogando = true;
        motorUno.turno = data.turno;
        motorUno.cartaDescarte = data.descarte;
        motorUno.corAtual = data.corAtual;
        motorUno.pote = data.pote || 0;
        motorUno.vencedor = data.vencedor || null;
        
        motorUno.minhaMao = data.jogadores[motorUno.meuId]?.mao || [];
        motorUno.cartasOponente = data.jogadores[motorUno.parceiroId]?.qtdCartas || 0;

        // 🚨 FIM DE JOGO E PAGAMENTO
        if (motorUno.vencedor) {
            renderizarMesaUno();
            somHeartbeatUno.pause();
            
            if (motorUno.vencedor === motorUno.meuId && !motorUno.vitoriaComemorada) {
                motorUno.vitoriaComemorada = true;
                
                // 💰 TRANSFERE O POTE PARA A CONTA CONJUNTA
                if(typeof window.atualizarPontosCasal === 'function') {
                    window.atualizarPontosCasal(motorUno.pote, `Prêmio: Vitória no UNO (${motorUno.meuId.toUpperCase()})`);
                }

                if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], particleCount: 300, spread: 160});
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof mostrarToast === 'function') mostrarToast(`VITÓRIA! +${motorUno.pote} 💰 PARA O COFRE!`, "✨");
                
            } else if (motorUno.vencedor !== motorUno.meuId && !motorUno.vitoriaComemorada) {
                motorUno.vitoriaComemorada = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                if(typeof mostrarToast === 'function') mostrarToast("VOCÊ FOI DERROTADO! 💀", "🔥");
            }
            return; 
        }

        // Defesa contra Ataques
        if (data.ataquePendente && data.ataquePendente.alvo === motorUno.meuId) {
            if(typeof mostrarToast === 'function') mostrarToast(`ATAQUE RECEBIDO: +${data.ataquePendente.qtd} CARTAS!`, "🔥");
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 400]);
                    }
            
            for(let i = 0; i < data.ataquePendente.qtd; i++) {
                motorUno.minhaMao.push(gerarCartaUnoAleatoria());
            }
            
            const up = {};
            up[`cassino/uno_royale/jogadores/${motorUno.meuId}/mao`] = motorUno.minhaMao;
            up[`cassino/uno_royale/jogadores/${motorUno.meuId}/qtdCartas`] = motorUno.minhaMao.length;
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
    
    if (visorPote) visorPote.innerText = motorUno.pote;

    if (indTurno && topoOponente) {
        if (motorUno.vencedor) {
            indTurno.innerText = motorUno.vencedor === motorUno.meuId ? "VITÓRIA 🏆" : "DERROTA 💀";
            indTurno.style.color = motorUno.vencedor === motorUno.meuId ? "rgba(212, 175, 55, 0.15)" : "rgba(235, 77, 75, 0.15)";
            topoOponente.innerText = motorUno.vencedor === motorUno.meuId ? "Você aniquilou o adversário!" : "O oponente levou tudo...";
        } else if (motorUno.turno === motorUno.meuId) {
            indTurno.innerText = "SUA VEZ";
            indTurno.style.color = "rgba(46, 204, 113, 0.08)";
            topoOponente.innerText = "Aguardando Oponente...";
        } else {
            indTurno.innerText = "OPONENTE";
            indTurno.style.color = "rgba(235, 77, 75, 0.08)";
            topoOponente.innerText = "Adversário Jogando ⏳";
        }
    }

    const descarte = document.getElementById('uno-descarte');
    if (descarte && motorUno.cartaDescarte) {
        descarte.className = `uno-card uno-${motorUno.corAtual} animacao-descarte`;
        descarte.innerHTML = criarElementoCarta(formatarSimboloUno(motorUno.cartaDescarte.valor));
        setTimeout(() => descarte.classList.remove('animacao-descarte'), 300);
    }

    const oponenteDiv = document.getElementById('uno-mao-oponente');
    if (oponenteDiv) {
        oponenteDiv.innerHTML = "";
        for (let i = 0; i < motorUno.cartasOponente; i++) {
            let back = document.createElement('div');
            back.className = 'uno-card-op';
            back.innerHTML = '<div class="uno-oval-op"></div>';
            oponenteDiv.appendChild(back);
        }
    }

    const minhaMaoDiv = document.getElementById('uno-minha-mao');
    if (minhaMaoDiv) {
        minhaMaoDiv.innerHTML = "";
        motorUno.minhaMao.forEach((carta, index) => {
            let c = document.createElement('div');
            c.className = `uno-card uno-${carta.cor}`;
            c.innerHTML = criarElementoCarta(formatarSimboloUno(carta.valor));

            let podeJogar = false;
            if (motorUno.turno === motorUno.meuId && !motorUno.vencedor) {
                if (carta.cor === 'preto' || carta.cor === motorUno.corAtual || carta.valor === motorUno.cartaDescarte?.valor) {
                    podeJogar = true;
                    c.classList.add('uno-jogavel');
                }
            }

            c.onclick = () => {
                if (motorUno.vencedor) return;
                if (podeJogar) jogarCartaNoFirebase(carta, index);
                else if (motorUno.turno === motorUno.meuId) {
                    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6);
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
                }
            };
            minhaMaoDiv.appendChild(c);
        });
    }

    // 🚨 REVELAÇÃO DO BOTÃO UNO BLINDADA
    const btnGritar = document.getElementById('btn-uno-gritar');
    if (btnGritar) {
        if (motorUno.minhaMao.length === 1 && !motorUno.vencedor) {
            btnGritar.classList.remove('escondido');
            btnGritar.style.display = 'block';
        } else {
            btnGritar.classList.add('escondido');
            btnGritar.style.display = 'none';
        }
    }
}

function avaliarTensaoUno() {
    if (motorUno.vencedor) {
        somHeartbeatUno.pause();
        return;
    }
    if (motorUno.cartasOponente === 1 || motorUno.minhaMao.length === 1) {
        if (!window.SantuarioSomPausado && somHeartbeatUno.paused) somHeartbeatUno.play().catch(e=>{});
    } else {
        somHeartbeatUno.pause();
    }
}

window.jogarCartaNoFirebase = function(carta, index) {
    if (motorUno.vencedor) return;
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.9);
    
    if (carta.cor === 'preto') {
        motorUno.indexPendente = index;
        motorUno.cartaPendente = carta;
        document.getElementById('uno-seletor-cor').classList.remove('escondido');
        return; 
    }
    processarJogada(carta, index, carta.cor);
};

window.escolherCorUno = function(corEscolhida) {
    document.getElementById('uno-seletor-cor').classList.add('escondido');
    processarJogada(motorUno.cartaPendente, motorUno.indexPendente, corEscolhida);
};

async function processarJogada(carta, index, corFinal) {
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    let novaMao = [...motorUno.minhaMao];
    novaMao.splice(index, 1);

    let proximoTurno = motorUno.parceiroId;
    if (carta.valor === 'bloqueio' || carta.valor === 'inverte' || carta.valor === '+2' || carta.valor === '+4') {
        proximoTurno = motorUno.meuId;
    }

    const updates = {};
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/mao`] = novaMao;
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/qtdCartas`] = novaMao.length;
    updates[`cassino/uno_royale/descarte`] = carta;
    updates[`cassino/uno_royale/corAtual`] = corFinal;
    updates[`cassino/uno_royale/turno`] = proximoTurno;

    if (carta.valor === '+2' || carta.valor === '+4') {
        updates[`cassino/uno_royale/ataquePendente`] = { alvo: motorUno.parceiroId, qtd: carta.valor === '+4' ? 4 : 2 };
    }

    if (novaMao.length === 0) {
        updates[`cassino/uno_royale/vencedor`] = motorUno.meuId;
    }

    await update(ref(db), updates);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
}

window.gritarUnoAction = function() {
    document.getElementById('btn-uno-gritar').classList.add('escondido');
    document.getElementById('btn-uno-gritar').style.display = 'none';
    if(typeof confetti === 'function') confetti({colors: ['#eb4d4b', '#f1c40f'], particleCount: 150});
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 0.8);
    if(typeof mostrarToast === 'function') mostrarToast("UNO GRITADO COM SUCESSO!", "📢");
};

function gerarCartaUnoAleatoria() {
    const cores = ['vermelho', 'azul', 'verde', 'amarelo'];
    const valores = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'inverte', 'bloqueio'];
    
    if (Math.random() < 0.08) return { cor: 'preto', valor: Math.random() > 0.5 ? '+4' : 'muda_cor' };
    return { cor: cores[Math.floor(Math.random() * cores.length)], valor: valores[Math.floor(Math.random() * valores.length)] };
}

window.comprarCartaUno = async function() {
    if (motorUno.vencedor || motorUno.turno !== motorUno.meuId) return;
    
    motorUno.minhaMao.push(gerarCartaUnoAleatoria());
    
    const { db, ref, update } = window.SantuarioApp.modulos;
    const updates = {};
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/mao`] = motorUno.minhaMao;
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/qtdCartas`] = motorUno.minhaMao.length;
    updates[`cassino/uno_royale/turno`] = motorUno.parceiroId; 

    await update(ref(db), updates);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
};

// ============================================================================
// 1. A COBRANÇA DA TAXA E CRIAÇÃO DA MESA
// ============================================================================
window.iniciarDueloUno = async function() {
    // 🚨 COBRA A INSCRIÇÃO DA CONTA CONJUNTA
    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-100, "Inscrição: Duelo UNO Royale");
    }

    if(typeof mostrarToast === 'function') mostrarToast("Inscrição paga. Embaralhando...", "🎴");
    
    motorUno.meuId = window.souJoao ? 'joao' : 'thamiris';
    motorUno.parceiroId = window.souJoao ? 'thamiris' : 'joao';
    motorUno.vitoriaComemorada = false; 
    motorUno.vencedor = null; 

    const { db, ref, update } = window.SantuarioApp.modulos;
    
    let maoJoao = [];
    let maoThamiris = [];
    for(let i = 0; i < 7; i++) { 
        maoJoao.push(gerarCartaUnoAleatoria()); 
        maoThamiris.push(gerarCartaUnoAleatoria()); 
    }

    let prim = gerarCartaUnoAleatoria();
    while(prim.cor === 'preto') prim = gerarCartaUnoAleatoria();

    // 🚨 O CASSINO GERA O POTE DE RECOMPENSA (500)
    await update(ref(db), {
        'cassino/uno_royale': {
            turno: motorUno.meuId,
            descarte: prim, corAtual: prim.cor, pote: 500, ataquePendente: null, vencedor: null,
            jogadores: { joao: { mao: maoJoao, qtdCartas: 7 }, thamiris: { mao: maoThamiris, qtdCartas: 7 } }
        }
    });
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
};


// ============================================================================
// 🎲 MOTOR REAL-TIME: CRAPS VEGAS DICE (COM SISTEMA DE PRONTIDÃO CO-OP)
// ============================================================================

window.motorCraps = {
    meuId: '', parceiroId: '',
    status: 'apostando', // 'apostando', 'rolando', 'resultado'
    apostas: {},
    resultado: [6, 6],
    roladoPor: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } // 🚨 NOVO: Controle de Sincronia
};

const facesDado = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const somRolagemDados = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'); 

window.fecharMesaCraps = function() {
    const mesa = document.getElementById('mesa-craps');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

window.iniciarOuvinteCraps = function() {
    window.motorCraps.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorCraps.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/craps_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            window.motorCraps.status = data.status || 'apostando';
            window.motorCraps.apostas = data.apostas || {};
            window.motorCraps.resultado = data.resultado || [6, 6];
            window.motorCraps.roladoPor = data.roladoPor || '';
            window.motorCraps.prontos = data.prontos || { joao: false, thamiris: false };

            renderMesaCraps();

            if (window.motorCraps.status === 'rolando') {
                animarRolagemCraps();
            }
        } catch (e) {
            console.error("Erro no ouvinte de Craps:", e);
        }
    });

    const visor = document.getElementById('craps-ficha-valor');
    if (visor) visor.innerText = window.motorCraps.valorFicha;
};

window.ajustarFichaCraps = function(delta) {
    if (window.motorCraps.status !== 'apostando') return;
    if (window.motorCraps.prontos[window.motorCraps.meuId]) return; // 🚨 Trava se já confirmou
    
    let atual = Number(window.motorCraps.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorCraps.valorFicha = novoValor;
    const visor = document.getElementById('craps-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarCraps = async function(tipo) {
    if (window.motorCraps.status !== 'apostando') return;
    
    // 🚨 Trava de Ação: Se você já apertou Lançar, não pode mais mexer nas fichas!
    if (window.motorCraps.prontos[window.motorCraps.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Você já confirmou! Aguarde o parceiro.", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorCraps.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta Craps: ${tipo}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/craps_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorCraps.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasCraps = async function() {
    if (window.motorCraps.status !== 'apostando') return;
    if (window.motorCraps.prontos[window.motorCraps.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Fichas travadas. Você já confirmou!", "🔒");
        return;
    }

    let totalDevolvido = 0;
    Object.values(window.motorCraps.apostas).forEach(ap => {
        if (ap.autor === window.motorCraps.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Craps");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/craps_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaCraps() {
    const statusTxt = document.getElementById('craps-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorCraps.status === 'rolando' ? "DADOS VOANDO..." : "A MESA ESTÁ QUENTE";
        statusTxt.style.color = window.motorCraps.status === 'rolando' ? "#f1c40f" : "#e67e22";
    }

    // Renderiza fichas físicas
    document.querySelectorAll('#craps-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorCraps.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    // 🚨 MUDANÇA VISUAL DO BOTÃO DE LANÇAMENTO
    const btnLancar = document.getElementById('btn-lancar-craps');
    if (btnLancar) {
        if (window.motorCraps.prontos[window.motorCraps.meuId]) {
            btnLancar.innerText = "AGUARDANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "LANÇAR DADOS 🎲";
            btnLancar.style.background = "linear-gradient(145deg, #e67e22, #d35400)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(230, 126, 34, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#fff";
        }
    }
}

// 🚨 A MÁGICA DA SINCRONIA: Avalia se os dois clicaram
window.lancarDadosCraps = async function() {
    if (window.motorCraps.status !== 'apostando') return;
    if (window.motorCraps.prontos[window.motorCraps.meuId]) return; // Já confirmou

    if (Object.keys(window.motorCraps.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Coloquem fichas na mesa antes de rolar!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const crapsRef = ref(db, `cassino/craps_royale`);

    // Busca o status mais fresco do servidor para evitar conflito de milissegundos
    const snap = await get(crapsRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    // Marca você como pronto
    prontos[window.motorCraps.meuId] = true;

    if (prontos[window.motorCraps.parceiroId] === true) {
        // 🚀 O PARCEIRO JÁ ESTAVA PRONTO! ROLA OS DADOS!
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;

        await update(crapsRef, {
            status: 'rolando',
            resultado: [d1, d2],
            roladoPor: window.motorCraps.meuId, // Você foi o gatilho final
            prontos: { joao: false, thamiris: false } // Reseta os botões
        });
    } else {
        // 🛑 O PARCEIRO AINDA NÃO CLICOU. Atualiza só o botão.
        await update(crapsRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando confirmação da equipe...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarRolagemCraps() {
    const d1El = document.getElementById('craps-dado1');
    const d2El = document.getElementById('craps-dado2');
    const resVisor = document.getElementById('craps-resultado-texto');
    
    if (!d1El || !d2El) return;

    resVisor.classList.add('escondido');
    d1El.classList.add('rolando-dado');
    d2El.classList.add('rolando-dado');
    
    if(!window.SantuarioSomPausado) {
        somRolagemDados.currentTime = 0;
        somRolagemDados.play().catch(()=>{});
    }

    let interval = setInterval(() => {
        d1El.innerText = facesDado[Math.floor(Math.random() * 6) + 1];
        d2El.innerText = facesDado[Math.floor(Math.random() * 6) + 1];
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        d1El.classList.remove('rolando-dado');
        d2El.classList.remove('rolando-dado');
        somRolagemDados.pause();
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200]);
                    }

        const resArray = window.motorCraps.resultado;
        d1El.innerText = facesDado[resArray[0]];
        d2El.innerText = facesDado[resArray[1]];
        
        const soma = resArray[0] + resArray[1];
        resVisor.innerText = soma;
        resVisor.classList.remove('escondido');

        if (window.motorCraps.roladoPor === window.motorCraps.meuId) {
            processarRecompensaCraps();
        }
    }, 2500);
}

async function processarRecompensaCraps() {
    let ganhoTotal = 0;
    const resArray = window.motorCraps.resultado;
    const soma = resArray[0] + resArray[1];
    const ehDuplo = resArray[0] === resArray[1];
    
    Object.values(window.motorCraps.apostas).forEach(ap => {
        let acertou = false;
        let mult = 0;

        if (ap.tipo === 'pass_line' && (soma === 7 || soma === 11)) { acertou = true; mult = 2; }
        if (ap.tipo === 'craps' && (soma === 2 || soma === 3 || soma === 12)) { acertou = true; mult = 8; }
        if (ap.tipo === 'field' && [2,3,4,9,10,11,12].includes(soma)) { acertou = true; mult = 2; }
        if (ap.tipo === 'sete' && soma === 7) { acertou = true; mult = 5; }
        
        if (ap.tipo === 'hardways' && [4,6,8,10].includes(soma) && ehDuplo) { acertou = true; mult = 8; }

        if (acertou) ganhoTotal += (Number(ap.valor) * mult);
    });

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Craps (${soma})`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#e67e22', '#ffffff'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A MESA PAGOU +${ganhoTotal} 💰!`, "🎲");
        }, 500);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Casa levou... 💀`, "💸");
        }, 500);
    }

    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        // Limpa tudo, reseta as apostas e deixa o botão aceso de novo para ambos
        await set(ref(db, `cassino/craps_royale`), { status: 'apostando', apostas: {}, resultado: [6,6], roladoPor: '', prontos: {joao: false, thamiris: false} });
        document.getElementById('craps-resultado-texto').classList.add('escondido');
    }, 3500);
}