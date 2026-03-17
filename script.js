// ==========================================
// SANTUÁRIO - MOTOR DE IDENTIDADE E ESTADO
// ==========================================

window.IDS_SANTUARIO = {
    "Qb9ZWjumzhRWYm3Rrb5phpZjj4H2": "joao",
    "meXVetR7D7b8d00Yuw8wjtRlpoi1": "thamiris"
};

// Variáveis globais de estado
window.usuarioLogado = null;
window.souJoao = false;
window.MEU_NOME = "";
window.NOME_PARCEIRO = "";

if (window.__SANTUARIO_SCRIPT_CARREGADO) {
    console.warn('Script já carregado.');
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

    // --- ESCUTA DO TERMÔMETRO DO CUIDADO ---
    const refMoodParceiro = ref(db, 'moods/' + window.NOME_PARCEIRO.toLowerCase());
    onValue(refMoodParceiro, (snapshot) => {
        const dados = snapshot.val();
        if (dados) {
            atualizarTelaPeloMood(dados.estado, dados.timestamp, dados.mensagem);
        }
    });

    // --- ESCUTA DOS POST-ITS (IMORTAIS) ---
const refPostits = ref(db, 'postits');
onValue(refPostits, (snapshot) => {
    const area = document.getElementById('area-postits');
    if (!area) return;

    area.innerHTML = '';
    const postits = [];

    snapshot.forEach((filho) => {
        postits.push({ key: filho.key, ...filho.val() });
    });

    // Ordenar: fixados primeiro, depois por timestamp decrescente (mais recentes primeiro)
    postits.sort((a, b) => {
        if (a.fixado && !b.fixado) return -1;
        if (!a.fixado && b.fixado) return 1;
        return b.timestamp - a.timestamp;
    });

    postits.forEach(p => {
        // Converte o Timestamp em data legível
        const dataObjeto = new Date(p.timestamp);
        const dataFormatada = `${String(dataObjeto.getDate()).padStart(2, '0')}/${String(dataObjeto.getMonth()+1).padStart(2, '0')} às ${String(dataObjeto.getHours()).padStart(2, '0')}:${String(dataObjeto.getMinutes()).padStart(2, '0')}`;

        // Define a cor baseada em quem escreveu
        const classeAutor = (p.autor === 'João') ? 'postit-joao' : 'postit-thamiris';

        const div = document.createElement('div');
        div.className = `postit ${classeAutor}`;
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px dashed rgba(0,0,0,0.1); padding-bottom: 4px;">
                <span class="postit-autor">${p.autor}</span>
                <span style="font-size: 0.65rem; opacity: 0.6; font-weight: normal;">${dataFormatada}</span>
            </div>
            <div style="font-size: 0.95rem; margin-bottom: 8px;">${p.mensagem}</div>
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
        `;

        // Botão de fixar (só para o autor)
        if (p.autor === window.MEU_NOME) {
            const btnFixar = document.createElement('button');
            btnFixar.innerText = p.fixado ? '📌 Fixado' : '📍 Fixar';
            btnFixar.className = 'btn-fixar';
            btnFixar.onclick = (e) => {
                e.stopPropagation();
                fixarPostit(p.key, !p.fixado);
            };
            div.querySelector('div:last-child').appendChild(btnFixar);
        }

        // Botão de curtir
        const btnCurtir = document.createElement('button');
        btnCurtir.innerText = `❤️ ${p.curtidas || 0}`;
        btnCurtir.className = 'btn-curtir';
        btnCurtir.onclick = (e) => {
            e.stopPropagation();
            curtirPostit(p.key);
        };
        div.querySelector('div:last-child').appendChild(btnCurtir);

        area.appendChild(div);
    });

    // Desce a barra de rolagem suavemente para o recado mais novo (se houver)
    if (postits.length > 0) {
        area.scrollTo({ top: area.scrollHeight, behavior: 'smooth' });
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

// 2. CONFIGURAÇÃO DA PLANILHA EXTERNA E MÁQUINA DE ESCREVER
const URL_PLANILHA = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1Rr4fdzLLW-Xu4jrf7qotZ_r67mOJrTDQxtZMKxUF8UijZI0Uxj3dwnjzaX_I7dq5MpEepB3SjsMI/pub?output=csv";

// Função mágica que digita o texto e adiciona o Vidro Embaçado
function digitarTexto(elemento, texto, velocidade = 40) {
    elemento.innerHTML = '';
    elemento.classList.add('cursor-piscante');
    // Já começa com o texto embaçado
    elemento.classList.add('texto-embacado'); 
    
    let i = 0;
    function digitar() {
        if (i < texto.length) {
            elemento.innerHTML += texto.charAt(i);
            i++;
            setTimeout(digitar, velocidade);
        } else {
            setTimeout(() => elemento.classList.remove('cursor-piscante'), 2000);
            
            // --- INÍCIO DA LÓGICA DO VIDRO EMBAÇADO ---
            let tempoToque;
            const desembaçarVidro = (e) => {
                if(e.type === 'touchstart') e.preventDefault();
                // A Thamiris precisa segurar o dedo por 1 segundo para começar a limpar
                tempoToque = setTimeout(() => {
                    elemento.classList.add('revelado');
                    // Vibra bem levinho para avisar que ela conseguiu ler
                    if (navigator.vibrate) navigator.vibrate([30]); 
                }, 1000);
            };
            
            const cancelarDesembaçar = () => {
                clearTimeout(tempoToque);
            };

            // Adiciona os eventos de toque
            elemento.addEventListener('touchstart', desembaçarVidro, {passive: false});
            elemento.addEventListener('touchend', cancelarDesembaçar);
            elemento.addEventListener('mousedown', desembaçarVidro);
            elemento.addEventListener('mouseup', cancelarDesembaçar);
            elemento.addEventListener('mouseleave', cancelarDesembaçar);
            // --- FIM DA LÓGICA DO VIDRO EMBAÇADO ---
        }
    }
    setTimeout(digitar, 2500); 
}

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
                // Estrutura o HTML vazio com o ID para a máquina de escrever achar
                elFrase.innerHTML = `<div class="container-frase"><span class="aspas-decorativa">“</span><p class="texto-itálico" id="texto-maquina-escrever"></p><span class="aspas-decorativa">”</span></div>`;
                
                // Chama a magia da máquina de escrever
                const elementoTexto = document.getElementById('texto-maquina-escrever');
                digitarTexto(elementoTexto, configHoje.frase);
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

// 3. NAVEGAÇÃO SPA COM TRANSIÇÕES SUAVES
function configurarNavegacao() {
    const botoesMenu = document.querySelectorAll('.item-menu');
    const todasAsTelas = document.querySelectorAll('.tela');
    let trocandoTela = false; // Trava de segurança para evitar cliques duplos

    botoesMenu.forEach(botao => {
        botao.addEventListener('click', (evento) => {
            evento.preventDefault();
            const telaAlvo = botao.getAttribute('data-alvo');
            
            // Se já estiver na tela, ou se a animação ainda estiver rodando, não faz nada
            if (telaAlvo === telaAtual || trocandoTela) return;

            trocandoTela = true; // Trava a tela para iniciar a mágica
            const telaAnterior = telaAtual;

            // 1. Atualiza a cor do botão do menu instantaneamente
            botoesMenu.forEach(b => b.classList.remove('ativo'));
            botao.classList.add('ativo');

            // 2. Aplica o efeito "Fade Out" na tela que está ativa agora
            const telaAtiva = document.getElementById(telaAtual);
            if (telaAtiva) {
                telaAtiva.classList.add('saindo');
            }

            // 3. Espera 300 milissegundos (o tempo exato da animação do CSS sumirSuave)
            setTimeout(() => {
                // Esconde todas as telas e limpa a classe de animação
                todasAsTelas.forEach(tela => {
                    tela.classList.add('escondido');
                    tela.classList.remove('saindo');
                });

                // Mostra a tela nova (ela fará o Fade In automaticamente pelo seu CSS original)
                const elementoTela = document.getElementById(telaAlvo);
                if (elementoTela) elementoTela.classList.remove('escondido');

                telaAtual = telaAlvo;

                // Lógica de áudio (mantida intacta)
                if (telaAlvo === 'jogos') {
                    playAudioJogos();
                } else if (telaAnterior === 'jogos') {
                    pauseAudioJogos();
                }

                atualizarDinamicaHome();
                trocandoTela = false; // Destrava a tela para ela poder clicar de novo
            }, 300);
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
    // Confetes
confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
});
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

// VARIÁVEIS GLOBAIS DO CLIMA UNIFICADO
window.dadosClima = { joao: null, thamiris: null };
window.climaExibido = 'thamiris'; // O app abre focando nela por padrão ❤️

async function atualizarClima() {
    try {
        // Busca os dois climas
        const resJ = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Colombo,BR&units=metric&appid=${API_KEY}`);
        const resT = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Goiania,BR&units=metric&appid=${API_KEY}`);

        if (resJ.ok) window.dadosClima.joao = await resJ.json();
        if (resT.ok) window.dadosClima.thamiris = await resT.json();

        // Atualiza as temperaturas nos botões
        if (window.dadosClima.joao) {
            document.getElementById("mini-temp-joao").innerText = `${Math.round(window.dadosClima.joao.main.temp)}°C`;
        }
        if (window.dadosClima.thamiris) {
            document.getElementById("mini-temp-thamiris").innerText = `${Math.round(window.dadosClima.thamiris.main.temp)}°C`;
        }

        // Dispara a visualização
        alternarVisaoClima(window.climaExibido);

    } catch (e) {
        console.error("Erro na API de Clima", e);
        document.getElementById("texto-mensagem-clima").innerText = "❌ Clima indisponível no momento";
    }
}

// Função chamada quando você clica nos botões (Colombo / Goiânia)
window.alternarVisaoClima = function(pessoa) {
    window.climaExibido = pessoa;
    const dados = window.dadosClima[pessoa];
    
    // Atualiza o visual dos botões
    document.getElementById('btn-view-thamiris').classList.remove('ativo');
    document.getElementById('btn-view-joao').classList.remove('ativo');
    document.getElementById(`btn-view-${pessoa}`).classList.add('ativo');

    if (!dados) return;

    // Calcula dia/noite e condição
    const agora = Math.floor(Date.now() / 1000);
    const eNoite = agora < dados.sys.sunrise || agora > dados.sys.sunset;
    const condicao = dados.weather[0].main;
    const temp = Math.round(dados.main.temp);

    // Atualiza a frase
    const elMensagem = document.getElementById("texto-mensagem-clima");
    if (elMensagem) {
        if (pessoa === 'thamiris') {
            elMensagem.innerText = gerarMensagemClima(condicao, temp);
        } else {
            elMensagem.innerText = `Faz ${temp}°C em Colombo. O clima aqui espera por você.`;
        }
    }

    // Manda a ordem para o motor 3D transformar a garrafa
    if (typeof window.mudarClimaOrbe === 'function') {
        window.mudarClimaOrbe(condicao, eNoite);
    }
};

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
btn.classList.add('pulso-enviado');
setTimeout(() => btn.classList.remove('pulso-enviado'), 1000);
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

        const somRega = new Audio('assets/sons/mf/regar.mp3');
        somRega.volume = 0.4;
        somRega.play().catch(e => console.log('Áudio bloqueado:', e));

        // As gotas agora caem no topo da árvore 3D
        function animarRega(elemento) {
            if (!elemento) return;
            for (let i = 0; i < 5; i++) {
                const gota = document.createElement('div');
                gota.className = 'gota';
                gota.style.left = (Math.random() * 40 + 30) + '%'; // Centraliza as gotas
                gota.style.top = '5%';
                elemento.appendChild(gota);
                setTimeout(() => gota.remove(), 600);
            }
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
        // Faz chover dentro do canvas 3D
        animarRega(document.getElementById('prisma-3d'));
    });
}

function renderizarPlanta() {
    const barra = document.getElementById("progresso-crescimento");
    const texto = document.getElementById("status-texto");
    const aviso = document.getElementById("aviso-regada");
    const contadorCiclos = document.getElementById('contador-ciclos');
    
    if (contadorCiclos) contadorCiclos.innerText = `🌱 Ciclos completados: ${statusPlanta.ciclos || 0}`;
    
    // Agora o sistema não trava mais procurando pelo emoji que deletamos!
    if (!barra || !texto) return; 
    
    barra.style.width = statusPlanta.nivel + "%";

    if (statusPlanta.nivel <= 0) {
        texto.innerText = "Um novo ciclo se inicia. Cuidem juntos.";
    } else if (statusPlanta.nivel < 25) {
        texto.innerText = "As raízes estão se firmando.";
    } else if (statusPlanta.nivel < 50) {
        texto.innerText = "Crescimento contínuo e forte.";
    } else if (statusPlanta.nivel < 90) {
        texto.innerText = "A folhagem já provê abrigo e paz.";
    } else {
        texto.innerText = "Prestes a florescer um novo marco!";
    }

    if (statusPlanta.diaUltimaRegada === new Date().toLocaleDateString('pt-BR')) {
        if (aviso) aviso.innerText = "Solo nutrido por hoje. Descansem.";
    } else {
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
    ]
};

function abrirReliquia(event, tipo) {
    if (localStorage.getItem('santuario_vitoria_dia') !== new Date().toLocaleDateString('pt-BR')) {
        mostrarToast("🔒 Relíquia Selada. Vença o desafio do dia para colher este prêmio!");
        return;
    }
    event.currentTarget
    const iconeClicado = event.currentTarget.querySelector('.icone-reliquia');
    if (iconeClicado) {
        iconeClicado.classList.add('abrindo-bau');
        setTimeout(() => {
            iconeClicado.classList.remove('abrindo-bau');
        }, 300);
    }
    const modal = document.getElementById('modal-reliquia');
    const corpo = document.getElementById('corpo-modal');
    if (!modal || !corpo) return;

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
    } else if (tipo === 'ceu') {
        const textoCeu = BIBLIOTECA_RELIQUIAS.ceu[diaDoAno % BIBLIOTECA_RELIQUIAS.ceu.length];
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 15px; font-family: 'Playfair Display', serif;">Mesmo Céu</h3>
            <div class="modal-ceu" id="modal-ceu-container" style="padding: 10px;">
                <div id="galaxia-3d" style="width: 100%; height: 220px; border-radius: 12px; overflow: hidden; background: #020111;"></div>
                <p style="margin-top: 15px; font-style: italic; color: #e0e0e0; font-size: 0.95rem;">"${textoCeu}"</p>
                <small style="color: #D4AF37; opacity: 0.5; font-size: 0.7rem; display: block; margin-top: 10px;">Toque e deslize para girar a galáxia</small>
            </div>`;
        
        // Dá um pequeno atraso de 100ms para o HTML carregar na tela, e então liga o motor 3D da galáxia
        setTimeout(() => {
            if (typeof window.inicializarGalaxia3D === 'function') window.inicializarGalaxia3D();
        }, 100);
    } else if (tipo === 'cartas') {
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
    } else if (tipo === 'encontro') {
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
        // --- NOVA PARTE PARA O SOLO FÉRTIL (PRISMA) ---
        if (tipo === 'jardim') {
            // Dá um atraso de 100 milissegundos para a tela aparecer, 
            // assim o 3D consegue medir o tamanho real da tela (que não será mais zero)
            setTimeout(() => {
                if (typeof window.inicializarPrisma3D === 'function') {
                    window.inicializarPrisma3D();
                }
            }, 100);
        }
        // ----------------------------------------------
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
    // Remover listeners de orientação
if (window.orientacaoListener) {
    window.removeEventListener('orientationchange', window.orientacaoListener);
    window.removeEventListener('resize', window.orientacaoListener);
}
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
    // Agora a função cuida exclusivamente da liberação visual das relíquias do Cofre
    const hoje = new Date().toLocaleDateString('pt-BR');
    const ganhouHoje = localStorage.getItem('santuario_vitoria_dia') === hoje;
    
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
// TERMÔMETRO DO CUIDADO SUPREMO & POST-ITS
// ==========================================

window.enviarMood = function(estado) {
    if (!window.SantuarioApp.inicializado || !window.MEU_NOME) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const texto = document.getElementById('input-mood').value.trim();
    
    const refMeuMood = ref(db, 'moods/' + window.MEU_NOME.toLowerCase());
    set(refMeuMood, {
        estado: estado,
        mensagem: texto || null,
        timestamp: Date.now()
    });

    // Limpa o campo
    document.getElementById('input-mood').value = '';
    
    mostrarToast(`Seu coração falou. O sinal foi enviado para o espaço...`);
};

window.atualizarTelaPeloMood = function(estado, timestamp, mensagem) {
    const statusEl = document.getElementById('status-parceiro');
    if (!statusEl) return;
    
    // FUNÇÃO QUE FAZ O ALERTA APARECER NA TELA
window.exibirAlertaEmergencia = function(estado, mensagem) {
    const modal = document.getElementById('modal-emergencia');
    const titulo = document.getElementById('emergencia-titulo');
    const texto = document.getElementById('emergencia-mensagem');

    if (modal && titulo && texto) {
        // Define o título com o estado atual (ex: TRISTE, ANSIOSA)
        titulo.innerText = `Alerta: ${estado.toUpperCase()}`;
        
        // Define a mensagem de apoio
        texto.innerText = mensagem || "O Santuário detectou um estado crítico. Verifique como seu parceiro está agora.";
        
        // Remove a classe que esconde o modal para ele aparecer
        modal.classList.remove('escondido');

        // Faz o celular vibrar (se estiver no Android/Chrome)
        if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
    } else {
        console.error("Erro: Elementos do modal de emergência não encontrados no HTML.");
    }
};

// FUNÇÃO PARA FECHAR O ALERTA
window.fecharEmergencia = function() {
    const modal = document.getElementById('modal-emergencia');
    if (modal) {
        modal.classList.add('escondido');
    }
};

    // Cálculo exato de tempo
    const minutosAtras = Math.floor((Date.now() - timestamp) / 60000);
    let tempoTexto = minutosAtras < 1 ? "agora mesmo" : `há ${minutosAtras} minutos`;
    if (minutosAtras >= 60) {
        const horas = Math.floor(minutosAtras / 60);
        tempoTexto = `há ${horas} hora(s)`;
    }

    // Limpa estados visuais anteriores
    document.body.classList.remove('modo-cansada');
    document.body.classList.remove('modo-alerta');

    let mensagemTexto = "";
    if (estado === 'radiante') {
        mensagemTexto = `✨ ${window.NOME_PARCEIRO} está radiante ${tempoTexto}.`;
    } else if (estado === 'ansiosa') {
        mensagemTexto = `🌪️ A mente da ${window.NOME_PARCEIRO} acelerou ${tempoTexto}.`;
    } else if (estado === 'triste') {
        mensagemTexto = `🌧️ O dia da ${window.NOME_PARCEIRO} escureceu ${tempoTexto}.`;
    } else if (estado === 'cansada') {
        mensagemTexto = `🔋 ${window.NOME_PARCEIRO} está esgotada ${tempoTexto}.`;
        document.body.classList.add('modo-cansada');
    } else if (estado === 'saudade') {
        mensagemTexto = `🥺 ${window.NOME_PARCEIRO} está com saudade ${tempoTexto}.`;
    } else if (estado === 'apaixonada') {
        mensagemTexto = `💖 ${window.NOME_PARCEIRO} está apaixonada ${tempoTexto}!`;
    }

    if (mensagem) {
        mensagemTexto += ` Ela escreveu: "${mensagem}"`;
    }

    statusEl.innerHTML = mensagemTexto;
    

    // ==========================================
    // SISTEMA DE ALERTA MÁXIMO (A MÁGICA)
    // ==========================================
    if (window.souJoao && minutosAtras <= 5 && ['triste', 'ansiosa', 'cansada'].includes(estado)) {
        if (window.ultimoAlertaCuidado !== timestamp) {
            window.ultimoAlertaCuidado = timestamp;
            dispararAlarmeCuidado(estado);
        }
    }

    const estadosCriticos = ['ansiosa', 'ansioso', 'triste', 'cansada', 'cansado', 'com saudade'];
    
    // Se você for o João e o estado dela for crítico, dispara o alerta visual
    if (estadosCriticos.includes(estado.toLowerCase())) {
        exibirAlertaEmergencia(estado, mensagem); // Função que abre o modal vermelho
        const modal = document.getElementById('modal-emergencia');
        const titulo = document.getElementById('emergencia-titulo');
        const texto = document.getElementById('emergencia-mensagem');

        titulo.innerText = `A Thamiris está ${estado.toUpperCase()}`;
        texto.innerText = mensagem || "Ela precisa de você agora. Dê uma atenção especial.";
        modal.classList.remove('escondido');
        
        // Toca um som de alerta discreto se quiser
        const audio = new Audio('assets/alerta.mp3'); 
        audio.play().catch(() => console.log("Áudio bloqueado pelo navegador"));
    }
};

window.fecharEmergencia = () => {
    document.getElementById('modal-emergencia').classList.add('escondido');
};

window.dispararAlarmeCuidado = function(estado) {
    // 1. Vibração agressiva (Padrão SOS: 3 curtas, 3 longas, 3 curtas)
    if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100, 200, 300, 100, 300, 100, 300, 200, 100, 50, 100, 50, 100]);
    }

    // 2. Toca Som de Notificação Urgente
    const audio = document.getElementById('audio-alerta-cuidado');
    if (audio) {
        audio.volume = 1.0;
        audio.play().catch(e => console.log('Áudio bloqueado pelo navegador', e));
    }

    // 3. Trava a tela com o Modal Vermelho
    const modal = document.getElementById('modal-cuidado');
    const txtCuidado = document.getElementById('texto-alerta-cuidado');
    if (modal && txtCuidado) {
        if (estado === 'ansiosa') txtCuidado.innerText = `A mente da ${window.NOME_PARCEIRO} está acelerada. Mande um áudio com a sua voz agora.`;
        if (estado === 'triste') txtCuidado.innerText = `A ${window.NOME_PARCEIRO} não está bem. Interrompa o que puder e vá até ela.`;
        if (estado === 'cansada') txtCuidado.innerText = `A bateria da ${window.NOME_PARCEIRO} acabou. Ofereça colo e silêncio.`;
        modal.classList.remove('escondido');
    }
    
    // 4. Pisca as bordas do app de vermelho
    document.body.classList.add('modo-alerta');
};

window.fecharModalCuidado = function() {
    document.getElementById('modal-cuidado').classList.add('escondido');
    document.body.classList.remove('modo-alerta');
    // Envia um pulso mágico de volta como confirmação de que você "recebeu o chamado"
    if (typeof enviarPulso === 'function') enviarPulso();
};

window.enviarPostit = function() {
    if (!window.SantuarioApp.inicializado || !window.MEU_NOME) return;
    
    const input = document.getElementById('input-postit');
    const texto = input.value.trim();
    if (texto === "") return;

    const { db, ref, set } = window.SantuarioApp.modulos;
    
    // Usamos a data/hora atual como ID. Fica salvo na nuvem ETERNAMENTE.
    const idUnico = Date.now(); 
    const refNovoPostit = ref(db, 'postits/' + idUnico);
    
    set(refNovoPostit, {
    autor: window.MEU_NOME,
    mensagem: texto,
    timestamp: idUnico,
    fixado: false,
    curtidas: 0
});

    input.value = ""; 
};

window.addEventListener('loginSucesso', async (e) => {
    console.log(`Bem-vindo, ${window.MEU_NOME}. Conectando satélite...`);
    
    // Inicializa o Pulso
    if (window.SantuarioApp && window.SantuarioApp.conectar) {
        window.SantuarioApp.conectar();
    }
    
    // Solicita permissão e só tenta obter o token se for concedida
    const permitido = await solicitarPermissaoNotificacao();
    if (permitido) {
        salvarTokenFCM();
    } else {
        console.log('Permissão de notificação negada');
    }
});

// ==========================================
// REGISTRAR LOGIN NO FIREBASE
// ==========================================
function registrarLogin(usuario) {
    // Verifica se os módulos estão disponíveis
    if (!window.SantuarioApp?.modulos) return;
    const { db, ref, push } = window.SantuarioApp.modulos;
    
    // Cria uma referência para a lista de logins
    const loginsRef = ref(db, 'logins');
    
    // Adiciona um novo registro com timestamp e usuário
    push(loginsRef, {
        usuario: usuario,           // 'joao' ou 'thamiris'
        timestamp: Date.now(),
        data: new Date().toLocaleString('pt-BR') // formato legível
    }).catch(error => console.error('Erro ao registrar login:', error));
}

function atualizarInterfaceGlobal() {
    const elSaudacao = document.getElementById('saudacao-texto');
    if (elSaudacao) elSaudacao.innerText = `Olá, ${window.MEU_NOME}`;
    
    // Atualiza cores ou elementos específicos baseados em quem logou
    document.body.classList.toggle('layout-joao', window.souJoao);
}

async function solicitarPermissaoNotificacao() {
    if (!("Notification" in window)) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    // permission is "default" – pedimos ao usuário
    const permissao = await Notification.requestPermission();
    return permissao === "granted";
}

// Função para disparar notificação local (útil para testes e eventos internos)
window.enviarNotificacaoLocal = function(titulo, corpo) {
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification(titulo, {
                body: corpo,
                icon: 'assets/icons/icon-192.png',
                vibrate: [200, 100, 200]
            });
        });
    }
};

