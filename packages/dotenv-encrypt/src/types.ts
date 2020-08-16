
export interface ParseOptions {
  debug?: boolean
}

export type ReducerFunction = (
  obj: StringKeyedObject,
  key: string
) => Promise<StringKeyedObject>;

export type StringKeyedObject = { [key: string]: string; };

export type ParseHeaderFunction = (value: string) => string;
export type DecryptFunction = (value: string) => string;
export type EncryptFunction = (value: string) => string;
