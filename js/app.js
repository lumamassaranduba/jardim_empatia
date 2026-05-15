const API_URL = 'backend/api.php';

const ELEMENT_OPTIONS = [
    { id: 'flor_rosa', icon: '🌸', name: 'Flor Rosa', type: 'ground' },
    { id: 'flor_amarela', icon: '🌼', name: 'Flor Amarela', type: 'ground' },
    { id: 'flor_roxa', icon: '🌷', name: 'Tulipa', type: 'ground' },
    { id: 'arvore', icon: '🌳', name: 'Árvore', type: 'ground' },
    { id: 'borboleta', icon: '🦋', name: 'Borboleta', type: 'air' },
    { id: 'passaro', icon: '🐦', name: 'Passarinho', type: 'air' },
    { id: 'sol', icon: '☀️', name: 'Sol Brilhante', type: 'sky' },
    { id: 'nuvem', icon: '☁️', name: 'Nuvem Suave', type: 'sky' }
];

let meuId = localStorage.getItem('jardim_meu_id');
if (!meuId) {
    meuId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('jardim_meu_id', meuId);
}

let selectedElement = null;

function showScreen(screenId) {
    ['welcome', 'selection', 'compose', 'garden'].forEach(id => {
        const el = document.getElementById(`screen-${id}`);
        el.classList.add('hidden');
        el.classList.remove('flex');
    });
    
    const target = document.getElementById(`screen-${screenId}`);
    target.classList.remove('hidden');
    target.classList.add('flex');

    const headerBtn = document.getElementById('btn-header-plant');
    if (screenId === 'garden') {
        headerBtn.classList.remove('hidden');
        carregarMensagens();
    } else {
        headerBtn.classList.add('hidden');
    }
}

function generatePosition(type) {
    const x = Math.floor(Math.random() * 80) + 10;
    let y;
    if (type === 'sky') y = Math.floor(Math.random() * 25) + 5;
    else if (type === 'air') y = Math.floor(Math.random() * 30) + 35;
    else y = Math.floor(Math.random() * 25) + 65;
    return { x, y };
}

function renderElementsGrid() {
    const grid = document.getElementById('elements-grid');
    grid.innerHTML = '';
    ELEMENT_OPTIONS.forEach(el => {
        const btn = document.createElement('button');
        btn.className = "flex flex-col items-center p-6 bg-white rounded-2xl shadow-md border-2 border-transparent hover:border-brand-pink hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer";
        btn.innerHTML = `<span class="text-6xl mb-3">${el.icon}</span><span class="font-bold text-gray-700">${el.name}</span>`;
        btn.onclick = () => {
            selectedElement = el;
            document.getElementById('compose-icon').innerText = el.icon;
            showScreen('compose');
        };
        grid.appendChild(btn);
    });
}

async function carregarMensagens() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        renderizarJardim(data);
    } catch (error) {
        console.error("Erro ao carregar mensagens:", error);
    }
}

function renderizarJardim(mensagens) {
    const container = document.getElementById('garden-container');
    container.innerHTML = '';
    mensagens.forEach((msg, index) => {
        const elementData = ELEMENT_OPTIONS.find(e => e.id === msg.element_id);
        if (!elementData) return;
        const isEven = index % 2 === 0;
        const btn = document.createElement('button');
        btn.className = `absolute text-5xl md:text-6xl cursor-pointer hover:scale-125 transition-transform duration-200 ${isEven ? 'animate-float' : 'animate-float-delayed'}`;
        btn.style.left = `${msg.pos_x}%`;
        btn.style.top = `${msg.pos_y}%`;
        btn.style.transform = 'translate(-50%, -50%)';
        btn.style.zIndex = Math.floor(msg.pos_y);
        btn.innerHTML = `<span class="drop-shadow-lg filter">${elementData.icon}</span>`;
        btn.onclick = () => openModal(msg, elementData);
        container.appendChild(btn);
    });
}

document.getElementById('compose-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('input-name').value.trim();
    const text = document.getElementById('input-message').value.trim();
    if (!name || !text || !selectedElement) return;
    const novaMensagem = {
        creatorId: meuId,
        elementId: selectedElement.id,
        author: name,
        text: text,
        pos: generatePosition(selectedElement.type)
    };
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(novaMensagem),
            headers: { 'Content-Type': 'application/json' }
        });
        document.getElementById('input-name').value = '';
        document.getElementById('input-message').value = '';
        showScreen('garden');
    } catch (error) {
        console.error("Erro ao salvar mensagem: ", error);
    }
});

function openModal(msg, elementData) {
    document.getElementById('modal-icon').innerText = elementData.icon;
    document.getElementById('modal-text').innerText = `"${msg.texto}"`;
    document.getElementById('modal-author').innerText = msg.author;
    const btnDelete = document.getElementById('btn-delete');
    if (msg.creator_id === meuId) {
        btnDelete.classList.remove('hidden');
        btnDelete.onclick = async () => {
            await fetch(API_URL, {
                method: 'DELETE',
                body: JSON.stringify({ id: msg.id, creatorId: meuId }),
                headers: { 'Content-Type': 'application/json' }
            });
            closeModal();
            carregarMensagens();
        };
    } else {
        btnDelete.classList.add('hidden');
    }
    document.getElementById('modal-read').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modal-read').classList.add('hidden');
}

setInterval(() => {
    if(!document.getElementById('screen-garden').classList.contains('hidden')) carregarMensagens();
}, 5000);

document.getElementById('btn-enter').onclick = () => showScreen('selection');
document.getElementById('btn-header-plant').onclick = () => showScreen('selection');
document.getElementById('btn-back-selection').onclick = () => showScreen('selection');
document.getElementById('btn-close-modal').onclick = closeModal;
renderElementsGrid();