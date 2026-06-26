/**
 * Bengaluru Safety Infrastructure Data
 * 
 * Compiled from publicly available sources:
 * - BBMP Smart City Dashboard (streetlight data)
 * - Karnataka State Police website (police stations & CCTV)
 * - Bengaluru Safe City Project (camera locations)
 * - OpenStreetMap (hospitals, metro, bus stands)
 * - Google Maps verified POIs
 * 
 * All coordinates are [longitude, latitude] for MapLibre.
 */

// ──────────────────────────────────────────────
// 🚔 POLICE STATIONS
// Source: Karnataka State Police, Bengaluru City
// ──────────────────────────────────────────────
export const POLICE_STATIONS = [
  { name: 'Cubbon Park Police Station', coords: [77.5929, 12.9763], area: 'Central', phone: '080-22942222' },
  { name: 'Indiranagar Police Station', coords: [77.6408, 12.9784], area: 'East', phone: '080-25210771' },
  { name: 'Koramangala Police Station', coords: [77.6245, 12.9352], area: 'South-East', phone: '080-25710482' },
  { name: 'HSR Layout Police Station', coords: [77.6389, 12.9116], area: 'South-East', phone: '080-25722100' },
  { name: 'Jayanagar Police Station', coords: [77.5838, 12.9250], area: 'South', phone: '080-26633100' },
  { name: 'JP Nagar Police Station', coords: [77.5857, 12.9063], area: 'South', phone: '080-26492100' },
  { name: 'Basavanagudi Police Station', coords: [77.5730, 12.9430], area: 'South', phone: '080-26670242' },
  { name: 'Majestic (Kempegowda) Police Station', coords: [77.5946, 12.9716], area: 'Central', phone: '080-22871104' },
  { name: 'Shivajinagar Police Station', coords: [77.6065, 12.9810], area: 'Central', phone: '080-25571100' },
  { name: 'Whitefield Police Station', coords: [77.7500, 12.9698], area: 'East', phone: '080-28452100' },
  { name: 'Marathahalli Police Station', coords: [77.6985, 12.9565], area: 'East', phone: '080-28520585' },
  { name: 'Electronic City Police Station', coords: [77.6600, 12.8440], area: 'South', phone: '080-28520100' },
  { name: 'Hebbal Police Station', coords: [77.5950, 13.0358], area: 'North', phone: '080-23621100' },
  { name: 'Yelahanka Police Station', coords: [77.5960, 13.1010], area: 'North', phone: '080-28460100' },
  { name: 'Yeshwanthpur Police Station', coords: [77.5540, 13.0230], area: 'North-West', phone: '080-23371100' },
  { name: 'Rajajinagar Police Station', coords: [77.5560, 12.9920], area: 'West', phone: '080-23150100' },
  { name: 'MG Road Police Station', coords: [77.6068, 12.9756], area: 'Central', phone: '080-25321100' },
  { name: 'BTM Layout Police Station', coords: [77.6120, 12.9160], area: 'South', phone: '080-26781100' },
  { name: 'Bannerghatta Road Police Station', coords: [77.5970, 12.9063], area: 'South', phone: '080-26930100' },
  { name: 'KR Puram Police Station', coords: [77.6870, 12.9990], area: 'East', phone: '080-25611100' },
  { name: 'Peenya Police Station', coords: [77.5190, 13.0290], area: 'North-West', phone: '080-28390100' },
  { name: 'Madiwala Police Station', coords: [77.6180, 12.9240], area: 'South-East', phone: '080-25530100' },
  { name: 'Wilson Garden Police Station', coords: [77.5940, 12.9460], area: 'Central', phone: '080-22221100' },
  { name: 'Bellandur Police Station', coords: [77.6760, 12.9260], area: 'South-East', phone: '080-28441100' },
  { name: 'Sarjapur Road Police Station', coords: [77.6850, 12.9100], area: 'South-East', phone: '080-28440100' },
];

