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
    const container = document.getElementById('container-paradoxo');

    const analisarInclinacao = (event) => {
        // Se a tela foi fechada, para de calcular para poupar bateria
        if (!container || container.classList.contains('escondido')) return;

        let beta = event.beta;   // Inclinação frente/trás (-180 a 180)
        let gamma = event.gamma; // Inclinação esquerda/direita (-90 a 90)
        
        if (beta === null || gamma === null) return;

        // 🚨 A FÍSICA CORRIGIDA (Mesa vs Cama)
        let absBeta = Math.abs(beta);
        
        // Se estiver em pé, beta é ~90. Se na mesa, ~0. Se na cama deitado (tela pra baixo), ~180.
        // A mágica: Transformamos tanto 0 quanto 180 em "0 graus de inclinação vertical".
        let inclinacaoVertical = absBeta > 90 ? 180 - absBeta : absBeta;
        let inclinacaoHorizontal = Math.abs(gamma);

        // A inclinação real da tela em relação ao chão/teto
        let inclinacaoAbsoluta = Math.max(inclinacaoVertical, inclinacaoHorizontal);

        // A Matemática da Transição (Crossfade)
        let progresso = 0; 
        
        // 0 a 20 graus: Totalmente deitado (Lendo na cama ou na mesa)
        // 45 a 90 graus: Em pé (Lendo na rua)
        if (inclinacaoAbsoluta < 20) {
            progresso = 1; // Revela a verdade
        } else if (inclinacaoAbsoluta > 45) {
            progresso = 0; // Mantém a superfície
        } else {
            // Transição suave (Derretimento)
            progresso = 1 - ((inclinacaoAbsoluta - 20) / 25);
        }

        if (txtSuperficie && txtProfundo) {
            txtSuperficie.style.opacity = 1 - progresso;
            txtSuperficie.style.filter = `blur(${progresso * 10}px)`;

            txtProfundo.style.opacity = progresso;
            txtProfundo.style.filter = `blur(${(1 - progresso) * 10}px)`;
        }

        // Mostra os graus exatos no rodapé para você ver a mágica acontecendo
        if (valZ) {
            valZ.innerText = inclinacaoAbsoluta.toFixed(1) + '°';
            valZ.style.color = progresso > 0.8 ? '#ff3366' : '#555';
        }
        
        // Efeito tátil de "Encaixe" quando a mensagem oculta é 100% revelada
        if (progresso > 0.95 && !window.paradoxoRevelado) {
            window.paradoxoRevelado = true;
            if(window.Haptics) navigator.vibrate([40, 60, 40]);
        } else if (progresso < 0.5) {
            window.paradoxoRevelado = false;
        }
    };

    // 'true' no final garante que o evento fure algumas bolhas de segurança do navegador
    window.addEventListener('deviceorientation', analisarInclinacao, true);
};