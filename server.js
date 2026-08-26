/**
 * ============================================================================
 * Project: ATM & Bank Management System Backend (Node.js + MongoDB)
 * Database: MongoDB (mongodb://localhost:27017/atm_bank_db)
 * ============================================================================
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/atm_bank_db';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============================================================================
// MONGOOSE SCHEMAS & MODELS
// ============================================================================
const AccountSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    address: { type: String, required: true },
    pin: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    balance: { type: Number, required: true, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const TransactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    type: { type: String, required: true }, // DEPOSIT, WITHDRAWAL, TRANSFER, BILL_PAYMENT
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    details: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now }
});

const BillSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    billName: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: String, default: () => new Date().toLocaleString('en-IN') },
    timestamp: { type: Date, default: Date.now }
});

const Account = mongoose.model('Account', AccountSchema);
const Transaction = mongoose.model('Transaction', TransactionSchema);
const Bill = mongoose.model('Bill', BillSchema);

// ============================================================================
// FILE SYNCHRONIZATION HELPERS (SYNC WITH bank.txt FOR C++ APP)
// ============================================================================
async function syncBankTxt() {
    try {
        const accounts = await Account.find().sort({ id: 1 });
        let fileContent = '';
        accounts.forEach(acc => {
            fileContent += `${acc.id} ${acc.name} ${acc.fatherName} ${acc.address} ${acc.pin} ${acc.password} ${acc.phone} ${acc.balance.toFixed(2)}\n`;
        });
        fs.writeFileSync(path.join(__dirname, 'bank.txt'), fileContent, 'utf8');
        console.log('✅ bank.txt synchronized with MongoDB');
    } catch (err) {
        console.error('❌ Failed to sync bank.txt:', err.message);
    }
}

async function seedDatabaseFromBankTxt() {
    try {
        const count = await Account.countDocuments();
        if (count === 0 && fs.existsSync(path.join(__dirname, 'bank.txt'))) {
            const content = fs.readFileSync(path.join(__dirname, 'bank.txt'), 'utf8');
            const lines = content.split('\n').filter(l => l.trim().length > 0);
            
            for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 8) {
                    const [id, name, fatherName, address, pin, password, phone, balanceStr] = parts;
                    const balance = parseFloat(balanceStr) || 0;
                    
                    await Account.create({
                        id, name, fatherName, address, pin, password, phone, balance
                    }).catch(() => {}); // Ignore duplicates
                }
            }
            console.log('🌱 Seeded MongoDB from bank.txt');
        }
    } catch (err) {
        console.error('❌ Seeding error:', err.message);
    }
}

// ============================================================================
// REST API ENDPOINTS
// ============================================================================

// Check Server & MongoDB Status
app.get('/api/status', async (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: isDbConnected ? 'online' : 'offline',
        database: MONGO_URI,
        connected: isDbConnected
    });
});

// Admin Authentication
app.post('/api/login/admin', (req, res) => {
    const { email, pin, password } = req.body;
    if (email === 'cses@gmail.com' && pin === '12345' && password === '12345') {
        res.json({ success: true, message: 'Admin authenticated successfully', role: 'admin' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Admin Email, PIN, or Password' });
    }
});

// ATM / User Authentication
app.post('/api/login/user', async (req, res) => {
    try {
        const { userId, pin } = req.body;
        const account = await Account.findOne({ id: userId });
        if (!account) {
            return res.status(404).json({ success: false, message: 'User Account not found!' });
        }
        if (account.pin !== pin) {
            return res.status(401).json({ success: false, message: 'Incorrect 5-digit PIN Code!' });
        }
        res.json({ success: true, message: 'PIN Verified!', account });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get All User Accounts (MongoDB)
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await Account.find().sort({ createdAt: -1 });
        res.json({ success: true, count: accounts.length, accounts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get Single Account Details
app.get('/api/account/:id', async (req, res) => {
    try {
        const account = await Account.findOne({ id: req.params.id });
        if (!account) {
            return res.status(404).json({ success: false, message: 'Account not found' });
        }
        res.json({ success: true, account });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Register New Account (MongoDB)
app.post('/api/register', async (req, res) => {
    try {
        let { id, name, fatherName, address, pin, password, phone, balance } = req.body;
        
        if (!id || !name || !pin || !password) {
            return res.status(400).json({ success: false, message: 'Missing required account fields!' });
        }

        id = id.trim().toLowerCase();

        // Enforce Lowercase Alphanumeric format (only small characters and numbers)
        const userIdRegex = /^[a-z0-9]+$/;
        if (!userIdRegex.test(id)) {
            return res.status(400).json({ success: false, message: 'User ID must contain ONLY lowercase letters and numbers (e.g. rahul101) with no spaces or special characters!' });
        }

        const existing = await Account.findOne({ id });
        if (existing) {
            return res.status(400).json({ success: false, message: `User ID '${id}' is already registered!` });
        }

        const newAccount = await Account.create({
            id,
            name,
            fatherName: fatherName || 'N/A',
            address: address || 'N/A',
            pin,
            password,
            phone: phone || '0000000000',
            balance: parseFloat(balance) || 0
        });

        await syncBankTxt();
        res.status(201).json({ success: true, message: 'New Account registered and saved into MongoDB successfully!', account: newAccount });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Update Account Details
app.put('/api/account/:id', async (req, res) => {
    try {
        const { name, fatherName, address, pin, password, phone } = req.body;
        const account = await Account.findOneAndUpdate(
            { id: req.params.id },
            { name, fatherName, address, pin, password, phone },
            { new: true }
        );
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

        await syncBankTxt();
        res.json({ success: true, message: 'Account updated in MongoDB!', account });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Delete Account
app.delete('/api/account/:id', async (req, res) => {
    try {
        const account = await Account.findOneAndDelete({ id: req.params.id });
        if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

        await syncBankTxt();
        res.json({ success: true, message: 'Account deleted from MongoDB!' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Deposit Money
app.post('/api/deposit', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const depAmount = parseFloat(amount);
        if (isNaN(depAmount) || depAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid deposit amount!' });
        }

        const account = await Account.findOne({ id: userId });
        if (!account) return res.status(404).json({ success: false, message: 'Account not found!' });

        account.balance += depAmount;
        await account.save();

        await Transaction.create({
            userId,
            type: 'DEPOSIT',
            amount: depAmount,
            balanceAfter: account.balance,
            details: `Deposited ₹${depAmount}`
        });

        await syncBankTxt();
        res.json({ success: true, message: `Successfully deposited ₹${depAmount}`, balance: account.balance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Withdraw Money (ATM / Bank)
app.post('/api/withdraw', async (req, res) => {
    try {
        const { userId, amount } = req.body;
        const withAmount = parseFloat(amount);
        if (isNaN(withAmount) || withAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid withdrawal amount!' });
        }

        const account = await Account.findOne({ id: userId });
        if (!account) return res.status(404).json({ success: false, message: 'Account not found!' });

        if (account.balance < withAmount) {
            return res.status(400).json({ success: false, message: 'Transaction Failed! Insufficient balance.' });
        }

        account.balance -= withAmount;
        await account.save();

        await Transaction.create({
            userId,
            type: 'WITHDRAWAL',
            amount: withAmount,
            balanceAfter: account.balance,
            details: `Withdrew ₹${withAmount}`
        });

        await syncBankTxt();
        res.json({ success: true, message: `Successfully withdrew ₹${withAmount}`, balance: account.balance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// P2P Fund Transfer
app.post('/api/transfer', async (req, res) => {
    try {
        const { senderId, receiverId, amount } = req.body;
        const trAmount = parseFloat(amount);

        if (senderId === receiverId) {
            return res.status(400).json({ success: false, message: 'Sender and Receiver IDs cannot be identical!' });
        }
        if (isNaN(trAmount) || trAmount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid transfer amount!' });
        }

        const sender = await Account.findOne({ id: senderId });
        const receiver = await Account.findOne({ id: receiverId });

        if (!sender) return res.status(404).json({ success: false, message: 'Sender Account not found!' });
        if (!receiver) return res.status(404).json({ success: false, message: 'Receiver Account not found!' });

        if (sender.balance < trAmount) {
            return res.status(400).json({ success: false, message: 'Insufficient balance in Sender account!' });
        }

        sender.balance -= trAmount;
        receiver.balance += trAmount;

        await sender.save();
        await receiver.save();

        await Transaction.create({
            userId: senderId,
            type: 'TRANSFER',
            amount: trAmount,
            balanceAfter: sender.balance,
            details: `Transferred ₹${trAmount} to ${receiverId}`
        });

        await syncBankTxt();
        res.json({ success: true, message: `Transferred ₹${trAmount} successfully to ${receiver.name} (${receiverId})!`, senderBalance: sender.balance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Utility Bill Payment
app.post('/api/bill', async (req, res) => {
    try {
        const { userId, billName, amount } = req.body;
        const billAmt = parseFloat(amount);

        if (isNaN(billAmt) || billAmt <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid bill amount!' });
        }

        const account = await Account.findOne({ id: userId });
        if (!account) return res.status(404).json({ success: false, message: 'Account not found!' });

        if (account.balance < billAmt) {
            return res.status(400).json({ success: false, message: 'Insufficient balance to pay bill!' });
        }

        account.balance -= billAmt;
        await account.save();

        const billRecord = await Bill.create({
            userId,
            billName,
            amount: billAmt
        });

        await Transaction.create({
            userId,
            type: 'BILL_PAYMENT',
            amount: billAmt,
            balanceAfter: account.balance,
            details: `Paid ${billName} bill of ₹${billAmt}`
        });

        // Also append to bill.txt
        const billTxtLine = `${userId} ${billName} ${billAmt} ${billRecord.date}\n`;
        fs.appendFileSync(path.join(__dirname, 'bill.txt'), billTxtLine, 'utf8');

        await syncBankTxt();
        res.json({ success: true, message: `${billName} Bill of ₹${billAmt} paid successfully!`, balance: account.balance });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Get All Bill Payments Log
app.get('/api/bills', async (req, res) => {
    try {
        const bills = await Bill.find().sort({ timestamp: -1 });
        res.json({ success: true, count: bills.length, bills });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Fallback Route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ============================================================================
// SERVER INITIALIZATION & MONGOOSE CONNECT
// ============================================================================
mongoose.connect(MONGO_URI)
    .then(async () => {
        console.log(`\n🍃 Connected to MongoDB database at: ${MONGO_URI}`);
        await seedDatabaseFromBankTxt();
        app.listen(PORT, () => {
            console.log(`🚀 ATM & Bank REST API Server running on: http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error(`❌ MongoDB Connection Error:`, err.message);
    });
