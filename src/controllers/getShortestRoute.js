export default function getShortestRoute(routes, mode) {
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: '',
        },
    }
    routes.sort((a, b) => a.distance - b.distance)

    if (mode.includes('traffic')) {
        geojson.geometry.coordinates = routes[0].geometry.coordinates
    } else {
        geojson.geometry.coordinates = routes[0].points.coordinates
    }

    return { geojson, routes }
}
