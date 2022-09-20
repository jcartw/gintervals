const crypto = require("crypto");

module.exports.merge = (data) => {
  // deep copy array
  let intervals = JSON.parse(JSON.stringify(data));

  // add `isInputData` flag to input data
  intervals = intervals.map((x) => ({
    start: x.start,
    end: x.end,
    content: x.content,
    isInputData: true
  }));

  // create intervals for every unique start and end point
  const uniquePoints = intervals
    .reduce((a, c) => {
      a.push(c.start);
      a.push(c.end);
      return a;
    }, [])
    .filter((x, idx, self) => self.indexOf(x) === idx)
    .sort((a, b) => a - b);
  if (uniquePoints.length === 1) {
    throw new Error("Invalid number of endpoints to create intervals");
  }
  const fineIntervals = [];
  for (let k = 1; k < uniquePoints.length; k++) {
    fineIntervals.push({
      start: uniquePoints[k - 1],
      end: uniquePoints[k],
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
      // contentArray.sort((a, b) => a.content > b.content);
      // currentInterval.content = contentArray.reduce((a, c) => {
      //   a += (a ? "-" : "") + c.content;
      //   return a;
      // }, "");
      currentInterval.content = contentArray.map((x) => x.content);
    }
  }

  // filter input data and remove `isInputData` field
  const unmerged = preout
    .filter((x) => !x.isInputData && x.content.length)
    .map((x) => ({ start: x.start, end: x.end, content: x.content }));

  // merge equal intervals
  const output = [unmerged[0]];
  for (let k = 1; k < unmerged.length; k++) {
    const { start, end, content } = unmerged[k];
    const lastEnd = output[output.length - 1].end;
    const lastContent = output[output.length - 1].content;

    if (
      start <= lastEnd &&
      JSON.stringify(content) === JSON.stringify(lastContent)
    ) {
      // if overlapping merge them
      output[output.length - 1].end = Math.max(lastEnd, end);
    } else {
      // otherwise add interval to output array
      output.push({ ...unmerged[k] });
    }
  }

  return output;
};

module.exports.decorateText = (input) => {
  const { text, intervals } = input;
  return intervals.map((x) => ({
    text: text.slice(x.start, x.end),
    content: x.content
  }));
};
