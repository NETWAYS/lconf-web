/*jshint browser:true, curly:false */
/*global Ext:true, _:true, LConf:true */
Ext.ns("LConf.DIT.Mixin").ContextMenu = function() {
    "use strict";
    this.showGeneralNodeDialog = function(node,e,justCreate) {
        e.preventDefault();
        
        var ctx = new Ext.menu.Menu({
            ignoreParentClicks: true,
            items: this.getMenuDefinitionForObject(node,justCreate)
        });
        ctx.showAt(e.getXY());
    };
    
    this.getNodeCreationMenu = function(tree,cfg) {
        return [{
            iconCls: 'icinga-icon-host',
            text: 'Add new host',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Host'])
        },{
            iconCls: 'icinga-icon-service',
            text: 'Add new service',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Service'])
        },'-',{
            iconCls: 'icinga-icon-hostgroup',
            text: 'Add new hostgroup',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Hostgroup'])
        },{
            iconCls: 'icinga-icon-servicegroup',
            text: 'Add new servicegroup',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Servicegroup'])
        },'-',{
            iconCls: 'lconf-logo',
            text: 'Add new structural object',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'StructuralObject'])
        },'-',{
            iconCls: 'icinga-icon-user',
            text: 'Add new contact',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Contact'])
        },{
            iconCls: 'icinga-icon-group',
            text: 'Add new contactgroup',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Contactgroup'])
        },'-',{
            iconCls: 'icinga-icon-script',
            text: 'Add new command',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Command'])
        },{
            iconCls: 'icinga-icon-clock-red',
            text: 'Add new timeperiod',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Timeperiod'])
        },'-',{
            iconCls: 'lconf-application-lightning',
            text: 'Add new host escalation',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Hostescalation'])
        },{
            iconCls: 'lconf-application-lightning',
            text: 'Add new service escalation',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Serviceescalation'])
        },'-',{
            iconCls: 'icinga-icon-bricks',
            text: 'Add new custom entry',
            handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[cfg,'Custom'])
        }];
        
    };

    this.getMenuDefinitionForObject = function(node,justCreate) {
        var tree = node.getOwnerTree();
        var base =  [{
                text: _('Refresh this part of the tree'),
                iconCls: 'icinga-icon-arrow-refresh',
                handler: tree.refreshNode.createDelegate(tree,[node,true]),
                scope: this,
                hidden: node.isLeaf() || justCreate
            },'-',{
                text: _('Create new node at same level'),
                iconCls: 'icinga-icon-add',
                menu: this.getNodeCreationMenu(tree,{node:node}),
                scope: this,
                hidden: !(node.parentNode)
            },{
                text: _('Create new node as child'),
                iconCls: 'icinga-icon-sitemap',
                hidden: (node.isAlias),
                menu: this.getNodeCreationMenu(tree,{node:node,isChild:true}),
                //handler: tree.wizardManager.callNodeCreationWizard.createDelegate(tree.wizardManager,[),
                scope: this
            },'-',{
                text: _('Copy this node(s)'),
                iconCls: 'icinga-icon-application-double',
                hidden: (node.isAlias && node.parentNode),
                scope:this,
                handler: tree.clipboardInsert.createDelegate(tree,[tree.getSelectionModel().getSelectedNodes(),tree.connId])
            },{
                text: _('Paste ')+tree.getNumberOfClipboardElements()+" nodes...",
                iconCls: 'icinga-icon-application-add',
                hidden: (tree.getNumberOfClipboardElements() == 0),
                menu: [{
                    text: _('...at same level'),
                    iconCls: 'icinga-icon-add',
                    handler: tree.pasteFromClipboard.createDelegate(tree,[[node.parentNode]]),
                    scope: tree
                }, {
                    text: _('..as child'+(tree.getNumberOfClipboardElements() ? 'ren' : '')),
                    iconCls: 'icinga-icon-sitemap',
                    handler: tree.pasteFromClipboard.createDelegate(tree,[]),
                    hidden: node.isAlias
                }, {
                    text: _('..as alias at same level'),
                    iconCls: 'icinga-icon-attach',
                    handler: tree.createAliasesFromClipboard.createDelegate(tree,[[node.parentNode]]),
                    scope: tree
                }, {
                    text: _('..as alias underneath this node'),
                    iconCls: 'icinga-icon-attach',
                    handler: tree.createAliasesFromClipboard.createDelegate(tree,[])

                }]
            },'-',{
                text: _('Remove <b>only this</b> node'),
                iconCls: 'icinga-icon-delete',
                handler: function() {
                    Ext.Msg.confirm(_("Remove selected nodes"),
                    _("Do you really want to delete this entry?<br/>")+
                        _("Subentries will be deleted, too!"),
                    function(btn){
                        if(btn === 'yes') {
                            tree.removeNodes([node]);
                        }
                    },this);
                },
                hidden: justCreate,
                scope: this
            },{
                text: _('Remove <b>all selected</b> nodes'),
                iconCls: 'icinga-icon-cross',
                handler: function() {
                    Ext.Msg.confirm(_("Remove selected nodes"),
                    _("Do you really want to delete the selected entries?<br/>")+
                        _("Subentries will be deleted, too!"),
                    function(btn){
                        if(btn === 'yes') {
                            var toDelete = tree.getSelectionModel().getSelectedNodes();
                            tree.removeNodes(toDelete);
                        }
                    },this);
                },
                hidden: !(tree.getSelectionModel().getSelectedNodes().length) || justCreate,
                scope: this
            },'-',{
                text: _('Jump to alias target'),
                iconCls: 'icinga-icon-arrow-redo',
                hidden: justCreate || !node.attributes.isAlias && !node.id.match(/\*\d{4}\*/),
                handler: tree.jumpToRealNode.createDelegate(tree,[node])
            },{
                text: _('Resolve alias to nodes'),
                iconCls: 'icinga-icon-arrow-application-expand',
                hidden: justCreate || !node.attributes.isAlias && !node.id.match(/\*\d{4}\*/),
                handler: tree.callExpandAlias.createDelegate(tree,[node])
            },{
                text: _('Display aliases to this node'),
                iconCls: 'icinga-icon-wand',
                handler: function() {
                    tree.eventDispatcher.fireCustomEvent("aliasMode",node);
                },
                scope:this,
                hidden: node.attributes.isAlias || node.id.match(/\*\d{4}\*/) || justCreate
            },'-',{
                text: _('Search/Replace'),
                iconCls: 'icinga-icon-zoom',
                handler: tree.searchReplaceManager.execute,
                hidden: (node.parentNode),
                scope: tree.searchReplaceManager
            }];
        this.addMenuExtensionsForNode(node,justCreate,base);
        return base;
    };

    this.addMenuExtensionsForNode = function(node,justCreate,base) {
        LConf.Extensions.Registry.foreach("DITMenu",function(extension) {
            if(extension.appliesOnNode(node))
                base.push(extension.getEntryForNode(node));
            
        },this);
    };
    
    this.showNodeDroppedDialog = function(e) {
        var containsAlias = false;
        var tree = null;
        Ext.each(e.dropNode,function(node) {
            tree = node.getOwnerTree();
            if(node.attributes.isAlias)
                containsAlias = true;
            return !containsAlias;
        });
        if(!tree)
            return false;
        
        var tabPanel = tree.ownerCt;
        var ctx = new Ext.menu.Menu({
            items: [{
                    text: _('Clone node here'),
                    handler: tree.copyNode.createDelegate(tabPanel.getActiveTab(),[e.point,e.dropNode,e.target]),
                    scope:this,
                    iconCls: 'icinga-icon-arrow-divide'
                },{
                    text: _('Move node here'),
                    handler: tree.copyNode.createDelegate(tabPanel.getActiveTab(),[e.point,e.dropNode,e.target,true]),
                    scope:this,
                    iconCls: 'icinga-icon-arrow-turn-left'
                },{
                    text: _('Clone node <b>as subnode</b>'),
                    handler: tree.copyNode.createDelegate(tabPanel.getActiveTab(),["append",e.dropNode,e.target]),
                    scope:this,
                    hidden: !e.target.isLeaf(),
                    iconCls: 'icinga-icon-arrow-divide'
                },{
                    text: _('Move node  <b>as subnode</b>'),
                    handler: tree.copyNode.createDelegate(tabPanel.getActiveTab(),["append",e.dropNode,e.target,true]),
                    scope:this,
                    hidden: !e.target.isLeaf(),
                    iconCls: 'icinga-icon-arrow-turn-left'
                },{
                    text: _('Create alias here'),
                    iconCls: 'icinga-icon-attach',
                    hidden: containsAlias || e.dropNode.connId !== e.target.ownerTree.connId,
                    handler: tree.buildAlias.createDelegate(this,[e.point,e.dropNode,e.target])
                },{
                    text: _('Create alias as child'),
                    iconCls: 'icinga-icon-attach',
                    hidden: containsAlias || e.dropNode.connId !== e.target.ownerTree.connId,
                    handler: tree.buildAlias.createDelegate(this,["append",e.dropNode,e.target])
                },{
                    text: _('Cancel'),
                    iconCls: 'icinga-icon-cancel'
                }]
        });
        ctx.showAt(e.rawEvent.getXY());
        return true;
    };

};
