// --- КОНФИГУРАЦИЯ ---
// -- запуск сервера 
// -- запуск бэкенда 
// -- запуск profitbase api 
const API_BASE_URL = 'https://0d7c454c7d6ec5.lhr.life/api/v1';

// Глобальные переменные состояния
let allProjects = []; 
let currentProject = null;           
let currentProjectBuildings = [];    
let currentBuilding = null;          
let selectedFlatId = null; // ID выбранной квартиры
let currentFlat = null;    // Объект выбранной квартиры

// --- ФУНКЦИИ НАВИГАЦИИ ---

function goToScreen(screenId) { 
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    // Показываем целевой экран
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.style.display = 'block';
        
        // Логика загрузки данных при переходе
        if (screenId === 'screen3') {
            loadProjects();
        } else if (screenId === 'screen4') {
            loadBuildings();
        } else if (screenId === 'screen6') {
            loadFilterScreen();
        } else if (screenId === 'screen7') {
            loadChessboard();
        } else if (screenId === 'screen10') {
            loadFlatDetails();
        } 
        // Если переходим на Главную (screen1) с экрана успеха -> чистим форму
        else if (screenId === 'screen1') {
            resetBookingForm();
            // Сбрасываем выбранные проекты/квартиры, чтобы начать поиск заново
            currentProject = null;
            currentBuilding = null;
            selectedFlatId = null;
        }
    }
}

// При загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.screen').forEach(s => {
        if (!s.classList.contains('active')) {
            s.style.display = 'none';
        }
    });
    
    if (typeof validateForm === 'function') {
        validateForm();
    }
    
    initFloorInputs();
});

// --- ЛОГИКА ЭКРАНА 3 (ПРОЕКТЫ) ---

function loadProjects() {
    const container = document.getElementById('projects-container');
    
    if (allProjects.length > 0) {
        renderProjects(allProjects);
        return;
    }

    container.innerHTML = '<p style="text-align:center; margin-top: 20px;">Загрузка проектов...</p>';

    fetch(`${API_BASE_URL}/projects`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка сети');
        return response.json();
    })
    .then(data => {
        allProjects = data;
        renderProjects(allProjects);
    })
    .catch(error => {
        console.error('Ошибка:', error);
        container.innerHTML = '<p style="text-align:center; color: red;">Не удалось загрузить проекты.</p>';
    });
}

