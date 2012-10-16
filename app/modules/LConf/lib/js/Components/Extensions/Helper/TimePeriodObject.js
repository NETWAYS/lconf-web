/**
 * Timeperiod object that is able to parse textual timeperiods into an object form and vice versa
 * 
 * Timeperiod rules
 * 
 * Timeperiod         :=  Daylocator   Timerange
 * Timerange          :=  HH:MM-HH:MM | HH:MM-HH:MM, Timerange
 * Daylocator         :=  Range | Pattern
 * Range                 :=  RangePattern | RangePattern / NR
 * RangePattern     :=  DayPattern - DayPattern  | MonthPattern - MonthPattern  | DatePattern - DatePattern | day - NR | MonthName - NR
 * Pattern                :=  DayPattern | Monthpattern | Datepattern
 * DayPattern         :=  DayName | DayName SIGNED_NR | DayName  NR MonthName
 * MonthPattern     :=   MonthName | Monthname Nr
 * DatePattern       :=  Year-Month-Day
 * 
 * 
 * @author: Jannis Moßhammer <jannis.mosshammer@netways.de>
 */
/*jshint browser:true, curly:false */
/*global Ext:true */
Ext.ns("LConf.Extensions.Helper").TimePeriodObject = function(toParse,timeframes) {
    "use strict";
    var dayPattern = /^ *day \d.*/i;
    var regexpParts = {
        months: 'january|february|march|april|may|june|july|august|october|november|december',
        weekdays: 'monday|tuesday|wednesday|thursday|friday|saturday|sunday'
    };
    var weekdayPattern = new RegExp("^ *("+regexpParts.weekdays+") .*","i");
    var monthPattern = new RegExp("^ *("+regexpParts.months+") .*","i");

    this.from = {
        month: null,
        day: null,
        dayNr: null,
        dayInterval: null,
        date: null
    };
  
    this.to = null;
    this.timeframes = [];
    
    this.parsePatternBasedTimePeriod = function(str) {
        str = str.trim();
        str = str.replace("\t"," ");
        if(dayPattern.test(str)) {
            this.parseDayPatternTimePeriod(str);
        } else if(weekdayPattern.test(str)) {
            this.parseWeekdayPatternTimePeriod(str);
        } else if(monthPattern.test(str)) {
            this.parseMonthPatternTimePeriod(str);
        }
    };
    
    /**
     * Parse all dates beginning with 'day'
     */
    this.parseDayPatternTimePeriod = function(str) {
        var res = str.match(/^ *day ([\-]{0,1}\d+) (- ([\-]{0,1}\d+))?( +\/ +(\d+))? *([0-9:,\-]+)? *$/i);
        if(res) {
            this.from.dayNr = parseInt(res[1],10);
            if(res[3]) {
                this.to = {
                    month: null,
                    day: null,
                    dayNr: parseInt(res[3],10),
                    dayInterval: null,
                    date: null
                };
            }
            // check if there's an interval defined (every 5th day for example)'
            if(res[5]) {
                this.from.dayInterval = parseInt(res[5],10);
            }
        }
    };

    this.enableTo = function() {
         this.to = {
            month: null,
            day: null,
            dayNr: null,
            dayInterval: null,
            date: null
        };
    };

    this.parseWeekdayPatternTimePeriod = function(str) {
        // indexes to make this regular expression orgy more readable
        var idx = { 
            DAY : 1, DAY_NR: 2, MONTH: 3, TO_DAY: 5, TO_NR: 6, 
            TO_MONTH : 7, HAS_INTERVAL : 8, INTERVAL : 9
        };
        var fromPattern = "*("+regexpParts.weekdays+")[\t ]*(-{0,1}[0-9]+)?[\t ]*("+regexpParts.months+")?",
            toPattern = "(- *("+regexpParts.weekdays+")[\t ]*(-{0,1}[0-9]+)?[\t ]*("+regexpParts.months+")?)?", // optional
            intervalPattern = "(/ *([0-9]+))?";

        var weekdayOnly = new RegExp("^ "+fromPattern+" *"+toPattern+" *"+intervalPattern+' +([0-9:,\-]+) *$',"i");
        var weekdayTest = str.match(weekdayOnly);
        if(!weekdayTest) 
            throw "Couldn't parse "+str;
        
        this.from.day = weekdayTest[idx.DAY].trim();
        if(weekdayTest[idx.DAY_NR])
            this.from.dayNr = parseInt(weekdayTest[idx.DAY_NR],10);
        if(weekdayTest[idx.MONTH])
            this.from.month = weekdayTest[idx.MONTH];

        if(weekdayTest[idx.TO_DAY])
            this.to = {
                month: null,
                day: weekdayTest[idx.TO_DAY],
                dayNr: null,
                dayInterval: null,
                date: null
            };
        if(weekdayTest[idx.TO_NR])
            this.to.dayNr = parseInt(weekdayTest[idx.TO_NR],10);
        if(weekdayTest[idx.TO_MONTH])
            this.to.month = weekdayTest[idx.TO_MONTH];
        if(weekdayTest[idx.HAS_INTERVAL])
            this.from.dayInterval = parseInt(weekdayTest[idx.INTERVAL],10);
    };
    
    this.parseMonthPatternTimePeriod = function(str) {
        var fromPattern = "("+regexpParts.months+") *(-{0,1}[0-9]+)? *",
                toPattern = "(- *("+regexpParts.months+")? *(-{0,1}[0-9]+)?)?",
                intervalPattern = "(/ *([0-9]+))?";
                
        var monthPattern = new RegExp("^ *"+fromPattern+" *"+toPattern+" *"+intervalPattern+" *([0-9:,\-]+)? *$","i");
        var monthResult = str.match(monthPattern);
        if(!monthResult) 
            throw "Couldn't parse "+str;
        
        this.from.month = monthResult[1].trim();
        if(monthResult[2])
            this.from.dayNr = parseInt(monthResult[2],10);
        if(monthResult[3]) {
            this.to = {
                month: null,
                day: null,
                dayNr: null,
                dayInterval: null,
                date: null
            };
            if(monthResult[4])
                this.to.month = monthResult[4];
            if(monthResult[5])
                this.to.dayNr = parseInt(monthResult[5],10);
            if(monthResult[6])
                this.from.dayInterval = parseInt(monthResult[7],10);
        }
    };
    
    this.parseDateBasedTimePeriod = function(str) {
        var fromPattern = "([1-3][0-9]{3,3}-[01][0-9]-[0-3][0-9])",
             toPattern = "(- *([1-3][0-9]{3,3}-[01][0-9]-[0-3][0-9]))?",
             intervalPattern = "(/ *([0-9]+))?";
             
        var yearPattern = new RegExp("^ *"+fromPattern+" *"+toPattern+" *"+intervalPattern+"  *([0-9:,\-]+)? *$","i");
        var yearResult = str.match(yearPattern);
        if(!yearResult) 
            throw "Couldn't parse "+str;
        this.from.date = yearResult[1].trim();
        if(yearResult[2])
            this.to = {
                month: null,
                day: null,
                dayNr: null,
                dayInterval: null,
                date: yearResult[3]
            };
        if(yearResult[4])
            this.from.dayInterval = parseInt(yearResult[5],10);
    };
    
    this.parseFromString = function(str) {
        str = str.trim()
        if(str.charCodeAt(0) <= 48 || str.charCodeAt(0) >= 58)
            this.parsePatternBasedTimePeriod(str);
        else
            this.parseDateBasedTimePeriod(str);
    };
    
    this.parseTimeFrames = function(str) {
        
        var timeFramepart= str.match(/ *([0-9:,\-]+) *$/);
        if(!timeFramepart)
            return;
                
        timeFramepart = timeFramepart[1];
        var timeFrames = timeFramepart.split(",");
        for(var i=0;i<timeFrames.length;i++) {
            var res = timeFrames[i].split("-");
            this.timeframes.push(res);
        }
    };
    
    this.getTimeFrameString = function() {
        var str = [];
        for(var i=0;i<this.timeframes.length;i++) {
            str.push(this.timeframes[i].join("-"));
        }
        return str.join(",");
    };
    
    this.getKeyValPart = function(timeObj,noDay) {
        var keyString = "";
        if(timeObj.day)
           keyString += timeObj.day;
       else if(timeObj.month)
           keyString += timeObj.month;
       
       if(timeObj.dayNr) {
           if(!keyString && ! noDay)
               keyString = "day";
           if(keyString.length > 0)
               keyString += " ";
           keyString += timeObj.dayNr;
       }
       if(timeObj.day && timeObj.month)
            keyString += " "+timeObj.month;

       if(timeObj.date)
           keyString += timeObj.date;
       return keyString;
    };
    
    this.toKeyVal = function() {
       var keyString = this.getKeyValPart(this.from);
       if(this.to)
           keyString += " - "+this.getKeyValPart(this.to,true);
       if(this.from.dayInterval)
           keyString += " / "+this.from.dayInterval;
       return [keyString, this.getTimeFrameString()];
    };

    this.toString = function() {
        var t = this.toKeyVal();
        return t[0]+" "+t[1];
    };

    this.validate = function() {
        if(this.from.date && (this.from.day || this.from.month || this.from.dayNr))
            return "A date based timezone may not contain months, days or day numbers";
        if(this.from.day && this.from.dayNr && this.from.dayNr > 5)
            return "Impossible start date given";
        if(this.to) {
            for(var i in this.to) {
                if(this.from[i] === null && this.to[i] !== null)
                    return "Inconsistent date format given ("+i+" is given in end, but not in start date)";
            }
            for(i in this.from) {
                if(i !== "month" && i !== "day" && i !== "dayInterval")
                    if(this.to[i] === null && this.from[i] !== null)
                        return "Inconsisten date format given ("+i+" is given in start, but not in end date)";
            }
        }
        return true;
    };

    if(typeof toParse === "string") {
          toParse = toParse.trim();
          this.parseFromString(toParse);
          this.parseTimeFrames(timeframes || toParse);
    }
    
};
