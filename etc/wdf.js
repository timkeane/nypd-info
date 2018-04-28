var nypd = new nyc.ol.source.Decorating(
  {loader: new nyc.ol.source.CsvPointFeatureLoader({
    url: '/nypd-info/src/main/webapp/data/nypd-station.csv',
    projection: 'EPSG:2263',
    xCol: 'X',
    yCol: 'Y',
    fidCol: 'STATION_ID'
  })},
  [],
  {projection: 'EPSG:3857'}
);

var doitt = new nyc.ol.source.Decorating(
  {loader: new nyc.ol.source.CsvPointFeatureLoader({
    url: '/nypd-info/src/main/webapp/data/station.csv',
    projection: 'EPSG:2263',
    xCol: 'DISP_X',
    yCol: 'DISP_Y',
    fidCol: 'STATION_ID'
  })},
  [],
  {projection: 'EPSG:3857'}
);

csv = '';
$.each(nypd.getFeatures(), function(){
  var props = this.getProperties()
  if (!csv){
    csv = 'X,Y,'
    for (var p in props){
      if (p != 'geometry')
        csv += (p.toUpperCase() + ',')
    }
    csv = csv.substr(0, csv.length - 1) + ',NOTE\n'
	}
  var f = doitt.getFeatureById(this.getId());
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
