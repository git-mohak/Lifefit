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
    
    res.scenarioActive = !!raw.scenarioActive;
    res.scenarioBannerText = raw.scenarioBannerText || null;
    res.originalPriya = raw.originalPriya || null;

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

window.toggleScenario = function() {
    if (!state.scenarioActive) {
        // Compute before state (Whitefield)
        const currentHousehold = state.household;
        const priyaIndex = currentHousehold.findIndex(m => m.name === "Priya");
        
        let newHousehold = JSON.parse(JSON.stringify(currentHousehold));
        if (priyaIndex !== -1) {
            // Current before scores
            const { scored: beforeScored } = scoreProperties(PROPERTIES, state);
            const beforeTop = beforeScored[0];
            
            // Mutate Priya in newHousehold
            newHousehold[priyaIndex].destinationName = "Electronic City";
            newHousehold[priyaIndex].lat = 12.8452;
            newHousehold[priyaIndex].lon = 77.6602;
            
            // Compute after scores with temporary state
            const tempAfterState = { ...state, household: newHousehold };
            const { scored: afterScored } = scoreProperties(PROPERTIES, tempAfterState);
            const afterTop = afterScored[0];
            
            const beforeHours = beforeTop.totalWeeklyHours.toFixed(1);
            const afterHours = afterTop.totalWeeklyHours.toFixed(1);
            
            let bannerText = `Priya's office moved to Electronic City. Household travel went from ${beforeHours} to ${afterHours} hours a week.`;
            if (beforeTop.name === afterTop.name) {
                bannerText += ` Your top-ranked home remained ${beforeTop.name}.`;
            } else {
                bannerText += ` Your top-ranked home changed from ${beforeTop.name} to ${afterTop.name}.`;
            }
            
            state.scenarioActive = true;
            state.scenarioBannerText = bannerText;
            state.originalPriya = currentHousehold[priyaIndex];
            updateState({ household: newHousehold });
        }
    } else {
        // Restore original Priya location
        let newHousehold = JSON.parse(JSON.stringify(state.household));
        const priyaIndex = newHousehold.findIndex(m => m.name === "Priya");
        if (priyaIndex !== -1 && state.originalPriya) {
            newHousehold[priyaIndex] = JSON.parse(JSON.stringify(state.originalPriya));
        } else if (priyaIndex !== -1) {
            newHousehold[priyaIndex].destinationName = "Whitefield Office";
            newHousehold[priyaIndex].lat = 12.9698;
            newHousehold[priyaIndex].lon = 77.7500;
        }
        
        state.scenarioActive = false;
        state.scenarioBannerText = null;
        state.originalPriya = null;
        updateState({ household: newHousehold });
    }
};

let mapUpdateTimeout;
let mapInitialized = false;

function updateApp() {
    renderLeftRail(state, updateState);
    const { scored, normalizeContext } = scoreProperties(PROPERTIES, state);
    renderRightPanel(scored, state, window.toggleCompare, window.closeCompare);
    
    // Debounce map update
    clearTimeout(mapUpdateTimeout);
    mapUpdateTimeout = setTimeout(() => {
        if (!mapInitialized && window.initMap) {
            window.initMap();
            mapInitialized = true;
        }
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
