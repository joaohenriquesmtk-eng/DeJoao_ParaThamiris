// ============================================================================
// TRIBUNAL DO AFETO - RPG JURÍDICO (O ABISMO COGNITIVO - MATEMÁTICA PERFEITA)
// ============================================================================

// 1. ÁUDIOS DE ALTA QUALIDADE (Engine Sonora)
const AudioTribunal = {
    carta: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
    impacto: new Audio('https://assets.mixkit.co/active_storage/sfx/2771/2771-preview.mp3'),
    vidro: new Audio('https://assets.mixkit.co/active_storage/sfx/2686/2686-preview.mp3'),
    erro: new Audio('https://assets.mixkit.co/active_storage/sfx/2954/2954-preview.mp3'),
    vitoria: new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'),
    dica: new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3')
};

Object.values(AudioTribunal).forEach(som => som.volume = 0.6);

let tribunal = {
    nivel: 1,
    estrelas: 3, 
    metaAtual: 0,
    somaAtual: 0,
    cartasSelecionadas: [],
    testemunhaAtiva: null,
    cartasGarantidasParaDica: [],
    casoAtual: null
};

// ESTATÍSTICAS
let estatisticasTribunal = JSON.parse(localStorage.getItem('estatisticasCasalTribunal')) || { ganhos: 0, perdidos: 0 };

function calcularPatente() {
    const total = estatisticasTribunal.ganhos;
    if (total < 5) return "Estagiários do Amor";
    if (total < 15) return "Advogados da Paixão";
    if (total < 30) return "Promotores do Carinho";
    if (total < 50) return "Desembargadores Românticos";
    return "Juízes Supremos do Afeto";
}

function salvarEstatisticas() {
    localStorage.setItem('estatisticasCasalTribunal', JSON.stringify(estatisticasTribunal));
}

// MENUS
window.toggleInstrucoesTribunal = function() {
    const instrucoes = document.getElementById('instrucoes-tribunal');
    const dossie = document.getElementById('dossie-tribunal');
    if (instrucoes.classList.contains('escondido')) {
        instrucoes.classList.remove('escondido');
        dossie.classList.add('escondido');
    } else {
        instrucoes.classList.add('escondido');
    }
};

window.abrirDossieTribunal = function() {
    const dossie = document.getElementById('dossie-tribunal');
    const instrucoes = document.getElementById('instrucoes-tribunal');
    if (!dossie.classList.contains('escondido')) {
        window.fecharDossieTribunal();
        return;
    }
    const ganhos = estatisticasTribunal.ganhos;
    const perdidos = estatisticasTribunal.perdidos;
    const total = ganhos + perdidos;
    const taxa = total === 0 ? 0 : Math.round((ganhos / total) * 100);
    document.getElementById('stats-ganhos').innerText = ganhos;
    document.getElementById('stats-perdidos').innerText = perdidos;
    document.getElementById('stats-taxa').innerText = `${taxa}%`;
    document.getElementById('tribunal-patente').innerText = calcularPatente();
    dossie.classList.remove('escondido');
    instrucoes.classList.add('escondido');
};

window.fecharDossieTribunal = function() {
    document.getElementById('dossie-tribunal').classList.add('escondido');
};

