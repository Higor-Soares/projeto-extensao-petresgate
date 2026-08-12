import { auth, db, storage } from './firebase.js';
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

document.addEventListener('DOMContentLoaded', () => {
    const userEmailSpan = document.getElementById('userEmail');
    const btnLogout = document.getElementById('btnLogout');
    const btnNovoAnimal = document.getElementById('btnNovoAnimal');
    const tabelaCorpo = document.getElementById('tabelaCorpo');

    const modalFormAnimal = document.getElementById('modalFormAnimal');
    const modalTitulo = document.getElementById('modalTitulo');
    const btnFecharModal = document.getElementById('btnFecharModal');
    const btnCancelarModal = document.getElementById('btnCancelarModal');
    const formAdminAnimal = document.getElementById('formAdminAnimal');

    const inputFoto = document.getElementById('foto');
    const previewFotoContainer = document.getElementById('previewFotoContainer');
    const previewFoto = document.getElementById('previewFoto');

    let listaPetsCache = [];
    let fotoAtualUrl = '';
    let fotoNova = null;

    // --- AUTENTICAÇÃO DESATIVADA TEMPORARIAMENTE ---
    if (userEmailSpan) {
        userEmailSpan.textContent = 'Painel Admin';
    }
    carregarAnimaisAdmin();

    if (btnLogout) {
        btnLogout.textContent = 'Voltar ao Site';
        btnLogout.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }

    // --- COMPRESSOR DE IMAGEM PARA FIRESTORE / STORAGE ---
    function comprimirImagem(file, maxWidth = 800, quality = 0.75) {
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

    // --- LISTEN DA PRÉVIA DA FOTO SELECIONADA ---
    if (inputFoto) {
        inputFoto.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fotoNova = file;
                const urlPreview = URL.createObjectURL(file);
                if (previewFoto) {
                    previewFoto.src = urlPreview;
                }
                if (previewFotoContainer) {
                    previewFotoContainer.style.display = 'flex';
                }
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
            document.getElementById('idade').value = petData.idade || '';
            document.getElementById('sexo').value = petData.sexo || '';

            fotoAtualUrl = petData.foto || petData.fotoUrl || '';
            if (fotoAtualUrl && previewFoto && previewFotoContainer) {
                previewFoto.src = fotoAtualUrl;
                previewFotoContainer.style.display = 'flex';
            } else if (previewFotoContainer) {
                previewFotoContainer.style.display = 'none';
            }

            document.getElementById('descricao').value = petData.descricao || '';
            document.getElementById('vacinado').value = petData.vacinado || '';
            document.getElementById('castrado').value = petData.castrado || '';
            document.getElementById('problemasHealth').value = petData.problemasHealth || '';
            document.getElementById('nomeDoador').value = petData.nomeDoador || petData.contato || '';
            document.getElementById('telefone').value = petData.telefone || '';
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
        if (modalFormAnimal) {
            modalFormAnimal.classList.add('hidden');
        }
    }

    if (btnNovoAnimal) {
        btnNovoAnimal.addEventListener('click', () => abrirModal('novo'));
    }

    if (btnFecharModal) {
        btnFecharModal.addEventListener('click', fecharModal);
    }

    if (btnCancelarModal) {
        btnCancelarModal.addEventListener('click', fecharModal);
    }

    if (modalFormAnimal) {
        modalFormAnimal.addEventListener('click', (e) => {
            if (e.target === modalFormAnimal) fecharModal();
        });
    }

    // --- CARREGAR E RENDERIZAR ANIMAIS DO FIRESTORE ---
    async function carregarAnimaisAdmin() {
        if (!tabelaCorpo) return;
        tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #666;">Carregando animais...</td></tr>';

        try {
            const colecao = collection(db, 'pets');
            const snapshot = await getDocs(colecao);
            listaPetsCache = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

            // Ordenar por nome
            listaPetsCache.sort((a, b) => (a.nome || a.nomeAnimal || '').localeCompare(b.nome || b.nomeAnimal || ''));

            renderizarTabelaAdmin(listaPetsCache);
        } catch (error) {
            console.error('Erro ao carregar animais no admin:', error);
            // Tenta fallback na colecao 'pets_perdidos'
            try {
                const colecaoOld = collection(db, 'pets_perdidos');
                const snapshotOld = await getDocs(colecaoOld);
                listaPetsCache = snapshotOld.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
                renderizarTabelaAdmin(listaPetsCache);
            } catch (errOld) {
                console.error('Erro no fallback:', errOld);
                tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #dc3545;">Erro ao carregar os animais. Verifique se o Firestore Database foi ativado no Firebase Console.</td></tr>';
            }
        }
    }

    function renderizarTabelaAdmin(pets) {
        if (pets.length === 0) {
            tabelaCorpo.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 24px; color: #777;">Nenhum animal cadastrado ainda. Clique em "+ Cadastrar Novo Animal" para adicionar.</td></tr>';
            return;
        }

        tabelaCorpo.innerHTML = pets.map(pet => {
            const fotoUrl = pet.foto || pet.fotoUrl || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=150&q=80';
            const nome = pet.nome || pet.nomeAnimal || 'Sem nome';
            const especieRaca = `${pet.especie || 'Pet'} • ${pet.raca || 'SRD'}`;
            const idadeSexo = `${pet.idade ? pet.idade + ' ano(s)' : 'N/I'} • ${pet.sexo || 'N/I'}`;
            const cidade = pet.cidade || 'N/I';
            const contato = pet.telefone ? `${pet.nomeDoador || 'Doador'} (${pet.telefone})` : (pet.nomeDoador || 'N/I');

            return `
                <tr>
                    <td><img src="${fotoUrl}" alt="${nome}" class="img-thumb" onerror="this.src='https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=150&q=80'"></td>
                    <td><strong>${nome}</strong></td>
                    <td>${especieRaca}</td>
                    <td>${idadeSexo}</td>
                    <td>${cidade}</td>
                    <td>${contato}</td>
                    <td style="text-align: center; white-space: nowrap;">
                        <button type="button" class="btn-acao btn-editar" data-id="${pet.id}">Editar</button>
                        <button type="button" class="btn-acao btn-excluir" data-id="${pet.id}">Excluir</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // --- EVENT LISTENERS DA TABELA (EDITAR E EXCLUIR) ---
    if (tabelaCorpo) {
        tabelaCorpo.addEventListener('click', async (e) => {
            const btnEditar = e.target.closest('.btn-editar');
            const btnExcluir = e.target.closest('.btn-excluir');

            if (btnEditar) {
                const petId = btnEditar.getAttribute('data-id');
                const petData = listaPetsCache.find(p => p.id === petId);
                if (petData) abrirModal('editar', petData);
            }

            if (btnExcluir) {
                const petId = btnExcluir.getAttribute('data-id');
                const petData = listaPetsCache.find(p => p.id === petId);
                const nomePet = petData ? (petData.nome || petData.nomeAnimal || 'este animal') : 'este animal';

                if (confirm(`Tem certeza que deseja excluir "${nomePet}" permanentemente?`)) {
                    try {
                        await deleteDoc(doc(db, 'pets', petId));
                        await carregarAnimaisAdmin();
                    } catch (error) {
                        console.error('Erro ao excluir animal:', error);
                        alert('Não foi possível excluir o animal. Erro:\n' + (error.message || error));
                    }
                }
            }
        });
    }

    // --- ENVIAR FORMULÁRIO (CADASTRAR OU ATUALIZAR) ---
    if (formAdminAnimal) {
        formAdminAnimal.addEventListener('submit', async (e) => {
            e.preventDefault();

            const petId = document.getElementById('petId').value;
            const btnSalvar = document.getElementById('btnSalvarModal');

            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.textContent = 'Salvando...';
            }

            try {
                // 1. Processar e comprimir Imagem
                let fotoFinal = fotoAtualUrl || '';

                if (fotoNova) {
                    console.log('📷 Comprimindo imagem...');
                    fotoFinal = await comprimirImagem(fotoNova, 800, 0.75);

                    // Tenta subir no Firebase Storage em segundo plano se disponível
                    try {
                        const nomeArquivo = `${Date.now()}_${fotoNova.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                        const caminhoFoto = `pets/${nomeArquivo}`;
                        const fotoRef = ref(storage, caminhoFoto);
                        await uploadBytes(fotoRef, fotoNova, { contentType: fotoNova.type });
                        const urlStorage = await getDownloadURL(fotoRef);
                        if (urlStorage) fotoFinal = urlStorage;
                    } catch (storageErr) {
                        console.warn('⚠️ Firebase Storage ignorado (usando imagem otimizada em Base64):', storageErr);
                    }
                }

                if (!fotoFinal) {
                    fotoFinal = 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80';
                }

                // 2. Montar objeto estrito do animal para o Supabase
                const dadosAnimal = {
                    nome: document.getElementById('nomeAnimal').value.trim(),
                    especie: document.getElementById('especie').value,
                    raca: document.getElementById('raca').value.trim(),
                    idade_anos: parseFloat(document.getElementById('idade').value) || 0,
                    sexo: document.getElementById('sexo').value,
                    foto_url: fotoFinal,
                    descricao: document.getElementById('descricao').value.trim(),
                    vacinado: document.getElementById('vacinado').value === 'sim' || document.getElementById('vacinado').value === 'Sim',
                    castrado: document.getElementById('castrado').value === 'sim' || document.getElementById('castrado').value === 'Sim',
                    problemas_saude: document.getElementById('problemasHealth').value.trim() || null,
                    nome_responsavel: document.getElementById('nomeDoador').value.trim(),
                    telefone_whatsapp: document.getElementById('telefone').value.trim(),
                    cidade: document.getElementById('cidade').value.trim(),
                    status: 'disponivel'
                };

                console.log('💾 Salvando no Supabase...', dadosAnimal);

                // 3. Salvar no Supabase
                if (window.supabaseClient) {
                    if (petId) {
                        const { error: errUpdate } = await window.supabaseClient
                            .from('animais')
                            .update(dadosAnimal)
                            .eq('id', petId);
                        if (errUpdate) throw errUpdate;
                    } else {
                        const { error: errInsert } = await window.supabaseClient
                            .from('animais')
                            .insert([dadosAnimal]);
                        if (errInsert) throw errInsert;
                    }
                }

                // 4. Finalizar modal e recarregar lista
                fecharModal();
                fotoNova = null;
                await carregarAnimaisAdmin();
                alert('✓ Animal salvo com sucesso no banco de dados Supabase!');

            } catch (error) {
                console.error('❌ Erro ao salvar animal no Supabase:', error);
                alert('❌ Erro ao salvar no banco de dados Supabase:\n\n' + (error.message || error));
            } finally {
                if (btnSalvar) {
                    btnSalvar.disabled = false;
                    btnSalvar.textContent = 'Salvar Animal';
                }
            }
        });
    }
});
