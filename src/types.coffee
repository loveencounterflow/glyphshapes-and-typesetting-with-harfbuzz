


'use strict'


############################################################################################################
CND                       = require 'cnd'
rpr                       = CND.rpr
badge                     = 'TEXTSHAPING-WITH-HARFBUZZ/TYPES'
debug                     = CND.get_logger 'debug',     badge
alert                     = CND.get_logger 'alert',     badge
whisper                   = CND.get_logger 'whisper',   badge
warn                      = CND.get_logger 'warn',      badge
help                      = CND.get_logger 'help',      badge
urge                      = CND.get_logger 'urge',      badge
info                      = CND.get_logger 'info',      badge
jr                        = JSON.stringify
Intertype                 = ( require 'intertype' ).Intertype
intertype                 = new Intertype module.exports


#===========================================================================================================
# TYPES
#-----------------------------------------------------------------------------------------------------------
@declare 'hb_cfg', tests:
  "x is an object":                 ( x ) -> @isa.object          x
  "x.text is a text":               ( x ) -> @isa.text            x.text
  "x.font is a hb_font":            ( x ) -> @isa.hb_font         x.font
  "x.arrangement is an optional list of objects": ( x ) ->
    return true unless x.arrangement?
    return @isa_list_of.object x.arrangement

#-----------------------------------------------------------------------------------------------------------
@declare 'hb_font', tests:
  "x is an object":                 ( x ) -> @isa.object          x
  "x.path is a nonempty_text":      ( x ) -> @isa.nonempty_text   x.path
  "x.features is an optional text": ( x ) -> @isa_optional.text   x.features


#===========================================================================================================
# DEFAULTS, CASTS
#-----------------------------------------------------------------------------------------------------------
@defaults =
  internal:
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
@cast = {}

