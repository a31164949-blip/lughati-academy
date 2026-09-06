type AcademyLogoProps = {
  size?: number;
  showDate?: boolean;
  showName?: boolean;
};

export default function AcademyLogo({
  size = 110,
  showDate = false,
  showName = false,
}: AcademyLogoProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: `${size}px`,
          height: `${size}px`,
          flexShrink: 0,
          padding: "5px",
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          boxSizing: "border-box",
          background:
            "linear-gradient(145deg, #16a34a 0%, #22c55e 48%, #facc15 100%)",
          boxShadow:
            "0 14px 30px rgba(15,118,72,.20), 0 0 0 5px rgba(255,255,255,.78)",
        }}
      >
        <img
          src="/الشعار.jpeg"
          alt="شعار أكاديمية لغتي الرقمية"
          width={size}
          height={size}
          loading="eager"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            objectFit: "cover",
            borderRadius: "50%",
            background: "#ffffff",
            border: "3px solid rgba(255,255,255,.96)",
            boxSizing: "border-box",
          }}
        />
      </div>

      {(showName || showDate) && (
        <div>
          {showName && (
            <strong
              style={{
                display: "block",
                color: "#145c42",
                fontSize: "18px",
                fontWeight: 900,
                lineHeight: 1.5,
              }}
            >
              أكاديمية لغتي الرقمية
            </strong>
          )}

          {showDate && (
            <div
              aria-label="تاريخ تأسيس أكاديمية لغتي الرقمية 1 نوفمبر 2020"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "6px",
                padding: "3px 9px",
                borderRadius: "999px",
                direction: "ltr",
                background: "rgba(22,163,74,.045)",
                border: "1px solid rgba(234,179,8,.16)",
                color: "rgba(21,128,84,.40)",
                fontSize: "11px",
                fontWeight: 900,
                letterSpacing: ".7px",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  color: "rgba(234,179,8,.42)",
                }}
              >
                ✦
              </span>

              1 / 11 / 2020
            </div>
          )}
        </div>
      )}
    </div>
  );
}