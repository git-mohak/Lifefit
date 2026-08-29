let propertiesData = [];

// DOM Elements
const propertyListEl = document.getElementById('property-list');
const inputs = {
    budget: document.getElementById('budget'),
    office: document.getElementById('office'),
    school: document.getElementById('school'),
    commute: document.getElementById('commute'),
    schools: document.getElementById('schools'),
    healthcare: document.getElementById('healthcare'),
    convenience: document.getElementById('convenience'),
    cost: document.getElementById('cost')
};

// Initialize
function init() {
    try {
        // Attach event listeners
        Object.values(inputs).forEach(input => {
            input.addEventListener('input', updateUI);
        });

        // Initial render
        updateUI();
    } catch (error) {
        propertyListEl.innerHTML = `<p style="color:red">Failed to load properties: ${error.message}</p>`;
    }
}

// Parse lat, lon from string "lat, lon"
function parseLocation(locStr) {
    if (!locStr) return { lat: null, lon: null };
    const parts = locStr.split(',').map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lon: parts[1] };
    }
    return { lat: null, lon: null };
}

// Format currency
function formatRent(rent) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(rent);
}

// Main update cycle
function updateUI() {
    // Update slider value displays
    ['commute', 'schools', 'healthcare', 'convenience', 'cost'].forEach(id => {
        document.getElementById(`val-${id}`).textContent = inputs[id].value;
    });

    const officeLoc = parseLocation(inputs.office.value);
    const schoolLoc = parseLocation(inputs.school.value);

    const preferences = {
        officeLat: officeLoc.lat,
        officeLon: officeLoc.lon,
        schoolLat: schoolLoc.lat,
        schoolLon: schoolLoc.lon,
        budget: parseFloat(inputs.budget.value) || 0,
        weights: {
            commute: parseInt(inputs.commute.value),
            schools: parseInt(inputs.schools.value),
            healthcare: parseInt(inputs.healthcare.value),
            convenience: parseInt(inputs.convenience.value),
            cost: parseInt(inputs.cost.value)
        }
    };

    const rankedProperties = scoreProperties(propertiesData, preferences);
    renderProperties(rankedProperties, preferences);
}

// Generate explanation sentence
function generateExplanation(current, next, officeLat, officeLon) {
    if (!next) return "The baseline property for your current preferences.";

    let explanations = [];
    
    const rentDiff = current.rent - next.rent;
    if (rentDiff > 0) {
        explanations.push(`Costs ${formatRent(rentDiff)}/month more than ${next.name}`);
    } else if (rentDiff < 0) {
        explanations.push(`Saves ${formatRent(Math.abs(rentDiff))}/month compared to ${next.name}`);
    }

    if (officeLat && officeLon) {
        const currentDist = calculateDistance(current.latitude, current.longitude, officeLat, officeLon);
        const nextDist = calculateDistance(next.latitude, next.longitude, officeLat, officeLon);
        
        // At 15 km/h, time = distance / 15 hours = distance * 4 minutes
        const currentMins = Math.round(currentDist * 4);
        const nextMins = Math.round(nextDist * 4);
        
        const timeDiff = currentMins - nextMins;
        
        if (timeDiff < 0) {
            explanations.push(`saves ${Math.abs(timeDiff)} minutes of daily travel (one-way)`);
        } else if (timeDiff > 0) {
            explanations.push(`adds ${timeDiff} minutes to daily travel (one-way)`);
        }
    }
    
    if (explanations.length === 0) {
        return `Slightly better overall match for your preferences than ${next.name}.`;
    }

    return explanations.join(' but ') + '.';
}

// Generate breakdown line
function generateBreakdown(p, preferences) {
    const strengths = [];
    const weaknesses = [];
    
    // Very simplified logic to determine strengths/weaknesses for the breakdown
    if (preferences.weights.commute > 5 && p.distance_office < 5) strengths.push('commute');
    else if (preferences.weights.commute > 5 && p.distance_office > 10) weaknesses.push('commute');
    
    if (preferences.weights.schools > 5 && p.distance_school < 2) strengths.push('schools');
    else if (preferences.weights.schools > 5 && p.distance_school > 4) weaknesses.push('schools');
    
    if (preferences.weights.cost > 5 && p.rent <= preferences.budget) strengths.push('cost');
    else if (preferences.weights.cost > 5 && p.rent > preferences.budget) weaknesses.push('cost');

    if (strengths.length === 0 && weaknesses.length === 0) return "Balanced across your priorities";
    
    let parts = [];
    if (strengths.length > 0) parts.push(`Strong on ${strengths.join(' and ')}`);
    if (weaknesses.length > 0) parts.push(`weak on ${weaknesses.join(' and ')}`);
    
    let res = parts.join(', ');
    return res.charAt(0).toUpperCase() + res.slice(1);
}

// Render to DOM
function renderProperties(properties, preferences) {
    const summaryLine = document.getElementById('summary-line');
    
    // Top priorities
    const weights = preferences.weights;
    const sortedPriorities = Object.keys(weights)
        .sort((a, b) => weights[b] - weights[a])
        .filter(k => weights[k] > 5);
        
    let priorityText = sortedPriorities.length > 0 
        ? `prioritising ${sortedPriorities.slice(0, 2).join(' and ')}` 
        : 'with balanced priorities';
        
    summaryLine.textContent = `Ranked for a family ${priorityText} on a ${formatRent(preferences.budget)} budget.`;

    propertyListEl.innerHTML = '';
    
    properties.forEach((p, index) => {
        const nextProp = properties[index + 1];
        const explanation = generateExplanation(p, nextProp, preferences.officeLat, preferences.officeLon);
        const breakdown = generateBreakdown(p, preferences);
        
        // Calculate budget diff
        const budgetDiff = p.rent - preferences.budget;
        let diffHtml = '';
        if (budgetDiff > 0) {
            diffHtml = `<span class="rent-diff over">+${formatRent(budgetDiff)} over budget</span>`;
        } else if (budgetDiff < 0) {
            diffHtml = `<span class="rent-diff under">${formatRent(Math.abs(budgetDiff))} under budget</span>`;
        } else {
            diffHtml = `<span class="rent-diff match">On budget</span>`;
        }
        
        const html = `
            <div class="property-card" style="animation: slideIn 0.3s ease-out forwards; animation-delay: ${index * 0.05}s; opacity: 0; transform: translateY(20px);">
                <div class="rank-number">${index + 1}</div>
                <div class="property-content">
                    <div class="property-header">
                        <div class="property-title-group">
                            <div class="property-name">${p.name}</div>
                            <div class="property-area">${p.area} • ${p.bedrooms} BHK</div>
                        </div>
                        <div class="score-container">
                            <div class="property-score">${p.score}/100</div>
                            <div class="score-bar-bg">
                                <div class="score-bar-fill" style="width: ${p.score}%"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="property-details">
                        <span>💰 ${formatRent(p.rent)}/mo</span>
                        ${diffHtml}
                    </div>
                    
                    <div class="breakdown-line">${breakdown}</div>
                    
                    <div class="property-explanation">
                        ${explanation}
                    </div>
                </div>
            </div>
        `;
        propertyListEl.insertAdjacentHTML('beforeend', html);
    });
}

// Start app
init();