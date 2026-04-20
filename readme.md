SplitSmart — Group Expense Manager

SplitSmart is a real-time group expense manager for friends, flatmates, and travel groups. It helps keep track of shared expenses and makes settling up simple by calculating who owes whom and reducing the number of payments needed.

Problem

Splitting expenses in a group gets messy quickly. Whether it’s a trip, rent, or shared meals, people end up tracking things in chats, notes, or just memory — which usually leads to confusion.

Some common issues:

People forget who paid for what
Manual tracking leads to mistakes
Spreadsheets feel like overkill
Not everyone has the latest updates
What this app does

SplitSmart keeps everything in one place and updates in real time. It:

Tracks all group expenses
Calculates balances automatically
Minimises the number of transactions needed to settle
Syncs data instantly across users
Features
Core
User authentication (email/password)
Create groups and add members
Add expenses with details (amount, category, payer, etc.)
Equal split between selected members
Custom split with manual amounts
Smart settlement calculation (minimises transactions)
One-click “settle up”
Per-user balance view (who owes / who is owed)
Real-time updates using Firestore
UI/UX
Search expenses
Filter by member or category
Clear colour indicators:
Green → should receive money
Red → owes money
Works on both mobile and desktop
Handles empty and loading states properly
Tech Stack
Frontend
React 18
React Router v6
Context API + useReducer
Vite
Lazy loading with Suspense
useMemo / useCallback for optimisation
CSS variables for theming
Backend
Firebase Authentication
Firestore (real-time database)
Firebase Analytics
Project Structure
splitsmart/

├── index.html

├── vite.config.js

├── package.json

└── src/

    ├── main.jsx
    
    ├── App.jsx
    
    ├── index.css
    
    ├── firebase.js
    
    │
    
    ├── context/
    
    │   ├── AuthContext.jsx
    
    │   └── GroupContext.jsx
    
    │
    
    ├── pages/
    
    │   ├── LoginPage.jsx
    
    │   ├── DashboardPage.jsx
    
    │   ├── GroupPage.jsx
    
    │   └── AddExpensePage.jsx
    
    │
    
    ├── components/
    
    │   ├── AppShell.jsx
    
    │   ├── Sidebar.jsx
    
    │   ├── Avatar.jsx
    
    │   ├── CreateGroupModal.jsx
    
    │   └── Spinner.jsx
    
    │
    
    └── utils/
        └── index.js
Settlement Logic

Instead of creating a separate transaction for every pair of users, the app calculates net balances and reduces the total number of payments.

Approach:
Calculate each person’s net balance
Split users into:
Creditors (positive balance)
Debtors (negative balance)
Match the largest debtor with the largest creditor
Repeat until balances are cleared

This reduces unnecessary transactions.

Setup
Requirements
Node.js (v18+)
Firebase project
Install
unzip splitsmart.zip
cd splitsmart
npm install
Firebase setup
Create a project in Firebase Console
Add a web app
Copy config into src/firebase.js
Enable Auth
Go to Authentication → enable Email/Password
Firestore
Create database (test mode is fine)
Run
npm run dev
Scripts
npm run dev → start dev server
npm run build → production build
npm run preview → preview build
Data Structure
users/{uid}
groups/{groupId}
  └── expenses/{expenseId}

Each expense stores:

description, amount
payer info
split details
category, date
settlement flag
Edge Cases Handled
Custom splits must match total
Only selected members are included per expense
Rounding handled to 2 decimals
Floating point issues avoided
Works even with no expenses
Real-time updates stay consistent
Settlements are treated like expenses, so balances stay accurate
