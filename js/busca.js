const inputBusca = document.querySelector('.caixa-busca input');
const botaoBusca = document.querySelector('.caixa-busca button');
const resultadosBusca = document.getElementById('resultadosBusca');
let petsCarregados = [];

function criarCartaoPet(pet) {
  const foto = pet.foto || pet.fotoBase64 || '';
  return `
    <article class="cartao-pet">
      <div class="cartao-pet-imagem">
        ${foto ? `<img src="${foto}" alt="Foto de ${pet.nome || 'pet'}">` : '<div class="sem-imagem">Sem imagem</div>'}
      </div>
      <div class="cartao-pet-conteudo">
        <h2>${pet.nome || 'Sem nome'}</h2>
        <p><strong>Espécie:</strong> ${pet.especie || 'Não informado'}</p>
        <p><strong>Raça:</strong> ${pet.raca || 'Não informado'}</p>
        <p><strong>Porte:</strong> ${pet.porte || 'Não informado'}</p>
        <p><strong>Cor:</strong> ${pet.cor || 'Não informado'}</p>
        <p><strong>Cidade:</strong> ${pet.cidade || 'Não informado'}</p>
        <p><strong>Local:</strong> ${pet.local || 'Não informado'}</p>
        <p><strong>Data:</strong> ${pet.data || 'Não informado'}</p>
        <p><strong>Contato:</strong> ${pet.contato || 'Não informado'}</p>
      </div>
    </article>
  `;
}

function renderizarResultados(pets) {
  if (!resultadosBusca) return;

  if (pets.length === 0) {
    resultadosBusca.innerHTML = '<p class="nenhum-resultado">Nenhum pet encontrado.</p>';
    return;
  }

  resultadosBusca.innerHTML = pets
    .map((pet) => criarCartaoPet(pet))
    .join('');
}

function filtrarPets(term) {
  const texto = term.trim().toLowerCase();
  if (!texto) {
    return petsCarregados;
  }

  return petsCarregados.filter((pet) => {
    const contemNome = pet.nome && pet.nome.toLowerCase().includes(texto);
    const contemCidade = pet.cidade && pet.cidade.toLowerCase().includes(texto);
    const contemLocal = pet.local && pet.local.toLowerCase().includes(texto);
    const contemEspecie = pet.especie && pet.especie.toLowerCase().includes(texto);
    return contemNome || contemCidade || contemLocal || contemEspecie;
  });
}

function configurarBusca() {
  if (!inputBusca || !botaoBusca) return;

  botaoBusca.addEventListener('click', () => {
    const resultado = filtrarPets(inputBusca.value);
    renderizarResultados(resultado);
  });

  inputBusca.addEventListener('input', () => {
    const resultado = filtrarPets(inputBusca.value);
    renderizarResultados(resultado);
  });
}

function carregarPets() {
  renderizarResultados(petsCarregados);
}

document.addEventListener('DOMContentLoaded', () => {
  carregarPets();
  configurarBusca();
});
