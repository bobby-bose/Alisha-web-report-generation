# Project Change Instructions

## Scope
Folders involved:
- PackagingList
- Performa
- Invoice
- SetC

Each folder contains `add.html`, `edit.html`, `view.html`, and report template HTML files (`*_start.html` or `start.html`).

---

## 1. Changes in `view.html` (All folders)

### 1.1 Button Alignment Above Table
- Locate the **Add** button in `view.html`.
- Move it **above the table**, aligned to the **right side**.
- Alignment must respect the **table width**, with slight right padding similar to Facebook UI spacing.
- Do **not** place it outside the table container.

### 1.2 Back Button
- Add a **Back** button on the **left side**, in the same container as the Add button.
- On click, it must **navigate to `main.html`**.
- It should not rely on browser history.

### 1.3 Page Heading
- Add a heading **above the buttons** with only the folder name:
  - `Packaging List`
  - `Performa`
  - `Invoice`
  - `Set C`
- Use **normal text**, camel case, with spaces.
- Remove any extra text like:
  - “View Records”
  - “View Data”
  - “List”

---

## 2. Table Data Ordering in `view.html`
- Ensure records are shown in **descending order**.
- Priority:
  - Last updated first
  - If no update field exists, last added first
- Newly added or edited records must always appear **at the top of the table**.

---

## 3. Report Template Fix (Item Number Column)

### Affected Files
- `PackagingList/packing_start.html`
- `Performa/*start.html`
- `SetC/*start.html`

### Issue
- The **Item Number** column in generated tables is empty.

### Fix
- Use a **loop counter** in the templating logic.
- Ensure item numbering renders as:
  - 1, 2, 3, ...
- Use the templating engine’s loop index (example: loop.index, forloop.counter, etc.).
- Confirm the counter is **explicitly printed in the cell**.

---

## 4. Template Usage (Confirmation)
- Continue using existing `*_start.html` templates.
- Replace placeholders using the current templating mechanism (no change in approach).
- Only ensure counters and data bindings are correct.

---

## Out of Scope
- No changes required in `add.html`
- No UI redesign beyond button alignment and heading cleanup
