document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const cardGrid = document.getElementById('card-grid');
    const counterDiv = document.getElementById('counter');
    const confirmButton = document.getElementById('confirm-button');
    const resetButton = document.getElementById('reset-button');
    const selectionScreen = document.getElementById('selection-screen');
    const resultsScreen = document.getElementById('results-screen');
    const resultsGrid = document.getElementById('results-grid');
    const selectionTray = document.getElementById('selection-tray');
    const saveImageBtn = document.getElementById('save-image-btn'); // New Button

    // Modal elements...
    const cardModalContainer = document.getElementById('card-modal-container');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- State Variables ---
    let selectedCards = [];
    const MAX_SELECTIONS = 10;

    // --- SAVE RESULT AS IMAGE FUNCTION ---
    async function saveResultsAsImage() {
        // Show loading alert
        Swal.fire({
            title: 'กำลังสร้างรูปภาพ...',
            text: 'โปรดรอสักครู่',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            // Target the entire results screen for capture
            const elementToCapture = document.getElementById('results-screen');
            const canvas = await html2canvas(elementToCapture, {
                useCORS: true, // Important for external images
                backgroundColor: 'rgba(15, 7, 85, 0)', // Use the background from CSS
                scale: 2 // Increase resolution for better quality
            });
            
            const imageDataUrl = canvas.toDataURL('image/png');

            Swal.close(); // Close loading alert

            // Show success alert with download button
            const result = await Swal.fire({
                title: 'สร้างรูปภาพสำเร็จ!',
                text: 'คลิก "บันทึก" เพื่อดาวน์โหลดรูปภาพของคุณ',
                imageUrl: imageDataUrl, // Show a preview in the alert
                imageAlt: 'ผลการเลือกไพ่',
                imageHeight: 200,
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'บันทึกรูปภาพ',
                cancelButtonText: 'ยกเลิก'
            });

            if (result.isConfirmed) {
                // Create a temporary link to trigger the download
                const link = document.createElement('a');
                link.href = imageDataUrl;
                link.download = `ผลคำทำนาย-ดูดวงกับเรฟ-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถสร้างรูปภาพได้ โปรดลองอีกครั้ง'
            });
            console.error('Oops, something went wrong!', error);
        }
    }


    // --- All other functions (modal, selection, UI, rendering) remain the same ---
    function openCardModal(cardId) {
        const cardData = tarotDeck.find(c => c.id === cardId);
        if (!cardData) return;
        document.getElementById('modal-card-img').src = cardData.img;
        document.getElementById('modal-card-name').textContent = cardData.name;
        cardModalContainer.classList.add('visible');
    }
    function closeCardModal() { cardModalContainer.classList.remove('visible'); }
    function toggleSelection(cardId) {
        const cardInGrid = document.querySelector(`.card-container[data-id="${cardId}"]`);
        if (selectedCards.includes(cardId)) {
            selectedCards = selectedCards.filter(id => id !== cardId);
            if(cardInGrid) cardInGrid.classList.remove('selected');
        } else {
            if (selectedCards.length < MAX_SELECTIONS) {
                selectedCards.push(cardId);
                if(cardInGrid) cardInGrid.classList.add('selected');
            } else { alert('คุณเลือกไพ่ครบ 10 ใบแล้ว'); }
        }
        updateUI();
    }
    function handleCardClick(event) { toggleSelection(event.currentTarget.dataset.id); }
    function updateUI() {
        counterDiv.textContent = `เลือกแล้ว ${selectedCards.length}/${MAX_SELECTIONS} ใบ`;
        confirmButton.disabled = selectedCards.length !== MAX_SELECTIONS;
        selectionTray.innerHTML = '';
        selectedCards.forEach((cardId, index) => {
            const trayCard = document.createElement('div');
            trayCard.className = 'tray-card';
            trayCard.dataset.id = cardId;
            trayCard.style.left = `${index * 25}px`;
            trayCard.style.zIndex = index;
            trayCard.addEventListener('click', (e) => { e.stopPropagation(); toggleSelection(cardId); });
            selectionTray.appendChild(trayCard);
            setTimeout(() => { trayCard.classList.add('in-tray'); }, 10 * index);
        });
    }
    function renderDeck() {
        cardGrid.innerHTML = '';
        const shuffledDeck = shuffle([...tarotDeck]);
        shuffledDeck.forEach(card => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            cardContainer.dataset.id = card.id;
            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardContainer.appendChild(cardBack);
            cardContainer.addEventListener('click', handleCardClick);
            cardGrid.appendChild(cardContainer);
        });
    }
    function renderResults() {
        resultsGrid.innerHTML = '';
        selectedCards.forEach((cardId, index) => {
            const cardData = tarotDeck.find(c => c.id === cardId);
            const resultCard = document.createElement('div');
            resultCard.className = 'result-card';
            resultCard.style.animationDelay = `${index * 100}ms`;
            resultCard.innerHTML = `<img src="${cardData.img}" alt="${cardData.name}"><p>${cardData.name}</p>`;
            resultCard.addEventListener('click', () => openCardModal(cardId));
            resultsGrid.appendChild(resultCard);
        });
    }
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // --- EVENT LISTENERS ---
    confirmButton.addEventListener('click', () => {
        if (selectedCards.length === MAX_SELECTIONS) {
            selectionScreen.classList.add('hidden');
            resultsScreen.classList.remove('hidden');
            renderResults();
        }
    });
    resetButton.addEventListener('click', () => {
        selectedCards = [];
        resultsScreen.classList.add('hidden');
        selectionScreen.classList.remove('hidden');
        document.querySelectorAll('.card-container.selected').forEach(el => el.classList.remove('selected'));
        updateUI();
    });
    saveImageBtn.addEventListener('click', saveResultsAsImage); // New listener
    modalCloseBtn.addEventListener('click', closeCardModal);
    cardModalContainer.addEventListener('click', (event) => { if (event.target === cardModalContainer) closeCardModal(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && cardModalContainer.classList.contains('visible')) closeCardModal(); });

    // --- INITIALIZE ---
    renderDeck();
    updateUI();
});