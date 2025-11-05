import geminiService from "../services/geminiService.js";
import movieService from "../services/movieService.js";
import sitemapService from "../services/sitemapService.js";

const handleChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const systemPrompt = `
You are CinemaHall's AI assistant., a friendly assistant for the CinemaHall movie reservation site.
Your goals:
1. Help users navigate the site (register, login, browse movies, etc.).
2. Help users find movies currently in theaters from the site database.
3. If a movie is also on TMDB, use TMDB data to give rich info (summary, cast, release date, etc.).
4. If needed, you can call functions like getSiteMap() or getMoviesInTheaters().
Always be conversational and helpful.

Your only source of truth about movies, showtimes, and availability is the CinemaHall database. 
Do NOT use external information such as TMDB or public release dates.

If a user asks about whether a movie is in theaters, check the 'inTheaters' property in the provided data.
If 'inTheaters' is true, it means the movie is currently playing at CinemaHall and tickets can be booked.
If it is false, it is not showing, regardless of any outside knowledge.

If no data is available in the CinemaHall database, respond:
"I don’t have that movie in CinemaHall’s database."

Never use or reference TMDB or real-world movie releases.
`;

    // Define callable backend functions for Gemini
    const functions = [
      {
        name: "getSiteMap",
        description: "Provides sitemap links like register, login, home, etc.",
        parameters: {},
      },
      {
        name: "getAdminSiteMap",
        description:
          "Provides sitemap links for admin users (dashboard, manage movies, etc.)",
        parameters: {},
      },
      {
        name: "getMoviesInTheaters",
        description:
          "Gets list of movies currently in theaters from the database",
        parameters: {},
      },
      {
        name: "getMovieDetails",
        description:
          "Get movie details by title, includes TMDB info if available",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
          },
          required: ["title"],
        },
      },
    ];

    // Send conversation to Gemini
    const messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ];

    const aiResponse = await geminiService.getChatCompletionWithFunctions(
      messages,
      functions
    );

    // If Gemini asks to call a function, handle it
    if (aiResponse.function_call) {
      const { name, arguments: args } = aiResponse.function_call;
      let result;

      switch (name) {
        case "getSiteMap":
          result = await sitemapService.getSiteMap();
          result = {
            note: "These are verified user navigation links from CinemaHall.",
            data: result,
          };
          break;

        case "getAdminSiteMap":
          result = await sitemapService.getAdminSiteMap();
          result = {
            note: "These are verified admin navigation links from CinemaHall.",
            data: result,
          };
          break;

        case "getMoviesInTheaters":
          result = await movieService.getMoviesInTheaters();
          result = {
            note: "These are the verified movies currently showing in CinemaHall from the internal database. Ignore any external sources or public release info.",
            movies: result,
          };
          break;

        case "getMovieDetails":
          result = await movieService.getMovieDetails(args.title);
          result = {
            note: "These are verified movie details from the CinemaHall database. Only use this information to answer user queries.",
            movie: result,
          };
          break;

        default:
          result = { error: "Unknown function" };
      }

      // Send the function result back to Gemini for a final, contextual response
      const followUpMessages = [
        ...messages,
        aiResponse,
        { role: "function", name, content: JSON.stringify(result) },
      ];

      const finalResponse = await geminiService.getChatCompletion(
        followUpMessages
      );

      return res.json({ reply: finalResponse.content });
    }

    res.json({ reply: aiResponse.content });
  } catch (err) {
    console.error("AI Assistant error:", err);
    res.status(500).json({ error: "AI Assistant failed" });
  }
};

export { handleChat };
