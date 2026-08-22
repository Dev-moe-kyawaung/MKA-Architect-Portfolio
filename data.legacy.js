/* ===== Dynamic data fetching (GitHub API) ===== */
(function () {
  const USERS = ['Dev-moe-kyawaung', 'moekyawaung-tech', 'Moekyawaung-cyber', 'Moekyawaung'];
  const CACHE_KEY = 'mka-gh-cache-v1';
  const CACHE_TTL_MS = 15 * 60 * 1000; // 15 min

  const FALLBACK_REPOS = [
    { name: 'video-player', description: 'Media architecture with offline cache', html_url: 'https://github.com/moekyawaung-tech/video-player', language: 'Kotlin', stargazers_count: 0, topics: ['compose', 'exoplayer'] },
    { name: 'social-dashboard', description: 'Real-time feed & analytics', html_url: 'https://github.com/moekyawaung-tech/social-dashboard', language: 'Kotlin', stargazers_count: 0, topics: ['firebase', 'mvvm'] },
    { name: 'POS-Ultimate-Pro-Max', description: 'Enterprise offline-first POS', html_url: 'https://github.com/moekyawaung-tech/POS-Ultimate-Pro-Max', language: 'Kotlin', stargazers_count: 0, topics: ['room', 'sync'] },
    { name: 'game-collection', description: 'Multi-game modular hub', html_url: 'https://github.com/moekyawaung-tech/game-collection', language: 'Kotlin', stargazers_count: 0, topics: ['multi-module'] },
    { name: 'Weather-app', description: 'API + caching patterns', html_url: 'https://github.com/moekyawaung-tech/Weather-app', language: 'Kotlin', stargazers_count: 0, topics: ['retrofit', 'flow'] },
    { name: 'Job-Portal-App', description: 'Full listing & apply flow', html_url: 'https://github.com/moekyawaung-tech/Job-Portal-App', language: 'Kotlin', stargazers_count: 0, topics: ['clean-arch'] }
  ];

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
      return parsed.data;
    } catch {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch { /* quota */ }
  }

  async function fetchJson(url) {
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.json();
  }

  async function fetchUser(username) {
    return fetchJson(`https://api.github.com/users/${username}`);
  }

  async function fetchRepos(username, perPage = 30) {
    return fetchJson(
      `https://api.github.com/users/${username}/repos?per_page=${perPage}&sort=updated&type=owner`
    );
  }

  function mergeUsers(users) {
    let publicRepos = 0;
    let followers = 0;
    let following = 0;
    const primary = users.find(u => u && u.login === 'Dev-moe-kyawaung') || users[0] || {};
    users.forEach(u => {
      if (!u) return;
      publicRepos += u.public_repos || 0;
      followers += u.followers || 0;
      following += u.following || 0;
    });
    return {
      login: primary.login || 'Dev-moe-kyawaung',
      name: primary.name || 'Moe Kyaw Aung',
      bio: primary.bio || '',
      avatar_url: primary.avatar_url || '',
      html_url: primary.html_url || 'https://github.com/Dev-moe-kyawaung',
      public_repos: publicRepos,
      followers,
      following,
      blog: primary.blog || '',
      location: primary.location || 'Tachileik, Myanmar'
    };
  }

  function normalizeRepos(lists) {
    const map = new Map();
    lists.flat().forEach(r => {
      if (!r || r.fork) return;
      const key = r.full_name || r.name;
      if (!map.has(key) || (r.stargazers_count || 0) > (map.get(key).stargazers_count || 0)) {
        map.set(key, r);
      }
    });
    return Array.from(map.values())
      .sort((a, b) => {
        const stars = (b.stargazers_count || 0) - (a.stargazers_count || 0);
        if (stars !== 0) return stars;
        return new Date(b.updated_at || 0) - new Date(a.updated_at || 0);
      });
  }

  function pickFeatured(repos, limit = 12) {
    const keywords = /android|kotlin|compose|pos|weather|video|game|job|social|portfolio|pwa|player/i;
    const scored = repos.map(r => {
      let score = (r.stargazers_count || 0) * 3;
      if (keywords.test(r.name || '')) score += 10;
      if (keywords.test(r.description || '')) score += 5;
      if (r.language === 'Kotlin' || r.language === 'Java') score += 4;
      return { r, score };
    });
    scored.sort((a, b) => b.score - a.score);
    const picked = scored.slice(0, limit).map(x => x.r);
    return picked.length ? picked : FALLBACK_REPOS;
  }

  function tagFromRepo(r) {
    const tags = [];
    if (r.language) tags.push(r.language);
    const topics = r.topics || [];
    topics.slice(0, 2).forEach(t => tags.push(t));
    if (!tags.length && r.name) {
      if (/compose/i.test(r.name)) tags.push('Compose');
      if (/pos/i.test(r.name)) tags.push('POS');
    }
    return tags.slice(0, 3);
  }

  function renderProjects(repos) {
    const grid = document.querySelector('#projects .grid-auto') || document.getElementById('projectsGrid');
    if (!grid) return;

    const featured = pickFeatured(repos, 12);
    grid.innerHTML = featured.map(r => {
      const desc = (r.description || 'Android / mobile project').slice(0, 90);
      const tags = tagFromRepo(r)
        .map(t => `<span class="tag">${escapeHtml(t)}</span>`)
        .join('');
      const stars = r.stargazers_count ? ` · ★ ${r.stargazers_count}` : '';
      return `
        <a href="${escapeHtml(r.html_url)}" target="_blank" rel="noopener" class="project-card glass">
          <h3>${escapeHtml(r.name)}${stars ? `<span class="repo-stars">${stars}</span>` : ''}</h3>
          <p>${escapeHtml(desc)}</p>
          <div class="tags">${tags || '<span class="tag">GitHub</span>'}</div>
        </a>`;
    }).join('');
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function updateStats(profile, repoCount) {
    // Map: Years stays static-ish; Certs static; Projects from API; Socials/followers dynamic
    const projectsEl = document.querySelector('.hero-stats .stat-card:nth-child(3) .stat-n');
    const socialsEl = document.querySelector('.hero-stats .stat-card:nth-child(4) .stat-n');

    if (projectsEl) {
      const n = Math.max(repoCount || profile.public_repos || 0, 1);
      projectsEl.dataset.count = String(n);
      animateNumber(projectsEl, n);
    }
    if (socialsEl && profile.followers != null) {
      // show followers as live social signal, keep label if present
      const label = socialsEl.parentElement?.querySelector('.stat-l');
      if (label && /social/i.test(label.textContent || '')) {
        // keep "Socials" or switch to Followers
        // label.textContent = 'Followers';
      }
      // Optional: don't overwrite socials count with followers if you prefer static 16
      // socialsEl.dataset.count = String(profile.followers);
      // animateNumber(socialsEl, profile.followers);
    }

    // Live status chip
    const status = document.getElementById('liveStatus');
    if (status) {
      status.textContent = `GitHub · ${profile.public_repos || repoCount} repos · ${profile.followers || 0} followers`;
      status.classList.add('live');
    }

    // Avatar from GitHub if available
    const avatar = document.querySelector('.avatar-main img, img.avatar-main');
    if (avatar && profile.avatar_url) {
      // keep Cloudinary avatar as primary brand image; optional swap:
      // avatar.src = profile.avatar_url;
    }
  }

  function animateNumber(el, target) {
    const t = Math.max(0, +target || 0);
    let c = 0;
    const step = Math.max(1, Math.floor(t / 30));
    const id = setInterval(() => {
      c += step;
      if (c >= t) {
        el.textContent = t + (t >= 10 ? '+' : '');
        clearInterval(id);
      } else {
        el.textContent = String(c);
      }
    }, 30);
  }

  function setFetchState(state, message) {
    const el = document.getElementById('fetchStatus');
    if (!el) return;
    el.dataset.state = state;
    el.textContent = message || '';
  }

  async function loadDynamicData() {
    setFetchState('loading', 'Syncing GitHub…');

    const cached = readCache();
    if (cached) {
      updateStats(cached.profile, cached.repos.length);
      renderProjects(cached.repos);
      setFetchState('cached', 'GitHub data (cached)');
    }

    try {
      const userResults = await Promise.allSettled(USERS.map(fetchUser));
      const users = userResults
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      if (!users.length) throw new Error('No user profiles returned');

      const profile = mergeUsers(users);

      const repoResults = await Promise.allSettled(
        USERS.map(u => fetchRepos(u, 40))
      );
      const repoLists = repoResults
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
      const repos = normalizeRepos(repoLists);

      writeCache({ profile, repos });
      updateStats(profile, repos.length);
      renderProjects(repos.length ? repos : FALLBACK_REPOS);
      setFetchState('ok', `Live · ${repos.length} repos across ${users.length} accounts`);
    } catch (err) {
      console.warn('[MKA data]', err);
      if (!cached) {
        renderProjects(FALLBACK_REPOS);
        setFetchState('error', 'Offline · showing curated projects');
      } else {
        setFetchState('cached', 'Network error · using cache');
      }
    }
  }

  // Expose for AI / debugging
  window.MKAData = { loadDynamicData, readCache, USERS };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicData);
  } else {
    loadDynamicData();
  }
})();
