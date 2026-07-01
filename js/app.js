function initializeApp() {
    populateDropdowns();
    loadState();
    initializeChartsLazy();

    const budgetInput = document.getElementById('budgetInput');
    if (budgetInput) budgetInput.value = state.budget || '';

    applyTheme();
    renderAll();
    updateAuthStatus();
    refreshPricesAndRender();

    registerPWA();
    detectSpendingAnomalies();
}

function initializeChartsLazy() {
    const bootCharts = () => {
        if (typeof initializeCharts !== 'function') return;
        if (!window.Chart || window.__chartsBooted) return;
        window.__chartsBooted = true;
        initializeCharts();
        renderAll();
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(bootCharts, { timeout: 1400 });
    } else {
        setTimeout(bootCharts, 350);
    }

    // Ensure charts become available quickly when user switches to data-heavy views.
    document.addEventListener('click', (event) => {
        const btn = event.target.closest('[onclick*="switchView"]');
        if (!btn) return;
        bootCharts();
    }, { passive: true });
}

function populateDropdowns() {
    const categories = ['Food', 'Rent', 'Travel', 'Shopping', 'Utilities', 'Groceries', 'Transport', 'Entertainment', 'Healthcare', 'Education', 'Debt', 'Insurance', 'Subscriptions', 'Gifts', 'Maintenance', 'Others'];
    const optionsHTML = categories.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    document.querySelectorAll('#transactionCategory, #category').forEach(select => { if (select) select.innerHTML = optionsHTML; });
}

function setupAssetFieldVisibility() {
    const movableCategory = document.getElementById('movableCategory');
    if (!movableCategory) return;

    const goldGrams = document.getElementById('movableGoldGrams');
    const movableValue = document.getElementById('movableValue');
    const movableAge = document.getElementById('movableAge');
    const movableMileage = document.getElementById('movableMileage');
    const movableCondition = document.getElementById('movableCondition');
    const movableHint = document.getElementById('movableAssetHint');

    const syncFields = () => {
        const isGold = movableCategory.value === 'Gold';
        const isVehicle = movableCategory.value === 'Vehicle';

        if (goldGrams) goldGrams.style.display = isGold ? 'block' : 'none';
        if (movableValue) {
            movableValue.style.display = isGold ? 'none' : 'block';
            movableValue.placeholder = isVehicle ? 'Base Price / Market Value (₹)' : 'Current Value (₹)';
        }
        if (movableAge) movableAge.style.display = isVehicle ? 'block' : 'none';
        if (movableMileage) movableMileage.style.display = isVehicle ? 'block' : 'none';
        if (movableCondition) movableCondition.style.display = isVehicle ? 'block' : 'none';
        if (movableHint) {
            movableHint.innerText = isGold
                ? 'Enter gold in grams. We will derive the value from current spot price.'
                : isVehicle
                    ? 'Enter vehicle age, mileage, and condition for a current market estimate.'
                    : 'Enter a manual value for this asset.';
        }
    };

    movableCategory.addEventListener('change', syncFields);
    syncFields();
}

function setupSupabaseBridge() {
    const dataSource = getDataSource();
    if (dataSource !== 'supabase') return;
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) return;
    setTimeout(() => loadStateFromCloud && loadStateFromCloud(), 0);
}

function updateAuthStatus() {
    const statusText = document.getElementById('authStatusText');
    const authActionBtn = document.getElementById('authActionBtn');
    const session = typeof getSupabaseSession === 'function' ? getSupabaseSession() : null;
    const dataSource = typeof getDataSource === 'function' ? getDataSource() : 'local';

    if (!statusText || !authActionBtn) return;

    if (session?.user?.email) {
        statusText.innerText = `Cloud: ${session.user.email}`;
        authActionBtn.innerText = 'Sign Out';
        authActionBtn.onclick = handleSupabaseSignOut;
    } else if (dataSource === 'supabase') {
        statusText.innerText = 'Cloud ready';
        authActionBtn.innerText = 'Sign In';
        authActionBtn.onclick = openAuthModal;
    } else {
        statusText.innerText = 'Local mode';
        authActionBtn.innerText = 'Sign In';
        authActionBtn.onclick = openAuthModal;
    }
}

function openAuthModal() {
    const panel = document.getElementById('authOverlay');
    if (!panel) return;
    panel.style.display = 'flex';
}

function closeAuthModal() {
    const panel = document.getElementById('authOverlay');
    if (!panel) return;
    panel.style.display = 'none';
}

