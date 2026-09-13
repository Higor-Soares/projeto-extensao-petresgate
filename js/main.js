import { db, collection, getDocs, onSnapshot } from './firebase-config.js';

const gradeCards = document.querySelector('.grade-cards');
const buscaForm = document.querySelector('.caixa-busca');
const buscaInput = document.querySelector('.caixa-busca input');
let pets = [];

function getImageUrl(pet) {
  if (!pet || typeof pet !== 'object') return null;
  const candidates = [
    'fotoUrl',
    'foto',
    'fotoURL',
    'image',
    'imagem',
    'imagemUrl',
    'imagemURL',
    'url'
  ];

  for (const key of candidates) {
    const val = pet[key];
    if (val && typeof val === 'string' && (/^(https?:\/\/|data:image\/)/i.test(val) || val.length > 50)) {
      return val;
    }
  }
  return null;
}

function criarCardPet(pet) {
  const imagem = getImageUrl(pet) || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80';
  const nome = pet.nome || pet.nomeAnimal || 'Pet para Adoção';
  const raca = pet.raca || 'SRD';
  const especie = pet.especie || 'Pet';
  const titulo = `${nome} • ${especie} (${raca})`;
  const local = pet.cidade ? `📍 ${pet.cidade}` : '📍 Cidade não informada';
  const detalhesCurto = pet.idade ? `Idade: ${pet.idade} ano(s) • ${pet.sexo || ''}` : (pet.descricaoAnimal || pet.descricao || 'Disponível para adoção responsável');

  return `
    <div class="card-pet">
      <img src="${imagem}" alt="Foto de ${nome}" onerror="this.src='https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80'">
      <div class="info-pet">
        <strong>${titulo}</strong>
        <div>${local}</div>
        <div style="font-size: 0.9rem; color: #555; margin-top: 4px;">${detalhesCurto}</div>
        <div class="links-card" style="margin-top: 10px;">
          <a href="#" class="ver-detalhes" data-pet-id="${pet.id}">Quero Adotar / Detalhes</a>
        </div>
      </div>
    </div>
  `;
}

function renderizarPets(listaPets) {
  if (!gradeCards) return;
  if (listaPets.length === 0) {
    gradeCards.innerHTML = '<p class="nenhum-pet" style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">Nenhum animal para adoção encontrado.</p>';
    return;
  }

  gradeCards.innerHTML = listaPets.map(criarCardPet).join('');
}

function filtrarPets(termo) {
  const texto = termo.trim().toLowerCase();
  if (!texto) return pets;
  return pets.filter((pet) => {
    return [pet.nome, pet.nomeAnimal, pet.cidade, pet.raca, pet.especie, pet.descricaoAnimal, pet.descricao]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(texto));
  });
}

const modalDetalhes = document.getElementById('modalDetalhes');
const modalConteudo = document.getElementById('modalConteudo');
const botaoFecharModal = document.getElementById('fecharModal');

function abrirModal() {
  if (!modalDetalhes) return;
  modalDetalhes.classList.remove('hidden');
  modalDetalhes.setAttribute('aria-hidden', 'false');
}

function fecharModal() {
  if (!modalDetalhes || !modalConteudo) return;
  modalDetalhes.classList.add('hidden');
  modalDetalhes.setAttribute('aria-hidden', 'true');
  modalConteudo.innerHTML = '';
}

