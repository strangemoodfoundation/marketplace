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
  version: '0.1.0';
  formats: string[];
  elements: OpenMetaGraphElement[];
}

export function grabValue(data: OpenMetaGraph, key: string): string | undefined {
  const element = data.elements.find((e) => e.key === key) as any;
  if (element) {
    return element.value;
  }
}
