// ==========================================
// TRIBUNAL DO AFETO - VERSÃO COMPLETA
// ==========================================

(function() {
    // ========== CONFIGURAÇÕES ==========
    const CONFIG = {
        estrelasIniciais: 2,
        casosPorNivel: 2,          // sobe nível a cada 2 casos resolvidos
        casosParaBonus: 5,           // a cada 5 casos, ganha estrela extra
        maxCartas: 8,
        valoresBase: [1, 2, 3, 4, 5, 6, 7, 8]  // valores possíveis
    };

    // ========== TIPOS DE CARTAS (expandido por nível) ==========
    function getTiposCartas(nivel) {
        // Quanto maior o nível, maiores os valores disponíveis
        const maxValor = Math.min(8 + Math.floor(nivel / 2), 12);
        const tipos = [];
        for (let v = 1; v <= maxValor; v++) {
            tipos.push({
                nome: `Prova ${String.fromCharCode(64 + v)}`,
                icone: ['📄', '📑', '🔍', '⚖️', '📜', '🔨', '📎', '✒️', '🔏', '📌', '🔐', '⚰️'][v-1] || '📄',
                valor: v
            });
        }
        return tipos;
    }

    // ========== FRASES ==========
    const frasesCaso = [
        "O caso da saudade que não cabe no peito.",
        "Evidência nº 1: seu sorriso é a prova do crime.",
        "A defesa alega que você é inocente... de não me amar.",
        "Testemunha ocular: meu coração acelera quando você aparece.",
        "O júri está dividido: uns acham que você é perfeito, outros que é perfeito demais.",
        "Autos do processo: acumulam-se mensagens de bom dia.",
        "Queixa-crime: abandono de lar (meu pensamento vive na sua casa).",
        "Contrato de namoro: cláusula de carinho diário não cumprida?",
        "Prova pericial: a química entre nós é inegável.",
        "A favor do réu: a forma como ele me olha.",
        "Contra o réu: a distância que insiste em nos separar.",
        "Veredito: culpado por me fazer feliz.",
        "Depoimento da testemunha: 'eu vi, eles dois juntos são perfeitos'.",
        "A acusação: roubo de coração sem consentimento.",
        "A defesa: 'foi amor à primeira vista, meritíssimo'.",
        "Sentença: prisão perpétua nos meus braços.",
        "Novo julgamento: você continua sendo o amor da minha vida.",
        "O caso do beijo roubado que ainda não aconteceu.",
        "A prova dos autos: uma foto nossa que não sai da minha cabeça.",
        "O réu confessa: sim, eu penso nela 25 horas por dia."
    ];

    // ========== VARIÁVEIS PRIVADAS ==========
    let mao = [];
    let selecionadas = [];
    let meta = 0;
    let nivel = 1;
    let casosResolvidos = 0;
    let casosPerdidos = 0;
    let estrelas = CONFIG.estrelasIniciais;
    let jogoAtivo = true;
    let numeroCaso = 1;
    let solucaoAtual = []; // índices das cartas que formam a meta (para dica)

    // ========== FUNÇÕES AUXILIARES ==========
    function mostrarToast(mensagem) {
        if (typeof window.mostrarToast === 'function') {
            window.mostrarToast(mensagem);
        } else {
            alert(mensagem);
        }
    }

    // Gera uma combinação aleatória de cartas que soma um valor alvo
    function gerarCombinacao(tipos, tamanho, alvo) {
        // Escolhe aleatoriamente um subconjunto de cartas que soma alvo
        // Usa um algoritmo simples: tenta aleatório até achar
        for (let tentativas = 0; tentativas < 1000; tentativas++) {
            const indices = [];
            const soma = 0;
            // Escolhe um número aleatório de cartas (1 a tamanho)
            const qtd = Math.floor(Math.random() * tamanho) + 1;
            const possiveis = Array.from({ length: tipos.length }, (_, i) => i);
            // Embaralha
            for (let i = possiveis.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [possiveis[i], possiveis[j]] = [possiveis[j], possiveis[i]];
            }
            const escolhidas = possiveis.slice(0, qtd).sort((a,b) => a-b);
            const somaEscolhidas = escolhidas.reduce((acc, idx) => acc + tipos[idx].valor, 0);
            if (somaEscolhidas === alvo) {
                return escolhidas;
            }
        }
        // Se não achar, retorna uma combinação simples (pode ser melhorada)
        return [];
    }

    function gerarMao() {
        const tipos = getTiposCartas(nivel);
        mao = [];
        // Gera 8 cartas aleatórias
        for (let i = 0; i < CONFIG.maxCartas; i++) {
            const indice = Math.floor(Math.random() * tipos.length);
            mao.push({ ...tipos[indice] });
        }
    }

    function gerarMetaComSolucao() {
        // Tenta gerar uma meta que tenha pelo menos uma combinação
        const tipos = getTiposCartas(nivel);
        // Soma total das cartas
        const somaTotal = mao.reduce((acc, c) => acc + c.valor, 0);
        // Escolhe um alvo entre o mínimo (menor carta) e a soma total
        const minCarta = Math.min(...mao.map(c => c.valor));
        // Tenta até achar uma combinação
        for (let tentativas = 0; tentativas < 100; tentativas++) {
            const alvo = Math.floor(Math.random() * (somaTotal - minCarta + 1)) + minCarta;
            const combinacao = gerarCombinacao(mao, CONFIG.maxCartas, alvo);
            if (combinacao.length > 0) {
                solucaoAtual = combinacao;
                return alvo;
            }
        }
        // Fallback: usa a soma total (sempre é possível pegando todas)
        solucaoAtual = mao.map((_, i) => i);
        return somaTotal;
    }

    function atualizarDescricaoCaso() {
        const descricaoEl = document.getElementById('tribunal-descricao-caso');
        if (descricaoEl) {
            const fraseAleatoria = frasesCaso[Math.floor(Math.random() * frasesCaso.length)];
            descricaoEl.innerText = fraseAleatoria;
        }
        const numeroEl = document.getElementById('tribunal-numero-caso');
        if (numeroEl) {
            numeroEl.innerText = numeroCaso;
        }
    }

    function atualizarMaximo() {
        const max = mao.reduce((acc, c) => acc + c.valor, 0);
        document.getElementById('tribunal-max').innerText = max;
    }

    function atualizarEstatisticas() {
        document.getElementById('tribunal-perdidos').innerText = casosPerdidos;
    }

    function atualizarInterface() {
        document.getElementById('tribunal-nivel').innerText = nivel;
        document.getElementById('tribunal-estrelas').innerText = estrelas;
        document.getElementById('tribunal-casos').innerText = casosResolvidos;
        document.getElementById('tribunal-meta').innerText = meta;
        document.getElementById('tribunal-pontos').innerText = selecionadas.reduce((acc, c) => acc + c.valor, 0);
        atualizarMaximo();
        atualizarEstatisticas();
    }

    function renderizarMao() {
        const maoDiv = document.getElementById('tribunal-mao');
        maoDiv.innerHTML = '';
        mao.forEach((carta, index) => {
            const cartaDiv = document.createElement('div');
            cartaDiv.className = 'carta-tribunal';
            cartaDiv.dataset.indice = index;
            cartaDiv.innerHTML = `
                <div class="carta-icone">${carta.icone}</div>
                <div class="carta-nome">${carta.nome}</div>
                <div class="carta-valor">${carta.valor}</div>
                <div class="carta-tipo">prova</div>
            `;
            cartaDiv.onclick = () => selecionarCarta(index);
            maoDiv.appendChild(cartaDiv);
        });
    }

    function selecionarCarta(index) {
        if (!jogoAtivo) return;
        const carta = mao[index];
        const jaSelecionada = selecionadas.findIndex(c => c === carta);
        if (jaSelecionada >= 0) {
            selecionadas.splice(jaSelecionada, 1);
            document.querySelector(`.carta-tribunal[data-indice="${index}"]`).classList.remove('selecionada');
        } else {
            selecionadas.push(carta);
            document.querySelector(`.carta-tribunal[data-indice="${index}"]`).classList.add('selecionada');
        }
        atualizarInterface();
    }

    function darDica() {
        if (!jogoAtivo || solucaoAtual.length === 0) return;
        // Escolhe uma carta aleatória da solução que ainda não esteja selecionada
        const naoSelecionadas = solucaoAtual.filter(idx => {
            return !selecionadas.includes(mao[idx]);
        });
        if (naoSelecionadas.length === 0) {
            mostrarToast("Você já selecionou todas as cartas da solução!");
            return;
        }
        const dicaIdx = naoSelecionadas[Math.floor(Math.random() * naoSelecionadas.length)];
        // Pisca a carta
        const cartaEl = document.querySelector(`.carta-tribunal[data-indice="${dicaIdx}"]`);
        if (cartaEl) {
            cartaEl.style.animation = 'piscarDica 0.5s 3';
            setTimeout(() => {
                cartaEl.style.animation = '';
            }, 1500);
        }
        mostrarToast(`💡 Tente a carta ${mao[dicaIdx].nome} (valor ${mao[dicaIdx].valor})`);
    }

    function verificarJulgamento() {
        if (!jogoAtivo) return;
        const soma = selecionadas.reduce((acc, c) => acc + c.valor, 0);
        if (soma === meta) {
            // Acertou!
            estrelas++;
            casosResolvidos++;
            // Verifica bônus
            if (casosResolvidos % CONFIG.casosParaBonus === 0) {
                estrelas++;
                mostrarToast(`🌟 Bônus! +1 estrela (${casosResolvidos} casos resolvidos)`);
            }
            if (casosResolvidos % CONFIG.casosPorNivel === 0) {
                nivel++;
                mostrarToast(`🎉 Nível ${nivel} alcançado!`);
            }
            mostrarToast('⚖️ Julgamento correto! +1 estrela');
            // Animação de vitória nas cartas selecionadas
            document.querySelectorAll('.carta-tribunal.selecionada').forEach(el => {
                el.style.animation = 'acertou 0.5s';
                setTimeout(() => el.style.animation = '', 500);
            });
            iniciarNovoCaso();
        } else if (soma > meta) {
            // Ultrapassou
            estrelas--;
            casosPerdidos++;
            mostrarToast('❌ Ultrapassou a meta! Perdeu 1 estrela.');
            if (estrelas <= 0) {
                gameOver();
            } else {
                iniciarNovoCaso();
            }
        } else {
            mostrarToast('⚖️ Ainda não atingiu a meta. Continue somando.');
        }
        atualizarInterface();
    }

    function iniciarNovoCaso() {
        selecionadas = [];
        gerarMao();
        meta = gerarMetaComSolucao();
        numeroCaso++;
        atualizarDescricaoCaso();
        renderizarMao();
        atualizarInterface();
        salvarJogo();
    }

    function gameOver() {
        jogoAtivo = false;
        mostrarToast('💔 Fim do jogo! Clique em Reiniciar para tentar novamente.');
        document.getElementById('tribunal-btn-julgar').disabled = true;
        document.getElementById('tribunal-btn-dica').disabled = true;
    }

    function reiniciarJogo() {
        if (confirm('Reiniciar o jogo? Todo progresso será perdido.')) {
            localStorage.removeItem('tribunal_afeto');
            nivel = 1;
            estrelas = CONFIG.estrelasIniciais;
            casosResolvidos = 0;
            casosPerdidos = 0;
            numeroCaso = 1;
            jogoAtivo = true;
            iniciarNovoCaso();
            document.getElementById('tribunal-btn-julgar').disabled = false;
            document.getElementById('tribunal-btn-dica').disabled = false;
        }
    }

    function salvarJogo() {
        const dados = {
            mao: mao,
            selecionadas: selecionadas,
            meta: meta,
            nivel: nivel,
            estrelas: estrelas,
            casosResolvidos: casosResolvidos,
            casosPerdidos: casosPerdidos,
            numeroCaso: numeroCaso,
            jogoAtivo: jogoAtivo,
            solucaoAtual: solucaoAtual
        };
        localStorage.setItem('tribunal_afeto', JSON.stringify(dados));
    }

    function carregarJogo() {
        const salvo = localStorage.getItem('tribunal_afeto');
        if (salvo) {
            try {
                const dados = JSON.parse(salvo);
                mao = dados.mao || [];
                selecionadas = dados.selecionadas || [];
                meta = dados.meta || 0;
                nivel = dados.nivel || 1;
                estrelas = dados.estrelas || CONFIG.estrelasIniciais;
                casosResolvidos = dados.casosResolvidos || 0;
                casosPerdidos = dados.casosPerdidos || 0;
                numeroCaso = dados.numeroCaso || 1;
                jogoAtivo = dados.jogoAtivo !== undefined ? dados.jogoAtivo : true;
                solucaoAtual = dados.solucaoAtual || [];
            } catch (e) {
                console.warn('Erro ao carregar dados, iniciando novo jogo');
                iniciarNovoCaso();
            }
        } else {
            iniciarNovoCaso();
        }
        atualizarDescricaoCaso();
        atualizarInterface();
        renderizarMao();
        // Reaplica a seleção visual
        selecionadas.forEach(carta => {
            const index = mao.findIndex(c => c.nome === carta.nome && c.valor === carta.valor);
            if (index >= 0) {
                document.querySelector(`.carta-tribunal[data-indice="${index}"]`)?.classList.add('selecionada');
            }
        });
        document.getElementById('tribunal-btn-julgar').disabled = !jogoAtivo;
        document.getElementById('tribunal-btn-dica').disabled = !jogoAtivo;
    }

    // ========== EXPOR FUNÇÕES GLOBAIS ==========
    window.toggleInstrucoesTribunal = function() {
        document.getElementById('instrucoes-tribunal').classList.toggle('escondido');
    };

    window.iniciarTribunal = function() {
        console.log('Iniciando Tribunal do Afeto');
        carregarJogo();

        const btnJulgar = document.getElementById('tribunal-btn-julgar');
        if (btnJulgar) {
            const novoBtn = btnJulgar.cloneNode(true);
            btnJulgar.parentNode.replaceChild(novoBtn, btnJulgar);
            novoBtn.addEventListener('click', verificarJulgamento);
        }

        const btnReiniciar = document.getElementById('tribunal-btn-reiniciar');
        if (btnReiniciar) {
            const novoReiniciar = btnReiniciar.cloneNode(true);
            btnReiniciar.parentNode.replaceChild(novoReiniciar, btnReiniciar);
            novoReiniciar.addEventListener('click', reiniciarJogo);
        }

        const btnDica = document.getElementById('tribunal-btn-dica');
        if (btnDica) {
            const novoDica = btnDica.cloneNode(true);
            btnDica.parentNode.replaceChild(novoDica, btnDica);
            novoDica.addEventListener('click', darDica);
        }
    };
})();