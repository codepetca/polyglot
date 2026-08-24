# Unit 3 — knowledge points

What each lesson actually teaches, as a flat list. Taken from the owner's own
notes on each lesson, so this is the record of what is meant to be covered, not
a summary written after the fact.

Intended second use: student revision notes, so a lesson can be recalled without
replaying it.

---

## 3.1 Printing in Java

- `System.out.println("Hello World!");` is the command that prints.
- Capital S on `System`. Everything else lowercase.
- The message goes inside the brackets.
- Text goes inside double quotes. The quotes are not printed.
- A semicolon ends the command.
- Each `println` starts a new line. That is what the `ln` means.
- `print` does not start a new line.

## 3.2 Variables and Types

- A variable is a box that holds one value.
- Three parts: the **type**, the **name**, the **value**. `int level = 5;`
- **Declaring** makes the box: `int level;`
- **Initializing** makes it and fills it: `int level = 5;`
- **Assigning** changes the value, with no type: `level = 0;`
- The box is on the left of the `=`. The value is on the right.
- The four primitive types:
  - `int` — whole numbers, used to count. -2, -1, 0, 1, 2, 3.
  - `double` — numbers with decimals. 6.74, 2.5, 5.0.
  - `boolean` — only `true` or `false`.
  - `char` — a single character, in **single** quotes. `'A'`.
- `String` is **not** a primitive type. Capital S, double quotes.
- Naming rules:
  1. Must start with a letter, `$` or `_`.
  2. The rest can have letters, numbers or `_`.
  3. Names are case sensitive. `player` and `Player` are different boxes.
  4. Write names in lowerCamelCase: `playerLevel`.

## 3.3 User Input

- Four readers, one per type. The prompt is an **argument**, inside the brackets.
  - `String name = readLine("Name? ");`
  - `int age = readInt("Age? ");`
  - `double price = readDouble("Price? ");`
  - `boolean ready = readBoolean("Ready? ");`
- The reader **hands back a value**, which you store in a variable.
- The reader prints the question itself. You never print it separately.
- The type of the box must match the reader.

## 3.4 Arithmetic Expressions

- Five operators: `+` `-` `*` `/` `%`.
- `%` is the remainder. 12 % 5 is 2. `x % 2` is 0 for even, 1 for odd.
- Shortcuts, and the longer form each stands for:
  - `score++` is `score = score + 1`
  - `lives--` is `lives = lives - 1`
  - `score += 10` is `score = score + 10`
  - also `-=`, `*=`, `/=`
- Order of operations: brackets, then `* / %`, then `+ -`, left to right at the
  same level.
- **Integer division truncates.** `7 / 2` is 3, not 3.5. Java throws the
  decimal away rather than rounding.
- One `double` anywhere makes the result a double. `7.0 / 2` is 3.5.
- The trap: `double half = 7 / 2;` gives **3.0**. The division finished before
  the box ever saw it.

## 3.5 Casting

- A cast tells Java to treat a value as another type: `(double) a / 2`.
- `int` to `double` happens on its own, because nothing is lost.
- `double` to `int` needs a cast, because the decimal is thrown away.
- `(int)` **chops**. It never rounds. `(int) 5.9` is 5.
- To round: add 0.5 first, then cast. `(int) (rating + 0.5)`.
- The cast must reach the number **before** the division. `(double)(7 / 2)` is
  3.0, which is too late.
- An `int` is 32 bits, so it has a largest and smallest value:
  `Integer.MAX_VALUE` and `Integer.MIN_VALUE`.
- Going past the top wraps round to the bottom. This is **overflow**, and Java
  gives no warning.

## 3.6 Booleans

- A `boolean` holds `true` or `false` and nothing else.
- Lowercase, no quotes. `"true"` is a String, `True` is not the keyword.
- Change one like any other variable, with no type the second time.
- `readBoolean` reads one from the player.

## 3.7 Logical Operators

