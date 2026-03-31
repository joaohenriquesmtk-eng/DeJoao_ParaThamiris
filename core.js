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
// 🛡️ ESCUDO SAFARI GLOBAL (Proteção contra travamentos no iOS)
// ==========================================

// 1. Blindagem de Vibração: Finge que vibrou para o Safari não entrar em pânico
const vibracaoOriginal = navigator.vibrate;
navigator.vibrate = function(padrao) {
    if (typeof vibracaoOriginal === 'function') {
        try {
            return vibracaoOriginal.apply(navigator, [padrao]);
        } catch (erro) {
            return false; // Morre silenciosamente sem travar o código
        }
    }
    return false;
};

// 2. Blindagem de Armazenamento: Protege contra o limite de 5MB da Apple
const setItemOriginal = Storage.prototype.setItem;
Storage.prototype.setItem = function(chave, valor) {
    try {
        setItemOriginal.apply(this, arguments);
    } catch (erro) {
        console.warn(`O Safari bloqueou o salvamento da chave "${chave}". A tela não vai congelar.`);
    }
};

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
    
    // 🚨 A TRAVA DE TITÃ: Se já estiver conectado e vigiando, aborta para não clonar os listeners!
    if (this.conectado) {
        console.log("Satélite já está em órbita. Ignorando reconexão duplicada.");
        return;
    }
    
    const { db, ref, onValue } = this.modulos;
    console.log("Satélite do Santuário Conectado!");

    // Tranca a porta para impedir clones
    this.conectado = true; 

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

    // 11. Ignição do Mural de Recados (Post-its)
    if (typeof window.escutarPostits === 'function') window.escutarPostits();
    

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

    // 1. Atualiza IDs legados (Fazenda e Termo)
    const visores = ['fazenda-capital', 'jardim-moedas', 'termo-moedas'];
    visores.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = window.pontosDoCasal;
    });

    // 2. ATUALIZA A NOVA PÍLULA GLOBAL EM TODOS OS JOGOS
    document.querySelectorAll('.visor-moedas-global-texto').forEach(el => {
        el.innerText = window.pontosDoCasal;
    });
    
    // 3. EFEITO DOPAMINA: Faz a pílula pular e brilhar em verde quando ganha dinheiro
    if (valor > 0) {
        document.querySelectorAll('.visor-moedas-global-container').forEach(el => {
            el.style.transform = 'scale(1.15)';
            el.style.borderColor = '#2ecc71';
            el.style.boxShadow = '0 0 15px rgba(46, 204, 113, 0.6)';
            setTimeout(() => {
                el.style.transform = 'scale(1)';
                el.style.borderColor = 'rgba(212, 175, 55, 0.5)';
                el.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5), inset 0 0 10px rgba(212, 175, 55, 0.2)';
            }, 400);
        });
    }

    console.log(`Economia atualizada: ${motivo} | Saldo: ${window.pontosDoCasal}`);
};

