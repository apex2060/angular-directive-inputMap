app.directive('inputMap', function(){
  /*
		This directive accepts the following variables:
		id 			(element id) 				//An element ID is required.
		variable 	(scope variable)			//Ususally you will want to make this a 2 piece var: 'data.geo'
		selectors 	(caps split by | pipe) 		'CIRCLE|RECTANGLE|MARKER' //The first one will be default
		color 		(hex color) 				'#00FF00'
		zoom 		(number) 					15
	*/
	return {
		restrict: 'E',
		replace: true,
		scope: {
			returnVar: '=variable'
		},
		template: '<div>MAP</div>',
		link:function (scope, elem, attr){
			/*SETUP DEFAULT VARIABLES FOR DIRECTIVE*/
			scope.vars = {};
			scope.vars.selectors 	= new Array('MARKER','CIRCLE', 'RECTANGLE');
			scope.vars.color 		= '#1E90FF';
			scope.vars.zoom 		= 15;

			/*SET VARIABLES IF PROVIDED*/
			if(attr.selectors)
				scope.vars.selectors = attr.selectors.split('|');
			if(attr.color)
				scope.vars.color = attr.color;
			if(attr.zoom)
				scope.vars.zoom = attr.zoom;

			/*THESE CONSTANTS ARE REQUIRED*/
			scope.consts = {};
			scope.consts.modes = [];
			scope.consts.currentShape;
			$(scope.vars.selectors).each(function(index, elem){
				scope.consts.modes.push(google.maps.drawing.OverlayType[elem]);
			});

			/*INITIATE THE RETURN VARIABLE*/
			scope.returnVar={};

			/*
				This makes it easy to send data to stackmob... 
				It is also nicely formated for anything else you may want to do.  
				BUT!  If you want to change the way the object is returned: EDIT THIS!
			*/
			scope.geoStack=function geoStack(obj){
				var results={};
				results.type=obj.type;
				if(results.type=='circle'){
					results.q='isWithinKm';
					results.center=obj.getCenter().toUrlValue().split(',');
					results.radius=Math.round(obj.getRadius()) / 1000;

				}else if(results.type=='rectangle'){
					results.q='isWithinBox';
					results.coords=obj.getBounds().toUrlValue().split(',');
					results.bl={lat:results.coords[0], lng:results.coords[1]};
					results.tr={lat:results.coords[2], lng:results.coords[3]};
				}else if(results.type=='marker'){
					delete results.type;
					results.lat=obj.getPosition().lat();
					results.lon=obj.getPosition().lng();
				}
				return results;
			}

			scope.init=function init(){
				if (navigator.geolocation){
					navigator.geolocation.getCurrentPosition(scope.setupMap);
				}
			}
			scope.setupMap=function setupMap(geo) {
				var map = new google.maps.Map(document.getElementById(attr.id), {
					zoom: scope.vars.zoom,
					center: new google.maps.LatLng(geo.coords.latitude, geo.coords.longitude),
					mapTypeId: google.maps.MapTypeId.ROADMAP,
					disableDefaultUI: true,
					zoomControl: true
				});

				var polyOptions = {
					strokeWeight: 0,
					fillOpacity: 0.45,
					editable: false
				};
				drawingManager = new google.maps.drawing.DrawingManager({
					drawingControlOptions: {
						position: google.maps.ControlPosition.TOP_CENTER,
						drawingModes: scope.consts.modes
					},
					drawingMode: scope.consts.modes[0],
					rectangleOptions: polyOptions,
					circleOptions: polyOptions,
					map: map
				});

				google.maps.event.addListener(drawingManager, 'overlaycomplete', function(e) {
					scope.deleteOld();
					var newShape = e.overlay;
						newShape.type = e.type;
						scope.setCurrent(newShape);
						scope.$apply(function(){
							scope.returnVar=scope.geoStack(newShape);
						});
				});

				var rectangleOptions = drawingManager.get('rectangleOptions');
				rectangleOptions.fillColor = scope.vars.color;
				drawingManager.set('rectangleOptions', rectangleOptions);

				var circleOptions = drawingManager.get('circleOptions');
				circleOptions.fillColor = scope.vars.color;
				drawingManager.set('circleOptions', circleOptions);
			}
			scope.setCurrent=function setCurrent(shape) {
				scope.consts.currentShape = shape;
			}
			scope.deleteOld=function deleteOld() {
				if (scope.consts.currentShape) {
					scope.consts.currentShape.setMap(null);
				}
			}
			scope.init();
		}
	}
});
