(function(e){function r(r){var t=r[0];var l=r[1];var u=r[2];var i,s,m=0,p=[];for(;m<t.length;m++){s=t[m];if(n[s]){p.push(n[s][0])}n[s]=0}for(i in l){if(Object.prototype.hasOwnProperty.call(l,i)){e[i]=l[i]}}if(c)c(r);while(p.length){p.shift()()}o.push.apply(o,u||[]);return a()}function a(){var e;for(var r=0;r<o.length;r++){var a=o[r];var t=true;for(var u=1;u<a.length;u++){var i=a[u];if(n[i]!==0)t=false}if(t){o.splice(r--,1);e=l(l.s=a[0])}}return e}var t={};var n={9:0};var o=[];function l(r){if(t[r]){return t[r].exports}var a=t[r]={i:r,l:false,exports:{}};e[r].call(a.exports,a,a.exports,l);a.l=true;return a.exports}l.m=e;l.c=t;l.d=function(e,r,a){if(!l.o(e,r)){Object.defineProperty(e,r,{configurable:false,enumerable:true,get:a})}};l.r=function(e){Object.defineProperty(e,"__esModule",{value:true})};l.n=function(e){var r=e&&e.__esModule?function r(){return e["default"]}:function r(){return e};l.d(r,"a",r);return r};l.o=function(e,r){return Object.prototype.hasOwnProperty.call(e,r)};l.p="";var u=window["webpackJsonp"]=window["webpackJsonp"]||[];var i=u.push.bind(u);u.push=r;u=u.slice();for(var s=0;s<u.length;s++)r(u[s]);var c=i;o.push([417,0]);return a()})({416:function(e,r,a){"use strict";a.r(r);var t=a(545);var n=a.n(t);var o=a(109);var l=a(55);var u=a(327);var i=a(25);var s=a(120);var c=a(58);var m=a(36);var p=a(46);var f=a(30);var v=a(52);var d={};d.module=angular.module("gmfapp",["gettext",o["a"].name,l["a"].name,u["a"].name,i["a"].module.name,s["a"].name]);d.module.value("gmfTreeUrl","https://geomapfish-demo.camptocamp.com/2.3/wsgi/themes?"+"version=2&background=background");d.module.value("gmfPrintUrl","https://geomapfish-demo.camptocamp.com/2.3/wsgi/printproxy");d.module.value("authenticationBaseUrl","https://geomapfish-demo.camptocamp.com/2.3/wsgi");d.module.value("gmfLayersUrl","https://geomapfish-demo.camptocamp.com/2.3/wsgi/layers/");d.module.constant("defaultTheme","Demo");d.module.constant("angularLocaleScript","../build/angular-locale_{{locale}}.js");d.MainController=function(e,r){var a=this;e.loadThemes();this.map=new m["a"]({layers:[new f["a"]({source:new v["a"]})],view:new p["a"]({projection:c["a"],resolutions:[200,100,50,20,10,5,2.5,2,1,.5],center:[537635,152640],zoom:3})});this.defaulPrintFieldstValues={comments:"Default comments example",legend:true};this.themes=undefined;this.treeSource=undefined;e.getThemesObject().then(function(e){if(e){a.themes=e;a.treeSource=e[3]}});r.init(this.map)};d.MainController.$inject=["gmfThemes","ngeoFeatureOverlayMgr"];d.module.controller("MainController",d.MainController);r["default"]=d},417:function(e,r,a){a(73);a(72);e.exports=a(416)},545:function(e,r){}});
//# sourceMappingURL=print.10d7b6.js.map