function montarDetalhes(pet) {
  const imagem = getImageUrl(pet) || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=700&q=80';
  const nome = pet.nome || pet.nomeAnimal || 'Pet sem nome';
  const especie = pet.especie || 'Não informado';
  const raca = pet.raca || 'Não informado';
  const idade = pet.idade !== undefined ? `${pet.idade} ano(s)` : 'Não informado';
  const sexo = pet.sexo || 'Não informado';
  const cidade = pet.cidade || 'Não informado';

  const vacinado = pet.vacinado === true ? 'Sim' : (pet.vacinado === false ? 'Não' : (pet.vacinado || 'Não informado'));
  const castrado = pet.castrado === true ? 'Sim' : (pet.castrado === false ? 'Não' : (pet.castrado || 'Não informado'));

  const saude = pet.cuidados || pet.problemasHealth || 'Nenhum problema informado';
  const doador = pet.nomeResponsvel || pet.nomeDoador || pet.contato || 'Responsável pelo pet';
  const telefone = pet.numeroTelefone || pet.telefone || pet.contato || 'Não informado';
  const descricao = pet.descricaoAnimal || pet.descricao || 'Sem descrição cadastrada.';

  return `
    <h2 style="margin: 0 0 10px 0; color: #181818;">${nome}</h2>
    <p style="margin-bottom: 16px; color: #444; line-height: 1.5;">${descricao}</p>
    <div class="linha" style="display: flex; gap: 20px; margin-bottom: 10px;">
      <span><strong>Espécie:</strong> ${especie}</span>
      <span><strong>Raça:</strong> ${raca}</span>
    </div>
    <div class="linha" style="display: flex; gap: 20px; margin-bottom: 10px;">
      <span><strong>Idade:</strong> ${idade}</span>
      <span><strong>Sexo:</strong> ${sexo}</span>
    </div>
    <div class="linha" style="display: flex; gap: 20px; margin-bottom: 10px;">
      <span><strong>Vacinado:</strong> ${vacinado}</span>
      <span><strong>Castrado:</strong> ${castrado}</span>
    </div>
    <p style="margin: 10px 0;"><strong>Cidade:</strong> ${cidade}</p>
    <p style="margin: 10px 0;"><strong>Saúde / Cuidados:</strong> ${saude}</p>
    <div style="margin-top: 20px; padding: 16px; background: #f0f7ff; border-radius: 10px; border: 1px solid #cce5ff;">
      <h4 style="margin: 0 0 8px 0; color: #1A4F9C;">Contato para Adoção:</h4>
      <p style="margin: 4px 0;"><strong>Responsável:</strong> ${doador}</p>
      <p style="margin: 4px 0;"><strong>Telefone/WhatsApp:</strong> ${telefone}</p>
    </div>
  `;
}

function abrirDetalhesPet(petId) {
  const pet = pets.find((item) => String(item.id) === String(petId));
  if (!pet || !modalConteudo) return;
  modalConteudo.innerHTML = montarDetalhes(pet);
  abrirModal();
}

if (gradeCards) {
  gradeCards.addEventListener('click', (e) => {
    const botao = e.target.closest('.ver-detalhes');
    if (!botao) return;
    e.preventDefault();
    const petId = botao.getAttribute('data-pet-id');
    if (petId) {
      abrirDetalhesPet(petId);
    }
  });
}

if (botaoFecharModal) {
  botaoFecharModal.addEventListener('click', fecharModal);
}

if (modalDetalhes) {
  modalDetalhes.addEventListener('click', (e) => {
    if (e.target === modalDetalhes) {
      fecharModal();
    }
  });
}

function carregarPetsDoFirebaseEmTempoReal() {
  if (!gradeCards) return;
  onSnapshot(collection(db, "animais"), (querySnapshot) => {
    pets = [];
    querySnapshot.forEach((docSnap) => {
      pets.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });
    renderizarPets(pets);
  }, (error) => {
    console.error("Erro ao carregar animais do Firebase:", error);
    if (gradeCards) {
      gradeCards.innerHTML = '<p class="nenhum-pet" style="grid-column: 1/-1; text-align: center; color: #d9534f; padding: 40px;">Erro ao carregar animais do Firebase.</p>';
    }
  });
}

if (buscaForm && buscaInput) {
  buscaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    renderizarPets(filtrarPets(buscaInput.value));
  });

  buscaInput.addEventListener('input', () => {
    renderizarPets(filtrarPets(buscaInput.value));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  carregarPetsDoFirebaseEmTempoReal();
});