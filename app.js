/**
 * ============================================================================
 * Project: APEX BANKING & ATM FRONTEND CLIENT
 * REST API Client for Node.js + Express + MongoDB Server (localhost:8080)
 * ============================================================================
 */

// Dynamic API_BASE_URL: automatically detects whether running locally or on a deployed host (Render, Vercel, etc.)
const API_BASE_URL = (window.location.protocol === 'file:' || window.location.port === '5500' || window.location.port === '3000')
    ? 'http://localhost:8080/api'
    : `${window.location.origin}/api`;

let currentAccounts = [];
let isAdminLoggedIn = false;
let currentAtmUser = null;
let pinBuffer = '';
let pinAttempts = 3;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkDBConnection();
    startAtmClock();
});

// ============================================================================
// SYSTEM & DB STATUS CHECK
// ============================================================================
async function checkDBConnection() {
    const statusText = document.getElementById('dbStatusText');
    const dbBadge = document.getElementById('dbStatus');
    const regBadge = document.getElementById('regDbBadge');

    try {
        const res = await fetch(`${API_BASE_URL}/status`);
        const data = await res.json();

        if (data.connected) {
            statusText.innerText = 'MongoDB Connected (Online)';
            if (dbBadge) dbBadge.style.borderColor = 'rgba(16, 185, 129, 0.4)';
            if (regBadge) regBadge.innerHTML = '<i class="fa-solid fa-leaf"></i> Connected to MongoDB';
        } else {
            statusText.innerText = 'Server Online (MongoDB Offline)';
            if (dbBadge) dbBadge.style.borderColor = 'rgba(234, 179, 8, 0.4)';
            if (regBadge) regBadge.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> MongoDB Connecting...';
        }
    } catch (err) {
        statusText.innerText = 'Server Offline';
        if (dbBadge) dbBadge.style.borderColor = 'rgba(244, 63, 94, 0.4)';
        if (regBadge) regBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Server Offline';
    }
}

// Tab Switching Handler
function switchTab(tabName) {
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-section').forEach(sec => sec.classList.remove('active'));

    if (tabName === 'register') {
        document.getElementById('tabRegister').classList.add('active');
        document.getElementById('sectionRegister').classList.add('active');
    } else if (tabName === 'admin') {
        document.getElementById('tabAdmin').classList.add('active');
        document.getElementById('sectionAdmin').classList.add('active');
        if (isAdminLoggedIn) {
            loadAdminDashboard();
        }
    } else if (tabName === 'atm') {
        document.getElementById('tabAtm').classList.add('active');
        document.getElementById('sectionAtm').classList.add('active');
    }
}

// ============================================================================
// PUBLIC USER REGISTRATION (SAVES DIRECTLY TO MONGODB)
// ============================================================================
async function handlePublicRegister(e) {
    e.preventDefault();

    const rawId = document.getElementById('regId').value.trim().toLowerCase();
    const userIdRegex = /^[a-z0-9]+$/;

    if (!userIdRegex.test(rawId)) {
        showToast('❌ User ID must ONLY contain lowercase letters and numbers (e.g. rahul101), no spaces or special characters!', 'error');
        return;
    }

    const accountData = {
        id: rawId,
        name: document.getElementById('regName').value.trim(),
        fatherName: document.getElementById('regFName').value.trim(),
        address: document.getElementById('regAddress').value.trim(),
        pin: document.getElementById('regPin').value.trim(),
        password: document.getElementById('regPass').value.trim(),
        phone: document.getElementById('regPhone').value.trim(),
        balance: parseFloat(document.getElementById('regBalance').value) || 0
    };

    try {
        const res = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData)
        });

        const data = await res.json();

        if (data.success) {
            showToast(`✅ Account for '${accountData.name}' saved to MongoDB!`, 'success');
            document.getElementById('publicRegisterForm').reset();
        } else {
            showToast(`❌ Registration Failed: ${data.message}`, 'error');
        }
    } catch (err) {
        showToast('❌ Server error. Ensure backend is running!', 'error');
    }
}

