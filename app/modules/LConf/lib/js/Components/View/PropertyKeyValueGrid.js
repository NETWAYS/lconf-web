/*jshint browser:true, curly:false */
/*global Ext:true, AppKit: true, LConf: true, _:true */
(function() {
    "use strict";

    Ext.ns("LConf.View").PropertyKeyValueGrid = Ext.extend(Ext.grid.EditorGridPanel,{
        activeDN :  null,
        forceFit:true,
        ctCls: 'lconfGrid',
        layout: 'fit',
        propertyManager: null,
        extensionsEnabled: true,
        root: 'properties',
        id: 'properties_grid',
        getStore: function()  {
            return this.store;
        },

        constructor: function (config) {
            config.sm = new Ext.grid.RowSelectionModel();
            Ext.apply(this,config);
            this.initializeGridSettings(config);
            Ext.grid.EditorGridPanel.prototype.constructor.call(this,config);

        },

        /**
        * http://extjs.com/forum/showthread.php?t=22218
        * For non-IE browsers, this is fixed with a CSS addition.
        */
        reenableTextSelection : function(){
            if(Ext.isIE){
                try {
                    this.colModel.store.on("load", function(){
                        try {
                            var elems=Ext.DomQuery.select("div.dnSelectable", this.parentCmp.el.dom);
                            for(var i=0, len=elems.length; i<len; i++){
                                elems[i].unselectable = "off";
                                elems[i].parentNode.unselectable = "off";
                            }
                        } catch(e) {}
                    });

                } catch(e) {
                    // ignore any errors, it's better to have no text selection in this case
                    // than crashing the whole UI
                    AppKit.log(e);

                }
            }
        },


        viewConfig: {
            getRowClass: function (record) {
                if(record.get('parent')) {
                    return 'inherited';
                }
                return "";
            }
        },

        connId: null,

        getColumnDefinitions: function() {
            var columns = [
            {
                id:'property',
                header:'Property',
                width:300,
                sortable:true,
                dataIndex:'property',
                editor:Ext.form.TextField
            },{
                id:'value',
                header:'Value',
                width:400,
                sortable:false,
                dataIndex:'value',
                editor:Ext.form.TextField,
                renderer:function(value,metaData,record) {
                    if(record.get('property') === "dn")
                        value = "<div class='dnSelectable'>"+value+"</div>";
                    return value;
                }
            }
            ];
            this.applyExtensions(columns);

            return columns;
        },

        initializeGridSettings: function (cfg) {
            this.colModel = new Ext.grid.ColumnModel({
                store:cfg.store,
                isCellEditable : function (col,row) {
                    if(this.store.isStatic(row)) {
                        return false;
                    }
                    return  Ext.grid.ColumnModel.prototype.isCellEditable.call(this,col,row);
                },
                columns: this.getColumnDefinitions()
            });
            this.setupHeader();        
            this.reenableTextSelection();
        },

        inheritedMenu: function (grid,idx,event) {
            var record = this.getStore().getAt(idx);
            if(!record.get("parent"))
                return true;

            var ctx = new Ext.menu.Menu({
                items: [{
                    iconCls: 'icinga-icon-arrow-redo',
                    text:_('Jump to inherited node'),
                    handler: function () {
                        this.eventDispatcher.fireCustomEvent("searchDN",record.get("parent"));
                    },
                    scope:this
                }]
            });
            ctx.showAt(event.getXY());
            return true;
        },

        initEvents: function (){
            Ext.grid.EditorGridPanel.prototype.initEvents.apply(this,arguments);

            //   if(!this.propertyManager.hasReferenceEvents()) {
            this.on("rowclick",this.inheritedMenu,this);    
            //  }
            this.getStore().on("add",function () {
                this.getSelectionModel().selectLastRow();
            },this);

            this.on("beforeedit",this.setupEditor,this);
        },


        clearSelected: function () {
            this.getStore().deleteProperties(this.getSelectionModel().getSelections());
        },

        /**
        * This function is triggered on beforeEdit and dynamically changes the Editor
        * according to the fields content
        * 
        * @param Event The event that triggers this edit call
        */
        setupEditor: function (e) {
            var column = e.grid.getColumnModel().columns[e.column];
            var editor = null;

            if(e.field === "property") {
                editor = new AppKit.GridTreeEditorField({
                    url: this.urls.ldapmetaprovider,
                    grid: this
                });
            } else {
                if(!e.record.get("property")) {
                    AppKit.notifyMessage(_("Please select the attribute type first"),"");
                    return false;
                }
                var type = e.record.get("property").split("_")[0];
                var objClasses = [];
                for(var i=0;i<e.grid.store.data.items.length;i++) {
                    var dataItem = e.grid.store.data.items[i];
                    if(dataItem.data.property.toLowerCase() === "objectclass")
                        objClasses.push(dataItem.data.value);
                }
                editor = LConf.Editors.EditorFieldManager.getEditorFieldForProperty(type,null,objClasses);
            }

            if(editor.store) {
                editor.store.setBaseParam("connectionId",this.getStore().getConnection());
            }

            column.setEditor(editor);
            return true;
        },

        setupHeader: function() {
            this.tbar = new Ext.Toolbar({
                disabled:!this.propertyManager.enableFb,
                items:[{
                    xtype: 'button',
                    text: _('Add property'),
                    iconCls: 'icinga-icon-add',
                    handler: function () {
                        var Record = Ext.data.Record.create(['id','property','value']);
                        this.getStore().add(new Record());
                    },
                    scope: this
                },{
                    xtype: 'button',
                    text: _('Remove properties'),
                    iconCls: 'icinga-icon-delete',
                    handler: this.clearSelected,
                    scope: this
                }]
            });
        },

        applyExtensions: function(columns) {
            if(this.extensionsEnabled) {
                var extender = new LConf.Extensions.Helper.PropertyKeyValueGridExtender(columns);
                extender.extendColumns();
            }
        },
        disableView: function (val) {
            this.getTopToolbar().setDisabled(val);
        }

    });
})();