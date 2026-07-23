"use client";

export default function ParentPage() {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#f5f8ff",
        padding: "24px 16px 100px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "760px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "22px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
            marginBottom: "18px",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              color: "#64748b",
              fontSize: "15px",
            }}
          >
            أكاديمية لغتي الرقمية
          </p>

          <h1
            style={{
              margin: 0,
              color: "#173b57",
              fontSize: "28px",
            }}
          >
            ❤️ رحلة ابني
          </h1>

          <p
            style={{
              margin: "10px 0 0",
              color: "#475569",
              lineHeight: 1.8,
            }}
          >
            متابعة بسيطة وواضحة لتقدم ابنكم دون أعباء إضافية.
          </p>
        </header>

        <section
          style={{
            background: "white",
            borderRadius: "24px",
            padding: "22px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                width: "76px",
                height: "76px",
                borderRadius: "22px",
                background: "#e5f7ea",
                display: "grid",
                placeItems: "center",
                fontSize: "38px",
              }}
            >
              👦
            </div>

            <div style={{ flex: 1, minWidth: "190px" }}>
              <p
                style={{
                  margin: 0,
                  color: "#64748b",
                  fontSize: "14px",
                }}
              >
                الطالب
              </p>

              <h2
                style={{
                  margin: "4px 0",
                  color: "#173b57",
                  fontSize: "24px",
                }}
              >
                أحمد محمد
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#475569",
                }}
              >
                الصف الثاني الابتدائي
              </p>
            </div>

            <button
              type="button"
              style={{
                border: "none",
                borderRadius: "16px",
                background: "#1f7a4d",
                color: "white",
                padding: "13px 18px",
                fontSize: "15px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              👀 عرض كما يراه ابني
            </button>
          </div>

          <div style={{ marginTop: "22px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                marginBottom: "9px",
              }}
            >
              <span style={{ color: "#173b57", fontWeight: "bold" }}>
                إنجاز اليوم
              </span>

              <span style={{ color: "#1f7a4d", fontWeight: "bold" }}>
                4 من 5 مهام
              </span>
            </div>

            <div
              style={{
                height: "12px",
                background: "#e2e8f0",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: "80%",
                  height: "100%",
                  background: "#1f7a4d",
                  borderRadius: "999px",
                }}
              />
            </div>

            <p
              style={{
                margin: "12px 0 0",
                color: "#475569",
                lineHeight: 1.7,
              }}
            >
              أحسن ابنكم اليوم، وقد بقيت له مهمة واحدة فقط لإكمال رحلته
              اليومية. 🌟
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}