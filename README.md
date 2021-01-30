


# Glyphshapes and Typesetting with HarfBuzz (and NodeJS &c)


<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Debian Packages](#debian-packages)
- [Command Lines](#command-lines)
  - [Short Descriptions](#short-descriptions)
  - [Create SVG Files with Rendered Text on the Command Line(!)](#create-svg-files-with-rendered-text-on-the-command-line)
  - [`hb-shape`](#hb-shape)
- [`hb-view`](#hb-view)
- [Links](#links)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


## Debian Packages

HarfBuzz packages with binaries:

```sh
libharfbuzz-bin
```

Other packages:

```sh
libharfbuzz0b
libharfbuzz-icu0
libharfbuzz-gobject0
libharfbuzz-dev
```


## Command Lines

```sh
dpkg --listfiles libharfbuzz-bin
less /usr/share/doc/libharfbuzz-bin
man hb-shape
hb-shape --help
hb-view --help
hb-view DejaVuSansCondensed.ttf 'helo world'
hb-view EBGaramond12-Regular.otf 'helo world'
hb-view EBGaramond12-Regular.otf 'agffix'
hb-shape EBGaramond12-Regular.otf 'agffix'
hb-shape --help-output
hb-shape --output-format=text/json EBGaramond12-Regular.otf 'agffix'
hb-shape --output-format=text/json EBGaramond12-Regular.otf 'agffix' | less
hb-shape --help-output-syntax
hb-shape --output-format=text/json --no-glyph-names EBGaramond12-Regular.otf 'agffix' | less
hb-shape --output-format=text/json --no-glyph-names --verbose EBGaramond12-Regular.otf 'agffix' | less
hb-shape --output-format=text/json --no-glyph-names --show-extents --verbose EBGaramond12-Regular.otf 'agffix' | less
hb-shape --output-format=json --no-glyph-names --show-extents --verbose EBGaramond12-Regular.otf 'agffix' | less
```



```sh
dpkg --listfiles libharfbuzz-bin
/usr/bin/hb-ot-shape-closure
/usr/bin/hb-shape
/usr/bin/hb-view
```

### Short Descriptions


* `hb-ot-shape-closure`—gives the set of characters contained in a string, represented as single characters
  and/or single character names. Example: hb-ot-shape-closure /usr/share/fonts/dejavu/DejaVuSans.ttf "Hello
  World.".

* `hb-shape`—is used for the conversion of text strings into positioned glyphs.

* `hb-subset`—is used to create subsets of fonts, and display text using them.

* `hb-view`—displays a graphical view of a string shape using a particular font as a set of glyphs. The
  output format is automatically defined by the file extension, the supported ones being
  ansi/png/svg/pdf/ps/eps. For example: hb-view --output-file=hello.png
  /usr/share/fonts/dejavu/DejaVuSans.ttf "Hello World.".


### Create SVG Files with Rendered Text on the Command Line(!)

```sh
hb-view --output-file=rendered.svg EBGaramond12-Regular.otf 'agffix'
```

### `hb-shape`

```sh
Usage:
  hb-shape [OPTION…] [FONT-FILE] [TEXT]

Help Options:
  -h, --help                             Show help options
  --help-all                             Show all help options
  --help-font                            Options for the font
  --help-variations                      Options for font variations used
  --help-text                            Options for the input text
  --help-shape                           Options for the shaping process
  --help-features                        Options for font features used
  --help-output                          Options for the destination & form of the output
  --help-output-syntax                   Options for the syntax of the output

Font options:
  --font-file=filename                   Set font file-name
  --face-index=index                     Set face index (default: 0)
  --font-size=1/2 numbers or 'upem'      Font size (default: upem)
  --font-funcs=impl                      Set font functions implementation to use (default: ft)

    Supported font function implementations are: ft/ot

Varitions options:
  --variations=list                      Comma-separated list of font variations

    Variations are set globally. The format for specifying variation settings
    follows.  All valid CSS font-variation-settings values other than 'normal'
    and 'inherited' are also accepted, though, not documented below.

    The format is a tag, optionally followed by an equals sign, followed by a
    number. For example:

      "wght=500"
      "slnt=-7.5"


Text options:
  --text=string                          Set input text
  --text-file=filename                   Set input text file-name

    If no text is provided, standard input is used for input.

  -u, --unicodes=list of hex numbers     Set input Unicode codepoints
  --text-before=string                   Set text context before each line
  --text-after=string                    Set text context after each line

Shape options:
  --list-shapers                         List available shapers and quit
  --shapers=list                         Set comma-separated list of shapers to try
  --direction=ltr/rtl/ttb/btt            Set text direction (default: auto)
  --language=langstr                     Set text language (default: $LANG)
  --script=ISO-15924 tag                 Set text script (default: auto)
  --bot                                  Treat text as beginning-of-paragraph
  --eot                                  Treat text as end-of-paragraph
  --preserve-default-ignorables          Preserve Default-Ignorable characters
  --utf8-clusters                        Use UTF8 byte indices, not char indices
  --cluster-level=0/1/2                  Cluster merging level (default: 0)
  --normalize-glyphs                     Rearrange glyph clusters in nominal order
  --verify                               Perform sanity checks on shaping results
  --num-iterations=N                     Run shaper N times (default: 1)

Features options:
  --features=list                        Comma-separated list of font features

    Features can be enabled or disabled, either globally or limited to
    specific character ranges.  The format for specifying feature settings
    follows.  All valid CSS font-feature-settings values other than 'normal'
    and 'inherited' are also accepted, though, not documented below.

    The range indices refer to the positions between Unicode characters,
    unless the --utf8-clusters is provided, in which case range indices
    refer to UTF-8 byte indices. The position before the first character
    is always 0.

    The format is Python-esque.  Here is how it all works:

      Syntax:       Value:    Start:    End:

    Setting value:
      "kern"        1         0         ∞         # Turn feature on
      "+kern"       1         0         ∞         # Turn feature on
      "-kern"       0         0         ∞         # Turn feature off
      "kern=0"      0         0         ∞         # Turn feature off
      "kern=1"      1         0         ∞         # Turn feature on
      "aalt=2"      2         0         ∞         # Choose 2nd alternate

    Setting index:
      "kern[]"      1         0         ∞         # Turn feature on
      "kern[:]"     1         0         ∞         # Turn feature on
      "kern[5:]"    1         5         ∞         # Turn feature on, partial
      "kern[:5]"    1         0         5         # Turn feature on, partial
      "kern[3:5]"   1         3         5         # Turn feature on, range
      "kern[3]"     1         3         3+1       # Turn feature on, single char

    Mixing it all:

      "aalt[3:5]=2" 2         3         5         # Turn 2nd alternate on for range

Output destination & format options:
  -o, --output-file=filename             Set output file-name (default: stdout)
  -O, --output-format=format             Set output format

    Supported output formats are: text/json

Output syntax:
    text: [<glyph name or index>=<glyph cluster index within input>@<horizontal displacement>,<vertical displacement>+<horizontal advance>,<vertical advance>|...]
    json: [{"g": <glyph name or index>, "ax": <horizontal advance>, "ay": <vertical advance>, "dx": <horizontal displacement>, "dy": <vertical displacement>, "cl": <glyph cluster index within input>}, ...]

Output syntax options:
  --show-text                            Prefix each line of output with its corresponding input text
  --show-unicode                         Prefix each line of output with its corresponding input codepoint(s)
  --show-line-num                        Prefix each line of output with its corresponding input line number
  -v, --verbose                          Prefix each line of output with all of the above
  --no-glyph-names                       Output glyph indices instead of names
  --no-positions                         Do not output glyph positions
  --no-clusters                          Do not output cluster indices
  --show-extents                         Output glyph extents
  --show-flags                           Output glyph flags
  -V, --trace                            Output interim shaping results

Application Options:
  --version                              Show version numbers
  --debug                                Free all resources before exit

```

## `hb-view`

```sh
hb-view --help-all
Usage:
  hb-view [OPTION…] [FONT-FILE] [TEXT]

Help Options:
  -h, --help                             Show help options
  --help-all                             Show all help options
  --help-font                            Options for the font
  --help-variations                      Options for font variations used
  --help-text                            Options for the input text
  --help-shape                           Options for the shaping process
  --help-features                        Options for font features used
  --help-output                          Options for the destination & form of the output
  --help-view                            Options for output rendering

Font options:
  --font-file=filename                   Set font file-name
  --face-index=index                     Set face index (default: 0)
  --font-size=1/2 numbers or 'upem'      Font size (default: 256)
  --font-funcs=impl                      Set font functions implementation to use (default: ft)

    Supported font function implementations are: ft/ot

Varitions options:
  --variations=list                      Comma-separated list of font variations

    Variations are set globally. The format for specifying variation settings
    follows.  All valid CSS font-variation-settings values other than 'normal'
    and 'inherited' are also accepted, though, not documented below.

    The format is a tag, optionally followed by an equals sign, followed by a
    number. For example:

      "wght=500"
      "slnt=-7.5"


Text options:
  --text=string                          Set input text
  --text-file=filename                   Set input text file-name

    If no text is provided, standard input is used for input.

  -u, --unicodes=list of hex numbers     Set input Unicode codepoints
  --text-before=string                   Set text context before each line
  --text-after=string                    Set text context after each line

Shape options:
  --list-shapers                         List available shapers and quit
  --shapers=list                         Set comma-separated list of shapers to try
  --direction=ltr/rtl/ttb/btt            Set text direction (default: auto)
  --language=langstr                     Set text language (default: $LANG)
  --script=ISO-15924 tag                 Set text script (default: auto)
  --bot                                  Treat text as beginning-of-paragraph
  --eot                                  Treat text as end-of-paragraph
  --preserve-default-ignorables          Preserve Default-Ignorable characters
  --utf8-clusters                        Use UTF8 byte indices, not char indices
  --cluster-level=0/1/2                  Cluster merging level (default: 0)
  --normalize-glyphs                     Rearrange glyph clusters in nominal order
  --verify                               Perform sanity checks on shaping results
  --num-iterations=N                     Run shaper N times (default: 1)

Features options:
  --features=list                        Comma-separated list of font features

    Features can be enabled or disabled, either globally or limited to
    specific character ranges.  The format for specifying feature settings
    follows.  All valid CSS font-feature-settings values other than 'normal'
    and 'inherited' are also accepted, though, not documented below.

    The range indices refer to the positions between Unicode characters,
    unless the --utf8-clusters is provided, in which case range indices
    refer to UTF-8 byte indices. The position before the first character
    is always 0.

    The format is Python-esque.  Here is how it all works:

      Syntax:       Value:    Start:    End:

    Setting value:
      "kern"        1         0         ∞         # Turn feature on
      "+kern"       1         0         ∞         # Turn feature on
      "-kern"       0         0         ∞         # Turn feature off
      "kern=0"      0         0         ∞         # Turn feature off
      "kern=1"      1         0         ∞         # Turn feature on
      "aalt=2"      2         0         ∞         # Choose 2nd alternate

    Setting index:
      "kern[]"      1         0         ∞         # Turn feature on
      "kern[:]"     1         0         ∞         # Turn feature on
      "kern[5:]"    1         5         ∞         # Turn feature on, partial
      "kern[:5]"    1         0         5         # Turn feature on, partial
      "kern[3:5]"   1         3         5         # Turn feature on, range
      "kern[3]"     1         3         3+1       # Turn feature on, single char

    Mixing it all:

      "aalt[3:5]=2" 2         3         5         # Turn 2nd alternate on for range

Output destination & format options:
  -o, --output-file=filename             Set output file-name (default: stdout)
  -O, --output-format=format             Set output format

    Supported output formats are: ansi/png/svg/pdf/ps/eps

View options:
  --annotate                             Annotate output rendering
  --background=rrggbb/rrggbbaa           Set background color (default: #FFFFFF)
  --foreground=rrggbb/rrggbbaa           Set foreground color (default: #000000)
  --line-space=units                     Set space between lines (default: 0)
  --margin=one to four numbers           Margin around output (default: 16)

Application Options:
  --version                              Show version numbers
  --debug                                Free all resources before exit
```



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


