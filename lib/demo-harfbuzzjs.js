(function() {
  'use strict';
  var CND, FS, HBJS, PATH, __demo_outline, __demo_text_shape, alert, badge, debug, echo, harfbuzzjs_path, help, info, isa, rpr, urge, validate, warn, whisper;

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

  this.types = require('./types');

  ({isa, validate} = this.types.export());

  HBJS = null;

  harfbuzzjs_path = '../../../3rd-party-repos/harfbuzzjs';

  warn(CND.reverse("harfbuzzjs doesn't support font features"));

  //-----------------------------------------------------------------------------------------------------------
  __demo_outline = async function(filename, font, text_shape) {
    var R, cursor_x, cursor_y, delta_x, dx, dy, gid, glyph, i, len, svg_path;
    if (HBJS == null) {
      HBJS = (await require(harfbuzzjs_path));
    }
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

  //-----------------------------------------------------------------------------------------------------------
  __demo_text_shape = async function(path, text) {
    var R, blob, buffer, face, features, filename, font, font_blob;
    if (HBJS == null) {
      HBJS = (await require(harfbuzzjs_path));
    }
    filename = PATH.basename(path);
    font_blob = new Uint8Array(FS.readFileSync(path));
    blob = HBJS.createBlob(font_blob);
    face = HBJS.createFace(blob, 0);
    font = HBJS.createFont(face);
    /* NOTE Units per em. Optional; taken from font if not given */
    font.setScale(1000, 1000);
    buffer = HBJS.createBuffer();
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
      HBJS.shape(font, buffer, features);
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

  //===========================================================================================================
  // HELPERS
  //-----------------------------------------------------------------------------------------------------------
  this._hbjs_cache_from_path = function(HBJS, path) {
    var blob, face, font_blob, hbjsfont;
    font_blob = new Uint8Array(FS.readFileSync(path));
    blob = HBJS.createBlob(font_blob);
    face = HBJS.createFace(blob, 0);
    hbjsfont = HBJS.createFont(face);
    hbjsfont.setScale(1000, 1000);
    return {font_blob, blob, face, hbjsfont};
  };

  //===========================================================================================================
  // ARRANGE
  // #-----------------------------------------------------------------------------------------------------------
  // @add_missing_outlines = ( me ) ->
  //   HBJS               ?= await require harfbuzzjs_path
  //   me.cache.hbjs      ?= @_hbjs_cache_from_path HBJS, me.path
  //   { hbjs }            = me.cache
  //   { features }        = me
  //   me.outlines        ?= {}
  //   #.........................................................................................................
  //   # cursor_x  = 0
  //   # cursor_y  = 0
  //   R         = {}
  //     gid       = glyph.g
  //     # delta_x   = glyph.ax
  //     # dx        = glyph.dx
  //     # dy        = glyph.dy
  //     svg_path  = hbjs.hbjsfont.glyphToPath gid
  //     debug '^3234234^', ( CND.lime gid ), ( CND.steel ( rpr svg_path )[ .. 100 ] )
  //     # R.push svg_path
  //     # # You need to supply this bit
  //     # drawAGlyph(svg_path, cursor_x + dx, dy)
  //     # cursor_x += delta_x
  //   #.........................................................................................................
  //   return null

  //===========================================================================================================
  // ARRANGE
  //-----------------------------------------------------------------------------------------------------------
  /* TAINT add styling, font features */
  this.arrange_text = async function(me, text) {
    var base, base1, features, glyph, hbjs, i, len, name, ref;
    if (HBJS == null) {
      HBJS = (await require(harfbuzzjs_path));
    }
    if ((base = me.cache).hbjs == null) {
      base.hbjs = this._hbjs_cache_from_path(HBJS, me.path);
    }
    ({hbjs} = me.cache);
    ({features} = me);
    // debug '^333489^', ( k for k of HBJS )
    // debug '^333489^', ( k for k of hbjs.hbjsfont )
    // debug '^333489^', ( k for k of hbjs.buffer )
    if (me.outlines == null) {
      me.outlines = {};
    }
    //.........................................................................................................
    /* TAINT can we keep existing buffer for new text? */
    hbjs.buffer = HBJS.createBuffer();
    hbjs.buffer.addText(text);
    hbjs.buffer.guessSegmentProperties();
    HBJS.shape(hbjs.hbjsfont, hbjs.buffer, features);
    /* NOTE may change to arrangements as list */
    me.arrangement = hbjs.buffer.json(hbjs.hbjsfont);
    ref = me.arrangement;
    //.........................................................................................................
    for (i = 0, len = ref.length; i < len; i++) {
      glyph = ref[i];
      if ((base1 = me.outlines)[name = glyph.g] == null) {
        base1[name] = hbjs.hbjsfont.glyphToPath(glyph.g);
      }
    }
    //.........................................................................................................
    return null;
  };

  //===========================================================================================================
  // HIGH-LEVEL API
  //-----------------------------------------------------------------------------------------------------------
  this.new_fontshaper = function(path, features = null) {
    var R;
    R = {
      ...this.types.defaults.hb_cfg,
      path,
      features,
      cache: {}
    };
    validate.hb_fontshaper(R);
    return R;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.destruct = function(me) {
    var ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7;
    if ((ref = me.cache.hbjs) != null) {
      if ((ref1 = ref.buffer) != null) {
        ref1.destroy();
      }
    }
    if ((ref2 = me.cache.hbjs) != null) {
      if ((ref3 = ref2.hbjsfont) != null) {
        ref3.destroy();
      }
    }
    if ((ref4 = me.cache.hbjs) != null) {
      if ((ref5 = ref4.face) != null) {
        ref5.destroy();
      }
    }
    if ((ref6 = me.cache.hbjs) != null) {
      if ((ref7 = ref6.blob) != null) {
        ref7.destroy();
      }
    }
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.shape_text = function(me, text) {
    this.types.validate.hb_fontshaper(me);
    return this.fast_shape_text(me, text);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.fast_shape_text = async function(me, text) {
    await this.arrange_text(me, text);
    // await @add_missing_outlines me
    return null;
  };

  //===========================================================================================================
  // DEMO SHAPE TEXT
  //-----------------------------------------------------------------------------------------------------------
  this.demo_shape_text = async function() {
    var HB, d, features, fs, gid, i, j, len, len1, outline, path, paths, ref, ref1, resolve_path, text;
    HB = this;
    // result.instance.exports.memory.grow(400); // each page is 64kb in size
    resolve_path = function(path) {
      return PATH.resolve(PATH.join(__dirname, '../fonts', path));
    };
    features = {
      liga: true,
      clig: true,
      dlig: true,
      hlig: true
    };
    text = 'abcdefABCDEF';
    // 'unifraktur/UnifrakturMaguntia16.ttf'
    // 'SourceHanSans-Bold003.ttf'
    // # 'HanaMinExB.otf'
    paths = ['FZKaiT.TTF'];
//.........................................................................................................
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
      debug('^33443^', path);
      try {
        path = resolve_path(path);
        fs = HB.new_fontshaper(path, features);
        await HB.shape_text(fs, text);
        ref = fs.arrangement;
        for (j = 0, len1 = ref.length; j < len1; j++) {
          d = ref[j];
          urge(d);
        }
        ref1 = fs.outlines;
        for (gid in ref1) {
          outline = ref1[gid];
          debug('^3234234^', CND.lime(gid), CND.steel((rpr(outline)).slice(0, 101)));
        }
      } finally {
        // debug '^333322^', fs
        HB.destruct(fs);
      }
    }
    //.........................................................................................................
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await this.demo_shape_text());
    })();
  }

}).call(this);

//# sourceMappingURL=demo-harfbuzzjs.js.map