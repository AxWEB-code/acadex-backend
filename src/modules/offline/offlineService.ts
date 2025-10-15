import { PrismaClient as OfflineClient } from "../../../prisma/offline-client";
const offlineDB = new OfflineClient();

/**
 * Create local exam
 */
export const createOfflineExam = async (examData: any) => {
  const exam = await offlineDB.exam.create({ data: examData });
  return exam;
};

/**
 * Save result locally
 */
export const saveOfflineResult = async (data: any) => {
  const result = await offlineDB.result.create({ data });
  return result;
};

/**
 * Get all unsynced results
 */
export const getUnsyncedResults = async () => {
  return await offlineDB.result.findMany({ where: { synced: false } });
};

/**
 * Mark results as synced
 */
export const markResultsAsSynced = async (ids: string[]) => {
  await offlineDB.result.updateMany({
    where: { id: { in: ids } },
    data: { synced: true }
  });
};