// ==========================================
// SISTEMA DE TEMAS
// ==========================================
function aplicarTema(tema) {
    // Remove classes de tema anteriores
    document.body.classList.remove('tema-azul', 'tema-rosa', 'tema-verde', 'tema-roxo');
    if (tema === 'azul') {
        document.body.classList.add('tema-azul');
    } else if (tema === 'rosa') {
        document.body.classList.add('tema-rosa');
    } else if (tema === 'verde') {
        document.body.classList.add('tema-verde');
    } else if (tema === 'roxo') {
        document.body.classList.add('tema-roxo');
    }
    // Salva no localStorage
    localStorage.setItem('santuario_tema', tema);
    // Atualiza botão ativo
    document.querySelectorAll('.btn-tema').forEach(btn => {
        btn.classList.remove('ativo');
        if (btn.dataset.tema === tema) btn.classList.add('ativo');
    });
}

// Carregar tema salvo
const temaSalvo = localStorage.getItem('santuario_tema') || 'dourado';
aplicarTema(temaSalvo);

// Adicionar eventos aos botões
document.querySelectorAll('.btn-tema').forEach(btn => {
    btn.addEventListener('click', () => {
        aplicarTema(btn.dataset.tema);
    });
});

// ==========================================
// FUNÇÕES PARA MURAL DE RECADOS
// ==========================================

