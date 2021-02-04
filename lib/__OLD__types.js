(function() {
  'use strict';
  var CND, Intertype, alert, badge, debug, help, info, intertype, jr, rpr, urge, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'TEXTSHAPING-WITH-HARFBUZZ/TYPES';

  debug = CND.get_logger('debug', badge);

  alert = CND.get_logger('alert', badge);

  whisper = CND.get_logger('whisper', badge);

  warn = CND.get_logger('warn', badge);

  help = CND.get_logger('help', badge);

  urge = CND.get_logger('urge', badge);

  info = CND.get_logger('info', badge);

  jr = JSON.stringify;

  Intertype = (require('intertype')).Intertype;

  intertype = new Intertype(module.exports);

  //===========================================================================================================
  // TYPES
  //-----------------------------------------------------------------------------------------------------------
  this.declare('hb_cfg', {
    tests: {
      "x is an object": function(x) {
        return this.isa.object(x);
      },
      "x.text is a text": function(x) {
        return this.isa.text(x.text);
      },
      "x.font is a hb_font": function(x) {
        return this.isa.hb_font(x.font);
      },
      "x.arrangement? is an optional list of objects": function(x) {
        if (x.arrangement == null) {
          return true;
        }
        return this.isa_list_of.object(x.arrangement);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this.declare('hb_font', {
    tests: {
      "x is an object": function(x) {
        return this.isa.object(x);
      },
      "x.path is a nonempty_text": function(x) {
        return this.isa.nonempty_text(x.path);
      },
      "x.features? is an optional text or object": function(x) {
        var ref;
        if (x.features == null) {
          return true;
        }
        return this.type_of((ref = x.features) === 'text' || ref === 'object');
      }
    }
  });

  //===========================================================================================================
  // DEFAULTS, CASTS
  //-----------------------------------------------------------------------------------------------------------
  this.defaults = {
    internal: {
      verbose: false,
      harfbuzz: {
        semver: '^2.7.4'
      }
    },
    hb_cfg: {
      font: {
        path: null,
        features: null
      },
      text: null,
      arrangement: null
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  this.cast = {};

}).call(this);

//# sourceMappingURL=__OLD__types.js.map