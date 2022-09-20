# gintervals

A library for merging overlapping intervals with differentiable content. The primary use case is transforming
raw rich text data acquired from Draft.js into discrete segments.

## Usage

Add gintervals to your project by using:

```sh
npm install --save gintervals
```

## Examples

Consider the following string of text:

```js
const text = "The last word is bold-italic-underlined";
```

This text can be decorated using overlapping intervals:

```js
const inlineStyleRanges = [
  { offset: 17, length: 22, style: "BOLD" },
  { offset: 22, length: 17, style: "ITALIC" },
  { offset: 29, length: 10, style: "UNDERLINE" }
];
```

With this set of inline styles the expected rendering is:

![rendered text](./assets/rendered.png)

To transform the text string above into an array of segments with the
corresponding styling metadata, `gintervals` can be used as follows:

```js
const gintervals = require("gintervals");

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

const filled = gintervals.fillGaps({
  intervals: data,
  start: 0,
  end: text.length - 1
});
console.log(filled);
// [
//   { start: 0, end: 16, content: null },
//   { start: 17, end: 38, content: 'BOLD' },
//   { start: 22, end: 38, content: 'ITALIC' },
//   { start: 29, end: 38, content: 'UNDERLINE' }
// ]

const intervals = gintervals.merge(filled);
console.log(intervals);
// [
//   { start: 0, end: 16, contentList: [] },
//   { start: 17, end: 21, contentList: [ 'BOLD' ] },
//   { start: 22, end: 28, contentList: [ 'BOLD', 'ITALIC' ] },
//   {
//     start: 29,
//     end: 38,
//     contentList: [ 'BOLD', 'ITALIC', 'UNDERLINE' ]
//   }
// ]

const decorated = gintervals.decorateText({ intervals, text });
console.log(decorated);
// [
//   { text: 'The last word is ', contentList: [] },
//   { text: 'bold-', contentList: [ 'BOLD' ] },
//   { text: 'italic-', contentList: [ 'BOLD', 'ITALIC' ] },
//   {
//     text: 'underlined',
//     contentList: [ 'BOLD', 'ITALIC', 'UNDERLINE' ]
//   }
// ]
```

Finally once the decorated text array is obtained, each segment can be rendered independently inline.

## Contributing

Please feel free to reach out to the [author](mailto:cartwright.76@gmail.com) of this package
for any and all feedback.

## License

[The MIT License](http://opensource.org/licenses/MIT)

Copyright (c) 2022, Justin Cartwright

## References

- Draft.js: https://draftjs.org/
