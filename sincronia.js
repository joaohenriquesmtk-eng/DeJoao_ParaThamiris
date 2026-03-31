// ============================================================================
// JOGO 3: SINCRONIA QUÂNTICA (INVESTIGAÇÃO EM TEMPO REAL)
// ============================================================================

// 1. O BANCO DE DADOS DE INVESTIGAÇÃO (Com suas perguntas perfeitas!)
const bancoPerguntasSincronia = [
    // --- AS SUAS PERGUNTAS ORIGINAIS FORAM MANTIDAS E MELHORADAS ---
    "Responda com uma palavra: qual foi o sentimento do nosso primeiro 'Oi'?",
    "Qual cômodo da nossa futura casa será o mais usado?",
    "Em qual cidade daremos nosso primeiro abraço sem distância (Goiânia ou Colombo)?",
    "Responda com um adjetivo: o que define o nosso amor?",
    "Se o nosso futuro fosse um verbo, qual seria?",
    "Quem é o mais organizado de nós dois (João ou Thamiris)?",
    "Se fôssemos viajar amanhã, iríamos para a Praia ou para a Serra?",
    "Qual é o apelido mais carinhoso que usamos um com o outro?",
    "Quem é mais provável de dormir no meio do filme (João ou Thamiris)?",
    "Se o nosso relacionamento tivesse uma cor, qual seria?",
    "Qual cheiro mais lembra o nosso amor: Café ou Perfume?",
    "Qual é a sua estação do ano favorita para ficarmos abraçados?",
    "Se fôssemos adotar um pet hoje, seria um Gato ou um Cachorro?",
    "Qual será o nosso ritmo musical oficial quando estivermos juntos?",
    "Se pudéssemos ter um superpoder agora, seria Voar ou Teletransporte?",
    "Quem manda a primeira mensagem de 'bom dia' na maioria das vezes?",
    "Qual é a nossa comida oficial de final de semana (Pizza, Hambúrguer, Sushi, Jantar...)?",
    "Qual doce não pode faltar na nossa despensa?",
    "Sinceridade no tribunal: Quem é mais ciumento (João ou Thamiris)?",
    "Quem é mais provável de esquecer uma data importante?",
    "Na balança do tribunal, quem tem a razão na maioria das discussões bobas?",
    "Se o nosso amor fosse uma fruta, qual seria?",
    "Qual é a cláusula inegociável do nosso amor (Fidelidade, Respeito, Carinho...)?",
    "Qual é a bebida que sempre acompanhará nossas conversas profundas?",
    "Domingo perfeito: Série no sofá ou Passeio ao ar livre?",
    "Em um jogo do Mengão, a gente comemora com Cerveja ou Refrigerante?",
    "Na hora de decidir o roteiro, vence o Agrônomo ou a Advogada?",
    "Para qual país da Europa faríamos nossa viagem dos sonhos?",
    "Responda com uma palavra: qual o ingrediente principal para cultivar um namoro a distância?",
    "Quando a saudade aperta, qual é o melhor remédio: Ligação ou Mensagem?",
    "Quem é mais provável de chorar assistindo a um filme romântico?",
    "Na hora de pedir comida no iFood, quem demora mais para escolher?",
    "Se fôssemos uma dupla dinâmica de super-heróis, quem seria o cérebro da operação?",
    "Qual palavra define o momento exato em que a distância física acabar?",
    "Onde será nosso refúgio de férias definitivas: Praia ou Campo?",
    "Quem de nós dois é mais desastrado e deixa as coisas caírem?",
    "Quem é mais provável de começar a rir em um momento sério?",
    "Qual animal da Mini Fazenda mais combina com a nossa vibe calma (Cavalo, Ovelha, Vaca)?",
    "Quem toma a iniciativa para resolver um desentendimento (João ou Thamiris)?",
    "Qual gênero de filme é o nosso favorito: Comédia, Terror ou Ação?",
    "O que é mais difícil suportar: A distância ou A saudade?",
    "Quem é mais provável de gastar dinheiro comprando bobagem online?",
    "Em uma palavra, o que o silêncio confortável entre nós dois significa?",
    "Quem será o copiloto oficial nas nossas futuras viagens de carro?",
    "Quem fala mais durante uma ligação de vídeo?",
    "Qual seria a sobremesa perfeita do nosso futuro jantar de noivado?",
    "Falando a verdade: quem tem o melhor gosto musical (João ou Thamiris)?",
    "O que não pode faltar no carro numa viagem longa (Música, Lanche, Água)?",
    "Quem é o mais dorminhoco num domingo de manhã?",
    "Qual flor você plantaria no nosso jardim (Rosa, Girassol, Orquídea...)?",
    "Sinceridade: Quem é o mais teimoso da relação?",
    "Qual palavra resume a primeira impressão que tivemos um do outro?",
    "Quem se arruma mais rápido para sair (João ou Thamiris)?",
    "O amor à distância exige muita: Paciência ou Coragem?",
    "Quem manda os áudios mais longos (tipo podcast) no WhatsApp?",
    "Na hora de dividir a sobremesa, quem acabará comendo a maior parte?",
    "Qual matéria é mais complexa: Cálculos de Engenharia ou Leis do Vade Mecum?",
    "Qual é a rede social que mais usamos para trocar vídeos e memes (Insta, WhatsApp)?",
    "Se formos a um parque de diversões, a primeira atração é: Montanha Russa ou Roda Gigante?",
    "Qual será a nossa primeira refeição juntos no dia em que a distância finalmente acabar?",
    "Se o nosso amor fosse um verbo no infinitivo, qual seria?",
    "Qual vai ser a primeira coisa que faremos no dia 29 de outubro de 2026?",

    // --- MÓDULO 1: INTIMIDADE, FUTURO E PERSONALIDADE (CRIADAS PELA IA) ---
    "Responda com 1 palavra: O que o seu coração sente quando ouve a minha voz?",
    "Se o nosso casamento tivesse um estilo, seria Clássico ou Moderno?",
    "Quem é o mais provável de adotar um animal de rua escondido (João ou Thamiris)?",
    "Qual é a matéria-prima do nosso amor: Confiança ou Cuidado?",
    "Se fôssemos construir algo juntos agora, seria um Prédio ou uma Lei?",
    "Quem sente mais frio durante a noite (João ou Thamiris)?",
    "Qual clima define a nossa paixão: Tempestade ou Brisa?",
    "Na nossa futura sala de estar, a TV será Grande ou Enorme?",
    "Quem é mais provável de queimar o arroz no primeiro mês morando juntos?",
    "Uma palavra para descrever o abraço que ainda vamos dar:",
    "Você prefere me dar um Beijo ou um Cheiro no pescoço?",
    "Quem de nós tem o raciocínio mais rápido em uma emergência?",
    "No trânsito, quem é mais provável de xingar os outros motoristas?",
    "Se nossa vida fosse uma série da Netflix, seria Romance ou Suspense?",
    "Quem de nós é mais consumido pelo ciúme bobo (João ou Thamiris)?",
    "Qual adjetivo define a sua força para aguentar a distância?",
    "Uma palavra que resume o frio de Colombo:",
    "Uma palavra que resume o calor de Goiânia:",
    "Na disputa do café da manhã, vencem as Panquecas ou o Pão de Queijo?",
    "Quem é o primeiro a ceder depois de uma 'biquinho' de birra?",
    "Se fôssemos fugir de tudo hoje, pegaríamos um Avião ou um Carro?",
    "Responda com 1 palavra: Como você descreveria o meu olhar?",
    "No nosso jardim futuro, qual árvore não pode faltar?",
    "Quem é o maior arquiteto de planos malucos (João ou Thamiris)?",
    "Em um dia triste, qual o melhor refúgio: Cama ou Chuveiro?",
    "Quem é mais chato quando está com fome (João ou Thamiris)?",
    "Responda com 1 palavra: O que o tempo longe me ensinou sobre você?",
    "Onde colocaríamos nossa primeira foto oficial juntos: Parede ou Mesa?",
    "Quem de nós dois é mais detalhista com a arrumação da casa?",
    "Qual sabor de sorvete é a cara do nosso relacionamento (Morango, Chocolate, Baunilha)?",
    "No tribunal da nossa relação, qual é a pena máxima para roubar um beijo? (Prisão ou Reincidência)",
    "Quem acorda mais bem-humorado (João ou Thamiris)?",
    "Uma palavra para descrever o momento em que a notificação do celular é minha:",
    "Na nossa despensa, qual salgadinho tem que reinar absoluto?",
    "O nosso primeiro encontro será focado em Conversar ou Beijar?",
    "Quem é mais apegado a objetos sentimentais (cartas, presentes)?",
    "Se você pudesse congelar 1 sentimento nosso, qual palavra usaria?",
    "O que nos salva nas noites de insônia: Voz ou Silêncio?",
    "Na viagem dos sonhos, seremos Exploradores ou Preguiçosos?",
    "Quem é mais propenso a chorar com vídeo de cachorrinho no TikTok?",
    "O nosso amor é fundamentado na Lógica ou na Emoção?",
    "Qual palavra define a certeza de que vamos dar certo?",
    "Quem de nós tem mais mania de limpeza?",
    "Se o amor fosse medido em distância, o nosso seria Infinito ou Absoluto?",
    "Na cozinha da nova casa, o Chef será o João ou a Thamiris?",
    "Qual elemento da Mini Fazenda representa a nossa lealdade (Trator, Semente, Celeiro)?",
    "Quem costuma puxar mais cobertor de madrugada?",
    "Se pudéssemos levar 1 única coisa para a nossa nova casa, seria o Vade Mecum ou a Calculadora?",
    "Qual a temperatura ideal do nosso abraço: Morno ou Fervendo?",
    "Em apenas uma palavra, defina a palavra 'Nós':",
    // --- MÓDULO 2: HÁBITOS, CONVIVÊNCIA E O NOSSO FUTURO (CRIADAS PELA IA) ---
    "Responda com 1 palavra: O que eu mais admiro na sua personalidade?",
    "Se a nossa saudade tivesse um peso, seria medido em Gramas ou Toneladas?",
    "Quem tem mais facilidade para ceder e pedir desculpas depois de uma discussão boba?",
    "Na nossa futura biblioteca, haverá mais livros de Direito ou de Exatas?",
    "Quem é mais provável de adotar uma dieta fitness e pedir pizza na mesma semana?",
    "Qual a temperatura exata do nosso amor: Morno, Quente ou Fervendo?",
    "Responda com 1 palavra: O que você sente quando vê meu nome brilhar na tela do celular?",
    "Quem é mais formiga e não vive sem um doce depois do almoço (João ou Thamiris)?",
    "Quando formos morar juntos, quem vai pular da cama mais cedo no domingo?",
    "Se fôssemos um fenômeno da natureza, seríamos um Terremoto ou um Eclipse?",
    "No nosso futuro sofá, quem vai deitar no colo de quem?",
    "Quem é mais provável de esquecer a toalha e pedir para o outro buscar?",
    "Qual palavra define a paz de saber que temos um ao outro?",
    "Na balança do amor, quem é o mais romântico e meloso?",
    "Quem é mais provável de passar horas escolhendo uma roupa e acabar usando a de sempre?",
    "Uma palavra para o seu sorriso quando me vê por chamada de vídeo:",
    "Quando estivermos juntos, quem será o responsável por fechar a casa e apagar as luzes?",
    "Quem se assusta mais fácil assistindo filme de terror (João ou Thamiris)?",
    "Responda com 1 palavra: Qual a base do nosso projeto de vida?",
    "Se eu fosse um cálculo de engenharia, eu seria Simples ou Complexo?",
    "Se eu fosse um artigo de lei, eu seria Permissivo ou Restritivo?",
    "Quem tem o sono mais pesado e não acorda com nada?",
    "Na nossa futura cozinha, quem vai lavar a louça na maioria das vezes?",
    "Uma palavra que resume a nossa capacidade de superar a distância:",
    "Quem é mais provável de rir em uma situação onde deveria ficar sério?",
    "Quem tem mais chance de se perder usando o GPS (João ou Thamiris)?",
    "Se o nosso amor fosse um animal da minifazenda, seria Forte como um Touro ou Leal como um Cão?",
    "Quem tem mais ciúme de pessoas comentando nas fotos de antigamente?",
    "Qual palavra define a minha voz para você?",
    "Quem demora mais no banho (João ou Thamiris)?",
    "Na estrada, quem vai escolher a playlist da viagem?",
    "Quem é mais provável de trazer um cachorro de rua para dentro da nossa casa?",
    "Se fôssemos uma estação do ano, seríamos o Inverno aconchegante ou o Verão radiante?",
    "Uma palavra para descrever a nossa química:",
    "Quem é o mais organizado com planilhas e contas (João ou Thamiris)?",
    "Quem é mais provável de comprar algo inútil na internet de madrugada?",
    "Se fôssemos um sabor de pizza, qual seríamos?",
    "Qual palavra define o momento em que a ligação de vídeo finalmente conecta?",
    "Quem é mais provável de se emocionar com uma música do nada?",
    "Quando a distância acabar, vamos comemorar com Champanhe ou Cerveja?",
    "Quem de nós dois é mais dramático quando está gripado ou resfriado?",
    "Se o nosso relacionamento fosse um livro, o gênero seria Épico ou Poético?",
    "Uma palavra que descreve o meu toque:",
    "Quem é mais provável de esconder chocolate para comer sozinho depois?",
    "No nosso casamento, quem vai chorar primeiro no altar?",
    "Quem é mais competitivo quando jogamos qualquer coisa?",
    "Qual palavra resume o meu coração desde que você entrou nele?",
    "Quem tem a memória melhor para lembrar de detalhes de conversas antigas?",
    "Na nossa casa, quem vai ter o lado direito da cama?",
    "Quem é mais provável de falar dormindo (João ou Thamiris)?",
    "Se fôssemos uma cor de tinta para a sala da nossa casa, qual seria?",
    "Qual a palavra que melhor define a nossa intimidade?",
    "Quem é mais ansioso para abrir presentes antes da data?",
    "No frio de Colombo, quem vai esquentar o pé gelado em quem?",
    "No calor de Goiânia, quem vai dominar o ventilador ou ar-condicionado?",
    "Quem é mais provável de deixar a toalha molhada em cima da cama?",
    "Uma palavra que descreve o tamanho do nosso destino juntos:",
    "Quem é mais focado e disciplinado nos estudos/trabalho?",
    "Se o nosso amor fosse um instrumento musical, seria Violão ou Piano?",
    "Qual palavra define a nossa cumplicidade no olhar?",
    "Quem é mais provável de dar um conselho sábio em um momento de crise?",
    "Na nossa despensa, qual será o item que nunca pode faltar de jeito nenhum?",
    "Quem é mais vaidoso e se preocupa mais com o cabelo (João ou Thamiris)?",
    "Qual palavra resume a sensação de dormir abraçado com você (mesmo que em pensamento)?",
    "Quem de nós tem a risada mais engraçada e contagiante?",
    "Se fôssemos uma sobremesa, seríamos Doce de Leite ou Brigadeiro?",
    "Quem é mais provável de esquecer onde guardou a chave de casa?",
    "Qual palavra define a energia que você me transmite?",
    "Quem tem o gosto musical mais eclético e aleatório?",
    "Na nossa futura rotina, quem vai preparar o café da manhã?",
    "Quem é mais provável de querer sair no sábado à noite e desistir na última hora?",
    "Uma palavra para o que eu sinto quando ouço você rir:",
    "Quem é mais provável de ter uma ideia brilhante no meio da madrugada?",
    "Quem de nós dois é o mais sonhador?",
    "Quem de nós dois é o mais pé no chão e realista?",
    "Se o nosso amor fosse uma paisagem, seria uma Montanha ou uma Praia deserta?",
    "Qual palavra define a nossa confiança um no outro?",
    "Quem é mais provável de tropeçar no próprio pé caminhando na rua?",
    "Quem é mais fã de fazer maratona de séries no final de semana?",
    "Uma palavra que resume o impacto que você causou na minha vida:",
    "Quem de nós dois é mais tagarela quando está empolgado?",
    "Quem é mais provável de se queimar tentando cozinhar algo novo?",
    "Qual palavra define o nosso alinhamento de valores?",
    "Quem é mais provável de tirar 100 fotos e só gostar de uma?",
    "Se o nosso abraço fosse um abrigo, ele seria de Madeira rústica ou Tijolo seguro?",
    "Quem de nós lida melhor com imprevistos e mudanças de plano?",
    "Qual palavra define a saudade que sinto do seu cheiro?",
    "Quem é mais provável de ficar com ciúmes de um ator/atriz de filme?",
    "Na nossa casa, quem será o encarregado de cuidar das plantas reais?",
    "Quem tem mais facilidade em fazer amizade com estranhos na fila do pão?",
    "Uma palavra que resume o que eu sinto quando me imagino velhinho ao seu lado:",
    "Quem é o melhor em escolher presentes inesquecíveis (João ou Thamiris)?",
    "Quem de nós dois é mais impaciente quando a internet está lenta?",
    "Se o nosso amor fosse uma joia, seria Ouro puro ou Diamante raro?",
    "Qual palavra define a força magnética que nos puxou um para o outro?",
    "Quem é mais provável de dormir durante uma viagem longa de carro?",
    "Quem de nós dois é mais carinhoso em público?",
    "Uma palavra que resume a perfeição do dia 29 de Outubro de 2025:",
    "Quem é a pessoa mais importante da minha vida a partir de agora?",
    // --- MÓDULO 3: ROTINA, CONEXÃO PROFUNDA E O SANTUÁRIO (CRIADAS PELA IA) ---
    "Responda com 1 palavra: O que eu significo nos seus dias mais estressantes?",
    "Entre as leis do Vade Mecum e os cálculos de Engenharia, o que é mais difícil: Entender a matéria ou Aguentar a saudade?",
    "Na nossa futura casa, a cor das paredes da sala será Clara ou Escura?",
    "Quem de nós dois é mais provável de acabar adotando o sotaque do outro?",
    "Se o nosso amor fosse uma fórmula matemática, o resultado seria Infinito ou Exato?",
    "Quem é mais provável de chorar soluçando ao ler os nossos votos de casamento?",
    "Na nossa Mini Fazenda, quem é o mais focado em colher tudo na hora certa?",
    "Qual palavra resume a sensação de vestir um moletom que tem o meu cheiro?",
    "Quem é mais provável de querer comprar todas as decorações de Natal da loja?",
    "Se a nossa história fosse julgada no Tribunal do Afeto, o veredito seria Culpa ou Absolvição?",
    "Quem de nós dois é mais perigoso solto em um supermercado com fome?",
    "Na viagem para nos vermos, quem vai ficar olhando pela janela do avião ansioso(a)?",
    "Qual palavra define a sua paz quando resolvemos um pequeno desentendimento?",
    "Quem é mais provável de queimar a largada e comer a sobremesa antes do almoço?",
    "No nosso futuro lar, quem será o arquiteto da decoração (João ou Thamiris)?",
    "Se o nosso amor fosse uma estação de trem, o destino seria Único ou Múltiplo?",
    "Quem tem mais facilidade para inventar apelidos absurdos e fofos?",
    "Responda com 1 palavra: Qual é o combustível que mantém o nosso Santuário vivo?",
    "Quem é o mais silencioso durante uma briga de trânsito?",
    "Se a nossa conexão fosse uma rede Wi-Fi, o sinal seria Fraco ou Imbatível?",
    "Na nossa cama, quem vai roubar mais travesseiros durante a noite?",
    "Quem é mais provável de fazer uma surpresa romântica em uma terça-feira comum?",
    "Qual palavra resume o meu sorriso quando você fala algo inteligente?",
    "Quem de nós dois é mais fã de comida japonesa (Sushi)?",
    "Quem é mais provável de passar 30 minutos olhando o cardápio do iFood e pedir a mesma coisa de sempre?",
    "Se fôssemos uma carta do Tribunal do Afeto, seríamos a 'Prova Irrefutável' ou a 'Testemunha Surpresa'?",
    "Quem tem mais chance de tropeçar de emoção no dia do nosso primeiro abraço?",
    "Responda com 1 palavra: O que a data 29 de Outubro de 2025 representa na sua vida?",
    "Quem é mais provável de ficar acordado até tarde maratonando uma série ruim só para ver o final?",
    "Na nossa casa, quem vai ser o responsável por montar os móveis novos?",
    "Se pudéssemos escolher o clima do nosso reencontro, seria Sol ou Chuva aconchegante?",
    "Qual palavra define a falta que o meu toque faz no seu dia a dia?",
    "Quem de nós dois é mais provável de perder o celular dentro da própria casa?",
    "Quem é o melhor em manter a calma quando tudo parece dar errado?",
    "No nosso jardim real do futuro, as flores serão Brancas ou Coloridas?",
    "Quem é mais provável de querer adotar três cachorros de uma vez só?",
    "Qual adjetivo define a minha determinação em fazer dar certo com você?",
    "Quem é mais crítico e exigente com a limpeza do carro?",
    "Quem vai ser o primeiro a sugerir pedir fast-food em um dia de dieta?",
    "Em 1 palavra, o que eu trago para a sua vida que antes não existia?",
    "Quem é mais provável de cantar alto no banho achando que ninguém está ouvindo?",
    "Se fôssemos um jogo de tabuleiro, seríamos Xadrez (Estratégia) ou Banco Imobiliário (Negociação)?",
    "Quem de nós dois tem mais paciência para ensinar algo complexo ao outro?",
    "Qual palavra resume o frio na barriga de esperar uma mensagem minha?",
    "Quem é o maior especialista em me fazer sorrir quando estou de mau humor?",
    "Na nossa futura cozinha, quem vai dominar o fogão e quem vai ficar só experimentando?",
    "Quem é mais provável de querer tirar foto de todos os pratos de comida antes de comer?",
    "Qual palavra define o nosso futuro juntos: Inevitável ou Certo?",
    "Quem é mais provável de dormir abraçado com o travesseiro fingindo que é o outro?",
    "Se fôssemos um fenômeno cósmico, seríamos uma Estrela Cadente ou um Buraco Negro (que puxa tudo)?",
    "Quem é mais provável de esquecer de colocar o celular para carregar e ficar sem bateria?",
    "Na divisão das tarefas de casa, quem vai lavar o banheiro?",
    "Qual palavra resume o sentimento de ver a Árvore da Vida crescer no nosso aplicativo?",
    "Quem tem o paladar mais infantil para doces (João ou Thamiris)?",
    "Quem é mais provável de acordar no meio da noite para assaltar a geladeira?",
    "Se o nosso amor fosse um continente, seria o Europeu (Clássico) ou o Americano (Aventureiro)?",
    "Quem é mais detalhista na hora de planejar o roteiro de uma viagem?",
    "Qual adjetivo melhor descreve o meu abraço imaginário?",
    "Quem é mais provável de se perder em um shopping center grande?",
    "Quem de nós dois tem mais habilidade para lidar com a burocracia do dia a dia?",
    "Se fôssemos plantar uma nova semente agora, seria de Esperança ou de Certeza?",
    "Quem de nós dois é o mais pontual para os compromissos?",
    "Qual palavra define a minha teimosia quando coloco algo na cabeça?",
    "Quem é mais provável de querer comprar roupa combinando para os dois usarem?",
    "Na nossa futura sala, a luz será Quente (Aconchegante) ou Fria (Moderna)?",
    "Quem é mais rápido para se arrumar para um jantar de última hora?",
    "Responda com 1 palavra: O que eu represento no seu mapa do futuro?",
    "Quem é mais provável de ficar com pena de jogar algo velho fora?",
    "Se fôssemos um tipo de dança, seríamos uma Valsa (Lenta) ou um Forró (Agitado)?",
    "Quem tem mais medo de insetos e vai gritar para o outro matar?",
    "Quem é o mais corajoso para testar comidas estranhas em viagens?",
    "Qual palavra define o impacto das minhas mensagens de 'bom dia'?",
    "Quem é mais provável de deixar a xícara de café pela metade espalhada pela casa?",
    "Na nossa disputa de videogame ou jogo de cartas, quem é o pior perdedor?",
    "Quem de nós dois tem o abraço que mais parece um porto seguro?",
    "Se fôssemos um elemento da natureza, seríamos Terra (Firmeza) ou Água (Adaptação)?",
    "Quem é mais provável de chorar lendo um livro muito bom?",
    "Qual adjetivo define a minha dedicação em construir este Santuário para nós?",
    "Quem de nós dois tem a rotina matinal mais caótica e corrida?",
    "Quem é mais provável de querer ir embora cedo de uma festa chata?",
    "Na escolha do pet, ele vai dormir na cama ou na caminha dele?",
    "Qual palavra resume a minha voz gravada nos nossos 'Ecos' do aplicativo?",
    "Quem é mais provável de se viciar em um joguinho bobo de celular?",
    "Se o nosso relacionamento fosse uma bebida quente, seria Chá ou Chocolate Quente?",
    "Quem tem mais facilidade de esconder uma surpresa sem contar antes da hora?",
    "Quem é mais provável de querer maratonar os filmes do Harry Potter ou Senhor dos Anéis em um domingo?",
    "Qual palavra define a saudade de um toque que a gente ainda vai ter?",
    "Quem de nós dois é o mais 'fotógrafo oficial' do casal?",
    "Quem é mais provável de ter crise de riso no momento mais inapropriado possível?",
    "Se o nosso amor fosse uma obra de arte, seria uma Pintura ou uma Escultura?",
    "Quem é o mais exigente com a própria aparência antes de sair de casa?",
    "Qual palavra resume a energia que temos quando estamos na mesma sintonia?",
    "Quem é mais provável de querer parar para fazer carinho em todo cachorro na rua?",
    "Na nossa futura casa, a regra sobre sapatos será: Entra com sapato ou Fica na porta?",
    "Quem é o mais provável de se emocionar lembrando do dia 29 de Outubro?",
    "Quem de nós dois é o especialista em fazer o outro dar o braço a torcer?",
    "Se fôssemos uma fase da lua, seríamos Lua Cheia ou Lua Nova?",
    "Qual palavra define a minha capacidade de te surpreender?",
    "Quem é mais provável de dormir no ônibus ou no avião de boca aberta?",
    "Em uma palavra, como você se sente quando me vê online e digitando?",
    // --- MÓDULO 4: DETALHES, SURPRESAS E A ETERNIDADE (CRIADAS PELA IA) ---
    "Responda com 1 palavra: O que eu sou para você nos dias em que o mundo parece pesado?",
    "Quem tem a letra mais bonita e legível (João ou Thamiris)?",
    "Se o nosso amor fosse um projeto de engenharia, qual seria o material do alicerce?",
    "Quem de nós dois é mais provável de adotar um sotaque diferente depois de 1 semana viajando?",
    "Na nossa futura casa, a porta da frente será de Madeira rústica ou Vidro moderno?",
    "Quem é mais provável de deixar o celular cair no rosto enquanto mexe deitado na cama?",
    "Qual palavra define a sensação de planejar o nosso futuro antes de dormir?",
    "Quem de nós dois é mais mestre em fazer cafuné até o outro apagar?",
    "Se fôssemos uma cor do céu, seríamos o Azul do meio-dia ou o Alaranjado do pôr do sol?",
    "Quem é mais provável de rir primeiro em uma 'guerra de olhares' (João ou Thamiris)?",
    "Qual adjetivo define a minha paciência para te ouvir falar sobre o seu dia?",
    "Quem tem mais facilidade para acordar com o primeiro toque do despertador?",
    "Na nossa futura despensa, a prateleira de doces será maior que a de salgados?",
    "Se fôssemos um feriado, seríamos o Natal (Família) ou o Ano Novo (Recomeços)?",
    "Quem é o mais provável de sugerir uma viagem maluca no meio da semana?",
    "Qual palavra resume o nosso nível de lealdade um com o outro?",
    "No tribunal da vida, quem de nós dois seria o Juiz e quem seria o Advogado de Defesa?",
    "Quem é mais provável de chorar ouvindo a nossa música ('Nossa Trilha')?",
    "Se o nosso abraço tivesse um som, qual seria: O barulho da chuva ou O estalar da lareira?",
    "Quem de nós dois tem as mãos mais frias durante o inverno?",
    "Qual palavra define a falta que você faz na minha rotina física?",
    "Quem é o mais provável de dar um susto no outro escondido atrás da porta?",
    "Na hora de assistir a um filme, quem sempre acaba escolhendo o título?",
    "Quem de nós dois é mais provável de falar com os animais na rua como se fossem pessoas?",
    "Se fôssemos uma carta de baralho, seríamos o Ás de Copas ou o Curinga?",
    "Quem tem mais facilidade de montar móveis sem ler o manual de instruções?",
    "Qual adjetivo define a nossa química quando os nossos olhares se cruzarem pela primeira vez?",
    "Quem de nós dois é mais espaçoso na hora de dormir?",
    "Se fôssemos um doce de festa, seríamos o Brigadeiro ou o Beijinho?",
    "Quem é o mais provável de deixar a toalha esquecida na cadeira?",
    "Qual palavra define a minha admiração pela sua inteligência?",
    "Quem de nós dois é mais provável de começar a dançar do nada no meio da sala?",
    "Se o nosso amor fosse uma obra literária, seria um Romance Clássico ou uma Poesia Moderna?",
    "Na hora de fazer compras no mercado, quem é o mais focado na lista?",
    "Quem é mais provável de inventar uma receita nova que dá super certo (ou super errado)?",
    "Qual palavra resume a sensação de ler os meus 'Post-its' no Mural de Recados?",
    "Quem de nós dois é mais rápido para perdoar um erro bobo?",
    "Se fôssemos um meio de transporte, seríamos um Avião (Rápido) ou um Navio (Explorador)?",
    "Quem tem o hábito mais engraçado e peculiar (João ou Thamiris)?",
    "Qual adjetivo define a proteção que eu sinto em ter você na minha vida?",
    "Quem é mais provável de ficar com o olho marejado assistindo a um vídeo de casamento?",
    "Na nossa nova casa, quem será o primeiro a sugerir uma reforma ou mudança na decoração?",
    "Se o nosso amor fosse um esporte, seria o Xadrez (Estratégico) ou o Surfe (Aventureiro)?",
    "Quem de nós dois é o melhor em escolher os emojis certos durante a conversa?",
    "Qual palavra define o momento em que a saudade aperta no meio da tarde?",
    "Quem é o mais provável de puxar assunto com o motorista do Uber?",
    "No nosso jardim da Mini Fazenda, quem seria o encarregado de espantar as pragas?",
    "Quem de nós dois tem o paladar mais chato para experimentar coisas novas?",
    "Se fôssemos uma ferramenta, seríamos a Bússola (Direção) ou a Âncora (Estabilidade)?",
    "Qual palavra resume o meu coração no momento em que você diz 'Eu te amo'?",
    "Quem é o mais provável de gastar horas organizando arquivos no computador/celular?",
    "Se fôssemos um tipo de café, seríamos o Expresso (Forte) ou o Cappuccino (Doce)?",
    "Quem de nós dois é mais provável de guardar um segredo até o último segundo?",
    "Qual adjetivo melhor descreve a nossa jornada desde o dia 29 de Outubro de 2025?",
    "Quem de nós dois é o mais sonhador com os detalhes do casamento?",
    "Na hora de resolver um problema burocrático, quem toma a frente?",
    "Se o nosso amor fosse uma matéria escolar, seria História (Memórias) ou Física (Atração)?",
    "Quem é mais provável de querer passar a noite inteira conversando sobre a vida?",
    "Qual palavra resume o momento exato em que nossos caminhos se cruzaram?",
    "Quem de nós dois é a maior certeza de que o futuro será brilhante?",
];

