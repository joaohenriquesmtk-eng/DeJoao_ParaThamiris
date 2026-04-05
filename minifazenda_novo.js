// ============================================================================
// SIMULADOR AGRÍCOLA PRO (THE ULTIMATE EDITION - PADRÃO OURO)
// ============================================================================

// 1. O BANCO DE DADOS COMPLETO (Com Estações e Estresse)
const catSementes = [
    { id: 'morangos', nome: 'Morangos Doces', preco: 50, icone: '🍓', ciclo: 20, estacaoIdeal: 'verao' },
    { id: 'cenouras', nome: 'Cenouras Crocantes', preco: 30, icone: '🥕', ciclo: 15, estacaoIdeal: 'outono' },
    { id: 'trigos', nome: 'Trigo Dourado', preco: 25, icone: '🌾', ciclo: 10, estacaoIdeal: 'outono' },
    { id: 'girassois', nome: 'Girassóis', preco: 80, icone: '🌻', ciclo: 30, estacaoIdeal: 'verao' },
    { id: 'rosas', nome: 'Rosas Escarlates', preco: 150, icone: '🌹', ciclo: 60, estacaoIdeal: 'primavera' },
    { id: 'orquideas', nome: 'Orquídea Rara', preco: 300, icone: '🌸', ciclo: 90, estacaoIdeal: 'inverno' }
];

const catInsumos = [
    { id: 'calcario', nome: 'Calcário (Corrige pH)', preco: 20, icone: '🪨', tipo: 'ph' },
    { id: 'adubo', nome: 'Adubo NPK', preco: 40, icone: '🧪', tipo: 'npk' },
    { id: 'agua', nome: 'Irrigação', preco: 5, icone: '💧', tipo: 'agua' },
    { id: 'herbicida', nome: 'Herbicida (Mato)', preco: 60, icone: '☠️', tipo: 'praga', alvo: 'mato' },
    { id: 'fungicida', nome: 'Fungicida (Fungo)', preco: 80, icone: '🍄', tipo: 'praga', alvo: 'fungo' }
];

const catPecuaria = [
    { id: 'vaca', nome: 'Vaca Leiteira', preco: 500, icone: '🐄', tipo: 'animal' },
    { id: 'racao', nome: 'Saco de Ração', preco: 15, icone: '🌾', tipo: 'comida' }
];

const catMaquinas = [
    { id: 'trator', nome: 'Trator Colheitadeira (+50% Rapidez)', preco: 1000, icone: '🚜', tipo: 'maquina' },
    { id: 'aspersor', nome: 'Sistema de Aspersores (Rega Automática)', preco: 2500, icone: '🚿', tipo: 'maquina' }
];

const estacoesAno = [
    { id: 'primavera', nome: 'Primavera 🌸', temp: 'Ameno', bonus: 'cafe' },
    { id: 'verao', nome: 'Verão ☀️', temp: 'Quente', bonus: 'soja' },
    { id: 'outono', nome: 'Outono 🍂', temp: 'Vento', bonus: 'milho' },
    { id: 'inverno', nome: 'Inverno ❄️', temp: 'Frio', bonus: 'nenhum' }
];

// 2. A MEMÓRIA DO JOGO
let fazenda = {
    estoqueLeite: 0, // Apenas o leite fica armazenado localmente
    terrenos: [
        { id: 1, livre: true, planta: null, ph: 7.0, npk: 100, umidade: 100, praga: null, progresso: 0 },
        { id: 2, livre: true, planta: null, ph: 6.5, npk: 80, umidade: 100, praga: null, progresso: 0 },
        { id: 3, livre: false, planta: null, ph: 5.0, npk: 0, umidade: 0, praga: null, progresso: 0 }
    ],
    pecuaria: { vacaComprada: false, vacaFome: 0 },
    maquinas: { tratorComprado: false, aspersorComprado: false },
    burocracia: { licencaExpansao: false, alvaraDefensivos: false },
    tempo: { estacaoIndex: 0, diasPassados: 0, ticks: 0 }
};

let loopSimulador = null;

// ==========================================
// PERSISTÊNCIA DA FAZENDA E MOTOR DO TEMPO
// ==========================================
function salvarFazenda() {
    // 🚨 CARIMBO DO TEMPO: Salva o momento exato em que a fazenda foi fechada
    fazenda.ultimaAtualizacao = Date.now();
    localStorage.setItem('estado_minifazenda_ultimate', JSON.stringify(fazenda));
    
    // ☁️ BACKUP NA NUVEM: Salva no Firebase instantaneamente!
    if (typeof window.salvarProgressoJogo === 'function') {
        window.salvarProgressoJogo('minifazenda', fazenda);
    }
}

function carregarFazenda() {
    const salvo = localStorage.getItem('estado_minifazenda_ultimate');
    if (salvo) {
        try {
            const dadosSalvos = JSON.parse(salvo);
            fazenda = { ...fazenda, ...dadosSalvos };
            fazenda.maquinas = { ...{ tratorComprado: false, aspersorComprado: false }, ...dadosSalvos.maquinas };
            fazenda.tempo = { ...{ estacaoIndex: 0, diasPassados: 0, ticks: 0 }, ...dadosSalvos.tempo };
            // Garante que a chave exista
            if (!fazenda.ultimaAtualizacao) fazenda.ultimaAtualizacao = Date.now();
        } catch (e) {
            console.error("Erro ao ler save da fazenda", e);
        }
    } else {
        fazenda.ultimaAtualizacao = Date.now();
    }
}

