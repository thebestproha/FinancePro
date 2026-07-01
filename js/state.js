const STORAGE_KEY = 'personal_finance_dashboard_state';
const SAVINGS_GOAL_RATIO = 30;

const DATA_SOURCE_KEY = 'financeproDataSource';
const DEFAULT_DATA_SOURCE = 'local';
const SUPABASE_URL_KEY = 'financeproSupabaseUrl';
const SUPABASE_ANON_KEY = 'financeproSupabaseAnonKey';
const SUPABASE_SESSION_KEY = 'financeproSupabaseSession';
const DEFAULT_SUPABASE_URL = 'https://acfecydsjxbctldchvlc.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZmVjeWRzanhiY3RsZGNodmxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MDUyMjUsImV4cCI6MjA5ODQ4MTIyNX0.VNPWBj1anT9tttz0RV88fmZfCnuIQqFHXLAkgGIgeZ8';
const FINANCE_PROFILE_TABLE = 'finance_profiles';

function getSupabaseConfig() {
    const existingUrl = localStorage.getItem(SUPABASE_URL_KEY);
    const existingAnonKey = localStorage.getItem(SUPABASE_ANON_KEY);

    if (!existingUrl) localStorage.setItem(SUPABASE_URL_KEY, DEFAULT_SUPABASE_URL);
    if (!existingAnonKey) localStorage.setItem(SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);

    return {
        url: localStorage.getItem(SUPABASE_URL_KEY) || DEFAULT_SUPABASE_URL,
        anonKey: localStorage.getItem(SUPABASE_ANON_KEY) || DEFAULT_SUPABASE_ANON_KEY
    };
}

function getDataSource() {
    const savedSource = localStorage.getItem(DATA_SOURCE_KEY);
    if (savedSource === 'supabase') return 'supabase';
    if (savedSource === 'local') return 'local';

    const { url, anonKey } = getSupabaseConfig();
    return url && anonKey ? 'supabase' : DEFAULT_DATA_SOURCE;
}

function setDataSource(source) {
    localStorage.setItem(DATA_SOURCE_KEY, source === 'supabase' ? 'supabase' : 'local');
}

function setSupabaseConfig(config = {}) {
    if (config.url) localStorage.setItem(SUPABASE_URL_KEY, config.url);
    if (config.anonKey) localStorage.setItem(SUPABASE_ANON_KEY, config.anonKey);
}

function getSupabaseSession() {
    try {
        const raw = localStorage.getItem(SUPABASE_SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (error) {
        console.error('Failed to read Supabase session', error);
        return null;
    }
}

function setSupabaseSession(session) {
    if (!session) {
        localStorage.removeItem(SUPABASE_SESSION_KEY);
        return;
    }
    localStorage.setItem(SUPABASE_SESSION_KEY, JSON.stringify(session));
}

function getSupabaseAccessToken() {
    const session = getSupabaseSession();
    return session?.access_token || '';
}

function applySupabaseHashSession() {
    if (!window.location.hash) return false;

    const fragment = window.location.hash.replace(/^#/, '');
    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    const expiresAt = params.get('expires_at');
    const tokenType = params.get('token_type') || 'bearer';

    if (!accessToken) return false;

    const session = {
        access_token: accessToken,
        refresh_token: refreshToken || '',
        expires_at: expiresAt ? Number(expiresAt) : null,
        token_type: tokenType,
        user: {
            email: params.get('email') || ''
        }
    };

    setSupabaseSession(session);
    setDataSource('supabase');
    window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    return true;
}

async function supabaseAuthRequest(path, method, body) {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) throw new Error('Supabase not configured');

    const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'apikey': anonKey,
            'Authorization': `Bearer ${anonKey}`
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data?.msg || data?.error_description || data?.message || 'Supabase auth request failed');
    }

    return data;
}

async function signInWithSupabase(email, password) {
    const data = await supabaseAuthRequest('token?grant_type=password', 'POST', { email, password });
    setSupabaseSession(data);
    setDataSource('supabase');
    return data;
}

async function signUpWithSupabase(email, password) {
    const data = await supabaseAuthRequest('signup', 'POST', { email, password });
    return data;
}

function signOutSupabase() {
    setSupabaseSession(null);
    setDataSource('local');
}

async function syncStateToCloud() {
    if (getDataSource() !== 'supabase') return false;
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) return false;
    const accessToken = getSupabaseAccessToken();
    if (!accessToken) return false;

    const payload = {
        profile_name: 'Main Profile',
        state: normalizeImportedState(state),
        updatedAt: new Date().toISOString()
    };

    try {
        const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${FINANCE_PROFILE_TABLE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': anonKey,
                'Authorization': `Bearer ${accessToken}`,
                'Prefer': 'resolution=merge-duplicates,return=minimal',
                'Content-Profile': 'public',
                'Prefer-Profile': 'public'
            },
            body: JSON.stringify(payload)
        });

        return response.ok;
    } catch (error) {
        console.error('Cloud sync failed', error);
        return false;
    }
}

