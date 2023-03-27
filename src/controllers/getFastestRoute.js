import calculateRouteExposureMapbox from '../utils/calculateRouteExposureMapbox.js' 
import calculateRouteExposureGraphhopper from '../utils/calculateRouteExposureGraphhopper.js'
import calculateRouteEnergy from '../utils/calculateRouteEnergy.js'

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
        if (mode == 'driving-traffic') {
            return a.duration - b.duration
        } else {
            return a.time - a.time
        }
    })
    

    if (mode === 'driving-traffic') {
        // how to find the total energy consumed by the vehicle here...
        mode = "car"
        const source = routes[0].waypoints[0]
        const destination = routes[0].waypoints[1]
        console.log(source.location[1], destination.location[0], "inside the get Fast route energy")

        const query = await fetch(
            `https://graphhopper.com/api/1/route?point=${source.location[1]},${source.location[0]}&point=${destination.location[1]},${destination.location[0]}&vehicle=${mode}&debug=true&key=${process.env.REACT_APP_GRAPHHOPPER_API_KEY}&type=json&points_encoded=false&algorithm=alternative_route&alternative_route.max_paths=5&alternative_route.max_weight_factor=1.4&alternative_route.max_share_factor=0.6&details=max_speed&elevation=true`,
            { method: 'GET' }
        )
        console.log("query fetched the routes between those locations")
        const json = await query.json()
        const temp_routes = json.paths     // graphhopper routes between the same points

        temp_routes.sort((a, b) => a.time - b.time)
        routes[0].totalEnergy = calculateRouteEnergy(temp_routes[0], mode)
        routes[0] = await calculateRouteExposureMapbox(routes[0])
        geojson.geometry.coordinates = routes[0].geometry.coordinates
    } else {
        routes[0].totalEnergy = calculateRouteEnergy(routes[0], mode)
        routes[0] = await calculateRouteExposureGraphhopper(routes[0])
        geojson.geometry.coordinates = routes[0].points.coordinates
    }

    return { geojson, routes }
}