// Função para injetar o valor assim que ela abrir a tela de um jogo
window.sincronizarMoedasUI = function() {
    document.querySelectorAll('.visor-moedas-global-texto').forEach(el => {
        el.innerText = window.pontosDoCasal || 0;
    });
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

// ==========================================
// MURAL DE RECADOS: MOTOR DE ARQUIVAMENTO SEMANAL
// ==========================================

// Abre/Fecha a gaveta visualmente
window.toggleArquivoPostits = function() {
    const conteudo = document.getElementById('conteudo-arquivo-postits');
    const icone = document.getElementById('icone-arquivo-postits');
    if (conteudo && icone) {
        conteudo.classList.toggle('escondido');
        icone.style.transform = conteudo.classList.contains('escondido') ? 'rotate(0deg)' : 'rotate(180deg)';
        if(window.Haptics) window.Haptics.toqueLeve();
    }
};

// Calcula a semana exata de qualquer timestamp (ex: "Semana de 22/03 a 28/03")
window.obterIdentificadorSemana = function(timestamp) {
    const data = new Date(timestamp);
    const diaSemana = data.getDay(); // 0 (Dom) a 6 (Sáb)
    
    // Volta para o Domingo desta semana
    const domingo = new Date(data);
    domingo.setDate(data.getDate() - diaSemana);
    
    // Avança para o Sábado desta semana
    const sabado = new Date(domingo);
    sabado.setDate(domingo.getDate() + 6);
    
    const formataData = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    return `Semana de ${formataData(domingo)} a ${formataData(sabado)} de ${domingo.getFullYear()}`;
};

// O Escutador do Firebase
window.escutarPostits = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, 'postits'), (snapshot) => {
        const areaAtual = document.getElementById('area-postits');
        const areaArquivo = document.getElementById('conteudo-arquivo-postits');
        if (!areaAtual || !areaArquivo) return;

        const dados = snapshot.val();
        areaAtual.innerHTML = '';
        areaArquivo.innerHTML = '';

        if (!dados) {
            areaAtual.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; width: 100%;">O mural está vazio. Fixe o primeiro recado!</p>';
            areaArquivo.innerHTML = '<p style="color: #666; font-style: italic; text-align: center; width: 100%; font-size: 0.85rem;">O arquivo está vazio.</p>';
            return;
        }

        const postits = Object.keys(dados).map(key => ({ id: key, ...dados[key] }));
        postits.sort((a, b) => b.timestamp - a.timestamp); // Mais recentes no topo

        const semanaAtualString = window.obterIdentificadorSemana(Date.now());
        const gruposArquivo = {}; 

        postits.forEach(postit => {
            const semanaPostit = window.obterIdentificadorSemana(postit.timestamp);
            const txtDecodificado = window.SantuarioCrypto ? window.SantuarioCrypto.decodificar(postit.mensagem) : postit.mensagem;
            const dataFormatada = new Date(postit.timestamp).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
            
            // 🚨 A MÁGICA RESTAURADA: Puxando as cores clássicas do seu CSS
            const classeAutor = (postit.autor === 'João') ? 'postit-joao' : 'postit-thamiris';
            const iconeFixado = postit.fixado ? '📌 Fixado' : '📍 Fixar';
            
            // Monta o botão de fixar apenas se o recado for seu
            let btnFixarHtml = '';
            if (postit.autor === window.MEU_NOME) {
                btnFixarHtml = `<button onclick="fixarPostit('${postit.id}', ${!postit.fixado})" class="btn-fixar">${iconeFixado}</button>`;
            }

            // O Chassi Clássico do Postit com as classes originais!
            const htmlPostit = `
                <div class="postit ${classeAutor}">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 4px;">
                        <span class="postit-autor">${postit.autor}</span>
                        <span style="font-size: 0.65rem; opacity: 0.6; font-weight: normal;">${dataFormatada}</span>
                    </div>
                    <div style="font-size: 0.95rem; margin-bottom: 8px; word-wrap: break-word;">${txtDecodificado}</div>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        ${btnFixarHtml}
                        <button onclick="curtirPostit('${postit.id}')" class="btn-curtir">❤️ ${postit.curtidas || 0}</button>
                    </div>
                </div>
            `;
            
            // A MÁGICA DA TRIAGEM
            if (postit.fixado || semanaPostit === semanaAtualString) {
                areaAtual.insertAdjacentHTML('beforeend', htmlPostit);
            } else {
                if (!gruposArquivo[semanaPostit]) gruposArquivo[semanaPostit] = [];
                gruposArquivo[semanaPostit].push(htmlPostit);
            }
        });

        if (areaAtual.innerHTML === '') {
            areaAtual.innerHTML = '<p style="color: #888; font-style: italic; text-align: center; width: 100%;">Nenhum recado na semana atual.</p>';
        }

        // Renderiza o Arquivo Histórico montando as pastas de semanas
        let htmlArquivoFinal = '';
        for (const [semanaStr, listaHtml] of Object.entries(gruposArquivo)) {
            htmlArquivoFinal += `
                <div style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 10px; margin-bottom: 10px;">
                    <h5 style="color: var(--cor-primaria); font-family: 'Playfair Display', serif; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 5px; margin-top: 0; margin-bottom: 15px; font-size: 1rem;">🗂️ ${semanaStr}</h5>
                    ${listaHtml.join('')}
                </div>
            `;
        }
        
        if (htmlArquivoFinal === '') {
            areaArquivo.innerHTML = '<p style="color: #666; font-style: italic; text-align: center; width: 100%; font-size: 0.85rem;">Nenhum recado antigo arquivado.</p>';
        } else {
            areaArquivo.innerHTML = htmlArquivoFinal;
        }
    });
};

