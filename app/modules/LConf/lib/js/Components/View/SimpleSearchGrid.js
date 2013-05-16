/*jshint browser:true, curly:false */
/*global Ext:true, _:true */
Ext.ns("LConf.View").SimpleSearchGrid = function(cfg) {
    "use strict";

    this.ds = new Ext.data.GroupingStore({
        autoDestroy:true,
        autoLoad: true,
        root: 'result',
        reader: new Ext.data.JsonReader(),
        url: cfg.urls.simplesearch,
        baseParams: {
            connectionId: cfg.connId,
            search: cfg.search,
            uniqueResults: true
        },
        groupField: 'type'
    });
    this.iconRenderer = function(val) {
        return "<div class='"+val+"' style='width:20px;height:20px'></div>";
    };
    this.grid = new Ext.grid.GridPanel({
        store: this.ds,
        colModel: new Ext.grid.ColumnModel({
            defaults: {
                sortable:true
            },
            columns: [
            {
                id:'iconCls',
                groupable:false,
                menuDisabled:true,
                renderer:this.iconRenderer,
                header:'',
                dataIndex:'iconCls',
                width:50
            },

            {
                id:'dn',
                header:_('DN'),
                dataIndex:'dn',
                width:200
            },

            {
                id:'property',
                header:_('Property'),
                dataIndex:'property'
            },

            {
                id:'value',
                header:_('Value'),
                dataIndex:'value'
            },

            {
                id:'type',
                header:_('Type'),
                dataIndex:'type'
            }
            ]
        }),
        view: new Ext.grid.GroupingView({
            forceFit: true,
            startCollapsed:true,
            groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})',
            listeners: {
                refresh: function(grid) {
                    var result = grid.mainBody.query(".x-grid-group")
                    AppKit.log(result);
                    for(var i=0;i<result.length;i++) {
                        var group = result[i];
                        if(group.children[1].children.length < 10)
                            grid.toggleGroup(group.id);
                    };
                }
            }
        }),
        frame: true,
        width:800,
        height:500,
        collapsible:false,
        renderTo: Ext.getBody(),
        listeners: {
            rowclick: function(grid,idx,e) {
                new Ext.menu.Menu({
                    items: [{
                        text:_('Show in tree'),
                        iconCls: 'icinga-icon-zoom',
                        handler: function() {
                            var dn = grid.getStore().getAt(idx).get("dn");
                            cfg.eventDispatcher.fireCustomEvent("searchDN",dn);
                        }
                    }]
                }).showAt(e.getXY());

            },

            scope:this
        },
        tbar: new Ext.Toolbar({
            items: [{
                xtype:'label',
                style:'padding:5px',
                text: _('List same dns only once')
            },{
                xtype: 'checkbox',
                style:'padding:5px',
                name: 'list_dn_only_once',
                checked:true,
                listeners: {
                    check: function(field,checked) {
                        this.ds.baseParams.uniqueResults = checked;
                        this.ds.load();
                    },
                    scope:this
                }
            }]
        })
    });
    return this.grid;
};
