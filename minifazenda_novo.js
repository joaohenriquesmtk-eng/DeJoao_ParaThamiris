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

// ==========================================
// SILO DO SANTUÁRIO — BASE ECONÔMICA
// ==========================================
const SILO_BASE = {
    morangos: 0,
    cenouras: 0,
    trigos: 0,
    girassois: 0,
    rosas: 0,
    orquideas: 0,
    leite: 0,

    // Produtos processados
    farinha: 0,
    pao: 0,
    geleia: 0,
    buque: 0
};

const PRECO_VENDA_SILO = {
    morangos: 90,
    cenouras: 55,
    trigos: 40,
    girassois: 130,
    rosas: 240,
    orquideas: 480,
    leite: 150,

    farinha: 95,
    pao: 260,
    geleia: 330,
    buque: 420
};

// ==========================================
// MELHORIAS DO SILO — PROGRESSÃO ECONÔMICA
// ==========================================
const SILO_NIVEIS = [
    { nivel: 1, capacidade: 50, custoMoedas: 0, recursos: {} },
    { nivel: 2, capacidade: 75, custoMoedas: 800, recursos: { trigos: 6, cenouras: 4 } },
    { nivel: 3, capacidade: 100, custoMoedas: 1800, recursos: { trigos: 10, morangos: 6, leite: 3 } },
    { nivel: 4, capacidade: 140, custoMoedas: 3600, recursos: { girassois: 6, rosas: 4, leite: 6 } },
    { nivel: 5, capacidade: 180, custoMoedas: 6500, recursos: { orquideas: 3, rosas: 8, leite: 10 } }
];

function obterNivelSiloAtual() {
    const nivelBruto = Number(fazenda.siloNivel);
    const nivelSeguro = Number.isFinite(nivelBruto) ? nivelBruto : 1;

    return Math.max(1, Math.min(nivelSeguro, SILO_NIVEIS.length));
}

function obterConfigSiloAtual() {
    const nivelAtual = obterNivelSiloAtual();
    return SILO_NIVEIS[nivelAtual - 1] || SILO_NIVEIS[0];
}

function obterProximoNivelSilo() {
    const nivelAtual = obterNivelSiloAtual();
    return SILO_NIVEIS.find(item => item.nivel === nivelAtual + 1) || null;
}

function sincronizarCapacidadeSiloPorNivel() {
    const nivelAtual = obterNivelSiloAtual();
    const config = SILO_NIVEIS[nivelAtual - 1] || SILO_NIVEIS[0];

    fazenda.siloNivel = nivelAtual;
    fazenda.capacidadeSilo = config.capacidade;
}

function temRecursosParaMelhorarSilo(configProximo) {
    normalizarFazenda();

    const recursos = configProximo.recursos || {};
    return Object.entries(recursos).every(([id, qtdNecessaria]) => {
        return (fazenda.silo[id] || 0) >= qtdNecessaria;
    });
}

function renderizarRequisitosSilo(recursos) {
    const entradas = Object.entries(recursos || {});

    if (entradas.length === 0) {
        return '<span class="silo-upgrade-requisito-ok">Sem recursos exigidos</span>';
    }

    return entradas.map(([id, qtd]) => {
        const info = obterInfoProdutoSilo(id);
        const atual = fazenda.silo[id] || 0;
        const ok = atual >= qtd;

        return `
            <span class="${ok ? 'silo-upgrade-requisito-ok' : 'silo-upgrade-requisito-falta'}">
                ${info.icone} ${atual}/${qtd}
            </span>
        `;
    }).join('');
}

function obterInfoProdutoSilo(id) {
    const produtosEspeciais = {
        leite: { id: 'leite', nome: 'Leite Fresco', icone: '🥛' },
        farinha: { id: 'farinha', nome: 'Farinha Dourada', icone: '🌾' },
        pao: { id: 'pao', nome: 'Pão do Santuário', icone: '🍞' },
        geleia: { id: 'geleia', nome: 'Geleia de Morango', icone: '🍓' },
        buque: { id: 'buque', nome: 'Buquê do Santuário', icone: '💐' }
    };

    if (produtosEspeciais[id]) return produtosEspeciais[id];

    return catSementes.find(item => item.id === id) || {
        id,
        nome: id,
        icone: '📦'
    };
}

function normalizarFazenda() {
    if (!fazenda.silo) fazenda.silo = { ...SILO_BASE };

    Object.keys(SILO_BASE).forEach(chave => {
        if (typeof fazenda.silo[chave] !== 'number') {
            fazenda.silo[chave] = 0;
        }
    });

    if (typeof fazenda.capacidadeSilo !== 'number') {
        fazenda.capacidadeSilo = 50;
    }
    
    if (typeof fazenda.siloNivel !== 'number') {
        fazenda.siloNivel = 1;
    }

    fazenda.siloNivel = obterNivelSiloAtual();
    sincronizarCapacidadeSiloPorNivel();

    if (!fazenda.mercado) {
        fazenda.mercado = { tendencia: 'estavel' };
    }

    if (!fazenda.pecuaria) {
        fazenda.pecuaria = { vacaComprada: false, vacaFome: 0 };
    }

    if (!fazenda.maquinas) {
        fazenda.maquinas = { tratorComprado: false, aspersorComprado: false };
    }

    if (!fazenda.burocracia) {
        fazenda.burocracia = { licencaExpansao: false, alvaraDefensivos: false };
    }

    if (!fazenda.tempo) {
        fazenda.tempo = { estacaoIndex: 0, diasPassados: 0, ticks: 0 };
    }

    // Migração: leite antigo passa para o silo novo.
    if (typeof fazenda.estoqueLeite === 'number' && fazenda.estoqueLeite > 0) {
        fazenda.silo.leite += fazenda.estoqueLeite;
        fazenda.estoqueLeite = 0;
    }

    if (typeof fazenda.estoqueLeite !== 'number') {
        fazenda.estoqueLeite = 0;
    }

    normalizarFabricas();
    normalizarPedidos();
    normalizarProgressoFazenda();
}
function obterUsoSilo() {
    normalizarFazenda();

    return Object.values(fazenda.silo).reduce((total, qtd) => {
        return total + (Number(qtd) || 0);
    }, 0);
}

