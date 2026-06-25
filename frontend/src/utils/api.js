const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function fetchRoutes(source, destination) {
  try {
    const res = await fetch(`${API_BASE_URL}/route/options`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, destination }),
    });
    if (!res.ok) throw new Error('API request failed');
    return await res.json();
  } catch (error) {
    console.error('Error fetching routes from API:', error);
    return { routes: [] };
  }
}

export async function triggerSOSEmergency(lat, lng) {
  try {
    const res = await fetch(`${API_BASE_URL}/sos/trigger`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({ lat, lng }),
    });
    if (!res.ok) throw new Error('SOS trigger failed');
    return await res.json();
  } catch (error) {
    console.error('Error triggering SOS:', error);
    return { status: 'failed', error: error.message };
  }
}

export async function fetchNearbyReports(lat, lng) {
  try {
    const res = await fetch(`${API_BASE_URL}/report/nearby?lat=${lat}&lng=${lng}&radius_m=2000`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    return data.reports || [];
  } catch (error) {
    console.error('Error fetching nearby reports:', error);
    return [];
  }
}

export async function postReport(reportType, description, lat, lng) {
  try {
    const res = await fetch(`${API_BASE_URL}/report/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        lat,
        lng,
        report_type: reportType.toLowerCase().replaceAll(' ', '_'),
        description
      }),
    });
    if (!res.ok) throw new Error('Failed to post report');
    return await res.json();
  } catch (error) {
    console.error('Error posting report:', error);
    throw error;
  }
}
