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
        const urlFurtiva = `./modulos/${jogoId}.html?v=${window.APP_VERSION}`;
        
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

// ============================================================================
// MOTOR DE INJEÇÃO DE JAVASCRIPT SOB DEMANDA (LAZY LOAD ENGINE)
// ============================================================================

window.modulosCarregadosJS = {};
window.APP_VERSION = window.APP_VERSION || '2026.05.02-minifazenda-hud-fase2';
window.mapaModulosJS = {
    sincronia: 'sincronia',
    tribunal: 'tribunal',
    julgamento: 'julgamento',
    minifazenda: 'minifazenda_novo',
    contratos: 'contratos',
    estufa: 'estufa',
    cartorio: 'cartorio',
    banco: 'banco',
    pericia: 'pericia',
    logistica: 'logistica',
    agua: 'hidratacao',
    agenda: 'agenda',
    roleta: 'roleta',
    guardiao: 'pet',
    cinema: 'cinema',
    correio: 'correio',
    pager: 'pager',
    tesouro: 'tesouro'
};

window.injetarModuloJS = function(nomeDoArquivo) {
    return new Promise((resolve, reject) => {
        // 1. Se o script já foi baixado antes, não gasta internet nem RAM de novo
        if (window.modulosCarregadosJS[nomeDoArquivo]) {
            return resolve(true);
        }

        if(typeof mostrarToast === 'function') mostrarToast("Carregando motor do jogo...", "⚙️");

        // 2. Cria a tag de script dinamicamente
        const script = document.createElement('script');
        
        // Colocamos um Date.now() para burlar o cache fantasma durante o desenvolvimento!
        script.src = `./${nomeDoArquivo}.js?v=${window.APP_VERSION}`;
        
        // 🚨 A CHAVE DA PERFORMANCE: 'async = true' diz ao processador do celular 
        // para ler o script em uma linha paralela, sem congelar as animações da tela!
        script.async = true; 

        // 3. Quando o download terminar com sucesso:
        script.onload = () => {
            window.modulosCarregadosJS[nomeDoArquivo] = true;
            console.log(`[LazyLoad] Módulo ${nomeDoArquivo}.js carregado com sucesso!`);
            resolve(true);
        };

        // 4. Se der erro (ex: sem internet ou arquivo não existe)
        script.onerror = () => {
            console.error(`[LazyLoad] Falha crítica ao baixar: ${nomeDoArquivo}.js`);
            if(typeof mostrarToast === 'function') mostrarToast("Erro ao carregar o jogo. Verifique a internet.", "❌");
            reject(new Error(`Falha no script ${nomeDoArquivo}`));
        };

        // 5. Injeta o script no final do corpo da página para iniciar o download
        document.body.appendChild(script);
    });
};

// ==========================================
// VARIÁVEIS GLOBAIS DE ESTADO
// ==========================================
window.statusPlanta = { nivel: 0, ultimaRegada: 0, diaUltimaRegada: "", ultimaVerificacao: Date.now(), sequencia: 0, ciclos: 0 };
let audioJogos = null;
window.offEcoSantuario = null;
window.offFuturoTempo = null;
window.offPlanetario = null;
window.offSonoParceira = null;
window.offRotaDestino = null;
window.offMandados = null;
window.offPresencaConexao = null;
window.offPresencaParceiro = null;
window.offRadarParceiro = null;
window.offRadarGeoParceiro = null;
window.offEpicentroParceiro = null;
window.offEspelhoDaAlma = null;
window.offBoutiqueGastos = null;
window.offChecklistBoutique = null;
window.offTocaDiscos = null;
window.offInventarioCasal = null;

window.loopRadarGeo = null;
window.parceiroPresencaAnterior = null;
window.onParadoxoOrientation = null;
window.observadoresUISantuario = window.observadoresUISantuario || [];
window.observadoresUISantuarioAtivos = window.observadoresUISantuarioAtivos || false;
window.listenersGlobaisUltraAtivos = false;