async function fixarPostit(key, fixado) {
    if (!window.SantuarioApp?.modulos) return;
    const { db, ref, get, set } = window.SantuarioApp.modulos;

    // Se for fixar, precisamos desafixar qualquer outro postit
    if (fixado) {
        const snapshot = await get(ref(db, 'postits'));
        snapshot.forEach(child => {
            if (child.val().fixado) {
                // Desfixa o que estava fixado
                set(ref(db, `postits/${child.key}/fixado`), false);
            }
        });
    }
    // Agora fixa/desfixa o atual
    await set(ref(db, `postits/${key}/fixado`), fixado);
}

async function curtirPostit(key) {
    if (!window.SantuarioApp?.modulos) return;
    const { db, ref, runTransaction } = window.SantuarioApp.modulos;
    const postitRef = ref(db, `postits/${key}/curtidas`);
    runTransaction(postitRef, (curtidas) => (curtidas || 0) + 1)
        .catch(error => console.error('Erro ao curtir:', error));
}

// ==========================================
// FUNÇÃO PARA OBTER E SALVAR O TOKEN FCM
// ==========================================
async function salvarTokenFCM() {
    // Se não for o João, não precisa (só ele receberá notificações)
    if (!window.souJoao) return;

    // Verifica se o Firebase Messaging está disponível
    if (typeof window.SantuarioApp?.modulos?.messaging === 'undefined') {
        console.log('Messaging não disponível');
        return;
    }

    try {
        // Aguarda o Service Worker estar ativo
        const registration = await navigator.serviceWorker.ready;
        console.log('Service Worker ativo, obtendo token FCM...');

        const messaging = window.SantuarioApp.modulos.messaging;
        const token = await window.SantuarioApp.modulos.getToken(messaging, {
            vapidKey: 'BMfoiE5OUoxMK970zucUsdMO-X6zPX36rmOwlTKPEp8JTzDZzGbwqm097kQKd_508hZORw-B3AwKC6gRxm5iMjg',
            serviceWorkerRegistration: registration // força usar o SW registrado
        });

        if (token) {
            console.log('Token FCM obtido:', token);
            // Salva no Realtime Database
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, 'fcmTokens/joao'), token);
            console.log('Token salvo no Firebase');
        }
    } catch (err) {
        console.error('Erro ao obter token FCM:', err);
    }
}

// ==========================================
// MENSAGEM SURPRESA (UMA VEZ POR DIA)
// ==========================================

// Função que verifica e atualiza o estado do botão (data atual vs. localStorage)
function verificarEstadoBotaoSurpresa() {
    const btn = document.getElementById('btn-surpresa');
    const textoEl = document.getElementById('texto-surpresa');
    if (!btn) return;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;

    const ultimaData = localStorage.getItem('surpresa_ultima_data');
    const ultimaMensagem = localStorage.getItem('surpresa_mensagem_dia');

    if (ultimaData === hojeStr) {
        // Já usou hoje: desabilita o botão e exibe a mensagem (se houver)
        btn.classList.add('btn-desativado');
        if (textoEl && ultimaMensagem) {
            textoEl.innerText = ultimaMensagem;
            textoEl.style.opacity = 1;
        }
    } else {
        // Novo dia: habilita o botão e limpa a mensagem
        btn.classList.remove('btn-desativado');
        if (textoEl) {
            textoEl.innerText = ''; // ou uma mensagem padrão, se desejar
        }
    }
}

// Função principal chamada ao clicar no botão
window.mostrarMensagemSurpresa = function() {
    const btn = document.getElementById('btn-surpresa');
    const textoEl = document.getElementById('texto-surpresa');
    if (!btn || !textoEl) return;

    // Se já estiver desabilitado, não faz nada
    if (btn.classList.contains('btn-desativado')) return;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;

    // Lista de mensagens (personalize à vontade)
    const mensagens = [
        "Você é a pessoa mais incrível que eu já conheci.",
        "Mesmo longe, meu coração bate por você.",
        "Hoje o dia foi mais bonito porque você existe.",
        "Saudade é o amor que está longe, mas não vai embora.",
        "Você é o meu pensamento favorito.",
        "Obrigado por fazer parte da minha vida.",
        "Se eu pudesse, te traria pra perto agora.",
        "Você ilumina meus dias mesmo à distância.",
        "Amo cada detalhe seu.",
        "Nosso amor é a coisa mais linda que já senti."
    ];

    // Escolhe uma mensagem aleatória
    const mensagem = mensagens[Math.floor(Math.random() * mensagens.length)];

    // Armazena a data e a mensagem
    localStorage.setItem('surpresa_ultima_data', hojeStr);
    localStorage.setItem('surpresa_mensagem_dia', mensagem);

    // Exibe a mensagem com fade suave
    textoEl.innerText = mensagem;
    textoEl.style.opacity = 0;
    textoEl.style.transition = 'opacity 0.5s';
    setTimeout(() => {
        textoEl.style.opacity = 1;
    }, 10);

    // Desabilita o botão
    btn.classList.add('btn-desativado');
};