// 🚨 A MAGIA DOS GRANDES JOGOS: CÁLCULO DE PROGRESSO OFFLINE (AFK)
function calcularProgressoOffline() {
    if (!fazenda.ultimaAtualizacao) return;

    const agora = Date.now();
    const diferencaMs = agora - fazenda.ultimaAtualizacao;
    const segundosOffline = Math.floor(diferencaMs / 1000);

    // Se ficou menos de 10 segundos fora, ignora para não causar saltos bruscos
    if (segundosOffline < 10) return; 

    // Limita a simulação a 24 horas reais (86400 segundos) para não quebrar a matemática e incentivar o retorno diário
    const tempoSimulado = Math.min(segundosOffline, 86400); 

    // 1. AVANÇA O RELÓGIO E AS ESTAÇÕES
    fazenda.tempo.ticks += tempoSimulado;
    let diasAdicionais = Math.floor(fazenda.tempo.ticks / 60);
    fazenda.tempo.ticks = fazenda.tempo.ticks % 60;

    if (diasAdicionais > 0) {
        fazenda.tempo.diasPassados += diasAdicionais;
        let estacoesPassadas = Math.floor(fazenda.tempo.diasPassados / 7);
        fazenda.tempo.diasPassados = fazenda.tempo.diasPassados % 7;
        fazenda.tempo.estacaoIndex = (fazenda.tempo.estacaoIndex + estacoesPassadas) % 4;
    }

    const estacaoAtual = estacoesAno[fazenda.tempo.estacaoIndex];

    // 2. SIMULA A VACA OFFLINE
    if (fazenda.pecuaria.vacaComprada) {
        // Se ela tinha pouca fome quando você saiu, ela gerou leite enquanto a fome subia
        if (fazenda.pecuaria.vacaFome < 50) {
            let leiteGerado = Math.floor(Math.random() * 3) + 1;
            fazenda.silo.leite += leiteGerado;
        }
        // Aplica a fome massiva do tempo offline
        fazenda.pecuaria.vacaFome = Math.min(100, fazenda.pecuaria.vacaFome + (tempoSimulado * 0.05));
    }

    // 3. SIMULA A PLANTAÇÃO OFFLINE
    let colheitasProntas = 0;
    
    fazenda.terrenos.forEach(t => {
        if (t.livre && t.planta && t.progresso < 100) {
            
            // Aspersores protegem a água infinitamente. Se não tiver, o solo seca.
            if (fazenda.maquinas.aspersorComprado) {
                t.umidade = 100;
            } else {
                t.umidade = Math.max(0, t.umidade - (tempoSimulado * 0.05));
            }

            // Os nutrientes desgastam
            t.npk = Math.max(0, t.npk - (tempoSimulado * 0.01));
            t.ph = Math.max(4.0, t.ph - (tempoSimulado * 0.001));

            // Acúmulo de estresse por abandono (A menos que tenha aspersor e NPK alto na saída)
            if (t.umidade === 0 || t.npk < 20) {
                t.planta.estresse += Math.floor(tempoSimulado * 0.1);
            }

            // Motor Matemático de Crescimento Acelerado (Fast-Forward)
            let taxa = 1;
            if (t.ph < 5.5) taxa *= 0.5;
            if (fazenda.maquinas.tratorComprado) taxa *= 1.5;
            if (t.planta.estacaoIdeal === estacaoAtual.id) taxa *= 2.0;

            // Cresce proporcionalmente ao tempo fora (assumindo que bebeu a água residual)
            let crescimentoAbsoluto = (100 / t.planta.ciclo) * taxa * tempoSimulado;
            
            // Penalidade de secura extrema: só cresce 30% da capacidade se a água zerou no meio do caminho
            if (!fazenda.maquinas.aspersorComprado && t.umidade === 0) {
                crescimentoAbsoluto *= 0.3; 
            }

            t.progresso += crescimentoAbsoluto;

            if (t.progresso >= 100) {
                t.progresso = 100;
                colheitasProntas++;
            }
        }
    });

    // 4. O FEEDBACK AO JOGADOR (Mostra o que aconteceu na ausência dele)
    setTimeout(() => {
        let tempoTxt = tempoSimulado < 3600 
                       ? `${Math.floor(tempoSimulado / 60)} min` 
                       : `${Math.floor(tempoSimulado / 3600)} horas`;

        if (colheitasProntas > 0) {
            if(typeof mostrarToast === 'function') mostrarToast(`Sua fazenda progrediu por ${tempoTxt}! Há plantas prontas!`, "🌟");
        } else {
            if(typeof mostrarToast === 'function') mostrarToast(`Você ficou offline por ${tempoTxt}. O tempo na fazenda passou!`, "⏳");
        }
    }, 1500);

    // Salva o novo estado atualizado
    salvarFazenda();
}

