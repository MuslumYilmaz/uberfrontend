import { Question } from "../models/question.model";

export const getJsKey = (id: string) => `v1:code:js:${id}`;
export const getJsBaselineKey = (id: string) => `v1:code:js:baseline:${id}`;

export const getNgStorageKey = (q: Question) =>
    ((q as any).sdk?.storageKey as string | undefined) ?? `v2:ui:angular:${q.id}`;

export const getNgBaselineKey = (q: Question) => `${getNgStorageKey(q)}:baseline`;

// React StackBlitz storage/baseline (mirrors Angular helpers)
export const getReactStorageKey = (q: { id: string } & any) =>
    (q?.sdk?.storageKey as string) || `v2:ui:react:${q.id}`;

export const getReactBaselineKey = (q: { id: string }) =>
    `v2:ui:react:baseline:${q.id}`;