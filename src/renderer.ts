import nunjucks from "nunjucks";
import numeral from "numeral";
import { format as formatDate } from "date-fns";

export const renderer = nunjucks.configure({});
renderer.addFilter("numeral", (number: string, format: string) => {
  const n = numeral(number);
  return format === "value" ? n.value() : n.format(format);
});

renderer.addFilter("date", (date: Date, format: string = "MMM") =>
  formatDate(date, format),
);
