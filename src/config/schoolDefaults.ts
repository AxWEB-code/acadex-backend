export const defaultSettings = {
  exam_mode: "CBT",
  result_visibility: true,
  grading_system: {
    HIGH_SCHOOL: ["A", "B", "C", "D", "E", "F"],
    TERTIARY: ["A", "B", "C", "F"],
  },
  theme_color: "#FF6600",
};

export const defaultPermissions = {
  mainAdmin: [
    "approve_notifications",
    "manage_admins",
    "view_logs",
    "edit_results",
  ],
  examAdmin: ["create_exam", "edit_exam", "request_exam_approval"],
  resultAdmin: ["input_results", "edit_results", "view_results"],
  admissionAdmin: [
    "approve_students",
    "deactivate_students",
    "review_requests",
  ],
  student: ["take_exam", "view_results", "update_profile"],
};

export const adminRoles = (subdomain: string) => ({
  mainAdmin: { email: `admin@${subdomain}.acadx.com`, status: "active" },
  examAdmin: { email: `exam@${subdomain}.acadx.com`, status: "active" },
  resultAdmin: { email: `result@${subdomain}.acadx.com`, status: "active" },
  admissionAdmin: {
    email: `admission@${subdomain}.acadx.com`,
    status: "active",
  },
});
