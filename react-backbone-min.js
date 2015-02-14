/*!
 * https://github.com/jhudson8/react-backbone v0.19.0;  MIT license; Joe Hudson<joehud_AT_gmail.com>
 */
!function(e){"function"==typeof define&&define.amd?define([],function(){return e}):"undefined"!=typeof exports&&"undefined"!=typeof require?module.exports=e:e(React,Backbone,_,$)}(function(e,t,n,i){function o(){var t=n.toArray(arguments);n.isString(t)?t[0]=x+t[0]:t.name=x+t.name,e.mixins.add.apply(e.mixins,t)}function r(e){return e.getModel?e.getModel():void 0}function a(e,t,n,i){return"collection"===e?t.getCollection(n,i):t.getModel(n,i)}function u(e){return e?n.isArray(e)?e:[e]:void 0}function s(e,t,n){return function(){return n?n:a(e,t)}}function c(e){return e.getModelKey?e.getModelKey():e.props.name||e.props.key||e.props.ref}function l(e,t){if(t&&t.modelIndexErrors)return t.modelIndexErrors(e);if(Array.isArray(e)){var i={};return n.each(e,function(e){for(var t in e)e.hasOwnProperty(t)&&(i[t]=e[t])}),i}return e}function f(e,t){var n=r(e);if(n){var i=c(e);return t(i,n)}}function d(e,t,i,o,r){var a,s,c=Array.isArray(t)?t:u(i.props[t]);if(c){for(var l=0;l<c.length;l++)a=c[l],s=o.replace("{key}",a),i[e+"On"](s,n.bind(r,i),this);return c}}function p(e,t,n,i,o){function r(e){i["on"===t?"listenTo":"listenToOnce"](e,s,c,l)}var u=v(e,i),s=n[0],c=n[1],l=n[2];u[s]={type:t,ev:s,cb:c,ctx:l},o?r(o):a(e,i,r)}function h(e,t,i,o){if(t!==i){var r=v(e,o);t&&n.each(r,function(e){this.stopListening(t,e.ev,e.cb,e.ctx)},o),i&&n.each(r,function(t){p(e,t.type,[t.ev,t.cb,t.ctx],this,i)},o)}}function v(e,t){var n="__"+e+"Events",i=b(n,t);if(!i){i={};var o={};o[n]=i,w(o,t)}return i}function g(e,t,i){var o=b("loading",i);o||(o=[]),n.isArray(o)&&(o.push(e),w({loading:o},i),e.on("complete",function(){y(e,t,i)}))}function y(e,t,i){var o=b("loading",i);if(n.isArray(o)){for(var r=o.indexOf(e);r>=0;)o.splice(r,1),r=o.indexOf(e);o.length||w({loading:!1},i)}}function m(e,t,i){var o=t[A];o&&n.each(o,function(n){e&&n.method!==e||g(n,t,i)})}function M(e){var t=e.props,i=t.bind;if(i&&"false"!==i){var o=n.isString(i)||i===!0?{twoWayBinding:!0}:i;return function(t){var i=e.getModel(),r=c(e),a={};if(a[r]=e.getValue(),i&&r)if(o.validateField){var u=i.validate(a,o);u?i.trigger("invalid",i,u,n.extend(o,{validationError:u})):i.set(a,o)}else i.set(a,o);e.props.onChange&&e.props.onChange(t)}}return t.onChange}var x="react-backbone.",O=t.xhrEventName,A=t.xhrModelLoadingAttribute,b=e.mixins.getState,w=e.mixins.setState,E=e.reactBackboneDebugWarnings;n.isUndefined(E)&&(E=!0),e.events.mixin=e.events.mixin||t.Events,e.mixins.getModelKey=c,e.mixins.modelIndexErrors=l,t.input=t.input||{};var k=t.input.getModelValue=function(e){return f(e,function(e,t){return t.get(e)})};t.input.setModelValue=function(e,t,n){return f(e,function(e,i){return i.set(e,t,n)})},n.each([{type:"model",defaultParams:[["model"]],capType:"Model",changeEvents:["change"]},{type:"collection",defaultParams:[["collection"]],capType:"Collection",changeEvents:["add","remove","reset","sort"]}],function(t){var i="get"+t.capType,r=function(e){var n={};return n[i]=function(n,i){var o=e,r=!!i;i=i||this.props,o&&0!==o.length||(o=t.defaultParams);for(var a,u,s,c=0;c<o.length;c++){u=o[c];for(var l=0;l<u.length;l++){var f=u[l];if(s=b(f,this)||i[f]){if(a=a||s,!n)return s;n.call(this,s,f)}else r&&n&&n.call(this,void 0,f)}}return a},n["set"+t.capType]=function(e,n){n=n||t.type;var i,o={};this.getModel(function(e,t){t===n&&(i=e)}),h(t.type,i,e,this),o[n]=e},n};o({name:t.type+"Aware",initiatedOnce:!0},r,"state");var u={getInitialState:function(){return a(t.type,this,function(e,t){(E&&!e.off||!e.on)&&(console.error("props."+t+" does not implement on/off functions - you will see event binding problems (object logged to console below)"),console.log(e))}),{}},componentWillReceiveProps:function(e){a(t.type,this,function(e,n){var i=this.props[n];h(t.type,i,e,this)},e)}};u[t.type+"On"]=function(){p(t.type,"on",arguments,this)},u[t.type+"Once"]=function(){p(t.type,"once",arguments,this)},u[t.type+"Off"]=function(e,n,i,o){var r=v(t.type,this);delete r[e],this.stopListening(s(t.type,this,o),e,n,i)},o(t.type+"Events",u,t.type+"Aware","listen","events");var c={getInitialState:function(){n.each(t.changeEvents,function(e){this[t.type+"On"](e,function(e,t){t&&t.twoWayBinding||this.deferUpdate()},this)},this)}};o(t.type+"ChangeAware",c,t.type+"Events","listen","events","deferUpdate");var l={getInitialState:function(e,n){function i(e){a(t.type,n,function(t){g(e,t,n)})}return e?d(t.type,e,n,O+":{key}",i):n[t.type+"On"](O,function(e,t){i(t)}),{}},componentWillMount:function(e,i){a(t.type,i,function(t){if(e){var o=n.isArray(e)?e:i.props[e];if(!o)return;n.isArray(o)||(o=[o]),n.each(o,function(e){m(e,t,i)})}else m(e,t,i)})}},f={getInitialState:function(){return l.getInitialState(void 0,this)},componentWillMount:function(){return l.componentWillMount(void 0,this)}};o(t.type+"XHRAware",f,t.type+"Events");var y=function(){var e=arguments.length>0?Array.prototype.slice.call(arguments,0):void 0;return{getInitialState:function(){return l.getInitialState(e||"loadOn",this)},componentWillMount:function(){return l.componentWillMount(e||"loadOn",this)}}};o(t.type+"LoadOn",y,t.type+"Events");var M=function(){var e=arguments.length>0?Array.prototype.slice.call(arguments,0):void 0;return{getInitialState:function(){d(t.type,e||"updateOn",this,"{key}",function(){this.deferUpdate()})}}};o(t.type+"UpdateOn",M,t.type+"Events","deferUpdate");var x=new RegExp("^"+t.type+"(\\[.+\\])?$");e.events.handle(x,function(e,n){return{on:function(){if(!this[t.type+"On"])throw new Error("use the "+t.type+' "Events" mixin instead of "events"');this[t.type+"On"](e.path,n)},off:function(){}}})}),n.each(["XHRAware","ChangeAware","LoadOn","UpdateOn"],function(t){e.mixins.alias("backbone"+t,"model"+t,"collection"+t)}),o("modelPopulate",{modelPopulate:function(){var e,i,o,a,u;n.each(arguments,function(r){r instanceof t.Model?a=r:n.isBoolean(r)?(u=!0,a=!1):n.isArray(r)?e=r:n.isFunction(r)?i=r:o=r}),n.isUndefined(a)&&(a=r(this));var s={};return e||(e=n.map(this.refs,function(e){return e})),n.each(e,function(e){if(e.getValue){var t=c(e);if(t){var i=e.getValue();s[t]=i}}else if(e.modelPopulate&&e.getModels){if(!a&&!u)return;var l=r(e),f=a||o&&o.populateModel;if(l===f){var d=e.modelPopulate(n.extend({populateModel:f},o),!0);n.defaults(s,d)}}}),a&&a.set(s,{validate:!0})&&i&&i.call(this,a),s}},"modelAware"),o("loadWhile",{loadWhile:function(e){function t(t){var i=e[t];e[t]=function(){w({loading:!1},n),i&&i.apply(this,arguments)}}e=e||{};var n=this;return t("error"),t("success"),w({loading:!0},this),e}}),o("modelValidator",{modelValidate:function(e,t){var n=r(this);return n&&n.validate?l(n.validate(e,t),this)||!1:void 0}},"modelAware"),o("modelInvalidAware",{getInitialState:function(){var e=c(this);return e&&(this.modelOn("invalid",function(t,n){var i=l(n,this)||{},o=i&&i[e];o&&w({invalid:o},this)}),this.modelOn("change:"+e,function(){w({invalid:void 0},this)})),{}}},"modelEvents");var D=e.events.specials;if(D){var S=["memoize","delay","defer","throttle","debounce","once","after","before"];n.each(S,function(e){D[e]=D[e]||function(t,i){return i.splice(0,0,t),n[e].apply(n,i)}})}var I=function(t,o,r,a){return e.createClass(n.extend({mixins:["modelAware"],render:function(){var i={},a=k(this);return r?i.defaultChecked=a:i.defaultValue=a,e.DOM[t](n.extend(i,o,this.props,{onChange:M(this)}),this.props.children)},getValue:function(){if(this.isMounted()){if(r){var e=this.getDOMNode();return e.checked&&(e.value||!0)||!1}return i(this.getDOMNode()).val()}},getDOMValue:function(){return this.isMounted()?i(this.getDOMNode()).val():void 0}},a))};t.input=t.input||{},n.defaults(t.input,{Text:I("input",{type:"text"}),TextArea:I("textarea"),Select:I("select",void 0,void 0),CheckBox:I("input",{type:"checkbox"},!0),RadioGroup:e.createClass({mixins:["modelAware"],render:function(){var t=n.clone(this.props);return t.ref="input",e.DOM[t.tag||"span"](t,t.children)},componentDidMount:function(){var e=k(this);if(e){var t='input[value="'+e.replace('"','\\"')+'"]',n=i(this.getDOMNode()).find(t);n.attr("checked","checked")}this.state||(this.state={});var o=this.state.changeHandler=M(this);o&&i(this.getDOMNode()).on("change","input",o)},componentWillUnmount:function(){var e=this.state&&this.state.changeHandler;e&&i(this.getDOMNode()).off("change",e)},getValue:function(){if(this.isMounted())for(var e='input[type="radio"]',t=i(this.getDOMNode()).find(e),n=0;n<t.length;n++)if(t[n].checked)return t[n].value},getDOMValue:function(){return this.isMounted()?i(this.getDOMNode()).val():void 0}})})});