import { db, collection, addDoc } from './firebase-config.js';

// Função para comprimir a imagem antes do upload
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

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formAnimal');
    const inputFoto = document.getElementById('foto');
    const previewFotoContainer = document.getElementById('previewFotoContainer');
    const previewFoto = document.getElementById('previewFoto');
    let fotoArquivo = null;

    if (inputFoto) {
        inputFoto.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                fotoArquivo = file;
                const reader = new FileReader();
                reader.onload = function(event) {
                    if (previewFoto) previewFoto.src = event.target.result;
                    if (previewFotoContainer) previewFotoContainer.style.display = 'flex';
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const btnSubmit = form.querySelector('button[type="submit"]');
            
            if (btnSubmit) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Enviando ao Firebase...';
            }

            try {
                let fotoUrlFinal = 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80';
                
                if (fotoArquivo) {
                    fotoUrlFinal = await comprimirImagem(fotoArquivo, 800, 0.75);
                }

                const vacinadoVal = document.getElementById('vacinado').value;
                const castradoVal = document.getElementById('castrado').value;

                // Objeto com a estrutura EXATA do Firestore (coleção "animais")
                const dadosAnimal = {
                    nome: document.getElementById('nomeAnimal').value.trim(),
                    especie: document.getElementById('especie').value.trim(),
                    raca: document.getElementById('raca').value.trim(),
                    idade: Number(document.getElementById('idade').value) || 0,
                    sexo: document.getElementById('sexo').value.trim(),
                    cidade: document.getElementById('cidade').value.trim(),
                    descricaoAnimal: document.getElementById('descricao').value.trim(),
                    cuidados: document.getElementById('problemasHealth').value.trim(),
                    vacinado: vacinadoVal === 'sim' || vacinadoVal === 'true' || vacinadoVal === true,
                    castrado: castradoVal === 'sim' || castradoVal === 'true' || castradoVal === true,
                    fotoUrl: fotoUrlFinal,
                    nomeResponsvel: document.getElementById('nomeDoador').value.trim(),
                    numeroTelefone: document.getElementById('telefone').value.trim(),
                    criadoEm: new Date().toISOString()
                };

                // Salva no Firebase Firestore na coleção "animais"
                await addDoc(collection(db, "animais"), dadosAnimal);

                alert('✓ Animal cadastrado no Firebase com sucesso!');
                mostrarMensagemSucesso();
                form.reset();
                fotoArquivo = null;
                if (previewFotoContainer) previewFotoContainer.style.display = 'none';
                
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);

            } catch (error) {
                console.error('Erro ao enviar para o Firebase:', error);
                alert('❌ Falha ao cadastrar animal no Firebase: ' + (error.message || error));
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.textContent = 'Cadastrar Animal';
                }
            }
        });
    }
});

function mostrarMensagemSucesso() {
    const containerFormulario = document.querySelector('.secao-formulario');
    if (!containerFormulario) return;
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
    divSucesso.textContent = '✓ Animal cadastrado no Firebase com sucesso! Redirecionando...';
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

