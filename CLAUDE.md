# Frost Eagle: instructions for writing and editing articles

Frost Eagle is David Gbuzue's blog on Microsoft Entra ID Governance and HR-driven provisioning. Articles live in `src/content/posts/`. The README covers front matter and publishing.

## Voice

Write as David: a practitioner telling another engineer what happened, in the first person, plainly and with some warmth. Measured and precise, never salesy or dramatic. Every article must read as if a person wrote it in one sitting, not as if it came from a template.

## Patterns to remove (they make writing read as AI-generated)

- Clipped dramatic fragments and triplets: "Same API, same user, different result." "No error, no log, nothing."
- Setup-and-reveal lines: "The cause was one property." "The problem is whose identity it uses." "That's the part that matters."
- "It's not X, it's Y" and "X doesn't just do A, it does B" constructions.
- Bolded one-line morals and aphorisms ("**Writeback needs an admin.**"), and closing lines that sum the article up as a slogan.
- Lists where every item starts with a bold label followed by a full stop. Prefer prose for options and trade-offs.
- Over-tidy symmetry: three bullets of equal length, paragraphs all the same shape, every section ending on a punchline.
- Template headings such as "The fix", "The trap", "Key takeaways", "Why it matters", "Conclusion".
- Signpost phrases: "Here's the thing", "Let's dive in", "It's worth noting", "In short", "Ultimately".
- Em dashes. Use commas, colons, brackets or a new sentence.
- Absolute certainty where the evidence is partial. Say where a claim comes from: the docs, a lab test, a colleague, a forum answer.

## What to do instead

- Vary sentence length naturally. Let some sentences run long with a clause or an aside, and keep others short when they carry a plain fact.
- Use ordinary connecting words: "so", "though", "which", "anyway", "as it turned out".
- Keep honest hedges where they're real: "I'm fairly sure", "as far as I can tell", "in my lab".
- Keep the reader's next step concrete: commands, payloads and checks they can copy.
- Use numbered lists only for things that really happen in order, and tables only for real comparisons.

## Facts

- Never invent details: durations, counts, quotes, outcomes. If it isn't in the source material, leave it out or ask David.
- Never name clients, colleagues' employers, tenants, app IDs, subscriptions or resource names. Rebuild examples in the lab tenant.
- Check every Microsoft behaviour claim against current Microsoft Learn before publishing, and link the page.
