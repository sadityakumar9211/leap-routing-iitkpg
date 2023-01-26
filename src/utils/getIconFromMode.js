export default function getIconFromMode({ mode, locationType }) {
    const icon = new Image()
    if (locationType === 'source') {
        if (mode === 'car' || mode === 'driving-traffic') {
            icon.src = '/images/car.jpeg'
        } else if (mode === 'truck' || mode === 'truck-traffic') {
            icon.src = '/images/truck.png'
        } else if (mode == 'scooter') {
            icon.width = 500
            icon.height = 800
            icon.src = '/images/scooter.png'
        } else if (mode === 'bike') {
            icon.src = '/images/bike.png'
        } else if (mode === 'foot') {
            icon.src = '/images/foot.png'
        } else {
            icon.src = '/images/pin.png'
        }
    } else {
        icon.src = '/images/pin.png'
    }
    return icon
}
