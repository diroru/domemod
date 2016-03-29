function deg2Rad(d) {
  return d * Math.PI / 180;
}

function rad2Deg(r) {
  return r * 180 / Math.PI;
}

module.exports = {
  rad2Deg : rad2Deg,
  deg2Rad : deg2Rad
}
