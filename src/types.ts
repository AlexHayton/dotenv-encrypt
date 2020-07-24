export interface ParseOptions {
  debug?: boolean
}

export type ReducerFunction = (
  obj: StringKeyedObject,
  key: string
) => Promise<StringKeyedObject>;

export type StringKeyedObject = { [key: string]: string; };
