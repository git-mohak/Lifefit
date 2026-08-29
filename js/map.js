let map;
let gridLayer;
let markersLayer;
let linesLayer;

function getScoreColor(score) {
    if (score >= 90) return 'rgba(34, 197, 94, 0.45)'; // green
    if (score >= 80) return 'rgba(132, 204, 22, 0.45)'; // yellow-green
    if (score >= 70) return 'rgba(234, 179, 8, 0.45)'; // amber
    if (score >= 60) return 'rgba(249, 115, 22, 0.45)'; // orange
    return 'rgba(239, 68, 68, 0.45)'; // red
}

function getSolidScoreColor(score) {
    if (score >= 90) return '#22c55e';
    if (score >= 80) return '#84cc16';
    if (score >= 70) return '#eab308';
    if (score >= 60) return '#f97316';
    return '#ef4444';
}

function initMap(state) {
    try {
        if (!map) {
            map = L.map('map').setView([12.9716, 77.5946], 11);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: '© OpenStreetMap'
            }).addTo(map);
            
            gridLayer = L.layerGroup().addTo(map);
            linesLayer = L.layerGroup().addTo(map);
            markersLayer = L.layerGroup().addTo(map);

            map.on('click', (e) => {
                handleMapClick(e.latlng.lat, e.latlng.lng);
            });
        }
    } catch (e) {
        console.error("Map init failed", e);
    }
}

// Draw the 60x60 grid overlay
function drawGrid(state, normalizeContext) {
    if (!gridLayer) return;
    gridLayer.clearLayers();
    
    // Bengaluru bounds
    const latMin = 12.83, latMax = 13.14;
    const lonMin = 77.46, lonMax = 77.78;
    const steps = 60;
    
    const latStep = (latMax - latMin) / steps;
    const lonStep = (lonMax - lonMin) / steps;
    
    for (let i = 0; i < steps; i++) {
        for (let j = 0; j < steps; j++) {
            const lat = latMin + i * latStep;
            const lon = lonMin + j * lonStep;
            
            // Score this cell center
            const estimatedRent = estimateRent(lat + latStep/2, lon + lonStep/2);
            const scoreData = scoreLocation(lat + latStep/2, lon + lonStep/2, estimatedRent, state, normalizeContext);
            
            const bounds = [[lat, lon], [lat + latStep, lon + lonStep]];
            const rect = L.rectangle(bounds, {
                color: 'transparent',
                fillColor: getScoreColor(scoreData.lifeFitScore),
                fillOpacity: 1
            });
            gridLayer.addLayer(rect);
        }
    }
}

function drawMarkers(scoredProperties, state) {
    if (!markersLayer) return;
    markersLayer.clearLayers();
    
    // Draw household destinations
    state.household.forEach(m => {
        if (!m.lat || !m.lon) return;
        const marker = L.circleMarker([m.lat, m.lon], {
            radius: 8,
            fillColor: "#000",
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
        marker.bindTooltip(`<b>${m.name}</b><br>${m.destinationName}`, { permanent: true, direction: 'top', className: 'destination-tooltip' });
        markersLayer.addLayer(marker);
    });
    
    // Draw properties
    scoredProperties.forEach(p => {
        const marker = L.circleMarker([p.lat, p.lon], {
            radius: 6,
            fillColor: getSolidScoreColor(p.lifeFitScore),
            color: "#fff",
            weight: 2,
            opacity: 1,
            fillOpacity: 1
        });
        
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            showDetails(p);
        });
        
        markersLayer.addLayer(marker);
    });
}

function showDetails(scoreData) {
    linesLayer.clearLayers();
    
    let popupContent = `
        <div style="font-family:sans-serif;">
            <h3 style="margin:0 0 5px 0;">${scoreData.name || 'Arbitrary Location'}</h3>
            <div style="font-size:18px; font-weight:bold; color:${getSolidScoreColor(scoreData.lifeFitScore)}; margin-bottom:10px;">
                Score: ${scoreData.lifeFitScore}/100
            </div>
            <div>Rent: ₹${scoreData.monthlyRent.toLocaleString('en-IN')}/mo</div>
            <div>Total Cost: ₹${scoreData.totalMonthlyCost.toLocaleString('en-IN')}/mo</div>
            <div>Travel: ${scoreData.totalWeeklyHours.toFixed(1)} hrs/wk</div>
            <p style="font-size:0.9em; font-style:italic; margin: 10px 0;">${scoreData.factorSummary}</p>
        </div>
    `;

    L.popup()
        .setLatLng([scoreData.lat, scoreData.lon])
        .setContent(popupContent)
        .openOn(map);
        
    // Draw lines to household destinations
    scoreData.memberBreakdown.forEach(m => {
        if (!m.lat || !m.lon) return;
        const line = L.polyline([[scoreData.lat, scoreData.lon], [m.lat, m.lon]], {
            color: '#3b82f6', weight: 2, dashArray: '5, 5'
        });
        line.bindTooltip(`${m.name}: ${m.distKm}km, ${m.oneWayMin}m`);
        linesLayer.addLayer(line);
    });
    
    // Draw lines to amenities
    const addAmenityLine = (amenity, label, color) => {
        if (!amenity) return;
        const line = L.polyline([[scoreData.lat, scoreData.lon], [amenity.lat, amenity.lon]], {
            color: color, weight: 2, dashArray: '3, 3'
        });
        line.bindTooltip(`${label}: ${amenity.name} (${amenity.distanceKm.toFixed(1)}km)`);
        linesLayer.addLayer(line);
    };
    
    addAmenityLine(scoreData.nearestSchool, 'School', '#eab308');
    addAmenityLine(scoreData.nearestHospital, 'Hospital', '#ef4444');
    addAmenityLine(scoreData.nearestGrocery, 'Grocery', '#84cc16');
}

function handleMapClick(lat, lon) {
    try {
        const estimatedRent = estimateRent(lat, lon);
        const scoreData = scoreLocation(lat, lon, estimatedRent, window._lastState, window._lastNormalizeContext);
        showDetails(scoreData);
    } catch (e) {
        console.error("Map click failed", e);
    }
}

// Expose update function
window.updateMap = function(scoredProperties, state, normalizeContext) {
    try {
        window._lastState = state;
        window._lastNormalizeContext = normalizeContext;
        initMap(state);
        drawGrid(state, normalizeContext);
        drawMarkers(scoredProperties, state);
    } catch (e) {
        console.error("updateMap failed", e);
    }
};