// ==========================================
// BOOT DO SISTEMA
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // INICIALIZAÇÃO DAS MÁGICAS UI/UX SUPREMAS
    // ==========================================

    // --- 1. REMOVER SPLASH SCREEN ---
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.classList.add('oculto');
            // Remove o código do HTML após sumir para deixar o app leve
            setTimeout(() => splash.remove(), 1000); 
        }, 2500); // A tela de abertura fica por 2.5 segundos
    }

    // --- 2. RASTRO DE LUZ (MAGIC TOUCH TRAIL) ---
    const criarRastro = (e) => {
        // Pega a posição exata do dedo na tela ou do mouse
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        if (x === undefined || y === undefined) return;

        const rastro = document.createElement('div');
        rastro.className = 'rastro-luz';
        rastro.style.left = `${x}px`;
        rastro.style.top = `${y}px`;
        document.body.appendChild(rastro);

        // O rastro some sozinho em menos de 1 segundo
        setTimeout(() => rastro.remove(), 800);
    };
    window.addEventListener('mousemove', criarRastro);
    window.addEventListener('touchmove', criarRastro, {passive: true});

    // --- 3. EFEITO RIPPLE NOS BOTÕES (ONDAS NA ÁGUA) ---
    // Pega todos os botões e itens clicáveis do app
    const elementosClicaveis = document.querySelectorAll('button, .item-menu, .btn-acao, .item-jogo, .item-cofre');
    elementosClicaveis.forEach(btn => {
        btn.classList.add('btn-ripple'); // Prepara o botão para a onda
        
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            // Calcula exatamente onde o dedo tocou dentro do botão
            const clientX = e.clientX || (e.touches && e.touches[0].clientX) || rect.left + rect.width/2;
            const clientY = e.clientY || (e.touches && e.touches[0].clientY) || rect.top + rect.height/2;
            const x = clientX - rect.left;
            const y = clientY - rect.top;
            
            const circulo = document.createElement('span');
            circulo.classList.add('ripple-onda');
            
            // Define o tamanho da onda baseado no tamanho do botão
            const diametro = Math.max(this.clientWidth, this.clientHeight);
            circulo.style.width = circulo.style.height = `${diametro}px`;
            circulo.style.left = `${x - diametro/2}px`;
            circulo.style.top = `${y - diametro/2}px`;
            
            this.appendChild(circulo);
            // Limpa a onda depois que a animação termina
            setTimeout(() => circulo.remove(), 600);
        });
    });

    // --- MELHORIA: EFEITO PARALLAX NAS PARTÍCULAS ---
    const particulas = document.querySelector('.particulas');
    if (particulas) {
        // Lógica para quando ela estiver no celular (usando o giroscópio)
        window.addEventListener('deviceorientation', (e) => {
            // O e.gamma lê a inclinação para os lados, o e.beta lê para frente/trás
            const x = Math.min(Math.max(e.gamma, -30), 30); 
            const y = Math.min(Math.max(e.beta - 45, -30), 30); 
            particulas.style.transform = `translate(${x * 0.5}px, ${y * 0.5}px)`;
        });

        // Lógica para se vocês abrirem no computador (usando o mouse)
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            particulas.style.transform = `translate(${x}px, ${y}px)`;
        });
    }
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
    // Verifica o estado do botão de mensagem surpresa agora
    verificarEstadoBotaoSurpresa();

// E a cada minuto, verifica se o dia mudou (para reativar à meia‑noite)
    setInterval(verificarEstadoBotaoSurpresa, 60000);

    // ==========================================
// Ícone de temas - abrir/fechar seletor
// ==========================================
const temaIcon = document.getElementById('tema-icon');
const temaSelector = document.getElementById('tema-selector');

