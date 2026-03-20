// ============================================================================
// TRIBUNAL DO AFETO - RPG JURÍDICO (PADRÃO OURO)
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

// Ajuste de volume para não ensurdecer o usuário
Object.values(AudioTribunal).forEach(som => som.volume = 0.6);

// 2. O ESTADO DO JOGO
let tribunal = {
    nivel: 1,
    estrelas: 3,
    metaAtual: 0,
    somaAtual: 0,
    cartasSelecionadas: [],
    testemunhaAtiva: null,
    cartasGarantidasParaDica: [],
    casoAtual: null // <-- Nova memória: O jogo agora sabe exatamente qual caso está rodando
};

// ==========================================
// SISTEMA DE CARREIRA E ESTATÍSTICAS
// (Salva no armazenamento local do celular para não perder os dados)
// ==========================================
let estatisticasTribunal = JSON.parse(localStorage.getItem('estatisticasCasalTribunal')) || {
    ganhos: 0,
    perdidos: 0
};

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

// ==========================================
// CORREÇÃO DOS MENUS: INSTRUÇÕES E DOSSIÊ (TOGGLE)
// ==========================================

// 1. Devolvendo a vida ao botão de Instruções (❓)
window.toggleInstrucoesTribunal = function() {
    const instrucoes = document.getElementById('instrucoes-tribunal');
    const dossie = document.getElementById('dossie-tribunal');
    
    // Se as instruções estão escondidas, nós as mostramos
    if (instrucoes.classList.contains('escondido')) {
        instrucoes.classList.remove('escondido');
        dossie.classList.add('escondido'); // Fecha o dossiê automaticamente para não encavalar
        if(window.Haptics) window.Haptics.toqueLeve();
    } else {
        // Se já estão abertas, nós fechamos
        instrucoes.classList.add('escondido');
        if(window.Haptics) window.Haptics.toqueLeve();
    }
};

// 2. Transformando o botão do Dossiê (📊) em Abre/Fecha
window.abrirDossieTribunal = function() {
    const dossie = document.getElementById('dossie-tribunal');
    const instrucoes = document.getElementById('instrucoes-tribunal');

    // A MÁGICA: Se o dossiê já NÃO estiver escondido (ou seja, está aberto), 
    // nós o fechamos e paramos a função aqui com o 'return'.
    if (!dossie.classList.contains('escondido')) {
        window.fecharDossieTribunal();
        return;
    }

    // Se passou do 'if' acima, significa que está fechado. Vamos atualizar os dados e abrir!
    const ganhos = estatisticasTribunal.ganhos;
    const perdidos = estatisticasTribunal.perdidos;
    const total = ganhos + perdidos;
    const taxa = total === 0 ? 0 : Math.round((ganhos / total) * 100);

    document.getElementById('stats-ganhos').innerText = ganhos;
    document.getElementById('stats-perdidos').innerText = perdidos;
    document.getElementById('stats-taxa').innerText = `${taxa}%`;
    document.getElementById('tribunal-patente').innerText = calcularPatente();

    dossie.classList.remove('escondido');
    instrucoes.classList.add('escondido'); // Fecha as instruções automaticamente
    
    if(window.Haptics) window.Haptics.toqueLeve();
};

// A função de fechar acionada pelo botão "Fechar Dossiê" lá embaixo
window.fecharDossieTribunal = function() {
    document.getElementById('dossie-tribunal').classList.add('escondido');
    if(window.Haptics) window.Haptics.toqueLeve();
};

// 3. BANCO DE CASOS (Com o Sistema de Tags Lógicas)
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

// O Novo Banco de Provas (Com Emojis e Lógica)
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

// 4. TESTEMUNHAS EXPANDIDAS
const bancoTestemunhas = [
    { nome: "A Conexão Instável", icone: "📶", regra: "pares", msg: "O Wi-Fi oscilou! Só são válidas cartas PARES." },
    { nome: "A Saudade Imensa", icone: "🥺", regra: "impares", msg: "O coração apertou! Só são válidas cartas ÍMPARES." },
    { nome: "O Relógio Implacável", icone: "⏳", regra: "max3", msg: "Tempo esgotado! Escolha NO MÁXIMO 3 CARTAS." },
    { nome: "A Bateria nos 1%", icone: "🪫", regra: "menor15", msg: "O celular vai desligar! Só use cartas MENORES que 15." }
];

