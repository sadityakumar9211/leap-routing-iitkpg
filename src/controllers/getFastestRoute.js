export default function getFastestRoute(routes, mode) {
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: '',
        },
    }
    routes.sort((a, b) => {
        if (mode == 'driving-traffic' || mode == 'truck-traffic') {
            return a.duration - b.duration
        } else {
            return a.time - a.time
        }
    })

    if (mode === 'driving-traffic' || mode === 'truck-traffic') {
        geojson.geometry.coordinates = routes[0].geometry.coordinates
    } else {
        geojson.geometry.coordinates = routes[0].points.coordinates
    }

    return { geojson, routes }
}
