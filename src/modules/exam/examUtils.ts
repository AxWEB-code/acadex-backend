export const generateExamCode = (isResit: boolean = false): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(1000 + Math.random() * 9000);
  let code = `EXM-${year}-${random}`;
  if (isResit) code += `-R1`;
  return code;
};

export const validateExamData = (data: any): string[] => {
  const errors: string[] = [];
  
  if (!data.examTitle) errors.push("Exam title is required");
  if (!data.startDate) errors.push("Start date is required");
  if (!data.endDate) errors.push("End date is required");
  if (!data.duration) errors.push("Duration is required");
  if (!data.schoolId) errors.push("School ID is required");
  
  return errors;
};