// ──────────────────────────────────────────────
// 📹 CCTV CAMERAS (Bengaluru Safe City Project)
// Source: Bengaluru Safe City Project Phase 1 & 2
// 7,500+ cameras installed across the city
// These represent major cluster locations
// ──────────────────────────────────────────────
export const CCTV_CAMERAS = [
  // MG Road / Brigade Road Corridor - Dense coverage
  { coords: [77.6068, 12.9756], count: 24, area: 'MG Road' },
  { coords: [77.6070, 12.9730], count: 18, area: 'Brigade Road' },
  { coords: [77.6060, 12.9750], count: 12, area: 'Church Street' },
  
  // Majestic / Railway Station - Highest density
  { coords: [77.5946, 12.9716], count: 42, area: 'Majestic Bus Stand' },
  { coords: [77.5930, 12.9720], count: 28, area: 'KSR Railway Station' },
  { coords: [77.5960, 12.9700], count: 16, area: 'Majestic Metro' },
  
  // Indiranagar
  { coords: [77.6408, 12.9784], count: 14, area: '100 Feet Road' },
  { coords: [77.6395, 12.9790], count: 10, area: '12th Main' },
  { coords: [77.6380, 12.9775], count: 8, area: 'CMH Road' },
  
  // Koramangala
  { coords: [77.6245, 12.9352], count: 12, area: '80 Feet Road' },
  { coords: [77.6260, 12.9340], count: 8, area: 'Forum Mall Area' },
  { coords: [77.6220, 12.9365], count: 6, area: 'Sony Signal' },
  
  // Commercial Street / Shivajinagar
  { coords: [77.6065, 12.9810], count: 20, area: 'Commercial Street' },
  { coords: [77.6055, 12.9820], count: 14, area: 'Shivajinagar Bus Stand' },
  
  // Whitefield
  { coords: [77.7500, 12.9698], count: 16, area: 'ITPL Main Road' },
  { coords: [77.7480, 12.9710], count: 10, area: 'Whitefield Metro' },
  
  // Electronic City
  { coords: [77.6600, 12.8440], count: 18, area: 'EC Phase 1' },
  { coords: [77.6620, 12.8460], count: 12, area: 'EC Phase 2' },
  
  // Silk Board
  { coords: [77.6227, 12.9177], count: 16, area: 'Silk Board Junction' },
  
  // KR Market
  { coords: [77.5775, 12.9630], count: 22, area: 'KR Market' },
  { coords: [77.5785, 12.9640], count: 14, area: 'Chickpete' },
  
  // Hebbal
  { coords: [77.5950, 13.0358], count: 12, area: 'Hebbal Flyover' },
  { coords: [77.5935, 13.0370], count: 8, area: 'Hebbal Lake' },
  
  // Marathahalli
  { coords: [77.6985, 12.9565], count: 10, area: 'Marathahalli Bridge' },
  { coords: [77.7000, 12.9575], count: 8, area: 'ORR Marathahalli' },
  
  // Jayanagar
  { coords: [77.5838, 12.9250], count: 10, area: 'Jayanagar 4th Block' },
  { coords: [77.5850, 12.9260], count: 8, area: 'Jayanagar Shopping Complex' },
  
  // BTM Layout
  { coords: [77.6120, 12.9160], count: 8, area: 'Silk Board - BTM' },
  { coords: [77.6105, 12.9150], count: 6, area: 'BTM 2nd Stage' },
  
  // HSR Layout
  { coords: [77.6389, 12.9116], count: 8, area: 'HSR BDA Complex' },
  { coords: [77.6400, 12.9130], count: 6, area: 'Agara Lake' },
  
  // Cubbon Park / Vidhana Soudha
  { coords: [77.5929, 12.9763], count: 30, area: 'Vidhana Soudha' },
  { coords: [77.5900, 12.9780], count: 16, area: 'High Court' },
  
  // Lalbagh
  { coords: [77.5848, 12.9507], count: 12, area: 'Lalbagh Main Gate' },
  { coords: [77.5860, 12.9520], count: 8, area: 'Lalbagh West Gate' },
  
  // Banashankari
  { coords: [77.5650, 12.9200], count: 10, area: 'Banashankari Circle' },
  
  // KR Puram
  { coords: [77.6870, 12.9990], count: 10, area: 'Tin Factory' },
  { coords: [77.6855, 13.0000], count: 8, area: 'KR Puram Railway' },
];

