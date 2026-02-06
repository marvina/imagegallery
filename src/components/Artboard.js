import img1 from '../assets/spbsu-images-1.png';
import img2 from '../assets/spbsu-images-2.png';
import img3 from '../assets/spbsu-images-3.png';
import img4 from '../assets/spbsu-images-4.png';
import img5 from '../assets/spbsu-images-5.png';
import img6 from '../assets/spbsu-images-6.png';

export class Artboard {
    constructor(el, canvas) {
        this.el = el;
        this.canvas = canvas;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = -5000 + window.innerWidth / 2; // Center of 10000px canvas
        this.currentY = -100; // Start near top
        this.targetX = this.currentX;
        this.targetY = this.currentY;

        // Inertia
        this.vx = 0;
        this.vy = 0;
        this.friction = 0.92;
        this.rafId = null;

        const baseItems = [
            { title: 'SPBSU One', img: img1 },
            { title: 'SPBSU Two', img: img2 },
            { title: 'SPBSU Three', img: img3 },
            { title: 'SPBSU Four', img: img4 },
            { title: 'SPBSU Five', img: img5 },
            { title: 'SPBSU Six', img: img6 },
        ];

        // Generate massive amount of items (2400 items)
        this.items = [];
        this.renderedItems = new Map(); // Track currently rendered DOM nodes by ID

        for (let i = 0; i < 400; i++) { // 400 * 6 = 2400 items
            baseItems.forEach((item, index) => {
                this.items.push({
                    id: i * 6 + index + 1,
                    title: `${item.title} (v.${i + 1})`,
                    img: item.img,
                    // Simulate aspect ratio between 0.8 and 1.6
                    aspectRatio: 0.8 + Math.random() * 0.8
                });
            });
        }
    }

    init() {
        this.calculateLayout();
        // Center Viewport initially
        // We want 0,0 (visual center) to look at the center of the world
        // currentX/Y translates the world.
        // So currentX = -worldWidth/2 + window.innerWidth/2
        this.currentX = -this.worldWidth / 2 + window.innerWidth / 2;
        this.currentY = -this.worldHeight / 2 + window.innerHeight / 2;
        this.targetX = this.currentX;
        this.targetY = this.currentY;

        this.updateVirtualDOM();
        this.addEventListeners();
        this.animate();
    }

    calculateLayout() {
        const columnCount = 12;
        const colWidth = 350;
        const gap = 80;

        // Initialize column heights
        const colHeights = Array(columnCount).fill(0).map(() => Math.random() * 400);

        // Calculate needed width
        this.worldWidth = columnCount * colWidth + (columnCount - 1) * gap + gap; // Add gap for wrapping spacing

        const startX = 0; // Start at 0 for easier math
        const startY = 0;

        this.items.forEach((item) => {
            // Masonry: Find shortest column
            const minColHeight = Math.min(...colHeights);
            const colIndex = colHeights.indexOf(minColHeight);

            // Calculate exact height based on column width and SIMULATED aspect ratio
            const itemHeight = colWidth / item.aspectRatio;

            item.x = startX + colIndex * (colWidth + gap);
            item.y = startY + minColHeight;
            item.width = colWidth;
            item.height = itemHeight;

            // Update column height
            colHeights[colIndex] += itemHeight + gap;
        });

        this.worldHeight = Math.max(...colHeights);
        // We don't set canvas size anymore because it's infinite. 
        // The container just holds absolute positioned items.
    }

