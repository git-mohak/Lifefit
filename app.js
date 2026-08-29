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
async function init() {
    try {
        const response = await fetch('properties.json');
        propertiesData = await response.json();
        
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

// Render to DOM
function renderProperties(properties, preferences) {
    propertyListEl.innerHTML = '';
    
    properties.forEach((p, index) => {
        const nextProp = properties[index + 1];
        const explanation = generateExplanation(p, nextProp, preferences.officeLat, preferences.officeLon);
        
        const html = `
            <div class="property-card">
                <div class="property-header">
                    <div class="property-name">
                        <span class="rank-badge">${index + 1}</span>
                        ${p.name}
                    </div>
                    <div class="property-score">${p.score}/100</div>
                </div>
                <div class="property-details">
                    <span>📍 ${p.area}</span>
                    <span>💰 ${formatRent(p.rent)}/mo</span>
                    <span>🛏️ ${p.bedrooms} BHK</span>
                </div>
                <div class="property-explanation">
                    ${explanation}
                </div>
            </div>
        `;
        propertyListEl.insertAdjacentHTML('beforeend', html);
    });
}

// Start app
init();