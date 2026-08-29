// All DOM, no math

function renderLeftRail(state, onStateChange) {
    const rail = document.getElementById('left-rail');
    
    // Render household members
    let membersHtml = state.household.map((m, i) => `
        <div class="member-card">
            <div class="member-header">
                <strong>${m.name}</strong> (${m.role})
                <button onclick="window.removeMember(${i})">X</button>
            </div>
            <div>Dest: ${m.destinationName}</div>
            <div>${m.daysPerWeek} days/wk via ${m.mode}</div>
        </div>
    `).join('');

    rail.innerHTML = `
        <h1>Life-Fit</h1>
        
        <div class="section">
            <h3>Household</h3>
            ${membersHtml}
        </div>
        
        <div class="section">
            <h3>Budget</h3>
            <label>Monthly Budget (₹)
                <input type="number" id="budget-input" value="${state.budget}" step="5000">
            </label>
        </div>
        
        <div class="section">
            <h3>Priorities</h3>
            ${renderSlider('commute', 'Commute', state.weights.commute)}
            ${renderSlider('schools', 'Schools', state.weights.schools)}
            ${renderSlider('healthcare', 'Healthcare', state.weights.healthcare)}
            ${renderSlider('convenience', 'Convenience', state.weights.convenience)}
            ${renderSlider('cost', 'Cost', state.weights.cost)}
        </div>
    `;

    // Attach listeners
    document.getElementById('budget-input').addEventListener('input', (e) => {
        onStateChange({ budget: parseInt(e.target.value) || 0 });
    });
    
    ['commute', 'schools', 'healthcare', 'convenience', 'cost'].forEach(id => {
        document.getElementById(`slider-${id}`).addEventListener('input', (e) => {
            const newWeights = { ...state.weights };
            newWeights[id] = parseInt(e.target.value);
            onStateChange({ weights: newWeights });
        });
    });
}

function renderSlider(id, label, value) {
    return `
        <div class="slider-group">
            <div class="slider-header">
                <span>${label}</span>
                <span>${value}</span>
            </div>
            <input type="range" id="slider-${id}" min="0" max="10" value="${value}">
        </div>
    `;
}

function formatRent(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function renderRightPanel(scoredProperties, budget) {
    const list = document.getElementById('property-list');
    list.innerHTML = '';
    
    scoredProperties.forEach((p, index) => {
        const costDiff = p.totalMonthlyCost - budget;
        let costLabel = costDiff > 0 ? `+${formatRent(costDiff)} over` : `${formatRent(Math.abs(costDiff))} under`;
        
        const commuteBreaks = p.memberBreakdown.map(m => `${m.name}: ${m.oneWayMin}m`).join(' • ');

        const card = document.createElement('div');
        card.className = 'property-card';
        card.style.animationDelay = `${index * 0.05}s`;
        
        card.innerHTML = `
            <div class="rank-number">${index + 1}</div>
            <div class="property-content">
                <div class="property-header">
                    <div class="title-group">
                        <div class="property-name">${p.name}</div>
                        <div class="property-area">${p.area} • ${p.bedrooms} BHK • ${p.sqft} sqft</div>
                    </div>
                    <div class="score-container">
                        <div class="property-score">${p.lifeFitScore}/100</div>
                        <div class="score-bar-bg">
                            <div class="score-bar-fill" style="width: ${p.lifeFitScore}%"></div>
                        </div>
                    </div>
                </div>
                
                <div class="property-details">
                    <span>🏠 Rent: ${formatRent(p.monthlyRent)}/mo</span>
                    <span>💰 Total: ${formatRent(p.totalMonthlyCost)}/mo (${costLabel})</span>
                </div>
                <div class="property-details">
                    <span>⏱️ HH Travel: ${p.totalWeeklyHours.toFixed(1)} hrs/week</span>
                    <span style="color:#666; font-size:0.85rem">(${commuteBreaks})</span>
                </div>
                
                <div class="factor-summary">${p.factorSummary}</div>
            </div>
        `;
        list.appendChild(card);
    });
}
