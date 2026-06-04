// Formulário de Cadastro de Animal para Doação
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('formAnimal');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Coletando dados do formulário
            const formData = new FormData(form);
            const dados = {
                nomeAnimal: formData.get('nomeAnimal'),
                especie: formData.get('especie'),
                raca: formData.get('raca'),
                idade: formData.get('idade'),
                sexo: formData.get('sexo'),
                descricao: formData.get('descricao'),
                vacinado: formData.get('vacinado'),
                castrado: formData.get('castrado'),
                problemasHealth: formData.get('problemasHealth'),
                nomeDoador: formData.get('nomeDoador'),
                telefone: formData.get('telefone'),
                email: formData.get('email'),
                cidade: formData.get('cidade'),
                motivo: formData.get('motivo'),
                dataRegistro: new Date().toLocaleString('pt-BR')
            };
            
            // Validações básicas
            if (validarFormulario(dados)) {
                // Simulando envio para servidor
                console.log('Dados do animal para doação:', dados);
                
                // Armazenando no localStorage para demonstração
                let animaisParaDoacao = JSON.parse(localStorage.getItem('animaisParaDoacao')) || [];
                animaisParaDoacao.push(dados);
                localStorage.setItem('animaisParaDoacao', JSON.stringify(animaisParaDoacao));
                
                // Mensagem de sucesso
                mostrarMensagemSucesso();
                
                // Limpando o formulário
                form.reset();
                
                // Redirect após 2 segundos
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        });
    }
});

function validarFormulario(dados) {
    let mensagensErro = [];
    
    // Validação de campo obrigatório
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
    
    // Criando elemento de sucesso
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
        animation: slideDown 0.3s ease-out;
    `;
    divSucesso.textContent = '✓ Animal cadastrado com sucesso! Redirecionando...';
    
    containerFormulario.insertBefore(divSucesso, containerFormulario.firstChild);
    
    // Adicionando animação CSS
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Validação em tempo real do email
document.addEventListener('DOMContentLoaded', function() {
    const inputEmail = document.getElementById('email');
    
    if (inputEmail) {
        inputEmail.addEventListener('blur', function() {
            if (this.value && !validarEmail(this.value)) {
                this.style.borderColor = '#dc3545';
                this.style.backgroundColor = '#fff5f5';
            } else {
                this.style.borderColor = '';
                this.style.backgroundColor = '';
            }
        });
    }
});

// Validação de telefone
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
