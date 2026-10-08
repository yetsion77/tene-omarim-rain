import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, CalendarDays, Camera, Check, CloudRain, Droplets, ExternalLink,
  ImagePlus, LogIn, LogOut, Menu, Plus, ShieldCheck, Trash2, X,
} from 'lucide-react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { auth, db, googleProvider, hasStorage, isConfigured, storage } from './firebase.js';

const OWNER_EMAIL = 'yetsion@gmail.com';
const RAIN_PATH = ['sites', 'teneOmarimRain', 'rainfallEntries'];
const GALLERY_PATH = ['sites', 'teneOmarimRain', 'gallery'];
const MONTHS = ['אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳', 'ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יוני', 'יולי'];
const LONG_DATE = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jerusalem' });

function todayInIsrael() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function seasonStart(date) {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  return month >= 8 ? year : year - 1;
}

function formatSeason(year) {
  return `${year}/${String(year + 1).slice(-2)}`;
}

function displayDate(date) {
  if (!date) return '—';
  return LONG_DATE.format(new Date(`${date}T12:00:00+03:00`));
}

function formatMm(value) {
  return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value);
}

function Landscape() {
  return (
    <svg className="landscape" viewBox="0 0 900 570" preserveAspectRatio="xMidYMid slice" role="img" aria-label="איור של הרי חברון וענני גשם">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b8d5d1"/><stop offset=".56" stopColor="#dae0d1"/><stop offset="1" stopColor="#e9dfca"/></linearGradient>
        <linearGradient id="hill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#b89578"/><stop offset="1" stopColor="#98765f"/></linearGradient>
      </defs>
      <rect width="900" height="570" fill="url(#sky)" />
      <circle cx="625" cy="157" r="82" fill="#f7e9c9" opacity=".84" />
      <path d="M0 280C150 200 235 224 360 285c145-100 291-91 540-22v307H0Z" fill="#b7ae94" opacity=".63" />
      <path d="M0 360c129-69 268-93 385-43 163-64 345-36 515 12v241H0Z" fill="#9eaa95" />
      <path d="M0 442c126-60 236-46 368-24 177-117 317-108 532-46v198H0Z" fill="url(#hill)" />
      <path d="M0 513c194-80 292-36 405-10 146-85 295-83 495-28v95H0Z" fill="#705e52" />
      <path d="M316 357h148v55H316z" fill="#e6d6bd"/><path d="m305 357 84-43 88 43z" fill="#806b5c"/>
      <path d="M334 370h33v42h-33zm86 0h25v23h-25z" fill="#78949a"/>
      <path d="M498 337h92v49h-92z" fill="#e3d3b8"/><path d="m490 338 55-35 53 35z" fill="#8b7363"/><path d="M516 349h24v37h-24z" fill="#7b9699"/>
      <path d="M675 373h107v58H675z" fill="#dcc5aa"/><path d="m668 373 58-38 63 38z" fill="#846d5c"/><path d="M693 390h25v41h-25zm47 0h25v23h-25z" fill="#859e9d"/>
      <path d="M99 390h86v42H99z" fill="#dfcbb1"/><path d="m91 390 52-34 51 34z" fill="#867364"/><path d="M119 400h25v32h-25z" fill="#78969a"/>
      <g fill="#4f6559"><ellipse cx="243" cy="417" rx="24" ry="27"/><ellipse cx="603" cy="398" rx="21" ry="25"/><ellipse cx="819" cy="440" rx="28" ry="31"/></g>
      <g stroke="#536659" strokeWidth="4" strokeLinecap="round"><path d="M244 449v-28m357 0v-28m220 85v-38"/></g>
      <g fill="#f5f3e8" opacity=".88"><ellipse cx="222" cy="111" rx="73" ry="28"/><ellipse cx="276" cy="107" rx="48" ry="35"/><ellipse cx="299" cy="116" rx="82" ry="23"/><ellipse cx="724" cy="102" rx="62" ry="26"/><ellipse cx="765" cy="93" rx="53" ry="33"/><ellipse cx="800" cy="107" rx="59" ry="22"/></g>
      <g stroke="#eff8f5" strokeWidth="3" strokeLinecap="round" opacity=".67"><path d="m182 149-9 20m47-21-8 21m49-17-10 21m485-24-9 18m48-22-9 21m44-14-8 18"/></g>
    </svg>
  );
}

