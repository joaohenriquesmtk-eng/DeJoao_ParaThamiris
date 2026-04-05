// ============================================================================
// CONTRATOS DA TERRA: THE DECKBUILDER (DIREITO & AGRONOMIA) - PADRÃO OURO
// ============================================================================

(function() {
    const AudioContratos = {
        cartaJoga: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        alertaOponente: new Audio('https://assets.mixkit.co/active_storage/sfx/2954/2954-preview.mp3'),
        lucro: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'),
        assinatura: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3')
    };
    Object.values(AudioContratos).forEach(a => a.volume = 0.6);

    const BaralhoJogador = [
        { id: 'c1', tipo: 'agr', icone: '📜', titulo: 'Certificado Orgânico', efeito: '+0.30x', valor: 0.30, imune: false },
        { id: 'c2', tipo: 'dir', icone: '⚖️', titulo: 'Liminar de Isenção', efeito: 'Anula Ataque', valor: 0, imune: true },
        { id: 'c3', tipo: 'agr', icone: '💧', titulo: 'Laudo Hidrológico', efeito: '+0.15x', valor: 0.15, imune: false },
        { id: 'c4', tipo: 'dir', icone: '🤝', titulo: 'Acordo Bilateral', efeito: '+0.40x', valor: 0.40, imune: false },
        { id: 'c5', tipo: 'agr', icone: '🧬', titulo: 'Semente Transgênica', efeito: '+0.25x', valor: 0.25, imune: false },
        { id: 'c6', tipo: 'dir', icone: '🛡️', titulo: 'Habeas Corpus', efeito: 'Anula Ataque', valor: 0, imune: true },
        { id: 'c7', tipo: 'agr', icone: '🚜', titulo: 'Frota Própria', efeito: '+0.50x', valor: 0.50, imune: false }
    ];

    const BaralhoOponente = [
        { icone: '🚧', titulo: 'Barreira Sanitária', efeito: '-0.20x', valor: -0.20 },
        { icone: '📉', titulo: 'Queda na Bolsa', efeito: '-0.30x', valor: -0.30 },
        { icone: '🕵️', titulo: 'Auditoria Externa', efeito: '-0.40x', valor: -0.40 },
        { icone: '🐛', titulo: 'Alerta de Praga', efeito: '-0.25x', valor: -0.25 },
        { icone: '⛈️', titulo: 'Crise Climática', efeito: '-0.35x', valor: -0.35 }
    ];

    let negociacao = {
        ativa: false, turno: 1, maxTurnos: 3, idProduto: null,
        quantidade: 0, precoBase: 0, multiplicador: 1.0, ataqueAtual: null, imunidadeAtiva: false
    };

    window.iniciarContratos = function() {
        if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI(); // 🚨 PUXA O SALDO
        
        document.getElementById('contratos-tela-selecao').classList.remove('escondido');
        document.getElementById('contratos-tela-mesa').classList.add('escondido');
        document.getElementById('contratos-tela-resultado').classList.add('escondido');
        carregarDespensaParaExportacao();
    };

    function carregarDespensaParaExportacao() {
        const lista = document.getElementById('contratos-lista-silo');
        lista.innerHTML = '';
        
        // 🚨 Puxa os dados direto da nossa nova Mochila Global
        let inventario = window.inventarioCasal;
        
        // Verifica se a mochila tem qualquer coisa
        let temItem = Object.values(inventario).some(qtd => qtd > 0);

        if (!inventario || !temItem) {
            lista.innerHTML = '<p style="color:#aaa; text-align:center; grid-column: 1/-1; padding: 20px;">A Despensa está vazia.<br>Cultive Morangos ou Rosas na Mini Fazenda primeiro!</p>';
            return;
        }

        // Mapeia os itens da mochila para o formato de exportação com os preços base
        const produtosValidos = [
            { id: 'morangos', nome: 'Lote de Morangos', icone: '🍓', estoque: inventario.morangos || 0, preco: 350 },
            { id: 'cenouras', nome: 'Cenouras Orgânicas', icone: '🥕', estoque: inventario.cenouras || 0, preco: 200 },
            { id: 'trigos', nome: 'Sacas de Trigo', icone: '🌾', estoque: inventario.trigos || 0, preco: 180 },
            { id: 'girassois', nome: 'Óleo de Girassol', icone: '🌻', estoque: inventario.girassois || 0, preco: 500 },
            { id: 'rosas', nome: 'Buquês de Rosas', icone: '🌹', estoque: inventario.rosas || 0, preco: 1200 },
            { id: 'orquideas', nome: 'Orquídeas Raras', icone: '🌸', estoque: inventario.orquideas || 0, preco: 2500 }
        ];

        produtosValidos.forEach(p => {
            // Só exibe o que o casal realmente tem na mochila
            if (p.estoque > 0) {
                // A trava de mínimo agora é 5 (antes era 10), já que os novos itens são mais raros
                const bloqueado = p.estoque < 5;
                const card = document.createElement('div');
                card.className = `card-exportacao-pro ${bloqueado ? 'bloqueado' : ''}`;
                card.innerHTML = `
                    <div class="icone-safra">${p.icone}</div>
                    <h3>${p.nome}</h3>
                    <p>Estoque: <b style="color: #fff;">${p.estoque} caixas</b></p>
                    <p style="color: #2ecc71; font-weight: bold; margin-top: 5px;">R$ ${p.preco} base/cx</p>
                    ${bloqueado ? '<p style="color: #e74c3c; font-size: 0.7rem; margin-top: 8px;">Mínimo para Exportação: 5 caixas</p>' : ''}
                `;
                if (!bloqueado) card.onclick = () => iniciarMesaDeNegociacao(p.id, p.nome, p.estoque, p.preco);
                lista.appendChild(card);
            }
        });
    }

    function iniciarMesaDeNegociacao(idProduto, nome, quantidade, precoUnitario) {
        document.getElementById('contratos-tela-selecao').classList.add('escondido');
        document.getElementById('contratos-tela-mesa').classList.remove('escondido');
        
        // Exporta sempre em lotes máximos de 10 por vez para não esvaziar a mochila de uma vez só
        let quantidadeExportada = quantidade > 10 ? 10 : quantidade;

        negociacao = {
            ativa: true, turno: 1, maxTurnos: 3, idProduto: idProduto,
            quantidade: quantidadeExportada, precoBase: quantidadeExportada * precoUnitario, multiplicador: 1.0,
            ataqueAtual: null, imunidadeAtiva: false
        };

        document.getElementById('contrato-safra-nome').innerText = nome;
        document.getElementById('contrato-safra-qtd').innerText = quantidadeExportada + " cx";
        document.getElementById('contrato-valor-base').innerText = negociacao.precoBase.toLocaleString('pt-BR');
        
        atualizarUIPlacar();
        gerarMaoDoJogador();
        iniciarTurno();
    }

    function atualizarUIPlacar() {
        document.getElementById('contrato-turno-atual').innerText = negociacao.turno;
        const multEl = document.getElementById('contrato-multiplicador-valor');
        multEl.innerText = `${negociacao.multiplicador.toFixed(2)}x`;
        multEl.style.color = negociacao.multiplicador < 1.0 ? '#e74c3c' : (negociacao.multiplicador > 1.5 ? '#2ecc71' : '#FFD700');
    }

    async function iniciarTurno() {
        negociacao.imunidadeAtiva = false;
        const areaOponente = document.getElementById('carta-oponente-mesa');
        
        areaOponente.className = 'carta-jogada-pro vazia';
        areaOponente.innerHTML = 'O Mercado está analisando...';
        
        await new Promise(r => setTimeout(r, 1200));
        
        negociacao.ataqueAtual = BaralhoOponente[Math.floor(Math.random() * BaralhoOponente.length)];
        AudioContratos.alertaOponente.play();
        if(window.Haptics) navigator.vibrate([50, 50, 50]);

        areaOponente.className = 'carta-jogada-pro';
        areaOponente.innerHTML = `
            <div class="carta-oponente-icone">${negociacao.ataqueAtual.icone}</div>
            <div class="carta-oponente-dados">
                <h3>${negociacao.ataqueAtual.titulo}</h3>
                <div class="penalidade">Penalidade: ${negociacao.ataqueAtual.efeito}</div>
            </div>
        `;
    }

    function gerarMaoDoJogador() {
        const mao = document.getElementById('mao-jogador');
        mao.innerHTML = '';
        
        for(let i=0; i<4; i++) {
            const carta = BaralhoJogador[Math.floor(Math.random() * BaralhoJogador.length)];
            const cardEl = document.createElement('div');
            cardEl.className = `carta-deck-pro ${carta.tipo}`;
            cardEl.innerHTML = `
                <div class="icone">${carta.icone}</div>
                <div class="titulo">${carta.titulo}</div>
                <div class="efeito">${carta.efeito}</div>
            `;
            cardEl.onclick = () => jogarCarta(carta, cardEl);
            mao.appendChild(cardEl);
        }
    }

    async function jogarCarta(carta, elementoDOM) {
        if(!negociacao.ativa || !negociacao.ataqueAtual) return;

        AudioContratos.cartaJoga.play();
        if(window.Haptics) window.Haptics.toqueLeve();

        elementoDOM.style.transform = 'translateY(-50px) scale(0)';
        elementoDOM.style.opacity = '0';
        elementoDOM.style.pointerEvents = 'none';

        if (carta.imune) {
            negociacao.imunidadeAtiva = true;
            if(typeof mostrarToast === 'function') mostrarToast("OBJEÇÃO! O ataque da Receita foi anulado!", "⚖️");
        } else {
            negociacao.multiplicador += negociacao.ataqueAtual.valor;
            negociacao.multiplicador += carta.valor;
            if(typeof mostrarToast === 'function') mostrarToast(`Tática aplicada! Multiplicador alterado.`, "📈");
        }

        if (negociacao.multiplicador < 0.1) negociacao.multiplicador = 0.1;

        atualizarUIPlacar();
        negociacao.ataqueAtual = null;

        await new Promise(r => setTimeout(r, 1000));

        negociacao.turno++;
        if (negociacao.turno > negociacao.maxTurnos) {
            finalizarNegociacao();
        } else {
            atualizarUIPlacar();
            iniciarTurno(); 
        }
    }

    function finalizarNegociacao() {
        negociacao.ativa = false;
        AudioContratos.assinatura.play();

        document.getElementById('contratos-tela-mesa').classList.add('escondido');
        document.getElementById('contratos-tela-resultado').classList.remove('escondido');

        const lucroCalculado = Math.floor(negociacao.precoBase * negociacao.multiplicador);
        const lucroEl = document.getElementById('contrato-lucro-final');
        animarContadorDinheiro(lucroEl, 0, lucroCalculado, 1500);

        // 🚨 REMOVE DA MOCHILA GLOBAL USANDO A FUNÇÃO NEGATIVA
        if(typeof window.adicionarItemInventario === 'function') {
            // Manda um valor negativo para subtrair as caixas que foram exportadas
            window.adicionarItemInventario(negociacao.idProduto, -negociacao.quantidade);
        }

        setTimeout(() => {
            AudioContratos.lucro.play();
            if(window.Haptics) navigator.vibrate([100, 50, 200, 100, 300]);
            
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucroCalculado, `Exportação de ${negociacao.quantidade} cx de ${negociacao.idProduto}`);
            
            if(typeof confetti === 'function') confetti({colors: ['#3498db', '#D4AF37'], spread: 120, particleCount: 150});
        }, 1600);
    }

    function animarContadorDinheiro(elemento, start, end, duracao) {
        let startTime = null;
        const step = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duracao, 1);
            const atual = Math.floor(progress * (end - start) + start);
            elemento.innerText = `R$ ${atual.toLocaleString('pt-BR')}`;
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    }

    window.voltarSelecaoContratos = function() {
        carregarSiloParaExportacao();
        document.getElementById('contratos-tela-resultado').classList.add('escondido');
        document.getElementById('contratos-tela-selecao').classList.remove('escondido');
    };

    window.toggleInstrucoesContratos = function() {
        document.getElementById('instrucoes-contratos').classList.toggle('escondido');
    };

})();