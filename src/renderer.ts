import nunjucks from "nunjucks";
import numeral from "numeral";
import formatDate from "date-fns/format";

export const renderer = nunjucks.configure({});
renderer.addFilter("numeral", (number: string, format: string) => {
  const n = numeral(number);
  return format === "value" ? n.value() : n.format(format);
});

renderer.addFilter("date", (date: Date, format: string = "MMM") =>
  formatDate(date, format),
);
