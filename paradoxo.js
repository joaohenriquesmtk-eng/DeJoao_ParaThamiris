// ============================================================================
// O PARADOXO DE SCHRÖDINGER (HACKEANDO O GIROSCÓPIO PARA VULNERABILIDADE)
// ============================================================================

window.toggleInstrucoesParadoxo = function() {
    const inst = document.getElementById('instrucoes-paradoxo');
    if (inst) inst.classList.toggle('escondido');
};

// iPhones (iOS 13+) exigem permissão de botão para acessar o giroscópio
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
        // Celulares Android entram direto aqui
        window.toggleInstrucoesParadoxo();
        window.ativarSensorParadoxo();
        if(window.Haptics) window.Haptics.sucesso();
    }
};

window.inicializarParadoxo = function() {
    // Força as instruções a aparecerem primeiro para capturar o clique do usuário (Regra da Apple)
    const instrucoes = document.getElementById('instrucoes-paradoxo');
    if (instrucoes) instrucoes.classList.remove('escondido');
    
    window.paradoxoRevelado = false;
};

window.ativarSensorParadoxo = function() {
    const txtSuperficie = document.getElementById('texto-superficie');
    const txtProfundo = document.getElementById('texto-profundo');
    const valZ = document.getElementById('valor-z');
    // 🚨 MUDANÇA: Agora ele checa se o "cartao-paradoxo" está visível na tela
    const cartao = document.getElementById('cartao-paradoxo');

    const analisarInclinacao = (event) => {
        // 🚨 MUDANÇA: Se o cartão não está no DOM (foi pra gaveta), para o cálculo
        if (!cartao || !document.getElementById('corpo-modal').contains(cartao)) return;

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