// 3. INICIALIZAÇÃO APRIMORADA (AGORA COM NUVEM E PROGRESSO OFFLINE)
window.iniciarMiniFazenda = function() {
    if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI(); // 🚨 PUXA O SALDO NA HORA
    
    // ☁️ TENTA BUSCAR DA NUVEM PRIMEIRO (O SAVE DEFINITIVO)
    if (typeof window.carregarProgressoJogo === 'function') {
        window.carregarProgressoJogo('minifazenda', (progressoNuvem) => {
            if (progressoNuvem) {
                // Sucesso! Baixou da nuvem. Restaura as variáveis.
                fazenda = { ...fazenda, ...progressoNuvem };
                if (!fazenda.maquinas) fazenda.maquinas = { tratorComprado: false, aspersorComprado: false };
                if (!fazenda.tempo) fazenda.tempo = { estacaoIndex: 0, diasPassados: 0, ticks: 0 };
                if (!fazenda.ultimaAtualizacao) fazenda.ultimaAtualizacao = Date.now();
                
                continuarInicializacaoFazenda(); // Segue o jogo
            } else {
                // Se a nuvem estiver vazia, tenta o save local como plano B
                carregarFazenda(); 
                continuarInicializacaoFazenda();
            }
        });
    } else {
        // Fallback caso ocorra algum erro no script
        carregarFazenda();
        continuarInicializacaoFazenda();
    }
};

// 🚨 Função auxiliar que desenha a tela SOMENTE APÓS o carregamento da nuvem concluir
function continuarInicializacaoFazenda() {
    // 🌍 LIGA O SATÉLITE ASSIM QUE A FAZENDA ABRIR
    if(typeof buscarClimaRealFazenda === 'function') buscarClimaRealFazenda();
    
    // 🚨 INVOCAÇÃO DA MÁQUINA DO TEMPO AQUI (Calcula o AFK)
    calcularProgressoOffline();
    
    document.getElementById('fazenda-capital').innerText = window.pontosDoCasal;
    
    sincronizarTribunal();
    injetarPainelEstacoes(); 
    
    atualizarVisuaisAnimatronics();
    renderizarTerrenos();
    renderizarLoja('sementes');
    
    // 🚨 ATUALIZA O BOTÃO DE LEITE ASSIM QUE ENTRA NA FAZENDA
    const btnVender = document.querySelector('.painel-economia-agricola button');
    if (btnVender) {
        if (fazenda.estoqueLeite > 0) {
            btnVender.innerText = `Vender ${fazenda.estoqueLeite}L de Leite (+R$ ${fazenda.estoqueLeite * 150})`;
        } else {
            btnVender.innerText = `Sem Estoque de Leite`;
        }
    }
    
    if (loopSimulador) clearInterval(loopSimulador);
    loopSimulador = setInterval(motorAgronomico, 1000); 
}

function injetarPainelEstacoes() {
    let painel = document.getElementById('painel-estacoes-pro');
    if (!painel) {
        const header = document.querySelector('.fazenda-recursos');
        if (header) {
            painel = document.createElement('div');
            painel.id = 'painel-estacoes-pro';
            painel.style = 'background: rgba(0,0,0,0.6); padding: 5px 10px; border-radius: 8px; font-size: 0.8rem; margin-top: 5px; text-align: center; border: 1px solid #D4AF37; box-shadow: inset 0 0 10px rgba(0,0,0,0.5); display: flex; justify-content: space-around;';
            header.parentNode.insertBefore(painel, header.nextSibling);
        }
    }
    atualizarUIEstacao();
}

function atualizarUIEstacao() {
    const painel = document.getElementById('painel-estacoes-pro');
    if (painel) {
        const estacaoAtual = estacoesAno[fazenda.tempo.estacaoIndex];
        painel.innerHTML = `
            <div>📅 Dia ${fazenda.tempo.diasPassados + 1}</div>
            <div style="color: #FFD700; font-weight: bold;">${estacaoAtual.nome}</div>
            <div style="color: #2ecc71;">📈 Bolsa: ${fazenda.mercado.tendencia.toUpperCase()}</div>
        `;
    }
}

// ==========================================
// TRIBUNAL X FAZENDA
// ==========================================
function sincronizarTribunal() {
    let statsTribunal = JSON.parse(localStorage.getItem('estatisticasCasalTribunal')) || { ganhos: 0, perdidos: 0 };
    let vitorias = statsTribunal.ganhos;

    const elVitorias = document.getElementById('fazenda-vitorias-tribunal');
    if (elVitorias) elVitorias.innerText = vitorias;

    fazenda.burocracia.licencaExpansao = (vitorias >= 5);
    fazenda.burocracia.alvaraDefensivos = (vitorias >= 10);

    if (fazenda.burocracia.licencaExpansao) {
        fazenda.terrenos[2].livre = true;
        const statusExpansao = document.getElementById('status-licenca-expansao');
        if (statusExpansao) statusExpansao.innerHTML = '<span style="color: #2ecc71;">Deferida / Aprovada ✅</span>';
    }

    if (fazenda.burocracia.alvaraDefensivos) {
        const statusDefensivos = document.getElementById('status-alvara-defensivos');
        if (statusDefensivos) statusDefensivos.innerHTML = '<span style="color: #2ecc71;">Alvará Concedido ✅</span>';
    }
}

let ciclosDeSalvamento = 0;

