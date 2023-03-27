import getLeapRoute from './getLeapRoute'
import calculateRouteExposureMapbox from '../utils/calculateRouteExposureMapbox'
import calculateRouteEnergy from '../utils/calculateRouteEnergy'

export default async function getBalancedRoute(routes, mode) {
    if (mode == 'scooter' || mode == 'foot' || mode == 'bike') {
        // sort the routes based on time
        if (routes.length == 1) {
            return getLeapRoute([routes[0]], mode)
        }
        routes.sort((a, b) => a.time - b.time)
        return getLeapRoute([routes[0], routes[1]], mode) //comparing the exposure of the fastest two routes for balanced routes in this case.
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

    // find the total energy consumed by the vehicle here...
    if (mode === 'driving-traffic') {
        mode = 'car'
    }
    const source = routes[0].waypoints[0]
    const destination = routes[0].waypoints[1]
    const query = await fetch(
        `https://graphhopper.com/api/1/route?point=${source.location[1]},${source.location[0]}&point=${destination.location[1]},${destination.location[0]}&vehicle=${mode}&debug=true&key=${process.env.REACT_APP_GRAPHHOPPER_API_KEY}&type=json&points_encoded=false&algorithm=alternative_route&alternative_route.max_paths=5&alternative_route.max_weight_factor=1.4&alternative_route.max_share_factor=0.6&details=max_speed&elevation=true`,
        { method: 'GET' }
    )
    const json = await query.json()
    const temp_routes = json.paths // graphhopper routes between the same points

    temp_routes.sort((a, b) => a.time - b.time)
    routes[0].totalEnergy = calculateRouteEnergy(temp_routes[0], mode)

    geojson.geometry.coordinates = routes[0].geometry.coordinates

    return { geojson, routes }
}
