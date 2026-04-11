import * as XLSX from "xlsx";

function maybeSkipHeader(lines: string[]): string[] {
  if (lines.length === 0) return lines;
  const first = lines[0].toLowerCase();
  if (
    first === "question" ||
    first === "questions" ||
    first === "interview question" ||
    first === "interview questions"
  ) {
    return lines.slice(1);
  }
  return lines;
}

function normalizeQuestionLines(lines: string[]): string[] {
  return maybeSkipHeader(lines.map((l) => l.trim()).filter(Boolean));
}

/**
 * Reads interview questions from CSV/TXT (one per line) or Excel (first sheet, column A).
 */
export async function extractQuestionsFromFile(file: File): Promise<string[]> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).map((l) => l.trim());
    return normalizeQuestionLines(lines);
  }

  if (
    name.endsWith(".xlsx") ||
    name.endsWith(".xls") ||
    name.endsWith(".xlsm")
  ) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    if (!wb.SheetNames.length) return [];
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
      sheet,
      { header: 1, defval: "", raw: false }
    ) as unknown[][];
    const colA: string[] = [];
    for (const row of data) {
      if (!Array.isArray(row) || row.length === 0) continue;
      const v = row[0];
      const s =
        v == null || v === ""
          ? ""
          : typeof v === "string"
            ? v.trim()
            : String(v).trim();
      if (s) colA.push(s);
    }
    return normalizeQuestionLines(colA);
  }

  throw new Error("Unsupported format. Use .csv, .txt, .xlsx, or .xls");
}
