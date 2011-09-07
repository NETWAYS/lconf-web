Ext.ns('lconf.wizards');
(function() {
	lconf.presetFields = Ext.decode('<?php echo $t["lconfPresets"]; ?>');
	
	lconf.wizard = Ext.extend(lconf.propertyManager,{
		url : '<?php echo $ro->gen("modules.lconf.data.modifynode");?>',
		id : Ext.id("wizard"),
		root: 'properties',
		enableFb : true,
		
		noLoadOnSave: true,
		constructor: function(config) {
			Ext.apply(this,config);
			
			lconf.propertyManager.prototype.constructor.call(this,config);
			if(!lconf.editors)
				lconf.loader.lazyLoadEditors(this.initMe.createDelegate(this));
			this.initMe();

		},
		initMe : function() {
			
			this.on("render", function(elem) {
			
				this.ownerCt.on("hide",function(elem) {
					this.getStore().rejectChanges();
					this.getStore().on("beforeload",function(store,rec,ope) {
						return false; //supress reading
					});
				},this,{single:true})
				var record = Ext.data.Record.create(['id','property','value']);
						
				this.getStore().on("exception",function(proxy,type,action,options,response) {
					if(response.status != '200')
						Ext.Msg.alert(_("Element could not be created"),_("An error occured: "+response.responseText));
					else if(response.status == '200') {
 						if(this.getStore().closeOnSave)
							this.ownerCt.hide();
						this.getStore().closeOnSave = false;
						
						eventDispatcher.fireCustomEvent("refreshTree");
					}
					return true;
				},this);
				this.getStore().removeListener("save");

				if(lconf.presetFields[this.wizardView]) {
					var properties = lconf.presetFields[this.wizardView];
					for(var property in properties) {
						this.getStore().add(new record({property:property,value:properties[property]}));
					}
				} else 
					this.getStore().add(new record());	
					
				this.fbar.add({
					xtype: 'button',
					text: _('Save and close'),
					iconCls: 'icinga-icon-disk',
					handler: function() {
						this.getStore().closeOnSave = true;
						this.getStore().save();
					},
					scope: this
				})
			},this);	
		},
		height: Ext.getBody().getHeight()*0.9 > 400 ? 400 : Ext.getBody().getHeight()*0.9,
		width:40
		
	});

})();
 