// 4. O MOTOR AGRONÔMICO (Simulação Dinâmica Nível Deus)
function motorAgronomico() {
    fazenda.tempo.ticks++;
    
    // SISTEMA DE TEMPO E ESTAÇÕES (1 dia = 60 segundos)
    if (fazenda.tempo.ticks >= 60) {
        fazenda.tempo.ticks = 0;
        fazenda.tempo.diasPassados++;
        
        if (fazenda.tempo.diasPassados >= 7) {
            fazenda.tempo.diasPassados = 0;
            fazenda.tempo.estacaoIndex = (fazenda.tempo.estacaoIndex + 1) % 4;
            if(typeof mostrarToast === 'function') mostrarToast(`A estação mudou para ${estacoesAno[fazenda.tempo.estacaoIndex].nome}!`, "🌍");
        }
        atualizarUIEstacao();
    }

    const estacaoAtual = estacoesAno[fazenda.tempo.estacaoIndex];
    
    // 🌍 CONEXÃO COM O MUNDO REAL: A Fazenda reage ao clima da sua cidade!
    let estaChovendo = window.climaRealAtual ? window.climaRealAtual.isChovendo : false;
    let diaQuente = window.climaRealAtual ? window.climaRealAtual.isQuente : false;
    
    const horaAtual = new Date().getHours();
    const deNoite = horaAtual >= 18 || horaAtual < 6;

    const overlayClima = document.getElementById('clima-overlay');
    const overlayVagalumes = document.getElementById('vagalumes-overlay');

    if (overlayClima) {
        let novaClasse = 'camada-clima';
        if (estacaoAtual.id === 'inverno') novaClasse += ' clima-inverno';
        else if (estaChovendo) novaClasse += ' clima-chuva';
        else if (deNoite) novaClasse += ' clima-noite';
        
        if (overlayClima.className !== novaClasse) overlayClima.className = novaClasse;
    }

    if (overlayVagalumes) {
        const mostrarVagalumes = deNoite && !estaChovendo && estacaoAtual.id !== 'inverno';
        if (mostrarVagalumes && overlayVagalumes.classList.contains('escondido')) overlayVagalumes.classList.remove('escondido');
        else if (!mostrarVagalumes && !overlayVagalumes.classList.contains('escondido')) overlayVagalumes.classList.add('escondido');
    }

    // (Localize dentro da função motorAgronomico)
    if (fazenda.pecuaria.vacaComprada) {
        fazenda.pecuaria.vacaFome = Math.min(100, fazenda.pecuaria.vacaFome + (estacaoAtual.id === 'inverno' ? 1.5 : 1));
        if (fazenda.pecuaria.vacaFome < 50 && Math.random() < 0.2) {
            fazenda.estoqueLeite += 1; // Leite guardado localmente
            // Atualiza texto do botão de venda
            const btnVender = document.querySelector('.painel-economia-agricola button');
            if(btnVender) btnVender.innerText = `Vender ${fazenda.estoqueLeite}L de Leite (+R$ ${fazenda.estoqueLeite * 150})`;
        }
        const statusVaca = document.getElementById('status-vaca');
        if (statusVaca) {
            statusVaca.innerText = `Fome: ${Math.floor(fazenda.pecuaria.vacaFome)}%`;
            statusVaca.style.color = fazenda.pecuaria.vacaFome > 80 ? '#e74c3c' : '#fff';
        }
    }

    let houveCrescimento = false;
    let novasPragas = [null, null, null];

    fazenda.terrenos.forEach((t, index) => {
        if (fazenda.maquinas.aspersorComprado) {
            t.umidade = 100;
            houveCrescimento = true;
        } else if (estaChovendo && t.umidade !== 100) {
            t.umidade = 100;
            houveCrescimento = true;
        }

        // 🚨 A CORREÇÃO CIRÚRGICA ESTÁ AQUI: "t.livre" sem a exclamação!
        if (t.livre && t.planta) {
            if (t.planta.estresse === undefined) t.planta.estresse = 0;

            const taxaEvaporacao = (diaQuente || estacaoAtual.id === 'verao') ? 2.5 : (estacaoAtual.id === 'inverno' ? 0.5 : 1.5);
            if (!fazenda.maquinas.aspersorComprado) t.umidade = Math.max(0, t.umidade - taxaEvaporacao);
            
            t.npk = Math.max(0, t.npk - 0.5);
            t.ph = Math.max(4.0, t.ph - 0.015);
            
            if (t.umidade === 0 || t.npk < 20 || t.ph < 5.0 || t.ph > 7.5 || t.praga) {
                t.planta.estresse += 1;
            }

            let chancePraga = estaChovendo ? 0.03 : (estacaoAtual.id === 'verao' ? 0.02 : 0.01); 
            if (!t.praga && Math.random() < chancePraga) {
                t.praga = estaChovendo ? 'fungo' : 'mato';
                if(typeof mostrarToast === 'function') mostrarToast(`Alerta! ${t.praga.toUpperCase()} no canteiro ${index + 1}!`, "⚠️");
            }

            if (t.praga && Math.random() < 0.08) { 
                if (index > 0 && fazenda.terrenos[index - 1].livre && !fazenda.terrenos[index - 1].praga) novasPragas[index - 1] = t.praga;
                if (index < 2 && fazenda.terrenos[index + 1].livre && !fazenda.terrenos[index + 1].praga) novasPragas[index + 1] = t.praga;
            }

            let taxaCrescimento = 1;
            if (t.ph < 5.5) taxaCrescimento *= 0.5;
            if (t.umidade === 0 || t.npk === 0 || t.praga) taxaCrescimento = 0;
            if (fazenda.maquinas.tratorComprado) taxaCrescimento *= 1.5;

            if (t.planta.estacaoIdeal === estacaoAtual.id) taxaCrescimento *= 2.0;
            if (estacaoAtual.id === 'inverno') taxaCrescimento *= 0.2; 

            if (taxaCrescimento > 0 && t.progresso < 100) {
                t.progresso += (100 / t.planta.ciclo) * taxaCrescimento;
                if (t.progresso >= 100) t.progresso = 100;
                houveCrescimento = true;
            }
        }
    });

    novasPragas.forEach((praga, i) => {
        if (praga && fazenda.terrenos[i].livre && !fazenda.terrenos[i].praga) {
            fazenda.terrenos[i].praga = praga;
            if(typeof mostrarToast === 'function') mostrarToast(`A praga se espalhou para o canteiro ${i + 1}!`, "🦠");
            houveCrescimento = true;
        }
    });

    if (houveCrescimento) atualizarVisuaisSemDestruirDOM();

    ciclosDeSalvamento++;
    if (ciclosDeSalvamento >= 5) {
        salvarFazenda();
        ciclosDeSalvamento = 0;
    }
}

