export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function getBearing(lat1, lon1, lat2, lon2) {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}

const BENGALURU_STREETS = {
  safest: [
    "Bull Temple Road",
    "DV Gundappa Road",
    "JC Road",
    "Richmond Road",
    "Residency Road",
    "MG Road",
    "Trinity Circle Bypass",
    "Halasuru Road",
    "Old Madras Road",
    "CMH Road",
    "Indiranagar 100 Feet Road"
  ],
  balanced: [
    "Bull Temple Road",
    "Lalbagh Fort Road",
    "Kranthiveera Sangolli Rayanna Rd",
    "Double Road (KH Road)",
    "Hosur Road",
    "Koramangala Inner Ring Road",
    "Domlur Flyover Ramp",
    "Indiranagar 100 Feet Road"
  ],
  fastest: [
    "Bull Temple Road",
    "Kalasipalyam Main Road",
    "Nrupathunga Road",
    "Shivaji Nagar Bypass",
    "Ulsoor Lake Road",
    "Kensington Road",
    "CMH Road",
    "Indiranagar 100 Feet Road"
  ]
};

export function generateDirections(coordinates, routeType = 'safest') {
  if (!coordinates || coordinates.length < 2) return [];

  const directions = [];
  const streets = BENGALURU_STREETS[routeType] || BENGALURU_STREETS.safest;

  directions.push({
    instruction: `Head northeast on ${streets[0]}`,
    distance: Math.round(getDistance(coordinates[0][0], coordinates[0][1], coordinates[1][0], coordinates[1][1])),
    icon: 'north',
    street: streets[0],
    coord: coordinates[0]
  });

  for (let i = 1; i < coordinates.length - 1; i++) {
    const prev = coordinates[i - 1];
    const curr = coordinates[i];
    const next = coordinates[i + 1];

    const bearing1 = getBearing(prev[0], prev[1], curr[0], curr[1]);
    const bearing2 = getBearing(curr[0], curr[1], next[0], next[1]);

    let diff = bearing2 - bearing1;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;

    let turnType = 'straight';
    let icon = 'straight';
    if (diff > 25 && diff <= 120) {
      turnType = 'Turn right';
      icon = 'turn_right';
    } else if (diff > 120) {
      turnType = 'Make a sharp right';
      icon = 'u_turn';
    } else if (diff < -25 && diff >= -120) {
      turnType = 'Turn left';
      icon = 'turn_left';
    } else if (diff < -120) {
      turnType = 'Make a sharp left';
      icon = 'u_turn';
    }

    const dist = Math.round(getDistance(curr[0], curr[1], next[0], next[1]));
    const streetIndex = Math.min(i, streets.length - 1);
    const nextStreet = streets[streetIndex];

    let instruction = '';
    if (turnType === 'straight') {
      instruction = `Continue straight onto ${nextStreet}`;
    } else {
      instruction = `${turnType} onto ${nextStreet}`;
    }

    directions.push({
      instruction,
      distance: dist,
      icon,
      street: nextStreet,
      coord: curr
    });
  }

  directions.push({
    instruction: "You will arrive at your destination",
    distance: 0,
    icon: 'location_on',
    street: "Destination",
    coord: coordinates[coordinates.length - 1]
  });

  return directions;
}
