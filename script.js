// ==========================================
// VARIÁVEIS GLOBAIS DE ESTADO
// ==========================================
window.statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", ultimaVerificacao: Date.now(), sequencia: 0, ciclos: 0 };
let audioJogos = null;
let telaAtual = 'home';
const dataInicio = new Date("2025-10-29T16:30:00").getTime();

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


// 4. JOGO: TERMO (Estado Global Corrigido)
let tentativaAtual = 0;
let letraAtual = 0;
// A grade DEVE nascer como uma Matriz 2D (Lista de Listas)
let grade = [
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""],
    ["", "", "", "", ""]
];

function salvarEstadoTermo() {
    const estado = {
        tentativaAtual: tentativaAtual,
        letraAtual: letraAtual,
        grade: grade
    };
    sessionStorage.setItem('termo_estado', JSON.stringify(estado));
}

// ==========================================
// CONSTRUÇÃO DO ORÁCULO DE CRISTAL (TERMO)
// ==========================================
function inicializarTermo() {
    const gradeElemento = document.getElementById("grade-termo");
    const tecladoElemento = document.getElementById("teclado-termo");

    if (!gradeElemento || !tecladoElemento) return;

    // Limpa o terreno para desenhar a nova versão
    gradeElemento.innerHTML = "";
    tecladoElemento.innerHTML = "";

    // 1. GERA A GRADE (Com as novas classes Premium do CSS)
    for (let i = 0; i < 6; i++) {
        const linha = document.createElement("div");
        linha.className = "linha-termo"; // Nome novo!
        
        for (let j = 0; j < 5; j++) {
            const quadrado = document.createElement("div");
            quadrado.className = "termo-quadrado"; // Nome novo!
            quadrado.id = `q-${i}-${j}`;
            linha.appendChild(quadrado);
        }
        gradeElemento.appendChild(linha);
    }

    // 2. GERA O TECLADO (Com as novas classes Premium do CSS)
    const linhasTeclado = [
        ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
        ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
        ["Z", "X", "C", "V", "B", "N", "M", "⌫"]
    ];

    linhasTeclado.forEach((linhaLetras) => {
        const linhaDiv = document.createElement("div");
        linhaDiv.className = "teclado-linha";
        
        linhaLetras.forEach(letra => {
            const botao = document.createElement("button");
            botao.id = `tecla-${letra}`;
            
            if (letra === "⌫") {
                botao.className = "tecla tecla-larga";
                botao.innerText = "⌫";
                botao.onclick = removerLetra;
            } else {
                botao.className = "tecla";
                botao.innerText = letra;
                botao.onclick = () => adicionarLetra(letra);
            }
            
            linhaDiv.appendChild(botao);
        });
        tecladoElemento.appendChild(linhaDiv);
    });

    // Puxa as memórias caso a pessoa tenha saído no meio do jogo
    if (typeof restaurarEstadoTermo === 'function') {
        restaurarEstadoTermo();
    }

    const moedasUI = document.getElementById('termo-moedas'); if (moedasUI) moedasUI.innerText = window.pontosDoCasal || 0;
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

// Para colocar a letra dentro de um <span> para o 3D funcionar
function adicionarLetra(letra) {
    if (letraAtual < 5 && tentativaAtual < 6) {
        grade[tentativaAtual][letraAtual] = letra;
        const quadrado = document.getElementById(`q-${tentativaAtual}-${letraAtual}`);
        if (quadrado) {
            quadrado.innerText = letra;
            // Aciona a animação de "Pop" e a borda dourada
            quadrado.classList.add("preenchido");
            if(window.Haptics) window.Haptics.toqueLeve();
        }
        letraAtual++;
    }
}

function removerLetra() {
    if (letraAtual > 0 && tentativaAtual < 6) {
        letraAtual--;
        grade[tentativaAtual][letraAtual] = "";
        const quadrado = document.getElementById(`q-${tentativaAtual}-${letraAtual}`);
        if (quadrado) {
            quadrado.innerText = "";
            // Remove a animação e a borda dourada
            quadrado.classList.remove("preenchido");
            if(window.Haptics) window.Haptics.toqueLeve();
        }
    }
}

// O Grande Veredito com Animação em Cascata
window.verificarPalavra = function() {
    if (letraAtual !== 5) {
        if(typeof mostrarToast === 'function') mostrarToast("A palavra precisa ter 5 letras!", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
    const palpite = grade[tentativaAtual].join("");
    let letrasRestantes = palavraFinal.split(""); 
    let statusClasses = ["ausente", "ausente", "ausente", "ausente", "ausente"];

    // 1ª Passagem: Verifica as CORRETAS (Verde)
    for (let i = 0; i < 5; i++) {
        if (palpite[i] === palavraFinal[i]) {
            statusClasses[i] = "correta";
            letrasRestantes[i] = null; 
        }
    }

    // 2ª Passagem: Verifica as PRESENTES (Amarelo)
    for (let i = 0; i < 5; i++) {
        if (statusClasses[i] !== "correta") {
            const indexNaPalavra = letrasRestantes.indexOf(palpite[i]);
            if (indexNaPalavra !== -1) {
                statusClasses[i] = "presente";
                letrasRestantes[indexNaPalavra] = null; 
            }
        }
    }

    // A MÁGICA DO FLIP 3D EM CASCATA
    let acertos = 0;
    
    // Desativa o botão temporariamente para evitar spam de cliques
    const btnVerificar = document.getElementById("btn-verificar");
    if(btnVerificar) btnVerificar.disabled = true;

    for (let i = 0; i < 5; i++) {
        // Cria o atraso em cascata (0ms, 300ms, 600ms, 900ms, 1200ms)
        setTimeout(() => {
            const quadrado = document.getElementById(`q-${tentativaAtual}-${i}`);
            if (quadrado) {
                // Inicia o giro 3D
                quadrado.classList.add("anim-flip");
                
                // No meio do giro (300ms), muda a cor!
                setTimeout(() => {
                    quadrado.classList.add(statusClasses[i]);
                    quadrado.style.color = "#000"; // Força a cor do texto para preto
                    if(window.Haptics) navigator.vibrate(30); // Vibra a cada letra revelada!
                }, 300);
            }

            // Atualiza a cor no Teclado
            setTimeout(() => {
                const tecla = document.getElementById(`tecla-${palpite[i]}`);
                if (tecla) {
                    if (statusClasses[i] === "correta") {
                        tecla.className = `tecla correta`;
                    } else if (statusClasses[i] === "presente" && !tecla.classList.contains("correta")) {
                        tecla.className = `tecla presente`;
                    } else if (statusClasses[i] === "ausente" && !tecla.classList.contains("correta") && !tecla.classList.contains("presente")) {
                        tecla.className = `tecla ausente`;
                    }
                }
            }, 300);

            if (statusClasses[i] === "correta") acertos++;

            // Se for a última letra da linha, checa se ganhou ou perdeu
            if (i === 4) {
                setTimeout(() => {
                    if(btnVerificar) btnVerificar.disabled = false; // Reativa o botão
                    
                    if (acertos === 5) {
                        if(typeof mostrarToast === 'function') mostrarToast("O Oráculo revelou a verdade!", "✨");
                        if(window.Haptics) navigator.vibrate([100, 50, 100, 50, 200]);
                        if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#2ecc71'], particleCount: 150, spread: 100});
                        
                        if(typeof finalizarVitoria === 'function') finalizarVitoria();
                        
                    } else {
                        tentativaAtual++;
                        letraAtual = 0;
                        salvarEstadoTermo();
                        
                        if (tentativaAtual >= 6) {
                            if(typeof mostrarToast === 'function') mostrarToast(`Sua jornada falhou. A palavra era: ${palavraFinal}`, "💔");
                            if(window.Haptics) window.Haptics.erro();
                            const reset = document.getElementById('termo-reset-container');
                            if(reset) reset.classList.remove('escondido');
                        }
                    }
                }, 400); // Espera o último flip terminar
            }
        }, i * 300); // Multiplicador de tempo para a cascata
    }
};

function verificarFimDeJogo(palpite, palavraFinal) {
    if (palpite === palavraFinal) {
        // VITÓRIA! O ECOSISTEMA SE CONECTA
        mostrarToast("O Oráculo revelou a verdade! +50💰", "✨");
        
        // Dá dinheiro para a Fazenda!
        if (typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(50, "Vitória no Oráculo");
        }
        
        finalizarVitoria();
    } else {
        tentativaAtual++;
        letraAtual = 0;
        salvarEstadoTermo();
        if (tentativaAtual === 6) {
            mostrarToast("A névoa cobriu o oráculo... Tente novamente.");
            document.getElementById('termo-reset-container').classList.remove('escondido');
            if(window.Haptics) window.Haptics.erro();
        }
    }
}

// ==========================================
// A CHAVE DO COFRE E A MISERICÓRDIA DO ORÁCULO
// ==========================================

// Conecta a vitória do Oráculo com a porta do Cofre.
function finalizarVitoria() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // 1. Salva na memória profunda do celular que vocês ganharam hoje!
    localStorage.setItem('santuario_vitoria_dia', hoje);
    
    // 2. A MÁGICA: Destranca o cofre visualmente e atualiza a tela Home
    if (typeof liberarCofreVisual === 'function') liberarCofreVisual();
    if (typeof atualizarDinamicaHome === 'function') atualizarDinamicaHome();
    
    // 3. Atualiza a Ofensiva Diária (O "foguinho" dos rituais)
    if (typeof window.verificarRitualDoDia === 'function') window.verificarRitualDoDia();
    
    // 4. Limpa o teclado e esconde o botão para a tela ficar com cara de "Jogo Concluído"
    document.getElementById("teclado-termo").innerHTML = "";
    document.getElementById("btn-verificar").classList.add("escondido");
    
    // 5. Atualiza o painel de instruções com a glória da vitória
    const inst = document.getElementById('instrucoes-termo');
    if (inst) {
        inst.innerHTML = `<h4 style="text-align:center; color: #2ecc71;">Vitória Alcançada! ✨</h4>
                          <p style="text-align:center;">O Oráculo revelou a verdade. O Cofre do Santuário foi destrancado para vocês hoje!</p>`;
        inst.classList.remove('escondido');
    }
}

// ==========================================
// FUNÇÃO DE RECOMEÇO (CORRIGIDA - MATRIZ 2D)
// ==========================================
function resetarTermo() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // Se a pessoa já ganhou hoje, avisamos amigavelmente
    if (localStorage.getItem('santuario_vitoria_dia') === hoje) {
        if(typeof mostrarToast === 'function') mostrarToast("Você já venceu hoje! Volte amanhã para um novo enigma.", "✨");
        return;
    }

    // 1. Limpa a memória das tentativas fracassadas
    sessionStorage.removeItem('termo_estado');
    
    // 2. Zera as variáveis globais (O SEGREDO DA MATRIZ 2D ESTÁ AQUI)
    tentativaAtual = 0;
    letraAtual = 0;
    grade = [
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""],
        ["", "", "", "", ""]
    ];
    
    // 3. Reativa os botões
    const resetContainer = document.getElementById('termo-reset-container');
    if (resetContainer) resetContainer.classList.add('escondido');
    
    const btnVerificar = document.getElementById("btn-verificar");
    if(btnVerificar) {
        btnVerificar.disabled = false;
        btnVerificar.classList.remove("escondido");
    }

    // 4. Reconstrói o tabuleiro visual
    inicializarTermo();
    
    // 5. Dá o feedback sensorial
    if(typeof mostrarToast === 'function') mostrarToast("O Oráculo lhe concedeu uma nova chance!", "🔮");
    if (window.Haptics) window.Haptics.toqueLeve();
}