// BANCO DE DADOS 
const bancoDeCasos = [
    { titulo: "O Roubo do Cobertor", desc: "Durante a madrugada chuvosa, o réu puxou 80% do cobertor. Prove sua inocência!", base: 12, tags: ["sono", "casa"] },
    { titulo: "A Marmita Desaparecida", desc: "A última coxinha foi devorada sem aviso prévio. O júri exige provas exatas!", base: 18, tags: ["comida", "casa"] },
    { titulo: "O Vácuo no WhatsApp", desc: "Foram 3 horas sem responder, mas com visualização ativa. Alcance a meta ou vá preso!", base: 25, tags: ["celular", "ciume"] },
    { titulo: "O Beijo Roubado", desc: "Roubou um beijo de surpresa e desestabilizou o juiz. Apresente as evidências corretas.", base: 30, tags: ["romance"] },
    { titulo: "A Competição de Filmes", desc: "Quem escolhe o filme na Netflix? O tribunal exige uma soma impecável.", base: 35, tags: ["tv", "indecisao"] },
    { titulo: "O 'Estou Pronta' Falso", desc: "Disse que estava pronta, mas faltava a maquiagem inteira. Julgue o caso!", base: 45, tags: ["indecisao", "casa"] },
    { titulo: "O Paradoxo do 'Tanto Faz'", desc: "Disse 'tanto faz', mas negou as 5 opções sugeridas. Provas irrefutáveis exigidas!", base: 20, tags: ["comida", "indecisao"] },
    { titulo: "A Guerra do Clima", desc: "Um quer o ártico de Colombo, o outro o calor de Goiânia. Decida na meta exata!", base: 22, tags: ["casa"] },
    { titulo: "O Furto de Batata Frita", desc: "Alegou que 'não estava com fome', mas devorou metade da porção. Crime inafiançável!", base: 15, tags: ["comida"] },
    { titulo: "O Crime do Áudio Gigante", desc: "Enviou um podcast de 8 minutos no WhatsApp. Justifique essa infração!", base: 38, tags: ["celular"] },
    { titulo: "O Spoiler Acidental", desc: "Deixou escapar o final da série. O juiz está furioso. Meta altíssima para o perdão!", base: 40, tags: ["tv", "fofoca"] },
    { titulo: "O Vício no TikTok", desc: "Eram só '5 minutinhos', mas já são 3 da manhã. Justifique o fuso horário!", base: 28, tags: ["celular", "sono"] },
    { titulo: "A Fofoca Pela Metade", desc: "Soltou um 'menina, você não sabe...', e foi dormir. Tentativa de homicídio por curiosidade!", base: 50, tags: ["fofoca", "celular"] },
    { titulo: "A Soneca Infinita", desc: "Ativou o modo 'só mais 5 minutos' 8 vezes. Defenda-se!", base: 19, tags: ["sono"] },
    { titulo: "O Assalto do Moletom", desc: "O moletom favorito foi transferido de guarda-roupa. Reivindique a posse legal!", base: 24, tags: ["casa", "romance"] },
    { titulo: "A Compra Escondida", desc: "Pacotes suspeitos da Shopee chegando. Prove que era essencial!", base: 33, tags: ["casa", "indecisao"] },
    { titulo: "O Mistério da Louça", desc: "Panela de molho esquecida por dois dias. O júri exige a verdade matemática!", base: 27, tags: ["casa"] },
    { titulo: "O Delito de Dormir no Filme", desc: "Exigiu um filme cult, mas apagou em 10 minutos. Pague a fiança!", base: 21, tags: ["tv", "sono"] },
    { titulo: "O Ciúme Retrô", desc: "Pego curtindo acidentalmente uma foto de 2014. Explique essa viagem no tempo!", base: 42, tags: ["ciume", "celular"] },
    { titulo: "O 'Eu Avisei' Não Dito", desc: "Sabia que ia dar errado, e fez a temida cara de 'eu avisei'. Tortura psicológica!", base: 36, tags: ["casa", "ciume"] },
    { titulo: "A Indecisão do Look", desc: "Guarda-roupa na cama e afirma que 'não tem roupa'. Meta para financiar um vestido.", base: 31, tags: ["indecisao"] },
    { titulo: "A Desculpa da Dieta", desc: "Começou a dieta na segunda, mas na terça pediu pizza. Apresente atestados!", base: 14, tags: ["comida"] },
    { titulo: "A Mensagem com Ponto Final", desc: "Respondeu com um seco 'Ok.'. Níveis letais de passivo-agressividade!", base: 48, tags: ["celular", "ciume"] },
    { titulo: "O Ciúme do Pet", desc: "Deu mais beijos no cachorro hoje. Reparação imediata de danos afetivos!", base: 16, tags: ["ciume", "romance"] },
    { titulo: "A Cantoria no Banho", desc: "Vizinhos entraram com ação após tentar os agudos da Marília Mendonça às 6h.", base: 17, tags: ["casa"] }
];

