var map, stationSource, stationLayer, lineSource, lineLayer, selectionSource, selectionLayer, showSector = false;

var qstr = document.location.search;
if (qstr){
	var search = location.search.substring(1);
	showSector = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
	var interval = setInterval(function(){
		if (stationSource.getFeatures().length) {
			zoomToSector(getStations(showSector));
			clearInterval(interval);
		}
	}, 200);
};

function getStations(sector){
	var features = [];
	var extent = ol.extent.createEmpty();
	$.each(stationSource.getFeatures(), function(){
		var props = this.getProperties()
		if (props.SECTOR == sector.sector && props.DISTRICT == sector.district){
			features.push(this);
			extent = ol.extent.extend(extent, this.getGeometry().getExtent())
		}
	});
	return {features: features, extent: extent}
};

function zoomToSector(stations){
	var view = map.getView();
	selectionSource.clear();
	selectionSource.addFeatures(stations.features);
	view.fit(stations.extent, {size: map.getSize(), duration: 500});
};

$(document).ready(function(){

	map = new nyc.ol.Basemap({target: $('#map').get(0)});

	lineSource = new ol.source.Vector({
		url: 'subway-line.json',
		format: new ol.format.TopoJSON
	});
	lineLayer = new ol.layer.Vector({source: lineSource, style: STYLE.line});
	map.addLayer(lineLayer);

	selectionSource = new ol.source.Vector({});
	selectionLayer = new ol.layer.Vector({source: selectionSource, style: STYLE.selection});
	map.addLayer(selectionLayer);

	stationSource = new nyc.ol.source.Decorating(
	  {loader: new nyc.ol.source.CsvPointFeatureLoader({
	    url: 'subway-station.csv',
	    projection: 'EPSG:2263',
	    xCol: 'X',
	    yCol: 'Y',
	    fidCol: 'STATION_ID'
	  })},
	  [],
	  {projection: 'EPSG:3857'}
	);
	stationLayer = new ol.layer.Vector({source: stationSource, style: STYLE.station});
	map.addLayer(stationLayer);

	new nyc.ol.FeatureTip(map, [{
		layer: stationLayer,
		labelFunction: function(){
			return {text: this.get('NAME')};
		}
	}]);

});
