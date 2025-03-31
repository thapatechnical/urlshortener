import fs from "fs/promises";
import path from "path";
import ejs from "ejs";
import mjml2html from "mjml";

export const getHtmlFromMjmlTemplate = async (template, data) => {
  // 1: we need to read the data
  const mjmlTemplate = await fs.readFile(
    path.join(import.meta.dirname, "..", "emails", `${template}.mjml`),
    "utf-8"
  );
  // 2: we need to replace the placeholder
  const filledTemplate = ejs.render(mjmlTemplate, data);
  // 3:  we need to convert that fiule into hmtl file
  return mjml2html(filledTemplate).html;
};
