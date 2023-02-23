import calculateRouteExposureGraphhopper from "../utils/calculateRouteExposureGraphhopper"
import calculateRouteExposureMapbox from "../utils/calculateRouteExposureMapbox"

export default async function getShortestRoute(routes, mode) {
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: '',
        },
    }
    console.log({routes})
    routes.sort((a, b) => a.distance - b.distance)
    

    if (mode.includes('traffic')) {
        routes[0] = await calculateRouteExposureMapbox(routes[0])
        geojson.geometry.coordinates = routes[0].geometry.coordinates
    } else {
        routes[0] = await calculateRouteExposureGraphhopper(routes[0])
        geojson.geometry.coordinates = routes[0].points.coordinates
    }

    return { geojson, routes }
}
