
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';

const Bank: React.FC = () => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFinancialData();
    }
  }, [user]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      // 1. Fetch balance from profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setBalance(parseFloat(profile?.balance || '0'));

      // 2. Fetch transactions
      const { data: txData, error: txError } = await supabase
        .from('instructor_transactions')
        .select(`
          id,
          amount,
          description,
          created_at,
          courses (title)
        `)
        .eq('instructor_id', user.id)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const earningsData = [
    { month: 'Jan', revenue: 4200 },
    { month: 'Feb', revenue: 3800 },
    { month: 'Mar', revenue: 4500 }, // Scaled down to match reality
    { month: 'Apr', revenue: balance > 0 ? balance * 0.8 : 1200 },
    { month: 'Jun', revenue: balance },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-12 animate-fade-in max-w-[1600px] mx-auto pb-24 lg:pb-10 bg-slate-100">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2 font-black">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
            Financial Dashboard
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">Earnings Bank</h1>
          <p className="text-slate-600 font-bold text-base">Manage your institutional revenue, payouts, and fiscal performance.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-slate-900 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 text-[10px] uppercase tracking-widest font-black">
            <span className="material-symbols-outlined font-black">receipt_long</span>
            Tax Documents
          </button>
          <button className="bg-brand-500 hover:bg-brand-600 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-3 shadow-xl shadow-brand-500/20 transition-all active:scale-95 text-[10px] uppercase tracking-widest font-black">
            <span className="material-symbols-outlined font-black">account_balance_wallet</span>
            Request Payout
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Revenue', value: `$${balance.toLocaleString()}`, icon: 'payments', color: 'brand' },
          { label: 'Available Balance', value: `$${balance.toLocaleString()}`, icon: 'account_balance', color: 'emerald' },
          { label: 'Pending Payouts', value: '$0', icon: 'hourglass_empty', color: 'amber' },
          { label: 'YTD Growth', value: '+0%', icon: 'trending_up', color: 'indigo' }
        ].map((s, i) => (
          <div key={i} className="bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm group">
            <div className={`w-14 h-14 rounded-2xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-6 shadow-inner border border-${s.color}-100`}>
              <span className="material-symbols-outlined text-3xl font-black">{s.icon}</span>
            </div>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">{s.label}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{s.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-2 bg-white p-12 rounded-[32px] border border-slate-200 shadow-sm flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-wider">Revenue Stream</h3>
              <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mt-1">Monthly Earnings Insight</p>
            </div>
            <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button className="px-4 py-2 text-[10px] font-black rounded-lg bg-white shadow-sm text-brand-600 uppercase">6M</button>
              <button className="px-4 py-2 text-[10px] font-black rounded-lg text-slate-600 hover:text-slate-800 uppercase">12M</button>
            </div>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={earningsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4850e5" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#4850e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '700', fill: '#475569' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '600', fill: '#475569' }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.08)', padding: '16px' }}
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4850e5" strokeWidth={4} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[32px] p-12 text-white shadow-2xl flex flex-col min-h-[500px]">
          <h3 className="text-xl font-black tracking-widest uppercase mb-10">Sale History</h3>
          <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-3">
            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                <span className="material-symbols-outlined text-4xl mb-4 font-black">receipt_long</span>
                <p className="text-[10px] font-black uppercase tracking-widest">No transactions found</p>
              </div>
            ) : (
              transactions.map((tx, i) => (
                <div key={i} className="flex flex-col gap-2 p-6 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-pointer">
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SALE-{tx.id.slice(0, 4)}</span>
                    <span className="text-xs font-black text-emerald-400">+${tx.amount.toLocaleString()}</span>
                  </div>
                  <h4 className="text-sm font-bold tracking-tight text-white">{tx.description}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase">{new Date(tx.created_at).toLocaleDateString()}</span>
                    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[8px] font-black uppercase tracking-widest">Success</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bank;
