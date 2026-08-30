# Life-Fit

**Property sites tell you what's available. Life-Fit tells you where your whole household's life actually works.**

Live: https://git-mohak.github.io/Lifefit/

---

## The problem

A family does not have one commute. It has several. Two offices, a school, the gym, a parent's house. Every property site optimises for one person searching alone, so the trade-off that actually decides the move — is ₹8,000 more a month worth 45 minutes a day — is never priced.

In India that gap is expensive. Bengaluru drivers lose 168 hours a year to congestion (TomTom Traffic Index 2025), and 92% of dissatisfied affordable-housing buyers blame the location they chose rather than the home itself (ANAROCK Consumer Sentiment Survey H1 2025).

## What makes this different

**Multi-origin optimisation.** Zillow can already show homes within 30 minutes of one office. Nothing optimises across several destinations at once, each weighted by who travels there and how often. That is a different maths problem, and it is the core of this build.

**The whole city is scored, not just the listings.** Click anywhere on the map and Life-Fit evaluates that coordinate for your household. It answers "where should we live" rather than "which of these 24 match".

**Trade-offs priced in rupees per hour.** Each option is compared against the one ranked below it and expressed as an exchange rate: this home costs ₹4,862 more a month and returns 1.2 hours, which is ₹4,226 per hour of family time against the ₹950 you said your time is worth. Verdict: hard to justify.

**Dominance detection.** Any option strictly worse than another on all five factors is flagged, and the cost-versus-time efficient frontier is plotted so you can see which choices sit on it.

**Scenario simulation.** Move one person's office and the entire city rescores. The banner states what changed in hours per week and which recommendation moved to the top.

## How the scoring works

For each household member, straight-line distance is multiplied by a road circuity factor of 1.4 and divided by a mode speed reflecting Bengaluru peak conditions (car 15 km/h, transit 12, walk 4.5), with a minimum trip of 8 minutes. That produces per-member weekly hours, summed to a household total, then combined with monthly commute cost and rent into a total monthly outflow.

Five sub-scores — commute, schools, healthcare, daily convenience and cost — are min-max normalised across the property set and combined using the household's priority weights.

`js/scoring.js` holds all the maths and touches no DOM. `js/render.js` holds all the DOM and does no maths. `js/map.js` owns the Leaflet map and the score-surface grid.

## Running it

No build step, no server, no API keys. Clone the repo and open `index.html`.

Leaflet and OpenStreetMap tiles load from CDN. Everything else is plain HTML, CSS and JavaScript.

## What is real and what is not

Property records, rents and amenity locations are realistic sample data for 24 Bengaluru properties, not live listings. Travel times are modelled from distance and mode rather than routed.

Both were deliberate. A live maps API would need a key the judges do not have, so the demo would break for the person scoring it. And the point of this build is the decision layer, not the data pipeline — swapping in a real listings feed and a routing API changes the inputs, not the model.

## Built with

LatentCode, over the BuildSprint 2026 window.

SkillPatch skill used: **implement** (Matt Pocock).
