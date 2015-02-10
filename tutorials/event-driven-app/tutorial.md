This is a simple progressive tutorial to get familiar with some of react-backbone event handling capabilities.


### Running the examples
The source code can be found for each step in this tutorial in the [current directory](./).  To run each example, download the code and ```cd``` into an individual step and run

```
  npm install
  webpack-dev-server
```

then browse to [http://localhost:8080](http://localhost:8080)


### Step 1: baseline

As a baseline, we'll create a small app that has no react-backbone integration.  This app renders 2 components that are decoupled but communicate by firing events on a global event bus.  One of the components also listens for events on a child component that it renders out.

[view source](./step1/example.js)


### Step 2: Use managed events for the child

[view source](./step2/example.js)

Parent-child events are supported out of the box.  You simply need to use the [events mixin](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone/bundle/jhudson8/react-events/package/events?focus=outline) and add an ```events``` object.  In this case, we are using the [ref event handler](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone/bundle/jhudson8/react-events/package/component%20by%20ref%20events?focus=outline) so we need to make sure the child component has the ```child``` [ref property](http://facebook.github.io/react/docs/more-about-refs.html) (if the event key was ```ref:foo:clicked```, the child component would need the ```foo``` ref).

```
    var ComponentA = React.createClass({
      mixins: ['events'],

      events: {
        'ref:child:clicked': 'onChildClicked'
      },
```

And remove the current child view binding code that we have

```
    this.refs.child.on('clicked', this.onChildClicked);
```

The event will now be managed and, if the child component with the "child" ref changes after a render, the events will be re-bound to the new component.


### Step 3: Use triggerWith to apply scoped parameters

[view source](./step3/example.js)

The [events mixin](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone/bundle/jhudson8/react-events/package/events?focus=outline) exposes a handy helper function called [triggerWith](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone/bundle/jhudson8/react-events/method/events/triggerWith?focus=outline).  This provides a convienant way to apply scoped variables to a triggered event.

Include the ```events``` mixin for ```ComponentB```

```
var ComponentB = React.createClass({
  mixins: ['events'],
```

Remove the scoped trigger function in ```ComponentB```

```
    // remove this
    var eventParam = 'foo';
    var self = this;
    var triggerEvent = function() {
      self.triggerGlobalEvent(eventParam);
    };
```

We have no need for the ```triggerEvent``` method on ```ComponentB``` so remove that

```
    // remove this
    triggerEvent: function(eventParam) {
      this.trigger('clicked', eventParam);
    }
```

Use triggerWith to trigger the event and provide a scoped parameter in the render method of ```ComponentB```

```
    <button type="button" onClick={this.triggerWith('clicked', 'foo')}>click me: Component1Child</button>
```


The ```events mixin``` will also provide implementations of ```on```, ```once```, ```off``` and ```trigger``` so remove the following code from ```Component1Child```

```
    // remove this
    trigger: function() {
      return Backbone.Events.trigger.apply(this.state, arguments);
    },
    on: function() {
      return Backbone.Events.on.apply(this.state, arguments);
    },
    off: function() {
      return Backbone.Events.off.apply(this.state, arguments);
    },
```


### Step 4: Create a custom global managed event

[view source](./step3/example.js)

We can enhance what is available in the ```events object``` using [React.events.handle](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone/bundle/jhudson8/react-events/method/React.events/handle?focus=outline).  We will create a handler to trigger global event bus methods so we can use "app:{event name}" shorthand in our ```events object```.

Register the [custom event handler](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone/bundle/jhudson8/react-events/package/application%20events?focus=outline)

```
    React.events.handle('app', {
      target: EventBus
    });
```

Include the event bus reference in ```ComponentA```

```
    events: {
      'ref:child:clicked': 'onChildClicked',
      'app:b:clicked': 'onComponentBClicked'
    },
```

We don't need our EventBus binding anymore in ```ComponentA``` so remove that

```
    // remove this
    componentDidMount: function() {
      // bind to the event bus to call our method onComponentBClicked when the global event "b:clicked" is triggered
      EventBus.on('b:clicked', this.onComponentBClicked);
    },
    componentWillUnmount: function() {
      EventBus.off('b:clicked', this.onComponentBClicked);
    },
```

Just to show what else we can do, you can also use functions as the events hash values.  So, we'll change the events hash for ```ComponentA```

```
    events: {
      'ref:child:clicked': function(eventParam) {
        alert('child was clicked; the event param is "' + eventParam + '"');
      },
      'app:b:clicked': 'onComponentBClicked'
    },
```

And remove the ```onChildClicked``` function in ```ComponentA```

```
    // remove this
    onChildClicked: function(eventParam) {
      alert('child was clicked; the event param is "' + eventParam + '"');
    }
```

Now the code is clean and simple!


## All done
All done but there is so much more you can do.  Check out some of the [other provided event handler types](http://jhudson8.github.io/fancydocs/index.html#project/jhudson8/react-backbone/bundle/jhudson8/react-events/api/Event%20Binding%20Definitions?focus=outline) to see what else you can do.