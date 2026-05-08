// Lighthouse CI thresholds.
// SEO threshold is high (0.95) — this app lives and dies on Google ranking
// for German tax keywords. Accessibility is also high because tax tools
// must be usable by everyone, including screen reader users.
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance':    ['warn', { minScore: 0.80 }],
        'categories:accessibility':  ['error', { minScore: 0.90 }],
        'categories:best-practices': ['warn', { minScore: 0.90 }],
        'categories:seo':            ['error', { minScore: 0.95 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};