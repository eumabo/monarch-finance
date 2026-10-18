import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownLeft, ArrowLeft, ArrowRight, ArrowUpRight, Bell, CalendarDays,
  Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  Clock3, CreditCard, Download, Edit3, Eye, EyeOff, FileJson, Filter,
  Flag, Goal, House, Landmark, LayoutDashboard, Menu, MoreHorizontal,
  Plus, ReceiptText, RefreshCcw, Search, Settings2, ShieldCheck,
  Sparkles, Target, Trash2, TrendingDown, TrendingUp, Upload, Wallet,
  X, Coins, PieChart, CalendarClock, RotateCcw, BadgeCheck, Banknote,
  ShoppingBag, Car, UtensilsCrossed, Dumbbell, HeartPulse, GraduationCap, Cloud, CloudOff, LogOut,
  Gamepad2, Wifi, Home, Package, CircleDollarSign, HandCoins, BriefcaseBusiness
} from 'lucide-react';

const STORAGE_KEY = 'monarch-finance-v1';
const CURRENCY = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const icons = {
  'Alimentação': UtensilsCrossed, 'Transporte': Car, 'Moradia': House, 'Saúde': HeartPulse,
  'Educação': GraduationCap, 'Lazer': Gamepad2, 'Assinaturas': Wifi, 'Contas': ReceiptText,
  'Compras': ShoppingBag, 'Academia': Dumbbell, 'Investimentos': TrendingUp,
  'Salário': Banknote, 'Freelance': BriefcaseBusiness, 'Vendas': ShoppingBag,
  'Rendimentos': Coins, 'Outros': Wallet,
};
const expenseCategories = ['Alimentação','Transporte','Moradia','Saúde','Educação','Lazer','Assinaturas','Contas','Compras','Academia','Investimentos','Outros'];
const incomeCategories = ['Salário','Freelance','Vendas','Rendimentos','Outros'];
const newId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const isoDate = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const todayISO = () => isoDate(new Date());
const monthKey = (date) => date.slice(0,7);
const monthToDate = (str) => new Date(Number(str.slice(0,4)), Number(str.slice(5,7))-1, 1);
const shiftMonth = (key, shift) => { const d = monthToDate(key); d.setMonth(d.getMonth() + shift); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; };
const longMonth = (key) => { const d = monthToDate(key); return `${monthNames[d.getMonth()]} ${d.getFullYear()}`; };
const smallDate = (date) => new Date(date + 'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}).replace('.','');
const formatMoney = (n) => CURRENCY.format(Number(n) || 0);
const parseMoney = (value) => { const s = String(value ?? '').trim().replace(/\s|R\$/g, ''); if (!s) return NaN; if (s.includes(',')) return Number(s.replace(/\./g,'').replace(',','.')); if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g,'')); return Number(s); };
const blankState = () => ({ schema: 1, userName: 'Monarca', openingBalance: 0, hideValues: false, transactions: [], bills: [], goals: [] });
const readStored = () => { try { const data = JSON.parse(localStorage.getItem(STORAGE_KEY)); if (data && Array.isArray(data.transactions) && Array.isArray(data.bills) && Array.isArray(data.goals)) return { ...blankState(), ...data }; } catch {} return blankState(); };
const billDueDate = (bill, month) => { const d = monthToDate(month); return isoDate(new Date(d.getFullYear(),d.getMonth(), Math.min(Number(bill.dueDay), new Date(d.getFullYear(),d.getMonth()+1,0).getDate()))); };
const billApplies = (bill, month) => (bill.recurring ? month >= bill.startMonth && (!bill.endMonth || month < bill.endMonth) : month === bill.startMonth);
function getBillsForMonth(allBills, transactions, month) {
  return allBills.filter(b => billApplies(b,month)).map(b => {
    const payment = transactions.find(tx => tx.billId === b.id && tx.billMonth === month);
    const dueDate = billDueDate(b,month);
    const status = payment ? (payment.date < dueDate ? 'Adiantada' : 'Paga') : dueDate < todayISO() ? 'Vencida' : 'Pendente';
    return { ...b, dueDate, payment, status };
  }).sort((a,b) => a.dueDate.localeCompare(b.dueDate));
}
const IconFor = ({ category, size=18 }) => { const Component = icons[category] || Wallet; return <Component size={size} strokeWidth={1.7}/>; };
function GlassLogo({ size='regular' }) { return <div className={`glass-logo ${size}`}><img src="/assets/monarch-mark.webp" alt="Emblema MONARCH" /></div>; }
function EmptyState({ icon: Icon=ReceiptText, title, subtitle, action, onClick }) {
  return <div className="empty-state"><div className="empty-orbit"><Icon size={25} strokeWidth={1.3}/></div><h3>{title}</h3><p>{subtitle}</p>{action && <button type="button" className="btn ghost small" onClick={onClick}><Plus size={15}/>{action}</button>}</div>;
}
function Balance({ value, hidden, className='' }) { return <span className={className}>{hidden ? 'R$ ••••••' : formatMoney(value)}</span>; }
function Chip({ children, tone='' }) { return <span className={`status-chip ${tone}`}>{children}</span>; }
function Sparkline({ points, negative=false }) {
  const all = points.length ? points : [0,0,0,0,0,0,0];
  const min = Math.min(...all), max = Math.max(...all), diff = max-min || 1;
  const coords = all.map((val,i) => `${(i/(all.length-1||1))*400},${116-((val-min)/diff)*91}`).join(' ');
  return <svg className="sparkline" viewBox="0 0 400 128" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e9edf2" stopOpacity="0.13"/><stop offset="100%" stopColor="#e9edf2" stopOpacity="0"/></linearGradient></defs>
    <polygon points={`0,128 ${coords} 400,128`} fill="url(#sparkGradient)" />
    <polyline points={coords} fill="none" stroke={negative ? '#d8a1a1' : '#d6dae0'} strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
  </svg>;
}
function Sheet({ title, subtitle, onClose, children }) {
  useEffect(() => { const onKey = e => { if(e.key==='Escape') onClose(); }; document.addEventListener('keydown',onKey); document.body.style.overflow='hidden'; return () => { document.removeEventListener('keydown',onKey); document.body.style.overflow=''; }; },[onClose]);
  return <div className="sheet-overlay" onMouseDown={(e) => { if(e.target===e.currentTarget) onClose(); }}><div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
    <div className="sheet-grip"/><div className="sheet-head"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div><button type="button" className="icon-btn" aria-label="Fechar" onClick={onClose}><X size={20}/></button></div><div className="sheet-scroll">{children}</div>
  </div></div>;
}
function TransactionForm({ existing, initialType='expense', onSave, onClose }) {
  const [type,setType] = useState(existing?.type || initialType);
  const [amount,setAmount] = useState(existing ? String(existing.amount).replace('.',',') : '');
  const [description,setDescription] = useState(existing?.description || '');
  const [category,setCategory] = useState(existing?.category || (initialType==='income'?'Salário':'Alimentação'));
  const [date,setDate] = useState(existing?.date || todayISO());
  const [error,setError] = useState('');
  const changeType = (t) => { setType(t);setCategory(t==='income'?'Salário':'Alimentação'); };
  const submit = e => {
    e.preventDefault(); const value = parseMoney(amount);
    if (!Number.isFinite(value) || value <= 0 || value > 999999999999) return setError('Informe um valor maior que zero.');
    if (!description.trim()) return setError('Descreva a movimentação.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return setError('Informe uma data válida.');
    onSave({ id: existing?.id || newId(), type, amount: Math.round(value*100)/100, description: description.trim(), category, date, ...(existing?.billId ? {billId:existing.billId,billMonth:existing.billMonth}: {}) });
  };
  return <form className="form-stack" onSubmit={submit}>
    <div className="choice-switch two"><button type="button" className={type==='income'?'selected':''} onClick={()=>changeType('income')}><ArrowDownLeft size={18}/> Receita</button><button type="button" className={type==='expense'?'selected':''} onClick={()=>changeType('expense')}><ArrowUpRight size={18}/> Despesa</button></div>
    <label className="field-label">Valor em reais<input className="money-field" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" autoFocus /></label>
    <label className="field-label">Descrição<input value={description} onChange={e=>setDescription(e.target.value)} maxLength={80} placeholder={type==='income'?'Ex.: Salário de outubro':'Ex.: Supermercado, combustível...'}/></label>
    <label className="field-label">Categoria<select value={category} onChange={e=>setCategory(e.target.value)}>{(type==='income'?incomeCategories:expenseCategories).map(c=><option key={c}>{c}</option>)}</select></label>
    <label className="field-label">Data<input type="date" value={date} onChange={e=>setDate(e.target.value)} required /></label>
    {error && <div className="error-notice"><CircleAlert size={16}/>{error}</div>}
    <button className="btn primary full" type="submit"><Check size={18}/> {existing?'Salvar alterações':'Registrar '+(type==='income'?'receita':'despesa')}</button>
  </form>;
}
function BillForm({ existing, month, onSave }) {
  const [title,setTitle] = useState(existing?.title || '');
  const [amount,setAmount] = useState(existing ? String(existing.amount).replace('.',',') : '');
  const [category,setCategory] = useState(existing?.category || 'Contas');
  const [dueDay,setDueDay] = useState(existing?.dueDay || 10);
  const [recurring,setRecurring] = useState(existing?.recurring ?? true);
  const [startMonth,setStartMonth] = useState(existing?.startMonth || month);
  const [error,setError] = useState('');
  const submit = e => {e.preventDefault(); const n=parseMoney(amount);if(!title.trim()||!Number.isFinite(n)||n<=0||n>999999999999) return setError('Preencha nome e valor da conta.');onSave({id: existing?.id || newId(),title:title.trim(),amount:Math.round(n*100)/100,category,dueDay:Number(dueDay),recurring,startMonth,...(existing?.endMonth?{endMonth:existing.endMonth}:{})});};
  return <form className="form-stack" onSubmit={submit}>
    <label className="field-label">Nome da conta<input placeholder="Ex.: Internet, aluguel, cartão" value={title} onChange={e=>setTitle(e.target.value)} maxLength={70} autoFocus /></label>
    <label className="field-label">Valor da conta (R$)<input className="money-field" placeholder="0,00" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal" /></label>
    <div className="form-row"><label className="field-label">Vence no dia<select value={dueDay} onChange={e=>setDueDay(e.target.value)}>{Array.from({length:31},(_,i)=><option value={i+1} key={i+1}>{String(i+1).padStart(2,'0')}</option>)}</select></label><label className="field-label">Categoria<select value={category} onChange={e=>setCategory(e.target.value)}>{expenseCategories.map(c=><option key={c}>{c}</option>)}</select></label></div>
    <label className="field-label">A partir de<input type="month" value={startMonth} onChange={e=>setStartMonth(e.target.value)} required/></label>
    <label className="toggle-box" htmlFor="recurring-bill"><span className="toggle-icon"><RefreshCcw size={20}/></span><span className="toggle-text"><strong>Repetir mensalmente</strong><small>Volta como pendente a cada novo mês</small></span><input id="recurring-bill" type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)}/><span className={`switch ${recurring?'on':''}`}/></label>
    {error && <div className="error-notice"><CircleAlert size={16}/>{error}</div>}
    <button className="btn primary full" type="submit"><Check size={18}/>{existing?'Salvar conta':'Adicionar conta'}</button>
  </form>;
}
function GoalForm({ existing, onSave }) {
  const [title,setTitle] = useState(existing?.title || '');
  const [target,setTarget] = useState(existing ? String(existing.target).replace('.',',') : '');
  const [saved,setSaved] = useState(existing ? String(existing.saved).replace('.',',') : '0');
  const [error,setError] = useState('');
  const submit = e => {e.preventDefault();const t=parseMoney(target),s=parseMoney(saved); if (!title.trim()||!Number.isFinite(t)||t<=0||!Number.isFinite(s)||s<0) return setError('Informe nome e valores válidos.');onSave({id:existing?.id||newId(),title:title.trim(),target:Math.round(t*100)/100,saved:Math.round(s*100)/100});};
  return <form className="form-stack" onSubmit={submit}><label className="field-label">Nome do objetivo<input placeholder="Ex.: Reserva de emergência" value={title} onChange={e=>setTitle(e.target.value)} required maxLength={70}/></label><label className="field-label">Valor desejado (R$)<input className="money-field" inputMode="decimal" placeholder="10.000,00" value={target} onChange={e=>setTarget(e.target.value)}/></label><label className="field-label">Quanto já guardou (R$)<input inputMode="decimal" placeholder="0,00" value={saved} onChange={e=>setSaved(e.target.value)}/></label><p className="form-hint">Os objetivos são acompanhados separadamente. Editar o valor guardado não movimenta seu saldo.</p>{error&&<div className="error-notice">{error}</div>}<button className="btn primary full"><Check size={18}/>Salvar objetivo</button></form>;
}
function TransactionRow({ tx, hideValues, onEdit, onDelete }) {
  const positive = tx.type==='income';
  return <div className="transaction-row"><div className={`transaction-icon ${positive?'credit':'debit'}`}><IconFor category={tx.category} size={19}/></div><div className="transaction-text"><strong>{tx.description}</strong><span>{tx.category} <i>·</i> {smallDate(tx.date)}{tx.billId?' · Conta paga':''}</span></div><div className={`transaction-amount ${positive?'positive':'negative'}`}><Balance value={tx.amount} hidden={hideValues} className="value" /> <small>{positive?'+':'−'}</small></div><div className="row-actions"><button type="button" aria-label="Editar lançamento" title={tx.billId?'Pagamento gerenciado pela conta':'Editar lançamento'} disabled={!!tx.billId} onClick={()=>onEdit(tx)}><Edit3 size={16}/></button><button type="button" title="Excluir lançamento" aria-label="Excluir lançamento" onClick={()=>onDelete(tx)}><Trash2 size={16}/></button></div></div>;
}
function MiniStats({ title, value, icon:Icon, hidden, hint, type }) { return <div className="mini-stat"><div className="stat-top"><div className={`mini-icon ${type}`}><Icon size={17} strokeWidth={1.9}/></div><span>{title}</span></div><div className="mini-stat-value"><Balance value={value} hidden={hidden}/></div>{hint&&<div className="mini-stat-hint">{hint}</div>}</div>; }
function Bars({ rows, hide }) {
  const max = Math.max(...rows.map(r=>r.amount),0);
  return <div className="category-list">{rows.length ? rows.slice(0,5).map(r=><div className="category-line" key={r.name}><div className="category-label"><span className="category-icon"><IconFor category={r.name} size={17}/></span><span>{r.name}</span></div><div className="category-track"><div style={{width:`${max>0 ? (r.amount/max)*100:0}%`}}/></div><strong>{hide?'••••':formatMoney(r.amount)}</strong></div>) : <div className="quiet-empty">As categorias vão aparecer após a primeira despesa.</div>}</div>;
}
function DemoBanner({onDemo,onAdd}) { return <section className="start-banner"><div><div className="eyebrow"><Sparkles size={13}/> SEU IMPÉRIO COMEÇA AQUI</div><h3>Organize cada real com elegância.</h3><p>Registre seu primeiro salário ou explore o aplicativo com dados de exemplo.</p><div className="banner-actions"><button className="btn primary" onClick={onAdd}><Plus size={16}/> Primeira receita</button><button className="btn ghost" onClick={onDemo}>Ver demonstração</button></div></div><div className="banner-seal"><GlassLogo size="large"/></div></section>;
}
function createDemo(month) {
  const date = (day) => `${month}-${String(day).padStart(2,'0')}`;
  const past=(day)=>Math.min(day,Number(todayISO().slice(8)));
  const transactions=[
    {id:newId(),date:date(past(4)),type:'income',description:'Salário',amount:5800,category:'Salário'},
    {id:newId(),date:date(past(6)),type:'expense',description:'Supermercado',amount:327.8,category:'Alimentação'},
    {id:newId(),date:date(past(8)),type:'expense',description:'Combustível',amount:180,category:'Transporte'},
    {id:newId(),date:date(past(10)),type:'income',description:'Trabalho extra',amount:750,category:'Freelance'},
    {id:newId(),date:date(past(11)),type:'expense',description:'Academia',amount:119.9,category:'Academia'},
  ];
  const bills=[
    {id:newId(), title:'Internet',amount:119.9,dueDay:15,recurring:true,category:'Contas',startMonth:month},
    {id:newId(), title:'Aluguel',amount:1350,dueDay:20,recurring:true,category:'Moradia',startMonth:month},
    {id:newId(), title:'Streaming',amount:39.9,dueDay:27,recurring:true,category:'Assinaturas',startMonth:month},
  ];
  return { ...blankState(), transactions, bills, goals:[{id:newId(),title:'Reserva de emergência',target:15000,saved:2400}] };
}

