Ext.ns('lconf');
<?php 
	$icons = AgaviConfig::get("modules.lconf.icons",array());
	$wizards =  AgaviConfig::get("modules.lconf.customDialogs",array());
	echo "lconf.wizards = ".json_encode($wizards);
?>

/***
 * TODO: Nearly 1000 lines of glorious code, split this class in smaller classes
 * e.g	 DitTreeNavigator
 * 		 DitTreeView
 * 		 DitTreeSearch
 */
lconf.ditTreeManager = function(parentId,loaderId) {	
	var dataUrl = loaderId;
	var ditPanelParent = Ext.getCmp(parentId);
	if(!ditPanelParent)
		throw(_("DIT Error: parentId ")+parentId+_(" is unknown"));
	
	var ditTreeLoader = Ext.extend(Ext.tree.TreeLoader,{
		
		dataUrl: dataUrl,

		createNode: function(attr) {
			var nodeAttr = attr;
			var i = 0;
			var objClass = attr.objectclass[i];
			var noIcon = false
			
			do {
				objClass = attr.objectclass[i];
				noIcon = false;
				// select appropriate icon
				if(objClass == 'alias')
					nodeAttr.isAlias = true;
				switch(objClass) {
					
				<?php foreach($icons as $objectClass=>$icon) :?>
					
					case '<?php echo $objectClass;?>':
						nodeAttr.iconCls = '<?php echo $icon?>';
						break;
				<?php endforeach;?>

					default :
						noIcon = true;
						break;
				} 
			} while(noIcon && attr.objectclass[++i])

			//var aliasString = "ALIAS=Alias of:";
			nodeAttr.text = this.getText(attr);
			nodeAttr.qtip = _("<b>ObjectClass:</b> ")+objClass+
							_("<br/><b>DN:</b> ")+Ext.util.Format.ellipsis(attr["dn"],45)+
							_("<br/>Click to modify");
			
				
			nodeAttr.id = attr["dn"];
			nodeAttr.leaf = attr["isLeaf"] ? true :false;
			
			return Ext.tree.TreeLoader.prototype.createNode.call(this,nodeAttr);
		},



		constructor: function(config) {
			Ext.tree.TreeLoader.prototype.constructor.call(this,config);
		},
		
		getText: function(attr,withDN) {
			var comma = 1;
			var txtRegExp = /^.*?\=/;
			var shortened = attr["dn"].split(",")[0];
			if(attr["count"] && !attr["isLeaf"])
				shortened = shortened+"("+attr["count"]+")";
			return (withDN) ? shortened : shortened.replace(txtRegExp,"");
		}
	});
	
	
	var ditTreeClipboard = new function() {
		var clipboard = [];
		
		this.addToClipboard = function(nodes,tree,cutted) {
			this.clearClipboard();
			clipboard = [nodes,tree,cutted];
			if(cutted) {
				Ext.each(nodes,function(node) {
					node.setCls("italic");
				});
				
			}
		}
		
		this.clearClipboard = function(cutted) {
			if (!cutted) {
				try {
					Ext.each(clipboard[0], function(node){
						node.setCls("");
					});
				} catch(e) {}
			}
			clipboard = [];
		}
		
		this.getClipboardNodes = function() {
			if (!Ext.isEmpty(clipboard)) 
				return {
					clipboard: clipboard[0],
					tree: clipboard[1],
					cut: clipboard[2] || false
				}
			return {}
		}
	}
	var ditTree = Ext.extend(Ext.ux.MultiSelectTreePanel,{
		initEvents: function() {
			this.setupKeyMap();

			
			ditTree.superclass.initEvents.call(this);
			this.on("beforeclose",this.onClose);
			
			eventDispatcher.addCustomListener("filterChanged",function(filters) {
				this.loader.baseParams["filters"] = Ext.encode(filters);
				this.refreshNode(this.getRootNode(),true);
			},this)
			

			eventDispatcher.addCustomListener("refreshTree",function(node) {
				
			        this.refreshNode(this.getRootNode(),true);
			},this);
			
			eventDispatcher.addCustomListener("searchDN",this.searchDN,this);
			
			eventDispatcher.addCustomListener("simpleSearch",function(snippet) {
			
			},this);
			
			eventDispatcher.addCustomListener("aliasMode", function(node) {
				this.reloadFilters = this.loader.baseParams["filters"];
				this.loader.baseParams["filters"] = '{"ALIAS":"'+node.id+'"}';
				this.expandAllRecursive(null);
	
			},this);
		
			
			this.on("click",function(node) {eventDispatcher.fireCustomEvent("nodeSelected",node,this.id);});
			this.on("startdrag",function(tree,node) {node.connId = this.connId});
			this.on("beforeNodeDrop",function(e) {e.dropStatus = true;this.nodeDropped(e);return false},this)
			this.on("contextmenu",function(node,e) {this.context(node,e)},this);
			this.on("beforeappend",function(tree,parent,node) {
				
				if(!this.checkIfNodeIsSynced(node,parent)) {
					(function() {node.getUI().addClass("x-node-lconf-unsynced")}).defer(200);	
				}
				if(this.getNodeById(node.attributes.dn)) {
					var rnd = ((Math.floor((Math.random()*10000))+1000)%10000);
					node.attributes.dn = "*"+rnd+"*"+node.attributes.dn;
					node.attributes.id = node.attributes.dn; 
					node.id = node.attributes.id;
				}	
			},this);
			
			this.on("append",function(obj,parent,node) {
				if(node.attributes.match == "noMatch") {
					(function() {node.getUI().addClass('noMatch');}).defer(100)
					node.expand();
				}
			});
			
		},
		
		getLastExport: function(parent) {
			try {
				var r = /LCONF->EXPORT->CLUSTER = /i
				for(var i in (parent.attributes.description || {})) {
					if(!parent.attributes.description[i].match) 
						continue;
					return parent.attributes.modifytimestamp[0];
				}
			
				return -1;
			} catch(e) {	
				AppKit.log(e);	
			}
		},
		
		checkIfNodeIsSynced: function(node,parent) {
			var r = /.*structuralobject/i
			var lastExport = -1;
			while(parent) {	
			
				for(var i in (parent.attributes.objectclass || {})) {	
					if(r.test(parent.attributes.objectclass[i])) {
						lastExport = this.getLastExport(parent);
					} else {
						continue;
					}
					var modified = this.getLastExport(node);	
			
					if(modified == -1)
						return true;
				
					
					if(lastExport < modified)
						return false;
				}
				parent = parent.parentNode;
			}
			return true;
		},

		setupKeyMap: function() {
		    var map = new Ext.KeyMap(this.getEl(),[{
				key: "c",
				ctrl: true,
				fn: function() {
					ditTreeClipboard.addToClipboard(this.selModel.getSelectedNodes(),this.connId,false)
				},
				scope: this
		    },{
				key: "x",
				ctrl: true,
				fn: function() {
					ditTreeClipboard.addToClipboard(this.selModel.getSelectedNodes(),this.connId,true)
				},
				scope: this
		    },{
				key: "v",
				ctrl: true,
				fn: function() {
					var nodes = ditTreeClipboard.getClipboardNodes();
					if(!nodes.clipboard)
						return false;
					nodes.clipboard.connId = nodes.tree;
					var selected = this.getSelectionModel().getSelectedNodes();
					if(selected.length == 0)
					 	Ext.Msg.confirm(_("No node selected"), _("You haven't selected nodes to copy to"));
					for(var i=0;i<selected.length;i++) {
						var toNode = selected[i];
						for(var i=0;i<nodes.clipboard.length;i++)  {
							if (toNode == nodes.clipboard[i] || toNode.isAncestor(nodes.clipboard[i])) {
								Ext.Msg.alert(_("Invalid operation"), _("Moving or Copying a node below itself is not supported."));
								return false;
							}
						}	
						
					}
					for(var i=0;i<selected.length;i++) {
						
						var toNode = selected[i];
						toNode.connId = this.connId;
						this.copyNode("append",nodes.clipboard,toNode,nodes.cut);
					}
					if(nodes.cut) {
						ditTreeClipboard.clearClipboard(true)
					}
				},
				scope: this
		    },{
				key: "n",
				ctrl: true,
				fn: function(key,ev) {
					var selected = this.getSelectionModel().getSelectedNodes();
					if(selected.length == 0)
					 	Ext.Msg.confirm(_("No node selected"), _("You haven't selected a node"));
					var lastSelect = selected[selected.length-1];
					this.getSelectionModel().select(lastSelect);
	
					this.context(lastSelect,{preventDefault: function() {}, getXY: function() {return [25,Ext.getBody().getHeight()/2-25]}},true);
					ev.preventDefault();
				},
				scope: this
		    },{
		    	key: 46, //delete
				fn: function() {
			    	Ext.Msg.confirm(_("Remove selected nodes"),_("Do you really want to delete the selected entries?<br/>")+
													  _("Subentries will be deleted, too!"),
						function(btn){
							if(btn == 'yes') {
								var toDelete = this.getSelectionModel().getSelectedNodes();
								this.removeNodes(toDelete);
							}
					},this);
				},
				scope: this
		    }]);

		},

		processDNForServer: function(dn) {
			dn = dn.replace("ALIAS=Alias of:","");
			dn = dn.replace(/^\*\d{4}\*/,"");
			return dn;
		},
		
		context: function(node,e,justCreate) {
			e.preventDefault();
			var ctx = new Ext.menu.Menu({
				items: [{
					text: _('Refresh this part of the tree'),
					iconCls: 'icinga-icon-arrow-refresh',
					handler: this.refreshNode.createDelegate(this,[node,true]),
					scope: this,
					hidden: node.isLeaf() || justCreate
				},{
					text: _('Create new node on same level'),
					iconCls: 'icinga-icon-add',
					handler: this.callNodeCreationWizard.createDelegate(this,[{node:node}]),
					scope: this,
					hidden: !(node.parentNode)
				},{
					text: _('Create new node as child'),
					iconCls: 'icinga-icon-sitemap',
					handler: this.callNodeCreationWizard.createDelegate(this,[{node:node,isChild:true}]),
					scope: this
				},{
					text: _('Remove <b>only this</b> node'),
					iconCls: 'icinga-icon-delete',
					handler: function() {
						Ext.Msg.confirm(_("Remove selected nodes"),_("Do you really want to delete this entry?<br/>")+
																  _("Subentries will be deleted, too!"),
							function(btn){
								if(btn == 'yes') {
									this.removeNodes([node]);
								}
							},this);
					},
					hidden: justCreate,
					scope: this
				},{
					text: _('Remove <b>all selected</b> nodes'),
					iconCls: 'icinga-icon-cross',
					hidden:!(this.getSelectionModel().getSelectedNodes().length),
					handler: function() {
						Ext.Msg.confirm(_("Remove selected nodes"),_("Do you really want to delete the selected entries?<br/>")+
																  _("Subentries will be deleted, too!"),
							function(btn){
								if(btn == 'yes') {
									var toDelete = this.getSelectionModel().getSelectedNodes();
									this.removeNodes(toDelete);
								}
							},this);
					},
					hidden: justCreate,
					scope: this		
				},{
					text: _('Jump to alias target'),
					iconCls: 'icinga-icon-arrow-redo',
					hidden: justCreate || !node.attributes.isAlias && !node.id.match(/\*\d{4}\*/),
					handler: this.jumpToRealNode.createDelegate(this,[node])	
				},{
					text: _('Resolve alias to nodes'),
					iconCls: 'icinga-icon-arrow-application-expand',
					hidden: justCreate || !node.attributes.isAlias && !node.id.match(/\*\d{4}\*/),
					handler: this.callExpandAlias.createDelegate(this,[node])	
				},{
					text: _('Display aliases to this node'),
					iconCls: 'icinga-icon-wand',
					hidden: node.attributes.isAlias || node.id.match(/\*\d{4}\*/),
					handler: function(btn) {
						eventDispatcher.fireCustomEvent("aliasMode",node);
					},
					hidden: justCreate
				},{
					text: _('Search/Replace'),
					iconCls: 'icinga-icon-zoom',
					handler: this.searchReplaceMgr.createDelegate(this),
					hidden: (node.parentNode),
					scope:this
				}]
			});
			ctx.showAt(e.getXY())
			
			
		},
		refreshCounter :  0,
		expandAllRecursive: function(node,cb) {
			node = node || this.getRootNode();
			if(node == this.getRootNode())
				this.refreshCounter = 0;
			node.reload();	
			node.on("load",function() {
				node.eachChild(function(newNode){
					this.expandAllRecursive(newNode,cb)
				});
				this.refreshCounter--;
				if(this.refreshCounter<1)
					if(cb)
						cb();
			},this,{single:true});
		},
		
		getExpandedSubnodes: function(node) {
			var expanded = {
				here : [],
				nextLevel: []
			}
			if(node) {
			    node.eachChild(function(subNode) {
				    if(subNode.isExpanded()) {
						expanded.here.push(subNode.id);
						expanded.nextLevel.push(this.getExpandedSubnodes(subNode));
				    }
			    },this);
			}
			return expanded;
		},
		
		
		expandViaTreeObject: function(treeObj,finishFn,selected) {
			var expandBranchesLeft = 0;

			Ext.each(treeObj.here,function(nodeId) {
				var node = this.getNodeById(nodeId);
				if(!node) {
					return true;
				}
				expandBranchesLeft++;
				var getNext = function(exp) {
					if(expandBranchesLeft == 1 && treeObj.nextLevel.length == 0) {
		 				if (finishFn) 
							finishFn();
					}
						
					for (var i = 0; i < treeObj.nextLevel.length; i++) {
						var next = treeObj.nextLevel[i];
						this.expandViaTreeObject(next, finishFn);							
					}
					expandBranchesLeft--;
				}
				
				if(!node.isExpanded()) {
					node.on("expand",function(_node) {
						getNext.call(this,_node);
					},this,{single:true});
					node.expand();
				} else {				
					getNext.call(this);	
				}		
			},this);		
		},
		
		refreshNode: function(node,preserveStructure,callback) {
			var selected = this.getSelectionModel().getSelectedNodes();
			var	expandTree;
			if(Ext.isArray(selected))
				selected = selected[0];
			
			if(this.reloadFilters) {
				this.loader.baseParams["filters"] = this.reloadFilters;
				preserveStructure = false;
			}
			this.reloadFilters = false;
			
			if(!node)
				node = this.getRootNode();
			if(preserveStructure) {
				expandTree = this.getExpandedSubnodes(node);
			}
			if(node.attributes.isAlias) {
				var aliased = this.getAliasedNode(node);
				if(aliased) {
					aliased.reload();
					var aliasedExpandTree = this.getExpandedSubnodes(node);
				}
			}


			if(preserveStructure) {
				this.on("load", function(elem) {
					this.expandViaTreeObject(expandTree,callback,selected);
				},this,{single:true});
			}
			node.reload();			
		},
		
		searchReplaceMgr: function() {
			var form = new Ext.form.FormPanel({
				layout: 'form',
				borders: false,
				labelWidth:300,
				padding:5,
				items: [{
					xtype:'textfield',
					fieldLabel: _('Search RegExp:'),
					name: 'search',
					allowBlank: false
				},{
					xtype: 'textfield',
					fieldLabel: _('Attributes to include (comma-separated)'),
					name: 'fields',
					allowBlank: false
				},{
					xtype: 'textfield',
					fieldLabel: _('Replace String:'),
					name: 'replace',
					allowBlank: true
				}]	
			});
			var curid = Ext.id();
			
			var srWnd = new Ext.Window({
				modal:true,
				id : 'wnd_'+curid,
				autoDestroy:true,
				constrain:true,
				height:150,
				width:600,
				title: _("Search/Replace"),
				renderTo: Ext.getBody(),
				layout:'fit',
				items: form,
				buttons: [{
					text: _('Sissy mode (Just show me what would be done)'),
					handler :function() {
						var _bForm = form.getForm();
						if(!_bForm.isValid())
							return false;
						this.callSearchReplace(_bForm.getValues(),true);
					//	Ext.getCmp('wnd_'+curid).close();
					},
					scope:this
				},{
					text: _('Execute'),
					handler :function() {
						var _bForm = form.getForm();
						if(!_bForm.isValid())
							return false;
						this.callSearchReplace(_bForm.getValues());
						Ext.getCmp('wnd_'+curid).close();
					},
					scope:this				
				}]
			}).show();
		},
		
		callSearchReplace: function(values,SissyMode) {
			var mask = new Ext.LoadMask(Ext.getBody(),_("Please wait"));
			mask.show();
			Ext.Ajax.request({
				url: '<?php echo $ro->gen("modules.lconf.data.searchreplace"); ?>',
				params: {
					search: values["search"],
					fields: values["fields"],
					replace: values["replace"],
					filters: lconf.getActiveFilters(),
					connectionId: this.connId,
					sissyMode: SissyMode
				},

				success: function(resp) {
					mask.hide();
					if(SissyMode)
						Ext.Msg.alert(_("Search/Replace"),_("The following changes would be made:<br/>")+resp.responseText);
					else if(resp.responseText  != 'success') {
						var error = Ext.decode(resp.responseText);
						var msg = "<div class='lconf_infobox'><ul>";
						Ext.each(error,function(err){
							err = Ext.util.Format.ellipsis(err,200,true);
							msg += "<li>"+err+"</li>";
						});
						msg += "</ul></div>";
						Ext.Msg.alert(_('Search/Replace error'),_("The following errors were reported:<br/>"+msg));
					} else {
						Ext.Msg.alert(_("Success"),_("Seems like everything worked fine!"));
					}
					this.refreshNode();
				},
				failure: function(resp) {
					mask.hide();
					error = Ext.util.Format.ellipsis(resp.responseText,400);
					
					Ext.Msg.alert(_("Error"),error);
				},
				scope:this
			});
		},

		
		removeNodes: function(nodes) {
			var dn = [];
			if(!Ext.isArray(nodes))
				nodes = [nodes];
			Ext.each(nodes,function(node) {
				var id = (node.attributes["aliasdn"] || node.id)
				dn.push(this.processDNForServer(id));
			},this);
			var updateNodes = this.getHighestAncestors(nodes);
			Ext.Ajax.request({
				url: '<?php echo $ro->gen("modules.lconf.data.modifynode");?>',
				params: {
					properties: Ext.encode(dn), 
					xaction:'destroy',
					connectionId: this.connId
				},
				success: function(resp) {
					lconf.loadingLayer.hide();
					Ext.each(updateNodes,function(node) {
						if(node)
							this.refreshNode(node);				
					},this)
				},
				failure: function(resp) {
					lconf.loadingLayer.hide();
					err = (resp.responseText.length<50) ? resp.responseText : 'Internal Exception, please check your logs';
					Ext.Msg.alert(_("Error"),_("Couldn't remove Node:<br\>"+err));
				},
				scope: this
			});
			lconf.loadingLayer.show();
		},
		
		/**
		 * Reduces a set of nodes to the highest ancestors of them.
		 * A set [A,B,C,D,E,F] with the followinf structure
		 * 
		 * X1--A-F
		 * 
		 * X2-|     |-D-E
		 *    |-B---|
		 *    |     |-C
		 * 
		 * Would return [X1,X2] (The parents of A/B)
		 * If the root node is reached, this node will be returned
		 * 
		 * Is used to determine which par
		 * 
		 * @param {Array} An array of Ext.tree.TreeNode
		 * @return {Array}
		 */
		getHighestAncestors: function(nodeSet) {
			var returnSet = [];
			for(var i=0;i < nodeSet.length;i++) {
				var node = nodeSet[i];
				var hasAncestor = false;
				for(var x=0;x < nodeSet.length;x++) {
					var checkNode = nodeSet[x];
					if(checkNode == node)
						continue;
					if(node.isAncestor(checkNode)) {
						hasAncestor = true;
						break;
					}
				}
				if(!hasAncestor) {
					if(node.parentNode)
						returnSet.push(node.parentNode);
					else // it's the root node
						returnSet.push(node);
				}
			}
			return Ext.unique(returnSet);
		},
		
		
		jumpToRealNode : function(alias) {
			var id = this.processDNForServer(alias.attributes.aliasedobjectname[0]);

			var node = this.getNodeById(id);
		
			if(!node)  {
			 	node = this.searchDN(id);
				return true;
			} 
			this.selectPath(node.getPath());
			this.expandPath(node.getPath());
		},
			
		searchDN : function(dn) {
			var baseDN = this.getRootNode().id;
			var dnNoBase = dn.substr(0,(dn.length-(baseDN.length+1)));
			var splitted = dnNoBase.split(",");
			var expandDescriptor = {
				here: baseDN,
				nextLevel: []
			}
	
			var curPos = expandDescriptor;
			var lastDN = baseDN;
			while(splitted.length) {
				lastDN =  splitted.pop()+","+lastDN
				curPos.nextLevel = [{
					here: lastDN,
					nextLevel: []
				}]
				curPos = curPos.nextLevel[0]
			}
			var finishFN = function() {
				var node = this.getNodeById(dn);
		
				this.selectPath(node.getPath());
			
				eventDispatcher.fireCustomEvent("nodeSelected",node,this.id);
				this.scrollIntoView(this,node.lastChild || node);
				
			}
			
			this.expandViaTreeObject(expandDescriptor,finishFN.createDelegate(this));
		},
		callExpandAlias: function(nodeCfg) {
			if(!nodeCfg.attributes.isAlias)
				Ext.Msg.alert(_("Invalid operation"),_("Only aliases can be expanded"));
			var dn = nodeCfg.attributes.dn;
			Ext.Ajax.request({
				url: '<?php echo $ro->gen("modules.lconf.data.modifynode");?>',
				params: {
					properties: dn, 
					xaction:'expandAlias',
					connectionId: this.connId
				},
				success: function(resp) {
					lconf.loadingLayer.hide();
					this.refreshNode(nodeCfg.parentNode);				
				
				},
				failure: function(resp) {
					lconf.loadingLayer.hide();
					err = (resp.responseText.length<50) ? resp.responseText : 'Internal Exception, please check your logs';
					Ext.Msg.alert(_("Error"),_("Couldn't expand Alias:<br\>"+err));
				},
				scope: this
			});
			lconf.loadingLayer.show();
	

		},
		

		callNodeCreationWizard : function(cfg) {
			var _parent = cfg.node;
			if(!cfg.isChild)
				_parent = _parent.parentNode;
			this.newNodeParent = _parent.id;
			if(!this.wizardWindow) {
				this.wizardWindow = new Ext.Window({
					width:800,
					id:'newNodeWizardWnd',
					renderTo: Ext.getBody(),
					height: Ext.getBody().getHeight()> 400 ? 400 : Ext.getBody().getHeight(),
					centered:true,
					stateful:false,
					shadow:false,
	
					constrain:true,
					modal:true,
					title: _('Create new entry'),
					layout:'fit',
					closeAction:'hide'
				});
			}
			
	
			this.wizardWindow.removeAll();
			this.wizardWindow.add(this.getNodeSelectionDialog());

			this.wizardWindow.doLayout();
			this.wizardWindow.show();
			this.wizardWindow.center();
			
		},
		
		updateWizard: function(view,sTry) { 			
			this.wizardWindow.removeAll();
			
			if(!sTry && !lconf.wizard) {
				if(sTry)
					Ext.msg.alert(_("Error"),_("View not found despite successful loading"));
				else 
					this.lazyloadWizard(view,this.updateWizard)
			} else {
				var wizard = new lconf.wizard({wizardView:view,parentNode : this.newNodeParent});
				wizard.setConnectionId(this.id);
				this.wizardWindow.add(wizard);
				this.wizardWindow.doLayout();
				this.wizardWindow.center();
			}
		},
		
		lazyloadWizard : function(view,fn,wnd) {
			wnd = wnd || this.wizardWindow;
			var pbar = new Ext.ProgressBar({
				width:200,
				autoHeight:true,
				text: _('Loading wizard')
			});
			wnd.add(pbar);
			pbar.wait({interval:100,increment:15,text: _('Loading wizard')});
			wnd.doLayout();
			
			Ext.Ajax.request({
				url: "<?php echo $ro->gen('modules.lconf.ldapeditor.editorwizard')?>",
				success: function(resp) {
					wnd.removeAll(pbar);
					eval(resp.responseText);
					fn.call(this,view,true);
				},
				failure: function(resp) {
					err = (resp.responseText.length<50) ? resp.responseText : 'Internal Exception, please check your logs';
					Ext.Msg.alert(_("Error"),_("Couldn't load editor:<br\>"+err));
					pbar.hide();		
				},
				scope:this,
				params: {view: view}
			});
			
		},
		
		getNodeSelectionDialog: function() {
			return new Ext.Panel({
				borders:false,
				autoDestroy:false,
				margins: "3 3 3 3",
				height: Ext.getBody().getHeight()*0.9 > 400 ? 400 : Ext.getBody().getHeight()*0.9,
				autoScroll:true,
				constrain:true,
				items: [{
					height:Ext.getBody().getHeight()*0.9 > 400 ? 400 : Ext.getBody().getHeight()*0.9,
					autoScroll:true,
					singleSelect:true,
					
					xtype:'listview',
					store: new Ext.data.JsonStore({
						autoDestroy:true,
						data: lconf.wizards,
						idProperty: 'view',
						fields: ['view','description','iconCls']
					}),
					listeners: {
						selectionchange: function(view, selections) {
							var selected = view.getSelectedRecords()[0];
							this.selectedWizard = selected;
						},
						scope:this
					},
					columns: [{
						tpl:new Ext.XTemplate("<tpl>",
								"<div style='width:100%;text-align:left;'>",
									"<em unselectable='on'><div class='{iconCls}' style='float:left;height:25px;width:25px;overflow:hidden'>&nbsp;</div>{description}</em>",
								"</div>"),
						header: _('Entry description'),
						dataIndex: 'description'							
					}]
				}], 
				buttons: [{
					text: _('Next &#187;'),
					handler: function(btn) {
						if(!this.selectedWizard)	{
							// Confirm if nothing is selected 
							Ext.Msg.confirm(
								_('Nothing selected'),
								_('You haven\'t selected anything yet, create a custom entry?'),
								function(btn) {
									if(btn == "yes")
										this.updateWizard('default');
								},this
							)
						 }else
							this.updateWizard(this.selectedWizard.id);
					},
					scope:this
				}]
			});
		},
		
		nodeDropped: function(e) {

			var containsAlias = false;
			Ext.each(e.dropNode,function(node) {
				if(node.attributes.isAlias)
					containsAlias = true;
				return !containsAlias;
			});
			var ctx = new Ext.menu.Menu({
				items: [{
					text: _('Clone node here'),
					handler: this.copyNode.createDelegate(ditTreeTabPanel.getActiveTab(),[e.point,e.dropNode,e.target]),
					scope:this,
					iconCls: 'icinga-icon-arrow-divide'
				},{
					text: _('Move node here'),
					handler: this.copyNode.createDelegate(ditTreeTabPanel.getActiveTab(),[e.point,e.dropNode,e.target,true]),
					scope:this,
					iconCls: 'icinga-icon-arrow-turn-left'
				},{
					text: _('Clone node <b>as subnode</b>'),
					handler: this.copyNode.createDelegate(ditTreeTabPanel.getActiveTab(),["append",e.dropNode,e.target]),
					scope:this,
					hidden: !e.target.isLeaf(),
					iconCls: 'icinga-icon-arrow-divide'
				},{
					text: _('Move node  <b>as subnode</b>'),
					handler: this.copyNode.createDelegate(ditTreeTabPanel.getActiveTab(),["append",e.dropNode,e.target,true]),
					scope:this,
					hidden: !e.target.isLeaf(),
					iconCls: 'icinga-icon-arrow-turn-left'
				},{
					text: _('Create alias here'),
					iconCls: 'icinga-icon-attach',
					hidden: containsAlias || e.dropNode.connId != e.target.ownerTree.connId,
					handler: this.buildAlias.createDelegate(this,[e.point,e.dropNode,e.target])
				},{
					text: _('Cancel'),
					iconCls: 'icinga-icon-cancel'
				}]
			});
			ctx.showAt(e.rawEvent.getXY())
			
		},
		
		buildAlias: function(pos,fromArr,to) {
			Ext.each(fromArr,function(from) {
				var toDN = to.id;
				if(pos != 'append')
					toDN = to.parentNode.id;
				
				if(from.parentNode.id == toDN) {
					Ext.Msg.alert(_("Error"),_("Target and source are the same"))
					return false;
				}
				
				var properties = [{
					"property" : "objectclass",
					"value" : "extensibleObject"
				},{
					"property" : "objectclass",
					"value" : "alias"
				},{
					"property" : "aliasedObjectName",
					"value" : from.id
				},{
					"property" : "ou",
					"value" : from.id.split(",")[0].split("=")[1]
				}]
				Ext.Ajax.request({
					url: '<?php echo $ro->gen("modules.lconf.data.modifynode");?>',
					params: {
						connectionId: this.connId,
						xaction: 'create',
						parentNode: toDN,
						properties: Ext.encode(properties)
					},
					failure:function(resp) {
						err = (resp.responseText.length<1024) ? resp.responseText : 'Internal Exception, please check your logs';
						Ext.Msg.alert(_("Error"),_("Couldn't create alias node:<br\>"+err));
					},
					success: function() {
						if(to.getOwnerTree())
							this.refreshNode(to.parentNode,true);
					},
					scope:this
				});
			},this);
		},
		
		copyNode: function(pos,fromArr,to,move) {
			Ext.each(fromArr,function(from) {
				var toDN = to.id;
				if(pos != 'append')
					toDN = to.parentNode.id;
					
				if(move && from.parentNode.id == toDN) {
					Ext.Msg.alert(_("Error"),_("Target and source are the same"))
					return false;
				}
				
				var copyParams = {
					targetDN: this.processDNForServer(toDN),
					targetConnId: this.connId,
					sourceDN: this.processDNForServer(from.id)
				}
							
				Ext.Ajax.request({
					url: '<?php echo $ro->gen("modules.lconf.data.modifynode");?>',
					params: {
						connectionId: fromArr.connId,
						xaction: move ? 'move' :'clone' ,
						properties: Ext.encode(copyParams)
					},
					failure:function(resp) {
						lconf.loadingLayer.hide();
						err = (resp.responseText.length<1024) ? resp.responseText : 'Internal Exception, please check your logs';
						Ext.Msg.alert(_("Error"),_("Couldn't copy node:<br\>"+err));
					},
					success: function() {
						lconf.loadingLayer.hide();
						if(to.getOwnerTree())
							this.refreshNode(to.parentNode,true);
						if(from.getOwnerTree())
							this.refreshNode(from.parentNode,true);
					},
					scope:this
				});
				lconf.loadingLayer.show();
			},this)
		},
		
		initLoader: function() {
			this.loader = new ditTreeLoader({
			    id:this.id,
			    baseParams:{
			    connectionId:this.id,
			    filters: lconf.getActiveFilters()
			},
			listeners: {
			    beforeload: function(obj,node,cbk) {
			        if(node.id.match(/\*\d{4}\*/)) {
						this.jumpToRealNode(node);
						return false;
					}
			    },

			    exception: function() {

			    },
			    scope: this
			}	
		    });
		},
		
		onClose: function() {
			Ext.Msg.confirm(this.title,_("Are you sure you want to close this connection?"),
				function(btn) {
					if(btn == 'yes') {
						eventDispatcher.fireCustomEvent("ConnectionClosed",this.id);
						this.destroy()
					}
				},
				this /*scope*/);
			return false;
		},
		
		initComponent: function() {
			ditTree.superclass.initComponent.call(this);
			this.initLoader();
			
		},
	
		autoScroll:true,
		animate:false,
		containerScroll:true,
		minSize:500,
		border:false,
		ddGroup: 'treenodes',
		enableDD: true,
		root: {
			nodeType: 'async',
			disabled:false,
			enableDD:false,
			draggable:false,
			editable:false,
			text: 'Root DSE',
			leaf:true

		}
	});
	var searchWindow = new Ext.Window({
		layout:'fit',
		constrain:true,
		closeAction:'hide',
		renderTo:Ext.getBody()
	});
	var dnSearchField = new Ext.form.TextField({
		xtype:'textfield',
		iconCls: 'icinga-icon-zoom',
		value: 'Search keyword',
		enableKeyEvents: true,
		connId: false,
		listeners: {
			focus: function(e) {e.setValue("")},
			change: function(field,val) {
				if(!field.connId) {
					field.reset();
					return false;
				}
				if(val == "" || val == field.originalValue) {
					field.reset();
					return false
				}
				searchWindow.removeAll();
				searchWindow.add({
					xtype: 'simplesearchgrid',
					connId: field.connId,
					search: val
				});
				searchWindow.setTitle(val);
				searchWindow.doLayout();
				searchWindow.show();
				field.reset();
			},
			keypress: function(field,e) {
				if(e.getKey() == e["ENTER"]) {
					field.blur();
				}
				if(e.getKey() == e["ESC"]) 
					field.reset();
				
			},
			scope: this
		}
	});

	var ditTreeTabPanel = new Ext.TabPanel({
		autoDestroy: true,
		resizeTabs:true,
		
		bbar: new Ext.Toolbar({
			items: ['->',dnSearchField]
		}),
		defaults : {
			closable: true
		},
		
		initTab : function(item,index) {
			  var before = this.strip.dom.childNodes[index],
	        p = this.getTemplateArgs(item),
	        el = before ?
	             this.itemTpl.insertBefore(before, p) :
	             this.itemTpl.append(this.strip, p),
	        cls = 'x-tab-strip-over',
	        tabEl = Ext.get(el);
	
	        tabEl.hover(function(){
	            if(!item.disabled){
	                tabEl.addClass(cls);
	            }
	        }, function(){
	            tabEl.removeClass(cls);
	        });
	
	        if(item.tabTip){
	            tabEl.child('span.x-tab-strip-text', true).qtip = item.tabTip;
	        }
	        item.tabEl = el;
	
	        // Route *keyboard triggered* click events to the tab strip mouse handler.
	        tabEl.select('a').on('click', function(e){
	            if(!e.getPageX()){
	                this.onStripMouseDown(e);
	            }
	        }, this, {preventDefault: true});
	
	        item.on({
	            scope: this,
	            disable: this.onItemDisabled,
	            enable: this.onItemEnabled,
	            titlechange: this.onItemTitleChanged,
	            iconchange: this.onItemIconChanged,
	            beforeshow: this.onBeforeShowItem
	        });
			var dropZone = new Ext.dd.DropZone(tabEl,{
				srcScope : this,
				ddGroup:'treenodes',
				getTargetFromEvent: function(e) {
		            return {el:tabEl,idx:index};
		        },
						
				onNodeEnter: function(node) {
					this.srcScope.swapConnection.delay(600,null,this.srcScope,[node]);					
				},
				onNodeOut : function() {
					this.srcScope.swapConnection.cancel();
				}
				
			});
		},
		swapConnection : new Ext.util.DelayedTask(function(tab) {this.setActiveTab(tab.idx)}),

		listeners: {
			tabchange: function(ac) {
			 	if(!ac.activeTab) {
			 		dnSearchField.connId = null;
			 		return false;
			 	}

				dnSearchField.connId = ac.activeTab.connId;
				
			},
			render: function(cmp) {
				
			},
			scope:this
		}
	});
	
	ditPanelParent.add(ditTreeTabPanel);
	ditPanelParent.doLayout();
	

	
	// init listener
	eventDispatcher.addCustomListener("ConnectionStarted",function(connObj) {
		var tree = new ditTree({
						enableDD:true,
						id:connObj.id,
						title:connObj.connectionName
					});
		new Ext.tree.TreeSorter(tree);
		tree.connId = connObj.id;
		ditTreeTabPanel.add(tree);	
		ditTreeTabPanel.setActiveTab(connObj.id);
		ditTreeTabPanel.doLayout();
			
		tree.setRootNode(new Ext.tree.AsyncTreeNode({
							id:connObj.rootNode,
							leaf:false,
							iconCls:'icinga-icon-world',
							text: connObj.rootNode
						}));
						
	
		(function() {eventDispatcher.fireCustomEvent("TreeReady",tree)}).defer(400);
	},this);

}

new lconf.ditTreeManager('<?php echo $t["parentId"];?>','<?php echo $ro->gen("modules.lconf.data.directoryprovider")?>');
