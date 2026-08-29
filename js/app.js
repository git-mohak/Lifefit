// State and wiring


const defaultState = {
    household: [
        { name: "Mohak", role: "adult", destinationName: "Koramangala Office", lat: 12.9345, lon: 77.6265, daysPerWeek: 5, mode: "car" },
        { name: "Priya", role: "adult", destinationName: "Whitefield Office", lat: 12.9698, lon: 77.7500, daysPerWeek: 4, mode: "car" },
        { name: "Aarav", role: "child", destinationName: "HSR Layout School", lat: 12.9116, lon: 77.6389, daysPerWeek: 5, mode: "car" }
    ],
    budget: 60000,
    timeValue: 950,
    weights: { commute: 8, schools: 6, healthcare: 4, convenience: 5, cost: 7 },
    compareQueue: [],
    places: []
};

function normalizeState(raw) {
    if (!raw || typeof raw !== "object") return JSON.parse(JSON.stringify(defaultState));
    
    let res = { compareQueue: Array.isArray(raw.compareQueue) ? raw.compareQueue : [], places: [] };
    
    res.budget = Number(raw.budget);
    if (isNaN(res.budget) || res.budget < 0) res.budget = defaultState.budget;
    
    res.timeValue = Number(raw.timeValue);
    if (isNaN(res.timeValue) || res.timeValue < 0) res.timeValue = defaultState.timeValue;
    
    res.weights = {};
    const wRaw = raw.weights || {};
    ["commute", "schools", "healthcare", "convenience", "cost"].forEach(k => {
        let v = Number(wRaw[k]);
        if (isNaN(v) || v < 0 || v > 10) v = defaultState.weights[k];
        res.weights[k] = v;
    });
    
    if (Array.isArray(raw.places)) res.places = raw.places;
    
    res.household = [];
    let hRaw = Array.isArray(raw.household) ? raw.household : [];
    
    let adultCount = 1, childCount = 1;
    hRaw.forEach(m => {
        if (!m || !m.lat || !m.lon) return;
        
        let days = Number(m.daysPerWeek);
        if (isNaN(days) || days < 1) days = 5;
        if (days > 7) days = 7;
        
        let mode = m.mode;
        if (mode !== "car" && mode !== "transit" && mode !== "walk") mode = "car";
        
        let role = m.role === "child" ? "child" : "adult";
        let name = m.name;
        if (!name || name.trim() === "") name = role === "adult" ? "Adult " + adultCount++ : "Child " + childCount++;
        
        res.household.push({
            name, role,
            destinationName: m.destinationName || "Destination",
            lat: Number(m.lat),
            lon: Number(m.lon),
            daysPerWeek: days,
            mode
        });
    });
    
    if (res.household.length === 0) res.household = JSON.parse(JSON.stringify(defaultState.household));
    
    return res;
}

let state = JSON.parse(JSON.stringify(defaultState));


function updateState(partial) {
    let newState = { ...state, ...partial };
    if (partial.weights) newState.weights = { ...state.weights, ...partial.weights };
    state = normalizeState(newState);
    try { localStorage.setItem("lifefit_state", JSON.stringify(state)); } catch(e) {}
    updateApp();
}

// Exposed for the inline onclick in render.js
window.removeMember = function(index) {
    const newHousehold = [...state.household];
    newHousehold.splice(index, 1);
    updateState({ household: newHousehold });
};

window.toggleCompare = function(id) {
    let q = [...state.compareQueue];
    if (q.includes(id)) {
        q = q.filter(x => x !== id);
    } else {
        q.push(id);
        if (q.length > 2) q.shift();
    }
    updateState({ compareQueue: q });
};

window.closeCompare = function() {
    updateState({ compareQueue: [] });
};

let mapUpdateTimeout;

function updateApp() {
    renderLeftRail(state, updateState);
    const { scored, normalizeContext } = scoreProperties(PROPERTIES, state);
    renderRightPanel(scored, state, window.toggleCompare, window.closeCompare);
    
    // Debounce map update
    clearTimeout(mapUpdateTimeout);
    mapUpdateTimeout = setTimeout(() => {
        if (window.updateMap) {
            window.updateMap(scored, state, normalizeContext);
        }
    }, 300);
}

// Initialise once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    try {
        const stored = localStorage.getItem("lifefit_state");
        if (stored) state = normalizeState(JSON.parse(stored));
    } catch(e) {}
    
    if (typeof initWizard === "function") initWizard();
    updateApp();
});

window.normalizeState = normalizeState;
