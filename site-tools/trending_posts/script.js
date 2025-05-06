const client = new dhive.Client([
  "https://api.hive.blog",
  "https://api.hivekings.com",
  "https://anyx.io",
]);

// Number of tags and posts to fetch
const TAG_LIMIT = 9;
const POSTS_LIMIT = 6;

async function loadTrending() {
  const feed = document.getElementById("feed");
  feed.textContent = "Loading...";
  try {
    // Fetch top trending tags (start from empty string, then limit)
    const tags = await client.database.call("get_trending_tags", [
      "",
      TAG_LIMIT,
    ]);
    feed.textContent = "";
    // For each tag, fetch top posts
    for (const tagEntry of tags) {
      const tagName = tagEntry.name || tagEntry[0];
      // Fetch top posts for this tag
      const posts = await client.database.call("get_discussions_by_hot", [
        { tag: tagName, limit: POSTS_LIMIT },
      ]);
      // Build card container
      const card = document.createElement("div");
      card.className = "card";
      const h2 = document.createElement("h2");
      h2.textContent = `#${tagName}`;
      card.appendChild(h2);
      const ul = document.createElement("ul");
      for (const post of posts) {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = `https://peakd.com/@${post.author}/${post.permlink}`;
        a.textContent = post.title;
        a.target = "_blank";
        li.appendChild(a);
        const payout = document.createElement("span");
        payout.className = "payout";
        payout.textContent = `by @${post.author} — ${post.pending_payout_value}`;
        li.appendChild(payout);
        ul.appendChild(li);
      }
      card.appendChild(ul);
      feed.appendChild(card);
    }
  } catch (err) {
    console.error(err);
    feed.textContent = "Error loading trending tags/posts.";
  }
}

document.addEventListener("DOMContentLoaded", loadTrending);
