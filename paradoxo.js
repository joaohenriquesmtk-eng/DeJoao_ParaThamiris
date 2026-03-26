// ============================================================================
// O PARADOXO DE SCHRÖDINGER E CONTROLE DE TELA CHEIA
// ============================================================================

// 1. Abertura da Tela Cheia
window.abrirParadoxoTelaCheia = function() {
    // Verifica a Trava do Dia
    const hoje = new Date().toLocaleDateString('pt-BR');
    if (localStorage.getItem('santuario_vitoria_dia') !== hoje) {
        if(typeof mostrarToast === 'function') mostrarToast("🔒 Relíquia Selada. Vença o desafio do dia para colher este prêmio!");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const container = document.getElementById('container-paradoxo');
    const navInferior = document.querySelector('.menu-inferior');
    
    if (container) {
        // 🚨 A MÁGICA BRUTA: Arranca o Prisma de onde estiver e joga na tela!
        document.body.appendChild(container); 
        container.classList.remove('escondido');
    }
    
    if (navInferior) navInferior.classList.add('escondido'); 
    document.body.classList.add('modo-jogo-ativo'); 

    if (typeof window.inicializarParadoxo === 'function') window.inicializarParadoxo();
};

// 2. Fechamento da Tela Cheia
window.fecharParadoxoTelaCheia = function() {
    const container = document.getElementById('container-paradoxo');
    const navInferior = document.querySelector('.menu-inferior');
    
    if (container) container.classList.add('escondido');
    if (navInferior) navInferior.classList.remove('escondido');
    document.body.classList.remove('modo-jogo-ativo');
};

// 3. Controle das Instruções
window.toggleInstrucoesParadoxo = function() {
    const inst = document.getElementById('instrucoes-paradoxo');
    if (inst) inst.classList.toggle('escondido');
};

// 4. Permissão da Apple/Giroscópio
window.solicitarPermissaoGiroscopioParadoxo = function() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    window.toggleInstrucoesParadoxo();
                    if(window.Haptics) window.Haptics.sucesso();
                    window.ativarSensorParadoxo();
                } else {
                    if(typeof mostrarToast === 'function') mostrarToast("O Prisma precisa dos sensores para funcionar.", "⚠️");
                }
            })
            .catch(console.error);
    } else {
        // Android entra direto
        window.toggleInstrucoesParadoxo();
        window.ativarSensorParadoxo();
        if(window.Haptics) window.Haptics.sucesso();
    }
};

// 5. Inicialização
window.inicializarParadoxo = function() {
    const instrucoes = document.getElementById('instrucoes-paradoxo');
    if (instrucoes) instrucoes.classList.remove('escondido');
    window.paradoxoRevelado = false;
};

// 6. O Motor Físico do Giroscópio
window.ativarSensorParadoxo = function() {
    const txtSuperficie = document.getElementById('texto-superficie');
    const txtProfundo = document.getElementById('texto-profundo');
    const valZ = document.getElementById('valor-z');
    const container = document.getElementById('container-paradoxo');

    const analisarInclinacao = (event) => {
        // Se a tela foi fechada, para de calcular para poupar bateria
        if (!container || container.classList.contains('escondido')) return;

        let beta = event.beta;   // Inclinação frente/trás (-180 a 180)
        let gamma = event.gamma; // Inclinação esquerda/direita (-90 a 90)
        
        if (beta === null || gamma === null) return;

        let absBeta = Math.abs(beta);
        let inclinacaoVertical = absBeta > 90 ? 180 - absBeta : absBeta;
        let inclinacaoHorizontal = Math.abs(gamma);

        let inclinacaoAbsoluta = Math.max(inclinacaoVertical, inclinacaoHorizontal);
        let progresso = 0; 
        
        if (inclinacaoAbsoluta < 20) {
            progresso = 1; 
        } else if (inclinacaoAbsoluta > 45) {
            progresso = 0; 
        } else {
            progresso = 1 - ((inclinacaoAbsoluta - 20) / 25);
        }

        if (txtSuperficie && txtProfundo) {
            txtSuperficie.style.opacity = 1 - progresso;
            txtSuperficie.style.filter = `blur(${progresso * 10}px)`;

            txtProfundo.style.opacity = progresso;
            txtProfundo.style.filter = `blur(${(1 - progresso) * 10}px)`;
        }

        if (valZ) {
            valZ.innerText = inclinacaoAbsoluta.toFixed(1) + '°';
            valZ.style.color = progresso > 0.8 ? '#ff3366' : '#555';
        }
        
        if (progresso > 0.95 && !window.paradoxoRevelado) {
            window.paradoxoRevelado = true;
            if(window.Haptics) navigator.vibrate([40, 60, 40]);
        } else if (progresso < 0.5) {
            window.paradoxoRevelado = false;
        }
    };

    window.addEventListener('deviceorientation', analisarInclinacao, true);
};