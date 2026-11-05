import type { Metadata } from 'next';
import AcademyCouncil from '../components/AcademyCouncil';
export const metadata: Metadata = { title: 'معًا نرتقي بمستوى أبنائنا | أكاديمية لغتي', description: 'حوار للطلاب وأسرهم، متاح حتى للحسابات المجمّدة، لاقتراح خطوات عملية ترفع مستوى القراءة والإملاء.' };
export default function LearningDialoguePage() { return <AcademyCouncil outreach />; }
