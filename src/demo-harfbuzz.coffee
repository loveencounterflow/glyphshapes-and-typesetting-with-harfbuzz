
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
  hb_cfg:
    font:
      path:         null
      features:     null
    text:         null
    arrangement:  null

#-----------------------------------------------------------------------------------------------------------
types.declare 'hb_cfg', tests:
  "x is an object":                 ( x ) -> @isa.object          x
  "x.text is a text":               ( x ) -> @isa.text            x.text
  "x.font is a hb_font":            ( x ) -> @isa.hb_font         x.font
  "x.arrangement is an optional list of objects": ( x ) ->
    return true unless x.arrangement?
    return @isa_list_of.object x.arrangement

#-----------------------------------------------------------------------------------------------------------
types.declare 'hb_font', tests:
  "x is an object":                 ( x ) -> @isa.object          x
  "x.path is a nonempty_text":      ( x ) -> @isa.nonempty_text   x.path
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
@$extract_hbshape_positioning = ( cfg ) ->
  return $ ( d, send ) ->
    return null unless d.$key is '^stdout'
    return null unless d.$value?
    ### NOTE first try simple format, then format that includes line numbers ###
    unless ( match = d.$value.match /^(?<positions>\[.*\])$/ )?
      return null unless ( match = d.$value.match /^(?<lnr>[0-9]+):\s+(?<positions>\[.*\])$/ )?
    send JSON.parse match.groups.positions

#-----------------------------------------------------------------------------------------------------------
@$convert_shape_datoms = ( cfg ) ->
  symid         = null
  path_start    = '<path style="stroke:none;" d="'
  path_end      = ' "/>'
  use_pattern   = /^\s*<use xlink:href="#(?<symid>[^"]+)" x="(?<dx>[^"]+)" y="(?<dy>[^"]+)"\/>/
  use_idx       = -1
  #.........................................................................................................
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
      ### TAINT validate that symid was found ###
      symid = value.replace /^.*\sid="([^"]+)".*$/, '$1'
      return null
    #.......................................................................................................
    if value is '<path style="stroke:none;" d=""/>'
      # warn '^7767^', d
      # send new_datom '^space'
      send new_datom '^glyfpath', { symid, glyfpath: null, glyfname: 'space', }
      return null
    #.......................................................................................................
    if ( value.startsWith path_start ) and ( value.endsWith path_end )
      glyfpath = value[ path_start.length ... value.length - path_end.length ]
      send new_datom '^glyfpath', { symid, glyfpath, }
      return null
    #.......................................................................................................
    if ( match = value.match use_pattern )?
      use_idx++
      data = match.groups
      if cfg.arrangement?
        unless ( data.glyfname = cfg.arrangement[ use_idx ]?.g ? null )?
          throw new Error "^demo-harfbuzz@87^ passed arrangement but use_idx #{use_idx} has no entry"
      send new_datom '^use', data
      return null
    #.......................................................................................................
    throw new Error "^demo-harfbuzz@87^ unexpected SVG element #{rpr value}"
    return null

#-----------------------------------------------------------------------------------------------------------
@$consolidate_shape_datoms = ( cfg ) ->
  last            = Symbol 'last'
  path_by_symid   = {}
  R               = {}
  #.........................................................................................................
  return $ { last, }, ( d, send ) ->
    if d is last
      # whisper '^6667^', path_by_symid
      return send R
    #.......................................................................................................
    # whisper '^784^', d
    # whisper '^784^', ( k for k of path_by_symid )
    switch d.$key
      when '^glyfpath'
        path_by_symid[ d.symid ] = d.glyfpath
      when '^use'
        return null unless ( glyfname = d.glyfname )?
        unless ( glyfpath = path_by_symid[ d.symid ] )?
          throw new Error "^demo-harfbuzz@87^ unable to locate glyfpath for glyfname #{glyfname}"
        R[ glyfname ] = glyfpath
      else
        throw new Error "^demo-harfbuzz@87^ unexpected datom #{rpr d}"
    return null

#-----------------------------------------------------------------------------------------------------------
@$show_positionings = ( cfg ) ->
  last      = Symbol 'last'
  count     = 0
  #.........................................................................................................
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
@$show_usage_counts = ( cfg ) ->
  last      = Symbol 'last'
  count     = 0
  #.........................................................................................................
  return $watch { last, }, ( d ) ->
    if d is last
      urge CND.reverse "found #{count} usage tags"
      return null
    return null unless d.$key is '^use'
    count++
    return null

