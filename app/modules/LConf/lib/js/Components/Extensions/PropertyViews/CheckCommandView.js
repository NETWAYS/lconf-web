/**
 *  SImple view for checkcommands
 * 
 **/
/*jshint browser:true, curly:false */
/*global Ext:true, LConf: true */
(function() {

"use strict";
var prefix = LConf.Configuration.prefix;

/**
 * Returns the upper command panel used for checkcommand name and commandline definiiton
 * 
 * @param {Ext.data.Store } The store for the currently selected node
 * @return {Ext.form.FormPanel}
 */
var getCommandPanel = function(store) {

    //
    // Helper functions for synchronization with the ldap editor fields
    //
    var updateFieldValues = function(map) {   
        if(!this.lconfProperty) {
            return;
        }
        var lconfProperty = this.lconfProperty.toLowerCase();

        for(var i in map) {
            if(lconfProperty === i.toLowerCase())
                this.setValue(map[i]);
        }
    };

    var onFieldChange = function(cmp,value) {
        if(value === "" && cmp.allowBlank !== false) { 
            store.deleteProperties(store.findProperty(cmp.lconfProperty));
        } else {
            store.setProperty(cmp.lconfProperty,value);
        }
    };
    
    return {
        xtype:'form',
        layout: 'form',
        padding: "1em 1em 1em 1em",
        autoHeight: true,
        items:{
            xtype: 'fieldset',
            iconCls: 'icinga-icon-cog',
            title: 'Check command',
            labelWidth: 200,
            anchor: '90% ',
            defaults: {
                updateFieldValues: updateFieldValues,
                listeners: {
                    change: onFieldChange,
                    invalid: function(cmp) {
                        if(!cmp.activeError)
                            store.markInvalid(true);
                    },
                    valid: function() {
                        store.markInvalid(false);
                    }
                }
            },
            items: [{
                fieldLabel: 'Command name',
                xtype: 'textfield',
                lconfProperty: "cn",
                anchor: '90%',
                allowBlank: false
            },{
                fieldLabel: 'Commandline',
                xtype: 'textfield',
                lconfProperty: prefix+"Commandline",
                anchor: '90%',
                allowBlank:false
            }]
        }
    };
};

/**
 * Eventhandler method that updates the current editor panels (must be the scope) 
 * textfields by triggering the updateFieldValues method
 * @TODO: There's a lot of copy&paste between the different editor views
 */
var updateFormValues = function() {
    var ldapMap = {};
    this.store.each(function(r) {
        ldapMap[r.get('property').toLowerCase()] = r.get('value');
    });
    if(this.rendered) {        
        this.items.each(function(item) {
            if(!item)
                return false;
            if(item.xtype !== 'panel') {
                item.getForm().callFieldMethod("updateFieldValues",[ldapMap]);
            } else {
                item.items.each(function(subitem) {
                    if(!subitem)
                        return false;
                    subitem.getForm().callFieldMethod("updateFieldValues",[ldapMap]);
                });
            }
        });
        if(this.items.items[1])
            this.items.items[1].getForm().callFieldMethod("updateFieldValues",[ldapMap]);
    } else {
        this.on("show",updateFormValues,this,{single:true});
    }
};

LConf.Extensions.Registry.registerPropertyView({
    objectclass: ".*command",
    handler: function(store) {
        var p = new Ext.Panel({
            autoScroll: true,
            priority: 1,
            autoDestroy: true,
            title: 'Check command',
            iconCls: 'icinga-icon-cog',
            defaults: {
                flex: 1,
                border: false
            },
            items: [
                getCommandPanel(store)
            ]
        });

        p.store = store;
        var storeFn = updateFormValues.createDelegate(p);
        store.on("update",storeFn);
        store.on("load",storeFn);
        p.addListener("destroy",function() {
            store.removeListener("update",storeFn);
            store.removeListener("load",storeFn);
        });
        return p;

    }
});

})();