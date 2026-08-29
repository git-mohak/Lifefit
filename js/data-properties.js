const PROPERTIES = [
  // Expensive, central (60-85k)
  { id: 1, name: "Pebble Bay", area: "RMV 2nd Stage", lat: 13.0315, lon: 77.5750, monthlyRent: 85000, bedrooms: 4, sqft: 2800 },
  { id: 2, name: "Gopalan Atlantis", area: "Indiranagar", lat: 12.9784, lon: 77.6408, monthlyRent: 75000, bedrooms: 3, sqft: 2000 },
  { id: 3, name: "Raheja Residency", area: "Koramangala", lat: 12.9304, lon: 77.6338, monthlyRent: 68000, bedrooms: 3, sqft: 1900 },
  { id: 4, name: "Brigade Gateway", area: "Malleswaram", lat: 13.0123, lon: 77.5540, monthlyRent: 80000, bedrooms: 3, sqft: 1950 },
  { id: 5, name: "Sobha Morzaria Grandeur", area: "Koramangala", lat: 12.9385, lon: 77.6074, monthlyRent: 65000, bedrooms: 3, sqft: 1800 },
  { id: 6, name: "Adarsh Palm Retreat", area: "Bellandur", lat: 12.9192, lon: 77.6833, monthlyRent: 70000, bedrooms: 3, sqft: 2100 },

  // Mid-range (40-60k)
  { id: 7, name: "Sobha Quartz", area: "Sarjapur Road", lat: 12.9220, lon: 77.6765, monthlyRent: 58000, bedrooms: 3, sqft: 1850 },
  { id: 8, name: "Rohan Jashan", area: "Koramangala", lat: 12.9352, lon: 77.6245, monthlyRent: 55000, bedrooms: 3, sqft: 1650 },
  { id: 9, name: "Purva Riviera", area: "Marathahalli", lat: 12.9550, lon: 77.6980, monthlyRent: 52000, bedrooms: 3, sqft: 1750 },
  { id: 10, name: "Salarpuria Greenage", area: "Bommanahalli", lat: 12.9056, lon: 77.6254, monthlyRent: 54000, bedrooms: 3, sqft: 1750 },
  { id: 11, name: "Prestige Shantiniketan", area: "Whitefield", lat: 12.9877, lon: 77.7297, monthlyRent: 48000, bedrooms: 3, sqft: 1800 },
  { id: 12, name: "Mantri Elegance", area: "Bannerghatta Road", lat: 12.9102, lon: 77.5997, monthlyRent: 48000, bedrooms: 3, sqft: 1650 },
  { id: 13, name: "Salarpuria Serenity", area: "HSR Layout", lat: 12.9081, lon: 77.6476, monthlyRent: 49000, bedrooms: 3, sqft: 1700 },
  { id: 14, name: "L&T Raintree Boulevard", area: "Hebbal", lat: 13.0569, lon: 77.5925, monthlyRent: 60000, bedrooms: 3, sqft: 1850 },
  { id: 15, name: "Godrej Woodsman Estate", area: "Hebbal", lat: 13.0498, lon: 77.5891, monthlyRent: 46000, bedrooms: 3, sqft: 1600 },
  { id: 16, name: "Purva Vantage", area: "HSR Layout", lat: 12.9141, lon: 77.6411, monthlyRent: 43000, bedrooms: 2, sqft: 1350 },

  // Cheaper, further out (25-40k)
  { id: 17, name: "Sobha Habitech", area: "Whitefield", lat: 12.9669, lon: 77.7479, monthlyRent: 40000, bedrooms: 2, sqft: 1400 },
  { id: 18, name: "Rohan Vasantha", area: "Marathahalli", lat: 12.9569, lon: 77.7011, monthlyRent: 38000, bedrooms: 2, sqft: 1300 },
  { id: 19, name: "Bhartiya City Nikoo Homes", area: "Thanisandra", lat: 13.0784, lon: 77.6360, monthlyRent: 38000, bedrooms: 2, sqft: 1250 },
  { id: 20, name: "Suncity Apartments", area: "Sarjapur Road", lat: 12.9165, lon: 77.6698, monthlyRent: 35000, bedrooms: 2, sqft: 1200 },
  { id: 21, name: "Ajmera Infinity", area: "Electronic City", lat: 12.8465, lon: 77.6534, monthlyRent: 33000, bedrooms: 2, sqft: 1150 },
  { id: 22, name: "Prestige Augusta Golf Village", area: "Horamavu", lat: 13.0335, lon: 77.6521, monthlyRent: 32000, bedrooms: 2, sqft: 1150 },
  { id: 23, name: "Prestige Sunrise Park", area: "Electronic City", lat: 12.8364, lon: 77.6599, monthlyRent: 28000, bedrooms: 2, sqft: 1100 },
  { id: 24, name: "Godrej Avenues", area: "Yelahanka", lat: 13.1098, lon: 77.5855, monthlyRent: 26000, bedrooms: 2, sqft: 1050 }
];
