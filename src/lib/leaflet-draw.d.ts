import 'leaflet';
import 'leaflet-draw';

declare module 'leaflet' {
	namespace Control {
		interface DrawConstructorOptions {
			draw?: {
				polygon?: DrawOptions.PolygonOptions | false;
				polyline?: DrawOptions.PolylineOptions | false;
				rectangle?: DrawOptions.RectangleOptions | false;
				circle?: DrawOptions.CircleOptions | false;
				marker?: DrawOptions.MarkerOptions | false;
				circlemarker?: DrawOptions.CircleMarkerOptions | false;
			};
			edit?: {
				featureGroup: FeatureGroup;
				remove?: boolean;
			};
			position?: ControlPosition;
		}
	}

	interface DrawMap extends Map {
		// Extension to allow Map to work with Draw handlers
	}

	interface PolylineOptions {
		className?: string;
	}

	interface PolygonOptions {
		className?: string;
	}
}

declare global {
	namespace L {
		interface DrawMap extends Map {}
	}
}
