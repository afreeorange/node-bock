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

// export type Status = "clean" | "dirty";

type EntityType = "article" | "folder";

type EntityHierarchy = {
  name: string;
  type: EntityType;
  uri: string;
};

type Entity = {
  created: Date;
  modified: Date;
  hierarchy: EntityHierarchy[];
  id: string;
  type: EntityType;
  sizeInBytes: number;

  name: string;
  path: string;
  uri: string;
};

type Folder = Entity & {
  children?: any[];
  readme?: null | string;
};

type Article = Entity & {
  source?: string;
  wordCount?: number;
  excerpt?: string;
  html?: string;
  uncommitted?: boolean;
  revisions?: string[];
};

type Bock = {
  articleRoot: string;
  outputFolder: string;
  entities: Record<string, Entity>;
  listOfEntities: Entity[];
  listOfPaths: string[];
  prettify: boolean;
};
