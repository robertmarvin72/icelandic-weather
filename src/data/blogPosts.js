export const blogPosts = [
  {
    id: "1",
    slug: "is-it-safe-to-drive-a-camper-in-iceland-wind",
    title: "Is It Safe to Drive a Camper in Iceland Wind?",
    ctaHint: "Helps you decide: Is it safe to drive in wind",
    excerpt:
      "Strong wind and gusts can change camper travel plans quickly in Iceland. Here is what to watch and when to rethink the route.",
    publishedAt: "2026-04-03",
    coverImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    content: [
      {
        type: "paragraph",
        text: "Driving a camper in Iceland can feel completely fine one hour and much less funny the next. Wind is often the biggest factor, especially on open roads, bridges, and exposed coastal stretches.",
      },
      {
        type: "heading",
        text: "Why wind matters so much",
      },
      {
        type: "paragraph",
        text: "A camper has a taller profile than a normal car, which means gusts can push it around more easily. Even when the average wind does not look extreme, stronger gusts can still make driving uncomfortable or unsafe.",
      },
      {
        type: "paragraph",
        text: "That is why it helps to look beyond a simple daily forecast and think about where conditions may be calmer nearby.",
      },
      {
        type: "heading",
        text: "What to watch before driving",
      },
      {
        type: "paragraph",
        text: "Pay attention to forecast wind speed, gusts, precipitation, and whether the route is especially exposed. If conditions look rough, it may be smarter to delay departure or choose a campsite in a more sheltered area.",
      },
      {
        type: "heading",
        text: "A more practical way to plan",
      },
      {
        type: "paragraph",
        text: "CampCast helps compare nearby campsite conditions so you can make a more informed decision about whether to stay put or move somewhere with better weather.",
      },
    ],
  },
  {
    id: "2",
    slug: "where-to-camp-in-iceland-to-avoid-bad-weather",
    title: "Where to Camp in Iceland to Avoid Bad Weather",
    ctaHint: "Helps you decide: Where to stay for better weather",
    excerpt:
      "Some weather windows are better than others. Planning where to stay can make a big difference when wind and rain move in.",
    publishedAt: "2026-04-03",
    coverImage:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    content: [
      {
        type: "paragraph",
        text: "Bad weather in Iceland does not always hit every area equally. One region can be wet and windy while another is noticeably calmer.",
      },
      {
        type: "heading",
        text: "Think in regions, not just one point",
      },
      {
        type: "paragraph",
        text: "If you only check one forecast, it is easy to assume the whole area will feel the same. In reality, nearby campsites can offer a much better experience depending on wind exposure, rain, and local shelter.",
      },
      {
        type: "paragraph",
        text: "This is especially useful for campers who have some flexibility and want to avoid a miserable evening fighting the tent, awning, or van door.",
      },
      {
        type: "heading",
        text: "What makes a better campsite day",
      },
      {
        type: "paragraph",
        text: "Lower wind, fewer strong gusts, and less rain usually matter more than chasing perfect sunshine. A calmer campsite often beats a dramatic view with side effects.",
      },
    ],
  },
  {
    id: "3",
    slug: "best-campsites-in-iceland-this-week-based-on-weather",
    title: "Best Campsites in Iceland This Week Based on Weather",
    ctaHint: "Helps you decide: Where conditions are best this week",
    excerpt:
      "A practical way to think about campsite choices when the forecast shifts across regions during the week.",
    publishedAt: "2026-04-03",
    coverImage: "",
    content: [
      {
        type: "paragraph",
        text: "A good campsite choice this week depends less on a fixed top ten list and more on what the weather is doing right now. Conditions shift quickly, and the best option can change from one day to the next.",
      },
      {
        type: "heading",
        text: "The useful question",
      },
      {
        type: "paragraph",
        text: "Instead of asking for the best campsite overall, a more useful question is this: where are conditions likely to be better nearby during the days I care about?",
      },
      {
        type: "paragraph",
        text: "That is the kind of decision support CampCast is built for.",
      },
    ],
  },
];

export function getBlogPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug) || null;
}
