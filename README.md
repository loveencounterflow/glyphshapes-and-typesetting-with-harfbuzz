


# Glyphshapes and Typesetting with HarfBuzz (and NodeJS &c)


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [What is a 'Font'?](#what-is-a-font)
- [What are 'Glyphs' and 'Glyfs'?](#what-are-glyphs-and-glyfs)
- [What is 'Text Shaping'?](#what-is-text-shaping)
- [`FTGL`](#ftgl)
- [FontKit (NodeJS, Browser)](#fontkit-nodejs-browser)
- [PyCairo](#pycairo)
- [HarfBuzz](#harfbuzz)
  - [Install HarfBuzz as APT Package (Would Not Recommend)](#install-harfbuzz-as-apt-package-would-not-recommend)
  - [Install HarfBuzz with Homebrew (Would Purchase Again)](#install-harfbuzz-with-homebrew-would-purchase-again)
  - [Available HarfBuzz Command Line Tools](#available-harfbuzz-command-line-tools)
- [HarfBuzzJS](#harfbuzzjs)
- [OpenType Glyf Names and SVG Element IDs](#opentype-glyf-names-and-svg-element-ids)
- [Links](#links)
- [Skia Canvas](#skia-canvas)
- [RazrFalcon `ttf-parser`](#razrfalcon-ttf-parser)
- [RazrFalcon RustyBuzz](#razrfalcon-rustybuzz)
- [Tests and Benchmarks](#tests-and-benchmarks)
- [To Do](#to-do)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## What is a 'Font'?

* The **3F** formula: `Font = File + Features` **NOTE** possible to be changed to: **3F** formula: `Font =
  File + Face + Features`
* *not* your MS Word's concept of 'font'
* *no* glyph substitution
* *no* 'styles': think of it like in hot metal typesetting: when you have a stretch in upright Garamond with
  an interspersed word in italic Garamond, you still need to pick those sorts from two different cases. The
  fact they both have 'Garamond' on their labels is incidental—helpful to choose a matching italic but by no
  means the only possible or reasonable choice. For what it's worth I personally almost never use a serif
  bold weight to go with the medium-weight typeface from the 'same font (series)'; rather, I choose a bold
  sans-serif or Egyptienne to do the job. It goes without saying that in almost all cases synthetically
  generated bold and slanted styles are to be avoided unless you know what you're doing.
* For the purposes of the current document, we will always assume a 'font' is restricted to the set of
  outlines present in the same font file. There's no keeping designers from mixing serifs, sans-serifs, bold
  and regular in a single file, of course, but we are here not concerned with this aesthetic aspect of
  typesetting. We then only talk about stretches of text that, when typeset, will share
  * outlines from the *same font file*,
  * with the *same set of OpenType features*,
  * in the *same nominal size*,
  * using the *same language settings* (which may affect handling of typographic details).
* At a future point in time, this *might* get relaxed (read: made more complex) by allowing change of OT
  features and/or language settings *within* a given contiguous stretch of text; however,
* changing the font file within a stretch of text will always remain outside the purview of the present
  document.
* Of course, multilingual typesetting and typesetting with interspersed style changes (think italic, bold,
  monospaced type) *necessitates* combining several fonts (in the above sense), and so does dealing with
  glyf substitution (by which I mean fetching an outline from another source because your primary font does
  not have one for a given character, or you want to get a replacement for aesthetic reasons).
* Furthermore, typesetting justified text necessitates variations in the distances between individual words
  (and sometimes letters).
* None of the above two—dealing with multiple fonts or variable spacing between words—are dealt with in the
  present document.
* However, dealing with variable inter-character spacing *should* be part of this document; we will gloss
  over this detail for the moment.

## What are 'Glyphs' and 'Glyfs'?

* **Glyph**—a general term similar to 'character' and '(Unicode) codepoint'.
* **Glyf**—specifically, the outline stored under a certain Gylf Name and Glyf ID (yes, everything is
  doubly indexed in the crazy world of fonts).
* if you find it hard to distinguish (font) 'glyf' and (Unicode) 'glyph', substitute the two with
  * **Glyph**: 'codepoint' or 'character' (strictly speaking, these two are different, and different again
    from 'code unit' and, of course, 'byte')
  * **Glyf**: 'outline' (as in: a geometric shape, the figure to be drawn), and
  * Notice all of these terms are somewhat related but categorically distinct from such terms as 'encoding',
    'Unicode', 'UTF-8', and the scarily infelicitous 'charset' (which you should probably not use at all)
* a font glyf may or may not directly correspond to a Unicode glyph (codepoint, character);
  * specifically, given a font and a codepoint, the font may have zero, one, or several glyfs (outlines) for
    that codepoint.

## What is 'Text Shaping'?

Text shaping is the process of
* taking in a Font in the above sense—that is, a combination of a path (like
  `my/fonts/Helvetica.otf`) and a set of OpenType features (given e.g. as a short snippet of text)—plus a
  Unicode text (a string of Unicode codepoints, say, `'affiliate'`), and
* returning a set of geometrically positioned glyfs (outlines). The outlines may be just identified by
  Glyf Names (or Glyf IDs, as the case may be), and / or be detailed as sets of curves (as usable in an
  SVG vector image) or dots (as used in a PNG raster image).


## `FTGL`

```sh
libftgl-dev
libftgl2
```

???

## FontKit (NodeJS, Browser)

* [`fontkit`](https://github.com/foliojs/fontkit)

* [`fontkit-next`](https://github.com/Hopding/fontkit)—used in
  [`pdf-lib`](https://github.com/Hopding/pdf-lib) (see also [here](https://pdf-lib.js.org/#examples))
  **NOTE** `pdf-lib` can draw SVG paths to PDF, so...

* [`fonteditor-core`](https://github.com/kekee000/fonteditor-core)
  * **NOTE** **fonteditor-core does not lend itself for typesetting b/c it lacks text shaping abilities**
  * **NOTE** **Also, fails to load EBGaramond08-Italic which other solutions do load**
  * sfnt parse
  * read, write, transform fonts
    * ttf (read and write)
    * woff (read and write)
    * woff2 (read and write)
    * eot (read and write)
    * svg (read and write)
    * otf (only read)
  * ttf glyph adjust
  * svg to glyph
  * also see [`fonteditor` (在线字体编辑器)](https://github.com/ecomfe/fonteditor)


## PyCairo

https://pycairo.readthedocs.io/en/latest/reference/glyph.html



## HarfBuzz

### Install HarfBuzz as APT Package (Would Not Recommend)

While there are fairly recent packages for HarfBuzz in APT, on my Linux Mint 19.3 machine (which is
arguably a bit outdated as of January, 2021), all I get with `sudo apt install libharfbuzz-bin` is version
1.7.2 which is from December, 2017. Not only is this 3 years old software, it also has had a *lot* of
updates in the meantime.

Sadly, this state of affairs is par of the course for the APT/DPKG (or whatcha may call it) ecosystem.
Fortunately, there other options, for which see below.

### Install HarfBuzz with Homebrew (Would Purchase Again)

```sh
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval $(/home/linuxbrew/.linuxbrew/bin/brew shellenv)' >> ~/.zshenv
eval $(/home/linuxbrew/.linuxbrew/bin/brew shellenv)
brew install gcc
brew install harfbuzz
```

This gives you the following executables; the version is 2.7.4 as of January, 2021:

```sh
/home/linuxbrew/.linuxbrew/bin/hb-ot-shape-closure
/home/linuxbrew/.linuxbrew/bin/hb-shape
/home/linuxbrew/.linuxbrew/bin/hb-subset
/home/linuxbrew/.linuxbrew/bin/hb-view
```

Observe there's even a new executable here, `hb-subset`, which isn't even included if you were to `sudo apt
install libharfbuzz-bin`.


### Available HarfBuzz Command Line Tools


* `hb-ot-shape-closure`—gives the set of characters contained in a string, represented as single characters
  and/or single character names. Example: hb-ot-shape-closure /usr/share/fonts/dejavu/DejaVuSans.ttf "Hello
  World.".

* `hb-shape`—is used for the conversion of text strings into positioned glyphs.

* `hb-subset`—is used to create subsets of fonts, and display text using them.

* `hb-view`—displays a graphical view of a string shape using a particular font as a set of glyphs. The
  output format is automatically defined by the file extension, the supported ones being
  ansi/png/svg/pdf/ps/eps. For example: hb-view --output-file=hello.png
  /usr/share/fonts/dejavu/DejaVuSans.ttf "Hello World.".

See [*Usage Notes for `hb-shape`, `hb-view`, `hb-subset`, and
`hb-ot-shape-closure`*](hb-command-line-reference.md) for details on command line arguments.

## HarfBuzzJS

Make sure you have the most recent `wasm-ld`; clone https://github.com/harfbuzz/harfbuzzjs` and build:

```sh
brew install llvm
git clone https://github.com/harfbuzz/harfbuzzjs
cd harfbuzzjs
./build.sh
```

The above will produce `hb.wasm`, the HarfBuzz library as WebAssembly.


## OpenType Glyf Names and SVG Element IDs

This section tries to answer the question whether any kind of processing / escaping /substitution should be
performed on OpenType Glyf Names in order to make them usable as SVG Element IDs (needed to reference glyph
outlines as SVG symbols). Previously it had been planned to use (numerical) Glyf IDs (GIDs) as these are
syntactically more predictable than Glyf Names; the current thinking, however, is to prefer Glyf Names since
these are deemed to be more informative, more legible, and somewhat better standardized across fonts than
Glyph IDs (which are always specific to a given font file and meaningless outside that context).

* Syntactically speaking, OpenType Glyf Names are rather restricted as per [the
  spec](https://adobe-type-tools.github.io/afdko/OpenTypeFeatureFileSpecification.html#2.f.i):

  > A glyph name may be up to 63 characters in length, must be entirely comprised of characters from the
  > following set:
  >
  >
  >     ABCDEFGHIJKLMNOPQRSTUVWXYZ
  >     abcdefghijklmnopqrstuvwxyz
  >     0123456789
  >     .  # period
  >     _  # underscore
  >
  > and must not start with a digit or period. The only exception is the special character “.notdef”.
  >
  > “twocents”, “a1”, and “\_” are valid glyph names. “2cents” and “.twocents” are not.

* Likewise, per the [spec](https://svgwg.org/svg2-draft/struct.html#IDAttribute), allowable values for SVG Element IDs must be
  valid [XML 1.0 Name Tokens](https://www.w3.org/TR/xml/#NT-Name), which are given as:

  >     [4]     NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
  >     [4a]    NameChar      ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
  >     [5]     Name          ::= NameStartChar (NameChar)*

* Observe that in HTML5 (but not earlier versions), [most restrictions on ID values have been
  removed](https://html.spec.whatwg.org/multipage/dom.html#the-id-attribute); to quote: "There are no other
  restrictions on what form an ID can take; in particular, IDs can consist of just digits, start with a
  digit, start with an underscore, consist of just punctuation, etc."

* The [W3C Validator](https://validator.w3.org/) does indeed complain if an SVG document contains IDs such
  as `---` or `:---:`; however, Chromium and the Linux Mint Image Viewer seems to be unfazed and both
  display the SVG just fine. *Do not use whitespace in IDs though, as these have been observed to cause
  errors in applications.*

**Conclusion** OpenType Glyf Names are largely a subset of allowable XML IDs, with the sole exception of
`.notdef`. But since this value nor any of the more questionable ones like `---` and `:---:` caused display
errors in viewers or browsers tested, we will assume that **OpenType Glyf Names may be used as-is in SVG ID
attributes; no escaping need be done, and, assuming that reasonable fonts stick to the OT spec, no
validation will be needed either**.


## Links


* https://lfs-hk.koddos.net/blfs/view/systemd/general/harfbuzz.html has info about
  `hb-ot-shape-closure`, `hb-shape`, `hb-subset`, and `hb-view`
* [*HarfBuzz OT+AAT "Unishaper"* by Behdad Esfahbod, Aug. 23,
  2020](https://prezi.com/view/THNPJGFVDUCWoM20syev/)
* [Homepage of Behdad Esfahbod, author of HarfBuzz](http://behdad.org/)
* [Blog of Behdad Esfahbod](https://medium.com/@behdadesfahbod)
* [*HarfBuzz* on Wikipedia](https://en.wikipedia.org/wiki/HarfBuzz)
* [*HarfBuzz Manual*](https://harfbuzz.github.io/)
* [`uharfbuzz` for Python/Cython](https://github.com/harfbuzz/uharfbuzz)
* [*The journey of a word: how text ends up on a page* by Simon Cozens @ linux conf au
  2017](https://www.youtube.com/watch?v=Is4PW6f4Pk4)
* Language bindings:
  * https://github.com/rougier/freetype-py
  * https://github.com/foliojs/fontkit, An advanced font engine for Node and the browser
  * https://docs.rs/harfbuzz-sys/0.5.0/harfbuzz_sys/, https://github.com/servo/rust-harfbuzz, Rust bindings
    to the Harfbuzz text shaping engine
  * https://github.com/Brooooooklyn/skia-rs/issues/156 Skia does some kind of text shaping with ?HarfBuzz?
    but `skia-rs` is not there, yet (Feb 2021)

## Skia Canvas

* https://github.com/samizdatco/skia-canvas#fontlibrary (also see https://github.com/Automattic/node-canvas
  which is based on Cairo; cf. https://www.skypack.dev/search?q=skia for options for running Skia in NodeJS)

> Skia Canvas is a browser-less implementation of the HTML Canvas drawing API for Node.js. It is based on
> Google’s [Skia](https://skia.org) graphics engine and as a result produces very similar results to
> Chrome’s `<canvas>` element.
>
> While the primary goal of this project is to provide a reliable emulation of the [standard
> API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) according to the
> [spec](https://html.spec.whatwg.org/multipage/canvas.html), it also extends it in a number of areas that
> are more relevant to the generation of static graphics files rather than ‘live’ display in a browser.
>
> In particular, Skia Canvas:
>
>   - is fast and compact since all the heavy lifting is done by native code written in Rust and C++
>   - can generate output in both raster (JPEG & PNG) and vector (PDF & SVG) image formats
>   - can save images to [files](#saveasfilename-format-quality), return them as
>     [Buffers](#tobufferformat-quality-page), or encode [dataURL](#todataurlformat-quality-page) strings
>   - can create [multiple ‘pages’](#newpagewidth-height) on a given canvas and then
>     [output](#saveasfilename-format-quality) them as a single, multi-page PDF or an image-sequence saved
>     to multiple files
>   - fully supports the [CSS filter effects][filter] image processing operators
>   - offers rich typographic control including:
>
>     - multi-line, [word-wrapped](#textwrap) text
>     - line-by-line [text metrics](#measuretextstr-width)
>     - small-caps, ligatures, and other opentype features accessible using standard
>       [font-variant](#fontvariant) syntax
>     - proportional letter-spacing (a.k.a. [‘tracking’](#texttracking)) and leading
>     - support for [variable fonts][VariableFonts] and transparent mapping of weight values
>     - use of non-system fonts [loaded](#usefamilyname-fontpaths) from local files

## RazrFalcon `ttf-parser`

`ttf-parser` is a high-level, safe, zero-allocation TrueType font parser written in Rust.

* https://github.com/RazrFalcon/ttf-parser
* <strike>does it open `*.otf` files?</strike> `ttf-parser` does parse OTFs
* <strike>does it output SVG paths? Maybe, see
  https://github.com/RazrFalcon/ttf-parser/blob/master/examples/font2svg.rs</strike> It can output SVG
  paths, see below

```sh
git clone https://github.com/RazrFalcon/ttf-parser
cd ttf-parser
cargo build
cargo build --examples

target/debug/examples/font-info path/to/fonts/Ubuntu-R.ttf
target/debug/examples/font2svg path/to/fonts/Ubuntu-R.ttf Ubuntu-R.ttf.svg
```

* might want to patch `examples/font2svg.rs` (and recompile with `cargo build --examples`):

```rust
use std::path::PathBuf;
use std::io::Write;

use ttf_parser as ttf;
use svgtypes::WriteBuffer;

// was: const FONT_SIZE: f64 = 128.0;
const FONT_SIZE: f64 = 1000.0;
// was: const COLUMNS: u32 = 100;
const COLUMNS: u32 = 16;
```

## RazrFalcon RustyBuzz

* https://github.com/RazrFalcon/rustybuzz, A complete harfbuzz's shaping algorithm port to Rust

```sh
git clone https://github.com/RazrFalcon/rustybuzz
cd rustybuzz
cargo build --examples
target/debug/examples/shape path/to/font.otf 'some text'
```

## Tests and Benchmarks

* relevant business logic code implemented in this repo, tests and benchmarks in
  [𐌷𐌴𐌽𐌲𐌹𐍃𐍄](https://github.com/loveencounterflow/hengist/tree/master/dev/glyphshapes-and-typesetting-with-harfbuzz)
* tested libraries:
  * [HarfBuzz](https://github.com/harfbuzz/harfbuzz) is considered the Gold Standard for correctness and the
    Base Line for performance
  * [HarfBuzzJS](https://github.com/harfbuzz/harfbuzzjs)
    * apparently there are two variants, `harfbuzzjs/examples/nohbjs.html` and
      `harfbuzzjs/examples/hbjs.example.html`
    * see https://github.com/harfbuzz/harfbuzzjs/issues/10
  * [opentype.js](https://github.com/opentypejs/opentype.js)
  * [Fontkit](https://github.com/foliojs/fontkit)
  * [rustybuzz](https://github.com/razrfalcon/rustybuzz)
  * (future): generate interface to HarfBuzz using [`ffi-napi`](https://github.com/node-ffi-napi/node-ffi-napi)
    and call into C libraries from JS.—Also see
    * https://www.sysleaf.com/nodejs-ffi/
    * https://medium.com/@koistya/how-to-call-c-c-code-from-node-js-86a773033892
    * https://medium.com/jspoint/a-simple-guide-to-load-c-c-code-into-node-js-javascript-applications-3fcccf54fd32
* test for
  * glyf selection correctness
  * OTF features
  * performance
  * outline matching

## To Do

* [ ] discuss OT font faces, adapt discussion of 'one font per file' policy
* [ ] discuss HarfBuzz switch `--variations` vs switch `--features`
* [ ] <strike>add https://github.com/nasser/node-harfbuzz to benchmarks</strike> (compilation on Linux Mint
  fails although `libharfbuzz-dev` v1.7.2 is installed)



<!--

~/temp/harfbuzz-links.txt
~/.cache/Homebrew/harfbuzz--2.8.1
~/.cache/ms-playwright/webkit-1219/minibrowser-gtk/libharfbuzz.so.0
~/.pnpm-store/v3/github.com/nasser/node-harfbuzz@7ef478a9545442ad5fce9add7290c40565160cf8
~/.pnpm-store/v3/github.com/nasser/node-harfbuzz@7ef478a9545442ad5fce9add7290c40565160cf8/integrity.json
~/.pnpm-store/v3/metadata/registry.npmjs.org/harfbuzzjs.json
~/jzr/ucdb/public/opentypejs-harfbuzz-svg
~/jzr/ucdb/public/opentypejs-harfbuzz-svg/sample-svg.html
~/jzr/ucdb/public/opentypejs-harfbuzz-svg/sample-glyph.svg
~/jzr/ucdb/public/opentypejs-harfbuzz-svg/sample-font.svg
~/jzr/ucdb/lib/experiments/write-opentypejs-outlines-svg-with-harfbuzz-metrics.js.map
~/jzr/glyphshapes-and-typesetting-with-harfbuzz
~/jzr/interplot/src/experiments/harfbuzzjs-fontmetrics.coffee
~/jzr/interplot/lib/experiments/harfbuzzjs-fontmetrics.js
~/jzr/interplot/lib/experiments/harfbuzzjs-fontmetrics.js.map
~/jzr/rustybuzz-wasm
~/jzr/hengist/apps/glyphshapes-and-typesetting-with-harfbuzz
~/jzr/hengist/apps/rustybuzz-wasm
~/jzr/hengist/dev/glyphshapes-and-typesetting-with-harfbuzz
~/jzr/hengist/dev/glyphshapes-and-typesetting-with-harfbuzz/src
~/jzr/hengist/dev/glyphshapes-and-typesetting-with-harfbuzz/src/basics.test.coffee
~/jzr/hengist/dev/glyphshapes-and-typesetting-with-harfbuzz/src/main.tests.coffee
~/jzr/hengist/dev/glyphshapes-and-typesetting-with-harfbuzz/src/textshaping.benchmarks.coffee
~/jzr/hengist/dev/glyphshapes-and-typesetting-with-harfbuzz/src/rustybuzz-wasm-text-shaping-call-arities.benchmarks.coffee
~/jzr/intershop-intertext/intershop_modules/myharfbuzz.py
~/jzr/intershop-intertext/db/tests/100-harfbuzz.tests.sql
~/jzr/intershop-intertext/db/100-harfbuzz.sql
~/3rd-party-repos/rustybuzz
~/3rd-party-repos/harfbuzz
~/3rd-party-repos/harfbuzzjs
~/3rd-party-repos/ttf-parser/testing-tools/font-view/harfbuzzfont.cpp

->
