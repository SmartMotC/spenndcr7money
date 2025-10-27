// Функция для форматирования числа с разделителями тысяч
function formatMoney(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Функция для парсинга цены из строки
function parsePrice(priceText) {
    return parseInt(priceText.replace(/[^\d]/g, ''));
}

// Функция для нормализации имени товара (убираем кавычки и лишние пробелы)
function normalizeItemName(itemName) {
    return itemName.replace(/["«»]/g, '').trim();
}

// Функция для анимированного изменения денег
function animateMoneyChange(currentAmount, newAmount, element) {
    const duration = 1000; // длительность анимации в миллисекундах
    const startTime = performance.now();
    const difference = newAmount - currentAmount;
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // easing функция для плавности
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const currentValue = currentAmount + (difference * easeOutQuart);
        element.textContent = formatMoney(Math.round(currentValue)) + '$';
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = formatMoney(newAmount) + '$';
        }
    }
    
    requestAnimationFrame(update);
}

// Функция для сохранения состояния игры
function saveGameState(money, itemName, quantity) {
    const savedMoney = localStorage.getItem('cr7Money');
    const savedQuantities = localStorage.getItem('cr7Quantities');
    
    let quantities = savedQuantities ? JSON.parse(savedQuantities) : {};
    
    // Нормализуем имя товара при сохранении
    const normalizedItemName = normalizeItemName(itemName);
    quantities[normalizedItemName] = quantity;
    
    localStorage.setItem('cr7Money', money.toString());
    localStorage.setItem('cr7Quantities', JSON.stringify(quantities));
}

// Функция для загрузки состояния игры
function loadGameState() {
    const savedMoney = localStorage.getItem('cr7Money');
    const savedQuantities = localStorage.getItem('cr7Quantities');
    
    let quantities = savedQuantities ? JSON.parse(savedQuantities) : {};
    
    // Нормализуем ключи при загрузке (для обратной совместимости)
    const normalizedQuantities = {};
    Object.keys(quantities).forEach(key => {
        const normalizedKey = normalizeItemName(key);
        normalizedQuantities[normalizedKey] = quantities[key];
    });
    
    return {
        money: savedMoney ? parseInt(savedMoney) : 2000000000,
        quantities: normalizedQuantities
    };
}

// Функция для создания и управления чеком
function createReceiptSystem() {
    // Создаем контейнер для чека
    const receiptContainer = document.createElement('div');
    receiptContainer.className = 'receipt-container';
    receiptContainer.innerHTML = `
        <div class="receipt-header">
            <h3>🛒 Чек покупок</h3>
            <div class="receipt-controls">
                <button class="receipt-toggle" title="Свернуть/развернуть">−</button>
                <button class="receipt-clear" title="Очистить чек">🗑️</button>
            </div>
        </div>
        <div class="receipt-content">
            <div class="receipt-stats">
                <div class="stat-item">
                    <span class="stat-label">Всего покупок:</span>
                    <span class="stat-value" id="total-purchases">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Позиций:</span>
                    <span class="stat-value" id="total-items">0</span>
                </div>
            </div>
            <div class="receipt-items"></div>
            <div class="receipt-total">
                <strong>Всего потрачено: <span class="total-spent">0$</span></strong>
            </div>
        </div>
    `;

    let totalSpent = 0;
    let totalPurchases = 0; // Общее количество операций покупки
    let totalItems = 0;     // Общее количество купленных товаров
    let purchaseHistory = [];

    // Функция для обновления статистики
    function updateStats() {
        const totalPurchasesElement = document.getElementById('total-purchases');
        const totalItemsElement = document.getElementById('total-items');
        
        totalPurchasesElement.textContent = totalPurchases;
        totalItemsElement.textContent = totalItems;
    }

    // Функция для создания элемента чека
    function createReceiptItemElement(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'receipt-item';
        itemElement.setAttribute('data-item', item.name);
        
        updateReceiptItemDisplay(itemElement, item);
        
        return itemElement;
    }

    // Функция для обновления отображения элемента чека
    function updateReceiptItemDisplay(itemElement, item) {
        itemElement.innerHTML = `
            <div class="receipt-item-info">
                <span class="receipt-item-name">${item.name}</span>
                <div class="receipt-item-details">
                    <span class="receipt-item-quantity">${item.quantity} шт.</span>
                    <span>${formatMoney(item.price)}$ × ${item.quantity}</span>
                </div>
            </div>
            <div class="receipt-item-price">
                <div class="receipt-item-total">${formatMoney(item.totalPrice)}$</div>
                <div class="receipt-item-unit">${formatMoney(item.price)}$/шт.</div>
            </div>
        `;
    }

    // Функция для добавления покупки в чек
    function addToReceipt(itemName, itemPrice, quantity = 1) {
        const receiptItems = receiptContainer.querySelector('.receipt-items');
        const totalSpentElement = receiptContainer.querySelector('.total-spent');
        
        // Нормализуем имя товара
        const normalizedItemName = normalizeItemName(itemName);
        
        // Обновляем статистику
        totalPurchases += 1;
        totalItems += quantity;
        
        // Проверяем, есть ли уже такой товар в чеке (используем нормализованное имя)
        const existingItemIndex = purchaseHistory.findIndex(item => item.name === normalizedItemName);
        
        if (existingItemIndex !== -1) {
            // Обновляем существующий товар
            const existingItem = purchaseHistory[existingItemIndex];
            existingItem.quantity += quantity;
            existingItem.totalPrice += itemPrice * quantity;
            
            // Обновляем отображение
            const itemElement = receiptItems.querySelector(`[data-item="${normalizedItemName}"]`);
            if (itemElement) {
                updateReceiptItemDisplay(itemElement, existingItem);
            }
        } else {
            // Добавляем новый товар
            const newItem = {
                name: normalizedItemName,
                price: itemPrice,
                quantity: quantity,
                totalPrice: itemPrice * quantity,
                timestamp: new Date()
            };
            purchaseHistory.push(newItem);
            
            // Создаем элемент для отображение
            const itemElement = createReceiptItemElement(newItem);
            
            // Убираем сообщение о пустом чеке
            const emptyMessage = receiptItems.querySelector('.receipt-empty');
            if (emptyMessage) {
                emptyMessage.remove();
            }
            
            receiptItems.appendChild(itemElement);
        }
        
        // Обновляем общую сумму
        totalSpent += itemPrice * quantity;
        totalSpentElement.textContent = formatMoney(totalSpent) + '$';
        
        // Обновляем статистику
        updateStats();
        
        // Прокручиваем к последнему элементу
        receiptItems.scrollTop = receiptItems.scrollHeight;
        
        // Сохраняем в localStorage
        saveReceiptData();
    }

    // Функция для добавления продажи в чек
    function addSaleToReceipt(itemName, itemPrice, quantity = 1) {
        const receiptItems = receiptContainer.querySelector('.receipt-items');
        const totalSpentElement = receiptContainer.querySelector('.total-spent');
        
        // Нормализуем имя товара
        const normalizedItemName = normalizeItemName(itemName);
        
        // Обновляем статистику
        totalPurchases += 1;
        totalItems -= quantity;
        
        // Проверяем, есть ли уже такой товар в чеке
        const existingItemIndex = purchaseHistory.findIndex(item => item.name === normalizedItemName);
        
        if (existingItemIndex !== -1) {
            // Обновляем существующий товар
            const existingItem = purchaseHistory[existingItemIndex];
            existingItem.quantity -= quantity;
            existingItem.totalPrice -= itemPrice * quantity;
            
            // Если количество стало 0, удаляем товар из чека
            if (existingItem.quantity <= 0) {
                purchaseHistory.splice(existingItemIndex, 1);
                const itemElement = receiptItems.querySelector(`[data-item="${normalizedItemName}"]`);
                if (itemElement) {
                    itemElement.remove();
                }
            } else {
                // Обновляем отображение
                const itemElement = receiptItems.querySelector(`[data-item="${normalizedItemName}"]`);
                if (itemElement) {
                    updateReceiptItemDisplay(itemElement, existingItem);
                }
            }
            
            // Обновляем общую сумму
            totalSpent -= itemPrice * quantity;
            totalSpentElement.textContent = formatMoney(totalSpent) + '$';
            
            // Если чек пуст, показываем сообщение
            if (purchaseHistory.length === 0) {
                receiptItems.innerHTML = '<div class="receipt-empty">Покупок пока нет</div>';
            }
            
            // Обновляем статистику
            updateStats();
            
            // Сохраняем в localStorage
            saveReceiptData();
        }
    }

    // Функция очистки чека
    function clearReceipt() {
        const receiptItems = receiptContainer.querySelector('.receipt-items');
        const totalSpentElement = receiptContainer.querySelector('.total-spent');
        
        receiptItems.innerHTML = '<div class="receipt-empty">Покупок пока нет</div>';
        totalSpent = 0;
        totalPurchases = 0;
        totalItems = 0;
        totalSpentElement.textContent = '0$';
        purchaseHistory = [];
        
        // Обновляем статистику
        updateStats();
        
        // Сохраняем в localStorage
        saveReceiptData();
    }

    // Функция сохранения данных чека
    function saveReceiptData() {
        localStorage.setItem('cr7Receipt', JSON.stringify({
            totalSpent: totalSpent,
            totalPurchases: totalPurchases,
            totalItems: totalItems,
            purchaseHistory: purchaseHistory
        }));
    }

    // Функция загрузки данных чека
    function loadReceiptData() {
        const savedData = localStorage.getItem('cr7Receipt');
        if (savedData) {
            const data = JSON.parse(savedData);
            totalSpent = data.totalSpent || 0;
            totalPurchases = data.totalPurchases || 0;
            totalItems = data.totalItems || 0;
            purchaseHistory = data.purchaseHistory || [];
            
            // Восстанавливаем отображение
            const receiptItems = receiptContainer.querySelector('.receipt-items');
            const totalSpentElement = receiptContainer.querySelector('.total-spent');
            
            receiptItems.innerHTML = '';
            
            if (purchaseHistory.length === 0) {
                receiptItems.innerHTML = '<div class="receipt-empty">Покупок пока нет</div>';
            } else {
                purchaseHistory.forEach(item => {
                    const itemElement = createReceiptItemElement(item);
                    receiptItems.appendChild(itemElement);
                });
            }
            
            totalSpentElement.textContent = formatMoney(totalSpent) + '$';
            updateStats();
        }
    }

    // Обработчики событий для кнопок чека
    receiptContainer.querySelector('.receipt-toggle').addEventListener('click', function() {
        receiptContainer.classList.toggle('receipt-minimized');
        this.textContent = receiptContainer.classList.contains('receipt-minimized') ? '+' : '−';
    });

    receiptContainer.querySelector('.receipt-clear').addEventListener('click', function() {
        if (confirm('Очистить историю покупок?')) {
            clearReceipt();
        }
    });

    // Добавляем возможность перетаскивания
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    receiptContainer.querySelector('.receipt-header').addEventListener('mousedown', startDrag);
    receiptContainer.querySelector('.receipt-header').addEventListener('touchstart', startDrag);

    function startDrag(e) {
        isDragging = true;
        const rect = receiptContainer.getBoundingClientRect();
        
        if (e.type === 'mousedown') {
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        } else {
            dragOffset.x = e.touches[0].clientX - rect.left;
            dragOffset.y = e.touches[0].clientY - rect.top;
            document.addEventListener('touchmove', onDrag);
            document.addEventListener('touchend', stopDrag);
        }
        
        e.preventDefault();
    }

    function onDrag(e) {
        if (!isDragging) return;
        
        let clientX, clientY;
        
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }
        
        receiptContainer.style.left = (clientX - dragOffset.x) + 'px';
        receiptContainer.style.top = (clientY - dragOffset.y) + 'px';
        receiptContainer.style.right = 'auto';
        receiptContainer.style.bottom = 'auto';
    }

    function stopDrag() {
        isDragging = false;
        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('mouseup', stopDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('touchend', stopDrag);
    }

    // Инициализация
    document.body.appendChild(receiptContainer);
    loadReceiptData();

    return {
        addToReceipt,
        addSaleToReceipt,
        clearReceipt,
        getTotalSpent: () => totalSpent,
        getTotalPurchases: () => totalPurchases,
        getTotalItems: () => totalItems,
        getPurchaseHistory: () => purchaseHistory
    };
}

// Функция для обработки покупки
function handlePurchase(price, moneyElement, quantityElement, itemName, receiptSystem, quantity = 1) {
    const currentMoney = parsePrice(moneyElement.textContent);
    const itemPrice = parsePrice(price);
    const totalCost = itemPrice * quantity;
    
    // Нормализуем имя товара
    const normalizedItemName = normalizeItemName(itemName);
    
    if (currentMoney >= totalCost) {
        // Уменьшаем деньги
        const newMoney = currentMoney - totalCost;
        animateMoneyChange(currentMoney, newMoney, moneyElement);
        
        // Увеличиваем количество купленных товаров
        const currentQuantity = parseInt(quantityElement.textContent);
        const newQuantity = currentQuantity + quantity;
        quantityElement.textContent = newQuantity;
        
        // Добавляем анимацию к количеству
        quantityElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            quantityElement.style.transform = 'scale(1)';
        }, 300);
        
        // Добавляем в чек (используем нормализованное имя)
        receiptSystem.addToReceipt(normalizedItemName, itemPrice, quantity);
        
        // Сохраняем состояние игры (используем нормализованное имя)
        saveGameState(newMoney, normalizedItemName, newQuantity);
        
        return true;
    } else {
        // Анимация при недостатке денег
        moneyElement.parentElement.classList.add('insufficient');
        setTimeout(() => {
            moneyElement.parentElement.classList.remove('insufficient');
        }, 1000);
        alert(`Недостаточно денег для покупки ${quantity} шт. ${itemName}! Нужно: ${formatMoney(totalCost)}$`);
        return false;
    }
}

