 const canvas = document.getElementById('canvas');
function addPage() {
  const page = document.createElement('div');
  page.className = 'page';
  canvas.appendChild(page);
}

const jsonInput = document.getElementById('jsonInput');
const editor = document.getElementById('editor');
const editorInput = document.getElementById('editorInput');
let selectedElement = null;
let elementId = 0;

function makeDraggable(el) {
  let isDragging = false, startX, startY, initialLeft, initialTop;

  el.addEventListener('mousedown', (e) => {
    if (e.target.closest('img')) return;

    isDragging = true;

    const rect = el.getBoundingClientRect();
    const canvasRect = canvas.getBoundingClientRect();

    startX = e.clientX;
    startY = e.clientY;
    initialLeft = parseInt(el.style.left || 0);
    initialTop = parseInt(el.style.top || 0);

    el.style.zIndex = 1000;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      el.style.left = initialLeft + dx + 'px';
      el.style.top = initialTop + dy + 'px';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      el.style.zIndex = '';
    }
  });
}

function selectElement(el) {
  if (selectedElement) {
    selectedElement.classList.remove('selected');
  }
  selectedElement = el;
  el.classList.add('selected');

  const type = el.getAttribute('data-type');
  if (type === 'image') {
    editorInput.value = '[Imagem] (não editável)';
    editorInput.disabled = true;
  } else {
    editorInput.value = el.innerHTML;
    editorInput.disabled = false;
    editorInput.focus();
  }

  editor.style.display = 'block';
}

editorInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (selectedElement && !editorInput.disabled) {
      selectedElement.innerHTML = editorInput.value;
    }
  }
});

function createElement(type, content, x = 50, y = 50) {
  const el = document.createElement('div');
  el.className = 'element';
  el.setAttribute('data-id', ++elementId);
  el.setAttribute('data-type', type);
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.userSelect = 'none';

  if (type === 'title') {
    el.style.fontSize = '20px';
    el.innerHTML = content || '<strong>Título</strong>';
  } else if (type === 'text') {
    el.innerText = content || 'Texto editável';
  } else if (type === 'image') {
    el.classList.add('image-drop');
    if (content && content.startsWith('data:image')) {
      el.innerHTML = '';
      const img = document.createElement('img');
      img.src = content;
      el.appendChild(img);
    } else {
      el.innerHTML = 'Cole uma imagem aqui (Ctrl+V)';
    }
  } else if (type === 'shape') {
    el.style.width = '100px';
    el.style.height = '100px';
    el.style.backgroundColor = '#007bff';
    el.style.border = '2px solid #000';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.textAlign = 'center';
    el.style.color = '#fff';
    el.innerHTML = content || 'Forma';
  }

  el.addEventListener('paste', function (e) {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = function (event) {
          el.innerHTML = '';
          const img = document.createElement('img');
          img.src = event.target.result;
          el.appendChild(img);
          img.onload = () => {
            el.style.width = img.naturalWidth + 'px';
            el.style.height = img.naturalHeight + 'px';
          };
        };
        reader.readAsDataURL(file);
        e.preventDefault();
        break;
      }
    }
  });

  el.addEventListener('click', (e) => {
    if (e.ctrlKey || e.metaKey) {
      el.remove();
      if (selectedElement === el) {
        selectedElement = null;
        editor.style.display = 'none';
      }
    } else {
      selectElement(el);
    }
  });

  canvas.appendChild(el);
  makeDraggable(el);
  return el;
}

