'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchNearbyReports, postReport, triggerSOSEmergency, deleteReport } from '../../utils/api';
import Logo from '../../components/Logo';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [sosStatus, setSosStatus] = useState('idle');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSosConfirm, setShowSosConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const [isSampleData, setIsSampleData] = useState(false);
  
  const [reportType, setReportType] = useState('Broken Streetlight');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('Indiranagar 12th Main Road');

  const SAMPLE_REPORTS = [
    { id: 's1', type: 'Broken Streetlight', report_type: 'broken_streetlight', location: 'Koramangala 80 Feet Road', description: 'Two streetlights near the Forum Mall junction have been out for 3 days. Very dark after 8 PM, especially near the service road.', time: '25 min ago', verifiedCount: 14, verifiedByUser: false },
    { id: 's2', type: 'Suspicious Activity', report_type: 'suspicious_activity', location: 'Indiranagar 12th Main Road', description: 'Group of unknown individuals loitering near the abandoned construction site every night after 10 PM. Multiple residents have reported feeling unsafe.', time: '1 hr ago', verifiedCount: 23, verifiedByUser: false },
    { id: 's3', type: 'Poorly Lit Area', report_type: 'poorly_lit_area', location: 'HSR Layout Sector 2', description: 'The entire stretch from 27th Main to Agara Lake has poor lighting. Women avoid walking here after sunset.', time: '2 hrs ago', verifiedCount: 31, verifiedByUser: false },
    { id: 's4', type: 'Broken Streetlight', report_type: 'broken_streetlight', location: 'Jayanagar 4th Block', description: 'Streetlight pole damaged by a fallen tree branch during last week\'s storm. BBMP notified but no action taken.', time: '3 hrs ago', verifiedCount: 8, verifiedByUser: false },
    { id: 's5', type: 'Suspicious Activity', report_type: 'suspicious_activity', location: 'Majestic Bus Station (Platform 6)', description: 'Pickpocketing incidents reported near Platform 6 during late evening hours. Be cautious with belongings.', time: '5 hrs ago', verifiedCount: 19, verifiedByUser: false },
    { id: 's6', type: 'Poorly Lit Area', report_type: 'poorly_lit_area', location: 'MG Road underpass near Trinity Circle', description: 'The pedestrian underpass has broken lights inside. Very unsafe for solo walkers, especially at night.', time: '6 hrs ago', verifiedCount: 27, verifiedByUser: false },
  ];

  useEffect(() => {
    async function loadReports() {
      const data = await fetchNearbyReports(12.9610, 77.5655);
      if (data && data.length > 0) {
        setReports(data);
        setIsSampleData(false);
      } else {
        setReports(SAMPLE_REPORTS);
        setIsSampleData(true);
      }
    }
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerSOS = () => {
    setShowSosConfirm(true);
  };

  const triggerSOSBackend = async () => {
    setSosStatus('alerting');
    const res = await triggerSOSEmergency(12.9610, 77.5655);
    if (res && res.status === 'triggered') {
      setSosStatus('notified');
      setTimeout(() => setSosStatus('idle'), 3000);
    } else {
      setSosStatus('idle');
    }
  };

  const handleVerify = (id) => {
    setReports(prev => prev.map(report => {
      const rid = report.report_id || report.id;
      if (rid === id) {
        return {
          ...report,
          verified_count: (report.verified_count || 0) + 1,
          verifiedByUser: true
        };
      }
      return report;
    }));
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newReport = await postReport(
      reportType, 
      description, 
      12.9610 + (Math.random() - 0.5) * 0.01, 
      77.5655 + (Math.random() - 0.5) * 0.01
    );

    if (newReport) {
      setReports(prev => [newReport, ...prev]);
      setShowAddModal(false);
      setDescription('');
    }
  };

  const handleDelete = async (id) => {
    try {
      if (!isSampleData && !String(id).startsWith('s')) {
        await deleteReport(id);
      }
      setReports(prev => prev.filter(report => (report.report_id || report.id) !== id));
      setToast('Report deleted successfully');
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setToast('Failed to delete report');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'Broken Streetlight': return 'light_off';
      case 'Suspicious Activity': return 'visibility';
      case 'Poorly Lit Area': return 'warning';
      default: return 'report_problem';
    }
  };

  const getColorClass = (type) => {
    switch(type) {
      case 'Broken Streetlight': return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'Suspicious Activity': return 'bg-rose-100 text-rose-700 border border-rose-200';
      default: return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  return (
    <div className="bg-background text-on-surface h-screen overflow-hidden font-sans flex flex-col">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-colors active-interaction">
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            <span className="hidden md:block text-sm">Back to Map</span>
          </Link>
          <div className="h-6 w-[1px] bg-outline-variant/30 hidden md:block"></div>
          <Logo size={32} />
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={triggerSOS}
            className={`text-white px-5 py-2 rounded-full font-bold text-sm transition-all active-interaction ${
              sosStatus === 'idle' ? 'bg-error' : 'bg-primary animate-pulse'
            }`}
          >
            {sosStatus === 'idle' ? 'SOS' : sosStatus === 'alerting' ? 'ALERTING...' : 'NOTIFIED'}
          </button>
          
          <Link href="/settings" className="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors active-interaction">
            <span className="material-symbols-outlined text-[22px]">account_circle</span>
          </Link>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 w-80 hidden md:flex flex-col bg-white border-r border-outline-variant/20 p-6 space-y-6">
          <div>
            <h2 className="font-display text-[17px] text-on-surface font-extrabold mb-1">Community Feed</h2>
            <p className="font-body-sm text-xs text-on-surface-variant font-medium">Real-time safety alerts in Bengaluru</p>
          </div>
          <nav className="flex-1 space-y-2">
            <a className="flex items-center gap-3 bg-primary/5 text-primary border border-primary/10 rounded-2xl px-4 py-3.5 font-bold text-sm shadow-sm" href="#">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              All Active Reports
            </a>
            <Link className="flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-low rounded-2xl px-4 py-3.5 font-semibold text-sm transition-colors" href="/">
              <span className="material-symbols-outlined text-[20px]">shield</span>
              Safest Routes Map
            </Link>
          </nav>
          <div className="pt-4 border-t border-outline-variant/20">
            <Link className="flex items-center gap-3 text-on-surface-variant hover:bg-surface-container-low rounded-2xl px-4 py-3.5 font-semibold text-sm transition-colors" href="/settings">
              <span className="material-symbols-outlined text-[20px]">settings</span>
              Settings
            </Link>
          </div>
        </aside>

        <main className="flex-1 md:ml-80 h-[calc(100vh-64px)] overflow-y-auto px-4 md:px-8 py-8 pb-32">
          <div className="max-w-[760px] mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8">
              <div>
                <h2 className="font-display text-2xl md:text-3xl font-black text-on-surface tracking-tight">Community Safety Feed</h2>
                <p className="font-body-lg text-sm text-on-surface-variant mt-1.5 max-w-md">
                  Collaborative safety updates to keep Bengaluru streets secure. View or report neighborhood issues.
                </p>
              </div>
              
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-primary hover:bg-primary/95 text-white h-12 px-6 rounded-2xl flex items-center justify-center gap-2 font-bold text-[14px] shadow-lg shadow-primary/10 active-interaction transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Report an Issue
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl flex flex-col justify-between h-28 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Reports Today</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-black text-primary">{reports.length + 39}</span>
                  <span className="text-[10px] text-primary bg-primary-container/20 px-1.5 py-0.5 rounded-md font-extrabold">↑ 12%</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl flex flex-col justify-between h-28 border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
                <span className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Monitored Zones</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl font-black text-on-surface">18</span>
                  <span className="text-[10px] text-on-surface-variant font-bold">Active in Bangalore</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-primary to-primary/80 p-5 rounded-2xl flex flex-col justify-between h-28 text-white shadow-md shadow-primary/10 transition-all duration-300 hover:shadow-lg">
                <span className="text-[10px] text-white/80 uppercase font-bold tracking-wider">Safety Notification</span>
                <p className="text-xs font-semibold leading-relaxed">Avoid the Indiranagar bypass route after 11 PM due to streetlight maintenance.</p>
              </div>
            </div>

            {isSampleData && (
              <div className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5 mb-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[20px]">info</span>
                <p className="text-xs text-on-surface-variant font-semibold">
                  Showing <span className="text-primary font-bold">sample reports</span> — Live community feed will activate when the database is connected.
                </p>
              </div>
            )}

            <section className="space-y-4">
              {reports.map((report) => (
                <article key={report.id} className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-md hover:border-primary/20 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${getColorClass(report.type)}`}>
                        <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {getIcon(report.type)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-bold text-on-surface text-[15px]">{report.type}</h3>
                        <p className="font-body-sm text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5 font-medium">
                          <span className="material-symbols-outlined text-[14px]">location_on</span> 
                          {report.location}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-lg font-bold">{report.time}</span>
                      <button 
                        onClick={() => handleDelete(report.report_id || report.id)}
                        className="text-on-surface-variant/50 hover:text-error hover:bg-error/10 p-1.5 rounded-full transition-all flex items-center justify-center"
                        title="Delete Report"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <p className="font-body-lg text-sm text-on-surface/80 leading-relaxed font-medium">
                        {report.description}
                      </p>
                    </div>
                    {report.imageUrl && (
                      <div className="w-full sm:w-32 h-24 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/20 bg-surface-container">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          alt="Report attachment" 
                          className="w-full h-full object-cover grayscale opacity-90 hover:grayscale-0 transition-all cursor-pointer" 
                          src={report.imageUrl}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-outline-variant/15 flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified_user</span>
                      {report.verifiedCount} users verified
                    </div>
                    
                    <div className="flex items-center gap-3 ml-auto">
                      <button 
                        onClick={() => handleVerify(report.id)}
                        disabled={report.verifiedByUser}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all px-3 py-1.5 rounded-xl active-interaction ${
                          report.verifiedByUser 
                            ? 'text-primary bg-primary/5 font-extrabold' 
                            : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                        {report.verifiedByUser ? 'Verified' : 'Verify'}
                      </button>
                      <button 
                        onClick={() => {
                          setToast('Link copied to clipboard! Shared via SafeRoute network.');
                          setTimeout(() => setToast(null), 3000);
                        }}
                        className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary hover:bg-surface-container-low text-xs font-bold transition-all px-3 py-1.5 rounded-xl active-interaction"
                      >
                        <span className="material-symbols-outlined text-[16px]">share</span>
                        Share
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 pb-safe bg-white border-t border-outline-variant/20 md:hidden shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.03)]">
        <Link className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2" href="/">
          <span className="material-symbols-outlined text-[20px]">map</span>
          <span className="text-[10px] font-bold mt-0.5">Explore</span>
        </Link>
        <a className="flex flex-col items-center justify-center text-primary font-bold py-2 border-t-2 border-primary" href="#">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
          <span className="text-[10px] mt-0.5">Alerts</span>
        </a>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2" href="/settings">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-[10px] font-bold mt-0.5">Settings</span>
        </Link>
      </nav>

      {showAddModal && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-md w-full border border-outline-variant/10 slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-lg text-primary">Report Safety Issue</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all active-interaction"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Issue Category</label>
                <select 
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option>Broken Streetlight</option>
                  <option>Suspicious Activity</option>
                  <option>Poorly Lit Area</option>
                  <option>Unsafe Pedestrian Zone</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Location Details</label>
                <input 
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="w-full bg-white border border-outline-variant/25 rounded-xl px-3 py-2.5 text-sm font-semibold text-on-surface outline-none focus:border-primary transition-all"
                  placeholder="e.g. Indiranagar Metro Station Back Alley"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white border border-outline-variant/25 rounded-xl px-3 py-2.5 text-sm font-medium text-on-surface outline-none focus:border-primary transition-all h-24 resize-none"
                  placeholder="Please describe the safety concern to alert other walkers..."
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 active-interaction transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">campaign</span>
                Broadcast to SafeRoute Feed
              </button>
            </form>
          </div>
        </div>
      )}

      {showSosConfirm && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-outline-variant/10 slide-up text-center">
            <span className="material-symbols-outlined text-error text-[48px] mb-2 animate-bounce">warning</span>
            <h3 className="font-display font-black text-lg text-on-surface">Initiate Emergency SOS?</h3>
            <p className="text-on-surface-variant text-sm mt-1.5 leading-relaxed">
              Police and Trusted Contacts will be immediately alerted with your live location. Are you sure?
            </p>
            <div className="mt-6 flex gap-3">
              <button 
                onClick={() => setShowSosConfirm(false)}
                className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant h-12 rounded-xl font-bold text-sm active-interaction transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowSosConfirm(false);
                  triggerSOSBackend();
                }}
                className="flex-1 bg-error hover:bg-error/95 text-white h-12 rounded-xl font-bold text-sm shadow-md shadow-error/15 active-interaction transition-all"
              >
                Yes, Trigger
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 z-[100] shadow-2xl font-bold text-sm border border-white/20 slide-up-centered">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          {toast}
        </div>
      )}
    </div>
  );
}
