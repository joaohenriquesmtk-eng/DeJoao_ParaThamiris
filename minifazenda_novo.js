// ============================================================================
// SIMULADOR AGRÍCOLA PRO (Pecuária, Clima, Máquinas, Manejo)
// ============================================================================

// 1. O BANCO DE DADOS COMPLETO
const catSementes = [
    { id: 'soja', nome: 'Soja Premium', preco: 50, icone: '🌱', ciclo: 30 },
    { id: 'milho', nome: 'Milho Safrinha', preco: 30, icone: '🌽', ciclo: 20 },
    { id: 'cafe', nome: 'Café Arábica', preco: 150, icone: '☕', ciclo: 60 }
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
    { id: 'trator', nome: 'Trator Colheitadeira (+50% Rapidez)', preco: 1000, icone: '🚜', tipo: 'maquina' }
];

// 2. A MEMÓRIA DO JOGO
let fazenda = {
    silo: { soja: 0, milho: 0, cafe: 0, leite: 0 },
    mercado: { soja: 120, milho: 50, cafe: 800, leite: 15 },
    terrenos: [
        { id: 1, livre: true, planta: null, ph: 7.0, npk: 100, umidade: 100, praga: null, progresso: 0 },
        { id: 2, livre: true, planta: null, ph: 6.5, npk: 80, umidade: 100, praga: null, progresso: 0 },
        { id: 3, livre: false, planta: null, ph: 5.0, npk: 0, umidade: 0, praga: null, progresso: 0 }
    ],
    pecuaria: { vacaComprada: false, vacaFome: 0 },
    maquinas: { tratorComprado: false },
    burocracia: { licencaExpansao: false, alvaraDefensivos: false }
};

let loopSimulador = null;

// ==========================================
// PERSISTÊNCIA DA FAZENDA
// ==========================================
function salvarFazenda() {
    localStorage.setItem('estado_minifazenda', JSON.stringify(fazenda));
}

function carregarFazenda() {
    const salvo = localStorage.getItem('estado_minifazenda');
    if (salvo) {
        try {
            fazenda = JSON.parse(salvo);
        } catch (e) {
            console.error("Erro ao ler save da fazenda", e);
        }
    }
}

// 3. INICIALIZAÇÃO APRIMORADA
window.iniciarMiniFazenda = function() {
    console.log("Iniciando Simulador Agrícola Pro...");
    carregarFazenda(); // Puxa a memória salva!
    document.getElementById('fazenda-capital').innerText = window.pontosDoCasal;
    
    // Sincroniza o Direito com a Agronomia logo na entrada
    sincronizarTribunal();
    
    atualizarVisuaisAnimatronics();
    renderizarTerrenos();
    renderizarLoja('sementes');
    renderizarSiloEMercado();
    
    if (loopSimulador) clearInterval(loopSimulador);
    loopSimulador = setInterval(motorAgronomico, 1000); 
};

