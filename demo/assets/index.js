
window.addEventListener('load', function() {

  var $d = datainput;

  var dataIn1 = $d.createInput({ format : 'XXX-XXXX' }).
    on('valuechange', function(event, detail) {
      console.log(event, detail);
    });
  dataIn1.setValues(['123', '4567'])

  var dataIn2 = $d.createInput({ format : 'XXX/XX/XX', textAlign : 'right' });

  var dataIn3 = $d.createInput({
      format : 'XXXX年XX月XX日',
      getNumCharsInMonospace : function(c) {
        return '年月日'.indexOf(c) != -1? 2 : 1;
      },
      textAlign : 'right'
    });

  var dataIn4 = $d.createInput({ format : 'XXXX-XXXX-XXXX-XXXX' });
  var dataIn5 = $d.createInput({ format : 'XX-X-XXX-XXXX' });
  dataIn5.on('blur', function(event, detail) {
    console.log(event, detail);
  });

  document.getElementById('dataIn1').appendChild(dataIn1.$el);
  document.getElementById('dataIn2').appendChild(dataIn2.$el);
  document.getElementById('dataIn3').appendChild(dataIn3.$el);
  document.getElementById('dataIn4').appendChild(dataIn4.$el);
  document.getElementById('dataIn5').appendChild(dataIn5.$el);
});
