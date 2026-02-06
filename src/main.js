import './styles/main.css';
import './styles/artboard.css';
import './styles/detail.css';
import { Artboard } from './components/Artboard.js';

document.querySelector('#app').innerHTML = `
  <div id="artboard" class="artboard">
    <div id="canvas" class="canvas-container">
      <!-- Art Items will be injected here -->
    </div>
  </div>
  <div id="detail-view" class="detail-view">
    <button id="close-detail" class="close-btn">Close [x]</button>
    <div class="detail-content">
      <h1 id="detail-title">Project Title</h1>
      <img id="detail-image" src="" style="width:100%; margin-top: 20px;">
      <p id="detail-desc" style="margin-top: 20px;">Project description goes here...</p>
    </div>
  </div>
`;

// Initialize the Artboard
const artboard = new Artboard(document.querySelector('#artboard'), document.querySelector('#canvas'));
artboard.init();

// Simple detail view logic (can be moved to a component later)
const detailView = document.getElementById('detail-view');
const closeBtn = document.getElementById('close-detail');

closeBtn.addEventListener('click', () => {
  detailView.classList.remove('active');
});

// Expose a way to open details (quick hack for prototype)
window.openDetail = (data) => {
  document.getElementById('detail-title').innerText = data.title;
  document.getElementById('detail-desc').innerText = data.desc;
  document.getElementById('detail-image').src = data.img;
  detailView.classList.add('active');
};
