/*!
 * https://github.com/jhudson8/react-backbone v0.24.1;  MIT license; Joe Hudson<joehud_AT_gmail.com>
 */
!function(e){"function"==typeof define&&define.amd?define([],function(){return e}):"undefined"!=typeof exports&&"undefined"!=typeof require?module.exports=e:e(React,Backbone,_)}(function(e,t,n){function i(){var t=n.toArray(arguments);n.isString(t)?t[0]=b+t[0]:t.name=b+t.name,e.mixins.add.apply(e.mixins,t)}function o(e){return e.getModel?e.getModel():void 0}function r(e,t,n,i){return"collection"===e?t.getCollection(n,i):t.getModel(n,i)}function a(e){return e?n.isArray(e)?e:[e]:void 0}function s(e,t,n){return function(){return n?n:r(e,t)}}function u(e){return e.getModelKey?e.getModelKey():e.props.name||e.props.key||e.props.ref}function c(e,t){if(t&&t.modelIndexErrors)return t.modelIndexErrors(e);if(Array.isArray(e)){var i={};return n.each(e,function(e){for(var t in e)e.hasOwnProperty(t)&&(i[t]=e[t])}),i}return e}function l(e,t){var n=o(e);if(n){var i=u(e);return t(i,n)}}function d(e,t,i,o,r){var s,u,c=Array.isArray(t)?t:a(i.props[t]);if(c){for(var l=0;l<c.length;l++)s=c[l],u=o.replace("{key}",s),i[e+"On"](u,n.bind(r,i),this);return c}}function f(e,t,n,i,o){function a(e){i["on"===t?"listenTo":"listenToOnce"](e,u,c,l)}var s=h(e,i),u=n[0],c=n[1],l=n[2];s[u]={type:t,ev:u,cb:c,ctx:l},s.__bound&&(o?a(o):r(e,i,a))}function p(e){function t(e,t){s&&e&&(o.trigger(i+":unbind",t),n.each(a,function(t){this.stopListening(e,t.ev,t.cb,t.ctx)},o)),t&&(o.trigger(i+":bind",t),n.each(a,function(e){f(i,e.type,[e.ev,e.cb,e.ctx],this,t)},o))}var i=e.type,o=e.context,a=h(i,o),s=a.__bound;a.__bound=!0,r(i,o,function(e,n){var o=this.props[n];t(o,e),o!==e&&o&&this.trigger(i+":set",e,n,o)},e.props||o.props)}function h(e,t){var n="__"+e+"Events",i=w(n,t);if(!i){i={};var o={};o[n]=i,I(o,t)}return i}function v(e,t,i){var o=w("loading",i),r=o&&o.length;o||(o=[]),n.isArray(o)&&(o.push(e),r||I({loading:o},i),e.on("complete",function(){g(e,t,i)}))}function g(e,t,i){var o=w("loading",i);if(n.isArray(o)){for(var r=o.indexOf(e);r>=0;)o.splice(r,1),r=o.indexOf(e);o.length||I({loading:!1},i)}}function y(e,t,i){var o=t[E];o&&n.each(o,function(n){e&&n.method!==e||v(n,t,i)})}function m(e){return e.getDOMNode()}function x(e){return m(e).value}function M(e,t,n,i){for(var o=e.getDOMNode(),r=o.getElementsByTagName(t),a=[],s=0;s<r.length;s++)r[s][n]===i&&a.push(r[s]);return a}function O(e){var t=e.props,i=t.bind;if(i&&"false"!==i){var o=n.isString(i)||i===!0?{twoWayBinding:!0}:i;return function(t){var i=e.getModel(),r=u(e),a={};if(a[r]=e.getValue(),i&&r)if(o.validateField){var s=i.validate(a,o);s?i.trigger("invalid",i,s,n.extend(o,{validationError:s})):i.set(a,o)}else i.set(a,o);e.props.onChange&&e.props.onChange(t)}}return t.onChange}var b="react-backbone.",A=t.xhrEventName,E=t.xhrModelLoadingAttribute,w=e.mixins.getState,I=e.mixins.setState,S=e.reactBackboneDebugWarnings;n.isUndefined(S)&&(S=!0),e.events.mixin=e.events.mixin||t.Events,e.mixins.getModelKey=u,e.mixins.modelIndexErrors=c,t.input=t.input||{};var k=t.input.getModelValue=function(e){return l(e,function(e,t){return t.get(e)})};t.input.setModelValue=function(e,t,n){return l(e,function(e,i){return i.set(e,t,n)})},n.each([{type:"model",defaultParams:[["model"]],capType:"Model",changeEvents:["change"],cachedKey:"__cachedModels"},{type:"collection",defaultParams:[["collection"]],capType:"Collection",changeEvents:["add","remove","reset","sort"],cachedKey:"__cachedCollections"}],function(o){var a="get"+o.capType,u=function(e){var t={getInitialState:function(){return{}},componentWillReceiveProps:function(){this.state[o.cachedKey]=void 0}};return t[a]=function(t,i){var r=!i&&this.state&&this.state[o.cachedKey];if(!r){r={};var a=e,s=!!i;i=i||this.props,a&&0!==a.length||(a=o.defaultParams);for(var u,c=0;c<a.length;c++){u=a[c];for(var l=0;l<u.length;l++){var d=u[l],f=w(d,this)||i[d];f?r[d]=f:s&&t&&d&&t.call(this,void 0,d)}}!s&&this.state&&(this.state[o.cachedKey]=r)}var p;return n.each(r,function(e,n){p=p||e,t&&t.call(this,e,n)},this),p},t};i({name:o.type+"Aware",initiatedOnce:!0},u,"state");var c={getInitialState:function(){return r(o.type,this,function(e,t){(S&&!e.off||!e.on)&&(console.error("props."+t+" does not implement on/off functions - you will see event binding problems (object logged to console below)"),console.log(e))}),null},componentWillReceiveProps:function(e){p({context:this,props:e,type:o.type})},componentDidMount:function(){p({context:this,type:o.type})}};c[o.type+"On"]=function(){f(o.type,"on",arguments,this)},c[o.type+"Once"]=function(){f(o.type,"once",arguments,this)},c[o.type+"Off"]=function(e,t,n,i){var r=h(o.type,this);delete r[e],this.stopListening(s(o.type,this,i),e,t,n)},i(o.type+"Events",c,o.type+"Aware","listen","events");var l={getInitialState:function(){n.each(o.changeEvents,function(e){this[o.type+"On"](e,function(e,t){t&&t.twoWayBinding||this.deferUpdate()},this)},this)}};i(o.type+"ChangeAware",l,o.type+"Events","listen","events","deferUpdate");var g={getInitialState:function(){function e(e){e.whenFetched(function(){})}this.on(o.type+":bind",e),this["get"+o.capType](e)}};i(o.type+"Fetch",g,o.type+"Events");var m={getInitialState:function(e,n){function i(e){r(o.type,n,function(t){v(e,t,n)})}return e?d(o.type,e,n,A+":{key}",i):n[o.type+"On"](A,function(e){"collection"===o.type&&e.model instanceof t.Model||i(e)}),null},componentDidMount:function(e,t){function i(i){if(e){var o=n.isArray(e)?e:t.props[e];if(!o)return;n.isArray(o)||(o=[o]),n.each(o,function(e){y(e,i,t)})}else y(e,i,t)}r(o.type,t,function(e){i(e)}),t.on(o.type+":set",function(e){i(e)})}},x={getInitialState:function(){return m.getInitialState(void 0,this)},componentDidMount:function(){return m.componentDidMount(void 0,this)}};i(o.type+"XHRAware",x,o.type+"Events");var M=function(){var e=arguments.length>0?Array.prototype.slice.call(arguments,0):void 0;return{getInitialState:function(){return m.getInitialState(e||"loadOn",this)},componentDidMount:function(){return m.componentDidMount(e||"loadOn",this)}}};i(o.type+"LoadOn",M,o.type+"Events");var O=function(){var e=arguments.length>0?Array.prototype.slice.call(arguments,0):void 0;return{getInitialState:function(){d(o.type,e||"updateOn",this,"{key}",function(){this.deferUpdate()})}}};i(o.type+"UpdateOn",O,o.type+"Events","deferUpdate");var b=new RegExp("^"+o.type+"(\\[.+\\])?$");e.events.handle(b,function(e,t){return{on:function(){if(!this[o.type+"On"])throw new Error("use the "+o.type+' "Events" mixin instead of "events"');this[o.type+"On"](e.path,t)},off:function(){}}})}),n.each(["XHRAware","ChangeAware","LoadOn","UpdateOn"],function(t){e.mixins.alias("backbone"+t,"model"+t,"collection"+t)}),i("modelPopulate",{modelPopulate:function(){var e,i,r,a,s;n.each(arguments,function(o){o instanceof t.Model?a=o:n.isBoolean(o)?(s=!0,a=!1):n.isArray(o)?e=o:n.isFunction(o)?i=o:r=o}),n.isUndefined(a)&&(a=o(this));var c={};return e||(e=n.map(this.refs,function(e){return e})),n.each(e,function(e){if(e.getValue){var t=u(e);if(t){var i=e.getValue();c[t]=i}}else if(e.modelPopulate&&e.getModels){if(!a&&!s)return;var l=o(e),d=a||r&&r.populateModel;if(l===d){var f=e.modelPopulate(n.extend({populateModel:d},r),!0);n.defaults(c,f)}}}),a&&(a.set(c,{validate:!0})?i&&i.call(this,a):r&&r.onInvalid&&r.onInvalid.call(this,c)),c}},"modelAware"),i("loadWhile",{loadWhile:function(e){function t(t){var i=e[t];e[t]=function(){I({loading:!1},n),i&&i.apply(this,arguments)}}e=e||{};var n=this;return t("error"),t("success"),I({loading:!0},this),e}}),i("modelValidator",{modelValidate:function(e,t){var n=o(this);return n&&n.validate?c(n.validate(e,t),this)||!1:void 0}},"modelAware"),i("modelInvalidAware",{getInitialState:function(){var e=u(this);return e&&(this.modelOn("invalid",function(t,n){var i=c(n,this)||{},o=i&&i[e];o&&I({invalid:o},this)}),this.modelOn("change:"+e,function(){I({invalid:void 0},this)})),null}},"modelEvents");var D=e.events.specials;if(D){var C=["memoize","delay","defer","throttle","debounce","once","after","before"];n.each(C,function(e){D[e]=D[e]||function(t,i){return i.splice(0,0,t),n[e].apply(n,i)}})}var _=function(t,i,o,r){return e.createClass(n.extend({mixins:["modelAware"],render:function(){var r={},a=k(this);return o?r.defaultChecked=a:r.defaultValue=a,e.DOM[t](n.extend(r,i,this.props,{onChange:O(this)}),this.props.children)},getValue:function(){if(this.isMounted()){if(o){var e=this.getDOMNode();return e.checked&&(e.value||!0)||!1}return x(this)}},getDOMValue:function(){return this.isMounted()?x(this):void 0}},r))};t.input=t.input||{},n.defaults(t.input,{Text:_("input",{type:"text"}),TextArea:_("textarea"),Select:_("select",void 0,void 0),CheckBox:_("input",{type:"checkbox"},!0),RadioGroup:e.createClass({mixins:["modelAware"],render:function(){var t=n.clone(this.props);return t.ref="input",e.DOM[t.tag||"span"](t,t.children)},componentDidMount:function(){var e=k(this);if(e){var t=M(this,"input","value",e.replace('"','\\"'))[0];t&&(t.checked="checked")}this.state||(this.state={});var n=this.state.changeHandler=O(this);n&&m(this).addEventListener("change",n)},componentWillUnmount:function(){var e=this.state&&this.state.changeHandler;e&&m(this).removeEventListener("change",e)},getValue:function(){if(this.isMounted())for(var e=M(this,"input","type","radio"),t=0;t<e.length;t++)if(e[t].checked)return e[t].value},getDOMValue:function(){return this.isMounted()?x(this):void 0}})})});