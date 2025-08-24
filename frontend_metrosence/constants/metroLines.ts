// constants/metroLines.ts

export type MetroLineVariant =
  | "line1"
  | "line2"
  | "line3"
  | "line4"
  | "line4a"
  | "line5"
  | "line6";

export const LINE_STYLES: Record<
  MetroLineVariant,
  { bg: string; text: string }
> = {
  line1:  { bg: "bg-metro-line1",  text: "text-white" },
  line2:  { bg: "bg-metro-line2",  text: "text-black" },
  line3:  { bg: "bg-metro-line3",  text: "text-white" },
  line4:  { bg: "bg-metro-line4",  text: "text-white" },
  line4a: { bg: "bg-metro-line4a", text: "text-white" },
  line5:  { bg: "bg-metro-line5",  text: "text-white" },
  line6:  { bg: "bg-metro-line6",  text: "text-white" },
};
