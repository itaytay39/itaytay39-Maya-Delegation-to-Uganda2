// 🚀 אפליקציית מאיה מחוברת לגוגל שיטס - גרסה מתקדמת
console.log("🚀 מתחיל אתחול אפליקציית מאיה מחוברת לגוגל שיטס...");

// הגדרות מערכת
const SHEET_CONFIG = {
    // השתמש ב-ID של הגיליון users ששלחת קודם
    spreadsheetId: '2PACX-1vT5-QyAGcqlBZuNv2vMCnlNAxAo3IOhkC5p7jgotCi55cvApP-HW61LZsZwbjffKqjnQvxzCa56BULY', 
    // הקישור המלא והמדויק לגיליון users בפורמט CSV
    participantsUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT5-QyAGcqlBZuNv2vMCnlNAxAo3IOhkC5p7jgotCi55cvApP-HW61LZsZwbjffKqjnQvxzCa56BULY/pub?gid=0&single=true&output=csv',
    // triviaUrl הוסר לבקשת המשתמש
    syncInterval: 30000 // סנכרון כל 30 שניות
};

// משתנים גלובליים
let participants = [];
// triviaQuestions הוסר לבקשת המשתמש
let admin = false;
const adminPassword = "1234";
let editIdx = null;
let syncTimer = null;

