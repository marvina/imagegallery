import './styles/main.css';
import './styles/artboard.css';
import './styles/detail.css';
import { Artboard } from './components/Artboard.js';

document.querySelector('#app').innerHTML = `
  <div id="filter-bar" class="filter-bar">
    <button class="filter-btn active" data-tag="All">All</button>
    <!-- Dynamic tags will be injected here -->
  </div>
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
  <div class="vignette-overlay"></div>
`;

import { DetailView } from './components/DetailView.js';

// Initialize the Artboard
const artboard = new Artboard(document.querySelector('#artboard'), document.querySelector('#canvas'));
window.artboard = artboard; // Expose for debugging
artboard.init();

// Initialize Detail View
const detailView = new DetailView();

// Bridge: Allow Artboard to open detail view
window.openDetail = (data) => {
  detailView.open(data);
};

// Filter Logic
// Filter Logic & Dynamic Loading
async function initFilters() {
  const { fetchTags } = await import('./services/strapi.js');
  const tags = await fetchTags();

  const filterBar = document.getElementById('filter-bar');

  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.tag = tag;
    btn.textContent = tag;
    filterBar.appendChild(btn);
  });

  // Event Delegation for all buttons (static + dynamic)
  filterBar.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      // UI Update
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      // Filter Artboard
      const tag = e.target.dataset.tag;
      artboard.filter(tag);
    }
  });
}

initFilters();
