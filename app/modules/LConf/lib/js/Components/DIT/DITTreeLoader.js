/**
 * Loader for the the LConf DIT Tree, loads and creates Nodes for the LConf
 * DIT Tree.
 *
 * Requires an object with:
 *  dataUrl:    The URL from which to request the data
 *  renderer:   The renderer to use for node creation
 */
/*jshint browser:true, curly:false */
/*global Ext:true, LConf:true, _:true */
(function() {
    "use strict";

    Ext.ns("LConf.DIT").DITTreeLoader = Ext.extend(Ext.tree.TreeLoader,{
        iconSet: {},
        dataUrl: "",
        createNode: function(attr) {

            var nodeAttr = attr;
            var i = 0;
            var objClass = attr.objectclass[i];
            var noIcon = false;
            LConf.Helper.Debug.d("DITTreeLoader createNode",this,arguments);
            do {
                objClass = attr.objectclass[i];
                noIcon = false;
                // select appropriate icon
                if(objClass === 'alias') {
                    nodeAttr.isAlias = true;

                }
                if(typeof this.iconSet[objClass.toLowerCase()] === "string") {    

                    nodeAttr.iconCls = this.iconSet[objClass.toLowerCase()];
                } else {
                    noIcon = true;
                }

            } while(noIcon && attr.objectclass[++i]);

            //var aliasString = "ALIAS=Alias of:";
            nodeAttr.connId = this.baseParams.connId;
            nodeAttr.text = this.getText(attr);
            nodeAttr.qtip = _("<b>ObjectClass:</b> ")+objClass+
                            _("<br/><b>DN:</b> ")+Ext.util.Format.ellipsis(attr.dn,45)+
                            _("<br/>Click to modify");


            nodeAttr.id = attr.dn;
            nodeAttr.leaf = attr.isLeaf ? true :false;
            if(attr.valid === false) {
                nodeAttr.qtip = "<span style='color:red'>This alias points to an non-existing target</span>";
                nodeAttr.text = "<span style='color:red'>"+nodeAttr.text+" (broken)</span>";
            }
            return Ext.tree.TreeLoader.prototype.createNode.call(this,nodeAttr);
        },



        constructor: function(config) {

            this.dataUrl = config.urls.directoryprovider;
            this.iconSet = {};
            for(var i in config.icons) 
                this.iconSet[i.toLowerCase()] = config.icons[i];

            LConf.Helper.Debug.d("Icons ",this.iconSet,config);
            Ext.tree.TreeLoader.prototype.constructor.call(this,config);
        },

        getText: function(attr,withDN) {
            var txtRegExp = /^.*?\=/;
            var shortened = attr.dn.split(",")[0];
            if(attr.count && !attr.isLeaf)
                shortened = shortened+"("+attr.count+")";
            return (withDN) ? shortened : shortened.replace(txtRegExp,"");
        }
    });
})();