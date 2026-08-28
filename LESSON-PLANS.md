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

---

# Lesson openings and final projects

Proposed for review. Every opening states a **problem** and an **objective**, in complete sentences, ending in a question — the shape of 3.1: *"We are building a game title screen. How do we print something on it?"*

`story` opens on a scene. `technical` opens on the failing case, for lessons that are reminders rather than adventures. `quiz` is a unit review.

Units 3's fifteen lessons are already rebuilt to this shape and are not listed.


## Unit 4 — Methods

| # | Lesson | Mode | Opening | Final project |
| --- | --- | --- | --- | --- |
| 4.1 | Java Methods | story | We are printing the same divider above every dungeon room. How do we write it once and use it everywhere? | Write a gameOver() method and call it twice. |
| 4.2 | Methods and Parameters | story | Every room needs the same sentence with a different name in it. How do we tell a method what to work with? | One enter(String room) method that announces any room. |
| 4.3 | Methods and Return Values | story | A method can print damage. How do we get the number back so we can add it to a total? | Write damage(int hits) and add two attacks together. |
| 4.4 | Javadocs and More Methods | story | In a month you will not remember what damage(4) meant. How do we write down what a method needs and gives back? | Write inRange with a full Javadoc above it. |
| 4.5 | Strings Methods | story | The player typed their name. How do we get its initial and its length? | Write yell, which shouts any text back in capitals. |
| 4.6 | Strings and Characters | story | We can pull one letter out of a name. How do we visit every letter in turn? | Check whether a String is made only of digits. |
| 4.7 | Exceptions | technical | This program compiles and still goes wrong. What kinds of error can Java have, and which ones does it tell you about? | Hunt two bugs that both stop it compiling. |
| 4.8 | String Processing | technical | We can look at each letter of a String. How do we build a new String out of them? | Finding Palindromes: does it read the same backwards? |
| 4.9 | Methods Quiz | quiz | Nothing new. Seven checks across the whole unit. | Count the capital letters in a name. |

## Unit 5 — Classes and OOP

| # | Lesson | Mode | Opening | Final project |
| --- | --- | --- | --- | --- |
| 5.1 | Introduction to Classes and Objects | story | Two monsters already need four separate variables. How do we keep one creature's facts together? | Make two monsters, roar both, print their combined hp. |
| 5.2 | Classes vs. Objects | story | We built two monsters from one Monster. How is the blueprint different from the thing built from it? | Hit one of two monsters and show the other is untouched. |
| 5.3 | Using a Class as a Client | technical | You have used Monster without ever seeing its code. What do you actually need in order to use a class? | Use a documented class with its methods only. |
| 5.4 | Writing Classes | story | You have used other people's classes for three lessons. How do we write one of our own? | Write the Potion class the client code needs. |
| 5.5 | Writing Classes and Instance Methods | technical | A Potion can be printed and does nothing else. How do we give an object something to do? | Give Potion a drink() and an isStrong(). |
| 5.6 | Getter and Setter Methods | technical | The fields are private, so the client cannot read them. How do we let it look without letting it break anything? | Getters and a guarded setter for Potion. |
| 5.7 | Class Methods and Class Variables | technical | How many potions have been brewed? No single potion knows. Where does a fact about all of them live? | Count how many Potions get brewed. |
| 5.8 | Wrapper Classes | technical | An int is not an object, and some parts of Java only take objects. How do we get an object version of a number? | Add two numbers that arrived as text. |
| 5.9 | Method Overloading | technical | Most potions are standard strength and a few are not. How do we let one method be called two ways? | Overload attack so it works with or without a weapon. |
| 5.10 | Local Variables and Scope | technical | A variable made inside a loop is gone once the loop ends. Where exactly does a variable exist? | Count the treasure across a whole loop. |
| 5.11 | Key Terms for Classes | technical | A constructor parameter and the field it fills often share a name. How does Java tell them apart? | A constructor whose parameters shadow both fields. |
| 5.12 | Objects vs Primitives | technical | Two identical potions, and == says they are different. Why do objects compare differently from numbers? | Compare two potions correctly. |
| 5.13 | Inheritance | story | A Boss is a Monster with one extra thing. How do we reuse everything Monster already has? | Write a Healer that IS A Hero. |
| 5.14 | Class Design and Abstract Classes | story | Nobody ever builds a plain Monster, only a Boss or a Slime. How do we stop the meaningless one being built at all? | Make Item abstract and give Sword its own use(). |
| 5.15 | Polymorphism | story | A fight scene should work for every kind of monster. How do we write one method that handles all of them? | One method that describes any Monster. |
| 5.16 | Object Superclass | story | println(potion) printed something before anyone wrote toString. Where did that come from? | Give Coin a toString and an equals. |
| 5.17 | Interfaces | technical | A Chest and a Door both open, and they share no parent. How do we say two unrelated classes can both do the same thing? | An interface that two unrelated classes both keep. |
| 5.18 | Classes and OOP Quiz | quiz | Nothing new. Seven checks across the whole unit. | Give Dog its own speak(). |

## Unit 6 — Data Structures

