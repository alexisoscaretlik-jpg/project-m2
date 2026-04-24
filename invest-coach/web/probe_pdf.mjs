import { PDFDocument } from "pdf-lib";
import { readFile } from "node:fs/promises";

const bytes = await readFile("./public/cerfa/2042-blank.pdf");
const pdf = await PDFDocument.load(bytes);
const form = pdf.getForm();
const fields = form.getFields();

console.log(`Total fields: ${fields.length}`);
const byType = {};
for (const f of fields) {
  const type = f.constructor.name;
  byType[type] ??= [];
  byType[type].push(f.getName());
}
for (const [type, names] of Object.entries(byType)) {
  console.log(`\n=== ${type} (${names.length}) ===`);
  for (const n of names) console.log(n);
}