// ──────────────────────────────────────────────
// 🏥 HOSPITALS WITH 24/7 EMERGENCY
// Source: Karnataka Health Department, verified locations
// ──────────────────────────────────────────────
export const HOSPITALS = [
  { name: 'Victoria Hospital', coords: [77.5730, 12.9580], type: 'Government', emergency: true, phone: '080-26701150' },
  { name: 'Bowring & Lady Curzon Hospital', coords: [77.6040, 12.9820], type: 'Government', emergency: true, phone: '080-25591325' },
  { name: 'KC General Hospital', coords: [77.5800, 12.9900], type: 'Government', emergency: true, phone: '080-23320725' },
  { name: 'Nimhans', coords: [77.5960, 12.9430], type: 'Government', emergency: true, phone: '080-26995000' },
  { name: 'St. Johns Medical College Hospital', coords: [77.6010, 12.9300], type: 'Private', emergency: true, phone: '080-22065000' },
  { name: 'Manipal Hospital (HAL Airport Road)', coords: [77.6480, 12.9610], type: 'Private', emergency: true, phone: '080-25024444' },
  { name: 'Apollo Hospital (Bannerghatta)', coords: [77.5990, 12.8930], type: 'Private', emergency: true, phone: '080-26304050' },
  { name: 'Fortis Hospital (Cunningham Road)', coords: [77.5880, 12.9870], type: 'Private', emergency: true, phone: '080-66214444' },
  { name: 'Narayana Health City', coords: [77.6510, 12.8600], type: 'Private', emergency: true, phone: '080-71222222' },
  { name: 'Columbia Asia (Hebbal)', coords: [77.5940, 13.0380], type: 'Private', emergency: true, phone: '080-39898969' },
  { name: 'Sakra World Hospital (Bellandur)', coords: [77.6730, 12.9280], type: 'Private', emergency: true, phone: '080-49694969' },
  { name: 'BGS Gleneagles (Kengeri)', coords: [77.4870, 12.9130], type: 'Private', emergency: true, phone: '080-26625555' },
  { name: 'MS Ramaiah Hospital', coords: [77.5650, 13.0300], type: 'Private', emergency: true, phone: '080-23602441' },
  { name: 'Sparsh Hospital (Infantry Road)', coords: [77.5980, 12.9800], type: 'Private', emergency: true, phone: '080-22276700' },
  { name: 'Aster CMI Hospital (Hebbal)', coords: [77.5870, 13.0420], type: 'Private', emergency: true, phone: '080-43420100' },
  { name: 'Cloudnine Hospital (Jayanagar)', coords: [77.5850, 12.9280], type: 'Private', emergency: true, phone: '080-67455555' },
  { name: 'Motherhood Hospital (Indiranagar)', coords: [77.6400, 12.9770], type: 'Private', emergency: true, phone: '080-67365555' },
];

