/**
 * ============================================================================
 * Project: Modern ATM & Bank Management System (Industry-Grade Edition)
 * Standard: C++17
 * Architecture: Object-Oriented Programming (OOP) & SOLID Principles
 * ============================================================================
 */

#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <iomanip>
#include <algorithm>
#include <ctime>
#include <sstream>
#include <memory>

#ifdef _WIN32
#include <windows.h>
#include <conio.h>
#include <io.h>
#else
#include <termios.h>
#include <unistd.h>
#endif

using namespace std;

// ============================================================================
// CONSOLE UI & UTILITIES (ANSI STYLING & MASKED INPUT)
// ============================================================================
class ConsoleUI {
public:
    // ANSI Color Codes
    static constexpr const char* RESET   = "\033[0m";
    static constexpr const char* BOLD    = "\033[1m";
    static constexpr const char* RED     = "\033[1;31m";
    static constexpr const char* GREEN   = "\033[1;32m";
    static constexpr const char* YELLOW  = "\033[1;33m";
    static constexpr const char* BLUE    = "\033[1;34m";
    static constexpr const char* MAGENTA = "\033[1;35m";
    static constexpr const char* CYAN    = "\033[1;36m";
    static constexpr const char* WHITE   = "\033[1;37m";

#ifndef ENABLE_VIRTUAL_TERMINAL_PROCESSING
#define ENABLE_VIRTUAL_TERMINAL_PROCESSING 0x0004
#endif

    static void enableANSI() {
#ifdef _WIN32
        HANDLE hOut = GetStdHandle(STD_OUTPUT_HANDLE);
        if (hOut != INVALID_HANDLE_VALUE) {
            DWORD dwMode = 0;
            if (GetConsoleMode(hOut, &dwMode)) {
                dwMode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
                SetConsoleMode(hOut, dwMode);
            }
        }
#endif
    }

    static void clearScreen() {
#ifdef _WIN32
        system("cls");
#else
        system("clear");
#endif
    }

    static void pause() {
        cout << "\n" << CYAN << "Press Enter to continue..." << RESET;
        cin.ignore(10000, '\n');
        cin.get();
    }

    static void printHeader(const string& title) {
        clearScreen();
        int width = 64;
        cout << CYAN << BOLD << "+" << string(width - 2, '-') << "+\n" << RESET;
        cout << CYAN << BOLD << "| " << setw((width + title.length()) / 2 - 2) << right << title 
             << setw((width - title.length()) / 2 - 1) << left << " " << " |\n" << RESET;
        cout << CYAN << BOLD << "+" << string(width - 2, '-') << "+\n\n" << RESET;
    }

    static void printBanner() {
        clearScreen();
        cout << CYAN << BOLD;
        cout << "================================================================\n";
        cout << "               BANK & ATM MANAGEMENT SYSTEM                    \n";
        cout << "                   Industry-Grade C++                          \n";
        cout << "================================================================\n" << RESET;
    }

    static void printSuccess(const string& msg) {
        cout << "\n" << GREEN << BOLD << "[SUCCESS] " << msg << RESET << "\n";
    }

    static void printError(const string& msg) {
        cout << "\n" << RED << BOLD << "[ERROR] " << msg << RESET << "\n";
    }

    static void printWarning(const string& msg) {
        cout << "\n" << YELLOW << BOLD << "[WARNING] " << msg << RESET << "\n";
    }

    static void printInfo(const string& msg) {
        cout << "\n" << BLUE << BOLD << "[INFO] " << msg << RESET << "\n";
    }

