import getLeapRoute from './getLeapRoute'
import fetchAqiData from '../services/fetchAqiData'

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

    //fastest two from mapbox and then the greenest one among them is choosen, for balanced.
    let routePoints = [] //for storing the coordinates of the points whose aqi values are to be fetched
    let aqiValues = [] //for storing the aqi values of the points
    let routePointTime = [] //for storing the time of the points in the route

    // fetch the aqi values for the points in the routes
    // compare and sort the routes based on the aqi values

    // for each of the routes, I have to fetch the aqi values for the selected points in the routes
    for (let i = 0; i < routes.length; i++) {
        let steps = routes[i].legs[0].steps
        let tempRoutePoints = []
        let tempRoutePointTime = [] //for storing the time of the points in the route
        let skippedDistance = 0
        let skippedTime = 0
        for (let j = 0; j < steps.length; j++) {
            //if the distance is less than 10000m, then we don't need to add the points, for the sake of performance, we are skipping the points
            //we are also not allowing more than 3 skips i.e. max of 3000m skips distance without calculating the aqi value.
            // i.e. calculating the aqi value in every 3 km of the route
            if (steps[j].distance < 1000) {
                //if the distance is less than 1000m, then we don't need to add the points
                if (skippedDistance >= 3) {
                    tempRoutePoints.push(
                        steps[j].geometry.coordinates[
                            Math.floor(steps[j].geometry.coordinates.length / 2)
                        ]
                    )
                    tempRoutePointTime.push(steps[j].duration + skippedTime)
                } else {
                    skippedDistance += steps[j].distance * 0.001
                    skippedTime += steps[j].duration
                    continue
                }
            } else if (steps[j].distance < 3000) {
                //taking the middle coordinate of the step
                skippedDistance = 0
                skippedTime = 0
                tempRoutePoints.push(
                    steps[j].geometry.coordinates[
                        Math.floor(steps[j].geometry.coordinates.length / 2)
                    ]
                )
                tempRoutePointTime.push(steps[j].duration)
            } else if (steps[j].distance >= 3000) {
                //adding the first point
                skippedDistance = 0
                skippedTime = 0
                //creating the chunks for the step
                let chunks = Math.floor(steps[j].distance / 3000)
                let timeChunk = Math.floor(steps[j].duration / chunks)
                let chunkLength = Math.floor(
                    steps[j].geometry.coordinates.length / chunks
                )
                for (let k = 0; k < chunks; k++) {
                    tempRoutePoints.push(
                        steps[j].geometry.coordinates[k * chunkLength]
                    )
                    tempRoutePointTime.push(timeChunk)
                }
            }
        }
        //for each route the points are adding in this array.
        routePoints.push(tempRoutePoints)
        routePointTime.push(tempRoutePointTime)
    }
    console.log({ routePoints })
    console.log({ routePointTime })

    for (let i = 0; i < routePoints.length; i++) {
        let tempAqiValues = []
        let totalRouteExposure = 0
        for (let j = 0; j < routePoints[i].length; j++) {
            //fetch the aqi values for the points in the routes
            try {
                if (
                    routePoints[i][j] === undefined ||
                    routePointTime[i][j] === undefined
                ) {
                    continue
                }
                const aqiData = await fetchAqiData([
                    routePoints[i][j][0],
                    routePoints[i][j][1],
                ])
                console.log(aqiData)
                totalRouteExposure =
                    totalRouteExposure +
                    ((aqiData.data.aqi * routePointTime[i][j]) / 60) * 8
                tempAqiValues.push(aqiData)
                // await new Promise(r => setTimeout(r, 400));  //sleep for  200 ms to avoid the rate limit of the api
            } catch (e) {
                setIsLoading(false)
                console.log(e)
            }
        }
        routes[i].totalExposure = totalRouteExposure
        aqiValues.push(tempAqiValues)
        console.log(routes[i].totalExposure)
    }
    // compare and sort the routes based on the aqi values
    routes.sort((a, b) => a.totalExposure - b.totalExposure)

    geojson.geometry.coordinates = routes[0].geometry.coordinates

    return { geojson, routes }
}
