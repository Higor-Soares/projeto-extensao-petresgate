// Script para manipulação do formulário de cadastro

import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

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
            const inputFoto = document.getElementById('foto');
            if (inputFoto && inputFoto.files && inputFoto.files[0]) {
                const arquivo = inputFoto.files[0];
                const formData = new FormData();
                formData.append('file', arquivo);
                formData.append('upload_preset', 'petresgate');

                const resposta = await fetch(
                    'https://api.cloudinary.com/v1_1/dgtqihrfe/image/upload',
                    {
                        method: 'POST',
                        body: formData
                    }
                );

                if (!resposta.ok) {
                    throw new Error('Falha no upload da imagem para o Cloudinary');
                }

                const dadosImagem = await resposta.json();
                novoPet.foto = dadosImagem.secure_url;
            }

            const colecaoPets = collection(db, 'pets_perdidos');
            const docRef = await addDoc(colecaoPets, novoPet);

            console.log('Pet cadastrado no Firebase com ID:', docRef.id);
            alert('Pet cadastrado com sucesso!');
            form.reset();
        } catch (erro) {
            console.error('Erro ao cadastrar pet:', erro);
            alert('Erro ao cadastrar pet. Verifique o console do navegador.');
        }
    });
});