// 2. IDENTIFICAÇÃO DO JOGADOR (Blindada pelo Núcleo do Santuário)
// Puxa a identidade real que foi validada pelo Firebase no momento do Login!
let obterMeuPerfil = () => window.MEU_NOME ? window.MEU_NOME : (window.souJoao ? 'João' : 'Thamiris');
let obterPerfilParceiro = () => window.NOME_PARCEIRO ? window.NOME_PARCEIRO : (window.souJoao ? 'Thamiris' : 'João');

// 3. VARIÁVEIS DE ESTADO
let sincroniaListener = null;
let rodadaAtual = {
    pergunta: "",
    respostaJoao: "",
    respostaThamiris: "",
    status: "aguardando" // 'aguardando', 'respondendo', 'revelado'
};

// 4. MOTOR DE SORTEIO (Sem repetir no mesmo dia)
function sortearNovaPergunta() {
    let hoje = new Date().toDateString();
    let historico = JSON.parse(localStorage.getItem('historicoSincroniaPerguntas')) || { data: hoje, usadas: [] };

    // Se mudou o dia, limpa a memória de perguntas usadas
    if (historico.data !== hoje) {
        historico = { data: hoje, usadas: [] };
    }

    // Filtra as perguntas que ainda não foram feitas hoje
    let disponiveis = bancoPerguntasSincronia.filter(p => !historico.usadas.includes(p));

    // Se já esgotou todas as perguntas (jogaram muito!), reseta a lista
    if (disponiveis.length === 0) {
        historico.usadas = [];
        disponiveis = bancoPerguntasSincronia;
    }

    let perguntaSorteada = disponiveis[Math.floor(Math.random() * disponiveis.length)];
    
    // Salva na memória do celular que essa pergunta já foi feita hoje
    historico.usadas.push(perguntaSorteada);
    localStorage.setItem('historicoSincroniaPerguntas', JSON.stringify(historico));

    return perguntaSorteada;
}

