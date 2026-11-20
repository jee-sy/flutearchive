async function loadText(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Could not load ${url}`);
  }

  return response.text();
}

function parseMarkdownFile(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);

  if (!match) {
    return { data: {}, content: raw };
  }

  const data = {};

  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");

    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();

    if (key) data[key] = value;
  }

  return {
    data,
    content: marked.parse(match[2])
  };
}

function renderEvent(post) {
  return `
    <article class="post">
      <p class="post-date">${post.data.dateFormatted}</p>
      <h3 class="post-title">${post.data.title}</h3>
      <p class="post-venue">${post.data.venue}</p>
      <div class="post-body">${post.content}</div>
    </article>`;
}

function renderPracticeNote(post) {
  return `
    <article class="post">
      <div class="post-body">${post.content}</div>
    </article>`;
}

function formatDate(isoDate) {
  return new Date(isoDate + "T00:00:00").toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

async function loadPosts(indexFile, type) {
  const paths = await loadText(indexFile).then((text) => JSON.parse(text));
  const posts = [];

  for (const path of paths) {
    const file = await loadText(path);
    const post = parseMarkdownFile(file);

    if (post.data.date) {
      post.data.dateFormatted = formatDate(post.data.date);
      post.timestamp = new Date(post.data.date + "T00:00:00").getTime();
    }

    posts.push(post);
  }

  if (type === "event") {
    posts.sort((a, b) => b.timestamp - a.timestamp);
  } else {
    posts.sort((a, b) => b.timestamp - a.timestamp);
  }

  return posts;
}

async function init() {
  const aboutEl = document.getElementById("about-content");

  if (aboutEl) {
    const about = parseMarkdownFile(await loadText("about.md"));
    aboutEl.innerHTML = about.content;
  }

  const upcomingEl = document.getElementById("upcoming-events");
  const pastEl = document.getElementById("past-events");

  if (upcomingEl && pastEl) {
    const events = await loadPosts("events.json", "event");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events
      .filter((event) => event.timestamp >= today.getTime())
      .reverse();

    const past = events.filter(
      (event) => event.timestamp < today.getTime()
    );

    upcomingEl.innerHTML = upcoming.length
      ? upcoming.map(renderEvent).join("")
      : `<p class="empty">No upcoming events.</p>`;

    pastEl.innerHTML = past.length
      ? past.map(renderEvent).join("")
      : `<p class="empty">No past events yet.</p>`;
  }

  const notesEl = document.getElementById("practice-notes");

  if (notesEl) {
    const notes = await loadPosts("notes.json", "note");
    notesEl.innerHTML = notes.length
      ? notes.map(renderPracticeNote).join("")
      : `<p class="empty">No practice notes yet.</p>`;
  }
}

init();