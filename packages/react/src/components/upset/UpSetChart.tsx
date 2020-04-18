import { ISetLike } from '@upsetjs/model';
import React, { PropsWithChildren } from 'react';
import { UpSetReactChildrens } from '../config';
import CombinationChart from './CombinationChart';
import { UpSetDataInfo } from './deriveDataDependent';
import { UpSetSizeInfo } from './deriveSizeDependent';
import { UpSetStyleInfo } from './deriveStyleDependent';
import SetChart from './SetChart';
import { wrap } from './utils';

export default React.memo(function UpSetChart<T>({
  data,
  size,
  style,
  onHover,
  onClick,
  onContextMenu,
  childrens,
}: PropsWithChildren<{
  size: UpSetSizeInfo;
  style: UpSetStyleInfo;
  data: UpSetDataInfo<T>;
  onHover?(selection: ISetLike<T> | null, evt: React.MouseEvent): void;
  onClick?(selection: ISetLike<T> | null, evt: React.MouseEvent): void;
  onContextMenu?(selection: ISetLike<T> | null, evt: React.MouseEvent): void;
  childrens: UpSetReactChildrens<T>;
}>) {
  const [onClickImpl, onMouseEnterImpl, onContextMenuImpl, onMouseLeaveImpl] = React.useMemo(
    () => [
      wrap(onClick),
      wrap(onHover),
      wrap(onContextMenu),
      onHover ? (evt: React.MouseEvent) => onHover(null, evt) : undefined,
    ],
    [onClick, onHover, onContextMenu]
  );

  return (
    <g className={onClick ? `clickAble-${style.id}` : undefined}>
      <g transform={`translate(${size.sets.x},${size.sets.y})`}>
        {data.sets.v.map((d, i) => (
          <SetChart
            key={d.name}
            d={d}
            i={i}
            onClick={onClickImpl}
            onMouseEnter={onMouseEnterImpl}
            onMouseLeave={onMouseLeaveImpl}
            onContextMenu={onContextMenuImpl}
            className={onClick || onHover ? `interactive-${style.id}` : undefined}
            data={data}
            style={style}
            size={size}
          >
            {childrens.set && childrens.set(d)}
          </SetChart>
        ))}
      </g>

      <g transform={`translate(${size.cs.x},${size.cs.y})`}>
        {data.cs.v.map((d) => (
          <CombinationChart
            key={d.name}
            d={d}
            onClick={onClickImpl}
            onMouseEnter={onMouseEnterImpl}
            onMouseLeave={onMouseLeaveImpl}
            onContextMenu={onContextMenuImpl}
            className={onClick || onHover ? `interactive-${style.id}` : undefined}
            data={data}
            style={style}
            size={size}
          >
            {childrens.combinations && childrens.combinations(d)}
          </CombinationChart>
        ))}
      </g>
    </g>
  );
});
