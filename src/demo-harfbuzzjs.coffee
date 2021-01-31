
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'INTERPLOT/SCRATCH'
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
HB                        = null

warn CND.reverse "* harfbuzzjs doesn't have font feature switches (python version has them)"
# warn()
# warn CND.reverse "this code has been moved to jzr/font-outlines-as-svg"
# process.exit 1

#-----------------------------------------------------------------------------------------------------------
demo_text_shape = ( font_blob, text ) ->
  blob      = HB.createBlob font_blob
  face      = HB.createFace blob, 0
  font      = HB.createFont face
  ### NOTE Units per em. Optional; taken from font if not given ###
  font.setScale 1000, 1000
  buffer    = HB.createBuffer()
  try
    buffer.addText text
    buffer.guessSegmentProperties()
    ### NOTE optional as can be set by guessSegmentProperties also: ###
    # buffer.setDirection 'ltr'
    ### TAINT silently discards unknown features ###
    features = { kern: true, liga: true, xxx: true, }
    HB.shape font, buffer, features
    R = buffer.json font
    debug '^43242^', demo_outline font, R
    # bbox = xmin + ' ' + ymin + ' ' + width + ' ' + height;
    # "<svg xmlns='http://www.w3.org/2000/svg' height='128' viewBox='#{bbox}'>"
    # "<path d='#{svg_path}'/></svg>"
  finally
    buffer.destroy()
    font.destroy()
    face.destroy()
    blob.destroy()
  return R

#-----------------------------------------------------------------------------------------------------------
demo_outline = ( font, text_shape ) ->
  cursor_x  = 0
  cursor_y  = 0
  R         = []
  for glyph in text_shape
    gid       = glyph.g
    delta_x   = glyph.ax
    dx        = glyph.dx
    dy        = glyph.dy
    svg_path  = font.glyphToPath gid
    debug '^3234234^', gid, rpr svg_path
    R.push svg_path
    # # You need to supply this bit
    # drawAGlyph(svg_path, cursor_x + dx, dy)
    cursor_x += delta_x
  return R



############################################################################################################
if module is require.main then do =>
  f = ->
    # path                = 'unifraktur/UnifrakturMaguntia16.ttf'
    # path                = 'SourceHanSans-Bold003.ttf'
    # path                = 'HanaMinExB.otf'
    path                = 'FZKaiT.TTF'
    # path                = 'EBGaramond08-Regular.otf'
    path                = PATH.join __dirname, '../jizura-fonts', path
    path                = PATH.resolve path
    font_blob           = new Uint8Array FS.readFileSync path
    # HB                  = await require 'harfbuzzjs'
    HB                  = await require '../../../3rd-party-repos/harfbuzzjs'
    # debug '^43435^', ( k for k of HB )
    # text                = 'Just Text.做過很多'
    text                = 'a'
    for d in demo_text_shape font_blob, text
      urge d
    return null
  await f()

