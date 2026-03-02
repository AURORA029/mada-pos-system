import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, AlertTriangle, CheckCircle, Lock, Download, BarChart2, Calendar, Banknote, ShoppingBag } from 'lucide-react';
import { closingService } from '../services/closingService';
import api from '../services/api'; // <-- MASTER DEV FIX: Ajout de l'api pour le blob

function AdminStats() {
  const navigate = useNavigate();
  
  const currentYearNum = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYearNum.toString());
  
  const [history, setHistory] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  
  // Nouveaux etats pour les KPIs croises
  const [kpis, setKpis] = useState({
    current_month: { theoretical: 0, real: 0, gap: 0, orders: 0 },
    all_time: { theoretical: 0, real: 0, gap: 0, orders: 0 }
  });
  const [loading, setLoading] = useState(true);

  const monthNames = ["Jan", "Fev", "Mar", "Avr", "Mai", "Juin", "Juil", "Aou", "Sep", "Oct", "Nov", "Dec"];

  const generateAvailableYears = () => {
    const startYear = 2026;
    const years = [];
    for (let y = currentYearNum; y >= startYear; y--) {
      years.push(y.toString());
    }
    return years;
  };
  const availableYears = generateAvailableYears();

  const fetchDashboardData = async (year) => {
    setLoading(true);
    try {
      const [historyData, monthlyData, kpiData] = await Promise.all([
        closingService.getHistory(),
        closingService.getMonthlyStats(year),
        closingService.getKPIs() 
      ]);
      setHistory(historyData);
      setMonthlyStats(monthlyData);
      setKpis(kpiData);
    } catch (err) {
      console.error("[STATS_CTRL] Erreur lors du chargement des donnees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedYear);
  }, [selectedYear]);

  // MASTER DEV FIX : L'export est maintenant généré côté Backend (Architecture SRP)
  const exportToCSV = async () => {
    try {
      const response = await api.get('/api/stats/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MadaPOS_Stats_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error("Export error:", error);
      alert("Erreur lors de l'exportation des statistiques.");
    }
  };

  const maxRevenue = Math.max(...monthlyStats.map(m => Math.max(m.theoretical, m.real)), 1);

  if (loading && history.length === 0) {
    return <div className="p-8 text-center font-bold text-slate-600 min-h-screen bg-slate-50 flex items-center justify-center">Chargement des rapports...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <header className="mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <TrendingUp size={28} className="text-indigo-600" /> Rapports & Controle
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-xs tracking-widest">Controle de Gestion Administratif</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 active:scale-95">
            <Download size={18} /> Exporter CSV
          </button>
          <button onClick={() => navigate('/admin')} className="flex items-center gap-2 bg-white border-2 border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm active:scale-95">
            <ArrowLeft size={18} /> Retour Caisse
          </button>
        </div>
      </header>

      {/* --- BLOC GRAPHIQUE MENSUEL --- */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-8 p-6">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row mb-8 gap-4">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <BarChart2 size={20} className="text-indigo-600" /> Suivi Mensuel du Chiffre d'Affaires
          </h2>
          
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
            <Calendar size={18} className="text-slate-500" />
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-black text-slate-800 outline-none cursor-pointer"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="relative">
          <div className="flex justify-end gap-6 mb-8 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-200 rounded-sm"></div> Theorique</span>
            <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Reel (Caisse)</span>
          </div>
          
          <div className="flex h-80">
            {/* ECHELLE Y (PRIX) */}
            <div className="flex flex-col justify-between text-[10px] font-bold text-slate-400 pr-4 pb-8 border-r border-slate-100 whitespace-nowrap">
              <span>{maxRevenue.toLocaleString('fr-FR')} Ar</span>
              <span>{(maxRevenue / 2).toLocaleString('fr-FR')} Ar</span>
              <span>0 Ar</span>
            </div>

            {/* ZONE GRAPHIQUE FIXÉE POUR SAFARI (Absolute positioning) */}
            <div className="flex-grow flex justify-around gap-1 md:gap-4 px-2 md:px-4 pb-8 relative">
              {/* LIGNES DE GRILLE DE FOND */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-4 pb-8">
                <div className="w-full border-t border-slate-50"></div>
                <div className="w-full border-t border-slate-50"></div>
                <div className="w-full border-t border-slate-100"></div>
              </div>

              {monthlyStats.map((stat, index) => {
                const theoreticalHeight = (stat.theoretical / maxRevenue) * 100;
                const realHeight = (stat.real / maxRevenue) * 100;
                
                const monthIndex = parseInt(stat.month.split('-')[1], 10) - 1;
                const monthLabel = monthNames[monthIndex] || '??';
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 h-full relative group min-w-[40px]">
                    <div className="w-full h-full relative z-10 flex justify-center items-end gap-1 px-1">
                      
                      {/* TOOLTIP PLUS ROBUSTE */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-30">
                         <div className="bg-slate-900 text-white text-[9px] px-2 py-1 rounded shadow-xl whitespace-nowrap font-black border border-slate-700">
                           T: {stat.theoretical.toLocaleString()} | R: {stat.real.toLocaleString()}
                         </div>
                         <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                      </div>

                      {/* BARRE THÉORIQUE */}
                      <div 
                        className="w-[40%] bg-slate-200 rounded-t-md transition-all duration-500 ease-out" 
                        style={{ height: `${Math.max(theoreticalHeight, 2)}%` }}
                      >
                        {stat.theoretical > 0 && (
                          <span className="block -top-4 relative text-[7px] font-black text-slate-400 text-center">
                            {(stat.theoretical / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>

                      {/* BARRE RÉELLE */}
                      <div 
                        className="w-[40%] bg-indigo-500 rounded-t-md shadow-[0_-4px_10px_rgba(79,70,229,0.2)] transition-all duration-500 ease-out" 
                        style={{ height: `${Math.max(realHeight, 2)}%` }}
                      >
                        {stat.real > 0 && (
                          <span className="block -top-4 relative text-[7px] font-black text-indigo-600 text-center">
                            {(stat.real / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="mt-6 text-[9px] font-black text-slate-500 uppercase tracking-tighter">{monthLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* --- NOUVEAUX KPIs DU MOIS EN COURS --- */}
      <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">
        Statistiques de {monthNames[new Date().getMonth()]} {new Date().getFullYear()}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* KPI 1 : CA THEORIQUE */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span> Attendu (Systeme)
          </p>
          <p className="text-2xl font-black text-slate-900">{kpis.current_month.theoretical?.toLocaleString('fr-FR')} Ar</p>
        </div>
        
        {/* KPI 2 : CA REEL */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Declare (Caisse)
          </p>
          <p className="text-2xl font-black text-indigo-600">{kpis.current_month.real?.toLocaleString('fr-FR')} Ar</p>
        </div>

        {/* KPI 3 : ECART TOTAL */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Ecart mensuel
          </p>
          <p className={`text-2xl font-black ${kpis.current_month.gap >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {kpis.current_month.gap > 0 ? '+' : ''}{kpis.current_month.gap?.toLocaleString('fr-FR')} Ar
          </p>
        </div>

        {/* KPI 4 : COMMANDES */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <ShoppingBag size={12} className="text-slate-400" /> Commandes
          </p>
          <p className="text-2xl font-black text-slate-900">{kpis.current_month.orders}</p>
        </div>

      </div>

      {/* TABLEAU HISTORIQUE DES CLOTURES */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-wrap gap-2">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Historique des Clotures</h2>
          <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">30 derniers jours</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase tracking-widest text-slate-400">
                <th className="p-4 font-black">Date & Heure</th>
                <th className="p-4 font-black text-right">Declare (Caisse)</th>
                <th className="p-4 font-black text-right">Attendu (Systeme)</th>
                <th className="p-4 font-black text-right">Ecart</th>
                <th className="p-4 font-black">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">Aucune cloture enregistree recemment.</td></tr>
              ) : (
                history.map((record) => {
                  const dateObj = new Date(record.created_at);
                  const isPerfect = record.gap === 0;
                  const isPositive = record.gap > 0;
                  const isNegative = record.gap < 0;

                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <span className="block font-bold text-slate-900">{dateObj.toLocaleDateString('fr-FR')}</span>
                        <span className="block text-xs font-medium text-slate-500">{dateObj.toLocaleTimeString('fr-FR')}</span>
                      </td>
                      <td className="p-4 text-right font-black text-slate-700">{record.declared_cash.toLocaleString('fr-FR')} Ar</td>
                      <td className="p-4 text-right font-bold text-slate-400">{record.system_cash.toLocaleString('fr-FR')} Ar</td>
                      <td className="p-4 text-right">
                        <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg font-black text-sm border ${isPerfect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : isPositive ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          {isPerfect && <CheckCircle size={14} />}
                          {isNegative && <AlertTriangle size={14} />}
                          {isPositive ? '+' : ''}{record.gap.toLocaleString('fr-FR')} Ar
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-500 max-w-xs truncate">{record.notes || '-'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminStats;