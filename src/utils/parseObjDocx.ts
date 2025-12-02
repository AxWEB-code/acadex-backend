// src/utils/parseObjDocx.ts
import type { Buffer } from "buffer";

export type ParsedObjectiveQuestion = {
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correct: "A" | "B" | "C" | "D" | "E" | "";
};

export type ParsedObjResult = {
  questions: ParsedObjectiveQuestion[];
  warnings: string[];
};

export function parseObjPlainText(text: string): ParsedObjResult {
  // Normalise line endings & trim
  const lines = text
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== ""); // support both with/without blank lines

  const questions: ParsedObjectiveQuestion[] = [];
  const warnings: string[] = [];

  let currentText = "";
  let options: Record<string, string> = {};
  let currentAnswer: string | "" = "";
  let rawIndex = 0;

  const optionRegex = /^[\(\[]?([A-Ea-e])[\)\.\:\-]\s*(.+)$/; // A.  A)  (A) etc
  const answerRegex = /^ans(?:wer)?\s*[:=\-]\s*([A-Ea-e])/i;  // ANSWER: B  Ans - c
  const qNumberRegex = /^(?:Q\s*)?(\d{1,3})[\)\.\:\-]\s*(.+)$/i; // 1.  Q1) etc

  const flushQuestion = (reason: string | null = null) => {
    if (!currentText && Object.keys(options).length === 0 && !currentAnswer) {
      // Nothing to flush
      return;
    }

    const qNumber = questions.length + 1;

    const optionA = options["A"] || "";
    const optionB = options["B"] || "";
    const optionC = options["C"] || "";
    const optionD = options["D"] || "";
    const optionE = options["E"] || "";

    let correct: ParsedObjectiveQuestion["correct"] = "" as any;

    if (currentAnswer) {
      const up = currentAnswer.toUpperCase();
      if (["A", "B", "C", "D", "E"].includes(up)) {
        correct = up as ParsedObjectiveQuestion["correct"];
        if (!options[up]) {
          warnings.push(
            `Q${qNumber}: ANSWER is "${up}" but there is no option ${up}.`
          );
        }
      } else {
        warnings.push(
          `Q${qNumber}: ANSWER "${currentAnswer}" is not A–E. Leaving correct blank.`
        );
      }
    } else {
      warnings.push(`Q${qNumber}: No ANSWER line found. Correct option left blank.`);
    }

    if (!optionA && !optionB && !optionC && !optionD && !optionE) {
      warnings.push(
        `Q${qNumber}: No options detected. Check the formatting of this question.`
      );
    }

    questions.push({
      text: currentText.trim(),
      optionA,
      optionB,
      optionC,
      optionD,
      optionE,
      correct,
    });

    if (reason) {
      warnings.push(`Q${qNumber}: Parsed with note: ${reason}`);
    }

    // Reset for next question
    currentText = "";
    options = {};
    currentAnswer = "";
  };

  for (const line of lines) {
    rawIndex++;

    // ANSWER line
    const ansMatch = line.match(answerRegex);
    if (ansMatch) {
      currentAnswer = ansMatch[1].toUpperCase();
      // We don't flush yet; we wait until we see next question or end
      continue;
    }

    // Option line
    const optMatch = line.match(optionRegex);
    if (optMatch) {
      const letter = optMatch[1].toUpperCase();
      const value = optMatch[2].trim();
      if (!["A", "B", "C", "D", "E"].includes(letter)) {
        warnings.push(
          `Line ${rawIndex}: Option "${letter}" is not A–E. Ignored.`
        );
      } else {
        options[letter] = value;
      }
      continue;
    }

    // Possible "next question" line
    const qMatch = line.match(qNumberRegex);

    if (qMatch) {
      // If we already have a question in progress, flush it first
      if (currentText || Object.keys(options).length || currentAnswer) {
        flushQuestion("Detected start of next numbered question.");
      }
      // Start new question, ignoring the given number (we auto-number later)
      currentText = qMatch[2].trim();
      continue;
    }

    // Any other text line:
    // - If we already have question text, append with space.
    // - If no question started yet, start text with this line.
    if (!currentText) {
      currentText = line;
    } else {
      currentText += " " + line;
    }
  }

  // Flush last question if any
  flushQuestion(null);

  if (!questions.length) {
    warnings.push(
      "No questions were detected. Check if the file has clear questions, options (A–D/E), and ANSWER: lines."
    );
  }

  return { questions, warnings };
}
