# The Rate Race

A classroom game about classical management. Design a fictional fulfillment operation, work through five shifts, and examine what your decisions change.

**[Play the game](https://chengyu-ucsb.github.io/The-Rate-Race/)** · **[Instructor guide](docs/instructor-guide.md)** · **[Original game](https://chengyu-ucsb.github.io/The-Rate-Race/classic.html)**

Built for COMM 3008, Introduction to Organizational Communication, at the University of Cincinnati.

## How it works

Each shift introduces another part of the organization. Choose a policy, process six orders, and review the consequences before the next shift.

On the floor, match an order's exact stock code (SKU) to a product on a nine-bin shelf, choose the quantity, and build the parcel. Similar products carry different codes. A mailer holds one or two nonfragile items; fragile goods and three-item orders need a box. Inspection is a deliberate choice on every order and uses simulated time to catch and correct mistakes.

Illustrated products and crew, a parcel preview, a warehouse flow display, and dispatch feedback show the work as it happens. A weekly chart separates good orders delivered on time, good but late orders, and defective shipments.

| Shift | Decisions | Course connection |
| --- | --- | --- |
| 1. The work method | Method and training | Taylor: work study, standardization, and the division between planning and execution |
| 2. The production line | Division of labor and staff assignments | Fayol: specialization and coordination |
| 3. Authority and rules | Communication routes and formal procedures | Fayol's scalar chain and authorized lateral contact; Weber's rational-legal authority |
| 4. The pay system | Time-based pay, stable piece rates, or a moving target | Incentives, rate-busting, and systematic soldiering |
| 5. A changed demand | Respond to work that challenges the established system | The limits of predictability and standardization |

The first shift uses distinct products and single-item orders. Later shifts add look-alike variants, larger quantities, and more complicated exceptions. The game measures simulated work time, not how quickly students move a mouse. Reports connect decisions to quality, timeliness, modeled fatigue, trust, and pay. A controlled replay after each shift lets students change one policy while keeping the same orders and decisions; the final debrief includes this comparison for the last shift.

The model is designed for discussion. Its numerical relationships are transparent teaching assumptions, not estimates of real workplaces. There is no single score that establishes the best organization.

## Use in a course

Plan for roughly 15–20 minutes of individual exploration, or 25–35 minutes including a class debrief. These are planning estimates; preview the game before assigning it.

Students can copy or print their result and respond to reflection prompts in Canvas or another LMS. The game does not submit grades or collect assignment responses. The [instructor guide](docs/instructor-guide.md) includes a suggested activity and a short written reflection.

Share/resume links contain a snapshot of the run in the URL fragment. Opening that link on another device restores that snapshot. Changes made afterward require a new link; this is not a live shared session. The game has no accounts or application backend.

Previously saved model-2 links still open with their direct-bin tasks. New runs use the expanded shelf, quantity, and packaging mechanics.

## Development

No build step or third-party package installation is required. Serve the repository with a static web server:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000`. Run the model tests with Node.js:

```sh
node --test
```

GitHub Pages serves the public game from this repository. The earlier warehouse game remains available at `classic.html`.

## Sources

The redesign draws primarily on Katherine Miller's *Organizational Communication: Approaches and Processes* (7th ed., 2015), chapter 2, and Chengyu Fang's COMM 3008 classical approaches lectures and handout. See the instructor guide for specific page references and the historical digital Taylorism readings. The copyrighted course readings are not redistributed here.

## Credits

- Concept and course design: Chengyu Fang, School of Communication, Film, and Media Studies, University of Cincinnati.
- Original game built with assistance from Claude (Anthropic).
- Classical management redesign developed with assistance from ChatGPT (OpenAI).
- Original news-game inspirations: ABC News Story Lab's *The Amazon Race* (2019) and the Financial Times' *Uber Game* (2017). The game shares their genre, not their code, text, or art.

## License

Text, design, and code are shared for educational use under [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/). Adapt for noncommercial teaching with attribution and share adaptations under the same terms.


### Typefaces

The site bundles [Manrope](https://github.com/google/fonts/tree/main/ofl/manrope) for reading and controls, and [Space Grotesk](https://github.com/google/fonts/tree/main/ofl/spacegrotesk) for headings. The fonts load from this repository and retain their own SIL Open Font License: [Manrope](assets/fonts/Manrope-OFL.txt) and [Space Grotesk](assets/fonts/Space-Grotesk-OFL.txt). These font licenses are separate from the game’s license above.
