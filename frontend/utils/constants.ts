


const Constants = {
  CLASS_OPTIONS: [
    { value: "TUMOR", label: "Tumor", color: "#dc2626" },
    { value: "EDEMA", label: "Edema", color: "#2563eb" },
    { value: "NECROSIS", label: "Necrosis", color: "#7c3aed" },
    { value: "other", label: "Other", color: "#059669" },
  ],

  ZOOM_MIN: 1,
  ZOOM_MAX: 4,
  ZOOM_STEP: 0.25,
  CLOSE_THRESHOLD: 3,
  WHEEL_NAV_COOLDOWN_MS: 350,
} as const;

export default Constants;