function obterEspacoLivreSilo() {
    normalizarFazenda();
    return Math.max(0, fazenda.capacidadeSilo - obterUsoSilo());
}

function adicionarAoSilo(id, quantidade) {
    normalizarFazenda();

    const qtd = Math.max(0, Number(quantidade) || 0);
    const espacoLivre = obterEspacoLivreSilo();
    const quantidadeAdicionada = Math.min(qtd, espacoLivre);

    if (!fazenda.silo[id]) fazenda.silo[id] = 0;
    fazenda.silo[id] += quantidadeAdicionada;

    return {
        adicionado: quantidadeAdicionada,
        excedente: qtd - quantidadeAdicionada
    };
}

// ==========================================
// FÁBRICAS DO SANTUÁRIO — PRODUÇÃO
// ==========================================
const RECEITAS_FABRICA = [
    {
        id: 'farinha',
        fabricaId: 'moinho',
        fabricaNome: 'Moinho do Santuário',
        iconeFabrica: '🌾',
        produtoId: 'farinha',
        produtoNome: 'Farinha Dourada',
        produtoIcone: '🌾',
        tempo: 45,
        ingredientes: { trigos: 3 }
    },
    {
        id: 'pao',
        fabricaId: 'forno',
        fabricaNome: 'Forno Afetivo',
        iconeFabrica: '🍞',
        produtoId: 'pao',
        produtoNome: 'Pão do Santuário',
        produtoIcone: '🍞',
        tempo: 75,
        ingredientes: { farinha: 2, leite: 1 }
    },
    {
        id: 'geleia',
        fabricaId: 'cozinha',
        fabricaNome: 'Cozinha Doce',
        iconeFabrica: '🍓',
        produtoId: 'geleia',
        produtoNome: 'Geleia de Morango',
        produtoIcone: '🍓',
        tempo: 60,
        ingredientes: { morangos: 2, leite: 1 }
    },
    {
        id: 'buque',
        fabricaId: 'atelie',
        fabricaNome: 'Ateliê Floral',
        iconeFabrica: '🌸',
        produtoId: 'buque',
        produtoNome: 'Buquê do Santuário',
        produtoIcone: '💐',
        tempo: 90,
        ingredientes: { rosas: 2, girassois: 1 }
    }
];

function normalizarFabricas() {
    if (!fazenda.fabricas) fazenda.fabricas = {};

    RECEITAS_FABRICA.forEach(receita => {
        if (!fazenda.fabricas[receita.fabricaId]) {
            fazenda.fabricas[receita.fabricaId] = {
                receitaId: null,
                produtoId: null,
                produtoNome: null,
                produtoIcone: null,
                prontoEm: 0
            };
        }
    });
}

function obterReceitaFabrica(receitaId) {
    return RECEITAS_FABRICA.find(receita => receita.id === receitaId) || null;
}

function formatarTempoFabrica(segundos) {
    const s = Math.max(0, Math.ceil(segundos));
    const min = Math.floor(s / 60);
    const sec = s % 60;

    if (min <= 0) return `${sec}s`;
    return `${min}m ${String(sec).padStart(2, '0')}s`;
}

function temIngredientesFabrica(receita) {
    normalizarFazenda();

    return Object.entries(receita.ingredientes).every(([id, qtd]) => {
        return (fazenda.silo[id] || 0) >= qtd;
    });
}

function consumirIngredientesFabrica(receita) {
    Object.entries(receita.ingredientes).forEach(([id, qtd]) => {
        fazenda.silo[id] -= qtd;
    });
}

function renderizarIngredientesFabrica(ingredientes) {
    return Object.entries(ingredientes).map(([id, qtd]) => {
        const info = obterInfoProdutoSilo(id);
        const atual = fazenda.silo[id] || 0;
        const ok = atual >= qtd;

        return `
            <span class="${ok ? 'fabrica-ing-ok' : 'fabrica-ing-falta'}">
                ${info.icone} ${atual}/${qtd}
            </span>
        `;
    }).join('');
}

// ==========================================
// PEDIDOS DO SANTUÁRIO — ENTREGAS
// ==========================================
const PEDIDOS_MODELOS = [
    {
        cliente: 'Thamiris',
        texto: 'Quero algo doce para deixar o dia mais bonito.',
        itens: { geleia: 1 },
        recompensaMoedas: 520
    },
    {
        cliente: 'Santuário',
        texto: 'Precisamos abastecer a despensa com mantimentos simples.',
        itens: { trigos: 4, cenouras: 2 },
        recompensaMoedas: 420
    },
    {
        cliente: 'Jardim da Saudade',
        texto: 'Um arranjo especial deixaria tudo mais vivo por aqui.',
        itens: { buque: 1 },
        recompensaMoedas: 680
    },
    {
        cliente: 'Cozinha Afetiva',
        texto: 'O forno precisa de ingredientes para preparar algo quentinho.',
        itens: { farinha: 2, leite: 1 },
        recompensaMoedas: 430
    },
    {
        cliente: 'Mesa do Café',
        texto: 'Um pão fresco seria perfeito para hoje.',
        itens: { pao: 1 },
        recompensaMoedas: 460
    },
    {
        cliente: 'Feira do Santuário',
        texto: 'A banca está precisando de produtos bonitos e frescos.',
        itens: { morangos: 2, girassois: 1 },
        recompensaMoedas: 390
    },
    {
        cliente: 'Encomenda Especial',
        texto: 'Este pedido é mais raro, mas paga muito bem.',
        itens: { orquideas: 1, rosas: 2, leite: 2 },
        recompensaMoedas: 850
    }
];

// ==========================================
// PEDIDOS ESPECIAIS — RARIDADE E SEQUÊNCIA
// ==========================================
const PEDIDO_RARIDADES = {
    comum: {
        nome: 'Comum',
        icone: '📦',
        multiplicador: 1,
        classe: 'pedido-raridade-comum'
    },
    especial: {
        nome: 'Especial',
        icone: '✨',
        multiplicador: 1.25,
        classe: 'pedido-raridade-especial'
    },
    raro: {
        nome: 'Raro',
        icone: '💎',
        multiplicador: 1.6,
        classe: 'pedido-raridade-raro'
    },
    romantico: {
        nome: 'Romântico',
        icone: '💛',
        multiplicador: 2,
        classe: 'pedido-raridade-romantico'
    }
};