// ==========================================
// A DICA DE AMOR SUPREMA (COM ATUALIZAÇÃO DE SALDO)
// ==========================================
window.usarDicaAmor = function() {
    const moedasAtuais = window.pontosDoCasal || 0;

    if (moedasAtuais < 10) {
        if(typeof mostrarToast === 'function') mostrarToast("Vocês precisam de 10💰 cultivadas na Fazenda ou Tribunal para a dica!", "🔒");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
    
    if (letraAtual < 5) {
        // Desconta os pontos globalmente
        if (typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(-10, "Dica de Amor Oráculo");
        }

        // Atualiza o visor de saldo na hora!
        const visorMoedas = document.getElementById('termo-moedas');
        if (visorMoedas) visorMoedas.innerText = window.pontosDoCasal;

        const letraCorreta = palavraFinal[letraAtual];
        adicionarLetra(letraCorreta);

        const elogios = [
            "Seu sorriso ilumina mais que essas letras.",
            "Mesmo de longe, sinto sua intuição aguçada.",
            "Um empurrãozinho para a mulher mais inteligente que conheço.",
            "Sua dedicação me inspira. Aqui está uma luz!"
        ];
        const elogioSorteado = elogios[Math.floor(Math.random() * elogios.length)];
        
        if(typeof mostrarToast === 'function') mostrarToast(elogioSorteado, "💖");
        if(window.Haptics) window.Haptics.sucesso();
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("A linha já está cheia, apague uma letra antes de pedir a dica!", "⚠️");
    }
};

// ==========================================
// RESTAURAÇÃO DE MEMÓRIA (Com suporte ao Glassmorphism)
// ==========================================
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
                        quadrado.classList.add("preenchido"); // Mantém o brilho interno
                        
                        if (i < tentativaAtual) { 
                            // Linhas já chutadas (Aplica as cores finais)
                            const letra = grade[i][j];
                            const palavraFinal = window.PALAVRA_DO_DIA || "AMADA";
                            
                            if (letra === palavraFinal[j]) quadrado.classList.add("correta");
                            else if (palavraFinal.includes(letra)) quadrado.classList.add("presente");
                            else quadrado.classList.add("ausente");
                            
                            quadrado.style.color = "#000"; // Força a cor do texto para dar contraste
                            
                            // Pinta o teclado também para a Thamiris não se perder!
                            const tecla = document.getElementById(`tecla-${letra}`);
                            if (tecla) {
                                if (letra === palavraFinal[j]) tecla.className = "tecla correta";
                                else if (palavraFinal.includes(letra) && !tecla.classList.contains("correta")) tecla.className = "tecla presente";
                                else if (!tecla.classList.contains("correta") && !tecla.classList.contains("presente")) tecla.className = "tecla ausente";
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('Memória do Oráculo corrompida. Recriando destino...');
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
    
    // 1. ATUALIZAÇÃO VISUAL DOS BOTÕES (REMOVE O AZUL, ATIVA O OURO)
    // Remove a classe 'ativo' de ambos primeiro
    document.getElementById('btn-view-thamiris').classList.remove('ativo');
    document.getElementById('btn-view-joao').classList.remove('ativo');
    
    // Adiciona a classe 'ativo' apenas no que foi clicado
    const btnAtivo = document.getElementById(`btn-view-${pessoa}`);
    if (btnAtivo) btnAtivo.classList.add('ativo');

    if (!dados) return;

    // 2. LÓGICA DE EXIBIÇÃO (MANTÉM O QUE JÁ FUNCIONAVA)
    const agora = Math.floor(Date.now() / 1000);
    const eNoite = agora < dados.sys.sunrise || agora > dados.sys.sunset;
    const condicao = dados.weather[0].main;
    const temp = Math.round(dados.main.temp);

    const elMensagem = document.getElementById("texto-mensagem-clima");
    if (elMensagem) {
        if (pessoa === 'thamiris') {
            elMensagem.innerText = gerarMensagemClima(condicao, temp);
        } else {
            elMensagem.innerText = `Faz ${temp}°C em Colombo. O clima aqui espera por você.`;
        }
    }

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

window.abrirReliquia = function(event, tipo) {
    if (localStorage.getItem('santuario_vitoria_dia') !== new Date().toLocaleDateString('pt-BR')) {
        mostrarToast("🔒 Relíquia Selada. Vença o desafio do dia para colher este prêmio!");
        return;
    }
    
    const iconeClicado = event.currentTarget.querySelector('.icone-reliquia');
    if (iconeClicado) {
        iconeClicado.classList.add('abrindo-bau');
        setTimeout(() => iconeClicado.classList.remove('abrindo-bau'), 300);
    }
    const modal = document.getElementById('modal-reliquia');
    const corpo = document.getElementById('corpo-modal');
    if (!modal || !corpo) return;

    // Guarda os elementos 3D vivos na gaveta ANTES de limpar o modal!
    fecharModal(true); 

    const agora = new Date();
    const diaDoAno = Math.floor((agora - new Date(agora.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));

    if (tipo === 'musica') {
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 5px; font-family: 'Playfair Display', serif;">Nossa Trilha</h3>
            <p style="font-size: 11px; opacity: 0.6; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Sincronia de Almas</p>
            <iframe style="border-radius:12px" src="https://open.spotify.com/embed/playlist/00h463A5jtiPGnlLzCu2Em?utm_source=generator" width="100%" height="352" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>`;
    } else if (tipo === 'ceu') {
        const textoCeu = BIBLIOTECA_RELIQUIAS.ceu[diaDoAno % BIBLIOTECA_RELIQUIAS.ceu.length];
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 15px; font-family: 'Playfair Display', serif;">Mesmo Céu</h3>
            <div class="modal-ceu" id="modal-ceu-container" style="padding: 10px;">
                <div id="galaxia-3d" style="width: 100%; height: 220px; border-radius: 12px; overflow: hidden; background: #020111;"></div>
                <p style="margin-top: 15px; font-style: italic; color: #e0e0e0; font-size: 0.95rem;">"${textoCeu}"</p>
            </div>`;
        setTimeout(() => { if (typeof window.inicializarGalaxia3D === 'function') window.inicializarGalaxia3D(); }, 100);
    } else if (tipo === 'cartas') {
        const textoSemente = BIBLIOTECA_RELIQUIAS.sementes[diaDoAno % BIBLIOTECA_RELIQUIAS.sementes.length];
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 15px; font-family: 'Playfair Display', serif;">Semente Exclusiva</h3>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(212,175,55,0.2); border-radius: 12px; padding: 25px; position: relative;">
                <span style="position: absolute; top: -5px; left: 50%; transform: translateX(-50%); font-size: 24px;">✉️</span>
                <p style="font-style:italic; font-size: 1.1rem; line-height: 1.6; margin-top: 10px;">"${textoSemente}"</p>
            </div>`;
    } else if (tipo === 'encontro') {
        const v = BIBLIOTECA_RELIQUIAS.futuro[diaDoAno % BIBLIOTECA_RELIQUIAS.futuro.length];
        corpo.innerHTML = `<div class="bilhete-dourado"><div class="bilhete-dourado-inner"><div class="bilhete-header">Voucher Vitalício</div><div class="bilhete-corpo">Vale para:<div class="bilhete-destaque">${v.t}</div>${v.d}</div></div></div>`;
    } 
    // SE FOR UM ITEM DA GAVETA (Ecos, Bussola, Carrossel)
    else if (['ecos', 'bussola', 'carrossel'].includes(tipo)) {
        const template = document.getElementById(`cartao-${tipo}`);
        if(template) corpo.appendChild(template);
        // Desperta os motores 3D (se existirem)
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100); 
    }

    modal.classList.remove('escondido');
};

window.fecharModal = function(apenasLimpar = false) {
    const modal = document.getElementById('modal-reliquia');
    const corpo = document.getElementById('corpo-modal');
    const gaveta = document.getElementById('reliquias-templates');
    
    // Resgata os cartões complexos antes de limpar o HTML
    if (gaveta && corpo) {
        ['ecos', 'bussola', 'carrossel'].forEach(id => {
            const el = document.getElementById(`cartao-${id}`);
            if (el && corpo.contains(el)) gaveta.appendChild(el);
        });
    }
    
    if (corpo) corpo.innerHTML = '';
    if (!apenasLimpar && modal) modal.classList.add('escondido');
};

// ==========================================
// GERENCIADOR DE TELAS (MEMÓRIA INTELIGENTE E BLINDADA)
// ==========================================
window.abrirJogo = function(tipo) {
    // 1. Esconde a interface principal de jogos, a navegação inferior e o áudio
    const menuLista = document.getElementById('menu-jogos-lista');
    const menuGrid = document.querySelector('.jogos-grid');
    const menuJogos = document.getElementById('menu-jogos');
    const headerJogos = document.getElementById('header-jogos-main');
    const navInferior = document.querySelector('.menu-inferior');
    
    if (menuLista) menuLista.classList.add('escondido');
    if (menuGrid) menuGrid.classList.add('escondido');
    if (menuJogos) menuJogos.classList.add('escondido');
    if (headerJogos) headerJogos.classList.add('escondido');
    if (navInferior) navInferior.classList.add('escondido');
    
    document.body.classList.add('modo-jogo-ativo');

    // 2. Esconde TODOS os containers de jogos por segurança
    const jogosContainers = ['termo', 'tribunal', 'sincronia', 'julgamento', 'minifazenda', 'jardim'];
    jogosContainers.forEach(jogoId => {
        const el = document.getElementById(`container-${jogoId}`);
        if (el) el.classList.add('escondido');
    });

    // 3. Mostra o container do jogo selecionado e DÁ O GATILHO DE INÍCIO
    const containerAtivo = document.getElementById(`container-${tipo}`);
    if (containerAtivo) {
        containerAtivo.classList.remove('escondido');
        
        // --- INICIALIZAÇÃO INTELIGENTE ---
        if (tipo === 'termo') {
            const hoje = new Date().toLocaleDateString('pt-BR');
            const moedasUI = document.getElementById('termo-moedas');
            if (moedasUI) moedasUI.innerText = window.pontosDoCasal || 0;

            // A MÁGICA: SEMPRE cria a grade se ela não existir, INDEPENDENTE de ter ganho ou não!
            const gradeTermo = document.getElementById("grade-termo");
            if (gradeTermo && gradeTermo.children.length === 0) {
                if (typeof inicializarTermo === 'function') inicializarTermo();
                else if (typeof window.inicializarTermo === 'function') window.inicializarTermo();
            }

            // DEPOIS da grade existir, verifica se já venceu hoje para ativar o visual de vitória
            if (localStorage.getItem('santuario_vitoria_dia') === hoje) {
                if (typeof window.reconstruirVitoriaTermo === 'function') window.reconstruirVitoriaTermo();
            }
        }
        else if (tipo === 'tribunal') {
            const tribMao = document.getElementById("tribunal-mao");
            if (tribMao && tribMao.children.length === 0) {
                if (typeof iniciarTribunal === 'function') iniciarTribunal();
            }
        }
        else if (tipo === 'sincronia') {
            const sincTema = document.getElementById("tema-sincronia");
            if (sincTema && sincTema.innerText.includes("Sintonizando")) {
                if (typeof iniciarSincronia === 'function') iniciarSincronia();
            }
        }
        else if (tipo === 'julgamento') {
            const julga = document.getElementById("julgamento-grade");
            if (julga && julga.children.length === 0) {
                if (typeof iniciarJulgamento === 'function') iniciarJulgamento();
            }
        }
        else if (tipo === 'minifazenda') {
            if(typeof iniciarMiniFazenda === 'function') iniciarMiniFazenda();
        }
        else if (tipo === 'jardim') {
            if (typeof window.renderizarPlanta === 'function') window.renderizarPlanta();
            const capitalUI = document.getElementById('jardim-moedas');
            if (capitalUI) capitalUI.innerText = window.pontosDoCasal || 0;
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
        }
    }
};

window.voltarMenuJogos = function() {
    // 1. Esconde todos os jogos abertos
    const jogosContainers = ['termo', 'tribunal', 'sincronia', 'julgamento', 'minifazenda', 'jardim'];
    jogosContainers.forEach(jogoId => {
        const el = document.getElementById(`container-${jogoId}`);
        if (el) el.classList.add('escondido');
    });

    // 2. Restaura o menu principal, a navegação e os botões
    const menuLista = document.getElementById('menu-jogos-lista');
    const menuGrid = document.querySelector('.jogos-grid');
    const menuJogos = document.getElementById('menu-jogos');
    const headerJogos = document.getElementById('header-jogos-main');
    const navInferior = document.querySelector('.menu-inferior');

    if (menuLista) menuLista.classList.remove('escondido');
    if (menuGrid) menuGrid.classList.remove('escondido');
    if (menuJogos) menuJogos.classList.remove('escondido');
    if (headerJogos) headerJogos.classList.remove('escondido');
    if (navInferior) navInferior.classList.remove('escondido');

    // Retira o ajuste de tela cheia do corpo do app
    document.body.classList.remove('modo-jogo-ativo');
};

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
    if(typeof window.verificarRitualDoDia === 'function') window.verificarRitualDoDia();
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


function playAudioJogos() {
    if (!audioJogos) {
        audioJogos = document.getElementById('audio-jogos');
        if (!audioJogos) return;
        audioJogos.volume = 0.2;
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
            timestamp: Date.now() // O Firebase gera um ID único do exato momento
        });

        document.getElementById('input-mood').value = '';
        mostrarToast(`Seu coração falou. O sinal foi enviado para o espaço...`);
    };

    window.atualizarTelaPeloMood = function(estado, timestamp, mensagem) {
        const statusEl = document.getElementById('status-parceiro');
        if (!statusEl) return;

        const minutosAtras = Math.floor((Date.now() - timestamp) / 60000);
        let tempoTexto = minutosAtras < 1 ? "agora mesmo" : `há ${minutosAtras} minutos`;
        if (minutosAtras >= 60) {
            const horas = Math.floor(minutosAtras / 60);
            tempoTexto = `há ${horas} hora(s)`;
        }

        // 1. LIMPEZA SEGURA
        document.body.classList.remove('modo-cansada', 'modo-alerta', 'aura-triste', 'aura-apaixonada', 'aura-ansiosa');
        const fundoClima = document.getElementById('fundo-climatico');
        if (fundoClima) fundoClima.className = 'fundo-climatico';

        let mensagemTexto = "";
        const estadoLower = estado.toLowerCase();

        // 2. LIGAÇÃO DAS AURAS, CLIMA E LOTTIE
        if (estadoLower === 'radiante') {
            mensagemTexto = `✨ ${window.NOME_PARCEIRO} está radiante ${tempoTexto}.`;
            if (fundoClima) fundoClima.classList.add('fundo-estrelado');
            window.LottieManager.play('radiante');
        } else if (estadoLower === 'ansiosa' || estadoLower === 'ansioso') {
            mensagemTexto = `🌪️ A mente da ${window.NOME_PARCEIRO} acelerou ${tempoTexto}.`;
            document.body.classList.add('aura-ansiosa'); 
            window.LottieManager.play('ansiosa');
        } else if (estadoLower === 'triste') {
            mensagemTexto = `🌧️ O dia da ${window.NOME_PARCEIRO} escureceu ${tempoTexto}.`;
            document.body.classList.add('aura-triste'); 
            if (fundoClima) fundoClima.classList.add('fundo-chuva');
            window.LottieManager.play('triste');
        } else if (estadoLower === 'cansada' || estadoLower === 'cansado') {
            mensagemTexto = `🔋 ${window.NOME_PARCEIRO} está esgotada ${tempoTexto}.`;
            document.body.classList.add('modo-cansada');
            window.LottieManager.play('cansada');
        } else if (estadoLower === 'saudade' || estadoLower === 'com saudade') {
            mensagemTexto = `🥺 ${window.NOME_PARCEIRO} está com saudade ${tempoTexto}.`;
            window.LottieManager.play('saudade');
        } else if (estadoLower === 'apaixonada' || estadoLower === 'apaixonado') {
            mensagemTexto = `💖 ${window.NOME_PARCEIRO} está apaixonada ${tempoTexto}!`;
            document.body.classList.add('aura-apaixonada'); 
            if (fundoClima) fundoClima.classList.add('fundo-estrelado');
            window.LottieManager.play('apaixonada');
        }

        if (mensagem) {
            mensagemTexto += ` Ela escreveu: "${mensagem}"`;
        }

        statusEl.innerHTML = mensagemTexto;

        // ==========================================
        // TRAVA DE SEGURANÇA (O ALERTA SÓ APARECE UMA VEZ)
        // ==========================================
        const estadosCriticos = ['ansiosa', 'ansioso', 'triste', 'cansada', 'cansado', 'saudade', 'com saudade'];

        // Se você for o João e o estado for crítico...
        if (window.souJoao && estadosCriticos.includes(estadoLower)) {
            // O celular checa: "Eu já fechei o alerta com esse ID de horário?"
            const alertaResolvido = localStorage.getItem('alerta_resolvido_timestamp');
            
            if (alertaResolvido !== timestamp.toString()) {
                window.exibirAlertaEmergencia(estado, mensagem, timestamp);
            }
        }
    };

    window.exibirAlertaEmergencia = function(estado, mensagem, timestamp) {
        const modal = document.getElementById('modal-emergencia');
        const titulo = document.getElementById('emergencia-titulo');
        const texto = document.getElementById('emergencia-mensagem');

        if (modal && titulo && texto) {
            modal.dataset.timestampAtual = timestamp.toString();

            titulo.innerText = `A ${window.NOME_PARCEIRO} está ${estado.toUpperCase()}`;
            texto.innerText = mensagem || "Ela precisa de você agora. Dê uma atenção especial.";
            
            modal.classList.remove('escondido');

            // Coloque isto perto do final da função, antes ou depois do vibrador:
            if (window.MotorDeAudio) window.MotorDeAudio.abafar();

            // --- AQUI ACONTECE A MÁGICA CINEMATOGRÁFICA ---
            window.animarTextoCinematografico(texto);
            // ----------------------------------------------

            if ("vibrate" in navigator) navigator.vibrate([200, 100, 200]);
            
            const audio = new Audio('assets/alerta.mp3'); 
            audio.play().catch(() => console.log("Áudio bloqueado"));
        }
    };

    window.fecharEmergencia = function() {
        const modal = document.getElementById('modal-emergencia');
        if (modal) {
            modal.classList.add('escondido');

            // Traz o som de volta!
            if (window.MotorDeAudio) window.MotorDeAudio.focar();
            
            // O PULO DO GATO: Salva no celular que esse alerta específico já foi atendido!
            const timestamp = modal.dataset.timestampAtual;
            if (timestamp) {
                localStorage.setItem('alerta_resolvido_timestamp', timestamp);
            }
        }
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
    mensagem: window.SantuarioCrypto.codificar(texto), // <--- Corrigido para 'texto'
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
// MOTOR DE OFENSIVA (STREAK & DIAMANTE)
// ==========================================
window.verificarRitualDoDia = function() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // As 3 Tarefas do Ritual
    const termoOk = localStorage.getItem('santuario_vitoria_dia') === hoje;
    const plantaOk = window.statusPlanta && window.statusPlanta.diaUltimaRegada === hoje;
    const pulsoOk = localStorage.getItem('pulso_enviado_dia') === hoje;

    let streak = parseInt(localStorage.getItem('ritual_streak') || '0');
    let ultimoDia = localStorage.getItem('ritual_ultimo_dia');

    // 1. Checa se vocês esqueceram de jogar ontem (Zera a ofensiva)
    if (ultimoDia && ultimoDia !== hoje) {
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        if (ultimoDia !== ontem.toLocaleDateString('pt-BR')) {
            streak = 0; // Perdeu a ofensiva!
            localStorage.setItem('ritual_streak', streak);
        }
    }

    // 2. Checa se acabou de completar o ritual de hoje!
    if (termoOk && plantaOk && pulsoOk && ultimoDia !== hoje) {
        streak++;
        localStorage.setItem('ritual_ultimo_dia', hoje);
        localStorage.setItem('ritual_streak', streak);
        
        if (streak === 7 && typeof window.mostrarToast === 'function') {
            window.mostrarToast("💎 OFENSIVA 7 DIAS! Tema Diamante Desbloqueado na Paleta!");
            if(typeof confetti === 'function') confetti({colors: ['#00e5ff', '#ffffff'], particleCount: 150});
        } else if (typeof window.mostrarToast === 'function') {
            window.mostrarToast(`🔥 Ritual do Dia Completo! Ofensiva: ${streak} dia(s).`);
        }
    }

    // 3. Atualiza a Tela de Temas (Libera ou Bloqueia o Diamante)
    const btnDiamante = document.getElementById('btn-tema-diamante');
    if (btnDiamante) {
        if (streak >= 7) {
            btnDiamante.classList.remove('escondido');
            btnDiamante.innerText = `💎 Diamante (🔥 ${streak} dias)`;
        } else {
            btnDiamante.classList.add('escondido');
            // Se estava usando o diamante e quebrou o combo, o app tira o tema dela!
            if (localStorage.getItem('santuario_tema') === 'diamante') {
                if(typeof aplicarTema === 'function') aplicarTema('dourado');
            }
        }
    }
};

// ==========================================
// O LIVRO DE OURO (CÁPSULA DO TEMPO / WRAPPED)
// ==========================================
let toquesNoTimer = 0;
let storyAtual = 1;

window.addEventListener('load', () => {
    // 1. O Código Hacker (Tocar 7 vezes no timer para forçar a abertura)
    const timerElemento = document.getElementById("timer-principal");
    if (timerElemento) {
        timerElemento.addEventListener('pointerdown', () => {
            toquesNoTimer++;
            if (toquesNoTimer === 7) {
                document.getElementById('btn-capsula').classList.remove('escondido');
                if(typeof window.mostrarToast === 'function') window.mostrarToast("✨ Cheat Code: Livro de Ouro Destrancado!");
                if(window.Haptics) window.Haptics.sucesso();
            }
        });
    }

    // 2. O Gatilho Real (29 de Outubro)
    const hoje = new Date();
    if (hoje.getMonth() === 9 && hoje.getDate() === 29) { // No JavaScript, Janeiro é 0, então Outubro é 9
        const btn = document.getElementById('btn-capsula');
        if (btn) btn.classList.remove('escondido');
    }
});

window.abrirCapsulaDoTempo = () => {
    const modal = document.getElementById('modal-capsula');
    if (!modal) return;

    // Calcula os dias exatos de namoro lendo a sua variável global
    const diferenca = new Date().getTime() - dataInicio;
    const diasJuntos = Math.floor(diferenca / (1000 * 60 * 60 * 24));
    
    // Injeta as estatísticas reais do Firebase/Cache
    document.getElementById('dado-dias').innerText = diasJuntos;
    document.getElementById('dado-ciclos').innerText = window.statusPlanta ? window.statusPlanta.ciclos || 0 : 0;
    document.getElementById('dado-streak').innerText = localStorage.getItem('ritual_streak') || 0;

    storyAtual = 1;
    atualizarTelasStory();
    modal.classList.remove('escondido');
    
    if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ff6b6b'], particleCount: 100});
};

window.mudarStory = (direcao) => {
    storyAtual += direcao;
    atualizarTelasStory();
    if(window.Haptics) window.Haptics.toqueLeve();
};

function atualizarTelasStory() {
    for (let i = 1; i <= 4; i++) {
        const tela = document.getElementById(`story-${i}`);
        if (tela) {
            if (i === storyAtual) {
                tela.classList.remove('escondido');
            } else {
                tela.classList.add('escondido');
            }
        }
    }
    
    document.getElementById('btn-story-prev').style.display = storyAtual === 1 ? 'none' : 'block';
    document.getElementById('btn-story-next').style.display = storyAtual === 4 ? 'none' : 'block';
    document.getElementById('btn-story-fechar').style.display = storyAtual === 4 ? 'block' : 'none';
}

window.fecharCapsula = () => {
    document.getElementById('modal-capsula').classList.add('escondido');
    if(window.Haptics) window.Haptics.toqueLeve();
};

// ==========================================
// RELÍQUIA 1: NOSSOS ECOS (Motor Cross-Platform iOS/Android)
// ==========================================
let gravadorDeVoz;
let pedacosDeAudio = [];

window.toggleGravacaoEco = async function() {
    if (!gravadorDeVoz || gravadorDeVoz.state === "inactive") {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // DETECÇÃO DE SISTEMA: Deixa o iPhone gravar em mp4 e o Android em webm
            let options = {};
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' }; // Salvação para o iPhone 14 Pro Max
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' }; // Salvação para o Samsung A55
            }

            gravadorDeVoz = new MediaRecorder(stream, options);
            pedacosDeAudio = [];

            gravadorDeVoz.ondataavailable = e => {
                if (e.data.size > 0) pedacosDeAudio.push(e.data);
            };

            gravadorDeVoz.onstop = () => {
                // Cria o arquivo de áudio respeitando o formato nativo do celular
                const blob = new Blob(pedacosDeAudio, { type: gravadorDeVoz.mimeType });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => salvarEcoNoFirebase(reader.result);
                
                // Desliga fisicamente o microfone (Some o ícone de gravação do topo do celular)
                stream.getTracks().forEach(track => track.stop());
            };

            gravadorDeVoz.start();
            document.getElementById('status-eco').innerText = "Gravando mensagem... 🎙️";
            document.getElementById('btn-gravar-eco').style.boxShadow = "0 0 15px #e74c3c";
            document.getElementById('btn-gravar-eco').style.borderColor = "#e74c3c";
            if(window.Haptics) window.Haptics.toqueForte();

        } catch (err) {
            console.error("Erro no microfone:", err);
            if(typeof mostrarToast === 'function') mostrarToast("Permita o uso do microfone nas configurações do navegador!", "🎙️");
        }
    } else if (gravadorDeVoz.state === "recording") {
        gravadorDeVoz.stop();
        document.getElementById('status-eco').innerText = "Processando frequências...";
        document.getElementById('btn-gravar-eco').style.boxShadow = "";
        document.getElementById('btn-gravar-eco').style.borderColor = "var(--cor-primaria)";
        if(window.Haptics) window.Haptics.sucesso();
    }
};

function salvarEcoNoFirebase(base64) {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    // ALINHAMENTO COM AS REGRAS: Aponta exatamente para "ecos_recentes"
    const refEco = ref(db, 'ecos_recentes/' + window.MEU_NOME.toLowerCase());
    
    set(refEco, {
        audio: base64,
        timestamp: Date.now()
    }).then(() => {
        document.getElementById('status-eco').innerText = "Voz enviada pelas estrelas! ✨";
        if(window.Haptics) window.Haptics.sucesso();
        setTimeout(() => {
            const el = document.getElementById('status-eco');
            if(el) el.innerText = "O cofre aguarda sua voz.";
        }, 3000);
    });
}

// Escuta em tempo real se a parceira mandou um áudio
window.escutarEcosDoParceiro = function() {
    if (!window.SantuarioApp || !window.NOME_PARCEIRO) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refEcoParceiro = ref(db, 'ecos_recentes/' + window.NOME_PARCEIRO.toLowerCase());
    onValue(refEcoParceiro, (snapshot) => {
        const dados = snapshot.val();
        if (dados && dados.audio) {
            window.ecoRecebidoAudio = new Audio(dados.audio);
            const statusEco = document.getElementById('status-eco');
            if (statusEco) statusEco.innerText = `Um novo eco de ${window.NOME_PARCEIRO} está aguardando! 🎵`;
        }
    });
};

window.tocarEco = function() {
    if (window.ecoRecebidoAudio) {
        window.ecoRecebidoAudio.play();
        document.getElementById('status-eco').innerText = `Ouvindo a voz de ${window.NOME_PARCEIRO}... 🎵`;
        
        window.ecoRecebidoAudio.onended = () => {
            document.getElementById('status-eco').innerText = "O cofre aguarda sua voz.";
        };
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Nenhum eco novo no horizonte.", "🌌");
    }
};