    static string getMaskedInput(const string& prompt) {
        cout << prompt;
        string input = "";
#ifdef _WIN32
        if (!isatty(0)) {
            if (cin >> input) {
                cout << "*****\n";
                return input;
            }
        }
        char ch;
        while ((ch = _getch()) != 13) { // 13 is Enter in ASCII
            if (ch == 8) { // Backspace
                if (!input.empty()) {
                    input.pop_back();
                    cout << "\b \b";
                }
            } else if (ch >= 32 && ch <= 126) {
                input += ch;
                cout << "*";
            }
        }
        cout << "\n";
#else
        termios oldt, newt;
        tcgetattr(STDIN_FILENO, &oldt);
        newt = oldt;
        newt.c_lflag &= ~(ECHO);
        tcsetattr(STDIN_FILENO, TCSANOW, &newt);
        cin >> input;
        tcsetattr(STDIN_FILENO, TCSANOW, &oldt);
        cout << "\n";
#endif
        return input;
    }

    static string getCurrentDateTime() {
        time_t now = time(0);
        tm* ltm = localtime(&now);
        ostringstream oss;
        oss << setfill('0') << setw(2) << ltm->tm_mday << "/"
            << setfill('0') << setw(2) << (1 + ltm->tm_mon) << "/"
            << (1900 + ltm->tm_year) << " "
            << setfill('0') << setw(2) << ltm->tm_hour << ":"
            << setfill('0') << setw(2) << ltm->tm_min << ":"
            << setfill('0') << setw(2) << ltm->tm_sec;
        return oss.str();
    }
};

// ============================================================================
// ACCOUNT MODEL CLASS (ENCAPSULATION)
// ============================================================================
class Account {
private:
    string id;
    string name;
    string fatherName;
    string address;
    string pin;
    string password;
    string phone;
    double balance;

public:
    Account() : balance(0.0) {}

    Account(string id, string name, string fatherName, string address,
            string pin, string password, string phone, double balance)
        : id(id), name(name), fatherName(fatherName), address(address),
          pin(pin), password(password), phone(phone), balance(balance) {}

    // Getters
    string getId() const { return id; }
    string getName() const { return name; }
    string getFatherName() const { return fatherName; }
    string getAddress() const { return address; }
    string getPin() const { return pin; }
    string getPassword() const { return password; }
    string getPhone() const { return phone; }
    double getBalance() const { return balance; }

    // Setters
    void setName(const string& n) { name = n; }
    void setFatherName(const string& fn) { fatherName = fn; }
    void setAddress(const string& addr) { address = addr; }
    void setPin(const string& p) { pin = p; }
    void setPassword(const string& pass) { password = pass; }
    void setPhone(const string& ph) { phone = ph; }
    void setBalance(double b) { balance = b; }

    // Business Methods
    bool deposit(double amount) {
        if (amount <= 0) return false;
        balance += amount;
        return true;
    }

    bool withdraw(double amount) {
        if (amount <= 0 || amount > balance) return false;
        balance -= amount;
        return true;
    }

    bool verifyPin(const string& inputPin) const {
        return pin == inputPin;
    }

    bool verifyPassword(const string& inputPass) const {
        return password == inputPass;
    }
};

// ============================================================================
// TRANSACTION RECORD CLASS
// ============================================================================
class TransactionRecord {
public:
    string userId;
    string type;
    double amount;
    string dateTime;
    string details;

    TransactionRecord(string uid, string t, double amt, string dt, string det = "")
        : userId(uid), type(t), amount(amt), dateTime(dt), details(det) {}
};

// ============================================================================
// BANK MANAGER CLASS (FILE PERSISTENCE & DATA SERVICES)
// ============================================================================
class BankManager {
private:
    vector<Account> accounts;
    const string filename = "bank.txt";
    const string billFilename = "bill.txt";

public:
    BankManager() {
        loadAccounts();
    }

    void loadAccounts() {
        accounts.clear();
        ifstream file(filename);
        if (!file.is_open()) return;

        string id, name, fname, address, pin, pass, phone;
        double balance;

        while (file >> id >> name >> fname >> address >> pin >> pass >> phone >> balance) {
            accounts.emplace_back(id, name, fname, address, pin, pass, phone, balance);
        }
        file.close();
    }

