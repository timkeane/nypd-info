var GEOCLIENT_URL = 'https://maps.nyc.gov/geoclient/v1/search.json?app_key=E2857975AA57366BC&app_id=nyc-gov-nypd';

var map, controls, stationSource, stationLayer, lineSource, lineLayer, selectionSource, selectionLayer, showSector = false;

var qstr = document.location.search;
if (qstr){
	var search = location.search.substring(1);
	showSector = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
	var interval = setInterval(function(){
		if (stationSource && stationSource.getFeatures().length) {
			zoomToSector(getStations(showSector));
			clearInterval(interval);
		}
		controls.setFeatures({
			featureTypeName: 'subway',
			features: stationSource.getFeatures(),
			nameField: 'NAME'
		});
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

var stationDecorator = {
	html: function(){
		var html = $('<div></div>');
		var div = $('<div class="sta-name"></div>');
		div.append(this.get('NAME'));
		html.append(div);
		var lines = this.get('LINE').split(',');
		$.each(lines, function(){
			var div = $('<div class="sta-icon"></div>');
			div.html(this).addClass('sta-' + this);
			html.append(div);
		});
		var sector = this.get('SECTOR').trim()
		var btn = $('<button class="sector" role="buton"></button>');
		btn.append('District ' + this.get('DISTRICT'));
		if (sector){
			btn.append(' Sector ' + sector);
		}
		btn.click(function(){
				window.parent.clickedStation(this.getProperties());
			});
		return html.append(btn).trigger('create');
	}
};

$(document).ready(function(){

	map = new nyc.ol.Basemap({target: $('#map').get(0)});

	controls = new nyc.ol.control.ZoomSearch(map);

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
	  [stationDecorator],
	  {projection: 'EPSG:3857'}
	);
	stationLayer = new ol.layer.Vector({source: stationSource, style: STYLE.station});
	map.addLayer(stationLayer);

	new nyc.ol.FeatureTip(map, [{
		layer: stationLayer,
		labelFunction: function(){
			return {
				css: 'subway',
				text: this.html()
			};
		}
	}]);

	var popup = new nyc.ol.Popup(map);
	function showPopup(feature){
		popup.show({
			coordinates: feature.getGeometry().getCoordinates(),
			html: feature.html()
		})
	};

	map.on('click', function(event){
		map.forEachFeatureAtPixel(event.pixel, function(feature, layer){
			if (layer === stationLayer){
				showPopup(feature);
			}
		});
	});

	var geocoder = new nyc.Geoclient(GEOCLIENT_URL);
	var locationMgr = new nyc.LocationMgr({
		controls: controls,
		locate: new nyc.ol.Locate(geocoder),
		locator: new nyc.ol.Locator({
			map: map,
			style: new ol.style.Style({
				image: new ol.style.Icon({
					scale: 48 / 512,
					size: [1024, 1024],
					src: '../images/content/pages/icon.svg'
				})
			})
		})
	});

	locationMgr.on(nyc.Locate.EventType.GEOCODE, function(location){
		var id = location.data.STATION_ID;
		if (id){
			showPopup(stationSource.getFeatureById(id));
		}
	});

});