// 5. INICIALIZAÇÃO
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
    
    document.getElementById('tribunal-mao').innerHTML = '';
    document.getElementById('area-testemunha').classList.add('escondido');
    
    const casoSorteado = bancoDeCasos[Math.floor(Math.random() * bancoDeCasos.length)];
    
    // A LINHA NOVA: O jogo salva o caso sorteado na memória
    tribunal.casoAtual = casoSorteado; 
    
    tribunal.metaAtual = casoSorteado.base + Math.floor(Math.random() * (tribunal.nivel * 3)); 
    
    document.getElementById('tribunal-titulo-caso').innerText = casoSorteado.titulo;
    document.getElementById('tribunal-descricao-caso').innerText = casoSorteado.desc;
    document.getElementById('tribunal-nivel').innerText = tribunal.nivel;
    document.getElementById('tribunal-estrelas').innerText = tribunal.estrelas;
    
    if (Math.random() < 0.35) invocarTestemunha(); 
    
    gerarCartasMesa();
    atualizarPlacar();
}

function invocarTestemunha() {
    const test = bancoTestemunhas[Math.floor(Math.random() * bancoTestemunhas.length)];
    tribunal.testemunhaAtiva = test.regra; 
    
    // ==========================================
    // A INTELIGÊNCIA MATEMÁTICA (MOMENTO PROFESSOR)
    // Para garantir que o jogo não seja impossível, ajustamos a MetaAtual baseada na regra!
    // ==========================================
    if (test.regra === 'pares' && tribunal.metaAtual % 2 !== 0) {
        tribunal.metaAtual++; // Força a meta a ser Par
    } else if (test.regra === 'impares' && tribunal.metaAtual % 2 !== 0) {
        tribunal.metaAtual++; // A soma de dois ímpares SEMPRE dá par, então a meta precisa ser par!
    } else if (test.regra === 'menor15' && tribunal.metaAtual > 28) {
        tribunal.metaAtual = 28; // Se as cartas não podem passar de 14, a meta máxima viável em 2 cartas é 28 (14+14).
    }
    
    document.getElementById('icone-testemunha').innerText = test.icone;
    document.getElementById('nome-testemunha').innerText = test.nome;
    document.getElementById('tribunal-regra-testemunha').innerText = test.msg;
    document.getElementById('area-testemunha').classList.remove('escondido');
    
    AudioTribunal.erro.currentTime = 0;
    AudioTribunal.erro.play();
    if(window.Haptics) navigator.vibrate([80, 50, 80]); // Vibração de alerta duplo
}

function iniciarNovoCaso() {
    tribunal.somaAtual = 0;
    tribunal.cartasSelecionadas = [];
    tribunal.testemunhaAtiva = null;
    tribunal.cartasGarantidasParaDica = [];
    
    document.getElementById('tribunal-mao').innerHTML = '';
    document.getElementById('area-testemunha').classList.add('escondido');
    
    const casoSorteado = bancoDeCasos[Math.floor(Math.random() * bancoDeCasos.length)];
    
    // A LINHA NOVA: O jogo salva o caso sorteado na memória
    tribunal.casoAtual = casoSorteado; 
    
    tribunal.metaAtual = casoSorteado.base + Math.floor(Math.random() * (tribunal.nivel * 3)); 
    
    document.getElementById('tribunal-titulo-caso').innerText = casoSorteado.titulo;
    document.getElementById('tribunal-descricao-caso').innerText = casoSorteado.desc;
    document.getElementById('tribunal-nivel').innerText = tribunal.nivel;
    document.getElementById('tribunal-estrelas').innerText = tribunal.estrelas;
    
    if (Math.random() < 0.35) invocarTestemunha(); 
    
    gerarCartasMesa();
    atualizarPlacar();
}

