ko.bindingHandlers.select2 = {
    init: function(element, valueAccessor, allBindingsAccessor) {
        var obj = valueAccessor(),
            allBindings = allBindingsAccessor(),
            lookupKey = allBindings.lookupKey;
        $(element).select2(obj);
        if (lookupKey) {
            var value = ko.utils.unwrapObservable(allBindings.value);
            $(element).select2('data', ko.utils.arrayFirst(obj.data.results, function(item) {
                return item[lookupKey] === value;
            }));
        }

        ko.utils.domNodeDisposal.addDisposeCallback(element, function() {
            $(element).select2('destroy');
        });
    },
    update: function(element) {
        $(element).trigger('change');
    }
};

var update = function (element) {
    var el = $(element);
    if (el.data('select2')) {
        el.trigger('change');
    }        
};
var updateOptions = ko.bindingHandlers['options']['update'];
ko.bindingHandlers['options']['update'] = function (element) {
    var r = updateOptions.apply(null, arguments);
    update(element);
    return r;
};
var updateSelectedOptions = ko.bindingHandlers['selectedOptions']['update'];
ko.bindingHandlers['selectedOptions']['update'] = function (element) {
    var r = updateSelectedOptions.apply(null, arguments);
    update(element);
    return r;
};