/**
 * @upsetjs/model
 * https://github.com/upsetjs/upsetjs
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import { toIndicesArray, fromIndicesArray } from '../array';
import { GenerateSetCombinationsOptions, generateCombinations, asSet, asCombination } from '../data';
import { ISetCombinations, ISetLike, ISets, toKey as toDefaultKey } from '../model';
import { isElemQuery, isSetQuery, UpSetElemQuery, UpSetSetQuery } from '../queries';
import { IUpSetDumpRef } from './interfaces';

export interface IUpSetFromDumpConfig<T> {
  toElemKey?(set: T): string;
}

export function fromDump<T>(
  dump: IUpSetDump,
  elems: ReadonlyArray<T>,
  options: IUpSetFromDumpConfig<T> = {}
): {
  sets: ISets<T>;
  combinations: ISetCombinations<T>;
  selection?: ISetLike<T>;
  queries: ReadonlyArray<UpSetElemQuery<T> | UpSetSetQuery<T>>;
} {
  const sets: ISets<T> = dump.sets.map((set) => asSet({ ...set, elems: fromIndicesArray(set.elems, elems) }));
  const gen = () =>
    generateCombinations(
      sets,
      Object.assign(
        { type: 'intersection' as 'intersection', elems, toElemKey: options.toElemKey },
        dump.combinationOptions ?? {}
      )
    );
  const combinations: ISetCombinations<T> = dump.combinations
    ? dump.combinations.map((c) =>
        asCombination({ ...c, elems: fromIndicesArray(c.elems, elems) }, c.type, (v) => v.sets.map((i) => sets[i]))
      )
    : gen();

  function fromSetRef(ref: IUpSetDumpRef): ISetLike<T> | undefined {
    if (ref.type === 'set') {
      return sets[ref.index];
    }
    return combinations[ref.index];
  }
  return {
    sets,
    combinations,
    selection: dump.selection ? fromSetRef(dump.selection) : undefined,
    queries: dump.queries.map((query) => {
      if (query.set) {
        return {
          name: query.name,
          color: query.color,
          set: fromSetRef(query.set),
        } as UpSetSetQuery<T>;
      }
      return {
        name: query.name,
        color: query.color,
        elems: fromIndicesArray(query.elems!, elems),
      } as UpSetElemQuery<T>;
    }),
  };
}

export declare type UpSetCompressedIndices = ReadonlyArray<number> | string;

export interface IUpSetDump {
  sets: ReadonlyArray<{ name: string; cardinality: number; elems: UpSetCompressedIndices }>;
  combinations?: ReadonlyArray<{
    name: string;
    type: 'composite' | 'intersection' | 'union';
    sets: ReadonlyArray<number>;
    degree: number;
    cardinality: number;
    elems: UpSetCompressedIndices;
  }>;
  combinationOptions?: Omit<GenerateSetCombinationsOptions, 'elems'>;
  selection?: IUpSetDumpRef;
  queries: ReadonlyArray<{ name: string; color: string; set?: IUpSetDumpRef; elems?: UpSetCompressedIndices }>;
}

export interface IUpSetDumpData<T> {
  toElemIndex(v: T): number;
  sets: ISets<T>;
  combinations: ISetCombinations<T>;
  combinationOptions?: GenerateSetCombinationsOptions<T>;
  selection?: ISetLike<T>;
  queries: ReadonlyArray<UpSetElemQuery<T> | UpSetSetQuery<T>>;
}

export interface IUpSetToDumpConfig<T> {
  compress?: 'no' | 'yes' | 'auto';
  toKey?(set: ISetLike<T>): string;
}

export function toDump<T>(data: IUpSetDumpData<T>, config: IUpSetToDumpConfig<T> = {}): IUpSetDump {
  const indicesOptions = { sortAble: true, ...config };
  const toKey = config.toKey ?? toDefaultKey;
  const bySetKey = new Map(data.sets.map((s, i) => [toKey(s), i]));
  const byCombinationKey = new Map(data.combinations.map((s, i) => [toKey(s), i]));
  const toSetRef = (s: ISetLike<T>): IUpSetDumpRef => {
    return {
      type: s.type,
      index: s.type === 'set' ? bySetKey.get(toKey(s))! : byCombinationKey.get(toKey(s))!,
    };
  };
  const setLookup = data.sets.map((s, i) => ({
    key: toKey(s),
    i,
  }));
  return {
    sets: data.sets.map((set) => ({
      name: set.name,
      cardinality: set.cardinality,
      elems: toIndicesArray(set.elems, data.toElemIndex, indicesOptions),
    })),
    combinations:
      config.compress === 'no'
        ? data.combinations.map((c) => {
            const setKeys = new Set(Array.from(c.sets).map(toKey));
            return {
              name: c.name,
              type: c.type,
              cardinality: c.cardinality,
              degree: c.degree,
              sets: setLookup.filter(({ key }) => setKeys.has(key)).map(({ i }) => i),
              elems: toIndicesArray(c.elems, data.toElemIndex, indicesOptions),
            };
          })
        : undefined,
    combinationOptions: data.combinationOptions,
    selection: data.selection ? toSetRef(data.selection) : undefined,
    queries: data.queries.map((query) => ({
      name: query.name,
      color: query.color,
      set: isSetQuery(query) ? toSetRef(query.set) : undefined,
      elems: isElemQuery(query) ? toIndicesArray(Array.from(query.elems), data.toElemIndex, indicesOptions) : undefined,
    })),
  };
}