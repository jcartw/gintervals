const crypto = require("crypto");
const assert = require("assert");

module.exports.merge = (data, opts = {}) => {
  // deep copy array
  let intervals = JSON.parse(JSON.stringify(data));

  // handle zero-length text case
  if (
    intervals.length === 1 &&
    intervals[0].start === 0 &&
    intervals[0].end === 0
  ) {
    return [
      {
        start: 0,
        end: 0,
        contentList: intervals[0].content == null ? [] : [intervals[0].content]
      }
    ];
  }

  // add `isInputData` flag to input data
  intervals = intervals
    .map((x) => ({
      start: x.start,
      end: x.end,
      content: x.content,
      isInputData: true
    }))
    .sort((a, b) => {
      const diff = a.start - b.start;
      // sort input data first
      if (diff === 0) {
        return (a.isInputData ? 0 : 1) - (b.isInputData ? 0 : 1);
      }
      return diff;
    });

  const uniquePoints = intervals
    .reduce((a, c) => {
      if (c.start > 0) {
        a.push(c.start - 1);
      }
      a.push(c.start);
      a.push(c.end);
      return a;
    }, [])
    .filter((x, idx, self) => self.indexOf(x) === idx)
    .sort((a, b) => a - b);

  const fineIntervals = [];
  for (let k = 1; k < uniquePoints.length; k++) {
    fineIntervals.push({
      start: uniquePoints[k - 1],
      end: uniquePoints[k],
      content: null,
      isInputData: false
    });
    if (k === uniquePoints.length - 1) {
      fineIntervals.push({
        start: uniquePoints[k],
        end: uniquePoints[k],
        content: null,
        isInputData: false
      });
    }
  }

  // add intervals with same start and ends
  for (let x of intervals) {
    if (x.start === x.end)
      fineIntervals.push({
        start: x.start,
        end: x.end,
        content: null,
        isInputData: false
      });
  }

  // build up output list
  const preout = fineIntervals.concat(intervals).sort((a, b) => {
    const diff = a.start - b.start;
    // sort input data first
    if (diff === 0) {
      return (a.isInputData ? 0 : 1) - (b.isInputData ? 0 : 1);
    }
    return diff;
  });

  let contentMap = {};
  for (let k = 0; k < preout.length; k++) {
    const currentInterval = preout[k];
    if (currentInterval.isInputData) {
      const hash = crypto
        .createHash("sha1")
        .update(JSON.stringify(currentInterval.content))
        .digest("hex");
      const oldEnd = contentMap[hash] ? contentMap[hash].end : -1;
      contentMap[hash] = {
        content: currentInterval.content,
        end: Math.max(currentInterval.end, oldEnd)
      };
    } else {
      // update output data
      const contentArray = Object.keys(contentMap)
        .map((key) => contentMap[key])
        .filter((x) => x.end >= currentInterval.end);
      currentInterval.content = contentArray.map((x) => x.content);
    }
  }

  // filter input data and remove `isInputData` field
  const unmerged = preout
    .filter((x) => !x.isInputData && x.content.length)
    .map((x) => ({ start: x.start, end: x.end, content: x.content }));

  // merge equal intervals
  const merged = [unmerged[0]];
  for (let k = 1; k < unmerged.length; k++) {
    const { start, end, content } = unmerged[k];
    const lastEnd = merged[merged.length - 1].end;
    const lastContent = merged[merged.length - 1].content;

    if (start <= lastEnd && areEqual(content, lastContent)) {
      // if overlapping merge them
      merged[merged.length - 1].end = Math.max(lastEnd, end);
    } else {
      // otherwise add interval to output array
      merged.push({ ...unmerged[k] });
    }
  }

  // correct for cases where ends are overlapping with next start
  for (let k = 0; k < merged.length - 1; k++) {
    if (merged[k].end === merged[k + 1].start) {
      merged[k].end -= 1;
    }
  }

  // remove null entries from content array
  return merged.map((x) => ({
    start: x.start,
    end: x.end,
    contentList: x.content.filter((c) => !!c)
  }));
};

module.exports.decorateText = (input) => {
  const { text, intervals } = input;

  return intervals.map((x, idx) => {
    let segment = text.slice(x.start, x.end + 1) ?? "";
    return {
      text: segment,
      contentList: x.contentList
    };
  });
};

module.exports.fillGaps = (input) => {
  // clamp start and end indices at 0
  const start = Math.max(input.start, 0);
  const end = Math.max(input.end, 0);

  const intervals = input.intervals
    .map((x) => x) // make copy
    .sort((a, b) => {
      const diff = a.start - b.start;
      if (diff === 0) return a.end - b.end;
      return diff;
    });

  const output = [];
  if (intervals.length > 0) {
    if (intervals[0].start > start) {
      output.push({ start, end: intervals[0].start - 1, content: null });
    }
    output.push(intervals[0]);
    for (let k = 1; k < intervals.length; k++) {
      if (intervals[k].start - intervals[k - 1].end > 1) {
        output.push({
          start: intervals[k - 1].end + 1,
          end: intervals[k].start - 1,
          content: null
        });
      }
      output.push(intervals[k]);
    }
    const last = output[output.length - 1];
    if (last.end < end) {
      output.push({ start: last.end + 1, end, content: null });
    }
  } else {
    output.push({ start, end, content: null });
  }

  return output;
};

function areEqual(a, b) {
  try {
    assert.deepStrictEqual(a, b);
    return true;
  } catch (err) {
    return false;
  }
}
