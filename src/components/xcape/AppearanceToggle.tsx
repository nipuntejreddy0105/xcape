import { useTheme, type Theme } from "@/lib/theme";
import { useSaveProfile } from "@/lib/profile";
import { Segmented } from "./ui";

export function AppearanceToggle() {
  const { theme, setTheme } = useTheme();
  const save = useSaveProfile();
  return (
    <Segmented<Theme> label="Appearance" value={theme} onChange={(t) => { setTheme(t); void save({ theme: t }); }}
      options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
  );
}
