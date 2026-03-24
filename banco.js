// ============================================================================
// BANCO CENTRAL DO SANTUÁRIO (TITAN TIER UX)
// ============================================================================

window.bancoEstadoMetas = null;
window.metaSelecionadaParaAporte = null; // Armazena a meta que receberá o dinheiro

window.inicializarBanco = function() {
    console.log("Acessando Private Bank do Santuário...");
    window.atualizarCarteiraBanco();
    window.processarRendimentosDiarios();
    window.escutarBancoGlobal();
};

window.atualizarCarteiraBanco = function() {
    const carteira = document.getElementById('banco-carteira-atual');
    if (carteira) carteira.innerText = (window.pontosDoCasal || 0).toLocaleString('pt-BR');
    
    const streak = parseInt(localStorage.getItem('ritual_streak') || '0');
    const hudStreak = document.getElementById('banco-streak-atual');
    const hudTaxa = document.getElementById('banco-taxa-juros');
    
    if (hudStreak) hudStreak.innerText = streak;
    if (hudTaxa) {
        let taxa = streak * 0.1;
        if (taxa > 5.0) taxa = 5.0;
        hudTaxa.innerText = taxa.toFixed(1);
    }
};

window.toggleInstrucoesBanco = function() {
    const inst = document.getElementById('instrucoes-banco');
    if (inst) inst.classList.toggle('escondido');
};

