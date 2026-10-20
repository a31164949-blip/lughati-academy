"use client";
import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ACADEMY_FRIENDS_NAMES, ACADEMY_FRIENDS_TITLE } from '../lib/academyFriends';
const Replies = dynamic(() => import('./FamilyDiscussion'), { loading: () => <p>جارٍ فتح الردود…</p> });
export default function AcademyFriendsBoard({ teacher = false }: { teacher?: boolean }) {
  const [showReplies, setShowReplies] = useState(teacher);
  return <section dir="rtl" aria-label="لوحة شكر أصدقاء الأكاديمية" style={{ width: '100%', maxWidth: 1100, margin: '24px auto', border: '2px solid #c5a551', borderRadius: 28, background: 'linear-gradient(135deg,#fffdf5 0%,#ffffff 48%,#edf8f0 100%)', boxShadow: '0 15px 45px #164f3110', padding: 'clamp(20px,4vw,42px)', color: '#194f3a' }}>
    <div style={{ textAlign: 'center', maxWidth: 800, margin: 'auto' }}>
      <p style={{ color: '#876a25', letterSpacing: 1, fontWeight: 800 }}>أكاديمية لغتي الرقمية</p>
      <div aria-hidden="true" style={{ fontSize: 38, margin: '8px 0' }}>🌿 ✨ 🌿</div>
      <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', lineHeight: 1.6, fontWeight: 900 }}>{ACADEMY_FRIENDS_TITLE}</h2>
      <p style={{ fontSize: 20, lineHeight: 2, margin: '18px 0' }}>لأصدقائنا الطلاب وأسرهم الكريمة: شكرًا لحضوركم الجميل، ومثابرتكم، وثقتكم منذ أول يوم. بكم امتدت رحلة التعلّم من الفصل إلى البيت، وبجهودكم أثمرت خطواتنا إنجازًا نعتز به.</p>
      <p style={{ color: '#886b25', fontSize: 20, fontWeight: 800, marginBottom: 24 }}>لكم في الأكاديمية أثرٌ طيّب… ولكم منا خالص الشكر والتقدير.</p>
    </div>
    <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}>
      {ACADEMY_FRIENDS_NAMES.map(name => <li key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#ffffffdd', padding: '16px 18px', border: '1px solid #d8e7d9', borderRadius: 16, fontSize: 20, fontWeight: 800, lineHeight: 1.7 }}><span aria-hidden="true" style={{ color: '#b39238' }}>✦</span><span>{name}</span></li>)}
    </ul>
    <div style={{ textAlign: 'center', marginTop: 26 }}>
      <p style={{ fontSize: 18, lineHeight: 1.9 }}>يسعدنا أن تتركوا كلمة أو ذكرى من رحلتكم معنا. يمكنكم اختيار إظهار الرد للمعلم فقط.</p>
      <button type="button" aria-expanded={showReplies} onClick={() => setShowReplies(value => !value)} style={{ background: '#17674d', color: 'white', padding: '14px 24px', border: 0, borderRadius: 14, font: 'inherit', fontWeight: 800, fontSize: 19, marginTop: 14, cursor: 'pointer' }}>{showReplies ? 'إغلاق الردود' : 'أضف ردك أو اطّلع على المشاركات'}</button>
      {<p style={{ marginTop: 12 }}><Link href="/teacher/friends">إدارة ردود لوحة الشكر ←</Link></p>}
    </div>
    {showReplies && <Replies teacher={teacher} appreciation />}
  </section>;
}
