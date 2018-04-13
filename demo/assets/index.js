
window.addEventListener('load', function() {

  var $d = datainput;

  var zipCodeIn = $d.createInput({ format : '00000' }).
    on('valuechange', function(event, detail) {
      console.log(event, detail);
    });
  zipCodeIn.setValues(['12345'])

  var dateIn1 = $d.createInput({ format : '0000/00/00', textAlign : 'right' });
  var dateIn2 = $d.createInput({ format : '2099/99/99', textAlign : 'right',
    sectionRe : '9+', sectionInputRe : '\\d+' });

  var dateInJa = $d.createInput({
      format : '0000年00月00日',
      getNumCharsInMonospace : function(c) {
        return '年月日'.indexOf(c) != -1? 2 : 1;
      },
      textAlign : 'right'
    });

  var cardNoIn = $d.createInput({ format : '0000-0000-0000-0000' });

  var someCodeIn = $d.createInput({ format : 'XX-X-XX-XXX', sectionRe : '\\w+' });
  someCodeIn.on('blur', function(event, detail) {
    console.log(event, detail);
  });

  document.getElementById('zipCodeIn').appendChild(zipCodeIn.$el);
  document.getElementById('dateIn1').appendChild(dateIn1.$el);
  document.getElementById('dateIn2').appendChild(dateIn2.$el);
  document.getElementById('dateInJa').appendChild(dateInJa.$el);
  document.getElementById('cardNoIn').appendChild(cardNoIn.$el);
  document.getElementById('someCodeIn').appendChild(someCodeIn.$el);
});