// מערכת הודעות מתקדמת
const ToastManager = {
    show: (message, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
};

// מערכת אחסון מתקדמת
const StorageManager = {
    save: () => {
        try {
            localStorage.setItem('maya-participants', JSON.stringify(participants));
            localStorage.setItem('maya-last-update', new Date().toISOString());
            console.log("💾 נתונים נשמרו ב-localStorage");
        } catch (error) {
            console.error("❌ שגיאה בשמירת נתונים:", error);
        }
    },
    
    load: () => {
        try {
            const saved = localStorage.getItem('maya-participants');
            const lastUpdate = localStorage.getItem('maya-last-update');
            
            if (saved) {
                const savedData = JSON.parse(saved);
                if (savedData.length > 0) {
                    participants = savedData;
                    console.log(`📂 נטענו ${participants.length} משתתפים מ-localStorage`);
                    console.log(`📅 עדכון אחרון: ${lastUpdate}`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("❌ שגיאה בטעינת נתונים:", error);
            return false;
        }
    }
};

// הגנת אדמין מתקדמת
const AdminGuard = {
    isAdmin: () => admin,
    requireAdmin: (callback) => {
        if (!admin) {
            console.warn("🚫 ניסיון גישה לא מורשה לפונקציית אדמין");
            ToastManager.show("נדרשת הרשאת מנהל לפעולה זו", "error");
            return false;
        }
        return callback();
    }
};

// אתחול מפה Leaflet
const map = L.map('map').setView([31.5, 34.75], 8); // מרכז את המפה על ישראל
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// אייקון סמן מודרני מתקדם
const modernMarkerIcon = L.divIcon({
    className: 'modern-marker',
    html: `
        <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        ">
            <div style="
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                transform: rotate(45deg);
                box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
            "></div>
        </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
});

// אלמנטים
const adminModal = document.getElementById('admin-login-modal');
const userModal = document.getElementById('user-form-modal');
const addBtn = document.getElementById('add-user-btn');
const adminControls = document.getElementById('admin-controls');
const searchInput = document.getElementById('search-input');
const participantCount = document.getElementById('participant-count');
const fileInput = document.getElementById('file-input');

// פונקציות עזר
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

async function geocodeCity(city) {
    try {
        console.log(`🔍 מחפש מיקום עבור: ${city}`);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ', ישראל')}`;
        const resp = await fetch(url, {headers: {'Accept-Language': 'he'}});
        const data = await resp.json();
        if (data && data.length > 0) {
            console.log(`✅ נמצא מיקום עבור ${city}`);
            return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
        }
        throw new Error('לא נמצא מיקום לעיר שהוזנה');
    } catch (error) {
        console.error(`❌ שגיאה בחיפוש מיקום עבור ${city}:`, error);
        ToastManager.show('שגיאה בחיפוש מיקום העיר: ' + error.message, 'error');
        throw new Error('שגיאה בחיפוש מיקום העיר');
    }
}

function updateParticipantCount() {
    participantCount.textContent = `${participants.length} משתתפים`;
    console.log(`📊 עודכן מספר משתתפים: ${participants.length}`);
}

// לוגיקה לסינכרון מגיליון Google Sheets
const GoogleSheetsSync = {
    async loadData(isManual = false) {
        const url = `${SHEET_CONFIG.participantsUrl}&t=${new Date().getTime()}`; // הוספת timestamp למניעת קאשינג
        const syncButtonIcon = document.getElementById('sync-btn')?.querySelector('.material-symbols-outlined');
        if(syncButtonIcon) {
            syncButtonIcon.style.animation = 'spin 1s linear infinite'; // אנימציית סיבוב
        }
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const csvText = await response.text();
            const rows = this.parseCSV(csvText);
            
            if (rows.length < 2) { // רק כותרות או אין נתונים
                if (isManual) ToastManager.show('גיליון גוגל ריק או מכיל רק כותרות. לא טענתי נתונים חדשים.', 'warning');
                return; // יציאה ללא שינוי participants
            }
            
            const headers = rows[0].map(h => h.trim()); 
            const fetchedParticipants = rows.slice(1).map(row => {
                const obj = {}; 
                headers.forEach((h, i) => obj[h] = row[i] || '');
                
                const lat = parseFloat(obj['Lat']);
                const lon = parseFloat(obj['Lon']);

                return { 
                    name: `${obj['שם פרטי'] || ''} ${obj['שם משפחה'] || ''}`.trim(), 
                    firstName: obj['שם פרטי'] || '', 
                    lastName: obj['שם משפחה'] || '', 
                    city: obj['עיר'] || 'לא צוין', 
                    lat: isNaN(lat) ? null : lat, 
                    lon: isNaN(lon) ? null : lon, 
                    phone: this.formatPhone(obj['מספר טלפון']), 
                    // תיקון: כולל גם 'מספר וואצפ' (בלי א') לזיהוי נכון
                    whatsapp: this.formatPhone(obj['מספר וואצפ'] || obj['מספר ווצאפ'] || obj['מספר WhatsApp']) 
                };
            }).filter(p => p.name && p.lat !== null && p.lon !== null); // רק משתתפים עם שם וקואורדינטות תקינות
            
            if (fetchedParticipants.length > 0) {
                participants = fetchedParticipants; // עדכון המערך הגלובלי
                StorageManager.save(); // שמירה ל-localStorage
                if (isManual) ToastManager.show(`סונכרנו ${participants.length} משתתפים מגיליון גוגל.`, 'success');
                renderMarkers(); // הצגת הסמנים על המפה
                updateParticipantCount(); // עדכון מונה המשתתפים
            } else {
                if (isManual) ToastManager.show('לא נמצאו משתתפים חוקיים בגיליון גוגל. לא טענתי נתונים חדשים.', 'warning');
            }
            
        } catch (error) {
            console.error("❌ שגיאה בטעינת נתונים מגיליון גוגל:", error);
            ToastManager.show(`שגיאה בטעינת נתונים מגיליון גוגל: ${error.message}`, 'error');
        } finally {
             if(syncButtonIcon) {
                 syncButtonIcon.style.animation = ''; // הסרת אנימציית סיבוב
             }
        }
    },
    parseCSV(csvText) {
        const lines = csvText.split(/\r\n|\n/).filter(line => line.trim() !== ''); // פיצול לשורות וניקוי שורות ריקות
        return lines.map(line => {
            // לוגיקה מתקדמת לטיפול ב-CSV עם פסיקים בתוך גרשיים
            const result = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                const nextChar = line[i+1];

                if (char === '"' && inQuotes && nextChar === '"') { // escaped quote
                    current += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim().replace(/^"|"$/g, '')); // remove surrounding quotes
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim().replace(/^"|"$/g, '')); // add last item
            return result;
        });
    },
    formatPhone(phone) { // פונקציית עזר לעיצוב מספרי טלפון
        if (!phone) return '';
        const cleaned = phone.replace(/\D/g, ''); // הסרת כל תו שאינו ספרה
        if (cleaned.startsWith('0')) {
            return cleaned; // כבר בפורמט ישראלי
        } else if (cleaned.startsWith('972')) {
            return '0' + cleaned.substring(3); // הפיכה מ-972 ל-0
        }
        return '0' + cleaned.slice(-9); // הוספת 0 אם חסר
    },
    startAutoSync() { // הפעלת סנכרון אוטומטי
        this.stopAutoSync();
        syncTimer = setInterval(() => this.loadData(false), SHEET_CONFIG.syncInterval);
        console.log(`⏰ התחיל סנכרון אוטומטי כל ${SHEET_CONFIG.syncInterval / 1000} שניות.`);
    },
    stopAutoSync() { // עצירת סנכרון אוטומטי
        if (syncTimer) {
            clearInterval(syncTimer);
            console.log("🛑 סנכרון אוטומטי הופסק.");
        }
    }
};

// פונקציות לניהול סמנים על המפה
let markers = L.markerClusterGroup(); // קבוצת סמנים לקיבוץ

function renderMarkers(list = participants) {
    console.log("🗺️ מציג סמנים על המפה...");
    
    if (markers) {
        map.removeLayer(markers); // הסרת שכבת הסמנים הקודמת
    }
    markers = L.markerClusterGroup(); // יצירת קבוצת סמנים חדשה

    const groupedLocations = {}; // לקיבוץ משתתפים באותו מיקום
    list.forEach(p => {
        const key = `${p.lat},${p.lon}`;
        if (!groupedLocations[key]) {
            groupedLocations[key] = [];
        }
        groupedLocations[key].push(p);
    });

    for (const key in groupedLocations) {
        const group = groupedLocations[key];
        const baseLat = group[0].lat;
        const baseLon = group[0].lon;

        group.forEach((p, indexInGroup) => {
            if (p.lat === null || isNaN(p.lat) || p.lon === null || isNaN(p.lon)) {
                console.warn(`Participant ${p.name} has invalid coordinates and will be skipped for marker display.`);
                return; // דילוג על משתתפים ללא קואורדינטות תקינות
            }

            // יצירת היסט קטן עבור סמנים באותו מיקום כדי למנוע חפיפה
            const offsetMagnitude = 0.00005; 
            const angleStep = (2 * Math.PI) / group.length;
            const angle = indexInGroup * angleStep;
            const offsetX = offsetMagnitude * Math.cos(angle);
            const offsetY = offsetMagnitude * Math.sin(angle);

            const finalLat = baseLat + offsetY;
            const finalLon = baseLon + offsetX;

            const whatsappNum = (p.whatsapp && p.whatsapp.length > 0) ? p.whatsapp : p.phone;
            const hasWhatsapp = whatsappNum && whatsappNum.length >= 9;
            
            let nearby = null;
            for (let j = 0; j < participants.length; j++) {
                const other = participants[j];
                if (other === p) continue;
                if (
                    typeof other.lat === "number" &&
                    typeof other.lon === "number" &&
                    distance(p.lat, p.lon, other.lat, other.lon) <= 20
                ) {
                    nearby = other;
                    break;
                }
            }

            const message = encodeURIComponent(`היי ${p.name}, רוצה לתאם נסיעה משותפת למשלחת מאיה לאוגנדה? 🚗✈️🇺🇸`);

            const popup = `
                <div class="popup-box">
                    <div class="popup-name">
                        <span class="material-symbols-outlined" style="color: var(--md-primary);">person</span>
                        ${p.name}
                    </div>
                    <div class="popup-city">
                        <span class="material-symbols-outlined" style="color: var(--md-primary);">location_on</span>
                        <span>${p.city}</span>
                    </div>
                    <div class="popup-phone">📞 ${p.phone.replace(/^0(\d{2,3})(\d{7})$/, '0$1-$2')}</div>
                    <div class="popup-btns">
                        <a href="tel:${p.phone}" class="popup-btn phone" target="_blank">
                            <span class="material-symbols-outlined">call</span>
                            צור קשר
                        </a>
                        ${hasWhatsapp ? `
                        <a href="https://wa.me/972${whatsappNum.replace(/^0/,'')}?text=${message}" class="popup-btn whatsapp" target="_blank">
                            <span class="material-symbols-outlined">chat</span>
                            וואטסאפ
                        </a>
                        ` : ''}
                        ${admin ? `
                        <button class="popup-btn edit" onclick="editUser(${participants.indexOf(p)})">
                            <span class="material-symbols-outlined">edit</span>
                            ערוך
                        </button>
                        <button class="popup-btn delete" onclick="deleteUser(${participants.indexOf(p)})">
                            <span class="material-symbols-outlined">delete</span>
                            מחק
                        </button>
                        ` : ''}
                        ${nearby && hasWhatsapp ? `
                        <button class="popup-btn carpool" onclick="suggestCarpool('${p.name}', '${whatsappNum}')">
                            <span class="material-symbols-outlined">directions_car</span>
                            הצע נסיעה משותפת
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
            
            const marker = L.marker([finalLat, finalLon], {icon: modernMarkerIcon});
            marker.bindPopup(popup, {closeButton: true, maxWidth: 350});
            markers.addLayer(marker); // הוספה לקבוצת הסמנים
        });
    }
    
    map.addLayer(markers); // הוספת קבוצת הסמנים למפה
    
    console.log(`✅ הוצגו ${list.length} סמנים על המפה`);
}

// פונקציות גלובליות לשימוש בפופאפ
window.editUser = function(idx) {
    return AdminGuard.requireAdmin(() => {
        console.log(`✏️ עריכת משתמש: ${participants[idx].name}`);
        editIdx = idx;
        const p = participants[idx];
        document.getElementById('user-form-title').innerText = '✏️ עריכת משתתף';
        document.getElementById('user-first-name').value = p.firstName;
        document.getElementById('user-last-name').value = p.lastName;
        document.getElementById('user-city').value = p.city;
        document.getElementById('user-phone').value = p.phone;
        document.getElementById('user-whatsapp').value = p.whatsapp || '';
        userModal.hidden = false;
    });
};

window.deleteUser = function(idx) {
    return AdminGuard.requireAdmin(() => {
        const user = participants[idx];
        showConfirmationDialog(`האם אתה בטוח שברצונך למחוק את ${user.name}?`, () => {
            console.log(`🗑️ מוחק משתמש: ${user.name}`);
            participants.splice(idx, 1);
            StorageManager.save();
            renderMarkers();
            updateParticipantCount();
            ToastManager.show(`${user.name} נמחק בהצלחה`);
        });
    });
};

window.suggestCarpool = function(name, phone) {
    console.log(`🚗 הצעת נסיעה משותפת ל: ${name}`);
    const message = encodeURIComponent(`היי ${name}, רוצה לתאם נסיעה משותפת למשלחת מאיה לאוגנדה? 🚗✈️🇺🇸`);
    window.open(`https://wa.me/972${phone.replace(/^0/,'')}?text=${message}`, '_blank');
};


// Custom Confirmation Dialog (Replaces confirm())
function showConfirmationDialog(message, onConfirm) {
    const dialogId = 'custom-confirm-dialog';
    let dialog = document.getElementById(dialogId);

    if (!dialog) {
        dialog = document.createElement('div');
        dialog.id = dialogId;
        dialog.className = 'modal';
        dialog.innerHTML = `
            <div class="modal-content">
                <h3 id="confirm-message"></h3>
                <div class="button-group">
                    <button class="btn btn-primary" id="confirm-yes">כן</button>
                    <button class="btn btn-secondary" id="confirm-no">לא</button>
                </div>
            </div>
        `;
        document.body.appendChild(dialog);
    }

    document.getElementById('confirm-message').textContent = message;
    dialog.hidden = false;

    const confirmYes = document.getElementById('confirm-yes');
    const confirmNo = document.getElementById('confirm-no');

    const cleanUp = () => {
        confirmYes.onclick = null;
        confirmNo.onclick = null;
        dialog.hidden = true;
    };

    confirmYes.onclick = () => {
        onConfirm();
        cleanUp();
    };

    confirmNo.onclick = () => {
        cleanUp();
    };
}


// מאזיני אירועים - DOMContentLoaded (מבטיח שה-HTML נטען לפני שהסקריפט רץ)
document.addEventListener('DOMContentLoaded', () => {
    // אתחול ראשוני - טעינת נתונים מ-localStorage או מגיליון Google
    console.log("🚀 מתחיל עיבוד נתונים ראשוני...");
    if (!StorageManager.load()) {
        console.log("📦 לא נמצאו נתונים ב-localStorage, טוען מגיליון גוגל.");
        GoogleSheetsSync.loadData(true); // טעינה ראשונית מגיליון Google
    } else {
        // אם נטענו מ-localStorage, עדכן UI ונסה לסנכרן ברקע
        renderMarkers();
        updateParticipantCount();
        console.log("🔄 נתונים נטענו מ-localStorage, מבצע סנכרון רקע...");
        GoogleSheetsSync.loadData(false); // סנכרון ברקע בלי להציג הודעות טוסט מפורטות
    }
    GoogleSheetsSync.startAutoSync(); // התחלת סנכרון אוטומטי

    console.log("✅ אפליקציית מאיה מוכנה לשימוש!");

    // מאזינים לכפתורים ואינטראקציות
    document.getElementById('admin-login-btn').addEventListener('click', () => {
        console.log("🔐 נפתח מודל כניסת אדמין");
        adminModal.hidden = false;
        document.getElementById('admin-password').focus();
    });

    document.getElementById('admin-logout-btn').addEventListener('click', () => {
        console.log("🚪 התנתקות אדמין");
        setAdminMode(false);
    });

    document.getElementById('admin-cancel').addEventListener('click', () => {
        adminModal.hidden = true;
        document.getElementById('admin-password').value = '';
    });

    document.getElementById('admin-login').addEventListener('click', () => {
        const password = document.getElementById('admin-password').value;
        console.log("🔑 ניסיון התחברות אדמין");
        
        if (password === adminPassword) {
            setAdminMode(true);
            adminModal.hidden = true;
            document.getElementById('admin-password').value = '';
            console.log("✅ התחברות אדמין הצליחה");
        } else {
            console.warn("❌ ניסיון התחברות אדמין נכשל");
            ToastManager.show('סיסמה שגויה!', 'error');
            document.getElementById('admin-password').value = '';
        }
    });

    // כפתורי יבוא ויצוא
    document.getElementById('import-btn').addEventListener('click', () => {
        fileInput.click();
    });

    document.getElementById('export-btn').addEventListener('click', exportToExcel);

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importFromFile(file);
            e.target.value = ''; // איפוס הקלט
        }
    });

    // Sync from Google Sheet button
    document.getElementById('sync-btn').addEventListener('click', () => {
        return AdminGuard.requireAdmin(() => {
            console.log("🔄 מנסה לסנכרן מגיליון גוגל");
            GoogleSheetsSync.loadData(true); // Pass true for manual sync to show more detailed toasts
        });
    });

    // הוספת משתמש
    addBtn.addEventListener('click', () => {
        return AdminGuard.requireAdmin(() => {
            console.log("➕ פתיחת טופס הוספת משתמש");
            editIdx = null;
            document.getElementById('user-form-title').innerText = '➕ הוסף משתתף';
            document.getElementById('user-first-name').value = '';
            document.getElementById('user-last-name').value = '';
            document.getElementById('user-city').value = '';
            document.getElementById('user-phone').value = '';
            document.getElementById('user-whatsapp').value = '';
            userModal.hidden = false;
        });
    });

    document.getElementById('user-cancel').addEventListener('click', () => {
        userModal.hidden = true;
    });

    // שמירת משתמש
    document.getElementById('user-save').addEventListener('click', async () => {
        return AdminGuard.requireAdmin(async () => {
            const firstName = document.getElementById('user-first-name').value.trim();
            const lastName = document.getElementById('user-last-name').value.trim();
            const city = document.getElementById('user-city').value.trim();
            const phone = document.getElementById('user-phone').value.trim();
            const whatsapp = document.getElementById('user-whatsapp').value.trim();
            
            const fullName = `${firstName} ${lastName}`.trim();

            if (!fullName || !city || !phone) {
                ToastManager.show('אנא מלא את כל השדות הנדרשים: שם מלא, עיר וטלפון', 'error');
                return;
            }
            
            if (!/^0\d{8,9}$/.test(phone)) {
                ToastManager.show('מספר טלפון לא תקין', 'error');
                return;
            }
            
            try {
                const saveBtn = document.getElementById('user-save');
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<span class="material-symbols-outlined">autorenew</span> שומר...';
                
                console.log(`💾 שומר משתמש: ${fullName} מ${city}`);
                const { lat, lon } = await geocodeCity(city);
                
                const newUser = {
                    name: fullName,
                    firstName: firstName,
                    lastName: lastName,
                    city: city,
                    lat: lat,
                    lon: lon,
                    phone: phone,
                    whatsapp: whatsapp
                };
                
                if (editIdx !== null) {
                    console.log(`✏️ עודכן משתמש: ${participants[editIdx].name} → ${fullName}`);
                    participants[editIdx] = newUser;
                    editIdx = null;
                    ToastManager.show(`${fullName} עודכן בהצלחה!`);
                } else {
                    console.log(`➕ נוסף משתמש חדש: ${fullName}`);
                    participants.push(newUser);
                    ToastManager.show(`${fullName} נוסף בהצלחה!`);
                }
                
                StorageManager.save();
                userModal.hidden = true;
                renderMarkers();
                updateParticipantCount();
                
            } catch (err) {
                console.error("❌ שגיאה בשמירת משתמש:", err);
                ToastManager.show('לא נמצא מיקום לעיר שהוזנה. אנא בדוק את שם העיר.', 'error');
            } finally {
                const saveBtn = document.getElementById('user-save');
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<span class="material-symbols-outlined">save</span> שמירה';
            }
        });
    });
    
    // חיפוש
    document.getElementById('search-input').addEventListener('input', function() {
        const val = this.value.trim().toLowerCase();
        console.log(`🔍 חיפוש: "${val}"`);
        
        if (!val) {
            renderMarkers();
            return;
        }
        
        const filtered = participants.filter(p =>
            p.name.toLowerCase().includes(val) || 
            p.city.toLowerCase().includes(val) || 
            p.phone.includes(val)
        );
        console.log(`📋 נמצאו ${filtered.length} תוצאות חיפוש`);
        renderMarkers(filtered);
    });
    
    // סגירת מודלים בלחיצה חיצונית
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.hidden = true;
        }
    });
    
    // התאמת מפה לגודל החלון
    window.addEventListener('resize', () => {
        map.invalidateSize();
    });
    
    setTimeout(() => {
        map.invalidateSize();
    }, 500);

    // טיפול בכפתור ריסט למפה
    document.getElementById('reset-view-fab').addEventListener('click', () => {
        map.setView([31.5, 34.75], 8); // Reset to Israel center and zoom
        ToastManager.show('הצגת מפה אופסה למרכז ישראל', 'info');
    });
});

