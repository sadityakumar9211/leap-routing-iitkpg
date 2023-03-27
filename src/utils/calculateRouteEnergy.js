import getMassfromMode from './getMassfromMode'

export default function calculateRouteEnergy(route, mode) {

    const mass = getMassfromMode(mode)
    const g = 9.8

    // for carbon emssions we can find the total energy consumed by the vehicle
    // and then also consider the fuel efficiency of the vehicle. We also need to consider
    // the mass of the vehicle --> can take the average mass of the vehicle.

    console.log('Inside calculateRouteEnergy', { route })

    route.totalEnergy = 0
    let segments = route.instructions 
    console.log("segments", segments)
    for (let j = 0; j < segments?.length; j++) {
        const startIndex = segments[j].interval[0]
        const endIndex = segments[j].interval[1]

        console.log('startIndex', startIndex)
        console.log('endIndex', endIndex)

        console.log(route.points.coordinates[endIndex])
        console.log(route.points.coordinates[startIndex][2])
        const heightGain =
            route.points.coordinates[endIndex][2] -
            route.points.coordinates[startIndex][2]
        console.log('heightGain', heightGain)
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
        route.totalEnergy += totalPotentialEnergy + totalKineticEnergy
        console.log('totalEnergy', route.totalEnergy)
    }
    
    return route.totalEnergy / 1000 
}
