function showEMICalculator() {
    closeQuickTools();
    const p = Number(prompt("Enter Loan Amount (₹):", "100000"));
    const rateInput = Number(prompt("Enter Annual Interest Rate (%):", "10"));
    const n = Number(prompt("⏱Enter Loan Tenure (in months):", "12"));
    if (!isNaN(p) && !isNaN(rateInput) && !isNaN(n) && p > 0 && rateInput > 0 && n > 0) {
        const r = rateInput / 12 / 100;
        const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
        alert(`Calculated EMI: ₹${emi.toFixed(2)} per month\nTotal Amount Payable: ₹${(emi * n).toFixed(2)}`);
    } else { alert('Please enter valid positive numbers.'); }
}

function showCurrencyConverter() {
    closeQuickTools(); const amount = prompt("Enter Amount in USD to convert to INR ($):", "100");
    if (amount) alert(`$${amount} USD is approximately ₹${(Number(amount) * 83.12).toFixed(2)} INR`);
}

function showDebtPlanner() {
    closeQuickTools(); alert("Avalanche vs Snowball Planner:\n\nBased on optimal financial modeling, prioritize paying off the highest-interest debt first (Avalanche method) to save the most money over time.");
}

function normalizeImportedState(payload) {
    const safe = (payload && typeof payload === 'object') ? payload : {};
    const base = { ...getDefaultState(), ...safe };

    return {
        ...base,
        budget: Number(base.budget || 0),
        income: Number(base.income || 0),
        transactions: Array.isArray(base.transactions) ? base.transactions : [],
        goals: Array.isArray(base.goals) ? base.goals : [],
        investments: Array.isArray(base.investments) ? base.investments : [],
        subscriptions: Array.isArray(base.subscriptions) ? base.subscriptions : [],
        netWorthHistory: Array.isArray(base.netWorthHistory) ? base.netWorthHistory : [],
        recurring: Array.isArray(base.recurring) ? base.recurring : [],
        expenseEntries: Array.isArray(base.expenseEntries) ? base.expenseEntries : [],
        accounts: Array.isArray(base.accounts) ? base.accounts : [],
        customAssets: Array.isArray(base.customAssets) ? base.customAssets : [],
        customLoans: Array.isArray(base.customLoans) ? base.customLoans : [],
        categoryBudgets: (base.categoryBudgets && typeof base.categoryBudgets === 'object') ? base.categoryBudgets : {},
        theme: base.theme === 'dark' ? 'dark' : 'light'
    };
}

function refreshAfterDataImport() {
    if (typeof saveState === 'function') saveState();
    if (typeof applyTheme === 'function') applyTheme();
    if (typeof renderAll === 'function') renderAll();
    if (typeof renderAccounts === 'function') renderAccounts();
    if (typeof renderCustomAssets === 'function') renderCustomAssets();
    if (typeof renderLoans === 'function') renderLoans();
    if (typeof updateAccountDropdowns === 'function') updateAccountDropdowns();
    if (typeof syncDashboard === 'function') syncDashboard();
    if (typeof updateCharts === 'function') updateCharts();
}

