/*!
 * react-backbone v0.12.1
 * https://github.com/jhudson8/react-backbone
 *
 * Copyright (c) 2014 Joe Hudson<joehud_AT_gmail.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
(function(main) {
  if (typeof define === 'function' && define.amd) {
    define(['react', 'backbone', 'underscore'], main);
  } else if (typeof exports !== 'undefined' && typeof require !== 'undefined') {
    module.exports = function(React, Backbone) {
      main(React, Backbone, require('underscore'));
    };
  } else {
    main(React, Backbone, _);
  }
})(function(React, Backbone, _) {

  var xhrEventName = Backbone.xhrEventName;
  var xhrCompleteEventName = Backbone.xhrCompleteEventName;
  var xhrModelLoadingAttribute = Backbone.xhrModelLoadingAttribute;

  var getState = React.mixins.getState;
  var setState = React.mixins.setState;

  /**
   * Return the model specified by a ReactComponent property key
   */
  function getModelByPropkey(key, context, useGetModel) {
    var model;
    if (key) {
      model = context.props[key];
      if (!model) {
        throw new Error('No model found for "' + key + '"');
      }
    } else if (useGetModel) {
      model = context.getModel();
    }
    return model;
  }

  /**
   * Return either an array of elements (if src provided is not an array)
   * or undefined if the src is undefined
   */
  function ensureArray(src) {
    if (!src) {
      return;
    }
    if (_.isArray(src)) {
      return src;
    }
    return [src];
  }

  /**
   * Return a callback function that will provide the model
   */
  function targetModel(modelToUse) {
    return function() {
      if (modelToUse) {
        return modelToUse;
      }
      if (this.getModel) {
        return this.getModel();
      }
    }
  }

  /**
   * Return a model attribute key used for attribute specific operations
   */
  function getKey(context) {
    if (context.getModelKey) {
      return context.getModelKey();
    }
    return context.props.key || context.props.ref ||
        context.props.name;
  }

  /**
   * Return the callback function (key, model) if both the model exists
   * and the model key is available
   */
  function ifModelAndKey(component, callback) {
    if (component.getModel) {
      var key = getKey(component);
      var model = component.getModel();
      if (model) {
        return callback(key, model);
      }
    }
  }

  /**
   * Utility method used to handle model events
   */
  function modelEventHandler(identifier, context, eventFormat, callback) {
    var keys = Array.isArray(identifier) ? identifier : ensureArray(context.props[identifier]),
      key, eventName;
    if (keys) {
      // register the event handlers to watch for these events
      for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        eventName = eventFormat.replace('{key}', key);
        context.modelOn(eventName, _.bind(callback, context), this);
      }
      return keys;
    }
  }

  /**
   * Provide modelOn and modelOnce argument with proxied arguments
   * arguments are event, callback, context
   */
  function modelOnOrOnce(type, args, _this, _model) {
    var modelEvents = getModelEvents(_this);
    var ev = args[0];
    var cb = args[1];
    var ctx = args[2];
    modelEvents[ev] = {type: type, ev: ev, cb: cb, ctx: ctx};
    var model = _model || _this.getModel();
    if (model) {
      _this[type === 'on' ? 'listenTo' : 'listenToOnce'](model, ev, cb, ctx);
    }
  }

  /**
   * Return all bound model events
   */
  function getModelEvents(context) {
    var modelEvents = getState('__modelEvents', context);
    if (!modelEvents) {
      modelEvents = {};
      setState({__modelEvents: modelEvents}, context);
    }
    return modelEvents;
  }


  Backbone.input = Backbone.input || {};
  var getModelValue = Backbone.input.getModelValue = function(component) {
    return ifModelAndKey(component, function(key, model) {
      return model.get(key);
    });
  };
  var setModelValue = Backbone.input.setModelValue = function(component, value, options) {
    return ifModelAndKey(component, function(key, model) {
      return model.set(key, value, options);
    });
  }


  /**
   * Simple overrideable mixin to get/set models.  Model can
   * be set on props or by calling setModel
   */
  React.mixins.add('modelAware', {
    getModel: function(props) {
      props = props || this.props;
      return getState('model', this) || getState('collection', this) ||
          props.model || props.collection;
    },
    setModel: function(model, _suppressState) {
      var preModel = this.getModel();
      var modelEvents = getModelEvents(this);
      _.each(modelEvents, function(data) {
        this.modelOff(data.ev, data.cb, data.ctx, preModel);
        modelOnOrOnce(data.type, [data.ev, data.cb, data.ctx], this, model);
      }, this);
      if (_suppressState !== true) {
        setState('model', model);
      }
    }
  }, 'state');


  /**
   * Iterate through the provided list of components (or use this.refs if components were not provided) and
   * return a set of attributes.  If a callback is provided as the 2nd parameter and this component includes
   * the "modelAware" mixin, set the attributes on the model and execute the callback if there is no validation error.
   */
  React.mixins.add('modelPopulate', {
    modelPopulate: function() {
      var components, callback, options, model;
      // determine the function args
      _.each(arguments, function(value) {
        if (value instanceof Backbone.Model || value === false) {
          model = value;
        } else if (_.isArray(value)) {
          components = value;
        } else if (_.isFunction(value)) {
          callback = value;
        } else {
          options = value;
        }
      });
      if (_.isUndefined(model) && this.getModel) {
        model = this.getModel();
      }

      var attributes = {};
      if (!components) {
        // if not components were provided, use "refs" (http://facebook.github.io/react/docs/more-about-refs.html)
        components = _.map(this.refs, function(value) {
          return value;
        });
      }
      var models = {};
      _.each(components, function(component) {
        // the component *must* implement getValue or modelPopulate to participate
        if (component.getValue) {
          var key = getKey(component)
          if (key) {
            var value = component.getValue();
            attributes[key] = value;
          }
        } else if (component.modelPopulate && component.getModel) {
          if (!model) {
            // if we aren't populating to models, this is not necessary
            return;
          }
          var _model = component.getModel();
          if (_model) {
            var _attributes = component.modelPopulate(options, false);
            var previousAttributes = models[_model.cid] || {};
            _.extend(previousAttributes, _attributes);
            models[_model.cid] = {
              model: _model,
              attr: previousAttributes
            };
          }
        }
      });

      if (model) {
        // make sure all submodels are valid so this can be atomic
        var isValid = true;
        var data = models[model.cid];
        if (!data) {
          data = {
            model: model,
            attr: {}
          };
        }
        _.extend(data.attr, attributes);
        models[model.cid] = data;
        var validateOptions = _.defaults({
          validate: true
        }, options);
        _.each(models, function(data) {
          var errors = !data.model._validate(data.attr, validateOptions);
          isValid = !errors && isValid;
        });

        if (isValid) {
          options = _.defaults({
            validate: false
          }, options);
          _.each(models, function(data) {
            data.model.set(data.attr, options);
          });
        }

        if (callback && isValid) {
          callback.call(this, model);
        }
      }

      return attributes;
    }
  }, 'modelAware');


  /**
   * Expose a "modelValidate(attributes, options)" method which will run the backbone model validation
   * against the provided attributes.  If invalid, a truthy value will be returned containing the
   * validation errors.
   */
  React.mixins.add('modelValidator', {
    modelValidate: function(attributes, options) {
      var model = this.getModel();
      if (model && model.validate) {
        return this.modelIndexErrors(model.validate(attributes, options)) || false;
      }
    }
  }, 'modelAware', 'modelIndexErrors');


  /**
   * Exposes model binding registration functions that will
   * be cleaned up when the component is unmounted and not actually registered
   * until the component is mounted.  The context will be "this" if not provided.
   *
   * This is similar to the "listenTo" mixin but model event bindings here will
   * be transferred to another model if a new one is set on the props.
   */
  React.mixins.add('modelEventAware', {
    getInitialState: function() {
      // model sanity check
      var model = this.getModel();
      if (model) {
        if (!model.off || !model.on) {
          console.error('the model does not implement on/off functions - you will see problems');
          console.log(model);
        }
      }
      return {};
    },

    componentWillReceiveProps: function(props) {
      var preModel = this.getModel();
      var postModel = this.getModel(props);
      if (preModel !== postModel) {
        this.setModel(postModel, true);
      }
    },

    // model.on
    // ({event, callback})
    modelOn: function(ev, callback, context) {
      modelOnOrOnce('on', arguments, this);
    },

    // model.once
    modelOnce: function(ev, callback, context) {
      modelOnOrOnce('once', arguments, this);
    },

    modelOff: function(ev, callback, context, _model) {
      var modelEvents = getModelEvents(this);
      delete modelEvents[ev];
      this.stopListening(targetModel(_model), ev, callback, context);
    }
  }, 'modelAware', 'listen');


  /**
   * Mixin used to force render any time the model has changed
   */
  React.mixins.add('modelChangeAware', {
    getInitialState: function() {
      _.each(['change', 'reset', 'add', 'remove', 'sort'], function(type) {
        this.modelOn(type, function() {
          this.deferUpdate();
        });
      }, this);
      return null;
    }
  }, 'modelEventAware', 'deferUpdate');


  // THE FOLLING MIXINS ASSUME THE INCLUSION OF [backbone-xhr-events](https://github.com/jhudson8/backbone-xhr-events)

  /**
   * If the model executes *any* XHR activity, the internal state "loading" attribute
   * will be set to true and, if an error occurs with loading, the "error" state attribute
   * will be set with the error contents
   */
  React.mixins.add('modelXHRAware', {
    getInitialState: function() {
      this.modelOn(xhrEventName, function(eventName, events) {
        setState({
          loading: true
        }, this);

        var model = this.getModel();
        events.on('success', function() {
          setState({
            loading: model[xhrModelLoadingAttribute]
          }, this);
        }, this);
        events.on('error', function(error) {
          setState({
            loading: model[xhrModelLoadingAttribute],
            error: error
          }, this);
        }, this);
      });

      var model = this.getModel();
      return {
        loading: model && model[xhrModelLoadingAttribute]
      };
    },

    componentDidMount: function() {
      // make sure the model didn't get into a non-loading state before mounting
      var state = this.state,
        model = this.getModel();
      if (model) {
        var loading = model[xhrModelLoadingAttribute];
        if (loading) {
          // we're still loading yet but we haven't yet bound to this event
          this.modelOnce(xhrCompleteEventName, function() {
            setState({
              loading: false
            }, this);
          });
          if (!state.loading) {
            setState({
              loading: true
            }, this);
          }
        } else if (state.loading) {
          setState({
            loading: false
          }, this);
        }
      }
    }
  }, 'modelEventAware');


  /**
   * Using the "key" property, bind to the model and look for invalid events.  If an invalid event
   * is found, set the "error" state to the field error message.  Use the "modelIndexErrors" mixin
   * to return the expected error format: { field1Key: errorMessage, field2Key: errorMessage, ... }
   */
  React.mixins.add('modelInvalidAware', {
    getInitialState: function() {
      var key = getKey(this);
      if (key) {
        this.modelOn('invalid', function(model, errors) {
          var _errors = this.modelIndexErrors(errors) || {};
          var message = _errors && _errors[key];
          if (message) {
            setState({
              invalid: message
            }, this);
          }
        });
      }
      return {};
    }
  }, 'modelIndexErrors', 'modelEventAware');


  /**
   * Expose an indexModelErrors method which returns model validation errors in a standard format.
   * expected return is { field1Key: errorMessage, field2Key: errorMessage, ... }
   *
   * This implementation will look for [{field1Key: message}, {field2Key: message}, ...]
   */
  React.mixins.add('modelIndexErrors', {
    modelIndexErrors: function(errors) {
      if (Array.isArray(errors)) {
        var rtn = {};
        _.each(errors, function(data) {
          var key, message;
          for (var name in data) {
            rtn[name] = data[name];
          }
        });
        return rtn;
      } else {
        return errors;
      }
    }
  });


  /**
   * Gives any comonent the ability to mark the "loading" attribute in the state as true
   * when any async event of the given type (defined by the "key" property) occurs.
   */
  React.mixins.add('modelLoadOn', function() {
    var keys = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : undefined;
    return {
      getInitialState: function() {
        keys = modelEventHandler(keys || 'loadOn', this, xhrEventName + ':{key}', function(events) {
          var model = this.getModel();
          setState({
            loading: model[xhrModelLoadingAttribute]
          }, this);
          events.on('complete', function() {
            setState({
              loading: false
            }, this);
          }, this);
        });

        // see if we are currently loading something
        var model = this.getModel();
        if (model) {
          var currentLoads = model.loading,
            key;
          if (currentLoads) {
            var clearLoading = function() {
              setState({
                loading: false
              }, this);
            }
            for (var i = 0; i < currentLoads.length; i++) {
              var keyIndex = keys.indexOf(currentLoads[i].method);
              if (keyIndex >= 0) {
                // there is currently an async event for this key
                key = keys[keyIndex];
                currentLoads[i].on('complete', clearLoading, this);
                return {
                  loading: model[xhrModelLoadingAttribute]
                };
              }
            }
          }
        }
        return {};
      },

      /**
       * Intercept (and return) the options which will set the loading state (state.loading = true) when this is called and undo
       * the state once the callback has completed
       */
      loadWhile: function(options) {
        options = options || {};
        var self = this;

        function wrap(type) {
          var _callback = options[type];
          options[type] = function() {
            setState({
              loading: false
            }, self);
            if (_callback) {
              _callback.apply(this, arguments);
            }
          }
        }
        wrap('error');
        wrap('success');
        setState({
          loading: true
        }, this);
        return options;
      }
    }
  }, 'modelEventAware');


  /**
   * Gives any comonent the ability to force an update when an event is fired
   */
  React.mixins.add('modelUpdateOn', function() {
    var keys = arguments.length > 0 ? Array.prototype.slice.call(arguments, 0) : undefined;
    return {
      getInitialState: function() {
        modelEventHandler(keys || 'updateOn', this, '{key}', function() {
          this.deferUpdate();
        });
      }
    };
  }, 'modelEventAware', 'deferUpdate');


  // if [react-events](https://github.com/jhudson8/react-events) is included, provide some nice integration
  if (React.events) {
    // set Backbone.Events as the default Events mixin
    React.events.mixin = React.events.mixin || Backbone.Events;

    /**
     * Support the "model:{event name}" event, for example:
     * events {
     *   'model:something-happened': 'onSomethingHappened'
     * }
     * ...
     * onSomethingHappened: function() { ... }
     *
     * When using these model events, you *must* include the "modelEventAware" mixin
     */
    var _modelPattern = /^model(\[.+\])?$/;
    React.events.handle(_modelPattern, function(options, callback) {
      return {
        on: function() {
          this.modelOn(options.path, callback);
        },
        off: function() { /* NOP, modelOn will clean up */ }
      };
    });

    var specials = React.events.specials;
    if (specials) {
      // add underscore wrapped special event handlers
      function parseArgs(args) {
        var arg;
        for (var i = 0; i < args.length; i++) {
          arg = args[i];
          if (arg === 'true') {
            arg = true;
          } else if (arg === 'false') {
            arg = false;
          } else if (arg.match(/^[0-9]+$/)) {
            arg = parseInt(arg);
          } else if (arg.match(/^[0-9]+\.[0-9]+/)) {
            arg = parseFloat(arg);
          }
          args[i] = arg;
        }
        return args;
      }
      var reactEventSpecials = ['memoize', 'delay', 'defer', 'throttle', 'debounce', 'once', 'after', 'before'];
      _.each(reactEventSpecials, function(name) {
        specials[name] = specials[name] || function(callback, args) {
          args = parseArgs(args);
          args.splice(0, 0, callback);
          return _[name].apply(_, args);
        };
      });
    }
  }


  // Standard input components that implement react-backbone model awareness
  var _inputClass = function(type, attributes, isCheckable, classAttributes) {
    return React.createClass(_.extend({
      mixins: ['modelAware'],
      render: function() {
        var props = {};
        var defaultValue = getModelValue(this);
        if (isCheckable) {
          props.defaultChecked = defaultValue;
        } else {
          props.defaultValue = defaultValue;
        }
        return React.DOM[type](_.extend(props, attributes, this.props), this.props.children);
      },
      getValue: function() {
        if (this.isMounted()) {
          if (isCheckable) {
            var el = this.getDOMNode();
            return (el.checked && (el.value || true)) || false;
          } else {
            return $(this.getDOMNode()).val();
          }
        }
      },
      getDOMValue: function() {
        if (this.isMounted()) {
          return $(this.getDOMNode()).val();
        }
      }
    }, classAttributes));
  };

  Backbone.input = Backbone.input || {};
  _.defaults(Backbone.input, {
    Text: _inputClass('input', {
      type: 'text'
    }),
    TextArea: _inputClass('textarea'),
    Select: _inputClass('select', undefined, undefined),
    CheckBox: _inputClass('input', {
      type: 'checkbox'
    }, true),
    RadioGroup: React.createClass({
      render: function() {
        var props = this.props;
        props.ref = 'input';
        return React.DOM[props.tag || 'span'](props, props.children);
      },
      componentDidMount: function() {
        // select the appropriate radio button
        var value = getModelValue(this);
        if (value) {
          var selector = 'input[value="' + value.replace('"', '\\"') + '"]';
          var el = $(this.getDOMNode()).find(selector);
          el.attr('checked', 'checked');
        }
      },
      getValue: function() {
        if (this.isMounted()) {
          var selector = 'input[type="radio"]';
          var els = $(this.getDOMNode()).find(selector);
          for (var i = 0; i < els.length; i++) {
            if (els[i].checked) {
              return els[i].value;
            }
          }
        }
      },
      getDOMValue: function() {
        if (this.isMounted()) {
          var selector = 'input[type="radio"]';
          return $(this.getDOMNode()).val();
        }
      }
    })
  });

});
