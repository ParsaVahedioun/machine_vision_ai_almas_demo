const map = new L.Map("map", {
    key: "web.3a396447e0f2414faae98da040d3a9f7",
    maptype: "dreamy",
    poi: false,
    traffic: true,
    center: [32.6546, 51.6676], // مرکز اصفهان
    zoom: 14,
    minZoom: 12,
    maxBounds: [
        [32.5, 51.5], // جنوب غربی اصفهان
        [32.8, 51.8]  // شمال شرقی اصفهان
    ]
});

let highlightLayer;
let cameras = JSON.parse(localStorage.getItem('cameras')) || [];
let selectedPosition = null;

const cameraIcon = L.icon({
    iconUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30"><path fill="%232196F3" d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m8 3a5 5 0 0 0-5 5 5 5 0 0 0 5 5 5 5 0 0 0 5-5 5 5 0 0 0-5-5m0 2a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3z"/></svg>',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
})

function showAddCameraForm() {
    document.getElementById('add-camera-form').classList.remove('d-none');
    document.getElementById('camera-list').classList.add('d-none');
}
function cancelAddCamera() {
    document.getElementById('add-camera-form').classList.add('d-none');
    document.getElementById('camera-list').classList.remove('d-none');
    selectedPosition = null;
}

function getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(pos => {
        selectedPosition = [pos.coords.latitude, pos.coords.longitude];
        alert('موقعیت فعلی ثبت شد!');
    });
}
function selectOnMap() {
    alert('لطفاً روی نقشه کلیک کنید تا موقعیت انتخاب شود');
    map.on('click', handleMapClick);
}

function handleMapClick(e) {
    selectedPosition = [e.latlng.lat, e.latlng.lng];
    map.off('click', handleMapClick);
    alert('موقعیت انتخاب شد!');
}

function addCamera() {
    const name = document.getElementById('camera-name').value;
    const ip = document.getElementById('camera-ip').value;
    const port = document.getElementById('camera-port').value;

    if (!name || !ip || !port || !selectedPosition) {
        alert('لطفاً تمام فیلدها را پر کنید');
        return;
    }

    const newCamera = {
        id: Date.now(),
        name,
        ip,
        port,
        coordinates: selectedPosition,
        status: "فعال",
        lastUpdate: new Date().toLocaleDateString('fa-IR'),
        sstreamUrl: `/camera_feed/${Date.now()}`
    };

    cameras.push(newCamera);
    localStorage.setItem('cameras', JSON.stringify(cameras));
    updateCameraList();
    addCameraToMap(newCamera);
    cancelAddCamera();
}

function addCameraToMap(camera) {
    const popupContent = L.DomUtil.create('div', 'camera-popup');
    
    const videoHtml = `
        <div class="video-container">
            <img src="/camera_feed/${camera.id}" class="live-feed">
            <div class="fullscreen-btn" onclick="openFullscreen(${camera.id})">
                <i class="fas fa-expand"></i>
            </div>
        </div>
        <div class="camera-info">
            <h6>${camera.name}</h6>
            <p>IP: ${camera.ip}</p>
            <p>Status: ${camera.status}</p>
        </div>
    `;

    popupContent.innerHTML = videoHtml;
    
    const marker = L.marker(camera.coordinates, {icon: cameraIcon})
        .bindPopup(popupContent)
        .addTo(map);

    cameraMarkers[camera.id] = marker;
}


function openFullscreen(cameraId) {
    const modal = document.createElement('div');
    modal.className = 'video-modal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeFullscreen()"></div>
        <div class="modal-content">
            <img src="/camera_feed/${cameraId}" class="fullscreen-feed">
            <button class="close-btn" onclick="closeFullscreen()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeFullscreen() {
    const modal = document.querySelector('.video-modal');
    if(modal) modal.remove();
}

function updateCameraList() {
    const cameraList = document.getElementById('camera-list');
    cameraList.innerHTML = '';

    cameras.forEach(camera => {
      const item = document.createElement('div');
      item.className = 'camera-item p-2 border-bottom position-relative';
      item.innerHTML = `
        <div class="d-flex align-items-center gap-2">
        <img src="https://cdn-icons-png.flaticon.com/512/535/535137.png" width="30" height="30">
          <div>
            <h6 class="mb-0 text-primary">${camera.name}</h6>
            <small class="text-secondary">${camera.ip}:${camera.port}</small>
          </div>
          <button 
            class="btn btn-danger btn-sm  end-0 me-2"
            onclick="deleteCamera(${camera.id})"
            style="top: 50%; transform: translateY(-50%);"
          >
            حذف
          </button>
        </div>
    `;
        
        item.addEventListener('click', () => {
            map.setView(camera.coordinates, 18);
            L.marker(camera.coordinates, {icon: cameraIcon})
                .bindPopup(`
                    <div dir="rtl">
                        <h6 class="text-primary">${camera.name}</h6>
                        <p class="mb-1">IP: ${camera.ip}</p>
                        <p class="mb-1">Port: ${camera.port}</p>
                        <small class="text-muted">آخرین بروزرسانی: ${camera.lastUpdate}</small>
                    </div>
                `).openPopup();
        });

        cameraList.appendChild(item);
    });
}