    void saveAccounts() {
        ofstream file(filename, ios::out | ios::trunc);
        if (!file.is_open()) {
            ConsoleUI::printError("Failed to save account data to file!");
            return;
        }

        for (const auto& acc : accounts) {
            file << acc.getId() << " "
                 << acc.getName() << " "
                 << acc.getFatherName() << " "
                 << acc.getAddress() << " "
                 << acc.getPin() << " "
                 << acc.getPassword() << " "
                 << acc.getPhone() << " "
                 << fixed << setprecision(2) << acc.getBalance() << "\n";
        }
        file.close();
    }

    Account* findAccount(const string& id) {
        for (auto& acc : accounts) {
            if (acc.getId() == id) {
                return &acc;
            }
        }
        return nullptr;
    }

    bool addAccount(const Account& newAcc) {
        if (findAccount(newAcc.getId()) != nullptr) {
            return false; // User ID already exists
        }
        accounts.push_back(newAcc);
        saveAccounts();
        return true;
    }

    bool updateAccount(const string& id, const string& name, const string& fname,
                       const string& addr, const string& pin, const string& pass,
                       const string& phone) {
        Account* acc = findAccount(id);
        if (!acc) return false;

        acc->setName(name);
        acc->setFatherName(fname);
        acc->setAddress(addr);
        acc->setPin(pin);
        acc->setPassword(pass);
        acc->setPhone(phone);
        saveAccounts();
        return true;
    }

    bool deleteAccount(const string& id) {
        auto it = remove_if(accounts.begin(), accounts.end(),
                            [&id](const Account& acc) { return acc.getId() == id; });

        if (it != accounts.end()) {
            accounts.erase(it, accounts.end());
            saveAccounts();
            return true;
        }
        return false;
    }

    bool deposit(const string& id, double amount) {
        Account* acc = findAccount(id);
        if (acc && acc->deposit(amount)) {
            saveAccounts();
            return true;
        }
        return false;
    }

    bool withdraw(const string& id, double amount) {
        Account* acc = findAccount(id);
        if (acc && acc->withdraw(amount)) {
            saveAccounts();
            return true;
        }
        return false;
    }

    bool transfer(const string& senderId, const string& receiverId, double amount) {
        Account* sender = findAccount(senderId);
        Account* receiver = findAccount(receiverId);

        if (!sender) {
            ConsoleUI::printError("Sender User ID not found!");
            return false;
        }
        if (!receiver) {
            ConsoleUI::printError("Receiver User ID not found!");
            return false;
        }
        if (senderId == receiverId) {
            ConsoleUI::printError("Sender and Receiver IDs cannot be identical!");
            return false;
        }

        if (sender->withdraw(amount)) {
            receiver->deposit(amount);
            saveAccounts();
            return true;
        } else {
            ConsoleUI::printError("Insufficient balance in Sender account!");
            return false;
        }
    }

    bool payBill(const string& userId, const string& billName, double amount) {
        Account* acc = findAccount(userId);
        if (!acc) {
            ConsoleUI::printError("User ID not found!");
            return false;
        }

        if (acc->withdraw(amount)) {
            saveAccounts();

            // Record bill in file
            ofstream billFile(billFilename, ios::app);
            if (billFile.is_open()) {
                billFile << userId << " " << billName << " " << fixed << setprecision(2) << amount
                         << " " << ConsoleUI::getCurrentDateTime() << "\n";
                billFile.close();
            }
            return true;
        } else {
            ConsoleUI::printError("Insufficient balance for bill payment!");
            return false;
        }
    }