// 5. RENDERIZAÇÃO 
function renderizarTerrenos() {
    const grade = document.getElementById('grade-fazenda');
    if (!grade) return;
    grade.innerHTML = ''; 

    fazenda.terrenos.forEach((t, index) => {
        const canteiro = document.createElement('div');
        canteiro.className = 'canteiro-pro';
        
        if (!t.livre) {
            canteiro.innerHTML = `<div style="color: #666; font-size: 0.8rem; margin: auto; padding-top: 20px;">Terreno Bloqueado<br>Vença 5x no Tribunal ⚖️</div>`;
            grade.appendChild(canteiro);
            return;
        }

        let htmlMedidores = `
            <div class="medidores-solo">
                <div class="barra-medidor" title="Água"><div id="agua-terreno-${index}" class="preenchimento-agua" style="width: ${t.umidade}%;"></div></div>
                <div class="barra-medidor" title="NPK"><div id="npk-terreno-${index}" class="preenchimento-npk" style="width: ${t.npk}%;"></div></div>
                <div class="barra-medidor" title="pH (Ideal > 6.0)"><div id="ph-terreno-${index}" class="preenchimento-ph" style="width: ${(t.ph / 7) * 100}%; background: ${t.ph < 5.5 ? '#e74c3c' : '#2ecc71'}"></div></div>
            </div>
            <div id="texto-ph-${index}" style="position: absolute; top: 25px; left: 5px; font-size: 0.7rem; color: #aaa; text-shadow: 1px 1px 2px #000;">pH: ${t.ph.toFixed(1)}</div>
        `;

        let htmlPraga = t.praga ? `<div id="praga-terreno-${index}" class="alerta-praga" style="animation: pulsarPraga 1s infinite alternate;">${t.praga === 'mato' ? '🌿' : '🍄'}</div>` : `<div id="praga-terreno-${index}" class="alerta-praga escondido"></div>`;

        let htmlPlanta = `<div style="color: #aaa; margin-bottom: 10px; font-size: 0.85rem;">Solo Vazio</div>`;
        if (t.planta) {
            if (t.progresso >= 100) {
                let estrela = t.planta.estresse === 0 ? '🌟' : (t.planta.estresse <= 20 ? '🥈' : '');
                htmlPlanta = `<div style="font-size: 3rem; animation: pular 1s infinite; position: relative;">
                                ${t.planta.icone}
                                <span style="position: absolute; top: -10px; right: 0; font-size: 1.5rem;">${estrela}</span>
                              </div>
                              <button class="btn-acao" onclick="colherPlanta(${index})" style="padding: 5px 10px; font-size: 0.8rem; width: 90%; background: #2ecc71; box-shadow: 0 4px 0 #27ae60;">Colher</button>`;
            } else {
                // 🚨 ADICIONADO UM ID AQUI PARA CONTROLAR O TAMANHO DO EMOJI
                htmlPlanta = `<div id="icone-planta-${index}" style="font-size: ${1 + (t.progresso/100)}rem; opacity: 0.8; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.5)); transition: font-size 1s linear;">🌱</div>
                              <div style="width: 80%; height: 6px; background: rgba(0,0,0,0.6); margin-bottom: 10px; border-radius: 3px; border: 1px solid #444;">
                                <div id="progresso-planta-${index}" style="width: ${t.progresso}%; height: 100%; background: linear-gradient(90deg, #f1c40f, #D4AF37); border-radius: 2px;"></div>
                              </div>`;
            }
        }

        canteiro.innerHTML = htmlMedidores + htmlPraga + htmlPlanta;
        grade.appendChild(canteiro);
    });
}

