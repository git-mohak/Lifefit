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

// Find nearest amenity 
function nearestAmenity(lat, lon, category) {
    const amenities = AMENITIES.filter(a => a.category === category);
    if (amenities.length === 0) return null;
    
    let minD = Infinity;
    let nearest = null;
    for (let i = 0; i < amenities.length; i++) {
        const d = haversine(lat, lon, amenities[i].lat, amenities[i].lon);
        if (d < minD) {
            minD = d;
            nearest = { ...amenities[i], distanceKm: d };
        }
    }
    return nearest;
}

function nearestDistanceKm(lat, lon, category) {
    const a = nearestAmenity(lat, lon, category);
    return a ? a.distanceKm : 999;
}

// Estimate rent for an arbitrary point using IDW (Inverse Distance Weighting) of 5 nearest known properties
function estimateRent(lat, lon) {
    // Sort all properties by distance
    const dists = PROPERTIES.map(p => ({
        p,
        d: haversine(lat, lon, p.lat, p.lon)
    })).sort((a, b) => a.d - b.d).slice(0, 5);
    
    // Rent per sqft
    let num = 0;
    let den = 0;
    for (let item of dists) {
        // prevent div by zero if exactly on top
        const w = 1 / (Math.pow(Math.max(item.d, 0.001), 2));
        const rentPerSqft = item.p.monthlyRent / item.p.sqft;
        num += rentPerSqft * w;
        den += w;
    }
    const avgRentPerSqft = num / den;
    return Math.round(avgRentPerSqft * 1500); // Assume 1500 sqft
}

// Extract base location scoring logic
function scoreLocation(lat, lon, monthlyRent, state, normalizeContext = null) {
    let totalWeeklyHours = 0;
    let totalMonthlyCommuteCost = 0;
    let memberBreakdown = [];
    
    state.household.forEach(m => {
        if (!m.lat || !m.lon) return;
        const distKm = haversine(lat, lon, m.lat, m.lon);
        const speed = SPEEDS[m.mode] || SPEEDS.car;
        let oneWayMin = (distKm / speed) * 60;
        if (oneWayMin < 8) oneWayMin = 8; // min 8 min commute
        
        const weeklyHours = (oneWayMin * 2 * m.daysPerWeek) / 60;
        
        totalWeeklyHours += weeklyHours;
        
        const monthlyKm = distKm * 2 * m.daysPerWeek * 4.33;
        const costPerKm = COSTS[m.mode] || COSTS.car;
        totalMonthlyCommuteCost += (monthlyKm * costPerKm);
        
        memberBreakdown.push({
            name: m.name,
            oneWayMin: Math.round(oneWayMin),
            mode: m.mode,
            distKm: distKm.toFixed(1),
            lat: m.lat,
            lon: m.lon
        });
    });
    
    const totalMonthlyCost = monthlyRent + totalMonthlyCommuteCost;
    
    const nearestSchool = nearestAmenity(lat, lon, "school");
    const nearestHospital = nearestAmenity(lat, lon, "hospital");
    const nearestGrocery = nearestAmenity(lat, lon, "grocery");
    const nearestMetro = nearestAmenity(lat, lon, "metro");
    
    const res = {
        lat, lon, monthlyRent,
        totalWeeklyHours,
        totalMonthlyCost,
        memberBreakdown,
        nearestSchool,
        nearestHospital,
        nearestGrocery,
        nearestMetro,
        raw: {
            commute: -totalWeeklyHours,
            school: -(nearestSchool ? nearestSchool.distanceKm : 999),
            health: -(nearestHospital ? nearestHospital.distanceKm : 999),
            convenience: -(((nearestGrocery ? nearestGrocery.distanceKm : 999) + (nearestMetro ? nearestMetro.distanceKm : 999))/2),
            cost: -Math.abs(totalMonthlyCost - state.budget)
        }
    };
    
    // If context is provided, calculate the normalized scores
    if (normalizeContext) {
        const { mins, maxs, nWeights } = normalizeContext;
        res.scores = {};
        let finalScore = 0;
        
        ['commute', 'school', 'health', 'convenience', 'cost'].forEach(k => {
            const range = maxs[k] - mins[k];
            let nScore = 0;
            if (range === 0) {
                nScore = 100;
            } else {
                // Clamp the raw value to the known mins/maxs context before scoring so it stays 0-100
                const clampedRaw = Math.max(mins[k], Math.min(maxs[k], res.raw[k]));
                nScore = ((clampedRaw - mins[k]) / range) * 100;
            }
            res.scores[k] = Math.round(nScore);
            finalScore += nScore * nWeights[k];
        });
        
        res.lifeFitScore = Math.round(finalScore);
        
        const labels = { commute: "commute times", school: "school access", health: "healthcare access", convenience: "daily convenience", cost: "cost fit" };
        let factors = ['commute', 'school', 'health', 'convenience', 'cost'].map(k => ({ key: k, score: res.scores[k], label: labels[k] }));
        factors.forEach(f => f.score += (Math.random() * 0.1));
        factors.sort((a, b) => b.score - a.score);
        
        const strongest = factors[0];
        const weakest = factors[4];
        if (strongest.score - weakest.score < 20) {
            res.factorSummary = "Strong across the board, with balanced trade-offs.";
        } else {
            res.factorSummary = `Strongest on ${strongest.label}, but relatively weak on ${weakest.label}.`;
        }
    }
    
    return res;
}

// Score properties based on state
function scoreProperties(properties, state) {
    if (properties.length === 0) return [];
    
    // 1. Calculate raw metrics
    let scored = properties.map(p => {
        const locData = scoreLocation(p.lat, p.lon, p.monthlyRent, state);
        return { ...p, ...locData };
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
    const normalizeContext = { mins, maxs, nWeights };
    
    scored = scored.map(p => {
        const fullScore = scoreLocation(p.lat, p.lon, p.monthlyRent, state, normalizeContext);
        return { ...p, ...fullScore };
    });
    
    // Sort descending by score
    scored.sort((a, b) => b.lifeFitScore - a.lifeFitScore);
    
    // Dominance detection (5D)
    scored.forEach(p => {
        p.dominatedBy = null;
        for (let other of scored) {
            if (other.id === p.id) continue;
            
            const costAsGood = other.totalMonthlyCost <= p.totalMonthlyCost;
            const hoursAsGood = other.totalWeeklyHours <= p.totalWeeklyHours;
            const schoolAsGood = other.scores.school >= p.scores.school;
            const healthAsGood = other.scores.health >= p.scores.health;
            const convAsGood = other.scores.convenience >= p.scores.convenience;
            
            if (costAsGood && hoursAsGood && schoolAsGood && healthAsGood && convAsGood) {
                const strictlyBetter = 
                    (other.totalMonthlyCost < p.totalMonthlyCost) ||
                    (other.totalWeeklyHours < p.totalWeeklyHours) ||
                    (other.scores.school > p.scores.school) ||
                    (other.scores.health > p.scores.health) ||
                    (other.scores.convenience > p.scores.convenience);
                    
                if (strictlyBetter) {
                    p.dominatedBy = other.name;
                    break;
                }
            }
        }
    });

    // Provide normalisation context back so it can be used for arbitrary map points
    return { scored, normalizeContext };
}