function addText() {
  const pos = getNextElementPosition();
  const div = document.createElement('div');
  div.className = 'element';
  div.contentEditable = true;
  div.innerHTML = 'Texto';
  div.style.left = pos.left + 'px';
  div.style.top = pos.top + 'px';
  div.setAttribute('data-type', 'text');

  canvas.appendChild(div);
  makeDraggable(div);
  div.addEventListener('click', () => selectElement(div));
  selectElement(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


function addTitle() {
  const pos = getNextElementPosition();
  const div = document.createElement('div');
  div.className = 'element';
  div.contentEditable = true;
  div.innerHTML = '<strong>Título</strong>';
  div.style.left = pos.left + 'px';
  div.style.top = pos.top + 'px';
  div.style.fontSize = '24px';
  div.setAttribute('data-type', 'title');

  canvas.appendChild(div);
  makeDraggable(div);
  div.addEventListener('click', () => selectElement(div));
  selectElement(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function addImage() {
  const pos = getNextElementPosition();
  const div = document.createElement('div');
  div.className = 'element image-drop';
  div.style.left = pos.left + 'px';
  div.style.top = pos.top + 'px';
  div.style.width = '150px';
  div.style.height = '100px';
  div.setAttribute('data-type', 'image');

  // Texto que some depois de adicionar imagem real, só pra interface
  div.textContent = 'Solte uma imagem aqui';

  // Habilitar drop e upload depois (se já tiver no seu código)

  canvas.appendChild(div);
  makeDraggable(div);
  div.addEventListener('click', () => selectElement(div));
  selectElement(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function exportPDF() {
  const opt = {
    margin: 0,
    filename: 'canvas-manual.pdf',
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'px', format: [canvas.offsetWidth, canvas.offsetHeight], orientation: 'portrait' }
  };
const tempCanvas = document.createElement('div');
tempCanvas.innerHTML = canvas.innerHTML;
tempCanvas.querySelectorAll('.element').forEach(el => {
  el.style.position = 'absolute';
});

  html2pdf().set(opt).from(canvas.innerHTML).save();
}

function saveJSON() {
  const elements = canvas.querySelectorAll('.element');
  const data = [];

  elements.forEach(el => {
    const type = el.getAttribute('data-type');
    const x = parseInt(el.style.left || 0);
    const y = parseInt(el.style.top || 0);
    let content = '';

    if (type === 'image') {
      const img = el.querySelector('img');
      content = img ? img.src : null;
    } else {
      content = el.innerHTML;
    }

    const style = {
      width: el.style.width,
      height: el.style.height,
      backgroundColor: el.style.backgroundColor,
      border: el.style.border,
      borderRadius: el.style.borderRadius,
      color: el.style.color,
      fontSize: el.style.fontSize,
      textAlign: el.style.textAlign,
      display: el.style.display,
      justifyContent: el.style.justifyContent,
      alignItems: el.style.alignItems
    };

    data.push({ type, x, y, content, style });
  });

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'canvas-project.json';
  a.click();
  URL.revokeObjectURL(url);
}

function loadFromFile() {
  jsonInput.value = '';
  jsonInput.click();
}

jsonInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const data = JSON.parse(evt.target.result);
      canvas.innerHTML = '';
      editor.style.display = 'none';
      selectedElement = null;

      data.forEach(item => {
        const el = createElement(item.type, item.content, item.x, item.y);

        if (item.style) {
          Object.entries(item.style).forEach(([key, value]) => {
            el.style[key] = value;
          });
        }

        if (item.type !== 'image') {
          el.innerHTML = item.content;
        }
      });

    } catch {
      alert('Arquivo JSON inválido!');
    }
  };
  reader.readAsText(file);
});

document.addEventListener('paste', function (e) {
  if (!selectedElement || selectedElement.getAttribute('data-type') !== 'image') return;

  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.indexOf("image") !== -1) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = function (event) {
        selectedElement.innerHTML = '';
        const img = document.createElement('img');
        img.src = event.target.result;
        selectedElement.appendChild(img);
        img.onload = () => {
          selectedElement.style.width = img.naturalWidth + 'px';
          selectedElement.style.height = img.naturalHeight + 'px';
        };
      };
      reader.readAsDataURL(file);
      e.preventDefault();
      break;
    }
  }
});

function alignCenter() {
  if (!selectedElement) return;
  const elWidth = selectedElement.offsetWidth;
  const newLeft = (canvas.clientWidth - elWidth) / 2;
  selectedElement.style.left = newLeft + 'px';
}

