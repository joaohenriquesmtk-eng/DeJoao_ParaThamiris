const { onValueCreated, onValueUpdated } = require('firebase-functions/v2/database');
const { onSchedule } = require('firebase-functions/v2/scheduler');
const admin = require('firebase-admin');
const moment = require('moment-timezone');

admin.initializeApp();

// --- Função 1: enviarNotificacaoMood ---
exports.enviarNotificacaoMood = onValueCreated(
    '/moods/{userId}',
    async (event) => {
        const snapshot = event.data;
        const mood = snapshot.val();
        const remetenteId = event.params.userId; // Quem mudou o humor

        // Define quem vai RECEBER a notificação
        const destinatarioId = (remetenteId === 'joao') ? 'thamiris' : 'joao';
        const nomeRemetente = (remetenteId === 'joao') ? 'João' : 'Thamiris';

        // Busca o token de quem vai receber
        const snapshotToken = await admin.database().ref(`/fcmTokens/${destinatarioId}`).once('value');
        const tokenDestino = snapshotToken.val();

        if (!tokenDestino) {
            console.log(`Token de ${destinatarioId} não encontrado.`);
            return;
        }

        const estado = mood.estado;
        let titulo = `🌪️ Alerta de Cuidado: ${nomeRemetente}`;
        let corpo = `${nomeRemetente} está se sentindo ${estado}.`;

        // Personalização rápida das mensagens
        if (estado === 'ansiosa' || estado === 'ansioso') {
            corpo = `A mente de ${nomeRemetente} está acelerada. Mande um carinho.`;
        } else if (estado === 'triste') {
            corpo = `${nomeRemetente} não está bem. Que tal uma mensagem agora?`;
        }

        const message = {
            notification: { title: titulo, body: corpo },
            android: { priority: 'high' },
            token: tokenDestino
        };

        return admin.messaging().send(message);
    }
);

// --- Função 2: gerarMetasDiarias ---
exports.gerarMetasDiarias = onSchedule(
    {
        schedule: '0 3 * * *',
        timeZone: 'America/Sao_Paulo',
    },
    async (event) => {
        const db = admin.database();
        const hoje = moment().tz('America/Sao_Paulo').format('YYYY-MM-DD');

        const metasPossiveis = [
            { descricao: 'Plante 5 🌽', tipo: 'plantar', cultura: 'milho', quantidade: 5, recompensa: 50 },
            { descricao: 'Colha 10 🥕', tipo: 'colher', cultura: 'cenoura', quantidade: 10, recompensa: 80 },
            { descricao: 'Compre 3 animais 🐔', tipo: 'comprarAnimal', quantidade: 3, recompensa: 100 },
            { descricao: 'Alimente animais 5 vezes', tipo: 'alimentar', quantidade: 5, recompensa: 60 },
            { descricao: 'Venda 8 itens', tipo: 'vender', quantidade: 8, recompensa: 70 },
            { descricao: 'Plante 3 🍓', tipo: 'plantar', cultura: 'morango', quantidade: 3, recompensa: 40 },
        ];

        const usuarios = ['joao', 'thamiris'];
        for (const usuario of usuarios) {
            const metasSelecionadas = metasPossiveis
                .sort(() => 0.5 - Math.random())
                .slice(0, 2)
                .map((meta, index) => ({
                    [`meta${index}`]: {
                        descricao: meta.descricao,
                        tipo: meta.tipo,
                        cultura: meta.cultura || null,
                        total: meta.quantidade,
                        progresso: 0,
                        completo: false,
                        recompensa: meta.recompensa,
                    }
                }));

            const metasObjeto = Object.assign({}, ...metasSelecionadas);
            await db.ref(`metasDiarias/${hoje}/${usuario}`).set(metasObjeto);
        }

        await db.ref('metasDiarias/ultimaGeracao').set(Date.now());
        console.log(`Metas diárias geradas para ${hoje}`);
        return null;
    }
);

// --- Função 3: verificarConquistas ---
exports.verificarConquistas = onValueUpdated(
    {
        ref: '/jogadores/{userId}/estatisticas',
        region: 'us-central1',
    },
    async (event) => {
        const before = event.data.before.val() || {};
        const after = event.data.after.val() || {};
        const userId = event.params.userId;

        const conquistas = [
            { id: 'primeiraColheita', nome: 'Primeira Colheita', condicao: (est) => (est.totalColheitas || 0) >= 1 },
            { id: 'mestreMilho', nome: 'Mestre Milho', condicao: (est) => (est.milhosColhidos || 0) >= 100 },
            { id: 'jardineiroDedicado', nome: 'Jardineiro Dedicado', condicao: (est) => (est.totalPlantios || 0) >= 50 },
            { id: 'amigoDosAnimais', nome: 'Amigo dos Animais', condicao: (est) => (est.totalAnimais || 0) >= 10 },
        ];

        const db = admin.database();
        for (const conquista of conquistas) {
            const atingiuAgora = conquista.condicao(after);
            const jaTinha = conquista.condicao(before);
            if (atingiuAgora && !jaTinha) {
                await db.ref(`conquistas/${userId}/${conquista.id}`).set({
                    desbloqueada: true,
                    data: Date.now()
                });
            }
        }
    }
);

// --- Função 4: atualizarClima ---
exports.atualizarClima = onSchedule(
    {
        schedule: '0 3 * * *',
        timeZone: 'America/Sao_Paulo',
    },
    async (event) => {
        const db = admin.database();
        const climas = ['ensolarado', 'nublado', 'chuvoso', 'seco'];
        const climaSorteado = climas[Math.floor(Math.random() * climas.length)];
        await db.ref('clima').set(climaSorteado);
        console.log(`🌤️ Clima atualizado para: ${climaSorteado}`);
        return null;
    }
);

// --- Função 5: atualizarPrecosPorOferta ---
exports.atualizarPrecosPorOferta = onSchedule(
    {
        schedule: '0 3 * * *',
        timeZone: 'America/Sao_Paulo',
    },
    async (event) => {
        const db = admin.database();
        const sementes = ['milho', 'cenoura', 'tomate', 'abóbora', 'morango', 'alface', 'girassol', 'batata'];
        const precosRef = db.ref('precosMercado');
        const vendasRef = db.ref('vendas');

        const snapshotVendas = await vendasRef.once('value');
        const vendas = snapshotVendas.val() || {};

        const novosPrecos = {};
        for (const s of sementes) {
            const qtdVendida = vendas[s] || 0;
            let preco = 20 - qtdVendida * 0.5;
            preco = Math.max(5, Math.min(40, Math.round(preco)));
            novosPrecos[s] = preco;
        }

        await precosRef.set(novosPrecos);
        await vendasRef.set({});

        console.log('💰 Preços atualizados com base nas vendas:', novosPrecos);
        return null;
    }
);