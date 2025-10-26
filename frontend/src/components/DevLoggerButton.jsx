import React, { useEffect, useState } from 'react';

export default function DevLoggerButton() {
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      setShow(params.get('devlog') === 'true' || params.has('devlog'));
    } catch (e) {
      setShow(false);
    }
  }, []);

  const handleExport = () => {
    if (window.exportSnitchLogs) {
      try {
        window.exportSnitchLogs();
        setToast(true);
        setTimeout(() => setToast(false), 3000);
      } catch (e) {
        console.error('Export failed', e);
        alert('Export failed: ' + e.message);
      }
    } else {
      console.warn('Snitch logger not loaded.');
      alert('Snitch logger not loaded.');
    }
  };

  if (!show) return null;

  return (
    <>
      <button
        onClick={handleExport}
        className="fixed bottom-5 right-5 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 z-50 transition"
      >
        🧠 Export Logs
      </button>
      {toast && (
        <div className="fixed bottom-16 right-5 bg-gray-800 text-white text-sm px-3 py-2 rounded shadow-lg z-50 animate-fade-in">
          ✅ Snitch API logs exported successfully!
        </div>
      )}
    </>
  );
}
