const API_URL = 'backend/api.php';

const ELEMENT_OPTIONS = [
    { id: 'flor_rosa', icon: '🌸' },
    { id: 'flor_amarela', icon: '🌼' },
    { id: 'flor_roxa', icon: '🌷' },
    { id: 'arvore', icon: '🌳' },
    { id: 'borboleta', icon: '🦋' },
    { id: 'passaro', icon: '🐦' },
    { id: 'sol', icon: '☀️' },
    { id: 'nuvem', icon: '☁️' }
];

let meuId = localStorage.getItem('jardim_uid') || 'u_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem('jardim_uid', meuId);

let selectedElement = null;
let isDragging = false;
let draggedElement = null;
let dragData = null;
let tempPos = null;

function showScreen(id) {
    document.querySelectorAll('main').forEach(m => m.classList.add('hidden'));
    const target = document.getElementById(`screen-${id}`);
    
    // Controlar visibilidade do botão no header
    const btnHeader = document.getElementById('btn-header-plant');
    if (id === 'garden') {
        if (btnHeader) btnHeader.classList.remove('hidden');
    } else {
        if (btnHeader) btnHeader.classList.add('hidden');
    }

    if (target) {
        target.classList.remove('hidden');
        target.classList.add('flex');
    }
    if (id === 'garden') carregarMensagens();
}

async function carregarMensagens() {
    try {
        const res = await fetch(API_URL);
        const mensagens = await res.json();
        const container = document.getElementById('garden-container');
        if (!container) return;
        container.innerHTML = '';
        
        mensagens.forEach(msg => {
            const elInfo = ELEMENT_OPTIONS.find(e => e.id === msg.element_id);
            if (!elInfo) return;

            const div = document.createElement('div');
            div.className = "absolute text-5xl cursor-move select-none z-30 transition-transform active:scale-110";
            div.style.left = msg.pos_x + '%';
            div.style.top = msg.pos_y + '%';
            div.style.transform = 'translate(-50%, -50%)';
            div.innerHTML = elInfo.icon;
            
            // Lógica de Arrastar (Apenas se for o dono da flor)
            if (msg.creator_id === meuId) {
                div.onmousedown = (e) => {
                    e.stopPropagation(); // Impede de disparar o clique de "plantar" do container
                    startDrag(e, div, msg);
                };
            }

            // Clique para ler a mensagem
            div.onclick = (e) => {
                e.stopPropagation(); // Impede de disparar o clique de "plantar" do container
                if (div.dataset.moved === "true") {
                    div.dataset.moved = "false";
                    return;
                }
                openModal(msg, elInfo.icon);
            };

            container.appendChild(div);
        });
    } catch (e) { console.error("Erro ao carregar:", e); }
}

function startDrag(e, element, data) {
    isDragging = true;
    draggedElement = element;
    dragData = data;
    element.style.transition = 'none';
    element.dataset.moved = "false";

    document.onmousemove = (e) => doDrag(e);
    document.onmouseup = () => stopDrag();
}

function doDrag(e) {
    if (!isDragging || !draggedElement) return;
    const container = document.getElementById('garden-container');
    const rect = container.getBoundingClientRect();
    
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    if (x < 0) x = 0; if (x > 100) x = 100;
    if (y < 0) y = 0; if (y > 100) y = 100;

    draggedElement.style.left = x + '%';
    draggedElement.style.top = y + '%';
    draggedElement.dataset.moved = "true";
}

async function stopDrag() {
    if (!isDragging) return;
    isDragging = false;
    
    const x = parseFloat(draggedElement.style.left);
    const y = parseFloat(draggedElement.style.top);

    // Atualiza posição no banco de dados via PUT
    await fetch(API_URL, {
        method: 'PUT',
        body: JSON.stringify({
            id: dragData.id,
            creatorId: meuId,
            pos_x: x.toFixed(2),
            pos_y: y.toFixed(2)
        }),
        headers: { 'Content-Type': 'application/json' }
    });

    draggedElement.style.transition = 'transform 0.2s';
    document.onmousemove = null;
    document.onmouseup = null;
}

window.onload = () => {
    // Inicializar Grid de Seleção
    const grid = document.getElementById('elements-grid');
    if (grid) {
        ELEMENT_OPTIONS.forEach(el => {
            const b = document.createElement('button');
            b.className = "p-4 bg-white rounded-xl shadow text-4xl hover:bg-pink-50 transition-colors";
            b.innerHTML = `<div>${el.icon}</div><div class="text-xs font-bold text-gray-400 mt-1 uppercase">${el.id.replace('_', ' ')}</div>`;
            b.onclick = () => {
                selectedElement = el;
                showScreen('garden');
                // Pequena dica visual para o utilizador saber o que fazer
                const hint = document.querySelector('#screen-garden p');
                if (hint) hint.innerText = `📍 Clica no jardim para plantar o teu/tua ${el.icon}`;
            };
            grid.appendChild(b);
        });
    }

    // Clique no Jardim para definir posição da NOVA mensagem
    const gardenContainer = document.getElementById('garden-container');
    if (gardenContainer) {
        gardenContainer.onclick = (e) => {
            if (!selectedElement) return;

            const rect = gardenContainer.getBoundingClientRect();
            tempPos = {
                x: ((e.clientX - rect.left) / rect.width * 100).toFixed(2),
                y: ((e.clientY - rect.top) / rect.height * 100).toFixed(2)
            };

            document.getElementById('compose-icon').innerText = selectedElement.icon;
            showScreen('compose');
        };
    }

    // Configurações de botões básicos
    document.getElementById('btn-enter').onclick = () => showScreen('selection');
    document.getElementById('btn-header-plant').onclick = () => showScreen('selection');
    document.getElementById('btn-back-selection').onclick = () => showScreen('selection');
    document.getElementById('btn-close-modal').onclick = () => document.getElementById('modal-read').classList.add('hidden');

    // Submissão do Formulário (POST)
    document.getElementById('compose-form').onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('input-name').value;
        const text = document.getElementById('input-message').value;

        if (!selectedElement || !tempPos) return;

        const dados = {
            creatorId: meuId,
            elementId: selectedElement.id,
            author: name,
            text: text,
            pos: tempPos
        };

        try {
            await fetch(API_URL, {
                method: 'POST',
                body: JSON.stringify(dados),
                headers: { 'Content-Type': 'application/json' }
            });
            
            // Limpar estados
            selectedElement = null;
            tempPos = null;
            document.getElementById('input-name').value = '';
            document.getElementById('input-message').value = '';
            
            showScreen('garden');
        } catch (error) {
            console.error("Erro ao salvar:", error);
        }
    };
};

function openModal(msg, icon) {
    document.getElementById('modal-icon').innerText = icon;
    document.getElementById('modal-text').innerText = msg.texto;
    document.getElementById('modal-author').innerText = msg.author;
    document.getElementById('modal-read').classList.remove('hidden');
    
    const btnDel = document.getElementById('btn-delete');
    if (msg.creator_id === meuId) {
        btnDel.classList.remove('hidden');
        btnDel.onclick = async () => {
            await fetch(API_URL, {
                method: 'DELETE',
                body: JSON.stringify({ id: msg.id, creatorId: meuId }),
                headers: { 'Content-Type': 'application/json' }
            });
            document.getElementById('modal-read').classList.add('hidden');
            carregarMensagens();
        };
    } else {
        btnDel.classList.add('hidden');
    }
}