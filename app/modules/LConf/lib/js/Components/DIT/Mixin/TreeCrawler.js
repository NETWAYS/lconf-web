/* 
 * Helper class that expands tree branches
 * 
 */
/*jshint browser:true, curly:false */
/*global Ext:true */
Ext.ns("LConf.DIT.Mixin").TreeCrawler = function(cmp) {
    "use strict";
    
    this.refreshCounter = 0;
    
    this.expandAllRecursive = function(node,cb) {
        node = node || this.getRootNode();
        if(node === this.getRootNode())
            this.refreshCounter = 0;
        node.reload();
        node.on("load",function() {
            node.eachChild(function(newNode){
                this.expandAllRecursive(newNode,cb);
            });
            this.refreshCounter--;
            if(this.refreshCounter<1)
                if(cb)
                    cb();
        },this,{single:true});
    };

    this.getExpandedSubnodes = function(node) {
        var expanded = {
            here : [],
            nextLevel: []
        };
        if(node) {
            node.eachChild(function(subNode) {
                if(subNode.isExpanded()) {
                    expanded.here.push(subNode.id);
                    expanded.nextLevel.push(this.getExpandedSubnodes(subNode));
                }
            },this);
        }
        return expanded;
    };


    this.expandViaTreeObject = function(treeObj,finishFn) {
        var expandBranchesLeft = 0;

        Ext.each(treeObj.here,function(nodeId) {
            var node = this.getNodeById(nodeId);
            if(!node) {
                return true;
            }
            expandBranchesLeft++;
            var getNext = function() {
                if(expandBranchesLeft === 1 && treeObj.nextLevel.length === 0) {
                    if (finishFn)
                        finishFn();
                }

                for (var i = 0; i < treeObj.nextLevel.length; i++) {
                    var next = treeObj.nextLevel[i];
                    this.expandViaTreeObject(next, finishFn);
                }
                expandBranchesLeft--;
            };

            if(!node.isExpanded()) {
                node.on("expand",function(_node) {
                    getNext.call(this,_node);
                },this,{single:true});
                node.expand();
            } else {
                getNext.call(this);
            }
            return true;
        },this);
    };

    this.jumpToRealNode = function(alias) {
        
        var id = this.processDNForServer(alias.attributes.aliasedobjectname[0]);

        var node = this.getNodeById(id);

        if(!node)  {
            node = this.searchDN(id,true);
            return true;
        }
        this.selectPath(node.getPath());
        this.expandPath(node.getPath());
        return true;
    };

    this.searchDN = function(dn,noSelect) {
        var baseDN = this.getRootNode().id;
        var dnNoBase = dn.substr(0,(dn.length-(baseDN.length+1)));
        var splitted = dnNoBase.split(",");
        var expandDescriptor = {
            here: baseDN,
            nextLevel: []
        };

        var curPos = expandDescriptor;
        var lastDN = baseDN;
        while(splitted.length) {
            lastDN =  splitted.pop()+","+lastDN;
            curPos.nextLevel = [{
                here: lastDN,
                nextLevel: []
            }];
            curPos = curPos.nextLevel[0];
        }
        var finishFN = function() {
            var node = this.getNodeById(dn);

            this.selectPath(node.getPath());
            if(!noSelect)
                this.eventDispatcher.fireCustomEvent("nodeSelected",node,this.id);
            (node.ui ? node.ui : node).getEl().scrollIntoView(this.refOwner);
        };

        this.expandViaTreeObject(expandDescriptor,finishFN.createDelegate(this));
    };
    cmp.eventDispatcher.addCustomListener("jumpToRealNode",this.jumpToRealNode,cmp);

};
