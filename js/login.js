import { auth, signInWithEmailAndPassword } from './firebase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('formLogin');
    const inputEmail = document.getElementById('email');
    const inputSenha = document.getElementById('senha');
    const botaoEntrar = document.getElementById('botaoEntrar');
    const mensagemErro = document.getElementById('mensagemErro');

    // Se já estiver logado, vai direto para o Admin
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        window.location.href = 'admin.html';
        return;
    }

    // Lista de e-mails de administradores autorizados
    const ADMINS_AUTORIZADOS = [
        'paulaleite.tech@gmail.com',
        'beatrizgarajau@outlook.com',
        'higordinz@gmail.com'
    ];

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
                botaoEntrar.textContent = 'Autenticando no Firebase...';
            }
            ocultarErro();

            try {
                // Tenta autenticar no Firebase Authentication
                const userCredential = await signInWithEmailAndPassword(auth, email, senha);
                const user = userCredential.user;
                const emailUsuario = (user.email || email).toLowerCase();

                // Verifica se o e-mail autenticado está na lista de administradores
                const eAdmin = ADMINS_AUTORIZADOS.some(admin => admin.toLowerCase() === emailUsuario);

                if (!eAdmin) {
                    exibirErro(`Acesso negado. O e-mail (${emailUsuario}) não tem permissão de administrador.`);
                    return;
                }

                // Armazena a sessão ativa do administrador
                sessionStorage.setItem('admin_logged_in', 'true');
                sessionStorage.setItem('admin_email', emailUsuario);
                
                window.location.href = 'admin.html';

            } catch (error) {
                console.error('Erro no Firebase Auth:', error);

                let mensagem = `Erro ao realizar login: ${error.message || error}`;
                
                if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
                    mensagem = 'E-mail ou senha incorretos. Verifique os dados digitados.';
                } else if (error.code === 'auth/too-many-requests') {
                    mensagem = 'Muitas tentativas incorretas. Tente novamente em alguns minutos.';
                } else if (error.code === 'auth/operation-not-allowed') {
                    mensagem = '⚠️ O provedor "E-mail/senha" não está ativado no Firebase Console (Authentication > Método de login).';
                }

                if (error.code) {
                    mensagem += ` (${error.code})`;
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
});