- Logical operators connect and modify boolean expressions.
- `!` reverses a boolean. `!true` is false.
- `||` is true when **at least one** side is true.
- `&&` is true only when **both** sides are true.
- Each has a truth table worth knowing by sight.

## 3.8 Comparison Operators

- Six of them: `==` `!=` `>` `<` `>=` `<=`.
- They turn two values into a boolean.
- `=` stores a value. `==` asks a question. This is the commonest slip.
- They work on **primitive types**: `int`, `double`, `char`, `boolean`.
- They do **not** compare the text of a String. That needs `.equals()`.

## 3.9 For Loops

- A `for` loop repeats a set number of times.
- Three parts: `for (init; test; increment)`
  1. The first part makes the counter and runs once. `int i = 0`
  2. The second is checked before every pass. `i < 5`
  3. The third runs after every pass. `i++`
- Starting at 0 and testing `< n` runs exactly n times.
- The counter is a variable, so the body can print it and get a different
  result each pass.
- The increment does not have to be `i++`. `i += 2` counts in twos.

## 3.10 While Loops

- A `while` loop repeats for as long as its condition stays true.
- Use it when the stopping point is not a count you know in advance.
- Two jobs are yours: set the variable up **before** the loop, and change it
  **inside** the loop.
- Forget to change it and you get an **infinite loop**. It runs forever and
  never reaches the code below it.
- `for` when you know the count. `while` when you do not.

## 3.11 If Statements

- The clause:
  ```
  if (boolean expression)
  {
      // code to execute if true
  }
  else
  {
      // code to execute if the boolean is false
  }
  ```
- And the `else if` clause, for the next thing to check:
  ```
  else if (boolean expression)
  {
  }
  ```
- Java stops at the **first** condition that is true, so the order of the tests
  is part of the answer.
- Exactly one block runs. Never both, never neither.
- A remainder makes a good condition: `if (n % 2 == 0)`.
- A semicolon straight after the brackets, `if (x);`, ends the if there and the
  block below always runs.

## 3.12 Loop-and-a-Half

- `while (true)` runs forever, with an `if` inside to `break` out when a
  condition is reached.
- `break` leaves the loop at once, skipping the rest of the body.
- The shape is **ask, check, act**: ask at the top, check in the middle and
  break, act at the bottom.
- Use it whenever the thing you test has to be read first — otherwise the
  question ends up written twice.
- A **sentinel** is the value that ends the loop. Say what it is in the prompt,
  and pick a value that cannot be real data.

## 3.13 Short-Circuit Evaluation

- `&&` stops at the first `false`. The right side is never evaluated.
- `||` stops at the first `true`. Same reason.
- This is not a speed trick. It is what stops the program crashing.
- The **guard goes on the left**: `(hits != 0) && (total / hits > 5)`.
- Put it on the right and the crash happens before the check.

## 3.14 De Morgan's Laws

- `!(A && B)` is the same as `!A || !B`.
- `!(A || B)` is the same as `!A && !B`.
- The `!` moves onto each part, and **the operator flips**. That is the part
  people forget.
- "Not both" means "at least one is missing". "Neither" means "not this and not
  that".

## 3.15 Strings

- A String is a **sequence of characters in double quotes**.
- A String is **not** a primitive type, unlike `int`, `double`, `char` and
  `boolean`.
- Capital S, because a String is an **object**. Objects come later in the course.
- **Concatenation** joins Strings with `+`. Nothing is added up; the characters
  are placed end to end.
- Spaces are yours to add: `a + " " + b`.
- A String can be joined to any other type, and the other value is turned into
  text.
- Comparing with `==` does **not** work, because a String is not a primitive.
- Use `.equals()`, which tests whether they hold the same characters.
- Briefly, the reason: every object is kept somewhere in memory. On objects `==`
  asks whether two names point at the **same place**. `.equals()` ignores where
  they are kept and compares the **characters**. Primitives have no place to
  compare, so `==` looks at the value itself, which is why it works on those.