if (temaIcon && temaSelector) {
    // Clicar no ícone abre/fecha o seletor
    temaIcon.addEventListener('click', () => {
        temaSelector.classList.toggle('escondido');
    });

    // Fechar o seletor ao escolher um tema (os botões já existem)
    document.querySelectorAll('.btn-tema').forEach(btn => {
        btn.addEventListener('click', () => {
            temaSelector.classList.add('escondido');
        });
    });

    // Opcional: fechar o seletor se clicar fora dele? (mais complexo, não faremos agora)
}

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


    // --- MELHORIA UX: O TOQUE SECRETO (EASTER EGG) ---
    const timerSecreto = document.getElementById('timer-principal');
    let timerPressionado; // Variável que vai contar o tempo do dedo na tela

    if (timerSecreto) {
        // Frases que ela pode descobrir ao segurar o dedo (Você pode adicionar quantas quiser!)
        const segredos = [
            "Você descobriu um segredo: Eu te amo mais do que ontem! 💖",
            "Mesmo de olhos fechados, é o seu rosto que eu vejo. ✨",
            "Colombo e Goiânia nunca estiveram tão perto. 🌍",
            "Continue segurando minha mão, mesmo de longe. 🤝",
            "Cada segundo desse contador valeu a pena por te conhecer. ⏳"
        ];

        // Função que acontece se ela segurar por 3 segundos
        const revelarSegredo = () => {
            // Escolhe uma frase aleatória
            const fraseSorteada = segredos[Math.floor(Math.random() * segredos.length)];
            
            // Usa o seu sistema de "Toast" (aquela notificação que sobe na tela) para mostrar a frase
            mostrarToast(fraseSorteada);

            // Efeito visual de confetes (que você já tem instalado)
            if (typeof confetti === 'function') {
                confetti({
                    particleCount: 80,
                    spread: 100,
                    origin: { y: 0.5 },
                    colors: ['#D4AF37', '#ff6b6b', '#ffffff'] // Dourado, vermelho claro e branco
                });
            }
            
            // Faz o celular vibrar suavemente (como se fosse um batimento de coração)
            if (navigator.vibrate) {
                navigator.vibrate([50, 100, 50]); 
            }
        };

        // Quando ela ENCOSTAR o dedo (ou clicar com o mouse)
        const iniciarToque = (e) => {
            // Evita que a tela dê zoom no celular
            if (e.type === 'touchstart') { e.preventDefault(); }
            // Começa a contar 3 segundos (3000 milissegundos)
            timerPressionado = setTimeout(revelarSegredo, 3000);
            // Dá um efeitinho visual de que o botão está afundando
            timerSecreto.style.transform = 'scale(0.95)';
            timerSecreto.style.opacity = '0.7';
            timerSecreto.style.transition = 'all 3s ease'; // Transição lenta para dar suspense
        };

        // Quando ela TIRAR o dedo (ou soltar o clique)
        const cancelarToque = () => {
            // Cancela o cronômetro se ela soltar antes dos 3 segundos
            clearTimeout(timerPressionado);
            // Volta o texto ao normal instantaneamente
            timerSecreto.style.transform = 'scale(1)';
            timerSecreto.style.opacity = '1';
            timerSecreto.style.transition = 'all 0.2s ease';
        };

        // Adiciona os "escutadores" para o celular (touch) e computador (mouse)
        timerSecreto.addEventListener('touchstart', iniciarToque, {passive: false});
        timerSecreto.addEventListener('touchend', cancelarToque);
        timerSecreto.addEventListener('touchcancel', cancelarToque); // Caso ela arraste o dedo

        timerSecreto.addEventListener('mousedown', iniciarToque);
        timerSecreto.addEventListener('mouseup', cancelarToque);
        timerSecreto.addEventListener('mouseleave', cancelarToque);
    }

    // ==========================================
    // INICIALIZAÇÃO DA JANELA VIVA
    // ==========================================

    // --- 1. CICLO CIRCADIANO (Mudança de Fundo por Hora) ---
    const atualizarCicloDia = () => {
        const hora = new Date().getHours();
        const body = document.body;
        
        // Limpa as classes antigas
        body.classList.remove('manha', 'tarde', 'crepusculo', 'noite');
        
        // Define a nova classe baseada na hora local dela
        if (hora >= 5 && hora < 12) {
            body.classList.add('manha'); // 05h às 11h59
        } else if (hora >= 12 && hora < 17) {
            body.classList.add('tarde'); // 12h às 16h59
        } else if (hora >= 17 && hora < 19) {
            body.classList.add('crepusculo'); // 17h às 18h59
        } else {
            body.classList.add('noite'); // 19h às 04h59
        }
    };
    atualizarCicloDia(); // Roda assim que o app abre
    setInterval(atualizarCicloDia, 60000); // Checa de 1 em 1 minuto se a hora mudou

    // --- 2. OURO VIVO NA FRASE DO DIA ---
    // Precisamos adicionar a classe de ouro no texto que é digitado ao vivo
    const observarFraseDia = new MutationObserver(() => {
        const textoMaquina = document.getElementById('texto-maquina-escrever');
        if (textoMaquina && !textoMaquina.classList.contains('texto-ouro-vivo')) {
            textoMaquina.classList.add('texto-ouro-vivo');
        }
    });
    const elFrase = document.getElementById('frase-do-dia');
    if (elFrase) {
        // Fica observando para adicionar o brilho assim que a máquina começar a escrever
        observarFraseDia.observe(elFrase, { childList: true, subtree: true });
    }

    // --- 3. REFLEXO DE CRISTAL NOS CARTÕES DE VIDRO ---
    const ativarReflexo = () => {
        const cartoes = document.querySelectorAll('.cartao-vidro');
        // Escolhe um cartão aleatório para dar o reflexo (para não ficar artificial)
        const cartaoSorteado = cartoes[Math.floor(Math.random() * cartoes.length)];
        
        if (cartaoSorteado) {
            cartaoSorteado.classList.add('reflexo-ativo');
            // Remove a classe depois que a luz passar, para poder acontecer de novo
            setTimeout(() => {
                cartaoSorteado.classList.remove('reflexo-ativo');
            }, 1000);
        }
    };
    
    // O reflexo acontece sozinho de tempos em tempos (a cada 6 segundos)
    setInterval(ativarReflexo, 6000);

    // E também acontece quando ela inclinar o celular (reaproveitando seu evento de deviceorientation)
    let ultimoTempoReflexo = 0;
    window.addEventListener('deviceorientation', (e) => {
        const agora = Date.now();
        // Se ela mexer muito o celular (movimento brusco de mais de 10 graus) e já passou 2 segundos do último reflexo
        if ((Math.abs(e.gamma) > 10 || Math.abs(e.beta) > 10) && agora - ultimoTempoReflexo > 2000) {
            ativarReflexo();
            ultimoTempoReflexo = agora;
        }
    });

    // ==========================================
    // UI/UX NÍVEL DEUS: O GLOBO 3D (THREE.JS)
    // ==========================================
    
    window.inicializarGlobo3D = () => {
        const container = document.getElementById('globo-3d');
        if (!container || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true }); 
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio); 
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.margin = '0 auto';
        container.appendChild(renderer.domElement);

        const raioTerra = 5;
        const geometriaTerra = new THREE.SphereGeometry(raioTerra, 32, 32);
        const materialTerra = new THREE.MeshBasicMaterial({ 
            color: 0xD4AF37, wireframe: true, transparent: true, opacity: 0.15 
        });
        const planeta = new THREE.Mesh(geometriaTerra, materialTerra);
        scene.add(planeta);

        const sistemaGlobal = new THREE.Group();
        sistemaGlobal.add(planeta);
        scene.add(sistemaGlobal);

        const latColombo = -25.2917; const lonColombo = -49.2242;
        const latGoiania = -16.6869; const lonGoiania = -49.2648;

        const calcPosFromLatLon = (lat, lon, raio) => {
            const phi = (90 - lat) * (Math.PI / 180);
            const theta = (lon + 180) * (Math.PI / 180);
            const x = -(raio * Math.sin(phi) * Math.cos(theta));
            const z = (raio * Math.sin(phi) * Math.sin(theta));
            const y = (raio * Math.cos(phi));
            return new THREE.Vector3(x, y, z);
        };

        const posColombo = calcPosFromLatLon(latColombo, lonColombo, raioTerra);
        const posGoiania = calcPosFromLatLon(latGoiania, lonGoiania, raioTerra);

        const geometriaCidade = new THREE.SphereGeometry(0.15, 16, 16);
        const materialCidade = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const pontoColombo = new THREE.Mesh(geometriaCidade, materialCidade);
        pontoColombo.position.copy(posColombo);
        sistemaGlobal.add(pontoColombo);

        const pontoGoiania = new THREE.Mesh(geometriaCidade, materialCidade);
        pontoGoiania.position.copy(posGoiania);
        sistemaGlobal.add(pontoGoiania);

        const pontoMedio = posColombo.clone().lerp(posGoiania, 0.5);
        pontoMedio.normalize().multiplyScalar(raioTerra + 1.5); 

        const curva = new THREE.QuadraticBezierCurve3(posColombo, pontoMedio, posGoiania);
        const geometriaCurva = new THREE.BufferGeometry().setFromPoints(curva.getPoints(50));
        const materialCurva = new THREE.LineBasicMaterial({ color: 0xff6b6b, linewidth: 2 });
        sistemaGlobal.add(new THREE.Line(geometriaCurva, materialCurva));

        camera.position.set(0, 0, 13);
        sistemaGlobal.rotation.y = -0.8; 
        sistemaGlobal.rotation.x = 0.2; 

        // Sono Quântico
        let globoVisivel = false;
        const observerGlobo = new IntersectionObserver((entries) => { globoVisivel = entries[0].isIntersecting; });
        observerGlobo.observe(container);

        const animar = () => {
            requestAnimationFrame(animar);
            if (!globoVisivel) return;
            sistemaGlobal.rotation.y += 0.005;
            renderer.render(scene, camera);
        };

        window.addEventListener('resize', () => {
            if(container.clientWidth > 0) {
                renderer.setSize(container.clientWidth, container.clientHeight);
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
            }
        });
        animar();
    };

    // ==========================================
    // UI/UX NÍVEL DEUS: AS 3 JÓIAS 3D
    // ==========================================

    // --- 1. O CORAÇÃO DE CRISTAL ---
    window.ritmoCoracao = 1;      
    window.corCoracao = 0xff6b6b; 

    const enviarMoodOriginal = window.enviarMood;
    window.enviarMood = function(estado) {
        if (estado === 'ansiosa') { window.ritmoCoracao = 3.5; window.corCoracao = 0xf39c12; } 
        else if (estado === 'cansada') { window.ritmoCoracao = 0.5; window.corCoracao = 0x3498db; } 
        else if (estado === 'triste') { window.ritmoCoracao = 0.8; window.corCoracao = 0x8e44ad; } 
        else if (estado === 'radiante') { window.ritmoCoracao = 2; window.corCoracao = 0xf1c40f; } 
        else if (estado === 'apaixonada') { window.ritmoCoracao = 2.5; window.corCoracao = 0xff6b6b; } 
        else { window.ritmoCoracao = 1.5; window.corCoracao = 0xffffff; } 
        
        if (enviarMoodOriginal) enviarMoodOriginal(estado);
    };

    window.inicializarCoracao3D = () => {
        const container = document.getElementById('coracao-3d');
        if (!container || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.domElement.style.display = 'block';
        renderer.domElement.style.margin = '0 auto';
        container.appendChild(renderer.domElement);

        const coracao = new THREE.Mesh(
            new THREE.IcosahedronGeometry(2, 0), 
            new THREE.MeshBasicMaterial({ color: window.corCoracao, wireframe: true, transparent: true, opacity: 0.8 })
        );
        scene.add(coracao);
        camera.position.z = 7;

        let coracaoVisivel = false;
        const observerCoracao = new IntersectionObserver((entries) => { coracaoVisivel = entries[0].isIntersecting; });
        observerCoracao.observe(container);

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            if (!coracaoVisivel) return; 

            tempo += 0.05 * window.ritmoCoracao;
            coracao.material.color.setHex(window.corCoracao);
            const batimento = 1 + Math.pow(Math.sin(tempo), 4) * 0.2;
            coracao.scale.set(batimento, batimento, batimento);
            coracao.rotation.y += 0.01;
            coracao.rotation.x += 0.005;
            
            renderer.render(scene, camera);
        };
        animar();
    };

    // --- 2. A ÁRVORE DA VIDA (FRACTAL PROCEDURAL) ---
    window.inicializarPrisma3D = () => {
        const container = document.getElementById('prisma-3d');
        if (!container || typeof THREE === 'undefined' || container.innerHTML !== "") return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        camera.position.set(0, 2, 7);

        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const luzD = new THREE.DirectionalLight(0xffd700, 1.5);
        luzD.position.set(5, 10, 5);
        scene.add(luzD);
        const luzAura = new THREE.PointLight(0xff6b6b, 2, 8);
        luzAura.position.set(0, 2, 0);
        scene.add(luzAura);

        const arvoreGroup = new THREE.Group();
        arvoreGroup.position.y = -1.5; 
        scene.add(arvoreGroup);

        let pulsoRegador = 1;
        container.addEventListener('click', () => {
            pulsoRegador = 1.15; 
            if (navigator.vibrate) navigator.vibrate([40, 60, 40]); 
        });

        const matTronco = new THREE.MeshStandardMaterial({ color: 0xD4AF37, roughness: 0.3, metalness: 0.8 }); 
        const matFolha = new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending }); 
        const matSemente = new THREE.MeshStandardMaterial({ color: 0x2ecc71, roughness: 0.2, metalness: 0.5, emissive: 0x1abc9c }); 

        let sistemaPetalas;
        const particulasCount = 80;
        const petalasGeo = new THREE.BufferGeometry();
        const petalasPos = new Float32Array(particulasCount * 3);

        const nivel = window.statusPlanta ? window.statusPlanta.nivel : 0;
        let maxProfundidade = 0;
        if (nivel > 5) maxProfundidade = 1;  
        if (nivel > 25) maxProfundidade = 2; 
        if (nivel > 50) maxProfundidade = 3; 
        if (nivel > 80) maxProfundidade = 4; 
        if (nivel >= 100) maxProfundidade = 5; 

        function criarGalho(comprimento, espessuraBase, profundidadeAtual) {
            const galhoGrupo = new THREE.Group();
            const galhoGeo = new THREE.CylinderGeometry(espessuraBase * 0.65, espessuraBase, comprimento, 6);
            galhoGeo.translate(0, comprimento / 2, 0); 
            galhoGrupo.add(new THREE.Mesh(galhoGeo, matTronco));

            if (profundidadeAtual < maxProfundidade) {
                for(let i = 0; i < 3; i++) {
                    const galhoFilho = criarGalho(comprimento * 0.75, espessuraBase * 0.65, profundidadeAtual + 1);
                    galhoFilho.position.y = comprimento; 
                    galhoFilho.rotation.y = ((Math.PI * 2) / 3) * i + (Math.random() * 0.4 - 0.2);
                    galhoFilho.rotation.z = 0.5 + (Math.random() * 0.3);
                    galhoFilho.rotation.x = (Math.random() * 0.4 - 0.2);
                    galhoGrupo.add(galhoFilho);
                }
            } else {
                if (maxProfundidade > 1) { 
                    const folha = new THREE.Mesh(new THREE.SphereGeometry(espessuraBase * 3, 5, 5), matFolha);
                    folha.position.y = comprimento;
                    galhoGrupo.add(folha);
                }
            }
            return galhoGrupo;
        }

        let semente;
        if (maxProfundidade === 0) {
            semente = new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), matSemente);
            semente.position.y = 1;
            arvoreGroup.add(semente);
        } else {
            arvoreGroup.add(criarGalho(1.5, 0.25, 1));
            if (maxProfundidade >= 4) {
                for(let i=0; i<particulasCount; i++) {
                    petalasPos[i*3] = (Math.random() - 0.5) * 6; 
                    petalasPos[i*3+1] = Math.random() * 6;       
                    petalasPos[i*3+2] = (Math.random() - 0.5) * 6; 
                }
                petalasGeo.setAttribute('position', new THREE.BufferAttribute(petalasPos, 3));
                sistemaPetalas = new THREE.Points(petalasGeo, new THREE.PointsMaterial({ color: 0xffb7c5, size: 0.1, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
                arvoreGroup.add(sistemaPetalas);
            }
        }

        let arvoreVisivel = false;
        const observerArvore = new IntersectionObserver((entries) => { arvoreVisivel = entries[0].isIntersecting; });
        observerArvore.observe(container);

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            if (!arvoreVisivel) return; 

            tempo += 0.01;
            arvoreGroup.rotation.y += 0.003;
            arvoreGroup.position.y = -1.5 + Math.sin(tempo) * 0.1;

            pulsoRegador += (1 - pulsoRegador) * 0.1; 
            arvoreGroup.scale.set(pulsoRegador, pulsoRegador, pulsoRegador);

            if (maxProfundidade === 0 && semente) {
                const pulso = 1 + Math.sin(tempo * 3) * 0.2;
                semente.scale.set(pulso, pulso, pulso);
                semente.rotation.x += 0.01; semente.rotation.y += 0.02;
            }

            if (sistemaPetalas) {
                const pos = sistemaPetalas.geometry.attributes.position.array;
                for(let i=1; i<pos.length; i+=3) {
                    pos[i] -= 0.02; 
                    pos[i-1] += Math.sin(tempo + i) * 0.01; 
                    if (pos[i] < -1.5) { pos[i] = 4 + Math.random() * 2; }
                }
                sistemaPetalas.geometry.attributes.position.needsUpdate = true;
            }
            renderer.render(scene, camera);
        };
        
        window.addEventListener('resize', () => {
            if(container.clientWidth > 0) {
                renderer.setSize(container.clientWidth, container.clientHeight);
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
            }
        });
        animar();
    };

    // --- 3. A GALÁXIA PARTICULAR ---
    window.inicializarGalaxia3D = () => {
        const container = document.getElementById('galaxia-3d');
        if (!container || typeof THREE === 'undefined' || container.innerHTML !== "") return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const particulasCount = 2000;
        const posicoes = new Float32Array(particulasCount * 3);
        const cores = new Float32Array(particulasCount * 3);
        const colorBase = new THREE.Color(0xD4AF37); 

        for(let i = 0; i < particulasCount; i++) {
            const i3 = i * 3;
            const raio = Math.random() * 6;
            const angulo = raio * 3 + (Math.random() * Math.PI * 2);
            
            posicoes[i3] = Math.cos(angulo) * raio + ((Math.random() - 0.5) * 0.8);
            posicoes[i3+1] = ((Math.random() - 0.5) * 0.3) * (raio * 0.5); 
            posicoes[i3+2] = Math.sin(angulo) * raio + ((Math.random() - 0.5) * 0.8);

            const mixedColor = colorBase.clone();
            mixedColor.lerp(new THREE.Color(0x3498db), Math.random() * (raio / 6));
            cores[i3] = mixedColor.r; cores[i3+1] = mixedColor.g; cores[i3+2] = mixedColor.b;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(posicoes, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(cores, 3));

        const galaxia = new THREE.Points(geometry, new THREE.PointsMaterial({
            size: 0.05, vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
        }));
        scene.add(galaxia);

        camera.position.set(0, 4, 7);
        camera.lookAt(0,0,0);

        let interacaoX = 0, interacaoY = 0;
        const moverGalaxia = (e) => {
            const rect = container.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            interacaoX = ((clientX - rect.left) / container.clientWidth) * 2 - 1;
            interacaoY = -((clientY - rect.top) / container.clientHeight) * 2 + 1;
        };
        container.addEventListener('mousemove', moverGalaxia);
        container.addEventListener('touchmove', moverGalaxia, {passive: true});

        let galaxiaVisivel = false;
        const observer = new IntersectionObserver((entries) => { galaxiaVisivel = entries[0].isIntersecting; });
        observer.observe(container);

        const animar = () => {
            requestAnimationFrame(animar);
            if (!galaxiaVisivel) return;
            galaxia.rotation.y += 0.003 + (interacaoX * 0.02);
            galaxia.rotation.x = interacaoY * 0.2;
            renderer.render(scene, camera);
        };
        animar();
    };

    // ==========================================
    // UI/UX NÍVEL DEUS: ORBE DA SINCRONIA (APOGEU)
    // ==========================================
    window.inicializarOrbeClima = () => {
        const container = document.getElementById('orbe-clima-3d');
        if (!container || typeof THREE === 'undefined' || container.innerHTML !== "") return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.outputEncoding = THREE.sRGBEncoding; 
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        container.appendChild(renderer.domElement);

        camera.position.z = 6.5;

        // Estúdio de Luz (Reflexo do Vidro)
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        const envScene = new THREE.Scene();
        envScene.background = new THREE.Color(0x111111);
        const envLight1 = new THREE.DirectionalLight(0xffffff, 5); envLight1.position.set(5, 5, 5); envScene.add(envLight1);
        const envLight2 = new THREE.DirectionalLight(0x3498db, 3); envLight2.position.set(-5, -5, -5); envScene.add(envLight2);
        const ambienteTextura = pmremGenerator.fromScene(envScene).texture;

        scene.add(new THREE.AmbientLight(0xffffff, 0.4));
        const orbGroup = new THREE.Group();
        scene.add(orbGroup);

        // O Cristal
        const orbeVidro = new THREE.Mesh(new THREE.SphereGeometry(2.1, 64, 64), new THREE.MeshPhysicalMaterial({
            color: 0xffffff, metalness: 0.1, roughness: 0.05, envMap: ambienteTextura,
            envMapIntensity: 2.0, clearcoat: 1.0, clearcoatRoughness: 0.05,
            transparent: true, opacity: 0.25, depthWrite: false 
        }));
        orbGroup.add(orbeVidro);

        const haloMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false });
        orbGroup.add(new THREE.Mesh(new THREE.SphereGeometry(2.25, 32, 32), haloMaterial));

        const interiorGroup = new THREE.Group();
        orbGroup.add(interiorGroup);

        // Sol, Lua, Luz, Nuvens, Chuva, Estrelas, Raio
        const solGroup = new THREE.Group();
        const nucleoSol = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        const aura1 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffaa00, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false }));
        const aura2 = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }));
        solGroup.add(nucleoSol); solGroup.add(aura1); solGroup.add(aura2);
        solGroup.position.y = 0.2; solGroup.visible = false; interiorGroup.add(solGroup);

        const lua = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.8, metalness: 0.2 }));
        lua.position.set(-0.5, 0.5, -0.5); lua.visible = false; interiorGroup.add(lua);

        const luzInterna = new THREE.PointLight(0xffffff, 1.5, 10); interiorGroup.add(luzInterna);

        const nuvensGroup = new THREE.Group();
        const nuvensMateriais = [];
        for(let i=0; i<5; i++) {
            const nuvem = new THREE.Group();
            const mat = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false });
            nuvensMateriais.push(mat);
            for(let j=0; j<5; j++){
                const bolha = new THREE.Mesh(new THREE.SphereGeometry(0.3 + Math.random()*0.2, 16, 16), mat);
                bolha.position.set((Math.random()-0.5)*0.7, (Math.random()-0.5)*0.3, (Math.random()-0.5)*0.7);
                nuvem.add(bolha);
            }
            nuvem.position.set((Math.random()-0.5)*1.8, Math.random()*0.5 + 0.2, (Math.random()-0.5)*1.8);
            nuvensGroup.add(nuvem);
        }
        nuvensGroup.visible = false; interiorGroup.add(nuvensGroup);

        const rainGeo = new THREE.BufferGeometry();
        const rainPoints = [];
        for(let i=0; i<150; i++) {
            const x = (Math.random() - 0.5) * 3; const y = (Math.random() - 0.5) * 3; const z = (Math.random() - 0.5) * 3;
            rainPoints.push(new THREE.Vector3(x, y, z)); rainPoints.push(new THREE.Vector3(x, y - 0.2, z)); 
        }
        rainGeo.setFromPoints(rainPoints);
        const chuva = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6, depthWrite: false }));
        chuva.visible = false; interiorGroup.add(chuva);

        const estrelasGeo = new THREE.BufferGeometry();
        const estrelasPos = new Float32Array(300 * 3);
        for(let i=0; i<300*3; i++) estrelasPos[i] = (Math.random() - 0.5) * 3;
        estrelasGeo.setAttribute('position', new THREE.BufferAttribute(estrelasPos, 3));
        const estrelas = new THREE.Points(estrelasGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); 
        estrelas.visible = false; interiorGroup.add(estrelas);

        const flashLight = new THREE.PointLight(0xaaaaff, 0, 10); flashLight.position.set(0, 1, 0); interiorGroup.add(flashLight);

        window.mudarClimaOrbe = (condicao, eNoite) => {
            solGroup.visible = false; lua.visible = false; nuvensGroup.visible = false; chuva.visible = false; estrelas.visible = false;
            orbGroup.scale.set(0.8, 0.8, 0.8);

            if (condicao === 'Rain' || condicao === 'Thunderstorm' || condicao === 'Drizzle') {
                nuvensMateriais.forEach(m => m.color.setHex(0x555555)); haloMaterial.color.setHex(0x555555);
                nuvensGroup.visible = true; chuva.visible = true; luzInterna.color.setHex(0x444455);
                window.climaAtivo = condicao;
            } else if (condicao === 'Clouds') {
                nuvensMateriais.forEach(m => m.color.setHex(eNoite ? 0x606060 : 0xffffff)); haloMaterial.color.setHex(eNoite ? 0x2c3e50 : 0xbdc3c7);
                nuvensGroup.visible = true; if(eNoite) lua.visible = true;
                luzInterna.color.setHex(eNoite ? 0xaaaaaa : 0xffffff);
                window.climaAtivo = 'nuvens';
            } else {
                if (eNoite) { lua.visible = true; estrelas.visible = true; haloMaterial.color.setHex(0x0a0a2a); luzInterna.color.setHex(0x8888aa); window.climaAtivo = 'noite'; } 
                else { solGroup.visible = true; haloMaterial.color.setHex(0xf1c40f); luzInterna.color.setHex(0xffd700); window.climaAtivo = 'sol'; }
            }
        };

        // CORREÇÃO DA CONDIÇÃO DE CORRIDA: Se o clima já foi baixado da internet, atualiza o Orbe na mesma hora!
        if (window.dadosClima && window.dadosClima[window.climaExibido]) {
            const dados = window.dadosClima[window.climaExibido];
            const eNoite = Math.floor(Date.now()/1000) < dados.sys.sunrise || Math.floor(Date.now()/1000) > dados.sys.sunset;
            window.mudarClimaOrbe(dados.weather[0].main, eNoite);
        }

        window.addEventListener('resize', () => {
            if(container.clientWidth > 0) {
                renderer.setSize(container.clientWidth, container.clientHeight);
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
            }
        });

        let orbeVisivel = false;
        const observer = new IntersectionObserver((entries) => { orbeVisivel = entries[0].isIntersecting; });
        observer.observe(container);

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            if (!orbeVisivel) return; 
            tempo += 0.01;
            
            if (orbGroup.scale.x < 1) { orbGroup.scale.x += 0.01; orbGroup.scale.y += 0.01; orbGroup.scale.z += 0.01; }
            orbGroup.rotation.y += 0.002;
            interiorGroup.position.y = Math.sin(tempo) * 0.05;

            if (window.climaAtivo === 'Rain' || window.climaAtivo === 'Thunderstorm' || window.climaAtivo === 'Drizzle') {
                const pos = chuva.geometry.attributes.position.array;
                for(let i=1; i<pos.length; i+=3) {
                    pos[i] -= 0.15; if (pos[i] < -1.5) pos[i] = 1.5;
                }
                chuva.geometry.attributes.position.needsUpdate = true;
                nuvensGroup.rotation.y -= 0.002;
                flashLight.intensity = (window.climaAtivo === 'Thunderstorm' || Math.random() > 0.995) ? Math.random() * 5 : Math.max(0, flashLight.intensity - 0.2);
            }
            else if (window.climaAtivo === 'nuvens') nuvensGroup.rotation.y += 0.001;
            else if (window.climaAtivo === 'sol') {
                aura1.scale.setScalar(1 + Math.sin(tempo * 3) * 0.1);
                aura2.scale.setScalar(1 + Math.sin(tempo * 2) * 0.15);
                nucleoSol.rotation.y += 0.01;
            }
            else if (window.climaAtivo === 'noite') estrelas.rotation.y += 0.001;

            renderer.render(scene, camera);
        };
        animar();
    };

    // ==========================================
    // UI/UX NÍVEL TITÃ: O OCEANO DE FIOS DE OURO
    // ==========================================
    window.inicializarOceanoQuantico = () => {
        const container = document.getElementById('oceano-quantico-3d');
        if (!container || typeof THREE === 'undefined') return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(0, 5, 20); camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        const oceanSize = 120; const segments = 50; 
        const geometry = new THREE.PlaneGeometry(oceanSize, oceanSize, segments, segments);
        geometry.rotateX(-Math.PI / 2); 

        scene.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xD4AF37, size: 0.15, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending })));
        scene.add(new THREE.LineSegments(new THREE.WireframeGeometry(geometry), new THREE.LineBasicMaterial({ color: 0xD4AF37, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending })));

        let worldMouseX = 1000, worldMouseZ = 1000;
        const mapearToque = (e) => {
            const x = e.clientX || (e.touches && e.touches[0].clientX);
            const y = e.clientY || (e.touches && e.touches[0].clientY);
            if(x !== undefined && y !== undefined) {
                worldMouseX = (x / window.innerWidth) * 60 - 30; 
                worldMouseZ = (y / window.innerHeight) * 40 - 15; 
            }
        };
        
        window.addEventListener('mousemove', mapearToque);
        window.addEventListener('touchmove', mapearToque, {passive: true});
        const limparToque = () => { worldMouseX = 1000; worldMouseZ = 1000; };
        window.addEventListener('mouseleave', limparToque);
        window.addEventListener('touchend', limparToque);

        const clock = new THREE.Clock();
        let telaAtiva = true;
        document.addEventListener("visibilitychange", () => { telaAtiva = !document.hidden; });

        let ultimoFrame = 0; const intervaloFrame = 1000 / 30; 

        const animar = (tempoAtual) => {
            requestAnimationFrame(animar);
            if (!telaAtiva) return; 
            if (tempoAtual - ultimoFrame < intervaloFrame) return;
            ultimoFrame = tempoAtual;

            const time = clock.getElapsedTime() * 0.8; 
            const positions = geometry.attributes.position.array;

            for(let i = 0; i < geometry.attributes.position.count; i++) {
                const px = positions[i * 3]; const pz = positions[i * 3 + 2]; 
                let y = Math.sin(px * 0.2 + time) * Math.cos(pz * 0.2 + time) * 1.5;
                const dist = Math.sqrt(Math.pow(px - worldMouseX, 2) + Math.pow(pz - worldMouseZ, 2));
                if (dist < 8) y -= Math.cos(dist * Math.PI / 8) * 2 + 2; 
                positions[i * 3 + 1] = y; 
            }
            
            geometry.attributes.position.needsUpdate = true;
            camera.position.x = Math.sin(time * 0.1) * 3;
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };

        window.addEventListener('resize', () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
        animar(0);
    };