function RainChart({ entries, year }) {
  const values = MONTHS.map((_, index) => {
    const month = (index + 7) % 12 + 1;
    const actualYear = month >= 8 ? year : year + 1;
    return entries.filter(item => Number(item.date.slice(0, 4)) === actualYear && Number(item.date.slice(5, 7)) === month)
      .reduce((sum, item) => sum + Number(item.mm), 0);
  });
  const maximum = Math.max(1, ...values);
  const hasRain = values.some(value => value > 0);
  return (
    <div className="chart-wrap">
      {hasRain ? <div className="chart" role="img" aria-label={`כמות הגשם החודשית בעונת ${formatSeason(year)}`}>
        {values.map((value, index) => <div className="chart-column" key={MONTHS[index]}>
          <div className="chart-value">{value ? `${formatMm(value)}` : ''}</div>
          <div className="chart-track"><div className="chart-bar" style={{ height: value ? `${Math.max(7, value / maximum * 100)}%` : '0%' }} /></div>
          <span>{MONTHS[index]}</span>
        </div>)}
      </div> : <div className="chart-empty"><CloudRain size={33} strokeWidth={1.5}/><span>הגרף יתמלא עם המדידה הראשונה בעונה</span></div>}
    </div>
  );
}

function AdminDialog({ onClose, user, onLogin, onLogout, entries, photos, setMessage }) {
  const [tab, setTab] = useState('rain');
  const [date, setDate] = useState(todayInIsrael());
  const [mm, setMm] = useState('');
  const [note, setNote] = useState('');
  const [caption, setCaption] = useState('');
  const [photoDate, setPhotoDate] = useState(todayInIsrael());
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const isOwner = user?.email === OWNER_EMAIL && user?.emailVerified;

  async function addRain(event) {
    event.preventDefault();
    const amount = Number(mm);
    if (!Number.isFinite(amount) || amount <= 0 || amount > 500 || !date) return;
    setBusy(true);
    try {
      await addDoc(collection(db, ...RAIN_PATH), { date, mm: amount, note: note.trim(), createdAt: serverTimestamp() });
      setMm(''); setNote(''); setMessage('המדידה נשמרה בהצלחה');
    } catch (error) { setMessage(`שמירת המדידה נכשלה: ${error.message}`); }
    finally { setBusy(false); }
  }

  async function addPhoto(event) {
    event.preventDefault();
    if (!file || !storage) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size >= 10 * 1024 * 1024) {
      setMessage('אפשר להעלות תמונת JPG, PNG או WebP שגודלה קטן מ־10MB'); return;
    }
    setBusy(true);
    const path = `tene-omarim-rain/gallery/${crypto.randomUUID()}/${file.name.replace(/[^\w.\-]/g, '_')}`;
    const fileRef = ref(storage, path);
    let uploaded = false;
    try {
      await uploadBytes(fileRef, file, { contentType: file.type }); uploaded = true;
      const url = await getDownloadURL(fileRef);
      await addDoc(collection(db, ...GALLERY_PATH), { caption: caption.trim(), date: photoDate, path, url, createdAt: serverTimestamp() });
      setFile(null); setCaption(''); setMessage('התמונה עלתה לגלריה');
      event.target.reset();
    } catch (error) {
      if (uploaded) await deleteObject(fileRef).catch(() => {});
      setMessage(`העלאת התמונה נכשלה: ${error.message}`);
    } finally { setBusy(false); }
  }

  async function removeEntry(item) {
    if (!window.confirm(`למחוק את המדידה מ־${displayDate(item.date)}?`)) return;
    try { await deleteDoc(doc(db, ...RAIN_PATH, item.id)); setMessage('המדידה נמחקה'); }
    catch (error) { setMessage(`המחיקה נכשלה: ${error.message}`); }
  }

  async function removePhoto(item) {
    if (!window.confirm('למחוק את התמונה מהגלריה?')) return;
    try {
      await deleteDoc(doc(db, ...GALLERY_PATH, item.id));
      if (storage && item.path) await deleteObject(ref(storage, item.path));
      setMessage('התמונה נמחקה');
    } catch (error) { setMessage(`המחיקה נכשלה: ${error.message}`); }
  }

  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-title">
      <div className="dialog-head"><div><div className="eyebrow dark">ניהול האתר</div><h2 id="admin-title">עדכון מהחצר</h2></div><button className="icon-button" onClick={onClose} aria-label="סגירה"><X size={22}/></button></div>
      {!isConfigured ? <div className="admin-notice">חיבור הנתונים עדיין בהכנה. אפשר לצפות באתר; הזנת מדידות תיפתח לאחר חיבור Firebase.</div>
        : !isOwner ? <div className="login-panel"><ShieldCheck size={38} strokeWidth={1.4}/><h3>כניסה לבעל האתר</h3><p>הזנת מדידות והעלאת תמונות זמינות רק לחשבון הניהול.</p><button className="primary-button" onClick={onLogin}><LogIn size={18}/> כניסה עם Google</button>{user && <p className="login-warning">מחובר כ־{user.email}. לחשבון זה אין הרשאת עריכה.</p>}</div>
          : <><div className="admin-identity"><span><Check size={15}/> מחובר כ־{user.email}</span><button onClick={onLogout}><LogOut size={15}/> יציאה</button></div>
            <div className="admin-tabs" role="tablist"><button className={tab === 'rain' ? 'active' : ''} onClick={() => setTab('rain')}>מדידה חדשה</button><button className={tab === 'photo' ? 'active' : ''} onClick={() => setTab('photo')}>תמונה חדשה</button><button className={tab === 'manage' ? 'active' : ''} onClick={() => setTab('manage')}>ניהול</button></div>
            {tab === 'rain' && <form className="admin-form" onSubmit={addRain}><label>תאריך המדידה<input type="date" value={date} onChange={event => setDate(event.target.value)} required/></label><label>כמות הגשם (מ״מ)<input type="number" min="0.1" max="500" step="0.1" inputMode="decimal" placeholder="לדוגמה 12.5" value={mm} onChange={event => setMm(event.target.value)} required/></label><label>הערה קצרה (לא חובה)<textarea maxLength="300" rows="3" placeholder="למשל: ממטרים בשעות הערב" value={note} onChange={event => setNote(event.target.value)}/></label><button className="primary-button" disabled={busy}><Plus size={18}/>{busy ? 'שומר...' : 'שמירת המדידה'}</button></form>}
            {tab === 'photo' && <form className="admin-form" onSubmit={addPhoto}>{!hasStorage && <div className="admin-notice">אחסון התמונות עדיין אינו פעיל בפרויקט Firebase.</div>}<label>בחירת תמונה<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => setFile(event.target.files?.[0] ?? null)} required/></label><label>תאריך הצילום<input type="date" value={photoDate} onChange={event => setPhotoDate(event.target.value)} required/></label><label>כיתוב לתמונה<input maxLength="200" placeholder="מה רואים בתמונה?" value={caption} onChange={event => setCaption(event.target.value)}/></label><button className="primary-button" disabled={busy || !hasStorage}><ImagePlus size={18}/>{busy ? 'מעלה...' : 'העלאה לגלריה'}</button></form>}
            {tab === 'manage' && <div className="manage-lists"><h3>מדידות אחרונות</h3>{entries.length ? entries.slice(0, 20).map(item => <div className="manage-row" key={item.id}><span>{displayDate(item.date)} · {formatMm(Number(item.mm))} מ״מ</span><button onClick={() => removeEntry(item)} aria-label="מחיקת מדידה"><Trash2 size={17}/></button></div>) : <p>אין עדיין מדידות.</p>}<h3>תמונות</h3>{photos.length ? photos.map(item => <div className="manage-row" key={item.id}><span>{item.caption || displayDate(item.date)}</span><button onClick={() => removePhoto(item)} aria-label="מחיקת תמונה"><Trash2 size={17}/></button></div>) : <p>אין עדיין תמונות.</p>}</div>}
          </>}
    </section>
  </div>;
}