    void displayAllAccounts() const {
        ConsoleUI::printHeader("ALL USER RECORDS");
        if (accounts.empty()) {
            ConsoleUI::printWarning("No user records found in database.");
            return;
        }

        cout << left 
             << setw(12) << "User ID"
             << setw(15) << "Name"
             << setw(15) << "Father Name"
             << setw(12) << "Phone"
             << setw(10) << "PIN"
             << setw(12) << "Balance (INR)" << "\n";
        cout << string(76, '-') << "\n";

        for (const auto& acc : accounts) {
            cout << left 
                 << setw(12) << acc.getId()
                 << setw(15) << acc.getName()
                 << setw(15) << acc.getFatherName()
                 << setw(12) << acc.getPhone()
                 << setw(10) << acc.getPin()
                 << fixed << setprecision(2) << setw(12) << acc.getBalance() << "\n";
        }
        cout << string(76, '-') << "\n";
    }

    void displayBillRecords() const {
        ConsoleUI::printHeader("BILL PAYMENT RECORDS");
        ifstream file(billFilename);
        if (!file.is_open()) {
            ConsoleUI::printWarning("No bill records file found.");
            return;
        }

        string id, name, date;
        double amount;
        int count = 0;

        cout << left 
             << setw(12) << "User ID"
             << setw(18) << "Bill Type"
             << setw(12) << "Amount"
             << setw(24) << "Date & Time" << "\n";
        cout << string(66, '-') << "\n";

        while (file >> id >> name >> amount >> date) {
            cout << left 
                 << setw(12) << id
                 << setw(18) << name
                 << fixed << setprecision(2) << setw(12) << amount
                 << setw(24) << date << "\n";
            count++;
        }
        file.close();

        if (count == 0) {
            ConsoleUI::printWarning("No bill payment transactions logged yet.");
        }
        cout << string(66, '-') << "\n";
    }
};

// ============================================================================
// ATM SIMULATOR CLASS
// ============================================================================
class AtmSimulator {
private:
    BankManager& bankManager;

public:
    AtmSimulator(BankManager& bm) : bankManager(bm) {}

