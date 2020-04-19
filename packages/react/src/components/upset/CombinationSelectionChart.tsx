import { ISetLike, ISetCombination } from '@upsetjs/model';
import React, { PropsWithChildren } from 'react';
import { UpSetAddons } from '../config';
import { UpSetDataInfo } from './deriveDataDependent';
import { UpSetSizeInfo } from './deriveSizeDependent';
import { UpSetStyleInfo } from './deriveStyleDependent';
import { addonPositionGenerator, clsx } from './utils';

function CombinationSelectionChart<T>({
  data,
  size,
  style,
  elemOverlap,
  secondary,
  tooltip,
  suffix,
  transform,
  empty,
  combinationAddons,
}: PropsWithChildren<{
  transform?: string;
  data: UpSetDataInfo<T>;
  size: UpSetSizeInfo;
  style: UpSetStyleInfo;
  suffix: string;
  empty?: boolean;
  elemOverlap: (s: ISetLike<T>) => number;
  secondary?: boolean;
  tooltip?: string;
  combinationAddons: UpSetAddons<ISetCombination<T>, T>;
}>) {
  const width = data.cs.bandWidth;
  const totalHeight = size.cs.h + size.sets.h;
  const height = size.cs.h;
  const className = clsx(`fill${suffix}`, !tooltip && `pnone-${style.id}`, style.classNames.bar);
  return (
    <g transform={transform}>
      {data.cs.v.map((d, i) => {
        const x = data.cs.x(d)!;
        const key = data.cs.keys[i];
        if (empty && !secondary) {
          return (
            <rect key={key} x={x} y={height} height={0} width={width} className={className} style={style.styles.bar}>
              {tooltip && <title></title>}
            </rect>
          );
        }
        const o = elemOverlap(d);
        if (o === 0) {
          return null;
        }
        const y = data.cs.y(o);

        const title = tooltip && <title>{`${d.name} ∩ ${tooltip}: ${o}`}</title>;
        const content = secondary ? (
          <path
            key={key}
            transform={`translate(${x}, ${y})`}
            d={`M0,-1 l${width},0 l0,2 l${-width},0 L-${data.triangleSize},-${data.triangleSize} L-${
              data.triangleSize
            },${data.triangleSize} Z`}
            className={className}
          >
            {title}
          </path>
        ) : (
          <rect key={key} x={x} y={y} height={height - y} width={width} className={className} style={style.styles.bar}>
            {title}
          </rect>
        );

        const genPosition = addonPositionGenerator(totalHeight);
        const addons = combinationAddons
          .map((addon) => {
            const v = genPosition(addon);
            const content = addon.render({ set: d, width, height: addon.size, theme: style.theme });
            if (!content) {
              return null;
            }
            return (
              <g key={addon.name} transform={`translate(${x},${v})`}>
                {content}
              </g>
            );
          })
          .filter(Boolean);

        if (addons.length === 0) {
          return content;
        }
        return (
          <g key={key}>
            {content}
            {addons}
          </g>
        );
      })}
    </g>
  );
}

export default CombinationSelectionChart;
