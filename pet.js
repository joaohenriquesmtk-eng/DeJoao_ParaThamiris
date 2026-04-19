// ============================================================================
// O GUARDIÃO VETORIAL (HOLOGRAMA) - TITAN TIER ENGINE
// ============================================================================

window.estadoPet = {
    fome: 100, sede: 100, afeto: 100,
    ultimoUpdate: Date.now(),
    taxaDecaimentoMs: 30 * 60 * 1000 // Perde 1 ponto a cada 30 minutos
};

window.loopPetLocal = null;
window.petOffGlobal = null;
window.petAudioAcao = null;
window.petAudioSuper = null;

window.inicializarGuardiao = function() {
    console.log("Ligando Feixes de Luz da Incubadora...");

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('guardiao');
    }

    if (!window.petAudioAcao) {
        window.petAudioAcao = new Audio('./assets/sons/pet/cat.mp3');
        window.petAudioAcao.volume = 0.5;
    }

    if (!window.petAudioSuper) {
        window.petAudioSuper = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        window.petAudioSuper.volume = 1.0;
    }

    window.escutarPetGlobal();

    if (window.loopPetLocal) clearInterval(window.loopPetLocal);
    window.loopPetLocal = setInterval(window.processarDecaimentoPet, 60000);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addInterval('guardiao', window.loopPetLocal);
    }
};

window.toggleInstrucoesGuardiao = function() {
    const inst = document.getElementById('instrucoes-guardiao');
    if (inst) inst.classList.toggle('escondido');
};

window.processarDecaimentoPet = function() {
    const agora = Date.now();
    const tempoPassado = agora - window.estadoPet.ultimoUpdate;
    const pontosPerdidos = Math.floor(tempoPassado / window.estadoPet.taxaDecaimentoMs);

    if (pontosPerdidos > 0 && window.souJoao) {
        let novaFome = Math.max(0, window.estadoPet.fome - pontosPerdidos);
        let novaSede = Math.max(0, window.estadoPet.sede - (pontosPerdidos * 1.5));
        let novoAfeto = Math.max(0, window.estadoPet.afeto - (pontosPerdidos * 0.8));

        if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
        const { db, ref, update } = window.SantuarioApp.modulos;
        update(ref(db, 'utilitarios/guardiao'), {
            fome: novaFome, sede: novaSede, afeto: novoAfeto, ultimoUpdate: agora
        });
    }
};

window.escutarPetGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    const refPet = ref(db, 'utilitarios/guardiao');

    window.petOffGlobal = onValue(refPet, (snapshot) => {
        const dados = snapshot.val();
        if (dados) {
            window.estadoPet.fome = dados.fome;
            window.estadoPet.sede = dados.sede;
            window.estadoPet.afeto = dados.afeto;
            window.estadoPet.ultimoUpdate = dados.ultimoUpdate;
        } else {
            set(refPet, window.estadoPet);
        }
        window.renderizarHolograma();
    });

    if (window.SantuarioRuntime && window.petOffGlobal) {
        window.SantuarioRuntime.addCleanup('guardiao', window.petOffGlobal);
    }
};

