// ============================================================================
// PERÍCIA DO AFETO (CSI AGRONÔMICO) - THE GOD TIER ENGINE + 25 CASOS
// ============================================================================

window.bancoDeCasos = [
    {
        id: "caso_1",
        titulo: "O Mistério da Lavoura Seca",
        descricao: "O setor 4 da fazenda apareceu completamente seco. O vizinho jura que a culpa é do sol forte que fez ontem, mas o seu faro agronômico diz o contrário.",
        testemunha: { nome: "Vizinho Fofoqueiro", icone: "🤠", depoimento: "Doutor, eu vi com meus próprios olhos! O sol tava de rachar a semana inteira, a terra secou sozinha e esturricou as folhas. Eu não tenho nada a ver com isso!" },
        provas: [
            { id: "p1", nome: "Termômetro", icone: "🌡️", tipo: "Falsa" },
            { id: "p2", nome: "Pluviômetro", icone: "🌧️", tipo: "Verdadeira", razao: "Mentira! O Pluviômetro registrou 40mm de chuva ontem à noite na sua região. O solo não secou pelo sol, alguém desligou as bombas de propósito!" },
            { id: "p3", nome: "Amostra de Terra", icone: "🪨", tipo: "Falsa" },
            { id: "p4", nome: "Extrato do Banco", icone: "📄", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Clima Controlado"
    },
    {
        id: "caso_2",
        titulo: "O Trator Sabotado",
        descricao: "A chave do trator principal sumiu logo na época da colheita. O fiscal do sindicato afirma que a máquina foi apreendida por falta de manutenção preventiva.",
        testemunha: { nome: "Fiscal do Sindicato", icone: "🕵️", depoimento: "A lei é clara! A máquina agrícola estava vazando óleo e sem a revisão técnica de 10.000 horas. Eu tive que confiscar as chaves por segurança ambiental." },
        provas: [
            { id: "p1", nome: "Laudo de Solo", icone: "📋", tipo: "Falsa" },
            { id: "p2", nome: "Chave Inglesa", icone: "🔧", tipo: "Falsa" },
            { id: "p3", nome: "Nota de Oficina", icone: "🧾", tipo: "Verdadeira", razao: "Objeção! A Nota Fiscal comprova que a revisão de 10.000 horas foi feita e paga há apenas 3 dias. A apreensão é ilegal e fraudulenta!" },
            { id: "p4", nome: "Semente de Milho", icone: "🌽", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Liminar de Frota"
    },
    {
        id: "caso_3",
        titulo: "Semente Falsificada",
        descricao: "As sementes de soja transgênica não germinaram. O vendedor diz que a culpa é do lote da transportadora que pegou umidade.",
        testemunha: { nome: "Vendedor de Insumos", icone: "💼", depoimento: "Meu lote saiu perfeito do armazém! O problema foi o caminhão da transportadora, que deixou a lona aberta e choveu em cima das sementes, apodrecendo tudo." },
        provas: [
            { id: "p1", nome: "Mapa do GPS", icone: "🗺️", tipo: "Falsa" },
            { id: "p2", nome: "Teste de Vigor", icone: "🌱", tipo: "Verdadeira", razao: "Isso é impossível! O Teste de Vigor no laboratório apontou 0% de germinação antes mesmo do embarque. Você nos vendeu sementes mortas!" },
            { id: "p3", nome: "Lona do Caminhão", icone: "🚚", tipo: "Falsa" },
            { id: "p4", nome: "Boletim Ocorrência", icone: "🚓", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Semente de Ouro"
    },
    {
        id: "caso_4",
        titulo: "O Gado Fugitivo",
        descricao: "Cem cabeças de gado apareceram pastando na reserva legal. O pecuarista afirma que um raio destruiu a cerca elétrica durante a madrugada.",
        testemunha: { nome: "Pecuarista Irritado", icone: "🐂", depoimento: "Eu sou um homem da lei! Ontem de madrugada caiu uma tempestade elétrica terrível, um raio partiu a cerca ao meio e os bois fugiram pelo buraco." },
        provas: [
            { id: "p1", nome: "Foto da Cerca", icone: "📸", tipo: "Falsa" },
            { id: "p2", nome: "Radar Meteorológico", icone: "📡", tipo: "Verdadeira", razao: "Falso testemunho! O Radar Meteorológico prova que não houve nenhuma nuvem num raio de 500km ontem. Você cortou a cerca com um alicate!" },
            { id: "p3", nome: "Contrato de Arrendamento", icone: "📜", tipo: "Falsa" },
            { id: "p4", nome: "Fio de Cobre", icone: "⚡", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Cerca Quântica"
    },
    {
        id: "caso_5",
        titulo: "A Geada Fantasma",
        descricao: "A seguradora se recusa a pagar o seguro rural da safra de café, alegando que não houve geada na região de Colombo.",
        testemunha: { nome: "Corretor de Seguros", icone: "👔", depoimento: "Lamentamos, mas as cláusulas contratuais são rígidas. Nossa estação meteorológica na cidade não registrou temperaturas abaixo de 5ºC. O seguro foi negado por ausência de sinistro." },
        provas: [
            { id: "p1", nome: "Termômetro da Sede", icone: "🌡️", tipo: "Falsa" },
            { id: "p2", nome: "Folha Queimada", icone: "🍂", tipo: "Falsa" },
            { id: "p3", nome: "Sensor de Microclima", icone: "📟", tipo: "Verdadeira", razao: "Objeção! A sua estação fica no asfalto da cidade. O Sensor de Microclima no fundo do vale da nossa propriedade marcou -2ºC às 4h da manhã. O sinistro é real!" },
            { id: "p4", nome: "Apólice de Seguro", icone: "📑", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Apólice Divina"
    },
    {
        id: "caso_6",
        titulo: "Contrabando de Defensivos",
        descricao: "A fiscalização ambiental multou a fazenda por uso de agrotóxico proibido. O gerente alega que comprou o produto na loja oficial da cidade.",
        testemunha: { nome: "Gerente da Fazenda", icone: "👷‍♂️", depoimento: "Eu juro por Deus! Eu fui na cooperativa oficial, pedi o fungicida liberado pela Anvisa e o balconista me entregou esse galão fechado. A culpa é deles!" },
        provas: [
            { id: "p1", nome: "Galão Vazio", icone: "🛢️", tipo: "Falsa" },
            { id: "p2", nome: "Nota Fiscal Fria", icone: "🧾", tipo: "Falsa" },
            { id: "p3", nome: "Lote da Alfândega", icone: "🚢", tipo: "Verdadeira", razao: "Silêncio! O rastreio do Lote da Alfândega prova que esse número de série entrou ilegalmente pela fronteira na sua caminhonete particular, e não pela loja!" },
            { id: "p4", nome: "Laudo Agronômico", icone: "🔬", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Alvará Supremo"
    },
    {
        id: "caso_7",
        titulo: "pH Manipulado",
        descricao: "A produtividade caiu 30%. O analista do laboratório afirma que o solo estava extremamente ácido porque a aplicação de calcário foi ignorada.",
        testemunha: { nome: "Analista de Laboratório", icone: "🥼", depoimento: "Os números não mentem! A análise físico-química da terra mostrou um pH 4.2. A fazenda economizou na calagem esse ano e destruiu o próprio solo!" },
        provas: [
            { id: "p1", nome: "Saco de Calcário", icone: "🪨", tipo: "Falsa" },
            { id: "p2", nome: "Log do Trator Autônomo", icone: "🚜", tipo: "Verdadeira", razao: "Mentira deslavada! O Log do Trator GPS prova que espalhamos exatas 3 toneladas de calcário por hectare no mês passado. Foi você quem trocou as amostras no laboratório!" },
            { id: "p3", nome: "Medidor de pH Manual", icone: "🧪", tipo: "Falsa" },
            { id: "p4", nome: "Contrato de Prestação", icone: "📝", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Terra Fértil"
    },
    {
        id: "caso_8",
        titulo: "O Falso Embargo do IBAMA",
        descricao: "Um oficial do IBAMA embargou a colheita, alegando que as máquinas estão avançando sobre a Área de Preservação Permanente (APP) do rio.",
        testemunha: { nome: "Oficial Corrupto", icone: "👮‍♂️", depoimento: "Eu medi com a trena! A lei exige 30 metros de margem preservada em volta do rio. O plantio de vocês está a apenas 15 metros da água. A fazenda está embargada!" },
        provas: [
            { id: "p1", nome: "Trena a Laser", icone: "📏", tipo: "Falsa" },
            { id: "p2", nome: "Foto de Satélite", icone: "🛰️", tipo: "Falsa" },
            { id: "p3", nome: "C.A.R.", icone: "📜", tipo: "Verdadeira", razao: "Objeção! O Cadastro Ambiental Rural (CAR) homologado há 5 anos prova que aquele curso d'água é intermitente e de largura mínima, exigindo apenas 15 metros de APP por lei. O plantio está 100% legal!" },
            { id: "p4", nome: "Amostra de Água", icone: "💧", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Imunidade Fiscal"
    },
    {
        id: "caso_9",
        titulo: "Drone Hackeado",
        descricao: "O drone pulverizador caiu no meio do milharal. O piloto terceirizado diz que a bateria acabou subitamente por falha de fábrica.",
        testemunha: { nome: "Piloto Terceirizado", icone: "🎮", depoimento: "Eu estava controlando o equipamento perfeitamente. Do nada, o aviso de bateria piscou vermelho e os rotores pararam. É defeito da fabricante do drone!" },
        provas: [
            { id: "p1", nome: "Bateria Torrada", icone: "🔋", tipo: "Falsa" },
            { id: "p2", nome: "Caixa Preta do Drone", icone: "📟", tipo: "Verdadeira", razao: "Isso é uma farsa! A Caixa Preta registrou que o drone estava com 80% de carga. O que houve foi um comando manual forçado de desligamento de rotores enviado pelo seu controle remoto!" },
            { id: "p3", nome: "Manual da DJI", icone: "📖", tipo: "Falsa" },
            { id: "p4", nome: "Pé de Milho Esmagado", icone: "🌽", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Satélite Seguro"
    },
    {
        id: "caso_10",
        titulo: "A Queimada Criminosa",
        descricao: "O pasto do vizinho pegou fogo e as chamas pularam a cerca. Ele acusa um funcionário da sua fazenda de ter jogado uma bituca de cigarro.",
        testemunha: { nome: "Vizinho Mal-Intencionado", icone: "😠", depoimento: "Eu vi a fumaça subindo da divisa da cerca! O capataz da sua fazenda sempre fuma ali perto da porteira. Ele jogou o cigarro e queimou minhas terras!" },
        provas: [
            { id: "p1", nome: "Maço de Cigarros", icone: "🚬", tipo: "Falsa" },
            { id: "p2", nome: "Direção dos Ventos", icone: "🌬️", tipo: "Verdadeira", razao: "Objeção! O laudo da rosa dos ventos do Simepar prova que ontem o vento estava soprando para o Sul. Se o fogo começasse do nosso lado, ele jamais teria pulado para a sua fazenda ao Norte. O fogo começou nas suas terras!" },
            { id: "p3", nome: "Extintor Vazio", icone: "🧯", tipo: "Falsa" },
            { id: "p4", nome: "Cinzas do Pasto", icone: "🔥", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Barreira de Vento"
    },
    {
        id: "caso_11",
        titulo: "A Balança Viciada",
        descricao: "O Silo comprador diz que o caminhão da fazenda entregou apenas 25 toneladas de soja, mas a nota faturada marcava 30 toneladas.",
        testemunha: { nome: "Operador da Balança", icone: "⚖️", depoimento: "A balança foi aferida pelo Inmetro na semana passada! O caminhão pesou exatas 25 toneladas líquidas. Vocês tentaram enviar uma nota superfaturada para roubar o Silo!" },
        provas: [
            { id: "p1", nome: "Selo do Inmetro", icone: "🏷️", tipo: "Falsa" },
            { id: "p2", nome: "Ticket de Pedágio", icone: "🎟️", tipo: "Verdadeira", razao: "Isso é ridículo! O Ticket da Balança do Pedágio da rodovia, emitido meia hora antes do caminhão chegar no seu Silo, registra o peso bruto de 45 toneladas, comprovando as 30t de carga líquida. Sua balança está fraudada por software!" },
            { id: "p3", nome: "Chassi do Caminhão", icone: "🚛", tipo: "Falsa" },
            { id: "p4", nome: "Amostra de Soja", icone: "🌾", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Auditoria de Ouro"
    },
    {
        id: "caso_12",
        titulo: "Adubo Batizado",
        descricao: "As plantas estão com folhas amareladas por falta de Nitrogênio. O fornecedor garante que a fórmula NPK entregue estava correta.",
        testemunha: { nome: "Fornecedor de Fertilizante", icone: "🧪", depoimento: "Minha fábrica é impecável! O adubo NPK (Nitrogênio, Fósforo e Potássio) que enviei tinha os 20% de nitrogênio exigidos no contrato. A falha está no solo de vocês que não absorveu!" },
        provas: [
            { id: "p1", nome: "Nota de Empenho", icone: "📄", tipo: "Falsa" },
            { id: "p2", nome: "Folha Amarela", icone: "🍂", tipo: "Falsa" },
            { id: "p3", nome: "Câmera de Segurança", icone: "📹", tipo: "Falsa" },
            { id: "p4", nome: "Análise Foliar", icone: "🔬", tipo: "Verdadeira", razao: "Objeção! A Análise Foliar e de Grânulos feita por perito independente detectou que os sacos continham apenas 5% de Nitrogênio e 90% de areia triturada. É estelionato puro!" }
        ],
        recompensa: "Precedente: Fórmula Secreta"
    },
    {
        id: "caso_13",
        titulo: "O Poço Seco",
        descricao: "O poço artesiano que irriga o Jardim secou. O fiscal de recursos hídricos acusa a fazenda de estar bombeando acima do limite da outorga.",
        testemunha: { nome: "Fiscal de Recursos Hídricos", icone: "📋", depoimento: "Os medidores de vazão apontam que vocês excederam a cota mensal de água em 200%. Vocês secaram o lençol freático sozinhos e serão punidos sob a lei ambiental!" },
        provas: [
            { id: "p1", nome: "Bomba Queimada", icone: "⚙️", tipo: "Falsa" },
            { id: "p2", nome: "Licença de Outorga", icone: "📜", tipo: "Falsa" },
            { id: "p3", nome: "Hidrômetro Inviolável", icone: "⏱️", tipo: "Verdadeira", razao: "Falso! O Hidrômetro Inviolável da própria bomba prova que usamos 30% a menos da nossa cota. O verdadeiro culpado é o grande empreendimento industrial recém-inaugurado a 2km daqui que perfurou um poço mais profundo!" },
            { id: "p4", nome: "Terra Rachada", icone: "🏜️", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Nascente Infinita"
    },
    {
        id: "caso_14",
        titulo: "Contrato Rasgado",
        descricao: "Uma grande trading chinesa cancelou a compra do café na última hora, alegando que o grão possuía 'defeito de bebida' (gosto ruim).",
        testemunha: { nome: "Auditor Internacional", icone: "🇨🇳", depoimento: "Realizamos a prova de xícara. O lote 45 apresentou sabor adstringente e rio-zona, quebrando as cláusulas de qualidade do contrato tipo exportação. O distrato é imediato." },
        provas: [
            { id: "p1", nome: "Termo de Exportação", icone: "📑", tipo: "Falsa" },
            { id: "p2", nome: "Laudo Oficial do Q-Grader", icone: "☕", tipo: "Verdadeira", razao: "Objeção! O Laudo Oficial com assinatura do Q-Grader independente classificou o lote 45 com impressionantes 85 pontos de bebida mole estritamente fina! A quebra do contrato foi motivada por especulação cambial, e não por qualidade!" },
            { id: "p3", nome: "Saca de Café", icone: "👝", tipo: "Falsa" },
            { id: "p4", nome: "Xícara Quebrada", icone: "🍵", tipo: "Falsa" }
        ],
        recompensa: "Precedente: Mercado Blindado"
    },
    {
        id: "caso_15",
        titulo: "O Falso Agrônomo",
        descricao: "Um consultor cobrou R$50.000 por uma receita milagrosa contra nematóides, mas a praga destruiu a raiz das plantas. Ele culpa a chuva.",
        testemunha: { nome: "Consultor Charlatão", icone: "😎", depoimento: "O meu produto biológico é revolucionário e aprovado no exterior! A culpa foi dessa chuva fora de época que lavou o produto da terra antes dele agir nas raízes." },
        provas: [
            { id: "p1", nome: "Comprovante Pix", icone: "💸", tipo: "Falsa" },
            { id: "p2", nome: "Frasco do 'Remédio'", icone: "🧪", tipo: "Falsa" },
            { id: "p3", nome: "Raiz Destruída", icone: "🪴", tipo: "Falsa" },
            { id: "p4", nome: "Consulta no CREA", icone: "🆔", tipo: "Verdadeira", razao: "Pare imediatamente! A consulta no Conselho Regional (CREA) revela que você teve seu registro cassado há 3 anos por estelionato! O produto milagroso é apenas água com corante. Você está preso!" }
        ],
        recompensa: "Precedente: Conselho Superior"
    },
    { id: "caso_16", titulo: "O Incêndio do Silo", descricao: "O seguro afirma que a combustão foi espontânea por falha do secador.", testemunha: { nome: "Perito do Seguro", icone: "🔥", depoimento: "Fogo acidental, temperatura alta nos grãos. Nada a ser pago." }, provas: [ { id: "p1", nome: "Fio Desencapado", icone: "🔌", tipo: "Verdadeira", razao: "Falso! Achamos o fio desencapado por um alicate no quadro de força!" }, { id: "p2", nome: "Grão Tostado", icone: "⚫", tipo: "Falsa" }, { id: "p3", nome: "Termostato", icone: "🌡️", tipo: "Falsa" }, { id: "p4", nome: "Contrato", icone: "📄", tipo: "Falsa" } ], recompensa: "Precedente: Secador Quântico" },
    { id: "caso_17", titulo: "Ferrugem Oculta", descricao: "A carga foi rejeitada no porto por contaminação por fungo.", testemunha: { nome: "Fiscal do Porto", icone: "⛴️", depoimento: "Tem fungo nos grãos. Navio cancelado." }, provas: [ { id: "p1", nome: "Recibo do Frete", icone: "🧾", tipo: "Falsa" }, { id: "p2", nome: "Amostra do Porão", icone: "📦", tipo: "Verdadeira", razao: "Mentira! O fungo está no porão do navio chinês, não no nosso grão que saiu limpo da carreta!" }, { id: "p3", nome: "Lupa", icone: "🔍", tipo: "Falsa" }, { id: "p4", nome: "Folha Suja", icone: "🍂", tipo: "Falsa" } ], recompensa: "Precedente: Grão de Platina" },
    { id: "caso_18", titulo: "O Grileiro Noturno", descricao: "Um invasor mudou a cerca de madrugada e registrou a terra como dele.", testemunha: { nome: "Grileiro Suspeito", icone: "🏴‍☠️", depoimento: "Essa terra é herança do meu tataravô, a cerca sempre esteve aí!" }, provas: [ { id: "p1", nome: "Escritura Falsa", icone: "📜", tipo: "Falsa" }, { id: "p2", nome: "Cerca Nova", icone: "🚧", tipo: "Falsa" }, { id: "p3", nome: "Imagem de Satélite", icone: "🛰️", tipo: "Verdadeira", razao: "Objeção! A imagem do satélite de ontem mostra que a cerca não estava lá. Você mudou os marcos à noite!" }, { id: "p4", nome: "Enxada Velha", icone: "⛏️", tipo: "Falsa" } ], recompensa: "Precedente: Fronteira Blindada" },
    { id: "caso_19", titulo: "Veneno na Nascente", descricao: "Peixes morreram no rio. A prefeitura culpa o seu agrotóxico.", testemunha: { nome: "Fiscal da Prefeitura", icone: "🐟", depoimento: "O veneno escorreu da sua lavoura com a chuva." }, provas: [ { id: "p1", nome: "Nota de Defensivo", icone: "🧾", tipo: "Falsa" }, { id: "p2", nome: "Curva de Nível", icone: "〰️", tipo: "Verdadeira", razao: "Falso! Nossa fazenda possui curvas de nível perfeitas. A água não escorre pro rio. A contaminação veio da indústria acima!" }, { id: "p3", nome: "Peixe Morto", icone: "💀", tipo: "Falsa" }, { id: "p4", nome: "Água Turva", icone: "💧", tipo: "Falsa" } ], recompensa: "Precedente: Nascente Sagrada" },
    { id: "caso_20", titulo: "Contrabando de Adubo", descricao: "Sacos de fertilizante sumiram do estoque.", testemunha: { nome: "Motorista", icone: "🚛", depoimento: "A carga caiu na estrada de terra devido aos buracos." }, provas: [ { id: "p1", nome: "Saco Estourado", icone: "🎒", tipo: "Falsa" }, { id: "p2", nome: "Câmera do Posto", icone: "📹", tipo: "Verdadeira", razao: "Mentira! A câmera do posto mostra o caminhão parando para descarregar metade da carga num galpão clandestino!" }, { id: "p3", nome: "Pneu Furado", icone: "🛞", tipo: "Falsa" }, { id: "p4", nome: "Log de GPS", icone: "📡", tipo: "Falsa" } ], recompensa: "Precedente: Estoque Mágico" },
    { id: "caso_21", titulo: "O Leite Batizado", descricao: "Laticínio rejeita o lote de leite acusando excesso de água.", testemunha: { nome: "Laticínio", icone: "🥛", depoimento: "O leite tem 20% de água. Vocês estão tentando nos enganar." }, provas: [ { id: "p1", nome: "Balde d'água", icone: "🪣", tipo: "Falsa" }, { id: "p2", nome: "Lacre de Segurança", icone: "🔒", tipo: "Verdadeira", razao: "Objeção! O caminhão saiu com Lacre Eletrônico inviolado. Se tem água, foi o motorista terceirizado que quebrou a torneira no trajeto!" }, { id: "p3", nome: "Vaca Doente", icone: "🐄", tipo: "Falsa" }, { id: "p4", nome: "Teste Frio", icone: "🧊", tipo: "Falsa" } ], recompensa: "Precedente: Leite de Ouro" },
    { id: "caso_22", titulo: "Vento Venenoso", descricao: "A lavoura orgânica murchou. O vizinho alega que usou drone no limite dele.", testemunha: { nome: "Piloto do Vizinho", icone: "🛸", depoimento: "Usei o drone só dentro da cerca. O vento que levou uma poeirinha pra vocês." }, provas: [ { id: "p1", nome: "Folha Murcha", icone: "🥀", tipo: "Falsa" }, { id: "p2", nome: "Lei dos 500m", icone: "⚖️", tipo: "Verdadeira", razao: "Falso! A lei aeronáutica agrícola proíbe voos de drones com defensivos a menos de 500 metros de produções orgânicas vizinhas. Você ignorou o distanciamento legal!" }, { id: "p3", nome: "Rosa dos Ventos", icone: "🧭", tipo: "Falsa" }, { id: "p4", nome: "Controle Quebrado", icone: "🎮", tipo: "Falsa" } ], recompensa: "Precedente: Campo de Força Orgânico" },
    { id: "caso_23", titulo: "A Fraude do IPVA", descricao: "Multa de IPVA na colheitadeira. O Detran diz que o trator circulou na rodovia.", testemunha: { nome: "Agente de Trânsito", icone: "🚔", depoimento: "A máquina foi vista andando na pista da BR a 30km/h. A multa procede." }, provas: [ { id: "p1", nome: "Foto Tremida", icone: "📸", tipo: "Falsa" }, { id: "p2", nome: "Nota de Guindaste", icone: "🏗️", tipo: "Verdadeira", razao: "Objeção! A colheitadeira atravessou a rodovia sobre um guindaste prancha devidamente documentado e pago. A máquina não tocou o asfalto!" }, { id: "p3", nome: "Pneu Sujo", icone: "🛞", tipo: "Falsa" }, { id: "p4", nome: "Marca de Asfalto", icone: "🛣️", tipo: "Falsa" } ], recompensa: "Precedente: Passe Livre" },
    { id: "caso_24", titulo: "Calote no Armazém", descricao: "Silo vizinho decreta falência e prende nossa soja.", testemunha: { nome: "Dono do Silo", icone: "🏭", depoimento: "Sinto muito, a empresa quebrou. A soja no silo agora pertence aos credores do banco." }, provas: [ { id: "p1", nome: "Cadeado", icone: "🔒", tipo: "Falsa" }, { id: "p2", nome: "Decisão do Juiz", icone: "👨‍⚖️", tipo: "Verdadeira", razao: "Objeção! Nossa soja está apenas em regime de 'depósito'. Por lei, bens em depósito não entram na massa falida. Abram os portões agora!" }, { id: "p3", nome: "Contrato de Venda", icone: "📝", tipo: "Falsa" }, { id: "p4", nome: "Chaves do Portão", icone: "🗝️", tipo: "Falsa" } ], recompensa: "Precedente: Cofre Intocável" },
    { id: "caso_25", titulo: "Sementes Clonadas", descricao: "Polícia bate na porta alegando que compramos sementes piratas.", testemunha: { nome: "Inspetor de Patentes", icone: "👮‍♂️", depoimento: "Os testes de DNA comprovam: a soja de vocês é cópia pirata de marca registrada. A lavoura será destruída." }, provas: [ { id: "p1", nome: "Teste de DNA", icone: "🧬", tipo: "Falsa" }, { id: "p2", nome: "Nota de Origem", icone: "🧾", tipo: "Verdadeira", razao: "Falso! A Nota Fiscal comprova que pagamos os royalties legais. Se a carga é clonada, o fraudador é o revendedor homologado por vocês!" }, { id: "p3", nome: "Saco Sem Rótulo", icone: "🛍️", tipo: "Falsa" }, { id: "p4", nome: "Denúncia", icone: "📞", tipo: "Falsa" } ], recompensa: "Precedente: Patente Genética" }
];

window.estadoPericia = {
    casoAtivo: null,
    provaSelecionada: null,
    historicoVitorias: [],
    credibilidade: 3
};

window.inicializarPericia = function() {
        if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI(); // 🚨 PUXA O SALDO
        
        console.log("Abrindo Arquivos da Perícia do Afeto...");
    window.estadoPericia.provaSelecionada = null;
    
    const historico = JSON.parse(localStorage.getItem('santuario_pericia_vitorias') || '[]');
    window.estadoPericia.historicoVitorias = historico;

    document.getElementById('pericia-precedentes-hud').innerText = historico.length;
    
    window.renderizarListaCasos();
    
    const telaCasos = document.getElementById('pericia-tela-casos');
    const telaTribunal = document.getElementById('pericia-tela-tribunal');
    
    if (telaCasos) telaCasos.classList.remove('escondido');
    if (telaTribunal) telaTribunal.classList.add('escondido');
};

window.toggleInstrucoesPericia = function() {
    const inst = document.getElementById('instrucoes-pericia');
    if (inst) inst.classList.toggle('escondido');
};

window.renderizarListaCasos = function() {
    const lista = document.getElementById('pericia-lista-casos');
    if (!lista) return;
    lista.innerHTML = '';

    window.bancoDeCasos.forEach(caso => {
        const resolvido = window.estadoPericia.historicoVitorias.includes(caso.id);
        
        const cartao = document.createElement('div');
        cartao.className = `cartao-caso-investigacao ${resolvido ? 'concluido' : ''}`;
        cartao.onclick = () => {
            if (!resolvido) {
                if(window.Haptics) window.Haptics.toqueLeve();
                window.abrirCasoTribunal(caso.id);
            } else {
                if(typeof mostrarToast === 'function') mostrarToast("Caso já encerrado e transitado em julgado.", "⚖️");
            }
        };

        cartao.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                <h4 style="color: #fff; font-family: 'Playfair Display', serif; font-size: 1.2rem; margin: 0;">${caso.titulo}</h4>
                <span style="font-size: 1.5rem;">${resolvido ? '✅' : '📁'}</span>
            </div>
            <p style="font-size: 0.85rem; color: #aaa; margin-bottom: 10px; line-height: 1.4;">${caso.descricao}</p>
            <div style="font-size: 0.7rem; color: #2ecc71; text-transform: uppercase; font-weight: bold; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 10px;">
                Recompensa: ${caso.recompensa}
            </div>
        `;
        lista.appendChild(cartao);
    });
};

window.atualizarHUDCredibilidade = function() {
    const hud = document.getElementById('pericia-credibilidade-hud');
    if (!hud) return;
    
    let balancas = '';
    for(let i=0; i<3; i++) {
        if (i < window.estadoPericia.credibilidade) {
            balancas += '<span style="color: #FFD700; filter: drop-shadow(0 0 5px rgba(212,175,55,0.8)); transition: all 0.5s;">⚖️</span>';
        } else {
            balancas += '<span style="color: #333; filter: grayscale(1); opacity: 0.5; transition: all 0.5s;">⚖️</span>';
        }
    }
    hud.innerHTML = balancas;
};

window.abrirCasoTribunal = function(idCaso) {
    const caso = window.bancoDeCasos.find(c => c.id === idCaso);
    if (!caso) return;

    window.estadoPericia.casoAtivo = caso;
    window.estadoPericia.provaSelecionada = null;
    window.estadoPericia.credibilidade = 3; 
    window.atualizarHUDCredibilidade();

    const telaCasos = document.getElementById('pericia-tela-casos');
    const telaTribunal = document.getElementById('pericia-tela-tribunal');
    
    if (telaCasos) telaCasos.classList.add('escondido');
    if (telaTribunal) telaTribunal.classList.remove('escondido');

    const iconeTestemunha = document.getElementById('pericia-icone-testemunha');
    if (iconeTestemunha) {
        iconeTestemunha.innerText = caso.testemunha.icone;
        iconeTestemunha.style.animation = 'none'; // Reseta o CSS em linha
        // Força o reflow do navegador para garantir que a animação suma
        void iconeTestemunha.offsetWidth; 
    }
    
    const nomeTestemunha = document.getElementById('pericia-nome-testemunha');
    if (nomeTestemunha) nomeTestemunha.innerText = caso.testemunha.nome;
    
    const elDepoimento = document.getElementById('pericia-texto-depoimento');
    if (elDepoimento) elDepoimento.textContent = ""; 
    
    let i = 0;
    const txt = caso.testemunha.depoimento;
    let textoAcumulado = ""; 
    
    if (window.intervaloDepoimento) clearInterval(window.intervaloDepoimento);

    window.intervaloDepoimento = setInterval(() => {
        if (i < txt.length) {
            textoAcumulado += txt.charAt(i); 
            if (elDepoimento) elDepoimento.textContent = textoAcumulado; 
            i++;
        } else {
            clearInterval(window.intervaloDepoimento);
        }
    }, 30); 

    const gridProvas = document.getElementById('pericia-inventario-provas');
    if (gridProvas) {
        gridProvas.innerHTML = '';
        const provasEmbaralhadas = [...caso.provas].sort(() => Math.random() - 0.5);

        provasEmbaralhadas.forEach(prova => {
            const btnProva = document.createElement('div');
            btnProva.className = 'prova-pericia-card';
            btnProva.id = `prova-${prova.id}`;
            btnProva.onclick = () => window.selecionarProva(prova.id);
            
            btnProva.innerHTML = `
                <div class="prova-icone">${prova.icone}</div>
                <div class="prova-nome">${prova.nome}</div>
            `;
            gridProvas.appendChild(btnProva);
        });
    }

    const btnObjecao = document.getElementById('btn-disparar-objecao');
    if (btnObjecao) btnObjecao.classList.add('desativado');
};

window.selecionarProva = function(idProva) {
    window.estadoPericia.provaSelecionada = idProva;
    
    document.querySelectorAll('.prova-pericia-card').forEach(el => el.classList.remove('selecionada'));
    const cardAtivo = document.getElementById(`prova-${idProva}`);
    if (cardAtivo) cardAtivo.classList.add('selecionada');
    
    const btnObjecao = document.getElementById('btn-disparar-objecao');
    if (btnObjecao) btnObjecao.classList.remove('desativado');

    if(window.Haptics) window.Haptics.toqueLeve();
};

window.dispararObjecao = function() {
    const caso = window.estadoPericia.casoAtivo;
    const idProvaEscolhida = window.estadoPericia.provaSelecionada;
    
    if (!caso || !idProvaEscolhida) return;

    const prova = caso.provas.find(p => p.id === idProvaEscolhida);
    const containerTribunal = document.getElementById('container-pericia');
    const flashObjecao = document.getElementById('flash-objecao');

    if (window.Haptics) navigator.vibrate([100, 50, 400]); 
    if (typeof pauseAudioJogos === 'function') pauseAudioJogos(); 

    if (flashObjecao) flashObjecao.classList.remove('escondido');
    if (containerTribunal) containerTribunal.classList.add('animacao-tremor-tela');

    const marteloGavel = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    marteloGavel.volume = 0.7;
    marteloGavel.play().catch(e => console.log(e));

    setTimeout(() => {
        if (flashObjecao) flashObjecao.classList.add('escondido');
        if (containerTribunal) containerTribunal.classList.remove('animacao-tremor-tela');
        
        if (typeof playAudioJogos === 'function') playAudioJogos(); 

        const elDepoimento = document.getElementById('pericia-texto-depoimento');
        const iconeTestemunha = document.getElementById('pericia-icone-testemunha');
        const btnObjecao = document.getElementById('btn-disparar-objecao');

        if (prova.tipo === "Verdadeira") {
            // VITÓRIA
            if(window.Haptics) navigator.vibrate([50, 100, 50, 100, 300]);
            if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#FFD700', '#ffffff'], particleCount: 150, spread: 100, zIndex: 999999});
            
            if (elDepoimento) elDepoimento.innerHTML = `<span style="color: #2ecc71; font-weight: 900; font-size: 1.3rem;">A MENTIRA CAIU!</span><br><br><span style="color: #fff;">${prova.razao}</span>`;
            if (iconeTestemunha) {
                iconeTestemunha.innerText = "😰"; 
                iconeTestemunha.style.animation = "tremorTela 0.2s infinite";
            }

            // 🚨 INFLAÇÃO DO BEM: +500 Moedas em Honorários Periciais!
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(500, "Honorários Periciais (Caso Solucionado)");

            window.estadoPericia.historicoVitorias.push(caso.id);
            localStorage.setItem('santuario_pericia_vitorias', JSON.stringify(window.estadoPericia.historicoVitorias));
            
            if (btnObjecao) btnObjecao.classList.add('desativado');

            setTimeout(() => {
                if(typeof mostrarToast === 'function') mostrarToast("Caso Encerrado. +500💰 na conta!", "⚖️"); // 🚨 ATUALIZADO
                window.inicializarPericia();
            }, 6000);

        } else {
            // ERROU E PERDEU CREDIBILIDADE
            window.estadoPericia.credibilidade--;
            window.atualizarHUDCredibilidade();
            
            if(window.Haptics) window.Haptics.erro();
            
            if (window.estadoPericia.credibilidade <= 0) {
                // GAME OVER
                if (elDepoimento) elDepoimento.innerHTML = `<span style="color: #e74c3c; font-weight: 900; font-size: 1.3rem;">DESACATO À CORTE!</span><br><br><span style="color: #fff;">"Você perdeu toda a sua credibilidade, Doutor! Provas forjadas e amadorismo. O Juiz encerrou a sessão. Suma daqui!"</span>`;
                if (iconeTestemunha) {
                    iconeTestemunha.innerText = "😤"; 
                    iconeTestemunha.style.animation = 'none';
                }
                if (btnObjecao) btnObjecao.classList.add('desativado');
                
                setTimeout(() => {
                    if(typeof mostrarToast === 'function') mostrarToast("Expulso do Tribunal por falta de provas sólidas.", "❌");
                    window.inicializarPericia(); 
                }, 5000);

            } else {
                // APENAS UM ERRO
                if (elDepoimento) elDepoimento.innerHTML = `<span style="color: #e74c3c; font-weight: bold;">Evidência Irrelevante!</span><br><br>"Isso não prova nada, Doutor! Você está blefando! Se o senhor insistir nisso, serei obrigado a pedir punição por desacato."`;
                if (iconeTestemunha) {
                    iconeTestemunha.innerText = "😏"; 
                    iconeTestemunha.style.animation = 'none';
                }

                document.querySelectorAll('.prova-pericia-card').forEach(el => el.classList.remove('selecionada'));
                if (btnObjecao) btnObjecao.classList.add('desativado');
                window.estadoPericia.provaSelecionada = null;
            }
        }
    }, 1200); 
};