    void runATM() {
        ConsoleUI::printHeader("ATM TERMINAL LOGIN");
        string userId = "";
        cout << "Enter User ID: ";
        cin >> userId;

        Account* user = bankManager.findAccount(userId);
        if (!user) {
            ConsoleUI::printError("Invalid User ID! Account not found.");
            ConsoleUI::pause();
            return;
        }

        // Security: PIN Authentication (3 attempts limit)
        int attempts = 0;
        bool authenticated = false;
        while (attempts < 3) {
            string pin = ConsoleUI::getMaskedInput("Enter 5-digit ATM PIN: ");
            if (user->verifyPin(pin)) {
                authenticated = true;
                break;
            } else {
                attempts++;
                ConsoleUI::printError("Incorrect PIN! Attempts remaining: " + to_string(3 - attempts));
            }
        }

        if (!authenticated) {
            ConsoleUI::printError("Card Blocked! Exceeded maximum PIN attempts.");
            ConsoleUI::pause();
            return;
        }

        ConsoleUI::printSuccess("PIN Verified! Welcome to ATM Terminal, " + user->getName());

        bool sessionActive = true;
        while (sessionActive) {
            ConsoleUI::printHeader("ATM MAIN MENU - Welcome " + user->getName());
            cout << "1. Check Account Balance\n";
            cout << "2. Cash Withdrawal\n";
            cout << "3. Quick Cash (₹500 / ₹1000 / ₹2000 / ₹5000)\n";
            cout << "4. Fund Transfer (P2P Transfer)\n";
            cout << "5. Account Details\n";
            cout << "6. Exit ATM Terminal\n\n";
            cout << "Select Option [1-6]: ";

            int choice;
            if (!(cin >> choice)) {
                cin.clear();
                cin.ignore(10000, '\n');
                continue;
            }

            switch (choice) {
                case 1: {
                    ConsoleUI::printHeader("ATM - BALANCE INQUIRY");
                    cout << ConsoleUI::GREEN << ConsoleUI::BOLD;
                    cout << "+---------------------------------------------------+\n";
                    cout << "| Account ID      : " << setw(30) << left << user->getId() << " |\n";
                    cout << "| Account Holder  : " << setw(30) << left << user->getName() << " |\n";
                    cout << "| Available Balance: ₹" << fixed << setprecision(2) << setw(28) << left << user->getBalance() << " |\n";
                    cout << "+---------------------------------------------------+\n" << ConsoleUI::RESET;
                    ConsoleUI::pause();
                    break;
                }
                case 2: {
                    ConsoleUI::printHeader("ATM - CASH WITHDRAWAL");
                    double amount;
                    cout << "Enter Withdrawal Amount (INR): ₹";
                    if (cin >> amount && amount > 0) {
                        if (bankManager.withdraw(user->getId(), amount)) {
                            ConsoleUI::printSuccess("Cash Dispensed Successfully: ₹" + to_string((int)amount));
                            dispenseNotes((int)amount);
                            printReceipt(user->getId(), "WITHDRAWAL", amount, user->getBalance());
                        } else {
                            ConsoleUI::printError("Transaction Failed! Insufficient Balance.");
                        }
                    } else {
                        ConsoleUI::printError("Invalid Amount!");
                    }
                    ConsoleUI::pause();
                    break;
                }
                case 3: {
                    ConsoleUI::printHeader("ATM - QUICK CASH");
                    cout << "1. ₹500\n2. ₹1,000\n3. ₹2,000\n4. ₹5,000\nChoice: ";
                    int qChoice;
                    cin >> qChoice;
                    double qAmount = 0;
                    if (qChoice == 1) qAmount = 500;
                    else if (qChoice == 2) qAmount = 1000;
                    else if (qChoice == 3) qAmount = 2000;
                    else if (qChoice == 4) qAmount = 5000;

                    if (qAmount > 0) {
                        if (bankManager.withdraw(user->getId(), qAmount)) {
                            ConsoleUI::printSuccess("Quick Cash Dispensed: ₹" + to_string((int)qAmount));
                            dispenseNotes((int)qAmount);
                            printReceipt(user->getId(), "QUICK CASH", qAmount, user->getBalance());
                        } else {
                            ConsoleUI::printError("Insufficient Balance!");
                        }
                    } else {
                        ConsoleUI::printError("Invalid Choice!");
                    }
                    ConsoleUI::pause();
                    break;
                }
                case 4: {
                    ConsoleUI::printHeader("ATM - FUND TRANSFER");
                    string destId;
                    double tAmount;
                    cout << "Enter Beneficiary User ID: ";
                    cin >> destId;
                    cout << "Enter Amount to Transfer (INR): ₹";
                    if (cin >> tAmount && tAmount > 0) {
                        if (bankManager.transfer(user->getId(), destId, tAmount)) {
                            ConsoleUI::printSuccess("Transfer Completed Successfully to User: " + destId);
                            printReceipt(user->getId(), "TRANSFER TO " + destId, tAmount, user->getBalance());
                        }
                    } else {
                        ConsoleUI::printError("Invalid Transfer Amount!");
                    }
                    ConsoleUI::pause();
                    break;
                }
                case 5: {
                    ConsoleUI::printHeader("ACCOUNT DETAILS");
                    cout << "User ID      : " << user->getId() << "\n";
                    cout << "Name         : " << user->getName() << "\n";
                    cout << "Father Name  : " << user->getFatherName() << "\n";
                    cout << "Address      : " << user->getAddress() << "\n";
                    cout << "Phone No     : " << user->getPhone() << "\n";
                    cout << "Balance      : ₹" << fixed << setprecision(2) << user->getBalance() << "\n";
                    ConsoleUI::pause();
                    break;
                }
                case 6:
                    sessionActive = false;
                    ConsoleUI::printSuccess("Thank you for using our ATM Service!");
                    break;
                default:
                    ConsoleUI::printError("Invalid choice! Select options [1-6].");
            }
        }
    }

private:
    void dispenseNotes(int amount) {
        cout << ConsoleUI::YELLOW << "\n[CASH DISPENSER SIMULATION]\n";
        int n500 = amount / 500;
        amount %= 500;
        int n200 = amount / 200;
        amount %= 200;
        int n100 = amount / 100;
        amount %= 100;

        if (n500 > 0) cout << " -> ₹500 Notes : " << n500 << "\n";
        if (n200 > 0) cout << " -> ₹200 Notes : " << n200 << "\n";
        if (n100 > 0) cout << " -> ₹100 Notes : " << n100 << "\n";
        if (amount > 0) cout << " -> Coins / Small Change : ₹" << amount << "\n";
        cout << ConsoleUI::RESET;
    }