async function loadStateFromCloud() {
    if (getDataSource() !== 'supabase') return false;
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) return false;
    const accessToken = getSupabaseAccessToken();
    if (!accessToken) return false;

    try {
        const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${FINANCE_PROFILE_TABLE}?select=state,updated_at&order=updated_at.desc&limit=1`, {
            headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) return false;
        const rows = await response.json();
        const record = rows && rows[0];
        if (!record || !record.state) return false;

        state = normalizeImportedState ? normalizeImportedState(record.state) : { ...getDefaultState(), ...record.state };
        return true;
    } catch (error) {
        console.error('Cloud load failed', error);
        return false;
    }
}

function getDefaultState() {
    return {
        income: 0, budget: 0, expenseEntries: [], transactions: [],
        netWorthHistory: [], goals: [], categoryBudgets: {},
        theme: 'light', lastReset: null, recurring: [], investments: [], subscriptions: []
    };
}

let state = getDefaultState();

function loadState() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) state = { ...getDefaultState(), ...JSON.parse(raw) };
    } catch (error) {
        console.error("State load failed", error);
        state = getDefaultState();
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (getDataSource() === 'supabase') {
        syncStateToCloud();
    }
}

function setInlineError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) el.textContent = message || '';
}

function getTotalExpense() {
    return state.transactions.filter(t => t.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getCalculatedIncome() {
    return state.transactions.filter(t => t.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0);
}

function getTransactions() {
    return state.transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function getSortedTransactions(options = {}) {
    const {
        sortBy = 'date',
        sortDirection = 'desc',
        typeFilter = '',
        groupBy = ''
    } = options;

    const normalizedDirection = sortDirection === 'asc' ? 1 : -1;

    const filtered = (state.transactions || []).filter((transaction) => {
        if (typeFilter && transaction.type !== typeFilter) return false;
        return true;
    });

    const sorted = [...filtered].sort((left, right) => {
        if (sortBy === 'amount') {
            return (Number(left.amount || 0) - Number(right.amount || 0)) * normalizedDirection;
        }

        if (sortBy === 'type') {
            return String(left.type || '').localeCompare(String(right.type || '')) * normalizedDirection;
        }

        if (sortBy === 'category') {
            return String(left.category || '').localeCompare(String(right.category || '')) * normalizedDirection;
        }

        if (sortBy === 'account') {
            return String(left.accountId || '').localeCompare(String(right.accountId || '')) * normalizedDirection;
        }

        return (new Date(left.date).getTime() - new Date(right.date).getTime()) * normalizedDirection;
    });

    if (!groupBy) return sorted;

    return sorted.reduce((groups, transaction) => {
        let groupKey = 'Other';
        if (groupBy === 'type') groupKey = transaction.type || 'Other';
        else if (groupBy === 'day') groupKey = transaction.date || 'Unknown';
        else if (groupBy === 'month') groupKey = transaction.date ? transaction.date.slice(0, 7) : 'Unknown';
        else if (groupBy === 'account') groupKey = transaction.accountId || 'Unlinked';

        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(transaction);
        return groups;
    }, {});
}

function normalizeImportedState(payload) {
    const safe = (payload && typeof payload === 'object') ? payload : {};
    return {
        ...getDefaultState(),
        ...safe,
        budget: Number(safe.budget || 0),
        income: Number(safe.income || 0),
        transactions: Array.isArray(safe.transactions) ? safe.transactions : [],
        goals: Array.isArray(safe.goals) ? safe.goals : [],
        investments: Array.isArray(safe.investments) ? safe.investments : [],
        subscriptions: Array.isArray(safe.subscriptions) ? safe.subscriptions : [],
        netWorthHistory: Array.isArray(safe.netWorthHistory) ? safe.netWorthHistory : [],
        recurring: Array.isArray(safe.recurring) ? safe.recurring : [],
        expenseEntries: Array.isArray(safe.expenseEntries) ? safe.expenseEntries : [],
        accounts: Array.isArray(safe.accounts) ? safe.accounts : [],
        customAssets: Array.isArray(safe.customAssets) ? safe.customAssets : [],
        customLoans: Array.isArray(safe.customLoans) ? safe.customLoans : [],
        categoryBudgets: (safe.categoryBudgets && typeof safe.categoryBudgets === 'object') ? safe.categoryBudgets : {},
        theme: safe.theme === 'dark' ? 'dark' : 'light'
    };
}

function getExpensesByCategory() {
    return state.transactions.filter(t => t.type === 'expense').reduce((map, item) => {
        map[item.category] = (map[item.category] || 0) + Number(item.amount || 0);
        return map;
    }, {});
}

function detectSpendingAnomalies() {
    const expenses = state.transactions.filter(t => t.type === 'expense');
    if (expenses.length < 5) return;

    const amounts = expenses.map(e => e.amount);
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    const anomalies = expenses.filter(e => e.amount > mean + (2 * stdDev));

    if (anomalies.length > 0) {
        const insightText = document.getElementById('insightText');
        if (insightText && !insightText.innerText.includes('Anomaly')) {
            insightText.innerText += `\n\nSystem Alert: Detected an unusually high transaction of ₹${anomalies[0].amount.toLocaleString()} in ${anomalies[0].category}. Review to ensure this aligns with your goals.`;
        }
    }
}