// --- O MOTOR GRÁFICO DO HOLOGRAMA ---
window.renderizarHolograma = function() {
    // 🚨 A TRAVA DE SEGURANÇA MESTRA (O Pulo do Gato)
    // Verifica se a tela do Guardião está realmente aberta. Se não estiver, sai em silêncio e não trava nada!
    const barraFome = document.getElementById('barra-fome-pet');
    if (!barraFome) return; 

    const fome = window.estadoPet.fome;
    const sede = window.estadoPet.sede;
    const afeto = window.estadoPet.afeto;

    // Atualiza HUD Sci-Fi
    barraFome.style.width = `${fome}%`;
    document.getElementById('barra-sede-pet').style.width = `${sede}%`;
    document.getElementById('barra-afeto-pet').style.width = `${afeto}%`;

    document.getElementById('texto-fome-pet').innerText = `${Math.floor(fome)}%`;
    document.getElementById('texto-sede-pet').innerText = `${Math.floor(sede)}%`;
    document.getElementById('texto-afeto-pet').innerText = `${Math.floor(afeto)}%`;

    // Construtores Visuais do Pet
    const petContainer = document.getElementById('entidade-pet');
    const olhoEsq = document.getElementById('pet-olho-esq');
    const olhoDir = document.getElementById('pet-olho-dir');
    const zzz = document.getElementById('pet-zzz');
    const msg = document.getElementById('mensagem-status-pet');
    
    // Reseta Animações
    petContainer.className = "pet-vivo-animacao"; 
    zzz.classList.add('escondido');
    
    // As Expressões do Rosto SVG
    const svgNormal = "M 60,110 Q 75,95 90,110";
    const svgNormalDir = "M 140,110 Q 125,95 110,110";
    
    const svgFeliz = "M 60,110 Q 75,120 90,110"; // Arco pra baixo
    const svgFelizDir = "M 140,110 Q 125,120 110,110";
    
    const svgTriste = "M 60,105 Q 75,95 90,115"; // Olhar caído
    const svgTristeDir = "M 140,105 Q 125,95 110,115";

    const svgDormindo = "M 60,115 L 90,115"; // Linha reta fechada
    const svgDormindoDir = "M 140,115 L 110,115";

    // A LÓGICA DE ESTADO FÍSICO
    if (fome < 30 || sede < 30) {
        // ESTADO DE ALERTA (GLITCH VERMELHO)
        petContainer.style.setProperty('--pet-cor-base', '#e74c3c');
        petContainer.classList.add('pet-glitch');
        olhoEsq.setAttribute('d', svgTriste);
        olhoDir.setAttribute('d', svgTristeDir);
        msg.innerText = "ALERTA: BIO-ESTRUTURA COMPROMETIDA";
        
    } else if (afeto < 40) {
        // ESTADO CARENTE (AMARELO DIMINUINDO)
        petContainer.style.setProperty('--pet-cor-base', '#f1c40f');
        olhoEsq.setAttribute('d', svgTriste);
        olhoDir.setAttribute('d', svgTristeDir);
        msg.innerText = "AVISO: NÍVEL DE AFETO BAIXO";
        
    } else if (fome > 85 && sede > 85 && afeto > 85) {
        // ESTADO SUPREMO (DOURADO INTENSO)
        petContainer.style.setProperty('--pet-cor-base', '#FFD700');
        olhoEsq.setAttribute('d', svgFeliz);
        olhoDir.setAttribute('d', svgFelizDir);
        msg.innerText = "SISTEMA OPERACIONAL EM CAPACIDADE MÁXIMA";
        
    } else {
        // ESTADO REPOUSO (CÍANO PACÍFICO)
        petContainer.style.setProperty('--pet-cor-base', '#00d4ff');
        petContainer.classList.add('pet-dormindo');
        zzz.classList.remove('escondido');
        olhoEsq.setAttribute('d', svgDormindo);
        olhoDir.setAttribute('d', svgDormindoDir);
        msg.innerText = "MODO DE REPOUSO ATIVADO";
    }
};

