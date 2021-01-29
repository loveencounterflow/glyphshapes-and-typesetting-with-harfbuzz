<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Glyphshapes and Typesetting with Harbuzz (and NodeJS &c)](#glyphshapes-and-typesetting-with-harbuzz-and-nodejs-c)
  - [Command Lines](#command-lines)

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







