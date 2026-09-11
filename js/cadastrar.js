// Script para manipulação do formulário de cadastro

document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.form-cadastro');

    if (!form) {
        console.error('Formulário de cadastro não encontrado.');
        return;
    }

    form.addEventListener('submit', async function (e) {
        e.preventDefault();

        const novoPet = {
            nome: document.getElementById('nome').value.trim(),
            especie: document.getElementById('especie').value.trim(),
            raca: document.getElementById('raca').value.trim(),
            porte: document.getElementById('porte').value.trim(),
            cor: document.getElementById('cor').value.trim(),
            cidade: document.getElementById('cidade').value.trim(),
            data: document.getElementById('data').value,
            local: document.getElementById('local').value.trim(),
            contato: document.getElementById('contato').value.trim()
        };

        try {
            alert('Pet cadastrado com sucesso!');
            form.reset();
        } catch (erro) {
            console.error('Erro ao cadastrar pet:', erro);
            alert('Erro ao cadastrar pet.');
        }
    });
});