| # | Lesson | Mode | Opening | Final project |
| --- | --- | --- | --- | --- |
| 6.1 | What are Data Structures? | story | Twenty monsters would need twenty variables. How do we hold many values in one place? | Put four scores in one variable and print how many there are. |
| 6.2 | Introduction to Arrays | technical | We need many values under one name. How do we make one and reach a single item? | Swap in a new first monster and report the size. |
| 6.3 | Using Arrays | technical | Adding three items by hand is fine, twenty is not. How do we visit every item in an array? | Find the strongest monster in the party. |
| 6.4 | Enhanced For Loops | technical | Most loops use i for nothing except hp[i]. How do we walk an array without a counter? | Count the party members still standing. |
| 6.5 | ArrayList Methods | story | You do not know how much loot the player will find. How do we hold a list that grows and shrinks? | Collect loot, drop one, report what is left. |
| 6.6 | Arrays vs ArrayLists | technical | Now there are two ways to hold many values. Which one should you pick? | Pick the right one for the job and total it. |
| 6.7 | Additional Loop Examples | technical | Removing an item while looping forwards skips the next one. How do we take items out safely? | Drop every fallen member and count the survivors. |
| 6.8 | The List Interface | technical | A method that totals a list should not care which kind of list it is. How do we accept any of them? | A method that totals any list of numbers. |
| 6.9 | 2D Arrays (Matrices or Grids) | story | A dungeon map has rows and columns. How do we hold a grid instead of a line? | Build a 2x2 map and read one square. |
| 6.10 | Traversing 2D Arrays | technical | Printing a whole map means visiting every square. How do we loop over rows and columns together? | Total every number in the grid. |
| 6.11 | HashMaps | story | Two lists that have to stay lined up break the moment one changes. How do we look a value up by name? | Print Ben's score, or 0 if he has none. |
| 6.12 | Binary | technical | A wire is either on or off, which is two symbols. How does a computer get the number 13 out of that? | Print the value of binary 10011. |
| 6.13 | Ethical Issues Around Data Collection | story | A step counter needs your steps and takes your location too. When is collecting data fair? | Write which change you would require before it ships. |
| 6.14 | Data Structures Quiz | quiz | Nothing new. Six checks across the whole unit. | Print how many different words there are. |

## Where I disagree with the classification

You said the class chapter is technical apart from class design, polymorphism
and object superclass. I have followed that, with four exceptions I want to
argue for. Overrule me and I will change them.

- **5.1 Introduction to Classes and Objects** — story. This is the screen where
  a student either gets objects or does not. "Two monsters already need four
  separate variables" is the whole motivation for the rest of the unit.
- **5.2 Classes vs. Objects** — story. Same reason. The blueprint against the
  thing built from it is the idea, and it needs something concrete.
- **5.4 Writing Classes** — story. It is the payoff of the three lessons before
  it: you have used other people's classes, now write one.
- **5.13 Inheritance** — story, which you already agreed with by implication.

And two the other way, where a story would be padding:

- **5.3 Using a Class as a Client** — technical. The point is the documentation,
  not a scene.
- **5.17 Interfaces** — technical, though the Chest and Door do the work of a
  story without needing one built around them.

---

# Unit 5 — the cast

Five classes carry the whole unit. They are introduced as things to *use*
(5.1–5.3), then taken apart and rebuilt (5.4 onward), so a student meets each
one twice: first as a client, later as its author.

Chosen so the later lessons have somewhere to go, not just to fill the early
ones.

| Class | State | Behaviour | Earns its place because |
| --- | --- | --- | --- |
| `Player` | name, level, hp | `takeDamage`, `heal`, `levelUp`, `isAlive`, getters | The main worked example. Mutable state makes getters and setters obvious in 5.6. |
| `Monster` | name, hp, power | `attack`, `takeDamage`, `isAlive`, getters | Becomes the parent in 5.13. `Boss extends Monster` and `Slime extends Monster` are the inheritance, abstract and polymorphism examples. |
| `Weapon` | name, damage | `getName`, `getDamage` | A `Player` HAS A `Weapon`. That is the HAS-A against IS-A contrast in 5.13, with a real object rather than a sentence. |
| `Room` | width, height | `getArea`, `getPerimeter` | Our Rectangle. Two numbers in, a computed answer out, so a method that returns something has an obvious job in 5.5. |
| `Randomizer` | none — all static | `nextInt(low, high)`, `nextBoolean()`, `nextDouble(low, high)` | Deliberately identical to the CodeHS Randomizer, so a student reading CodeHS alongside polyglot sees the same method names. Introduced in 5.7 as the example of a class you never instantiate. Only ever used in `run` steps, since random output cannot be checked against a fixed target. |
| `Chest` | gold, locked | `isLocked`, `unlock`, `open`, `getGold` | Written by someone else on purpose: the client example in 5.3. Deterministic, because a class that rolls dice cannot have its output checked, and a Dice that always returns the same number would be a lie told to make the tests pass. |

Rules for using them:

- A student never sees the source of a class until the lesson that writes it.
  5.3 is about reading documentation, so the implementation is hidden and only
  the docs are on screen.
- Class names are capitalised, instance names are lowercase, every time. 5.2
  tests exactly that.
- Game framing, but the shapes are the CodeHS shapes. `Room` is Rectangle;
  `Player` is their Student.