const bancoDeProvas = [
    { nome: "Print Oculto", icone: "📱", tags: ["celular", "ciume", "fofoca"] },
    { nome: "Áudio de 5 min", icone: "🎙️", tags: ["celular", "fofoca"] },
    { nome: "Meme Engraçado", icone: "🤡", tags: ["celular", "romance", "tv"] },
    { nome: "Olhar Carente", icone: "🥺", tags: ["romance", "comida", "casa", "sono"] },
    { nome: "Declaração", icone: "💌", tags: ["romance", "casa"] },
    { nome: "Foto Fofa", icone: "📸", tags: ["romance", "celular"] },
    { nome: "Testemunha Surpresa", icone: "👁️", tags: ["fofoca", "casa", "ciume"] },
    { nome: "Emoji Errado", icone: "😬", tags: ["celular", "ciume"] },
    { nome: "Recibo do iFood", icone: "🧾", tags: ["comida", "indecisao"] },
    { nome: "Suspiro Dramático", icone: "😮‍💨", tags: ["indecisao", "casa", "ciume"] },
    { nome: "Olhar de Julgamento", icone: "🤨", tags: ["casa", "ciume", "tv"] },
    { nome: "Biquinho Invicto", icone: "😗", tags: ["romance", "indecisao", "casa"] },
    { nome: "Histórico do TikTok", icone: "📱", tags: ["celular", "sono"] },
    { nome: "Fofoca pela Metade", icone: "🤫", tags: ["fofoca", "celular"] },
    { nome: "Moletom Roubado", icone: "🧥", tags: ["casa", "romance", "sono"] },
    { nome: "Piscada Fofa", icone: "😉", tags: ["romance"] },
    { nome: "Panela Suja", icone: "🥘", tags: ["casa", "comida"] },
    { nome: "Pacote da Shopee", icone: "📦", tags: ["casa", "indecisao"] },
    { nome: "Pedaço de Cobertor", icone: "🛌", tags: ["sono", "casa"] },
    { nome: "Fatia de Pizza", icone: "🍕", tags: ["comida"] },
    { nome: "Controle Remoto", icone: "📺", tags: ["tv", "sono"] }
];

const bancoTestemunhas = [
    { nome: "A Conexão Instável", icone: "📶", regra: "pares", msg: "O Wi-Fi oscilou! Só são válidas cartas PARES." },
    { nome: "A Saudade Imensa", icone: "🥺", regra: "impares", msg: "O coração apertou! Só são válidas cartas ÍMPARES." },
    { nome: "O Relógio Implacável", icone: "⏳", regra: "max3", msg: "Tempo esgotado! Escolha NO MÁXIMO 3 CARTAS." },
    { nome: "A Bateria nos 1%", icone: "🪫", regra: "menor15", msg: "O celular vai desligar! Só use cartas MENORES que 15." }
];

// INICIALIZAÇÃO
window.iniciarTribunal = function() {
    tribunal.nivel = 1;
    tribunal.estrelas = 3;
    iniciarNovoCaso();
};

function iniciarNovoCaso() {
    tribunal.somaAtual = 0;
    tribunal.cartasSelecionadas = [];
    tribunal.testemunhaAtiva = null;
    tribunal.cartasGarantidasParaDica = [];
    
    const maoEl = document.getElementById('tribunal-mao');
    if(maoEl) maoEl.innerHTML = '';
    const areaTest = document.getElementById('area-testemunha');
    if(areaTest) areaTest.classList.add('escondido');
    
    const casoSorteado = bancoDeCasos[Math.floor(Math.random() * bancoDeCasos.length)];
    tribunal.casoAtual = casoSorteado; 
    
    // ☠️ HIPER-ESCALONAMENTO 
    let escalonamentoZ = Math.pow(2.4, tribunal.nivel - 1); 
    tribunal.metaAtual = Math.floor(casoSorteado.base * escalonamentoZ) + Math.floor(Math.random() * (25 * Math.pow(tribunal.nivel, 2))); 
    
    document.getElementById('tribunal-titulo-caso').innerText = casoSorteado.titulo;
    document.getElementById('tribunal-descricao-caso').innerText = casoSorteado.desc;
    document.getElementById('tribunal-nivel').innerText = tribunal.nivel;
    document.getElementById('tribunal-estrelas').innerText = tribunal.estrelas;
    
    // ☠️ TESTEMUNHAS INEVITÁVEIS (95% de chance após nível 3)
    let chanceTestemunha = tribunal.nivel >= 3 ? 0.95 : 0.30; 
    if (Math.random() < chanceTestemunha) invocarTestemunha(); 
    
    gerarCartasMesa();
    atualizarPlacar();
}

