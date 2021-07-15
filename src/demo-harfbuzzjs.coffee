
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DEMO-HARFBUZZJS'
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
@types                    = require './types'
{ isa
  validate }              = @types.export()
HBJS                        = null
# harfbuzzjs_path           = '../../../3rd-party-repos/harfbuzzjs'
harfbuzzjs_path           = 'harfbuzzjs'

warn CND.reverse "harfbuzzjs doesn't support font features"


#-----------------------------------------------------------------------------------------------------------
__demo_outline = ( filename, font, text_shape ) ->
  HBJS       ?= await require harfbuzzjs_path
  cursor_x  = 0
  cursor_y  = 0
  R         = []
  for glyph in text_shape
    gid       = glyph.g
    delta_x   = glyph.ax
    dx        = glyph.dx
    dy        = glyph.dy
    svg_path  = font.glyphToPath gid
    debug '^3234234^', ( CND.yellow filename ), ( CND.lime gid ), ( CND.steel ( rpr svg_path )[ .. 100 ] )
    R.push svg_path
    # # You need to supply this bit
    # drawAGlyph(svg_path, cursor_x + dx, dy)
    cursor_x += delta_x
  return R

#-----------------------------------------------------------------------------------------------------------
__demo_text_shape = ( path, text ) ->
  HBJS       ?= await require harfbuzzjs_path
  filename  = PATH.basename path
  font_blob = new Uint8Array FS.readFileSync path
  blob      = HBJS.createBlob font_blob
  face      = HBJS.createFace blob, 0
  font      = HBJS.createFont face
  ### NOTE Units per em. Optional; taken from font if not given ###
  font.setScale 1000, 1000
  buffer    = HBJS.createBuffer()
  try
    buffer.addText text
    buffer.guessSegmentProperties()
    ### NOTE optional as can be set by guessSegmentProperties also: ###
    # buffer.setDirection 'ltr'
    ### TAINT silently discards unknown features ###
    features = { kern: true, liga: true, xxx: true, }
    HBJS.shape font, buffer, features
    R = buffer.json font
    demo_outline filename, font, R
    # bbox = xmin + ' ' + ymin + ' ' + width + ' ' + height;
    # "<svg xmlns='http://www.w3.org/2000/svg' height='128' viewBox='#{bbox}'>"
    # "<path d='#{svg_path}'/></svg>"
  finally
    buffer.destroy()
    font.destroy()
    face.destroy()
    blob.destroy()
  return R



#===========================================================================================================
# HELPERS
#-----------------------------------------------------------------------------------------------------------
@_hbjs_cache_from_path = ( HBJS, path ) ->
  font_blob = new Uint8Array FS.readFileSync path
  blob      = HBJS.createBlob font_blob
  face      = HBJS.createFace blob, 0
  hbjsfont  = HBJS.createFont face
  hbjsfont.setScale 1000, 1000
  return { font_blob, blob, face, hbjsfont, }



#===========================================================================================================
# ARRANGE
# #-----------------------------------------------------------------------------------------------------------
# @add_missing_outlines = ( me ) ->
#   HBJS               ?= await require harfbuzzjs_path
#   me.cache.hbjs      ?= @_hbjs_cache_from_path HBJS, me.path
#   { hbjs }            = me.cache
#   { features }        = me
#   me.outlines        ?= {}
#   #.........................................................................................................
#   # cursor_x  = 0
#   # cursor_y  = 0
#   R         = {}
#     gid       = glyph.g
#     # delta_x   = glyph.ax
#     # dx        = glyph.dx
#     # dy        = glyph.dy
#     svg_path  = hbjs.hbjsfont.glyphToPath gid
#     debug '^3234234^', ( CND.lime gid ), ( CND.steel ( rpr svg_path )[ .. 100 ] )
#     # R.push svg_path
#     # # You need to supply this bit
#     # drawAGlyph(svg_path, cursor_x + dx, dy)
#     # cursor_x += delta_x
#   #.........................................................................................................
#   return null


