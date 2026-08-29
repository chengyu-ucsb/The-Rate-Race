# The Rate Race

A short browser game about warehouse work, algorithmic management, and the rate that always rises.

**Play it:** https://YOURUSERNAME.github.io/rate-race/

You play one condensed week as a picker at a fictional fulfillment center. A handheld scanner tells you what to pick, where it is, and how long you have. Between timed picking sessions, you make choices about pace, breaks, safety, and your life outside the warehouse. Three numbers follow you all week: your rate, your body, and the flags on your file. There are four ways the week can end, and choices about solidarity and helping others shade how each ending plays out. The game takes about 10 to 12 minutes and works well on phones.

## Why this exists

The Rate Race was built for COMM 3008 (Introduction to Organizational Communication) at the University of Cincinnati. It gives students a felt experience of concepts before the readings name them: Taylorist task measurement, output standards, workplace surveillance, and algorithmic management, in which software rather than a person directs, evaluates, and disciplines work. A debrief screen at the end connects the experience to course concepts and poses three discussion questions.

The game belongs to the news-game tradition and is inspired by ABC News Story Lab's "The Amazon Race" (2019) and the Financial Times' "Uber Game" (2017). It shares their premise and genre, not their code, text, or art.

## What is real and what is not

Everything in the game is fictional. The company, the characters, and every event are invented, and the game makes no claims about any real employer. The working conditions it depicts, including timed picks, ratcheting targets, time-off-task logging, automated write-ups, and leaderboards, are composites drawn from a decade of published journalism and research on warehouse work.

## Design notes

The game argues through its mechanics rather than through text:

- The target rises every time it is met. Even the best ending carries a higher target for Monday.
- The only voice of management the player ever hears is the scanner. Discipline arrives as auto-generated messages, and no person decides anything.
- Every choice has a real cost across the three stats, so there is no dominant strategy and different players reach different endings.
- The injury outcome is deterministic, not random. It always follows the second safety corner cut, modeling escalation under pressure rather than bad luck.
- Signing a coworker's petition carries no mechanical penalty, but players who sign may find their schedule quietly changed in the ending, with no way to know whether it was retaliation. The ambiguity is the argument.
- Helping a struggling new hire costs time on the hardest day. Knowledge moving sideways between workers is a theme, not a bonus.
- A step counter accumulates across the week through animated walking transitions, making the physical scale of the work visible.
- The debrief mirrors the player's own logged choices back to them, a quiet reminder that the game was tracking them too.

## For instructors

You are welcome to use or adapt this for teaching. A few practical notes:

- **Difficulty tuning.** Each day's picking session is configured by one line in the script, for example `pickRound({picks: 12, seconds: 4.2, target: 10, ...})`. Raise `seconds` to make a day easier, raise `target` to make it harder.
- **Course references.** The debrief cites chapters of Miller, *Organizational Communication: Approaches and Processes*. Swap those lines for your own text if needed.
- **Deployment.** The game is a single self-contained HTML file with no dependencies, no server, no accounts, and no data collection. Host it anywhere static files can live, or embed it in an LMS page with an iframe.

## Credits

- Concept and course design: Chengyu Fang, School of Communication, Film, and Media Studies, University of Cincinnati
- Built with assistance from Claude (Anthropic)
- Inspired by ABC News Story Lab's "The Amazon Race" and the Financial Times' "Uber Game"

## License

Text, design, and code are shared for educational use under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/): adapt freely for teaching with attribution, non-commercially, and share adaptations under the same terms.
