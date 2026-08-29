// All DOM, no math

function renderLeftRail(state, onStateChange) {
    try {
        const rail = document.getElementById('left-rail');
        if (!rail) return;
        
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
                <h3>Places that matter</h3>
                <p style="font-size: 0.85rem; color: #666; margin-bottom: 0.5rem;">Add locations you visit regularly. The map will score how easy it is to reach all of them.</p>
                <button onclick="alert('Not implemented in this stage')" style="padding: 0.4rem 0.8rem; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer;">+ Add Location</button>
            </div>
            
            <div class="section">
                <h3>Time Value</h3>
                <label>What is an hour of your household's time worth? (₹/hr)
                    <input type="number" id="time-value-input" value="${state.timeValue}" step="50">
                </label>
                <small style="color: #666; font-size: 0.85rem; display: block; margin-top: 0.25rem;">A Rs 18 lakh salary works out to roughly Rs 950 an hour.</small>
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
        document.getElementById('time-value-input').addEventListener('input', (e) => {
            onStateChange({ timeValue: parseInt(e.target.value) || 0 });
        });
        
        ['commute', 'schools', 'healthcare', 'convenience', 'cost'].forEach(id => {
            document.getElementById(`slider-${id}`).addEventListener('input', (e) => {
                const newWeights = { ...state.weights };
                newWeights[id] = parseInt(e.target.value);
                onStateChange({ weights: newWeights });
            });
        });
    } catch (e) {
        console.error('renderLeftRail error:', e);
    }
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

function renderRightPanel(scoredProperties, state, toggleCompare, closeCompare) {
    try {
        const list = document.getElementById('property-list');
        if (!list) return;
        list.innerHTML = '';
        
        // Dominance summary
        const dominatedCount = scoredProperties.filter(p => p.dominatedBy).length;
        if (dominatedCount > 0) {
            const sumDiv = document.createElement('div');
            sumDiv.className = 'summary-line';
            sumDiv.textContent = `${dominatedCount} of ${scoredProperties.length} options are strictly worse than at least one alternative on all five factors.`;
            list.appendChild(sumDiv);
        }
        
        scoredProperties.forEach((p, index) => {
            const costDiff = p.totalMonthlyCost - state.budget;
            let costLabel = costDiff > 0 ? `+${formatRent(costDiff)} over` : `${formatRent(Math.abs(costDiff))} under`;
            
            const commuteBreaks = p.memberBreakdown.map(m => `${m.name}: ${m.oneWayMin}m`).join(' • ');

            let dominanceTag = p.dominatedBy ? `<span class="tag dominated" title="Dominated by ${p.dominatedBy}">Dominated</span>` : '';
            
            let tradeoffHtml = '';
            if (index < scoredProperties.length - 1) {
                const next = scoredProperties[index + 1];
                const deltaCost = p.totalMonthlyCost - next.totalMonthlyCost;
                const deltaHours = (next.totalWeeklyHours - p.totalWeeklyHours) * 4.33;
                
                if (deltaCost > 0 && deltaHours > 0) {
                    const impliedRate = deltaCost / deltaHours;
                    const verdict = impliedRate <= state.timeValue ? "Worth it" : "Hard to justify";
                    const vClass = impliedRate <= state.timeValue ? "worth-it" : "hard-to-justify";
                    tradeoffHtml = `
                        <div class="tradeoff-box">
                            <p>Costs <strong>${formatRent(deltaCost)}/month</strong> more than ${next.name} but recovers <strong>${deltaHours.toFixed(1)} hours</strong> a month of household travel. That works out to <strong>${formatRent(impliedRate)} per hour</strong> of family time, compared to your stated value of ${formatRent(state.timeValue)}/hr.</p>
                            <div class="verdict ${vClass}">${verdict}</div>
                        </div>
                    `;
                } else if (deltaCost < 0 && deltaHours > 0) {
                    tradeoffHtml = `
                        <div class="tradeoff-box free-win">
                            <p>Strictly better than ${next.name}. Cheaper by ${formatRent(Math.abs(deltaCost))} a month and saves ${deltaHours.toFixed(1)} hours.</p>
                            <div class="verdict worth-it">Free win</div>
                        </div>
                    `;
                } else if (deltaCost > 0 && deltaHours < 0) {
                    let bestAdv = { diff: 0, label: '' };
                    const labels = { commute: 'commute times', school: 'school access', health: 'healthcare access', convenience: 'daily convenience' };
                    ['commute', 'school', 'health', 'convenience'].forEach(k => {
                        const diff = p.scores[k] - next.scores[k];
                        if (diff > bestAdv.diff) { bestAdv = { diff, label: labels[k] }; }
                    });
                    
                    let reasonTxt = bestAdv.diff > 0 
                        ? 'because it is <strong>' + Math.round(bestAdv.diff) + ' points stronger</strong> on ' + bestAdv.label
                        : 'due to better overall balance';
                        
                    tradeoffHtml = `
                        <div class="tradeoff-box warning">
                            <p>Ranks above ${next.name} despite costing <strong>${formatRent(deltaCost)}/month more</strong> and adding <strong>${Math.abs(deltaHours).toFixed(1)} hours</strong> of travel, ${reasonTxt}.</p>
                        </div>
                    `;
                }
            }

            const isComparing = state.compareQueue && state.compareQueue.includes(p.id);

            const card = document.createElement('div');
            card.className = 'property-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            card.innerHTML = `
                <div class="rank-number">${index + 1}</div>
                <div class="property-content">
                    <div class="property-header">
                        <div class="title-group">
                            <div class="property-name">${p.name} ${dominanceTag}</div>
                            <div class="property-area">${p.area} • ${p.bedrooms} BHK • ${p.sqft} sqft</div>
                        </div>
                        <div class="score-group">
                            <button class="btn-compare ${isComparing ? 'active' : ''}" onclick="window.toggleCompare(${p.id})">${isComparing ? 'Selected' : 'Compare'}</button>
                            <div class="score-container">
                                <div class="property-score">${p.lifeFitScore}/100</div>
                                <div class="score-bar-bg">
                                    <div class="score-bar-fill" style="width: ${p.lifeFitScore}%"></div>
                                </div>
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
                    ${tradeoffHtml}
                </div>
            `;
            list.appendChild(card);
        });
    } catch (e) {
        console.error('renderRightPanel error:', e);
    }
    
    // Efficient Frontier Chart
    try {
        renderChart(scoredProperties);
    } catch (e) {
        console.error('renderChart error:', e);
    }
    
    // Compare modal
    try {
        if (state.compareQueue && state.compareQueue.length === 2) {
            const p1 = scoredProperties.find(p => p.id === state.compareQueue[0]);
            const p2 = scoredProperties.find(p => p.id === state.compareQueue[1]);
            if (p1 && p2) renderCompareModal(p1, p2, state.timeValue);
        } else {
            const existing = document.getElementById('compare-modal');
            if (existing) existing.remove();
        }
    } catch (e) {
        console.error('compareModal error:', e);
    }
}

function renderChart(properties) {
    const svg = document.getElementById('frontier-chart');
    if (!svg) return;
    
    // Clear previous
    svg.innerHTML = '';
    
    const width = svg.clientWidth || 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 40, left: 60 };
    
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    
    // X axis: hours, Y axis: cost
    const maxHours = Math.max(...properties.map(p => p.totalWeeklyHours)) * 1.1;
    const maxCost = Math.max(...properties.map(p => p.totalMonthlyCost)) * 1.1;
    
    const scaleX = (val) => padding.left + (val / maxHours) * innerWidth;
    const scaleY = (val) => height - padding.bottom - (val / maxCost) * innerHeight;
    
    // Calculate 2D frontier (cost vs hours) for the chart
    let frontierPoints = [];
    properties.forEach(p => {
        let dominated2D = false;
        for (let other of properties) {
            if (other.id === p.id) continue;
            if (other.totalMonthlyCost <= p.totalMonthlyCost && other.totalWeeklyHours <= p.totalWeeklyHours) {
                if (other.totalMonthlyCost < p.totalMonthlyCost || other.totalWeeklyHours < p.totalWeeklyHours) {
                    dominated2D = true;
                    break;
                }
            }
        }
        if (!dominated2D) frontierPoints.push(p);
    });
    
    // Sort frontier by hours (left to right)
    frontierPoints.sort((a, b) => a.totalWeeklyHours - b.totalWeeklyHours);
    
    // Draw axes
    const axesHtml = `
        <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#ccc" />
        <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#ccc" />
        <text x="${width / 2}" y="${height - 5}" text-anchor="middle" font-size="12" fill="#666">Household Travel (hrs/wk)</text>
        <text x="${padding.left - 45}" y="${height / 2}" transform="rotate(-90, ${padding.left - 45}, ${height / 2})" text-anchor="middle" font-size="12" fill="#666">Monthly Cost (₹)</text>
    `;
    svg.insertAdjacentHTML('beforeend', axesHtml);
    
    // Draw frontier line
    if (frontierPoints.length > 1) {
        let pathD = `M ${scaleX(frontierPoints[0].totalWeeklyHours)} ${scaleY(frontierPoints[0].totalMonthlyCost)}`;
        for (let i = 1; i < frontierPoints.length; i++) {
            pathD += ` L ${scaleX(frontierPoints[i].totalWeeklyHours)} ${scaleY(frontierPoints[i].totalMonthlyCost)}`;
        }
        svg.insertAdjacentHTML('beforeend', `<path d="${pathD}" fill="none" stroke="#3b82f6" stroke-width="2" />`);
    }
    
    // Draw dots
    const tooltip = document.getElementById('chart-tooltip');
    const topRankedId = properties[0].id;
    
    properties.forEach(p => {
        const cx = scaleX(p.totalWeeklyHours);
        const cy = scaleY(p.totalMonthlyCost);
        const isFrontier = frontierPoints.includes(p);
        const isTop = p.id === topRankedId;
        
        const r = isFrontier ? 6 : 4;
        const fill = isFrontier ? "#3b82f6" : "#cbd5e1";
        
        let ringHtml = '';
        if (isTop) {
            ringHtml = `<circle cx="${cx}" cy="${cy}" r="10" fill="none" stroke="#eab308" stroke-width="3" />
                        <text x="${cx}" y="${cy - 15}" text-anchor="middle" font-weight="bold" font-size="12" fill="#eab308">#1 Ranked</text>`;
        }
        
        const circleHtml = `
            ${ringHtml}
            <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" style="cursor:pointer"
                onmouseover="showTooltip(event, '${p.name}', '${p.area}', ${p.totalMonthlyCost}, ${p.totalWeeklyHours.toFixed(1)})"
                onmouseout="hideTooltip()" />
        `;
        svg.insertAdjacentHTML('beforeend', circleHtml);
    });
}

window.showTooltip = function(e, name, area, cost, hours) {
    const tooltip = document.getElementById('chart-tooltip');
    if (!tooltip) return;
    tooltip.innerHTML = `<strong>${name}</strong><br>${area}<br>₹${cost}/mo<br>${hours} hrs/wk`;
    tooltip.style.display = 'block';
    tooltip.style.left = (e.pageX + 15) + 'px';
    tooltip.style.top = (e.pageY - 15) + 'px';
};

window.hideTooltip = function() {
    const tooltip = document.getElementById('chart-tooltip');
    if (tooltip) tooltip.style.display = 'none';
};

function renderCompareModal(p1, p2, timeValue) {
    let modal = document.getElementById('compare-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'compare-modal';
        modal.className = 'compare-modal';
        document.body.appendChild(modal);
    }

    const deltaCost = p1.totalMonthlyCost - p2.totalMonthlyCost;
    const deltaHours = (p2.totalWeeklyHours - p1.totalWeeklyHours) * 4.33;
    
    let verdictHtml = '';
    if (deltaCost > 0 && deltaHours > 0) {
        const impliedRate = deltaCost / deltaHours;
        const vClass = impliedRate <= timeValue ? "worth-it" : "hard-to-justify";
        verdictHtml = `<div class="verdict ${vClass}">Implied rate: ${formatRent(impliedRate)}/hr</div>`;
    } else if (deltaCost < 0 && deltaHours > 0) {
        verdictHtml = `<div class="verdict worth-it">Free win for ${p1.name}</div>`;
    } else if (deltaCost > 0 && deltaHours < 0) {
        verdictHtml = `<div class="verdict hard-to-justify">Worse on both metrics</div>`;
    }

    modal.innerHTML = `
        <div class="compare-content">
            <button class="close-btn" onclick="window.closeCompare()">X</button>
            <h2>Comparison</h2>
            <div class="compare-grid">
                <div class="compare-col">
                    <h3>${p1.name}</h3>
                    <p>${formatRent(p1.totalMonthlyCost)}/mo</p>
                    <p>${p1.totalWeeklyHours.toFixed(1)} hrs/wk</p>
                    <div style="font-size:0.85rem; margin-top:0.5rem; color:#666;">
                        ${p1.memberBreakdown.map(m => `<div>${m.name}: ${m.oneWayMin}m</div>`).join('')}
                    </div>
                </div>
                <div class="compare-col vs-col">
                    <div>VS</div>
                    ${verdictHtml}
                </div>
                <div class="compare-col">
                    <h3>${p2.name}</h3>
                    <p>${formatRent(p2.totalMonthlyCost)}/mo</p>
                    <p>${p2.totalWeeklyHours.toFixed(1)} hrs/wk</p>
                    <div style="font-size:0.85rem; margin-top:0.5rem; color:#666;">
                        ${p2.memberBreakdown.map(m => `<div>${m.name}: ${m.oneWayMin}m</div>`).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}
