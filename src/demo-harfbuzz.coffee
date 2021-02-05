
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
@types                    = require './__OLD__types'
{ isa
  validate
  type_of  }              = @types.export()




#===========================================================================================================
# ENSURE HARFBUZZ INSTALLED
#-----------------------------------------------------------------------------------------------------------
@_show_shell_output = ( output ) ->
  echo()
  help '^demo-harfbuzz@100^ stdout:', ( rpr output.stdout ) if output.stdout? and output.stdout.length > 0
  warn '^demo-harfbuzz@101^ stderr:', ( rpr output.stderr ) if output.stderr? and output.stderr.length > 0
  echo()
  return null

#-----------------------------------------------------------------------------------------------------------
@ensure_harfbuzz_version = ->
  cmds = [
    'hb-shape'
    'hb-view' ]
  #.........................................................................................................
  for cmd in cmds
    output = SHELL.exec "#{cmd} --version", { silent: ( not @types.defaults.internal.verbose ), }
    #.......................................................................................................
    unless output.code is 0
      @_show_shell_output output
      throw new Error "^demo-harfbuzz@102^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)"
    pattern = /// ^ #{cmd} \s+ \(HarfBuzz\) \s+ (?<version>[0-9a-z.]+) \n ///
    #.......................................................................................................
    unless ( match = output.stdout.match pattern )?
      @_show_shell_output output
      throw new Error "^demo-harfbuzz@103^ ensure that harfbuzz is available on the path (recommendation: `homebrew install harfbuzz` on Linux, Mac)"
    #.......................................................................................................
    unless SEMVER.satisfies match.groups.version, @types.defaults.internal.harfbuzz.semver
      @_show_shell_output output
      throw new Error "^demo-harfbuzz@104^ found HarfBuzz #{rpr cmd} version #{rpr match.groups.version}, expected #{rpr @types.defaults.internal.harfbuzz.semver}"
    #.......................................................................................................
    whisper "^33787^ #{cmd} version #{match.groups.version} OK" if @types.defaults.internal.verbose
  #.........................................................................................................
  return null

#===========================================================================================================
# HELPERS
#-----------------------------------------------------------------------------------------------------------
@_features_as_text = ( features ) ->
  ### Turn feature object like `{ liga: true, clig: true, dlig: true, hlig: true, }` into feature strings
  like `'liga,clig,dlig,hlig'` ###
  return features if isa.text features
  R = []
  for feature, value of features
    R.push switch ( type = type_of value )
      when 'boolean'  then if value is true then feature else "#{feature}=false"
      when 'text'     then if value is ''   then feature else "#{feature}=#{value}"
      when 'number'   then "#{feature}=#{value}"
      else throw new Error "^demo-harfbuzz@104^ unable to convert a #{type} into a feature string"
  return R.join ','


#===========================================================================================================
# ARRANGEMENT
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
  use_pattern   = /^<use xlink:href="#(?<symid>[^"]+)" x="(?<dx>[^"]+)" y="(?<dy>[^"]+)"\/>/
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
    # #.......................................................................................................
    # if value.startsWith '<clipPath '
    #   ### NOTE only occurs on very long lines ###
    #   ### TAINT can we indeed ignore it? ###
    #   return null
    #.......................................................................................................
    if value is '<path style="stroke:none;" d=""/>'
      send new_datom '^glyfpath', { symid, glyfpath: '', glyfname: 'space', }
      return null
    #.......................................................................................................
    value = value.trimLeft()
    # #.......................................................................................................
    # if value.startsWith '<path d='
    #   debug '^33334^', value
    #   return null
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
          throw new Error "^demo-harfbuzz@105^ passed arrangement but use_idx #{use_idx} has no entry"
      send new_datom '^use', data
      return null
    #.......................................................................................................
    throw new Error "^demo-harfbuzz@106^ unexpected SVG element #{rpr value}"
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
          throw new Error "^demo-harfbuzz@107^ unable to locate glyfpath for glyfname #{glyfname}"
        R[ glyfname ] = glyfpath
      else
        throw new Error "^demo-harfbuzz@108^ unexpected datom #{rpr d}"
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
### TAINT add styling, font features ###
@arrange_text = ( cfg ) -> new Promise ( resolve, reject ) =>
  cfg           = { @types.defaults.hb_cfg..., cfg..., }
  validate.hb_cfg cfg
  { text
    font      } = cfg
  { path
    features }  = font
  #.........................................................................................................
  ### TAINT code duplication ###
  ### TAINT cache parameters, esp. features ###
  parameters    = []
  parameters.push '--output-format=json'
  parameters.push '--font-size=1000'
  parameters.push "--features=#{@_features_as_text font.features}" if font.features?
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
  pipeline.push SP.$select '^stderr', ( d ) -> reject new Error d.$value
  ( pipeline.push $watch ( d ) => whisper '^33344^', d ) if @types.defaults.internal.verbose
  pipeline.push @$extract_hbshape_positioning cfg
  ( pipeline.push @$show_positionings           cfg ) if @types.defaults.internal.verbose
  pipeline.push $drain ( R ) =>
    urge "arrange_text finished" if @types.defaults.internal.verbose
    resolve R.flat Infinity
  SP.pull pipeline...
  #.........................................................................................................
  return null