function invocarTestemunha() {
    const test = bancoTestemunhas[Math.floor(Math.random() * bancoTestemunhas.length)];
    tribunal.testemunhaAtiva = test.regra; 
    
    document.getElementById('icone-testemunha').innerText = test.icone;
    document.getElementById('nome-testemunha').innerText = test.nome;
    document.getElementById('tribunal-regra-testemunha').innerText = test.msg;
    document.getElementById('area-testemunha').classList.remove('escondido');
    
    AudioTribunal.erro.currentTime = 0;
    AudioTribunal.erro.play();
    if(window.Haptics) navigator.vibrate([80, 50, 80]);
}

function gerarCartasMesa() {
    const maoEl = document.getElementById('tribunal-mao');
    const quantidadeCartas = 8;
    
    // 1. Determina a quantidade EXATA de cartas que formarão a solução
    let numPartesAlvo = Math.min(7, 4 + Math.floor(tribunal.nivel / 3));
    if (tribunal.testemunhaAtiva === 'max3') numPartesAlvo = Math.min(numPartesAlvo, 3);
    if (tribunal.testemunhaAtiva === 'menor15') numPartesAlvo = 7; 
    
    // ========================================================================
    // 🚨 A MÁGICA DA GARANTIA: CALIBRANDO A META PARA SER 100% SOLUCIONÁVEL
    // ========================================================================
    if (tribunal.testemunhaAtiva === 'pares') {
        if (tribunal.metaAtual % 2 !== 0) tribunal.metaAtual++;
    } 
    else if (tribunal.testemunhaAtiva === 'impares') {
        // MATEMÁTICA PURA: A soma de N números ímpares carrega a mesma paridade de N.
        // Se precisamos somar 4 cartas, a meta DEVE ser par. Se precisamos de 5, DEVE ser ímpar.
        if (tribunal.metaAtual % 2 !== numPartesAlvo % 2) {
            tribunal.metaAtual++; 
        }
    } 
    else if (tribunal.testemunhaAtiva === 'menor15') {
        // Se todas as cartas precisam ser menores que 15, o teto físico é N * 14.
        let maxS = numPartesAlvo * 14;
        let minS = numPartesAlvo * 1;
        if (tribunal.metaAtual > maxS) tribunal.metaAtual = Math.floor(Math.random() * 20) + 70; // Trava dentro do possível
        if (tribunal.metaAtual < minS) tribunal.metaAtual = minS;
    }
    
    // Segurança final: A meta nunca pode ser menor que o número de cartas
    if (tribunal.metaAtual < numPartesAlvo) tribunal.metaAtual = numPartesAlvo;

    // Atualiza a tela com a Meta Perfeita e inquebrável
    document.getElementById('tribunal-meta').innerText = tribunal.metaAtual;

    // ========================================================================
    // ALGORITMO DE DIVISÃO DETERMINÍSTICA (Constrói do zero, não depende de sorte)
    // ========================================================================
    let valoresGarantidos = new Array(numPartesAlvo).fill(0);
    let step = 1;
    let maxVal = Infinity;

    // Preenche as bases de acordo com a regra
    if (tribunal.testemunhaAtiva === 'pares') {
        valoresGarantidos.fill(2);
        step = 2;
    } else if (tribunal.testemunhaAtiva === 'impares') {
        valoresGarantidos.fill(1);
        step = 2; // Pula de 2 em 2 para continuar ímpar
    } else if (tribunal.testemunhaAtiva === 'menor15') {
        valoresGarantidos.fill(1);
        step = 1;
        maxVal = 14;
    } else {
        valoresGarantidos.fill(1);
        step = 1;
    }

    let currentSum = valoresGarantidos.reduce((a, b) => a + b, 0);
    let remaining = tribunal.metaAtual - currentSum;

    // Distribui o saldo restante em pedaços legais (sem quebrar a regra)
    while (remaining > 0) {
        let idx = Math.floor(Math.random() * numPartesAlvo);
        let add = step;

        // Se os números forem imensos, adiciona em blocos grandes para poupar processamento
        if (maxVal === Infinity) {
            if (remaining > 5000) add = step === 1 ? 1000 : 1000;
            else if (remaining > 500) add = step === 1 ? 100 : 100;
            else if (remaining > 50) add = step === 1 ? 10 : 10;
        }

        if (valoresGarantidos[idx] + add <= maxVal && remaining >= add) {
            valoresGarantidos[idx] += add;
            remaining -= add;
        }
    }

    // NÚMEROS FEIOS (Anti-Rounding) quando o jogo não tem regras ativas
    if (!tribunal.testemunhaAtiva) {
        for (let i = 0; i < numPartesAlvo - 1; i++) {
            let v = valoresGarantidos[i];
            let lastDigit = v % 10;
            if (![3, 7, 9].includes(lastDigit) && v > 10) {
                let feios = [3, 7, 9];
                let novoDigito = feios[Math.floor(Math.random() * feios.length)];
                let diff = novoDigito - lastDigit;
                valoresGarantidos[i] += diff;
                valoresGarantidos[numPartesAlvo - 1] -= diff; // Subtrai da última para manter a conta exata
            }
        }
        // Reparo de segurança (caso o balanço tenha jogado algum número pra zero ou negativo)
        for (let i = 0; i < numPartesAlvo; i++) {
            if (valoresGarantidos[i] <= 0) {
                let repor = 1 - valoresGarantidos[i];
                valoresGarantidos[i] += repor;
                let maxIdx = 0;
                for(let j=1; j<numPartesAlvo; j++) if(valoresGarantidos[j] > valoresGarantidos[maxIdx]) maxIdx = j;
                valoresGarantidos[maxIdx] -= repor;
            }
        }
    }

    let valores = valoresGarantidos.map(v => ({ v: v, garantida: true }));

    // ========================================================================
    // A MIRAGEM (Criando as iscas matemáticas perfeitas)
    // ========================================================================
    let indexAlvoBait = Math.floor(Math.random() * valoresGarantidos.length);
    let cartaVitimada = valoresGarantidos[indexAlvoBait];
    
    while(valores.length < quantidadeCartas) {
        let isca;
        
        if (valores.length === valoresGarantidos.length) {
            // Isca Mestra: Falta exatamente 1 passo para ganhar ou perder
            isca = cartaVitimada + (Math.random() < 0.5 ? step : -step);
        } else {
            // Iscas secundárias
            let ruido = Math.floor(Math.random() * 8) + 1;
            isca = valoresGarantidos[Math.floor(Math.random() * valoresGarantidos.length)] + (Math.random() < 0.5 ? (ruido * step) : -(ruido * step));
        }
        
        // As iscas não podem quebrar as regras (se quebrarem, você adivinha a isca de cara)
        if (isca <= 0) isca = cartaVitimada + (step * 2);
        if (tribunal.testemunhaAtiva === 'menor15' && isca >= 15) isca = 14;
        if (tribunal.testemunhaAtiva === 'pares' && isca % 2 !== 0) isca++;
        if (tribunal.testemunhaAtiva === 'impares' && isca % 2 === 0) isca++;
        
        valores.push({ v: isca, garantida: false });
    }
    
    valores.sort(() => Math.random() - 0.5); 
    
    let provasRelacionadas = bancoDeProvas.filter(prova => prova.tags.some(tag => tribunal.casoAtual.tags.includes(tag)));
    let provasRestantes = bancoDeProvas.filter(prova => !prova.tags.some(tag => tribunal.casoAtual.tags.includes(tag)));
    provasRelacionadas.sort(() => Math.random() - 0.5);
    provasRestantes.sort(() => Math.random() - 0.5);
    
    let filaDeProvas = [...provasRelacionadas, ...provasRestantes];
    
    valores.forEach((item, index) => {
        const carta = document.createElement('div');
        carta.className = 'carta-tribunal';
        const provaSelecionada = filaDeProvas[index % filaDeProvas.length];
        
        let fontSize = item.v.toString().length > 4 ? '1.5rem' : '1.8rem';
        
        carta.innerHTML = `
            <div class="carta-icone" style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">${provaSelecionada.icone}</div>
            <div class="carta-valor" style="font-size: ${fontSize};">${item.v}</div>
            <div class="carta-nome-prova">${provaSelecionada.nome}</div>
        `;
        carta.onclick = () => selecionarCarta(carta, item.v);
        maoEl.appendChild(carta);
        if(item.garantida) tribunal.cartasGarantidasParaDica.push({ elemento: carta, valor: item.v });
    });
}

