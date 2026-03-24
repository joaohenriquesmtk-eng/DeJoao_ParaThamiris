// ============================================================================
// O GUARDIÃO VETORIAL (HOLOGRAMA) - TITAN TIER ENGINE
// ============================================================================

window.estadoPet = {
    fome: 100, sede: 100, afeto: 100,
    ultimoUpdate: Date.now(),
    taxaDecaimentoMs: 30 * 60 * 1000 // Perde 1 ponto a cada 30 minutos
};

window.loopPetLocal = null;

window.inicializarGuardiao = function() {
    console.log("Ligando Feixes de Luz da Incubadora...");
    window.escutarPetGlobal();
    
    if (window.loopPetLocal) clearInterval(window.loopPetLocal);
    window.loopPetLocal = setInterval(window.processarDecaimentoPet, 60000); 
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
    
    onValue(refPet, (snapshot) => {
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
        window.processarDecaimentoPet(); 
    });
};

// --- O MOTOR GRÁFICO DO HOLOGRAMA ---
window.renderizarHolograma = function() {
    const fome = window.estadoPet.fome;
    const sede = window.estadoPet.sede;
    const afeto = window.estadoPet.afeto;

    // Atualiza HUD Sci-Fi
    document.getElementById('barra-fome-pet').style.width = `${fome}%`;
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

window.cuidarDoPet = function(tipo) {
    let custo = 0; let incremento = 0; let sfx = '';
    
    if (tipo === 'fome') {
        custo = 10; incremento = 30; 
        sfx = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'; 
    } else if (tipo === 'sede') {
        custo = 0; incremento = 40;
        sfx = 'https://assets.mixkit.co/active_storage/sfx/2405/2405-preview.mp3'; 
    } else if (tipo === 'afeto') {
        custo = 0; incremento = 25;
        sfx = 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'; 
    }

    const moedasAtuais = window.pontosDoCasal || 0;
    if (moedasAtuais < custo) {
        if(typeof mostrarToast === 'function') mostrarToast("Recursos insuficientes.", "📉");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if (custo > 0 && typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(-custo, "Síntese de Ração");
    }

    let novaFome = tipo === 'fome' ? Math.min(100, window.estadoPet.fome + incremento) : window.estadoPet.fome;
    let novaSede = tipo === 'sede' ? Math.min(100, window.estadoPet.sede + incremento) : window.estadoPet.sede;
    let novoAfeto = tipo === 'afeto' ? Math.min(100, window.estadoPet.afeto + incremento) : window.estadoPet.afeto;

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    update(ref(db, 'utilitarios/guardiao'), {
        fome: novaFome, sede: novaSede, afeto: novoAfeto, ultimoUpdate: Date.now()
    }).then(() => {
        if (window.Haptics) navigator.vibrate([50, 100, 50]);
        const audio = new Audio(sfx); audio.volume = 0.5; audio.play().catch(e=>{});
        
        // Dispara a animação de pulo
        document.getElementById('entidade-pet').classList.add('pet-comendo');
        setTimeout(() => document.getElementById('entidade-pet').classList.remove('pet-comendo'), 1200);

        if(typeof confetti === 'function') confetti({colors: ['#fd9644', '#00d4ff', '#ffffff'], particleCount: 80, spread: 80, origin: {y: 0.5}});
        
        // Mineração Holográfica
        if (novaFome >= 90 && novaSede >= 90 && novoAfeto >= 90) {
            if (Math.random() < 0.25) { // 25% chance
                setTimeout(() => {
                    const premio = Math.floor(Math.random() * 50) + 10;
                    if (typeof atualizarPontosCasal === 'function') atualizarPontosCasal(premio, "Mineração do Guardião");
                    if(window.Haptics) navigator.vibrate([200, 100, 400]);
                    if(typeof mostrarToast === 'function') mostrarToast(`O Guardião minerou +${premio}💰!`, "💎");
                }, 1000);
            }
        }
    });
};