// ==========================================
// SANTUÁRIO - O MOTOR DIGITAL
// ==========================================

if (window.__SANTUARIO_SCRIPT_CARREGADO) {
  console.warn('Script já carregado. Ignorando segunda execução.');
} else {
  window.__SANTUARIO_SCRIPT_CARREGADO = true;

const dataInicio = new Date("2025-10-29T16:30:00").getTime();

// Variáveis globais (serão preenchidas pelo login)
window.usuarioLogado = null;
window.souJoao = false;
window.MEU_NOME = "";
window.NOME_PARCEIRO = "";

// ==========================================
// SISTEMA PARA O PULSO (usa Firebase)
// ==========================================
window.SantuarioApp = window.SantuarioApp || {};
window.SantuarioApp.inicializado = false;
window.SantuarioApp.modulos = null;
window.SantuarioApp.conectar = function() {
    if (!this.inicializado || !this.modulos) return;
    const { db, ref, onValue } = this.modulos;
    console.log("Satélite do Santuário Conectado!");

    const refPulsoParceiro = ref(db, 'pulsos/' + NOME_PARCEIRO.toLowerCase());
    onValue(refPulsoParceiro, (snapshot) => {
        const dados = snapshot.val();
        if (dados && dados.timestamp > window.ultimoPulsoRecebido) {
            window.ultimoPulsoRecebido = dados.timestamp;
            receberPulsoVisual();
        }
    });

    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const refContadorParceiro = ref(db, 'pulsosContador/' + NOME_PARCEIRO.toLowerCase() + '/' + hoje);
    onValue(refContadorParceiro, (snapshot) => {
        const contador = snapshot.val() || 0;
        atualizarContadorInterface(contador);
    });

    const refJardim = ref(db, 'jardim_global');
    onValue(refJardim, (snapshot) => {
        if (snapshot.exists()) {
            statusPlanta = snapshot.val();
            renderizarPlanta();
        } else {
            statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", sequencia: 0, ciclos: 0 };
            renderizarPlanta();
        }
    });
};
// ==========================================

let statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", ultimaVerificacao: Date.now(), sequencia: 0, ciclos: 0 };
let audioJogos = null;
let audioJogosMuted = localStorage.getItem('audio_jogos_muted') === 'true';
let telaAtual = 'home';

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
    } catch (e) {
        console.error("Erro planilha:", e);
    }
}

// 3. NAVEGAÇÃO SPA
function configurarNavegacao() {
    const botoesMenu = document.querySelectorAll('.item-menu');
    const todasAsTelas = document.querySelectorAll('.tela');

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            evento.preventDefault();
            const telaAlvo = botao.getAttribute('data-alvo');
            
            if (telaAlvo === telaAtual) return;

            const telaAnterior = telaAtual;

            botoesMenu.forEach(b => b.classList.remove('ativo'));
            botao.classList.add('ativo');

            todasAsTelas.forEach(tela => tela.classList.add('escondido'));
            const elementoTela = document.getElementById(telaAlvo);
            if (elementoTela) elementoTela.classList.remove('escondido');

            telaAtual = telaAlvo;

            if (telaAlvo === 'jogos') {
                playAudioJogos();
            } else if (telaAnterior === 'jogos') {
                pauseAudioJogos();
            }

            atualizarDinamicaHome();
        });
    });
}

// 4. JOGO: TERMO (código original)
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
    tabuleiro.innerHTML = "";

    const hoje = new Date().toLocaleDateString('pt-BR');
    const ganhouHoje = localStorage.getItem('santuario_vitoria_dia') === hoje;

    if (ganhouHoje) {
        const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
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

        document.getElementById("teclado-termo").innerHTML = "";
        document.getElementById("btn-verificar").classList.add("escondido");

        const inst = document.getElementById('instrucoes-termo');
        inst.innerHTML = `<h4 style="text-align:center; color: var(--cor-agronomia);">Vitória Colhida! 🌱</h4>
                          <p style="text-align:center;">Volte amanhã para colher uma nova palavra e liberar mais relíquias.</p>`;
        inst.classList.remove('escondido');

        tentativaAtual = 6;
        return;
    }

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
        tabuleiro.appendChild(linha);
    }
    restaurarEstadoTermo();

    gerarTeclado();

    const btnVerificar = document.getElementById('btn-verificar');
    if (btnVerificar) {
        const novoBtn = btnVerificar.cloneNode(true);
        btnVerificar.parentNode.replaceChild(novoBtn, btnVerificar);
        novoBtn.addEventListener('click', verificarPalavra);
    }
}

