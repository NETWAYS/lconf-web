/*jshint browser:true, curly:false */
/*global Ext:true, LConf: true */
(function() {
    
"use strict";
var timePeriodPanel = function() {
    
    var TimePeriodParser = LConf.Extensions.Helper.TimePeriodObject;

    var dayStore = new Ext.data.ArrayStore({
        id: 0,
        fields: [
            'idx','day'
        ],
        data: [
            [null,'day'],['monday','Monday'],['tuesday','Tuesday'],['wednesday','Wednesday'],
            ['thursday','Thursday'],['friday','Friday'],['saturday','Saturday'],['sunday','Sunday']
        ]
    });

    var dayNrStore = new Ext.data.ArrayStore({
        id: 0,
        fields: [
            'idx','dayNr'
        ],
        data: [
            [null,"the"],[1,"first"],[2,"second"],[3,"third"],[4,"fourth"],[5,"fifth"],[-1,"last"]
        ]
    });

    var monthStore = new Ext.data.ArrayStore({
        id: 0,
        fields: [
            'idx','month'
        ],
        data: [
            [null,'in every month'],['january','January'],['february','February'],['march','March'],['april','April'],['may','May'],
            ['june','June'],['july','July'],['august','August'],['september','September'],['october','October'],
            ['november','November'],['december','December']]
    });

    var TimeFrameSlider = Ext.extend(Ext.form.CompositeField,{
        fieldLabel: 'From - To',
        setValue: function(startTime,endTime) {
            var fromField = this.items.get(0),
                toField = this.items.get(1);
            fromField.setValue(startTime);
            toField.setValue(endTime);
            fromField.fireEvent("change",fromField,startTime);
            toField.fireEvent("change",toField,endTime);
        },
        getFieldValue: function() {
            return [this.items.get(0).getValue(),this.items.get(1).getValue()];
        },
        anchor: '90%',
        items: [{
                xtype: 'textfield', 
                value: '00:00',
                width:75,
                regex: /([012]){0,1}\d:[0-5]\d/,
                regexText: 'Please enter a time between 00:00 and 24:00',
                listeners: {
                    change: function(cmp,value) {
                        var Hs = value.split(":");
                        var min = parseInt(Hs[0],10),
                            sec  = parseInt(Hs[1],10);
                        cmp.ownerCt.get(1).setValue(0,min*60+sec);
                    }
                }
        },{
            xtype: 'slider',
            flex: 1,
            width: 250,
            minValue: 0,
            maxValue: 1440,
            animate:false,
            values: [0,1440],
            increment: 15,
            constrainThumbs: false,
            plugins: [
                Ext.ux.LConf.SliderRangeMarkerPlugin({
                    color: 'blue'
                }),
                new Ext.slider.Tip({
                    getText: function(thumb){
                        return String.format('{0}:{1}', String.leftPad(~~(thumb.value/60),2,'0'),String.leftPad((thumb.value%60),2,'0'));
                    }
                })
            ], 
            listeners: {
                change: function(cmp) {
                    var lThumb  = cmp.thumbs[0],
                        rThumb = cmp.thumbs[1],
                        lField = this.ownerCt.get(0),
                        rField = this.ownerCt.get(2);
                    lField.suspendEvents();
                    lField.setValue(String.format('{0}:{1}', String.leftPad(~~(lThumb.value/60),2,'0'),String.leftPad((lThumb.value%60),2,'0')));
                    lField.resumeEvents();

                    rField.suspendEvents();
                    rField.setValue(String.format('{0}:{1}', String.leftPad(~~(rThumb.value/60),2,'0'),String.leftPad((rThumb.value%60),2,'0')));
                    rField.resumeEvents();
                }
            }
        },{
            xtype: 'textfield',
            value: '24:00',
            width:75,
            regex: /([012]){0,1}\d:[0-5]\d/,
            regexText: 'Please enter a valid time between 00:00 and 24:00',
            listeners: {
                change: function(cmp,value) {
                    var Hs = value.split(":");
                    var min = parseInt(Hs[0],10),
                            sec  = parseInt(Hs[1],10);
                    cmp.ownerCt.get(1).setValue(1,min*60+sec);
                }
            }
        }]
    });


    var getTimeRangeWizard = function(record,store) {
        var btns =  [{
            xtype: 'container',
            style: "color:red"
        },{
            text: 'Finish',
            iconCls: 'icinga-icon-accept',
            handler: function(cmp) {
                var panel = cmp.ownerCt.ownerCt;
                var outer = panel.ownerCt;
                var timeperiod = panel.items.get(0).getActiveTab().getTimeframeObject();

                panel.items.get(1).items.each(function(cmp) {
                    timeperiod.timeframes.push(cmp.getFieldValue());
                });
                var isValid = timeperiod.validate();
                if(isValid !== true) {
                    cmp.ownerCt.items.get(0).update(isValid);
                    return false;
                }
                if(record) {
                    record.set('periodObj',timeperiod);
                } else {
                    store.add(new (store.recordType)({periodObj: timeperiod}));
                }
                outer.remove(panel);
                outer.getLayout().setActiveItem(0);
                outer.doLayout();
                var grid = outer.items.get(0).items.get(0);
                grid.fireEvent("change",grid);
                return true;

            }
        },{
            text: 'Cancel',
            iconCls: 'icinga-icon-cancel',
            handler: function(cmp) {
                var me = cmp.ownerCt.ownerCt;
                var outer = me.ownerCt;
                outer.remove(me);
                outer.getLayout().setActiveItem(0);
                outer.doLayout();
            }
        }];


        var panel =  new Ext.Panel({
            layout: 'vbox',
            title: record ? "Modify timeperiod definition" : "Add new timeperiod definition",
            defaults: {
                padding: 10 
            },
            items: [{
                xtype: 'tabpanel',
                flex: 1.7,
                activeTab: 0,
                items: [{
                    xtype: 'form',
                    layout: 'form',
                    autoScroll:true,
                    labelWidth: 2,
                    plugins: new (function() {
                        this.init = function(form) {
                            form.fromTimeFrameObject = function(timePeriod) {
                                var fromField = this.items.get(0);
                                var toChk = this.items.get(1);
                                var toField = this.items.get(2);
                                var ivField = this.items.get(3);

                                fromField.items.each(function(item) {
                                    if(timeperiod.from[item.name] !== null) {
                                        item.setValue(timePeriod.from[item.name]);
                                        item.fireEvent("change",item,timePeriod.from[item.name]);
                                    }
                                });

                                // build 'to' part of the timeperiod
                                if(timePeriod.to) {
                                    toChk.setValue(1);
                                    toField.items.each(function(item) {
                                        item.setValue(timePeriod.to[item.name]);
                                        item.fireEvent("change",item,timePeriod.to[item.name]);
                                    });
                                }
                                ivField.items.get(0).setValue(timePeriod.from.dayInterval !==  null);
                                ivField.items.get(1).setValue(timePeriod.from.dayInterval);
                            };

                            form.getTimeframeObject = function() {
                                var timePeriod = new TimePeriodParser();
                                var fromField = this.items.get(0);
                                var toField = this.items.get(2);
                                var ivField = this.items.get(3);
                                // build 'from' part of the timeperiod
                                fromField.items.each(function(item) {
                                    if(!item.hidden && item.getValue()) {
                                        timePeriod.from[item.name] =  item.getValue();
                                    }
                                });
                                // build 'to' part of the timeperiod
                                if(!toField.disabled) {
                                    timePeriod.enableTo();
                                    toField.items.each(function(item) {
                                        if(!item.hidden && item.getValue()) {
                                            timePeriod.to[item.name] =  item.getValue();
                                        }
                                    });
                                }
                                // check if there's an interval'
                                if(ivField.items.get(0).getValue()) {
                                    timePeriod.from.dayInterval = ivField.items.get(1).getValue();
                                }
                                return timePeriod;
                            };
                        };

                    })(),
                    title: 'Day based timezone',
                    defaults: {
                        border: false
                    },
                    items: [{
                        xtype: 'compositefield',   
                        items: [{
                            xtype: 'combo',
                            width: 120,
                            store: dayNrStore,
                            displayField: 'dayNr',
                            valueField: 'idx',
                            mode: 'local',
                            emptyText: 'the',
                            name: 'dayNr',
                            triggerAction: 'all',
                            forceSelection: true,
                            listeners: {
                                change: function(cmp,v) {
                                    if(v === "" && cmp.ownerCt.items.get(2).getValue() === "") {
                                        cmp.ownerCt.items.get(1).show();
                                        cmp.ownerCt.doLayout();
                                    } else {
                                        cmp.ownerCt.items.get(1).hide();
                                        cmp.ownerCt.doLayout();
                                    }
                                }
                            }
                        },{
                            xtype: 'numberfield',
                            width: 30,
                            minValue: -30,
                            name: 'dayNr',
                            maxValue: 30,
                            hidden:false,
                            value: 1
                        },{
                            xtype: 'combo',
                            width: 130,
                            name: 'day',
                            store: dayStore,
                            emptyText: 'day',
                            displayField: 'day',
                            valueField: 'idx',
                            mode: 'local',
                            triggerAction: 'all',
                            forceSelection: true,
                            typeAhead: true,
                            listeners: {
                                change: function(cmp,val) {
                                    var v = cmp.ownerCt.items.get(0).getValue();
                                    if(v === "" &&  val === "") {
                                        cmp.ownerCt.items.get(1).show();
                                        cmp.ownerCt.doLayout();
                                    } else {
                                        cmp.ownerCt.items.get(1).hide();
                                        cmp.ownerCt.doLayout();
                                    }
                                }
                            }
                        },{
                            xtype: 'container',
                            style: 'padding-top:0.4em',
                            html: 'in'
                        },{
                            xtype: 'combo',
                            width: 120,
                            forceSelection: true,
                            store: monthStore,
                            name: 'month',
                            displayField: 'month',
                            emptyText: 'every month',
                            valueField: 'idx',
                            mode: 'local',
                            triggerAction: 'all',
                            typeAhead: true
                        }]
                    },{
                        xtype: 'checkbox',
                        boxLabel: 'To',
                        listeners: {
                            check: function(cmp,chk) {
                                cmp.ownerCt.items.get(2).setDisabled(!chk);
                            }
                        }
                    },{
                        xtype: 'compositefield',
                        disabled: true,
                        items: [{
                            xtype: 'combo',
                            width: 120,
                            store: dayNrStore,
                            displayField: 'dayNr',
                            valueField: 'idx',
                            mode: 'local',
                            emptyText: 'the',
                            name: 'dayNr',
                            triggerAction: 'all',
                            forceSelection: true,
                            listeners: {
                                change: function(cmp,v) {
                                    if( v === "" && cmp.ownerCt.items.get(2).getValue() === "") {
                                        cmp.ownerCt.items.get(1).show();
                                        cmp.ownerCt.doLayout();
                                    } else {
                                        cmp.ownerCt.items.get(1).hide();
                                        cmp.ownerCt.doLayout();
                                    }
                                }
                            }
                        },{
                            xtype: 'numberfield',
                            width: 30,
                            minValue: 1,
                            name: 'dayNr',
                            maxValue: 30,
                            hidden:false,
                            value: 1
                        },{
                            xtype: 'combo',
                            width: 130,
                            name: 'day',
                            store: dayStore,
                            emptyText: 'day',
                            displayField: 'day',
                            valueField: 'idx',
                            mode: 'local',
                            triggerAction: 'all',
                            forceSelection: true,
                            typeAhead: true,
                            listeners: {
                                change: function(cmp,val) {
                                    var v = cmp.ownerCt.items.get(0).getValue();
                                    if(v === "" &&  val === "day") {
                                        cmp.ownerCt.items.get(1).show();
                                        cmp.ownerCt.doLayout();
                                    } else {
                                        cmp.ownerCt.items.get(1).hide();
                                        cmp.ownerCt.doLayout();
                                    }
                                }
                            }
                        },{
                            xtype: 'container',
                            style: 'padding-top:0.4em',
                            html: 'in'
                        },{
                            xtype: 'combo',
                            width: 120,
                            forceSelection: true,
                            store: monthStore,
                            name: 'month',
                            displayField: 'month',
                            emptyText: 'every month',
                            valueField: 'idx',
                            mode: 'local',
                            triggerAction: 'all',
                            typeAhead: true
                        }]
                    },{
                        xtype: 'compositefield',
                        items: [{
                            xtype: 'checkbox',
                            boxLabel: ' every ',
                            listeners: {
                                check: function(cmp,chk) {
                                    cmp.ownerCt.items.get(1).setDisabled(!chk);
                                    cmp.ownerCt.items.get(2).setDisabled(!chk);
                                }
                            }
                        },{
                            disabled: true,
                            xtype: 'numberfield' ,
                            name: 'from.dayInterval',
                            width:25,
                            allowDecimals: false,
                            allowNegative: false
                        },{
                            xtype: 'container',
                            html: 'day',
                            style: 'padding-top: 0.4em'
                        }]
                    }]
                },new Ext.form.FormPanel({
                    title: 'Date based timezone',
                    layout: 'form',
                    labelWidth: 1,
                    plugins: new (function() {
                        this.init = function(form) {
                            form.fromTimeFrameObject = function(timePeriod) {
                                var fromDate = this.items.get(0);
                                var toChk = this.items.get(1);
                                var toDate = this.items.get(2);
                                var ivField = this.items.get(3);
                                fromDate.setValue(timePeriod.from.date);
                                toChk.setValue(timePeriod.to !== null);
                                if(timePeriod.to !== null) {
                                    toDate.setValue(timePeriod.to.date);
                                    toDate.fireEvent("change",toDate);
                                }
                                if(timePeriod.from.dayInterval !== null) {
                                    ivField.items.get(0).setValue(true);
                                    ivField.items.get(1).setValue(timePeriod.from.dayInterval);
                                }
                            };

                            form.getTimeframeObject = function() {
                                var timePeriod = new TimePeriodParser();
                                var fromDate = this.items.get(0);
                                var toDate = this.items.get(2);
                                var ivField = this.items.get(3);
                                timePeriod.from.date = fromDate.getValue().format('Y-m-d');
                                if(!toDate.disabled) {
                                    timePeriod.enableTo();
                                    timePeriod.to.date = toDate.getValue().format('Y-m-d');
                                }
                                
                                if(ivField.items.get(0).getValue())
                                    timePeriod.from.dayInterval = ivField.items.get(1).getValue();

                                return timePeriod;
                            };
                        };
                    })(),
                    items: [{
                        xtype: 'datefield', 
                        value: new Date(),
                        width: 200,
                        listeners: {
                            change: function(cmp,val) {
                                cmp.ownerCt.get(2).setMinValue(val);
                            }
                        }
                    },{
                        xtype: 'checkbox',
                        boxLabel: 'To',
                        listeners: {
                            check: function(cmp,chk) {
                                cmp.ownerCt.items.get(2).setDisabled(!chk);
                            }
                        }
                    },{
                        disabled: true,
                        width: 200,
                        xtype: 'datefield',
                        value: new Date(),
                        listeners: {
                            disable: function(cmp) {
                                cmp.ownerCt.get(0).setMaxValue(null);
                            },
                            enable: function(cmp) {
                                cmp.ownerCt.get(0).setMaxValue(cmp.getValue());
                            },
                            change: function(cmp) {
                                cmp.ownerCt.get(0).setMaxValue(cmp.getValue());
                            }
                        }
                    },{
                        xtype: 'compositefield',
                        items: [{
                            xtype: 'checkbox',
                            boxLabel: ' but only every ',
                            listeners: {
                                check: function(cmp,chk) {
                                    cmp.ownerCt.items.get(1).setDisabled(!chk);
                                    cmp.ownerCt.items.get(2).setDisabled(!chk);

                                }
                            }
                        },{
                            disabled: true,
                            xtype: 'numberfield' ,
                            width:25,
                            allowDecimals: false,
                            allowNegative: false
                        },{
                            xtype: 'container',
                            html: 'day',
                            style: 'padding-top: 0.4em'
                        }]
                    }]

                })]
            },{
                xtype: 'panel',
                title: 'Timerange',
                layout: 'form',
                flex: 2,
                autoScroll:true,
                width: 650,
                items: [new TimeFrameSlider()],
                buttons: [{
                        xtype: 'label',
                        text: '',
                        style: 'color:red'
                },{
                    xtype: 'button',
                    text: 'Add new timerange',
                    iconCls: 'icinga-icon-add',
                    handler: function(cmp) {
                        var panel = cmp.ownerCt.ownerCt;
                        panel.add(new TimeFrameSlider());
                        cmp.ownerCt.items.get(0).setText("");
                        panel.doLayout();
                    }
                },{
                    xtype: 'button',
                    text: 'Remove timerange',
                    qtip: 'Remove last timerange',
                    iconCls: 'icinga-icon-cancel',
                    handler: function(cmp) {
                        var panel = cmp.ownerCt.ownerCt;
                        if(panel.items.length < 2) {
                            cmp.ownerCt.items.get(0).setText("Can't remove last item");
                            return false;
                        } else {
                            cmp.ownerCt.items.get(0).setText("");
                        }
                        panel.remove(panel.items.last());
                        panel.doLayout();
                        return true;
                    }
                }]
            }],
            buttons: btns
        });

        if(record) {

            var timeperiod = record.get("periodObj");
            if(timeperiod.from.date) {
                panel.items.get(0).setActiveTab(1);
                panel.items.get(0).doLayout();
            }
            panel.items.get(0).items.get(0).fromTimeFrameObject(timeperiod);
            panel.items.get(0).items.get(1).fromTimeFrameObject(timeperiod);

            panel.items.get(1).removeAll();

            for(var i=0;i<timeperiod.timeframes.length;i++) {
                var start = timeperiod.timeframes[i][0],
                    end = timeperiod.timeframes[i][1],
                    slider = new TimeFrameSlider();
                panel.items.get(1).add(slider);
                slider.setValue(start,end);
            }

        }
        return panel;
    };

    return new Ext.Panel({
        title: 'Timeperiods',
        padding: 5,
        defaults: {
            border: false
        },
        items: [{
            layout: 'form',
            width: 750,
            items: [{
                xtype : 'fieldset',
                title: 'General information',
                items: [{
                    xtype: 'textfield',
                    fieldLabel: 'Timeperiod name',
                    lconfProperty: 'cn',
                    anchor: '90%'
                },{
                    xtype: 'textfield',
                    fieldLabel: 'Timeperiod alias' ,
                    lconfProperty: prefix+"Alias",
                    anchor: '90%' 
                },{
                    xtype: 'textfield',
                    fieldLabel: 'Description' ,
                    lconfProperty: "description",
                    anchor: '90%'
                }]
            }/*,errorArea*/,{
                xtype: 'panel',
                layout: 'card',
                activeItem: 0,
                width: 750,
                height: 300,
                items: [{
                    xtype: 'panel',
                    layout: 'fit',
                    title: 'Timeframes',
                    items: [
                        new Ext.grid.GridPanel({
                            
                            bindId: 'timeframeGrid', // checked by custom fn
                            colModel: new Ext.grid.ColumnModel({
                                columns: [{
                                    dataIndex: 'periodObj',
                                    header: 'Date pattern',
                                    renderer: function(o) {

                                        return o.toKeyVal()[0];
                                    },
                                    width:300
                                },{
                                    dataIndex: 'periodObj',
                                    renderer: function(o) {
                                        return o.toKeyVal()[1]; 
                                    },
                                    header: 'Time frame',
                                    width:200
                                },{
                                    xtype: 'actioncolumn',
                                    width: 50,
                                    items: [{
                                        iconCls: 'icon-16  icinga-icon-application-edit',
                                        tooltip: 'Modify',
                                        style: 'width: 18px',
                                        handler: function(grid,row) {
                                            var record = grid.getStore().getAt(row);
                                            var parent = grid.ownerCt.ownerCt;
                                            parent.add(getTimeRangeWizard(record,grid.getStore()));
                                            parent.getLayout().setActiveItem(1);
                                            parent.doLayout();
                                        }
                                    }, {
                                        tooltip: 'Delete',
                                        iconCls: 'icon-16 icinga-icon-cancel',
                                        style: 'width: 18px',
                                        handler: function(grid,row) {
                                            grid.getStore().removeAt(row);
                                            grid.fireEvent("change",grid);
                                        }
                                    }]
                                }],
                                viewConfig: {
                                    forceFit: true
                                }
                            }),
                            initComponent: function() {
                                this.addEvents("change");
                                Ext.grid.GridPanel.prototype.initComponent.apply(this,arguments);    
                            },
                            
                            store: new Ext.data.JsonStore({
                                data: [],
                                fields: ["id","timeframe","datepattern","periodObj"]
                            }),
                            buttons: [{
                                text: 'Add new timeframe',
                                iconCls: 'icinga-icon-alarm-clock-add',
                                handler: function(cmp) {
                                    var parent = cmp.ownerCt.ownerCt.ownerCt.ownerCt;
                                    parent.add(getTimeRangeWizard(null,cmp.ownerCt.ownerCt.getStore()));
                                    parent.getLayout().setActiveItem(1);
                                    parent.doLayout();
                                }
                            }]
                        })
                    ]
                }]
            }]
        }]
    });
};


var prefix = LConf.Configuration.prefix;

LConf.Extensions.Registry.registerPropertyView({

    objectclass: ".*timeperiod$",
    handler: function(store) {
        var binder = new LConf.Extensions.Helper.LDAPStoreDataBinder();
        binder.hookStore(store);
        
        var p = new Ext.Panel({
            autoDestroy: true,
            autoScroll: true,
            priority: 1,
            iconCls: 'icinga-icon-clock-red',
            title: 'Timeperiods',
            defaults: {
                flex: 1,
                border: false
            },
            items: [
                timePeriodPanel(store)            
            ]
        });
        var timeGridToStore = function(store,cmp) {
            store.remove(store.findProperty(prefix+"timeperiodvalue"));
            cmp.getStore().each(function(record) {
                store.setProperty(prefix+"timeperiodvalue",record.get("periodObj").toString(),true);
            },this);
        };
        
        var storeToTimeGrid = function(map,cmp) {
            if(!map[prefix+"timeperiodvalue"])
                return;
            var store = cmp.getStore();
            store.removeAll();
            if(!Ext.isArray(map[prefix+"timeperiodvalue"]))
                map[prefix+"timeperiodvalue"] = [map[prefix+"timeperiodvalue"]];
            var errors = [];
            
            for(var i=0;i<map[prefix+"timeperiodvalue"].length;i++) {
                try {
                    var obj = new LConf.Extensions.Helper.TimePeriodObject(map[prefix+"timeperiodvalue"][i]);
                    store.add(new (store.recordType)({periodObj: obj}));
               } catch(e) {
                   errors.push(e);
                   continue;
               }   
            }   
        };
        
        // register a custom bidner for the grid
        binder.registerCustomBinding(function(cmp) {
            return (cmp.bindId === "timeframeGrid");
        },timeGridToStore,storeToTimeGrid); 

        binder.bindCmp(p,true);
        p.addListener("destroy",function() {
            binder.destroy();
        });
        return p;
    }
});

})();