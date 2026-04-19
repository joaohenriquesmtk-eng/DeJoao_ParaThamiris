// ============================================================================
// O VEREDITO CULINÁRIO (MOTOR RETINA, FÍSICA INERCIAL E QUEBRA DE LINHA)
// ============================================================================

window.estadoRoleta = {
    opcoes: [], // Será preenchido pelo Firebase
    girando: false,
    rotacaoAtual: 0,
    // Paleta de Alta Saturação (Cassino)
    paletaCores: ['#c0392b', '#2c3e50', '#e67e22', '#8e44ad', '#d35400', '#2980b9']
};

window.roletaOffOpcoes = null;
window.roletaAudioCatraca = null;
window.roletaAudioVitoria = null;

window.inicializarRoleta = function() {
    if (window.SantuarioRuntime) {
        window.SantuarioRuntime.clearModule('roleta');
    }

    if (!window.roletaAudioCatraca) {
        window.roletaAudioCatraca = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        window.roletaAudioCatraca.volume = 0.5;
    }

    if (!window.roletaAudioVitoria) {
        window.roletaAudioVitoria = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        window.roletaAudioVitoria.volume = 1.0;
    }

    window.escutarOpcoesRoleta();

    const txtVencedor = document.getElementById('texto-vencedor-roleta');
    if (txtVencedor) {
        txtVencedor.classList.remove('revelacao-ativa');
        txtVencedor.innerText = "AGUARDANDO SINAL";
    }
};

window.toggleInstrucoesRoleta = function() {
    const inst = document.getElementById('instrucoes-roleta');
    if (inst) inst.classList.toggle('escondido');
};

// --- SINCRONIZAÇÃO FIREBASE COM "ZERO VERDE" ---
window.escutarOpcoesRoleta = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) {
        window.desenharCanvasRetina();
        window.renderizarFichasComida();
        return;
    }

    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refOpcoes = ref(db, 'utilitarios/roleta_comidas');

    window.roletaOffOpcoes = onValue(refOpcoes, (snapshot) => {
        const dados = snapshot.val();
        let opcoesNuvem = [];

        if (dados && Array.isArray(dados)) {
            opcoesNuvem = dados;
        } else if (dados) {
            opcoesNuvem = Object.values(dados);
        } else {
            opcoesNuvem = ["Pizza 🍕", "Sushi 🍣", "Hambúrguer 🍔"];
        }

        window.estadoRoleta.opcoes = ["Voucher Especial 💚", ...opcoesNuvem];

        window.renderizarFichasComida();
        window.desenharCanvasRetina();
    });

    if (window.SantuarioRuntime && window.roletaOffOpcoes) {
        window.SantuarioRuntime.addCleanup('roleta', window.roletaOffOpcoes);
    }
};

window.salvarOpcoesNoFirebase = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const opcoesLimpo = window.estadoRoleta.opcoes.filter(o => o !== "Voucher Especial 💚");
    const { db, ref, set } = window.SantuarioApp.modulos;
    set(ref(db, 'utilitarios/roleta_comidas'), opcoesLimpo);
};

