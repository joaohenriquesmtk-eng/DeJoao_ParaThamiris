// ============================================================================
// O VEREDITO CULINÁRIO (MOTOR RETINA E FÍSICA INERCIAL) - SUPREME TIER
// ============================================================================

window.estadoRoleta = {
    opcoes: ["Pizza 🍕", "Sushi 🍣", "Hambúrguer 🍔"],
    girando: false,
    rotacaoAtual: 0,
    // Paleta de Alta Saturação (Cassino)
    paletaCores: ['#c0392b', '#2c3e50', '#e67e22', '#27ae60', '#8e44ad', '#16a085', '#d35400', '#2980b9']
};

window.inicializarRoleta = function() {
    console.log("Acionando Motor Retina da Roleta...");
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

// --- SINCRONIZAÇÃO FIREBASE ---
window.escutarOpcoesRoleta = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) {
        window.desenharCanvasRetina();
        window.renderizarFichasComida();
        return;
    }
    
    const { db, ref, onValue } = window.SantuarioApp.modulos;
    const refOpcoes = ref(db, 'utilitarios/roleta_comidas');
    
    onValue(refOpcoes, (snapshot) => {
        const dados = snapshot.val();
        if (dados && Array.isArray(dados)) {
            window.estadoRoleta.opcoes = dados;
        } else if (dados) {
            window.estadoRoleta.opcoes = Object.values(dados);
        } else {
            window.estadoRoleta.opcoes = ["Pizza 🍕", "Sushi 🍣", "Hambúrguer 🍔", "Churrasco 🥩"];
        }
        
        window.renderizarFichasComida();
        window.desenharCanvasRetina();
    });
};

window.salvarOpcoesNoFirebase = function() {
    if (!window.SantuarioApp || !window.SantuarioApp.modulos) return;
    const { db, ref, set } = window.SantuarioApp.modulos;
    set(ref(db, 'utilitarios/roleta_comidas'), window.estadoRoleta.opcoes);
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
    if (window.estadoRoleta.opcoes.length <= 2) {
        if(typeof mostrarToast === 'function') mostrarToast("A roda não pode girar com menos de 2 opções.", "⚠️");
        if(window.Haptics) window.Haptics.erro();
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
        div.innerHTML = `
            <span>${comida}</span>
            <button class="btn-remover-ficha" onclick="window.removerComidaRoleta(${index})">✖</button>
        `;
        lista.appendChild(div);
    });
};

// --- MOTOR GRÁFICO (CANVAS RETINA) ---
window.desenharCanvasRetina = function() {
    const canvas = document.getElementById('canvas-roleta');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // O Canvas físico tem 680px (Alta resolução), desenhamos baseados nisso.
    const largura = canvas.width;
    const altura = canvas.height;
    const centroX = largura / 2;
    const centroY = altura / 2;
    // O raio da pizza é ligeiramente menor que o canvas para caber a borda grossa
    const raio = centroX - 15; 

    const opcoes = window.estadoRoleta.opcoes;
    const fatias = opcoes.length;
    const arco = (2 * Math.PI) / fatias;

    ctx.clearRect(0, 0, largura, altura);

    for (let i = 0; i < fatias; i++) {
        const anguloInicio = i * arco;
        const anguloFim = (i + 1) * arco;
        const corBase = window.estadoRoleta.paletaCores[i % window.estadoRoleta.paletaCores.length];

        // 1. A Fatia
        ctx.beginPath();
        ctx.moveTo(centroX, centroY);
        ctx.arc(centroX, centroY, raio, anguloInicio, anguloFim);
        ctx.closePath();
        ctx.fillStyle = corBase;
        ctx.fill();

        // Linhas Douradas separadoras
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#D4AF37"; 
        ctx.stroke();

        // 2. O Texto Retina
        ctx.save();
        ctx.translate(centroX, centroY);
        ctx.rotate(anguloInicio + arco / 2);
        
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#FFFFFF";
        // Fonte gigante pois o canvas é 680px (encolherá via CSS mantendo a nitidez)
        ctx.font = "bold 36px 'Playfair Display', serif"; 
        
        // Sombra profunda para destacar no metal
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        ctx.fillText(opcoes[i], raio - 40, 0);
        ctx.restore();
    }

    // 3. O Bezel Metálico Externo (Aro de Ouro)
    ctx.beginPath();
    ctx.arc(centroX, centroY, raio, 0, 2 * Math.PI);
    ctx.lineWidth = 20;
    // Gradiente Dourado para o aro externo
    const gradExterno = ctx.createLinearGradient(0, 0, largura, altura);
    gradExterno.addColorStop(0, "#f1c40f");
    gradExterno.addColorStop(0.5, "#d35400");
    gradExterno.addColorStop(1, "#f39c12");
    ctx.strokeStyle = gradExterno;
    ctx.stroke();

    // 4. O Eixo de Aço Central
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
    txtVencedor.style.opacity = 1; // Deixa visível a mensagem de suspense

    const canvas = document.getElementById('canvas-roleta');
    
    // Aumentamos a violência do giro para o nível Supreme: 8 a 15 voltas completas
    const girosExtras = Math.floor(Math.random() * 8) + 8; 
    const grauAleatorio = Math.floor(Math.random() * 360);
    const rotacaoFinalAlvo = window.estadoRoleta.rotacaoAtual + (girosExtras * 360) + grauAleatorio;
    
    const tempoGiroMs = 6000; // O giro dura 6 segundos cravados (mais suspense)
    
    canvas.style.transition = `transform ${tempoGiroMs}ms cubic-bezier(0.1, 0.85, 0.15, 1)`;
    canvas.style.transform = `rotate(${rotacaoFinalAlvo}deg)`;

    // Lógica da Catraca Desacelerando (Simulação Inercial)
    let tempoAtual = 0;
    let intervaloBase = 30; // Começa clicando muito rápido
    const somCatraca = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    somCatraca.volume = 0.4;

    function tocarCatraca() {
        if (!window.estadoRoleta.girando) return;
        
        somCatraca.currentTime = 0;
        somCatraca.play().catch(e=>{});
        
        if (window.Haptics) navigator.vibrate(15);
        
        const agulha = document.querySelector('.roleta-agulha-suprema');
        if(agulha) {
            agulha.classList.add('agulha-tremendo-titan');
            setTimeout(() => agulha.classList.remove('agulha-tremendo-titan'), 50);
        }

        tempoAtual += intervaloBase;
        // O intervalo aumenta exponencialmente conforme o tempo passa (desaceleração)
        intervaloBase = 30 + Math.pow(tempoAtual / 400, 2); 

        if (tempoAtual < tempoGiroMs - 200) { // Para de tocar 200ms antes pra dar o silêncio dramático final
            setTimeout(tocarCatraca, intervaloBase);
        }
    }
    tocarCatraca();

    // A REVELAÇÃO DO VENCEDOR
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

        txtVencedor.innerText = `👑 ${vencedor.toUpperCase()}`;
        txtVencedor.classList.add('revelacao-ativa');

        if(window.Haptics) navigator.vibrate([200, 100, 200, 100, 600]);
        if(typeof confetti === 'function') confetti({colors: ['#ff4757', '#FFD700', '#ffffff'], particleCount: 300, spread: 150, zIndex: 999999, origin: {y: 0.6}});
        
        const winSom = new Audio('https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3');
        winSom.volume = 1.0; winSom.play().catch(e=>{});

    }, tempoGiroMs);
};