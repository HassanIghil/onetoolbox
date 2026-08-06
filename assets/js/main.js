/**
 * OneToolBox Core Application Logic
 * Fast, lightweight vanilla JS for dark mode, search modal, and UI notifications.
 */

(function () {
  'use strict';

  // --- Dark Mode Management ---
  const THEME_KEY = 'onetoolbox_theme';
  
  function getPreferredTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeIcon(theme);
  }

  function updateThemeIcon(theme) {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return;
    if (theme === 'dark') {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to Light Mode');
    } else {
      btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
      btn.setAttribute('aria-label', 'Switch to Dark Mode');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
    updateThemeIcon(currentTheme);
    
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const nextTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
      });
    }

    // --- Mobile Menu Toggle ---
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileBtn && mobileNav) {
      mobileBtn.addEventListener('click', () => {
        mobileNav.classList.toggle('open');
      });
    }

    // --- FAQ Accordion Toggle ---
    initFaqAccordion();

    // --- Search Modal (CTRL + K) ---
    initSearchModal();
  });

  // --- FAQ Accordion ---
  function initFaqAccordion() {
    document.querySelectorAll('.faq-question').forEach(btn => {
      const answer = btn.nextElementSibling;
      if (!answer) return;

      // Start collapsed
      answer.style.maxHeight = '0';
      answer.style.overflow = 'hidden';
      answer.style.transition = 'max-height 200ms ease, padding 200ms ease';
      answer.style.paddingTop = '0';
      answer.style.paddingBottom = '0';

      btn.setAttribute('aria-expanded', 'false');

      // Add chevron indicator
      const chevron = document.createElement('span');
      chevron.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
      chevron.style.transition = 'transform 200ms ease';
      chevron.style.flexShrink = '0';
      btn.appendChild(chevron);

      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';

        // Close all other FAQ items in same list
        const parentList = btn.closest('.faq-list');
        if (parentList) {
          parentList.querySelectorAll('.faq-question').forEach(otherBtn => {
            if (otherBtn !== btn) {
              otherBtn.setAttribute('aria-expanded', 'false');
              const otherAnswer = otherBtn.nextElementSibling;
              const otherChevron = otherBtn.querySelector('span:last-child');
              if (otherAnswer) {
                otherAnswer.style.maxHeight = '0';
                otherAnswer.style.paddingTop = '0';
                otherAnswer.style.paddingBottom = '0';
              }
              if (otherChevron) otherChevron.style.transform = 'rotate(0deg)';
            }
          });
        }

        if (isOpen) {
          btn.setAttribute('aria-expanded', 'false');
          answer.style.maxHeight = '0';
          answer.style.paddingTop = '0';
          answer.style.paddingBottom = '0';
          chevron.style.transform = 'rotate(0deg)';
        } else {
          btn.setAttribute('aria-expanded', 'true');
          answer.style.paddingTop = '';
          answer.style.paddingBottom = '';
          answer.style.maxHeight = answer.scrollHeight + 40 + 'px';
          chevron.style.transform = 'rotate(180deg)';
        }
      });
    });
  }

  // --- Toast Notification Helper ---
  window.OneToolBox = window.OneToolBox || {};

  window.OneToolBox.toast = function (message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 200ms ease';
      setTimeout(() => toast.remove(), 200);
    }, 2500);
  };

  // --- Search Modal Implementation ---
  let toolsDataCache = null;

  async function fetchToolsCache() {
    if (toolsDataCache) return toolsDataCache;
    try {
      const res = await fetch('/tools.json');
      toolsDataCache = await res.json();
      return toolsDataCache;
    } catch (e) {
      console.error('Failed to load tools database:', e);
      return [];
    }
  }

  function initSearchModal() {
    const backdrop = document.getElementById('search-modal-backdrop');
    const input = document.getElementById('search-modal-input');
    const resultsContainer = document.getElementById('search-results-list');
    const searchBtns = document.querySelectorAll('.trigger-search');

    if (!backdrop || !input || !resultsContainer) return;

    function openModal() {
      backdrop.classList.add('open');
      input.value = '';
      input.focus();
      renderSearchResults('');
      fetchToolsCache(); // Pre-load tools
    }

    function closeModal() {
      backdrop.classList.remove('open');
    }

    searchBtns.forEach(btn => btn.addEventListener('click', openModal));

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });

    let selectedIndex = -1;

    function updateSelection() {
      const items = resultsContainer.querySelectorAll('.search-result-item');
      items.forEach((item, i) => {
        item.classList.toggle('selected', i === selectedIndex);
      });
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (backdrop.classList.contains('open')) {
          closeModal();
        } else {
          openModal();
        }
      } else if (e.key === 'Escape' && backdrop.classList.contains('open')) {
        closeModal();
      } else if (backdrop.classList.contains('open')) {
        const items = resultsContainer.querySelectorAll('.search-result-item');
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
          updateSelection();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIndex = Math.max(selectedIndex - 1, 0);
          updateSelection();
        } else if (e.key === 'Enter' && selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          const link = items[selectedIndex].querySelector('a');
          if (link) link.click();
        }
      }
    });

    input.addEventListener('input', (e) => {
      selectedIndex = -1;
      renderSearchResults(e.target.value);
    });

    async function renderSearchResults(query) {
      const tools = await fetchToolsCache();
      const q = query.trim().toLowerCase();
      
      const filtered = q === '' 
        ? tools.slice(0, 6) 
        : tools.filter(t => 
            t.name.toLowerCase().includes(q) || 
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
          );

      if (filtered.length === 0) {
        resultsContainer.innerHTML = `<li style="padding: 24px; text-align: center; color: var(--text-muted);">No tools found matching "${query}"</li>`;
        return;
      }

      resultsContainer.innerHTML = filtered.map(t => `
        <li class="search-result-item">
          <a href="${t.url}">
            <div class="tool-icon">${t.icon}</div>
            <div class="search-result-info">
              <div class="search-result-title">${t.name}</div>
              <div class="search-result-desc">${t.description}</div>
            </div>
            <span class="badge badge-muted">${t.categoryName}</span>
          </a>
        </li>
      `).join('');
    }
  }

})();
