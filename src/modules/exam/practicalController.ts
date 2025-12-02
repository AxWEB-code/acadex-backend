import { Request, Response } from "express";
import prisma from "../../prisma";

export const addPracticalItem = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const { itemText, maxScore } = req.body;

    if (!itemText) {
      return res.status(400).json({
        success: false,
        error: "Checklist item text is required"
      });
    }

    const item = await prisma.practicalChecklist.create({
      data: {
        paperId,
        itemText,
        maxScore: maxScore || 1
      }
    });

    res.json({ success: true, data: item });
  } catch (err: any) {
    console.error("❌ Add practical checklist error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};


export const addBulkPracticalItems = async (req: Request, res: Response) => {
  try {
    const { paperId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Checklist items array is required"
      });
    }

    const formatted = items.map((i: any) => ({
      paperId,
      itemText: i.itemText,
      maxScore: i.maxScore || 1
    }));

    const saved = await prisma.practicalChecklist.createMany({
      data: formatted
    });

    res.json({
      success: true,
      message: `Saved ${saved.count} practical checklist items`,
      count: saved.count
    });
  } catch (err: any) {
    console.error("❌ Bulk practical upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
