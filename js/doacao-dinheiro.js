// Script para funcionalidade de doação via PIX

function copiarChave(chave) {
    // Usando API Clipboard para copiar para área de transferência
    navigator.clipboard.writeText(chave).then(function() {
        // Mostrando notificação de sucesso
        const botao = event.target;
        const textoOriginal = botao.textContent;
        
        botao.textContent = '✓ Copiado!';
        botao.style.background = '#28a745';
        
        setTimeout(function() {
            botao.textContent = textoOriginal;
            botao.style.background = '';
        }, 2000);
    }).catch(function(err) {
        // Fallback se a API Clipboard não funcionar
        console.error('Erro ao copiar:', err);
        alert('Não foi possível copiar. Copie manualmente: ' + chave);
    });
}

// Registrando visualização/clique no QR Code
document.addEventListener('DOMContentLoaded', function() {
    const qrImage = document.querySelector('.qr-code-container img');
    
    if (qrImage) {
        qrImage.addEventListener('click', function() {
            registrarClique('qr_code_scanned');
        });
    }
    
    // Registrando cliques nos botões de copiar
    const botoesCopiar = document.querySelectorAll('.botao-copiar');
    botoesCopiar.forEach(botao => {
        botao.addEventListener('click', function() {
            const tipoChave = this.previousElementSibling.classList[0] || 'chave_desconhecida';
            registrarClique('chave_copiada_' + tipoChave);
        });
    });
});

function registrarClique(tipo) {
    const registro = {
        tipo: tipo,
        data: new Date().toLocaleString('pt-BR'),
        pagina: window.location.href
    };
    
    let registros = JSON.parse(localStorage.getItem('registrosDoacoes')) || [];
    registros.push(registro);
    localStorage.setItem('registrosDoacoes', JSON.stringify(registros));
    
    console.log('Clique registrado:', registro);
}

// Scroll suave para o QR Code
document.addEventListener('DOMContentLoaded', function() {
    const botoesAcao = document.querySelectorAll('.botao-copiar');
    
    botoesAcao.forEach(botao => {
        botao.addEventListener('click', function() {
            // Efeito visual adicional
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
});

// Melhorando acessibilidade
document.addEventListener('DOMContentLoaded', function() {
    const qrImage = document.querySelector('.qr-code-container img');
    
    if (qrImage) {
        qrImage.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                // Abrir opção para salvar/escanear
                console.log('QR Code selecionado via teclado');
            }
        });
    }
});

// Detectando se o usuário está em mobile para exibir melhor instruções
document.addEventListener('DOMContentLoaded', function() {
    const esMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (esMobile) {
        const instrucoes = document.querySelector('.forma-pagamento');
        if (instrucoes) {
            const aviso = document.createElement('div');
            aviso.style.cssText = `
                background: #e8f4f8;
                border-left: 4px solid #17a2b8;
                padding: 15px;
                margin-bottom: 15px;
                border-radius: 6px;
                color: #004085;
            `;
            aviso.innerHTML = '<strong>💡 Dica Mobile:</strong> Escaneie o QR Code direto com a câmera do seu celular!';
            instrucoes.insertBefore(aviso, instrucoes.firstChild);
        }
    }
});

// Analytics simples - registrando tempo gasto na página
let tempoInicio = Date.now();

window.addEventListener('beforeunload', function() {
    const tempoGasto = Math.round((Date.now() - tempoInicio) / 1000);
    const analise = {
        tempoNaPagina: tempoGasto + 's',
        dataVisita: new Date().toLocaleString('pt-BR'),
        url: window.location.href
    };
    
    let analises = JSON.parse(localStorage.getItem('analisesDoacoes')) || [];
    analises.push(analise);
    localStorage.setItem('analisesDoacoes', JSON.stringify(analises));
});

// Adicionando animação ao carregar a página
window.addEventListener('load', function() {
    const container = document.querySelector('.container-doacao');
    if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            container.style.transition = 'all 0.5s ease-out';
            container.style.opacity = '1';
            container.style.transform = 'translateY(0)';
        }, 100);
    }
});
