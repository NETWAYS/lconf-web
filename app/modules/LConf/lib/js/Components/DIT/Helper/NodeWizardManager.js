/*jshint browser:true, curly:false */
/*global Ext:true, _:true, LConf: true */
Ext.ns("LConf.DIT.Helper").NodeWizardManager = function(tree) {
    "use strict";
  
    this.callNodeCreationWizard = function(cfg,id) {
        var _parent = cfg.node;
        if(!cfg.isChild)
            _parent = _parent.parentNode;
        this.newNodeParent = _parent.id;
        if(!this.wizardWindow) {
            this.wizardWindow = new Ext.Window({
                id:'newNodeWizardWnd',
                renderTo: Ext.getBody(),
                height: Ext.getBody().getHeight()*0.9,
                width: Ext.getBody().getWidth()*0.6,
                centered:true,
                autoDestroy:true,
                stateful:false,
                shadow:false,
                constrain:true,
                modal:true,
                title: _('Create new entry'),
                layout:'fit',
                closeAction:'hide'
            });
        }
        this.showWizard(id);
        this.wizardWindow.show();
    };


    this.showWizard = function(view) {
        this.wizardWindow.removeAll();
        LConf.Helper.Debug.d("Selected view in NodeWizardManager",view);
        var wizard = new LConf.View.ConfigWizard({
            urls:tree.urls,
            presets: tree.presets,
            wizardView: view,
            parentNode: this.newNodeParent,
            eventDispatcher: tree.eventDispatcher
        });
        wizard.setConnectionId(tree.getConnectionId());
        this.wizardWindow.add(wizard);
        this.wizardWindow.doLayout();
        this.wizardWindow.center();
    };

    this.getNodeSelectionDialog = function() {
        LConf.Helper.Debug.d("Wizards",tree.wizards);
        return new Ext.Panel({
            borders:false,
            autoDestroy:false,
            margins: "3 3 3 3",
            constrain:true,
            layout: 'fit',
            items: [{
                autoScroll:true,
                
                singleSelect:true,

                xtype:'listview',
                store: new Ext.data.JsonStore({
                    autoDestroy:true,
                    data: tree.wizards,
                    idProperty: 'view',
                    fields: ['view','description','iconCls']
                }),
                listeners: {
                    selectionchange: function(view) {
                        var selected = view.getSelectedRecords()[0];
                        this.selectedWizard = selected;
                        this.showWizard(this.selectedWizard.id);
                    },
                    scope:this
                },
                columns: [{
                    tpl:new Ext.XTemplate("<tpl>",
                            "<div style='width:100%;text-align:left;cursor:pointer'>",
                                "<em unselectable='on'><div class='{iconCls}' style='float:left;height:25px;width:25px;overflow:hidden'>&nbsp;</div>{description}</em>",
                            "</div>"),
                    dataIndex: 'description'
                }]
            }]
        });
    };

    this.callExpandAlias = function(nodeCfg) {
        if(!nodeCfg.attributes.isAlias) {
            Ext.Msg.alert(_("Invalid operation"),_("Only aliases can be expanded"));
        }
        var dn = nodeCfg.attributes.dn;
        Ext.Ajax.request({
            url: this.editorWizardURL,
            params: {
                properties: dn,
                xaction:'expandAlias',
                connectionId: this.connId
            },
            success: function() {
                LConf.LoadingLayer.hide();
                this.refreshNode(nodeCfg.parentNode);

            },
            failure: function(resp) {
                LConf.LoadingLayer.hide();
                var err = (resp.responseText.length<50) ? resp.responseText : 'Internal Exception, please check your logs';
                Ext.Msg.alert(_("Error"),_("Couldn't expand Alias:<br/>"+err));
            },
            scope: this
        });
        LConf.LoadingLayer.show();
    };

};