window.usarDicaTribunal = function() {
    const moedasCasal = window.pontosDoCasal || 0; 
    if (moedasCasal < 15) { mostrarToast("Precisa de 15💰 na Fazenda!", "🔒"); AudioTribunal.erro.play(); return; }
    const cartaParaRevelar = tribunal.cartasGarantidasParaDica.find(c => !c.elemento.classList.contains('selecionada'));
    if (cartaParaRevelar) {
        if (typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-15, "Dica Tribunal");
        cartaParaRevelar.elemento.classList.add('carta-revelada-dica');
        selecionarCarta(cartaParaRevelar.elemento, cartaParaRevelar.valor);
        AudioTribunal.dica.play();
    }
};

function selecionarCarta(elementoCarta, valor) {
    if (!elementoCarta.classList.contains('selecionada')) {
        let bloqueado = false;
        let motivo = "";
        if (tribunal.testemunhaAtiva === 'pares' && valor % 2 !== 0) { bloqueado = true; motivo = "Apenas PARES!"; }
        else if (tribunal.testemunhaAtiva === 'impares' && valor % 2 === 0) { bloqueado = true; motivo = "Apenas ÍMPARES!"; }
        else if (tribunal.testemunhaAtiva === 'menor15' && valor >= 15) { bloqueado = true; motivo = "Cartas MENORES que 15!"; }
        else if (tribunal.testemunhaAtiva === 'max3' && tribunal.cartasSelecionadas.length >= 3) { bloqueado = true; motivo = "Máximo 3 cartas!"; }
        if (bloqueado) { mostrarToast(motivo, "🚨"); AudioTribunal.erro.play(); return; }
    }
    AudioTribunal.carta.currentTime = 0; AudioTribunal.carta.play();
    
    if (elementoCarta.classList.contains('selecionada')) {
        elementoCarta.classList.remove('selecionada');
        tribunal.somaAtual -= valor;
        tribunal.cartasSelecionadas = tribunal.cartasSelecionadas.filter(c => c !== elementoCarta);
    } else {
        elementoCarta.classList.add('selecionada');
        tribunal.somaAtual += valor;
        tribunal.cartasSelecionadas.push(elementoCarta);
    }
    atualizarPlacar();
}

