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
        sectionRe : '\\d+',
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

    var sections = function() {
      var sections = [];
      var sectionRe = new RegExp(opts.sectionRe, 'g');
      var mat = null;
      while ( (mat = sectionRe.exec(opts.mbformat.text) ) != null) {
        var sectionIndex = sections.length;
        sections.push({
          format : mat[0],
          start : mat.index,
          end : mat.index + mat[0].length,
          value : '',
          direction : opts.directions[sectionIndex] ||
            (opts.textAlign == 'right'? 'rtol' : 'ltor') });
      }
      return sections;
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
      sections.forEach(function(section) {
        if (start < section.start) {
          fgElms.push(creDelmElm(opts.mbformat.substring(start, section.start) ) );
          bgElms.push(creDelmElm(opts.mbformat.substringAsEmpty(start, section.start) ) );
        }
        for (var i = section.start; i < section.end; i += 1) {
          var elm = creCharElm(i == section.start);
          fgElms.push(elm);
          charElms[i] = elm;
          bgElms.push(creCharElm(i == section.start, true) );
        }
        start = section.end;
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
          c.match(new RegExp(opts.sectionInputRe || opts.sectionRe) ) ) {

        event.preventDefault();
        if ($private.caretIndex != -1) {

          var perSectionInputRe = opts['sectionInputRe' + $private.sectionIndex];
          if (perSectionInputRe && !c.match(new RegExp(perSectionInputRe) ) ) {
            return;
          }

          var section = sections[$private.sectionIndex];
          if (section.value.length > section.format.length) {
            throw 'range over';
          }

          $private.clearSelection();
          if (section.value.length == section.format.length) {
            return;
          }

          $private.setSelectionRange($private.caretIndex, $private.caretIndex);
          if (section.direction == 'rtol') {
            var index = $private.caretIndex - (section.end - section.value.length);
            if (index <= section.format.length) {
              var newValue = section.value.substring(0, index) + c +
                section.value.substring(index);
              if (newValue.length > section.format.length) {
                newValue = newValue.substring(
                    newValue.length - section.format.length);
              }
              section.value = newValue;
            }
            $private.updateText();
          } else {
            var index = $private.caretIndex - section.start;
            if (index < section.format.length) {
              var newValue = section.value.substring(0, index) + c +
                section.value.substring(index);
              if (newValue.length > section.format.length) {
                newValue = newValue.substring(0, newValue.length);
              }
              section.value = newValue;
            }
            $private.updateText();
            $private.moveRight();
          }

          if (section.value.length == section.format.length &&
              $private.sectionIndex + 1 < sections.length) {
            // move to next section
            var section = sections[$private.sectionIndex + 1];
            $private.setCaretIndex(section.start);
            $private.setSelectionRange(section.start, section.end);
          }
        }

      } else if (event.keyCode == 9) {

        // Tab
        if ($private.sectionIndex != -1) {
          if (!event.shiftKey && $private.sectionIndex + 1 < sections.length) {
            event.preventDefault();
            if ($private.sectionIndex == 0 &&
                $private.selection.end == opts.mbformat.length) {
              // select all to select first
            } else {
              // next
              $private.sectionIndex += 1;
            }
            var section = sections[$private.sectionIndex];
            $private.setCaretIndex(section.direction == 'rtol'?
                section.end : section.start);
            $private.setSelectionRange(section.start, section.end);
          } else if (event.shiftKey && $private.sectionIndex - 1 >= 0) {
            event.preventDefault();
            // prev
            $private.sectionIndex -= 1;
            var section = sections[$private.sectionIndex];
            $private.setCaretIndex(section.direction == 'rtol'?
                section.end : section.start);
            $private.setSelectionRange(section.start, section.end);
          }
        }

      } else if (event.keyCode == 8) {

        // Backspace
        event.preventDefault();
        if ($private.caretIndex != -1) {

          $private.clearSelection();

          var section = sections[$private.sectionIndex];

          if (section.value.length == 0 && $private.sectionIndex > 0) {
            // empty section.
            $private.setCaretIndex(sections[$private.sectionIndex - 1].end);
            return;
          }

          if (section.direction == 'rtol') {
            var textIndex = $private.caretIndex -
              (section.end - section.value.length);
            if (0 < textIndex && textIndex - 1 < section.value.length) {
              section.value = section.value.substring(0, textIndex - 1) +
                section.value.substring(textIndex);
              $private.updateText();
              $private.setSelectionRange($private.caretIndex, $private.caretIndex);
            }
          } else {
            var textIndex = $private.caretIndex - section.start;
            if (0 < textIndex && textIndex - 1 < section.value.length) {
              section.value = section.value.substring(0, textIndex - 1) +
                section.value.substring(textIndex);
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

          var section = sections[$private.sectionIndex];
          if (section.direction == 'rtol') {
            var textIndex = $private.caretIndex -
              (section.end - section.value.length);
            if (textIndex < section.value.length) {
              section.value = section.value.substring(0, textIndex) +
                section.value.substring(textIndex + 1);
              $private.updateText();
              $private.moveRight();
              $private.setSelectionRange($private.caretIndex, $private.caretIndex);
            }
          } else {
            var textIndex = $private.caretIndex - section.start;
            if (textIndex < section.value.length) {
              section.value = section.value.substring(0, textIndex) +
                section.value.substring(textIndex + 1);
              $private.updateText();
              $private.setSelectionRange($private.caretIndex, $private.caretIndex);
            }
          }
        }

      } else if (event.keyCode == 37) {

        // Left
        event.preventDefault();
        var section = sections[$private.sectionIndex];
        if (section.direction == 'rtol' &&
            section.end - section.value.length == $private.caretIndex &&
            $private.sectionIndex - 1 >= 0) {
          $private.setCaretIndex(sections[$private.sectionIndex - 1].end);
        } else {
          $private.moveLeft();
        }

      } else if (event.keyCode == 39) {

        // Right
        event.preventDefault();
        var section = sections[$private.sectionIndex];
        if (section.direction != 'rtol' &&
            section.start + section.value.length == $private.caretIndex &&
            $private.sectionIndex + 1 < sections.length) {
          $private.setCaretIndex(sections[$private.sectionIndex + 1].start);
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
          sections.forEach(function(section) {
            if (section.start <= sCaretIndex && sCaretIndex < section.end) {
              $private.setCaretIndex(caretIndex);
              $private.setSelectionRange(caretIndex, caretIndex);
            }
          });
          frame.focus();
        },
        dblclick : function(event) {
          event.preventDefault();
          if ($private.caretIndex != -1) {
            var section = sections[$private.sectionIndex];
            $private.setSelectionRange(section.start, section.end);
          }
        },
        focus : function(event) {
          if (sections.length > 0) {
            var section = sections[0];
            if (section.direction == 'rtol') {
              $private.setCaretIndex(section.end);
            } else {
              $private.setCaretIndex(section.start);
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
      sectionIndex : -1,
      selection : { start : 0, end : 0},
      setCaretIndex : function(caretIndex) {

        if (caretIndex == -1) {
          this.sectionIndex = -1;
        } else {
          sections.forEach(function(section, i) {
            if (section.start <= caretIndex && caretIndex <= section.end) {
              this.sectionIndex = i;
            }
          }.bind(this) );
        }

        if (caretIndex == -1) {
          this.caretIndex = caretIndex;
        } else {
          var section = sections[this.sectionIndex];
          if (section.direction == 'rtol') {
            caretIndex = Math.max(section.end - section.value.length,
                Math.min(caretIndex, section.end) );
          } else {
            caretIndex = Math.max(section.start,
                Math.min(caretIndex, section.start + section.value.length) );
          }
          this.caretIndex = caretIndex;
        }

        if (caretIndex == -1) {
          caret.style.display = 'none';
        } else {
          var section = sections[this.sectionIndex];
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
        sections.forEach(function(section) {
          if (this.selection.start <= section.start &&
              section.end <= this.selection.end) {
            section.value = '';
          }
        }.bind(this) );
        this.updateText();
        var section = sections[this.sectionIndex];
        if (section.direction == 'rtol') {
          this.setCaretIndex(section.end);
        } else {
          this.setCaretIndex(section.start);
        }
      },
      updateText : function() {
        sections.forEach(function(section) {
          for (var i = section.start; i < section.end; i += 1) {
            if (section.direction == 'rtol') {
              var index = i - section.start +
                  section.value.length - section.format.length;
              charElms[i].textContent = index >= 0?
                  section.value[index] : empty;
            } else {
              var index = i - section.start;
              charElms[i].textContent = index < section.value.length?
                  section.value[index] : empty;
            }
          }
        });
      },
      moveLeft : function() {
        var section = sections[this.sectionIndex];
        if (section.start == this.caretIndex && this.sectionIndex - 1 >= 0) {
          this.setCaretIndex(sections[this.sectionIndex - 1].end);
        } else {
          this.setCaretIndex(Math.max(0, this.caretIndex - 1) );
        }
        this.setSelectionRange(this.caretIndex, this.caretIndex);
      },
      moveRight : function() {
        var section = sections[this.sectionIndex];
        if (section.end == this.caretIndex && this.sectionIndex + 1 < sections.length) {
          this.setCaretIndex(sections[this.sectionIndex + 1].start);
        } else {
          this.setCaretIndex(Math.min(this.caretIndex + 1, opts.mbformat.length) );
        }
        this.setSelectionRange(this.caretIndex, this.caretIndex);
      },
      getValues : function() {
        var values = [];
        sections.forEach(function(section, i) {
          values.push(section.value);
        });
        return values;
      },
      setValues : function(values) {
        sections.forEach(function(section, i) {
          if (typeof values[i] == 'string') {
            var len = section.end - section.start;
            var val = values[i];
            section.value = val.length > len? val.substring(0, len) : val;
          }
        });
        this.updateText();
      }
    });

    return {
      $el : $private.$el,
      trigger : $private.trigger.bind($private),
      on : $private.on.bind($private),
      off : $private.off.bind($private)
    };
  };

  $d.createInput = createInput;

}(window.datainput || (window.datainput = {}) );
