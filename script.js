// --- KONFIGURASI API ---
// TODO: Ganti URL ini dengan endpoint Cloudflare Worker kamu yang sesungguhnya
const API_URL = "https://api.domain-worker-kamu.workers.dev/emails"; 

// --- FUNGSI UTAMA ---

function copyEmail() {
    const emailInput = document.getElementById("temp-email");
    emailInput.select();
    emailInput.setSelectionRange(0, 99999); 
    
    navigator.clipboard.writeText(emailInput.value).then(() => {
        showToast("Alamat email berhasil disalin!");
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
    });
}

async function refreshInbox(isAuto = false) {
    const btn = document.getElementById("refresh-btn");
    const btnText = btn.querySelector(".btn-text");
    const emailAddress = document.getElementById("temp-email").value;

    if (btn.classList.contains("is-loading")) return;

    if (!isAuto) {
        btn.classList.add("is-loading");
        btnText.textContent = "Memuat...";
        countdown = 10; 
        updateCountdownUI();
    }

    try {
        const response = await fetch(`${API_URL}?address=${encodeURIComponent(emailAddress)}`);
        
        // PENTING: Hapus comment baris ini jika Worker sudah siap
        // if (!response.ok) throw new Error("Gagal mengambil data");
        // const emails = await response.json(); 
        
        // Dummy data untuk uji coba tampilan jika Worker belum disambungkan
        const emails = []; 
        
        renderEmails(emails);
        
        if (!isAuto) {
            showToast("Kotak masuk diperbarui!");
        }

    } catch (error) {
        console.error("Error fetching emails:", error);
        if (!isAuto) showToast("Gagal memuat kotak masuk.");
    } finally {
        if (!isAuto) {
            btn.classList.remove("is-loading");
            btnText.textContent = "Refresh";
        }
    }
}

function renderEmails(emails) {
    const inboxList = document.querySelector(".inbox-list");
    
    if (!emails || emails.length === 0) {
        inboxList.innerHTML = `<div class="empty-state"><p>Menunggu email masuk...</p></div>`;
        return;
    }

    inboxList.innerHTML = "";

    emails.forEach(email => {
        const emailDiv = document.createElement("div");
        emailDiv.className = "email-item";
        const timeString = email.timestamp ? new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "Baru saja";

        emailDiv.innerHTML = `
            <div class="email-info">
                <span class="sender">${escapeHTML(email.sender || 'Tanpa Pengirim')}</span>
                <span class="subject">${escapeHTML(email.subject || 'Tanpa Subjek')}</span>
            </div>
            <span class="time">${timeString}</span>
        `;
        
        emailDiv.onclick = () => openModal(email, timeString);
        inboxList.appendChild(emailDiv);
    });
}

// --- FUNGSI MODAL ---

async function openModal(emailData, timeString) {
    const modal = document.getElementById("email-modal");
    const loading = document.getElementById("modal-loading");
    const contentHtml = document.getElementById("modal-content-html");
    
    document.getElementById("modal-subject").textContent = emailData.subject || "Tanpa Subjek";
    document.getElementById("modal-sender").textContent = emailData.sender || "Tanpa Pengirim";
    document.getElementById("modal-time").textContent = timeString;

    contentHtml.innerHTML = "";
    loading.style.display = "block";
    modal.classList.add("show");

    try {
        // Panggil endpoint khusus untuk mendapatkan body email
        const response = await fetch(`${API_URL}/${emailData.id}`);
        if (!response.ok) throw new Error("Gagal mengambil isi email");
        
        const emailBody = await response.json(); 
        
        loading.style.display = "none";
        contentHtml.innerHTML = emailBody.html || emailBody.text || "<em>Pesan kosong.</em>";

    } catch (error) {
        console.error("Error fetching email body:", error);
        loading.style.display = "none";
        contentHtml.innerHTML = "<p style='color: #ef4444;'>Gagal memuat isi pesan. Silakan coba lagi.</p>";
    }
}

function closeModal() {
    const modal = document.getElementById("email-modal");
    modal.classList.remove("show");
}

window.onclick = function(event) {
    const modal = document.getElementById("email-modal");
    if (event.target == modal) {
        closeModal();
    }
}

// --- LOGIKA AUTO REFRESH (TIMER) ---

let countdown = 10; 
let countdownInterval;

function updateCountdownUI() {
    document.getElementById("countdown-text").textContent = `Update dalam ${countdown}s`;
}

function startAutoRefresh() {
    clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        countdown--; 
        
        if (countdown <= 0) {
            refreshInbox(true);
            countdown = 10;
        }
        
        updateCountdownUI();
    }, 1000); 
}

// --- FUNGSI UTILITAS ---

function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag])
    );
}

// --- INISIALISASI SAAT HALAMAN DIMUAT ---

window.onload = () => {
    refreshInbox(true);
    startAutoRefresh();
};