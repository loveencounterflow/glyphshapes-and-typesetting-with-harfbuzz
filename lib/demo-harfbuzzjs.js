(function() {
  'use strict';
  var CND, FS, HB, PATH, alert, badge, debug, demo_outline, demo_text_shape, echo, help, info, isa, rpr, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DEMO-HARFBUZZJS';

  debug = CND.get_logger('debug', badge);

  alert = CND.get_logger('alert', badge);

  whisper = CND.get_logger('whisper', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  info = CND.get_logger('info', badge);

  echo = CND.echo.bind(CND);

  //...........................................................................................................
  FS = require('fs');

  PATH = require('path');

  HB = null;

  this.types = require('./types');

  ({isa, validate} = this.types.export());

  warn(CND.reverse("* harfbuzzjs doesn't have font feature switches"));

  // warn()
  // warn CND.reverse "this code has been moved to jzr/font-outlines-as-svg"
  // process.exit 1

  //-----------------------------------------------------------------------------------------------------------
  demo_text_shape = function(path, text) {
    var R, blob, buffer, face, features, filename, font, font_blob;
    filename = PATH.basename(path);
    font_blob = new Uint8Array(FS.readFileSync(path));
    blob = HB.createBlob(font_blob);
    face = HB.createFace(blob, 0);
    font = HB.createFont(face);
    /* NOTE Units per em. Optional; taken from font if not given */
    font.setScale(1000, 1000);
    buffer = HB.createBuffer();
    try {
      buffer.addText(text);
      buffer.guessSegmentProperties();
      /* NOTE optional as can be set by guessSegmentProperties also: */
      // buffer.setDirection 'ltr'
      /* TAINT silently discards unknown features */
      features = {
        kern: true,
        liga: true,
        xxx: true
      };
      HB.shape(font, buffer, features);
      R = buffer.json(font);
      demo_outline(filename, font, R);
    } finally {
      // bbox = xmin + ' ' + ymin + ' ' + width + ' ' + height;
      // "<svg xmlns='http://www.w3.org/2000/svg' height='128' viewBox='#{bbox}'>"
      // "<path d='#{svg_path}'/></svg>"
      buffer.destroy();
      font.destroy();
      face.destroy();
      blob.destroy();
    }
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  demo_outline = function(filename, font, text_shape) {
    var R, cursor_x, cursor_y, delta_x, dx, dy, gid, glyph, i, len, svg_path;
    cursor_x = 0;
    cursor_y = 0;
    R = [];
    for (i = 0, len = text_shape.length; i < len; i++) {
      glyph = text_shape[i];
      gid = glyph.g;
      delta_x = glyph.ax;
      dx = glyph.dx;
      dy = glyph.dy;
      svg_path = font.glyphToPath(gid);
      debug('^3234234^', CND.yellow(filename), CND.lime(gid), CND.steel((rpr(svg_path)).slice(0, 101)));
      R.push(svg_path);
      // # You need to supply this bit
      // drawAGlyph(svg_path, cursor_x + dx, dy)
      cursor_x += delta_x;
    }
    return R;
  };

  //===========================================================================================================
  // HIGH-LEVEL API
  //-----------------------------------------------------------------------------------------------------------
  this.shape_text = async function(cfg) {
    var arrangement, outlines;
    arrangement = (await this.arrange_text(cfg));
    cfg = {...cfg, arrangement};
    outlines = (await this.fetch_outlines_fast(cfg));
    return {arrangement, outlines};
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      var d, i, j, len, len1, path, paths, ref, resolve_path, text;
      HB = (await require('../../../3rd-party-repos/harfbuzzjs'));
      // result.instance.exports.memory.grow(400); // each page is 64kb in size
      resolve_path = function(path) {
        return PATH.resolve(PATH.join(__dirname, '../fonts', path));
      };
      // text          = 'Just Text.做過很多'
      text = 'abcdefABCDEF';
      // 'unifraktur/UnifrakturMaguntia16.ttf'
      // 'SourceHanSans-Bold003.ttf'
      // # 'HanaMinExB.otf'
      paths = ['FZKaiT.TTF'];
// 'Ubuntu-R.ttf'
// 'DejaVuSansCondensed-Bold.ttf'
// 'NotoSerifJP/NotoSerifJP-Bold.otf'
// 'EBGaramond08-Italic.otf'
// 'EBGaramond08-Regular.otf'
// 'EBGaramond12-AllSC.otf'
// 'EBGaramond12-Italic.otf'
// 'EBGaramond12-Regular.otf'
// 'EBGaramond-InitialsF1.otf'
// 'EBGaramond-InitialsF2.otf'
// 'EBGaramond-Initials.otf'
// 'EBGaramondSC08-Regular.otf'
// 'EBGaramondSC12-Regular.otf'
      for (i = 0, len = paths.length; i < len; i++) {
        path = paths[i];
        ref = demo_text_shape(resolve_path(path), text);
        for (j = 0, len1 = ref.length; j < len1; j++) {
          d = ref[j];
          null;
        }
      }
      // urge d
      return null;
    })();
  }

}).call(this);

//# sourceMappingURL=demo-harfbuzzjs.js.map