export default function App() {
  const adminMode = new URLSearchParams(window.location.search).get('admin') === '1';
  const [entries, setEntries] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedYear, setSelectedYear] = useState(seasonStart(todayInIsrael()));
  const [adminOpen, setAdminOpen] = useState(adminMode);
  const [activePhotoId, setActivePhotoId] = useState(null);
  const photoTriggerRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [dataError, setDataError] = useState('');
  const activePhoto = photos.find(photo => photo.id === activePhotoId);

  useEffect(() => {
    if (!db || !auth) return undefined;
    const stopAuth = onAuthStateChanged(auth, setUser);
    const stopRain = onSnapshot(query(collection(db, ...RAIN_PATH), orderBy('date', 'desc')),
      snapshot => setEntries(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      () => setDataError('נתוני המדידות אינם זמינים כעת. נסו לרענן את הדף.'));
    const stopPhotos = onSnapshot(query(collection(db, ...GALLERY_PATH), orderBy('date', 'desc')),
      snapshot => setPhotos(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))),
      () => setDataError('הגלריה אינה זמינה כעת. נסו לרענן את הדף.'));
    return () => { stopAuth(); stopRain(); stopPhotos(); };
  }, []);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 5500);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!activePhoto) return undefined;
    const previousOverflow = document.body.style.overflow;
    const onKeyDown = event => { if (event.key === 'Escape') closePhoto(); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activePhoto]);

  const seasons = useMemo(() => [...new Set([seasonStart(todayInIsrael()), ...entries.map(item => seasonStart(item.date))])].sort((a, b) => b - a), [entries]);
  const seasonEntries = useMemo(() => entries.filter(item => seasonStart(item.date) === selectedYear), [entries, selectedYear]);
  const total = seasonEntries.reduce((sum, item) => sum + Number(item.mm), 0);
  const rainyDays = new Set(seasonEntries.map(item => item.date)).size;
  const latest = seasonEntries[0];
  const currentYear = seasonStart(todayInIsrael());

  async function login() {
    try { await signInWithPopup(auth, googleProvider); }
    catch (error) { setMessage(`הכניסה נכשלה: ${error.message}`); }
  }

  function closePhoto() {
    setActivePhotoId(null);
    requestAnimationFrame(() => photoTriggerRef.current?.focus());
  }

  return <div className="site-shell">
    <header className="site-header"><div className="container header-inner"><a className="brand" href="#top" aria-label="גשם בטנא עומרים - ראש העמוד"><span className="brand-mark"><Droplets size={25} strokeWidth={1.8}/></span><span><strong>גשם בטנא עומרים</strong><small>מד הגשם המקומי · הר חברון</small></span></a><nav className={menuOpen ? 'main-nav open' : 'main-nav'} aria-label="ניווט ראשי"><a href="#season" onClick={() => setMenuOpen(false)}>העונה</a><a href="#readings" onClick={() => setMenuOpen(false)}>מדידות</a><a href="#gallery" onClick={() => setMenuOpen(false)}>תמונות</a><a href="#about" onClick={() => setMenuOpen(false)}>על המדידה</a></nav><div className="header-actions">{adminMode && <button className="admin-link" onClick={() => setAdminOpen(true)}><span>עדכון נתונים</span><Plus size={17}/></button>}<button className="mobile-menu icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'סגירת תפריט' : 'פתיחת תפריט'}>{menuOpen ? <X/> : <Menu/>}</button></div></div></header>

    <main id="top"><section className="hero"><div className="container hero-grid"><div className="hero-content"><div className="hero-kicker"><span className="live-dot"/> מדידות מקומיות מטנא עומרים</div><h1>כשהגשם יורד<br/><em>על ההר</em></h1><p>יומן הגשם של טנא עומרים — כל טיפה שנמדדה בחצר, במקום אחד.</p><a className="hero-cta" href="#season">לנתוני העונה <ArrowLeft size={18}/></a><div className="hero-note"><CloudRain size={18}/><span>מדידה עצמאית · מתעדכן לאחר כל קריאה במד הגשם</span></div></div><div className="hero-art"><Landscape/><div className="art-caption">טנא עומרים, הרי חברון <span>איור</span></div></div></div></section>

    <section id="season" className="season-section"><div className="container"><div className="section-heading"><div><span className="eyebrow">תמונת מצב</span><h2>הגשם של העונה</h2><p>מדידות ממד הגשם המקומי בחצר</p></div><label className="season-select"><span>עונת גשם</span><select value={selectedYear} onChange={event => setSelectedYear(Number(event.target.value))}>{seasons.map(year => <option key={year} value={year}>{formatSeason(year)}</option>)}</select></label></div>{dataError && <div className="data-error" role="alert">{dataError}</div>}<div className="stats-grid"><article className="stat-card primary-stat"><div className="stat-icon"><Droplets size={25}/></div><span>ירדו מתחילת העונה</span><div className="big-stat">{seasonEntries.length ? formatMm(total) : '—'}<small>מ״מ</small></div><p>{seasonEntries.length ? `מאז 1 באוגוסט ${selectedYear}` : 'המדידה הראשונה תופיע כאן בקרוב'}</p></article><article className="stat-card"><span className="stat-small-icon"><CloudRain size={21}/></span><span>ימי גשם שנמדדו</span><strong>{seasonEntries.length ? rainyDays : '—'}</strong><p>ימים עם מדידה בעונה</p></article><article className="stat-card"><span className="stat-small-icon"><CalendarDays size={21}/></span><span>המדידה האחרונה</span><strong className="last-date">{latest ? displayDate(latest.date) : 'טרם נמדד'}</strong><p>{latest ? `${formatMm(Number(latest.mm))} מ״מ במדידה האחרונה` : 'ממתינים לגשם הראשון'}</p></article></div></div></section>

    <section id="readings" className="readings-section"><div className="container readings-grid"><div className="panel chart-panel"><div className="panel-heading"><div><span className="eyebrow">מבט לאורך העונה</span><h2>מתי ירד הגשם?</h2></div><span className="panel-unit">מילימטרים בחודש</span></div><RainChart entries={seasonEntries} year={selectedYear}/></div><div className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow">יומן מקומי</span><h2>מדידות אחרונות</h2></div></div>{seasonEntries.length ? <div className="reading-list">{seasonEntries.slice(0, 5).map(item => <div className="reading-item" key={item.id}><div className="reading-drop"><Droplets size={17}/></div><div><strong>{displayDate(item.date)}</strong><span>{item.note || 'מדידה ממד הגשם בחצר'}</span></div><b>{formatMm(Number(item.mm))} <small>מ״מ</small></b></div>)}</div> : <div className="recent-empty"><span className="empty-rain">☂</span><strong>ממתינים למדידה הראשונה</strong><p>כשתירשם מדידה, היא תופיע כאן ובגרף.</p></div>}</div></div></section>

    <section id="gallery" className="gallery-section"><div className="container"><div className="section-heading gallery-heading"><div><span className="eyebrow">רגעים מההר</span><h2>טנא עומרים בתמונות</h2><p>נוף, עננים, שלוליות ורגעים של חורף ביישוב</p></div><span className="gallery-count"><Camera size={18}/> {photos.length} תמונות</span></div>{photos.length ? <div className="gallery-grid">{photos.map(photo => <figure className="photo-card" key={photo.id}><button className="photo-open" onClick={event => { photoTriggerRef.current = event.currentTarget; setActivePhotoId(photo.id); }} aria-label={`הצגת תמונה בגודל מלא: ${photo.caption || 'טנא עומרים'}`}><img src={photo.url} alt="" loading="lazy"/></button><figcaption><strong>{photo.caption || 'רגע מטנא עומרים'}</strong><span>{displayDate(photo.date)}</span></figcaption></figure>)}</div> : <div className="gallery-placeholder"><div className="placeholder-art"><div className="placeholder-sun"/><div className="placeholder-hill one"/><div className="placeholder-hill two"/><Camera size={46} strokeWidth={1.2}/></div><div><h3>התמונות הראשונות בדרך</h3><p>כאן נאסוף תמונות מן היישוב ומימי הגשם בהר חברון.</p></div></div>}</div></section>

    <section id="about" className="about-section"><div className="container about-grid"><div><span className="eyebrow">איך מודדים?</span><h2>סיפור קטן<br/>של כל טיפה</h2><p>הנתונים באתר נמדדים במד גשם פרטי בחצר בטנא עומרים ומוזנים לאחר קריאה ידנית. הסיכום העונתי מחושב מתוך המדידות שנרשמו, מתחילת אוגוסט ועד סוף יולי.</p><p>המדידות מייצגות נקודה אחת ביישוב, ולכן עשויות להיות שונות מנתוני תחנה מטאורולוגית סמוכה.</p></div><a className="official-card" href="https://ims.gov.il/he/AccumulatedRain" target="_blank" rel="noopener noreferrer"><span className="official-icon"><ExternalLink size={23}/></span><span className="eyebrow">להרחבת התמונה</span><strong>נתוני הגשם של השירות המטאורולוגי</strong><span>לצפייה במדידות הרשמיות ובנתונים מתחנות ברחבי הארץ</span><span className="official-link">מעבר לאתר השירות המטאורולוגי <ArrowLeft size={17}/></span></a></div></section></main>

    <footer className="site-footer"><div className="container footer-inner"><div className="footer-brand"><Droplets size={22}/><span>גשם בטנא עומרים</span></div><p>מדידות מקומיות מהר חברון · נבנה באהבה לגשם</p>{adminMode && <button onClick={() => setAdminOpen(true)}>כניסת מנהל</button>}</div></footer>
    {activePhoto && <div className="photo-lightbox" onMouseDown={event => { if (event.target === event.currentTarget) closePhoto(); }}><section className="photo-lightbox-dialog" role="dialog" aria-modal="true" aria-labelledby="photo-title"><button className="photo-close" onClick={closePhoto} aria-label="סגירת התמונה" autoFocus><X size={24}/></button><img src={activePhoto.url} alt={activePhoto.caption || 'תמונה מטנא עומרים'}/><div className="photo-lightbox-caption"><div><strong id="photo-title">{activePhoto.caption || 'רגע מטנא עומרים'}</strong><span>{displayDate(activePhoto.date)}</span></div><a href={activePhoto.url} target="_blank" rel="noopener noreferrer">פתיחת הקובץ המקורי <ExternalLink size={16}/></a></div></section></div>}
    {adminOpen && <AdminDialog onClose={() => setAdminOpen(false)} user={user} onLogin={login} onLogout={() => signOut(auth)} entries={entries} photos={photos} setMessage={setMessage}/>}
    {message && <div className="toast" role="status">{message}<button onClick={() => setMessage('')} aria-label="סגירה"><X size={16}/></button></div>}
  </div>;
}
