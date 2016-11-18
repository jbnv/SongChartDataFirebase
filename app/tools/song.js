function _hasPropertyFn(singularSlug,pluralSlug) {
  return function(value) {
    return function(song) {
      if (song[pluralSlug] && song[pluralSlug][value]) return true;
      if (song[singularSlug] && song[singularSlug] === value) return true;
      return false;
    };
  }
}

exports.hasArtist = _hasPropertyFn("artist","artists");
exports.hasGenre = _hasPropertyFn("genre","genres");
exports.hasPlaylist = _hasPropertyFn("playlist","playlists");
exports.hasSource = _hasPropertyFn("source","sources");
