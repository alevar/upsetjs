/**
 * @upsetjs/plots
 * https://github.com/upsetjs/upsetjs
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import React, { useMemo } from 'react';
import { VegaLite } from 'react-vega';
import { UpSetPlotProps, fillDefaults } from '../interfaces';
import { TopLevelSpec } from 'vega-lite';
import { useVegaHooks } from './functions';

export interface HistogramProps<T> extends UpSetPlotProps<T> {
  width: number;
  height: number;

  elems: ReadonlyArray<T>;
  attr: keyof T | ((v: T) => number);
  label?: string;
}

function generateLayer(attr: string, color: string) {
  return {
    mark: {
      type: 'bar' as 'bar',
    },
    encoding: {
      color: {
        value: color,
      },
      x: {
        bin: true,
        field: 'v',
        type: 'quantitative' as 'quantitative',
      },
      y: {
        aggregate: 'sum' as 'sum',
        field: attr,
        type: 'quantitative' as 'quantitative',
      },
    },
  };
}

export default function Histogram<T>(props: HistogramProps<T>) {
  const { title, description, selectionColor, color, theme } = fillDefaults(props);
  const { attr, elems, width, height } = props;
  const name = props.label ?? typeof attr === 'function' ? 'x' : attr.toString();

  const table = useMemo(() => {
    const acc = typeof attr === 'function' ? attr : (v: T) => (v[attr] as unknown) as number;
    return elems.map((e) => ({ e, i: 1, v: acc(e) }));
  }, [elems, attr]);

  const { viewRef, vegaProps } = useVegaHooks(table, props.queries, props.selection);

  const listeners = useMemo(() => {
    return {
      select: (type: string, item: unknown) => {
        console.log(type, item);
        // const data = item as { _vgsid_: number[] };
        if (viewRef.current) {
          const bins = viewRef.current.data('data_0');
          console.log(viewRef.current.data('select_store'));
          console.log(bins);
        }
      },
      highlight: (type: string, item: unknown) => {
        console.log(type, item);
      },
    };
  }, [viewRef]);

  const spec = useMemo((): TopLevelSpec => {
    return {
      title,
      description,
      data: {
        name: 'table',
      },
      transform: [
        { calculate: 'inSetStore(data("set_store"), datum.e) ? 1 : 0', as: 's' },
        ...(props.queries ?? []).map((_, i) => ({
          calculate: `inSetStore(data("q${i}_store"), datum.e) ? 1 : 0`,
          as: `q${i}`,
        })),
      ],
      layer: [
        {
          selection: {
            highlight: { type: 'single', empty: 'none', on: 'mouseover' },
            select: { type: 'single', empty: 'none' },
          },
          mark: {
            type: 'bar',
            cursor: 'pointer',
          },
          encoding: {
            color: {
              condition: { selection: 'select', value: selectionColor },
              value: color,
            },
            x: {
              bin: true,
              field: 'v',
              type: 'quantitative',
              title: name,
            },
            y: {
              aggregate: 'sum',
              field: 'i',
              type: 'quantitative',
            },
          },
        },
        generateLayer('s', selectionColor),
        ...(props.queries ?? []).map((q, i) => generateLayer(`q${i}`, q.color)),
      ],
    };
  }, [name, title, description, selectionColor, color, props.queries]);

  return (
    <VegaLite
      spec={spec}
      width={width}
      height={height}
      signalListeners={listeners}
      theme={theme === 'dark' ? 'dark' : undefined}
      {...vegaProps}
    />
  );
}
