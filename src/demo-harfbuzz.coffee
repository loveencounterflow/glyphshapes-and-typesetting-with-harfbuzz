
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DEMO-HARFBUZZ'
debug                     = CND.get_logger 'debug',     badge
alert                     = CND.get_logger 'alert',     badge
whisper                   = CND.get_logger 'whisper',   badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
info                      = CND.get_logger 'info',      badge
echo                      = CND.echo.bind CND
#...........................................................................................................
FS                        = require 'fs'
PATH                      = require 'path'
SEMVER                    = require 'semver'
SHELL                     = require 'shelljs'


#-----------------------------------------------------------------------------------------------------------
defaults =
  verbose: true
  shell:
    verbose: false
  harfbuzz:
    semver: '^2.7.4'

#-----------------------------------------------------------------------------------------------------------
@_show_shell_output = ( output ) ->
  echo()
  help '^demo-harfbuzz@87^ stdout:', ( rpr output.stdout ) if output.stdout? and output.stdout.length > 0
  warn '^demo-harfbuzz@87^ stderr:', ( rpr output.stderr ) if output.stderr? and output.stderr.length > 0
  echo()
  return null

#-----------------------------------------------------------------------------------------------------------
@ensure_harfbuzz_version = ->
  cmds = [
    'hb-shape'
    'hb-view' ]
  #.........................................................................................................
  for cmd in cmds
    output = SHELL.exec "#{cmd} --version", { silent: ( not defaults.shell.verbose ), }
    #.......................................................................................................
    unless output.code is 0
      @_show_shell_output output
      throw new Error "^demo-harfbuzz@87^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)"
    pattern = /// ^ #{cmd} \s+ \(HarfBuzz\) \s+ (?<version>[0-9a-z.]+) \n ///
    #.......................................................................................................
    unless ( match = output.stdout.match pattern )?
      @_show_shell_output output
      throw new Error "^demo-harfbuzz@87^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)"
    #.......................................................................................................
    unless SEMVER.satisfies match.groups.version, defaults.harfbuzz.semver
      @_show_shell_output output
      throw new Error "^demo-harfbuzz@87^ found HarfBuzz #{rpr cmd} version #{rpr match.groups.version}, expected #{rpr defaults.harfbuzz.semver}"
    whisper "^33787^ #{cmd} version #{match.groups.version} OK" if defaults.verbose
  #.........................................................................................................
  return null


############################################################################################################
if module is require.main then do =>
  HB = @
  HB.ensure_harfbuzz_version()

