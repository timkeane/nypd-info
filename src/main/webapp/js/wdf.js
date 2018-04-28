csv = '';
$.each(pdSrc.getFeatures(), function(){
  var props = this.getProperties()
  if (!csv){
    csv = 'X,Y,'
    for (var p in props){
      if (p != 'geometry')
        csv += (p.toUpperCase() + ',')
    }
    csv = csv.substr(0, csv.length - 1) + ',NOTE\n'
	}
  var f = taSrc.getFeatureById(this.getId());
  f = f ? f.getProperties() : {}
  csv += (f.DISP_X + ',' + f.DISP_Y + ',')
  for (var p in props){
    if (p != 'geometry'){
      var q = p == 'STATION_ID' ? '' : '"'
      csv += (q + props[p] + q + ',')
    }
  }
  csv = csv.substr(0, csv.length - 1) + ',"' + f.DISP_NOTE + '"\n'
})
