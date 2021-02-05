(function() {
  'use strict';
  var CND, FS, OTJS, PATH, alert, badge, debug, echo, help, info, isa, rpr, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DEMO-OPENTYPEJS';

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

  OTJS = require('opentype.js');

  // #-----------------------------------------------------------------------------------------------------------
  // __demo_outline = ( filename, font, text_shape ) ->
  //   HBJS       ?= await require harfbuzzjs_path
  //   cursor_x  = 0
  //   cursor_y  = 0
  //   R         = []
  //   for glyph in text_shape
  //     gid       = glyph.g
  //     delta_x   = glyph.ax
  //     dx        = glyph.dx
  //     dy        = glyph.dy
  //     svg_path  = font.glyphToPath gid
  //     debug '^3234234^', ( CND.yellow filename ), ( CND.lime gid ), ( CND.steel ( rpr svg_path )[ .. 100 ] )
  //     R.push svg_path
  //     # # You need to supply this bit
  //     # drawAGlyph(svg_path, cursor_x + dx, dy)
  //     cursor_x += delta_x
  //   return R

  // #-----------------------------------------------------------------------------------------------------------
  // __demo_text_shape = ( path, text ) ->
  //   HBJS       ?= await require harfbuzzjs_path
  //   filename  = PATH.basename path
  //   font_blob = new Uint8Array FS.readFileSync path
  //   blob      = HBJS.createBlob font_blob
  //   face      = HBJS.createFace blob, 0
  //   font      = HBJS.createFont face
  //   ### NOTE Units per em. Optional; taken from font if not given ###
  //   font.setScale 1000, 1000
  //   buffer    = HBJS.createBuffer()
  //   try
  //     buffer.addText text
  //     buffer.guessSegmentProperties()
  //     ### NOTE optional as can be set by guessSegmentProperties also: ###
  //     # buffer.setDirection 'ltr'
  //     ### TAINT silently discards unknown features ###
  //     features = { kern: true, liga: true, xxx: true, }
  //     HBJS.shape font, buffer, features
  //     R = buffer.json font
  //     demo_outline filename, font, R
  //     # bbox = xmin + ' ' + ymin + ' ' + width + ' ' + height;
  //     # "<svg xmlns='http://www.w3.org/2000/svg' height='128' viewBox='#{bbox}'>"
  //     # "<path d='#{svg_path}'/></svg>"
  //   finally
  //     buffer.destroy()
  //     font.destroy()
  //     face.destroy()
  //     blob.destroy()
  //   return R

  // #===========================================================================================================
  // # HELPERS
  // #-----------------------------------------------------------------------------------------------------------
  // @_hbjs_cache_from_path = ( HBJS, path ) ->
  //   font_blob = new Uint8Array FS.readFileSync path
  //   blob      = HBJS.createBlob font_blob
  //   face      = HBJS.createFace blob, 0
  //   hbjsfont  = HBJS.createFont face
  //   hbjsfont.setScale 1000, 1000
  //   return { font_blob, blob, face, hbjsfont, }

  // #===========================================================================================================
  // # ARRANGE
  // # #-----------------------------------------------------------------------------------------------------------
  // # @add_missing_outlines = ( me ) ->
  // #   HBJS               ?= await require harfbuzzjs_path
  // #   me.cache.hbjs      ?= @_hbjs_cache_from_path HBJS, me.path
  // #   { hbjs }            = me.cache
  // #   { features }        = me
  // #   me.outlines        ?= {}
  // #   #.........................................................................................................
  // #   # cursor_x  = 0
  // #   # cursor_y  = 0
  // #   R         = {}
  // #     gid       = glyph.g
  // #     # delta_x   = glyph.ax
  // #     # dx        = glyph.dx
  // #     # dy        = glyph.dy
  // #     svg_path  = hbjs.hbjsfont.glyphToPath gid
  // #     debug '^3234234^', ( CND.lime gid ), ( CND.steel ( rpr svg_path )[ .. 100 ] )
  // #     # R.push svg_path
  // #     # # You need to supply this bit
  // #     # drawAGlyph(svg_path, cursor_x + dx, dy)
  // #     # cursor_x += delta_x
  // #   #.........................................................................................................
  // #   return null

  // #===========================================================================================================
  // # ARRANGE
  // #-----------------------------------------------------------------------------------------------------------
  // ### TAINT add styling, font features ###
  // @arrange_text = ( me, text ) ->
  //   HBJS               ?= await require harfbuzzjs_path
  //   me.cache.hbjs      ?= @_hbjs_cache_from_path HBJS, me.path
  //   { hbjs }            = me.cache
  //   { features }        = me
  //   # debug '^333489^', ( k for k of HBJS )
  //   # debug '^333489^', ( k for k of hbjs.hbjsfont )
  //   # debug '^333489^', ( k for k of hbjs.buffer )
  //   me.outlines        ?= {}
  //   #.........................................................................................................
  //   ### TAINT can we keep existing buffer for new text? ###
  //   hbjs.buffer = HBJS.createBuffer()
  //   hbjs.buffer.addText text
  //   hbjs.buffer.guessSegmentProperties()
  //   HBJS.shape hbjs.hbjsfont, hbjs.buffer, features
  //   ### NOTE may change to arrangements as list ###
  //   me.arrangement = hbjs.buffer.json hbjs.hbjsfont
  //   #.........................................................................................................
  //   for glyph in me.arrangement
  //     me.outlines[ glyph.g ] ?= hbjs.hbjsfont.glyphToPath glyph.g
  //   #.........................................................................................................
  //   return null

  // #===========================================================================================================
  // # HIGH-LEVEL API
  // #-----------------------------------------------------------------------------------------------------------
  // @new_fontshaper = ( path, features = null ) ->
  //   R = { @types.defaults.hb_cfg..., path, features, cache: {}, }
  //   validate.hb_fontshaper R
  //   return R

  // #-----------------------------------------------------------------------------------------------------------
  // @destruct = ( me ) ->
  //   me.cache.hbjs?.buffer?.destroy()
  //   me.cache.hbjs?.hbjsfont?.destroy()
  //   me.cache.hbjs?.face?.destroy()
  //   me.cache.hbjs?.blob?.destroy()
  //   return null

  // #-----------------------------------------------------------------------------------------------------------
  // @fast_shape_text = ( me, text ) ->
  //   await @arrange_text         me, text
  //   # await @add_missing_outlines me
  //   return null

  //-----------------------------------------------------------------------------------------------------------
  this.otfont_from_path = async function(path) {
    return (await OTJS.load(path));
  };

  //-----------------------------------------------------------------------------------------------------------
  this.shape_text = function(otfont, text) {
    var R, glyph, i, len, path, ref, svg_pathdata;
    R = {};
    ref = otfont.stringToGlyphs(text);
    for (i = 0, len = ref.length; i < len; i++) {
      glyph = ref[i];
      if (R[glyph.index] != null) {
        continue;
      }
      path = glyph.getPath(0, 0, 1000);
      svg_pathdata = path.toPathData(2);
      R[glyph.index] = svg_pathdata;
    }
    return R;
  };

  //===========================================================================================================
  // DEMO SHAPE TEXT
  //-----------------------------------------------------------------------------------------------------------
  this.demo_shape_text = async function() {
    var d, features, glyph, i, j, len, len1, otfont, path, ref, ref1, resolve_path;
    resolve_path = function(path) {
      return PATH.resolve(PATH.join(__dirname, '../fonts', path));
    };
    features = {
      liga: true,
      clig: true,
      dlig: true,
      hlig: true
    };
    path = 'EBGaramond08-Italic.otf';
    path = resolve_path(path);
    otfont = (await OTJS.load(path));
    ref = (otfont.getPath('a', 0, 150, 72)).commands;
    for (i = 0, len = ref.length; i < len; i++) {
      d = ref[i];
      debug(d);
    }
    ref1 = otfont.stringToGlyphs('xffix');
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      glyph = ref1[j];
      help(glyph);
      path = glyph.getPath(0, 0, 1000);
      urge(path.toPathData(2));
    }
    debug(this.shape_text(otfont, 'xffix'));
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await this.demo_shape_text());
    })();
  }

}).call(this);

//# sourceMappingURL=demo-opentypejs.js.map