declare namespace gintervals {
  interface Interval<T> {
    start: number;
    end: number;
    content: T;
  }

  interface MergedInterval<T> {
    start: number;
    end: number;
    contentList: T[];
  }

  interface DecoratedText<T> {
    text: string;
    contentList: T[];
  }

  export function fillGaps<T>(input: {
    intervals: Interval<T>[];
    start: number;
    end: number;
  }): Interval<T>[];

  export function merge<T>(intervals: Interval<T>[]): MergedInterval<T>[];

  export function decorateText<T>(input: {
    intervals: MergedInterval<T>[];
    text: string;
  }): DecoratedText<T>[];
}

export = gintervals;
