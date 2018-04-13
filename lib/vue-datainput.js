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
    sectionRe : { 'default' : function() { return undefined; } },
    sectionInputRe : { 'default' : function() { return undefined; } },
    value : { 'default' : function() { return null; } }
  },
  methods: {
    setValues : function(items) {
      this.$options.input.setValues(values);
      return this;
    },
    getValues : function() {
      return this.$options.input.getValues();
    }
  },
  mounted : function() {

    var opts = {};

    [ 'format',
      'numCharsInMonospace',
      'textAlign',
      'sectionRe',
      'sectionInputRe' ].forEach(function(prop) {
        if (typeof this[prop] != 'undefined') {
          opts[prop] = this[prop];
        }
      }.bind(this) );

    var input = datainput.createInput(opts);
    input.setValues(this.value || []);

    // emit events.
    var emitEventHandler = function(event, detail) {
      this.$emit(event.type, event, detail);
    }.bind(this);
    [
     'focus', 'blur', 'valuechange' ].forEach(function(type) {
       input.on(type, emitEventHandler);
     });

    this.$on('valuechange', function(event, detail) {
      this.$emit('input', detail.newValues);
    });

    // as a non-reactive property, set to $options.
    this.$options.input = input;
    this.$el.appendChild(input.$el);
  }
});