function alignMiddle() {
  if (!selectedElement) return;
  const elHeight = selectedElement.offsetHeight;
  const newTop = (canvas.clientHeight - elHeight) / 2;
  selectedElement.style.top = newTop + 'px';
}

function alignLeft() {
  if (!selectedElement) return;
  selectedElement.style.left = '0px';
}

function duplicateElement() {
  if (!selectedElement) return;

  const type = selectedElement.getAttribute('data-type');
  const x = parseInt(selectedElement.style.left || 0) + 20;
  const y = parseInt(selectedElement.style.top || 0) + 20;
  const content = selectedElement.innerHTML;

  let newEl;
  if (type === 'shape') {
    newEl = createElement('shape', content, x, y);
    newEl.style.cssText = selectedElement.style.cssText;
    newEl.innerHTML = selectedElement.innerHTML;
  } else {
    newEl = createElement(type, content, x, y);
    if (type !== 'image') {
      newEl.innerHTML = content;
    }
  }

  selectElement(newEl);
}

function openTab(name) {
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.style.display = 'none');
  document.getElementById('tab-' + name).style.display = 'flex';
}

function addShape(shape) {
  const pos = getNextElementPosition();
  const div = document.createElement('div');
  div.className = 'element';
  div.style.position = 'absolute';
  div.style.left = pos.left + 'px';
  div.style.top = pos.top + 'px';
  div.setAttribute('data-type', 'shape');

  // Reset estilos que podem interferir (especialmente para triângulo)
  div.style.width = '';
  div.style.height = '';
  div.style.backgroundColor = '';
  div.style.border = '';
  div.style.borderRadius = '';
  div.style.padding = '0';

  switch (shape) {
    case 'square':
      div.style.width = '100px';
      div.style.height = '100px';
      div.style.backgroundColor = '#ddd';
      break;

    case 'circle':
      div.style.width = '100px';
      div.style.height = '100px';
      div.style.backgroundColor = '#ddd';
      div.style.borderRadius = '50%';
      break;

    case 'rectangle':
      div.style.width = '150px';
      div.style.height = '80px';
      div.style.backgroundColor = '#ddd';
      break;

    case 'triangle':
      div.style.width = '0';
      div.style.height = '0';
      div.style.borderLeft = '50px solid transparent';
      div.style.borderRight = '50px solid transparent';
      div.style.borderBottom = '100px solid #ddd';
      div.style.backgroundColor = 'transparent';
      break;

    case 'ellipse':
      div.style.width = '150px';
      div.style.height = '100px';
      div.style.backgroundColor = '#ddd';
      div.style.borderRadius = '50% / 70%';
      break;
  }

  canvas.appendChild(div);
  makeDraggable(div);
  div.addEventListener('click', () => selectElement(div));
  selectElement(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'center' });
}


function changeBackgroundColor(color) {
  if (!selectedElement) return;
  selectedElement.style.backgroundColor = color;
}

function changeBorderColor(color) {
  if (!selectedElement) return;
  selectedElement.style.borderColor = color;
}
// Variáveis globais para agrupar
let groupingMode = false;
let groupSelection = new Set();

// Atualiza seleção visual durante agrupamento
function toggleGroupSelection(el) {
  if (groupSelection.has(el)) {
    groupSelection.delete(el);
    el.classList.remove('group-selected');
  } else {
    groupSelection.add(el);
    el.classList.add('group-selected');
  }
}

// Adiciona estilos para seleção de grupo
const style = document.createElement('style');
style.textContent = `
  .group-selected {
    border: 3px solid orange !important;
  }
`;
document.head.appendChild(style);

