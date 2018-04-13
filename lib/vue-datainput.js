//
// vue-datainput
//
// Copyright (c) 2018 Kazuhiko Arase
//
// URL: https://github.com/kazuhikoarase/datainput/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//

Vue.component('datainput', {
  template: '<span class="datainput"></span>',
  props : {
    format : { 'default' : function() { return undefined; } },
    numCharsInMonospace : { 'default' : function() { return undefined; } },
    textAlign : { 'default' : function() { return undefined; } },
    fieldRe : { 'default' : function() { return undefined; } },
    fieldInputRe : { 'default' : function() { return undefined; } },
    fieldNames : { 'default' : function() { return null; } },
    value : { 'default' : function() { return []; } }
  },
  watch: {
    value : function (newValue, oldValue) {
      this.$options.input.setValues(this.valueToArray(newValue) );
    }
  },
  methods : {
    arrayToValue : function(array) {
      if (this.fieldNames) {
        var value = {};
        this.fieldNames.forEach(function(fieldName, i) {
          value[fieldName] = array[i] || '';
        });
        return value;
      }
      return array;
    },
    valueToArray : function(value) {
      if (this.fieldNames) {
        var array = [];
        this.fieldNames.forEach(function(fieldName) {
          array.push(value[fieldName] || '');
        });
        return array;
      }
      return value;
    },
  },
  mounted : function() {

    var opts = {};

    [ 'format',
      'numCharsInMonospace',
      'textAlign',
      'fieldRe',
      'fieldInputRe' ].forEach(function(prop) {
        if (typeof this[prop] != 'undefined') {
          opts[prop] = this[prop];
        }
      }.bind(this) );

    var input = datainput.createInput(opts);
    input.setValues(this.valueToArray(this.value) || []);

    // emit events.
    var emitEventHandler = function(event, detail) {
      this.$emit(event.type, event, detail);
    }.bind(this);
    [ 'focus', 'blur', 'valuechange' ].forEach(function(type) {
       input.on(type, emitEventHandler);
    });

    this.$on('valuechange', function(event, detail) {
      this.$emit('input', this.arrayToValue(detail.newValues) );
    });

    // as a non-reactive property, set to $options.
    this.$options.input = input;
    this.$el.appendChild(input.$el);
  }
});
