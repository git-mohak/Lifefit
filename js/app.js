// State and wiring

let state = {
    household: [
        { name: "Mohak", role: "adult", destinationName: "Koramangala Office", lat: 12.9345, lon: 77.6265, daysPerWeek: 5, mode: "car" },
        { name: "Priya", role: "adult", destinationName: "Whitefield Office", lat: 12.9698, lon: 77.7500, daysPerWeek: 4, mode: "car" },
        { name: "Aarav", role: "child", destinationName: "HSR Layout School", lat: 12.9116, lon: 77.6389, daysPerWeek: 5, mode: "car" }
    ],
    budget: 60000,
    timeValue: 950,
    weights: {
        commute: 8,
        schools: 6,
        healthcare: 4,
        convenience: 5,
        cost: 7
    },
    compareQueue: []
};

function updateState(partial) {
    state = { ...state, ...partial };
    
    // Specifically handle nested weights
    if (partial.weights) {
        state.weights = { ...state.weights, ...partial.weights };
    }
    
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

function updateApp() {
    renderLeftRail(state, updateState);
    const scoredProperties = scoreProperties(PROPERTIES, state);
    renderRightPanel(scoredProperties, state, window.toggleCompare, window.closeCompare);
}

// Initialise
updateApp();
