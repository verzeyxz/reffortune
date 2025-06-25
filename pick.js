document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const selectionScreen = document.getElementById('selection-screen');
    const resultsScreen = document.getElementById('results-screen');
    const cardGrid = document.getElementById('card-grid');
    const counterDiv = document.getElementById('counter');
    const confirmButton = document.getElementById('confirm-button');
    const resetButton = document.getElementById('reset-button');
    const selectionTray = document.getElementById('selection-tray');
    const saveImageBtn = document.getElementById('save-image-btn');
    const pageTitle = document.getElementById('page-title');
    const resultTitle = document.getElementById('result-title');
    const shuffleButton = document.getElementById('shuffle-button');
    const cardModalContainer = document.getElementById('card-modal-container');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- State Variables ---
    let selectedCards = [];
    let maxSelections = 10;
    let isShuffling = false;

    // --- CORE LOGIC: Initialize page based on URL parameter ---
    function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const countFromUrl = parseInt(urlParams.get('count'));
        if (countFromUrl && [1, 2, 3, 4, 10].includes(countFromUrl)) {
            maxSelections = countFromUrl;
        }
        pageTitle.textContent = `เลือกไพ่ ${maxSelections} ใบ`;
        resultTitle.textContent = `ไพ่ทั้ง ${maxSelections} ใบของคุณ`;
        renderDeck();
        updateUI();
    }

    // --- SHUFFLE ANIMATION FUNCTIONALITY ---
    async function handleShuffleClick() {
        if (isShuffling) return;
        isShuffling = true;

        shuffleButton.disabled = true;
        confirmButton.disabled = true;
        selectedCards = [];
        updateUI();

        const cardElements = Array.from(cardGrid.children);

        // Animate cards gathering to the center
        cardElements.forEach((card, index) => {
            card.classList.add('gathering');
            const randomX = Math.random() * 20 - 10;
            const randomY = Math.random() * 20 - 10;
            const randomRot = Math.random() * 40 - 20;
            card.style.transform = `translate(-50%, -50%) translate(${randomX}px, ${randomY}px) rotate(${randomRot}deg)`;
            card.style.zIndex = index;
        });

        await new Promise(resolve => setTimeout(resolve, 600));

        // Animate the stack fading away
        cardElements.forEach(card => card.classList.add('hiding'));
        
        await new Promise(resolve => setTimeout(resolve, 300));

        // Re-render the deck with new positions
        renderDeck();

        await new Promise(resolve => setTimeout(resolve, 200));
        isShuffling = false;
        shuffleButton.disabled = false;
        updateUI();
    }
    
    // --- SAVE RESULT AS IMAGE FUNCTION ---
    async function saveResultsAsImage() {
        Swal.fire({
            title: 'กำลังสร้างรูปภาพ...',
            text: 'โปรดรอสักครู่',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const elementToCapture = document.getElementById('results-screen');
            const canvas = await html2canvas(elementToCapture, {
                useCORS: true,
                backgroundColor: null,
                scale: 2
            });
            const imageDataUrl = canvas.toDataURL('image/png');
            Swal.close();

            const result = await Swal.fire({
                title: 'สร้างรูปภาพสำเร็จ!',
                text: 'คลิก "บันทึก" เพื่อดาวน์โหลดรูปภาพของคุณ',
                imageUrl: imageDataUrl,
                imageAlt: 'ผลการเลือกไพ่',
                imageHeight: 200,
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'บันทึกรูปภาพ',
                cancelButtonText: 'ยกเลิก'
            });

            if (result.isConfirmed) {
                const link = document.createElement('a');
                link.href = imageDataUrl;
                link.download = `ผลคำทำนาย-ดูดวงกับเรฟ-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถสร้างรูปภาพได้ โปรดลองอีกครั้ง' });
            console.error('Oops, something went wrong!', error);
        }
    }

    // --- CARD DETAIL MODAL LOGIC ---
    function openCardModal(cardId) {
        const cardData = tarotDeck.find(c => c.id === cardId);
        if (!cardData) return;
        document.getElementById('modal-card-img').src = cardData.img;
        document.getElementById('modal-card-name').textContent = cardData.name;
        cardModalContainer.classList.add('visible');
    }

    function closeCardModal() {
        cardModalContainer.classList.remove('visible');
    }

    // --- SELECTION & UI LOGIC ---
    function toggleSelection(cardId) {
        if (isShuffling) return;
        const cardInGrid = document.querySelector(`.card-container[data-id="${cardId}"]`);
        if (selectedCards.includes(cardId)) {
            selectedCards = selectedCards.filter(id => id !== cardId);
            if(cardInGrid) cardInGrid.classList.remove('selected');
        } else {
            if (selectedCards.length < maxSelections) {
                selectedCards.push(cardId);
                if(cardInGrid) cardInGrid.classList.add('selected');
            } else {
                Swal.fire('เลือกครบแล้ว', `คุณเลือกไพ่ครบ ${maxSelections} ใบแล้ว`, 'info');
            }
        }
        updateUI();
    }
    
    function updateUI() {
        counterDiv.textContent = `เลือกแล้ว ${selectedCards.length}/${maxSelections} ใบ`;
        const isReady = selectedCards.length === maxSelections;
        confirmButton.disabled = !isReady;
        isReady ? confirmButton.classList.add('ready') : confirmButton.classList.remove('ready');

        selectionTray.innerHTML = '';
        selectedCards.forEach((cardId, index) => {
            const trayCard = document.createElement('div');
            trayCard.className = 'tray-card';
            trayCard.dataset.id = cardId;
            trayCard.style.left = `${index * 35}px`;
            trayCard.style.zIndex = index;
            trayCard.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleSelection(cardId);
            });
            
            selectionTray.appendChild(trayCard);
            setTimeout(() => {
                trayCard.classList.add('in-tray');
            }, 10 * index);
        });
    }

    function renderDeck() {
        cardGrid.innerHTML = '';
        const shuffledDeck = shuffle([...tarotDeck]);
        shuffledDeck.forEach((card, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            cardContainer.dataset.id = card.id;
            
            cardContainer.style.position = 'absolute';
            cardContainer.style.top = '50%';
            cardContainer.style.left = '50%';
            cardContainer.style.transform = 'translate(-50%, -50%) scale(0.8)';
            cardContainer.style.opacity = '0';
            cardContainer.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';

            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardContainer.appendChild(cardBack);
            cardContainer.addEventListener('click', () => toggleSelection(card.id));
            
            cardGrid.appendChild(cardContainer);
        });

        setTimeout(() => {
            const cardElements = Array.from(cardGrid.children);
            cardElements.forEach(card => {
                card.style.position = '';
                card.style.top = '';
                card.style.left = '';
                card.style.transform = '';
                card.style.opacity = '1';
            });
        }, 50);
    }
    
    function renderResults() {
        resultsGrid.innerHTML = '';
        if (maxSelections <= 5) {
            resultsGrid.style.gridTemplateColumns = `repeat(${maxSelections}, 1fr)`;
        } else {
            resultsGrid.style.gridTemplateColumns = 'repeat(5, 1fr)';
            resultsGrid.style.gridTemplateRows = 'repeat(2, auto)';
        }
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
    if(shuffleButton) {
        shuffleButton.addEventListener('click', handleShuffleClick);
    }
    
    if(confirmButton) {
        confirmButton.addEventListener('click', () => {
            if (selectedCards.length === maxSelections) {
                selectionScreen.classList.add('hidden');
                resultsScreen.classList.remove('hidden');
                renderResults();
            }
        });
    }
    
    if(resetButton) {
        resetButton.addEventListener('click', () => {
            selectedCards = [];
            resultsScreen.classList.add('hidden');
            selectionScreen.classList.remove('hidden');
            // Re-render deck instead of just hiding UI for a fresh start
            renderDeck();
            updateUI();
        });
    }

    if(saveImageBtn) {
        saveImageBtn.addEventListener('click', saveResultsAsImage);
    }
    
    if(modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeCardModal);
        cardModalContainer.addEventListener('click', (event) => {
            if (event.target === cardModalContainer) closeCardModal();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && cardModalContainer.classList.contains('visible')) {
                closeCardModal();
            }
        });
    }

    // --- INITIALIZE PAGE ---
    initializePage();
});