function gerarTeclado() {
    const tecladoContainer = document.getElementById("teclado-termo");
    if (!tecladoContainer) return;
    const layout = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["⌫", "Z", "X", "C", "V", "B", "N", "M"]
    ];
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
    else if (tecla === "⌫") apagarLetra();
    else adicionarLetra(tecla);
}

function adicionarLetra(letra) {
    if (letraAtual < 5) {
        const quadrado = document.getElementById(`q-${tentativaAtual}-${letraAtual}`);
        if (quadrado) {
            quadrado.innerText = letra;
            grade[tentativaAtual] += letra;
            letraAtual++;
            salvarEstadoTermo();
        }
    }
}

function apagarLetra() {
    if (letraAtual > 0) {
        letraAtual--;
        const quadrado = document.getElementById(`q-${tentativaAtual}-${letraAtual}`);
        if (quadrado) {
            quadrado.innerText = "";
            grade[tentativaAtual] = grade[tentativaAtual].slice(0, -1);
            salvarEstadoTermo();
        }
    }
}

function verificarPalavra() {
    const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
    salvarEstadoTermo();
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
    inicializarTermo();
    liberarCofreVisual();
    atualizarDinamicaHome();
    document.getElementById('tabuleiro-termo').classList.add('vitoria');
}

function resetarTermo() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    sessionStorage.removeItem('termo_estado');
    if (localStorage.getItem('santuario_vitoria_dia') === hoje) {
        return;
    }
    tentativaAtual = 0;
    letraAtual = 0;
    grade = ["", "", "", "", "", ""];
    inicializarTermo();
    const resetContainer = document.getElementById('termo-reset-container');
    if (resetContainer) {
        resetContainer.classList.add('escondido');
    }
}

