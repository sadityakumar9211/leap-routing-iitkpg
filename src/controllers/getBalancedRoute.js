import getLeapRoute from './getLeapRoute'
import calculateRouteExposureMapbox from '../utils/calculateRouteExposureMapbox'

export default async function getBalancedRoute(routes, mode) {
    if (mode == 'scooter' || mode == 'foot' || mode == 'bike') {
        // sort the routes based on time
        if (routes.length == 1) {
            return getLeapRoute([routes[0]])
        }
        routes.sort((a, b) => a.time - b.time)
        return getLeapRoute([routes[0], routes[1]]) //comparing the exposure of the fastest two routes for balanced routes in this case.
    }

    // This will run only if the temp_mode is containing 'traffic'

    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: '',
        },
    }

    // for each of the routes, I have to fetch the aqi values for the selected points in the routes
    for (let i = 0; i < routes.length; i++) {
        routes[i] = await calculateRouteExposureMapbox(routes[i])
    }
    // compare and sort the routes based on the aqi values
    routes.sort((a, b) => a.totalExposure - b.totalExposure)

    geojson.geometry.coordinates = routes[0].geometry.coordinates

    return { geojson, routes }
}
