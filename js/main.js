import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js';

const gradeCards = document.querySelector('.grade-cards');
const buscaForm = document.querySelector('.caixa-busca');
const buscaInput = document.querySelector('.caixa-busca input');
let pets = [];

function criarCardPet(pet) {
  const imagem = getImageUrl(pet) || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80';
  const titulo = `${pet.nome || 'Pet sem nome'} • ${pet.raca || 'Sem raça'}`;
  const local = pet.cidade || 'Local não informado';
  const status = pet.data ? `Desaparecido em ${pet.data}` : 'Detalhes não informados';

  return `
    <div class="card-pet">
      <img src="${imagem}" alt="Foto de ${pet.nome || 'pet'}" onerror="this.src='https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=400&q=80'">
      <div class="info-pet">
        <strong>${titulo}</strong>
        <div>${local}</div>
        <div>${status}</div>
        <div class="links-card">
          <a href="#" class="ver-detalhes" data-pet-id="${pet.id}">Ver detalhes</a>
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
    if (val && typeof val === 'string' && /^https?:\/\//i.test(val)) return val;
  }

  // Search nested objects for a secure_url (e.g., saved Cloudinary response)
  for (const k in pet) {
    const v = pet[k];
    if (v && typeof v === 'object') {
      if (typeof v.secure_url === 'string' && /^https?:\/\//i.test(v.secure_url)) return v.secure_url;
      if (typeof v.url === 'string' && /^https?:\/\//i.test(v.url)) return v.url;
    }
  }

  return null;
}

function renderizarPets(listaPets) {
  if (!gradeCards) return;
  if (listaPets.length === 0) {
    gradeCards.innerHTML = '<p class="nenhum-pet">Nenhum pet cadastrado encontrado.</p>';
    return;
  }

  gradeCards.innerHTML = listaPets.map(criarCardPet).join('');
}

function filtrarPets(termo) {
  const texto = termo.trim().toLowerCase();
  if (!texto) return pets;
  return pets.filter((pet) => {
    return [pet.nome, pet.cidade, pet.raca, pet.local]
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
  const imagem = pet.foto || pet.fotoBase64 || 'https://images.unsplash.com/photo-1548199973-03fb7c89d4f2?auto=format&fit=crop&w=700&q=80';
  const nome = pet.nome || 'Pet sem nome';
  const especie = pet.especie || 'Não informado';
  const raca = pet.raca || 'Não informado';
  const porte = pet.porte || 'Não informado';
  const cor = pet.cor || 'Não informado';
  const cidade = pet.cidade || 'Não informado';
  const local = pet.local || 'Não informado';
  const data = pet.data || 'Não informado';
  const contato = pet.contato || 'Não informado';

  return `
    <img src="${imagem}" alt="Foto de ${nome}">
    <p><strong>Nome:</strong> ${nome}</p>
    <div class="linha">
      <span><strong>Espécie:</strong> ${especie}</span>
      <span><strong>Raça:</strong> ${raca}</span>
    </div>
    <div class="linha">
      <span><strong>Porte:</strong> ${porte}</span>
      <span><strong>Cor:</strong> ${cor}</span>
    </div>
    <div class="linha">
      <span><strong>Cidade:</strong> ${cidade}</span>
      <span><strong>Data:</strong> ${data}</span>
    </div>
    <p><strong>Local:</strong> ${local}</p>
    <p><strong>Contato:</strong> ${contato}</p>
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
  gradeCards.innerHTML = '<p class="carregando-pets">Carregando pets...</p>';

  try {
    const colecao = collection(db, 'pets_perdidos');
    const consulta = query(colecao, orderBy('nome'));
    const snapshot = await getDocs(consulta);
    pets = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log('pets carregados:', pets);
    pets.forEach(p => console.log('pet foto:', p.id, p.foto));
    renderizarPets(pets);
  } catch (erro) {
    console.error('Erro ao carregar pets:', erro);
    gradeCards.innerHTML = '<p class="erro-pets">Não foi possível carregar os pets no momento.</p>';
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