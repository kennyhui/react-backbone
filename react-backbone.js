/*!
 * react-backbone v0.11.2
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

  function setState(state, context) {
    if (context.isMounted()) {
      context.setState(state);
    } else if (context.state)  {
      _.extend(context.state, state);
    } else {
      // if we aren't mounted, we will get an exception if we try to set the state
      // so keep a placeholder state until we're mounted
      // this is mainly useful if setModel is called on getInitialState
      context.__react_backbone_state = _.extend(context.__react_backbone_state || {}, state);
    }
  }

  function getState(key, context) {
    var state = context.state,
        initState = context.__react_backbone_state;
    return (state && state[key]) || (initState && initState[key]);
  }

  function eventParser(src) {
    if (!src) {
      return;
    }
    if (_.isArray(src)) {
      return src;
    }
    return [src];
  }

  function getKey(context) {
    return context.key || context.ref || context.props.key || context.props.ref;
  }

  function modelEventHandler(identifier, context, eventFormat, callback) {
    var keys = Array.isArray(identifier) ? identifier : eventParser(context.props[identifier]),
        key, eventName;
    if (keys) {
      // register the event handlers to watch for these events
      for (var i=0; i<keys.length; i++) {
        key = keys[i];
        eventName = eventFormat.replace('{key}', key);
        context.modelOn(eventName, _.bind(callback, context), this);
      }
      return keys;
    }
  }


  /**
   * Internal model event binding handler
   * (type(on|once|off), {event, callback, context, model})
   */
  function onEvent(type, data) {
    var eventsParent = this;
    data = _.extend({type: type}, data);
    var modelEvents = getState('__modelEvents', this);
    if (!modelEvents) {
      modelEvents = [];
      setState({__modelEvents: modelEvents}, this);
    }
    data.context = data.context || this;
    modelEvents.push(data);

    // bind now if we are already mounted (as the mount function won't be called)
    if (this.isMounted()) {
      var model = data.model || this.getModel();
      if (model) {
        model[data.type](data.event, data.callback, data.context);
      }
    }
  }


  /**
   * Simple overrideable mixin to get/set models.  Model can
   * be set on props or by calling setModel
   */
  React.mixins.add('modelAware', {
    componentWillMount: function() {
      // not directly related to this mixin but all of these mixins have this as a dependency
      // if setState was called before the component was mounted, the actual component state was
      // not set because it might not exist.  Convert the pretend state to the real thing
      // (but don't trigger a render)
      var _state = this.__react_backbone_state;
      if (_state) {
        this.state = _.extend(this.state || {}, _state);
        delete this.__react_backbone_state;
      }
    },

    getModel: function() {
      return getState('model', this) || getState('collection', this)
          || this.props.model || this.props.collection;
    },

    setModel: function(model) {
      if (this._modelUnbindAll) {
        this._modelUnbindAll(true);
      }
      setState({model: model}, this);
      if (this._modelBindAll && this.isMounted()) {
        // bind all events if using modelEventAware
        this._modelBindAll();
      }
    }
  });


  /**
   * Simple overrideable mixin to get/set model values.  While this is trivial to do
   * it allows 3rd party to work with stubs which this can override.  This is basically
   * an interface which allows the "modelPopulator" mixin to retrieve values from components
   * that should be set on a model.
   *
   * This allows model value oriented components to work with models without setting the updated
   * values directly on the models until the user performs some specific action (like clicking a save button).
   */
  React.mixins.add('modelValueAware', function(key) {
    return {
      getModelValue: function() {
        var _key = key || getKey(this);
        var model = this.getModel();
        if (model && _key) {
          return model.get(_key);
        }
      },

      setModelValue: function(value, options) {
        var _key = key || getKey(this);
        var model = this.getModel();
            model = this.getModel();
        if (model && _key) {
          return model.set(_key, value, options);
        }
      }
    }
  }, 'modelAware');


  /**
   * Iterate through the provided list of components (or use this.refs if components were not provided) and
   * return a set of attributes.  If a callback is provided as the 2nd parameter and this component includes
   * the "modelAware" mixin, set the attributes on the model and execute the callback if there is no validation error.
   */
  React.mixins.add('modelPopulate', {
    modelPopulate: function(components, callback, options) {
      if (_.isFunction(components)) {
        // allow callback to be provided as first function if using refs
        options = callback;
        callback = components;
        components = undefined;
      }
      var attributes = {};
      if (!components) {
        // if not components were provided, use "refs" (http://facebook.github.io/react/docs/more-about-refs.html)
        components = _.map(this.refs, function(value) {return value;});
      }
      _.each(components, function(component) {
        // the component *must* implement getValue
        if (component.getUIModelValue) {
          var key = getKey(component),
              value = component.getUIModelValue();
          attributes[key] = value;
        }
      });
      if (callback && this.getModel) {
        var model = this.getModel();
        if (model) {
          if (model.set(attributes, options || {validate: true})) {
            callback.call(this, model);
          }
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
   */
  React.mixins.add('modelEventAware', {
    getInitialState: function() {
      return {};
    },

    // model.on
    // ({event, model, callback, context}) or event, callback
    modelOn: function (event, callback) {
      var data = callback ? {event: event, callback: callback} : event;
      onEvent.call(this, 'on', data);
    },

    // model.once
    modelOnce: function (event, callback) {
      var data = callback ? {event: event, callback: callback} : event;
      onEvent.call(this, 'once', data);
    },

    modelOff: function (event, callback) {
      var data = callback ? {event: event, callback: callback} : event,
          modelEvents = this.state.__modelEvents;
      if (modelEvents) {
        // find the existing binding
        var _event;
        for (var i=0; i<modelEvents.length; i++) {
          _event = modelEvents[i];
          if (_event.event === data.event && _event.model === data.model && _event.callback === data.callback) {
            var model = data.model || this.getModel();
            if (model) {
              model.off(data.event, data.callback, data.context || this);
            }
            modelEvents.splice(i, 1);
          }
        }
      }
    },

    // bind all registered events to the model
    _modelBindAll: function() {
      var modelEvents = getState('__modelEvents', this);
      if (modelEvents) {
        var thisModel = this.getModel();
        _.each(modelEvents, function(data) {
          var model = data.model || thisModel;
          if (model) {
            model[data.type](data.event, data.callback, data.context);
          }
        });
      }
    },

    // unbind all registered events from the model
    _modelUnbindAll: function(keepRegisteredEvents) {
      var modelEvents = getState('__modelEvents', this);
      if (modelEvents) {
        var thisModel = this.getModel();
        _.each(modelEvents, function(data) {
          var model = data.model || thisModel;
          if (model) {
            model.off(data.event, data.callback, data.context);
          }
        });
        if (!keepRegisteredEvents) {
          setState({__modelEvents: []}, this);
        }
      }
    },

    componentDidMount: function() {
      // sanity check to prevent duplicate binding
      this._modelUnbindAll(true);
      this._modelBindAll(true);
    },

    componentWillUnmount: function() {
      this._modelUnbindAll(true);
    }
  }, 'modelAware');


  /**
   * Mixin used to force render any time the model has changed
   */
  React.mixins.add('modelChangeAware', {
    getInitialState: function() {
      _.each(['change', 'reset', 'add', 'remove', 'sort'], function(type) {
        this.modelOn(type, function() { this.deferUpdate(); });
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
        setState({loading: true}, this);

        var model = this.getModel();
        events.on('success', function() {
          setState({loading: model[xhrModelLoadingAttribute]}, this);
        }, this);
        events.on('error', function(error) {
          setState({loading: model[xhrModelLoadingAttribute], error: error}, this);
        }, this);
      });

      var model = this.getModel();
      return {loading: model && model[xhrModelLoadingAttribute]};
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
            setState({loading: false}, this);
          });
          if (!state.loading) {
            setState({loading: true}, this);
          }
        } else if (state.loading) {
          setState({loading: false}, this);
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
            setState({invalid: message}, this);
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
          setState({loading: model[xhrModelLoadingAttribute]}, this);
          events.on('complete', function() {
            setState({loading: false}, this);
          }, this);
        });

        // see if we are currently loading something
        var model = this.getModel();
        if (model) {
          var currentLoads = model.loading,
              key;
          if (currentLoads) {
            var clearLoading = function() {
              setState({loading: false}, this);
            }
            for (var i=0; i<currentLoads.length; i++) {
              var keyIndex = keys.indexOf(currentLoads[i].method);
              if (keyIndex >= 0) {
                // there is currently an async event for this key
                key = keys[keyIndex];
                currentLoads[i].on('complete', clearLoading, this);
                return {loading: model[xhrModelLoadingAttribute]};
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
            setState({loading: false}, self);
            if (_callback) {
              _callback.apply(this, arguments);
            }
          }
        }
        wrap('error');
        wrap('success');
        setState({loading: true}, this);
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
      var match = options.key.match(_modelPattern),
          modelKey = match[1] && match[1].substring(1, match[1].length-1),
          model = modelKey && (this.props[modelKey] || this.refs[modelKey]);
      if (!model && modelKey) {
        throw new Error('no model found with "' + modelKey + '"');
      }
      var data = {
        model: model,
        event: options.path,
        callback: callback
      };
      return {
        on: function() {
          this.modelOn(data);
        },
        off: function() { /* NOP, modelOn will clean up */ }
      };
    });

    var specials = React.events.specials;
    if (specials) {
      // add underscore wrapped special event handlers
      function parseArgs(args) {
        var arg;
        for (var i=0; i<args.length; i++) {
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
      var reactEventSpecials = ['memoize', 'delay', 'defer','throttle', 'debounce', 'once'];
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
        mixins: ['modelValueAware'],
        render: function() {
          var props = {};
          var defaultValue = this.getModelValue();
          if (isCheckable) {
            props.defaultChecked = defaultValue;
          } else {
            props.defaultValue = defaultValue;
          }
          return React.DOM[type](_.extend(props, attributes, this.props), this.props.children);
        },
        getUIModelValue: function() {
          if (this.isMounted()) {
            if (isCheckable) {
              var el = this.getDOMNode();
              if (el.checked) {
                return el.value || true;
              }
            } else {
              return $(this.getDOMNode()).val();
            }
          }
        }
      }, classAttributes));
  };

  Backbone.input = Backbone.input || {};
  _.defaults(Backbone.input, {
    Text: _inputClass('input', {type: 'text'}),
    TextArea: _inputClass('textarea'),
    Select: _inputClass('select', undefined, undefined),
    CheckBox: _inputClass('input', {type: 'checkbox'}, true),
    RadioGroup: React.createClass({
      mixins: ['modelValueAware'],
      render: function() {
        var props = this.props;
        return React.DOM[props.tag || 'span'](props, props.children);
      },
      componentDidMount: function() {
        // select the appropriate radio button
        var value = this.getModelValue();
        if (value) {
          var selector = 'input[value="' + value.replace('"', '\\"') + '"]';
          var el = $(this.getDOMNode()).find(selector);
          el.attr('checked', 'checked');
        }
      },
      getUIModelValue: function() {
        if (this.isMounted()) {
          var selector = 'input[type="radio"]';
          var els = $(this.getDOMNode()).find(selector);
          for (var i=0; i<els.length; i++) {
            if (els[i].checked) {
              return els[i].value;
            }
          }
        }
      }
    })
  });
});
