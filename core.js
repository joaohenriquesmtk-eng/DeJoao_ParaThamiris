// ==========================================
// NÚCLEO DE DADOS E FIREBASE (CORE)
// ==========================================

window.IDS_SANTUARIO = {
    "Qb9ZWjumzhRWYm3Rrb5phpZjj4H2": "joao",
    "meXVetR7D7b8d00Yuw8wjtRlpoi1": "thamiris"
};

window.usuarioLogado = null;
window.souJoao = false;
window.MEU_NOME = "";
window.NOME_PARCEIRO = "";

// ==========================================
// MÁQUINA ENIGMA (CRIPTOGRAFIA DE PONTA-A-PONTA)
// ==========================================
window.SantuarioCrypto = {
    chave: "SANTUARIO_AMOR_BLINDADO_2026", // A chave secreta que só os seus celulares conhecem
    
    codificar: function(texto) {
        if (!texto) return texto;
        let codificado = encodeURIComponent(texto); // Protege os Emojis e Acentos
        let res = "";
        for (let i = 0; i < codificado.length; i++) {
            res += String.fromCharCode(codificado.charCodeAt(i) ^ this.chave.charCodeAt(i % this.chave.length));
        }
        return btoa(res); // Transforma em um Hash seguro para o Banco de Dados
    },
    
    decodificar: function(hash) {
        if (!hash) return hash;
        try {
            let decodificado = atob(hash); // Tenta abrir o Hash
            let res = "";
            for (let i = 0; i < decodificado.length; i++) {
                res += String.fromCharCode(decodificado.charCodeAt(i) ^ this.chave.charCodeAt(i % this.chave.length));
            }
            return decodeURIComponent(res); // Revela os Emojis e o Texto
        } catch(e) {
            return hash; // Se for um post-it antigo (antes da atualização), ele mostra o texto normal
        }
    }
};

window.SantuarioApp = window.SantuarioApp || {};
window.SantuarioApp.inicializado = false;
window.SantuarioApp.modulos = null;

