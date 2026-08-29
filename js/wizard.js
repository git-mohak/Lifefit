let wizardState = {
    step: 1,
    city: 'Bengaluru',
    adults: [{ name: '' }],
    children: []
};

function initWizard() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('wizard') === 'true') {
        document.getElementById('wizard-overlay').style.display = 'flex';
        renderWizardStep();
    } else {
        document.getElementById('wizard-overlay').style.display = 'none';
    }
}

function renderWizardStep() {
    const container = document.getElementById('wizard-step-container');
    let html = '<div class="wizard-step-ind">Step ' + wizardState.step + ' of 6</div>';
    
    if (wizardState.step === 1) {
        html += '<h2 class="wizard-title">Which city?</h2>';
        html += '<div class="wizard-why">Locality data differs by city. We start where ours is deepest.</div>';
        html += '<div class="city-card active"><span class="city-name">Bengaluru</span></div>';
        ['Mumbai', 'Delhi NCR', 'Hyderabad', 'Pune'].forEach(city => {
            html += '<div class="city-card disabled"><span class="city-name">' + city + '</span><span class="coming-soon">Coming Soon</span></div>';
        });
    } else if (wizardState.step === 2) {
        html += '<h2 class="wizard-title">Who is moving?</h2>';
        html += '<div class="wizard-why">Each person adds a destination. A home that works for one adult often fails the whole household.</div>';
        
        html += '<h3>Adults</h3>';
        wizardState.adults.forEach((a, i) => {
            html += '<div class="person-row"><input type="text" placeholder="Optional - we don\\'t need it" value="' + a.name + '" onchange="updateWizPerson(\\'adults\\', ' + i + ', this.value)"><button class="btn-remove" onclick="removeWizPerson(\\'adults\\', ' + i + ')">&times;</button></div>';
        });
        html += '<button class="btn-add" onclick="addWizPerson(\\'adults\\')">+ Add Adult</button>';
        
        html += '<h3 style="margin-top: 2rem;">Children</h3>';
        wizardState.children.forEach((c, i) => {
            html += '<div class="person-row"><input type="text" placeholder="Optional - we don\\'t need it" value="' + c.name + '" onchange="updateWizPerson(\\'children\\', ' + i + ', this.value)"><button class="btn-remove" onclick="removeWizPerson(\\'children\\', ' + i + ')">&times;</button></div>';
        });
        html += '<button class="btn-add" onclick="addWizPerson(\\'children\\')">+ Add Child</button>';
    } else if (wizardState.step === 3) {
        html += '<h2 class="wizard-title">Where does everyone go each day?</h2>';
        html += '<div class="wizard-why">This is the single biggest driver of how your week actually feels.</div>';
        
        const areas = ['Whitefield', 'Koramangala', 'Indiranagar', 'HSR Layout', 'Marathahalli', 'Sarjapur Road', 'Hebbal', 'Jayanagar', 'Electronic City', 'Yelahanka', 'Bellandur', 'Rajajinagar', 'MG Road', 'Bommanahalli', 'Hoskote'];
        
        const defaultAdults = ['Mohak', 'Akshita'];
        const defaultKids = ['Aarav', 'Ira', 'Vihaan'];
        wizardState.adults.forEach((a, i) => { if (!a.name) a.name = defaultAdults[i] || 'Adult ' + (i+1); });
        wizardState.children.forEach((c, i) => { if (!c.name) c.name = defaultKids[i] || 'Child ' + (i+1); });
        
        wizardState.adults.forEach((a, i) => {
            html += '<div class="loc-row"><span class="loc-label">' + a.name + ' (Office)</span><div class="loc-controls">';
            html += '<div><span class="wiz-label">Area</span><select onchange="updateWizLoc(\\'adults\\', ' + i + ', \\'area\\', this.value)"><option value="">Select area...</option>';
            areas.forEach(area => { html += '<option value="' + area + '" ' + (a.area === area ? 'selected' : '') + '>' + area + '</option>'; });
            html += '</select></div>';
            html += '<div><span class="wiz-label">Days/week</span><input type="number" min="1" max="7" value="' + (a.days || 5) + '" onchange="updateWizLoc(\\'adults\\', ' + i + ', \\'days\\', this.value)"></div>';
            html += '<div><span class="wiz-label">Mode</span><select onchange="updateWizLoc(\\'adults\\', ' + i + ', \\'mode\\', this.value)"><option value="car" ' + (a.mode === 'car' ? 'selected' : '') + '>Car</option><option value="transit" ' + (a.mode === 'transit' ? 'selected' : '') + '>Transit</option><option value="walk" ' + (a.mode === 'walk' ? 'selected' : '') + '>Walk</option></select></div>';
            html += '</div></div>';
        });
        
        wizardState.children.forEach((c, i) => {
            html += '<div class="loc-row"><span class="loc-label">' + c.name + ' (School)</span><div class="loc-controls">';
            html += '<div><span class="wiz-label">Area</span><select onchange="updateWizLoc(\\'children\\', ' + i + ', \\'area\\', this.value)"><option value="">Select area...</option>';
            areas.forEach(area => { html += '<option value="' + area + '" ' + (c.area === area ? 'selected' : '') + '>' + area + '</option>'; });
            html += '</select></div>';
            html += '<div><span class="wiz-label">Days/week</span><input type="number" min="1" max="7" value="' + (c.days || 5) + '" onchange="updateWizLoc(\\'children\\', ' + i + ', \\'days\\', this.value)"></div>';
            html += '<div><span class="wiz-label">Mode</span><select onchange="updateWizLoc(\\'children\\', ' + i + ', \\'mode\\', this.value)"><option value="car" ' + (c.mode === 'car' ? 'selected' : '') + '>Car</option><option value="transit" ' + (c.mode === 'transit' ? 'selected' : '') + '>Transit</option><option value="walk" ' + (c.mode === 'walk' ? 'selected' : '') + '>Walk</option></select></div>';
            html += '</div></div>';
        });
    }
    
    html += '<div class="wizard-footer">';
    if (wizardState.step > 1) {
        html += '<button class="btn-wiz btn-wiz-secondary" onclick="prevWizStep()">Back</button>';
    } else {
        html += '<div></div>';
    }
    
    if (wizardState.step === 3) {
        html += '<button class="btn-wiz btn-wiz-primary" onclick="finishWizard(false)">View Dashboard</button>';
    } else {
        html += '<button class="btn-wiz btn-wiz-primary" onclick="nextWizStep()">Continue</button>';
    }
    html += '</div>';
    
    container.innerHTML = html;
}

