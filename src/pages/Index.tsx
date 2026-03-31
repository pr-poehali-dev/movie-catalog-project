import { useState, useMemo } from "react";
import Icon from "@/components/ui/icon";
import { ALL_FILMS, FEATURED_FILMS, type Film } from "@/data/films";

type Section = "home" | "catalog" | "top" | "favorites" | "profile" | "contacts" | "games";

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: "home", label: "Главная", icon: "Home" },
  { id: "catalog", label: "Каталог", icon: "Film" },
  { id: "top", label: "Топ-рейтинг", icon: "Trophy" },
  { id: "favorites", label: "Избранное", icon: "Heart" },
  { id: "profile", label: "Профиль", icon: "User" },
  { id: "contacts", label: "Контакты", icon: "Mail" },
  { id: "games", label: "Мини-игры", icon: "Gamepad2" },
];

const PAGE_SIZE = 24;

const COLLECTION_FILTERS = ["Все", "Marvel", "Фантастика"];
const GENRE_FILTERS = ["Все жанры", "Боевик", "Драма", "Комедия", "Триллер", "Ужасы", "Приключения", "Марвел"];

export default function Index() {
  const [activeSection, setActiveSection] = useState<Section>("home");
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});
  const [favorites, setFavorites] = useState<number[]>([]);
  const [playerFilm, setPlayerFilm] = useState<Film | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoverRating, setHoverRating] = useState<{ filmId: number; star: number } | null>(null);

  // Catalog state
  const [search, setSearch] = useState("");
  const [collectionFilter, setCollectionFilter] = useState("Все");
  const [genreFilter, setGenreFilter] = useState("Все жанры");
  const [sortBy, setSortBy] = useState<"rating" | "year" | "title">("rating");
  const [page, setPage] = useState(1);

  const films = useMemo(() =>
    ALL_FILMS.map(f => ({
      ...f,
      userRating: userRatings[f.id] ?? 0,
    })), [userRatings]);

  const topFilms = useMemo(() =>
    [...films].sort((a, b) => b.rating - a.rating).slice(0, 3),
    [films]
  );

  const heroFilm = FEATURED_FILMS[0];

  const filteredFilms = useMemo(() => {
    let result = films;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(f =>
        f.title.toLowerCase().includes(q) || f.director.toLowerCase().includes(q)
      );
    }
    if (collectionFilter !== "Все") {
      result = result.filter(f => f.collection === collectionFilter);
    }
    if (genreFilter !== "Все жанры") {
      result = result.filter(f => f.genre.includes(genreFilter));
    }
    result = [...result].sort((a, b) => {
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "year") return b.year - a.year;
      return a.title.localeCompare(b.title, "ru");
    });
    return result;
  }, [films, search, collectionFilter, genreFilter, sortBy]);

  const totalPages = Math.ceil(filteredFilms.length / PAGE_SIZE);
  const pagedFilms = filteredFilms.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleRate = (filmId: number, rating: number) => {
    setUserRatings(prev => ({ ...prev, [filmId]: rating }));
  };

  const toggleFavorite = (filmId: number) => {
    setFavorites(prev =>
      prev.includes(filmId) ? prev.filter(id => id !== filmId) : [...prev, filmId]
    );
  };

  const resetCatalogFilters = () => {
    setSearch(""); setCollectionFilter("Все"); setGenreFilter("Все жанры"); setSortBy("rating"); setPage(1);
  };

  const favFilms = films.filter(f => favorites.includes(f.id));
  const ratedFilms = films.filter(f => userRatings[f.id] > 0);

  return (
    <div className="min-h-screen bg-noir font-body grain-overlay">
      {/* NAVIGATION */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveSection("home")}>
            <div className="w-8 h-8 gold-gradient rounded-sm flex items-center justify-center">
              <Icon name="Film" size={16} className="text-noir" />
            </div>
            <span className="font-display text-2xl font-bold shimmer-text tracking-widest">CINEMAXX</span>
          </div>
          <div className="hidden lg:flex items-center gap-7">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`nav-link text-xs font-body font-semibold uppercase tracking-widest transition-colors ${
                  activeSection === s.id ? "text-gold active" : "text-cream/60 hover:text-cream"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button className="lg:hidden text-gold" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden glass border-t border-gold/10 px-6 py-4 flex flex-col gap-4">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); setMobileMenuOpen(false); }}
                className={`flex items-center gap-3 text-sm font-body uppercase tracking-widest transition-colors text-left ${
                  activeSection === s.id ? "text-gold" : "text-cream/60"
                }`}
              >
                <Icon name={s.icon} size={16} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* PLAYER MODAL */}
      {playerFilm && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4" onClick={() => setPlayerFilm(null)}>
          <div className="w-full max-w-5xl animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-3xl text-cream">{playerFilm.title}</h2>
                <p className="text-gold text-sm font-body">{playerFilm.year} · {playerFilm.duration}</p>
              </div>
              <button onClick={() => setPlayerFilm(null)} className="w-10 h-10 rounded-full border border-gold/30 flex items-center justify-center text-gold hover:bg-gold/10 transition-colors">
                <Icon name="X" size={20} />
              </button>
            </div>
            <div className="relative aspect-video bg-noir-3 rounded overflow-hidden border border-gold/20">
              <iframe
                src={playerFilm.videoUrl + "?autoplay=1"}
                title={playerFilm.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="mt-4 text-cream/70 font-body text-sm leading-relaxed">{playerFilm.description}</div>
          </div>
        </div>
      )}

      <div className="pt-16">
        {/* ====== HOME ====== */}
        {activeSection === "home" && (
          <div>
            <section className="relative min-h-[90vh] flex items-center overflow-hidden">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroFilm.poster})` }} />
              <div className="absolute inset-0 bg-gradient-to-r from-noir via-noir/85 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-transparent to-transparent" />
              <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
                <div className="max-w-xl animate-fade-in">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-px bg-gold" />
                    <span className="text-gold text-xs font-body uppercase tracking-[0.3em]">Премьера сезона</span>
                  </div>
                  <h1 className="font-display text-6xl lg:text-8xl font-bold text-cream leading-none mb-4">
                    Тор:<br /><span className="text-gold italic">Рагнарёк</span>
                  </h1>
                  <div className="flex items-center gap-4 mb-6 flex-wrap">
                    <div className="flex items-center gap-1">
                      {[...Array(10)].map((_, i) => (
                        <Icon key={i} name="Star" size={14} className={i < Math.floor(heroFilm.rating) ? "fill-gold text-gold" : "text-cream/30"} />
                      ))}
                      <span className="text-gold font-body font-bold ml-2">{heroFilm.rating}</span>
                    </div>
                    <span className="text-cream/40 text-xs">|</span>
                    <span className="text-cream/60 text-sm font-body">{heroFilm.year}</span>
                    <span className="text-cream/40 text-xs">|</span>
                    <span className="text-cream/60 text-sm font-body">{heroFilm.duration}</span>
                  </div>
                  <p className="text-cream/70 font-body text-sm leading-relaxed mb-8">{heroFilm.description}</p>
                  <div className="flex gap-4 flex-wrap">
                    <button onClick={() => setPlayerFilm(heroFilm)} className="gold-gradient text-noir font-body font-semibold text-sm uppercase tracking-widest px-8 py-3 rounded-sm flex items-center gap-2 hover:shadow-lg hover:shadow-gold/30 transition-all hover:scale-105">
                      <Icon name="Play" size={16} />
                      Смотреть
                    </button>
                    <button onClick={() => toggleFavorite(heroFilm.id)} className="border border-gold/40 text-cream font-body text-sm uppercase tracking-widest px-6 py-3 rounded-sm flex items-center gap-2 hover:border-gold hover:text-gold transition-all">
                      <Icon name={favorites.includes(heroFilm.id) ? "HeartOff" : "Heart"} size={16} />
                      {favorites.includes(heroFilm.id) ? "Убрать" : "Избранное"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3 z-10">
                {FEATURED_FILMS.slice(0, 3).map((film, i) => (
                  <button key={film.id} onClick={() => setPlayerFilm(film)} className={`w-16 h-24 rounded overflow-hidden border-2 transition-all ${i === 0 ? "border-gold scale-110" : "border-transparent opacity-60 hover:opacity-100 hover:border-gold/50"}`}>
                    <img src={film.poster} alt={film.title} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 py-16">
              <div className="text-center mb-12">
                <p className="text-gold text-xs uppercase tracking-[0.4em] font-body mb-2">Лучшее прямо сейчас</p>
                <h2 className="font-display text-5xl text-cream">Топ-3 Фильма</h2>
                <div className="section-divider mt-4" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topFilms.map((film, idx) => (
                  <FilmCard key={film.id} film={film} rank={idx + 1} isFavorite={favorites.includes(film.id)} userRating={userRatings[film.id] ?? 0}
                    onPlay={() => setPlayerFilm(film)} onFavorite={() => toggleFavorite(film.id)} onRate={handleRate}
                    hoverRating={hoverRating} setHoverRating={setHoverRating} />
                ))}
              </div>
            </section>

            {/* Stats strip */}
            <div className="border-y border-gold/10 bg-noir-2 py-8">
              <div className="flex gap-8 items-center justify-center flex-wrap px-6">
                {[
                  { icon: "Film", label: "Фильмов", value: ALL_FILMS.length.toLocaleString() },
                  { icon: "Layers", label: "Marvel", value: "33" },
                  { icon: "Rocket", label: "Фантастика", value: "700+" },
                  { icon: "Star", label: "Рейтингов", value: "1M+" },
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-cream/40">
                    <Icon name={s.icon} size={18} className="text-gold" />
                    <div>
                      <div className="font-display text-2xl text-gold leading-none">{s.value}</div>
                      <div className="text-xs font-body uppercase tracking-wider">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ====== CATALOG ====== */}
        {activeSection === "catalog" && (
          <section className="max-w-7xl mx-auto px-6 py-16">
            <div className="mb-8">
              <p className="text-gold text-xs uppercase tracking-[0.4em] font-body mb-2">Все фильмы</p>
              <div className="flex items-end justify-between gap-4 flex-wrap">
                <h2 className="font-display text-5xl text-cream">Каталог</h2>
                <span className="text-cream/30 font-body text-sm">{filteredFilms.length.toLocaleString()} фильмов</span>
              </div>
              <div className="w-12 h-px bg-gold mt-4" />
            </div>

            {/* Filters */}
            <div className="glass rounded-sm p-4 mb-8 flex flex-wrap gap-3 items-center">
              {/* Search */}
              <div className="flex items-center gap-2 bg-noir-3 border border-gold/20 rounded-sm px-3 py-2 flex-1 min-w-[200px]">
                <Icon name="Search" size={16} className="text-gold/50" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Поиск по названию..."
                  className="bg-transparent text-cream font-body text-sm focus:outline-none placeholder:text-cream/20 w-full"
                />
              </div>
              {/* Collection */}
              <div className="flex gap-1">
                {COLLECTION_FILTERS.map(f => (
                  <button key={f} onClick={() => { setCollectionFilter(f); setPage(1); }}
                    className={`px-3 py-2 text-xs font-body uppercase tracking-wide rounded-sm transition-all ${
                      collectionFilter === f ? "gold-gradient text-noir font-semibold" : "border border-gold/20 text-cream/60 hover:text-cream hover:border-gold/40"
                    }`}>{f}</button>
                ))}
              </div>
              {/* Genre */}
              <select
                value={genreFilter}
                onChange={e => { setGenreFilter(e.target.value); setPage(1); }}
                className="bg-noir-3 border border-gold/20 text-cream font-body text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-gold/50 uppercase tracking-wide"
              >
                {GENRE_FILTERS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as "rating" | "year" | "title"); setPage(1); }}
                className="bg-noir-3 border border-gold/20 text-cream font-body text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-gold/50 uppercase tracking-wide"
              >
                <option value="rating">По рейтингу</option>
                <option value="year">По году</option>
                <option value="title">По названию</option>
              </select>
              <button onClick={resetCatalogFilters} className="text-xs text-cream/40 hover:text-gold font-body transition-colors">
                Сбросить
              </button>
            </div>

            {pagedFilms.length === 0 ? (
              <div className="text-center py-24">
                <Icon name="SearchX" size={48} className="text-gold/20 mx-auto mb-4" />
                <p className="font-display text-3xl text-cream/30">Ничего не найдено</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {pagedFilms.map(film => (
                    <FilmCard key={film.id} film={film} isFavorite={favorites.includes(film.id)} userRating={userRatings[film.id] ?? 0}
                      onPlay={() => setPlayerFilm(film)} onFavorite={() => toggleFavorite(film.id)} onRate={handleRate}
                      hoverRating={hoverRating} setHoverRating={setHoverRating} compact />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10 flex-wrap">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-9 h-9 flex items-center justify-center border border-gold/20 text-cream/60 hover:border-gold hover:text-gold transition-all disabled:opacity-30 rounded-sm"
                    >
                      <Icon name="ChevronLeft" size={16} />
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 7) p = i + 1;
                      else if (page <= 4) p = i + 1;
                      else if (page >= totalPages - 3) p = totalPages - 6 + i;
                      else p = page - 3 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 flex items-center justify-center text-sm font-body rounded-sm transition-all ${
                            page === p ? "gold-gradient text-noir font-bold" : "border border-gold/20 text-cream/60 hover:border-gold hover:text-gold"
                          }`}
                        >{p}</button>
                      );
                    })}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-9 h-9 flex items-center justify-center border border-gold/20 text-cream/60 hover:border-gold hover:text-gold transition-all disabled:opacity-30 rounded-sm"
                    >
                      <Icon name="ChevronRight" size={16} />
                    </button>
                    <span className="text-cream/30 text-xs font-body ml-2">Стр. {page} из {totalPages}</span>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ====== TOP RATING ====== */}
        {activeSection === "top" && (
          <section className="max-w-5xl mx-auto px-6 py-16">
            <div className="mb-12 text-center">
              <p className="text-gold text-xs uppercase tracking-[0.4em] font-body mb-2">Рейтинг зрителей</p>
              <h2 className="font-display text-5xl text-cream">Топ-рейтинг</h2>
              <div className="section-divider mt-4" />
            </div>
            <div className="space-y-3">
              {[...films].sort((a, b) => b.rating - a.rating).slice(0, 50).map((film, idx) => (
                <div key={film.id} className="glass glass-hover rounded-sm p-4 flex items-center gap-5">
                  <div className="font-display text-4xl font-bold w-12 text-center shrink-0" style={{
                    color: idx === 0 ? '#E8C96B' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'rgba(240,232,216,0.15)'
                  }}>
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <img src={film.poster} alt={film.title} className="w-12 h-18 object-cover rounded-sm border border-gold/20 hidden sm:block shrink-0" style={{ height: '4.5rem' }} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl text-cream truncate">{film.title}</h3>
                    <p className="text-cream/50 text-xs font-body">{film.year} · {film.director}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {film.genre.slice(0, 2).map(g => (
                        <span key={g} className="text-xs border border-gold/20 text-gold/60 px-1.5 font-body">{g}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-3xl text-gold">{film.rating}</div>
                    <div className="text-cream/30 text-xs font-body">{film.votes.toLocaleString()}</div>
                    <button onClick={() => setPlayerFilm(film)} className="mt-1 text-xs border border-gold/30 text-gold px-3 py-0.5 hover:bg-gold/10 transition-colors">
                      ▶ Смотреть
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ====== FAVORITES ====== */}
        {activeSection === "favorites" && (
          <section className="max-w-7xl mx-auto px-6 py-16">
            <div className="mb-12">
              <p className="text-gold text-xs uppercase tracking-[0.4em] font-body mb-2">Ваш список</p>
              <h2 className="font-display text-5xl text-cream">Избранное</h2>
              <div className="w-12 h-px bg-gold mt-4" />
            </div>
            {favFilms.length === 0 ? (
              <div className="text-center py-24">
                <Icon name="Heart" size={48} className="text-gold/20 mx-auto mb-4" />
                <p className="font-display text-3xl text-cream/30">Список пуст</p>
                <p className="text-cream/40 font-body text-sm mt-2">Добавляйте фильмы через значок сердца</p>
                <button onClick={() => setActiveSection("catalog")} className="mt-6 border border-gold/30 text-gold text-sm font-body uppercase tracking-widest px-6 py-2 hover:bg-gold/10 transition-colors">
                  Перейти в каталог
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {favFilms.map(film => (
                  <FilmCard key={film.id} film={film} isFavorite={true} userRating={userRatings[film.id] ?? 0}
                    onPlay={() => setPlayerFilm(film)} onFavorite={() => toggleFavorite(film.id)} onRate={handleRate}
                    hoverRating={hoverRating} setHoverRating={setHoverRating} compact />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ====== PROFILE ====== */}
        {activeSection === "profile" && (
          <section className="max-w-3xl mx-auto px-6 py-16">
            <div className="mb-12">
              <p className="text-gold text-xs uppercase tracking-[0.4em] font-body mb-2">Личный кабинет</p>
              <h2 className="font-display text-5xl text-cream">Профиль</h2>
              <div className="w-12 h-px bg-gold mt-4" />
            </div>
            <div className="glass rounded-sm p-8 mb-6">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center">
                  <Icon name="User" size={36} className="text-noir" />
                </div>
                <div>
                  <h3 className="font-display text-3xl text-cream">Гость</h3>
                  <p className="text-gold text-sm font-body">Премиум участник</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 border-t border-gold/10 pt-6">
                {[
                  { label: "В каталоге", value: ALL_FILMS.length.toLocaleString() },
                  { label: "Избранное", value: String(favorites.length) },
                  { label: "Оценено", value: String(ratedFilms.length) },
                ].map(stat => (
                  <div key={stat.label} className="text-center">
                    <div className="font-display text-4xl text-gold">{stat.value}</div>
                    <div className="text-cream/40 text-xs font-body mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-sm p-6">
              <h4 className="font-display text-xl text-cream mb-4">Мои оценки</h4>
              {ratedFilms.length === 0 ? (
                <p className="text-cream/40 font-body text-sm">Вы ещё не оценили ни одного фильма</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {ratedFilms.map(f => (
                    <div key={f.id} className="flex items-center justify-between border-b border-gold/10 pb-3">
                      <span className="font-display text-lg text-cream">{f.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <Icon name="Star" size={14} className="fill-gold text-gold" />
                        <span className="text-gold font-body font-bold">{userRatings[f.id]}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ====== CONTACTS ====== */}
        {activeSection === "contacts" && (
          <section className="max-w-3xl mx-auto px-6 py-16">
            <div className="mb-12">
              <p className="text-gold text-xs uppercase tracking-[0.4em] font-body mb-2">Связаться с нами</p>
              <h2 className="font-display text-5xl text-cream">Контакты</h2>
              <div className="w-12 h-px bg-gold mt-4" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: "Mail", title: "Email", value: "info@cinemaxx.ru" },
                { icon: "Phone", title: "Телефон", value: "+7 (800) 555-35-35" },
                { icon: "MapPin", title: "Адрес", value: "Москва, Россия" },
              ].map(c => (
                <div key={c.title} className="glass rounded-sm p-6 text-center hover:border-gold/30 transition-all">
                  <Icon name={c.icon} size={28} className="text-gold mx-auto mb-3" />
                  <div className="font-display text-lg text-cream">{c.title}</div>
                  <div className="text-cream/50 text-sm font-body mt-1">{c.value}</div>
                </div>
              ))}
            </div>
            <div className="glass rounded-sm p-8">
              <h3 className="font-display text-2xl text-cream mb-6">Написать нам</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-cream/50 text-xs font-body uppercase tracking-wider block mb-2">Имя</label>
                  <input className="w-full bg-noir-3 border border-gold/20 text-cream font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20" placeholder="Ваше имя" />
                </div>
                <div>
                  <label className="text-cream/50 text-xs font-body uppercase tracking-wider block mb-2">Email</label>
                  <input className="w-full bg-noir-3 border border-gold/20 text-cream font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20" placeholder="email@example.com" />
                </div>
                <div>
                  <label className="text-cream/50 text-xs font-body uppercase tracking-wider block mb-2">Сообщение</label>
                  <textarea rows={4} className="w-full bg-noir-3 border border-gold/20 text-cream font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20 resize-none" placeholder="Ваше сообщение..." />
                </div>
                <button className="gold-gradient text-noir font-body font-semibold text-sm uppercase tracking-widest px-8 py-3 rounded-sm hover:opacity-90 transition-opacity">
                  Отправить
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ====== MINI GAMES ====== */}
        {activeSection === "games" && <GamesSection films={FEATURED_FILMS.slice(0, 6)} />}
      </div>

      <footer className="border-t border-gold/10 mt-16 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gold-gradient rounded-sm flex items-center justify-center">
              <Icon name="Film" size={12} className="text-noir" />
            </div>
            <span className="font-display text-lg shimmer-text tracking-widest">CINEMAXX</span>
          </div>
          <p className="text-cream/30 text-xs font-body">© 2025 CineMaxx · {ALL_FILMS.length.toLocaleString()} фильмов в каталоге</p>
          <div className="flex gap-4">
            {["Instagram", "Twitter", "Youtube"].map(s => (
              <button key={s} className="text-cream/30 hover:text-gold transition-colors text-xs font-body">{s}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===== FILM CARD =====
function FilmCard({
  film, rank, isFavorite, userRating, onPlay, onFavorite, onRate, hoverRating, setHoverRating, compact
}: {
  film: Film;
  rank?: number;
  isFavorite: boolean;
  userRating: number;
  onPlay: () => void;
  onFavorite: () => void;
  onRate: (id: number, r: number) => void;
  hoverRating: { filmId: number; star: number } | null;
  setHoverRating: (v: { filmId: number; star: number } | null) => void;
  compact?: boolean;
}) {
  const currentHover = hoverRating?.filmId === film.id ? hoverRating.star : 0;
  const displayRating = currentHover || userRating;

  if (compact) {
    return (
      <div className="film-card rounded-sm overflow-hidden bg-noir-2 border border-gold/10">
        <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
          <img src={film.poster} alt={film.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
          {film.collection === "Marvel" && (
            <div className="absolute top-2 left-2 z-20 bg-red-700/90 text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm tracking-wider">
              MARVEL
            </div>
          )}
          <button onClick={onFavorite} className="absolute top-2 right-2 z-20 w-7 h-7 bg-noir/70 rounded-sm flex items-center justify-center border border-gold/20 hover:border-gold/60 transition-all">
            <Icon name="Heart" size={12} className={isFavorite ? "fill-red-500 text-red-500" : "text-cream/60"} />
          </button>
          <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-noir/70">
            <button onClick={onPlay} className="w-12 h-12 gold-gradient rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
              <Icon name="Play" size={20} className="text-noir ml-1" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 p-2 bg-gradient-to-t from-noir to-transparent">
            <div className="flex items-center gap-1">
              <Icon name="Star" size={10} className="fill-gold text-gold" />
              <span className="text-gold font-body font-bold text-xs">{film.rating}</span>
            </div>
          </div>
        </div>
        <div className="p-2">
          <h3 className="font-display text-sm text-cream leading-tight truncate">{film.title}</h3>
          <p className="text-cream/40 text-xs font-body">{film.year}</p>
          <div className="star-rating flex gap-px mt-1">
            {[...Array(10)].map((_, i) => {
              const starVal = i + 1;
              return (
                <span
                  key={i}
                  onMouseEnter={() => setHoverRating({ filmId: film.id, star: starVal })}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => onRate(film.id, starVal)}
                  className="text-sm leading-none select-none"
                  style={{ color: displayRating >= starVal ? '#C9A84C' : 'rgba(240,232,216,0.2)', cursor: 'pointer' }}
                >★</span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="film-card rounded-sm overflow-hidden bg-noir-2 border border-gold/10">
      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
        <img src={film.poster} alt={film.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
        {rank && (
          <div className="absolute top-3 left-3 z-20 w-8 h-8 gold-gradient rounded-sm flex items-center justify-center">
            <span className="font-display font-bold text-noir text-sm">{rank}</span>
          </div>
        )}
        <button onClick={onFavorite} className="absolute top-3 right-3 z-20 w-8 h-8 bg-noir/70 rounded-sm flex items-center justify-center border border-gold/20 hover:border-gold/60 transition-all">
          <Icon name="Heart" size={14} className={isFavorite ? "fill-red-500 text-red-500" : "text-cream/60"} />
        </button>
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-noir/60">
          <button onClick={onPlay} className="w-14 h-14 gold-gradient rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
            <Icon name="Play" size={24} className="text-noir ml-1" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display text-xl text-cream leading-tight">{film.title}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Icon name="Star" size={12} className="fill-gold text-gold" />
            <span className="text-gold font-body font-bold text-sm">{film.rating}</span>
          </div>
        </div>
        <div className="flex gap-1 flex-wrap mb-3">
          <span className="text-cream/40 text-xs font-body">{film.year}</span>
          <span className="text-cream/20 text-xs">·</span>
          <span className="text-cream/40 text-xs font-body">{film.duration}</span>
          {film.genre.slice(0, 1).map(g => (
            <span key={g} className="ml-1 text-xs border border-gold/20 text-gold/60 px-1.5 font-body">{g}</span>
          ))}
        </div>
        <div className="border-t border-gold/10 pt-3">
          <p className="text-cream/30 text-xs font-body uppercase tracking-wider mb-2">
            {userRating > 0 ? `Ваша оценка: ${userRating}/10` : "Оценить:"}
          </p>
          <div className="star-rating flex gap-0.5">
            {[...Array(10)].map((_, i) => {
              const starVal = i + 1;
              return (
                <span
                  key={i}
                  onMouseEnter={() => setHoverRating({ filmId: film.id, star: starVal })}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => onRate(film.id, starVal)}
                  className="text-lg leading-none select-none"
                  style={{ color: displayRating >= starVal ? '#C9A84C' : 'rgba(240,232,216,0.2)', cursor: 'pointer' }}
                >★</span>
              );
            })}
          </div>
        </div>
        <button onClick={onPlay} className="mt-3 w-full gold-gradient text-noir font-body font-semibold text-xs uppercase tracking-widest py-2.5 rounded-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
          <Icon name="Play" size={14} />
          Смотреть
        </button>
      </div>
    </div>
  );
}

// ===== GAMES =====
function GamesSection({ films }: { films: Film[] }) {
  const [game, setGame] = useState<"menu" | "quiz" | "guess" | "memory">("menu");
  const [quizState, setQuizState] = useState({ q: 0, score: 0, answered: false, chosen: -1 });
  const [guessState, setGuessState] = useState({ current: 0, guess: 5.0, revealed: false });
  const [memoryState, setMemoryState] = useState<{
    cards: { id: number; filmIdx: number; flipped: boolean; matched: boolean }[];
    firstCard: number | null;
    moves: number;
    won: boolean;
  }>({ cards: [], firstCard: null, moves: 0, won: false });

  const QUIZ = [
    { q: "Кто режиссёр «Тор: Рагнарёк»?", options: ["Джосс Уидон", "Тайка Вайтити", "Энтони Руссо", "Дж. Дж. Абрамс"], correct: 1 },
    { q: "Какой жанр у фильма «Малыш 2025»?", options: ["Комедия", "Фэнтези", "Криминал / Триллер", "Мультфильм"], correct: 2 },
    { q: "Сколько длится «Капитан Марвел 2»?", options: ["2ч 30мин", "1ч 45мин", "2ч 10мин", "3ч 00мин"], correct: 1 },
    { q: "Какой рейтинг у «Малыш 2025»?", options: ["7.6", "8.2", "9.1", "6.9"], correct: 2 },
    { q: "Кто режиссёр «Дюны» (2021)?", options: ["Нолан", "Вильнёв", "Финчер", "Скотт"], correct: 1 },
  ];

  const startMemory = () => {
    const pairs = films.slice(0, 4).flatMap((f, i) => [
      { id: i * 2, filmIdx: i, flipped: false, matched: false },
      { id: i * 2 + 1, filmIdx: i, flipped: false, matched: false },
    ]).sort(() => Math.random() - 0.5);
    setMemoryState({ cards: pairs, firstCard: null, moves: 0, won: false });
    setGame("memory");
  };

  const handleMemoryClick = (cardId: number) => {
    const ms = memoryState;
    if (ms.won) return;
    const card = ms.cards.find(c => c.id === cardId);
    if (!card || card.flipped || card.matched) return;
    const newCards = ms.cards.map(c => c.id === cardId ? { ...c, flipped: true } : c);
    if (ms.firstCard === null) {
      setMemoryState({ ...ms, cards: newCards, firstCard: cardId });
    } else {
      const first = ms.cards.find(c => c.id === ms.firstCard)!;
      const newMoves = ms.moves + 1;
      if (first.filmIdx === card.filmIdx) {
        const matched = newCards.map(c => c.filmIdx === card.filmIdx ? { ...c, matched: true } : c);
        setMemoryState({ cards: matched, firstCard: null, moves: newMoves, won: matched.every(c => c.matched) });
      } else {
        setMemoryState({ ...ms, cards: newCards, firstCard: cardId, moves: newMoves });
        setTimeout(() => {
          setMemoryState(prev => ({
            ...prev,
            cards: prev.cards.map(c =>
              (c.id === ms.firstCard || c.id === cardId) && !c.matched ? { ...c, flipped: false } : c
            ),
            firstCard: null,
          }));
        }, 900);
      }
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-6 py-16">
      <div className="mb-12">
        <p className="text-gold text-xs uppercase tracking-[0.4em] font-body mb-2">Развлечения</p>
        <h2 className="font-display text-5xl text-cream">Мини-игры</h2>
        <div className="w-12 h-px bg-gold mt-4" />
      </div>
      {game === "menu" && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { id: "quiz", icon: "HelpCircle", title: "Киновикторина", desc: "5 вопросов о фильмах каталога", color: "from-yellow-900/30" },
            { id: "guess", icon: "Eye", title: "Угадай рейтинг", desc: "Угадай оценку фильма до десятых", color: "from-blue-900/30" },
            { id: "memory", icon: "Grid3X3", title: "Мемори", desc: "Найди пары постеров", color: "from-purple-900/30" },
          ].map(g => (
            <button key={g.id} onClick={() => {
              if (g.id === "quiz") { setQuizState({ q: 0, score: 0, answered: false, chosen: -1 }); setGame("quiz"); }
              else if (g.id === "guess") { setGuessState({ current: 0, guess: 5.0, revealed: false }); setGame("guess"); }
              else startMemory();
            }} className={`glass glass-hover rounded-sm p-8 text-center bg-gradient-to-b ${g.color} to-transparent`}>
              <Icon name={g.icon} size={40} className="text-gold mx-auto mb-4" />
              <h3 className="font-display text-2xl text-cream mb-2">{g.title}</h3>
              <p className="text-cream/40 text-sm font-body">{g.desc}</p>
            </button>
          ))}
        </div>
      )}
      {game === "quiz" && (
        <div className="glass rounded-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-3xl text-cream">Киновикторина</h3>
            <button onClick={() => setGame("menu")} className="text-cream/40 hover:text-gold transition-colors text-sm font-body">← Назад</button>
          </div>
          {quizState.q >= QUIZ.length ? (
            <div className="text-center py-8">
              <div className="font-display text-7xl text-gold mb-4">{quizState.score}/{QUIZ.length}</div>
              <p className="text-cream font-display text-2xl mb-6">{quizState.score >= 4 ? "Превосходно! Вы настоящий киноман" : "Попробуйте ещё раз!"}</p>
              <button onClick={() => setQuizState({ q: 0, score: 0, answered: false, chosen: -1 })} className="gold-gradient text-noir font-body text-sm uppercase tracking-widest px-8 py-3 rounded-sm">Сыграть снова</button>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-cream/40 text-xs font-body mb-4">
                <span>Вопрос {quizState.q + 1} из {QUIZ.length}</span>
                <span>Счёт: {quizState.score}</span>
              </div>
              <div className="w-full bg-noir-3 h-1 mb-6 rounded">
                <div className="h-1 bg-gold rounded transition-all" style={{ width: `${(quizState.q / QUIZ.length) * 100}%` }} />
              </div>
              <p className="font-display text-2xl text-cream mb-6">{QUIZ[quizState.q].q}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {QUIZ[quizState.q].options.map((opt, i) => {
                  let cls = "border border-gold/20 text-cream/70 hover:border-gold/50 hover:text-cream";
                  if (quizState.answered) {
                    if (i === QUIZ[quizState.q].correct) cls = "border-2 border-green-500 bg-green-500/10 text-green-400";
                    else if (i === quizState.chosen) cls = "border-2 border-red-500 bg-red-500/10 text-red-400";
                    else cls = "border border-gold/10 text-cream/30";
                  }
                  return (
                    <button key={i} disabled={quizState.answered}
                      onClick={() => {
                        const correct = i === QUIZ[quizState.q].correct;
                        setQuizState(s => ({ ...s, answered: true, chosen: i, score: correct ? s.score + 1 : s.score }));
                        setTimeout(() => setQuizState(s => ({ ...s, q: s.q + 1, answered: false, chosen: -1 })), 1000);
                      }}
                      className={`p-4 rounded-sm font-body text-sm text-left transition-all ${cls}`}>{opt}</button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
      {game === "guess" && (
        <div className="glass rounded-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-3xl text-cream">Угадай рейтинг</h3>
            <button onClick={() => setGame("menu")} className="text-cream/40 hover:text-gold transition-colors text-sm font-body">← Назад</button>
          </div>
          {guessState.current >= films.length ? (
            <div className="text-center py-8">
              <Icon name="Trophy" size={48} className="text-gold mx-auto mb-4" />
              <p className="font-display text-3xl text-cream mb-4">Все фильмы угаданы!</p>
              <button onClick={() => setGuessState({ current: 0, guess: 5.0, revealed: false })} className="gold-gradient text-noir font-body text-sm uppercase tracking-widest px-8 py-3 rounded-sm">Сначала</button>
            </div>
          ) : (
            <div className="text-center">
              <img src={films[guessState.current].poster} alt="" className="w-40 h-56 object-cover rounded-sm mx-auto mb-6 border border-gold/20" />
              <h4 className="font-display text-3xl text-cream mb-2">{films[guessState.current].title}</h4>
              <p className="text-cream/40 font-body text-sm mb-6">{films[guessState.current].year}</p>
              {!guessState.revealed ? (
                <>
                  <div className="mb-2 text-gold font-display text-5xl">{guessState.guess.toFixed(1)}</div>
                  <input type="range" min={1} max={10} step={0.1} value={guessState.guess}
                    onChange={e => setGuessState(s => ({ ...s, guess: parseFloat(e.target.value) }))}
                    className="w-full max-w-xs mb-6 accent-yellow-500" /><br />
                  <button onClick={() => setGuessState(s => ({ ...s, revealed: true }))} className="gold-gradient text-noir font-body text-sm uppercase tracking-widest px-8 py-3 rounded-sm">Угадать</button>
                </>
              ) : (
                <div className="mt-4">
                  <div className="flex items-center justify-center gap-8 mb-6">
                    <div><div className="text-cream/50 text-xs font-body mb-1">Ваш ответ</div><div className="font-display text-4xl text-cream">{guessState.guess.toFixed(1)}</div></div>
                    <div className="text-gold/30 font-display text-3xl">vs</div>
                    <div><div className="text-cream/50 text-xs font-body mb-1">Реальный рейтинг</div><div className="font-display text-4xl text-gold">{films[guessState.current].rating}</div></div>
                  </div>
                  <p className="text-cream/60 font-body text-sm mb-4">Разница: {Math.abs(guessState.guess - films[guessState.current].rating).toFixed(1)} балла</p>
                  <button onClick={() => setGuessState({ current: guessState.current + 1, guess: 5.0, revealed: false })} className="border border-gold/30 text-gold font-body text-sm uppercase tracking-widest px-8 py-3 hover:bg-gold/10 transition-colors">Следующий</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {game === "memory" && (
        <div className="glass rounded-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <div><h3 className="font-display text-3xl text-cream">Мемори</h3><p className="text-cream/40 font-body text-sm">Ходов: {memoryState.moves}</p></div>
            <button onClick={() => setGame("menu")} className="text-cream/40 hover:text-gold transition-colors text-sm font-body">← Назад</button>
          </div>
          {memoryState.won ? (
            <div className="text-center py-8">
              <Icon name="Trophy" size={48} className="text-gold mx-auto mb-4" />
              <p className="font-display text-4xl text-cream mb-2">Победа!</p>
              <p className="text-gold font-body">{memoryState.moves} ходов</p>
              <button onClick={startMemory} className="mt-6 gold-gradient text-noir font-body text-sm uppercase tracking-widest px-8 py-3 rounded-sm">Сыграть ещё</button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
              {memoryState.cards.map(card => (
                <button key={card.id} onClick={() => handleMemoryClick(card.id)}
                  className={`rounded-sm overflow-hidden border-2 transition-all ${card.matched ? "border-gold opacity-60" : card.flipped ? "border-gold" : "border-gold/20 hover:border-gold/40"}`}
                  style={{ aspectRatio: '2/3' }}>
                  {(card.flipped || card.matched) ? (
                    <img src={films[card.filmIdx].poster} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full gold-gradient flex items-center justify-center">
                      <Icon name="Film" size={20} className="text-noir" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
