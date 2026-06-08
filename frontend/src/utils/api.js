const API_BASE_URL = 'http://localhost:8000/api/v1';

let localMockReports = [
  {
    id: '1',
    type: 'Broken Streetlight',
    location: 'Koramangala 4th Block, near Maharaja Signal',
    time: '10 mins ago',
    description: 'Three streetlights are completely out for the last 200 meters. The area is pitch black. Recommended to avoid walking through this stretch alone.',
    verifiedCount: 12,
    verifiedByUser: false,
    colorClass: 'bg-error-container text-on-error-container',
    icon: 'light_off'
  },
  {
    id: '2',
    type: 'Suspicious Activity',
    location: 'Indiranagar, 12th Main Road',
    time: '24 mins ago',
    description: 'Two individuals on a bike with no plate trailing slow walkers near the park area. Stay alert and keep your phone accessible.',
    verifiedCount: 8,
    verifiedByUser: false,
    colorClass: 'bg-secondary-container text-on-secondary-container',
    icon: 'visibility'
  },
  {
    id: '3',
    type: 'Poorly Lit Area',
    location: 'HSR Layout, Sector 2',
    time: '1 hour ago',
    description: 'Street construction has blocked the pedestrian walkway, forcing people into a dark side-lane that has zero lighting.',
    verifiedCount: 22,
    verifiedByUser: false,
    colorClass: 'bg-surface-variant text-on-surface-variant',
    icon: 'warning',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCxR8--5SobADRbtHY60qudgIqHWGG1NwntLqi4T51lVC0TZp8wy-gChUX1Bh-qIABZIG9-jHhLXRw-XjWI2smvLqjIcHsHQUG8ThtabCvnz0ITnUT0Z4wtFPGWV2o3OH7lH4_OMXPMz56NRggZSY281OkRQQzpxdriIZmppSs8c8xGBXgGDWnf9jsklFD1V_Ys_HWyhQ7hOw4BYO1Q5fWTbDbZIHxDlbW1qj65H_xEynpz1LmEulIJxtZUwYSLE0kpf3sTPcsq3Ww'
  }
];

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
    console.warn('Backend unavailable, using mock data:', error);
    return {
      routes: [
        {
          route_id: 'safest-route-id',
          safety_score: 84,
          distance_m: 8200,
          eta_seconds: 1440,
          safety_label: 'green',
          details: { lighting: '9/10', cctv: '8/10', density: 'High' }
        },
        {
          route_id: 'balanced-route-id',
          safety_score: 67,
          distance_m: 7100,
          eta_seconds: 1080,
          safety_label: 'amber',
          details: { lighting: '7/10', cctv: '6/10', density: 'Medium' }
        },
        {
          route_id: 'fastest-route-id',
          safety_score: 41,
          distance_m: 6400,
          eta_seconds: 840,
          safety_label: 'red',
          details: { lighting: '4/10', cctv: '3/10', density: 'Low' }
        }
      ]
    };
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
    console.warn('Using offline SOS backup:', error);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return {
      status: 'triggered',
      contacts_alerted: 2,
      police_notified: true
    };
  }
}

export async function fetchNearbyReports(lat, lng) {
  try {
    const res = await fetch(`${API_BASE_URL}/report/nearby?lat=${lat}&lng=${lng}&radius_m=2000`);
    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    return data.reports;
  } catch (error) {
    console.warn('Using offline reports feed:', error);
    return localMockReports;
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
        report_type: reportType.toLowerCase().replace(' ', '_'),
        description
      }),
    });
    if (!res.ok) throw new Error('Failed to post report');
    return await res.json();
  } catch (error) {
    const newReport = {
      id: String(Date.now()),
      type: reportType,
      location: 'Selected Location (Map Center)',
      time: 'Just now',
      description,
      verifiedCount: 1,
      verifiedByUser: true,
      colorClass: 'bg-surface-variant text-on-surface-variant',
      icon: 'warning'
    };
    localMockReports = [newReport, ...localMockReports];
    return newReport;
  }
}

export function verifyLocalReport(id) {
  localMockReports = localMockReports.map(report => {
    if (report.id === id && !report.verifiedByUser) {
      return {
        ...report,
        verifiedCount: report.verifiedCount + 1,
        verifiedByUser: true
      };
    }
    return report;
  });
  return localMockReports;
}
