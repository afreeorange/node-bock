import nunjucks from "nunjucks";
import numeral from "numeral";

export const renderer = nunjucks.configure({});
renderer.addFilter("numeral", (number: string, format: string) => {
  const n = numeral(number);
  return format === "value" ? n.value() : n.format(format);
});
