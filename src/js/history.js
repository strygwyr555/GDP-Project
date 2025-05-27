import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let currentFilter = 'all';

async function loadHistory() {
    const historyGrid = document.getElementById('historyGrid');
    historyGrid.innerHTML = '';

    try {
        let q;
        if (currentFilter === 'all') {
            q = query(collection(db, 'scannedItems'));
        } else {
            q = query(collection(db, 'scannedItems'), where('isRecyclable', '==', true));
        }

        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const historyItem = createHistoryItem(doc.id, data);
            historyGrid.appendChild(historyItem);
        });
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function createHistoryItem(id, data) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
        <img src="${data.imageUrl}" alt="Scanned item" class="history-image">
        <div class="history-info">
            <p class="history-date">${new Date(data.timestamp).toLocaleString()}</p>
            ${data.isRecyclable ? '<span class="recyclable-badge">♻️ Recyclable</span>' : ''}
        </div>
        <button class="delete-btn" data-id="${id}">
            <i class="fas fa-trash"></i>
        </button>
    `;

    const deleteBtn = div.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => deleteItem(id, data.imageUrl));

    return div;
}

async function deleteItem(id, imageUrl) {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
        // Delete from Firestore
        await deleteDoc(doc(db, 'scannedItems', id));

        // Delete from Storage
        const imageRef = ref(storage, imageUrl);
        await deleteObject(imageRef);

        // Refresh the display
        loadHistory();
    } catch (error) {
        console.error('Error deleting item:', error);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();

    // Filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadHistory();
        });
    });
});