<script type='text/javascript'>
/**
 * connectionManager class for LDAP 
 * 
 */
(function() {
	Ext.ns("lconf.actionBar");
	lconf.actionBar.connectionManager = Ext.extend(Ext.util.Observable, { 
		connections: {},
		
		constructor : function(config) {
			config = config || {};
			Ext.apply(this,config);
			this.filter = ['global','own'];
			this.eventId = config.eventId;
			this.storeURL = config.storeURL;
			this.id = Ext.id(null,'connManager');
			this.addEvents([config.eventId]);
			if(!Ext.getCmp(config.parentid)) 
				throw(_("Error in connectionManager: parentid unknown"));
			
			this.parent = Ext.getCmp(config.parentid);
			this.superclass.constructor.call(config);	
			this.init();	
		},
		

		getStore : function() {
			if(!this.dStore) {
				this.dStore = new Ext.data.JsonStore({
					autoLoad:true,
					root: 'result',
					listeners: {
						// Check for errors
						load: function() {
							eventDispatcher.fireCustomEvent("connectionsLoaded",this.getStore(),this);
							
						},
						exception : function(prox,type,action,options,response,arg) {
							if(response.status == 200) {
								return true;
							}
							response = Ext.decode(response.responseText);
							if(response.error.length > 100)
								response.error = _("A critical error occured, please check your logs");
							Ext.Msg.alert(_("Error"), response.error);
						},
						save: function(store) {
							store.load();
						},
						scope:this
					},
					autoDestroy:true,
					fields: [
						'connection_id','connection_name','connection_description','connection_binddn',
						'connection_bindpass','connection_host','connection_default','connection_port','connection_basedn','connection_tls','connection_ldaps'
					],
					idProperty:'connection_id',
					root: 'connections',
					url: "<?php echo $ro->gen('modules.lconf.data.connectionlisting'); ?>"
				})
			}			
			return this.dStore;
		},
		
		getTemplate : function() {
			if(!this.tpl) {
				this.tpl = new Ext.XTemplate(
					'<tpl for=".">',
						'<div class="ldap-connection" ext:qtip="{connection_description}" id="conn_{connection_id}">',
							'<div class="thumb"></div>',
							'<span class="X-editable"><b>{connection_name}</b></span><br/>',					
							'<span class="X-editable">',
							'<tpl if="connection_ldaps == true">ldaps://</tpl>',
							'{connection_host}:{connection_port}</span><br/>',
							'<tpl if="connection_default == true">(default)</tpl>',
						'</div>',

					'</tpl>'
				);
			}
			return this.tpl;
		},

		
		getView : function(createNew) {
			if(!this.dView || createNew) {	
				this.dView = new Ext.DataView({
					id: 'view-'+this.id,
					store: this.getStore(),
					tpl: this.getTemplate(),
					autoHeight:true,
					overClass:'x-view-over',
					multiSelect: false,
					itemSelector:'div.ldap-connection',
					emptyText: 'unnamed',
					cls: 'ldap-data-view'
				}); 
			}
			return this.dView;
		},

		update : function() {
			this.dStore.load();
		},
		
		init : function() {

			var view = this.getView();
			var store = this.getStore();
			view.addListener("click",this.handleContext,this);
			view.addListener("dblclick",function (dView,index,node,_e) {this.startConnect(index,node)},this);
			
			// Notify parent that the component is ready to be drawn
			store.on("load",function() {
				eventDispatcher.fireCustomEvent(this.eventId,view,this);
			},this);
			store.load();
			
			eventDispatcher.addCustomListener("ConnectionClosed",
							function(id) {
								this.closeConnection(id,true)
							},this);
			
		},
		
		// handles creation and display of the context menu
	    handleContext : function(dView,index,node,_e)	{
			_e.preventDefault();
			if(!this.ctxMenu)
				this.ctxMenu = {}
			if(!this.ctxMenu[index]) {
				this.ctxMenu[index] = new Ext.menu.Menu({
					items:[{
						text: 'Connect',
						id: this.id+'-connect-'+index,
						iconCls: 'icinga-icon-database-go',
						handler : function() {this.startConnect(index,node);},
						scope:this
					},{
						text: 'View',
						id: this.id+'-edit'+index,
						iconCls: 'icinga-icon-database',
						handler : function() {this.viewDetails(index,node);},
						scope:this
					},{
						iconCls: 'icinga-icon-wrench-screwdriver',
						text: 'Export config',
						handler: function() {
							this.exportPreflight(index,node);
						},
						scope: this
					}]
				});
			}	
			this.ctxMenu[index].showAt(_e.getXY());
		},

		viewDetails : function(index,node) {
			var record = this.getStore().getAt(index);
			var tpl = this.getDetailTemplate();
			
			var detailWindow = new Ext.Window({
				title: record.get('connectionName'),
				autoDestroy: true,
				closable: true,
				modal: true,
				width:400,
				height:300,
				defaultType: 'field'
				
			});
			detailWindow.render(Ext.getBody());
			detailWindow.doLayout();
			tpl.overwrite(detailWindow.body,record.data);
			detailWindow.show();

			
		},

		getDetailTemplate: function() {
			if(!this.detailTpl) {
				this.detailTpl = new Ext.XTemplate(
					'<table style="margin:10px;width:100%" cellpadding="0" cellspacing="0">',
						'<tr><td>ID</td><td>{connection_id}</td></tr>',
						'<tr><td>Name</td><td>{connection_name}</td></tr>',
						'<tr><td colspan="2">Description</td></tr>',
						'<tr><td colspan="2">',
							'<div style="background-color:white;border:1px solid black;border-radius:5px;height:75px;width:70%;overflow:auto">',
								'{connection_description}',
							'</div>',
						'</td></tr>',
						'<tr><td>BindDN</td><td> {connection_binddn}</td></tr>',
						'<tr><td>BaseDN</td><td> {connection_basedn}</td></tr>',
						'<tr><td>Host</td><td> {connection_host}</td></tr>',
						'<tr><td>Port</td><td> {connection_port}</td><tr>',
						'<tr><td>Authentification type </td><td>  --</td><tr>',
						'<tr><td>Uses TLS </td></td> {connection_tls}</td></tr>',
					'</table>'
					);
			}
			return this.detailTpl;
		},
		isConnected: function(connName) {
			if(this.connections[connName])
				return true
			else
				return false		
		},
		
		startConnect: function(index, node) {
			var record = this.dStore.getAt(index);
			var connName = record.get('connection_name');
			if(this.isConnected(connName)) {
				AppKit.notifyMessage(connName, _('Connection is already open!'));
				return false;
			}
		    AppKit.notifyMessage(connName, 'Connecting...');
			Ext.Ajax.request({
				url: '<?php echo $ro->gen("modules.lconf.data.connect")?>',
				success: this.onConnectionSuccess,
				failure: this.onConnectionFailure,
				params: {connection_id : record.get('connection_id')},
				scope: this,
				// custom parameter
				record: record,
				connName: connName
			});
		
		},
		showExportSuccessWindow: function(result) {

			var infoWnd = new Ext.Window({
				title: _('Export result'),
				width: 330,
				height: 350,
				layout: 'fit',
				autoScroll: true,
				modal:true,
				items: new Ext.grid.GridPanel({
					autoHeight: true,
					autoWidth: true,
					border: false,
					store: new Ext.data.JsonStore({
						root: 'config',
						fields: ['count','type'],
						data: result
					}),
					colModel: new Ext.grid.ColumnModel({
						columns: [{
							width:50,
							dataIndex: 'type',
							renderer: function(v) {
								var icon = "";
								switch(v) {
									case 'services':
										icon = 'service';
										break;
									case 'hosts':
										icon = 'host';
										break;
									case 'host groups':
										icon = 'hostgroup';
										break;
									case 'service groups':
										icon = 'servicegroup';
										break;
									case 'contacts':
										icon = 'user';
										break;
									case 'contact groups':
										icon = 'group';
										break;
									case 'commands':
										icon = 'script';
										break;
									case 'time periods':
										icon = 'clock-red';
										break;	
								}
								if(icon)
									icon = "icinga-icon-"+icon;
								return '<div class="icon-16 '+icon+'"></div>';
							}
						},{
							header: _('Type'),
							dataIndex: 'type',
							renderer: function(v) {
								
								return Ext.util.Format.capitalize(v);
							},
							width: 200
						},{
							header: _('Nr of objects'),
							dataIndex: 'count',
							width:100
						}]	
					}),
					sm: null
				})
			});
		
			infoWnd.show();
		},
		
		exportPreflight: function(index,node) {
			var record = this.dStore.getAt(index);
			lconf.prog = Ext.Msg.wait(_("Exporting config"),_("Your icinga-web config is being exported"));
			Ext.Ajax.request({
				url: this.exportUrl,
				params: {preflight:true,connection_id : record.get('connection_id')},
				success: function(r) {
					try {
						var result = Ext.decode(r.responseText);
						if(!result)
							result = {};
						lconf.prog.hide();	
						this.showExportTargets(result,record);
					} catch(e) {
						lconf.prog.hide();		
						Ext.Msg.alert(_("Warning"),_("Export preflight succeeded, but there was an error parsing the server's result <br/>"+e));
					}
					
				},
				exception: function() {
					lconf.prog.hide();	
				},
				failure: function(r) {
					try {	
						var result = Ext.decode(r.responseText);
					
						if(!result)
							result = {}
						result.error = result.error || _("Unknown error");

						result.error = "<div style='border:1px solid black;overflow:scroll;height:200px;width:400px;background-color:white;font-family:monospace;font-size:10;'><pre>"+Ext.util.Format.ellipsis(result.error,200)+"</pre></div>";
						lconf.prog.hide();	
						Ext.Msg.alert(_("Could not export config: "),result.error);	
					} catch(e) {
						lconf.prog.hide();		
						Ext.Msg.alert(_("Could not export config: "),_("Unknown error"));	
					}
				},
				scope: this
			});		
		},

		showExportTargets: function(results,record) {
			var items = [{
				html: _('Choose targets to export to<br/>'),	
				xtype: 'label',
				style : 'font-weight: bold;margin-bottom:15px'
			},{
				xtype: 'spacer',
				height: 10
			},{
				fieldLabel: _('Master instance'),
				checked: true,
				disabled: true
			}]
			
			for(var i=0;i<results.config.Available.length;i++) {
				var itemName = results.config.Available[i];
				items.push({
					fieldLabel: Ext.util.Format.htmlEncode(itemName),
					checked: results.config.Updated.indexOf(itemName) > -1,
					name: itemName
				});	
			}
			var formId = Ext.id();
			var wnd = new Ext.Window({
				title : _('Exporter'),
				layout: 'fit',
				width: 300,
				height: 200,	
				autoScroll:true,
				
				items: {
					padding: 5,
					layout: 'form',
					xtype: 'form',
					id: formId,
					defaults: {
						xtype: 'checkbox',
						width: 200
					},
					items: items
				},
				buttons: [{
					text: _('Deploy selected configs'),	
					iconCls: 'icinga-icon-wrench',
					handler: function(e) {
						var selected = Ext.getCmp(formId);
						var items = (selected.getForm().getValues());
						var toExport = []
						for(var i in items) {
							toExport.push(i);
						}
						this.exportConfiguration(record,toExport);
						e.ownerCt.ownerCt.close();
					},
					scope: this

				}, {
					text: _('Cancel'),	
					iconCls: 'icinga-icon-cancel',
					handler: function(e) {
						e.ownerCt.ownerCt.close();	
					}
				}]
			});
			wnd.show();
		},

		exportConfiguration: function(record, toExport) {		
			var toExport = Ext.encode(toExport);			
			
			Ext.Msg.confirm(_("Export config"),_("Export configuration in this tree?"),function(btn){
				if(btn != 'yes')
					return false;
				lconf.prog = Ext.Msg.wait(_("Exporting config"),_("Your icinga-web config is being exported"));
				Ext.Ajax.request({
					url: this.exportUrl,
					params: {
						satellites: toExport,
						connection_id : record.get('connection_id')
					},
					success: function(r) {
						try {
							var result = Ext.decode(r.responseText);
							if(!result)
								result = {};
							lconf.prog.hide();	
							this.showExportSuccessWindow(result);
						} catch(e) {
							lconf.prog.hide();		
							Ext.Msg.alert(_("Warning"),_("Exporting succeeded, but there was an error parsing the server's result <br/>"+e));
						}
						
					},
					exception: function() {
						lconf.prog.hide();	
					},
					failure: function(r) {
						try {	
							var result = Ext.decode(r.responseText);
						
							if(!result)
								result = {}
							result.error = result.error || _("Unknown error");
	
							result.error = "<div style='border:1px solid black;overflow:scroll;height:200px;width:400px;background-color:white;font-family:monospace;font-size:10;'><pre>"+Ext.util.Format.ellipsis(result.error,200)+"</pre></div>";
							lconf.prog.hide();	
							Ext.Msg.alert(_("Could not export config: "),result.error);	
						} catch(e) {
							lconf.prog.hide();		
							Ext.Msg.alert(_("Could not export config: "),_("Unknown error"));	
						}
					},
					scope: this
				});	
			},this);
		},

		onConnectionSuccess: function(response,params) {		
			var responseJSON = Ext.decode(response.responseText);
			if(!responseJSON["ConnectionID"]) {
				AppKit.notifyMessage(params.connName, 'No connectionID returned!');
				return false;
			}

			// Tell the dispatcher to spread that the connection is open
			eventDispatcher.fireCustomEvent("ConnectionStarted",{
										id:responseJSON["ConnectionID"],
										rootNode: responseJSON["RootNode"],
										connectionName:params.connName
									});
			// save connectionId to avoid duplicates
			this.connections[params.connName] = responseJSON["ConnectionID"];
		},

		onConnectionFailure: function(response, params) {
			AppKit.notifyMessage(params.connName, 
					'Couldn\'t connect!<br/>'+
					response.responseText
			);
		},
		getConnectionNameById: function(id) {
			for(var index in this.connections) {
				if(this.connections[index] == id) {
					return index;	
				}
			};
		},
		closeConnection: function(connName,isId) {
			if(isId) 
				connName = this.getConnectionNameById(connName);
			
			AppKit.notifyMessage('Closing connection',connName);
			this.connections[connName] = null;
		}
	});
	
	new lconf.actionBar.connectionManager({
			storeURL: '<?php echo $ro->gen("modules.lconf.data.connectionlisting");?>',
			eventId: '<?php echo $t["eventId"]; ?>',
			parentid: '<?php echo $t["parentid"]; ?>',
			exportUrl: '<?php echo $ro->gen("modules.lconf.export");?>' 
	});
}) ()
</script>