// ============================================================================
// ADMIN PANEL MODULE
// ============================================================================
async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const pin = document.getElementById('adminPin').value.trim();
    const pass = document.getElementById('adminPass').value.trim();

    try {
        const res = await fetch(`${API_BASE_URL}/login/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, pin, password: pass })
        });
        const data = await res.json();

        if (data.success) {
            isAdminLoggedIn = true;
            document.getElementById('adminAuthOverlay').style.display = 'none';
            showToast('✅ Admin Login Successful!', 'success');
            loadAdminDashboard();
        } else {
            showToast(`❌ ${data.message || 'Invalid Admin Credentials!'}`, 'error');
        }
    } catch (err) {
        showToast('❌ Server error during admin login!', 'error');
    }
}

function loadAdminDashboard() {
    loadAccountsFromDB();
    loadBillHistoryFromDB();
}

async function loadAccountsFromDB() {
    try {
        const res = await fetch(`${API_BASE_URL}/accounts`);
        const data = await res.json();

        if (data.success) {
            currentAccounts = data.accounts;
            renderAccountsTable(currentAccounts);
            updateAdminStats(currentAccounts);
        }
    } catch (err) {
        showToast('Failed to fetch accounts from MongoDB', 'error');
    }
}

function renderAccountsTable(accounts) {
    const tbody = document.getElementById('accountsTableBody');
    if (!accounts || accounts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">No account records found in MongoDB.</td></tr>`;
        return;
    }

    tbody.innerHTML = accounts.map(acc => `
        <tr>
            <td><strong>${acc.id}</strong></td>
            <td>${acc.name}</td>
            <td>${acc.fatherName}</td>
            <td>${acc.phone}</td>
            <td>${acc.address}</td>
            <td><code>${acc.pin}</code></td>
            <td><strong>₹${acc.balance.toFixed(2)}</strong></td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="deleteAccountFromDB('${acc.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function updateAdminStats(accounts) {
    document.getElementById('statTotalUsers').innerText = accounts.length;
    const totalBal = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
    document.getElementById('statTotalBalance').innerText = `₹${totalBal.toFixed(2)}`;
}

function filterAccounts() {
    const query = document.getElementById('searchAccount').value.toLowerCase();
    const filtered = currentAccounts.filter(a => 
        a.id.toLowerCase().includes(query) || a.name.toLowerCase().includes(query)
    );
    renderAccountsTable(filtered);
}

async function deleteAccountFromDB(id) {
    if (!confirm(`Are you sure you want to delete Account '${id}' from MongoDB?`)) return;

    try {
        const res = await fetch(`${API_BASE_URL}/account/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
            showToast(`Deleted Account '${id}' from MongoDB!`, 'success');
            loadAccountsFromDB();
        }
    } catch (err) {
        showToast('Failed to delete account', 'error');
    }
}

// Financial Operations (Deposit, Withdraw, Transfer, Bill)
async function handleAdminDeposit(e) {
    e.preventDefault();
    const userId = document.getElementById('depId').value.trim();
    const amount = document.getElementById('depAmount').value;

    const res = await fetch(`${API_BASE_URL}/deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
    });
    const data = await res.json();
    if (data.success) {
        showToast(`✅ ${data.message}`, 'success');
        e.target.reset();
        loadAccountsFromDB();
    } else {
        showToast(`❌ ${data.message}`, 'error');
    }
}

async function handleAdminWithdraw(e) {
    e.preventDefault();
    const userId = document.getElementById('withAccId').value.trim();
    const amount = document.getElementById('withAccAmount').value;

    const res = await fetch(`${API_BASE_URL}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, amount })
    });
    const data = await res.json();
    if (data.success) {
        showToast(`✅ ${data.message}`, 'success');
        e.target.reset();
        loadAccountsFromDB();
    } else {
        showToast(`❌ ${data.message}`, 'error');
    }
}

async function handleAdminTransfer(e) {
    e.preventDefault();
    const senderId = document.getElementById('trSender').value.trim();
    const receiverId = document.getElementById('trReceiver').value.trim();
    const amount = document.getElementById('trAmount').value;

    const res = await fetch(`${API_BASE_URL}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId, receiverId, amount })
    });
    const data = await res.json();
    if (data.success) {
        showToast(`✅ ${data.message}`, 'success');
        e.target.reset();
        loadAccountsFromDB();
    } else {
        showToast(`❌ ${data.message}`, 'error');
    }
}

async function handleAdminPayBill(e) {
    e.preventDefault();
    const userId = document.getElementById('billUserId').value.trim();
    const billName = document.getElementById('billType').value;
    const amount = document.getElementById('billAmount').value;

    const res = await fetch(`${API_BASE_URL}/bill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, billName, amount })
    });
    const data = await res.json();
    if (data.success) {
        showToast(`✅ ${data.message}`, 'success');
        e.target.reset();
        loadAccountsFromDB();
        loadBillHistoryFromDB();
    } else {
        showToast(`❌ ${data.message}`, 'error');
    }
}

async function loadBillHistoryFromDB() {
    try {
        const res = await fetch(`${API_BASE_URL}/bills`);
        const data = await res.json();
        if (data.success) {
            document.getElementById('statTotalBills').innerText = data.count;
            const tbody = document.getElementById('billsTableBody');
            if (data.bills.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center">No bill payment transactions logged yet.</td></tr>`;
                return;
            }
            tbody.innerHTML = data.bills.map(b => `
                <tr>
                    <td><strong>${b.userId}</strong></td>
                    <td>${b.billName}</td>
                    <td>₹${b.amount.toFixed(2)}</td>
                    <td>${b.date}</td>
                </tr>
            `).join('');
        }
    } catch (err) {}
}