export default function App({cloud=null}) {
  const [localData,setLocalData] = useState(readStored);
  const data = cloud ? cloud.data : localData;
  const setData = cloud ? cloud.update : setLocalData;
  const [page,setPage] = useState('dashboard');
  const [currentMonth,setCurrentMonth] = useState(monthKey(todayISO()));
  const [modal,setModal] = useState(null);
  const [search,setSearch] = useState('');
  const [txFilter,setTxFilter] = useState('all');
  const [billFilter,setBillFilter] = useState('all');
  const [toast,setToast] = useState('');
  const [menuOpen,setMenuOpen] = useState(false);
  const [backupError,setBackupError] = useState('');
  const fileRef = useRef(null);
  const today = todayISO();
  useEffect(()=>{if(cloud)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch{setToast('Armazenamento cheio ou desativado. Exporte um backup.');}},[data,!!cloud]);
  useEffect(()=>{if(!toast)return; const timer=setTimeout(()=>setToast(''),3400);return()=>clearTimeout(timer);},[toast]);
  const transactions = data.transactions;
  const monthTx = useMemo(()=>transactions.filter(t=>monthKey(t.date)===currentMonth).sort((a,b)=> b.date.localeCompare(a.date)),[transactions,currentMonth]);
  const incomes = monthTx.filter(t=>t.type==='income').reduce((a,t)=>a+t.amount,0);
  const expenses = monthTx.filter(t=>t.type==='expense').reduce((a,t)=>a+t.amount,0);
  const liveBalance = data.openingBalance+transactions.filter(t=>t.date<=today).reduce((a,t)=>a+(t.type==='income'?t.amount:-t.amount),0);
  const monthlyBills = useMemo(()=>getBillsForMonth(data.bills,transactions,currentMonth),[data.bills,transactions,currentMonth]);
  const unpaidBills = monthlyBills.filter(b=>!b.payment);
  const unpaidTotal = unpaidBills.reduce((a,b)=>a+b.amount,0);
  const monthlyNet = incomes-expenses;
  const categories = Object.entries(monthTx.filter(t=>t.type==='expense').reduce((obj,t)=>({...obj,[t.category]:(obj[t.category]||0)+t.amount}),{})).map(([name,amount])=>({name,amount})).sort((a,b)=>b.amount-a.amount);
  const visibleBills = monthlyBills.filter(b=>billFilter==='all'||(billFilter==='unpaid'&&!b.payment)||(billFilter==='paid'&&b.payment));
  const visibleTx = monthTx.filter(t=>(txFilter==='all'||t.type===txFilter) && `${t.description} ${t.category}`.toLowerCase().includes(search.toLowerCase()));
  const cumulativePoints = useMemo(()=>{
    const points=[];const yyyy=Number(currentMonth.slice(0,4)),mm=Number(currentMonth.slice(5,7))-1;
    const days=new Date(yyyy,mm+1,0).getDate();let acc=0;
    const end=(currentMonth===monthKey(today)?Number(today.slice(8)):days);
    for(let i=1;i<=Math.max(end,1);i++) { const ds=`${currentMonth}-${String(i).padStart(2,'0')}`;acc+=monthTx.filter(t=>t.date===ds).reduce((total,t)=>total+(t.type==='income'?t.amount:-t.amount),0);points.push(acc); }
    return points;
  },[monthTx,currentMonth,today]);
  const notice=(message)=>setToast(message);
  const update=(fn)=>setData(prev=>fn(prev));
  const handleTxSave = tx => { update(prev=>({...prev, transactions:prev.transactions.some(t=>t.id===tx.id)?prev.transactions.map(t=>t.id===tx.id?tx:t):[tx,...prev.transactions]}));setModal(null);notice('Movimentação salva com sucesso.'); };
  const removeTx = tx => { if(!window.confirm(`Excluir "${tx.description}"? Esta ação não pode ser desfeita.`))return; update(prev=>({...prev,transactions:prev.transactions.filter(t=>t.id!==tx.id)})); notice('Lançamento excluído.'); };
  const handleBillSave = bill => {update(prev=>({...prev,bills:prev.bills.some(b=>b.id===bill.id)?prev.bills.map(b=>b.id===bill.id?bill:b):[...prev.bills,bill]}));setModal(null);notice('Conta salva com sucesso.');};
  const removeBill = bill => {if(!window.confirm(`Excluir a conta "${bill.title}"? Lançamentos já pagos continuarão no histórico.`))return;update(prev=>({...prev,bills:prev.bills.filter(b=>b.id!==bill.id)}));notice('Conta removida.');};
  const payBill = bill => {
    if(bill.payment){ if(!window.confirm('Desfazer pagamento? O lançamento desta conta será retirado do saldo.'))return;update(prev=>({...prev,transactions:prev.transactions.filter(t=>t.id!==bill.payment.id)}));notice('Pagamento desfeito.');return; }
    const tx={id:newId(),type:'expense',amount:bill.amount,description:bill.title,category:bill.category,date:today,billId:bill.id,billMonth:currentMonth};
    update(prev=>({...prev,transactions:[tx,...prev.transactions]}));notice('Conta paga. Valor descontado do saldo.');
  };
  const handleGoalSave = goal => {update(prev=>({...prev,goals:prev.goals.some(g=>g.id===goal.id)?prev.goals.map(g=>g.id===goal.id?goal:g):[...prev.goals,goal]}));setModal(null);notice('Objetivo salvo.');};
  const removeGoal = goal => {if(!window.confirm(`Excluir a meta "${goal.title}"?`))return; update(prev=>({...prev,goals:prev.goals.filter(g=>g.id!==goal.id)}));};
  const navigate = to => {setPage(to);setMenuOpen(false);window.scrollTo({top:0,behavior:'smooth'});};
  const downloadBackup = () => {const blob=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=`monarch-backup-${today}.json`;document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notice('Backup exportado. Guarde o arquivo em local seguro.');};
  const readBackup = async e => {const file=e.target.files?.[0]; if(!file)return; try{const raw=JSON.parse(await file.text());if(!raw||!Array.isArray(raw.transactions)||!Array.isArray(raw.bills)||!Array.isArray(raw.goals)||raw.transactions.some(t=>!['income','expense'].includes(t.type)||!Number.isFinite(Number(t.amount))||!t.date)||raw.bills.some(b=>!b.id||!b.startMonth||!Number.isFinite(Number(b.amount)))) throw new Error('Formato de backup inválido.');if(!window.confirm('Importar esse arquivo vai substituir os dados atuais. Continuar?'))return;setData({...blankState(),...raw,hideValues:!!raw.hideValues});setBackupError('');notice('Backup importado com sucesso.');}catch{setBackupError('Não foi possível importar. Selecione um backup válido do MONARCH.');}finally{e.target.value='';}};
  const showDemo = ()=>{if(transactions.length||data.bills.length||data.goals.length){if(!window.confirm('A demonstração substitui seus dados atuais. Deseja continuar? Exporte um backup antes, se precisar.'))return;}setData(createDemo(monthKey(today)));notice('Dados de demonstração carregados.');};
  const resetData = ()=>{if(!window.confirm(cloud?'Apagar TODOS os lançamentos, contas e objetivos desta conta, inclusive na nuvem? Exporte um backup antes.':'Apagar TODOS os lançamentos, contas e objetivos deste navegador? Exporte um backup antes.'))return;if(!window.confirm('Tem certeza? Não será possível recuperar sem backup.'))return;setData(blankState());navigate('dashboard');notice(cloud?'Histórico apagado. Aguarde a sincronização.':'Dados locais apagados.');};
  const pages=[{id:'dashboard',label:'Visão geral',icon:LayoutDashboard},{id:'transactions',label:'Lançamentos',icon:ArrowLeft},{id:'bills',label:'Minhas contas',icon:ReceiptText},{id:'goals',label:'Objetivos',icon:Target},{id:'settings',label:'Configurações',icon:Settings2}];
  const onHeaderAdd = () => setModal({type:'transaction',initialType:'expense'});
  return <div className="app-shell">
    <aside className={`side-nav ${menuOpen?'open':''}`}>
      <div className="side-inner"><div className="brand-wrap"><GlassLogo/><div className="brand-text"><span>MONARCH</span><small>PRIVATE FINANCE</small></div></div>
      <div className="side-label">CONTROLE PESSOAL</div><nav className="side-links" aria-label="Navegação principal">{pages.map(p=>{const I=p.icon;return <button type="button" key={p.id} onClick={()=>navigate(p.id)} className={page===p.id?'active':''}><I size={19} strokeWidth={1.7}/><span>{p.label}</span>{page===p.id&&<div className="selected-dot"/>}</button>})}</nav>
      <div className="side-spacer"/><div className="side-promo"><div className="eyebrow">O CONTROLE É SEU</div><strong>Seu dinheiro.<br/>Seu império.</strong><div className="side-promo-icon"><img src="/assets/monarch-mark.webp" alt=""/></div></div>
      <div className="side-foot"><ShieldCheck size={16}/> {cloud?"Sincronização protegida":"Dados salvos neste dispositivo"}</div></div>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="mobile-brand"><button className="icon-btn hamburger" aria-label="Abrir menu" onClick={()=>setMenuOpen(!menuOpen)}><Menu size={21}/></button><div className="mobile-brandmark"><GlassLogo size="tiny"/><span>MONARCH</span></div></div>
      <div className="breadcrumbs"><span>PRIVATE FINANCE</span><ChevronRight size={12}/><strong>{pages.find(p=>p.id===page)?.label}</strong></div>
      <div className="top-actions"><div className="privacy-inline"><span>Privacidade</span><button className="icon-btn" aria-label={data.hideValues?'Mostrar valores':'Ocultar valores'} title={data.hideValues?'Mostrar valores':'Ocultar valores'} onClick={()=>update(s=>({...s,hideValues:!s.hideValues}))}>{data.hideValues?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><button className="top-avatar" aria-label="Configurações" onClick={()=>navigate('settings')}><img src="/assets/monarch-mark.webp" alt=""/></button></div>
      </header>
      <div className="content-area">
        {cloud&&<div className={`cloud-status-line ${cloud.status}`} role="status" aria-live="polite"><span>{cloud.status==='saved'?<Cloud size={15}/>:<CloudOff size={15}/>} {cloud.status==='saved'?'Dados sincronizados':cloud.status==='saving'?'Salvando na nuvem...':cloud.status==='pending'?'Aguardando sincronização':cloud.status==='conflict'?'Conflito de sincronização':'Falha ao salvar na nuvem'}</span>{cloud.userEmail&&<small>{cloud.userEmail}</small>}</div>}
        {cloud&&['error','conflict'].includes(cloud.status)&&<div className="cloud-warning"><strong>{cloud.status==='conflict'?'Alterações em dois dispositivos':'Seus dados ainda não foram salvos na nuvem'}</strong><p>{cloud.error}</p><div className="cloud-warning-actions">{cloud.status==='conflict'?<><button className="btn ghost small" onClick={cloud.loadCloud}>Carregar versão da nuvem</button><button className="btn primary small" onClick={cloud.replaceRemote}>Manter dados deste aparelho</button></>:<button className="btn primary small" onClick={cloud.retry}>Tentar sincronizar novamente</button>}</div></div>}
        {cloud&&cloud.legacyAvailable&&!cloud.cloudHasRecords&&<div className="cloud-migrate-banner"><div><strong>Encontramos registros da versão anterior.</strong><p>Importe os dados deste navegador para sua conta protegida. Não apaga seu histórico antigo.</p></div><button className="btn primary small" onClick={cloud.importLegacy}>Importar meus dados</button></div>}
        {page!=='settings'&&<div className="page-top"><div><div className="eyebrow top-eyebrow"><span className="silver-dot"/> CONTROLE FINANCEIRO</div><h1>{page==='dashboard'?`Seu império, ${data.userName}.`:pages.find(p=>p.id===page)?.label}</h1><p className="page-subtitle">{page==='dashboard'?'Disciplina hoje. Liberdade sempre.':page==='transactions'?'Cada movimentação conta. Veja tudo em um só lugar.':page==='bills'?'Acompanhe vencimentos sem perder o controle.':'Transforme seus planos em conquistas.'}</p></div><div className="month-selector"><button aria-label="Mês anterior" onClick={()=>setCurrentMonth(s=>shiftMonth(s,-1))}><ChevronLeft size={18}/></button><span><CalendarDays size={15}/>{longMonth(currentMonth)}</span><button aria-label="Próximo mês" onClick={()=>setCurrentMonth(s=>shiftMonth(s,1))}><ChevronRight size={18}/></button></div></div>}
        {page==='dashboard'&&<div className="dashboard-grid">
          {transactions.length===0&&data.bills.length===0&&<DemoBanner onDemo={showDemo} onAdd={()=>setModal({type:'transaction',initialType:'income'})}/>}
          <section className="balance-card"><div className="balance-art"><img src="/assets/monarch-mark.webp" alt=""/></div><div className="balance-content"><div className="balance-topline"><div className="eyebrow">SEU PATRIMÔNIO EM MOVIMENTO</div><span className="secure-tag"><ShieldCheck size={13}/> Privado</span></div><div className="balance-label">Saldo disponível <button aria-label={data.hideValues?'Mostrar saldo':'Ocultar saldo'} onClick={()=>update(s=>({...s,hideValues:!s.hideValues}))}>{data.hideValues?<EyeOff size={16}/>:<Eye size={16}/>}</button></div><div className="balance-number"><Balance value={liveBalance} hidden={data.hideValues}/></div><div className="balance-bottom"><div className={`change-mark ${monthlyNet<0?'down':''}`}>{monthlyNet>=0?<TrendingUp size={16}/>:<TrendingDown size={16}/>} {data.hideValues?'R$ ••••••':`${monthlyNet>=0?'+':'−'} ${formatMoney(Math.abs(monthlyNet))}`} <span>no mês selecionado</span></div><div className="balance-motto">YOUR MONEY. YOUR EMPIRE.</div></div><Sparkline points={cumulativePoints} negative={monthlyNet<0}/></div></section>
          <div className="stats-grid"><MiniStats title="Receitas do mês" value={incomes} hidden={data.hideValues} icon={ArrowDownLeft} type="positive" hint="Entradas registradas"/><MiniStats title="Despesas do mês" value={expenses} hidden={data.hideValues} icon={ArrowUpRight} type="negative" hint="Saídas já realizadas"/><MiniStats title="Contas pendentes" value={unpaidTotal} hidden={data.hideValues} icon={CalendarClock} type="neutral" hint={`${unpaidBills.length} ${unpaidBills.length===1?'conta a pagar':'contas a pagar'}`}/></div>
          <section className="section-card preview-bills"><div className="section-head"><div><div className="kicker">COMPROMISSOS</div><h2>Próximas contas</h2></div><button className="link-action" onClick={()=>navigate('bills')}>Ver todas <ArrowRight size={15}/></button></div>
          {unpaidBills.length===0?<EmptyState icon={CalendarClock} title="Nenhuma conta pendente" subtitle="Adicione contas fixas ou pontuais para acompanhar vencimentos." action="Adicionar conta" onClick={()=>setModal({type:'bill'})}/>:<div className="bill-preview-list">{unpaidBills.slice(0,3).map(b=><div className="bill-preview" key={b.id}><span className="bill-circle"><IconFor category={b.category}/></span><div><strong>{b.title}</strong><small>Vence {smallDate(b.dueDate)}</small></div><strong className="preview-value">{data.hideValues?'••••':formatMoney(b.amount)}</strong><button className="pay-icon" aria-label={`Marcar ${b.title} como paga`} title="Marcar como paga" onClick={()=>payBill(b)}><Check size={17}/></button></div>)}</div>}
          {unpaidBills.length>0 && <div className="projection"><span>Saldo após quitar pendentes</span><strong><Balance value={liveBalance-unpaidTotal} hidden={data.hideValues}/></strong><small>Estimativa, sem considerar receitas futuras</small></div>}
          </section>
          <section className="section-card overview-transactions"><div className="section-head"><div><div className="kicker">MOVIMENTAÇÕES</div><h2>Últimos lançamentos</h2></div><button className="link-action" onClick={()=>navigate('transactions')}>Ver todos <ArrowRight size={15}/></button></div>{monthTx.length===0?<EmptyState icon={ArrowLeft} title="Sem movimentações" subtitle="Registre sua primeira receita ou despesa deste mês." action="Novo lançamento" onClick={onHeaderAdd}/>:<div>{monthTx.slice(0,5).map(tx=><TransactionRow key={tx.id} tx={tx} hideValues={data.hideValues} onEdit={existing=>setModal({type:'transaction',existing})} onDelete={removeTx}/>)}</div>}</section>
          <section className="section-card chart-card"><div className="section-head"><div><div className="kicker">INTELIGÊNCIA FINANCEIRA</div><h2>Onde seu dinheiro vai</h2></div><span className="subtle-small">{longMonth(currentMonth)}</span></div><Bars rows={categories} hide={data.hideValues}/></section>
          <section className="section-card goal-preview"><div className="section-head"><div><div className="kicker">VISÃO DE FUTURO</div><h2>Meus objetivos</h2></div><button className="link-action" onClick={()=>navigate('goals')}>Ver metas <ArrowRight size={15}/></button></div>{data.goals.length?data.goals.slice(0,2).map(g=><div key={g.id} className="goal-mini"><div className="goal-mini-icon"><Target size={21}/></div><div className="goal-mini-info"><div><strong>{g.title}</strong><span>{Math.min(Math.round(g.saved/g.target*100),100)}%</span></div><div className="progress-track"><span style={{width:`${Math.min((g.saved/g.target)*100,100)}%`}}/></div><small>{data.hideValues?'R$ ••••••':formatMoney(g.saved)} de {data.hideValues?'R$ ••••••':formatMoney(g.target)}</small></div></div>):<EmptyState icon={Flag} title="O futuro começa com uma meta" subtitle="Crie um objetivo e acompanhe seu progresso." action="Criar objetivo" onClick={()=>setModal({type:'goal'})}/>}</section>
          <div className="bottom-signature">MONARCH <span>·</span> DISCIPLINA É LIBERDADE</div>
        </div>}
        {page==='transactions'&&<div className="page-layout"><section className="section-card wide-card"><div className="section-head transaction-title"><div><div className="kicker">REGISTROS</div><h2>Histórico financeiro</h2></div><button className="btn primary" onClick={onHeaderAdd}><Plus size={18}/> Novo lançamento</button></div><div className="search-tools"><label className="search-field"><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar descrição ou categoria..."/></label><div className="pill-filters"><button className={txFilter==='all'?'selected':''} onClick={()=>setTxFilter('all')}>Todos</button><button className={txFilter==='income'?'selected':''} onClick={()=>setTxFilter('income')}>Receitas</button><button className={txFilter==='expense'?'selected':''} onClick={()=>setTxFilter('expense')}>Despesas</button></div></div><div className="ledger"><div className="ledger-header"><span>LANÇAMENTO</span><span>VALOR / AÇÕES</span></div>{visibleTx.length?visibleTx.map(tx=><TransactionRow key={tx.id} tx={tx} hideValues={data.hideValues} onEdit={existing=>setModal({type:'transaction',existing})} onDelete={removeTx}/>):<EmptyState icon={Search} title="Nenhum lançamento encontrado" subtitle="Altere o filtro ou adicione uma movimentação neste mês." action="Adicionar" onClick={onHeaderAdd}/>}</div></section><div className="summary-aside"><div className="section-card compact-summary"><div className="kicker">RESUMO DO MÊS</div><h3>{longMonth(currentMonth)}</h3><div><span>Receitas</span><strong className="positive"><Balance value={incomes} hidden={data.hideValues}/></strong></div><div><span>Despesas</span><strong className="negative"><Balance value={expenses} hidden={data.hideValues}/></strong></div><div className="summary-total"><span>Resultado</span><strong><Balance value={monthlyNet} hidden={data.hideValues}/></strong></div></div><div className="info-card"><ShieldCheck size={22}/><strong>Seu controle, sua privacidade.</strong><p>{cloud?'Seu histórico é salvo na nuvem da sua conta. Um backup JSON continua disponível nas Configurações.':'Os registros ficam salvos neste navegador. Exporte um backup em Configurações.'}</p></div></div></div>}
        {page==='bills'&&<div className="page-layout"><section className="section-card wide-card"><div className="section-head transaction-title"><div><div className="kicker">PAGAMENTOS</div><h2>Agenda de contas</h2></div><button className="btn primary" onClick={()=>setModal({type:'bill'})}><Plus size={17}/> Nova conta</button></div><div className="bills-glance"><div><small>A PAGAR</small><strong><Balance value={unpaidTotal} hidden={data.hideValues}/></strong></div><div><small>PAGAS</small><strong><Balance value={monthlyBills.filter(b=>b.payment).reduce((a,b)=>a+b.payment.amount,0)} hidden={data.hideValues}/></strong></div><div><small>VENCIDAS</small><strong>{monthlyBills.filter(b=>b.status==='Vencida').length}</strong></div></div><div className="pill-filters bill-filters"><button className={billFilter==='all'?'selected':''} onClick={()=>setBillFilter('all')}>Todas</button><button className={billFilter==='unpaid'?'selected':''} onClick={()=>setBillFilter('unpaid')}>Pendentes</button><button className={billFilter==='paid'?'selected':''} onClick={()=>setBillFilter('paid')}>Pagas</button></div><div className="bill-list">{visibleBills.length?visibleBills.map(b=><div className="bill-row" key={b.id}><div className="bill-row-icon"><IconFor category={b.category} size={20}/></div><div className="bill-row-main"><strong>{b.title}</strong><div className="bill-sub"><span>Dia {String(b.dueDay).padStart(2,'0')} · {b.recurring?'Mensal':'Única'}</span><Chip tone={b.payment?'paid':b.status==='Vencida'?'late':'pending'}>{b.status}</Chip></div></div><div className="bill-row-side"><strong><Balance value={b.amount} hidden={data.hideValues}/></strong><div><button type="button" className={`bill-pay ${b.payment?'done':''}`} onClick={()=>payBill(b)}>{b.payment?<><RotateCcw size={13}/> Desfazer</>:<><Check size={14}/> Pagar</>}</button><button title="Editar conta" className="muted-btn" aria-label={`Editar ${b.title}`} onClick={()=>setModal({type:'bill',existing:b})}><Edit3 size={15}/></button><button title="Excluir conta" className="muted-btn" aria-label={`Excluir ${b.title}`} onClick={()=>removeBill(b)}><Trash2 size={15}/></button></div></div></div>):<EmptyState icon={CalendarClock} title={billFilter==='all'?'Você ainda não cadastrou contas':'Nenhuma conta neste filtro'} subtitle="Contas mensais voltam automaticamente no próximo mês, sem descontar antes do pagamento." action="Adicionar conta" onClick={()=>setModal({type:'bill'})}/>}</div></section><div className="summary-aside"><div className="info-card"><CalendarClock size={24}/><strong>Como funciona?</strong><p>Cadastrar uma conta não desconta seu saldo. Ao tocar em <b>Pagar</b>, registramos a despesa automaticamente.</p><p>As contas recorrentes reaparecem pendentes a cada mês. Pagar antecipadamente também funciona.</p></div><div className="section-card compact-summary"><div className="kicker">PROJEÇÃO</div><h3>Após os compromissos</h3><div className="summary-total no-border"><strong className="projection-figure"><Balance value={liveBalance-unpaidTotal} hidden={data.hideValues}/></strong></div><p className="subtle-small">Saldo atual menos contas pendentes de {longMonth(currentMonth)}.</p></div></div></div>}
        {page==='goals'&&<div className="goals-layout"><section className="goals-hero"><div className="eyebrow">CONSTRUA SEU LEGADO</div><h2>Grandes conquistas começam com decisões pequenas.</h2><p>Defina o destino. Acompanhe sua evolução.</p><button className="btn primary" onClick={()=>setModal({type:'goal'})}><Plus size={17}/> Criar objetivo</button></section><div className="goals-grid">{data.goals.length?data.goals.map(g=><section key={g.id} className="goal-card"><div className="goal-card-header"><span><Goal size={22}/></span><div><button title="Editar" onClick={()=>setModal({type:'goal',existing:g})}><Edit3 size={17}/></button><button title="Excluir" onClick={()=>removeGoal(g)}><Trash2 size={17}/></button></div></div><h3>{g.title}</h3><p><Balance value={g.saved} hidden={data.hideValues}/><small> de <Balance value={g.target} hidden={data.hideValues}/></small></p><div className="progress-track large"><span style={{width:`${Math.min(g.saved/g.target*100,100)}%`}}/></div><div className="goal-footer"><strong>{Math.min(Math.round(g.saved/g.target*100),100)}% concluído</strong><span>Falta {data.hideValues?'••••':formatMoney(Math.max(0,g.target-g.saved))}</span></div></section>):<div className="section-card"><EmptyState icon={Target} title="Seu próximo objetivo começa aqui" subtitle="Casa, viagem, reserva financeira... acompanhe seus planos com clareza." action="Criar objetivo" onClick={()=>setModal({type:'goal'})}/></div>}</div><p className="goals-note"><CircleAlert size={15}/> As metas são informativas. Alterar o valor poupado não afeta seu saldo. Registre transferências efetivas separadamente, conforme seu controle.</p></div>}
        {page==='settings'&&<div className="settings-layout"><div className="page-top settings-heading"><div><div className="eyebrow top-eyebrow"><span className="silver-dot"/> SUA CONTA</div><h1>Configurações</h1><p className="page-subtitle">Personalize o MONARCH e proteja seus registros.</p></div></div><section className="section-card settings-panel"><div className="section-head"><div><div className="kicker">PERFIL</div><h2>Identidade e preferências</h2></div><GlassLogo size="small"/></div><div className="form-stack"><label className="field-label">Como quer ser chamado?<input maxLength={30} value={data.userName} onChange={e=>update(s=>({...s,userName:e.target.value}))} placeholder="Monarca" /></label><label className="field-label">Saldo inicial (R$)<input type="number" step="0.01" value={data.openingBalance} onChange={e=>update(s=>({...s,openingBalance:Number(e.target.value)||0}))}/><small className="field-foot">Valor que você já tinha antes de começar os lançamentos.</small></label><label className="toggle-box" htmlFor="privacy-setting"><span className="toggle-icon"><EyeOff size={20}/></span><span className="toggle-text"><strong>Ocultar valores</strong><small>Disfarça os saldos nas telas</small></span><input id="privacy-setting" type="checkbox" checked={data.hideValues} onChange={e=>update(s=>({...s,hideValues:e.target.checked}))}/><span className={`switch ${data.hideValues?'on':''}`}/></label></div></section><section className="section-card settings-panel"><div className="section-head"><div><div className="kicker">ARQUIVOS</div><h2>Backup dos seus dados</h2></div><FileJson size={23} className="dimmed"/></div><p className="settings-desc">{cloud?"Seus lançamentos são sincronizados com a sua conta Supabase. Você também pode guardar uma cópia em JSON.":"Seus dados ficam somente neste navegador, neste aparelho. Para não perdê-los ao limpar o navegador ou trocar de celular, exporte um backup regularmente."}</p><div className="backup-buttons"><button className="btn primary" onClick={downloadBackup}><Download size={17}/> Exportar backup</button><button className="btn ghost" onClick={()=>fileRef.current?.click()}><Upload size={17}/> Importar backup</button><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={readBackup}/></div>{backupError&&<div className="error-notice">{backupError}</div>}</section><section className="section-card settings-panel"><div className="section-head"><div><div className="kicker">AMBIENTE</div><h2>Dados de demonstração</h2></div><Sparkles size={22} className="dimmed"/></div><p className="settings-desc">Use números fictícios para conhecer a interface. Atenção: carregar a demonstração substitui seus registros atuais.</p><button className="btn ghost" onClick={showDemo}><Sparkles size={16}/> Carregar exemplo</button></section><section className="section-card settings-panel danger-panel"><div className="section-head"><div><div className="kicker">ZONA DE RISCO</div><h2>Apagar dados locais</h2></div><Trash2 size={21}/></div><p className="settings-desc">{cloud?"Apaga o histórico desta conta e sincroniza a exclusão na nuvem. Não será possível recuperar sem backup.":"Remove os registros armazenados neste navegador. Esta ação não pode ser revertida sem um backup."}</p><button className="btn danger" onClick={resetData}><Trash2 size={16}/> Apagar tudo</button></section>{cloud&&<section className="section-card settings-panel cloud-account-panel"><div className="section-head"><div><div className="kicker">SUA NUVEM</div><h2>Conta e sincronização</h2></div><Cloud size={23}/></div><p className="settings-desc">Conectado como <strong>{cloud.userEmail}</strong>. Status: <strong>{cloud.status==='saved'?'sincronizado':cloud.status==='pending'?'pendente':cloud.status==='saving'?'salvando':cloud.status==='conflict'?'conflito':'com falha'}</strong>.</p><div className="backup-buttons"><button className="btn ghost" onClick={cloud.refresh}><RefreshCcw size={16}/> Verificar atualizações</button>{cloud.legacyAvailable&&<button className="btn ghost" onClick={cloud.importLegacy}><Upload size={16}/> Importar dados antigos deste aparelho</button>}<button className="btn ghost" onClick={cloud.logout}><LogOut size={16}/> Sair da conta</button></div><p className="field-foot">A sincronização requer internet. Em caso de conflito entre aparelhos, você escolhe qual versão preservar.</p></section>}
        <div className="settings-disclaimer"><ShieldCheck size={18}/><span>{cloud?'MONARCH v1.2 — dados protegidos por login, RLS e sincronização com Supabase. Não há conexão direta com bancos.':'MONARCH v1.2 — versão local. Configure o Supabase para ativar login e sincronização.'}</span></div></div>}
      </div>
    </main>
    <div className="bottom-nav" aria-label="Navegação mobile"><button className={page==='dashboard'?'active':''} onClick={()=>navigate('dashboard')}><House size={21}/><span>Início</span></button><button className={page==='transactions'?'active':''} onClick={()=>navigate('transactions')}><ArrowLeft size={21}/><span>Histórico</span></button><button className="nav-fab" aria-label="Adicionar movimentação" onClick={onHeaderAdd}><Plus size={28}/></button><button className={page==='bills'?'active':''} onClick={()=>navigate('bills')}><ReceiptText size={21}/><span>Contas</span></button><button className={['settings','goals'].includes(page)?'active':''} onClick={()=>navigate('settings')}><Settings2 size={21}/><span>Mais</span></button></div>
    {page==='settings'&&<div className="mobile-more-goals"><button onClick={()=>navigate('goals')}><Target size={17}/> Meus objetivos <ArrowRight size={15}/></button></div>}
    {menuOpen&&<button className="menu-shade" aria-label="Fechar menu" onClick={()=>setMenuOpen(false)}/>}
    {modal?.type==='transaction'&&<Sheet title={modal.existing?'Editar lançamento':'Novo lançamento'} subtitle="Cada real merece o seu lugar." onClose={()=>setModal(null)}><TransactionForm existing={modal.existing} initialType={modal.initialType} onSave={handleTxSave} onClose={()=>setModal(null)}/></Sheet>}
    {modal?.type==='bill'&&<Sheet title={modal.existing?'Editar conta':'Nova conta'} subtitle="Organize antes de vencer." onClose={()=>setModal(null)}><BillForm existing={modal.existing} month={currentMonth} onSave={handleBillSave}/></Sheet>}
    {modal?.type==='goal'&&<Sheet title={modal.existing?'Editar objetivo':'Novo objetivo'} subtitle="Toda conquista começa com um plano." onClose={()=>setModal(null)}><GoalForm existing={modal.existing} onSave={handleGoalSave}/></Sheet>}
    {toast&&<div role="status" className="toast"><CheckCircle2 size={17}/>{toast}</div>}
  </div>;
}
