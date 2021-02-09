(function() {
  'use strict';
  var CND, FK, FS, PATH, alert, badge, debug, echo, help, info, isa, rpr, urge, validate, warn, whisper;

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

  FK = require('fontkit');

  //-----------------------------------------------------------------------------------------------------------
  this.fkfont_from_path = function(path) {
    return FK.openSync(path);
  };

  //-----------------------------------------------------------------------------------------------------------
  this./* could use async */shape_text = function(fkfont, text) {
    var R, gid, glyfrun, i, len, pidx, position, ref, xAdvance, xOffset, yAdvance, yOffset;
    R = [];
    glyfrun = fkfont.layout(text);
    ref = glyfrun.positions;
    /* NOTE do outlining in separate method */
    // if fkfont.unitsPerEm is 1000
    //   for glyf in glyfrun.glyphs
    //     R[ glyf.id ] = glyf.path.toSVG()
    // else
    //   for glyf in glyfrun.glyphs
    //     R[ glyf.id ] = ( glyf.getScaledPath 1000 ).toSVG()
    for (pidx = i = 0, len = ref.length; i < len; pidx = ++i) {
      position = ref[pidx];
      gid = glyfrun.glyphs[pidx].id;
      ({xAdvance, yAdvance, xOffset, yOffset} = position);
      R.push({gid, xAdvance, yAdvance, xOffset, yOffset});
    }
    return R;
  };

  //===========================================================================================================
  // DEMO SHAPE TEXT
  //-----------------------------------------------------------------------------------------------------------
  this.demo_shape_text = function() {
    var features, fkfont, glyf, glyfrun, i, k, len, path, ref, resolve_path, scale_factor;
    resolve_path = function(path) {
      return PATH.resolve(PATH.join(__dirname, '../fonts', path));
    };
    features = {
      liga: true,
      clig: true,
      dlig: true,
      hlig: true
    };
    // path          = 'EBGaramond08-Italic.otf'
    path = 'FZKaiT.TTF';
    path = resolve_path(path);
    // open a font synchronously
    fkfont = FK.openSync(path);
    whisper(fkfont.availableFeatures);
    whisper(fkfont.variationAxes);
    whisper(fkfont.unitsPerEm);
    scale_factor = 1000 / fkfont.unitsPerEm;
    // layout a string, using default shaping features.
    // returns a GlyphRun, describing glyphs and positions.
    glyfrun = fkfont.layout('xffix', features);
    // get an SVG path for a glyph
    urge((function() {
      var results;
      results = [];
      for (k in glyfrun) {
        results.push(k);
      }
      return results;
    })());
    ref = glyfrun.glyphs;
    for (i = 0, len = ref.length; i < len; i++) {
      glyf = ref[i];
      // font.widthOfGlyph glyf.id
      // info ( k for k of glyf )
      info(CND.yellow(glyf.id), CND.steel(glyf.path.toSVG().slice(0, 101)));
      info(glyf.bbox);
      info(glyf.advanceWidth);
      info(glyf.advanceWidth * scale_factor);
      /* should use this method unless `fkfont.unitsPerEm` is 1000: */
      urge((glyf.getScaledPath(1000)).toSVG());
    }
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await this.demo_shape_text());
    })();
  }

}).call(this);

//# sourceMappingURL=demo-fontkit.js.map