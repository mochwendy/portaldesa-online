import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { PhoneCall, MessageCircle, ShieldAlert, X, Phone } from 'lucide-react';

export default function EmergencyWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContacts = async () => {
      try {
        const data = await base44.entities.KontakDarurat.list('urutan', 100);
        setContacts(data.filter(c => c.aktif === true || c.aktif === 'true'));
      } catch (e) {
        console.error('Failed to load emergency contacts:', e);
      } finally {
        setLoading(false);
      }
    };
    loadContacts();
  }, []);

  const makePhoneCall = (number) => {
    window.open(`tel:${number}`, '_self');
  };

  const openWhatsApp = (number) => {
    const cleanNumber = number.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanNumber}`, '_blank');
  };

  if (loading || contacts.length === 0) {
    return null;
  }

  return (
    <div className="fixed left-4 bottom-24 md:bottom-6 z-50">
      <div className="flex flex-col items-end gap-2">
        {isOpen && (
          <div className="bg-white rounded-2xl shadow-xl border border-rose-100 w-72 md:w-80 overflow-hidden animate-slide-in-right">
            <div className="bg-rose-600 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" />
                <span className="font-semibold">Nomor Darurat Desa</span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
              {contacts.map((contact) => (
                <div key={contact.id} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{contact.nama_layanan}</p>
                      <p className="text-xs text-slate-500">{contact.nama_petugas} — {contact.jabatan}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-rose-100 text-rose-700 rounded-full">
                        {contact.kategori}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {contact.no_telepon && (
                      <button
                        onClick={() => makePhoneCall(contact.no_telepon)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors"
                      >
                        <PhoneCall className="w-4 h-4" />
                        Telepon
                      </button>
                    )}
                    {contact.no_whatsapp && (
                      <button
                        onClick={() => openWhatsApp(contact.no_whatsapp)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg rounded-full px-4 py-3 flex items-center gap-2 transition-all duration-200 hover:shadow-xl"
          aria-label={isOpen ? 'Tutup nomor darurat' : 'Buka nomor darurat'}
        >
          <ShieldAlert className="w-5 h-5" />
          <span className="hidden sm:inline font-medium">Darurat</span>
        </button>
      </div>
      <style jsx global>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.2s ease-out; }
      `}</style>
    </div>
  );
}