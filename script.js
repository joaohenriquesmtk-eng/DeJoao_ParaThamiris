// ==========================================
// SANTUÁRIO - O MOTOR DIGITAL (script.js)
// ==========================================

const dataInicio = new Date("2025-10-29T16:30:00").getTime();
const urlParams = new URLSearchParams(window.location.search);
const souJoao = urlParams.get('user') === 'joao';
const MEU_NOME = souJoao ? "João" : "Thamiris";
const NOME_PARCEIRO = souJoao ? "Thamiris" : "João";

let statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", ultimaVerificacao: Date.now(), sequencia: 0, ciclos: 0 };

// 1. MOTOR DO TEMPO
function atualizarMotorDoTempo() {
    const agora = new Date().getTime();
    const diferenca = agora - dataInicio;
    const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
    const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);
    const formatar = (n) => n < 10 ? "0" + n : n;
    
    const timerElemento = document.getElementById("timer-principal");
    if (timerElemento) {
        timerElemento.innerHTML = `${dias}d ${formatar(horas)}h ${formatar(minutos)}m ${formatar(segundos)}s`;
    }
}

// 2. CONFIGURAÇÃO DA PLANILHA EXTERNA
const URL_PLANILHA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1Rr4fdzLLW-Xu4jrf7qotZ_r67mOJrTDQxtZMKxUF8UijZI0Uxj3dwnjzaX_I7dq5MpEepB3SjsMI/pub?output=csv";

async function carregarDadosExternos() {
    try {
        const resposta = await fetch(URL_PLANILHA);
        const dadosTexto = await resposta.text();
        const linhas = dadosTexto.split(/\r?\n/).slice(1); 
        const dadosDoDia = linhas.map(linha => {
            if (!linha.trim()) return null;
            const colunas = linha.split(",");
            const data = colunas[0].trim();
            const palavra = colunas[colunas.length - 1].trim().toUpperCase();
            let frase = colunas.slice(1, colunas.length - 1).join(",");
            frase = frase.replace(/(^"|"$)/g, '').trim();
            return { data, frase, palavra };
        }).filter(Boolean);

        const d = new Date();
        const hojeFormatado = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        const configHoje = dadosDoDia.find(item => item.data === hojeFormatado) || dadosDoDia[0];

        if (configHoje) {
            const elFrase = document.getElementById("frase-do-dia");
            if (elFrase) {
                elFrase.innerHTML = `<div class="container-frase"><span class="aspas-decorativa">“</span><p class="texto-itálico">${configHoje.frase}</p><span class="aspas-decorativa">”</span></div>`;
            }
            window.PALAVRA_DO_DIA = configHoje.palavra;
            if (localStorage.getItem('santuario_vitoria_dia') === hojeFormatado) {
                setTimeout(liberarCofreVisual, 500); 
            }
        }
    } catch (e) { console.error("Erro planilha:", e); }
}

// 3. NAVEGAÇÃO SPA (Alteração 2: Conserto da Persistência)
function configurarNavegacao() {
    const botoesMenu = document.querySelectorAll('.item-menu');
    const todasAsTelas = document.querySelectorAll('.tela');

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            evento.preventDefault(); 
            const telaAlvo = botao.getAttribute('data-alvo'); 

            botoesMenu.forEach(b => b.classList.remove('ativo'));
            botao.classList.add('ativo');

            todasAsTelas.forEach(tela => tela.classList.add('escondido'));
            const elementoTela = document.getElementById(telaAlvo);
            if (elementoTela) elementoTela.classList.remove('escondido');
            
            // Força sempre a checagem dos badges ao navegar para não sumirem
            atualizarDinamicaHome();
        });
    });
}

// 4. JOGO: TERMO (Alteração 1: Tela Estática após Ganhar)
let tentativaAtual = 0;
let letraAtual = 0;
let grade = ["", "", "", "", "", ""];

function salvarEstadoTermo() {
    const estado = {
        tentativaAtual: tentativaAtual,
        letraAtual: letraAtual,
        grade: grade
    };
    sessionStorage.setItem('termo_estado', JSON.stringify(estado));
}

function inicializarTermo() {
    const tabuleiro = document.getElementById("tabuleiro-termo");
    if (!tabuleiro) return; 
    tabuleiro.innerHTML = ""; // Limpa antes de montar
    
    const hoje = new Date().toLocaleDateString('pt-BR');
    const ganhouHoje = localStorage.getItem('santuario_vitoria_dia') === hoje;

    // Se já ganhou hoje, trava a tela com a palavra correta
    if (ganhouHoje) {
    const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
    // Cria as 6 linhas
    for (let i = 0; i < 6; i++) {
        let linha = document.createElement("div");
        linha.className = "linha-termo";
        for (let j = 0; j < 5; j++) {
            let quadrado = document.createElement("div");
            quadrado.className = "letra-quadrado correta";
            quadrado.innerText = palavraFinal[j];
            linha.appendChild(quadrado);
        }
        tabuleiro.appendChild(linha);
    }

    // Esconde teclado e botão
    document.getElementById("teclado-termo").innerHTML = "";
    document.getElementById("btn-verificar").classList.add("escondido");

    // Modifica as instruções para mensagem de vitória
    const inst = document.getElementById('instrucoes-termo');
    inst.innerHTML = `<h4 style="text-align:center; color: var(--cor-agronomia);">Vitória Colhida! 🌱</h4>
                      <p style="text-align:center;">Volte amanhã para colher uma nova palavra e liberar mais relíquias.</p>`;
    inst.classList.remove('escondido');

    tentativaAtual = 6; // Trava o jogo
    return;
}

    // Fluxo normal se ainda não jogou/ganhou hoje
    tentativaAtual = 0;
    letraAtual = 0;
    grade = ["", "", "", "", "", ""];
    document.getElementById("btn-verificar").classList.remove("escondido");
    document.getElementById("teclado-termo").innerHTML = "";

    for (let i = 0; i < 6; i++) {
        let linha = document.createElement("div");
        linha.className = "linha-termo";
        for (let j = 0; j < 5; j++) {
            let quadrado = document.createElement("div");
            quadrado.className = "letra-quadrado";
            quadrado.id = `q-${i}-${j}`;
            linha.appendChild(quadrado);
        }
        tabuleiro.appendChild(linha)
    }
    restaurarEstadoTermo();

    gerarTeclado();
}

function gerarTeclado() {
    const tecladoContainer = document.getElementById("teclado-termo");
    if (!tecladoContainer) return;
    const layout = [["Q","W","E","R","T","Y","U","I","O","P"],["A","S","D","F","G","H","J","K","L"],["⌫","Z","X","C","V","B","N","M","ENTER"]];
    layout.forEach(linha => {
        const divLinha = document.createElement("div");
        divLinha.className = "linha-teclado";
        linha.forEach(tecla => {
            const btn = document.createElement("button");
            btn.innerText = tecla;
            btn.className = tecla.length > 1 ? "tecla tecla-larga" : "tecla";
            btn.onclick = () => processarEntrada(tecla);
            divLinha.appendChild(btn);
        });
        tecladoContainer.appendChild(divLinha);
    });
}

function processarEntrada(tecla) {
    if (tentativaAtual >= 6) return;
    if (tecla === "ENTER") verificarPalavra();
    else if (tecla === "⌫") apagarLetra();
    else adicionarLetra(tecla);
}

function adicionarLetra(letra) {
    if (letraAtual < 5) {
        const quadrado = document.getElementById(`q-${tentativaAtual}-${letraAtual}`);
        if(quadrado) {
            quadrado.innerText = letra;
            grade[tentativaAtual] += letra;
            letraAtual++;
        salvarEstadoTermo()
        }
    }
}

function apagarLetra() {
    if (letraAtual > 0) {
        letraAtual--;
        const quadrado = document.getElementById(`q-${tentativaAtual}-${letraAtual}`);
        if(quadrado) {
            quadrado.innerText = "";
            grade[tentativaAtual] = grade[tentativaAtual].slice(0, -1);
        salvarEstadoTermo()
        }
    }
}

