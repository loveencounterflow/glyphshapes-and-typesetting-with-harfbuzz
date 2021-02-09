
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
FK                        = require 'fontkit'



#-----------------------------------------------------------------------------------------------------------
@fkfont_from_path = ( path ) -> FK.openSync path ### could use async ###

#-----------------------------------------------------------------------------------------------------------
@shape_text = ( fkfont, text ) ->
  R       = []
  glyfrun = fkfont.layout text
  ### NOTE do outlining in separate method ###
  # if fkfont.unitsPerEm is 1000
  #   for glyf in glyfrun.glyphs
  #     R[ glyf.id ] = glyf.path.toSVG()
  # else
  #   for glyf in glyfrun.glyphs
  #     R[ glyf.id ] = ( glyf.getScaledPath 1000 ).toSVG()
  for position, pidx in glyfrun.positions
    gid                                       = glyfrun.glyphs[ pidx ].id
    { xAdvance, yAdvance, xOffset, yOffset, } = position
    R.push { gid, xAdvance, yAdvance, xOffset, yOffset, }
  return R


#===========================================================================================================
# DEMO SHAPE TEXT
#-----------------------------------------------------------------------------------------------------------
@demo_shape_text = ->
  resolve_path  = ( path ) -> PATH.resolve PATH.join __dirname, '../fonts', path
  features      = { liga: true, clig: true, dlig: true, hlig: true, }
  # path          = 'EBGaramond08-Italic.otf'
  path          = 'FZKaiT.TTF'
  path          = resolve_path path
  # open a font synchronously
  fkfont        = FK.openSync path
  whisper fkfont.availableFeatures
  whisper fkfont.variationAxes
  whisper fkfont.unitsPerEm
  scale_factor = 1000 / fkfont.unitsPerEm
  # layout a string, using default shaping features.
  # returns a GlyphRun, describing glyphs and positions.
  glyfrun       = fkfont.layout 'xffix', features
  # get an SVG path for a glyph
  urge ( k for k of glyfrun )
  for glyf in glyfrun.glyphs
    # font.widthOfGlyph glyf.id
    # info ( k for k of glyf )
    info ( CND.yellow glyf.id ), CND.steel glyf.path.toSVG()[ .. 100 ]
    info glyf.bbox
    info glyf.advanceWidth
    info glyf.advanceWidth * scale_factor
    ### should use this method unless `fkfont.unitsPerEm` is 1000: ###
    urge ( glyf.getScaledPath 1000 ).toSVG()
  return null



############################################################################################################
if module is require.main then do =>
  await @demo_shape_text()




