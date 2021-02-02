(function() {
  'use strict';
  var $, $async, $drain, $show, $watch, CND, DATOM, FS, PATH, SEMVER, SHELL, SP, alert, badge, debug, defaults, echo, help, info, new_datom, rpr, urge, warn, whisper;

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

  ({new_datom} = DATOM.export());

  //-----------------------------------------------------------------------------------------------------------
  defaults = {
    verbose: true,
    shell: {
      verbose: false
    },
    harfbuzz: {
      semver: '^2.7.4'
    }
  };

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
        silent: !defaults.shell.verbose
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
      if (!SEMVER.satisfies(match.groups.version, defaults.harfbuzz.semver)) {
        this._show_shell_output(output);
        throw new Error(`^demo-harfbuzz@87^ found HarfBuzz ${rpr(cmd)} version ${rpr(match.groups.version)}, expected ${rpr(defaults.harfbuzz.semver)}`);
      }
      if (defaults.verbose) {
        //.......................................................................................................
        whisper(`^33787^ ${cmd} version ${match.groups.version} OK`);
      }
    }
    //.........................................................................................................
    return null;
  };

  //-----------------------------------------------------------------------------------------------------------
  /* TAINT add styling, font features */
  this.shape_text = function(font_path, text) {
    return new Promise((resolve, reject) => {
      var cp, path, pipeline, source, spawn;
      PATH = require('path');
      FS = require('fs');
      SP = require('steampipes');
      ({spawn} = require('child_process'));
      ({$, $show, $watch, $drain} = SP.export());
      //.........................................................................................................
      path = PATH.join(__dirname, '../samples');
      cp = spawn('ls', ['-AlF', path]);
      source = SP.source_from_child_process(cp, {
        bare: true
      });
      pipeline = [];
      pipeline.push(source);
      pipeline.push(SP.$split_channels());
      pipeline.push($show());
      pipeline.push($drain(function() {
        urge("demo_high_level finished");
        return resolve();
      }));
      SP.pull(...pipeline);
      //.........................................................................................................
      return null;
    });
  };

  //###########################################################################################################
  if (module === require.main) {
    (async() => {
      var HB, font_path, text;
      HB = this;
      HB.ensure_harfbuzz_version();
      font_path = 'EBGaramond12-Italic.otf';
      font_path = PATH.resolve(PATH.join(__dirname, '../fonts', font_path));
      text = "glyph ffi shaping";
      return (await HB.shape_text(font_path, text));
    })();
  }

  // debug '^445^', ( k for k of SP ).sort()

}).call(this);

//# sourceMappingURL=demo-harfbuzz.js.map