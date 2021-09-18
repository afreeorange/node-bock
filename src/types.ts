/**
new, untracked
added, staged
added, staged, with unstaged changes
unmodified
modified, unstaged
modified, staged
modified, staged, with unstaged changes
deleted, unstaged
deleted, staged
 */

export type Status = "clean" | "dirty";

export type Article = {
  id: string;
  title: string;
  source: string;
  renderedSource: string;
};
