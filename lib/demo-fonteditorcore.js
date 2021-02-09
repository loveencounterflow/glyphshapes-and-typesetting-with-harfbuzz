(function() {
  /*

  fonteditor-core does not lend itself for typesetting b/c it lacks text shaping abilities

  Also, fails to load EBGaramond08-Italic which other solutions do load

  */
  'use strict';
  var CND, FEC, FS, PATH, alert, badge, debug, echo, help, info, isa, rpr, urge, validate, warn, whisper;

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

  FEC = require('fonteditor-core');

  //-----------------------------------------------------------------------------------------------------------
  this.otfont_from_path = function(path) {
    return FK.openSync(path);
  };

  //-----------------------------------------------------------------------------------------------------------
  this./* could use async */shape_text = function(fkfont, text) {
    var R, glyf, glyfrun, i, j, len, len1, ref, ref1;
    R = {};
    glyfrun = fkfont.layout(text);
    if (fkfont.unitsPerEm === 1000) {
      ref = glyfrun.glyphs;
      for (i = 0, len = ref.length; i < len; i++) {
        glyf = ref[i];
        R[glyf.id] = glyf.path.toSVG();
      }
    } else {
      ref1 = glyfrun.glyphs;
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        glyf = ref1[j];
        R[glyf.id] = (glyf.getScaledPath(1000)).toSVG();
      }
    }
    return null;
  };

  //===========================================================================================================
  // DEMO SHAPE TEXT
  //-----------------------------------------------------------------------------------------------------------
  this.demo_shape_text = function() {
    var buffer, cfg, features, fecfont, fontObject, path, resolve_path;
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
    path = 'Ubuntu-R.ttf';
    // path          = 'FZKaiT.TTF'
    path = resolve_path(path);
    buffer = FS.readFileSync(path);
    cfg = {
      type: 'ttf',
      // subset: [ 65, 66, ]
      hinting: true,
      compound2simple: true,
      inflate: null,
      combinePath: true
    };
    fecfont = FEC.Font.create(buffer, cfg);
    fontObject = fecfont.get();
    info(Object.keys(fontObject));
    // optimize glyf
    fecfont.optimize();
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      return (await this.demo_shape_text());
    })();
  }

}).call(this);

//# sourceMappingURL=demo-fonteditorcore.js.map