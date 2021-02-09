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

  warn(CND.reverse("opentype.js probably does not provide proper shaping beyond Latin ligatures"));

  //-----------------------------------------------------------------------------------------------------------
  this.otfont_from_path = async function(path) {
    return (await OTJS.load(path));
  };

  //-----------------------------------------------------------------------------------------------------------
  this.shape_text = function(otfont, text) {
    return otfont.stringToGlyphs(text);
  };

  // continue if R[ glyph.index ]?
  // path              = glyph.getPath 0, 0, 1000
  // svg_pathdata      = path.toPathData 2
  // R[ glyph.index ]  = svg_pathdata
  // return R

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