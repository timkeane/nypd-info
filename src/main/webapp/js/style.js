var STYLE = {
	locationStyleCache: null,
	precinctStyleCache: {},
	selectionStyleCache: {polygon: {}},
	precinctHouseStyleCache: null,
	getZoom: function(resolution){
		var resolutions = nyc.ol.layer.BaseLayer.RESOLUTIONS, zoom = resolutions.indexOf(resolution);
		if (zoom == -1) {
			for (var z = 0; z < resolutions.length; z++){
				if (resolution > resolutions[z]){
					zoom = z;
					break;
				}
			}
		}
		return zoom > -1 ? zoom : resolutions.length - 1;	
	},
	locationStyle: function(feature, resolution){
		if (!STYLE.locationStyleCache){
			var opts = {scale: 48 / 512, src: 'img/me0' + (nyc.util.isIe() ? '.png' : '.svg')};
			if (!nyc.util.isIos()){
				opts.offset = [0, 24];
			}
			STYLE.locationStyleCache = [new ol.style.Style({
				image: new ol.style.Icon(opts)
			})];
		}
		return STYLE.locationStyleCache;
	},
	precinctStyle: function(feature, resolution){
		var zoom = STYLE.getZoom(resolution);
		if (!STYLE.precinctStyleCache[zoom]){
			var width = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3][zoom];
			STYLE.precinctStyleCache[zoom] = [new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'rgba(0,0,255,0.5)',
					width: width
				})
			})];
		}
		return STYLE.precinctStyleCache[zoom];
	},
	precinctHouseStyle: function(feature, resolution){
		var zoom = STYLE.getZoom(resolution);
		if (!STYLE.precinctHouseStyleCache){
			STYLE.precinctHouseStyleCache = [new ol.style.Style({
				image: new ol.style.Icon({
					scale: 24 / 512,
					src: 'img/nypd' + (nyc.util.isIe() ? '.png' : '.svg')
				})
			})];
		}
		return zoom > 2 ? STYLE.precinctHouseStyleCache : [];
	},
	selectionStyle: function(feature, resolution){
		if (feature.getGeometry().getType() == 'Point'){
			if (!STYLE.selectionStyleCache.point){
				STYLE.selectionStyleCache.point =  [new ol.style.Style({
					image: new ol.style.Icon({
						scale: 32 / 512,
						src: 'img/nypd-selected' + (nyc.util.isIe() ? '.png' : '.svg')
					})
				})];
			}
			return STYLE.selectionStyleCache.point;
		}else{
			var zoom = STYLE.getZoom(resolution);
			if (!STYLE.selectionStyleCache.polygon[zoom]){
				var width = [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3][zoom];
				STYLE.selectionStyleCache.polygon[zoom] = [new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: 'rgb(0,0,255)',
						width: 5
					})
				}),
				new ol.style.Style({
					stroke: new ol.style.Stroke({
						color: '#fff',
						width: width
					})
				})];
			}
			return STYLE.selectionStyleCache.polygon[zoom];
		}
	}
};
