import calculateRouteExposureMapbox from '../utils/calculateRouteExposureMapbox.js' 
import calculateRouteExposureGraphhopper from '../utils/calculateRouteExposureGraphhopper.js'

export default async function getFastestRoute(routes, mode) {
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: '',
        },
    }
    routes.sort((a, b) => {
        if (mode == 'driving-traffic' /* || mode == 'truck-traffic' */ ) {
            return a.duration - b.duration
        } else {
            return a.time - a.time
        }
    })
    

    if (mode === 'driving-traffic' /* || mode == 'truck-traffic' */ ) {
        routes[0] = await calculateRouteExposureMapbox(routes[0])
        geojson.geometry.coordinates = routes[0].geometry.coordinates
    } else {
        routes[0] = await calculateRouteExposureGraphhopper(routes[0])
        geojson.geometry.coordinates = routes[0].points.coordinates
    }

    return { geojson, routes }
}