function renderProjects(projects) {
    const container = document.getElementById('projects-container');
    container.innerHTML = '';

    if (projects.length === 0) {
        container.innerHTML = '<p style="text-align:center; margin-top: 20px;">Проекты не найдены</p>';
        return;
    }

    projects.forEach(project => {
        let imageHtml;
        if (project.images && project.images.length > 0 && project.images[0].url) {
            imageHtml = `<img src="${project.images[0].url}" alt="${project.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 12px;">`;
        } else {
            imageHtml = `<div class="gray-box">Фото ${project.title}</div>`;
        }

        const description = project.description && project.description.body ? project.description.body : '';

        let featuresHtml = '';
        if (project.parking) {
            featuresHtml += `
            <div class="feature-item">
                <img src="assets/icons8-sedan-60.png" class="feature-checkbox checked" alt="parking">
                <span style="font-size: 12px;">Парковка: ${project.parking}</span>
            </div>`;
        }

        let nearby = [];
        if (project.hasSchool) nearby.push('Школа');
        if (project.hasKindergarten) nearby.push('Детсад');
        if (project.hasPlayground) nearby.push('Игровая площадка');
        if (project.hasSportsGround) nearby.push('Спортплощадка');

        if (nearby.length > 0) {
            featuresHtml += `
            <div class="feature-item">
                <img src="assets/icons8-location-pin-48.png" class="feature-checkbox" alt="location">
                <span style="font-size: 12px;">Рядом: ${nearby.join(', ')}</span>
            </div>`;
        }

        if (project.parking) {
            featuresHtml += `
            <div class="feature-item">
                <img src="assets/icons8-sale-price-tag-48.png" class="feature-checkbox checked" alt="sale">
                <span style="font-size: 12px;">Паркинг в подарок - к некоторым квартирам</span>
            </div>`;
        }

        const cardHtml = `
        <div class="card">
            ${imageHtml}
            <h2>${project.title}</h2>
            <p style="font-weight: 600;">${description}</p>
            <div class="complex-features">${featuresHtml}</div>
            <button class="btn" onclick="selectProject(${project.id})">Выбрать</button>
        </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });
}

function handleSearch() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const filteredProjects = allProjects.filter(project => project.title.toLowerCase().includes(query));
    renderProjects(filteredProjects);
}

function selectProject(projectId) {
    currentProject = allProjects.find(p => p.id === projectId);
    if (currentProject) {
        goToScreen('screen4');
    } else {
        console.error('Проект не найден');
    }
}

// --- ЛОГИКА ЭКРАНА 4 (КОРПУСА) ---

function loadBuildings() {
    if (!currentProject) {
        goToScreen('screen3');
        return;
    }

    document.getElementById('screen4-project-title').textContent = currentProject.title;
    
    const imgContainer = document.getElementById('screen4-project-image-container');
    if (currentProject.images && currentProject.images.length > 0 && currentProject.images[0].url) {
        imgContainer.innerHTML = `<img src="${currentProject.images[0].url}" alt="${currentProject.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin: 12px 0;">`;
    } else {
        imgContainer.innerHTML = `<div class="gray-box">Фото ${currentProject.title}</div>`;
    }

    const container = document.getElementById('buildings-container');
    container.innerHTML = '<p style="text-align:center;">Загрузка корпусов...</p>';

    fetch(`${API_BASE_URL}/projects/${currentProject.id}/buildings`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка сети');
        return response.json();
    })
    .then(data => {
        currentProjectBuildings = data; 
        renderBuildings(data);
    })
    .catch(error => {
        console.error('Ошибка:', error);
        container.innerHTML = '<p style="text-align:center; color: red;">Не удалось загрузить корпуса.</p>';
    });
}

function renderBuildings(buildings) {
    const container = document.getElementById('buildings-container');
    container.innerHTML = '';

    if (!buildings || buildings.length === 0) {
        container.innerHTML = '<p style="text-align:center;">В этом ЖК пока нет доступных корпусов.</p>';
        return;
    }

    buildings.forEach((building, index) => {
        const isPhotoLeft = index % 2 === 0;
        
        let imgUrl = null;
        if (building.image_url) {
            imgUrl = building.image_url;
        } else if (building.full_image_url) {
            imgUrl = building.full_image_url;
        }
        
        const imgInnerHtml = imgUrl 
            ? `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;">` 
            : '';

        let contentHtml = '';
        if (isPhotoLeft) {
            contentHtml = `<div class="photo-left">${imgInnerHtml}</div><span style="font-size: 14px;">${building.title}</span>`;
        } else {
            contentHtml = `<span style="font-size: 14px;">${building.title}</span><div class="photo-right">${imgInnerHtml}</div>`;
        }

        const buildingEl = document.createElement('div');
        buildingEl.className = 'building-option';
        buildingEl.style.border = '1px solid #8F1C81';
        buildingEl.innerHTML = contentHtml;
        buildingEl.onclick = function() {
            selectBuilding(building.id);
        };

        container.appendChild(buildingEl);
    });
}

function selectBuilding(buildingId) {
    currentBuilding = currentProjectBuildings.find(b => b.id === buildingId);
    
    if (currentBuilding) {
        goToScreen('screen6');
    } else {
        console.error('Ошибка выбора корпуса');
    }
}

// --- ЛОГИКА ЭКРАНА 6 (ФИЛЬТРЫ) ---

