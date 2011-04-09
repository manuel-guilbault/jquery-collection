(function ($) {
	var methods = {
        sort: function (options) {
            var settings = {
                descendant: false,
                selector: null,
                predicate: null,
                compare: 'string',
            };
            if (options) {
                $.extend(settings, options);
            }
            return this.each(function () {
                var $this = $(this);
                var items = $this.children();
                if (settings.selector) {
                    items = items.filter(settings.selector);
                }
                items = items.get();
                if (settings.predicate) {
                    switch (typeof settings.predicate) {
                    case 'string':
                        var predicate = function(a, b) {
                            return $.collection.compare(
                                $(a).find(settings.predicate).text(),
                                $(b).find(settings.predicate).text(),
                                settings.compare
                            );
                        };
                        break;
                    case 'function':
                        var predicate = settings.predicate;
                        break;
                    case 'object':
                        switch (typeof settings.compare) {
                        case 'string':
                            var compare = new Array(settings.predicate.length);
                            for (var key in compare) {
                                compare[key] = settings.compare;
                            }
                            break;
                        default:
                            var compare = settings.compare;
                            break;
                        }
                        var predicate = function(a, b) {
                            a = $.map(settings.predicate, function(selector) {
                                return $(a).find(selector).text();
                            });
                            b = $.map(settings.predicate, function(selector) {
                                return $(b).find(selector).text();
                            });
                            return $.collection.compareMultiple(a, b, compare);
                        };
                        break;
                    default:
                        $.error(settings.predicate + ' is not a valid predicate');
                    }
                } else {
                    var predicate = function(a, b) {
                        return $.collection.compare($(a).text(), $(b).text(), settings.compare);
                    };
                }
                items.sort(function(a, b) {
                    return predicate(a, b) * (settings.descendant ? -1 : 1);
                });
                for (var key in items) {
                    $this.append(items[key]);
                }
            });
        },
        'bind-sorter': function(options) {
        	var data = this.data('collection');
        	if (data == null) {
        		data = {
    				sortField: null,
    				sortDesc: false,
    				sorters: []
        		};
    			this.data('collection', data);
    		}
        	var settings = {
        		sorter: null,
        		live: false,
        		callback: null
            };
        	$.extend(settings, options);
            var sorter = $(settings.sorter);
            data.sorters = data.sorters.concat(sorter.get());
            this.data('collection', data);
            var $this = this;
            var handler = function(e) {
            	e.preventDefault();
            	var data = $this.data('collection');
                if (data.sortField != sorter) {
                	data.sortField = sorter;
                	data.sortDesc = false;
                } else {
                	data.sortDesc = !data.sortDesc;
                }
                $this.data('collection', data);
                options.descendant = data.sortDesc;
            	$this.collection('sort', options);
            	if (settings.callback) {
            		options.sorted = $this.get();
            		settings.callback.call(this, e, options);
            	}
            };
            if (settings.live) {
            	sorter.live('click.collection', handler);
            } else {
            	sorter.bind('click.collection', handler);
            }
            return this;
        },
        'unbind-sorter': function(options) {
        	var data = this.data('collection');
        	if (options) {
	        	var settings = {
	        		sorter: null
	            };
	        	switch (typeof options) {
	        	case 'object':
	        		$.extend(settings, options);
	        		break;
	        	case 'string':
	        		settings.sorter = options;
	        		break;
	        	}
	        	var sorter = $(settings.sorter);
	        	var toRemove = sorter.get();
	        	for (var i in toRemove) {
	        		var k = data.sorters.indexOf(toRemove[i]);
        			if (k != -1) {
        				data.sorters.splice(k, 1);
        			}
	        	}
        	} else {
        		var sorter = $(data.sorters);
        		data.sorters = [];
        	}
        	if (data.sorters.length == 0) {
        		this.removeData('collection');
        	} else {
        		this.data('collection', data);
        	}
        	sorter.unbind('click.collection');
        	sorter.die('click.collection');
        	return this;
        },
    };
    $.fn.collection = function (method) {
        if (methods[method]) {
            return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.collection');
        }
    };
    $.collection = {
        compare: function(a, b, type) {
            if (!type) {
                type = 'string';
            }
            switch (typeof type) {
            case 'string':
            	switch (type) {
                case 'string':
                    return a > b ? 1 : a < b ? -1 : 0;
                case 'string-ignorecase':
                    a = a.toLowerCase();
                    b = b.toLowerCase();
                    return a > b ? 1 : a < b ? -1 : 0;
                case 'int':
                    return parseInt(a) - parseInt(b);
                case 'float':
                    return parseFloat(a) - parseFloat(b);
                default:
                    $.error(type + ' is not a valid compare type');
                }
            case 'function':
            	return type(a, b);
        	default:
        		$.error(type + ' is not a valid compare type');
            }
        },
        compareMultiple: function(a, b, type) {
            var result = 0;
            for (var i = 0; i < a.length && result == 0; ++i) {
                result = $.collection.compare(a[i], b[i], type ? type[i] : undefined);
            }
            return result;
        }
    };
})(jQuery);