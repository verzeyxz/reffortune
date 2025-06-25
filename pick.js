document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const selectionScreen = document.getElementById('selection-screen');
    const resultsScreen = document.getElementById('results-screen');
    const resultsGrid = document.getElementById('results-grid');
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
    let renderTimeout; // สำหรับ debounce resize event

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
        shuffleButton.disabled = true;
        selectedCards = [];
        updateUI();

        cardGrid.style.transition = 'opacity 0.3s ease-out';
        cardGrid.style.opacity = '0';

        await new Promise(resolve => setTimeout(resolve, 300));
        
        renderDeck(); 

        cardGrid.style.opacity = '1';
        shuffleButton.disabled = false;
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

    // --- [REPLACED] RENDER DECK FUNCTION FOR RESPONSIVE STAGGERED LAYOUT ---
    function renderDeck() {
        cardGrid.innerHTML = ''; 
        const shuffledDeck = shuffle([...tarotDeck]);
        const containerWidth = cardGrid.offsetWidth;

        // --- ค่าที่ปรับได้สำหรับ Layout ---
        const cardsPerRow = 19;
        let cardWidth, overlapX, rowHeight;

        // --- กำหนดค่าตามขนาดหน้าจอ ---
        if (containerWidth < 768) { // Mobile
            // บนมือถือ ทำให้การ์ดมีขนาดเล็กลงและซ้อนกันมากขึ้นเพื่อให้พอดี
            cardWidth = containerWidth / 8; // ขนาดการ์ดเป็นสัดส่วนของความกว้างจอ
            overlapX = cardWidth * 0.4; // ซ้อนกัน 60% ของความกว้างการ์ด
            rowHeight = cardWidth * (3/2) * 0.6; // ลดความสูงแถวให้ชิดกันขึ้น
        } else { // Desktop
            cardWidth = 90;
            overlapX = 40;
            rowHeight = 150;
        }

        // คำนวณความกว้างทั้งหมดของแถวไพ่เพื่อจัดให้อยู่กึ่งกลาง
        const totalRowWidth = (cardsPerRow - 1) * overlapX + cardWidth;
        const startOffset = (containerWidth - totalRowWidth) / 2;

        shuffledDeck.forEach((card, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container';
            cardContainer.dataset.id = card.id;

            // คำนวณแถวและคอลัมน์
            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;

            // คำนวณตำแหน่ง
            const top = row * rowHeight;
            const left = startOffset + (col * overlapX);
            
            // กำหนดสไตล์จาก JavaScript
            cardContainer.style.width = `${cardWidth}px`;
            cardContainer.style.top = `${top}px`;
            cardContainer.style.left = `${left}px`;
            cardContainer.style.zIndex = col;
            cardContainer.style.animationDelay = `${index * 20}ms`;

            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardContainer.appendChild(cardBack);

            cardContainer.addEventListener('click', () => toggleSelection(card.id));
            
            cardGrid.appendChild(cardContainer);
        });
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
            window.location.reload();
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
    // เพิ่ม Event Listener เพื่อ re-render เมื่อมีการปรับขนาดหน้าจอ
    window.addEventListener('resize', () => {
        // Debounce: รอ 250ms หลังจากการปรับขนาดครั้งสุดท้ายก่อนจะ render ใหม่
        // เพื่อป้องกันการ render ที่ถี่เกินไป
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(renderDeck, 250);
    });
});