function loadFilterScreen() {
    if (!currentBuilding) {
        goToScreen('screen4');
        return;
    }

    document.getElementById('screen6-title').textContent = currentBuilding.title;

    const imgContainer = document.getElementById('screen6-image-container');
    let imgUrl = currentBuilding.image_url || currentBuilding.full_image_url;
    
    if (imgUrl) {
        imgContainer.className = 'gray-box'; 
        imgContainer.style.background = 'none'; 
        imgContainer.innerHTML = `<img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
    } else {
        imgContainer.className = 'gray-box';
        imgContainer.innerHTML = `[Фото ${currentBuilding.title}]`;
    }

    const minInput = document.getElementById('floor-min-input');
    const maxInput = document.getElementById('floor-max-input');
    
    const minFloor = currentBuilding.minFloor || 1;
    const maxFloor = currentBuilding.maxFloor || 25;

    minInput.min = minFloor;
    minInput.max = maxFloor;
    maxInput.min = minFloor;
    maxInput.max = maxFloor;

    minInput.value = minFloor;
    maxInput.value = maxFloor;

    document.getElementById('room-count').textContent = '1';
}

function changeRoomCount(change) {
    if (!currentBuilding) return;

    const roomCountElement = document.getElementById('room-count');
    let currentCount = parseInt(roomCountElement.textContent);
    let newCount = currentCount + change;
    
    const maxRooms = currentBuilding.maxRooms || 5;
    
    if (newCount >= 1 && newCount <= maxRooms) {
        roomCountElement.textContent = newCount;
    }
}

function initFloorInputs() {
    const floorInputs = document.querySelectorAll('.floor-input');
    
    floorInputs.forEach(input => {
        input.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        input.addEventListener('change', function() {
            const min = parseInt(this.min) || 1;
            const max = parseInt(this.max) || 25;
            let value = parseInt(this.value);

            if (isNaN(value) || value < min) this.value = min;
            if (value > max) this.value = max;
        });

        input.addEventListener('keyup', function() {
             const max = parseInt(this.max) || 999;
             if (parseInt(this.value) > max) {
                 this.value = max;
             }
        });
        
        input.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                let value = parseInt(this.value) || parseInt(this.min) || 1;
                const max = parseInt(this.max) || 25;
                if (value < max) this.value = value + 1;
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                let value = parseInt(this.value) || parseInt(this.min) || 1;
                const min = parseInt(this.min) || 1;
                if (value > min) this.value = value - 1;
            }
        });
    });
}

// --- ЛОГИКА ЭКРАНА 7 (ШАХМАТКА) ---

function loadChessboard() {
    if (!currentBuilding) {
        goToScreen('screen4');
        return;
    }

    document.getElementById('screen7-title').textContent = currentBuilding.title;
    selectedFlatId = null;

    const minFloor = document.getElementById('floor-min-input').value;
    const maxFloor = document.getElementById('floor-max-input').value;
    const rooms = document.getElementById('room-count').textContent;
    const houseId = currentBuilding.id;

    const container = document.getElementById('chessboard-container');
    container.innerHTML = '<p style="text-align:center; margin-top: 40px;">Загрузка шахматки...</p>';

    const url = `${API_BASE_URL}/flats/chessboard?houseId=${houseId}&rooms=${rooms}&minFloor=${minFloor}&maxFloor=${maxFloor}`;

    fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка сети');
        return response.json();
    })
    .then(data => {
        renderChessboard(data);
    })
    .catch(error => {
        console.error('Ошибка:', error);
        container.innerHTML = '<p style="text-align:center; color: red;">Не удалось загрузить варианты квартир.</p>';
    });
}

function renderChessboard(data) {
    const container = document.getElementById('chessboard-container');
    container.innerHTML = '';

    if (!data.floors || data.floors.length === 0) {
        container.innerHTML = '<p style="text-align:center; margin-top: 40px;">Нет доступных квартир по выбранным параметрам.</p>';
        return;
    }

    const sortedFloors = data.floors.sort((a, b) => b.number - a.number);

    sortedFloors.forEach(floor => {
        const floorDiv = document.createElement('div');
        floorDiv.className = 'floor-container';
        floorDiv.style.marginBottom = '40px';

        const labelDiv = document.createElement('div');
        labelDiv.className = 'floor-label';
        labelDiv.style.textAlign = 'center';
        labelDiv.style.marginBottom = '10px';
        labelDiv.textContent = `Этаж ${floor.number}`;

        const apartmentsDiv = document.createElement('div');
        apartmentsDiv.className = 'apartments';

        if (floor.properties) {
            for (const [flatNumber, flatId] of Object.entries(floor.properties)) {
                const btn = document.createElement('button');
                btn.className = 'apartment-btn';
                btn.textContent = flatNumber;
                btn.style.background = 'transparent';
                btn.style.border = '1px solid #8F1C81';
                
                btn.onclick = function() {
                    selectFlatInChessboard(btn, flatId);
                };

                apartmentsDiv.appendChild(btn);
            }
        }

        floorDiv.appendChild(labelDiv);
        floorDiv.appendChild(apartmentsDiv);
        container.appendChild(floorDiv);
    });
}

function selectFlatInChessboard(btnElement, flatId) {
    const allBtns = document.querySelectorAll('.apartment-btn');
    allBtns.forEach(btn => {
        btn.style.backgroundColor = 'transparent';
        btn.style.color = '#000000';
    });

    btnElement.style.backgroundColor = '#8F1C81';
    btnElement.style.color = 'white';

    selectedFlatId = flatId;
    console.log('Выбрана квартира ID:', selectedFlatId);
}

function goToFlatDetails() {
    if (selectedFlatId) {
        goToScreen('screen10');
    } else {
        alert('Пожалуйста, выберите квартиру');
    }
}

// --- ЛОГИКА ЭКРАНА 10 (ДЕТАЛИ КВАРТИРЫ) ---

function loadFlatDetails() {
    if (!selectedFlatId) {
        goToScreen('screen7');
        return;
    }

    const titleEl = document.getElementById('flat-title');
    const imageContainer = document.getElementById('flat-image-container');
    const roomsEl = document.getElementById('flat-rooms');
    const floorEl = document.getElementById('flat-floor');
    const areaEl = document.getElementById('flat-area');
    const layoutEl = document.getElementById('flat-layout');

    titleEl.textContent = 'Загрузка...';
    
    fetch(`${API_BASE_URL}/flats/${selectedFlatId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        if (!response.ok) throw new Error('Ошибка сети');
        return response.json();
    })
    .then(flat => {
        currentFlat = flat;

        titleEl.textContent = `Квартира ${flat.number}`;

        if (flat.images && flat.images.length > 0) {
            imageContainer.innerHTML = `<img src="${flat.images[0]}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
            imageContainer.style.background = 'none';
            imageContainer.style.alignItems = 'normal';
        } else {
            imageContainer.innerHTML = `[Фото квартиры]`;
            imageContainer.style.background = '#f2f2f7';
        }

        roomsEl.textContent = flat.rooms_amount;
        floorEl.textContent = flat.floor;
        
        if (flat.area && flat.area.area_total) {
            areaEl.textContent = `${flat.area.area_total} м²`;
        } else {
            areaEl.textContent = '—';
        }

        let layouts = [];
        if (flat.is_studio) layouts.push("Студия");
        if (flat.is_euro_layout) layouts.push("Евро-планировка");
        if (flat.is_free_layout) layouts.push("Свободная планировка");
        if (flat.is_without_layout) layouts.push("Без планировки");

        if (layouts.length > 0) {
            layoutEl.textContent = layouts.join(', ');
        } else {
            layoutEl.textContent = '—';
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        titleEl.textContent = 'Ошибка загрузки';
    });
}

// --- ЛОГИКА ФОРМЫ И БРОНИРОВАНИЯ (экран 8) ---
let agreementChecked = false;

function toggleAgreement() {
    agreementChecked = !agreementChecked;
    const checkbox = document.getElementById('agreementCheckbox');
    if (agreementChecked) {
        checkbox.classList.add('checked');
        checkbox.innerHTML = '✓';
    } else {
        checkbox.classList.remove('checked');
        checkbox.innerHTML = '';
    }
    validateForm();
}

function validateForm() {
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const reserveBtn = document.getElementById('reserveBtn');
    const errorMessage = document.getElementById('errorMessage');

    if (!fullNameInput || !phoneInput || !emailInput || !reserveBtn) return;
    
    const fullName = fullNameInput.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    
    const isNameValid = fullName.length > 0;
    const phoneRegex = /^(\+7|8)[0-9]{10}$/;
    const isPhoneValid = phoneRegex.test(phone.replace(/\s/g, ''));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmailValid = emailRegex.test(email);
    
    if (isNameValid && isPhoneValid && isEmailValid && agreementChecked) {
        reserveBtn.disabled = false;
        errorMessage.style.display = 'none';
    } else {
        reserveBtn.disabled = true;
        errorMessage.style.display = 'block';
    }
}

// Вспомогательная функция для получения Telegram InitData
function getTelegramInitData() {
    if (window.Telegram && window.Telegram.WebApp) {
        return window.Telegram.WebApp.initData;
    }
    return '';
}

// --- ФУНКЦИЯ ОЧИСТКИ ФОРМЫ ---
function resetBookingForm() {
    // Очистка текстовых полей
    document.getElementById('fullName').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    
    // Сброс галочки согласия
    agreementChecked = false;
    const checkbox = document.getElementById('agreementCheckbox');
    if (checkbox) {
        checkbox.classList.remove('checked');
        checkbox.innerHTML = '';
    }
    
    // Сброс состояния кнопки (через валидацию)
    validateForm();
}

// Основная функция отправки брони
function submitBooking() {
    if (!selectedFlatId) {
        alert("Ошибка: Квартира не выбрана");
        return;
    }

    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const reserveBtn = document.getElementById('reserveBtn');

    // Блокируем кнопку на время запроса
    reserveBtn.disabled = true;
    reserveBtn.textContent = 'Отправка...';

    const bookingData = {
        "flat_id": parseInt(selectedFlatId),
        "name": fullName,
        "phone": phone,
        "email": email
    };

    fetch(`${API_BASE_URL}/booking`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-telegram-initdata': getTelegramInitData()
        },
        body: JSON.stringify(bookingData)
    })
    .then(response => {
        // ОБРАБОТКА ОШИБКИ 409 (КОНФЛИКТ)
        if (response.status === 409) {
            throw new Error('CONFLICT');
        }
        if (!response.ok) {
            throw new Error('Ошибка сервера при бронировании');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // УСПЕХ: Очищаем форму (галочки, поля)
            resetBookingForm();
            
            // Переход на финальный экран
            goToScreen('screen9');
        } else {
            // Логическая ошибка от бэкенда
            alert(`Ошибка бронирования: ${data.message || 'Неизвестная ошибка'}`);
            reserveBtn.disabled = false;
            reserveBtn.textContent = 'Забронировать';
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);

        // Обработка конфликта бронирования
        if (error.message === 'CONFLICT') {
            alert('К сожалению, эта квартира только что была забронирована другим пользователем. Пожалуйста, выберите другую.');
            
            // Сбрасываем выбранную квартиру
            selectedFlatId = null;
            currentFlat = null;
            
            // Перенаправляем на экран выбора комплексов (screen3)
            goToScreen('screen3');
        } else {
            // Прочие ошибки
            alert('Произошла ошибка при отправке данных. Попробуйте позже.');
            reserveBtn.disabled = false;
            reserveBtn.textContent = 'Забронировать';
        }
    });
}