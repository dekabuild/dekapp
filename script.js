// ==========================================
// 1. KONFIGURASI & VARIABEL GLOBAL
// ==========================================
const API_URL = "https://temp-mail-api-ejv.cintyajin.workers.dev/emails";
const DOMAINS = ["@dekapp.web.id", "@dekastore.net"];

const elEmail = document.getElementById("temp-email");
const elDomain = document.getElementById("domain-select");
const elInbox = document.getElementById("inbox-list");
const elCountdown = document.getElementById("countdown-text");
const elModal = document.getElementById("email-modal");
const elToast = document.getElementById("toast");

let currentEmail = localStorage.getItem("temp_email") || "";
let countdown = 10;

// ==========================================
// 2. INISIALISASI (Saat web dibuka)
// ==========================================
window.onload = () => {
    if (!currentEmail || !DOMAINS.some(d => currentEmail.endsWith(d))) {
        generateNewEmail();
    } else {
        elEmail.value = currentEmail;
        elDomain.value = DOMAINS.find(d => currentEmail.endsWith(d));
        fetchInbox();
    }
    setInterval(updateTimer, 1000);

    // EVENT LISTENER: Deteksi ketikan user di kotak input (Tekan Enter / Pindah kursor)
    elEmail.addEventListener('change', applyCustomEmail);
};

// ==========================================
// 3. FUNGSI UTAMA (Custom Email & Generate)
// ==========================================

// Fitur Baru: Akses kembali atau buat email sesuka hati
function applyCustomEmail() {
    let inputVal = elEmail.value.trim().toLowerCase();
    
    // Jika dikosongkan, kembalikan ke email sebelumnya
    if (inputVal === "") {
        elEmail.value = currentEmail;
        return;
    }

    // Jika user hanya mengetik "nama" (tanpa @domain), otomatis tambahkan domain
    if (!inputVal.includes("@")) {
        inputVal += elDomain.value;
    }

    // Validasi apakah domainnya sesuai dengan yang kita dukung
    const isValidDomain = DOMAINS.some(d => inputVal.endsWith(d));
    if (!isValidDomain) {
        showToast("Gagal! Gunakan domain: " + DOMAINS.join(" atau "));
        elEmail.value = currentEmail;
        return;
    }

    // Terapkan email baru
    currentEmail = inputVal;
    localStorage.setItem("temp_email", currentEmail);
    elEmail.value = currentEmail;
    
    // Sesuaikan posisi dropdown
    elDomain.value = DOMAINS.find(d => currentEmail.endsWith(d));
    
    showToast("Mengakses: " + currentEmail);
    elInbox.innerHTML = `<div class="empty-state"><p>Mencari pesan untuk<br><b>${currentEmail}</b>...</p></div>`;
    refreshInbox();
}

function generateNewEmail() {
    currentEmail = Math.random().toString(36).substring(2, 10) + elDomain.value;
    localStorage.setItem("temp_email", currentEmail);
    elEmail.value = currentEmail;
    
    elInbox.innerHTML = `<div class="empty-state"><p>Menyiapkan alamat baru...</p></div>`;
    refreshInbox();
}

// Hapus fungsi generateNewEmail() pada onchange HTML (Dropdown)
// Kita pindahkan event listenernya ke sini agar lebih bersih
elDomain.addEventListener('change', generateNewEmail);

function copyEmail() {
    elEmail.select();
    navigator.clipboard.writeText(currentEmail);
    showToast("Email berhasil disalin!");
}

function showToast(msg) {
    elToast.innerText = msg;
    elToast.style.display = "block";
    setTimeout(() => elToast.style.display = "none", 3000);
}

function updateTimer() {
    countdown--;
    elCountdown.innerText = `Update dalam ${countdown}s`;
    if (countdown <= 0) refreshInbox();
}

function refreshInbox() {
    countdown = 10; 
    fetchInbox();
}

// ==========================================
// 4. KOMUNIKASI API
// ==========================================
async function fetchInbox() {
    try {
        const res = await fetch(`${API_URL}?address=${currentEmail}`);
        const emails = await res.json();
        
        if (emails.length === 0) {
            elInbox.innerHTML = `
                <div class="empty-state">
                    <p>Menunggu email masuk ke<br><b>${currentEmail}</b></p>
                </div>`;
            return;
        }

        elInbox.innerHTML = emails.map(email => `
            <div class="email-item" onclick="readEmail('${email.id}')" style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 4px solid #2563eb; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: #6b7280; margin-bottom: 5px;">
                    <strong>${email.senderAddress}</strong>
                    <span>${new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
                <div style="font-weight: 500; color: #111827;">${email.subject}</div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Gagal memuat inbox", err);
    }
}

async function readEmail(id) {
    elModal.style.display = "block";
    document.getElementById("modal-loading").style.display = "block";
    document.getElementById("modal-content-html").style.display = "none";
    document.getElementById("modal-subject").innerText = "Memuat...";

    try {
        const res = await fetch(`${API_URL}/${id}`);
        const data = await res.json();
        
        document.getElementById("modal-subject").innerText = data.subject || "(Tanpa Subjek)";
        document.getElementById("modal-sender").innerText = `Dari: ${data.senderAddress}`;
        document.getElementById("modal-time").innerText = new Date(data.timestamp).toLocaleString();
        
        const contentDiv = document.getElementById("modal-content-html");
        contentDiv.innerHTML = data.html || `<pre style="white-space: pre-wrap; font-family: inherit;">${data.text}</pre>`;
        
        document.getElementById("modal-loading").style.display = "none";
        contentDiv.style.display = "block";
    } catch (err) {
        document.getElementById("modal-subject").innerText = "Gagal memuat pesan";
        document.getElementById("modal-loading").style.display = "none";
    }
}

function closeModal() {
    elModal.style.display = "none";
}
