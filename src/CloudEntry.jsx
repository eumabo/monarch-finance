import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Check, CheckCircle2, Cloud, CloudOff, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import App from './App.jsx';

const URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
const configured = Boolean(URL && KEY && URL.startsWith('https://'));
const supabase = configured ? createClient(URL, KEY, {auth: {autoRefreshToken:true, persistSession:true, detectSessionInUrl:true}}) : null;
const emptyDocument = () => ({schema:1,userName:'Monarca',openingBalance:0,hideValues:false,transactions:[],bills:[],goals:[]});
const isDocument = (item) => Boolean(item && Array.isArray(item.transactions) && Array.isArray(item.bills) && Array.isArray(item.goals));
const normalizedDocument = (item) => isDocument(item) ? {...emptyDocument(), ...item} : emptyDocument();
const legacySnapshot = () => {try {return normalizedDocument(JSON.parse(localStorage.getItem('monarch-finance-v1')));}catch{return emptyDocument();}};
const hasRecords = d => !!(d && (d.transactions?.length || d.bills?.length || d.goals?.length || d.openingBalance));
const draftKey = uid => `monarch-private-cloud-draft-${uid}`;
function readDraft(uid) {try { const d = JSON.parse(localStorage.getItem(draftKey(uid)));return d && isDocument(d.data) ? d : null;}catch{return null;}}
function parseError(error) {const msg=error?.message||String(error||'Erro desconhecido'); if(msg.includes('Could not find the table')||msg.includes('schema cache')||msg.includes('does not exist')) return 'O banco ainda não foi preparado. Execute o arquivo supabase/MONARCH_SETUP.sql no SQL Editor do Supabase.'; if(msg.includes('Failed to fetch')||msg.includes('NetworkError'))return 'Sem conexão com o Supabase. Verifique a internet e tente novamente.';return msg;}