// Функция для обработки продажи
function handleSale(price, moneyElement, quantityElement, itemName, receiptSystem, quantity = 1) {
    const currentMoney = parsePrice(moneyElement.textContent);
    const itemPrice = parsePrice(price);
    const totalGain = itemPrice * quantity;
    
    // Нормализуем имя товара
    const normalizedItemName = normalizeItemName(itemName);
    
    // Проверяем, есть ли товары для продажи
    const currentQuantity = parseInt(quantityElement.textContent);
    
    if (currentQuantity >= quantity) {
        // Увеличиваем деньги
        const newMoney = currentMoney + totalGain;
        animateMoneyChange(currentMoney, newMoney, moneyElement);
        
        // Уменьшаем количество товаров
        const newQuantity = currentQuantity - quantity;
        quantityElement.textContent = newQuantity;
        
        // Добавляем анимацию к количеству
        quantityElement.style.transform = 'scale(1.2)';
        setTimeout(() => {
            quantityElement.style.transform = 'scale(1)';
        }, 300);
        
        // Добавляем продажу в чек
        receiptSystem.addSaleToReceipt(normalizedItemName, itemPrice, quantity);
        
        // Сохраняем состояние игры
        saveGameState(newMoney, normalizedItemName, newQuantity);
        
        return true;
    } else {
        alert(`Недостаточно товаров для продажи! У вас только ${currentQuantity} шт. ${itemName}`);
        return false;
    }
}

