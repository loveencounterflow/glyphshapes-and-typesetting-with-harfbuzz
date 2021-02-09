



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
FEC                       = require 'fonteditor-core'


warn CND.reverse "fonteditor-core does not lend itself for typesetting b/c it lacks text shaping abilities"
warn CND.reverse "Also, fails to load EBGaramond08-Italic which other solutions do load"

#-----------------------------------------------------------------------------------------------------------
@otfont_from_path = ( path ) -> FK.openSync path ### could use async ###

#-----------------------------------------------------------------------------------------------------------
@shape_text = ( fkfont, text ) ->
  R = {}
  glyfrun = fkfont.layout text
  if fkfont.unitsPerEm is 1000
    for glyf in glyfrun.glyphs
      R[ glyf.id ] = glyf.path.toSVG()
  else
    for glyf in glyfrun.glyphs
      R[ glyf.id ] = ( glyf.getScaledPath 1000 ).toSVG()
  return null


#===========================================================================================================
# DEMO SHAPE TEXT
#-----------------------------------------------------------------------------------------------------------
@demo_shape_text = ->
  resolve_path  = ( path ) -> PATH.resolve PATH.join __dirname, '../fonts', path
  features      = { liga: true, clig: true, dlig: true, hlig: true, }
  # path          = 'EBGaramond08-Italic.otf'
  path          = 'Ubuntu-R.ttf'
  # path          = 'FZKaiT.TTF'
  path          = resolve_path path
  buffer        = FS.readFileSync path
  cfg           =
    type: 'ttf'
    # subset: [ 65, 66, ]
    hinting:          true
    compound2simple:  true
    inflate:          null
    combinePath:      true
  fecfont       = FEC.Font.create buffer, cfg
  fontObject    = fecfont.get()
  info Object.keys fontObject
  # optimize glyf
  fecfont.optimize()
  return null



############################################################################################################
if module is require.main then do =>
  await @demo_shape_text()




