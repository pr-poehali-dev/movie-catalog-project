import { useState, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { ALL_FILMS, type Film } from "@/data/films";

const UPLOAD_URL = "https://functions.poehali.dev/6b8c91a9-1883-47fd-9d3f-91c02e16308a";
const ADMIN_KEY = "cinemaxx-admin";

type Tab = "films" | "upload" | "add";

interface FilmOverride {
  poster?: string;
  videoUrl?: string;
  title?: string;
  description?: string;
  rating?: number;
  year?: number;
}

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState(false);

  const [tab, setTab] = useState<Tab>("films");
  const [search, setSearch] = useState("");
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [overrides, setOverrides] = useState<Record<number, FilmOverride>>({});

  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [videoInput, setVideoInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New film form
  const [newFilm, setNewFilm] = useState({
    title: "", year: new Date().getFullYear(), genre: "", duration: "",
    director: "", description: "", poster: "", videoUrl: "", rating: 7.0,
  });
  const [addSuccess, setAddSuccess] = useState(false);

  const handleLogin = () => {
    if (password === "admin2025") { setAuthed(true); setPwError(false); }
    else { setPwError(true); }
  };

  const films = ALL_FILMS.map(f => ({
    ...f,
    ...(overrides[f.id] || {}),
  }));

  const filtered = films.filter(f =>
    f.title.toLowerCase().includes(search.toLowerCase()) ||
    String(f.id).includes(search)
  );

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const uploadImage = useCallback(async (file: File) => {
    if (!selectedFilm) return;
    setUploadStatus("uploading");
    setUploadProgress(10);
    try {
      const data = await fileToBase64(file);
      setUploadProgress(50);
      const res = await fetch(UPLOAD_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
        body: JSON.stringify({ film_id: selectedFilm.id, type: "poster", data, mime: file.type }),
      });
      setUploadProgress(90);
      const json = await res.json();
      if (json.success) {
        setUploadedUrl(json.url);
        setOverrides(prev => ({
          ...prev,
          [selectedFilm.id]: { ...(prev[selectedFilm.id] || {}), poster: json.url },
        }));
        setUploadStatus("done");
      } else {
        setUploadStatus("error");
      }
    } catch {
      setUploadStatus("error");
    }
    setUploadProgress(100);
  }, [selectedFilm]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadImage(file);
  };

  const saveVideoUrl = () => {
    if (!selectedFilm || !videoInput.trim()) return;
    const url = videoInput.includes("youtube.com/watch?v=")
      ? videoInput.replace("watch?v=", "embed/").split("&")[0]
      : videoInput;
    setOverrides(prev => ({
      ...prev,
      [selectedFilm.id]: { ...(prev[selectedFilm.id] || {}), videoUrl: url },
    }));
    setVideoInput("");
    setUploadStatus("done");
    setUploadedUrl(url);
  };

  const handleAddFilm = () => {
    setAddSuccess(true);
    setTimeout(() => setAddSuccess(false), 3000);
    setNewFilm({ title: "", year: new Date().getFullYear(), genre: "", duration: "", director: "", description: "", poster: "", videoUrl: "", rating: 7.0 });
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <div className="glass rounded-sm p-10 w-full max-w-sm text-center">
          <div className="w-12 h-12 gold-gradient rounded-sm flex items-center justify-center mx-auto mb-6">
            <Icon name="Shield" size={24} className="text-noir" />
          </div>
          <h1 className="font-display text-4xl text-cream mb-2">Admin</h1>
          <p className="text-cream/40 font-body text-sm mb-8">Введите пароль для входа</p>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setPwError(false); }}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="Пароль"
            className={`w-full bg-noir-3 border ${pwError ? "border-red-500" : "border-gold/20"} text-cream font-body text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20 mb-3`}
          />
          {pwError && <p className="text-red-400 text-xs font-body mb-3">Неверный пароль</p>}
          <button onClick={handleLogin} className="w-full gold-gradient text-noir font-body font-semibold text-sm uppercase tracking-widest py-3 rounded-sm hover:opacity-90 transition-opacity">
            Войти
          </button>
          <a href="/" className="block mt-4 text-cream/30 hover:text-gold text-xs font-body transition-colors">← На сайт</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-noir font-body">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 glass border-b border-gold/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 gold-gradient rounded-sm flex items-center justify-center">
              <Icon name="Shield" size={16} className="text-noir" />
            </div>
            <span className="font-display text-2xl shimmer-text tracking-widest">CINEMAXX ADMIN</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-cream/30 text-xs hidden sm:block">{ALL_FILMS.length.toLocaleString()} фильмов в базе</span>
            <a href="/" className="text-cream/50 hover:text-gold text-sm transition-colors flex items-center gap-1">
              <Icon name="ExternalLink" size={14} />На сайт
            </a>
          </div>
        </div>
      </div>

      <div className="pt-16 max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-noir-2 p-1 rounded-sm w-fit border border-gold/10">
          {([
            { id: "films", icon: "Film", label: "Фильмы" },
            { id: "upload", icon: "Upload", label: "Загрузка" },
            { id: "add", icon: "Plus", label: "Добавить фильм" },
          ] as { id: Tab; icon: string; label: string }[]).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-body rounded-sm transition-all ${
                tab === t.id ? "gold-gradient text-noir font-semibold" : "text-cream/50 hover:text-cream"
              }`}>
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ===== TAB: FILMS ===== */}
        {tab === "films" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="font-display text-3xl text-cream">Каталог фильмов</h2>
              <div className="flex items-center gap-2 bg-noir-2 border border-gold/20 rounded-sm px-3 py-2 w-72">
                <Icon name="Search" size={15} className="text-gold/50" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск по названию или ID..."
                  className="bg-transparent text-cream text-sm focus:outline-none placeholder:text-cream/20 w-full" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.slice(0, 80).map(film => {
                const hasOverride = !!overrides[film.id];
                return (
                  <div key={film.id}
                    onClick={() => { setSelectedFilm(film); setTab("upload"); setUploadStatus("idle"); setUploadedUrl(""); setVideoInput(""); }}
                    className={`glass glass-hover rounded-sm p-3 cursor-pointer border-2 transition-all ${hasOverride ? "border-gold/50" : "border-transparent"}`}>
                    <div className="flex gap-3">
                      <img src={overrides[film.id]?.poster || film.poster} alt={film.title}
                        className="w-12 h-18 object-cover rounded-sm border border-gold/10 shrink-0" style={{ height: "4.5rem" }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <h3 className="font-display text-base text-cream leading-tight truncate">{film.title}</h3>
                          {hasOverride && <span className="shrink-0 text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded-sm">✓</span>}
                        </div>
                        <p className="text-cream/40 text-xs mt-0.5">{film.year} · ID: {film.id}</p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {film.genre.slice(0, 2).map(g => (
                            <span key={g} className="text-[10px] border border-gold/20 text-gold/60 px-1">{g}</span>
                          ))}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <Icon name="Star" size={10} className="fill-gold text-gold" />
                          <span className="text-gold text-xs font-bold">{film.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gold/10 flex gap-2 text-[10px] text-cream/40">
                      <span className="flex items-center gap-0.5"><Icon name="Image" size={10} />{overrides[film.id]?.poster ? "Постер загружен" : "Стандартный"}</span>
                      <span className="flex items-center gap-0.5"><Icon name="Play" size={10} />{overrides[film.id]?.videoUrl ? "Видео обновлено" : "По умолчанию"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length > 80 && (
              <p className="text-center text-cream/30 text-sm font-body mt-6">Показано 80 из {filtered.length}. Используйте поиск для уточнения.</p>
            )}
          </div>
        )}

        {/* ===== TAB: UPLOAD ===== */}
        {tab === "upload" && (
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl text-cream mb-6">Загрузка медиа</h2>

            {/* Film selector */}
            <div className="glass rounded-sm p-4 mb-6">
              <label className="text-cream/50 text-xs uppercase tracking-wider block mb-2">Выбранный фильм</label>
              {selectedFilm ? (
                <div className="flex items-center gap-4">
                  <img src={overrides[selectedFilm.id]?.poster || selectedFilm.poster} alt=""
                    className="w-12 h-18 object-cover rounded-sm border border-gold/20 shrink-0" style={{ height: "4.5rem" }} />
                  <div className="flex-1">
                    <p className="font-display text-xl text-cream">{selectedFilm.title}</p>
                    <p className="text-cream/40 text-sm">{selectedFilm.year} · ID: {selectedFilm.id}</p>
                  </div>
                  <button onClick={() => setSelectedFilm(null)} className="text-cream/30 hover:text-gold transition-colors">
                    <Icon name="X" size={18} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setTab("films")} className="border border-dashed border-gold/30 text-cream/50 hover:text-gold hover:border-gold/50 text-sm font-body px-4 py-3 rounded-sm w-full transition-all">
                  ← Выбрать фильм из каталога
                </button>
              )}
            </div>

            {selectedFilm && (
              <div className="space-y-6">
                {/* Poster upload */}
                <div className="glass rounded-sm p-6">
                  <h3 className="font-display text-2xl text-cream mb-4 flex items-center gap-2">
                    <Icon name="Image" size={20} className="text-gold" />Постер фильма
                  </h3>
                  <div
                    onDrop={handleDrop}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-sm p-10 text-center cursor-pointer transition-all ${
                      dragOver ? "border-gold bg-gold/5" : "border-gold/20 hover:border-gold/40 hover:bg-gold/5"
                    }`}
                  >
                    {uploadStatus === "uploading" ? (
                      <div>
                        <Icon name="Loader" size={36} className="text-gold mx-auto mb-3 animate-spin" />
                        <p className="text-cream font-body">Загружаю... {uploadProgress}%</p>
                        <div className="w-full bg-noir-3 h-1 mt-3 rounded">
                          <div className="h-1 bg-gold rounded transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    ) : uploadStatus === "done" && uploadedUrl && !uploadedUrl.includes("youtube") ? (
                      <div>
                        <img src={uploadedUrl} alt="Uploaded" className="w-24 h-36 object-cover rounded-sm mx-auto mb-3 border border-gold/30" />
                        <p className="text-green-400 font-body text-sm mb-2">✓ Загружено успешно</p>
                        <p className="text-cream/30 text-xs break-all">{uploadedUrl}</p>
                        <button onClick={e => { e.stopPropagation(); setUploadStatus("idle"); setUploadedUrl(""); }}
                          className="mt-3 text-xs border border-gold/20 text-cream/50 px-3 py-1 hover:text-gold hover:border-gold/40 transition-all">
                          Загрузить другой
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Icon name="Upload" size={36} className="text-gold/40 mx-auto mb-3" />
                        <p className="text-cream font-body mb-1">Перетащите изображение или кликните</p>
                        <p className="text-cream/40 text-sm">JPG, PNG, WEBP · до 10 МБ</p>
                        {uploadStatus === "error" && <p className="text-red-400 text-sm mt-2">Ошибка загрузки. Попробуйте ещё раз.</p>}
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])}
                    />
                  </div>
                </div>

                {/* Video URL */}
                <div className="glass rounded-sm p-6">
                  <h3 className="font-display text-2xl text-cream mb-4 flex items-center gap-2">
                    <Icon name="Play" size={20} className="text-gold" />Ссылка на видео
                  </h3>
                  <p className="text-cream/40 text-sm font-body mb-4">Вставьте ссылку на YouTube (обычную или embed). Обычная ссылка конвертируется автоматически.</p>
                  {overrides[selectedFilm.id]?.videoUrl && (
                    <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-sm">
                      <p className="text-green-400 text-sm font-body">✓ Текущее видео: {overrides[selectedFilm.id].videoUrl}</p>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <input
                      value={videoInput}
                      onChange={e => setVideoInput(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="flex-1 bg-noir-3 border border-gold/20 text-cream text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20"
                    />
                    <button onClick={saveVideoUrl} disabled={!videoInput.trim()}
                      className="gold-gradient text-noir font-semibold text-sm px-6 py-3 rounded-sm disabled:opacity-40 hover:opacity-90 transition-opacity">
                      Сохранить
                    </button>
                  </div>

                  {/* Preview iframe */}
                  {(overrides[selectedFilm.id]?.videoUrl || selectedFilm.videoUrl) && (
                    <div className="mt-4 aspect-video rounded-sm overflow-hidden border border-gold/20">
                      <iframe
                        src={overrides[selectedFilm.id]?.videoUrl || selectedFilm.videoUrl}
                        className="w-full h-full"
                        allowFullScreen
                        title="preview"
                      />
                    </div>
                  )}
                </div>

                {/* Edit metadata */}
                <div className="glass rounded-sm p-6">
                  <h3 className="font-display text-2xl text-cream mb-4 flex items-center gap-2">
                    <Icon name="FileEdit" size={20} className="text-gold" />Редактировать данные
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: "title", label: "Название", type: "text", value: overrides[selectedFilm.id]?.title ?? selectedFilm.title },
                      { key: "year", label: "Год", type: "number", value: overrides[selectedFilm.id]?.year ?? selectedFilm.year },
                      { key: "rating", label: "Рейтинг", type: "number", value: overrides[selectedFilm.id]?.rating ?? selectedFilm.rating },
                    ].map(field => (
                      <div key={field.key}>
                        <label className="text-cream/50 text-xs uppercase tracking-wider block mb-1">{field.label}</label>
                        <input
                          type={field.type}
                          value={field.value}
                          step={field.key === "rating" ? "0.1" : "1"}
                          onChange={e => setOverrides(prev => ({
                            ...prev,
                            [selectedFilm.id]: {
                              ...(prev[selectedFilm.id] || {}),
                              [field.key]: field.type === "number" ? parseFloat(e.target.value) : e.target.value,
                            }
                          }))}
                          className="w-full bg-noir-3 border border-gold/20 text-cream text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50"
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label className="text-cream/50 text-xs uppercase tracking-wider block mb-1">Описание</label>
                      <textarea
                        rows={3}
                        value={overrides[selectedFilm.id]?.description ?? selectedFilm.description}
                        onChange={e => setOverrides(prev => ({
                          ...prev,
                          [selectedFilm.id]: { ...(prev[selectedFilm.id] || {}), description: e.target.value }
                        }))}
                        className="w-full bg-noir-3 border border-gold/20 text-cream text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 resize-none"
                      />
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gold/5 border border-gold/20 rounded-sm">
                    <p className="text-cream/50 text-xs font-body">
                      <Icon name="Info" size={12} className="inline mr-1 text-gold" />
                      Изменения применяются в рамках сессии. Для постоянного хранения подключите базу данных.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== TAB: ADD FILM ===== */}
        {tab === "add" && (
          <div className="max-w-3xl">
            <h2 className="font-display text-3xl text-cream mb-6">Добавить новый фильм</h2>
            {addSuccess && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-sm flex items-center gap-3">
                <Icon name="CheckCircle" size={20} className="text-green-400" />
                <p className="text-green-400 font-body">Фильм добавлен в очередь. Для постоянного хранения подключите базу данных.</p>
              </div>
            )}
            <div className="glass rounded-sm p-8 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "title", label: "Название*", type: "text", placeholder: "Название фильма" },
                  { key: "director", label: "Режиссёр*", type: "text", placeholder: "Имя режиссёра" },
                  { key: "year", label: "Год", type: "number", placeholder: "2025" },
                  { key: "duration", label: "Продолжительность", type: "text", placeholder: "2ч 10мин" },
                  { key: "genre", label: "Жанр", type: "text", placeholder: "Боевик, Драма" },
                  { key: "rating", label: "Рейтинг", type: "number", placeholder: "7.5" },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-cream/50 text-xs uppercase tracking-wider block mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      step={field.key === "rating" ? "0.1" : undefined}
                      value={(newFilm as Record<string, string | number>)[field.key]}
                      onChange={e => setNewFilm(prev => ({
                        ...prev,
                        [field.key]: field.type === "number" ? parseFloat(e.target.value) : e.target.value
                      }))}
                      placeholder={field.placeholder}
                      className="w-full bg-noir-3 border border-gold/20 text-cream text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-cream/50 text-xs uppercase tracking-wider block mb-1">Описание</label>
                <textarea rows={3} value={newFilm.description}
                  onChange={e => setNewFilm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткое описание сюжета..."
                  className="w-full bg-noir-3 border border-gold/20 text-cream text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 resize-none placeholder:text-cream/20"
                />
              </div>
              <div>
                <label className="text-cream/50 text-xs uppercase tracking-wider block mb-1">URL постера</label>
                <input value={newFilm.poster} onChange={e => setNewFilm(prev => ({ ...prev, poster: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-noir-3 border border-gold/20 text-cream text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20" />
              </div>
              <div>
                <label className="text-cream/50 text-xs uppercase tracking-wider block mb-1">YouTube ссылка</label>
                <input value={newFilm.videoUrl} onChange={e => setNewFilm(prev => ({ ...prev, videoUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-noir-3 border border-gold/20 text-cream text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-gold/50 placeholder:text-cream/20" />
              </div>

              {/* Preview */}
              {newFilm.poster && (
                <div className="p-4 bg-noir-3 border border-gold/10 rounded-sm flex gap-4">
                  <img src={newFilm.poster} alt="preview" className="w-16 h-24 object-cover rounded-sm border border-gold/20" />
                  <div>
                    <p className="font-display text-xl text-cream">{newFilm.title || "Название фильма"}</p>
                    <p className="text-cream/40 text-sm">{newFilm.year} · {newFilm.director || "Режиссёр"}</p>
                    <p className="text-gold text-sm">{newFilm.rating} ★</p>
                  </div>
                </div>
              )}

              <button
                onClick={handleAddFilm}
                disabled={!newFilm.title || !newFilm.director}
                className="w-full gold-gradient text-noir font-body font-semibold text-sm uppercase tracking-widest py-3 rounded-sm disabled:opacity-40 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Icon name="Plus" size={16} />
                Добавить фильм
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