function atualizarVisuaisSemDestruirDOM() {
    fazenda.terrenos.forEach((t, index) => {
        if (!t.livre) return;

        const barraAgua = document.getElementById(`agua-terreno-${index}`);
        const barraNpk = document.getElementById(`npk-terreno-${index}`);
        const barraPh = document.getElementById(`ph-terreno-${index}`);
        const textoPh = document.getElementById(`texto-ph-${index}`);
        const pragaEl = document.getElementById(`praga-terreno-${index}`);
        const barraProgresso = document.getElementById(`progresso-planta-${index}`);
        const iconePlanta = document.getElementById(`icone-planta-${index}`); // 🚨 MÁGICA VISUAL AQUI

        if (barraAgua) barraAgua.style.width = `${t.umidade}%`;
        if (barraNpk) barraNpk.style.width = `${t.npk}%`;
        if (barraPh) {
            barraPh.style.width = `${(t.ph / 7) * 100}%`;
            barraPh.style.background = t.ph < 5.5 || t.ph > 7.5 ? '#e74c3c' : '#2ecc71';
        }
        if (textoPh) textoPh.innerText = `pH: ${t.ph.toFixed(1)}`;
        
        if (pragaEl) {
            if (t.praga) {
                pragaEl.innerText = t.praga === 'mato' ? '🌿' : '🍄';
                pragaEl.classList.remove('escondido');
            } else {
                pragaEl.classList.add('escondido');
            }
        }

        if (t.planta) {
            if (barraProgresso) barraProgresso.style.width = `${t.progresso}%`;
            if (iconePlanta) iconePlanta.style.fontSize = `${1 + (t.progresso/100)}rem`; // Faz a planta inchar sem piscar a tela
            
            if (t.progresso >= 100) {
                renderizarTerrenos(); // Recria o bloco inteiro apenas na hora de injetar o botão de Colher
            }
        }
    });
}

// 🚨 O SISTEMA DE QUALIDADE NA COLHEITA (Envia para o Inventário Global)
window.colherPlanta = function(index) {
    const t = fazenda.terrenos[index];
    if (t.planta && t.progresso >= 100) {
        
        let multiplicadorYield = 1;
        let qualidadeText = "Comum";
        let iconeQualidade = "🌾";
        
        // Se o estresse da planta foi zero absoluto, é uma Safra de Ouro.
        if (t.planta.estresse === 0) {
            multiplicadorYield = 3;
            qualidadeText = "OURO";
            iconeQualidade = "🌟";
        } else if (t.planta.estresse <= 20) {
            multiplicadorYield = 2;
            qualidadeText = "Prata";
            iconeQualidade = "🥈";
        }

        // 🚨 MÁGICA: Envia a colheita direto para a Mochila Global do Casal
        if (typeof window.adicionarItemInventario === 'function') {
            window.adicionarItemInventario(t.planta.id, multiplicadorYield);
        }
        
        if(typeof mostrarToast === 'function') {
            mostrarToast(`Colheita ${qualidadeText}! +${multiplicadorYield} ${t.planta.nome} para a Despensa!`, iconeQualidade);
        }
        if(window.Haptics) window.Haptics.sucesso();
        
        t.planta = null;
        t.progresso = 0;
        
        renderizarTerrenos();
        
        // Pulsa o ícone da mochila na tela para indicar que guardou!
        const btnMochila = document.querySelector('.visor-moedas-global-container').previousElementSibling;
        if (btnMochila) {
            btnMochila.style.transform = "scale(1.2)";
            btnMochila.style.borderColor = "#2ecc71";
            setTimeout(() => { btnMochila.style.transform = "scale(1)"; btnMochila.style.borderColor = "rgba(212, 175, 55, 0.5)"; }, 400);
        }
    }
};

// VENDA DIRETA DO LEITE (Sustento Rápido da Fazenda)
window.venderLeiteDireto = function() {
    if (fazenda.estoqueLeite > 0) {
        const lucroLeite = fazenda.estoqueLeite * 150; // Cada garrafa de leite vale 150 moedas
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucroLeite, `Venda de ${fazenda.estoqueLeite}L de Leite`);
        if(typeof mostrarToast === 'function') mostrarToast(`Laticínio vendido! +R$ ${lucroLeite}`, "💰");
        if(window.Haptics) navigator.vibrate([30, 50, 30]);
        
        fazenda.estoqueLeite = 0; // Zera o estoque
        document.getElementById('fazenda-capital').innerText = window.pontosDoCasal;
        
        // Atualiza a UI do botão
        const btnVender = document.querySelector('.painel-economia-agricola button');
        if(btnVender) btnVender.innerText = `Sem Estoque de Leite`;
    } else {
        if(typeof mostrarToast === 'function') mostrarToast(`A Vaca ainda não produziu leite suficiente.`, "⚠️");
        if(window.Haptics) window.Haptics.erro();
    }
};

// 6. LOJA AVANÇADA COM TARGETING SYSTEM MESTRE
window.mudarAbaLoja = function(aba) {
    document.querySelectorAll('.aba-btn').forEach(btn => btn.classList.remove('ativa'));
    event.target.classList.add('ativa');
    renderizarLoja(aba);
};

function renderizarLoja(aba = 'sementes') {
    const conteudo = document.getElementById('conteudo-loja');
    if (!conteudo) return;
    conteudo.innerHTML = '';

    let itens = [];
    if (aba === 'sementes') itens = catSementes;
    if (aba === 'insumos') itens = catInsumos;
    if (aba === 'pecuaria') itens = catPecuaria;
    if (aba === 'maquinas') itens = catMaquinas;
    
    itens.forEach(item => {
        let tagEstacao = item.estacaoIdeal ? `<span style="background:#8e44ad; color:#fff; padding: 2px 5px; border-radius: 3px; font-size: 0.6rem; margin-left: 5px;">Ideal: ${item.estacaoIdeal.toUpperCase()}</span>` : '';
        
        conteudo.innerHTML += `
            <div class="item-loja-pro">
                <div>
                    <span style="font-size: 1.5rem;">${item.icone}</span> 
                    <b>${item.nome}</b> ${tagEstacao}<br>
                    <span style="color: #e74c3c; font-size: 0.8rem; font-weight: bold;">Custo: R$ ${item.preco}</span>
                </div>
                <button onclick="comprarEAplicar('${aba}', '${item.id}', ${item.preco})" style="background: linear-gradient(180deg, #D4AF37, #b8962e); border: 1px solid #000; color: #000; font-weight: bold; border-radius: 5px; padding: 6px 12px; box-shadow: 0 3px 0 #8a7021; cursor: pointer;">Comprar</button>
            </div>
        `;
    });
}