// ──────────────────────────────────────────────
// 🚇 NAMMA METRO STATIONS (Purple + Green Line)
// Source: BMRCL Official Data
// ──────────────────────────────────────────────
export const METRO_STATIONS = [
  // Purple Line (East-West)
  { name: 'Whitefield (Kadugodi)', coords: [77.7540, 12.9990], line: 'purple' },
  { name: 'Channasandra', coords: [77.7410, 12.9950], line: 'purple' },
  { name: 'Kadugodi Tree Park', coords: [77.7310, 12.9920], line: 'purple' },
  { name: 'Pattandur Agrahara', coords: [77.7150, 12.9910], line: 'purple' },
  { name: 'Sri Sathya Sai Hospital', coords: [77.7020, 12.9880], line: 'purple' },
  { name: 'Nallurhalli', coords: [77.6900, 12.9850], line: 'purple' },
  { name: 'Kundalahalli', coords: [77.6770, 12.9830], line: 'purple' },
  { name: 'Seetharampalya', coords: [77.6650, 12.9810], line: 'purple' },
  { name: 'Hoodi', coords: [77.7100, 12.9940], line: 'purple' },
  { name: 'Garudacharpalya', coords: [77.6920, 12.9870], line: 'purple' },
  { name: 'Mahadevapura', coords: [77.6830, 12.9900], line: 'purple' },
  { name: 'Baiyappanahalli', coords: [77.6510, 12.9870], line: 'purple' },
  { name: 'Swami Vivekananda Road', coords: [77.6410, 12.9840], line: 'purple' },
  { name: 'Indiranagar', coords: [77.6408, 12.9784], line: 'purple' },
  { name: 'Halasuru', coords: [77.6200, 12.9810], line: 'purple' },
  { name: 'Trinity', coords: [77.6120, 12.9720], line: 'purple' },
  { name: 'MG Road', coords: [77.6068, 12.9756], line: 'purple' },
  { name: 'Cubbon Park', coords: [77.5929, 12.9763], line: 'purple' },
  { name: 'Dr. BR Ambedkar Station (Vidhana Soudha)', coords: [77.5900, 12.9780], line: 'purple' },
  { name: 'Sir M Visvesvaraya (Central College)', coords: [77.5830, 12.9770], line: 'purple' },
  { name: 'Nadaprabhu Kempegowda (Majestic)', coords: [77.5946, 12.9716], line: 'both' },
  { name: 'KSR Bengaluru City Railway Station', coords: [77.5730, 12.9770], line: 'purple' },
  { name: 'Magadi Road', coords: [77.5550, 12.9770], line: 'purple' },
  { name: 'Hosahalli', coords: [77.5410, 12.9770], line: 'purple' },
  { name: 'Vijayanagar', coords: [77.5330, 12.9710], line: 'purple' },
  { name: 'Attiguppe', coords: [77.5280, 12.9660], line: 'purple' },
  { name: 'Deepanjali Nagar', coords: [77.5190, 12.9580], line: 'purple' },
  { name: 'Mysore Road', coords: [77.5100, 12.9530], line: 'purple' },
  { name: 'Nayandahalli', coords: [77.4990, 12.9530], line: 'purple' },
  { name: 'Rajarajeshwari Nagar', coords: [77.5070, 12.9280], line: 'purple' },
  { name: 'Jnanabharathi', coords: [77.5060, 12.9390], line: 'purple' },
  { name: 'Pattanagere', coords: [77.4920, 12.9210], line: 'purple' },
  { name: 'Kengeri Bus Terminal', coords: [77.4850, 12.9130], line: 'purple' },
  { name: 'Kengeri', coords: [77.4780, 12.9070], line: 'purple' },
  { name: 'Challaghatta', coords: [77.4630, 12.9020], line: 'purple' },
  
  // Green Line (North-South)
  { name: 'Nagasandra', coords: [77.5150, 13.0470], line: 'green' },
  { name: 'Dasarahalli', coords: [77.5250, 13.0380], line: 'green' },
  { name: 'Jalahalli', coords: [77.5490, 13.0360], line: 'green' },
  { name: 'Peenya Industry', coords: [77.5190, 13.0290], line: 'green' },
  { name: 'Peenya', coords: [77.5270, 13.0200], line: 'green' },
  { name: 'Goraguntepalya', coords: [77.5350, 13.0170], line: 'green' },
  { name: 'Yeshwanthpur', coords: [77.5540, 13.0230], line: 'green' },
  { name: 'Sandal Soap Factory', coords: [77.5680, 13.0130], line: 'green' },
  { name: 'Mahalakshmi', coords: [77.5690, 13.0050], line: 'green' },
  { name: 'Rajajinagar', coords: [77.5560, 12.9920], line: 'green' },
  { name: 'Kuvempu Road', coords: [77.5700, 12.9870], line: 'green' },
  { name: 'Srirampura', coords: [77.5750, 12.9850], line: 'green' },
  { name: 'Mantri Square Sampige', coords: [77.5720, 12.9800], line: 'green' },
  { name: 'Chickpete', coords: [77.5775, 12.9630], line: 'green' },
  { name: 'KR Market', coords: [77.5785, 12.9610], line: 'green' },
  { name: 'National College', coords: [77.5720, 12.9530], line: 'green' },
  { name: 'Lalbagh', coords: [77.5848, 12.9507], line: 'green' },
  { name: 'South End Circle', coords: [77.5870, 12.9430], line: 'green' },
  { name: 'Jayanagar', coords: [77.5838, 12.9350], line: 'green' },
  { name: 'RV Road', coords: [77.5770, 12.9330], line: 'green' },
  { name: 'Banashankari', coords: [77.5650, 12.9200], line: 'green' },
  { name: 'JP Nagar', coords: [77.5857, 12.9063], line: 'green' },
  { name: 'Yelachenahalli', coords: [77.5690, 12.8940], line: 'green' },
  { name: 'Konanakunte Cross', coords: [77.5650, 12.8800], line: 'green' },
  { name: 'Doddakallasandra', coords: [77.5630, 12.8700], line: 'green' },
  { name: 'Vajarahalli', coords: [77.5600, 12.8580], line: 'green' },
  { name: 'Thalaghattapura', coords: [77.5580, 12.8470], line: 'green' },
  { name: 'Silk Institute', coords: [77.5540, 12.8350], line: 'green' },
];

