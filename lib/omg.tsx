export type OpenMetaGraphValueElement = {
  key: string;
  type: string;
  value: string;
};

export type OpenMetaGraphLinkedElement = {
  key: string;
  type: string;
  uri: string;
};

export type OpenMetaGraphElement =
  | OpenMetaGraphValueElement
  | OpenMetaGraphLinkedElement;

export interface OpenMetaGraph {
  version: string;
  formats: string[];
  elements: OpenMetaGraphElement[];
}