async function handleSupabaseSignIn() {
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value || '';
    const message = document.getElementById('authMessage');

    if (!email || !password) {
        if (message) message.innerText = 'Enter your email and password.';
        return;
    }

    try {
        const session = await signInWithSupabase(email, password);
        if (message) message.innerText = session?.user?.email ? `Signed in as ${session.user.email}` : 'Signed in successfully.';
        closeAuthModal();
        updateAuthStatus();
        setupSupabaseBridge();
        if (typeof refreshPricesAndRender === 'function') await refreshPricesAndRender();
        renderAll();
    } catch (error) {
        if (message) message.innerText = error.message || 'Sign in failed.';
    }
}

async function handleSupabaseSignUp() {
    const email = document.getElementById('authEmail')?.value?.trim();
    const password = document.getElementById('authPassword')?.value || '';
    const message = document.getElementById('authMessage');

    if (!email || !password) {
        if (message) message.innerText = 'Enter your email and password.';
        return;
    }

    try {
        await signUpWithSupabase(email, password);
        if (message) message.innerText = 'Account created. Please sign in to continue.';
    } catch (error) {
        if (message) message.innerText = error.message || 'Sign up failed.';
    }
}

function handleSupabaseSignOut() {
    if (typeof signOutSupabase === 'function') signOutSupabase();
    updateAuthStatus();
    renderAll();
}

async function refreshPricesAndRender() {
    if (typeof refreshMarketDataForInvestments === 'function') {
        await refreshMarketDataForInvestments();
    }
    renderInvestments();
}

function renderAll() {
    updateDashboardCards(); renderTransactions(); renderGoals(); renderInvestments(); renderSubscriptions(); renderExpenseBreakdown();
    if (summaryChart) updateSummaryChart();
    if (expenseChart) updateExpenseChart();
    if (forecastChart) updateForecastChart();
    if (budgetChart) updateBudgetChart();
    if (networthChart) updateNetWorthChart();
}

function updateDashboardCards() {
    const totalIncome = getCalculatedIncome(); 
    const totalExpense = getTotalExpense(); 
    const savings = totalIncome - totalExpense;
    
    state.income = totalIncome;
    
    const incEl = document.getElementById('incomeValue'); 
    const expEl = document.getElementById('expenseValue'); 
    const savEl = document.getElementById('savingsValue');
    
    // Use the new UI animation function
    if (incEl) animateValue(incEl, totalIncome);
    if (expEl) animateValue(expEl, totalExpense);
    if (savEl) animateValue(savEl, savings);
    
    updateInsights(totalIncome, savings); 
    updateBudgetWarning(totalExpense); 
    updateSavingsGoal(totalIncome, savings); 
    updateFinancialHealthScore(totalIncome, totalExpense, savings);
}

function updateInsights(income, savings) {
    const el = document.getElementById('insightText'); if (!el) return;
    if (income <= 0) return el.innerText = 'Add income and expenses to unlock AI insights.';
    if (savings < 0) return el.innerText = '🚨 Critical Warning: You are spending more than you earn. Review your transaction history immediately.';
    if (state.budget > 0 && getTotalExpense() > state.budget) return el.innerText = '⚠️ Budget breached. Reduce discretionary spending to recover your savings rate.';
    el.innerText = 'Your cashflow is healthy. Consider routing excess savings into the Investment Portfolio view.';
}

function updateBudgetWarning(totalExpense) {
    const el = document.getElementById('budgetWarning'); if (!el) return;
    if (state.budget <= 0) {
        if (state.income > 0) {
            const spendRatio = (totalExpense / state.income) * 100;
            el.innerText = `Budget not set. Current spend ratio: ${spendRatio.toFixed(1)}% of income.`;
        } else {
            el.innerText = 'Set a monthly budget to unlock tracking.';
        }
        el.style.color = 'var(--text-muted)';
        return;
    }

    const utilization = (totalExpense / state.budget) * 100;
    if (utilization > 100) {
        el.innerText = `⚠️ Over budget by ₹${(totalExpense - state.budget).toLocaleString()} (${utilization.toFixed(1)}% used)`;
        el.style.color = 'var(--danger)';
    } else if (utilization >= 85) {
        el.innerText = `⚠️ Near budget limit: ${utilization.toFixed(1)}% used`;
        el.style.color = 'var(--warning)';
    } else {
        el.innerText = `Healthy budget usage: ${utilization.toFixed(1)}% used`;
        el.style.color = 'var(--success)';
    }
}