    updateVirtualDOM() {
        // Camera center in World Space
        const camCX = -this.currentX + window.innerWidth / 2;
        const camCY = -this.currentY + window.innerHeight / 2;

        const buffer = 1000;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const visibleIds = new Set();
        const itemsToRender = [];

        this.items.forEach(item => {
            // Toroidal Wrapping Logic
            // Find the instance of the item closest to the camera center

            // X Wrapping
            let distDisplayX = item.x - camCX;
            // Shift range to -W/2 to W/2
            let wrappedDistX = distDisplayX - Math.round(distDisplayX / this.worldWidth) * this.worldWidth;
            let virtualX = camCX + wrappedDistX;

            // Y Wrapping
            let distDisplayY = item.y - camCY;
            let wrappedDistY = distDisplayY - Math.round(distDisplayY / this.worldHeight) * this.worldHeight;
            let virtualY = camCY + wrappedDistY;

            // Check consistency - we want to be closer to "currentX" approach
            // Actually, item.x is static. usage: style.left = virtualX
            // But we have a container transform `translate(currentX, currentY)`
            // So visual position = virtualX + currentX

            // Let's optimize:
            // The item is "virtually" at item.x + k * worldW
            // We want (item.x + k*worldW) + currentX to be within screen [0, width]

            // k * worldW ~= -currentX - item.x
            const kX = Math.round((-this.currentX - item.x) / this.worldWidth);
            const kY = Math.round((-this.currentY - item.y) / this.worldHeight);

            const finalX = item.x + kX * this.worldWidth;
            const finalY = item.y + kY * this.worldHeight;

            // Check intersection with viewport (in Container Space relative to -currentX)
            // Viewport in container space: [-currentX, -currentX + width]
            // Item rect: [finalX, finalX + w]
            const minVpX = -this.currentX - buffer;
            const maxVpX = -this.currentX + width + buffer;
            const minVpY = -this.currentY - buffer;
            const maxVpY = -this.currentY + height + buffer;

            if (finalX < maxVpX && finalX + item.width > minVpX &&
                finalY < maxVpY && finalY + item.height > minVpY) {

                // Determine a unique render ID for this instance (since we might theoretically see 2 if world is small, but world is big)
                // For simplicity, assume world is big enough that we only see 1 instance.
                const renderId = `${item.id}`;
                itemsToRender.push({ ...item, renderId, x: finalX, y: finalY });
                visibleIds.add(renderId);
            }
        });

        // 1. Remove items no longer visible
        for (const [id, el] of this.renderedItems) {
            if (!visibleIds.has(id)) {
                el.remove();
                this.renderedItems.delete(id);
            }
        }

        // 2. Add/Update items
        itemsToRender.forEach(item => {
            let el = this.renderedItems.get(item.renderId);
            if (!el) {
                el = document.createElement('div');
                el.className = 'art-item';
                // HTML content...
                el.innerHTML = `
                    <img src="${item.img}" alt="${item.title}" loading="lazy" style="width: 100%; height: 100%; object-fit: cover; background: #222;">
                    <div style="margin-top: 10px; font-size: 12px; letter-spacing: 1px; position: absolute; bottom: -30px; left: 0;">${item.title}</div>
                `;
                el.addEventListener('click', () => {
                    if (Math.abs(this.vx) < 0.5 && Math.abs(this.vy) < 0.5) {
                        window.openDetail({ title: item.title, desc: `Details about ${item.title}`, img: item.img });
                    }
                });
                this.canvas.appendChild(el);
                this.renderedItems.set(item.renderId, el);
            }

            // ALWAYS update position because it shifts with wrapping
            el.style.left = `${item.x}px`;
            el.style.top = `${item.y}px`;
            el.style.width = `${item.width}px`;
            el.style.height = `${item.height}px`;
        });
    }

    addEventListeners() {
        this.el.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', (e) => this.onMouseUp(e));

        // Wheel support
        this.el.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.targetX -= e.deltaX;
            this.targetY -= e.deltaY;
        }, { passive: false });
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        // Stop inertia on grab
        this.vx = 0;
        this.vy = 0;
        this.targetX = this.currentX;
        this.targetY = this.currentY;

        this.el.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        if (!this.isDragging) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        this.targetX += dx;
        this.targetY += dy;

        this.startX = e.clientX;
        this.startY = e.clientY;
    }

    onMouseUp() {
        this.isDragging = false;
        this.el.style.cursor = 'grab';
    }

    animate() {
        this.currentX += (this.targetX - this.currentX) * 0.1;
        this.currentY += (this.targetY - this.currentY) * 0.1;

        this.updateTransform();
        this.updateVirtualDOM();
        this.rafId = requestAnimationFrame(() => this.animate());
    }

    updateTransform() {
        this.canvas.style.transform = `translate3d(${this.currentX}px, ${this.currentY}px, 0)`;
    }
}
