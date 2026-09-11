import { 
    db, 
    collection, 
    getDocs, 
    addDoc, 
    updateDoc, 
    deleteDoc, 
    doc,
    onSnapshot,
    auth,
    signOut,
    signInWithEmailAndPassword
} from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const ADMINS_AUTORIZADOS = [
        'paulaleite.tech@gmail.com',
        'beatrizgarajau@outlook.com',
        'higordinz@gmail.com'
    ];

    // Elementos da Tela de Login
    const secaoLoginAdmin = document.getElementById('secaoLoginAdmin');
    const formLogin = document.getElementById('formLogin');
    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('senha');
    const botaoEntrar = document.getElementById('botaoEntrar');
    const mensagemErro = document.getElementById('mensagemErro');

    // Elementos do Painel Admin
    const painelAdminConteudo = document.getElementById('painelAdminConteudo');
    const userEmailSpan = document.getElementById('userEmail');
    const btnLogout = document.getElementById('btnLogout');
    const btnNovoAnimal = document.getElementById('btnNovoAnimal');
    const tabelaCorpo = document.getElementById('tabelaCorpo');
    const inputBuscaAdmin = document.getElementById('inputBuscaAdmin');
    const grupoFiltros = document.getElementById('grupoFiltros');
    const toastContainer = document.getElementById('toastContainer');

    const modalFormAnimal = document.getElementById('modalFormAnimal');
    const modalTitulo = document.getElementById('modalTitulo');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const formAdminAnimal = document.getElementById('formAdminAnimal');

    const inputFoto = document.getElementById('foto');
    const previewFotoContainer = document.getElementById('previewFotoContainer');
    const previewFoto = document.getElementById('previewFoto');

    let listaPetsCache = [];
    let filtroAtual = 'todos';
    let termoBusca = '';
    let fotoAtualUrl = '';
    let fotoNova = null;
    let unsubscribeRealtime = null;

    // --- TOAST NOTIFICATION UTILITY ---
    function mostrarToast(mensagem, tipo = 'sucesso') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${tipo}`;
        toast.innerHTML = `
            <span>${tipo === 'sucesso' ? '✓' : '⚠️'}</span>
            <span>${mensagem}</span>
        `;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }

    // --- VERIFICAÇÃO DE SESSÃO / SEGURANÇA DO ADMIN ---
    function estaAutenticado() {
        const adminLoggedIn = sessionStorage.getItem('admin_logged_in') === 'true';
        const emailSalvo = (sessionStorage.getItem('admin_email') || '').toLowerCase();
        return adminLoggedIn && ADMINS_AUTORIZADOS.some(adm => adm.toLowerCase() === emailSalvo);
    }

    function atualizarEstadoView() {
        if (estaAutenticado()) {
            const emailSalvo = sessionStorage.getItem('admin_email') || '';
            if (secaoLoginAdmin) secaoLoginAdmin.style.display = 'none';
            if (painelAdminConteudo) painelAdminConteudo.style.display = 'block';
            if (userEmailSpan) {
                userEmailSpan.style.display = 'inline-flex';
                userEmailSpan.textContent = `🛡️ Admin (${emailSalvo})`;
            }
            if (btnLogout) btnLogout.style.display = 'inline-flex';

            if (!unsubscribeRealtime) {
                carregarAnimaisAdminEmTempoReal();
            }
        } else {
            if (secaoLoginAdmin) secaoLoginAdmin.style.display = 'flex';
            if (painelAdminConteudo) painelAdminConteudo.style.display = 'none';
            if (userEmailSpan) userEmailSpan.style.display = 'none';
            if (btnLogout) btnLogout.style.display = 'none';

            if (unsubscribeRealtime) {
                unsubscribeRealtime();
                unsubscribeRealtime = null;
            }
        }
    }

    // --- PROCESSAMENTO DO LOGIN NO ADMIN.HTML ---
    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = inputEmail ? inputEmail.value.trim().toLowerCase() : '';
            const senha = inputSenha ? inputSenha.value.trim() : '';

            if (!email || !senha) {
                exibirErro('Por favor, preencha o e-mail e a senha.');
                return;
            }

            if (botaoEntrar) {
                botaoEntrar.disabled = true;
                botaoEntrar.textContent = 'Autenticando...';
            }
            ocultarErro();

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, senha);
                const user = userCredential.user;
                const emailUsuario = (user.email || email).toLowerCase();

                const eAdmin = ADMINS_AUTORIZADOS.some(admin => admin.toLowerCase() === emailUsuario);

                if (!eAdmin) {
                    exibirErro(`Acesso negado. O e-mail (${emailUsuario}) não tem permissão de administrador.`);
                    return;
                }

                sessionStorage.setItem('admin_logged_in', 'true');
                sessionStorage.setItem('admin_email', emailUsuario);

                mostrarToast('Login realizado com sucesso!', 'sucesso');
                atualizarEstadoView();

            } catch (error) {
                console.error('Erro no Firebase Auth:', error);

                let mensagem = `Erro ao realizar login: ${error.message || error}`;

                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                    mensagem = 'E-mail ou senha incorretos. Verifique os dados digitados.';
                } else if (error.code === 'auth/too-many-requests') {
                    mensagem = 'Muitas tentativas incorretas. Tente novamente em alguns minutos.';
                } else if (error.code === 'auth/operation-not-allowed') {
                    mensagem = '⚠️ O provedor "E-mail/senha" não está ativado no Firebase Console.';
                }

                exibirErro(mensagem);

            } finally {
                if (botaoEntrar) {
                    botaoEntrar.disabled = false;
                    botaoEntrar.textContent = 'Entrar no Painel Admin';
                }
            }
        });
    }

    function exibirErro(msg) {
        if (mensagemErro) {
            mensagemErro.textContent = msg;
            mensagemErro.style.display = 'block';
        } else {
            alert(msg);
        }
    }

    function ocultarErro() {
        if (mensagemErro) {
            mensagemErro.style.display = 'none';
            mensagemErro.textContent = '';
        }
    }

    // --- EXIBIR EMAIL E CONFIGURAR LOGOUT ---
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await signOut(auth);
            } catch (err) {
                console.warn('Erro ao deslogar do Firebase:', err);
            } finally {
                sessionStorage.removeItem('admin_logged_in');
                sessionStorage.removeItem('admin_email');
                if (inputEmail) inputEmail.value = '';
                if (inputSenha) inputSenha.value = '';
                ocultarErro();
                mostrarToast('Você saiu do painel administrativo.', 'sucesso');
                atualizarEstadoView();
            }
        });
    }

    // --- COMPRESSOR DE IMAGEM OTIMIZADO ---
    function comprimirImagem(file, maxWidth = 600, quality = 0.65) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                img.onerror = () => resolve(e.target.result);
                img.src = e.target.result;
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
        });
    }

    // --- PRÉVIA DA FOTO SELECIONADA ---
    if (inputFoto) {
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fotoNova = file;
                const urlPreview = URL.createObjectURL(file);
                if (previewFoto) previewFoto.src = urlPreview;
                if (previewFotoContainer) previewFotoContainer.style.display = 'flex';
            }
        });
    }

    // --- CONTROLE DE MODAL ---
    function abrirModal(modo = 'novo', petData = null) {
        if (!modalFormAnimal) return;
        formAdminAnimal.reset();
        fotoNova = null;

        if (modo === 'editar' && petData) {
            modalTitulo.textContent = 'Editar Animal para Adoção';
            document.getElementById('petId').value = petData.id || '';
            document.getElementById('nomeAnimal').value = petData.nome || petData.nomeAnimal || '';
            document.getElementById('especie').value = petData.especie || '';
            document.getElementById('raca').value = petData.raca || '';
            document.getElementById('idade').value = petData.idade !== undefined ? petData.idade : '';
            document.getElementById('sexo').value = petData.sexo || '';

            fotoAtualUrl = petData.fotoUrl || petData.foto || '';
            if (fotoAtualUrl && previewFoto && previewFotoContainer) {
                previewFoto.src = fotoAtualUrl;
                previewFotoContainer.style.display = 'flex';
            } else if (previewFotoContainer) {
                previewFotoContainer.style.display = 'none';
            }

            document.getElementById('descricao').value = petData.descricaoAnimal || petData.descricao || '';
            document.getElementById('vacinado').value = petData.vacinado === true ? 'Sim' : (petData.vacinado === false ? 'Não' : (petData.vacinado || ''));
            document.getElementById('castrado').value = petData.castrado === true ? 'Sim' : (petData.castrado === false ? 'Não' : (petData.castrado || ''));
            document.getElementById('problemasHealth').value = petData.cuidados || petData.problemasHealth || '';
            document.getElementById('nomeDoador').value = petData.nomeResponsvel || petData.nomeDoador || '';
            document.getElementById('telefone').value = petData.numeroTelefone || petData.telefone || '';
            document.getElementById('cidade').value = petData.cidade || '';
        } else {
            modalTitulo.textContent = 'Cadastrar Animal para Adoção';
            document.getElementById('petId').value = '';
            fotoAtualUrl = '';
            if (previewFotoContainer) previewFotoContainer.style.display = 'none';
        }

        modalFormAnimal.classList.remove('hidden');
    }

    function fecharModal() {
        if (modalFormAnimal) modalFormAnimal.classList.add('hidden');
    }

    if (btnNovoAnimal) btnNovoAnimal.addEventListener('click', () => abrirModal('novo'));
    if (btnFecharModal) btnFecharModal.addEventListener('click', fecharModal);
    if (btnCancelarModal) btnCancelarModal.addEventListener('click', fecharModal);
    if (modalFormAnimal) {
        modalFormAnimal.addEventListener('click', (e) => {
            if (e.target === modalFormAnimal) fecharModal();
        });
    }

    // --- ESCUTADOR EM TEMPO REAL VIA FIREBASE ONSNAPSHOT (CARREGAMENTO INSTANTÂNEO) ---
    function carregarAnimaisAdminEmTempoReal() {
        if (!tabelaCorpo) return;
        
        // Escutador em tempo real (cache local ultra rápido + atualizações automáticas)
        unsubscribeRealtime = onSnapshot(collection(db, "animais"), (querySnapshot) => {
            listaPetsCache = [];
            querySnapshot.forEach((docSnap) => {
                listaPetsCache.push({
                    id: docSnap.id,
                    ...docSnap.data()
                });
            });
            atualizarKpis(listaPetsCache);
            aplicarFiltrosEBusca();
        }, (error) => {
            console.error("Erro ao carregar em tempo real do Firebase:", error);
            tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc2626;">Erro ao carregar animais do Firebase. Verifique a conexão.</td></tr>';
        });
    }

    // Inicialização da View (Verifica sessão ou exibe form de login)
    atualizarEstadoView();


    // --- CÁLCULO DAS MÉTRICAS / KPIS ---
    function atualizarKpis(pets) {
        const kpiTotal = document.getElementById('kpiTotal');
        const kpiCachorros = document.getElementById('kpiCachorros');
        const kpiGatos = document.getElementById('kpiGatos');
        const kpiVacinados = document.getElementById('kpiVacinados');

        const total = pets.length;
        const cachorros = pets.filter(p => (p.especie || '').toLowerCase() === 'cachorro').length;
        const gatos = pets.filter(p => (p.especie || '').toLowerCase() === 'gato').length;
        const vacinadosCount = pets.filter(p => p.vacinado === true || p.vacinado === 'Sim' || p.vacinado === 'sim').length;
        const percVacinados = total > 0 ? Math.round((vacinadosCount / total) * 100) : 0;

        if (kpiTotal) kpiTotal.textContent = total;
        if (kpiCachorros) kpiCachorros.textContent = cachorros;
        if (kpiGatos) kpiGatos.textContent = gatos;
        if (kpiVacinados) kpiVacinados.textContent = `${percVacinados}%`;
    }

    // --- FILTROS E BUSCA EM TEMPO REAL ---
    function aplicarFiltrosEBusca() {
        let listaFiltrada = [...listaPetsCache];

        // Filtro por Categoria
        if (filtroAtual === 'cachorro') {
            listaFiltrada = listaFiltrada.filter(p => (p.especie || '').toLowerCase() === 'cachorro');
        } else if (filtroAtual === 'gato') {
            listaFiltrada = listaFiltrada.filter(p => (p.especie || '').toLowerCase() === 'gato');
        } else if (filtroAtual === 'vacinado') {
            listaFiltrada = listaFiltrada.filter(p => p.vacinado === true || p.vacinado === 'Sim' || p.vacinado === 'sim');
        }

        // Filtro por Texto
        if (termoBusca) {
            listaFiltrada = listaFiltrada.filter(pet => {
                return [pet.nome, pet.especie, pet.raca, pet.cidade, pet.nomeResponsvel, pet.nomeDoador]
                    .filter(Boolean)
                    .some(campo => String(campo).toLowerCase().includes(termoBusca));
            });
        }

        renderizarTabelaAdmin(listaFiltrada);
    }

    if (inputBuscaAdmin) {
        inputBuscaAdmin.addEventListener('input', (e) => {
            termoBusca = e.target.value.trim().toLowerCase();
            aplicarFiltrosEBusca();
        });
    }

    if (grupoFiltros) {
        grupoFiltros.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-filtro');
            if (!btn) return;
            grupoFiltros.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('ativo'));
            btn.classList.add('ativo');
            filtroAtual = btn.getAttribute('data-filtro') || 'todos';
            aplicarFiltrosEBusca();
        });
    }

    // --- RENDERIZAR TABELA COM BADGES E ESTILOS PREMIUM ---
    function renderizarTabelaAdmin(pets) {
        if (pets.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">Nenhum animal encontrado para os filtros selecionados.</td></tr>';
            return;
        }

        tabelaCorpo.innerHTML = pets.map(pet => {
            const fotoUrl = pet.fotoUrl || pet.foto || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=150&q=80';
            const nome = pet.nome || pet.nomeAnimal || 'Sem nome';
            const especie = pet.especie || 'Pet';
            const raca = pet.raca || 'SRD';
            const idadeVal = pet.idade !== undefined ? pet.idade : 'N/I';
            const sexo = pet.sexo || 'N/I';
            const cidade = pet.cidade || 'N/I';
            const doador = pet.nomeResponsvel || pet.nomeDoador || 'Doador';
            const tel = pet.numeroTelefone || pet.telefone;
            const contato = tel ? `${doador}<br><span style="font-size:0.85rem; color:var(--text-muted);">${tel}</span>` : doador;

            // Badges
            let classeEspecie = 'outro';
            const espLow = especie.toLowerCase();
            if (espLow.includes('cachorro') || espLow.includes('cão')) classeEspecie = 'cachorro';
            else if (espLow.includes('gato')) classeEspecie = 'gato';

            const vacinadoSim = pet.vacinado === true || pet.vacinado === 'Sim' || pet.vacinado === 'sim';
            const castradoSim = pet.castrado === true || pet.castrado === 'Sim' || pet.castrado === 'sim';

            return `
                <tr>
                    <td><img src="${fotoUrl}" alt="${nome}" class="img-thumb" onerror="this.src='https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=150&q=80'"></td>
                    <td>
                        <strong>${nome}</strong><br>
                        <span class="badge-especie ${classeEspecie}">${especie}</span>
                    </td>
                    <td>${raca}<br><span style="font-size:0.85rem; color:var(--text-muted);">${idadeVal} ano(s) • ${sexo}</span></td>
                    <td>
                        <span class="badge-status ${vacinadoSim ? 'sim' : 'nao'}">${vacinadoSim ? '💉 Vacinado' : 'Vacina N/I'}</span>
                        <span class="badge-status ${castradoSim ? 'sim' : 'nao'}">${castradoSim ? '✂️ Castrado' : 'Castração N/I'}</span>
                    </td>
                    <td>📍 ${cidade}</td>
                    <td>${contato}</td>
                    <td style="text-align: center; white-space: nowrap;">
                        <button type="button" class="btn-acao btn-editar" data-id="${pet.id}">✏️ Editar</button>
                        <button type="button" class="btn-acao btn-excluir" data-id="${pet.id}">🗑️ Excluir</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- EVENT LISTENERS DA TABELA (EDITAR E EXCLUIR NO FIREBASE) ---
    if (tabelaCorpo) {
        tabelaCorpo.addEventListener('click', async (e) => {
            const btnEditar = e.target.closest('.btn-editar');
            const btnExcluir = e.target.closest('.btn-excluir');

            if (btnEditar) {
                const petId = btnEditar.getAttribute('data-id');
                const petData = listaPetsCache.find(p => String(p.id) === String(petId));
                if (petData) abrirModal('editar', petData);
            }

            if (btnExcluir) {
                const petId = btnExcluir.getAttribute('data-id');
                const petData = listaPetsCache.find(p => String(p.id) === String(petId));
                const nomePet = petData ? (petData.nome || petData.nomeAnimal || 'este animal') : 'este animal';

                if (confirm(`Tem certeza que deseja excluir "${nomePet}" permanentemente do Firebase?`)) {
                    try {
                        await deleteDoc(doc(db, "animais", petId));
                        mostrarToast(`Animal "${nomePet}" excluído com sucesso!`, 'sucesso');
                        await carregarAnimaisAdmin();
                    } catch (error) {
                        console.error("Erro ao excluir do Firebase:", error);
                        mostrarToast("Erro ao excluir do Firebase: " + error.message, 'erro');
                    }
                }
            }
        });
    }

    // --- ENVIAR FORMULÁRIO (CADASTRAR OU ATUALIZAR NO FIREBASE) ---
    if (formAdminAnimal) {
        formAdminAnimal.addEventListener('submit', async (e) => {
            e.preventDefault();

            const petId = document.getElementById('petId').value;
            const btnSalvar = document.getElementById('btnSalvarModal');

            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.textContent = 'Salvando no Firebase...';
            }

            try {
                let fotoFinal = fotoAtualUrl || '';

                if (fotoNova) {
                    fotoFinal = await comprimirImagem(fotoNova, 800, 0.75);
                }

                if (!fotoFinal) {
                    fotoFinal = 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80';
                }

                const vacinadoVal = document.getElementById('vacinado').value;
                const castradoVal = document.getElementById('castrado').value;

                // Objeto com a estrutura EXATA do Firestore (coleção "animais")
                const dadosAnimal = {
                    nome: document.getElementById('nomeAnimal').value.trim(),
                    especie: document.getElementById('especie').value,
                    raca: document.getElementById('raca').value.trim(),
                    idade: Number(document.getElementById('idade').value) || 0,
                    sexo: document.getElementById('sexo').value,
                    fotoUrl: fotoFinal,
                    descricaoAnimal: document.getElementById('descricao').value.trim(),
                    vacinado: vacinadoVal === 'sim' || vacinadoVal === 'Sim' || vacinadoVal === true,
                    castrado: castradoVal === 'sim' || castradoVal === 'Sim' || castradoVal === true,
                    cuidados: document.getElementById('problemasHealth').value.trim(),
                    nomeResponsvel: document.getElementById('nomeDoador').value.trim(),
                    numeroTelefone: document.getElementById('telefone').value.trim(),
                    cidade: document.getElementById('cidade').value.trim(),
                    atualizadoEm: new Date().toISOString()
                };

                if (petId) {
                    // Atualiza no Firestore
                    await updateDoc(doc(db, "animais", petId), dadosAnimal);
                    mostrarToast('✓ Animal atualizado com sucesso no Firebase!', 'sucesso');
                } else {
                    // Adiciona no Firestore
                    dadosAnimal.criadoEm = new Date().toISOString();
                    await addDoc(collection(db, "animais"), dadosAnimal);
                    mostrarToast('✓ Novo animal cadastrado com sucesso no Firebase!', 'sucesso');
                }

                fecharModal();
                fotoNova = null;
                await carregarAnimaisAdmin();

            } catch (error) {
                console.error('Erro ao salvar no Firebase:', error);
                mostrarToast('Erro ao salvar no Firebase: ' + (error.message || error), 'erro');
            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Salvar Animal';
                }
            }
        });
    }
});


