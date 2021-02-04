(function() {
  'use strict';
  var $, $async, $drain, $show, $watch, CND, DATOM, FS, PATH, SEMVER, SHELL, SP, alert, badge, debug, echo, freeze, help, info, isa, new_datom, rpr, spawn, type_of, urge, validate, warn, whisper;

  //###########################################################################################################
  CND = require('cnd');

  rpr = CND.rpr;

  badge = 'DEMO-HARFBUZZ';

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

  SEMVER = require('semver');

  SHELL = require('shelljs');

  SP = require('steampipes');

  ({$, $async, $watch, $show, $drain} = SP.export());

  DATOM = require('datom');

  ({new_datom, freeze} = DATOM.export());

  ({spawn} = require('child_process'));

  this.types = require('./__OLD__types');

  ({isa, validate, type_of} = this.types.export());

  //===========================================================================================================
  // ENSURE HARFBUZZ INSTALLED
  //-----------------------------------------------------------------------------------------------------------
  this._show_shell_output = function(output) {
    echo();
    if ((output.stdout != null) && output.stdout.length > 0) {
      help('^demo-harfbuzz@100^ stdout:', rpr(output.stdout));
    }
    if ((output.stderr != null) && output.stderr.length > 0) {
      warn('^demo-harfbuzz@101^ stderr:', rpr(output.stderr));
    }
    echo();
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.ensure_harfbuzz_version = function() {
    var cmd, cmds, i, len, match, output, pattern;
    cmds = ['hb-shape', 'hb-view'];
//.........................................................................................................
    for (i = 0, len = cmds.length; i < len; i++) {
      cmd = cmds[i];
      output = SHELL.exec(`${cmd} --version`, {
        silent: !this.types.defaults.internal.verbose
      });
      //.......................................................................................................
      if (output.code !== 0) {
        this._show_shell_output(output);
        throw new Error("^demo-harfbuzz@102^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)");
      }
      pattern = RegExp(`^${cmd}\\s+\\(HarfBuzz\\)\\s+(?<version>[0-9a-z.]+)\\n`);
      //.......................................................................................................
      if ((match = output.stdout.match(pattern)) == null) {
        this._show_shell_output(output);
        throw new Error("^demo-harfbuzz@103^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)");
      }
      //.......................................................................................................
      if (!SEMVER.satisfies(match.groups.version, this.types.defaults.internal.harfbuzz.semver)) {
        this._show_shell_output(output);
        throw new Error(`^demo-harfbuzz@104^ found HarfBuzz ${rpr(cmd)} version ${rpr(match.groups.version)}, expected ${rpr(this.types.defaults.internal.harfbuzz.semver)}`);
      }
      if (this.types.defaults.internal.verbose) {
        //.......................................................................................................
        whisper(`^33787^ ${cmd} version ${match.groups.version} OK`);
      }
    }
    //.........................................................................................................
    return null;
  };

  //===========================================================================================================
  // HELPERS
  //-----------------------------------------------------------------------------------------------------------
  this._features_as_text = function(features) {
    var R, feature, type, value;
    if (isa.text(features)) {
      /* Turn feature object like `{ liga: true, clig: true, dlig: true, hlig: true, }` into feature strings
       like `'liga,clig,dlig,hlig'` */
      return features;
    }
    R = [];
    for (feature in features) {
      value = features[feature];
      R.push((function() {
        switch ((type = type_of(value))) {
          case 'boolean':
            if (value === true) {
              return feature;
            } else {
              return `${feature}=false`;
            }
            break;
          case 'text':
            if (value === '') {
              return feature;
            } else {
              return `${feature}=${value}`;
            }
            break;
          case 'number':
            return `${feature}=${value}`;
          default:
            throw new Error(`^demo-harfbuzz@104^ unable to convert a ${type} into a feature string`);
        }
      })());
    }
    return R.join(',');
  };

  //===========================================================================================================
  // ARRANGEMENT
  //-----------------------------------------------------------------------------------------------------------
  this.$extract_hbshape_positioning = function(cfg) {
    return $(function(d, send) {
      var match;
      if (d.$key !== '^stdout') {
        return null;
      }
      if (d.$value == null) {
        return null;
      }
      /* NOTE first try simple format, then format that includes line numbers */
      if ((match = d.$value.match(/^(?<positions>\[.*\])$/)) == null) {
        if ((match = d.$value.match(/^(?<lnr>[0-9]+):\s+(?<positions>\[.*\])$/)) == null) {
          return null;
        }
      }
      return send(JSON.parse(match.groups.positions));
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.$convert_shape_datoms = function(cfg) {
    var path_end, path_start, symid, use_idx, use_pattern;
    symid = null;
    path_start = '<path style="stroke:none;" d="';
    path_end = ' "/>';
    use_pattern = /^\s*<use xlink:href="#(?<symid>[^"]+)" x="(?<dx>[^"]+)" y="(?<dy>[^"]+)"\/>/;
    use_idx = -1;
    //.........................................................................................................
    return $(function(d, send) {
      var data, glyfpath, match, ref, ref1, value;
      if (d.$key !== '^stdout') {
        return null;
      }
      if ((value = d.$value) == null) {
        return null;
      }
      if ((value.match(/^<\//)) != null) {
        return null;
      }
      if (value === '<defs>') {
        return null;
      }
      if (value === '<g>') {
        return null;
      }
      if (value.startsWith('<?xml ')) {
        return null;
      }
      if (value.startsWith('<g ')) {
        return null;
      }
      if (value.startsWith('<rect ')) {
        return null;
      }
      //.......................................................................................................
      if (/* NOTE could extract visual text extent from background box */value.startsWith('<svg ')) {
        /* NOTE may want to extract width, height, viewBox */
        return null;
      }
      //.......................................................................................................
      if (value.startsWith('<symbol ')) {
        symid = value.replace(/^.*\sid="([^"]+)".*$/, '$1');
        return null;
      }
      //.......................................................................................................
      if (value === '<path style="stroke:none;" d=""/>') {
        send(new_datom('^glyfpath', {
          symid,
          glyfpath: '',
          glyfname: 'space'
        }));
        return null;
      }
      //.......................................................................................................
      if ((value.startsWith(path_start)) && (value.endsWith(path_end))) {
        glyfpath = value.slice(path_start.length, value.length - path_end.length);
        send(new_datom('^glyfpath', {symid, glyfpath}));
        return null;
      }
      //.......................................................................................................
      if ((match = value.match(use_pattern)) != null) {
        use_idx++;
        data = match.groups;
        if (cfg.arrangement != null) {
          if ((data.glyfname = (ref = (ref1 = cfg.arrangement[use_idx]) != null ? ref1.g : void 0) != null ? ref : null) == null) {
            throw new Error(`^demo-harfbuzz@105^ passed arrangement but use_idx ${use_idx} has no entry`);
          }
        }
        send(new_datom('^use', data));
        return null;
      }
      //.......................................................................................................
      throw new Error(`^demo-harfbuzz@106^ unexpected SVG element ${rpr(value)}`);
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.$consolidate_shape_datoms = function(cfg) {
    var R, last, path_by_symid;
    last = Symbol('last');
    path_by_symid = {};
    R = {};
    //.........................................................................................................
    return $({last}, function(d, send) {
      var glyfname, glyfpath;
      if (d === last) {
        // whisper '^6667^', path_by_symid
        return send(R);
      }
      //.......................................................................................................
      // whisper '^784^', d
      // whisper '^784^', ( k for k of path_by_symid )
      switch (d.$key) {
        case '^glyfpath':
          path_by_symid[d.symid] = d.glyfpath;
          break;
        case '^use':
          if ((glyfname = d.glyfname) == null) {
            return null;
          }
          if ((glyfpath = path_by_symid[d.symid]) == null) {
            throw new Error(`^demo-harfbuzz@107^ unable to locate glyfpath for glyfname ${glyfname}`);
          }
          R[glyfname] = glyfpath;
          break;
        default:
          throw new Error(`^demo-harfbuzz@108^ unexpected datom ${rpr(d)}`);
      }
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.$show_positionings = function(cfg) {
    var count, last;
    last = Symbol('last');
    count = 0;
    //.........................................................................................................
    return $watch({last}, function(d) {
      var i, len, shape;
      if (d === last) {
        urge(CND.reverse(`found ${count} glyph positionings`));
        return null;
      }
      if (!isa.list(d)) {
        return null;
      }
      count += d.length;
      for (i = 0, len = d.length; i < len; i++) {
        shape = d[i];
        info(shape);
      }
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT add styling, font features */
  this.arrange_text = function(cfg) {
    return new Promise((resolve, reject) => {
      var cp, features, font, parameters, path, pipeline, source, stream_settings, text;
      cfg = {...this.types.defaults.hb_cfg, ...cfg};
      validate.hb_cfg(cfg);
      ({text, font} = cfg);
      ({path, features} = font);
      //.........................................................................................................
      /* TAINT code duplication */
      /* TAINT cache parameters, esp. features */
      parameters = [];
      parameters.push('--output-format=json');
      parameters.push('--font-size=1000');
      if (font.features != null) {
        parameters.push(`--features=${this._features_as_text(font.features)}`);
      }
      // '--no-glyph-names' ### NOTE when active, output glyf IDs instead of glyph names ###
      // '--show-extents'
      // '--show-flags'
      // '--verbose'
      parameters.push(font.path);
      parameters.push(text);
      //.........................................................................................................
      cp = spawn('hb-shape', parameters);
      stream_settings = {
        bare: true
      };
      source = SP.source_from_child_process(cp, stream_settings);
      pipeline = [];
      pipeline.push(source);
      pipeline.push(SP.$split_channels());
      pipeline.push(SP.$select('^stderr', function(d) {
        return reject(new Error(d.$value));
      }));
      if (this.types.defaults.internal.verbose) {
        pipeline.push($watch((d) => {
          return whisper('^33344^', d);
        }));
      }
      pipeline.push(this.$extract_hbshape_positioning(cfg));
      if (this.types.defaults.internal.verbose) {
        pipeline.push(this.$show_positionings(cfg));
      }
      pipeline.push($drain((R) => {
        if (this.types.defaults.internal.verbose) {
          urge("arrange_text finished");
        }
        return resolve(R.flat(2e308));
      }));
      SP.pull(...pipeline);
      //.........................................................................................................
      return null;
    });
  };

  //===========================================================================================================
  // FETCH OUTLINES
  //-----------------------------------------------------------------------------------------------------------
  this.$show_usage_counts = function(cfg) {
    var count, last;
    last = Symbol('last');
    count = 0;
    //.........................................................................................................
    return $watch({last}, function(d) {
      if (d === last) {
        urge(CND.reverse(`found ${count} usage tags`));
        return null;
      }
      if (d.$key !== '^use') {
        return null;
      }
      count++;
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.fetch_outlines = function(cfg) {
    cfg = {...this.types.defaults.hb_cfg, ...cfg};
    validate.hb_cfg(cfg);
    return this.fetch_outlines_fast(cfg);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.fetch_outlines_fast = function(cfg) {
    return new Promise((resolve, reject) => {
      var arrangement, cp, font, parameters, pipeline, source, stream_settings, text;
      ({text, font, arrangement} = cfg);
      //.........................................................................................................
      /* TAINT code duplication */
      /* TAINT cache parameters, esp. features */
      parameters = [];
      parameters.push('--output-format=svg');
      parameters.push('--font-size=1000');
      if (font.features != null) {
        parameters.push(`--features=${this._features_as_text(font.features)}`);
      }
      parameters.push(font.path);
      parameters.push(text);
      // '--show-extents'
      // '--show-flags'
      // '--verbose'
      //.........................................................................................................
      cp = spawn('hb-view', parameters);
      stream_settings = {
        bare: true
      };
      source = SP.source_from_child_process(cp, stream_settings);
      pipeline = [];
      pipeline.push(source);
      pipeline.push(SP.$split_channels());
      pipeline.push(SP.$select('^stderr', function(d) {
        return reject(new Error(d.$value));
      }));
      pipeline.push(this.$convert_shape_datoms(cfg));
      if (this.types.defaults.internal.verbose) {
        pipeline.push(this.$show_usage_counts(cfg));
      }
      pipeline.push(this.$consolidate_shape_datoms(cfg));
      if (this.types.defaults.internal.verbose) {
        pipeline.push($show());
      }
      pipeline.push($drain((R) => {
        if (this.types.defaults.internal.verbose) {
          urge("fetch_outlines finished");
        }
        return resolve(R[0]);
      }));
      SP.pull(...pipeline);
      //.........................................................................................................
      return null;
    });
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

  //===========================================================================================================
  // DEMO
  //-----------------------------------------------------------------------------------------------------------
  this.demo_arranging_and_outlining_text = async function(cfg) {
    var HB, arrangement, d, font, glyfname, i, len, outline, outlines, text;
    HB = this;
    HB.ensure_harfbuzz_version();
    font = {
      path: 'EBGaramond12-Italic.otf',
      features: {
        liga: true,
        clig: true,
        dlig: true,
        hlig: true
      }
    };
    font.path = PATH.resolve(PATH.join(__dirname, '../fonts', font.path));
    // text                  = "A glyph ffi shaping\nagffix谷"
    // text                  = "A abc\nabc ffl ffi ct 谷 Z"
    // text                  = "AThctZ"
    text = "A x Z";
    cfg = {font, text};
    arrangement = (await HB.arrange_text(cfg));
    //.........................................................................................................
    /* At this point we could check outline DB for missing outlines using the Glyf Names in `arrangement`.

    If all outlines are found then we're fine to procede; in case one or more outlines are missing, we have to
    typeset *the entire text* (unfortunately) again using `hb-view` with SVG output. We update `cfg` with
    `arrangement` because only then it is possible to match outlines and Glyph Names. */
    //.........................................................................................................
    cfg = {...cfg, arrangement};
    outlines = (await HB.fetch_outlines(cfg));
    for (i = 0, len = arrangement.length; i < len; i++) {
      d = arrangement[i];
      help(d);
    }
    for (glyfname in outlines) {
      outline = outlines[glyfname];
      urge((CND.pen({
        glyfname,
        d: outline
      })).trim().slice(0, 100) + '…');
    }
    return null;
  };

  //###########################################################################################################
  if (module === require.main) {
    (() => {
      return this.demo_arranging_and_outlining_text();
    })();
  }

  // @ensure_harfbuzz_version()
// help await @shape_text { font: { path: '/home/flow/jzr/glyphshapes-and-typesetting-with-harfbuzz/fonts/EBGaramond12-Italic.otf', features: 'liga,clig,dlig,hlig' }, text: 'AxZ' }
// help await @shape_text { font: { path: 'nosuchfile', features: 'liga,clig,dlig,hlig' }, text: 'AxZ' }

}).call(this);

//# sourceMappingURL=demo-harfbuzz.js.map