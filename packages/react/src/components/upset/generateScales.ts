import type { ISetCombinations, ISets } from '@upsetjs/model';
import { scaleBand, scaleLinear, ScaleBand, ScaleLinear } from 'd3-scale';
import type { UpSetStyles } from './defineStyle';

export declare type UpSetScales = {
  sets: {
    x: ScaleLinear<number, number>;
    y: ScaleBand<string>;
  };
  combinations: {
    x: ScaleBand<string>;
    y: ScaleLinear<number, number>;
  };
};

export default function generateScales(
  sets: ISets<any>,
  combinations: ISetCombinations<any>,
  styles: UpSetStyles
): UpSetScales {
  return {
    sets: {
      x: scaleLinear()
        .domain([0, sets.reduce((acc, d) => Math.max(acc, d.cardinality), 0)])
        .range([styles.sets.w, 0]),
      y: scaleBand()
        .domain(sets.map(d => d.name))
        .range([0, styles.sets.h])
        .padding(styles.padding),
    },
    combinations: {
      x: scaleBand()
        .domain(combinations.map(d => d.name))
        .range([0, styles.combinations.w])
        .padding(styles.padding),
      y: scaleLinear()
        .domain([0, combinations.reduce((acc, d) => Math.max(acc, d.cardinality), 0)])
        .range([styles.combinations.h, 0]),
    },
  };
}
