import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const dir = "C:/Users/Notandi/forritun/icelandic-weather/outputs/time-log-2026-08-22-v17";
const source = `${dir}/CampCast_Project_Time_Log_2026_v15_source.xlsx`;
const output = `${dir}/CampCast_Project_Time_Log_2026_v17_milestones.xlsx`;
const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(source));

const timeLog = workbook.worksheets.getItem("Time Log");

timeLog.getRange("B16:K16").values = [[
  46253,
  "Róbert Marvin Gíslason",
  3,
  "WP1 - Reiknilíkan og tæknileg sannprófun",
  "Laun og launatengd gjöld",
  "Programming",
  "Forritun og tæknileg þróunarvinna við Eltum Veðrið.",
  "Þróunarvinna unnin og breytingar undirbúnar/innleiddar.",
  "Github",
  "Kóði / Git commit / Pull request",
]];
timeLog.getRange("R16:U16").values = [[
  "Til staðfestingar",
  "Nei",
  null,
  "3 klst. vinnulota, 19. ágúst 2026. Forritun og tæknileg þróun.",
]];

timeLog.getRange("B17:K17").values = [[
  46255,
  "Róbert Marvin Gíslason",
  2,
  "WP1 - Reiknilíkan og tæknileg sannprófun",
  "Laun og launatengd gjöld",
  "Technical development",
  "ESLint-baseline maintenance og audit: yfirferð á lint-niðurstöðum, greining á cross-file i18n duplicate keys og ósamhverfri merge precedence, ásamt afmörkun follow-up vinnu fyrir copy og translation architecture.",
  "ESLint-baseline follow-up scope skjalfest; i18n architecture audit og íslenskt Top 5 copy-polish skráð í aðskilda backlog-miða #385 og #386.",
  "Github #372, #385 og #386 / Icelandic Weather Roadmap",
  "Kóði / audit / GitHub issue",
]];
timeLog.getRange("R17:U17").values = [[
  "Til staðfestingar",
  "Nei",
  null,
  "2 klst. vinnulota, 21. ágúst 2026. ESLint-baseline maintenance, audit og follow-up verkefnavinna; engin implementation í follow-up miðunum.",
]];

const milestones = workbook.worksheets.getItem("Milestones");
milestones.getRange("A9:F9").copyTo(milestones.getRange("A10:F10"), "all");
milestones.getRange("A10:F10").values = [[
  "2026-08-19",
  "Open-Meteo API Standard keypt",
  "WP1",
  "Open-Meteo API Standard áskrift fyrir tímabilið 19.08.–19.09.2026 greidd. Heildarkostnaður €29,00; kortafærsla 4.289 kr. samkvæmt kvittun.",
  "Invoice FNL24G5B-0006: https://drive.google.com/file/d/1tXcWc75qiPacO6zkCnFYhG7Bultxyh2r/view / Receipt 2708-4603: https://drive.google.com/file/d/1wxOZY1TKaJ8ug9JhdnVQJb2u25Oz757o/view",
  "Medium",
]];
milestones.getRange("A10:F10").format.rowHeightPx = 72;

console.log((await workbook.inspect({ kind: "table", sheetId: "Time Log", range: "A14:U17", maxChars: 16000, tableMaxRows: 6, tableMaxCols: 21 })).ndjson);
console.log((await workbook.inspect({ kind: "table", sheetId: "Milestones", range: "A8:F10", maxChars: 10000, tableMaxRows: 5, tableMaxCols: 6 })).ndjson);
console.log((await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, maxChars: 8000 })).ndjson);

for (const sheetName of ["Time Log", "Milestones", "WP Summary", "TÞS Cost Summary", "Monthly Summary", "Instructions", "Lists", "Dashboard"]) {
  const preview = await workbook.render({ sheetName, autoCrop: "all", scale: 0.8, format: "png" });
  await fs.writeFile(`${dir}/${sheetName.replaceAll(" ", "_")}.png`, new Uint8Array(await preview.arrayBuffer()));
}

const blob = await SpreadsheetFile.exportXlsx(workbook);
await blob.save(output);
console.log(output);
