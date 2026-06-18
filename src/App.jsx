import { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  MapPin,
  Layers,
  ClipboardCheck,
  BarChart3,
  Search,
  Plus,
  Calendar,
  Bell,
  LogOut,
  Filter,
  ArrowUpRight,
  ShieldAlert,
  Sliders,
  Tv,
  Users2,
  Sun,
  Moon,
  Pencil,
  Trash2,
  X,
  UserCog,
  Menu
} from 'lucide-react';
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
  Legend
} from 'recharts';

import api from './api';

// ----- Helpers for French dates -----
const FR_DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const FR_MONTHS = ['janvier', 'fÃ©vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aoÃ»t', 'septembre', 'octobre', 'novembre', 'dÃ©cembre'];

function getMondayOf(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  dt.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
  return dt;
}

function toInputDate(d) { return d.toISOString().split('T')[0]; }

function buildWeekDays(mondayStr) {
  const base = new Date(mondayStr + 'T12:00:00');
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return `${FR_DAYS[d.getDay()]} ${d.getDate()} ${FR_MONTHS[d.getMonth()]}`;
  });
}

function buildPeriodLabel(mondayStr) {
  const d = new Date(mondayStr + 'T12:00:00');
  const e = new Date(d); e.setDate(e.getDate() + 5);
  return `Semaine du ${d.getDate()} au ${e.getDate()} ${FR_MONTHS[e.getMonth()]} ${e.getFullYear()}`;
}

const PDF_SLOTS = ['8h-10h', '10h-12h', '14h-16h', '16h-18h'];
const TT_CLASSES = ['TC1', 'TC2', 'L3 ISI', 'L3 IRS'];

function makeEmptySchedules() {
  const s = {};
  TT_CLASSES.forEach(cls => {
    s[cls] = {};
    for (let d = 0; d < 6; d++) {
      s[cls][d] = {};
      for (let sl = 0; sl < 4; sl++) s[cls][d][sl] = null;
    }
  });
  return s;
}

