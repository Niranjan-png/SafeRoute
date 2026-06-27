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
  { name: 'Peenya Police Station', coords: [77.5190, 13.0290], area: 'North-West', phone: '080-28390100' },
  { name: 'Madiwala Police Station', coords: [77.6180, 12.9240], area: 'South-East', phone: '080-25530100' },
  { name: 'Wilson Garden Police Station', coords: [77.5940, 12.9460], area: 'Central', phone: '080-22221100' },
  { name: 'Bellandur Police Station', coords: [77.6760, 12.9260], area: 'South-East', phone: '080-28441100' },
  { name: 'Peenya L&O Police Station', coords: [77.5255, 13.0222], area: 'North-West', phone: '080-22942532' },
  { name: 'Seshadripuram Police Station', coords: [77.5738, 12.9878], area: 'Central', phone: '080-22942586' },
  { name: 'Ashoknagar Police Station', coords: [77.6080, 12.9702], area: 'Central', phone: '080-22942580' },
  { name: 'Malleshwaram Police Station', coords: [77.5714, 12.9984], area: 'North', phone: '080-22942519' },
  { name: 'Sanjaynagar Police Station', coords: [77.5786, 13.0335], area: 'North', phone: '080-22942533' },
  { name: 'Nandini Layout Police Station', coords: [77.5364, 13.0102], area: 'North-West', phone: '080-22942539' },
  { name: 'Chamarajpet Police Station', coords: [77.5670, 12.9608], area: 'South', phone: '080-22942575' },
  { name: 'Hanumanthanagar Police Station', coords: [77.5592, 12.9525], area: 'South', phone: '080-26508544' },
  { name: 'Adugodi Police Station', coords: [77.6074, 12.9442], area: 'South', phone: '080-22942573' },
  { name: 'Banasawadi Police Station', coords: [77.6435, 13.0112], area: 'East', phone: '080-22942552' },
  { name: 'Hennur Police Station', coords: [77.6322, 13.0258], area: 'East', phone: '080-22942557' },
  { name: 'Jeevanabimanagar Police Station', coords: [77.6604, 12.9644], area: 'East', phone: '080-22942543' },
  { name: 'Peenya Traffic Police Station', coords: [77.5140, 13.0310], area: 'North-West', phone: '080-22942532' },
  { name: 'R.M.C Yard Police Station', coords: [77.5490, 13.0190], area: 'North-West', phone: '080-22942531' },
  { name: 'Sadashivanagar Police Station', coords: [77.5804, 13.0068], area: 'Central', phone: '080-22942589' },
  { name: 'Highgrounds Police Station', coords: [77.5850, 12.9850], area: 'Central', phone: '080-22942671' },
  { name: 'Vyalikaval Police Station', coords: [77.5750, 13.0000], area: 'Central', phone: '080-22942588' },
  { name: 'Byatarayanapura Police Station', coords: [77.5322, 12.9528], area: 'West', phone: '080-22942507' },
  { name: 'Chandra Layout Police Station', coords: [77.5250, 12.9620], area: 'West', phone: '080-22942512' },
  { name: 'Jnanabharathi Police Station', coords: [77.5020, 12.9490], area: 'West', phone: '080-22942513' },
  { name: 'Kengeri Police Station', coords: [77.4810, 12.9190], area: 'West', phone: '080-22942510' },
  { name: 'Vijayanagar Police Station', coords: [77.5300, 12.9730], area: 'West', phone: '080-22942514' },
  { name: 'Kamakshipalya Police Station', coords: [77.5240, 12.9820], area: 'West', phone: '080-22942517' },
  { name: 'Basaveshwaranagar Police Station', coords: [77.5385, 12.9880], area: 'West', phone: '080-22942516' },
  { name: 'Cottonpet Police Station', coords: [77.5680, 12.9690], area: 'West', phone: '080-22942508' },
  { name: 'Girinagar Police Station', coords: [77.5424, 12.9436], area: 'South', phone: '080-22942577' },
  { name: 'Kumaraswamy Layout Police Station', coords: [77.5584, 12.9078], area: 'South', phone: '080-22942567' },
  { name: 'Subramanyapura Police Station', coords: [77.5500, 12.8980], area: 'South', phone: '080-22942565' },
  { name: 'Siddapura Police Station', coords: [77.5920, 12.9370], area: 'South', phone: '080-22942572' },
  { name: 'S.R. Nagar Police Station', coords: [77.5950, 12.9590], area: 'Central', phone: '080-22942582' },
  { name: 'Ulsoor Police Station', coords: [77.6250, 12.9800], area: 'East', phone: '080-22942540' },
  { name: 'Commercial Street Police Station', coords: [77.6110, 12.9820], area: 'East', phone: '080-22942549' },
  { name: 'Frazer Town Police Station', coords: [77.6130, 12.9970], area: 'East', phone: '080-22942548' },
  { name: 'K.G. Halli Police Station', coords: [77.6200, 13.0180], area: 'East', phone: '080-22942556' },
  { name: 'D.J. Halli Police Station', coords: [77.5990, 13.0140], area: 'East', phone: '080-22942550' },
  { name: 'Byappanahalli Police Station', coords: [77.6480, 12.9900], area: 'East', phone: '080-22942545' },
  { name: 'Ramamurthy Nagar Police Station', coords: [77.6790, 13.0160], area: 'East', phone: '080-22942554' },
  { name: 'Yelahanka New Town Police Station', coords: [77.5780, 13.0900], area: 'North', phone: '080-22942537' },
  { name: 'Sanjaynagar Police Station', coords: [77.5790, 13.0360], area: 'North', phone: '080-22942533' },
  { name: 'Peenya Law & Order Police Station', coords: [77.5222, 13.0255], area: 'North-West', phone: '080-22942532' },
  { name: 'Gangammanagudi Police Station', coords: [77.5500, 13.0450], area: 'North-West', phone: '080-22942530' },
  { name: 'Peenya Industrial Area PS', coords: [77.5090, 13.0280], area: 'North-West', phone: '080-22942532' }
];

