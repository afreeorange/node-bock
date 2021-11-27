import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  breaks: true,
  html: true,
  linkify: true,
  typographer: true,
})
  // .use(require("markdown-it-prism"))
  .use(require("markdown-it-attrs"))
  .use(require("markdown-it-attribution"), {
    classNameContainer: null,
    classNameAttribution: null,
    marker: "--",
    removeMarker: true,
  });

export default md;
