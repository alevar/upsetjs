/**
 * @upsetjs/react
 * https://github.com/upsetjs/upsetjs
 *
 * Copyright (c) 2020 Samuel Gratzl <sam@sgratzl.com>
 */

import { ISetLike, UpSetQueries } from '@upsetjs/model';
import React, { PropsWithChildren } from 'react';
import { clsx } from '../../utils';
import { VennDiagramStyleInfo } from '../derive/deriveVennStyleDependent';
import { ITextArcSlice } from '../layout/interfaces';
import { UpSetSelection } from '../../components/interfaces';
import { VennDiagramDataInfo } from '../derive/deriveVennDataDependent';
import { generateArcSlicePath } from '../layout/generate';

function SelectionPattern({ id, suffix, v, rotate = 0 }: { id: string; suffix: string; v: number; rotate?: number }) {
  if (v >= 1 || v <= 0) {
    return null;
  }
  const ratio = Math.round(v * 10.0) / 100;
  return (
    <defs>
      <pattern
        id={id}
        width="1"
        height="0.1"
        patternContentUnits="objectBoundingBox"
        patternTransform={`rotate(${rotate})`}
      >
        <rect x="0" y="0" width="1" height={ratio} className={`fill${suffix}`} />
      </pattern>
    </defs>
  );
}

function sliceRotate(slice: ITextArcSlice) {
  return slice.text.x === slice.x1 ? 0 : slice.text.x < slice.x1 ? 60 : -60;
}

function generateTitle(
  d: ISetLike<any>,
  s: number,
  sName: string | undefined,
  secondary: boolean,
  qs: number[],
  queries: UpSetQueries<any>,
  data: VennDiagramDataInfo<any>,
  cx: number
) {
  const dc = data.format(d.cardinality);
  const baseName = !sName ? d.name : `${d.name} ∩ ${sName}`;
  const baseCardinality = !sName ? dc : `${data.format(s)}/${dc}`;
  if (qs.length === 0) {
    return {
      tooltip: `${baseName}: ${baseCardinality}`,
      title:
        d.type === 'set' ? (
          <>
            <tspan dy="-0.6em">{d.name}</tspan>
            <tspan x={cx} dy="1.2em">
              {baseCardinality}
            </tspan>
          </>
        ) : (
          baseCardinality
        ),
    };
  }

  if (qs.length === 1 && !secondary && !sName) {
    return {
      tooltip: `${d.name} ∩ ${queries[0].name}: ${data.format(qs[0])}/${dc}`,
      title:
        d.type === 'set' ? (
          <>
            <tspan dy="-0.6em">{d.name}</tspan>
            <tspan x={cx} dy="1.2em">
              {`${data.format(qs[0])}/${dc}`}
            </tspan>
          </>
        ) : (
          `${data.format(qs[0])}/${dc}`
        ),
    };
  }

  const queryLine = (
    <tspan x={cx} dy="1.2em">
      {queries.map((q, i) => (
        <React.Fragment key={q.name}>
          <tspan className={`fillQ${i}-${data.id}`}>{'⬤'}</tspan>
          <tspan>{` ${data.format(qs[i])}/${dc}${i < queries.length - 1 ? ' ' : ''}`}</tspan>
        </React.Fragment>
      ))}
    </tspan>
  );

  return {
    tooltip: `${baseName}: ${baseCardinality}\n${queries
      .map((q, i) => `${d.name} ∩ ${q.name}: ${data.format(qs[i])}/${dc}`)
      .join('\n')}`,
    title:
      d.type === 'set' ? (
        <>
          <tspan dy="-1.2em">{d.name}</tspan>
          <tspan x={cx} dy="1.2em">
            {baseCardinality}
          </tspan>
          {queryLine}
        </>
      ) : (
        <>
          <tspan dy="-0.6em">{baseCardinality}</tspan>
          {queryLine}
        </>
      ),
  };
}

export default function VennArcSliceSelection<T>({
  slice,
  d,
  i,
  data,
  style,
  elemOverlap,
  selected,
  selectionName,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  queries,
  qs,
}: PropsWithChildren<
  {
    slice: ITextArcSlice;
    i: number;
    d: ISetLike<T>;
    selected: boolean;
    elemOverlap: null | ((s: ISetLike<T>) => number);
    selectionName?: string;
    style: VennDiagramStyleInfo;
    data: VennDiagramDataInfo<T>;
    queries: UpSetQueries<T>;
    qs: ReadonlyArray<(s: ISetLike<T>) => number>;
  } & UpSetSelection
>) {
  const p = generateArcSlicePath(slice);
  const rotate = sliceRotate(slice);

  const o = elemOverlap ? elemOverlap(d) : 0;
  const className = clsx(
    o === 0 && !selected && `fillTransparent-${style.id}`,
    ((o === d.cardinality && d.cardinality > 0) || selected) && `fillSelection-${style.id}`,
    style.classNames.set
  );
  const id = `upset-${style.id}-${i}`;
  const secondary = elemOverlap != null || onMouseLeave != null;
  const qsOverlaps = qs.map((q) => q(d));

  const { title, tooltip } = generateTitle(d, o, selectionName, secondary, qsOverlaps, queries, data, slice.text.x);

  return (
    <g>
      <SelectionPattern id={id} v={o / d.cardinality} suffix={`Selection-${style.id}`} rotate={rotate} />
      <path
        onMouseEnter={onMouseEnter(d)}
        onMouseLeave={onMouseLeave}
        onClick={onClick(d)}
        onContextMenu={onContextMenu(d)}
        d={p}
        fill={o > 0 && o < d.cardinality ? `url(#${id})` : undefined}
        className={className}
        style={style.styles.set}
      >
        <title>{tooltip}</title>
      </path>
      <text
        x={slice.text.x}
        y={slice.text.y}
        className={clsx(
          `${d.type === 'set' ? 'set' : 'value'}TextStyle-${style.id}`,
          `pnone-${style.id}`
          // circle.align === 'left' && `startText-${style.id}`,
          // circle.align === 'right' && `endText-${style.id}`
        )}
      >
        {title}
      </text>
    </g>
  );
}