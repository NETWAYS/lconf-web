<script type='text/javascript'>
/**
 * connectionManager class for LDAP 
 * 
 */
(function() {
	Ext.ns("lconf.actionBar");
	lconf.actionBar.FILTERTYPES = {
		1 : _('matches'),
		2 : _('starts with'),
		3 : _('ends with'),
		4 : _('contains')				
	};
	Ext.ns("lconf.filters");
	lconf.filters.activeFilters = [];
	lconf.getActiveFilters = function() {
		if(lconf.filters.activeFilters)
			return lconf.filters.activeFilters;
		return [];
	}
	
	lconf.filters.activateFilter= function(filter) {
		if(!lconf.filters.activeFilters)
			lconf.filters.activeFilters = [];
		
		if(Ext.isArray(filter))
			lconf.filters.activeFilters = lconf.filters.activeFilters.concat(filter)
		else		
			lconf.filters.activeFilters.push(filter);
			
		eventDispatcher.fireCustomEvent("filterChanged",lconf.filters.activeFilters,this);
	}

	lconf.filters.deactivateFilter = function(filter) {
		removed = false;
		do {
			removed = false;
			Ext.each(lconf.filters.activeFilters,function(curfilter,idx,all) {
				if(curfilter == filter) {
					lconf.filters.activeFilters.splice(idx,1);
					removed = true;
				} 
			},this);
		} while(removed);
		eventDispatcher.fireCustomEvent("filterChanged",lconf.filters.activeFilters,this);
	}
	
	lconf.filters.deactivateAll = function() {
		lconf.filters.activeFilters = [];
		eventDispatcher.fireCustomEvent("filterChanged",lconf.filters.activeFilters,this);
	}
	
	lconf.actionBar.filterManager = Ext.extend(Ext.util.Observable, { 
		
		getStore: function() {
			if(!this.dStore) {
				this.dStore = new Ext.data.JsonStore({
					autoLoad:true,
					root: 'result',
					autoSave:false,
					proxy: new Ext.data.HttpProxy({
						url: "<?php echo $ro->gen('modules.lconf.data.modifyfilter'); ?>",
						api: {
							'read': "<?php echo $ro->gen('modules.lconf.data.filterlisting'); ?>"
						}
					}),
					listeners: {
						// Check for errors
						exception : function(prox,type,action,options,response,arg) {
							if(response.status == 200)
								return true;
							response = Ext.decode(response.responseText);
							if(response.error.length > 100)
								response.error = _("A critical error occured, please check your logs");
							Ext.Msg.alert(_("Error"), response.error);
						},
						save: function(store) {
							store.load();
						}
					},
					writer: new Ext.data.JsonWriter(),
					autoDestroy:true,
					fields: [
						'filter_id','filter_name','filter_json','filter_isglobal'
					],
					idProperty:'filter_id',
					root: 'filters'
				})
			}			
			return this.dStore;
		},
		
		getTemplate: function() {
			if(!this.tpl) {
				this.tpl = new Ext.XTemplate(
					'<tpl for=".">',
						'<div class="ldap-filter" ext:qtip="{filter_name}" id="conn_{filter_id}">',
							'<div class="thumb"></div>',
							'<span class="X-editable">{filter_name}</span>',
							'<tpl if="filter_isglobal == 1"> (global)</tpl>',
						'</div>',
					'</tpl>'
				);
			}
			return this.tpl;	
		},
		
		getDataView : function() {
			if(!this.dView) {
				this.dView = new Ext.DataView({
					id: 'view-'+this.id,
					store: this.getStore(),
					tpl: this.getTemplate(),
					autoHeight:true,
					callMgr : this.filterManager.createDelegate(this),
					overClass:'x-view-over',
					multiSelect: false,
					itemSelector:'div.ldap-filter',
					emptyText: _('No filters defined yet'),
					cls: 'ldap-data-view',
					listeners: {
						click: function(view,idx,node,event) {
							event.preventDefault();
							var el = new Ext.Element(node);
							var record = view.getStore().getAt(idx);
							var ctx = new Ext.menu.Menu({
								items: [{
									text: _('Activate'),
									iconCls: 'icinga-icon-accept',
									handler: function() {
										node.isActivated = true;
										lconf.filters.activateFilter(record.get('filter_id'));
										el.addClass("isActive");
									},
									scope:this,
									hidden: node.isActivated || lconf.filters.bypassed
								},{
									text: _('Deactivate'),
									iconCls: 'icinga-icon-stop',
									handler: function() {
										node.isActivated = false;
										lconf.filters.deactivateFilter(record.get('filter_id'));
										el.removeClass("isActive");
									},
									scope:this,
									hidden: !node.isActivated || lconf.filters.bypassed
								},{
									text: _('Edit filter'),
									iconCls: 'icinga-icon-page-edit',
									hidden: record.get('filter_isglobal') == '1',
									handler: function() {
										this.callMgr(record);
									},
									scope:this
								},{
									text: _('Delete'),
									iconCls: 'icinga-icon-delete',
									hidden: record.get('filter_isglobal') == '1' ||lconf.filters.bypassed,
									handler: function() {
										Ext.Msg.confirm(
											_("Delete filter"),
											_("Do you really want to delete this filter?"),
											function(btn) {
												if(btn == "yes") {
													var store = record.store;
													store.remove(record);
													store.save();
												}
											}	
										)
									},
									scope:this								
								}]
							}).showAt(event.getXY());
							
						}
					}
				});
			}
			return this.dView;
		},
		

		
		getView : function() {
			if(!this.view) {
				this.view = new Ext.Panel({
					tbar: new Ext.Toolbar({
						title: _('Create filter'),
						items: [{
							xtype: 'button',
							iconCls: 'icinga-icon-add',
							text:_('New'),
							handler:function() {this.filterManager()},
							scope:this
						},{
							xtype: 'button',
							enableToggle:true,
							allowDepress: true,
							iconCls: 'icinga-icon-stop',
							text:_('Bypass'),
							scope: this,
							toggleHandler: function(btn,active) {
								if(active) { 
									this.bypassed = lconf.getActiveFilters();
									lconf.filters.bypassed = true;
									lconf.filters.deactivateAll();
									this.view.addClass('lconf-panel-disabled');
								} else { 
									lconf.filters.bypassed = false;
									lconf.filters.activateFilter(this.bypassed);
									this.view.removeClass('lconf-panel-disabled');
								}
							}
						}]
					}),
					items: this.getDataView()
				});	
			}
			return this.view;
		},
		
		/**
		 * Node to Tree / Tree to node conversion functions		 
		 */ 
		treeToFilterObject: function() {
			var root = this.tree.getRootNode();
			if(!root.hasChildNodes()) {
				Ext.Msg.alert(_("No filters defined"),_("You haven't defined any filters!"));
				return false;
			}
			var filterObj = {"AND" : []}
			filterObj = this.nodeToFilterObject(root);

			return filterObj;
		},
		
		nodeToFilterObject : function(node) {
			var filter = {};
			if(node.filterType == 'group' || node.attributes.filterType == 'group') {
				filter[node.text] = [];
				node.eachChild(function(childNode) {
					 filter[node.text].push(this.nodeToFilterObject(childNode));
				},this);			
			} else if(node.filterType == 'filter' || node.attributes.filterType == 'filter') {
				delete(node.filterAttributes.filter_parent);
				filter = node.filterAttributes;
			}  else if(node.filterType == 'reference' || node.attributes.filterType == 'reference') {
				
				delete(node.filterAttributes.filter_parent);
				filter = node.filterAttributes;
				filter = {"REFERENCE" : filter};
			}
			return filter;
		},
		
		treeFromFilterObject : function(presets) {
			
			var root = this.nodeFromFilterObject(presets);
			return root;
		},
		
		nodeFromFilterObject : function(presets) {
			var node;
			if(Ext.isObject(presets)) {
				if(presets["AND"] || presets["OR"] || presets ["NOT"]) {
					for(var i in presets) {
						node = new Ext.tree.TreeNode({
							text: i,
							expanded:true,
							iconCls: 'icinga-icon-bricks',
							filterType: 'group'
						});
					 	Ext.each(presets[i], function(preset) {
					 		node.appendChild(this.nodeFromFilterObject(preset));
					 	},this);
					}
				} else if(presets["REFERENCE"]) {
					node = new Ext.tree.TreeNode({
						text:presets["REFERENCE"]["filter_name"],
						leaf:true,
						iconCls: 'icinga-icon-attach'
					});
					node.filterAttributes = presets["REFERENCE"];
					node.referenceId = presets["REFERENCE"]["referencedId"];
					node.filterType = 'reference';
				} else {
					node = new  Ext.tree.TreeNode({
						text:this.buildTextFromFilter(presets),
						leaf:true,
						iconCls: 'icinga-icon-brick'
					});
					node.filterAttributes = presets;
					node.filterType = 'filter';
				}
			}
			return node;
		},
		/**
		 * EOF  Node to Tree / Tree to node conversion functions		
		 */
		 
		
		filterManager: function(record) {
			if(record) {
				
				this.showFilterManagerWindow(record);
			} else 
				this.showFilterManagerWindow();
		},
		
		saveFilter : function(obj,text,record) {
			var json = Ext.encode(obj);
			var store = this.getStore();
			var add = false;
			if(!record) {
				add = true;
				record = new store.recordType();
			}
			record.set('filter_json',json);
			record.set('filter_name',text);
			record.set('filter_isglobal',false);
			if(add)
				store.add(record);
			lconf.filters.deactivateAll();
			store.save();
		},
		
		showFilterManagerWindow: function(record) {
			var presets = null;
			var filter_name = null;
			
			if(record) {
				presets = Ext.decode(record.get('filter_json'));
				filter_name = record.get('filter_name');
			}

				
			var filterManagerWindow = new Ext.Window({
				modal:true,
				height: Ext.getBody().getHeight()*0.9 > 500 ? 500 : Ext.getBody().getHeight()*0.9,
				autoDestroy: true,
				constrain:true,
				resizable:true,
				autoScroll:true,
				defaults: {
					autoScroll:true					
				},
				width:700,
				renderTo: Ext.getBody(),
				layout:'fit',
				items: {
					layout:'column',
					items:	[{
						title:_('Filter'),
						columnWidth:.8,
						items: this.getFilterTree(presets)
					},{
						title:_('Available Elements'),
						columnWidth:.2,
						items: this.getAvailableElementsList(record || false)
					}]
				},
				buttons: [{
					text: _('Save filter'),
					iconCls: 'icinga-icon-disk',
					handler: function(btn) {
						var obj = this.treeToFilterObject();
						if(!obj)
							return false;	
						Ext.Msg.prompt(
							_('Save filter'),
							_('Please enter the name for this filter'),
							function(pbtn,text) {
								if(pbtn == 'ok') {
									this.saveFilter(obj,text,record);
									btn.ownerCt.ownerCt.close();	
								}
							},
							this,
							false,
							filter_name || ''
						)
						
								
					},
					scope: this
				}]
			});
			filterManagerWindow.show();
		},
		
		buildTextFromFilter: function(values) {
			return (values["filter_negated"] ? 'NOT' : '')
			+" <i>"+values["filter_attribute"]+"</i>"
			+" <b>"+lconf.actionBar.FILTERTYPES[values["filter_type"]]+"</b>"
			+" '"+values["filter_value"]+"'";
		},
		
		getAvailableFiltersArray: function(record) {
			var basic = [
				['AND','group'],
				['OR','group'],
				['NOT','group'],
				['FILTER','filter']
			];
		
				
			var store = this.getStore();
			store.each(function(checkRecord) {
				if(record) {
					if(record == checkRecord)
						return true;
					if(this.hasCyclicRedundancies(record,checkRecord))
						return true;	
				}
				basic.push([checkRecord.get('filter_name'),checkRecord.get('filter_id')]);
			},this);
			
			return basic;
		},
		
		hasCyclicRedundancies: function(record1,record2) {
			var id1 = record1.get("filter_id");
			var id2 = record2.get("filter_id");

			var json1 = Ext.decode(record1.get('filter_json'));
			var json2 = Ext.decode(record2.get('filter_json'));

			if(this.searchReferenceInFilterObject(id1,json2))
				return true;
			
							
			return false;
		},
		
		searchReferenceInFilterObject : function(id,filterObj) {
			var found = false;

			if(filterObj["AND"] || filterObj["OR"] || filterObj["NOT"]) {
				for(var i in filterObj) {
					Ext.each(filterObj[i],function(elem) {
						found = found || this.searchReferenceInFilterObject(id,elem)
						// get out of the loop if found anything
						if(found)
							return false;
						return true;
					},this)
				}
			} else if(filterObj["REFERENCE"]) {
				if(filterObj["REFERENCE"]["referenceId"] == id)
					found = true;
			}
			return found;
		},
		
		getAvailableElementsList: function(record) {
			return new Ext.grid.GridPanel({
				height:400,
				enableDragDrop: true,
				autoDestroy: true,
				ddGroup:'filterEditor',
				store: new Ext.data.ArrayStore({
					fields: ['name','type'],
					idIndex: 0,
					data: this.getAvailableFiltersArray(record)
				}),
				colModel: new Ext.grid.ColumnModel({
					
					columns: [{
						header:_(''),
						dataIndex: 'type',
						menuDisabled:true,
						
						renderer: function(value, metaData) {
							metaData.css = (value == 'group' ? 'icinga-icon-bricks' : (value == 'filter') ? 'icinga-icon-brick' : 'icinga-icon-attach');
							value = ''
							return value;
						},
						width:16
						
					},{
						header: _('Type'),
						dataIndex: 'name'
					}]
				
				})
			})
		},
		
		getFilterTree: function(presets) {
			var defaultTreeRoot =  new Ext.tree.TreeNode({text:'AND', filterType: 'group', iconCls:'icinga-icon-bricks',id:'root', expanded:true});
			this.tree = new  Ext.tree.TreePanel({ 
				height:400,
				rootVisible:true,
				autoDestroy: true,
				enableDD: true,
				ddGroup:'filterEditor',
				autoScroll:true,
				title: _('Drop Elements here'),
				columns: [{
					header:'Type',
					dataIndex: 'typefield',
					width:150,
					resizeable:true
				},{
					header:'Name',
					dataIndex: 'namefield',
					width:150,
					resizeable:true
				},{
					header:'Value',
					dataIndex: 'valuefield',
					width:200,
					resizeable:true
				}],
				loader:  new Ext.tree.TreeLoader({
				
				}),
				root: presets ? this.treeFromFilterObject(presets) : defaultTreeRoot,
		        
		        listeners: {
		        	contextmenu: function(node,event) {
		      			event.preventDefault();
		      			if(!node.parentNode)
		      				return false;
		        		var ctx = new Ext.menu.Menu({
		        			items: [{
		        				text: _('Edit this node'),
		        				iconCls: 'icinga-icon-page-edit',
		        				handler: function(btn) {
									this.addFilterTo(node,node.filterAttributes,true);
		        				},
		        				scope: this
		        			},{
		        				text: _('Remove this node'),
		        				iconCls: 'icinga-icon-delete',
		        				handler: function(btn) {
		        					node.parentNode.removeChild(node,true);
		        				},
		        				scope: this
		        			}]
		        		}).showAt(event.getXY());
		        		
		        		
		        	},
		        	beforeNodeDrop: function(event) {
		        		event.cancel = false;
		        		event.dropNode = [];
		        		
		        		if(event.data.node) {
		        			event.dropNode = [event.data.node];
		        			return true;
		        		}
		        		Ext.each(event.data.selections,function(elem) {
		        			var name = elem.get('name');
			        		if(elem.get('type') == 'filter') {
		        				// The filter needs some tweaking before it can be added
		        				this.addFilterTo(event.target);
		        				event.cancel = true;
			        		} else if(elem.get('type') != 'group') {
			        			this.addReference(event.target,elem);
			        			event.cancel = true
			        		} else {
			        			// Groups and predefined filters can be directly added
			        			event.dropNode.push(this.loader.createNode({
									text: elem.get('name'),
									iconCls: (elem.get('type')  == 'group' ? 'icinga-icon-bricks' : 'icinga-icon-brick'),
		    	    				nodeType:'node',
		    	    				filterType: elem.get('type'),
		        					leaf: elem.get('type') != 'group'
		        				})) 
		        			}
		        		},this)
		        	}
		        },
		        
		        buildTextFromFilter: this.buildTextFromFilter, // reference to function in manager
			
		        addReference: function(target,elem) {
		        	var node = this.loader.createNode({
						text: elem.get('name'),
						iconCls: 'icinga-icon-attach',
	    				nodeType:'node',
	    				referenceId : elem.get('type'),
	    				filterType: 'reference',
    					leaf: elem.get('type') != 'group'
    				});
    				node.filterAttributes = {
    					referenceId : elem.get('type'),
	    				filterType: 'reference',
	    				filter_name: elem.get('name')
    				}
		        	target.appendChild(node);
		        },
		        
		        addFilterTo: function(targetNode,defaults,replace) {
		        	if(!lconf.editors) {
       					lconf.loader.lazyLoadEditors(this.addFilterTo.createDelegate(this,[targetNode,defaults,replace]));
						return true;
		        	}
		        	defaults = defaults || {}
		        	var _f = lconf.actionBar.FILTERTYPES; // filter shorthand
		        	var form = new Ext.form.FormPanel({
	        			padding:5,
	        			layout:'form',
	        			margins:5,
     							autoDestroy: true,
		        		autoHeight:true,
	        			border:false,
	        			defaults: {
	        				xtype: 'textfield',
	        				anchor: '90%'
	        			},
	        			items: [{
							fieldLabel: _('NOT'),
							xtype:'checkbox',
							name: 'filter_negated'
						},
	        				new lconf.editors.editorFieldMgr.getEditorFieldForProperty("property",{
	        					name:'filter_attribute',
	        					value: defaults['filter_attribute'] ? defaults['filter_attribute'] :'',
	        					fieldLabel: _('Attribute')
	        				}),
	        			{
	        				fieldLabel: _('Type'),
	        				xtype: 'combo',
	        				triggerAction:'all',
	        				valueField: 'id',
	        				displayField: 'filterType',
	        				mode:'local',
	        				forceSelection:true,
	        				value: defaults['filter_type'] ? defaults['filter_type'] :'',
	        				store: new Ext.data.ArrayStore({
	        					id: '0',
	        					fields: ['id','filterType'],
	        					data:[[1,_f[1]],[2,_f[2]],[3,_f[3]],[4,_f[4]]]
	        				}),
	       					name: 'filter_type',
	       					allowBlank:false
	        			},{
	        				fieldLabel: _('Value'),
	       					name: 'filter_value',
	       					value: defaults['filter_value'] ? defaults['filter_value'] :'',
	       					allowBlank:false
	        			}]
		        	});
		        	
		        	this.addctx = new Ext.Window({
		        		title:_('Specify filter'),
		        		width:500,
		        		renderTo:Ext.getBody(),
		        		modal:true,
		        		autoHeight:true,
		        		layout:'fit',
		        		items: form,
	        			buttons: [{
	        				text: replace ? _('Edit filter') : _('Add filter'),
	        				iconCls: replace ? 'icinga-icon-page-edit' : 'icinga-icon-add',
	        				handler: function(btn) {
	        					if(!form.getForm().isValid())
	        						return false;

		        				if(targetNode.isLeaf() && !replace)
		        					targetNode = targetNode.parentNode;
	        						
	        				 	var	values = form.getForm().getFieldValues();
	        					var txt = this.buildTextFromFilter(values)
	        					values.filter_parent = targetNode;
	        					var node = this.loader.createNode({
									text: txt,
									iconCls: 'icinga-icon-brick',
		    	    				nodeType:'node',
		        					leaf: true
		        				})
		        				node.filterType = 'filter';
		        				node.filterAttributes = values;
								if(replace) {
									targetNode.parentNode.appendChild(node)
									targetNode.parentNode.removeChild(targetNode);
								} else 
			        				targetNode.appendChild(node);
			        				
			        			this.addctx.close()
	        				},
	        				scope:this
	        			},{
        					text: _('Close'),
        					iconCls: 'icinga-icon-cancel',
        					handler: function() {this.ownerCt.ownerCt.close()}

	        			}]
		        	});
		        	this.addctx.show();
		        }
		        
			})
			return this.tree;
		},
		
		constructor: function(config) {
			Ext.apply(this,config);
			this.superclass.constructor.call(config);	
			view = this.getView();
			Ext.getCmp(this.parentid).add(view);
			eventDispatcher.fireCustomEvent(this.eventId,view,this);
		}
	});
	
	new lconf.actionBar.filterManager({
			storeURL: '<?php echo $ro->gen("modules.lconf.data.filterlisting");?>',
			eventId: '<?php echo $t["eventId"]; ?>',
			parentid: '<?php echo $t["parentid"]; ?>'				
	});
})();

</script>