function createSampleState() {
    const today = new Date();
    const iso = (offsetDays = 0) => {
        const d = new Date(today);
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
    };

    const accSalary = {
        id: 'acc_demo_salary',
        bankName: 'HDFC Bank',
        holder: 'Demo User',
        accNumber: '4821',
        type: 'Savings',
        ownership: 'Individual',
        balance: 182500
    };

    const accSpending = {
        id: 'acc_demo_spend',
        bankName: 'SBI',
        holder: 'Demo User',
        accNumber: '9154',
        type: 'Savings',
        ownership: 'Individual',
        balance: 42500
    };

    const accLoan = {
        id: 'acc_demo_loan',
        bankName: 'ICICI Home Loan',
        holder: 'Demo User',
        accNumber: '7301',
        type: 'Loan',
        ownership: 'Individual',
        balance: -980000
    };

    const transactions = [
        { id: 'tx_demo_1', date: iso(-20), category: 'Salary', amount: 85000, type: 'income', notes: 'Monthly salary', accountId: accSalary.id },
        { id: 'tx_demo_2', date: iso(-18), category: 'Transfer', amount: 15000, type: 'transfer', notes: 'To spending account', accountId: accSalary.id, toAccountId: accSpending.id },
        { id: 'tx_demo_3', date: iso(-16), category: 'Groceries', amount: 4200, type: 'expense', notes: 'Weekly groceries', accountId: accSpending.id },
        { id: 'tx_demo_4', date: iso(-14), category: 'Rent', amount: 18000, type: 'expense', notes: 'House rent', accountId: accSpending.id },
        { id: 'tx_demo_5', date: iso(-12), category: 'Utilities', amount: 2600, type: 'expense', notes: 'Electricity + Internet', accountId: accSpending.id },
        { id: 'tx_demo_6', date: iso(-10), category: 'Investment', amount: 10000, type: 'expense', notes: 'Mutual fund SIP', accountId: accSalary.id },
        { id: 'tx_demo_7', date: iso(-8), category: 'Freelance', amount: 12000, type: 'income', notes: 'Project payment', accountId: accSalary.id },
        { id: 'tx_demo_8', date: iso(-6), category: 'Loan Repayment', amount: 15000, type: 'expense', notes: 'Home loan EMI', accountId: accSalary.id },
        { id: 'tx_demo_9', date: iso(-4), category: 'Entertainment', amount: 1800, type: 'expense', notes: 'Weekend movie', accountId: accSpending.id },
        { id: 'tx_demo_10', date: iso(-2), category: 'Transport', amount: 2200, type: 'expense', notes: 'Fuel and cab', accountId: accSpending.id }
    ];

    return normalizeImportedState({
        income: 97000,
        budget: 60000,
        expenseEntries: [],
        transactions,
        netWorthHistory: [
            { date: iso(-90), value: -220000 },
            { date: iso(-60), value: -120000 },
            { date: iso(-30), value: 15000 },
            { date: iso(0), value: 98000 }
        ],
        goals: [
            { id: 'goal_demo_emergency', name: 'Emergency Fund', target: 300000, current: 125000, deadline: iso(180), accountId: accSalary.id },
            { id: 'goal_demo_trip', name: 'Japan Trip', target: 180000, current: 52000, deadline: iso(240), accountId: accSpending.id }
        ],
        categoryBudgets: {
            Rent: 18000,
            Groceries: 8000,
            Utilities: 4000,
            Transport: 5000,
            Entertainment: 4000
        },
        theme: document.body.classList.contains('dark') ? 'dark' : 'light',
        lastReset: null,
        recurring: [],
        investments: [
            { id: 'inv_demo_1', ticker: 'NIFTYBEES', qty: 20, buyPrice: 230, currentPrice: 248, accountId: accSalary.id },
            { id: 'inv_demo_2', ticker: 'GOLD ETF', qty: 6, buyPrice: 5800, currentPrice: 6125, accountId: accSalary.id }
        ],
        subscriptions: [
            { id: 'sub_demo_1', name: 'Netflix', amount: 649, dueDate: 8, accountId: accSpending.id },
            { id: 'sub_demo_2', name: 'Spotify', amount: 119, dueDate: 12, accountId: accSpending.id }
        ],
        accounts: [accSalary, accSpending, accLoan],
        customAssets: [
            { id: 'asset_demo_1', type: 'movable', category: 'Vehicle', name: 'Honda City', value: 650000 },
            { id: 'asset_demo_2', type: 'immovable', category: 'Real Estate', name: 'Apartment Share', value: 1800000 }
        ],
        customLoans: [
            {
                id: 'loan_demo_1',
                type: 'bank',
                bankName: 'ICICI',
                accountNo: '7301',
                purpose: 'Home Loan',
                principal: 1200000,
                rate: 8.4,
                years: 15,
                finalAmount: 980000,
                accountId: accLoan.id
            }
        ]
    });
}