function gerarCartasMesa() {
    const maoEl = document.getElementById('tribunal-mao');
    const quantidadeCartas = 8;
    
    let val1 = Math.floor(tribunal.metaAtual / 2);
    let val2 = tribunal.metaAtual - val1;
    
    if (tribunal.testemunhaAtiva === 'impares') {
        if (val1 % 2 === 0) { val1--; val2++; } 
    } else if (tribunal.testemunhaAtiva === 'pares') {
        if (val1 % 2 !== 0) { val1--; val2++; } 
    }

    let valores = [{ v: val1, garantida: true }, { v: val2, garantida: true }];
    
    while(valores.length < quantidadeCartas) {
        let numAleatorio = Math.floor(Math.random() * (tribunal.metaAtual - 2)) + 1;
        valores.push({ v: numAleatorio, garantida: false });
    }
    
    valores.sort(() => Math.random() - 0.5); 
    
    // ==========================================
    // A INTELIGÊNCIA DE ENCAIXE DE PROVAS (MATCH LÓGICO)
    // ==========================================
    
    // 1. Pega todas as provas que combinam com o assunto do Caso Atual
    let provasRelacionadas = bancoDeProvas.filter(prova => 
        prova.tags.some(tag => tribunal.casoAtual.tags.includes(tag))
    );
    
    // 2. Pega as provas restantes (que não tem a ver) só para completar a mesa se faltar carta
    let provasRestantes = bancoDeProvas.filter(prova => 
        !prova.tags.some(tag => tribunal.casoAtual.tags.includes(tag))
    );
    
    // Embaralha as duas listas
    provasRelacionadas.sort(() => Math.random() - 0.5);
    provasRestantes.sort(() => Math.random() - 0.5);
    
    // Junta tudo. As que fazem sentido ficam no começo da fila!
    let filaDeProvas = [...provasRelacionadas, ...provasRestantes];
    
    valores.forEach((item, index) => {
        const carta = document.createElement('div');
        carta.className = 'carta-tribunal';
        
        // Pega a prova da fila (garante que não estoure o tamanho do array)
        const provaSelecionada = filaDeProvas[index % filaDeProvas.length];
        
        // A mágica acontece aqui: O ícone e o nome vêm casados e contextualizados!
        carta.innerHTML = `
            <div class="carta-icone" style="font-size: 2.2rem; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">${provaSelecionada.icone}</div>
            <div class="carta-valor">${item.v}</div>
            <div class="carta-nome-prova">${provaSelecionada.nome}</div>
        `;
        
        carta.onclick = () => selecionarCarta(carta, item.v);
        maoEl.appendChild(carta);

        if(item.garantida) {
            tribunal.cartasGarantidasParaDica.push({ elemento: carta, valor: item.v });
        }
    });
}

// 6. A DICA DE AMOR SUPREMA
window.usarDicaTribunal = function() {
    // Faremos de conta que temos o banco global. Se não tiver, mockamos para testar.
    const moedasCasal = window.pontosDoCasal || 100; 
    
    if (moedasCasal < 15) {
        mostrarToast("Precisa de 15💰 na Fazenda para subornar o escrivão!", "🔒");
        AudioTribunal.erro.play();
        return;
    }

    // Acha a primeira carta garantida que ainda não foi selecionada
    const cartaParaRevelar = tribunal.cartasGarantidasParaDica.find(c => !c.elemento.classList.contains('selecionada'));

    if (cartaParaRevelar) {
        if (typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-15, "Dica de Amor Tribunal");
        
        // Efeito visual na carta
        cartaParaRevelar.elemento.classList.add('carta-revelada-dica');
        
        // Seleciona ela automaticamente
        selecionarCarta(cartaParaRevelar.elemento, cartaParaRevelar.valor);
        
        AudioTribunal.dica.play();
        mostrarToast("Uma prova irrefutável foi destacada para você!", "💖");
    } else {
        mostrarToast("Você já encontrou todas as provas essenciais. Bata o martelo!", "⚖️");
    }
};

