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

    // --- ENHANCED ANIMATION UTILITIES ---
    function animateCounter() {
        counterDiv.style.animation = 'none';
        counterDiv.offsetHeight; // Trigger reflow
        counterDiv.style.animation = 'counterPulse 0.3s ease-out';
    }

    function createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(139, 92, 246, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    // Add ripple animation CSS
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);

    // --- CORE LOGIC: Initialize page based on URL parameter ---
    function initializePage() {
        const urlParams = new URLSearchParams(window.location.search);
        const countFromUrl = parseInt(urlParams.get('count'));
        if (countFromUrl && [1, 2, 3, 4, 10].includes(countFromUrl)) {
            maxSelections = countFromUrl;
        }
        
        // Animate title change
        pageTitle.style.opacity = '0';
        setTimeout(() => {
            pageTitle.textContent = `เลือกไพ่ ${maxSelections} ใบ`;
            pageTitle.style.opacity = '1';
        }, 300);
        
        resultTitle.textContent = `ไพ่ทั้ง ${maxSelections} ใบของคุณ`;
        renderDeck();
        updateUI();
    }

    // --- ENHANCED SHUFFLE ANIMATION FUNCTIONALITY ---
    async function handleShuffleClick(event) {
        createRippleEffect(shuffleButton, event);
        
        shuffleButton.disabled = true;
        shuffleButton.style.transform = 'scale(0.95)';
        
        // Clear selections with animation
        selectedCards.forEach(cardId => {
            const cardElement = document.querySelector(`.card-container[data-id="${cardId}"]`);
            if (cardElement) {
                cardElement.style.animation = 'cardDisappear 0.3s ease-in forwards';
            }
        });
        
        selectedCards = [];
        updateUI();

        // Animate grid fade out
        cardGrid.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        cardGrid.style.opacity = '0';
        cardGrid.style.transform = 'scale(0.95) rotateY(10deg)';

        await new Promise(resolve => setTimeout(resolve, 500));
        
        renderDeck(); 

        // Animate grid fade in
        cardGrid.style.opacity = '1';
        cardGrid.style.transform = 'scale(1) rotateY(0deg)';
        
        setTimeout(() => {
            shuffleButton.disabled = false;
            shuffleButton.style.transform = 'scale(1)';
        }, 300);
    }
    
    // --- ENHANCED SAVE RESULT AS IMAGE FUNCTION ---
    async function saveResultsAsImage(event) {
        createRippleEffect(saveImageBtn, event);
        
        // Enhanced loading animation
        Swal.fire({
            title: 'กำลังสร้างรูปภาพ...',
            html: '<div class="loading-spinner"></div><p style="margin-top: 1rem;">โปรดรอสักครู่</p>',
            allowOutsideClick: false,
            showConfirmButton: false,
            background: 'rgba(17, 24, 39, 0.95)',
            color: '#E5E7EB'
        });

        try {
            const elementToCapture = document.getElementById('results-screen');
            
            // Add temporary styling for better capture
            elementToCapture.style.background = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)';
            
            const canvas = await html2canvas(elementToCapture, {
                useCORS: true,
                backgroundColor: null,
                scale: 2,
                logging: false
            });
            
            // Remove temporary styling
            elementToCapture.style.background = '';
            
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
                cancelButtonText: 'ยกเลิก',
                background: 'rgba(17, 24, 39, 0.95)',
                color: '#E5E7EB',
                showClass: {
                    popup: 'animate__animated animate__fadeInUp'
                }
            });

            if (result.isConfirmed) {
                const link = document.createElement('a');
                link.href = imageDataUrl;
                link.download = `ผลคำทำนาย-ดูดวงกับเรฟ-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Success feedback
                Swal.fire({
                    icon: 'success',
                    title: 'บันทึกสำเร็จ!',
                    text: 'รูปภาพถูกบันทึกแล้ว',
                    timer: 2000,
                    showConfirmButton: false,
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#E5E7EB'
                });
            }
        } catch (error) {
            Swal.fire({ 
                icon: 'error', 
                title: 'เกิดข้อผิดพลาด', 
                text: 'ไม่สามารถสร้างรูปภาพได้ โปรดลองอีกครั้ง',
                background: 'rgba(17, 24, 39, 0.95)',
                color: '#E5E7EB'
            });
            console.error('Oops, something went wrong!', error);
        }
    }

    // --- ENHANCED CARD DETAIL MODAL LOGIC ---
    function openCardModal(cardId) {
        const cardData = tarotDeck.find(c => c.id === cardId);
        if (!cardData) return;
        
        document.getElementById('modal-card-img').src = cardData.img;
        document.getElementById('modal-card-name').textContent = cardData.name;
        
        // Enhanced modal animation
        cardModalContainer.style.display = 'flex';
        cardModalContainer.classList.add('visible');
        
        // Add floating animation to modal content
        const modalPanel = document.getElementById('card-modal-panel');
        modalPanel.classList.add('floating-element');
    }

    function closeCardModal() {
        const modalPanel = document.getElementById('card-modal-panel');
        modalPanel.style.animation = 'modalSlideDown 0.3s ease-in forwards';
        
        setTimeout(() => {
            cardModalContainer.classList.remove('visible');
            modalPanel.style.animation = '';
            modalPanel.classList.remove('floating-element');
        }, 300);
    }

    // Add modal slide down animation
    const modalStyle = document.createElement('style');
    modalStyle.textContent = `
        @keyframes modalSlideDown {
            from {
                opacity: 1;
                transform: scale(1) translateY(0);
            }
            to {
                opacity: 0;
                transform: scale(0.7) translateY(50px);
            }
        }
        
        @keyframes cardDisappear {
            from {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            to {
                opacity: 0;
                transform: translateY(-20px) scale(0.8);
            }
        }
    `;
    document.head.appendChild(modalStyle);

    // --- ENHANCED SELECTION & UI LOGIC ---
    function toggleSelection(cardId, event) {
        if (isShuffling) return;
        
        const cardInGrid = document.querySelector(`.card-container[data-id="${cardId}"]`);
        
        if (selectedCards.includes(cardId)) {
            selectedCards = selectedCards.filter(id => id !== cardId);
            if(cardInGrid) {
                cardInGrid.classList.remove('selected');
                // Add deselection animation
                cardInGrid.style.animation = 'cardDeselect 0.3s ease-out';
            }
        } else {
            if (selectedCards.length < maxSelections) {
                selectedCards.push(cardId);
                if(cardInGrid) {
                    cardInGrid.classList.add('selected');
                    // Add selection animation
                    cardInGrid.style.animation = 'cardSelect 0.5s ease-out';
                }
            } else {
                // Enhanced error feedback
                Swal.fire({
                    title: 'เลือกครบแล้ว',
                    text: `คุณเลือกไพ่ครบ ${maxSelections} ใบแล้ว`,
                    icon: 'info',
                    timer: 2000,
                    showConfirmButton: false,
                    background: 'rgba(17, 24, 39, 0.95)',
                    color: '#E5E7EB',
                    showClass: {
                        popup: 'animate__animated animate__shakeX'
                    }
                });
                
                // Shake the card that couldn't be selected
                if(cardInGrid) {
                    cardInGrid.style.animation = 'shake 0.5s ease-in-out';
                }
            }
        }
        updateUI();
    }

    // Add card selection animations
    const cardAnimationStyle = document.createElement('style');
    cardAnimationStyle.textContent = `
        @keyframes cardSelect {
            0% { transform: translateY(0) scale(1) rotateZ(0deg); }
            50% { transform: translateY(-20px) scale(1.1) rotateZ(5deg); }
            100% { transform: translateY(-15px) scale(1.05) rotateZ(0deg); }
        }
        
        @keyframes cardDeselect {
            0% { transform: translateY(-15px) scale(1.05); }
            50% { transform: translateY(-5px) scale(0.95); }
            100% { transform: translateY(0) scale(1); }
        }
        
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(cardAnimationStyle);
    
    function updateUI() {
        // Animate counter update
        animateCounter();
        counterDiv.textContent = `เลือกแล้ว ${selectedCards.length}/${maxSelections} ใบ`;
        
        const isReady = selectedCards.length === maxSelections;
        confirmButton.disabled = !isReady;
        
        if (isReady) {
            confirmButton.classList.add('ready');
            // Add ready state animation
            confirmButton.style.animation = 'readyButtonPulse 2s infinite';
        } else {
            confirmButton.classList.remove('ready');
            confirmButton.style.animation = '';
        }

        // Enhanced tray animation
        selectionTray.innerHTML = '';
        selectedCards.forEach((cardId, index) => {
            const trayCard = document.createElement('div');
            trayCard.className = 'tray-card interactive-feedback';
            trayCard.dataset.id = cardId;
            trayCard.style.left = `${index * 35}px`;
            trayCard.style.zIndex = index;
            trayCard.addEventListener('click', (e) => {
                e.stopPropagation();
                createRippleEffect(trayCard, e);
                toggleSelection(cardId, e);
            });
            
            selectionTray.appendChild(trayCard);
            setTimeout(() => {
                trayCard.classList.add('in-tray');
            }, 50 * index); // Staggered animation
        });
    }

    // --- [ENHANCED] RENDER DECK FUNCTION FOR RESPONSIVE STAGGERED LAYOUT ---
    function renderDeck() {
        cardGrid.innerHTML = ''; 
        const shuffledDeck = shuffle([...tarotDeck]);
        const containerWidth = cardGrid.offsetWidth;

        // --- ค่าที่ปรับได้สำหรับ Layout ---
        const cardsPerRow = 19;
        let cardWidth, overlapX, rowHeight;

        // --- กำหนดค่าตามขนาดหน้าจอ ---
        if (containerWidth < 768) { // Mobile
            cardWidth = containerWidth / 8;
            overlapX = cardWidth * 0.4;
            rowHeight = cardWidth * (3/2) * 0.6;
        } else { // Desktop
            cardWidth = 90;
            overlapX = 40;
            rowHeight = 150;
        }

        const totalRowWidth = (cardsPerRow - 1) * overlapX + cardWidth;
        const startOffset = (containerWidth - totalRowWidth) / 2;

        shuffledDeck.forEach((card, index) => {
            const cardContainer = document.createElement('div');
            cardContainer.className = 'card-container interactive-feedback';
            cardContainer.dataset.id = card.id;

            const row = Math.floor(index / cardsPerRow);
            const col = index % cardsPerRow;

            const top = row * rowHeight;
            const left = startOffset + (col * overlapX);
            
            cardContainer.style.width = `${cardWidth}px`;
            cardContainer.style.top = `${top}px`;
            cardContainer.style.left = `${left}px`;
            cardContainer.style.zIndex = col;
            cardContainer.style.animationDelay = `${index * 30}ms`; // Slower stagger

            const cardBack = document.createElement('div');
            cardBack.className = 'card-back';
            cardContainer.appendChild(cardBack);

            cardContainer.addEventListener('click', (e) => {
                createRippleEffect(cardContainer, e);
                toggleSelection(card.id, e);
            });
            
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
            resultCard.className = 'result-card interactive-feedback';
            resultCard.style.animationDelay = `${index * 150}ms`; // Slower reveal
            resultCard.innerHTML = `<img src="${cardData.img}" alt="${cardData.name}"><p>${cardData.name}</p>`;
            resultCard.addEventListener('click', (e) => {
                createRippleEffect(resultCard, e);
                openCardModal(cardId);
            });
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

    // --- ENHANCED EVENT LISTENERS ---
    if(shuffleButton) {
        shuffleButton.addEventListener('click', handleShuffleClick);
    }
    
    if(confirmButton) {
        confirmButton.addEventListener('click', (e) => {
            if (selectedCards.length === maxSelections) {
                createRippleEffect(confirmButton, e);
                
                // Enhanced page transition
                selectionScreen.style.animation = 'pageSlideOut 0.5s ease-in forwards';
                
                setTimeout(() => {
                    selectionScreen.classList.add('hidden');
                    resultsScreen.classList.remove('hidden');
                    renderResults();
                }, 500);
            }
        });
    }
    
    if(resetButton) {
        resetButton.addEventListener('click', (e) => {
            createRippleEffect(resetButton, e);
            
            // Enhanced reset animation
            Swal.fire({
                title: 'เริ่มใหม่?',
                text: 'คุณต้องการเลือกไพ่ใหม่หรือไม่?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#8B5CF6',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'ใช่, เริ่มใหม่',
                cancelButtonText: 'ยกเลิก',
                background: 'rgba(17, 24, 39, 0.95)',
                color: '#E5E7EB'
            }).then((result) => {
                if (result.isConfirmed) {
                    resultsScreen.style.animation = 'pageSlideOut 0.5s ease-in forwards';
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
            });
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

    // Add page transition animations
    const pageTransitionStyle = document.createElement('style');
    pageTransitionStyle.textContent = `
        @keyframes pageSlideOut {
            from {
                opacity: 1;
                transform: translateX(0);
            }
            to {
                opacity: 0;
                transform: translateX(-100px);
            }
        }
    `;
    document.head.appendChild(pageTransitionStyle);
    
    // --- INITIALIZE PAGE ---
    initializePage();
    
    // Enhanced resize handler
    window.addEventListener('resize', () => {
        clearTimeout(renderTimeout);
        renderTimeout = setTimeout(() => {
            cardGrid.style.transition = 'opacity 0.3s ease';
            cardGrid.style.opacity = '0.7';
            renderDeck();
            setTimeout(() => {
                cardGrid.style.opacity = '1';
            }, 100);
        }, 250);
    });
});