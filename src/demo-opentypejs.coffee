
'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'DEMO-OPENTYPEJS'
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
OTJS                      = require 'opentype.js'

warn CND.reverse "opentype.js probably does not provide proper shaping beyond Latin ligatures"


#-----------------------------------------------------------------------------------------------------------
@otfont_from_path = ( path ) -> await OTJS.load path

#-----------------------------------------------------------------------------------------------------------
@shape_text = ( otfont, text ) ->
  return otfont.stringToGlyphs text
    # continue if R[ glyph.index ]?
    # path              = glyph.getPath 0, 0, 1000
    # svg_pathdata      = path.toPathData 2
    # R[ glyph.index ]  = svg_pathdata
  # return R


#===========================================================================================================
# DEMO SHAPE TEXT
#-----------------------------------------------------------------------------------------------------------
@demo_shape_text = ->
  resolve_path  = ( path ) -> PATH.resolve PATH.join __dirname, '../fonts', path
  features      = { liga: true, clig: true, dlig: true, hlig: true, }
  path          = 'EBGaramond08-Italic.otf'
  path          = resolve_path path
  otfont        = await OTJS.load path
  for d in ( otfont.getPath 'a', 0, 150, 72 ).commands
    debug d
  for glyph in otfont.stringToGlyphs 'xffix'
    help glyph
    path = glyph.getPath 0, 0, 1000
    urge path.toPathData 2
  debug @shape_text otfont, 'xffix'
  return null



############################################################################################################
if module is require.main then do =>
  await @demo_shape_text()


