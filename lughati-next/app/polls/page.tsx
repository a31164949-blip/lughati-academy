"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../../firebase";
import StudentPollCard from "../components/StudentPollCard";

export default function PollsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [preview, setPreview] = useState(false);
  useEffect(() => {
    setPreview(new URLSearchParams(window.location.search).get("teacherPreview") === "1");
    return onAuthStateChanged(auth, setUser);
  }, []);
  return <main dir="rtl" style={{ padding: "100px 16px 30px", minHeight: "100vh", background: "#f4faf7", fontFamily: "Arial" }}><Link href={preview ? "/teacher/polls" : "/journey"}>العودة ←</Link>{user ? <StudentPollCard user={user} teacherPreview={preview} /> : <p>سجل دخولك لعرض التصويت.</p>}</main>;
}