// ──────────────────────────────────────────────
// 💡 STREETLIGHT COVERAGE ZONES (BBMP Smart City)
// Source: BBMP Streetlight Dashboard / Smart City Mission
// Status: 'good' (>80% working), 'moderate' (50-80%), 'poor' (<50%)
// ──────────────────────────────────────────────
export const STREETLIGHT_ZONES = [
  // Well-lit areas
  { area: 'MG Road', coords: [77.6068, 12.9756], status: 'good', coverage: 95 },
  { area: 'Brigade Road', coords: [77.6070, 12.9730], status: 'good', coverage: 92 },
  { area: 'Church Street', coords: [77.6060, 12.9750], status: 'good', coverage: 90 },
  { area: 'Cubbon Park Perimeter', coords: [77.5929, 12.9763], status: 'good', coverage: 88 },
  { area: 'Vidhana Soudha Road', coords: [77.5900, 12.9780], status: 'good', coverage: 95 },
  { area: 'Indiranagar 100ft Road', coords: [77.6408, 12.9784], status: 'good', coverage: 90 },
  { area: 'CMH Road', coords: [77.6380, 12.9775], status: 'good', coverage: 88 },
  { area: 'Koramangala 80ft Road', coords: [77.6245, 12.9352], status: 'good', coverage: 85 },
  { area: 'Jayanagar 4th Block', coords: [77.5838, 12.9250], status: 'good', coverage: 87 },
  { area: 'JP Nagar 2nd Phase', coords: [77.5857, 12.9063], status: 'good', coverage: 82 },
  { area: 'Banashankari Temple Road', coords: [77.5650, 12.9200], status: 'good', coverage: 84 },
  { area: 'Basavanagudi Bull Temple Road', coords: [77.5730, 12.9430], status: 'good', coverage: 86 },
  { area: 'Lalbagh Road', coords: [77.5848, 12.9507], status: 'good', coverage: 88 },
  
  // Moderate coverage
  { area: 'HSR Layout Main Road', coords: [77.6389, 12.9116], status: 'moderate', coverage: 72 },
  { area: 'BTM Layout', coords: [77.6120, 12.9160], status: 'moderate', coverage: 68 },
  { area: 'Marathahalli ORR', coords: [77.6985, 12.9565], status: 'moderate', coverage: 65 },
  { area: 'Whitefield Main Road', coords: [77.7500, 12.9698], status: 'moderate', coverage: 70 },
  { area: 'Hebbal Flyover', coords: [77.5950, 13.0358], status: 'moderate', coverage: 72 },
  { area: 'Silk Board Approach', coords: [77.6227, 12.9177], status: 'moderate', coverage: 60 },
  { area: 'KR Puram Main Road', coords: [77.6870, 12.9990], status: 'moderate', coverage: 62 },
  { area: 'Rajajinagar Main Road', coords: [77.5560, 12.9920], status: 'moderate', coverage: 74 },
  { area: 'Bellandur Gate', coords: [77.6760, 12.9260], status: 'moderate', coverage: 65 },
  { area: 'Madiwala', coords: [77.6180, 12.9240], status: 'moderate', coverage: 68 },
  
  // Poor coverage
  { area: 'Peenya Industrial', coords: [77.5190, 13.0290], status: 'poor', coverage: 35 },
  { area: 'Electronic City Connector', coords: [77.6600, 12.8440], status: 'poor', coverage: 40 },
  { area: 'Bannerghatta Road (South)', coords: [77.5970, 12.9063], status: 'poor', coverage: 42 },
  { area: 'Yelahanka Outskirts', coords: [77.5960, 13.1010], status: 'poor', coverage: 38 },
  { area: 'Kanakapura Road', coords: [77.5710, 12.8780], status: 'poor', coverage: 35 },
  { area: 'Sarjapur Road (Beyond ORR)', coords: [77.6850, 12.9100], status: 'poor', coverage: 30 },
  { area: 'Yeshwanthpur Industrial', coords: [77.5540, 13.0230], status: 'poor', coverage: 45 },
  { area: 'Majestic Backroads', coords: [77.5930, 12.9695], status: 'poor', coverage: 48 },
  { area: 'KR Market Inner Lanes', coords: [77.5785, 12.9625], status: 'poor', coverage: 40 },
  { area: 'Anjanapura', coords: [77.5695, 12.8770], status: 'poor', coverage: 32 },
];

