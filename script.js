// ==========================================
// VARIÁVEIS GLOBAIS DE ESTADO
// ==========================================
window.statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", ultimaVerificacao: Date.now(), sequencia: 0, ciclos: 0 };
let audioJogos = null;

// ==========================================
// GERENTE MÁXIMO DE ÁUDIO (SISTEMA ANTI-DUPLICAÇÃO)
// ==========================================
window.musicaNossaTocando = false; // Trava de segurança

window.tocarAmbiente = () => {
    if (window.musicaNossaTocando) return; // Se a "Nossa Música" tá rolando, a ambiente fica calada.
    
    if (!audioJogos) {
        // Só cria a música se ela NÃO existir na RAM
        audioJogos = new Audio('ambient.mp3'); 
        audioJogos.loop = true;
        audioJogos.volume = 0.0;
    }
    
    if (audioJogos.paused) {
        audioJogos.play().catch(e => console.log("Navegador bloqueou áudio:", e));
    }
};

window.pausarAmbiente = () => {
    if (typeof audioJogos !== 'undefined' && audioJogos && !audioJogos.paused) {
        audioJogos.pause();
    }
};

let telaAtual = 'home';
const dataInicio = new Date("2025-10-29T16:30:00").getTime();

// 🚨 A DATA E HORA EXATA DO REENCONTRO (O MOMENTO EM QUE A DISTÂNCIA ZERA)
// Altere esta data para o dia e horário que o cronômetro deve congelar para sempre
const dataCongelamento = new Date("2026-03-23T09:31:07").getTime(); 