window.comprarEAplicar = function(tipo, idItem, preco) {
    if ((window.pontosDoCasal || 0) < preco) {
        if(typeof mostrarToast === 'function') mostrarToast("Capital insuficiente! Venda produtos na Bolsa.", "💸");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    // TARGETING SYSTEM COM PROTEÇÃO ANTI-OVERWRITE
    if (tipo === 'sementes') {
        let t = fazenda.terrenos.find(terreno => terreno.livre && !terreno.planta);
        if (!t) {
            if(typeof mostrarToast === 'function') mostrarToast("Não há canteiros vazios disponíveis!", "⚠️");
            return;
        }
        
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-preco, `Compra de ${idItem}`);
        t.planta = { ...catSementes.find(s => s.id === idItem), estresse: 0 }; // Nasce com 0 estresse
        if(typeof mostrarToast === 'function') mostrarToast(`Semente de ${t.planta.nome} plantada no Canteiro ${t.id}!`, "🌱");
        
    } else if (tipo === 'insumos') {
        let t = null;
        
        if (idItem === 'calcario') {
            t = fazenda.terrenos.find(terreno => terreno.livre && (terreno.ph < 6.0 || terreno.ph > 7.5)); 
            if (!t) t = fazenda.terrenos.find(terreno => terreno.livre); 
            t.ph = 7.0; 
            if(typeof mostrarToast === 'function') mostrarToast(`pH balanceado perfeitamente no Canteiro ${t.id}!`, "🪨"); 
        }
        else if (idItem === 'adubo') { 
            t = fazenda.terrenos.find(terreno => terreno.livre && terreno.npk < 100); 
            if (!t) t = fazenda.terrenos.find(terreno => terreno.livre);
            t.npk = 100; 
            if(typeof mostrarToast === 'function') mostrarToast(`Canteiro ${t.id} com NPK no máximo!`, "🧪"); 
        }
        else if (idItem === 'agua') { 
            if (fazenda.maquinas.aspersorComprado) {
                if(typeof mostrarToast === 'function') mostrarToast("Seus aspersores já fazem isso de graça!", "🚿");
                return;
            }
            t = fazenda.terrenos.find(terreno => terreno.livre && terreno.umidade < 100);
            if (!t) t = fazenda.terrenos.find(terreno => terreno.livre);
            t.umidade = 100; 
            if(typeof mostrarToast === 'function') mostrarToast(`Canteiro ${t.id} irrigado a 100%!`, "💧"); 
        }
        else if (idItem === 'herbicida' || idItem === 'fungicida') {
            if (!fazenda.burocracia.alvaraDefensivos) {
                if(typeof mostrarToast === 'function') mostrarToast("Alvará Ambiental negado. Ganhe 10x no Tribunal!", "⚖️");
                if(window.Haptics) window.Haptics.erro();
                return; 
            }
            let alvo = catInsumos.find(i => i.id === idItem).alvo;
            t = fazenda.terrenos.find(terreno => terreno.livre && terreno.praga === alvo);
            
            if (t) { 
                t.praga = null; 
                if(typeof mostrarToast === 'function') mostrarToast(`Área isolada e ${alvo} exterminado do Canteiro ${t.id}!`, "☠️"); 
            } else { 
                if(typeof mostrarToast === 'function') mostrarToast(`Análise de solo limpa. Não havia ${alvo}. Capital perdido.`, "📉");
                t = fazenda.terrenos[0]; 
            }
        }
        
        if (!t) {
            if(typeof mostrarToast === 'function') mostrarToast("Nenhum terreno operacional disponível.", "⚠️");
            return;
        }
        
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-preco, `Compra de ${idItem}`);
        
    } else if (tipo === 'pecuaria') {
        if (idItem === 'vaca') {
            if (fazenda.pecuaria.vacaComprada) {
                if(typeof mostrarToast === 'function') mostrarToast("Os estábulos estão cheios (Máx: 1 Vaca).", "⚠️");
                return;
            }
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-preco, `Compra de ${idItem}`);
            fazenda.pecuaria.vacaComprada = true;
            atualizarVisuaisAnimatronics();
            if(typeof mostrarToast === 'function') mostrarToast("Vaca Leiteira Premium instalada no galpão!", "🐄");
        } else if (idItem === 'racao') {
            if (!fazenda.pecuaria.vacaComprada) {
                if(typeof mostrarToast === 'function') mostrarToast("Adquira o animal antes de comprar ração!", "⚠️");
                return;
            }
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-preco, `Compra de ${idItem}`);
            fazenda.pecuaria.vacaFome = 0;
            if(typeof mostrarToast === 'function') mostrarToast("Cocheira abastecida! Vaca 100% alimentada.", "🌾");
            if(window.Haptics) window.Haptics.toqueForte();
        }
        
    } else if (tipo === 'maquinas') {
        if (idItem === 'trator') {
            if (fazenda.maquinas.tratorComprado) {
                if(typeof mostrarToast === 'function') mostrarToast("A garagem já possui uma colheitadeira.", "⚠️");
                return;
            }
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-preco, `Compra de ${idItem}`);
            fazenda.maquinas.tratorComprado = true;
            atualizarVisuaisAnimatronics();
            if(typeof mostrarToast === 'function') mostrarToast("Colheitadeira pesada operacional! (Crescimento +50%)", "🚜");
        } else if (idItem === 'aspersor') {
            if (fazenda.maquinas.aspersorComprado) {
                if(typeof mostrarToast === 'function') mostrarToast("O sistema hidráulico já cobre toda a fazenda.", "⚠️");
                return;
            }
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-preco, `Compra de ${idItem}`);
            fazenda.maquinas.aspersorComprado = true;
            atualizarVisuaisAnimatronics();
            if(typeof mostrarToast === 'function') mostrarToast("Aspersores industriais ativados! Irrigação manual extinta.", "🚿");
        }
    }

    document.getElementById('fazenda-capital').innerText = window.pontosDoCasal;
    if(window.Haptics) window.Haptics.sucesso();
    renderizarTerrenos();
};

