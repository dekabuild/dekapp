// --- KONFIGURASI API & DOMAIN ---
const API_URL = "https://temp-mail-api-ejv.cintyajin.workers.dev/emails";

// Daftar domain yang didukung
const AVAILABLE_DOMAINS = ["@dekapp.web.id", "@dekastore.net"];

let currentEmail = localStorage.getItem("my_temp_email");

// Fungsi membuat email acak baru berdasarkan domain yang dipilih
function generateNewEmail() {
    const selectedDomain = document.getElementById("domain-select").value;
    const randomString = Math.random().toString(36).substring(2, 10);
    
    currentEmail = randomString + selectedDomain;
    localStorage.setItem("my_temp_email", currentEmail);
    
    document.getElementById("email-address").innerText = currentEmail;
    
    // Tampilkan status loading di inbox saat ganti email
    document.getElementById("inbox-list").innerHTML = `<div style="text-align: center; color: #6b7280;">Menunggu email masuk ke ${currentEmail}...</div>`;
    fetchInbox();
}

// Cek email saat halaman pertama kali dimuat
if (!currentEmail) {
    generateNewEmail();
} else {
    // Cek apakah email yang tersimpan menggunakan domain yang valid
    const isValidDomain = AVAILABLE_DOMAINS.some(domain => currentEmail.endsWith(domain));
    
    if (!isValidDomain) {
        generateNewEmail();
    } else {
        document.getElementById("email-address").innerText = currentEmail;
        
        // Sesuaikan pilihan dropdown dengan domain email yang sedang aktif
        const currentDomain = AVAILABLE_DOMAINS.find(domain => currentEmail.endsWith(domain));
        if (currentDomain) {
            document.getElementById("domain-select").value = currentDomain;
        }
    }
}

// Fungsi menyalin email
function copyEmail() {
    navigator.clipboard.writeText(currentEmail);
    alert("Email disalin: " + currentEmail);
}

// Fungsi mengambil daftar email
async function fetchInbox() {
    try {
        const response = await fetch(`${API_URL}?address=${currentEmail}`);
        const emails = await response.json();
        
        const inboxList = document.getElementById("inbox-list");
        
        if (emails.length === 0) {
            inboxList.innerHTML = `<div style="text-align: center; color: #6b7280;">Kotak masuk kosong. Menunggu email...</div>`;
            return;
        }

        inboxList.innerHTML = ""; // Bersihkan list
        emails.forEach(email => {
            inboxList.innerHTML += `
                <div class="email-item">
                    <div class="email-header">Dari: ${email.senderAddress}</div>
                    <div class="email-subject">${email.subject}</div>
                    <button class="btn-read" onclick="readEmail('${email.id}')">📖 Baca</button>
                    <button class="btn-delete" onclick="deleteEmail('${email.id}')">🗑 Hapus</button>
                </div>
            `;
        });
    } catch (error) {
        console.error("Gagal mengambil email:", error);
    }
}

// Fungsi membaca isi email
async function readEmail(emailId) {
    try {
        const response = await fetch(`${API_URL}/${emailId}`);
        const data = await response.json();
        
        document.getElementById("inbox-list").style.display = "none";
        document.getElementById("email-content").style.display = "block";
        
        const content = data.html ? data.html : `<pre style="white-space: pre-wrap;">${data.text}</pre>`;
        document.getElementById("email-body").innerHTML = `
            <h3>${data.subject}</h3>
            <hr>
            ${content}
        `;
    } catch (error) {
        alert("Gagal memuat isi email!");
    }
}

// Fungsi kembali ke inbox
function closeEmail() {
    document.getElementById("inbox-list").style.display = "block";
    document.getElementById("email-content").style.display = "none";
}

// Fungsi menghapus email
async function deleteEmail(emailId) {
    if (!confirm("Yakin ingin menghapus email ini?")) return;
    
    try {
        await fetch(`${API_URL}/${emailId}?address=${currentEmail}`, { method: "DELETE" });
        fetchInbox(); 
    } catch (error) {
        alert("Gagal menghapus email!");
    }
}

// Cek email baru setiap 5 detik
setInterval(fetchInbox, 5000);
fetchInbox();
