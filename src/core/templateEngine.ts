import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Handlebars from "handlebars";

const TEMPLATE_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "templates",
);

export async function renderTemplate<T extends object>(
  templateName: string,
  context: T,
): Promise<string> {
  const path = join(TEMPLATE_DIR, templateName);
  const source = await readFile(path, "utf-8");
  const template = Handlebars.compile(source, { noEscape: false });
  return template(context).trimEnd() + "\n";
}
