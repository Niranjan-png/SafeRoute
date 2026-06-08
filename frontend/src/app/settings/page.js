'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Settings() {
  const [contacts, setContacts] = useState([]);

  const [routePref, setRoutePref] = useState('safest');
  const [autoSOS, setAutoSOS] = useState(true);
  const [preTripShare, setPreTripShare] = useState(false);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [activeContactId, setActiveContactId] = useState(null);

  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('Mother');
  const [contactPhone, setContactPhone] = useState('');

  const [showDeleteContactConfirm, setShowDeleteContactConfirm] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const [toast, setToast] = useState(null);

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
    setShowAddContactModal(false);
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

    setContacts(prev => prev.map(c => {
      if (c.id === activeContactId) {
        return { ...c, name: contactName, relation: contactRelation, phone: contactPhone };
      }
      return c;
    }));
    setShowEditContactModal(false);
  };

  const openDeleteContactConfirm = (id) => {
    setActiveContactId(id);
    setShowDeleteContactConfirm(true);
  };

  const confirmDeleteContact = () => {
    setContacts(prev => prev.filter(c => c.id !== activeContactId));
    setShowDeleteContactConfirm(false);
    setShowEditContactModal(false);
    setToast('Contact removed successfully.');
    setTimeout(() => setToast(null), 3000);
  };

  const confirmWipeData = () => {
    setContacts([]);
    setRoutePref('safest');
    setAutoSOS(false);
    setPreTripShare(false);
    setShowDeleteDataConfirm(false);
    setToast("All account data wiped successfully.");
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="bg-background text-on-surface min-h-screen font-sans flex flex-col">
      <header className="w-full top-0 sticky z-40 bg-white/75 backdrop-blur-xl shadow-sm h-16 flex justify-between items-center px-4 md:px-8 border-b border-outline-variant/30">
        <Link href="/" className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-3 py-1.5 rounded-xl transition-all active-interaction">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          <span className="text-sm">Back to Map</span>
        </Link>
        <h1 className="font-display font-black text-primary text-base md:text-lg">Settings</h1>
        <div className="w-24 hidden md:block"></div>
      </header>

      <main className="max-w-[620px] mx-auto w-full px-4 md:px-8 py-8 pb-32 space-y-8">
        <section className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-md">
          <div className="mb-6">
            <h2 className="font-display text-lg font-extrabold mb-1">Emergency Contacts</h2>
            <p className="font-body-sm text-xs text-on-surface-variant font-medium">Who should receive live location tracking SMS and SOS alerts?</p>
          </div>
          
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div key={contact.id} className="bg-surface-container-low p-4 rounded-2xl flex justify-between items-center border border-outline-variant/15 hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold shrink-0">
                    <span className="material-symbols-outlined text-[20px]">shield_person</span>
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
              <div className="text-center py-6 border border-dashed border-outline-variant/40 rounded-2xl text-on-surface-variant text-xs font-semibold">
                No trusted contacts added yet. Please add at least one for SOS features.
              </div>
            )}
          </div>

          <button 
            onClick={openAddModal}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white h-12 rounded-2xl font-bold text-sm shadow-md shadow-primary/10 active-interaction transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Contact
          </button>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-outline-variant/20 shadow-md space-y-6">
          <h2 className="font-display text-lg font-extrabold">App Preferences</h2>
          
          <div>
            <label className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider block mb-2">Default Route Option</label>
            <div className="bg-surface-container p-1 rounded-2xl flex gap-1 h-12">
              {['safest', 'balanced', 'fastest'].map((pref) => (
                <button 
                  key={pref}
                  onClick={() => setRoutePref(pref)}
                  className={`flex-1 rounded-xl text-xs font-extrabold capitalize transition-all active-interaction ${
                    routePref === pref ? 'segmented-control-active text-primary' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {pref}
                </button>
              ))}
            </div>
            <p className="mt-2 font-body-sm text-[11px] text-on-surface-variant px-1 font-medium leading-relaxed">
              Calculates safest routes based on active street lighting, CCTV density, and user safety logs in Bangalore.
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
                  onChange={(e) => setAutoSOS(e.target.checked)}
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
                  onChange={(e) => setPreTripShare(e.target.checked)}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </section>

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
                Save Contact
              </button>
            </form>
          </div>
        </div>
      )}

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

      {showDeleteDataConfirm && (
        <div className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full border border-outline-variant/10 slide-up text-center">
            <span className="material-symbols-outlined text-error text-[48px] mb-2 animate-bounce">delete_forever</span>
            <h3 className="font-display font-black text-lg text-on-surface">Wipe All Account Data?</h3>
            <p className="text-on-surface-variant text-sm mt-1.5 leading-relaxed">
              This will permanently delete all your route history and trusted contacts. This action is irreversible.
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

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary text-white px-5 py-3 rounded-2xl flex items-center gap-2.5 z-[100] shadow-2xl font-bold text-sm border border-white/20 slide-up-centered">
          <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
          {toast}
        </div>
      )}
    </div>
  );
}
