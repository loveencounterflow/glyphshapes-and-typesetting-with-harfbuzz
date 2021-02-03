(function() {
  'use strict';
  var $, $async, $drain, $show, $watch, CND, DATOM, FS, PATH, SEMVER, SHELL, SP, alert, badge, debug, defaults, echo, freeze, help, info, isa, new_datom, rpr, spawn, types, urge, validate, warn, whisper;

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

  types = new (require('intertype')).Intertype();

  ({isa, validate} = types.export());

  //-----------------------------------------------------------------------------------------------------------
  defaults = {
    internal: {
      verbose: true,
      shell: {
        verbose: false
      },
      harfbuzz: {
        semver: '^2.7.4'
      }
    },
    hb_settings: {
      font_path: null,
      text: null,
      features: null,
      arrangement: null
    }
  };

  //-----------------------------------------------------------------------------------------------------------
  types.declare('hb_settings', {
    tests: {
      "x is an object": function(x) {
        return this.isa.object(x);
      },
      "x.font_path is a text": function(x) {
        return this.isa.text(x.font_path);
      },
      "x.text is a text": function(x) {
        return this.isa.text(x.text);
      },
      "x.features is an optional text": function(x) {
        return this.isa_optional.text(x.features);
      },
      "x.arrangement is an optional list of objects": function(x) {
        if (x.arrangement == null) {
          return true;
        }
        return this.isa_list_of.object(x.arrangement);
      }
    }
  });

  //-----------------------------------------------------------------------------------------------------------
  this._show_shell_output = function(output) {
    echo();
    if ((output.stdout != null) && output.stdout.length > 0) {
      help('^demo-harfbuzz@87^ stdout:', rpr(output.stdout));
    }
    if ((output.stderr != null) && output.stderr.length > 0) {
      warn('^demo-harfbuzz@87^ stderr:', rpr(output.stderr));
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
        silent: !defaults.internal.shell.verbose
      });
      //.......................................................................................................
      if (output.code !== 0) {
        this._show_shell_output(output);
        throw new Error("^demo-harfbuzz@87^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)");
      }
      pattern = RegExp(`^${cmd}\\s+\\(HarfBuzz\\)\\s+(?<version>[0-9a-z.]+)\\n`);
      //.......................................................................................................
      if ((match = output.stdout.match(pattern)) == null) {
        this._show_shell_output(output);
        throw new Error("^demo-harfbuzz@87^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)");
      }
      //.......................................................................................................
      if (!SEMVER.satisfies(match.groups.version, defaults.internal.harfbuzz.semver)) {
        this._show_shell_output(output);
        throw new Error(`^demo-harfbuzz@87^ found HarfBuzz ${rpr(cmd)} version ${rpr(match.groups.version)}, expected ${rpr(defaults.internal.harfbuzz.semver)}`);
      }
      if (defaults.internal.verbose) {
        //.......................................................................................................
        whisper(`^33787^ ${cmd} version ${match.groups.version} OK`);
      }
    }
    //.........................................................................................................
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  this.$extract_hbshape_positioning = function(S) {
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
  this.$convert_shape_datoms = function(S) {
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
        // warn '^7767^', d
        // send new_datom '^space'
        send(new_datom('^glyfpath', {
          symid,
          glyfpath: null,
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
        if (S.arrangement != null) {
          if ((data.glyfname = (ref = (ref1 = S.arrangement[use_idx]) != null ? ref1.g : void 0) != null ? ref : null) == null) {
            throw new Error(`^demo-harfbuzz@87^ passed arrangement but use_idx ${use_idx} has no entry`);
          }
        }
        send(new_datom('^use', data));
        return null;
      }
      //.......................................................................................................
      throw new Error(`^demo-harfbuzz@87^ unexpected SVG element ${rpr(value)}`);
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.$consolidate_shape_datoms = function(S) {
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
            throw new Error(`^demo-harfbuzz@87^ unable to locate glyfpath for glyfname ${glyfname}`);
          }
          R[glyfname] = glyfpath;
          break;
        default:
          throw new Error(`^demo-harfbuzz@87^ unexpected datom ${rpr(d)}`);
      }
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.$show_positionings = function(S) {
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
  this.$show_usage_counts = function(S) {
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
  this.$show_svg = function(S) {
    var collector, last;
    last = Symbol('last');
    collector = [];
    //.........................................................................................................
    return $watch({last}, function(d) {
      var value;
      if (d === last) {
        urge('\n' + collector.join('\n'));
        return null;
      }
      if (d.$key !== '^stdout') {
        return null;
      }
      if ((value = d.$value) == null) {
        return null;
      }
      return collector.push(value);
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT add styling, font features */
  this.arrange_text = function(settings) {
    return new Promise((resolve, reject) => {
      var S, cp, features, font_path, parameters, pipeline, source, stream_settings, text;
      settings = {...defaults.hb_settings, ...settings};
      validate.hb_settings(settings);
      ({text, font_path, features} = settings);
      //.........................................................................................................
      parameters = [];
      parameters.push('--output-format=json');
      parameters.push('--font-size=1000');
      if (features != null) {
        parameters.push(`--features=${features}`);
      }
      // '--no-glyph-names' ### NOTE when active, output glyf IDs instead of glyph names ###
      // '--show-extents'
      // '--show-flags'
      // '--verbose'
      parameters.push(font_path);
      parameters.push(text);
      //.........................................................................................................
      cp = spawn('hb-shape', parameters);
      stream_settings = {
        bare: true
      };
      source = SP.source_from_child_process(cp, stream_settings);
      S = freeze({font_path, text});
      pipeline = [];
      pipeline.push(source);
      pipeline.push(SP.$split_channels());
      pipeline.push($watch((d) => {
        return whisper('^33344^', d);
      }));
      pipeline.push(this.$extract_hbshape_positioning(S));
      pipeline.push(this.$show_positionings(S));
      pipeline.push($drain(function(R) {
        urge("arrange_text finished");
        return resolve(R.flat(2e308));
      }));
      SP.pull(...pipeline);
      //.........................................................................................................
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT add styling, font features */
  //-----------------------------------------------------------------------------------------------------------
  this.fetch_outlines = function(settings) {
    settings = {...defaults.hb_settings, ...settings};
    validate.hb_settings(settings);
    return this.fetch_outlines_fast(settings);
  };

  //-----------------------------------------------------------------------------------------------------------
  this.fetch_outlines_fast = function(settings) {
    return new Promise((resolve, reject) => {
      var S, arrangement, cp, features, font_path, parameters, pipeline, source, stream_settings, text;
      ({text, font_path, features, arrangement} = settings);
      //.........................................................................................................
      parameters = [];
      parameters.push('--output-format=svg');
      parameters.push('--font-size=1000');
      if (features != null) {
        parameters.push(`--features=${features}`);
      }
      parameters.push(font_path);
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
      S = freeze({font_path, text, arrangement});
      pipeline = [];
      pipeline.push(source);
      pipeline.push(SP.$split_channels());
      // pipeline.push @$show_svg              S
      pipeline.push(this.$convert_shape_datoms(S));
      pipeline.push(this.$show_usage_counts(S));
      pipeline.push(this.$consolidate_shape_datoms(S));
      pipeline.push($show());
      pipeline.push($drain(function(R) {
        urge("fetch_outlines finished");
        return resolve(R[0]);
      }));
      SP.pull(...pipeline);
      //.........................................................................................................
      return null;
    });
  };

  //-----------------------------------------------------------------------------------------------------------
  this.demo_arranging_and_outlining_text = async function() {
    var HB, arrangement, features, font_path, outlines, settings, text;
    HB = this;
    HB.ensure_harfbuzz_version();
    font_path = 'EBGaramond12-Italic.otf';
    font_path = PATH.resolve(PATH.join(__dirname, '../fonts', font_path));
    text = "A glyph ffi shaping\nagffix谷";
    text = "A abc\nabc ffl ffi ct 谷 Z";
    text = "AThctZ";
    features = 'liga,clig,dlig,hlig';
    settings = {font_path, text, features};
    arrangement = (await HB.arrange_text(settings));
    //.........................................................................................................
    /* At this point we could check outline DB for missing outlines using the Glyf Names in `arrangement`.

    If all outlines are found then we're fine to procede; in case one or more outlines are missing, we have to
    typeset *the entire text* (unfortunately) again using `hb-view` with SVG output. We update `settings` with
    `arrangement` because only then it is possible to match outlines and Glyph Names. */
    //.........................................................................................................
    settings = {...settings, arrangement};
    return outlines = (await HB.fetch_outlines(settings));
  };

  // debug '^445^', ( k for k of SP ).sort()

  //###########################################################################################################
  if (module === require.main) {
    (() => {
      return this.demo_arranging_and_outlining_text();
    })();
  }

}).call(this);

//# sourceMappingURL=demo-harfbuzz.js.map