const PEDIDOS_MODELOS_ESPECIAIS = [
    {
        cliente: 'Entrega Romântica',
        texto: 'Uma encomenda delicada para aquecer o coração do Santuário.',
        itens: { buque: 1, geleia: 1 },
        recompensaMoedas: 900,
        raridade: 'romantico'
    },
    {
        cliente: 'Festival da Colheita',
        texto: 'O festival precisa de produtos variados e bem cuidados.',
        itens: { trigos: 5, morangos: 3, leite: 2 },
        recompensaMoedas: 760,
        raridade: 'especial'
    },
    {
        cliente: 'Mesa Dourada',
        texto: 'Uma mesa especial pede pão fresco e flores raras.',
        itens: { pao: 1, rosas: 2 },
        recompensaMoedas: 820,
        raridade: 'raro'
    },
    {
        cliente: 'Pedido da Thamiris',
        texto: 'Ela pediu algo doce, bonito e feito com carinho.',
        itens: { geleia: 1, buque: 1 },
        recompensaMoedas: 1100,
        raridade: 'romantico'
    },
    {
        cliente: 'Celebração do Santuário',
        texto: 'Uma entrega completa para uma data especial.',
        itens: { pao: 1, geleia: 1, leite: 2 },
        recompensaMoedas: 980,
        raridade: 'raro'
    }
];

function obterConfigRaridadePedido(raridade) {
    return PEDIDO_RARIDADES[raridade] || PEDIDO_RARIDADES.comum;
}

function escolherRaridadePedido() {
    const entregas = Number(fazenda.pedidosConcluidos || 0);

    // A cada 7 entregas, força um pedido romântico/especial.
    if (entregas > 0 && entregas % 7 === 0) {
        return Math.random() < 0.5 ? 'romantico' : 'raro';
    }

    const sorteio = Math.random();

    if (sorteio < 0.06) return 'romantico';
    if (sorteio < 0.16) return 'raro';
    if (sorteio < 0.36) return 'especial';

    return 'comum';
}

function escolherModeloPedidoPorRaridade(raridade) {
    if (raridade === 'comum') {
        return PEDIDOS_MODELOS[Math.floor(Math.random() * PEDIDOS_MODELOS.length)];
    }

    const poolEspecial = PEDIDOS_MODELOS_ESPECIAIS.filter(modelo => modelo.raridade === raridade);

    if (poolEspecial.length > 0) {
        return poolEspecial[Math.floor(Math.random() * poolEspecial.length)];
    }

    return PEDIDOS_MODELOS[Math.floor(Math.random() * PEDIDOS_MODELOS.length)];
}

function obterBonusProximaEntrega() {
    const agora = Date.now();
    const ultimaEntrega = Number(fazenda.ultimaEntregaPedido || 0);
    const dentroDaSequencia = ultimaEntrega > 0 && (agora - ultimaEntrega) <= 10 * 60 * 1000;

    if (!dentroDaSequencia) return 0;

    return Math.min(150, Math.max(0, Number(fazenda.sequenciaPedidos || 0) * 25));
}

function formatarRaridadePedido(raridade) {
    const config = obterConfigRaridadePedido(raridade);

    return `
        <span class="pedido-raridade ${config.classe}">
            ${config.icone} ${config.nome}
        </span>
    `;
}

