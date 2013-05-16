/*jshint browser:true, curly:false */
/*global Ext:true, LConf:true, AppKit:true */
(function() {
    "use strict";
    
    Ext.ns("LConf.DIT").DNSearchField = Ext.extend(AppKit.search.Searchbox, {
        iconCls: 'icinga-icon-zoom',
        value: 'Search keyword',
        enableKeyEvents: true,
        connId: false,
        searchWindow: null,
        eventDispatcher: null,
        urls: null,
        width: 200,
        constructor: function(cfg) {
            this.searchWindow = new Ext.Window({
                layout:'fit',
                constrain:true,
                closeAction:'hide',
                renderTo:Ext.getBody()
            });
            this.eventDispatcher = cfg.eventDispatcher;
            this.urls = cfg.urls;
            AppKit.search.Searchbox.prototype.constructor.apply(this,arguments);
        },

        initEvents: function() {
            AppKit.search.Searchbox.prototype.initEvents.apply(this,arguments);
            this.on({
                focus: function(e) {
                    e.setValue("");
                },
                change: function(field,val) {
                    if(!field.connId) {
                        field.reset();
                        return false;
                    }
                    if(val === "" || val === field.originalValue) {
                        field.reset();
                        return false;
                    }
                    this.searchWindow.removeAll();
                    this.searchWindow.add(new LConf.View.SimpleSearchGrid({
                        connId: field.connId,
                        search: val,
                        urls: this.urls,
                        eventDispatcher: this.eventDispatcher
                    }));
                    this.searchWindow.setTitle(val);
                    this.searchWindow.doLayout();
                    this.searchWindow.show();
                    field.reset();
                    return true;
                },
                keypress: function(field,e) {
                    if(e.getKey() === e.ENTER) {
                        field.blur();
                    }
                    if(e.getKey() === e.ESC)
                        field.reset();

                },
                scope: this

            });
        }

    });

})();