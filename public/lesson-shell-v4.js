/* ═══════════════════════════════════════════════════════════════
   BUNDLED DEPENDENCY (do not edit): interact.js 1.10.27 (MIT licence)
   Bundled into lesson-shell-v4.js per INTERACTION_ENGINE spec §3
   — offline drag/drop, no CDN. Exposes global `interact` on window.
   Source: npm interactjs@1.10.27 → dist/interact.min.js
   ═══════════════════════════════════════════════════════════════ */
/* interact.js 1.10.27 | https://raw.github.com/taye/interact.js/main/LICENSE */

!function(t,e){"object"==typeof exports&&"undefined"!=typeof module?module.exports=e():"function"==typeof define&&define.amd?define(e):(t="undefined"!=typeof globalThis?globalThis:t||self).interact=e()}(this,(function(){"use strict";function t(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function e(e){for(var n=1;n<arguments.length;n++){var r=null!=arguments[n]?arguments[n]:{};n%2?t(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):t(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function n(t){return n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},n(t)}function r(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}function i(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,d(r.key),r)}}function o(t,e,n){return e&&i(t.prototype,e),n&&i(t,n),Object.defineProperty(t,"prototype",{writable:!1}),t}function a(t,e,n){return(e=d(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function s(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),Object.defineProperty(t,"prototype",{writable:!1}),e&&l(t,e)}function c(t){return c=Object.setPrototypeOf?Object.getPrototypeOf.bind():function(t){return t.__proto__||Object.getPrototypeOf(t)},c(t)}function l(t,e){return l=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},l(t,e)}function u(t){if(void 0===t)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return t}function p(t){var e=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(t){return!1}}();return function(){var n,r=c(t);if(e){var i=c(this).constructor;n=Reflect.construct(r,arguments,i)}else n=r.apply(this,arguments);return function(t,e){if(e&&("object"==typeof e||"function"==typeof e))return e;if(void 0!==e)throw new TypeError("Derived constructors may only return object or undefined");return u(t)}(this,n)}}function f(){return f="undefined"!=typeof Reflect&&Reflect.get?Reflect.get.bind():function(t,e,n){var r=function(t,e){for(;!Object.prototype.hasOwnProperty.call(t,e)&&null!==(t=c(t)););return t}(t,e);if(r){var i=Object.getOwnPropertyDescriptor(r,e);return i.get?i.get.call(arguments.length<3?t:n):i.value}},f.apply(this,arguments)}function d(t){var e=function(t,e){if("object"!=typeof t||null===t)return t;var n=t[Symbol.toPrimitive];if(void 0!==n){var r=n.call(t,e||"default");if("object"!=typeof r)return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==typeof e?e:e+""}var h=function(t){return!(!t||!t.Window)&&t instanceof t.Window},v=void 0,g=void 0;function m(t){v=t;var e=t.document.createTextNode("");e.ownerDocument!==t.document&&"function"==typeof t.wrap&&t.wrap(e)===e&&(t=t.wrap(t)),g=t}function y(t){return h(t)?t:(t.ownerDocument||t).defaultView||g.window}"undefined"!=typeof window&&window&&m(window);var b=function(t){return!!t&&"object"===n(t)},x=function(t){return"function"==typeof t},w={window:function(t){return t===g||h(t)},docFrag:function(t){return b(t)&&11===t.nodeType},object:b,func:x,number:function(t){return"number"==typeof t},bool:function(t){return"boolean"==typeof t},string:function(t){return"string"==typeof t},element:function(t){if(!t||"object"!==n(t))return!1;var e=y(t)||g;return/object|function/.test("undefined"==typeof Element?"undefined":n(Element))?t instanceof Element||t instanceof e.Element:1===t.nodeType&&"string"==typeof t.nodeName},plainObject:function(t){return b(t)&&!!t.constructor&&/function Object\b/.test(t.constructor.toString())},array:function(t){return b(t)&&void 0!==t.length&&x(t.splice)}};function E(t){var e=t.interaction;if("drag"===e.prepared.name){var n=e.prepared.axis;"x"===n?(e.coords.cur.page.y=e.coords.start.page.y,e.coords.cur.client.y=e.coords.start.client.y,e.coords.velocity.client.y=0,e.coords.velocity.page.y=0):"y"===n&&(e.coords.cur.page.x=e.coords.start.page.x,e.coords.cur.client.x=e.coords.start.client.x,e.coords.velocity.client.x=0,e.coords.velocity.page.x=0)}}function T(t){var e=t.iEvent,n=t.interaction;if("drag"===n.prepared.name){var r=n.prepared.axis;if("x"===r||"y"===r){var i="x"===r?"y":"x";e.page[i]=n.coords.start.page[i],e.client[i]=n.coords.start.client[i],e.delta[i]=0}}}var S={id:"actions/drag",install:function(t){var e=t.actions,n=t.Interactable,r=t.defaults;n.prototype.draggable=S.draggable,e.map.drag=S,e.methodDict.drag="draggable",r.actions.drag=S.defaults},listeners:{"interactions:before-action-move":E,"interactions:action-resume":E,"interactions:action-move":T,"auto-start:check":function(t){var e=t.interaction,n=t.interactable,r=t.buttons,i=n.options.drag;if(i&&i.enabled&&(!e.pointerIsDown||!/mouse|pointer/.test(e.pointerType)||0!=(r&n.options.drag.mouseButtons)))return t.action={name:"drag",axis:"start"===i.lockAxis?i.startAxis:i.lockAxis},!1}},draggable:function(t){return w.object(t)?(this.options.drag.enabled=!1!==t.enabled,this.setPerAction("drag",t),this.setOnEvents("drag",t),/^(xy|x|y|start)$/.test(t.lockAxis)&&(this.options.drag.lockAxis=t.lockAxis),/^(xy|x|y)$/.test(t.startAxis)&&(this.options.drag.startAxis=t.startAxis),this):w.bool(t)?(this.options.drag.enabled=t,this):this.options.drag},beforeMove:E,move:T,defaults:{startAxis:"xy",lockAxis:"xy"},getCursor:function(){return"move"},filterEventType:function(t){return 0===t.search("drag")}},_=S,P={init:function(t){var e=t;P.document=e.document,P.DocumentFragment=e.DocumentFragment||O,P.SVGElement=e.SVGElement||O,P.SVGSVGElement=e.SVGSVGElement||O,P.SVGElementInstance=e.SVGElementInstance||O,P.Element=e.Element||O,P.HTMLElement=e.HTMLElement||P.Element,P.Event=e.Event,P.Touch=e.Touch||O,P.PointerEvent=e.PointerEvent||e.MSPointerEvent},document:null,DocumentFragment:null,SVGElement:null,SVGSVGElement:null,SVGElementInstance:null,Element:null,HTMLElement:null,Event:null,Touch:null,PointerEvent:null};function O(){}var k=P;var D={init:function(t){var e=k.Element,n=t.navigator||{};D.supportsTouch="ontouchstart"in t||w.func(t.DocumentTouch)&&k.document instanceof t.DocumentTouch,D.supportsPointerEvent=!1!==n.pointerEnabled&&!!k.PointerEvent,D.isIOS=/iP(hone|od|ad)/.test(n.platform),D.isIOS7=/iP(hone|od|ad)/.test(n.platform)&&/OS 7[^\d]/.test(n.appVersion),D.isIe9=/MSIE 9/.test(n.userAgent),D.isOperaMobile="Opera"===n.appName&&D.supportsTouch&&/Presto/.test(n.userAgent),D.prefixedMatchesSelector="matches"in e.prototype?"matches":"webkitMatchesSelector"in e.prototype?"webkitMatchesSelector":"mozMatchesSelector"in e.prototype?"mozMatchesSelector":"oMatchesSelector"in e.prototype?"oMatchesSelector":"msMatchesSelector",D.pEventTypes=D.supportsPointerEvent?k.PointerEvent===t.MSPointerEvent?{up:"MSPointerUp",down:"MSPointerDown",over:"mouseover",out:"mouseout",move:"MSPointerMove",cancel:"MSPointerCancel"}:{up:"pointerup",down:"pointerdown",over:"pointerover",out:"pointerout",move:"pointermove",cancel:"pointercancel"}:null,D.wheelEvent=k.document&&"onmousewheel"in k.document?"mousewheel":"wheel"},supportsTouch:null,supportsPointerEvent:null,isIOS7:null,isIOS:null,isIe9:null,isOperaMobile:null,prefixedMatchesSelector:null,pEventTypes:null,wheelEvent:null};var I=D;function M(t,e){if(t.contains)return t.contains(e);for(;e;){if(e===t)return!0;e=e.parentNode}return!1}function z(t,e){for(;w.element(t);){if(R(t,e))return t;t=A(t)}return null}function A(t){var e=t.parentNode;if(w.docFrag(e)){for(;(e=e.host)&&w.docFrag(e););return e}return e}function R(t,e){return g!==v&&(e=e.replace(/\/deep\//g," ")),t[I.prefixedMatchesSelector](e)}var C=function(t){return t.parentNode||t.host};function j(t,e){for(var n,r=[],i=t;(n=C(i))&&i!==e&&n!==i.ownerDocument;)r.unshift(i),i=n;return r}function F(t,e,n){for(;w.element(t);){if(R(t,e))return!0;if((t=A(t))===n)return R(t,e)}return!1}function X(t){return t.correspondingUseElement||t}function Y(t){var e=t instanceof k.SVGElement?t.getBoundingClientRect():t.getClientRects()[0];return e&&{left:e.left,right:e.right,top:e.top,bottom:e.bottom,width:e.width||e.right-e.left,height:e.height||e.bottom-e.top}}function L(t){var e,n=Y(t);if(!I.isIOS7&&n){var r={x:(e=(e=y(t))||g).scrollX||e.document.documentElement.scrollLeft,y:e.scrollY||e.document.documentElement.scrollTop};n.left+=r.x,n.right+=r.x,n.top+=r.y,n.bottom+=r.y}return n}function q(t){for(var e=[];t;)e.push(t),t=A(t);return e}function B(t){return!!w.string(t)&&(k.document.querySelector(t),!0)}function V(t,e){for(var n in e)t[n]=e[n];return t}function W(t,e,n){return"parent"===t?A(n):"self"===t?e.getRect(n):z(n,t)}function G(t,e,n,r){var i=t;return w.string(i)?i=W(i,e,n):w.func(i)&&(i=i.apply(void 0,r)),w.element(i)&&(i=L(i)),i}function N(t){return t&&{x:"x"in t?t.x:t.left,y:"y"in t?t.y:t.top}}function U(t){return!t||"x"in t&&"y"in t||((t=V({},t)).x=t.left||0,t.y=t.top||0,t.width=t.width||(t.right||0)-t.x,t.height=t.height||(t.bottom||0)-t.y),t}function H(t,e,n){t.left&&(e.left+=n.x),t.right&&(e.right+=n.x),t.top&&(e.top+=n.y),t.bottom&&(e.bottom+=n.y),e.width=e.right-e.left,e.height=e.bottom-e.top}function K(t,e,n){var r=n&&t.options[n];return N(G(r&&r.origin||t.options.origin,t,e,[t&&e]))||{x:0,y:0}}function $(t,e){var n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:function(t){return!0},r=arguments.length>3?arguments[3]:void 0;if(r=r||{},w.string(t)&&-1!==t.search(" ")&&(t=J(t)),w.array(t))return t.forEach((function(t){return $(t,e,n,r)})),r;if(w.object(t)&&(e=t,t=""),w.func(e)&&n(t))r[t]=r[t]||[],r[t].push(e);else if(w.array(e))for(var i=0,o=e;i<o.length;i++){var a=o[i];$(t,a,n,r)}else if(w.object(e))for(var s in e){$(J(s).map((function(e){return"".concat(t).concat(e)})),e[s],n,r)}return r}function J(t){return t.trim().split(/ +/)}var Q=function(t,e){return Math.sqrt(t*t+e*e)},Z=["webkit","moz"];function tt(t,e){t.__set||(t.__set={});var n=function(n){if(Z.some((function(t){return 0===n.indexOf(t)})))return 1;"function"!=typeof t[n]&&"__set"!==n&&Object.defineProperty(t,n,{get:function(){return n in t.__set?t.__set[n]:t.__set[n]=e[n]},set:function(e){t.__set[n]=e},configurable:!0})};for(var r in e)n(r);return t}function et(t,e){t.page=t.page||{},t.page.x=e.page.x,t.page.y=e.page.y,t.client=t.client||{},t.client.x=e.client.x,t.client.y=e.client.y,t.timeStamp=e.timeStamp}function nt(t){t.page.x=0,t.page.y=0,t.client.x=0,t.client.y=0}function rt(t){return t instanceof k.Event||t instanceof k.Touch}function it(t,e,n){return t=t||"page",(n=n||{}).x=e[t+"X"],n.y=e[t+"Y"],n}function ot(t,e){return e=e||{x:0,y:0},I.isOperaMobile&&rt(t)?(it("screen",t,e),e.x+=window.scrollX,e.y+=window.scrollY):it("page",t,e),e}function at(t){return w.number(t.pointerId)?t.pointerId:t.identifier}function st(t,e,n){var r=e.length>1?lt(e):e[0];ot(r,t.page),function(t,e){e=e||{},I.isOperaMobile&&rt(t)?it("screen",t,e):it("client",t,e)}(r,t.client),t.timeStamp=n}function ct(t){var e=[];return w.array(t)?(e[0]=t[0],e[1]=t[1]):"touchend"===t.type?1===t.touches.length?(e[0]=t.touches[0],e[1]=t.changedTouches[0]):0===t.touches.length&&(e[0]=t.changedTouches[0],e[1]=t.changedTouches[1]):(e[0]=t.touches[0],e[1]=t.touches[1]),e}function lt(t){for(var e={pageX:0,pageY:0,clientX:0,clientY:0,screenX:0,screenY:0},n=0;n<t.length;n++){var r=t[n];for(var i in e)e[i]+=r[i]}for(var o in e)e[o]/=t.length;return e}function ut(t){if(!t.length)return null;var e=ct(t),n=Math.min(e[0].pageX,e[1].pageX),r=Math.min(e[0].pageY,e[1].pageY),i=Math.max(e[0].pageX,e[1].pageX),o=Math.max(e[0].pageY,e[1].pageY);return{x:n,y:r,left:n,top:r,right:i,bottom:o,width:i-n,height:o-r}}function pt(t,e){var n=e+"X",r=e+"Y",i=ct(t),o=i[0][n]-i[1][n],a=i[0][r]-i[1][r];return Q(o,a)}function ft(t,e){var n=e+"X",r=e+"Y",i=ct(t),o=i[1][n]-i[0][n],a=i[1][r]-i[0][r];return 180*Math.atan2(a,o)/Math.PI}function dt(t){return w.string(t.pointerType)?t.pointerType:w.number(t.pointerType)?[void 0,void 0,"touch","pen","mouse"][t.pointerType]:/touch/.test(t.type||"")||t instanceof k.Touch?"touch":"mouse"}function ht(t){var e=w.func(t.composedPath)?t.composedPath():t.path;return[X(e?e[0]:t.target),X(t.currentTarget)]}var vt=function(){function t(e){r(this,t),this.immediatePropagationStopped=!1,this.propagationStopped=!1,this._interaction=e}return o(t,[{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}}]),t}();Object.defineProperty(vt.prototype,"interaction",{get:function(){return this._interaction._proxy},set:function(){}});var gt=function(t,e){for(var n=0;n<e.length;n++){var r=e[n];t.push(r)}return t},mt=function(t){return gt([],t)},yt=function(t,e){for(var n=0;n<t.length;n++)if(e(t[n],n,t))return n;return-1},bt=function(t,e){return t[yt(t,e)]},xt=function(t){s(n,t);var e=p(n);function n(t,i,o){var a;r(this,n),(a=e.call(this,i._interaction)).dropzone=void 0,a.dragEvent=void 0,a.relatedTarget=void 0,a.draggable=void 0,a.propagationStopped=!1,a.immediatePropagationStopped=!1;var s="dragleave"===o?t.prev:t.cur,c=s.element,l=s.dropzone;return a.type=o,a.target=c,a.currentTarget=c,a.dropzone=l,a.dragEvent=i,a.relatedTarget=i.target,a.draggable=i.interactable,a.timeStamp=i.timeStamp,a}return o(n,[{key:"reject",value:function(){var t=this,e=this._interaction.dropState;if("dropactivate"===this.type||this.dropzone&&e.cur.dropzone===this.dropzone&&e.cur.element===this.target)if(e.prev.dropzone=this.dropzone,e.prev.element=this.target,e.rejected=!0,e.events.enter=null,this.stopImmediatePropagation(),"dropactivate"===this.type){var r=e.activeDrops,i=yt(r,(function(e){var n=e.dropzone,r=e.element;return n===t.dropzone&&r===t.target}));e.activeDrops.splice(i,1);var o=new n(e,this.dragEvent,"dropdeactivate");o.dropzone=this.dropzone,o.target=this.target,this.dropzone.fire(o)}else this.dropzone.fire(new n(e,this.dragEvent,"dragleave"))}},{key:"preventDefault",value:function(){}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}}]),n}(vt);function wt(t,e){for(var n=0,r=t.slice();n<r.length;n++){var i=r[n],o=i.dropzone,a=i.element;e.dropzone=o,e.target=a,o.fire(e),e.propagationStopped=e.immediatePropagationStopped=!1}}function Et(t,e){for(var n=function(t,e){for(var n=[],r=0,i=t.interactables.list;r<i.length;r++){var o=i[r];if(o.options.drop.enabled){var a=o.options.drop.accept;if(!(w.element(a)&&a!==e||w.string(a)&&!R(e,a)||w.func(a)&&!a({dropzone:o,draggableElement:e})))for(var s=0,c=o.getAllElements();s<c.length;s++){var l=c[s];l!==e&&n.push({dropzone:o,element:l,rect:o.getRect(l)})}}}return n}(t,e),r=0;r<n.length;r++){var i=n[r];i.rect=i.dropzone.getRect(i.element)}return n}function Tt(t,e,n){for(var r=t.dropState,i=t.interactable,o=t.element,a=[],s=0,c=r.activeDrops;s<c.length;s++){var l=c[s],u=l.dropzone,p=l.element,f=l.rect,d=u.dropCheck(e,n,i,o,p,f);a.push(d?p:null)}var h=function(t){for(var e,n,r,i=[],o=0;o<t.length;o++){var a=t[o],s=t[e];if(a&&o!==e)if(s){var c=C(a),l=C(s);if(c!==a.ownerDocument)if(l!==a.ownerDocument)if(c!==l){i=i.length?i:j(s);var u=void 0;if(s instanceof k.HTMLElement&&a instanceof k.SVGElement&&!(a instanceof k.SVGSVGElement)){if(a===l)continue;u=a.ownerSVGElement}else u=a;for(var p=j(u,s.ownerDocument),f=0;p[f]&&p[f]===i[f];)f++;var d=[p[f-1],p[f],i[f]];if(d[0])for(var h=d[0].lastChild;h;){if(h===d[1]){e=o,i=p;break}if(h===d[2])break;h=h.previousSibling}}else r=s,void 0,void 0,(parseInt(y(n=a).getComputedStyle(n).zIndex,10)||0)>=(parseInt(y(r).getComputedStyle(r).zIndex,10)||0)&&(e=o);else e=o}else e=o}return e}(a);return r.activeDrops[h]||null}function St(t,e,n){var r=t.dropState,i={enter:null,leave:null,activate:null,deactivate:null,move:null,drop:null};return"dragstart"===n.type&&(i.activate=new xt(r,n,"dropactivate"),i.activate.target=null,i.activate.dropzone=null),"dragend"===n.type&&(i.deactivate=new xt(r,n,"dropdeactivate"),i.deactivate.target=null,i.deactivate.dropzone=null),r.rejected||(r.cur.element!==r.prev.element&&(r.prev.dropzone&&(i.leave=new xt(r,n,"dragleave"),n.dragLeave=i.leave.target=r.prev.element,n.prevDropzone=i.leave.dropzone=r.prev.dropzone),r.cur.dropzone&&(i.enter=new xt(r,n,"dragenter"),n.dragEnter=r.cur.element,n.dropzone=r.cur.dropzone)),"dragend"===n.type&&r.cur.dropzone&&(i.drop=new xt(r,n,"drop"),n.dropzone=r.cur.dropzone,n.relatedTarget=r.cur.element),"dragmove"===n.type&&r.cur.dropzone&&(i.move=new xt(r,n,"dropmove"),n.dropzone=r.cur.dropzone)),i}function _t(t,e){var n=t.dropState,r=n.activeDrops,i=n.cur,o=n.prev;e.leave&&o.dropzone.fire(e.leave),e.enter&&i.dropzone.fire(e.enter),e.move&&i.dropzone.fire(e.move),e.drop&&i.dropzone.fire(e.drop),e.deactivate&&wt(r,e.deactivate),n.prev.dropzone=i.dropzone,n.prev.element=i.element}function Pt(t,e){var n=t.interaction,r=t.iEvent,i=t.event;if("dragmove"===r.type||"dragend"===r.type){var o=n.dropState;e.dynamicDrop&&(o.activeDrops=Et(e,n.element));var a=r,s=Tt(n,a,i);o.rejected=o.rejected&&!!s&&s.dropzone===o.cur.dropzone&&s.element===o.cur.element,o.cur.dropzone=s&&s.dropzone,o.cur.element=s&&s.element,o.events=St(n,0,a)}}var Ot={id:"actions/drop",install:function(t){var e=t.actions,n=t.interactStatic,r=t.Interactable,i=t.defaults;t.usePlugin(_),r.prototype.dropzone=function(t){return function(t,e){if(w.object(e)){if(t.options.drop.enabled=!1!==e.enabled,e.listeners){var n=$(e.listeners),r=Object.keys(n).reduce((function(t,e){return t[/^(enter|leave)/.test(e)?"drag".concat(e):/^(activate|deactivate|move)/.test(e)?"drop".concat(e):e]=n[e],t}),{}),i=t.options.drop.listeners;i&&t.off(i),t.on(r),t.options.drop.listeners=r}return w.func(e.ondrop)&&t.on("drop",e.ondrop),w.func(e.ondropactivate)&&t.on("dropactivate",e.ondropactivate),w.func(e.ondropdeactivate)&&t.on("dropdeactivate",e.ondropdeactivate),w.func(e.ondragenter)&&t.on("dragenter",e.ondragenter),w.func(e.ondragleave)&&t.on("dragleave",e.ondragleave),w.func(e.ondropmove)&&t.on("dropmove",e.ondropmove),/^(pointer|center)$/.test(e.overlap)?t.options.drop.overlap=e.overlap:w.number(e.overlap)&&(t.options.drop.overlap=Math.max(Math.min(1,e.overlap),0)),"accept"in e&&(t.options.drop.accept=e.accept),"checker"in e&&(t.options.drop.checker=e.checker),t}if(w.bool(e))return t.options.drop.enabled=e,t;return t.options.drop}(this,t)},r.prototype.dropCheck=function(t,e,n,r,i,o){return function(t,e,n,r,i,o,a){var s=!1;if(!(a=a||t.getRect(o)))return!!t.options.drop.checker&&t.options.drop.checker(e,n,s,t,o,r,i);var c=t.options.drop.overlap;if("pointer"===c){var l=K(r,i,"drag"),u=ot(e);u.x+=l.x,u.y+=l.y;var p=u.x>a.left&&u.x<a.right,f=u.y>a.top&&u.y<a.bottom;s=p&&f}var d=r.getRect(i);if(d&&"center"===c){var h=d.left+d.width/2,v=d.top+d.height/2;s=h>=a.left&&h<=a.right&&v>=a.top&&v<=a.bottom}if(d&&w.number(c)){s=Math.max(0,Math.min(a.right,d.right)-Math.max(a.left,d.left))*Math.max(0,Math.min(a.bottom,d.bottom)-Math.max(a.top,d.top))/(d.width*d.height)>=c}t.options.drop.checker&&(s=t.options.drop.checker(e,n,s,t,o,r,i));return s}(this,t,e,n,r,i,o)},n.dynamicDrop=function(e){return w.bool(e)?(t.dynamicDrop=e,n):t.dynamicDrop},V(e.phaselessTypes,{dragenter:!0,dragleave:!0,dropactivate:!0,dropdeactivate:!0,dropmove:!0,drop:!0}),e.methodDict.drop="dropzone",t.dynamicDrop=!1,i.actions.drop=Ot.defaults},listeners:{"interactions:before-action-start":function(t){var e=t.interaction;"drag"===e.prepared.name&&(e.dropState={cur:{dropzone:null,element:null},prev:{dropzone:null,element:null},rejected:null,events:null,activeDrops:[]})},"interactions:after-action-start":function(t,e){var n=t.interaction,r=(t.event,t.iEvent);if("drag"===n.prepared.name){var i=n.dropState;i.activeDrops=[],i.events={},i.activeDrops=Et(e,n.element),i.events=St(n,0,r),i.events.activate&&(wt(i.activeDrops,i.events.activate),e.fire("actions/drop:start",{interaction:n,dragEvent:r}))}},"interactions:action-move":Pt,"interactions:after-action-move":function(t,e){var n=t.interaction,r=t.iEvent;if("drag"===n.prepared.name){var i=n.dropState;_t(n,i.events),e.fire("actions/drop:move",{interaction:n,dragEvent:r}),i.events={}}},"interactions:action-end":function(t,e){if("drag"===t.interaction.prepared.name){var n=t.interaction,r=t.iEvent;Pt(t,e),_t(n,n.dropState.events),e.fire("actions/drop:end",{interaction:n,dragEvent:r})}},"interactions:stop":function(t){var e=t.interaction;if("drag"===e.prepared.name){var n=e.dropState;n&&(n.activeDrops=null,n.events=null,n.cur.dropzone=null,n.cur.element=null,n.prev.dropzone=null,n.prev.element=null,n.rejected=!1)}}},getActiveDrops:Et,getDrop:Tt,getDropEvents:St,fireDropEvents:_t,filterEventType:function(t){return 0===t.search("drag")||0===t.search("drop")},defaults:{enabled:!1,accept:null,overlap:"pointer"}},kt=Ot;function Dt(t){var e=t.interaction,n=t.iEvent,r=t.phase;if("gesture"===e.prepared.name){var i=e.pointers.map((function(t){return t.pointer})),o="start"===r,a="end"===r,s=e.interactable.options.deltaSource;if(n.touches=[i[0],i[1]],o)n.distance=pt(i,s),n.box=ut(i),n.scale=1,n.ds=0,n.angle=ft(i,s),n.da=0,e.gesture.startDistance=n.distance,e.gesture.startAngle=n.angle;else if(a||e.pointers.length<2){var c=e.prevEvent;n.distance=c.distance,n.box=c.box,n.scale=c.scale,n.ds=0,n.angle=c.angle,n.da=0}else n.distance=pt(i,s),n.box=ut(i),n.scale=n.distance/e.gesture.startDistance,n.angle=ft(i,s),n.ds=n.scale-e.gesture.scale,n.da=n.angle-e.gesture.angle;e.gesture.distance=n.distance,e.gesture.angle=n.angle,w.number(n.scale)&&n.scale!==1/0&&!isNaN(n.scale)&&(e.gesture.scale=n.scale)}}var It={id:"actions/gesture",before:["actions/drag","actions/resize"],install:function(t){var e=t.actions,n=t.Interactable,r=t.defaults;n.prototype.gesturable=function(t){return w.object(t)?(this.options.gesture.enabled=!1!==t.enabled,this.setPerAction("gesture",t),this.setOnEvents("gesture",t),this):w.bool(t)?(this.options.gesture.enabled=t,this):this.options.gesture},e.map.gesture=It,e.methodDict.gesture="gesturable",r.actions.gesture=It.defaults},listeners:{"interactions:action-start":Dt,"interactions:action-move":Dt,"interactions:action-end":Dt,"interactions:new":function(t){t.interaction.gesture={angle:0,distance:0,scale:1,startAngle:0,startDistance:0}},"auto-start:check":function(t){if(!(t.interaction.pointers.length<2)){var e=t.interactable.options.gesture;if(e&&e.enabled)return t.action={name:"gesture"},!1}}},defaults:{},getCursor:function(){return""},filterEventType:function(t){return 0===t.search("gesture")}},Mt=It;function zt(t,e,n,r,i,o,a){if(!e)return!1;if(!0===e){var s=w.number(o.width)?o.width:o.right-o.left,c=w.number(o.height)?o.height:o.bottom-o.top;if(a=Math.min(a,Math.abs(("left"===t||"right"===t?s:c)/2)),s<0&&("left"===t?t="right":"right"===t&&(t="left")),c<0&&("top"===t?t="bottom":"bottom"===t&&(t="top")),"left"===t){var l=s>=0?o.left:o.right;return n.x<l+a}if("top"===t){var u=c>=0?o.top:o.bottom;return n.y<u+a}if("right"===t)return n.x>(s>=0?o.right:o.left)-a;if("bottom"===t)return n.y>(c>=0?o.bottom:o.top)-a}return!!w.element(r)&&(w.element(e)?e===r:F(r,e,i))}function At(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.resizeAxes){var r=e;n.interactable.options.resize.square?("y"===n.resizeAxes?r.delta.x=r.delta.y:r.delta.y=r.delta.x,r.axes="xy"):(r.axes=n.resizeAxes,"x"===n.resizeAxes?r.delta.y=0:"y"===n.resizeAxes&&(r.delta.x=0))}}var Rt,Ct,jt={id:"actions/resize",before:["actions/drag"],install:function(t){var e=t.actions,n=t.browser,r=t.Interactable,i=t.defaults;jt.cursors=function(t){return t.isIe9?{x:"e-resize",y:"s-resize",xy:"se-resize",top:"n-resize",left:"w-resize",bottom:"s-resize",right:"e-resize",topleft:"se-resize",bottomright:"se-resize",topright:"ne-resize",bottomleft:"ne-resize"}:{x:"ew-resize",y:"ns-resize",xy:"nwse-resize",top:"ns-resize",left:"ew-resize",bottom:"ns-resize",right:"ew-resize",topleft:"nwse-resize",bottomright:"nwse-resize",topright:"nesw-resize",bottomleft:"nesw-resize"}}(n),jt.defaultMargin=n.supportsTouch||n.supportsPointerEvent?20:10,r.prototype.resizable=function(e){return function(t,e,n){if(w.object(e))return t.options.resize.enabled=!1!==e.enabled,t.setPerAction("resize",e),t.setOnEvents("resize",e),w.string(e.axis)&&/^x$|^y$|^xy$/.test(e.axis)?t.options.resize.axis=e.axis:null===e.axis&&(t.options.resize.axis=n.defaults.actions.resize.axis),w.bool(e.preserveAspectRatio)?t.options.resize.preserveAspectRatio=e.preserveAspectRatio:w.bool(e.square)&&(t.options.resize.square=e.square),t;if(w.bool(e))return t.options.resize.enabled=e,t;return t.options.resize}(this,e,t)},e.map.resize=jt,e.methodDict.resize="resizable",i.actions.resize=jt.defaults},listeners:{"interactions:new":function(t){t.interaction.resizeAxes="xy"},"interactions:action-start":function(t){!function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e,i=n.rect;n._rects={start:V({},i),corrected:V({},i),previous:V({},i),delta:{left:0,right:0,width:0,top:0,bottom:0,height:0}},r.edges=n.prepared.edges,r.rect=n._rects.corrected,r.deltaRect=n._rects.delta}}(t),At(t)},"interactions:action-move":function(t){!function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e,i=n.interactable.options.resize.invert,o="reposition"===i||"negate"===i,a=n.rect,s=n._rects,c=s.start,l=s.corrected,u=s.delta,p=s.previous;if(V(p,l),o){if(V(l,a),"reposition"===i){if(l.top>l.bottom){var f=l.top;l.top=l.bottom,l.bottom=f}if(l.left>l.right){var d=l.left;l.left=l.right,l.right=d}}}else l.top=Math.min(a.top,c.bottom),l.bottom=Math.max(a.bottom,c.top),l.left=Math.min(a.left,c.right),l.right=Math.max(a.right,c.left);for(var h in l.width=l.right-l.left,l.height=l.bottom-l.top,l)u[h]=l[h]-p[h];r.edges=n.prepared.edges,r.rect=l,r.deltaRect=u}}(t),At(t)},"interactions:action-end":function(t){var e=t.iEvent,n=t.interaction;if("resize"===n.prepared.name&&n.prepared.edges){var r=e;r.edges=n.prepared.edges,r.rect=n._rects.corrected,r.deltaRect=n._rects.delta}},"auto-start:check":function(t){var e=t.interaction,n=t.interactable,r=t.element,i=t.rect,o=t.buttons;if(i){var a=V({},e.coords.cur.page),s=n.options.resize;if(s&&s.enabled&&(!e.pointerIsDown||!/mouse|pointer/.test(e.pointerType)||0!=(o&s.mouseButtons))){if(w.object(s.edges)){var c={left:!1,right:!1,top:!1,bottom:!1};for(var l in c)c[l]=zt(l,s.edges[l],a,e._latestPointer.eventTarget,r,i,s.margin||jt.defaultMargin);c.left=c.left&&!c.right,c.top=c.top&&!c.bottom,(c.left||c.right||c.top||c.bottom)&&(t.action={name:"resize",edges:c})}else{var u="y"!==s.axis&&a.x>i.right-jt.defaultMargin,p="x"!==s.axis&&a.y>i.bottom-jt.defaultMargin;(u||p)&&(t.action={name:"resize",axes:(u?"x":"")+(p?"y":"")})}return!t.action&&void 0}}}},defaults:{square:!1,preserveAspectRatio:!1,axis:"xy",margin:NaN,edges:null,invert:"none"},cursors:null,getCursor:function(t){var e=t.edges,n=t.axis,r=t.name,i=jt.cursors,o=null;if(n)o=i[r+n];else if(e){for(var a="",s=0,c=["top","bottom","left","right"];s<c.length;s++){var l=c[s];e[l]&&(a+=l)}o=i[a]}return o},filterEventType:function(t){return 0===t.search("resize")},defaultMargin:null},Ft=jt,Xt={id:"actions",install:function(t){t.usePlugin(Mt),t.usePlugin(Ft),t.usePlugin(_),t.usePlugin(kt)}},Yt=0;var Lt={request:function(t){return Rt(t)},cancel:function(t){return Ct(t)},init:function(t){if(Rt=t.requestAnimationFrame,Ct=t.cancelAnimationFrame,!Rt)for(var e=["ms","moz","webkit","o"],n=0;n<e.length;n++){var r=e[n];Rt=t["".concat(r,"RequestAnimationFrame")],Ct=t["".concat(r,"CancelAnimationFrame")]||t["".concat(r,"CancelRequestAnimationFrame")]}Rt=Rt&&Rt.bind(t),Ct=Ct&&Ct.bind(t),Rt||(Rt=function(e){var n=Date.now(),r=Math.max(0,16-(n-Yt)),i=t.setTimeout((function(){e(n+r)}),r);return Yt=n+r,i},Ct=function(t){return clearTimeout(t)})}};var qt={defaults:{enabled:!1,margin:60,container:null,speed:300},now:Date.now,interaction:null,i:0,x:0,y:0,isScrolling:!1,prevTime:0,margin:0,speed:0,start:function(t){qt.isScrolling=!0,Lt.cancel(qt.i),t.autoScroll=qt,qt.interaction=t,qt.prevTime=qt.now(),qt.i=Lt.request(qt.scroll)},stop:function(){qt.isScrolling=!1,qt.interaction&&(qt.interaction.autoScroll=null),Lt.cancel(qt.i)},scroll:function(){var t=qt.interaction,e=t.interactable,n=t.element,r=t.prepared.name,i=e.options[r].autoScroll,o=Bt(i.container,e,n),a=qt.now(),s=(a-qt.prevTime)/1e3,c=i.speed*s;if(c>=1){var l={x:qt.x*c,y:qt.y*c};if(l.x||l.y){var u=Vt(o);w.window(o)?o.scrollBy(l.x,l.y):o&&(o.scrollLeft+=l.x,o.scrollTop+=l.y);var p=Vt(o),f={x:p.x-u.x,y:p.y-u.y};(f.x||f.y)&&e.fire({type:"autoscroll",target:n,interactable:e,delta:f,interaction:t,container:o})}qt.prevTime=a}qt.isScrolling&&(Lt.cancel(qt.i),qt.i=Lt.request(qt.scroll))},check:function(t,e){var n;return null==(n=t.options[e].autoScroll)?void 0:n.enabled},onInteractionMove:function(t){var e=t.interaction,n=t.pointer;if(e.interacting()&&qt.check(e.interactable,e.prepared.name))if(e.simulation)qt.x=qt.y=0;else{var r,i,o,a,s=e.interactable,c=e.element,l=e.prepared.name,u=s.options[l].autoScroll,p=Bt(u.container,s,c);if(w.window(p))a=n.clientX<qt.margin,r=n.clientY<qt.margin,i=n.clientX>p.innerWidth-qt.margin,o=n.clientY>p.innerHeight-qt.margin;else{var f=Y(p);a=n.clientX<f.left+qt.margin,r=n.clientY<f.top+qt.margin,i=n.clientX>f.right-qt.margin,o=n.clientY>f.bottom-qt.margin}qt.x=i?1:a?-1:0,qt.y=o?1:r?-1:0,qt.isScrolling||(qt.margin=u.margin,qt.speed=u.speed,qt.start(e))}}};function Bt(t,e,n){return(w.string(t)?W(t,e,n):t)||y(n)}function Vt(t){return w.window(t)&&(t=window.document.body),{x:t.scrollLeft,y:t.scrollTop}}var Wt={id:"auto-scroll",install:function(t){var e=t.defaults,n=t.actions;t.autoScroll=qt,qt.now=function(){return t.now()},n.phaselessTypes.autoscroll=!0,e.perAction.autoScroll=qt.defaults},listeners:{"interactions:new":function(t){t.interaction.autoScroll=null},"interactions:destroy":function(t){t.interaction.autoScroll=null,qt.stop(),qt.interaction&&(qt.interaction=null)},"interactions:stop":qt.stop,"interactions:action-move":function(t){return qt.onInteractionMove(t)}}},Gt=Wt;function Nt(t,e){var n=!1;return function(){return n||(g.console.warn(e),n=!0),t.apply(this,arguments)}}function Ut(t,e){return t.name=e.name,t.axis=e.axis,t.edges=e.edges,t}function Ht(t){return w.bool(t)?(this.options.styleCursor=t,this):null===t?(delete this.options.styleCursor,this):this.options.styleCursor}function Kt(t){return w.func(t)?(this.options.actionChecker=t,this):null===t?(delete this.options.actionChecker,this):this.options.actionChecker}var $t={id:"auto-start/interactableMethods",install:function(t){var e=t.Interactable;e.prototype.getAction=function(e,n,r,i){var o=function(t,e,n,r,i){var o=t.getRect(r),a=e.buttons||{0:1,1:4,3:8,4:16}[e.button],s={action:null,interactable:t,interaction:n,element:r,rect:o,buttons:a};return i.fire("auto-start:check",s),s.action}(this,n,r,i,t);return this.options.actionChecker?this.options.actionChecker(e,n,o,this,i,r):o},e.prototype.ignoreFrom=Nt((function(t){return this._backCompatOption("ignoreFrom",t)}),"Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue})."),e.prototype.allowFrom=Nt((function(t){return this._backCompatOption("allowFrom",t)}),"Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue})."),e.prototype.actionChecker=Kt,e.prototype.styleCursor=Ht}};function Jt(t,e,n,r,i){return e.testIgnoreAllow(e.options[t.name],n,r)&&e.options[t.name].enabled&&ee(e,n,t,i)?t:null}function Qt(t,e,n,r,i,o,a){for(var s=0,c=r.length;s<c;s++){var l=r[s],u=i[s],p=l.getAction(e,n,t,u);if(p){var f=Jt(p,l,u,o,a);if(f)return{action:f,interactable:l,element:u}}}return{action:null,interactable:null,element:null}}function Zt(t,e,n,r,i){var o=[],a=[],s=r;function c(t){o.push(t),a.push(s)}for(;w.element(s);){o=[],a=[],i.interactables.forEachMatch(s,c);var l=Qt(t,e,n,o,a,r,i);if(l.action&&!l.interactable.options[l.action.name].manualStart)return l;s=A(s)}return{action:null,interactable:null,element:null}}function te(t,e,n){var r=e.action,i=e.interactable,o=e.element;r=r||{name:null},t.interactable=i,t.element=o,Ut(t.prepared,r),t.rect=i&&r.name?i.getRect(o):null,ie(t,n),n.fire("autoStart:prepared",{interaction:t})}function ee(t,e,n,r){var i=t.options,o=i[n.name].max,a=i[n.name].maxPerElement,s=r.autoStart.maxInteractions,c=0,l=0,u=0;if(!(o&&a&&s))return!1;for(var p=0,f=r.interactions.list;p<f.length;p++){var d=f[p],h=d.prepared.name;if(d.interacting()){if(++c>=s)return!1;if(d.interactable===t){if((l+=h===n.name?1:0)>=o)return!1;if(d.element===e&&(u++,h===n.name&&u>=a))return!1}}}return s>0}function ne(t,e){return w.number(t)?(e.autoStart.maxInteractions=t,this):e.autoStart.maxInteractions}function re(t,e,n){var r=n.autoStart.cursorElement;r&&r!==t&&(r.style.cursor=""),t.ownerDocument.documentElement.style.cursor=e,t.style.cursor=e,n.autoStart.cursorElement=e?t:null}function ie(t,e){var n=t.interactable,r=t.element,i=t.prepared;if("mouse"===t.pointerType&&n&&n.options.styleCursor){var o="";if(i.name){var a=n.options[i.name].cursorChecker;o=w.func(a)?a(i,n,r,t._interacting):e.actions.map[i.name].getCursor(i)}re(t.element,o||"",e)}else e.autoStart.cursorElement&&re(e.autoStart.cursorElement,"",e)}var oe={id:"auto-start/base",before:["actions"],install:function(t){var e=t.interactStatic,n=t.defaults;t.usePlugin($t),n.base.actionChecker=null,n.base.styleCursor=!0,V(n.perAction,{manualStart:!1,max:1/0,maxPerElement:1,allowFrom:null,ignoreFrom:null,mouseButtons:1}),e.maxInteractions=function(e){return ne(e,t)},t.autoStart={maxInteractions:1/0,withinInteractionLimit:ee,cursorElement:null}},listeners:{"interactions:down":function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;n.interacting()||te(n,Zt(n,r,i,o,e),e)},"interactions:move":function(t,e){!function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;"mouse"!==n.pointerType||n.pointerIsDown||n.interacting()||te(n,Zt(n,r,i,o,e),e)}(t,e),function(t,e){var n=t.interaction;if(n.pointerIsDown&&!n.interacting()&&n.pointerWasMoved&&n.prepared.name){e.fire("autoStart:before-start",t);var r=n.interactable,i=n.prepared.name;i&&r&&(r.options[i].manualStart||!ee(r,n.element,n.prepared,e)?n.stop():(n.start(n.prepared,r,n.element),ie(n,e)))}}(t,e)},"interactions:stop":function(t,e){var n=t.interaction,r=n.interactable;r&&r.options.styleCursor&&re(n.element,"",e)}},maxInteractions:ne,withinInteractionLimit:ee,validateAction:Jt},ae=oe;var se={id:"auto-start/dragAxis",listeners:{"autoStart:before-start":function(t,e){var n=t.interaction,r=t.eventTarget,i=t.dx,o=t.dy;if("drag"===n.prepared.name){var a=Math.abs(i),s=Math.abs(o),c=n.interactable.options.drag,l=c.startAxis,u=a>s?"x":a<s?"y":"xy";if(n.prepared.axis="start"===c.lockAxis?u[0]:c.lockAxis,"xy"!==u&&"xy"!==l&&l!==u){n.prepared.name=null;for(var p=r,f=function(t){if(t!==n.interactable){var i=n.interactable.options.drag;if(!i.manualStart&&t.testIgnoreAllow(i,p,r)){var o=t.getAction(n.downPointer,n.downEvent,n,p);if(o&&"drag"===o.name&&function(t,e){if(!e)return!1;var n=e.options.drag.startAxis;return"xy"===t||"xy"===n||n===t}(u,t)&&ae.validateAction(o,t,p,r,e))return t}}};w.element(p);){var d=e.interactables.forEachMatch(p,f);if(d){n.prepared.name="drag",n.interactable=d,n.element=p;break}p=A(p)}}}}}};function ce(t){var e=t.prepared&&t.prepared.name;if(!e)return null;var n=t.interactable.options;return n[e].hold||n[e].delay}var le={id:"auto-start/hold",install:function(t){var e=t.defaults;t.usePlugin(ae),e.perAction.hold=0,e.perAction.delay=0},listeners:{"interactions:new":function(t){t.interaction.autoStartHoldTimer=null},"autoStart:prepared":function(t){var e=t.interaction,n=ce(e);n>0&&(e.autoStartHoldTimer=setTimeout((function(){e.start(e.prepared,e.interactable,e.element)}),n))},"interactions:move":function(t){var e=t.interaction,n=t.duplicate;e.autoStartHoldTimer&&e.pointerWasMoved&&!n&&(clearTimeout(e.autoStartHoldTimer),e.autoStartHoldTimer=null)},"autoStart:before-start":function(t){var e=t.interaction;ce(e)>0&&(e.prepared.name=null)}},getHoldDuration:ce},ue=le,pe={id:"auto-start",install:function(t){t.usePlugin(ae),t.usePlugin(ue),t.usePlugin(se)}},fe=function(t){return/^(always|never|auto)$/.test(t)?(this.options.preventDefault=t,this):w.bool(t)?(this.options.preventDefault=t?"always":"never",this):this.options.preventDefault};function de(t){var e=t.interaction,n=t.event;e.interactable&&e.interactable.checkAndPreventDefault(n)}var he={id:"core/interactablePreventDefault",install:function(t){var e=t.Interactable;e.prototype.preventDefault=fe,e.prototype.checkAndPreventDefault=function(e){return function(t,e,n){var r=t.options.preventDefault;if("never"!==r)if("always"!==r){if(e.events.supportsPassive&&/^touch(start|move)$/.test(n.type)){var i=y(n.target).document,o=e.getDocOptions(i);if(!o||!o.events||!1!==o.events.passive)return}/^(mouse|pointer|touch)*(down|start)/i.test(n.type)||w.element(n.target)&&R(n.target,"input,select,textarea,[contenteditable=true],[contenteditable=true] *")||n.preventDefault()}else n.preventDefault()}(this,t,e)},t.interactions.docEvents.push({type:"dragstart",listener:function(e){for(var n=0,r=t.interactions.list;n<r.length;n++){var i=r[n];if(i.element&&(i.element===e.target||M(i.element,e.target)))return void i.interactable.checkAndPreventDefault(e)}}})},listeners:["down","move","up","cancel"].reduce((function(t,e){return t["interactions:".concat(e)]=de,t}),{})};function ve(t,e){if(e.phaselessTypes[t])return!0;for(var n in e.map)if(0===t.indexOf(n)&&t.substr(n.length)in e.phases)return!0;return!1}function ge(t){var e={};for(var n in t){var r=t[n];w.plainObject(r)?e[n]=ge(r):w.array(r)?e[n]=mt(r):e[n]=r}return e}var me=function(){function t(e){r(this,t),this.states=[],this.startOffset={left:0,right:0,top:0,bottom:0},this.startDelta=void 0,this.result=void 0,this.endResult=void 0,this.startEdges=void 0,this.edges=void 0,this.interaction=void 0,this.interaction=e,this.result=ye(),this.edges={left:!1,right:!1,top:!1,bottom:!1}}return o(t,[{key:"start",value:function(t,e){var n,r,i=t.phase,o=this.interaction,a=function(t){var e=t.interactable.options[t.prepared.name],n=e.modifiers;if(n&&n.length)return n;return["snap","snapSize","snapEdges","restrict","restrictEdges","restrictSize"].map((function(t){var n=e[t];return n&&n.enabled&&{options:n,methods:n._methods}})).filter((function(t){return!!t}))}(o);this.prepareStates(a),this.startEdges=V({},o.edges),this.edges=V({},this.startEdges),this.startOffset=(n=o.rect,r=e,n?{left:r.x-n.left,top:r.y-n.top,right:n.right-r.x,bottom:n.bottom-r.y}:{left:0,top:0,right:0,bottom:0}),this.startDelta={x:0,y:0};var s=this.fillArg({phase:i,pageCoords:e,preEnd:!1});return this.result=ye(),this.startAll(s),this.result=this.setAll(s)}},{key:"fillArg",value:function(t){var e=this.interaction;return t.interaction=e,t.interactable=e.interactable,t.element=e.element,t.rect||(t.rect=e.rect),t.edges||(t.edges=this.startEdges),t.startOffset=this.startOffset,t}},{key:"startAll",value:function(t){for(var e=0,n=this.states;e<n.length;e++){var r=n[e];r.methods.start&&(t.state=r,r.methods.start(t))}}},{key:"setAll",value:function(t){var e=t.phase,n=t.preEnd,r=t.skipModifiers,i=t.rect,o=t.edges;t.coords=V({},t.pageCoords),t.rect=V({},i),t.edges=V({},o);for(var a=r?this.states.slice(r):this.states,s=ye(t.coords,t.rect),c=0;c<a.length;c++){var l,u=a[c],p=u.options,f=V({},t.coords),d=null;null!=(l=u.methods)&&l.set&&this.shouldDo(p,n,e)&&(t.state=u,d=u.methods.set(t),H(t.edges,t.rect,{x:t.coords.x-f.x,y:t.coords.y-f.y})),s.eventProps.push(d)}V(this.edges,t.edges),s.delta.x=t.coords.x-t.pageCoords.x,s.delta.y=t.coords.y-t.pageCoords.y,s.rectDelta.left=t.rect.left-i.left,s.rectDelta.right=t.rect.right-i.right,s.rectDelta.top=t.rect.top-i.top,s.rectDelta.bottom=t.rect.bottom-i.bottom;var h=this.result.coords,v=this.result.rect;if(h&&v){var g=s.rect.left!==v.left||s.rect.right!==v.right||s.rect.top!==v.top||s.rect.bottom!==v.bottom;s.changed=g||h.x!==s.coords.x||h.y!==s.coords.y}return s}},{key:"applyToInteraction",value:function(t){var e=this.interaction,n=t.phase,r=e.coords.cur,i=e.coords.start,o=this.result,a=this.startDelta,s=o.delta;"start"===n&&V(this.startDelta,o.delta);for(var c=0,l=[[i,a],[r,s]];c<l.length;c++){var u=l[c],p=u[0],f=u[1];p.page.x+=f.x,p.page.y+=f.y,p.client.x+=f.x,p.client.y+=f.y}var d=this.result.rectDelta,h=t.rect||e.rect;h.left+=d.left,h.right+=d.right,h.top+=d.top,h.bottom+=d.bottom,h.width=h.right-h.left,h.height=h.bottom-h.top}},{key:"setAndApply",value:function(t){var e=this.interaction,n=t.phase,r=t.preEnd,i=t.skipModifiers,o=this.setAll(this.fillArg({preEnd:r,phase:n,pageCoords:t.modifiedCoords||e.coords.cur.page}));if(this.result=o,!o.changed&&(!i||i<this.states.length)&&e.interacting())return!1;if(t.modifiedCoords){var a=e.coords.cur.page,s={x:t.modifiedCoords.x-a.x,y:t.modifiedCoords.y-a.y};o.coords.x+=s.x,o.coords.y+=s.y,o.delta.x+=s.x,o.delta.y+=s.y}this.applyToInteraction(t)}},{key:"beforeEnd",value:function(t){var e=t.interaction,n=t.event,r=this.states;if(r&&r.length){for(var i=!1,o=0;o<r.length;o++){var a=r[o];t.state=a;var s=a.options,c=a.methods,l=c.beforeEnd&&c.beforeEnd(t);if(l)return this.endResult=l,!1;i=i||!i&&this.shouldDo(s,!0,t.phase,!0)}i&&e.move({event:n,preEnd:!0})}}},{key:"stop",value:function(t){var e=t.interaction;if(this.states&&this.states.length){var n=V({states:this.states,interactable:e.interactable,element:e.element,rect:null},t);this.fillArg(n);for(var r=0,i=this.states;r<i.length;r++){var o=i[r];n.state=o,o.methods.stop&&o.methods.stop(n)}this.states=null,this.endResult=null}}},{key:"prepareStates",value:function(t){this.states=[];for(var e=0;e<t.length;e++){var n=t[e],r=n.options,i=n.methods,o=n.name;this.states.push({options:r,methods:i,index:e,name:o})}return this.states}},{key:"restoreInteractionCoords",value:function(t){var e=t.interaction,n=e.coords,r=e.rect,i=e.modification;if(i.result){for(var o=i.startDelta,a=i.result,s=a.delta,c=a.rectDelta,l=0,u=[[n.start,o],[n.cur,s]];l<u.length;l++){var p=u[l],f=p[0],d=p[1];f.page.x-=d.x,f.page.y-=d.y,f.client.x-=d.x,f.client.y-=d.y}r.left-=c.left,r.right-=c.right,r.top-=c.top,r.bottom-=c.bottom}}},{key:"shouldDo",value:function(t,e,n,r){return!(!t||!1===t.enabled||r&&!t.endOnly||t.endOnly&&!e||"start"===n&&!t.setStart)}},{key:"copyFrom",value:function(t){this.startOffset=t.startOffset,this.startDelta=t.startDelta,this.startEdges=t.startEdges,this.edges=t.edges,this.states=t.states.map((function(t){return ge(t)})),this.result=ye(V({},t.result.coords),V({},t.result.rect))}},{key:"destroy",value:function(){for(var t in this)this[t]=null}}]),t}();function ye(t,e){return{rect:e,coords:t,delta:{x:0,y:0},rectDelta:{left:0,right:0,top:0,bottom:0},eventProps:[],changed:!0}}function be(t,e){var n=t.defaults,r={start:t.start,set:t.set,beforeEnd:t.beforeEnd,stop:t.stop},i=function(t){var i=t||{};for(var o in i.enabled=!1!==i.enabled,n)o in i||(i[o]=n[o]);var a={options:i,methods:r,name:e,enable:function(){return i.enabled=!0,a},disable:function(){return i.enabled=!1,a}};return a};return e&&"string"==typeof e&&(i._defaults=n,i._methods=r),i}function xe(t){var e=t.iEvent,n=t.interaction.modification.result;n&&(e.modifiers=n.eventProps)}var we={id:"modifiers/base",before:["actions"],install:function(t){t.defaults.perAction.modifiers=[]},listeners:{"interactions:new":function(t){var e=t.interaction;e.modification=new me(e)},"interactions:before-action-start":function(t){var e=t.interaction,n=t.interaction.modification;n.start(t,e.coords.start.page),e.edges=n.edges,n.applyToInteraction(t)},"interactions:before-action-move":function(t){var e=t.interaction,n=e.modification,r=n.setAndApply(t);return e.edges=n.edges,r},"interactions:before-action-end":function(t){var e=t.interaction,n=e.modification,r=n.beforeEnd(t);return e.edges=n.startEdges,r},"interactions:action-start":xe,"interactions:action-move":xe,"interactions:action-end":xe,"interactions:after-action-start":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:after-action-move":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:stop":function(t){return t.interaction.modification.stop(t)}}},Ee=we,Te={base:{preventDefault:"auto",deltaSource:"page"},perAction:{enabled:!1,origin:{x:0,y:0}},actions:{}},Se=function(t){s(n,t);var e=p(n);function n(t,i,o,a,s,c,l){var p;r(this,n),(p=e.call(this,t)).relatedTarget=null,p.screenX=void 0,p.screenY=void 0,p.button=void 0,p.buttons=void 0,p.ctrlKey=void 0,p.shiftKey=void 0,p.altKey=void 0,p.metaKey=void 0,p.page=void 0,p.client=void 0,p.delta=void 0,p.rect=void 0,p.x0=void 0,p.y0=void 0,p.t0=void 0,p.dt=void 0,p.duration=void 0,p.clientX0=void 0,p.clientY0=void 0,p.velocity=void 0,p.speed=void 0,p.swipe=void 0,p.axes=void 0,p.preEnd=void 0,s=s||t.element;var f=t.interactable,d=(f&&f.options||Te).deltaSource,h=K(f,s,o),v="start"===a,g="end"===a,m=v?u(p):t.prevEvent,y=v?t.coords.start:g?{page:m.page,client:m.client,timeStamp:t.coords.cur.timeStamp}:t.coords.cur;return p.page=V({},y.page),p.client=V({},y.client),p.rect=V({},t.rect),p.timeStamp=y.timeStamp,g||(p.page.x-=h.x,p.page.y-=h.y,p.client.x-=h.x,p.client.y-=h.y),p.ctrlKey=i.ctrlKey,p.altKey=i.altKey,p.shiftKey=i.shiftKey,p.metaKey=i.metaKey,p.button=i.button,p.buttons=i.buttons,p.target=s,p.currentTarget=s,p.preEnd=c,p.type=l||o+(a||""),p.interactable=f,p.t0=v?t.pointers[t.pointers.length-1].downTime:m.t0,p.x0=t.coords.start.page.x-h.x,p.y0=t.coords.start.page.y-h.y,p.clientX0=t.coords.start.client.x-h.x,p.clientY0=t.coords.start.client.y-h.y,p.delta=v||g?{x:0,y:0}:{x:p[d].x-m[d].x,y:p[d].y-m[d].y},p.dt=t.coords.delta.timeStamp,p.duration=p.timeStamp-p.t0,p.velocity=V({},t.coords.velocity[d]),p.speed=Q(p.velocity.x,p.velocity.y),p.swipe=g||"inertiastart"===a?p.getSwipe():null,p}return o(n,[{key:"getSwipe",value:function(){var t=this._interaction;if(t.prevEvent.speed<600||this.timeStamp-t.prevEvent.timeStamp>150)return null;var e=180*Math.atan2(t.prevEvent.velocityY,t.prevEvent.velocityX)/Math.PI;e<0&&(e+=360);var n=112.5<=e&&e<247.5,r=202.5<=e&&e<337.5;return{up:r,down:!r&&22.5<=e&&e<157.5,left:n,right:!n&&(292.5<=e||e<67.5),angle:e,speed:t.prevEvent.speed,velocity:{x:t.prevEvent.velocityX,y:t.prevEvent.velocityY}}}},{key:"preventDefault",value:function(){}},{key:"stopImmediatePropagation",value:function(){this.immediatePropagationStopped=this.propagationStopped=!0}},{key:"stopPropagation",value:function(){this.propagationStopped=!0}}]),n}(vt);Object.defineProperties(Se.prototype,{pageX:{get:function(){return this.page.x},set:function(t){this.page.x=t}},pageY:{get:function(){return this.page.y},set:function(t){this.page.y=t}},clientX:{get:function(){return this.client.x},set:function(t){this.client.x=t}},clientY:{get:function(){return this.client.y},set:function(t){this.client.y=t}},dx:{get:function(){return this.delta.x},set:function(t){this.delta.x=t}},dy:{get:function(){return this.delta.y},set:function(t){this.delta.y=t}},velocityX:{get:function(){return this.velocity.x},set:function(t){this.velocity.x=t}},velocityY:{get:function(){return this.velocity.y},set:function(t){this.velocity.y=t}}});var _e=o((function t(e,n,i,o,a){r(this,t),this.id=void 0,this.pointer=void 0,this.event=void 0,this.downTime=void 0,this.downTarget=void 0,this.id=e,this.pointer=n,this.event=i,this.downTime=o,this.downTarget=a})),Pe=function(t){return t.interactable="",t.element="",t.prepared="",t.pointerIsDown="",t.pointerWasMoved="",t._proxy="",t}({}),Oe=function(t){return t.start="",t.move="",t.end="",t.stop="",t.interacting="",t}({}),ke=0,De=function(){function t(e){var n=this,i=e.pointerType,o=e.scopeFire;r(this,t),this.interactable=null,this.element=null,this.rect=null,this._rects=void 0,this.edges=null,this._scopeFire=void 0,this.prepared={name:null,axis:null,edges:null},this.pointerType=void 0,this.pointers=[],this.downEvent=null,this.downPointer={},this._latestPointer={pointer:null,event:null,eventTarget:null},this.prevEvent=null,this.pointerIsDown=!1,this.pointerWasMoved=!1,this._interacting=!1,this._ending=!1,this._stopped=!0,this._proxy=void 0,this.simulation=null,this.doMove=Nt((function(t){this.move(t)}),"The interaction.doMove() method has been renamed to interaction.move()"),this.coords={start:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},prev:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},cur:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},delta:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0},velocity:{page:{x:0,y:0},client:{x:0,y:0},timeStamp:0}},this._id=ke++,this._scopeFire=o,this.pointerType=i;var a=this;this._proxy={};var s=function(t){Object.defineProperty(n._proxy,t,{get:function(){return a[t]}})};for(var c in Pe)s(c);var l=function(t){Object.defineProperty(n._proxy,t,{value:function(){return a[t].apply(a,arguments)}})};for(var u in Oe)l(u);this._scopeFire("interactions:new",{interaction:this})}return o(t,[{key:"pointerMoveTolerance",get:function(){return 1}},{key:"pointerDown",value:function(t,e,n){var r=this.updatePointer(t,e,n,!0),i=this.pointers[r];this._scopeFire("interactions:down",{pointer:t,event:e,eventTarget:n,pointerIndex:r,pointerInfo:i,type:"down",interaction:this})}},{key:"start",value:function(t,e,n){return!(this.interacting()||!this.pointerIsDown||this.pointers.length<("gesture"===t.name?2:1)||!e.options[t.name].enabled)&&(Ut(this.prepared,t),this.interactable=e,this.element=n,this.rect=e.getRect(n),this.edges=this.prepared.edges?V({},this.prepared.edges):{left:!0,right:!0,top:!0,bottom:!0},this._stopped=!1,this._interacting=this._doPhase({interaction:this,event:this.downEvent,phase:"start"})&&!this._stopped,this._interacting)}},{key:"pointerMove",value:function(t,e,n){this.simulation||this.modification&&this.modification.endResult||this.updatePointer(t,e,n,!1);var r,i,o=this.coords.cur.page.x===this.coords.prev.page.x&&this.coords.cur.page.y===this.coords.prev.page.y&&this.coords.cur.client.x===this.coords.prev.client.x&&this.coords.cur.client.y===this.coords.prev.client.y;this.pointerIsDown&&!this.pointerWasMoved&&(r=this.coords.cur.client.x-this.coords.start.client.x,i=this.coords.cur.client.y-this.coords.start.client.y,this.pointerWasMoved=Q(r,i)>this.pointerMoveTolerance);var a,s,c,l=this.getPointerIndex(t),u={pointer:t,pointerIndex:l,pointerInfo:this.pointers[l],event:e,type:"move",eventTarget:n,dx:r,dy:i,duplicate:o,interaction:this};o||(a=this.coords.velocity,s=this.coords.delta,c=Math.max(s.timeStamp/1e3,.001),a.page.x=s.page.x/c,a.page.y=s.page.y/c,a.client.x=s.client.x/c,a.client.y=s.client.y/c,a.timeStamp=c),this._scopeFire("interactions:move",u),o||this.simulation||(this.interacting()&&(u.type=null,this.move(u)),this.pointerWasMoved&&et(this.coords.prev,this.coords.cur))}},{key:"move",value:function(t){t&&t.event||nt(this.coords.delta),(t=V({pointer:this._latestPointer.pointer,event:this._latestPointer.event,eventTarget:this._latestPointer.eventTarget,interaction:this},t||{})).phase="move",this._doPhase(t)}},{key:"pointerUp",value:function(t,e,n,r){var i=this.getPointerIndex(t);-1===i&&(i=this.updatePointer(t,e,n,!1));var o=/cancel$/i.test(e.type)?"cancel":"up";this._scopeFire("interactions:".concat(o),{pointer:t,pointerIndex:i,pointerInfo:this.pointers[i],event:e,eventTarget:n,type:o,curEventTarget:r,interaction:this}),this.simulation||this.end(e),this.removePointer(t,e)}},{key:"documentBlur",value:function(t){this.end(t),this._scopeFire("interactions:blur",{event:t,type:"blur",interaction:this})}},{key:"end",value:function(t){var e;this._ending=!0,t=t||this._latestPointer.event,this.interacting()&&(e=this._doPhase({event:t,interaction:this,phase:"end"})),this._ending=!1,!0===e&&this.stop()}},{key:"currentAction",value:function(){return this._interacting?this.prepared.name:null}},{key:"interacting",value:function(){return this._interacting}},{key:"stop",value:function(){this._scopeFire("interactions:stop",{interaction:this}),this.interactable=this.element=null,this._interacting=!1,this._stopped=!0,this.prepared.name=this.prevEvent=null}},{key:"getPointerIndex",value:function(t){var e=at(t);return"mouse"===this.pointerType||"pen"===this.pointerType?this.pointers.length-1:yt(this.pointers,(function(t){return t.id===e}))}},{key:"getPointerInfo",value:function(t){return this.pointers[this.getPointerIndex(t)]}},{key:"updatePointer",value:function(t,e,n,r){var i,o,a,s=at(t),c=this.getPointerIndex(t),l=this.pointers[c];return r=!1!==r&&(r||/(down|start)$/i.test(e.type)),l?l.pointer=t:(l=new _e(s,t,e,null,null),c=this.pointers.length,this.pointers.push(l)),st(this.coords.cur,this.pointers.map((function(t){return t.pointer})),this._now()),i=this.coords.delta,o=this.coords.prev,a=this.coords.cur,i.page.x=a.page.x-o.page.x,i.page.y=a.page.y-o.page.y,i.client.x=a.client.x-o.client.x,i.client.y=a.client.y-o.client.y,i.timeStamp=a.timeStamp-o.timeStamp,r&&(this.pointerIsDown=!0,l.downTime=this.coords.cur.timeStamp,l.downTarget=n,tt(this.downPointer,t),this.interacting()||(et(this.coords.start,this.coords.cur),et(this.coords.prev,this.coords.cur),this.downEvent=e,this.pointerWasMoved=!1)),this._updateLatestPointer(t,e,n),this._scopeFire("interactions:update-pointer",{pointer:t,event:e,eventTarget:n,down:r,pointerInfo:l,pointerIndex:c,interaction:this}),c}},{key:"removePointer",value:function(t,e){var n=this.getPointerIndex(t);if(-1!==n){var r=this.pointers[n];this._scopeFire("interactions:remove-pointer",{pointer:t,event:e,eventTarget:null,pointerIndex:n,pointerInfo:r,interaction:this}),this.pointers.splice(n,1),this.pointerIsDown=!1}}},{key:"_updateLatestPointer",value:function(t,e,n){this._latestPointer.pointer=t,this._latestPointer.event=e,this._latestPointer.eventTarget=n}},{key:"destroy",value:function(){this._latestPointer.pointer=null,this._latestPointer.event=null,this._latestPointer.eventTarget=null}},{key:"_createPreparedEvent",value:function(t,e,n,r){return new Se(this,t,this.prepared.name,e,this.element,n,r)}},{key:"_fireEvent",value:function(t){var e;null==(e=this.interactable)||e.fire(t),(!this.prevEvent||t.timeStamp>=this.prevEvent.timeStamp)&&(this.prevEvent=t)}},{key:"_doPhase",value:function(t){var e=t.event,n=t.phase,r=t.preEnd,i=t.type,o=this.rect;if(o&&"move"===n&&(H(this.edges,o,this.coords.delta[this.interactable.options.deltaSource]),o.width=o.right-o.left,o.height=o.bottom-o.top),!1===this._scopeFire("interactions:before-action-".concat(n),t))return!1;var a=t.iEvent=this._createPreparedEvent(e,n,r,i);return this._scopeFire("interactions:action-".concat(n),t),"start"===n&&(this.prevEvent=a),this._fireEvent(a),this._scopeFire("interactions:after-action-".concat(n),t),!0}},{key:"_now",value:function(){return Date.now()}}]),t}();function Ie(t){Me(t.interaction)}function Me(t){if(!function(t){return!(!t.offset.pending.x&&!t.offset.pending.y)}(t))return!1;var e=t.offset.pending;return Ae(t.coords.cur,e),Ae(t.coords.delta,e),H(t.edges,t.rect,e),e.x=0,e.y=0,!0}function ze(t){var e=t.x,n=t.y;this.offset.pending.x+=e,this.offset.pending.y+=n,this.offset.total.x+=e,this.offset.total.y+=n}function Ae(t,e){var n=t.page,r=t.client,i=e.x,o=e.y;n.x+=i,n.y+=o,r.x+=i,r.y+=o}Oe.offsetBy="";var Re={id:"offset",before:["modifiers","pointer-events","actions","inertia"],install:function(t){t.Interaction.prototype.offsetBy=ze},listeners:{"interactions:new":function(t){t.interaction.offset={total:{x:0,y:0},pending:{x:0,y:0}}},"interactions:update-pointer":function(t){return function(t){t.pointerIsDown&&(Ae(t.coords.cur,t.offset.total),t.offset.pending.x=0,t.offset.pending.y=0)}(t.interaction)},"interactions:before-action-start":Ie,"interactions:before-action-move":Ie,"interactions:before-action-end":function(t){var e=t.interaction;if(Me(e))return e.move({offset:!0}),e.end(),!1},"interactions:stop":function(t){var e=t.interaction;e.offset.total.x=0,e.offset.total.y=0,e.offset.pending.x=0,e.offset.pending.y=0}}},Ce=Re;var je=function(){function t(e){r(this,t),this.active=!1,this.isModified=!1,this.smoothEnd=!1,this.allowResume=!1,this.modification=void 0,this.modifierCount=0,this.modifierArg=void 0,this.startCoords=void 0,this.t0=0,this.v0=0,this.te=0,this.targetOffset=void 0,this.modifiedOffset=void 0,this.currentOffset=void 0,this.lambda_v0=0,this.one_ve_v0=0,this.timeout=void 0,this.interaction=void 0,this.interaction=e}return o(t,[{key:"start",value:function(t){var e=this.interaction,n=Fe(e);if(!n||!n.enabled)return!1;var r=e.coords.velocity.client,i=Q(r.x,r.y),o=this.modification||(this.modification=new me(e));if(o.copyFrom(e.modification),this.t0=e._now(),this.allowResume=n.allowResume,this.v0=i,this.currentOffset={x:0,y:0},this.startCoords=e.coords.cur.page,this.modifierArg=o.fillArg({pageCoords:this.startCoords,preEnd:!0,phase:"inertiastart"}),this.t0-e.coords.cur.timeStamp<50&&i>n.minSpeed&&i>n.endSpeed)this.startInertia();else{if(o.result=o.setAll(this.modifierArg),!o.result.changed)return!1;this.startSmoothEnd()}return e.modification.result.rect=null,e.offsetBy(this.targetOffset),e._doPhase({interaction:e,event:t,phase:"inertiastart"}),e.offsetBy({x:-this.targetOffset.x,y:-this.targetOffset.y}),e.modification.result.rect=null,this.active=!0,e.simulation=this,!0}},{key:"startInertia",value:function(){var t=this,e=this.interaction.coords.velocity.client,n=Fe(this.interaction),r=n.resistance,i=-Math.log(n.endSpeed/this.v0)/r;this.targetOffset={x:(e.x-i)/r,y:(e.y-i)/r},this.te=i,this.lambda_v0=r/this.v0,this.one_ve_v0=1-n.endSpeed/this.v0;var o=this.modification,a=this.modifierArg;a.pageCoords={x:this.startCoords.x+this.targetOffset.x,y:this.startCoords.y+this.targetOffset.y},o.result=o.setAll(a),o.result.changed&&(this.isModified=!0,this.modifiedOffset={x:this.targetOffset.x+o.result.delta.x,y:this.targetOffset.y+o.result.delta.y}),this.onNextFrame((function(){return t.inertiaTick()}))}},{key:"startSmoothEnd",value:function(){var t=this;this.smoothEnd=!0,this.isModified=!0,this.targetOffset={x:this.modification.result.delta.x,y:this.modification.result.delta.y},this.onNextFrame((function(){return t.smoothEndTick()}))}},{key:"onNextFrame",value:function(t){var e=this;this.timeout=Lt.request((function(){e.active&&t()}))}},{key:"inertiaTick",value:function(){var t,e,n,r,i,o,a,s=this,c=this.interaction,l=Fe(c).resistance,u=(c._now()-this.t0)/1e3;if(u<this.te){var p,f=1-(Math.exp(-l*u)-this.lambda_v0)/this.one_ve_v0;this.isModified?(t=0,e=0,n=this.targetOffset.x,r=this.targetOffset.y,i=this.modifiedOffset.x,o=this.modifiedOffset.y,p={x:Ye(a=f,t,n,i),y:Ye(a,e,r,o)}):p={x:this.targetOffset.x*f,y:this.targetOffset.y*f};var d={x:p.x-this.currentOffset.x,y:p.y-this.currentOffset.y};this.currentOffset.x+=d.x,this.currentOffset.y+=d.y,c.offsetBy(d),c.move(),this.onNextFrame((function(){return s.inertiaTick()}))}else c.offsetBy({x:this.modifiedOffset.x-this.currentOffset.x,y:this.modifiedOffset.y-this.currentOffset.y}),this.end()}},{key:"smoothEndTick",value:function(){var t=this,e=this.interaction,n=e._now()-this.t0,r=Fe(e).smoothEndDuration;if(n<r){var i={x:Le(n,0,this.targetOffset.x,r),y:Le(n,0,this.targetOffset.y,r)},o={x:i.x-this.currentOffset.x,y:i.y-this.currentOffset.y};this.currentOffset.x+=o.x,this.currentOffset.y+=o.y,e.offsetBy(o),e.move({skipModifiers:this.modifierCount}),this.onNextFrame((function(){return t.smoothEndTick()}))}else e.offsetBy({x:this.targetOffset.x-this.currentOffset.x,y:this.targetOffset.y-this.currentOffset.y}),this.end()}},{key:"resume",value:function(t){var e=t.pointer,n=t.event,r=t.eventTarget,i=this.interaction;i.offsetBy({x:-this.currentOffset.x,y:-this.currentOffset.y}),i.updatePointer(e,n,r,!0),i._doPhase({interaction:i,event:n,phase:"resume"}),et(i.coords.prev,i.coords.cur),this.stop()}},{key:"end",value:function(){this.interaction.move(),this.interaction.end(),this.stop()}},{key:"stop",value:function(){this.active=this.smoothEnd=!1,this.interaction.simulation=null,Lt.cancel(this.timeout)}}]),t}();function Fe(t){var e=t.interactable,n=t.prepared;return e&&e.options&&n.name&&e.options[n.name].inertia}var Xe={id:"inertia",before:["modifiers","actions"],install:function(t){var e=t.defaults;t.usePlugin(Ce),t.usePlugin(Ee),t.actions.phases.inertiastart=!0,t.actions.phases.resume=!0,e.perAction.inertia={enabled:!1,resistance:10,minSpeed:100,endSpeed:10,allowResume:!0,smoothEndDuration:300}},listeners:{"interactions:new":function(t){var e=t.interaction;e.inertia=new je(e)},"interactions:before-action-end":function(t){var e=t.interaction,n=t.event;return(!e._interacting||e.simulation||!e.inertia.start(n))&&null},"interactions:down":function(t){var e=t.interaction,n=t.eventTarget,r=e.inertia;if(r.active)for(var i=n;w.element(i);){if(i===e.element){r.resume(t);break}i=A(i)}},"interactions:stop":function(t){var e=t.interaction.inertia;e.active&&e.stop()},"interactions:before-action-resume":function(t){var e=t.interaction.modification;e.stop(t),e.start(t,t.interaction.coords.cur.page),e.applyToInteraction(t)},"interactions:before-action-inertiastart":function(t){return t.interaction.modification.setAndApply(t)},"interactions:action-resume":xe,"interactions:action-inertiastart":xe,"interactions:after-action-inertiastart":function(t){return t.interaction.modification.restoreInteractionCoords(t)},"interactions:after-action-resume":function(t){return t.interaction.modification.restoreInteractionCoords(t)}}};function Ye(t,e,n,r){var i=1-t;return i*i*e+2*i*t*n+t*t*r}function Le(t,e,n,r){return-n*(t/=r)*(t-2)+e}var qe=Xe;function Be(t,e){for(var n=0;n<e.length;n++){var r=e[n];if(t.immediatePropagationStopped)break;r(t)}}var Ve=function(){function t(e){r(this,t),this.options=void 0,this.types={},this.propagationStopped=!1,this.immediatePropagationStopped=!1,this.global=void 0,this.options=V({},e||{})}return o(t,[{key:"fire",value:function(t){var e,n=this.global;(e=this.types[t.type])&&Be(t,e),!t.propagationStopped&&n&&(e=n[t.type])&&Be(t,e)}},{key:"on",value:function(t,e){var n=$(t,e);for(t in n)this.types[t]=gt(this.types[t]||[],n[t])}},{key:"off",value:function(t,e){var n=$(t,e);for(t in n){var r=this.types[t];if(r&&r.length)for(var i=0,o=n[t];i<o.length;i++){var a=o[i],s=r.indexOf(a);-1!==s&&r.splice(s,1)}}}},{key:"getRect",value:function(t){return null}}]),t}();var We=function(){function t(e){r(this,t),this.currentTarget=void 0,this.originalEvent=void 0,this.type=void 0,this.originalEvent=e,tt(this,e)}return o(t,[{key:"preventOriginalDefault",value:function(){this.originalEvent.preventDefault()}},{key:"stopPropagation",value:function(){this.originalEvent.stopPropagation()}},{key:"stopImmediatePropagation",value:function(){this.originalEvent.stopImmediatePropagation()}}]),t}();function Ge(t){return w.object(t)?{capture:!!t.capture,passive:!!t.passive}:{capture:!!t,passive:!1}}function Ne(t,e){return t===e||("boolean"==typeof t?!!e.capture===t&&!1==!!e.passive:!!t.capture==!!e.capture&&!!t.passive==!!e.passive)}var Ue={id:"events",install:function(t){var e,n=[],r={},i=[],o={add:a,remove:s,addDelegate:function(t,e,n,o,s){var u=Ge(s);if(!r[n]){r[n]=[];for(var p=0;p<i.length;p++){var f=i[p];a(f,n,c),a(f,n,l,!0)}}var d=r[n],h=bt(d,(function(n){return n.selector===t&&n.context===e}));h||(h={selector:t,context:e,listeners:[]},d.push(h));h.listeners.push({func:o,options:u})},removeDelegate:function(t,e,n,i,o){var a,u=Ge(o),p=r[n],f=!1;if(!p)return;for(a=p.length-1;a>=0;a--){var d=p[a];if(d.selector===t&&d.context===e){for(var h=d.listeners,v=h.length-1;v>=0;v--){var g=h[v];if(g.func===i&&Ne(g.options,u)){h.splice(v,1),h.length||(p.splice(a,1),s(e,n,c),s(e,n,l,!0)),f=!0;break}}if(f)break}}},delegateListener:c,delegateUseCapture:l,delegatedEvents:r,documents:i,targets:n,supportsOptions:!1,supportsPassive:!1};function a(t,e,r,i){if(t.addEventListener){var a=Ge(i),s=bt(n,(function(e){return e.eventTarget===t}));s||(s={eventTarget:t,events:{}},n.push(s)),s.events[e]||(s.events[e]=[]),bt(s.events[e],(function(t){return t.func===r&&Ne(t.options,a)}))||(t.addEventListener(e,r,o.supportsOptions?a:a.capture),s.events[e].push({func:r,options:a}))}}function s(t,e,r,i){if(t.addEventListener&&t.removeEventListener){var a=yt(n,(function(e){return e.eventTarget===t})),c=n[a];if(c&&c.events)if("all"!==e){var l=!1,u=c.events[e];if(u){if("all"===r){for(var p=u.length-1;p>=0;p--){var f=u[p];s(t,e,f.func,f.options)}return}for(var d=Ge(i),h=0;h<u.length;h++){var v=u[h];if(v.func===r&&Ne(v.options,d)){t.removeEventListener(e,r,o.supportsOptions?d:d.capture),u.splice(h,1),0===u.length&&(delete c.events[e],l=!0);break}}}l&&!Object.keys(c.events).length&&n.splice(a,1)}else for(e in c.events)c.events.hasOwnProperty(e)&&s(t,e,"all")}}function c(t,e){for(var n=Ge(e),i=new We(t),o=r[t.type],a=ht(t)[0],s=a;w.element(s);){for(var c=0;c<o.length;c++){var l=o[c],u=l.selector,p=l.context;if(R(s,u)&&M(p,a)&&M(p,s)){var f=l.listeners;i.currentTarget=s;for(var d=0;d<f.length;d++){var h=f[d];Ne(h.options,n)&&h.func(i)}}}s=A(s)}}function l(t){return c(t,!0)}return null==(e=t.document)||e.createElement("div").addEventListener("test",null,{get capture(){return o.supportsOptions=!0},get passive(){return o.supportsPassive=!0}}),t.events=o,o}},He={methodOrder:["simulationResume","mouseOrPen","hasPointer","idle"],search:function(t){for(var e=0,n=He.methodOrder;e<n.length;e++){var r=n[e],i=He[r](t);if(i)return i}return null},simulationResume:function(t){var e=t.pointerType,n=t.eventType,r=t.eventTarget,i=t.scope;if(!/down|start/i.test(n))return null;for(var o=0,a=i.interactions.list;o<a.length;o++){var s=a[o],c=r;if(s.simulation&&s.simulation.allowResume&&s.pointerType===e)for(;c;){if(c===s.element)return s;c=A(c)}}return null},mouseOrPen:function(t){var e,n=t.pointerId,r=t.pointerType,i=t.eventType,o=t.scope;if("mouse"!==r&&"pen"!==r)return null;for(var a=0,s=o.interactions.list;a<s.length;a++){var c=s[a];if(c.pointerType===r){if(c.simulation&&!Ke(c,n))continue;if(c.interacting())return c;e||(e=c)}}if(e)return e;for(var l=0,u=o.interactions.list;l<u.length;l++){var p=u[l];if(!(p.pointerType!==r||/down/i.test(i)&&p.simulation))return p}return null},hasPointer:function(t){for(var e=t.pointerId,n=0,r=t.scope.interactions.list;n<r.length;n++){var i=r[n];if(Ke(i,e))return i}return null},idle:function(t){for(var e=t.pointerType,n=0,r=t.scope.interactions.list;n<r.length;n++){var i=r[n];if(1===i.pointers.length){var o=i.interactable;if(o&&(!o.options.gesture||!o.options.gesture.enabled))continue}else if(i.pointers.length>=2)continue;if(!i.interacting()&&e===i.pointerType)return i}return null}};function Ke(t,e){return t.pointers.some((function(t){return t.id===e}))}var $e=He,Je=["pointerDown","pointerMove","pointerUp","updatePointer","removePointer","windowBlur"];function Qe(t,e){return function(n){var r=e.interactions.list,i=dt(n),o=ht(n),a=o[0],s=o[1],c=[];if(/^touch/.test(n.type)){e.prevTouchTime=e.now();for(var l=0,u=n.changedTouches;l<u.length;l++){var p=u[l],f={pointer:p,pointerId:at(p),pointerType:i,eventType:n.type,eventTarget:a,curEventTarget:s,scope:e},d=Ze(f);c.push([f.pointer,f.eventTarget,f.curEventTarget,d])}}else{var h=!1;if(!I.supportsPointerEvent&&/mouse/.test(n.type)){for(var v=0;v<r.length&&!h;v++)h="mouse"!==r[v].pointerType&&r[v].pointerIsDown;h=h||e.now()-e.prevTouchTime<500||0===n.timeStamp}if(!h){var g={pointer:n,pointerId:at(n),pointerType:i,eventType:n.type,curEventTarget:s,eventTarget:a,scope:e},m=Ze(g);c.push([g.pointer,g.eventTarget,g.curEventTarget,m])}}for(var y=0;y<c.length;y++){var b=c[y],x=b[0],w=b[1],E=b[2];b[3][t](x,n,w,E)}}}function Ze(t){var e=t.pointerType,n=t.scope,r={interaction:$e.search(t),searchDetails:t};return n.fire("interactions:find",r),r.interaction||n.interactions.new({pointerType:e})}function tn(t,e){var n=t.doc,r=t.scope,i=t.options,o=r.interactions.docEvents,a=r.events,s=a[e];for(var c in r.browser.isIOS&&!i.events&&(i.events={passive:!1}),a.delegatedEvents)s(n,c,a.delegateListener),s(n,c,a.delegateUseCapture,!0);for(var l=i&&i.events,u=0;u<o.length;u++){var p=o[u];s(n,p.type,p.listener,l)}}var en={id:"core/interactions",install:function(t){for(var e={},n=0;n<Je.length;n++){var i=Je[n];e[i]=Qe(i,t)}var a,c=I.pEventTypes;function l(){for(var e=0,n=t.interactions.list;e<n.length;e++){var r=n[e];if(r.pointerIsDown&&"touch"===r.pointerType&&!r._interacting)for(var i=function(){var e=a[o];t.documents.some((function(t){return M(t.doc,e.downTarget)}))||r.removePointer(e.pointer,e.event)},o=0,a=r.pointers;o<a.length;o++)i()}}(a=k.PointerEvent?[{type:c.down,listener:l},{type:c.down,listener:e.pointerDown},{type:c.move,listener:e.pointerMove},{type:c.up,listener:e.pointerUp},{type:c.cancel,listener:e.pointerUp}]:[{type:"mousedown",listener:e.pointerDown},{type:"mousemove",listener:e.pointerMove},{type:"mouseup",listener:e.pointerUp},{type:"touchstart",listener:l},{type:"touchstart",listener:e.pointerDown},{type:"touchmove",listener:e.pointerMove},{type:"touchend",listener:e.pointerUp},{type:"touchcancel",listener:e.pointerUp}]).push({type:"blur",listener:function(e){for(var n=0,r=t.interactions.list;n<r.length;n++){r[n].documentBlur(e)}}}),t.prevTouchTime=0,t.Interaction=function(e){s(i,e);var n=p(i);function i(){return r(this,i),n.apply(this,arguments)}return o(i,[{key:"pointerMoveTolerance",get:function(){return t.interactions.pointerMoveTolerance},set:function(e){t.interactions.pointerMoveTolerance=e}},{key:"_now",value:function(){return t.now()}}]),i}(De),t.interactions={list:[],new:function(e){e.scopeFire=function(e,n){return t.fire(e,n)};var n=new t.Interaction(e);return t.interactions.list.push(n),n},listeners:e,docEvents:a,pointerMoveTolerance:1},t.usePlugin(he)},listeners:{"scope:add-document":function(t){return tn(t,"add")},"scope:remove-document":function(t){return tn(t,"remove")},"interactable:unset":function(t,e){for(var n=t.interactable,r=e.interactions.list.length-1;r>=0;r--){var i=e.interactions.list[r];i.interactable===n&&(i.stop(),e.fire("interactions:destroy",{interaction:i}),i.destroy(),e.interactions.list.length>2&&e.interactions.list.splice(r,1))}}},onDocSignal:tn,doOnInteractions:Qe,methodNames:Je},nn=en,rn=function(t){return t[t.On=0]="On",t[t.Off=1]="Off",t}(rn||{}),on=function(){function t(e,n,i,o){r(this,t),this.target=void 0,this.options=void 0,this._actions=void 0,this.events=new Ve,this._context=void 0,this._win=void 0,this._doc=void 0,this._scopeEvents=void 0,this._actions=n.actions,this.target=e,this._context=n.context||i,this._win=y(B(e)?this._context:e),this._doc=this._win.document,this._scopeEvents=o,this.set(n)}return o(t,[{key:"_defaults",get:function(){return{base:{},perAction:{},actions:{}}}},{key:"setOnEvents",value:function(t,e){return w.func(e.onstart)&&this.on("".concat(t,"start"),e.onstart),w.func(e.onmove)&&this.on("".concat(t,"move"),e.onmove),w.func(e.onend)&&this.on("".concat(t,"end"),e.onend),w.func(e.oninertiastart)&&this.on("".concat(t,"inertiastart"),e.oninertiastart),this}},{key:"updatePerActionListeners",value:function(t,e,n){var r,i=this,o=null==(r=this._actions.map[t])?void 0:r.filterEventType,a=function(t){return(null==o||o(t))&&ve(t,i._actions)};(w.array(e)||w.object(e))&&this._onOff(rn.Off,t,e,void 0,a),(w.array(n)||w.object(n))&&this._onOff(rn.On,t,n,void 0,a)}},{key:"setPerAction",value:function(t,e){var n=this._defaults;for(var r in e){var i=r,o=this.options[t],a=e[i];"listeners"===i&&this.updatePerActionListeners(t,o.listeners,a),w.array(a)?o[i]=mt(a):w.plainObject(a)?(o[i]=V(o[i]||{},ge(a)),w.object(n.perAction[i])&&"enabled"in n.perAction[i]&&(o[i].enabled=!1!==a.enabled)):w.bool(a)&&w.object(n.perAction[i])?o[i].enabled=a:o[i]=a}}},{key:"getRect",value:function(t){return t=t||(w.element(this.target)?this.target:null),w.string(this.target)&&(t=t||this._context.querySelector(this.target)),L(t)}},{key:"rectChecker",value:function(t){var e=this;return w.func(t)?(this.getRect=function(n){var r=V({},t.apply(e,n));return"width"in r||(r.width=r.right-r.left,r.height=r.bottom-r.top),r},this):null===t?(delete this.getRect,this):this.getRect}},{key:"_backCompatOption",value:function(t,e){if(B(e)||w.object(e)){for(var n in this.options[t]=e,this._actions.map)this.options[n][t]=e;return this}return this.options[t]}},{key:"origin",value:function(t){return this._backCompatOption("origin",t)}},{key:"deltaSource",value:function(t){return"page"===t||"client"===t?(this.options.deltaSource=t,this):this.options.deltaSource}},{key:"getAllElements",value:function(){var t=this.target;return w.string(t)?Array.from(this._context.querySelectorAll(t)):w.func(t)&&t.getAllElements?t.getAllElements():w.element(t)?[t]:[]}},{key:"context",value:function(){return this._context}},{key:"inContext",value:function(t){return this._context===t.ownerDocument||M(this._context,t)}},{key:"testIgnoreAllow",value:function(t,e,n){return!this.testIgnore(t.ignoreFrom,e,n)&&this.testAllow(t.allowFrom,e,n)}},{key:"testAllow",value:function(t,e,n){return!t||!!w.element(n)&&(w.string(t)?F(n,t,e):!!w.element(t)&&M(t,n))}},{key:"testIgnore",value:function(t,e,n){return!(!t||!w.element(n))&&(w.string(t)?F(n,t,e):!!w.element(t)&&M(t,n))}},{key:"fire",value:function(t){return this.events.fire(t),this}},{key:"_onOff",value:function(t,e,n,r,i){w.object(e)&&!w.array(e)&&(r=n,n=null);var o=$(e,n,i);for(var a in o){"wheel"===a&&(a=I.wheelEvent);for(var s=0,c=o[a];s<c.length;s++){var l=c[s];ve(a,this._actions)?this.events[t===rn.On?"on":"off"](a,l):w.string(this.target)?this._scopeEvents[t===rn.On?"addDelegate":"removeDelegate"](this.target,this._context,a,l,r):this._scopeEvents[t===rn.On?"add":"remove"](this.target,a,l,r)}}return this}},{key:"on",value:function(t,e,n){return this._onOff(rn.On,t,e,n)}},{key:"off",value:function(t,e,n){return this._onOff(rn.Off,t,e,n)}},{key:"set",value:function(t){var e=this._defaults;for(var n in w.object(t)||(t={}),this.options=ge(e.base),this._actions.methodDict){var r=n,i=this._actions.methodDict[r];this.options[r]={},this.setPerAction(r,V(V({},e.perAction),e.actions[r])),this[i](t[r])}for(var o in t)"getRect"!==o?w.func(this[o])&&this[o](t[o]):this.rectChecker(t.getRect);return this}},{key:"unset",value:function(){if(w.string(this.target))for(var t in this._scopeEvents.delegatedEvents)for(var e=this._scopeEvents.delegatedEvents[t],n=e.length-1;n>=0;n--){var r=e[n],i=r.selector,o=r.context,a=r.listeners;i===this.target&&o===this._context&&e.splice(n,1);for(var s=a.length-1;s>=0;s--)this._scopeEvents.removeDelegate(this.target,this._context,t,a[s][0],a[s][1])}else this._scopeEvents.remove(this.target,"all")}}]),t}(),an=function(){function t(e){var n=this;r(this,t),this.list=[],this.selectorMap={},this.scope=void 0,this.scope=e,e.addListeners({"interactable:unset":function(t){var e=t.interactable,r=e.target,i=w.string(r)?n.selectorMap[r]:r[n.scope.id],o=yt(i,(function(t){return t===e}));i.splice(o,1)}})}return o(t,[{key:"new",value:function(t,e){e=V(e||{},{actions:this.scope.actions});var n=new this.scope.Interactable(t,e,this.scope.document,this.scope.events);return this.scope.addDocument(n._doc),this.list.push(n),w.string(t)?(this.selectorMap[t]||(this.selectorMap[t]=[]),this.selectorMap[t].push(n)):(n.target[this.scope.id]||Object.defineProperty(t,this.scope.id,{value:[],configurable:!0}),t[this.scope.id].push(n)),this.scope.fire("interactable:new",{target:t,options:e,interactable:n,win:this.scope._win}),n}},{key:"getExisting",value:function(t,e){var n=e&&e.context||this.scope.document,r=w.string(t),i=r?this.selectorMap[t]:t[this.scope.id];if(i)return bt(i,(function(e){return e._context===n&&(r||e.inContext(t))}))}},{key:"forEachMatch",value:function(t,e){for(var n=0,r=this.list;n<r.length;n++){var i=r[n],o=void 0;if((w.string(i.target)?w.element(t)&&R(t,i.target):t===i.target)&&i.inContext(t)&&(o=e(i)),void 0!==o)return o}}}]),t}();var sn=function(){function t(){var e=this;r(this,t),this.id="__interact_scope_".concat(Math.floor(100*Math.random())),this.isInitialized=!1,this.listenerMaps=[],this.browser=I,this.defaults=ge(Te),this.Eventable=Ve,this.actions={map:{},phases:{start:!0,move:!0,end:!0},methodDict:{},phaselessTypes:{}},this.interactStatic=function(t){var e=function e(n,r){var i=t.interactables.getExisting(n,r);return i||((i=t.interactables.new(n,r)).events.global=e.globalEvents),i};return e.getPointerAverage=lt,e.getTouchBBox=ut,e.getTouchDistance=pt,e.getTouchAngle=ft,e.getElementRect=L,e.getElementClientRect=Y,e.matchesSelector=R,e.closest=z,e.globalEvents={},e.version="1.10.27",e.scope=t,e.use=function(t,e){return this.scope.usePlugin(t,e),this},e.isSet=function(t,e){return!!this.scope.interactables.get(t,e&&e.context)},e.on=Nt((function(t,e,n){if(w.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),w.array(t)){for(var r=0,i=t;r<i.length;r++){var o=i[r];this.on(o,e,n)}return this}if(w.object(t)){for(var a in t)this.on(a,t[a],e);return this}return ve(t,this.scope.actions)?this.globalEvents[t]?this.globalEvents[t].push(e):this.globalEvents[t]=[e]:this.scope.events.add(this.scope.document,t,e,{options:n}),this}),"The interact.on() method is being deprecated"),e.off=Nt((function(t,e,n){if(w.string(t)&&-1!==t.search(" ")&&(t=t.trim().split(/ +/)),w.array(t)){for(var r=0,i=t;r<i.length;r++){var o=i[r];this.off(o,e,n)}return this}if(w.object(t)){for(var a in t)this.off(a,t[a],e);return this}var s;return ve(t,this.scope.actions)?t in this.globalEvents&&-1!==(s=this.globalEvents[t].indexOf(e))&&this.globalEvents[t].splice(s,1):this.scope.events.remove(this.scope.document,t,e,n),this}),"The interact.off() method is being deprecated"),e.debug=function(){return this.scope},e.supportsTouch=function(){return I.supportsTouch},e.supportsPointerEvent=function(){return I.supportsPointerEvent},e.stop=function(){for(var t=0,e=this.scope.interactions.list;t<e.length;t++)e[t].stop();return this},e.pointerMoveTolerance=function(t){return w.number(t)?(this.scope.interactions.pointerMoveTolerance=t,this):this.scope.interactions.pointerMoveTolerance},e.addDocument=function(t,e){this.scope.addDocument(t,e)},e.removeDocument=function(t){this.scope.removeDocument(t)},e}(this),this.InteractEvent=Se,this.Interactable=void 0,this.interactables=new an(this),this._win=void 0,this.document=void 0,this.window=void 0,this.documents=[],this._plugins={list:[],map:{}},this.onWindowUnload=function(t){return e.removeDocument(t.target)};var n=this;this.Interactable=function(t){s(i,t);var e=p(i);function i(){return r(this,i),e.apply(this,arguments)}return o(i,[{key:"_defaults",get:function(){return n.defaults}},{key:"set",value:function(t){return f(c(i.prototype),"set",this).call(this,t),n.fire("interactable:set",{options:t,interactable:this}),this}},{key:"unset",value:function(){f(c(i.prototype),"unset",this).call(this);var t=n.interactables.list.indexOf(this);t<0||(n.interactables.list.splice(t,1),n.fire("interactable:unset",{interactable:this}))}}]),i}(on)}return o(t,[{key:"addListeners",value:function(t,e){this.listenerMaps.push({id:e,map:t})}},{key:"fire",value:function(t,e){for(var n=0,r=this.listenerMaps;n<r.length;n++){var i=r[n].map[t];if(i&&!1===i(e,this,t))return!1}}},{key:"init",value:function(t){return this.isInitialized?this:function(t,e){t.isInitialized=!0,w.window(e)&&m(e);return k.init(e),I.init(e),Lt.init(e),t.window=e,t.document=e.document,t.usePlugin(nn),t.usePlugin(Ue),t}(this,t)}},{key:"pluginIsInstalled",value:function(t){var e=t.id;return e?!!this._plugins.map[e]:-1!==this._plugins.list.indexOf(t)}},{key:"usePlugin",value:function(t,e){if(!this.isInitialized)return this;if(this.pluginIsInstalled(t))return this;if(t.id&&(this._plugins.map[t.id]=t),this._plugins.list.push(t),t.install&&t.install(this,e),t.listeners&&t.before){for(var n=0,r=this.listenerMaps.length,i=t.before.reduce((function(t,e){return t[e]=!0,t[cn(e)]=!0,t}),{});n<r;n++){var o=this.listenerMaps[n].id;if(o&&(i[o]||i[cn(o)]))break}this.listenerMaps.splice(n,0,{id:t.id,map:t.listeners})}else t.listeners&&this.listenerMaps.push({id:t.id,map:t.listeners});return this}},{key:"addDocument",value:function(t,e){if(-1!==this.getDocIndex(t))return!1;var n=y(t);e=e?V({},e):{},this.documents.push({doc:t,options:e}),this.events.documents.push(t),t!==this.document&&this.events.add(n,"unload",this.onWindowUnload),this.fire("scope:add-document",{doc:t,window:n,scope:this,options:e})}},{key:"removeDocument",value:function(t){var e=this.getDocIndex(t),n=y(t),r=this.documents[e].options;this.events.remove(n,"unload",this.onWindowUnload),this.documents.splice(e,1),this.events.documents.splice(e,1),this.fire("scope:remove-document",{doc:t,window:n,scope:this,options:r})}},{key:"getDocIndex",value:function(t){for(var e=0;e<this.documents.length;e++)if(this.documents[e].doc===t)return e;return-1}},{key:"getDocOptions",value:function(t){var e=this.getDocIndex(t);return-1===e?null:this.documents[e].options}},{key:"now",value:function(){return(this.window.Date||Date).now()}}]),t}();function cn(t){return t&&t.replace(/\/.*$/,"")}var ln=new sn,un=ln.interactStatic,pn="undefined"!=typeof globalThis?globalThis:window;ln.init(pn);var fn=Object.freeze({__proto__:null,edgeTarget:function(){},elements:function(){},grid:function(t){var e=[["x","y"],["left","top"],["right","bottom"],["width","height"]].filter((function(e){var n=e[0],r=e[1];return n in t||r in t})),n=function(n,r){for(var i=t.range,o=t.limits,a=void 0===o?{left:-1/0,right:1/0,top:-1/0,bottom:1/0}:o,s=t.offset,c=void 0===s?{x:0,y:0}:s,l={range:i,grid:t,x:null,y:null},u=0;u<e.length;u++){var p=e[u],f=p[0],d=p[1],h=Math.round((n-c.x)/t[f]),v=Math.round((r-c.y)/t[d]);l[f]=Math.max(a.left,Math.min(a.right,h*t[f]+c.x)),l[d]=Math.max(a.top,Math.min(a.bottom,v*t[d]+c.y))}return l};return n.grid=t,n.coordFields=e,n}}),dn={id:"snappers",install:function(t){var e=t.interactStatic;e.snappers=V(e.snappers||{},fn),e.createSnapGrid=e.snappers.grid}},hn=dn,vn={start:function(t){var n=t.state,r=t.rect,i=t.edges,o=t.pageCoords,a=n.options,s=a.ratio,c=a.enabled,l=n.options,u=l.equalDelta,p=l.modifiers;"preserve"===s&&(s=r.width/r.height),n.startCoords=V({},o),n.startRect=V({},r),n.ratio=s,n.equalDelta=u;var f=n.linkedEdges={top:i.top||i.left&&!i.bottom,left:i.left||i.top&&!i.right,bottom:i.bottom||i.right&&!i.top,right:i.right||i.bottom&&!i.left};if(n.xIsPrimaryAxis=!(!i.left&&!i.right),n.equalDelta){var d=(f.left?1:-1)*(f.top?1:-1);n.edgeSign={x:d,y:d}}else n.edgeSign={x:f.left?-1:1,y:f.top?-1:1};if(!1!==c&&V(i,f),null!=p&&p.length){var h=new me(t.interaction);h.copyFrom(t.interaction.modification),h.prepareStates(p),n.subModification=h,h.startAll(e({},t))}},set:function(t){var n=t.state,r=t.rect,i=t.coords,o=n.linkedEdges,a=V({},i),s=n.equalDelta?gn:mn;if(V(t.edges,o),s(n,n.xIsPrimaryAxis,i,r),!n.subModification)return null;var c=V({},r);H(o,c,{x:i.x-a.x,y:i.y-a.y});var l=n.subModification.setAll(e(e({},t),{},{rect:c,edges:o,pageCoords:i,prevCoords:i,prevRect:c})),u=l.delta;l.changed&&(s(n,Math.abs(u.x)>Math.abs(u.y),l.coords,l.rect),V(i,l.coords));return l.eventProps},defaults:{ratio:"preserve",equalDelta:!1,modifiers:[],enabled:!1}};function gn(t,e,n){var r=t.startCoords,i=t.edgeSign;e?n.y=r.y+(n.x-r.x)*i.y:n.x=r.x+(n.y-r.y)*i.x}function mn(t,e,n,r){var i=t.startRect,o=t.startCoords,a=t.ratio,s=t.edgeSign;if(e){var c=r.width/a;n.y=o.y+(c-i.height)*s.y}else{var l=r.height*a;n.x=o.x+(l-i.width)*s.x}}var yn=be(vn,"aspectRatio"),bn=function(){};bn._defaults={};var xn=bn;function wn(t,e,n){return w.func(t)?G(t,e.interactable,e.element,[n.x,n.y,e]):G(t,e.interactable,e.element)}var En={start:function(t){var e=t.rect,n=t.startOffset,r=t.state,i=t.interaction,o=t.pageCoords,a=r.options,s=a.elementRect,c=V({left:0,top:0,right:0,bottom:0},a.offset||{});if(e&&s){var l=wn(a.restriction,i,o);if(l){var u=l.right-l.left-e.width,p=l.bottom-l.top-e.height;u<0&&(c.left+=u,c.right+=u),p<0&&(c.top+=p,c.bottom+=p)}c.left+=n.left-e.width*s.left,c.top+=n.top-e.height*s.top,c.right+=n.right-e.width*(1-s.right),c.bottom+=n.bottom-e.height*(1-s.bottom)}r.offset=c},set:function(t){var e=t.coords,n=t.interaction,r=t.state,i=r.options,o=r.offset,a=wn(i.restriction,n,e);if(a){var s=function(t){return!t||"left"in t&&"top"in t||((t=V({},t)).left=t.x||0,t.top=t.y||0,t.right=t.right||t.left+t.width,t.bottom=t.bottom||t.top+t.height),t}(a);e.x=Math.max(Math.min(s.right-o.right,e.x),s.left+o.left),e.y=Math.max(Math.min(s.bottom-o.bottom,e.y),s.top+o.top)}},defaults:{restriction:null,elementRect:null,offset:null,endOnly:!1,enabled:!1}},Tn=be(En,"restrict"),Sn={top:1/0,left:1/0,bottom:-1/0,right:-1/0},_n={top:-1/0,left:-1/0,bottom:1/0,right:1/0};function Pn(t,e){for(var n=0,r=["top","left","bottom","right"];n<r.length;n++){var i=r[n];i in t||(t[i]=e[i])}return t}var On={noInner:Sn,noOuter:_n,start:function(t){var e,n=t.interaction,r=t.startOffset,i=t.state,o=i.options;o&&(e=N(wn(o.offset,n,n.coords.start.page))),e=e||{x:0,y:0},i.offset={top:e.y+r.top,left:e.x+r.left,bottom:e.y-r.bottom,right:e.x-r.right}},set:function(t){var e=t.coords,n=t.edges,r=t.interaction,i=t.state,o=i.offset,a=i.options;if(n){var s=V({},e),c=wn(a.inner,r,s)||{},l=wn(a.outer,r,s)||{};Pn(c,Sn),Pn(l,_n),n.top?e.y=Math.min(Math.max(l.top+o.top,s.y),c.top+o.top):n.bottom&&(e.y=Math.max(Math.min(l.bottom+o.bottom,s.y),c.bottom+o.bottom)),n.left?e.x=Math.min(Math.max(l.left+o.left,s.x),c.left+o.left):n.right&&(e.x=Math.max(Math.min(l.right+o.right,s.x),c.right+o.right))}},defaults:{inner:null,outer:null,offset:null,endOnly:!1,enabled:!1}},kn=be(On,"restrictEdges"),Dn=V({get elementRect(){return{top:0,left:0,bottom:1,right:1}},set elementRect(t){}},En.defaults),In=be({start:En.start,set:En.set,defaults:Dn},"restrictRect"),Mn={width:-1/0,height:-1/0},zn={width:1/0,height:1/0};var An=be({start:function(t){return On.start(t)},set:function(t){var e=t.interaction,n=t.state,r=t.rect,i=t.edges,o=n.options;if(i){var a=U(wn(o.min,e,t.coords))||Mn,s=U(wn(o.max,e,t.coords))||zn;n.options={endOnly:o.endOnly,inner:V({},On.noInner),outer:V({},On.noOuter)},i.top?(n.options.inner.top=r.bottom-a.height,n.options.outer.top=r.bottom-s.height):i.bottom&&(n.options.inner.bottom=r.top+a.height,n.options.outer.bottom=r.top+s.height),i.left?(n.options.inner.left=r.right-a.width,n.options.outer.left=r.right-s.width):i.right&&(n.options.inner.right=r.left+a.width,n.options.outer.right=r.left+s.width),On.set(t),n.options=o}},defaults:{min:null,max:null,endOnly:!1,enabled:!1}},"restrictSize");var Rn={start:function(t){var e,n=t.interaction,r=t.interactable,i=t.element,o=t.rect,a=t.state,s=t.startOffset,c=a.options,l=c.offsetWithOrigin?function(t){var e=t.interaction.element,n=N(G(t.state.options.origin,null,null,[e])),r=n||K(t.interactable,e,t.interaction.prepared.name);return r}(t):{x:0,y:0};if("startCoords"===c.offset)e={x:n.coords.start.page.x,y:n.coords.start.page.y};else{var u=G(c.offset,r,i,[n]);(e=N(u)||{x:0,y:0}).x+=l.x,e.y+=l.y}var p=c.relativePoints;a.offsets=o&&p&&p.length?p.map((function(t,n){return{index:n,relativePoint:t,x:s.left-o.width*t.x+e.x,y:s.top-o.height*t.y+e.y}})):[{index:0,relativePoint:null,x:e.x,y:e.y}]},set:function(t){var e=t.interaction,n=t.coords,r=t.state,i=r.options,o=r.offsets,a=K(e.interactable,e.element,e.prepared.name),s=V({},n),c=[];i.offsetWithOrigin||(s.x-=a.x,s.y-=a.y);for(var l=0,u=o;l<u.length;l++)for(var p=u[l],f=s.x-p.x,d=s.y-p.y,h=0,v=i.targets.length;h<v;h++){var g=i.targets[h],m=void 0;(m=w.func(g)?g(f,d,e._proxy,p,h):g)&&c.push({x:(w.number(m.x)?m.x:f)+p.x,y:(w.number(m.y)?m.y:d)+p.y,range:w.number(m.range)?m.range:i.range,source:g,index:h,offset:p})}for(var y={target:null,inRange:!1,distance:0,range:0,delta:{x:0,y:0}},b=0;b<c.length;b++){var x=c[b],E=x.range,T=x.x-s.x,S=x.y-s.y,_=Q(T,S),P=_<=E;E===1/0&&y.inRange&&y.range!==1/0&&(P=!1),y.target&&!(P?y.inRange&&E!==1/0?_/E<y.distance/y.range:E===1/0&&y.range!==1/0||_<y.distance:!y.inRange&&_<y.distance)||(y.target=x,y.distance=_,y.range=E,y.inRange=P,y.delta.x=T,y.delta.y=S)}return y.inRange&&(n.x=y.target.x,n.y=y.target.y),r.closest=y,y},defaults:{range:1/0,targets:null,offset:null,offsetWithOrigin:!0,origin:null,relativePoints:null,endOnly:!1,enabled:!1}},Cn=be(Rn,"snap");var jn={start:function(t){var e=t.state,n=t.edges,r=e.options;if(!n)return null;t.state={options:{targets:null,relativePoints:[{x:n.left?0:1,y:n.top?0:1}],offset:r.offset||"self",origin:{x:0,y:0},range:r.range}},e.targetFields=e.targetFields||[["width","height"],["x","y"]],Rn.start(t),e.offsets=t.state.offsets,t.state=e},set:function(t){var e=t.interaction,n=t.state,r=t.coords,i=n.options,o=n.offsets,a={x:r.x-o[0].x,y:r.y-o[0].y};n.options=V({},i),n.options.targets=[];for(var s=0,c=i.targets||[];s<c.length;s++){var l=c[s],u=void 0;if(u=w.func(l)?l(a.x,a.y,e):l){for(var p=0,f=n.targetFields;p<f.length;p++){var d=f[p],h=d[0],v=d[1];if(h in u||v in u){u.x=u[h],u.y=u[v];break}}n.options.targets.push(u)}}var g=Rn.set(t);return n.options=i,g},defaults:{range:1/0,targets:null,offset:null,endOnly:!1,enabled:!1}},Fn=be(jn,"snapSize");var Xn={aspectRatio:yn,restrictEdges:kn,restrict:Tn,restrictRect:In,restrictSize:An,snapEdges:be({start:function(t){var e=t.edges;return e?(t.state.targetFields=t.state.targetFields||[[e.left?"left":"right",e.top?"top":"bottom"]],jn.start(t)):null},set:jn.set,defaults:V(ge(jn.defaults),{targets:void 0,range:void 0,offset:{x:0,y:0}})},"snapEdges"),snap:Cn,snapSize:Fn,spring:xn,avoid:xn,transform:xn,rubberband:xn},Yn={id:"modifiers",install:function(t){var e=t.interactStatic;for(var n in t.usePlugin(Ee),t.usePlugin(hn),e.modifiers=Xn,Xn){var r=Xn[n],i=r._defaults,o=r._methods;i._methods=o,t.defaults.perAction[n]=i}}},Ln=Yn,qn=function(t){s(n,t);var e=p(n);function n(t,i,o,a,s,c){var l;if(r(this,n),tt(u(l=e.call(this,s)),o),o!==i&&tt(u(l),i),l.timeStamp=c,l.originalEvent=o,l.type=t,l.pointerId=at(i),l.pointerType=dt(i),l.target=a,l.currentTarget=null,"tap"===t){var p=s.getPointerIndex(i);l.dt=l.timeStamp-s.pointers[p].downTime;var f=l.timeStamp-s.tapTime;l.double=!!s.prevTap&&"doubletap"!==s.prevTap.type&&s.prevTap.target===l.target&&f<500}else"doubletap"===t&&(l.dt=i.timeStamp-s.tapTime,l.double=!0);return l}return o(n,[{key:"_subtractOrigin",value:function(t){var e=t.x,n=t.y;return this.pageX-=e,this.pageY-=n,this.clientX-=e,this.clientY-=n,this}},{key:"_addOrigin",value:function(t){var e=t.x,n=t.y;return this.pageX+=e,this.pageY+=n,this.clientX+=e,this.clientY+=n,this}},{key:"preventDefault",value:function(){this.originalEvent.preventDefault()}}]),n}(vt),Bn={id:"pointer-events/base",before:["inertia","modifiers","auto-start","actions"],install:function(t){t.pointerEvents=Bn,t.defaults.actions.pointerEvents=Bn.defaults,V(t.actions.phaselessTypes,Bn.types)},listeners:{"interactions:new":function(t){var e=t.interaction;e.prevTap=null,e.tapTime=0},"interactions:update-pointer":function(t){var e=t.down,n=t.pointerInfo;if(!e&&n.hold)return;n.hold={duration:1/0,timeout:null}},"interactions:move":function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;t.duplicate||n.pointerIsDown&&!n.pointerWasMoved||(n.pointerIsDown&&Gn(t),Vn({interaction:n,pointer:r,event:i,eventTarget:o,type:"move"},e))},"interactions:down":function(t,e){!function(t,e){for(var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget,a=t.pointerIndex,s=n.pointers[a].hold,c=q(o),l={interaction:n,pointer:r,event:i,eventTarget:o,type:"hold",targets:[],path:c,node:null},u=0;u<c.length;u++){var p=c[u];l.node=p,e.fire("pointerEvents:collect-targets",l)}if(!l.targets.length)return;for(var f=1/0,d=0,h=l.targets;d<h.length;d++){var v=h[d].eventable.options.holdDuration;v<f&&(f=v)}s.duration=f,s.timeout=setTimeout((function(){Vn({interaction:n,eventTarget:o,pointer:r,event:i,type:"hold"},e)}),f)}(t,e),Vn(t,e)},"interactions:up":function(t,e){Gn(t),Vn(t,e),function(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget;n.pointerWasMoved||Vn({interaction:n,eventTarget:o,pointer:r,event:i,type:"tap"},e)}(t,e)},"interactions:cancel":function(t,e){Gn(t),Vn(t,e)}},PointerEvent:qn,fire:Vn,collectEventTargets:Wn,defaults:{holdDuration:600,ignoreFrom:null,allowFrom:null,origin:{x:0,y:0}},types:{down:!0,move:!0,up:!0,cancel:!0,tap:!0,doubletap:!0,hold:!0}};function Vn(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget,a=t.type,s=t.targets,c=void 0===s?Wn(t,e):s,l=new qn(a,r,i,o,n,e.now());e.fire("pointerEvents:new",{pointerEvent:l});for(var u={interaction:n,pointer:r,event:i,eventTarget:o,targets:c,type:a,pointerEvent:l},p=0;p<c.length;p++){var f=c[p];for(var d in f.props||{})l[d]=f.props[d];var h=K(f.eventable,f.node);if(l._subtractOrigin(h),l.eventable=f.eventable,l.currentTarget=f.node,f.eventable.fire(l),l._addOrigin(h),l.immediatePropagationStopped||l.propagationStopped&&p+1<c.length&&c[p+1].node!==l.currentTarget)break}if(e.fire("pointerEvents:fired",u),"tap"===a){var v=l.double?Vn({interaction:n,pointer:r,event:i,eventTarget:o,type:"doubletap"},e):l;n.prevTap=v,n.tapTime=v.timeStamp}return l}function Wn(t,e){var n=t.interaction,r=t.pointer,i=t.event,o=t.eventTarget,a=t.type,s=n.getPointerIndex(r),c=n.pointers[s];if("tap"===a&&(n.pointerWasMoved||!c||c.downTarget!==o))return[];for(var l=q(o),u={interaction:n,pointer:r,event:i,eventTarget:o,type:a,path:l,targets:[],node:null},p=0;p<l.length;p++){var f=l[p];u.node=f,e.fire("pointerEvents:collect-targets",u)}return"hold"===a&&(u.targets=u.targets.filter((function(t){var e,r;return t.eventable.options.holdDuration===(null==(e=n.pointers[s])||null==(r=e.hold)?void 0:r.duration)}))),u.targets}function Gn(t){var e=t.interaction,n=t.pointerIndex,r=e.pointers[n].hold;r&&r.timeout&&(clearTimeout(r.timeout),r.timeout=null)}var Nn=Object.freeze({__proto__:null,default:Bn});function Un(t){var e=t.interaction;e.holdIntervalHandle&&(clearInterval(e.holdIntervalHandle),e.holdIntervalHandle=null)}var Hn={id:"pointer-events/holdRepeat",install:function(t){t.usePlugin(Bn);var e=t.pointerEvents;e.defaults.holdRepeatInterval=0,e.types.holdrepeat=t.actions.phaselessTypes.holdrepeat=!0},listeners:["move","up","cancel","endall"].reduce((function(t,e){return t["pointerEvents:".concat(e)]=Un,t}),{"pointerEvents:new":function(t){var e=t.pointerEvent;"hold"===e.type&&(e.count=(e.count||0)+1)},"pointerEvents:fired":function(t,e){var n=t.interaction,r=t.pointerEvent,i=t.eventTarget,o=t.targets;if("hold"===r.type&&o.length){var a=o[0].eventable.options.holdRepeatInterval;a<=0||(n.holdIntervalHandle=setTimeout((function(){e.pointerEvents.fire({interaction:n,eventTarget:i,type:"hold",pointer:r,event:r},e)}),a))}}})},Kn=Hn;var $n={id:"pointer-events/interactableTargets",install:function(t){var e=t.Interactable;e.prototype.pointerEvents=function(t){return V(this.events.options,t),this};var n=e.prototype._backCompatOption;e.prototype._backCompatOption=function(t,e){var r=n.call(this,t,e);return r===this&&(this.events.options[t]=e),r}},listeners:{"pointerEvents:collect-targets":function(t,e){var n=t.targets,r=t.node,i=t.type,o=t.eventTarget;e.interactables.forEachMatch(r,(function(t){var e=t.events,a=e.options;e.types[i]&&e.types[i].length&&t.testIgnoreAllow(a,r,o)&&n.push({node:r,eventable:e,props:{interactable:t}})}))},"interactable:new":function(t){var e=t.interactable;e.events.getRect=function(t){return e.getRect(t)}},"interactable:set":function(t,e){var n=t.interactable,r=t.options;V(n.events.options,e.pointerEvents.defaults),V(n.events.options,r.pointerEvents||{})}}},Jn=$n,Qn={id:"pointer-events",install:function(t){t.usePlugin(Nn),t.usePlugin(Kn),t.usePlugin(Jn)}},Zn=Qn;var tr={id:"reflow",install:function(t){var e=t.Interactable;t.actions.phases.reflow=!0,e.prototype.reflow=function(e){return function(t,e,n){for(var r=t.getAllElements(),i=n.window.Promise,o=i?[]:null,a=function(){var a=r[s],c=t.getRect(a);if(!c)return 1;var l,u=bt(n.interactions.list,(function(n){return n.interacting()&&n.interactable===t&&n.element===a&&n.prepared.name===e.name}));if(u)u.move(),o&&(l=u._reflowPromise||new i((function(t){u._reflowResolve=t})));else{var p=U(c),f=function(t){return{coords:t,get page(){return this.coords.page},get client(){return this.coords.client},get timeStamp(){return this.coords.timeStamp},get pageX(){return this.coords.page.x},get pageY(){return this.coords.page.y},get clientX(){return this.coords.client.x},get clientY(){return this.coords.client.y},get pointerId(){return this.coords.pointerId},get target(){return this.coords.target},get type(){return this.coords.type},get pointerType(){return this.coords.pointerType},get buttons(){return this.coords.buttons},preventDefault:function(){}}}({page:{x:p.x,y:p.y},client:{x:p.x,y:p.y},timeStamp:n.now()});l=function(t,e,n,r,i){var o=t.interactions.new({pointerType:"reflow"}),a={interaction:o,event:i,pointer:i,eventTarget:n,phase:"reflow"};o.interactable=e,o.element=n,o.prevEvent=i,o.updatePointer(i,i,n,!0),nt(o.coords.delta),Ut(o.prepared,r),o._doPhase(a);var s=t.window,c=s.Promise,l=c?new c((function(t){o._reflowResolve=t})):void 0;o._reflowPromise=l,o.start(r,e,n),o._interacting?(o.move(a),o.end(i)):(o.stop(),o._reflowResolve());return o.removePointer(i,i),l}(n,t,a,e,f)}o&&o.push(l)},s=0;s<r.length&&!a();s++);return o&&i.all(o).then((function(){return t}))}(this,e,t)}},listeners:{"interactions:stop":function(t,e){var n=t.interaction;"reflow"===n.pointerType&&(n._reflowResolve&&n._reflowResolve(),function(t,e){t.splice(t.indexOf(e),1)}(e.interactions.list,n))}}},er=tr;if(un.use(he),un.use(Ce),un.use(Zn),un.use(qe),un.use(Ln),un.use(pe),un.use(Xt),un.use(Gt),un.use(er),un.default=un,"object"===("undefined"==typeof module?"undefined":n(module))&&module)try{module.exports=un}catch(t){}return un.default=un,un}));


/*
═══════════════════════════════════════════════════════════════
SCISPARK LESSON SHELL v4 · SHARED JAVASCRIPT (B-mode + Widget Runtime)
═══════════════════════════════════════════════════════════════
File: /lesson-shell-v4.js  ·  Vercel URL: /lesson-shell-v4.js
Type: SHARED — used by NEW lessons (Y7 U1 L02+) referencing v4 shell
Base: lesson-shell-v3.js (HEAD 0c9fba7) — copied verbatim, then EXTENDED.
      v3 file itself stays FROZEN (锁 #19 / #21 双文件并存). Do NOT edit v3.
Date: 2026-05-28
Status: NEW — does NOT replace lesson-shell-v3.js. v3 stays for Y7 U1 L01.
        Release tag: lesson-shell@v4.0.0 (set by push window, NOT here · NO_PUSH).

v4 ADDITIONS (per INTERACTION_ENGINE spec §4 / §5 / §8 / §10 / §11):
  + window.LessonShell { mount, unmount, getState, setReducedMotion }
  + interact.js 1.10.27 bundled at top of file (offline drag/drop · no CDN)
  + boot: prefers-reduced-motion auto-detect + OS-change listener
  + showScreen: auto-mount widgets on screen enter / unmount on screen exit
  + beforeunload: snapshot widget state + unmount all (free Canvas/Lottie)
  + 5-layer error fallback (mount fail / asset 404 / no Canvas / interact fail / global)
  NOTE: per-题型 widget logic is NOT here (lives in each widget / Spec 4).
        graph / sketch_graph are NOT implemented here (separate graph build · blocker).
  ALL v3 globals preserved unchanged (showScreen / setLang / submitAnswer / ...).

Architecture: B-mode (Sanchez's original vision)
              External CSS/JS — change once, all lessons auto-update.
              No inline CSS/JS in lesson HTML.

Merged features (16 total):
  v1 (12): TTS · Hint · Show Answer · L1/L2/L3 · XP/Surprise/Toast
           · Spark Bubble · AI Tutor · Doudou · Content Protection
           · Auto-save · Bubble Scripts hook
  v2 (4):  Spark Jar · Constellation Map · Click-spark FX · AI Socratic
           · SparkStreak (paused-not-reset)
  new (1): 5 OGG reward audio + 🔊 mute toggle

Globals exposed (lesson HTML can call directly via onclick=):
  showScreen(id), setLang(mode), submitAnswer(el, isCorrect, opts),
  toggleHint(id), toggleAns(id), selectOpt(qId, el, letter),
  awardXP(amt, src), showToast(msg, opts), completeLesson(),
  closeSurprise(), toggleBubble(), openAITutor(), closeAITutor(),
  toggleMute(), trackProgress(lessonId, screen, status),
  SparkStreak, doudouReact(isCorrect)
═══════════════════════════════════════════════════════════════
*/

(function () {
  'use strict';


  // ═════════════════════════════════════════════════════════════
  // SECTION 1: SUPABASE INIT (from v2 — cleaner CDN fallback)
  // ═════════════════════════════════════════════════════════════
  const SB_URL = 'https://fiffuaoibxeggwxcfvfh.supabase.co';
  const SB_KEY = 'sb_publishable_OOrhuk8oqIbNLg3Wxo6fzQ_7z4sloBJ';

  function ensureSupabase() {
    if (window.sb && typeof window.sb.from === 'function') return Promise.resolve(window.sb);
    if (window.supabase && typeof window.supabase.createClient === 'function') {
      window.sb = window.supabase.createClient(SB_URL, SB_KEY);
      return Promise.resolve(window.sb);
    }
    return new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
      s.onload = () => {
        try {
          window.sb = window.supabase.createClient(SB_URL, SB_KEY);
          resolve(window.sb);
        } catch (e) { resolve(null); }
      };
      s.onerror = () => resolve(null);
      document.head.appendChild(s);
    });
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 2: TTS 13-CLASS 豆豆柔声朗读 (verbatim from v1.js line 103-258)
  // ═════════════════════════════════════════════════════════════

  // TTS state — declared once (were previously used but never declared →
  // strict-mode ReferenceError on ▶ read-aloud). Fix 2026-06-20.
  var ttsSupported = ('speechSynthesis' in window) && ('SpeechSynthesisUtterance' in window);
  var ttsCurrentUtterance = null;
  var ttsCurrentButton = null;

  function ttsToggle(buttonEl, paragraphEl) {
    if (!ttsSupported) return;
  
    if (ttsCurrentButton === buttonEl) {
      ttsStop();
      return;
    }
  
    if (ttsCurrentUtterance) {
      ttsStop();
    }
  
    const isZhMode = document.body.classList.contains('zh-mode');
    const text = isZhMode
      ? (paragraphEl.dataset.zh || '')
      : (paragraphEl.dataset.en || '');
  
    if (!text.trim()) return;
  
    const cleanText = stripHtmlTags(text);
    ttsPlay(cleanText, isZhMode ? 'zh-CN' : 'en-US', buttonEl);
  }
  
  function ttsPlay(text, langCode, buttonEl) {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = langCode;
    // Shared read-aloud speed (single source = voice-profile.js, 5 steps).
    u.rate = (window.SciSparkVoice && window.SciSparkVoice.getRate) ? window.SciSparkVoice.getRate() : 0.9;
    // 豆豆 voice alignment 2026-06-20: long ▶ passages use the shared PITCH_LONG.
    u.pitch = (window.SciSparkVoice && window.SciSparkVoice.PITCH_LONG) || 1.22;
    u.volume = 1.0;
  
    u.onend = () => ttsStop();
    u.onerror = () => ttsStop();

    ttsCurrentUtterance = u;
    ttsCurrentButton = buttonEl;
    buttonEl.classList.add('tts-playing');
    buttonEl.textContent = '⏸';
    buttonEl.setAttribute('aria-label',
      langCode === 'zh-CN' ? '停止朗读' : 'Stop reading');

    // Robust soft-voice speak via the shared profile: waits out the mobile
    // getVoices() race so the soft 豆豆 voice actually plays (never male default).
    // Falls back to inline pickBestVoice + speak if voice-profile.js is absent.
    if (window.SciSparkVoice && window.SciSparkVoice.speak) {
      window.SciSparkVoice.speak(u, langCode);
    } else {
      const voice = pickBestVoice(langCode);
      if (voice) u.voice = voice;
      window.speechSynthesis.speak(u);
    }
  }
  
  function ttsStop() {
    try {
      window.speechSynthesis.cancel();
      setTimeout(() => {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 50);
    } catch(e) {}
    if (ttsCurrentButton) {
      ttsCurrentButton.classList.remove('tts-playing');
      ttsCurrentButton.textContent = '▶';
      ttsCurrentButton.setAttribute('aria-label',
        document.body.classList.contains('zh-mode') ? '朗读这段' : 'Read aloud');
    }
    ttsCurrentUtterance = null;
    ttsCurrentButton = null;
  }
  
  function pickBestVoice(langCode) {
    // Single source of truth = /voice-profile.js (window.SciSparkVoice).
    // Voice alignment 2026-06-20: the whole course uses the soft/high 豆豆 voice.
    if (window.SciSparkVoice && typeof window.SciSparkVoice.pick === 'function') {
      return window.SciSparkVoice.pick(langCode);
    }
    // Inline fallback (mirrors voice-profile.js) so lessons that have not yet
    // loaded voice-profile.js still get the soft/high voice — never the old male one.
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const softEN = ['Female','Samantha','Karen','Tessa','Fiona','Moira','Zira','Aria','Jenny','Susan','Google UK English Female','Google US English'];
    const softZH = ['Ting','Mei-Jia','Huihui','Xiaoxiao','Yaoyao','Google','普通话','Chinese'];
    const softNames = langCode.startsWith('zh') ? softZH : softEN;
    const isSoft = x => softNames.some(n => x.name.includes(n));
    const isNeural = x => x.name.includes('Google') || x.name.includes('Microsoft');

    // 1. Soft/high + Google/Microsoft + exact lang
    let v = voices.find(x => x.lang.startsWith(langCode) && isSoft(x) && isNeural(x));
    if (v) return v;

    // 2. Soft/high + exact lang (any provider)
    v = voices.find(x => x.lang.startsWith(langCode) && isSoft(x));
    if (v) return v;

    // 3. Fallback: Google/Microsoft + exact lang
    v = voices.find(x => x.lang.startsWith(langCode) && isNeural(x));
    if (v) return v;
  
    // 4. Fallback: any voice matching lang
    v = voices.find(x => x.lang.startsWith(langCode));
    if (v) return v;
  
    // 5. Fallback: main language code only
    const mainLang = langCode.split('-')[0];
    v = voices.find(x => x.lang.startsWith(mainLang));
    return v || null;
  }
  
  function stripHtmlTags(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }
  
  function ttsInjectButtons() {
    if (!ttsSupported) {
      document.querySelectorAll('.tts-btn').forEach(b => {
        b.classList.add('tts-disabled');
        b.disabled = true;
        b.title = 'Your browser does not support text-to-speech';
      });
      return;
    }
  
    const paragraphs = document.querySelectorAll(
      '.hook-scenario[data-en][data-zh]:not(.tts-text), ' +
      '.hint-text[data-en][data-zh]:not(.tts-text), ' +
      '.vocab-def[data-en][data-zh]:not(.tts-text), ' +
      '.screen-desc[data-en][data-zh]:not(.tts-text), ' +
      '.screen-title[data-en][data-zh]:not(.tts-text), ' +
      '.card-title[data-en][data-zh]:not(.tts-text), ' +
      '.answer-reveal-text[data-en][data-zh]:not(.tts-text), ' +
      '.question-text[data-en][data-zh]:not(.tts-text), ' +
      '.definition-text[data-en][data-zh]:not(.tts-text), ' +
      '.summary-text[data-en][data-zh]:not(.tts-text), ' +
      '.concept-label[data-en][data-zh]:not(.tts-text), ' +
      '.cliff-text[data-en][data-zh]:not(.tts-text), ' +
      '.badge-reveal-desc[data-en][data-zh]:not(.tts-text)'
    );
  
    paragraphs.forEach(p => {
      if (p.closest('.nav-brand')) return;
  
      const txt = (p.dataset.en || '').trim();
      if (txt.length < 5) return;
  
      const wrapper = document.createElement('div');
      wrapper.className = 'tts-row';
  
      const btn = document.createElement('button');
      btn.className = 'tts-btn';
      btn.textContent = '▶';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Read aloud');
      btn.addEventListener('click', () => ttsToggle(btn, p));
  
      p.parentNode.insertBefore(wrapper, p);
      wrapper.appendChild(btn);
      p.classList.add('tts-text');
      wrapper.appendChild(p);
    });
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 2b: VOICE INPUT 语音输入 (Web Speech API → answer boxes)
  // Adds a 🎤 button beside every answer field (textarea / text input).
  // Press → speak → transcript fills the field (still fully editable;
  // typing still works). Recognition language follows the page language
  // (中文页面 zh-CN / English en-US). If the browser has no Speech-
  // Recognition support, NO button is injected (never an empty shell).
  // Engine-level: change THIS one file → every lesson, both languages,
  // automatically gets voice input. Never copied per lesson.
  // ═════════════════════════════════════════════════════════════
  var VoiceRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var voiceSupported = !!VoiceRec;
  var voiceActive = null;          // in-flight session { rec, field, btn } or null
  var voiceStylesInjected = false;

  function voiceLangCode() {
    // Follow current page language (kept in sync by setLang via body classes)
    var zh = document.body.classList.contains('lang-zh') ||
             document.body.classList.contains('zh-mode') ||
             document.documentElement.lang === 'zh';
    return zh ? 'zh-CN' : 'en-US';
  }

  function voiceInjectStyles() {
    if (voiceStylesInjected) return;
    voiceStylesInjected = true;
    var css =
      '.voice-field-wrap{display:block;}' +
      '.voice-btn{display:inline-flex;align-items:center;gap:6px;margin-top:6px;' +
        'padding:6px 12px;border:1.5px solid #E8E2D8;border-radius:999px;background:#fff;' +
        'color:#5b5247;font-family:inherit;font-size:13px;line-height:1;cursor:pointer;' +
        '-webkit-tap-highlight-color:transparent;transition:border-color .15s,background .15s,color .15s;}' +
      '.voice-btn:hover{border-color:#d9c9a8;background:#fbf7ef;}' +
      '.voice-btn:active{transform:translateY(1px);}' +
      '.voice-btn .voice-ic{font-size:15px;line-height:1;}' +
      '.voice-btn.listening{background:#fff4f2;border-color:#e8857a;color:#c0392b;' +
        'animation:voicePulse 1.1s ease-in-out infinite;}' +
      '.voice-btn[disabled]{opacity:.5;cursor:default;}' +
      '@keyframes voicePulse{0%,100%{box-shadow:0 0 0 0 rgba(192,57,43,.35);}' +
        '50%{box-shadow:0 0 0 6px rgba(192,57,43,0);}}' +
      '@media (prefers-reduced-motion: reduce){.voice-btn.listening{animation:none;}}';
    var style = document.createElement('style');
    style.id = 'voice-input-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function voiceSetListening(btn, on) {
    if (!btn) return;
    btn.classList.toggle('listening', on);
    var lbl = btn.querySelector('.voice-lbl');
    if (lbl) {
      // keep data-en/data-zh in sync so a mid-listen lang toggle stays correct
      if (on) { lbl.setAttribute('data-en', 'Listening…'); lbl.setAttribute('data-zh', '聆听中…'); }
      else    { lbl.setAttribute('data-en', 'Speak');      lbl.setAttribute('data-zh', '说出答案'); }
      lbl.textContent = lbl.getAttribute(voiceLangCode() === 'zh-CN' ? 'data-zh' : 'data-en');
    }
    var zh = voiceLangCode() === 'zh-CN';
    btn.setAttribute('aria-label', on ? (zh ? '停止聆听' : 'Stop listening')
                                      : (zh ? '语音输入答案' : 'Voice input'));
  }

  function voiceStop() {
    if (voiceActive && voiceActive.rec) {
      try { voiceActive.rec.stop(); } catch (e) {}
    }
  }

  function voiceStartFor(field, btn) {
    if (!voiceSupported) return;
    // Toggle: tapping the active mic again stops it
    if (voiceActive && voiceActive.btn === btn) { voiceStop(); return; }
    // A different mic is active → stop it first (only one session at a time)
    if (voiceActive) voiceStop();

    var rec;
    try { rec = new VoiceRec(); } catch (e) { return; }
    rec.lang = voiceLangCode();
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    var baseValue = field.value || '';
    var sep = (baseValue && !/\s$/.test(baseValue)) ? ' ' : '';
    voiceActive = { rec: rec, field: field, btn: btn };

    rec.onstart = function () { voiceSetListening(btn, true); };

    rec.onresult = function (ev) {
      var finalTxt = '', interimTxt = '';
      for (var i = ev.resultIndex; i < ev.results.length; i++) {
        var r = ev.results[i];
        if (r.isFinal) finalTxt += r[0].transcript;
        else interimTxt += r[0].transcript;
      }
      // Rebuild from the original value each time so interim text replaces
      // cleanly; final text appends. Student can still edit afterwards.
      field.value = baseValue + sep + finalTxt + interimTxt;
      // Notify existing listeners (auto-save / XP) exactly like typing does
      try { field.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
    };

    rec.onerror = function () {
      // 'not-allowed' / 'service-not-allowed' = mic permission denied.
      // 'no-speech' / 'aborted' / network = nothing heard. In ALL cases just
      // reset the button — never block the page, never lose the student's text.
      voiceSetListening(btn, false);
      if (voiceActive && voiceActive.btn === btn) voiceActive = null;
    };

    rec.onend = function () {
      voiceSetListening(btn, false);
      if (voiceActive && voiceActive.btn === btn) voiceActive = null;
      try { field.focus(); } catch (e) {}
    };

    try {
      // First use triggers the browser's mic-permission prompt.
      // Allow → onstart/onresult fire. Deny → onerror fires. Neither freezes.
      rec.start();
    } catch (e) {
      voiceSetListening(btn, false);
      voiceActive = null;
    }
  }

  function voiceInjectButtons() {
    if (!voiceSupported) return;   // ★ unsupported browser → inject NOTHING (no dead button)
    voiceInjectStyles();
    var fields = document.querySelectorAll(
      'textarea:not([data-no-voice]), input[type="text"]:not([data-no-voice])'
    );
    Array.prototype.forEach.call(fields, function (field) {
      if (field._voiceWired) return;
      if (field.disabled || field.readOnly) return;
      field._voiceWired = true;

      // Wrap the field so the mic button sits directly beneath it
      var wrap = document.createElement('span');
      wrap.className = 'voice-field-wrap';
      field.parentNode.insertBefore(wrap, field);
      wrap.appendChild(field);

      var zh = voiceLangCode() === 'zh-CN';
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'voice-btn';
      btn.innerHTML =
        '<span class="voice-ic" aria-hidden="true">🎤</span>' +
        '<span class="voice-lbl" data-en="Speak" data-zh="说出答案">' +
        (zh ? '说出答案' : 'Speak') + '</span>';
      btn.setAttribute('aria-label', zh ? '语音输入答案' : 'Voice input');
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        voiceStartFor(field, btn);
      });
      wrap.appendChild(btn);
    });
  }

  // ═════════════════════════════════════════════════════════════
  // SCREEN NAVIGATION
  // ═════════════════════════════════════════════════════════════
  const screens = ['hook','learn','try','test','wrap'];

  // ═════════════════════════════════════════════════════════════
  // SECTION 3: 5-SCREEN SWITCH (v2 version + v1 bubble integration)
  // ═════════════════════════════════════════════════════════════
  const SCREENS = ['hook', 'learn', 'try', 'test', 'wrap'];
  const LS_LANG = 'scispark.lang';
  const LS_MUTE = 'scispark.mute';
  const LS_PROGRESS_PREFIX = 'scispark.progress.';

  // XP / answer-tracking state (used by awardXP, updateXPDisplay, setupAutoSave, completeLesson)
  let xpEarned = {lesson:0, mcq:0, aha:0};
  let xpAnswered = new Set();

  function showScreen(name) {
    if (!SCREENS.includes(name)) return;

    // v4: unmount widgets in the screen we are leaving (frees Canvas/Lottie/listeners)
    var _leaving = document.querySelector('.screen.active');
    if (_leaving && window.LessonShell) {
      try { window.LessonShell._unmountWithin(_leaving); } catch (e) {}
    }

    document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

    // v2 pattern: .screen[data-screen="hook"]
    let target = document.querySelector('.screen[data-screen="' + name + '"]');
    // v1 fallback: #screen-hook
    if (!target) target = document.getElementById('screen-' + name);
    if (target) target.classList.add('active');

    // v4: mount widgets declared inside the screen we just entered
    if (target && window.LessonShell) {
      try { window.LessonShell._mountWithin(target); } catch (e) {}
    }

    // Sidebar nav highlight (v2 + v1 both supported)
    document.querySelectorAll('.sidebar__btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.screen === name);
    });
    document.querySelectorAll('.screen-nav-item').forEach(n => n.classList.remove('active'));
    const v1NavItem = document.querySelector('.screen-nav-item[onclick*="\'' + name + '\'"]');
    if (v1NavItem) v1NavItem.classList.add('active');

    // Mark previous screens as done (v2 SCREENS array pattern)
    const idx = SCREENS.indexOf(name);
    SCREENS.forEach((s, i) => {
      const btn = document.querySelector('.sidebar__btn[data-screen="' + s + '"]');
      if (btn && i < idx) btn.classList.add('is-done');
    });

    updateLearnProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // v1 bubble integration — show Professor Spark bubble for this screen
    if (typeof showBubbleForScreen === 'function') {
      try { showBubbleForScreen(name); } catch (e) {}
    }

    // Track to DB
    const lessonId = document.body.getAttribute('data-lesson-id') || document.body.getAttribute('data-lesson');
    if (lessonId) trackProgress(lessonId, name, 'view');

    // Save local progress (v1 pattern)
    if (lessonId) {
      try { localStorage.setItem(LS_PROGRESS_PREFIX + lessonId, name); } catch (e) {}
    }

    // Cover answer boxes mounted on screen entry (idempotent — skips wired fields)
    if (typeof voiceInjectButtons === 'function') {
      try { voiceInjectButtons(); } catch (e) {}
    }
  }

  function updateLearnProgress() {
    const total = SCREENS.length;
    const active = document.querySelector('.screen.active');
    let idx = 0;
    if (active) {
      const ds = active.dataset.screen || (active.id || '').replace('screen-', '');
      idx = SCREENS.indexOf(ds);
    }
    const pct = Math.round(((Math.max(idx, 0) + 1) / total) * 100);
    const fill = document.querySelector('.progress-track__row[data-track="learn"] .progress-track__fill');
    const num  = document.querySelector('.progress-track__row[data-track="learn"] .progress-track__num');
    if (fill) fill.style.width = pct + '%';
    if (num)  num.textContent = pct + '%';
    // v1 fallback selector
    const v1Fill = document.getElementById('prog-fill');
    const v1Pct  = document.getElementById('prog-pct');
    if (v1Fill) v1Fill.style.width = pct + '%';
    if (v1Pct)  v1Pct.textContent = pct + '%';
  }

  function updateTestProgress() {
    const tested = document.querySelectorAll('[data-question][data-answered="true"]').length;
    const total  = document.querySelectorAll('[data-question]').length || 1;
    const pct = Math.round((tested / total) * 100);
    const fill = document.querySelector('.progress-track__row[data-track="test"] .progress-track__fill');
    const num  = document.querySelector('.progress-track__row[data-track="test"] .progress-track__num');
    if (fill) fill.style.width = pct + '%';
    if (num)  num.textContent = pct + '%';
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 4: LANG TOGGLE (v2 base + v1 zh-mode class compat)
  // ═════════════════════════════════════════════════════════════
  function setLang(mode) {
    if (mode !== 'en' && mode !== 'zh') mode = 'en';
    document.documentElement.lang = (mode === 'zh') ? 'zh' : 'en';
    document.body.classList.toggle('lang-zh', mode === 'zh');
    document.body.classList.toggle('zh-mode', mode === 'zh'); // v1 compat

    document.querySelectorAll('[data-en][data-zh]').forEach(el => {
      const txt = el.getAttribute(mode === 'zh' ? 'data-zh' : 'data-en');
      if (txt != null) el.textContent = txt;
    });

    // v2 lang-toggle buttons
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.classList.toggle('is-active', b.dataset.lang === mode);
      b.classList.toggle('active', b.dataset.lang === mode); // v1 compat
    });
    // v1 explicit lang buttons
    const enBtn = document.getElementById('lang-en');
    const zhBtn = document.getElementById('lang-zh');
    if (enBtn) enBtn.classList.toggle('active', mode === 'en');
    if (zhBtn) zhBtn.classList.toggle('active', mode === 'zh');

    try { localStorage.setItem(LS_LANG, mode); } catch (e) {}
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 5: L1/L2/L3 LEVEL SYSTEM (verbatim from v1.js line 308-476)
  // Includes: applyLevelFromURL, getSupabaseClient, waitForSupabaseClient,
  //           fetchLevelFromSupabase, normLevel
  // ═════════════════════════════════════════════════════════════

  function applyLevelFromURL() {
    const params = new URLSearchParams(window.location.search);
    const urlLevel = params.get('level');
    const cachedLevel = localStorage.getItem('scispark_level');
  
    // [1] 老师 URL override — 立刻应用, 不写 cache (避免污染学生)
    if (urlLevel && ['1','2','3'].includes(urlLevel)) {
      document.body.setAttribute('data-user-level', urlLevel);
      console.log('%c[SciSpark Level] URL override: ' + urlLevel,
                  'color:#EA580C;font-weight:bold');
      return; // 不查 Supabase
    }
  
    // [2] cache 或 default 先应用 (避免闪烁)
    const startLevel = (cachedLevel && ['1','2','3'].includes(cachedLevel))
      ? cachedLevel
      : '2';
    document.body.setAttribute('data-user-level', startLevel);
    console.log('%c[SciSpark Level] Start (cache/default): ' + startLevel,
                'color:#888');
  
    // [3] async 去 Supabase 抽真正的 level
    fetchLevelFromSupabase()
      .then(dbLevel => {
        if (!['1','2','3'].includes(dbLevel)) {
          console.warn('[SciSpark Level] Invalid DB level "' + dbLevel +
                       '" — keeping ' + startLevel);
          return;
        }
        document.body.setAttribute('data-user-level', dbLevel);
        localStorage.setItem('scispark_level', dbLevel);
        console.log('%c[SciSpark Level] From Supabase: ' + dbLevel,
                    'color:#EA580C;font-weight:bold');
      })
      .catch(err => {
        console.warn('[SciSpark Level] Supabase fetch failed — staying on ' +
                     startLevel + ' (reason: ' + err.message + ')');
      });
  }
  
  // 找 Supabase client 实例 — lesson HTML 自己 init, 我们只读
  // 兼容 3 种常见名字: window.supabaseClient / window.supabase / window.sb
  function getSupabaseClient() {
    const candidates = [
      window.supabaseClient,
      window.supabase,
      window.sb
    ];
    for (const c of candidates) {
      if (c &&
          typeof c.from === 'function' &&
          c.auth &&
          typeof c.auth.getUser === 'function') {
        return c;
      }
    }
    return null;
  }
  
  // 等 Supabase client load (lesson HTML 可能晚 init)
  function waitForSupabaseClient(timeoutMs) {
    return new Promise(resolve => {
      const start = Date.now();
      const tryNow = () => {
        const c = getSupabaseClient();
        if (c) return resolve(c);
        if (Date.now() - start >= timeoutMs) return resolve(null);
        setTimeout(tryNow, 100);
      };
      tryNow();
    });
  }
  
  // 真去 Supabase 抽 level
  async function fetchLevelFromSupabase() {
    const client = await waitForSupabaseClient(3000);
    if (!client) {
      throw new Error('supabase client not initialized on this page');
    }
  
    // Step 1: 抽 auth user
    const { data: userData, error: authErr } = await client.auth.getUser();
    if (authErr) throw new Error('auth: ' + authErr.message);
    const user = userData && userData.user;
    if (!user) throw new Error('user not signed in');
  
    // Step 2: 找最新一笔 attempt
    // 注意: assessment_attempts.student_id 历史命名, 实际存的是 auth.users.id
    const { data: attemptRow, error: attemptErr } = await client
      .from('assessment_attempts')
      .select('id, year_group')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  
    if (attemptErr) throw new Error('attempts query: ' + attemptErr.message);
    if (!attemptRow) throw new Error('no attempts for user ' + user.id);
  
    const attemptShort = String(attemptRow.id).substring(0, 8);
    const yearTag = attemptRow.year_group || '?';
  
    // 标准化 level: 'l1'/'L1'/'1' → '1' (匹配 CSS body[data-user-level="X"])
    function normLevel(raw) {
      if (raw === null || raw === undefined) return null;
      const m = String(raw).trim().toLowerCase().match(/^l?([123])$/);
      return m ? m[1] : null;
    }
  
    // Step 3a: 优先 assessment_reviews (teacher_final > provisional)
    const { data: reviewRow, error: reviewErr } = await client
      .from('assessment_reviews')
      .select('provisional_level, teacher_final_level')
      .eq('attempt_id', attemptRow.id)
      .maybeSingle();
  
    if (reviewErr) {
      console.warn('[SciSpark Level] assessment_reviews query error (falling to score): ' +
                   reviewErr.message);
    } else if (reviewRow) {
      const teacherLvl = normLevel(reviewRow.teacher_final_level);
      const provLvl = normLevel(reviewRow.provisional_level);
      if (teacherLvl) {
        console.log('%c[SciSpark Level] From assessment_reviews.teacher_final: ' + teacherLvl +
                    ' (raw="' + reviewRow.teacher_final_level + '", attempt ' +
                    attemptShort + '..., ' + yearTag + ')',
                    'color:#EA580C;font-weight:bold');
        return teacherLvl;
      }
      if (provLvl) {
        console.log('%c[SciSpark Level] From assessment_reviews.provisional: ' + provLvl +
                    ' (raw="' + reviewRow.provisional_level + '", attempt ' +
                    attemptShort + '..., ' + yearTag + ')',
                    'color:#EA580C;font-weight:bold');
        return provLvl;
      }
    }
  
    // Step 3b: fallback — 从 marking_results.total_awarded 算
    const { data: markRow, error: markErr } = await client
      .from('assessment_marking_results')
      .select('total_awarded, total_possible')
      .eq('attempt_id', attemptRow.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
  
    if (markErr) throw new Error('marking query: ' + markErr.message);
    if (!markRow) throw new Error('no marking for attempt ' + attemptRow.id);
  
    // Step 4: 分数换算 level (阈值同步 api/mark.js + teacher-review.html)
    // ★ 哪天要改阈值, 这 3 个文件全部要改
    const score = Number(markRow.total_awarded);
    if (!Number.isFinite(score)) {
      throw new Error('invalid total_awarded: ' + markRow.total_awarded);
    }
    const level = score >= 45 ? '3' : score >= 30 ? '2' : '1';
  
    console.log('%c[SciSpark Level] Computed from score ' + score + '/' +
                (markRow.total_possible || '?') + ' → Level ' + level +
                ' (attempt ' + attemptShort + '..., ' + yearTag + ', no review)',
                'color:#EA580C;font-weight:bold');
  
    return level;
  }
  
  // ═════════════════════════════════════════════════════════════
  // MCQ + HINT + ANSWER
  // ═════════════════════════════════════════════════════════════

  // ═════════════════════════════════════════════════════════════
  // SECTION 6: QUESTION HANDLERS
  // ═════════════════════════════════════════════════════════════
  // selectOpt: kept from v1 (lesson HTML uses onclick="selectOpt(...)")
  function selectOpt(qId, el, letter) {
    const container = document.getElementById(qId + '-opts') ||
                      (el && el.closest('.q-block'));
    if (container) {
      container.querySelectorAll('.mcq-option, .option').forEach(o => o.classList.remove('selected'));
    }
    if (el) el.classList.add('selected');
  }

  // ═════════════════════════════════════════════════════════════
  // PER-QUESTION CAPTURE → lesson_question_attempts
  // Order 2026-06-20 (军师房): record every attempted question to the account
  // so the student data dashboard can show per-question detail.
  // REALITY (verified): live lessons are self-graded reveals — the student
  // writes a free-text answer, taps "Check answer", and the lesson does NOT
  // compute right/wrong. So we STORE THE SUBMITTED TEXT now (score=null,
  // marker 'self_reported'); correctness can be marked later (boss decision).
  // Real MCQ (submitAnswer) records an actual 1/0 score where it exists.
  // lesson_id stays null on purpose: it is a FK→lesson_content, which has no
  // rows for these HTML lessons, so a real UUID cannot be set. Which-lesson is
  // captured via lesson_code (from the URL path) instead.
  // Writes client-side under RLS policy lqa_insert_own (parent's own child).
  // Best-effort + try/catch everywhere: capture must NEVER break the lesson.
  // ═════════════════════════════════════════════════════════════
  let _pqChildId = null;          // cached account child id (POSITIVE cache only — see _pqResolveChild)
  const _pqTimers = {};           // questionId -> first-touch timestamp (ms)
  const _pqAttempts = {};         // questionId -> attempts so far (this page load)

  function _pqLessonCode() {
    // "/lessons/y7/u8/l01.html" -> "y7/u8/l01"
    try {
      const m = location.pathname.match(/lessons\/(.+?)(?:\.html)?\/?$/i);
      return m ? m[1] : (location.pathname || null);
    } catch (e) { return null; }
  }

  async function _pqResolveChild() {
    if (_pqChildId) return _pqChildId;   // cache ONLY a real child → keep retrying until logged in
    try {
      const client = await waitForSupabaseClient(3000);
      if (!client) return null;
      // getSession() is LOCAL (no network) → avoids the boot-time session-readiness race that
      // getUser() hit (cf. PR#53). If the session isn't hydrated yet, the next capture retries.
      const { data: { session } } = await client.auth.getSession();
      const user = session && session.user;
      if (!user) return null;            // not logged in (yet) → skip; retry on next capture
      const { data: child } = await client
        .from('children').select('id').eq('parent_id', user.id).limit(1).maybeSingle();
      if (child) _pqChildId = child.id;
    } catch (e) {}
    return _pqChildId;
  }

  // p = { questionId, inputType, submission(obj), score|null, maxScore|null }
  async function recordQuestionAttempt(p) {
    try {
      if (!p || !p.questionId) return;
      const client = await waitForSupabaseClient(3000);
      if (!client) return;
      const childId = await _pqResolveChild();
      if (!childId) return; // not logged in / no child → nothing to attribute (honest skip)
      const qid = String(p.questionId);
      _pqAttempts[qid] = (_pqAttempts[qid] || 0) + 1;
      const startTs = _pqTimers[qid];
      const timeMs = (typeof startTs === 'number') ? Math.max(0, Date.now() - startTs) : null;
      const row = {
        child_id:         childId,
        lesson_id:        null,                 // FK→lesson_content (no row for HTML lessons)
        lesson_code:      _pqLessonCode(),      // which lesson (text, from URL)
        question_id:      qid,
        input_type:       p.inputType || 'free_text',
        submission:       p.submission || {},
        score:            (p.score == null ? null : p.score),
        max_score:        (p.maxScore == null ? null : p.maxScore),
        attempt_no:       _pqAttempts[qid],
        time_ms:          timeMs,
        feedback_variant: null,
        marker:           (p.score == null ? 'self_reported' : 'engine_v4'),
        marked_at:        new Date().toISOString()
      };
      // is_correct (Order 2026-06-20 关键词闸): ONLY attach when a verdict exists.
      // Ungated self-reported reveals omit it entirely, so those inserts keep
      // working even if the migration hasn't run yet — zero regression to PR#65.
      if (p.isCorrect != null) row.is_correct = !!p.isCorrect;
      const { error } = await client.from('lesson_question_attempts').insert(row);
      if (error) console.warn('[SciSpark] question capture failed:', error.message);
      else console.log('%c[SciSpark] question captured — ' + row.lesson_code + ' ' + qid,
                       'color:#2E7D5B;font-weight:bold');
    } catch (e) { console.warn('[SciSpark] question capture error:', e.message); }
  }

  // Derive a question id from a .question-block element (prefer .q-number text)
  function _pqQid(block) {
    if (!block) return null;
    const qn = block.querySelector('.q-number');
    if (qn && qn.textContent.trim()) return qn.textContent.trim();
    const ans = block.querySelector('[id$="-ans"]');
    if (ans) return ans.id.replace(/-ans$/i, '');
    return null;
  }

  // ═════════════════════════════════════════════════════════════
  // KEYWORD GATE — typed-answer auto-grading (Order 2026-06-20 军师房)
  // Grades free-text (fill-in / short-answer) questions so the student
  // data dashboard can light up per-question right/wrong. PLUG-ONLY:
  // grading lives here in the shared engine; the per-question rule ("料")
  // stays in each lesson HTML as data-gate JSON (see _pqReadGate).
  // Does NOT touch MCQ submitAnswer; does NOT touch ungated captures.
  // ═════════════════════════════════════════════════════════════

  // Normalize a string for comparison: trim, full-width→half-width,
  // full-width space→space, lowercase, collapse runs of whitespace.
  function _normText(s) {
    s = (s == null) ? '' : String(s);
    // full-width ASCII (！-～ U+FF01–FF5E) → ASCII (!-~ U+0021–007E)
    s = s.replace(/[！-～]/g, function (ch) {
      return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0);
    });
    s = s.replace(/　/g, ' ');          // ideographic (full-width) space
    s = s.trim().toLowerCase();
    s = s.replace(/\s+/g, ' ');
    return s;
  }

  // gradeTextAnswer(userText, gate) → { isCorrect, matched, missed, forbiddenHit? }
  //   gate = { required: [ ["质量","mass"], ["空气","air"] ], forbidden: ["不变","no mass"] }
  //   - required: array of synonym GROUPS; any synonym in a group satisfies that group;
  //               ALL groups must be satisfied to pass.
  //   - forbidden: any hit → wrong (highest priority).
  //   - empty answer / pure-symbol gibberish → wrong.
  //   matched/missed are returned for future hint/dashboard use (not required now).
  function gradeTextAnswer(userText, gate) {
    gate = gate || {};
    const norm = _normText(userText);
    const required = Array.isArray(gate.required) ? gate.required : [];
    const result = { isCorrect: false, matched: [], missed: [] };

    // Empty OR no letter/number/CJK at all (pure symbols/punctuation) → wrong.
    const hasContent = /[\p{L}\p{N}]/u.test(norm);
    if (!norm || !hasContent) { result.missed = required.slice(); return result; }

    // Forbidden first (highest priority).
    const forbidden = (Array.isArray(gate.forbidden) ? gate.forbidden : [])
      .map(_normText).filter(Boolean);
    for (let i = 0; i < forbidden.length; i++) {
      if (norm.indexOf(forbidden[i]) !== -1) {
        result.forbiddenHit = forbidden[i];
        result.missed = required.slice();
        return result;                       // isCorrect stays false
      }
    }

    // Required synonym groups: every group must have one synonym present.
    let allPass = true;
    for (let g = 0; g < required.length; g++) {
      const group = Array.isArray(required[g]) ? required[g] : [required[g]];
      const syns = group.map(_normText).filter(Boolean);
      let hit = null;
      for (let s = 0; s < syns.length; s++) {
        if (norm.indexOf(syns[s]) !== -1) { hit = syns[s]; break; }
      }
      if (hit) result.matched.push(hit);
      else { allPass = false; result.missed.push(group); }
    }

    // Correct only when there is at least one required group AND all groups passed.
    // (A gate with no required groups can never confirm "correct" — fail safe.)
    result.isCorrect = (required.length > 0) && allPass;
    return result;
  }

  // Read a question's grading rule ("料") from the lesson HTML.
  // Looked for (first hit wins): block[data-gate], the answer-input element
  // [data-gate], or window.QGATES[questionId]. Returns the parsed gate or null.
  function _pqReadGate(block, qid, inputEl) {
    function parse(raw) {
      if (!raw) return null;
      try { return JSON.parse(raw); } catch (e) {
        console.warn('[SciSpark] bad data-gate JSON, ignoring:', e.message);
        return null;
      }
    }
    let g = null;
    if (block && block.getAttribute) g = parse(block.getAttribute('data-gate'));
    if (!g && inputEl && inputEl.getAttribute) g = parse(inputEl.getAttribute('data-gate'));
    if (!g && qid && window.QGATES && window.QGATES[qid]) {
      g = window.QGATES[qid];                // already an object
    }
    return g;
  }

  // Reward-once tracker for graded free-text (per question id, this page load).
  const _ftGraded = {};

  // Apply the reward path for a graded free-text answer. Mirrors submitAnswer
  // steps 5–9 EXACTLY (no MCQ code is touched). Strict 2026-06-19 round-3 rule:
  // wrong / junk NEVER raises marks / mastery / effort / XP / streak.
  function _applyFreeTextReward(block, isCorrect) {
    // 5 · Spark Jar — mastery ONLY on correct
    if (window.SparkJar && isCorrect) window.SparkJar.add(20, 'correct');
    // 6 · Spark Streak (paused-not-reset; miss() is a pause, not a reward)
    try { if (isCorrect) SparkStreak.add(); else SparkStreak.miss(); } catch (e) {}
    // 7 · v1 XP — ONLY on correct
    if (isCorrect && typeof awardXP === 'function') { try { awardXP(10, 'text'); } catch (e) {} }
    // 8 · Doudou react
    if (typeof doudouReact === 'function') { try { doudouReact(isCorrect); } catch (e) {} }
    // 9 · Reward audio
    try { playSound(isCorrect ? 'correct' : 'wrong'); } catch (e) {}
    // 10 · Mark answered for test progress
    if (block && block.dataset && block.dataset.question) {
      block.setAttribute('data-answered', 'true');
      block.setAttribute('data-result', isCorrect ? 'correct' : 'wrong');
    }
    try { updateTestProgress(); } catch (e) {}
  }

  // Called from toggleAns: a "Check answer" reveal on a free-text question.
  function _pqCaptureReveal(id) {
    const box = document.getElementById(id);
    if (!box) return;
    if (!box.classList.contains('show')) return;   // only on OPEN (became visible), not on hide
    const block = box.closest('.question-block');
    if (!block) return;                            // generic toggles (non-question) → ignore
    const qid = _pqQid(block) || String(id).replace(/-ans$/i, '');
    const ta = block.querySelector('textarea, input.short-input, .short-input');
    const text = ta ? (ta.value || '').trim() : '';
    let maxScore = null;
    const qm = block.querySelector('.q-marks');
    if (qm) { const m = qm.textContent.match(/\d+/); if (m) maxScore = parseInt(m[0], 10); }

    // Keyword gate? If this question carries grading rules, auto-grade it.
    const gate = _pqReadGate(block, qid, ta);
    if (gate) {
      let verdict = null;
      try { verdict = gradeTextAnswer(text, gate); } catch (e) { verdict = null; }
      if (verdict) {
        const isCorrect = !!verdict.isCorrect;
        // visual state for the lesson (CSS can style data-result)
        block.setAttribute('data-result', isCorrect ? 'correct' : 'wrong');
        // reward exactly once per question (re-reveals don't re-reward)
        if (!_ftGraded[qid]) {
          _ftGraded[qid] = true;
          _applyFreeTextReward(block, isCorrect);
        }
        recordQuestionAttempt({
          questionId: qid,
          inputType:  'free_text_graded',
          submission: { text: text, matched: verdict.matched, missed: verdict.missed },
          score:      isCorrect ? 1 : 0,
          maxScore:   maxScore,
          isCorrect:  isCorrect          // → writes is_correct column
        });
        return;
      }
    }

    // No gate (or grade failed) → unchanged self-reported capture (score=null).
    recordQuestionAttempt({
      questionId: qid,
      inputType:  'free_text',
      submission: { text: text },
      score:      null,            // self-graded reveal → correctness unknown, mark later
      maxScore:   maxScore
    });
  }

  // toggleHint: verbatim from v1.js line 481-484
  function toggleHint(id) {
    const box = document.getElementById(id);
    if (box) box.classList.toggle('show');
  }

  // toggleAns (Show Answer): verbatim from v1.js line 485-488
  // SPEC NOTE: lesson HTML may call this after 2 wrong attempts (D.4 spec gap)
  // For now this just toggles; lesson HTML controls when button appears.
  function toggleAns(id) {
    const box = document.getElementById(id);
    if (box) box.classList.toggle('show');
    // PER-QUESTION CAPTURE — record the submitted answer when a question's
    // "Check answer" reveal is opened (best-effort; never blocks the toggle).
    try { _pqCaptureReveal(id); } catch (e) {}
  }

  // submitAnswer: v2's richer flow + v1 integrations (audio, awardXP, doudouReact)
  //   opts = { questionId, screen, explainEn, explainZh, socraticEn, socraticZh, correctEl, xp }
  function submitAnswer(optionEl, isCorrect, opts) {
    opts = opts || {};
    if (!optionEl) return;
    const container = optionEl.closest('.q-block') || optionEl.parentElement;

    // 1 · Mark all options in this block disabled
    const allOpts = container ? container.querySelectorAll('.option, .mcq-option') : [optionEl];
    allOpts.forEach(o => { o.setAttribute('disabled', 'true'); });
    optionEl.setAttribute('data-state', isCorrect ? 'correct' : 'wrong');

    // 2 · On wrong, reveal correct (N11)
    if (!isCorrect && opts.correctEl) {
      opts.correctEl.setAttribute('data-state', 'reveal-correct');
    }

    // 3 · Track attempt count (for Show Answer 2-wrong trigger — D.4 spec)
    if (container && container.dataset.question) {
      const attempts = parseInt(container.getAttribute('data-attempts') || '0', 10) + 1;
      container.setAttribute('data-attempts', String(attempts));
      if (!isCorrect && attempts >= 2) {
        // Reveal "Show Answer" button if lesson has one
        const showAnsBtn = container.querySelector('.show-answer-btn, [data-action="show-answer"]');
        if (showAnsBtn) showAnsBtn.classList.add('available');
      }
    }

    // 4 · AI Socratic purple feedback
    const fb = container ? container.querySelector('.ai-feedback') : null;
    if (fb) {
      const explain = fb.querySelector('.ai-feedback__explain');
      const socratic = fb.querySelector('.ai-feedback__socratic');
      if (explain) {
        explain.setAttribute('data-en', opts.explainEn || (isCorrect ? 'Nice — that fits the pattern.' : 'Not yet. Let\u2019s look closer.'));
        explain.setAttribute('data-zh', opts.explainZh || (isCorrect ? '不错 — 这正符合规律。' : '还没对。我们一起再看一看。'));
      }
      if (socratic) {
        socratic.setAttribute('data-en', opts.socraticEn || 'What did you notice first when you read the question?');
        socratic.setAttribute('data-zh', opts.socraticZh || '读题时你第一个注意到的是什么?');
      }
      fb.classList.add('is-open');
      const mode = (function () { try { return localStorage.getItem(LS_LANG) || 'en'; } catch (e) { return 'en'; } })();
      setLang(mode);
    }

    // 5 · Spark Jar — reward (mastery) ONLY on correct; no effort/mastery for wrong/junk (order 2026-06-19 round 3)
    if (window.SparkJar && isCorrect) {
      window.SparkJar.add(20, 'correct');
    }

    // 6 · Spark Streak (paused-not-reset)
    if (isCorrect) SparkStreak.add(); else SparkStreak.miss();

    // 7 · v1 XP system + toast (legacy compat)
    if (typeof awardXP === 'function' && isCorrect) {
      try { awardXP(opts.xp || 10, 'mcq'); } catch (e) {}
    }

    // 8 · Doudou react
    if (typeof doudouReact === 'function') {
      try { doudouReact(isCorrect); } catch (e) {}
    } else {
      const doudou = document.querySelector('.doudou-avatar');
      if (doudou) {
        doudou.setAttribute('data-mood', isCorrect ? 'happy' : 'thinking');
        setTimeout(() => doudou.removeAttribute('data-mood'), 1800);
      }
    }

    // 9 · Reward audio (5 OGG)
    playSound(isCorrect ? 'correct' : 'wrong');

    // 10 · Mark answered for test progress
    if (container && container.dataset.question) {
      container.setAttribute('data-answered', 'true');
      container.setAttribute('data-result', isCorrect ? 'correct' : 'wrong');
    }
    updateTestProgress();

    // 11 · Track to DB (best-effort, async)
    const lessonId = document.body.getAttribute('data-lesson-id') || document.body.getAttribute('data-lesson');
    if (lessonId && opts.questionId) {
      trackProgress(lessonId, opts.screen || 'test', isCorrect ? 'answered_correct' : 'answered_wrong');
    }

    // 12 · PER-QUESTION CAPTURE — real graded MCQ (records actual 1/0 score)
    try {
      if (opts.questionId) {
        recordQuestionAttempt({
          questionId: opts.questionId,
          inputType:  'mcq',
          submission: { selected: (optionEl.textContent || '').trim(), correct: !!isCorrect },
          score:      isCorrect ? 1 : 0,
          maxScore:   1
        });
      }
    } catch (e) {}
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 7: XP + AUTO-SAVE (verbatim v1.js line 496-574)
  // ═════════════════════════════════════════════════════════════

  function awardXP(amount, source) {
    // PHASE 2 ACTIVATE: insert into Supabase user_xp table
    const toast = document.getElementById('xp-toast');
    toast.textContent = '+' + amount + ' XP';
    toast.classList.remove('show');
    void toast.offsetWidth; // restart animation
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  
    if (source === 'aha') xpEarned.aha = amount;
    else xpEarned.mcq += amount;
    updateXPDisplay();
  }
  
  function updateXPDisplay() {
    if (document.getElementById('xp-mcq')) {
      document.getElementById('xp-mcq').textContent = '+' + xpEarned.mcq;
    }
    if (document.getElementById('xp-total')) {
      const total = 100 + xpEarned.mcq + xpEarned.aha;
      document.getElementById('xp-total').textContent = '+' + total;
    }
  }
  
  // ═════════════════════════════════════════════════════════════
  // AUTO-SAVE TEXTAREAS (localStorage)
  // PHASE 2 ACTIVATE: also push to Supabase lab_notebook table
  // ═════════════════════════════════════════════════════════════
  function setupAutoSave() {
    document.querySelectorAll('textarea[id]').forEach(ta => {
      const key = 'scispark_' + ta.id;
      const indicator = document.getElementById(ta.id.replace('-input','-save'));
      // Restore
      const saved = localStorage.getItem(key);
      if (saved) ta.value = saved;
      // Save on input
      let timer;
      ta.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => {
          localStorage.setItem(key, ta.value);
          if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 1500);
          }
          // If aha textarea, award XP once
          if (ta.id === 'aha-input' && ta.value.length > 5 && !xpAnswered.has('aha')) {
            xpAnswered.add('aha');
            awardXP(20, 'aha');
          }
        }, 600);
      });
    });
  }
  
  // ═════════════════════════════════════════════════════════════
  // DOUDOU SPEECH BUBBLES (bottom-right floating)
  // DouDou 豆豆 = co-learner, curious young apprentice voice
  // ▼▼▼ REPLACE: update dialogue for this specific lesson ▼▼▼
  //
  // Voice guide for DouDou:
  //   - Short, curious, enthusiastic (not authoritative like Prof P)
  //   - EN: ElevenLabs Lily/Glinda style (young, bright)
  //   - ZH: young curious Mandarin (pending A/B test — do NOT lock TTS voice yet)
  //   - Never sounds like a teacher — sounds like a fellow student
  // ═════════════════════════════════════════════════════════════
  // Default bubble scripts — lesson HTML can override by setting window.bubbleScripts
  // (e.g. <script>window.bubbleScripts = {...}</script> AFTER lesson-shell.js loads)
  if (typeof window.bubbleScripts === 'undefined') {
    window.bubbleScripts = {
      hook:  { en: "[DouDou hook — curious question to student]",  zh: "[DouDou 钩子 — 好奇地问学生]" },
      learn: { en: "[DouDou learn — 'Oh I get it now!' reaction]", zh: "[DouDou 学习 — '哦我明白了！']" },
      try:   { en: "[DouDou try — 'Let's try together!']",         zh: "[DouDou 练习 — '我们一起试试！']" },
      test:  { en: "[DouDou test — 'You can do it solo!']",        zh: "[DouDou 测试 — '你自己来！加油！']" },
      wrap:  { en: "[DouDou wrap — excited about next lesson]",    zh: "[DouDou 总结 — 对下一课感到兴奋]" }
    };
  }
  // ▲▲▲ REPLACE ▲▲▲
  

  // ═════════════════════════════════════════════════════════════
  // SECTION 8: BUBBLE + AI TUTOR (verbatim v1.js line 575-609)
  // ═════════════════════════════════════════════════════════════

  function showBubbleForScreen(id) {
    const bubble = document.getElementById('prof-p-bubble');
    const text = document.getElementById('prof-p-bubble-text');
    const zh = document.getElementById('prof-p-bubble-zh');
    const scripts = window.bubbleScripts || {};
    if (scripts[id]) {
      text.textContent = scripts[id].en;
      zh.textContent = scripts[id].zh;
      bubble.classList.add('show');
      // Auto-hide after 5 seconds (except WRAP — keep visible)
      if (id !== 'wrap') {
        setTimeout(() => bubble.classList.remove('show'), 5000);
      }
    }
  }
  
  function toggleBubble() {
    const bubble = document.getElementById('prof-p-bubble');
    bubble.classList.toggle('show');
  }
  
  function closeBubble() {
    document.getElementById('prof-p-bubble').classList.remove('show');
  }
  
  // ═════════════════════════════════════════════════════════════
  // AI TUTOR PANEL
  // ═════════════════════════════════════════════════════════════
  function openAITutor() {
    document.getElementById('ai-tutor-panel').classList.add('open');
  }
  function closeAITutor() {
    document.getElementById('ai-tutor-panel').classList.remove('open');
  }
  

  // ═════════════════════════════════════════════════════════════
  // SECTION 9: TOAST + LESSON COMPLETE + SURPRISE (verbatim v1.js line 610-731)
  // ═════════════════════════════════════════════════════════════

  function showToast(message, opts) {
    opts = opts || {};
    let container = document.getElementById('scispark-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'scispark-toast-container';
      container.style.cssText = 'position:fixed;top:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:12px;pointer-events:none;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = [
      'background:#ffffff',
      'border-left:4px solid #EA580C',
      'box-shadow:0 4px 12px rgba(0,0,0,0.15)',
      'padding:14px 20px',
      'border-radius:12px',
      'font-family:Arial,sans-serif',
      'font-size:14px',
      'color:#1f2937',
      'min-width:240px',
      'max-width:360px',
      'opacity:0',
      'transform:translateX(20px)',
      'transition:opacity 0.3s ease, transform 0.3s ease',
      'pointer-events:auto'
    ].join(';');
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(function(){
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    });
    setTimeout(function(){
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      setTimeout(function(){
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  // ═════════════════════════════════════════════════════════════
  // COMPLETE LESSON (XP + Badge + Surprise Drop + Streak)
  // ═════════════════════════════════════════════════════════════
  function completeLesson() {
    // PHASE 2 ACTIVATE: write to Supabase user_xp, user_badges, user_streak tables
  
    // lesson_progress UPSERT — writes child_id + lesson_id + completed_at
    // lesson_id comes from data-lesson-id on <body> (UUID from lessons table)
    // Unique constraint: (child_id, lesson_id) — safe to upsert repeatedly
    (async function writeLessonProgress() {
      try {
        const lessonId = document.body.dataset.lessonId;
        if (!lessonId) return; // lesson HTML has no data-lesson-id — skip silently
  
        const client = await waitForSupabaseClient(3000);
        if (!client) return;
  
        const { data: { user }, error: authErr } = await client.auth.getUser();
        if (authErr || !user) return;
  
        const { data: child } = await client
          .from('children')
          .select('id')
          .eq('parent_id', user.id)
          .limit(1)
          .maybeSingle();
        if (!child) return;
  
        const now = new Date().toISOString();
        const { error: upsertErr } = await client
          .from('lesson_progress')
          .upsert(
            {
              child_id:     child.id,
              lesson_id:    lessonId,
              status:       'completed',
              started_at:   now,   // used only on first INSERT; ignored on conflict update
              completed_at: now
            },
            { onConflict: 'child_id,lesson_id' }
          );
  
        if (upsertErr) {
          console.warn('[SciSpark] lesson_progress upsert failed:', upsertErr.message);
        } else {
          console.log('%c[SciSpark] lesson_progress saved — lesson ' + lessonId,
                      'color:#EA580C;font-weight:bold');
        }
      } catch (e) {
        console.warn('[SciSpark] lesson_progress write error:', e.message);
      }
    })();
  
    awardXP(100, 'lesson');
    xpEarned.lesson = 100;
    updateXPDisplay();
  
    // Update streak
    SparkStreak.add();
  
    // Surprise Drop 5% probability
    if (Math.random() < 0.05) {
      setTimeout(() => {
        document.getElementById('surprise-modal').classList.add('show');
      }, 800);
    } else {
      setTimeout(() => {
        // Read lesson number from <body data-lesson="N">; fallback to '?' if not set
        const lessonNum = document.body.dataset.lesson || '?';
        showToast(`Great work! Lesson ${lessonNum} complete. ✓ · XP +10`);
      }, 600);
    }
  }
  
  function closeSurprise() {
    document.getElementById('surprise-modal').classList.remove('show');
  }
  
  // ═════════════════════════════════════════════════════════════
  // STREAK COUNTER (localStorage)
  // ═════════════════════════════════════════════════════════════

  // ═════════════════════════════════════════════════════════════
  // SECTION 10: CONTENT PROTECTION (verbatim v1.js line 753-851)
  // ═════════════════════════════════════════════════════════════

  function setupContentProtection() {
    // Disable right-click
    document.addEventListener('contextmenu', e => {
      if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) e.preventDefault();
    });
    // Disable Ctrl+C, Ctrl+A, Ctrl+P, Ctrl+S, Ctrl+U on lesson content
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && ['c','a','s','p','u'].includes(e.key.toLowerCase())) {
        if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) e.preventDefault();
      }
      if (e.key === 'F12') e.preventDefault();
      if (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) e.preventDefault();
    });
    // Disable drag
    document.addEventListener('dragstart', e => {
      if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) e.preventDefault();
    });
    // Override copy
    document.addEventListener('copy', e => {
      if (!['INPUT','TEXTAREA'].includes(e.target.tagName)) {
        e.clipboardData.setData('text/plain',
          '© 2026 SciSpark · IG SPARK CENTRE · scisparklab.com · Content protected.');
        e.preventDefault();
      }
    });
  }
  
  // ═════════════════════════════════════════════════════════════
  // KEYBOARD NAVIGATION (←→ between screens)
  // ═════════════════════════════════════════════════════════════
  document.addEventListener('keydown', e => {
    // Don't intercept if typing in input/textarea
    if (['INPUT','TEXTAREA'].includes(e.target.tagName)) return;
    const cur = document.querySelector('.screen.active');
    if (!cur) return;
    const idx = screens.indexOf(cur.id.replace('screen-', ''));
    if (e.key === 'ArrowRight' && idx < screens.length - 1) showScreen(screens[idx + 1]);
    if (e.key === 'ArrowLeft' && idx > 0) showScreen(screens[idx - 1]);
  });
  
  // ═════════════════════════════════════════════════════════════
  // INIT ON LOAD
  // ═════════════════════════════════════════════════════════════
  document.addEventListener('DOMContentLoaded', () => {
    // Restore language preference
    const savedLang = localStorage.getItem('scispark.lang') || 'en';
    const urlParams = new URLSearchParams(window.location.search);
    const isBilingual = urlParams.get('bilingual') === '1' || localStorage.getItem('scispark_bilingual') === '1';
    if (isBilingual) {
      document.body.classList.add('bilingual');
      localStorage.setItem('scispark_bilingual', '1');
    }
    setLang(savedLang);
  
    // Apply level (URL override or Supabase fetch)
    applyLevelFromURL();
  
    // Setup auto-save for all textareas
    setupAutoSave();
  
    // Setup content protection
    setupContentProtection();
  
    // Load streak
    SparkStreak.render();
  
    // Show first Professor P bubble after 1 second
    setTimeout(() => showBubbleForScreen('hook'), 1500);
  
    // TTS: voice list is async in Chrome — listen for voiceschanged
    if (ttsSupported) {
      window.speechSynthesis.onvoiceschanged = () => {};
      window.speechSynthesis.getVoices();
    }
  
    ttsInjectButtons();

    // Inject 🎤 voice-input buttons on every answer box (auto-hidden if unsupported)
    voiceInjectButtons();
  });
  
  // ═════════════════════════════════════════════════════════════
  // DOUDOU REACTIONS — answer feedback + screen transitions
  // ═════════════════════════════════════════════════════════════
  const DOUDOU_MSGS = {
    correct: {
      en: ['Awesome!', 'Got it!', 'Yes!', 'Keep going!'],
      zh: ['太棒了!', '对了!', '厉害!', '继续!']
    },
    wrong: {
      en: ['Try again', 'Almost!', "Don't give up", 'Take your time'],
      zh: ['再试试', '差一点!', '别放弃', '慢慢想']
    }
  };
  
  const DOUDOU_SCREEN_MSGS = {
    learn: { en: "Now let's learn",  zh: '现在正式开始学新知识' },
    try:   { en: 'Try it out',       zh: '试试看你学得怎样' },
    test:  { en: 'On your own now',  zh: '靠自己做, 不给提示' },
    wrap:  { en: "Let's review",     zh: '看看今天学了什么' }
  };
  

  // ═════════════════════════════════════════════════════════════
  // SECTION 11: DOUDOU SYSTEM (verbatim v1.js line 852-939)
  // ═════════════════════════════════════════════════════════════

  function doudouGetBubble() {
    let b = document.getElementById('doudou-reaction-bubble');
    if (!b) {
      b = document.createElement('div');
      b.id = 'doudou-reaction-bubble';
      const profP = document.querySelector('.prof-p');
      if (profP) profP.appendChild(b);
    }
    return b;
  }
  
  function doudouShowBubble(text, duration) {
    const b = doudouGetBubble();
    b.textContent = text;
    b.classList.add('show');
    clearTimeout(b._t);
    b._t = setTimeout(() => b.classList.remove('show'), duration || 2000);
  }
  
  function doudouAnimate(type) {
    const avatar = document.querySelector('.prof-p-avatar');
    if (!avatar) return;
    avatar.classList.remove('doudou-correct', 'doudou-wrong', 'doudou-transition');
    void avatar.offsetWidth;
    avatar.classList.add('doudou-' + type);
    setTimeout(() => avatar.classList.remove('doudou-' + type), 1000);
  }
  
  function doudouReact(isCorrect) {
    const type = isCorrect ? 'correct' : 'wrong';
    const isZh = document.body.classList.contains('zh-mode');
    const list = DOUDOU_MSGS[type][isZh ? 'zh' : 'en'];
    const msg = list[Math.floor(Math.random() * list.length)];
    doudouAnimate(type);
    doudouShowBubble(msg, 2000);
  }
  
  // Patch selectOpt — MCQ correct/wrong detection via data-correct="true"
  const _origSelectOpt = selectOpt;
  selectOpt = function(qId, el, letter) {
    _origSelectOpt(qId, el, letter);
    doudouReact(el.dataset.correct === 'true');
  };
  
  // Patch toggleAns — inject self-assessment buttons when answer revealed
  const _origToggleAns = toggleAns;
  toggleAns = function(id) {
    const box = document.getElementById(id);
    const wasHidden = !box.classList.contains('show');
    _origToggleAns(id);
    if (wasHidden && !box.querySelector('.doudou-selfassess')) {
      const isZh = document.body.classList.contains('zh-mode');
      const row = document.createElement('div');
      row.className = 'doudou-selfassess';
  
      const btnR = document.createElement('button');
      btnR.className = 'btn btn-sm doudou-got-right';
      btnR.textContent = isZh ? '✓ 我答对了' : '✓ I got it right';
      btnR.setAttribute('data-en', '✓ I got it right');
      btnR.setAttribute('data-zh', '✓ 我答对了');
      btnR.addEventListener('click', () => doudouReact(true));
  
      const btnW = document.createElement('button');
      btnW.className = 'btn btn-sm doudou-got-wrong';
      btnW.textContent = isZh ? '✗ 还没答到' : '✗ Not yet';
      btnW.setAttribute('data-en', '✗ Not yet');
      btnW.setAttribute('data-zh', '✗ 还没答到');
      btnW.addEventListener('click', () => doudouReact(false));
  
      row.appendChild(btnR);
      row.appendChild(btnW);
      box.appendChild(row);
    }
  };
  
  // Patch showScreen — DouDou speaks on screen transitions
  let _prevScreen = 'hook';
  const _origShowScreen = showScreen;
  showScreen = function(id) {
    const prev = _prevScreen;
    _origShowScreen(id);
    _prevScreen = id;
    if (id !== prev && DOUDOU_SCREEN_MSGS[id]) {
      const isZh = document.body.classList.contains('zh-mode');
      doudouAnimate('transition');
      doudouShowBubble(DOUDOU_SCREEN_MSGS[id][isZh ? 'zh' : 'en'], 3000);
    }
  };

  // ═════════════════════════════════════════════════════════════
  // SECTION 12: SPARK STREAK (v2 — paused-not-reset per Sanchez brief)
  // ═════════════════════════════════════════════════════════════
  const SparkStreak = (function () {
    let count = 0;
    let paused = false;
    function render() {
      const el = document.querySelector('.nav-top__streak');
      if (!el) return;
      el.setAttribute('data-paused', String(paused));
      const num = el.querySelector('.streak-num');
      if (num) num.textContent = String(count);
      // v1 fallback
      const v1Num = document.getElementById('streak-count');
      if (v1Num) v1Num.textContent = String(count);
    }
    return {
      add() { paused = false; count += 1; render(); },
      miss() { paused = true; render(); },
      reset() { count = 0; paused = false; render(); },
      get() { return { count, paused }; },
      render
    };
  })();

  // ═════════════════════════════════════════════════════════════
  // SECTION 13: AUDIO REWARD 5 OGG + MUTE TOGGLE
  // Source: extracted from v03 chat HTML inline (gamesounds.xyz CC0)
  // ═════════════════════════════════════════════════════════════
  const AUDIO_BASE = 'https://gamesounds.xyz/Kenney\'s%20Sound%20Pack/Interface%20Sounds/';
  const AUDIO_FILES = {
    correct:  'confirmation_001.ogg',
    wrong:    'error_002.ogg',
    levelup:  'maximize_009.ogg',
    popup:    'pluck_001.ogg',
    complete: 'bong_001.ogg'
  };
  const audioCache = {};
  let muted = false;
  try { muted = localStorage.getItem(LS_MUTE) === '1'; } catch (e) {}

  function playSound(type) {
    if (muted) return;
    if (!AUDIO_FILES[type]) return;
    let a = audioCache[type];
    if (!a) {
      // Try to use lesson HTML inline <audio> first
      a = document.getElementById('audio-' + type);
      if (!a) {
        a = new Audio(AUDIO_BASE + AUDIO_FILES[type]);
        a.preload = 'auto';
      }
      audioCache[type] = a;
    }
    try {
      a.currentTime = 0;
      const p = a.play();
      if (p && p.catch) p.catch(() => {});
    } catch (e) {}
  }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(LS_MUTE, muted ? '1' : '0'); } catch (e) {}
    renderMuteToggle();
  }

  function renderMuteToggle() {
    const btn = document.getElementById('mute-toggle') || document.querySelector('.mute-toggle');
    if (!btn) return;
    btn.textContent = muted ? '🔇' : '🔊';
    btn.classList.toggle('muted', muted);
    btn.setAttribute('aria-label', muted ? 'Unmute · 取消静音' : 'Mute · 静音');
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 14: TRACK PROGRESS + COLLECT ANSWERS (v2)
  // ═════════════════════════════════════════════════════════════
  async function trackProgress(lessonId, screen, status) {
    try {
      const sb = await ensureSupabase();
      if (!sb) return false;
      const auth = await sb.auth.getUser();
      const user = auth && auth.data && auth.data.user;
      if (!user) return false;
      if (status === 'view') return true;
      const { error } = await sb.from('lesson_progress').upsert({
        child_id: user.id,
        lesson_id: lessonId,
        completed_at: new Date().toISOString()
      }, { onConflict: 'child_id,lesson_id' });
      if (error) console.warn('[SciSpark v3] lesson_progress upsert failed:', error.message);
      return !error;
    } catch (e) {
      console.warn('[SciSpark v3] trackProgress error:', e && e.message);
      return false;
    }
  }

  function collectAnswers() {
    const out = [];
    document.querySelectorAll('[data-question]').forEach(q => {
      out.push({
        questionId: q.dataset.question,
        correct: q.dataset.result === 'correct',
        attempted_correction: q.dataset.attemptedCorrection === 'true'
      });
    });
    return out;
  }

  // ═════════════════════════════════════════════════════════════
  // SECTION 14b: 求救按钮 — REVIEW / EXPLAIN-AGAIN (MVP, 2026-06-20)
  // 派工卡 双手房. PLUG-ENGINE: lives here ONCE, auto-mounts on every lesson
  // that loads this engine. NO per-lesson copy. NO auto-0 / NO auto-cheat.
  // Chain: student answers → 2 buttons appear → 请老师复核 (3 gates) → review_requests
  //        → Sanchez clears it in the console → student sees the resolution.
  // ═════════════════════════════════════════════════════════════
  var REVIEW = (function () {
    var WEEKLY_CAP = 3;
    var MOUNT_FLAG = 'data-review-mounted';
    var appealsByQ = {};   // question_id -> existing review_requests row (this lesson, this student)
    var loadedUser = null; // cached auth user (or null)
    var scanQueued = false;

    var REASONS = [
      { code: 'think_correct',        en: 'I think my answer is correct',     zh: '我觉得我的答案是对的' },
      { code: 'ai_marked_wrong_spot', en: 'The AI marked the wrong part',     zh: 'AI 改错了地方' },
      { code: 'question_problem',     en: 'The question itself has a problem', zh: '题目本身有问题' },
      { code: 'system_broken',        en: 'The system seems broken',          zh: '系统好像坏了' }
    ];

    function lang() {
      try { return localStorage.getItem(LS_LANG) === 'zh' ? 'zh' : 'en'; } catch (e) { return 'en'; }
    }
    function relangNewNodes() { try { setLang(lang()); } catch (e) {} }

    // lesson identity (variant-agnostic, no UUID needed)
    function lessonPath() {
      var p = (location.pathname || '').replace(/\.html$/i, '');
      return p || '/';
    }
    function lessonLabel() {
      var h = document.querySelector('h1, .lesson-title, .topbar__title');
      var t = (h && h.textContent || document.title || '').trim();
      return t.slice(0, 200);
    }

    // ── junk guard for the written reason (mirrors lesson strict-grading spirit) ──
    function looksGibberish(s) {
      s = (s || '').trim();
      if (s.length < 10) return true;
      if (/^(.)\1+$/.test(s.replace(/\s/g, ''))) return true;          // "aaaaaa"
      var letters = (s.match(/[a-z一-龥]/gi) || []).length;
      if (letters < 4) return true;                                    // mostly punctuation/numbers
      var uniq = {}; (s.toLowerCase().match(/[a-z一-龥]/g) || []).forEach(function (c) { uniq[c] = 1; });
      if (Object.keys(uniq).length < 3) return true;                   // "asasasas"
      return false;
    }

    // ════════ snapshot extraction (best-effort across lesson variants) ════════
    function textOf(el) { return el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

    // L01-style: a "<qid>-feedback" element that became visible right/wrong
    function fromL01Feedback(fb) {
      var id = fb.id || '';
      var m = id.match(/^(.+)-feedback$/);
      if (!m) return null;
      var qid = m[1];
      var verdict = fb.classList.contains('feedback-right') ? 'correct'
                  : fb.classList.contains('feedback-wrong') ? 'wrong' : null;
      if (!verdict) return null;
      var container = fb.closest('.question-block') || fb.parentElement;
      var input = document.getElementById(qid + '-input');
      var ansEl = document.getElementById(qid + '-answer') ||
                  document.getElementById(qid + '-model') ||
                  (container && container.querySelector('.answer-reveal-text, .model-answer, [data-model-answer]'));
      var maxMarks = parseMarks(container);
      return {
        anchor: fb, container: container, qid: qid, verdict: verdict,
        studentAnswer: input ? (input.value || '').trim() : '',
        aiReason: textOf(fb).slice(0, 1000),
        modelAnswer: textOf(ansEl).slice(0, 1000),
        questionStem: stemOf(container, qid),
        aiMax: maxMarks,
        aiScore: (verdict === 'correct' ? (maxMarks != null ? maxMarks : null) : 0),
        showAnsBtn: document.getElementById(qid + '-show-ans-btn')
      };
    }

    // Engine MCQ-style: a ".q-block[data-answered=true]"
    function fromMcqBlock(block) {
      var qid = block.getAttribute('data-question');
      if (!qid) return null;
      var verdict = block.getAttribute('data-result') === 'correct' ? 'correct'
                  : block.getAttribute('data-result') === 'wrong' ? 'wrong' : null;
      if (!verdict) return null;
      var picked = block.querySelector('.option[data-state="correct"],.option[data-state="wrong"],.mcq-option[data-state="correct"],.mcq-option[data-state="wrong"]');
      var correctEl = block.querySelector('[data-state="reveal-correct"],.option[data-state="correct"],.mcq-option[data-state="correct"]');
      var fb = block.querySelector('.ai-feedback');
      var explain = fb && fb.querySelector('.ai-feedback__explain');
      var maxMarks = parseMarks(block);
      return {
        anchor: fb && fb.classList.contains('is-open') ? fb : block,
        container: block, qid: qid, verdict: verdict,
        studentAnswer: textOf(picked),
        aiReason: textOf(explain).slice(0, 1000),
        modelAnswer: textOf(correctEl).slice(0, 1000),
        questionStem: stemOf(block, qid),
        aiMax: maxMarks,
        aiScore: (verdict === 'correct' ? (maxMarks != null ? maxMarks : null) : 0),
        showAnsBtn: block.querySelector('.show-answer-btn,[data-action="show-answer"]')
      };
    }

    function parseMarks(container) {
      if (!container) return null;
      var t = container.textContent || '';
      // no \b after marks?: textContent runs the "1 mark" badge straight into the
      // next word ("1 markMaya"), so a trailing word boundary never matches.
      var m = t.match(/(\d+)\s*marks?/i);
      return m ? parseInt(m[1], 10) : null;
    }
    function stemOf(container, qid) {
      if (!container) return '';
      var sel = container.querySelector('.question-text,[data-question-stem],.q-stem,.question__stem');
      if (sel) return textOf(sel).slice(0, 600);
      // No clean selector: the question sentence sits BEFORE the answer input; the
      // model-answer reveal comes AFTER it. So scan only the direct children before
      // the input holder, skipping the badge header (Q04 · STATE · 1 mark) and the
      // .zh translation. Avoids the textContent mash ("Q04STATE1 markA torch...")
      // AND avoids picking up the show-answer block.
      var kids = Array.prototype.slice.call(container.children);
      var input = container.querySelector('input, textarea');
      var stop = kids.length;
      if (input) {
        for (var i = 0; i < kids.length; i++) {
          if (kids[i] === input || kids[i].contains(input)) { stop = i; break; }
        }
      }
      var best = '';
      for (var j = 0; j < stop; j++) {
        var ch = kids[j];
        if (ch.matches && ch.matches('.zh, button, [id$="-feedback"]')) continue;
        var t = textOf(ch);
        if (!t) continue;
        if (/^Q\s*\d+/i.test(t)) continue;            // badge header row
        if (t.length < 25 && /mark/i.test(t)) continue; // stray mark badge
        if (t.length > best.length) best = t;
      }
      return best.slice(0, 600);
    }

    function collectGraded() {
      var out = [];
      document.querySelectorAll('[id$="-feedback"]').forEach(function (fb) {
        if (fb.getAttribute(MOUNT_FLAG)) return;
        var vis = fb.offsetParent !== null || (fb.style && fb.style.display === 'block');
        if (!vis) return;
        var info = fromL01Feedback(fb);
        if (info) out.push(info);
      });
      document.querySelectorAll('.q-block[data-answered="true"]').forEach(function (block) {
        if (block.getAttribute(MOUNT_FLAG)) return;
        var info = fromMcqBlock(block);
        if (info) out.push(info);
      });
      return out;
    }

    // ════════ UI: the per-question button bar + status pill ════════
    function statusLabel(status) {
      if (status === 'resolved')  return { en: 'Resolved',  zh: '已处理' };
      if (status === 'in_review') return { en: 'In review', zh: '复核中' };
      return { en: 'Submitted', zh: '已提交' };
    }

    function pillHTML(row) {
      var s = statusLabel(row.status);
      var bar = document.createElement('div');
      bar.className = 'review-bar review-bar--status';
      bar.setAttribute('data-status', row.status);
      var pill = document.createElement('span');
      pill.className = 'review-pill review-pill--' + row.status;
      var dot = document.createElement('span'); dot.className = 'review-pill__dot';
      var lbl = document.createElement('span'); lbl.setAttribute('data-en', '👩‍🏫 Teacher review: ' + s.en); lbl.setAttribute('data-zh', '👩‍🏫 老师复核:' + s.zh);
      pill.appendChild(dot); pill.appendChild(lbl);
      bar.appendChild(pill);
      if (row.status === 'resolved' && row.resolved_message) {
        var msg = document.createElement('div');
        msg.className = 'review-resolved-msg';
        msg.textContent = row.resolved_message;
        bar.appendChild(msg);
      }
      return bar;
    }

    function btn(cls, en, zh) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'review-btn ' + cls;
      var s = document.createElement('span');
      s.setAttribute('data-en', en); s.setAttribute('data-zh', zh);
      b.appendChild(s);
      return b;
    }

    function mount(info) {
      if (!info || !info.anchor) return;
      // de-dupe: flag the feedback anchor AND container
      info.anchor.setAttribute(MOUNT_FLAG, '1');
      if (info.container) info.container.setAttribute(MOUNT_FLAG, '1');

      // already has an appeal? show its status instead of the file button
      var existing = appealsByQ[info.qid];
      if (existing) {
        info.anchor.insertAdjacentElement('afterend', pillHTML(existing));
        relangNewNodes();
        return;
      }

      var bar = document.createElement('div');
      bar.className = 'review-bar';

      var explainBtn = btn('review-btn--explain', '🔁 Explain again', '🔁 再解释一次');
      explainBtn.addEventListener('click', function () { reExplain(info, explainBtn); });

      var reviewBtn = btn('review-btn--review', '🙋 Ask teacher to review', '🙋 请老师复核');
      reviewBtn.addEventListener('click', function () { openModal(info, bar); });

      bar.appendChild(explainBtn);
      bar.appendChild(reviewBtn);
      info.anchor.insertAdjacentElement('afterend', bar);
      relangNewNodes();
    }

    // ── 再解释一次: re-surface the lesson's OWN explanation. No DB, no notify. ──
    // Purpose per order: reduce false review requests. (Not an LLM call in MVP.)
    function reExplain(info, sourceBtn) {
      try { if (info.showAnsBtn) { info.showAnsBtn.style.display = 'inline-block'; info.showAnsBtn.click(); } } catch (e) {}
      var panel = info.container && info.container.querySelector('.review-explain-again');
      if (!panel) {
        panel = document.createElement('div');
        panel.className = 'review-explain-again';
        var head = document.createElement('div');
        head.className = 'review-explain-again__head';
        head.setAttribute('data-en', '🔁 Let’s look at this again');
        head.setAttribute('data-zh', '🔁 我们再看一次这题');
        var body = document.createElement('div');
        body.className = 'review-explain-again__body';
        var reason = (info.aiReason || '').trim();
        var model = (info.modelAnswer || '').trim();
        var enParts = [], zhParts = [];
        if (reason) { enParts.push(reason); zhParts.push(reason); }
        if (model)  { enParts.push('Model answer: ' + model); zhParts.push('参考答案:' + model); }
        enParts.push('Re-read it slowly. Still think the mark is wrong? Then ask the teacher to review.');
        zhParts.push('慢慢再读一遍。还是觉得分数不对?那就请老师复核。');
        body.setAttribute('data-en', enParts.join('  '));
        body.setAttribute('data-zh', zhParts.join('  '));
        panel.appendChild(head); panel.appendChild(body);
        (sourceBtn.closest('.review-bar') || info.anchor).insertAdjacentElement('afterend', panel);
      }
      panel.classList.add('is-open');
      relangNewNodes();
      try { panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
    }

    // ════════ the 请老师复核 modal (3 gates) ════════
    var modalEl = null;
    function ensureModal() {
      if (modalEl) return modalEl;
      var ov = document.createElement('div');
      ov.className = 'review-modal-ov';
      ov.innerHTML =
        '<div class="review-modal" role="dialog" aria-modal="true">' +
          '<button type="button" class="review-modal__x" aria-label="Close">×</button>' +
          '<h3 class="review-modal__title" data-en="Ask the teacher to review this question" data-zh="请老师复核这一题"></h3>' +
          '<p class="review-modal__q"></p>' +
          '<label class="review-modal__lab" data-en="1 · Why? (pick one)" data-zh="1 · 为什么?(选一个)"></label>' +
          '<select class="review-modal__reason"><option value="" data-en="— choose a reason —" data-zh="— 选择原因 —"></option></select>' +
          '<label class="review-modal__lab" data-en="2 · Tell us in one line (at least 10 characters)" data-zh="2 · 写一句理由(至少 10 个字)"></label>' +
          '<textarea class="review-modal__reason-text" rows="3" maxlength="500"></textarea>' +
          '<div class="review-modal__err" data-en="" data-zh=""></div>' +
          '<div class="review-modal__cap"></div>' +
          '<div class="review-modal__actions">' +
            '<button type="button" class="review-modal__cancel" data-en="Cancel" data-zh="取消"></button>' +
            '<button type="button" class="review-modal__submit" data-en="Submit" data-zh="提交"></button>' +
          '</div>' +
        '</div>';
      var sel = ov.querySelector('.review-modal__reason');
      REASONS.forEach(function (r) {
        var o = document.createElement('option');
        o.value = r.code; o.setAttribute('data-en', r.en); o.setAttribute('data-zh', r.zh);
        sel.appendChild(o);
      });
      ov.querySelector('.review-modal__x').addEventListener('click', closeModal);
      ov.querySelector('.review-modal__cancel').addEventListener('click', closeModal);
      ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
      document.body.appendChild(ov);
      modalEl = ov;
      return ov;
    }
    function closeModal() { if (modalEl) modalEl.classList.remove('is-open'); }

    function setErr(ov, en, zh) {
      var e = ov.querySelector('.review-modal__err');
      e.setAttribute('data-en', en || ''); e.setAttribute('data-zh', zh || '');
      e.classList.toggle('is-on', !!en);
      relangNewNodes();
    }

    async function openModal(info, bar) {
      var ov = ensureModal();
      ov.querySelector('.review-modal__reason').value = '';
      ov.querySelector('.review-modal__reason-text').value = '';
      setErr(ov, '', '');
      ov.querySelector('.review-modal__q').textContent =
        (info.qid || '') + (info.questionStem ? ' · ' + info.questionStem.slice(0, 120) : '');
      var capEl = ov.querySelector('.review-modal__cap');
      var submit = ov.querySelector('.review-modal__submit');
      ov.classList.add('is-open');
      relangNewNodes();

      // gate 3 (cap) — check before they type
      var sb = await ensureSupabase();
      var user = await currentUser(sb);
      if (!user) {
        capEl.textContent = '';
        setErr(ov, 'Please log in first, then you can request a review.', '请先登录,再请老师复核。');
        submit.disabled = true;
        return;
      }
      var used = await weeklyCount(sb, user);
      var left = Math.max(0, WEEKLY_CAP - used);
      capEl.setAttribute('data-en', 'Reviews left this week: ' + left + ' / ' + WEEKLY_CAP);
      capEl.setAttribute('data-zh', '本周复核次数:还剩 ' + left + ' / ' + WEEKLY_CAP);
      relangNewNodes();
      if (left <= 0) {
        submit.disabled = true;
        setErr(ov, 'You have used all your reviews this week. Please try again next week.',
                   '本周复核次数已用完,下周再试。');
        return;
      }
      submit.disabled = false;

      var onSubmit = function () {
        var code = ov.querySelector('.review-modal__reason').value;
        var txt = (ov.querySelector('.review-modal__reason-text').value || '').trim();
        if (!code) { setErr(ov, 'Please pick a reason first.', '请先选一个原因。'); return; }
        if (looksGibberish(txt)) {
          setErr(ov, 'Please write a real reason — at least 10 characters.',
                     '请写一句真实的理由 — 至少 10 个字。'); return;
        }
        submit.disabled = true;
        setErr(ov, '', '');
        doInsert(info, code, txt, sb, user).then(function (row) {
          if (!row) { submit.disabled = false; setErr(ov, 'Could not submit — please try again.', '提交失败 — 请再试一次。'); return; }
          appealsByQ[info.qid] = row;
          closeModal();
          // swap the button bar for a status pill + reassurance
          if (bar && bar.parentNode) {
            var pill = pillHTML(row);
            bar.parentNode.replaceChild(pill, bar);
            var note = document.createElement('div');
            note.className = 'review-submitted-note';
            note.setAttribute('data-en', '✓ Got it — you’re in the queue. Keep learning; the teacher will look soon.');
            note.setAttribute('data-zh', '✓ 已收到,排队中。你可以继续学习,老师会尽快看。');
            pill.insertAdjacentElement('afterend', note);
            relangNewNodes();
          }
        });
      };
      submit.onclick = onSubmit;
    }

    async function currentUser(sb) {
      try {
        if (!sb) return null;
        var s = await sb.auth.getSession();
        var u = s && s.data && s.data.session && s.data.session.user;
        if (u) return u;
        var g = await sb.auth.getUser();
        return (g && g.data && g.data.user) || null;
      } catch (e) { return null; }
    }

    function startOfWeekISO() {
      var d = new Date();
      var day = (d.getDay() + 6) % 7;            // Monday = 0
      d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day);
      return d.toISOString();
    }

    async function weeklyCount(sb, user) {
      try {
        var res = await sb.from('review_requests')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', user.id)
          .gte('created_at', startOfWeekISO());
        return res && typeof res.count === 'number' ? res.count : 0;
      } catch (e) { return 0; }
    }

    async function doInsert(info, code, txt, sb, user) {
      try {
        var payload = {
          student_id: user.id,
          lesson_path: lessonPath(),
          lesson_label: lessonLabel(),
          question_id: info.qid,
          question_stem: info.questionStem || null,
          student_answer: info.studentAnswer || null,
          ai_verdict: info.verdict || null,
          ai_score: (typeof info.aiScore === 'number' ? info.aiScore : null),
          ai_max: (typeof info.aiMax === 'number' ? info.aiMax : null),
          ai_reason: info.aiReason || null,
          model_answer: info.modelAnswer || null,
          student_reason_code: code,
          student_reason: txt,
          status: 'submitted'
        };
        var res = await sb.from('review_requests').insert(payload).select().single();
        if (res.error) { console.warn('[Review] insert failed:', res.error.message); return null; }
        return res.data;
      } catch (e) { console.warn('[Review] insert error:', e && e.message); return null; }
    }

    // ════════ boot / observe ════════
    function scan() {
      scanQueued = false;
      try { collectGraded().forEach(mount); } catch (e) {}
    }
    function queueScan() {
      if (scanQueued) return;
      scanQueued = true;
      // setTimeout (not requestAnimationFrame): rAF is fully PAUSED in background
      // tabs, so the deferred scan would never run; setTimeout still fires.
      setTimeout(scan, 80);
    }

    async function preloadAppeals() {
      try {
        var sb = await ensureSupabase();
        var user = await currentUser(sb);
        loadedUser = user;
        if (!user) return;
        var res = await sb.from('review_requests')
          .select('id,question_id,status,resolved_message,resolved_score,resolution_action')
          .eq('student_id', user.id)
          .eq('lesson_path', lessonPath());
        if (res && res.data) res.data.forEach(function (r) { appealsByQ[r.question_id] = r; });
      } catch (e) {}
    }

    async function init() {
      await preloadAppeals();
      scan();
      var obs = new MutationObserver(queueScan);
      obs.observe(document.body, {
        subtree: true, childList: true,
        attributes: true, attributeFilter: ['style', 'class', 'data-answered', 'data-result']
      });
      // belt-and-suspenders: re-scan when the tab regains focus (covers any
      // mutation that landed while the tab was backgrounded / scan throttled)
      document.addEventListener('visibilitychange', function () { if (!document.hidden) queueScan(); });
      window.addEventListener('focus', queueScan);
    }

    return { init: init };
  })();

  // ═════════════════════════════════════════════════════════════
  // SECTION 15: BOOT
  // ═════════════════════════════════════════════════════════════
  function boot() {
    // Apply Supabase-driven level (v1)
    if (typeof applyLevelFromURL === 'function') {
      try { applyLevelFromURL(); } catch (e) {}
    }

    // Sidebar nav clicks (v2 pattern)
    document.querySelectorAll('.sidebar__btn').forEach(btn => {
      btn.addEventListener('click', () => showScreen(btn.dataset.screen));
    });

    // Lang toggle clicks (v2 pattern)
    document.querySelectorAll('.lang-toggle button').forEach(b => {
      b.addEventListener('click', () => setLang(b.dataset.lang));
    });

    // [data-go] buttons → switch screen
    document.querySelectorAll('[data-go]').forEach(b => {
      b.addEventListener('click', () => showScreen(b.dataset.go));
    });

    // Mount Spark Jar if a slot exists
    const jarSlot = document.querySelector('[data-mount="spark-jar"]');
    if (jarSlot && window.SparkJar) window.SparkJar.mount(jarSlot);

    // Streak initial render
    SparkStreak.render();

    // Apply saved lang
    let saved = 'en';
    try { saved = localStorage.getItem(LS_LANG) || 'en'; } catch (e) {}
    setLang(saved);

    // Render mute toggle initial state
    renderMuteToggle();

    // Wire mute toggle button (if exists in HTML)
    const muteBtn = document.getElementById('mute-toggle') || document.querySelector('.mute-toggle');
    if (muteBtn && !muteBtn._wired) {
      muteBtn.addEventListener('click', toggleMute);
      muteBtn._wired = true;
    }

    // Setup content protection
    if (typeof setupContentProtection === 'function') {
      try { setupContentProtection(); } catch (e) {}
    }

    // Setup auto-save
    if (typeof setupAutoSave === 'function') {
      try { setupAutoSave(); } catch (e) {}
    }

    // PER-QUESTION CAPTURE — stamp first-touch time per question (for time_ms),
    // and warm the account-child cache so the first write is fast.
    try {
      document.addEventListener('focusin', function (e) {
        const block = (e.target && e.target.closest)
          ? e.target.closest('.question-block, .q-block') : null;
        if (!block) return;
        const qid = _pqQid(block);
        if (qid && !(qid in _pqTimers)) _pqTimers[qid] = Date.now();
      }, true);
      _pqResolveChild();
    } catch (e) {}

    // Inject TTS buttons (v1)
    if (typeof ttsInjectButtons === 'function') {
      try { ttsInjectButtons(); } catch (e) {}
    }

    // Inject 🎤 voice-input buttons (engine-level; auto-hidden if unsupported)
    if (typeof voiceInjectButtons === 'function') {
      try { voiceInjectButtons(); } catch (e) {}
    }

    // 求救按钮 — auto-mount 再解释一次 / 请老师复核 on graded questions (MVP 2026-06-20)
    if (REVIEW && typeof REVIEW.init === 'function') {
      try { REVIEW.init(); } catch (e) {}
    }

    // Start on Hook (or screen from URL param ?s=, or saved progress)
    const params = new URLSearchParams(location.search);
    let startScreen = params.get('s') || 'hook';
    const lessonId = document.body.getAttribute('data-lesson-id') || document.body.getAttribute('data-lesson');
    if (lessonId && !params.get('s')) {
      try {
        const saved = localStorage.getItem(LS_PROGRESS_PREFIX + lessonId);
        if (saved && SCREENS.includes(saved)) startScreen = saved;
      } catch (e) {}
    }
    showScreen(startScreen);

    // Render constellation when entering Wrap
    document.querySelectorAll('.sidebar__btn[data-screen="wrap"], [data-go="wrap"]').forEach(b => {
      b.addEventListener('click', () => {
        const slot = document.querySelector('[data-mount="constellation"]');
        if (slot && window.ConstellationMap) {
          window.ConstellationMap.render(slot, collectAnswers());
          setLang(localStorage.getItem(LS_LANG) || 'en');
        }
      });
    });

    // ── v4: reduced-motion boot detection + OS-change listener (Spec 2 §8) ──
    try {
      var _mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (window.LessonShell) window.LessonShell.setReducedMotion(_mq.matches);
      var _onMq = function (e) { if (window.LessonShell) window.LessonShell.setReducedMotion(e.matches); };
      if (_mq.addEventListener) _mq.addEventListener('change', _onMq);
      else if (_mq.addListener) _mq.addListener(_onMq); // old Safari
    } catch (e) {}

    // ── v4: on page close, snapshot final widget state then unmount all (Spec 2 §5) ──
    window.addEventListener('beforeunload', function () {
      try { if (window.LessonShell) window.LessonShell._snapshotAndUnmountAll(); } catch (e) {}
    });
  }

  // ═════════════════════════════════════════════════════════════
  // v4 WIDGET RUNTIME — window.LessonShell { mount, unmount, getState, setReducedMotion }
  // Spec 2 §4 interface lock. This layer only: mount / unmount / snapshot state /
  // toggle reduced-motion + 5-layer error fallback. 题型 logic lives in each widget.
  // (per 锁 #19 / #21 — new file; v3 frozen)
  // ═════════════════════════════════════════════════════════════
  (function initLessonShell() {
    var ALLOWED = ['lottie', 'canvas', 'svg', 'framer', 'interact', 'css'];
    var mounted = new Map();   // slot element → handle
    var handlers = {};         // type → factory(el, config, ctx) → handle
    var reducedMotion = false;
    var lastSnapshot = {};

    function resolveSlot(slot) {
      if (!slot) return null;
      if (typeof slot === 'string') return document.querySelector(slot);
      return slot.nodeType === 1 ? slot : null;
    }
    function canvasSupported() {
      try {
        var c = document.createElement('canvas');
        return !!(c.getContext && c.getContext('2d'));
      } catch (e) { return false; }
    }
    function parseAssets(raw) {
      if (!raw) return {};
      try {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return { list: parsed };
        return parsed;
      } catch (e) { return { raw: raw }; }
    }

    // ── handler registration (lottie / svg / framer brought by assets or Spec 4) ──
    function register(type, factory) {
      if (ALLOWED.indexOf(type) === -1) {
        console.warn('[LessonShell] register: unknown type "' + type + '" (ignored)');
        return;
      }
      handlers[type] = factory;
    }

    // ── 5-layer fallback (Spec 2 §11): static PNG if given, else alt text. Lesson never dies. ──
    function renderAltText(el, opts) {
      var div = document.createElement('div');
      div.className = 'widget-fallback-text';
      div.textContent = (opts && opts.alt) || 'Interactive content unavailable · 互动内容暂时无法显示';
      el.innerHTML = '';
      el.appendChild(div);
    }
    function renderFallback(el, config) {
      config = config || {};
      var opts = config.options || {};
      var assets = config.assets || {};
      var png = assets.fallback || assets.png || opts.fallbackImage;
      el.innerHTML = '';
      if (png) {
        var img = new Image();
        img.alt = opts.alt || '';
        img.className = 'widget-fallback-img';
        img.onerror = function () { renderAltText(el, opts); }; // asset 404 → alt text
        img.src = png;
        el.appendChild(img);
      } else {
        renderAltText(el, opts);
      }
    }

    // ── built-in handler: CSS micro-motion (just honours reduced-motion class) ──
    handlers.css = function (el, config, ctx) {
      el.classList.add('widget-css');
      if (ctx.reducedMotion) el.classList.add('reduced-motion');
      return {
        el: el, type: 'css',
        destroy: function () { el.classList.remove('widget-css', 'reduced-motion'); },
        getState: function () { return { value: null, attempts: 0 }; },
        setReducedMotion: function (b) { el.classList.toggle('reduced-motion', !!b); }
      };
    };

    // ── built-in handler: interact (drag/drop infra via bundled interact.js) ──
    // Layer-4 fallback (Spec 2 §11): if interact.js missing/fails → click-to-connect.
    handlers.interact = function (el, config, ctx) {
      var attempts = 0;
      var placements = {};
      var draggables = el.querySelectorAll('[data-draggable]');
      var dropzones = el.querySelectorAll('[data-dropzone]');
      var cleanupFns = [];
      var useInteract = !!window.interact;

      function recordDrop(dId, zId, zoneEl) {
        placements[dId] = zId;
        if (zoneEl) zoneEl.classList.add('widget-drop-filled');
        attempts++;
        el.dispatchEvent(new CustomEvent('widget:drop', { detail: { draggable: dId, dropzone: zId } }));
      }

      if (useInteract) {
        try {
          draggables.forEach(function (d) {
            window.interact(d).draggable({
              inertia: false,
              listeners: {
                move: function (event) {
                  var t = event.target;
                  var x = (parseFloat(t.getAttribute('data-x')) || 0) + event.dx;
                  var y = (parseFloat(t.getAttribute('data-y')) || 0) + event.dy;
                  t.style.transform = 'translate(' + x + 'px,' + y + 'px)';
                  t.setAttribute('data-x', x);
                  t.setAttribute('data-y', y);
                }
              }
            });
          });
          dropzones.forEach(function (z) {
            window.interact(z).dropzone({
              accept: '[data-draggable]',
              overlap: 0.5,
              ondrop: function (event) {
                recordDrop(event.relatedTarget.getAttribute('data-draggable'),
                           event.target.getAttribute('data-dropzone'), event.target);
              }
            });
          });
        } catch (e) {
          console.warn('[LessonShell] interact init failed → click-to-connect:', e && e.message);
          useInteract = false;
        }
      }

      if (!useInteract) {
        var pending = null;
        var onDrag = function (e) {
          if (pending) pending.classList.remove('widget-selected');
          pending = e.currentTarget;
          pending.classList.add('widget-selected');
        };
        var onZone = function (e) {
          if (!pending) return;
          recordDrop(pending.getAttribute('data-draggable'),
                     e.currentTarget.getAttribute('data-dropzone'), e.currentTarget);
          pending.classList.remove('widget-selected');
          pending = null;
        };
        draggables.forEach(function (d) {
          d.addEventListener('click', onDrag);
          cleanupFns.push(function () { d.removeEventListener('click', onDrag); });
        });
        dropzones.forEach(function (z) {
          z.addEventListener('click', onZone);
          cleanupFns.push(function () { z.removeEventListener('click', onZone); });
        });
        el.classList.add('widget-click-mode');
      }

      return {
        el: el, type: 'interact',
        destroy: function () {
          if (window.interact) {
            try {
              draggables.forEach(function (d) { window.interact(d).unset(); });
              dropzones.forEach(function (z) { window.interact(z).unset(); });
            } catch (e) {}
          }
          cleanupFns.forEach(function (fn) { try { fn(); } catch (e) {} });
          el.classList.remove('widget-click-mode');
        },
        getState: function () { return { value: placements, attempts: attempts }; },
        setReducedMotion: function () { /* drag has no playback to slow */ }
      };
    };

    // ── core API: mount(slot, type, config) → widget handle ──
    function mount(slot, type, config) {
      var el = resolveSlot(slot);
      if (!el) { console.warn('[LessonShell] mount: slot not found', slot); return null; }
      config = config || {};

      // graph blocker (Spec 2 §1): graph engine is a SEPARATE build. Not here → fallback.
      if (type === 'graph' || type === 'sketch_graph') {
        console.warn('[LessonShell] "' + type + '" widget is NOT available in v4 (separate graph build). Falling back.');
        renderFallback(el, config);
        return null;
      }
      if (ALLOWED.indexOf(type) === -1) {
        console.warn('[LessonShell] mount: unsupported type "' + type + '" → fallback');
        renderFallback(el, config);
        return null;
      }
      // capability degrade chain (Spec 2 §11 layer 3): Canvas → CSS → static → alt
      if (type === 'canvas' && !canvasSupported()) {
        console.warn('[LessonShell] canvas unsupported → degrade to css');
        type = handlers.css ? 'css' : type;
      }

      var factory = handlers[type];
      if (!factory) {
        // no handler yet (e.g. lottie/svg/framer asset-driven, not registered) → graceful fallback
        console.warn('[LessonShell] no handler registered for "' + type + '" → fallback');
        renderFallback(el, config);
        return null;
      }

      var handle;
      try {
        handle = factory(el, config, { reducedMotion: reducedMotion });
      } catch (e) {
        console.warn('[LessonShell] widget "' + type + '" mount error (lesson continues):', e && e.message);
        renderFallback(el, config);
        return null;
      }
      if (!handle) { renderFallback(el, config); return null; }
      handle.type = handle.type || type;
      mounted.set(el, handle);
      el.setAttribute('data-widget-mounted', 'true');
      return handle;
    }

    // ── core API: unmount(slot) → true/false ──
    function unmount(slot) {
      var el = resolveSlot(slot);
      if (!el) return false;
      var handle = mounted.get(el);
      if (!handle) return false;
      try { if (typeof handle.destroy === 'function') handle.destroy(); }
      catch (e) { console.warn('[LessonShell] unmount error:', e && e.message); }
      mounted.delete(el);
      el.removeAttribute('data-widget-mounted');
      return true;
    }

    // ── core API: getState(slot) → { type, value, attempts, timestamp } ──
    function getState(slot) {
      var el = resolveSlot(slot);
      var handle = el && mounted.get(el);
      var inner = {};
      if (handle && typeof handle.getState === 'function') {
        try { inner = handle.getState() || {}; } catch (e) { inner = {}; }
      }
      return {
        type: handle ? handle.type : null,
        value: (inner.value != null) ? inner.value : null,
        attempts: inner.attempts || 0,
        timestamp: new Date().toISOString()
      };
    }

    // ── core API: setReducedMotion(bool) → current flag ──
    function setReducedMotion(bool) {
      reducedMotion = !!bool;
      if (document.body) document.body.classList.toggle('reduced-motion', reducedMotion);
      mounted.forEach(function (handle) {
        if (handle && typeof handle.setReducedMotion === 'function') {
          try { handle.setReducedMotion(reducedMotion); } catch (e) {}
        }
      });
      return reducedMotion;
    }

    // ── internal: scan a screen and (un)mount its declared widgets ──
    // Only slots with BOTH data-mount AND data-widget — so spark-jar / constellation
    // (data-mount only) are left to their own v3 mount paths.
    function mountWithin(scopeEl) {
      if (!scopeEl) return;
      scopeEl.querySelectorAll('[data-mount][data-widget]').forEach(function (el) {
        if (mounted.has(el)) return; // already mounted → skip (no double-mount)
        var type = el.getAttribute('data-widget');
        var config = { assets: parseAssets(el.getAttribute('data-assets')), initialState: null, options: {} };
        var optAttr = el.getAttribute('data-options');
        if (optAttr) { try { config.options = JSON.parse(optAttr); } catch (e) {} }
        mount(el, type, config);
      });
    }
    function unmountWithin(scopeEl) {
      if (!scopeEl) return;
      scopeEl.querySelectorAll('[data-mount][data-widget]').forEach(function (el) {
        if (mounted.has(el)) unmount(el);
      });
    }

    // ── internal: page-close snapshot then unmount all (Spec 2 §5) ──
    function snapshotAndUnmountAll() {
      mounted.forEach(function (handle, el) {
        try {
          var key = el.getAttribute('data-mount') || el.id || 'widget';
          lastSnapshot[key] = getState(el);
        } catch (e) {}
      });
      window.LessonShell._lastSnapshot = lastSnapshot; // external supabase write hooks here (Spec 2 §5)
      Array.from(mounted.keys()).forEach(function (el) { unmount(el); });
    }

    // global error guard (Spec 2 §11 layer 5): a widget runtime error must not crash the lesson
    window.addEventListener('error', function (ev) {
      if (ev && ev.message && /LessonShell|widget/i.test(ev.message)) {
        console.warn('[LessonShell] caught widget error (lesson continues):', ev.message);
      }
    });

    window.LessonShell = {
      mount: mount,
      unmount: unmount,
      getState: getState,
      setReducedMotion: setReducedMotion,
      register: register,
      isReducedMotion: function () { return reducedMotion; },
      _mountWithin: mountWithin,
      _unmountWithin: unmountWithin,
      _snapshotAndUnmountAll: snapshotAndUnmountAll,
      _mounted: mounted,
      version: 'v4.0.0'
    };
  })();

  // ═════════════════════════════════════════════════════════════
  // EXPOSE GLOBALS (lesson HTML calls these via onclick=)
  // ═════════════════════════════════════════════════════════════
  window.showScreen = showScreen;
  window.setLang = setLang;
  window.submitAnswer = submitAnswer;
  window.selectOpt = selectOpt;
  window.toggleHint = toggleHint;
  window.toggleAns = toggleAns;
  window.gradeTextAnswer = gradeTextAnswer;   // keyword-gate typed-answer grader (Order 2026-06-20)
  window.toggleMute = toggleMute;
  window.playSound = playSound;
  window.trackProgress = trackProgress;
  window.collectAnswers = collectAnswers;
  window.SparkStreak = SparkStreak;

  // v1 globals (exposed if defined in copied sections)
  if (typeof awardXP === 'function')               window.awardXP = awardXP;
  if (typeof updateXPDisplay === 'function')       window.updateXPDisplay = updateXPDisplay;
  if (typeof showToast === 'function')             window.showToast = showToast;
  if (typeof completeLesson === 'function')        window.completeLesson = completeLesson;
  if (typeof closeSurprise === 'function')         window.closeSurprise = closeSurprise;
  if (typeof toggleBubble === 'function')          window.toggleBubble = toggleBubble;
  if (typeof closeBubble === 'function')           window.closeBubble = closeBubble;
  if (typeof openAITutor === 'function')           window.openAITutor = openAITutor;
  if (typeof closeAITutor === 'function')          window.closeAITutor = closeAITutor;
  if (typeof showBubbleForScreen === 'function')   window.showBubbleForScreen = showBubbleForScreen;
  if (typeof doudouReact === 'function')           window.doudouReact = doudouReact;
  if (typeof doudouAnimate === 'function')         window.doudouAnimate = doudouAnimate;
  if (typeof doudouShowBubble === 'function')      window.doudouShowBubble = doudouShowBubble;
  if (typeof ttsToggle === 'function')             window.ttsToggle = ttsToggle;
  if (typeof ttsPlay === 'function')               window.ttsPlay = ttsPlay;
  if (typeof ttsStop === 'function')               window.ttsStop = ttsStop;
  if (typeof setupContentProtection === 'function') window.setupContentProtection = setupContentProtection;
  if (typeof setupAutoSave === 'function')         window.setupAutoSave = setupAutoSave;
  if (typeof applyLevelFromURL === 'function')     window.applyLevelFromURL = applyLevelFromURL;
  if (typeof voiceInjectButtons === 'function')    window.voiceInjectButtons = voiceInjectButtons;

  // Boot when ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(); // end IIFE
