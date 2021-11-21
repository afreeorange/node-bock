type EntityType = "article" | "folder";

type EntityHierarchy = {
  name: string;
  type: EntityType;

  // No trailing slashes!
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
  children: any[];
  readme: null | string;
};

type Article = Entity & {
  source: string;
  wordCount: number;
  excerpt: string;
  html: string;
  uncommitted: boolean;
  revisions: string[];
};

type Bock = {
  articleRoot: string;
  entities: Record<string, Entity>;
  outputFolder: string;
  listOfEntities: Entity[];
  listOfPaths: string[];
  prettify: boolean;
};

/**
 * Specify a few things that are supplied to all templates from the content
 * writers.
 */
type TemplateVariables = {
  name: string;
  type:
    | "article"
    | "compare"
    | "folder"
    | "home"
    | "random"
    | "raw"
    | "revision"
    | "search";
  uri: string;
  packageInfo?: {
    name: string;
    version: string;
  };
} & Record<string, any>;
