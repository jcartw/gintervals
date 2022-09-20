const { expect } = require("chai");
const assert = require("assert");

const { merge, decorateText } = require("../src/index");

describe("General Intervals", () => {
  it("Should process text with bold, italic, and underlined decorations", () => {
    const text = "The last word is bold-italic-underlined";
    const inlineStyleRanges = [
      { offset: 17, length: 22, style: "BOLD" },
      { offset: 22, length: 17, style: "ITALIC" },
      { offset: 29, length: 10, style: "UNDERLINE" }
    ];

    // map to input format
    const data = inlineStyleRanges.map((x) => ({
      start: x.offset,
      end: x.offset + x.length - 1,
      content: x.style
    }));

    const intervals = merge(data);
    expect(intervals.length).to.equal(3);
    expect(intervals[0]).to.haveOwnProperty("start");
    expect(intervals[0]).to.haveOwnProperty("end");
    expect(intervals[0]).to.haveOwnProperty("content");

    const decorated = decorateText({ intervals, text });
    expect(decorated.length).to.equal(3);
    expect(decorated[0].text).to.equal("bold-");
    expect(decorated[1].text).to.equal("italic-");
    expect(decorated[2].text).to.equal("underline");

    assert.deepEqual(decorated[0].content, ["BOLD"]);
    assert.deepEqual(decorated[1].content, ["BOLD", "ITALIC"]);
    assert.deepEqual(decorated[2].content, ["BOLD", "ITALIC", "UNDERLINE"]);
  });
});
