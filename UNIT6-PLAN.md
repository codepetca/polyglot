# Unit 6 — Data Structures: the rework plan

> **Status: done.** `5.1`–`5.12` and `5.14` are rewritten, compiler-verified and
> written into `prisma/flows.json`. `node scripts/flows.mjs audit` passes.
> Delivered shape, against the targets below: 12–15 steps per lesson, 4–5 typing
> steps each, zero `points[]`.

Internal codes `5.1`–`5.14`. Student-facing 6.1–6.14.

**Ethics is out.** `5.13` (Ethical Issues Around Data Collection) is not being
reworked. Everything else in the unit is: `5.1`–`5.12` and `5.14`.

## Targets, per lesson

Measured against the reworked Unit 5, which is the bar.

| | Old Unit 6 | Reworked Unit 5 | Target |
| --- | --- | --- | --- |
| Steps | 8–10 | 10–15 | **13–16** |
| Typing steps (`write`/`fix`/`workout`) | 1–2 | 2–7 | **4–6** |
| `points[]` stacks | 3–5 | 0 | **0** |

Typing lands early. The first `write` is step 3 or 4, before any second
explanation, so a student types the syntax the same screen they meet it.

## Rules I am holding myself to

1. Every lesson opens with a problem and an objective, ending in a question.
2. One idea per sentence. No colons or dashes extending a thought.
3. Name the thing: array, index, element, length, list, key, value.
4. No sentence that would not change what the student types.
5. A widget only where the content has the property that widget tests.
   `walk` in 6.3, 6.7 and 6.10 only. Those are the three places where the
   thing a beginner cannot picture is a moving index.
6. Vary the MCQ answer position. Currently 0:36 1:48 2:16 3:8 across the course,
   so Unit 6 leans on 2 and 3.

---

## 6.1 (5.1) What are Data Structures?

**Open:** We are tracking the hp of four monsters. Four variables works. Twenty
does not. How do we hold many values in one variable?

| # | Kind | What happens |
| --- | --- | --- |
| 1 | teach | Four `int` variables for four monsters. Twenty needs twenty names. |
| 2 | teach | One array holds all four. `int[] hp = {12, 30, 8, 45};` and `hp.length` prints 4. |
| 3 | **write** | Type an array of your own four scores. Print how many there are. |
| 4 | teach | An element is one value in the structure. An index is its position. |
| 5 | predict | `hp[0]` — which value comes out? |
| 6 | teach | `facts` table: the four structures. Name, holds, size, how you reach an item. |
| 7 | match | Structure to job. |
| 8 | bucket | Fixed size, or grows. |
| 9 | teach | A HashMap reaches a value by name, not by number. Short worked example. |
| 10 | predict | Which structure survives a list that grows? |
| 11 | **write** | Hold three names in one variable. Print the middle one. |
| 12 | fill | Choose the structure for each of three jobs. |
| 13 | **write** | Final: four scores in one variable, print how many there are. |

## 6.2 (5.2) Introduction to Arrays

**Open:** An array holds many values under one name. How do we make one and
reach a single value inside it?

| # | Kind | What happens |
| --- | --- | --- |
| 1 | teach | `int[] hp = {12, 30, 8};` One name, three slots. |
| 2 | teach | `annotate` the declaration: `int[]`, `hp`, `{12, 30, 8}`. |
| 3 | **write** | Declare an array of three ints. Print the first one. |
| 4 | teach | Indexes start at 0. `facts` table index to value. Output shown. |
| 5 | predict | What does `hp[1]` print? |
| 6 | teach | `new int[5]` makes five slots. Every int slot starts at 0. |
| 7 | compare | Literal against `new`. Both outputs compiler-checked. |
| 8 | **write** | Make an array of five ints with `new`. Print one slot. |
| 9 | teach | Assign into a slot: `hp[0] = 99;`. |
| 10 | **fix** | An assignment written to the wrong index. |
| 11 | teach | `.length` is a field, not a method. The last index is `length - 1`. |
| 12 | fill | Set the last slot without counting by hand. |
| 13 | trace | Three checkpoints on one array as it is changed. |
| 14 | **write** | Final: swap in a new first monster and report the size. |

## 6.3 (5.3) Using Arrays

**Open:** Printing three elements by hand is fine. Twenty is not. How do we
visit every element of an array?

Steps: the by-hand version; the standard `for` header; **`walk`** stepping the
index across a four-element array; write a loop that prints every element;
`ArrayIndexOutOfBoundsException` when the condition is `<=`; fix that bug;
arrays of objects (`String[]`, `Monster[]`); aliasing, where two names point at
one array and a change through one shows through the other; predict on
aliasing; final: find the strongest monster in the party.

## 6.4 (5.4) Enhanced For Loops

**Open:** Most loops use `i` for nothing except `hp[i]`. How do we walk an array
without a counter?

Steps: the counter loop we already have; `for (int h : hp)` beside it as a
`compare`; write one; the loop variable is a copy, so assigning to it does not
change the array (compiler-checked both ways); bucket on which loop each job
needs; the two cases the enhanced loop cannot do — needing the index, and
changing elements; final: count the party members still standing.

## 6.5 (5.5) ArrayList Methods

**Open:** We do not know how much loot the player will find. How do we hold a
list that grows and shrinks?

Steps: an array of 3 cannot take a 4th; `ArrayList<String> loot = new
ArrayList<String>();`; `add` and `size`; write; `facts` table of the five
methods with return types; `get`; `set`; `remove` and what it returns; fix a
`get` off the end; enhanced for over a list; predict; final: collect loot, drop
one, report what is left.

