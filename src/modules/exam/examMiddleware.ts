// src/modules/exam/exam.middleware.js
exports.verifyExamAccess = async (req, res, next) => {
  const { examCode } = req.params;
  if (!examCode) return res.status(400).json({ error: "Exam code required" });
  next();
};
