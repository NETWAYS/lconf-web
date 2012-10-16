/**
* Store that handles LDAP key/value pairs, connection setup, etc
*
**/
/*jshint browser:true, curly:false */
/*global Ext:true */
(function() {
    
    "use strict";
    Ext.ns("LConf.Store").LDAPPropertyStore =Ext.extend(Ext.data.JsonStore,{
        reloadOnSave: true,
        currentDN: null,
        dirty: false,

        getCurrentDN: function() {
            return this.currentDN;
        },

        isDirty: function() {
            return this.dirty;
        },


        constructor: function(cfg) {
            Ext.apply(this,cfg);
            cfg.root = "properties";
            this.init(cfg);
            Ext.data.JsonStore.prototype.constructor.call(this,cfg);
            this.initEvents();
        },

        toggleReloadOnSave: function(bool)  {
            this.reloadOnSave = bool;
        },

        init: function(cfg) {
            cfg.writer = new Ext.data.JsonWriter({
                encode:true,
                writeAllFields:true,
                autoSave:true
            }),
            cfg.proxy = new Ext.data.HttpProxy({
                url : this.urls.modifyproperty,
                api: {
                    read: this.urls.properties
                }
            });
            cfg.storeId = Ext.id()+'_store';
            cfg.baseParams =  {
                'connectionId' : this.connId
            };
            cfg.idProperty = 'id';
            cfg.fields = ['id','property','parent','value'];
            cfg.autoSave = false;
        },

        initEvents: function() {

            this.on("save",function () {
                if(this.reloadOnSave) {
                    this.reload();
                }
                this.dirty = false;
            },this);

            // fetch currentDN when reloading
            this.on("load", function() {
                this.dirty = false;
                this.getDNFromRecord.apply(this,arguments);
            },this);

            // catch exceptions
            this.on("exception",function (proxy,type,action,opt,resp) {
                if(resp.status !== 200) {
                    Ext.Msg.alert('Process failed!',Ext.util.Format.ellipsis(resp.responseText,700));
                }
            });
        },

        setConnection: function(id)  {
            this.setBaseParam("connectionId",id);
        },

        getConnection: function() {
            return this.baseParams.connectionId;
        },

        setParentNode: function() {
            this.setBaseParam("parentNode",this.parentNode);
        },

        setNode: function(node) {
            this.setBaseParam("node",node);
        },

        findProperty: function(key,active) {
            var result = [];
            this.each(function(rec) {
                if(active && rec.store === null)
                    return true;
                var prop = rec.get("property");
                if(prop.toLowerCase() === key.toLowerCase()) {
                    result.push(rec);
                }
            });
            return result.length > 0 ? result : false;
        },

        setProperty: function(key, value,alwaysCreate) {
            var record = alwaysCreate ? false :  this.findProperty(key,true);
            if(record === false) {
                record = new (Ext.data.Record.create(['id','property','value']))();
                record.set("property",key);
                this.add(record);
            } 
            if(Ext.isArray(record))
                record = record[0];
            record.set("value",value);

            this.dirty = true;
        },

        deleteProperties: function(keys) {
            this.remove(keys);
            this.dirty = true;
        },

        hasPendingChanges: function() {
            return this.isDirty() || this.modified[0];
        },

        /**
        * Returns true if the passed row is a static field, i.e. can't be edited
        *
        * @param Integer The row to edit
        * @return Boolean
        **/
        isStatic: function(row) {
            return this.getAt(row).id === 'dn' ||
               this.getAt(row).id === 'dn_dn' ||
               this.getAt(row).get('parent');
        },

        /**
        * Semaphore for locking this store on invalid fields
        */
        markedAsInvalid: 0,

        markInvalid: function(val) {
            if(val) {
                this.markedAsInvalid++;
            } else {
                if(this.markedAsInvalid > 0)
                    this.markedAsInvalid--;
            }
        },

        isValid: function() {
            if(this.markedAsInvalid)
                return false;
            var valid = true;
            this.each(function(rec) {
                var prop = rec.get("property");

                if(!rec.data.value) {
                    valid = prop;
                    return false;
                }
                return true;
            });
            return valid;
        },

        saveChanges: function() {
            var invalidProperty = this.isValid();
            if(invalidProperty !== true)
                return invalidProperty;
            this.save();
            this.eventDispatcher.fireCustomEvent("refreshTree");
            return true;
        },

        getDNFromRecord : function (store,records) {
            var activeRecord;

            for(var index in records) {
                activeRecord = records[index];
                // Check if we're on an alias node
                if(!activeRecord.get) {
                    this.eventDispatcher.fireCustomEvent("invalidNode");
                    break;
                }
                if(!activeRecord.get("property"))
                    continue;

                if(activeRecord.get("property").toLowerCase() === "dn") {
                    this.currentDN = activeRecord.get("value");
                    break;
                }
            }
            return true;
        }
    });
})();