## 6.6 (5.6) Arrays vs ArrayLists

**Open:** There are now two ways to hold many values. Which one do you pick?

Steps: `facts` table, array against ArrayList, line for line — size, `.length`
against `.size()`, `[]` against `.get()`, what types each takes; the
`ArrayList<int>` error and `ArrayList<Integer>` instead; fix it; bucket by job;
an ArrayList is backed by an array, and grows by copying into a bigger one;
predict; final: pick the right one for the job and total it.

## 6.7 (5.7) Additional Loop Examples

**Open:** Removing an item while looping forwards skips the next one. How do we
take items out of a list safely?

Steps: the indexed loop `for (int i = 0; i < list.size(); i++)`; write one;
remove shifts everything after it down one place, shown with output;
**`walk`** through the skipping bug frame by frame; fix it by looping
backwards; the same fixed both ways; final: drop every fallen member and count
the survivors.

## 6.8 (5.8) The List Interface

**Open:** A method that totals a list should not care which kind of list it was
given. How do we accept any of them?

Steps: recall `interface` from 5.17; `List<String> x = new ArrayList<String>();`
with `annotate` on the two type names; what you may and may not call through a
`List` variable; write; `List` as a parameter type; fix a method that demands
`ArrayList`; final: a method that totals any list of numbers.

## 6.9 (5.9) 2D Arrays (Matrices or Grids)

**Open:** A dungeon map has rows and columns. How do we hold a grid instead of
a line?

Steps: a 1D array cannot say "row 2, column 1"; `int[][] grid = {{1,2},{3,4}};`;
`grid[row][col]`, row first; write a read; `new int[3][4]`; `grid.length` is
rows and `grid[0].length` is columns, shown with output; fill; a 2D array is an
array of arrays, so `grid[0]` is itself an array; predict; final: build a 2x2
map and read one square.

## 6.10 (5.10) Traversing 2D Arrays

**Open:** Printing a whole map means visiting every square. How do we loop over
rows and columns together?

Steps: the nested `for`; **`walk`** through a 2x3 grid, naming every `r` and `c`
pair in order; write a printer; `grid[r].length` for the current row; the two
headers swapped, and the different order that produces; fix; nested enhanced for
with `int[] row`; final: total every number in the grid.

## 6.11 (5.11) HashMaps

**Open:** Two lists that must stay lined up break the moment one changes. How do
we look a value up by name?

Steps: the two parallel lists going wrong; `HashMap<String, Integer>`; key and
value named; `put`, `get`, `size`; write; `facts` table with return types;
`get` on a missing key returns `null`; `containsKey` and `getOrDefault`; fix a
`NullPointerException`; `keySet` with an enhanced for, **and its order checked
against the real compiler, not assumed**; predict; final: print Ben's score, or
0 if he has none.

## 6.12 (5.12) Binary

**Open:** A wire is on or off, which gives two symbols. How does a computer get
the number 13 out of that?

Steps: base ten place values, then base two; `facts` table of 1 2 4 8 16 32;
read `1101` by hand; fill; write a program that adds the place values; `%` and
`/` by 2 to pull the bits out; fix; final: print the value of binary `10011`.

## 6.14 (5.14) Data Structures Quiz

Six graded checks, one per structure, in the unit's order: index from zero,
`.length` against `.size()`, enhanced-for copying, remove-while-looping,
`grid[row][col]`, `get` on a missing key. Then two typing tasks, ending on
counting how many different words a sentence has.

---

## What I am not doing

- `5.13` Ethical Issues. Left exactly as it is, `points[]` and all.
- Renumbering. `5.13` stays where it is so no URL or database key moves.

---

## What shipped

| Internal | Student | Steps | Typing steps | Widget that earned its place |
| --- | --- | --- | --- | --- |
| 5.1 | 6.1 | 15 | 4 | |
| 5.2 | 6.2 | 15 | 5 | `annotate` on the declaration |
| 5.3 | 6.3 | 14 | 4 | **`walk`** — the index crossing the array |
| 5.4 | 6.4 | 13 | 4 | `compare` — counter loop against enhanced for |
| 5.5 | 6.5 | 14 | 5 | `facts` — the six methods with return types |
| 5.6 | 6.6 | 14 | 5 | `facts` — array against ArrayList, job for job |
| 5.7 | 6.7 | 15 | 5 | **`walk`** — the item that slips past `i` |
| 5.8 | 6.8 | 12 | 4 | |
| 5.9 | 6.9 | 14 | 5 | `facts` — the grid with its indexes written in |
| 5.10 | 6.10 | 14 | 5 | **`walk`** — `c` resetting every time `r` moves |
| 5.11 | 6.11 | 14 | 5 | `facts` — the seven methods with return types |
| 5.12 | 6.12 | 14 | 5 | `facts` — place values across three bases |
| 5.14 | 6.14 | 12 | 4 | |

Three `walk` steps, in the three places where the thing a beginner cannot
picture is a moving index. Nowhere else.

## One thing the compiler caught

`5.11` claimed a `keySet()` order before it was checked. Put `Ada`, `Ben` and
`Mia` into a `HashMap` and the real iteration order is **`Mia`, `Ben`, `Ada`** —
not insertion order, and not alphabetical. The lesson now shows that verified
output and says outright that a HashMap has no order you may rely on. Every
graded HashMap exercise in the unit has an order-independent answer, so a
student can never lose a mark to iteration order.
