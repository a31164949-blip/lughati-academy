import Link from "next/link";
import AcademyFriendsBoard from "../../components/AcademyFriendsBoard";
export default function TeacherFriendsPage() { return <main dir="rtl" className="min-h-screen bg-emerald-50 p-4"><Link href="/teacher">العودة إلى لوحة المعلم ←</Link><AcademyFriendsBoard teacher /></main>; }
