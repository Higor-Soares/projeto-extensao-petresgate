import { db } from './firebase.js';
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formAnimal');
    const inputFoto = document.getElementById('foto');
    let fotoBase64 = '';

    if (inputFoto) {
        inputFoto.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    fotoBase64 = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const btnSubmit = form.querySelector('button[type="submit"]');
            
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Enviando...';
            }

            try {
                let fotoUrl = fotoBase64 || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80';

                // Fazer upload da imagem no Supabase Storage se um arquivo foi selecionado
                if (inputFoto && inputFoto.files && inputFoto.files[0]) {
                    const file = inputFoto.files[0];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                    const filePath = `pets/${fileName}`;

                    if (window.supabaseClient) {
                        const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                            .from('fotos-animais')
                            .upload(filePath, file);

                        if (!uploadError) {
                            const { data: urlData } = window.supabaseClient.storage
                                .from('fotos-animais')
                                .getPublicUrl(filePath);

                            if (urlData && urlData.publicUrl) {
                                fotoUrl = urlData.publicUrl;
                            }
                        }
                    }
                }

                // Payload estrito conforme colunas existentes na tabela 'animais' do Supabase
                const dadosAnimal = {
                    nome: formData.get('nomeAnimal') || '',
                    especie: formData.get('especie') || '',
                    raca: formData.get('raca') || '',
                    idade_anos: parseFloat(formData.get('idade')) || 0,
                    sexo: formData.get('sexo') || '',
                    foto_url: fotoUrl,
                    descricao: formData.get('descricao') || '',
                    vacinado: formData.get('vacinado') === 'sim' || formData.get('vacinado') === 'Sim',
                    castrado: formData.get('castrado') === 'sim' || formData.get('castrado') === 'Sim',
                    problemas_saude: formData.get('problemasHealth') || null,
                    nome_responsavel: formData.get('nomeDoador') || '',
                    telefone_whatsapp: formData.get('telefone') || '',
                    cidade: formData.get('cidade') || '',
                    status: 'disponivel'
                };

                if (window.supabaseClient) {
                    const { data, error: dbError } = await window.supabaseClient
                        .from('animais')
                        .insert([dadosAnimal]);

                    if (dbError) {
                        throw new Error(dbError.message);
                    }
                }

                alert('✓ Animal cadastrado com sucesso no banco de dados Supabase!');
                form.reset();
                fotoBase64 = '';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);

            } catch (error) {
                console.error('Erro ao salvar no Supabase:', error);
                alert('❌ Falha ao cadastrar animal no Supabase: ' + (error.message || error));
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Cadastrar Animal';
                }
            }
        });
    }
});

function validarFormulario(dados) {
    let mensagensErro = [];
    
    if (!dados.nomeAnimal || dados.nomeAnimal.trim() === '') {
        mensagensErro.push('Nome do animal é obrigatório');
    }
    if (!dados.especie || dados.especie === '') {
        mensagensErro.push('Espécie do animal é obrigatória');
    }
    if (!dados.raca || dados.raca.trim() === '') {
        mensagensErro.push('Raça/Tipo é obrigatório');
    }
    if (!dados.idade || dados.idade < 0) {
        mensagensErro.push('Idade válida é obrigatória');
    }
    if (!dados.nomeDoador || dados.nomeDoador.trim() === '') {
        mensagensErro.push('Seu nome é obrigatório');
    }
    if (!dados.telefone || dados.telefone.trim() === '') {
        mensagensErro.push('Telefone é obrigatório');
    }
    if (!dados.email || !validarEmail(dados.email)) {
        mensagensErro.push('Email válido é obrigatório');
    }
    if (!dados.cidade || dados.cidade.trim() === '') {
        mensagensErro.push('Cidade é obrigatória');
    }
    
    if (mensagensErro.length > 0) {
        alert('Erro ao validar formulário:\n\n' + mensagensErro.join('\n'));
        return false;
    }
    return true;
}

function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function mostrarMensagemSucesso() {
    const containerFormulario = document.querySelector('.secao-formulario');
    const divSucesso = document.createElement('div');
    divSucesso.className = 'mensagem-sucesso';
    divSucesso.style.cssText = `
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 15px 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        text-align: center;
        font-weight: 600;
    `;
    divSucesso.textContent = '✓ Animal cadastrado com sucesso! Redirecionando...';
    containerFormulario.insertBefore(divSucesso, containerFormulario.firstChild);
}

// Formatador de Telefone
document.addEventListener('DOMContentLoaded', function() {
    const inputTelefone = document.getElementById('telefone');
    if (inputTelefone) {
        inputTelefone.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 0) {
                if (value.length <= 2) {
                    value = '(' + value;
                } else if (value.length <= 7) {
                    value = '(' + value.slice(0, 2) + ') ' + value.slice(2);
                } else {
                    value = '(' + value.slice(0, 2) + ') ' + value.slice(2, 7) + '-' + value.slice(7, 11);
                }
            }
            e.target.value = value;
        });
    }
});