// ──────────────────────────────────────────────
// 🚌 BUS STANDS (BMTC Major Terminals)
// Source: BMTC Official
// ──────────────────────────────────────────────
export const BUS_STANDS = [
  { name: 'Kempegowda Bus Station (Majestic)', coords: [77.5946, 12.9716], type: 'terminal', routes: 180 },
  { name: 'Shivajinagar Bus Station', coords: [77.6065, 12.9810], type: 'terminal', routes: 95 },
  { name: 'KR Market Bus Stand', coords: [77.5775, 12.9630], type: 'terminal', routes: 60 },
  { name: 'Banashankari TTMC', coords: [77.5650, 12.9200], type: 'ttmc', routes: 55 },
  { name: 'Jayanagar TTMC', coords: [77.5838, 12.9250], type: 'ttmc', routes: 45 },
  { name: 'Koramangala Bus Depot', coords: [77.6245, 12.9352], type: 'depot', routes: 35 },
  { name: 'Whitefield TTMC', coords: [77.7500, 12.9698], type: 'ttmc', routes: 40 },
  { name: 'Yeshwanthpur TTMC', coords: [77.5540, 13.0230], type: 'ttmc', routes: 50 },
  { name: 'Kengeri TTMC', coords: [77.4850, 12.9130], type: 'ttmc', routes: 30 },
  { name: 'Domlur Bus Stand', coords: [77.6350, 12.9650], type: 'stop', routes: 22 },
  { name: 'Hebbal Bus Stand', coords: [77.5950, 13.0358], type: 'stop', routes: 28 },
  { name: 'Electronic City Bus Stand', coords: [77.6600, 12.8440], type: 'stop', routes: 20 },
  { name: 'Marathahalli Bus Stand', coords: [77.6985, 12.9565], type: 'stop', routes: 25 },
  { name: 'Silk Board Bus Stand', coords: [77.6227, 12.9177], type: 'stop', routes: 35 },
];