let telaAtual = 'home';
window.moduloAtivo = null;
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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('eco3d');
        window.SantuarioRuntime.clearModule('bussola3d');
        window.SantuarioRuntime.clearModule('planetario3d');
        window.SantuarioRuntime.clearModule('galaxia3d');
        window.SantuarioRuntime.clearModule('epicentro');
        window.SantuarioRuntime.clearModule('tocadiscos');
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
        if (window.moduloAtivo && window.moduloAtivo !== tipo && window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule(window.moduloAtivo);
    }
    window.moduloAtivo = tipo;
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

        const arquivoJSDoModulo = window.mapaModulosJS[tipo];

        if (arquivoJSDoModulo) {
            try {
                await window.injetarModuloJS(arquivoJSDoModulo);
            } catch (erro) {
                console.error(`Falha ao carregar o JS do módulo ${tipo}:`, erro);
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
        if (window.moduloAtivo && window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule(window.moduloAtivo);
    }
    window.moduloAtivo = null;
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
            
            if (!window.SantuarioSomPausado && window.audioAlertaEmergencia) {
                window.audioAlertaEmergencia.currentTime = 0;

                if (window.safePlayMedia) {
                    window.safePlayMedia(window.audioAlertaEmergencia);
                } else {
                    window.audioAlertaEmergencia.play().catch(() => console.log("Áudio bloqueado"));
                }
            }
        }
    };

    window.fecharEmergencia = function() {
    const modal = document.getElementById('modal-emergencia');
    if (modal) {
        modal.classList.add('escondido');

        if (window.audioAlertaEmergencia) {
            window.audioAlertaEmergencia.pause();
            window.audioAlertaEmergencia.currentTime = 0;
        }

        if (window.MotorDeAudio) window.MotorDeAudio.focar();

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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('eco-global');
    }

    if (window.offEcoSantuario) {
        window.offEcoSantuario();
        window.offEcoSantuario = null;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refEcoSantuario = ref(db, 'eco_santuario/frequencia_atual');

    window.offEcoSantuario = onValue(refEcoSantuario, (snapshot) => {
        const dados = snapshot.val();
        const btnOuvir = document.getElementById('btn-ouvir-eco');
        const statusEco = document.getElementById('status-eco');

        const urlOuBase64 = dados ? (dados.audioUrl || dados.audioBase64) : null;

        if (dados && urlOuBase64) {
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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('eco-global', () => {
            if (window.offEcoSantuario) {
                window.offEcoSantuario();
                window.offEcoSantuario = null;
            }
        });
    }
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
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('capsula-futuro');
    }
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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('capsula-futuro');
    }

    if (window.offFuturoTempo) {
        window.offFuturoTempo();
        window.offFuturoTempo = null;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refMinhasCapsulas = ref(db, 'capsulas_tempo/' + window.MEU_NOME.toLowerCase());

    window.offFuturoTempo = onValue(refMinhasCapsulas, (snapshot) => {
        const dados = snapshot.val();

        if (!dados) {
            capsulaFuturoDados = null;
            capsulaFuturoId = null;
            totalFuturoNaFila = 0;
        } else {
            const listaCapsulas = Object.keys(dados).map(key => ({ id: key, ...dados[key] }));
            totalFuturoNaFila = listaCapsulas.length;
            listaCapsulas.sort((a, b) => a.dataAbertura - b.dataAbertura);
            capsulaFuturoDados = listaCapsulas[0];
            capsulaFuturoId = listaCapsulas[0].id;
        }

        atualizarInterfaceFuturo();
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('capsula-futuro', () => {
            if (window.offFuturoTempo) {
                window.offFuturoTempo();
                window.offFuturoTempo = null;
            }
        });
    }
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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('telepresenca-global');
    }

    if (window.offRadarParceiro) {
        window.offRadarParceiro();
        window.offRadarParceiro = null;
    }

    if (loopVibracaoRadar) {
        clearInterval(loopVibracaoRadar);
        loopVibracaoRadar = null;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const chaveParceiro = window.souJoao ? 'thamiris' : 'joao';
    const radarParceiroRef = ref(db, 'telepresenca/' + chaveParceiro);

    window.offRadarParceiro = onValue(radarParceiroRef, (snapshot) => {
        const dados = snapshot.val();
        const containerRadar = document.getElementById('radar-telepresenca');

        if (dados && dados.pulsando) {
            if (containerRadar) containerRadar.classList.add('radar-recebendo');

            if (!loopVibracaoRadar) {
                if (typeof window.dispararEfeitoCoracao === 'function') {
                    window.dispararEfeitoCoracao(containerRadar);
                }

                loopVibracaoRadar = setInterval(() => {
                    if (typeof window.dispararEfeitoCoracao === 'function') {
                        window.dispararEfeitoCoracao(containerRadar);
                    }
                }, 800);

                if (window.SantuarioRuntime) {
                    window.SantuarioRuntime.addInterval('telepresenca-global', loopVibracaoRadar);
                }
            }
        } else {
            if (containerRadar) containerRadar.classList.remove('radar-recebendo');

            if (loopVibracaoRadar) {
                clearInterval(loopVibracaoRadar);
                loopVibracaoRadar = null;
            }
        }
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('telepresenca-global', () => {
            if (window.offRadarParceiro) {
                window.offRadarParceiro();
                window.offRadarParceiro = null;
            }

            if (loopVibracaoRadar) {
                clearInterval(loopVibracaoRadar);
                loopVibracaoRadar = null;
            }
        });
    }
};

// ==========================================
// OLHEIRO INTELIGENTE: OCULTA O RADAR E BOTÕES GLOBAIS
// ==========================================
window.inicializarObservadoresUI = function() {
    if (window.observadoresUISantuarioAtivos) return;
    window.observadoresUISantuarioAtivos = true;

    const radar = document.getElementById('radar-telepresenca');
    const btnMutar = document.getElementById('btn-mutar-global');
    const modalReliquia = document.getElementById('modal-reliquia');
    const telaLogin = document.getElementById('tela-login');

    const verificarVisibilidadeElementos = () => {
        const emJogo = document.body.classList.contains('modo-jogo-ativo');
        const emReliquia = modalReliquia && !modalReliquia.classList.contains('escondido');
        const noLogin = telaLogin && telaLogin.style.display !== 'none';

        if (emJogo || emReliquia || noLogin) {
            if (radar) radar.style.display = 'none';
            if (btnMutar) btnMutar.style.display = 'none';
        } else {
            if (radar) radar.style.display = 'flex';
            if (btnMutar) btnMutar.style.display = 'flex';
        }
    };

    const observerBody = new MutationObserver(verificarVisibilidadeElementos);
    observerBody.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.observadoresUISantuario.push(observerBody);

    if (modalReliquia) {
        const observerModal = new MutationObserver(verificarVisibilidadeElementos);
        observerModal.observe(modalReliquia, { attributes: true, attributeFilter: ['class'] });
        window.observadoresUISantuario.push(observerModal);
    }

    if (telaLogin) {
        const observerLogin = new MutationObserver(verificarVisibilidadeElementos);
        observerLogin.observe(telaLogin, { attributes: true, attributeFilter: ['style'] });
        window.observadoresUISantuario.push(observerLogin);
    }

    verificarVisibilidadeElementos();

    const timerVisibilidade = setTimeout(verificarVisibilidadeElementos, 3000);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addTimeout('ui-observers', timerVisibilidade);
        window.SantuarioRuntime.addCleanup('ui-observers', () => {
            window.observadoresUISantuario.forEach(observer => {
                try { observer.disconnect(); } catch (e) {}
            });
            window.observadoresUISantuario = [];
            window.observadoresUISantuarioAtivos = false;
        });
    }
};

window.addEventListener('load', window.inicializarObservadoresUI, { once: true });



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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('planetario-global');
    }

    if (window.offPlanetario) {
        window.offPlanetario();
        window.offPlanetario = null;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refPlanetario = ref(db, 'planetario_sonhos');

    window.offPlanetario = onValue(refPlanetario, (snapshot) => {
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

        let htmlBuffer = "";

        arrayEstrelas.forEach(estrela => {
            const dataCriacao = new Date(estrela.dataCriacao).toLocaleDateString('pt-BR');
            const isSupernova = estrela.realizado;
            if (isSupernova) countSupernovas++;

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

        lista.innerHTML = htmlBuffer;
        window.quantidadeSupernovas = countSupernovas;
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('planetario-global', () => {
            if (window.offPlanetario) {
                window.offPlanetario();
                window.offPlanetario = null;
            }
        });
    }
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

    if (window.offTocaDiscos) {
        window.offTocaDiscos();
        window.offTocaDiscos = null;
    }
    if (!window.SantuarioApp) return;
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refMusica = ref(db, 'estado_musica');
    
    window.offTocaDiscos = onValue(refMusica, (snapshot) => {
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

        if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('tocadiscos', () => {
            if (window.offTocaDiscos) {
                window.offTocaDiscos();
                window.offTocaDiscos = null;
            }
        });
    }
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
    const eu = window.MEU_NOME || (window.souJoao ? 'João' : 'Thamiris');
    const parceiro = window.NOME_PARCEIRO || (window.souJoao ? 'Thamiris' : 'João');

    if (!window.SantuarioApp || !eu || !parceiro) return;

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('espelho-global');
    }

    if (window.offEspelhoDaAlma) {
        window.offEspelhoDaAlma();
        window.offEspelhoDaAlma = null;
    }

    const hoje = new Date();
    const stringData = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;

    const inicioAno = new Date(hoje.getFullYear(), 0, 0);
    const diff = hoje - inicioAno;
    const umDia = 1000 * 60 * 60 * 24;
    const diaDoAno = Math.floor(diff / umDia);
    const indicePergunta = diaDoAno % PERGUNTAS_ESPELHO.length;

    const perguntaEl = document.getElementById('pergunta-espelho');
    if (perguntaEl) {
        perguntaEl.innerText = `"${PERGUNTAS_ESPELHO[indicePergunta]}"`;
    }

    const tagNomeParceiro = document.getElementById('nome-parceiro-espelho');
    if (tagNomeParceiro) {
        tagNomeParceiro.innerText = `A alma de ${parceiro}`;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refEspelho = ref(db, `espelho_alma/${stringData}`);

    window.offEspelhoDaAlma = onValue(refEspelho, (snapshot) => {
        const dados = snapshot.val() || {};

        const minhaResposta = dados[eu.toLowerCase()];
        const respostaDela = dados[parceiro.toLowerCase()];

        const boxResponder = document.getElementById('estado-espelho-responder');
        const boxAguardando = document.getElementById('estado-espelho-aguardando');
        const boxRevelado = document.getElementById('estado-espelho-revelado');
        const cartaoEspelho = document.getElementById('cartao-espelho-alma');

        if (minhaResposta && respostaDela) {
            if (boxResponder) boxResponder.classList.add('escondido');
            if (boxAguardando) boxAguardando.classList.add('escondido');
            if (boxRevelado) boxRevelado.classList.remove('escondido');

            const respostaMinhaEl = document.getElementById('resposta-minha');
            const respostaDelaEl = document.getElementById('resposta-dela');

            if (respostaMinhaEl) respostaMinhaEl.innerText = minhaResposta;
            if (respostaDelaEl) respostaDelaEl.innerText = respostaDela;

            if (cartaoEspelho && !cartaoEspelho.classList.contains('efeito-estilhaco')) {
                cartaoEspelho.classList.add('efeito-estilhaco');
                if (window.Haptics && navigator.vibrate) {
                    navigator.vibrate([100, 50, 200, 50, 300]);
                }
                if (typeof confetti === 'function') {
                    confetti({
                        colors: ['#D4AF37', '#ffffff', '#3498db'],
                        particleCount: 150,
                        spread: 120,
                        zIndex: 1000
                    });
                }
            }
        } else if (minhaResposta && !respostaDela) {
            if (boxResponder) boxResponder.classList.add('escondido');
            if (boxAguardando) boxAguardando.classList.remove('escondido');
            if (boxRevelado) boxRevelado.classList.add('escondido');

            const txtAguardando = document.getElementById('texto-aguardando-espelho');
            if (txtAguardando) {
                txtAguardando.innerText = `A sua verdade foi gravada. Aguardando ${parceiro} responder em Goiânia para que o espelho se estilhace... 🔒`;
            }
        } else if (!minhaResposta && respostaDela) {
            if (boxResponder) boxResponder.classList.remove('escondido');
            if (boxAguardando) boxAguardando.classList.remove('escondido');
            if (boxRevelado) boxRevelado.classList.add('escondido');

            const txtAguardando = document.getElementById('texto-aguardando-espelho');
            if (txtAguardando) {
                txtAguardando.innerHTML = `<span style="color: #ff9ff3; font-weight:bold; font-size:1.1rem;">✨ ${parceiro} já respondeu!</span><br>O espelho agora aguarda a sua resposta para ser revelado.`;
            }
        } else {
            if (boxResponder) boxResponder.classList.remove('escondido');
            if (boxAguardando) boxAguardando.classList.add('escondido');
            if (boxRevelado) boxRevelado.classList.add('escondido');
            if (cartaoEspelho) cartaoEspelho.classList.remove('efeito-estilhaco');
        }
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('espelho-global', () => {
            if (window.offEspelhoDaAlma) {
                window.offEspelhoDaAlma();
                window.offEspelhoDaAlma = null;
            }
        });
    }
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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('jornada-global');
    }

    if (window.offRotaDestino) {
        window.offRotaDestino();
        window.offRotaDestino = null;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refRota = ref(db, 'rota_destino/estado');

    window.offRotaDestino = onValue(refRota, (snapshot) => {
        const dados = snapshot.val() || { km: 0 };
        let kmTotal = Math.min(Number(dados.km || 0), 1300);

        const contador = document.getElementById('km-contador');
        if (contador) {
            contador.innerHTML = `${kmTotal} <span class="hud-max">/ 1300 KM</span>`;
        }

        window.ProgressoAlvoJornada = kmTotal / 1300;
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('jornada-global', () => {
            if (window.offRotaDestino) {
                window.offRotaDestino();
                window.offRotaDestino = null;
            }
        });
    }
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



// ==========================================
// A NONA RELÍQUIA: O PONTO ZERO (GPS DETECTOR - VERSÃO DE LANÇAMENTO)
// ==========================================
window.gpsWatcher = null;

window.inicializarEpicentro = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('epicentro');
    }

    if (window.offEpicentroParceiro) {
        window.offEpicentroParceiro();
        window.offEpicentroParceiro = null;
    }

    if (window.gpsWatcher !== undefined && window.gpsWatcher !== null) {
        navigator.geolocation.clearWatch(window.gpsWatcher);
        window.gpsWatcher = null;
    }

    const painelBloqueado = document.getElementById('epicentro-bloqueado');
    const painelDesbloqueado = document.getElementById('epicentro-desbloqueado');
    const txtDistancia = document.getElementById('distancia-epicentro');
    const pontoRadar = document.getElementById('ponto-alvo-radar');

    if (localStorage.getItem('epicentro_destravado') === 'sim') {
        if (painelBloqueado) painelBloqueado.classList.add('escondido');
        if (painelDesbloqueado) painelDesbloqueado.classList.remove('escondido');
        return;
    }

    if (!window.SantuarioApp || !window.MEU_NOME || !window.NOME_PARCEIRO) {
        if (txtDistancia) txtDistancia.innerText = "Nuvem Offline";
        return;
    }

    const { db, ref, set, onValue } = window.SantuarioApp.modulos;
    const meuGpsRef = ref(db, `gps/${window.MEU_NOME.toLowerCase()}`);
    const parceiroGpsRef = ref(db, `gps/${window.NOME_PARCEIRO.toLowerCase()}`);

    let parceiroLat = null;
    let parceiroLon = null;
    let minhaLat = null;
    let minhaLon = null;

    window.offEpicentroParceiro = onValue(parceiroGpsRef, (snap) => {
        const dados = snap.val();
        if (dados) {
            parceiroLat = dados.lat;
            parceiroLon = dados.lon;
            calcularColisao();
        }
    });

    if (navigator.geolocation) {
        window.gpsWatcher = navigator.geolocation.watchPosition((pos) => {
            minhaLat = pos.coords.latitude;
            minhaLon = pos.coords.longitude;

            set(meuGpsRef, { lat: minhaLat, lon: minhaLon, timestamp: Date.now() });
            calcularColisao();
        }, () => {
            if (txtDistancia) txtDistancia.innerText = "GPS Recusado";
        }, {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        });
    } else {
        if (txtDistancia) txtDistancia.innerText = "Satélite Indisponível";
    }

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('epicentro', () => {
            if (window.offEpicentroParceiro) {
                window.offEpicentroParceiro();
                window.offEpicentroParceiro = null;
            }

            if (window.gpsWatcher !== undefined && window.gpsWatcher !== null) {
                navigator.geolocation.clearWatch(window.gpsWatcher);
                window.gpsWatcher = null;
            }
        });
    }

    function calcularColisao() {
        if (
            parceiroLat == null || parceiroLon == null ||
            minhaLat == null || minhaLon == null
        ) {
            if (txtDistancia && !txtDistancia.innerText.includes("KM") && !txtDistancia.innerText.includes("M")) {
                txtDistancia.innerText = "Aguardando Alvo...";
            }
            return;
        }

        const R = 6371;
        const dLat = (parceiroLat - minhaLat) * (Math.PI / 180);
        const dLon = (parceiroLon - minhaLon) * (Math.PI / 180);

        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(minhaLat * (Math.PI / 180)) * Math.cos(parceiroLat * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distanciaMetros = (R * c) * 1000;

        if (pontoRadar) {
            let raioVisual = Math.min(distanciaMetros / 100000, 1) * 45;
            let anguloRad = Date.now() / 1000;
            let posX = 50 + (Math.cos(anguloRad) * raioVisual);
            let posY = 50 + (Math.sin(anguloRad) * raioVisual);
            pontoRadar.style.left = `${posX}%`;
            pontoRadar.style.top = `${posY}%`;
        }

        if (distanciaMetros <= 15) {
            if (txtDistancia) txtDistancia.innerText = "0.00 M";

            if (window.gpsWatcher !== null) {
                navigator.geolocation.clearWatch(window.gpsWatcher);
                window.gpsWatcher = null;
            }

            desbloquearEpicentro();
        } else {
            if (distanciaMetros > 1000) {
                if (txtDistancia) txtDistancia.innerText = (distanciaMetros / 1000).toFixed(1) + " KM";
            } else {
                if (txtDistancia) txtDistancia.innerText = distanciaMetros.toFixed(0) + " M";
            }
        }
    }

    function desbloquearEpicentro() {
        localStorage.setItem('epicentro_destravado', 'sim');

        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.clearModule('epicentro');
        }

        if (painelBloqueado) painelBloqueado.classList.add('escondido');

        if (painelDesbloqueado) {
            painelDesbloqueado.classList.remove('escondido');

            if (window.Haptics && navigator.vibrate) {
                navigator.vibrate([300, 100, 300, 100, 500, 200, 800]);
            }

            if (typeof confetti === 'function') {
                confetti({
                    colors: ['#D4AF37', '#ffffff'],
                    particleCount: 300,
                    spread: 200,
                    gravity: 1.5,
                    zIndex: 10000
                });
            }

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
    const container = document.getElementById('container-paradoxo');

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('paradoxo');
    }

    if (window.onParadoxoOrientation) {
        window.removeEventListener('deviceorientation', window.onParadoxoOrientation, true);
        window.onParadoxoOrientation = null;
    }

    const analisarInclinacao = (event) => {
        if (!container || container.classList.contains('escondido')) return;

        let beta = event.beta;
        let gamma = event.gamma;

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

    window.onParadoxoOrientation = analisarInclinacao;
    window.addEventListener('deviceorientation', window.onParadoxoOrientation, true);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('paradoxo', () => {
            if (window.onParadoxoOrientation) {
                window.removeEventListener('deviceorientation', window.onParadoxoOrientation, true);
                window.onParadoxoOrientation = null;
            }
        });
    }
};

window.fecharParadoxoTelaCheia = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('paradoxo');
    }
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
        if (window.safePlayMedia) {
            window.safePlayMedia(audioJogos);
        } else {
            audioJogos.play().catch(() => {});
        }
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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('sono-global');
    }

    if (window.offSonoParceira) {
        window.offSonoParceira();
        window.offSonoParceira = null;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refSonoDela = ref(db, `estado_sono/${window.NOME_PARCEIRO.toLowerCase()}`);

    window.offSonoParceira = onValue(refSonoDela, (snapshot) => {
        const dados = snapshot.val();
        window.estadoSonoDela = dados && dados.dormindo ? true : false;
        atualizarPainelSonoHome(dados);
        atualizarCenaSono3D();
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('sono-global', () => {
            if (window.offSonoParceira) {
                window.offSonoParceira();
                window.offSonoParceira = null;
            }
        });
    }
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
        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.clearModule('modo-sono');
        }

        loopRelogioSono = setInterval(() => {
            const mins = Math.floor((Date.now() - tempoStart) / 60000);
            const hrs = Math.floor(mins / 60);
            const m = mins % 60;
            if (txtTempo) txtTempo.innerText = `EM REPOUSO PROFUNDO: ${hrs}H ${m}M`;
        }, 60000);

        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.addInterval('modo-sono', loopRelogioSono);
        }
        if(txtTempo) txtTempo.innerText = `EM REPOUSO PROFUNDO: 0H 0M`;

        atualizarCenaSono3D();

    } else {
        if(window.Haptics) window.Haptics.sucesso();
        liberarTela();
        
        document.body.classList.remove('modo-jogo-ativo');
        tela.classList.add('escondido');
        orbeMeu.classList.remove('anim-respirar');
        if(audioLoFi) audioLoFi.pause();
        if (window.SantuarioRuntime) {
            window.SantuarioRuntime.clearModule('modo-sono');
        }
        if (loopRelogioSono) loopRelogioSono = null;
        
        if(typeof window.playAudioJogos === 'function') window.playAudioJogos();
    }
    
    atualizarPainelSonoHome();
};

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

function limparSingularidadeLocal() {
    if (singularidadeLoop) {
        cancelAnimationFrame(singularidadeLoop);
        singularidadeLoop = null;
    }

    if (listenerSingularidade) {
        listenerSingularidade();
        listenerSingularidade = null;
    }

    const canvas = document.getElementById('canvas-calor');
    if (canvas) {
        canvas.onmousedown = null;
        canvas.onmousemove = null;
        canvas.onmouseup = null;
        canvas.onmouseleave = null;
        canvas.ontouchstart = null;
        canvas.ontouchmove = null;
        canvas.ontouchend = null;
        canvas.ontouchcancel = null;
    }

    if (window.SantuarioApp && window.SantuarioApp.modulos) {
        const { db, set, ref } = window.SantuarioApp.modulos;
        const minhaChave = window.souJoao ? 'joao' : 'thamiris';
        set(ref(db, `singularidade_ativa/${minhaChave}`), { x: -100, y: -100, ativo: false });
    }

    meuRastro = [];
    rastroDela = [];
}

// Anexa a função diretamente no window para garantir que o HTML sempre a encontre
window.iniciarToqueFantasma = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('singularidade');
    }

    limparSingularidadeLocal();

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

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('singularidade', () => {
            limparSingularidadeLocal();
        });
    }
};