// ==========================================
// A MÁGICA DA INTEGRAÇÃO: TRIBUNAL X FAZENDA
// ==========================================
function sincronizarTribunal() {
    // Puxa a memória exata que o jogo "Tribunal" salvou no celular
    let statsTribunal = JSON.parse(localStorage.getItem('estatisticasCasalTribunal')) || { ganhos: 0, perdidos: 0 };
    let vitorias = statsTribunal.ganhos;

    // Atualiza o medidor no painel de Burocracia
    const elVitorias = document.getElementById('fazenda-vitorias-tribunal');
    if (elVitorias) elVitorias.innerText = vitorias;

    // As Leis da Natureza: 5 vitórias libera a terra, 10 libera o veneno
    fazenda.burocracia.licencaExpansao = (vitorias >= 5);
    fazenda.burocracia.alvaraDefensivos = (vitorias >= 10);

    // Desbloqueia o Terreno 3 (O terreno que estava livre: false)
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

// 4. O MOTOR AGRONÔMICO (Altamente Otimizado)
function motorAgronomico() {
    const climaElemento = document.getElementById('fazenda-clima-texto');
    let climaAPI = climaElemento ? climaElemento.innerText.toLowerCase() : '';
    
    let estaChovendo = climaAPI.includes('chuva') || climaAPI.includes('tempestade');
    let diaQuente = climaAPI.includes('sol') || climaAPI.includes('calor') || climaAPI.includes('quente');
    
    const horaAtual = new Date().getHours();
    const deNoite = horaAtual >= 18 || horaAtual < 6;

    const overlayClima = document.getElementById('clima-overlay');
    const overlayVagalumes = document.getElementById('vagalumes-overlay');

    if (overlayClima) {
        const novaClasse = estaChovendo ? 'camada-clima clima-chuva' : (deNoite ? 'camada-clima clima-noite' : 'camada-clima');
        if (overlayClima.className !== novaClasse) overlayClima.className = novaClasse;
    }

    if (overlayVagalumes) {
        const mostrarVagalumes = deNoite && !estaChovendo;
        if (mostrarVagalumes && overlayVagalumes.classList.contains('escondido')) overlayVagalumes.classList.remove('escondido');
        else if (!mostrarVagalumes && !overlayVagalumes.classList.contains('escondido')) overlayVagalumes.classList.add('escondido');
    }

    if (Math.random() < 0.1) {
        const velhaSoja = fazenda.mercado.soja;
        fazenda.mercado.soja = Math.floor(Math.random() * (180 - 90)) + 90;
        fazenda.mercado.milho = Math.floor(Math.random() * (90 - 30)) + 30;
        fazenda.mercado.cafe = Math.floor(Math.random() * (1200 - 600)) + 600;
        fazenda.mercado.leite = Math.floor(Math.random() * (25 - 10)) + 10;
        
        animarPreco('preco-soja', fazenda.mercado.soja, velhaSoja);
        animarPreco('preco-milho', fazenda.mercado.milho);
        animarPreco('preco-cafe', fazenda.mercado.cafe);
        animarPreco('preco-leite', fazenda.mercado.leite);
    }

    if (fazenda.pecuaria.vacaComprada) {
        fazenda.pecuaria.vacaFome = Math.min(100, fazenda.pecuaria.vacaFome + 1);
        if (fazenda.pecuaria.vacaFome < 50 && Math.random() < 0.2) {
            fazenda.silo.leite += 1;
            renderizarSiloEMercado();
        }
        const statusVaca = document.getElementById('status-vaca');
        if (statusVaca) {
            statusVaca.innerText = `Fome: ${fazenda.pecuaria.vacaFome}%`;
            statusVaca.style.color = fazenda.pecuaria.vacaFome > 80 ? '#e74c3c' : '#fff';
        }
    }

    let houveCrescimento = false;

    fazenda.terrenos.forEach((t, index) => {
        if (estaChovendo && t.umidade !== 100) {
            t.umidade = 100;
            houveCrescimento = true;
        }

        if (!t.livre && t.planta) {
            const taxaEvaporacao = diaQuente ? 2 : 1;
            t.umidade = Math.max(0, t.umidade - taxaEvaporacao);
            t.npk = Math.max(0, t.npk - 0.5);
            t.ph = Math.max(4.0, t.ph - 0.01);
            
            let chancePraga = estaChovendo ? 0.02 : 0.01; 
            if (!t.praga && Math.random() < chancePraga) {
                t.praga = estaChovendo ? 'fungo' : 'mato';
                if(typeof mostrarToast === 'function') mostrarToast(`Alerta! ${t.praga.toUpperCase()} no canteiro ${index + 1}!`, "⚠️");
            }

            let taxaCrescimento = 1;
            if (t.ph < 5.5) taxaCrescimento *= 0.5;
            if (t.umidade === 0 || t.npk === 0 || t.praga) taxaCrescimento = 0;
            if (fazenda.maquinas.tratorComprado) taxaCrescimento *= 1.5;

            if (taxaCrescimento > 0 && t.progresso < 100) {
                t.progresso += (100 / t.planta.ciclo) * taxaCrescimento;
                if (t.progresso >= 100) t.progresso = 100;
                houveCrescimento = true;
            }
        }
    });

    // Atualiza o DOM apenas se houver uma planta se desenvolvendo ativamente
    if (houveCrescimento) renderizarTerrenos();

    // 🚨 A OTIMIZAÇÃO CRÍTICA: Salva no disco apenas a cada 5 segundos para não causar 'Stuttering'
    ciclosDeSalvamento++;
    if (ciclosDeSalvamento >= 5) {
        salvarFazenda();
        ciclosDeSalvamento = 0;
    }
}

// 5. RENDERIZAÇÃO E INTERAÇÃO
function renderizarTerrenos() {
    const grade = document.getElementById('grade-fazenda');
    if (!grade) return;
    grade.innerHTML = '';

    fazenda.terrenos.forEach((t, index) => {
        const canteiro = document.createElement('div');
        canteiro.className = 'canteiro-pro';
        
        if (!t.livre) {
            canteiro.innerHTML = `<div style="color: #666; font-size: 0.8rem; margin: auto;">Terreno Bloqueado<br>Requer Licença ⚖️</div>`;
            grade.appendChild(canteiro);
            return;
        }

        let htmlMedidores = `
            <div class="medidores-solo">
                <div class="barra-medidor" title="Água"><div class="preenchimento-agua" style="width: ${t.umidade}%;"></div></div>
                <div class="barra-medidor" title="NPK"><div class="preenchimento-npk" style="width: ${t.npk}%;"></div></div>
                <div class="barra-medidor" title="pH (Ideal > 6.0)"><div class="preenchimento-ph" style="width: ${(t.ph / 7) * 100}%; background: ${t.ph < 5.5 ? '#e74c3c' : '#2ecc71'}"></div></div>
            </div>
            <div style="position: absolute; top: 25px; left: 5px; font-size: 0.7rem; color: #aaa;">pH: ${t.ph.toFixed(1)}</div>
        `;

        let htmlPraga = t.praga ? `<div class="alerta-praga">${t.praga === 'mato' ? '🌿' : '🍄'}</div>` : '';

        let htmlPlanta = `<div style="color: #aaa; margin-bottom: 10px;">Solo Vazio</div>`;
        if (t.planta) {
            if (t.progresso >= 100) {
                htmlPlanta = `<div style="font-size: 3rem; animation: pular 1s infinite;">${t.planta.icone}</div>
                              <button class="btn-acao" onclick="colherPlanta(${index})" style="padding: 5px 10px; font-size: 0.8rem; width: 90%; background: #2ecc71;">Colher</button>`;
            } else {
                htmlPlanta = `<div style="font-size: ${1 + (t.progresso/100)}rem; opacity: 0.7;">🌱</div>
                              <div style="width: 80%; height: 5px; background: rgba(0,0,0,0.5); margin-bottom: 10px; border-radius: 3px;">
                                <div style="width: ${t.progresso}%; height: 100%; background: #D4AF37;"></div>
                              </div>`;
            }
        }

        canteiro.innerHTML = htmlMedidores + htmlPraga + htmlPlanta;
        grade.appendChild(canteiro);
    });
}

window.colherPlanta = function(index) {
    const t = fazenda.terrenos[index];
    if (t.planta && t.progresso >= 100) {
        fazenda.silo[t.planta.id] += 1;
        if(typeof mostrarToast === 'function') mostrarToast(`+1 sc de ${t.planta.nome} enviada ao Silo!`, "🏭");
        if(window.Haptics) window.Haptics.sucesso();
        
        t.planta = null;
        t.progresso = 0;
        
        renderizarSiloEMercado();
        renderizarTerrenos();
    }
};

window.venderProduto = function(idProduto) {
    const qtd = fazenda.silo[idProduto];
    if (qtd > 0) {
        const precoAtual = fazenda.mercado[idProduto];
        const lucroTotal = qtd * precoAtual;
        
        fazenda.silo[idProduto] = 0;
        
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucroTotal, `Venda de ${qtd} de ${idProduto}`);
        if(typeof mostrarToast === 'function') mostrarToast(`Venda concluída! +R$ ${lucroTotal}`, "💰");
        if(window.Haptics) navigator.vibrate([30, 50, 30]);
        
        document.getElementById('fazenda-capital').innerText = window.pontosDoCasal;
        renderizarSiloEMercado();
    } else {
        if(typeof mostrarToast === 'function') mostrarToast(`Seu estoque de ${idProduto} está vazio!`, "⚠️");
        if(window.Haptics) window.Haptics.erro();
    }
};

