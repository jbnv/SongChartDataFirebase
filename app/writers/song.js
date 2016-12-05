module.exports = function(firebase,slug,song) {
  if (!slug || !song) return;
  var ref = firebase.database().ref("songs/raw").child(slug);
  if (song.peak)
    ref.child("peak").set(song.peak);
  if (song["ascent-weeks"])
    ref.child("ascent-weeks").set(song["ascent-weeks"]);
  if (song["descent-weeks"])
    ref.child("descent-weeks").set(song["descent-weeks"]);
}