function atualizarVisuaisAnimatronics() {
    const divVaca = document.getElementById('animal-vaca');
    const divTrator = document.getElementById('maquina-trator');
    
    // Suporte para ícones novos via injeção se não existirem no HTML base
    let fazendaCenario = document.querySelector('.fazenda-cenario');
    
    if (fazenda.maquinas.aspersorComprado && !document.getElementById('maquina-aspersor')) {
        const divAspersor = document.createElement('div');
        divAspersor.id = 'maquina-aspersor';
        divAspersor.className = 'animatronic-item';
        divAspersor.innerHTML = '🚿';
        divAspersor.style = 'position: absolute; bottom: 85px; right: 20px; font-size: 2rem; z-index: 10; cursor: pointer; animation: flutuar 3s infinite ease-in-out; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5));';
        divAspersor.onclick = () => window.interagirAnimatronic('aspersor');
        if(fazendaCenario) fazendaCenario.appendChild(divAspersor);
    }

    if (divVaca) {
        if (fazenda.pecuaria.vacaComprada) divVaca.classList.remove('escondido');
        else divVaca.classList.add('escondido');
    }
    if (divTrator) {
        if (fazenda.maquinas.tratorComprado) divTrator.classList.remove('escondido');
        else divTrator.classList.add('escondido');
    }
}

window.interagirAnimatronic = function(tipo) {
    if(window.Haptics) window.Haptics.toqueForte();
    if (tipo === 'vaca') mostrarToast("Muuuu! O leite orgânico é o melhor do estado.", "🐄");
    if (tipo === 'trator') mostrarToast("Motor a diesel roncando! Eficiência máxima.", "🚜");
    if (tipo === 'aspersor') mostrarToast("Sssshhh... Água limpa para todo o solo.", "🚿");
};

// MENUS DE DIREITO E BUROCRACIA
window.toggleInstrucoesFazenda = function() {
    document.getElementById('instrucoes-fazenda').classList.toggle('escondido');
    document.getElementById('painel-burocracia').classList.add('escondido');
};
window.abrirPainelBurocracia = function() {
    document.getElementById('painel-burocracia').classList.toggle('escondido');
    document.getElementById('instrucoes-fazenda').classList.add('escondido');
};
window.fecharPainelBurocracia = function() {
    document.getElementById('painel-burocracia').classList.add('escondido');
};

// ==========================================
// 🌍 MOTOR DE CLIMA REAL (SATÉLITE OPEN-METEO)
// ==========================================
window.climaRealAtual = { isChovendo: false, isQuente: false, temp: 25, icone: '☀️', cidade: 'Santuário' };

window.buscarClimaRealFazenda = async function() {
    try {
        // Mapeamento Geográfico: João (Colombo-PR) / Thamiris (Goiânia-GO)
        const lat = window.souJoao ? -25.2917 : -16.6869;
        const lon = window.souJoao ? -49.2242 : -49.2643;
        const cidade = window.souJoao ? "Colombo" : "Goiânia";

        // API Gratuita e ultra leve (Zero peso no Samsung)
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        
        const res = await fetch(url);
        const data = await res.json();
        
        const temp = Math.round(data.current_weather.temperature);
        const codigoClima = data.current_weather.weathercode;
        
        // Códigos Oficiais: 51 a 99 indicam chuva, garoa ou tempestade
        let isChovendo = (codigoClima >= 51 && codigoClima <= 99);
        let isQuente = temp >= 28; // 28 graus ou mais = Calor forte
        
        let icone = '🌤️';
        if (isChovendo) icone = '🌧️';
        else if (isQuente) icone = '☀️';
        else if (temp < 18) icone = '❄️';

        // Salva na memória do jogo
        window.climaRealAtual = { isChovendo, isQuente, temp, icone, cidade };

        // Atualiza a Interface no topo da Fazenda
        const visorClima = document.getElementById('fazenda-clima-texto');
        if (visorClima) {
            visorClima.innerHTML = `${icone} ${cidade} <b style="color:#D4AF37;">${temp}°C</b>`;
        }
        
    } catch (erro) {
        console.warn("Satélite meteorológico indisponível no momento.");
    }
};

// Deixa o satélite atualizando sozinho a cada 30 minutos (Sem lag)
setInterval(() => {
    if (typeof buscarClimaRealFazenda === 'function') buscarClimaRealFazenda();
}, 1800000);