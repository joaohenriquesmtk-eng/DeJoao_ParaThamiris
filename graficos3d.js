// ==========================================
// MOTOR DE OTIMIZAÇÃO (RADAR 3D)
// ==========================================
window.RadarDePerformance = {
    elementosVisiveis: new Set(),
    
    iniciar: () => {
        // Observa se os componentes pesados estão na tela
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    window.RadarDePerformance.elementosVisiveis.add(entry.target.id);
                } else {
                    window.RadarDePerformance.elementosVisiveis.delete(entry.target.id);
                }
            });
        }, { threshold: 0.05 });

        // Componentes que exigem GPU pesada
        const pesados = ['orbe-clima-3d', 'bussola-3d', 'carrossel-3d', 'globo-3d', 'eco-3d', 'coracao-3d', 'prisma-3d', 'planetario-3d-container'];
        pesados.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
    },

    // Retorna true APENAS se a aba atual está aberta E se o elemento rolou pra tela
    podeAnimar: (id) => {
        return window.RadarDePerformance.elementosVisiveis.has(id);
    }
};

// Liga o radar assim que o app avisa que o 3D foi injetado
window.addEventListener('motor3DPronto', () => window.RadarDePerformance.iniciar());


// ==========================================
    // UI/UX NÍVEL DEUS: O GLOBO 3D (BLINDADO CONTRA CRASH)
    // ==========================================
    
    window.inicializarGlobo3D = () => {
        const container = document.getElementById('globo-3d');
        // Previne duplicação e garante que não criaremos canvas sobre canvas
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas') || container.querySelector('.orbe-css-fallback')) return;

        // PROTEÇÃO VITAL: Se a tela carregar muito rápido e a div estiver com tamanho "zero", usamos um tamanho seguro (evita crash do Chrome no celular)
        let largura = container.clientWidth || (window.innerWidth - 40);
        let altura = container.clientHeight || 250;

        try {
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(45, largura / altura, 0.1, 1000);
            
            // Usamos "default" no Globo para não competir com a energia dos outros 3Ds pesados do app
            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "default" }); 
            
            // Se o Chrome tentar dar "Carinha Triste", nós abortamos o processo antes e não fechamos o App!
            renderer.domElement.addEventListener("webglcontextlost", function(event) {
                event.preventDefault();
                ativarFundoCSSDourado(container);
            }, false);

            renderer.setSize(largura, altura);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.2)); // Resolução ainda mais leve para a esfera
            renderer.domElement.style.display = 'block';
            renderer.domElement.style.margin = '0 auto';
            container.appendChild(renderer.domElement);

            const raioTerra = 5;
            // OTIMIZAÇÃO: 24x24 tem visual idêntico a 32x32 em tela pequena, mas usa 50% menos memória
            const geometriaTerra = new THREE.SphereGeometry(raioTerra, 24, 24);
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

            // Cidades
            const geometriaCidade = new THREE.SphereGeometry(0.15, 12, 12);
            const materialCidade = new THREE.MeshBasicMaterial({ color: 0xffffff });
            
            const pontoColombo = new THREE.Mesh(geometriaCidade, materialCidade);
            pontoColombo.position.copy(posColombo);
            sistemaGlobal.add(pontoColombo);

            const pontoGoiania = new THREE.Mesh(geometriaCidade, materialCidade);
            pontoGoiania.position.copy(posGoiania);
            sistemaGlobal.add(pontoGoiania);

            // Fio de luz entre as cidades
            const pontoMedio = posColombo.clone().lerp(posGoiania, 0.5);
            pontoMedio.normalize().multiplyScalar(raioTerra + 1.5); 
            const curva = new THREE.QuadraticBezierCurve3(posColombo, pontoMedio, posGoiania);
            const geometriaCurva = new THREE.BufferGeometry().setFromPoints(curva.getPoints(30));
            const materialCurva = new THREE.LineBasicMaterial({ color: 0xff6b6b, linewidth: 1 });
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
                if (window.SantuarioAtivo === false) return;
                if (!window.RadarDePerformance.podeAnimar('globo-3d')) return;
                if (!globoVisivel) return;
                sistemaGlobal.rotation.y += 0.005;
                renderer.render(scene, camera);
            };

            window.addEventListener('resize', () => {
                if(container.clientWidth > 0 && container.clientHeight > 0) {
                    renderer.setSize(container.clientWidth, container.clientHeight);
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                }
            });
            animar();

        } catch (erroFatal) {
            console.error("GPU rejeitou o Globo. Acionando Plano B visual.", erroFatal);
            ativarFundoCSSDourado(container);
        }
    };

    // A Mágica da Degradação Graciosa: Se faltar RAM, o app não quebra, ele mostra uma arte linda em CSS.
    function ativarFundoCSSDourado(container) {
        container.innerHTML = "";
        container.innerHTML = `
            <div class="orbe-css-fallback" style="
                width: 140px; height: 140px; 
                background: radial-gradient(circle at 30% 30%, rgba(212,175,55,0.4), transparent 70%); 
                border-radius: 50%; border: 1px dashed rgba(212,175,55,0.3);
                animation: respiracaoSantuario 4s infinite alternate; 
                margin: 50px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 30px rgba(212,175,55,0.1);">
                <div style="width: 10px; height: 10px; background: #fff; border-radius: 50%; box-shadow: 0 0 10px #fff, -40px 20px 0 2px #fff; animation: girarAnel 10s linear infinite;"></div>
            </div>`;
    }

    // ==========================================
    // UI/UX NÍVEL DEUS: AS 3 JÓIAS 3D
    // ==========================================

    // --- 1. O CORAÇÃO DE CRISTAL ---
    window.ritmoCoracao = 1;      
    window.corCoracao = 0xff6b6b; 

    // Espera o sistema inteiro carregar antes de interceptar os cliques
    window.addEventListener('motor3DPronto', () => {
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
    });

    window.inicializarCoracao3D = () => {
        const container = document.getElementById('coracao-3d');
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
            if (!window.RadarDePerformance.podeAnimar('coracao-3d')) return;
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


    // --- 3. A GALÁXIA PARTICULAR ---
    window.inicializarGalaxia3D = () => {
        // Busca o fundo da janela modal
        const modais = document.querySelectorAll('#galaxia-3d-fundo');
        const container = modais[modais.length - 1]; 
        
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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

        // Interatividade Real (O Fator UAU)
        let mouseX = 0;
        let mouseY = 0;
        let targetX = 0;
        let targetY = 0;

        const onMove = (event) => {
            const clientX = event.touches ? event.touches[0].clientX : event.clientX;
            const clientY = event.touches ? event.touches[0].clientY : event.clientY;
            // Normaliza a posição do dedo para girar a galáxia
            mouseX = (clientX / window.innerWidth) * 2 - 1;
            mouseY = -(clientY / window.innerHeight) * 2 + 1;
        };

        container.addEventListener('mousemove', onMove);
        container.addEventListener('touchmove', onMove, {passive: true});

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            const elGalaxia = document.getElementById('galaxia-3d-fundo');
            if (!elGalaxia || elGalaxia.clientWidth === 0) return;
            tempo += 0.001;
            
            // Movimento inercial suave
            targetX = mouseX * 1.5;
            targetY = mouseY * 1.5;
            
            // Gira sozinha bem devagar, mas obedece ao dedo do usuário se ele tocar
            galaxy.rotation.y += 0.001 + (targetX - galaxy.rotation.y) * 0.05;
            galaxy.rotation.x += 0.001 + (targetY - galaxy.rotation.x) * 0.05;
            
            renderer.render(scene, camera);
        };
        animar();
    };

