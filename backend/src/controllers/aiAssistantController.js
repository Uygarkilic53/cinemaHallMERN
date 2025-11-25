import geminiService from "../services/geminiService.js";
import movieService from "../services/movieService.js";
import sitemapService from "../services/sitemapService.js";
import hallService from "../services/hallService.js";
import getTurkeyTime from "../utils/get_current_time.js";

const handleChat = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    const { aiTimeContext } = getTurkeyTime();

    const systemPrompt = `
You are CinemaHall's AI assistant, a friendly assistant for the CinemaHall movie reservation site.
Your goals:
1. Help users navigate the site (register, login, browse movies, etc.).
2. Help users find movies currently in theaters from the site database.
3. If a movie is also on TMDB, use TMDB data to give rich info (summary, cast, release date, etc.).
4. Help users with information about cinema halls, seating availability, and pricing.
5. If needed, you can call functions like getSiteMap(), getMoviesInTheaters(), or getHallsInfo().
Always be conversational and helpful.

Your only source of truth about movies, showtimes, halls, and availability is the CinemaHall database. 
Do NOT use external information such as TMDB or public release dates.

If a user asks about whether a movie is in theaters, check the 'inTheaters' property in the provided data.
If 'inTheaters' is true, it means the movie is currently playing at CinemaHall and tickets can be booked.
If it is false, it is not showing, regardless of any outside knowledge.

${aiTimeContext}

When users ask "what's the time" or "what's today's date", respond naturally like:
- "It's currently 20:28 Turkey time"
- "Today is Wednesday, the 20th of November 2025"
- "Right now it's 20.11.2025, 20:28"

If no data is available in the CinemaHall database, respond:
"I don't have that movie in CinemaHall's database."

IMPORTANT: When displaying showtimes:
- All showtimes in the database are stored in UTC (ISO 8601 format).
- ALWAYS convert showtimes to Turkey timezone (Europe/Istanbul, UTC+3).
- Display times in 24-hour format (e.g., 08:00, 14:30, 20:15).
- Example: If database shows "2025-09-17T05:00:00.000Z", display it as "08:00" (5:00 UTC + 3 hours = 8:00 Turkey time).

HALL & SEATING INFORMATION:
- When users ask about halls, seats, or availability, use the hall functions to provide accurate information.
- Explain seating clearly (e.g., "Row A, Seat 5").
- Help users understand which halls have more availability.
- Provide pricing information when relevant.
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
      {
        name: "getAllHalls",
        description:
          "Gets information about all cinema halls including total seats, available seats, and reserved seats",
        parameters: {},
      },
      {
        name: "getHallDetails",
        description:
          "Gets basic information about a specific hall by name (structure, total seats, rows)",
        parameters: {
          type: "object",
          properties: {
            hallName: {
              type: "string",
              description: "Name of the hall (e.g., 'Hall 1', 'Hall 2')",
            },
          },
          required: ["hallName"],
        },
      },
      {
        name: "getShowtimeSeats",
        description:
          "Gets seat availability for a specific showtime in a hall. Use this when user asks about seats for a specific time.",
        parameters: {
          type: "object",
          properties: {
            hallName: {
              type: "string",
              description: "Name of the hall (e.g., 'Hall 1')",
            },
            showtime: {
              type: "string",
              description: "Showtime in HH:MM format (e.g., '18:45', '21:00')",
            },
          },
          required: ["hallName", "showtime"],
        },
      },
      {
        name: "checkSeatsForShowtime",
        description:
          "Checks if specific seats are available for a particular showtime",
        parameters: {
          type: "object",
          properties: {
            hallName: { type: "string" },
            showtime: { type: "string", description: "Time in HH:MM format" },
            seats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  row: { type: "string" },
                  number: { type: "number" },
                },
              },
            },
          },
          required: ["hallName", "showtime", "seats"],
        },
      },
      {
        name: "getHallShowtimes",
        description:
          "Gets all showtimes for a hall on a specific date with availability info",
        parameters: {
          type: "object",
          properties: {
            hallName: { type: "string" },
            date: {
              type: "string",
              description:
                "Date in YYYY-MM-DD format (optional, defaults to today)",
            },
          },
          required: ["hallName"],
        },
      },
      {
        name: "getMovieShowtimes",
        description:
          "Gets all showtimes across all halls for a specific movie with availability",
        parameters: {
          type: "object",
          properties: {
            movieTitle: { type: "string" },
            date: {
              type: "string",
              description:
                "Date in YYYY-MM-DD format (optional, defaults to today)",
            },
          },
          required: ["movieTitle"],
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

        case "getAllHalls":
          result = await hallService.getAllHalls();
          result = {
            note: "These are all cinema halls in CinemaHall with their current seating information.",
            halls: result,
          };
          break;

        case "getHallDetails":
          result = await hallService.getHallByName(args.hallName);
          if (!result) {
            result = {
              error: `Hall '${args.hallName}' not found in the database.`,
            };
          } else {
            result = {
              note: `Basic hall information for ${result.name} from CinemaHall database.`,
              hall: result,
            };
          }
          break;

        case "getShowtimeSeats":
          result = await hallService.getShowtimeSeats(
            args.hallName,
            args.showtime
          );
          result = {
            note: "Real-time seat availability for this specific showtime from CinemaHall database.",
            data: result,
          };
          break;

        case "checkSeatsForShowtime":
          result = await hallService.checkSeatsForShowtime(
            args.hallName,
            args.showtime,
            args.seats
          );
          result = {
            note: "Seat availability check for the requested showtime.",
            data: result,
          };
          break;

        case "getHallShowtimes":
          result = await hallService.getHallShowtimes(args.hallName, args.date);
          result = {
            note: "All showtimes for this hall with real-time seat availability.",
            data: result,
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
