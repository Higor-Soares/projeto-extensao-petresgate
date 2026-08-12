import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const gradeCards = document.querySelector('.grade-cards');
const buscaForm = document.querySelector('.caixa-busca');
const buscaInput = document.querySelector('.caixa-busca input');
let pets = [];

function criarCardPet(pet) {
  const imagem = getImageUrl(pet) || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80';
  const nome = pet.nome || pet.nomeAnimal || 'Pet para Adoção';
  const raca = pet.raca || 'SRD';
  const especie = pet.especie || 'Pet';
  const titulo = `${nome} • ${especie} (${raca})`;
  const local = pet.cidade ? `📍 ${pet.cidade}` : '📍 Cidade não informada';
  const detalhesCurto = pet.idade ? `Idade: ${pet.idade} ano(s) • ${pet.sexo || ''}` : (pet.descricao || 'Disponível para adoção responsável');

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

function getImageUrl(pet) {
  if (!pet || typeof pet !== 'object') return null;
  const candidates = [
    'foto',
    'fotoUrl',
    'fotoURL',
    'image',
    'imagem',
    'imagemUrl',
    'imagemURL',
    'url',
    'secure_url',
    'secureUrl',
    'arquivo'
  ];

  for (const key of candidates) {
    const val = pet[key];
    if (val && typeof val === 'string' && (/^(https?:\/\/|data:image\/)/i.test(val) || val.length > 50)) {
      return val;
    }
  }

  for (const k in pet) {
    const v = pet[k];
    if (v && typeof v === 'object') {
      if (typeof v.secure_url === 'string') return v.secure_url;
      if (typeof v.url === 'string') return v.url;
    }
  }

  return null;
}

function renderizarPets(listaPets) {
  if (!gradeCards) return;
  if (listaPets.length === 0) {
    gradeCards.innerHTML = '<p class="nenhum-pet" style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">Nenhum animal para adoção encontrado com este filtro.</p>';
    return;
  }

  gradeCards.innerHTML = listaPets.map(criarCardPet).join('');
}

function filtrarPets(termo) {
  const texto = termo.trim().toLowerCase();
  if (!texto) return pets;
  return pets.filter((pet) => {
    return [pet.nome, pet.nomeAnimal, pet.cidade, pet.raca, pet.especie, pet.descricao]
      .filter(Boolean)
      .some((valor) => valor.toLowerCase().includes(texto));
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
  const idade = pet.idade ? `${pet.idade} ano(s)` : 'Não informado';
  const sexo = pet.sexo || 'Não informado';
  const cidade = pet.cidade || 'Não informado';
  const vacinado = pet.vacinado || 'Não informado';
  const castrado = pet.castrado || 'Não informado';
  const saude = pet.problemasHealth || 'Nenhum problema informado';
  const doador = pet.nomeDoador || pet.contato || 'Responsável pelo pet';
  const telefone = pet.telefone || pet.contato || 'Não informado';
  const descricao = pet.descricao || 'Sem descrição cadastrada.';

  return `
    <img src="${imagem}" alt="Foto de ${nome}" style="width: 100%; max-height: 320px; object-fit: cover; border-radius: 12px; margin-bottom: 16px;">
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
  const pet = pets.find((item) => item.id === petId);
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

async function carregarPets() {
  if (!gradeCards) return;
  gradeCards.innerHTML = '<p class="carregando-pets" style="grid-column: 1/-1; text-align: center; color: #666; padding: 40px;">Carregando animais para adoção...</p>';

  try {
    let lista = [];

    // Tenta carregar da coleção 'pets' (usada no admin)
    try {
      const snapPets = await getDocs(collection(db, 'pets'));
      lista = snapPets.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
    } catch (e1) {
      console.warn('Coleção pets não encontrada, tentando fallback...', e1);
    }

    // Se estiver vazia, tenta a coleção 'pets'
    if (lista.length === 0) {
      try {
        const snapPerdidos = await getDocs(collection(db, 'pets'));
        lista = snapPerdidos.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      } catch (e2) {
        console.warn('Coleção pets não encontrada:', e2);
      }
    }

    pets = lista;
    // Ordena por nome
    pets.sort((a, b) => (a.nome || a.nomeAnimal || '').localeCompare(b.nome || b.nomeAnimal || ''));

    renderizarPets(pets);
  } catch (erro) {
    console.error('Erro ao carregar pets:', erro);
    gradeCards.innerHTML = '<p class="erro-pets" style="grid-column: 1/-1; text-align: center; color: #dc3545; padding: 40px;">Não foi possível carregar os animais no momento.</p>';
  }
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

carregarPets();