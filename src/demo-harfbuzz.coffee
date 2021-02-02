
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
types                     = new ( require 'intertype' ).Intertype()
{ isa
  validate }              = types.export()


#-----------------------------------------------------------------------------------------------------------
defaults =
  internal:
    verbose: true
    shell:
      verbose: false
    harfbuzz:
      semver: '^2.7.4'
  hb_settings:
    font_path:    null
    text:         null
    features:     null

#-----------------------------------------------------------------------------------------------------------
types.declare 'hb_settings', tests:
  "x is an object":                 ( x ) -> @isa.object          x
  "x.font_path is a text":          ( x ) -> @isa.text            x.font_path
  "x.text is a text":               ( x ) -> @isa.text            x.text
  "x.features is an optional text": ( x ) -> @isa_optional.text   x.features


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
    output = SHELL.exec "#{cmd} --version", { silent: ( not defaults.internal.shell.verbose ), }
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
    unless SEMVER.satisfies match.groups.version, defaults.internal.harfbuzz.semver
      @_show_shell_output output
      throw new Error "^demo-harfbuzz@87^ found HarfBuzz #{rpr cmd} version #{rpr match.groups.version}, expected #{rpr defaults.internal.harfbuzz.semver}"
    #.......................................................................................................
    whisper "^33787^ #{cmd} version #{match.groups.version} OK" if defaults.internal.verbose
  #.........................................................................................................
  return null

#-----------------------------------------------------------------------------------------------------------
@$extract_hbshape_positioning = ( S ) ->
  return $ ( d, send ) ->
    return null unless d.$key is '^stdout'
    return null unless d.$value?
    ### NOTE first try simple format, then format that includes line numbers ###
    unless ( match = d.$value.match /^(?<positions>\[.*\])$/ )?
      return null unless ( match = d.$value.match /^(?<lnr>[0-9]+):\s+(?<positions>\[.*\])$/ )?
    send JSON.parse match.groups.positions

#-----------------------------------------------------------------------------------------------------------
@$convert_shape_datoms = ( S ) ->
  symbol_id     = null
  path_start    = '<path style="stroke:none;" d="'
  path_end      = ' "/>'
  use_pattern   = /^\s*<use xlink:href="#(?<symbol_id>[^"]+)" x="(?<dx>[^"]+)" y="(?<dy>[^"]+)"\/>/
  use_idx       = -1
  return $ ( d, send ) ->
    return null unless d.$key is '^stdout'
    return null unless ( value = d.$value )?
    return null if ( value.match /^<\// )?
    return null if value is '<defs>'
    return null if value is '<g>'
    return null if value.startsWith '<?xml '
    return null if value.startsWith '<g '
    return null if value.startsWith '<rect ' ### NOTE could extract visual text extent from background box ###
    #.......................................................................................................
    if value.startsWith '<svg '
      ### NOTE may want to extract width, height, viewBox ###
      return null
    #.......................................................................................................
    if value.startsWith '<symbol '
      ### TAINT validate that symbol_id was found ###
      symbol_id = value.replace /^.*\sid="([^"]+)".*$/, '$1'
      return null
    #.......................................................................................................
    if value is '<path style="stroke:none;" d=""/>'
      # warn '^7767^', d
      # send new_datom '^space'
      send new_datom '^glyfpath', { symbol_id, svgpath: null, gname: 'space', }
      return null
    #.......................................................................................................
    if ( value.startsWith path_start ) and ( value.endsWith path_end )
      svgpath = value[ path_start.length ... value.length - path_end.length ]
      send new_datom '^glyfpath', { symbol_id, svgpath, }
      return null
    #.......................................................................................................
    if ( match = value.match use_pattern )?
      use_idx++
      data = match.groups
      if S.arrangement?
        data.gname = S.arrangement[ use_idx ]?.g ? null
      send new_datom '^use', data
      return null
    #.......................................................................................................
    throw new Error "^demo-harfbuzz@87^ unexpected SVG element #{rpr value}"
    return null

#-----------------------------------------------------------------------------------------------------------
@$show_positionings = ( S ) ->
  last      = Symbol 'last'
  count     = 0
  return $watch { last, }, ( d ) ->
    if d is last
      urge CND.reverse "found #{count} glyph positionings"
      return null
    return null unless isa.list d
    count += d.length
    for shape in d
      info shape
    return null

