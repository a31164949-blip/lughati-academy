"use client";

import Link from "next/link";
import {
  ChangeEvent,
  useEffect,
  useState,
} from "react";

import {
  doc,
  getDoc,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../../firebase";

type StudentInfo = {
  id: string;
  name: string;
  classroom: string;
};

type ImageQualityResult = {
  status: "good" | "acceptable" | "bad";
  score: number;
  passed: boolean;
  brightness: number;
  contrast: number;
  sharpness: number;
  notes: string[];
};

type NotebookAnalysisResult = {
  suggestedCategory: string;
  strengths: string[];
  improvementNote: string;
  confidence: number;
};

function getCategoryLabel(value: string) {
  const labels: Record<string, string> = {
    handwriting: "خط جميل",
    formatting: "تنسيق مميز",
    design: "تنسيق مميز",
    care: "عناية بالدفتر",
    improvement: "تطور ملحوظ",
    progress: "تطور ملحوظ",
  };

  return labels[value.trim().toLowerCase()] || value;
}

export default function NotebookExcellencePage() {
  const [student, setStudent] =
    useState<StudentInfo | null>(
      null
    );

  const [loadingStudent, setLoadingStudent] =
    useState(true);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [previewUrl, setPreviewUrl] =
    useState("");

  const [note, setNote] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [analysisFailed, setAnalysisFailed] =
    useState(false);

  const [rejectionMessage, setRejectionMessage] =
    useState("");

  const [analysisResult, setAnalysisResult] =
    useState<NotebookAnalysisResult | null>(null);

  const [analysisToken, setAnalysisToken] =
    useState("");

  const [analyzedImageUrl, setAnalyzedImageUrl] =
    useState("");

  const [nominationSent, setNominationSent] =
    useState(false);

  const [imageWidth, setImageWidth] =
    useState(0);

  const [imageHeight, setImageHeight] =
    useState(0);

  const [
    imageQuality,
    setImageQuality,
  ] =
    useState<ImageQualityResult | null>(
      null
    );

  useEffect(() => {
    let active = true;

    async function loadStudent() {
      try {
        const studentId =
          window.localStorage.getItem(
            "student-id"
          );

        if (!studentId) {
          if (active) {
            setStudent(null);
          }

          return;
        }

        const studentSnapshot =
          await getDoc(
            doc(
              db,
              "students",
              studentId
            )
          );

        if (
          !studentSnapshot.exists()
        ) {
          if (active) {
            setStudent(null);
          }

          return;
        }

        const data =
          studentSnapshot.data();

        if (active) {
          setStudent({
            id:
              studentSnapshot.id,

            name:
              typeof data.studentName ===
              "string"
                ? data.studentName
                : typeof data.name ===
                    "string"
                  ? data.name
                  : "طالب",

            classroom:
              typeof data.classroom ===
              "string"
                ? data.classroom
                : "",
          });

          const currentUser = auth.currentUser;

          if (currentUser) {
            const idToken = await currentUser.getIdToken();
            const rejectionResponse = await fetch(
              "/api/notebook-analysis",
              {
                headers: {
                  Authorization: `Bearer ${idToken}`,
                },
              }
            );

            if (rejectionResponse.ok) {
              const rejectionData = (await rejectionResponse.json()) as {
                rejectionReason?: string;
              };

              if (active && rejectionData.rejectionReason) {
                setRejectionMessage(
                  rejectionData.rejectionReason
                );
              }
            }
          }
        }
      } catch (error) {
        console.error(
          "تعذر تحميل الطالب:",
          error
        );

        if (active) {
          setStudent(null);
        }
      } finally {
        if (active) {
          setLoadingStudent(false);
        }
      }
    }

    void loadStudent();

    return () => {
      active = false;
    };
  }, []);

  function analyzeImageQuality(
    image: HTMLImageElement
  ): ImageQualityResult {
    const MAX_ANALYSIS_SIDE =
      180;

    const scale =
      Math.min(
        1,
        MAX_ANALYSIS_SIDE /
          Math.max(
            image.naturalWidth,
            image.naturalHeight
          )
      );

    const width =
      Math.max(
        1,
        Math.round(
          image.naturalWidth *
            scale
        )
      );

    const height =
      Math.max(
        1,
        Math.round(
          image.naturalHeight *
            scale
        )
      );

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      width;

    canvas.height =
      height;

    const context =
      canvas.getContext(
        "2d",
        {
          willReadFrequently:
            true,
        }
      );

    if (!context) {
      return {
        status:
          "acceptable",
        score:
          70,
        passed:
          true,
        brightness:
          0,
        contrast:
          0,
        sharpness:
          0,
        notes: [
          "تعذر إجراء الفحص التفصيلي، ويمكن للمعلم مراجعة الصورة.",
        ],
      };
    }

    context.drawImage(
      image,
      0,
      0,
      width,
      height
    );

    const imageData =
      context.getImageData(
        0,
        0,
        width,
        height
      );

    const pixels =
      imageData.data;

    const grayscale =
      new Float32Array(
        width * height
      );

    let brightnessSum =
      0;

    for (
      let index = 0;
      index <
      grayscale.length;
      index += 1
    ) {
      const pixelIndex =
        index * 4;

      const red =
        pixels[
          pixelIndex
        ];

      const green =
        pixels[
          pixelIndex + 1
        ];

      const blue =
        pixels[
          pixelIndex + 2
        ];

      const gray =
        0.299 * red +
        0.587 * green +
        0.114 * blue;

      grayscale[index] =
        gray;

      brightnessSum +=
        gray;
    }

    const brightness =
      brightnessSum /
      grayscale.length;

    let varianceSum =
      0;

    for (
      let index = 0;
      index <
      grayscale.length;
      index += 1
    ) {
      const difference =
        grayscale[index] -
        brightness;

      varianceSum +=
        difference *
        difference;
    }

    const contrast =
      Math.sqrt(
        varianceSum /
          grayscale.length
      );

    let edgeSum =
      0;

    let edgeCount =
      0;

    for (
      let y = 0;
      y < height;
      y += 1
    ) {
      for (
        let x = 0;
        x < width;
        x += 1
      ) {
        const index =
          y * width + x;

        if (
          x <
          width - 1
        ) {
          edgeSum +=
            Math.abs(
              grayscale[
                index
              ] -
                grayscale[
                  index + 1
                ]
            );

          edgeCount +=
            1;
        }

        if (
          y <
          height - 1
        ) {
          edgeSum +=
            Math.abs(
              grayscale[
                index
              ] -
                grayscale[
                  index +
                    width
                ]
            );

          edgeCount +=
            1;
        }
      }
    }

    const sharpness =
      edgeCount > 0
        ? edgeSum /
          edgeCount
        : 0;

    const notes:
      string[] = [];

    let score =
      100;

    let criticalIssue =
      false;

    if (
      brightness < 48
    ) {
      notes.push(
        "الصورة مظلمة جدًا."
      );

      score -=
        35;

      criticalIssue =
        true;
    } else if (
      brightness < 72
    ) {
      notes.push(
        "الإضاءة منخفضة قليلًا."
      );

      score -=
        12;
    } else if (
      brightness > 232
    ) {
      notes.push(
        "الصورة شديدة السطوع وقد تضيع بعض الكتابة."
      );

      score -=
        30;

      criticalIssue =
        true;
    } else if (
      brightness > 214
    ) {
      notes.push(
        "الإضاءة قوية قليلًا."
      );

      score -=
        10;
    }

    if (
      contrast < 16
    ) {
      notes.push(
        "التباين ضعيف جدًا، وقد يصعب قراءة الكتابة."
      );

      score -=
        30;

      criticalIssue =
        true;
    } else if (
      contrast < 24
    ) {
      notes.push(
        "التباين منخفض قليلًا."
      );

      score -=
        10;
    }

    if (
      sharpness < 4.2
    ) {
      notes.push(
        "الصورة ضبابية بدرجة كبيرة."
      );

      score -=
        40;

      criticalIssue =
        true;
    } else if (
      sharpness < 7.5
    ) {
      notes.push(
        "حدة الصورة متوسطة؛ يفضّل تثبيت الكاميرا أكثر."
      );

      score -=
        14;
    }

    score =
      Math.max(
        0,
        Math.min(
          100,
          Math.round(
            score
          )
        )
      );

    let status:
      ImageQualityResult["status"];

    if (
      criticalIssue ||
      score < 55
    ) {
      status =
        "bad";
    } else if (
      score < 82 ||
      notes.length > 0
    ) {
      status =
        "acceptable";
    } else {
      status =
        "good";
    }

    if (
      notes.length ===
      0
    ) {
      notes.push(
        "الوضوح والإضاءة والتباين مناسبة."
      );
    }

    return {
      status,
      score,
      passed:
        status !==
        "bad",
      brightness:
        Math.round(
          brightness
        ),
      contrast:
        Math.round(
          contrast
        ),
      sharpness:
        Math.round(
          sharpness *
            10
        ) / 10,
      notes,
    };
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setMessage("");
    setImageQuality(null);

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setMessage(
        "❌ الملف المختار ليس صورة."
      );

      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "❌ حجم الصورة كبير جدًا. الحد الأعلى 10 ميجابايت."
      );

      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(
        previewUrl
      );
    }

    const nextPreviewUrl =
      URL.createObjectURL(file);

    const image =
      new Image();

    image.onload = () => {
      const width =
        image.naturalWidth;

      const height =
        image.naturalHeight;

      if (
        width < 600 ||
        height < 600
      ) {
        URL.revokeObjectURL(
          nextPreviewUrl
        );

        setSelectedFile(null);
        setPreviewUrl("");
        setImageWidth(0);
        setImageHeight(0);
        setImageQuality(null);

        setMessage(
          "❌ الصورة صغيرة جدًا. التقط صورة بدقة أعلى بحيث يظهر الدفتر بوضوح."
        );

        return;
      }

      const quality =
        analyzeImageQuality(
          image
        );

      setSelectedFile(file);
      setPreviewUrl(
        nextPreviewUrl
      );

      setImageWidth(width);
      setImageHeight(height);
      setImageQuality(
        quality
      );

      if (
        quality.status ===
        "good"
      ) {
        setMessage(
          "🟢 الصورة ممتازة وجاهزة للإرسال."
        );
      } else if (
        quality.status ===
        "acceptable"
      ) {
        setMessage(
          "🟡 الصورة مقبولة ويمكن إرسالها، مع وجود ملاحظة بسيطة."
        );
      } else {
        setMessage(
          "🔴 الصورة تحتاج إعادة تصوير قبل الإرسال."
        );
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(
        nextPreviewUrl
      );

      setMessage(
        "❌ تعذر قراءة الصورة."
      );
    };

    image.src =
      nextPreviewUrl;
  }

  async function uploadImageToCloudinary(
    file: File
  ) {
    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "upload_preset",
      "lughati_homework_upload"
    );

    const response =
      await fetch(
        "https://api.cloudinary.com/v1_1/ffv5igmg/image/upload",
        {
          method:
            "POST",
          body:
            formData,
        }
      );

    if (
      !response.ok
    ) {
      throw new Error(
        "تعذر رفع صورة الدفتر."
      );
    }

    const data =
      await response.json();

    return data.secure_url as string;
  }

  async function submitNomination() {
    if (
      !student
    ) {
      setMessage(
        "❌ تعذر التعرف على الطالب."
      );

      return;
    }

    if (
      !selectedFile
    ) {
      setMessage(
        "❌ اختر صورة الدفتر أولًا."
      );

      return;
    }

    if (
      imageQuality &&
      !imageQuality.passed
    ) {
      setMessage(
        "🔴 الصورة لم تجتز الفحص الأولي. أعد تصوير الدفتر بصورة أوضح ثم حاول مرة أخرى."
      );

      return;
    }

    let retryableFailure = true;

    try {
      setSubmitting(true);
      setAnalysisFailed(false);

      const currentUser =
        auth.currentUser;

      if (!currentUser) {
        throw new Error(
          "انتهت جلسة الطالب. سجّل الدخول مرة أخرى."
        );
      }

      setMessage(
        "☁️ جارٍ رفع صورة الدفتر..."
      );

      const imageUrl =
        await uploadImageToCloudinary(
          selectedFile
        );

      setMessage(
        "🔐 جارٍ التحقق من حساب الطالب..."
      );

      const idToken =
        await currentUser.getIdToken(
          true
        );

      setMessage(
        "🤖 جارٍ التحقق من أن الصورة صفحة دفتر ثم إرسالها للمعلم..."
      );

      const response =
        await fetch(
          "/api/notebook-analysis",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${idToken}`,
            },

            body:
              JSON.stringify({
                imageUrl,

                createNomination: false,

                note:
                  note.trim(),

                autoCheck: {
                  fileType:
                    selectedFile.type,

                  fileSize:
                    selectedFile.size,

                  width:
                    imageWidth,

                  height:
                    imageHeight,

                  passed:
                    imageQuality
                      ? imageQuality.passed
                      : true,

                  status:
                    imageQuality?.status ??
                    "acceptable",

                  score:
                    imageQuality?.score ??
                    70,

                  brightness:
                    imageQuality?.brightness ??
                    null,

                  contrast:
                    imageQuality?.contrast ??
                    null,

                  sharpness:
                    imageQuality?.sharpness ??
                    null,

                  notes:
                    imageQuality?.notes ??
                    [],
                },
              }),
          }
        );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        retryable?: boolean;
        message?: string;
        nominationId?: string;
        analysisToken?: string;
        analysis?: NotebookAnalysisResult;
      } = {};

      if (
        responseText
      ) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          throw new Error(
            "وصل رد غير متوقع من الخادم."
          );
        }
      }

      if (
        !response.ok ||
        data.success !== true
      ) {
        retryableFailure = data.retryable === true;
        throw new Error(
          data.message ||
            "تعذر إرسال الترشيح."
        );
      }

      setMessage(
        data.message ||
          "✅ تم إرسال دفترِك بنجاح وهو الآن بانتظار المراجعة. عند اعتماده تحصل على 5 نقاط وتُسجّل لك مرة تميز جديدة ✨"
      );
      setAnalysisResult(data.analysis || null);
      setAnalysisToken(data.analysisToken || "");
      setAnalyzedImageUrl(imageUrl);
      setNominationSent(false);
      setAnalysisFailed(false);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر إرسال الترشيح."
      );

      setAnalysisFailed(retryableFailure);
    } finally {
      setSubmitting(false);
    }
  }

  async function sendToNotebookGallery() {
    if (!student || !analysisToken || !analyzedImageUrl) {
      return;
    }

    try {
      setSubmitting(true);
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("انتهت جلسة الطالب. سجّل الدخول مرة أخرى.");
      }

      const idToken = await currentUser.getIdToken(true);
      const response = await fetch("/api/notebook-analysis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          imageUrl: analyzedImageUrl,
          note: note.trim(),
          analysisToken,
          createNomination: true,
        }),
      });
      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || data.success !== true) {
        throw new Error(data.message || "تعذر إرسال الصورة للمعلم.");
      }

      setNominationSent(true);
      setMessage(
        data.message || "تم إرسال الصورة للمعلم للمراجعة."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "تعذر إرسال الصورة للمعلم."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (
    loadingStudent
  ) {
    return (
      <main
        dir="rtl"
        style={pageStyle}
      >
        <div
          style={{
            textAlign:
              "center",
            padding:
              60,
            fontWeight:
              900,
          }}
        >
          جارٍ تجهيز صفحة جماليات الدفاتر... ✨
        </div>
      </main>
    );
  }

  if (
    !student
  ) {
    return (
      <main
        dir="rtl"
        style={pageStyle}
      >
        <div
          style={{
            maxWidth:
              560,
            margin:
              "60px auto",
            background:
              "#fff",
            padding:
              28,
            borderRadius:
              24,
            textAlign:
              "center",
            border:
              "1px solid #dcebe4",
          }}
        >
          <div
            style={{
              fontSize:
                50,
          }}
          >
            📒
          </div>

          <h2>
            سجّل دخولك أولًا
          </h2>

          <p
            style={{
              color:
                "#6b7d75",
          }}
          >
            يجب الدخول بحساب الطالب قبل ترشيح الدفتر.
          </p>

          <Link
            href="/journey"
            style={{
              color:
                "#168a63",
              fontWeight:
                900,
          }}
          >
            العودة إلى رحلتي
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      style={pageStyle}
    >
      <div
        style={{
          maxWidth:
            850,
          margin:
            "0 auto",
        }}
      >
        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
            gap:
              12,
            flexWrap:
              "wrap",
            marginBottom:
              18,
        }}
        >
          <Link
            href="/gallery"
            style={{
              textDecoration:
                "none",
              padding:
                "10px 14px",
              borderRadius:
                14,
              border:
                "1px solid #d5e7df",
              background:
                "#fff",
              color:
                "#176b4d",
              fontWeight:
                900,
            }}
          >
            ← العودة إلى جماليات الدفاتر
          </Link>

          <div
            style={{
              fontWeight:
                900,
              color:
                "#66796f",
          }}
          >
            {student.name}
            {student.classroom
              ? ` • ${student.classroom}`
              : ""}
          </div>
        </div>

        <section
          style={{
            padding:
              28,
            borderRadius:
              30,
            background:
              "linear-gradient(135deg,#936b12,#c39b39)",
            color:
              "#fff",
            boxShadow:
              "0 18px 44px rgba(147,107,18,.18)",
            textAlign:
              "center",
        }}
        >
          <div
            style={{
              fontSize:
                58,
          }}
          >
            📒✨
          </div>

          <h1
            style={{
              margin:
                "8px 0",
              fontSize:
                "clamp(28px,5vw,42px)",
          }}
          >
            رشّح دفتري
          </h1>

          <p
            style={{
              margin:
                0,
              lineHeight:
                1.9,
              fontWeight:
                700,
          }}
          >
            التقط صورة واضحة لأجمل صفحة في دفترك،
            ثم أرسلها للتميز.
          </p>
        </section>

        <section
          style={{
            marginTop:
              20,
            padding:
              24,
            borderRadius:
              26,
            background:
              "#fff",
            border:
              "1px solid #ead7a3",
        }}
        >
          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(160px,1fr))",
              gap:
                12,
              marginBottom:
                22,
          }}
          >
            {[
              [
                "✍️",
                "خط جميل",
              ],
              [
                "🎨",
                "تنسيق مميز",
              ],
              [
                "📒",
                "عناية بالدفتر",
              ],
              [
                "🌱",
                "تطور ملحوظ",
              ],
            ].map(
              ([
                icon,
                label,
              ]) => (
                <div
                  key={
                    label
                  }
                  style={{
                    padding:
                      16,
                    borderRadius:
                      16,
                    background:
                      "#fffaf0",
                    border:
                      "1px solid #ead7a3",
                    textAlign:
                      "center",
                    fontWeight:
                      900,
                  }}
                >
                  <div
                    style={{
                      fontSize:
                        28,
                  }}
                  >
                    {icon}
                  </div>

                  <div
                    style={{
                      marginTop:
                        7,
                  }}
                  >
                    {label}
                  </div>
                </div>
              )
            )}
          </div>

          <div
            style={{
              padding:
                16,
              borderRadius:
                16,
              background:
                "#fff8df",
              border:
                "1px solid #ead274",
              color:
                "#80651a",
              fontWeight:
                800,
              lineHeight:
                1.8,
              marginBottom:
                20,
          }}
          >
            ⭐ كل دفتر يتم اعتماده يمنحك
            <strong>
              {" "}5 نقاط
            </strong>
            ، ويُضاف إلى عدد مرات تميزك في جماليات الدفاتر.
          </div>

          <label
            style={{
              fontWeight:
                900,
          }}
          >
            📸 صورة الدفتر
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={
              handleFileChange
            }
            style={{
              width:
                "100%",
              boxSizing:
                "border-box",
              marginTop:
                8,
              padding:
                14,
              borderRadius:
                14,
              border:
                "1px solid #d8e6df",
              background:
                "#fbfdfc",
          }}
          />

          {previewUrl && (
            <div
              style={{
                marginTop:
                  18,
                padding:
                  12,
                borderRadius:
                  18,
                background:
                  "#f8faf9",
                border:
                  "1px solid #e2e9e5",
              }}
            >
              <img
                src={
                  previewUrl
                }
                alt="معاينة الدفتر"
                style={{
                  width:
                    "100%",
                  maxHeight:
                    430,
                  objectFit:
                    "contain",
                  borderRadius:
                    14,
                  background:
                    "#fff",
                }}
              />
            </div>
          )}

          {imageQuality && (
            <div
              style={{
                marginTop:
                  14,
                padding:
                  16,
                borderRadius:
                  16,
                background:
                  imageQuality.status ===
                  "good"
                    ? "#effaf4"
                    : imageQuality.status ===
                        "acceptable"
                      ? "#fff8df"
                      : "#fff1f1",
                border:
                  imageQuality.status ===
                  "good"
                    ? "1px solid #bfe5cf"
                    : imageQuality.status ===
                        "acceptable"
                      ? "1px solid #ead274"
                      : "1px solid #f0b7b7",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  gap:
                    12,
                  flexWrap:
                    "wrap",
                  alignItems:
                    "center",
                }}
              >
                <strong
                  style={{
                    fontSize:
                      17,
                    color:
                      imageQuality.status ===
                      "good"
                        ? "#168a5c"
                        : imageQuality.status ===
                            "acceptable"
                          ? "#8a6500"
                          : "#b42318",
                  }}
                >
                  {imageQuality.status ===
                  "good"
                    ? "🟢 جودة الصورة ممتازة"
                    : imageQuality.status ===
                        "acceptable"
                      ? "🟡 جودة الصورة مقبولة"
                      : "🔴 تحتاج إعادة تصوير"}
                </strong>

                <span
                  style={{
                    padding:
                      "6px 10px",
                    borderRadius:
                      999,
                    background:
                      "#fff",
                    fontWeight:
                      900,
                    color:
                      "#52665d",
                    fontSize:
                      13,
                  }}
                >
                  التقييم:{" "}
                  {imageQuality.score}/100
                </span>
              </div>

              <div
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(120px,1fr))",
                  gap:
                    8,
                  marginTop:
                    12,
                }}
              >
                <div
                  style={qualityMetricStyle}
                >
                  ☀️ الإضاءة
                  <strong>
                    {imageQuality.brightness}
                  </strong>
                </div>

                <div
                  style={qualityMetricStyle}
                >
                  ◐ التباين
                  <strong>
                    {imageQuality.contrast}
                  </strong>
                </div>

                <div
                  style={qualityMetricStyle}
                >
                  🔍 الحدة
                  <strong>
                    {imageQuality.sharpness}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  marginTop:
                    12,
                  color:
                    "#5f746b",
                  lineHeight:
                    1.8,
                  fontWeight:
                    700,
                }}
              >
                {imageQuality.notes.map(
                  (
                    noteText,
                    index
                  ) => (
                    <div
                      key={`${noteText}-${index}`}
                    >
                      • {noteText}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          <label
            style={{
              display:
                "block",
              marginTop:
                18,
              fontWeight:
                900,
          }}
          >
            ✍️ ملاحظة قصيرة
          </label>

          <textarea
            value={note}
            onChange={(
              event
            ) =>
              setNote(
                event.target.value
              )
            }
            maxLength={180}
            rows={4}
            placeholder="مثال: تدربت هذا الأسبوع على تحسين خطي وترتيب دفتري."
            style={{
              width:
                "100%",
              boxSizing:
                "border-box",
              marginTop:
                8,
              padding:
                14,
              borderRadius:
                14,
              border:
                "1px solid #d8e6df",
              resize:
                "vertical",
              fontFamily:
                "inherit",
              fontSize:
                16,
          }}
          />

          {analysisResult && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 16,
                background: "#f1f8ff",
                border: "1px solid #cfe3f5",
                color: "#24516f",
                lineHeight: 1.8,
              }}
            >
              <strong>نتيجة تحليل كتابتي</strong>
              <div>
                التصنيف المقترح: {getCategoryLabel(analysisResult.suggestedCategory)}
              </div>
              {analysisResult.strengths.length > 0 && (
                <div>نقاط القوة: {analysisResult.strengths.join("، ")}</div>
              )}
              {analysisResult.improvementNote && (
                <div>ملاحظة التطوير: {analysisResult.improvementNote}</div>
              )}
              <div>
                درجة الثقة: {Math.round(analysisResult.confidence * 100)}%
              </div>
            </div>
          )}

          {message && (
            <div
              style={{
                marginTop:
                  16,
                padding:
                  14,
                borderRadius:
                  14,
                background:
                  "#f4fbf8",
                color:
                  "#356d5a",
                fontWeight:
                  800,
                lineHeight:
                  1.8,
            }}
            >
              {message}
            </div>
          )}

          {rejectionMessage && (
            <div
              style={{
                marginTop: 12,
                padding: 14,
                borderRadius: 14,
                background: "#fff8e8",
                border: "1px solid #ecd99b",
                color: "#775b12",
                fontWeight: 800,
                lineHeight: 1.8,
              }}
            >
              ملاحظة المعلم: {rejectionMessage}
            </div>
          )}

          {analysisFailed && selectedFile && (
            <button
              type="button"
              onClick={submitNomination}
              disabled={submitting}
              style={{
                width: "100%",
                marginTop: 10,
                padding: "12px 16px",
                borderRadius: 14,
                border: "1px solid #d5e7df",
                background: "#fff",
                color: "#176b4d",
                fontWeight: 900,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              🔄 إعادة محاولة التحليل
            </button>
          )}

          {analysisResult && analysisToken && !nominationSent && (
            <button
              type="button"
              onClick={sendToNotebookGallery}
              disabled={submitting}
              style={{
                width: "100%",
                marginTop: 12,
                padding: "14px 16px",
                border: "1px solid #168a63",
                borderRadius: 15,
                background: "#eaf8f2",
                color: "#126b4d",
                fontWeight: 900,
                fontSize: 16,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              📒 إرسال إلى جماليات الدفاتر للمعلم
            </button>
          )}

          <button
            type="button"
            onClick={
              submitNomination
            }
            disabled={
              submitting ||
              !selectedFile ||
              imageQuality?.passed ===
                false
            }
            style={{
              width:
                "100%",
              marginTop:
                20,
              border:
                "none",
              borderRadius:
                17,
              padding:
                "15px 18px",
              background:
                submitting ||
                !selectedFile ||
                imageQuality?.passed ===
                  false
                  ? "#bfc9c4"
                  : "linear-gradient(135deg,#168a63,#0f7654)",
              color:
                "#fff",
              fontSize:
                18,
              fontWeight:
                900,
              cursor:
                submitting ||
                !selectedFile ||
                imageQuality?.passed ===
                  false
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {submitting
              ? "جارٍ تحليل الصفحة..."
              : "✍️ حلّل كتابتي"}
          </button>
        </section>
      </div>
    </main>
  );
}

const qualityMetricStyle:
  React.CSSProperties = {
    display:
      "flex",
    justifyContent:
      "space-between",
    alignItems:
      "center",
    gap:
      8,
    padding:
      "9px 10px",
    borderRadius:
      12,
    background:
      "rgba(255,255,255,.72)",
    border:
      "1px solid rgba(0,0,0,.06)",
    color:
      "#5f746b",
    fontSize:
      13,
    fontWeight:
      800,
  };

const pageStyle:
  React.CSSProperties = {
    minHeight:
      "100vh",

    padding:
      "28px 16px 60px",

    background:
      "linear-gradient(180deg,#fffdf7,#f3fbf7,#fffaf0)",

    fontFamily:
      '"Tajawal","Arial","Tahoma",sans-serif',

    color:
      "#174c3b",
  };