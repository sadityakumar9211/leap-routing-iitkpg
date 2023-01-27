/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            colors: {
                shortest: '#0000ff',
                balanced: '#34e1eb',
                fastest: '#f01f1f',
                leap: '#013307',
                emission: '#661fe0',
                safest: '#fff700',
            },
        },
    },
    plugins: [require('daisyui')],
}
