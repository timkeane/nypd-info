var GEOCLIENT_URL = 'https://maps.nyc.gov/geoclient/v1/search.json?app_key=E2857975AA57366BC&app_id=nyc-gov-nypd';

var wtf;
var wtf2;

var map;
var controls;
var stationSource; 
var stationLayer;
var lineSource; 
var lineLayer;
var selection; 
var activeStations;

var qstr = document.location.search;
if (qstr){
	var args = qstr.substring(1).split('&');
	selection = {};
	$.each(args, function(){
		var pair = this.split('=');
		if (pair.length == 2){
			selection[pair[0]] = pair[1];
		}
	});
	var interval = setInterval(function(){
		if (stationSource && stationSource.featuresloaded && lineSource.getFeatures().length) {
			clearInterval(interval);
			getActiveStations();
			zoomToStations();
			controls.setFeatures({
				featureTypeName: 'subway',
				features: stationSource.getFeatures(),
				nameField: 'NAME'
			});
			$(controls.input).attr('placeholder', 'Search for a station or address...');
			}
	}, 200);
};

function zoomToStations(){
	var features = activeStations.features;
	if (features.length){
		var view = map.getView();
		if (features.length > 1){
			view.fit(activeStations.extent, {size: map.getSize(), duration: 500});
		}else{
			view.animate({
				center: features[0].getGeometry().getCoordinates(),
				zoom: 16
			});
		}
	}
};

function getActiveStations(){
	activeStations = {
		extent: ol.extent.createEmpty(),
		features: []
	};
	$.each(stationSource.getFeatures(), function(){
		var districtMatch = this.get('DISTRICT') == selection.district;
		var sectorMatch = this.get('SECTOR') == selection.sector || !selection.sector;
		this.selected = this.getId() == selection.station;
		if (districtMatch && sectorMatch){
			this.active = true;
			activeStations.features.push(this);
			activeStations.extent = ol.extent.extend(
				activeStations.extent, this.getGeometry().getExtent());
		}
	})
	getActiveLines();
};

function getActiveLines(){
	$.each(lineSource.getFeatures(), function(){
		this.active = false;
	});
	$.each(activeStations.features, function(){
		var station = this.getGeometry().getCoordinates();
		var stationExt = [station[0] - 500, station[0] + 500, station[1] + 500];
		$.each(lineSource.getFeatures(), function(){
			if (!this.active){
				this.active = this.getGeometry().intersectsExtent(stationExt);
				console.warn(this.active);
			}
		});
	});
};

var stationDecorator = {
	extendFeature: function(){
		var wrapped = '';
		var label = this.get('NAME').replace('/\//', ' ');
		if (label.length > 12) {
			label = label.replace(' /', '|');
			$.each(label.split(' '), function(_, word){
				var lines = wrapped.split('\n')
				if (lines.length && (lines[lines.length - 1] + word).length > 12) {
					wrapped += ('\n' + word + ' ');
				}else{
					wrapped += (word + ' ');
				}
			});
			wrapped = wrapped.replace('|', '/');
		}
		this.label = wrapped ? wrapped.trim() : label;
	},
	html: function(){
		var props = this.getProperties()
		var html = $('<div></div>');
		var div = $('<div class="sta-name"></div>');
		div.append(props.NAME);
		html.append(div);
		var lines = props.LINE.split(',');
		$.each(lines, function(){
			var div = $('<div class="sta-icon"></div>');
			div.html(this).addClass('sta-' + this);
			html.append(div);
		});
		var sector = props.SECTOR.trim()
		var btn = $('<button class="sector" role="buton"></button>');
		btn.append('District ' + props.DISTRICT);
		if (sector){
			btn.append(' Sector ' + sector);
		}
		btn.click(function(){
			window.parent.clickedStation(props);
		});
		return html.append(btn).trigger('create');
	}
};

$(document).ready(function(){

	map = new nyc.ol.Basemap({target: $('#map').get(0)});
	map.labels.base.setOpacity(.5);

	controls = new nyc.ol.control.ZoomSearch(map);

	lineSource = new ol.source.Vector({
		url: 'subway_line.json',
		format: new ol.format.GeoJSON()
	});
	lineLayer = new ol.layer.Vector({source: lineSource, style: STYLE.line});
	map.addLayer(lineLayer);

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


	wtf = new ol.source.Vector();
	wtf2 = new ol.layer.Vector({source: wtf});
	map.addLayer(wtf2);
});