window.SantuarioApp.conectar = function() {
    if (!this.inicializado || !this.modulos) return;
    const { db, ref, onValue } = this.modulos;
    console.log("Satélite do Santuário Conectado!");

    const refPulsoParceiro = ref(db, 'pulsos/' + window.NOME_PARCEIRO.toLowerCase());
    onValue(refPulsoParceiro, (snapshot) => {
        const dados = snapshot.val();
        if (dados && dados.timestamp > window.ultimoPulsoRecebido) {
            window.ultimoPulsoRecebido = dados.timestamp;
            if(typeof window.receberPulsoVisual === 'function') window.receberPulsoVisual();
        }
    });

    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const refContadorParceiro = ref(db, 'pulsosContador/' + window.NOME_PARCEIRO.toLowerCase() + '/' + hoje);
    onValue(refContadorParceiro, (snapshot) => {
        const contador = snapshot.val() || 0;
        if(typeof window.atualizarContadorInterface === 'function') window.atualizarContadorInterface(contador);
    });

    const refJardim = ref(db, 'jardim_global');
    onValue(refJardim, (snapshot) => {
        if (snapshot.exists()) {
            window.statusPlanta = snapshot.val();
        } else {
            window.statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", sequencia: 0, ciclos: 0 };
        }
        if(typeof window.renderizarPlanta === 'function') window.renderizarPlanta();
    });

    const refMoodParceiro = ref(db, 'moods/' + window.NOME_PARCEIRO.toLowerCase());
    onValue(refMoodParceiro, (snapshot) => {
        const dados = snapshot.val();
        if (dados && typeof window.atualizarTelaPeloMood === 'function') {
            window.atualizarTelaPeloMood(dados.estado, dados.timestamp, dados.mensagem);
        }
    });

    const refPostits = ref(db, 'postits');
    onValue(refPostits, (snapshot) => {
        const area = document.getElementById('area-postits');
        if (!area) return;
        area.innerHTML = '';
        const postits = [];
        
        snapshot.forEach((filho) => {
            postits.push({ key: filho.key, ...filho.val() });
        });
        
        postits.sort((a, b) => {
            if (a.fixado && !b.fixado) return -1;
            if (!a.fixado && b.fixado) return 1;
            return b.timestamp - a.timestamp;
        });
        
        postits.forEach(p => {
            const dataObjeto = new Date(p.timestamp);
            const dataFormatada = `${String(dataObjeto.getDate()).padStart(2, '0')}/${String(dataObjeto.getMonth()+1).padStart(2, '0')} às ${String(dataObjeto.getHours()).padStart(2, '0')}:${String(dataObjeto.getMinutes()).padStart(2, '0')}`;
            const classeAutor = (p.autor === 'João') ? 'postit-joao' : 'postit-thamiris';
            const div = document.createElement('div');
            div.className = `postit ${classeAutor}`;
            div.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 4px;">
                    <span class="postit-autor">${p.autor}</span>
                    <span style="font-size: 0.65rem; opacity: 0.6; font-weight: normal;">${dataFormatada}</span>
                </div>
                <div style="font-size: 0.95rem; margin-bottom: 8px;">${window.SantuarioCrypto.decodificar(p.mensagem)}</div>
                <div style="display: flex; gap: 8px; justify-content: flex-end;"></div>
            `;
            if (p.autor === window.MEU_NOME) {
                const btnFixar = document.createElement('button');
                btnFixar.innerText = p.fixado ? '📌 Fixado' : '📍 Fixar';
                btnFixar.className = 'btn-fixar';
                btnFixar.onclick = (e) => { e.stopPropagation(); window.fixarPostit(p.key, !p.fixado); };
                div.querySelector('div:last-child').appendChild(btnFixar);
            }
            const btnCurtir = document.createElement('button');
            btnCurtir.innerText = `❤️ ${p.curtidas || 0}`;
            btnCurtir.className = 'btn-curtir';
            btnCurtir.onclick = (e) => { e.stopPropagation(); window.curtirPostit(p.key); };
            div.querySelector('div:last-child').appendChild(btnCurtir);
            area.appendChild(div);
        });
        if (postits.length > 0) area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
    });

    
    // 6. Listener do Cofre (Ecos Recentes)
        // Invoca o motor de áudio multiplataforma (Samsung/iPhone) construído no script.js
        if (typeof window.escutarEcosDoParceiro === 'function') {
            window.escutarEcosDoParceiro();
        } else {
            console.warn("Atenção: O motor de Ecos ainda não foi carregado.");
        }

        // 6. Listener do Cofre (Ecos Recentes)
        if (typeof window.escutarEcosDoParceiro === 'function') {
            window.escutarEcosDoParceiro();
        } else {
            console.warn("Atenção: O motor de Ecos ainda não foi carregado.");
        }

        // 7. Ignição do Radar de Telepresença (NOVO!)
        if (typeof window.escutarRadarParceiro === 'function') {
            window.escutarRadarParceiro();
        }

        // 8. Ignição do Planetário de Sonhos
        if (typeof window.escutarPlanetario === 'function') window.escutarPlanetario();

        // 9. Ignição do Espelho da Alma
        if (typeof window.escutarEspelhoDaAlma === 'function') window.escutarEspelhoDaAlma();

        // 10. Ignição da Rota do Destino
        if (typeof window.escutarRotaDestino === 'function') window.escutarRotaDestino();
};



// ==========================================
// FUNÇÕES DO PULSO E JARDIM (FIREBASE)
// ==========================================
window.ultimoPulsoRecebido = Date.now();

window.enviarPulso = function() {
    if (!window.SantuarioApp.inicializado || !window.MEU_NOME) {
        if(typeof window.mostrarToast === 'function') window.mostrarToast("Aguardando identificação... tente novamente.");
        return;
    }
    const { db, ref, set, runTransaction } = window.SantuarioApp.modulos;
    
    const refMeuPulso = ref(db, 'pulsos/' + window.MEU_NOME.toLowerCase());
    set(refMeuPulso, { timestamp: Date.now() });

    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const refMeuContador = ref(db, 'pulsosContador/' + window.MEU_NOME.toLowerCase() + '/' + hoje);
    runTransaction(refMeuContador, (valorAtual) => (valorAtual || 0) + 1);
    // Registra o pulso para a Ofensiva Diária
    localStorage.setItem('pulso_enviado_dia', hoje);
    if(typeof window.verificarRitualDoDia === 'function') window.verificarRitualDoDia();

    const btn = document.getElementById("btn-pulso");
    if(btn) {
        btn.classList.add('pulso-enviado'); // Dispara a explosão de luz no CSS
        setTimeout(() => btn.classList.remove('pulso-enviado'), 1500); // Reseta
    }
    
    const feedback = document.getElementById("msg-feedback");
    const txtContador = document.getElementById("contador-pulso");

    if (txtContador) txtContador.innerText = "Sintonia enviada pelo espaço...";
    if (feedback) {
        feedback.innerText = "Chegou lá!";
        feedback.classList.add("visivel");
    }

    setTimeout(() => {
        if (feedback) feedback.classList.remove("visivel");
    }, 2500);
};

window.receberPulsoVisual = function() {
    if (navigator.vibrate) navigator.vibrate([100, 50, 400]);
    if(typeof window.mostrarToast === 'function') window.mostrarToast(`💓 ${window.NOME_PARCEIRO} está pensando em você agora!`);

    const btn = document.getElementById("btn-pulso");
    if (btn) {
        btn.style.transition = "all 0.3s";
        btn.style.boxShadow = "0 0 40px #e74c3c, inset 0 0 20px #e74c3c";
        btn.style.borderColor = "#e74c3c";
        setTimeout(() => { btn.style.boxShadow = ""; btn.style.borderColor = ""; }, 4000);
    }
};

window.atualizarContadorInterface = function(quantidade) {
    const elemento = document.getElementById("contador-pulso");
    if (!elemento || !window.NOME_PARCEIRO) return;

    const nome = window.NOME_PARCEIRO;
    const texto = quantidade > 0 
        ? `💖 ${nome} pensou em você ${quantidade} ${quantidade === 1 ? 'vez' : 'vezes'} hoje`
        : `💭 ${nome} ainda não enviou um sinal hoje`;

    if (elemento.innerText !== texto) {
        elemento.style.transition = 'transform 0.2s, color 0.2s';
        elemento.style.transform = 'scale(1.05)';
        elemento.style.color = '#e84342';
        setTimeout(() => { elemento.style.transform = 'scale(1)'; elemento.style.color = ''; }, 200);
    }
    elemento.innerText = texto;
};

// ==========================================
// BANCO CENTRAL DO SANTUÁRIO (SISTEMA FINANCEIRO)
// ==========================================
// Conserta o "Dinheiro Fantasma": Dá 100 moedas REAIS na primeira vez que o app for aberto
let pontosSalvos = localStorage.getItem('santuario_pontos');
if (pontosSalvos === null) {
    window.pontosDoCasal = 100;
    localStorage.setItem('santuario_pontos', 100);
} else {
    window.pontosDoCasal = parseInt(pontosSalvos) || 0;
}

window.atualizarPontosCasal = function(valor, motivo) {
    window.pontosDoCasal += valor;
    if (window.pontosDoCasal < 0) window.pontosDoCasal = 0;
    localStorage.setItem('santuario_pontos', window.pontosDoCasal);

    // Atualiza TODOS os visores de dinheiro do app instantaneamente
    const visores = ['fazenda-capital', 'jardim-moedas', 'termo-moedas'];
    visores.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = window.pontosDoCasal;
    });

    console.log(`Economia atualizada: ${motivo} | Saldo: ${window.pontosDoCasal}`);
};

// ==========================================
// MOTOR BOTÂNICO SÊNIOR (O CORAÇÃO DO SANTUÁRIO)
// ==========================================

// 1. A MÁGICA VISUAL (Lê os dados da nuvem e desenha a interface)
window.renderizarPlanta = function() {
    if (!window.statusPlanta) return;
    
    const barra = document.getElementById("progresso-crescimento");
    const texto = document.getElementById("status-texto");
    const aviso = document.getElementById("aviso-regada");
    const contadorNumero = document.getElementById('contador-ciclos-numero');
    const porcentagem = document.getElementById('porcentagem-jardim');
    const brilhoBase = document.getElementById('brilho-pedestal');
    
    const capitalUI = document.getElementById('jardim-moedas');
    if (capitalUI) capitalUI.innerText = window.pontosDoCasal || 0;

    // ATUALIZA APENAS O NÚMERO DO BADGE
    if (contadorNumero) contadorNumero.innerText = window.statusPlanta.ciclos || 0;
    
    if (!barra || !texto) return;
    
    // Garante que o nível não estoure visualmente
    let nivelExibicao = window.statusPlanta.nivel;
    if (nivelExibicao > 100) nivelExibicao = 100;
    
    barra.style.width = nivelExibicao + "%";
    if (porcentagem) porcentagem.innerText = Math.floor(nivelExibicao) + "%";

    // As fases narrativas da árvore
    if (nivelExibicao <= 0) texto.innerText = "A semente repousa na terra. Usem a energia de vocês.";
    else if (nivelExibicao < 25) texto.innerText = "As primeiras raízes começam a se firmar no solo.";
    else if (nivelExibicao < 50) texto.innerText = "Um broto forte e verdejante. O amor está crescendo!";
    else if (nivelExibicao < 80) texto.innerText = "Tronco robusto. A Árvore da Vida já provê abrigo e paz.";
    else if (nivelExibicao < 100) texto.innerText = "A folhagem cintila. A magia está prestes a transbordar!";
    else {
        texto.innerText = "FLORESCIMENTO SUPREMO! ✨";
        texto.style.color = "#f1c40f";
        if (brilhoBase) brilhoBase.style.background = "#f1c40f"; // O Prisma fica dourado!
    }

    // Histórico de Ações
    if (window.statusPlanta.diaUltimaRegada) {
        aviso.innerText = `Última nutrição: ${window.statusPlanta.diaUltimaRegada}`;
    } else {
        aviso.innerText = "Aguardando o primeiro toque de vida.";
    }
};

// 2. AÇÃO DE NUTRIR (A integração de esforços)
window.nutrirPlanta = function(tipoAcao) {
    // A. Verifica se tem saldo no Banco Central do Casal
    const saldoAtual = window.pontosDoCasal || 0;
    let custo = 0;
    let ganhoXP = 0;
    let nomeAcao = "";
    let somAcao = null;

    if (tipoAcao === 'agua') { custo = 10; ganhoXP = 2; nomeAcao = "Orvalho"; somAcao = new Audio('assets/sons/mf/regar.mp3'); }
    if (tipoAcao === 'luz') { custo = 25; ganhoXP = 6; nomeAcao = "Luz Solar"; somAcao = new Audio('assets/sons/acerto.mp3'); }
    if (tipoAcao === 'magia') { custo = 50; ganhoXP = 15; nomeAcao = "Pó de Estrela"; somAcao = new Audio('assets/sons/nivel.mp3'); }

    if (saldoAtual < custo) {
        if (typeof mostrarToast === 'function') mostrarToast(`Vocês precisam de ${custo}💰! Vençam jogos juntos.`, "⚠️");
        if (window.Haptics) window.Haptics.erro();
        return; // Bloqueia a ação
    }

    // B. Gasta o dinheiro (O suor das outras fazendas)
    if (typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-custo, `Comprou ${nomeAcao} para a Árvore`);
    
    // Atualiza visualmente na mesma hora
    const capitalUI = document.getElementById('jardim-moedas');
    if (capitalUI) capitalUI.innerText = window.pontosDoCasal;

    // C. Aplica o crescimento
    window.statusPlanta.nivel += ganhoXP;
    
    const quemAgiu = window.MEU_NOME || "Um coração anônimo";
    window.statusPlanta.diaUltimaRegada = `${quemAgiu} enviou ${nomeAcao} hoje.`;

    // Efeitos sensoriais
    if (somAcao) { somAcao.volume = 0.2; somAcao.play(); }
    if (window.Haptics) window.Haptics.sucesso();
    if (typeof mostrarToast === 'function') mostrarToast(`${nomeAcao} enviada para a Árvore! +${ganhoXP}%`, "🌿");

    // D. O GRANDE MOMENTO: Chegou a 100%?
    if (window.statusPlanta.nivel >= 100) {
        window.statusPlanta.ciclos += 1; // Guarda na memória que completaram um ciclo
        window.statusPlanta.nivel = 0; // Renasce (Prestige)
        
        if (typeof mostrarToast === 'function') mostrarToast("A Árvore da Vida completou um ciclo! Renascendo mais forte...", "🌟");
        if (window.Haptics) navigator.vibrate([100, 50, 100, 50, 200]);
        if (typeof confetti === 'function') confetti({colors: ['#2ecc71', '#f1c40f', '#fff'], particleCount: 200, spread: 160});
        
        // Pode dar um prêmio em dinheiro ao resetar o ciclo
        if (typeof atualizarPontosCasal === 'function') atualizarPontosCasal(200, `Recompensa de Florescimento!`);
    }

    // E. Salva as mudanças direto na Nuvem!
    salvarProgressoPlantaFirebase();
    
    // Atualiza a tela
    renderizarPlanta();
};

function salvarProgressoPlantaFirebase() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const refPlanta = ref(db, 'jardim_global/status');
    set(refPlanta, window.statusPlanta).catch(erro => {
        console.error("Erro ao enraizar dados na nuvem:", erro);
    });
}

// Botão de instrução (Coloque em qualquer lugar do seu script)
window.toggleInstrucoesJardim = function() {
    const el = document.getElementById('instrucoes-jardim');
    if (el) el.classList.toggle('escondido');
};