function gerarIdPedido() {
    return `pedido_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clonarItensPedido(itens) {
    return JSON.parse(JSON.stringify(itens || {}));
}

function gerarNovoPedido() {
    const raridade = escolherRaridadePedido();
    const modelo = escolherModeloPedidoPorRaridade(raridade);
    const configRaridade = obterConfigRaridadePedido(raridade);

    const recompensaBase = Number(modelo.recompensaMoedas || 100);
    const recompensaFinal = Math.round(recompensaBase * configRaridade.multiplicador);

    return {
        id: gerarIdPedido(),
        cliente: modelo.cliente,
        texto: modelo.texto,
        itens: clonarItensPedido(modelo.itens),
        recompensaMoedas: recompensaFinal,
        raridade,
        iconePedido: configRaridade.icone,
        criadoEm: Date.now()
    };
}

function normalizarPedidos() {
    if (!Array.isArray(fazenda.pedidos)) {
        fazenda.pedidos = [];
    }

    if (typeof fazenda.pedidosConcluidos !== 'number') {
        fazenda.pedidosConcluidos = 0;
    }

    if (typeof fazenda.pedidosEspeciaisConcluidos !== 'number') {
        fazenda.pedidosEspeciaisConcluidos = 0;
    }

    if (typeof fazenda.sequenciaPedidos !== 'number') {
        fazenda.sequenciaPedidos = 0;
    }

    if (typeof fazenda.ultimaEntregaPedido !== 'number') {
        fazenda.ultimaEntregaPedido = 0;
    }

    fazenda.pedidos = fazenda.pedidos
        .filter(pedido => {
            return pedido && pedido.id && pedido.itens && typeof pedido.recompensaMoedas === 'number';
        })
        .map(pedido => {
            const raridade = pedido.raridade || 'comum';
            const config = obterConfigRaridadePedido(raridade);

            return {
                ...pedido,
                raridade,
                iconePedido: pedido.iconePedido || config.icone
            };
        });

    while (fazenda.pedidos.length < 3) {
        fazenda.pedidos.push(gerarNovoPedido());
    }

    if (fazenda.pedidos.length > 3) {
        fazenda.pedidos = fazenda.pedidos.slice(0, 3);
    }
}

function temItensParaPedido(pedido) {
    return Object.entries(pedido.itens || {}).every(([id, qtd]) => {
        return (fazenda.silo[id] || 0) >= qtd;
    });
}

function consumirItensPedido(pedido) {
    Object.entries(pedido.itens || {}).forEach(([id, qtd]) => {
        fazenda.silo[id] -= qtd;
    });
}

function renderizarItensPedido(itens) {
    return Object.entries(itens || {}).map(([id, qtd]) => {
        const info = obterInfoProdutoSilo(id);
        const atual = fazenda.silo[id] || 0;
        const ok = atual >= qtd;

        return `
            <span class="${ok ? 'pedido-item-ok' : 'pedido-item-falta'}">
                ${info.icone} ${atual}/${qtd}
            </span>
        `;
    }).join('');
}

// ==========================================
// PROGRESSÃO DA FAZENDA — XP, NÍVEL E BÔNUS
// ==========================================
const NIVEL_MAX_FAZENDA = 20;

const TITULOS_NIVEL_FAZENDA = [
    { nivel: 1, titulo: 'Aprendiz do Santuário' },
    { nivel: 2, titulo: 'Cuidador da Terra' },
    { nivel: 3, titulo: 'Produtor Iniciante' },
    { nivel: 4, titulo: 'Guardião da Colheita' },
    { nivel: 5, titulo: 'Fazendeiro do Afeto' },
    { nivel: 7, titulo: 'Mestre da Produção' },
    { nivel: 10, titulo: 'Arquiteto Rural do Santuário' },
    { nivel: 15, titulo: 'Lenda da Mini Fazenda' },
    { nivel: 20, titulo: 'Coração Verde Supremo' }
];

function obterXpNecessarioNivel(nivel) {
    const nivelSeguro = Math.max(1, Number(nivel) || 1);
    return Math.round(100 + ((nivelSeguro - 1) * 55) + Math.pow(nivelSeguro - 1, 1.45) * 18);
}

function obterTituloNivelFazenda(nivel) {
    const nivelSeguro = Math.max(1, Number(nivel) || 1);

    let tituloAtual = TITULOS_NIVEL_FAZENDA[0].titulo;

    TITULOS_NIVEL_FAZENDA.forEach(item => {
        if (nivelSeguro >= item.nivel) {
            tituloAtual = item.titulo;
        }
    });

    return tituloAtual;
}

function normalizarProgressoFazenda() {
    if (!fazenda.progresso) {
        fazenda.progresso = {
            nivel: 1,
            xp: 0,
            xpTotal: 0
        };
    }

    if (typeof fazenda.progresso.nivel !== 'number') fazenda.progresso.nivel = 1;
    if (typeof fazenda.progresso.xp !== 'number') fazenda.progresso.xp = 0;
    if (typeof fazenda.progresso.xpTotal !== 'number') fazenda.progresso.xpTotal = 0;

    fazenda.progresso.nivel = Math.max(1, Math.min(fazenda.progresso.nivel, NIVEL_MAX_FAZENDA));
    fazenda.progresso.xp = Math.max(0, fazenda.progresso.xp);
    fazenda.progresso.xpTotal = Math.max(0, fazenda.progresso.xpTotal);
}

function obterBonusRecompensaPedidos() {
    normalizarProgressoFazenda();

    const nivel = fazenda.progresso.nivel;

    if (nivel >= 15) return 0.25;
    if (nivel >= 10) return 0.20;
    if (nivel >= 7) return 0.15;
    if (nivel >= 5) return 0.10;
    if (nivel >= 3) return 0.05;

    return 0;
}

function atualizarUIProgressoFazenda() {
    if (!fazenda || !fazenda.progresso) return;

    normalizarProgressoFazenda();

    const nivel = fazenda.progresso.nivel;
    const xpAtual = fazenda.progresso.xp;
    const xpNecessario = nivel >= NIVEL_MAX_FAZENDA ? xpAtual : obterXpNecessarioNivel(nivel);
    const percentual = nivel >= NIVEL_MAX_FAZENDA
        ? 100
        : Math.min(100, Math.round((xpAtual / xpNecessario) * 100));

    const elNivel = document.getElementById('fazenda-nivel');
    const elTitulo = document.getElementById('fazenda-titulo-nivel');
    const elBarra = document.getElementById('fazenda-xp-preenchimento');
    const elTexto = document.getElementById('fazenda-xp-texto');

    if (elNivel) elNivel.innerText = nivel;
    if (elTitulo) elTitulo.innerText = obterTituloNivelFazenda(nivel);
    if (elBarra) elBarra.style.width = `${percentual}%`;

    if (elTexto) {
        elTexto.innerText = nivel >= NIVEL_MAX_FAZENDA
            ? 'Nível máximo'
            : `${xpAtual}/${xpNecessario} XP`;
    }
}

function ganharXpFazenda(quantidade, motivo = 'Ação na fazenda') {
    normalizarFazenda();

    const xpGanho = Math.max(0, Math.round(Number(quantidade) || 0));
    if (xpGanho <= 0) return;

    fazenda.progresso.xp += xpGanho;
    fazenda.progresso.xpTotal += xpGanho;

    let subiuNivel = false;
    let niveisGanhos = 0;

    while (
        fazenda.progresso.nivel < NIVEL_MAX_FAZENDA &&
        fazenda.progresso.xp >= obterXpNecessarioNivel(fazenda.progresso.nivel)
    ) {
        fazenda.progresso.xp -= obterXpNecessarioNivel(fazenda.progresso.nivel);
        fazenda.progresso.nivel += 1;
        subiuNivel = true;
        niveisGanhos += 1;
    }

    atualizarUIProgressoFazenda();

    if (subiuNivel) {
        const titulo = obterTituloNivelFazenda(fazenda.progresso.nivel);

        if (typeof mostrarToast === 'function') {
            mostrarToast(`Nível ${fazenda.progresso.nivel}! ${titulo}`, '⭐');
        }

        if (typeof confetti === 'function') {
            confetti({
                colors: ['#D4AF37', '#2ecc71'],
                particleCount: 90 + (niveisGanhos * 20),
                spread: 80
            });
        }

        if (window.Haptics) window.Haptics.sucesso();
    } else if (typeof mostrarToast === 'function') {
        mostrarToast(`+${xpGanho} XP — ${motivo}`, '⭐');
    }
}

const estacoesAno = [
    { id: 'primavera', nome: 'Primavera 🌸', temp: 'Ameno', bonus: 'cafe' },
    { id: 'verao', nome: 'Verão ☀️', temp: 'Quente', bonus: 'soja' },
    { id: 'outono', nome: 'Outono 🍂', temp: 'Vento', bonus: 'milho' },
    { id: 'inverno', nome: 'Inverno ❄️', temp: 'Frio', bonus: 'nenhum' }
];

// 2. A MEMÓRIA DO JOGO
let fazenda = {
    estoqueLeite: 0,
    silo: { ...SILO_BASE },
    capacidadeSilo: 50,
    mercado: { tendencia: 'estavel' },
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
window.abaFazendaAtual = window.abaFazendaAtual || 'sementes';
window.avisoProducaoOfflineExibido = false;

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

    normalizarFazenda();
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
    normalizarFazenda();
    // 🌍 LIGA O SATÉLITE ASSIM QUE A FAZENDA ABRIR
    if(typeof buscarClimaRealFazenda === 'function') buscarClimaRealFazenda();
    
    // 🚨 INVOCAÇÃO DA MÁQUINA DO TEMPO AQUI (Calcula o AFK)
    calcularProgressoOffline();
    avisarProducoesProntasOffline();

    document.getElementById('fazenda-capital').innerText = window.pontosDoCasal;
    atualizarUIProgressoFazenda();
    
    sincronizarTribunal();
    injetarPainelEstacoes(); 
    
    atualizarVisuaisAnimatronics();
    renderizarTerrenos();
    renderizarLoja('sementes');
    
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
            const depositoLeite = adicionarAoSilo('leite', 1);

            if (depositoLeite.excedente > 0 && typeof mostrarToast === 'function') {
                mostrarToast('O silo está cheio. O leite excedente foi perdido.', '🎒');
            }
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

    atualizarTimersFabricasDOM();

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

        const espacoLivre = obterEspacoLivreSilo();

        if (espacoLivre < multiplicadorYield) {
            if (typeof mostrarToast === 'function') {
                mostrarToast(`Silo cheio! Libere ${multiplicadorYield - espacoLivre} espaço(s) antes de colher.`, '🎒');
            }
            if (window.Haptics) window.Haptics.erro();
            return;
        }

        const deposito = adicionarAoSilo(t.planta.id, multiplicadorYield);

        if(typeof mostrarToast === 'function') {
            mostrarToast(`Colheita ${qualidadeText}! +${deposito.adicionado} ${t.planta.nome} no Silo.`, iconeQualidade);
        }

        ganharXpFazenda(5 * deposito.adicionado, `Colheita ${qualidadeText}`);

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
window.venderItemSilo = function(id, quantidade = 1) {
    normalizarFazenda();

    const disponivel = fazenda.silo[id] || 0;

    if (disponivel <= 0) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Não há estoque suficiente para vender.', '⚠️');
        }
        if (window.Haptics) window.Haptics.erro();
        return;
    }

    const qtdVenda = quantidade === 'tudo'
        ? disponivel
        : Math.min(disponivel, Math.max(1, Number(quantidade) || 1));

    const precoUnitario = PRECO_VENDA_SILO[id] || 10;
    const lucro = qtdVenda * precoUnitario;
    const info = obterInfoProdutoSilo(id);

    fazenda.silo[id] -= qtdVenda;

    if (typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(lucro, `Venda de ${qtdVenda}x ${info.nome}`);
    }

    const capital = document.getElementById('fazenda-capital');
    if (capital) capital.innerText = window.pontosDoCasal;

    if (typeof mostrarToast === 'function') {
        mostrarToast(`Venda concluída: ${qtdVenda}x ${info.nome} (+R$ ${lucro})`, '💰');
    }

    if (window.Haptics) window.Haptics.sucesso();

    salvarFazenda();
    renderizarLoja('silo');
};

window.melhorarSilo = function() {
    normalizarFazenda();

    const proximo = obterProximoNivelSilo();

    if (!proximo) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('O Silo do Santuário já está no nível máximo.', '🏆');
        }
        return;
    }

    const moedasAtuais = window.pontosDoCasal || 0;

    if (moedasAtuais < proximo.custoMoedas) {
        if (typeof mostrarToast === 'function') {
            mostrarToast(`Capital insuficiente. Faltam R$ ${proximo.custoMoedas - moedasAtuais}.`, '💸');
        }
        if (window.Haptics) window.Haptics.erro();
        return;
    }

    if (!temRecursosParaMelhorarSilo(proximo)) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Recursos insuficientes no Silo para melhorar.', '🎒');
        }
        if (window.Haptics) window.Haptics.erro();
        return;
    }

    Object.entries(proximo.recursos || {}).forEach(([id, qtd]) => {
        fazenda.silo[id] -= qtd;
    });

    if (typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(-proximo.custoMoedas, `Melhoria do Silo nível ${proximo.nivel}`);
    }

    fazenda.siloNivel = proximo.nivel;
    sincronizarCapacidadeSiloPorNivel();

    ganharXpFazenda(30 * proximo.nivel, `Melhoria do Silo nível ${proximo.nivel}`);

    const capital = document.getElementById('fazenda-capital');
    if (capital) capital.innerText = window.pontosDoCasal;

    if (typeof mostrarToast === 'function') {
        mostrarToast(`Silo melhorado para nível ${proximo.nivel}! Capacidade: ${proximo.capacidade}.`, '🎒');
    }

    if (window.Haptics) window.Haptics.sucesso();

    salvarFazenda();
    renderizarLoja('silo');
};

window.iniciarProducaoFabrica = function(receitaId) {
    normalizarFazenda();

    const receita = obterReceitaFabrica(receitaId);

    if (!receita) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Receita não encontrada.', '⚠️');
        }
        return;
    }

    const fabrica = fazenda.fabricas[receita.fabricaId];

    if (fabrica && fabrica.produtoId) {
        if (typeof mostrarToast === 'function') {
            mostrarToast(`${receita.fabricaNome} já está produzindo.`, '🏭');
        }
        if (window.Haptics) window.Haptics.erro();
        return;
    }

    if (!temIngredientesFabrica(receita)) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Ingredientes insuficientes no Silo.', '🎒');
        }
        if (window.Haptics) window.Haptics.erro();
        return;
    }

    consumirIngredientesFabrica(receita);

    fazenda.fabricas[receita.fabricaId] = {
        receitaId: receita.id,
        produtoId: receita.produtoId,
        produtoNome: receita.produtoNome,
        produtoIcone: receita.produtoIcone,
        prontoEm: Date.now() + (receita.tempo * 1000)
    };

    if (typeof mostrarToast === 'function') {
        mostrarToast(`${receita.produtoNome} entrou em produção.`, receita.iconeFabrica);
    }

    if (window.Haptics) window.Haptics.sucesso();

    salvarFazenda();
    renderizarLoja('producao');
};

window.coletarProducaoFabrica = function(fabricaId) {
    normalizarFazenda();

    const fabrica = fazenda.fabricas[fabricaId];

    if (!fabrica || !fabrica.produtoId) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Nada para coletar nesta fábrica.', '🏭');
        }
        return;
    }

    if (Date.now() < fabrica.prontoEm) {
        if (typeof mostrarToast === 'function') {
            const restante = Math.ceil((fabrica.prontoEm - Date.now()) / 1000);
            mostrarToast(`Produção ainda em andamento: ${formatarTempoFabrica(restante)}.`, '⏳');
        }
        return;
    }

    if (obterEspacoLivreSilo() < 1) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Silo cheio. Libere espaço antes de coletar.', '🎒');
        }
        if (window.Haptics) window.Haptics.erro();
        return;
    }

    adicionarAoSilo(fabrica.produtoId, 1);

    const nomeProduto = fabrica.produtoNome;
    const iconeProduto = fabrica.produtoIcone;

    ganharXpFazenda(15, `Produção: ${nomeProduto}`);

    fazenda.fabricas[fabricaId] = {
        receitaId: null,
        produtoId: null,
        produtoNome: null,
        produtoIcone: null,
        prontoEm: 0
    };

    if (typeof mostrarToast === 'function') {
        mostrarToast(`${nomeProduto} enviado ao Silo.`, iconeProduto || '📦');
    }

    if (window.Haptics) window.Haptics.sucesso();

    salvarFazenda();
    renderizarLoja('producao');
};

// =========================================================
// FÁBRICAS — PRODUÇÃO OFFLINE E TIMERS VIVOS
// =========================================================
function obterProducoesProntas() {
    normalizarFazenda();

    return Object.entries(fazenda.fabricas || {})
        .filter(([_, fabrica]) => {
            return fabrica && fabrica.produtoId && Date.now() >= fabrica.prontoEm;
        })
        .map(([fabricaId, fabrica]) => ({
            fabricaId,
            ...fabrica
        }));
}

function obterProducoesEmAndamento() {
    normalizarFazenda();

    return Object.entries(fazenda.fabricas || {})
        .filter(([_, fabrica]) => {
            return fabrica && fabrica.produtoId;
        })
        .map(([fabricaId, fabrica]) => ({
            fabricaId,
            ...fabrica
        }));
}

function avisarProducoesProntasOffline() {
    if (window.avisoProducaoOfflineExibido) return;

    const prontas = obterProducoesProntas();

    if (prontas.length <= 0) return;

    window.avisoProducaoOfflineExibido = true;

    setTimeout(() => {
        if (typeof mostrarToast === 'function') {
            const texto = prontas.length === 1
                ? `${prontas[0].produtoNome} ficou pronto enquanto você estava fora.`
                : `${prontas.length} produções ficaram prontas enquanto você estava fora.`;

            mostrarToast(texto, '🏭');
        }
    }, 1200);
}

function atualizarTimersFabricasDOM() {
    if (window.abaFazendaAtual !== 'producao') return;

    const producoes = obterProducoesEmAndamento();

    producoes.forEach(fabrica => {
        const status = document.getElementById(`status-fabrica-${fabrica.fabricaId}`);
        const botao = document.getElementById(`btn-fabrica-${fabrica.fabricaId}`);

        if (!status || !botao) return;

        const pronto = Date.now() >= fabrica.prontoEm;

        if (pronto) {
            status.innerHTML = `✅ ${fabrica.produtoNome} pronto`;
            status.classList.add('fabrica-status-pronto');

            botao.innerText = 'Coletar';
            botao.classList.add('fabrica-btn-pronto');
            botao.disabled = false;
        } else {
            const restante = Math.ceil((fabrica.prontoEm - Date.now()) / 1000);

            status.innerHTML = `⏳ Produzindo: <span class="fabrica-tempo-restante">${formatarTempoFabrica(restante)}</span>`;
            status.classList.remove('fabrica-status-pronto');

            botao.innerText = 'Aguardar';
            botao.classList.remove('fabrica-btn-pronto');
            botao.disabled = false;
        }
    });
}

// Compatibilidade com chamadas antigas
window.venderLeiteDireto = function() {
    window.venderItemSilo('leite', 'tudo');
};

// 6. LOJA AVANÇADA COM TARGETING SYSTEM MESTRE
window.mudarAbaLoja = function(aba) {
    window.abaFazendaAtual = aba;

    document.querySelectorAll('.aba-btn').forEach(btn => btn.classList.remove('ativa'));

    const botao = document.querySelector(`.aba-btn[data-aba="${aba}"]`);
    if (botao) botao.classList.add('ativa');

    renderizarLoja(aba);

    const titulo = document.getElementById('fazenda-hud-titulo');
    if (titulo) {
    const nomesAbasFazenda = {
        sementes: 'Plantio e sementes',
        insumos: 'Manejo agrícola',
        pecuaria: 'Animais e produção',
        maquinas: 'Máquinas e automação',
        silo: 'Silo e estoque',
        producao: 'Fábricas e produção',
        pedidos: 'Pedidos e entregas'
    };

        titulo.innerText = nomesAbasFazenda[aba] || 'Operações';
    }
};

function renderizarLoja(aba = 'sementes') {
    const conteudo = document.getElementById('conteudo-loja');
    if (!conteudo) return;
    conteudo.innerHTML = '';

    if (aba === 'silo') {
        renderizarSilo(conteudo);
        return;
    }

    if (aba === 'producao') {
        renderizarProducao(conteudo);
        return;
    }   

    if (aba === 'pedidos') {
        renderizarPedidos(conteudo);
        return;
    }

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

function renderizarSilo(conteudo) {
    normalizarFazenda();

    const uso = obterUsoSilo();
    const capacidade = fazenda.capacidadeSilo;
    const percentual = Math.min(100, Math.round((uso / capacidade) * 100));
    const nivelAtual = obterNivelSiloAtual();
    const proximoNivel = obterProximoNivelSilo();

    const itensSilo = Object.keys(fazenda.silo)
        .map(id => {
            const info = obterInfoProdutoSilo(id);
            const qtd = fazenda.silo[id] || 0;
            const preco = PRECO_VENDA_SILO[id] || 10;

            return {
                id,
                nome: info.nome,
                icone: info.icone,
                qtd,
                preco
            };
        });

    conteudo.innerHTML = `
        <div class="silo-painel-resumo">
            <div>
                <span class="silo-kicker">Armazém da Fazenda</span>
                <strong>Silo do Santuário</strong>
            </div>
            <div class="silo-capacidade">${uso}/${capacidade}</div>
        </div>

        <div class="silo-barra">
            <div style="width:${percentual}%"></div>
        </div>

                <div class="silo-upgrade-card">
            <div class="silo-upgrade-info">
                <span class="silo-kicker">Melhoria estrutural</span>
                <strong>Silo nível ${nivelAtual}</strong>
                <small>
                    ${proximoNivel 
                        ? `Próximo nível: ${proximoNivel.capacidade} espaços`
                        : 'Capacidade máxima atingida'}
                </small>
            </div>

            ${proximoNivel ? `
                <div class="silo-upgrade-requisitos">
                    <div class="silo-upgrade-custo">💰 R$ ${proximoNivel.custoMoedas}</div>
                    <div class="silo-upgrade-lista">
                        ${renderizarRequisitosSilo(proximoNivel.recursos)}
                    </div>
                </div>

                <button class="silo-upgrade-btn" onclick="melhorarSilo()">
                    Melhorar
                </button>
            ` : `
                <div class="silo-upgrade-maximo">🏆 Máximo</div>
            `}
        </div>

        <div class="silo-grid">
            ${itensSilo.map(item => `
                <div class="silo-card ${item.qtd <= 0 ? 'silo-card-vazio' : ''}">
                    <div class="silo-card-info">
                        <span class="silo-card-icone">${item.icone}</span>
                        <div>
                            <strong>${item.nome}</strong>
                            <small>Estoque: ${item.qtd} • R$ ${item.preco}/un.</small>
                        </div>
                    </div>

                    <div class="silo-card-acoes">
                        <button ${item.qtd <= 0 ? 'disabled' : ''} onclick="venderItemSilo('${item.id}', 1)">Vender 1</button>
                        <button ${item.qtd <= 0 ? 'disabled' : ''} onclick="venderItemSilo('${item.id}', 'tudo')">Tudo</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderizarProducao(conteudo) {
    normalizarFazenda();

    conteudo.innerHTML = `
        <div class="fabrica-painel-resumo">
            <div>
                <span class="silo-kicker">Cadeia produtiva</span>
                <strong>Fábricas do Santuário</strong>
                <small>Transforme colheitas em produtos de maior valor.</small>
            </div>
            <div class="fabrica-selo">🏭</div>
        </div>

        <div class="fabrica-grid">
            ${RECEITAS_FABRICA.map(receita => {
                const fabrica = fazenda.fabricas[receita.fabricaId];
                const emProducao = fabrica && fabrica.produtoId;
                const pronto = emProducao && Date.now() >= fabrica.prontoEm;
                const restante = emProducao ? Math.ceil((fabrica.prontoEm - Date.now()) / 1000) : 0;
                const podeProduzir = temIngredientesFabrica(receita);

                return `
                    <div class="fabrica-card ${emProducao ? 'fabrica-card-ativa' : ''}">
                        <div class="fabrica-card-topo">
                            <div class="fabrica-icone">${receita.iconeFabrica}</div>
                            <div>
                                <strong>${receita.fabricaNome}</strong>
                                <small>${receita.produtoIcone} ${receita.produtoNome}</small>
                            </div>
                        </div>

                        <div class="fabrica-ingredientes">
                            ${renderizarIngredientesFabrica(receita.ingredientes)}
                        </div>

                        ${emProducao ? `
                            <div 
                                class="fabrica-status ${pronto ? 'fabrica-status-pronto' : ''}" 
                                id="status-fabrica-${receita.fabricaId}"
                            >
                                ${pronto 
                                    ? `✅ ${fabrica.produtoNome} pronto`
                                    : `⏳ Produzindo: <span class="fabrica-tempo-restante">${formatarTempoFabrica(restante)}</span>`
                                }
                            </div>

                            <button 
                                id="btn-fabrica-${receita.fabricaId}"
                                class="fabrica-btn ${pronto ? 'fabrica-btn-pronto' : ''}" 
                                onclick="coletarProducaoFabrica('${receita.fabricaId}')"
                            >
                                ${pronto ? 'Coletar' : 'Aguardar'}
                            </button>
                        ` : `
                            <div class="fabrica-status">
                                Tempo: ${formatarTempoFabrica(receita.tempo)}
                            </div>

                            <button 
                                class="fabrica-btn" 
                                ${podeProduzir ? '' : 'disabled'} 
                                onclick="iniciarProducaoFabrica('${receita.id}')"
                            >
                                Produzir
                            </button>
                        `}
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderizarPedidos(conteudo) {
    normalizarFazenda();

    const pedidosProntos = fazenda.pedidos.filter(pedido => temItensParaPedido(pedido)).length;
    const bonusProximaEntrega = obterBonusProximaEntrega();
    const bonusNivelPercentual = obterBonusRecompensaPedidos();

    conteudo.innerHTML = `
        <div class="pedidos-painel-resumo">
            <div>
                <span class="silo-kicker">Mural de encomendas</span>
                <strong>Pedidos do Santuário</strong>
                <small>
                    ${fazenda.pedidosConcluidos} entrega(s) • 
                    ${fazenda.pedidosEspeciaisConcluidos} especial(is)
                </small>
            </div>

            <div class="pedidos-selo">
                ${pedidosProntos > 0 ? `✅ ${pedidosProntos}` : '📦'}
            </div>
        </div>

        ${fazenda.sequenciaPedidos > 1 ? `
            <div class="pedido-combo-card">
                🔥 Sequência ativa: <b>${fazenda.sequenciaPedidos}</b> entrega(s)
                ${bonusProximaEntrega > 0 ? `<span>Próximo bônus: R$ ${bonusProximaEntrega}</span>` : ''}
            </div>
        ` : `
            <div class="pedido-combo-card pedido-combo-neutro">
                Faça entregas em sequência para ganhar bônus extras.
            </div>
        `}

        ${bonusNivelPercentual > 0 ? `
            <div class="pedido-bonus-nivel-card">
                ⭐ Bônus de nível ativo: <b>+${Math.round(bonusNivelPercentual * 100)}%</b> nas recompensas de pedidos.
            </div>
        ` : ''}

        <div class="pedidos-grid">
            ${fazenda.pedidos.map(pedido => {
                const pronto = temItensParaPedido(pedido);
                const configRaridade = obterConfigRaridadePedido(pedido.raridade);
                const classeRaridade = configRaridade.classe;
                const bonusTexto = bonusProximaEntrega > 0 ? ` + bônus possível R$ ${bonusProximaEntrega}` : '';

                return `
                    <div class="pedido-card ${pronto ? 'pedido-card-pronto' : ''} ${classeRaridade}">
                        <div class="pedido-card-topo">
                            <div class="pedido-avatar">${pedido.iconePedido || configRaridade.icone || '📦'}</div>
                            <div>
                                <div class="pedido-linha-titulo">
                                    <strong>${pedido.cliente}</strong>
                                    ${formatarRaridadePedido(pedido.raridade)}
                                </div>
                                <small>${pedido.texto}</small>
                            </div>
                        </div>

                        <div class="pedido-itens">
                            ${renderizarItensPedido(pedido.itens)}
                        </div>

                        <div class="pedido-recompensa">
                            💰 Recompensa: <b>R$ ${pedido.recompensaMoedas}</b>
                            ${bonusTexto ? `<span>${bonusTexto}</span>` : ''}
                        </div>

                        <div class="pedido-acoes">
                            <button 
                                class="pedido-btn pedido-btn-entregar" 
                                ${pronto ? '' : 'disabled'} 
                                onclick="entregarPedidoFazenda('${pedido.id}')"
                            >
                                Entregar
                            </button>

                            <button 
                                class="pedido-btn pedido-btn-trocar" 
                                onclick="trocarPedidoFazenda('${pedido.id}')"
                            >
                                Trocar R$50
                            </button>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

window.entregarPedidoFazenda = function(pedidoId) {
    normalizarFazenda();

    const index = fazenda.pedidos.findIndex(pedido => pedido.id === pedidoId);

    if (index === -1) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Pedido não encontrado.', '⚠️');
        }
        return;
    }

    const pedido = fazenda.pedidos[index];

    if (!temItensParaPedido(pedido)) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Itens insuficientes no Silo para concluir este pedido.', '🎒');
        }

        if (window.Haptics) window.Haptics.erro();
        return;
    }

    consumirItensPedido(pedido);

    const agora = Date.now();
    const dentroDaSequencia = fazenda.ultimaEntregaPedido > 0 && (agora - fazenda.ultimaEntregaPedido) <= 10 * 60 * 1000;

    if (dentroDaSequencia) {
        fazenda.sequenciaPedidos += 1;
    } else {
        fazenda.sequenciaPedidos = 1;
    }

    fazenda.ultimaEntregaPedido = agora;

    const bonusSequencia = Math.min(150, Math.max(0, (fazenda.sequenciaPedidos - 1) * 25));
    const bonusNivelPercentual = obterBonusRecompensaPedidos();

    const recompensaAntesDoNivel = pedido.recompensaMoedas + bonusSequencia;
    const bonusNivel = Math.round(recompensaAntesDoNivel * bonusNivelPercentual);
    const recompensaTotal = recompensaAntesDoNivel + bonusNivel;

    const xpPorRaridade = {
        comum: 25,
        especial: 40,
        raro: 60,
        romantico: 85
    };

    const xpPedido = xpPorRaridade[pedido.raridade || 'comum'] || 25;
    ganharXpFazenda(xpPedido, `Pedido ${pedido.raridade || 'comum'}`);

    if (typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(recompensaTotal, `Pedido entregue: ${pedido.cliente}`);
    }

    fazenda.pedidosConcluidos += 1;

    if (pedido.raridade && pedido.raridade !== 'comum') {
        fazenda.pedidosEspeciaisConcluidos += 1;
    }

    fazenda.pedidos[index] = gerarNovoPedido();

    const capital = document.getElementById('fazenda-capital');
    if (capital) capital.innerText = window.pontosDoCasal;

    if (typeof mostrarToast === 'function') {
        const textoBonusSequencia = bonusSequencia > 0 ? ` + sequência R$ ${bonusSequencia}` : '';
        const textoBonusNivel = bonusNivel > 0 ? ` + nível R$ ${bonusNivel}` : '';

        mostrarToast(
            `Pedido entregue! +R$ ${recompensaTotal}${textoBonusSequencia}${textoBonusNivel}`,
            pedido.iconePedido || '📦'
        );
    }

    if (window.Haptics) window.Haptics.sucesso();

    salvarFazenda();
    renderizarLoja('pedidos');
};

window.trocarPedidoFazenda = function(pedidoId) {
    normalizarFazenda();

    const custoTroca = 50;
    const moedasAtuais = window.pontosDoCasal || 0;

    if (moedasAtuais < custoTroca) {
        if (typeof mostrarToast === 'function') {
            mostrarToast(`Você precisa de R$ ${custoTroca} para trocar este pedido.`, '💸');
        }

        if (window.Haptics) window.Haptics.erro();
        return;
    }

    const index = fazenda.pedidos.findIndex(pedido => pedido.id === pedidoId);

    if (index === -1) {
        if (typeof mostrarToast === 'function') {
            mostrarToast('Pedido não encontrado.', '⚠️');
        }
        return;
    }

    if (typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(-custoTroca, 'Troca de pedido da Mini Fazenda');
    }

    fazenda.pedidos[index] = gerarNovoPedido();

    const capital = document.getElementById('fazenda-capital');
    if (capital) capital.innerText = window.pontosDoCasal;

    if (typeof mostrarToast === 'function') {
        mostrarToast('Novo pedido recebido.', '📦');
    }

    if (window.Haptics) window.Haptics.toqueLeve();

    salvarFazenda();
    renderizarLoja('pedidos');
};

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