#-----------------------------------------------------------------------------------------------------------
@$show_svg = ( cfg ) ->
  last      = Symbol 'last'
  collector = []
  #.........................................................................................................
  return $watch { last, }, ( d ) ->
    if d is last
      urge '\n' + collector.join '\n'
      return null
    return null unless d.$key is '^stdout'
    return null unless ( value = d.$value )?
    collector.push value

#-----------------------------------------------------------------------------------------------------------
### TAINT add styling, font features ###
@arrange_text = ( cfg ) -> new Promise ( resolve, reject ) =>
  cfg      = { defaults.hb_cfg..., cfg..., }
  validate.hb_cfg cfg
  { text
    font      } = cfg
  { path
    features }  = font
  #.........................................................................................................
  ### TAINT code duplication ###
  parameters    = []
  parameters.push '--output-format=json'
  parameters.push '--font-size=1000'
  parameters.push "--features=#{font.features}" if font.features?
    # '--no-glyph-names' ### NOTE when active, output glyf IDs instead of glyph names ###
    # '--show-extents'
    # '--show-flags'
    # '--verbose'
  parameters.push font.path
  parameters.push text
  #.........................................................................................................
  cp              = spawn 'hb-shape', parameters
  stream_settings = { bare: true, }
  source          = SP.source_from_child_process cp, stream_settings
  pipeline        = []
  pipeline.push source
  pipeline.push SP.$split_channels()
  pipeline.push $watch ( d ) => whisper '^33344^', d
  pipeline.push @$extract_hbshape_positioning cfg
  pipeline.push @$show_positionings           cfg
  pipeline.push $drain ( R ) -> urge "arrange_text finished"; resolve R.flat Infinity
  SP.pull pipeline...
  #.........................................................................................................
  return null

#-----------------------------------------------------------------------------------------------------------
@fetch_outlines = ( cfg ) ->
  cfg      = { defaults.hb_cfg..., cfg..., }
  validate.hb_cfg cfg
  return @fetch_outlines_fast cfg

#-----------------------------------------------------------------------------------------------------------
@fetch_outlines_fast = ( cfg ) -> new Promise ( resolve, reject ) =>
  { text
    font
    arrangement } = cfg
  #.........................................................................................................
  parameters    = []
  parameters.push '--output-format=svg'
  parameters.push '--font-size=1000'
  parameters.push "--features=#{font.features}" if font.features?
  parameters.push font.path
  parameters.push text
    # '--show-extents'
    # '--show-flags'
    # '--verbose'
  #.........................................................................................................
  cp              = spawn 'hb-view', parameters
  stream_settings = { bare: true, }
  source          = SP.source_from_child_process cp, stream_settings
  pipeline        = []
  pipeline.push source
  pipeline.push SP.$split_channels()
  # pipeline.push @$show_svg              cfg
  pipeline.push @$convert_shape_datoms      cfg
  pipeline.push @$show_usage_counts         cfg
  pipeline.push @$consolidate_shape_datoms  cfg
  pipeline.push $show()
  pipeline.push $drain ( R ) -> urge "fetch_outlines finished"; resolve R[ 0 ]
  SP.pull pipeline...
  #.........................................................................................................
  return null

#-----------------------------------------------------------------------------------------------------------
@shape_text = ( cfg ) ->
  arrangement           = await @arrange_text cfg
  cfg                   = { cfg..., arrangement, }
  outlines              = await @fetch_outlines_fast cfg
  return outlines

#-----------------------------------------------------------------------------------------------------------
@demo_arranging_and_outlining_text = ( cfg ) ->
  HB                    = @
  HB.ensure_harfbuzz_version()
  font                  =
    path:                 'EBGaramond12-Italic.otf'
    features:             'liga,clig,dlig,hlig'
  font.path             = PATH.resolve PATH.join __dirname, '../fonts', font.path
  # text                  = "A glyph ffi shaping\nagffix谷"
  # text                  = "A abc\nabc ffl ffi ct 谷 Z"
  # text                  = "AThctZ"
  text                  = "AxZ"
  cfg                   = { font, text, }
  arrangement           = await HB.arrange_text cfg
  #.........................................................................................................
  ### At this point we could check outline DB for missing outlines using the Glyf Names in `arrangement`.

  If all outlines are found then we're fine to procede; in case one or more outlines are missing, we have to
  typeset *the entire text* (unfortunately) again using `hb-view` with SVG output. We update `cfg` with
  `arrangement` because only then it is possible to match outlines and Glyph Names. ###
  #.........................................................................................................
  cfg                   = { cfg..., arrangement, }
  outlines              = await HB.fetch_outlines cfg
  # debug '^445^', ( k for k of SP ).sort()


############################################################################################################
if module is require.main then do =>
  @demo_arranging_and_outlining_text()

