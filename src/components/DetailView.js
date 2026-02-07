export class DetailView {
    constructor() {
        this.overlay = document.getElementById('detail-view');
        this.closeBtn = document.getElementById('close-detail');
        this.contentContainer = this.overlay.querySelector('.detail-content');

        // Bind events
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) this.close();
        });

        this.isActive = false;
    }

    open(data) {
        this.isActive = true;

        // 1. Populate Text Metadata (Instant)
        // We rebuild the DOM to ensure clean state and lazy loading
        this.contentContainer.innerHTML = `
            <div class="detail-header">
                <h1 class="detail-title">${data.title}</h1>
                <div class="detail-author">
                    <img src="${data.avatar}" alt="${data.author}" class="author-avatar">
                    <span class="author-name">${data.author}</span>
                </div>
            </div>
            
            <div class="detail-body">
                <p class="detail-desc">${data.description}</p>
                
                <div class="detail-gallery">
                    <!-- Images will be injected here -->
                </div>
            </div>
        `;

        // 2. Main Stage & Thumbnails
        // We redesign the structure:
        // [ Main Image Area ]
        // [ Thumbnail Strip ]

        const galleryContainer = this.contentContainer.querySelector('.detail-gallery');
        galleryContainer.innerHTML = ''; // Clear previous

        // Container for Main Stage
        const mainStage = document.createElement('div');
        mainStage.className = 'detail-main-stage';

        const mainImg = document.createElement('img');
        mainImg.src = data.img;
        mainImg.className = 'detail-main-img';
        mainStage.appendChild(mainImg);
        galleryContainer.appendChild(mainStage);

        // Container for Thumbnails
        const thumbStrip = document.createElement('div');
        thumbStrip.className = 'detail-thumbnails';

        // Combine all images (Hero + Gallery)
        const allImages = [data.img, ...data.gallery];

        allImages.forEach((imgSrc, index) => {
            const thumb = document.createElement('img');
            thumb.src = imgSrc;
            thumb.className = 'detail-thumb';
            if (index === 0) thumb.classList.add('active'); // First one active

            thumb.addEventListener('click', () => {
                // Update Main Image
                mainImg.src = imgSrc;

                // Update Active Styling
                thumbStrip.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
                thumb.classList.add('active');
            });

            thumbStrip.appendChild(thumb);
        });

        galleryContainer.appendChild(thumbStrip);

        // 4. Show Overlay
        this.overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    close() {
        this.isActive = false;
        this.overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling

        // Cleanup to free memory/stop pending requests if possible (browser handles this mostly)
        setTimeout(() => {
            this.contentContainer.innerHTML = '';
        }, 300); // Wait for transition
    }
}
