//
// datainput - util
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/datainput/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

!function($d) {

  'use strict'

  var util = function() {

    var parseArguments = function(args) {
      var children = [];
      var opts = {};
      for (var i = 1; i < args.length; i += 1) {
        var a = args[i];
        if (typeof a == 'object') {
          if (typeof a.splice == 'function') {
            children = a;
          } else {
            opts = a;
          }
        }
      }
      return { children : children, opts : opts };
    };

    return {

      extend : function() {
        var o = arguments[0];
        for (var i = 1; i < arguments.length; i += 1) {
          var a = arguments[i];
          for (var k in a) {
            o[k] = a[k];
          };
        }
        return o;
      },

      replaceClassNamePrefix : function() {
        var classNamePrefixRe = /\$\{prefix\}/g;
        return function(className) {
          return className.replace(classNamePrefixRe, $d.classNamePrefix);
        };
      }(),

      set : function(elm, opts) {
        if (opts.attrs) {
          for (var k in opts.attrs) {
            var v = opts.attrs[k];
            var t = typeof v;
            if (t == 'number' || t == 'boolean') {
              v = '' + v;
            } else if (t == 'undefined') {
              v = '';
            }
            if (typeof v != 'string') {
              throw 'bad attr type for ' + k + ':' + (typeof v);
            }
            if (k == 'class') {
              v = this.replaceClassNamePrefix(v);
            }
            elm.setAttribute(k, v);
          }
        }
        if (opts.props) {
          for (var k in opts.props) {
            elm[k] = opts.props[k];
          }
        }
        if (opts.style) {
          for (var k in opts.style) {
            elm.style[k] = opts.style[k] || '';
          }
        }
        if (opts.on) {
          for (var k in opts.on) {
            elm.addEventListener(k, opts.on[k]);
          }
        }
        return elm;
      },

      createElement : function(tagName) {
        var args = parseArguments(arguments);
        var elm = document.createElement(tagName);
        args.children.forEach(function(child) { elm.appendChild(child); });
        return this.set(elm, args.opts);
      }
    };
  }();

  $d.util = util;

}(window.datainput || (window.datainput = {}) );
