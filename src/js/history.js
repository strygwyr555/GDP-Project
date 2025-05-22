class HistoryManager {
    constructor() {
        this.scans = [];
        this.initialize();
    }

    async initialize() {
        await this.loadScans();
        this.setupEventListeners();
        this.renderScans();
    }

    async loadScans() {
        // Here you would typically fetch from your backend/database
        // For now, we'll use localStorage
        const storedScans = localStorage.getItem('scanHistory');
        this.scans = storedScans ? JSON.parse(storedScans) : [];
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        const filterType = document.getElementById('filterType');

        if (searchInput) {
            searchInput.addEventListener('input', () => this.filterScans());
        }
        if (filterType) {
            filterType.addEventListener('change', () => this.filterScans());
        }
    }

    filterScans() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const filterType = document.getElementById('filterType').value;

        const filtered = this.scans.filter(scan => {
            const matchesSearch = scan.classification.toLowerCase().includes(searchTerm);
            const matchesType = filterType === 'all' || scan.classification.toLowerCase() === filterType;
            return matchesSearch && matchesType;
        });

        this.renderScans(filtered);
    }

    renderScans(scansToRender = this.scans) {
        const historyGrid = document.getElementById('historyGrid');
        if (!historyGrid) return;

        historyGrid.innerHTML = scansToRender.map(scan => `
            <div class="history-item" data-id="${scan.id}">
                <img src="${scan.imageUrl}" alt="Scanned item">
                <div class="history-item-details">
                    <span class="classification ${scan.classification.toLowerCase()}">
                        ${scan.classification}
                    </span>
                    <span class="date">${new Date(scan.date).toLocaleDateString()}</span>
                </div>
                <button class="delete-btn" onclick="deleteScan('${scan.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    async deleteScan(scanId) {
        // Remove from array
        this.scans = this.scans.filter(scan => scan.id !== scanId);
        // Update storage
        localStorage.setItem('scanHistory', JSON.stringify(this.scans));
        // Re-render
        this.renderScans();
    }

    async addScan(imageData, classification) {
        const newScan = {
            id: Date.now().toString(),
            imageUrl: imageData,
            classification,
            date: new Date().toISOString()
        };

        this.scans.unshift(newScan);
        localStorage.setItem('scanHistory', JSON.stringify(this.scans));
        this.renderScans();
    }
}

// Initialize history manager
const historyManager = new HistoryManager();
window.deleteScan = (scanId) => historyManager.deleteScan(scanId);