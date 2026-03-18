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
        btn.classList.add('pulso-enviado');
        setTimeout(() => btn.classList.remove('pulso-enviado'), 1000);
        btn.classList.add("germinar");
    }
    
    const icone = document.getElementById("icone-semente");
    const feedback = document.getElementById("msg-feedback");
    const txtContador = document.getElementById("contador-pulso");

    if (icone) {
        icone.innerText = "💖";
        icone.classList.add("pulsando-forte");
    }
    if (txtContador) txtContador.innerText = "Sintonia enviada pelo espaço...";
    if (feedback) {
        feedback.innerText = "Chegou lá!";
        feedback.classList.add("visivel");
    }

    setTimeout(() => {
        if (icone) {
            icone.innerText = "🌱";
            icone.classList.remove("pulsando-forte");
        }
        if (btn) btn.classList.remove("germinar");
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

window.regarPlanta = function() {
    if (!window.SantuarioApp.inicializado || !window.MEU_NOME) {
        if(typeof window.mostrarToast === 'function') window.mostrarToast("Aguardando identificação...");
        return;
    }

    const { db, ref, get, set } = window.SantuarioApp.modulos;
    const refJardim = ref(db, 'jardim_global');

    get(refJardim).then((snapshot) => {
        let dados = snapshot.val() || { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", sequencia: 0, ciclos: 0 };
        const agora = new Date();
        const hoje = agora.toLocaleDateString('pt-BR');

        if (dados.diaUltimaRegada === hoje) {
            if(typeof window.mostrarToast === 'function') window.mostrarToast("A terra já está úmida hoje. Voltem amanhã! 🌱");
            return;
        }

        const somRega = new Audio('assets/sons/mf/regar.mp3');
        somRega.volume = 0.4;
        somRega.play().catch(e => console.log('Áudio bloqueado:', e));

        const prisma = document.getElementById('prisma-3d');
        if (prisma) {
            for (let i = 0; i < 5; i++) {
                const gota = document.createElement('div');
                gota.className = 'gota';
                gota.style.left = (Math.random() * 40 + 30) + '%'; 
                gota.style.top = '5%';
                prisma.appendChild(gota);
                setTimeout(() => gota.remove(), 600);
            }
        }

        const ontem = new Date();
        ontem.setDate(agora.getDate() - 1);
        if (dados.diaUltimaRegada === ontem.toLocaleDateString('pt-BR')) {
            dados.sequencia += 1;
        } else {
            dados.sequencia = 1;
        }

        dados.nivel += 4;
        if (dados.nivel >= 100) {
            dados.ciclos += 1;
            dados.nivel = 0;
            if(typeof window.mostrarToast === 'function') window.mostrarToast(`🌸 CICLO COMPLETO! O amor de vocês atingiu um novo nível!`);
        } else {
            if(typeof window.mostrarToast === 'function') window.mostrarToast(`💦 Planta regada por ${window.MEU_NOME}!`);
        }

        dados.diaUltimaRegada = hoje;
        dados.ultimaRegada = agora.getTime();

        set(refJardim, dados);
        window.statusPlanta = dados;
        if(typeof window.verificarRitualDoDia === 'function') window.verificarRitualDoDia();
        if(typeof window.renderizarPlanta === 'function') window.renderizarPlanta();
    });
};

window.renderizarPlanta = function() {
    if (!window.statusPlanta) return;
    const barra = document.getElementById("progresso-crescimento");
    const texto = document.getElementById("status-texto");
    const aviso = document.getElementById("aviso-regada");
    const contadorCiclos = document.getElementById('contador-ciclos');
    
    if (contadorCiclos) contadorCiclos.innerText = `🌱 Ciclos completados: ${window.statusPlanta.ciclos || 0}`;
    if (!barra || !texto) return; 
    
    barra.style.width = window.statusPlanta.nivel + "%";

    if (window.statusPlanta.nivel <= 0) texto.innerText = "Um novo ciclo se inicia. Cuidem juntos.";
    else if (window.statusPlanta.nivel < 25) texto.innerText = "As raízes estão se firmando.";
    else if (window.statusPlanta.nivel < 50) texto.innerText = "Crescimento contínuo e forte.";
    else if (window.statusPlanta.nivel < 90) texto.innerText = "A folhagem já provê abrigo e paz.";
    else texto.innerText = "Prestes a florescer um novo marco!";

    if (window.statusPlanta.diaUltimaRegada === new Date().toLocaleDateString('pt-BR')) {
        if (aviso) aviso.innerText = "Solo nutrido por hoje. Descansem.";
    } else {
        if (aviso) aviso.innerText = "A planta aguarda a água de um de vocês.";
    }
};