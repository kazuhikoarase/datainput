//
// datainput - event-target
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

  var createEventTarget = function() {
    var map = {};
    var listeners = function(type) { return map[type] || (map[type] = []); };
    return {
      trigger : function(type, detail) {
        var ctx = this;
        listeners(type).forEach(function(listener) {
          listener.call(ctx, { type : type }, detail);
        });
        return this;
      },
      on : function(type, listener) {
        listeners(type).push(listener);
        return this;
      },
      off : function(type, listener) {
        map[type] = listeners(type).filter(function(l) {
          return listener != l;
        });
        return this;
      }
    };
  };

  $d.createEventTarget = createEventTarget;

}(window.datainput || (window.datainput = {}) );
