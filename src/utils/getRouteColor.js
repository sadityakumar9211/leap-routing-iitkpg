export default function getRouteColor(routePreference) {
    console.log(routePreference)
    if (routePreference === 'fastest') return '#f01f1f'
    else if (routePreference === 'shortest') return '#0000ff'
    else if (routePreference === 'leap') return '#013307'
    else if (routePreference === 'safest') return '#fff700'
    else if (routePreference === 'emission') return '#661fe0'
    else if (routePreference === 'balanced') return '#34e1eb'
}