// --- MODAL DE CRIAÇÃO ---
window.abrirModalCriarMeta = function() {
    const modal = document.getElementById('modal-criar-meta-banco');
    if (modal) modal.classList.remove('escondido');
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.fecharModalCriarMeta = function() {
    const modal = document.getElementById('modal-criar-meta-banco');
    if (modal) modal.classList.add('escondido');
    document.getElementById('banco-input-nome-meta').value = "";
    document.getElementById('banco-input-alvo-meta').value = "";
};

window.criarNovaMeta = function() {
    const nome = document.getElementById('banco-input-nome-meta').value.trim();
    const alvo = parseInt(document.getElementById('banco-input-alvo-meta').value);
    
    if (!nome || isNaN(alvo) || alvo <= 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Preencha o nome e um valor válido!", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, push } = window.SantuarioApp.modulos;
    const refMetas = ref(db, 'banco_central/metas');
    
    push(refMetas, {
        nome: nome,
        alvo: alvo,
        saldo: 0,
        criador: window.MEU_NOME,
        dataCriacao: Date.now(),
        ultimoRendimento: Date.now()
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Fundo de investimento criado com sucesso!", "🏦");
        if(window.Haptics) window.Haptics.sucesso();
        window.fecharModalCriarMeta();
    });
};

// --- SINCRONIZAÇÃO E RENDERIZAÇÃO ---
window.escutarBancoGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refMetas = ref(db, 'banco_central/metas');
    
    onValue(refMetas, (snapshot) => {
        const dados = snapshot.val();
        window.bancoEstadoMetas = dados;
        window.renderizarMetasNaTela();
    });
};

// Efeito de Odômetro para números grandes
window.animarNumeroDinheiro = function(elemento, valorFinal) {
    if (!elemento) return;
    let atual = parseInt(elemento.innerText.replace(/\D/g, '')) || 0;
    if (atual === valorFinal) return; // Não anima se for igual
    
    let incremento = Math.ceil(Math.abs(valorFinal - atual) / 20);
    let duracao = 40; //ms

    let timer = setInterval(() => {
        if (atual < valorFinal) {
            atual += incremento;
            if (atual > valorFinal) atual = valorFinal;
        } else {
            atual -= incremento;
            if (atual < valorFinal) atual = valorFinal;
        }
        elemento.innerText = atual.toLocaleString('pt-BR');
        if (atual === valorFinal) clearInterval(timer);
    }, duracao);
};

window.renderizarMetasNaTela = function() {
    const lista = document.getElementById('lista-metas-banco');
    const hudTotal = document.getElementById('banco-patrimonio-total');
    if (!lista) return;

    lista.innerHTML = "";
    let patrimonioTotal = 0;

    if (!window.bancoEstadoMetas) {
        lista.innerHTML = `<p style="text-align: center; color: #666; font-style: italic; font-family: 'Playfair Display', serif; font-size: 1.1rem; margin-top: 20px;">Nenhum fundo aberto.<br>Criem o primeiro sonho real de vocês.</p>`;
        if (hudTotal) window.animarNumeroDinheiro(hudTotal, 0);
        return;
    }

    const metas = Object.keys(window.bancoEstadoMetas).map(key => ({ id: key, ...window.bancoEstadoMetas[key] }));
    metas.sort((a, b) => b.dataCriacao - a.dataCriacao);

    metas.forEach(meta => {
        const saldoExibicao = Math.floor(meta.saldo);
        patrimonioTotal += saldoExibicao;

        const porcentagem = Math.min((saldoExibicao / meta.alvo) * 100, 100).toFixed(1);
        const concluido = saldoExibicao >= meta.alvo;

        const cartao = document.createElement('div');
        cartao.className = 'cartao-fundo-investimento';
        
        cartao.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px;">
                <h3 style="color: #fff; font-family: 'Playfair Display', serif; font-size: 1.4rem; margin: 0; text-shadow: 0 2px 5px rgba(0,0,0,0.8);">${meta.nome}</h3>
                <span style="color: ${concluido ? '#2ecc71' : '#D4AF37'}; font-weight: bold; font-size: 1.2rem; font-family: monospace; text-shadow: 0 0 10px rgba(${concluido ? '46,204,113' : '212,175,55'},0.5);">${porcentagem}%</span>
            </div>
            
            <p style="font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">
                Valor: <span style="color: #fff; font-weight: bold; font-size: 1rem;">R$ ${saldoExibicao.toLocaleString('pt-BR')}</span> / R$ ${meta.alvo.toLocaleString('pt-BR')}
            </p>

            <div class="barra-progresso-base">
                <div class="barra-progresso-fluxo" style="width: ${porcentagem}%; background: ${concluido ? 'linear-gradient(90deg, #27ae60, #2ecc71)' : ''};"></div>
            </div>

            ${concluido 
                ? `<div style="text-align: center; padding: 12px; background: rgba(46, 204, 113, 0.1); border: 1px solid #2ecc71; border-radius: 8px; color: #2ecc71; font-weight: 900; font-size: 1.1rem; letter-spacing: 2px; text-transform: uppercase; box-shadow: 0 0 15px rgba(46,204,113,0.2);">✨ Fundo Realizado ✨</div>` 
                : `<button class="btn-aporte-luxo" onclick="window.abrirModalAporte('${meta.id}', '${meta.nome}')">
                     <span>💸</span> Realizar Aporte
                   </button>`
            }
        `;

        lista.appendChild(cartao);
    });

    if (hudTotal) window.animarNumeroDinheiro(hudTotal, patrimonioTotal);
};

// --- MODAL DE APORTE (SUBSTITUTO DO PROMPT) ---
window.abrirModalAporte = function(idMeta, nomeMeta) {
    const moedasAtuais = window.pontosDoCasal || 0;
    
    if (moedasAtuais <= 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Carteira Vazia! Joguem no ecossistema para gerar receita.", "📉");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    window.metaSelecionadaParaAporte = { id: idMeta, nome: nomeMeta };
    
    document.getElementById('aporte-nome-fundo').innerText = nomeMeta;
    document.getElementById('aporte-saldo-disponivel').innerText = moedasAtuais.toLocaleString('pt-BR');
    
    const inputValor = document.getElementById('banco-input-valor-aporte');
    inputValor.value = '';
    
    document.getElementById('btn-confirmar-aporte').disabled = true;

    const modal = document.getElementById('modal-aporte-banco');
    if (modal) modal.classList.remove('escondido');
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.fecharModalAporte = function() {
    const modal = document.getElementById('modal-aporte-banco');
    if (modal) modal.classList.add('escondido');
    window.metaSelecionadaParaAporte = null;
};

window.aplicarAporteRapido = function(porcentagem) {
    const moedasAtuais = window.pontosDoCasal || 0;
    const inputValor = document.getElementById('banco-input-valor-aporte');
    const valorCalculado = Math.floor(moedasAtuais * porcentagem);
    
    inputValor.value = valorCalculado;
    window.validarInputAporte(); // Re-avalia o botão Confirmar
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.validarInputAporte = function() {
    const moedasAtuais = window.pontosDoCasal || 0;
    const inputValor = document.getElementById('banco-input-valor-aporte');
    const btnConfirmar = document.getElementById('btn-confirmar-aporte');
    
    const valor = parseInt(inputValor.value);
    
    if (isNaN(valor) || valor <= 0 || valor > moedasAtuais) {
        btnConfirmar.disabled = true;
        inputValor.style.color = '#e74c3c';
    } else {
        btnConfirmar.disabled = false;
        inputValor.style.color = '#2ecc71';
    }
};

window.confirmarAporte = function() {
    if (!window.metaSelecionadaParaAporte) return;
    
    const idMeta = window.metaSelecionadaParaAporte.id;
    const nomeMeta = window.metaSelecionadaParaAporte.nome;
    const inputValor = document.getElementById('banco-input-valor-aporte');
    const valorDepositado = parseInt(inputValor.value);
    
    if (isNaN(valorDepositado) || valorDepositado <= 0) return;

    // Tira o dinheiro da mão
    if (typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(-valorDepositado, `Aporte: ${nomeMeta}`);
        window.atualizarCarteiraBanco();
    }

    // Fecha o modal e vibra
    window.fecharModalAporte();
    if(window.Haptics) navigator.vibrate([50, 100, 50]);

    // Manda pro fundo na nuvem
    const { db, ref, get, update } = window.SantuarioApp.modulos;
    const refMetaEspecifica = ref(db, `banco_central/metas/${idMeta}`);

    get(refMetaEspecifica).then((snapshot) => {
        const dados = snapshot.val();
        if (dados) {
            const novoSaldo = (dados.saldo || 0) + valorDepositado;
            update(refMetaEspecifica, { saldo: novoSaldo }).then(() => {
                if(typeof mostrarToast === 'function') mostrarToast(`Aporte de ${valorDepositado}💰 concluído! Rumo ao alvo.`, "📈");
                if (typeof confetti === 'function') confetti({colors: ['#2ecc71', '#D4AF37'], particleCount: 80, spread: 60, origin: { y: 0.8 }});
            });
        }
    });
};

// --- MOTOR QUÂNTICO DE JUROS ---
window.processarRendimentosDiarios = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    
    const streak = parseInt(localStorage.getItem('ritual_streak') || '0');
    if (streak < 1) return; 

    let taxaDiaria = streak * 0.1;
    if (taxaDiaria > 5.0) taxaDiaria = 5.0;
    const multiplicadorDiario = taxaDiaria / 100;

    const { db, ref, get, update } = window.SantuarioApp.modulos;
    const refMetas = ref(db, 'banco_central/metas');

    // Apenas UM dos celulares deve processar o juros
    if (!window.souJoao) return;

    get(refMetas).then((snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;

        const agora = Date.now();
        let metasAtualizadas = {};
        let houveRendimento = false;

        Object.keys(dados).forEach(key => {
            const meta = dados[key];
            if (meta.saldo >= meta.alvo || meta.saldo <= 0) return; 

            const ultimoRendimento = meta.ultimoRendimento || meta.dataCriacao;
            const diferencaDias = Math.floor((agora - ultimoRendimento) / (1000 * 60 * 60 * 24));

            if (diferencaDias >= 1) {
                const novoSaldo = meta.saldo * Math.pow(1 + multiplicadorDiario, diferencaDias);
                metasAtualizadas[`${key}/saldo`] = novoSaldo;
                metasAtualizadas[`${key}/ultimoRendimento`] = agora;
                houveRendimento = true;
            }
        });

        if (houveRendimento) {
            update(refMetas, metasAtualizadas).then(() => {
                console.log("Rendimento diário calculado e distribuído aos fundos.");
            });
        }
    });
};