window.fecharToqueFantasma = function() {
    const container = document.getElementById('container-fantasma');
    if (container) {
        container.classList.add('escondido');
        container.style.display = 'none';
    }

    document.body.classList.remove('modo-jogo-ativo');

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('singularidade');
    } else {
        limparSingularidadeLocal();
    }

    if (typeof window.playAudioJogos === 'function') {
        window.playAudioJogos();
    }
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
    if (!window.SantuarioApp || !window.SantuarioApp.modulos || !window.MEU_NOME) return;

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('mandados-global');
    }

    if (window.offMandados) {
        window.offMandados();
        window.offMandados = null;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const takeover = document.getElementById('takeover-mandado');
    if (!takeover) return;

    const refMandado = ref(db, 'tribunal/mandado_alvo');

    window.offMandados = onValue(refMandado, (snapshot) => {
        const alvo = snapshot.val();

        if (alvo === window.MEU_NOME.toLowerCase()) {
            document.getElementById('nome-reu-mandado').innerText = window.MEU_NOME;
            document.getElementById('nome-autor-mandado').innerText = window.NOME_PARCEIRO;
            takeover.classList.remove('takeover-escondido');

            if (window.Haptics && window.Haptics.erro) {
                navigator.vibrate([100, 100, 100, 100, 400]);
            }
        } else {
            takeover.classList.add('takeover-escondido');
        }
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('mandados-global', () => {
            if (window.offMandados) {
                window.offMandados();
                window.offMandados = null;
            }
        });
    }
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
const somCoracaoGrave = new Audio('./assets/sons/coracao.mp3');
somCoracaoGrave.volume = 1.0;
somCoracaoGrave.preload = 'auto';

window.audioAlertaEmergencia = window.audioAlertaEmergencia || new Audio('assets/alerta.mp3');
window.audioAlertaEmergencia.preload = 'auto';

window.overlayPulsoCoracao = null;

window.dispararEfeitoCoracao = function(elementoCoracao) {
    if (!window.SantuarioSomPausado) {
        somCoracaoGrave.currentTime = 0;
        if (window.safePlayMedia) {
            window.safePlayMedia(somCoracaoGrave);
        } else {
            somCoracaoGrave.play().catch(() => {});
        }
    }

    if (elementoCoracao) {
        elementoCoracao.style.transform = "scale(1.4)";
        setTimeout(() => { elementoCoracao.style.transform = "scale(1)"; }, 150);
    }

    if (!window.overlayPulsoCoracao) {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.backgroundColor = 'rgba(255, 0, 50, 0.15)';
        overlay.style.zIndex = '9999999';
        overlay.style.pointerEvents = 'none';
        overlay.style.transition = 'opacity 0.3s ease-out';
        overlay.style.opacity = '0';
        document.body.appendChild(overlay);
        window.overlayPulsoCoracao = overlay;
    }

    const overlay = window.overlayPulsoCoracao;
    overlay.style.opacity = '1';

    if (window.Haptics) window.Haptics.toqueForte();

    setTimeout(() => {
        overlay.style.opacity = '0';
    }, 50);
};

// ----------------------------------------------------------------------------
// VARIÁVEIS DE CONTROLE DO GRAVADOR
let gravandoEco = false;
let temposBatidas = [];
let inicioGravacao = 0;
let padraoVibracaoParaEnviar = [];
let radarEcoAtivo = null;
let listenersRadarEcoLigados = false;

function removerListenersRadarEco() {
    if (!radarEcoAtivo) {
        radarEcoAtivo = document.getElementById('radar-tátil');
    }

    if (!radarEcoAtivo || !listenersRadarEcoLigados) return;

    radarEcoAtivo.removeEventListener('touchstart', registrarBatida);
    radarEcoAtivo.removeEventListener('mousedown', registrarBatida);
    listenersRadarEcoLigados = false;
}

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
    if (overlay) overlay.classList.add('takeover-escondido');

    gravandoEco = false;
    removerListenersRadarEco();
};

window.iniciarGravacaoEco = function() {
    gravandoEco = true;
    temposBatidas = [];
    inicioGravacao = Date.now();

    document.getElementById('btn-iniciar-eco').classList.add('escondido');
    document.getElementById('btn-parar-eco').classList.remove('escondido');
    document.getElementById('instrucao-eco').innerText = "Gravando... Bata na área central.";

    const radar = document.getElementById('radar-tátil');
    if (!radar) return;

    removerListenersRadarEco();

    radarEcoAtivo = radar;
    radarEcoAtivo.addEventListener('touchstart', registrarBatida, { passive: false });
    radarEcoAtivo.addEventListener('mousedown', registrarBatida);
    listenersRadarEcoLigados = true;
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

window.pararEEnviarEco = async function() {
    gravandoEco = false;
    removerListenersRadarEco();

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

    if (!window.SantuarioApp || !window.NOME_PARCEIRO) return;

    const { db, ref, set } = window.SantuarioApp.modulos;
    const chaveParceiro = window.souJoao ? 'thamiris' : 'joao';
    const caminho = `eco_santuario/${chaveParceiro}`;
    
    const payload = {
        autor: window.MEU_NOME || (window.souJoao ? 'João' : 'Thamiris'),
        padrao: padraoVibracaoParaEnviar,
        timestamp: Date.now()
    };

    // 🚨 A MÁGICA DA OTIMIZAÇÃO DE RESILIÊNCIA
    if (!navigator.onLine) {
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
            // 🤖 ANDROID / EDGE / CHROME: Background Sync Nativo e Invisível
            try {
                const idb = await new Promise((resolve, reject) => {
                    const req = indexedDB.open('SantuarioOfflineDB', 1);
                    req.onupgradeneeded = e => {
                        const banco = e.target.result;
                        if (!banco.objectStoreNames.contains('fila_ecos')) {
                            banco.createObjectStore('fila_ecos', { keyPath: 'id', autoIncrement: true });
                        }
                    };
                    req.onsuccess = e => resolve(e.target.result);
                    req.onerror = e => reject(e.target.error);
                });

                const tx = idb.transaction('fila_ecos', 'readwrite');
                tx.objectStore('fila_ecos').add({ chaveParceiro, payload });

                const swRegistration = await navigator.serviceWorker.ready;
                await swRegistration.sync.register('sincronizar-ecos');

                if(typeof mostrarToast === 'function') mostrarToast("Sem sinal! O Eco voará assim que a rede voltar.", "📡");
            } catch (e) {
                console.error("Background Sync falhou", e);
            }
        } else {
            // 🍎 iPHONE / SAFARI: O "Fallback de Ouro"
            localStorage.setItem('eco_pendente_offline', JSON.stringify({ chaveParceiro, payload }));
            if(typeof mostrarToast === 'function') mostrarToast("Sem sinal! Eco blindado na memória do iPhone.", "📡");
        }
        
        if (window.Haptics) window.Haptics.toqueForte();
        window.fecharSalaEco();
        return;
    }

    // Fluxo Online Normal (Sinal 100%)
    set(ref(db, caminho), payload).then(() => {
        if(typeof mostrarToast === 'function') mostrarToast("Eco enviado pelo espaço-tempo!", "🚀");
        if (window.Haptics) window.Haptics.sucesso();
        window.fecharSalaEco();
    }).catch(erro => {
        if(typeof mostrarToast === 'function') mostrarToast("Falha na antena. Tente novamente.", "❌");
    });
};

// ==========================================
// 🍎 APPLE FALLBACK (RECUPERADOR DE ECOS PERDIDOS)
// ==========================================
window.addEventListener('load', () => {
    // Dá 3 segundos para o Firebase conectar estabilizado antes de atirar
    setTimeout(() => {
        const ecoPendente = localStorage.getItem('eco_pendente_offline');
        if (ecoPendente && navigator.onLine) {
            try {
                const dados = JSON.parse(ecoPendente);
                if (window.SantuarioApp && window.SantuarioApp.modulos) {
                    const { db, ref, set } = window.SantuarioApp.modulos;
                    set(ref(db, `eco_santuario/${dados.chaveParceiro}`), dados.payload)
                    .then(() => {
                        localStorage.removeItem('eco_pendente_offline');
                        if(typeof mostrarToast === 'function') mostrarToast("Um Eco atrasado acabou de encontrar o caminho!", "🚀");
                    });
                }
            } catch (e) {}
        }
    }, 3000);
});

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
// 🎰 PONTES DE CARREGAMENTO SOB DEMANDA (CASSINO AFETO E CASSINO A DOIS)
// ============================================================================

// Ponte 1: Cassino do Afeto (Mesas Solo)
window.abrirMesaCassino = async function(nomeDoJogo) {
    const roteadorFantasma = window.abrirMesaCassino;
    if(typeof mostrarToast === 'function') mostrarToast("Arrumando a mesa...", "🃏");

    const carregado = await window.injetarModuloJS('cassino');
    if (!carregado) {
        if(typeof mostrarToast === 'function') mostrarToast("Falha ao acessar os jogos.", "❌");
        return;
    }

    if (window.CassinoAudio && typeof window.CassinoAudio.carregarTudo === 'function') {
        window.CassinoAudio.carregarTudo();
    }
};

// Ponte 2: Cassino a Dois
window.abrirCassinoDois = async function() {
    const carregado = await window.injetarModuloJS('cassino');
    if (!carregado) {
        if(typeof mostrarToast === 'function') mostrarToast("Falha ao carregar as mesas do Cassino.", "❌");
        return;
    }

    if (window.CassinoAudio && typeof window.CassinoAudio.carregarTudo === 'function') {
        window.CassinoAudio.carregarTudo();
    }

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
// 🎛️ ESTÚDIO DE ÁUDIO VIP DO CASSINO (BLINDAGEM ABSOLUTA)
// ============================================================================

window.CassinoAudio = {
    ativo: false,
    
    // 🚨 A ARMADILHA FANTASMA: Em vez de carregar a música aqui, criamos um tocador falso.
    // Se o arquivo cassino.js tentar tocar a música velha, ele vai tocar o silêncio absoluto!
    bgm: {
        play: function() { return Promise.resolve(); },
        pause: function() {},
        currentTime: 0,
        volume: 0,
        loop: true
    },
    
    links: {
        // Seus sons personalizados originais:
        fichaAdd: './assets/sons/cassino/aposta.mp3', 
        fichaSub: './assets/sons/cassino/aposta.mp3', 
        erro: './assets/sons/cassino/perder.mp3',
        minesStart: './assets/sons/cassino/mines/comecar.mp3', 
        minesDiamante: './assets/sons/cassino/mines/diamante.mp3', 
        minesBomba: './assets/sons/cassino/mines/bomba.mp3', 
        minesSaque: './assets/sons/cassino/mines/retirar.mp3',
        slotsStart: './assets/sons/cassino/slots/comecar.mp3', 
        slotsPlin: './assets/sons/cassino/slots/slots.mp3',  
        slotsWin: './assets/sons/cassino/slots/ganhar.mp3',  
        slotsLose: './assets/sons/cassino/slots/perder.mp3',      
        bjCard: './assets/sons/cassino/blackjack/comecar.mp3', 
        bjStart: './assets/sons/cassino/blackjack/comecar.mp3', 
        bjWin: './assets/sons/cassino/blackjack/blackjack.mp3', 
        bjLose: './assets/sons/cassino/blackjack/perder.mp3', 
        bjBust: './assets/sons/cassino/blackjack/estourou.mp3', 
        bjBlackjack: './assets/sons/cassino/blackjack/blackjack.mp3', 
        bjPush: './assets/sons/cassino/blackjack/empate.mp3', 
        crashStart: './assets/sons/cassino/aviator/foguete.mp3', 
        crashBoom: './assets/sons/cassino/mines/bomba.mp3',  
        crashCashout: './assets/sons/cassino/mines/retirar.mp3', 
        roletaSpin: './assets/sons/cassino/roleta/roleta.mp3', 
        plinkoDrop: './assets/sons/cassino/plinko/comecar.mp3', 
        plinkoHit: './assets/sons/cassino/plinko/toque.mp3',   
        raspando: './assets/sons/cassino/raspadinha/raspar.mp3', 
        diceRoll: './assets/sons/cassino/dados/dados.mp3', 
    },
    
    sonsProntos: {},
    carregado: false,

    carregarTudo: function() {
        if (this.carregado) return;

        for (let chave in this.links) {
            const audio = new Audio(this.links[chave]);
            audio.preload = 'metadata';
            this.sonsProntos[chave] = audio;
        }

        this.carregado = true;
        console.log("Estúdio carregado sob demanda.");
    },

    // 🚨 Redirecionamos os comandos antigos para o nosso novo Maestro
    tocarBGM: function() {
        if(typeof window.gerenciarMusicaVegas === 'function') window.gerenciarMusicaVegas('play');
    },

    pausarBGM: function() {
        if(typeof window.gerenciarMusicaVegas === 'function') window.gerenciarMusicaVegas('stop');
    },

    tocar: function(nomeSom, volume = 1.0) {
        if (!this.ativo || !this.sonsProntos[nomeSom]) return;
        try {
            let sfx = this.sonsProntos[nomeSom];
            if (sfx.readyState === 0) sfx.load();
            let clone = sfx.cloneNode();
            clone.volume = volume;
            let playPromise = clone.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => { console.log("iOS bloqueou o SFX"); });
            }
        } catch(e) {
            console.error("Erro no sfx:", e);
        }
    }
};

