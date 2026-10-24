'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../../firebase';
import { markCouncilTopicSeen } from '../lib/councilNoticeSeen';
import AcademyLogo from './AcademyLogo';
import { COUNCIL_TOPIC_LIMIT, COUNCIL_REPLY_LIMIT, type CouncilTopic, type CouncilReply } from '../lib/academyCouncilPolicy';
import styles from './AcademyCouncil.module.css';
const PreviousDiscussion = dynamic(() => import('./FamilyDiscussion'), { loading: () => <p>جارٍ فتح الحوار السابق…</p> });
type ApiData = { success: boolean; message?: string; teacher: boolean; topics?: CouncilTopic[]; topic?: CouncilTopic; topicId?: string; replies?: CouncilReply[]; mine?: CouncilReply | null; cursor: string | null };
type Detail = { topic: CouncilTopic; replies: CouncilReply[]; mine: CouncilReply | null; cursor: string | null };
const labels: Record<string, string> = { pending: 'بانتظار اعتماد المعلم', published: 'منشور للأعضاء', private: 'للمعلم فقط', hidden: 'غير منشور' };
async function request(user: User, query: Record<string, string> = {}, method = 'GET', body?: Record<string, unknown>) {
  const response = await fetch(`/api/academy-council?${new URLSearchParams(query)}`, { method, cache: 'no-store', headers: { Authorization: `Bearer ${await user.getIdToken()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json() as ApiData;
  if (!response.ok || !data.success) throw Error(data.message || 'تعذر الاتصال بالمجلس.');
  return data;
}
export default function AcademyCouncil({ teacher = false }: { teacher?: boolean }) {
  const [user, setUser] = useState<User | null>(null), [ready, setReady] = useState(false), [isTeacher, setTeacher] = useState(teacher);
  const [view, setView] = useState(teacher ? 'pending' : 'published');
  const [topics, setTopics] = useState<CouncilTopic[]>([]), [cursor, setCursor] = useState<string | null>(null), [detail, setDetail] = useState<Detail | null>(null);
  const [title, setTitle] = useState(''), [topicText, setTopicText] = useState(''), [replyPolicy, setReplyPolicy] = useState<'teacher' | 'public'>('teacher');
  const [replyText, setReplyText] = useState(''), [visibility, setVisibility] = useState('private'), [drafts, setDrafts] = useState<Record<string, string>>({});
  const [composer, setComposer] = useState(false), [archive, setArchive] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const generation = useRef(0), lock = useRef(false);
  useEffect(() => {
    const stop = onAuthStateChanged(auth, account => {
      const version = ++generation.current; lock.current = false;
      setUser(account); setTeacher(teacher); setReady(true); setDetail(null); setTopics([]); setCursor(null); setTitle(''); setTopicText(''); setReplyText(''); setDrafts({}); setError(''); setMessage(''); setArchive(false); setComposer(false);
      if (!account) { setBusy(false); return; }
      setBusy(true);
      void request(account, { view: teacher ? 'pending' : 'published' }).then(async data => {
        if (version !== generation.current) return;
        setTeacher(data.teacher); setView(teacher ? 'pending' : 'published'); setTopics(data.topics ?? []); setCursor(data.cursor);
        const target = new URLSearchParams(window.location.search).get('topicId');
        if (target && /^[A-Za-z0-9_-]{1,128}$/.test(target)) await loadTopic(account, target, version);
      }).catch(error => { if (version === generation.current) setError(error.message); }).finally(() => { if (version === generation.current) setBusy(false); });
    });
    // Invalidate asynchronous requests when this auth subscription ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => { ++generation.current; stop(); };
  }, [teacher]);
  useEffect(() => { if (detail?.topic.id) document.getElementById('council-topic')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [detail?.topic.id]);
  async function run(action: (account: User, version: number) => Promise<void>) {
    if (!user || busy || lock.current) return;
    const version = generation.current; lock.current = true; setBusy(true); setMessage(''); setError('');
    try { await action(user, version); }
    catch (error) { if (version === generation.current) setError(error instanceof Error ? error.message : 'تعذر إتمام الطلب.'); }
    finally { if (version === generation.current) { lock.current = false; setBusy(false); } }
  }
  async function loadTopics(account: User, nextView: string, version: number, after?: string) {
    const data = await request(account, { view: nextView, ...(after ? { cursor: after } : {}) });
    if (version !== generation.current) return;
    setView(nextView); setCursor(data.cursor); setTopics(old => after ? [...old, ...(data.topics ?? []).filter(topic => !old.some(saved => saved.id === topic.id))] : data.topics ?? []);
  }
  async function loadTopic(account: User, topicId: string, version: number, after?: string) {
    const data = await request(account, { topicId, ...(after ? { cursor: after } : {}) });
    if (version !== generation.current || !data.topic) return;
    if (!data.teacher && data.topic.status === 'published') markCouncilTopicSeen(account.uid, topicId);
    setDetail(old => ({ topic: data.topic!, replies: after ? [...(old?.replies ?? []), ...(data.replies ?? []).filter(reply => !old?.replies.some(saved => saved.id === reply.id))] : data.replies ?? [], mine: data.mine ?? null, cursor: data.cursor }));
    setTopics(old => old.map(topic => topic.id === topicId ? data.topic! : topic));
    if (!after) { setReplyText(data.mine?.text ?? ''); setVisibility(data.mine?.visibility ?? 'private'); setDrafts({}); }
  }
  function moderate(action: string, reply?: CouncilReply) {
    if (!detail) return;
    void run(async (account, version) => {
      await request(account, {}, 'PATCH', { action, topicId: detail.topic.id, topicRevision: detail.topic.revision, ...(reply ? { replyId: reply.id, revision: reply.revision, teacherReply: drafts[reply.id] ?? reply.teacherReply } : {}) });
      await loadTopic(account, detail.topic.id, version);
      if (version === generation.current) {
        if ((view === 'pending' && ['approveTopic', 'hideTopic'].includes(action)) || (view === 'published' && action === 'hideTopic')) setTopics(old => old.filter(topic => topic.id !== detail.topic.id));
        setMessage('تم حفظ التغيير.');
      }
    });
  }
  const topic = detail?.topic;
  return <main dir="rtl" className={styles.page}>
    <header className={styles.header}><Link href="/" aria-label="العودة إلى الأكاديمية"><AcademyLogo size={62} /></Link><div><span className={styles.eyebrow}>أكاديمية لغتي الرقمية</span><p>مجتمع يتعلّم… وأسرة تشارك</p></div><Link className={styles.back} href={isTeacher ? '/teacher' : user ? '/journey' : '/'}>العودة {isTeacher ? 'للوحة المعلم' : user ? 'لصفحة الطالب' : 'للأكاديمية'} ←</Link></header>
    <div className={styles.wrap}>
      <section className={styles.hero}><span className={styles.kicker}>مساحة للفكرة… وأثرها</span><h1>مجلس الأكاديمية<span aria-hidden="true">✦</span></h1><p>نتشارك الرأي، ونقترح الحلول، ونصنع لأبنائنا فرصًا أجمل للتعلّم.</p><div className={styles.pills}><span>مواضيع يعتمدها المعلم</span><span>خصوصية واضحة للردود</span><span>حوار يجمعنا على الخير</span></div></section>
      {!ready ? <p className={styles.notice}>جارٍ التحقق من الدخول…</p> : !user ? <section className={styles.panel}><h2>أهلًا بك في مجلسنا</h2><p>سجّل دخولك بحساب الطالب أو الأسرة لقراءة المواضيع وإرسال مشاركتك.</p><Link className={styles.primary} href="/login?returnTo=%2Fdiscussion">دخول الطالب أو الأسرة ←</Link><Link className={styles.secondary} href="/teacher-login">دخول المعلم</Link></section> : <>
        <div className={styles.toolbar}><div><h2>{isTeacher ? 'إدارة مجلس الأكاديمية' : 'أصوات تصنع فرقًا'}</h2><p>نرجو تجنّب أسماء الطلاب والتفاصيل الشخصية في المشاركات العامة.</p></div><button type="button" className={styles.primary} disabled={busy} aria-expanded={composer} onClick={() => setComposer(value => !value)}>{composer ? 'إغلاق نموذج الموضوع' : isTeacher ? '+ اطرح موضوعًا للمجلس' : '+ اقترح موضوعًا جديدًا'}</button></div>
        {composer && <form className={styles.panel} onSubmit={event => { event.preventDefault(); void run(async (account, version) => {
          const data = await request(account, {}, 'POST', { action: 'createTopic', title, text: topicText, replyPolicy });
          if (version !== generation.current) return;
          setTitle(''); setTopicText(''); setComposer(false);
          await loadTopics(account, isTeacher ? 'published' : 'mine', version);
          if (data.topicId) await loadTopic(account, data.topicId, version);
          if (version === generation.current) setMessage(data.message ?? 'تم إرسال الموضوع.');
        }); }}><h2>{isTeacher ? 'موضوع جديد من المعلم' : 'فكرتك تستحق أن تُسمع'}</h2><label>عنوان الموضوع<input required maxLength={120} value={title} disabled={busy} onChange={event => setTitle(event.target.value)} placeholder="عنوان واضح يعبّر عن فكرتك" /></label><label>نص الموضوع<textarea required rows={6} maxLength={COUNCIL_TOPIC_LIMIT} value={topicText} disabled={busy} onChange={event => setTopicText(event.target.value)} placeholder="شاركنا فكرة أو تجربة أو سؤالًا تربويًا…" /></label><small>{topicText.length} / {COUNCIL_TOPIC_LIMIT} حرف</small>
          {isTeacher ? <p className={styles.notice}>سيختار كل عضو عند الرد: إظهاره للمعلم فقط، أو للأعضاء بعد اعتمادك.</p> : <fieldset disabled={busy}><legend>كيف ترغب في عرض ردود الأعضاء على موضوعك؟</legend><label className={styles.radio}><input type="radio" name="topic-policy" checked={replyPolicy === 'teacher'} onChange={() => setReplyPolicy('teacher')} /> تصل الردود للمعلم فقط</label><label className={styles.radio}><input type="radio" name="topic-policy" checked={replyPolicy === 'public'} onChange={() => setReplyPolicy('public')} /> إظهار الردود لكل الأعضاء بعد اعتماد المعلم</label><p>يظهر هذا الاختيار للمشارك قبل كتابة رده. موضوعك ينتظر موافقة المعلم قبل نشره.</p></fieldset>}
          <button type="submit" disabled={busy || !title.trim() || !topicText.trim()} className={styles.primary}>{isTeacher ? 'نشر الموضوع' : 'إرسال الموضوع لاعتماد المعلم'}</button>
        </form>}
        <nav className={styles.tabs} aria-label="عرض مواضيع المجلس">{[...(isTeacher ? [['pending', 'بانتظار الاعتماد']] : []), ['published', 'مواضيع المجلس'], ['mine', 'مواضيعي'], ...(isTeacher ? [['all', 'جميع المواضيع']] : [])].map(([value, label]) => <button type="button" key={value} aria-pressed={view === value} disabled={busy} className={view === value ? styles.selectedTab : styles.tab} onClick={() => void run(async (account, version) => { setDetail(null); await loadTopics(account, value, version); })}>{label}</button>)}<button type="button" className={styles.tab} disabled={busy} onClick={() => void run((account, version) => loadTopics(account, view, version))}>↻ تحديث القائمة</button></nav>
        <p role={error ? "alert" : "status"} aria-live="polite" className={`${styles.status} ${error ? styles.error : ""}`}>{busy ? 'جارٍ إتمام طلبك…' : error || message}</p>
        <div className={styles.topicGrid}>{topics.map(item => <article key={item.id} className={styles.topicCard}><div className={styles.meta}><span>{item.authorRole === 'teacher' ? 'من المعلم' : item.authorName}</span><span>{labels[item.status]}</span></div><h3>{item.title}</h3><p className={styles.preview}>{item.text}</p><p className={styles.policy}>{item.replyPolicy === 'choice' ? 'كل مشارك يختار خصوصية ردّه' : item.replyPolicy === 'public' ? 'ردود عامة بعد الاعتماد' : 'الردود للمعلم فقط'}</p><button type="button" disabled={busy} className={styles.openTopic} onClick={() => void run((account, version) => loadTopic(account, item.id, version))}>{isTeacher && item.status === 'pending' ? 'مراجعة الموضوع واعتماده' : 'اقرأ الموضوع وشارك'} ←</button></article>)}</div>
        {!topics.length && !busy && <div className={styles.empty}><span aria-hidden="true">✧</span><h3>{view === 'pending' ? 'لا توجد مواضيع تنتظر الاعتماد' : view === 'mine' ? 'هنا تبدأ فكرتك الأولى' : 'مجلسنا ينتظر أولى الأفكار'}</h3><p>{view === 'mine' ? 'أرسل اقتراحك، وسيراجعه المعلم قبل ظهوره للأعضاء.' : 'ستظهر المواضيع هنا بعد نشرها.'}</p></div>}
        {cursor && <button type="button" disabled={busy} className={styles.secondary} onClick={() => void run((account, version) => loadTopics(account, view, version, cursor))}>عرض مواضيع أقدم</button>}
        {detail && topic && <article id="council-topic" className={styles.detail} aria-busy={busy}><div className={styles.meta}><span>{topic.authorRole === 'teacher' ? 'موضوع من المعلم' : topic.authorName}</span><span>{labels[topic.status]} · {topic.status !== 'published' ? 'المشاركة بعد اعتماد المعلم' : topic.active ? 'الردود مفتوحة' : 'الردود مغلقة'}</span></div><h2>{topic.title}</h2><p className={styles.fullText}>{topic.text}</p>
          <div className={styles.notice}>{topic.replyPolicy === 'choice' ? 'موضوع من المعلم: تختار أنت خصوصية ردك قبل إرساله.' : topic.replyPolicy === 'public' ? 'اختار صاحب الموضوع إظهار الردود للأعضاء بعد اعتماد المعلم. لا تكتب معلومات شخصية في ردك.' : 'اختار صاحب الموضوع أن تصل ردود الأعضاء للمعلم فقط. يبقى ردك ورد المعلم عليه بينك وبين المعلم.'}</div>
          {isTeacher && <div className={styles.actions}>{topic.status === 'pending' && <button type="button" disabled={busy} className={styles.primary} onClick={() => moderate('approveTopic')}>اعتماد الموضوع ونشره</button>}{topic.status === 'published' && <button type="button" disabled={busy} className={styles.secondary} onClick={() => moderate('toggleTopic')}>{topic.active ? 'إغلاق الردود على الموضوع' : 'فتح الردود'}</button>}{topic.status === 'hidden' && <button type="button" disabled={busy} className={styles.primary} onClick={() => moderate('restoreTopic')}>إعادة نشر الموضوع</button>}{topic.status !== 'hidden' && <button type="button" disabled={busy} className={styles.danger} onClick={() => moderate('hideTopic')}>{topic.status === 'pending' ? 'عدم اعتماد الموضوع' : 'إخفاء الموضوع'}</button>}</div>}
          {!isTeacher && topic.status === 'published' && <form className={styles.replyForm} onSubmit={event => { event.preventDefault(); void run(async (account, version) => {
            const data = await request(account, {}, 'POST', { action: 'reply', topicId: topic.id, text: replyText, visibility });
            await loadTopic(account, topic.id, version);
            if (version === generation.current) setMessage(data.message ?? 'حُفظ ردك.');
          }); }}><label>ردّك على الموضوع<textarea rows={5} maxLength={COUNCIL_REPLY_LIMIT} required disabled={busy || !topic.active} value={replyText} onChange={event => setReplyText(event.target.value)} /></label><small>{replyText.length} / {COUNCIL_REPLY_LIMIT} حرف</small>{topic.authorRole === 'teacher' && <fieldset disabled={busy || !topic.active}><legend>من يمكنه الاطلاع على ردك؟</legend><label className={styles.radio}><input type="radio" name="reply-visibility" checked={visibility === 'private'} onChange={() => setVisibility('private')} /> المعلم فقط</label><label className={styles.radio}><input type="radio" name="reply-visibility" checked={visibility === 'public'} onChange={() => setVisibility('public')} /> كل الأعضاء بعد اعتماد المعلم</label></fieldset>}<button type="submit" disabled={busy || !topic.active || !replyText.trim()} className={styles.primary}>{detail.mine ? 'حفظ تعديل الرد' : 'إرسال الرد'}</button><p className={styles.policy}>كل تعديل لرد عام يعيده للمراجعة. الردود الخاصة لا ينشرها المعلم للعامة.</p></form>}
          {detail.mine && <section className={styles.ownReply}><h3>ردّك المحفوظ · {labels[detail.mine.status]}</h3><p className={styles.fullText}>{detail.mine.text}</p>{detail.mine.teacherReply && <div className={styles.teacherReply}><strong>رد المعلم عليك</strong><p className={styles.fullText}>{detail.mine.teacherReply}</p></div>}</section>}
          <div className={styles.toolbar}><h3>{isTeacher ? 'ردود الأعضاء' : 'الردود العامة المعتمدة'}</h3><button type="button" className={styles.secondary} disabled={busy} onClick={() => void run((account, version) => loadTopic(account, topic.id, version))}>تحديث الردود</button></div>
          {detail.replies.map(reply => <section key={reply.id} className={styles.reply}><div className={styles.meta}><strong>{reply.name}</strong><span>{labels[reply.status]}</span></div><p className={styles.fullText}>{reply.text}</p>{reply.teacherReply && <div className={styles.teacherReply}><strong>رد المعلم</strong><p className={styles.fullText}>{reply.teacherReply}</p></div>}{isTeacher && <><label>ردك على هذه المشاركة<textarea rows={3} maxLength={1500} disabled={busy} value={drafts[reply.id] ?? reply.teacherReply} onChange={event => setDrafts(old => ({ ...old, [reply.id]: event.target.value }))} /></label><p className={styles.policy}>{reply.visibility === 'private' ? 'رد خاص: يراه صاحبه والمعلم فقط.' : reply.status === 'published' ? 'سيظهر ردك مع المشاركة للجميع.' : 'يراه صاحب الرد الآن، ويظهر للأعضاء إذا اعتمدت المشاركة العامة.'}</p><div className={styles.actions}><button type="button" disabled={busy || !(drafts[reply.id] ?? reply.teacherReply).trim()} className={styles.primary} onClick={() => moderate('respond', reply)}>حفظ رد المعلم</button>{reply.visibility === 'public' && topic.replyPolicy !== 'teacher' && topic.status === 'published' && reply.status !== 'published' && <button type="button" disabled={busy} className={styles.secondary} onClick={() => moderate('publishReply', reply)}>اعتماد الرد العام</button>}{reply.visibility === 'public' && reply.status !== 'hidden' && <button type="button" disabled={busy} className={styles.danger} onClick={() => moderate('hideReply', reply)}>إخفاء المشاركة العامة</button>}</div></>}</section>)}
          {!detail.replies.length && <p className={styles.policy}>{topic.replyPolicy === 'teacher' && !isTeacher ? 'ردود هذا الموضوع تصل للمعلم فقط.' : 'لا توجد ردود للعرض بعد.'}</p>}{detail.cursor && <button type="button" disabled={busy} className={styles.secondary} onClick={() => void run((account, version) => loadTopic(account, topic.id, version, detail.cursor!))}>عرض مزيد من الردود</button>}
        </article>}
        {isTeacher && <section className={styles.archive}><button type="button" className={styles.secondary} aria-expanded={archive} onClick={() => setArchive(value => !value)}>{archive ? 'إغلاق الحوار السابق' : 'فتح موضوع زاوية الحوار السابق وردوده'}</button>{archive && <PreviousDiscussion teacher legacy />}</section>}
      </>}
      <footer className={styles.footer}>أكاديمية لغتي الرقمية <span>✦</span> نختلف في الرأي… ونجتمع على مصلحة أبنائنا</footer>
    </div>
  </main>;
}
