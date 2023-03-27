import calculateRouteExposureGraphhopper from "../utils/calculateRouteExposureGraphhopper"
import getMassfromMode from "../utils/getMassfromMode"
import calculateRouteEnergy from "../utils/calculateRouteEnergy"

export default async function getLeastCarbonRoute(
    source,
    destination,
    temp_mode
) {
    if (source.location === undefined || destination.location === undefined) {
        source.location = source.position
        destination.location = destination.position
    } else if (source.position === undefined || destination.position === undefined) {
        source.position = source.location
        destination.position = destination.location
    }

    const query = await fetch(
        `https://graphhopper.com/api/1/route?point=${source.location[1]},${source.location[0]}&point=${destination.location[1]},${destination.location[0]}&vehicle=${temp_mode}&debug=true&key=${process.env.REACT_APP_GRAPHHOPPER_API_KEY}&type=json&points_encoded=false&algorithm=alternative_route&alternative_route.max_paths=5&alternative_route.max_weight_factor=1.4&alternative_route.max_share_factor=0.6&details=max_speed&elevation=true`,
        { method: 'GET' }
    )
    const json = await query.json()
    const routes = json.paths

    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: '',
        },
    }
    // fetch all the routes and rank the routes based on the carbon emissions

    // for carbon emssions we can find the total energy consumed by the vehicle
    // and then also consider the fuel efficiency of the vehicle. We also need to consider
    // the mass of the vehicle --> can take the average mass of the vehicle.

    console.log('Inside getLeastCarbonRoute', { routes })

    for (let i = 0; i < routes.length; i++) {
        routes[i].totalEnergy = calculateRouteEnergy(routes[i], temp_mode)
    }

    // sorting the routes based on the total energy
    routes.sort((a, b) => a.totalEnergy - b.totalEnergy)
    console.log({ routes })

    routes[0] = await calculateRouteExposureGraphhopper(routes[0])
    geojson.geometry.coordinates = routes[0].points.coordinates

    console.log('Inside getLeastCarbonRoute', routes)
    return { geojson, routes }
}
