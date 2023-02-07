import fetchAqiData from '../services/fetchAqiData'

export default async function getLeapRoute(routes) {
    const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
            type: 'LineString',
            coordinates: '',
        },
    }
    // fetch the aqi values for the points in the routes
    // compare and sort the routes based on the aqi values
    let routePoints = [] //for storing the coordinates of the points whose aqi values are to be fetched
    let aqiValues = [] //for storing the aqi values of the points
    let routePointTime = [] //for storing the time of the points in the route

    // fetch the aqi values for the points in the routes
    // compare and sort the routes based on the aqi values

    // for each of the routes, I have to fetch the aqi values for the selected points in the routes
    for (let i = 0; i < routes.length; i++) {
        let routeCoordinates = routes[i].points.coordinates
        let tempRoutePoints = []
        let tempRoutePointTime = [] //for storing the time of the points in the route
        let skippedDistance = 0
        let skippedTime = 0
        const steps = routes[i].instructions //instruction steps
        for (let j = 0; j < steps.length; j++) {
            //if the distance is less than 10000m, then we don't need to add the points, for the sake of performance, we are skipping the points
            //we are also not allowing more than 5 skips i.e. max of 3000m skips distance without calculating the aqi value.
            if (steps[j].distance < 1000) {
                //for < 1km
                //if the distance is less than 1000m, then we don't need to add the points, just increase the skip distance
                if (skippedDistance >= 2) {
                    // the index of route point to be added is
                    let index = steps[j].interval[1]
                    tempRoutePoints.push(routeCoordinates[index])
                    // console.log(steps[j].time + skippedTime)
                    tempRoutePointTime.push(steps[j].time * 0.001 + skippedTime)
                } else {
                    skippedDistance += steps[j].distance * 0.001
                    skippedTime += steps[j].time * 0.001
                    continue
                }
            } else if (steps[j].distance < 2000) {
                //for distance > 1km and < 2km
                skippedDistance = 0
                skippedTime = 0
                //taking the middle coordinate of the step
                let index =
                    Math.floor(
                        (steps[j].interval[0] + steps[j].interval[1]) / 2
                    ) + 1
                tempRoutePoints.push(routeCoordinates[index])
                // console.log(steps[j].time)
                tempRoutePointTime.push(steps[j].time * 0.001)
            } else if (steps[j].distance >= 2000) {
                //for distance > 3km
                //adding the first point
                skippedDistance = 0
                skippedTime = 0
                let chunks = Math.floor(steps[j].distance / 2000) //number of chunks
                let timeChunk = Math.floor((steps[j].time * 0.001) / chunks) //time for each chunk

                let chunkLength = Math.floor(
                    (steps[j].interval[1] - steps[j].interval[0]) / chunks
                ) // number of coordinates in each chunk

                for (let k = 0; k < chunks; k++) {
                    let startChunkIndex = steps[j].interval[0] + k * chunkLength
                    let index =
                        Math.floor(
                            (startChunkIndex + startChunkIndex + chunkLength) /
                                2
                        ) + 1
                    tempRoutePoints.push(routeCoordinates[index])
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

    //calculating the AQI exposure for each route
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
                console.log({ aqiData })
                totalRouteExposure =
                    totalRouteExposure + (aqiData.data.aqi * routePointTime[i][j]/60 * 8 )
                tempAqiValues.push(aqiData)
                // await new Promise(r => setTimeout(r, 400));  //sleep for  200 ms to avoid the rate limit of the api
            } catch (e) {
                console.log(e)
            }
        }
        routes[i].totalExposure = totalRouteExposure
        aqiValues.push(tempAqiValues)
        console.log(routes[i].totalExposure)
    }
    // compare and sort the routes based on the aqi values
    routes.sort((a, b) => a.totalExposure - b.totalExposure)
    console.log({ routes })

    geojson.geometry.coordinates = routes[0].points.coordinates
    console.log("Inside getLeapRoute", routes)
    return { geojson, routes }
}
