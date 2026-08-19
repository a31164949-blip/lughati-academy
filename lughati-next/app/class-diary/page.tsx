"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";

import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import { db } from "../../firebase";

type DiaryPost = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  isPublished: boolean;
};

export default function ClassDiaryPage() {
  const [posts, setPosts] =
    useState<DiaryPost[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [fromParent] = useState(() => {
  if (typeof window === "undefined") {
    return false;
  }

  const params =
    new URLSearchParams(
      window.location.search
    );

  return (
    params.get("from") ===
    "parent"
  );
});
    useState(false);

  /*
   * معرفة مصدر الدخول.
   * نقرأ الرابط من المتصفح فقط
   * حتى لا يتعطل npm run build.
   */
  
  /*
   * تحميل اليوميات المنشورة.
   */
  useEffect(() => {
    let isMounted = true;

    async function loadPosts() {
      try {
        setLoading(true);

        const diaryQuery = query(
          collection(
            db,
            "classDiary"
          ),
          where(
            "isPublished",
            "==",
            true
          ),
          orderBy(
            "createdAt",
            "desc"
          )
        );

        const snapshot =
          await getDocs(
            diaryQuery
          );

        const items: DiaryPost[] =
          snapshot.docs.map(
            (document) => {
              const data =
                document.data();

              return {
                id: document.id,

                title:
                  typeof data.title ===
                  "string"
                    ? data.title
                    : "يومية الفصل",

                description:
                  typeof data.description ===
                  "string"
                    ? data.description
                    : "",

                imageUrl:
                  typeof data.imageUrl ===
                  "string"
                    ? data.imageUrl
                    : "",

                date:
                  typeof data.date ===
                  "string"
                    ? data.date
                    : "",

                isPublished:
                  data.isPublished ===
                  true,
              };
            }
          );

        if (isMounted) {
          setPosts(items);
        }
      } catch (error) {
        console.error(
          "خطأ في تحميل جميع اليوميات:",
          error
        );

        if (isMounted) {
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-emerald-50 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        {/* رأس الصفحة */}

        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-black text-blue-700">
              📖 من دفتر أكاديمية
              لغتي
            </span>

            <h1 className="mt-3 text-3xl font-black text-slate-800">
              📸 جميع يوميات الفصل
            </h1>

            <p className="mt-2 font-bold text-slate-500">
              أجمل لحظات التعلم
              والأنشطة والإنجازات
              داخل الفصل.
            </p>
          </div>

          <Link
            href={
              fromParent
                ? "/parent"
                : "/"
            }
            className="rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white no-underline shadow-lg transition hover:bg-emerald-800 active:scale-95"
          >
            {fromParent
              ? "← العودة إلى صفحة ولي الأمر"
              : "← العودة إلى الصفحة الرئيسية"}
          </Link>
        </div>

        {/* التحميل */}

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow">
            <div className="text-5xl">
              ⏳
            </div>

            <p className="mt-4 font-black text-slate-600">
              جاري تحميل
              اليوميات...
            </p>
          </div>
        ) : posts.length === 0 ? (
          /*
           * حالة عدم وجود يوميات.
           * هذه الحالة مهمة بعد
           * تنظيف البيانات التجريبية.
           */
          <div className="rounded-3xl border border-dashed border-blue-200 bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">
              📸
            </div>

            <h2 className="mt-4 text-xl font-black text-slate-700">
              لا توجد يوميات منشورة
              حاليًا
            </h2>

            <p className="mt-2 font-bold text-slate-400">
              ستظهر هنا اليوميات
              الجديدة بعد نشرها من
              المعلم.
            </p>
          </div>
        ) : (
          /*
           * اليوميات المنشورة.
           */
          <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(
              (post) => (
                <article
                  key={post.id}
                  className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  {post.imageUrl ? (
                    <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                      <img
                        src={
                          post.imageUrl
                        }
                        alt={
                          post.title
                        }
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-blue-50 to-amber-50 text-6xl">
                      📸
                    </div>
                  )}

                  <div className="p-5">
                    <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                      لقطة من الفصل
                    </span>

                    <h2 className="mt-3 text-xl font-black text-slate-800">
                      {post.title}
                    </h2>

                    {post.description && (
                      <p className="mt-2 text-sm font-bold leading-7 text-slate-500">
                        {
                          post.description
                        }
                      </p>
                    )}

                    {post.date && (
                      <div className="mt-4 text-sm font-black text-slate-400">
                        📅{" "}
                        {post.date}
                      </div>
                    )}
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </div>
    </main>
  );
}