// ============================================================================
// 🎰 NAVEGAÇÃO DO CASSINO DO AFETO (O LOBBY VIP E GESTÃO DE ÁUDIO)
// ============================================================================

window.abrirLobbyCassino = function() {
    console.log("Comando recebido: Abrindo Cassino..."); 
    const overlayCassino = document.getElementById('overlay-cassino');
    
    if (overlayCassino) {
        overlayCassino.classList.remove('escondido');
        overlayCassino.classList.remove('takeover-escondido');
        overlayCassino.style.display = 'flex';
        overlayCassino.style.opacity = '1';
        
        if (typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();

        // 🚨 1. O EXTINTOR DE ÁUDIO DO SANTUÁRIO
        // Caba a boca da música romântica imediatamente ao entrar no Cassino
        const musicaApp = document.getElementById('audio-ambiente');
        const musicaJogos = document.getElementById('audio-jogos');
        if (musicaApp) musicaApp.pause();
        if (musicaJogos) musicaJogos.pause();

        // 🚨 2. A IGNIÇÃO DO SOM DO CASSINO
        // Inicia o barulho de cassino lotado automaticamente
        if (window.CassinoAudio) {
            window.CassinoAudio.ativo = true;
            window.CassinoAudio.tocarBGM();
        }
    } else {
        console.error("ERRO: O HTML do 'overlay-cassino' não foi encontrado!");
    }
};

window.fecharCassino = function() {
    const overlayCassino = document.getElementById('overlay-cassino');
    if (overlayCassino) {
        overlayCassino.classList.add('escondido');
        overlayCassino.style.display = 'none';
    }

    // 🚨 3. DESLIGA O CASSINO E DEVOLVE A MÚSICA ROMÂNTICA
    if (window.CassinoAudio) {
        window.CassinoAudio.pausarBGM();
        window.CassinoAudio.ativo = false; // Desliga os efeitos sonoros das máquinas
    }
    
    const musicaApp = document.getElementById('audio-ambiente');
    if (musicaApp) {
        musicaApp.play().catch(e => console.log("Áudio bloqueado pelo navegador ao voltar pro app"));
    }
};

// ============================================================================
// 🏦 SISTEMA BANCÁRIO CENTRAL (CONTA CONJUNTA EM TEMPO REAL)
// ============================================================================

window.pontosDoCasal = 0; // Variável global de memória da UI

window.iniciarContaConjunta = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    // 1. Ouve o saldo consolidado do casal na nuvem em tempo real
    const saldoRef = ref(db, 'banco_central/conta_conjunta/saldo');
    
    onValue(saldoRef, (snapshot) => {
        // Atualiza a memória do celular
        window.pontosDoCasal = snapshot.val() || 0;
        
        // Atualiza TODOS os visores de moeda do aplicativo ao mesmo tempo
        const visores = document.querySelectorAll('.visor-moedas-global-texto, #boutique-moedas-visor, #fazenda-capital');
        visores.forEach(visor => {
            visor.innerText = window.pontosDoCasal.toLocaleString('pt-BR');
        });
    });
};

window.atualizarPontosCasal = function(valorAlteracao, motivo = "Transação") {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, runTransaction, push } = window.SantuarioApp.modulos;
    
    const saldoRef = ref(db, 'banco_central/conta_conjunta/saldo');
    const extratoRef = ref(db, 'banco_central/conta_conjunta/extrato');
    
    // 2. A MÁGICA: runTransaction enfileira as somas lá no servidor do Google.
    // Se vocês dois ganharem 500 no exato mesmo milissegundo, ele soma +1000 perfeitamente!
    runTransaction(saldoRef, (saldoAtual) => {
        let novoSaldo = (saldoAtual || 0) + valorAlteracao;
        return novoSaldo < 0 ? 0 : novoSaldo; // Impede que o casal fique com saldo negativo
    }).then(() => {
        // 3. (Opcional) Cria um "Extrato Bancário" invisível na nuvem para registro
        const eu = window.MEU_NOME || (window.souJoao ? 'João' : 'Thamiris');
        push(extratoRef, {
            autor: eu,
            valor: valorAlteracao,
            motivo: motivo,
            data: Date.now()
        });
    }).catch((erro) => {
        console.error("Erro na transação bancária:", erro);
    });
};

