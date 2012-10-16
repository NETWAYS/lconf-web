/*jshint browser:true, curly:false */
/*global Ext:true, LConf:true */
Ext.ns("LConf.Extensions.Helper").PropertyKeyValueGridExtender = function(colModel) {
    "use strict";
    this.colModel = colModel;
    this.actionColumns = [];

    this.extendColumns = function() {
        LConf.Extensions.Registry.foreach('KVGrid',function(extension) {
            switch(extension.xtype) {
              case 'button':
              case 'action':
                this.addAction(extension);
                break;
              case 'column':
                // not implemented yet
                break;

            }
        },this);
        if(Ext.isArray(this.actionColumns)) {
            this.colModel.push({
                xtype: 'actioncolumn',
                items: this.actionColumns
            });
        }
    };

    var objectMatches = function(store,action) {
        if(typeof action.appliesOn !== "object")
            return true;
        if(typeof action.appliesOn.object !== "object")
            return true;
        var objectSelector = action.appliesOn.object;
        return LConf.Extensions.Registry.objectMatches(store,objectSelector);
    };

    var propertyMatches = function(record,action) {
        
        if(typeof action.appliesOn !== "object")
            return true;
        if(typeof action.appliesOn.properties === "undefined")
            return true;
        var propertySelector = action.appliesOn.properties;
        return LConf.Extensions.Registry.propertyMatches(record,propertySelector);
    };

    this.addAction = function(action) {
        this.actionColumns.push({
            tooltip: action.qtip,
            getClass: function(v, meta, rec,row,col,store) {
                if(objectMatches(store,action) && propertyMatches(rec,action)) {
                    this.record = rec;
                    return "icon-16 "+action.iconCls;
                }
                v = "";
                return "";
            },
            handler: action.handler

        });
    };    
};