#===========================================================================================================
# ARRANGE
#-----------------------------------------------------------------------------------------------------------
### TAINT add styling, font features ###
@arrange_text = ( me, text ) ->
  HBJS               ?= await require harfbuzzjs_path
  me.cache.hbjs      ?= @_hbjs_cache_from_path HBJS, me.path
  { hbjs }            = me.cache
  { features }        = me
  # debug '^333489^', ( k for k of HBJS )
  # debug '^333489^', ( k for k of hbjs.hbjsfont )
  # debug '^333489^', ( k for k of hbjs.buffer )
  me.outlines        ?= {}
  #.........................................................................................................
  ### TAINT can we keep existing buffer for new text? ###
  hbjs.buffer = HBJS.createBuffer()
  hbjs.buffer.addText text
  hbjs.buffer.guessSegmentProperties()
  HBJS.shape hbjs.hbjsfont, hbjs.buffer, features
  ### NOTE may change to arrangements as list ###
  me.arrangement = hbjs.buffer.json hbjs.hbjsfont
  #.........................................................................................................
  ### TAINT make outlining a matter of configuration ###
  if false
    for glyph in me.arrangement
      me.outlines[ glyph.g ] ?= hbjs.hbjsfont.glyphToPath glyph.g
  #.........................................................................................................
  ### TAINT return only arrangement for the sake of benchmarking ###
  return me.arrangement


#===========================================================================================================
# HIGH-LEVEL API
#-----------------------------------------------------------------------------------------------------------
@new_fontshaper = ( path, features = null ) ->
  R = { @types.defaults.hb_cfg..., path, features, cache: {}, }
  validate.hb_fontshaper R
  return R

#-----------------------------------------------------------------------------------------------------------
@destruct = ( me ) ->
  me.cache.hbjs?.buffer?.destroy()
  me.cache.hbjs?.hbjsfont?.destroy()
  me.cache.hbjs?.face?.destroy()
  me.cache.hbjs?.blob?.destroy()
  return null

#-----------------------------------------------------------------------------------------------------------
@shape_text = ( me, text ) ->
  @types.validate.hb_fontshaper me
  return @fast_shape_text me, text

#-----------------------------------------------------------------------------------------------------------
@fast_shape_text = ( me, text ) ->
  await @arrange_text         me, text
  # await @add_missing_outlines me
  return null


#===========================================================================================================
# DEMO SHAPE TEXT
#-----------------------------------------------------------------------------------------------------------
@demo_shape_text = ->
  HB            = @
  # result.instance.exports.memory.grow(400); // each page is 64kb in size
  resolve_path  = ( path ) -> PATH.resolve PATH.join __dirname, '../fonts', path
  features      = { liga: true, clig: true, dlig: true, hlig: true, }
  text          = 'abcdefABCDEF'
  paths         = [
    # 'unifraktur/UnifrakturMaguntia16.ttf'
    # 'SourceHanSans-Bold003.ttf'
    # # 'HanaMinExB.otf'
    # 'FZKaiT.TTF'
    # 'Ubuntu-R.ttf'
    # 'DejaVuSansCondensed-Bold.ttf'
    # 'NotoSerifJP/NotoSerifJP-Bold.otf'
    'EBGaramond08-Italic.otf'
    # 'EBGaramond08-Regular.otf'
    # 'EBGaramond12-AllSC.otf'
    # 'EBGaramond12-Italic.otf'
    # 'EBGaramond12-Regular.otf'
    # 'EBGaramond-InitialsF1.otf'
    # 'EBGaramond-InitialsF2.otf'
    # 'EBGaramond-Initials.otf'
    # 'EBGaramondSC08-Regular.otf'
    # 'EBGaramondSC12-Regular.otf'
    ]
  #.........................................................................................................
  for path in paths
    debug '^33443^', path
    try
      path                  = resolve_path path
      fs                    = HB.new_fontshaper path, features
      await HB.shape_text fs, text
      for d in fs.arrangement
        urge d
      for gid, outline of fs.outlines
        debug '^3234234^', ( CND.lime gid ), ( CND.steel ( rpr outline )[ .. 100 ] )
    finally
      # debug '^333322^', fs
      HB.destruct fs
  #.........................................................................................................
  return null



############################################################################################################
if module is require.main then do =>
  await @demo_shape_text()


