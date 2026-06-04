// Script para manipulação do formulário de login

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.form-login');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            // Aqui você pode adicionar validações antes do redirecionamento
            window.location.href = 'index.html';
        });
    }
}); 