window.cuidarDoPet = async function(tipoAcao) {
    let custoMoedas = 0; let incremento = 0; let sfx = './assets/sons/pet/cat.mp3'; 
    let itemGasto = null; let inventario = window.inventarioCasal || {};

    // 1. A LÓGICA DE CUSTOS COLOSSAIS E HACKS ORGÂNICOS
    if (tipoAcao === 'fome_sintetica') {
        custoMoedas = 8500; incremento = 20;
    } else if (tipoAcao === 'sede_sintetica') {
        custoMoedas = 6000; incremento = 25;
    } else if (tipoAcao === 'afeto_basico') {
        custoMoedas = 5000; incremento = 10;
    } else if (tipoAcao === 'afeto_terapia') {
        custoMoedas = 25000; incremento = 100; // Enche tudo, mas causa um rombo bancário
        sfx = 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3';
    } else if (tipoAcao === 'fome_organica') {
        if (inventario.morangos > 0) itemGasto = 'morangos';
        else if (inventario.cenouras > 0) itemGasto = 'cenouras';
        else {
            if(typeof mostrarToast === 'function') mostrarToast("Sem Morangos/Cenouras na Mochila! Cultivem!", "🍓");
            if(window.Haptics) window.Haptics.erro();
            return;
        }
        incremento = 100; // Hack Supremo
        sfx = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';
    } else if (tipoAcao === 'sede_organica') {
        if (inventario.gotas_orvalho > 0) itemGasto = 'gotas_orvalho';
        else {
            if(typeof mostrarToast === 'function') mostrarToast("Sem Gotas de Orvalho na Mochila! Liguem a Estufa!", "💧");
            if(window.Haptics) window.Haptics.erro();
            return;
        }
        incremento = 100; // Hack Supremo
        sfx = 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3';
    }

    // 2. VALIDAÇÃO DE SALDO (A Dor do Custo)
    const moedasAtuais = window.pontosDoCasal || 0;
    if (custoMoedas > 0 && moedasAtuais < custoMoedas) {
        if(typeof mostrarToast === 'function') mostrarToast(`Fundos insuficientes! O Guardião exige ${custoMoedas.toLocaleString('pt-BR')} moedas.`, "💸");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    // 3. DÉBITO (Moedas ou Mochila)
    if (custoMoedas > 0 && typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(-custoMoedas, "Manutenção do Guardião");
    }
    if (itemGasto && typeof window.adicionarItemInventario === 'function') {
        await window.adicionarItemInventario(itemGasto, -1);
    }

    // 4. APLICAÇÃO DOS STATUS
    let ehFome = tipoAcao.includes('fome');
    let ehSede = tipoAcao.includes('sede');
    let ehAfeto = tipoAcao.includes('afeto');

    let novaFome = ehFome ? Math.min(100, window.estadoPet.fome + incremento) : window.estadoPet.fome;
    let novaSede = ehSede ? Math.min(100, window.estadoPet.sede + incremento) : window.estadoPet.sede;
    let novoAfeto = ehAfeto ? Math.min(100, window.estadoPet.afeto + incremento) : window.estadoPet.afeto;

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    update(ref(db, 'utilitarios/guardiao'), {
        fome: novaFome, sede: novaSede, afeto: novoAfeto, ultimoUpdate: Date.now()
    }).then(() => {
        // Efeitos Visuais
        if (window.Haptics && window.safeVibrate) {
            window.safeVibrate(itemGasto ? [100, 100, 100] : [50, 50]);
        }
        if (!window.petAudioAcao || window.petAudioAcao.src !== new URL(sfx, window.location.href).href) {
            window.petAudioAcao = new Audio(sfx);
            window.petAudioAcao.volume = 0.5;
        }

        window.petAudioAcao.currentTime = 0;
        if (window.safePlayMedia) {
            window.safePlayMedia(window.petAudioAcao);
        } else {
            window.petAudioAcao.play().catch(() => {});
        }
        
        document.getElementById('entidade-pet').classList.add('pet-comendo');
        setTimeout(() => document.getElementById('entidade-pet').classList.remove('pet-comendo'), 1200);

        // 🚨 5. O EVENTO ÉPICO: PROTOCOLO SUPERNOVA (JACKPOT GIGANTE) 🌌
        if (novaFome === 100 && novaSede === 100 && novoAfeto === 100) {
            
            // Só aciona o Jackpot se você acabou de encher a última barra (evita spam)
            if (window.estadoPet.fome < 100 || window.estadoPet.sede < 100 || window.estadoPet.afeto < 100) {
                
                // Trava a tela e faz o efeito
                document.getElementById('entidade-pet').style.transform = "scale(1.5)";
                document.getElementById('entidade-pet').style.filter = "drop-shadow(0 0 50px #fff)";
                document.getElementById('mensagem-status-pet').innerText = "⚠️ PROTOCOLO SUPERNOVA ATIVADO ⚠️";
                document.getElementById('mensagem-status-pet').style.color = "#fff";
                
                if (window.Haptics && window.safeVibrate) {
                    window.safeVibrate([300, 100, 400, 100, 500, 100, 800]);
                }
                
                setTimeout(() => {
                    // O Jackpot Cósmico (Entre 50.000 e 150.000 moedas)
                    const jackpot = Math.floor(Math.random() * 100000) + 50000;
                    
                    if (typeof atualizarPontosCasal === 'function') atualizarPontosCasal(jackpot, "SUPERNOVA DO GUARDIÃO");
                    if (typeof mostrarToast === 'function') mostrarToast(`Atenção Cósmica! O Guardião expeliu +${jackpot.toLocaleString('pt-BR')} 💰!`, "🌌");
                    if (typeof confetti === 'function') confetti({colors: ['#FFD700', '#ffffff', '#00f2fe'], particleCount: 400, spread: 180, zIndex: 9999999});
                    
                    if (!window.petAudioSuper) {
                        window.petAudioSuper = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
                        window.petAudioSuper.volume = 1.0;
                    }

                    window.petAudioSuper.currentTime = 0;
                    if (window.safePlayMedia) {
                        window.safePlayMedia(window.petAudioSuper);
                    } else {
                        window.petAudioSuper.play().catch(() => {});
                    }

                    // Retorna ao normal após o surto
                    setTimeout(() => {
                        document.getElementById('entidade-pet').style.transform = "scale(1)";
                        document.getElementById('entidade-pet').style.filter = "none";
                    }, 2000);
                    
                }, 1500);
            }
        }
    });
};