function Brand({subtitle}) {return <div className="cloud-brand"><img src="/assets/monarch-mark.webp" alt="Emblema MONARCH"/><div><strong>MONARCH</strong><span>PRIVATE FINANCE</span>{subtitle&&<p>{subtitle}</p>}</div></div>;}
function GateMessage({message,action,click}) {return <div className="cloud-gate"><div className="cloud-gate-panel"><Brand/><div className="cloud-gate-message"><LoaderCircle className="spin" size={25}/><p>{message}</p>{action&&<button className="btn ghost" onClick={click}>{action}</button>}</div></div></div>;}
function AuthScreen({onAuth}) {
  const [mode,setMode]=useState('signin');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [visible,setVisible]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const submit=async e=>{
    e.preventDefault();setError('');setMessage('');
    const mail=email.trim().toLowerCase();
    if(mode==='signup' && password.length<8){setError('Sua senha precisa ter pelo menos 8 caracteres.');return;}
    if(mode==='signup' && password!==confirm){setError('As duas senhas precisam ser iguais.');return;}
    if(mode==='reset' && !mail){setError('Digite seu e-mail.');return;}
    setBusy(true);
    try {
      if(mode==='reset') {
        const {error:err}=await supabase.auth.resetPasswordForEmail(mail,{redirectTo:window.location.origin});if(err)throw err;
        setMessage('Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.');
      } else if(mode==='signup') {
        const {data,error:err}=await supabase.auth.signUp({email:mail,password,options:{emailRedirectTo:window.location.origin}});if(err)throw err;
        if(data.session){onAuth?.();}else {setMessage('Conta criada! Confirme o e-mail enviado pelo Supabase e depois entre.');setMode('signin');}
      } else {
        const {error:err}=await supabase.auth.signInWithPassword({email:mail,password});if(err)throw err;
        onAuth?.();
      }
    }catch(err){setError(err?.message==='Invalid login credentials'?'E-mail ou senha incorretos.':parseError(err));}
    finally{setBusy(false);}
  };
  return <div className="cloud-gate"><div className="cloud-gate-panel"><Brand subtitle="Seu dinheiro. Seu império."/><div className="cloud-auth-title"><div className="eyebrow">ACESSO PROTEGIDO</div><h1>{mode==='signup'?'Criar conta':mode==='reset'?'Recuperar acesso':'Bem-vindo ao seu império.'}</h1><p>{mode==='signup'?'Seus dados financeiros, sincronizados entre seus dispositivos.':mode==='reset'?'Vamos enviar um link de redefinição para seu e-mail.':'Entre para acessar seu patrimônio com privacidade.'}</p></div><form className="form-stack" onSubmit={submit}><label className="field-label">E-mail<div className="cloud-input"><Mail size={18}/><input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"/></div></label>{mode!=='reset'&&<label className="field-label">Senha<div className="cloud-input"><LockKeyhole size={18}/><input type={visible?'text':'password'} minLength={mode==='signup'?8:1} required autoComplete={mode==='signup'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Sua senha"/><button type="button" className="icon-btn" aria-label={visible?'Ocultar senha':'Mostrar senha'} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></label>}{mode==='signup'&&<label className="field-label">Confirmar senha<div className="cloud-input"><LockKeyhole size={18}/><input type={visible?'text':'password'} minLength={8} required autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repita a senha"/></div></label>}{error&&<div className="error-notice">{error}</div>}{message&&<div className="cloud-confirmation"><CheckCircle2 size={17}/>{message}</div>}<button className="btn primary full" type="submit" disabled={busy}>{busy?<LoaderCircle className="spin" size={18}/>:<ShieldCheck size={18}/>} {mode==='signup'?'Criar conta segura':mode==='reset'?'Enviar link':'Entrar no MONARCH'}</button></form><div className="cloud-auth-links">{mode==='signin'&&<button onClick={()=>{setError('');setMessage('');setMode('reset');}}>Esqueci minha senha</button>}{mode!=='signin'&&<button onClick={()=>{setError('');setMessage('');setMode('signin');}}>Voltar para entrar</button>}<button onClick={()=>{setError('');setMessage('');setMode(mode==='signup'?'signin':'signup');}}>{mode==='signup'?'Já tenho conta':'Criar uma conta'}</button></div><div className="cloud-auth-foot"><ShieldCheck size={16}/> Dados protegidos por autenticação e políticas RLS.</div></div></div>;
}
function PasswordReset({onFinished}) {
 const [password,setPassword]=useState(''),[again,setAgain]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 const submit=async e=>{e.preventDefault();if(password.length<8||password!==again){setMessage('Use pelo menos 8 caracteres e confirme a mesma senha.');return;}setBusy(true);const {error}=await supabase.auth.updateUser({password});setBusy(false);if(error){setMessage(parseError(error));return;}setPassword('');setAgain('');onFinished();};
 return <div className="cloud-gate"><div className="cloud-gate-panel"><Brand/><div className="cloud-auth-title"><h1>Nova senha</h1><p>Crie uma senha segura para sua conta.</p></div><form className="form-stack" onSubmit={submit}><label className="field-label">Nova senha<input type="password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><label className="field-label">Confirmar senha<input type="password" minLength={8} required value={again} onChange={e=>setAgain(e.target.value)}/></label>{message&&<div className="error-notice">{message}</div>}<button className="btn primary full" disabled={busy}>Salvar nova senha</button></form></div></div>;
}
function CloudWorkspace({user,signOut}) {
  const [doc,setDoc]=useState(emptyDocument);
  const [status,setStatus]=useState('loading');
  const [error,setError]=useState('');
  const [cloudUpdatedAt,setCloudUpdatedAt]=useState(null);
  const [legacy] = useState(legacySnapshot);
  const versionRef=useRef(0),docRef=useRef(emptyDocument()),dirtyRef=useRef(false),busyRef=useRef(false),conflictRef=useRef(false),initRef=useRef(false),flushRef=useRef(null),timerRef=useRef(null),pollRef=useRef(false);
  const key=draftKey(user.id);
  const cancelTimer=useCallback(()=>{if(timerRef.current)clearTimeout(timerRef.current);timerRef.current=null;},[]);
  const schedule=useCallback((ms=450)=>{cancelTimer();timerRef.current=setTimeout(()=>flushRef.current?.(),ms);},[cancelTimer]);
  const queueData=useCallback(updater=>{
    if(!initRef.current)return;
    const next=normalizedDocument(typeof updater==='function'?updater(docRef.current):updater);
    docRef.current=next;setDoc(next);dirtyRef.current=true;
    try{localStorage.setItem(key,JSON.stringify({baseRevision:versionRef.current,data:next,updatedAt:new Date().toISOString()}));}catch{setError('Sem espaço para salvar uma cópia de segurança. Exporte o backup.');}
    if(!conflictRef.current){setStatus('pending');schedule();}
  },[key,schedule]);
  const flush=useCallback(async ()=>{
    if(!initRef.current||!dirtyRef.current||busyRef.current||conflictRef.current)return;
    busyRef.current=true;setStatus('saving');setError('');
    const snapshot=docRef.current,expected=versionRef.current;
    const {data:nextRevision,error:err}=await supabase.rpc('monarch_save_document',{p_document:snapshot,p_expected_revision:expected});
    busyRef.current=false;
    if(err){setError(parseError(err));setStatus('error');return;}
    if(nextRevision===null||nextRevision===undefined){conflictRef.current=true;setError('Os dados mudaram em outro dispositivo. Escolha qual versão manter.');setStatus('conflict');return;}
    versionRef.current=Number(nextRevision);setCloudUpdatedAt(new Date().toISOString());
    if(docRef.current===snapshot){dirtyRef.current=false;localStorage.removeItem(key);setStatus('saved');}
    else {try{localStorage.setItem(key,JSON.stringify({baseRevision:versionRef.current,data:docRef.current,updatedAt:new Date().toISOString()}));}catch{} setStatus('pending');schedule(200);}
  },[key,schedule]);
  useEffect(()=>{flushRef.current=flush;},[flush]);
  const fetchCloud=useCallback(async (allowDraft=true)=>{
    cancelTimer();setStatus('loading');setError('');initRef.current=false;
    const {data:row,error:err}=await supabase.from('finance_documents').select('data,revision,updated_at').eq('user_id',user.id).maybeSingle();
    if(err){setError(parseError(err));setStatus('load-error');return;}
    const remote=normalizedDocument(row?.data);const rev=Number(row?.revision||0);versionRef.current=rev;setCloudUpdatedAt(row?.updated_at||null);
    const draft=allowDraft?readDraft(user.id):null;
    let picked=remote;
    if(draft && JSON.stringify(normalizedDocument(draft.data))===JSON.stringify(remote)) {localStorage.removeItem(key);}
    else if(draft && Number(draft.baseRevision)===rev) {picked=normalizedDocument(draft.data);dirtyRef.current=true;}
    else if(draft){picked=normalizedDocument(draft.data);dirtyRef.current=true;conflictRef.current=true;setError('Há alterações deste aparelho e alterações de outro dispositivo. Escolha qual versão manter.');setStatus('conflict');}
    docRef.current=picked;setDoc(picked);initRef.current=true;
    if(!conflictRef.current){setStatus(dirtyRef.current?'pending':'saved');if(dirtyRef.current)schedule(200);}
  },[cancelTimer,key,schedule,user.id]);
  useEffect(()=>{fetchCloud();return()=>{initRef.current=false;cancelTimer();};},[fetchCloud,cancelTimer]);
  const checkRemote=useCallback(async()=>{
    if(!initRef.current||dirtyRef.current||busyRef.current||pollRef.current||conflictRef.current)return;
    pollRef.current=true;
    const {data:row,error:err}=await supabase.from('finance_documents').select('data,revision,updated_at').eq('user_id',user.id).maybeSingle();
    pollRef.current=false;if(err||!initRef.current||dirtyRef.current)return;
    const rev=Number(row?.revision||0);
    if(rev!==versionRef.current){versionRef.current=rev;docRef.current=normalizedDocument(row?.data);setDoc(docRef.current);setCloudUpdatedAt(row?.updated_at||null);setStatus('saved');}
  },[user.id]);
  useEffect(()=>{if(status!=='saved')return;const poll=setInterval(checkRemote,15000);const onFocus=()=>{if(document.visibilityState!=='hidden')checkRemote();};window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onFocus);return()=>{clearInterval(poll);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus);};},[status,checkRemote]);
  const replaceRemote=useCallback(async()=>{
    if(!window.confirm('ATENÇÃO: substituir a versão na nuvem pelos dados deste aparelho? As alterações da outra versão serão perdidas. Exporte um backup antes, se necessário.'))return;
    const {data:row,error:err}=await supabase.from('finance_documents').select('revision').eq('user_id',user.id).maybeSingle();
    if(err){setError(parseError(err));return;}
    versionRef.current=Number(row?.revision||0);conflictRef.current=false;dirtyRef.current=true;
    try{localStorage.setItem(key,JSON.stringify({baseRevision:versionRef.current,data:docRef.current,updatedAt:new Date().toISOString()}));}catch{}
    setStatus('pending');schedule(100);
  },[user.id,key,schedule]);
  const loadCloud=useCallback(async()=>{
    if(!window.confirm('Descartar alterações não sincronizadas deste aparelho e carregar a versão da nuvem?'))return;
    localStorage.removeItem(key);dirtyRef.current=false;conflictRef.current=false;await fetchCloud(false);
  },[key,fetchCloud]);
  const retry=useCallback(()=>{if(status==='load-error')fetchCloud();else{conflictRef.current=false;setStatus('pending');schedule(20);}},[status,fetchCloud,schedule]);
  const importLegacy=useCallback(()=>{
    if(!hasRecords(legacy)){window.alert('Não encontramos registros antigos neste navegador. Exporte um backup no aplicativo antigo e importe o arquivo aqui em Configurações.');return;}
    const replacing=hasRecords(docRef.current);
    if(!window.confirm(replacing?'Atenção: importar os dados antigos vai SUBSTITUIR os dados atuais da nuvem. Continuar?':'Importar seus registros antigos deste navegador para sua conta MONARCH na nuvem?'))return;
    queueData(legacy);
  },[legacy,queueData]);
  const logOut=useCallback(async()=>{if((dirtyRef.current||status==='error'||status==='conflict')&&!window.confirm('Existem alterações ainda não sincronizadas. Sair agora? Elas serão mantidas como rascunho neste aparelho.'))return;cancelTimer();await signOut();},[status,signOut,cancelTimer]);
  if(status==='loading'||status==='load-error') return <div className="cloud-gate"><div className="cloud-gate-panel"><Brand/><div className="cloud-gate-message">{status==='loading'?<LoaderCircle className="spin" size={24}/>:<CloudOff size={24}/>}<p>{status==='loading'?'Carregando suas finanças protegidas...':error}</p>{status==='load-error'&&<button className="btn primary" onClick={()=>fetchCloud()}>Tentar novamente</button>}</div></div></div>;
  const cloud={data:doc,update:queueData,status,error,retry,loadCloud,replaceRemote,importLegacy,legacyAvailable:hasRecords(legacy),cloudHasRecords:hasRecords(doc),userEmail:user.email,logout:logOut,lastSavedAt:cloudUpdatedAt,refresh:checkRemote};
  return <App cloud={cloud}/>;
}
export default function CloudEntry(){
  const [session,setSession]=useState(null),[loading,setLoading]=useState(Boolean(supabase)),[recovery,setRecovery]=useState(false);
  useEffect(()=>{if(!supabase)return;let mounted=true;supabase.auth.getSession().then(({data})=>{if(mounted){setSession(data.session||null);setLoading(false);}}).catch(()=>setLoading(false));const {data:{subscription}}=supabase.auth.onAuthStateChange((event,next)=>{if(!mounted)return;if(event==='PASSWORD_RECOVERY')setRecovery(true);setSession(next);setLoading(false);});return()=>{mounted=false;subscription.unsubscribe();};},[]);
  if(!supabase)return <App/>;
  if(loading)return <GateMessage message="Preparando sua conta protegida..."/>;
  if(recovery&&session)return <PasswordReset onFinished={()=>setRecovery(false)}/>;
  if(!session?.user)return <AuthScreen/>;
  return <CloudWorkspace key={session.user.id} user={session.user} signOut={()=>supabase.auth.signOut()}/>;
}