// ==========================================
    // UI/UX NÍVEL TITÃ: ECOS DO SANTUÁRIO (ÁUDIO 3D)
    // ==========================================
    
    // Variáveis Globais do Áudio
    window.ecoAudioContext = null;
    window.ecoAnalyser = null;
    window.ecoDataArray = null;
    let mediaRecorder;
    let audioChunks = [];
    let audioAtual = new Audio();
    
    window.inicializarEco3D = () => {
        const container = document.getElementById('eco-3d');
        if (!container || typeof THREE === 'undefined' || container.innerHTML !== "") return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        camera.position.z = 5;

        // A Esfera de Fios de Ouro (A Alma do Áudio)
        // Usamos Icosahedron com muitos detalhes para termos vértices suficientes para distorcer
        const geometry = new THREE.IcosahedronGeometry(1.5, 12);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0xD4AF37, 
            wireframe: true, 
            transparent: true, 
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const esferaEco = new THREE.Mesh(geometry, material);
        scene.add(esferaEco);

        // Salva a posição original dos vértices para podermos deformar e voltar ao normal
        const positionAttribute = geometry.attributes.position;
        const vertexOriginals = [];
        for (let i = 0; i < positionAttribute.count; i++) {
            vertexOriginals.push(new THREE.Vector3().fromBufferAttribute(positionAttribute, i));
        }

        // Sono Quântico (Economia de Bateria)
        let ecoVisivel = false;
        const observerEco = new IntersectionObserver((entries) => { ecoVisivel = entries[0].isIntersecting; });
        observerEco.observe(container);

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            if (!ecoVisivel) return;

            tempo += 0.01;
            esferaEco.rotation.y += 0.005;
            esferaEco.rotation.x += 0.002;

            // FÍSICA DO SOM: Distorce os vértices se houver áudio tocando ou gravando
            if (window.ecoAnalyser && window.ecoDataArray) {
                window.ecoAnalyser.getByteFrequencyData(window.ecoDataArray);
                
                // Pega a média de volume das frequências
                let soma = 0;
                for(let i=0; i < window.ecoDataArray.length; i++) soma += window.ecoDataArray[i];
                let mediaVolume = soma / window.ecoDataArray.length;
                
                // Brilho reage ao volume
                material.opacity = 0.3 + (mediaVolume / 255) * 0.7;
                material.color.setHex(mediaVolume > 150 ? 0xffffff : 0xD4AF37); // Fica branco nos picos altos

                // Deformação da malha 3D
                const positions = geometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    const vertex = vertexOriginals[i].clone();
                    // Cria uma distorção baseada na frequência específica daquele vértice + ruído matemático
                    const distorcao = 1 + (window.ecoDataArray[i % window.ecoDataArray.length] / 255) * 0.5;
                    vertex.multiplyScalar(distorcao);
                    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                positions.needsUpdate = true;
            } else {
                // Respiração normal se estiver em silêncio
                const pos = geometry.attributes.position;
                for (let i = 0; i < pos.count; i++) {
                    const vertex = vertexOriginals[i].clone();
                    vertex.multiplyScalar(1 + Math.sin(tempo * 2 + vertex.y) * 0.05);
                    pos.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                pos.needsUpdate = true;
                material.color.setHex(0xD4AF37);
                material.opacity = 0.4;
            }

            renderer.render(scene, camera);
        };
        animar();

        // Buscar se já tem um eco salvo no banco ao iniciar
        if(window.SantuarioApp && window.SantuarioApp.modulos) {
            const { db, ref, onValue } = window.SantuarioApp.modulos;
            onValue(ref(db, 'eco_diario'), (snapshot) => {
                const dados = snapshot.val();
                if (dados && dados.audioBase64) {
                    window.audioCarregado = dados.audioBase64;
                    document.getElementById('btn-ouvir-eco').style.display = 'block';
                    document.getElementById('status-eco').innerText = `Eco deixado por ${dados.autor} às ${dados.hora}`;
                    document.getElementById('status-eco').style.color = "#2ecc71";
                }
            });
        }
    };

    // --- FUNÇÕES DE GRAVAÇÃO E PLAYBACK DE ÁUDIO ---

    window.iniciarGravacao = async () => {
        const btnGravar = document.getElementById('btn-gravar-eco');
        const status = document.getElementById('status-eco');
        
        try {
            // Pede permissão e abre o microfone
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Configura o Analisador Web Audio para o 3D ler a voz em tempo real!
            window.ecoAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = window.ecoAudioContext.createMediaStreamSource(stream);
            window.ecoAnalyser = window.ecoAudioContext.createAnalyser();
            window.ecoAnalyser.fftSize = 64; // Resolução das ondas
            source.connect(window.ecoAnalyser);
            window.ecoDataArray = new Uint8Array(window.ecoAnalyser.frequencyBinCount);

            // Inicia o gravador
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
            mediaRecorder.start();

            btnGravar.style.background = "#ff6b6b";
            btnGravar.style.color = "#fff";
            btnGravar.style.transform = "scale(1.2)";
            status.innerText = "Capturando a sua voz... (Solte para enviar)";
            status.style.color = "#ff6b6b";

        } catch (err) {
            status.innerText = "Permissão de microfone negada.";
            console.error(err);
        }
    };

    window.pararGravacao = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            mediaRecorder.stop();
            const status = document.getElementById('status-eco');
            const btnGravar = document.getElementById('btn-gravar-eco');
            
            btnGravar.style.background = "rgba(0,0,0,0.5)";
            btnGravar.style.color = "var(--cor-primaria)";
            btnGravar.style.transform = "scale(1)";
            status.innerText = "Compactando e enviando para o espaço...";

            // Desliga a leitura do microfone para o 3D
            if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach(track => track.stop());

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                // Converte o arquivo de som para Texto Base64 para caber no Realtime DB
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    
                    // Envia para o Firebase
                    if(window.SantuarioApp && window.SantuarioApp.modulos) {
                        const { db, ref, set } = window.SantuarioApp.modulos;
                        const agora = new Date();
                        set(ref(db, 'eco_diario'), {
                            audioBase64: base64Audio,
                            autor: window.MEU_NOME,
                            hora: `${agora.getHours().toString().padStart(2, '0')}:${agora.getMinutes().toString().padStart(2, '0')}`,
                            timestamp: agora.getTime()
                        }).then(() => {
                            status.innerText = "Sua voz chegou ao destino.";
                            status.style.color = "#2ecc71";
                            // Limpa o analisador
                            window.ecoAnalyser = null;
                        });
                    }
                };
            };
        }
    };

    window.tocarEco = () => {
        if (!window.audioCarregado) return;
        
        // Configura o áudio
        audioAtual.src = window.audioCarregado;
        audioAtual.play();

        // Configura o Analisador para o 3D reagir ao áudio gravado!
        if (!window.ecoAudioContext) {
            window.ecoAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Evita reconectar a mesma fonte 2 vezes e travar
        if (!window.sourceAtual) {
            window.sourceAtual = window.ecoAudioContext.createMediaElementSource(audioAtual);
            window.ecoAnalyser = window.ecoAudioContext.createAnalyser();
            window.ecoAnalyser.fftSize = 64;
            window.sourceAtual.connect(window.ecoAnalyser);
            window.ecoAnalyser.connect(window.ecoAudioContext.destination); // Manda o som pra caixa de som do celular
            window.ecoDataArray = new Uint8Array(window.ecoAnalyser.frequencyBinCount);
        }

        // Retoma o contexto caso o navegador tenha bloqueado
        if (window.ecoAudioContext.state === 'suspended') {
            window.ecoAudioContext.resume();
        }

        const status = document.getElementById('status-eco');
        status.innerText = "Escutando...";
        
        audioAtual.onended = () => {
            status.innerText = "Eco finalizado.";
            window.ecoAnalyser = null; // A esfera para de pular
        };
    };

// ==========================================
    // UI/UX NÍVEL TITÃ: A BÚSSOLA DO DESTINO (GIROSCÓPIO 3D)
    // ==========================================
    
    window.agulhaBussola = null;
    window.anguloAlvoBussola = 0;
    
    window.inicializarBussola3D = () => {
        const container = document.getElementById('bussola-3d');
        if (!container || typeof THREE === 'undefined' || container.innerHTML.indexOf('canvas') !== -1) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        // Insere o canvas ANTES do overlay de botão
        container.insertBefore(renderer.domElement, container.firstChild);

        camera.position.set(0, 5, 0); // Câmera olhando de cima para baixo
        camera.lookAt(0, 0, 0);

        // Luzes Mágicas
        scene.add(new THREE.AmbientLight(0xffffff, 0.6));
        const luzDirecional = new THREE.DirectionalLight(0xffd700, 1.5);
        luzDirecional.position.set(5, 10, 2);
        scene.add(luzDirecional);

        // O Anel da Bússola
        const anelGeo = new THREE.TorusGeometry(1.5, 0.05, 16, 64);
        const anelMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });
        const anel = new THREE.Mesh(anelGeo, anelMat);
        anel.rotation.x = Math.PI / 2;
        scene.add(anel);

        // A Agulha de Ouro
        const agulhaGroup = new THREE.Group();
        
        // Parte Norte (Aponta para o amor) - Vermelha/Dourada
        const agulhaNorteGeo = new THREE.ConeGeometry(0.2, 1.4, 4);
        const agulhaNorteMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, metalness: 0.5, roughness: 0.3 });
        const agulhaNorte = new THREE.Mesh(agulhaNorteGeo, agulhaNorteMat);
        agulhaNorte.position.z = -0.7;
        agulhaNorte.rotation.x = Math.PI / 2;
        agulhaNorte.rotation.y = Math.PI / 4; // Deixa a base do cone reta
        agulhaGroup.add(agulhaNorte);

        // Parte Sul (Contrapeso) - Prata Escura
        const agulhaSulGeo = new THREE.ConeGeometry(0.2, 1.4, 4);
        const agulhaSulMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 });
        const agulhaSul = new THREE.Mesh(agulhaSulGeo, agulhaSulMat);
        agulhaSul.position.z = 0.7;
        agulhaSul.rotation.x = -Math.PI / 2;
        agulhaSul.rotation.y = Math.PI / 4;
        agulhaGroup.add(agulhaSul);

        // Eixo central
        const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0xD4AF37 }));
        agulhaGroup.add(eixo);

        scene.add(agulhaGroup);
        window.agulhaBussola = agulhaGroup;

        // Sono Quântico
        let bussolaVisivel = false;
        const observerBussola = new IntersectionObserver((entries) => { bussolaVisivel = entries[0].isIntersecting; });
        observerBussola.observe(container);

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            if (!bussolaVisivel) return;

            tempo += 0.02;
            
            // Flutuação suave da bússola inteira
            anel.position.y = Math.sin(tempo) * 0.1;
            agulhaGroup.position.y = Math.sin(tempo) * 0.1;

            // Rotação suave da agulha em direção ao alvo usando interpolação (suavidade)
            // A matemática garante que ela não dê uma volta completa estranha ao passar pelo eixo 0/360
            let diferenca = window.anguloAlvoBussola - agulhaGroup.rotation.y;
            while (diferenca < -Math.PI) diferenca += Math.PI * 2;
            while (diferenca > Math.PI) diferenca -= Math.PI * 2;
            
            agulhaGroup.rotation.y += diferenca * 0.05; // Velocidade da agulha

            renderer.render(scene, camera);
        };
        animar();
    };

    // --- MATEMÁTICA GEOGRÁFICA E SENSORES ---

    window.ativarSensoresBussola = () => {
        const overlay = document.getElementById('overlay-bussola');
        const status = document.getElementById('status-bussola');
        const textoAlvo = document.getElementById('texto-alvo-bussola');

        // Coordenadas Fixas
        const latColombo = -25.2917; const lonColombo = -49.2242;
        const latGoiania = -16.6869; const lonGoiania = -49.2648;
        
        let latAlvo = window.souJoao ? latGoiania : latColombo;
        let lonAlvo = window.souJoao ? lonGoiania : lonColombo;

        if(textoAlvo) textoAlvo.innerText = window.souJoao ? "Apontando para Goiânia (Thamiris)" : "Apontando para Colombo (João)";

        // Matemática Esférica (Haversine)
        const calcularBearing = (lat1, lon1, lat2, lon2) => {
            const toRad = deg => deg * Math.PI / 180;
            const toDeg = rad => rad * 180 / Math.PI;
            const dLon = toRad(lon2 - lon1);
            lat1 = toRad(lat1); lat2 = toRad(lat2);
            const y = Math.sin(dLon) * Math.cos(lat2);
            const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
            return (toDeg(Math.atan2(y, x)) + 360) % 360;
        };

        // Pedido de Permissão (Especial para iOS 13+)
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response === 'granted') {
                        if(overlay) overlay.style.display = 'none';
                        iniciarRastreamento(latAlvo, lonAlvo, calcularBearing);
                    } else {
                        status.innerText = "Permissão magnética negada pelo iPhone.";
                    }
                })
                .catch(console.error);
        } else {
            // Android e navegadores modernos
            if(overlay) overlay.style.display = 'none';
            iniciarRastreamento(latAlvo, lonAlvo, calcularBearing);
        }
    };

    function iniciarRastreamento(latAlvo, lonAlvo, calcularBearing) {
        const status = document.getElementById('status-bussola');
        status.innerText = "Calibrando satélites...";
        let bearingAlvo = 0;

        // O Motor do Giroscópio
        const iniciarGiroscopio = () => {
            let sensorDetectado = false;

            const orientacaoHandler = (event) => {
                let compass;
                // Detecta iPhone (webkitCompassHeading) ou Android (alpha)
                if (event.webkitCompassHeading !== undefined && event.webkitCompassHeading !== null) {
                    compass = event.webkitCompassHeading;
                    sensorDetectado = true;
                } else if (event.alpha !== null && event.alpha !== undefined) {
                    compass = 360 - event.alpha;
                    sensorDetectado = true;
                }

                if (sensorDetectado) {
                    let anguloFinal = (bearingAlvo - compass) * (Math.PI / 180);
                    window.anguloAlvoBussola = anguloFinal;
                    status.innerText = "Sincronizado e apontando.";
                }
            };

            // Escuta as variações magnéticas da Terra
            window.addEventListener('deviceorientationabsolute', orientacaoHandler, true);
            window.addEventListener('deviceorientation', orientacaoHandler, true);

            // Trava de segurança: Se o sensor não responder em 2.5 segundos, avisa que é PC
            setTimeout(() => {
                if (!sensorDetectado) {
                    status.innerText = "⚠️ Seu aparelho não possui Bússola/Magnetômetro.";
                }
            }, 2500);
        };

        // Pega a Localização GPS primeiro
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                bearingAlvo = calcularBearing(position.coords.latitude, position.coords.longitude, latAlvo, lonAlvo);
                iniciarGiroscopio();
            }, (err) => {
                status.innerText = "GPS desligado. Usando rota estimada.";
                const latAtual = window.souJoao ? -25.2917 : -16.6869;
                const lonAtual = window.souJoao ? -49.2242 : -49.2648;
                bearingAlvo = calcularBearing(latAtual, lonAtual, latAlvo, lonAlvo);
                iniciarGiroscopio();
            }, { enableHighAccuracy: true });
        } else {
            status.innerText = "Navegador sem suporte a GPS.";
        }
    }

