// src/controllers/objImport.controller.ts
import { Request, Response } from "express";
import fs from "fs";
import mammoth from "mammoth";

export async function parseObjectiveFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    let rawText = "";

    // 1) Read DOCX or TXT
    if (req.file.originalname.toLowerCase().endsWith(".docx")) {
      const result = await mammoth.extractRawText({ path: filePath });
      rawText = result.value || "";
    } else {
      rawText = fs.readFileSync(filePath, "utf8");
    }

    // Normalize newlines
    rawText = rawText.replace(/\r/g, "");

    // Split into lines
    const lines = rawText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const questions: any[] = [];
    const warnings: string[] = [];

    // Helpers
    const optionRegex = /^([A-E])[\).\s-]+(.*)$/i;  // A. text  |  A) text  |  A - text
    const answerRegex = /^answer\s*[:\-]?\s*([A-E])/i;

    function isOptionLine(line: string): boolean {
      return optionRegex.test(line);
    }

    function isAnswerLine(line: string): boolean {
      return answerRegex.test(line);
    }

    // "Looks like question" = not option/answer, and has an option nearby
    function looksLikeQuestion(idx: number): boolean {
      const line = lines[idx];
      if (!line) return false;
      if (isOptionLine(line) || isAnswerLine(line)) return false;

      // Look ahead a few lines for A/B/C...
      for (let k = idx + 1; k <= idx + 6 && k < lines.length; k++) {
        if (isOptionLine(lines[k])) return true;
      }
      return false;
    }

    let i = 0;
    let qId = 1;

    while (i < lines.length) {
      const line = lines[i];

      if (!looksLikeQuestion(i)) {
        i++;
        continue;
      }

      // 1) BUILD QUESTION TEXT (can be multi-line)
      let questionText = line;
      i++;

      while (i < lines.length) {
        const l2 = lines[i];

        if (!l2) {
          i++;
          continue;
        }
        if (isOptionLine(l2) || isAnswerLine(l2)) break;
        if (looksLikeQuestion(i)) break; // next question

        // treat as continuation of the question stem
        questionText += " " + l2;
        i++;
      }

      // 2) READ OPTIONS + ANSWER
      const opts: Record<string, string> = {
        A: "",
        B: "",
        C: "",
        D: "",
        E: "",
      };
      let correct = "";

      while (i < lines.length) {
        const l3 = lines[i];

        if (!l3) {
          i++;
          continue;
        }

        const optMatch = optionRegex.exec(l3);
        const ansMatch = answerRegex.exec(l3);

        if (optMatch) {
          const letter = optMatch[1].toUpperCase();
          const text = (optMatch[2] || "").trim();
          if (["A", "B", "C", "D", "E"].includes(letter)) {
            opts[letter] = text;
          }
          i++;
          continue;
        }

        if (ansMatch) {
          const letter = ansMatch[1].toUpperCase();
          if (["A", "B", "C", "D", "E"].includes(letter)) {
            correct = letter;
          } else {
            warnings.push(`Invalid answer format: "${l3}"`);
          }
          i++;
          continue;
        }

        // neither option nor answer -> probably next question
        break;
      }

      const hasAnyOption = Object.values(opts).some(
        (v) => v && v.trim().length > 0
      );

      if (!hasAnyOption) {
        warnings.push(
          `Skipped a block that looked like a question but had no options: "${questionText.slice(
            0,
            50
          )}..."`
        );
        continue;
      }

      questions.push({
        id: qId++,
        text: questionText,
        optionA: opts.A,
        optionB: opts.B,
        optionC: opts.C,
        optionD: opts.D,
        optionE: opts.E,
        correct, // can be "" if you want to set it manually in UI
      });
    }

    // Cleanup temp file (optional but nice)
    fs.unlink(filePath, () => {});

    return res.json({ questions, warnings });
  } catch (err: any) {
    console.error("OBJ parse error:", err);
    return res.status(500).json({
      error: "Failed to parse OBJ file",
      details: err.message,
    });
  }
}



