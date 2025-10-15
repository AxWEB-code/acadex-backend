// In a real setup, these will connect to APIs or the main DB

export const handleUpload = async (data: any) => {
  // Example: mark all results as synced
  console.log("Received data from offline device:", data);
  // TODO: Push to main DB
  return { syncedCount: data?.results?.length || 0 };
};

export const handleDownload = async () => {
  // TODO: Fetch fresh exams or student list from server
  const mockData = {
    exams: [{ id: "1", title: "Math Test", code: "MTH101" }],
    students: [{ id: "s1", name: "Jane Doe", matricNo: "STU001" }],
  };
  return mockData;
};