function renderizarSiloEMercado() {
    document.getElementById('estoque-soja').innerText = fazenda.silo.soja;
    document.getElementById('estoque-milho').innerText = fazenda.silo.milho;
    document.getElementById('estoque-cafe').innerText = fazenda.silo.cafe;
    document.getElementById('estoque-leite').innerText = fazenda.silo.leite;
    
    document.getElementById('preco-soja').innerText = `R$ ${fazenda.mercado.soja}`;
    document.getElementById('preco-milho').innerText = `R$ ${fazenda.mercado.milho}`;
    document.getElementById('preco-cafe').innerText = `R$ ${fazenda.mercado.cafe}`;
    document.getElementById('preco-leite').innerText = `R$ ${fazenda.mercado.leite}`;
}

function animarPreco(elementoId, novoPreco, velhoPreco) {
    const el = document.getElementById(elementoId);
    if (!el) return;
    el.innerText = `R$ ${novoPreco}`;
    if (velhoPreco && novoPreco > velhoPreco) el.className = 'preco-alta';
    else if (velhoPreco && novoPreco < velhoPreco) el.className = 'preco-baixa';
    setTimeout(() => { el.className = 'preco-neutro'; }, 2000);
}

// 6. LOJA (Sementes, Insumos, Animais, Máquinas)
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
        conteudo.innerHTML += `
            <div class="item-loja-pro">
                <div>
                    <span style="font-size: 1.5rem;">${item.icone}</span> 
                    <b>${item.nome}</b><br>
                    <span style="color: #e74c3c; font-size: 0.8rem;">Custo: R$ ${item.preco}</span>
                </div>
                <button onclick="comprarEAplicar('${aba}', '${item.id}', ${item.preco})">Comprar</button>
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

    if (tipo === 'sementes') {
        let t = fazenda.terrenos.find(terreno => terreno.livre && !terreno.planta);
        if (!t) return mostrarToast("Não há terrenos vazios!", "⚠️");
        t.planta = { ...catSementes.find(s => s.id === idItem) };
        mostrarToast("Semente plantada! Monitore o solo.", "🌱");
        
    } else if (tipo === 'insumos') {
        let t = fazenda.terrenos.find(terreno => terreno.livre);
        if (!t) return mostrarToast("Nenhum terreno operacional.", "⚠️");
        
        if (idItem === 'calcario') { t.ph = 7.0; mostrarToast("pH corrigido para 7.0!", "🪨"); }
        if (idItem === 'adubo') { t.npk = 100; mostrarToast("Solo fertilizado!", "🧪"); }
        if (idItem === 'agua') { t.umidade = 100; mostrarToast("Terreno irrigado!", "💧"); }
        if (idItem === 'herbicida' || idItem === 'fungicida') {
            if (!fazenda.burocracia.alvaraDefensivos) {
                mostrarToast("PROIBIDO: Alvará Ambiental pendente. Resolva no Tribunal!", "⚖️");
                if(window.Haptics) window.Haptics.erro();
                return; 
            }
            if (t.praga) { t.praga = null; mostrarToast("Praga exterminada!", "☠️"); }
            else { mostrarToast("Desperdício! Não havia praga.", "📉"); }
        }
        
    } else if (tipo === 'pecuaria') {
        if (idItem === 'vaca') {
            if (fazenda.pecuaria.vacaComprada) return mostrarToast("Você já tem uma vaca!", "⚠️");
            fazenda.pecuaria.vacaComprada = true;
            atualizarVisuaisAnimatronics();
            mostrarToast("Vaca Leiteira comprada! Lembre-se de alimentá-la.", "🐄");
        } else if (idItem === 'racao') {
            if (!fazenda.pecuaria.vacaComprada) return mostrarToast("Compre uma vaca primeiro!", "⚠️");
            fazenda.pecuaria.vacaFome = 0;
            mostrarToast("Vaca alimentada com sucesso!", "🌾");
            if(window.Haptics) window.Haptics.toqueForte();
        }
        
    } else if (tipo === 'maquinas') {
        if (idItem === 'trator') {
            if (fazenda.maquinas.tratorComprado) return mostrarToast("Você já possui o trator!", "⚠️");
            fazenda.maquinas.tratorComprado = true;
            atualizarVisuaisAnimatronics();
            mostrarToast("Trator Colheitadeira adquirido! Todas as plantas crescerão 50% mais rápido.", "🚜");
        }
    }

    // Paga a conta
    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-preco, `Compra de ${idItem}`);
    document.getElementById('fazenda-capital').innerText = window.pontosDoCasal;
    if(window.Haptics) window.Haptics.sucesso();
    renderizarTerrenos();
};

function atualizarVisuaisAnimatronics() {
    const divVaca = document.getElementById('animal-vaca');
    const divTrator = document.getElementById('maquina-trator');
    
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
    if (tipo === 'vaca') mostrarToast("Muuuu! Não esqueça da minha ração!", "🐄");
    if (tipo === 'trator') mostrarToast("Vrummm! O motor está trabalhando pela nossa fazenda.", "🚜");
};

// MENUS DE DIREITO
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