
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
SP                        = require 'steampipes'
{ $
  $async
  $watch
  $show
  $drain }                = SP.export()
DATOM                     = require 'datom'
{ new_datom
  freeze    }             = DATOM.export()
{ spawn }                 = require 'child_process'


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
    #.......................................................................................................
    whisper "^33787^ #{cmd} version #{match.groups.version} OK" if defaults.verbose
  #.........................................................................................................
  return null

#-----------------------------------------------------------------------------------------------------------
@$extract_hbshape_positioning = ( S ) ->
  return $ ( d, send ) ->
    return null unless d.$key is '^stdout'
    return null unless d.$value?
    return null unless ( match = d.$value.match /^(?<lnr>[0-9]+):\s+(?<positions>\[.*\])$/ )?
    send JSON.parse match.groups.positions


#-----------------------------------------------------------------------------------------------------------
### TAINT add styling, font features ###
@shape_text = ( font_path, text ) -> new Promise ( resolve, reject ) =>
  #.........................................................................................................
  parameters    = [
    '--output-format=json'
    '--show-extents'
    '--show-flags'
    '--verbose'
    font_path
    text              ]
  #.........................................................................................................
  cp              = spawn 'hb-shape', parameters
  stream_settings = { bare: true, }
  source          = SP.source_from_child_process cp, stream_settings
  S               = freeze { font_path, text, }
  pipeline        = []
  pipeline.push source
  pipeline.push SP.$split_channels()
  pipeline.push @$extract_hbshape_positioning S
  pipeline.push $show()
  pipeline.push $drain -> urge "shape_text finished"; resolve()
  SP.pull pipeline...
  #.........................................................................................................
  return null



############################################################################################################
if module is require.main then do =>
  HB = @
  HB.ensure_harfbuzz_version()
  font_path = 'EBGaramond12-Italic.otf'
  font_path = PATH.resolve PATH.join __dirname, '../fonts', font_path
  text      = "glyph ffi shaping\nagffix谷"
  await HB.shape_text font_path, text
  # debug '^445^', ( k for k of SP ).sort()

