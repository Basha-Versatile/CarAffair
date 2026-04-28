import type { Document } from 'mongoose';

export function toJSON<T extends Document | Record<string, unknown>>(doc: T): Record<string, unknown> {
  const obj = typeof (doc as Document).toObject === 'function' ? (doc as Document).toObject() : { ...(doc as object) };
  const { _id, __v, ...rest } = obj as Record<string, unknown>;
  return { id: String(_id), ...rest };
}

export function listJSON<T extends Document | Record<string, unknown>>(docs: T[]): Record<string, unknown>[] {
  return docs.map(toJSON);
}