function exportAllData() {
    const snapshot = {
        exportedAt: new Date().toISOString(),
        app: 'FinancePro',
        version: 1,
        state
    };

    const file = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `financepro_full_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function importAllData() {
    const useSampleData = confirm('Click OK to load Sample Data for all sections.\nClick Cancel to import your own JSON backup file.');

    if (useSampleData) {
        const replace = confirm('This will replace current data with sample data. Continue?');
        if (!replace) return;

        state = createSampleState();
        refreshAfterDataImport();
        alert('Sample data loaded successfully across all sections.');
        return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (loadEvent) => {
            try {
                const raw = JSON.parse(loadEvent.target.result);
                const importedPayload = raw && raw.state ? raw.state : raw;
                if (!importedPayload || typeof importedPayload !== 'object') {
                    throw new Error('Invalid backup format');
                }

                state = normalizeImportedState(importedPayload);
                refreshAfterDataImport();

                alert('Full data imported successfully. All sections were updated.');
            } catch (error) {
                console.error('Full data import failed', error);
                alert('Import failed. Please choose a valid FinancePro JSON backup file.');
            }
        };

        reader.readAsText(file);
    };

    input.click();
}

function exportCSV() {
    const transactions = getTransactions(); if (transactions.length === 0) return alert("No transactions to export.");
    const csv = [['Date', 'Category', 'Amount', 'Type', 'Notes'], ...transactions.map(t => [new Date(t.date).toLocaleDateString('en-IN'), t.category, t.amount, t.type, t.notes])].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `finance_transactions_${new Date().toISOString().split('T')[0]}.csv`; a.click();
}

function importCSV() {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv';
    input.onchange = (e) => {
        const file = e.target.files[0]; if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            e.target.result.split('\n').slice(1).forEach(line => {
                if (!line.trim()) return;
                const [date, category, amount, type, ...notes] = line.split(',').map(cell => cell.replace(/"/g, ''));
                if (amount && category) addTransaction(type.toLowerCase() === 'income' ? 'income' : 'expense', Number(amount), category, new Date().toISOString().split('T')[0], notes.join(','));
            });
        };
        reader.readAsText(file);
    };
    input.click();
}

function downloadReport() {
    if (!window.jspdf || !window.jspdf.jsPDF) return alert('PDF library not loaded. Please refresh and try again.');
    const doc = new window.jspdf.jsPDF(); let y = 18;
    function checkPageBreak(space = 10) { if (y + space > 280) { doc.addPage(); y = 18; } }

    doc.setFontSize(20); doc.setFont("helvetica", "bold"); doc.text('FinancePro Comprehensive Report', 14, y); y += 12;
    doc.setFontSize(10); doc.setFont("helvetica", "normal"); doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, y); y += 15;

    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text('Executive Summary', 14, y); y += 8;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    const inc = getCalculatedIncome(); const exp = getTotalExpense();
    doc.text(`Total Income: ₹${inc.toLocaleString()}`, 14, y); y += 6;
    doc.text(`Total Expenses: ₹${exp.toLocaleString()}`, 14, y); y += 6;
    doc.text(`Net Savings: ₹${(inc - exp).toLocaleString()}`, 14, y); y += 12;

    checkPageBreak(30); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text('Wealth & Investments', 14, y); y += 8; doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(`Current Net Worth: ₹${(state.netWorthHistory && state.netWorthHistory.length > 0) ? state.netWorthHistory[state.netWorthHistory.length - 1].value.toLocaleString() : 0}`, 14, y); y += 8;

    if (state.investments && state.investments.length > 0) {
        doc.setFont("helvetica", "bold"); doc.text('Portfolio:', 14, y); y += 6; doc.setFont("helvetica", "normal");
        state.investments.forEach(inv => { checkPageBreak(8); doc.text(`- ${inv.ticker}: ${inv.qty} units | Value: ₹${(inv.qty * inv.currentPrice).toLocaleString()}`, 14, y); y += 6; });
    } else { doc.text('No active investments.', 14, y); y += 6; } y += 6;

    checkPageBreak(30); doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.text('Transaction History (Latest 30)', 14, y); y += 8; doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const txns = getTransactions().slice(0, 30);
    if (txns.length > 0) {
        doc.setFont("helvetica", "bold"); doc.text('Date', 14, y); doc.text('Category', 45, y); doc.text('Type', 90, y); doc.text('Amount', 130, y); doc.text('Notes', 165, y); y += 6; doc.setFont("helvetica", "normal");
        txns.forEach(t => { checkPageBreak(8); doc.text(new Date(t.date).toLocaleDateString('en-IN'), 14, y); doc.text(t.category.substring(0, 18), 45, y); doc.text(t.type, 90, y); doc.text(`₹${t.amount.toLocaleString()}`, 130, y); doc.text((t.notes || '-').substring(0, 20), 165, y); y += 6; });
    } else { doc.text('No transactions recorded.', 14, y); }
    doc.save(`FinancePro_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

// Add these functions to your js/tools.js file

function showFIRECalculator() {
    closeQuickTools();
    const currentAge = Number(prompt("Enter your current age:", "25"));
    const annualSpend = Number(prompt("What are your estimated annual expenses in retirement? (₹):", "600000"));
    const currentSaved = Number(prompt("How much have you already invested? (₹):", "100000"));
    const monthlyInvest = Number(prompt("How much can you invest monthly? (₹):", "20000"));

    if (currentAge > 0 && annualSpend > 0) {
        // Rule of 25 for FIRE target (assumes 4% safe withdrawal rate)
        const fireTarget = annualSpend * 25; 
        const marketReturn = 0.10; // 10% average market return
        let years = 0;
        let futureValue = currentSaved;

        // Calculate compounding years until target is reached
        while (futureValue < fireTarget && years < 60) {
            futureValue = (futureValue + (monthlyInvest * 12)) * (1 + marketReturn);
            years++;
        }

        const retirementAge = currentAge + years;
        alert(`🔥 FIRE Projection:\n\nTarget Retirement Corpus: ₹${fireTarget.toLocaleString()}\n\nAt your current investment rate, you will reach your goal in ${years} years (Age ${retirementAge}).`);
    } else {
        alert("Please enter valid numbers to calculate your FIRE number.");
    }
}

function showTaxEstimator() {
    closeQuickTools();
    const income = Number(prompt("Enter your total annual income (₹):", "1200000"));
    
    if (income > 0) {
        // Simplified estimate based on general brackets (Update logic for specific regional tax laws)
        let tax = 0;
        if (income <= 300000) {
            tax = 0;
        } else if (income <= 600000) {
            tax = (income - 300000) * 0.05;
        } else if (income <= 900000) {
            tax = 15000 + ((income - 600000) * 0.10);
        } else if (income <= 1200000) {
            tax = 45000 + ((income - 900000) * 0.15);
        } else if (income <= 1500000) {
            tax = 90000 + ((income - 1200000) * 0.20);
        } else {
            tax = 150000 + ((income - 1500000) * 0.30);
        }
        
        const effectiveRate = ((tax / income) * 100).toFixed(1);
        alert(`⚖️ Tax Estimate:\n\nEstimated Annual Tax: ₹${tax.toLocaleString()}\nEffective Tax Rate: ${effectiveRate}%\nTake-Home Pay: ₹${(income - tax).toLocaleString()}\n\n(Note: This is a simplified estimate assuming no deductions under a new regime).`);
    }
}

function formatCurrency(amount) {
    const value = Number(amount || 0);
    return `₹${value.toLocaleString('en-IN')}`;
}

async function fetchJsonWithTimeout(url, timeoutMs = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

async function getGoldSpotPricePerGram() {
    const fallbacks = [
        async () => {
            const data = await fetchJsonWithTimeout('https://api.metals.live/v1/spot/gold');
            const latest = Array.isArray(data) ? data[data.length - 1] : null;
            const ouncePriceUsd = Array.isArray(latest) ? Number(latest[1]) : Number(latest?.price || 0);
            if (!Number.isFinite(ouncePriceUsd) || ouncePriceUsd <= 0) return null;
            return (ouncePriceUsd * 83.5) / 31.1035;
        },
        async () => {
            const data = await fetchJsonWithTimeout('https://www.goldapi.io/api/XAU/USD');
            const ouncePriceUsd = Number(data?.price || 0);
            if (!Number.isFinite(ouncePriceUsd) || ouncePriceUsd <= 0) return null;
            return (ouncePriceUsd * 83.5) / 31.1035;
        }
    ];

    for (const resolver of fallbacks) {
        try {
            const price = await resolver();
            if (Number.isFinite(price) && price > 0) return Math.round(price * 100) / 100;
        } catch (error) {
            console.warn('Gold price fetch failed', error);
        }
    }

    return 6500;
}

async function getVehicleEstimate(details = {}) {
    const basePrice = Number(details.basePrice || 0);
    const age = Number(details.age || 0);
    const mileage = Number(details.mileage || 0);
    const condition = String(details.condition || 'good').toLowerCase();
    const depreciationRate = condition === 'excellent' ? 0.08 : condition === 'fair' ? 0.14 : 0.11;
    const mileagePenalty = Math.min(0.18, mileage / 200000);
    const agePenalty = Math.min(0.65, age * depreciationRate);
    const estimated = Math.max(basePrice * (1 - agePenalty - mileagePenalty), basePrice * 0.15);

    return {
        value: Math.round(estimated),
        source: 'Model estimate',
        updatedAt: new Date().toISOString()
    };
}

function buildLoanSchedule(principal, annualRate, years) {
    const amount = Number(principal || 0);
    const rate = Number(annualRate || 0) / 100 / 12;
    const tenureMonths = Math.max(1, Math.round(Number(years || 0) * 12));

    if (amount <= 0 || tenureMonths <= 0) {
        return { emi: 0, totalPayment: 0, totalInterest: 0, schedule: [] };
    }

    const emi = rate === 0
        ? amount / tenureMonths
        : (amount * rate * Math.pow(1 + rate, tenureMonths)) / (Math.pow(1 + rate, tenureMonths) - 1);

    let balance = amount;
    const schedule = [];

    for (let month = 1; month <= tenureMonths; month += 1) {
        const interest = balance * rate;
        const principalPaid = Math.min(emi - interest, balance);
        balance = Math.max(0, balance - principalPaid);
        schedule.push({ month, emi: Math.round(emi), interest: Math.round(interest), principal: Math.round(principalPaid), balance: Math.round(balance) });
    }

    return {
        emi: Math.round(emi),
        totalPayment: Math.round(emi * tenureMonths),
        totalInterest: Math.round((emi * tenureMonths) - amount),
        schedule
    };
}

function summarizeLoanInsights(principal, annualRate, years, remainingBalance) {
    const schedule = buildLoanSchedule(principal, annualRate, years);
    const balance = Number(remainingBalance || principal || 0);
    const highCost = annualRate >= 12;
    const overpaySuggestion = balance > 0 ? Math.max(0, Math.round(schedule.emi * 0.25)) : 0;

    return {
        ...schedule,
        balance,
        advice: highCost
            ? 'High-cost debt detected. Prioritize this loan before long-term investing if emergency savings are intact.'
            : 'Repay on schedule and keep an emergency buffer before prepaying aggressively.',
        overpaySuggestion,
        riskLabel: highCost ? 'High cost' : annualRate >= 8 ? 'Moderate' : 'Manageable'
    };
}

async function refreshMarketDataForInvestments() {
    if (!Array.isArray(state.investments)) return [];

    const updated = [];
    for (const asset of state.investments) {
        const ticker = String(asset.ticker || '').toUpperCase();
        try {
            let currentPrice = Number(asset.currentPrice || asset.buyPrice || 0);

            if (ticker.includes('GOLD')) {
                currentPrice = await getGoldSpotPricePerGram();
            } else if (ticker.includes('ETF') || ticker.includes('NIFTY') || ticker.includes('SENSEX')) {
                currentPrice = Math.max(currentPrice, Number(asset.buyPrice || 0) * 0.98);
            }

            asset.currentPrice = Math.round(currentPrice);
            asset.priceSource = ticker.includes('GOLD') ? 'Gold spot feed' : 'Market model';
            asset.priceUpdatedAt = new Date().toISOString();
            updated.push(asset);
        } catch (error) {
            console.warn('Price refresh failed', error);
        }
    }

    if (typeof saveState === 'function') saveState();
    return updated;
}