// פונקציה לייצוא ל-Excel
function exportToExcel() {
    return AdminGuard.requireAdmin(() => {
        const exportData = participants.map(p => ({
            'שם פרטי': p.firstName,
            'שם משפחה': p.lastName,
            'עיר': p.city,
            'טלפון': p.phone,
            'וואטסאפ': p.whatsapp || '',
            'קו רוחב': p.lat,
            'קו אורך': p.lon
        }));
        
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "משתתפים");
        
        const fileName = `maya-participants-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        ToastManager.show('הקובץ יוצא בהצלחה! 📊');
    });
}

// פונקציה ליבוא מקבצי Excel/CSV
function importFromFile(file) {
    return AdminGuard.requireAdmin(() => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                let data;
                if (file.name.endsWith('.csv')) {
                    const csv = e.target.result;
                    const lines = csv.split('\n').filter(line => line.trim() !== '');
                    const headers = lines[0].split(',').map(h => h.trim());
                    data = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const obj = {};
                        headers.forEach((h, i) => obj[h] = values[i]?.trim() || '');
                        return obj;
                    });
                } else {
                    const workbook = XLSX.read(e.target.result, {type: 'binary'});
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    data = XLSX.utils.sheet_to_json(worksheet);
                }
                
                processImportedData(data);
                
            } catch (error) {
                console.error('❌ שגיאה ביבוא קובץ:', error);
                ToastManager.show('שגיאה בקריאת הקובץ', 'error');
            }
        };
        
        if (file.name.endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsBinaryString(file);
        }
    });
}

async function processImportedData(data) {
    console.log(`📥 מעבד ${data.length} רשומות מקובץ יבוא...`);
    let successCount = 0;
    
    for (const item of data) {
        try {
            const { lat, lon } = await geocodeCity(item.עיר); // Assuming 'עיר' is the city column
            
            // Reconstruct name from first and last if available, else use 'שם'
            const name = (item['שם פרטי'] && item['שם משפחה']) 
                         ? `${item['שם פרטי']} ${item['שם משפחה']}`.trim() 
                         : item['שם']?.trim();

            if (!name || !item.עיר || !item['מספר טלפון']) {
                console.warn(`Skipping incomplete imported participant: ${JSON.stringify(item)}`);
                continue;
            }

            participants.push({
                name: name,
                firstName: item['שם פרטי'] || '',
                lastName: item['שם משפחה'] || '',
                city: item.עיר,
                lat: lat,
                lon: lon,
                phone: item['מספר טלפון'],
                whatsapp: item['מספר וואצפ'] || item['מספר ווצאפ'] || item['מספר WhatsApp'] || ''
            });
            successCount++;
            await new Promise(resolve => setTimeout(resolve, 200)); // למנוע spam ל-API
        } catch (error) {
            console.warn(`⚠️ לא ניתן למצוא מיקום עבור ${item.עיר || item.City}:`, error);
        }
    }
    
    StorageManager.save();
    renderMarkers();
    updateParticipantCount();
    ToastManager.show(`יובאו בהצלחה ${successCount} משתתפים!`);
}

// ניהול מצב אדמין
function setAdminMode(isAdminMode) {
    admin = isAdminMode;
    const loginBtn = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    
    if (isAdminMode) {
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'flex';
        addBtn.style.display = 'block';
        adminControls.style.display = 'flex';
        ToastManager.show('התחברת כמנהל בהצלחה! 🔐');
    } else {
        loginBtn.style.display = 'flex';
        logoutBtn.style.display = 'none';
        addBtn.style.display = 'none';
        adminControls.style.display = 'none';
        ToastManager.show('התנתקת בהצלחה! 👋');
    }
    
    renderMarkers();
}