function updateSavingsGoal(income, savings) {
    const fill = document.getElementById('savingsGoalProgress'); const text = document.getElementById('savingsGoalText'); if (!fill || !text) return;
    if (income <= 0) { fill.style.width = '0%'; text.innerText = 'Pending income data...'; return; }
    const ratio = (savings / income) * 100;
    const progress = Math.max(0, (ratio / SAVINGS_GOAL_RATIO) * 100);
    const visualProgress = Math.min(progress, 100);

    fill.style.width = `${visualProgress}%`;
    if (progress >= 100) {
        text.innerText = `Status: ${progress.toFixed(1)}% of target achieved (${ratio.toFixed(1)}% saved).`;
    } else {
        text.innerText = `Status: ${progress.toFixed(1)}% to target (${ratio.toFixed(1)}% saved).`;
    }
}

function updateFinancialHealthScore(income, totalExpense, savings) {
    const valEl = document.getElementById('healthScoreValue'); const ringEl = document.getElementById('healthRing'); const labelEl = document.getElementById('healthScoreLabel');
    if (!valEl || !ringEl || !labelEl) return;
    if (income <= 0) {
        valEl.innerText = '0';
        ringEl.style.setProperty('--score-angle', '0deg');
        labelEl.innerText = 'Add income data to calculate health score.';
        return;
    }

    const savingsRatio = savings / income; // negative to positive
    const budgetAdherence = state.budget > 0
        ? 1 - (Math.max(0, totalExpense - state.budget) / state.budget)
        : 1 - (totalExpense / Math.max(income, 1));
    const spendingPressure = totalExpense / income;

    let score = 50;
    score += Math.max(-1, Math.min(1, savingsRatio)) * 35;
    score += Math.max(0, Math.min(1, budgetAdherence)) * 25;
    score += (1 - Math.min(1.5, spendingPressure)) * 20;

    score = Math.round(Math.max(0, Math.min(100, score)));
    valEl.innerText = score;
    ringEl.style.setProperty('--score-angle', `${(score / 100) * 360}deg`);

    if (score >= 80) labelEl.innerText = 'Excellent financial health.';
    else if (score >= 60) labelEl.innerText = 'Good progress, keep consistency.';
    else if (score >= 40) labelEl.innerText = 'Moderate health, optimize spending.';
    else labelEl.innerText = 'High risk zone, corrective action needed.';
}

function renderExpenseBreakdown() {
    const container = document.getElementById('expenseBreakdown'); if (!container) return;
    const map = getExpensesByCategory(); const total = getTotalExpense();
    if (total <= 0) return container.innerHTML = '<p class="empty-state">Add expenses to see breakdown.</p>';
    container.innerHTML = Object.entries(map).map(([cat, amt]) => `<div class="breakdown-row"><span class="breakdown-label">${cat}</span><div class="breakdown-track"><div class="breakdown-fill" style="width: ${((amt / total) * 100).toFixed(1)}%"></div></div><span class="breakdown-value">${((amt / total) * 100).toFixed(1)}%</span></div>`).join('');
}

function resetDashboard() {
    if (!confirm(`This will clear ${state.transactions.length} transactions and all data. Continue?`)) return;
    state = getDefaultState(); state.theme = document.body.classList.contains('dark') ? 'dark' : 'light';
    saveState(); renderAll();
}

function monthlyReset() {
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1);
    const removable = state.transactions.filter(t => new Date(t.date) <= monthAgo);
    if (removable.length === 0) return alert('No transactions older than 30 days to clear.');
    if (!confirm(`Clear ${removable.length} transaction(s) older than 30 days?`)) return;
    state.transactions = state.transactions.filter(t => new Date(t.date) > monthAgo); state.lastReset = new Date().toISOString();
    saveState(); renderAll();
}

function registerPWA() {
    if (!('serviceWorker' in navigator)) return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .catch((err) => console.log('SW registration failed:', err));
    });
}

// Boot Sequence
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    document.getElementById('searchTransactions')?.addEventListener('input', renderTransactions);
    document.getElementById('filterCategory')?.addEventListener('change', renderTransactions);
    document.getElementById('transactionTypeFilter')?.addEventListener('change', renderTransactions);
    document.getElementById('transactionSortBy')?.addEventListener('change', renderTransactions);
    document.getElementById('transactionSortDirection')?.addEventListener('change', renderTransactions);
    document.getElementById('transactionGroupBy')?.addEventListener('change', renderTransactions);
    setupAssetFieldVisibility();
    setupSupabaseBridge();
    updateAuthStatus();
    refreshPricesAndRender();
    init3DInteractions();
    initHeaderOnScroll();
    initButtonRipples();
    initCardShortcuts();
    initFloatingInsight();
    
});
