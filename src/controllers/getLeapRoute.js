import calculateRouteExposureGraphhopper  from '../utils/calculateRouteExposureGraphhopper'

export default async function getLeapRoute(routes) {
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
        routes[i] = await calculateRouteExposureGraphhopper(routes[i])
    }
    // compare and sort the routes based on the aqi values
    routes.sort((a, b) => a.totalExposure - b.totalExposure)
    console.log({ routes })

    geojson.geometry.coordinates = routes[0].points.coordinates
    console.log("Inside getLeapRoute", routes)
    return { geojson, routes }
}
