/*jshint browser:true, curly:false */
/*global Ext:true */
(function() {
    "use strict";
    
    var TristateButton = Ext.extend(Ext.Button,{
        enableToggle: true,
        constructor: function(cfg) {
            Ext.apply(this,cfg);
            Ext.Button.prototype.constructor.apply(this,arguments);
        },
        // private
        setButtonClass : function(){
            if(this.useSetClass){
                if(!Ext.isEmpty(this.oldCls)){
                    this.el.removeClass([this.oldCls, 'x-btn-pressed']);
                }
                this.oldCls = (this.iconCls || this.icon) ? (this.text ? 'x-btn-text-icon' : 'x-btn-icon') : 'x-btn-noicon';
                this.el.addClass([this.oldCls, this.pressed === true ? 'x-btn-pressed' : null]);
            }
        },
        /**
        * If a state it passed, it becomes the pressed state otherwise the current state is toggled.
        * @param {Boolean} state (optional) Force a particular state
        * @param {Boolean} supressEvent (optional) True to stop events being fired when calling this method.
        * @return {Ext.Button} this
        */
        toggle : function(state, suppressEvent){
            if(state === undefined) {
                if(this.pressed === "false")
                    state = "disabled";
                else if(this.pressed === "true")
                    state = "false";
                else
                    state = "true";
            }
            if(state !== this.pressed){
                if(this.rendered){
                    this.el.removeClass('x-btn-disabled');
                    this.el.removeClass('x-btn-pressed');
                    if(state === "true" || state === "false") {
                        this.el[state ? 'addClass' : 'removeClass']('x-btn-pressed');
                    } else {
                        this.el.addClass('x-btn-disabled');
                        this.el.replaceClass('x-btn-pressed','x-btn-disabled');
                    }
                }
                this.pressed = state;
                if(!suppressEvent){
                    this.fireEvent('toggle', this, state);
                    if(this.toggleHandler){
                        this.toggleHandler.call(this.scope || this, this, state);
                    }
                }
            }
            if(this.stateText[state])
                this.setText(this.stateText[state]);
            return this;
        }
    });
    Ext.reg("tristatebutton",TristateButton);

})();
