// ============================================================================
// MOTOR DE INJEÇÃO SOB DEMANDA (BYPASS DE ANTIVÍRUS/EXTENSÕES)
// ============================================================================

window.modulosCarregadosHTML = {};

window.injetarModuloHTML = function(jogoId) {
    return new Promise((resolve) => {
        const container = document.getElementById(`container-${jogoId}`);
        if (!container) return resolve(false);

        // Se já carregou, não gasta processamento
        if (window.modulosCarregadosHTML[jogoId]) return resolve(true);

        if(typeof mostrarToast === 'function') mostrarToast("Sintonizando módulo...", "⏳");

        // 🚨 A MÁGICA FURTIVA: Substituímos o 'fetch' moderno pelo 'XMLHttpRequest'
        // Isso passa invisível pelos bloqueios do 200.js (Kaspersky/AdBlocks)
        const xhr = new XMLHttpRequest();
        const urlFurtiva = `./modulos/${jogoId}.html?v=${Date.now()}`;
        
        xhr.open('GET', urlFurtiva, true);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                container.innerHTML = xhr.responseText;
                window.modulosCarregadosHTML[jogoId] = true;
                resolve(true);
            } else {
                console.error(`Falha do servidor ao buscar [${jogoId}]: Status ${xhr.status}`);
                if(typeof mostrarToast === 'function') mostrarToast("Erro ao ler o arquivo HTML.", "❌");
                resolve(false);
            }
        };

        xhr.onerror = function() {
            console.error(`Ataque bloqueado pela extensão no módulo [${jogoId}]`);
            if(typeof mostrarToast === 'function') mostrarToast("Extensão cortou a conexão.", "❌");
            resolve(false);
        };

        xhr.send();
    });
};

// ==========================================
// VARIÁVEIS GLOBAIS DE ESTADO
// ==========================================
window.statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", ultimaVerificacao: Date.now(), sequencia: 0, ciclos: 0 };
let audioJogos = null;



let telaAtual = 'home';
const dataInicio = new Date("2025-10-29T16:30:00").getTime();

// 🚨 A DATA E HORA EXATA DO REENCONTRO (O MOMENTO EM QUE A DISTÂNCIA ZERA)
// Altere esta data para o dia e horário que o cronômetro deve congelar para sempre
const dataCongelamento = new Date("2050-10-29T16:30:00").getTime(); 

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
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
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
    if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI(); // 🚨 PUXA O SALDO
    
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
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
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
                        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100, 50, 200]);
                    }
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
function finalizarVitoria() {
    const d = new Date();
    const hoje = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    
    // 1. Salva na memória profunda e dá o dinheiro apenas 1 VEZ POR DIA
    if (localStorage.getItem('santuario_vitoria_dia') !== hoje) {
        localStorage.setItem('santuario_vitoria_dia', hoje);
        
        // 🚨 INFLAÇÃO DO BEM: +200 Moedas pela vitória diária
        if (typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(200, "Vitória no Oráculo Diário");
        }
        if(typeof mostrarToast === 'function') mostrarToast("O Oráculo revelou a verdade! +200💰", "✨");
    }
    
    // 2. A MÁGICA: Destranca o cofre visualmente e atualiza a tela Home
    if (typeof liberarCofreVisual === 'function') liberarCofreVisual();
    if (typeof atualizarDinamicaHome === 'function') atualizarDinamicaHome();
    
    // 3. Atualiza a Ofensiva Diária
    if (typeof window.verificarRitualDoDia === 'function') window.verificarRitualDoDia();
    
    // 4. Limpa o teclado e esconde o botão
    document.getElementById("teclado-termo").innerHTML = "";
    document.getElementById("btn-verificar").classList.add("escondido");
    
    // 5. Atualiza o painel de instruções com a glória e a fortuna
    const inst = document.getElementById('instrucoes-termo');
    if (inst) {
        inst.innerHTML = `<h4 style="text-align:center; color: #2ecc71;">Vitória Alcançada! ✨</h4>
                          <p style="text-align:center;">O Oráculo foi destrancado e você garantiu seus 200💰 diários!</p>`;
        inst.classList.remove('escondido');
    }
}

// ==========================================
// FUNÇÃO DE RECOMEÇO (CORRIGIDA - MATRIZ 2D)
// ==========================================
function resetarTermo() {
    const d = new Date();
    const hoje = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    
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
// A DICA DE AMOR SUPREMA (INTEGRADA AO BANCO CENTRAL)
// ==========================================
window.usarDicaAmor = function() {
    const moedasAtuais = window.pontosDoCasal || 0;
    
    // Verifica se ela tem dinheiro suficiente na Poupança Global
    if (moedasAtuais < 10) {
        if(typeof mostrarToast === 'function') mostrarToast("Você precisa de 10💰 para a Dica!", "🔒");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const palavraOriginal = window.PALAVRA_DO_DIA || "AMADA";
    const palavraNormalizada = normalizarPalavra(palavraOriginal);
    
    if (letraAtual < 5) {
        // 1. O BANCO CENTRAL AGE: Desconta o valor e atualiza a Pílula no topo da tela instantaneamente
        if (typeof atualizarPontosCasal === 'function') {
            atualizarPontosCasal(-10, "Dica de Amor Oráculo");
        }

        // 2. Entrega a letra sem acento para o teclado aceitar
        const letraDica = palavraNormalizada[letraAtual];
        adicionarLetra(letraDica);

        // 3. Feedback sensorial do gasto
        if(typeof mostrarToast === 'function') mostrarToast("Uma luz brilha no Oráculo... -10💰", "💖");
        if(window.Haptics) window.Haptics.sucesso();
        
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("A linha já está cheia!", "⚠️");
    }
};

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

// O Injetor Furtivo de Clima: Dribla o bloqueio do Kaspersky e AdBlocks
function buscarClimaFurtivo(url) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        
        xhr.onload = function() {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    resolve(JSON.parse(xhr.responseText));
                } catch(e) {
                    reject(e);
                }
            } else {
                reject(`Status de bloqueio: ${xhr.status}`);
            }
        };
        
        xhr.onerror = function() {
            reject("Extensão de segurança cortou o cabo de rede.");
        };
        
        xhr.send();
    });
}

async function atualizarClima() {
    try {
        const urlJoao = "https://api.open-meteo.com/v1/forecast?latitude=-25.2917&longitude=-49.2242&current=temperature_2m,is_day,weather_code&timezone=America/Sao_Paulo";
        const urlThamiris = "https://api.open-meteo.com/v1/forecast?latitude=-16.6869&longitude=-49.2648&current=temperature_2m,is_day,weather_code&timezone=America/Sao_Paulo";

        // Usamos allSettled em vez de all. Assim, se uma cidade falhar, a outra ainda carrega!
        const [resJ, resT] = await Promise.allSettled([
            buscarClimaFurtivo(urlJoao),
            buscarClimaFurtivo(urlThamiris)
        ]);

        if (resJ.status === 'fulfilled') {
            const dataJ = resJ.value;
            window.dadosClima.joao = {
                temp: Math.round(dataJ.current.temperature_2m),
                condicao: mapearCodigoWMO(dataJ.current.weather_code),
                eNoite: dataJ.current.is_day === 0
            };
            const tempJoaoUI = document.getElementById("mini-temp-joao");
            if (tempJoaoUI) tempJoaoUI.innerText = `${window.dadosClima.joao.temp}°C`;
        }
        
        if (resT.status === 'fulfilled') {
            const dataT = resT.value;
            window.dadosClima.thamiris = {
                temp: Math.round(dataT.current.temperature_2m),
                condicao: mapearCodigoWMO(dataT.current.weather_code),
                eNoite: dataT.current.is_day === 0
            };
            const tempThamirisUI = document.getElementById("mini-temp-thamiris");
            if (tempThamirisUI) tempThamirisUI.innerText = `${window.dadosClima.thamiris.temp}°C`;
        }

        alternarVisaoClima(window.climaExibido);
        
    } catch (e) {
        console.error("Falha no satélite meteorológico:", e);
        // O Plano B Poético: O design continua intacto mesmo offline!
        const elMensagem = document.getElementById("texto-mensagem-clima");
        if (elMensagem) {
            elMensagem.innerText = "Nuvens densas cobriram o satélite, mas a nossa conexão permanece clara.";
        }
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
// SE FOR UM ITEM DA GAVETA (Ecos, Bussola, Carrossel, Epicentro)
    else if (['ecos', 'bussola', 'carrossel', 'epicentro'].includes(tipo)) {
        const template = document.getElementById(`cartao-${tipo}`);
        if(template) corpo.appendChild(template);
        
        // 🚨 O GATILHO INTELIGENTE: Acorda o motor 3D específico na hora exata
        if (tipo === 'bussola' && typeof inicializarBussola3D === 'function') inicializarBussola3D();
        if (tipo === 'ecos' && typeof inicializarEco3D === 'function') inicializarEco3D();
        if (tipo === 'carrossel' && typeof inicializarCarrossel3D === 'function') inicializarCarrossel3D();
        if (tipo === 'epicentro' && typeof inicializarEpicentro === 'function') inicializarEpicentro();
        if (tipo === 'paradoxo' && typeof inicializarParadoxo === 'function') inicializarParadoxo();
        
        // Desperta os motores 3D que já existiam
        setTimeout(() => window.dispatchEvent(new Event('resize')), 100); 
    }

    modal.classList.remove('escondido');
}; // Fim da função window.abrirReliquia

window.fecharModal = function(apenasLimpar = false) {
    const modal = document.getElementById('modal-reliquia');
    const corpo = document.getElementById('corpo-modal');
    const gaveta = document.getElementById('reliquias-templates');
    
    // 1. EXTINTOR DE ÁUDIO
    const audioSinc = document.getElementById('audio-sincronizado');
    if (audioSinc && !audioSinc.paused) {
        audioSinc.pause();
        if (typeof playAudioJogos === 'function') playAudioJogos(); 
    }
    if (typeof audioReveladoFuturo !== 'undefined' && audioReveladoFuturo) {
        audioReveladoFuturo.pause();
        audioReveladoFuturo = null;
    }

    // 2. EXTINTOR DE CRONÔMETRO
    if (typeof loopRelogioFuturo !== 'undefined' && loopRelogioFuturo) {
        clearInterval(loopRelogioFuturo);
        loopRelogioFuturo = null;
    }
    
    // 3. EXTINTOR DE GPS
    if (window.gpsWatcher !== undefined && window.gpsWatcher !== null) {
        navigator.geolocation.clearWatch(window.gpsWatcher);
        window.gpsWatcher = null;
    }
    
    // 🚨 4. O SALVA-VIDAS ABSOLUTO (Impede a tela de sumir)
    if (gaveta) {
        const reliquiasParaSalvar = ['cartao-ecos', 'cartao-bussola', 'cartao-carrossel', 'cartao-planetario', 'cartao-epicentro'];
        reliquiasParaSalvar.forEach(id => {
            const el = document.getElementById(id);
            if (el) gaveta.appendChild(el); // Joga de volta pra gaveta à força!
        });
    }
    
    if (corpo) corpo.innerHTML = '';
    if (!apenasLimpar && modal) modal.classList.add('escondido');
};

// ==========================================
// GERENCIADOR DE TELAS (MEMÓRIA INTELIGENTE E BLINDADA)
// ==========================================
window.abrirJogo = async function(tipo) {
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
    const jogosContainers = ['termo', 'tribunal', 'sincronia', 'julgamento', 'minifazenda', 'jardim', 'contratos', 'estufa', 'cartorio', 'banco', 'pericia', 'logistica', 'agua', 'agenda', 'roleta', 'guardiao', 'cinema', 'correio', 'pager', 'tesouro'];
    jogosContainers.forEach(jogoId => {
        const el = document.getElementById(`container-${jogoId}`);
        if (el) el.classList.add('escondido');
    });

    // 3. Mostra o container do jogo selecionado e DÁ O GATILHO DE INÍCIO
    const containerAtivo = document.getElementById(`container-${tipo}`);
    if (containerAtivo) {
        
        // 🚨 A TÁTICA DO CAVALO DE TROIA: Se for a Água, NÃO faz o download (fura o antivírus)
        if (tipo !== 'agua') {
            const htmlPronto = await window.injetarModuloHTML(tipo);
            
            // Se a internet cair ou o arquivo não existir, ele aborta e volta pro menu
            if (!htmlPronto) {
                window.voltarMenuJogos();
                return;
            }
        }

        // Se o HTML foi injetado (ou se era a água que já estava lá), ele mostra a tela
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
            const capitalUI = document.getElementById('jardim-moedas');
            if (capitalUI) capitalUI.innerText = window.pontosDoCasal || 0;
            
            // 🚨 A MÁGICA DO 3D: Damos 150ms para a tela existir fisicamente antes de pintar o 3D
            setTimeout(() => {
                if (typeof inicializarPrisma3D === 'function') inicializarPrisma3D();
                if (typeof window.renderizarPlanta === 'function') window.renderizarPlanta();
                
                // Força o recalculo da Placa de Vídeo 3 vezes em tempos diferentes para garantir o encaixe
                window.dispatchEvent(new Event('resize')); 
                setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
                setTimeout(() => window.dispatchEvent(new Event('resize')), 500);
            }, 150); 
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

        else if (tipo === 'agua') {
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

        else if (tipo === 'pager') {
            if (typeof window.inicializarPager === 'function') window.inicializarPager();
        }
        else if (tipo === 'paradoxo') {
            if (typeof window.inicializarParadoxo === 'function') window.inicializarParadoxo();
        }
        // 🚨 ADICIONE O FIO DE IGNIÇÃO DO SATÉLITE EXATAMENTE AQUI:
        else if (tipo === 'tesouro') {
            if (typeof window.inicializarTesouro === 'function') window.inicializarTesouro();
        }
    } // Fim da verificação do containerAtivo
}; // Fim da função window.abrirJogo

window.voltarMenuJogos = function() {
    window.julgamentoAtivo = false; // Trava do Julgamento
    window.defesaAtiva = false; // Trava do Tower Defense

    // 1. Esconde todos os jogos abertos
    const jogosContainers = ['termo', 'tribunal', 'sincronia', 'julgamento', 'minifazenda', 'jardim', 'contratos', 'defesa', 'estufa', 'cartorio', 'banco', 'pericia', 'logistica', 'agua', 'agenda', 'roleta', 'guardiao', 'cinema', 'correio', 'pager', 'tesouro'];
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
    
    // 🚨 CORREÇÃO DA APPLE: Forçando o formato DD/MM/AAAA com zeros
    const d = new Date();
    const hoje = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    
    // Agora a função cuida exclusivamente da liberação visual das relíquias do Cofre
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

    if ("Notification" in window && Notification.permission !== "granted") {
        const btnNotif = document.getElementById('btn-ativar-notificacoes');
        if(btnNotif) btnNotif.classList.remove('escondido');
    } else {
        const btnNotif = document.getElementById('btn-ativar-notificacoes');
        if(btnNotif) btnNotif.classList.add('escondido');
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

            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 200]);
                    }
            
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

// ==========================================
// MURAL DE RECADOS: ENVIO COM NOTIFICAÇÃO
// ==========================================
window.enviarPostit = function() {
    if (!window.SantuarioApp.inicializado || !window.MEU_NOME) return;
    
    const input = document.getElementById('input-postit');
    const texto = input.value.trim();
    if (texto === "") return;

    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const idUnico = Date.now(); 
    const refNovoPostit = ref(db, 'postits/' + idUnico);
    
    // 1. Salva o Post-it no mural
    set(refNovoPostit, {
        autor: window.MEU_NOME,
        mensagem: window.SantuarioCrypto.codificar(texto), 
        timestamp: idUnico,
        fixado: false,
        curtidas: 0
    });

    // 2. 🚨 A MÁGICA DA NOTIFICAÇÃO: Avisa a conta do parceiro que tem mensagem!
    const parceiroId = window.souJoao ? 'thamiris' : 'joao';
    set(ref(db, `notificacoes_postit/${parceiroId}`), {
        temNovo: true,
        timestamp: idUnico
    });

    input.value = ""; 
};

// ==========================================
// LIMPANDO A NOTIFICAÇÃO DO MURAL DE RECADOS
// ==========================================
window.marcarPostitsComoLido = function() {
    const notifEl = document.getElementById('notificacao-postit');
    
    // Só gasta internet para avisar o Firebase se a notificação estiver visível!
    if (notifEl && !notifEl.classList.contains('escondido')) {
        const euId = window.souJoao ? 'joao' : 'thamiris';
        if (window.SantuarioApp && window.SantuarioApp.modulos) {
            const { db, ref, set } = window.SantuarioApp.modulos;
            
            // Avisa o Firebase que você já leu, apagando a luz
            set(ref(db, `notificacoes_postit/${euId}`), {
                temNovo: false,
                timestamp: 0
            });
        }
    }
};

// SUBSTITUA A PARTIR DO EVENTO loginSucesso
window.addEventListener('loginSucesso', async (e) => {
    console.log(`Bem-vindo, ${window.MEU_NOME}. Conectando satélite...`);
    if (window.SantuarioApp && window.SantuarioApp.conectar) {
        window.SantuarioApp.conectar();
    }
});

// 🚨 A MÁGICA PARA O IPHONE APROVAR A NOTIFICAÇÃO
window.ativarNotificacoesApple = async function() {
    const permitido = await solicitarPermissaoNotificacao();
    if (permitido) {
        document.getElementById('btn-ativar-notificacoes').classList.add('escondido');
        salvarTokenFCM();
        if(typeof mostrarToast === 'function') mostrarToast("Satélite sincronizado! Notificações ativas.", "✅");
        if(window.Haptics) window.Haptics.sucesso();
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Permissão negada. Vá nos Ajustes do iPhone.", "❌");
        if(window.Haptics) window.Haptics.erro();
    }
};

async function salvarTokenFCM() {
    if (typeof window.SantuarioApp?.modulos?.messaging === 'undefined') return;

    try {
        const registration = await navigator.serviceWorker.ready;
        const messaging = window.SantuarioApp.modulos.messaging;
        const token = await window.SantuarioApp.modulos.getToken(messaging, {
            vapidKey: 'BMfoiE5OUoxMK970zucUsdMO-X6zPX36rmOwlTKPEp8JTzDZzGbwqm097kQKd_508hZORw-B3AwKC6gRxm5iMjg',
            serviceWorkerRegistration: registration 
        });

        if (token) {
            console.log('Token FCM obtido:', token);
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, `fcmTokens/${window.MEU_NOME.toLowerCase()}`), token);
        }
    } catch (err) {
        console.error('Erro ao obter token FCM:', err);
    }
}

// ==========================================
// REGISTRAR LOGIN COM TRIANGULAÇÃO EXATA (GPS + IP)
// ==========================================
async function registrarLogin(usuario) {
    if (!window.SantuarioApp?.modulos) return;
    const { db, ref, push } = window.SantuarioApp.modulos;
    
    let ipUsuario = "Desconhecido";
    let cidadePeloIP = "Base Desconhecida";
    let coordenadasExatas = "N/A";
    let enderecoDetalhado = "GPS bloqueado ou não autorizado";

// Função blindada para obter IP sem travar o aplicativo
async function obterIP() {
    try {
        // A API ipify não bloqueia por CORS e tem um limite muito maior
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error("Falha na API");
        
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.warn("⚠️ Não foi possível obter o IP (Bloqueio ou Offline). Usando fallback.");
        return "IP_Desconhecido"; // Evita que o Firebase trave o login
    }
}

    // 2. Tenta o Satélite Físico (GPS Exato)
    const obterGPS = () => new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            (err) => resolve(null), // Se ela negar, ele engole o erro e segue em frente
            { enableHighAccuracy: true, timeout: 6000 } // Tenta forçar a melhor antena por 6 segundos
        );
    });

    // Dispara as duas sondas ao mesmo tempo
    const [dadosIP, coords] = await Promise.all([obterIP(), obterGPS()]);

    // Processa os dados do IP
    if (dadosIP) {
        ipUsuario = dadosIP.ip || "Desconhecido";
        if (dadosIP.city && dadosIP.region) {
            cidadePeloIP = `${dadosIP.city}, ${dadosIP.region}`;
        }
    }

    // 3. A MÁGICA: Se o GPS funcionou, traduzimos a coordenada para RUA E BAIRRO
    if (coords) {
        coordenadasExatas = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
        
        try {
            // O satélite OpenStreetMap faz o "Reverse Geocoding" gratuitamente
            // A assinatura (&email=...) garante que o satélite gratuito não bloqueie a nossa requisição.
const urlGeo = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1&email=joaohenriquesmtk@gmail.com`;
            const resGeo = await fetch(urlGeo);
            
            if (resGeo.ok) {
                const dadosEnd = await resGeo.json();
                if (dadosEnd && dadosEnd.address) {
                    const rua = dadosEnd.address.road || dadosEnd.address.pedestrian || "Rua não mapeada";
                    const bairro = dadosEnd.address.suburb || dadosEnd.address.neighbourhood || "Bairro desconhecido";
                    const cidade = dadosEnd.address.city || dadosEnd.address.town || "";
                    
                    enderecoDetalhado = `${rua}, ${bairro} - ${cidade}`.replace(/^, |, $/g, '').trim();
                }
            }
        } catch (e) {
            enderecoDetalhado = "Coordenadas capturadas, mas falha ao ler o mapa das ruas.";
        }
    }

    // 4. Grava tudo no Diário de Bordo do Firebase
    const loginsRef = ref(db, 'logins');
    push(loginsRef, {
        usuario: usuario,
        data_acesso: new Date().toLocaleString('pt-BR'),
        timestamp: Date.now(),
        ip: ipUsuario,
        cidade_rastreada: cidadePeloIP,
        coordenadas_gps: coordenadasExatas,
        endereco_exato: enderecoDetalhado
    }).catch(error => console.error('Erro ao registrar login espacial:', error));
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
    // 🚨 CORREÇÃO: Removemos a trava. Agora AMBOS geram e salvam seus tokens!
    if (typeof window.SantuarioApp?.modulos?.messaging === 'undefined') {
        console.log('Messaging não disponível');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        console.log('Service Worker ativo, obtendo token FCM...');

        const messaging = window.SantuarioApp.modulos.messaging;
        const token = await window.SantuarioApp.modulos.getToken(messaging, {
            vapidKey: 'BMfoiE5OUoxMK970zucUsdMO-X6zPX36rmOwlTKPEp8JTzDZzGbwqm097kQKd_508hZORw-B3AwKC6gRxm5iMjg',
            serviceWorkerRegistration: registration 
        });

        if (token) {
            console.log('Token FCM obtido com sucesso!');
            const { db, ref, set } = window.SantuarioApp.modulos;
            // Salva o token na pasta correta dependendo de quem logou (joao ou thamiris)
            await set(ref(db, `fcmTokens/${window.MEU_NOME.toLowerCase()}`), token);
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
            if (window.Haptics && navigator.vibrate && diferenca > -2000) {
                navigator.vibrate([100, 50, 100]); 
            }
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
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 100, 50]);
                    }
        
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
// EXPANSÃO 1: RADAR DE TELEPRESENÇA VIVO (COM SINESTESIA)
// ==========================================
let loopVibracaoRadar = null;

// Quando você aperta o dedo na tela
window.iniciarPulsoRadar = function(e) {
    if (e && e.cancelable) e.preventDefault(); // Proteção contra travamento de tela do iOS
    if (!window.SantuarioApp) return;
    
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    // 🚨 Chave estrita para evitar bugs de acentuação no banco de dados
    const minhaChave = window.souJoao ? 'joao' : 'thamiris';
    const meuRadarRef = ref(db, 'telepresenca/' + minhaChave);
    
    // Manda o sinal luminoso "ONLINE/PULSANDO"
    set(meuRadarRef, { pulsando: true, timestamp: Date.now() });
    
    // Dá um feedback visual e tátil imediato para quem está enviando
    const containerRadar = document.getElementById('radar-telepresenca');
    if (containerRadar) containerRadar.style.transform = 'scale(0.9)'; // O botão afunda
    if (window.Haptics) window.Haptics.toqueLeve(); 
};

// Quando você tira o dedo da tela
window.pararPulsoRadar = function(e) {
    if (e && e.cancelable) e.preventDefault();
    if (!window.SantuarioApp) return;
    
    const { db, ref, set } = window.SantuarioApp.modulos;
    const minhaChave = window.souJoao ? 'joao' : 'thamiris';
    const meuRadarRef = ref(db, 'telepresenca/' + minhaChave);
    
    // Desliga o sinal luminoso
    set(meuRadarRef, { pulsando: false, timestamp: Date.now() });
    
    const containerRadar = document.getElementById('radar-telepresenca');
    if (containerRadar) containerRadar.style.transform = 'scale(1)'; // O botão volta ao normal
};

// O Ouvido Constante (Escuta o parceiro 24 horas por dia)
window.escutarRadarParceiro = function() {
    if (!window.SantuarioApp) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const chaveParceiro = window.souJoao ? 'thamiris' : 'joao';
    const radarParceiroRef = ref(db, 'telepresenca/' + chaveParceiro);
    
    onValue(radarParceiroRef, (snapshot) => {
        const dados = snapshot.val();
        const containerRadar = document.getElementById('radar-telepresenca');
        
        if (dados && dados.pulsando) {
            // O PARCEIRO APERTOU O DEDO LÁ DO OUTRO LADO!
            if (containerRadar) containerRadar.classList.add('radar-recebendo');
            
            // Inicia o motor de batimento (100 BPM)
            if (!loopVibracaoRadar) {
                
                // 🚨 A MÁGICA: Dispara o grave e o flash visual imediatamente
                if (typeof window.dispararEfeitoCoracao === 'function') {
                    window.dispararEfeitoCoracao(containerRadar);
                }
                
                // Repete a sinestesia audiovisual enquanto o parceiro segurar o botão
                loopVibracaoRadar = setInterval(() => {
                    if (typeof window.dispararEfeitoCoracao === 'function') {
                        window.dispararEfeitoCoracao(containerRadar);
                    }
                }, 800); 
            }
        } else {
            // O PARCEIRO SOLTOU O DEDO
            if (containerRadar) containerRadar.classList.remove('radar-recebendo');
            
            if (loopVibracaoRadar) {
                clearInterval(loopVibracaoRadar); // Desliga a bateria de grave
                loopVibracaoRadar = null;
            }
        }
    });
};

// ==========================================
// OLHEIRO INTELIGENTE: OCULTA O RADAR E BOTÕES GLOBAIS
// ==========================================
window.addEventListener('load', () => {
    const radar = document.getElementById('radar-telepresenca');
    const btnMutar = document.getElementById('btn-mutar-global'); // 🚨 Olheiro agora vigia o botão de mudo
    const modalReliquia = document.getElementById('modal-reliquia');
    const telaLogin = document.getElementById('tela-login');
    
    const verificarVisibilidadeElementos = () => {
        const emJogo = document.body.classList.contains('modo-jogo-ativo');
        const emReliquia = modalReliquia && !modalReliquia.classList.contains('escondido');
        const noLogin = telaLogin && telaLogin.style.display !== 'none'; // Verifica se está na tela de carregamento/senha
        
        // Se estiver em jogo, lendo relíquia, ou na tela de login: ESCONDE TUDO
        if (emJogo || emReliquia || noLogin) {
            if (radar) radar.style.display = 'none'; 
            if (btnMutar) btnMutar.style.display = 'none'; 
        } else {
            // Se já logou e está livre pelo app: MOSTRA OS BOTÕES
            if (radar) radar.style.display = 'flex'; 
            if (btnMutar) btnMutar.style.display = 'flex'; 
        }
    };

    // Vigia as mudanças de classe no Body (quando ela entra e sai dos jogos)
    const observerBody = new MutationObserver(verificarVisibilidadeElementos);
    observerBody.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Vigia as Relíquias (Cápsula, Espelho, etc)
    if (modalReliquia) {
        const observerModal = new MutationObserver(verificarVisibilidadeElementos);
        observerModal.observe(modalReliquia, { attributes: true, attributeFilter: ['class'] });
    }
    
    // Vigia o Login (Para fazer os botões brotarem no exato milissegundo em que a senha é aceita)
    if (telaLogin) {
        const observerLogin = new MutationObserver(verificarVisibilidadeElementos);
        observerLogin.observe(telaLogin, { attributes: true, attributeFilter: ['style'] });
    }

    // Faz a checagem inicial da tela e uma checagem de segurança após a animação da logo (splash) terminar
    verificarVisibilidadeElementos();
    setTimeout(verificarVisibilidadeElementos, 3000); 
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
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 100, 50]);
                    }
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
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200, 50, 300]);
                    }
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
    if (window.Haptics && navigator.vibrate) {
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
    // 🚨 FALLBACK DE SEGURANÇA PARA O IPHONE DELA: Se o window.MEU_NOME sumir, pega do login!
    const eu = window.MEU_NOME || (window.souJoao ? 'João' : 'Thamiris');
    const parceiro = window.NOME_PARCEIRO || (window.souJoao ? 'Thamiris' : 'João');

    if (!window.SantuarioApp || !eu || !parceiro) return;
    
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
    if (tagNomeParceiro) tagNomeParceiro.innerText = `A alma de ${parceiro}`;
    
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    // Ouve especificamente o diretório da data de hoje!
    const refEspelho = ref(db, `espelho_alma/${stringData}`);
    
    onValue(refEspelho, (snapshot) => {
        const dados = snapshot.val() || {};
        
        // 🚨 Busca ignorando maiúsculas e minúsculas com segurança
        const minhaResposta = dados[eu.toLowerCase()];
        const respostaDela = dados[parceiro.toLowerCase()];
        
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
                if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200, 50, 300]);
                    }
                if (typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff', '#3498db'], particleCount: 150, spread: 120, zIndex: 1000});
            }
        } else if (minhaResposta && !respostaDela) {
            // ESTADO 2.A: SÓ EU RESPONDI E ESTOU AGUARDANDO
            if(boxResponder) boxResponder.classList.add('escondido');
            if(boxAguardando) boxAguardando.classList.remove('escondido');
            if(boxRevelado) boxRevelado.classList.add('escondido');
            document.getElementById('texto-aguardando-espelho').innerText = `A sua verdade foi gravada. Aguardando ${parceiro} responder em Goiânia para que o espelho se estilhace... 🔒`;
        } else if (!minhaResposta && respostaDela) {
            // ESTADO 2.B: SÓ ELA RESPONDEU (A PRESSÃO PSICOLÓGICA!)
            if(boxResponder) boxResponder.classList.remove('escondido');
            if(boxAguardando) boxAguardando.classList.remove('escondido');
            if(boxRevelado) boxRevelado.classList.add('escondido');
            document.getElementById('texto-aguardando-espelho').innerHTML = `<span style="color: #ff9ff3; font-weight:bold; font-size:1.1rem;">✨ ${parceiro} já respondeu!</span><br>O espelho agora aguarda a sua resposta para ser revelado.`;
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
    
    // 🚨 Usa a mesma trava de segurança de nome
    const eu = window.MEU_NOME || (window.souJoao ? 'João' : 'Thamiris');
    
    const payload = {};
    payload[eu.toLowerCase()] = resposta;
    
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
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 50, 30]);
                    }
        }).catch(err => {
            console.error("Erro ao atualizar Jornada:", err);
        });
    });
};

// O GATILHO MÁGICO: Garante que a função acorde sozinha quando o app carregar!
window.addEventListener('load', () => {
    setTimeout(window.escutarRotaDestino, 1000);
});


// ==========================================
// A NONA RELÍQUIA: O PONTO ZERO (GPS DETECTOR - VERSÃO DE LANÇAMENTO)
// ==========================================
window.gpsWatcher = null;

window.inicializarEpicentro = function() {
    const painelBloqueado = document.getElementById('epicentro-bloqueado');
    const painelDesbloqueado = document.getElementById('epicentro-desbloqueado');
    const txtDistancia = document.getElementById('distancia-epicentro');
    const pontoRadar = document.getElementById('ponto-alvo-radar');

    // Trava Eterna: Se a distância já zerou, o modal fica destrancado como um troféu!
    if (localStorage.getItem('epicentro_destravado') === 'sim') {
        if(painelBloqueado) painelBloqueado.classList.add('escondido');
        if(painelDesbloqueado) painelDesbloqueado.classList.remove('escondido');
        return;
    }

    if (!window.SantuarioApp || !window.MEU_NOME || !window.NOME_PARCEIRO) {
        if(txtDistancia) txtDistancia.innerText = "Nuvem Offline";
        return;
    }

    const { db, ref, set, onValue } = window.SantuarioApp.modulos;
    const meuGpsRef = ref(db, `gps/${window.MEU_NOME.toLowerCase()}`);
    const parceiroGpsRef = ref(db, `gps/${window.NOME_PARCEIRO.toLowerCase()}`);

    let parceiroLat = null;
    let parceiroLon = null;
    let minhaLat = null;
    let minhaLon = null;

    // Fica ouvindo onde ela está na nuvem em tempo real
    onValue(parceiroGpsRef, (snap) => {
        const dados = snap.val();
        if (dados) {
            parceiroLat = dados.lat;
            parceiroLon = dados.lon;
            calcularColisao();
        }
    });

    // Aciona o chip de GPS do celular
    if (navigator.geolocation) {
        window.gpsWatcher = navigator.geolocation.watchPosition((pos) => {
            minhaLat = pos.coords.latitude;
            minhaLon = pos.coords.longitude;
            
            // Grava a sua posição na nuvem para o celular dela ler
            set(meuGpsRef, { lat: minhaLat, lon: minhaLon, timestamp: Date.now() });
            calcularColisao();
            
        }, (err) => {
            if(txtDistancia) txtDistancia.innerText = "GPS Recusado";
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 });
    } else {
        if(txtDistancia) txtDistancia.innerText = "Satélite Indisponível";
    }

    function calcularColisao() {
        // Se falta o GPS de um dos dois, aguarda educadamente
        if (!parceiroLat || !minhaLat) {
            if(txtDistancia && !txtDistancia.innerText.includes("KM") && !txtDistancia.innerText.includes("M")) {
                txtDistancia.innerText = "Aguardando Alvo...";
            }
            return;
        }

        // Matemática Esférica de Haversine (Precisão Militar)
        const R = 6371; 
        const dLat = (parceiroLat - minhaLat) * (Math.PI/180);
        const dLon = (parceiroLon - minhaLon) * (Math.PI/180);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(minhaLat * (Math.PI/180)) * Math.cos(parceiroLat * (Math.PI/180)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distanciaMetros = (R * c) * 1000;

        // Animação do Radar
        if (pontoRadar) {
            let raioVisual = Math.min(distanciaMetros / 100000, 1) * 45; 
            let anguloRad = Date.now() / 1000; 
            let posX = 50 + (Math.cos(anguloRad) * raioVisual);
            let posY = 50 + (Math.sin(anguloRad) * raioVisual);
            pontoRadar.style.left = `${posX}%`;
            pontoRadar.style.top = `${posY}%`;
        }

        // 🚨 O GATILHO DA COLISÃO FÍSICA (15 METROS DE DISTÂNCIA)
        if (distanciaMetros <= 15) {
            if(txtDistancia) txtDistancia.innerText = "0.00 M";
            // Desliga a antena GPS para economizar bateria instantaneamente
            if (window.gpsWatcher !== null) navigator.geolocation.clearWatch(window.gpsWatcher);
            desbloquearEpicentro();
        } else {
            // Exibe a distância real em tela
            if (distanciaMetros > 1000) {
                if(txtDistancia) txtDistancia.innerText = (distanciaMetros/1000).toFixed(1) + " KM";
            } else {
                if(txtDistancia) txtDistancia.innerText = distanciaMetros.toFixed(0) + " M";
            }
        }
    }

    function desbloquearEpicentro() {
        // Grava na memória do celular que o encontro aconteceu
        localStorage.setItem('epicentro_destravado', 'sim');
        
        if(painelBloqueado) painelBloqueado.classList.add('escondido');
        if(painelDesbloqueado) {
            painelDesbloqueado.classList.remove('escondido');
            
            // O celular treme e explode em ouro
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300, 100, 500, 200, 800]);
                    }
            if (typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], particleCount: 300, spread: 200, gravity: 1.5, zIndex: 10000});
            
            // Dá o Play no vídeo automaticamente
            const vid = document.getElementById('video-reencontro');
            if (vid) vid.play().catch(e => console.log('Autoplay bloqueado', e));
        }
    }
};


// ==========================================
// CONTROLE DE TELA CHEIA: O PRISMA (PARADOXO)
// ==========================================
window.ativarSensorParadoxo = function() {
    const txtSuperficie = document.getElementById('texto-superficie');
    const txtProfundo = document.getElementById('texto-profundo');
    const valZ = document.getElementById('valor-z');
    
    // 🚨 A CORREÇÃO: Agora ele olha para a Tela Cheia (container-paradoxo)
    const container = document.getElementById('container-paradoxo');

    const analisarInclinacao = (event) => {
        // 🚨 A MÁGICA: Se a tela cheia estiver fechada (escondida), poupa a bateria. Se estiver aberta, o sensor trabalha livremente!
        if (!container || container.classList.contains('escondido')) return;

        let beta = event.beta;   // Inclinação frente/trás (-180 a 180)
        let gamma = event.gamma; // Inclinação esquerda/direita (-90 a 90)
        
        if (beta === null || gamma === null) return;

        let absBeta = Math.abs(beta);
        let inclinacaoVertical = absBeta > 90 ? 180 - absBeta : absBeta;
        let inclinacaoHorizontal = Math.abs(gamma);

        let inclinacaoAbsoluta = Math.max(inclinacaoVertical, inclinacaoHorizontal);
        let progresso = 0; 
        
        if (inclinacaoAbsoluta < 20) {
            progresso = 1; 
        } else if (inclinacaoAbsoluta > 45) {
            progresso = 0; 
        } else {
            progresso = 1 - ((inclinacaoAbsoluta - 20) / 25);
        }

        if (txtSuperficie && txtProfundo) {
            txtSuperficie.style.opacity = 1 - progresso;
            txtSuperficie.style.filter = `blur(${progresso * 10}px)`;

            txtProfundo.style.opacity = progresso;
            txtProfundo.style.filter = `blur(${(1 - progresso) * 10}px)`;
        }

        if (valZ) {
            valZ.innerText = inclinacaoAbsoluta.toFixed(1) + '°';
            valZ.style.color = progresso > 0.8 ? '#ff3366' : '#555';
        }
        
        if (progresso > 0.95 && !window.paradoxoRevelado) {
            window.paradoxoRevelado = true;
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([40, 60, 40]);
                    }
        } else if (progresso < 0.5) {
            window.paradoxoRevelado = false;
        }
    };

    window.addEventListener('deviceorientation', analisarInclinacao, true);
};

window.fecharParadoxoTelaCheia = function() {
    const container = document.getElementById('container-paradoxo');
    const navInferior = document.querySelector('.menu-inferior');
    
    // Restaura a interface
    if (container) container.classList.add('escondido');
    if (navInferior) navInferior.classList.remove('escondido');
    document.body.classList.remove('modo-jogo-ativo');
};

// ==========================================
// GERENTE MÁXIMO DE ÁUDIO (SISTEMA ANTI-MUDO E ANTI-DUPLICAÇÃO)
// ==========================================
window.musicaNossaTocando = false; // Trava de segurança para a música do Cofre

window.playAudioJogos = function() {
    if (window.musicaNossaTocando) return; // Se a "Nossa Trilha" do cofre estiver tocando, respeita o silêncio
    
    if (!audioJogos) {
        audioJogos = document.getElementById('audio-jogos');
        if (!audioJogos) return;
    }
    
    // 🚨 A MÁGICA SALVADORA: Tiramos do 0.0 (Mudo) e colocamos em 40% (0.4) 
    // Fica perfeito como música de fundo sem atrapalhar os toques!
    audioJogos.volume = 0.3; 
    
    if (audioJogos.paused) {
        // Tenta tocar. A Apple e o Google exigem que a pessoa toque na tela pelo menos uma vez antes do som sair.
        audioJogos.play().catch(e => console.log('O navegador vai liberar o som assim que a tela for tocada.'));
    }
};

window.pauseAudioJogos = function() {
    if (audioJogos && !audioJogos.paused) {
        audioJogos.pause();
    }
};

// Redireciona os comandos antigos para o nosso novo motor perfeito
window.tocarAmbiente = window.playAudioJogos;
window.pausarAmbiente = window.pauseAudioJogos;


// ============================================================================
// VERSÃO 2.0: MOTOR DE SINCRONIA DE SONO QUÂNTICO (WAKE LOCK + REALTIME DB)
// Padrão Elite: Zero Erros.
// ============================================================================

window.estadoMeuSono = false;
window.estadoSonoDela = false;
let wakeLockSono = null;
let loopRelogioSono = null;

// Tenta manter a tela do celular acesa durante a noite (API moderna)
async function travarTelaAcordada() {
    try {
        if ('wakeLock' in navigator) {
            wakeLockSono = await navigator.wakeLock.request('screen');
            console.log('Wake Lock ativado: A tela não vai apagar.');
        }
    } catch (err) {
        console.log(`Wake Lock falhou ou não suportado: ${err.name}, ${err.message}`);
    }
}

function liberarTela() {
    if (wakeLockSono !== null) {
        wakeLockSono.release().then(() => { wakeLockSono = null; });
    }
}

window.escutarEstadoSono = function() {
    if (!window.SantuarioApp || !window.NOME_PARCEIRO || !window.MEU_NOME) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    const refSonoDela = ref(db, `estado_sono/${window.NOME_PARCEIRO.toLowerCase()}`);
    
    // Escuta em tempo real o que acontece na cama dela
    onValue(refSonoDela, (snapshot) => {
        const dados = snapshot.val();
        window.estadoSonoDela = dados && dados.dormindo ? true : false;
        atualizarPainelSonoHome(dados);
        atualizarCenaSono3D();
    });
};

function atualizarPainelSonoHome(dadosParceiro) {
    const dotMeu = document.getElementById('status-meu-sono');
    const dotDela = document.getElementById('status-sono-dela');
    const txtStatus = document.getElementById('texto-status-sono-parceiro');
    const btn = document.getElementById('btn-toggle-sono');
    
    if (!dotMeu || !dotDela || !txtStatus || !btn) return;

    // Atualiza a luz dos Dots na Home (Obedece ao Tema na fase individual)
    if (window.estadoMeuSono) {
        dotMeu.className = 'orbe-sono-ativo';
        btn.innerText = "Despertar";
        btn.style.background = "rgba(255,255,255,0.1)";
        btn.style.color = "#fff";
        btn.style.borderColor = "#aaa";
    } else {
        dotMeu.className = '';
        dotMeu.style.background = '#444';
        dotMeu.style.boxShadow = 'inset 0 0 5px #000';
        btn.innerText = `Deitar ao lado de ${window.NOME_PARCEIRO}`;
        btn.style.background = "transparent";
        btn.style.color = "var(--cor-primaria)";
        btn.style.borderColor = "var(--cor-primaria)";
    }

    if (window.estadoSonoDela) {
        dotDela.className = 'orbe-sono-ativo';
    } else {
        dotDela.className = '';
        dotDela.style.background = '#444';
        dotDela.style.boxShadow = 'inset 0 0 5px #000';
    }

    // A Lógica Textual Emocional
    if (window.estadoMeuSono && window.estadoSonoDela) {
        // 🚨 O RETORNO DO ROXO NA HOME
        txtStatus.innerHTML = `<span style="color: #cda8ff; font-weight: bold; text-shadow: 0 0 8px rgba(205,168,255,0.6);">Sincronia Neural Atingida.</span>`;
    } else if (window.estadoSonoDela) {
        const tempo = dadosParceiro && dadosParceiro.timestamp ? Math.floor((Date.now() - dadosParceiro.timestamp) / 60000) : 0;
        let horas = Math.floor(tempo / 60);
        let mins = tempo % 60;
        let tempoStr = horas > 0 ? `${horas}h e ${mins}m` : `${mins} min`;
        
        // Fase individual continua respeitando o tema
        txtStatus.innerHTML = `<span style="color: var(--cor-primaria);">${window.NOME_PARCEIRO} dorme há ${tempoStr}.</span>`;
    } else {
        txtStatus.innerText = `Aguardando a noite cair...`;
    }
}

function atualizarCenaSono3D() {
    const tela = document.getElementById('tela-modo-sono');
    const orbeMeu = document.getElementById('orbe-sono-meu');
    const orbeDela = document.getElementById('orbe-sono-dela');
    const txtGuia = document.getElementById('texto-guia-sono');
    
    if (!tela || tela.classList.contains('escondido')) return;

    if (window.estadoSonoDela) {
        orbeDela.style.opacity = '1';
        orbeDela.classList.add('anim-respirar');
        
        // Fusão perfeita no centro da tela
        orbeMeu.style.transform = 'translateX(-15px)';
        orbeDela.style.transform = 'translateX(15px)';
        
        // 🚨 A TELA ENTRA NO MODO ROXO
        tela.classList.add('sincronia-perfeita-bg');
        txtGuia.innerHTML = "Nossas mentes estão conectadas no espaço.<br><span style='font-size:1.2rem; color:#cda8ff; text-shadow:0 0 15px rgba(205,168,255,0.8); display:block; margin-top:8px;'>Durma bem, meu amor.</span>";
        
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 50, 30, 50, 100]);
                    }
    } else {
        orbeDela.style.opacity = '0';
        orbeDela.classList.remove('anim-respirar');
        orbeMeu.style.transform = 'translateX(0)';
        
        // A TELA RESPEITA O TEMA INDIVIDUAL
        tela.classList.remove('sincronia-perfeita-bg');
        txtGuia.innerHTML = "Feche os olhos.<br>Eu estou aqui cuidando de você.";
    }
}

window.alternarModoSono = function() {
    const { db, ref, set } = window.SantuarioApp.modulos;
    const tela = document.getElementById('tela-modo-sono');
    const audioLoFi = document.getElementById('audio-resgate-lofi'); 
    const orbeMeu = document.getElementById('orbe-sono-meu');
    
    window.estadoMeuSono = !window.estadoMeuSono;
    
    set(ref(db, `estado_sono/${window.MEU_NOME.toLowerCase()}`), {
        dormindo: window.estadoMeuSono,
        timestamp: Date.now()
    }).catch(err => console.error("Falha ao sincronizar sono:", err));

    if (window.estadoMeuSono) {
        if(window.Haptics) window.Haptics.toqueForte();
        travarTelaAcordada();
        
        document.body.classList.add('modo-jogo-ativo'); 
        tela.classList.remove('escondido');
        orbeMeu.classList.add('anim-respirar');
        
        if(typeof window.pauseAudioJogos === 'function') window.pauseAudioJogos();
        if(audioLoFi) {
            audioLoFi.volume = 0.15; 
            audioLoFi.play().catch(e => console.log(e));
        }

        const tempoStart = Date.now();
        const txtTempo = document.getElementById('texto-tempo-sono');
        loopRelogioSono = setInterval(() => {
            const mins = Math.floor((Date.now() - tempoStart) / 60000);
            const hrs = Math.floor(mins / 60);
            const m = mins % 60;
            if(txtTempo) txtTempo.innerText = `EM REPOUSO PROFUNDO: ${hrs}H ${m}M`;
        }, 60000);
        if(txtTempo) txtTempo.innerText = `EM REPOUSO PROFUNDO: 0H 0M`;

        atualizarCenaSono3D();

    } else {
        if(window.Haptics) window.Haptics.sucesso();
        liberarTela();
        
        document.body.classList.remove('modo-jogo-ativo');
        tela.classList.add('escondido');
        orbeMeu.classList.remove('anim-respirar');
        if(audioLoFi) audioLoFi.pause();
        if(loopRelogioSono) clearInterval(loopRelogioSono);
        
        if(typeof window.playAudioJogos === 'function') window.playAudioJogos();
    }
    
    atualizarPainelSonoHome();
};

// GATILHO AUTOMÁTICO: Acorda o radar logo que o sistema der boot
window.addEventListener('loginSucesso', () => {
    setTimeout(window.escutarEstadoSono, 2000); 
});

// ============================================================================
// MOTOR DE REALIDADE AUMENTADA (Holograma 3D)
// ============================================================================

window.abrirHolograma = function() {
    const container = document.getElementById('ar-container');
    if (!container) return;

    // Pausa a música ambiente para a pessoa focar na câmera
    if(typeof window.pauseAudioJogos === 'function') window.pauseAudioJogos();
    
    document.body.classList.add('modo-jogo-ativo'); // Esconde o menu inferior
    container.classList.remove('escondido');
    
    if(window.Haptics) window.Haptics.sucesso();
};

window.fecharHolograma = function() {
    const container = document.getElementById('ar-container');
    if (container) container.classList.add('escondido');
    
    document.body.classList.remove('modo-jogo-ativo');
    
    // Retoma a música
    if(typeof window.playAudioJogos === 'function') window.playAudioJogos();
    
    if(window.Haptics) window.Haptics.toqueLeve();
};

// ============================================================================
// 🌌 MOTOR QUÂNTICO: O PONTO DE SINGULARIDADE (TOQUE EM TEMPO REAL)
// ============================================================================
let singularidadeLoop = null;
let dbToqueRef = null;
let listenerSingularidade = null;
let meuRastro = [];
let rastroDela = [];

// Anexa a função diretamente no window para garantir que o HTML sempre a encontre
window.iniciarToqueFantasma = function() {
    const container = document.getElementById('container-fantasma');
    if (!container) return;
    
    // Prepara a tela e pausa o áudio de fundo, se houver
    if(typeof window.pauseAudioJogos === 'function') window.pauseAudioJogos();
    document.body.classList.add('modo-jogo-ativo');
    container.classList.remove('escondido');
    container.style.display = 'block';
    
    const canvas = document.getElementById('canvas-calor');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Ajusta resolução dinâmica (Otimizado para iPhone)
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const { db, ref, onValue, set } = window.SantuarioApp.modulos;
    
    // 🚨 CHAVES ESTRITAS: Sem acentos para garantir que os celulares se encontrem no Firebase
    const minhaChave = window.souJoao ? 'joao' : 'thamiris';
    const chaveParceiro = window.souJoao ? 'thamiris' : 'joao';
    const nomeParceiroUI = window.souJoao ? 'Thamiris' : 'João';
    const pronome = window.souJoao ? 'Ela' : 'Ele';
    
    dbToqueRef = ref(db, 'singularidade_ativa');
    
    // Limpa o rastro atual ao entrar
    set(ref(db, `singularidade_ativa/${minhaChave}`), { x: -100, y: -100, ativo: false });
    
    // Escuta os movimentos do parceiro em tempo real
    listenerSingularidade = onValue(dbToqueRef, (snapshot) => {
        const dados = snapshot.val();
        if (!dados) return;
        
        const pDados = dados[chaveParceiro];
        const texto = document.getElementById('texto-fantasma');
        
        if (pDados && pDados.ativo) {
            if (texto) {
                texto.innerText = `Conexão Quântica. ${pronome} está tocando a tela agora.`;
                texto.style.color = "#00f2fe"; // Azul vibrante
                texto.style.textShadow = "0 0 20px #00f2fe";
            }
            // Mapeia a posição do parceiro para a proporção local da tela
            rastroDela.push({ x: pDados.x * canvas.width, y: pDados.y * canvas.height, alpha: 1.0 });
        } else {
            if (texto) {
                texto.innerText = `Aguardando a presença de ${nomeParceiroUI}...`;
                texto.style.color = "#fff";
                texto.style.textShadow = "0 0 10px rgba(255,255,255,0.5)";
            }
        }
    });

    // 🚨 LIMITADOR DE DADOS (Throttling) para não estrangular o Firebase
    let ultimoEnvioFirebase = 0;
    const enviarPosicao = (x, y, ativo) => {
        const agora = Date.now();
        
        // Salva visualmente na tela na mesma hora
        if (ativo) meuRastro.push({ x, y, alpha: 1.0 });
        
        // Envia para a nuvem apenas a cada 40ms
        if (agora - ultimoEnvioFirebase > 40 || !ativo) {
            const px = x / canvas.width;
            const py = y / canvas.height;
            set(ref(db, `singularidade_ativa/${minhaChave}`), { x: px, y: py, ativo: ativo });
            ultimoEnvioFirebase = agora;
        }
    };

    // Eventos de Toque Limpos
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const iniciarToque = (e) => {
        if(e.cancelable) e.preventDefault();
        const pos = getPos(e);
        enviarPosicao(pos.x, pos.y, true);
        if(window.Haptics && window.Haptics.toqueLeve) window.Haptics.toqueLeve();
    };

    const moverToque = (e) => {
        if(e.cancelable) e.preventDefault();
        const pos = getPos(e);
        enviarPosicao(pos.x, pos.y, true);
    };

    const finalizarToque = (e) => {
        if(e.cancelable) e.preventDefault();
        enviarPosicao(-100, -100, false);
    };

    // Aplica os eventos (Touch e Mouse)
    canvas.onmousedown = iniciarToque;
    canvas.onmousemove = (e) => { if(e.buttons > 0) moverToque(e); };
    canvas.onmouseup = finalizarToque;
    canvas.onmouseleave = finalizarToque;

    canvas.ontouchstart = iniciarToque;
    canvas.ontouchmove = moverToque;
    canvas.ontouchend = finalizarToque;
    canvas.ontouchcancel = finalizarToque;

    // Motor de Renderização (60 FPS)
    const corMinha = window.souJoao ? 'rgba(52, 152, 219,' : 'rgba(255, 51, 102,'; 
    const corDela = window.souJoao ? 'rgba(255, 51, 102,' : 'rgba(52, 152, 219,';

    const desenhar = () => {
        // Efeito de "rastro" que some aos poucos
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Meu rastro
        meuRastro.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
            ctx.fillStyle = `${corMinha} ${p.alpha})`;
            ctx.fill();
            p.alpha -= 0.03; 
        });

        // Rastro dela e a Lógica de Colisão Quântica
        rastroDela.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
            ctx.fillStyle = `${corDela} ${p.alpha})`;
            ctx.fill();
            
            // Se os rastros se tocarem, gera um clarão branco!
            meuRastro.forEach(mp => {
                const dist = Math.hypot(p.x - mp.x, p.y - mp.y);
                if (dist < 40 && p.alpha > 0.5 && mp.alpha > 0.5) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 45, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
                    ctx.fill();
                }
            });

            p.alpha -= 0.03;
        });

        // Limpa a memória das bolinhas invisíveis
        meuRastro = meuRastro.filter(p => p.alpha > 0);
        rastroDela = rastroDela.filter(p => p.alpha > 0);

        singularidadeLoop = requestAnimationFrame(desenhar);
    };
    
    desenhar();
};

window.fecharToqueFantasma = function() {
    const container = document.getElementById('container-fantasma');
    if (container) {
        container.classList.add('escondido');
        container.style.display = 'none';
    }
    document.body.classList.remove('modo-jogo-ativo');
    
    // Mata a animação pesada
    if (singularidadeLoop) cancelAnimationFrame(singularidadeLoop);
    
    // Limpa meu dedo no banco
    if (window.SantuarioApp && window.SantuarioApp.modulos) {
        const { db, set, ref } = window.SantuarioApp.modulos;
        const minhaChave = window.souJoao ? 'joao' : 'thamiris';
        set(ref(db, `singularidade_ativa/${minhaChave}`), { x: -100, y: -100, ativo: false });
    }
    
    // 🚨 DESCONECTA O OUVINTE! Para o Firebase parar de puxar a sua internet.
    if (listenerSingularidade) {
        listenerSingularidade(); 
    }
    
    meuRastro = [];
    rastroDela = [];
    
    if(typeof window.playAudioJogos === 'function') window.playAudioJogos();
};


// ============================================================================
// MOTOR DO PALCO DIMENSIONAL (SWIPE HORIZONTAL COM SINCRONIA DE BOLINHAS)
// ============================================================================

window.inicializarPalcoDimensional = function() {
    const trilho = document.getElementById('palco-trilho');
    const paginacao = document.getElementById('palco-paginacao');
    
    // Se não estiver na tela principal, não executa
    if (!trilho || !paginacao) return;

    const slides = trilho.querySelectorAll('.palco-slide');
    const quantidadeSlides = slides.length;
    
    // Limpa a paginação anterior por garantia
    paginacao.innerHTML = '';
    
    // Gera as bolinhas dinamicamente
    for (let i = 0; i < quantidadeSlides; i++) {
        const dot = document.createElement('div');
        // A primeira bolinha já nasce ativa
        dot.className = 'palco-dot' + (i === 0 ? ' ativo' : '');
        
        // Torna a bolinha clicável: tocando nela, o app desliza suavemente até o slide
        dot.onclick = () => {
            const larguraSlide = trilho.clientWidth;
            trilho.scrollTo({ left: i * larguraSlide, behavior: 'smooth' });
        };
        paginacao.appendChild(dot);
    }

    // Monitora o movimento do dedo (Scroll Magnético)
    trilho.addEventListener('scroll', () => {
        // Divide o pixel atual pela largura da tela para saber exatamente em qual "página" estamos
        const indexAtivo = Math.round(trilho.scrollLeft / trilho.clientWidth);
        const dots = paginacao.querySelectorAll('.palco-dot');
        
        // Atualiza o efeito neon das bolinhas em tempo real
        dots.forEach((dot, i) => {
            if (i === indexAtivo) {
                dot.classList.add('ativo');
            } else {
                dot.classList.remove('ativo');
            }
        });
    }, { passive: true }); // O 'passive: true' garante que a animação rode a 60 FPS sem travar o processador do celular
};

// Como os iPhones e Samsungs modernos montam o DOM muito rápido, 
// garantimos que o Motor Dimensional ligue junto com a página.
document.addEventListener("DOMContentLoaded", () => {
    setTimeout(window.inicializarPalcoDimensional, 300);
});

// ============================================================================
// ⚖️ SISTEMA DE MANDADO DE APREENSÃO BILATERAL (TAKEOVER GLOBAL)
// ============================================================================

// 📱 CONFIGURAÇÃO DE TELEFONES (Coloque os números reais aqui, com DDD)
const TELEFONE_JOAO = "+5541996419950";      // Ex: +55419...
const TELEFONE_THAMIRIS = "+5562994838837";  // Ex: +55629...

// 1. O Vigilante do Supremo Tribunal
window.vigiarMandados = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos || !window.MEU_NOME) {
        setTimeout(window.vigiarMandados, 1000);
        return;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const takeover = document.getElementById('takeover-mandado');
    if (!takeover) return;

    // Escuta a porta do Tribunal
    const refMandado = ref(db, 'tribunal/mandado_alvo');
    
    onValue(refMandado, (snapshot) => {
        const alvo = snapshot.val(); // Agora o Firebase devolve um NOME
        
        // Se o nome no Firebase for exatamente o MEU nome... A casa caiu!
        if (alvo === window.MEU_NOME.toLowerCase()) {
            
            // Preenche o documento com os nomes corretos antes de mostrar
            document.getElementById('nome-reu-mandado').innerText = window.MEU_NOME;
            document.getElementById('nome-autor-mandado').innerText = window.NOME_PARCEIRO;

            // Derruba a tela
            takeover.classList.remove('takeover-escondido');
            
            // Vibração de alerta máximo
            if (window.Haptics && window.Haptics.erro) {
                navigator.vibrate([100, 100, 100, 100, 400]); 
            }
            
        } else {
            // Se o alvo não for eu (ou for nulo), eu continuo navegando livremente.
            takeover.classList.add('takeover-escondido');
        }
    });
};

// 2. A Rendição (O que a pessoa travada clica)
window.cumprirMandado = function() {
    if (window.Haptics) window.Haptics.sucesso();
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    
    const { db, ref, set } = window.SantuarioApp.modulos;
    const refMandado = ref(db, 'tribunal/mandado_alvo');

    // Revoga o mandado no Firebase limpando o alvo
    set(refMandado, null).then(() => {
        
        // Lógica de roteamento: Se eu sou o João sendo preso, ligo para a Thamiris. E vice-versa.
        const numeroDestino = window.souJoao ? TELEFONE_THAMIRIS : TELEFONE_JOAO;
        window.location.href = `tel:${numeroDestino}`; 
        
    }).catch((erro) => {
        console.error("Erro ao revogar mandado:", erro);
    });
};

// 3. A Ordem Judicial (O que qualquer um clica para travar o outro)
window.expedirMandadoApreensao = function() {
    // Agora não há mais restrição. Se tiver um nome de parceiro, atira!
    if (window.NOME_PARCEIRO) {
        if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
        
        const { db, ref, set } = window.SantuarioApp.modulos;
        const refMandado = ref(db, 'tribunal/mandado_alvo');

        const alvo = window.NOME_PARCEIRO.toLowerCase();

        // Registra no Firebase o nome de quem vai sofrer a apreensão
        set(refMandado, alvo).then(() => {
            if(typeof mostrarToast === 'function') mostrarToast(`Mandado expedido contra ${window.NOME_PARCEIRO}!`, "⚖️");
        }).catch((erro) => {
            if(typeof mostrarToast === 'function') mostrarToast("Falha na conexão com o Tribunal.", "❌");
        });
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Identificação pendente.", "⚠️");
    }
};

// Inicia a vigilância assim que a página é montada
document.addEventListener("DOMContentLoaded", () => {
    window.vigiarMandados();
});


// ============================================================================
// 📜 MOTOR DE CRIPTOGRAFIA FÍSICA: SELO DE CERA EÓLICO (SOPRO E CALOR)
// ============================================================================

let timerCalor = null;
let ceraDerretida = false;
let audioContext = null;
let analyser = null;
let microphone = null;
let frameSopro = null;

// 1. Função para abrir o envelope mágico (Teste)
window.abrirCartaMagica = function() {
    const overlay = document.getElementById('overlay-carta-selada');
    if(overlay) overlay.classList.remove('takeover-escondido');
    iniciarFisicaSelo();
};

window.fecharCartaSelada = function() {
    const overlay = document.getElementById('overlay-carta-selada');
    if(overlay) overlay.classList.add('takeover-escondido');
};

// 2. Física do Calor Humano (Pressionar a tela)
function iniciarFisicaSelo() {
    const btnSelo = document.getElementById('selo-cera-btn');
    const instrucao = document.getElementById('instrucao-selo');
    ceraDerretida = false;

    // Reseta o estado
    btnSelo.className = '';
    btnSelo.querySelector('.icone-selo').style.opacity = '1';
    instrucao.innerText = "Pressione e segure para aquecer a cera...";
    document.getElementById('conteudo-carta-secreta').classList.remove('texto-revelado');
    document.getElementById('selo-cera-container').style.display = 'flex';
    document.getElementById('selo-cera-container').style.opacity = '1';
    document.getElementById('btn-fechar-carta').classList.add('escondido');

    // Eventos de toque (Para celular) e Mouse (Para PC)
    btnSelo.addEventListener('touchstart', iniciarAquecimento, {passive: false});
    btnSelo.addEventListener('touchend', pararAquecimento);
    btnSelo.addEventListener('mousedown', iniciarAquecimento);
    btnSelo.addEventListener('mouseup', pararAquecimento);
    btnSelo.addEventListener('mouseleave', pararAquecimento);
}

function iniciarAquecimento(e) {
    e.preventDefault(); // Evita recarregar a tela
    if (ceraDerretida) return;

    if (window.Haptics) window.Haptics.toqueLeve();
    const btnSelo = document.getElementById('selo-cera-btn');
    const instrucao = document.getElementById('instrucao-selo');
    
    btnSelo.classList.add('aquecendo');
    instrucao.innerText = "Aquecendo... mantenha o toque...";

    // Vibração crescente simulando o calor
    let vibracao = 10;
    const intervaloVibracao = setInterval(() => {
        if (window.Haptics && navigator.vibrate) {
            navigator.vibrate([vibracao]);
        }
        vibracao += 10;
    }, 500);

    // Se segurar por 3 segundos ininterruptos, derrete!
    timerCalor = setTimeout(() => {
        clearInterval(intervaloVibracao);
        derreterCera();
    }, 3000);

    // Salva o intervalo no botão para podermos limpar se ela soltar o dedo antes
    btnSelo.dataset.vibTimer = intervaloVibracao;
}

function pararAquecimento(e) {
    if (ceraDerretida) return;
    const btnSelo = document.getElementById('selo-cera-btn');
    const instrucao = document.getElementById('instrucao-selo');

    clearTimeout(timerCalor);
    clearInterval(parseInt(btnSelo.dataset.vibTimer));

    btnSelo.classList.remove('aquecendo');
    instrucao.innerText = "A cera esfriou. Tente novamente.";
}

// 3. A Cera Derrete e Ativa o Microfone (Web Audio API)
function derreterCera() {
    ceraDerretida = true;
    if (window.Haptics) window.Haptics.sucesso();
    
    const btnSelo = document.getElementById('selo-cera-btn');
    const instrucao = document.getElementById('instrucao-selo');
    
    btnSelo.classList.remove('aquecendo');
    btnSelo.classList.add('derretido');
    btnSelo.querySelector('.icone-selo').style.opacity = '0'; // O ícone some no derretimento
    
    instrucao.innerText = "Sopre o microfone do celular para espalhar a cera!";
    instrucao.style.color = "#b31217";
    instrucao.style.fontWeight = "bold";

    // INICIA A LEITURA DO SOPRO (Vento)
    iniciarRadarDeSopro();
}

async function iniciarRadarDeSopro() {
    try {
        // Pede permissão para o microfone de forma invisível
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        
        // Cria o analisador de frequências
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        microphone = audioContext.createMediaStreamSource(stream);
        
        microphone.connect(analyser);
        analyser.fftSize = 256;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Loop de monitoramento do som a 60FPS
        const verificarSopro = () => {
            if (!ceraDerretida) return;
            
            analyser.getByteFrequencyData(dataArray);
            
            // Calcula a média do volume (ruído branco do vento bate muito forte no mic)
            let soma = 0;
            for(let i = 0; i < bufferLength; i++) {
                soma += dataArray[i];
            }
            let mediaVolume = soma / bufferLength;

            // Se o volume passar de 100 (um sopro forte perto do microfone)
            if (mediaVolume > 100) {
                cancelAnimationFrame(frameSopro); // Para a leitura
                revelarCartaSecreta(stream); // A MÁGICA ACONTECE
                return;
            }

            frameSopro = requestAnimationFrame(verificarSopro);
        };

        verificarSopro();

    } catch (err) {
        console.error("Permissão de microfone negada ou erro:", err);
        document.getElementById('instrucao-selo').innerText = "Microfone não autorizado. Clique no selo para abrir.";
        document.getElementById('selo-cera-btn').onclick = () => revelarCartaSecreta(null);
    }
}

// 4. O Êxtase: A Carta é Revelada!
function revelarCartaSecreta(stream) {
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 300]);
                    } // Vibração de quebra mágica

    // Desliga o microfone para não gastar bateria da Thamiris
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (audioContext) {
        audioContext.close();
    }

    // Some com o selo com um fade elegante
    const containerSelo = document.getElementById('selo-cera-container');
    containerSelo.style.opacity = '0';
    setTimeout(() => containerSelo.style.display = 'none', 1000);

    // Revela a carta tirando o Blur lentamente
    const carta = document.getElementById('conteudo-carta-secreta');
    carta.classList.add('texto-revelado');
    
    // Mostra o botão para guardar a carta depois de alguns segundos
    setTimeout(() => {
        document.getElementById('btn-fechar-carta').classList.remove('escondido');
    }, 2000);
}

// ============================================================================
// 🫀 MOTOR DE TELEMETRIA TÁTIL E SINESTESIA (O ECO DO CORAÇÃO)
// ============================================================================

// 🚨 1. A NOVA MÁGICA: ÁUDIO GRAVE E FLASH DE LUZ (PARA ENGANAR O iPHONE)
const somCoracaoGrave = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somCoracaoGrave.volume = 1.0; 

window.dispararEfeitoCoracao = function(elementoCoracao) {
    // Toca o grave profundo (respeitando o botão de Mudo global)
    if (!window.SantuarioSomPausado) {
        somCoracaoGrave.currentTime = 0;
        somCoracaoGrave.play().catch(e => { console.log("Áudio contido pela Apple") });
    }
    
    // Pulsa o botão fisicamente na tela
    if (elementoCoracao) {
        elementoCoracao.style.transform = "scale(1.4)";
        setTimeout(() => { elementoCoracao.style.transform = "scale(1)"; }, 150);
    }
    
    // Pisca a tela em tom de sangue bem rápido
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0'; overlay.style.left = '0';
    overlay.style.width = '100vw'; overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(255, 0, 50, 0.15)'; 
    overlay.style.zIndex = '9999999';
    overlay.style.pointerEvents = 'none';
    overlay.style.transition = 'opacity 0.3s ease-out';
    document.body.appendChild(overlay);
    
    // Se for o Android, vibra de verdade
    if (window.Haptics) window.Haptics.toqueForte();
    
    setTimeout(() => { 
        overlay.style.opacity = '0'; 
        setTimeout(() => overlay.remove(), 300);
    }, 50);
};

// ----------------------------------------------------------------------------
// VARIÁVEIS DE CONTROLE DO GRAVADOR
let gravandoEco = false;
let temposBatidas = [];
let inicioGravacao = 0;
let padraoVibracaoParaEnviar = [];

window.abrirSalaDeEco = function() {
    const overlay = document.getElementById('overlay-eco-coracao');
    if(overlay) overlay.classList.remove('takeover-escondido');
    
    document.getElementById('titulo-eco').innerText = "Gravar Eco";
    document.getElementById('instrucao-eco').innerText = "Toque em 'Iniciar', feche os olhos e bata o ritmo na tela.";
    document.getElementById('controles-gravacao-eco').classList.remove('escondido');
    document.getElementById('controles-reproducao-eco').classList.add('escondido');
    document.getElementById('btn-iniciar-eco').classList.remove('escondido');
    document.getElementById('btn-parar-eco').classList.add('escondido');
    document.getElementById('icone-radar-eco').innerText = "🫀";
    
    temposBatidas = [];
    padraoVibracaoParaEnviar = [];
    gravandoEco = false;
};

window.fecharSalaEco = function() {
    const overlay = document.getElementById('overlay-eco-coracao');
    if(overlay) overlay.classList.add('takeover-escondido');
    gravandoEco = false;
};

window.iniciarGravacaoEco = function() {
    gravandoEco = true;
    temposBatidas = [];
    inicioGravacao = Date.now();
    
    document.getElementById('btn-iniciar-eco').classList.add('escondido');
    document.getElementById('btn-parar-eco').classList.remove('escondido');
    document.getElementById('instrucao-eco').innerText = "Gravando... Bata na área central.";
    
    const radar = document.getElementById('radar-tátil');
    radar.addEventListener('touchstart', registrarBatida, {passive: false});
    radar.addEventListener('mousedown', registrarBatida);
};

function registrarBatida(e) {
    if (!gravandoEco) return;
    if (e.cancelable) e.preventDefault(); // Proteção para não travar o iOS
    
    const agora = Date.now();
    temposBatidas.push(agora);
    
    const nucleo = document.getElementById('nucleo-radar');
    
    // 🚨 QUANDO ELA GRAVA: Dispara o Som Grave e a Luz para ela sentir o toque
    window.dispararEfeitoCoracao(nucleo);

    const onda = document.createElement('div');
    onda.className = 'anel-radar-eco explosao-tatil';
    document.getElementById('radar-tátil').appendChild(onda);
    setTimeout(() => onda.remove(), 800);
}

window.pararEEnviarEco = function() {
    gravandoEco = false;
    const radar = document.getElementById('radar-tátil');
    radar.removeEventListener('touchstart', registrarBatida);
    radar.removeEventListener('mousedown', registrarBatida);

    if (temposBatidas.length < 2) {
        if(typeof mostrarToast === 'function') mostrarToast("Você precisa bater pelo menos 2 vezes.", "⚠️");
        window.fecharSalaEco();
        return;
    }

    padraoVibracaoParaEnviar = [];
    const duracaoToque = 50; 
    
    for (let i = 0; i < temposBatidas.length; i++) {
        padraoVibracaoParaEnviar.push(duracaoToque); 
        if (i < temposBatidas.length - 1) {
            let pausa = temposBatidas[i+1] - temposBatidas[i] - duracaoToque;
            if (pausa < 0) pausa = 0;
            padraoVibracaoParaEnviar.push(pausa);
        }
    }

    if (window.SantuarioApp && window.SantuarioApp.modulos && window.NOME_PARCEIRO) {
        const { db, ref, set } = window.SantuarioApp.modulos;
        // Chave estrita e segura (minúscula e sem acento)
        const chaveParceiro = window.souJoao ? 'thamiris' : 'joao';
        const caminho = `eco_santuario/${chaveParceiro}`;
        
        const payload = {
            autor: window.MEU_NOME || (window.souJoao ? 'João' : 'Thamiris'),
            padrao: padraoVibracaoParaEnviar,
            timestamp: Date.now()
        };

        set(ref(db, caminho), payload).then(() => {
            if(typeof mostrarToast === 'function') mostrarToast("Sinfonia tátil enviada!", "✈️");
            window.fecharSalaEco();
        });
    }
};

window.escutarEcosDoParceiro = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const minhaChave = window.souJoao ? 'joao' : 'thamiris';
    const caminho = `eco_santuario/${minhaChave}`;

    onValue(ref(db, caminho), (snapshot) => {
        const dados = snapshot.val();
        if (dados && dados.padrao) {
            window.ecoRecebido = dados.padrao;
            window.autorEco = dados.autor;
            
            const overlay = document.getElementById('overlay-eco-coracao');
            if(overlay) overlay.classList.remove('takeover-escondido');

            document.getElementById('titulo-eco').innerText = `Sinfonia de ${dados.autor}`;
            document.getElementById('instrucao-eco').innerText = "Escute e sinta as batidas do coração.";
            document.getElementById('icone-radar-eco').innerText = "💓";
            
            document.getElementById('controles-gravacao-eco').classList.add('escondido');
            document.getElementById('controles-reproducao-eco').classList.remove('escondido');
            
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100]);
                    }
        }
    });
};

// 🚨 QUANDO ELA RECEBE O SEU ECO: A REPRODUÇÃO SINESTÉSICA
window.reproduzirEcoRecebido = function() {
    if (!window.ecoRecebido) return;
    
    document.getElementById('instrucao-eco').innerText = "Reproduzindo...";
    
    // Seu Android ainda vai vibrar perfeitamente
    if (navigator.vibrate) navigator.vibrate(window.ecoRecebido);
    
    const nucleo = document.getElementById('icone-radar-eco');
    let tempoDecorrido = 0;
    
    // O código lê o tempo de cada batida que você gravou
    for (let i = 0; i < window.ecoRecebido.length; i++) {
        if (i % 2 === 0) { // Se for a hora da batida...
            setTimeout(() => {
                // 🚨 O iPHONE VAI TOCAR O GRAVE E PISCAR A TELA AQUI!
                window.dispararEfeitoCoracao(nucleo);
                
                const onda = document.createElement('div');
                onda.className = 'anel-radar-eco explosao-tatil';
                document.getElementById('radar-tátil').appendChild(onda);
                setTimeout(() => onda.remove(), 800);
            }, tempoDecorrido);
        }
        tempoDecorrido += window.ecoRecebido[i]; // Soma o tempo para a próxima batida
    }

    setTimeout(() => {
        document.getElementById('instrucao-eco').innerText = "Concluído.";
    }, tempoDecorrido + 500);
};

window.fecharSalaEcoEApagar = function() {
    window.fecharSalaEco();
    if (window.SantuarioApp && window.SantuarioApp.modulos) {
        const { db, ref, set } = window.SantuarioApp.modulos;
        const minhaChave = window.souJoao ? 'joao' : 'thamiris';
        set(ref(db, `eco_santuario/${minhaChave}`), null);
    }
};


// ============================================================================
// 💣 MOTOR MATEMÁTICO: CAMPO MINADO (MINES) - VERSÃO SINESTÉSICA (PITCH SHIFT)
// ============================================================================

let motorMines = {
    jogando: false,
    apostaAtual: 0,
    qtdBombas: 3,
    multiplicador: 1.0,
    diamantesAchados: 0,
    lucroPotencial: 0,
    gradeSecreta: [], // 0 = Diamante 💎, 1 = Bomba 💣
    // 🚨 A MÁGICA: Variável para controlar a altura do som
    frequenciaSomAtual: 1.0 
};

// 🚨 Som dedicado e manipulável do Diamante (Pitch Shift)
const somDiamanteMines = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

window.ajustarApostaMines = function(valor) {
    if (motorMines.jogando) return;
    const visor = document.getElementById('mines-aposta-input');
    if (!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.ajustarBombasMines = function(valor) {
    if (motorMines.jogando) return;
    const visor = document.getElementById('mines-bombas-input');
    if (!visor) return;
    
    let qtd = parseInt(visor.innerText) + valor;
    if (qtd < 1) qtd = 1;
    if (qtd > 20) qtd = 20;
    
    visor.innerText = qtd;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.4);
    if(window.Haptics) window.Haptics.toqueLeve();
};

// --- LÓGICA DO JOGO ---

window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'mines') {
        const mesa = document.getElementById('mesa-mines');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            desenharGradeMines();
        }
    } else if (typeof window.abrirMesaCassinoOriginal === 'function') {
        window.abrirMesaCassinoOriginal(nomeDoJogo);
    }
};

window.fecharMesaMines = function() {
    if (motorMines.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("Você está em jogo! Retire o lucro ou continue.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-mines');
    if(mesa) {
        mesa.classList.add('escondido');
        mesa.style.display = 'none';
    }
};

function desenharGradeMines() {
    const gradeHTML = document.getElementById('grade-mines');
    if (!gradeHTML) return;
    gradeHTML.innerHTML = "";
    
    for (let i = 0; i < 25; i++) {
        const bloco = document.createElement('div');
        bloco.className = "bloco-mines";
        bloco.id = `bloco-mines-${i}`;
        bloco.onclick = () => {
            if (!motorMines.jogando) {
                if(typeof mostrarToast === 'function') mostrarToast("Aposte e clique em Iniciar!", "💸");
            } else {
                revelarBlocoMines(i);
            }
        };
        gradeHTML.appendChild(bloco);
    }
}

window.iniciarRodadaMines = function() {
    const aposta = parseInt(document.getElementById('mines-aposta-input').innerText);
    const bombas = parseInt(document.getElementById('mines-bombas-input').innerText);
    
    if (aposta < 10) {
        if(typeof mostrarToast === 'function') mostrarToast("Aposta mínima de 10💰", "⚠️");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        return;
    }
    if ((window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Aposta no Mines");

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesStart', 0.8);

    motorMines.jogando = true;
    motorMines.apostaAtual = aposta;
    motorMines.qtdBombas = bombas;
    motorMines.multiplicador = 1.0;
    motorMines.diamantesAchados = 0;
    motorMines.lucroPotencial = aposta;
    motorMines.frequenciaSomAtual = 1.0; // 🚨 Zera a "escada musical"

    document.getElementById('btn-mines-iniciar').classList.add('escondido');
    document.getElementById('mines-painel-saque').classList.remove('escondido');
    atualizarPlacarMines();

    motorMines.gradeSecreta = Array(25).fill(0); 
    let bombasPlantadas = 0;
    while (bombasPlantadas < motorMines.qtdBombas) {
        let pos = Math.floor(Math.random() * 25);
        if (motorMines.gradeSecreta[pos] === 0) {
            motorMines.gradeSecreta[pos] = 1; 
            bombasPlantadas++;
        }
    }

    desenharGradeMines();
    if(window.Haptics) window.Haptics.toqueForte();
};

window.revelarBlocoMines = function(index) {
    if (!motorMines.jogando) return;
    
    const bloco = document.getElementById(`bloco-mines-${index}`);
    if (!bloco || bloco.classList.contains('revelado-diamante')) return;

    const ehBomba = motorMines.gradeSecreta[index] === 1;

    if (ehBomba) {
        // 🔊 SOM DE EXPLOSÃO! Quebra brutalmente a música.
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesBomba', 1.0);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 400]);
                    }
        
        bloco.classList.add('revelado-bomba');
        bloco.innerHTML = "💣";
        
        // Efeito de susto: A tela do jogo pisca em vermelho!
        bloco.parentElement.style.boxShadow = "inset 0 0 50px rgba(255, 0, 50, 0.8)";
        
        encerrarRodadaMines("derrota");
    } else {
        // 🚨 A MÁGICA: A ESCADA MUSICAL DO DIAMANTE!
        if (!window.SantuarioSomPausado) {
            somDiamanteMines.currentTime = 0;
            somDiamanteMines.playbackRate = motorMines.frequenciaSomAtual;
            somDiamanteMines.volume = 0.8;
            somDiamanteMines.play().catch(e=>{});
            
            // O próximo diamante fará um som ligeiramente mais rápido e agudo (Tensão/Dopamina)
            motorMines.frequenciaSomAtual += 0.08; 
            if (motorMines.frequenciaSomAtual > 2.5) motorMines.frequenciaSomAtual = 2.5; // Limite do navegador
        }

        if(window.Haptics) window.Haptics.sucesso();
        
        bloco.classList.add('revelado-diamante');
        bloco.innerHTML = "💎";
        motorMines.diamantesAchados++;
        
        let fatorRisco = motorMines.qtdBombas / 25; 
        motorMines.multiplicador += fatorRisco + (motorMines.diamantesAchados * 0.05);
        
        motorMines.lucroPotencial = Math.floor(motorMines.apostaAtual * motorMines.multiplicador);
        atualizarPlacarMines();

        // Se ela abriu o último diamante da grade, ela saca automaticamente
        if (motorMines.diamantesAchados === (25 - motorMines.qtdBombas)) {
            sacarMines();
        }
    }
};

window.sacarMines = function() {
    if (!motorMines.jogando) return;
    
    if(typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(motorMines.lucroPotencial, "Saque vitorioso no Mines");
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesSaque', 1.0);
    
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100, 50, 300]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#2ecc71'], particleCount: 150});
    if(typeof mostrarToast === 'function') mostrarToast(`Saque brilhante! +${motorMines.lucroPotencial}💰`, "✨");

    encerrarRodadaMines("vitoria");
};

function atualizarPlacarMines() {
    const multVisor = document.getElementById('mines-multiplicador-texto');
    const lucroVisor = document.getElementById('mines-lucro-texto');
    if (multVisor) multVisor.innerText = motorMines.multiplicador.toFixed(2);
    if (lucroVisor) lucroVisor.innerText = motorMines.lucroPotencial;
}

function encerrarRodadaMines(resultado) {
    motorMines.jogando = false;
    
    // Revela todo o tabuleiro
    for (let i = 0; i < 25; i++) {
        const bloco = document.getElementById(`bloco-mines-${i}`);
        if (bloco && !bloco.classList.contains('revelado-diamante') && !bloco.classList.contains('revelado-bomba')) {
            bloco.classList.add('opaco');
            bloco.innerHTML = (motorMines.gradeSecreta[i] === 1) ? "💣" : "💎";
        }
    }

    document.getElementById('btn-mines-iniciar').classList.remove('escondido');
    document.getElementById('mines-painel-saque').classList.add('escondido');
    
    const gradeHTML = document.getElementById('grade-mines');
    
    if (resultado === "derrota") {
        if(typeof mostrarToast === 'function') mostrarToast("BOOM! Você perdeu.", "🔥");
    } else {
        // Se ela sacou, o tabuleiro brilha em ouro
        if (gradeHTML) gradeHTML.style.boxShadow = "inset 0 0 50px rgba(212, 175, 55, 0.4)";
    }
    
    // Limpa os efeitos visuais 3 segundos depois
    setTimeout(() => {
        if (gradeHTML) gradeHTML.style.boxShadow = "none";
    }, 3000);
}


// ============================================================================
// 🎰 MOTOR JS PURO E BLINDADO: CAÇA-NÍQUEL (SLOTS) COM TENSÃO NEAR-MISS
// ============================================================================

if (!window.SlotMachineAPI) {
    window.SlotMachineAPI = { 
        girando: false, 
        modoAuto: false, 
        loopAuto: null 
    };
}

// 🚪 Roteador
const roteadorAntesSlots = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'slots') {
        const mesa = document.getElementById('mesa-slots');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            
            // Verifica e cria o Botão de Auto-Giro se não existir
            if (!document.getElementById('btn-slots-auto')) {
                const painelAposta = document.querySelector('.painel-aposta-slots');
                if (painelAposta) {
                    const btnAuto = document.createElement('button');
                    btnAuto.id = 'btn-slots-auto';
                    btnAuto.innerText = '🤖 MODO AUTO';
                    btnAuto.style.marginTop = '10px';
                    btnAuto.style.padding = '10px';
                    btnAuto.style.background = 'linear-gradient(145deg, #3498db, #2980b9)';
                    btnAuto.style.border = 'none';
                    btnAuto.style.color = '#fff';
                    btnAuto.style.borderRadius = '20px';
                    btnAuto.style.cursor = 'pointer';
                    btnAuto.onclick = window.alternarGiroAutomatico;
                    painelAposta.appendChild(btnAuto);
                }
            }
        }
    } else if (typeof roteadorAntesSlots === 'function') {
        roteadorAntesSlots(nomeDoJogo);
    }
};

window.fecharMesaSlots = function() {
    if (window.SlotMachineAPI.girando) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde o giro terminar!", "⚠️");
        return;
    }
    // Desliga o modo auto se estiver saindo
    if (window.SlotMachineAPI.modoAuto) window.alternarGiroAutomatico();
    
    const mesa = document.getElementById('mesa-slots');
    if(mesa) mesa.style.display = 'none';
};

// 💰 Botões de Aposta
window.ajustarApostaSlots = function(valor) {
    if (window.SlotMachineAPI.girando || window.SlotMachineAPI.modoAuto) return;
    
    const visor = document.getElementById('slots-aposta-input');
    if (!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics && window.Haptics.toqueLeve) window.Haptics.toqueLeve();
};

// 🤖 Função do Modo Automático
window.alternarGiroAutomatico = function() {
    const btnAuto = document.getElementById('btn-slots-auto');
    if (window.SlotMachineAPI.modoAuto) {
        window.SlotMachineAPI.modoAuto = false;
        clearInterval(window.SlotMachineAPI.loopAuto);
        if (btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #3498db, #2980b9)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Automático Desativado.", "🛑");
    } else {
        window.SlotMachineAPI.modoAuto = true;
        if (btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Automático Ativado! 🎰", "🤖");
        window.girarSlots(); // Dispara o primeiro já de cara
    }
};

// 🌪️ O Motor de Giro Físico (A MÁGICA DA TENSÃO ACONTECE AQUI)
window.girarSlots = function() {
    const btn = document.getElementById('btn-slots-iniciar') || document.getElementById('btn-slots-girar');
    if (window.SlotMachineAPI.girando) return;
    
    const visor = document.getElementById('slots-aposta-input');
    let aposta = 50;
    if (visor) aposta = parseInt(visor.innerText);
    
    if (isNaN(aposta) || aposta < 10) {
        if(typeof mostrarToast === 'function') mostrarToast("Aposta mínima é 10!", "⚠️");
        if (window.SlotMachineAPI.modoAuto) window.alternarGiroAutomatico(); // Trava se quebrar a regra
        return;
    }
    
    if ((window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6);
        if(window.Haptics) window.Haptics.erro();
        if (window.SlotMachineAPI.modoAuto) window.alternarGiroAutomatico(); // Para o robô se ficar pobre
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Giro no Caça-Níquel");

    window.SlotMachineAPI.girando = true;

    if (btn) {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 50, 50]);
                    }

    const simbolosLocais = ['🍒', '🍋', '🍇', '🔔', '💎', '7️⃣'];
    const premiosLocais = { '🍒': 3, '🍋': 5, '🍇': 10, '🔔': 20, '💎': 50, '7️⃣': 100 };

    // Ativa a animação de velocidade do CSS
    for(let i=1; i<=3; i++) {
        const slot = document.getElementById(`slot${i}`);
        if(slot) {
            slot.classList.remove('slot-vitoria-anim');
            slot.classList.add('slot-girando');
        }
    }

    // =========================================================
    // 🚨 O CÉREBRO MATEMÁTICO (Gera o resultado por trás da cortina)
    // =========================================================
    let chance = Math.random(); 
    let resultado = [];
    let isNearMiss = false;

    if (chance <= 0.01) {
        resultado = ['7️⃣', '7️⃣', '7️⃣']; // 1% Jackpot
    } else if (chance <= 0.04) {
        resultado = ['💎', '💎', '💎']; // 3% Mega
    } else if (chance <= 0.14) {
        let simboloMedio = Math.random() > 0.5 ? '🍇' : '🔔';
        resultado = [simboloMedio, simboloMedio, simboloMedio]; // 10%
    } else if (chance <= 0.39) {
        let simboloPequeno = Math.random() > 0.5 ? '🍒' : '🍋';
        resultado = [simboloPequeno, simboloPequeno, simboloPequeno]; // 25%
    } else {
        // 61% de Chance de Perder
        let s1 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
        let s2 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
        let s3 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];

        // 🚨 A MÁGICA PSICOLÓGICA (Near Miss - Quase Lá)
        // 40% das vezes que ela perde, os dois primeiros blocos serão OBRIGATORIAMENTE iguais para dar a ilusão de chance
        if (Math.random() > 0.6) {
            s2 = s1;
            isNearMiss = true; 
        }

        // Garante que o terceiro símbolo seja diferente para consolidar a derrota
        while (s1 === s2 && s2 === s3) {
            s3 = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
        }
        
        resultado = [s1, s2, s3];
    }

    // Faz os emojis trocarem no fundo
    let motorVisual = setInterval(() => {
        for(let i=1; i<=3; i++) {
            let slotDiv = document.getElementById(`slot${i}`);
            if (slotDiv && slotDiv.classList.contains('slot-girando')) {
                slotDiv.innerText = simbolosLocais[Math.floor(Math.random() * simbolosLocais.length)];
            }
        }
    }, 50);

    // =========================================================
    // 🚨 CONTROLE DE TENSÃO E SUSPENSE DE PARADA
    // =========================================================
    // Os tempos de parada da roleta (1 e 2 param normais, a 3ª pode demorar!)
    let tempoParada = [1000, 1500, 2000];

    // Se o resultado final for uma vitória OU um Near Miss (s1 e s2 iguais), a 3ª roleta vai entrar em TENSÃO
    if ((resultado[0] === resultado[1] && resultado[1] === resultado[2]) || isNearMiss) {
        tempoParada[2] = 3500; // Atrasa a parada em 1 segundo e meio a mais
        
        // Coloca o som de tensão rolando apenas na última roleta
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('roleta', 1.0); // Usa o som da roleta para simular o motor girando forte
            const slot3 = document.getElementById('slot3');
            if (slot3) slot3.style.boxShadow = "inset 0 0 30px rgba(255, 215, 0, 0.8)"; // Brilha em dourado de expectativa
        }, 1500); // Exato momento em que o slot 2 parou
    }

    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            let roleta = document.getElementById(`slot${i+1}`);
            if (roleta) {
                roleta.classList.remove('slot-girando');
                roleta.innerText = resultado[i];
                roleta.style.transform = "translateY(0)"; 
                roleta.style.boxShadow = "none"; // Remove o brilho dourado de tensão
            }
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsPlin', 0.9);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
        }, tempoParada[i]);
    }

    // O Veredito Final (Ouve o último tempo programado)
    setTimeout(() => {
        clearInterval(motorVisual);
        window.SlotMachineAPI.girando = false;
        
        try {
            let venceu = (resultado[0] === resultado[1] && resultado[1] === resultado[2]);
            if (venceu) {
                let mult = premiosLocais[resultado[0]] || 10;
                let lucro = aposta * mult;
                
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "JACKPOT no Caça-Níquel!");
                if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 400]);
                    }
                if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#D4AF37'], particleCount: 200});
                if(typeof mostrarToast === 'function') mostrarToast(`JACKPOT! ${mult}x (+${lucro}💰)`, "🎰");
                
                for(let i=1; i<=3; i++) {
                    const slot = document.getElementById(`slot${i}`);
                    if (slot) slot.classList.add('slot-vitoria-anim');
                }
            } else {
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                // Um leve suspiro de derrota visual
                if (isNearMiss && window.Haptics) navigator.vibrate([20, 50, 20]);
            }
        } catch(e) {
            console.error(e);
        } finally {
            if (btn) {
                btn.style.opacity = "1";
                btn.style.pointerEvents = "auto";
            }
            
            // 🚨 Se estiver no Modo Auto, dispara de novo com segurança
            if (window.SlotMachineAPI.modoAuto) {
                window.SlotMachineAPI.loopAuto = setTimeout(window.girarSlots, 1500); 
            }
        }
    }, tempoParada[2] + 200); // 200ms após o último cilindro parar para dar o feedback
};


// ============================================================================
// 🚀 MOTOR GRÁFICO, MATEMÁTICO E SONORO: CRASH (ESTILO AVIATOR) COM TENSÃO
// ============================================================================

const roteadorAntigo = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'crash') {
        const mesa = document.getElementById('mesa-crash');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            resetarGraficoCrash();
        }
    } else {
        if(typeof roteadorAntigo === 'function') roteadorAntigo(nomeDoJogo);
    }
};

window.fecharMesaCrash = function() {
    if (motorCrash.voando) {
        if(typeof mostrarToast === 'function') mostrarToast("Você está no ar! Retire o lucro antes de sair.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-crash');
    if(mesa) mesa.style.display = 'none';
};

let motorCrash = {
    voando: false,
    aposta: 0,
    multiplicadorAtual: 1.00,
    pontoExplosao: 1.00,
    motorLogica: null,
    motorVisual: null
};

// 🚨 NOVO MOTOR AUDIOVISUAL DO FOGUETINHO (BATIMENTO DE TENSÃO)
const somTensaoCrash = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somTensaoCrash.loop = true;

window.ajustarApostaCrash = function(valor) {
    if (motorCrash.voando) return;
    const input = document.getElementById('crash-aposta-input');
    if(!input) return;
    let novaAposta = parseInt(input.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    input.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.acaoCrash = function() {
    if (!motorCrash.voando) iniciarVooCrash();
    else sacarLucroCrash();
};

function iniciarVooCrash() {
    const input = document.getElementById('crash-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Lançamento Aviator");
    
    motorCrash.voando = true;
    motorCrash.aposta = aposta;
    motorCrash.multiplicadorAtual = 1.00;
    
    // RTP: Curva de probabilidade de Cassino
    let sorte = Math.random();
    if (sorte < 0.05) motorCrash.pontoExplosao = 1.00; 
    else {
        motorCrash.pontoExplosao = (1 / (1 - sorte)) * 0.95; 
        if (motorCrash.pontoExplosao < 1.01) motorCrash.pontoExplosao = 1.01;
    }

    resetarGraficoCrash();
    
    const btn = document.getElementById('btn-acao-crash');
    if(btn) {
        btn.innerHTML = `RETIRAR <span id="crash-btn-lucro">0</span>💰`;
        btn.style.background = "linear-gradient(145deg, #f39c12, #d35400)";
        btn.style.boxShadow = "0 10px 30px rgba(243, 156, 18, 0.6)";
    }
    
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) foguete.classList.add('foguete-voando-aviator');
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('crashStart', 0.8);
    if(window.Haptics) window.Haptics.toqueForte();

    // 🚨 Inicia som de tensão do coração (Respeitando o Mudo Global)
    if (!window.SantuarioSomPausado) {
        somTensaoCrash.playbackRate = 1.0;
        somTensaoCrash.volume = 0.5;
        somTensaoCrash.play().catch(e=>{});
    }

    // O CÉREBRO MATEMÁTICO (Roda independente do visual)
    motorCrash.motorLogica = setInterval(() => {
        let incremento = 0.001 + (motorCrash.multiplicadorAtual * 0.005);
        motorCrash.multiplicadorAtual += incremento;

        if (motorCrash.multiplicadorAtual >= motorCrash.pontoExplosao) {
            motorCrash.multiplicadorAtual = motorCrash.pontoExplosao;
            explodirFoguete();
            return;
        }

        const visorMult = document.getElementById('crash-multiplicador-visor');
        const visorLucro = document.getElementById('crash-btn-lucro');
        
        if(visorMult) visorMult.innerText = motorCrash.multiplicadorAtual.toFixed(2) + "x";
        if(visorLucro) visorLucro.innerText = Math.floor(motorCrash.aposta * motorCrash.multiplicadorAtual);
    }, 50);

    // O MOTOR GRÁFICO CANVAS (60 FPS)
    desenharGraficoAviator();
}

// 🎨 A MÁGICA DE LAS VEGAS: Renderização da Curva e Alarme Visual
function desenharGraficoAviator() {
    if (!motorCrash.voando) return; // Para de desenhar se explodiu ou sacou

    const canvas = document.getElementById('crash-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    let progressoVisual = (motorCrash.multiplicadorAtual - 1.0) / 1.0; 
    if (progressoVisual > 1) progressoVisual = 1; 

    // 🚨 A MÁGICA DO PITCH SHIFTING (Acelera o coração e deixa mais agudo conforme sobe!)
    let taxaVelocidade = 1.0 + ((motorCrash.multiplicadorAtual - 1.0) * 0.5); 
    if (taxaVelocidade > 3.0) taxaVelocidade = 3.0; // Limite do iOS
    somTensaoCrash.playbackRate = taxaVelocidade;

    // 🚨 ALARME VISUAL: Tela avermelhada de perigo se passar de 2.0x
    const containerGrafico = document.getElementById('crash-tela-grafico');
    if (motorCrash.multiplicadorAtual > 2.0 && containerGrafico) {
        let intensidade = (motorCrash.multiplicadorAtual - 2.0) * 0.3;
        if (intensidade > 0.6) intensidade = 0.6;
        containerGrafico.style.boxShadow = `inset 0 0 50px rgba(255, 50, 50, ${intensidade})`;
        
        // Simula o tremor do ar no iOS (vibração de alta frequência baseada na tela)
        if(window.Haptics && Math.random() > 0.9) window.Haptics.toqueLeve();
    }

    // Coordenadas
    const startX = 20;
    const startY = canvas.height - 20;
    const alvoX = startX + progressoVisual * (canvas.width - 60);
    const alvoY = startY - Math.pow(progressoVisual, 0.8) * (canvas.height - 80);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha o preenchimento de energia sob a curva
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(alvoX, startY, alvoX, alvoY);
    ctx.lineTo(alvoX, startY);
    ctx.lineTo(startX, startY);
    
    let gradienteFundo = ctx.createLinearGradient(0, alvoY, 0, startY);
    gradienteFundo.addColorStop(0, "rgba(241, 196, 15, 0.4)"); 
    gradienteFundo.addColorStop(1, "rgba(241, 196, 15, 0.0)"); 
    ctx.fillStyle = gradienteFundo;
    ctx.fill();

    // 2. Desenha a Linha Dourada
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(alvoX, startY, alvoX, alvoY);
    ctx.strokeStyle = "#f1c40f";
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#f1c40f";
    ctx.stroke();

    // 3. Move o Foguete Físico (Emoji) para a ponta da linha
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) {
        foguete.style.left = `${alvoX - 25}px`; 
        foguete.style.top = `${alvoY - 25}px`;
        let inclinacao = progressoVisual * 45; 
        foguete.style.transform = `rotate(${inclinacao}deg)`;
    }

    motorCrash.motorVisual = requestAnimationFrame(desenharGraficoAviator);
}

function sacarLucroCrash() {
    clearInterval(motorCrash.motorLogica);
    cancelAnimationFrame(motorCrash.motorVisual);
    motorCrash.voando = false;
    somTensaoCrash.pause(); // Para o coração
    
    let lucroFinal = Math.floor(motorCrash.aposta * motorCrash.multiplicadorAtual);
    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucroFinal, "Voo Perfeito no Aviator!");
    
    const visor = document.getElementById('crash-multiplicador-visor');
    const foguete = document.getElementById('crash-foguete-icone');
    
    if(visor) visor.style.color = "#2ecc71"; 
    if(foguete) foguete.classList.remove('foguete-voando-aviator');
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('crashCashout', 1.0);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#f1c40f'], particleCount: 100});
    if(typeof mostrarToast === 'function') mostrarToast(`Saque Perfeito! +${lucroFinal}💰`, "🚀");

    voltarBotaoApostarCrash();
}

function explodirFoguete() {
    clearInterval(motorCrash.motorLogica);
    cancelAnimationFrame(motorCrash.motorVisual);
    motorCrash.voando = false;
    somTensaoCrash.pause(); // Para o coração
    
    const visor = document.getElementById('crash-multiplicador-visor');
    if(visor) {
        visor.innerText = motorCrash.multiplicadorAtual.toFixed(2) + "x";
        visor.classList.add('texto-explodiu');
    }
    
    const tela = document.getElementById('crash-tela-grafico');
    if(tela) tela.classList.add('tela-crash-explodiu');
    
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) {
        foguete.classList.remove('foguete-voando-aviator');
        foguete.classList.add('foguete-explodido');
        foguete.innerText = "💥";
    }
    
    // Tinta o Canvas de vermelho
    const canvas = document.getElementById('crash-canvas');
    if(canvas) {
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "rgba(231, 76, 60, 0.3)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('crashBoom', 0.9);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 500]);
                    }
    if(typeof mostrarToast === 'function') mostrarToast("CRASH! O foguete explodiu.", "💥");

    voltarBotaoApostarCrash();
}

function voltarBotaoApostarCrash() {
    const btn = document.getElementById('btn-acao-crash');
    if(btn) {
        btn.innerHTML = "APOSTAR 🚀";
        btn.style.background = "linear-gradient(145deg, #2ecc71, #27ae60)";
        btn.style.boxShadow = "0 10px 30px rgba(46, 204, 113, 0.4)";
    }
}

function resetarGraficoCrash() {
    const visor = document.getElementById('crash-multiplicador-visor');
    if(visor) {
        visor.innerText = "1.00x";
        visor.style.color = "#fff";
        visor.classList.remove('texto-explodiu');
    }
    
    const tela = document.getElementById('crash-tela-grafico');
    if(tela) {
        tela.classList.remove('tela-crash-explodiu');
        tela.style.boxShadow = "none"; // Reseta o alarme visual vermelho
    }
    
    const foguete = document.getElementById('crash-foguete-icone');
    if(foguete) {
        foguete.classList.remove('foguete-explodido');
        foguete.innerText = "🚀";
        foguete.style.left = "20px";
        foguete.style.bottom = "20px";
        foguete.style.top = "auto";
        foguete.style.transform = "rotate(0deg)";
    }

    const canvas = document.getElementById('crash-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}


// ============================================================================
// 🃏 MOTOR MATEMÁTICO, IA E ÁUDIO: BLACKJACK (21) - VERSÃO HIGH STAKES
// ============================================================================

// 🚨 Roteador Mestre Atualizado
const roteadorMestre = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'blackjack') {
        const mesa = document.getElementById('mesa-blackjack');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            resetarMesaBJ(true); 
        }
    } else {
        if(typeof roteadorMestre === 'function') roteadorMestre(nomeDoJogo);
    }
};

window.fecharMesaBlackjack = function() {
    if (motorBJ.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("A rodada está em andamento!", "⚠️");
        return;
    }
    somTensaoBJ.pause(); // Garante o silêncio ao sair
    const mesa = document.getElementById('mesa-blackjack');
    if(mesa) mesa.style.display = 'none';
};

// --- O CÉREBRO DO JOGO ---
let motorBJ = {
    jogando: false,
    aposta: 0,
    maoJogador: [],
    maoDealer: [],
    taxaCoracao: 1.0,
    baralho: {
        valores: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'],
        naipes: ['♠', '♥', '♦', '♣']
    }
};

// 🚨 MOTOR DE TENSÃO DO BLACKJACK
const somTensaoBJ = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somTensaoBJ.loop = true;

window.ajustarApostaBJ = function(valor) {
    if (motorBJ.jogando) return;
    const input = document.getElementById('bj-aposta-input');
    if(!input) return;
    
    let novaAposta = parseInt(input.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    input.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function sacarCartaAletoria() {
    const valor = motorBJ.baralho.valores[Math.floor(Math.random() * motorBJ.baralho.valores.length)];
    const naipe = motorBJ.baralho.naipes[Math.floor(Math.random() * motorBJ.baralho.naipes.length)];
    return { valor, naipe };
}

function calcularPontos(mao) {
    let pontos = 0;
    let ases = 0;

    for (let carta of mao) {
        if (['J', 'Q', 'K'].includes(carta.valor)) {
            pontos += 10;
        } else if (carta.valor === 'A') {
            pontos += 11;
            ases += 1;
        } else {
            pontos += parseInt(carta.valor);
        }
    }

    while (pontos > 21 && ases > 0) {
        pontos -= 10;
        ases -= 1;
    }
    return pontos;
}

function renderizarCartaHTML(carta, oculta = false) {
    const div = document.createElement('div');
    div.className = `carta-bj ${oculta ? 'oculta' : ''}`;
    
    if (!oculta) {
        const corCorreta = (carta.naipe === '♥' || carta.naipe === '♦') ? 'vermelha' : 'preta';
        div.classList.add(corCorreta);
        div.innerHTML = `
            <div class="carta-bj-topo">${carta.valor}${carta.naipe}</div>
            <div class="carta-bj-centro">${carta.naipe}</div>
            <div class="carta-bj-base">${carta.valor}${carta.naipe}</div>
        `;
    }
    return div;
}

function atualizarMesaVisual() {
    const divJogador = document.getElementById('bj-jogador-cartas');
    if(divJogador) {
        divJogador.innerHTML = "";
        motorBJ.maoJogador.forEach(c => divJogador.appendChild(renderizarCartaHTML(c)));
    }
    const pontosJog = document.getElementById('bj-jogador-pontos');
    if(pontosJog) pontosJog.innerText = calcularPontos(motorBJ.maoJogador);

    const divDealer = document.getElementById('bj-dealer-cartas');
    const pontosDeal = document.getElementById('bj-dealer-pontos');
    if(divDealer) {
        divDealer.innerHTML = "";
        if (motorBJ.jogando) {
            divDealer.appendChild(renderizarCartaHTML(motorBJ.maoDealer[0], true));
            if (motorBJ.maoDealer.length > 1) {
                divDealer.appendChild(renderizarCartaHTML(motorBJ.maoDealer[1]));
            }
            if(pontosDeal) pontosDeal.innerText = "?";
        } else {
            motorBJ.maoDealer.forEach(c => divDealer.appendChild(renderizarCartaHTML(c)));
            if(pontosDeal) pontosDeal.innerText = calcularPontos(motorBJ.maoDealer);
        }
    }
}

window.iniciarRodadaBJ = function() {
    const input = document.getElementById('bj-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Aposta no Blackjack");
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);

    motorBJ.jogando = true;
    motorBJ.aposta = aposta;
    motorBJ.maoJogador = [];
    motorBJ.maoDealer = [];
    motorBJ.taxaCoracao = 1.0;

    document.getElementById('bj-painel-aposta').classList.add('escondido');
    document.getElementById('bj-painel-resultado').classList.add('escondido');
    document.getElementById('bj-painel-acao').classList.remove('escondido');
    
    const mesa = document.getElementById('mesa-blackjack');
    if(mesa) mesa.style.boxShadow = "none"; // Reseta alarme visual

    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 50, 30]);
                    }

    setTimeout(() => { motorBJ.maoJogador.push(sacarCartaAletoria()); atualizarMesaVisual(); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7); }, 200);
    setTimeout(() => { motorBJ.maoDealer.push(sacarCartaAletoria()); atualizarMesaVisual(); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7); }, 600);
    setTimeout(() => { motorBJ.maoJogador.push(sacarCartaAletoria()); atualizarMesaVisual(); if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7); }, 1000);
    setTimeout(() => { 
        motorBJ.maoDealer.push(sacarCartaAletoria()); 
        atualizarMesaVisual(); 
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7);
        
        if (calcularPontos(motorBJ.maoJogador) === 21) {
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 300]);
                    }
            finalizarRodadaBJ("BLACKJACK");
        }
    }, 1400);
};

window.comprarCartaBJ = function() {
    if (!motorBJ.jogando) return;
    
    // 🚨 O RISCO: Se ela pedir carta com 15+ pontos, a mesa pisca em perigo
    let pontosAtuais = calcularPontos(motorBJ.maoJogador);
    if (pontosAtuais >= 15) {
        const mesa = document.getElementById('mesa-blackjack');
        if(mesa) {
            mesa.style.boxShadow = "inset 0 0 50px rgba(231, 76, 60, 0.4)";
            setTimeout(() => mesa.style.boxShadow = "none", 300);
        }
    }

    motorBJ.maoJogador.push(sacarCartaAletoria());
    atualizarMesaVisual();
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
    if(window.Haptics) navigator.vibrate(30);

    if (calcularPontos(motorBJ.maoJogador) > 21) {
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
        finalizarRodadaBJ("ESTOUROU");
    }
};

window.pararBJ = function() {
    if (!motorBJ.jogando) return;
    
    // 🚨 THE SQUEEZE: O suspense da IA do Dealer
    // Desativa os botões para ela só assistir o show
    document.getElementById('bj-painel-acao').classList.add('escondido');
    
    // Inicia o coração se não estiver mutado
    if (!window.SantuarioSomPausado) {
        somTensaoBJ.currentTime = 0;
        somTensaoBJ.playbackRate = motorBJ.taxaCoracao;
        somTensaoBJ.volume = 0.6;
        somTensaoBJ.play().catch(e=>{});
    }

    // Pausa dramática de 1.5s antes de revelar a carta secreta
    setTimeout(() => {
        motorBJ.jogando = false; 
        atualizarMesaVisual(); 
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
        
        // Loop recursivo para o dealer comprar cartas lentamente e com aumento de tensão
        function turnoDealer() {
            let pontosDealer = calcularPontos(motorBJ.maoDealer);
            
            if (pontosDealer < 17) {
                setTimeout(() => {
                    motorBJ.maoDealer.push(sacarCartaAletoria());
                    atualizarMesaVisual();
                    
                    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7);
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
                    
                    // Acelera o coração a cada carta do dealer
                    motorBJ.taxaCoracao += 0.2;
                    somTensaoBJ.playbackRate = motorBJ.taxaCoracao;
                    
                    turnoDealer(); // Chama de novo
                }, 1200); // 1.2s de angústia entre cada carta
            } else {
                setTimeout(() => { finalizarRodadaBJ("COMPARAÇÃO"); }, 1000);
            }
        }
        
        turnoDealer();

    }, 1500);
};

function finalizarRodadaBJ(motivo) {
    motorBJ.jogando = false;
    somTensaoBJ.pause(); // Cessa a tensão musical
    atualizarMesaVisual(); 

    document.getElementById('bj-painel-acao').classList.add('escondido');
    document.getElementById('bj-painel-resultado').classList.remove('escondido');

    const pontosJ = calcularPontos(motorBJ.maoJogador);
    const pontosD = calcularPontos(motorBJ.maoDealer);

    let lucro = 0;
    let msgToast = "";
    let iconeToast = "";

    if (motivo === "BLACKJACK") {
        lucro = motorBJ.aposta * 2.5; 
        msgToast = `BLACKJACK! +${lucro}💰`;
        iconeToast = "🃏✨";
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjBlackjack', 1.0); 
        
    } else if (motivo === "ESTOUROU") {
        msgToast = "Você estourou! A casa vence.";
        iconeToast = "💥";
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjBust', 0.8); 
        
        // 🚨 TREMEDEIRA DE ESTOURO
        const mesa = document.getElementById('mesa-blackjack');
        if (mesa) {
            mesa.style.boxShadow = "inset 0 0 80px rgba(231, 76, 60, 0.8)";
            mesa.style.transform = "translateX(5px)";
            setTimeout(()=> mesa.style.transform = "translateX(-5px)", 50);
            setTimeout(()=> mesa.style.transform = "translateX(5px)", 100);
            setTimeout(()=> { mesa.style.transform = "translateX(0)"; mesa.style.boxShadow = "none"; }, 150);
        }

    } else {
        if (pontosD > 21) {
            lucro = motorBJ.aposta * 2; 
            msgToast = `Dealer estourou! Você venceu! +${lucro}💰`;
            iconeToast = "💸";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjWin', 0.9); 
            
        } else if (pontosJ > pontosD) {
            lucro = motorBJ.aposta * 2; 
            msgToast = `Sua mão é maior! Você venceu! +${lucro}💰`;
            iconeToast = "🏆";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjWin', 0.9); 
            
        } else if (pontosJ < pontosD) {
            msgToast = "O Dealer venceu esta mão.";
            iconeToast = "🏦";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjLose', 0.7); 
            
        } else {
            lucro = motorBJ.aposta; 
            msgToast = "Empate (Push). Aposta devolvida.";
            iconeToast = "🤝";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjPush', 0.8); 
        }
    }

    if (lucro > 0) {
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "Vitória no Blackjack");
        if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#ffffff'], particleCount: 150});
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100, 200, 200]);
                    }
    } else if (lucro === 0 && pontosJ !== pontosD) {
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 200]);
                    }
    }

    if(typeof mostrarToast === 'function') mostrarToast(msgToast, iconeToast);
}

window.resetarMesaBJ = function(init = false) {
    motorBJ.jogando = false;
    somTensaoBJ.pause();
    document.getElementById('bj-painel-resultado').classList.add('escondido');
    document.getElementById('bj-painel-acao').classList.add('escondido');
    document.getElementById('bj-painel-aposta').classList.remove('escondido');
    
    const divJog = document.getElementById('bj-jogador-cartas');
    const divDeal = document.getElementById('bj-dealer-cartas');
    const ptsJog = document.getElementById('bj-jogador-pontos');
    const ptsDeal = document.getElementById('bj-dealer-pontos');
    
    if(divJog) divJog.innerHTML = "";
    if(divDeal) divDeal.innerHTML = "";
    if(ptsJog) ptsJog.innerText = "0";
    if(ptsDeal) ptsDeal.innerText = "?";
    
    const mesa = document.getElementById('mesa-blackjack');
    if(mesa) mesa.style.boxShadow = "none";
    
    if(!init && window.Haptics) window.Haptics.toqueLeve();
};


// ============================================================================
// 🎡 MOTOR MATEMÁTICO, FÍSICO E SONORO: ROLETA DA SORTE (HIGH STAKES)
// ============================================================================

const roteadorAntesDaRoleta = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'roleta') {
        const mesa = document.getElementById('mesa-roleta');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            
            // Inicia o giro ocioso (esperando apostas)
            const disco = document.getElementById('disco-roleta');
            disco.style.transition = 'none';
            disco.classList.add('roleta-respirando');
        }
    } else {
        if(typeof roteadorAntesDaRoleta === 'function') roteadorAntesDaRoleta(nomeDoJogo);
    }
};

window.fecharMesaRoleta = function() {
    if (motorRoleta.girando) {
        if(typeof mostrarToast === 'function') mostrarToast("A roda está girando! Aguarde.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-roleta');
    if(mesa) mesa.style.display = 'none';
};

// --- O CÉREBRO DA MÁQUINA ---
let motorRoleta = {
    girando: false,
    anguloAtual: 0
};

window.ajustarApostaRoleta = function(valor) {
    if (motorRoleta.girando) return;
    const input = document.getElementById('roleta-aposta-input');
    if(!input) return;
    
    let novaAposta = parseInt(input.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    input.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

// 🚨 O LEITOR DE MATRIZ (Lê a posição do CSS em tempo real)
function obterAnguloVisualReal(elemento) {
    const style = window.getComputedStyle(elemento);
    const matrix = style.getPropertyValue('transform');
    if (matrix !== 'none') {
        const values = matrix.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        let angulo = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        return (angulo < 0) ? angulo + 360 : angulo;
    }
    return 0;
}

window.apostarRoleta = function(corApostada) {
    if (motorRoleta.girando) return;
    
    const input = document.getElementById('roleta-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, `Aposta no ${corApostada.toUpperCase()}`);
    
    motorRoleta.girando = true;
    const disco = document.getElementById('disco-roleta');
    
    let anguloVisualCongelado = obterAnguloVisualReal(disco);
    
    disco.classList.remove('roleta-respirando');
    disco.style.transition = 'none';
    disco.style.transform = `rotate(${anguloVisualCongelado}deg)`;
    
    void disco.offsetWidth; // Reflow force

    // MATEMÁTICA PURA
    let numeroSorteado = Math.floor(Math.random() * 15); 
    let corCaiu = "";
    let posicaoAlvoNaRoda = 0;

    const posicoesVermelhas = [12, 60, 108, 156, 204, 252, 300];
    const posicoesPretas = [36, 84, 132, 180, 228, 276, 324];

    if (numeroSorteado === 0) {
        corCaiu = "verde";
        posicaoAlvoNaRoda = 354; 
    } else if (numeroSorteado >= 1 && numeroSorteado <= 7) {
        corCaiu = "vermelho";
        posicaoAlvoNaRoda = posicoesVermelhas[numeroSorteado - 1]; 
    } else {
        corCaiu = "preto";
        posicaoAlvoNaRoda = posicoesPretas[numeroSorteado - 8]; 
    }

    let rotacaoParaOAlvo = (360 - posicaoAlvoNaRoda) % 360;
    let distanciaFaltante = rotacaoParaOAlvo - (anguloVisualCongelado % 360);
    if (distanciaFaltante <= 0) distanciaFaltante += 360; 

    // O Torque (Várias voltas antes de parar)
    motorRoleta.anguloAtual = anguloVisualCongelado + 3600 + distanciaFaltante;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('roletaSpin', 1.0);

    // Física de Rotação (9 Segundos)
    disco.style.transition = 'transform 9s cubic-bezier(0.1, 0.95, 0.15, 1)';
    disco.style.transform = `rotate(${motorRoleta.anguloAtual}deg)`;
    
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([20, 50, 20, 50, 20, 50]);
                    }
    if(typeof mostrarToast === 'function') mostrarToast("Rien ne va plus! (Apostas encerradas)", "🎲");

    // 🚨 A MÁGICA: O som da catraca desacelerando hiper-realista
    let tempoAtual = 0;
    let intervaloBase = 25; 
    const somCatraca = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    somCatraca.volume = 0.4;

    function tocarCatraca() {
        if (!motorRoleta.girando) return;
        
        if (!window.SantuarioSomPausado) {
            somCatraca.currentTime = 0;
            somCatraca.play().catch(e=>{});
        }
        
        if (window.Haptics) window.Haptics.toqueLeve();

        tempoAtual += intervaloBase;
        intervaloBase = 25 + Math.pow(tempoAtual / 600, 2.5); // Desaceleração exponencial dramática

        if (tempoAtual < 8600) { // Para um pouquinho antes da física CSS concluir
            setTimeout(tocarCatraca, intervaloBase);
        }
    }
    tocarCatraca();

    setTimeout(() => {
        verificarVitoriaRoleta(corApostada, corCaiu, aposta);
    }, 9000);
};

function verificarVitoriaRoleta(corApostada, corCaiu, aposta) {
    motorRoleta.girando = false;
    
    const disco = document.getElementById('disco-roleta');
    if(disco) {
        let anguloFinal = obterAnguloVisualReal(disco);
        disco.style.transition = 'none';
        disco.style.transform = `rotate(${anguloFinal}deg)`;
        void disco.offsetWidth;
        disco.classList.add('roleta-respirando');
    }

    let lucro = 0;
    let msgToast = "";
    let icone = "";

    // 🚨 AVALIAÇÃO E O "ZERO VERDE DO AFETO"
    if (corApostada === corCaiu) {
        if (corCaiu === "verde") {
            lucro = aposta * 14;
            // O JACKPOT SUPREMO DO RELACIONAMENTO
            msgToast = `ZERO VERDE! +${lucro}💰 E VOCÊ GANHOU UM MIMO ROMÂNTICO!`;
            icone = "💚";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#D4AF37', '#ffffff'], particleCount: 300, spread: 150});
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300, 100, 500]);
                    }
            
        } else {
            lucro = aposta * 2;
            msgToast = `Caiu no ${corCaiu.toUpperCase()}! +${lucro}💰`;
            icone = (corCaiu === "vermelho") ? "🔴" : "⚫";
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', (corCaiu==='vermelho'?'#e74c3c':'#2c3e50')], particleCount: 100});
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 400]);
                    }
        }
        
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, `Vitória na Roleta (${corCaiu.toUpperCase()})`);
        
    } else {
        msgToast = `Caiu no ${corCaiu.toUpperCase()}. A casa venceu.`;
        icone = "💸";
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
    }

    if(typeof mostrarToast === 'function') mostrarToast(msgToast, icone);
}


// ============================================================================
// ☄️ MOTOR FÍSICO, MATEMÁTICO E SONORO: PLINKO (MÚLTIPLAS BOLAS & RASTRO)
// ============================================================================

const roteadorAntesPlinko = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'plinko') {
        const mesa = document.getElementById('mesa-plinko');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            if (!motorPlinko.construido) construirPiramidePlinko();
        }
    } else {
        if(typeof roteadorAntesPlinko === 'function') roteadorAntesPlinko(nomeDoJogo);
    }
};

window.fecharMesaPlinko = function() {
    const mesa = document.getElementById('mesa-plinko');
    if(mesa) mesa.style.display = 'none';
};

let motorPlinko = {
    construido: false,
    linhas: 10, 
    multiplicadores: [50, 15, 5, 1.5, 0.2, 0.2, 1.5, 5, 15, 50], 
    coresCacapas: ['#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c']
};

window.ajustarApostaPlinko = function(valor) {
    const visor = document.getElementById('plinko-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function construirPiramidePlinko() {
    const board = document.getElementById('plinko-board');
    const cacapasDiv = document.getElementById('plinko-cacapas');
    if(!board || !cacapasDiv) return;
    
    // 🚨 Removemos a linha "board.innerHTML = ''" que estava deletando as caçapas!
    
    // 1. Pinos (Só constrói se o quadro estiver vazio para evitar duplicação)
    if (board.querySelectorAll('.plinko-pino').length === 0) {
        for (let linha = 0; linha < motorPlinko.linhas; linha++) {
            let qtdPinos = linha + 3; 
            for (let pino = 0; pino < qtdPinos; pino++) {
                let dot = document.createElement('div');
                dot.className = 'plinko-pino';
                let posX = 50 + ((pino - (qtdPinos - 1) / 2) * 8); 
                let posY = 10 + (linha * 8.5); 
                dot.style.left = `${posX}%`;
                dot.style.top = `${posY}%`;
                dot.id = `pino-${linha}-${pino}`;
                board.appendChild(dot);
            }
        }
    }

    // 2. Caçapas
    cacapasDiv.innerHTML = ""; // Limpa apenas as caçapas antigas
    for (let i = 0; i < motorPlinko.multiplicadores.length; i++) {
        let cacapa = document.createElement('div');
        cacapa.className = 'plinko-cacapa';
        cacapa.innerText = `${motorPlinko.multiplicadores[i]}x`;
        cacapa.style.background = motorPlinko.coresCacapas[i];
        cacapa.id = `cacapa-${i}`;
        cacapasDiv.appendChild(cacapa);
    }
    
    motorPlinko.construido = true;
}

// 🚨 SOM DA BOLINHA BATENDO (Permite Pitch Shifting por bola)
function criarSomBatidaPlinko() {
    const som = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3'); // Um 'ting' que vamos alterar
    return som;
}

window.soltarBolinhaPlinko = function() {
    const input = document.getElementById('plinko-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    const btn = document.getElementById('btn-plinko-jogar');
    if(btn) {
        btn.style.transform = "scale(0.95)";
        setTimeout(() => btn.style.transform = "scale(1)", 100);
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Lançamento no Plinko");

    const board = document.getElementById('plinko-board');
    const bola = document.createElement('div');
    bola.className = 'plinko-bola';
    board.appendChild(bola);

    let linhaAtual = 0;
    let posX = 50; 
    let posY = 2; 
    
    bola.style.left = `${posX}%`;
    bola.style.top = `${posY}%`;

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('plinkoDrop', 0.8);

    // 🚨 A MÁGICA: Cada bola ganha a sua própria física e áudio!
    const somBatida = criarSomBatidaPlinko();
    let frequenciaBatida = 2.0; // Começa agudo lá no topo da pirâmide

    let quedaInterval = setInterval(() => {
        if (linhaAtual >= motorPlinko.linhas) {
            clearInterval(quedaInterval);
            bola.remove();
            
            // FÍSICA PURA: Se a bola foi muito para o lado esquerdo (posX baixo) ou direito (posX alto), ela cai nas caçapas extremas
            let range = 4.0 * motorPlinko.linhas; // Distância máxima possível de ser viajada do centro
            let offsetCentral = (posX - 50); // - range a + range
            let proporcao = (offsetCentral + range) / (range * 2); // 0.0 a 1.0
            
            let bucketIndex = Math.floor(proporcao * motorPlinko.multiplicadores.length);
            if (bucketIndex < 0) bucketIndex = 0;
            if (bucketIndex >= motorPlinko.multiplicadores.length) bucketIndex = motorPlinko.multiplicadores.length - 1;

            pagarPlinko(bucketIndex, aposta);
            return;
        }

        // 🚨 RASTRO LUMINOSO (Cauda de Cometa)
        const fantasma = document.createElement('div');
        fantasma.className = 'plinko-bola';
        fantasma.style.left = `${posX}%`;
        fantasma.style.top = `${posY}%`;
        fantasma.style.opacity = '0.5';
        fantasma.style.transform = 'scale(0.8)';
        fantasma.style.transition = 'all 0.4s ease-out';
        board.appendChild(fantasma);
        setTimeout(() => fantasma.remove(), 400); // O fantasma some rápido

        // Matemática do Quique
        let direcao = Math.random() > 0.5 ? 1 : -1;
        posX += (direcao * 4);
        posY = 10 + (linhaAtual * 8.5); 
        
        bola.style.left = `${posX}%`;
        bola.style.top = `${posY}%`;

        // 🚨 A MÁGICA SONORA: O som fica mais grave (pesado) conforme a bola desce!
        if (!window.SantuarioSomPausado) {
            somBatida.currentTime = 0;
            somBatida.playbackRate = frequenciaBatida;
            somBatida.volume = 0.3 + (linhaAtual * 0.06); // Fica mais alto no fundo
            somBatida.play().catch(e=>{});
            frequenciaBatida -= 0.15; // O Pitch vai caindo para ficar grave
            if (frequenciaBatida < 0.5) frequenciaBatida = 0.5;
        }

        if(window.Haptics) window.Haptics.toqueLeve();

        // 🚨 FÍSICA: Dá um soquinho no pino que foi acertado
        const pinoBatido = document.elementFromPoint(
            bola.getBoundingClientRect().left + 10, 
            bola.getBoundingClientRect().top + 10
        );
        if (pinoBatido && pinoBatido.classList.contains('plinko-pino')) {
            pinoBatido.style.transform = 'scale(1.4)';
            pinoBatido.style.background = '#f1c40f'; // Brilha em ouro
            setTimeout(() => {
                pinoBatido.style.transform = 'scale(1)';
                pinoBatido.style.background = 'rgba(255,255,255,0.3)';
            }, 150);
        }

        linhaAtual++;
    }, 300);
};

function pagarPlinko(bucketIndex, aposta) {
    const mult = motorPlinko.multiplicadores[bucketIndex];
    const lucro = Math.floor(aposta * mult);
    
    const cacapa = document.getElementById(`cacapa-${bucketIndex}`);
    if(cacapa) {
        cacapa.classList.add('plinko-cacapa-hit');
        cacapa.style.transform = 'scale(1.2)';
        setTimeout(() => {
            cacapa.classList.remove('plinko-cacapa-hit');
            cacapa.style.transform = 'scale(1)';
        }, 200);
    }

    if (lucro > aposta) {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0); 
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, `Prêmio Plinko (${mult}x)`);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100, 200]);
                    }
        if(mult >= 15 && typeof confetti === 'function') confetti({colors: ['#e74c3c', '#f1c40f'], particleCount: 100}); 
        if(typeof mostrarToast === 'function') mostrarToast(`PLINKO! ${mult}x (+${lucro}💰)`, "✨");
    } else {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.6); 
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "Retorno Plinko");
        if(window.Haptics) window.Haptics.toqueLeve();
    }
}


// ============================================================================
// 🎫 MOTOR GRÁFICO, MATEMÁTICO E SONORO: RASPADINHA VIP (AUTO-REVEAL)
// ============================================================================

const roteadorAntesRaspadinha = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'raspadinha') {
        const mesa = document.getElementById('mesa-raspadinha');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            prepararBilheteRaspadinha(true); 
        }
    } else if (typeof roteadorAntesRaspadinha === 'function') {
        roteadorAntesRaspadinha(nomeDoJogo);
    }
};

window.fecharMesaRaspadinha = function() {
    if (motorRaspadinha.jogando && !motorRaspadinha.finalizado) {
        if(typeof mostrarToast === 'function') mostrarToast("Termine de raspar seu bilhete!", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-raspadinha');
    if(mesa) mesa.style.display = 'none';
};

let motorRaspadinha = {
    jogando: false,
    finalizado: true,
    apostaAtual: 0,
    lucro: 0,
    simbolosNaMesa: [],
    pixelsRaspados: 0,
    totalPixels: 0,
    tempoUltimoSomFriccao: 0, 
    simbolos: [
        { emoji: '💎', mult: 50 },
        { emoji: '🍀', mult: 20 },
        { emoji: '🍒', mult: 5 },
        { emoji: '🍋', mult: 2 },
        { emoji: '🥑', mult: 0 } 
    ],
    canvas: null,
    ctx: null
};

window.ajustarApostaRaspadinha = function(valor) {
    if (motorRaspadinha.jogando && !motorRaspadinha.finalizado) return;
    const visor = document.getElementById('raspadinha-aposta-input');
    if(!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function prepararBilheteRaspadinha(apenasVisual = false) {
    const grid = document.getElementById('raspadinha-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    for (let i = 0; i < 9; i++) {
        const div = document.createElement('div');
        div.className = 'raspadinha-celula';
        div.innerText = apenasVisual ? "❓" : motorRaspadinha.simbolosNaMesa[i];
        div.id = `rasp-celula-${i}`;
        grid.appendChild(div);
    }

    const canvas = document.getElementById('raspadinha-canvas');
    if (!canvas) return;
    motorRaspadinha.canvas = canvas;
    motorRaspadinha.ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // 🚨 Salva a área total para calcular a porcentagem raspada (Auto-Reveal)
    motorRaspadinha.totalPixels = canvas.width * canvas.height;
    
    motorRaspadinha.ctx.globalCompositeOperation = "source-over";
    
    let gradient = motorRaspadinha.ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#bdc3c7");
    gradient.addColorStop(0.5, "#ecf0f1");
    gradient.addColorStop(1, "#95a5a6");
    
    motorRaspadinha.ctx.fillStyle = gradient;
    motorRaspadinha.ctx.fillRect(0, 0, canvas.width, canvas.height);

    motorRaspadinha.ctx.fillStyle = "#34495e";
    motorRaspadinha.ctx.font = "bold 24px Arial";
    motorRaspadinha.ctx.textAlign = "center";
    motorRaspadinha.ctx.fillText("RASPE AQUI", canvas.width/2, canvas.height/2);

    configurarToqueRaspadinha();
}

window.comprarRaspadinha = function() {
    const input = document.getElementById('raspadinha-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Compra de Bilhete");

    motorRaspadinha.jogando = true;
    motorRaspadinha.finalizado = false;
    motorRaspadinha.apostaAtual = aposta;
    motorRaspadinha.pixelsRaspados = 0;

    let sorte = Math.random();
    motorRaspadinha.simbolosNaMesa = Array(9).fill("");
    motorRaspadinha.lucro = 0;

    if (sorte < 0.40) { // 40% de chance de vitória
        let symSorte = Math.random();
        let simboloVencedor;
        if (symSorte < 0.02) simboloVencedor = motorRaspadinha.simbolos[0]; 
        else if (symSorte < 0.10) simboloVencedor = motorRaspadinha.simbolos[1]; 
        else if (symSorte < 0.40) simboloVencedor = motorRaspadinha.simbolos[2]; 
        else simboloVencedor = motorRaspadinha.simbolos[3]; 

        motorRaspadinha.lucro = aposta * simboloVencedor.mult;

        let posicoesVit = [];
        while(posicoesVit.length < 3) {
            let p = Math.floor(Math.random() * 9);
            if (!posicoesVit.includes(p)) posicoesVit.push(p);
        }
        
        posicoesVit.forEach(p => motorRaspadinha.simbolosNaMesa[p] = simboloVencedor.emoji);
        
        for (let i = 0; i < 9; i++) {
            if (motorRaspadinha.simbolosNaMesa[i] === "") {
                let lixo = motorRaspadinha.simbolos[Math.floor(Math.random() * 5)].emoji;
                while (lixo === simboloVencedor.emoji) {
                    lixo = motorRaspadinha.simbolos[Math.floor(Math.random() * 5)].emoji;
                }
                motorRaspadinha.simbolosNaMesa[i] = lixo;
            }
        }
    } else { // 60% de chance de perder (Near Miss - Quase Lá)
        let lixos = [
            motorRaspadinha.simbolos[0].emoji, motorRaspadinha.simbolos[0].emoji, 
            motorRaspadinha.simbolos[1].emoji, motorRaspadinha.simbolos[1].emoji, 
            motorRaspadinha.simbolos[2].emoji, motorRaspadinha.simbolos[2].emoji, 
            motorRaspadinha.simbolos[3].emoji, motorRaspadinha.simbolos[3].emoji, 
            motorRaspadinha.simbolos[4].emoji 
        ];
        lixos.sort(() => Math.random() - 0.5);
        motorRaspadinha.simbolosNaMesa = lixos;
    }

    prepararBilheteRaspadinha(false);

    const canvas = document.getElementById('raspadinha-canvas');
    canvas.style.opacity = "1";
    canvas.style.pointerEvents = "auto";
    
    const btn = document.getElementById('btn-raspadinha-comprar');
    btn.innerHTML = "RASPE A TELA COM O DEDO 👆";
    btn.style.background = "#555";
    btn.style.pointerEvents = "none";
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 50]);
                    }
};

function configurarToqueRaspadinha() {
    const canvas = motorRaspadinha.canvas;
    let raspando = false;
    let ultimaChamada = 0; // Para throttling de performance

    const apagarTinta = (x, y) => {
        if (!motorRaspadinha.jogando || motorRaspadinha.finalizado) return;
        
        const ctx = motorRaspadinha.ctx;
        
        // 🚨 MOEDA MAIOR: Aumentado o raio de 18 para 35! Limpa muito mais rápido!
        const RAIO_MOEDA = 35;
        
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, RAIO_MOEDA, 0, Math.PI * 2); 
        ctx.fill();

        let agora = Date.now();
        if (agora - motorRaspadinha.tempoUltimoSomFriccao > 150) { 
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('raspando', 0.5);
            motorRaspadinha.tempoUltimoSomFriccao = agora;
            if(window.Haptics && Math.random() > 0.6) window.Haptics.toqueLeve();
        }

        // 🚨 A MÁGICA DO AUTO-REVEAL: Calcula os "arranhões" com base na área da moeda
        // A cada raspada de raio 35, ela apaga aproximadamente 3848 pixels da tela
        motorRaspadinha.pixelsRaspados += (Math.PI * Math.pow(RAIO_MOEDA, 2));
        
        // Se ela raspar 60% da área do bilhete, o jogo revela o resto sozinho!
        if (motorRaspadinha.pixelsRaspados > (motorRaspadinha.totalPixels * 0.6)) {
            revelarTudoRaspadinha();
        }
    };

    // 🚨 THROTTLING: Impede o iPhone de engasgar com 120Hz de toque na tela
    const desenharComThrottling = (e) => {
        let agora = Date.now();
        if (agora - ultimaChamada < 15) return; // Limita a ~60FPS
        ultimaChamada = agora;
        
        const rect = canvas.getBoundingClientRect();
        apagarTinta(e.touches[0].clientX - rect.left, e.touches[0].clientY - rect.top);
    };

    canvas.addEventListener('touchstart', (e) => {
        raspando = true;
        desenharComThrottling(e);
    }, {passive: false});

    canvas.addEventListener('touchmove', (e) => {
        if (!raspando) return;
        if(e.cancelable) e.preventDefault(); 
        desenharComThrottling(e);
    }, {passive: false});

    canvas.addEventListener('touchend', () => raspando = false);
    canvas.addEventListener('touchcancel', () => raspando = false);

    // Mouse PC
    canvas.addEventListener('mousedown', (e) => {
        raspando = true;
        const rect = canvas.getBoundingClientRect();
        apagarTinta(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (!raspando) return;
        const rect = canvas.getBoundingClientRect();
        apagarTinta(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('mouseup', () => raspando = false);
    canvas.addEventListener('mouseleave', () => raspando = false);
}

function revelarTudoRaspadinha() {
    motorRaspadinha.finalizado = true;
    
    const canvas = motorRaspadinha.canvas;
    canvas.style.transition = "opacity 0.8s ease-out"; // 🚨 Dissolução mágica suave
    canvas.style.opacity = "0";
    canvas.style.pointerEvents = "none";

    let contagem = {};
    motorRaspadinha.simbolosNaMesa.forEach(s => contagem[s] = (contagem[s] || 0) + 1);
    
    let achouVencedor = false;
    for (const [simbolo, qtd] of Object.entries(contagem)) {
        if (qtd >= 3) {
            achouVencedor = true;
            for (let i = 0; i < 9; i++) {
                if (motorRaspadinha.simbolosNaMesa[i] === simbolo) {
                    const cel = document.getElementById(`rasp-celula-${i}`);
                    if(cel) cel.classList.add('raspadinha-vitoria-anim');
                }
            }
        }
    }

    // Atraso de 0.8s para deixar a dissolução da tinta acontecer antes da tela piscar os prêmios
    setTimeout(() => {
        if (motorRaspadinha.lucro > 0) {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(motorRaspadinha.lucro, "Prêmio na Raspadinha!");
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#bdc3c7', '#D4AF37'], particleCount: 200});
            if(typeof mostrarToast === 'function') mostrarToast(`RASPOU E GANHOU! +${motorRaspadinha.lucro}💰`, "🎫");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
            if(typeof mostrarToast === 'function') mostrarToast("Não foi dessa vez. Tente novamente!", "💸");
        }

        const btn = document.getElementById('btn-raspadinha-comprar');
        if(btn) {
            btn.innerHTML = "Comprar Novo Bilhete 🎫";
            btn.style.background = "linear-gradient(145deg, #bdc3c7, #7f8c8d)";
            btn.style.pointerEvents = "auto";
        }
        motorRaspadinha.jogando = false;
    }, 800);
}


// ============================================================================
// 🗼 MOTOR MATEMÁTICO, GRÁFICO E SONORO: A TORRE (TOWERS) COM TENSÃO VERTICAL
// ============================================================================

const roteadorAntesTowers = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'towers') {
        const mesa = document.getElementById('mesa-towers');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            desenharGradeTowers(); 
        }
    } else if (typeof roteadorAntesTowers === 'function') {
        roteadorAntesTowers(nomeDoJogo);
    }
};

window.fecharMesaTowers = function() {
    if (motorTowers.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("Escalada em andamento! Retire o lucro.", "⚠️");
        return;
    }
    const mesa = document.getElementById('mesa-towers');
    if(mesa) mesa.style.display = 'none';
};

// A Matemática do Vício: 8 andares. Chance de passar = 66% por andar.
const MULTIPLICADORES_TOWERS = [1.42, 2.02, 2.88, 4.09, 5.82, 8.27, 11.76, 16.71];

let motorTowers = {
    jogando: false,
    apostaAtual: 0,
    andarAtual: 0, // Vai de 0 a 7 (0 é o chão)
    lucroPotencial: 0,
    frequenciaSomTowers: 1.0, 
    gradeSecreta: [] 
};

// 🚨 O Áudio Manipulável do Cristal
const somCristalTowers = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

window.ajustarApostaTowers = function(valor) {
    if (motorTowers.jogando) return;
    const visor = document.getElementById('towers-aposta-input');
    if(!visor) return;
    
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function desenharGradeTowers() {
    const grid = document.getElementById('towers-grid');
    if(!grid) return;
    grid.innerHTML = "";
    
    // 🚨 CORREÇÃO: Restaurada a sua ordem original (0 a 7)! 
    // O CSS 'column-reverse' cuida de empurrar o 0 para a base da tela perfeitamente.
    for (let linha = 0; linha < 8; linha++) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'towers-row towers-row-disabled'; 
        rowDiv.id = `towers-row-${linha}`;

        for (let col = 0; col < 3; col++) {
            const bloco = document.createElement('div');
            bloco.className = 'towers-bloco';
            bloco.id = `towers-bloco-${linha}-${col}`;
            
            bloco.onclick = () => {
                if (!motorTowers.jogando) {
                    if(typeof mostrarToast === 'function') mostrarToast("Aposte primeiro!", "💸");
                } else if (linha === motorTowers.andarAtual) {
                    clicarBlocoTowers(linha, col);
                }
            };
            rowDiv.appendChild(bloco);
        }
        grid.appendChild(rowDiv);
    }
}

window.iniciarRodadaTowers = function() {
    const input = document.getElementById('towers-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Escalada na Torre");

    motorTowers.jogando = true;
    motorTowers.apostaAtual = aposta;
    motorTowers.andarAtual = 0;
    motorTowers.lucroPotencial = aposta;
    motorTowers.frequenciaSomTowers = 1.0; // Reseta a música!

    const btnIniciar = document.getElementById('btn-towers-iniciar');
    const painelSaque = document.getElementById('towers-painel-saque');
    if(btnIniciar) btnIniciar.classList.add('escondido');
    if(painelSaque) painelSaque.classList.remove('escondido');
    
    const lucroVisor = document.getElementById('towers-lucro-texto');
    const multVisor = document.getElementById('towers-proximo-mult');
    if(lucroVisor) lucroVisor.innerText = "0";
    if(multVisor) multVisor.innerText = MULTIPLICADORES_TOWERS[0];

    motorTowers.gradeSecreta = [];
    for (let i = 0; i < 8; i++) {
        let linha = [0, 0, 0];
        let bombaPos = Math.floor(Math.random() * 3);
        linha[bombaPos] = 1;
        motorTowers.gradeSecreta.push(linha);
    }

    desenharGradeTowers(); 
    ativarAndarTowers(0); // Começa pela base!
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100]);
                    }
};

function ativarAndarTowers(linha) {
    if (linha > 0) {
        const linhaAnterior = document.getElementById(`towers-row-${linha - 1}`);
        if(linhaAnterior) {
            linhaAnterior.classList.add('towers-row-disabled');
            Array.from(linhaAnterior.children).forEach(b => b.classList.remove('towers-bloco-ativo'));
        }
    }

    const linhaAtual = document.getElementById(`towers-row-${linha}`);
    if(linhaAtual) {
        linhaAtual.classList.remove('towers-row-disabled');
        Array.from(linhaAtual.children).forEach(bloco => {
            bloco.classList.add('towers-bloco-ativo');
            // 🚨 EFEITO DE PULSO NEON AO ATIVAR O ANDAR
            bloco.style.transform = "scale(1.1)";
            bloco.style.boxShadow = "0 0 15px #00d4ff";
            setTimeout(() => {
                bloco.style.transform = "scale(1)";
                bloco.style.boxShadow = "none";
            }, 300);
        });
    }
}

function clicarBlocoTowers(linha, col) {
    const ehBomba = motorTowers.gradeSecreta[linha][col] === 1;
    const blocoClicado = document.getElementById(`towers-bloco-${linha}-${col}`);
    if(!blocoClicado) return;

    const linhaDOM = document.getElementById(`towers-row-${linha}`);
    if(linhaDOM) {
        Array.from(linhaDOM.children).forEach(b => b.classList.remove('towers-bloco-ativo'));
    }

    if (ehBomba) {
        // PERDEU TUDO
        blocoClicado.classList.add('towers-bloco-bomb');
        blocoClicado.innerHTML = "💣";
        revelarRestoAndarTowers(linha, col);
        
        // 🚨 FÍSICA: O SOLAVANCO DE QUEDA!
        const grade = document.getElementById('towers-grid');
        if (grade) {
            grade.style.transition = "transform 0.1s ease-in-out";
            grade.style.transform = "translateY(20px)"; // Despenca visualmente
            grade.style.boxShadow = "inset 0 0 50px rgba(255, 0, 50, 0.8)"; // Luz de emergência
            setTimeout(() => {
                grade.style.transform = "translateY(0)";
            }, 150);
        }

        if(window.CassinoAudio && !window.SantuarioSomPausado) {
            window.CassinoAudio.tocar('minesBomba', 1.0);
            setTimeout(() => window.CassinoAudio.tocar('slotsLose', 0.8), 300); 
        }
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 400]);
                    }
        
        encerrarTowers("derrota");
    } else {
        // 🚨 A ESCADA MUSICAL DO CRISTAL
        if (!window.SantuarioSomPausado) {
            somCristalTowers.currentTime = 0;
            somCristalTowers.playbackRate = motorTowers.frequenciaSomTowers;
            somCristalTowers.volume = 0.5 + (linha * 0.05); // Mais alto no topo
            somCristalTowers.play().catch(e=>{});
            
            motorTowers.frequenciaSomTowers += 0.15; // O tom sobe!
            if (motorTowers.frequenciaSomTowers > 2.5) motorTowers.frequenciaSomTowers = 2.5;
}
if (window.Haptics && navigator.vibrate) {
    navigator.vibrate([30 + (linha * 5)]); // O "clique" físico fica mais forte no topo
}

        blocoClicado.classList.add('towers-bloco-safe');
        blocoClicado.innerHTML = "💎";
        revelarRestoAndarTowers(linha, col);

        motorTowers.lucroPotencial = Math.floor(motorTowers.apostaAtual * MULTIPLICADORES_TOWERS[linha]);
        const lucroVisor = document.getElementById('towers-lucro-texto');
        if(lucroVisor) lucroVisor.innerText = motorTowers.lucroPotencial;

        motorTowers.andarAtual++;

        if (motorTowers.andarAtual < 8) {
            const multVisor = document.getElementById('towers-proximo-mult');
            if(multVisor) multVisor.innerText = MULTIPLICADORES_TOWERS[motorTowers.andarAtual];
            
            setTimeout(() => { ativarAndarTowers(motorTowers.andarAtual); }, 400); // 🚨 Delay de suspense para o próximo andar!
        } else {
            setTimeout(() => { sacarTowers(); }, 500); // Zerou a torre
        }
    }
}

function revelarRestoAndarTowers(linha, colClicada) {
    for (let c = 0; c < 3; c++) {
        if (c !== colClicada) {
            let bloco = document.getElementById(`towers-bloco-${linha}-${c}`);
            if(bloco) {
                bloco.style.opacity = "0.5";
                if (motorTowers.gradeSecreta[linha][c] === 1) {
                    bloco.innerHTML = "💣";
                } else {
                    bloco.innerHTML = "💎";
                }
            }
        }
    }
}

window.sacarTowers = function() {
    if (!motorTowers.jogando) return;
    
    if(typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(motorTowers.lucroPotencial, "Saque nas Alturas da Torre");
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesSaque', 1.0);

    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100, 50, 400]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#00d4ff', '#D4AF37', '#ffffff'], particleCount: 250, spread: 120, origin: {y: 0.1}}); 
    if(typeof mostrarToast === 'function') mostrarToast(`Saque nas Alturas! +${motorTowers.lucroPotencial}💰`, "🗼");

    encerrarTowers("vitoria");
};

function encerrarTowers(resultado) {
    motorTowers.jogando = false;
    
    const grade = document.getElementById('towers-grid');
    if (resultado === "vitoria" && grade) {
        grade.style.boxShadow = "inset 0 0 50px rgba(0, 212, 255, 0.4)"; 
        setTimeout(() => grade.style.boxShadow = "none", 3000);
    } else if (resultado === "derrota" && grade) {
        setTimeout(() => grade.style.boxShadow = "none", 3000);
    }

    document.getElementById('btn-towers-iniciar').classList.remove('escondido');
    document.getElementById('towers-painel-saque').classList.add('escondido');
    
    if (resultado === "derrota") {
        if(typeof mostrarToast === 'function') mostrarToast("Você caiu da torre! A casa vence.", "🔥");
    }
}

// ============================================================================
// ↕️ MOTOR MATEMÁTICO, FÍSICO E SONORO: HI-LO (COM SUSPENSE E STREAK)
// ============================================================================

const roteadorAntesHiLo = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'hilo') {
        const mesa = document.getElementById('mesa-hilo');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            resetarMesaHiLo();
        }
    } else if (typeof roteadorAntesHiLo === 'function') {
        roteadorAntesHiLo(nomeDoJogo);
    }
};

window.fecharMesaHiLo = function() {
    if (motorHiLo.jogando) {
        if(typeof mostrarToast === 'function') mostrarToast("Aposta rolando! Retire o lucro primeiro.", "⚠️");
        return;
    }
    somTensaoHiLo.pause();
    const mesa = document.getElementById('mesa-hilo');
    if(mesa) mesa.style.display = 'none';
};

let motorHiLo = {
    jogando: false,
    aposta: 0,
    lucroPotencial: 0,
    multiplicadorAtual: 1.00,
    cartaAtual: 8,
    acertosSeguidos: 0, // 🚨 Rastreador de Combo para a Escada Musical
    frequenciaSomAcerto: 1.0,
    naipes: ['♠', '♥', '♦', '♣']
};

// 🚨 MOTOR DE TENSÃO DO HI-LO
const somTensaoHiLo = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somTensaoHiLo.loop = true;
const somAcertoHiLo = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');

window.ajustarApostaHiLo = function(valor) {
    if (motorHiLo.jogando) return;
    const visor = document.getElementById('hilo-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function formatarValorCarta(valor) {
    if(valor === 11) return 'J';
    if(valor === 12) return 'Q';
    if(valor === 13) return 'K';
    if(valor === 14) return 'A';
    return valor.toString();
}

function gerarCartaAleatoria() {
    return Math.floor(Math.random() * 13) + 2; 
}

function atualizarVisualCarta(valor) {
    const cartaFrente = document.getElementById('hilo-carta-frente');
    const topo = document.getElementById('hilo-topo');
    const centro = document.getElementById('hilo-centro');
    const base = document.getElementById('hilo-base');

    const naipe = motorHiLo.naipes[Math.floor(Math.random() * motorHiLo.naipes.length)];
    const cor = (naipe === '♥' || naipe === '♦') ? 'vermelha' : 'preta';
    
    cartaFrente.className = `carta-bj ${cor}`;
    let strValor = formatarValorCarta(valor);

    if(topo) topo.innerText = strValor + naipe;
    if(centro) centro.innerText = naipe;
    if(base) base.innerText = strValor + naipe;
}

function calcularMultiplicadores(valorCarta) {
    let cartasMaiores = 14 - valorCarta;
    let cartasMenores = valorCarta - 2;

    let probMaior = cartasMaiores / 12;
    let probMenor = cartasMenores / 12;

    let multMaior = probMaior > 0 ? (0.96 / probMaior) : 0;
    let multMenor = probMenor > 0 ? (0.96 / probMenor) : 0;

    return { 
        maior: Math.max(1.05, multMaior).toFixed(2), 
        menor: Math.max(1.05, multMenor).toFixed(2) 
    };
}

function atualizarBotoesEPlacar() {
    const mults = calcularMultiplicadores(motorHiLo.cartaAtual);
    const btnMaior = document.getElementById('btn-hilo-maior');
    const btnMenor = document.getElementById('btn-hilo-menor');

    if (mults.maior == 0) {
        if(btnMaior) btnMaior.classList.add('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-maior');
        if(m) m.innerText = "Bloqueado";
    } else {
        if(btnMaior) btnMaior.classList.remove('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-maior');
        if(m) m.innerText = mults.maior + "x";
    }

    if (mults.menor == 0) {
        if(btnMenor) btnMenor.classList.add('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-menor');
        if(m) m.innerText = "Bloqueado";
    } else {
        if(btnMenor) btnMenor.classList.remove('hilo-btn-bloqueado');
        const m = document.getElementById('hilo-mult-menor');
        if(m) m.innerText = mults.menor + "x";
    }

    const lTexto = document.getElementById('hilo-lucro-texto');
    const mTexto = document.getElementById('hilo-multiplicador-texto');
    if(lTexto) lTexto.innerText = motorHiLo.lucroPotencial;
    if(mTexto) mTexto.innerText = motorHiLo.multiplicadorAtual.toFixed(2);
}

window.iniciarRodadaHiLo = function() {
    const input = document.getElementById('hilo-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Aposta no Hi-Lo");

    motorHiLo.jogando = true;
    motorHiLo.aposta = aposta;
    motorHiLo.lucroPotencial = aposta;
    motorHiLo.multiplicadorAtual = 1.00;
    motorHiLo.acertosSeguidos = 0;
    motorHiLo.frequenciaSomAcerto = 1.0;

    const pAposta = document.getElementById('hilo-painel-aposta');
    const bIniciar = document.getElementById('btn-hilo-iniciar');
    const pLucro = document.getElementById('hilo-painel-lucro');
    const pDecisao = document.getElementById('hilo-painel-decisao');
    
    if(pAposta) pAposta.classList.add('escondido');
    if(bIniciar) bIniciar.classList.add('escondido');
    if(pLucro) pLucro.classList.remove('escondido');
    if(pDecisao) pDecisao.classList.remove('escondido');

    const cartaFrente = document.getElementById('hilo-carta-frente');
    if(cartaFrente) {
        cartaFrente.classList.remove('hilo-carta-girando');
        void cartaFrente.offsetWidth; 
        cartaFrente.classList.add('hilo-carta-girando');
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 100]);
                    }

    setTimeout(() => {
        motorHiLo.cartaAtual = gerarCartaAleatoria();
        atualizarVisualCarta(motorHiLo.cartaAtual);
        atualizarBotoesEPlacar();
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.7);
    }, 300);
};

window.adivinharHiLo = function(escolha) {
    if (!motorHiLo.jogando) return;
    
    const painelDecisao = document.getElementById('hilo-painel-decisao');
    if(painelDecisao) painelDecisao.style.pointerEvents = 'none'; // Trava a mesa

    let novaCarta = gerarCartaAleatoria();
    while (novaCarta === motorHiLo.cartaAtual) {
        novaCarta = gerarCartaAleatoria();
    }

    let venceu = false;
    let multCalculado = calcularMultiplicadores(motorHiLo.cartaAtual);
    let ganhoMultiplicador = 1.00;

    if (escolha === 'maior' && novaCarta > motorHiLo.cartaAtual) {
        venceu = true;
        ganhoMultiplicador = parseFloat(multCalculado.maior);
    } else if (escolha === 'menor' && novaCarta < motorHiLo.cartaAtual) {
        venceu = true;
        ganhoMultiplicador = parseFloat(multCalculado.menor);
    }

    const cartaFrente = document.getElementById('hilo-carta-frente');
    
    // 🚨 O SQUEEZE: Suspense pesado antes de revelar a carta
    if (!window.SantuarioSomPausado) {
        somTensaoHiLo.currentTime = 0;
        // O coração bate mais rápido a cada acerto em sequência!
        somTensaoHiLo.playbackRate = 1.0 + (motorHiLo.acertosSeguidos * 0.15); 
        somTensaoHiLo.volume = 0.6;
        somTensaoHiLo.play().catch(e=>{});
    }

    if (cartaFrente) {
        cartaFrente.style.transform = "scale(1.05)";
        cartaFrente.style.boxShadow = "0 0 30px rgba(241, 196, 15, 0.5)"; // Brilho de expectativa
    }
    
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }

    // O Tempo do Medo (1.2 segundos de coração batendo antes de virar)
    setTimeout(() => {
        somTensaoHiLo.pause();
        
        if(cartaFrente) {
            cartaFrente.style.transform = "scale(1)";
            cartaFrente.style.boxShadow = "none";
            cartaFrente.classList.remove('hilo-carta-girando');
            void cartaFrente.offsetWidth; 
            cartaFrente.classList.add('hilo-carta-girando');
        }
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }

        setTimeout(() => {
            motorHiLo.cartaAtual = novaCarta;
            atualizarVisualCarta(motorHiLo.cartaAtual);
            
            if (venceu) {
                motorHiLo.acertosSeguidos++;
                
                if(cartaFrente) {
                    cartaFrente.classList.add('hilo-vitoria-glow');
                    setTimeout(() => cartaFrente.classList.remove('hilo-vitoria-glow'), 500);
                }
                
                motorHiLo.multiplicadorAtual *= ganhoMultiplicador;
                motorHiLo.lucroPotencial = Math.floor(motorHiLo.aposta * motorHiLo.multiplicadorAtual);
                
                atualizarBotoesEPlacar();
                if(painelDecisao) painelDecisao.style.pointerEvents = 'auto';
                
                // 🚨 ESCADA MUSICAL: O plin fica mais agudo e frenético!
                if (!window.SantuarioSomPausado) {
                    somAcertoHiLo.currentTime = 0;
                    somAcertoHiLo.playbackRate = motorHiLo.frequenciaSomAcerto;
                    somAcertoHiLo.volume = 0.8;
                    somAcertoHiLo.play().catch(e=>{});
                    
                    motorHiLo.frequenciaSomAcerto += 0.1;
                    if (motorHiLo.frequenciaSomAcerto > 2.5) motorHiLo.frequenciaSomAcerto = 2.5;
                }
                
                if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 50, 100]);
                    }
            } else {
                if(cartaFrente) cartaFrente.classList.add('hilo-derrota-glow');
                
                // 🚨 EXPLOSÃO DE DERROTA VISUAL
                const mesa = document.getElementById('mesa-hilo');
                if (mesa) {
                    mesa.style.boxShadow = "inset 0 0 80px rgba(231, 76, 60, 0.8)";
                    setTimeout(() => mesa.style.boxShadow = "none", 400);
                }

                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 500]);
                    }
                
                encerrarRodadaHiLo("derrota");
            }
        }, 300); // Tempo da animação CSS da carta girando
    }, 1200); // O Squeeze de 1.2 segundos
};

window.sacarHiLo = function() {
    if (!motorHiLo.jogando) return;
    
    if(typeof atualizarPontosCasal === 'function') {
        atualizarPontosCasal(motorHiLo.lucroPotencial, "Saque Mestre no Hi-Lo");
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('minesSaque', 1.0);

    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100, 50, 400]);
                    }
    if(typeof confetti === 'function') confetti({colors: ['#e67e22', '#D4AF37'], particleCount: 200});
    if(typeof mostrarToast === 'function') mostrarToast(`Lucro Perfeito! +${motorHiLo.lucroPotencial}💰`, "↕️");

    encerrarRodadaHiLo("vitoria");
};

function encerrarRodadaHiLo(resultado) {
    motorHiLo.jogando = false;
    somTensaoHiLo.pause();
    
    const painelDecisao = document.getElementById('hilo-painel-decisao');
    if(painelDecisao) painelDecisao.style.pointerEvents = 'auto';
    
    setTimeout(() => {
        resetarMesaHiLo();
        if (resultado === "derrota") {
            if(typeof mostrarToast === 'function') mostrarToast("Errou! A banca levou.", "🔥");
        }
    }, 1500); 
}

function resetarMesaHiLo() {
    motorHiLo.jogando = false;
    const pAposta = document.getElementById('hilo-painel-aposta');
    const bIniciar = document.getElementById('btn-hilo-iniciar');
    const pLucro = document.getElementById('hilo-painel-lucro');
    const pDecisao = document.getElementById('hilo-painel-decisao');
    
    if(pAposta) pAposta.classList.remove('escondido');
    if(bIniciar) bIniciar.classList.remove('escondido');
    if(pLucro) pLucro.classList.add('escondido');
    if(pDecisao) pDecisao.classList.add('escondido');
    
    const cartaFrente = document.getElementById('hilo-carta-frente');
    if(cartaFrente) cartaFrente.className = "carta-bj oculta";
    
    const topo = document.getElementById('hilo-topo');
    const centro = document.getElementById('hilo-centro');
    const base = document.getElementById('hilo-base');
    if(topo) topo.innerText = "";
    if(centro) centro.innerText = "";
    if(base) base.innerText = "";
}


// ============================================================================
// 🎲 MOTOR MATEMÁTICO E SONORO: DADO DE OURO (CRYPTO DICE HIGH STAKES)
// ============================================================================

const roteadorAntesDice = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'dice') {
        const mesa = document.getElementById('mesa-dice');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            atualizarSliderDice(); 
        }
    } else if (typeof roteadorAntesDice === 'function') {
        roteadorAntesDice(nomeDoJogo);
    }
};

window.fecharMesaDice = function() {
    if (motorDice.rolando) {
        if(typeof mostrarToast === 'function') mostrarToast("O dado está girando!", "⚠️");
        return;
    }
    somTickDice.pause();
    const mesa = document.getElementById('mesa-dice');
    if(mesa) mesa.style.display = 'none';
};

let motorDice = {
    rolando: false,
    aposta: 0,
    chanceVitoria: 50,
    multiplicador: 1.98 
};

// 🚨 O MOTOR SONORO DO DADO (Para criar tensão na desaceleração)
const somTickDice = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');

window.ajustarApostaDice = function(valor) {
    if (motorDice.rolando) return;
    const visor = document.getElementById('dice-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.atualizarSliderDice = function() {
    if (motorDice.rolando) return;
    
    const slider = document.getElementById('dice-slider');
    if(!slider) return;
    let valor = parseFloat(slider.value);
    
    motorDice.chanceVitoria = valor;
    motorDice.multiplicador = (99 / motorDice.chanceVitoria);

    const alvoV = document.getElementById('dice-alvo-visor');
    const chanceV = document.getElementById('dice-chance-visor');
    const multV = document.getElementById('dice-mult-visor');
    
    if(alvoV) alvoV.innerText = motorDice.chanceVitoria.toFixed(2);
    if(chanceV) chanceV.innerText = motorDice.chanceVitoria.toFixed(0) + "%";
    if(multV) multV.innerText = motorDice.multiplicador.toFixed(2) + "x";

    const track = document.getElementById('dice-track-visual');
    const thumb = document.getElementById('dice-thumb-visual');
    
    if(track) track.style.background = `linear-gradient(to right, #00b09b 0%, #96c93d ${valor}%, #ff0844 ${valor}%, #ffb199 100%)`;
    if(thumb) thumb.style.left = `${valor}%`;
    
    if(window.Haptics && Math.random() > 0.8) window.Haptics.toqueLeve();
};

window.jogarDice = function() {
    if (motorDice.rolando) return;

    const input = document.getElementById('dice-aposta-input');
    if(!input) return;
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Rolou o Dado");

    motorDice.rolando = true;
    
    const visor = document.getElementById('dice-resultado-visor');
    const anel = document.getElementById('dice-anel-energia');
    
    if(visor) {
        visor.classList.remove('dice-vitoria-glow', 'dice-derrota-glow');
        visor.classList.add('dice-texto-rolando');
        visor.style.color = "#fff";
    }
    
    if(anel) anel.classList.add('dice-anel-rolando');
    
    const btn = document.getElementById('btn-dice-iniciar');
    if(btn) {
        btn.style.opacity = "0.5";
        btn.style.pointerEvents = "none";
    }

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('diceRoll', 0.8);

    let numeroSorteado = (Math.random() * 100).toFixed(2);
    let tempoRolagem = 0;
    let intervalo = 30; // Começa absurdamente rápido
    let rolagens = 0;

    // 🚨 A MÁGICA: Loop recursivo para aplicar fricção/desaceleração e o Estrobo de Cores
    function rodarDadoAnimacao() {
        let numTemp = (Math.random() * 100).toFixed(2);
        if(visor) visor.innerText = numTemp;

        // 🚨 ESTROBO DA ESPERANÇA: Pinta a tela se está ganhando ou perdendo naquele milissegundo!
        if (parseFloat(numTemp) < motorDice.chanceVitoria) {
            if(visor) visor.style.color = "#2ecc71";
            if(anel) anel.style.borderColor = "rgba(46, 204, 113, 0.4)";
        } else {
            if(visor) visor.style.color = "#e74c3c";
            if(anel) anel.style.borderColor = "rgba(231, 76, 60, 0.4)";
        }

        // 🚨 PITCH SHIFTING: O clique do dado vai ficando mais agudo e lento
        if (!window.SantuarioSomPausado) {
            somTickDice.currentTime = 0;
            somTickDice.playbackRate = 1.0 + (rolagens * 0.05);
            if (somTickDice.playbackRate > 3.0) somTickDice.playbackRate = 3.0;
            somTickDice.volume = 0.4;
            somTickDice.play().catch(e=>{});
        }

        if(window.Haptics && rolagens % 3 === 0) navigator.vibrate(10); // Vibração que acompanha a lentidão

        rolagens++;
        tempoRolagem += intervalo;
        intervalo = 30 + Math.pow(rolagens, 1.8); // A curva inercial de frenagem

        if (tempoRolagem < 2500) { // 2.5s de pura tensão
            setTimeout(rodarDadoAnimacao, intervalo);
        } else {
            // FIM DA ROLAGEM
            if(visor) {
                visor.classList.remove('dice-texto-rolando');
                visor.style.color = "#fff";
                visor.innerText = numeroSorteado;
            }
            if(anel) {
                anel.classList.remove('dice-anel-rolando'); 
                anel.style.border = "4px solid rgba(0, 242, 254, 0.2)";
            }
            
            finalizarRolagemDice(parseFloat(numeroSorteado), aposta);
        }
    }
    
    rodarDadoAnimacao(); // Dispara o motor inercial
};

function finalizarRolagemDice(resultado, aposta) {
    const visor = document.getElementById('dice-resultado-visor');
    const anel = document.getElementById('dice-anel-energia');
    const btn = document.getElementById('btn-dice-iniciar');
    
    let venceu = resultado < motorDice.chanceVitoria;

    if (venceu) {
        let lucro = Math.floor(aposta * motorDice.multiplicador);
        
        // 🚨 O MEGA JACKPOT DE RISCO (Menos de 15% de chance)
        if (motorDice.chanceVitoria <= 15) {
            if(visor) visor.classList.add('dice-vitoria-glow');
            if(anel) {
                anel.style.borderColor = "#f1c40f"; // Ouro Supremo!
                anel.style.boxShadow = "0 0 50px rgba(241, 196, 15, 0.8), inset 0 0 25px rgba(241, 196, 15, 0.5)";
            }
            
            // Tremor de tela absurdo
            const mesa = document.getElementById('mesa-dice');
            if(mesa) {
                mesa.style.transform = "scale(1.05)";
                setTimeout(()=> mesa.style.transform = "scale(1)", 150);
            }

            if(window.CassinoAudio && !window.SantuarioSomPausado) {
                window.CassinoAudio.tocar('slotsWin', 1.0);
                setTimeout(()=> window.CassinoAudio.tocar('slotsWin', 1.0), 300); // Toca dobrado!
            }
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 300, 100, 500, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#e67e22', '#ffffff'], particleCount: 300, spread: 160});
            if(typeof mostrarToast === 'function') mostrarToast(`🔥 MEGA JACKPOT EXTREMO! +${lucro}💰`, "👑");
            
        } else {
            // Vitória Normal
            if(visor) visor.classList.add('dice-vitoria-glow');
            if(anel) {
                anel.style.borderColor = "#2ecc71"; 
                anel.style.boxShadow = "0 0 30px rgba(46, 204, 113, 0.6), inset 0 0 15px rgba(46, 204, 113, 0.3)";
            }
            
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#00f2fe', '#2ecc71'], particleCount: 150});
            if(typeof mostrarToast === 'function') mostrarToast(`Golpe de Mestre! +${lucro}💰`, "🎲");
        }

        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, `Vitória no Dado (${motorDice.multiplicador.toFixed(2)}x)`);
        
    } else {
        if(visor) visor.classList.add('dice-derrota-glow');
        if(anel) {
            anel.style.borderColor = "#ff0844"; 
            anel.style.boxShadow = "0 0 30px rgba(255, 8, 68, 0.6), inset 0 0 15px rgba(255, 8, 68, 0.3)";
        }
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 400]);
                    }
        if(typeof mostrarToast === 'function') mostrarToast("Queimou os circuitos! A casa venceu.", "🔥");
    }

    setTimeout(() => {
        motorDice.rolando = false;
        if(btn) {
            btn.style.opacity = "1";
            btn.style.pointerEvents = "auto";
        }
        if(visor) {
            visor.classList.remove('dice-vitoria-glow', 'dice-derrota-glow');
            visor.style.color = "#fff";
        }
        if(anel) {
            anel.style.borderColor = "rgba(0, 242, 254, 0.2)";
            anel.style.boxShadow = "inset 0 0 20px rgba(0, 242, 254, 0.1), 0 0 30px rgba(0,0,0,0.8)";
        }
    }, 2000); 
}


// ============================================================================
// 🎛️ ESTÚDIO DE ÁUDIO VIP DO CASSINO (PRELOADER BLINDADO)
// ============================================================================

window.CassinoAudio = {
    ativo: false,
    bgm: new Audio('./assets/sons/cassino/cassino.mp3'),
    
    links: {
        // 🚨 SEUS SONS PERSONALIZADOS AQUI:
        fichaAdd: './assets/sons/cassino/aposta.mp3', // Som de aposta personalizado
        fichaSub: './assets/sons/cassino/aposta.mp3', 
        erro: './assets/sons/cassino/perder.mp3',
        
        // Mines
        minesStart: './assets/sons/cassino/mines/comecar.mp3', 
        minesDiamante: './assets/sons/cassino/mines/diamante.mp3', 
        minesBomba: './assets/sons/cassino/mines/bomba.mp3', 
        minesSaque: './assets/sons/cassino/mines/retirar.mp3',

        // 🎰 SLOTS (Caça-Níquel - Mix de Clássico com Seus Arquivos)
        slotsStart: './assets/sons/cassino/slots/comecar.mp3', // Mantivemos o início mecânico
        slotsPlin: './assets/sons/cassino/slots/slots.mp3',  // O "PLIN" de travamento
        slotsWin: './assets/sons/cassino/slots/ganhar.mp3',  // 🚨 SEU SOM DE VITÓRIA
        slotsLose: './assets/sons/cassino/slots/perder.mp3',      // 🚨 SEU SOM DE PERDA

        // 🃏 BLACKJACK (21) - Sons de Feltro e Cassino Real
        bjCard: './assets/sons/cassino/blackjack/comecar.mp3', // Carta deslizando no feltro
        bjStart: './assets/sons/cassino/blackjack/comecar.mp3', // Fichas sendo empurradas pra mesa
        bjWin: './assets/sons/cassino/blackjack/blackjack.mp3', // Vitória limpa (Sino de mesa)
        bjLose: './assets/sons/cassino/blackjack/perder.mp3', // Derrota (Som abafado)
        bjBust: './assets/sons/cassino/blackjack/estourou.mp3', // Estourou 21 (Buzzer)
        bjBlackjack: './assets/sons/cassino/blackjack/blackjack.mp3', // 21 Cravado! (Jackpot)
        bjPush: './assets/sons/cassino/blackjack/empate.mp3', // Empate (Fichas devolvidas)

        // 🚀 FOGUETINHO (CRASH)
        crashStart: './assets/sons/cassino/aviator/foguete.mp3', // Turbinas decolando
        crashBoom: './assets/sons/cassino/mines/bomba.mp3',  // Explosão pesada
        crashCashout: './assets/sons/cassino/mines/retirar.mp3', // O SEU som de Retirar (Dopamina pura)

        // 🎡 ROLETA
        roletaSpin: './assets/sons/cassino/roleta/roleta.mp3', // Som da roleta girando

        // ☄️ PLINKO
        plinkoDrop: './assets/sons/cassino/plinko/comecar.mp3', // Bola sendo solta no topo
        plinkoHit: './assets/sons/cassino/plinko/toque.mp3',   // O "Ploc" clássico batendo no pino

        // 🎫 RASPADINHA
        raspando: './assets/sons/cassino/raspadinha/raspar.mp3', // Som de fricção (o mesmo do deslizar da carta, mas tocado em loop rápido)

        // 🎲 DADO DE OURO
        diceRoll: './assets/sons/cassino/dados/dados.mp3', // O seu som de dados batendo
    },
    
    sonsProntos: {},

    carregarTudo: function() {
        this.bgm.loop = true;
        this.bgm.volume = 0.08; 

        for (let chave in this.links) {
            let audio = new Audio(this.links[chave]);
            audio.preload = 'auto'; 
            this.sonsProntos[chave] = audio;
        }
        console.log("Estúdio do Cassino carregado com suspense clássico!");
    },

    tocarBGM: function() {
        if (!this.bgm) return;
        this.bgm.currentTime = 0;
        this.bgm.play().catch(e => console.log("Aguardando toque para BGM"));
    },

    pausarBGM: function() {
        if (this.bgm) this.bgm.pause();
    },

    tocar: function(nomeSom, volume = 1.0) {
        if (!this.ativo || !this.sonsProntos[nomeSom]) return;
        
        try {
            let sfx = this.sonsProntos[nomeSom];
            
            if (sfx.readyState === 0) {
                sfx.load();
            }
            
            let clone = sfx.cloneNode();
            clone.volume = volume;
            
            // 🚨 A BLINDAGEM DA APPLE: A promessa de áudio absorve os erros de reprodução silenciosamente
            let playPromise = clone.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    // O Safari bloqueou o som. Não fazemos nada, apenas impedimos que o jogo trave.
                    console.log("iOS bloqueou o áudio: " + nomeSom);
                });
            }
        } catch(e) {
            console.error("Erro no motor de áudio:", e);
        }
    }
};

// Carrega os sons na memória
window.CassinoAudio.carregarTudo();


// ============================================================================
// 🛍️ MOTOR DA BOUTIQUE VIP E LOOTBOXES (ECONOMIA INFLACIONADA)
// ============================================================================

// ==========================================
// 1. O ESTOQUE DA LOJA (CATÁLOGOS EXCLUSIVOS E 🔥 PICANTES 🔥)
// ==========================================

// 🛒 O QUE O JOÃO PODE COMPRAR (A Thamiris cumpre/paga)
const BOUTIQUE_JOAO = [
    // 🥉 NÍVEL BRONZE (Carinhos & Provocações Iniciais - Até 50k)
    { id: 'j1', emoji: '🎬', nome: 'Controle Remoto', desc: 'Direito de escolher o filme/série da call hoje sem que você possa dar um pio.', preco: 5000 },
    { id: 'j2', emoji: '📸', nome: 'Selfie Provocante', desc: 'Pare o que está fazendo e me mande uma foto só de calcinha/sutiã agora mesmo.', preco: 7500 },
    { id: 'j3', emoji: '🎵', nome: 'DJ da Call', desc: 'Você vai escutar as minhas músicas hoje enquanto conversamos.', preco: 10000 },
    { id: 'j4', emoji: '🗣️', nome: 'Áudio Ofegante', desc: 'Quero um áudio seu de 2 minutos narrando exatamente o que você quer que eu te faça.', preco: 12000 },
    { id: 'j5', emoji: '🎮', nome: 'Player 2 Submissa', desc: 'Você vai jogar o meu jogo favorito comigo, no meu ritmo, por 2 horas.', preco: 15000 },
    { id: 'j6', emoji: '🔥', nome: 'Confissão Obscena', desc: 'Vou te fazer uma pergunta extremamente íntima e você TEM que responder com detalhes.', preco: 20000 },
    { id: 'j7', emoji: '👙', nome: 'Lingerie do Dia', desc: 'Eu escolho a lingerie exata que você vai vestir por baixo da roupa hoje.', preco: 25000 },
    { id: 'j8', emoji: '🤫', nome: 'Cartão do Silêncio', desc: 'Encerra um debate bobo imediatamente. Eu ganho a razão e um pedido de desculpas.', preco: 30000 },
    { id: 'j9', emoji: '😈', nome: 'Nude de 5 Segundos', desc: 'Uma foto visualização-única no WhatsApp, sem censura, agora.', preco: 40000 },
    { id: 'j10', emoji: '🎲', nome: 'Verdade ou Consequência +18', desc: 'Vamos jogar na call hoje. E as prendas serão pagas na câmera.', preco: 50000 },

    // 🥈 NÍVEL PRATA (Delivery & Exibicionismo Privado - Até 250k)
    { id: 'j11', emoji: '🍩', nome: 'Glicose de Emergência', desc: 'Você banca um docinho ou açaí no meu iFood AGORA.', preco: 75000 },
    { id: 'j12', emoji: '🚿', nome: 'Áudio no Chuveiro', desc: 'Quero ouvir o barulho da água e seus gemidos enquanto você toma banho pensando em mim.', preco: 90000 },
    { id: 'j13', emoji: '💌', nome: 'Carta Física', desc: 'Escreva e me mande uma carta de amor com seu perfume (e uma marca de batom) pelos Correios.', preco: 110000 },
    { id: 'j14', emoji: '🍻', nome: 'Pix da Gelada', desc: 'Você banca o Pix da minha cervejinha/drink do final de semana.', preco: 130000 },
    { id: 'j15', emoji: '🍕', nome: 'Sexta da Pizza', desc: 'Noite de pizza pelo iFood paga por você!', preco: 150000 },
    { id: 'j16', emoji: '💃', nome: 'Strip-Tease Particular', desc: 'Você vai colocar uma música e dançar tirando a roupa pra mim na call de vídeo.', preco: 170000 },
    { id: 'j17', emoji: '🍔', nome: 'Combo Artesanal Monstro', desc: 'Aquele combo de hambúrguer artesanal absurdo pago por você.', preco: 180000 },
    { id: 'j18', emoji: '🚫', nome: 'Cartão do Perdão', desc: 'Zera o placar de um vacilo meu. Paz absoluta restaurada.', preco: 200000 },
    { id: 'j19', emoji: '🎥', nome: 'Strip-Poker Virtual', desc: 'Quem perde a mão do jogo, tira uma peça de roupa. Vamos jogar na cam.', preco: 220000 },
    { id: 'j20', emoji: '👅', nome: 'Realização de Fantasia', desc: 'Você vai me confessar um fetiche oculto seu e nós vamos planejar como realizar.', preco: 250000 },

    // 🥇 NÍVEL OURO (Prêmios Pesados & Luxo - Até 900k)
    { id: 'j21', emoji: '🛒', nome: 'Carrinho da Shopee', desc: 'Você vai pagar aquele carrinho meu que tá parado (Até R$ 50).', preco: 300000 },
    { id: 'j22', emoji: '🧸', nome: 'Pelúcia com seu Cheiro', desc: 'Me mande uma pelúcia gigante borrifada com o seu perfume pra eu dormir agarrado.', preco: 350000 },
    { id: 'j23', emoji: '⛓️', nome: 'Submissão Total', desc: 'Por 1 hora na call de hoje, você é minha e tem que obedecer QUALQUER comando meu na câmera.', preco: 400000 },
    { id: 'j24', emoji: '🥩', nome: 'Rodízio de Carnes', desc: 'Você banca um jantar de churrascaria/carnes premium pra mim hoje!', preco: 500000 },
    { id: 'j25', emoji: '🔥', nome: 'Conjunto Erótico', desc: 'EU escolho a lingerie/brinquedo online, VOCÊ compra e usa pra mim na nossa próxima call.', preco: 600000 },
    { id: 'j26', emoji: '🍷', nome: 'Jantar de Gala Virtual', desc: 'Você planeja o date, a gente se arruma e jantamos "juntos" em vídeo.', preco: 700000 },
    { id: 'j27', emoji: '📸', nome: 'Ensaio Sensual Completo', desc: 'Um pack de fotos e vídeos explícitos, feitos no seu quarto, única e exclusivamente para mim.', preco: 800000 },

    // 💎 NÍVEL DIAMANTE (Metas Absolutas - 1 Milhão+)
    { id: 'j28', emoji: '👑', nome: 'Mestre do Quarto', desc: 'Na nossa primeira noite juntos no reencontro, EU dito todas as regras. Você apenas obedece.', preco: 1000000 },
    { id: 'j29', emoji: '🥂', nome: 'O Primeiro Brinde', desc: 'No nosso reencontro, você banca a nossa primeira refeição juntos (pode ser um lanche na chegada ou um jantarzinho).', preco: 2000000 },
    { id: 'j30', emoji: '🎁', nome: 'Recepção VIP', desc: 'Você vai me receber no dia do reencontro com um presentinho físico surpresa e um abraço de urso.', preco: 5000000 }
];

// 🛒 O QUE A THAMIRIS PODE COMPRAR (O João cumpre/paga)
const BOUTIQUE_THAMIRIS = [
    // 🥉 NÍVEL BRONZE (Carinhos & Provocações Iniciais - Até 50k)
    { id: 't1', emoji: '🎬', nome: 'Controle Remoto', desc: 'Direito de escolher o filme/série da call hoje sem que você reclame.', preco: 5000 },
    { id: 't2', emoji: '📸', nome: 'Selfie Pós-Banho', desc: 'Quero uma foto sua só de toalha ou sem camisa, no espelho, agora.', preco: 7500 },
    { id: 't3', emoji: '🎵', nome: 'DJ da Call', desc: 'Você vai ser obrigado a escutar a minha playlist hoje.', preco: 10000 },
    { id: 't4', emoji: '🗣️', nome: 'Voz Grossa de Bom Dia', desc: 'Quero um áudio de voz de sono, bem grossa, dizendo o que quer fazer comigo amanhã.', preco: 12000 },
    { id: 't5', emoji: '🎮', nome: 'Player 2 Submisso', desc: 'Você vai assistir o meu programa/jogar meu jogo favorito sem reclamar.', preco: 15000 },
    { id: 't6', emoji: '🔥', nome: 'Segredo Sujo', desc: 'Vou fazer uma pergunta bem safada e você TEM que responder a verdade absoluta.', preco: 20000 },
    { id: 't7', emoji: '🩲', nome: 'Estilista Íntima', desc: 'Eu escolho a cor da cueca e a roupa que você vai vestir hoje.', preco: 25000 },
    { id: 't8', emoji: '🤫', nome: 'Cartão do Silêncio', desc: 'Encerra um debate bobo imediatamente. A razão é toda minha.', preco: 30000 },
    { id: 't9', emoji: '😈', nome: 'Nude Direto', desc: 'Quero receber uma foto visualização-única, sem censura, agora no WhatsApp.', preco: 40000 },
    { id: 't10', emoji: '🎲', nome: 'Verdade ou Consequência +18', desc: 'Vamos jogar hoje à noite. Sem fugir das prendas na câmera.', preco: 50000 },

    // 🥈 NÍVEL PRATA (Delivery & Exibicionismo Privado - Até 250k)
    { id: 't11', emoji: '🍩', nome: 'Glicose de Emergência', desc: 'Um docinho ou açaí enviado pelo iFood para a minha casa AGORA.', preco: 75000 },
    { id: 't12', emoji: '🚿', nome: 'Gemido no Banho', desc: 'Quero um áudio seu no chuveiro narrando exatamente o que faria comigo lá dentro.', preco: 90000 },
    { id: 't13', emoji: '💌', nome: 'Carta Física', desc: 'Escreva de próprio punho e me mande uma carta romântica pelos Correios.', preco: 110000 },
    { id: 't14', emoji: '🚗', nome: 'Pix do Uber', desc: 'Você banca o meu Uber para eu voltar em segurança e conforto.', preco: 130000 },
    { id: 't15', emoji: '🍕', nome: 'Sexta da Pizza', desc: 'Minha pizza do iFood de hoje com borda recheada paga por você!', preco: 150000 },
    { id: 't16', emoji: '🕺', nome: 'Show Particular na Cam', desc: 'Você vai fazer um strip-tease completo só pra mim na chamada de vídeo.', preco: 170000 },
    { id: 't17', emoji: '🍔', nome: 'Lanchão Artesanal', desc: 'Aquele combo duplo maravilhoso de hambúrguer pago no meu iFood.', preco: 180000 },
    { id: 't18', emoji: '🚫', nome: 'Cartão do Perdão', desc: 'Zera um surto ou ciuminho meu. Você tem que me dar razão e pedir desculpas.', preco: 200000 },
    { id: 't19', emoji: '🎥', nome: 'Roleta do Desejo', desc: 'Eu vou te dar 3 ordens explícitas na câmera hoje à noite e você tem que obedecer.', preco: 220000 },
    { id: 't20', emoji: '⛓️', nome: 'Escravo por 1 Dia', desc: 'No reencontro, você será o meu servo particular o dia inteiro. Tudo que eu pedir, você faz.', preco: 250000 },

    // 🥇 NÍVEL OURO (Prêmios Pesados & Luxo - Até 900k)
    { id: 't21', emoji: '💐', nome: 'Flores no Portão', desc: 'Quero um buquê luxuoso surpresa entregue diretamente na minha casa.', preco: 300000 },
    { id: 't22', emoji: '💅', nome: 'Pix da Beleza (Unhas)', desc: 'Manda o Pix (R$ 50) para eu fazer as unhas e ficar linda (pra arranhar suas costas).', preco: 350000 },
    { id: 't23', emoji: '👑', nome: 'A Chefona', desc: 'Por 1 hora na call de hoje, você tem que dizer "Sim" e fazer QUALQUER pedido meu na câmera.', preco: 400000 },
    { id: 't24', emoji: '🫕', nome: 'Fondue Romântico', desc: 'Você banca um rodízio de Fondue ou Jantar Italiano maravilhoso pra mim hoje.', preco: 500000 },
    { id: 't25', emoji: '💄', nome: 'Skincare e Make', desc: 'Pix generoso para eu repor os meus cremes e maquiagens.', preco: 600000 },
    { id: 't26', emoji: '🍷', nome: 'Jantar de Gala Virtual', desc: 'Você banca a janta, a gente se arruma e comemos juntos em vídeo.', preco: 700000 },
    { id: 't27', emoji: '💆‍♀️', nome: 'Massagem com Final Feliz', desc: 'No reencontro, você me deve 1 hora de massagem relaxante pelo corpo todo, com um final inesquecível.', preco: 800000 },

    // 💎 NÍVEL DIAMANTE (Metas Absolutas - 1 Milhão+)
    { id: 't28', emoji: '👗', nome: 'Surto na Shein', desc: 'Pix de R$ 150 exclusivamente para eu renovar as minhas blusinhas e lingeries.', preco: 1000000 },
    { id: 't29', emoji: '✨', nome: 'Dia de Princesa', desc: 'Pix generoso bancando um dia de salão de beleza completo pra mim.', preco: 2000000 },
    { id: 't30', emoji: '🍷', nome: 'O Primeiro Jantar', desc: 'No nosso reencontro, o nosso primeiro jantar romântico para comemorarmos a distância vencida é totalmente por sua conta!', preco: 5000000 }
];


// ==========================================
// 2. O ESTOQUE DA LOOTBOX (CAIXAS MISTERIOSAS BIFURCADAS E CALIENTES)
// ==========================================

// 🎁 O QUE PODE SAIR NA CAIXA DO JOÃO (A Thamiris cumpre/paga)
const LOOTBOX_JOAO = [
    // 🟢 COMUNS (40% - 10% cada)
    { chance: 0.10, emoji: '📸', nome: 'Selfie Imediata', desc: 'Ela tem que mandar uma selfie do que está fazendo agora.' },
    { chance: 0.10, emoji: '🎵', nome: 'Música do Dia', desc: 'Ela tem que te mandar uma música romântica agora mesmo.' },
    { chance: 0.10, emoji: '🗣️', nome: 'Áudio Espontâneo', desc: 'Ganhou um áudio de 1 minuto dela se declarando.' },
    { chance: 0.10, emoji: '😈', nome: 'Foto Explícita', desc: 'Sorte Grande! Ela deve te mandar uma foto bem safada, como veio ao mundo, no WhatsApp.' },

    // 🔵 INCOMUNS (30% - 6% cada)
    { chance: 0.06, emoji: '🍦', nome: 'Pix do Açaí', desc: 'A Thamiris te deve R$ 25 pra você pedir um açaí!' },
    { chance: 0.06, emoji: '🎬', nome: 'Poder do Play', desc: 'Você tem a palavra final sobre qual filme vão ver hoje.' },
    { chance: 0.06, emoji: '👙', nome: 'Look Íntimo', desc: 'Ela tem que vestir exatamente a lingerie que você mandar pra call de hoje.' },
    { chance: 0.06, emoji: '💤', nome: 'História pra Dormir', desc: 'Ela vai te contar histórias na call até você dormir.' },
    { chance: 0.06, emoji: '🤫', nome: 'Última Palavra', desc: 'Você ganhou a razão absoluta na próxima pequena DR.' },

    // 🟣 RAROS (20% - 4% cada)
    { chance: 0.04, emoji: '☕', nome: 'Café de Domingo', desc: 'Ela te deve um café da manhã pago no iFood!' },
    { chance: 0.04, emoji: '🍕', nome: 'Noite da Pizza', desc: 'A janta hoje é pizza Premium paga por ela.' },
    { chance: 0.04, emoji: '🎲', nome: 'Jogo Erótico', desc: 'Vocês vão jogar um Verdade ou Consequência ardente na call.' },
    { chance: 0.04, emoji: '🔥', nome: 'Comando Remoto', desc: 'Você dita exatamente o que ela deve fazer com as próprias mãos na câmera.' },
    { chance: 0.04, emoji: '🛒', nome: 'Cesto da Shopee', desc: 'Ela banca uma bobeirinha na Shopee pra você (Até R$ 30).' },

    // 🟡 ÉPICOS (8% - 2% cada)
    { chance: 0.02, emoji: '🥩', nome: 'Churrasco Premium', desc: 'Jantar de churrascaria ou hambúrguer duplo pago por ela na sua casa!' },
    { chance: 0.02, emoji: '🍷', nome: 'Gala Virtual', desc: 'Ela banca o jantar dos dois hoje e vocês comem em vídeo.' },
    { chance: 0.02, emoji: '🎁', nome: 'Brinquedinho Surpresa', desc: 'Ela tem que comprar e usar um brinquedo/acessório novo escolhido por você.' },
    { chance: 0.02, emoji: '👑', nome: 'Submissão Total', desc: 'Ela tem que dizer SIM pra TUDO e obedecer na call por 30 minutos.' },

    // 🔴 LENDÁRIOS (2%)
    { chance: 0.01999, emoji: '🎉', nome: 'Fim de Semana Pago', desc: 'A Thamiris banca o rolê e a comida do seu próximo final de semana inteiro!' },
    { chance: 0.00001, emoji: '🎁', nome: 'Recepção VIP', desc: 'O PRÊMIO MÁXIMO! No reencontro, ela vai te receber com uma surpresa inesquecível e um abraço de urso!' }
];

// 🎁 O QUE PODE SAIR NA CAIXA DA THAMIRIS (O João cumpre/paga)
const LOOTBOX_THAMIRIS = [
    // 🟢 COMUNS (40% - 10% cada)
    { chance: 0.10, emoji: '📸', nome: 'Selfie Imediata', desc: 'O João tem que mandar uma selfie do que está fazendo agora.' },
    { chance: 0.10, emoji: '🎵', nome: 'Música do Dia', desc: 'O João tem que te mandar uma música romântica agora mesmo.' },
    { chance: 0.10, emoji: '🗣️', nome: 'Áudio Espontâneo', desc: 'Ganhou um áudio de 1 minuto do João se declarando.' },
    { chance: 0.10, emoji: '😈', nome: 'Nude no Espelho', desc: 'Sorte Grande! O João tem que te mandar uma foto sem roupa no espelho, visualização única.' },

    // 🔵 INCOMUNS (30% - 6% cada)
    { chance: 0.06, emoji: '🍦', nome: 'Pix do Açaí', desc: 'O João te deve R$ 25 pra você pedir um açaí!' },
    { chance: 0.06, emoji: '🎬', nome: 'Poder do Play', desc: 'Você escolhe o filme de hoje e ele tem que assistir calado.' },
    { chance: 0.06, emoji: '🩲', nome: 'Look Íntimo', desc: 'Você escolhe a cor da cueca e a roupa que ele vai usar amanhã.' },
    { chance: 0.06, emoji: '💤', nome: 'História pra Dormir', desc: 'O João vai narrar uma história de voz grossa até você pegar no sono.' },
    { chance: 0.06, emoji: '🤫', nome: 'Última Palavra', desc: 'Você ganhou a razão absoluta na próxima DR. Acabou o assunto.' },

    // 🟣 RAROS (20% - 4% cada)
    { chance: 0.04, emoji: '☕', nome: 'Café de Domingo', desc: 'O João te deve um café da manhã pago no iFood!' },
    { chance: 0.04, emoji: '🍕', nome: 'Noite da Pizza', desc: 'A sua janta hoje é pizza com borda recheada paga por ele.' },
    { chance: 0.04, emoji: '🎲', nome: 'Jogo Erótico', desc: 'Vocês vão jogar um Verdade ou Consequência safado na call.' },
    { chance: 0.04, emoji: '🚗', nome: 'Pix do Uber', desc: 'Seu próximo Uber é totalmente por conta dele.' },
    { chance: 0.04, emoji: '🛒', nome: 'Carrinho da Shopee', desc: 'Ele banca as suas bobeirinhas no carrinho da Shopee (Até R$ 30).' },

    // 🟡 ÉPICOS (8% - 2% cada)
    { chance: 0.02, emoji: '🫕', nome: 'Jantar Premium', desc: 'Rodízio de Fondue ou Hambúrguer Artesanal na sua casa pago pelo João!' },
    { chance: 0.02, emoji: '💐', nome: 'Flores no Portão', desc: 'Você acabou de ganhar um buquê de flores luxuoso surpresa!' },
    { chance: 0.02, emoji: '💅', nome: 'Pix das Unhas', desc: 'Caiu R$ 50 na sua conta para você fazer a unha amanhã e arranhar ele depois.' },
    { chance: 0.02, emoji: '👑', nome: 'Controle Mental', desc: 'O João tem que dizer SIM pra TUDO na call por 30 minutos. Você manda nele.' },

    // 🔴 LENDÁRIOS (2%)
    { chance: 0.01999, emoji: '👗', nome: 'Surto na Shein', desc: 'O João te deve um Pix de R$ 150 DIRETO na conta pras suas lingeries e blusinhas!' },
    { chance: 0.00001, emoji: '🎁', nome: 'Recepção VIP', desc: 'O PRÊMIO MÁXIMO! No reencontro, ela vai te receber com uma surpresa inesquecível e um abraço de urso!' }
];

// ==========================================
// MOTOR DE ECONOMIA ESPELHADA (BOUTIQUE VIP)
// ==========================================
window.gastosBoutique = { 'João': 0, 'Thamiris': 0 };

window.iniciarEconomiaBoutique = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    // Escuta em tempo real o que cada um já gastou na loja
    onValue(ref(db, 'jogos/boutique_gastos'), (snapshot) => {
        if (snapshot.exists()) {
            window.gastosBoutique = snapshot.val();
        } else {
            window.gastosBoutique = { 'João': 0, 'Thamiris': 0 };
        }
        
        // Se a loja estiver aberta na tela, atualiza o saldo na hora
        const overlay = document.getElementById('overlay-boutique');
        if(overlay && overlay.style.display === 'flex') {
            if(typeof renderizarBoutique === 'function') renderizarBoutique();
        }
    });
};

// ==========================================
// RENDERIZAÇÃO INTELIGENTE DA BOUTIQUE VIP (C/ BLINDAGEM DE IDENTIDADE)
// ==========================================

window.abrirBoutique = function() {
    const overlay = document.getElementById('overlay-boutique');
    if (overlay) {
        overlay.classList.remove('escondido');
        overlay.style.display = 'flex';
        if(typeof iniciarEconomiaBoutique === 'function') iniciarEconomiaBoutique();
        if(typeof renderizarBoutique === 'function') renderizarBoutique();
    }
};

window.fecharBoutique = function() {
    const overlay = document.getElementById('overlay-boutique');
    if (overlay) overlay.style.display = 'none';
};

window.renderizarBoutique = function() { 
    const visor = document.getElementById('boutique-moedas-visor');
    const divCatalogo = document.getElementById('boutique-catalogo');
    if(!divCatalogo) return;
    
    // Botão do Livro de Acordos
    divCatalogo.innerHTML = `
        <button onclick="abrirChecklistBoutique()" class="btn-acao" style="width: 100%; margin-bottom: 20px; background: linear-gradient(145deg, #c0392b, #8e44ad); font-size: 1.1rem; box-shadow: 0 4px 15px rgba(192, 57, 43, 0.4);">
            📋 Ver Nossos Acordos Íntimos
        </button>
    `;

    // 🚨 A MÁGICA: IDENTIDADE ABSOLUTA
    const euId = window.souJoao ? 'joao' : 'thamiris';
    const meusGastos = window.gastosBoutique[euId] || 0;
    
    const meuSaldoIndividual = (window.pontosDoCasal || 0) - meusGastos;
    if(visor) visor.innerText = meuSaldoIndividual.toLocaleString('pt-BR');

    const catalogoAtivo = window.souJoao ? BOUTIQUE_JOAO : BOUTIQUE_THAMIRIS;

    catalogoAtivo.forEach(item => {
        let btnStatus = (meuSaldoIndividual >= item.preco) ? 
            `<button class="btn-comprar-boutique" onclick="comprarItemBoutique('${item.id}')">${item.preco.toLocaleString('pt-BR')} 💰</button>` : 
            `<button class="btn-comprar-boutique" style="background: #444; color: #888; box-shadow: none;" disabled>Faltam Moedas 💔</button>`;
        
        divCatalogo.innerHTML += `
            <div class="cartao-boutique ${meuSaldoIndividual < item.preco ? 'esgotado' : ''}">
                <div style="font-size: 3.5rem; margin-bottom: 5px; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5));">${item.emoji}</div>
                <h3 style="color: var(--cor-primaria); margin-bottom: 5px;">${item.nome}</h3>
                <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 15px;">${item.desc}</p>
                ${btnStatus}
            </div>
        `;
    });

    const divLootbox = document.getElementById('boutique-lootboxes');
    if(!divLootbox) return;
    
    let precoLootbox = 20000; 
    let btnLootbox = (meuSaldoIndividual >= precoLootbox) ? 
        `<button class="btn-comprar-boutique" onclick="comprarLootbox(${precoLootbox})">ABRIR A CAIXA (20K)</button>` : 
        `<button class="btn-comprar-boutique" style="background: #444; color: #888;" disabled>Saldo Insuficiente</button>`;
    
    divLootbox.innerHTML = `
        <div class="cartao-boutique cartao-lootbox" style="border: 1px solid #9b59b6;">
            <div style="font-size: 4.5rem; filter: drop-shadow(0 0 20px #9b59b6); margin-bottom: 10px;">🎁</div>
            <h3 style="color: #9b59b6;">Caixa de Pandora</h3>
            <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 15px;">Sorteie prêmios aleatórios. O risco é seu, a recompensa é deliciosa!</p>
            ${btnLootbox}
        </div>
    `;
};

// ==========================================
// LÓGICA DE COMPRA E COBRANÇA CRUZADA VIA WHATSAPP
// ==========================================
window.comprarItemBoutique = function(idItem) {
    const euId = window.souJoao ? 'joao' : 'thamiris';
    const catalogoAtivo = window.souJoao ? BOUTIQUE_JOAO : BOUTIQUE_THAMIRIS;

    let item = catalogoAtivo.find(i => i.id === idItem);
    if (!item) return;

    const meusGastos = window.gastosBoutique[euId] || 0;
    const meuSaldoIndividual = (window.pontosDoCasal || 0) - meusGastos;

    if (meuSaldoIndividual < item.preco) {
        if(typeof mostrarToast === 'function') mostrarToast("Moedas insuficientes!", "❌");
        return;
    }

    if (window.SantuarioApp && window.SantuarioApp.modulos) {
        const { db, ref, set } = window.SantuarioApp.modulos;
        
        // Desconta as moedas da carteira
        set(ref(db, `jogos/boutique_gastos/${euId}`), meusGastos + item.preco);
        
        // Registra o acordo íntimo no banco de dados
        const idPedido = "ped_" + Date.now();
        set(ref(db, `jogos/boutique_pedidos/${euId}/${idPedido}`), {
            emoji: item.emoji,
            nome: item.nome,
            desc: item.desc,
            concluido: false,
            timestamp: Date.now()
        });
    }
    
    if(typeof renderizarBoutique === 'function') renderizarBoutique();

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjWin', 1.0);
    if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], particleCount: 150, spread: 100});

    let mensagem = `*RESGATE DE PRÊMIO - BOUTIQUE VIP* 🛍️✨%0A%0AAmor, acabei de gastar as minhas moedas individuais e comprei um luxo pra mim:%0A%0A🎁 *${item.emoji} ${item.nome}*%0A📝 _${item.desc}_%0A💳 Custou: ${item.preco.toLocaleString('pt-BR')} moedas.%0A%0AEstou indo cobrar a minha recompensa agora mesmo! 👀🔥`;
    
    let numeroJoao = "5541996419950";
    let numeroThamiris = "5562994838837"; 
    let numeroDestino = window.souJoao ? numeroThamiris : numeroJoao;

    setTimeout(() => {
        window.location.href = `https://wa.me/${numeroDestino}?text=${mensagem}`;
    }, 1500);
};

window.comprarLootbox = function(preco) {
    const euId = window.souJoao ? 'joao' : 'thamiris';
    const meusGastos = window.gastosBoutique[euId] || 0;
    const meuSaldoIndividual = (window.pontosDoCasal || 0) - meusGastos;

    if (meuSaldoIndividual < preco) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "❌");
        return;
    }
    
    if (window.SantuarioApp && window.SantuarioApp.modulos) {
        const { db, ref, set } = window.SantuarioApp.modulos;
        set(ref(db, `jogos/boutique_gastos/${euId}`), meusGastos + preco);
    }

    if(typeof renderizarBoutique === 'function') renderizarBoutique();

    const tela = document.getElementById('tela-lootbox-abertura');
    const icone = document.getElementById('lootbox-icone');
    const textoAcao = document.getElementById('lootbox-texto-acao');
    const tituloResultado = document.getElementById('lootbox-resultado-titulo');
    const descResultado = document.getElementById('lootbox-resultado-desc');
    const painelResultado = document.getElementById('lootbox-painel-resultado');

    if (!tela) return;

    tela.classList.remove('escondido');
    tela.style.display = 'flex';
    icone.className = "lootbox-caixa fechada";
    icone.innerText = "🎁";
    textoAcao.innerText = "Tocando os tambores do destino...";
    painelResultado.classList.add('escondido');

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('roletaSpin', 1.0);

    setTimeout(() => {
        icone.className = "lootbox-caixa abrindo";
        if(window.Haptics && navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }, 2000);

    setTimeout(() => {
        const premiosAtivos = window.souJoao ? LOOTBOX_JOAO : LOOTBOX_THAMIRIS;

        let random = Math.random();
        let premioSorteado = premiosAtivos[premiosAtivos.length - 1]; 
        let acumulado = 0;

        for (let item of premiosAtivos) {
            acumulado += item.chance;
            if (random <= acumulado) {
                premioSorteado = item;
                break;
            }
        }

        icone.className = "lootbox-caixa aberta";
        icone.innerText = premioSorteado.emoji;
        textoAcao.innerText = "✨ A Caixa se Abriu! ✨";
        tituloResultado.innerText = premioSorteado.nome;
        descResultado.innerText = premioSorteado.desc;
        painelResultado.classList.remove('escondido');

        // Registra o prêmio da caixa misteriosa no Livro de Acordos
        if (window.SantuarioApp && window.SantuarioApp.modulos) {
            const { db, ref, set } = window.SantuarioApp.modulos;
            const idPedido = "ped_" + Date.now();
            set(ref(db, `jogos/boutique_pedidos/${euId}/${idPedido}`), {
                emoji: premioSorteado.emoji,
                nome: premioSorteado.nome,
                desc: premioSorteado.desc,
                concluido: false,
                timestamp: Date.now()
            });
        }

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjWin', 1.0);
        if(typeof confetti === 'function') confetti({colors: ['#9b59b6', '#D4AF37', '#ffffff'], particleCount: 200, spread: 160});
        if(window.Haptics && navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 500]);

        const btnResgatar = document.getElementById('btn-resgatar-lootbox');
        if (btnResgatar) {
            btnResgatar.onclick = () => {
                let numeroJoao = "5541996419950";
                let numeroThamiris = "5562994838837"; 
                let numeroDestino = window.souJoao ? numeroThamiris : numeroJoao;

                let mensagem = `*CAIXA DE PANDORA ABERTA* 🎁✨%0A%0AAmor, gastei as minhas moedas na Caixa Misteriosa e tirei a sorte grande:%0A%0A✨ *${premioSorteado.emoji} ${premioSorteado.nome}*%0A📝 _${premioSorteado.desc}_%0A%0AEstou indo cobrar o meu prêmio agora mesmo! 👀🔥`;
                
                window.location.href = `https://wa.me/${numeroDestino}?text=${mensagem}`;
                tela.classList.add('escondido');
                tela.style.display = 'none';
            };
        }
    }, 4500);
};

// ==========================================
// SISTEMA DE CHECKLIST: ACORDOS ÍNTIMOS
// ==========================================
window.abrirChecklistBoutique = function() {
    if(window.Haptics) window.Haptics.toqueLeve();
    
    // 🚨 MENSAGEM NOVA PARA PROVAR QUE O CACHE ATUALIZOU
    if(typeof mostrarToast === 'function') mostrarToast("Sincronizando Livro de Ouro...", "📖");

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) {
        if(typeof mostrarToast === 'function') mostrarToast("Erro de conexão com o satélite.", "❌");
        return;
    }
    
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    // Usamos onValue contínuo. Assim, se a Thamiris cumprir a missão, a sua tela fica verde na mesma hora!
    onValue(ref(db, 'jogos/boutique_pedidos'), (snapshot) => {
        try {
            const dados = snapshot.exists() ? snapshot.val() : {};
            if (typeof window.renderizarModalChecklist === 'function') {
                window.renderizarModalChecklist(dados);
            }
        } catch (erro) {
            console.error("Erro ao renderizar checklist:", erro);
        }
    });
};

window.renderizarModalChecklist = function(dados) {
    let modal = document.getElementById('modal-checklist-boutique');
    if(!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-checklist-boutique';
        modal.className = 'modal-overlay';
        // 🚨 Z-INDEX ABSOLUTO: Garante que a janela nasça na frente da Boutique!
        modal.style.zIndex = "9999999"; 
        document.body.appendChild(modal);
    }
    
    const euId = window.souJoao ? 'joao' : 'thamiris';
    const parceiroId = window.souJoao ? 'thamiris' : 'joao';
    const nomeParceiro = window.souJoao ? 'Thamiris' : 'João';
    
    let meusDesejosHtml = window.gerarListaAcordos(dados[euId], euId); 
    let meusDeveresHtml = window.gerarListaAcordos(dados[parceiroId], parceiroId);
    
    modal.innerHTML = `
        <div class="cartao-vidro" style="width: 90%; max-height: 85vh; overflow-y: auto; padding: 20px; position: relative;">
            <h2 style="color: var(--cor-primaria); text-align: center; margin-bottom: 5px; font-family: 'Playfair Display', serif;">Acordos Íntimos</h2>
            <p style="text-align: center; color: #ccc; font-size: 0.85rem; margin-bottom: 20px;">O que deve ser cumprido no mundo real.</p>
            
            <h3 style="color: #e74c3c; margin-top: 10px; border-bottom: 1px solid #e74c3c; padding-bottom: 5px;">🔥 Meus Deveres</h3>
            <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 10px;">O que ${nomeParceiro} comprou e eu devo cumprir.</p>
            <div style="margin-bottom: 25px;">${meusDeveresHtml}</div>

            <h3 style="color: #2ecc71; border-bottom: 1px solid #2ecc71; padding-bottom: 5px;">👑 Meus Desejos</h3>
            <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 10px;">O que eu comprei e ${nomeParceiro} me deve.</p>
            <div>${meusDesejosHtml}</div>

            <button class="btn-acao" onclick="document.getElementById('modal-checklist-boutique').style.display='none'" style="width: 100%; margin-top: 25px; background: #333; color: white;">Fechar Livro 📖</button>
        </div>
    `;
    modal.style.display = 'flex';
    modal.classList.remove('escondido');
};

window.gerarListaAcordos = function(pedidosObj, donoDosPedidos) {
    if(!pedidosObj) return '<p style="color: #666; font-style: italic; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">Nenhum acordo registrado.</p>';
    
    let html = '';
    let arr = Object.keys(pedidosObj).map(k => ({ id: k, ...pedidosObj[k] })).sort((a,b) => b.timestamp - a.timestamp);
    
    if(arr.length === 0) return '<p style="color: #666; font-style: italic; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;">Nenhum acordo registrado.</p>';

    arr.forEach(p => {
        let corBorda = p.concluido ? '#27ae60' : '#D4AF37';
        let statusTxt = p.concluido ? '✓ Cumprido com Sucesso' : '⏳ Pendente (Aguardando Cumprimento)';
        let opacidade = p.concluido ? '0.5' : '1';
        
        let btnHtml = '';
        if (!p.concluido) {
             btnHtml = `<button onclick="marcarAcordoConcluido('${donoDosPedidos}', '${p.id}')" class="btn-ripple" style="margin-top: 12px; width: 100%; background: #27ae60; color: white; border: none; padding: 10px; border-radius: 8px; font-weight: bold;">Marcar como Cumprido ✅</button>`;
        }

        html += `
            <div style="background: rgba(0,0,0,0.6); border-left: 4px solid ${corBorda}; padding: 12px; border-radius: 8px; margin-top: 12px; opacity: ${opacidade}; transition: all 0.3s;">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 5px;">
                    <span style="font-size: 2rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));">${p.emoji}</span>
                    <h4 style="color: #fff; margin: 0; font-size: 1.1rem;">${p.nome}</h4>
                </div>
                <p style="font-size: 0.9rem; color: #ddd; margin: 5px 0 10px 0; line-height: 1.4;">${p.desc}</p>
                <div style="font-size: 0.75rem; font-weight: bold; color: ${corBorda}; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 4px; display: inline-block;">${statusTxt}</div>
                ${btnHtml}
            </div>
        `;
    });
    return html;
};

window.marcarAcordoConcluido = function(dono, idPedido) {
    if(confirm("Tem certeza que este acordo íntimo foi cumprido na vida real? 🔥")) {
        if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
        const { db, ref, set } = window.SantuarioApp.modulos;
        
        set(ref(db, `jogos/boutique_pedidos/${dono}/${idPedido}/concluido`), true)
        .then(() => {
            if(typeof mostrarToast === 'function') mostrarToast("Acordo Cumprido! 🔥", "✅");
            if(window.Haptics) window.Haptics.toqueLeve();
            if(typeof confetti === 'function') confetti({colors: ['#27ae60', '#ffffff'], particleCount: 100});
        }).catch(err => {
            console.error("Erro ao concluir:", err);
            if(typeof mostrarToast === 'function') mostrarToast("Erro ao salvar.", "❌");
        });
    }
};

// ==========================================
// DESTRANCADOR GLOBAL DE ÁUDIO (BLINDAGEM APPLE)
// Desperta o alto-falante do iPhone silenciosamente
// ==========================================
function destrancarAudioApple() {
    const audioAmbiente = document.getElementById('audio-ambiente');
    const audioJogos = document.getElementById('audio-jogos');
    
    // Dispara o som e pausa imediatamente nos bastidores.
    // Isso ensina ao sistema da Apple: "Ela tocou na tela, áudio liberado!"
    if (audioAmbiente) {
        audioAmbiente.play().then(() => audioAmbiente.pause()).catch(() => {});
    }
    if (audioJogos) {
        audioJogos.play().then(() => audioJogos.pause()).catch(() => {});
    }
    
    // Destrói este espião, pois basta um único toque inicial para destrancar para sempre
    document.removeEventListener('click', destrancarAudioApple);
    document.removeEventListener('touchstart', destrancarAudioApple);
}

// Fica à espreita esperando o primeiríssimo toque (como ela digitando e-mail ou senha)
document.addEventListener('click', destrancarAudioApple);
document.addEventListener('touchstart', destrancarAudioApple);

// ============================================================================
// 🔄 MOTOR DE ATUALIZAÇÃO FORÇADA DE PWA (CACHE BUSTER)
// ============================================================================
window.forcarAtualizacao = function() {
    const btn = document.getElementById('btn-verificar-atualizacao');
    if (btn) {
        btn.innerText = "Baixando Nova Versão... ⏳";
        btn.style.opacity = "0.7";
        btn.style.pointerEvents = "none"; // Impede duplo clique
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50, 50, 50]);
                    }
    }

    // 1. Limpa TODOS os caches antigos salvos no celular dela
    if ('caches' in window) {
        caches.keys().then(function(names) {
            for (let name of names) {
                caches.delete(name);
            }
        });
    }

    // 2. Mata o Service Worker velho (Aquele arquivo sw.js)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(function(registrations) {
            for (let registration of registrations) {
                registration.unregister();
            }
        }).then(() => {
            // 3. Força um "F5 Mágico" que ignora o cache e baixa tudo do GitHub de novo!
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    } else {
        // Se o celular for antigo e não tiver Service Worker, só dá um F5
        window.location.reload();
    }
};


// ============================================================================
// 🐯 MOTOR MATEMÁTICO, GRÁFICO E SONORO: TIGRINHO (FORTUNE TIGER)
// ============================================================================

// 🚨 ROTEADOR MESTRE DE MESAS (ATUALIZADO PARA O TIGRINHO)
const roteadorMestreCassino = window.abrirMesaCassino;
window.abrirMesaCassino = function(nomeDoJogo) {
    if (nomeDoJogo === 'tigrinho') {
        const mesa = document.getElementById('mesa-tigrinho');
        if(mesa) {
            mesa.classList.remove('escondido');
            mesa.style.display = 'flex';
            if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
            if(typeof construirGridTigrinho === 'function') construirGridTigrinho();
        }
    } else {
        // Se não for tigrinho, tenta abrir os outros jogos através do roteador antigo
        if(typeof roteadorMestreCassino === 'function') {
            roteadorMestreCassino(nomeDoJogo);
        }
    }
};

// FUNÇÃO PARA FECHAR O TIGRINHO
window.fecharMesaTigrinho = function() {
    if (typeof motorTigrinho !== 'undefined' && motorTigrinho.girando) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde o giro terminar!", "⚠️");
        return;
    }
    // Desliga o modo auto se estiver saindo
    if (typeof motorTigrinho !== 'undefined' && motorTigrinho.modoAuto) {
        window.alternarGiroAutoTigrinho();
    }
    const mesa = document.getElementById('mesa-tigrinho');
    if(mesa) mesa.style.display = 'none';
};

let motorTigrinho = {
    gridCriado: false,
    girando: false,
    modoAuto: false,
    loopAuto: null,
    modoCartaSorte: false,
    simboloSorte: "",
    gridAtual: ["", "", "", "", "", "", "", "", ""],
    simbolos: [
        { id: 'moeda', emoji: '🪙', mult: 2 },
        { id: 'lanterna', emoji: '🏮', mult: 5 },
        { id: 'saco', emoji: '💰', mult: 10 },
        { id: 'foguete', emoji: '🎇', mult: 20 },
        { id: 'envelope', emoji: '🧧', mult: 50 },
        { id: 'wild', emoji: '🐯', mult: 100 } // O Wild serve como coringa e paga mais
    ],
    // As 5 linhas clássicas de pagamento 3x3
    linhasPagamento: [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Horizontais
        [0, 4, 8], [2, 4, 6]             // Diagonais
    ]
};

window.ajustarApostaTigrinho = function(valor) {
    if (motorTigrinho.girando || motorTigrinho.modoAuto) return;
    const visor = document.getElementById('tigrinho-aposta-input');
    if(!visor) return;
    let novaAposta = parseInt(visor.innerText) + valor;
    if (novaAposta < 10) novaAposta = 10;
    if (novaAposta > (window.pontosDoCasal || 0)) novaAposta = window.pontosDoCasal;
    visor.innerText = novaAposta;
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar(valor > 0 ? 'fichaAdd' : 'fichaSub', 0.6);
    if(window.Haptics) window.Haptics.toqueLeve();
};

function construirGridTigrinho() {
    const grid = document.getElementById('tigrinho-grid');
    grid.innerHTML = "";
    for (let i = 0; i < 9; i++) {
        let cel = document.createElement('div');
        cel.className = 'tigrinho-celula';
        cel.id = `tigrinho-cel-${i}`;
        // Preenche com símbolos aleatórios iniciais
        let symAleatorio = motorTigrinho.simbolos[Math.floor(Math.random() * motorTigrinho.simbolos.length)].emoji;
        cel.innerText = symAleatorio;
        motorTigrinho.gridAtual[i] = symAleatorio;
        grid.appendChild(cel);
    }
    motorTigrinho.gridCriado = true;
}

window.alternarGiroAutoTigrinho = function() {
    const btnAuto = document.getElementById('btn-tigrinho-auto');
    if (motorTigrinho.modoAuto) {
        motorTigrinho.modoAuto = false;
        clearInterval(motorTigrinho.loopAuto);
        if(btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #3498db, #2980b9)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Auto Desligado", "🛑");
    } else {
        motorTigrinho.modoAuto = true;
        if(btnAuto) btnAuto.style.background = 'linear-gradient(145deg, #e74c3c, #c0392b)';
        if(typeof mostrarToast === 'function') mostrarToast("Modo Auto Ligado! 🤖", "✨");
        girarTigrinho(); 
    }
};

window.girarTigrinho = function() {
    if (motorTigrinho.girando) return;

    const input = document.getElementById('tigrinho-aposta-input');
    const aposta = parseInt(input.innerText);
    
    if (aposta < 10 || (window.pontosDoCasal || 0) < aposta) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💔");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6); 
        if(motorTigrinho.modoAuto) alternarGiroAutoTigrinho();
        return;
    }

    // Se NÃO estiver no modo "Carta da Sorte", cobra a aposta normal
    if (!motorTigrinho.modoCartaSorte) {
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(-aposta, "Giro no Tigrinho");
    }

    motorTigrinho.girando = true;
    const btn = document.getElementById('btn-tigrinho-girar');
    if(btn) { btn.style.opacity = "0.5"; btn.style.pointerEvents = "none"; }
    
    limparVitoriasTigrinho();

    // 🚨 A MÁGICA: Sorteio do Modo Carta da Sorte (10% de chance num giro normal)
    if (!motorTigrinho.modoCartaSorte && Math.random() < 0.10) {
        iniciarModoCartaSorte();
        return; // Interrompe o giro normal, o modo carta sorte assume
    }

    executarAnimacaoRolosTigrinho(aposta);
};

function iniciarModoCartaSorte() {
    motorTigrinho.modoCartaSorte = true;
    const mascote = document.getElementById('tigrinho-mascote');
    const msg = document.getElementById('tigrinho-mensagem');
    
    // Escolhe o símbolo da sorte
    const symObj = motorTigrinho.simbolos[Math.floor(Math.random() * (motorTigrinho.simbolos.length - 1))]; // Exclui o Wild
    motorTigrinho.simboloSorte = symObj.emoji;

    if(mascote) mascote.classList.add('tigrinho-modo-sorte');
    if(msg) {
        msg.innerText = `🔥 CARTA DA SORTE: ${motorTigrinho.simboloSorte} 🔥`;
        msg.style.color = "#00f2fe";
    }

    // 🔊 SOM DE TENSÃO SUPREMA!
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('roleta', 1.0); // Som tenso longo
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300, 100, 500]);
                    }
    if(typeof mostrarToast === 'function') mostrarToast(`O Tigre escolheu ${motorTigrinho.simboloSorte}! Giros Grátis!`, "🐯");

    setTimeout(() => {
        executarAnimacaoRolosTigrinho(parseInt(document.getElementById('tigrinho-aposta-input').innerText));
    }, 2000);
}

// =========================================
// 🐯 MOTOR AUDIOVISUAL DO TIGRINHO PREMIER
// =========================================

function executarAnimacaoRolosTigrinho(aposta) {
    if(!window.SantuarioSomPausado && window.CassinoAudio) window.CassinoAudio.tocar('slotsStart', 0.8);
    if(window.Haptics) window.Haptics.toqueForte();

    let novoGrid = [];
    let chanceDerrota = motorTigrinho.modoCartaSorte ? 0.35 : 0.70;

    for (let i = 0; i < 9; i++) {
        if (motorTigrinho.modoCartaSorte && motorTigrinho.gridAtual[i] === motorTigrinho.simboloSorte) {
            novoGrid[i] = motorTigrinho.simboloSorte;
            continue; 
        }
        let sorteio = Math.random();
        novoGrid[i] = sorteio < chanceDerrota ? 
                      motorTigrinho.simbolos[Math.floor(Math.random() * 3)].emoji : 
                      motorTigrinho.simbolos[Math.floor(Math.random() * motorTigrinho.simbolos.length)].emoji;
    }

    // 🚨 A MÁGICA: Inicia animação e garante a limpeza posterior
    for(let i=0; i<9; i++) {
        const cel = document.getElementById(`tigrinho-cel-${i}`);
        if(cel && !cel.classList.contains('tigrinho-celula-trancada')) {
            cel.classList.add('tigrinho-girando');
        }
    }

    let trocasFalsas = setInterval(() => {
        for (let i = 0; i < 9; i++) {
            const cel = document.getElementById(`tigrinho-cel-${i}`);
            if (cel && cel.classList.contains('tigrinho-girando')) {
                cel.innerText = motorTigrinho.simbolos[Math.floor(Math.random() * motorTigrinho.simbolos.length)].emoji;
            }
        }
    }, 60);

    // Parada escalonada das colunas para gerar suspense (0.8s, 1.4s, 2.0s)
    [0, 1, 2].forEach(col => {
        setTimeout(() => {
            for (let lin = 0; lin < 3; lin++) {
                let index = col + (lin * 3);
                const cel = document.getElementById(`tigrinho-cel-${index}`);
                if (cel && cel.classList.contains('tigrinho-girando')) {
                    cel.classList.remove('tigrinho-girando'); // 🚨 LIMPA O DESFOQUE AQUI
                    cel.innerText = novoGrid[index];
                    motorTigrinho.gridAtual[index] = novoGrid[index];
                    
                    // Juice: Pequeno "pulo" ao parar
                    cel.style.transform = "scale(0.9)";
                    setTimeout(() => cel.style.transform = "scale(1)", 100);
                }
            }
            if(!window.SantuarioSomPausado && window.CassinoAudio) window.CassinoAudio.tocar('slotsPlin', 0.6);
            if(window.Haptics) window.Haptics.toqueLeve();
        }, 800 + (col * 600));
    });

    setTimeout(() => {
        clearInterval(trocasFalsas);
        avaliarGridTigrinho(novoGrid, aposta);
    }, 2200);
}

function avaliarGridTigrinho(grid, aposta) {
    let lucroTotal = 0;
    let celulasVencedoras = new Set();
    const msgVisor = document.getElementById('tigrinho-mensagem');

    // 1. MODO CARTA DA SORTE (RESPEITANDO O RITMO)
    if (motorTigrinho.modoCartaSorte) {
        let novosTrancados = 0;
        for (let i = 0; i < 9; i++) {
            if (grid[i] === motorTigrinho.simboloSorte) {
                if (!document.getElementById(`tigrinho-cel-${i}`).classList.contains('tigrinho-celula-trancada')) {
                    novosTrancados++;
                }
                celulasVencedoras.add(i);
                document.getElementById(`tigrinho-cel-${i}`).classList.add('tigrinho-celula-trancada');
            }
        }

        if (celulasVencedoras.size === 9) {
            let multSym = motorTigrinho.simbolos.find(s => s.emoji === motorTigrinho.simboloSorte).mult;
            lucroTotal = aposta * multSym * 10;
            encerrarGiroTigrinho(lucroTotal, true, true);
            return;
        }

        if (novosTrancados > 0) {
            if(!window.SantuarioSomPausado && window.CassinoAudio) window.CassinoAudio.tocar('minesDiamante', 0.8);
            msgVisor.innerText = `MAIS UM! ${motorTigrinho.simboloSorte}`;
            setTimeout(() => executarAnimacaoRolosTigrinho(aposta), 1200);
            return;
        } else {
            // Fim do Modo Sorte
            motorTigrinho.modoCartaSorte = false;
            document.getElementById('tigrinho-mascote').classList.remove('tigrinho-modo-sorte-ativo');
            msgVisor.innerText = "Calculando Vitórias...";
            Array.from(document.querySelectorAll('.tigrinho-celula')).forEach(c => c.classList.remove('tigrinho-celula-trancada'));
        }
    }

    // 2. VERIFICAÇÃO DE LINHAS (DOPAMINA AUDIOVISUAL)
    motorTigrinho.linhasPagamento.forEach(linha => {
        let s1 = grid[linha[0]], s2 = grid[linha[1]], s3 = grid[linha[2]];
        if ((s1===s2 && s2===s3) || (s1==='🐯' && s2===s3) || (s2==='🐯' && s1===s3)) {
            linha.forEach(i => celulasVencedoras.add(i));
            let symReal = s1 === '🐯' ? s2 : s1;
            let mult = (motorTigrinho.simbolos.find(s => s.emoji === symReal) || {mult:10}).mult;
            lucroTotal += aposta * mult;
        }
    });

    celulasVencedoras.forEach(i => document.getElementById(`tigrinho-cel-${i}`).classList.add('tigrinho-celula-vitoria'));
    encerrarGiroTigrinho(lucroTotal, lucroTotal > 0, false);
}

function encerrarGiroTigrinho(lucro, venceu, telaCheia) {
    if (venceu) {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
        if(typeof atualizarPontosCasal === 'function') atualizarPontosCasal(lucro, "Bênção do Tigrinho!");
        
        if (telaCheia) {
            // O MEGA PAGAMENTO DA CARTA DA SORTE
            if(window.CassinoAudio && !window.SantuarioSomPausado) setTimeout(()=> window.CassinoAudio.tocar('slotsWin', 1.0), 500);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([200, 100, 300, 100, 500, 200, 500]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#f1c40f', '#ffffff'], particleCount: 300, spread: 160});
            if(typeof mostrarToast === 'function') mostrarToast(`TELA CHEIA! MEGA BIG WIN! +${lucro}💰`, "🐯");
        } else {
            // Pagamento normal de linha
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 200, 100, 200, 400]);
                    }
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#d35400'], particleCount: 100});
            if(typeof mostrarToast === 'function') mostrarToast(`BIG WIN! +${lucro}💰`, "🎉");
        }
    } else {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 300]);
                    }
    }

    setTimeout(() => {
        motorTigrinho.girando = false;
        const btn = document.getElementById('btn-tigrinho-girar');
        if(btn) { btn.style.opacity = "1"; btn.style.pointerEvents = "auto"; }

        // Se estiver no Modo Auto e não for a Carta da Sorte travando, roda de novo
        if (motorTigrinho.modoAuto && !motorTigrinho.modoCartaSorte) {
            motorTigrinho.loopAuto = setTimeout(window.girarTigrinho, 1500);
        }
    }, 2000);
}

function limparVitoriasTigrinho() {
    Array.from(document.querySelectorAll('.tigrinho-celula')).forEach(cel => {
        cel.classList.remove('tigrinho-celula-vitoria');
    });
}


// ============================================================================
// LOBBY DO CASSINO A DOIS (PVP/CO-OP)
// ============================================================================

window.abrirCassinoDois = function() {
    const overlay = document.getElementById('overlay-cassino-dois');
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.classList.remove('escondido');
    }
};

window.fecharCassinoDois = function() {
    const overlay = document.getElementById('overlay-cassino-dois');
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.add('escondido');
    }
};



// ============================================================================
// 🚪 ROTEADOR GERAL: ARENA CONEXÃO (ATUALIZADO: CASINO BRIDGE)
// ============================================================================
if (typeof window.roteadorCapturado === 'undefined') {
    window.originalAbrirMesa = window.abrirMesaCassino;
    window.roteadorCapturado = true;
}

window.abrirMesaCassino = function(nomeDoJogo) {
    document.querySelectorAll('[id^="mesa-"]').forEach(m => { 
        m.classList.add('escondido'); m.style.display = 'none'; 
    });
    
    if (nomeDoJogo === 'bj-coop') {
        const mesa = document.getElementById('mesa-bj-coop');
        if(mesa) { mesa.classList.remove('escondido'); mesa.style.display = 'flex'; }
        if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();
        if(typeof iniciarOuvinteBlackjack === 'function') iniciarOuvinteBlackjack();
        return; 
    }

    let idMesa = nomeDoJogo.toLowerCase();
    if (idMesa.includes('roleta')) idMesa = 'roleta-multi';
    if (idMesa.includes('poker') && !idMesa.includes('carib')) idMesa = 'poker';
    if (idMesa.includes('craps') || idMesa.includes('dados')) idMesa = 'craps';
    if (idMesa.includes('sic') || idMesa.includes('trindade')) idMesa = 'sicbo';
    if (idMesa.includes('baccarat') || idMesa.includes('bacara')) idMesa = 'baccarat';
    if (idMesa.includes('carib')) idMesa = 'carib';
    if (idMesa.includes('paigow') || idMesa.includes('pai')) idMesa = 'paigow';
    if (idMesa.includes('wheel') || idMesa.includes('fortuna')) idMesa = 'wheel';
    // 🚨 ADICIONADO RECONHECIMENTO DO CASINO BRIDGE
    if (idMesa.includes('bridge') || idMesa.includes('ponte')) idMesa = 'bridge';

    const mesa = document.getElementById('mesa-' + idMesa);
    if(mesa) { mesa.classList.remove('escondido'); mesa.style.display = 'flex'; }
    
    if(typeof sincronizarMoedasUI === 'function') sincronizarMoedasUI();

    if (idMesa === 'uno' && typeof iniciarOuvinteUno === 'function') iniciarOuvinteUno();
    else if (idMesa === 'poker' && typeof iniciarOuvintePoker === 'function') iniciarOuvintePoker();
    else if (idMesa === 'roleta-multi' && typeof iniciarOuvinteRoletaMulti === 'function') iniciarOuvinteRoletaMulti();
    else if (idMesa === 'craps' && typeof iniciarOuvinteCraps === 'function') iniciarOuvinteCraps();
    else if (idMesa === 'sicbo' && typeof iniciarOuvinteSicBo === 'function') iniciarOuvinteSicBo();
    else if (idMesa === 'baccarat' && typeof iniciarOuvinteBaccarat === 'function') iniciarOuvinteBaccarat();
    else if (idMesa === 'carib' && typeof iniciarOuvinteCarib === 'function') iniciarOuvinteCarib();
    else if (idMesa === 'paigow' && typeof iniciarOuvintePaiGow === 'function') iniciarOuvintePaiGow();
    else if (idMesa === 'wheel' && typeof iniciarOuvinteWheel === 'function') iniciarOuvinteWheel();
    // 🚨 IGNICÃO DO BRIDGE
    else if (idMesa === 'bridge' && typeof iniciarOuvinteBridge === 'function') iniciarOuvinteBridge();
    
    else if (typeof window.originalAbrirMesa === 'function') window.originalAbrirMesa(nomeDoJogo);
};

// ============================================================================
// 🌉 MOTOR REAL-TIME: CASINO BRIDGE ROYALE (RED DOG CO-OP)
// ============================================================================

window.motorBridge = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAnte: 50,
    vitoriaComemorada: false, quemFinalizou: '', spread: 0,
    prontos: { joao: false, thamiris: false },
    cartas: { pilar1: null, pilar2: null, passo: null },
    acaoEquipe: '' // 'atravessar', 'recuar' ou 'auto'
};

window.fecharMesaBridge = function() {
    const mesa = document.getElementById('mesa-bridge');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function safeParseBridge(val) {
    if (typeof val === 'object' && val !== null) return val;
    if (typeof val === 'string' && val.trim() !== '') {
        try { return JSON.parse(val); } catch(e) { return null; }
    }
    return null;
}

function gerarBaralhoBridge() {
    const naipes = ['♥️', '♦️', '♣️', '♠️'];
    const valores = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let baralho = [];
    for(let n of naipes) {
        for(let v of valores) {
            baralho.push({ naipe: n, valor: v, cor: (n==='♥️'||n==='♦️') ? 'poker-red' : 'poker-black' });
        }
    }
    return baralho.sort(() => Math.random() - 0.5);
}

function criarDivCartaBridge(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s; width: 70px; height: 100px; font-size: 1.1em;">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro" style="font-size: 2.2rem;">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

function getValorNumericoBridge(valStr) {
    const mapa = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    return mapa[valStr] || 0;
}

window.iniciarOuvinteBridge = function() {
    window.motorBridge.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorBridge.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/bridge_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorBridge.status = data.status || 'apostando';
            window.motorBridge.quemFinalizou = data.quemFinalizou || '';
            window.motorBridge.apostaAnte = Number(data.apostaAnte) || 50;
            window.motorBridge.prontos = data.prontos || { joao: false, thamiris: false };
            window.motorBridge.spread = data.spread || 0;
            window.motorBridge.acaoEquipe = data.acaoEquipe || '';
            
            const cData = data.cartas || {};
            window.motorBridge.cartas = {
                pilar1: safeParseBridge(cData.pilar1),
                pilar2: safeParseBridge(cData.pilar2),
                passo: safeParseBridge(cData.passo)
            };

            renderMesaBridge();

            if (window.motorBridge.status === 'resultado' && !window.motorBridge.vitoriaComemorada) {
                window.motorBridge.vitoriaComemorada = true;
                processarFimBridge();
            }
        } catch (e) {
            console.error("Erro na leitura do Bridge:", e);
        }
    });

    const visor = document.getElementById('bridge-valor-aposta');
    if (visor) visor.innerText = window.motorBridge.apostaAnte;
};

window.ajustarApostaBridge = function(delta) {
    if (window.motorBridge.status !== 'apostando') return;
    if (window.motorBridge.prontos[window.motorBridge.meuId]) return;
    
    let atual = Number(window.motorBridge.apostaAnte) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    const maxAposta = Math.floor(saldo / 6); // Limite de segurança porque a aposta pode dobrar
    if (novoValor > maxAposta) novoValor = maxAposta;
    if (novoValor < 10) novoValor = 10;
    
    window.motorBridge.apostaAnte = novoValor;
    const visor = document.getElementById('bridge-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.iniciarRodadaBridge = async function() {
    if (window.motorBridge.status !== 'apostando') return;
    if (window.motorBridge.prontos[window.motorBridge.meuId]) return;

    let ante = Number(window.motorBridge.apostaAnte);
    if (isNaN(ante) || ante <= 0) return;

    let custoTotal = ante * 2; // Um ante do João, um da Thamiris
    if (Number(window.pontosDoCasal) < custoTotal) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente no Cofre!", "💸");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const bridgeRef = ref(db, `cassino/bridge_royale`);

    const snap = await get(bridgeRef);
    let prontos = (snap.val() || {}).prontos || { joao: false, thamiris: false };
    prontos[window.motorBridge.meuId] = true;

    if (prontos[window.motorBridge.parceiroId] === true) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoTotal, `Casino Bridge (Pedágio)`);
        }

        let baralho = gerarBaralhoBridge(); 
        let c1 = baralho.pop();
        let c2 = baralho.pop();
        let c3 = baralho.pop(); // A carta do destino (escondida no Firebase)

        // Organiza Pilar1 para ser sempre o menor
        let v1 = getValorNumericoBridge(c1.valor);
        let v2 = getValorNumericoBridge(c2.valor);
        if (v1 > v2) {
            let temp = c1; c1 = c2; c2 = temp;
            let tempV = v1; v1 = v2; v2 = tempV;
        }

        let spread = v2 - v1 - 1;
        let novoStatus = 'atravessando';
        let quemFim = '';
        let acaoAuto = '';

        // 🧠 AUTOMAÇÃO: Se for Par ou Consecutivo, resolve na hora!
        if (spread <= 0) {
            novoStatus = 'resultado';
            quemFim = window.motorBridge.meuId;
            acaoAuto = 'auto';
        }

        await update(bridgeRef, {
            status: novoStatus,
            apostaAnte: ante,
            quemFinalizou: quemFim,
            spread: spread,
            acaoEquipe: acaoAuto,
            cartas: { pilar1: JSON.stringify(c1), pilar2: JSON.stringify(c2), passo: JSON.stringify(c3) },
            prontos: { joao: false, thamiris: false } 
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(bridgeRef, { prontos: prontos, apostaAnte: ante });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando Aliado pagar Pedágio...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

window.acaoBridge = async function(escolha) {
    if (window.motorBridge.status !== 'atravessando') return;
    if (window.motorBridge.prontos[window.motorBridge.meuId]) return;

    const ante = Number(window.motorBridge.apostaAnte);
    const custoTravessia = ante * 2; // O "Call" (Cross) custa o mesmo que o Ante pago. Então 2x de débito na conta.

    if (escolha === 'atravessar') {
        const saldo = Number(window.pontosDoCasal);
        if (saldo < custoTravessia) {
            if(typeof mostrarToast === 'function') mostrarToast("Fichas insuficientes para Atravessar!", "💸");
            return;
        }
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoTravessia, `Casino Bridge (Travessia)`);
        }
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const bridgeRef = ref(db, `cassino/bridge_royale`);

    const snap = await get(bridgeRef);
    let dataAtual = snap.val() || {};
    let prontos = dataAtual.prontos || { joao: false, thamiris: false };
    
    prontos[window.motorBridge.meuId] = true;
    let up = { prontos: prontos };

    // Se um decidir recuar, a equipe toda recua (Decisão drástica Co-op)
    let acaoDefinitiva = (dataAtual.acaoEquipe === 'recuar' || escolha === 'recuar') ? 'recuar' : 'atravessar';
    up.acaoEquipe = acaoDefinitiva;

    if (prontos[window.motorBridge.parceiroId] === true) {
        up.status = 'resultado';
        up.quemFinalizou = window.motorBridge.meuId; 
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Decisão tomada. Aguardando parceiro...", "🔒");
    }

    await update(bridgeRef, up);
};

async function processarFimBridge() {
    const ante = Number(window.motorBridge.apostaAnte);
    const cb = window.motorBridge.cartas;
    const spread = window.motorBridge.spread;
    const acao = window.motorBridge.acaoEquipe;
    let ganhoTotal = 0;

    let v1 = getValorNumericoBridge(cb.pilar1.valor);
    let v2 = getValorNumericoBridge(cb.pilar2.valor);
    let v3 = getValorNumericoBridge(cb.passo.valor);

    // 🧠 A MATEMÁTICA CRUEL DA PONTE
    if (acao === 'recuar') {
        // Fugiram. O Ante foi perdido. Volta Zero.
        ganhoTotal = 0;
    } 
    else if (spread === -1) {
        // Os Pilares são um PAR.
        if (v3 === v1) {
            // Trinca! Paga 11:1 no Ante. 
            ganhoTotal = (ante * 2) + ((ante * 2) * 11);
        } else {
            // Empate. Devolve o Ante.
            ganhoTotal = ante * 2;
        }
    } 
    else if (spread === 0) {
        // Consecutivos (Não há ponte). Empate. Devolve o Ante.
        ganhoTotal = ante * 2;
    } 
    else if (acao === 'atravessar' || acao === 'auto') {
        // Decidiram cruzar a ponte! O custo total na mesa agora é Ante + Travessia = 4x Ante.
        const custoTotalPago = ante * 4;
        
        if (v3 > v1 && v3 < v2) {
            // Sucesso! Bateu dentro do Spread.
            let mult = 1;
            if (spread === 1) mult = 5;
            else if (spread === 2) mult = 4;
            else if (spread === 3) mult = 2;
            
            // O Ante paga 1:1, a Travessia paga o Multiplicador
            ganhoTotal = custoTotalPago + ((ante * 2) * mult);
        } else {
            // Caiu fora da ponte ou bateu na trave (empate com pilar perde).
            ganhoTotal = 0;
        }
    }

    // 1️⃣ FESTA VISUAL PARA OS DOIS
    setTimeout(() => {
        if (ganhoTotal > (ante * 4)) {
            if(typeof confetti === 'function') confetti({colors: ['#00d2d3', '#f1c40f'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`TRAVESSIA ÉPICA! +${ganhoTotal} 💰!`, "🌉");
        } else if (ganhoTotal > 0) {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`SALVOS! +${ganhoTotal} devolvidos.`, "🤝");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Ponte quebrou... 💀`, "💸");
        }
    }, 1500);

    // 2️⃣ TRANSAÇÃO SEGURA E RESET
    if (window.motorBridge.quemFinalizou === window.motorBridge.meuId) {
        setTimeout(async () => {
            if (ganhoTotal > 0) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Casino Bridge`);
            }
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, `cassino/bridge_royale`), {
                status: 'apostando', apostaAnte: window.motorBridge.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}, acaoEquipe: '', spread: 0
            });
        }, 1600);
    }
}

function renderMesaBridge() {
    const cb = window.motorBridge;
    const painelAposta = document.getElementById('bridge-painel-aposta');
    const painelAcao = document.getElementById('bridge-painel-acao');
    const btnNovaMao = document.getElementById('btn-bridge-novamao');
    const pilar1 = document.getElementById('bridge-pilar1');
    const pilar2 = document.getElementById('bridge-pilar2');
    const passo = document.getElementById('bridge-passo');
    const infoSpread = document.getElementById('bridge-info-spread');
    const infoRes = document.getElementById('bridge-resultado-jogador');

    if (!painelAposta) return;

    if (cb.status === 'apostando') {
        painelAposta.style.display = 'flex';
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.add('escondido');
        
        pilar1.innerHTML = ''; pilar1.style.border = "2px dashed rgba(255,255,255,0.2)";
        pilar2.innerHTML = ''; pilar2.style.border = "2px dashed rgba(255,255,255,0.2)";
        passo.innerHTML = ''; passo.style.border = "2px solid #f1c40f";
        
        infoSpread.innerText = 'Distância: ?';
        infoRes.innerText = 'AGUARDANDO PEDÁGIO';
        infoRes.style.color = '#f1c40f';

        const btnInic = document.getElementById('btn-iniciar-bridge');
        if (cb.prontos[cb.meuId]) {
            btnInic.innerText = "AGUARDANDO... ⏳"; btnInic.style.background = "#555";
        } else {
            btnInic.innerText = "ERGUER PILARES 🏛️"; btnInic.style.background = "linear-gradient(145deg, #00d2d3, #01a3a4)";
        }
        return; 
    }

    painelAposta.style.display = 'none';

    // Renderiza Pilares
    if (cb.cartas.pilar1 && pilar1.innerHTML === '') {
        pilar1.style.border = "none";
        pilar1.innerHTML = criarDivCartaBridge(cb.cartas.pilar1, 0.1);
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.5);
    }
    if (cb.cartas.pilar2 && pilar2.innerHTML === '') {
        pilar2.style.border = "none";
        setTimeout(()=> { 
            pilar2.innerHTML = criarDivCartaBridge(cb.cartas.pilar2, 0.1); 
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.5);
        }, 300);
    }

    // Textos Intermediários
    if (cb.spread === -1) infoSpread.innerText = '⚠️ OS PILARES SÃO IGUAIS (PAR)';
    else if (cb.spread === 0) infoSpread.innerText = '⚠️ SEM ESPAÇO (CONSECUTIVAS)';
    else infoSpread.innerText = `Distância: ${cb.spread} Cartas`;

    if (cb.status === 'atravessando') {
        painelAcao.classList.remove('escondido');
        infoRes.innerText = `VÃO ATRAVESSAR A PONTE?`;
        
        const btnCruzar = document.getElementById('btn-bridge-cruzar');
        const btnRecuar = document.getElementById('btn-bridge-recuar');
        if (cb.prontos[cb.meuId]) {
            btnCruzar.innerText = "AGUARDANDO... ⏳"; btnCruzar.style.background = "#555";
            btnRecuar.innerText = "⏳"; btnRecuar.style.background = "#555";
        } else {
            btnCruzar.innerText = `ATRAVESSAR (+${cb.apostaAnte * 2}💰)`; btnCruzar.style.background = "linear-gradient(145deg, #f1c40f, #f39c12)";
            btnRecuar.innerText = "RECUAR"; btnRecuar.style.background = "linear-gradient(145deg, #e74c3c, #c0392b)";
        }
    } 
    else if (cb.status === 'resultado') {
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.remove('escondido');

        if (cb.acaoEquipe === 'recuar') {
            infoRes.innerText = `A EQUIPE RECUOU (FOLD)`;
            infoRes.style.color = '#e74c3c';
        } else {
            // Revela a carta destino com suspense
            if (cb.cartas.passo && passo.innerHTML === '') {
                passo.style.border = "none";
                setTimeout(()=> { 
                    passo.innerHTML = criarDivCartaBridge(cb.cartas.passo, 0.1);
                    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 0.8);
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
                    
                    // Avalia na tela o resultado
                    let v1 = getValorNumericoBridge(cb.cartas.pilar1.valor);
                    let v2 = getValorNumericoBridge(cb.cartas.pilar2.valor);
                    let v3 = getValorNumericoBridge(cb.cartas.passo.valor);
                    
                    if (cb.spread === -1 && v3 === v1) { infoRes.innerText = `🔥 TRINCA JACKPOT!`; infoRes.style.color = '#00d2d3'; }
                    else if (cb.spread <= 0) { infoRes.innerText = `EMPATE SEGURO!`; infoRes.style.color = '#bdc3c7'; }
                    else if (v3 > v1 && v3 < v2) { infoRes.innerText = `TRAVESSIA CONCLUÍDA!`; infoRes.style.color = '#2ecc71'; }
                    else { infoRes.innerText = `A PONTE QUEBROU!`; infoRes.style.color = '#e74c3c'; }
                }, 800);
            }
        }
    }
}

// 🚨 A FUNÇÃO QUE FALTAVA: Reseta a mesa para a próxima rodada
window.resetarMesaBridge = async function() {
    window.motorBridge.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    // Limpa as cartas e zera a mesa na nuvem
    await set(ref(db, `cassino/bridge_royale`), {
        status: 'apostando', 
        apostaAnte: window.motorBridge.apostaAnte, 
        quemFinalizou: '', 
        prontos: {joao: false, thamiris: false}, 
        acaoEquipe: '', 
        spread: 0,
        cartas: { pilar1: null, pilar2: null, passo: null }
    });
};

// ============================================================================
// 🎡 MOTOR REAL-TIME: WHEEL OF FORTUNE (SINCRONIA E FÍSICA ACUMULATIVA)
// ============================================================================

// A roda tem 12 fatias exatas na ordem do nosso gradiente CSS (Sentido Horário)
const fatiasWheel = ['1', '2', '1', '5', '1', '2', '10', '1', '2', '5', '20', 'jackpot'];
window.anguloGlobalWheel = 0; // Essencial para a roda nunca voltar para trás

window.motorWheel = {
    meuId: '', parceiroId: '',
    status: 'apostando',
    apostas: {},
    resultadoSorteado: null,
    quemFinalizou: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } 
};

// Áudio mecânico da roleta (reciclado)
const somCatracaWheel = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

window.fecharMesaWheel = function() {
    const mesa = document.getElementById('mesa-wheel');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
    if (!somCatracaWheel.paused) somCatracaWheel.pause();
};

window.iniciarOuvinteWheel = function() {
    window.motorWheel.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorWheel.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/wheel_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            // Gatilho de Física: Se o status mudou para girando AGORA, roda a animação
            if (data.status === 'girando' && window.motorWheel.status !== 'girando') {
                window.motorWheel.resultadoSorteado = data.resultadoSorteado;
                window.motorWheel.quemFinalizou = data.quemFinalizou;
                window.motorWheel.status = 'girando';
                animarGiroWheel();
            }

            window.motorWheel.status = data.status || 'apostando';
            window.motorWheel.apostas = data.apostas || {};
            window.motorWheel.resultadoSorteado = data.resultadoSorteado || null;
            window.motorWheel.quemFinalizou = data.quemFinalizou || '';
            window.motorWheel.prontos = data.prontos || { joao: false, thamiris: false };

            renderMesaWheel();
        } catch (e) {
            console.error("Erro no ouvinte da Wheel:", e);
        }
    });

    const visor = document.getElementById('wheel-ficha-valor');
    if (visor) visor.innerText = window.motorWheel.valorFicha;
};

window.ajustarFichaWheel = function(delta) {
    if (window.motorWheel.status !== 'apostando') return;
    if (window.motorWheel.prontos[window.motorWheel.meuId]) return;
    
    let atual = Number(window.motorWheel.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorWheel.valorFicha = novoValor;
    const visor = document.getElementById('wheel-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarWheel = async function(tipo) {
    if (window.motorWheel.status !== 'apostando') return;
    
    if (window.motorWheel.prontos[window.motorWheel.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Você já confirmou sua aposta!", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorWheel.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta Wheel: ${tipo.toUpperCase()}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/wheel_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorWheel.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasWheel = async function() {
    if (window.motorWheel.status !== 'apostando') return;
    if (window.motorWheel.prontos[window.motorWheel.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Apostas travadas. Aguarde o giro!", "🔒");
        return;
    }

    let totalDevolvido = 0;
    Object.values(window.motorWheel.apostas).forEach(ap => {
        if (ap.autor === window.motorWheel.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Wheel");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/wheel_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaWheel() {
    const statusTxt = document.getElementById('wheel-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorWheel.status === 'girando' ? "A SORTE ESTÁ LANÇADA..." : "FAÇAM SUAS APOSTAS";
        statusTxt.style.color = window.motorWheel.status === 'girando' ? "#f1c40f" : "#9b59b6";
    }

    document.querySelectorAll('#wheel-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorWheel.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-wheel-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    const btnLancar = document.getElementById('btn-girar-wheel');
    if (btnLancar) {
        if (window.motorWheel.prontos[window.motorWheel.meuId]) {
            btnLancar.innerText = "AGUARDANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "GIRAR RODA 🎡";
            btnLancar.style.background = "linear-gradient(145deg, #9b59b6, #8e44ad)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(155, 89, 182, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#fff";
        }
    }
}

// 🚨 O SORTEIO DE SINCRONIA DUPLA
window.girarWheelCoop = async function() {
    if (window.motorWheel.status !== 'apostando') return;
    if (window.motorWheel.prontos[window.motorWheel.meuId]) return;

    if (Object.keys(window.motorWheel.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("A roda precisa de fichas para girar!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const wheelRef = ref(db, `cassino/wheel_royale`);

    const snap = await get(wheelRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    prontos[window.motorWheel.meuId] = true;

    if (prontos[window.motorWheel.parceiroId] === true) {
        // O Cassino Sorteia um índice de 0 a 11 (As 12 Fatias)
        const indSorteado = Math.floor(Math.random() * 12);

        await update(wheelRef, {
            status: 'girando',
            resultadoSorteado: indSorteado,
            quemFinalizou: window.motorWheel.meuId,
            prontos: { joao: false, thamiris: false } 
        });
    } else {
        await update(wheelRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando confirmação...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarGiroWheel() {
    const disco = document.getElementById('wheel-disco');
    const resVisor = document.getElementById('wheel-resultado-visor');
    if (!disco || !resVisor || window.motorWheel.resultadoSorteado === null) return;

    resVisor.classList.add('escondido');
    
    if(!window.SantuarioSomPausado) {
        somCatracaWheel.currentTime = 0;
        somCatracaWheel.play().catch(()=>{});
    }

    // 🚨 MATEMÁTICA CSS ACUMULATIVA:
    // A Roda tem 12 fatias de 30 graus. O meio da fatia '0' fica aos 15 graus.
    // Para a fatia sorteada ficar no topo, giramos no mínimo 10 voltas (3600 graus) + o ajuste da fatia.
    window.anguloGlobalWheel += 3600; 
    
    const indice = window.motorWheel.resultadoSorteado;
    const ajuste = (indice * 30) + 15;
    const anguloFinal = window.anguloGlobalWheel + (360 - ajuste);

    disco.style.transition = 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)';
    disco.style.transform = `rotate(${anguloFinal}deg)`;

    // Após 5 segundos de giro de tirar o fôlego...
    setTimeout(() => {
        somCatracaWheel.pause();
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        
        const valorFatia = fatiasWheel[indice];
        document.getElementById('wheel-res-texto').innerText = valorFatia === 'jackpot' ? '⭐' : `${valorFatia}x`;
        resVisor.classList.remove('escondido');

        processarRecompensaWheel();
    }, 5100);
}

// 🚨 O POP-UP APARECE PARA OS DOIS, MAS O COFRE SÓ É PROCESSADO POR UM
async function processarRecompensaWheel() {
    const indice = window.motorWheel.resultadoSorteado;
    const resultTipo = fatiasWheel[indice];
    
    let ganhoTotal = 0;
    
    // Tabela de Pagamentos Padrão (Pays "To One")
    // Apostar 50 no 10x, retorna 50 + 500 = 550. Multiplicador total = 11.
    const pagamentos = {
        '1': 2,
        '2': 3,
        '5': 6,
        '10': 11,
        '20': 21,
        'jackpot': 41
    };

    const multFinal = pagamentos[resultTipo];

    Object.values(window.motorWheel.apostas).forEach(ap => {
        if (ap.tipo === resultTipo) {
            ganhoTotal += (Number(ap.valor) * multFinal);
        }
    });

    // 1️⃣ A FESTA VISUAL PARA OS DOIS
    setTimeout(() => {
        if (ganhoTotal > 0) {
            if(typeof confetti === 'function') confetti({colors: ['#9b59b6', '#f1c40f'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A RODA PAGOU +${ganhoTotal} 💰!`, "🎡");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Banca engoliu as fichas... 💀`, "💸");
        }
    }, 100);

    // 2️⃣ A TRANSAÇÃO FINANCEIRA (Só roda no celular do Último a Clicar)
    if (window.motorWheel.quemFinalizou === window.motorWheel.meuId) {
        setTimeout(async () => {
            if (ganhoTotal > 0) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Wheel of Fortune (${resultTipo})`);
            }
            
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, `cassino/wheel_royale`), { 
                status: 'apostando', apostas: {}, resultadoSorteado: null, quemFinalizou: '', prontos: {joao: false, thamiris: false} 
            });
            
            document.getElementById('wheel-resultado-visor').classList.add('escondido');
        }, 3000); // Reseta a mesa após 3 segundos do pop-up
    }
}

// ============================================================================
// 🀄 MOTOR REAL-TIME: PAI GOW TILES (BLINDADO CONTRA JSON ERRORS)
// ============================================================================

window.motorPaiGow = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAnte: 50,
    vitoriaComemorada: false, quemFinalizou: '',
    prontos: { joao: false, thamiris: false },
    dealer: { high: [], low: [], scoreHigh: 0, scoreLow: 0 },
    jogadores: { 
        joao: { high: [], low: [], scoreHigh: 0, scoreLow: 0 }, 
        thamiris: { high: [], low: [], scoreHigh: 0, scoreLow: 0 } 
    }
};

window.fecharMesaPaiGow = function() {
    const mesa = document.getElementById('mesa-paigow');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarPecasPaiGow() {
    let tiles = [];
    for(let i=1; i<=6; i++) {
        for(let j=i; j<=6; j++) {
            tiles.push({v1: i, v2: j});
            tiles.push({v1: i, v2: j}); 
        }
    }
    return tiles.sort(() => Math.random() - 0.5);
}

function criarDivPaiGow(peca, delay) {
    if (!peca) return '';
    return `<div class="paigow-tile animacao-distribuir" style="animation-delay: ${delay}s">
        <div class="pt-top">${peca.v1}</div>
        <div class="pt-divisor"></div>
        <div class="pt-bot">${peca.v2}</div>
    </div>`;
}

function calcPtsPaiGow(t1, t2) {
    if (!t1 || !t2) return 0;
    let isPair = (t1.v1 === t2.v1 && t1.v2 === t2.v2) || (t1.v1 === t2.v2 && t1.v2 === t2.v1);
    let score = (t1.v1 + t1.v2 + t2.v1 + t2.v2) % 10;
    if (isPair) score += 100;
    return score;
}

function stringScore(pts) {
    if (pts >= 100) return `PAR`;
    return `${pts}`;
}

function otimizarPaiGow(mao) {
    if (!mao || mao.length < 4) return { high: [], low: [], scoreHigh: 0, scoreLow: 0 };
    
    let splits = [
        {h1: mao[0], h2: mao[1], l1: mao[2], l2: mao[3]},
        {h1: mao[0], h2: mao[2], l1: mao[1], l2: mao[3]},
        {h1: mao[0], h2: mao[3], l1: mao[1], l2: mao[2]}
    ];
    let bestSplit = null;
    let bestScore = -1;

    splits.forEach(s => {
        let s1 = calcPtsPaiGow(s.h1, s.h2);
        let s2 = calcPtsPaiGow(s.l1, s.l2);
        let high = Math.max(s1, s2);
        let low = Math.min(s1, s2);
        
        let score = (low * 10) + high; 
        if (score > bestScore) {
            bestScore = score;
            bestSplit = {
                high: s1 === high ? [s.h1, s.h2] : [s.l1, s.l2],
                low: s1 === high ? [s.l1, s.l2] : [s.h1, s.h2],
                scoreHigh: high,
                scoreLow: low
            };
        }
    });
    return bestSplit;
}

// 🛡️ O SANITIZADOR DE ARRAYS (Adeus erro de JSON!)
function safeParsePG(val) {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim() !== '') {
        try { return JSON.parse(val); } catch(e) { return []; }
    }
    return [];
}

window.iniciarOuvintePaiGow = function() {
    window.motorPaiGow.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorPaiGow.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/paigow_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorPaiGow.status = data.status || 'apostando';
            window.motorPaiGow.quemFinalizou = data.quemFinalizou || '';
            window.motorPaiGow.apostaAnte = Number(data.apostaAnte) || 50;
            window.motorPaiGow.prontos = data.prontos || { joao: false, thamiris: false };
            
            const dData = data.dealer || {};
            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            // Limpeza cirúrgica dos Arrays
            window.motorPaiGow.dealer = {
                high: safeParsePG(dData.high),
                low: safeParsePG(dData.low),
                scoreHigh: dData.scoreHigh || 0,
                scoreLow: dData.scoreLow || 0
            };

            window.motorPaiGow.jogadores = {
                joao: { 
                    high: safeParsePG(jInfo.high), 
                    low: safeParsePG(jInfo.low), 
                    scoreHigh: jInfo.scoreHigh || 0, 
                    scoreLow: jInfo.scoreLow || 0 
                },
                thamiris: { 
                    high: safeParsePG(tInfo.high), 
                    low: safeParsePG(tInfo.low), 
                    scoreHigh: tInfo.scoreHigh || 0, 
                    scoreLow: tInfo.scoreLow || 0 
                }
            };

            renderMesaPaiGow();

            if (window.motorPaiGow.status === 'resultado' && !window.motorPaiGow.vitoriaComemorada) {
                window.motorPaiGow.vitoriaComemorada = true;
                processarFimPaiGow();
            }
        } catch (e) {
            console.error("Erro na leitura do Pai Gow:", e);
        }
    });

    const visor = document.getElementById('paigow-valor-aposta');
    if (visor) visor.innerText = window.motorPaiGow.apostaAnte;
};

window.ajustarApostaPaiGow = function(delta) {
    if (window.motorPaiGow.status !== 'apostando') return;
    if (window.motorPaiGow.prontos[window.motorPaiGow.meuId]) return;
    
    let atual = Number(window.motorPaiGow.apostaAnte) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    const maxAposta = Math.floor(saldo / 2); 
    if (novoValor > maxAposta) novoValor = maxAposta;
    if (novoValor < 10) novoValor = 10;
    
    window.motorPaiGow.apostaAnte = novoValor;
    const visor = document.getElementById('paigow-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.iniciarRodadaPaiGow = async function() {
    if (window.motorPaiGow.status !== 'apostando') return;
    if (window.motorPaiGow.prontos[window.motorPaiGow.meuId]) return;

    let ante = Number(window.motorPaiGow.apostaAnte);
    if (isNaN(ante) || ante <= 0) return;

    let custoTotal = ante * 2;
    if (Number(window.pontosDoCasal) < custoTotal) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💸");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const pgRef = ref(db, `cassino/paigow_royale`);

    const snap = await get(pgRef);
    let prontos = (snap.val() || {}).prontos || { joao: false, thamiris: false };
    prontos[window.motorPaiGow.meuId] = true;

    if (prontos[window.motorPaiGow.parceiroId] === true) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoTotal, `Pai Gow Tiles (Aposta)`);
        }

        let saco = gerarPecasPaiGow(); 
        let dMao = [saco.pop(), saco.pop(), saco.pop(), saco.pop()];
        let jMao = [saco.pop(), saco.pop(), saco.pop(), saco.pop()];
        let tMao = [saco.pop(), saco.pop(), saco.pop(), saco.pop()];

        let dOpt = otimizarPaiGow(dMao);
        let jOpt = otimizarPaiGow(jMao);
        let tOpt = otimizarPaiGow(tMao);

        await update(pgRef, {
            status: 'resultado', 
            apostaAnte: ante,
            quemFinalizou: window.motorPaiGow.meuId,
            dealer: { high: JSON.stringify(dOpt.high), low: JSON.stringify(dOpt.low), scoreHigh: dOpt.scoreHigh, scoreLow: dOpt.scoreLow },
            jogadores: {
                joao: { high: JSON.stringify(jOpt.high), low: JSON.stringify(jOpt.low), scoreHigh: jOpt.scoreHigh, scoreLow: jOpt.scoreLow },
                thamiris: { high: JSON.stringify(tOpt.high), low: JSON.stringify(tOpt.low), scoreHigh: tOpt.scoreHigh, scoreLow: tOpt.scoreLow }
            },
            prontos: { joao: false, thamiris: false } 
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(pgRef, { prontos: prontos, apostaAnte: ante });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando Aliado...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

// 🚨 MÁGICA DA UX: Pop-up para todos, dinheiro apenas uma vez!
async function processarFimPaiGow() {
    const d = window.motorPaiGow.dealer;
    const ante = Number(window.motorPaiGow.apostaAnte);
    let ganhoTotal = 0;

    const avaliarMao = (p) => {
        let wonHigh = p.scoreHigh > d.scoreHigh;
        let wonLow = p.scoreLow > d.scoreLow;
        
        if (wonHigh && wonLow) return ante * 2; 
        if (wonHigh || wonLow) return ante;     
        return 0;                               
    };

    const jJoao = window.motorPaiGow.jogadores.joao;
    const jThamiris = window.motorPaiGow.jogadores.thamiris;
    
    ganhoTotal += avaliarMao(jJoao);
    ganhoTotal += avaliarMao(jThamiris);

    // 1️⃣ A FESTA VISUAL (Roda no celular dos dois simultaneamente)
    setTimeout(() => {
        if (ganhoTotal > (ante * 2)) {
            if(typeof confetti === 'function') confetti({colors: ['#e74c3c', '#fdfbf7'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A EQUIPE DOMINOU! +${ganhoTotal} 💰!`, "🀄");
        } else if (ganhoTotal > 0) {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`EMPATE! +${ganhoTotal} devolvidos.`, "🤝");
        } else {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`O Imperador levou tudo... 💀`, "💸");
        }
        
        renderMesaPaiGow(); // Atualiza os textos de "Derrota/Vitória" nas cartas
    }, 1500);

    // 2️⃣ A TRANSAÇÃO FINANCEIRA E RESET DA MESA (Roda APENAS no celular de quem deu o último clique)
    if (window.motorPaiGow.quemFinalizou === window.motorPaiGow.meuId) {
        setTimeout(async () => {
            // Paga o prêmio real no cofre
            if (ganhoTotal > (ante * 2)) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Pai Gow Tiles`);
            } else if (ganhoTotal > 0) {
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Push Pai Gow Tiles`);
            }

            // Reseta a mesa na nuvem
            const { db, ref, set } = window.SantuarioApp.modulos;
            await set(ref(db, `cassino/paigow_royale`), {
                status: 'apostando', apostaAnte: window.motorPaiGow.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}
            });
        }, 1600); // 100ms após o pop-up aparecer
    }
}

function renderMesaPaiGow() {
    const pg = window.motorPaiGow;
    const painelAnte = document.getElementById('paigow-painel-aposta');
    const btnNovaMao = document.getElementById('btn-paigow-novamao');
    const btnInic = document.getElementById('btn-iniciar-paigow');

    if (!painelAnte) return;

    if (pg.status === 'apostando') {
        painelAnte.style.display = 'flex';
        btnNovaMao.classList.add('escondido');
        
        document.getElementById('paigow-dealer-high').innerHTML = '';
        document.getElementById('paigow-dealer-low').innerHTML = '';
        document.getElementById('paigow-oponente-high').innerHTML = '';
        document.getElementById('paigow-oponente-low').innerHTML = '';
        document.getElementById('paigow-jogador-high').innerHTML = '';
        document.getElementById('paigow-jogador-low').innerHTML = '';
        
        document.getElementById('paigow-pts-high').innerText = '';
        document.getElementById('paigow-pts-low').innerText = '';
        document.getElementById('paigow-resultado-jogador').innerText = '';
        document.getElementById('paigow-resultado-oponente').innerText = '';
        document.getElementById('paigow-info-dealer').innerText = '';

        if (pg.prontos[pg.meuId]) {
            btnInic.innerText = "AGUARDANDO... ⏳";
            btnInic.style.background = "#555";
            btnInic.style.boxShadow = "none";
        } else {
            btnInic.innerText = "REVELAR O DESTINO 🀄";
            btnInic.style.background = "linear-gradient(145deg, #c0392b, #8e44ad)";
            btnInic.style.boxShadow = "0 5px 20px rgba(192, 57, 43, 0.4)";
        }
        return; 
    }

    painelAnte.style.display = 'none';

    const desenhar = (divId, arrPecas) => {
        let h = document.getElementById(divId);
        h.innerHTML = '';
        if (Array.isArray(arrPecas)) {
            arrPecas.forEach((p, idx) => h.innerHTML += criarDivPaiGow(p, idx * 0.15));
        }
    };

    // Renderiza limpo, os arrays agora já foram sanitizados!
    desenhar('paigow-dealer-low', pg.dealer.low);
    desenhar('paigow-dealer-high', pg.dealer.high);

    if (pg.status === 'resultado') {
        document.getElementById('paigow-info-dealer').innerText = `Baixa: ${stringScore(pg.dealer.scoreLow)} | Alta: ${stringScore(pg.dealer.scoreHigh)}`;
    }

    const dHigh = pg.dealer.scoreHigh;
    const dLow = pg.dealer.scoreLow;

    const renderJogador = (idJog, pfix) => {
        const j = pg.jogadores[idJog];
        if (!j) return;
        
        desenhar(`paigow-${pfix}-low`, j.low);
        desenhar(`paigow-${pfix}-high`, j.high);
        
        if (idJog === pg.meuId) {
            document.getElementById('paigow-pts-low').innerText = stringScore(j.scoreLow);
            document.getElementById('paigow-pts-high').innerText = stringScore(j.scoreHigh);
        }

        if (pg.status === 'resultado') {
            let winH = j.scoreHigh > dHigh;
            let winL = j.scoreLow > dLow;
            let resT = document.getElementById(`paigow-resultado-${pfix}`);
            
            if (winH && winL) { resT.innerText = '🏆 VITÓRIA (2/2)'; resT.style.color = '#f1c40f'; }
            else if (winH || winL) { resT.innerText = '🤝 EMPATE PUSH (1/2)'; resT.style.color = '#bdc3c7'; }
            else { resT.innerText = '💀 DERROTA (0/2)'; resT.style.color = '#e74c3c'; }
        }
    };

    renderJogador(pg.parceiroId, 'oponente');
    renderJogador(pg.meuId, 'jogador');

    if (pg.status === 'resultado') {
        btnNovaMao.classList.remove('escondido');
    }
}

window.resetarMesaPaiGow = async function() {
    window.motorPaiGow.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/paigow_royale`), {
        status: 'apostando', apostaAnte: window.motorPaiGow.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}
    });
};

// ============================================================================
// 🌴 MOTOR REAL-TIME: CARIBBEAN POKER (AVALIADOR DE MÃOS E SINCRONIA DUPLA)
// ============================================================================

window.motorCarib = {
    meuId: '', parceiroId: '', status: 'apostando', apostaAnte: 50,
    baralho: [], dealer: { mao: [] }, vitoriaComemorada: false, quemFinalizou: '',
    prontos: { joao: false, thamiris: false },
    jogadores: { joao: { mao: [], acao: '' }, thamiris: { mao: [], acao: '' } }
};

window.fecharMesaCarib = function() {
    const mesa = document.getElementById('mesa-carib');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarBaralhoCarib() {
    const naipes = ['♥️', '♦️', '♣️', '♠️'];
    const valores = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let baralho = [];
    for(let n of naipes) {
        for(let v of valores) {
            baralho.push({ naipe: n, valor: v, cor: (n==='♥️'||n==='♦️') ? 'poker-red' : 'poker-black' });
        }
    }
    return baralho.sort(() => Math.random() - 0.5);
}

function criarDivCartaCarib(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s; width: 55px; height: 80px; font-size: 0.9em;">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro" style="font-size: 1.8rem;">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

// 🧠 A Inteligência Artificial de Avaliação do Poker (Robusta)
function avaliarMaoCarib(mao) {
    if (!mao || mao.length !== 5) return { rank: 0, str: "Erro", score: 0, mult: 1, qualifica: false };
    
    const valMap = {'2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14};
    let nums = mao.map(c => valMap[c.valor]).sort((a,b) => b - a);
    let naipes = mao.map(c => c.naipe);
    
    let isFlush = naipes.every(n => n === naipes[0]);
    let isStraight = false;
    
    if (nums[0] === 14 && nums[1] === 5 && nums[2] === 4 && nums[3] === 3 && nums[4] === 2) {
        isStraight = true; nums = [5,4,3,2,1]; 
    } else {
        isStraight = nums.every((v, i) => i === 0 || v === nums[i-1] - 1);
    }

    let counts = {};
    nums.forEach(v => counts[v] = (counts[v] || 0) + 1);
    let freqs = Object.entries(counts).map(e => ({v: parseInt(e[0]), c: e[1]})).sort((a,b) => b.c - a.c || b.v - a.v);
    
    let rank = 1, str = "Carta Alta", mult = 1;
    if (isStraight && isFlush && nums[0] === 14) { rank = 10; str = "Royal Flush"; mult = 100; }
    else if (isStraight && isFlush) { rank = 9; str = "Straight Flush"; mult = 50; }
    else if (freqs[0].c === 4) { rank = 8; str = "Quadra"; mult = 20; }
    else if (freqs[0].c === 3 && freqs[1].c === 2) { rank = 7; str = "Full House"; mult = 7; }
    else if (isFlush) { rank = 6; str = "Flush"; mult = 5; }
    else if (isStraight) { rank = 5; str = "Sequência"; mult = 4; }
    else if (freqs[0].c === 3) { rank = 4; str = "Trinca"; mult = 3; }
    else if (freqs[0].c === 2 && freqs[1].c === 2) { rank = 3; str = "Dois Pares"; mult = 2; }
    else if (freqs[0].c === 2) { rank = 2; str = "Par"; mult = 1; }

    // Calcula um score preciso para desempate
    let score = rank * 1000000 + freqs[0].v * 10000;
    if (freqs.length > 1) score += freqs[1].v * 100;
    if (freqs.length > 2) score += freqs[2].v;

    // Regra Global do Casino: Qualifica se tiver Par+ ou A-K
    let qualifica = rank > 1 || (nums.includes(14) && nums.includes(13));

    return { rank, str, mult, score, qualifica };
}

window.iniciarOuvinteCarib = function() {
    window.motorCarib.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorCarib.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/caribbean_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorCarib.status = data.status || 'apostando';
            window.motorCarib.quemFinalizou = data.quemFinalizou || '';
            window.motorCarib.apostaAnte = Number(data.apostaAnte) || 50;
            window.motorCarib.prontos = data.prontos || { joao: false, thamiris: false };
            
            window.motorCarib.baralho = JSON.parse(data.baralho || "[]");
            window.motorCarib.dealer = { mao: JSON.parse(data.dealer?.mao || "[]") };

            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            window.motorCarib.jogadores = {
                joao: { acao: jInfo.acao || '', mao: JSON.parse(jInfo.mao || "[]") },
                thamiris: { acao: tInfo.acao || '', mao: JSON.parse(tInfo.mao || "[]") }
            };

            renderMesaCarib();

            if (window.motorCarib.status === 'resultado' && !window.motorCarib.vitoriaComemorada) {
                window.motorCarib.vitoriaComemorada = true;
                processarFimCarib();
            }
        } catch (e) {
            console.error("Erro na leitura do Caribbean:", e);
        }
    });

    const visor = document.getElementById('carib-valor-aposta');
    if (visor) visor.innerText = window.motorCarib.apostaAnte;
};

window.ajustarApostaCarib = function(delta) {
    if (window.motorCarib.status !== 'apostando') return;
    if (window.motorCarib.prontos[window.motorCarib.meuId]) return;
    
    let atual = Number(window.motorCarib.apostaAnte) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    // O custo potencial total (Ante + Call) por jogador é 3x a aposta escolhida. 
    // Como são 2 jogadores, custo máximo potencial = 6x a aposta. Protegemos o cofre:
    const maxAposta = Math.floor(saldo / 6); 
    if (novoValor > maxAposta) novoValor = maxAposta;
    if (novoValor < 10) novoValor = 10;
    
    window.motorCarib.apostaAnte = novoValor;
    const visor = document.getElementById('carib-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

// 🚨 FASE 1: PAGAR ANTE (Sincronia Dupla)
window.iniciarRodadaCarib = async function() {
    if (window.motorCarib.status !== 'apostando') return;
    if (window.motorCarib.prontos[window.motorCarib.meuId]) return;

    let ante = Number(window.motorCarib.apostaAnte);
    if (isNaN(ante) || ante <= 0) return;

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const caribRef = ref(db, `cassino/caribbean_royale`);

    const snap = await get(caribRef);
    let prontos = (snap.val() || {}).prontos || { joao: false, thamiris: false };
    prontos[window.motorCarib.meuId] = true;

    if (prontos[window.motorCarib.parceiroId] === true) {
        // Ambos prontos: Cobra 2x Ante (uma de cada) e dá as cartas
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-(ante * 2), `Caribbean Poker (Ante Co-op)`);
        }

        let baralho = gerarBaralhoCarib(); 
        let mDealer = [baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop()];
        let mJoao = [baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop()];
        let mThamiris = [baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop(), baralho.pop()];

        await update(caribRef, {
            status: 'jogando',
            apostaAnte: ante,
            baralho: JSON.stringify(baralho),
            dealer: { mao: JSON.stringify(mDealer) },
            jogadores: {
                joao: { mao: JSON.stringify(mJoao), acao: '' },
                thamiris: { mao: JSON.stringify(mThamiris), acao: '' }
            },
            prontos: { joao: false, thamiris: false } // Reseta para a fase 2 (Call/Fold)
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } else {
        await update(caribRef, { prontos: prontos, apostaAnte: ante });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando Parceiro pagar Ante...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

// 🚨 FASE 2: CALL OU FOLD (Sincronia Dupla)
window.acaoCarib = async function(escolha) {
    if (window.motorCarib.status !== 'jogando') return;
    if (window.motorCarib.prontos[window.motorCarib.meuId]) return;

    const ante = Number(window.motorCarib.apostaAnte);
    const custoCall = ante * 2;

    if (escolha === 'call') {
        const saldo = Number(window.pontosDoCasal);
        if (saldo < custoCall) {
            if(typeof mostrarToast === 'function') mostrarToast("Fichas insuficientes para o Call!", "💸");
            return;
        }
        // Cobra o Call imediatamente na sua jogada
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(-custoCall, `Caribbean Poker (Call - ${window.motorCarib.meuId})`);
        }
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    } else {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.8);
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const caribRef = ref(db, `cassino/caribbean_royale`);

    const snap = await get(caribRef);
    let dataAtual = snap.val() || {};
    let prontos = dataAtual.prontos || { joao: false, thamiris: false };
    
    prontos[window.motorCarib.meuId] = true;

    let up = { prontos: prontos };
    up[`jogadores/${window.motorCarib.meuId}/acao`] = escolha;

    if (prontos[window.motorCarib.parceiroId] === true) {
        // Os dois decidiram. Vai para o Showdown!
        up.status = 'resultado';
        up.quemFinalizou = window.motorCarib.meuId; // Quem clicou por último resolve a matemática
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Decisão travada. Aguardando a Equipe...", "🔒");
    }

    await update(caribRef, up);
};

// 🚨 FASE 3: SHOWDOWN DA INTELIGÊNCIA ARTIFICIAL
async function processarFimCarib() {
    if (window.motorCarib.quemFinalizou !== window.motorCarib.meuId) {
        renderMesaCarib(); 
        return; 
    }

    const mDealer = window.motorCarib.dealer.mao;
    const avalDealer = avaliarMaoCarib(mDealer);
    const ante = Number(window.motorCarib.apostaAnte);
    const apostaCall = ante * 2;
    
    let ganhoTotal = 0;

    const resolverJogador = (jInfo) => {
        if (jInfo.acao === 'fold') return 0; // Perdeu a Ante. Call não foi pago. Recupera zero.
        
        let avalJ = avaliarMaoCarib(jInfo.mao);
        
        if (!avalDealer.qualifica) {
            // Dealer não qualificou. Ante paga 1:1. Call Empata (Push).
            // Retorno = (Ante original + Prêmio da Ante) + Call devolvido = (2x Ante) + Call
            return (ante * 2) + apostaCall; 
        } else {
            // Dealer qualificou. Briga de Mãos!
            if (avalJ.score > avalDealer.score) {
                // Vitória! Ante paga 1:1. Call paga o multiplicador.
                return (ante * 2) + apostaCall + (apostaCall * avalJ.mult);
            } else if (avalJ.score === avalDealer.score) {
                // Empate absoluto. Push em tudo.
                return ante + apostaCall;
            } else {
                // Derrota. A casa leva tudo.
                return 0;
            }
        }
    };

    const jJoao = window.motorCarib.jogadores.joao;
    const jThamiris = window.motorCarib.jogadores.thamiris;
    
    ganhoTotal += resolverJogador(jJoao);
    ganhoTotal += resolverJogador(jThamiris);

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Caribbean Poker`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#1abc9c', '#D4AF37'], particleCount: 300});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A EQUIPE LEVOU +${ganhoTotal} 💰!`, "🎰");
        }, 1500);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Banca engoliu as apostas... 💀`, "💸");
        }, 1500);
    }
}

function renderMesaCarib() {
    const cb = window.motorCarib;
    const painelAnte = document.getElementById('carib-painel-aposta');
    const painelAcao = document.getElementById('carib-painel-acao');
    const btnNovaMao = document.getElementById('btn-carib-novamao');
    const btnInic = document.getElementById('btn-iniciar-carib');
    const btnFold = document.getElementById('btn-carib-fold');
    const btnCall = document.getElementById('btn-carib-call');

    if (!painelAnte) return;

    if (cb.status === 'apostando') {
        painelAnte.style.display = 'flex';
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.add('escondido');
        
        document.getElementById('carib-mao-dealer').innerHTML = '';
        document.getElementById('carib-mao-oponente').innerHTML = '';
        document.getElementById('carib-mao-jogador').innerHTML = '';
        document.getElementById('carib-resultado-jogador').innerText = '';
        document.getElementById('carib-resultado-oponente').innerText = '';
        document.getElementById('carib-info-dealer').innerText = '';

        if (cb.prontos[cb.meuId]) {
            btnInic.innerText = "AGUARDANDO... ⏳";
            btnInic.style.background = "#555";
        } else {
            btnInic.innerText = "PAGAR ANTE ♠️";
            btnInic.style.background = "linear-gradient(145deg, #1abc9c, #16a085)";
        }
        return; 
    }

    painelAnte.style.display = 'none';

    // RENDERIZA DEALER
    const divDealer = document.getElementById('carib-mao-dealer');
    divDealer.innerHTML = '';
    cb.dealer.mao.forEach((c, idx) => {
        if (idx > 0 && cb.status === 'jogando') {
            // Esconde 4 cartas do Dealer durante o jogo
            divDealer.innerHTML += `<div class="poker-card-back animacao-distribuir" style="width: 55px; height: 80px;"></div>`;
        } else {
            divDealer.innerHTML += criarDivCartaCarib(c, idx * 0.1);
        }
    });

    if (cb.status === 'resultado') {
        let avalD = avaliarMaoCarib(cb.dealer.mao);
        document.getElementById('carib-info-dealer').innerText = avalD.qualifica ? `QUALIFICOU: ${avalD.str}` : `NÃO QUALIFICOU (${avalD.str})`;
        document.getElementById('carib-info-dealer').style.color = avalD.qualifica ? '#e74c3c' : '#bdc3c7';
    }

    // RENDERIZA JOGADORES
    const renderJogador = (idJog, divMao, divRes) => {
        const j = cb.jogadores[idJog];
        const maoH = document.getElementById(divMao);
        if (!maoH || !j) return;
        
        maoH.innerHTML = '';
        j.mao.forEach((c, i) => maoH.innerHTML += criarDivCartaCarib(c, i * 0.1));
        
        let avalJ = avaliarMaoCarib(j.mao);
        let resT = document.getElementById(divRes);
        
        if (j.acao === 'fold') {
            resT.innerText = 'FUGIU (FOLD)';
            resT.style.color = '#e74c3c';
            maoH.style.opacity = '0.5';
        } else if (cb.status === 'resultado') {
            maoH.style.opacity = '1';
            let avalD = avaliarMaoCarib(cb.dealer.mao);
            if (!avalD.qualifica) {
                resT.innerText = `WIN: ${avalJ.str} (+Ante)`;
                resT.style.color = '#2ecc71';
            } else {
                if (avalJ.score > avalD.score) { resT.innerText = `WIN: ${avalJ.str}`; resT.style.color = '#f1c40f'; }
                else if (avalJ.score < avalD.score) { resT.innerText = `LOSE: ${avalJ.str}`; resT.style.color = '#e74c3c'; }
                else { resT.innerText = `PUSH (Empate)`; resT.style.color = '#bdc3c7'; }
            }
        } else if (j.acao === 'call') {
            resT.innerText = `APOSTOU: ${avalJ.str}`;
            resT.style.color = '#f1c40f';
        } else {
            resT.innerText = `Sua vez! Você tem um(a) ${avalJ.str}`;
            resT.style.color = '#1abc9c';
        }
    };

    renderJogador(cb.parceiroId, 'carib-mao-oponente', 'carib-resultado-oponente');
    renderJogador(cb.meuId, 'carib-mao-jogador', 'carib-resultado-jogador');

    // UI DE AÇÃO E BOTÕES
    if (cb.status === 'jogando') {
        painelAcao.classList.remove('escondido');
        if (cb.prontos[cb.meuId]) {
            btnFold.innerText = "AGUARDANDO... ⏳"; btnFold.style.background = "#555";
            btnCall.innerText = "AGUARDANDO... ⏳"; btnCall.style.background = "#555";
        } else {
            btnFold.innerText = "FUGIR (FOLD)"; btnFold.style.background = "linear-gradient(145deg, #e74c3c, #c0392b)";
            btnCall.innerText = `APOSTAR (${cb.apostaAnte * 2}💰)`; btnCall.style.background = "linear-gradient(145deg, #f1c40f, #f39c12)";
        }
    } else if (cb.status === 'resultado') {
        painelAcao.classList.add('escondido');
        btnNovaMao.classList.remove('escondido');
    }
}

window.resetarMesaCarib = async function() {
    window.motorCarib.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/caribbean_royale`), {
        status: 'apostando', apostaAnte: window.motorCarib.apostaAnte, quemFinalizou: '', prontos: {joao: false, thamiris: false}
    });
};

// ============================================================================
// 👑 MOTOR REAL-TIME: BACCARAT ROYALE (SISTEMA DE SINCRONIA E ANTI-NAN)
// ============================================================================

window.motorBac = {
    meuId: '', parceiroId: '',
    status: 'apostando', // 'apostando', 'rolando', 'resultado'
    apostas: {},
    maoJogador: [],
    maoBanca: [],
    roladoPor: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } 
};

window.fecharMesaBaccarat = function() {
    const mesa = document.getElementById('mesa-baccarat');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarBaralhoBac() {
    const naipes = ['♥️', '♦️', '♣️', '♠️'];
    const valores = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let baralho = [];
    for(let i=0; i<4; i++) { // Baccarat usa múltiplos baralhos, simulando 4 para evitar fim
        for(let n of naipes) {
            for(let v of valores) {
                baralho.push({ naipe: n, valor: v, cor: (n==='♥️'||n==='♦️') ? 'poker-red' : 'poker-black' });
            }
        }
    }
    return baralho.sort(() => Math.random() - 0.5);
}

function criarDivCartaBac(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

// O cálculo de Baccarat retorna sempre um dígito (0-9)
function calcularPontosBac(mao) {
    if (!mao || !Array.isArray(mao)) return 0;
    let soma = 0;
    mao.forEach(c => {
        if (['10', 'J', 'Q', 'K'].includes(c.valor)) { soma += 0; }
        else if (c.valor === 'A') { soma += 1; }
        else { soma += parseInt(c.valor) || 0; }
    });
    return soma % 10;
}

window.iniciarOuvinteBaccarat = function() {
    window.motorBac.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorBac.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/baccarat_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            window.motorBac.status = data.status || 'apostando';
            window.motorBac.apostas = data.apostas || {};
            window.motorBac.roladoPor = data.roladoPor || '';
            window.motorBac.prontos = data.prontos || { joao: false, thamiris: false };
            
            window.motorBac.maoJogador = JSON.parse(data.maoJogador || "[]");
            window.motorBac.maoBanca = JSON.parse(data.maoBanca || "[]");

            renderMesaBaccarat();

            if (window.motorBac.status === 'rolando') {
                animarCartasBaccarat();
            }
        } catch (e) {
            console.error("Erro no ouvinte de Baccarat:", e);
        }
    });

    const visor = document.getElementById('bac-ficha-valor');
    if (visor) visor.innerText = window.motorBac.valorFicha;
};

window.ajustarFichaBaccarat = function(delta) {
    if (window.motorBac.status !== 'apostando') return;
    if (window.motorBac.prontos[window.motorBac.meuId]) return;
    
    let atual = Number(window.motorBac.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorBac.valorFicha = novoValor;
    const visor = document.getElementById('bac-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarBaccarat = async function(tipo) {
    if (window.motorBac.status !== 'apostando') return;
    
    if (window.motorBac.prontos[window.motorBac.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde a distribuição!", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorBac.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta Baccarat: ${tipo.toUpperCase()}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/baccarat_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorBac.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasBaccarat = async function() {
    if (window.motorBac.status !== 'apostando') return;
    if (window.motorBac.prontos[window.motorBac.meuId]) return;

    let totalDevolvido = 0;
    Object.values(window.motorBac.apostas).forEach(ap => {
        if (ap.autor === window.motorBac.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Baccarat");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/baccarat_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaBaccarat() {
    const statusTxt = document.getElementById('bac-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorBac.status === 'rolando' ? "CARTAS NA MESA..." : "FAÇAM SUAS APOSTAS";
        statusTxt.style.color = window.motorBac.status === 'rolando' ? "#D4AF37" : "#D4AF37";
    }

    document.querySelectorAll('#bac-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorBac.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-bac-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    const btnLancar = document.getElementById('btn-lancar-bac');
    if (btnLancar) {
        if (window.motorBac.prontos[window.motorBac.meuId]) {
            btnLancar.innerText = "ESPERANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "DISTRIBUIR 🃏";
            btnLancar.style.background = "linear-gradient(145deg, #D4AF37, #b38b22)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(212, 175, 55, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#000";
        }
    }
}

// 🚨 O SORTEIO DA INTELIGÊNCIA ARTIFICIAL
window.distribuirBaccarat = async function() {
    if (window.motorBac.status !== 'apostando') return;
    if (window.motorBac.prontos[window.motorBac.meuId]) return;

    if (Object.keys(window.motorBac.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("A mesa precisa de fichas!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const bacRef = ref(db, `cassino/baccarat_royale`);

    const snap = await get(bacRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    prontos[window.motorBac.meuId] = true;

    if (prontos[window.motorBac.parceiroId] === true) {
        // O Crupiê tira as cartas
        let baralho = gerarBaralhoBac();
        let maoJ = [baralho.pop(), baralho.pop()];
        let maoB = [baralho.pop(), baralho.pop()];

        // Regra Simplificada de 3ª Carta do Baccarat
        let ptsJ = calcularPontosBac(maoJ);
        let ptsB = calcularPontosBac(maoB);
        
        // Se nenhum tem um "Natural" (8 ou 9), tiram mais cartas
        if (ptsJ < 8 && ptsB < 8) {
            if (ptsJ <= 5) maoJ.push(baralho.pop());
            // Para simplificar a regra brutal da banca, ela compra se <= 5 
            if (ptsB <= 5) maoB.push(baralho.pop()); 
        }

        await update(bacRef, {
            status: 'rolando',
            maoJogador: JSON.stringify(maoJ),
            maoBanca: JSON.stringify(maoB),
            roladoPor: window.motorBac.meuId,
            prontos: { joao: false, thamiris: false } 
        });
    } else {
        await update(bacRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando confirmação...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarCartasBaccarat() {
    const divJ = document.getElementById('bac-mao-jogador');
    const divB = document.getElementById('bac-mao-banca');
    const ptsJ = document.getElementById('bac-pontuacao-jogador');
    const ptsB = document.getElementById('bac-pontuacao-banca');
    
    if (!divJ || !divB) return;

    divJ.innerHTML = '';
    divB.innerHTML = '';
    ptsJ.innerText = '0';
    ptsB.innerText = '0';

    const arrJ = window.motorBac.maoJogador;
    const arrB = window.motorBac.maoBanca;

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);

    // Revela com delay dramático
    setTimeout(() => {
        arrJ.forEach((c, i) => divJ.innerHTML += criarDivCartaBac(c, i*0.2));
        ptsJ.innerText = calcularPontosBac(arrJ);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
    }, 500);

    setTimeout(() => {
        arrB.forEach((c, i) => divB.innerHTML += criarDivCartaBac(c, i*0.2));
        ptsB.innerText = calcularPontosBac(arrB);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
        
        // Finaliza o Jogo
        if (window.motorBac.roladoPor === window.motorBac.meuId) {
            processarRecompensaBaccarat();
        }
    }, 1500); 
}

async function processarRecompensaBaccarat() {
    let ganhoTotal = 0;
    
    const ptsJ = calcularPontosBac(window.motorBac.maoJogador);
    const ptsB = calcularPontosBac(window.motorBac.maoBanca);
    
    let vencedor = '';
    if (ptsJ > ptsB) vencedor = 'jogador';
    else if (ptsB > ptsJ) vencedor = 'banca';
    else vencedor = 'empate';
    
    Object.values(window.motorBac.apostas).forEach(ap => {
        let valorAposta = Number(ap.valor);
        
        if (ap.tipo === vencedor) {
            // Vitória
            if (vencedor === 'jogador') ganhoTotal += (valorAposta * 2);
            if (vencedor === 'banca') ganhoTotal += (valorAposta * 2); 
            if (vencedor === 'empate') ganhoTotal += (valorAposta * 8); // Empate paga OITO pra um!
        } else if (vencedor === 'empate' && (ap.tipo === 'jogador' || ap.tipo === 'banca')) {
            // Regra Clássica: Se der empate, as apostas no jogador e na banca são DEVOLVIDAS
            ganhoTotal += valorAposta;
        }
    });

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Baccarat (${vencedor.toUpperCase()})`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`O BANCO PAGOU +${ganhoTotal} 💰!`, "👑");
        }, 800);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Casa levou... 💀`, "💸");
        }, 800);
    }

    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        await set(ref(db, `cassino/baccarat_royale`), { status: 'apostando', apostas: {}, maoJogador: "[]", maoBanca: "[]", roladoPor: '', prontos: {joao: false, thamiris: false} });
        document.getElementById('bac-mao-jogador').innerHTML = '';
        document.getElementById('bac-mao-banca').innerHTML = '';
        document.getElementById('bac-pontuacao-jogador').innerText = '0';
        document.getElementById('bac-pontuacao-banca').innerText = '0';
    }, 4500);
}

// ============================================================================
// 🐉 MOTOR REAL-TIME: SIC BO TRINDADE (CO-OP COM SINCRONIA PERFEITA)
// ============================================================================

window.motorSicBo = {
    meuId: '', parceiroId: '',
    status: 'apostando', // 'apostando', 'rolando', 'resultado'
    apostas: {},
    resultado: [6, 6, 6],
    roladoPor: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } 
};

// Reutilizamos a física e o som dos dados já em cache
const somCargaSicBo = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'); 

window.fecharMesaSicBo = function() {
    const mesa = document.getElementById('mesa-sicbo');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

window.iniciarOuvinteSicBo = function() {
    window.motorSicBo.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorSicBo.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/sicbo_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            window.motorSicBo.status = data.status || 'apostando';
            window.motorSicBo.apostas = data.apostas || {};
            window.motorSicBo.resultado = data.resultado || [6, 6, 6];
            window.motorSicBo.roladoPor = data.roladoPor || '';
            window.motorSicBo.prontos = data.prontos || { joao: false, thamiris: false };

            renderMesaSicBo();

            if (window.motorSicBo.status === 'rolando') {
                animarRolagemSicBo();
            }
        } catch (e) {
            console.error("Erro no ouvinte de Sic Bo:", e);
        }
    });

    const visor = document.getElementById('sicbo-ficha-valor');
    if (visor) visor.innerText = window.motorSicBo.valorFicha;
};

window.ajustarFichaSicBo = function(delta) {
    if (window.motorSicBo.status !== 'apostando') return;
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) return; // Trava de Segurança
    
    let atual = Number(window.motorSicBo.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorSicBo.valorFicha = novoValor;
    const visor = document.getElementById('sicbo-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarSicBo = async function(tipo) {
    if (window.motorSicBo.status !== 'apostando') return;
    
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Aguarde a Trindade agir!", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorSicBo.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta SicBo: ${tipo}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/sicbo_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorSicBo.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasSicBo = async function() {
    if (window.motorSicBo.status !== 'apostando') return;
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Fichas seladas na cúpula!", "🔒");
        return;
    }

    let totalDevolvido = 0;
    Object.values(window.motorSicBo.apostas).forEach(ap => {
        if (ap.autor === window.motorSicBo.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Sic Bo");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/sicbo_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaSicBo() {
    const statusTxt = document.getElementById('sicbo-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorSicBo.status === 'rolando' ? "A CÚPULA TREME..." : "A TRINDADE AGUARDA";
        statusTxt.style.color = window.motorSicBo.status === 'rolando' ? "#e74c3c" : "#f1c40f";
    }

    document.querySelectorAll('#sicbo-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorSicBo.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    const btnLancar = document.getElementById('btn-lancar-sicbo');
    if (btnLancar) {
        if (window.motorSicBo.prontos[window.motorSicBo.meuId]) {
            btnLancar.innerText = "ESPERANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "AGITAR CÚPULA 🥢";
            btnLancar.style.background = "linear-gradient(145deg, #f1c40f, #e67e22)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(241, 196, 15, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#000";
        }
    }
}

// 🚨 SINCRONIA CO-OP: Exatamente como no Craps, blindado.
window.lancarDadosSicBo = async function() {
    if (window.motorSicBo.status !== 'apostando') return;
    if (window.motorSicBo.prontos[window.motorSicBo.meuId]) return;

    if (Object.keys(window.motorSicBo.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Honrem os deuses com fichas!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const sicboRef = ref(db, `cassino/sicbo_royale`);

    const snap = await get(sicboRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    prontos[window.motorSicBo.meuId] = true;

    if (prontos[window.motorSicBo.parceiroId] === true) {
        // Gera 3 dados de 1 a 6
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;
        const d3 = Math.floor(Math.random() * 6) + 1;

        await update(sicboRef, {
            status: 'rolando',
            resultado: [d1, d2, d3],
            roladoPor: window.motorSicBo.meuId,
            prontos: { joao: false, thamiris: false } 
        });
    } else {
        await update(sicboRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando a confirmação do outro lado...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarRolagemSicBo() {
    // Reutiliza a matriz facesDado do Craps, se estiver declarada
    const arrayFaces = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    
    const d1El = document.getElementById('sicbo-dado1');
    const d2El = document.getElementById('sicbo-dado2');
    const d3El = document.getElementById('sicbo-dado3');
    const resVisor = document.getElementById('sicbo-resultado-texto');
    
    if (!d1El || !d2El || !d3El) return;

    resVisor.classList.add('escondido');
    d1El.classList.add('rolando-dado');
    d2El.classList.add('rolando-dado');
    d3El.classList.add('rolando-dado');
    
    if(!window.SantuarioSomPausado) {
        somCargaSicBo.currentTime = 0;
        somCargaSicBo.play().catch(()=>{});
    }

    let interval = setInterval(() => {
        d1El.innerText = arrayFaces[Math.floor(Math.random() * 6) + 1];
        d2El.innerText = arrayFaces[Math.floor(Math.random() * 6) + 1];
        d3El.innerText = arrayFaces[Math.floor(Math.random() * 6) + 1];
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        d1El.classList.remove('rolando-dado');
        d2El.classList.remove('rolando-dado');
        d3El.classList.remove('rolando-dado');
        somCargaSicBo.pause();
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200]);
                    }

        const resArray = window.motorSicBo.resultado;
        d1El.innerText = arrayFaces[resArray[0]];
        d2El.innerText = arrayFaces[resArray[1]];
        d3El.innerText = arrayFaces[resArray[2]];
        
        const soma = resArray[0] + resArray[1] + resArray[2];
        resVisor.innerText = soma;
        resVisor.classList.remove('escondido');

        if (window.motorSicBo.roladoPor === window.motorSicBo.meuId) {
            processarRecompensaSicBo();
        }
    }, 2800); // Dá um tempinho extra de tensão por serem 3 dados
}

async function processarRecompensaSicBo() {
    let ganhoTotal = 0;
    const res = window.motorSicBo.resultado;
    const soma = res[0] + res[1] + res[2];
    
    // Regras Core do Sic Bo
    const ehTriplo = (res[0] === res[1] && res[1] === res[2]);
    const ehDuplo = (res[0] === res[1] || res[1] === res[2] || res[0] === res[2]);
    
    Object.values(window.motorSicBo.apostas).forEach(ap => {
        let acertou = false;
        let mult = 0;

        // Small/Big pagam 1:1 (dobram o valor). MAS perdem se der Triplo!
        if (ap.tipo === 'pequeno' && soma >= 4 && soma <= 10 && !ehTriplo) { acertou = true; mult = 2; }
        if (ap.tipo === 'grande' && soma >= 11 && soma <= 17 && !ehTriplo) { acertou = true; mult = 2; }
        
        // Duplos e Triplos Jackpot
        if (ap.tipo === 'duplo' && ehDuplo) { acertou = true; mult = 10; }
        if (ap.tipo === 'triplo' && ehTriplo) { acertou = true; mult = 30; }
        
        // Zona Mística
        if (ap.tipo === 'soma_mistica' && (soma === 10 || soma === 11)) { acertou = true; mult = 6; }

        if (acertou) ganhoTotal += (Number(ap.valor) * mult);
    });

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Sic Bo (${soma})`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#f1c40f', '#e74c3c'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`OS DEUSES PAGARAM +${ganhoTotal} 💰!`, "🐉");
        }, 500);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A cúpula levou as fichas... 💀`, "💸");
        }, 500);
    }

    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        await set(ref(db, `cassino/sicbo_royale`), { status: 'apostando', apostas: {}, resultado: [6,6,6], roladoPor: '', prontos: {joao: false, thamiris: false} });
        document.getElementById('sicbo-resultado-texto').classList.add('escondido');
    }, 4000);
}

// ============================================================================
// ♠️ MOTOR REAL-TIME: BLACKJACK TEAM (TOTALMENTE ISOLADO)
// ============================================================================

window.motorBjCoop = {
    meuId: '', parceiroId: '', status: 'apostando', turno: '', apostaAtual: 50,
    baralho: [], dealer: { mao: [] }, vitoriaComemorada: false, quemFinalizou: '',
    jogadores: { joao: { mao: [], status: 'jogando' }, thamiris: { mao: [], status: 'jogando' } }
};

window.fecharMesaBjCoop = function() {
    const mesa = document.getElementById('mesa-bj-coop');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

function gerarBaralhoBjCoop() {
    const naipes = ['♥️', '♦️', '♣️', '♠️'];
    const valores = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let baralho = [];
    for(let n of naipes) {
        for(let v of valores) {
            baralho.push({ naipe: n, valor: v, cor: (n==='♥️'||n==='♦️') ? 'poker-red' : 'poker-black' });
        }
    }
    return baralho.sort(() => Math.random() - 0.5);
}

function criarDivCartaBjCoop(carta, delay) {
    if (!carta) return '';
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

function calcularPontosBjCoop(mao) {
    if (!mao || !Array.isArray(mao)) return 0;
    let soma = 0; let ases = 0;
    mao.forEach(c => {
        if (c && c.valor === 'A') { soma += 11; ases += 1; }
        else if (c && ['J', 'Q', 'K'].includes(c.valor)) { soma += 10; }
        else if (c && c.valor) { soma += parseInt(c.valor) || 0; }
    });
    while (soma > 21 && ases > 0) { soma -= 10; ases -= 1; }
    return soma;
}

window.iniciarOuvinteBlackjack = function() {
    window.motorBjCoop.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorBjCoop.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/blackjack_team`), (snapshot) => {
        try {
            const data = snapshot.val() || {};

            window.motorBjCoop.status = data.status || 'apostando';
            window.motorBjCoop.turno = data.turno || '';
            window.motorBjCoop.quemFinalizou = data.quemFinalizou || '';
            window.motorBjCoop.apostaAtual = Number(data.apostaAtual) || 50;
            
            window.motorBjCoop.baralho = JSON.parse(data.baralho || "[]");
            window.motorBjCoop.dealer = { mao: JSON.parse(data.dealer?.mao || "[]") };

            let jInfo = data.jogadores?.joao || {};
            let tInfo = data.jogadores?.thamiris || {};

            window.motorBjCoop.jogadores = {
                joao: { status: jInfo.status || 'jogando', mao: JSON.parse(jInfo.mao || "[]") },
                thamiris: { status: tInfo.status || 'jogando', mao: JSON.parse(tInfo.mao || "[]") }
            };

            renderMesaBjCoop();

            if (window.motorBjCoop.status === 'resultado' && !window.motorBjCoop.vitoriaComemorada) {
                window.motorBjCoop.vitoriaComemorada = true;
                processarFimBjCoop();
            }
        } catch (e) {
            console.error("Erro na leitura do Blackjack Co-op:", e);
        }
    });

    const visor = document.getElementById('bj-coop-valor-aposta');
    if (visor) visor.innerText = window.motorBjCoop.apostaAtual;
};

window.ajustarApostaBjCoop = function(delta) {
    if (window.motorBjCoop.status !== 'apostando') return;
    
    let atual = Number(window.motorBjCoop.apostaAtual) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    const maxApostaCasal = Math.floor(saldo / 2); 
    if (novoValor > maxApostaCasal) novoValor = maxApostaCasal;
    if (novoValor < 10) novoValor = 10;
    
    window.motorBjCoop.apostaAtual = novoValor;
    const visor = document.getElementById('bj-coop-valor-aposta');
    if (visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.iniciarRodadaBjCoop = async function() {
    if (window.motorBjCoop.status !== 'apostando') return;

    let apostaBase = Number(window.motorBjCoop.apostaAtual);
    if (isNaN(apostaBase) || apostaBase <= 0) return;

    let custoTotal = apostaBase * 2;
    const saldo = Number(window.pontosDoCasal) || 0;
    
    if (saldo < custoTotal) {
        if(typeof mostrarToast === 'function') mostrarToast("Saldo insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-custoTotal, `Aposta: Blackjack Team`);
    }

    if(typeof mostrarToast === 'function') mostrarToast("Distribuindo...", "🃏");

    try {
        let baralho = gerarBaralhoBjCoop(); 
        
        let maoDealer = [baralho.pop(), baralho.pop()];
        let maoJoao = [baralho.pop(), baralho.pop()];
        let maoThamiris = [baralho.pop(), baralho.pop()];

        let stJoao = calcularPontosBjCoop(maoJoao) === 21 ? 'blackjack' : 'jogando';
        let stThamiris = calcularPontosBjCoop(maoThamiris) === 21 ? 'blackjack' : 'jogando';

        let meuId = window.motorBjCoop.meuId;
        let parceiroId = window.motorBjCoop.parceiroId;
        let stEu = meuId === 'joao' ? stJoao : stThamiris;
        let stParceiro = parceiroId === 'joao' ? stJoao : stThamiris;

        let primTurno = meuId;
        if (stEu !== 'jogando') primTurno = parceiroId;
        
        let quemFim = '';
        if (stEu !== 'jogando' && stParceiro !== 'jogando') {
            primTurno = 'dealer';
            quemFim = meuId; 
        }

        const { db, ref, update } = window.SantuarioApp.modulos;
        await update(ref(db, `cassino/blackjack_team`), {
            status: primTurno === 'dealer' ? 'resultado' : 'jogando',
            turno: primTurno,
            quemFinalizou: quemFim,
            apostaAtual: apostaBase,
            baralho: JSON.stringify(baralho),
            dealer: { mao: JSON.stringify(maoDealer) },
            jogadores: {
                joao: { mao: JSON.stringify(maoJoao), status: stJoao },
                thamiris: { mao: JSON.stringify(maoThamiris), status: stThamiris }
            }
        });

        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    } catch (e) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(custoTotal, `Estorno BJ Team`);
    }
};

window.acaoBjCoop = async function(acao) {
    if (window.motorBjCoop.turno !== window.motorBjCoop.meuId) return;

    const { db, ref, update } = window.SantuarioApp.modulos;
    let up = {};
    
    let minhaMao = [...(window.motorBjCoop.jogadores[window.motorBjCoop.meuId].mao || [])];
    let baralho = [...(window.motorBjCoop.baralho || [])];
    let meuStatus = window.motorBjCoop.jogadores[window.motorBjCoop.meuId].status;
    let proxTurno = window.motorBjCoop.parceiroId;

    if (acao === 'comprar' && baralho.length > 0) {
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.8);
        minhaMao.push(baralho.pop());
        
        let pts = calcularPontosBjCoop(minhaMao);
        if (pts > 21) {
            meuStatus = 'estourou';
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200]);
                    }
        } else if (pts === 21) {
            meuStatus = 'parou';
        } else {
            proxTurno = window.motorBjCoop.meuId; 
        }
    } else if (acao === 'parar') {
        meuStatus = 'parou';
    }

    if (proxTurno === window.motorBjCoop.parceiroId) {
        let statusParceiro = window.motorBjCoop.jogadores[window.motorBjCoop.parceiroId]?.status;
        if (statusParceiro !== 'jogando') {
            proxTurno = 'dealer'; 
        }
    }

    up[`cassino/blackjack_team/jogadores/${window.motorBjCoop.meuId}/mao`] = JSON.stringify(minhaMao);
    up[`cassino/blackjack_team/jogadores/${window.motorBjCoop.meuId}/status`] = meuStatus;
    up[`cassino/blackjack_team/baralho`] = JSON.stringify(baralho);
    up[`cassino/blackjack_team/turno`] = proxTurno;
    
    if (proxTurno === 'dealer') {
        up[`cassino/blackjack_team/status`] = 'resultado';
        up[`cassino/blackjack_team/quemFinalizou`] = window.motorBjCoop.meuId; 
    }

    await update(ref(db), up);
};

async function processarFimBjCoop() {
    if (window.motorBjCoop.quemFinalizou !== window.motorBjCoop.meuId) {
        renderMesaBjCoop(); 
        return; 
    }

    let baralho = [...(window.motorBjCoop.baralho || [])];
    let maoDealer = [...(window.motorBjCoop.dealer.mao || [])];
    
    let ptsDealer = calcularPontosBjCoop(maoDealer);
    while (ptsDealer < 17 && baralho.length > 0) {
        maoDealer.push(baralho.pop());
        ptsDealer = calcularPontosBjCoop(maoDealer);
    }

    const { db, ref, update } = window.SantuarioApp.modulos;
    
    await update(ref(db, `cassino/blackjack_team`), {
        'dealer/mao': JSON.stringify(maoDealer),
        'baralho': JSON.stringify(baralho)
    });

    let ganhoTotal = 0;
    const aposta = Number(window.motorBjCoop.apostaAtual) || 0;
    const jJoao = window.motorBjCoop.jogadores.joao;
    const jThamiris = window.motorBjCoop.jogadores.thamiris;
    const ptsJoao = calcularPontosBjCoop(jJoao.mao);
    const ptsThamiris = calcularPontosBjCoop(jThamiris.mao);

    if (jJoao.status === 'blackjack' && ptsDealer !== 21) ganhoTotal += (aposta * 2.5); 
    else if (jJoao.status !== 'estourou' && (ptsDealer > 21 || ptsJoao > ptsDealer)) ganhoTotal += (aposta * 2); 
    else if (jJoao.status !== 'estourou' && ptsJoao === ptsDealer) ganhoTotal += aposta; 

    if (jThamiris.status === 'blackjack' && ptsDealer !== 21) ganhoTotal += (aposta * 2.5);
    else if (jThamiris.status !== 'estourou' && (ptsDealer > 21 || ptsThamiris > ptsDealer)) ganhoTotal += (aposta * 2);
    else if (jThamiris.status !== 'estourou' && ptsThamiris === ptsDealer) ganhoTotal += aposta;

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Blackjack Team`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#3498db'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A EQUIPE GANHOU +${ganhoTotal} 💰!`, "🎰");
        }, 1000);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A banca venceu... 💀`, "💸");
        }, 1000);
    }
}

function renderMesaBjCoop() {
    const bj = window.motorBjCoop;
    const painelAposta = document.getElementById('bj-coop-painel-aposta');
    const painelAcao = document.getElementById('bj-coop-painel-acao');
    const avisoTurno = document.getElementById('bj-coop-aviso-turno');
    const btnNovaMao = document.getElementById('btn-bj-coop-novamao');

    if (!painelAposta) return;

    if (bj.status === 'apostando') {
        painelAposta.style.display = 'flex';
        painelAcao.classList.add('escondido');
        avisoTurno.classList.add('escondido');
        btnNovaMao.classList.add('escondido');
        document.getElementById('bj-coop-mao-dealer').innerHTML = '';
        document.getElementById('bj-coop-mao-oponente').innerHTML = '';
        document.getElementById('bj-coop-mao-jogador').innerHTML = '';
        document.getElementById('bj-coop-resultado-jogador').innerText = '';
        document.getElementById('bj-coop-resultado-oponente').innerText = '';
        return; 
    }

    painelAposta.style.display = 'none';

    const maoDealerDiv = document.getElementById('bj-coop-mao-dealer');
    if (maoDealerDiv) {
        maoDealerDiv.innerHTML = '';
        bj.dealer.mao.forEach((c, index) => {
            if (index === 1 && bj.status === 'jogando') {
                maoDealerDiv.innerHTML += `<div class="poker-card-back animacao-distribuir" style="width: 55px; height: 80px;"></div>`;
            } else {
                maoDealerDiv.innerHTML += criarDivCartaBjCoop(c, index * 0.1);
            }
        });
    }

    if (bj.status === 'resultado') {
        document.getElementById('bj-coop-pontuacao-dealer').innerText = calcularPontosBjCoop(bj.dealer.mao);
    } else if (bj.dealer.mao.length > 0) {
        document.getElementById('bj-coop-pontuacao-dealer').innerText = calcularPontosBjCoop([bj.dealer.mao[0]]);
    }

    const renderJogador = (idJogador, divMao, divPts, divRes) => {
        const j = bj.jogadores[idJogador];
        if (!j) return;
        const maoHtml = document.getElementById(divMao);
        if (!maoHtml) return;
        
        maoHtml.innerHTML = '';
        j.mao.forEach((c, i) => maoHtml.innerHTML += criarDivCartaBjCoop(c, i * 0.1));
        
        let pts = calcularPontosBjCoop(j.mao);
        const divPontos = document.getElementById(divPts);
        if(divPontos) divPontos.innerText = pts;

        let resTxt = '';
        if (j.status === 'estourou') resTxt = '💥 BUSTED';
        else if (j.status === 'blackjack') resTxt = '⭐ BLACKJACK!';
        else if (j.status === 'parou') resTxt = '🛑 Parou';
        
        if (bj.status === 'resultado') {
            let ptsDealer = calcularPontosBjCoop(bj.dealer.mao);
            if (j.status === 'estourou') resTxt = '💀 BUSTED';
            else if (ptsDealer > 21 || pts > ptsDealer) resTxt = '🏆 WIN!';
            else if (pts === ptsDealer) resTxt = '🤝 PUSH';
            else resTxt = '💸 LOSE';
        }
        const divResultado = document.getElementById(divRes);
        if (divResultado) divResultado.innerText = resTxt;
    };

    renderJogador(bj.parceiroId, 'bj-coop-mao-oponente', 'bj-coop-pontuacao-oponente', 'bj-coop-resultado-oponente');
    renderJogador(bj.meuId, 'bj-coop-mao-jogador', 'bj-coop-pontuacao-jogador', 'bj-coop-resultado-jogador');

    if (bj.status === 'jogando') {
        if (bj.turno === bj.meuId) {
            painelAcao.classList.remove('escondido');
            avisoTurno.classList.add('escondido');
        } else {
            painelAcao.classList.add('escondido');
            avisoTurno.classList.remove('escondido');
            avisoTurno.innerText = `Aguardando Equipe...`;
        }
    } else if (bj.status === 'resultado') {
        painelAcao.classList.add('escondido');
        avisoTurno.classList.add('escondido');
        btnNovaMao.classList.remove('escondido');
    }
}

window.resetarMesaBjCoop = async function() {
    window.motorBjCoop.vitoriaComemorada = false;
    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/blackjack_team`), {
        status: 'apostando', turno: '', apostaAtual: window.motorBjCoop.apostaAtual, quemFinalizou: ''
    });
};

// ============================================================================
// 🎡 MOTOR REAL-TIME: ROLETA COMPARTILHADA (CO-OP GIGANTE) - BLINDADO
// ============================================================================

// 🚨 HASTEAMENTO GLOBAL EXPLICÍTO: Blindagem total contra ReferenceError no Console
// 🚨 Função de Fechar a Mesa Corrigida (Sem recarregar o app!)
window.fecharMesaRoletaMulti = function() {
    const mesa = document.getElementById('mesa-roleta-multi');
    if(mesa) { 
        mesa.classList.add('escondido'); 
        mesa.style.display = 'none'; 
    }
    
    // Se a roleta estiver tocando som e a pessoa sair, nós pausamos o áudio
    if (typeof somCatracaRoleta !== 'undefined' && !somCatracaRoleta.paused) {
        somCatracaRoleta.pause();
        somCatracaRoleta.currentTime = 0;
    }
};

window.motorRoletaMulti = {
    meuId: '',
    status: 'apostando', // 'apostando', 'girando', 'resultado'
    apostas: {}, 
    resultado: null,
    giradoPor: '',
    valorFicha: 50 // Garantido como número puro
};

// Som mecânico de roleta (Opcional, gera muita dopamina)
const somCatracaRoleta = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

// Variável persistente para acumular as voltas da roleta
window.anguloGlobalRoleta = 0;

window.iniciarOuvinteRoletaMulti = function() {
    window.motorRoletaMulti.meuId = window.souJoao ? 'joao' : 'thamiris';
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/roleta_royale`), (snapshot) => {
        const data = snapshot.val() || { status: 'apostando' };
        
        // Se o status mudou para girando agora, disparar a física
        if (data.status === 'girando' && window.motorRoletaMulti.status !== 'girando') {
            window.motorRoletaMulti.resultado = data.resultado;
            window.motorRoletaMulti.giradoPor = data.giradoPor;
            window.motorRoletaMulti.status = 'girando'; // Sincroniza estado antes de animar
            animarGiroRoletaMulti();
        }

        window.motorRoletaMulti.status = data.status || 'apostando';
        window.motorRoletaMulti.apostas = data.apostas || {};
        window.motorRoletaMulti.resultado = data.resultado || null;
        window.motorRoletaMulti.giradoPor = data.giradoPor || '';

        renderizarMesaRoletaMulti();
    });

    const visor = document.getElementById('roleta-multi-ficha-valor');
    if (visor) visor.innerText = window.motorRoletaMulti.valorFicha;
};

// --- AJUSTE DE FICHA COM TRAVA DE SEGURANÇA E TIPAGEM ---
window.ajustarFichaRoleta = function(delta) {
    if (window.motorRoletaMulti.status !== 'apostando') return;
    
    // Garante que o valor atual seja um número antes de somar
    let atual = Number(window.motorRoletaMulti.valorFicha) || 50;
    let novoValor = atual + delta;
    
    // Regras de limites
    if (novoValor < 10) novoValor = 10;
    
    // Sanitização total do visor contra NaN
    if(isNaN(window.pontosDoCasal)) {
        window.location.reload(); return; // Falha catastrófica de rede/auth
    }
    
    if (novoValor > window.pontosDoCasal) novoValor = window.pontosDoCasal;
    if (novoValor < 10) novoValor = 10; // Teto de segurança pós-salvamento
    
    window.motorRoletaMulti.valorFicha = novoValor;
    
    const visor = document.getElementById('roleta-multi-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

// --- APOSTA CO-OP COM SANITIZAÇÃO TOTAL DO COFRE ---
window.apostarRoletaMulti = async function(tipo) {
    if (window.motorRoletaMulti.status !== 'apostando') {
        if(typeof mostrarToast === 'function') mostrarToast("Roda girando, aguarde!", "⏳");
        return;
    }
    
    // 🛡️ BLINDAGEM FINANCEIRA TOTAL: Impede que NaN chegue ao banco_central
    const valorParaApostar = Number(window.motorRoletaMulti.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) {
        window.motorRoletaMulti.valorFicha = 50; // Auto-reset de visor corrompido
        return;
    }

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6);
        return;
    }

    // Processa o débito na conta conjunta no core.js (NÚMERO LIMPO)
    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Roleta Co-op: ${tipo}`);
    }

    // Salva a ficha física na mesa sincronizada
    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/roleta_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorRoletaMulti.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

// --- LIMPEZA DE MESA COM REEMBOLSO (BLINDADA) ---
window.limparApostasRoleta = async function() {
    if (window.motorRoletaMulti.status !== 'apostando') return;

    let totalDevolvido = 0;
    // Percorre as apostas garantindo tipagem Numérica
    Object.values(window.motorRoletaMulti.apostas).forEach(ap => {
        if (ap.autor === window.motorRoletaMulti.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        // Envia apenas números limpos para o core.js
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Roleta");
        }
        if(typeof mostrarToast === 'function') mostrarToast(`+${totalDevolvido} devolvidos.`, "♻️");
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/roleta_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

// --- RENDERIZAÇÃO VISUAL ---
function renderizarMesaRoletaMulti() {
    const statusTxt = document.getElementById('roleta-multi-status-mesa');
    if (!statusTxt) return;

    statusTxt.innerText = window.motorRoletaMulti.status === 'girando' ? "SORTEANDO..." : "FAÇAM SUAS APOSTAS";
    statusTxt.style.color = window.motorRoletaMulti.status === 'girando' ? "#f1c40f" : "#2ecc71";

    // Limpa containers visualmente
    document.querySelectorAll('.container-fichas').forEach(el => el.innerHTML = '');

    const listaApostas = window.motorRoletaMulti.apostas || {};
    Object.values(listaApostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda};">${ap.valor}</div>`;
        }
    });
}

// --- O GIRO (MATEMÁTICA E SORTEIO) ---
window.girarRoletaMulti = async function() {
    if (window.motorRoletaMulti.status !== 'apostando') return;
    if (Object.keys(window.motorRoletaMulti.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Coloquem ao menos uma ficha!", "⚠️");
        return;
    }

    // O Cassino Sorteia
    const num = Math.floor(Math.random() * 37); // 0 a 36
    const cor = num === 0 ? 'verde' : (num % 2 === 0 ? 'preto' : 'vermelho');

    const { db, ref, update } = window.SantuarioApp.modulos;
    
    // Trava a mesa e revela quem girou
    await update(ref(db, `cassino/roleta_royale`), {
        status: 'girando',
        resultado: { numero: num, cor: cor },
        giradoPor: window.motorRoletaMulti.meuId
    });
};

function animarGiroRoletaMulti() {
    const disco = document.getElementById('roleta-multi-disco');
    const resVisor = document.getElementById('roleta-multi-resultado');
    if (!disco || !resVisor || !window.motorRoletaMulti.resultado) return;

    resVisor.classList.add('escondido');
    disco.classList.add('efeito-blur-giro');
    
    if(!window.SantuarioSomPausado) {
        somCatracaRoleta.currentTime = 0;
        somCatracaRoleta.play().catch(()=>{});
    }

    // 🚨 A MÁGICA DA FÍSICA:
    // 1. Adicionamos no mínimo 5 voltas completas (1800deg) ao ângulo atual
    window.anguloGlobalRoleta += 1800; 
    
    // 2. Calculamos a posição exata do número (Cada fatia tem ~9.72 graus)
    // Subtraímos para o disco girar no sentido horário corretamente
    const ajusteNumero = (window.motorRoletaMulti.resultado.numero * 9.72);
    const anguloFinal = window.anguloGlobalRoleta + (360 - ajusteNumero);

    disco.style.transition = 'transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)';
    disco.style.transform = `rotate(${anguloFinal}deg)`;

    setTimeout(() => {
        disco.classList.remove('efeito-blur-giro');
        somCatracaRoleta.pause();
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        
        document.getElementById('roleta-multi-res-num').innerText = window.motorRoletaMulti.resultado.numero;
        const rCor = document.getElementById('roleta-multi-res-cor');
        rCor.innerText = window.motorRoletaMulti.resultado.cor;
        rCor.style.color = window.motorRoletaMulti.resultado.cor === 'vermelho' ? '#e74c3c' : (window.motorRoletaMulti.resultado.cor === 'preto' ? '#fff' : '#2ecc71');
        
        resVisor.classList.remove('escondido');

        if (window.motorRoletaMulti.giradoPor === window.motorRoletaMulti.meuId) {
            processarRecompensaRoleta();
        }
    }, 4100);
}

async function processarRecompensaRoleta() {
    let ganho = 0;
    const res = window.motorRoletaMulti.resultado;
    
    Object.values(window.motorRoletaMulti.apostas).forEach(ap => {
        let acertou = false;
        let mult = 2;

        if (ap.tipo === 'vermelho' && res.cor === 'vermelho') acertou = true;
        if (ap.tipo === 'preto' && res.cor === 'preto') acertou = true;
        if (ap.tipo === 'par' && res.numero > 0 && res.numero % 2 === 0) acertou = true;
        if (ap.tipo === 'impar' && res.numero > 0 && res.numero % 2 !== 0) acertou = true;
        if (ap.tipo === 'menor' && res.numero >= 1 && res.numero <= 18) acertou = true;
        if (ap.tipo === 'maior' && res.numero >= 19 && res.numero <= 36) acertou = true;
        if (ap.tipo === 'verde' && res.numero === 0) { acertou = true; mult = 14; } // O Jackpot do Zero!

        if (acertou) ganho += (Number(ap.valor) * mult);
    });

    // Paga apenas números limpos pro core.js
    if (ganho > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(ganho, `Vitória Roleta: ${res.numero}`);
        }
        if(typeof mostrarToast === 'function') mostrarToast(`+${ganho} para o cofre conjunto!`, "🎰");
    } else {
        if(typeof mostrarToast === 'function') mostrarToast(`A mesa levou as fichas.`, "💸");
    }

    // Reseta a mesa para a próxima rodada após 3 segundos
    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        await set(ref(db, `cassino/roleta_royale`), { status: 'apostando', apostas: {}, resultado: null, giradoPor: '' });
        document.getElementById('roleta-multi-resultado').classList.add('escondido');
    }, 4000);
}

// ============================================================================
// ♠️ MOTOR REAL-TIME: TEXAS HOLD'EM POKER (BLINDADO ANTI-CRASH)
// ============================================================================

let motorPoker = {
    meuId: '', parceiroId: '', estado: 'aguardando', turno: '', pote: 0, apostaAtual: 0,
    mesaCartas: [], baralho: [], vencedor: null, vitoriaComemorada: false,
    jogadores: {}
};

window.fecharMesaPoker = function() {
    const mesa = document.getElementById('mesa-poker');
    if(mesa) mesa.style.display = 'none';
};

// ============================================================================
// 1. O OUVINTE DO POKER (COM PAGAMENTO BLINDADO)
// ============================================================================
window.iniciarOuvintePoker = function() {
    motorPoker.meuId = window.souJoao ? 'joao' : 'thamiris';
    motorPoker.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/poker_royale`), async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        motorPoker.estado = data.estado;
        motorPoker.turno = data.turno;
        motorPoker.pote = data.pote;
        motorPoker.apostaAtual = data.apostaAtual;
        motorPoker.vencedor = data.vencedor === "null" ? null : data.vencedor;
        
        motorPoker.baralho = JSON.parse(data.baralho || "[]");
        motorPoker.mesaCartas = JSON.parse(data.mesaCartas || "[]");

        let eu = data.jogadores[motorPoker.meuId] || {};
        let op = data.jogadores[motorPoker.parceiroId] || {};

        motorPoker.jogadores = {
            [motorPoker.meuId]: { ...eu, mao: JSON.parse(eu.mao || "[]") },
            [motorPoker.parceiroId]: { ...op, mao: JSON.parse(op.mao || "[]") }
        };

        // 🚨 FIM DE JOGO E TRANSFERÊNCIA BANCÁRIA
        if (motorPoker.vencedor && !motorPoker.vitoriaComemorada) {
            motorPoker.vitoriaComemorada = true;
            renderizarMesaPoker();
            
            // Lógica de Pagamento
            if (motorPoker.vencedor === motorPoker.meuId) {
                // Vitória sua: Seu celular faz o depósito
                if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(100, `Prêmio: Poker (Vitória)`);
                if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#2ecc71'], particleCount: 200});
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof mostrarToast === 'function') mostrarToast("VOCÊ VENCEU! +100💰", "🏆");
                
            } else if (motorPoker.vencedor === 'empate') {
                // Empate: Apenas o celular do João processa o dinheiro para não duplicar na conta conjunta!
                if (motorPoker.meuId === 'joao') {
                    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(100, `Prêmio: Poker (Split Pot)`);
                }
                if(typeof confetti === 'function') confetti({colors: ['#3498db', '#ffffff'], particleCount: 100});
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof mostrarToast === 'function') mostrarToast("EMPATE! O prêmio foi dividido.", "🤝");
                
            } else {
                // Derrota
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                if(typeof mostrarToast === 'function') mostrarToast("VOCÊ FOLDOU OU PERDEU! 💀", "🔥");
            }
            return;
        }

        renderizarMesaPoker();
    });
};

function gerarBaralhoPoker() {
    const naipes = ['♥️', '♦️', '♣️', '♠️'];
    const valores = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    let baralho = [];
    for(let n of naipes) {
        for(let v of valores) {
            baralho.push({ naipe: n, valor: v, cor: (n==='♥️'||n==='♦️') ? 'poker-red' : 'poker-black' });
        }
    }
    return baralho.sort(() => Math.random() - 0.5);
}

function criarDivCartaPoker(carta, delay) {
    return `<div class="poker-card animacao-distribuir ${carta.cor}" style="animation-delay: ${delay}s">
        <div class="poker-val-topo">${carta.valor}</div>
        <div class="poker-naipe-centro">${carta.naipe}</div>
        <div class="poker-val-base">${carta.valor}</div>
    </div>`;
}

function renderizarMesaPoker() {
    if (!motorPoker.jogadores[motorPoker.meuId]) return;
    
    const eu = motorPoker.jogadores[motorPoker.meuId];
    const op = motorPoker.jogadores[motorPoker.parceiroId];

    document.getElementById('poker-pote-valor').innerText = motorPoker.pote;
    document.getElementById('poker-fichas-jogador').innerText = eu.fichas;
    document.getElementById('poker-fichas-oponente').innerText = op.fichas;
    
    document.getElementById('poker-aposta-jogador').innerText = eu.aposta > 0 ? `Apostou: ${eu.aposta}` : '';
    document.getElementById('poker-aposta-oponente').innerText = op.aposta > 0 ? `Apostou: ${op.aposta}` : '';

    const aviso = document.getElementById('poker-estado-aviso');
    if (motorPoker.vencedor) {
        aviso.innerText = motorPoker.vencedor === 'empate' ? "EMPATE (SPLIT POT)" : (motorPoker.vencedor === motorPoker.meuId ? "🏆 VOCÊ VENCEU" : "💀 OPONENTE VENCEU");
        aviso.style.color = motorPoker.vencedor === motorPoker.meuId ? "#2ecc71" : "#e74c3c";
    } else {
        aviso.innerText = motorPoker.estado === 'aguardando' ? "" : motorPoker.estado;
        aviso.style.color = "#f1c40f";
    }

    const maoOponente = document.getElementById('poker-mao-oponente');
    if (maoOponente) {
        maoOponente.innerHTML = "";
        if (motorPoker.estado !== 'aguardando') {
            if (motorPoker.estado === 'showdown' || motorPoker.vencedor) {
                op.mao.forEach(c => maoOponente.innerHTML += criarDivCartaPoker(c, 0));
            } else {
                maoOponente.innerHTML = `<div class="poker-card-back"></div><div class="poker-card-back"></div>`;
            }
        }
    }

    const minhaMao = document.getElementById('poker-minha-mao');
    if (minhaMao) {
        minhaMao.innerHTML = "";
        if (eu.mao) eu.mao.forEach((c, i) => minhaMao.innerHTML += criarDivCartaPoker(c, i*0.2));
    }

    const board = document.getElementById('poker-mesa-cartas');
    if (board) {
        board.innerHTML = "";
        if (motorPoker.mesaCartas) motorPoker.mesaCartas.forEach((c, i) => board.innerHTML += criarDivCartaPoker(c, i*0.1));
    }

    const painelAcao = document.getElementById('poker-painel-acao');
    if (painelAcao && motorPoker.turno === motorPoker.meuId && !motorPoker.vencedor) {
        painelAcao.classList.remove('escondido');
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 50]);
                    }
        
        const btnCall = document.getElementById('btn-poker-check-call');
        const diff = motorPoker.apostaAtual - eu.aposta;
        btnCall.innerText = diff > 0 ? `PAGAR (${diff})` : `CHECK`;
        
        const slider = document.getElementById('poker-raise-slider');
        slider.min = motorPoker.apostaAtual + 20;
        slider.max = eu.fichas;
        slider.value = slider.min;
        document.getElementById('poker-raise-visor').innerText = slider.value;
    } else if (painelAcao) {
        painelAcao.classList.add('escondido');
        document.getElementById('poker-painel-raise').classList.add('escondido');
    }
}

window.acaoPoker = async function(acao, valorRaise = 0) {
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    document.getElementById('poker-painel-raise').classList.add('escondido');
    document.getElementById('poker-painel-acao').classList.add('escondido');

    const { db, ref, update } = window.SantuarioApp.modulos;
    let eu = motorPoker.jogadores[motorPoker.meuId];
    let up = {};

    if (acao === 'fold') {
        up['cassino/poker_royale/vencedor'] = motorPoker.parceiroId;
        await update(ref(db), up);
        return;
    }

    let diff = motorPoker.apostaAtual - eu.aposta;
    if (acao === 'call') {
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/fichas`] = eu.fichas - diff;
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/aposta`] = eu.aposta + diff;
        up[`cassino/poker_royale/pote`] = motorPoker.pote + diff;
        eu.acao = 'call';
    } else if (acao === 'raise') {
        let amt = parseInt(valorRaise);
        let custoReal = amt - eu.aposta; 
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/fichas`] = eu.fichas - custoReal;
        up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/aposta`] = amt;
        up[`cassino/poker_royale/pote`] = motorPoker.pote + custoReal;
        up[`cassino/poker_royale/apostaAtual`] = amt;
        eu.acao = 'raise';
    }

    up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/acao`] = eu.acao;
    
    let op = motorPoker.jogadores[motorPoker.parceiroId];
    
    // Regras de Avanço do Poker
    if ((eu.acao === 'call' && op.acao !== '') || (eu.acao === 'check' && op.acao === 'check')) {
        up = avancarEstadoPoker(up);
    } else {
        up[`cassino/poker_royale/turno`] = motorPoker.parceiroId;
    }

    await update(ref(db), up);
};

function avancarEstadoPoker(up) {
    up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/aposta`] = 0;
    up[`cassino/poker_royale/jogadores/${motorPoker.parceiroId}/aposta`] = 0;
    up[`cassino/poker_royale/jogadores/${motorPoker.meuId}/acao`] = '';
    up[`cassino/poker_royale/jogadores/${motorPoker.parceiroId}/acao`] = '';
    up[`cassino/poker_royale/apostaAtual`] = 0;
    up[`cassino/poker_royale/turno`] = motorPoker.parceiroId; 

    let baralho = [...motorPoker.baralho]; 
    let mesa = [...motorPoker.mesaCartas]; 

    if (motorPoker.estado === 'preflop') {
        up['cassino/poker_royale/estado'] = 'flop';
        mesa.push(baralho.pop(), baralho.pop(), baralho.pop());
    } else if (motorPoker.estado === 'flop') {
        up['cassino/poker_royale/estado'] = 'turn';
        mesa.push(baralho.pop());
    } else if (motorPoker.estado === 'turn') {
        up['cassino/poker_royale/estado'] = 'river';
        mesa.push(baralho.pop());
    } else if (motorPoker.estado === 'river') {
        up['cassino/poker_royale/estado'] = 'showdown';
        up['cassino/poker_royale/vencedor'] = 'empate'; 
    }

    // 🚨 A MÁGICA: Salva tudo como String invisível para proteger o seu App!
    up['cassino/poker_royale/mesaCartas'] = JSON.stringify(mesa);
    up['cassino/poker_royale/baralho'] = JSON.stringify(baralho);
    return up;
}

// ============================================================================
// 2. O BOTÃO DE NOVA MÃO (RESETANDO A MEMÓRIA DA MESA)
// ============================================================================
window.iniciarMaoPoker = async function() {
    // Cobra a taxa do casal
    if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(-20, "Taxa: Poker Heads-Up");
    if(typeof mostrarToast === 'function') mostrarToast("Dando as cartas...", "🃏");

    // 🚨 A CORREÇÃO: Limpa o estado da rodada anterior para permitir novos pagamentos
    motorPoker.vitoriaComemorada = false;
    motorPoker.vencedor = null;

    let baralho = gerarBaralhoPoker();
    let maoJoao = [baralho.pop(), baralho.pop()];
    let maoThamiris = [baralho.pop(), baralho.pop()];

    const meuId = window.souJoao ? 'joao' : 'thamiris';
    
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    // Inicia a mesa limpa e segura
    await update(ref(db), {
        'cassino/poker_royale': {
            estado: 'preflop', turno: meuId, pote: 0, apostaAtual: 0,
            mesaCartas: "[]", baralho: JSON.stringify(baralho), vencedor: "null",
            jogadores: {
                joao: { mao: JSON.stringify(maoJoao), fichas: 1000, aposta: 0, acao: '' },
                thamiris: { mao: JSON.stringify(maoThamiris), fichas: 1000, aposta: 0, acao: '' }
            }
        }
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
};

// ============================================================================
// 🎴 MOTOR REAL-TIME: UNO CLASSIC ROYALE (BLINDADO E JUICY)
// ============================================================================

let motorUno = {
    jogando: false, meuId: '', parceiroId: '', turno: '', minhaMao: [],
    cartasOponente: 0, cartaDescarte: null, corAtual: '', pote: 0,
    indexPendente: null, cartaPendente: null, vencedor: null, vitoriaComemorada: false
};

const somHeartbeatUno = new Audio('https://assets.mixkit.co/active_storage/sfx/2578/2578-preview.mp3');
somHeartbeatUno.loop = true;

window.fecharMesaUno = function() {
    somHeartbeatUno.pause();
    const mesa = document.getElementById('mesa-uno');
    if(mesa) mesa.style.display = 'none';
};

// ============================================================================
// 2. O PAGAMENTO DO PRÊMIO AO VENCEDOR
// ============================================================================
window.iniciarOuvinteUno = function() {
    motorUno.meuId = window.souJoao ? 'joao' : 'thamiris';
    motorUno.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue, update } = window.SantuarioApp.modulos;
    const unoRef = ref(db, `cassino/uno_royale`);

    onValue(unoRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        motorUno.jogando = true;
        motorUno.turno = data.turno;
        motorUno.cartaDescarte = data.descarte;
        motorUno.corAtual = data.corAtual;
        motorUno.pote = data.pote || 0;
        motorUno.vencedor = data.vencedor || null;
        
        motorUno.minhaMao = data.jogadores[motorUno.meuId]?.mao || [];
        motorUno.cartasOponente = data.jogadores[motorUno.parceiroId]?.qtdCartas || 0;

        // 🚨 FIM DE JOGO E PAGAMENTO
        if (motorUno.vencedor) {
            renderizarMesaUno();
            somHeartbeatUno.pause();
            
            if (motorUno.vencedor === motorUno.meuId && !motorUno.vitoriaComemorada) {
                motorUno.vitoriaComemorada = true;
                
                // 💰 TRANSFERE O POTE PARA A CONTA CONJUNTA
                if(typeof window.atualizarPontosCasal === 'function') {
                    window.atualizarPontosCasal(motorUno.pote, `Prêmio: Vitória no UNO (${motorUno.meuId.toUpperCase()})`);
                }

                if(typeof confetti === 'function') confetti({colors: ['#D4AF37', '#ffffff'], particleCount: 300, spread: 160});
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
                if(typeof mostrarToast === 'function') mostrarToast(`VITÓRIA! +${motorUno.pote} 💰 PARA O COFRE!`, "✨");
                
            } else if (motorUno.vencedor !== motorUno.meuId && !motorUno.vitoriaComemorada) {
                motorUno.vitoriaComemorada = true;
                if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
                if(typeof mostrarToast === 'function') mostrarToast("VOCÊ FOI DERROTADO! 💀", "🔥");
            }
            return; 
        }

        // Defesa contra Ataques
        if (data.ataquePendente && data.ataquePendente.alvo === motorUno.meuId) {
            if(typeof mostrarToast === 'function') mostrarToast(`ATAQUE RECEBIDO: +${data.ataquePendente.qtd} CARTAS!`, "🔥");
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 1.0);
            if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([300, 100, 400]);
                    }
            
            for(let i = 0; i < data.ataquePendente.qtd; i++) {
                motorUno.minhaMao.push(gerarCartaUnoAleatoria());
            }
            
            const up = {};
            up[`cassino/uno_royale/jogadores/${motorUno.meuId}/mao`] = motorUno.minhaMao;
            up[`cassino/uno_royale/jogadores/${motorUno.meuId}/qtdCartas`] = motorUno.minhaMao.length;
            up[`cassino/uno_royale/ataquePendente`] = null; 
            await update(ref(db), up);
            return; 
        }

        renderizarMesaUno();
        avaliarTensaoUno(); 
    });
};

function formatarSimboloUno(valor) {
    if (valor === 'bloqueio') return '🚫';
    if (valor === 'inverte') return '🔄';
    if (valor === 'muda_cor') return '🎨';
    return valor;
}

function criarElementoCarta(simbolo) {
    return `<div class="uno-oval"><span class="uno-val">${simbolo}</span></div>`;
}

function renderizarMesaUno() {
    const indTurno = document.getElementById('uno-indicador-turno');
    const topoOponente = document.getElementById('uno-status-oponente');
    const visorPote = document.getElementById('uno-pote-valor');
    
    if (visorPote) visorPote.innerText = motorUno.pote;

    if (indTurno && topoOponente) {
        if (motorUno.vencedor) {
            indTurno.innerText = motorUno.vencedor === motorUno.meuId ? "VITÓRIA 🏆" : "DERROTA 💀";
            indTurno.style.color = motorUno.vencedor === motorUno.meuId ? "rgba(212, 175, 55, 0.15)" : "rgba(235, 77, 75, 0.15)";
            topoOponente.innerText = motorUno.vencedor === motorUno.meuId ? "Você aniquilou o adversário!" : "O oponente levou tudo...";
        } else if (motorUno.turno === motorUno.meuId) {
            indTurno.innerText = "SUA VEZ";
            indTurno.style.color = "rgba(46, 204, 113, 0.08)";
            topoOponente.innerText = "Aguardando Oponente...";
        } else {
            indTurno.innerText = "OPONENTE";
            indTurno.style.color = "rgba(235, 77, 75, 0.08)";
            topoOponente.innerText = "Adversário Jogando ⏳";
        }
    }

    const descarte = document.getElementById('uno-descarte');
    if (descarte && motorUno.cartaDescarte) {
        descarte.className = `uno-card uno-${motorUno.corAtual} animacao-descarte`;
        descarte.innerHTML = criarElementoCarta(formatarSimboloUno(motorUno.cartaDescarte.valor));
        setTimeout(() => descarte.classList.remove('animacao-descarte'), 300);
    }

    const oponenteDiv = document.getElementById('uno-mao-oponente');
    if (oponenteDiv) {
        oponenteDiv.innerHTML = "";
        for (let i = 0; i < motorUno.cartasOponente; i++) {
            let back = document.createElement('div');
            back.className = 'uno-card-op';
            back.innerHTML = '<div class="uno-oval-op"></div>';
            oponenteDiv.appendChild(back);
        }
    }

    const minhaMaoDiv = document.getElementById('uno-minha-mao');
    if (minhaMaoDiv) {
        minhaMaoDiv.innerHTML = "";
        motorUno.minhaMao.forEach((carta, index) => {
            let c = document.createElement('div');
            c.className = `uno-card uno-${carta.cor}`;
            c.innerHTML = criarElementoCarta(formatarSimboloUno(carta.valor));

            let podeJogar = false;
            if (motorUno.turno === motorUno.meuId && !motorUno.vencedor) {
                if (carta.cor === 'preto' || carta.cor === motorUno.corAtual || carta.valor === motorUno.cartaDescarte?.valor) {
                    podeJogar = true;
                    c.classList.add('uno-jogavel');
                }
            }

            c.onclick = () => {
                if (motorUno.vencedor) return;
                if (podeJogar) jogarCartaNoFirebase(carta, index);
                else if (motorUno.turno === motorUno.meuId) {
                    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('erro', 0.6);
                    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
                }
            };
            minhaMaoDiv.appendChild(c);
        });
    }

    // 🚨 REVELAÇÃO DO BOTÃO UNO BLINDADA
    const btnGritar = document.getElementById('btn-uno-gritar');
    if (btnGritar) {
        if (motorUno.minhaMao.length === 1 && !motorUno.vencedor) {
            btnGritar.classList.remove('escondido');
            btnGritar.style.display = 'block';
        } else {
            btnGritar.classList.add('escondido');
            btnGritar.style.display = 'none';
        }
    }
}

function avaliarTensaoUno() {
    if (motorUno.vencedor) {
        somHeartbeatUno.pause();
        return;
    }
    if (motorUno.cartasOponente === 1 || motorUno.minhaMao.length === 1) {
        if (!window.SantuarioSomPausado && somHeartbeatUno.paused) somHeartbeatUno.play().catch(e=>{});
    } else {
        somHeartbeatUno.pause();
    }
}

window.jogarCartaNoFirebase = function(carta, index) {
    if (motorUno.vencedor) return;
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjCard', 0.9);
    
    if (carta.cor === 'preto') {
        motorUno.indexPendente = index;
        motorUno.cartaPendente = carta;
        document.getElementById('uno-seletor-cor').classList.remove('escondido');
        return; 
    }
    processarJogada(carta, index, carta.cor);
};

window.escolherCorUno = function(corEscolhida) {
    document.getElementById('uno-seletor-cor').classList.add('escondido');
    processarJogada(motorUno.cartaPendente, motorUno.indexPendente, corEscolhida);
};

async function processarJogada(carta, index, corFinal) {
    const { db, ref, update } = window.SantuarioApp.modulos;
    
    let novaMao = [...motorUno.minhaMao];
    novaMao.splice(index, 1);

    let proximoTurno = motorUno.parceiroId;
    if (carta.valor === 'bloqueio' || carta.valor === 'inverte' || carta.valor === '+2' || carta.valor === '+4') {
        proximoTurno = motorUno.meuId;
    }

    const updates = {};
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/mao`] = novaMao;
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/qtdCartas`] = novaMao.length;
    updates[`cassino/uno_royale/descarte`] = carta;
    updates[`cassino/uno_royale/corAtual`] = corFinal;
    updates[`cassino/uno_royale/turno`] = proximoTurno;

    if (carta.valor === '+2' || carta.valor === '+4') {
        updates[`cassino/uno_royale/ataquePendente`] = { alvo: motorUno.parceiroId, qtd: carta.valor === '+4' ? 4 : 2 };
    }

    if (novaMao.length === 0) {
        updates[`cassino/uno_royale/vencedor`] = motorUno.meuId;
    }

    await update(ref(db), updates);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
}

window.gritarUnoAction = function() {
    document.getElementById('btn-uno-gritar').classList.add('escondido');
    document.getElementById('btn-uno-gritar').style.display = 'none';
    if(typeof confetti === 'function') confetti({colors: ['#eb4d4b', '#f1c40f'], particleCount: 150});
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 0.8);
    if(typeof mostrarToast === 'function') mostrarToast("UNO GRITADO COM SUCESSO!", "📢");
};

function gerarCartaUnoAleatoria() {
    const cores = ['vermelho', 'azul', 'verde', 'amarelo'];
    const valores = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+2', 'inverte', 'bloqueio'];
    
    if (Math.random() < 0.08) return { cor: 'preto', valor: Math.random() > 0.5 ? '+4' : 'muda_cor' };
    return { cor: cores[Math.floor(Math.random() * cores.length)], valor: valores[Math.floor(Math.random() * valores.length)] };
}

window.comprarCartaUno = async function() {
    if (motorUno.vencedor || motorUno.turno !== motorUno.meuId) return;
    
    motorUno.minhaMao.push(gerarCartaUnoAleatoria());
    
    const { db, ref, update } = window.SantuarioApp.modulos;
    const updates = {};
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/mao`] = motorUno.minhaMao;
    updates[`cassino/uno_royale/jogadores/${motorUno.meuId}/qtdCartas`] = motorUno.minhaMao.length;
    updates[`cassino/uno_royale/turno`] = motorUno.parceiroId; 

    await update(ref(db), updates);
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
};

// ============================================================================
// 1. A COBRANÇA DA TAXA E CRIAÇÃO DA MESA
// ============================================================================
window.iniciarDueloUno = async function() {
    // 🚨 COBRA A INSCRIÇÃO DA CONTA CONJUNTA
    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-100, "Inscrição: Duelo UNO Royale");
    }

    if(typeof mostrarToast === 'function') mostrarToast("Inscrição paga. Embaralhando...", "🎴");
    
    motorUno.meuId = window.souJoao ? 'joao' : 'thamiris';
    motorUno.parceiroId = window.souJoao ? 'thamiris' : 'joao';
    motorUno.vitoriaComemorada = false; 
    motorUno.vencedor = null; 

    const { db, ref, update } = window.SantuarioApp.modulos;
    
    let maoJoao = [];
    let maoThamiris = [];
    for(let i = 0; i < 7; i++) { 
        maoJoao.push(gerarCartaUnoAleatoria()); 
        maoThamiris.push(gerarCartaUnoAleatoria()); 
    }

    let prim = gerarCartaUnoAleatoria();
    while(prim.cor === 'preto') prim = gerarCartaUnoAleatoria();

    // 🚨 O CASSINO GERA O POTE DE RECOMPENSA (500)
    await update(ref(db), {
        'cassino/uno_royale': {
            turno: motorUno.meuId,
            descarte: prim, corAtual: prim.cor, pote: 500, ataquePendente: null, vencedor: null,
            jogadores: { joao: { mao: maoJoao, qtdCartas: 7 }, thamiris: { mao: maoThamiris, qtdCartas: 7 } }
        }
    });
    
    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 100]);
                    }
};


// ============================================================================
// 🎲 MOTOR REAL-TIME: CRAPS VEGAS DICE (COM SISTEMA DE PRONTIDÃO CO-OP)
// ============================================================================

window.motorCraps = {
    meuId: '', parceiroId: '',
    status: 'apostando', // 'apostando', 'rolando', 'resultado'
    apostas: {},
    resultado: [6, 6],
    roladoPor: '',
    valorFicha: 50,
    prontos: { joao: false, thamiris: false } // 🚨 NOVO: Controle de Sincronia
};

const facesDado = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const somRolagemDados = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3'); 

window.fecharMesaCraps = function() {
    const mesa = document.getElementById('mesa-craps');
    if(mesa) { mesa.classList.add('escondido'); mesa.style.display = 'none'; }
};

window.iniciarOuvinteCraps = function() {
    window.motorCraps.meuId = window.souJoao ? 'joao' : 'thamiris';
    window.motorCraps.parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    onValue(ref(db, `cassino/craps_royale`), (snapshot) => {
        try {
            const data = snapshot.val() || { status: 'apostando', apostas: {} };
            
            window.motorCraps.status = data.status || 'apostando';
            window.motorCraps.apostas = data.apostas || {};
            window.motorCraps.resultado = data.resultado || [6, 6];
            window.motorCraps.roladoPor = data.roladoPor || '';
            window.motorCraps.prontos = data.prontos || { joao: false, thamiris: false };

            renderMesaCraps();

            if (window.motorCraps.status === 'rolando') {
                animarRolagemCraps();
            }
        } catch (e) {
            console.error("Erro no ouvinte de Craps:", e);
        }
    });

    const visor = document.getElementById('craps-ficha-valor');
    if (visor) visor.innerText = window.motorCraps.valorFicha;
};

window.ajustarFichaCraps = function(delta) {
    if (window.motorCraps.status !== 'apostando') return;
    if (window.motorCraps.prontos[window.motorCraps.meuId]) return; // 🚨 Trava se já confirmou
    
    let atual = Number(window.motorCraps.valorFicha) || 50;
    let novoValor = atual + delta;
    
    const saldo = Number(window.pontosDoCasal) || 0;
    if (novoValor > saldo) novoValor = saldo;
    if (novoValor < 10) novoValor = 10;
    
    window.motorCraps.valorFicha = novoValor;
    const visor = document.getElementById('craps-ficha-valor');
    if(visor) visor.innerText = novoValor;
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
};

window.apostarCraps = async function(tipo) {
    if (window.motorCraps.status !== 'apostando') return;
    
    // 🚨 Trava de Ação: Se você já apertou Lançar, não pode mais mexer nas fichas!
    if (window.motorCraps.prontos[window.motorCraps.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Você já confirmou! Aguarde o parceiro.", "⏳");
        return;
    }
    
    const valorParaApostar = Number(window.motorCraps.valorFicha);
    const saldoDisponivel = Number(window.pontosDoCasal);

    if (isNaN(valorParaApostar) || valorParaApostar <= 0) return;

    if (saldoDisponivel < valorParaApostar) {
        if(typeof mostrarToast === 'function') mostrarToast("Cofre insuficiente!", "💸");
        return;
    }

    if(typeof window.atualizarPontosCasal === 'function') {
        window.atualizarPontosCasal(-valorParaApostar, `Aposta Craps: ${tipo}`);
    }

    const { db, ref, push } = window.SantuarioApp.modulos;
    await push(ref(db, `cassino/craps_royale/apostas`), {
        tipo: tipo,
        valor: valorParaApostar,
        autor: window.motorCraps.meuId
    });

    if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('fichaAdd', 0.8);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([50]);
                    }
};

window.limparApostasCraps = async function() {
    if (window.motorCraps.status !== 'apostando') return;
    if (window.motorCraps.prontos[window.motorCraps.meuId]) {
        if(typeof mostrarToast === 'function') mostrarToast("Fichas travadas. Você já confirmou!", "🔒");
        return;
    }

    let totalDevolvido = 0;
    Object.values(window.motorCraps.apostas).forEach(ap => {
        if (ap.autor === window.motorCraps.meuId) {
            let v = Number(ap.valor);
            if (!isNaN(v)) totalDevolvido += v;
        }
    });

    if (totalDevolvido > 0) {
        if(typeof window.atualizarPontosCasal === 'function') {
            window.atualizarPontosCasal(totalDevolvido, "Reembolso Craps");
        }
    }

    const { db, ref, set } = window.SantuarioApp.modulos;
    await set(ref(db, `cassino/craps_royale/apostas`), null);
    if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
};

function renderMesaCraps() {
    const statusTxt = document.getElementById('craps-status-mesa');
    if (statusTxt) {
        statusTxt.innerText = window.motorCraps.status === 'rolando' ? "DADOS VOANDO..." : "A MESA ESTÁ QUENTE";
        statusTxt.style.color = window.motorCraps.status === 'rolando' ? "#f1c40f" : "#e67e22";
    }

    // Renderiza fichas físicas
    document.querySelectorAll('#craps-tabuleiro .container-fichas').forEach(el => el.innerHTML = '');
    Object.values(window.motorCraps.apostas).forEach((ap, idx) => {
        const zona = document.getElementById(`zona-${ap.tipo}`);
        if (zona) {
            const corBorda = ap.autor === 'joao' ? '#3498db' : '#e84393';
            const x = (idx * 6) % 30;
            zona.innerHTML += `<div class="ficha-cassino" style="border-color: ${corBorda}; transform: translate(${x}px, ${x}px);">${ap.valor}</div>`;
        }
    });

    // 🚨 MUDANÇA VISUAL DO BOTÃO DE LANÇAMENTO
    const btnLancar = document.getElementById('btn-lancar-craps');
    if (btnLancar) {
        if (window.motorCraps.prontos[window.motorCraps.meuId]) {
            btnLancar.innerText = "AGUARDANDO PARCEIRO ⏳";
            btnLancar.style.background = "#555";
            btnLancar.style.boxShadow = "none";
            btnLancar.style.animation = "none";
            btnLancar.style.color = "#ccc";
        } else {
            btnLancar.innerText = "LANÇAR DADOS 🎲";
            btnLancar.style.background = "linear-gradient(145deg, #e67e22, #d35400)";
            btnLancar.style.boxShadow = "0 5px 20px rgba(230, 126, 34, 0.5)";
            btnLancar.style.animation = "btnNeonPulse 1.5s infinite";
            btnLancar.style.color = "#fff";
        }
    }
}

// 🚨 A MÁGICA DA SINCRONIA: Avalia se os dois clicaram
window.lancarDadosCraps = async function() {
    if (window.motorCraps.status !== 'apostando') return;
    if (window.motorCraps.prontos[window.motorCraps.meuId]) return; // Já confirmou

    if (Object.keys(window.motorCraps.apostas).length === 0) {
        if(typeof mostrarToast === 'function') mostrarToast("Coloquem fichas na mesa antes de rolar!", "⚠️");
        return;
    }

    const { db, ref, update, get } = window.SantuarioApp.modulos;
    const crapsRef = ref(db, `cassino/craps_royale`);

    // Busca o status mais fresco do servidor para evitar conflito de milissegundos
    const snap = await get(crapsRef);
    const data = snap.val() || {};
    let prontos = data.prontos || { joao: false, thamiris: false };

    // Marca você como pronto
    prontos[window.motorCraps.meuId] = true;

    if (prontos[window.motorCraps.parceiroId] === true) {
        // 🚀 O PARCEIRO JÁ ESTAVA PRONTO! ROLA OS DADOS!
        const d1 = Math.floor(Math.random() * 6) + 1;
        const d2 = Math.floor(Math.random() * 6) + 1;

        await update(crapsRef, {
            status: 'rolando',
            resultado: [d1, d2],
            roladoPor: window.motorCraps.meuId, // Você foi o gatilho final
            prontos: { joao: false, thamiris: false } // Reseta os botões
        });
    } else {
        // 🛑 O PARCEIRO AINDA NÃO CLICOU. Atualiza só o botão.
        await update(crapsRef, { prontos: prontos });
        if(typeof mostrarToast === 'function') mostrarToast("Aguardando confirmação da equipe...", "⏳");
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([30]);
                    }
    }
};

function animarRolagemCraps() {
    const d1El = document.getElementById('craps-dado1');
    const d2El = document.getElementById('craps-dado2');
    const resVisor = document.getElementById('craps-resultado-texto');
    
    if (!d1El || !d2El) return;

    resVisor.classList.add('escondido');
    d1El.classList.add('rolando-dado');
    d2El.classList.add('rolando-dado');
    
    if(!window.SantuarioSomPausado) {
        somRolagemDados.currentTime = 0;
        somRolagemDados.play().catch(()=>{});
    }

    let interval = setInterval(() => {
        d1El.innerText = facesDado[Math.floor(Math.random() * 6) + 1];
        d2El.innerText = facesDado[Math.floor(Math.random() * 6) + 1];
    }, 100);

    setTimeout(() => {
        clearInterval(interval);
        d1El.classList.remove('rolando-dado');
        d2El.classList.remove('rolando-dado');
        somRolagemDados.pause();
        
        if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('bjStart', 1.0);
        if (window.Haptics && navigator.vibrate) {
                        navigator.vibrate([100, 50, 200]);
                    }

        const resArray = window.motorCraps.resultado;
        d1El.innerText = facesDado[resArray[0]];
        d2El.innerText = facesDado[resArray[1]];
        
        const soma = resArray[0] + resArray[1];
        resVisor.innerText = soma;
        resVisor.classList.remove('escondido');

        if (window.motorCraps.roladoPor === window.motorCraps.meuId) {
            processarRecompensaCraps();
        }
    }, 2500);
}

async function processarRecompensaCraps() {
    let ganhoTotal = 0;
    const resArray = window.motorCraps.resultado;
    const soma = resArray[0] + resArray[1];
    const ehDuplo = resArray[0] === resArray[1];
    
    Object.values(window.motorCraps.apostas).forEach(ap => {
        let acertou = false;
        let mult = 0;

        if (ap.tipo === 'pass_line' && (soma === 7 || soma === 11)) { acertou = true; mult = 2; }
        if (ap.tipo === 'craps' && (soma === 2 || soma === 3 || soma === 12)) { acertou = true; mult = 8; }
        if (ap.tipo === 'field' && [2,3,4,9,10,11,12].includes(soma)) { acertou = true; mult = 2; }
        if (ap.tipo === 'sete' && soma === 7) { acertou = true; mult = 5; }
        
        if (ap.tipo === 'hardways' && [4,6,8,10].includes(soma) && ehDuplo) { acertou = true; mult = 8; }

        if (acertou) ganhoTotal += (Number(ap.valor) * mult);
    });

    if (ganhoTotal > 0) {
        if(typeof window.atualizarPontosCasal === 'function') window.atualizarPontosCasal(ganhoTotal, `Prêmio Craps (${soma})`);
        setTimeout(() => {
            if(typeof confetti === 'function') confetti({colors: ['#e67e22', '#ffffff'], particleCount: 200});
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsWin', 1.0);
            if(typeof mostrarToast === 'function') mostrarToast(`A MESA PAGOU +${ganhoTotal} 💰!`, "🎲");
        }, 500);
    } else {
        setTimeout(() => {
            if(window.CassinoAudio && !window.SantuarioSomPausado) window.CassinoAudio.tocar('slotsLose', 0.8);
            if(typeof mostrarToast === 'function') mostrarToast(`A Casa levou... 💀`, "💸");
        }, 500);
    }

    setTimeout(async () => {
        const { db, ref, set } = window.SantuarioApp.modulos;
        // Limpa tudo, reseta as apostas e deixa o botão aceso de novo para ambos
        await set(ref(db, `cassino/craps_royale`), { status: 'apostando', apostas: {}, resultado: [6,6], roladoPor: '', prontos: {joao: false, thamiris: false} });
        document.getElementById('craps-resultado-texto').classList.add('escondido');
    }, 3500);
}