function verificarPalavra() {
    const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
    salvarEstadoTermo() 
    const palpite = grade[tentativaAtual];
    if (palpite.length < 5) return;
    
    for (let i = 0; i < 5; i++) {
        const quadrado = document.getElementById(`q-${tentativaAtual}-${i}`);
        const letra = palpite[i];
        if (letra === palavraFinal[i]) quadrado.classList.add("correta");
        else if (palavraFinal.includes(letra)) quadrado.classList.add("presente");
        else quadrado.classList.add("ausente");
    }
    
    if (palpite === palavraFinal) finalizarVitoria();
    else {
        tentativaAtual++;
        letraAtual = 0;
        if (tentativaAtual === 6) {
            mostrarToast("Não foi dessa vez... Mas você merece outra chance!");
            document.getElementById('termo-reset-container').classList.remove('escondido');
        }
    }
}

function finalizarVitoria() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    localStorage.setItem('santuario_vitoria_dia', hoje);
    mostrarToast("Incrível! Você colheu a vitória! 🌱");
    inicializarTermo(); // Chama a função para travar a tela
    liberarCofreVisual(); 
    atualizarDinamicaHome();
}

// Reinicia o jogo Termo para uma nova tentativa (quando o jogador perdeu)
function resetarTermo() {
    // Se já venceu hoje, não permite reset (o botão não deveria estar visível, mas segurança)
    const hoje = new Date().toLocaleDateString('pt-BR');
    sessionStorage.removeItem('termo_estado');
    if (localStorage.getItem('santuario_vitoria_dia') === hoje) {
        return;
    }

    // Reinicia as variáveis de controle
    tentativaAtual = 0;
    letraAtual = 0;
    grade = ["", "", "", "", "", ""];

    // Reconstrói o tabuleiro do zero
    inicializarTermo();

    // Esconde o botão de reset novamente
    const resetContainer = document.getElementById('termo-reset-container');
    if (resetContainer) {
        resetContainer.classList.add('escondido');
    }
}
function restaurarEstadoTermo() {
    const estadoSalvo = sessionStorage.getItem('termo_estado');
    if (estadoSalvo) {
        const estado = JSON.parse(estadoSalvo);
        tentativaAtual = estado.tentativaAtual;
        letraAtual = estado.letraAtual;
        grade = estado.grade;

        // Preenche o tabuleiro com as letras já inseridas
        for (let i = 0; i <= tentativaAtual; i++) {
            for (let j = 0; j < 5; j++) {
                const quadrado = document.getElementById(`q-${i}-${j}`);
                if (quadrado && grade[i] && grade[i][j]) {
                    quadrado.innerText = grade[i][j];
                    // Se a linha já foi verificada (i < tentativaAtual), aplica as cores
                    if (i < tentativaAtual) {
                        const letra = grade[i][j];
                        const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
                        if (letra === palavraFinal[j]) quadrado.classList.add("correta");
                        else if (palavraFinal.includes(letra)) quadrado.classList.add("presente");
                        else quadrado.classList.add("ausente");
                    }
                }
            }
        }
    }
}

function liberarCofreVisual() {
    const botaoCofre = document.querySelector('[data-alvo="cofre"]');
    if(botaoCofre) {
        botaoCofre.style.animation = "pulse-gold 2s infinite";
        botaoCofre.classList.remove('bloqueado');
    }
    const msg = document.getElementById('msg-cofre');
    if (msg) msg.innerText = "Acesso Concedido para Hoje";
    
    document.querySelectorAll('.item-cofre').forEach(item => {
        item.classList.remove('bloqueado');
        const status = item.querySelector('.status-reliquia');
        if (status) status.innerText = "Disponível";
    });
}

function toggleInstrucoesTermo() { document.getElementById('instrucoes-termo').classList.toggle('escondido'); }
function toggleInstrucoesSincronia() { document.getElementById('instrucoes-sincronia').classList.toggle('escondido'); }
function toggleInstrucoesJardim() { document.getElementById('instrucoes-jardim').classList.toggle('escondido'); }

// 5. CLIMA & PULSOS
const API_KEY = "da54b3d1f91b3ca0850de8cb7890e572";

function obterEmojiClima(condicao, sunrise, sunset) {
    const agora = Math.floor(Date.now() / 1000);
    const eNoite = agora < sunrise || agora > sunset;
    const emojis = { 'Clear': eNoite ? '🌙' : '☀️', 'Clouds': '☁️', 'Rain': '🌧️', 'Thunderstorm': '⛈️' };
    return emojis[condicao] || '🌡️';
}

async function atualizarClima() {
    const elJoão = document.getElementById("temp-usuario");
    const elThamiris = document.getElementById("temp-thamiris");
    
    try {
        const resJ = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Colombo,BR&units=metric&appid=${API_KEY}`);
        const resT = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Goiania,BR&units=metric&appid=${API_KEY}`);
        
        if (!resJ.ok || !resT.ok) throw new Error('Erro na API');
        
        const dJ = await resJ.json();
        const dT = await resT.json();
        
        if (dJ.main && elJoão) elJoão.innerHTML = `${Math.round(dJ.main.temp)}°C ${obterEmojiClima(dJ.weather[0].main, dJ.sys.sunrise, dJ.sys.sunset)}`;
        if (dT.main && elThamiris) elThamiris.innerHTML = `${Math.round(dT.main.temp)}°C ${obterEmojiClima(dT.weather[0].main, dT.sys.sunrise, dT.sys.sunset)}`;
    } catch (e) {
        if (elJoão) elJoão.innerHTML = "❌ Indisponível";
        if (elThamiris) elThamiris.innerHTML = "❌ Indisponível";
    }
}
    
const URL_SCRIPT_PULSO = "https://script.google.com/macros/s/AKfycbye-Um7962qfQhHyg4T-FlERkiKAHK3UmJKViGlRVcNFgyOfIyJxHYK82RqwHjhcSr5Hw/exec";

async function atualizarContadorVisual() {
    try {
        const res = await fetch(URL_SCRIPT_PULSO, { method: 'POST' });
        if (!res.ok) throw new Error('Erro na resposta');
        const d = await res.json();
        const total = souJoao ? d.pulsosThamiris : d.pulsosJoao;
        const txt = document.getElementById("contador-pulso");
        if (txt) txt.innerText = parseInt(total) > 0 ? `${NOME_PARCEIRO} pensou em você ${total} vezes hoje` : `Nenhum pulso de ${NOME_PARCEIRO} ainda`;
    } catch (e) {
        console.error('Erro ao buscar pulsos:', e);
        const txt = document.getElementById("contador-pulso");
        if (txt) txt.innerText = `Não foi possível carregar os pulsos.`;
    }
}

async function enviarPulso() {
    const btn = document.getElementById("btn-pulso");
    const icone = document.getElementById("icone-semente");
    const feedback = document.getElementById("msg-feedback");
    const quemEnvia = souJoao ? "colunaA" : "colunaB";
    try {
        if(icone) icone.innerText = "🌸"; 
        if(btn) btn.classList.add("germinar");
        if(feedback) feedback.classList.add("visivel");
        fetch(`${URL_SCRIPT_PULSO}?quem=${quemEnvia}`, { mode: 'no-cors' });
        setTimeout(() => {
            if(icone) icone.innerText = "🌱";
            if(btn) btn.classList.remove("germinar");
            if(feedback) feedback.classList.remove("visivel");
        }, 2000);
    } catch (e) { }
}

