// The globe is centered directly beneath the city's origin, so the city
// sits at true geometric "north pole" of the sphere — not floating
// somewhere unrelated in space. Zooming from city → planet is a straight
// pull-back along the same vertical axis, which is what makes it read as
// "your city, seen from higher up" rather than "a random disconnected ball".
export const PLANET_RADIUS = 900;
export const PLANET_CENTER: [number, number, number] = [0, -(PLANET_RADIUS + 50), 0];

// Real NASA imagery (public domain), served with CORS enabled from stable,
// widely-used mirrors — not a procedural stand-in.
export const EARTH_DAY_TEXTURE_URL =
  "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-blue-marble.jpg";
export const EARTH_NIGHT_TEXTURE_URL =
  "https://raw.githubusercontent.com/vasturiano/three-globe/master/example/img/earth-night.jpg";
export const EARTH_CLOUDS_TEXTURE_URL =
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png";