    void printReceipt(const string& userId, const string& type, double amount, double remBalance) {
        string receiptText = "";
        ostringstream oss;
        oss << "====================================================\n"
            << "               ATM TRANSACTION RECEIPT              \n"
            << "====================================================\n"
            << " Date/Time  : " << ConsoleUI::getCurrentDateTime() << "\n"
            << " User ID    : " << userId << "\n"
            << " Type       : " << type << "\n"
            << " Amount     : ₹" << fixed << setprecision(2) << amount << "\n"
            << " Balance    : ₹" << fixed << setprecision(2) << remBalance << "\n"
            << " Status     : SUCCESSFUL\n"
            << "====================================================\n";
        receiptText = oss.str();

        cout << "\n" << ConsoleUI::CYAN << receiptText << ConsoleUI::RESET;

        // Save receipt file
        string fileName = "receipt_" + userId + ".txt";
        ofstream rFile(fileName, ios::app);
        if (rFile.is_open()) {
            rFile << receiptText << "\n";
            rFile.close();
            ConsoleUI::printInfo("Digital receipt saved to " + fileName);
        }
    }
};

// ============================================================================
// APP CONTROLLER CLASS (MAIN MENU & ADMIN MANAGEMENT)
// ============================================================================
class AppController {
private:
    BankManager bankManager;
    AtmSimulator atmSimulator;

public:
    AppController() : atmSimulator(bankManager) {}

    void run() {
        ConsoleUI::enableANSI();

        bool running = true;
        while (running) {
            ConsoleUI::printBanner();
            cout << "1. Bank Management (Admin Panel)\n";
            cout << "2. ATM Machine Simulator\n";
            cout << "3. Exit System\n\n";
            cout << "Enter Your Choice [1-3]: ";

            int choice;
            if (!(cin >> choice)) {
                cin.clear();
                cin.ignore(10000, '\n');
                continue;
            }

            switch (choice) {
                case 1:
                    adminLoginAndMenu();
                    break;
                case 2:
                    atmSimulator.runATM();
                    break;
                case 3:
                    running = false;
                    ConsoleUI::printSuccess("Exiting Banking System. Have a great day!");
                    break;
                default:
                    ConsoleUI::printError("Invalid Option! Please select 1, 2, or 3.");
                    ConsoleUI::pause();
            }
        }
    }

private:
    void adminLoginAndMenu() {
        ConsoleUI::printHeader("ADMIN AUTHENTICATION");
        string email, pin, pass;

        cout << "Enter Admin Email    : ";
        cin >> email;
        pin = ConsoleUI::getMaskedInput("Enter Admin PIN      : ");
        pass = ConsoleUI::getMaskedInput("Enter Admin Password : ");

        // Admin Credentials check
        if (email == "cses@gmail.com" && pin == "12345" && pass == "12345") {
            ConsoleUI::printSuccess("Admin Login Successful!");
            bankManagementMenu();
        } else {
            ConsoleUI::printError("Invalid Admin Email, PIN, or Password!");
            ConsoleUI::pause();
        }
    }