// --- GESTÃO DE FICHAS ---
window.adicionarComidaRoleta = function() {
    if (window.estadoRoleta.girando) return;
    const input = document.getElementById('input-nova-comida');
    const valor = input.value.trim();
    
    if (!valor) return;
    if (window.estadoRoleta.opcoes.length >= 12) {
        if(typeof mostrarToast === 'function') mostrarToast("A roda comporta no máximo 12 destinos.", "⚠️");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    window.estadoRoleta.opcoes.push(valor);
    window.salvarOpcoesNoFirebase();
    input.value = "";
    if(window.Haptics) window.Haptics.sucesso();
};

window.removerComidaRoleta = function(index) {
    if (window.estadoRoleta.girando) return;
    
    if (window.estadoRoleta.opcoes[index] === "Voucher Especial 💚") {
        if(typeof mostrarToast === 'function') mostrarToast("O Destino do Afeto não pode ser apagado!", "💚");
        if(window.Haptics) window.Haptics.erro();
        return;
    }

    if (window.estadoRoleta.opcoes.length <= 2) {
        if(typeof mostrarToast === 'function') mostrarToast("A roda precisa de opções.", "⚠️");
        return;
    }
    
    window.estadoRoleta.opcoes.splice(index, 1);
    window.salvarOpcoesNoFirebase();
    if(window.Haptics) window.Haptics.toqueLeve();
};

window.renderizarFichasComida = function() {
    const lista = document.getElementById('lista-comidas-roleta');
    if (!lista) return;
    lista.innerHTML = "";

    window.estadoRoleta.opcoes.forEach((comida, index) => {
        const div = document.createElement('div');
        div.className = 'tag-ficha-ouro';
        
        if (comida === "Voucher Especial 💚") {
            div.style.background = "linear-gradient(145deg, rgba(46, 204, 113, 0.2), rgba(0,0,0,0.8))";
            div.style.borderColor = "#2ecc71";
            div.innerHTML = `<span style="color: #2ecc71; font-weight: bold;">${comida}</span>
                             <button class="btn-remover-ficha" onclick="window.removerComidaRoleta(${index})">🔒</button>`;
        } else {
            div.innerHTML = `<span>${comida}</span>
                             <button class="btn-remover-ficha" onclick="window.removerComidaRoleta(${index})">✖</button>`;
        }
        lista.appendChild(div);
    });
};

// --- MOTOR GRÁFICO (COM QUEBRA DE LINHA INTELIGENTE) ---
window.desenharCanvasRetina = function() {
    const canvas = document.getElementById('canvas-roleta');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const largura = canvas.width;
    const altura = canvas.height;
    const centroX = largura / 2;
    const centroY = altura / 2;
    const raio = centroX - 15; 

    const opcoes = window.estadoRoleta.opcoes;
    const fatias = opcoes.length;
    const arco = (2 * Math.PI) / fatias;

    ctx.clearRect(0, 0, largura, altura);

    for (let i = 0; i < fatias; i++) {
        const anguloInicio = i * arco;
        const anguloFim = (i + 1) * arco;
        
        let corBase = window.estadoRoleta.paletaCores[i % window.estadoRoleta.paletaCores.length];
        if (opcoes[i] === "Voucher Especial 💚") {
            corBase = "#27ae60"; 
        }

        // Pinta a fatia
        ctx.beginPath();
        ctx.moveTo(centroX, centroY);
        ctx.arc(centroX, centroY, raio, anguloInicio, anguloFim);
        ctx.closePath();
        ctx.fillStyle = corBase;
        ctx.fill();

        ctx.lineWidth = 6;
        ctx.strokeStyle = "#D4AF37"; 
        ctx.stroke();

        ctx.save();
        ctx.translate(centroX, centroY);
        ctx.rotate(anguloInicio + arco / 2);
        
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // 🚨 A MÁGICA DA QUEBRA DE LINHA E AJUSTE DE FONTE
        let textoFatia = opcoes[i];
        let linhas = [];
        
        // Regra de separação das palavras
        if (textoFatia === "Voucher Especial 💚") {
            linhas = ["Voucher", "Especial 💚"];
        } else if (textoFatia.length > 11 && textoFatia.includes(" ")) {
            // Se for outra comida longa com espaços (ex: "Macarrão ao Sugo")
            const palavras = textoFatia.split(" ");
            const meio = Math.ceil(palavras.length / 2);
            linhas.push(palavras.slice(0, meio).join(" "));
            linhas.push(palavras.slice(meio).join(" "));
        } else {
            linhas.push(textoFatia); // Uma palavra só ou curtinha
        }

        // Ajusta a fonte dinamicamente
        if (linhas.length > 1) {
            ctx.font = "bold 24px 'Playfair Display', serif"; 
        } else {
            ctx.font = "bold 32px 'Playfair Display', serif"; 
        }
        
        // Desenha as linhas perfeitamente centralizadas
        const alturaLinha = 28; 
        const inicioY = (linhas.length === 1) ? 0 : -((linhas.length - 1) * alturaLinha) / 2;
        
        for(let j = 0; j < linhas.length; j++) {
            ctx.fillText(linhas[j], raio - 40, inicioY + (j * alturaLinha));
        }
        
        ctx.restore();
    }

    // Moldura Dourada Externa
    ctx.beginPath();
    ctx.arc(centroX, centroY, raio, 0, 2 * Math.PI);
    ctx.lineWidth = 20;
    const gradExterno = ctx.createLinearGradient(0, 0, largura, altura);
    gradExterno.addColorStop(0, "#f1c40f");
    gradExterno.addColorStop(0.5, "#d35400");
    gradExterno.addColorStop(1, "#f39c12");
    ctx.strokeStyle = gradExterno;
    ctx.stroke();

    // Núcleo de Ferro
    ctx.beginPath();
    ctx.arc(centroX, centroY, 40, 0, 2 * Math.PI);
    const gradInterno = ctx.createRadialGradient(centroX, centroY, 0, centroX, centroY, 40);
    gradInterno.addColorStop(0, "#ccc");
    gradInterno.addColorStop(1, "#333");
    ctx.fillStyle = gradInterno;
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#111";
    ctx.stroke();
};

// --- A FÍSICA INERCIAL ---
window.iniciarGiroRoleta = function() {
    if (window.estadoRoleta.girando) return;
    if (window.estadoRoleta.opcoes.length < 2) return;

    window.estadoRoleta.girando = true;
    document.getElementById('btn-girar-roleta').disabled = true;
    
    const txtVencedor = document.getElementById('texto-vencedor-roleta');
    txtVencedor.classList.remove('revelacao-ativa');
    txtVencedor.innerText = "CALCULANDO DESTINO...";
    txtVencedor.style.color = "#fff";
    txtVencedor.style.opacity = 1; 

    const canvas = document.getElementById('canvas-roleta');
    
    const girosExtras = Math.floor(Math.random() * 8) + 12; 
    const grauAleatorio = Math.floor(Math.random() * 360);
    const rotacaoFinalAlvo = window.estadoRoleta.rotacaoAtual + (girosExtras * 360) + grauAleatorio;
    
    const tempoGiroMs = 7000; 
    
    canvas.style.transition = `transform ${tempoGiroMs}ms cubic-bezier(0.1, 0.95, 0.15, 1)`;
    canvas.style.transform = `rotate(${rotacaoFinalAlvo}deg)`;

    let tempoAtual = 0;
    let intervaloBase = 20; 
    if (!window.roletaAudioCatraca) {
        window.roletaAudioCatraca = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        window.roletaAudioCatraca.volume = 0.5;
    }

    function tocarCatraca() {
        if (!window.estadoRoleta.girando) return;
        
        if (!window.SantuarioSomPausado) {
            window.roletaAudioCatraca.currentTime = 0;
            if (window.safePlayMedia) {
                window.safePlayMedia(window.roletaAudioCatraca);
            } else {
                window.roletaAudioCatraca.play().catch(() => {});
            }
        }
        
        if (window.Haptics) window.Haptics.toqueLeve();
        
        const agulha = document.querySelector('.roleta-agulha-suprema');
        if(agulha) {
            agulha.classList.add('agulha-tremendo-titan');
            setTimeout(() => agulha.classList.remove('agulha-tremendo-titan'), 40);
        }

        tempoAtual += intervaloBase;
        intervaloBase = 20 + Math.pow(tempoAtual / 450, 2.5); 

        if (tempoAtual < tempoGiroMs - 300) { 
            setTimeout(tocarCatraca, intervaloBase);
        }
    }
    tocarCatraca();

    setTimeout(() => {
        window.estadoRoleta.rotacaoAtual = rotacaoFinalAlvo;
        window.estadoRoleta.girando = false;
        document.getElementById('btn-girar-roleta').disabled = false;

        const opcoes = window.estadoRoleta.opcoes;
        const fatias = opcoes.length;
        const grausPorFatia = 360 / fatias;
        
        const rotEfetiva = rotacaoFinalAlvo % 360; 
        let anguloNoTopo = (360 - rotEfetiva + 270) % 360;
        
        const indiceVencedor = Math.floor(anguloNoTopo / grausPorFatia);
        const vencedor = opcoes[indiceVencedor];

        if (vencedor === "Voucher Especial 💚") {
            txtVencedor.innerHTML = `💚 Mimo Desbloqueado!`;
            txtVencedor.style.color = "#2ecc71";
            if(typeof mostrarToast === 'function') mostrarToast("Você ganhou um voucher romântico surpresa!", "✨");
            if (window.Haptics && window.safeVibrate) window.safeVibrate([300, 100, 300, 100, 500]);
            if(typeof confetti === 'function') confetti({colors: ['#2ecc71', '#D4AF37', '#ffffff'], particleCount: 300, spread: 150, zIndex: 999999, origin: {y: 0.6}});
        } else {
            txtVencedor.innerText = `👑 ${vencedor.toUpperCase()}`;
            if (window.Haptics && window.safeVibrate) window.safeVibrate([200, 100, 200, 100, 600]);
            if(typeof confetti === 'function') confetti({colors: ['#ff4757', '#FFD700', '#ffffff'], particleCount: 300, spread: 150, zIndex: 999999, origin: {y: 0.6}});
        }

        txtVencedor.classList.add('revelacao-ativa');
        
        if (!window.SantuarioSomPausado) {
            if (!window.roletaAudioVitoria) {
                window.roletaAudioVitoria = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
                window.roletaAudioVitoria.volume = 1.0;
            }

            window.roletaAudioVitoria.currentTime = 0;
            if (window.safePlayMedia) {
                window.safePlayMedia(window.roletaAudioVitoria);
            } else {
                window.roletaAudioVitoria.play().catch(() => {});
            }
        }

    }, tempoGiroMs);
};