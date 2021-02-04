


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
@declare 'hb_fontshaper', tests:
  "x is an object":                                 ( x ) -> @isa.object          x
  "x.arrangement? is an optional list of objects":  ( x ) ->
    return true unless x.arrangement?
    return @isa_list_of.object x.arrangement
  "x.path is a nonempty_text":                      ( x ) -> @isa.nonempty_text   x.path
  "x.features? is an optional text or object":      ( x ) ->
    return true unless x.features?
    return @type_of x.features in [ 'text', 'object', ]



#===========================================================================================================
# DEFAULTS, CASTS
#-----------------------------------------------------------------------------------------------------------
@defaults =
  internal:
    verbose: false
    harfbuzz:
      semver: '^2.7.4'
  hb_fontshaper:
    font:
      path:         null
      features:     null
    text:         null
    arrangement:  null


#-----------------------------------------------------------------------------------------------------------
@cast = {}

