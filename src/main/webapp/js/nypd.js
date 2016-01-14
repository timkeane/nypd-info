var GEOCLIENT_URL = 'https://maps.nyc.gov/geoclient/v1/search.json?';

var PRECINCT_NAME_LOOKUP = {
	'14': 'Manhattan South',
	'18': 'Manhattan North',
	'22': 'Central Park'
};

var map, precinctSource, precinctHouseSource, selectionSource, showPrecinct = false;

var qstr = document.location.search;
if (qstr){
	showPrecinct = qstr.split('=')[1];
	var interval = setInterval(function(){
		if (precinctSource.getFeatures().length) {
			zoomToPrecinct(getPrecinct(showPrecinct));
			clearInterval(interval);
		}	
	}, 200);
};

function getFeature(pct, source){
	var feature;
	$.each(source.getFeatures(), function(_, f){
		if (f.get('PRECINCT') == pct){
			feature = f;
		}
	});
	return feature;
};

function getPrecinct(pct){
	return getFeature(pct, precinctSource);
};

function getPrecinctHouse(pct){
	return getFeature(pct, precinctHouseSource);
};

function located(location){
	var precinctFeature = precinctSource.getFeaturesAtCoordinate(location.coordinates)[0];
	if (precinctFeature){
		zoomToPrecinct(precinctFeature);
	}else{
		console.warn('Where are you?');
	}
};

function zoomToPrecinct(precinctFeature){
	selectionSource.clear();
	var view = map.getView(), 
		geom = precinctFeature.getGeometry(), 
		pct = precinctFeature.get('PRECINCT')
		houseFeature = getPrecinctHouse(pct);
	map.beforeRender(
		ol.animation.zoom({resolution: view.getResolution()}), 
		ol.animation.pan({source: view.getCenter()})
	);
	selectionSource.addFeature(precinctFeature);
	selectionSource.addFeature(houseFeature);
	view.fit(geom.getExtent(), map.getSize());
	if (window.parent && window.parent.gotPrecinctHouse){
		window.parent.gotPrecinctHouse(houseFeature.getProperties());
	}
};

function getOrdinal(n){
   var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
   return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
		
$(document).ready(function(){
	
	var base = new nyc.ol.layer.BaseLayer();
	
	map = new ol.Map({
		target: $('#map').get(0),
		layers: [base],
		view: new ol.View({
			projection: 'EPSG:2263',
			resolutions: nyc.ol.layer.BaseLayer.RESOLUTIONS
		})
	});
	map.getView().fit(nyc.ol.EXTENT, map.getSize());	

	precinctSource = new nyc.ol.source.Decorating(
		{url: 'data/precinct.json', format: new ol.format.TopoJSON}, 
		[{
			getName: function(){
				var pct = this.get('PRECINCT'), name = PRECINCT_NAME_LOOKUP[pct];
				return (name || getOrdinal(pct)) + ' Precinct';
			}
		}]
	);	
	new ol.layer.Vector({map: map, source: precinctSource, style: STYLE.precinctStyle});

	selectionSource = new ol.source.Vector({});
	new ol.layer.Vector({map: map, source: selectionSource, style: STYLE.selectionStyle});

	precinctHouseSource = new nyc.ol.source.Decorating(
		{url: 'data/precinct-house.json', format: new ol.format.GeoJSON},
		[{
			getName: function(){
				var pct = this.get('PRECINCT'), name = PRECINCT_NAME_LOOKUP[pct];
				return (name || getOrdinal(pct)) + ' Precinct Hosue';
			},
			getAddress: function(){
				var num = this.get('NUM'), 
					suf = this.get('SUF') || '', 
					st = this.get('STREET'),
					boro = this.get('BORO'),
					zip = this.get('ZIP');
				return num + ' ' + suf + ' ' + st + '<br>' + boro + ', NY ' + zip;  
			}
		}]
	);	
	new ol.layer.Vector({map: map, source: precinctHouseSource, style: STYLE.precinctHouseStyle});

	var locationSource = new nyc.ol.source.Decorating(
		{}, 
		[{getName: function(){return this.get('name');}}]
	);
	
	var locationMgr = new nyc.LocationMgr({
		controls: new nyc.ol.control.ZoomSearch(map),
		locate: new nyc.ol.Locate(
			new nyc.Geoclient(GEOCLIENT_URL),
			'EPSG:2263',
			nyc.ol.EXTENT
		),
		locator: new nyc.ol.Locator({
			map: map,
			layer: new ol.layer.Vector({
				map: map, 
				source: locationSource,
				style: STYLE.locationStyle
			})
		})
	});

	locationMgr.on(nyc.Locate.EventType.GEOCODE, located);
	locationMgr.on(nyc.Locate.EventType.GEOLOCATION, located);

	new nyc.ol.FeatureTip(map, [{
		source: precinctSource, 
		labelFunction: function(){
			return {text: this.getName()};
		}
	},{
		source: precinctHouseSource, 
		labelFunction: function(){
			return {
				cssClass: 'precinct-house',
				text: '<b>' + this.getName() + '</b><br>' + this.getAddress()
			};
		}
	},{
		source: locationSource, 
		labelFunction: function(){
			return {text: this.getName().replace(/,/, '<br>')};
		}
	}]);

});