#===========================================================================================================
# FETCH OUTLINES
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
@fetch_outlines = ( cfg ) ->
  cfg      = { @types.defaults.hb_cfg..., cfg..., }
  validate.hb_cfg cfg
  return @fetch_outlines_fast cfg

#-----------------------------------------------------------------------------------------------------------
@fetch_outlines_fast = ( cfg ) -> new Promise ( resolve, reject ) =>
  { text
    font
    arrangement } = cfg
  #.........................................................................................................
  ### TAINT code duplication ###
  ### TAINT cache parameters, esp. features ###
  parameters    = []
  parameters.push '--output-format=svg'
  parameters.push '--font-size=1000'
  parameters.push "--features=#{@_features_as_text font.features}" if font.features?
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
  pipeline.push SP.$select '^stderr', ( d ) -> reject new Error d.$value
  pipeline.push @$convert_shape_datoms      cfg
  ( pipeline.push @$show_usage_counts         cfg ) if @types.defaults.internal.verbose
  pipeline.push @$consolidate_shape_datoms  cfg
  ( pipeline.push $show() ) if @types.defaults.internal.verbose
  pipeline.push $drain ( R ) =>
    urge "fetch_outlines finished" if @types.defaults.internal.verbose
    resolve R[ 0 ]
  SP.pull pipeline...
  #.........................................................................................................
  return null


#===========================================================================================================
# HIGH-LEVEL API
#-----------------------------------------------------------------------------------------------------------
@shape_text = ( cfg ) ->
  arrangement           = await @arrange_text cfg
  cfg                   = { cfg..., arrangement, }
  outlines              = await @fetch_outlines_fast cfg
  return { arrangement, outlines, }


#===========================================================================================================
# DEMO
#-----------------------------------------------------------------------------------------------------------
@demo_arranging_and_outlining_text = ( cfg ) ->
  HB                    = @
  HB.ensure_harfbuzz_version()
  font                  =
    path:                 'EBGaramond12-Italic.otf'
    features:             { liga: true, clig: true, dlig: true, hlig: true, }
  font.path             = PATH.resolve PATH.join __dirname, '../fonts', font.path
  # text                  = "A glyph ffi shaping\nagffix谷"
  # text                  = "A abc\nabc ffl ffi ct 谷 Z"
  # text                  = "AThctZ"
  text                  = "A x Z"
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
  for d in arrangement
    help d
  for glyfname, outline of outlines
    urge ( CND.pen { glyfname, d: outline, } ).trim()[ ... 100 ] + '…'
  return null


############################################################################################################
if module is require.main then do =>
  @demo_arranging_and_outlining_text()
  # @ensure_harfbuzz_version()
  # help await @shape_text { font: { path: '/home/flow/jzr/glyphshapes-and-typesetting-with-harfbuzz/fonts/EBGaramond12-Italic.otf', features: 'liga,clig,dlig,hlig' }, text: 'AxZ' }
  # help await @shape_text { font: { path: 'nosuchfile', features: 'liga,clig,dlig,hlig' }, text: 'AxZ' }

