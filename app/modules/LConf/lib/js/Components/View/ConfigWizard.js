/*jshint browser:true, curly:false */
/*global Ext:true, _:true, LConf: true */
(function() {
    
    "use strict";

    Ext.ns("LConf.View").ConfigWizard = Ext.extend(LConf.View.PropertyManagerPanel,{
    
        id : Ext.id("wizard"),
        root: 'properties',
        enableFb : true,
        isConfigWizard:true,
        presets: {},
        autoDestroy:true,
        constructor: function(config) {
            Ext.apply(this,config);
            this.presets = config.presets;
            LConf.Helper.Debug.d("Created ConfigWizard",this,arguments);
            config.extensionsEnabled = false;
            LConf.View.PropertyManagerPanel.prototype.constructor.call(this,config);

        },
    
        initComponent: function() {
            LConf.View.PropertyManagerPanel.prototype.initComponent.apply(this,arguments);
            this.getStore().toggleReloadOnSave(false);
            this.height = Ext.getBody().getHeight()*0.9 > 400 ? 400 : Ext.getBody().getHeight()*0.9;
            this.getStore().proxy.api.create.url = this.urls.modifynode;
            this.getStore().baseParams.xaction = "create";
            LConf.Helper.Debug.d("Rewrote proxy route",this.getStore());
            this.initMe();
            this.disable(false);
        },

        viewProperties: function (selectedDN,connection) {
            var store = this.getStore();
            if(!store)
                return null;

            // check for pending changes
            this.selectedNode = selectedDN;
            var id = selectedDN.attributes.aliasdn || selectedDN.id;
            id = id.replace(/^\*\d{4}\*/,"");

            store.setNode(id);
            store.setConnection(connection);
            store.load();
            return true;
        },

    
        initMe : function() {
            this.on("render", function() {
                this.ownerCt.on("hide",function() {
                    this.getStore().rejectChanges();
                    this.getStore().on("beforeload",function() {
                        return false; //supress reading
                    });
                },this,{
                    single:true
                });
                var Record = Ext.data.Record.create(['id','property','value']);

                this.getStore().on("exception",function(proxy,type,action,options,response) {
                    if(response.status !== 200)
                        Ext.Msg.alert(_("Element could not be created"),_("An error occured: "+response.responseText));
                    else if(response.status === 200) {
                        if(this.getStore().closeOnSave)
                            this.ownerCt.hide();
                        this.getStore().closeOnSave = false;

                        this.eventDispatcher.fireCustomEvent("refreshTree");
                    }
                    return true;
                },this);
                this.getStore().removeListener("save");
            

                if(this.presets[this.wizardView]) {
                    var properties = this.presets[this.wizardView];
                    for(var property in properties) {
                        this.getStore().add(new Record({
                            property:property,
                            value:properties[property]
                        }));
                    }
                    this.addNodeSpecificViews({
                        attributes: {
                            objectclass: {
                                0: this.presets[this.wizardView].objectclass,
                                count: 1
                            }
                        }
                    });
                } else {
                    this.getStore().add(new Record());
                }
                this.fbar.add({
                    xtype: 'button',
                    text: _('Save and close'),
                    iconCls: 'icinga-icon-disk',
                    handler: function(cmp) {
                        cmp.focus();
                        this.getStore().closeOnSave=true;
                        this.saveChanges.defer(200,this);
                    },
                    scope: this
                });
            },this);
        },
    
        width:40

    });


})();