// ──────────────────────────────────────────────
// 📹 CCTV CAMERAS (Bengaluru Safe City Project)
// Source: Bengaluru Safe City Project & OpenCity.in
// ──────────────────────────────────────────────
export const CCTV_CAMERAS = [
  { area: 'OSM Verified Camera - Cubbon Park', count: 1, coords: [77.584168, 12.9779004] },
  { area: 'OSM Verified Camera - CMH Road', count: 1, coords: [77.6355011, 12.9670078] },
  { area: 'OSM Verified Camera - 12th Main Indiranagar', count: 1, coords: [77.636018, 12.9699507] },
  { area: 'OSM Verified Camera - Vijayanagar', count: 1, coords: [77.5349283, 12.9655057] },
  { area: 'CCTV - Vijayanagar Junction', count: 1, coords: [77.5348464, 12.9651401] },
  { area: 'Surveillance camera - Attiguppe', count: 1, coords: [77.5342179, 12.9578343] },
  { area: 'Pole 5 - MG Road Metro', count: 3, coords: [77.6138022, 12.9737679] },
  { area: 'Pole 4 - Brigade Road Corner', count: 4, coords: [77.6110349, 12.9743705] },
  { area: 'OSM Verified Camera - Koramangala 80ft Road', count: 1, coords: [77.6123667, 12.9344914] },
  { area: 'OSM Verified Camera - JP Nagar 24th Main', count: 1, coords: [77.5952023, 12.9102739] },
  { area: 'OSM Verified Camera - Koramangala 1st Block', count: 2, coords: [77.6233088, 12.9311267] },
  { area: 'OSM Verified Camera - Koramangala 4th Block', count: 1, coords: [77.6230211, 12.9308146] },
  { area: 'OSM Verified Camera - Fraser Town', count: 1, coords: [77.6232746, 12.9995879] },
  { area: 'OSM Verified Camera - Pulakeshinagar', count: 1, coords: [77.623085, 12.9996458] },
  { area: 'OSM Verified Camera - Coles Road', count: 1, coords: [77.6230575, 12.9996571] },
  { area: 'OSM Verified Camera - Hennur Crossing', count: 1, coords: [77.6104064, 12.9991284] },
  { area: 'OSM Verified Camera - Banasawadi Road', count: 1, coords: [77.6073388, 12.9935113] },
  { area: 'OSM Verified Camera - Lingarajapuram', count: 1, coords: [77.5994986, 12.9905635] },
  { area: 'OSM Verified Camera - JC Nagar Main Road', count: 2, coords: [77.597122, 12.9843792] },
  { area: 'OSM Verified Camera - RT Nagar Police Junction', count: 1, coords: [77.596906, 12.9803297] },
  { area: 'Safe City Cluster - Commercial Street Entrance', count: 4, coords: [77.6115, 12.9822] },
  { area: 'Safe City Camera - Shivajinagar Bus Station', count: 3, coords: [77.6062, 12.9808] },
  { area: 'Safe City Camera - Majestic Underpass', count: 5, coords: [77.5935, 12.9710] },
  { area: 'Safe City Cluster - Silk Board Junction East', count: 6, coords: [77.6235, 12.9180] },
  { area: 'Safe City Cluster - Silk Board Junction West', count: 5, coords: [77.6220, 12.9175] },
  { area: 'Safe City Camera - HSR Layout 27th Main', count: 3, coords: [77.6395, 12.9125] },
  { area: 'Safe City Camera - HSR Layout Sector 1', count: 2, coords: [77.6480, 12.9100] },
  { area: 'Safe City Cluster - Marathahalli Bridge South', count: 4, coords: [77.6980, 12.9560] },
  { area: 'Safe City Cluster - Marathahalli Bridge North', count: 3, coords: [77.6990, 12.9570] },
  { area: 'Safe City Camera - Whitefield ITPL Main Road', count: 4, coords: [77.7400, 12.9860] },
  { area: 'Safe City Camera - Whitefield Hope Farm Circle', count: 3, coords: [77.7510, 12.9840] },
  { area: 'Safe City Camera - Electronic City Phase 1 Entry', count: 3, coords: [77.6620, 12.8460] },
  { area: 'Safe City Camera - Electronic City Toll Exit', count: 2, coords: [77.6580, 12.8420] },
  { area: 'Safe City Camera - BTM Layout 16th Main', count: 3, coords: [77.6080, 12.9150] },
  { area: 'Safe City Camera - BTM Layout Udupi Garden Junction', count: 4, coords: [77.6140, 12.9180] },
  { area: 'Safe City Camera - Jayanagar 4th Block Complex', count: 3, coords: [77.5830, 12.9280] },
  { area: 'Safe City Camera - Jayanagar 9th Block Circle', count: 2, coords: [77.5940, 12.9230] },
  { area: 'Safe City Camera - JP Nagar Sarakki Junction', count: 4, coords: [77.5780, 12.9070] },
  { area: 'Safe City Camera - Banashankari TTMC Outer', count: 3, coords: [77.5640, 12.9210] },
  { area: 'Safe City Camera - Basavanagudi Netkallappa Circle', count: 2, coords: [77.5740, 12.9360] },
  { area: 'Safe City Camera - Chamarajpet 5th Main', count: 2, coords: [77.5680, 12.9590] },
  { area: 'Safe City Camera - Malleshwaram 8th Cross', count: 3, coords: [77.5700, 12.9990] },
  { area: 'Safe City Camera - Malleshwaram 18th Cross', count: 2, coords: [77.5670, 13.0090] },
  { area: 'Safe City Camera - Sadashivanagar Circle', count: 3, coords: [77.5780, 13.0070] },
  { area: 'Safe City Camera - Hebbal Flyover Entry', count: 4, coords: [77.5930, 13.0340] },
  { area: 'Safe City Camera - Yelahanka Police Station Circle', count: 3, coords: [77.5970, 13.1020] },
  { area: 'Safe City Camera - RT Nagar Ganga Tavern Curve', count: 2, coords: [77.5920, 13.0180] },
  { area: 'Safe City Camera - Banasawadi Outer Ring Road', count: 3, coords: [77.6480, 13.0230] },
  { area: 'Safe City Camera - Indiranagar 100ft Road & 12th Main', count: 4, coords: [77.6400, 12.9730] },
  { area: 'Safe City Camera - Domlur Flyover West', count: 2, coords: [77.6320, 12.9640] },
  { area: 'Safe City Camera - KR Market Main Gate', count: 5, coords: [77.5765, 12.9620] },
  { area: 'Safe City Camera - Vidhana Soudha South Gate', count: 3, coords: [77.5910, 12.9790] }
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
