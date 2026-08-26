# ATM & Bank Management System (Industry-Grade C++)

An advanced, Object-Oriented **ATM & Bank Management System** written in **Modern C++ (C++17)**. Designed with modular architecture, robust file persistence, input security, ANSI color terminal interface, utility bill payment engine, and digital receipt generation.

---

## 🌟 Key Features

### 1. 🏦 Bank Management (Admin Panel)
- **Secure Authentication**: Admin login with encrypted/masked PIN & Password entry (`cses@gmail.com` / `12345` / `12345`).
- **Account Management**: Add, search, edit, and delete user accounts.
- **Financial Operations**: Deposit, withdraw, and Peer-to-Peer (P2P) fund transfers between users.
- **Utility Bill Payments**: Process Electricity, Water, WiFi, and Gas bills with automated date/time logging.
- **Formatted Data Views**: ASCII tabular reporting for all user accounts and bill audit records.

### 2. 💳 ATM Terminal Simulator
- **Card Security & PIN Verification**: Maximum 3 failed attempts lockout mechanism.
- **Balance Inquiry**: Instant view of current balance and account holder details.
- **Cash Withdrawal**: Custom amount withdrawal with realistic cash note breakdown (₹500, ₹200, ₹100 notes).
- **Quick Cash**: 1-click withdrawal presets (₹500, ₹1,000, ₹2,000, ₹5,000).
- **Fund Transfer**: Transfer money directly from ATM terminal to another user account.
- **Digital Receipt Generator**: Automatically prints transaction summary and saves `.txt` receipt (`receipt_<userId>.txt`).

---

## 🏗️ Architecture & OOP Concepts Used

1. **Encapsulation**:
   - `Account` class hides sensitive data fields (`pin`, `password`, `balance`) behind private visibility with validated getters/setters and verification methods.
2. **Modular Responsibility (SOLID Principles)**:
   - **`Account`**: Data Model for User Profile and balance operations.
   - **`BankManager`**: Service layer managing persistence (`bank.txt`, `bill.txt`), account CRUD, and financial transactions.
   - **`AtmSimulator`**: Presentation & Workflow engine for ATM terminal hardware simulation.
   - **`ConsoleUI`**: Cross-platform terminal graphics, ANSI colors, headers, and masked password input.
   - **`AppController`**: Top-level Controller & State Machine orchestrating menu transitions without `goto`.
3. **Clean Code & Modern Practices**:
   - Replaced anti-patterns (no `goto` statements, no raw memory leaks, no recursive stack-overflow menu calls).
   - Replaced `<conio.h>` dependencies with portable masked password reading.
   - Used `std::vector`, `std::string`, `std::ostringstream`, `std::iomanip`, and C++17 standard algorithms.

---

## 💻 How to Compile & Run

### Prerequisites
- Any modern C++ compiler (`g++` / MinGW, Clang, or MSVC) supporting **C++17** or higher.

### Compilation Command (GCC / MinGW)
```bash
g++ -std=c++17 atmbank.cpp -o atmbank.exe
```

### Running the Executable
- **Windows (Command Prompt / PowerShell)**:
  ```powershell
  .\atmbank.exe
  ```
- **Linux / macOS**:
  ```bash
  ./atmbank
  ```

---

## 🔑 Default Credentials

- **Admin Login**:
  - **Email**: `cses@gmail.com`
  - **PIN Code**: `12345`
  - **Password**: `12345`
- **Sample User ID**: Check `bank.txt` or create a new user account via the Admin Panel.

---

## 📁 File Structure

```
ATM/
├── atmbank.cpp      # Main C++ source code (OOP Implementation)
├── atmbank.exe      # Compiled Binary Executable
├── bank.txt         # Account Database File
├── bill.txt         # Bill Payment Log File
├── receipt_*.txt    # Exported ATM Digital Receipts
└── README.md        # Project Documentation & Interview Guide
```

---
*Created for C++ Software Engineering Portfolio & Placement Presentations.*
