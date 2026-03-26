// ============================================================================
// PAGER RETRÔ (COMUNICAÇÃO DE BAIXA FREQUÊNCIA) - GOD TIER ENGINE
// ============================================================================

window.codigoPagerAtual = "";

window.inicializarPager = function() {
    console.log("Frequência de Rádio 90s Sintonizada.");
    window.codigoPagerAtual = "";
    document.getElementById('pager-input-numeros').innerText = "_";
    window.escutarPagerGlobal();
};

window.digitarPager = function(num) {
    if (window.codigoPagerAtual.length < 5) {
        window.codigoPagerAtual += num;
        document.getElementById('pager-input-numeros').innerText = window.codigoPagerAtual + "_";
        
        // Efeito sonoro de bipe de teclado antigo
        if(window.Haptics) navigator.vibrate(20);
        const beep = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        beep.playbackRate = 3.0; beep.volume = 0.2; beep.play().catch(e=>{});
    }
};

window.limparPager = function() {
    window.codigoPagerAtual = "";
    document.getElementById('pager-input-numeros').innerText = "_";
    if(window.Haptics) navigator.vibrate(20);
};

window.enviarPager = function() {
    if (window.codigoPagerAtual.length === 0) return;

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    // Manda o código para a nuvem
    set(ref(db, 'utilitarios/pager'), {
        codigo: window.codigoPagerAtual,
        autor: window.MEU_NOME,
        timestamp: Date.now()
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Sinal de rádio transmitido.", "📡");
        window.limparPager();
    });
};

window.escutarPagerGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, 'utilitarios/pager'), (snapshot) => {
        const dados = snapshot.val();
        
        // Ele tenta achar as telas. Se o jogo não estiver aberto, isso será 'null'.
        const displayTexto = document.getElementById('pager-display-texto');
        const displayAutor = document.getElementById('pager-display-autor');
        
        if (dados && dados.codigo) {
            // 🚨 A MÁGICA: O "if (displayTexto)" impede que o código quebre!
            if (displayTexto) displayTexto.innerText = dados.codigo;
            
            const hora = new Date(dados.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            if (displayAutor) displayAutor.innerText = `DE: ${dados.autor.substring(0,3).toUpperCase()} ÀS ${hora}`;
            
            // O ALARME TOCA MESMO SE A TELA ESTIVER FECHADA (O objetivo do Pager)
            if (dados.autor !== window.MEU_NOME) {
                if(window.Haptics) navigator.vibrate([200, 100, 200, 100, 200]);
                const alarme = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                alarme.volume = 0.8; alarme.play().catch(e=>{});
                if(typeof mostrarToast === 'function') mostrarToast(`BIP BIP! Mensagem no Pager: ${dados.codigo}`, "📟");
            }
        } else {
            // Se o Pager estiver limpo, só limpa a tela SE a tela existir
            if (displayTexto) displayTexto.innerText = "NO SIGNAL";
            if (displayAutor) displayAutor.innerText = "";
        }
    });
};

window.toggleInstrucoesPager = function() {
    const inst = document.getElementById('instrucoes-pager');
    if (inst) {
        inst.classList.toggle('escondido');
        if (window.Haptics) window.Haptics.toqueLeve();
    }
};

// Deixa o ouvido do Pager ligado 24h para você ser notificado mesmo na tela Home
window.addEventListener('load', () => {
    setTimeout(() => { if(typeof window.escutarPagerGlobal === 'function') window.escutarPagerGlobal(); }, 2000);
});