// Modifica selectElement para lidar com agrupamento
function selectElement(el, event = null) {
  if (groupingMode && event && event.altKey) {
    toggleGroupSelection(el);
    return;
  }
  
  if (selectedElement) {
    selectedElement.classList.remove('selected');
  }
  selectedElement = el;
  el.classList.add('selected');
  
  const type = el.getAttribute('data-type');
  if (type === 'image') {
    editorInput.value = '[Imagem] (não editável)';
    editorInput.disabled = true;
  } else {
    editorInput.value = el.innerHTML;
    editorInput.disabled = false;
    editorInput.focus();
  }
  editor.style.display = 'block';
}

// Intercepta clicks nos elementos para seleção / agrupamento
canvas.addEventListener('click', e => {
  const el = e.target.closest('.element');
  if (!el) return;

  if (groupingMode && e.altKey) {
    toggleGroupSelection(el);
    e.preventDefault();
    return;
  }

  if (e.ctrlKey || e.metaKey) {
    el.remove();
    if (selectedElement === el) {
      selectedElement = null;
      editor.style.display = 'none';
    }
  } else {
    selectElement(el, e);
  }
});

// Botão para ativar/desativar modo agrupamento
function toggleGroupingMode() {
  groupingMode = !groupingMode;
  groupSelection.clear();
  // Remove seleção visual anterior
  document.querySelectorAll('.group-selected').forEach(el => el.classList.remove('group-selected'));
  alert(groupingMode 
    ? 'Modo Agrupamento ativado: Segure Alt e clique nos elementos que deseja agrupar. Solte Alt para agrupar.'
    : 'Modo Agrupamento desativado.');
}

// Detecta quando usuário solta Alt para finalizar agrupamento
document.addEventListener('keyup', (e) => {
  if (groupingMode && e.key === 'Alt') {
    if (groupSelection.size > 1) {
      groupElements([...groupSelection]);
    }
    groupingMode = false;
    groupSelection.clear();
    document.querySelectorAll('.group-selected').forEach(el => el.classList.remove('group-selected'));
  }
});

// Função que cria um grupo dos elementos selecionados
function groupElements(elements) {
  if (!elements.length) return;
  
  // Calcula bounding box do grupo
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  elements.forEach(el => {
    const x = parseInt(el.style.left);
    const y = parseInt(el.style.top);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  });

  // Cria container grupo
  const group = document.createElement('div');
  group.className = 'element group';
  group.style.position = 'absolute';
  group.style.left = minX + 'px';
  group.style.top = minY + 'px';
  group.style.width = (maxX - minX) + 'px';
  group.style.height = (maxY - minY) + 'px';
  group.style.border = '2px solid orange';
  group.style.backgroundColor = 'rgba(255, 165, 0, 0.1)';
  group.style.boxSizing = 'border-box';
  group.setAttribute('data-type', 'group');

  // Move os elementos para dentro do grupo, ajustando posição relativa
  elements.forEach(el => {
    const x = parseInt(el.style.left);
    const y = parseInt(el.style.top);
    el.style.left = (x - minX) + 'px';
    el.style.top = (y - minY) + 'px';
    group.appendChild(el);
  });

  canvas.appendChild(group);
  makeDraggable(group);
  selectElement(group);
}

// Alinhamentos adicionais:
function alignRight() {
  if (!selectedElement) return;
  const canvasWidth = canvas.clientWidth;
  const elWidth = selectedElement.offsetWidth;
  selectedElement.style.left = (canvasWidth - elWidth) + 'px';
}

function alignTop() {
  if (!selectedElement) return;
  selectedElement.style.top = '0px';
}

function alignBottom() {
  if (!selectedElement) return;
  const canvasHeight = canvas.clientHeight;
  const elHeight = selectedElement.offsetHeight;
  selectedElement.style.top = (canvasHeight - elHeight) + 'px';
}

function alignTopLeft() {
  if (!selectedElement) return;
  selectedElement.style.top = '0px';
  selectedElement.style.left = '0px';
}

function alignTopRight() {
  if (!selectedElement) return;
  const canvasWidth = canvas.clientWidth;
  const elWidth = selectedElement.offsetWidth;
  selectedElement.style.top = '0px';
  selectedElement.style.left = (canvasWidth - elWidth) + 'px';
}

