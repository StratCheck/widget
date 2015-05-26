/* jshint laxbreak: true */
/**
 * moment.js plugin: additional methods
 * businessDiff (mStartDate)
 * businessAdd (numberOfDays)
 * businessSubtract (numberOfDays)
 * business ([false])
 */
(function () {
    var moment;
    moment = (typeof require !== "undefined" && require !== null) 
        && !require.amd 
        ? require("moment") 
        : this.moment;
 
    moment.fn.businessDiff = function (start) {
        var a, b, c,
            iDiff = 0,
            unit = 'day',
            iDiffDays = this.diff(start, unit);
        
        if (this.isSame(start)) return iDiff;
 
        if (this.isBefore(start)) {
            a = start.clone();
            b = this.clone();
            c = -1;
        } else {
            a = this.clone();
            b = start.clone();
            c = 1;
        }
 
        do {
            var iDay = b.day();
            if (iDay > 0 && iDay < 6) {
                iDiff++;
            }
            b.add(unit, 1);
        } while (a.diff(b, unit) > 0);
 
        return iDiff * c;
    };
 
    moment.fn.businessAdd = function (days) {
        var i = 0;
        while (i < days) {
            this.add('day', 1);
            if (this.day() > 0 && this.day() < 6) {
                i++;
            }
        }
        return this;
    };
 
    moment.fn.businessSubtract = function (days) {
        var i = 0;
        while (i < days) {
            this.subtract('day', 1);
            if (this.day() > 0 && this.day() < 6) {
                i++;
            }
        }
        return this;
    };
    
    moment.fn.business = function (backwards) {
        while (this.day() === 0 || this.day() == 6) {
            this[!!backwards ? 'businessSubtract' : 'businessAdd'](1);
        }
        return this;
    };
    
}).call(this);