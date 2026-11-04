import { useEffect, useState } from "react";
import { Box, ButtonBase, Slide, Stack } from "@mui/material";

// The kitchen Pi's own on-screen keyboard can't show over Chromium's fullscreen kiosk window,
// so the site brings its own. Only the kitchen screen asks for it (?keyboard in its URL).
export const keyboardEnabled = () => new URLSearchParams(window.location.search).has("keyboard");

const TEXT_TYPES = ["text", "search", "email", "url", "tel"];

type Field = HTMLInputElement | HTMLTextAreaElement;

const isTextField = (el: EventTarget | null): el is Field =>
  (el instanceof HTMLInputElement && TEXT_TYPES.includes(el.getAttribute("type") ?? "") && !el.readOnly)
  || (el instanceof HTMLTextAreaElement && !el.readOnly);

// Change the field the way typing would, so React's onChange sees it
const edit = (field: Field, change: (value: string, start: number, end: number) => [string, number]) => {
  const start = field.selectionStart ?? field.value.length;
  const end = field.selectionEnd ?? start;
  const [value, caret] = change(field.value, start, end);
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(field, value);
  try {
    field.setSelectionRange(caret, caret);
  } catch {
    // Some input types don't have a caret; the end is fine
  }
  field.dispatchEvent(new Event("input", { bubbles: true }));
};

const type = (field: Field, text: string) =>
  edit(field, (value, start, end) => [value.slice(0, start) + text + value.slice(end), start + text.length]);

const backspace = (field: Field) =>
  edit(field, (value, start, end) => start !== end
    ? [value.slice(0, start) + value.slice(end), start]
    : [value.slice(0, Math.max(0, start - 1)) + value.slice(start), Math.max(0, start - 1)]);

const LETTERS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const SYMBOLS = ["1234567890", "-/:;()&@'\"", ".,?!#%+"];

type Key = { label: string; action: "char" | "shift" | "backspace" | "symbols" | "space" | "done"; char?: string; grow?: number };

const rows = (symbols: boolean, shift: boolean): Key[][] => {
  const [top, middle, bottom] = (symbols ? SYMBOLS : LETTERS).map(row =>
    row.split("").map(c => {
      const char = shift && !symbols ? c.toUpperCase() : c;
      return { label: char, action: "char" as const, char };
    }));
  return [
    top,
    middle,
    [
      symbols ? { label: "", action: "char", char: "", grow: 1.5 } : { label: "⇧", action: "shift", grow: 1.5 },
      ...bottom,
      { label: "⌫", action: "backspace", grow: 1.5 },
    ],
    [
      { label: symbols ? "ABC" : "123", action: "symbols", grow: 1.5 },
      { label: "space", action: "space", grow: 6 },
      { label: "Done", action: "done", grow: 1.5 },
    ],
  ];
};

// Docked along the bottom of the screen while a text box has focus
export const OnScreenKeyboard = () => {
  const [field, setField] = useState<Field | null>(null);
  const [shift, setShift] = useState(false);
  const [symbols, setSymbols] = useState(false);

  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      if (isTextField(e.target)) {
        setField(e.target);
        const target = e.target;
        // Once the keyboard is up, keep the box being typed in above it
        window.setTimeout(() => target.scrollIntoView({ block: "nearest" }), 250);
      }
    };
    const onFocusOut = (e: FocusEvent) => {
      if (!isTextField(e.relatedTarget)) {
        setField(null);
      }
    };
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  const press = (key: Key) => {
    if (!field) {
      return;
    }
    switch (key.action) {
      case "char":
        if (key.char) {
          type(field, key.char);
          setShift(false);
        }
        break;
      case "space":
        type(field, " ");
        break;
      case "backspace":
        backspace(field);
        break;
      case "shift":
        setShift(s => !s);
        break;
      case "symbols":
        setSymbols(s => !s);
        break;
      case "done":
        field.blur();
        break;
    }
  };

  return (
    <Slide direction="up" in={field !== null} mountOnEnter unmountOnExit>
      <Box
        // Keep focus in the text box while keys are pressed
        onPointerDown={e => e.preventDefault()}
        onMouseDown={e => e.preventDefault()}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          // Over recipes, the recipe browser and the now-playing card
          zIndex: 1400,
          p: 1,
          bgcolor: "#d9d6d3",
          boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.2)",
          touchAction: "manipulation",
          userSelect: "none",
        }}
      >
        <Stack spacing={1} sx={{ maxWidth: 1000, mx: "auto" }}>
          {rows(symbols, shift).map((row, i) => (
            <Stack direction="row" spacing={1} justifyContent="center" key={i}>
              {row.map((key, j) => (
                <ButtonBase
                  key={j}
                  onClick={() => press(key)}
                  disabled={key.action === "char" && !key.char}
                  aria-label={key.action === "char" ? key.char : key.label}
                  sx={{
                    flex: key.grow ?? 1,
                    maxWidth: key.grow ? undefined : 88,
                    height: 60,
                    borderRadius: 1.5,
                    fontSize: key.action === "char" ? "1.6rem" : "1.15rem",
                    color: "#222",
                    bgcolor: key.action === "char" || key.action === "space"
                      ? "#fff"
                      : key.action === "done" || (key.action === "shift" && shift) ? "secondary.main" : "#b9b5b1",
                    ...(key.action === "done" || (key.action === "shift" && shift) ? { color: "secondary.contrastText" } : {}),
                    boxShadow: "0 1px 0 rgba(0, 0, 0, 0.25)",
                    visibility: key.action === "char" && !key.char ? "hidden" : "visible",
                    "&:active": { filter: "brightness(0.85)" },
                  }}
                >
                  {key.label}
                </ButtonBase>
              ))}
            </Stack>
          ))}
        </Stack>
      </Box>
    </Slide>
  );
};