// ==========================================
// 5. INICIALIZAÇÃO E CONEXÃO COM O FIREBASE REALTIME DATABASE
// ==========================================
// Variável para guardar o controle remoto da antena do Firebase
window.desligarAntenaSincronia = null; 

window.iniciarSincronia = function() {
    console.log("Abrindo conexão quântica...");
    
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;

    const sincRef = ref(db, 'jogos/sincronia_casal');

    // Desliga a antena antiga antes de ligar uma nova (Evita clonagem)
    if (window.desligarAntenaSincronia) {
        window.desligarAntenaSincronia();
    }

    // 🚨 A MÁGICA: O Firebase retorna uma função de "desligar" quando usamos o onValue no SDK Modular
    window.desligarAntenaSincronia = onValue(sincRef, (snapshot) => {
        if (snapshot.exists()) {
            rodadaAtual = snapshot.val();
            const perguntaAindaExiste = bancoPerguntasSincronia.includes(rodadaAtual.pergunta);
            
            if (!perguntaAindaExiste) {
                iniciarNovaInvestigacao();
                return; 
            }
            atualizarInterfaceSincronia(); 
        } else {
            iniciarNovaInvestigacao();
        }
    });
};

// ==========================================
// NOVA RODADA: Envia a nova pergunta para os dois celulares
// ==========================================
window.iniciarNovaInvestigacao = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const novaPergunta = sortearNovaPergunta();
    
    // Sobrescreve o banco com a nova rodada
    set(ref(db, 'jogos/sincronia_casal'), {
        pergunta: novaPergunta,
        respostaJoao: "",
        respostaThamiris: "",
        status: "respondendo",
        timestamp: Date.now()
    });
    
    if(window.Haptics) window.Haptics.toqueLeve();
};

