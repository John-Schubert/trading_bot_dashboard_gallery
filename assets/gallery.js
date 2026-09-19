async function main() {
  const res = await fetch('manifest.json');
  const manifest = await res.json();

  if (manifest.title) {
    document.getElementById('page-title').textContent = manifest.title;
    document.title = manifest.title;
  }

  const viewOrder = manifest.views || [];
  const timeline = document.getElementById('timeline');
  const entries = [...manifest.entries].reverse(); // newest first

  entries.forEach((entry, i) => {
    const section = document.createElement('section');
    section.className = 'entry';

    const heading = document.createElement('h2');
    const dateLabel = formatDate(entry.date);
    heading.textContent = dateLabel;
    if (i === 0) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Latest';
      heading.appendChild(badge);
    }
    section.appendChild(heading);

    if (entry.note) {
      const note = document.createElement('p');
      note.className = 'note';
      note.textContent = entry.note;
      section.appendChild(note);
    }

    const grid = document.createElement('div');
    grid.className = 'thumb-grid';

    viewOrder.forEach(view => {
      const filename = entry.images && entry.images[view.key];
      if (!filename) return;

      const figure = document.createElement('figure');
      const img = document.createElement('img');
      img.src = `snapshots/${entry.folder}/${filename}`;
      img.alt = `${view.label} — ${dateLabel}`;
      img.loading = 'lazy';
      img.addEventListener('click', () => openLightbox(img.src, `${view.label} — ${dateLabel}`));

      const caption = document.createElement('figcaption');
      caption.textContent = view.label;

      figure.appendChild(img);
      figure.appendChild(caption);
      grid.appendChild(figure);
    });

    section.appendChild(grid);
    timeline.appendChild(section);
  });
}

function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
}

function openLightbox(src, caption) {
  const lightbox = document.getElementById('lightbox');
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = caption;
  lightbox.hidden = false;
}

function closeLightbox() {
  document.getElementById('lightbox').hidden = true;
}

document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
document.getElementById('lightbox')?.addEventListener('click', (e) => {
  if (e.target.id === 'lightbox') closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

main();
