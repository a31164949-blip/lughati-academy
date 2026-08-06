import type { CSSProperties } from "react";

export const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px",
    background:
      "linear-gradient(180deg, #f4fbf8 0%, #eef5ff 100%)",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "1100px",
    margin: "0 auto",
  },

  hero: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    padding: "24px",
    marginBottom: "20px",
    borderRadius: "24px",
    background: "#ffffff",
    border: "1px solid #d5e8df",
    boxShadow: "0 12px 35px rgba(22, 101, 52, 0.08)",
  },

  heroIcon: {
    display: "grid",
    placeItems: "center",
    width: "76px",
    height: "76px",
    flexShrink: 0,
    borderRadius: "20px",
    background: "#e8f8ef",
    fontSize: "38px",
  },

  label: {
    margin: 0,
    color: "#15835f",
    fontWeight: 800,
  },

  title: {
    margin: "7px 0",
    color: "#173f34",
    fontSize: "34px",
  },

  subtitle: {
    margin: 0,
    color: "#60736d",
    lineHeight: 1.8,
  },

  card: {
    padding: "22px",
    marginBottom: "22px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #dce9e4",
  },

  sectionTitle: {
    margin: "0 0 16px",
    color: "#173f34",
    fontSize: "24px",
  },

  field: {
    display: "grid",
    gap: "8px",
    marginBottom: "17px",
  },

  fieldLabel: {
    color: "#294f44",
    fontWeight: 800,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid #cbded6",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#173f34",
    fontSize: "16px",
  },

  textarea: {
    width: "100%",
    minHeight: "95px",
    boxSizing: "border-box",
    padding: "13px 14px",
    resize: "vertical",
    border: "1px solid #cbded6",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#173f34",
    fontSize: "16px",
    lineHeight: 1.7,
  },

  questionsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "14px",
    flexWrap: "wrap",
    marginBottom: "14px",
  },

  helperText: {
    margin: 0,
    color: "#64748b",
  },

  addButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "13px",
    background: "#16835f",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  questionCard: {
    padding: "22px",
    marginBottom: "18px",
    borderRadius: "22px",
    background: "#ffffff",
    border: "1px solid #dce9e4",
    boxShadow: "0 8px 25px rgba(30, 80, 65, 0.06)",
  },

  questionTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    marginBottom: "16px",
  },

  questionTitle: {
    margin: 0,
    color: "#173f34",
    fontSize: "21px",
  },

  deleteButton: {
    padding: "8px 12px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fff7f7",
    color: "#b91c1c",
    fontWeight: 800,
    cursor: "pointer",
  },

  optionsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "12px",
  },

  optionBox: {
    display: "grid",
    gap: "10px",
    padding: "13px",
    border: "1px solid #dbe5e1",
    borderRadius: "14px",
    background: "#f8faf9",
  },

  correctOption: {
    border: "2px solid #22a06b",
    background: "#ecfdf5",
  },

  optionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#315b4f",
    fontWeight: 800,
  },

  optionInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #cadbd4",
    borderRadius: "10px",
    background: "#ffffff",
    fontSize: "15px",
  },

  message: {
    padding: "14px",
    marginBottom: "18px",
    borderRadius: "13px",
    background: "#eef7f3",
    color: "#166534",
    fontWeight: 800,
    textAlign: "center",
  },

  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    flexWrap: "wrap",
  },

  draftButton: {
    padding: "13px 20px",
    border: "1px solid #16835f",
    borderRadius: "13px",
    background: "#ffffff",
    color: "#166534",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },

  publishButton: {
    padding: "13px 20px",
    border: "none",
    borderRadius: "13px",
    background: "#16a34a",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: 800,
    cursor: "pointer",
  },
};