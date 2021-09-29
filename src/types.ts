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

/**
 * A list of properties common to both an article and a folder. We use these to
 * create a nice and simple union type for each. The `type` property is used to
 * discriminate the union.
 */
type EntityCommon = {
  /**
   * Nothing more than a UUIDv5 based on the article or folder name.
   */
  id: string;
  created: Date;
  modified: Date;
  hierarchy: EntityHierarchy[];
  type: EntityType;
  name: string;
  sizeInBytes: number;

  /**
   * Relative path to article or folder in repo. We don't expose the full path
   * because security.
   *
   * Examples:
   *
   * - `My Awesome Folder/Another/Some Article.md`
   * - `My Awesome Folder/Another`
   */
  entityPath: string;

  /**
   * Pretty URI version of the article or folder path. All we do here is
   * replace the spaces with underscores and remove any file extensions.
   *
   * Examples (based on the `entityPath` property)
   *
   * - `My_Awesome_Folder/Another/Some_Article`
   * - `My_Awesome_Folder/Another`
   */
  uri: string;
};

export type EntityHierarchy = {
  name: string;
  type: EntityType;
};

export type Revision = {
  committed: Date;
  hierarchy: EntityHierarchy;
  html: string | null;
  name: string;
  source: string | null;
};

export type RevisionSummary = {
  author: string;
  committed: Date;
  email: string;
  id: string;
  message: string | null;
};

export type EntitySummary = {
  id: string;
  name: string;
  uri: string;
};

export type Article = EntityCommon & {
  // Article content
  source: string | null;
  html: string | null;
  excerpt: string | null;

  // Article Metadata
  wordCount: number;
  uncommitted: boolean;

  // Revisions!
  revisions: RevisionSummary[];
};

export type Folder = EntityCommon & {
  children: {
    count: number;
    articles: EntitySummary[];
    folders: EntitySummary[];
  };
  readme: {
    present: boolean;
    source: string | null;
    html: string | null;
  };
};

export type Entity = Article | Folder;

export type Stats = {
  count: number;
  latest: {
    created: Date;
    excerpt: string;
    hierarchy: EntityHierarchy[];
    id: string;
    modified: Date;
    name: string;
    sizeInBytes: number;
    type: EntityType;
  }[];
};
