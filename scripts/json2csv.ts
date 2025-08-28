import { createObjectCsvStringifier } from "csv-writer";
import * as fs from "fs";
import path from "node:path";

const JSON_DIR = path.resolve(__dirname, "../shared/jsons/schools.json");
const CSV_DIR = path.resolve(__dirname, "../shared/csvs/schools.csv");

interface School {
  name: string;
  abbreviation: string;
}

async function jsonToCsv(
  jsonFilePath: string,
  csvFilePath: string
): Promise<void> {
  try {
    const jsonContent = fs.readFileSync(jsonFilePath, "utf8");
    const schools: School[] = JSON.parse(jsonContent);

    if (schools.length === 0) {
      console.log("JSON file is empty.");
      return;
    }

    const stringifier = createObjectCsvStringifier({
      header: [
        { id: "name", title: "name" },
        { id: "abbreviation", title: "abbreviation" },
      ],
    });

    const dir = path.dirname(csvFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const csvContent =
      stringifier.getHeaderString() + stringifier.stringifyRecords(schools);

    const fileExists = fs.existsSync(csvFilePath);
    fs.writeFileSync(csvFilePath, csvContent, "utf8");

    if (fileExists) {
      console.log(`Updated existing file: '${csvFilePath}'`);
    } else {
      console.log(`Created new file: '${csvFilePath}'`);
    }
  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
  }
}

// Example usage
jsonToCsv(JSON_DIR, CSV_DIR);
