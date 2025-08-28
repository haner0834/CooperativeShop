// scripts/csv-to-json.ts
import * as fs from "fs";
import * as path from "path";
import csv from "csv-parser";

interface StudentIdFormat {
  length: number | null;
  prefix: string;
  suffix: string;
  regex: string | null;
}

interface School {
  name: string;
  abbreviation: string;
  emailFormat: string;
  studentIdFormat: StudentIdFormat | null;
}

async function csvToJson(
  csvFilePath: string,
  outputFilePath: string
): Promise<void> {
  const schools: School[] = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        const emailFormat = row.emailFormat?.trim() || "";

        const studentIdFormat =
          row.studentIdFormat === "rq" && emailFormat === ""
            ? {
                length: null,
                prefix: "",
                suffix: "",
                regex: null,
              }
            : null;

        schools.push({
          name: row.name?.trim() || "",
          abbreviation: row.abbreviation?.trim() || "",
          emailFormat,
          studentIdFormat,
        });
      })
      .on("end", () => {
        fs.mkdirSync(path.dirname(outputFilePath), { recursive: true });
        fs.writeFileSync(
          outputFilePath,
          JSON.stringify(schools, null, 2),
          "utf8"
        );
        console.log(`✅ JSON file written to ${outputFilePath}`);
        resolve();
      })
      .on("error", (err) => reject(err));
  });
}

// 執行
const inputCsv = path.resolve(__dirname, "../shared/csvs/schools.csv");
const outputJson = path.resolve(__dirname, "../shared/jsons/schools.json");

csvToJson(inputCsv, outputJson).catch((err) => {
  console.error("❌ Error:", err);
});