function atualizarPlacar() {
    const metaEl = document.getElementById('tribunal-meta');
    const somaEl = document.getElementById('tribunal-pontos');
    if(metaEl) metaEl.innerText = tribunal.metaAtual;
    if(somaEl) {
        somaEl.innerText = tribunal.somaAtual;
        somaEl.style.color = (tribunal.somaAtual > tribunal.metaAtual) ? '#e74c3c' : '#FFD700';
    }
}

// ANIMAÇÃO DO MARTELO GLOBAL 
window.baterMarteloVisual = function() {
    let container = document.getElementById('martelo-overlay-global');
    if (container && container.style.display === 'flex') return; 

    const acerto = (tribunal.somaAtual === tribunal.metaAtual);

    if (!container) {
        container = document.createElement('div');
        container.id = 'martelo-overlay-global';
        container.innerHTML = `
            <div class="martelo-luz-fundo"></div>
            <div class="martelo-svg-wrapper">
                <svg viewBox="0 0 100 100" width="200" height="200">
                    <defs>
                        <linearGradient id="grad-madeira" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stop-color="#4a2a18" />
                            <stop offset="50%" stop-color="#6b4226" />
                            <stop offset="100%" stop-color="#3e2312" />
                        </linearGradient>
                    </defs>
                    <rect x="44" y="40" width="12" height="55" rx="6" fill="url(#grad-madeira)" />
                    <rect x="20" y="20" width="60" height="26" rx="5" fill="url(#grad-madeira)" />
                    <rect x="28" y="20" width="4" height="26" fill="#D4AF37" />
                    <rect x="68" y="20" width="4" height="26" fill="#D4AF37" />
                    <path d="M 20 22 L 15 25 L 15 41 L 20 44 Z" fill="#3e2312"/>
                    <path d="M 80 22 L 85 25 L 85 41 L 80 44 Z" fill="#3e2312"/>
                </svg>
            </div>
        `;
        document.body.appendChild(container);
    }

    const luz = container.querySelector('.martelo-luz-fundo');
    const martelo = container.querySelector('.martelo-svg-wrapper');
    
    container.style.display = 'flex';
    luz.style.animation = 'none';
    martelo.style.animation = 'none';
    void container.offsetWidth; 

    if (acerto) {
        luz.style.background = 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(212,175,55,0.6) 30%, transparent 70%)';
        luz.style.boxShadow = '0 0 80px rgba(255,255,255,0.8)';
    } else {
        luz.style.background = 'radial-gradient(circle, rgba(255,71,87,0.95) 0%, rgba(200,0,0,0.6) 30%, transparent 70%)';
        luz.style.boxShadow = '0 0 80px rgba(255,71,87,0.8)';
    }

    martelo.style.animation = 'baterMartelo 0.6s cubic-bezier(0.25, 1, 0.5, 1) forwards';
    
    setTimeout(() => {
        luz.style.animation = 'explodirLuzMartelo 0.8s ease-out forwards';
        
        if (AudioTribunal.impacto) AudioTribunal.impacto.play();
        if (window.navigator.vibrate) navigator.vibrate([100, 50, 200]);

        if (!acerto) {
            const crack = document.createElement('div');
            crack.className = 'efeito-tela-quebrada';
            document.body.appendChild(crack);
            setTimeout(() => crack.remove(), 1000);
        }
    }, 150);

    setTimeout(() => {
        container.style.display = 'none';
        julgarCaso(); 
    }, 1000);
};

