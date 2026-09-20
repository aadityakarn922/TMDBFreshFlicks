import { useEffect, useState, useCallback } from "react";


const API_KEY = import.meta.env.VITE_TMDB_API_KEY
const CACHE_KEY = "top_movies";
const CACHE_DATE_KEY = "top_movies_date";

const shuffle = (arr) => arr.map(v => ({v, sort: Math.random()})).sort((a,b)=>a.sort-b.sort).map(({v})=>v);

function MovieRecommender() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [error, setError] = useState("");

  const fetchGenres = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`
      );
      if (!res.ok) throw new Error("Genre request failed");
      const data = await res.json();
      setGenres(data.genres || []);
    } catch (err) {
      console.error("Error fetching genres:", err);
      setGenres([]);
    }
  }, []);

  const fetchMovies = useCallback(async (genreId) => {
    setLoading(true);
    setError("");
    try {
      let url = `https://api.themoviedb.org/3/movie/top_rated?api_key=${API_KEY}&language=en-US&page=1`;
      if (genreId) {
        url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=vote_average.desc&vote_count.gte=50&with_genres=${genreId}`;
      }

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`TMDB API responded with status ${res.status}`);
      }
      const data = await res.json();

      if (data.success === false) {
        throw new Error(data.status_message || "TMDB API error");
      }

      const topMovies = shuffle(data.results || []).slice(0, 10);

      if (topMovies.length > 0) {
        setMovies(topMovies);
        localStorage.setItem(CACHE_KEY, JSON.stringify(topMovies));
        localStorage.setItem(CACHE_DATE_KEY, Date.now());
      } else {
        setMovies([]);
        setError("No movies found. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching movies:", err);
      setError(`Failed to load movies: ${err.message}`);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMovies = useCallback(async () => {
    const cachedMovies = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_DATE_KEY);
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    if (
      cachedMovies &&
      cachedTime &&
      now - Number(cachedTime) < oneWeek &&
      JSON.parse(cachedMovies).length > 0
    ) {
      setMovies(shuffle(JSON.parse(cachedMovies)));
      setLoading(false);
    } else {
      fetchMovies(selectedGenre);
    }
  }, [fetchMovies, selectedGenre]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGenres();
      loadMovies();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchGenres, loadMovies]);

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

      {loading && <p className="status-msg">Loading movies...</p>}

      {!loading && error && <p className="status-msg error">{error}</p>}

      {!loading && !error && movies?.length === 0 && (
        <p className="status-msg">No movies found.</p>
      )}

      <div className="movies-row">
        {movies?.length > 0 && movies.map((movie) => (
          <div className="movie-card" key={movie.id}>
            <img
              src={movie.poster_path ? `https://image.tmdb.org/t/p/w200${movie.poster_path}` : "https://via.placeholder.com/200x300?text=No+Image"}
              alt={movie.title}
            />
            <h3>{movie.title}</h3>
            <p> {movie.vote_average}</p>
            <p className="movie-year">{movie.release_date?.substring(0, 4)}</p>
            <p className="movie-overview">{movie.overview?.length > 60 ? movie.overview.substring(0, 60) + "..." : movie.overview}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MovieRecommender;