// ==========================================
    // UI/UX NÍVEL DEUS: ORBE DA SINCRONIA (APOGEU)
    // ==========================================
    window.inicializarOrbeClima = () => {
        const container = document.getElementById('orbe-clima-3d');
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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

        // 🚨 CORREÇÃO CIRÚRGICA: Lendo o novo formato da Open-Meteo
        if (window.dadosClima && window.dadosClima[window.climaExibido]) {
            const dados = window.dadosClima[window.climaExibido];
            window.mudarClimaOrbe(dados.condicao, dados.eNoite);
        }

        window.addEventListener('resize', () => {
            if(container.clientWidth > 0) {
                renderer.setSize(container.clientWidth, container.clientHeight);
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
            }
        });

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            
            if (!window.RadarDePerformance.podeAnimar('orbe-clima-3d')) return;

            // Trava Nativa e Inquebrável de Hibernação
            const elEco = document.getElementById('orbe-clima-3d');
            if (!elEco || elEco.clientWidth === 0) return;
            
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
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
        camera.position.set(0, 5, 20); camera.lookAt(0, 0, 0);

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
    // UI/UX NÍVEL TITÃ: ECOS DO SANTUÁRIO (ÁUDIO 3D UNIFICADO E CORRIGIDO)
    // ==========================================
    
    // Variáveis Globais do Áudio
    window.ecoAudioContext = null;
    window.ecoAnalyser = null;
    window.ecoDataArray = null;
    window.isEcoAtivo = false; 
    let mediaRecorder;
    let audioChunks = [];
    let audioAtual = new Audio();
    
    window.inicializarEco3D = () => {
        const container = document.getElementById('eco-3d');
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;
        
        // Limpeza profunda para evitar duplicatas caso a tela seja recarregada
        container.innerHTML = "";

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight || 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        camera.position.z = 5;

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

        const positionAttribute = geometry.attributes.position;
        const vertexOriginals = [];
        for (let i = 0; i < positionAttribute.count; i++) {
            vertexOriginals.push(new THREE.Vector3().fromBufferAttribute(positionAttribute, i));
        }

        // 1. CORREÇÃO DA TELA PRETA/INVISÍVEL: O 3D precisa saber quando o modal abre!
        const atualizarTamanhoEco = () => {
            if (container.clientWidth > 0 && container.clientHeight > 0) {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            }
        };
        new ResizeObserver(atualizarTamanhoEco).observe(container);
        atualizarTamanhoEco();

        // 2. CORREÇÃO DO ÁUDIO AMBIENTE: Silenciador Brutal
        let ecoVisivel = false;
        const observerEco = new IntersectionObserver((entries) => { 
            ecoVisivel = entries[0].isIntersecting; 
            
            if (ecoVisivel) {
                // Silencia ABSOLUTAMENTE TUDO no app
                document.querySelectorAll('audio').forEach(a => a.pause());
                if (typeof pauseAudioJogos === 'function') pauseAudioJogos();
                if (typeof pausarAmbiente === 'function') pausarAmbiente();
                window.musicaNossaTocando = true; // Trava o motor de áudio global
            } else {
                // Devolve a música quando fechar o modal
                window.musicaNossaTocando = false; 
                const modal = document.getElementById('modal-reliquia');
                if (modal && modal.classList.contains('escondido')) {
                    if (typeof playAudioJogos === 'function') playAudioJogos();
                    if (typeof tocarAmbiente === 'function') tocarAmbiente();
                }
            }
        });
        observerEco.observe(container);

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            if (!window.RadarDePerformance || !window.RadarDePerformance.podeAnimar('eco-3d')) return;
            if (!ecoVisivel) return;

            tempo += 0.01;
            esferaEco.rotation.y += 0.005;
            esferaEco.rotation.x += 0.002;

            // 3. CORREÇÃO DA DEFORMAÇÃO (Aumentando a Sensibilidade)
            if (window.isEcoAtivo && window.ecoAnalyser && window.ecoDataArray) {
                window.ecoAnalyser.getByteFrequencyData(window.ecoDataArray);
                
                let soma = 0;
                for(let i=0; i < window.ecoDataArray.length; i++) soma += window.ecoDataArray[i];
                let mediaVolume = soma / window.ecoDataArray.length;
                
                material.opacity = 0.3 + (mediaVolume / 255) * 0.7;
                material.color.setHex(mediaVolume > 100 ? 0xffffff : 0xD4AF37); // Fica branco mais fácil

                const positions = geometry.attributes.position;
                for (let i = 0; i < positions.count; i++) {
                    const vertex = vertexOriginals[i].clone();
                    // Aumentei o multiplicador de 0.5 para 2.0 para a esfera pulsar de verdade!
                    const distorcao = 1 + (window.ecoDataArray[i % window.ecoDataArray.length] / 255) * 2.0; 
                    vertex.multiplyScalar(distorcao);
                    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
                }
                positions.needsUpdate = true;
            } else {
                // Respiração suave de descanso
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

        // Feedback Inicial
        if (window.audioCarregado) {
            const btnOuvir = document.getElementById('btn-ouvir-eco');
            const statusLabel = document.getElementById('status-eco');
            if(btnOuvir) btnOuvir.style.display = 'block';
            if (statusLabel) {
                if (window.autorEcoAtual === window.MEU_NOME) {
                    statusLabel.innerText = "Sua voz está ecoando no espaço. 🎵";
                    statusLabel.style.color = "#aaa";
                } else {
                    statusLabel.innerText = `Um eco de ${window.NOME_PARCEIRO} aguarda por você! 🎵`;
                    statusLabel.style.color = "#2ecc71";
                }
            }
        }
    };

// --- FUNÇÕES DE GRAVAÇÃO E PLAYBACK DE ÁUDIO ---

    window.iniciarGravacao = async () => {
        const btnGravar = document.getElementById('btn-gravar-eco');
        const status = document.getElementById('status-eco');
        
        try {
            // Mata qualquer áudio tocando por precaução antes de ouvir o microfone
            document.querySelectorAll('audio').forEach(a => a.pause());

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            window.isEcoAtivo = true;

            // 🚨 A GRANDE CORREÇÃO AQUI (SINGLETON):
            // Cria o contexto APENAS se ele ainda não existir na memória do app.
            if (!window.ecoAudioContext) {
                window.ecoAudioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            // Apenas acorda o contexto se o celular o colocou para dormir
            if (window.ecoAudioContext.state === 'suspended') {
                await window.ecoAudioContext.resume();
            }

            const source = window.ecoAudioContext.createMediaStreamSource(stream);
            window.ecoAnalyser = window.ecoAudioContext.createAnalyser();
            window.ecoAnalyser.fftSize = 64; 
            source.connect(window.ecoAnalyser);
            window.ecoDataArray = new Uint8Array(window.ecoAnalyser.frequencyBinCount);

            let opcoes = {};
            if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
                opcoes = { mimeType: 'audio/webm;codecs=opus' };
            } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
                opcoes = { mimeType: 'audio/mp4' };
            }

            mediaRecorder = new MediaRecorder(stream, opcoes);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };

            mediaRecorder.onstop = () => {
                const tipoReal = mediaRecorder.mimeType || 'audio/mp4';
                const audioBlob = new Blob(audioChunks, { type: tipoReal }); 
                
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64Audio = reader.result;
                    if(window.SantuarioApp && window.SantuarioApp.modulos) {
                        const { db, ref, set } = window.SantuarioApp.modulos;
                        const refEcoDestino = ref(db, 'eco_santuario/frequencia_atual');
                        
                        set(refEcoDestino, {
                            audioBase64: base64Audio,
                            autor: window.MEU_NOME,
                            timestamp: Date.now()
                        }).then(() => {
                            if (status) {
                                status.innerText = "A sua voz viajou pelo espaço-tempo! ✨";
                                status.style.color = "#2ecc71";
                            }
                            if (window.Haptics) window.Haptics.sucesso();
                        }).catch(e => {
                            console.error("Falha no upload espacial:", e);
                            if (status) status.innerText = "Falha no envio da voz.";
                        });
                    }
                };
            };

            mediaRecorder.start();

            if (btnGravar) {
                btnGravar.style.background = "#ff6b6b";
                btnGravar.style.color = "#fff";
                btnGravar.style.transform = "scale(1.2)";
                btnGravar.style.boxShadow = "0 0 15px #ff6b6b";
            }
            if (status) {
                status.innerText = "Gravando sentimentos... (Solte para enviar)";
                status.style.color = "#ff6b6b";
            }

            if(window.Haptics) window.Haptics.toqueForte();

        } catch (err) {
            if (status) status.innerText = "Acesso ao microfone foi negado.";
            if (typeof mostrarToast === 'function') mostrarToast("Permita o microfone no navegador!", "🎙️");
        }
    };

    window.pararGravacao = () => {
        if (mediaRecorder && mediaRecorder.state !== "inactive") {
            const status = document.getElementById('status-eco');
            const btnGravar = document.getElementById('btn-gravar-eco');
            
            if (btnGravar) {
                btnGravar.style.background = "rgba(0,0,0,0.5)";
                btnGravar.style.color = "var(--cor-primaria)";
                btnGravar.style.transform = "scale(1)";
                btnGravar.style.boxShadow = "none";
            }
            if (status) {
                status.innerText = "Sintonizando frequência e enviando...";
                status.style.color = "var(--cor-primaria)";
            }

            window.isEcoAtivo = false; 
            if (mediaRecorder.stream) mediaRecorder.stream.getTracks().forEach(track => track.stop());

            mediaRecorder.stop();
        }
    };

    window.tocarEco = async () => {
        if (!window.audioCarregado) {
            if(typeof mostrarToast === 'function') mostrarToast("Nenhum eco novo para ouvir.", "🌌");
            return;
        }
        
        // Garante absoluto silêncio de outros áudios do site
        document.querySelectorAll('audio').forEach(a => a.pause());

        audioAtual.src = window.audioCarregado;
        
        window.isEcoAtivo = true; 

        // 🚨 PREVINE A CRIAÇÃO DE MÚLTIPLAS PLACAS DE SOM (Mantendo o Singleton)
        if (!window.ecoAudioContext) {
            window.ecoAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (window.ecoAudioContext.state === 'suspended') {
            await window.ecoAudioContext.resume();
        }
        
        window.ecoAnalyser = window.ecoAudioContext.createAnalyser();
        window.ecoAnalyser.fftSize = 64;
        window.ecoDataArray = new Uint8Array(window.ecoAnalyser.frequencyBinCount);

        // Garante que a fonte do áudio atual seja criada APENAS uma vez
        if (!window.sourceAtual) {
            window.sourceAtual = window.ecoAudioContext.createMediaElementSource(audioAtual);
        }
        
        // Limpa conexões passadas e liga os cabos da música direto na esfera!
        window.sourceAtual.disconnect();
        window.sourceAtual.connect(window.ecoAnalyser);
        window.ecoAnalyser.connect(window.ecoAudioContext.destination); 

        const status = document.getElementById('status-eco');
        if (status) {
            if (window.autorEcoAtual === window.MEU_NOME) {
                status.innerText = "Ouvindo o seu próprio Eco...";
            } else {
                status.innerText = `Ouvindo o Eco de ${window.NOME_PARCEIRO}...`;
            }
        }
        
        audioAtual.play().catch(e => console.error("Erro ao dar play no eco:", e));

        audioAtual.onended = () => {
            if (status) {
                status.innerText = window.autorEcoAtual === window.MEU_NOME 
                    ? "Sua voz ecoou." 
                    : "Eco finalizado. O espaço está aberto.";
            }
            window.isEcoAtivo = false; 
        };
    };

// ==========================================
    // UI/UX NÍVEL TITÃ: A BÚSSOLA DO DESTINO (GIROSCÓPIO 3D)
    // ==========================================
    
    window.agulhaBussola = null;
    window.anguloAlvoBussola = 0;
    
    window.inicializarBussola3D = () => {
        const container = document.getElementById('bussola-3d');
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;

        // TRUQUE TITÃ: Fallback de tamanho caso a aba esteja escondida
        let largura = container.clientWidth || (window.innerWidth - 60);
        let altura = container.clientHeight || 200;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, largura / altura, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
        
        renderer.setSize(largura, altura);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.insertBefore(renderer.domElement, container.firstChild);

        camera.position.set(0, 5, 0);
        camera.lookAt(0, 0, 0);

        scene.add(new THREE.AmbientLight(0xffffff, 0.9));
        const luzDirecional = new THREE.DirectionalLight(0xffd700, 1.5);
        luzDirecional.position.set(5, 10, 2);
        scene.add(luzDirecional);

        const anelGeo = new THREE.TorusGeometry(1.5, 0.05, 16, 64);
        const anelMat = new THREE.MeshStandardMaterial({ color: 0xD4AF37, metalness: 0.8, roughness: 0.2 });
        const anel = new THREE.Mesh(anelGeo, anelMat);
        anel.rotation.x = Math.PI / 2;
        scene.add(anel);

        const agulhaGroup = new THREE.Group();
        
        const agulhaNorteGeo = new THREE.ConeGeometry(0.2, 1.4, 4);
        const agulhaNorteMat = new THREE.MeshStandardMaterial({ color: 0xff6b6b, metalness: 0.5, roughness: 0.3 });
        const agulhaNorte = new THREE.Mesh(agulhaNorteGeo, agulhaNorteMat);
        agulhaNorte.position.z = -0.7;
        agulhaNorte.rotation.x = Math.PI / 2;
        agulhaNorte.rotation.y = Math.PI / 4;
        agulhaGroup.add(agulhaNorte);

        const agulhaSulGeo = new THREE.ConeGeometry(0.2, 1.4, 4);
        const agulhaSulMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 });
        const agulhaSul = new THREE.Mesh(agulhaSulGeo, agulhaSulMat);
        agulhaSul.position.z = 0.7;
        agulhaSul.rotation.x = -Math.PI / 2;
        agulhaSul.rotation.y = Math.PI / 4;
        agulhaGroup.add(agulhaSul);

        const eixo = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0xD4AF37 }));
        agulhaGroup.add(eixo);

        scene.add(agulhaGroup);
        window.agulhaBussola = agulhaGroup;

        let bussolaVisivel = false;
        const observerBussola = new IntersectionObserver((entries) => { bussolaVisivel = entries[0].isIntersecting; });
        observerBussola.observe(container);

        let tempo = 0;
        const animar = () => {
            requestAnimationFrame(animar);
            const elBussola = document.getElementById('bussola-3d');
        if (!elBussola || elBussola.clientWidth === 0) return;
            if (!window.RadarDePerformance.podeAnimar('bussola-3d')) return;
            // AUTO-AJUSTE: Se a aba abrir e a div ganhar tamanho real, a câmera se ajusta!
            if (container.clientWidth > 0 && Math.abs(container.clientWidth - largura) > 5) {
                largura = container.clientWidth;
                altura = container.clientHeight || 200;
                camera.aspect = largura / altura;
                camera.updateProjectionMatrix();
                renderer.setSize(largura, altura);
            }

            if (!bussolaVisivel) return;

            tempo += 0.02;
            anel.position.y = Math.sin(tempo) * 0.1;
            agulhaGroup.position.y = Math.sin(tempo) * 0.1;

            if (window.anguloAlvoBussola !== undefined && window.anguloAlvoBussola !== null) {
                let diferenca = window.anguloAlvoBussola - agulhaGroup.rotation.y;
                while (diferenca < -Math.PI) diferenca += Math.PI * 2;
                while (diferenca > Math.PI) diferenca -= Math.PI * 2;
                agulhaGroup.rotation.y += diferenca * 0.05; 
            }

            renderer.render(scene, camera);
        };
        animar();

        // Tira o Esqueleto Cintilante após o motor 3D aquecer e dar o primeiro frame (800ms)
        const esqueletoBussola = document.getElementById('esqueleto-bussola');
        if (esqueletoBussola) {
            setTimeout(() => esqueletoBussola.classList.add('esqueleto-oculto'), 800);
        }
        
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
    // UI/UX NÍVEL TITÃ: CARROSSEL DE HORIZONTES (GALERIA 3D)
    // ==========================================
    
    window.inicializarCarrossel3D = () => {
        const container = document.getElementById('carrossel-3d');
        if (!container || typeof THREE === 'undefined' || container.querySelector('canvas')) return;

        let largura = container.clientWidth || (window.innerWidth - 60);
        let altura = container.clientHeight || 250;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, largura / altura, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
        renderer.setSize(largura, altura);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(renderer.domElement);

        camera.position.set(0, 0, 5);
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

        let isDragging = false, previousX = 0, velocidadeGiro = 0.005;

        const iniciarAoTocar = (e) => {
            isDragging = true;
            const x = e.clientX || (e.touches && e.touches.length > 0 ? e.touches[0].clientX : undefined);
            const y = e.clientY || (e.touches && e.touches.length > 0 ? e.touches[0].clientY : undefined);
            if (x === undefined || y === undefined) return;
            
            previousX = x;
            velocidadeGiro = 0;

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
            const x = e.clientX || (e.touches && e.touches.length > 0 ? e.touches[0].clientX : undefined);
            if (x === undefined) return;
            
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

        if(window.SantuarioApp && window.SantuarioApp.modulos) {
            const { db, ref, onValue } = window.SantuarioApp.modulos;
            onValue(ref(db, 'horizontes/fotos'), (snapshot) => {
                const dados = snapshot.val();
                construirCarrossel(Array.isArray(dados) ? dados : []);

                // O FIREBASE ENTREGOU AS FOTOS! Derrete o Esqueleto Cintilante!
                const esqueletoCarrossel = document.getElementById('esqueleto-carrossel');
                if (esqueletoCarrossel) {
                    setTimeout(() => esqueletoCarrossel.classList.add('esqueleto-oculto'), 600);
                }
            });
        }

        const animar = () => {
            requestAnimationFrame(animar);
            if (!window.RadarDePerformance.podeAnimar('carrossel-3d')) return;
            
            // AUTO-AJUSTE: Garante que o carrossel se ajusta à tela do A55
            if (container.clientWidth > 0 && Math.abs(container.clientWidth - largura) > 5) {
                largura = container.clientWidth;
                altura = container.clientHeight || 250;
                camera.aspect = largura / altura;
                camera.updateProjectionMatrix();
                renderer.setSize(largura, altura);
            }
            
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
        const status = document.getElementById('status-carrossel');
        const btn = document.getElementById('btn-add-foto');

        if (!file) return;

        if(status) {
            status.innerText = "⏳ Compactando foto na memória...";
            status.style.color = "var(--cor-primaria)";
        }
        if(btn) { btn.disabled = true; btn.style.opacity = "0.5"; }

        if (!window.SantuarioApp || !window.SantuarioApp.modulos) {
            if(status) { status.innerText = "❌ Erro: Santuário offline."; status.style.color = "#ff6b6b"; }
            if(btn) { btn.disabled = false; btn.style.opacity = "1"; }
            return;
        }

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
                const base64 = canvas.toDataURL('image/jpeg', 0.6);
                
                if(status) status.innerText = "🚀 Transmitindo para o horizonte...";

                const { db, ref, get, set } = window.SantuarioApp.modulos;
                const r = ref(db, 'horizontes/fotos');
                
                get(r).then(s => {
                    let f = s.val() || [];
                    f.push(base64);
                    if(f.length > 8) f.shift(); 
                    return set(r, f);
                }).then(() => {
                    if(status) {
                        status.innerText = "✅ Visão compartilhada com sucesso!";
                        status.style.color = "#2ecc71";
                        setTimeout(() => { status.innerText = ""; status.style.color = "var(--cor-primaria)"; }, 4000);
                    }
                }).catch(err => {
                    console.error("Erro ao salvar foto:", err);
                    if(status) { status.innerText = "❌ Ocorreu um erro no envio."; status.style.color = "#ff6b6b"; }
                }).finally(() => {
                    if(btn) { btn.disabled = false; btn.style.opacity = "1"; }
                    event.target.value = ''; 
                });
            };
            img.onerror = () => {
                if(status) status.innerText = "❌ Arquivo de imagem inválido.";
                if(btn) { btn.disabled = false; btn.style.opacity = "1"; }
            };
        };
    };