// ==========================================
// CARROSSEL DE HORIZONTES - MOTOR BLINDADO
// ==========================================
window.inicializarCarrossel3D = () => {
    const container = document.getElementById('carrossel-3d');
    if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    camera.position.z = 5;
    scene.add(new THREE.AmbientLight(0xffffff, 1.5));

    const carrosselGroup = new THREE.Group();
    scene.add(carrosselGroup);

    const geometriaQuadro = new THREE.PlaneGeometry(2, 2.5);
    const texturaCarregador = new THREE.TextureLoader();
    let quadros = [];
    let timerCliqueLongo;

    const construirCarrossel = (fotosArray) => {
        while(carrosselGroup.children.length > 0){ carrosselGroup.remove(carrosselGroup.children[0]); }
        quadros = [];
        const corTema = getComputedStyle(document.documentElement).getPropertyValue('--cor-primaria').trim() || "#D4AF37";

        if (!fotosArray || fotosArray.length === 0) {
            const matVazio = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, side: THREE.DoubleSide });
            const quadro = new THREE.Mesh(geometriaQuadro, matVazio);
            const borda = new THREE.LineSegments(new THREE.EdgesGeometry(geometriaQuadro), new THREE.LineBasicMaterial({ color: new THREE.Color(corTema) }));
            quadro.add(borda);
            carrosselGroup.add(quadro);
            quadros.push(quadro);
            return;
        }

        const raio = Math.max(3, fotosArray.length * 0.7);
        const anguloPasso = (Math.PI * 2) / fotosArray.length;

        fotosArray.forEach((fotoBase64, index) => {
            texturaCarregador.load(fotoBase64, (textura) => {
                const material = new THREE.MeshBasicMaterial({ map: textura, side: THREE.DoubleSide, transparent: true });
                const quadro = new THREE.Mesh(geometriaQuadro, material);
                const angulo = index * anguloPasso;
                quadro.position.set(Math.sin(angulo) * raio, 0, Math.cos(angulo) * raio);
                quadro.rotation.y = angulo;
                quadro.userData = { index: index }; 

                const borda = new THREE.LineSegments(new THREE.EdgesGeometry(geometriaQuadro), new THREE.LineBasicMaterial({ color: 0xD4AF37 }));
                quadro.add(borda);
                carrosselGroup.add(quadro);
                quadros.push(quadro);
            });
        });
    };

    // Lógica de Interação
    let isDragging = false, previousX = 0, velocidadeGiro = 0.005;

    const iniciarAoTocar = (e) => {
        isDragging = true;
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const y = e.clientY || (e.touches && e.touches[0].clientY);
        previousX = x;
        velocidadeGiro = 0;

        // Clique Longo para Apagar
        const rect = container.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((x - rect.left) / container.clientWidth) * 2 - 1,
            -((y - rect.top) / container.clientHeight) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(quadros);

        if (intersects.length > 0 && intersects[0].object.userData.index !== undefined) {
            timerCliqueLongo = setTimeout(() => {
                window.confirmarExclusaoFoto(intersects[0].object.userData.index);
            }, 1200);
        }
    };

    const moverAoTocar = (e) => {
        if (!isDragging) return;
        const x = e.clientX || (e.touches && e.touches[0].clientX);
        const delta = x - previousX;
        carrosselGroup.rotation.y += delta * 0.01;
        velocidadeGiro = delta * 0.002;
        previousX = x;
        clearTimeout(timerCliqueLongo);
    };

    const finalizarToque = () => {
        isDragging = false;
        clearTimeout(timerCliqueLongo);
    };

    container.addEventListener('mousedown', iniciarAoTocar);
    window.addEventListener('mousemove', moverAoTocar);
    window.addEventListener('mouseup', finalizarToque);
    container.addEventListener('touchstart', iniciarAoTocar, {passive: true});
    window.addEventListener('touchmove', moverAoTocar, {passive: false});
    window.addEventListener('touchend', finalizarToque);

    if(window.SantuarioApp?.modulos) {
        const { db, ref, onValue } = window.SantuarioApp.modulos;
        onValue(ref(db, 'horizontes/fotos'), (snapshot) => {
            const dados = snapshot.val();
            construirCarrossel(Array.isArray(dados) ? dados : []);
        });
    }

    const animar = () => {
        requestAnimationFrame(animar);
        carrosselGroup.position.y = Math.sin(Date.now() * 0.002) * 0.1;
        if (!isDragging) {
            carrosselGroup.rotation.y += velocidadeGiro;
            velocidadeGiro = velocidadeGiro * 0.95 + 0.005 * 0.05;
        }
        renderer.render(scene, camera);
    };
    animar();
};

