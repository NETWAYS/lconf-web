(function() {
	Ext.ns("lconf.editors");
	lconf.editors = {}
	
	lconf.editors.editorFieldMgr = new function() {
		/**
		 * Private static map of property=>editorfield relations
		 */
		var registeredEditorFields = {}
		
		this.registerEditorField = function(property,editor) {
			registeredEditorFields[property.toLowerCase()] = editor;
		} 
		
		this.unregisterEditorField = function(property) {
			delete(registeredEditorFields[property.toLowerCase()]);
		}	
		
		this.getEditorFieldForProperty = function(property,cfg,objectclass) {
			var field;
			objectclass = objectclass || [];
			if(!Ext.isArray(objectclass))
			 	objectclass = [objectclass]; 
	
			for(var i=0;i<objectclass.length;i++) {
				if(!objectclass[i])
					continue; // skip empty fields
				field = registeredEditorFields[objectclass[i].toLowerCase()+"."+property.toLowerCase()];		
				if(Ext.isDefined(field))
					break;
			}
			
			if(!Ext.isDefined(field))
				field = registeredEditorFields[property.toLowerCase()];
			if(Ext.isDefined(field)) {
				return new field(cfg);
			}
		
			return registeredEditorFields["default"];
		}
	}
	
	lconf.editors.genericTextfield = Ext.form.TextField;
	
	lconf.editors.ComboBoxFactory = new function() {
		var baseRoute = '<?php echo $ro->gen("modules.lconf.data.ldapmetaprovider") ?>';
		this.setBaseRoute = function(route) {
			this.baseRoute = route;
		}
		this.getBaseRoute = function() {
			return this.baseRoute;
		}
		
		this.create = function(src) {
			var propertyStore = new Ext.data.JsonStore({
				autoDestroy:false,
				url: String.format(baseRoute),
				baseParams: {field:src}
				// Metadata is provided by the server  
			})
		
			return Ext.extend(Ext.form.ComboBox,{
			    triggerAction: 'all',
			    lazyRender:true,
				displayField: 'entry',
				valueField: 'entry',
				enableKeyEvents: true,
				mode:'remote',
				store: propertyStore,
				listeners: {
					afterrender: function(cmp) {
						cmp.keyNav.enter = function() {}
					}
				}
			});
		}
	}
	
	lconf.editors.SetFactory = new function() {
		var baseRoute = '<?php echo $ro->gen("modules.lconf.data.ldapmetaprovider") ?>';
		this.setBaseRoute = function(route) {
			this.baseRoute = route;
		}
		this.getBaseRoute = function() {
			return this.baseRoute;
		}
		
		this.create = function(src) {
			var propertyStore = new Ext.data.JsonStore({
				autoDestroy:false,
				url: String.format(baseRoute),
				baseParams: {field:src}
				// Metadata is provided by the server  
			})
			
			return Ext.extend(Ext.form.ComboBox,{
			    triggerAction: 'all',
			    lazyRender:true,
				displayField: 'entry',
				valueField: 'entry',
				mode:'remote',
				store: propertyStore,
				pageSize: 25,
				tpl: '<tpl for="."><div style="padding-left:25px" class="icinga-icon-{cl} x-combo-list-item">{entry}</div></tpl>',
				enableKeyEvents: true,
				initList: function() {
					var _comboScope = this;
					Ext.form.ComboBox.prototype.initList.apply(this,arguments);
					this.view.collectData = function(recordArray) {
						var available = _comboScope.getValue().split(",");
						for(var i=0;i<available.length;i++) {
							available[i] = Ext.util.Format.trim(available[i]);
						}
					
						for(var i=0;i<recordArray.length;i++) {
							var record = recordArray[i];	
							if(available.indexOf(record.get("entry")) > -1)
								record.data['cl'] = 'delete';
							else
								record.data['cl'] = 'add';
						
						}
						return Ext.DataView.prototype.collectData.apply(this,arguments);
					}
				},
				listeners:  {
					beforeselect: function(_form,rec,row) {
						var node = _form.view.getNode(row);
						var old = _form.getValue();	
						var newVal = rec.get('entry');
						var row = Ext.get(_form.view.getNode(row));
						// check whether to remove or to add an element
						if(rec.data['cl'] == 'delete') {
							var splitted = old.split(",");
							var newSet = [];
							for(var i=0;i<splitted.length;i++) {
								if(Ext.util.Format.trim(splitted[i]) != newVal)
									newSet.push(splitted[i]);	
							}
							_form.setValue(newSet.join(","))
							rec.data['cl'] = 'add';
							row.replaceClass('icinga-icon-delete','icinga-icon-add');
						} else {	
							if(old)
								_form.setValue(old+","+newVal);
							else 	
								_form.setValue(newVal);
							rec.data['cl'] = 'delete';
							row.replaceClass('icinga-icon-add','icinga-icon-delete');
						}
				
						return false;
					},
					keypress: function(combo,e) {
						combo.collapse();
					}	
				}
			});
		}
	}
	

	// shorthands
	var _lconf = lconf.editors; 
	var _f = _lconf.comboBoxFactory;
	var _register = _lconf.editorFieldMgr.registerEditorField;
	_register("default",Ext.form.TextField);
	
	// register editor factories
	<?php 
		foreach(AgaviConfig::get("modules.lconf.propertyPresets") as $type=>$preset)  {
			echo "	
			_register('".$type."',lconf.editors.".$preset["factory"]."Factory.create('".@$preset["parameter"]."'));";	
			foreach($preset as $subType=>$subPreset) {
				if($subType != "factory" && $subType != "parameter") 
					echo "		
				_register('".$subType.".".$type."',lconf.editors.".$subPreset["factory"]."Factory.create('".@$subPreset["parameter"]."'));";	
			}
		}
	?>

})() // EOF loadable code snippet
