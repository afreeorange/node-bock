import nunjucks from "nunjucks";
import numeral from "numeral";
import formatDate from "date-fns/format";
import beautify from "js-beautify";

import { BEAUTIFY_OPTIONS } from "./constants";

const renderer = nunjucks.configure({});
renderer.addFilter("numeral", (number: string, format: string) => {
  const n = numeral(number);
  return format === "value" ? n.value() : n.format(format);
});

renderer.addFilter("date", (date: Date, format: string = "MMM") =>
  formatDate(date, format),
);

export const render = ({
  template,
  variables,
  prettify,
}: {
  template: string;
  variables: Record<string, any>;
  prettify: boolean;
}) => {
  const rendered = renderer.render(template, variables);
  return prettify ? beautify.html(rendered, BEAUTIFY_OPTIONS) : rendered;
};