// 1. MOTOR DO TEMPO
function atualizarMotorDoTempo() {
    let agora = new Date().getTime();
    
    // 🚨 A TRAVA: Se o momento atual já passou da data de congelamento, 
    // o "agora" passa a ser fixo na data do encontro. O tempo para de passar.
    if (agora >= dataCongelamento) {
        agora = dataCongelamento; 
    }

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

// Função mágica que digita o texto (OTIMIZADA PARA ZERO GARGALOS)
function digitarTexto(elemento, texto, velocidade = 40) {
    elemento.textContent = ''; // Limpeza limpa sem invocar o parser de HTML
    elemento.classList.add('cursor-piscante', 'texto-embacado'); 
    
    let i = 0;
    let textoAcumulado = ""; // Memória temporária (RAM)
    
    function digitar() {
        if (i < texto.length) {
            textoAcumulado += texto.charAt(i);
            elemento.textContent = textoAcumulado; // textContent ignora re-renderização pesada
            i++;
            setTimeout(digitar, velocidade);
        } else {
            setTimeout(() => elemento.classList.remove('cursor-piscante'), 2000);
            
            // --- INÍCIO DA LÓGICA DO VIDRO EMBAÇADO ---
            let tempoToque;
            const desembaçarVidro = (e) => {
                if(e.type === 'touchstart') e.preventDefault();
                tempoToque = setTimeout(() => {
                    elemento.classList.add('revelado');
                    if (navigator.vibrate) navigator.vibrate([30]); 
                }, 1000);
            };
            
            const cancelarDesembaçar = () => clearTimeout(tempoToque);

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

// Função auxiliar para ignorar acentos e cedilhas
const normalizarPalavra = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

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

// O Grande Veredito com Revelação Ortográfica Automática
// O Grande Veredito com Revelação Ortográfica Automática (CORRIGIDO)
window.verificarPalavra = function() {
    if (letraAtual !== 5) {
        if(typeof mostrarToast === 'function') mostrarToast("A palavra precisa ter 5 letras!", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const palavraOriginal = window.PALAVRA_DO_DIA || "AMADA";
    const palavraNormalizada = normalizarPalavra(palavraOriginal);
    const palpite = grade[tentativaAtual].join(""); 
    
    let letrasRestantes = palavraNormalizada.split(""); 
    let statusClasses = ["ausente", "ausente", "ausente", "ausente", "ausente"];

    // 1ª Passagem: Verifica as CORRETAS
    for (let i = 0; i < 5; i++) {
        if (palpite[i] === palavraNormalizada[i]) {
            statusClasses[i] = "correta";
            letrasRestantes[i] = null; 
        }
    }

    // 2ª Passagem: Verifica as PRESENTES
    for (let i = 0; i < 5; i++) {
        if (statusClasses[i] !== "correta") {
            const indexNaPalavra = letrasRestantes.indexOf(palpite[i]);
            if (indexNaPalavra !== -1) {
                statusClasses[i] = "presente";
                letrasRestantes[indexNaPalavra] = null; 
            }
        }
    }

    let acertos = 0;
    const btnVerificar = document.getElementById("btn-verificar");
    if(btnVerificar) btnVerificar.disabled = true;

    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const quadrado = document.getElementById(`q-${tentativaAtual}-${i}`);
            if (quadrado) {
                quadrado.classList.add("anim-flip");
                
                setTimeout(() => {
                    quadrado.classList.add(statusClasses[i]);
                    
                    // 🚨 A MÁGICA CORRIGIDA: Usa a letra que o usuário digitou!
                    let letraExibida = palpite[i];
                    
                    // Se for a letra correta, puxa o acento original daquela exata posição
                    if (statusClasses[i] === "correta") {
                        letraExibida = palavraOriginal[i];
                    } 
                    // Se estiver na palavra, mas no lugar errado, procura a versão acentuada
                    else if (statusClasses[i] === "presente") {
                        const idxOriginal = palavraNormalizada.indexOf(palpite[i]);
                        if (idxOriginal !== -1) {
                            letraExibida = palavraOriginal[idxOriginal];
                        }
                    }
                    
                    quadrado.innerText = letraExibida; 
                    quadrado.style.color = "#000"; 
                    if(window.Haptics) navigator.vibrate(30);
                }, 300);
            }

            setTimeout(() => {
                const tecla = document.getElementById(`tecla-${palpite[i]}`);
                if (tecla) {
                    if (statusClasses[i] === "correta") tecla.className = `tecla correta`;
                    else if (statusClasses[i] === "presente" && !tecla.classList.contains("correta")) tecla.className = `tecla presente`;
                    else if (statusClasses[i] === "ausente" && !tecla.classList.contains("correta") && !tecla.classList.contains("presente")) tecla.className = `tecla ausente`;
                }
            }, 300);

            if (statusClasses[i] === "correta") acertos++;

            if (i === 4) {
                setTimeout(() => {
                    if(btnVerificar) btnVerificar.disabled = false;
                    
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
                            if(typeof mostrarToast === 'function') mostrarToast(`Sua jornada falhou. A palavra era: ${palavraOriginal}`, "💔");
                            if(window.Haptics) window.Haptics.erro();
                            const reset = document.getElementById('termo-reset-container');
                            if(reset) reset.classList.remove('escondido');
                        }
                    }
                }, 400);
            }
        }, i * 300);
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
        if(typeof mostrarToast === 'function') mostrarToast("Vocês precisam de 10💰!", "🔒");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const palavraOriginal = window.PALAVRA_DO_DIA || "AMADA";
    const palavraNormalizada = normalizarPalavra(palavraOriginal);
    
    if (letraAtual < 5) {
        if (typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(-10, "Dica de Amor Oráculo");
        }
        const visorMoedas = document.getElementById('termo-moedas');
        if (visorMoedas) visorMoedas.innerText = window.pontosDoCasal;

        // Entrega a letra sem acento para o teclado aceitar
        const letraDica = palavraNormalizada[letraAtual];
        adicionarLetra(letraDica);

        if(typeof mostrarToast === 'function') mostrarToast("Uma luz brilha no Oráculo...", "💖");
        if(window.Haptics) window.Haptics.sucesso();
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("A linha já está cheia!", "⚠️");
    }
};

// ==========================================
// RESTAURAÇÃO DE MEMÓRIA (Com suporte ao Glassmorphism)
// ==========================================
// RESTAURAÇÃO DE MEMÓRIA (CORRIGIDA)
function restaurarEstadoTermo() {
    const estadoSalvo = sessionStorage.getItem('termo_estado');
    if (estadoSalvo) {
        try {
            const estado = JSON.parse(estadoSalvo);
            tentativaAtual = estado.tentativaAtual;
            letraAtual = estado.letraAtual;
            grade = estado.grade;

            const palavraOriginal = window.PALAVRA_DO_DIA || "AMADA";
            const palavraNormalizada = normalizarPalavra(palavraOriginal);

            for (let i = 0; i < 6; i++) {
                for (let j = 0; j < 5; j++) {
                    const quadrado = document.getElementById(`q-${i}-${j}`);
                    if (quadrado && grade[i] && grade[i][j]) {
                        
                        quadrado.classList.add("preenchido");
                        
                        if (i < tentativaAtual) { 
                            const letraPalpite = grade[i][j];
                            
                            let status = "ausente";
                            if (letraPalpite === palavraNormalizada[j]) status = "correta";
                            else if (palavraNormalizada.includes(letraPalpite)) status = "presente";
                            
                            quadrado.classList.add(status);
                            
                            // 🚨 A MÁGICA CORRIGIDA: Devolve o acento só para as letras certas
                            let letraExibida = letraPalpite;
                            if (status === "correta") {
                                letraExibida = palavraOriginal[j];
                            } else if (status === "presente") {
                                const idxOriginal = palavraNormalizada.indexOf(letraPalpite);
                                if (idxOriginal !== -1) letraExibida = palavraOriginal[idxOriginal];
                            }
                            
                            quadrado.innerText = letraExibida; 
                            quadrado.style.color = "#000";
                            
                            const tecla = document.getElementById(`tecla-${letraPalpite}`);
                            if (tecla) {
                                if (status === "correta") tecla.className = "tecla correta";
                                else if (status === "presente" && !tecla.classList.contains("correta")) tecla.className = "tecla presente";
                                else if (status === "ausente" && !tecla.classList.contains("correta") && !tecla.classList.contains("presente")) tecla.className = "tecla ausente";
                            }
                        } else {
                            quadrado.innerText = grade[i][j];
                        }
                    }
                }
            }
        } catch (e) {
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

// 5. CLIMA (NOVA API OPEN-METEO - OPEN SOURCE)
window.dadosClima = { joao: null, thamiris: null };
window.climaExibido = 'thamiris'; 

// O Open-Meteo devolve códigos numéricos de clima (Padrão OMM). Vamos traduzi-los!
function mapearCodigoWMO(codigo) {
    if (codigo <= 1) return 'Clear';
    if (codigo === 2 || codigo === 3) return 'Clouds';
    if (codigo === 45 || codigo === 48) return 'Mist';
    if ((codigo >= 51 && codigo <= 67) || (codigo >= 80 && codigo <= 82)) return 'Rain';
    if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return 'Snow';
    if (codigo >= 95) return 'Thunderstorm';
    return 'Clear';
}

function obterEmojiClima(condicao, eNoite) {
    let emoji = '', classe = '';
    switch(condicao) {
        case 'Clear': emoji = eNoite ? '🌙' : '☀️'; classe = eNoite ? 'emoji-lua' : 'emoji-sol'; break;
        case 'Clouds': emoji = '☁️'; classe = 'emoji-nuvem'; break;
        case 'Rain': emoji = '🌧️'; classe = 'emoji-chuva'; break;
        case 'Thunderstorm': emoji = '⛈️'; classe = 'emoji-tempestade'; break;
        default: emoji = '🌡️'; classe = '';
    }
    return `<span class="${classe}">${emoji}</span>`;
}

async function atualizarClima() {
    try {
        // Coordenadas exatas injetadas direto na URL (sem chaves privadas)
        const urlJoao = "https://api.open-meteo.com/v1/forecast?latitude=-25.2917&longitude=-49.2242&current=temperature_2m,is_day,weather_code&timezone=America/Sao_Paulo";
        const urlThamiris = "https://api.open-meteo.com/v1/forecast?latitude=-16.6869&longitude=-49.2648&current=temperature_2m,is_day,weather_code&timezone=America/Sao_Paulo";

        // Chama as duas cidades ao mesmo tempo em paralelo para não travar o app
        const [resJ, resT] = await Promise.all([fetch(urlJoao), fetch(urlThamiris)]);

        if (resJ.ok) {
            const dataJ = await resJ.json();
            window.dadosClima.joao = {
                temp: Math.round(dataJ.current.temperature_2m),
                condicao: mapearCodigoWMO(dataJ.current.weather_code),
                eNoite: dataJ.current.is_day === 0 // 0 é noite, 1 é dia
            };
            document.getElementById("mini-temp-joao").innerText = `${window.dadosClima.joao.temp}°C`;
        }
        
        if (resT.ok) {
            const dataT = await resT.json();
            window.dadosClima.thamiris = {
                temp: Math.round(dataT.current.temperature_2m),
                condicao: mapearCodigoWMO(dataT.current.weather_code),
                eNoite: dataT.current.is_day === 0
            };
            document.getElementById("mini-temp-thamiris").innerText = `${window.dadosClima.thamiris.temp}°C`;
        }

        alternarVisaoClima(window.climaExibido);
    } catch (e) {
        console.error("Erro na API Open-Meteo", e);
        document.getElementById("texto-mensagem-clima").innerText = "❌ Clima indisponível no momento";
    }
}

window.alternarVisaoClima = function(pessoa) {
    window.climaExibido = pessoa;
    const dados = window.dadosClima[pessoa];
    
    document.getElementById('btn-view-thamiris').classList.remove('ativo');
    document.getElementById('btn-view-joao').classList.remove('ativo');
    
    const btnAtivo = document.getElementById(`btn-view-${pessoa}`);
    if (btnAtivo) btnAtivo.classList.add('ativo');

    if (!dados) return;

    const elMensagem = document.getElementById("texto-mensagem-clima");
    if (elMensagem) {
        if (pessoa === 'thamiris') {
            elMensagem.innerText = gerarMensagemClima(dados.condicao, dados.temp);
        } else {
            elMensagem.innerText = `Faz ${dados.temp}°C em Colombo. O clima aqui espera por você.`;
        }
    }

    if (typeof window.mudarClimaOrbe === 'function') {
        window.mudarClimaOrbe(dados.condicao, dados.eNoite);
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
        saudacao = 'Sonhando com você! 🌜';
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
        "O céu de Colombo hoje sobra um vento sul que carrega o meu 'eu te amo' até o calor de Goiânia.",
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
        "O vento que sobra no Sul hoje é o mensageiro que leva o oxigênio da minha vida para alimentar os seus sonhos aí.",
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
        "Você é o direito adquirido que eu defendo com unhas e das perante qualquer tribunal da vida.",
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
            <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 15px;">A mesma música, no mesmo segundo, não importa a distância.</p>
            
            <div class="toca-discos-container">
                <div class="base-toca-discos">
                    <div class="disco-vinil" id="disco-vinil">
                        <div class="selo-disco">Santuário</div>
                    </div>
                    <div class="braco-agulha" id="braco-agulha"></div>
                </div>
            </div>

            <audio id="audio-sincronizado" src="assets/nossa-musica.mp3" preload="auto"></audio>

            <div style="display: flex; justify-content: center; gap: 15px; margin-top: 15px;">
                <button class="btn-acao" id="btn-toca-discos-play" onclick="iniciarMusicaSincronizada()" style="background: var(--cor-primaria); color: #000; font-weight: bold; width: 140px;">
                    ▶ Ouvir Juntos
                </button>
                <button class="btn-acao escondido" id="btn-toca-discos-pause" onclick="pausarMusicaSincronizada()" style="background: transparent; border: 1px solid var(--cor-primaria); color: var(--cor-primaria); width: 140px;">
                    ⏸ Pausar
                </button>
            </div>
            <p id="status-toca-discos" style="color: #888; font-size: 0.75rem; margin-top: 15px; font-style: italic;">Aguardando conexão com as agulhas do destino...</p>

            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid rgba(212,175,55,0.2); text-align: center;">
                <p style="font-size: 0.85rem; color: #ddd; margin-bottom: 15px; font-style: italic;">A nossa coleção completa de memórias:</p>
                
                <a href="https://open.spotify.com/embed/playlist/00h463A5jtiPGnlLzCu2Em?utm_source=generator" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; background: #1DB954; color: white; text-decoration: none; padding: 10px 20px; border-radius: 25px; font-weight: bold; font-size: 0.9rem; box-shadow: 0 4px 15px rgba(29, 185, 84, 0.4); transition: transform 0.2s; border: 1px solid #1ed760;">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.84.241 1.2zM20.16 9.6C15.84 7.08 9.12 6.96 5.28 8.16c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.32-1.32 11.64-1.2 16.62 1.8.54.36.72 1.02.36 1.56-.42.54-1.08.72-1.44.18z"/></svg>
                    Ouvir "Minha Thamiris"
                </a>
            </div>
        `;
        
        setTimeout(() => { if (typeof window.escutarTocaDiscos === 'function') window.escutarTocaDiscos(); }, 200);
    } else if (tipo === 'ceu') {
        const textoCeu = BIBLIOTECA_RELIQUIAS.ceu[diaDoAno % BIBLIOTECA_RELIQUIAS.ceu.length];
        
        // 🚨 NOVO PADRÃO: Leitura absurdamente simplificada do Open-Meteo
        const climaJoao = window.dadosClima?.joao?.condicao || 'Clear';
        const tempJoao = window.dadosClima?.joao?.temp ?? '--';
        const noiteJoao = window.dadosClima?.joao?.eNoite ?? false;

        const climaThamiris = window.dadosClima?.thamiris?.condicao || 'Clear';
        const tempThamiris = window.dadosClima?.thamiris?.temp ?? '--';
        const noiteThamiris = window.dadosClima?.thamiris?.eNoite ?? false;

        const obterClasseJanela = (condicao, eNoite) => {
            if (condicao === 'Rain' || condicao === 'Drizzle') return 'efeito-chuva';
            if (condicao === 'Thunderstorm') return 'efeito-tempestade';
            if (condicao === 'Clouds') return eNoite ? 'efeito-nublado-noite' : 'efeito-nublado-dia';
            return eNoite ? 'efeito-limpo-noite' : 'efeito-limpo-dia';
        };

        // A MÁGICA DA JAULA: Uma div principal com "position: relative" prende o 3D lá dentro!
        corpo.innerHTML = `
            <div style="position: relative; width: 100%; height: 100%; min-height: 350px; border-radius: 12px; overflow: hidden;">
                
                <div id="galaxia-3d-fundo" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.7; cursor: grab;"></div>
                
                <div style="position: relative; z-index: 2; padding: 10px; display: flex; flex-direction: column; height: 100%; justify-content: center; pointer-events: none;">
                    
                    <h3 style="color: var(--cor-primaria); margin-bottom: 5px; font-family: 'Playfair Display', serif; text-shadow: 0 2px 5px rgba(0,0,0,0.9);">Mesmo Céu</h3>
                    <p style="font-size: 0.8rem; color: #ddd; margin-bottom: 15px; text-shadow: 0 1px 3px rgba(0,0,0,0.9);">Deslize o fundo para mover as estrelas.</p>

                    <div class="moldura-janela-mista" style="background: transparent; border: 2px solid rgba(212,175,55,0.5); box-shadow: 0 15px 35px rgba(0,0,0,0.9); height: 180px; flex-shrink: 0; pointer-events: auto;">
                        <div class="painel-janela ${obterClasseJanela(climaJoao, noiteJoao)}" style="opacity: 0.85;">
                            <div class="vidro-overlay">
                                <span class="cidade-tag">📍 Colombo</span>
                                <span class="temp-tag">${tempJoao}°</span>
                            </div>
                        </div>

                        <div class="divisoria-janela" style="background: linear-gradient(to right, rgba(0,0,0,0.9), rgba(60,60,60,0.9), rgba(0,0,0,0.9)); border-color: rgba(212,175,55,0.5);"></div>

                        <div class="painel-janela ${obterClasseJanela(climaThamiris, noiteThamiris)}" style="opacity: 0.85;">
                            <div class="vidro-overlay">
                                <span class="cidade-tag">📍 Goiânia</span>
                                <span class="temp-tag">${tempThamiris}°</span>
                            </div>
                        </div>
                    </div>

                    <p style="margin-top: 15px; font-style: italic; color: #fff; font-size: 0.9rem; text-align: center; border-top: 1px solid rgba(212,175,55,0.3); padding-top: 15px; text-shadow: 0 2px 5px rgba(0,0,0,0.9);">
                        "${textoCeu}"
                    </p>
                </div>
            </div>
        `;
        
        setTimeout(() => { if (typeof window.inicializarGalaxia3D === 'function') window.inicializarGalaxia3D(); }, 150);
    } else if (tipo === 'cartas') {
        const textoSemente = BIBLIOTECA_RELIQUIAS.sementes[diaDoAno % BIBLIOTECA_RELIQUIAS.sementes.length];
        corpo.innerHTML = `
            <h3 style="color: var(--cor-primaria); margin-bottom: 15px; font-family: 'Playfair Display', serif;">Semente Exclusiva</h3>
            
            <div class="envelope-misterioso" id="envelope-semente">
                <div class="selo-cera" id="selo-cera" onpointerdown="quebrarSeloDeCera(event)">
                    <span class="texto-selo">T</span>
                </div>
                <p class="dica-selo" id="dica-selo">Pressione o selo para abrir</p>
                
                <div class="carta-revelada">
                    <span style="font-size: 28px; margin-bottom: 12px; display: block; filter: drop-shadow(0 0 5px var(--cor-primaria));">📜</span>
                    <p style="font-style:italic; font-size: 1.05rem; line-height: 1.6; color: #f5f6fa; text-shadow: 0 2px 4px rgba(0,0,0,0.8);">"${textoSemente}"</p>
                </div>
            </div>`;
    } else if (tipo === 'encontro') {
        const v = BIBLIOTECA_RELIQUIAS.futuro[diaDoAno % BIBLIOTECA_RELIQUIAS.futuro.length];
        corpo.innerHTML = `<div class="bilhete-dourado"><div class="bilhete-dourado-inner"><div class="bilhete-header">Voucher Vitalício</div><div class="bilhete-corpo">Vale para:<div class="bilhete-destaque">${v.t}</div>${v.d}</div></div></div>`;
    } 
// SE FOR UM ITEM DA GAVETA (Ecos, Bussola, Carrossel)
    else if (['ecos', 'bussola', 'carrossel'].includes(tipo)) {
        const template = document.getElementById(`cartao-${tipo}`);
        if(template) corpo.appendChild(template);
        
        // 🚨 O GATILHO INTELIGENTE: Acorda o motor 3D específico na hora exata
        if (tipo === 'bussola' && typeof inicializarBussola3D === 'function') inicializarBussola3D();
        if (tipo === 'ecos' && typeof inicializarEco3D === 'function') inicializarEco3D();
        if (tipo === 'carrossel' && typeof inicializarCarrossel3D === 'function') inicializarCarrossel3D();
        
        // Desperta os motores 3D que já existiam
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100); 
    }

    modal.classList.remove('escondido');
}; // Fim da função window.abrirReliquia

window.fecharModal = function(apenasLimpar = false) {
    const modal = document.getElementById('modal-reliquia');
    const corpo = document.getElementById('corpo-modal');
    const gaveta = document.getElementById('reliquias-templates');
    
    // 🚨 1. EXTINTOR DE ÁUDIO: Para a música sincronizada e o áudio da cápsula
    const audioSinc = document.getElementById('audio-sincronizado');
    if (audioSinc && !audioSinc.paused) {
        audioSinc.pause();
        if (typeof playAudioJogos === 'function') playAudioJogos(); 
    }
    if (typeof audioReveladoFuturo !== 'undefined' && audioReveladoFuturo) {
        audioReveladoFuturo.pause();
        audioReveladoFuturo = null;
    }

    // 🚨 2. EXTINTOR DE CRONÔMETRO: Mata o timer da Cápsula do Futuro
    if (typeof loopRelogioFuturo !== 'undefined' && loopRelogioFuturo) {
        clearInterval(loopRelogioFuturo);
        loopRelogioFuturo = null;
    }
    
    if (gaveta && corpo) {
        // Guarda os elementos 3D vivos na gaveta ANTES de limpar o modal!
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

    // 2. Esconde TODOS os containers de jogos por segurança (🚨 'contratos' e 'defesa' adicionados à lista)
    const jogosContainers = ['termo', 'tribunal', 'sincronia', 'julgamento', 'minifazenda', 'jardim', 'contratos', 'estufa', 'cartorio', 'banco', 'pericia', 'logistica', 'hidratacao', 'agenda', 'roleta', 'guardiao', 'cinema', 'correio'];
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
            window.julgamentoAtivo = true; // 🚨 A CHAVE MESTRA: Liga o jogo toda vez que a tela for aberta!
            
            const julga = document.getElementById("julgamento-grade");
            if (julga && julga.children.length === 0) {
                if (typeof iniciarJulgamento === 'function') iniciarJulgamento();
            }
        }
        else if (tipo === 'minifazenda') {
            if(typeof iniciarMiniFazenda === 'function') iniciarMiniFazenda();
        }
        else if (tipo === 'jardim') {
            if (typeof inicializarPrisma3D === 'function') inicializarPrisma3D(); // Acorda a Árvore
            if (typeof window.renderizarPlanta === 'function') window.renderizarPlanta();
            const capitalUI = document.getElementById('jardim-moedas');
            if (capitalUI) capitalUI.innerText = window.pontosDoCasal || 0;
            setTimeout(() => { window.dispatchEvent(new Event('resize')); }, 50);
        }
        // 🚨 INTEGRAÇÕES FINAIS (CONTRATOS E DEFESA)
        else if (tipo === 'contratos') {
            if (typeof window.iniciarContratos === 'function') window.iniciarContratos();
        }

        else if (tipo === 'estufa') {
            if (typeof window.iniciarInterfaceEstufa === 'function') window.iniciarInterfaceEstufa();
        }

        else if (tipo === 'cartorio') {
            if (typeof window.inicializarCartorio === 'function') window.inicializarCartorio();
        }

        else if (tipo === 'banco') {
            if (typeof window.inicializarBanco === 'function') window.inicializarBanco();
        }

        else if (tipo === 'pericia') {
            if (typeof window.inicializarPericia === 'function') window.inicializarPericia();
        }

        else if (tipo === 'logistica') {
            if (typeof window.inicializarLogistica === 'function') window.inicializarLogistica();
        }

        else if (tipo === 'hidratacao') {
            if (typeof window.inicializarHidratacao === 'function') window.inicializarHidratacao();
        }

        else if (tipo === 'agenda') {
            if (typeof window.inicializarAgenda === 'function') window.inicializarAgenda();
        }

        else if (tipo === 'roleta') {
            if (typeof window.inicializarRoleta === 'function') window.inicializarRoleta();
        }

        else if (tipo === 'guardiao') {
            if (typeof window.inicializarGuardiao === 'function') window.inicializarGuardiao();
        }

        else if (tipo === 'cinema') {
            if (typeof window.inicializarCinema === 'function') window.inicializarCinema();
        }

        else if (tipo === 'correio') {
            if (typeof window.inicializarCorreio === 'function') window.inicializarCorreio();
        }
    }
};

window.voltarMenuJogos = function() {
    window.julgamentoAtivo = false; // Trava do Julgamento
    window.defesaAtiva = false; // Trava do Tower Defense

    // 1. Esconde todos os jogos abertos
    const jogosContainers = ['termo', 'tribunal', 'sincronia', 'julgamento', 'minifazenda', 'jardim', 'contratos', 'defesa', 'estufa', 'cartorio', 'banco', 'pericia', 'logistica', 'hidratacao', 'agenda', 'roleta', 'guardiao', 'cinema', 'correio'];
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

    // 🚨 A MÁGICA FINAL: Assim que voltar pro menu principal, o áudio retorna!
    if (typeof playAudioJogos === 'function') playAudioJogos();
};

// 9. LEIS
const URL_LEIS = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1Rr4fdzLLW-Xu4jrf7qotZ_r67mOJrTDQxtZMKxUF8UijZI0Uxj3dwnjzaX_I7dq5MpEepB3SjsMI/pub?gid=1219842239&single=true&output=csv";
window.cacheHTMLdasLeis = null; // A memória RAM do app

async function carregarLeis() {
    try {
        const container = document.querySelector(".lista-leis");
        if (!container) return;

        // Se já baixamos as leis hoje e a memória existe, injeta instantaneamente e aborta o download!
        if (window.cacheHTMLdasLeis) {
            if (container.innerHTML === "") container.innerHTML = window.cacheHTMLdasLeis;
            return; 
        }

        const res = await fetch(URL_LEIS);
        const txt = await res.text();
        const linhas = txt.split(/\r?\n/).filter(l => l.trim()).slice(1);
        
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
        const assinatura = document.createElement('div');
        assinatura.className = 'assinatura-leis';
        assinatura.style.marginBottom = "80px"; 
        assinatura.style.paddingBottom = "env(safe-area-inset-bottom)";
        assinatura.innerHTML = `
            <p>Promulgado em nome do amor, por João, em ${dataInicioObj.getDate()} de ${meses[dataInicioObj.getMonth()]} de ${dataInicioObj.getFullYear()}.</p>
            <p class="local-data">Santuário, em toda eternidade.</p>
        `;
        container.appendChild(assinatura);

        // O SEGREDO: Salva o HTML montado na memória RAM para as próximas vezes
        window.cacheHTMLdasLeis = container.innerHTML;

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
        audioJogos.volume = 0.0;
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
// SISTEMA DE TEMAS (DINÂMICO E ESCALÁVEL)
// ==========================================
function aplicarTema(tema) {
    // 1. O Motor Inteligente que limpa qualquer tema anterior automaticamente
    document.body.className = document.body.className.replace(/\btema-\S+/g, '');
    
    // 2. Aplica o novo (Se não for o Dourado padrão)
    if (tema !== 'dourado') {
        document.body.classList.add(`tema-${tema}`);
    }
    
    // 3. Salva na memória
    localStorage.setItem('santuario_tema', tema);
    
    // 4. Atualiza os botões visuais na gaveta
    document.querySelectorAll('.btn-tema').forEach(btn => {
        btn.classList.remove('ativo');
        if (btn.dataset.tema === tema) btn.classList.add('ativo');
    });
}

// Carregar tema salvo ao abrir o app
const temaSalvo = localStorage.getItem('santuario_tema') || 'dourado';
aplicarTema(temaSalvo);

// Adicionar eventos aos botões
document.querySelectorAll('.btn-tema').forEach(btn => {
    btn.addEventListener('click', () => {
        aplicarTema(btn.dataset.tema);
        if(window.Haptics) window.Haptics.toqueLeve();
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
// RELÍQUIA 1: NOSSOS ECOS (LISTENER GLOBAL UNIFICADO)
// ==========================================

// Agora o aplicativo escuta uma única "Frequência" compartilhada por ambos!
window.escutarEcosDoParceiro = function() {
    if (!window.SantuarioApp || !window.MEU_NOME) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    // Frequência de rádio unificada do Santuário
    const refEcoSantuario = ref(db, 'eco_santuario/frequencia_atual');
    
    onValue(refEcoSantuario, (snapshot) => {
        const dados = snapshot.val();
        const btnOuvir = document.getElementById('btn-ouvir-eco');
        const statusEco = document.getElementById('status-eco');
        
        // Aceita tanto a chave antiga (se houver cache) quanto a URL nova
        const urlOuBase64 = dados ? (dados.audioUrl || dados.audioBase64) : null;
        
        if (dados && urlOuBase64) {
            // Guarda a URL na memória vital do celular
            window.audioCarregado = urlOuBase64;
            window.autorEcoAtual = dados.autor;
            
            if (btnOuvir) btnOuvir.style.display = 'block';
            
            if (statusEco) {
                if (dados.autor === window.MEU_NOME) {
                    statusEco.innerText = "Sua voz está ecoando no espaço. 🎵";
                    statusEco.style.color = "#aaa";
                } else {
                    statusEco.innerText = `Um eco de ${window.NOME_PARCEIRO} aguarda por você! 🎵`;
                    statusEco.style.color = "#2ecc71";
                }
            }
        } else {
            window.audioCarregado = null;
            window.autorEcoAtual = null;
            if (btnOuvir) btnOuvir.style.display = 'none';
            if (statusEco) {
                statusEco.innerText = "O silêncio reina. Grave o primeiro eco.";
                statusEco.style.color = "var(--cor-primaria)";
            }
        }
    });
};


// ==========================================
// RELÍQUIA 3: CÁPSULA DO TEMPO (MULTIMÍDIA & FILA QUÂNTICA)
// Totalmente isolado do Livro de Ouro
// ==========================================
let loopRelogioFuturo = null;
let capsulaFuturoDados = null; 
let capsulaFuturoId = null; 
let totalFuturoNaFila = 0;

let fotoFuturoBase64 = null;
let audioFuturoBase64 = null;
let mediaRecorderFuturo = null;
let audioChunksFuturo = [];
let audioReveladoFuturo = null; 

window.abrirPainelFuturo = function() {
    const container = document.getElementById('painel-capsula-futuro');
    if (container) {
        container.classList.remove('escondido');
    }
    document.body.classList.add('modo-jogo-ativo'); 
    
    const navInferior = document.querySelector('.menu-inferior');
    if (navInferior) navInferior.classList.add('escondido');
    
    fotoFuturoBase64 = null;
    audioFuturoBase64 = null;
    
    const statusAnexos = document.getElementById('status-anexos-futuro');
    if (statusAnexos) statusAnexos.innerText = "";
    
    const dataAbertura = document.getElementById('data-abertura-futuro');
    if (dataAbertura) dataAbertura.value = "";
    
    const textoCapsula = document.getElementById('texto-futuro');
    if (textoCapsula) textoCapsula.value = "";
    
    escutarFuturoDoTempo();
};

window.fecharPainelFuturo = function() {
    const container = document.getElementById('painel-capsula-futuro');
    if (container) {
        container.classList.add('escondido');
    }
    document.body.classList.remove('modo-jogo-ativo');
    
    const navInferior = document.querySelector('.menu-inferior');
    if (navInferior) navInferior.classList.remove('escondido');
    
    if (loopRelogioFuturo) clearInterval(loopRelogioFuturo);
    if (audioReveladoFuturo) { audioReveladoFuturo.pause(); audioReveladoFuturo = null; }
};

window.processarFotoFuturo = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; 
            const scaleSize = MAX_WIDTH / img.width;
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            fotoFuturoBase64 = canvas.toDataURL('image/jpeg', 0.6); 
            
            const statusAnexos = document.getElementById('status-anexos-futuro');
            if(statusAnexos) statusAnexos.innerText += " [📸 Foto Anexada]";
            if(window.Haptics) window.Haptics.toqueLeve();
        };
    };
    reader.readAsDataURL(file);
};

window.toggleGravarAudioFuturo = async function() {
    const btn = document.getElementById('btn-audio-futuro');
    const statusDiv = document.getElementById('status-anexos-futuro');
    if (!btn) return;

    if (!mediaRecorderFuturo || mediaRecorderFuturo.state === 'inactive') {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let options = {};
            if (MediaRecorder.isTypeSupported('audio/mp4')) {
                options = { mimeType: 'audio/mp4' };
            } else if (MediaRecorder.isTypeSupported('audio/webm')) {
                options = { mimeType: 'audio/webm' };
            }
            
            mediaRecorderFuturo = new MediaRecorder(stream, options);
            audioChunksFuturo = [];

            mediaRecorderFuturo.ondataavailable = e => {
                if (e.data.size > 0) audioChunksFuturo.push(e.data);
            };

            mediaRecorderFuturo.onstop = () => {
                const blob = new Blob(audioChunksFuturo, { type: mediaRecorderFuturo.mimeType });
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    audioFuturoBase64 = reader.result; 
                    if (statusDiv) statusDiv.innerText += " [🎙️ Áudio Gravado]";
                    btn.innerText = "🎙️ Regravar Voz";
                    btn.style.backgroundColor = "";
                    btn.style.borderColor = "";
                    if (window.Haptics) window.Haptics.sucesso();
                };
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderFuturo.start();
            btn.style.backgroundColor = "rgba(255, 51, 102, 0.3)";
            btn.style.borderColor = "#ff3366";
            btn.innerText = "⏹️ Gravando... (Parar)";
            if (window.Haptics) window.Haptics.toqueForte();
        } catch (err) {
            console.error("Erro ao acessar microfone:", err);
            if (typeof mostrarToast === 'function') mostrarToast("Permita o uso do microfone!", "🎙️");
        }
    } else if (mediaRecorderFuturo.state === 'recording') {
        mediaRecorderFuturo.stop();
    }
};

window.tocarAudioFuturoLida = function() {
    if (audioReveladoFuturo) {
        audioReveladoFuturo.play();
        const btn = document.getElementById('btn-tocar-audio-futuro');
        if(btn) btn.innerText = "⏳ Tocando...";
        audioReveladoFuturo.onended = () => { if(btn) btn.innerText = "▶ Ouvir Novamente"; };
    }
};

function escutarFuturoDoTempo() {
    if (!window.SantuarioApp || !window.MEU_NOME) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refMinhasCapsulas = ref(db, 'capsulas_tempo/' + window.MEU_NOME.toLowerCase());
    
    onValue(refMinhasCapsulas, (snapshot) => {
        const dados = snapshot.val();
        if (!dados) {
            capsulaFuturoDados = null; capsulaFuturoId = null; totalFuturoNaFila = 0;
        } else {
            const listaCapsulas = Object.keys(dados).map(key => ({ id: key, ...dados[key] }));
            totalFuturoNaFila = listaCapsulas.length;
            listaCapsulas.sort((a, b) => a.dataAbertura - b.dataAbertura); 
            capsulaFuturoDados = listaCapsulas[0];
            capsulaFuturoId = listaCapsulas[0].id;
        }
        atualizarInterfaceFuturo();
    });
}

function atualizarInterfaceFuturo() {
    const formCriar = document.getElementById('form-criar-futuro');
    const painelLeitura = document.getElementById('painel-leitura-futuro');
    const iconeCadeado = document.getElementById('icone-cadeado-futuro');
    const status = document.getElementById('status-futuro');
    const relogio = document.getElementById('relogio-futuro');

    if (loopRelogioFuturo) clearInterval(loopRelogioFuturo);
    if (audioReveladoFuturo) { audioReveladoFuturo.pause(); audioReveladoFuturo = null; }

    if (!capsulaFuturoDados) {
        if(formCriar) formCriar.classList.remove('escondido');
        if(painelLeitura) painelLeitura.classList.add('escondido');
        if(iconeCadeado) { iconeCadeado.innerText = "🔓"; iconeCadeado.classList.remove('trancado'); }
        if(relogio) { relogio.innerText = "--:--:--:--"; relogio.classList.remove('zerado'); }
        if(status) status.innerText = `Nenhuma cápsula no horizonte. Escreva para ${window.NOME_PARCEIRO}.`;
    } else {
        if(formCriar) formCriar.classList.add('escondido'); 
        iniciarMotorDoTempoFuturo();
    }
}

function iniciarMotorDoTempoFuturo() {
    const relogio = document.getElementById('relogio-futuro');
    const iconeCadeado = document.getElementById('icone-cadeado-futuro');
    const painelLeitura = document.getElementById('painel-leitura-futuro');
    const status = document.getElementById('status-futuro');
    const msgRevelada = document.getElementById('mensagem-revelada-futuro');
    const imgRevelada = document.getElementById('img-revelada-futuro');
    const boxAudio = document.getElementById('container-audio-futuro');

    const atualizar = () => {
        const agora = new Date().getTime();
        const diferenca = capsulaFuturoDados.dataAbertura - agora;

        if (diferenca <= 0) {
            clearInterval(loopRelogioFuturo);
            if(relogio) { relogio.innerText = "00:00:00:00"; relogio.classList.add('zerado'); }
            if(iconeCadeado) { iconeCadeado.innerText = "✨"; iconeCadeado.classList.remove('trancado'); }
            
            let textoFila = totalFuturoNaFila > 1 ? ` (+${totalFuturoNaFila - 1} na fila!)` : "";
            if(status) status.innerText = "A barreira do tempo foi rompida." + textoFila;
            
            let txt = window.SantuarioCrypto ? window.SantuarioCrypto.decodificar(capsulaFuturoDados.mensagem) : capsulaFuturoDados.mensagem;
            if(msgRevelada) msgRevelada.innerText = txt || "Apenas memórias anexadas...";
            
            if (capsulaFuturoDados.foto && imgRevelada) {
                imgRevelada.src = capsulaFuturoDados.foto;
                imgRevelada.classList.remove('escondido');
            } else if(imgRevelada) { imgRevelada.classList.add('escondido'); imgRevelada.src = ""; }

            if (capsulaFuturoDados.audio && boxAudio) {
                audioReveladoFuturo = new Audio(capsulaFuturoDados.audio);
                boxAudio.classList.remove('escondido');
            } else if(boxAudio) { boxAudio.classList.add('escondido'); }

            if(painelLeitura) painelLeitura.classList.remove('escondido');
            if(window.Haptics && diferenca > -2000) navigator.vibrate([100, 50, 100]); 
        } else {
            const d = Math.floor(diferenca / (1000 * 60 * 60 * 24));
            const h = Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diferenca % (1000 * 60)) / 1000);
            
            const formatar = (n) => n < 10 ? "0" + n : n;
            if(relogio) relogio.innerText = `${formatar(d)}:${formatar(h)}:${formatar(m)}:${formatar(s)}`;
            if(iconeCadeado) { iconeCadeado.innerText = "🔒"; iconeCadeado.classList.add('trancado'); }
            
            let textoFila = totalFuturoNaFila > 1 ? ` (${totalFuturoNaFila} cápsulas na fila)` : "";
            if(status) status.innerText = `O espaço-tempo protege esta mensagem de ${window.NOME_PARCEIRO}.${textoFila}`;
            
            if(painelLeitura) painelLeitura.classList.add('escondido');
            if(imgRevelada) imgRevelada.classList.add('escondido');
            if(boxAudio) boxAudio.classList.add('escondido');
        }
    };

    atualizar(); 
    loopRelogioFuturo = setInterval(atualizar, 1000); 
}

window.selarFuturo = async function() {
    const texto = document.getElementById('texto-futuro').value;
    const dataInput = document.getElementById('data-abertura-futuro').value; 

    if (!texto.trim() && !fotoFuturoBase64 && !audioFuturoBase64) {
        if(typeof mostrarToast === 'function') mostrarToast("Adicione pelo menos um texto, foto ou áudio!", "⚠️");
        return;
    }
    if (!dataInput) {
        if(typeof mostrarToast === 'function') mostrarToast("Você precisa definir a data exata da abertura!", "⏳");
        return;
    }

    const dataAbertura = new Date(dataInput).getTime();
    const agora = new Date().getTime();

    if (dataAbertura <= agora) {
        if(typeof mostrarToast === 'function') mostrarToast("A data precisa estar no futuro!", "⏳");
        return;
    }

    // 🚨 INÍCIO DA ENGENHARIA DE ARMAZENAMENTO (CLOUD STORAGE) 🚨
    if(typeof mostrarToast === 'function') mostrarToast("Criptografando e fazendo upload pro espaço... Aguarde!", "🚀");
    
    // Desativa o botão para não clicar duas vezes enquanto carrega o arquivo
    const btnSelar = document.querySelector('#form-criar-futuro .btn-acao');
    if (btnSelar) btnSelar.disabled = true;

    try {
        const { db, ref: dbRef, push, storage, storageRef, uploadString, getDownloadURL } = window.SantuarioApp.modulos;
        const refDestino = dbRef(db, 'capsulas_tempo/' + window.NOME_PARCEIRO.toLowerCase());
        
        let urlFoto = null;
        let urlAudio = null;
        const idUnico = Date.now().toString();

        // 1. Upa a Foto pro Disco (Se existir) e guarda apenas a URL
        if (fotoFuturoBase64) {
            const fotoRef = storageRef(storage, `capsulas/${window.MEU_NOME}_foto_${idUnico}`);
            await uploadString(fotoRef, fotoFuturoBase64, 'data_url');
            urlFoto = await getDownloadURL(fotoRef);
        }

        // 2. Upa o Áudio pro Disco (Se existir) e guarda apenas a URL
        if (audioFuturoBase64) {
            const audioRef = storageRef(storage, `capsulas/${window.MEU_NOME}_audio_${idUnico}`);
            await uploadString(audioRef, audioFuturoBase64, 'data_url');
            urlAudio = await getDownloadURL(audioRef);
        }

        // 3. Salva SÓ O TEXTO E OS LINKS no banco de dados (Custo zero de banda!)
        const textoCriptografado = window.SantuarioCrypto ? window.SantuarioCrypto.codificar(texto) : texto;
        const capsuleData = {
            mensagem: textoCriptografado,
            dataCriacao: agora,
            dataAbertura: dataAbertura,
            autor: window.MEU_NOME
        };
        
        if (urlFoto) capsuleData.foto = urlFoto;
        if (urlAudio) capsuleData.audio = urlAudio;

        await push(refDestino, capsuleData);

        // Sucesso Total
        if(typeof mostrarToast === 'function') mostrarToast("Cápsula selada e guardada com sucesso!", "🔒");
        if(window.Haptics) navigator.vibrate([50, 100, 50]);
        
        // Limpeza visual
        document.getElementById('texto-futuro').value = "";
        document.getElementById('data-abertura-futuro').value = "";
        fotoFuturoBase64 = null;
        audioFuturoBase64 = null;
        
        const statusAnexos = document.getElementById('status-anexos-futuro');
        if(statusAnexos) statusAnexos.innerText = "";
        
        const btnAudio = document.getElementById('btn-audio-futuro');
        if(btnAudio) {
            btnAudio.innerText = "🎙️ Gravar Voz";
            btnAudio.style.backgroundColor = "";
            btnAudio.style.borderColor = "";
        }
        
        if (mediaRecorderFuturo && mediaRecorderFuturo.state === 'recording') {
            mediaRecorderFuturo.stop();
        }
    } catch (error) {
        console.error("Erro ao fazer upload da cápsula:", error);
        if(typeof mostrarToast === 'function') mostrarToast("Erro na conexão estelar. Tente novamente.", "❌");
    } finally {
        if (btnSelar) btnSelar.disabled = false;
    }
};

window.destruirFuturoLido = function() {
    if (!capsulaFuturoId) return;

    const { db, ref, remove } = window.SantuarioApp.modulos;
    const refMinhaCapsula = ref(db, 'capsulas_tempo/' + window.MEU_NOME.toLowerCase() + '/' + capsulaFuturoId);
    
    remove(refMinhaCapsula).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Memória absorvida. Verificando o relógio seguinte...", "✨");
        if(window.Haptics) window.Haptics.toqueLeve();
    });
};



// ==========================================
// EXPANSÃO 1: RADAR DE TELEPRESENÇA VIVO
// ==========================================
let loopVibracaoRadar = null;

// Quando você aperta o dedo na tela
window.iniciarPulsoRadar = function(e) {
    if (e) e.preventDefault(); 
    if (!window.SantuarioApp || !window.MEU_NOME) return;
    
    const { db, ref, set } = window.SantuarioApp.modulos;
    const meuRadarRef = ref(db, 'telepresenca/' + window.MEU_NOME.toLowerCase());
    
    // Manda o sinal luminoso "ONLINE/PULSANDO"
    set(meuRadarRef, { pulsando: true, timestamp: Date.now() });
    
    // Dá um soquinho no seu celular para confirmar que o botão foi apertado
    if (window.Haptics) navigator.vibrate(30); 
};

// Quando você tira o dedo da tela
window.pararPulsoRadar = function(e) {
    if (e) e.preventDefault();
    if (!window.SantuarioApp || !window.MEU_NOME) return;
    
    const { db, ref, set } = window.SantuarioApp.modulos;
    const meuRadarRef = ref(db, 'telepresenca/' + window.MEU_NOME.toLowerCase());
    
    // Desliga o sinal luminoso
    set(meuRadarRef, { pulsando: false, timestamp: Date.now() });
};

// O Ouvido Constante (Escuta a Thamiris 24 horas por dia)
window.escutarRadarParceiro = function() {
    if (!window.SantuarioApp || !window.NOME_PARCEIRO) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const radarParceiroRef = ref(db, 'telepresenca/' + window.NOME_PARCEIRO.toLowerCase());
    
    onValue(radarParceiroRef, (snapshot) => {
        const dados = snapshot.val();
        const containerRadar = document.getElementById('radar-telepresenca');
        
        if (dados && dados.pulsando) {
            // ELA APERTOU O DEDO LÁ EM GOIÁS!
            if (containerRadar) containerRadar.classList.add('radar-recebendo');
            
            // Inicia o motor de vibração rítmica (Batimento Cardíaco - 100 BPM)
            if (!loopVibracaoRadar) {
                // Dá o primeiro pulso imediatamente
                if (window.Haptics) navigator.vibrate([60, 80, 60]);
                
                // Repete o pulso enquanto ela segurar
                loopVibracaoRadar = setInterval(() => {
                    if (window.Haptics) navigator.vibrate([60, 80, 60]); 
                }, 800); 
            }
        } else {
            // ELA SOLTOU O DEDO
            if (containerRadar) containerRadar.classList.remove('radar-recebendo');
            if (loopVibracaoRadar) {
                clearInterval(loopVibracaoRadar);
                loopVibracaoRadar = null;
            }
        }
    });
};

// ==========================================
// OLHEIRO INTELIGENTE: OCULTA O RADAR EM JOGOS E RELÍQUIAS
// ==========================================
window.addEventListener('load', () => {
    const radar = document.getElementById('radar-telepresenca');
    const modalReliquia = document.getElementById('modal-reliquia');
    
    if (!radar) return;

    const verificarVisibilidadeRadar = () => {
        // Verifica se o usuário está dentro de um jogo ou no Painel do Futuro
        const emJogo = document.body.classList.contains('modo-jogo-ativo');
        // Verifica se o modal das relíquias padrão está aberto
        const emReliquia = modalReliquia && !modalReliquia.classList.contains('escondido');
        
        if (emJogo || emReliquia) {
            radar.style.display = 'none'; // Esconde completamente
        } else {
            radar.style.display = 'flex'; // Devolve o radar
        }
    };

    // Fica vigiando o "body" (ele muda quando entraremos em jogos ou na Cápsula)
    const observerBody = new MutationObserver(verificarVisibilidadeRadar);
    observerBody.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Fica vigiando a janela das Relíquias (Planetário, Ecos, etc)
    if (modalReliquia) {
        const observerModal = new MutationObserver(verificarVisibilidadeRadar);
        observerModal.observe(modalReliquia, { attributes: true, attributeFilter: ['class'] });
    }
});



// ==========================================
// TOGGLE DA AURA DO SANTUÁRIO (TEMAS COLAPSÁVEIS)
// ==========================================
window.toggleTemas = function() {
    const conteudo = document.getElementById('conteudo-temas');
    const icone = document.getElementById('icone-toggle-temas');
    
    if (conteudo && icone) {
        if (conteudo.classList.contains('escondido')) {
            // Abrir a gaveta
            conteudo.classList.remove('escondido');
            icone.style.transform = 'rotate(180deg)';
            if(window.Haptics) window.Haptics.toqueLeve();
        } else {
            // Fechar a gaveta
            conteudo.classList.add('escondido');
            icone.style.transform = 'rotate(0deg)';
            if(window.Haptics) window.Haptics.toqueLeve();
        }
    }
};

// ==========================================
// CHAVE MESTRA DO COFRE (CORREÇÃO DA JANELA VAZIA)
// ==========================================
// Essa trava impede que a função se duplique se você recarregar a página
if (!window.abrirReliquiaBlindada) {
    const abrirReliquiaOriginal = window.abrirReliquia;
    
    window.abrirReliquia = function(event, tipo) {
        // Se for o nosso Planetário, assumimos o controle total da janela!
        if (tipo === 'planetario') {
            if (event) event.preventDefault();
            const modal = document.getElementById('modal-reliquia');
            const corpo = document.getElementById('corpo-modal');
            const template = document.getElementById('cartao-planetario');
            
            if (template && corpo && modal) {
                // Copia o Planetário para dentro da janela de vidro
                corpo.innerHTML = template.innerHTML;
                modal.classList.remove('escondido');
                
                // Conecta o banco de dados na mesma hora para não piscar tela vazia
                if (typeof window.escutarPlanetario === 'function') {
                    window.escutarPlanetario();
                }
            }
        } 
        // Se for qualquer outra relíquia antiga, usa a sua função original intacta:
        else if (abrirReliquiaOriginal) {
            abrirReliquiaOriginal(event, tipo);
        }
    };
    window.abrirReliquiaBlindada = true;
}

// ==========================================
// EXPANSÃO 2: PLANETÁRIO DE SONHOS (ECONOMIA VIVA)
// ==========================================
window.abrirCriacaoEstrela = function() {
    // Procura o formulário EXATAMENTE dentro da janela que está aberta no momento
    const form = document.querySelector('#corpo-modal #form-criar-estrela');
    if (form) form.classList.remove('escondido');
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.cancelarCriacaoEstrela = function() {
    const form = document.querySelector('#corpo-modal #form-criar-estrela');
    if (form) form.classList.add('escondido');
    const input = document.querySelector('#corpo-modal #input-nome-estrela');
    if (input) input.value = "";
};

window.escutarPlanetario = function() {
    if (!window.SantuarioApp) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refPlanetario = ref(db, 'planetario_sonhos');
    
    onValue(refPlanetario, (snapshot) => {
        const dados = snapshot.val();
        
        let lista = document.querySelector('#corpo-modal #lista-estrelas-planetario');
        if (!lista) lista = document.querySelector('#reliquias-templates #lista-estrelas-planetario');
        if (!lista) return;

        if (!dados) {
            lista.innerHTML = '<p style="color: #888; font-size: 0.85rem; font-style: italic; text-align:center;">O cosmos está vazio. Crie a primeira estrela.</p>';
            window.quantidadeSupernovas = 0;
            return;
        }

        let countSupernovas = 0;
        const arrayEstrelas = Object.keys(dados).map(k => ({ id: k, ...dados[k] }));
        arrayEstrelas.sort((a, b) => a.realizado - b.realizado || b.dataCriacao - a.dataCriacao);

        // 🚨 BUFFER DE MEMÓRIA: Montamos o HTML inteiro fora do DOM para evitar o colapso do navegador!
        let htmlBuffer = "";

        arrayEstrelas.forEach(estrela => {
            const dataCriacao = new Date(estrela.dataCriacao).toLocaleDateString('pt-BR');
            const isSupernova = estrela.realizado;
            if(isSupernova) countSupernovas++;

            htmlBuffer += `
                <div class="estrela-item ${isSupernova ? 'supernova' : ''}">
                    <div>
                        <div class="estrela-nome">${estrela.nome} ${isSupernova ? '✨' : ''}</div>
                        <div class="estrela-data">${isSupernova ? 'Realizado! O sonho colapsou em Luz.' : 'Adicionada em: ' + dataCriacao}</div>
                    </div>
                    <button class="btn-supernova" onclick="explodirSupernova('${estrela.id}')" ${isSupernova ? 'disabled' : ''}>
                        ${isSupernova ? '🌟' : '🎇'}
                    </button>
                </div>
            `;
        });
        
        // Injeta tudo no HTML de uma única vez (Performance impecável)
        lista.innerHTML = htmlBuffer;
        window.quantidadeSupernovas = countSupernovas;
    });
};

window.comprarEstrela = function() {
    // Pega o que você digitou DENTRO do modal
    const inputDOM = document.querySelector('#corpo-modal #input-nome-estrela');
    if (!inputDOM) return;
    const nome = inputDOM.value.trim();

    if (!nome) {
        if(typeof mostrarToast === 'function') mostrarToast("Batize o seu sonho antes de comprar!", "⚠️");
        return;
    }

    const moedasDOM = document.getElementById('fazenda-capital') || document.getElementById('jardim-moedas');
    if (moedasDOM) {
        let saldoAtual = parseInt(moedasDOM.innerText) || 0;
        if (saldoAtual < 100) {
            if(typeof mostrarToast === 'function') mostrarToast("Capital insuficiente. Joguem para lucrar mais!", "📉");
            if(window.Haptics) window.Haptics.erro();
            return;
        }
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-100, "Constelação Criada!");
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    const refPlanetario = ref(db, 'planetario_sonhos');

    push(refPlanetario, {
        nome: nome,
        dataCriacao: Date.now(),
        realizado: false,
        autor: window.MEU_NOME
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Uma nova estrela nasceu no Santuário!", "🌌");
        if(window.Haptics) navigator.vibrate([50, 100, 50]);
        window.cancelarCriacaoEstrela();
    });
};

window.explodirSupernova = function(id) {
    if(!confirm("Atenção: Este sonho já foi realizado na vida real por vocês dois?")) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    const refEstrela = ref(db, `planetario_sonhos/${id}`);
    
    update(refEstrela, {
        realizado: true,
        dataRealizacao: Date.now()
    }).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("SUPERNOVA! Um sonho se tornou realidade!", "🌟");
        if(window.Haptics) navigator.vibrate([100, 50, 200, 50, 300]);
        if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#D4AF37', '#ffffff'], particleCount: 200, spread: 180});
    });
};



// ==========================================
// RITUAL DO PERGAMINHO DE CERA (SEMENTES)
// ==========================================
window.quebrarSeloDeCera = function(e) {
    if(e) e.preventDefault();
    
    const envelope = document.getElementById('envelope-semente');
    if(!envelope || envelope.classList.contains('quebrado')) return;
    
    // 1. Aciona a animação CSS de abrir o envelope
    envelope.classList.add('quebrado');
    
    // 2. Feedback Sensorial Bruto (Simula algo se partindo na mão dela)
    if(window.Haptics) {
        // Um solavanco forte, seguido de tremores menores simulando a cera caindo
        navigator.vibrate([100, 30, 50, 20, 30]); 
    }
    
    // 3. Explosão Visual da Cera (Usando a biblioteca de confetes, mas só com tons de vermelho escuro)
    if(typeof confetti === 'function') {
        const rect = document.getElementById('selo-cera').getBoundingClientRect();
        // Converte a posição do selo para a tela do canvas de confetes
        const yPos = (rect.top + (rect.height / 2)) / window.innerHeight;
        const xPos = (rect.left + (rect.width / 2)) / window.innerWidth;
        
        confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: yPos, x: xPos },
            colors: ['#ff4d4d', '#b30000', '#800000', '#4d0000'], // Paleta de Cera Derretida
            startVelocity: 25,
            gravity: 1.2,
            ticks: 80, // Partículas somem rápido (como pedaços pesados caindo)
            shapes: ['square', 'circle'] 
        });
    }
};



// ==========================================
// RITUAL DO TOCA-DISCOS SINCRONIZADO
// ==========================================
window.iniciarMusicaSincronizada = function() {
    if (!window.SantuarioApp) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    const refMusica = ref(db, 'estado_musica'); // Nó global que une os dois celulares
    
    // Dispara a ordem de Play para o Firebase com o Timestamp exato
    set(refMusica, {
        tocando: true,
        inicioTempo: Date.now(),
        autor: window.MEU_NOME
    });
    
    if(window.Haptics) window.Haptics.toqueForte();
};

window.pausarMusicaSincronizada = function() {
    if (!window.SantuarioApp) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    const refMusica = ref(db, 'estado_musica');
    
    set(refMusica, {
        tocando: false,
        autor: window.MEU_NOME
    });
    
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.escutarTocaDiscos = function() {
    if (!window.SantuarioApp) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refMusica = ref(db, 'estado_musica');
    
    onValue(refMusica, (snapshot) => {
        const dados = snapshot.val();
        
        const audio = document.querySelector('#corpo-modal #audio-sincronizado');
        const disco = document.querySelector('#corpo-modal #disco-vinil');
        const agulha = document.querySelector('#corpo-modal #braco-agulha');
        const btnPlay = document.querySelector('#corpo-modal #btn-toca-discos-play');
        const btnPause = document.querySelector('#corpo-modal #btn-toca-discos-pause');
        const status = document.querySelector('#corpo-modal #status-toca-discos');
        
        if (!audio || !disco || !agulha) return; 

        if (dados && dados.tocando) {
            const tempoDecorrido = (Date.now() - dados.inicioTempo) / 1000;
            
            if (tempoDecorrido < audio.duration || isNaN(audio.duration)) {
                if (Math.abs(audio.currentTime - tempoDecorrido) > 2) {
                    audio.currentTime = tempoDecorrido;
                }
                
                audio.play().then(() => {
                    agulha.classList.add('tocando');
                    disco.classList.add('tocando');
                    if(btnPlay) btnPlay.classList.add('escondido');
                    if(btnPause) btnPause.classList.remove('escondido');
                    if(status) status.innerText = `🔊 Sincronizado por ${dados.autor}`;
                    
                    // 🚨 MUTA A MÚSICA DE FUNDO IMEDIATAMENTE
                    if(typeof pauseAudioJogos === 'function') pauseAudioJogos();
                    
                }).catch((e) => { /*... erro ...*/ });
            } else {
                window.pausarMusicaSincronizada();
            }
        } else {
            audio.pause();
            agulha.classList.remove('tocando');
            disco.classList.remove('tocando');
            if(btnPlay) btnPlay.classList.remove('escondido');
            if(btnPause) btnPause.classList.add('escondido');
            
            let textoStatus = dados ? `⏸ Pausado por ${dados.autor}` : "Pronto para tocar.";
            if(status) status.innerText = textoStatus;
            
            // 🚨 RETOMA A MÚSICA DE FUNDO
            if(typeof playAudioJogos === 'function') playAudioJogos();
        }
    });
};



// ==========================================
// EXPANSÃO 3: O ESPELHO DA ALMA (DIÁRIO SINCRONIZADO)
// ==========================================
const PERGUNTAS_ESPELHO = [
    "Qual foi o exato momento, o milissegundo, em que você percebeu que me amava?",
    "Se fôssemos fugir de tudo amanhã sem destino, para onde você gostaria de ir comigo?",
    "Qual é o pequeno detalhe em mim que você mais admira, mas raramente comenta?",
    "Se você pudesse reviver um único dia da nossa história, qual seria e por quê?",
    "O que você mais admira na forma como lidamos com os quilômetros de distância?",
    "Qual música toca a sua alma e te faz lembrar de mim instantaneamente?",
    "Qual é o seu maior sonho para a nossa primeira semana morando sob o mesmo teto?",
    "O que eu faço ou digo que te traz mais paz quando o seu mundo está caótico?",
    "Como você descreveria o meu abraço e o meu cheiro para alguém cego?",
    "Qual foi a maior e mais profunda lição que o nosso amor te ensinou até hoje?"
    // Você pode adicionar infinitas perguntas aqui depois!
];

window.escutarEspelhoDaAlma = function() {
    if (!window.SantuarioApp || !window.MEU_NOME || !window.NOME_PARCEIRO) return;
    
    // Pega a data de hoje no fuso horário do celular
    const hoje = new Date();
    const stringData = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    
    // Sorteio matemático da pergunta baseado no dia do ano
    const inicioAno = new Date(hoje.getFullYear(), 0, 0);
    const diff = hoje - inicioAno;
    const umDia = 1000 * 60 * 60 * 24;
    const diaDoAno = Math.floor(diff / umDia);
    const indicePergunta = diaDoAno % PERGUNTAS_ESPELHO.length;
    
    document.getElementById('pergunta-espelho').innerText = `"${PERGUNTAS_ESPELHO[indicePergunta]}"`;
    const tagNomeParceiro = document.getElementById('nome-parceiro-espelho');
    if (tagNomeParceiro) tagNomeParceiro.innerText = `A alma de ${window.NOME_PARCEIRO}`;
    
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    // Ouve especificamente o diretório da data de hoje!
    const refEspelho = ref(db, `espelho_alma/${stringData}`);
    
    onValue(refEspelho, (snapshot) => {
        const dados = snapshot.val() || {};
        
        const minhaResposta = dados[window.MEU_NOME.toLowerCase()];
        const respostaDela = dados[window.NOME_PARCEIRO.toLowerCase()];
        
        const boxResponder = document.getElementById('estado-espelho-responder');
        const boxAguardando = document.getElementById('estado-espelho-aguardando');
        const boxRevelado = document.getElementById('estado-espelho-revelado');
        const cartaoEspelho = document.getElementById('cartao-espelho-alma');
        
        if (minhaResposta && respostaDela) {
            // ESTADO 3: OS DOIS RESPONDERAM! A MAGIA ACONTECE.
            if(boxResponder) boxResponder.classList.add('escondido');
            if(boxAguardando) boxAguardando.classList.add('escondido');
            if(boxRevelado) boxRevelado.classList.remove('escondido');
            
            document.getElementById('resposta-minha').innerText = minhaResposta;
            document.getElementById('resposta-dela').innerText = respostaDela;
            
            // Efeito visual + Físico se for a primeira vez que quebra o vidro hoje
            if (cartaoEspelho && !cartaoEspelho.classList.contains('efeito-estilhaco')) {
                cartaoEspelho.classList.add('efeito-estilhaco');
                if (window.Haptics) navigator.vibrate([100, 50, 200, 50, 300]);
                if (typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff', '#3498db'], particleCount: 150, spread: 120, zIndex: 1000});
            }
        } else if (minhaResposta && !respostaDela) {
            // ESTADO 2.A: SÓ EU RESPONDI E ESTOU AGUARDANDO
            if(boxResponder) boxResponder.classList.add('escondido');
            if(boxAguardando) boxAguardando.classList.remove('escondido');
            if(boxRevelado) boxRevelado.classList.add('escondido');
            document.getElementById('texto-aguardando-espelho').innerText = `A sua verdade foi gravada. Aguardando ${window.NOME_PARCEIRO} responder em Goiânia para que o espelho se estilhace... 🔒`;
        } else if (!minhaResposta && respostaDela) {
            // ESTADO 2.B: SÓ ELA RESPONDEU (A PRESSÃO PSICOLÓGICA!)
            if(boxResponder) boxResponder.classList.remove('escondido');
            if(boxAguardando) boxAguardando.classList.remove('escondido');
            if(boxRevelado) boxRevelado.classList.add('escondido');
            document.getElementById('texto-aguardando-espelho').innerHTML = `<span style="color: #ff9ff3; font-weight:bold; font-size:1.1rem;">✨ ${window.NOME_PARCEIRO} já respondeu!</span><br>O espelho agora aguarda a sua resposta para ser revelado.`;
        } else {
            // ESTADO 1: O DIA COMEÇOU, NINGUÉM RESPONDEU
            if(boxResponder) boxResponder.classList.remove('escondido');
            if(boxAguardando) boxAguardando.classList.add('escondido');
            if(boxRevelado) boxRevelado.classList.add('escondido');
            if(cartaoEspelho) cartaoEspelho.classList.remove('efeito-estilhaco'); // Reseta o vidro
        }
    });
};

window.enviarRespostaEspelho = function() {
    const input = document.getElementById('input-espelho');
    if (!input) return;
    const resposta = input.value.trim();
    
    if (!resposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Você precisa escrever a sua verdade primeiro!", "⚠️");
        return;
    }
    
    const hoje = new Date();
    const stringData = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    
    const { db, ref, update } = window.SantuarioApp.modulos;
    const refEspelho = ref(db, `espelho_alma/${stringData}`);
    
    const payload = {};
    payload[window.MEU_NOME.toLowerCase()] = resposta;
    
    // Usamos UPDATE em vez de SET para não apagar a resposta dela se ela já respondeu!
    update(refEspelho, payload).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("A sua alma foi selada no espelho.", "🪞");
        if(window.Haptics) window.Haptics.sucesso();
    });
};



// ==========================================
// EXPANSÃO 4: A ROTA DO DESTINO (CORRIGIDA E APERFEIÇOADA)
// ==========================================
window.escutarRotaDestino = function() {
    if (!window.SantuarioApp?.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refRota = ref(db, 'rota_destino/estado');
    
    // Listener constante para atualizar o contador na tela
    onValue(refRota, (snapshot) => {
        const dados = snapshot.val() || { km: 0 };
        // Garante que o KM seja um número exato e não ultrapasse a meta de 1300
        let kmTotal = Math.min(Number(dados.km || 0), 1300);
        
        const contador = document.getElementById('km-contador');
        if (contador) {
            contador.innerHTML = `${kmTotal} <span class="hud-max">/ 1300 KM</span>`;
        }
        
        // Atualiza o progresso para o motor 3D (0.0 a 1.0)
        window.ProgressoAlvoJornada = kmTotal / 1300;
    });
};

window.comprarCombustivel = function() {
    if (!window.SantuarioApp?.modulos) return;
    const { db, ref, get, update } = window.SantuarioApp.modulos;
    const refRota = ref(db, 'rota_destino/estado');
    
    // 1. Verifica se há moedas suficientes com segurança
    const moedasAtuais = window.pontosDoCasal || 0;
    if (moedasAtuais < 100) {
        if(typeof mostrarToast === 'function') mostrarToast("Moedas insuficientes! Joguem mais para lucrar.", "💰");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    // 2. Busca o valor atual e imutável de KM para somar +5
    get(refRota).then((snapshot) => {
        let dados = snapshot.val() || { km: 0 };
        let kmAtual = Number(dados.km || 0);

        if (kmAtual >= 1300) {
            if(typeof mostrarToast === 'function') mostrarToast("A Jornada já foi concluída! Vocês venceram a distância.", "✨");
            return;
        }

        // 3. Desconta dinheiro local/globalmente e aumenta KM
        if(typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(-100, "Combustível");
        }
        
        let novoKm = Math.min(kmAtual + 5, 1300);
        
        // 4. Salva a nova distância na nuvem
        update(refRota, { km: novoKm }).then(() => {
            if(typeof mostrarToast === 'function') mostrarToast(`Motores acesos! +5km percorridos.`, "🚀");
            if(window.Haptics) navigator.vibrate([30, 50, 30]);
        }).catch(err => {
            console.error("Erro ao atualizar Jornada:", err);
        });
    });
};

// O GATILHO MÁGICO: Garante que a função acorde sozinha quando o app carregar!
window.addEventListener('load', () => {
    setTimeout(window.escutarRotaDestino, 1000);
});