// ============================================================================
// 🛍️ MOTOR DA BOUTIQUE VIP E LOOTBOXES (ECONOMIA INFLACIONADA)
// ============================================================================

// ==========================================
// MOTOR DE ECONOMIA ESPELHADA (BOUTIQUE VIP)
// ==========================================
window.gastosBoutique = { 'João': 0, 'Thamiris': 0 };

window.iniciarEconomiaBoutique = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    if (window.offBoutiqueGastos) return;

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    window.offBoutiqueGastos = onValue(ref(db, 'jogos/boutique_gastos'), (snapshot) => {
        if (snapshot.exists()) {
            window.gastosBoutique = snapshot.val();
        } else {
            window.gastosBoutique = { 'João': 0, 'Thamiris': 0 };
        }
        
        const overlay = document.getElementById('overlay-boutique');
        if (overlay && overlay.style.display === 'flex') {
            if (typeof renderizarBoutique === 'function') renderizarBoutique();
        }
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('boutique-economia', () => {
            if (window.offBoutiqueGastos) {
                window.offBoutiqueGastos();
                window.offBoutiqueGastos = null;
            }
        });
    }
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
    
    let precoLootbox = 120000; 
    let btnLootbox = (meuSaldoIndividual >= precoLootbox) ? 
        `<button class="btn-comprar-boutique" onclick="comprarLootbox(${precoLootbox})">ABRIR A CAIXA (120K)</button>` : 
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
    if (window.Haptics) window.Haptics.toqueLeve();
    
    if (typeof mostrarToast === 'function') mostrarToast("Sincronizando Livro de Ouro...", "📖");

    if (!window.SantuarioApp || !window.SantuarioApp.modulos) {
        if (typeof mostrarToast === 'function') mostrarToast("Erro de conexão com o satélite.", "❌");
        return;
    }
    
    const { db, ref, onValue } = window.SantuarioApp.modulos;

    if (window.offChecklistBoutique) {
        window.offChecklistBoutique();
        window.offChecklistBoutique = null;
    }
    
    window.offChecklistBoutique = onValue(ref(db, 'jogos/boutique_pedidos'), (snapshot) => {
        try {
            const dados = snapshot.exists() ? snapshot.val() : {};
            if (typeof window.renderizarModalChecklist === 'function') {
                window.renderizarModalChecklist(dados);
            }
        } catch (erro) {
            console.error("Erro ao renderizar checklist:", erro);
        }
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('checklist-boutique', () => {
            if (window.offChecklistBoutique) {
                window.offChecklistBoutique();
                window.offChecklistBoutique = null;
            }
        });
    }
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

            <button class="btn-acao" onclick="fecharChecklistBoutique()" style="width: 100%; margin-top: 25px; background: #333; color: white;">Fechar Livro 📖</button>
        </div>
    `;
    modal.style.display = 'flex';
    modal.classList.remove('escondido');
};

window.fecharChecklistBoutique = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('checklist-boutique');
    } else if (window.offChecklistBoutique) {
        window.offChecklistBoutique();
        window.offChecklistBoutique = null;
    }

    const modal = document.getElementById('modal-checklist-boutique');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('escondido');
    }
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


// ==========================================
// MOTOR DE SINCRONIA DE DIGITAÇÃO (TYPING)
// ==========================================
let typingTimer;
const TYPING_DELAY = 3000; // Tempo para sumir após parar de digitar
window.inputPostitTypingLigado = window.inputPostitTypingLigado || false;

window.avisarDigitando = function(estahDigitando) {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    const euId = window.souJoao ? 'joao' : 'thamiris';
    set(ref(db, `typing_status/${euId}`), {
        isTyping: estahDigitando,
        timestamp: Date.now()
    });
};

// Listener para o input do Mural de Recados
const inputPostit = document.getElementById('input-postit');
if (inputPostit && !window.inputPostitTypingLigado) {
    inputPostit.addEventListener('input', () => {
        window.avisarDigitando(true);
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => window.avisarDigitando(false), TYPING_DELAY);
    });

    window.inputPostitTypingLigado = true;
}


window.renderizarEstanteReliquias = function() {
    const prateleira = document.getElementById('prateleira-trofeus');
    const dica = document.getElementById('proxima-reliquia-dica');
    if (!prateleira) return;

    // Pega o High Score Oficial do Casal
    const moedasAtuais = window.pontosDoCasal || 0;
    let htmlTrofeus = '';
    let proxima = null;

    // 🚨 A MÁGICA: Renderizamos TODOS os marcos, criando a estante completa!
    RELIQUIAS_MARCOS.forEach(rel => {
        if (moedasAtuais >= rel.marco) {
            // TROFÉU DESBLOQUEADO (Dourado, flutuando, nome exposto)
            htmlTrofeus += `
                <div class="trofeu-pedestal desbloqueado">
                    <div class="trofeu-icone">${rel.emoji}</div>
                    <div class="trofeu-nome">${rel.nome}</div>
                </div>
            `;
        } else {
            // TROFÉU BLOQUEADO (Cinza, misterioso, com cadeado)
            if (!proxima) proxima = rel; // Salva o primeiro bloqueado para dar a dica embaixo
            htmlTrofeus += `
                <div class="trofeu-pedestal bloqueado">
                    <div class="trofeu-icone">${rel.emoji}</div>
                    <div class="trofeu-nome">MISTÉRIO</div>
                </div>
            `;
        }
    });

    prateleira.innerHTML = htmlTrofeus;

    // Atualiza o rodapé dizendo quanto falta para destrancar a próxima
    if (proxima && dica) {
        let faltam = proxima.marco - moedasAtuais;
        dica.innerHTML = `Próximo Tesouro: <b style="color: #D4AF37;">${proxima.nome}</b> (Faltam ${faltam.toLocaleString('pt-BR')} 💰)`;
    } else if (dica) {
        dica.innerHTML = `🏆 Majestoso! Vocês materializaram todos os tesouros do Santuário!`;
    }
};

document.addEventListener('santuario:saldo-atualizado', () => {
    if (typeof window.renderizarEstanteReliquias === 'function') {
        window.renderizarEstanteReliquias();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.renderizarEstanteReliquias === 'function') {
        window.renderizarEstanteReliquias();
    }
});


// ==========================================
// 🫀 SENSOR DE PRESENÇA QUÂNTICA (AURA)
// ==========================================
window.iniciarSensorDePresenca = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('presenca-global');
    }

    if (window.offPresencaConexao) {
        window.offPresencaConexao();
        window.offPresencaConexao = null;
    }

    if (window.offPresencaParceiro) {
        window.offPresencaParceiro();
        window.offPresencaParceiro = null;
    }

    const { db, ref, onValue, set, onDisconnect } = window.SantuarioApp.modulos;

    const euId = window.souJoao ? 'joao' : 'thamiris';
    const parceiroId = window.souJoao ? 'thamiris' : 'joao';

    const minhaRef = ref(db, `presenca_online/${euId}`);
    const parceiroRef = ref(db, `presenca_online/${parceiroId}`);
    const conexaoRef = ref(db, '.info/connected');

    window.offPresencaConexao = onValue(conexaoRef, (snap) => {
        if (snap.val() === true) {
            set(minhaRef, true);
            onDisconnect(minhaRef).set(false);
        }
    });

    window.offPresencaParceiro = onValue(parceiroRef, (snap) => {
        const parceiroOnline = !!snap.val();
        const aura = document.getElementById('aura-conexao-global');

        if (parceiroOnline) {
            if (aura) aura.className = 'aura-presenca-ativa';

            if (window.parceiroPresencaAnterior !== true) {
                if (typeof mostrarToast === 'function') {
                    mostrarToast(`Sua alma gêmea acaba de entrar no Santuário...`, "🫀");
                }
                if (window.Haptics) window.Haptics.toqueForte();
            }
        } else {
            if (aura) aura.className = 'escondido';
        }

        window.parceiroPresencaAnterior = parceiroOnline;
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('presenca-global', () => {
            if (window.offPresencaConexao) {
                window.offPresencaConexao();
                window.offPresencaConexao = null;
            }

            if (window.offPresencaParceiro) {
                window.offPresencaParceiro();
                window.offPresencaParceiro = null;
            }
        });
    }
};

// ==========================================
// 🔔 MOTOR DE NOTIFICAÇÕES PUSH NATIVAS
// ==========================================
window.ativarNotificacoesApple = async function() {
    // 1. Pede a permissão oficial do sistema operacional
    const permissao = await Notification.requestPermission();
    
    if (permissao === 'granted') {
        if(typeof mostrarToast === 'function') mostrarToast("Sincronizando com os satélites...", "📡");
        
        try {
            if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
            const { messaging, getToken, db, ref, set } = window.SantuarioApp.modulos;
            
            // 2. Pega o endereço único do celular (Token)
            const tokenAtual = await getToken(messaging, { 
                vapidKey: 'BMfoiE5OUoxMK970zucUsdMO-X6zPX36rmOwlTKPEp8JTzDZzGbwqm097kQKd_508hZORw-B3AwKC6gRxm5iMjg' // <--- COLE SUA CHAVE AQUI
            });
            
            if (tokenAtual) {
                // 3. Salva no Firebase para o Backend saber para onde atirar
                const euId = window.souJoao ? 'joao' : 'thamiris';
                await set(ref(db, `fcmTokens/${euId}`), tokenAtual);
                
                // Muda o botão visualmente para mostrar que deu certo
                const btn = document.getElementById('btn-ativar-notificacoes');
                if (btn) {
                    btn.innerHTML = '✨ Alertas Sincronizados';
                    btn.style.background = 'rgba(46, 204, 113, 0.2)';
                    btn.style.borderColor = '#2ecc71';
                    btn.style.color = '#2ecc71';
                }
                
                if(typeof mostrarToast === 'function') mostrarToast("Conexão estabelecida! O Santuário agora pode te chamar.", "🔔");
                if (window.Haptics) window.Haptics.sucesso();
            }
        } catch (erro) {
            console.error("Erro ao gerar token Push:", erro);
            if(typeof mostrarToast === 'function') mostrarToast("Falha ao sincronizar. Tente novamente.", "❌");
        }
    } else {
        if(typeof mostrarToast === 'function') mostrarToast("Você precisa permitir as notificações no navegador.", "⚠️");
    }
};

// ==========================================
// 🌌 RADAR QUÂNTICO (GEOFENCING DE REENCONTRO)
// ==========================================

// Fórmula matemática para calcular a distância em metros entre dois pontos GPS na Terra
function calcularDistanciaMetros(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Raio da Terra em metros
    const rad = Math.PI / 180;
    const φ1 = lat1 * rad;
    const φ2 = lat2 * rad;
    const Δφ = (lat2 - lat1) * rad;
    const Δλ = (lon2 - lon1) * rad;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c);
}

window.iniciarRadarGeofencing = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('radargeo-global');
    }

    if (window.offRadarGeoParceiro) {
        window.offRadarGeoParceiro();
        window.offRadarGeoParceiro = null;
    }

    if (window.loopRadarGeo) {
        clearInterval(window.loopRadarGeo);
        window.loopRadarGeo = null;
    }

    const { db, ref, set, onValue } = window.SantuarioApp.modulos;

    const euId = window.souJoao ? 'joao' : 'thamiris';
    const parceiroId = window.souJoao ? 'thamiris' : 'joao';

    let minhaUltimaLat = null;
    let minhaUltimaLon = null;

    const atualizarMinhaPosicao = () => {
        if (!("geolocation" in navigator)) return;

        navigator.geolocation.getCurrentPosition((position) => {
            minhaUltimaLat = position.coords.latitude;
            minhaUltimaLon = position.coords.longitude;

            set(ref(db, `gps/${euId}`), {
                lat: minhaUltimaLat,
                lon: minhaUltimaLon,
                timestamp: Date.now()
            });
        }, () => {
            console.warn("Radar Quântico: GPS indisponível neste momento.");
        }, {
            enableHighAccuracy: false,
            maximumAge: 120000,
            timeout: 12000
        });
    };

    atualizarMinhaPosicao();

    window.loopRadarGeo = setInterval(atualizarMinhaPosicao, 90000);
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addInterval('radargeo-global', window.loopRadarGeo);
    }

    window.offRadarGeoParceiro = onValue(ref(db, `gps/${parceiroId}`), (snapshot) => {
        const gpsParceiro = snapshot.val();

        if (gpsParceiro && minhaUltimaLat != null && minhaUltimaLon != null) {
            if (Date.now() - gpsParceiro.timestamp > 3600000) return;

            const distanciaMetros = calcularDistanciaMetros(
                minhaUltimaLat,
                minhaUltimaLon,
                gpsParceiro.lat,
                gpsParceiro.lon
            );

            console.log(`[Radar Quântico] Distância atual: ${distanciaMetros} metros.`);

            if (distanciaMetros <= 50) {
                const telaReencontro = document.getElementById('tela-reencontro');
                if (telaReencontro && !telaReencontro.classList.contains('revelado')) {
                    telaReencontro.classList.add('revelado');

                    if (window.Haptics) navigator.vibrate([200, 100, 200, 100, 500]);

                    if (typeof confetti === 'function') {
                        confetti({
                            colors: ['#D4AF37', '#ffffff', '#ffd700'],
                            particleCount: 300,
                            spread: 180,
                            zIndex: 999999999
                        });
                    }
                }
            }
        }
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('radargeo-global', () => {
            if (window.offRadarGeoParceiro) {
                window.offRadarGeoParceiro();
                window.offRadarGeoParceiro = null;
            }

            if (window.loopRadarGeo) {
                clearInterval(window.loopRadarGeo);
                window.loopRadarGeo = null;
            }
        });
    }
};

// =======================================================
// 💾 MOTOR UNIVERSAL DE AUTO-SAVE (PROGRESSO NA NUVEM)
// =======================================================

// 1. Função que SALVA o jogo na nuvem no exato milissegundo em que você passa de nível
window.salvarProgressoJogo = function(nomeDoJogo, dadosDoProgresso) {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    
    // Descobre se é o João ou a Thamiris jogando
    const euId = window.souJoao ? 'joao' : 'thamiris';
    
    // Grava no Firebase em um cofre específico para aquele jogo
    set(ref(db, `progresso_jogos/${euId}/${nomeDoJogo}`), dadosDoProgresso)
        .catch(erro => console.error(`Erro ao salvar o jogo ${nomeDoJogo}:`, erro));
};

// 2. Função que CARREGA o jogo da nuvem assim que a tela é aberta
window.carregarProgressoJogo = function(nomeDoJogo, callback) {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) {
        callback(null); // Se o banco não conectou, devolve vazio
        return;
    }
    
    const { db, ref, get } = window.SantuarioApp.modulos;
    const euId = window.souJoao ? 'joao' : 'thamiris';
    
    const jogoRef = ref(db, `progresso_jogos/${euId}/${nomeDoJogo}`);
    
    // Busca a informação no banco de dados
    get(jogoRef).then((snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val()); // Devolve o nível e os pontos salvos!
        } else {
            callback(null); // Nunca jogou, pode começar do nível 1
        }
    }).catch(erro => {
        console.error(`Erro ao carregar o jogo ${nomeDoJogo}:`, erro);
        callback(null);
    });
};

// ============================================================================
// 🎵 MAESTRO MUSICAL E RESTAURAÇÃO DE EFEITOS (SFX)
// ============================================================================

// 2. O MAESTRO DA MÚSICA DO CASSINO (Sem conflito e sem som baixo)
window.gerenciarMusicaVegas = function(acao) {
    const audioAmbiente = document.getElementById('audio-ambiente');
    
    // Muta a música antiga do Howler (se existir) para não dar choque de áudio e som abafado
    if (window.CassinoAudio && window.CassinoAudio.fundo) {
        window.CassinoAudio.fundo.volume(0); 
    }

    // O nosso tocador infalível para o cassino.mp3
    let audioVegas = document.getElementById('audio-vegas-definitivo');
    if (!audioVegas) {
        audioVegas = document.createElement('audio');
        audioVegas.id = 'audio-vegas-definitivo';
        audioVegas.src = './assets/sons/cassino/cassino.mp3';
        audioVegas.loop = true;
        audioVegas.volume = 0.5;
        document.body.appendChild(audioVegas);
    }

    if (acao === 'play') {
        if (audioAmbiente) audioAmbiente.pause();

        if (window.safePlayMedia) {
            window.safePlayMedia(audioVegas);
        } else {
            audioVegas.play().catch(() => {});
        }
    } else if (acao === 'stop') {
        audioVegas.pause(); // Para a música do Cassino
        audioVegas.currentTime = 0;
        if (audioAmbiente && !window.SantuarioSomPausado) {
            audioAmbiente.play().catch(e => e); // Retorna a música do Santuário
        }
    }
};

// ============================================================================
// 💎 BOUTIQUE VIP E MESAS DE CASSINO (As 3 Portas de Entrada)
// ============================================================================
window.abrirBoutique = function() {
    if (window.CassinoAudio && typeof window.CassinoAudio.carregarTudo === 'function') {
        window.CassinoAudio.carregarTudo();
    }


    // ==========================================
    // SEU CÓDIGO ORIGINAL CONTINUA INTACTO ABAIXO
    // ==========================================
    const overlay = document.getElementById('overlay-boutique');
    if (overlay) {
        overlay.classList.remove('escondido');
        overlay.style.display = 'flex';
        if (typeof iniciarEconomiaBoutique === 'function') iniciarEconomiaBoutique();
        if (typeof renderizarBoutique === 'function') renderizarBoutique();
    }
    window.gerenciarMusicaVegas('play'); 
};

window.fecharBoutique = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('boutique-economia');
    }
    const overlay = document.getElementById('overlay-boutique');
    if (overlay) overlay.style.display = 'none';
    window.gerenciarMusicaVegas('stop');
};

window.fecharMesaCassino = function(nomeDoJogo) {
    const overlay = document.getElementById('overlay-' + nomeDoJogo) || document.getElementById('mesa-' + nomeDoJogo);
    if (overlay) {
        overlay.style.display = 'none';
        overlay.classList.add('escondido');
    }
    window.gerenciarMusicaVegas('stop');
};

// ============================================================================
// 🎒 MOTOR DO INVENTÁRIO GLOBAL (A MOCHILA DO CASAL)
// ============================================================================

window.inventarioCasal = {
    morangos: 0, cenouras: 0, trigos: 0,
    girassois: 0, rosas: 0, orquideas: 0,
    gotas_orvalho: 0, raca_pet: 0
};

// Dicionário Visual do Inventário Premium
window.dicionarioInventario = {
    morangos: { emoji: '🍓', nome: 'Morangos', cor: '#e74c3c' },
    cenouras: { emoji: '🥕', nome: 'Cenouras', cor: '#e67e22' },
    trigos: { emoji: '🌾', nome: 'Trigo', cor: '#f1c40f' },
    girassois: { emoji: '🌻', nome: 'Girassóis', cor: '#f39c12' },
    rosas: { emoji: '🌹', nome: 'Rosas', cor: '#ff4757' },
    orquideas: { emoji: '🌸', nome: 'Orquídeas', cor: '#9b59b6' },
    gotas_orvalho: { emoji: '💧', nome: 'Orvalho', cor: '#3498db' },
    raca_pet: { emoji: '🥩', nome: 'Ração Pet', cor: '#c0392b' }
};

window.iniciarOuvinteInventario = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    if (window.offInventarioCasal) return;

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    
    window.offInventarioCasal = onValue(ref(db, 'recursos/inventario'), (snapshot) => {
        try {
            const data = snapshot.val() || {};
            let inventarioMudou = false;
            
            Object.keys(window.dicionarioInventario).forEach(item => {
                let novoValor = Number(data[item]) || 0;
                if (novoValor > (window.inventarioCasal[item] || 0)) inventarioMudou = true;
                window.inventarioCasal[item] = novoValor;
            });

            window.renderizarInventarioSantuario();

            const alerta = document.getElementById('alerta-novo-item');
            const modal = document.getElementById('modal-inventario-santuario');
            if (inventarioMudou && alerta && modal && modal.classList.contains('escondido')) {
                alerta.classList.remove('escondido');
                if (window.Haptics && navigator.vibrate) navigator.vibrate(30);
            }

        } catch (e) {
            console.error("Erro ao sincronizar inventário:", e);
        }
    });

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addCleanup('inventario-global', () => {
            if (window.offInventarioCasal) {
                window.offInventarioCasal();
                window.offInventarioCasal = null;
            }
        });
    }
};

// 🚨 A INJEÇÃO DE INICIALIZAÇÃO INVISÍVEL
window.addEventListener('loginSucesso', () => {
    if (typeof window.iniciarOuvinteInventario === 'function') window.iniciarOuvinteInventario();
});
if (window.usuarioLogado) {
    if (typeof window.iniciarOuvinteInventario === 'function') window.iniciarOuvinteInventario();
}

window.abrirInventarioSantuario = function() {
    const modal = document.getElementById('modal-inventario-santuario');
    const alerta = document.getElementById('alerta-novo-item');
    if (modal) {
        modal.classList.remove('escondido');
        modal.style.display = 'flex';
        // Limpa a notificação ao abrir
        if (alerta) alerta.classList.add('escondido');
        if (window.Haptics && navigator.vibrate) navigator.vibrate(20);
    }
};

window.fecharInventarioSantuario = function() {
    const modal = document.getElementById('modal-inventario-santuario');
    if (modal) {
        modal.classList.add('escondido');
        setTimeout(() => modal.style.display = 'none', 300); 
    }
};

window.renderizarInventarioSantuario = function() {
    const grid = document.getElementById('grid-inventario-casal');
    if (!grid) return;
    
    grid.innerHTML = '';
    let temItem = false;

    Object.keys(window.dicionarioInventario).forEach(chave => {
        let quantidade = window.inventarioCasal[chave] || 0;
        let info = window.dicionarioInventario[chave];

        if (quantidade > 0) {
            temItem = true;
            grid.innerHTML += `
                <div style="background: rgba(0,0,0,0.6); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 15px 5px; display: flex; flex-direction: column; align-items: center; position: relative; box-shadow: inset 0 0 15px rgba(0,0,0,0.8);">
                    <div style="font-size: 2.5rem; filter: drop-shadow(0 5px 5px rgba(0,0,0,0.5)); transform: translateY(-5px);">${info.emoji}</div>
                    <div style="color: #ccc; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1px; text-align: center; margin-top: 5px; min-height: 20px; display: flex; align-items: center; justify-content: center;">${info.nome}</div>
                    
                    <div style="position: absolute; top: -5px; right: -5px; background: ${info.cor}; border: 2px solid #000; color: #fff; font-size: 0.75rem; font-weight: 900; font-family: monospace; width: 22px; height: 22px; border-radius: 50%; display: flex; justify-content: center; align-items: center; box-shadow: 0 0 10px ${info.cor};">
                        ${quantidade}
                    </div>
                </div>
            `;
        }
    });

    if (!temItem) {
        grid.style.display = "flex";
        grid.style.justifyContent = "center";
        grid.innerHTML = `
            <div style="text-align: center; color: #555; padding: 30px; font-family: monospace; letter-spacing: 1px;">
                <div style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;">🕸️</div>
                A despensa está vazia.<br>Plantem na Estufa ou na Fazenda.
            </div>
        `;
    } else {
        grid.style.display = "grid";
    }
};

// 🚨 FUNÇÃO GLOBAL PARA ADICIONAR ITENS (Será usada pelos outros jogos)
window.adicionarItemInventario = async function(chaveItem, quantidadeAdicional) {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, get, update } = window.SantuarioApp.modulos;
    
    try {
        const snap = await get(ref(db, `recursos/inventario/${chaveItem}`));
        let quantAtual = snap.val() || 0;
        let up = {};
        up[`recursos/inventario/${chaveItem}`] = quantAtual + quantidadeAdicional;
        await update(ref(db), up);
        // O onValue se encarrega de atualizar a tela na mesma hora nos dois celulares!
    } catch (e) { console.error("Erro ao adicionar item:", e); }
};

window.iniciarListenersGlobaisUltra = function(forcarReinicio = false) {
    if (forcarReinicio && window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('sono-global');
        window.SantuarioRuntime.clearModule('jornada-global');
        window.SantuarioRuntime.clearModule('mandados-global');
        window.SantuarioRuntime.clearModule('presenca-global');
        window.SantuarioRuntime.clearModule('radargeo-global');
        window.SantuarioRuntime.clearModule('eco-global');
    }

    if (window.listenersGlobaisUltraAtivos && !forcarReinicio) return;
    window.listenersGlobaisUltraAtivos = true;

    if (typeof window.escutarEstadoSono === 'function') window.escutarEstadoSono();
    if (typeof window.escutarRotaDestino === 'function') window.escutarRotaDestino();
    if (typeof window.vigiarMandados === 'function') window.vigiarMandados();
    if (typeof window.iniciarSensorDePresenca === 'function') window.iniciarSensorDePresenca();
    if (typeof window.iniciarRadarGeofencing === 'function') window.iniciarRadarGeofencing();
    if (typeof window.escutarEcosDoParceiro === 'function') window.escutarEcosDoParceiro();
};

window.addEventListener('loginSucesso', () => {
    window.listenersGlobaisUltraAtivos = false;

    const timerGlobaisUltra = setTimeout(() => {
        window.iniciarListenersGlobaisUltra(true);
    }, 1500);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addTimeout('boot', timerGlobaisUltra);
    }
});

if (window.usuarioLogado && !window.listenersGlobaisUltraAtivos) {
    const timerGlobaisUltraJaLogado = setTimeout(() => {
        window.iniciarListenersGlobaisUltra();
    }, 1500);

    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.addTimeout('boot', timerGlobaisUltraJaLogado);
    }
}