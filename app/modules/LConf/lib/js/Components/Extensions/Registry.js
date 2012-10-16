/**
 *  Registry for LConf addons 
 *
 **/
/*jshint browser:true, curly:false */
/*global Ext:true */
Ext.ns("LConf.Extensions").Registry = new (function() {
    "use strict";
    var registeredExtensions = {
        'KVGrid' : [],
        'DITMenu' : [],
        'PropertyViews' : []
    };

    this.registerKeyValueGridExtension = function(extension) {
        this.registerExtension('KVGrid',extension);
    };

    this.registerDITMenuExtension = function(extension) {
        this.registerExtension('DITMenu',extension);
    };
    
    this.registerPropertyView = function(view) {
        this.registerExtension('PropertyViews',view);
    };

    this.getDITMenuExtensions= function() {
        return registeredExtensions.DITMenu;
    };

    this.getMatchingPropertyViews = function(node,store) {
        var propertyViews = [];
        var classes = node.attributes.objectclass;
        var views = registeredExtensions.PropertyViews;
        for(var i in classes) {
            if(isNaN(i))
                continue;
            for(var x=0;x<views.length;x++) {
                var m = new RegExp(views[x].objectclass,"i");
                if(m.test(classes[i]))
                    propertyViews.push(views[x].handler(store));
            }
        }
        
        return propertyViews;
    };
    
    /**
    *  Register an extension for dit menus
    *
    **/
    this.registerExtension = function(id, extension) {
        if(typeof registeredExtensions[id] === "undefined") {
            registeredExtensions[id] = [];
        }
        registeredExtensions[id].push(extension);
    };

    this.foreach = function(id, fn, scope) {
        var extensions = registeredExtensions[id];
        if(!Ext.isArray(extensions))
            return;
        for(var i=0;i<extensions.length;i++) {
            
        
            fn.call(scope,extensions[i]);
        }
    };
    
    /**
    * Checks whether an objectSelector matches the current store
    *
    **/
    this.objectMatches = function(store,objectSelector) {
      var testFn = function(record) {
          if(selector.test(record.get("property"))) {
              if(property.test(record.get("value"))) {
                  match = true;
                  return false;
              }
          }
          return true;
      };
      for(var selector in objectSelector) {
            var currentObjectSelector = objectSelector[selector];
            if(!Ext.isArray(currentObjectSelector))
                currentObjectSelector = [currentObjectSelector];
            
            for(var i=0;i<currentObjectSelector.length;i++) {
                var currentObject = currentObjectSelector[i];
                var property = new RegExp(currentObject,"i");
                selector = new RegExp(selector,"i");
                var match = false;
                // test if property name and value matches
                store.each(testFn);

                if(match === true)
                    return true;
            }
        }
        return false;
    };

    /**
    * Checks whether an propertySelector matches the current store
    *
    **/
    this.propertyMatches = function(record,propertySelector) {
        if(!Ext.isArray(propertySelector))
            propertySelector = [propertySelector];
        for(var i=0;i<propertySelector.length;i++) {

            var propertyRegExp = new RegExp(propertySelector[i],"i");
            if(propertyRegExp.test(record.get("property")))
                return true;
        }
        return false;
    };

    
})();
