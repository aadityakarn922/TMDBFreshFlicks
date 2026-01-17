import { useEffect, useState } from "react";

// Hardcoded TMDB API Key
const API_KEY = "8ba553ef731972dcea8daec1009fbdc1";
const CACHE_KEY = "top_movies";
const CACHE_DATE_KEY = "top_movies_date";

function MovieRecommender() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");

  useEffect(() => {
    fetchGenres();
    loadMovies();
  }, []);

  // Fetch TMDB genres
  const fetchGenres = async () => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`
      );
      const data = await res.json();
      setGenres(data.genres || []);
    } catch (err) {
      console.error("Error fetching genres:", err);
      setGenres([]);
    }
  };

  // Load movies from cache or fetch
  const loadMovies = async () => {
    const cachedMovies = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_DATE_KEY);
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (cachedMovies && cachedTime && now - Number(cachedTime) < oneWeek) {
      setMovies(shuffle(JSON.parse(cachedMovies)));
      setLoading(false);
    } else {
      fetchMovies(selectedGenre);
    }
  };

  // Fetch top movies
  const fetchMovies = async (genreId) => {
    setLoading(true);
    try {
      let url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`;
      if (genreId) {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_average.desc&vote_count.gte=50&with_genres=${genreId}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      const topMovies = shuffle(data.results || []).slice(0, 10);

      setMovies(topMovies);
      localStorage.setItem(CACHE_KEY, JSON.stringify(topMovies));
      localStorage.setItem(CACHE_DATE_KEY, Date.now());
    } catch (err) {
      console.error("Error fetching movies:", err);
      // Fallback movies
      setMovies([
        { id: 1, title: "Fallback Movie 1", vote_average: 8.0, release_date: "2024-01-01", overview: "Some overview..." },
        { id: 2, title: "Fallback Movie 2", vote_average: 7.5, release_date: "2023-12-01", overview: "Some overview..." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Shuffle array helper
  const shuffle = (arr) => arr.map(v => ({v, sort: Math.random()})).sort((a,b)=>a.sort-b.sort).map(({v})=>v);

  // Handle genre change
  const handleGenreChange = (e) => {
    const genreId = e.target.value;
    setSelectedGenre(genreId);
    fetchMovies(genreId);
  };

  return (
    <div className="movie-card-container">
      <h1>Top Rated Movies</h1>

      <div>
        <label>Choose Genre: </label>
        <select value={selectedGenre} onChange={handleGenreChange}>
          <option value="">All</option>
          {genres.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {loading && <p>Loading movies...</p>}

      <div className="movies-row">
        {movies?.length > 0 ? movies.map((movie) => (
          <div className="movie-card" key={movie.id}>
            <img
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "https://via.placeholder.com/200x300?text=No+Image"}
              alt={movie.title}
            />
            <h3>{movie.title}</h3>
            <p>⭐ {movie.vote_average}</p>
            <p className="movie-year">{movie.release_date?.substring(0, 4)}</p>
            <p className="movie-overview">{movie.overview?.length > 60 ? movie.overview.substring(0, 60) + "..." : movie.overview}</p>
          </div>
        )) : !loading && <p>No movies found.</p>}
      </div>
    </div>
  );
}

export default MovieRecommender;
