/*jshint browser:true, curly:false */
/*global Ext:true, _:true*/
Ext.ns("LConf").LoadingLayer = (function() {
    "use strict";
    var mask = new Ext.LoadMask(Ext.getBody(), {msg:_("Please wait...")});

    return {
        show: function() {
            mask.show();
        },
        hide: function() {
            mask.hide();
        }
    };
})();