function julgarCaso() {
    if (tribunal.somaAtual === tribunal.metaAtual) {
        mostrarToast("Veredito Aceito! +25💰", "⚖️");
        estatisticasTribunal.ganhos++; salvarEstatisticas();
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(25, "Caso Ganho");
        tribunal.nivel++;
        document.getElementById('tribunal-nivel').innerText = tribunal.nivel;
        setTimeout(iniciarNovoCaso, 1500);
    } else {
        tribunal.estrelas--;
        document.getElementById('tribunal-estrelas').innerText = tribunal.estrelas;
        if (tribunal.estrelas <= 0) {
            mostrarToast("Justiça falhou! Tribunal encerrado.", "💔");
            estatisticasTribunal.perdidos++; salvarEstatisticas();
            setTimeout(voltarMenuJogos, 2000);
        } else {
            let diferenca = Math.abs(tribunal.metaAtual - tribunal.somaAtual);
            mostrarToast(`Errou por ${diferenca}! Vidas: ${tribunal.estrelas}`, "❌");
            tribunal.somaAtual = 0;
            document.querySelectorAll('.carta-tribunal.selecionada').forEach(c => c.classList.remove('selecionada'));
            tribunal.cartasSelecionadas = [];
            atualizarPlacar();
        }
    }
}

// Função global para reiniciar o caso (Blindada contra o Lazy Load)
window.reiniciarTribunalManual = function() {
    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-5, "Reset Tribunal");
    iniciarNovoCaso();
};