// --- 2. A ÁRVORE DA VIDA (FRACTAL PROCEDURAL) ---
window.inicializarPrisma3D = () => {
    const container = document.getElementById('prisma-3d');
    
    // CORREÇÃO: Verificamos se o motor existe e se já não injetamos um canvas lá dentro
    if (!container || typeof THREE === 'undefined' || container.children.length > 0) return;

    const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "high-performance" });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
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
            if (!window.RadarDePerformance.podeAnimar('prisma-3d')) return;
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


// --- 5. O VÓRTICE ORGÂNICO INTERATIVO (RAYMARCHING & SDF) ---
window.inicializarJornada3D = () => {
    const container = document.getElementById('jornada-3d-fundo');
    if (!container || typeof THREE === 'undefined') return;
    if (container.children.length > 0) return; // Evita duplicar o canvas

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Otimização severa para celulares
    container.appendChild(renderer.domElement);

    const progressoData = { atual: 0.0 };
    
    // Variáveis de controle de rotação tátil
    let alvoRotacaoX = 0;
    let alvoRotacaoY = 0;
    let mouseSuave = new THREE.Vector2(0, 0);

    const uniforms = {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uProgress: { value: 0.0 },
        uMouse: { value: new THREE.Vector2(0, 0) } 
    };

    const shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0); 
            }
        `,
        fragmentShader: `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform float uProgress;
            uniform vec2 uMouse;
            varying vec2 vUv;

            float smin(float a, float b, float k) {
                float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
                return mix(b, a, h) - k * h * (1.0 - h);
            }

            mat2 rot(float a) {
                float s = sin(a), c = cos(a);
                return mat2(c, -s, s, c);
            }

            vec2 map(vec3 p) {
                vec3 q = p;
                q.xy *= rot(p.z * 0.1 + uTime * 0.2);
                float dTunnel = length(q.xy) - (2.5 + sin(p.z * 2.0 + uTime)*0.3); 
                
                float distanciaInicial = 1.2;
                float posicaoX = distanciaInicial * (1.0 - uProgress); 
                
                vec3 posJoao = vec3(-posicaoX, sin(uTime*2.0)*0.1, 5.0);
                vec3 posThamiris = vec3(posicaoX, cos(uTime*2.0)*0.1, 5.0);
                
                float dJoao = length(p - posJoao) - 0.35;
                float dThamiris = length(p - posThamiris) - 0.35;

                float dAlmas = smin(dJoao, dThamiris, 0.8);
                float dSol = length(p - vec3(0.0, 0.0, 5.5)) - (0.2 + (uProgress * 0.8));
                float dNucleo = smin(dAlmas, dSol, 0.5);

                if (dNucleo < -dTunnel) return vec2(dNucleo, 2.0); 
                return vec2(-dTunnel, 1.0); 
            }

            void main() {
                vec2 uv = (vUv - 0.5) * 2.0;
                uv.x *= uResolution.x / uResolution.y;

                vec3 ro = vec3(0.0, 0.0, uTime * 2.0); 
                vec3 rd = normalize(vec3(uv, 1.2)); 

                // APLICAÇÃO DO GIRO
                rd.yz *= rot(uMouse.y); 
                rd.xz *= rot(uMouse.x); 

                float t = 0.0, glowAlmas = 0.0, glowTunnel = 0.0;
                vec3 p;
                
                for(int i = 0; i < 64; i++) { 
                    p = ro + rd * t;
                    vec3 pLocal = p;
                    pLocal.z -= ro.z; 
                    vec2 d = map(pLocal);
                    if(d.x < 0.01 || t > 20.0) break;
                    t += d.x * 0.7; 
                    if (d.y == 2.0) glowAlmas += 0.05 / (0.05 + d.x*d.x);
                    else glowTunnel += 0.01 / (0.01 + d.x*d.x);
                }

                vec3 col = vec3(0.0); 
                vec3 corTunnel = mix(vec3(0.02, 0.05, 0.1), vec3(0.1, 0.0, 0.1), sin(p.z*0.5)*0.5+0.5);
                col += corTunnel * glowTunnel * 1.5;

                float lado = clamp(p.x * 2.0, -1.0, 1.0);
                vec3 corBaseAlmas = mix(vec3(0.2, 0.6, 1.0), vec3(1.0, 0.2, 0.4), lado * 0.5 + 0.5);
                vec3 corFinalAlma = mix(corBaseAlmas, vec3(1.0, 0.8, 0.2), uProgress);

                col += corFinalAlma * glowAlmas * 0.6;
                col = col * (2.51 * col + 0.03) / (col * (2.43 * col + 0.59) + 0.14);

                gl_FragColor = vec4(col, 1.0);
            }
        `
    });

    const plane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), shaderMaterial);
    scene.add(plane);

    // --- SISTEMA DE TOQUE/ARRASTE (Aperfeiçoado para Mobile) ---
    let touchX = 0, touchY = 0, isDragging = false;

    container.addEventListener('pointerdown', (e) => {
        isDragging = true;
        touchX = e.clientX;
        touchY = e.clientY;
    });

    // Adicionado cancel e leave para evitar travamentos do dedo na tela
    window.addEventListener('pointerup', () => { isDragging = false; });
    container.addEventListener('pointerleave', () => { isDragging = false; });
    container.addEventListener('pointercancel', () => { isDragging = false; });

    container.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const deltaX = e.clientX - touchX;
        const deltaY = e.clientY - touchY;
        alvoRotacaoX += deltaX * 0.005;
        alvoRotacaoY += deltaY * 0.005;
        touchX = e.clientX;
        touchY = e.clientY;
    });

    const atualizarTamanho = () => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
            renderer.setSize(container.clientWidth, container.clientHeight);
            uniforms.uResolution.value.set(container.clientWidth, container.clientHeight);
        }
    };
    new ResizeObserver(atualizarTamanho).observe(container);
    atualizarTamanho();

    const telaJornada = document.getElementById('jornada');
    let tempoAnterior = performance.now();

    const animar = () => {
        requestAnimationFrame(animar);

        // MOTOR DE HIBERNAÇÃO (Para não queimar bateria em outras telas)
        if (telaJornada && telaJornada.classList.contains('escondido')) {
            tempoAnterior = performance.now(); 
            return; 
        }

        const agora = performance.now();
        const delta = (agora - tempoAnterior) * 0.001;
        tempoAnterior = agora;
        uniforms.uTime.value += delta;

        mouseSuave.x += (alvoRotacaoX - mouseSuave.x) * 0.1;
        mouseSuave.y += (alvoRotacaoY - mouseSuave.y) * 0.1;
        uniforms.uMouse.value.set(mouseSuave.x, mouseSuave.y);

        const alvo = window.ProgressoAlvoJornada || 0;
        progressoData.atual += (alvo - progressoData.atual) * 0.02;
        uniforms.uProgress.value = progressoData.atual;

        renderer.render(scene, camera);
    };
    animar();
};

// O GATILHO MÁGICO DO 3D: Isso garante que a Jornada renderize assim que a GPU ligar
window.addEventListener('motor3DPronto', () => {
    if (typeof window.inicializarJornada3D === 'function') {
        window.inicializarJornada3D();
    }
});