    void bankManagementMenu() {
        bool adminActive = true;
        while (adminActive) {
            ConsoleUI::printHeader("BANK MANAGEMENT SYSTEM (ADMIN PANEL)");
            cout << "1.  Add New User Account\n";
            cout << "2.  Check Account Details\n";
            cout << "3.  Deposit Amount\n";
            cout << "4.  Withdraw Amount\n";
            cout << "5.  Transfer Money\n";
            cout << "6.  Pay Utility Bills\n";
            cout << "7.  Search User Record\n";
            cout << "8.  Edit User Record\n";
            cout << "9.  Delete User Record\n";
            cout << "10. View All User Records\n";
            cout << "11. View All Bill Payments\n";
            cout << "12. Logout / Go Back\n\n";
            cout << "Enter Choice [1-12]: ";

            int choice;
            if (!(cin >> choice)) {
                cin.clear();
                cin.ignore(10000, '\n');
                continue;
            }

            switch (choice) {
                case 1: addNewUser(); break;
                case 2: checkAccountDetails(); break;
                case 3: depositAmount(); break;
                case 4: withdrawAmount(); break;
                case 5: transferMoney(); break;
                case 6: payBills(); break;
                case 7: searchUser(); break;
                case 8: editUser(); break;
                case 9: deleteUser(); break;
                case 10: bankManager.displayAllAccounts(); ConsoleUI::pause(); break;
                case 11: bankManager.displayBillRecords(); ConsoleUI::pause(); break;
                case 12: adminActive = false; break;
                default: ConsoleUI::printError("Invalid selection!"); ConsoleUI::pause();
            }
        }
    }

    bool isLowercaseAlphanumeric(const string& str) {
        if (str.empty()) return false;
        for (char c : str) {
            if (!((c >= 'a' && c <= 'z') || (c >= '0' && c <= '9'))) {
                return false;
            }
        }
        return true;
    }

    void addNewUser() {
        ConsoleUI::printHeader("ADD NEW USER ACCOUNT");
        string id, name, fname, address, pin, pass, phone;
        double balance;

        cout << "User ID (lowercase & numbers only): "; cin >> id;
        if (!isLowercaseAlphanumeric(id)) {
            ConsoleUI::printError("Invalid User ID! Must contain ONLY lowercase letters and numbers (e.g. rahul101).");
            ConsoleUI::pause();
            return;
        }

        cout << "Full Name          : "; cin >> name;
        cout << "Father's Name      : "; cin >> fname;
        cout << "Address            : "; cin >> address;
        cout << "5-Digit PIN Code   : "; cin >> pin;
        cout << "Account Password   : "; cin >> pass;
        cout << "Phone Number       : "; cin >> phone;
        cout << "Initial Balance (₹): "; cin >> balance;

        Account newAcc(id, name, fname, address, pin, pass, phone, balance);
        if (bankManager.addAccount(newAcc)) {
            ConsoleUI::printSuccess("User Account Created Successfully for ID: " + id);
        } else {
            ConsoleUI::printError("Account Creation Failed! User ID already exists.");
        }
        ConsoleUI::pause();
    }

    void checkAccountDetails() {
        ConsoleUI::printHeader("SEARCH ACCOUNT DETAILS");
        string id;
        cout << "Enter User ID: ";
        cin >> id;

        Account* acc = bankManager.findAccount(id);
        if (acc) {
            cout << "\n--------------------------------------------\n";
            cout << "User ID      : " << acc->getId() << "\n";
            cout << "Name         : " << acc->getName() << "\n";
            cout << "Father Name  : " << acc->getFatherName() << "\n";
            cout << "Address      : " << acc->getAddress() << "\n";
            cout << "PIN Code     : " << acc->getPin() << "\n";
            cout << "Password     : " << acc->getPassword() << "\n";
            cout << "Phone Number : " << acc->getPhone() << "\n";
            cout << "Current Bal  : ₹" << fixed << setprecision(2) << acc->getBalance() << "\n";
            cout << "--------------------------------------------\n";
        } else {
            ConsoleUI::printError("User ID not found!");
        }
        ConsoleUI::pause();
    }