window.nextWizStep = function() {
    wizardState.step++;
    renderWizardStep();
};

window.prevWizStep = function() {
    wizardState.step--;
    renderWizardStep();
};

window.addWizPerson = function(group) {
    wizardState[group].push({ name: '' });
    renderWizardStep();
};

window.removeWizPerson = function(group, idx) {
    wizardState[group].splice(idx, 1);
    renderWizardStep();
};

window.updateWizPerson = function(group, idx, val) {
    wizardState[group][idx].name = val;
};

window.updateWizLoc = function(group, idx, field, val) {
    wizardState[group][idx][field] = val;
};

window.finishWizard = function(isSkip) {
    const overlay = document.getElementById('wizard-overlay');
    overlay.classList.add('closing');
    
    if (!isSkip) {
        const areaCoords = {
            'Whitefield': { lat: 12.9698, lon: 77.7500 },
            'Koramangala': { lat: 12.9345, lon: 77.6265 },
            'Indiranagar': { lat: 12.9784, lon: 77.6408 },
            'HSR Layout': { lat: 12.9141, lon: 77.6411 },
            'Marathahalli': { lat: 12.9569, lon: 77.7011 },
            'Sarjapur Road': { lat: 12.9165, lon: 77.6698 },
            'Hebbal': { lat: 13.0498, lon: 77.5891 },
            'Jayanagar': { lat: 12.9298, lon: 77.5801 },
            'Electronic City': { lat: 12.8364, lon: 77.6599 },
            'Yelahanka': { lat: 13.1098, lon: 77.5855 },
            'Bellandur': { lat: 12.9192, lon: 77.6833 },
            'Rajajinagar': { lat: 12.9982, lon: 77.5530 },
            'MG Road': { lat: 12.9716, lon: 77.6013 },
            'Bommanahalli': { lat: 12.9056, lon: 77.6254 },
            'Hoskote': { lat: 13.0714, lon: 77.7981 }
        };
        
        let newHousehold = [];
        
        wizardState.adults.forEach(a => {
            let coords = areaCoords[a.area] || areaCoords['Koramangala'];
            newHousehold.push({
                name: a.name,
                role: 'adult',
                destinationName: (a.area || 'Koramangala') + ' Office',
                lat: coords.lat,
                lon: coords.lon,
                daysPerWeek: parseInt(a.days) || 5,
                mode: a.mode || 'car'
            });
        });
        
        wizardState.children.forEach(c => {
            let coords = areaCoords[c.area] || areaCoords['HSR Layout'];
            newHousehold.push({
                name: c.name,
                role: 'child',
                destinationName: (c.area || 'HSR Layout') + ' School',
                lat: coords.lat,
                lon: coords.lon,
                daysPerWeek: parseInt(c.days) || 5,
                mode: c.mode || 'car'
            });
        });
        
        if (newHousehold.length > 0) {
            updateState({ household: newHousehold });
        }
    }
    
    setTimeout(() => {
        overlay.style.display = 'none';
        overlay.classList.remove('closing');
    }, 400);
};
