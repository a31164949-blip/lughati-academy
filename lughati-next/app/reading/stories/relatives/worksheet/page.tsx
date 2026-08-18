"use client";

import Link from "next/link";

export default function RelativesWorksheetPage() {
  function printWorksheet() {
    window.print();
  }

  return (
    <main
      dir="rtl"
      className="worksheetPage min-h-screen bg-slate-100 px-3 py-6"
    >
      <style>{`
        * {
          box-sizing: border-box;
        }

        .paper {
          position: relative;
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 11mm 12mm 9mm;
          color: #172554;
          box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
          overflow: hidden;
        }

        .watermark {
          position: absolute;
          top: 49%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-32deg);
          font-size: 27px;
          font-weight: 900;
          color: rgba(15, 23, 42, 0.055);
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
          letter-spacing: 1px;
        }

        .paperContent {
          position: relative;
          z-index: 2;
        }

        .answer-line {
          display: inline-block;
          min-width: 115px;
          border-bottom: 1.5px solid #475569;
          height: 20px;
          vertical-align: bottom;
        }

        .long-line {
          display: block;
          width: 100%;
          border-bottom: 1.4px solid #64748b;
          height: 22px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          html,
          body {
            width: 210mm;
            height: 297mm;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .worksheetPage {
            min-height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          .noPrint {
            display: none !important;
          }

          .paper {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 9mm 11mm 7mm !important;
            box-shadow: none !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            overflow: hidden !important;
          }

          .watermark {
            color: rgba(15, 23, 42, 0.06) !important;
          }
        }

        @media (max-width: 850px) {
          .paper {
            width: 100%;
            min-height: auto;
            padding: 22px 18px;
          }
        }
      `}</style>

      {/* أزرار الشاشة فقط */}

      <div className="noPrint mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-3">
        <Link
          href="/reading/stories/relatives"
          className="rounded-2xl border border-emerald-200 bg-white px-5 py-3 font-black text-emerald-700 no-underline shadow-sm"
        >
          ← العودة إلى القصة
        </Link>

        <button
          type="button"
          onClick={printWorksheet}
          className="rounded-2xl bg-slate-800 px-5 py-3 font-black text-white shadow-lg"
        >
          🖨️ طباعة الاختبار A4
        </button>
      </div>

      {/* الورقة */}

      <section className="paper">

        {/* العلامة المائية */}

        <div className="watermark">
          t267707@asrb.moe.gov.sa
        </div>

        <div className="paperContent">

          {/* رأس الورقة */}

          <header
            style={{
              border: "2px solid #1f5f46",
              borderRadius: "14px",
              padding: "9px 14px",
              marginBottom: "9px",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                gap: "10px",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  textAlign: "right",
                  fontSize: "11px",
                  lineHeight: 1.7,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                ابتدائية ومتوسطة زيد بن الخطاب والشهداء
                <br />
                المادة: لغتي
              </div>

              <div
                style={{
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 900,
                    color: "#145c43",
                  }}
                >
                  أكاديمية لغتي الرقمية
                </div>

                <div
                  style={{
                    marginTop: "2px",
                    fontSize: "13px",
                    fontWeight: 900,
                    color: "#172554",
                  }}
                >
                  الفهم القرائي
                </div>
              </div>

              <div
                style={{
                  textAlign: "left",
                  fontSize: "11px",
                  lineHeight: 1.7,
                  color: "#334155",
                  fontWeight: 700,
                }}
              >
                الوحدة الأولى: أقاربي
                <br />
                الصف الثاني الابتدائي
              </div>
            </div>
          </header>

          {/* عنوان الاختبار */}

          <div
            style={{
              textAlign: "center",
              marginBottom: "8px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "20px",
                fontWeight: 900,
                color: "#173f33",
              }}
            >
              📝 اختبار فهم قرائي
            </h1>

            <p
              style={{
                margin: "2px 0 0",
                fontSize: "14px",
                fontWeight: 900,
                color: "#475569",
              }}
            >
              النص: «صندوق الصور في بيت جدي»
            </p>
          </div>

          {/* بيانات الطالب */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr",
              gap: "9px",
              marginBottom: "9px",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            <div>
              اسم الطالب:{" "}
              <span className="answer-line" />
            </div>

            <div>
              الفصل:{" "}
              <span
                className="answer-line"
                style={{
                  minWidth: "55px",
                }}
              />
            </div>

            <div>
              التاريخ:{" "}
              <span
                className="answer-line"
                style={{
                  minWidth: "55px",
                }}
              />
            </div>
          </div>

          {/* النص */}

          <section
            style={{
              border: "1.5px solid #a7c9bb",
              borderRadius: "12px",
              padding: "9px 12px",
              background: "#fbfefd",
              marginBottom: "9px",
            }}
          >
            <h2
              style={{
                margin: "0 0 5px",
                fontSize: "14px",
                fontWeight: 900,
                color: "#166244",
              }}
            >
              📖 اقرأ النص ثم أجب:
            </h2>

            <p
              style={{
                margin: 0,
                fontSize: "12.2px",
                lineHeight: 1.85,
                color: "#1e293b",
                fontWeight: 600,
                textAlign: "justify",
              }}
            >
              في صباح الجمعة قال الأب لفواز:
              «سنزور جدك اليوم». فرح فواز
              كثيرًا؛ لأنه يحب زيارة جده وجدته.
              وعندما وصل إلى بيت جده رأى صندوقًا
              قديمًا، فسأل: «ما هذا يا جدي؟»
              قال الجد: «هذا صندوق صور العائلة».
              أخذ الجد صورة وقال: «هذا عمك،
              وهذه عمتك، وهذا خالك، وهذه خالتك».
              وبعد قليل جاء أبناء العم والخال،
              فلعب فواز معهم، ثم ساعد الجميع
              الجدة في ترتيب المجلس. وقبل أن
              يعود فواز إلى منزله قال الجد:
              «صلة الأقارب تزيد المحبة».
              ابتسم فواز وقال: «سأزوركم دائمًا
              يا جدي».
            </p>
          </section>

          {/* السؤال الأول */}

          <QuestionBox
            title="السؤال الأول: اختر الإجابة الصحيحة:"
          >
            <div className="space-y-2">
              <MultipleChoice
                number="1"
                question="ذهب فواز مع أسرته إلى:"
                options={[
                  "المدرسة",
                  "بيت جده",
                  "الحديقة",
                ]}
              />

              <MultipleChoice
                number="2"
                question="وجد فواز في بيت جده:"
                options={[
                  "صندوق صور",
                  "حقيبة",
                  "دراجة",
                ]}
              />

              <MultipleChoice
                number="3"
                question="من أقارب فواز الذين ذكرهم الجد؟"
                options={[
                  "العم والعمة",
                  "المعلم والطبيب",
                  "الصديق والجار",
                ]}
              />
            </div>
          </QuestionBox>

          {/* السؤال الثاني */}

          <QuestionBox
            title="السؤال الثاني: ضع علامة ( ✓ ) أمام العبارة الصحيحة وعلامة ( ✗ ) أمام العبارة الخاطئة:"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "7px 18px",
                fontSize: "11.5px",
                fontWeight: 700,
              }}
            >
              <p style={{ margin: 0 }}>
                ١ ـ كان فواز سعيدًا بزيارة جده. ( &nbsp;&nbsp; )
              </p>

              <p style={{ margin: 0 }}>
                ٢ ـ رفض فواز مساعدة جدته. ( &nbsp;&nbsp; )
              </p>

              <p style={{ margin: 0 }}>
                ٣ ـ لعب فواز مع أبناء أقاربه. ( &nbsp;&nbsp; )
              </p>

              <p style={{ margin: 0 }}>
                ٤ ـ صلة الأقارب تزيد المحبة. ( &nbsp;&nbsp; )
              </p>
            </div>
          </QuestionBox>

          {/* السؤال الثالث */}

          <QuestionBox
            title="السؤال الثالث: أكمل:"
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "9px 20px",
                fontSize: "11.5px",
                fontWeight: 700,
              }}
            >
              <div>
                ١ ـ هذا أخو أبي، فهو{" "}
                <span className="answer-line" />
              </div>

              <div>
                ٢ ـ هذه أخت أمي، فهي{" "}
                <span className="answer-line" />
              </div>
            </div>
          </QuestionBox>

          {/* السؤال الرابع */}

          <QuestionBox
            title="السؤال الرابع: اختر المعنى المناسب:"
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "8px",
                fontSize: "11.5px",
                fontWeight: 700,
              }}
            >
              <span>
                معنى كلمة «المحبة»:
              </span>

              <span>☐ الكراهية</span>
              <span>☐ المودة والحب</span>
              <span>☐ الخوف</span>
            </div>
          </QuestionBox>

          {/* السؤال الخامس */}

          <QuestionBox
            title="السؤال الخامس: أجب من فهمك:"
          >
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: 700,
              }}
            >
              <p
                style={{
                  margin: "0 0 4px",
                }}
              >
                ماذا تعلمت من قصة «صندوق الصور في بيت جدي»؟
              </p>

              <span className="long-line" />
            </div>
          </QuestionBox>

          {/* التذييل */}

          <footer
            style={{
              marginTop: "7px",
              paddingTop: "6px",
              borderTop: "1px solid #cbd5e1",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "10px",
              fontSize: "9.5px",
              color: "#64748b",
              fontWeight: 700,
            }}
          >
            <span>
              أكاديمية لغتي الرقمية — نتعلّم… نقرأ… نبدع
            </span>

            <span
              style={{
                direction: "ltr",
              }}
            >
              t267707@asrb.moe.gov.sa
            </span>

            <span>
              الأستاذ / إبراهيم أحمد
            </span>
          </footer>
        </div>
      </section>
    </main>
  );
}

/* ============================ */
/* مكونات الورقة */
/* ============================ */

function QuestionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        border: "1px solid #d6e1dc",
        borderRadius: "10px",
        padding: "7px 10px",
        marginBottom: "7px",
      }}
    >
      <h3
        style={{
          margin: "0 0 5px",
          fontSize: "12px",
          fontWeight: 900,
          color: "#174c3b",
        }}
      >
        {title}
      </h3>

      {children}
    </section>
  );
}

function MultipleChoice({
  number,
  question,
  options,
}: {
  number: string;
  question: string;
  options: string[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(190px,1.4fr) repeat(3,minmax(90px,1fr))",
        alignItems: "center",
        gap: "5px",
        fontSize: "11px",
        fontWeight: 700,
      }}
    >
      <span>
        {number} ـ {question}
      </span>

      {options.map((option) => (
        <span
          key={option}
          style={{
            whiteSpace: "nowrap",
          }}
        >
          ☐ {option}
        </span>
      ))}
    </div>
  );
}