// --- Weekly Timetable Component ---------------------------------------
function EmploiDuTempsView({ darkMode, filterClass, timetables, setTimetables, onDataChange }) {
  const [ttFilterClass, setTtFilterClass] = useState('');
  const targetClasses = filterClass
    ? [filterClass]
    : (ttFilterClass ? [ttFilterClass] : TT_CLASSES);

  // -- Real system date: Monday of current week --
  const todayMonday = getMondayOf(new Date());
  const [startDateStr, setStartDateStr] = useState(toInputDate(todayMonday));
  const weekDays = buildWeekDays(startDateStr);
  const periodLabel = buildPeriodLabel(startDateStr);

  // -- Saved timetables (history) --
  const savedTimetables = timetables || [];
  const [expandedId, setExpandedId] = useState(null);

  // -- New timetable creation panel --
  const [showForm, setShowForm] = useState(false);
  const [newSchedules, setNewSchedules] = useState(makeEmptySchedules);
  const [newNotes, setNewNotes] = useState({});

  // -- Session modal (shared for new + saved) --
  const [sessionModal, setSessionModal] = useState({ open: false, mode: 'new', ttId: null, cls: null, dayIdx: null, slotIdx: null, data: { subject: '', type: 'Cours', teacher: '', room: '' } });

  const openSessionModal = (mode, ttId, cls, dayIdx, slotIdx, existing) => {
    setSessionModal({ open: true, mode, ttId, cls, dayIdx, slotIdx, data: existing ? { ...existing } : { subject: '', type: 'Cours', teacher: '', room: '' } });
  };

  const saveSession = async () => {
    const { mode, ttId, cls, dayIdx, slotIdx, data } = sessionModal;
    if (mode === 'new') {
      setNewSchedules(prev => {
        const n = JSON.parse(JSON.stringify(prev));
        if (!n[cls]) n[cls] = {};
        if (!n[cls][dayIdx]) n[cls][dayIdx] = {};
        n[cls][dayIdx][slotIdx] = { ...data };
        return n;
      });
      setSessionModal(m => ({ ...m, open: false }));
    } else {
      const tt = savedTimetables.find(t => t.id === ttId);
      if (!tt) return;
      const updatedSchedules = JSON.parse(JSON.stringify(tt.schedules));
      if (!updatedSchedules[cls]) updatedSchedules[cls] = {};
      if (!updatedSchedules[cls][dayIdx]) updatedSchedules[cls][dayIdx] = {};
      updatedSchedules[cls][dayIdx][slotIdx] = { ...data };

      try {
        const updated = await api.updateTimetable(ttId, {
          ...tt,
          schedules: updatedSchedules
        });
        setTimetables(prev => prev.map(t => t.id === ttId ? updated : t));
        setSessionModal(m => ({ ...m, open: false }));
        if (onDataChange) onDataChange();
      } catch (err) {
        alert("Erreur lors de la modification de la sÃ©ance: " + err.message);
      }
    }
  };

  const removeSession = async () => {
    const { mode, ttId, cls, dayIdx, slotIdx } = sessionModal;
    if (mode === 'new') {
      setNewSchedules(prev => {
        const n = JSON.parse(JSON.stringify(prev));
        if (n[cls]?.[dayIdx]) n[cls][dayIdx][slotIdx] = null;
        return n;
      });
      setSessionModal(m => ({ ...m, open: false }));
    } else {
      const tt = savedTimetables.find(t => t.id === ttId);
      if (!tt) return;
      const updatedSchedules = JSON.parse(JSON.stringify(tt.schedules));
      if (updatedSchedules[cls]?.[dayIdx]) updatedSchedules[cls][dayIdx][slotIdx] = null;

      try {
        const updated = await api.updateTimetable(ttId, {
          ...tt,
          schedules: updatedSchedules
        });
        setTimetables(prev => prev.map(t => t.id === ttId ? updated : t));
        setSessionModal(m => ({ ...m, open: false }));
        if (onDataChange) onDataChange();
      } catch (err) {
        alert("Erreur lors de la suppression de la sÃ©ance: " + err.message);
      }
    }
  };

  // -- Save new timetable to history --
  const handleSaveTimetable = async () => {
    const newTT = {
      period: periodLabel,
      startDate: startDateStr,
      start_date: startDateStr,
      days: [...weekDays],
      schedules: newSchedules,
      notes: newNotes
    };
    try {
      const created = await api.createTimetable(newTT);
      setTimetables(prev => [created, ...prev]);
      setNewSchedules(makeEmptySchedules());
      setNewNotes({});
      setShowForm(false);
      if (onDataChange) onDataChange();
    } catch (err) {
      alert("Erreur lors de la crÃ©ation de l'emploi du temps: " + err.message);
    }
  };

  // -- Shared PDF page renderer --
  const drawTimetablePage = (pdf, tt, cls, logoImg) => {
    const pw = pdf.internal.pageSize.getWidth();
    const ph = pdf.internal.pageSize.getHeight();

    const blueLight = [156, 194, 229];
    const blueLighter = [221, 235, 247];
    const white = [255, 255, 255];
    const black = [0, 0, 0];
    const red = [192, 0, 0];
    const gold = [255, 200, 0];

    // -- ESI Logo --
    if (logoImg) {
      const logoW = 16; const logoH = 16;
      pdf.addImage(logoImg, 'JPEG', pw / 2 - logoW / 2, 6, logoW, logoH);
    }

    // -- Header --
    pdf.setFontSize(10); pdf.setFont(undefined, 'bold');
    pdf.text('UniversitÃ© Nazi BONI', 12, 10, { align: 'left' });
    pdf.text('Ã‰cole SupÃ©rieure d\'Informatique', 12, 16, { align: 'left' });
    pdf.text('Burkina Faso', pw - 12, 10, { align: 'right' });
    pdf.text('La Patrie ou la Mort, nous Vaincrons', pw - 12, 16, { align: 'right' });

    // -- Title --
    pdf.setFontSize(12);
    pdf.text(`Licence en informatique : ${cls} â€“ 2025-2026`, pw / 2, 30, { align: 'center' });
    pdf.text(`Emploi du temps de la ${tt.period}`, pw / 2, 37, { align: 'center' });
    pdf.setFontSize(9); pdf.setFont(undefined, 'italic');
    pdf.text('Les cours se dÃ©rouleront au bloc pÃ©dagogique. Le chef de classe est priÃ© de s\'assurer de la disponibilitÃ© du vidÃ©oprojecteur.', pw / 2, 43, { align: 'center' });
    pdf.setFont(undefined, 'normal');

    // -- Table layout --
    const tableTop = 48;
    const rowH = (ph - tableTop - 25) / 7; // 6 days + header
    const dayColW = 35;
    const slotColW = (pw - dayColW - 10) / PDF_SLOTS.length;
    const tableLeft = 5;

    // Draw header row
    pdf.setFillColor(...white); pdf.setTextColor(...black);
    pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.3);
    pdf.rect(tableLeft, tableTop, dayColW, rowH, 'FD');
    PDF_SLOTS.forEach((slot, si) => {
      const x = tableLeft + dayColW + si * slotColW;
      pdf.setFillColor(...white);
      pdf.rect(x, tableTop, slotColW, rowH, 'FD');
      pdf.setFontSize(9); pdf.setFont(undefined, 'bold');
      pdf.text(slot, x + slotColW / 2, tableTop + rowH / 2 + 3, { align: 'center' });
    });

    // Draw day rows
    tt.days.forEach((day, di) => {
      const y = tableTop + rowH * (di + 1);
      const bg = di % 2 === 0 ? blueLight : blueLighter;

      // Day label cell
      pdf.setFillColor(...bg);
      pdf.rect(tableLeft, y, dayColW, rowH, 'FD');
      pdf.setFontSize(8); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...black);
      const dayLines = pdf.splitTextToSize(day, dayColW - 4);
      pdf.text(dayLines, tableLeft + 2, y + rowH / 2, { baseline: 'middle' });

      PDF_SLOTS.forEach((_, si) => {
        const x = tableLeft + dayColW + si * slotColW;
        const sess = tt.schedules[cls]?.[di]?.[si];
        const isEval = sess && sess.type === 'Evaluation';

        pdf.setFillColor(...(isEval ? red : bg));
        pdf.rect(x, y, slotColW, rowH, 'FD');

        if (sess) {
          pdf.setTextColor(...(isEval ? white : black));
          pdf.setFont(undefined, 'bold'); pdf.setFontSize(7.5);
          const subj = sess.subject + (sess.type !== 'Cours' ? ` (${sess.type})` : '');
          const lines = pdf.splitTextToSize(subj, slotColW - 4);
          const lineH = 3.8;
          const extras = (sess.teacher ? 1 : 0) + (sess.room ? 1 : 0);
          const totalH = (lines.length + extras) * lineH;
          let ty = y + (rowH - totalH) / 2 + lineH;

          lines.forEach(l => { pdf.text(l, x + slotColW / 2, ty, { align: 'center' }); ty += lineH; });
          pdf.setFont(undefined, 'normal'); pdf.setFontSize(7);
          if (sess.teacher) { pdf.text(sess.teacher, x + slotColW / 2, ty, { align: 'center' }); ty += lineH; }
          if (sess.room) { pdf.text(sess.room, x + slotColW / 2, ty, { align: 'center' }); }
          pdf.setTextColor(...black); // Reset for next cell
        }
      });
    });

    // -- Footer --
    const note = tt.notes?.[cls];
    if (note) {
      pdf.setFontSize(8); pdf.setFont(undefined, 'bold'); pdf.setTextColor(...red);
      pdf.text(`Note : ${note}`, tableLeft, ph - 15);
    }

    pdf.setFontSize(7.5); pdf.setFont(undefined, 'normal'); pdf.setTextColor(...black);
    pdf.text('NB : L\'emploi du temps est susceptible de modification.', tableLeft, ph - 10);
    pdf.text('Merci de consulter les tableaux d\'affichage rÃ©guliÃ¨rement.', tableLeft, ph - 6);
    pdf.setFont(undefined, 'bold');
    pdf.text('Le Directeur Adjoint', pw - 45, ph - 14, { align: 'center' });
    pdf.text('Dr TÃ©eg-WendÃ© ZOUGMORE', pw - 45, ph - 7, { align: 'center' });

  };

  const loadLogo = () => new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = '/logo-esi.jpg';
  });

  // -- Download single class PDF --
  const handleDownloadPDF = async (tt, cls) => {
    const logoImg = await loadLogo();
    const pdf = new jsPDF('l', 'mm', 'a4');
    drawTimetablePage(pdf, tt, cls, logoImg);
    pdf.save(`EDT_${cls.replace(/\s+/g, '_')}_${tt.startDate}.pdf`);
  };

  // -- Download all classes in one PDF (multi-page) --
  const handleDownloadAllPDF = async (tt) => {
    const logoImg = await loadLogo();
    const pdf = new jsPDF('l', 'mm', 'a4');
    TT_CLASSES.forEach((cls, idx) => {
      if (idx > 0) pdf.addPage();
      drawTimetablePage(pdf, tt, cls, logoImg);
    });
    pdf.save(`EDT_GLOBAL_${tt.startDate}.pdf`);
  };

  // -- Reusable interactive grid --
  const TimetableGrid = ({ cls, days: gridDays, schedules, mode, ttId }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-black text-xs text-center" style={{ minWidth: 620 }}>
        <thead>
          <tr>
            <th className="border border-black p-2 font-bold bg-white w-36"></th>
            {PDF_SLOTS.map(s => <th key={s} className="border border-black p-2 font-bold bg-white">{s}</th>)}
          </tr>
        </thead>
        <tbody>
          {gridDays.map((day, di) => (
            <tr key={di} style={{ background: di % 2 === 0 ? '#9cc2e5' : '#ddebf7' }}>
              <td className="border border-black p-2 font-bold text-left text-[11px] whitespace-nowrap">{day}</td>
              {PDF_SLOTS.map((_, si) => {
                const sess = schedules[cls]?.[di]?.[si];
                return (
                  <td key={si} onClick={() => openSessionModal(mode, ttId, cls, di, si, sess)}
                    className={`border border-black p-1 align-middle cursor-pointer hover:opacity-80 transition ${sess?.type === 'Evaluation' ? 'bg-red-600 text-white' : 'hover:bg-black/10'}`} style={{ height: 72 }}>
                    {sess ? (
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span className="font-bold text-[11px] leading-tight">{sess.subject}{sess.type !== 'Cours' ? ` (${sess.type})` : ''}</span>
                        {sess.teacher && <span className="text-[10px] leading-tight">{sess.teacher}</span>}
                        {sess.room && <span className="text-[10px] italic">{sess.room}</span>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-0 hover:opacity-60">
                        <span className="text-[10px] font-bold">+ Ajouter</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );


  return (
    <div className="space-y-6 animate-fade-in pb-12">

      {/* -- Page Header -- */}
      <div className="space-y-3 border-b border-border-main pb-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-heading font-semibold text-xl text-text-main">Emplois du Temps</h3>
            <p className="text-xs text-text-muted mt-0.5">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2  bg-gradient-to-r from-emerald-600 to-green-600 hover:from-indigo-700 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition shadow-md">
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Annuler' : 'Nouvel Emploi du Temps'}
          </button>
        </div>
        {/* Filter by class */}
        {!filterClass && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filtrer par classe :</span>
            {['', ...TT_CLASSES].map(cls => (
              <button
                key={cls || '__all__'}
                onClick={() => setTtFilterClass(cls)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${ttFilterClass === cls
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-bg-surface text-text-muted border-border-main hover:border-emerald-500 hover:text-emerald-600'}`}
              >
                {cls || 'Toutes les classes'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* -- New Timetable Creation Form -- */}
      {showForm && (
        <div className="bg-bg-surface border border-border-main rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wide mb-1.5">Semaine (choisir le Lundi)</label>
              <input type="date" value={startDateStr} onChange={e => setStartDateStr(e.target.value)}
                className="px-4 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm font-semibold text-text-main" />
            </div>
            <div className="flex-1 min-w-[200px] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl px-4 py-2.5">
              <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">Ã°Å¸â€œâ€¦ {periodLabel}</p>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">{weekDays.join(' Â· ')}</p>
            </div>
          </div>

          {targetClasses.map(cls => (
            <div key={cls} className="rounded-xl border border-gray-300 overflow-hidden bg-white text-black">
              <div className="bg-blue-900 text-white px-4 py-2.5 flex justify-between items-center">
                <h5 className="font-bold text-sm">{cls}</h5>
                <span className="text-xs text-blue-200">Cliquez sur une case pour saisir un cours</span>
              </div>
              <div className="p-3">
                <TimetableGrid cls={cls} days={weekDays} schedules={newSchedules} mode="new" ttId={null} />
                <div className="mt-3">
                  <input type="text" value={newNotes[cls] || ''} onChange={e => setNewNotes(p => ({ ...p, [cls]: e.target.value }))} placeholder="Ajouter une note (ex: Changement de salle, absence...)" className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-gray-50" />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-2 border-t border-border-main">
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 text-sm font-semibold border border-border-main text-text-muted rounded-xl hover:bg-bg-hover transition">Annuler</button>
            <button onClick={handleSaveTimetable} className="px-6 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition">
              âœ“ Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* -- Saved Timetables List -- */}
      <div className="space-y-3">
        <h4 className="font-heading font-semibold text-sm text-text-muted uppercase tracking-wide">
          Emplois du temps enregistrÃ©s{savedTimetables.length > 0 && ` (${savedTimetables.length})`}
        </h4>

        {savedTimetables.length === 0 && (
          <div className="text-center py-14 border-2 border-dashed border-border-main rounded-2xl">
            <Calendar className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-muted text-sm font-semibold">Aucun emploi du temps enregistrÃ©.</p>
            <p className="text-text-muted text-xs mt-1">Cliquez sur Â«Â Nouvel Emploi du TempsÂ Â» pour commencer.</p>
          </div>
        )}

        {savedTimetables.map(tt => (
          <div key={tt.id} className="bg-bg-surface border border-border-main rounded-2xl overflow-hidden shadow-sm">
            {/* Accordion header */}
            <div className="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-bg-hover transition"
              onClick={() => setExpandedId(expandedId === tt.id ? null : tt.id)}>
              <div className="flex items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">PÃ©riode</span>
                  <span className="font-bold text-text-main text-sm">{tt.period}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block">CrÃ©Ã© le</span>
                  <span className="text-text-main text-sm">{tt.createdAt}</span>
                </div>
                <div className="flex gap-1.5">
                  {TT_CLASSES.map(c => (
                    <span key={c} className="text-[10px] px-2.5 py-0.5 bg-blue-600 text-white rounded-full font-bold shadow-sm">{c}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); handleDownloadAllPDF(tt); }}
                  title="TÃ©lÃ©charger tout (Global)"
                  className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition shadow-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </button>
                <button onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm('Voulez-vous vraiment supprimer cet emploi du temps ?')) {
                    try {
                      await api.deleteTimetable(tt.id);
                      setTimetables(p => p.filter(t => t.id !== tt.id));
                      if (onDataChange) onDataChange();
                    } catch (err) {
                      alert("Erreur lors de la suppression: " + err.message);
                    }
                  }
                }}
                  title="Supprimer"
                  className="p-2 text-text-muted hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition">
                  <Trash2 className="w-4 h-4" />
                </button>
                <svg className={`w-5 h-5 text-text-muted transition-transform duration-200 ml-2 ${expandedId === tt.id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Accordion body */}
            {expandedId === tt.id && (
              <div className="border-t border-border-main p-5 space-y-5 bg-bg-main">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-xs text-text-muted italic flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Cliquez sur une case pour modifier un cours. TÃ©lÃ©chargez le PDF par classe ou le fichier global.
                  </p>
                  <button onClick={() => handleDownloadAllPDF(tt)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition shadow-md whitespace-nowrap">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    TÃ©lÃ©charger tout (Global)
                  </button>
                </div>
                {targetClasses.map(cls => (
                  <div key={cls} className="rounded-xl border border-gray-300 overflow-hidden bg-white text-black">
                    <div className="bg-blue-900 text-white px-4 py-2.5 flex items-center justify-between">
                      <h5 className="font-bold text-sm">{cls}</h5>
                      <button onClick={() => handleDownloadPDF(tt, cls)}
                        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        TÃ©lÃ©charger PDF
                      </button>
                    </div>
                    <div className="p-3">
                      <TimetableGrid cls={cls} days={tt.days} schedules={tt.schedules} mode="saved" ttId={tt.id} />
                      <div className="mt-3">
                        <input type="text"
                          value={tt.notes?.[cls] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setTimetables(prev => prev.map(saved => {
                              if (saved.id !== tt.id) return saved;
                              const updatedNotes = { ...saved.notes, [cls]: val };
                              return { ...saved, notes: updatedNotes };
                            }));
                          }}
                          onBlur={async (e) => {
                            const val = e.target.value;
                            const updatedNotes = { ...tt.notes, [cls]: val };
                            try {
                              await api.updateTimetable(tt.id, {
                                ...tt,
                                notes: updatedNotes
                              });
                            } catch (err) {
                              console.error("Failed to save note update:", err);
                            }
                          }}
                          placeholder="Ajouter une note (ex: Changement de salle, absence...)"
                          className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500 bg-gray-50" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* -- Session Modal -- */}
      {sessionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-bg-surface border border-border-main rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-text-main">
                  {sessionModal.data.subject ? 'Modifier le cours' : 'Ajouter un cours'}
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  {sessionModal.cls} â€” {(sessionModal.mode === 'new' ? weekDays : savedTimetables.find(t => t.id === sessionModal.ttId)?.days ?? [])[sessionModal.dayIdx]} â€” {PDF_SLOTS[sessionModal.slotIdx]}
                </p>
              </div>
              <button onClick={() => setSessionModal(m => ({ ...m, open: false }))} className="p-1.5 rounded-lg hover:bg-bg-main text-text-muted transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">MatiÃ¨re *</label>
                <input value={sessionModal.data.subject} onChange={e => setSessionModal(m => ({ ...m, data: { ...m.data, subject: e.target.value } }))} className="w-full px-3 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm" placeholder="Ex: Algorithmique" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Type</label>
                <select value={sessionModal.data.type} onChange={e => setSessionModal(m => ({ ...m, data: { ...m.data, type: e.target.value } }))} className="w-full px-3 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm">
                  <option value="Cours">Cours</option>
                  <option value="TD">TD</option>
                  <option value="TP">TP</option>
                  <option value="Evaluation">Evaluation</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Professeur</label>
                <input value={sessionModal.data.teacher} onChange={e => setSessionModal(m => ({ ...m, data: { ...m.data, teacher: e.target.value } }))} className="w-full px-3 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm" placeholder="Ex: Dr. Dupont" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Salle (Optionnel)</label>
                <input value={sessionModal.data.room} onChange={e => setSessionModal(m => ({ ...m, data: { ...m.data, room: e.target.value } }))} className="w-full px-3 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm" placeholder="Ex: Salle 104" />
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              {sessionModal.data.subject && (
                <button onClick={removeSession} className="flex-1 py-2.5 text-sm font-semibold border border-rose-500/50 text-rose-500 rounded-xl hover:bg-rose-500/10 transition">
                  Supprimer
                </button>
              )}
              <button onClick={saveSession} disabled={!sessionModal.data.subject.trim()} className="flex-1 py-2.5 text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition disabled:opacity-50">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


const getClassSemesters = (className) => {
  if (className.includes('TC1')) return ['S1', 'S2'];
  if (className.includes('TC2')) return ['S3', 'S4'];
  if (className.includes('TC3')) return ['S5', 'S6'];
  if (className.includes('M1')) return ['S1', 'S2'];
  if (className.includes('M2')) return ['S3', 'S4'];
  return ['S1', 'S2'];
};

const ClassDetailView = ({ cls, onBack, modules, evaluations, timetables, setTimetables, darkMode, openEditMod, deleteMod, openAddMod, openEditEval, deleteEval, openAddEval, updateEvalStatus }) => {
  const semesters = getClassSemesters(cls.name);
  const [selectedSemester, setSelectedSemester] = useState(semesters[0]);
  const [innerTab, setInnerTab] = useState('modules');
  const [searchQuery, setSearchQuery] = useState('');

  const semesterModules = modules.filter(m => m.className === cls.name && m.semester === selectedSemester);
  const semesterEvals = evaluations.filter(e => {
    return e.classGroup === cls.name && semesterModules.some(m => m.name === e.moduleName);
  });

  const filteredModules = semesterModules.filter(mod => {
    const q = searchQuery.toLowerCase();
    return (mod.name || '').toLowerCase().includes(q) ||
      (mod.teacher || '').toLowerCase().includes(q);
  });

  const filteredEvals = semesterEvals.filter(ev => {
    const q = searchQuery.toLowerCase();
    return (ev.moduleName || '').toLowerCase().includes(q);
  });

  // Calculate simple stats
  const totalHours = semesterModules.reduce((acc, m) => acc + (m.totalHours || 0), 0);
  const remainingHours = semesterModules.reduce((acc, m) => acc + (m.remainingHours || 0), 0);
  const completedHours = totalHours - remainingHours;
  const progress = totalHours > 0 ? Math.round((completedHours / totalHours) * 100) : 0;

  const [expandedModuleId, setExpandedModuleId] = useState(null);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4 border-b border-border-main pb-4">
        <button onClick={onBack} className="p-2 text-text-muted hover:text-text-main bg-bg-surface hover:bg-bg-hover border border-border-main rounded-xl transition-all shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h2 className="font-heading font-extrabold text-2xl text-text-main m-0">{cls.name}</h2>
          <p className="text-sm text-text-muted mt-1">{cls.specialty} Ã¢â‚¬Â¢ {cls.studentCount > 0 ? `${cls.studentCount} Ã‰tudiants` : 'Effectif non dÃ©fini'}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 border-b border-border-main pb-4">
        <div className="flex justify-center gap-2 overflow-x-auto pb-1 w-full">
          {semesters.map(sem => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${selectedSemester === sem
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-bg-surface text-text-muted border border-border-main hover:bg-bg-hover'
                }`}
            >
              Semestre {sem}
            </button>
          ))}
        </div>

        <div className="flex justify-center bg-bg-surface border border-border-main rounded-xl p-1 shrink-0 overflow-x-auto">
          {[
            { id: 'modules', label: 'Modules', icon: Layers },
            { id: 'evaluations', label: 'Ã‰valuations', icon: ClipboardCheck },
            { id: 'emploidutemps', label: 'Emploi du temps', icon: Calendar },
            { id: 'statistiques', label: 'Statistiques', icon: BarChart3 }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setInnerTab(tab.id); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${innerTab === tab.id
                ? 'bg-bg-main text-text-main shadow-sm border border-border-main'
                : 'text-text-muted hover:text-text-main'
                }`}
            >
              <tab.icon className={`w-3.5 h-3.5 ${innerTab === tab.id ? 'text-emerald-500' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-bg-surface border border-border-main p-6 rounded-2xl shadow-sm min-h-[400px]">
        {innerTab === 'modules' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Chercher un module..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-main border border-border-main rounded-xl text-xs placeholder-slate-400 text-text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button onClick={openAddMod} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-emerald-500/20 shrink-0">
                <Plus className="w-4 h-4" />
                Ajouter un module
              </button>
            </div>

            <div className="space-y-3">
              {filteredModules.length > 0 ? filteredModules.map(mod => {
                const isExpanded = expandedModuleId === mod.id;
                const toggleExpand = () => setExpandedModuleId(isExpanded ? null : mod.id);

                return (
                  <div key={mod.id} className="bg-bg-main border border-border-main rounded-xl overflow-hidden transition-colors duration-200">
                    <div onClick={toggleExpand} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-bg-hover transition">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-heading font-bold text-sm text-text-main m-0">{mod.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 border ${mod.status === 'TerminÃ©' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                            {mod.status}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{mod.teacher}</p>
                      </div>
                      <div className="flex items-center gap-4 sm:w-1/3">
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-[10px] text-text-muted mb-1 font-semibold">
                            <span>{mod.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-bg-surface border border-border-main rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-500 ${mod.progress < 40 ? 'bg-rose-500' : mod.progress < 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${mod.progress}%` }}></div>
                          </div>
                        </div>
                        <div className={`p-1.5 rounded-lg border border-border-main text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-bg-surface' : ''}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-4 border-t border-border-main bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex items-end justify-end gap-2">
                          <button onClick={(e) => { e.stopPropagation(); openEditMod(mod); }} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border-main rounded-xl text-text-muted hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition">
                            <Pencil className="w-3.5 h-3.5" /> Modifier
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); deleteMod(mod.id); }} className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border-main rounded-xl text-text-muted hover:text-rose-600 hover:border-rose-400 hover:bg-rose-500/5 transition">
                            <Trash2 className="w-3.5 h-3.5" /> Supprimer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border-main rounded-xl">Aucun module trouvÃ© pour ce semestre.</div>
              )}
            </div>
          </div>
        )}

        {innerTab === 'evaluations' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative max-w-sm w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Chercher une Ã©valuation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-bg-main border border-border-main rounded-xl text-xs placeholder-slate-400 text-text-main focus:outline-none focus:border-emerald-500"
                />
              </div>
              <button onClick={openAddEval} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-emerald-500/20 shrink-0">
                <Plus className="w-4 h-4" />
                Ajouter une Ã©valuation
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border-main bg-bg-main shadow-sm dark:shadow-none">
              <table className="w-full border-collapse text-left min-w-[560px]">
                <thead>
                  <tr className="bg-bg-hover text-text-muted text-xs font-semibold uppercase tracking-wider border-b border-border-main">
                    <th className="p-4 pl-6">Module</th>
                    <th className="p-4">Date et Heure</th>
                    <th className="p-4 text-center">Statut</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main text-sm">
                  {filteredEvals.length > 0 ? filteredEvals.map(ev => (
                    <tr key={ev.id} className="hover:bg-bg-hover transition duration-150 group">
                      <td className="p-4 pl-6">
                        <h5 className="font-heading font-semibold text-text-main m-0">{ev.moduleName}</h5>
                      </td>
                      <td className="p-4 text-text-muted text-xs">
                        <span className="block font-medium">{ev.date}</span>
                        <span className="font-mono text-[10px]">{(ev.time || '').substring(0, 5)}</span>
                      </td>
                      <td className="p-4 text-center">
                        <select
                          value={ev.status}
                          onChange={e => updateEvalStatus(ev.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase rounded-full border px-2.5 py-1 cursor-pointer focus:outline-none transition
                            ${ev.status === 'EffectuÃ©' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                         'bg-indigo-500/10  text-indigo-600  border-indigo-500/20'  }
                          `}
                        >
                          <option value="PlanifiÃ©">PlanifiÃ©</option>
                          <option value="EffectuÃ©">EffectuÃ©</option>
                        </select>
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEditEval(ev)} className="p-2 text-text-muted hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => deleteEval(ev.id)} className="p-2 text-text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="4" className="text-center py-8 text-text-muted text-sm border-dashed">Aucune Ã©valuation pour ce semestre.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {innerTab === 'emploidutemps' && (
          <div className="bg-bg-main border border-border-main p-6 rounded-xl animate-fade-in">
            <EmploiDuTempsView darkMode={darkMode} selectedYear="2026" timetables={timetables} setTimetables={setTimetables} filterClass={cls.name} filterSemester={selectedSemester} onDataChange={loadData} />
          </div>
        )}

        {innerTab === 'statistiques' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-bg-main border border-border-main p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Total Modules</p>
                  <p className="font-heading font-extrabold text-2xl text-text-main mt-1">{semesterModules.length}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Layers className="w-6 h-6" /></div>
              </div>
              <div className="bg-bg-main border border-border-main p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-muted">Total Ã‰valuations</p>
                  <p className="font-heading font-extrabold text-2xl text-text-main mt-1">{semesterEvals.length}</p>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><ClipboardCheck className="w-6 h-6" /></div>
              </div>
            </div>

            {/* RÃ©partition Ã©valuations par statut */}
            {semesterEvals.length > 0 && (() => {
              const evEffectue = semesterEvals.filter(e => e.status === 'EffectuÃ©').length;
              const evPlanifie = semesterEvals.filter(e => e.status === 'PlanifiÃ©').length;
              const tauxEval   = semesterEvals.length > 0 ? Math.round((evEffectue / semesterEvals.length) * 100) : 0;
              return (
                <div className="bg-bg-main border border-border-main p-6 rounded-xl space-y-4">
                  <h4 className="font-heading font-bold text-base text-text-main">Progression des Ã‰valuations</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
                      <p className="text-[10px] uppercase font-bold text-emerald-600 mb-1">EffectuÃ©es</p>
                      <p className="text-xl font-extrabold text-emerald-500">{evEffectue}</p>
                    </div>
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3 text-center">
                      <p className="text-[10px] uppercase font-bold text-indigo-500 mb-1">PlanifiÃ©es</p>
                      <p className="text-xl font-extrabold text-indigo-400">{evPlanifie}</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-text-muted mb-1.5">
                      <span>Taux de rÃ©alisation</span>
                      <span className="font-semibold text-emerald-500">{tauxEval}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-bg-surface rounded-full overflow-hidden border border-border-main">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${tauxEval}%` }} />
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="bg-bg-main border border-border-main p-6 rounded-xl">
              <h4 className="font-heading font-bold text-base text-text-main mb-6">Progression des Heures de Cours</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs font-semibold text-text-muted mb-2">
                    <span>Progression Globale du Semestre</span>
                    <span className="text-emerald-500">{progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-bg-surface rounded-full overflow-hidden border border-border-main">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2 text-right">{completedHours}h rÃ©alisÃ©es sur {totalHours}h au total</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};


const AVATAR_COLORS = [
  'bg-emerald-600', 'bg-teal-600', 'bg-teal-600',
  'bg-amber-600', 'bg-pink-600', 'bg-cyan-600', 'bg-rose-600'
];

const EMPTY_PROF = { name: '', department: '', email: '', activeModules: '' };

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractÃ¨res.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res.success) {
        onLogin();
      } else {
        setError('Identifiants incorrects.');
      }
    } catch (err) {
      setError(err.message || 'Erreur lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main text-text-main flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-200">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-bg-surface border border-border-main rounded-3xl shadow-2xl p-8 relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-esi.jpg" alt="Logo ESI" className="w-20 h-20 rounded-2xl object-contain bg-white p-1 shadow-lg mb-4" />
          <h1 className="font-heading font-extrabold text-2xl tracking-tight text-emerald-600 dark:text-emerald-400 m-0">ESIManage Pro</h1>
          <p className="text-sm text-text-muted mt-2 font-medium">Connexion au portail d'administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Adresse Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled={loading}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ex: admin@esi.dz"
                required
                className="w-full px-4 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Mot de Passe (8 carac. min)</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                disabled={loading}
                onChange={e => setPassword(e.target.value)}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                required
                className="w-full px-4 py-2.5 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition outline-none"
              />
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-500 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('token');
  });
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Verification de la session au chargement
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !localStorage.getItem('user')) {
      api.checkSession()
        .then(data => {
          if (data.success) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
          }
        })
        .catch(() => {
          // Token invalide, on laisse l'utilisateur se reconnecter
        });
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const [currentTab, setCurrentTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Theme State
  const [darkMode, setDarkMode] = useState(false);

  // Core Entity States
  const [classes, setClasses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [modules, setModules] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');

  // Dashboard Stats & Lists States
  const [dashboardStats, setDashboardStats] = useState({ totalClasses: 0, totalProfessors: 0, upcomingEvals: 0 });
  const [todayScheduleState, setTodayScheduleState] = useState([]);
  const [classPerformanceState, setClassPerformanceState] = useState([]);
  const [evalStatsState, setEvalStatsState] = useState({ total: 0, effectue: 0, planifie: 0, enCours: 0, tauxRealisation: 0, chart: [] });

  const getModuleProgressValue = (mod) => {
    const rawProgress = mod.progress ?? (mod.progress && mod.progress.value);
    const parsedProgress = Number(rawProgress);
    if (!Number.isNaN(parsedProgress) && rawProgress !== null && rawProgress !== undefined) {
      return Math.max(0, Math.min(100, parsedProgress));
    }

    const totalHours = Number(mod.total_hours ?? mod.totalHours ?? 0);
    const remainingHours = Number(mod.remaining_hours ?? mod.remainingHours ?? mod.remainingHours ?? 0);
    if (totalHours > 0) {
      return Math.max(0, Math.min(100, Math.round(((totalHours - remainingHours) / totalHours) * 100)));
    }
    return 0;
  };

  const getModuleTotalHours = (mod) => Number(mod.total_hours ?? mod.totalHours ?? 0) || 0;
  const getModuleRemainingHours = (mod) => Number(mod.remaining_hours ?? mod.remainingHours ?? 0) || 0;
  const getModuleClassKey = (mod) => mod.class_id || mod.classId || mod.className || mod.class || '';

  const moduleProgressSummary = useMemo(() => {
    const total = modules.length;
    const totalHours = modules.reduce((sum, mod) => sum + getModuleTotalHours(mod), 0);
    const completedHours = modules.reduce((sum, mod) => {
      const moduleHours = getModuleTotalHours(mod);
      if (moduleHours > 0) {
        return sum + Math.max(0, moduleHours - getModuleRemainingHours(mod));
      }
      return sum;
    }, 0);
    const average = totalHours > 0
      ? Number(((completedHours / totalHours) * 100).toFixed(1))
      : (total > 0 ? Number((modules.reduce((sum, mod) => sum + getModuleProgressValue(mod), 0) / total).toFixed(1)) : 0);

    return {
      total,
      totalHours,
      completedHours: Number(completedHours.toFixed(1)),
      remainingHours: Number(Math.max(0, totalHours - completedHours).toFixed(1)),
      average
    };
  }, [modules]);

  const moduleProgressPieData = useMemo(() => {
    const completed = moduleProgressSummary.average;
    return [
      { name: 'Progression realisee', value: completed, color: '#14b8a6' },
      { name: 'Progression restante', value: Number(Math.max(0, 100 - completed).toFixed(1)), color: '#f59e0b' }
    ];
  }, [moduleProgressSummary]);

  const classModuleProgress = useMemo(() => {
    if (!classes.length) return classPerformanceState;

    const grouped = classes.reduce((acc, cls) => {
      acc[cls.id] = { name: cls.name || 'Classe', totalHours: 0, completedHours: 0, progressTotal: 0, count: 0 };
      return acc;
    }, {});

    modules.forEach(mod => {
      const classKey = getModuleClassKey(mod);
      const classEntry = grouped[classKey] || Object.values(grouped).find(entry => entry.name === mod.className);
      if (!classEntry) return;

      const moduleHours = getModuleTotalHours(mod);
      if (moduleHours > 0) {
        classEntry.totalHours += moduleHours;
        classEntry.completedHours += Math.max(0, moduleHours - getModuleRemainingHours(mod));
      } else {
        classEntry.progressTotal += getModuleProgressValue(mod);
        classEntry.count += 1;
      }
    });

    return Object.values(grouped)
      .map(entry => {
        const progress = entry.totalHours > 0
          ? (entry.completedHours / entry.totalHours) * 100
          : (entry.count > 0 ? entry.progressTotal / entry.count : 0);
        return { name: entry.name, average: Number(progress.toFixed(1)) };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, modules, classPerformanceState]);

  const chartClassProgressData = classModuleProgress.length
    ? classModuleProgress
    : (classPerformanceState.length ? classPerformanceState : classes.map(cls => ({ name: cls.name || 'Classe', average: 0 })));

  const availableYears = useMemo(() => academicYears.map(ay => ay.label), [academicYears]);
const loadData = async () => {
    try {
      const years = await api.getAcademicYears();
      setAcademicYears(years);
      if (years.length > 0) {
        const current = years.find(y => y.is_current) || years[0];
        setSelectedYear(current.label);
      }

      // --- MAPPING DES CLASSES (Neon -> React) ---
      const rawCls = await api.getClasses();
      const mappedClasses = rawCls.map(c => ({
        id: c.id,
        name: c.name,
        specialty: c.specialty,
        level: c.level,
        studentCount: c.student_count || c.studentCount || 0,
        headTeacherId: c.head_teacher_id || c.headTeacherId,
        representative: c.representative,
        scheduleProgress: c.schedule_progress || c.scheduleProgress || 0
      }));
      setClasses(mappedClasses);

      const rawProfs = await api.getProfessors();
      const mappedProfs = rawProfs.map(p => ({
        id: p.id,
        name: p.name || '',
        department: p.department || '',
        email: p.email || '',
        availability: p.availability || 'Disponible',
        avatarBg: p.avatar_bg || p.avatarBg || 'bg-indigo-600',
        activeModules: p.activeModules || p.active_modules || [],
      }));
      setProfessors(mappedProfs);

      // --- MAPPING DES MODULES (Neon -> React) ---
      const rawMods = await api.getModules();
      const mappedModules = rawMods.map(m => {
        const profObj = mappedProfs.find(p => p.id === (m.teacher_id || m.teacherId));
        const classObj = mappedClasses.find(c => c.id === (m.class_id || m.classId));
        
        return {
          id: m.id,
          name: m.name,
          teacher: profObj ? profObj.name : 'Non assignÃ©',
          teacherId: m.teacher_id || m.teacherId,
          classId: m.class_id || m.classId,
          className: classObj ? classObj.name : '',
          semester: m.semester,
          totalHours: m.total_hours || m.totalHours || 0,
          remainingHours: m.remaining_hours || m.remainingHours || 0,
          progress: m.progress || 0,
          status: m.status || 'En cours'
        };
      });
      setModules(mappedModules);

      const rawEvals = await api.getEvaluations();
      const mappedEvals = rawEvals.map(e => ({
        id: e.id,
        moduleName: e.modulename || e.moduleName || '',
        date: e.eval_date ? String(e.eval_date).split('T')[0] : (e.date || ''),
        eval_date: e.eval_date ? String(e.eval_date).split('T')[0] : (e.date || ''),
        time: e.eval_time || e.time || '',
        classGroup: e.classgroup || e.classGroup || '',
        status: e.status || 'PlanifiÃ©',
        module_id: e.module_id,
        class_id: e.class_id,
        academic_year_id: e.academic_year_id,
      }));
      setEvaluations(mappedEvals);

      const tts = await api.getTimetables();
      setTimetables(tts);

      const rms = await api.getRooms();
      setRooms(rms);

      const stats = await api.getDashboardStats();
      setDashboardStats(stats);

      const today = await api.getTodaySchedule();
      setTodayScheduleState(today);

      const performance = await api.getClassPerformance();
      setClassPerformanceState(performance);

      const evalStats = await api.getEvalStats();
      setEvalStatsState(evalStats);
    } catch (err) {
      console.error("Failed to fetch data from API:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const [clsModal, setClsModal] = useState({ open: false, data: { name: '', studentCount: '', representative: '' }, editId: null });
  const [clsFormError, setClsFormError] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

  // Class CRUD handlers
  const openEditCls = (cls) => {
    setClsFormError('');
    setClsModal({ open: true, data: { name: cls.name, studentCount: String(cls.studentCount), representative: cls.representative || '' }, editId: cls.id });
  };
  const closeCls = () => setClsModal(m => ({ ...m, open: false }));
  const handleClsField = (field, value) => setClsModal(m => ({ ...m, data: { ...m.data, [field]: value } }));
  const saveCls = async () => {
    const { name, studentCount, representative } = clsModal.data;
    if (!name.trim()) { setClsFormError('Le nom de la classe est requis.'); return; }
    const count = parseInt(studentCount, 10);
    if (isNaN(count) || count < 0) { setClsFormError('Effectif invalide.'); return; }
    const mapClass = (c) => ({
      id: c.id,
      name: c.name || '',
      specialty: c.specialty || '',
      level: c.level || '',
      studentCount: c.student_count ?? c.studentCount ?? 0,
      headTeacherId: c.head_teacher_id || c.headTeacherId || null,
      representative: c.representative || '',
      scheduleProgress: c.schedule_progress ?? c.scheduleProgress ?? 0,
      headTeacher: c.headteacher || c.headTeacher || '',
    });
    try {
      if (clsModal.editId) {
        const updated = await api.updateClass(clsModal.editId, {
          name: name.trim(),
          student_count: count,
          representative: representative.trim()
        });
        setClasses(prev => prev.map(c => c.id === clsModal.editId ? mapClass(updated) : c));
      }
      closeCls();
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      setClsFormError(err.message || 'Erreur lors de la sauvegarde.');
    }
  };
  const deleteCls = async (id) => {
    if (confirm('Voulez-vous vraiment supprimer cette classe ?')) {
      try {
        await api.deleteClass(id);
        setClasses(prev => prev.filter(c => c.id !== id));
        const stats = await api.getDashboardStats();
        setDashboardStats(stats);
      } catch (err) {
        alert(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  const [profModal, setProfModal] = useState({ open: false, mode: 'add', data: EMPTY_PROF, editId: null });
  const [profFormError, setProfFormError] = useState('');

  const [modModal, setModModal] = useState({ open: false, mode: 'add', data: { name: '', teacher: '', className: '', semester: '', totalHours: '', remainingHours: '', progress: '', prerequisite: '', status: 'En cours' }, editId: null });
  const [modFormError, setModFormError] = useState('');
  const [expandedModuleId, setExpandedModuleId] = useState(null);

  const [evalModal, setEvalModal] = useState({ open: false, mode: 'add', data: { moduleName: '', date: '', time: '', classGroup: '', status: 'PlanifiÃ©' }, editId: null });
  const [evalFormError, setEvalFormError] = useState('');

  // Filter states for Modules tab
  const [modFilterClass, setModFilterClass] = useState('');
  const [modFilterSemester, setModFilterSemester] = useState('');

  // Filter states for Evaluations tab
  const [evalFilterClass, setEvalFilterClass] = useState('');
  const [evalFilterStatus, setEvalFilterStatus] = useState('');

  // Hook to toggle dark class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Professor CRUD handlers
  const openAddProf = () => {
    setProfFormError('');
    setProfModal({ open: true, mode: 'add', data: EMPTY_PROF, editId: null });
  };
  const openEditProf = (prof) => {
    setProfFormError('');
    setProfModal({
      open: true, mode: 'edit',
      data: { name: prof.name, department: prof.department, email: prof.email, activeModules: Array.isArray(prof.activeModules) ? prof.activeModules.join(', ') : (prof.activeModules || '') },
      editId: prof.id
    });
  };
  const closeProf = () => setProfModal(m => ({ ...m, open: false }));
  const handleProfField = (field, value) => setProfModal(m => ({ ...m, data: { ...m.data, [field]: value } }));
  const saveProf = async () => {
    const { name, department, email, activeModules } = profModal.data;
    if (!name.trim() || !department.trim() || !email.trim()) {
      setProfFormError('Nom, dÃ©partement et email sont requis.');
      return;
    }
    const payload = {
      name: name.trim(),
      department: department.trim(),
      email: email.trim(),
      activeModules: activeModules.split(',').map(m => m.trim()).filter(Boolean),
      avatarBg: AVATAR_COLORS[professors.length % AVATAR_COLORS.length]
    };
    const mapProf = (p) => ({
      id: p.id,
      name: p.name || '',
      department: p.department || '',
      email: p.email || '',
      availability: p.availability || 'Disponible',
      avatarBg: p.avatar_bg || p.avatarBg || 'bg-indigo-600',
      activeModules: p.activeModules || p.active_modules || [],
    });
    try {
      if (profModal.mode === 'add') {
        const created = await api.createProfessor(payload);
        setProfessors(prev => [...prev, mapProf(created)]);
      } else {
        const updated = await api.updateProfessor(profModal.editId, payload);
        setProfessors(prev => prev.map(p => p.id === profModal.editId ? mapProf(updated) : p));
      }
      closeProf();
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
    } catch (err) {
      setProfFormError(err.message || 'Erreur lors de la sauvegarde.');
    }
  };
  const deleteProf = async (id) => {
    if (confirm('Voulez-vous vraiment supprimer ce professeur ?')) {
      try {
        await api.deleteProfessor(id);
        setProfessors(prev => prev.filter(p => p.id !== id));
        const stats = await api.getDashboardStats();
        setDashboardStats(stats);
      } catch (err) {
        alert(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  // Module CRUD handlers
  const openAddMod = () => {
    setModFormError('');
    setModModal({ open: true, mode: 'add', data: { name: '', teacher: '', className: '', semester: '', totalHours: '', remainingHours: '', progress: '', prerequisite: '', status: 'En cours' }, editId: null });
  };
  const openEditMod = (mod) => {
    setModFormError('');
    setModModal({
      open: true, mode: 'edit',
      data: { name: mod.name, teacher: mod.teacher || '', className: mod.className || '', semester: mod.semester, totalHours: String(mod.totalHours ?? 0), remainingHours: String(mod.remainingHours ?? 0), progress: String(mod.progress ?? 0), prerequisite: mod.prerequisite || '', status: mod.status },
      editId: mod.id
    });
  };
  const closeMod = () => setModModal(m => ({ ...m, open: false }));
  const handleModField = (field, value) => setModModal(m => ({ ...m, data: { ...m.data, [field]: value } }));
  const saveMod = async () => {
    const { name, teacher, className, semester, totalHours, remainingHours, progress, prerequisite, status } = modModal.data;
    if (!name.trim() || !className.trim() || !semester.trim()) {
      setModFormError('Nom, classe et semestre sont requis.');
      return;
    }
    let th = parseInt(totalHours) || 0;
    let rh = parseInt(remainingHours) || 0;
    let prg = parseInt(progress) || 0;

    if (status === 'TerminÃ©') {
      prg = 100;
      rh = 0;
    }

    const profObj = teacher.trim() ? professors.find(p => p.name === teacher.trim()) : null;
    const classObj = classes.find(c => c.name === className.trim());
    const prereqObj = modules.find(m => m.name === prerequisite?.trim());

    const payload = {
      name: name.trim(),
      teacher_id: profObj ? profObj.id : null,
      class_id: classObj ? classObj.id : null,
      semester: semester.trim(),
      total_hours: th,
      remaining_hours: rh,
      progress: prg,
      prerequisite_id: prereqObj ? prereqObj.id : null,
      status
    };

    const mapMod = (m) => {
      const pObj = professors.find(p => p.id === m.teacher_id);
      const cObj = classes.find(c => c.id === m.class_id);
      return {
        id: m.id,
        name: m.name || '',
        teacher: pObj ? pObj.name : (m.teacher || 'Non assignÃ©'),
        teacherId: m.teacher_id || null,
        classId: m.class_id || m.classId || null,
        className: cObj ? cObj.name : (m.classname || m.className || ''),
        semester: m.semester,
        totalHours: m.total_hours ?? m.totalHours ?? 0,
        remainingHours: m.remaining_hours ?? m.remainingHours ?? 0,
        progress: m.progress ?? 0,
        prerequisite: m.prerequisite || '',
        status: m.status || 'En cours',
      };
    };

    try {
      if (modModal.mode === 'add') {
        const created = await api.createModule(payload);
        setModules(prev => [...prev, mapMod(created)]);
      } else {
        const updated = await api.updateModule(modModal.editId, payload);
        setModules(prev => prev.map(m => m.id === modModal.editId ? mapMod(updated) : m));
      }
      closeMod();
      const performance = await api.getClassPerformance();
      setClassPerformanceState(performance);
    } catch (err) {
      setModFormError(err.message || 'Erreur lors de la sauvegarde.');
    }
  };
  const deleteMod = async (id) => {
    if (confirm('Voulez-vous vraiment supprimer ce module ?')) {
      try {
        await api.deleteModule(id);
        setModules(prev => prev.filter(m => m.id !== id));
        const performance = await api.getClassPerformance();
        setClassPerformanceState(performance);
      } catch (err) {
        alert(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  // Evaluation CRUD handlers
  const openAddEval = () => {
    setEvalFormError('');
    setEvalModal({ open: true, mode: 'add', data: { moduleName: '', date: '', time: '08:00', classGroup: '', status: 'PlanifiÃ©' }, editId: null });
  };
  const openEditEval = (ev) => {
    setEvalFormError('');
    setEvalModal({
      open: true, mode: 'edit',
      data: { moduleName: ev.moduleName, date: ev.eval_date || ev.date, time: ev.time || '', classGroup: ev.classGroup, status: ev.status },
      editId: ev.id
    });
  };
  const closeEval = () => setEvalModal(m => ({ ...m, open: false }));
  const handleEvalField = (field, value) => setEvalModal(m => ({ ...m, data: { ...m.data, [field]: value } }));
  const findByName = (items, name) => {
    const normalizedName = name.trim().toLowerCase();
    return items.find(item => (item.name || '').trim().toLowerCase() === normalizedName);
  };
  const saveEval = async () => {
    const { moduleName, date, time, classGroup, status } = evalModal.data;
    if (!moduleName.trim() || !classGroup.trim() || !date.trim()) {
      setEvalFormError('Nom du module, classe et date sont requis.');
      return;
    }

    const modObj = findByName(modules, moduleName);
    const classObj = findByName(classes, classGroup);
    if (!modObj) {
      setEvalFormError('Module introuvable. SÃ©lectionnez un module existant dans les suggestions.');
      return;
    }
    if (!classObj) {
      setEvalFormError('Classe introuvable. SÃ©lectionnez une classe existante dans les suggestions.');
      return;
    }
    const ayObj = academicYears.find(ay => ay.label === selectedYear);

    const payload = {
      module_id: modObj ? modObj.id : null,
      type: 'Evaluation',
      eval_date: date,
      eval_time: time.trim() || '08:00:00',
      class_id: classObj ? classObj.id : null,
      room_id: null,
      academic_year_id: ayObj ? ayObj.id : null,
      weight: 1,
      status: status || 'PlanifiÃ©'
    };

    const mapEval = (e) => ({
      id: e.id,
      moduleName: e.modulename || e.moduleName || moduleName,
      date: e.eval_date ? String(e.eval_date).split('T')[0] : date,
      eval_date: e.eval_date ? String(e.eval_date).split('T')[0] : date,
      time: e.eval_time || e.time || time,
      classGroup: e.classgroup || e.classGroup || classGroup,
      status: e.status || status,
      module_id: e.module_id,
      class_id: e.class_id,
      academic_year_id: e.academic_year_id,
    });

    try {
      if (evalModal.mode === 'add') {
        const created = await api.createEvaluation(payload);
        setEvaluations(prev => [...prev, mapEval(created)]);
      } else {
        const updated = await api.updateEvaluation(evalModal.editId, payload);
        setEvaluations(prev => prev.map(e => e.id === evalModal.editId ? mapEval(updated) : e));
      }
      closeEval();
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
      const evalStats = await api.getEvalStats();
      setEvalStatsState(evalStats);
    } catch (err) {
      setEvalFormError(err.message || 'Erreur lors de la sauvegarde.');
    }
  };
  const deleteEval = async (id) => {
    if (confirm('Voulez-vous vraiment supprimer cette Ã©valuation ?')) {
      try {
        await api.deleteEvaluation(id);
        setEvaluations(prev => prev.filter(e => e.id !== id));
        const stats = await api.getDashboardStats();
        setDashboardStats(stats);
        const evalStats = await api.getEvalStats();
        setEvalStatsState(evalStats);
      } catch (err) {
        alert(err.message || 'Erreur lors de la suppression.');
      }
    }
  };

  const updateEvalStatus = async (id, newStatus) => {
    try {
      await api.updateEvaluationStatus(id, newStatus);
      setEvaluations(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
      const stats = await api.getDashboardStats();
      setDashboardStats(stats);
      const evalStats = await api.getEvalStats();
      setEvalStatsState(evalStats);
    } catch (err) {
      alert(err.message || 'Erreur lors du changement de statut.');
    }
  };

  // Filter listings based on inputs
  const filteredClasses = useMemo(() => {
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cls.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (cls.level && cls.level.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, classes]);

  const filteredProfs = useMemo(() => {
    return professors.filter(prof =>
      prof.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prof.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, professors]);

  const filteredModules = useMemo(() => {
    return modules.filter(mod => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = mod.name.toLowerCase().includes(q) ||
        (mod.className && mod.className.toLowerCase().includes(q)) ||
        (mod.teacher && mod.teacher.toLowerCase().includes(q));
      const matchesClass = !modFilterClass || mod.className === modFilterClass;
      const matchesSemester = !modFilterSemester || String(mod.semester) === String(modFilterSemester);
      return matchesSearch && matchesClass && matchesSemester;
    });
  }, [searchQuery, modules, modFilterClass, modFilterSemester]);

  const filteredEvaluations = useMemo(() => {
    const ayObj = academicYears.find(ay => ay.label === selectedYear);
    return evaluations.filter(ev => {
      if (ayObj && ev.academic_year_id && ev.academic_year_id !== ayObj.id) return false;
      const q = searchQuery.toLowerCase();
      const matchesSearch = (ev.moduleName || '').toLowerCase().includes(q) ||
        ((ev.classGroup || '').toLowerCase().includes(q));
      const matchesClass = !evalFilterClass || ev.classGroup === evalFilterClass;
      const matchesStatus = !evalFilterStatus || ev.status === evalFilterStatus;
      return matchesSearch && matchesClass && matchesStatus;
    });
  }, [searchQuery, evaluations, selectedYear, academicYears, evalFilterClass, evalFilterStatus]);

  const nextEvaluation = useMemo(() => {
    const planned = evaluations.filter(e => e.status === 'PlanifiÃ©');
    if (planned.length === 0) return null;
    return planned.sort((a, b) => new Date(a.eval_date + 'T' + a.eval_time) - new Date(b.eval_date + 'T' + b.eval_time))[0];
  }, [evaluations]);

  // Chart configuration constants based on active theme
  const chartGridColor = darkMode ? "#1e293b" : "#e2e8f0";
  const chartTooltipStyle = useMemo(() => {
    return darkMode
      ? { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f1f5f9' }
      : { backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', color: '#0f172a' };
  }, [darkMode]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="flex min-h-screen bg-bg-main text-text-main font-sans antialiased selection:bg-emerald-500 selection:text-white transition-colors duration-200">

      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-teal-500/5 dark:bg-teal-500/3 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r border-border-main bg-bg-sidebar/85 backdrop-blur-xl flex flex-col z-40 h-screen transition-transform duration-300 md:sticky md:top-0 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
        {/* Brand Header */}
        <div className="p-5 border-b border-border-main flex items-center gap-3">
          <img
            src="/logo-esi.jpg"
            alt="Logo ESI"
            className="w-12 h-12 rounded-xl object-contain bg-white p-0.5 shadow-md flex-shrink-0"
          />
          <div>
            <h1 className="font-heading font-extrabold text-lg tracking-tight text-emerald-600 dark:text-emerald-400 m-0 leading-none">
              ESIManage Pro
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'emploidutemps', label: 'Emplois du Temps', icon: Calendar },
            { id: 'classes', label: 'Niveaux', icon: Users },
            { id: 'professeurs', label: 'Professeurs', icon: GraduationCap },
            { id: 'modules', label: 'Modules', icon: Layers },
            { id: 'evaluations', label: 'Evaluations', icon: ClipboardCheck },
            { id: 'statistiques', label: 'Statistiques', icon: BarChart3 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentTab(tab.id);
                  setSearchQuery('');
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${currentTab === tab.id
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-hover'
                  }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-105 ${currentTab === tab.id ? 'text-white' : 'text-text-muted'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-border-main bg-slate-100/10 dark:bg-slate-950/20">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-rose-500/10 group transition-all"
            title="Se dÃ©connecter"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 group-hover:from-rose-500 group-hover:to-red-500 flex items-center justify-center text-white transition-all">
              <UserCog className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-text-main group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors truncate leading-tight">
                Se dÃ©connecter
              </p>
            </div>
            <LogOut className="w-4 h-4 text-text-muted group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden transition-colors duration-200">

        {/* Top Header */}
        <header className="min-h-[5rem] py-3 border-b border-border-main bg-bg-header/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-10 sticky top-0 transition-colors duration-200 gap-4">
          <div className="flex items-center gap-3 md:gap-0 overflow-hidden">
            <button
              className="md:hidden p-2 -ml-2 text-text-muted hover:text-text-main hover:bg-bg-hover rounded-xl transition flex-shrink-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="min-w-0">
              <h2 className="font-heading font-bold text-lg md:text-xl tracking-tight text-text-main m-0 truncate">
                {currentTab === 'dashboard' && "Gestion du Temps & Planification"}
                {currentTab === 'emploidutemps' && "Emplois du Temps Hebdomadaire"}
                {currentTab === 'classes' && "Gestion des Niveaux / Groupes"}
                {currentTab === 'professeurs' && "Registre des Enseignants"}
                {currentTab === 'modules' && "Modules d'Enseignement"}
                {currentTab === 'evaluations' && "Agenda des Evaluations"}
                {currentTab === 'statistiques' && "Statistiques des Modules"}
              </h2>
              <p className="hidden md:block text-xs text-text-muted mt-0.5 truncate">
                {currentTab === 'dashboard' && "Emploi du temps d'aujourd'hui et alertes en direct."}
                {currentTab === 'emploidutemps' && "Grille hebdomadaire de toutes les sÃ©ances programmÃ©es par groupe et salle."}
                {currentTab === 'classes' && "Suivi des promotions, dÃ©lÃ©guÃ©s et progression du programme."}
                {currentTab === 'professeurs' && "DisponibilitÃ© et charge d'enseignement des professeurs."}
                {currentTab === 'modules' && "Coefficients, crÃ©dits et dÃ©partements acadÃ©miques."}
                {currentTab === 'evaluations' && "Sessions de contrÃ´les, examens et soutenances de projets."}
                {currentTab === 'statistiques' && "Visualisation analytique de l'utilisation des ressources."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 text-text-muted hover:text-text-main bg-bg-surface hover:bg-bg-hover border border-border-main rounded-xl transition-all shadow-sm"
              title={darkMode ? "Activer le mode clair" : "Activer le mode sombre"}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>


            <div className="hidden sm:block text-right relative group">
              <div className="text-xs font-semibold text-text-main leading-none cursor-pointer group-hover:text-emerald-500 transition-colors py-2 flex items-center gap-1.5 justify-end">
                AnnÃ©e {selectedYear}
              </div>
              <div className="absolute right-0 top-full mt-0 bg-bg-surface border border-border-main rounded-xl shadow-xl shadow-emerald-500/10 overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 w-32 py-1">
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-emerald-500/10 transition-colors ${selectedYear === year ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'text-text-main'}`}
                  >
                    AnnÃ©e {year}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Core Content Padding */}
        <div className="flex-1 p-4 md:p-8 space-y-6 md:space-y-8 max-w-7xl w-full mx-auto animate-fade-in overflow-x-hidden">

          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

                {[
                  { title: "Total Groupes", value: `${dashboardStats.totalClasses || 0} Classes`, border: "bg-emerald-500", icon: Users, color: "text-emerald-500 dark:text-emerald-400 bg-emerald-500/10" },
                  { title: "Professeurs Actifs", value: `${dashboardStats.totalProfessors || 0} Enseignants`, border: "bg-teal-500", icon: GraduationCap, color: "text-teal-500 dark:text-teal-400 bg-teal-500/10" },
                  { title: "Eval. PlanifiÃ©es", value: `${dashboardStats.upcomingEvals || 0} Examens`, border: "bg-amber-500", icon: ClipboardCheck, color: "text-amber-500 dark:text-amber-400 bg-amber-500/10" }
                ].map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl relative overflow-hidden transition-colors duration-200">
                      <div className={`absolute top-0 left-0 w-1 h-full ${stat.border}`}></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted m-0">{stat.title}</p>
                          <h3 className="font-heading font-extrabold text-2xl text-text-main mt-2 mb-0">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  );
                })}

              </div>

              {/* Main Timetable Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Schedule timeline list */}
                <div className="lg:col-span-2 bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl space-y-6 transition-colors duration-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-heading font-semibold text-lg text-text-main m-0">Planning d'Aujourd'hui</h4>
                      <p className="text-xs text-text-muted">SÃ©ances programmÃ©es pour la journÃ©e en cours.</p>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full uppercase tracking-wide">
                      Aujourd'hui
                    </span>
                  </div>

                  <div className="space-y-4">
                    {todayScheduleState.length > 0 ? todayScheduleState.map((sch) => (
                      <div
                        key={sch.id}
                        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 rounded-xl border border-l-4 transition duration-200 hover:bg-bg-hover ${sch.color}`}
                      >
                        <div className="space-y-1">
                          <span className="text-xs font-mono font-bold opacity-75">{sch.time}</span>
                          <h5 className="font-heading font-bold text-sm text-text-main">{sch.subject}</h5>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted mt-1">
                            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {sch.classGroup}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {sch.room}</span>
                            <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> {sch.professor}</span>
                          </div>
                        </div>

                        <div className="mt-3 sm:mt-0 flex items-center justify-between sm:justify-end">
                          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-bg-main text-text-main border border-border-main uppercase tracking-wider">
                            {sch.type}
                          </span>
                        </div>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-text-muted text-sm border border-dashed border-border-main rounded-xl">
                        Aucune sÃ©ance programmÃ©e pour aujourd'hui.
                      </div>
                    )}
                  </div>
                </div>

                {/* Status panels (Sidebar column) */}
                <div className="space-y-8">
                  {nextEvaluation ? (
                    <div className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl transition-colors duration-200">
                      <h4 className="font-heading font-semibold text-base text-text-main mb-4">Prochaine Ã‰valuation</h4>
                      <div className="bg-bg-main border border-border-main p-4 rounded-xl space-y-3 transition-colors duration-200">
                        <div className="flex justify-between text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          <span>{nextEvaluation.type}</span>
                          <span>{nextEvaluation.eval_date ? new Date(nextEvaluation.eval_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : nextEvaluation.date}</span>
                        </div>
                        <h5 className="font-heading font-bold text-sm text-text-main">{nextEvaluation.moduleName}</h5>
                        <div className="text-xs text-text-muted space-y-1">
                          <p>Groupe: {nextEvaluation.classGroup}</p>
                          <p>Date: {nextEvaluation.eval_date ? new Date(nextEvaluation.eval_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : nextEvaluation.date} ({(nextEvaluation.eval_time || nextEvaluation.time || '').substring(0, 5)})</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-bg-surface border border-border-main p-6 rounded-2xl text-center text-text-muted text-sm">
                      Aucune Ã©valuation planifiÃ©e.
                    </div>
                  )}

                  {professors.some(p => p.availability === 'Absent') && (
                    <div className="bg-pink-500/5 border border-pink-500/20 p-5 rounded-2xl flex items-start gap-4">
                      <ShieldAlert className="w-6 h-6 text-pink-500 flex-shrink-0" />
                      <div>
                        <h5 className="font-bold text-xs text-pink-600 dark:text-pink-400 uppercase tracking-wide">Alerte DisponibilitÃ©</h5>
                        <p className="text-[11px] text-text-muted mt-1 leading-relaxed">
                          Enseignant(s) absent(s) aujourd'hui : {professors.filter(p => p.availability === 'Absent').map(p => p.name).join(', ')}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: EMPLOI DU TEMPS */}
          {currentTab === 'emploidutemps' && (
            <EmploiDuTempsView darkMode={darkMode} selectedYear={selectedYear} timetables={timetables} setTimetables={setTimetables} onDataChange={loadData} />
          )}

          {/* TAB 3: CLASSES */}
          {currentTab === 'classes' && selectedClass ? (
            <ClassDetailView
              cls={selectedClass}
              onBack={() => setSelectedClass(null)}
              modules={modules}
              evaluations={evaluations}
              timetables={timetables}
              setTimetables={setTimetables}
              darkMode={darkMode}
              openEditMod={openEditMod}
              deleteMod={deleteMod}
              openAddMod={openAddMod}
              openEditEval={openEditEval}
              deleteEval={deleteEval}
              openAddEval={openAddEval}
              updateEvalStatus={updateEvalStatus}
            />
          ) : currentTab === 'classes' && (
            <div className="space-y-6">
              {/* Header Controls */}
              <div className="flex justify-between items-center border-b border-border-main pb-4">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Filtrer les classes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-main rounded-xl text-xs placeholder-slate-400 text-text-main focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Class Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClasses.map(cls => {
                  const isLicence = cls.level === 'Licence';
                  const isM1 = cls.level === 'Master 1';
                  const levelColor = isLicence
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : isM1
                      ? 'bg-teal-500/10 text-teal-600 border-teal-500/20'
                      : 'bg-teal-500/10 text-teal-600 border-teal-500/20';
                  return (
                    <div key={cls.id} className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition duration-200">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-heading font-extrabold text-xl text-text-main m-0 leading-none">{cls.name}</h4>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap flex-shrink-0 ${levelColor}`}>
                            {cls.level}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-2 leading-snug">{cls.specialty}</p>

                        <div className="mt-5 space-y-2.5 text-xs text-text-muted">
                          <div className="flex justify-between">
                            <span>Effectif :</span>
                            <span className="font-bold text-text-main">{cls.studentCount > 0 ? `${cls.studentCount} Ã‰tudiants` : 'Non dÃ©fini'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DÃ©lÃ©guÃ© :</span>
                            <span className="font-medium text-text-main">{cls.representative || 'Non dÃ©fini'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-border-main space-y-3">
                        <div>
                          <div className="flex justify-between items-center text-xs text-text-muted mb-1.5">
                            <span>Progression Programme</span>
                            <span className="font-bold text-text-main">{cls.scheduleProgress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${cls.scheduleProgress < 40 ? 'bg-rose-500' : cls.scheduleProgress < 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${cls.scheduleProgress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedClass(cls)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition"
                          >
                            <LayoutDashboard className="w-3.5 h-3.5" />
                            DÃ©tails
                          </button>
                          <button
                            onClick={() => openEditCls(cls)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold border border-border-main rounded-lg text-text-muted hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Modifier
                          </button>
                          <button
                            onClick={() => deleteCls(cls.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold border border-border-main rounded-lg text-text-muted hover:text-rose-600 hover:border-rose-400 hover:bg-rose-500/5 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredClasses.length === 0 && (
                  <div className="col-span-3 text-center py-16 text-text-muted text-sm">
                    Aucune classe trouvÃ©e.
                  </div>
                )}
              </div>

              {/* Edit Class Modal */}
              {clsModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  <div className="bg-bg-surface border border-border-main rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-text-main">Modifier la classe</h3>
                      <button onClick={closeCls} className="p-1.5 rounded-lg hover:bg-bg-main text-text-muted hover:text-text-main transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Nom de la classe *</label>
                        <input
                          type="text"
                          value={clsModal.data.name}
                          onChange={e => handleClsField('name', e.target.value)}
                          placeholder="Ex : TC1"
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Effectif (nb Ã©tudiants)</label>
                        <input
                          type="number"
                          min="0"
                          value={clsModal.data.studentCount}
                          onChange={e => handleClsField('studentCount', e.target.value)}
                          placeholder="Ex : 45"
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">DÃ©lÃ©guÃ©</label>
                        <input
                          type="text"
                          value={clsModal.data.representative}
                          onChange={e => handleClsField('representative', e.target.value)}
                          placeholder="Ex : Amine Khelifi"
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>

                    {clsFormError && (
                      <p className="text-xs text-rose-500 font-semibold">{clsFormError}</p>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={closeCls}
                        className="flex-1 py-2 text-sm font-semibold border border-border-main rounded-xl text-text-muted hover:bg-bg-main transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveCls}
                        className="flex-1 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm shadow-emerald-500/20"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFESSEURS */}
          {currentTab === 'professeurs' && (
            <div className="space-y-6">
              {/* Header Controls */}
              <div className="flex justify-between items-center border-b border-border-main pb-4">
                <div className="relative max-w-sm w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Chercher un enseignant..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-main rounded-xl text-xs placeholder-slate-400 text-text-main focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  onClick={openAddProf}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-emerald-500/20"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter un enseignant
                </button>
              </div>

              {/* Profs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProfs.map(prof => (
                  <div key={prof.id} className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl flex flex-col justify-between hover:border-emerald-500/30 transition duration-200 group">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm text-white ${prof.avatarBg} shadow-inner flex-shrink-0`}>
                        {prof.name.split(' ').filter(n => !n.includes('.')).map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-bold text-sm text-text-main m-0 truncate">{prof.name}</h4>
                        <p className="text-[10px] font-semibold text-text-muted mt-1 uppercase tracking-wider truncate">{prof.department}</p>
                        <p className="text-xs text-text-muted font-mono mt-1 truncate">{prof.email}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-border-main space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wide">Modules Actifs :</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {prof.activeModules.length > 0 ? prof.activeModules.map((mod, index) => (
                            <span key={index} className="text-[10px] bg-bg-main px-2 py-0.5 rounded text-text-main border border-border-main font-semibold">
                              {mod}
                            </span>
                          )) : <span className="text-[10px] text-text-muted italic">Aucun module</span>}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => openEditProf(prof)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold border border-border-main rounded-lg text-text-muted hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Modifier
                        </button>
                        <button
                          onClick={() => deleteProf(prof.id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold border border-border-main rounded-lg text-text-muted hover:text-rose-600 hover:border-rose-400 hover:bg-rose-500/5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProfs.length === 0 && (
                  <div className="col-span-3 text-center py-16 text-text-muted text-sm">
                    Aucun enseignant trouvÃ©.
                  </div>
                )}
              </div>

              {/* Add/Edit Modal */}
              {profModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  <div className="bg-bg-surface border border-border-main rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-fade-in">
                    {/* Modal Header */}
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-text-main">
                        {profModal.mode === 'add' ? 'Ajouter un enseignant' : 'Modifier l\'enseignant'}
                      </h3>
                      <button onClick={closeProf} className="p-1.5 rounded-lg hover:bg-bg-main text-text-muted hover:text-text-main transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Nom complet *</label>
                        <input
                          type="text"
                          value={profModal.data.name}
                          onChange={e => handleProfField('name', e.target.value)}
                          placeholder="Ex : Dr. Ahmed Benali"
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">DÃ©partement *</label>
                        <input
                          type="text"
                          value={profModal.data.department}
                          onChange={e => handleProfField('department', e.target.value)}
                          placeholder="Ex : GÃ©nie Logiciel"
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Email *</label>
                        <input
                          type="email"
                          value={profModal.data.email}
                          onChange={e => handleProfField('email', e.target.value)}
                          placeholder="Ex : a.benali@esi.dz"
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Modules actifs <span className="normal-case font-normal">(sÃ©parÃ©s par des virgules)</span></label>
                        <input
                          type="text"
                          value={profModal.data.activeModules}
                          onChange={e => handleProfField('activeModules', e.target.value)}
                          placeholder="Ex : Algorithmique, Bases de DonnÃ©es"
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>
                    </div>

                    {profFormError && (
                      <p className="text-xs text-rose-500 font-semibold">{profFormError}</p>
                    )}

                    {/* Modal Actions */}
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={closeProf}
                        className="flex-1 py-2 text-sm font-semibold border border-border-main rounded-xl text-text-muted hover:bg-bg-main transition"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveProf}
                        className="flex-1 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm shadow-emerald-500/20"
                      >
                        {profModal.mode === 'add' ? 'Ajouter' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}



          {/* TAB 5: MODULES */}
          {currentTab === 'modules' && (
            <div className="space-y-6">
              {/* Header Controls */}
              <div className="space-y-3 border-b border-border-main pb-4">
                <div className="flex justify-between items-center">
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Filtrer par module, classe ou enseignant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-main rounded-xl text-xs placeholder-slate-400 text-text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={openAddMod}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter un module
                  </button>
                </div>
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filtres :</span>
                  {/* Class filter */}
                  {['', ...Array.from(new Set(modules.map(m => m.className).filter(Boolean))).sort()].map(cls => (
                    <button
                      key={cls || '__all__'}
                      onClick={() => setModFilterClass(cls)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${modFilterClass === cls
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-bg-surface text-text-muted border-border-main hover:border-emerald-500 hover:text-emerald-600'}`}
                    >
                      {cls || 'Toutes les classes'}
                    </button>
                  ))}
                  <span className="w-px h-4 bg-border-main mx-1"></span>
                  {/* Semester filter */}
                  {['', ...Array.from(new Set(modules.map(m => m.semester).filter(Boolean))).sort()].map(sem => (
                    <button
                      key={sem || '__allsem__'}
                      onClick={() => setModFilterSemester(String(sem))}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${modFilterSemester === String(sem)
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-bg-surface text-text-muted border-border-main hover:border-indigo-500 hover:text-indigo-600'}`}
                    >
                      {sem ? `Sem. ${sem}` : 'Tous les semestres'}
                    </button>
                  ))}
                  {(modFilterClass || modFilterSemester) && (
                    <button
                      onClick={() => { setModFilterClass(''); setModFilterSemester(''); }}
                      className="ml-auto text-[10px] font-semibold text-rose-500 hover:text-rose-700 transition flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> RÃ©initialiser
                    </button>
                  )}
                </div>
              </div>

              {/* Modules List View (Accordion) */}
              <div className="space-y-3">
                {filteredModules.map(mod => {
                  const isExpanded = expandedModuleId === mod.id;
                  const toggleExpand = () => setExpandedModuleId(isExpanded ? null : mod.id);

                  return (
                    <div key={mod.id} className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none rounded-2xl overflow-hidden transition-colors duration-200">
                      {/* Compact Header (Always visible) */}
                      <div
                        onClick={toggleExpand}
                        className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-bg-hover transition"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-heading font-bold text-base md:text-lg text-text-main m-0">{mod.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 border
                              ${mod.status === 'TerminÃ©' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}
                            `}>
                              {mod.status}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted mt-1">Semestre: {mod.semester} | Classe: {mod.className}</p>
                        </div>

                        <div className="flex items-center gap-6 md:w-1/3">
                          <div className="flex-1">
                            <div className="flex justify-between items-center text-[10px] text-text-muted mb-1 font-semibold">
                              <span>Progression</span>
                              <span>{mod.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-bg-main rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${mod.progress < 40 ? 'bg-rose-500' : mod.progress < 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                                style={{ width: `${mod.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className={`p-1.5 rounded-lg border border-border-main text-text-muted transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-bg-main' : ''}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 md:p-5 border-t border-border-main bg-slate-50/50 dark:bg-slate-900/20 animate-fade-in">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3 text-xs text-text-muted">
                              <div className="flex items-center">
                                <span className="w-32 font-semibold">Enseignant:</span>
                                <span className={`font-medium ${mod.teacher && mod.teacher !== 'Non assignÃ©' ? 'text-text-main' : 'text-text-muted italic'}`}>
                                  {mod.teacher && mod.teacher !== 'Non assignÃ©' ? mod.teacher : 'Non dÃ©fini'}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-32 font-semibold">PrÃ©requis:</span>
                                <span className="text-text-main">{mod.prerequisite || 'Aucun'}</span>
                              </div>
                              <div className="flex items-center">
                                <span className="w-32 font-semibold">Volume horaire:</span>
                                <span className="text-text-main font-mono">{mod.totalHours}h (Reste: {mod.remainingHours}h)</span>
                              </div>
                            </div>

                            <div className="flex items-end justify-end gap-2 mt-4 md:mt-0">
                              <button
                                onClick={(e) => { e.stopPropagation(); openEditMod(mod); }}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border-main rounded-xl text-text-muted hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-500/5 transition"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Modifier
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteMod(mod.id); }}
                                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold border border-border-main rounded-xl text-text-muted hover:text-rose-600 hover:border-rose-400 hover:bg-rose-500/5 transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Module Modal */}
              {modModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  <div className="bg-bg-surface border border-border-main rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-fade-in my-8">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-text-main">
                        {modModal.mode === 'add' ? 'Ajouter un module' : 'Modifier le module'}
                      </h3>
                      <button onClick={closeMod} className="p-1.5 rounded-lg hover:bg-bg-main text-text-muted hover:text-text-main transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Nom du module *</label>
                        <input type="text" value={modModal.data.name} onChange={e => handleModField('name', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Enseignant <span className="text-text-muted normal-case font-normal">(optionnel)</span></label>
                        <input type="text" placeholder="Non dÃ©fini" value={modModal.data.teacher} onChange={e => handleModField('teacher', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Classe *</label>
                        <input type="text" value={modModal.data.className} onChange={e => handleModField('className', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Semestre *</label>
                        <input type="text" value={modModal.data.semester} onChange={e => handleModField('semester', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Statut</label>
                        <select value={modModal.data.status} onChange={e => handleModField('status', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition">
                          <option value="En cours">En cours</option>
                          <option value="TerminÃ©">TerminÃ©</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Heures totales</label>
                        <input type="number" value={modModal.data.totalHours} onChange={e => handleModField('totalHours', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Heures restantes</label>
                        <input type="number" value={modModal.data.remainingHours} onChange={e => handleModField('remainingHours', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Progression (%)</label>
                        <input type="number" value={modModal.data.progress} onChange={e => handleModField('progress', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">PrÃ©requis</label>
                        <input type="text" value={modModal.data.prerequisite} onChange={e => handleModField('prerequisite', e.target.value)} placeholder="Laisser vide si aucun" className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                    </div>

                    {modFormError && <p className="text-xs text-rose-500 font-semibold">{modFormError}</p>}

                    <div className="flex gap-3 pt-2">
                      <button onClick={closeMod} className="flex-1 py-2 text-sm font-semibold border border-border-main rounded-xl text-text-muted hover:bg-bg-main transition">Annuler</button>
                      <button onClick={saveMod} className="flex-1 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm shadow-emerald-500/20">Enregistrer</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: EVALUATIONS */}
          {currentTab === 'evaluations' && (
            <div className="space-y-6">
              {/* Header Controls */}
              <div className="space-y-3 border-b border-border-main pb-4">
                <div className="flex justify-between items-center">
                  <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Filtrer par module ou classe..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-bg-surface border border-border-main rounded-xl text-xs placeholder-slate-400 text-text-main focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <button
                    onClick={openAddEval}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-sm shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter une Ã©valuation
                  </button>
                </div>
                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Filtres :</span>
                  {/* Class filter */}
                  {['', ...Array.from(new Set(evaluations.map(e => e.classGroup).filter(Boolean))).sort()].map(cls => (
                    <button
                      key={cls || '__all__'}
                      onClick={() => setEvalFilterClass(cls)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${evalFilterClass === cls
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-bg-surface text-text-muted border-border-main hover:border-emerald-500 hover:text-emerald-600'}`}
                    >
                      {cls || 'Toutes les classes'}
                    </button>
                  ))}
                  <span className="w-px h-4 bg-border-main mx-1"></span>
                  {/* Status filter */}
                  {[
                    { value: '', label: 'Tous les statuts' },
                    { value: 'PlanifiÃ©', label: 'PlanifiÃ©' },
                    { value: 'EffectuÃ©', label: 'EffectuÃ©' },
                  ].map(opt => (
                    <button
                      key={opt.value || '__allst__'}
                      onClick={() => setEvalFilterStatus(opt.value)}
                      className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${evalFilterStatus === opt.value
                        ? opt.value === 'EffectuÃ©' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : opt.value === 'PlanifiÃ©' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-600 text-white border-slate-600 shadow-sm'
                        : 'bg-bg-surface text-text-muted border-border-main hover:border-emerald-500 hover:text-emerald-600'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                  {(evalFilterClass || evalFilterStatus) && (
                    <button
                      onClick={() => { setEvalFilterClass(''); setEvalFilterStatus(''); }}
                      className="ml-auto text-[10px] font-semibold text-rose-500 hover:text-rose-700 transition flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> RÃ©initialiser
                    </button>
                  )}
                </div>
              </div>

              {/* Evaluations Table */}
              <div className="overflow-x-auto rounded-xl border border-border-main bg-bg-surface shadow-sm dark:shadow-none transition-colors duration-200">
                <table className="w-full border-collapse text-left min-w-[600px]">
                  <thead>
                    <tr className="bg-bg-hover text-text-muted text-xs font-semibold uppercase tracking-wider border-b border-border-main">
                      <th className="p-4 pl-6">Module</th>
                      <th className="p-4">Classe</th>
                      <th className="p-4">Date et Heure</th>
                      <th className="p-4 text-center">Statut</th>
                      <th className="p-4 pr-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-main text-sm">
                    {filteredEvaluations.length > 0 ? filteredEvaluations.map(ev => (
                      <tr key={ev.id} className="hover:bg-bg-hover transition duration-150 group">
                        <td className="p-4 pl-6">
                          <div>
                            <h5 className="font-heading font-semibold text-text-main m-0">{ev.moduleName}</h5>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-text-main">{ev.classGroup}</td>
                        <td className="p-4 text-text-muted text-xs">
                          <span className="block font-medium">{ev.date}</span>
                          <span className="font-mono text-[10px]">{(ev.time || '').substring(0, 5)}</span>
                        </td>
                        <td className="p-4 text-center">
                          <select
                            value={ev.status}
                            onChange={e => updateEvalStatus(ev.id, e.target.value)}
                            className={`text-[10px] font-bold uppercase rounded-full border px-2.5 py-1 cursor-pointer focus:outline-none transition
                              ${ev.status === 'EffectuÃ©'  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                             'bg-indigo-500/10  text-indigo-600  border-indigo-500/20'  }
                            `}
                          >
                            <option value="PlanifiÃ©">PlanifiÃ©</option>
                            <option value="EffectuÃ©">EffectuÃ©</option>
                          </select>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openEditEval(ev)} className="p-1.5 text-text-muted hover:text-emerald-600 hover:bg-emerald-500/10 rounded-lg transition">
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteEval(ev.id)} className="p-1.5 text-text-muted hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" className="text-center py-10 text-text-muted text-sm">Aucune Ã©valuation trouvÃ©e.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Evaluation Modal */}
              {evalModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}>
                  <div className="bg-bg-surface border border-border-main rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-fade-in my-8">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-base text-text-main">
                        {evalModal.mode === 'add' ? 'Ajouter une Ã©valuation' : 'Modifier l\'Ã©valuation'}
                      </h3>
                      <button onClick={closeEval} className="p-1.5 rounded-lg hover:bg-bg-main text-text-muted hover:text-text-main transition">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Module *</label>
                        <input
                          type="text"
                          list="evaluation-modules"
                          placeholder="SÃ©lectionner ou saisir un module..."
                          value={evalModal.data.moduleName}
                          onChange={e => handleEvalField('moduleName', e.target.value)}
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition"
                        />
                        <datalist id="evaluation-modules">
                          {modules.map(mod => <option key={mod.id} value={mod.name} />)}
                        </datalist>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Classe *</label>
                        <input
                          type="text"
                          list="evaluation-classes"
                          placeholder="SÃ©lectionner ou saisir une classe..."
                          value={evalModal.data.classGroup}
                          onChange={e => handleEvalField('classGroup', e.target.value)}
                          className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition"
                        />
                        <datalist id="evaluation-classes">
                          {classes.map(cls => <option key={cls.id} value={cls.name} />)}
                        </datalist>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Statut</label>
                        <select value={evalModal.data.status} onChange={e => handleEvalField('status', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition">
                          <option value="PlanifiÃ©">PlanifiÃ©</option>
                          <option value="EffectuÃ©">EffectuÃ©</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Date *</label>
                        <input type="date" value={evalModal.data.date} onChange={e => handleEvalField('date', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wide mb-1.5">Heure</label>
                        <input type="time" value={evalModal.data.time} onChange={e => handleEvalField('time', e.target.value)} className="w-full px-3 py-2 bg-bg-main border border-border-main rounded-xl text-sm text-text-main focus:border-emerald-500 transition" />
                      </div>
                    </div>

                    {evalFormError && <p className="text-xs text-rose-500 font-semibold">{evalFormError}</p>}

                    <div className="flex gap-3 pt-2">
                      <button onClick={closeEval} className="flex-1 py-2 text-sm font-semibold border border-border-main rounded-xl text-text-muted hover:bg-bg-main transition">Annuler</button>
                      <button onClick={saveEval} className="flex-1 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition shadow-sm shadow-emerald-500/20">
                        {evalModal.mode === 'add' ? 'Ajouter' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: STATISTIQUES */}
          {currentTab === 'statistiques' && (
            <div className="space-y-8 animate-fade-in">
              {/* Analytics Summary */}
              <div>
                {/* Global Module Progression Pie */}
                <div className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl transition-colors duration-200">
                  <div className="mb-6">
                    <h4 className="font-heading font-semibold text-lg text-text-main m-0">Progression Globale des Modules</h4>
                    <p className="text-xs text-text-muted mt-2">Heures realisees sur le volume horaire total de tous les modules, toutes classes confondues.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-bg-main border border-border-main rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Modules Totaux</p>
                      <p className="text-2xl font-bold text-text-main">{moduleProgressSummary.total}</p>
                    </div>
                    <div className="bg-bg-main border border-border-main rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Heures realisees</p>
                      <p className="text-2xl font-bold text-emerald-500">{moduleProgressSummary.completedHours}h</p>
                    </div>
                    <div className="bg-bg-main border border-border-main rounded-2xl p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Taux global</p>
                      <p className="text-2xl font-bold text-text-main">{moduleProgressSummary.average}%</p>
                    </div>
                  </div>

                  <div className="w-full h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => [`${value}%`, '']} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Pie
                          data={moduleProgressPieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          label={({ name, value }) => `${name} ${value}%`}
                          labelLine={false}
                        >
                          {moduleProgressPieData.map((entry, index) => (
                            <Cell key={`slice-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl transition-colors duration-200">
                <div>
                  <h4 className="font-heading font-semibold text-lg text-text-main m-0">Progression par Classe</h4>
                  <p className="text-xs text-text-muted mb-6">Pourcentage moyen de progression des modules pour chaque classe.</p>
                </div>
                <div className="w-full h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartClassProgressData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} interval={0} angle={-20} textAnchor="end" />
                      <YAxis domain={[0, 100]} stroke="#6b7280" fontSize={11} tickLine={false} />
                      <Tooltip contentStyle={chartTooltipStyle} />
                      <Bar dataKey="average" fill="#14b8a6" radius={[6, 6, 0, 0]} name="Progression %">
                        {chartClassProgressData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#6366f1' : '#14b8a6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* â”€â”€ Graphique Progression des Ã‰valuations â”€â”€ */}
              <div className="bg-bg-surface border border-border-main shadow-sm dark:shadow-none p-6 rounded-2xl transition-colors duration-200">
                <div className="mb-6">
                  <h4 className="font-heading font-semibold text-lg text-text-main m-0">Progression des Ã‰valuations</h4>
                  <p className="text-xs text-text-muted mt-2">RÃ©partition des Ã©valuations selon leur statut (EffectuÃ© / PlanifiÃ©).</p>
                </div>

                {/* KPI cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-bg-main border border-border-main rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Total</p>
                    <p className="text-2xl font-bold text-text-main">{evalStatsState.total}</p>
                  </div>
                  <div className="bg-bg-main border border-emerald-500/30 rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">EffectuÃ©es</p>
                    <p className="text-2xl font-bold text-emerald-500">{evalStatsState.effectue}</p>
                  </div>
                  <div className="bg-bg-main border border-indigo-500/30 rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">PlanifiÃ©es</p>
                    <p className="text-2xl font-bold text-indigo-400">{evalStatsState.planifie}</p>
                  </div>
                  <div className="bg-bg-main border border-amber-500/30 rounded-2xl p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-2">Taux rÃ©alisation</p>
                    <p className="text-2xl font-bold text-amber-500">{evalStatsState.tauxRealisation}%</p>
                  </div>
                </div>

                {/* Barre de progression */}
                <div className="mb-6">
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>RÃ©alisation</span>
                    <span className="font-semibold text-text-main">{evalStatsState.tauxRealisation}%</span>
                  </div>
                  <div className="w-full h-3 bg-bg-main rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                      style={{ width: `${evalStatsState.tauxRealisation}%` }}
                    />
                  </div>
                </div>

                {/* PieChart rÃ©partition */}
                {evalStatsState.chart.length > 0 ? (
                  <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(value, name) => [`${value} Ã©val.`, name]} />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        <Pie
                          data={evalStatsState.chart}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          label={({ name, value }) => `${name}: ${value}`}
                          labelLine={false}
                        >
                          {evalStatsState.chart.map((entry, index) => (
                            <Cell key={`eval-slice-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[100px] text-text-muted text-sm">
                    Aucune Ã©valuation enregistrÃ©e.
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="py-6 border-t border-border-main text-center text-[10px] text-text-muted mt-auto bg-slate-100/10 dark:bg-slate-950/10">
          ESIManage Pro Plateforme de Gestion des Emplois du Temps & des Evaluations.
        </footer>
      </main>

    </div>
  );
}

export default App;

