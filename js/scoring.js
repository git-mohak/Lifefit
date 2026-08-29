// All math, no DOM

// Haversine formula for distance in km, adjusted for road circuity
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c * 1.4; // Apply 1.4 circuity factor
}

// Speeds in km/h
const SPEEDS = {
    car: 15,
    transit: 12,
    walk: 4.5
};

// Costs per km in INR
const COSTS = {
    car: 8,
    transit: 3,
    walk: 0
};

// Find nearest amenity distance
function nearestDistanceKm(lat, lon, category) {
    const amenities = AMENITIES.filter(a => a.category === category);
    if (amenities.length === 0) return 999;
    
    let minD = Infinity;
    for (let i = 0; i < amenities.length; i++) {
        const d = haversine(lat, lon, amenities[i].lat, amenities[i].lon);
        if (d < minD) minD = d;
    }
    return minD;
}

// Score properties based on state
function scoreProperties(properties, state) {
    if (properties.length === 0) return [];
    
    // 1. Calculate raw metrics
    const scored = properties.map(p => {
        let totalWeeklyHours = 0;
        let totalMonthlyCommuteCost = 0;
        let memberBreakdown = [];
        
        state.household.forEach(m => {
            if (!m.lat || !m.lon) return;
            const distKm = haversine(p.lat, p.lon, m.lat, m.lon);
            const speed = SPEEDS[m.mode] || SPEEDS.car;
            let oneWayMin = (distKm / speed) * 60;
            if (oneWayMin < 8) oneWayMin = 8; // min 8 min commute
            
            const weeklyHours = (oneWayMin * 2 * m.daysPerWeek) / 60;
            
            totalWeeklyHours += weeklyHours;
            
            // Assume 4.33 weeks per month for cost calculation
            // If min time applies, we don't necessarily scale km cost to min time, but we should use real distance
            const monthlyKm = distKm * 2 * m.daysPerWeek * 4.33;
            const costPerKm = COSTS[m.mode] || COSTS.car;
            totalMonthlyCommuteCost += (monthlyKm * costPerKm);
            
            memberBreakdown.push({
                name: m.name,
                oneWayMin: Math.round(oneWayMin),
                mode: m.mode
            });
        });
        
        const totalMonthlyCost = p.monthlyRent + totalMonthlyCommuteCost;
        
        // Amenities
        // For schools, we just use the nearest distance for now, although rating could be factored in if we find nearest per rating
        const nearestSchoolDist = nearestDistanceKm(p.lat, p.lon, "school");
        const nearestHospitalDist = nearestDistanceKm(p.lat, p.lon, "hospital");
        const nearestGroceryDist = nearestDistanceKm(p.lat, p.lon, "grocery");
        const nearestMetroDist = nearestDistanceKm(p.lat, p.lon, "metro");
        
        return {
            ...p,
            totalWeeklyHours,
            totalMonthlyCost,
            memberBreakdown,
            nearestSchoolDist,
            nearestHospitalDist,
            nearestGroceryDist,
            nearestMetroDist,
            // Intermediate raw values for min-max scaling
            raw: {
                commute: -totalWeeklyHours, // negative so higher is better
                school: -nearestSchoolDist, // negative so higher is better
                health: -nearestHospitalDist, // negative so higher is better
                convenience: -(nearestGroceryDist + nearestMetroDist)/2, // negative so higher is better
                cost: -Math.abs(totalMonthlyCost - state.budget) // negative distance to budget so higher is better (closer to budget)
            }
        };
    });
    
    // 2. Find min/max for normalisation
    const mins = { commute: Infinity, school: Infinity, health: Infinity, convenience: Infinity, cost: Infinity };
    const maxs = { commute: -Infinity, school: -Infinity, health: -Infinity, convenience: -Infinity, cost: -Infinity };
    
    scored.forEach(p => {
        ['commute', 'school', 'health', 'convenience', 'cost'].forEach(k => {
            if (p.raw[k] < mins[k]) mins[k] = p.raw[k];
            if (p.raw[k] > maxs[k]) maxs[k] = p.raw[k];
        });
    });
    
    // Normalize weights
    let totalWeight = state.weights.commute + state.weights.schools + state.weights.healthcare + state.weights.convenience + state.weights.cost;
    if (totalWeight === 0) totalWeight = 1; // Prevent div by 0
    
    const nWeights = {
        commute: state.weights.commute / totalWeight,
        school: state.weights.schools / totalWeight,
        health: state.weights.healthcare / totalWeight,
        convenience: state.weights.convenience / totalWeight,
        cost: state.weights.cost / totalWeight
    };

    // 3. Calculate 0-100 sub-scores and final weighted score
    scored.forEach(p => {
        p.scores = {};
        let finalScore = 0;
        
        ['commute', 'school', 'health', 'convenience', 'cost'].forEach(k => {
            const range = maxs[k] - mins[k];
            let nScore = 0;
            if (range === 0) {
                nScore = 100;
            } else {
                nScore = ((p.raw[k] - mins[k]) / range) * 100;
            }
            p.scores[k] = Math.round(nScore);
            finalScore += nScore * nWeights[k];
        });
        
        p.lifeFitScore = Math.round(finalScore);
        
        // Figure out strongest/weakest factors uniquely
        // Convert to array of {key, score, label}
        const labels = {
            commute: "commute times",
            school: "school access",
            health: "healthcare access",
            convenience: "daily convenience",
            cost: "cost fit"
        };
        
        let factors = ['commute', 'school', 'health', 'convenience', 'cost'].map(k => ({
            key: k,
            score: p.scores[k],
            label: labels[k]
        }));
        
        // Add random jitter if scores are exactly equal so we get unique strings
        // (Just for ties, to ensure unique "strong on X, weak on Y" across similar properties)
        factors.forEach((f, i) => f.score += (Math.random() * 0.1));
        
        factors.sort((a, b) => b.score - a.score);
        
        const strongest = factors[0];
        const weakest = factors[4];
        
        if (strongest.score - weakest.score < 20) {
            p.factorSummary = "Balanced across your priorities";
        } else {
            p.factorSummary = `Strong on ${strongest.label}, weak on ${weakest.label}`;
        }
    });
    
    // Sort descending by score
    scored.sort((a, b) => b.lifeFitScore - a.lifeFitScore);
    
    // Dominance detection
    scored.forEach(p => {
        p.dominatedBy = null;
        for (let other of scored) {
            if (other.id === p.id) continue;
            // Dominated if another property is strictly better (or equal and better) on both metrics
            // We use < for cost/hours (lower is better).
            // A property is strictly better if it's <= on both and < on at least one.
            if (other.totalMonthlyCost <= p.totalMonthlyCost && other.totalWeeklyHours <= p.totalWeeklyHours) {
                if (other.totalMonthlyCost < p.totalMonthlyCost || other.totalWeeklyHours < p.totalWeeklyHours) {
                    p.dominatedBy = other.name;
                    break;
                }
            }
        }
    });
    
    return scored;
}
