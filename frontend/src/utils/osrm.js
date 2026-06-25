/**
 * OSRM (Open Source Routing Machine) integration for real road-following routes.
 * Uses the free demo API to get actual road geometries from OpenStreetMap data.
 */

const OSRM_BASE = 'https://router.project-osrm.org/route/v1';

/**
 * Fetch road-following routes from OSRM.
 * @param {{ lat: number, lng: number }} source
 * @param {{ lat: number, lng: number }} destination
 * @param {'foot'|'bike'|'car'} profile - Routing profile
 * @returns {Promise<Array<{ coordinates: [number,number][], distance_m: number, duration_s: number }>>}
 */
export async function fetchOSRMRoutes(source, destination, profile = 'foot') {
  // Map our transit modes to OSRM profiles
  const osrmProfile = profile === 'bike' || profile === 'biking' 
    ? 'bike' 
    : profile === 'car' || profile === 'driving' 
      ? 'car' 
      : 'foot';

  const url = `${OSRM_BASE}/${osrmProfile}/${source.lng},${source.lat};${destination.lng},${destination.lat}?alternatives=true&geometries=geojson&overview=full&steps=true`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`OSRM request failed: ${res.status}`);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('OSRM returned no routes:', data.code);
      return [];
    }

    return data.routes.map(route => {
      // Keep OSRM [lng, lat] for MapLibre
      const coordinates = route.geometry.coordinates;
      
      // Extract step-by-step directions
      const steps = [];
      if (route.legs) {
        route.legs.forEach(leg => {
          if (leg.steps) {
            leg.steps.forEach(step => {
              if (step.maneuver) {
                steps.push({
                  instruction: formatInstruction(step),
                  distance: Math.round(step.distance),
                  duration: Math.round(step.duration),
                  type: step.maneuver.type,
                  modifier: step.maneuver.modifier,
                  name: step.name || '',
                  coord: step.maneuver.location 
                    ? [step.maneuver.location[0], step.maneuver.location[1]] 
                    : null,
                });
              }
            });
          }
        });
      }

      return {
        coordinates,
        distance_m: route.distance,
        duration_s: route.duration,
        steps,
      };
    });
  } catch (error) {
    console.error('Error fetching OSRM routes:', error);
    return [];
  }
}

/**
 * Format an OSRM step into a human-readable instruction.
 */
function formatInstruction(step) {
  const type = step.maneuver?.type || '';
  const modifier = step.maneuver?.modifier || '';
  const name = step.name || 'the road';

  switch (type) {
    case 'depart':
      return `Start on ${name}`;
    case 'arrive':
      return 'You have arrived at your destination';
    case 'turn':
      return `Turn ${modifier} onto ${name}`;
    case 'new name':
      return `Continue onto ${name}`;
    case 'merge':
      return `Merge ${modifier} onto ${name}`;
    case 'fork':
      return `Keep ${modifier} onto ${name}`;
    case 'roundabout':
      return `Enter roundabout, exit onto ${name}`;
    case 'end of road':
      return `Turn ${modifier} onto ${name}`;
    case 'continue':
      return `Continue on ${name}`;
    default:
      if (modifier) return `${modifier.charAt(0).toUpperCase() + modifier.slice(1)} on ${name}`;
      return `Continue on ${name}`;
  }
}

/**
 * Map OSRM maneuver type/modifier to a Material Symbols icon name.
 */
export function getStepIcon(step) {
  const type = step.type || '';
  const modifier = step.modifier || '';

  if (type === 'depart') return 'trip_origin';
  if (type === 'arrive') return 'location_on';
  
  if (modifier.includes('left')) return 'turn_left';
  if (modifier.includes('right')) return 'turn_right';
  if (modifier.includes('straight')) return 'straight';
  if (type === 'roundabout') return 'roundabout_right';
  
  return 'straight';
}
