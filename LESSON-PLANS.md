# Lesson plans from the owner

The owner's own designs, kept verbatim in intent. These are the reference for
how a lesson should be shaped — read alongside the House style section of
`LESSON-AUTHORING.md`. When a plan here disagrees with anything else in the
repo, the plan wins.

The shape every lesson follows: **ask, teach, tie back.** Open with the goal as
a question. Teach only what answers it. End by making the student build the
thing from the opening.

---

## 3.1 Printing in Java

1. "We're building a game's title screen." — the opening.
2. "How do we actually print something onto the screen?"
3. "To print a message, we use this command: `System.out.println("Hello World!");`"
   Highlight that command and nothing else.
4. Zoom into the single command: the capital S, the brackets, the quotation
   marks, the semicolon. Interactive, pointing each part out. No animation —
   animation wastes the student's time.
5. "Each println starts a new line." Nothing more than that about `ln`.
6. "Using print instead of println doesn't skip a line." The side-by-side
   comparison does the teaching.
7. Questions, with one-line instructions.
8. Tie back: the student builds the title screen from step 1.

Cut from the original: the blank-line screen, the "last line is different"
screen (it pre-empts user input, taught later), the screen repeating
print vs println, and "tap the lines in order".

---

## 3.2 Variables and Types

1. "We're building a player card."
2. "We need to store the values somewhere."
3. "We use variables, which are like boxes holding values."
   That is the whole first page.

Then **int first**, not String. This is the order the CodeHS video uses, and it
covers the three things that matter:

- **Declaring** — `int level;` — includes the type.
- **Initializing** — `int level = 5;` — creating a variable and setting its
  initial value.
- **Assigning** — `level = 0;` — changing the value, no type.

Add a quiz here on assigning. The left side is the variable (the box) and the
right side is the value. This is hard for a new student.

Then the **four primitive types**, one short slide and one short player-card
example each. Label the section "primitive type" so it registers. Not String —
String is not primitive, and that is a key point of this lesson.

- `int` — (-2, -1, 0, 1, 2, 3…) whole numbers, used to count.
- `double` — (6.74, 363.3111, 5.0) numbers with decimals.
- `boolean` — true / false.
- `char` — a single character ('A', 'B'). Single quotes.

Then a checkpoint testing understanding and common mistakes.

Then **String**: not a primitive type, double quotes, capital S. Quiz on it.

(CodeHS then covers the `final` keyword. Leave it for later, with the other
keywords.)

Then **naming conventions**, as CodeHS teaches them:
- Must start with a letter, `$` or `_`.
- The rest can have letters, numbers or `_`.
- Names are case sensitive.
- Convention is lowerCamelCase.
- Show bad examples (a space, starting with a number, not descriptive) and good
  ones.

That is all the technical content.

Then **build the player card**, guiding the student step by step, focused on
assigning values, telling the types apart, and printing them.

Finally a **fun activity**: the student fills in the variables

```
String  ____ =
int     ____ =
double  ____ =
boolean ____ =
char    ____ =
```

and we produce a card for them, like a Pokemon card. This familiarises them
with the shape of a variable.