// 6. ATUALIZAÇÃO DA INTERFACE (A Mágica Visual)
function atualizarInterfaceSincronia() {
    document.getElementById('tema-sincronia').innerText = `"${rodadaAtual.pergunta}"`;
    
    const eu = obterMeuPerfil();
    const parceiro = obterPerfilParceiro();

    const minhaResposta = eu === 'João' ? rodadaAtual.respostaJoao : rodadaAtual.respostaThamiris;
    const respostaDela = eu === 'João' ? rodadaAtual.respostaThamiris : rodadaAtual.respostaJoao;
    
    const orbe = document.getElementById('orbe-energia');
    const inputMeu = document.getElementById('input-minha-palavra');
    const btnTravar = document.getElementById('btn-travar-mente');
    const statusDela = document.getElementById('status-parceira-digitando');
    const boxOculta = document.getElementById('palavra-parceira-oculta');
    const boxRevelada = document.getElementById('palavra-parceira-revelada');
    const areaNovaRodada = document.getElementById('area-nova-rodada');

    // Resetando estados visuais básicos
    inputMeu.disabled = false;
    btnTravar.disabled = false;
    btnTravar.innerText = "Trancar Resposta 🔒";
    areaNovaRodada.classList.add('escondido');
    boxOculta.classList.add('escondido');
    boxRevelada.classList.add('escondido');
    statusDela.classList.remove('escondido');
    
    // --- LÓGICA DE ESTADOS ---

    // 1. Eu já respondi, mas ela ainda não
    if (minhaResposta !== "" && respostaDela === "") {
        inputMeu.value = minhaResposta;
        inputMeu.disabled = true;
        btnTravar.disabled = true;
        btnTravar.innerText = "Aguardando Parceira... ⏳";
        statusDela.innerText = `${parceiro} está pensando... 💭`;
        orbe.className = "orbe orbe-conectada"; // Orbe pulsando em Roxo
    }
    
    // 2. Ela já respondeu, mas eu ainda não
    else if (minhaResposta === "" && respostaDela !== "") {
        // 🚨 CORREÇÃO: Removemos o inputMeu.value = "" que apagava o texto da Thamiris!
        statusDela.classList.add('escondido');
        boxOculta.classList.remove('escondido'); // Mostra a caixa "Resposta Trancada!"
        orbe.className = "orbe orbe-conectada";
    }
    
    // 3. O GRANDE MOMENTO: OS DOIS RESPONDERAM!
    else if (minhaResposta !== "" && respostaDela !== "") {
        inputMeu.value = minhaResposta;
        inputMeu.disabled = true;
        btnTravar.disabled = true;
        btnTravar.innerText = "Mentes Sincronizadas ✨";
        
        statusDela.classList.add('escondido');
        boxRevelada.innerText = respostaDela;
        boxRevelada.classList.remove('escondido');
        areaNovaRodada.classList.remove('escondido'); // Mostra o botão de Próxima Investigação
        
        orbe.className = "orbe orbe-sincronizada"; // Orbe fica Dourada/Amarela!
        
        // Verifica se deu Match! (Checagem limpa, sem se importar com maiúsculas)
        verificarMatch(minhaResposta, respostaDela);
    }
    
    // 4. Ninguém respondeu ainda (Nova Rodada)
    else {
        inputMeu.value = "";
        statusDela.innerText = "Aguardando conexão telepática...";
        orbe.className = "orbe orbe-desconectada"; // Orbe cinza e calma
    }
}