#-----------------------------------------------------------------------------------------------------------
@$show_usage_counts = ( S ) ->
  last      = Symbol 'last'
  count     = 0
  return $watch { last, }, ( d ) ->
    if d is last
      urge CND.reverse "found #{count} usage tags"
      return null
    return null unless d.$key is '^use'
    count++
    return null

#-----------------------------------------------------------------------------------------------------------
@$show_svg = ( S ) ->
  last      = Symbol 'last'
  collector = []
  return $watch { last, }, ( d ) ->
    if d is last
      urge '\n' + collector.join '\n'
      return null
    return null unless d.$key is '^stdout'
    return null unless ( value = d.$value )?
    collector.push value

#-----------------------------------------------------------------------------------------------------------
### TAINT add styling, font features ###
@arrange_text = ( settings ) -> new Promise ( resolve, reject ) =>
  settings      = { defaults.hb_settings..., settings..., }
  validate.hb_settings settings
  { text
    font_path
    features }  = settings
  #.........................................................................................................
  parameters    = []
  parameters.push '--output-format=json'
  parameters.push '--font-size=1000'
  parameters.push "--features=#{features}" if features?
    # '--no-glyph-names' ### NOTE when active, output glyf IDs instead of glyph names ###
    # '--show-extents'
    # '--show-flags'
    # '--verbose'
  parameters.push font_path
  parameters.push text
  #.........................................................................................................
  cp              = spawn 'hb-shape', parameters
  stream_settings = { bare: true, }
  source          = SP.source_from_child_process cp, stream_settings
  S               = freeze { font_path, text, }
  pipeline        = []
  pipeline.push source
  pipeline.push SP.$split_channels()
  pipeline.push $watch ( d ) => whisper '^33344^', d
  pipeline.push @$extract_hbshape_positioning S
  pipeline.push @$show_positionings           S
  pipeline.push $drain ( R ) -> urge "arrange_text finished"; resolve R.flat Infinity
  SP.pull pipeline...
  #.........................................................................................................
  return null

#-----------------------------------------------------------------------------------------------------------
### TAINT add styling, font features ###
#-----------------------------------------------------------------------------------------------------------
@fetch_outlines = ( settings, arrangement = null ) ->
  settings      = { defaults.hb_settings..., settings..., }
  validate.hb_settings settings
  return @_fetch_outlines settings, arrangement

#-----------------------------------------------------------------------------------------------------------
@_fetch_outlines = ( settings, arrangement = null ) -> new Promise ( resolve, reject ) =>
  { text
    font_path
    features }  = settings
  #.........................................................................................................
  parameters    = []
  parameters.push '--output-format=svg'
  parameters.push '--font-size=1000'
  parameters.push "--features=#{features}" if features?
  parameters.push font_path
  parameters.push text
    # '--show-extents'
    # '--show-flags'
    # '--verbose'
  #.........................................................................................................
  cp              = spawn 'hb-view', parameters
  stream_settings = { bare: true, }
  source          = SP.source_from_child_process cp, stream_settings
  S               = freeze { font_path, text, arrangement, }
  pipeline        = []
  pipeline.push source
  pipeline.push SP.$split_channels()
  # pipeline.push @$show_svg              S
  pipeline.push @$convert_shape_datoms  S
  pipeline.push $show()
  pipeline.push @$show_usage_counts     S
  pipeline.push $drain -> urge "fetch_outlines finished"; resolve()
  SP.pull pipeline...
  #.........................................................................................................
  return null



############################################################################################################
if module is require.main then do =>
  HB = @
  HB.ensure_harfbuzz_version()
  font_path = 'EBGaramond12-Italic.otf'
  font_path = PATH.resolve PATH.join __dirname, '../fonts', font_path
  text      = "A glyph ffi shaping\nagffix谷"
  text      = "A abc\nabc ffl ffi ct 谷 Z"
  text      = "AThctZ"
  features  = 'liga,clig,dlig,hlig'
  settings  = { font_path, text, features, }
  help '^3334^', arrangement = await HB.arrange_text settings
  ### TAINT make arrangement part of settings? ###
  await HB.fetch_outlines settings, arrangement
  # debug '^445^', ( k for k of SP ).sort()

