function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    
    // Haversine formula
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

function scoreProperties(properties, preferences) {
    const { 
        officeLat, officeLon, 
        schoolLat, schoolLon, 
        budget, 
        weights 
    } = preferences;
    
    // Total weight sum for normalization
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    
    // Return base score if all weights are 0
    if (totalWeight === 0) {
        return properties.map(p => ({ ...p, score: 0 }));
    }

    const scored = properties.map(p => {
        let score = 0;
        
        // 1. Commute (Distance to Office)
        if (officeLat && officeLon) {
            const officeDist = calculateDistance(p.latitude, p.longitude, officeLat, officeLon);
            // 20km is 0 points, 0km is 100 points
            const commuteScore = Math.max(0, 100 - (officeDist * 5)); 
            score += (commuteScore * weights.commute);
        }

        // 2. Schools (Distance to preferred school, else nearest school)
        let schoolScore = 0;
        if (schoolLat && schoolLon) {
            const prefSchoolDist = calculateDistance(p.latitude, p.longitude, schoolLat, schoolLon);
            // 20km is 0, 0km is 100
            schoolScore = Math.max(0, 100 - (prefSchoolDist * 5));
        } else {
            // 5km is 0, 0km is 100
            schoolScore = Math.max(0, 100 - (p.distance_school * 20));
        }
        score += (schoolScore * weights.schools);

        // 3. Healthcare (Nearest hospital)
        // 5km is 0, 0km is 100
        const healthcareScore = Math.max(0, 100 - (p.distance_hospital * 20));
        score += (healthcareScore * weights.healthcare);

        // 4. Daily convenience (Nearest grocery)
        // 2km is 0, 0km is 100
        const convenienceScore = Math.max(0, 100 - (p.distance_grocery * 50));
        score += (convenienceScore * weights.convenience);

        // 5. Cost (Rent vs Budget)
        let costScore = 0;
        if (budget > 0) {
            if (p.rent <= budget) {
                costScore = 100;
            } else {
                // Lose 1 point for every 1% over budget, 0 if 100% over budget
                const overagePercent = ((p.rent - budget) / budget) * 100;
                costScore = Math.max(0, 100 - overagePercent);
            }
        } else {
            // Default: cheaper is better. 100k is 0, 0 is 100
            costScore = Math.max(0, 100 - (p.rent / 1000));
        }
        score += (costScore * weights.cost);

        // Normalize score to 0-100
        const normalizedScore = Math.round(score / totalWeight);

        return { ...p, score: normalizedScore };
    });

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
}