<script type='text/javascript'>

Ext.Msg.minWidth = 500;
eventDispatcher = new (Ext.extend(Ext.util.Observable, {
	customEvents : {},
	constructor : function(config) {
		this.listeners = config;
		this.superclass.constructor.call(this,config);
	},
	addCustomListener : function(eventName, handler, scope,options) {
		this.addEvents(eventName);
		this.customEvents[eventName] = true;
		this.addListener(eventName,handler,scope,options);
	},
	fireCustomEvent : function() {
		var eventName = (Ext.toArray(arguments))[0]
		if(!this.customEvents[eventName])
			return false;
		this.fireEvent.apply(this,arguments);
	}
}))();
Ext.ns('lconf.loader');

lconf.loader.lazyLoadEditors = function(cb) {
	var route = '<?php echo $ro->gen("modules.lconf.ldapeditor.editorfielddefinitions");?>';
	var layer = new Ext.LoadMask(Ext.getBody(),{msg:_('Loading editors...')});
	layer.show();
	Ext.Ajax.request({
		url: route,
		success: function(resp) {
			layer.hide();
			eval(resp.responseText);	
			if(cb)
				cb();
		},
		failure: function(resp) {
			err = (resp.responseText.length<50) ? resp.responseText : 'Internal Exception, please check your logs';
			Ext.MessageBox.alert(_("Error"),_("Couldn't load editor:<br\>"+err))
			layer.hide();
		}
	});
	
}


Ext.onReady(function() {
	lconf.loadingLayer = new Ext.LoadMask(Ext.getBody(), {msg:_("Please wait...")}); ;
	var container = new Ext.Panel({
		layout:'border',
		id: 'view-container',
		defaults: {
			split:true,
			collapsible: true
		},
		border: false,
		items: [{
			title: 'DIT',
			region: 'west',
			id: 'west-frame-lconf',
			layout: 'fit',
			margins:'5 0 0 0',
			cls: false,
			width:400,
			minSize:200,
			maxSize:500

		}, {
			region:'center',
			collapsible:false,
			title: "Properties",
			layout: 'fit',
			id:'center-frame',
			margins: '5 0 0 0'
		},{
			title: 'Actions',
			region: 'east',
			id: 'east-frame',
			layout: 'accordion',
			animate:true,
			margins:'5 0 0 0',
			cls: false,
			width:200,
			minSize:100,
			maxSize:200
		}]
	})	
	
	AppKit.util.Layout.getCenter().add(container);
	AppKit.util.Layout.doLayout();

	<?php echo $t["js_actionBarInit"]?>
	<?php echo $t["js_DITinit"]?>
	<?php echo $t["js_PropertyEditorInit"]?>
	<?php echo $t["js_SimpleSearchGridInit"]?>
	
	/**
	 * Batch for displaying a specific connection/node on startup
	 */
	var connId = '<?php if(isset($t["start_connection"])) echo $t["start_connection"]?>'; 
	var dn = '<?php if(isset($t["start_dn"])) echo $t["start_dn"]?>';
	if(connId) {
		eventDispatcher.addCustomListener("connectionsLoaded",function(store,conn) {
			conn.startConnect(store.indexOfId(connId));
			if(dn)
				eventDispatcher.addCustomListener("TreeReady",function(tree) {
					tree.searchDN(dn);
				});	
		},this,{single:true})
	}
	var loginUrl = '<?php echo $ro->gen("modules.appkit.login"); ?>';
	var killCheck = false;
	var checkLoginTask = Ext.TaskMgr.start({
		run: function() {
			if(killCheck)
				return false;
			Ext.Ajax.request({
				url: loginUrl,
				failure: function(r) {
					if(r.status == 403) {
						Ext.Msg.confirm(_("Session expired"),_("Your login session expired. <br/>By clicking 'yes' you will be redirected to the login page, press 'no' in order to stay in LConf. <span style='color:red'>You won't be able to perform any actions</span>"),function(btn) {
							if(btn == 'yes')
								AppKit.changeLocation(loginUrl);
					
						})
						killCheck = true;		
					}	
				}
			});	
		},
		interval: 10000
	});
})

</script>