// 4. Inicia a sincronização bancária assim que o login for aprovado
window.addEventListener('loginSucesso', window.iniciarContaConjunta);

// Fallback: Se o login já aconteceu e o script carregou depois, inicia forçado
if (window.usuarioLogado) {
    window.iniciarContaConjunta();
}


// ============================================================================
// 🔇 MOTOR DE SUSPENSÃO DE MÍDIA (COM AUDIÇÃO SELETIVA PARA MENSAGENS)
// ============================================================================

window.SantuarioSomPausado = false;

window.alternarMutarSantuario = function() {
    window.SantuarioSomPausado = !window.SantuarioSomPausado;
    const btn = document.getElementById('btn-mutar-global');
    
    if (window.SantuarioSomPausado) {
        if (btn) { btn.innerText = "🔇"; btn.style.background = "rgba(231, 76, 60, 0.2)"; btn.style.borderColor = "#e74c3c"; }
        if(typeof mostrarToast === 'function') mostrarToast("Músicas de fundo silenciadas", "🔇");
        
        // 1. CAÇA E PAUSA: Encontra mídias rodando, mas POUPA as mensagens de vocês
        document.querySelectorAll('audio, video').forEach(media => {
            const url = media.src || "";
            // Identifica se é uma mensagem pessoal (vem do Firebase Storage, gravação local 'blob:', ou tem classe explícita)
            const isMensagemPessoal = url.includes('firebasestorage') || url.includes('blob:') || media.classList.contains('midia-pessoal');
            
            if (!isMensagemPessoal) {
                media.pause(); // Só pausa se for música/som do sistema
            }
        });
        
        // 2. PAUSA O CASSINO: Desliga o rádio do cassino
        if (window.CassinoAudio && typeof window.CassinoAudio.pausarBGM === 'function') {
            window.CassinoAudio.pausarBGM();
        }
        
    } else {
        if (btn) { btn.innerText = "🔊"; btn.style.background = "rgba(0,0,0,0.7)"; btn.style.borderColor = "var(--cor-primaria)"; }
        if(typeof mostrarToast === 'function') mostrarToast("Sistemas de Áudio Reativados", "🔊");
        
        // Retoma a música ambiente apenas se não estivermos no Cassino
        const overlayCassino = document.getElementById('overlay-cassino');
        if (!overlayCassino || overlayCassino.classList.contains('escondido')) {
            const musicaApp = document.getElementById('audio-ambiente');
            if (musicaApp) musicaApp.play().catch(e=>e);
        }
    }
    
    if (window.Haptics) window.Haptics.toqueLeve();
};

// 🚨 A MÁGICA SÊNIOR: INTERCEPTAÇÃO COM FILTRO DE ORIGEM + ESCUDO SAFARI
const playOriginalAudio = HTMLMediaElement.prototype.play;
HTMLMediaElement.prototype.play = function() {
    if (window.SantuarioSomPausado) {
        const url = this.src || "";
        
        // Filtro Seletivo: A voz de vocês tem passagem VIP livre!
        const isMensagemPessoal = url.includes('firebasestorage') || url.includes('blob:') || this.classList.contains('midia-pessoal');
        
        if (!isMensagemPessoal) {
            // É som de botão, música de fundo ou efeito. Bloqueia em silêncio.
            return Promise.resolve(); 
        }
    }
    
    // 🛡️ ESCUDO SAFARI DE ÁUDIO AQUI:
    // Capturamos a Promessa que o navegador retorna ao tentar tocar a música
    const promessaAudio = playOriginalAudio.apply(this, arguments);
    
    if (promessaAudio !== undefined) {
        return promessaAudio.catch(erro => {
            // Se o iPhone bloquear o "autoplay" da música, o erro cai aqui.
            // O jogo engole o erro e continua rodando liso!
            console.log("Áudio bloqueado pelo iOS, mas o Santuário segue blindado.");
        });
    }
};