// ==========================================
// TRAVAR A PALAVRA: Envia a resposta de quem clicou
// ==========================================
window.travarPalavra = function() {
    const minhaPalavra = document.getElementById('input-minha-palavra').value.trim();
    
    if (minhaPalavra === "") {
        if(typeof mostrarToast === 'function') mostrarToast("A sua mente não pode estar vazia!", "⚠️");
        return;
    }
    
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    
    const { db, ref, set } = window.SantuarioApp.modulos; 
    
    // 🚨 PUXA A IDENTIDADE REAL DO NÚCLEO
    const eu = obterMeuPerfil();
    const campoParaAtualizar = eu === 'João' ? 'respostaJoao' : 'respostaThamiris';
    
    // Atualiza APENAS o campo específico de quem digitou
    set(ref(db, `jogos/sincronia_casal/${campoParaAtualizar}`), minhaPalavra)
    .then(() => {
        if(window.Haptics) window.Haptics.toqueLeve();
    }).catch(error => console.error("Erro na telepatia:", error));
};

// 8. O VEREDITO DA CONEXÃO (COM NORMALIZAÇÃO DE ELITE)
function verificarMatch(palavra1, palavra2) {
    const normalizar = (texto) => {
        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    };

    const p1 = normalizar(palavra1);
    const p2 = normalizar(palavra2);
    
    // 🚨 PUXA A IDENTIDADE REAL
    const eu = obterMeuPerfil();
    
    if (p1 === p2) {
        if(typeof mostrarToast === 'function') mostrarToast("Sincronia Perfeita! As mentes colidiram! +100💰", "✨🧠✨");
        if(window.Haptics) navigator.vibrate([100, 50, 100, 50, 200]); 
        
        if(typeof confetti === 'function') confetti({colors: ['#e056fd', '#f9ca24'], particleCount: 150, spread: 100});
        
        // Apenas o João processa o dinheiro para não duplicar os ganhos no banco
        if (eu === 'João' && typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(100, "Sincronia Perfeita Quântica");
            salvarNoHistorico("Match Perfeito", p1, p2);
        }
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("As mentes seguiram caminhos diferentes... Mas a verdade foi revelada!", "🔮");
        
        if (eu === 'João') salvarNoHistorico("Divergência", p1, p2);
    }
}