// ============================================================================
// ATM SIMULATOR MODULE
// ============================================================================
function startAtmClock() {
    setInterval(() => {
        const now = new Date();
        document.getElementById('atmClock').innerText = now.toLocaleTimeString('en-IN');
    }, 1000);
}

async function proceedToPinEntry() {
    const userId = document.getElementById('atmUserIdInput').value.trim();
    if (!userId) {
        showToast('Please enter User ID!', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/account/${userId}`);
        const data = await res.json();

        if (data.success) {
            currentAtmUser = data.account;
            document.getElementById('atmAccountName').innerText = currentAtmUser.name;
            pinBuffer = '';
            pinAttempts = 3;
            updatePinDisplay();

            switchAtmScreen('atmScreenPin');
        } else {
            showToast(`Account ID '${userId}' not found in MongoDB!`, 'error');
        }
    } catch (err) {
        showToast('Server error while checking Account ID', 'error');
    }
}

function keypadPress(val) {
    const activeState = document.querySelector('.atm-state.active').id;
    if (activeState === 'atmScreenPin') {
        if (pinBuffer.length < 5) {
            pinBuffer += val;
            updatePinDisplay();
        }
    }
}

function keypadClear() {
    pinBuffer = '';
    updatePinDisplay();
}

function keypadCancel() {
    atmExit();
}

async function keypadEnter() {
    const activeState = document.querySelector('.atm-state.active').id;
    if (activeState === 'atmScreenPin') {
        if (pinBuffer.length !== 5) {
            showToast('PIN must be 5 digits!', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/login/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentAtmUser.id, pin: pinBuffer })
            });

            const data = await res.json();

            if (data.success) {
                showToast(`PIN Verified! Welcome ${currentAtmUser.name}`, 'success');
                switchAtmScreen('atmScreenMenu');
            } else {
                pinAttempts--;
                document.getElementById('attemptsBadge').innerText = `Attempts Remaining: ${pinAttempts}`;
                keypadClear();

                if (pinAttempts <= 0) {
                    showToast('Card Blocked! Exceeded 3 invalid PIN attempts.', 'error');
                    atmExit();
                } else {
                    showToast(`Incorrect PIN! ${pinAttempts} attempts remaining.`, 'error');
                }
            }
        } catch (err) {
            showToast('Server authentication error', 'error');
        }
    }
}

function updatePinDisplay() {
    const masked = '*'.repeat(pinBuffer.length) || '_____';
    document.getElementById('pinDisplay').innerText = masked;
}

function switchAtmScreen(screenId) {
    document.querySelectorAll('.atm-state').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

async function refreshAtmUserBalance() {
    const res = await fetch(`${API_BASE_URL}/account/${currentAtmUser.id}`);
    const data = await res.json();
    if (data.success) {
        currentAtmUser = data.account;
    }
}

async function atmCheckBalance() {
    await refreshAtmUserBalance();
    document.getElementById('atmActionTitle').innerText = 'Balance Inquiry';
    document.getElementById('atmActionBody').innerHTML = `
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 20px;">
            <p>Account Holder: <strong>${currentAtmUser.name}</strong></p>
            <p>Account ID: <strong>${currentAtmUser.id}</strong></p>
            <h2 style="color: var(--emerald); margin-top: 10px;">Available Balance: ₹${currentAtmUser.balance.toFixed(2)}</h2>
        </div>
    `;
    switchAtmScreen('atmScreenAction');
}

function atmShowWithdrawForm() {
    document.getElementById('atmActionTitle').innerText = 'Cash Withdrawal';
    document.getElementById('atmActionBody').innerHTML = `
        <div style="max-width: 300px; margin: 0 auto;">
            <input type="number" id="atmWithdrawInput" placeholder="Enter Amount (₹)" style="width: 100%; padding: 12px; font-size: 1.1rem; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #fff; text-align: center;">
            <button class="btn btn-success btn-block mt-3" onclick="processAtmWithdrawal()"><i class="fa-solid fa-money-bill-wave"></i> Dispense Cash</button>
        </div>
    `;
    switchAtmScreen('atmScreenAction');
}

function atmShowQuickCash() {
    document.getElementById('atmActionTitle').innerText = 'Quick Cash Presets';
    document.getElementById('atmActionBody').innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 320px; margin: 0 auto;">
            <button class="btn btn-primary" onclick="processAtmQuickCash(500)">₹500</button>
            <button class="btn btn-primary" onclick="processAtmQuickCash(1000)">₹1,000</button>
            <button class="btn btn-primary" onclick="processAtmQuickCash(2000)">₹2,000</button>
            <button class="btn btn-primary" onclick="processAtmQuickCash(5000)">₹5,000</button>
        </div>
    `;
    switchAtmScreen('atmScreenAction');
}

async function processAtmWithdrawal() {
    const amount = document.getElementById('atmWithdrawInput').value;
    await executeAtmWithdraw(amount);
}

async function processAtmQuickCash(amount) {
    await executeAtmWithdraw(amount);
}

async function executeAtmWithdraw(amount) {
    try {
        const res = await fetch(`${API_BASE_URL}/withdraw`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentAtmUser.id, amount })
        });
        const data = await res.json();

        if (data.success) {
            triggerCashAnimation();
            renderAtmReceipt('WITHDRAWAL', amount, data.balance);
        } else {
            showToast(`❌ ${data.message}`, 'error');
        }
    } catch (err) {
        showToast('Withdrawal failed', 'error');
    }
}