function selecionarCarta(elementoCarta, valor) {
    // ==========================================
    // O JUIZ DE FERRO: Validação das Armadilhas
    // Se a pessoa clicar numa carta que quebra a regra, o jogo barra!
    // ==========================================
    if (!elementoCarta.classList.contains('selecionada')) {
        let bloqueado = false;
        let motivo = "";

        if (tribunal.testemunhaAtiva === 'pares' && valor % 2 !== 0) {
            bloqueado = true; motivo = "OBJEÇÃO! Apenas cartas PARES são permitidas!";
        } else if (tribunal.testemunhaAtiva === 'impares' && valor % 2 === 0) {
            bloqueado = true; motivo = "OBJEÇÃO! Apenas cartas ÍMPARES são permitidas!";
        } else if (tribunal.testemunhaAtiva === 'menor15' && valor >= 15) {
            bloqueado = true; motivo = "OBJEÇÃO! Cartas de valor 15 ou mais foram embargadas!";
        } else if (tribunal.testemunhaAtiva === 'max3' && tribunal.cartasSelecionadas.length >= 3) {
            bloqueado = true; motivo = "OBJEÇÃO! Limite de 3 cartas atingido na mesa!";
        }

        if (bloqueado) {
            mostrarToast(motivo, "🚨");
            AudioTribunal.erro.currentTime = 0;
            AudioTribunal.erro.play();
            
            // O celular vibra forte dando uma "bronca" tátil
            if(window.Haptics) navigator.vibrate([100, 50, 100]); 
            
            // Dispara a animação de tremida vermelha na carta específica!
            elementoCarta.classList.add('tremida-erro');
            setTimeout(() => elementoCarta.classList.remove('tremida-erro'), 400);
            
            return; // ABORTA A SELEÇÃO. A carta não é adicionada à soma!
        }
    }

    // Se passou pela validação acima (ou se está desselecionando), segue o fluxo normal:
    AudioTribunal.carta.currentTime = 0;
    AudioTribunal.carta.play();

    if (elementoCarta.classList.contains('selecionada')) {
        elementoCarta.classList.remove('selecionada');
        tribunal.somaAtual -= valor;
        tribunal.cartasSelecionadas = tribunal.cartasSelecionadas.filter(c => c !== elementoCarta);
    } else {
        elementoCarta.classList.add('selecionada');
        tribunal.somaAtual += valor;
        tribunal.cartasSelecionadas.push(elementoCarta);
    }
    
    if(window.Haptics) window.Haptics.toqueLeve();
    atualizarPlacar();
}

function atualizarPlacar() {
    document.getElementById('tribunal-meta').innerText = tribunal.metaAtual;
    const somaEl = document.getElementById('tribunal-pontos');
    somaEl.innerText = tribunal.somaAtual;
    
    if (tribunal.somaAtual > tribunal.metaAtual) somaEl.style.color = '#e74c3c';
    else somaEl.style.color = '#FFD700';
}

// 7. O MARTELO E O EFEITO 3D DE VIDRO
document.getElementById('tribunal-btn-julgar').addEventListener('click', function() {
    const martelo = document.getElementById('martelo-3d');
    
    martelo.classList.add('batida-martelo');
    AudioTribunal.impacto.currentTime = 0;
    AudioTribunal.impacto.play();
    
    setTimeout(() => {
        martelo.classList.remove('batida-martelo');
        julgarCaso(); 
    }, 400); 
});

function julgarCaso() {
    if (tribunal.somaAtual === tribunal.metaAtual) {
        // VITÓRIA SUPREMA
        AudioTribunal.vidro.play();
        AudioTribunal.vitoria.play();
        
        const flash = document.createElement('div');
        flash.className = 'flash-vidro';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 600);

        if(window.Haptics) navigator.vibrate([100, 50, 100]); 
        mostrarToast("Veredito Aceito! +25💰", "👨‍⚖️");
        
        // REGISTRA A VITÓRIA NO DOSSIÊ!
        estatisticasTribunal.ganhos++;
        salvarEstatisticas();
        
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(25, "Caso ganho no Tribunal");
        if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], spread: 80});
        
        tribunal.nivel++;
        setTimeout(iniciarNovoCaso, 2000);

    } else {
        // ERROU A SOMA (Perde uma estrela)
        AudioTribunal.erro.play();
        if(window.Haptics) navigator.vibrate(200); 
        
        tribunal.estrelas--;
        document.getElementById('tribunal-estrelas').innerText = tribunal.estrelas;
        
        if (tribunal.estrelas <= 0) {
            // REGISTRA A DERROTA TOTAL (Fim de Jogo) NO DOSSIÊ!
            estatisticasTribunal.perdidos++;
            salvarEstatisticas();
            
            mostrarToast("Você perdeu o processo! O Tribunal foi encerrado.", "📜");
            setTimeout(voltarMenuJogos, 2000);
        } else {
            // Errou, mas ainda tem estrelas
            mostrarToast(`Objeção rejeitada! Meta: ${tribunal.metaAtual} | Sua soma: ${tribunal.somaAtual}`, "❌");
            tribunal.cartasSelecionadas.forEach(c => c.classList.remove('selecionada'));
            tribunal.cartasSelecionadas = [];
            tribunal.somaAtual = 0;
            atualizarPlacar();
        }
    }
}

document.getElementById('tribunal-btn-reiniciar').addEventListener('click', function() {
    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-5, "Reiniciou o Tribunal");
    iniciarNovoCaso();
});