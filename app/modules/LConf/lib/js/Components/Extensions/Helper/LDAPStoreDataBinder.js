/*jshint browser:true, curly:false */
/*global Ext:true */
Ext.ns("LConf.Extensions.Helper").LDAPStoreDataBinder = function() {
    "use strict";
    this.store = null;
    this.xtypeHandler = {};
    this.customHandler = [];
    this.registeredComponents = [];
    
    this.defaultCmpChangeBinder = function(store,cmp) {
        if(!cmp.lconfProperty)
            return;
        var value = cmp.getValue();
        if(value === "" && cmp.allowBlank !== false) {
            store.deleteProperties(store.findProperty(cmp.lconfProperty));
        } else {
            store.setProperty(cmp.lconfProperty,value);
        }  
    };

    this.defaultStoreChangeBinder = function(map,cmp) {
        if(!cmp.lconfProperty) {
            return;
        }
        var lconfProperty = cmp.lconfProperty.toLowerCase();
        for(var i in map) {
            if(lconfProperty === i.toLowerCase())
                cmp.setValue(map[i]);
        }
    };

    this.registerStoreEvents = function() {
        if(this.store === null)
            return false;
        this.store.on("load",this.sync,this);
        this.store.on("update",this.sync,this);
        this.store.on("remove",this.sync,this);
        this.store.on("destroy",this.destroy,this);
        return true;
    };
    
    this.unregisterStoreEvents = function() {
        this.store.removeListener("load",this.sync,this);
        this.store.removeListener("update",this.sync,this);
        this.store.removeListener("remove",this.sync,this);
    };
    
    this.registerCustomBinding = function(xtypeOrFn,cmpChangeFn,storeChangeFn) {
        if(typeof xtypeOrFn === "string") {
            this.xtypeHandler[xtypeOrFn] = {
                cmpChange: cmpChangeFn,
                storeChange: storeChangeFn
            };
        } else if (typeof xtypeOrFn === "function") {
            this.customHandler.push({
                id: xtypeOrFn,fn:{
                    cmpChange: cmpChangeFn,
                    storeChange: storeChangeFn
                }
            });
        }
    };
    
    this.hasCustomHandler = function(cmp) {
        for(var i=0;i<this.customHandler.length;i++) {
            if(this.customHandler[i].id.call(this,cmp) === true) {
                return this.customHandler[i].fn;    
            }
        }
        return null;
    };
    
    this.hasXTypeHandler = function(cmp) {
        if(typeof this.xtypeHandler[cmp.xtype] === "function")
            return this.xtypeHandler[cmp.xtype];
        return null;
    };
    
    this.canUseDefaultHandler = function(cmp) {
        if (typeof cmp.setValue === "function" && typeof cmp.getValue === "function")
            return {
                cmpChange: this.defaultCmpChangeBinder,
                storeChange: this.defaultStoreChangeBinder
            };
        return null;
    };
    
    var syncCmp = function(cmp) {
        if(this.inSync)
            return;
        cmp.bindDirty = true;
        this.sync();
    };
    
    this.registerComponentEvents = function(cmp) {
        cmp.on("change",syncCmp,this);
        cmp.on({
            destroy : this.unregisterComponent.createDelegate(this,[cmp]),
            //remove : this.unregisterComponent.createDelegate(this,[cmp]),
            scope: this
        });
        
    };
    
    this.unregisterComponent = function(cmp) {
        var newComponentList = [];
        for(var i=0;i<this.registeredComponents.length;i++) {
            if(this.registeredComponents[i].target === cmp)
                continue;
            newComponentList.push(this.registeredComponents[i]);
        }
        this.registeredComponents = newComponentList;
        cmp.removeListener("change",syncCmp,this);
    };
    
    this.unregisterAllComponents = function() {
        while(this.registeredComponents.length > 0)
            this.unregisterComponent(this.registeredComponents[0].target);
    };
    
    this.bindCmp = function(cmp,traverse) {
        var prio = [this.hasCustomHandler, this.hasXTypeHandler, this.canUseDefaultHandler];
        var fn = null; 

        // check matching handler by priority
        for(var i=0;i<prio.length;i++) {
            fn = prio[i].call(this,cmp);
            if(fn !== null) {
                this.registeredComponents.push({
                    target: cmp,
                    fn: fn
                });
                this.registerComponentEvents(cmp);
                break;
            }
        }
        // traverse if there are any child nodes (these must be defined in a Ext.util.MixedCollection)
        if(traverse === true && cmp.items && typeof cmp.items.each === "function") {
            cmp.items.each(function(subCmp) {
                this.bindCmp(subCmp,true);
            },this);
        }
        
        return fn !== null;
    };
    
    this.hookStore = function(store) {
        this.store = store;
        this.registerStoreEvents();
    };
    this.destroy = function() {
        this.unregisterStoreEvents();
        this.unregisterAllComponents();
    };
    this.unhookStore = function() {
        this.unregisterStoreEvents();
        this.store = null;
    };
    
    var syncTask = new Ext.util.DelayedTask(function(){
        this.inSync = true;
        var ldapMap = {};
        this.store.each(function(r) {
            if(typeof ldapMap[r.get('property').toLowerCase()] === "string") {
                ldapMap[r.get('property').toLowerCase()]  = [ldapMap[r.get('property').toLowerCase()]];
            } 

            if(Ext.isArray(ldapMap[r.get('property').toLowerCase()])) {
                ldapMap[r.get('property').toLowerCase()].push(r.get('value'));
            } else {
                ldapMap[r.get('property').toLowerCase()] = r.get('value');
            }
        });
        for(var i=0;i<this.registeredComponents.length;i++) {
            var cmp = this.registeredComponents[i];

            if(!cmp.target.bindDirty) {
                cmp.fn.storeChange(ldapMap,cmp.target);
            } else {
                cmp.fn.cmpChange(this.store,cmp.target);
                cmp.target.bindDirty = false;
            }
        }
        
        this.inSync = false;
    },this);
    
    this.sync = function() {
        if(!this.inSync)
            syncTask.delay(200);
    };
};