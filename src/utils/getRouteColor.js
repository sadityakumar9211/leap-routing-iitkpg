module.exports = function getRouteColor(mode) {
    let routeColor = ''
    if (mode == 'traffic-driving') routeColor = '#f15bb5'
    else if (mode == 'driving') routeColor = '#00bbf9'
    else if (mode == 'walking') routeColor = '#00f5d4'
    else if (mode == 'cycling') routeColor = '#9b5de5'
    return routeColor
}