// Функция для обновления состояния кнопок продажи
function updateSellButtons() {
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const quantityElement = card.querySelector('.quantity');
        const sellButton = card.querySelector('.sell-btn');
        const currentQuantity = parseInt(quantityElement.textContent);
        
        // Отключаем кнопку продажи, если товаров нет
        if (currentQuantity <= 0) {
            sellButton.disabled = true;
        } else {
            sellButton.disabled = false;
        }
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Создаем систему чека
    const receiptSystem = createReceiptSystem();
    
    const moneyElement = document.querySelector('.money h2');
    const buyButtons = document.querySelectorAll('.buy-btn');
    const sellButtons = document.querySelectorAll('.sell-btn');
    
    // Загружаем состояние игры
    const gameState = loadGameState();
    
    // Устанавливаем начальное значение денег
    moneyElement.textContent = formatMoney(gameState.money) + '$';
    
    // Восстанавливаем количества товаров с нормализацией имен
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        const itemName = card.querySelector('h3').textContent;
        const normalizedItemName = normalizeItemName(itemName);
        const quantityElement = card.querySelector('.quantity');
        quantityElement.textContent = gameState.quantities[normalizedItemName] || 0;
    });
    
    // Обновляем состояние кнопок продажи
    updateSellButtons();
    
    // Добавляем обработчики событий для всех кнопок "Купить"
    buyButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const card = this.closest('.card');
            const priceElement = card.querySelector('.price');
            const quantityElement = card.querySelector('.quantity');
            const itemName = card.querySelector('h3').textContent;
            
            // Проверяем зажат ли Shift или Ctrl для покупки нескольких штук
            let quantity = 1;
            if (event.shiftKey) quantity = 10;
            if (event.ctrlKey) quantity = 100;
            
            handlePurchase(priceElement.textContent, moneyElement, quantityElement, itemName, receiptSystem, quantity);
            
            // Обновляем состояние кнопок продажи
            updateSellButtons();
        });
        
        // Добавляем подсказку о множественной покупке
        button.title = "Клик - купить 1 шт.\nShift+клик - купить 10 шт.\nCtrl+клик - купить 100 шт.";
    });
    
    // Добавляем обработчики событий для всех кнопок "Продать"
    sellButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            const card = this.closest('.card');
            const priceElement = card.querySelector('.price');
            const quantityElement = card.querySelector('.quantity');
            const itemName = card.querySelector('h3').textContent;
            
            // Проверяем зажат ли Shift или Ctrl для продажи нескольких штук
            let quantity = 1;
            if (event.shiftKey) quantity = 10;
            if (event.ctrlKey) quantity = 100;
            
            handleSale(priceElement.textContent, moneyElement, quantityElement, itemName, receiptSystem, quantity);
            
            // Обновляем состояние кнопок продажи
            updateSellButtons();
        });
        
        // Добавляем подсказку о множественной продаже
        button.title = "Клик - продать 1 шт.\nShift+клик - продать 10 шт.\nCtrl+клик - продать 100 шт.";
    });
    
    // Добавляем кнопку сброса игры
    if (!document.querySelector('.reset-button')) {
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Сбросить игру';
        resetButton.className = 'reset-button';
        resetButton.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            z-index: 1000;
            font-weight: bold;
        `;
        resetButton.addEventListener('click', function() {
            if (confirm('Сбросить всю игру и очистить чек?')) {
                localStorage.removeItem('cr7Money');
                localStorage.removeItem('cr7Quantities');
                localStorage.removeItem('cr7Receipt');
                location.reload();
            }
        });
        document.body.appendChild(resetButton);
    }
});