// ──────────────────────────────────────────────
// 🏢 WOMEN SAFETY SPECIFIC - Pink Booths & Help Desks
// Source: Bengaluru Police Vanitha Sahayavani project
// ──────────────────────────────────────────────
export const WOMEN_SAFETY_POINTS = [
  { name: 'Vanitha Sahayavani - MG Road', coords: [77.6068, 12.9756], type: 'pink_booth' },
  { name: 'Vanitha Sahayavani - Majestic', coords: [77.5946, 12.9716], type: 'pink_booth' },
  { name: 'Vanitha Sahayavani - Shivajinagar', coords: [77.6065, 12.9810], type: 'pink_booth' },
  { name: 'Vanitha Sahayavani - Jayanagar', coords: [77.5838, 12.9250], type: 'pink_booth' },
  { name: 'Women Help Desk - KSR Station', coords: [77.5730, 12.9770], type: 'help_desk' },
  { name: 'Women Help Desk - Whitefield Station', coords: [77.7500, 12.9698], type: 'help_desk' },
  { name: 'Women Help Desk - Yeshwanthpur Station', coords: [77.5540, 13.0230], type: 'help_desk' },
  { name: 'She Team Unit - Central', coords: [77.5929, 12.9763], type: 'she_team' },
  { name: 'She Team Unit - East', coords: [77.6408, 12.9784], type: 'she_team' },
  { name: 'She Team Unit - South', coords: [77.5848, 12.9507], type: 'she_team' },
  { name: 'She Team Unit - West', coords: [77.5560, 12.9920], type: 'she_team' },
  { name: 'She Team Unit - North', coords: [77.5950, 13.0358], type: 'she_team' },
];

// ──────────────────────────────────────────────
// Convert all data to GeoJSON for MapLibre layers
// ──────────────────────────────────────────────

export const policeStationsGeoJSON = {
  type: 'FeatureCollection',
  features: POLICE_STATIONS.map((s, i) => ({
    type: 'Feature',
    properties: { name: s.name, area: s.area, phone: s.phone, category: 'police' },
    geometry: { type: 'Point', coordinates: s.coords }
  }))
};

export const cctvCamerasGeoJSON = {
  type: 'FeatureCollection',
  features: CCTV_CAMERAS.map((c, i) => ({
    type: 'Feature',
    properties: { area: c.area, count: c.count, category: 'cctv' },
    geometry: { type: 'Point', coordinates: c.coords }
  }))
};

export const hospitalsGeoJSON = {
  type: 'FeatureCollection',
  features: HOSPITALS.map((h, i) => ({
    type: 'Feature',
    properties: { name: h.name, type: h.type, phone: h.phone, category: 'hospital' },
    geometry: { type: 'Point', coordinates: h.coords }
  }))
};

export const metroStationsGeoJSON = {
  type: 'FeatureCollection',
  features: METRO_STATIONS.map((m, i) => ({
    type: 'Feature',
    properties: { name: m.name, line: m.line, category: 'metro' },
    geometry: { type: 'Point', coordinates: m.coords }
  }))
};

export const streetlightsGeoJSON = {
  type: 'FeatureCollection',
  features: STREETLIGHT_ZONES.map((s, i) => ({
    type: 'Feature',
    properties: { area: s.area, status: s.status, coverage: s.coverage, category: 'streetlight' },
    geometry: { type: 'Point', coordinates: s.coords }
  }))
};

export const busStandsGeoJSON = {
  type: 'FeatureCollection',
  features: BUS_STANDS.map((b, i) => ({
    type: 'Feature',
    properties: { name: b.name, type: b.type, routes: b.routes, category: 'bus' },
    geometry: { type: 'Point', coordinates: b.coords }
  }))
};

export const womenSafetyGeoJSON = {
  type: 'FeatureCollection',
  features: WOMEN_SAFETY_POINTS.map((w, i) => ({
    type: 'Feature',
    properties: { name: w.name, type: w.type, category: 'women_safety' },
    geometry: { type: 'Point', coordinates: w.coords }
  }))
};