// Função para registrar no Dossiê (Opcional, se você quiser manter um registro)
function salvarNoHistorico(resultado, p1, p2) {
    console.log(`Histórico Salvo: ${resultado} | Eu: ${p1} | Ela: ${p2}`);
    // Futuramente podemos jogar isso num array do Firebase para a aba de Linha do Tempo!
}

// ==========================================
// MENUS E INSTRUÇÕES DA SINCRONIA
// ==========================================

// 1. O Ponto de Interrogação (Instruções)
window.toggleInstrucoesSincronia = function() {
    // Certifique-se de que a div de instruções no HTML tem id="instrucoes-sincronia"
    const painel = document.getElementById('instrucoes-sincronia');
    if (painel) {
        painel.classList.toggle('escondido');
        if (window.Haptics) window.Haptics.toqueLeve();
    }
};

// 2. O Ícone Secundário (Linha do Tempo e Compartilhamento)
window.abrirLinhaDoTempoSincronia = function() {
    if (window.Haptics) window.Haptics.toqueLeve();

    // 1. Lê a memória da Linha do Tempo local
    let historico = JSON.parse(localStorage.getItem('historicoSincroniaPerguntas'));
    let qtd = (historico && historico.usadas) ? historico.usadas.length : 0;

    if (typeof mostrarToast === 'function') {
        mostrarToast(`📜 Linha do Tempo: ${qtd} memórias investigadas hoje!`, "✨");
    }

    // 2. Converte a ação em um convite magnético para a parceira
    if (rodadaAtual && rodadaAtual.pergunta) {
        // Um pequeno delay para o Toast da Linha do Tempo brilhar antes de sair do app
        setTimeout(() => {
            const texto = `🔮 Investigação Quântica Ativa no Santuário!\n\nPergunta: "${rodadaAtual.pergunta}"\n\nMinha mente já está trancada na Linha do Tempo. Abra o aplicativo para sincronizar e revelar a verdade! ✨`;
            const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;
            window.open(url, '_blank');
        }, 800);
    } else {
        if (typeof mostrarToast === 'function') {
            mostrarToast("Inicie uma investigação primeiro para chamar sua parceira!", "⚠️");
        }
    }
};