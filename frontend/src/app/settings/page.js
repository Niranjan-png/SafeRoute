'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from '../../components/Logo';

export default function Settings() {
  // State variables for settings
  const [contacts, setContacts] = useState([]);
  const [sosMessage, setSosMessage] = useState('Emergency! I need help. Please track my live location.');
  const [routePref, setRoutePref] = useState('safest');
  const [autoSOS, setAutoSOS] = useState(true);
  const [preTripShare, setPreTripShare] = useState(false);

  // Dirty state tracking to control the Save button
  const [isDirty, setIsDirty] = useState(false);

  // Modal controls
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [activeContactId, setActiveContactId] = useState(null);

  // Form states for contact operations
  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('Mother');
  const [contactPhone, setContactPhone] = useState('');

  // Confirmation dialog controls
  const [showDeleteContactConfirm, setShowDeleteContactConfirm] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const [toast, setToast] = useState(null);

  // Load configuration from local storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedContacts = localStorage.getItem('emergency_contacts');
      if (savedContacts) {
        try {
          setContacts(JSON.parse(savedContacts));
        } catch (e) {
          console.error('Error parsing contacts from localStorage', e);
        }
      }

      const savedMessage = localStorage.getItem('sos_custom_message');
      if (savedMessage) {
        setSosMessage(savedMessage);
      }

      const savedRoutePref = localStorage.getItem('route_preference');
      if (savedRoutePref) {
        setRoutePref(savedRoutePref);
      }

      const savedAutoSOS = localStorage.getItem('auto_sos');
      if (savedAutoSOS !== null) {
        setAutoSOS(savedAutoSOS === 'true');
      }

      const savedPreTripShare = localStorage.getItem('pre_trip_share');
      if (savedPreTripShare !== null) {
        setPreTripShare(savedPreTripShare === 'true');
      }
    }
  }, []);

  // Save everything to localStorage
  const handleSaveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('emergency_contacts', JSON.stringify(contacts));
      localStorage.setItem('sos_custom_message', sosMessage);
      localStorage.setItem('route_preference', routePref);
      localStorage.setItem('auto_sos', autoSOS.toString());
      localStorage.setItem('pre_trip_share', preTripShare.toString());

      setIsDirty(false);
      showToast('Settings saved successfully!');
    }
  };

  // Revert local state to factory default settings
  const handleResetSettings = () => {
    setContacts([]);
    setSosMessage('Emergency! I need help. Please track my live location.');
    setRoutePref('safest');
    setAutoSOS(true);
    setPreTripShare(false);
    setIsDirty(true);
    showToast('Settings reset to default values. Don\'t forget to save.');
  };

  // Helper to trigger custom toast notification
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // Contact list state modifiers (do not save to localStorage until "Save Settings" is clicked)
  const openAddModal = () => {
    setContactName('');
    setContactRelation('Mother');
    setContactPhone('');
    setShowAddContactModal(true);
  };

  const handleAddContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    const newContact = {
      id: Date.now(),
      name: contactName,
      relation: contactRelation,
      phone: contactPhone
    };

    setContacts([...contacts, newContact]);
    setIsDirty(true);
    setShowAddContactModal(false);
    showToast('Contact added to list (unsaved changes).');
  };

  const openEditModal = (contact) => {
    setActiveContactId(contact.id);
    setContactName(contact.name);
    setContactRelation(contact.relation);
    setContactPhone(contact.phone);
    setShowEditContactModal(true);
  };

  const handleEditContactSubmit = (e) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;

    const updated = contacts.map(c => {
      if (c.id === activeContactId) {
        return { ...c, name: contactName, relation: contactRelation, phone: contactPhone };
      }
      return c;
    });

    setContacts(updated);
    setIsDirty(true);
    setShowEditContactModal(false);
    showToast('Contact updated in list (unsaved changes).');
  };

  const openDeleteContactConfirm = (id) => {
    setActiveContactId(id);
    setShowDeleteContactConfirm(true);
  };

  const confirmDeleteContact = () => {
    setContacts(contacts.filter(c => c.id !== activeContactId));
    setIsDirty(true);
    setShowDeleteContactConfirm(false);
    setShowEditContactModal(false);
    showToast('Contact removed from list (unsaved changes).');
  };

  // Wipe data immediately (destructive option)
  const confirmWipeData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('emergency_contacts');
      localStorage.removeItem('sos_custom_message');
      localStorage.removeItem('route_preference');
      localStorage.removeItem('auto_sos');
      localStorage.removeItem('pre_trip_share');
    }

    setContacts([]);
    setSosMessage('Emergency! I need help. Please track my live location.');
    setRoutePref('safest');
    setAutoSOS(true);
    setPreTripShare(false);
    setIsDirty(false);
    setShowDeleteDataConfirm(false);
    showToast('All browser cached safety data wiped.');
  };

  return (
    <div className="bg-background text-on-surface h-screen overflow-y-auto font-sans flex flex-col">
      {/* Sticky Header */}
      <header className="w-full top-0 sticky z-40 bg-white/80 backdrop-blur-md shadow-sm h-16 flex justify-between items-center px-4 md:px-8 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-all active-interaction">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          <span className="text-sm">Back to Map</span>
        </Link>
        <Logo size={32} />
        <div className="w-24 hidden md:block"></div>
      </header>

      <main className="max-w-[620px] mx-auto w-full px-4 md:px-8 py-8 pb-32 space-y-6">
        {/* Title and Intro */}
        <div>
          <h1 className="font-display text-2xl font-black text-on-surface tracking-tight">Safety Dashboard</h1>
          <p className="font-body-sm text-xs text-on-surface-variant font-medium mt-1">Configure your personal security network and navigation behavior.</p>
        </div>

        {/* Section 1: Emergency Contacts */}
        <section className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-md">
          <div className="mb-5">
            <h2 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">shield_person</span>
              Emergency Contacts
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant font-medium mt-0.5">Who should receive live location tracking SMS and SOS alerts?</p>
          </div>

          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-surface-container-low p-4 rounded-2xl flex justify-between items-center border border-outline-variant/15 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shrink-0">
                    <span className="material-symbols-outlined text-[20px]">contacts</span>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm leading-tight">{contact.name}</p>
                    <p className="text-[11px] text-on-surface-variant font-semibold mt-1">
                      {contact.relation} • <span className="font-mono">{contact.phone}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => openEditModal(contact)}
                  className="w-9 h-9 rounded-xl hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors active-interaction shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            ))}

            {contacts.length === 0 && (
              <div className="text-center py-8 border border-dashed border-outline-variant/40 rounded-2xl text-on-surface-variant text-xs font-semibold">
                No trusted contacts added yet. Please add at least one for SOS features.
              </div>
            )}
          </div>

          <button
            onClick={openAddModal}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/15 text-primary h-12 rounded-2xl font-bold text-sm active-interaction transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add Safety Contact
          </button>

          {/* Custom SOS Message Input */}
          <div className="mt-6 pt-6 border-t border-outline-variant/15">
            <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-2">Custom SOS Alert Message</label>
            <textarea
              rows={2}
              className="w-full bg-surface-container-low border border-outline-variant/20 rounded-xl p-3 text-xs font-semibold text-on-surface outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              placeholder="E.g., Emergency! I need help. Please track my live location."
              value={sosMessage}
              onChange={(e) => {
                setSosMessage(e.target.value);
                setIsDirty(true);
              }}
            />
            <p className="mt-1.5 font-body-sm text-[10px] text-on-surface-variant leading-relaxed font-medium">
              This message will be attached to the SMS alert sent to your trusted contacts, along with your live location.
            </p>

            {/* Live Message Preview */}
            <div className="mt-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] text-on-surface-variant uppercase font-bold tracking-wider">SMS Alert Preview</span>
                <span className="text-[9px] bg-primary/15 text-primary font-bold px-2 py-0.5 rounded-full">Real-time preview</span>
              </div>
              <div className="bg-white border border-outline-variant/10 p-3 rounded-xl shadow-inner font-mono text-[11px] text-on-surface-variant select-all cursor-text leading-relaxed">
                <p className="font-semibold text-[10px] text-on-surface mb-1">To: <span className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-sans text-[9px] font-bold">Trusted Contacts</span></p>
                <div className="mt-1.5 text-on-surface-variant border-l-2 border-primary pl-2.5 italic">
                  "{sosMessage || 'Emergency! I need help.'}"
                  <br />
                  <span className="text-primary font-bold text-[10px] not-italic select-none hover:underline">https://saferoute.blr/track/live-12345</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: App Preferences */}
        <section className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-md space-y-5">
          <div>
            <h2 className="font-display text-base font-extrabold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">settings_accessibility</span>
              App Preferences
            </h2>
            <p className="font-body-sm text-[11px] text-on-surface-variant font-medium mt-0.5">Customize your navigation algorithm and safety behaviors.</p>
          </div>

          <div>
            <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-2">Default Route Option</label>
            <div className="bg-surface-container p-1 rounded-2xl flex gap-1 h-12">
              {['safest', 'balanced', 'fastest'].map((pref) => (
                <button
                  key={pref}
                  onClick={() => {
                    setRoutePref(pref);
                    setIsDirty(true);
                  }}
                  className={`flex-1 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${
                    routePref === pref ? 'segmented-control-active text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
            <p className="mt-2 font-body-sm text-[10px] text-on-surface-variant px-1 font-medium leading-relaxed">
              Safest prioritizes lit streets and CCTV; Balanced compromises safety and distance; Fastest selects the shortest road distance.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between py-2 border-t border-outline-variant/10">
              <div className="max-w-[78%]">
                <p className="font-bold text-sm text-on-surface">Auto-SOS triggers</p>
                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5 leading-relaxed">
                  Automatically ping emergency contacts if a significant routing detour or delay is detected.
                </p>
              </div>
              <label className="switch shrink-0">
                <input
                  type="checkbox"
                  checked={autoSOS}
                  onChange={(e) => {
                    setAutoSOS(e.target.checked);
                    setIsDirty(true);
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-outline-variant/10">
              <div className="max-w-[78%]">
                <p className="font-bold text-sm text-on-surface">Pre-trip location sharing</p>
                <p className="text-[11px] text-on-surface-variant font-medium mt-0.5 leading-relaxed">
                  Instantly broadcast your live tracking link to emergency contacts when a walk begins.
                </p>
              </div>
              <label className="switch shrink-0">
                <input
                  type="checkbox"
                  checked={preTripShare}
                  onChange={(e) => {
                    setPreTripShare(e.target.checked);
                    setIsDirty(true);
                  }}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </section>

        {/* Section 3: Save Action Bar */}
        <section className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-md flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Save & Sync Settings</h3>
              <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">Commit current settings and numbers to your browser cache.</p>
            </div>
            {isDirty ? (
              <span className="bg-amber-100 text-amber-800 font-extrabold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider animate-pulse border border-amber-200">
                Unsaved Changes
              </span>
            ) : (
              <span className="bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1 border border-primary/20">
                <span className="material-symbols-outlined text-[10px]">cloud_done</span>
                Up to date
              </span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleResetSettings}
              className="flex-1 h-12 border border-outline-variant/30 hover:bg-surface-container rounded-2xl font-bold text-sm text-on-surface-variant transition-all active-interaction flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              Reset Defaults
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={!isDirty}
              className={`flex-[2] h-12 rounded-2xl font-bold text-sm transition-all active-interaction flex items-center justify-center gap-2 ${
                isDirty
                  ? 'bg-primary hover:bg-primary/95 text-white shadow-lg shadow-primary/15 hover:-translate-y-[1px]'
                  : 'bg-surface-container text-on-surface-variant border border-outline-variant/10 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {isDirty ? 'save' : 'check_circle'}
              </span>
              {isDirty ? 'Save Settings' : 'Settings Saved'}
            </button>
          </div>
        </section>

        {/* Section 4: Danger Zone */}
        <section className="bg-red-500/5 p-6 rounded-3xl border border-error/20 shadow-sm">
          <h3 className="font-display text-sm font-extrabold text-error mb-2">Danger Zone</h3>
          <button
            onClick={() => setShowDeleteDataConfirm(true)}
            className="w-full text-left p-4 bg-white rounded-2xl border border-error/15 flex items-center gap-3 hover:bg-error/5 transition-all active-interaction"
          >
            <span className="material-symbols-outlined text-error text-[20px]">delete_sweep</span>
            <div>
              <p className="font-bold text-xs text-error">Clear Local Account Data</p>
              <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">Permanently delete route logs, saved settings, and all contacts.</p>
            </div>
          </button>
        </section>
      </main>

      {/* Mobile Navigation bar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center h-16 bg-white border-t border-outline-variant/20 z-50">
        <Link className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2" href="/">
          <span className="material-symbols-outlined text-[20px]">map</span>
          <span className="text-[10px] font-bold mt-0.5">Explore</span>
        </Link>
        <Link className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-colors py-2" href="/reports">
          <span className="material-symbols-outlined text-[20px]">group</span>
          <span className="text-[10px] font-bold mt-0.5">Reports</span>
        </Link>
        <a className="flex flex-col items-center justify-center text-primary font-bold py-2 border-t-2 border-primary" href="#">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>settings</span>
          <span className="text-[10px] mt-0.5">Settings</span>
        </a>
      </nav>

      {/* Add Contact Modal */}
      {showAddContactModal && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-outline-variant/10 slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-lg text-primary">Add Trusted Contact</h3>
              <button
                onClick={() => setShowAddContactModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all active-interaction"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-white border border-outline-variant/25 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary transition-all"
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Relationship</label>
                <select
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option>Mother</option>
                  <option>Father</option>
                  <option>Partner</option>
                  <option>Sibling</option>
                  <option>Friend</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-white border border-outline-variant/25 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary transition-all"
                  placeholder="e.g. +91 98765 43210"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary/95 text-white h-12 rounded-xl font-bold text-sm shadow-lg shadow-primary/10 active-interaction transition-all"
              >
                Done Editing
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {showEditContactModal && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-outline-variant/10 slide-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-black text-lg text-primary">Edit Contact</h3>
              <button
                onClick={() => setShowEditContactModal(false)}
                className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-all active-interaction"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleEditContactSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Full Name</label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full bg-white border border-outline-variant/25 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Relationship</label>
                <select
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/20 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option>Mother</option>
                  <option>Father</option>
                  <option>Partner</option>
                  <option>Sibling</option>
                  <option>Friend</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-white border border-outline-variant/25 rounded-xl px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary transition-all"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => openDeleteContactConfirm(activeContactId)}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/15 text-error h-12 rounded-xl font-bold text-sm active-interaction transition-all flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/95 text-white h-12 rounded-xl font-bold text-sm shadow-md active-interaction transition-all"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Single Contact Confirmation */}
      {showDeleteContactConfirm && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-outline-variant/10 slide-up text-center">
            <span className="material-symbols-outlined text-error text-[48px] mb-2 animate-bounce">delete</span>
            <h3 className="font-display font-black text-lg text-on-surface">Delete Contact?</h3>
            <p className="text-on-surface-variant text-sm mt-1.5 leading-relaxed">
              Are you sure you want to remove this trusted emergency contact?
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteContactConfirm(false)}
                className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant h-12 rounded-xl font-bold text-sm active-interaction transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteContact}
                className="flex-1 bg-error hover:bg-error/95 text-white h-12 rounded-xl font-bold text-sm shadow-md shadow-error/15 active-interaction transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe All Data Confirmation */}
      {showDeleteDataConfirm && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-outline-variant/10 slide-up text-center">
            <span className="material-symbols-outlined text-error text-[48px] mb-2 animate-bounce">delete_forever</span>
            <h3 className="font-display font-black text-lg text-on-surface">Wipe All Account Data?</h3>
            <p className="text-on-surface-variant text-sm mt-1.5 leading-relaxed">
              This will permanently delete all your route history and trusted contacts from this browser. This action is irreversible.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowDeleteDataConfirm(false)}
                className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface-variant h-12 rounded-xl font-bold text-sm active-interaction transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmWipeData}
                className="flex-1 bg-error hover:bg-error/95 text-white h-12 rounded-xl font-bold text-sm shadow-md shadow-error/15 active-interaction transition-all"
              >
                Yes, Wipe All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Elegant Success Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 z-[100] shadow-2xl font-bold text-sm border border-white/20 slide-up-centered">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          {toast}
        </div>
      )}
    </div>
  );
}