// 6. SOLO FÉRTIL (JARDIM)
function atualizarJardim() {
    const salvo = JSON.parse(localStorage.getItem('statusPlanta_v2'));
    if (salvo) {
        // Se o objeto salvo não tiver o campo 'ultimaVerificacao', adiciona com a data atual
        if (salvo.ultimaVerificacao === undefined) {
            salvo.ultimaVerificacao = Date.now();
        }
        statusPlanta = salvo;
    } else {
        // Primeira vez que o app é aberto
        statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", ultimaVerificacao: Date.now(), sequencia: 0, ciclos: 0 };
        localStorage.setItem('statusPlanta_v2', JSON.stringify(statusPlanta));
    }
    
    const agora = Date.now();
    const umDia = 24 * 60 * 60 * 1000; // milissegundos em um dia
    
    // Se já regou alguma vez, verifica quantos dias se passaram desde a última verificação
    if (statusPlanta.ultimaRegada > 0) {
        const diasDesdeUltimaVerificacao = Math.floor((agora - statusPlanta.ultimaVerificacao) / umDia);
        if (diasDesdeUltimaVerificacao >= 1) {
            // Perde 10% por dia completo sem regar (não pode ficar negativo)
            const perda = diasDesdeUltimaVerificacao * 10;
            statusPlanta.nivel = Math.max(0, statusPlanta.nivel - perda);
            // Atualiza a última verificação para agora (já contabilizou esses dias)
            statusPlanta.ultimaVerificacao = agora;
        }
    } else {
        // Nunca regou, apenas atualiza a verificação
        statusPlanta.ultimaVerificacao = agora;
    }
    
    // Salva as alterações no localStorage
    localStorage.setItem('statusPlanta_v2', JSON.stringify(statusPlanta));
    
    // Atualiza a tela
    renderizarPlanta();
    atualizarDinamicaHome();

    // Verifica se já regou hoje e, se não, lembra com um toast
    const hoje = new Date().toLocaleDateString('pt-BR');
    if (statusPlanta.diaUltimaRegada !== hoje) {
        setTimeout(() => {
            mostrarToast("🌱 Não esqueça de regar o Solo Fértil hoje!");
        }, 1000);
    }
}

function regarPlanta() {
    const agora = new Date();
    const hoje = agora.toLocaleDateString('pt-BR');
    
    // Verifica se já regou hoje
    if (statusPlanta.diaUltimaRegada === hoje) {
        mostrarToast("O solo já está úmido o suficiente por hoje! Volte amanhã. 🌱");
        return;
    }
    
    // Calcula a sequência (streak) de dias seguidos
    const ontem = new Date();
    ontem.setDate(agora.getDate() - 1);
    const ontemStr = ontem.toLocaleDateString('pt-BR');
    
    if (statusPlanta.diaUltimaRegada === ontemStr) {
        statusPlanta.sequencia = (statusPlanta.sequencia || 0) + 1;
    } else {
        statusPlanta.sequencia = 1;
    }
    
    // Aumenta o nível em 10%, limitado a 100
    const nivelAntes = statusPlanta.nivel;
    let novoNivel = statusPlanta.nivel + 10;
    
    // Verifica se ultrapassou 100% (para garantir que não passe)
    if (novoNivel > 100) {
        novoNivel = 100;
    }
    
    // Define o novo nível
    statusPlanta.nivel = novoNivel;
    
    // Atualiza timestamps
    statusPlanta.ultimaRegada = agora.getTime();
    statusPlanta.diaUltimaRegada = hoje;
    statusPlanta.ultimaVerificacao = agora.getTime(); // importante para resetar a contagem de perda
    
    // Salva no localStorage
    localStorage.setItem('statusPlanta_v2', JSON.stringify(statusPlanta));
    
    // Animação do emoji
    const emoji = document.getElementById("emoji-planta");
    if (emoji) {
        emoji.style.transform = "scale(1.2)";
        setTimeout(() => emoji.style.transform = "scale(1)", 300);
    }
    
    // Verifica se acabou de atingir 100% (nivelAntes < 100 e nivel agora é 100)
if (statusPlanta.nivel === 100 && nivelAntes < 100) {
    // Incrementa o contador de ciclos
    statusPlanta.ciclos = (statusPlanta.ciclos || 0) + 1;
    
    mostrarToast(`🎉 PARABÉNS! Você completou ${statusPlanta.ciclos} ciclo(s)! A planta vai renascer.`);
    
    // Aplica efeito visual de renascimento
    if (emoji) {
        emoji.classList.add("renascer");
        setTimeout(() => {
            emoji.classList.remove("renascer");
        }, 1000);
    }
    
    // Reinicia a planta
    statusPlanta.nivel = 0;
    
    // Salva novamente após reiniciar
    localStorage.setItem('statusPlanta_v2', JSON.stringify(statusPlanta));
    
    renderizarPlanta();
    atualizarDinamicaHome();
    
    setTimeout(() => {
        mostrarToast("🌱 Nova planta começou! Continue regando.");
    }, 500);
}
    
    // Atualiza a tela (sempre, mesmo se não reiniciou)
    renderizarPlanta();
    atualizarDinamicaHome();
}

function renderizarPlanta() {
    const barra = document.getElementById("progresso-crescimento");
    const emoji = document.getElementById("emoji-planta");
    const texto = document.getElementById("status-texto");
    const aviso = document.getElementById("aviso-regada");
    const btn = document.getElementById("btn-regar");
    const contadorCiclos = document.getElementById('contador-ciclos');
    if (contadorCiclos) {
            contadorCiclos.innerText = `🌱 Ciclos completados: ${statusPlanta.ciclos || 0}`;
    }

    if (!barra || !emoji || !texto) return;
    barra.style.width = statusPlanta.nivel + "%";
    
    if (statusPlanta.nivel <= 0) { emoji.innerText = "🥀"; texto.innerText = "A planta murchou por falta de cuidado."; } 
    else if (statusPlanta.nivel < 30) { emoji.innerText = "🌱"; texto.innerText = "Um broto esperançoso."; } 
    else if (statusPlanta.nivel < 60) { emoji.innerText = "🌿"; texto.innerText = "Crescendo com vigor!"; } 
    else if (statusPlanta.nivel < 90) { emoji.innerText = "🌳"; texto.innerText = "Quase lá, falta pouco para florescer."; } 
    else { emoji.innerText = "🌸"; texto.innerText = "Flor desabrochada! O Santuário brilha."; }

    if (statusPlanta.diaUltimaRegada === new Date().toLocaleDateString('pt-BR')) {
        if(btn) btn.style.opacity = "0.5"; if(aviso) aviso.innerText = "Próxima regada disponível amanhã.";
    } else {
        if(btn) btn.style.opacity = "1"; if(aviso) aviso.innerText = "O solo precisa de você hoje.";
    }
}

// ==========================================
// 7. COFRE & RELÍQUIAS - SISTEMA AUTÔNOMO "SAFRA 2026"
// ==========================================

