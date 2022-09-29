const { expect } = require("chai");
const assert = require("assert");

const gintervals = require("../src/index");

describe("General Intervals", () => {
  describe("Plain Intervals", () => {
    it("Should merge overlapping intervals", () => {
      const overlappingIntervals = [
        [1, 4],
        [20, 30],
        [5, 7],
        [3, 5]
      ];

      const merged = gintervals.merge(
        overlappingIntervals.map((x) => ({
          start: x[0],
          end: x[1],
          content: null
        }))
      );

      const expectedOutput = [
        { start: 1, end: 7, contentList: [] },
        { start: 20, end: 30, contentList: [] }
      ];
      assert.deepStrictEqual(merged, expectedOutput);
    });
    it("Should fill gaps in intervals", () => {
      const intervals = [
        [2, 4],
        [5, 7],
        [12, 20]
      ];

      const START = 0;
      const END = 25;

      const filled = gintervals.fillGaps({
        intervals: intervals.map((x) => ({
          start: x[0],
          end: x[1],
          content: null
        })),
        start: START,
        end: END
      });

      expect(filled.length).to.equal(6);
      const expectedOutput = [
        { start: START, end: 1, content: null },
        { start: 2, end: 4, content: null },
        { start: 5, end: 7, content: null },
        { start: 8, end: 11, content: null },
        { start: 12, end: 20, content: null },
        { start: 21, end: END, content: null }
      ];
      assert.deepStrictEqual(filled, expectedOutput);
    });
  });
  describe("Decorated Text", () => {
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

      const intervals = gintervals.merge(data);
      expect(intervals.length).to.equal(3);
      expect(intervals[0]).to.haveOwnProperty("start");
      expect(intervals[0]).to.haveOwnProperty("end");
      expect(intervals[0]).to.haveOwnProperty("contentList");

      const decorated = gintervals.decorateText({ intervals, text });

      expect(decorated.length).to.equal(3);
      expect(decorated[0].text).to.equal("bold-");
      expect(decorated[1].text).to.equal("italic-");
      expect(decorated[2].text).to.equal("underlined");

      assert.deepEqual(decorated[0].contentList, ["BOLD"]);
      assert.deepEqual(decorated[1].contentList, ["BOLD", "ITALIC"]);
      assert.deepEqual(decorated[2].contentList, [
        "BOLD",
        "ITALIC",
        "UNDERLINE"
      ]);
    });

    it("Should process text after filling content gaps", () => {
      const text = "The last word is bold-italic-underlined";
      const inlineStyleRanges = [
        { offset: 17, length: 22, style: "BOLD" },
        { offset: 22, length: 17, style: "ITALIC" },
        { offset: 29, length: 10, style: "UNDERLINE" }
      ];
      let intervals = inlineStyleRanges.map((x) => ({
        start: x.offset,
        end: x.offset + x.length - 1,
        content: x.style
      }));

      const filled = gintervals.fillGaps({
        intervals,
        start: 0,
        end: text.length - 1
      });

      intervals = gintervals.merge(filled);

      expect(intervals.length).to.equal(4);
      const decorated = gintervals.decorateText({ intervals, text });
      expect(decorated.length).to.equal(4);
      expect(decorated[0].text).to.equal("The last word is ");
      expect(decorated[1].text).to.equal("bold-");
      expect(decorated[2].text).to.equal("italic-");
      expect(decorated[3].text).to.equal("underlined");

      assert.deepEqual(decorated[0].contentList, []);
      assert.deepEqual(decorated[1].contentList, ["BOLD"]);
      assert.deepEqual(decorated[2].contentList, ["BOLD", "ITALIC"]);
      assert.deepEqual(decorated[3].contentList, [
        "BOLD",
        "ITALIC",
        "UNDERLINE"
      ]);
    });
    it("Should process text with decorations and entities", () => {
      const text =
        "This text is bold. Next we have italic. Here is an entity: ENTITY_0. Here is another entity: ENTITY_1.";
      const inlineStyleRanges = [
        { offset: 13, length: 4, style: "BOLD" },
        { offset: 32, length: 6, style: "ITALIC" }
      ];
      const entityRanges = [
        { offset: 59, length: 8, key: 0 },
        { offset: 93, length: 8, key: 1 }
      ];

      let intervals = inlineStyleRanges
        .map((x) => ({
          start: x.offset,
          end: x.offset + x.length - 1,
          content: { style: x.style, entityKey: null }
        }))
        .concat(
          entityRanges.map((x) => ({
            start: x.offset,
            end: x.offset + x.length - 1,
            content: { style: null, entityKey: x.key }
          }))
        );

      const filled = gintervals.fillGaps({
        intervals,
        start: 0,
        end: text.length - 1
      });

      intervals = gintervals.merge(filled);
      const decorated = gintervals.decorateText({ intervals, text });

      expect(decorated.length).to.equal(9);
      const textList = [
        "This text is ",
        "bold",
        ". Next we have ",
        "italic",
        ". Here is an entity: ",
        "ENTITY_0",
        ". Here is another entity: ",
        "ENTITY_1",
        "."
      ];
      const contentList = [
        [],
        [{ style: "BOLD", entityKey: null }],
        [],
        [{ style: "ITALIC", entityKey: null }],
        [],
        [{ style: null, entityKey: 0 }],
        [],
        [{ style: null, entityKey: 1 }],
        []
      ];
      for (let k = 0; k < textList.length; k++) {
        expect(decorated[k].text).to.equal(textList[k]);
        assert.deepStrictEqual(decorated[k].contentList, contentList[k]);
      }
    });

    it("Should process text with single white space entities", () => {
      const text = "Here is A: . Next is B: . Next, we have C: . Finally D: ";
      const inlineStyleRanges = [];

      const entityRanges = [
        { offset: 10, length: 1, key: 0 },
        { offset: 23, length: 1, key: 1 },
        { offset: 42, length: 1, key: 2 },
        { offset: 55, length: 1, key: 3 }
      ];

      let intervals = inlineStyleRanges
        .map((x) => ({
          start: x.offset,
          end: x.offset + x.length - 1,
          content: { style: x.style, entityKey: null }
        }))
        .concat(
          entityRanges.map((x) => ({
            start: x.offset,
            end: x.offset + x.length - 1,
            content: { style: null, entityKey: x.key }
          }))
        );

      const filled = gintervals.fillGaps({
        intervals,
        start: 0,
        end: text.length - 1
      });

      intervals = gintervals.merge(filled);

      const decorated = gintervals.decorateText({ intervals, text });

      expect(decorated.length).to.equal(8);
      const textList = [
        "Here is A:",
        " ",
        ". Next is B:",
        " ",
        ". Next, we have C:",
        " ",
        ". Finally D:",
        " "
      ];
      const contentList = [
        [],
        [{ style: null, entityKey: 0 }],
        [],
        [{ style: null, entityKey: 1 }],
        [],
        [{ style: null, entityKey: 2 }],
        [],
        [{ style: null, entityKey: 3 }]
      ];
      for (let k = 0; k < textList.length; k++) {
        expect(decorated[k].text).to.equal(textList[k]);
        assert.deepStrictEqual(decorated[k].contentList, contentList[k]);
      }
    });
    it("Should process text with without any styling", () => {
      const text = "This is plain text";

      const filled = gintervals.fillGaps({
        intervals: [],
        start: 0,
        end: text.length - 1
      });

      expect(filled.length).to.equal(1);
      expect(filled[0].start).to.equal(0);
      expect(filled[0].end).to.equal(text.length - 1);

      intervals = gintervals.merge(filled);
      const decorated = gintervals.decorateText({ intervals, text });
      expect(decorated.length).to.equal(1);
      expect(decorated[0].text).to.equal(text);
    });

    it("Should process zero length text", () => {
      const text = "";

      const filled = gintervals.fillGaps({
        intervals: [],
        start: 0,
        end: text.length - 1
      });

      expect(filled.length).to.equal(1);
      expect(filled[0].start).to.equal(0);
      expect(filled[0].end).to.equal(0);

      intervals = gintervals.merge(filled);

      expect(intervals.length).to.equal(1);
      expect(intervals[0].start).to.equal(0);
      expect(intervals[0].end).to.equal(0);
      expect(intervals[0].contentList.length).to.equal(0);

      const decorated = gintervals.decorateText({ intervals, text });
      expect(decorated.length).to.equal(1);
      expect(decorated[0].text).to.equal(text);
    });
  });
});
