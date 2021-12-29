export type EntityType = "article" | "folder";

export type EntityHierarchy = {
  name: string;
  type: EntityType;

  // No trailing slashes!
  uri: string;
};

export type Entity = {
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

export type Folder = Entity & {
  children: any[];
  readme: null | string;
};

export type Article = Entity & {
  source: string;
  excerpt: string;
  html: string;
  uncommitted: boolean;
  revisions: RevisionList;
};

export type RevisionList = {
  id: string;
  shortId: string;
  date: Date;
  subject: string;
  body: string;
  author: {
    name: string;
    email: string;
  };
}[];

export type Revision = {
  id: string;
  shortId: string;
  source: string;
  html: string;
};

export type Bock = {
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
export type TemplateVariables = {
  name: string;
  type:
    | "article"
    | "compare"
    | "folder"
    | "home"
    | "random"
    | "raw"
    | "revision"
    | "revision-list"
    | "search";
  uri: string;
  packageInfo?: {
    name: string;
    version: string;
  };
} & Record<string, any>;

export type Statistics = {};
