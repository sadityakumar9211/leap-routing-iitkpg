export default function getIconFromMode({ mode, locationType }) {
    const icon = new Image()
    if (locationType === 'source') {
        if (mode === 'car' || mode === 'driving-traffic') {
            icon.src = '/images/car.png'
            icon.height = 500
            icon.width = 800
        } else if (mode === 'truck' || mode === 'truck-traffic') {
            icon.src = '/images/bus.png'
            icon.height = 400
            icon.width = 900
        } else if (mode == 'scooter') {
            icon.height = 800
            icon.width = 600
            icon.src = '/images/scooter.png'
        } else if (mode === 'bike') {
            icon.src = '/images/bike.png'
            icon.height = 800
            icon.width = 600
        } else if (mode === 'foot') {
            icon.src = '/images/foot.png'
            icon.height = 500
            icon.width = 500
        } else {
            icon.src = '/images/pin.png'
        }
    } else {
        icon.src = '/images/pin.png'
    }
    return icon
}