    void depositAmount() {
        ConsoleUI::printHeader("DEPOSIT MONEY");
        string id;
        double amount;
        cout << "Enter User ID: "; cin >> id;
        cout << "Enter Deposit Amount (INR): ₹"; cin >> amount;

        if (bankManager.deposit(id, amount)) {
            ConsoleUI::printSuccess("Successfully deposited ₹" + to_string((int)amount) + " into Account ID: " + id);
        } else {
            ConsoleUI::printError("Deposit Failed! User ID not found or invalid amount.");
        }
        ConsoleUI::pause();
    }

    void withdrawAmount() {
        ConsoleUI::printHeader("WITHDRAW MONEY");
        string id;
        double amount;
        cout << "Enter User ID: "; cin >> id;
        cout << "Enter Withdrawal Amount (INR): ₹"; cin >> amount;

        if (bankManager.withdraw(id, amount)) {
            ConsoleUI::printSuccess("Successfully withdrew ₹" + to_string((int)amount) + " from Account ID: " + id);
        } else {
            ConsoleUI::printError("Withdrawal Failed! Insufficient balance or invalid User ID.");
        }
        ConsoleUI::pause();
    }

    void transferMoney() {
        ConsoleUI::printHeader("P2P MONEY TRANSFER");
        string sId, rId;
        double amount;
        cout << "Enter Sender User ID  : "; cin >> sId;
        cout << "Enter Receiver User ID: "; cin >> rId;
        cout << "Enter Transfer Amount : ₹"; cin >> amount;

        if (bankManager.transfer(sId, rId, amount)) {
            ConsoleUI::printSuccess("Fund Transfer Completed Successfully!");
        }
        ConsoleUI::pause();
    }

    void payBills() {
        ConsoleUI::printHeader("UTILITY BILL PAYMENT");
        string id, billName;
        double amount;
        cout << "Enter User ID   : "; cin >> id;
        cout << "Enter Bill Type (Electricity/Water/WiFi/Gas): "; cin >> billName;
        cout << "Enter Bill Amount: ₹"; cin >> amount;

        if (bankManager.payBill(id, billName, amount)) {
            ConsoleUI::printSuccess("Bill Paid Successfully for " + billName + "!");
        }
        ConsoleUI::pause();
    }

    void searchUser() {
        checkAccountDetails();
    }

    void editUser() {
        ConsoleUI::printHeader("EDIT USER RECORD");
        string id;
        cout << "Enter User ID to Edit: ";
        cin >> id;

        Account* acc = bankManager.findAccount(id);
        if (!acc) {
            ConsoleUI::printError("User ID not found!");
            ConsoleUI::pause();
            return;
        }

        string name, fname, address, pin, pass, phone;
        cout << "New Full Name        : "; cin >> name;
        cout << "New Father's Name    : "; cin >> fname;
        cout << "New Address          : "; cin >> address;
        cout << "New 5-Digit PIN Code : "; cin >> pin;
        cout << "New Password         : "; cin >> pass;
        cout << "New Phone Number     : "; cin >> phone;

        if (bankManager.updateAccount(id, name, fname, address, pin, pass, phone)) {
            ConsoleUI::printSuccess("User Record Updated Successfully!");
        } else {
            ConsoleUI::printError("Failed to update user record.");
        }
        ConsoleUI::pause();
    }

    void deleteUser() {
        ConsoleUI::printHeader("DELETE USER RECORD");
        string id;
        cout << "Enter User ID to Delete: ";
        cin >> id;

        if (bankManager.deleteAccount(id)) {
            ConsoleUI::printSuccess("User Account Deleted Successfully!");
        } else {
            ConsoleUI::printError("User ID not found!");
        }
        ConsoleUI::pause();
    }
};

// ============================================================================
// MAIN ENTRY POINT
// ============================================================================
int main() {
    AppController app;
    app.run();
    return 0;
}