const BIBLIOTECA_RELIQUIAS = {
    ceu: [
        "Enquanto o sol se põe no horizonte de Goiânia, as primeiras estrelas aparecem aqui em Colombo. É o mesmo céu, apenas em tempos diferentes.",
        "A lua que ilumina as ruas de Goiânia hoje é a mesma que reflete nos meus olhos aqui. Estamos sob o mesmo teto universal.",
        "A distância entre nossas coordenadas geográficas é grande, mas a luz das estrelas não conhece fronteiras. Olhe para cima, eu estou lá com você.",
        "Mesmo que o clima em Colombo seja diferente do calor de Goiânia, o universo que nos envolve é um só. Sinta a conexão no ar.",
        "Cada constelação que cruza o meridiano hoje leva um pensamento meu até você. O céu é o nosso correio sentimental.",
        "Não importa o fuso ou a distância: se ambos olharmos para o alto agora, nossos olhares se cruzam no infinito.",
        "O ciclo hídrico, as nuvens que viajam... tudo o que flutua acima de nós prova que nada está realmente separado.",
        "Goiânia tem o seu brilho, Colombo tem o meu silêncio, mas o céu de hoje une nossas essências em uma só moldura.",
        "A física explica a distância, mas o céu prova a unidade. Somos dois pontos sob a mesma abóbada celeste.",
        "Que a imensidão do céu de hoje te lembre que o meu amor por você não tem limites cartográficos.",
        "O céu de Colombo hoje sopra um vento sul que carrega o meu 'eu te amo' até o calor de Goiânia.",
        "As estrelas são os pontos de GPS que o destino traçou para que nossas almas nunca se perdessem.",
        "A mesma lua que ilumina sua leitura do Vade Mecum é a que brilha sobre meus mapas de solo.",
        "A distância é uma grandeza física; nosso amor é uma constante universal que o céu apenas molda.",
        "Se o céu fosse um tribunal, a lua seria a testemunha ocular de que não passo um minuto sem te desejar.",
        "Não existe nuvem pesada o suficiente para esconder o brilho que você emana no meu horizonte.",
        "Olhar para o alto é o meu ritual de proximidade; o universo é o nosso ponto de encontro oficial.",
        "Enquanto a terra gira, meu pensamento orbita você como um satélite em sintonia perfeita.",
        "O céu hoje tem a cor da paz que sinto quando ouço a sua voz através das ondas do espaço.",
        "Somos dois pontos em estados diferentes, mas sob a mesma cúpula de infinito. Nada nos separa.",
        "A atmosfera entre nós não é vácuo, é preenchida por uma saudade que se converte em força.",
        "Que o brilho de Sirius hoje te lembre que a luz mais forte da minha vida vem de Goiânia.",
        "O pôr do sol é o ensaio geral para o dia em que o veremos juntos, sem telas entre nós.",
        "A astronomia explica os astros; o que eu sinto por você explica o porquê de eles brilharem.",
        "Cada estrela hoje é um pixel da imagem do futuro que estou construindo ao seu lado.",
        "O céu não é o limite para nós; é apenas o cenário onde nossa história é escrita com luz.",
        "Goiânia e Colombo dividem o mesmo meridiano de afeto. O tempo para nós é sempre agora.",
        "Sinta a brisa: é a atmosfera fazendo o intercâmbio de suspiros entre o meu peito e o seu.",
        "A imensidão do céu é o único lugar que comporta a grandiosidade do que sinto por você.",
        "Nossas coordenadas são diferentes, mas o nosso zênite é o mesmo: a felicidade mútua.",
        "O céu noturno é o pergaminho onde as constelações desenham o nosso 'para sempre'.",
        "A luz que viajou anos-luz para chegar aqui hoje é jovem perto da eternidade do nosso amor.",
        "Não importa o quão longe o horizonte pareça, ele sempre termina onde você começa.",
        "O céu de hoje é um espelho: ele reflete a beleza que eu vejo em você todos os dias.",
        "Mesmo que o tempo mude, minha lealdade a você é tão fixa quanto a Estrela Polar.",
        "O firmamento é o nosso teto compartilhado enquanto nossa casa física ainda está em obras no destino.",
        "A vastidão acima de nós é a prova de que para o amor, não existe território proibido.",
        "Beije a lua com o olhar; eu farei o mesmo daqui e nos encontraremos no reflexo dela.",
        "O céu de hoje é o prefácio do livro que escreveremos quando a distância for apenas uma lembrança.",
        "Você é o sol do meu sistema particular; tudo em mim gravita ao redor da sua existência.",
        "O satélite que mapeia as terras lá do alto é o mesmo que captura a intensidade do meu pensamento em você agora.",
        "A umidade do ar em Colombo hoje é saudade condensada, esperando o sol de Goiânia para se transformar em reencontro.",
        "O céu não tem cercas nem divisas; ele é a prova de que nosso amor é um território livre de qualquer embargo.",
        "As ondas de rádio cruzam o país, mas é o brilho da lua que faz o download direto do meu coração para o seu.",
        "Se a distância fosse medida em anos-luz, o céu de hoje diria que já chegamos ao nosso destino final: um ao lado do outro.",
        "O vento que sopra no Sul hoje é o mensageiro que leva o oxigênio da minha vida para alimentar os seus sonhos aí.",
        "Cada estrela cadente é uma petição de urgência que envio ao universo para que o tempo acelere até o nosso abraço.",
        "A estratosfera é o único lugar vasto o suficiente para guardar o arquivo completo de tudo o que planejamos juntos.",
        "Olhe para o horizonte: onde a terra parece terminar, é onde a nossa história ganha a imensidão do infinito.",
        "O sol de hoje realiza a fotossíntese da minha alma, mas é o brilho dos seus olhos que me dá a energia para crescer.",
        "Não existe fuso horário para o afeto; sob este céu, o meu relógio biológico bate no ritmo da sua respiração.",
        "A luz zodiacal de hoje é o reflexo do ouro que você plantou na minha vida. Você é o meu maior tesouro sob o firmamento.",
        "O céu é o diário oficial do nosso amor, onde cada nuvem desenha uma cláusula de felicidade eterna.",
        "Mesmo que o tempo tente nos separar, o céu de hoje é a prova de que estamos sempre juntos, olhando para o mesmo infinito.",
        "A distância é apenas um número; o céu é a prova de que para o amor, não existem fronteiras geográficas."
    ],
    sementes: [
        "Nosso amor não é uma cultura de ciclo curto; é uma floresta perene. Suas raízes já atingiram o lençol freático da minha alma.",
        "Como uma semente que rompe o solo, nosso sentimento venceu a distância e a força maior para florescer no Santuário.",
        "Você é a cláusula pétrea do meu coração. Não cabe emenda, não cabe revisão, apenas o cumprimento integral do nosso afeto.",
        "O veredito da minha vida foi dado no dia em que te conheci: culpado por te amar além de qualquer jurisdição.",
        "A produtividade do meu coração atinge recordes toda vez que recebo um sinal seu. Você é o meu melhor insumo.",
        "Nossa conexão é como um solo de alta fertilidade: exige cuidado, mas a colheita é a mais doce que a vida já produziu.",
        "Mesmo sem o toque físico, nossa fotossíntese acontece através das palavras. Você é a luz que aciona o meu crescimento.",
        "O Vade Mecum do meu afeto tem apenas uma lei: o bem-estar da Thamiris acima de todas as coisas.",
        "Não há embargo que impeça o crescimento do que plantamos. Nossa história é solo protegido, área de preservação permanente.",
        "A logística do destino pode ser complexa, mas a colheita do nosso primeiro abraço será o evento do século.",
        "Você é a semente mais rara: aquela que floresce no deserto da distância e perfuma toda a minha vida.",
        "O solo do meu coração foi preparado com paciência para receber a cultura mais preciosa: você.",
        "Nossa conexão é cláusula pétrea: não admite revisão, não admite retrocesso, apenas soberania.",
        "Como um agrônomo cuida da terra, eu cuido do nosso nós: com técnica, zelo e amor profundo.",
        "Você é o meu veredito de felicidade absoluta, sem possibilidade de recurso ou apelação.",
        "Suas raízes em mim são tão profundas que nenhuma intempérie do mundo consegue te arrancar.",
        "Não somos um plantio de temporada; somos uma floresta nativa de sentimentos inesgotáveis.",
        "A produtividade da minha alma triplicou desde que você se tornou o meu insumo principal.",
        "Você é o direito adquirido que eu defendo com unhas e dentes perante qualquer tribunal da vida.",
        "O adubo do nosso amor é a confiança; a colheita será a nossa vida inteira sob o mesmo teto.",
        "Sua voz é o nutriente que faltava para que meu dia pudesse realizar a fotossíntese completa.",
        "Nossa história é um contrato de adesão onde o coração aceitou todas as cláusulas de primeira.",
        "Você não é apenas um plano; você é a execução de um projeto de vida que deu certo.",
        "Em cada 'bom dia' seu, encontro a base legal para ser o homem mais feliz do planeta.",
        "O zoneamento do meu peito é exclusivo seu: área de proteção ambiental para o nosso afeto.",
        "Se a vida é um processo, você é a sentença favorável que eu esperei a vida inteira para ler.",
        "Sua existência em minha vida é o milagre da germinação: transformou o seco em jardim.",
        "Você é a minha melhor tese; o argumento imbatível de que o amor verdadeiro ainda existe.",
        "Não há praga ou geada que destrua o que cultivamos com a verdade dos nossos olhos.",
        "O Vade Mecum do nosso amor diz que a prioridade máxima é o seu sorriso, sempre.",
        "Nossa conexão é de alta linhagem, semente selecionada pelos deuses para vingar no tempo.",
        "Você é o meu patrimônio afetivo inalienável; ninguém tira, ninguém mexe, ninguém copia.",
        "Cultivo você no meu pensamento com a precisão de quem sabe que a colheita será o paraíso.",
        "Onde houver Thamiris, haverá florescimento. Você é a vida em sua forma mais vibrante.",
        "O foro competente para julgar nosso amor é o abraço, e a sentença é sempre a união.",
        "Você é a irrigação que salva o meu deserto pessoal nos dias em que a saudade aperta.",
        "Nossa história tem validade jurídica no céu e eficácia prática em cada batida do meu coração.",
        "Sou um engenheiro da nossa felicidade, construindo alicerces de rocha para o seu descanso.",
        "A biodiversidade dos seus sorrisos é o que mantém o ecossistema da minha paz em equilíbrio.",
        "Você é a Nata, o Suprassumo, o ápice da criação. E eu sou o homem que teve a honra de te plantar em mim.",
        "Você é o meu melhor manejo: aquele que transformou um solo bruto na terra mais fértil que um homem já teve a honra de cultivar.",
        "Nossa união é um contrato de trato sucessivo: cada dia que passa, o valor do que sinto por você se multiplica sem limites.",
        "Não existem vícios redibitórios no nosso amor; ele é perfeito em todas as suas formas, cores e essências.",
        "Você é a variedade de semente mais resistente do mundo: suporta a distância, vence o tempo e floresce com uma beleza única.",
        "Minha lealdade a você é incondicional, como uma norma de ordem pública que nenhum evento externo pode revogar.",
        "O monitoramento da nossa felicidade indica um rendimento de 100%. Você é a safra que eu esperei a vida inteira para colher.",
        "Você é o meu direito de superfície: o chão onde eu piso e o céu que eu alcanço. Tudo em mim pertence a você.",
        "A biodiversidade dos seus sorrisos é o que protege o meu ecossistema pessoal contra qualquer tristeza ou desânimo.",
        "Como uma reserva legal, o meu amor por você é intocável, protegido por leis que só o coração conhece.",
        "Você é a sentença transitada em julgado da minha busca pelo amor: não cabe mais recurso, você é a minha decisão final.",
        "Nossa conexão tem a força de uma escritura pública lavrada nas estrelas: imutável, solene e eterna.",
        "O plantio foi feito com verdade, a irrigação é feita com saudade e a colheita será a nossa vida inteira juntos.",
        "Você é o suprassumo da criação, a prova de que a natureza e o destino atingiram a perfeição quando te desenharam para mim.",
        "Você é a minha melhor prática agrícola: aquela que transformou um solo bruto na terra mais fértil que um homem já teve a honra de cultivar.",
        "Nossa união é um contrato de trato sucessivo: cada dia que passa, o valor do que sinto por você se multiplica sem limites.",
        "Não existem vícios redibitórios no nosso amor; ele é perfeito em todas as suas formas, cores e essências.",
        "Você é a variedade de semente mais resistente do mundo: suporta a distância, vence o tempo e floresce com uma beleza única."
    ],
    futuro: [
        { t: "O PRIMEIRO ABRAÇO EM SOLO GOIANO", d: "Válido para o momento em que a distância física se tornar zero. Sem expiração.", c: "CO-GYN-001" },
        { t: "JANTAR À LUZ DE VELAS EM COLOMBO", d: "Válido para quando eu puder te apresentar o frio do sul, aquecida pelo meu peito.", c: "SUL-AFETO-002" },
        { t: "PASSEIO PELOS CAMPOS DE FLORES", d: "Como agrônomo, prometo te levar onde a natureza mostra sua melhor forma.", c: "SAFRA-AMOR-003" },
        { t: "UMA TARDE DE ESTUDOS LADO A LADO", d: "Válido para quando o seu Vade Mecum e os meus mapas dividirem a mesma mesa.", c: "LEI-VIDA-004" },
        { t: "CAFÉ DA MANHÃ SEM TELA", d: "Válido para o primeiro dia em que acordarmos e não precisarmos de Wi-Fi para nos ver.", c: "REALIDADE-005" },
        { t: "CERTIFICADO DE POSSE DEFINITIVA", d: "Válido para a entrega simbólica das chaves do meu futuro em suas mãos.", c: "PLENO-DIREITO-006" },
        { t: "VALE-DESCANSO NO MEU COLO", d: "Válido para quando o mundo estiver pesado e você precisar de um santuário físico.", c: "PORTO-SEGURO-007" },
        { t: "CAFÉ COM VADE MECUM", d: "Válido para uma manhã onde eu preparo o café enquanto você revisa suas leis. Silêncio e cumplicidade.", c: "LAW-COFFEE-08" },
        { t: "EXPEDIÇÃO AGRONÔMICA", d: "Um passeio onde eu te mostro como a natureza obedece ao amor, assim como eu obedeço ao seu olhar.", c: "AGRO-TOUR-08" },
        { t: "DIA SEM WI-FI", d: "Válido para 24 horas onde a única conexão permitida será o toque das nossas mãos.", c: "OFFLINE-10" },
        { t: "O JANTAR DA VITÓRIA", d: "Comemoração por uma conquista sua. O cardápio? O que você quiser. O brinde? Nós.", c: "VICTORY-11" },
        { t: "CINEMA NO COLO", d: "Válido para um filme que não assistiremos, porque estarei ocupado demais admirando seu perfil.", c: "MOVIE-12" },
        { t: "PASSAGEM SÓ DE INDA", d: "O voucher simbólico para o dia em que a mala vier para ficar. Sem despedidas no aeroporto.", c: "FINAL-DEST-13" },
        { t: "MASSAGEM PÓS-PROVA", d: "Válido para o alívio de toda a tensão dos estudos. Minhas mãos, seu relaxamento total.", c: "RELAX-14" },
        { t: "DANÇA NA SALA", d: "Válido para uma música lenta, luz baixa e o tempo parando enquanto a gente rodopia.", c: "DANCE-15" },
        { t: "PIQUENIQUE NO CAMPO", d: "Válido para um dia de sol, grama sob os pés e o seu riso ecoando ao ar livre.", c: "PICNIC-16" },
        { t: "VOTO DE SILÊNCIO", d: "Válido para aqueles dias em que palavras não bastam e apenas o estar perto cura tudo.", c: "SILENCE-17" },
        { t: "TOUR GASTRONÔMICO", d: "Válido para explorarmos os sabores de Goiânia (ou Colombo) como se fôssemos turistas do amor.", c: "FOOD-18" },
        { t: "CAFÉ NA CAMA", d: "Válido para uma manhã de domingo preguiçosa, onde o mundo lá fora não existe.", c: "SUNDAY-19" },
        { t: "ABRAÇO DE 5 MINUTOS", d: "Voucher para um abraço ininterrupto, recarregando nossas baterias de alma.", c: "RECHARGE-20" },
        { t: "SURPRESA NO MEIO DO DIA", d: "Válido para um momento inesperado onde eu apareço só para te lembrar o quanto você é amada.", c: "SURPRISE-21" },
        { t: "PROJETO NOSSA CASA", d: "Uma tarde dedicada a sonhar com cada móvel e cada cor do nosso futuro lar.", c: "DREAM-22" },
        { t: "NOITE DE VINHO E LEIS", d: "Você explica os artigos, eu sirvo o vinho e a gente termina a noite celebrando a vida.", c: "WINE-LAW-23" },
        { t: "CAMINHADA AO PÔR DO SOL", d: "Válido para mãos dadas enquanto o céu faz o show que a gente sempre vê separado.", c: "SUNSET-24" },
        { t: "CHEIRO NO CANGOTE", d: "Voucher para um carinho que faz arrepiar e esquecer qualquer problema do mundo.", c: "AFFECTION-25" },
        { t: "VOUCHER DA PAZ", d: "Válido para encerrar qualquer discussão com um beijo e a frase 'eu te amo mais'.", c: "PEACE-26" },
        { t: "CONTAÇÃO DE HISTÓRIAS", d: "Válido para lembrarmos de como tudo começou e rirmos dos nossos primeiros nervosismos.", c: "HISTORY-27" },
        { t: "SPA CASEIRO", d: "Eu cuido de você da cabeça aos pés. Máscara facial, pés na água e muito mimo.", c: "SPA-28" },
        { t: "FOTO PARA O PORTA-RETRATO", d: "Válido para um registro que vai direto para a parede da nossa casa futura.", c: "PHOTO-29" },
        { t: "VALE-DORMIR JUNTO", d: "Sentir sua respiração calma ao meu lado até o sol nascer. Sem pressa.", c: "SLEEP-30" },
        { t: "FESTA PARTICULAR", d: "Só nós dois, nossa música favorita e a alegria de sermos quem somos juntos.", c: "PARTY-31" },
        { t: "PRESENTINHO SEM DATA", d: "Válido para um mimo que não precisa de aniversário para acontecer. Porque você merece.", c: "GIFT-32" },
        { t: "ABRAÇO QUE CURA TUDO", d: "Específico para dias difíceis. Onde o meu peito se torna o seu porto seguro.", c: "HEAL-33" },
        { t: "PLANTIO SIMBÓLICO", d: "Válido para plantarmos uma árvore juntos. Ela crescerá como o nosso amor.", c: "PLANT-34" },
        { t: "LEITURA COMPARTILHADA", d: "Eu leio para você enquanto você descansa a cabeça no meu colo.", c: "READ-35" },
        { t: "OLHAR NO OLHO", d: "Válido para 10 minutos de silêncio apenas admirando a alma um do outro através dos olhos.", c: "SOUL-36" },
        { t: "CERTIFICADO DE POSSE ETERNA", d: "Este voucher garante que meu coração é seu em regime de exclusividade vitalícia.", c: "ETERNAL-37" },
        { t: "VISITA TÉCNICA AO CORAÇÃO", d: "Voucher para um dia inteiro onde eu sou o seu guia e o seu refúgio. Sem distrações.", c: "AGRO-HEART-38" },
        { t: "ACÓRDÃO DA FELICIDADE", d: "Válido para um momento de celebração oficial da nossa união perante todos que amamos.", c: "FINAL-RULE-39" },
        { t: "DEGUSTAÇÃO DE SAFRA ESPECIAL", d: "Válido para um jantar onde celebraremos o sucesso de um projeto nosso. Brinde à nossa resiliência.", c: "PREMIUM-40" },
        { t: "CONSULTORIA DE ABRAÇO", d: "Voucher para quando você precisar de um suporte técnico emocional. Atendimento imediato e vitalício.", c: "SUPPORT-41" },
        { t: "EXPEDIÇÃO AO PÔR DO SOL", d: "Válido para um momento onde o único mapa que seguiremos será o da nossa intuição.", c: "MAP-LOVE-42" },
        { t: "VALE-DOMINGO DE CHUVA", d: "Válido para ficarmos enrolados no cobertor, ouvindo o som da água e o som do nosso amor.", c: "RAINY-43" },
        { t: "CONTRATO DE CARINHO", d: "Voucher que garante 1000 beijos por dia, com cláusula de renovação automática a cada manhã.", c: "KISS-LAW-44" },
        { t: "RESERVA DE LUGAR NO PEITO", d: "Válido para o resto da vida. O lugar mais seguro do mundo está sempre à sua disposição.", c: "SAFE-PLACE-45" },
        { t: "TOUR PELA NOSSA HISTÓRIA", d: "Válido para revisitarmos os lugares onde nossas conversas mudaram nossas vidas para sempre.", c: "TIMELINE-46" },
        { t: "VOUCHER DO REENCONTRO", d: "Específico para aquele segundo exato em que eu te ver no desembarque e o mundo parar.", c: "ARRIVAL-47" },
        { t: "VALE-SORRISO INESPERADO", d: "Eu prometo fazer algo só para ver aquele seu brilho nos olhos que desconcerta o meu juízo.", c: "GIFT-SMILE-48" },
        { t: "CERTIFICADO DE ADMIRAÇÃO", d: "Válido para o dia em que eu vou te listar 50 motivos (um para cada relíquia) do porquê você é a mulher da minha vida.", c: "ADMIRATION-49" },
        { t: "O VOUCHER INFINITO", d: "Este bilhete não expira e não tem limites. Ele vale para absolutamente tudo o que nos faça feliz.", c: "ETERNAL-50" },
        { t: "VALE-PRIMEIRA DANÇA", d: "Válido para o momento em que a música começar e nossos corpos se encontrarem sem nenhuma preocupação além de sentir o outro.", c: "FIRST-DANCE-51" },
        { t: "ABRAÇO DE BOAS-VINDAS", d: "Válido para o instante em que nos encontrarmos novamente, seja no aeroporto ou na porta de casa.", c: "WELCOME-52" },
        { t: "VALE-ENCONTRO SURPRESA", d: "Válido para um dia em que eu apareço sem avisar, só para te lembrar o quanto você é amada.", c: "SURPRISE-53" },
        { t: "DIA DE FOLGA JUNTOS", d: "Válido para um dia inteiro onde o único compromisso é aproveitar a companhia um do outro.", c: "DAY-OFF-54" },
        { t: "VALE-PRIMEIRO BEIJO", d: "Válido para o momento em que nossos lábios se encontram pela primeira vez, sem pressa e com todo o amor do mundo.", c: "FIRST-KISS-55" },
        { t: "VALE-ABRAÇO DE DESPEDIDA", d: "Válido para o instante em que nos despedirmos novamente, seja no aeroporto ou na porta de casa. Porque cada despedida é um 'até logo'.", c: "GOODBYE-56" },
        { t: "VALE-ENCONTRO INESPERADO", d: "Válido para um dia em que eu apareço sem avisar, só para te lembrar o quanto você é amada.", c: "SURPRISE-57" }
    ],
};

