const AMENITIES = [
  // Schools (rating 1-5)
  { id: 1, name: "TISB", category: "school", lat: 12.8622, lon: 77.7275, rating: 5 },
  { id: 2, name: "Greenwood High", category: "school", lat: 12.8711, lon: 77.7351, rating: 5 },
  { id: 3, name: "Inventure Academy", category: "school", lat: 12.8672, lon: 77.7355, rating: 4 },
  { id: 4, name: "DPS East", category: "school", lat: 12.8870, lon: 77.6835, rating: 4 },
  { id: 5, name: "NPS Koramangala", category: "school", lat: 12.9351, lon: 77.6224, rating: 5 },
  { id: 6, name: "NPS Indiranagar", category: "school", lat: 12.9732, lon: 77.6415, rating: 5 },
  { id: 7, name: "NPS HSR", category: "school", lat: 12.9126, lon: 77.6391, rating: 4 },
  { id: 8, name: "Mallya Aditi", category: "school", lat: 13.0841, lon: 77.5796, rating: 5 },
  { id: 9, name: "Canadian International", category: "school", lat: 13.0970, lon: 77.5878, rating: 4 },
  { id: 10, name: "Bethany High", category: "school", lat: 12.9304, lon: 77.6200, rating: 4 },

  // Hospitals
  { id: 11, name: "Manipal Hospital HAL", category: "hospital", lat: 12.9592, lon: 77.6483 },
  { id: 12, name: "Apollo Hospital Bannerghatta", category: "hospital", lat: 12.8953, lon: 77.5991 },
  { id: 13, name: "Fortis Hospital Bannerghatta", category: "hospital", lat: 12.8942, lon: 77.5995 },
  { id: 14, name: "Sakra World Hospital", category: "hospital", lat: 12.9328, lon: 77.6853 },
  { id: 15, name: "Aster CMI Hebbal", category: "hospital", lat: 13.0531, lon: 77.5934 },
  { id: 16, name: "Columbia Asia Whitefield", category: "hospital", lat: 12.9567, lon: 77.7441 },
  { id: 17, name: "Narayana Multispeciality HSR", category: "hospital", lat: 12.9100, lon: 77.6485 },
  { id: 18, name: "St. John's Hospital", category: "hospital", lat: 12.9298, lon: 77.6186 },

  // Groceries (make sure not all are close to everything)
  { id: 19, name: "Nature's Basket Koramangala", category: "grocery", lat: 12.9348, lon: 77.6225 },
  { id: 20, name: "Nature's Basket Indiranagar", category: "grocery", lat: 12.9719, lon: 77.6412 },
  { id: 22, name: "Star Bazaar HSR", category: "grocery", lat: 12.9123, lon: 77.6401 },
  { id: 23, name: "More Megastore Mahadevapura", category: "grocery", lat: 12.9922, lon: 77.6835 },
  { id: 24, name: "Spar Bannerghatta", category: "grocery", lat: 12.9095, lon: 77.5975 },
  { id: 25, name: "Reliance Smart Bellandur", category: "grocery", lat: 12.9308, lon: 77.6749 },

  
  // Metro
  { id: 26, name: "Indiranagar Metro", category: "metro", lat: 12.9783, lon: 77.6387 },
  { id: 27, name: "Swami Vivekananda Road Metro", category: "metro", lat: 12.9859, lon: 77.6449 },
  { id: 28, name: "Baiyappanahalli Metro", category: "metro", lat: 12.9906, lon: 77.6525 },
  { id: 29, name: "Jayanagar Metro", category: "metro", lat: 12.9298, lon: 77.5801 },
  { id: 30, name: "Rashtriya Vidyalaya Road Metro", category: "metro", lat: 12.9195, lon: 77.5801 },
  { id: 31, name: "Mantri Square Sampige Road Metro", category: "metro", lat: 12.9904, lon: 77.5707 },
  { id: 32, name: "Garudacharapalya Metro", category: "metro", lat: 12.9868, lon: 77.7013 },
  { id: 33, name: "Hoodi Junction Metro", category: "metro", lat: 12.9880, lon: 77.7153 },
  { id: 34, name: "Seetharampalya Metro", category: "metro", lat: 12.9885, lon: 77.7259 },
  { id: 35, name: "Kundalahalli Metro", category: "metro", lat: 12.9691, lon: 77.7169 },
  { id: 36, name: "Nallurhalli Metro", category: "metro", lat: 12.9722, lon: 77.7285 },
  { id: 37, name: "Sri Sathya Sai Hospital Metro", category: "metro", lat: 12.9760, lon: 77.7335 },
  { id: 38, name: "Pattandur Agrahara Metro", category: "metro", lat: 12.9782, lon: 77.7405 },
  { id: 39, name: "Kadugodi Tree Park Metro", category: "metro", lat: 12.9840, lon: 77.7478 },
  { id: 40, name: "Whitefield Metro", category: "metro", lat: 12.9965, lon: 77.7505 },

  // Parks
  { id: 41, name: "Cubbon Park", category: "park", lat: 12.9767, lon: 77.5951 },
  { id: 42, name: "Lalbagh Botanical Garden", category: "park", lat: 12.9507, lon: 77.5848 },
  { id: 43, name: "Madiwala Lake Park", category: "park", lat: 12.9095, lon: 77.6201 },
  { id: 44, name: "Agara Lake Park", category: "park", lat: 12.9238, lon: 77.6433 },
  { id: 45, name: "Kaondenyaswami Park HSR", category: "park", lat: 12.9100, lon: 77.6400 },
  { id: 46, name: "Jayanagar 4th Block Park", category: "park", lat: 12.9268, lon: 77.5855 },
  { id: 47, name: "Defence Colony Park Indiranagar", category: "park", lat: 12.9750, lon: 77.6450 },

  // Gyms
  { id: 48, name: "Cult Fit Koramangala", category: "gym", lat: 12.9350, lon: 77.6200 },
  { id: 49, name: "Cult Fit Indiranagar", category: "gym", lat: 12.9725, lon: 77.6380 },
  { id: 50, name: "Cult Fit HSR Layout", category: "gym", lat: 12.9110, lon: 77.6395 },
  { id: 51, name: "Cult Fit Whitefield", category: "gym", lat: 12.9750, lon: 77.7320 },
  { id: 52, name: "Gold's Gym JP Nagar", category: "gym", lat: 12.9050, lon: 77.5900 },
  { id: 53, name: "Gold's Gym Marathahalli", category: "gym", lat: 12.9555, lon: 77.7010 },
  { id: 54, name: "Apple Fitness Bellandur", category: "gym", lat: 12.9280, lon: 77.6740 },
  { id: 55, name: "Chisel Richmond Town", category: "gym", lat: 12.9650, lon: 77.5950 }
];
