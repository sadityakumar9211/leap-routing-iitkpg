import convertAQIToPM25 from './convertAqiToPm25'
import fetchAqiData from '../services/fetchAqiData'

export default async function calculateRouteExposureMapbox(route) {
    console.log({route})
    // fetch the aqi values for the points in the routes
    // calculate the total exposure for the route and return it
    let routePoints = [] //for storing the coordinates of the points whose aqi values are to be fetched
    let aqiValues = [] //for storing the aqi values of the points
    let routePointTime = [] //for storing the time of the points in the route

    let skippedDistance = 0
    let skippedTime = 0
    const steps = route.legs[0].steps //instruction steps
    for (let j = 0; j < steps.length; j++) {
        //if the distance is less than 10000m, then we don't need to add the points, for the sake of performance, we are skipping the points
        //we are also not allowing more than 3 skips i.e. max of 3000m skips distance without calculating the aqi value.
        if (steps[j].distance < 1000) {
            //for < 1km
            //if the distance is less than 1000m, then we don't need to add the points, just increase the skip distance
            if (skippedDistance >= 2) {
                // the index of route point to be added is
                let index = Math.floor(steps[j].geometry.coordinates.length / 2)
                routePoints.push(steps[j].geometry.coordinates[index])
                // console.log(steps[j].time + skippedTime)
                routePointTime.push(steps[j].duration + skippedTime)
            } else {
                skippedDistance += steps[j].distance * 0.001
                skippedTime += steps[j].duration
                continue
            }
        } else if (steps[j].distance < 2000) {
            //for distance > 1km and < 2km
            skippedDistance = 0
            skippedTime = 0
            //taking the middle coordinate of the step
            let index = Math.floor(steps[j].geometry.coordinates.length / 2)
            routePoints.push(steps[j].geometry.coordinates[index])
            // console.log(steps[j].time)
            routePointTime.push(steps[j].duration)
        } else if (steps[j].distance >= 2000) {
            //for distance > 2km
            skippedDistance = 0
            skippedTime = 0
            let chunks = Math.floor(steps[j].distance / 2000) //number of chunks
            let timeChunk = Math.floor(steps[j].duration / chunks) //time for each chunk

            let chunkLength = Math.floor(
                steps[j].geometry.coordinates.length / chunks
            ) // number of coordinates in each chunk

            for (let k = 0; k < chunks; k++) {
                let startChunkIndex = k * chunkLength
                let endChunkIndex = (k + 1) * chunkLength
                let index = Math.floor((startChunkIndex + endChunkIndex) / 2)
                routePoints.push(steps[j].geometry.coordinates[index])
                routePointTime.push(timeChunk)
            }
        }
    }
    //for each route the points are adding in this array.
    console.log({ routePoints })
    console.log({ routePointTime })

    // fetching the aqi values for the points in the route
    aqiValues = []
    let totalRouteExposure = 0
    for (let j = 0; j < routePoints.length; j++) {
        //fetch the aqi values for the points in the routes
        try {
            if (
                routePoints[j] === undefined ||
                routePointTime[j] === undefined
            ) {
                continue
            }
            const aqiData = await fetchAqiData([
                routePoints[j][0],
                routePoints[j][1],
            ])
            console.log({ aqiData })
            totalRouteExposure =
                totalRouteExposure +
                (aqiData.data.iaqi.pm25.v * routePointTime[j]) / 3600 // converting the time to hours
            console.log(
                'The total exposure for the route is: ',
                totalRouteExposure
            )
            console.log("The pm2.5 concentration is ", aqiData.data.iaqi.pm25.v)
            console.log("The aqi value is ", aqiData.data.aqi)
            aqiValues.push(aqiData)
            // await new Promise(r => setTimeout(r, 400));  //sleep for  200 ms to avoid the rate limit of the api
        } catch (e) {
            console.log(e)
        }
    }
    route.totalExposure = totalRouteExposure
    route.aqiValues = aqiValues
    console.log('The total exposure for the route is: ', totalRouteExposure)
    return route
}
