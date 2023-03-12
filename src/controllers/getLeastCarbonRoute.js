import calculateRouteExposureGraphhopper from "../utils/calculateRouteExposureGraphhopper"
import getMassfromMode from "../utils/getMassfromMode"

export default async function getLeastCarbonRoute(
    source,
    destination,
    temp_mode
) {
    const mass = getMassfromMode(temp_mode)
    const g = 9.8

    const query = await fetch(
        `https://graphhopper.com/api/1/route?point=${source.position[1]},${source.position[0]}&point=${destination.position[1]},${destination.position[0]}&vehicle=${temp_mode}&debug=true&key=${process.env.REACT_APP_GRAPHHOPPER_API_KEY}&type=json&points_encoded=false&algorithm=alternative_route&alternative_route.max_paths=5&alternative_route.max_weight_factor=1.4&alternative_route.max_share_factor=0.6&elevation=true&details=max_speed`,
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
        routes[i].totalEnergy = 0
        let segments = routes[i].instructions
        for (let j = 0; j < segments.length; j++) {
            const startIndex = segments[j].interval[0]
            const endIndex = segments[j].interval[1]

            const heightGain =
                routes[i].points.coordinates[endIndex][2] -
                routes[i].points.coordinates[startIndex][2]
            const distance = segments[j].distance // in meters
            const time = segments[j].time / 1000 // now its in seconds
            if (time == 0 && distance == 0) continue
            const averageVelocity = distance / time // in m/s

            // total potential energy = mass * gravity * height gain
            const totalPotentialEnergy = mass * g * heightGain
            console.log('totalPotentialEnergy', totalPotentialEnergy)

            // total kinetic energy = 0.5 * mass * velocity^2
            const totalKineticEnergy =
                0.5 * mass * averageVelocity * averageVelocity
            console.log('totalKineticEnergy', totalKineticEnergy)

            // total energy = total potential energy + total kinetic energy
            routes[i].totalEnergy += totalPotentialEnergy + totalKineticEnergy
            console.log('totalEnergy', routes[i].totalEnergy)
        }
    }

    // sorting the routes based on the total energy
    routes.sort((a, b) => a.totalEnergy - b.totalEnergy)
    console.log({ routes })

    routes[0] = await calculateRouteExposureGraphhopper(routes[0])
    geojson.geometry.coordinates = routes[0].points.coordinates

    console.log('Inside getLeastCarbonRoute', routes)
    return { geojson, routes }
}