function atmShowTransferForm() {
    document.getElementById('atmActionTitle').innerText = 'P2P Fund Transfer';
    document.getElementById('atmActionBody').innerHTML = `
        <div style="max-width: 320px; margin: 0 auto; display: flex; flex-direction: column; gap: 12px;">
            <input type="text" id="atmTrReceiver" placeholder="Beneficiary User ID" style="padding: 10px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 8px;">
            <input type="number" id="atmTrAmount" placeholder="Amount (₹)" style="padding: 10px; background: #0f172a; border: 1px solid #334155; color: #fff; border-radius: 8px;">
            <button class="btn btn-info btn-block" onclick="processAtmTransfer()"><i class="fa-solid fa-paper-plane"></i> Transfer Money</button>
        </div>
    `;
    switchAtmScreen('atmScreenAction');
}

async function processAtmTransfer() {
    const receiverId = document.getElementById('atmTrReceiver').value.trim();
    const amount = document.getElementById('atmTrAmount').value;

    try {
        const res = await fetch(`${API_BASE_URL}/transfer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senderId: currentAtmUser.id, receiverId, amount })
        });
        const data = await res.json();

        if (data.success) {
            renderAtmReceipt(`TRANSFER TO ${receiverId}`, amount, data.senderBalance);
        } else {
            showToast(`❌ ${data.message}`, 'error');
        }
    } catch (err) {
        showToast('Transfer failed', 'error');
    }
}

function atmShowAccountDetails() {
    document.getElementById('atmActionTitle').innerText = 'Account Details';
    document.getElementById('atmActionBody').innerHTML = `
        <div style="text-align: left; background: #0f172a; border: 1px solid #334155; padding: 20px; border-radius: 12px;">
            <p><strong>User ID:</strong> ${currentAtmUser.id}</p>
            <p><strong>Name:</strong> ${currentAtmUser.name}</p>
            <p><strong>Father Name:</strong> ${currentAtmUser.fatherName}</p>
            <p><strong>Phone:</strong> ${currentAtmUser.phone}</p>
            <p><strong>Address:</strong> ${currentAtmUser.address}</p>
            <p><strong>Balance:</strong> ₹${currentAtmUser.balance.toFixed(2)}</p>
        </div>
    `;
    switchAtmScreen('atmScreenAction');
}

function triggerCashAnimation() {
    const anim = document.getElementById('cashAnimation');
    anim.style.display = 'block';
    setTimeout(() => { anim.style.display = 'none'; }, 2000);
}

function renderAtmReceipt(type, amount, balance) {
    document.getElementById('atmActionTitle').innerText = 'Transaction Receipt';
    const now = new Date().toLocaleString('en-IN');
    document.getElementById('atmActionBody').innerHTML = `
        <div style="background: #fff; color: #000; font-family: monospace; padding: 20px; border-radius: 8px; text-align: left; max-width: 340px; margin: 0 auto; box-shadow: 0 10px 20px rgba(0,0,0,0.5);">
            <h4 style="text-align: center; margin-bottom: 8px;">=========================</h4>
            <h4 style="text-align: center;">APEX ATM RECEIPT</h4>
            <h4 style="text-align: center; margin-bottom: 12px;">=========================</h4>
            <p>Date/Time: ${now}</p>
            <p>User ID  : ${currentAtmUser.id}</p>
            <p>Type     : ${type}</p>
            <p>Amount   : ₹${parseFloat(amount).toFixed(2)}</p>
            <p>Balance  : ₹${parseFloat(balance).toFixed(2)}</p>
            <p>Status   : SUCCESSFUL</p>
            <h4 style="text-align: center; margin-top: 12px;">=========================</h4>
        </div>
    `;
    switchAtmScreen('atmScreenAction');
}

function atmReturnToMenu() {
    switchAtmScreen('atmScreenMenu');
}

function atmExit() {
    currentAtmUser = null;
    pinBuffer = '';
    document.getElementById('atmUserIdInput').value = '';
    switchAtmScreen('atmScreenWelcome');
    showToast('ATM Terminal Session Ended.', 'info');
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}
