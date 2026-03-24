// ============================================================================
// CARTÓRIO DE PROMESSAS (SMART CONTRACTS DE AFETO)
// ============================================================================

window.inicializarCartorio = function() {
    console.log("Abrindo portas do Tabelionato...");
    window.atualizarMoedasCartorioUI();
    window.escutarCartorioGlobal();
};

window.atualizarMoedasCartorioUI = function() {
    const hud = document.getElementById('cartorio-moedas-hud');
    if (hud) hud.innerText = window.pontosDoCasal || 0;
};

window.toggleInstrucoesCartorio = function() {
    const inst = document.getElementById('instrucoes-cartorio');
    if (inst) inst.classList.toggle('escondido');
};

window.lavrarContrato = function() {
    const inputTexto = document.getElementById('input-promessa-texto');
    const inputValor = document.getElementById('input-promessa-valor');
    
    if (!inputTexto || !inputValor) return;
    
    const texto = inputTexto.value.trim();
    const valor = parseInt(inputValor.value);

    if (!texto) {
        if(typeof mostrarToast === 'function') mostrarToast("Escreva sua promessa no papiro!", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if (isNaN(valor) || valor <= 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Você precisa empenhar um valor válido de garantia.", "💰");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const moedasAtuais = window.pontosDoCasal || 0;
    if (moedasAtuais < valor) {
        if(typeof mostrarToast === 'function') mostrarToast("Santuário sem fundos. Joguem para colher mais moedas!", "📉");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    // 1. Deduz o dinheiro instantaneamente como "Fiança"
    if (typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(-valor, "Garantia de Promessa");
        window.atualizarMoedasCartorioUI();
    }

    // 2. Envia o Smart Contract para a Nuvem
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, push } = window.SantuarioApp.modulos;
    
    const refCartorio = ref(db, 'cartorio_promessas');
    
    push(refCartorio, {
        texto: texto,
        valorFianca: valor,
        autor: window.MEU_NOME,
        dataCriacao: Date.now(),
        status: 'pendente'
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Pacto selado! Aguardando o cumprimento no mundo real.", "✍️");
        if(window.Haptics) window.Haptics.sucesso();
        
        inputTexto.value = "";
        inputValor.value = "";
    });
};

window.escutarCartorioGlobal = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refCartorio = ref(db, 'cartorio_promessas');
    
    onValue(refCartorio, (snapshot) => {
        const dados = snapshot.val();
        const lista = document.getElementById('lista-contratos-ativos');
        if (!lista) return;

        lista.innerHTML = "";

        if (!dados) {
            lista.innerHTML = `<p style="text-align: center; color: #888; font-style: italic; font-size: 0.9rem;">Nenhuma promessa pendente. A paz impera.</p>`;
            return;
        }

        // Converte objeto em array para ordenar
        const contratos = Object.keys(dados).map(key => ({ id: key, ...dados[key] }));
        contratos.sort((a, b) => b.dataCriacao - a.dataCriacao); // Mais recentes no topo

        let contratosAtivos = 0;

        contratos.forEach(c => {
            if (c.status !== 'pendente') return; // Ignora os já resolvidos (só para segurança)
            contratosAtivos++;

            const dataFormatada = new Date(c.dataCriacao).toLocaleDateString('pt-BR');
            const euSouAutor = (c.autor === window.MEU_NOME);

            const cartao = document.createElement('div');
            cartao.className = 'cartao-contrato';
            
            let htmlInner = `
                <div class="contrato-selo">§</div>
                <div style="font-size: 0.75rem; color: #aaa; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 1px;">
                    ${euSouAutor ? 'Sua Promessa' : `Promessa de ${window.NOME_PARCEIRO}`} • ${dataFormatada}
                </div>
                <p style="color: #fff; font-size: 1.1rem; font-family: 'Playfair Display', serif; font-style: italic; margin-bottom: 10px;">"${c.texto}"</p>
                <div style="font-size: 0.85rem; color: #FFD700; margin-bottom: 15px;">
                    Garantia Retida: <b>${c.valorFianca}💰</b> <span style="color: #2ecc71;">(Rende ${c.valorFianca * 3}💰 se cumprido)</span>
                </div>
            `;

            if (euSouAutor) {
                // Fica refém do parceiro!
                htmlInner += `<div style="text-align: center; padding: 10px; background: rgba(0,0,0,0.4); border-radius: 5px; color: #aaa; font-size: 0.85rem; border: 1px dashed #555;">⏳ Aguardando Alvará de ${window.NOME_PARCEIRO}</div>`;
            } else {
                // Parceiro tem o poder de julgar a atitude!
                htmlInner += `
                    <div style="display: flex; gap: 10px;">
                        <button class="btn-executar" onclick="window.executarDivida('${c.id}')">❌ Quebrou a Promessa</button>
                        <button class="btn-cumprir" onclick="window.concederAlvara('${c.id}', ${c.valorFianca})">✅ Cumpriu! (Rendê-lo)</button>
                    </div>
                `;
            }

            cartao.innerHTML = htmlInner;
            lista.appendChild(cartao);
        });

        if (contratosAtivos === 0) {
            lista.innerHTML = `<p style="text-align: center; color: #888; font-style: italic; font-size: 0.9rem;">Nenhuma promessa pendente. A paz impera.</p>`;
        }
    });
};

window.concederAlvara = function(idContrato, valorFianca) {
    if (!confirm("Tem certeza que a promessa foi cumprida no mundo real? Os juros de 300% serão depositados.")) return;
    
    // A RECOMPENSA TRIUNFAL
    const lucro = valorFianca * 3;
    if (typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(lucro, "Alvará de Promessa Cumprida!");
        window.atualizarMoedasCartorioUI();
    }

    if (window.Haptics) navigator.vibrate([100, 50, 200, 100, 400]);
    if (typeof confetti === 'function') confetti({colors: ['#2ecc71', '#D4AF37'], particleCount: 200, spread: 120});
    if (typeof mostrarToast === 'function') mostrarToast(`Promessa Cumprida! A honestidade rendeu ${lucro}💰.`, "⚖️");

    // Destrói o contrato no Firebase para limpar a tela
    const { db, ref, remove } = window.SantuarioApp.modulos;
    remove(ref(db, `cartorio_promessas/${idContrato}`));
};

window.executarDivida = function(idContrato) {
    if (!confirm("Atenção: Ao executar a dívida, o dinheiro empenhado será perdido para sempre. Deseja punir a quebra de promessa?")) return;

    if (window.Haptics) navigator.vibrate([300, 100, 300]);
    if (typeof mostrarToast === 'function') mostrarToast("Contrato Executado. O valor da garantia virou cinzas.", "🔥");

    // Destrói o contrato (o dinheiro já foi descontado na criação, então ele apenas some da existência)
    const { db, ref, remove } = window.SantuarioApp.modulos;
    remove(ref(db, `cartorio_promessas/${idContrato}`));
};