window.confirmarExclusaoFoto = (index) => {
    if (confirm("Deseja apagar esta foto específica?")) {
        const { db, ref, get, set } = window.SantuarioApp.modulos;
        const r = ref(db, 'horizontes/fotos');
        get(r).then(s => {
            let f = s.val() || [];
            f.splice(index, 1);
            set(r, f);
        });
    }
};

window.limparCarrosselHorizontes = () => {
    if (confirm("Apagar TODAS as fotos da galeria?")) {
        const { db, ref, set } = window.SantuarioApp.modulos;
        set(ref(db, 'horizontes/fotos'), null);
    }
};

window.processarFotoHorizonte = (event) => {
    const file = event.target.files[0];
    if (!file || !window.SantuarioApp?.modulos) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const scale = Math.min(600 / img.width, 800 / img.height, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL('image/jpeg', 0.7);
            const { db, ref, get, set } = window.SantuarioApp.modulos;
            const r = ref(db, 'horizontes/fotos');
            get(r).then(s => {
                let f = s.val() || [];
                f.push(base64);
                if(f.length > 8) f.shift();
                set(r, f);
            });
        };
    };
};

    // ==========================================
    // INICIALIZADOR GLOBAL MESTRE (O BOOT)
    // ==========================================
    window.addEventListener('load', () => {
        if(typeof inicializarGlobo3D === 'function') inicializarGlobo3D();
        if(typeof inicializarCoracao3D === 'function') inicializarCoracao3D();
        if(typeof inicializarOrbeClima === 'function') inicializarOrbeClima();
        if(typeof inicializarOceanoQuantico === 'function') inicializarOceanoQuantico();
        if(typeof inicializarEco3D === 'function') inicializarEco3D();
        if(typeof inicializarBussola3D === 'function') inicializarBussola3D();
        if(typeof inicializarCarrossel3D === 'function') inicializarCarrossel3D(); // <--- AGORA VAI LIGAR!
    });

}); 
}