function abrirReliquia(tipo) {
    if (localStorage.getItem('santuario_vitoria_dia') !== new Date().toLocaleDateString('pt-BR')) {
        mostrarToast("🔒 Relíquia Selada. Vença o desafio do dia para colher este prêmio!"); return;
    }
    const modal = document.getElementById('modal-reliquia');
    const corpo = document.getElementById('corpo-modal');
    if(!modal || !corpo) return;
    
    // LÓGICA DE ESCALABILIDADE 2026
    // Usamos o dia do ano para garantir que cada dia tenha uma combinação diferente
    const agora = new Date();
    const inicioAno = new Date(agora.getFullYear(), 0, 0);
    const diff = agora - inicioAno;
    const diaDoAno = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    corpo.innerHTML = ''; 

    if (tipo === 'musica') {
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 5px; font-family: 'Playfair Display', serif;">Nossa Trilha</h3>
            <p style="font-size: 11px; opacity: 0.6; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Sincronia de Almas</p>
            <iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/00h463A5jtiPGnlLzCu2Em?utm_source=generator" width="100%" height="352" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    } 
    else if (tipo === 'ceu') {
        const textoCeu = BIBLIOTECA_RELIQUIAS.ceu[diaDoAno % BIBLIOTECA_RELIQUIAS.ceu.length];
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 15px; font-family: 'Playfair Display', serif;">Mesmo Céu</h3>
            <div class="modal-ceu">
                <span style="font-size: 3rem; display: block; margin-bottom: 10px;">🌕</span>
                <p>"${textoCeu}"</p>
            </div>`;
    }
    else if (tipo === 'cartas') {
        const textoSemente = BIBLIOTECA_RELIQUIAS.sementes[diaDoAno % BIBLIOTECA_RELIQUIAS.sementes.length];
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 15px; font-family: 'Playfair Display', serif;">Semente Exclusiva</h3>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 25px; position: relative;">
                <span style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); font-size: 24px;">✉️</span>
                <p style="font-style:italic; font-size: 1.1rem; line-height: 1.6; margin-top: 10px;">"${textoSemente}"</p>
                <div style="margin-top: 20px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 15px; text-align: right;">
                    <p style="font-family: 'Playfair Display', serif; color: var(--cor-primaria);">Com amor,<br>${NOME_PARCEIRO}</p>
                </div>
            </div>`;
    }
    else if (tipo === 'encontro') {
        const v = BIBLIOTECA_RELIQUIAS.futuro[diaDoAno % BIBLIOTECA_RELIQUIAS.futuro.length];
        corpo.innerHTML = `
            <div class="bilhete-dourado">
                <div class="bilhete-dourado-inner">
                    <div class="bilhete-header">Voucher Vitalício</div>
                    <div class="bilhete-corpo">
                        Vale para:
                        <div class="bilhete-destaque">${v.t}</div>
                        ${v.d}
                    </div>
                    <div style="margin-top: 20px; font-size: 0.7rem; opacity: 0.5; font-family: monospace;">
                        ID: ${v.c}-${diaDoAno}-2026
                    </div>
                </div>
            </div>`;
    }
    
    modal.classList.remove('escondido');
}

function fecharModal() {
    document.getElementById('modal-reliquia').classList.add('escondido');
    document.getElementById('corpo-modal').innerHTML = ''; 
}

// 8. HUB DE JOGOS & SINCRONIA
function abrirJogo(tipo) {
    document.getElementById('menu-jogos').classList.add('escondido');
    document.getElementById('header-jogos-main').classList.add('escondido'); // Esconde o Header ao entrar no jogo
    document.querySelectorAll('[id^="container-"]').forEach(t => t.classList.add('escondido'));
    
    const container = document.getElementById(`container-${tipo}`);
    if(container) {
        container.classList.remove('escondido');
        if(tipo === 'termo') inicializarTermo();
        if(tipo === 'sincronia') gerarNovaPergunta(); 
    }
}

function voltarMenuJogos() {
    document.querySelectorAll('[id^="container-"]').forEach(t => t.classList.add('escondido'));
    document.getElementById('menu-jogos').classList.remove('escondido');
    document.getElementById('header-jogos-main').classList.remove('escondido'); // Volta o Header Jogos
    atualizarDinamicaHome(); // Fix da persistência dos badges
}

const perguntasSincronia = [
    "Qual é a memória mais vívida que você tem de nós dois no início?",
    "Se pudéssemos projetar nossa casa ideal hoje, qual detalhe não poderia faltar?",
    "Qual é a nossa melhor memória juntos?",
    "O que você mais admira em mim?",
    "Qual é o nosso maior sonho como casal?",
    "Como você descreveria nós como um time?",
    "Se pudéssemos viajar para qualquer lugar do mundo amanhã, para onde iríamos?",
    "O que eu faço que, sem eu saber, faz você se sentir mais amada?",
    "Qual característica minha você acha que mais combina com a sua?",
    "Qual foi o momento em que você sentiu mais orgulho de nós como um time?",
    "Se pudéssemos viajar para qualquer lugar do mundo amanhã, para onde iríamos?",
    "Qual cheiro te lembra de mim?",
    "Se a nossa história fosse um filme, qual seria o título?",
    "O que você gostaria de aprender a fazer comigo?",
    "Qual música te faz pensar em mim instantaneamente?",
    "Se você pudesse me dar um superpoder, qual seria?",
    "Qual foi a maior loucura que já fez por amor (e se arrependeu ou não)?",
    "Se o nosso amor fosse uma comida, qual seria?",
    "Que lugarzinho secreto na sua cidade você sonha em me mostrar?",
    "Qual foi o momento em que você pensou 'é com essa pessoa que quero passar o resto da vida'?",
    "Se você pudesse reviver um dia nosso, qual escolheria?",
    "Qual foi o momento exato em que você percebeu que éramos um 'caso julgado'?",
    "Se nosso amor fosse uma semente, qual seria o fruto da nossa colheita?",
    "Qual é a 'cláusula pétrea' (que nunca muda) do nosso relacionamento?",
    "Qual viagem para o interior você mais quer fazer comigo?",
    "Qual é o nosso prato favorito para dividir em um domingo de sol?",
    "Qual música do Flamengo mais faz você lembrar da nossa energia juntos?",
    "Quem é mais provável de ganhar uma discussão: a lógica do engenheiro ou os argumentos da advogada?",
    "Qual 'safra' da nossa história você mais gosta de recordar?",
    "Se tivéssemos que escrever o nosso próprio código de leis, qual seria a Lei nº 1?",
    "Qual é o nosso refúgio favorito quando o mundo parece barulhento demais?",
    "Qual característica minha você acha que 'germinou' em você ao longo do tempo?",
    "No tribunal do nosso amor, qual é a sentença para quem fica com saudade demais?",
    "Qual é o cheiro que mais te faz lembrar de mim?",
    "Qual é o nosso maior 'projeto de vida' para os próximos 5 anos?",
    "Praia com o sol de Goiânia ou serra com o frio de Colombo?",
    "Quem de nós é mais provável de se perder no meio de uma lavoura?",
    "Qual é o segredo para a nossa produtividade de felicidade ser sempre alta?",
    "Qual é a mania do outro que você secretamente acha fofa?",
    "Se nosso relacionamento fosse um time, quem seria o capitão e quem seria o camisa 10?",
    "Qual filme ou série define perfeitamente o nosso enredo?",
    "Qual 'recurso' você usaria para adiar o fim de um final de semana juntos?",
    "Qual semente de sonho nós plantamos recentemente e você quer ver crescer?",
    "Qual é a palavra que melhor resume o que sentimos quando estamos em silêncio?",
    "Quem é mais provável de esquecer onde estacionou o carro no shopping?",
    "Qual é a nossa 'jurisprudência': um erro que nos ensinou a sermos melhores hoje?",
    "Se pudéssemos criar um feriado nacional para o nosso dia, como ele seria?",
    "Qual é a característica que faz de nós o solo perfeito para o par ideal?",
    "O que você acha que eu ainda não descobri sobre você?",
    "Qual a sua tradição favorita que já criamos juntos?",
    "Se a gente pudesse ter um animal de estimação agora, qual seria e por quê?",
    "Que medo você já superou por minha causa?",
    "Qual foi a primeira impressão (a petição inicial) que você teve de mim?",
    "Se você pudesse me dar um apelido novo hoje, qual seria?",
    "O que você diria para o seu 'eu' do passado no dia em que nos conhecemos?"
    "O que você mais admira na forma como eu trato as pessoas?",
    "Se a gente fosse escrever um livro juntos, sobre o que seria?",
    "Qual defeito meu você acha que, na verdade, é uma qualidade?",
    "Que sonho seu eu ainda não conheço?",
    "Se pudéssemos fazer uma doação para uma causa juntos, qual escolheríamos?",
    "Qual é a primeira coisa que faremos quando a distância entre Colombo e Goiânia for zero?",
    "Se você tivesse que descrever nosso amor em três palavras, quais seriam?"
];

function gerarNovaPergunta() {
    const indiceAleatorio = Math.floor(Math.random() * perguntasSincronia.length);
    const textoElemento = document.getElementById('texto-pergunta');
    if (textoElemento) {
        textoElemento.style.opacity = 0;
        setTimeout(() => { textoElemento.innerText = perguntasSincronia[indiceAleatorio]; textoElemento.style.opacity = 1; }, 300);
    }
}

// 9. LEIS (Alteração 4: Divisões e Títulos de Volta)
const URL_LEIS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1Rr4fdzLLW-Xu4jrf7qotZ_r67mOJrTDQxtZMKxUF8UijZI0Uxj3dwnjzaX_I7dq5MpEepB3SjsMI/pub?gid=1219842239&single=true&output=csv";

async function carregarLeis() {
    try {
        const res = await fetch(URL_LEIS);
        const txt = await res.text();
        const linhas = txt.split(/\r?\n/).filter(l => l.trim()).slice(1);
        const container = document.querySelector(".lista-leis");
        if (!container) return;
        
        container.innerHTML = ""; 
        linhas.forEach(linha => {
            const colunas = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (colunas.length >= 2) {
                const art = colunas[0].replace(/"/g, '').trim();
                const cont = colunas[1].replace(/"/g, '').trim();
                const par = colunas[2] ? colunas[2].replace(/"/g, '').trim() : "";
                
                // Inserção das Divisões (Títulos)
                if (art.includes("Art. 1º") || art.includes("Art. 1°")) {
                    container.innerHTML += `<div class="titulo-divisao">TÍTULO I<small>Dos Direitos Fundamentais</small></div>`;
                } else if (art.includes("Art. 4º") || art.includes("Art. 4°")) {
                    container.innerHTML += `<div class="titulo-divisao">TÍTULO II<small>Das Obrigações e Prestações</small></div>`;
                } else if (art.includes("Art. 7º") || art.includes("Art. 7°")) {
                    container.innerHTML += `<div class="titulo-divisao">TÍTULO III<small>Das Penalidades e Disposições Finais</small></div>`;
                }

                const item = document.createElement("div");
                item.className = "item-lei";
                item.innerHTML = `<span class="num-artigo">${art}</span><p>${cont}</p>${par ? `<small>§ Único: ${par}</small>` : ""}`;
                container.appendChild(item);
            }
        });
    } catch (e) { }
}

// 10. DINÂMICA DA HOME E INICIALIZAÇÃO (Alteração 2: Conserto do Sumiço dos Badges)
function atualizarDinamicaHome() {
    const elStreak = document.getElementById("streak-jardim");
    const elAtalhoCofre = document.getElementById("atalho-cofre");
    const txtStreak = document.getElementById("texto-streak");
    const hoje = new Date().toLocaleDateString('pt-BR');

    // Recupera dados frescos
    let dadosPlanta = { sequencia: 0 };
    const dadosSalvos = localStorage.getItem('statusPlanta_v2');
    if (dadosSalvos) dadosPlanta = JSON.parse(dadosSalvos);

    // Remove ou adiciona a classe Escondido com base na realidade
    if (elStreak) {
        if (dadosPlanta.sequencia > 0) {
            elStreak.classList.remove("escondido");
            if (txtStreak) txtStreak.innerText = `${dadosPlanta.sequencia} ${dadosPlanta.sequencia === 1 ? 'dia' : 'dias'} de florescimento`;
            const icone = elStreak.querySelector('.icone-badge');
            if (icone) {
                if (dadosPlanta.sequencia >= 7) icone.innerText = "🔥";
                else if (dadosPlanta.sequencia >= 3) icone.innerText = "🌿";
                else icone.innerText = "🌱";
            }
        } else {
            elStreak.classList.add("escondido");
        }
    }

    const ganhouHoje = localStorage.getItem('santuario_vitoria_dia') === hoje;
    
    if (elAtalhoCofre) {
        if (ganhouHoje) elAtalhoCofre.classList.remove("escondido");
        else elAtalhoCofre.classList.add("escondido");
    }

    const msgCofre = document.getElementById('msg-cofre');
    const itensCofre = document.querySelectorAll('.item-cofre');

    if (ganhouHoje) {
        if (msgCofre) msgCofre.innerText = "Acesso Concedido para Hoje";
        itensCofre.forEach(item => { item.classList.remove('bloqueado'); const s = item.querySelector('.status-reliquia'); if (s) s.innerText = "Disponível"; });
    } else {
        if (msgCofre) msgCofre.innerText = "Vença o desafio diário para desbloquear";
        itensCofre.forEach(item => { item.classList.add('bloqueado'); const s = item.querySelector('.status-reliquia'); if (s) s.innerText = "Trancado"; });
    }
}

function mostrarToast(mensagem) {
    const toast = document.getElementById('toast-mensagem');
    toast.innerText = mensagem;
    toast.classList.remove('escondido');
    setTimeout(() => {
        toast.classList.add('escondido');
    }, 2000);
}

// ==========================================
// 11. MENSAGEM SURPRESA DIÁRIA
// ==========================================

// Chave para o localStorage
const STORAGE_SURPRESA = 'santuario_surpresa_diaria';

function inicializarSurpresaDiaria() {
    const hoje = new Date().toLocaleDateString('pt-BR'); // formato dd/mm/aaaa
    const dadosSalvos = localStorage.getItem(STORAGE_SURPRESA);
    const btn = document.getElementById('btn-surpresa');
    const paragrafo = document.getElementById('texto-surpresa');

    if (!btn || !paragrafo) return; // segurança

    if (dadosSalvos) {
        const { data, mensagem } = JSON.parse(dadosSalvos);
        
        // Se a data salva for igual a hoje, já usou hoje
        if (data === hoje) {
            // Exibe a mensagem salva
            paragrafo.innerText = `"${mensagem}"`;
            // Desabilita o botão
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            // Data diferente: pode usar novamente
            paragrafo.innerText = ''; // limpa mensagem antiga
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        }
    } else {
        // Nunca usou: botão habilitado, mensagem vazia
        paragrafo.innerText = '';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
}

function mostrarMensagemSurpresa() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const dadosSalvos = localStorage.getItem(STORAGE_SURPRESA);
    const btn = document.getElementById('btn-surpresa');
    const paragrafo = document.getElementById('texto-surpresa');

    if (!btn || !paragrafo) return;

    // Verifica se já usou hoje
    if (dadosSalvos) {
        const { data } = JSON.parse(dadosSalvos);
        if (data === hoje) {
            // Já usou hoje: avisa com toast
            mostrarToast("✨ Você já recebeu sua mensagem de hoje! Volte amanhã.");
            return;
        }
    }

    // Se chegou aqui, pode gerar nova mensagem
    // Junta todas as mensagens das relíquias (exceto futuros, que são objetos)
    const todasMensagens = [
        ...BIBLIOTECA_RELIQUIAS.ceu,
        ...BIBLIOTECA_RELIQUIAS.sementes
    ];
    
    // Escolhe uma mensagem aleatória
    const indiceAleatorio = Math.floor(Math.random() * todasMensagens.length);
    const mensagemEscolhida = todasMensagens[indiceAleatorio];
    
    // Exibe no parágrafo
    paragrafo.innerText = `"${mensagemEscolhida}"`;
    
    // Salva no localStorage
    const dadosParaSalvar = {
        data: hoje,
        mensagem: mensagemEscolhida
    };
    localStorage.setItem(STORAGE_SURPRESA, JSON.stringify(dadosParaSalvar));
    
    // Desabilita o botão
    btn.disabled = true;
    btn.style.opacity = '0.5';
    btn.style.cursor = 'not-allowed';
}

// Boot do Sistema
window.addEventListener('DOMContentLoaded', () => {
    atualizarJardim();
    setInterval(atualizarMotorDoTempo, 1000);
    atualizarMotorDoTempo();
    atualizarDinamicaHome();
    configurarNavegacao();
    carregarDadosExternos();
    carregarLeis(); 
    atualizarClima();
    atualizarContadorVisual(); 
// Inicializa a mensagem surpresa diária
    inicializarSurpresaDiaria();

// Configura o botão de mensagem surpresa
const btnSurpresa = document.getElementById("btn-surpresa");
if (btnSurpresa) {
    btnSurpresa.onclick = mostrarMensagemSurpresa;
}

});