function deleteCamera(cameraId, event) {
    event.stopPropagation(); // جلوگیری از اجرای رویدادهای والد
    
    if(confirm('آیا از حذف این دوربین اطمینان دارید؟')) {
        // حذف از آرایه
        cameras = cameras.filter(camera => camera.id !== cameraId);
        
        // حذف از localStorage
        localStorage.setItem('cameras', JSON.stringify(cameras));
        
        // حذف مارکر از نقشه
        if(cameraMarkers[cameraId]) {
            map.removeLayer(cameraMarkers[cameraId]);
            delete cameraMarkers[cameraId];
        }
        
        // بروزرسانی لیست
        updateCameraList();
    }
}

const cameraMarkers = {};

function deleteCamera(cameraId) {
    if(confirm('آیا از حذف این دوربین اطمینان دارید؟')) {
// حذف از آرایه
        cameras = cameras.filter(camera => camera.id !== cameraId);

// حذف از localStorage
        localStorage.setItem('cameras', JSON.stringify(cameras));

// حذف مارکر از نقشه
        if(cameraMarkers[cameraId]) {
            map.removeLayer(cameraMarkers[cameraId]);
            delete cameraMarkers[cameraId];
            }

// بروزرسانی لیست
updateCameraList();
}
}

// --- بخش پنجم: بارگذاری اولیه ---
cameras.forEach(addCameraToMap);
updateCameraList();

async function searchStreet() {
    const streetName = document.getElementById('streetInput').value.trim();
    if (!streetName) {
        alert("لطفاً نام خیابان را وارد کنید.");
        return;
    }

    try {
        const coords = await geocodeStreet(streetName);
        if (highlightLayer) map.removeLayer(highlightLayer);
        showTrafficArea(coords, streetName);
        map.setView([coords.lat, coords.lng], 16);
    } catch (error) {
        alert('❌ خطا در یافتن خیابان: ' + error.message);
    }
}

async function geocodeStreet(streetName) {
    const apiKey = "service.7295c595ad3944bd91c8bb6eb4b80246";
    const response = await fetch(`https://api.neshan.org/v1/search?term=${encodeURIComponent(streetName)}&lat=32.6546&lng=51.6676`, {
        headers: { 'Api-Key': apiKey }
    });

    const data = await response.json();
    console.log("📍 داده‌های دریافتی از API:", data);

    if (data.count > 0 && data.items.length > 0) {
        return {
            lat: data.items[0].location.y,
            lng: data.items[0].location.x
        };
    } else {
        throw new Error("❌ خیابان مورد نظر یافت نشد!");
    }
}

function showTrafficArea(coords, streetName) {
    highlightLayer = L.circle([coords.lat, coords.lng], {
        color: '#ff0000',
        fillColor: '#ff0000',
        fillOpacity: 0.2,
        radius: 500
    }).addTo(map);

    L.marker([coords.lat, coords.lng])
        .bindPopup(`<b>محدوده ترافیک:</b> ${streetName}`)
        .addTo(map);
}

// افزودن دوربین‌ها به نقشه
cameras.forEach(camera => {
    const marker = L.marker(camera.coordinates, {
        icon: cameraIcons
    }).addTo(map);

    marker.bindPopup(`
        <div style="min-width: 200px;" dir="rtl">
            <p style="color: #2196F3; margin: 0 0 10px 0;">${camera.name}</p>
            <p style="margin: 5px 0;">وضعیت: <b style="color: ${camera.status === 'فعال' ? '#4CAF50' : '#F44336'}">${camera.status}</b></p>
            <p style="margin: 5px 0;">آخرین بروزرسانی:<br>${camera.lastUpdate}</p>
        </div>
    `);
});

// ایجاد لیست دوربین‌ها
const cameraList = document.getElementById('camera-list');
cameras.forEach(camera => {
    const item = document.createElement('div');
    item.className = 'camera-item';
    item.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <div class="camera-icon"></div>
            <div>
                <h5 style="margin: 0; color: #2196F3;">${camera.name}</h5>
                <p style="margin: 5px 0; color: ${camera.status === 'فعال' ? '#4CAF50' : '#F44336'}">${camera.status}</p>
            </div>
        </div>
    `;
    

    // رویداد کلیک برای زوم روی موقعیت دوربین
    item.addEventListener('click', () => {
        map.setView(camera.coordinates, 16);
        map.eachLayer(layer => {
            if (layer instanceof L.Marker) {
                if (layer.getLatLng().equals(camera.coordinates)) {
                    layer.openPopup();
                }
            }
        });
    });

    cameraList.appendChild(item);
});
