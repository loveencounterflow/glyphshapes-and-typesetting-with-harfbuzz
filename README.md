<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Glyphshapes and Typesetting with Harbuzz (and NodeJS &c)](#glyphshapes-and-typesetting-with-harbuzz-and-nodejs-c)
  - [Command Lines](#command-lines)
    - [`hb-shape`](#hb-shape)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->


# Glyphshapes and Typesetting with Harbuzz (and NodeJS &c)

## Command Lines

```sh
dpkg --listfiles libharfbuzz-bin
less /usr/share/doc/libharfbuzz-bin
man hb-shape
hb-shape --help
hb-view --help
hb-view ~/jzr/hengist/assets/jizura-fonts/DejaVuSansCondensed.ttf 'helo world'
hb-view ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'helo world'
hb-view ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix'
hb-shape ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix'
hb-shape --help-output
hb-shape --output-format=text/json ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix'
hb-shape --output-format=text/json ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix' | less
hb-shape --help-output-syntax
hb-shape --output-format=text/json --no-glyph-names ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix' | less
hb-shape --output-format=text/json --no-glyph-names --verbose ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix' | less
hb-shape --output-format=text/json --no-glyph-names --show-extents --verbose ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix' | less
hb-shape --output-format=json --no-glyph-names --show-extents --verbose ~/jzr/hengist/assets/jizura-fonts/EBGaramond12-Regular.otf 'agffix' | less
```



```sh
dpkg --listfiles libharfbuzz-bin
/usr/bin/hb-ot-shape-closure
/usr/bin/hb-shape
/usr/bin/hb-view
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








<!--

#### `hb-shape`: Output

```sh
hb-shape --help-output
Usage:
  hb-shape [OPTION…] [FONT-FILE] [TEXT]

Output destination & format options:
  -o, --output-file=filename             Set output file-name (default: stdout)
  -O, --output-format=format             Set output format

    Supported output formats are: text/json
```


#### `hb-shape`: Output Syntax

```sh
hb-shape --help-output-syntax
  hb-shape [OPTION…] [FONT-FILE] [TEXT]

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
```

-->


