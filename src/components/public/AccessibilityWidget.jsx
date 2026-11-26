import React, { useState, useEffect } from 'react';
import { Accessibility, Type, RotateCcw, Contrast, Volume2, X } from 'lucide-react';

const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(100);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isGrayscale, setIsGrayscale] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(false);

  useEffect(() => {
    document.documentElement.style.fontSize = `${fontSize}%`;
  }, [fontSize]);

  useEffect(() => {
    document.documentElement.style.filter = [
      isHighContrast ? 'contrast(150%)' : '',
      isGrayscale ? 'grayscale(100%)' : ''
    ].filter(Boolean).join(' ');
  }, [isHighContrast, isGrayscale]);

  useEffect(() => {
    const handleSpeak = (e) => {
      if (!isSpeechEnabled) return;
      const text = e.target.innerText;
      if (text && text.length > 3) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'id-ID';
        window.speechSynthesis.speak(utterance);
      }
    };

    if (isSpeechEnabled) {
      document.addEventListener('click', handleSpeak);
    }
    return () => document.removeEventListener('click', handleSpeak);
  }, [isSpeechEnabled]);

  const resetAll = () => {
    setFontSize(100);
    setIsHighContrast(false);
    setIsGrayscale(false);
    setIsSpeechEnabled(false);
  };

  return (
    <div className="fixed right-4 bottom-24 md:bottom-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 transition-all"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Accessibility className="w-6 h-6 text-white" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white p-4 rounded-lg shadow-xl w-64 flex flex-col gap-3 border border-slate-200">
          <h3 className="font-bold text-sm mb-1">Alat Aksesibilitas</h3>
          <button onClick={() => setFontSize(s => s + 10)} className="flex items-center gap-2 text-sm hover:text-teal-600"><Type size={18} /> Perbesar Teks A+</button>
          <button onClick={() => setFontSize(100)} className="flex items-center gap-2 text-sm hover:text-teal-600"><RotateCcw size={18} /> Reset Ukuran Teks</button>
          <button onClick={() => setIsHighContrast(!isHighContrast)} className="flex items-center gap-2 text-sm hover:text-teal-600"><Contrast size={18} /> Mode Kontras Tinggi</button>
          <button onClick={() => setIsGrayscale(!isGrayscale)} className="flex items-center gap-2 text-sm hover:text-teal-600"><Accessibility size={18} /> Mode Skala Abu-abu</button>
          <button onClick={() => setIsSpeechEnabled(!isSpeechEnabled)} className={`flex items-center gap-2 text-sm ${isSpeechEnabled ? 'text-red-600' : 'hover:text-teal-600'}`}>
            <Volume2 size={18} /> {isSpeechEnabled ? 'Stop Suara' : 'Pembaca Suara'}
          </button>
          <button onClick={resetAll} className="mt-2 text-xs text-gray-500 hover:text-gray-800 underline">Reset Semua</button>
        </div>
      )}
    </div>
  );
};

export default AccessibilityWidget;