function alignBottomLeft() {
  if (!selectedElement) return;
  const canvasHeight = canvas.clientHeight;
  const elHeight = selectedElement.offsetHeight;
  selectedElement.style.top = (canvasHeight - elHeight) + 'px';
  selectedElement.style.left = '0px';
}

function alignBottomRight() {
  if (!selectedElement) return;
  const canvasWidth = canvas.clientWidth;
  const elWidth = selectedElement.offsetWidth;
  const canvasHeight = canvas.clientHeight;
  const elHeight = selectedElement.offsetHeight;
  selectedElement.style.top = (canvasHeight - elHeight) + 'px';
  selectedElement.style.left = (canvasWidth - elWidth) + 'px';
}

// Novas formas: retângulo, triângulo, elipse
function addShape(type) {
  const el = document.createElement('div');
  el.className = 'element shape';
  el.setAttribute('data-id', ++elementId);
  el.setAttribute('data-type', 'shape');
  el.contentEditable = true;
  el.style.left = '100px';
  el.style.top = '100px';
  el.style.color = '#fff';
  el.style.display = 'flex';
  el.style.alignItems = 'center';
  el.style.justifyContent = 'center';
  el.style.textAlign = 'center';
  el.style.userSelect = 'text';

  if (type === 'square') {
    el.style.width = '120px';
    el.style.height = '120px';
    el.style.backgroundColor = '#007bff';
    el.style.border = '2px solid #000';
    el.style.borderRadius = '0';
    el.innerText = 'Quadrado';
  } else if (type === 'circle') {
    el.style.width = '120px';
    el.style.height = '120px';
    el.style.backgroundColor = '#28a745';
    el.style.border = '2px solid #000';
    el.style.borderRadius = '50%';
    el.innerText = 'Círculo';
  } else if (type === 'rectangle') {
    el.style.width = '160px';
    el.style.height = '100px';
    el.style.backgroundColor = '#ffc107';
    el.style.border = '2px solid #000';
    el.style.borderRadius = '0';
    el.innerText = 'Retângulo';
  } else if (type === 'triangle') {
    el.style.width = '0';
    el.style.height = '0';
    el.style.borderLeft = '60px solid transparent';
    el.style.borderRight = '60px solid transparent';
    el.style.borderBottom = '120px solid #dc3545';
    el.style.backgroundColor = 'transparent';
    el.style.color = 'transparent';
    el.innerText = '';
  } else if (type === 'ellipse') {
    el.style.width = '160px';
    el.style.height = '100px';
    el.style.backgroundColor = '#17a2b8';
    el.style.border = '2px solid #000';
    el.style.borderRadius = '50% / 100%';
    el.innerText = 'Elipse';
  }

  el.addEventListener('click', (e) => {
    if (groupingMode && e.altKey) {
      toggleGroupSelection(el);
      e.preventDefault();
      return;
    }
    if (e.ctrlKey || e.metaKey) {
      el.remove();
    } else {
      selectElement(el, e);
    }
  });

  canvas.appendChild(el);
  makeDraggable(el);
  selectElement(el);
}
  window.onload = () => {
    addPage();
  };

function getNextElementPosition() {
  const elements = canvas.querySelectorAll('.element');
  if (elements.length === 0) {
    return { left: 10, top: 10 };
  }

  let maxBottom = 0;
  elements.forEach(el => {
    const top = parseInt(el.style.top) || 0;

    // Para triângulos, definir altura fixa manualmente
    let height = el.offsetHeight;
    if (el.style.borderBottom && el.style.borderBottom !== '') {
      const borderBottom = window.getComputedStyle(el).borderBottomWidth;
      height = parseInt(borderBottom) || height;
    }

    const bottom = top + height;
    if (bottom > maxBottom) maxBottom = bottom;
  });

  const newTop = maxBottom + 10;
  return { left: 10, top: newTop };
}
