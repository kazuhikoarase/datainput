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

//
// datainput - input
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

  $d.classNamePrefix = 'datainput-';

  var empty = '\u00a0'; // NBSP

  var creCharElm = function(start, background) {
    return $d.util.createElement('span', {
      attrs : { 'class' : '${prefix}char' },
      props : { textContent : empty },
      style : {
        borderLeft : start? '' : 'none',
        borderColor : background? 'rgba(0,0,0,0)' : ''
      } });
  };

  var creDelmElm = function(c) {
    return $d.util.createElement('span', {
      props : { textContent : c == '\u0020'? empty : c } });
  };

  var createInput = function(opts) {

    var util = $d.util;

    opts = util.extend({
        format : '00',
        textAlign : 'left',
        fieldRe : '\\d+',
        directions : {},
        numCharsInMonospace : {}
      }, opts);

    opts.mbformat = function() {
      var text = '';
      var len = [];
      for (var i = 0; i < opts.format.length; i += 1) {
        var c = opts.format.charAt(i);
        text += c;
        var w = opts.numCharsInMonospace[c] || 1;
        len.push(w);
        for (var j = 1; j < w; j += 1) {
          text += c;
          len.push(0);
        }
      }
      return {
        text : text,
        length : text.length,
        substring : function(start) {
          var org = text.substring.apply(text, arguments);
          var sub = '';
          for (var i = 0; i < org.length; i += len[start + i]) {
            sub += org.charAt(i);
          }
          return sub;
        },
        substringAsEmpty : function(start) {
          var org = text.substring.apply(text, arguments);
          var sub = '';
          for (var i = 0; i < org.length; i += 1) {
            sub += empty;
          }
          return sub;
        }
      }
    }();

    var fields = function() {
      var fields = [];
      var fieldRe = new RegExp(opts.fieldRe, 'g');
      var mat = null;
      while ( (mat = fieldRe.exec(opts.mbformat.text) ) != null) {
        var fieldIndex = fields.length;
        fields.push({
          format : mat[0],
          start : mat.index,
          end : mat.index + mat[0].length,
          value : '',
          direction : opts.directions[fieldIndex] ||
            (opts.textAlign == 'right'? 'rtol' : 'ltor') });
      }
      return fields;
    }();

    var fgElms = [];
    var bgElms = [];

    var charElms = function() {
      var charElms = [];
      for (var i = 0; i < opts.mbformat.length; i += 1) {
        charElms.push(null);
      }
      return charElms;
    }();

    !function() {
      var start = 0;
      fields.forEach(function(field) {
        if (start < field.start) {
          fgElms.push(creDelmElm(opts.mbformat.substring(start, field.start) ) );
          bgElms.push(creDelmElm(opts.mbformat.substringAsEmpty(start, field.start) ) );
        }
        for (var i = field.start; i < field.end; i += 1) {
          var elm = creCharElm(i == field.start);
          fgElms.push(elm);
          charElms[i] = elm;
          bgElms.push(creCharElm(i == field.start, true) );
        }
        start = field.end;
      });
      // and rest.
      if (start < opts.mbformat.length) {
        fgElms.push(creDelmElm(opts.mbformat.substring(start) ) );
        bgElms.push(creDelmElm(opts.mbformat.substringAsEmpty(start) ) );
      }
    }();

    var handleKeydownEvent = function(event) {

      var c = String.fromCharCode(event.keyCode);

      if (!event.ctrlKey && c.length == 1 &&
          c.match(new RegExp(opts.fieldInputRe || opts.fieldRe) ) ) {

        event.preventDefault();
        if ($private.caretIndex != -1) {

          var perFieldInputRe = opts['fieldInputRe' + $private.fieldIndex];
          if (perFieldInputRe && !c.match(new RegExp(perFieldInputRe) ) ) {
            return;
          }

          var field = fields[$private.fieldIndex];
          if (field.value.length > field.format.length) {
            throw 'range over';
          }

          $private.clearSelection();
          if (field.value.length == field.format.length) {
            return;
          }

          $private.setSelectionRange($private.caretIndex, $private.caretIndex);
          if (field.direction == 'rtol') {
            var index = $private.caretIndex - (field.end - field.value.length);
            if (index <= field.format.length) {
              var newValue = field.value.substring(0, index) + c +
                field.value.substring(index);
              if (newValue.length > field.format.length) {
                newValue = newValue.substring(
                    newValue.length - field.format.length);
              }
              field.value = newValue;
            }
            $private.updateText();
          } else {
            var index = $private.caretIndex - field.start;
            if (index < field.format.length) {
              var newValue = field.value.substring(0, index) + c +
                field.value.substring(index);
              if (newValue.length > field.format.length) {
                newValue = newValue.substring(0, newValue.length);
              }
              field.value = newValue;
            }
            $private.updateText();
            $private.moveRight();
          }

          if (field.value.length == field.format.length &&
              $private.fieldIndex + 1 < fields.length) {
            // move to next field
            var field = fields[$private.fieldIndex + 1];
            $private.setCaretIndex(field.start);
            $private.setSelectionRange(field.start, field.end);
          }
        }

      } else if (event.keyCode == 9) {

        // Tab
        if ($private.fieldIndex != -1) {
          if (!event.shiftKey && $private.fieldIndex + 1 < fields.length) {
            event.preventDefault();
            if ($private.fieldIndex == 0 &&
                $private.selection.end == opts.mbformat.length) {
              // select all to select first
            } else {
              // next
              $private.fieldIndex += 1;
            }
            var field = fields[$private.fieldIndex];
            $private.setCaretIndex(field.direction == 'rtol'?
                field.end : field.start);
            $private.setSelectionRange(field.start, field.end);
          } else if (event.shiftKey && $private.fieldIndex - 1 >= 0) {
            event.preventDefault();
            // prev
            $private.fieldIndex -= 1;
            var field = fields[$private.fieldIndex];
            $private.setCaretIndex(field.direction == 'rtol'?
                field.end : field.start);
            $private.setSelectionRange(field.start, field.end);
          }
        }

      } else if (event.keyCode == 8) {

        // Backspace
        event.preventDefault();
        if ($private.caretIndex != -1) {

          $private.clearSelection();

          var field = fields[$private.fieldIndex];

          if (field.value.length == 0 && $private.fieldIndex > 0) {
            // empty field.
            $private.setCaretIndex(fields[$private.fieldIndex - 1].end);
            return;
          }

          if (field.direction == 'rtol') {
            var textIndex = $private.caretIndex -
              (field.end - field.value.length);
            if (0 < textIndex && textIndex - 1 < field.value.length) {
              field.value = field.value.substring(0, textIndex - 1) +
                field.value.substring(textIndex);
              $private.updateText();
              $private.setSelectionRange($private.caretIndex, $private.caretIndex);
            }
          } else {
            var textIndex = $private.caretIndex - field.start;
            if (0 < textIndex && textIndex - 1 < field.value.length) {
              field.value = field.value.substring(0, textIndex - 1) +
                field.value.substring(textIndex);
              $private.updateText();
              $private.moveLeft();
              $private.setSelectionRange($private.caretIndex, $private.caretIndex);
            }
          }
        }

      } else if (event.keyCode == 46) {

        // Delete
        event.preventDefault();
        if ($private.caretIndex != -1) {

          $private.clearSelection();

          var field = fields[$private.fieldIndex];
          if (field.direction == 'rtol') {
            var textIndex = $private.caretIndex -
              (field.end - field.value.length);
            if (textIndex < field.value.length) {
              field.value = field.value.substring(0, textIndex) +
                field.value.substring(textIndex + 1);
              $private.updateText();
              $private.moveRight();
              $private.setSelectionRange($private.caretIndex, $private.caretIndex);
            }
          } else {
            var textIndex = $private.caretIndex - field.start;
            if (textIndex < field.value.length) {
              field.value = field.value.substring(0, textIndex) +
                field.value.substring(textIndex + 1);
              $private.updateText();
              $private.setSelectionRange($private.caretIndex, $private.caretIndex);
            }
          }
        }

      } else if (event.keyCode == 37) {

        // Left
        event.preventDefault();
        var field = fields[$private.fieldIndex];
        if (field.direction == 'rtol' &&
            field.end - field.value.length == $private.caretIndex &&
            $private.fieldIndex - 1 >= 0) {
          $private.setCaretIndex(fields[$private.fieldIndex - 1].end);
        } else {
          $private.moveLeft();
        }

      } else if (event.keyCode == 39) {

        // Right
        event.preventDefault();
        var field = fields[$private.fieldIndex];
        if (field.direction != 'rtol' &&
            field.start + field.value.length == $private.caretIndex &&
            $private.fieldIndex + 1 < fields.length) {
          $private.setCaretIndex(fields[$private.fieldIndex + 1].start);
        } else {
          $private.moveRight();
        }

      }
    };

    var frame = util.createElement('span', fgElms, {
      style : {
        position : 'absolute',
        left : '0px', right : '0px', top : '0px', bottom : '0px',
        whiteSpace : 'nowrap'
      },
      props : { tabIndex : 0 },
      on : {
        mousedown : function(event) {
          var fCaretIndex = event.offsetX /
            event.currentTarget.offsetWidth * opts.mbformat.length;
          var sCaretIndex = ~~fCaretIndex;
          var caretIndex = Math.round(fCaretIndex);
          fields.forEach(function(field) {
            if (field.start <= sCaretIndex && sCaretIndex < field.end) {
              $private.setCaretIndex(caretIndex);
              $private.setSelectionRange(caretIndex, caretIndex);
            }
          });
          frame.focus();
        },
        dblclick : function(event) {
          event.preventDefault();
          if ($private.caretIndex != -1) {
            var field = fields[$private.fieldIndex];
            $private.setSelectionRange(field.start, field.end);
          }
        },
        focus : function(event) {
          if (fields.length > 0) {
            var field = fields[0];
            if (field.direction == 'rtol') {
              $private.setCaretIndex(field.end);
            } else {
              $private.setCaretIndex(field.start);
            }
            $private.setSelectionRange(0, opts.mbformat.length);
            $private.trigger(event.type, { originalEvent : event });
          }
        },
        blur : function(event) {
          $private.setCaretIndex(-1);
          $private.setSelectionRange(-1, -1);
          $private.trigger(event.type, { originalEvent : event });
        },
        keydown : function(event) {
          var oldValues = $private.getValues();
          handleKeydownEvent(event);
          var newValues = $private.getValues();
          var changed = false;
          oldValues.forEach(function(value, i) {
            if (value != newValues[i]) {
              changed = true;
            }
          });
          if (changed) {
            $private.trigger('valuechange', {
              originalEvent : event,
              oldValues : oldValues,
              newValues : newValues });
          }
        }
      }
    });

    var selection = util.createElement('span', {
      attrs : { 'class' : '${prefix}selection' },
      style : { position : 'absolute', display : 'none',
        top : '0px', bottom : '0px' } });

    var caret = util.createElement('span', {
      attrs : { 'class' : '${prefix}caret' },
      style : { position : 'absolute', display : 'none',
        top : '2px', bottom : '2px', width : '0px' } });

    var $private = util.extend($d.createEventTarget(), {
      $el : util.createElement('span',
        [ selection ].concat(bgElms).concat([ caret, frame ]),
        { attrs : { 'class' : '${prefix}base' }, style : {
          position : 'relative',
          whiteSpace : 'nowrap'
        } }
      ),
      caretIndex : -1,
      fieldIndex : -1,
      selection : { start : 0, end : 0},
      setCaretIndex : function(caretIndex) {

        if (caretIndex == -1) {
          this.fieldIndex = -1;
        } else {
          fields.forEach(function(field, i) {
            if (field.start <= caretIndex && caretIndex <= field.end) {
              this.fieldIndex = i;
            }
          }.bind(this) );
        }

        if (caretIndex == -1) {
          this.caretIndex = caretIndex;
        } else {
          var field = fields[this.fieldIndex];
          if (field.direction == 'rtol') {
            caretIndex = Math.max(field.end - field.value.length,
                Math.min(caretIndex, field.end) );
          } else {
            caretIndex = Math.max(field.start,
                Math.min(caretIndex, field.start + field.value.length) );
          }
          this.caretIndex = caretIndex;
        }

        if (caretIndex == -1) {
          caret.style.display = 'none';
        } else {
          var field = fields[this.fieldIndex];
          var left = ~~(caretIndex *
              this.$el.offsetWidth / opts.mbformat.length);
          if (caretIndex == 0) {
            left += 1;
          } else if (caretIndex == opts.mbformat.length) {
            left -= 2;
          }
          caret.style.display = '';
          caret.style.left = left + 'px';
        }
      },
      setSelectionRange : function(start, end) {
        this.selection = { start : start, end : end };
        var left = 0;
        var width = 0;
        if (this.selection.start != -1) {
          left = ~~(this.selection.start *
              this.$el.offsetWidth / opts.mbformat.length);
          width = ~~( (this.selection.end  - this.selection.start) *
              this.$el.offsetWidth / opts.mbformat.length);
        }
        selection.style.display = '';
        selection.style.left = left + 'px';
        selection.style.width = width + 'px';
      },
      clearSelection : function() {
        if (this.selection.start == -1 ||
            this.selection.start == this.selection.end) {
          return;
        }
        fields.forEach(function(field) {
          if (this.selection.start <= field.start &&
              field.end <= this.selection.end) {
            field.value = '';
          }
        }.bind(this) );
        this.updateText();
        var field = fields[this.fieldIndex];
        if (field.direction == 'rtol') {
          this.setCaretIndex(field.end);
        } else {
          this.setCaretIndex(field.start);
        }
      },
      updateText : function() {
        fields.forEach(function(field) {
          for (var i = field.start; i < field.end; i += 1) {
            if (field.direction == 'rtol') {
              var index = i - field.start +
                  field.value.length - field.format.length;
              charElms[i].textContent = index >= 0?
                  field.value[index] : empty;
            } else {
              var index = i - field.start;
              charElms[i].textContent = index < field.value.length?
                  field.value[index] : empty;
            }
          }
        });
      },
      moveLeft : function() {
        var field = fields[this.fieldIndex];
        if (field.start == this.caretIndex && this.fieldIndex - 1 >= 0) {
          this.setCaretIndex(fields[this.fieldIndex - 1].end);
        } else {
          this.setCaretIndex(Math.max(0, this.caretIndex - 1) );
        }
        this.setSelectionRange(this.caretIndex, this.caretIndex);
      },
      moveRight : function() {
        var field = fields[this.fieldIndex];
        if (field.end == this.caretIndex && this.fieldIndex + 1 < fields.length) {
          this.setCaretIndex(fields[this.fieldIndex + 1].start);
        } else {
          this.setCaretIndex(Math.min(this.caretIndex + 1, opts.mbformat.length) );
        }
        this.setSelectionRange(this.caretIndex, this.caretIndex);
      },
      getValues : function() {
        var values = [];
        fields.forEach(function(field, i) {
          values.push(field.value);
        });
        return values;
      },
      setValues : function(values) {
        fields.forEach(function(field, i) {
          if (typeof values[i] == 'string') {
            var len = field.end - field.start;
            var val = values[i];
            field.value = val.length > len? val.substring(0, len) : val;
          }
        });
        this.updateText();
      }
    });

    return {
      $el : $private.$el,
      trigger : $private.trigger.bind($private),
      on : $private.on.bind($private),
      off : $private.off.bind($private),
      getValues : $private.getValues.bind($private),
      setValues : $private.setValues.bind($private)
    };
  };

  $d.createInput = createInput;

}(window.datainput || (window.datainput = {}) );

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