function restaurarEstadoTermo() {
    const estadoSalvo = sessionStorage.getItem('termo_estado');
    if (estadoSalvo) {
        try {
            const estado = JSON.parse(estadoSalvo);
            tentativaAtual = estado.tentativaAtual;
            letraAtual = estado.letraAtual;
            grade = estado.grade;

            for (let i = 0; i <= tentativaAtual; i++) {
                for (let j = 0; j < 5; j++) {
                    const quadrado = document.getElementById(`q-${i}-${j}`);
                    if (quadrado && grade[i] && grade[i][j]) {
                        quadrado.innerText = grade[i][j];
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
        } catch (e) {
            console.warn('Estado do Termo corrompido. Ignorando...');
            sessionStorage.removeItem('termo_estado');
        }
    }
}

function liberarCofreVisual() {
    const botaoCofre = document.querySelector('[data-alvo="cofre"]');
    if (botaoCofre) {
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

function toggleInstrucoesTermo() {
    document.getElementById('instrucoes-termo').classList.toggle('escondido');
}
function toggleInstrucoesSincronia() {
    document.getElementById('instrucoes-sincronia').classList.toggle('escondido');
}
function toggleInstrucoesJardim() {
    document.getElementById('instrucoes-jardim').classList.toggle('escondido');
}

// 5. CLIMA
const API_KEY = "da54b3d1f91b3ca0850de8cb7890e572";

function obterEmojiClima(condicao, sunrise, sunset) {
    const agora = Math.floor(Date.now() / 1000);
    const eNoite = agora < sunrise || agora > sunset;
    let emoji = '';
    let classe = '';

    switch(condicao) {
        case 'Clear':
            emoji = eNoite ? '🌙' : '☀️';
            classe = eNoite ? 'emoji-lua' : 'emoji-sol';
            break;
        case 'Clouds':
            emoji = '☁️';
            classe = 'emoji-nuvem';
            break;
        case 'Rain':
            emoji = '🌧️';
            classe = 'emoji-chuva';
            break;
        case 'Thunderstorm':
            emoji = '⛈️';
            classe = 'emoji-tempestade';
            break;
        default:
            emoji = '🌡️';
            classe = '';
    }

    return `<span class="${classe}">${emoji}</span>`;
}

async function atualizarClima() {
    const elJoão = document.getElementById("temp-usuario");
    const elThamiris = document.getElementById("temp-thamiris");
    const elMensagem = document.getElementById("texto-mensagem-clima");
    const elIconeClima = document.getElementById("icone-clima");

    try {
        const resJ = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Colombo,BR&units=metric&appid=${API_KEY}`);
        const resT = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Goiania,BR&units=metric&appid=${API_KEY}`);

        if (!resJ.ok || !resT.ok) throw new Error('Erro na API');

        const dJ = await resJ.json();
        const dT = await resT.json();

        if (dJ.main && elJoão) {
            elJoão.innerHTML = `${Math.round(dJ.main.temp)}°C ${obterEmojiClima(dJ.weather[0].main, dJ.sys.sunrise, dJ.sys.sunset)}`;
        }
        if (dT.main && elThamiris) {
            elThamiris.innerHTML = `${Math.round(dT.main.temp)}°C ${obterEmojiClima(dT.weather[0].main, dT.sys.sunrise, dT.sys.sunset)}`;
        }

        if (dT.main && elMensagem) {
            const condicao = dT.weather[0].main;
            const temp = Math.round(dT.main.temp);
            elMensagem.innerText = gerarMensagemClima(condicao, temp);
        }

        if (dT.main && elIconeClima) {
            const condicao = dT.weather[0].main;
            let icone = '⛅';
            switch (condicao) {
                case 'Clear': icone = '☀️'; break;
                case 'Clouds': icone = '☁️'; break;
                case 'Rain': icone = '🌧️'; break;
                case 'Thunderstorm': icone = '⛈️'; break;
                case 'Snow': icone = '❄️'; break;
                case 'Mist': case 'Fog': case 'Haze': icone = '🌫️'; break;
                default: icone = '⛅';
            }
            elIconeClima.innerText = icone;
        }

    } catch (e) {
        if (elJoão) elJoão.innerHTML = "❌ Indisponível";
        if (elThamiris) elThamiris.innerHTML = "❌ Indisponível";
        if (elMensagem) elMensagem.innerText = "❌ Clima indisponível no momento";
        if (elIconeClima) elIconeClima.innerText = '❓';
    }
}

function gerarMensagemClima(condicao, temperatura) {
    const mensagens = {
        Clear: [
            "O céu de Goiânia está lindo hoje, igual você! 🌞",
            "Solzinho aí? Aproveita e manda um raio de luz pra mim! ☀️",
            "Céu limpo em Goiânia – combina com a transparência do meu amor por você."
        ],
        Clouds: [
            "O dia em Goiânia está nublado, mas você continua sendo meu sol ☁️💛",
            "Nublado? Perfeito para um café e uma conversa comigo.",
            "Até as nuvens sabem que você é a parte mais bonita do céu."
        ],
        Rain: [
            "Tá chovendo em Goiânia? Leva guarda-chuva, meu amor! 🌧️☔",
            "Chuva aí? Isso é a natureza regando a saudade que eu tenho de você.",
            "Cada gota dessa chuva é um pensamento meu caindo em você."
        ],
        Thunderstorm: [
            "Tempestade aí? Fica segura e me avisa quando passar! ⛈️❤️",
            "Trovões? Fica calma, estou aqui (mesmo longe). Depois me conta se tá tudo bem.",
            "A força da tempestade não chega aos pés da força do que sinto por você."
        ],
        Snow: [
            "Neve em Goiânia? Isso sim é raro! Se proteger do frio, viu? ❄️",
            "Frio extremo? Hora de me ligar e pedir um abraço virtual."
        ],
        Mist: [
            "Névoa em Goiânia? Parece cenário de filme romântico. Sinto sua falta.",
            "Visibilidade baixa? Não deixa baixar a nossa conexão!"
        ]
    };
    const padrao = [
        "O clima em Goiânia está imprevisível, mas meu amor por você é constante! 🌡️",
        "Seja qual for o tempo, meu pensamento em você não muda.",
        `${temperatura}°C em Goiânia – mas o que esquenta mesmo é meu coração por você.`
    ];
    const lista = mensagens[condicao] || padrao;
    return lista[Math.floor(Math.random() * lista.length)];
}

// ==========================================
// FUNÇÕES DO PULSO E JARDIM
// ==========================================
window.ultimoPulsoRecebido = Date.now();

function enviarPulso() {
    if (!window.SantuarioApp.inicializado || !window.MEU_NOME) {
        mostrarToast("Aguardando identificação... tente novamente.");
        return;
    }
    const { db, ref, set, runTransaction } = window.SantuarioApp.modulos;
    
    const refMeuPulso = ref(db, 'pulsos/' + window.MEU_NOME.toLowerCase());
    set(refMeuPulso, { timestamp: Date.now() });

    const hoje = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    const refMeuContador = ref(db, 'pulsosContador/' + window.MEU_NOME.toLowerCase() + '/' + hoje);
    runTransaction(refMeuContador, (valorAtual) => (valorAtual || 0) + 1);

    const btn = document.getElementById("btn-pulso");
    const icone = document.getElementById("icone-semente");
    const feedback = document.getElementById("msg-feedback");
    const txtContador = document.getElementById("contador-pulso");

    if (icone) icone.innerText = "💖";
    if (btn) btn.classList.add("germinar");
    if (txtContador) txtContador.innerText = "Sintonia enviada pelo espaço...";
    if (feedback) {
        feedback.innerText = "Chegou lá!";
        feedback.classList.add("visivel");
    }

    setTimeout(() => {
        if (icone) icone.innerText = "🌱";
        if (btn) btn.classList.remove("germinar");
        if (feedback) feedback.classList.remove("visivel");
    }, 2500);
}

function receberPulsoVisual() {
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 400]);
    }

    mostrarToast(`💓 ${window.NOME_PARCEIRO} está pensando em você agora!`);

    const btn = document.getElementById("btn-pulso");
    if (btn) {
        btn.style.transition = "all 0.3s";
        btn.style.boxShadow = "0 0 40px #e74c3c, inset 0 0 20px #e74c3c";
        btn.style.borderColor = "#e74c3c";
        
        setTimeout(() => {
            btn.style.boxShadow = "";
            btn.style.borderColor = "";
        }, 4000);
    }
}

function atualizarContadorInterface(quantidade) {
    const elemento = document.getElementById("contador-pulso");
    if (!elemento || !window.NOME_PARCEIRO) return;

    const nome = window.NOME_PARCEIRO;
    const texto = quantidade > 0 
        ? `💖 ${nome} pensou em você ${quantidade} ${quantidade === 1 ? 'vez' : 'vezes'} hoje`
        : `💭 ${nome} ainda não enviou um sinal hoje`;

    if (elemento.innerText !== texto) {
        elemento.style.transition = 'transform 0.2s, color 0.2s';
        elemento.style.transform = 'scale(1.05)';
        elemento.style.color = '#e84342';
        setTimeout(() => {
            elemento.style.transform = 'scale(1)';
            elemento.style.color = '';
        }, 200);
    }

    elemento.innerText = texto;
}

function regarPlanta() {
    if (!window.SantuarioApp.inicializado || !window.MEU_NOME) {
        mostrarToast("Aguardando identificação...");
        return;
    }

    const { db, ref, get, set } = window.SantuarioApp.modulos;
    const refJardim = ref(db, 'jardim_global');

    get(refJardim).then((snapshot) => {
        let dados = snapshot.val() || { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", sequencia: 0, ciclos: 0 };
        
        const agora = new Date();
        const hoje = agora.toLocaleDateString('pt-BR');

        if (dados.diaUltimaRegada === hoje) {
            mostrarToast("A terra já está úmida hoje. Voltem amanhã! 🌱");
            return;
        }

        const ontem = new Date();
        ontem.setDate(agora.getDate() - 1);
        const ontemStr = ontem.toLocaleDateString('pt-BR');

        if (dados.diaUltimaRegada === ontemStr) {
            dados.sequencia += 1;
        } else {
            dados.sequencia = 1;
        }

        dados.nivel += 4;
        if (dados.nivel >= 100) {
            dados.ciclos += 1;
            dados.nivel = 0;
            mostrarToast(`🌸 CICLO COMPLETO! O amor de vocês atingiu um novo nível!`);
        } else {
            mostrarToast(`💦 Planta regada por ${window.MEU_NOME}!`);
        }

        dados.diaUltimaRegada = hoje;
        dados.ultimaRegada = agora.getTime();

        set(refJardim, dados);
    });
}

function renderizarPlanta() {
    const barra = document.getElementById("progresso-crescimento");
    const emoji = document.getElementById("emoji-planta");
    const texto = document.getElementById("status-texto");
    const aviso = document.getElementById("aviso-regada");
    const btn = document.getElementById("btn-regar");
    const contadorCiclos = document.getElementById('contador-ciclos');
    
    if (contadorCiclos) contadorCiclos.innerText = `🌱 Ciclos completados: ${statusPlanta.ciclos || 0}`;
    if (!barra || !emoji || !texto) return;
    
    barra.style.width = statusPlanta.nivel + "%";

    if (statusPlanta.nivel <= 0) {
        emoji.innerText = "🌱";
        texto.innerText = "Um novo ciclo se inicia. Cuidem juntos.";
    } else if (statusPlanta.nivel < 25) {
        emoji.innerText = "🌿";
        texto.innerText = "As raízes estão se firmando.";
    } else if (statusPlanta.nivel < 50) {
        emoji.innerText = "🌳";
        texto.innerText = "Crescimento contínuo e forte.";
    } else if (statusPlanta.nivel < 90) {
        emoji.innerText = "🍃";
        texto.innerText = "A folhagem já provê abrigo e paz.";
    } else {
        emoji.innerText = "🌸";
        texto.innerText = "Prestes a florescer um novo marco!";
    }

    if (statusPlanta.diaUltimaRegada === new Date().toLocaleDateString('pt-BR')) {
        if (btn) btn.style.opacity = "0.5";
        if (aviso) aviso.innerText = "Solo nutrido por hoje. Descansem.";
    } else {
        if (btn) btn.style.opacity = "1";
        if (aviso) aviso.innerText = "A planta aguarda a água de um de vocês.";
    }
}

// Saudação personalizada
function atualizarSaudacao() {
    const agora = new Date();
    const hora = agora.getHours();
    let saudacao = '';

    if (hora >= 6 && hora < 12) {
        saudacao = 'Bom dia, meu amor! 🌞';
    } else if (hora >= 12 && hora < 18) {
        saudacao = 'Boa tarde, princesa! ☀️';
    } else if (hora >= 18 && hora < 24) {
        saudacao = 'Boa noite, meu céu! 🌙';
    } else {
        saudacao = 'Já é madrugada... sonhando com você! 🌜';
    }

    const elSaudacao = document.getElementById('saudacao-personalizada');
    if (elSaudacao) {
        elSaudacao.innerText = saudacao;
    }
}

// ==========================================
// COFRE & RELÍQUIAS (mantenha o seu código original)
// ==========================================
// ... (todo o código existente da BIBLIOTECA_RELIQUIAS, abrirReliquia, fecharModal)

// ==========================================
// 8. HUB DE JOGOS & SINCRONIA
// ==========================================
function abrirJogo(tipo) {
    document.querySelector('nav.menu-inferior').classList.add('escondido');
    document.getElementById('menu-jogos').classList.add('escondido');
    document.getElementById('header-jogos-main').classList.add('escondido');
    document.querySelectorAll('[id^="container-"]').forEach(t => t.classList.add('escondido'));

    const container = document.getElementById(`container-${tipo}`);
    if (container) {
        container.classList.remove('escondido');
        if (tipo === 'termo') inicializarTermo();
        if (tipo === 'sincronia') gerarNovaPergunta();
        if (tipo === 'minifazenda') {
            if (typeof window.iniciarMiniFazenda === 'function') {
                window.iniciarMiniFazenda();
            }
        }
        if (tipo === 'tribunal') {
            if (typeof window.iniciarTribunal === 'function') {
                window.iniciarTribunal();
            }
        }
        if (tipo === 'julgamento') {
            if (typeof window.iniciarJulgamento === 'function') {
                window.iniciarJulgamento();
            }
        }
    }
    document.body.classList.add('modo-jogo-ativo');
    document.body.classList.add('jogo-aberto');
}

function voltarMenuJogos() {
    document.querySelectorAll('[id^="container-"]').forEach(t => t.classList.add('escondido'));
    document.getElementById('menu-jogos').classList.remove('escondido');
    document.querySelector('nav.menu-inferior').classList.remove('escondido');
    document.getElementById('header-jogos-main').classList.remove('escondido');
    atualizarDinamicaHome();
    document.body.classList.remove('modo-jogo-ativo');
    document.body.classList.remove('jogo-aberto');
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
    "O que você diria para o seu 'eu' do passado no dia em que nos conhecemos?",
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
        setTimeout(() => {
            textoElemento.innerText = perguntasSincronia[indiceAleatorio];
            textoElemento.style.opacity = 1;
        }, 300);
    }
}

// 9. LEIS
const URL_LEIS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1Rr4fdzLLW-Xu4jrf7qotZ_r67mOJrTDQxtZMKxUF8UijZI0Uxj3dwnjzaX_I7dq5MpEepB3SjsMI/pub?gid=1219842239&single=true&output=csv";

async function carregarLeis() {
    try {
        const res = await fetch(URL_LEIS);
        const txt = await res.text();
        const linhas = txt.split(/\r?\n/).filter(l => l.trim()).slice(1);
        const container = document.querySelector(".lista-leis");
        if (!container) return;

        container.innerHTML = "";

        linhas.forEach((linha, index) => {
            const colunas = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            if (colunas.length >= 2) {
                const art = colunas[0].replace(/"/g, '').trim();
                const cont = colunas[1].replace(/"/g, '').trim();
                const par = colunas[2] ? colunas[2].replace(/"/g, '').trim() : "";

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
                
                item.style.animationDelay = (index * 0.1) + 's';
                
                container.appendChild(item);
            }
        });

        const dataInicioObj = new Date(dataInicio);
        const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
        const dia = dataInicioObj.getDate();
        const mes = meses[dataInicioObj.getMonth()];
        const ano = dataInicioObj.getFullYear();

        const assinatura = document.createElement('div');
        assinatura.className = 'assinatura-leis';
        assinatura.style.marginBottom = "80px"; 
        assinatura.style.paddingBottom = "env(safe-area-inset-bottom)";
        assinatura.innerHTML = `
            <p>Promulgado em nome do amor, por João, em ${dia} de ${mes} de ${ano}.</p>
            <p class="local-data">Santuário, em toda eternidade.</p>
        `;
        container.appendChild(assinatura);

    } catch (e) { 
        console.error('Erro ao carregar leis:', e);
    }
}

// 10. DINÂMICA DA HOME
function atualizarDinamicaHome() {
    const elStreak = document.getElementById("streak-jardim");
    const elAtalhoCofre = document.getElementById("atalho-cofre");
    const txtStreak = document.getElementById("texto-streak");
    const hoje = new Date().toLocaleDateString('pt-BR');

    let dadosPlanta = { sequencia: 0 };
    const dadosSalvos = localStorage.getItem('statusPlanta_v2');
    if (dadosSalvos) {
        try {
            dadosPlanta = JSON.parse(dadosSalvos);
        } catch (e) {
            console.warn('Dados da planta corrompidos ao atualizar home. Ignorando...');
            localStorage.removeItem('statusPlanta_v2');
        }
    }

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
        itensCofre.forEach(item => {
            item.classList.remove('bloqueado');
            const s = item.querySelector('.status-reliquia');
            if (s) s.innerText = "Disponível";
        });
    } else {
        if (msgCofre) msgCofre.innerText = "Vença o desafio diário para desbloquear";
        itensCofre.forEach(item => {
            item.classList.add('bloqueado');
            const s = item.querySelector('.status-reliquia');
            if (s) s.innerText = "Trancado";
        });
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
// 11. MENSAGEM SURPRESA DIÁRIA (mantenha o seu código)
// ==========================================

// ========== FUNÇÕES DE ÁUDIO ==========
function toggleMuteJogos() {
    if (!audioJogos) return;
    audioJogos.muted = !audioJogos.muted;
    audioJogosMuted = audioJogos.muted;
    localStorage.setItem('audio_jogos_muted', audioJogos.muted);
    atualizarBotoesMute();
}

function atualizarBotoesMute() {
    const botoes = document.querySelectorAll('#btn-mute-jogos, .btn-mute-jogo');
    botoes.forEach(btn => {
        btn.innerText = audioJogosMuted ? '🔇' : '🔊';
    });
}

function playAudioJogos() {
    if (!audioJogos) {
        audioJogos = document.getElementById('audio-jogos');
        if (!audioJogos) return;
        audioJogos.volume = 0.2;
        audioJogos.muted = audioJogosMuted;
    }
    if (audioJogos.paused) {
        audioJogos.play().catch(e => console.log('Áudio bloqueado até interação:', e));
    }
}

function pauseAudioJogos() {
    if (audioJogos && !audioJogos.paused) {
        audioJogos.pause();
    }
}

// ========== SERVICE WORKER E ATUALIZAÇÕES ==========
function registrarServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => {
                console.log('Service Worker registrado!', reg);
                mostrarToast('✅ Service Worker ativo!');

                reg.addEventListener('updatefound', () => {
                    const novoSW = reg.installing;
                    console.log('Nova versão do Service Worker encontrada!');
                    novoSW.addEventListener('statechange', () => {
                        if (novoSW.state === 'installed' && navigator.serviceWorker.controller) {
                            mostrarToast('🔄 Nova versão disponível! Feche e abra o app novamente.');
                        }
                    });
                });
            })
            .catch(err => {
                console.error('Erro ao registrar Service Worker:', err);
                mostrarToast('❌ Erro ao registrar Service Worker: ' + err.message);
            });
    } else {
        mostrarToast('❌ Service Worker não suportado neste navegador.');
    }
}

function verificarAtualizacao() {
    mostrarToast('🔍 Verificando atualizações...');

    if (!('serviceWorker' in navigator)) {
        mostrarToast('❌ Service Worker não suportado neste navegador.');
        return;
    }

    navigator.serviceWorker.getRegistration().then(reg => {
        if (!reg) {
            navigator.serviceWorker.register('./sw.js')
                .then(() => {
                    mostrarToast('✅ Service Worker registrado. Recarregue a página.');
                })
                .catch(err => {
                    console.error('Erro ao registrar:', err);
                    mostrarToast('❌ Erro ao registrar: ' + err.message);
                });
            return;
        }

        reg.update()
            .then(() => {
                if (reg.installing) {
                    reg.installing.addEventListener('statechange', function () {
                        if (this.state === 'installed' && navigator.serviceWorker.controller) {
                            mostrarToast('🔄 Nova versão disponível! Feche e reabra o app.');
                        }
                    });
                } else if (reg.waiting) {
                    reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                    mostrarToast('🔄 Nova versão disponível! Aplicando...');
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    mostrarToast('✅ Você já está na versão mais recente.');
                }
            })
            .catch(err => {
                console.error('Erro ao atualizar:', err);
                mostrarToast('❌ Erro ao verificar atualização.');
            });
    });
}

// ==========================================
// BOOT DO SISTEMA
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    setInterval(atualizarMotorDoTempo, 1000);
    atualizarMotorDoTempo();
    atualizarDinamicaHome();
    configurarNavegacao();
    carregarDadosExternos();
    carregarLeis();
    atualizarClima();
    atualizarSaudacao();
    setInterval(atualizarSaudacao, 60000);

    document.getElementById('btn-mute-jogos')?.addEventListener('click', toggleMuteJogos);
    atualizarBotoesMute();

    // Funções de mensagem surpresa (se existirem)
    if (typeof inicializarSurpresaDiaria === 'function') inicializarSurpresaDiaria();
    const btnSurpresa = document.getElementById("btn-surpresa");
    if (btnSurpresa && typeof mostrarMensagemSurpresa === 'function') {
        btnSurpresa.onclick = mostrarMensagemSurpresa;
    }

    registrarServiceWorker();

    const btnVerificar = document.getElementById('btn-verificar-atualizacao');
    if (btnVerificar) {
        btnVerificar.addEventListener('click', verificarAtualizacao);
    }

    // Aguarda o login para atualizar a interface do pulso
    window.addEventListener('loginSucesso', () => {
        if (window.SantuarioApp && typeof window.SantuarioApp.conectar === 'function') {
            window.SantuarioApp.conectar();
        }
    });
});
}